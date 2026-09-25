/* The real `CloudPort`: Supabase Auth and the account's rows through
 * supabase-js.
 *
 * The only module that imports `@supabase/supabase-js` (ESLint enforces it);
 * `main.ts` loads it as a lazy chunk after first paint, and only in a build
 * with the two `VITE_SUPABASE_*` values (docs/DECISIONS.md, "The account
 * client loads after first paint"). The provider redirect is read before
 * mount by `redirect.ts`, so supabase-js's own URL detection is off - it
 * would race the router. docs/specs/FEATURES.md, "Account". */

import { createClient, type User, type UserIdentity } from '@supabase/supabase-js';
import {
  entryOrder,
  type EntryRow,
  type ListRow,
  type SharedRow,
  type ShareRow
} from '../lib/cloudLists.js';
import type { SignInAfter } from '../lib/pending.js';
import { readPrefs } from '../lib/prefs.js';
import { callbackUrl, saveReturn, type Redirect, type RedirectWindow } from './redirect.js';
import type {
  AuthError,
  AuthPort,
  AuthRedirect,
  AuthResult,
  CloudPort,
  Identity,
  ListRepository,
  ListWrite,
  PreferencesPort,
  Provider,
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

/** Returns a write's outcome: a limit trigger's `limit: <key>` (P0001, the limit in
 *  `details`), no answer or a server fault as `network`, any other error as `refused`. */
function writeOf(answer: Answer): ListWrite {
  const { error, status } = answer;
  if (!error) return WRITTEN;
  if (status === 0 || status >= 500 || !error.code) return NETWORK;
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

/* A thrown call never reached the database, so it may be sent again. */
async function written(call: () => PromiseLike<Answer>): Promise<ListWrite> {
  try {
    return writeOf(await call());
  } catch {
    return NETWORK;
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
  'id,name,money_mode,player_note,gm_note,created_at,updated_at,' +
  'list_entries(id,item_key,source,snapshot,position,quantity,price_coins,player_note,gm_note)';

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
  const client = createClient(url, key, {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
      ...(storage ? { storage } : {})
    }
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

  const entriesOf = (listId: string, entries: EntryRow[]) =>
    client.from('list_entries').upsert(
      entries.map((e) => ({ ...e, list_id: listId })),
      { onConflict: 'id', ignoreDuplicates: true }
    );

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
    async create(list, entries) {
      /* lists.owner_id has no default; its insert policy checks it against
         the session's user. */
      const owner = await userId();
      if (!owner) return { ok: false, error: 'refused' };
      const made = await written(() =>
        client
          .from('lists')
          .upsert({ ...list, owner_id: owner }, { onConflict: 'id', ignoreDuplicates: true })
      );
      if (!made.ok || !entries.length) return made;
      return written(() => entriesOf(list.id, entries));
    },
    update: (id, patch) => written(() => client.from('lists').update(patch).eq('id', id)),
    addEntries: (listId, entries) =>
      entries.length ? written(() => entriesOf(listId, entries)) : Promise.resolve(WRITTEN),
    updateEntry: (entryId, patch) =>
      written(() => client.from('list_entries').update(patch).eq('id', entryId)),
    removeEntries: (entryIds) =>
      written(() => client.from('list_entries').delete().in('id', entryIds)),
    reorder: (listId, entryIds) =>
      written(() => client.rpc('reorder_list', { p_list: listId, p_entries: entryIds })),
    remove: (id) => written(() => client.from('lists').delete().eq('id', id))
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
      made(() => client.rpc('create_list_share', { p_list: listId, p_audience: audience })),
    revoke: (shareId) => written(() => client.rpc('revoke_list_share', { p_share: shareId })),
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
      written(() => client.rpc('clone_shared_list', { p_token: token, p_id: id }))
  };
  return { auth, prefs, lists, shares };
}
