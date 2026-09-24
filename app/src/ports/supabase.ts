/* The real `CloudPort`: Supabase Auth through supabase-js.
 *
 * The only module that imports `@supabase/supabase-js` (ESLint enforces it);
 * `main.ts` loads it as a lazy chunk after first paint, and only in a build
 * with the two `VITE_SUPABASE_*` values (docs/DECISIONS.md, "The account
 * client loads after first paint"). The provider redirect is read before
 * mount by `redirect.ts`, so supabase-js's own URL detection is off - it
 * would race the router. docs/specs/FEATURES.md, "Account". */

import { createClient, type User, type UserIdentity } from '@supabase/supabase-js';
import { callbackUrl, saveReturn, type Redirect, type RedirectWindow } from './redirect.js';
import type {
  AuthError,
  AuthPort,
  AuthRedirect,
  AuthResult,
  CloudPort,
  Identity,
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

export function createCloud(
  url: string,
  key: string,
  redirect: Redirect | null,
  win: RedirectWindow = window
): CloudPort {
  const client = createClient(url, key, {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true
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
      return error ? refuse(linkError(error.code)) : OK;
    } catch {
      return refuse('failed');
    }
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
      const all = (await allIdentities()) ?? [];
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
  return { auth };
}
