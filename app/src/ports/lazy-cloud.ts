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
  ListRepository,
  ListsRead,
  ListWrite,
  PreferencesPort,
  PrefsRead,
  Session,
  SharedRead,
  ShareRepository,
  SharesRead
} from './types.js';

const FAILED: AuthResult = { ok: false, error: 'failed' };
const UNREAD: PrefsRead = { ok: false };
const UNLISTED: ListsRead = { ok: false };
/* A chunk that never arrived sent nothing, so the write may be sent again. */
const UNSENT: ListWrite = { ok: false, error: 'network' };
const NO_SHARES: SharesRead = { ok: false };
const UNSHARED: SharedRead = { ok: false };

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
    signIn: async (p, after) => (await port())?.auth.signIn(p, after) ?? FAILED,
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
  /* `newId()` answers before the chunk loads: the store makes an id the
     moment a list is created. */
  const lists: ListRepository = {
    newId: () => crypto.randomUUID(),
    list: async () => (await port())?.lists.list() ?? UNLISTED,
    create: async (l, e) => (await port())?.lists.create(l, e) ?? UNSENT,
    update: async (id, patch) => (await port())?.lists.update(id, patch) ?? UNSENT,
    addEntries: async (id, e) => (await port())?.lists.addEntries(id, e) ?? UNSENT,
    updateEntry: async (id, patch) => (await port())?.lists.updateEntry(id, patch) ?? UNSENT,
    removeEntries: async (ids) => (await port())?.lists.removeEntries(ids) ?? UNSENT,
    reorder: async (id, ids) => (await port())?.lists.reorder(id, ids) ?? UNSENT,
    remove: async (id) => (await port())?.lists.remove(id) ?? UNSENT
  };
  const shares: ShareRepository = {
    list: async (id) => (await port())?.shares.list(id) ?? NO_SHARES,
    create: async (id, audience) =>
      (await port())?.shares.create(id, audience) ?? { ok: false, error: 'network' },
    revoke: async (id) => (await port())?.shares.revoke(id) ?? UNSENT,
    read: async (token) => (await port())?.shares.read(token) ?? UNSHARED,
    ownerOf: async (token) => (await port())?.shares.ownerOf(token) ?? null,
    clone: async (token, id) => (await port())?.shares.clone(token, id) ?? UNSENT
  };
  return { auth, prefs, lists, shares };
}
