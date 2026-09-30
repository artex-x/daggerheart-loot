/* The real `CloudPort`: Supabase Auth and the account's rows through
 * supabase-js.
 *
 * The only module that imports `@supabase/supabase-js` (ESLint enforces it);
 * `main.ts` loads it as a lazy chunk after first paint, and only in a build
 * with the two `VITE_SUPABASE_*` values (docs/DECISIONS.md, "The account
 * client loads after first paint"). The provider redirect is read before
 * mount by `redirect.ts`, so supabase-js's own URL detection is off - it
 * would race the router. docs/specs/FEATURES.md, "Account". */

import {
  createClient,
  REALTIME_SUBSCRIBE_STATES,
  type User,
  type UserIdentity
} from '@supabase/supabase-js';
import { entryOrder, type ListRow, type SharedRow, type ShareRow } from '../lib/cloudLists.js';
import { canonJson, keyFrom, type BookRow, type ItemRow } from '../lib/homebrew.js';
import type { SignInAfter } from '../lib/pending.js';
import { readPrefs } from '../lib/prefs.js';
import { readApplied, readRequests, requestRefusal } from '../lib/requests.js';
import { callbackUrl, saveReturn, type Redirect, type RedirectWindow } from './redirect.js';
import type {
  AuthError,
  AuthPort,
  AuthRedirect,
  AuthResult,
  CloudPort,
  EventsPort,
  HomebrewRepository,
  HomebrewSaved,
  Identity,
  ListOpResult,
  ListRepository,
  ListWrite,
  ListWrites,
  MoveWrite,
  PreferencesPort,
  Provider,
  RequestDeclined,
  RequestRepository,
  RequestSent,
  Session,
  ShareMade,
  ShareRepository
} from './types.js';

const OK: AuthResult = { ok: true };
const refuse = (error: AuthError): AuthResult => ({ ok: false, error });

function providerOf(name: unknown): Provider | null {
  return name === 'google' || name === 'discord' ? name : null;
}

function sessionOf(user: User | null | undefined): Session | null {
  if (!user) return null;
  return {
    userId: user.id,
    email: user.email ?? '',
    provider: providerOf(user.app_metadata['provider'])
  };
}

/** A redirect or a link the provider refused because the identity belongs
 *  to another account; anything else is a plain failure. */
function linkError(code: string | undefined): AuthError {
  return code === 'identity_already_exists' ? 'alreadyLinked' : 'failed';
}

/** What a PostgREST call answers, as far as a write's outcome needs it. */
interface Answer {
  error: { code?: string; message?: string; details?: string } | null;
  status: number;
}

const WRITTEN: ListWrite = { ok: true };
const NETWORK: ListWrite = { ok: false, error: 'network' };
const LIMIT = /^limit: ([\w-]+)$/;
/* A lapsed or missing session: the write is kept and sent again once the
   client has a session again (docs/specs/FEATURES.md, "Account and browser lists"). */
const SESSION_CODES: ReadonlySet<string> = new Set(['PGRST301', 'PGRST303', '28000']);

/** Returns a refusal as the client reads it: a limit trigger's `limit: <key>` (P0001, the
 *  limit in `details`), else `refused`. */
function refusalOf(error: {
  code?: string | undefined;
  message?: string | undefined;
  details?: string | null | undefined;
}): Exclude<ListWrite, { ok: true } | { error: 'network' }> {
  const limit = error.code === 'P0001' ? LIMIT.exec(error.message ?? '') : null;
  if (limit?.[1]) {
    const value = Number(error.details);
    return {
      ok: false,
      error: 'limit',
      key: limit[1],
      value: error.details && Number.isFinite(value) ? value : null
    };
  }
  return { ok: false, error: 'refused' };
}

/** Returns a write's outcome: no answer, a server fault or a lapsed session as `network`,
 *  else what `refusalOf` reads. */
function writeOf(answer: Answer): ListWrite {
  const { error, status } = answer;
  if (!error) return WRITTEN;
  if (status === 0 || status === 401 || status >= 500 || !error.code) return NETWORK;
  if (SESSION_CODES.has(error.code)) return NETWORK;
  return refusalOf(error);
}

/* A thrown call never reached the database, so it may be sent again. */
async function written(call: () => PromiseLike<Answer>): Promise<ListWrite> {
  try {
    return writeOf(await call());
  } catch {
    return NETWORK;
  }
}

/* The database failed an `apply_list_writes` call itself - a statement
   timeout or a defect - which repeats. A restart, a lock and class 40 answer
   HTTP 500 too but pass, so they stay `network` (docs/DECISIONS.md,
   2026-09-26, "A request the database fails three times is halved"). */
const FAULT_CODE = /^(?:57014|(?:22|23|42|P0|XX)[0-9A-Z]{3})$/;

const FAULT: ListWrites = { ok: false, error: 'fault' };
const UNSENT: ListWrites = { ok: false, error: 'network' };
const REFUSED: ListWrites = { ok: false, error: 'refused' };
const MOVE_REFUSED: MoveWrite = { ok: false, error: 'refused' };
/* An import the database stopped at its statement timeout: sent again, it would stop
   again, so it is not `network`. */
const TOO_SLOW: ListWrite = { ok: false, error: 'refused', reason: 'tooSlow' };
const UNSAVED: HomebrewSaved = { ok: false, error: 'network' };

/** Returns an `apply` call's own failure: `fault`, `network`, or `refused`. */
function callFailure(answer: Answer): ListWrites {
  if (answer.status === 500 && FAULT_CODE.test(answer.error?.code ?? '')) return FAULT;
  /* A stale schema cache or a reverted migration: waited out, never up to
     200 writes refused with one toast. */
  if (answer.status === 404 && answer.error?.code === 'PGRST202') return UNSENT;
  /* A limit is refused whole too: the call itself never raises one. */
  return writeOf(answer) === NETWORK ? UNSENT : REFUSED;
}

/** Returns one write's result inside an `apply` answer (`{ ok }` or `{ ok, code, message,
 *  details }`): `P0002` is a row gone or not the caller's. */
function resultOf(r: unknown): ListOpResult {
  if (r === null || typeof r !== 'object') return { ok: false, error: 'refused' };
  const one = r as { ok?: unknown; code?: string; message?: string; details?: string | null };
  if (one.ok === true) return { ok: true };
  if (one.code === 'P0002') return { ok: false, error: 'gone' };
  return refusalOf(one);
}

/** The most bytes a request body may hold to go with `keepalive`: the Fetch standard gives
 *  the `keepalive` requests of a page 64 KiB together. */
const KEEPALIVE_BYTES = 64_000;
const utf8 = new TextEncoder();

type Fetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

/* Two jobs on the requests that reach PostgREST. Each carries this page
   load's tab id as `x-dhloot-tab`, which the broadcast trigger reads as the
   owner message's `by` (docs/DECISIONS.md, 2026-09-26, "The owner's devices
   subscribe to a private owner topic"); an auth, Realtime or storage request
   carries no custom header. And a database write outlives a page closed
   while it is sent: the write buffer's flush on `pagehide` is one such
   request. An auth request never carries the flag - a token refresh that
   lands after the page closed would rotate a refresh token the page never
   stores. A request the browser refuses with the flag is sent once more
   without it; every write is idempotent. The prefix is parsed as
   supabase-js parses the URL, so an uppercase host or an explicit default
   port still matches. */
function keepaliveFetch(url: string, tab: string): Fetch {
  const rest = new URL('rest/v1/', url.replace(/\/*$/, '/')).href;
  return async (input, init) => {
    const target =
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (!target.startsWith(rest)) return fetch(input, init);
    const headers = new Headers(
      init?.headers ?? (input instanceof Request ? input.headers : undefined)
    );
    headers.set('x-dhloot-tab', tab);
    const tagged: RequestInit = { ...init, headers };
    const body = init?.body;
    if (typeof body !== 'string' || utf8.encode(body).length > KEEPALIVE_BYTES) {
      return fetch(input, tagged);
    }
    try {
      return await fetch(input, { ...tagged, keepalive: true });
    } catch (err) {
      if (init?.signal?.aborted) throw err;
      return fetch(input, tagged);
    }
  };
}

/** How long a write waits for its answer before it counts as `network`. */
export const WRITE_TIMEOUT_MS = 20_000;
/** How long an import waits: it never holds up the write buffer, and a 5 MiB file takes
 *  about 40 s to send on a 1 Mbit/s uplink. */
export const IMPORT_TIMEOUT_MS = 120_000;

/* A call with no answer ends as `network` and is sent again; every write is
   idempotent on client-made ids (docs/specs/FEATURES.md, "Account and browser lists").
   The abort lives here, not in the store: a store timeout would leave the request
   running and send it a second time while the first may still land. */
async function timed<T>(
  call: (signal: AbortSignal) => PromiseLike<T>,
  ms = WRITE_TIMEOUT_MS
): Promise<T> {
  const c = new AbortController();
  const timer = setTimeout(() => {
    c.abort();
  }, ms);
  try {
    return await call(c.signal);
  } finally {
    clearTimeout(timer);
  }
}

/** What `create_list_share` answers: a `returns table`, so an array. */
type MadeAnswer = Answer & { data: { id: string; token: string }[] | null };

/* A share's row is the answer's first; an answer with none is a refusal. */
async function made(call: () => PromiseLike<MadeAnswer>): Promise<ShareMade> {
  try {
    const answer = await call();
    const refusal = writeOf(answer);
    if (!refusal.ok) return refusal;
    const row = answer.data?.[0];
    return row ? { ok: true, id: row.id, token: row.token } : { ok: false, error: 'refused' };
  } catch {
    return { ok: false, error: 'network' };
  }
}

/* One read of the owner's lists with their entries; row level security keeps
   it to the owner (tests/db/lists.test.mjs). */
const LIST_SELECT =
  'id,name,money_mode,player_note,gm_note,created_at,updated_at,revision,legacy_fingerprint,' +
  'list_entries(id,item_key,source,snapshot,position,quantity,price_coins,player_note,gm_note)';

/* The owner's pending requests with their lines; row level security keeps them to the
   owner of each request's list. */
const REQUEST_SELECT =
  'id,list_id,audience,created_at,expires_at,' +
  'purchase_request_lines(item_key,quantity,price_coins,applied_quantity)';

/* The author's homebrew rows; row level security keeps them to the author
   (tests/db/homebrew.test.mjs). */
const BOOK_SELECT = 'id,key,content,revision,created_at,updated_at';
const ITEM_SELECT = 'id,key,book_id,content,revision,created_at,updated_at';

type RequestFailure =
  | { ok: false; error: 'gone' | 'stale' | 'decided' | 'expired' }
  | Exclude<ListWrite, { ok: true }>;

const REQUEST_REFUSED = { ok: false, error: 'refused' } as const;
const REQUEST_UNSENT = { ok: false, error: 'network' } as const;

/* A request function's own answers first: PostgREST gives `P0002` HTTP 500, which
   `writeOf` would read as `network` and send again. */
function requestFailure(answer: Answer): RequestFailure {
  const known = requestRefusal(answer.error?.code, answer.error?.message);
  if (known) return { ok: false, error: known };
  const failed = writeOf(answer);
  return failed.ok ? REQUEST_REFUSED : failed;
}

function sentOf(f: RequestFailure): RequestSent {
  if (f.error === 'limit') return f;
  if (f.error === 'gone' || f.error === 'stale' || f.error === 'network') {
    return { ok: false, error: f.error };
  }
  return REQUEST_REFUSED;
}

function decisionOf(f: RequestFailure): Exclude<RequestDeclined, { ok: true }> {
  if (f.error === 'decided' || f.error === 'expired' || f.error === 'gone') {
    return { ok: false, error: f.error };
  }
  return f.error === 'network' ? REQUEST_UNSENT : REQUEST_REFUSED;
}

type CloudWindow = RedirectWindow & Pick<Window, 'addEventListener' | 'removeEventListener'>;

export function createCloud(
  url: string,
  key: string,
  redirect: Redirect | null,
  win: CloudWindow = window,
  /* Outside a browser supabase-js ignores `localStorage` and keeps the
     session in its own memory; only the hosted E2E's Node half hands a
     store in (tests/e2e/contract.mjs). */
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
): CloudPort {
  const tab = crypto.randomUUID();
  const client = createClient(url, key, {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
      ...(storage ? { storage } : {})
    },
    global: { fetch: keepaliveFetch(url, tab) }
  });

  /* Started at once: the page mounts meanwhile, and every read waits for it. */
  const exchanged: Promise<AuthResult> | null = redirect?.code
    ? client.auth.exchangeCodeForSession(redirect.code).then(
        ({ error }) => (error ? refuse(linkError(error.code)) : OK),
        () => refuse('failed')
      )
    : null;
  const settled = async (): Promise<void> => {
    await exchanged;
  };

  async function userId(): Promise<string | null> {
    await settled();
    try {
      const { data } = await client.auth.getSession();
      return data.session?.user.id ?? null;
    } catch {
      return null;
    }
  }

  async function allIdentities(): Promise<UserIdentity[] | null> {
    try {
      const { data, error } = await client.auth.getUserIdentities();
      return error ? null : data.identities;
    } catch {
      return null;
    }
  }

  async function leave(
    kind: 'signIn' | 'link',
    provider: Provider,
    after?: SignInAfter
  ): Promise<AuthResult> {
    saveReturn(win, {
      hash: after?.hash ?? (win.location.hash || '#/account'),
      kind,
      provider,
      ...(after?.action ? { action: after.action } : {})
    });
    const options = { redirectTo: callbackUrl(win.location.href) };
    try {
      const { error } =
        kind === 'signIn'
          ? await client.auth.signInWithOAuth({ provider, options })
          : await client.auth.linkIdentity({ provider, options });
      if (error) return refuse(linkError(error.code));
    } catch {
      return refuse('failed');
    }
    /* The page is leaving: answer only if it is shown again from the
       back-forward cache (docs/specs/FEATURES.md, "Account"). */
    return new Promise<AuthResult>((resolve) => {
      const back = (event: PageTransitionEvent): void => {
        if (!event.persisted) return;
        win.removeEventListener('pageshow', back);
        resolve(OK);
      };
      win.addEventListener('pageshow', back);
    });
  }

  const auth: AuthPort = {
    async session() {
      await settled();
      try {
        const { data } = await client.auth.getSession();
        return sessionOf(data.session?.user);
      } catch {
        return null;
      }
    },
    async identities() {
      await settled();
      try {
        const { data } = await client.auth.getSession();
        if (!data.session) return [];
      } catch {
        return [];
      }
      const all = await allIdentities();
      if (!all) return null;
      return all.flatMap((i): Identity[] => {
        const provider = providerOf(i.provider);
        if (!provider) return [];
        const email: unknown = i.identity_data?.['email'];
        return [{ id: i.identity_id, provider, email: typeof email === 'string' ? email : '' }];
      });
    },
    signIn: (provider, after) => leave('signIn', provider, after),
    link: (provider) => leave('link', provider),
    async unlink(identityId) {
      const all = await allIdentities();
      const identity = all?.find((i) => i.identity_id === identityId);
      if (!all || !identity) return refuse('failed');
      if (all.length === 1) return refuse('lastIdentity');
      try {
        const { error } = await client.auth.unlinkIdentity(identity);
        if (!error) return OK;
        return refuse(
          error.code === 'single_identity_not_deletable' ? 'lastIdentity' : 'failed'
        );
      } catch {
        return refuse('failed');
      }
    },
    async signOut(scope = 'local') {
      try {
        const { error } = await client.auth.signOut({ scope });
        return error ? refuse('failed') : OK;
      } catch {
        return refuse('failed');
      }
    },
    async deleteAccount() {
      try {
        const { error } = await client.rpc('delete_account');
        if (error) return refuse('failed');
      } catch {
        return refuse('failed');
      }
      /* The user no longer exists, so this sign-out may well be refused;
         it only has to clear this browser's copy of the session. */
      await client.auth.signOut({ scope: 'local' }).catch(() => undefined);
      return OK;
    },
    onChange(fn) {
      /* Synchronous on purpose: a callback that awaits another client call
         deadlocks supabase-js. */
      const { data } = client.auth.onAuthStateChange((_event, s) => {
        fn(sessionOf(s?.user));
      });
      return () => {
        data.subscription.unsubscribe();
      };
    },
    async redirectResult(): Promise<AuthRedirect | null> {
      if (!redirect) return null;
      const { kind, provider, action } = redirect;
      if (redirect.error) {
        return { kind, provider, result: refuse(linkError(redirect.error)), action };
      }
      if (!exchanged) return null;
      return { kind, provider, result: await exchanged, action };
    }
  };

  /* Row level security keeps each row to its own user (tests/db/
     user-prefs.test.mjs); the id here only names which row. */
  const prefs: PreferencesPort = {
    async load() {
      const id = await userId();
      if (!id) return { ok: false };
      try {
        const { data, error } = await client
          .from('user_prefs')
          .select('prefs')
          .eq('user_id', id)
          .maybeSingle();
        if (error) return { ok: false };
        return { ok: true, prefs: data ? readPrefs(data.prefs) : null };
      } catch {
        return { ok: false };
      }
    },
    async save(p) {
      const id = await userId();
      if (!id) return false;
      try {
        const { error } = await client
          .from('user_prefs')
          .upsert({ user_id: id, prefs: p }, { onConflict: 'user_id' });
        return !error;
      } catch {
        return false;
      }
    }
  };

  const lists: ListRepository = {
    newId: () => crypto.randomUUID(),
    async list() {
      try {
        const { data, error } = await client.from('lists').select(LIST_SELECT);
        if (error || !Array.isArray(data)) return { ok: false };
        return {
          ok: true,
          lists: (data as unknown as ListRow[]).map((l) => ({
            ...l,
            list_entries: [...l.list_entries].sort(entryOrder)
          }))
        };
      } catch {
        return { ok: false };
      }
    },
    async apply(ops) {
      if (!ops.length) return { ok: true, results: [] };
      try {
        const answer = await timed((signal) =>
          client.rpc('apply_list_writes', { p_ops: ops }).abortSignal(signal)
        );
        if (answer.error) return callFailure(answer);
        const data: unknown = answer.data;
        if (!Array.isArray(data) || data.length !== ops.length) return REFUSED;
        return { ok: true, results: data.map(resultOf) };
      } catch {
        return UNSENT;
      }
    },
    /* `writeOf` reads the answer: a lapsed session (`28000`) and the row deleted
       during the move (`40001`, HTTP 500) are `network`, so the next load moves
       the list again. */
    async move(id, canonical) {
      try {
        const answer = await timed((signal) =>
          client
            .rpc('move_legacy_list', { p_id: id, p_canonical: canonical })
            .abortSignal(signal)
        );
        const failed = writeOf(answer);
        if (!failed.ok) return failed.error === 'network' ? failed : MOVE_REFUSED;
        const data: unknown = answer.data;
        const row = Array.isArray(data) ? (data[0] as unknown) : null;
        if (!row || typeof row !== 'object') return MOVE_REFUSED;
        const { id: moved, inserted } = row as { id?: unknown; inserted?: unknown };
        return typeof moved === 'string' && typeof inserted === 'boolean'
          ? { ok: true, id: moved, inserted }
          : MOVE_REFUSED;
      } catch {
        return { ok: false, error: 'network' };
      }
    },
    async import(rows) {
      try {
        const answer = await timed(
          (signal) => client.rpc('import_lists', { p_lists: rows }).abortSignal(signal),
          IMPORT_TIMEOUT_MS
        );
        return answer.error?.code === '57014' ? TOO_SLOW : writeOf(answer);
      } catch {
        return NETWORK;
      }
    }
  };

  /* Row level security keeps a share's row to its list's owner, stopped rows
     included (tests/db/list-shares.test.mjs); a change goes through the
     functions, which check the owner again. */
  const shares: ShareRepository = {
    async list(listId) {
      try {
        const { data, error } = await client
          .from('list_shares')
          .select('id,audience,token,created_at,revoked_at')
          .eq('list_id', listId);
        if (error || !Array.isArray(data)) return { ok: false };
        return { ok: true, shares: data as unknown as ShareRow[] };
      } catch {
        return { ok: false };
      }
    },
    create: (listId, audience) =>
      made(() =>
        timed((signal) =>
          client
            .rpc('create_list_share', { p_list: listId, p_audience: audience })
            .abortSignal(signal)
        )
      ),
    revoke: (shareId) =>
      written(() =>
        timed((signal) =>
          client.rpc('revoke_list_share', { p_share: shareId }).abortSignal(signal)
        )
      ),
    async read(token) {
      try {
        const answer = await client.rpc('get_shared_list', { p_token: token });
        if (answer.error) return { ok: false };
        const shared: unknown = answer.data;
        return { ok: true, shared: (shared as SharedRow | null) ?? null };
      } catch {
        return { ok: false };
      }
    },
    async ownerOf(token) {
      if (!(await userId())) return null;
      try {
        const { data, error } = await client
          .from('list_shares')
          .select('list_id')
          .eq('token', token)
          .maybeSingle();
        const row: unknown = data;
        return error ? null : ((row as { list_id: string } | null)?.list_id ?? null);
      } catch {
        return null;
      }
    },
    clone: (token, id) =>
      written(() =>
        timed((signal) =>
          client.rpc('clone_shared_list', { p_token: token, p_id: id }).abortSignal(signal)
        )
      )
  };

  /* A channel is used once: its first loss removes it, so realtime-js's own
     rejoin stops and the feed's backoff decides the next join
     (state/liveFeed.svelte.ts). Every topic is private (docs/specs/META.md). */
  const events: EventsPort = {
    tab,
    subscribe(topic, on) {
      let open = true;
      const ch = client.channel(topic, { config: { private: true } });
      ch.on('broadcast', { event: '*' }, (m) => {
        if (open) on.message(m.event, m['payload']);
      });
      ch.subscribe((s) => {
        if (!open) return;
        if (s === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          on.status('live');
          return;
        }
        open = false;
        void client.removeChannel(ch);
        on.status('down');
      });
      return () => {
        if (!open) return;
        open = false;
        void client.removeChannel(ch);
      };
    }
  };
  /* Row level security keeps a request to its list's owner
     (tests/db/purchase-requests.test.mjs); a send and a decision go through the
     functions, which check the token or the owner again. */
  const requests: RequestRepository = {
    async list() {
      try {
        const { data, error } = await client
          .from('purchase_requests')
          .select(REQUEST_SELECT)
          .eq('status', 'pending');
        if (error) return { ok: false };
        const read = readRequests(data);
        return read ? { ok: true, requests: read } : { ok: false };
      } catch {
        return { ok: false };
      }
    },
    async send(id, token, lines) {
      try {
        const answer = await timed((signal) =>
          client
            .rpc('create_purchase_request', { p_id: id, p_token: token, p_lines: lines })
            .abortSignal(signal)
        );
        return answer.error ? sentOf(requestFailure(answer)) : { ok: true };
      } catch {
        return REQUEST_UNSENT;
      }
    },
    async apply(id, clamp) {
      try {
        const answer = await timed((signal) =>
          client.rpc('apply_purchase_request', { p_id: id, p_clamp: clamp }).abortSignal(signal)
        );
        if (answer.error) return decisionOf(requestFailure(answer));
        const data: unknown = answer.data;
        return readApplied(data) ?? REQUEST_REFUSED;
      } catch {
        return REQUEST_UNSENT;
      }
    },
    async decline(id) {
      try {
        const answer = await timed((signal) =>
          client.rpc('decline_purchase_request', { p_id: id }).abortSignal(signal)
        );
        return answer.error ? decisionOf(requestFailure(answer)) : { ok: true };
      } catch {
        return REQUEST_UNSENT;
      }
    }
  };
  /* An update names the revision the form loaded. When it matches no row, a read of the
     row tells a newer row (`conflict`) from a deleted one (`gone`) and from the same
     update sent again after its answer was lost: that row already holds the patch. */
  async function homebrewUpdate(
    table: 'homebrew_books' | 'homebrew_items',
    id: string,
    patch: Record<string, unknown>,
    revision: number | null
  ): Promise<HomebrewSaved> {
    try {
      const answer = await timed((signal) => {
        const q = client.from(table).update(patch).eq('id', id);
        return (revision === null ? q : q.eq('revision', revision))
          .select('revision')
          .abortSignal(signal);
      });
      const failed = writeOf(answer);
      if (!failed.ok) return failed;
      const found: unknown = answer.data;
      const row = Array.isArray(found)
        ? (found[0] as { revision?: unknown } | undefined)
        : null;
      if (typeof row?.revision === 'number') return { ok: true, revision: row.revision };
      const held = await timed((signal) =>
        client
          .from(table)
          .select(['revision', ...Object.keys(patch)].join(','))
          .eq('id', id)
          .abortSignal(signal)
          .maybeSingle()
      );
      if (held.error) return UNSAVED;
      const now = held.data as Record<string, unknown> | null;
      if (!now) return { ok: false, error: 'gone' };
      const same = Object.keys(patch).every((k) => canonJson(now[k]) === canonJson(patch[k]));
      return same && typeof now['revision'] === 'number'
        ? { ok: true, revision: now['revision'] }
        : { ok: false, error: 'conflict' };
    } catch {
      return UNSAVED;
    }
  }
  const homebrewCreate = (table: 'homebrew_books' | 'homebrew_items', row: object) =>
    written(() =>
      timed((signal) =>
        client
          .from(table)
          .upsert(row, { onConflict: 'id', ignoreDuplicates: true })
          .abortSignal(signal)
      )
    );
  const homebrewRemove = (table: 'homebrew_books' | 'homebrew_items', id: string) =>
    written(() =>
      timed((signal) => client.from(table).delete().eq('id', id).abortSignal(signal))
    );
  const homebrew: HomebrewRepository = {
    newId: () => crypto.randomUUID(),
    newKey: () => keyFrom(crypto.getRandomValues(new Uint8Array(10))),
    async load() {
      if (!(await userId())) return { ok: false };
      /* A limit read that fails leaves the count without its limit; it never fails the
         read of the rows. */
      const limit = Promise.resolve(
        client.rpc('my_limit', { p_key: 'homebrew_items_per_owner' })
      ).then(
        (r): number | null => {
          const data: unknown = r.error ? null : r.data;
          return typeof data === 'number' ? data : null;
        },
        () => null
      );
      try {
        const [books, items, itemLimit] = await Promise.all([
          client.from('homebrew_books').select(BOOK_SELECT),
          client.from('homebrew_items').select(ITEM_SELECT),
          limit
        ]);
        if (books.error || items.error) return { ok: false };
        if (!Array.isArray(books.data) || !Array.isArray(items.data)) return { ok: false };
        return {
          ok: true,
          books: books.data as unknown as BookRow[],
          items: items.data as unknown as ItemRow[],
          itemLimit
        };
      } catch {
        return { ok: false };
      }
    },
    createBook: (row) => homebrewCreate('homebrew_books', row),
    updateBook: (id, content, revision) =>
      homebrewUpdate('homebrew_books', id, { content }, revision),
    removeBook: (id) => homebrewRemove('homebrew_books', id),
    createItem: (row) => homebrewCreate('homebrew_items', row),
    updateItem: (id, patch, revision) =>
      homebrewUpdate(
        'homebrew_items',
        id,
        { content: patch.content, book_id: patch.book_id },
        revision
      ),
    removeItem: (id) => homebrewRemove('homebrew_items', id)
  };
  return { auth, prefs, lists, shares, events, requests, homebrew };
}
