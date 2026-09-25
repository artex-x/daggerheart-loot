/* An in-memory `CloudPort` for the test build and for unit tests.
 *
 * Only `vite build --mode test` reaches this module (main.ts, a dynamic
 * import behind a build-time constant); `tools/no-fake-in-prod.mjs` proves
 * `dist/` never holds it by the marker below. docs/specs/COVERAGE.md,
 * "Test layers". */

import {
  entryOrder,
  type EntryRow,
  type ListRow,
  type ShareAudience,
  type SharedRow,
  type ShareRow
} from '../lib/cloudLists.js';
import type { Prefs } from '../lib/prefs.js';
import { SEED, uuid, type Seed, type SeedList, type SeedUser } from './fake-cloud-seed.js';
import type {
  AuthError,
  AuthPort,
  AuthRedirect,
  CloudPort,
  Identity,
  ListRepository,
  ListWrite,
  PreferencesPort,
  Session,
  ShareMade,
  ShareRepository
} from './types.js';

/** What a unit test can make the fake answer; the browser build sets none. */
export interface FakeCloudOptions {
  /** `link()` refuses with this and changes nothing. */
  linkError?: AuthError;
  /** What `redirectResult()` answers, as though a redirect had come back. */
  returned?: AuthRedirect;
  /** Starts with no network: every read fails and every write answers `network`. */
  offline?: boolean;
  /** The count limits in place of the database defaults (50 lists, 100 entries). */
  limits?: { lists?: number; entries?: number };
}

/** The fake, plus the test build's failure switch; the switch is not part of `CloudPort`. */
export type FakeCloud = CloudPort & { setOffline(on: boolean): void };

/** The string the production-bundle guard looks for; renaming it without the
 *  guard makes the guard fail, not pass. */
const MARKER = 'dhloot-fake-cloud';

declare global {
  interface Window {
    __dhlootFake?: FakeCloud & { marker: string };
  }
}

function copyUser(u: SeedUser): SeedUser {
  return { ...u, identities: u.identities.map((i) => ({ ...i })) };
}

const copyPrefs = (p: Prefs): Prefs => ({ ...p });

/** A list as the fake holds it: the row without its entries, and the entries. */
interface Held {
  row: Omit<ListRow, 'list_entries'>;
  entries: EntryRow[];
}

const iso = (ms: number): string => new Date(ms).toISOString();

function seedLists(lists: readonly SeedList[], boot: number): Held[] {
  return lists.map((l) => ({
    row: {
      id: l.id,
      name: l.name,
      money_mode: l.money ?? 'bag',
      player_note: l.note ?? '',
      gm_note: l.hnote ?? '',
      created_at: iso(boot - l.createdAgoMs),
      updated_at: iso(boot - l.editedAgoMs)
    },
    entries: l.entries.map((e) => ({
      id: e.id,
      item_key: e.itemKey,
      source: 'official',
      snapshot: null,
      position: e.position,
      quantity: e.qty ?? 1,
      price_coins: e.gold ?? null,
      player_note: e.note ?? '',
      gm_note: e.hnote ?? ''
    }))
  }));
}

/** A share as the fake holds it: the row and its list. */
interface HeldShare extends ShareRow {
  listId: string;
}

const OK: ListWrite = { ok: true };
const NETWORK: ListWrite = { ok: false, error: 'network' };
const REFUSED: ListWrite = { ok: false, error: 'refused' };
const limited = (key: string, value: number): ListWrite => ({
  ok: false,
  error: 'limit',
  key,
  value
});

export function fakeCloud(seed: Seed, as?: string, options: FakeCloudOptions = {}): FakeCloud {
  const users = new Map<string, SeedUser>(
    Object.entries(seed.users).map(([k, u]) => [k, copyUser(u)])
  );
  /* Each port keeps its own rows, so a save never reaches the seed or
     another port. */
  const rows = new Map<string, Prefs>(
    Object.entries(seed.users).flatMap(([k, u]): [string, Prefs][] =>
      u.prefs ? [[k, copyPrefs(u.prefs)]] : []
    )
  );
  if (as !== undefined && !users.has(as)) {
    throw new Error('fake cloud: unknown user "' + as + '"');
  }
  let current: string | null = as ?? null;
  /* Ids a link hands out, clear of the seed's own. */
  let next = 100;
  /* The seed's times are offsets back from here, so "edited N ago" reads
     the same on every run. */
  const boot = Date.now();
  const lists = new Map<string, Held[]>(
    Object.entries(seed.lists).map(([k, l]): [string, Held[]] => [k, seedLists(l, boot)])
  );
  let offline = options.offline ?? false;
  /* `newId()` answers `uuid(5000)` first, so a golden's address is the same
     on every run. */
  let made = 5000;
  let lastStamp = 0;
  const maxLists = options.limits?.lists ?? 50;
  const maxEntries = options.limits?.entries ?? 100;
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
      rows.delete(current);
      lists.delete(current);
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

  const prefs: PreferencesPort = {
    load() {
      if (current === null) return Promise.resolve({ ok: false });
      const row = rows.get(current);
      return Promise.resolve({ ok: true, prefs: row ? copyPrefs(row) : null });
    },
    save(p) {
      if (current === null) return Promise.resolve(false);
      rows.set(current, copyPrefs(p));
      return Promise.resolve(true);
    }
  };
  /* The owner's lists; row level security keeps a signed-out call away
     from every list. */
  const own = (): Held[] | null => {
    if (current === null) return null;
    let mine = lists.get(current);
    if (!mine) lists.set(current, (mine = []));
    return mine;
  };
  /* Strictly later than the last write, so two writes in one millisecond
     still read as two edits. */
  const stamp = (): string => {
    lastStamp = Math.max(Date.now(), lastStamp + 1);
    return iso(lastStamp);
  };
  /* One list's new entries: an id already there is skipped; a record already
     in the list or the entry limit refuses the whole call. */
  const insertEntries = (h: Held, entries: EntryRow[]): ListWrite => {
    const fresh = entries.filter((e) => !h.entries.some((x) => x.id === e.id));
    if (!fresh.length) return OK;
    const keys = new Set(h.entries.map((e) => e.item_key));
    for (const e of fresh) {
      if (keys.has(e.item_key)) return REFUSED;
      keys.add(e.item_key);
    }
    if (h.entries.length + fresh.length > maxEntries) {
      return limited('entries_per_list', maxEntries);
    }
    h.entries.push(...fresh.map((e) => ({ ...e })));
    h.row.updated_at = stamp();
    return OK;
  };
  /* Every list write goes through here: offline answers `network`, signed
     out `refused`. */
  const write = (run: (mine: Held[]) => ListWrite): Promise<ListWrite> => {
    if (offline) return Promise.resolve(NETWORK);
    const mine = own();
    return Promise.resolve(mine ? run(mine) : REFUSED);
  };
  const find = (mine: Held[], id: string): Held | undefined =>
    mine.find((h) => h.row.id === id);
  /* Any user's list: a share link opens every user's list. */
  const anyList = (id: string): Held | undefined => {
    for (const all of lists.values()) {
      const h = find(all, id);
      if (h) return h;
    }
    return undefined;
  };

  /* The seed's shares, made at boot; a new one is `uuid(3000 + n)` with the
     token `share-token-<n>`, so a golden reads the same on every run. */
  let shareRows: HeldShare[] = seed.shares.map((sh) => ({
    id: sh.id,
    listId: sh.listId,
    audience: sh.audience,
    token: sh.token,
    created_at: iso(boot),
    revoked_at: null
  }));
  const listRepo: ListRepository = {
    newId: () => uuid(made++),
    list() {
      const mine = own();
      if (offline || !mine) return Promise.resolve({ ok: false });
      return Promise.resolve({
        ok: true,
        lists: mine.map((h) => ({
          ...h.row,
          list_entries: h.entries.map((e) => ({ ...e })).sort(entryOrder)
        }))
      });
    },
    create: (list, entries) =>
      write((mine) => {
        let h = find(mine, list.id);
        if (!h) {
          if ([...lists.values()].some((all) => find(all, list.id))) return REFUSED;
          if (mine.length >= maxLists) return limited('lists_per_owner', maxLists);
          const at = stamp();
          h = { row: { ...list, created_at: at, updated_at: at }, entries: [] };
          mine.push(h);
        }
        return insertEntries(h, entries);
      }),
    update: (id, patch) =>
      write((mine) => {
        const h = find(mine, id);
        if (h) h.row = { ...h.row, ...patch, updated_at: stamp() };
        return OK;
      }),
    addEntries: (listId, entries) =>
      write((mine) => {
        const h = find(mine, listId);
        return h ? insertEntries(h, entries) : REFUSED;
      }),
    updateEntry: (entryId, patch) =>
      write((mine) => {
        for (const h of mine) {
          const at = h.entries.findIndex((e) => e.id === entryId);
          if (at < 0) continue;
          h.entries[at] = { ...(h.entries[at] as EntryRow), ...patch };
          h.row.updated_at = stamp();
        }
        return OK;
      }),
    removeEntries: (entryIds) =>
      write((mine) => {
        for (const h of mine) {
          const kept = h.entries.filter((e) => !entryIds.includes(e.id));
          if (kept.length === h.entries.length) continue;
          h.entries = kept;
          h.row.updated_at = stamp();
        }
        return OK;
      }),
    reorder: (listId, entryIds) =>
      write((mine) => {
        const h = find(mine, listId);
        if (!h) return REFUSED;
        const have = new Set(h.entries.map((e) => e.id));
        const same =
          entryIds.length === have.size &&
          new Set(entryIds).size === entryIds.length &&
          entryIds.every((id) => have.has(id));
        if (!same) return REFUSED;
        h.entries = h.entries.map((e) => ({ ...e, position: entryIds.indexOf(e.id) }));
        h.row.updated_at = stamp();
        return OK;
      }),
    remove: (id) =>
      write((mine) => {
        const at = mine.findIndex((h) => h.row.id === id);
        if (at >= 0) {
          mine.splice(at, 1);
          shareRows = shareRows.filter((sh) => sh.listId !== id);
        }
        return OK;
      })
  };

  let shared = 0;
  const shareWrite = (run: (mine: Held[]) => ShareMade): Promise<ShareMade> => {
    if (offline) return Promise.resolve({ ok: false, error: 'network' });
    const mine = own();
    return Promise.resolve(mine ? run(mine) : { ok: false, error: 'refused' });
  };
  const newShare = (listId: string, audience: ShareAudience): ShareMade => {
    shared++;
    const sh: HeldShare = {
      id: uuid(3000 + shared),
      listId,
      audience,
      token: 'share-token-' + String(shared),
      created_at: stamp(),
      revoked_at: null
    };
    shareRows = [...shareRows, sh];
    return { ok: true, id: sh.id, token: sh.token };
  };
  /* The share of one of the current user's lists, stopped or not. */
  const ownShare = (mine: Held[], shareId: string): HeldShare | undefined => {
    const sh = shareRows.find((x) => x.id === shareId);
    return sh && find(mine, sh.listId) ? sh : undefined;
  };
  /* `get_shared_list`: the audience's projection, or null for a stopped or
     unknown link or a deleted list. */
  const projection = (token: string): SharedRow | null => {
    const sh = shareRows.find((x) => x.token === token && x.revoked_at === null);
    const h = sh ? anyList(sh.listId) : undefined;
    if (!sh || !h) return null;
    const gm = sh.audience === 'gm';
    return {
      audience: sh.audience,
      updated_at: h.row.updated_at,
      list: {
        name: h.row.name,
        money_mode: h.row.money_mode,
        player_note: h.row.player_note,
        ...(gm ? { gm_note: h.row.gm_note } : {})
      },
      entries: [...h.entries].sort(entryOrder).map((e) => {
        const { gm_note, ...rest } = e;
        return gm ? { ...rest, gm_note } : rest;
      })
    };
  };

  const shareRepo: ShareRepository = {
    list(listId) {
      const mine = own();
      if (offline || !mine) return Promise.resolve({ ok: false });
      const rowsOf = find(mine, listId) ? shareRows.filter((x) => x.listId === listId) : [];
      return Promise.resolve({
        ok: true,
        shares: rowsOf.map((x): ShareRow => ({
          id: x.id,
          audience: x.audience,
          token: x.token,
          created_at: x.created_at,
          revoked_at: x.revoked_at
        }))
      });
    },
    create: (listId, audience) =>
      shareWrite((mine) => {
        if (!find(mine, listId)) return { ok: false, error: 'refused' };
        const active = shareRows.find(
          (x) => x.listId === listId && x.audience === audience && x.revoked_at === null
        );
        return active
          ? { ok: true, id: active.id, token: active.token }
          : newShare(listId, audience);
      }),
    revoke: (shareId) =>
      write((mine) => {
        const sh = ownShare(mine, shareId);
        if (!sh) return REFUSED;
        if (sh.revoked_at === null) {
          const at = stamp();
          shareRows = shareRows.map((x) => (x === sh ? { ...x, revoked_at: at } : x));
        }
        return OK;
      }),
    read(token) {
      if (offline) return Promise.resolve({ ok: false });
      return Promise.resolve({ ok: true, shared: projection(token) });
    },
    ownerOf(token) {
      const mine = own();
      if (offline || !mine) return Promise.resolve(null);
      const sh = shareRows.find((x) => x.token === token);
      return Promise.resolve(sh && find(mine, sh.listId) ? sh.listId : null);
    },
    clone: (token, id) =>
      write((mine) => {
        const p = projection(token);
        if (!p) return REFUSED;
        if (find(mine, id)) return OK;
        if (anyList(id)) return REFUSED;
        if (mine.length >= maxLists) return limited('lists_per_owner', maxLists);
        const at = stamp();
        mine.push({
          row: {
            id,
            name: p.list.name,
            money_mode: p.list.money_mode,
            player_note: p.list.player_note,
            gm_note: p.list.gm_note ?? '',
            created_at: at,
            updated_at: at
          },
          entries: p.entries.map((e) => ({ ...e, id: uuid(made++), gm_note: e.gm_note ?? '' }))
        });
        return OK;
      })
  };

  return {
    auth,
    prefs,
    lists: listRepo,
    shares: shareRepo,
    setOffline(on) {
      offline = on;
    }
  };
}

/** Builds the port from `?as=<user>` (signed out without it) and exposes it
 *  as `window.__dhlootFake` for the browser suites. The query stays in the
 *  address, so a reload keeps the session. */
export function installFakeCloud(search: string = window.location.search): FakeCloud {
  const as = new URLSearchParams(search).get('as') ?? undefined;
  const port = fakeCloud(SEED, as);
  window.__dhlootFake = { marker: MARKER, ...port };
  return port;
}
