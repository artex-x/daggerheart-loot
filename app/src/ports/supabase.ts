/* The real `CloudPort`: Supabase Auth and the account's rows through
 * `@supabase/auth-js`, `postgrest-js`, `realtime-js` and `storage-js`.
 *
 * The only module that imports `@supabase/*` (ESLint enforces it); `main.ts`
 * loads it as a lazy chunk after first paint, and only in a build with the
 * two `VITE_SUPABASE_*` values (docs/DECISIONS.md, "The account client loads
 * after first paint"). The provider redirect is read before mount by
 * `redirect.ts`, so auth-js's own URL detection is off - it would race the
 * router. docs/specs/FEATURES.md, "Account". */

import { AuthClient, type User, type UserIdentity } from '@supabase/auth-js';
import { PostgrestClient } from '@supabase/postgrest-js';
import { RealtimeClient, REALTIME_SUBSCRIBE_STATES } from '@supabase/realtime-js';
import { StorageClient } from '@supabase/storage-js';
import {
  entryOrder,
  type LinkedRow,
  type ListRow,
  type SharedHeld,
  type SharedRow,
  type ShareRow,
  withSnapshots
} from '../lib/cloudLists.js';
import { newArtName, thumbOf } from '../lib/art.js';
import {
  canonJson,
  keyFrom,
  type BookRow,
  type CardRow,
  type ItemRow
} from '../lib/homebrew.js';
import type { SignInAfter } from '../lib/pending.js';
import { readPrefs } from '../lib/prefs.js';
import {
  readApplied,
  readRequestHeads,
  readRequests,
  requestRefusal,
  type NoticeRow,
  type OwnerRequest
} from '../lib/requests.js';
import { callbackUrl, saveReturn, type Redirect, type RedirectWindow } from './redirect.js';
import type {
  AuthError,
  AuthPort,
  AuthRedirect,
  AuthResult,
  CloudPort,
  EventsPort,
  HomebrewImport,
  HomebrewMoved,
  HomebrewRepository,
  HomebrewSaved,
  Identity,
  ListOpResult,
  ListRepository,
  ListsRead,
  ListWrite,
  ListWrites,
  MoveWrite,
  PreferencesPort,
  PrintSetRepository,
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
  if (error.code === 'P0001' && error.message === 'homebrew: art missing') {
    return { ok: false, error: 'refused', reason: 'artGone' };
  }
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
/* A statement timeout cancelled the call's one statement, which rolled back: a smaller call
   can pass at once (docs/decisions/2026-09-26-a-request-the-database-fails-three-times-is-halved.md). */
const TIMED_OUT: ListWrites = { ok: false, error: 'fault', timeout: true };
const UNSENT: ListWrites = { ok: false, error: 'network' };
const REFUSED: ListWrites = { ok: false, error: 'refused' };
const MOVE_REFUSED: MoveWrite = { ok: false, error: 'refused' };
/* An import the database stopped at its statement timeout: sent again, it would stop
   again, so it is not `network`. */
const TOO_SLOW: ListWrite = { ok: false, error: 'refused', reason: 'tooSlow' };
const UNSAVED: HomebrewSaved = { ok: false, error: 'network' };

/** The public bucket of own pictures (`supabase/migrations/20261014120000_homebrew_art.sql`). */
const ART_BUCKET = 'homebrew-art';
/* A day, against readers' egress: the CDN serves a deleted file's public address until its
   cache age runs out (the hosted E2E read 200 after the delete, 2026-10-14), so the age
   bounds how long a removed picture stays readable (docs/decisions/2026-10-14-own-pictures-are-random-named-files-the-database-deletes.md). */
const ART_CACHE = '86400';

/** Returns an upload's refusal: the same name again (409) is this caller's retry, so ok;
 *  the insert policy's refusal (403) is the picture room, because the client never sends
 *  a bad name; a lapsed session, a server fault or no answer is `network`. */
function uploadRefusal(error: {
  status?: number | undefined;
  statusCode?: string | undefined;
}): ListWrite {
  const code = error.statusCode ?? '';
  if (code === '409') return WRITTEN;
  if (code === '403') return { ok: false, error: 'limit', key: 'homebrew_art', value: null };
  const status = error.status ?? 0;
  if (status === 0 || status === 401 || status >= 500 || code === '401') return NETWORK;
  return { ok: false, error: 'refused' };
}

/** Returns an `apply` call's own failure: `fault`, `network`, or `refused`. */
function callFailure(answer: Answer): ListWrites {
  if (answer.status === 500 && answer.error?.code === '57014') return TIMED_OUT;
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
   without it; every write is idempotent. `base` is `accountClients`' base,
   so an uppercase host or an explicit default port still matches. */
function keepaliveFetch(base: string, tab: string): Fetch {
  const rest = new URL('rest/v1/', base).href;
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

type AuthStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/* The account's four clients, built as supabase-js 2.117.1's `SupabaseClient` builds them:
   the same addresses from one base, the same auth storage key - a changed key signs every
   reader out (docs/specs/STATE.md) - and the session's token read on every request, never
   held in a header (docs/decisions/2026-09-24-the-account-client-loads-after-first-paint-a.md). */
function accountClients(url: string, key: string, tab: string, storage?: AuthStorage) {
  const trimmed = url.trim();
  const base = new URL(trimmed.endsWith('/') ? trimmed : trimmed + '/');
  const live = new URL('realtime/v1', base);
  live.protocol = live.protocol.replace('http', 'ws');
  const plain = keepaliveFetch(base.href, tab);
  const auth = new AuthClient({
    url: new URL('auth/v1', base).href,
    headers: { Authorization: `Bearer ${key}`, apikey: key },
    storageKey: `sb-${base.hostname.split('.')[0] ?? ''}-auth-token`,
    flowType: 'pkce',
    detectSessionInUrl: false,
    persistSession: true,
    autoRefreshToken: true,
    fetch: plain,
    ...(storage ? { storage } : {})
  });
  const token = async (): Promise<string | null> => {
    const { data } = await auth.getSession();
    return data.session?.access_token ?? null;
  };
  /* supabase-js's `fetchWithAuth`: a header the caller set wins. */
  const authed: Fetch = async (input, init) => {
    const bearer = (await token()) ?? key;
    const headers = new Headers(init?.headers);
    if (!headers.has('apikey')) headers.set('apikey', key);
    if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${bearer}`);
    return plain(input, { ...init, headers });
  };
  const realtime = new RealtimeClient(live.href, {
    params: { apikey: key },
    accessToken: async () => (await token()) ?? key,
    fetch: authed
  });
  /* supabase-js's `_handleTokenChanged`. Synchronous on purpose: a callback that awaits
     another auth call deadlocks auth-js. */
  let current: string | undefined;
  auth.onAuthStateChange((event, session) => {
    const next = session?.access_token;
    if (
      (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION') &&
      current !== next
    ) {
      current = next;
      void realtime.setAuth(next);
    } else if (event === 'SIGNED_OUT') {
      void realtime.setAuth();
      current = undefined;
    }
  });
  return {
    auth,
    rest: new PostgrestClient(new URL('rest/v1', base).href, {
      headers: {},
      schema: 'public',
      fetch: authed
    }),
    realtime,
    storage: new StorageClient(new URL('storage/v1', base).href, {}, authed)
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
  'list_entries(id,item_key,source,hb_item,position,quantity,price_coins,player_note,gm_note,gm_only)';

/** The most ids one `get_homebrew_items` call takes; more go in several calls. */
export const ITEMS_PER_CALL = 1000;

/** The most ids one `in.(...)` filter names: 50 UUIDs are about 1.9 kB of address, far
 *  under a common 8 kB request line. A re-read with more changed rows (lists, the homebrew
 *  rows of one table, new requests) reads them all. */
export const CHANGED_ROWS_MAX = 50;
/** PostgREST's row cap (`supabase/config.toml`, `[api] max_rows`): a page of the requests
 *  read. The cap limits top-level rows only, not embedded ones. */
export const READ_PAGE = 1000;
/** The most `delete_account_requests()` calls one account delete makes: 200 requests a call,
 *  20 000 in all (an account at three times the limits holds 4500 pending). */
export const ACCOUNT_DELETE_CALLS_MAX = 100;

/* The owner's pending requests; row level security keeps them to the owner of each
   request's list. A read pages the heads of every pending request; the lines are read by
   id for the open list only, and a pending request's lines change only in the apply that
   decides it (docs/decisions/, 2026-10-22, "The owner's requests read takes every head and
   the open list's lines"). */
const REQUEST_HEAD = 'id,list_id,audience,created_at,expires_at,read_at';
const REQUEST_SELECT =
  REQUEST_HEAD + ',purchase_request_lines(item_key,quantity,price_coins,applied_quantity)';

/* The owner's change log: one row per list and item. */
const NOTICE_SELECT = 'id,list_id,item_key,hid,kind,name,created_at,read_at';

/* The author's homebrew rows; row level security keeps them to the author
   (tests/db/homebrew.test.mjs). */
const BOOK_SELECT = 'id,key,content,revision,created_at,updated_at';
const ITEM_SELECT = 'id,key,book_id,content,art,revision,created_at,updated_at';
const CARD_SELECT = 'id,key,kind,book_id,content,revision,created_at,updated_at';
type HomebrewTable = 'homebrew_books' | 'homebrew_items' | 'homebrew_cards';
/* `import_homebrew`'s seven counts, each a whole number; a key past them is ignored, so a
   later migration that adds a count never reads a committed import as refused. */
const IMPORTED = [
  'books_created',
  'cards_created',
  'cards_updated',
  'cards_skipped',
  'items_created',
  'items_updated',
  'items_skipped'
] as const;

function importedOf(v: unknown): Extract<HomebrewImport, { ok: true }> | null {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  const counts = {} as Record<(typeof IMPORTED)[number], number>;
  for (const k of IMPORTED) {
    const n = o[k];
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 0) return null;
    counts[k] = n;
  }
  return { ok: true, counts };
}

/* A move's own refusals first: PostgREST answers P0001 and P0002 with HTTP 4xx or 500,
   and a timeout through `writeOf` would read as `network`, which repeats on every press. */
function movedOf(answer: Answer): HomebrewMoved {
  const { error } = answer;
  if (error?.message?.startsWith('move_homebrew_items: conflict')) {
    return { ok: false, error: 'conflict' };
  }
  if (error?.code === 'P0002') return { ok: false, error: 'gone' };
  if (error?.code === '57014') return { ok: false, error: 'refused' };
  return writeOf(answer);
}

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
  /* Outside a browser auth-js ignores `localStorage` and keeps the
     session in its own memory; only the hosted E2E's Node half hands a
     store in (tests/e2e/contract.mjs). */
  storage?: AuthStorage
): CloudPort {
  const tab = crypto.randomUUID();
  const client = accountClients(url, key, tab, storage);

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
      /* The purchase requests go first in bounded calls: at three times the limits their
         lines alone pass the statement timeout in one delete
         (docs/decisions/2026-10-16-an-account-delete-removes-its-purchase-requests.md). */
      try {
        for (let call = 0; call < ACCOUNT_DELETE_CALLS_MAX; call++) {
          const answer = await client.rest.rpc('delete_account_requests');
          if (answer.error?.code === 'PGRST202') break;
          if (answer.error) return refuse('failed');
          const pruned: unknown = answer.data;
          if (typeof pruned !== 'number' || pruned === 0) break;
        }
        const { error } = await client.rest.rpc('delete_account');
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
      /* Synchronous on purpose: a callback that awaits another auth call
         deadlocks auth-js. */
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
        const { data, error } = await client.rest
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
        const { error } = await client.rest
          .from('user_prefs')
          .upsert({ user_id: id, prefs: p }, { onConflict: 'user_id' });
        return !error;
      } catch {
        return false;
      }
    }
  };

  /* The caller's limit for one `limit_defaults` key (an unknown key raises 22023). A limit
     read that fails answers undefined, so the caller keeps the limit it knows; null is no
     limit. The read of the rows never fails for it. */
  const limitOf = async (key: string): Promise<number | null | undefined> => {
    try {
      const r = await client.rest.rpc('my_limit', { p_key: key });
      if (r.error) return undefined;
      const data: unknown = r.data;
      if (data === null) return null;
      return typeof data === 'number' ? data : undefined;
    } catch {
      return undefined;
    }
  };
  /* A limit read of this repository failed: the next read reads the limits again. A
     re-read reads none (docs/specs/FEATURES.md, "Consistency rules", the counter rule). */
  let listLimitsDue = false;
  let homebrewLimitsDue = false;

  /* A fresh builder per read: postgrest-js builders keep the filters of an earlier call. */
  const listsQuery = (columns: string) =>
    client.rest
      .from('lists')
      .select(columns)
      .order('updated_at', { ascending: false })
      .order('id');
  const listRows = (data: unknown): ListRow[] | null =>
    Array.isArray(data)
      ? (data as ListRow[]).map((l) => ({
          ...l,
          list_entries: [...l.list_entries].sort(entryOrder)
        }))
      : null;

  const lists: ListRepository = {
    newId: () => crypto.randomUUID(),
    async list(known) {
      const whole = !known || !Object.keys(known).length;
      const reading = whole || listLimitsDue;
      const read = async (): Promise<ListsRead> => {
        const limits = reading
          ? Promise.all([limitOf('lists_per_owner'), limitOf('entries_per_list')])
          : Promise.resolve([undefined, undefined] as const);
        const full = async (): Promise<ListsRead> => {
          const [{ data, error }, [listLimit, entryLimit]] = await Promise.all([
            listsQuery(LIST_SELECT),
            limits
          ]);
          const rows = error ? null : listRows(data);
          return rows ? { ok: true, lists: rows, listLimit, entryLimit } : { ok: false };
        };
        if (!known || whole) return await full();
        const head = await listsQuery('id,revision');
        if (head.error || !Array.isArray(head.data)) return { ok: false };
        const held = head.data as unknown as { id: string; revision: number }[];
        const changed = held.filter((l) => known[l.id] !== l.revision).map((l) => l.id);
        if (changed.length > CHANGED_ROWS_MAX) return await full();
        const kept = held.filter((l) => known[l.id] === l.revision).map((l) => l.id);
        const [rowsRead, [listLimit, entryLimit]] = await Promise.all([
          changed.length ? listsQuery(LIST_SELECT).in('id', changed) : null,
          limits
        ]);
        const rows = !rowsRead ? [] : rowsRead.error ? null : listRows(rowsRead.data);
        return rows ? { ok: true, lists: rows, kept, listLimit, entryLimit } : { ok: false };
      };
      try {
        const answer = await read();
        if (answer.ok && reading) {
          listLimitsDue = answer.listLimit === undefined || answer.entryLimit === undefined;
        }
        return answer;
      } catch {
        return { ok: false };
      }
    },
    async apply(ops) {
      if (!ops.length) return { ok: true, results: [] };
      try {
        const answer = await timed((signal) =>
          client.rest.rpc('apply_list_writes', { p_ops: ops }).abortSignal(signal)
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
          client.rest
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
          (signal) => client.rest.rpc('import_lists', { p_lists: rows }).abortSignal(signal),
          IMPORT_TIMEOUT_MS
        );
        return answer.error?.code === '57014' ? TOO_SLOW : writeOf(answer);
      } catch {
        return NETWORK;
      }
    },
    /* Keyed by the item, so another account's item reads as its own record; the
       function answers only ids that exist. */
    async items(ids) {
      try {
        const out: LinkedRow[] = [];
        for (let at = 0; at < ids.length; at += ITEMS_PER_CALL) {
          const part = ids.slice(at, at + ITEMS_PER_CALL);
          const r0 = await client.rest.rpc('get_homebrew_items', { p_ids: part });
          const data: unknown = r0.data;
          if (r0.error || !Array.isArray(data)) return { ok: false };
          for (const row of data as unknown[]) {
            const r = row as { hid?: unknown; item?: unknown; img?: unknown } | null;
            if (r && typeof r.hid === 'string') {
              out.push(
                r.img === undefined
                  ? { hid: r.hid, item: r.item }
                  : { hid: r.hid, item: r.item, img: r.img }
              );
            }
          }
        }
        return { ok: true, items: out };
      } catch {
        return { ok: false };
      }
    },
    /* Signed out too: `anon` executes `get_homebrew_item`; an unknown id answers null. */
    async item(id) {
      try {
        const answer = await timed((signal) =>
          client.rest.rpc('get_homebrew_item', { p_id: id }).abortSignal(signal)
        );
        if (answer.error) return { ok: false };
        const item: unknown = answer.data;
        return { ok: true, item: item ?? null };
      } catch {
        return { ok: false };
      }
    }
  };

  /* Row level security keeps a share's row to its list's owner, stopped rows
     included (tests/db/list-shares.test.mjs); a change goes through the
     functions, which check the owner again. */
  let sharedHaveGone = false;
  /* The tokens whose overload answered `57014` on this page: each reads through the call of
     before from then on. */
  const sharedSlow = new Set<string>();
  const shares: ShareRepository = {
    async list(listId) {
      try {
        const { data, error } = await client.rest
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
          client.rest
            .rpc('create_list_share', { p_list: listId, p_audience: audience })
            .abortSignal(signal)
        )
      ),
    revoke: (shareId) =>
      written(() =>
        timed((signal) =>
          client.rest.rpc('revoke_list_share', { p_share: shareId }).abortSignal(signal)
        )
      ),
    /* Every read names `(text, bigint, jsonb)`, which leaves out a held record of the same
       `rev`; `{ unchanged: true }` answers a known revision. After a `PGRST202` (its
       reversal pushed) this port takes the calls of before: `{ p_token }` names
       `get_shared_list(text)`, `{ p_token, p_since }` the `(text, bigint)` overload. On a
       `57014` (the `anon` statement timeout) this read takes them too, and every later read
       of that token takes them too (the hosted `anon` statement timeout is 3 s). */
    async read(token, since, held) {
      /* Captured before the call: the fill reads nothing the store changes meanwhile. */
      const have: SharedHeld = new Map(held ?? []);
      const before = (s: number | undefined) =>
        client.rest.rpc(
          'get_shared_list',
          s === undefined ? { p_token: token } : { p_token: token, p_since: s }
        );
      const ask = (s: number | undefined, h: SharedHeld) =>
        sharedHaveGone || sharedSlow.has(token)
          ? before(s)
          : client.rest.rpc('get_shared_list', {
              p_token: token,
              p_since: s ?? null,
              p_have: Object.fromEntries([...h].map(([hid, x]) => [hid, x.rev]))
            });
      try {
        let whole = sharedHaveGone || sharedSlow.has(token);
        let answer = await ask(since, have);
        if (answer.error?.code === 'PGRST202' && !sharedHaveGone) {
          sharedHaveGone = true;
          whole = true;
          answer = await ask(since, have);
        } else if (answer.error?.code === '57014' && !whole) {
          sharedSlow.add(token);
          whole = true;
          answer = await before(since);
        }
        if (answer.error) return { ok: false };
        const shared: unknown = answer.data;
        if (shared === null || typeof shared !== 'object') return { ok: true, shared: null };
        if (since !== undefined && (shared as { unchanged?: unknown }).unchanged === true) {
          return { ok: true, unchanged: true };
        }
        if (whole) return { ok: true, shared: shared as SharedRow };
        const filled = withSnapshots(shared as SharedRow, have);
        if (filled) return { ok: true, shared: filled };
        /* An answer that left out a record this read did not hold: once more, whole. */
        const full = await ask(undefined, new Map());
        if (full.error || full.data === null || typeof full.data !== 'object') {
          return full.error ? { ok: false } : { ok: true, shared: null };
        }
        const again = withSnapshots(full.data as SharedRow, new Map());
        return again ? { ok: true, shared: again } : { ok: false };
      } catch {
        return { ok: false };
      }
    },
    async ownerOf(token) {
      if (!(await userId())) return null;
      try {
        const { data, error } = await client.rest
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
          client.rest.rpc('clone_shared_list', { p_token: token, p_id: id }).abortSignal(signal)
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
      const ch = client.realtime.channel(topic, { config: { private: true } });
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
        void client.realtime.removeChannel(ch);
        on.status('down');
      });
      return () => {
        if (!open) return;
        open = false;
        void client.realtime.removeChannel(ch);
      };
    }
  };
  /* Row level security keeps a request to its list's owner
     (tests/db/purchase-requests.test.mjs); a send and a decision go through the
     functions, which check the token or the owner again. */
  const requests: RequestRepository = {
    /* Keyset pages by id past PostgREST's row cap: an offset page would skip a row when a
       request is deleted between two pages. A failed page fails the whole read. */
    async list() {
      const rows: unknown[] = [];
      let last: string | null = null;
      try {
        for (;;) {
          const q = client.rest
            .from('purchase_requests')
            .select(REQUEST_HEAD)
            .eq('status', 'pending');
          const page = await (last === null ? q : q.gt('id', last))
            .order('id')
            .limit(READ_PAGE);
          if (page.error || !Array.isArray(page.data)) return { ok: false };
          const got = page.data as unknown[];
          rows.push(...got);
          const end = got.at(-1) as { id?: unknown } | undefined;
          if (got.length < READ_PAGE || typeof end?.id !== 'string') break;
          last = end.id;
        }
      } catch {
        return { ok: false };
      }
      const heads = readRequestHeads(rows);
      return heads ? { ok: true, requests: heads } : { ok: false };
    },
    /* The ids go in chunks of `CHANGED_ROWS_MAX`, in order; a failed chunk fails the read.
       An expired row stays pending until the clean-up, so a list can name more than its
       pending limit. */
    async lines(ids) {
      const read: OwnerRequest[] = [];
      try {
        for (let i = 0; i < ids.length; i += CHANGED_ROWS_MAX) {
          const chunk = ids.slice(i, i + CHANGED_ROWS_MAX);
          const answer = await client.rest
            .from('purchase_requests')
            .select(REQUEST_SELECT)
            .eq('status', 'pending')
            .in('id', chunk)
            .order('id');
          const got = answer.error ? null : readRequests(answer.data);
          if (!got) return { ok: false };
          read.push(...got);
        }
      } catch {
        return { ok: false };
      }
      return { ok: true, requests: read };
    },
    async send(id, token, lines) {
      try {
        const answer = await timed((signal) =>
          client.rest
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
          client.rest
            .rpc('apply_purchase_request', { p_id: id, p_clamp: clamp })
            .abortSignal(signal)
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
          client.rest.rpc('decline_purchase_request', { p_id: id }).abortSignal(signal)
        );
        return answer.error ? decisionOf(requestFailure(answer)) : { ok: true };
      } catch {
        return REQUEST_UNSENT;
      }
    },
    markRead: (listId) =>
      written(() =>
        timed((signal) =>
          client.rest.rpc('mark_list_read', { p_list: listId }).abortSignal(signal)
        )
      ),
    /* Row level security keeps a notice to its list's owner; one list reads whole, every
       list is cut at the row cap (`READ_PAGE`), newest first. */
    async notices(listId) {
      if (!(await userId())) return { ok: false };
      try {
        const q = client.rest.from('list_notices').select(NOTICE_SELECT);
        const { data, error } = await (listId === undefined ? q : q.eq('list_id', listId))
          .order('created_at', { ascending: false })
          .order('id')
          .limit(READ_PAGE);
        if (error || !Array.isArray(data)) return { ok: false };
        return { ok: true, notices: data as unknown as NoticeRow[] };
      } catch {
        return { ok: false };
      }
    },
    /* The ids go in chunks of `CHANGED_ROWS_MAX`: one `in.(...)` of 210 ids passes an 8 kB
       request line. A failed chunk stops; the caller reads the notices again. */
    async hideNotices(listId, ids) {
      for (let i = 0; i < ids.length; i += CHANGED_ROWS_MAX) {
        const chunk = ids.slice(i, i + CHANGED_ROWS_MAX);
        const r = await written(() =>
          timed((signal) =>
            client.rest
              .from('list_notices')
              .delete()
              .eq('list_id', listId)
              .in('id', chunk)
              .abortSignal(signal)
          )
        );
        if (!r.ok) return r;
      }
      return { ok: true };
    }
  };
  /* An update names the revision the form loaded. When it matches no row, a read of the
     row tells a newer row (`conflict`) from a deleted one (`gone`) and from the same
     update sent again after its answer was lost: that row already holds the patch. */
  async function homebrewUpdate(
    table: HomebrewTable,
    id: string,
    patch: Record<string, unknown>,
    revision: number | null
  ): Promise<HomebrewSaved> {
    try {
      const answer = await timed((signal) => {
        const q = client.rest.from(table).update(patch).eq('id', id);
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
        client.rest
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
  const homebrewCreate = (table: HomebrewTable, row: object) =>
    written(() =>
      timed((signal) =>
        client.rest
          .from(table)
          .upsert(row, { onConflict: 'id', ignoreDuplicates: true })
          .abortSignal(signal)
      )
    );
  const art = () => client.storage.from(ART_BUCKET);
  /* An upload has no abort: past the time it answers network, and the retry sends the
     same name, which answers ok. */
  const uploaded = async (name: string, blob: Blob): Promise<ListWrite> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const late = new Promise<ListWrite>((resolve) => {
        timer = setTimeout(() => {
          resolve(NETWORK);
        }, IMPORT_TIMEOUT_MS);
      });
      return await Promise.race([
        art()
          .upload(name, blob, {
            upsert: false,
            cacheControl: ART_CACHE,
            contentType: blob.type
          })
          .then(({ error }) => (error ? uploadRefusal(error) : WRITTEN)),
        late
      ]);
    } catch {
      return NETWORK;
    } finally {
      clearTimeout(timer);
    }
  };
  const homebrewRemove = (table: HomebrewTable, id: string) =>
    written(() =>
      timed((signal) => client.rest.from(table).delete().eq('id', id).abortSignal(signal))
    );
  const homebrew: HomebrewRepository = {
    newId: () => crypto.randomUUID(),
    newKey: () => keyFrom(crypto.getRandomValues(new Uint8Array(10))),
    /* With `known`, each table reads its `id,revision` head, then only the rows whose
       revision moved, by id; past `CHANGED_ROWS_MAX` that table reads whole
       (docs/decisions/2026-10-02-the-account-re-read-fetches-only-lists-whose-revision-moved.md). */
    async load(known) {
      if (!(await userId())) return { ok: false };
      const whole =
        !known ||
        (!Object.keys(known.books).length &&
          !Object.keys(known.items).length &&
          !Object.keys(known.cards).length);
      type Rows = { rows: unknown[]; kept: string[] } | null;
      const table = async (
        name: HomebrewTable,
        columns: string,
        held: Readonly<Record<string, number>>
      ): Promise<Rows> => {
        const all = async (): Promise<Rows> => {
          const r = await client.rest.from(name).select(columns);
          return r.error || !Array.isArray(r.data) ? null : { rows: r.data, kept: [] };
        };
        if (whole) return all();
        const head = await client.rest.from(name).select('id,revision');
        if (head.error || !Array.isArray(head.data)) return null;
        const rows = head.data as unknown as { id: string; revision: number }[];
        const changed = rows.filter((r) => held[r.id] !== r.revision).map((r) => r.id);
        if (changed.length > CHANGED_ROWS_MAX) return all();
        const kept = rows.filter((r) => held[r.id] === r.revision).map((r) => r.id);
        if (!changed.length) return { rows: [], kept };
        const read = await client.rest.from(name).select(columns).in('id', changed);
        return read.error || !Array.isArray(read.data) ? null : { rows: read.data, kept };
      };
      const none: Readonly<Record<string, number>> = {};
      const reading = whole || homebrewLimitsDue;
      const limit = (key: string) => (reading ? limitOf(key) : undefined);
      try {
        const [books, items, cards, itemLimit, bookLimit, cardLimit] = await Promise.all([
          table('homebrew_books', BOOK_SELECT, known?.books ?? none),
          table('homebrew_items', ITEM_SELECT, known?.items ?? none),
          table('homebrew_cards', CARD_SELECT, known?.cards ?? none),
          limit('homebrew_items_per_owner'),
          limit('homebrew_books_per_owner'),
          limit('homebrew_cards_per_owner')
        ]);
        if (!books || !items || !cards) return { ok: false };
        if (reading) {
          homebrewLimitsDue =
            itemLimit === undefined || bookLimit === undefined || cardLimit === undefined;
        }
        return {
          ok: true,
          books: books.rows as BookRow[],
          items: items.rows as ItemRow[],
          cards: cards.rows as CardRow[],
          ...(whole
            ? {}
            : { kept: { books: books.kept, items: items.kept, cards: cards.kept } }),
          itemLimit,
          bookLimit,
          cardLimit
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
        patch.art === undefined
          ? { content: patch.content, book_id: patch.book_id }
          : { content: patch.content, book_id: patch.book_id, art: patch.art },
        revision
      ),
    async setArt(id, name, onlyIfNone) {
      if (!onlyIfNone) return homebrewUpdate('homebrew_items', id, { art: name }, null);
      try {
        const answer = await timed((signal) =>
          client.rest
            .from('homebrew_items')
            .update({ art: name })
            .eq('id', id)
            .is('art', null)
            .select('revision')
            .abortSignal(signal)
        );
        const failed = writeOf(answer);
        if (!failed.ok) return failed;
        const found: unknown = answer.data;
        const row = Array.isArray(found)
          ? (found[0] as { revision?: unknown } | undefined)
          : null;
        if (typeof row?.revision === 'number') return { ok: true, revision: row.revision };
        /* No row matched: gone, or it holds a picture, which stays. */
        const held = await timed((signal) =>
          client.rest
            .from('homebrew_items')
            .select('revision')
            .eq('id', id)
            .abortSignal(signal)
            .maybeSingle()
        );
        if (held.error) return UNSAVED;
        const now = held.data as { revision?: unknown } | null;
        if (!now) return { ok: false, error: 'gone' };
        return typeof now.revision === 'number'
          ? { ok: true, revision: now.revision }
          : UNSAVED;
      } catch {
        return UNSAVED;
      }
    },
    uploadArt: uploaded,
    async copyArt(img) {
      try {
        const name = newArtName(img.endsWith('.jpg') ? 'jpg' : 'webp', crypto.randomUUID());
        const files = await Promise.all(
          [img, thumbOf(img)].map((n) =>
            timed((signal) => fetch(art().getPublicUrl(n).data.publicUrl, { signal }))
          )
        );
        if (!files.every((r) => r.ok)) return { ok: false };
        const [full, thumb] = await Promise.all(files.map((r) => r.blob()));
        if (!full || !thumb) return { ok: false };
        if (!(await uploaded(name, full)).ok) return { ok: false };
        if (!(await uploaded(thumbOf(name), thumb)).ok) return { ok: false };
        return { ok: true, name };
      } catch {
        return { ok: false };
      }
    },
    removeItem: (id) => homebrewRemove('homebrew_items', id),
    removeItems: (ids) =>
      written(() =>
        timed((signal) =>
          client.rest.rpc('delete_homebrew_items', { p_ids: [...ids] }).abortSignal(signal)
        )
      ),
    createCard: (row) => homebrewCreate('homebrew_cards', row),
    updateCard: (id, patch, revision) =>
      homebrewUpdate(
        'homebrew_cards',
        id,
        { content: patch.content, book_id: patch.book_id },
        revision
      ),
    removeCard: (id) => homebrewRemove('homebrew_cards', id),
    async import(rows) {
      try {
        const answer = await timed(
          (signal) =>
            client.rest
              .rpc('import_homebrew', {
                p_books: rows.books,
                p_cards: rows.cards,
                p_items: rows.items,
                p_update: rows.update
              })
              .abortSignal(signal),
          IMPORT_TIMEOUT_MS
        );
        if (answer.error?.code === '57014')
          return { ok: false, error: 'refused', reason: 'tooSlow' };
        const failed = writeOf(answer);
        if (!failed.ok) return failed;
        return importedOf(answer.data) ?? { ok: false, error: 'refused' };
      } catch {
        return { ok: false, error: 'network' };
      }
    },
    async moveItems(items, bookId, section) {
      try {
        return movedOf(
          await timed((signal) =>
            client.rest
              .rpc('move_homebrew_items', {
                p_items: items,
                p_book: bookId,
                p_section: section
              })
              .abortSignal(signal)
          )
        );
      } catch {
        return NETWORK;
      }
    }
  };
  /* Signed out, neither function is the caller's to run (anon may not execute them), so
     neither is called: a make reads as a lapsed session, a read as a set that opens nothing. */
  const prints: PrintSetRepository = {
    async create(entries) {
      if (!(await userId())) return { ok: false, error: 'network' };
      try {
        const answer = await timed((signal) =>
          client.rest.rpc('create_print_set', { p_entries: entries }).abortSignal(signal)
        );
        const failed = writeOf(answer);
        if (!failed.ok) return failed;
        const id: unknown = answer.data;
        return typeof id === 'string' ? { ok: true, id } : { ok: false, error: 'refused' };
      } catch {
        return { ok: false, error: 'network' };
      }
    },
    async read(id) {
      if (!(await userId())) return { ok: true, set: null };
      try {
        const answer = await timed((signal) =>
          client.rest.rpc('get_print_set', { p_id: id }).abortSignal(signal)
        );
        if (answer.error) return { ok: false };
        const set: unknown = answer.data;
        return { ok: true, set: set ?? null };
      } catch {
        return { ok: false };
      }
    }
  };
  return { auth, prefs, lists, shares, events, requests, homebrew, prints };
}
