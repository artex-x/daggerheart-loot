/* An in-memory `CloudPort` for the test build and for unit tests.
 *
 * Only `vite build --mode test` reaches this module (main.ts, a dynamic
 * import behind a build-time constant); `tools/no-fake-in-prod.mjs` proves
 * `dist/` never holds it by the marker below. docs/specs/COVERAGE.md,
 * "Test layers". */

import { SEED, uuid, type Seed, type SeedUser } from './fake-cloud-seed.js';
import type {
  AuthError,
  AuthPort,
  AuthRedirect,
  CloudPort,
  Identity,
  Session
} from './types.js';

/** What a unit test can make the fake answer; the browser build sets none. */
export interface FakeCloudOptions {
  /** `link()` refuses with this and changes nothing. */
  linkError?: AuthError;
  /** What `redirectResult()` answers, as though a redirect had come back. */
  returned?: AuthRedirect;
}

/** The string the production-bundle guard looks for; renaming it without the
 *  guard makes the guard fail, not pass. */
const MARKER = 'dhloot-fake-cloud';

declare global {
  interface Window {
    __dhlootFake?: CloudPort & { marker: string };
  }
}

function copyUser(u: SeedUser): SeedUser {
  return { ...u, identities: u.identities.map((i) => ({ ...i })) };
}

export function fakeCloud(seed: Seed, as?: string, options: FakeCloudOptions = {}): CloudPort {
  const users = new Map<string, SeedUser>(
    Object.entries(seed.users).map(([k, u]) => [k, copyUser(u)])
  );
  if (as !== undefined && !users.has(as)) {
    throw new Error('fake cloud: unknown user "' + as + '"');
  }
  let current: string | null = as ?? null;
  /* Ids a link hands out, clear of the seed's own. */
  let next = 100;
  const listeners = new Set<(s: Session | null) => void>();

  const user = (): SeedUser | null => (current === null ? null : (users.get(current) ?? null));
  const sessionOf = (u: SeedUser | null): Session | null => {
    const first = u?.identities[0];
    return u && first ? { userId: u.id, email: u.email, provider: first.provider } : null;
  };
  const notify = (): void => {
    const s = sessionOf(user());
    for (const fn of listeners) fn(s);
  };

  const auth: AuthPort = {
    session: () => Promise.resolve(sessionOf(user())),
    identities: () =>
      Promise.resolve((user()?.identities ?? []).map((i): Identity => ({ ...i }))),
    signIn() {
      current = seed.defaultUser;
      notify();
      return Promise.resolve({ ok: true });
    },
    link(provider) {
      const u = user();
      if (!u) return Promise.resolve({ ok: false, error: 'failed' });
      if (options.linkError) return Promise.resolve({ ok: false, error: options.linkError });
      u.identities.push({ id: uuid(next++), provider, email: u.email });
      notify();
      return Promise.resolve({ ok: true });
    },
    unlink(identityId) {
      const u = user();
      const at = u ? u.identities.findIndex((i) => i.id === identityId) : -1;
      if (!u || at < 0) return Promise.resolve({ ok: false, error: 'failed' });
      if (u.identities.length === 1)
        return Promise.resolve({ ok: false, error: 'lastIdentity' });
      u.identities.splice(at, 1);
      notify();
      return Promise.resolve({ ok: true });
    },
    signOut() {
      current = null;
      notify();
      return Promise.resolve({ ok: true });
    },
    deleteAccount() {
      if (current === null) return Promise.resolve({ ok: false, error: 'failed' });
      users.delete(current);
      current = null;
      notify();
      return Promise.resolve({ ok: true });
    },
    onChange(fn) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    redirectResult: () => Promise.resolve(options.returned ?? null)
  };
  return { auth };
}

/** Builds the port from `?as=<user>` (signed out without it) and exposes it
 *  as `window.__dhlootFake` for the browser suites. The query stays in the
 *  address, so a reload keeps the session. */
export function installFakeCloud(search: string = window.location.search): CloudPort {
  const as = new URLSearchParams(search).get('as') ?? undefined;
  const port = fakeCloud(SEED, as);
  window.__dhlootFake = { marker: MARKER, ...port };
  return port;
}
