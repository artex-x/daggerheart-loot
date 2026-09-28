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
  EventsPort,
  ListRepository,
  ListsRead,
  ListWrite,
  PreferencesPort,
  PrefsRead,
  RequestRepository,
  RequestsRead,
  Session,
  SharedRead,
  ShareRepository,
  SharesRead
} from './types.js';

const FAILED: AuthResult = { ok: false, error: 'failed' };
const UNREAD: PrefsRead = { ok: false };
const UNLISTED: ListsRead = { ok: false };
/* A chunk that never arrived sent nothing, so the write may be sent again. */
const UNSENT: Extract<ListWrite, { error: 'network' }> = { ok: false, error: 'network' };
const NO_SHARES: SharesRead = { ok: false };
const UNSHARED: SharedRead = { ok: false };
const UNREQUESTED: RequestsRead = { ok: false };

export function lazyCloud(load: () => Promise<CloudPort>): CloudPort {
  let loading: Promise<CloudPort | null> | null = null;
  let loaded: CloudPort | null = null;
  const port = (): Promise<CloudPort | null> =>
    (loading ??= load().then(
      (p) => (loaded = p),
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
    apply: async (ops) => (await port())?.lists.apply(ops) ?? UNSENT,
    move: async (id, canonical) => (await port())?.lists.move(id, canonical) ?? UNSENT,
    import: async (rows) => (await port())?.lists.import(rows) ?? UNSENT
  };
  const shares: ShareRepository = {
    list: async (id) => (await port())?.shares.list(id) ?? NO_SHARES,
    create: async (id, audience) => (await port())?.shares.create(id, audience) ?? UNSENT,
    revoke: async (id) => (await port())?.shares.revoke(id) ?? UNSENT,
    read: async (token) => (await port())?.shares.read(token) ?? UNSHARED,
    ownerOf: async (token) => (await port())?.shares.ownerOf(token) ?? null,
    clone: async (token, id) => (await port())?.shares.clone(token, id) ?? UNSENT
  };
  /* A message arrives only through the loaded port, so its tab id is the one
     to compare with; before the load there is none. */
  const events: EventsPort = {
    get tab() {
      return loaded?.events.tab ?? '';
    },
    subscribe(topic, on) {
      let leave: (() => void) | null = null;
      let cancelled = false;
      void port().then((p) => {
        if (cancelled) return;
        if (p) leave = p.events.subscribe(topic, on);
        else on.status('down');
      });
      return () => {
        cancelled = true;
        leave?.();
      };
    }
  };
  const requests: RequestRepository = {
    list: async () => (await port())?.requests.list() ?? UNREQUESTED,
    send: async (id, token, lines) => (await port())?.requests.send(id, token, lines) ?? UNSENT,
    apply: async (id, clamp) => (await port())?.requests.apply(id, clamp) ?? UNSENT,
    decline: async (id) => (await port())?.requests.decline(id) ?? UNSENT
  };
  return { auth, prefs, lists, shares, events, requests };
}
