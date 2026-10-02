/* An in-memory `CloudPort` for the test build and for unit tests.
 *
 * Only `vite build --mode test` reaches this module (main.ts, a dynamic
 * import behind a build-time constant); `tools/no-fake-in-prod.mjs` proves
 * `dist/` never holds it by the marker below. docs/specs/COVERAGE.md,
 * "Test layers". */

import {
  entryOrder,
  type EntryPatch,
  type EntryRow,
  type ListOp,
  type ListPatch,
  type ListRow,
  type NewListRow,
  type ShareAudience,
  type SharedRow,
  type ShareRow
} from '../lib/cloudLists.js';
import {
  bookProblems,
  canonJson,
  cardProblems,
  contentProblems,
  isHomebrewKey,
  recordOf,
  SNAPSHOT_BYTES,
  snapshotValid,
  type BookRow,
  type CardRow,
  type ItemRow
} from '../lib/homebrew.js';
import type { Prefs } from '../lib/prefs.js';
import type { RequestLine, ShortLine } from '../lib/requests.js';
import {
  SEED,
  uuid,
  type Seed,
  type SeedBook,
  type SeedCard,
  type SeedItem,
  type SeedList,
  type SeedUser
} from './fake-cloud-seed.js';
import type {
  AuthError,
  AuthPort,
  AuthRedirect,
  CloudPort,
  EventsPort,
  HomebrewRepository,
  HomebrewSaved,
  Identity,
  ListOpResult,
  ListRepository,
  ListWrite,
  ListWrites,
  LiveStatus,
  MoveWrite,
  PreferencesPort,
  RequestApplied,
  RequestRepository,
  RequestSent,
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
  /** The count limits in place of the database defaults (50 lists, 100 entries, 20
   *  homebrew sources, 100 homebrew items, 100 homebrew cards, 10 pending requests per
   *  list, 100 lines per request). */
  limits?: {
    lists?: number;
    entries?: number;
    books?: number;
    items?: number;
    cards?: number;
    pending?: number;
    lines?: number;
  };
  /** Whether a subscribe joins (default `true`); `false` keeps every feed on the poll. */
  live?: boolean;
}

/** The fake, plus the test build's switches and counters, which are not part of
 *  `CloudPort`. */
export type FakeCloud = CloudPort & {
  setOffline(on: boolean): void;
  /** `true`: every `apply` call answers `fault`; a function: a call answers `fault` while
   *  any of its writes matches, as a write that alone fails the call; `false`: off. */
  setFault(match: boolean | ((op: ListOp) => boolean)): void;
  /** The `apply` calls answered since the port was made, faulted ones included. */
  writeCount(): number;
  /** The writes inside the `apply` calls that were applied. */
  opCount(): number;
  /** Off: every joined topic reports `down` and no subscribe joins; on: the next one joins. */
  setLive(on: boolean): void;
  /** Edits any user's list as another device would, with its messages; false for an
   *  unknown list. */
  play(listId: string, patch: ListPatch): boolean;
  /** Sends a purchase request as another reader of the link would, with its message;
   *  answers the new request's id, or null when the send rules refuse it. */
  request(token: string, lines: { item: string; qty: number }[]): string | null;
  /** Applies (taking what is there) or declines any user's pending request as the owner's
   *  other device would, with its messages; false for an unknown or decided request. */
  decide(id: string, verdict: 'applied' | 'declined'): boolean;
};

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
      updated_at: iso(boot - l.editedAgoMs),
      revision: 1,
      legacy_fingerprint: null
    },
    entries: l.entries.map((e) => ({
      id: e.id,
      item_key: e.itemKey,
      source: e.source ?? 'official',
      snapshot: e.snapshot ? structuredClone(e.snapshot) : null,
      position: e.position,
      quantity: e.qty ?? 1,
      price_coins: e.gold ?? null,
      player_note: e.note ?? '',
      gm_note: e.hnote ?? ''
    }))
  }));
}

/** An account's homebrew as the fake holds it. */
interface HeldHomebrew {
  books: BookRow[];
  items: ItemRow[];
  cards: CardRow[];
}

function seedHomebrew(
  h: { books: readonly SeedBook[]; items: readonly SeedItem[]; cards: readonly SeedCard[] },
  boot: number
): HeldHomebrew {
  return {
    books: h.books.map((b) => ({
      id: b.id,
      key: b.key,
      content: structuredClone(b.content),
      revision: 1,
      created_at: iso(boot - b.createdAgoMs),
      updated_at: iso(boot - b.editedAgoMs)
    })),
    items: h.items.map((i) => ({
      id: i.id,
      key: i.key,
      book_id: i.bookId ?? null,
      content: structuredClone(i.content),
      revision: 1,
      created_at: iso(boot - i.createdAgoMs),
      updated_at: iso(boot - i.editedAgoMs)
    })),
    cards: h.cards.map((c) => ({
      id: c.id,
      key: c.key,
      kind: c.kind,
      book_id: c.bookId ?? null,
      content: structuredClone(c.content),
      revision: 1,
      created_at: iso(boot - c.createdAgoMs),
      updated_at: iso(boot - c.editedAgoMs)
    }))
  };
}

const BASE32 = 'abcdefghijklmnopqrstuvwxyz234567';
const utf8 = new TextEncoder();

/** A moved list's text as `move_legacy_list` reads it. */
interface Canonical {
  name?: string;
  ids: string[];
  meta?: Record<string, { qty?: number; gold?: number; note?: string; hnote?: string }>;
  money?: 'bag' | 'coin';
  note?: string;
  hnote?: string;
}

const ID = /^[A-Za-z0-9_-]{1,64}$/;
const chars = (s: string): number => Array.from(s).length;
const textUpTo = (v: unknown, max: number): boolean => typeof v === 'string' && chars(v) <= max;
const whole = (v: unknown, lo: number, hi: number): boolean =>
  typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi;

/* The checks `move_legacy_list` makes; null where it raises `22023`. */
function canonicalOf(text: string): Canonical | null {
  let v: unknown;
  try {
    v = JSON.parse(text);
  } catch {
    return null;
  }
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  const keys = ['name', 'ids', 'meta', 'money', 'note', 'hnote'];
  if (Object.keys(o).some((k) => !keys.includes(k))) return null;
  if ('name' in o && !textUpTo(o['name'], 200)) return null;
  if ('money' in o && o['money'] !== 'bag' && o['money'] !== 'coin') return null;
  if ('note' in o && !textUpTo(o['note'], 4000)) return null;
  if ('hnote' in o && !textUpTo(o['hnote'], 4000)) return null;
  const ids = o['ids'];
  if (!Array.isArray(ids) || ids.length > 5000) return null;
  if (!ids.every((id) => typeof id === 'string' && ID.test(id))) return null;
  if (new Set(ids).size !== ids.length) return null;
  const meta = o['meta'];
  if ('meta' in o) {
    if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return null;
    for (const [key, m] of Object.entries(meta)) {
      if (!ids.includes(key) || !m || typeof m !== 'object' || Array.isArray(m)) return null;
      const e = m as Record<string, unknown>;
      if (Object.keys(e).some((k) => !['qty', 'gold', 'note', 'hnote'].includes(k)))
        return null;
      if ('qty' in e && !whole(e['qty'], 1, 99)) return null;
      if ('gold' in e && !whole(e['gold'], 1, 99999)) return null;
      if ('note' in e && !textUpTo(e['note'], 4000)) return null;
      if ('hnote' in e && !textUpTo(e['hnote'], 4000)) return null;
    }
  }
  return o as unknown as Canonical;
}

/* FNV-1a over the text, repeated to the 64 hex characters of a SHA-256: the
   fake never meets the database, so its fingerprint only has to be stable. */
function fingerprint(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0').repeat(8);
}

/** A share as the fake holds it: the row, its list and its live topic's key. */
interface HeldShare extends ShareRow {
  listId: string;
  topic_key: string;
}

/** The tab id the fake's writes carry; another device's are `other-device`. */
const TAB = 'fake-tab';
const SHARE_TOPIC = /^share:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

interface Subscriber {
  topic: string;
  on: { message(event: string, payload: unknown): void; status(s: LiveStatus): void };
  joined: boolean;
}

const OK: Extract<ListWrite, { ok: true }> = { ok: true };
const NETWORK: Extract<ListWrite, { error: 'network' }> = { ok: false, error: 'network' };
const REFUSED: Extract<ListWrite, { error: 'refused' }> = { ok: false, error: 'refused' };
/* `P0002` in `apply_list_writes`: the row is deleted or not the caller's. */
const GONE: ListOpResult = { ok: false, error: 'gone' };
const FAULT: ListWrites = { ok: false, error: 'fault' };
const limited = (key: string, value: number): Extract<ListWrite, { error: 'limit' }> => ({
  ok: false,
  error: 'limit',
  key,
  value
});

/* `import_lists` refuses a call of more lists (22023), whatever the account's limit. */
const IMPORT_LISTS_MAX = 1000;

/* `create_purchase_request`'s bounds: its constants and the `limit_defaults` rows. */
const HOUR_MS = 3_600_000;
const RATE_MS = 60_000;
const RATE_MAX = 5;

/** A purchase request as the fake holds it. */
interface HeldRequest {
  id: string;
  listId: string;
  shareId: string;
  audience: ShareAudience;
  status: 'pending' | 'applied' | 'declined';
  createdAt: number;
  expiresAt: number;
  lines: RequestLine[];
}

/* The lines `create_purchase_request` takes: an array of `{ item, qty }` with no item
   twice; other keys are ignored. */
function linesOk(lines: unknown): lines is { item: string; qty: number }[] {
  if (!Array.isArray(lines) || !lines.length) return false;
  const seen = new Set<string>();
  for (const l of lines as unknown[]) {
    if (!l || typeof l !== 'object' || Array.isArray(l)) return false;
    const { item, qty } = l as Record<string, unknown>;
    if (typeof item !== 'string' || !ID.test(item) || !whole(qty, 1, 99)) return false;
    if (seen.has(item)) return false;
    seen.add(item);
  }
  return true;
}

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
  const homebrewHeld = new Map<string, HeldHomebrew>(
    Object.entries(seed.homebrew).map(([k, h]): [string, HeldHomebrew] => [
      k,
      seedHomebrew(h, boot)
    ])
  );
  let offline = options.offline ?? false;
  /* The purchase requests of every user's lists. */
  let purchases: HeldRequest[] = [];
  /* `newId()` answers `uuid(5000)` first, so a golden's address is the same
     on every run. */
  let made = 5000;
  let lastStamp = 0;
  const maxLists = options.limits?.lists ?? 50;
  const maxEntries = options.limits?.entries ?? 100;
  const maxBooks = options.limits?.books ?? 20;
  const maxItems = options.limits?.items ?? 100;
  const maxCards = options.limits?.cards ?? 100;
  const maxPending = options.limits?.pending ?? 10;
  const maxLines = options.limits?.lines ?? 100;
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
      const gone = new Set((lists.get(current) ?? []).map((h) => h.row.id));
      purchases = purchases.filter((r) => !gone.has(r.listId));
      users.delete(current);
      rows.delete(current);
      lists.delete(current);
      homebrewHeld.delete(current);
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
  /* A change of the list or an entry, as `lists_before_update` sees it. */
  const touch = (h: Held): void => {
    h.row.updated_at = stamp();
    h.row.revision++;
  };
  /* The checks and the trigger of `list_entries`: an official entry carries no snapshot;
     a frozen copy's snapshot is valid, names the entry's key and fits the bound; a
     reference names an item its list's owner (`owner`, a seed user) holds. */
  const entryRefused = (e: EntryRow, owner: string | null): boolean => {
    if (e.source === 'official') return e.snapshot !== null;
    if (e.snapshot === null) {
      const held = owner === null ? undefined : homebrewHeld.get(owner);
      return !held?.items.some((i) => i.key === e.item_key);
    }
    const snap = e.snapshot as { id?: unknown };
    return (
      !snapshotValid(e.snapshot) ||
      snap.id !== e.item_key ||
      utf8.encode(JSON.stringify(e.snapshot)).length > SNAPSHOT_BYTES
    );
  };
  /* One list's new entries: an id already there is skipped; a record already
     in the list, an entry the checks refuse or the entry limit refuses the whole
     call. Every caller writes the current user's own lists. */
  const insertEntries = (h: Held, entries: EntryRow[]): ListOpResult => {
    const fresh = entries.filter((e) => !h.entries.some((x) => x.id === e.id));
    if (!fresh.length) return OK;
    const keys = new Set(h.entries.map((e) => e.item_key));
    for (const e of fresh) {
      if (keys.has(e.item_key) || entryRefused(e, current)) return REFUSED;
      keys.add(e.item_key);
    }
    if (h.entries.length + fresh.length > maxEntries) {
      return limited('entries_per_list', maxEntries);
    }
    h.entries.push(...fresh.map((e) => ({ ...e })));
    touch(h);
    return OK;
  };
  /* Every share write goes through here: offline and signed out answer
     `network`, as the real port reads a lapsed session. */
  const write = (run: (mine: Held[]) => ListWrite): Promise<ListWrite> => {
    const mine = offline ? null : own();
    return Promise.resolve(mine ? run(mine) : NETWORK);
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
     token `share-token-<n>`, so a golden reads the same on every run. A new
     share's topic key is `uuid(4100 + n)`, clear of every other range. */
  let shareRows: HeldShare[] = seed.shares.map((sh) => ({
    id: sh.id,
    listId: sh.listId,
    audience: sh.audience,
    token: sh.token,
    created_at: iso(boot),
    revoked_at: null,
    topic_key: sh.topicKey
  }));

  /* Realtime: the joined topics, and what the broadcast triggers send. */
  let live = options.live ?? true;
  const subscribers = new Set<Subscriber>();
  let messages = 0;
  const send = (topic: string, event: string, payload: Record<string, unknown>): void => {
    const id = String(++messages);
    queueMicrotask(() => {
      for (const sub of [...subscribers]) {
        if (sub.joined && sub.topic === topic) sub.on.message(event, { ...payload, id });
      }
    });
  };
  const userIdOf = (h: Held): string | null => {
    for (const [k, all] of lists) if (all.includes(h)) return users.get(k)?.id ?? null;
    return null;
  };
  /* The seed user who owns the list. */
  const ownerOf = (h: Held): string | null => {
    for (const [k, all] of lists) if (all.includes(h)) return k;
    return null;
  };
  /* An owner's item as `homebrew_snapshot_of` writes it; null for a key the owner
     does not hold. */
  const liveRecord = (owner: string | null, key: string): unknown => {
    const held = owner === null ? undefined : homebrewHeld.get(owner);
    const item = held?.items.find((i) => i.key === key);
    if (!held || !item) return null;
    const book = held.books.find((b) => b.id === item.book_id);
    return recordOf(
      item.key,
      item.content,
      book ? { ...book.content, key: book.key } : null,
      held.cards.map((c) => ({ ...c.content, key: c.key, kind: c.kind }))
    );
  };
  const activeShares = (listId: string): HeldShare[] =>
    shareRows.filter((sh) => sh.listId === listId && sh.revoked_at === null);
  /* Every list's revision, owner and active shares before a write. */
  interface Before {
    revision: number;
    owner: string | null;
    shares: HeldShare[];
  }
  const before = (): Map<string, Before> => {
    const all = new Map<string, Before>();
    for (const mine of lists.values()) {
      for (const h of mine) {
        all.set(h.row.id, {
          revision: h.row.revision,
          owner: userIdOf(h),
          shares: activeShares(h.row.id)
        });
      }
    }
    return all;
  };
  /* One owner message per changed list and one per active share, as the
     deferred trigger sends at commit; a list gone sends `null`. */
  const announce = (was: Map<string, Before>, by: string): void => {
    const seen = new Set<string>();
    for (const mine of lists.values()) {
      for (const h of mine) {
        seen.add(h.row.id);
        if (was.get(h.row.id)?.revision === h.row.revision) continue;
        const owner = userIdOf(h);
        if (owner)
          send('owner:' + owner, 'list', { list: h.row.id, revision: h.row.revision, by });
        for (const sh of activeShares(h.row.id)) {
          send('share:' + sh.topic_key, 'revision', { revision: h.row.revision });
        }
      }
    }
    for (const [id, b] of was) {
      if (seen.has(id)) continue;
      if (b.owner) send('owner:' + b.owner, 'list', { list: id, revision: null, by });
      for (const sh of b.shares) send('share:' + sh.topic_key, 'revision', { revision: null });
    }
  };
  const events: EventsPort = {
    tab: TAB,
    subscribe(topic, on) {
      const sub: Subscriber = { topic, on, joined: false };
      subscribers.add(sub);
      const mine = sessionOf(user());
      const allowed =
        SHARE_TOPIC.test(topic) || (mine !== null && topic === 'owner:' + mine.userId);
      queueMicrotask(() => {
        if (!subscribers.has(sub)) return;
        if (live && allowed && !offline) {
          sub.joined = true;
          on.status('live');
        } else {
          subscribers.delete(sub);
          on.status('down');
        }
      });
      return () => {
        subscribers.delete(sub);
      };
    }
  };
  /* The `apply` calls answered and the writes applied, and the fault switch. */
  let requests = 0;
  let applied = 0;
  let fault: boolean | ((op: ListOp) => boolean) = false;

  /* One write of `apply_list_writes`, as the function applies it: a refused
     write changes nothing, a refused create leaves no list. */
  const createList = (mine: Held[], list: NewListRow, entries: EntryRow[]): ListOpResult => {
    const h = find(mine, list.id);
    if (h) return insertEntries(h, entries);
    if ([...lists.values()].some((all) => find(all, list.id))) return REFUSED;
    if (mine.length >= maxLists) return limited('lists_per_owner', maxLists);
    const at = stamp();
    const made: Held = {
      row: { ...list, created_at: at, updated_at: at, revision: 1, legacy_fingerprint: null },
      entries: []
    };
    const r = insertEntries(made, entries);
    if (r.ok) mine.push(made);
    return r;
  };
  const updateList = (mine: Held[], id: string, patch: ListPatch): ListOpResult => {
    if (!Object.keys(patch).length) return OK;
    const h = find(mine, id);
    if (!h) return GONE;
    h.row = { ...h.row, ...patch };
    touch(h);
    return OK;
  };
  const updateEntry = (mine: Held[], entryId: string, patch: EntryPatch): ListOpResult => {
    if (!Object.keys(patch).length) return OK;
    for (const h of mine) {
      const at = h.entries.findIndex((e) => e.id === entryId);
      if (at < 0) continue;
      h.entries[at] = { ...(h.entries[at] as EntryRow), ...patch };
      touch(h);
      return OK;
    }
    return GONE;
  };
  const removeEntries = (mine: Held[], entryIds: readonly string[]): ListOpResult => {
    for (const h of mine) {
      const kept = h.entries.filter((e) => !entryIds.includes(e.id));
      if (kept.length === h.entries.length) continue;
      h.entries = kept;
      touch(h);
    }
    return OK;
  };
  const reorder = (mine: Held[], listId: string, entryIds: readonly string[]): ListOpResult => {
    const h = find(mine, listId);
    if (!h) return GONE;
    // reorder_list's rule: the given entries first, a repeated id once;
    // the entries not given follow in their (position, id) order.
    const have = new Set(h.entries.map((e) => e.id));
    const given = [...new Set(entryIds)].filter((id) => have.has(id));
    const rest = h.entries
      .filter((e) => !given.includes(e.id))
      .sort((x, y) => x.position - y.position || (x.id < y.id ? -1 : x.id > y.id ? 1 : 0))
      .map((e) => e.id);
    const order = [...given, ...rest];
    h.entries = h.entries.map((e) => ({ ...e, position: order.indexOf(e.id) }));
    touch(h);
    return OK;
  };
  const removeList = (mine: Held[], id: string): ListOpResult => {
    const at = mine.findIndex((h) => h.row.id === id);
    if (at >= 0) {
      mine.splice(at, 1);
      shareRows = shareRows.filter((sh) => sh.listId !== id);
      purchases = purchases.filter((r) => r.listId !== id);
    }
    return OK;
  };
  const applyOne = (mine: Held[], op: ListOp): ListOpResult => {
    switch (op.op) {
      case 'create':
        return createList(mine, op.list, op.entries);
      case 'update':
        return updateList(mine, op.id, op.patch);
      case 'remove':
        return removeList(mine, op.id);
      case 'add': {
        const h = find(mine, op.list_id);
        return h ? insertEntries(h, op.entries) : GONE;
      }
      case 'update_entry':
        return updateEntry(mine, op.id, op.patch);
      case 'remove_entries':
        return removeEntries(mine, op.ids);
      case 'reorder':
        return reorder(mine, op.list_id, op.ids);
    }
  };

  /* `move_legacy_list`: an entry id from its own counter, so the list ids
     `newId()` hands out stay `uuid(5000)`, `uuid(5001)`, ... whatever the
     entry counts. */
  let movedEntries = 0;
  const moveList = (mine: Held[], id: string, canonical: string): MoveWrite => {
    const v = canonicalOf(canonical);
    if (!v) return REFUSED;
    const fp = fingerprint(canonical);
    const had = mine.find((h) => h.row.legacy_fingerprint === fp);
    if (had) return { ok: true, id: had.row.id, inserted: false };
    if (anyList(id)) return REFUSED;
    const at = stamp();
    mine.push({
      row: {
        id,
        name: v.name ?? '',
        money_mode: v.money ?? 'bag',
        player_note: v.note ?? '',
        gm_note: v.hnote ?? '',
        created_at: at,
        updated_at: at,
        revision: 1,
        legacy_fingerprint: fp
      },
      entries: v.ids.map((key, i) => {
        const m = v.meta?.[key] ?? {};
        return {
          id: uuid(7000 + movedEntries++),
          item_key: key,
          source: 'official',
          snapshot: null,
          position: i,
          quantity: m.qty ?? 1,
          price_coins: m.gold ?? null,
          player_note: m.note ?? '',
          gm_note: m.hnote ?? ''
        };
      })
    });
    return { ok: true, id, inserted: true };
  };

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
        })),
        listLimit: maxLists,
        entryLimit: maxEntries
      });
    },
    apply(ops) {
      /* The real port makes no call for no writes, offline or signed out too. */
      if (!ops.length) return Promise.resolve({ ok: true, results: [] });
      const mine = offline ? null : own();
      if (!mine) return Promise.resolve(NETWORK);
      requests++;
      if (fault === true || (fault && ops.some(fault))) return Promise.resolve(FAULT);
      applied += ops.length;
      const was = before();
      const results = ops.map((op) => applyOne(mine, op));
      announce(was, TAB);
      return Promise.resolve({ ok: true, results });
    },
    /* Offline and signed out answer `network`, as the real port reads `28000`;
       the count limits are skipped, as the RPC skips them. */
    move(id, canonical) {
      const mine = offline ? null : own();
      if (!mine) return Promise.resolve(NETWORK);
      const was = before();
      const moved = moveList(mine, id, canonical);
      announce(was, TAB);
      return Promise.resolve(moved);
    },
    /* `import_lists`: each row as a create, on a copy of the owner's lists that replaces
       them only when every row landed - one transaction, every list or none. */
    import(rows) {
      const mine = offline ? null : own();
      if (!mine) return Promise.resolve(NETWORK);
      if (rows.length > IMPORT_LISTS_MAX || rows.some((r) => r.entries.length > 5000)) {
        return Promise.resolve(REFUSED);
      }
      const copy = mine.map((h) => ({
        row: { ...h.row },
        entries: h.entries.map((e) => ({ ...e }))
      }));
      for (const r of rows) {
        const made = createList(copy, r.list, r.entries);
        if (!made.ok) return Promise.resolve(made.error === 'gone' ? REFUSED : made);
      }
      const was = before();
      mine.splice(0, mine.length, ...copy);
      announce(was, TAB);
      return Promise.resolve(OK);
    }
  };

  let shared = 0;
  const shareWrite = (run: (mine: Held[]) => ShareMade): Promise<ShareMade> => {
    const mine = offline ? null : own();
    return Promise.resolve(mine ? run(mine) : NETWORK);
  };
  const newShare = (listId: string, audience: ShareAudience): ShareMade => {
    shared++;
    const sh: HeldShare = {
      id: uuid(3000 + shared),
      listId,
      audience,
      token: 'share-token-' + String(shared),
      created_at: stamp(),
      revoked_at: null,
      topic_key: uuid(4100 + shared)
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
      revision: h.row.revision,
      topic_key: sh.topic_key,
      list: {
        name: h.row.name,
        money_mode: h.row.money_mode,
        player_note: h.row.player_note,
        ...(gm ? { gm_note: h.row.gm_note } : {})
      },
      entries: [...h.entries].sort(entryOrder).map((e) => {
        const { gm_note, ...rest } = e;
        if (e.source === 'homebrew' && e.snapshot === null) {
          rest.snapshot = liveRecord(ownerOf(h), e.item_key);
        }
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
          send('share:' + sh.topic_key, 'revision', { revision: null });
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
        if (p.entries.length > maxEntries) return limited('entries_per_list', maxEntries);
        /* Decided from the held entry, not from the projection, which fills a
           reference's snapshot: a reference stays one only for the list's owner; a
           frozen entry stays frozen for everyone. */
        const sh = shareRows.find((x) => x.token === token && x.revoked_at === null);
        const source = sh ? anyList(sh.listId) : undefined;
        const ownsSource = source !== undefined && ownerOf(source) === current;
        const copied: EntryRow[] = p.entries.map((e) => {
          const held = source?.entries.find((x) => x.id === e.id);
          const reference = held?.source === 'homebrew' && held.snapshot === null;
          return {
            ...e,
            id: uuid(made++),
            snapshot: reference && ownsSource ? null : (held?.snapshot ?? e.snapshot),
            gm_note: e.gm_note ?? ''
          };
        });
        if (copied.some((e) => entryRefused(e, current))) return REFUSED;
        const was = before();
        const at = stamp();
        mine.push({
          row: {
            id,
            name: p.list.name,
            money_mode: p.list.money_mode,
            player_note: p.list.player_note,
            gm_note: p.list.gm_note ?? '',
            created_at: at,
            updated_at: at,
            revision: 1,
            legacy_fingerprint: null
          },
          entries: copied
        });
        announce(was, TAB);
        return OK;
      })
  };

  /* Purchase requests, with the database's rules (docs/specs/FEATURES.md, "Account and
     browser lists"); times from `Date.now()`, so a unit test moves them with its clock.
     A request the driver makes is `uuid(6000 + n)`, a range no other fake id uses. */
  let asked = 0;
  const pendingOf = (listId: string, now: number): HeldRequest[] =>
    purchases.filter((r) => r.listId === listId && r.status === 'pending' && r.expiresAt > now);
  const requestSend = (id: string, token: string, lines: unknown): RequestSent => {
    const sh = shareRows.find((x) => x.token === token && x.revoked_at === null);
    const h = sh ? anyList(sh.listId) : undefined;
    if (!sh || !h) return { ok: false, error: 'gone' };
    const had = purchases.find((r) => r.id === id);
    if (had) return had.shareId === sh.id ? OK : { ok: false, error: 'gone' };
    if (!linesOk(lines)) return REFUSED;
    if (lines.length > maxLines) return limited('request_lines', maxLines);
    const stock = new Map(h.entries.map((e) => [e.item_key, e]));
    if (lines.some((l) => !stock.has(l.item))) return { ok: false, error: 'stale' };
    const now = Date.now();
    const recent = purchases.filter((r) => r.shareId === sh.id && r.createdAt > now - RATE_MS);
    if (recent.length >= RATE_MAX) return limited('request_rate', RATE_MAX);
    if (pendingOf(h.row.id, now).length >= maxPending) {
      return limited('pending_requests_per_list', maxPending);
    }
    purchases.push({
      id,
      listId: h.row.id,
      shareId: sh.id,
      audience: sh.audience,
      status: 'pending',
      createdAt: now,
      expiresAt: now + HOUR_MS,
      lines: lines.map((l) => ({
        item: l.item,
        qty: l.qty,
        price: stock.get(l.item)?.price_coins ?? null,
        applied: null
      }))
    });
    const owner = userIdOf(h);
    if (owner) send('owner:' + owner, 'request', { list: h.row.id, by: null });
    return OK;
  };
  /* `apply_purchase_request` after its checks: stock by item, short, clamp, an entry
     taken to zero deleted and the list renumbered. */
  const applyHeld = (r: HeldRequest, h: Held, clamp: boolean, by: string): RequestApplied => {
    const qtyOf = (item: string): number =>
      h.entries.find((e) => e.item_key === item)?.quantity ?? 0;
    const short: ShortLine[] = r.lines
      .filter((l) => l.qty > qtyOf(l.item))
      .map((l) => ({ item: l.item, want: l.qty, have: qtyOf(l.item) }))
      .sort((a, b) => (a.item < b.item ? -1 : 1));
    if (short.length && (!clamp || r.lines.every((l) => qtyOf(l.item) === 0))) {
      return { ok: false, error: 'short', short };
    }
    const was = before();
    const lines = r.lines.map((l) => ({ ...l, applied: Math.min(l.qty, qtyOf(l.item)) }));
    const taken = lines.reduce((sum, l) => sum + l.applied, 0);
    const emptied = new Set(
      lines.filter((l) => l.applied > 0 && l.applied === qtyOf(l.item)).map((l) => l.item)
    );
    h.entries = h.entries
      .filter((e) => !emptied.has(e.item_key))
      .map((e) => {
        const l = lines.find((x) => x.item === e.item_key);
        return l ? { ...e, quantity: e.quantity - l.applied } : e;
      });
    r.lines = lines;
    if (emptied.size) reorder([h], h.row.id, []);
    else touch(h);
    r.status = 'applied';
    announce(was, by);
    const owner = userIdOf(h);
    if (owner) send('owner:' + owner, 'request', { list: h.row.id, by });
    return { ok: true, taken };
  };
  const declineHeld = (r: HeldRequest, h: Held, by: string): void => {
    r.status = 'declined';
    const owner = userIdOf(h);
    if (owner) send('owner:' + owner, 'request', { list: h.row.id, by });
  };
  /* The checks apply and decline share: the caller's own list, pending, not expired. */
  type Undecidable = { ok: false; error: 'network' | 'gone' | 'decided' | 'expired' };
  const decidable = (id: string): { r: HeldRequest; h: Held } | Undecidable => {
    const mine = offline ? null : own();
    if (!mine) return NETWORK;
    const r = purchases.find((x) => x.id === id);
    const h = r ? find(mine, r.listId) : undefined;
    if (!r || !h) return { ok: false, error: 'gone' };
    if (r.status !== 'pending') return { ok: false, error: 'decided' };
    if (Date.now() >= r.expiresAt) return { ok: false, error: 'expired' };
    return { r, h };
  };
  const requestRepo: RequestRepository = {
    list() {
      const mine = offline ? null : own();
      if (!mine) return Promise.resolve({ ok: false });
      const ids = new Set(mine.map((h) => h.row.id));
      return Promise.resolve({
        ok: true,
        requests: purchases
          .filter((r) => r.status === 'pending' && ids.has(r.listId))
          .map((r) => ({
            id: r.id,
            listId: r.listId,
            audience: r.audience,
            createdAt: iso(r.createdAt),
            expiresAt: iso(r.expiresAt),
            lines: r.lines.map((l) => ({ ...l }))
          }))
      });
    },
    send(id, token, lines) {
      return Promise.resolve(offline ? NETWORK : requestSend(id, token, lines));
    },
    apply(id, clamp) {
      const d = decidable(id);
      return Promise.resolve('r' in d ? applyHeld(d.r, d.h, clamp, TAB) : d);
    },
    decline(id) {
      const d = decidable(id);
      if (!('r' in d)) return Promise.resolve(d);
      declineHeld(d.r, d.h, TAB);
      return Promise.resolve(OK);
    }
  };

  /* The author's homebrew, with the database's rules
     (supabase/migrations/20260930130000_homebrew.sql and
     20261001130000_homebrew_relations.sql). `newKey()` counts from
     `hb_newaaaaaaaaaaaaa`, so a golden's key is the same on every run. */
  let keys = 0;
  const ownHomebrew = (): HeldHomebrew | null => {
    if (offline || current === null) return null;
    let mine = homebrewHeld.get(current);
    if (!mine) homebrewHeld.set(current, (mine = { books: [], items: [], cards: [] }));
    return mine;
  };
  const homebrewSaid = (): void => {
    const id = user()?.id;
    if (id) send('owner:' + id, 'homebrew', { by: TAB });
  };
  /* Every list of the current user that holds a reference to one of `itemKeys`, touched
     once, with its list messages. */
  const touchReferences = (itemKeys: readonly string[]): void => {
    const was = before();
    for (const h of (current === null ? undefined : lists.get(current)) ?? []) {
      const holds = h.entries.some(
        (e) => e.source === 'homebrew' && e.snapshot === null && itemKeys.includes(e.item_key)
      );
      if (holds) touch(h);
    }
    announce(was, TAB);
  };
  /* The keys of the current user's items that name the card `key` in `set` or `refs`. */
  const naming = (mine: HeldHomebrew, key: string): string[] =>
    mine.items
      .filter((i) => i.content.set === key || (i.content.refs ?? []).includes(key))
      .map((i) => i.key);
  const anyHolds = (pick: (h: HeldHomebrew) => { id: string }[], id: string): boolean =>
    [...homebrewHeld.values()].some((h) => pick(h).some((r) => r.id === id));
  const homebrewRepo: HomebrewRepository = {
    newId: () => uuid(made++),
    newKey() {
      let n = keys++;
      let tail = '';
      do {
        tail = (BASE32[n % 32] as string) + tail;
        n = Math.floor(n / 32);
      } while (n > 0);
      return 'hb_new' + tail.padStart(13, 'a');
    },
    load() {
      const mine = ownHomebrew();
      if (!mine) return Promise.resolve({ ok: false });
      return Promise.resolve({
        ok: true,
        books: structuredClone(mine.books),
        items: structuredClone(mine.items),
        cards: structuredClone(mine.cards),
        itemLimit: maxItems,
        bookLimit: maxBooks,
        cardLimit: maxCards
      });
    },
    createBook(row) {
      const mine = ownHomebrew();
      if (!mine) return Promise.resolve(NETWORK);
      /* An id any account holds inserts nothing and answers ok, as the adapter's
         upsert with ignoreDuplicates does. */
      if (anyHolds((h) => h.books, row.id)) return Promise.resolve(OK);
      if (!isHomebrewKey(row.key) || mine.books.some((b) => b.key === row.key)) {
        return Promise.resolve(REFUSED);
      }
      if (bookProblems(row.content).length) return Promise.resolve(REFUSED);
      if (mine.books.length >= maxBooks) {
        return Promise.resolve(limited('homebrew_books_per_owner', maxBooks));
      }
      const at = stamp();
      mine.books.push({ ...structuredClone(row), revision: 1, created_at: at, updated_at: at });
      homebrewSaid();
      return Promise.resolve(OK);
    },
    updateBook(id, content, revision): Promise<HomebrewSaved> {
      const mine = ownHomebrew();
      if (!mine) return Promise.resolve(NETWORK);
      const b = mine.books.find((x) => x.id === id);
      if (!b) return Promise.resolve({ ok: false, error: 'gone' });
      if (revision !== null && revision !== b.revision) {
        return Promise.resolve(
          canonJson(b.content) === canonJson(content)
            ? { ok: true, revision: b.revision }
            : { ok: false, error: 'conflict' }
        );
      }
      if (bookProblems(content).length) return Promise.resolve(REFUSED);
      b.content = structuredClone(content);
      b.revision++;
      b.updated_at = stamp();
      touchReferences(mine.items.filter((i) => i.book_id === id).map((i) => i.key));
      homebrewSaid();
      return Promise.resolve({ ok: true, revision: b.revision });
    },
    removeBook(id) {
      const mine = ownHomebrew();
      if (!mine) return Promise.resolve(NETWORK);
      const at = mine.books.findIndex((x) => x.id === id);
      if (at < 0) return Promise.resolve(OK);
      const moved = mine.items.filter((i) => i.book_id === id);
      for (const i of moved) {
        i.book_id = null;
        i.revision++;
        i.updated_at = stamp();
      }
      const movedCards = mine.cards.filter((c) => c.book_id === id);
      for (const c of movedCards) {
        c.book_id = null;
        c.revision++;
        c.updated_at = stamp();
      }
      touchReferences([
        ...moved.map((i) => i.key),
        ...movedCards.flatMap((c) => naming(mine, c.key))
      ]);
      mine.books.splice(at, 1);
      homebrewSaid();
      return Promise.resolve(OK);
    },
    createItem(row) {
      const mine = ownHomebrew();
      if (!mine) return Promise.resolve(NETWORK);
      if (anyHolds((h) => h.items, row.id)) return Promise.resolve(OK);
      if (!isHomebrewKey(row.key) || mine.items.some((i) => i.key === row.key)) {
        return Promise.resolve(REFUSED);
      }
      if (contentProblems(row.content, row.key).length) return Promise.resolve(REFUSED);
      if (row.book_id !== null && !mine.books.some((b) => b.id === row.book_id)) {
        return Promise.resolve(REFUSED);
      }
      if (mine.items.length >= maxItems) {
        return Promise.resolve(limited('homebrew_items_per_owner', maxItems));
      }
      const at = stamp();
      mine.items.push({ ...structuredClone(row), revision: 1, created_at: at, updated_at: at });
      homebrewSaid();
      return Promise.resolve(OK);
    },
    updateItem(id, patch, revision): Promise<HomebrewSaved> {
      const mine = ownHomebrew();
      if (!mine) return Promise.resolve(NETWORK);
      const i = mine.items.find((x) => x.id === id);
      if (!i) return Promise.resolve({ ok: false, error: 'gone' });
      if (revision !== null && revision !== i.revision) {
        const same =
          canonJson({ content: i.content, book_id: i.book_id }) ===
          canonJson({ content: patch.content, book_id: patch.book_id });
        return Promise.resolve(
          same ? { ok: true, revision: i.revision } : { ok: false, error: 'conflict' }
        );
      }
      if (contentProblems(patch.content, i.key).length) return Promise.resolve(REFUSED);
      if (patch.book_id !== null && !mine.books.some((b) => b.id === patch.book_id)) {
        return Promise.resolve(REFUSED);
      }
      i.content = structuredClone(patch.content);
      i.book_id = patch.book_id;
      i.revision++;
      i.updated_at = stamp();
      touchReferences([i.key]);
      homebrewSaid();
      return Promise.resolve({ ok: true, revision: i.revision });
    },
    removeItem(id) {
      const mine = ownHomebrew();
      if (!mine) return Promise.resolve(NETWORK);
      const at = mine.items.findIndex((x) => x.id === id);
      const i = mine.items[at];
      if (!i) return Promise.resolve(OK);
      const was = before();
      for (const h of (current === null ? undefined : lists.get(current)) ?? []) {
        const kept = h.entries.filter(
          (e) => !(e.source === 'homebrew' && e.snapshot === null && e.item_key === i.key)
        );
        if (kept.length === h.entries.length) continue;
        h.entries = kept;
        touch(h);
      }
      announce(was, TAB);
      mine.items.splice(at, 1);
      homebrewSaid();
      return Promise.resolve(OK);
    },
    createCard(row) {
      const mine = ownHomebrew();
      if (!mine) return Promise.resolve(NETWORK);
      if (anyHolds((h) => h.cards, row.id)) return Promise.resolve(OK);
      if (!isHomebrewKey(row.key) || mine.cards.some((c) => c.key === row.key)) {
        return Promise.resolve(REFUSED);
      }
      if (cardProblems(row.kind, row.content).length) return Promise.resolve(REFUSED);
      if (row.book_id !== null && !mine.books.some((b) => b.id === row.book_id)) {
        return Promise.resolve(REFUSED);
      }
      if (mine.cards.length >= maxCards) {
        return Promise.resolve(limited('homebrew_cards_per_owner', maxCards));
      }
      const at = stamp();
      mine.cards.push({ ...structuredClone(row), revision: 1, created_at: at, updated_at: at });
      touchReferences(naming(mine, row.key));
      homebrewSaid();
      return Promise.resolve(OK);
    },
    updateCard(id, patch, revision): Promise<HomebrewSaved> {
      const mine = ownHomebrew();
      if (!mine) return Promise.resolve(NETWORK);
      const c = mine.cards.find((x) => x.id === id);
      if (!c) return Promise.resolve({ ok: false, error: 'gone' });
      if (revision !== null && revision !== c.revision) {
        const same =
          canonJson({ content: c.content, book_id: c.book_id }) ===
          canonJson({ content: patch.content, book_id: patch.book_id });
        return Promise.resolve(
          same ? { ok: true, revision: c.revision } : { ok: false, error: 'conflict' }
        );
      }
      if (cardProblems(c.kind, patch.content).length) return Promise.resolve(REFUSED);
      if (patch.book_id !== null && !mine.books.some((b) => b.id === patch.book_id)) {
        return Promise.resolve(REFUSED);
      }
      c.content = structuredClone(patch.content);
      c.book_id = patch.book_id;
      c.revision++;
      c.updated_at = stamp();
      touchReferences(naming(mine, c.key));
      homebrewSaid();
      return Promise.resolve({ ok: true, revision: c.revision });
    },
    removeCard(id) {
      const mine = ownHomebrew();
      if (!mine) return Promise.resolve(NETWORK);
      const at = mine.cards.findIndex((x) => x.id === id);
      const c = mine.cards[at];
      if (!c) return Promise.resolve(OK);
      mine.cards.splice(at, 1);
      touchReferences(naming(mine, c.key));
      homebrewSaid();
      return Promise.resolve(OK);
    }
  };

  return {
    auth,
    prefs,
    lists: listRepo,
    shares: shareRepo,
    events,
    requests: requestRepo,
    homebrew: homebrewRepo,
    setLive(on) {
      live = on;
      if (on) return;
      for (const sub of [...subscribers]) {
        subscribers.delete(sub);
        if (sub.joined) sub.on.status('down');
      }
    },
    play(listId, patch) {
      const h = anyList(listId);
      if (!h) return false;
      const was = before();
      h.row = { ...h.row, ...patch };
      touch(h);
      announce(was, 'other-device');
      return true;
    },
    request(token, lines) {
      const id = uuid(6000 + asked);
      if (!requestSend(id, token, lines).ok) return null;
      asked++;
      return id;
    },
    decide(id, verdict) {
      const r = purchases.find((x) => x.id === id);
      const h = r ? anyList(r.listId) : undefined;
      if (!r || !h || r.status !== 'pending' || Date.now() >= r.expiresAt) return false;
      if (verdict === 'declined') {
        declineHeld(r, h, 'other-device');
        return true;
      }
      return applyHeld(r, h, true, 'other-device').ok;
    },
    setOffline(on) {
      offline = on;
    },
    setFault(match) {
      fault = match;
    },
    writeCount: () => requests,
    opCount: () => applied
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
