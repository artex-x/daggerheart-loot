/* A `CloudPort` whose implementation arrives later.
 *
 * `main.ts` mounts the app at once and hands it this; the Supabase client
 * is loaded on the first call, after first paint (docs/DECISIONS.md, "The
 * account client loads after first paint"). A chunk that never arrives -
 * offline, a deploy that replaced it - answers like a signed-out port that
 * refuses every change, so the page says "failed" rather than hanging. */

import type {
  AuthPort,
  AuthResult,
  CloudPort,
  PreferencesPort,
  PrefsRead,
  Session
} from './types.js';

const FAILED: AuthResult = { ok: false, error: 'failed' };
const UNREAD: PrefsRead = { ok: false };

export function lazyCloud(load: () => Promise<CloudPort>): CloudPort {
  let loading: Promise<CloudPort | null> | null = null;
  const port = (): Promise<CloudPort | null> =>
    (loading ??= load().then(
      (p) => p,
      () => null
    ));

  const auth: AuthPort = {
    session: async () => (await port())?.auth.session() ?? null,
    /* A port that never loaded is signed out; a loaded port's null (it could
       not read) passes through. */
    identities: async () => {
      const p = await port();
      return p ? p.auth.identities() : [];
    },
    signIn: async (p) => (await port())?.auth.signIn(p) ?? FAILED,
    link: async (p) => (await port())?.auth.link(p) ?? FAILED,
    unlink: async (id) => (await port())?.auth.unlink(id) ?? FAILED,
    signOut: async (scope) => (await port())?.auth.signOut(scope) ?? FAILED,
    deleteAccount: async () => (await port())?.auth.deleteAccount() ?? FAILED,
    redirectResult: async () => (await port())?.auth.redirectResult() ?? null,
    onChange(fn: (s: Session | null) => void) {
      let off: (() => void) | null = null;
      let cancelled = false;
      void port().then((p) => {
        if (p && !cancelled) off = p.auth.onChange(fn);
      });
      return () => {
        cancelled = true;
        off?.();
      };
    }
  };
  const prefs: PreferencesPort = {
    load: async () => (await port())?.prefs.load() ?? UNREAD,
    save: async (p) => (await port())?.prefs.save(p) ?? false
  };
  return { auth, prefs };
}
