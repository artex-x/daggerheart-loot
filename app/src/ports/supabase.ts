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
import { readPrefs } from '../lib/prefs.js';
import { callbackUrl, saveReturn, type Redirect, type RedirectWindow } from './redirect.js';
import type {
  AuthError,
  AuthPort,
  AuthRedirect,
  AuthResult,
  CloudPort,
  Identity,
  PreferencesPort,
  Provider,
  Session
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

  async function leave(kind: 'signIn' | 'link', provider: Provider): Promise<AuthResult> {
    saveReturn(win, { hash: win.location.hash || '#/account', kind, provider });
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
    signIn: (provider) => leave('signIn', provider),
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
      const { kind, provider } = redirect;
      if (redirect.error) return { kind, provider, result: refuse(linkError(redirect.error)) };
      if (!exchanged) return null;
      return { kind, provider, result: await exchanged };
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
  return { auth, prefs };
}
