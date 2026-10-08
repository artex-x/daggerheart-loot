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
  type LinkedRow,
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
  type BookRow,
  type CardRow,
  type HomebrewRecord,
  type ItemRow
} from '../lib/homebrew.js';
import type { Prefs } from '../lib/prefs.js';
import type { NoticeRow, RequestLine, ShortLine } from '../lib/requests.js';
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
  HomebrewImport,
  HomebrewMoved,
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
  /** Fills the signed-in user's homebrew to this many items with generated ones and sets
   *  the item limit to it: the test build's `?items=<n>`, the 300-item measure. */
  fillItems?: number;
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
  /** Edits one entry of any user's list as another device would, with its messages;
   *  false for an unknown list or key. */
  playEntry(listId: string, itemKey: string, patch: EntryPatch): boolean;
  /** Sends a purchase request as another reader of the link would, with its message;
   *  answers the new request's id, or null when the send rules refuse it. */
  request(token: string, lines: { item: string; qty: number }[]): string | null;
  /** Applies (taking what is there) or declines any user's pending request as the owner's
   *  other device would, with its messages; false for an unknown or decided request. */
  decide(id: string, verdict: 'applied' | 'declined'): boolean;
  /** A port of the same world signed in as `user`, or signed out without one: what one
   *  account writes another reads, as on the real project. */
  as(user?: string): CloudPort;
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
      hb_item: e.hbItem ?? null,
      position: e.position,
      quantity: e.qty ?? 1,
      price_coins: e.gold ?? null,
      player_note: e.note ?? '',
      gm_note: e.hnote ?? '',
      ...(e.gmOnly ? { gm_only: true } : {})
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

/* Generated items «Предмет 001» ... after the seeded ones: when the user holds a source,
   every third in its first source with no section, every third in that source's first
   section, the rest in «Хоумбрю». The texts hold no digit, so a digit query matches
   names only. */
function fillHomebrew(h: HeldHomebrew, to: number, boot: number): void {
  const first = [...h.books].sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
  const section = first?.content.sections?.[0]?.key;
  const n = to - h.items.length;
  for (let i = 0; i < n; i++) {
    let tail = '';
    for (let v = i, k = 0; k < 12; k++, v = Math.floor(v / 32))
      tail = BASE32.charAt(v % 32) + tail;
    const num = String(i + 1).padStart(3, '0');
    const place = first ? i % 3 : 2;
    const at = iso(boot - (n - i) * 3_600_000);
    h.items.push({
      id: uuid(20000 + i),
      key: 'hb_fill' + tail,
      book_id: place < 2 && first ? first.id : null,
      content: {
        kind: 'item',
        ru: 'Предмет ' + num,
        en: 'Item ' + num,
        rud: 'Сгенерированный предмет для замера.',
        ende: 'A generated item for the measure.',
        ...(place === 1 && section ? { section } : {})
      },
      revision: 1,
      created_at: at,
      updated_at: at
    });
  }
}

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
/* `import_homebrew`'s and `move_homebrew_items`' bounds per call (22023). */
const IMPORT_BOOKS_MAX = 100;
const IMPORT_CARDS_MAX = 1000;
const IMPORT_ITEMS_MAX = 1000;
const MOVE_ITEMS_MAX = 1000;
const SECTIONS_MAX = 30;

/* `create_purchase_request`'s bounds: its constants and the `limit_defaults` rows. A
   request expires 30 days after it is sent, or an hour after its first read. */
const HOUR_MS = 3_600_000;
const SEND_TTL_MS = 30 * 24 * HOUR_MS;
const RATE_MS = 60_000;
const RATE_MAX = 5;

/** A change-log row as the fake holds it; times in ms. */
interface HeldNotice {
  id: string;
  listId: string;
  itemKey: string;
  hid: string | null;
  kind: 'changed' | 'deleted';
  name: { en: string; ru: string };
  createdAt: number;
  readAt: number | null;
}

/* PostgREST's row cap (`max_rows`): a read of every list's notices answers this many. */
const READ_PAGE = 1000;

/** A purchase request as the fake holds it. */
interface HeldRequest {
  id: string;
  listId: string;
  shareId: string;
  audience: ShareAudience;
  status: 'pending' | 'applied' | 'declined';
  createdAt: number;
  expiresAt: number;
  readAt: number | null;
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
  const filled = as === undefined ? undefined : homebrewHeld.get(as);
  if (options.fillItems !== undefined && filled) fillHomebrew(filled, options.fillItems, boot);
  /* A seeded homebrew entry with no item id links its owner's item of the key. */
  for (const [k, all] of lists) {
    for (const h of all) {
      for (const e of h.entries) {
        if (e.source !== 'homebrew' || e.hb_item !== null) continue;
        e.hb_item = homebrewHeld.get(k)?.items.find((i) => i.key === e.item_key)?.id ?? null;
      }
    }
  }
  let offline = options.offline ?? false;
  /* The purchase requests of every user's lists. */
  let purchases: HeldRequest[] = [];
  /* The change log of every user's lists. */
  let notices: HeldNotice[] = seed.notices.map((n) => ({
    id: n.id,
    listId: n.listId,
    itemKey: n.itemKey,
    hid: n.hid,
    kind: n.kind,
    name: { ...n.name },
    createdAt: boot - n.createdAgoMs,
    readAt: null
  }));
  let noticed = 0;
  /* `newId()` answers `uuid(5000)` first, so a golden's address is the same
     on every run. */
  let made = 5000;
  let lastStamp = 0;
  const maxLists = options.limits?.lists ?? 50;
  const maxEntries = options.limits?.entries ?? 100;
  const maxBooks = options.limits?.books ?? 20;
  const maxItems = options.fillItems ?? options.limits?.items ?? 100;
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
      notices = notices.filter((n) => !gone.has(n.listId));
      const items = (homebrewHeld.get(current)?.items ?? []).map((i) => i.id);
      noticeLinks(items, 'deleted');
      users.delete(current);
      rows.delete(current);
      lists.delete(current);
      homebrewHeld.delete(current);
      unlink(items);
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
  /* Any account's item by its id, with its owner (a seed user). */
  const itemById = (hid: string): { owner: string; item: ItemRow } | undefined => {
    for (const [owner, held] of homebrewHeld) {
      const item = held.items.find((i) => i.id === hid);
      if (item) return { owner, item };
    }
    return undefined;
  };
  /* The trigger and the checks of `list_entries` (`list_entries_hb_key`): a homebrew entry
     sent by key links the item of that key its list's owner (`owner`, a seed user) holds;
     a linked entry takes its item's key; an unknown key or item, or a previous bundle's
     snapshot, is refused (null). */
  const linkOf = (e: EntryRow, owner: string | null): EntryRow | null => {
    const stale = (e as { snapshot?: unknown }).snapshot;
    if (stale !== undefined && stale !== null) return null;
    if (e.source === 'official' && e.hb_item === null) return e;
    if (e.hb_item === null) {
      const held = owner === null ? undefined : homebrewHeld.get(owner);
      const item = held?.items.find((i) => i.key === e.item_key);
      return item ? { ...e, hb_item: item.id } : null;
    }
    const found = itemById(e.hb_item);
    return found ? { ...e, item_key: found.item.key, source: 'homebrew' } : null;
  };
  /* One list's new entries: an id already there is skipped; a record already
     in the list, an entry the checks refuse or the entry limit refuses the whole
     call. Every caller writes the current user's own lists. */
  const insertEntries = (h: Held, entries: EntryRow[]): ListOpResult => {
    const fresh = entries.filter((e) => !h.entries.some((x) => x.id === e.id));
    if (!fresh.length) return OK;
    const keys = new Set(h.entries.map((e) => e.item_key));
    const linked: EntryRow[] = [];
    for (const e of fresh) {
      const l = linkOf(e, current);
      if (!l || keys.has(l.item_key)) return REFUSED;
      keys.add(l.item_key);
      linked.push(l);
    }
    if (h.entries.length + fresh.length > maxEntries) {
      return limited('entries_per_list', maxEntries);
    }
    h.entries.push(...linked.map((e) => ({ ...e })));
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
  /* Any account's item as `homebrew_item_record` writes it, with its owner's source and
     cards; null for an id no item has. */
  const recordById = (hid: string): HomebrewRecord | null => {
    const found = itemById(hid);
    const held = found ? homebrewHeld.get(found.owner) : undefined;
    if (!found || !held) return null;
    const book = held.books.find((b) => b.id === found.item.book_id);
    return recordOf(
      found.item.key,
      found.item.content,
      book ? { ...book.content, key: book.key } : null,
      held.cards.map((c) => ({ ...c.content, key: c.key, kind: c.kind }))
    );
  };
  /* `get_homebrew_item`: the record, `mine`, a revision that moves with the record or a
     related item, the owner's related items (the six rules, by lowercased name then key, at
     most 1000) and the latest edit of the item, its source and its named cards; null for an
     id no item has. */
  const itemAnswer = (hid: string): Record<string, unknown> | null => {
    const found = itemById(hid);
    const held = found ? homebrewHeld.get(found.owner) : undefined;
    const item = recordById(hid);
    if (!found || !held || !item) return null;
    const v = found.item;
    const named = (c: { en?: string; ru?: string }): { en: string; ru: string } => ({
      en: c.en || c.ru || '',
      ru: c.ru || c.en || ''
    });
    const related = held.items
      .filter((i) => {
        if (i.id === v.id) return false;
        const a = v.content;
        const b = i.content;
        return (
          !!a.craft?.includes(i.key) ||
          !!a.craft_from?.includes(i.key) ||
          !!b.craft?.includes(v.key) ||
          !!b.craft_from?.includes(v.key) ||
          (a.set !== undefined && a.set === b.set) ||
          (a.eq?.line !== undefined && a.eq.line === b.eq?.line)
        );
      })
      .map((i) => {
        const c = i.content;
        const o: Record<string, unknown> = { hid: i.id, key: i.key, kind: c.kind, ...named(c) };
        if (c.tier !== undefined) o['tier'] = c.tier;
        if (c.eq) {
          o['eq'] = {
            t: c.eq.t,
            tier: c.eq.tier,
            ...(c.eq.line === undefined ? {} : { line: c.eq.line })
          };
        }
        if (c.set !== undefined) o['set'] = c.set;
        if (c.craft) o['craft'] = [...c.craft];
        if (c.craft_from) o['craft_from'] = [...c.craft_from];
        return { o, name: named(c).en.toLowerCase(), key: i.key };
      })
      .sort((a, b) =>
        a.name < b.name ? -1 : a.name > b.name ? 1 : a.key < b.key ? -1 : a.key > b.key ? 1 : 0
      )
      .slice(0, 1000)
      .map((r) => r.o);
    const book = held.books.find((b) => b.id === v.book_id);
    const cards = held.cards.filter((c) =>
      c.kind === 'set' ? c.key === v.content.set : !!v.content.refs?.includes(c.key)
    );
    const updated = [v.updated_at, book?.updated_at, ...cards.map((c) => c.updated_at)]
      .filter((x): x is string => x !== undefined)
      .sort()
      .at(-1);
    return {
      hid,
      mine: current !== null && found.owner === current,
      revision: canonJson({ item, related }),
      item,
      related,
      updated_at: updated
    };
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
  const relink = (mine: Held[], entryId: string, hid: string): ListOpResult => {
    for (const h of mine) {
      const at = h.entries.findIndex((e) => e.id === entryId);
      const e = h.entries[at];
      if (!e) continue;
      const found = itemById(hid);
      if (!found) return REFUSED;
      if (h.entries.some((x, i) => i !== at && x.item_key === found.item.key)) return REFUSED;
      h.entries[at] = { ...e, item_key: found.item.key, source: 'homebrew', hb_item: hid };
      touch(h);
      return OK;
    }
    return GONE;
  };
  const removeList = (mine: Held[], id: string): ListOpResult => {
    const at = mine.findIndex((h) => h.row.id === id);
    if (at >= 0) {
      mine.splice(at, 1);
      shareRows = shareRows.filter((sh) => sh.listId !== id);
      purchases = purchases.filter((r) => r.listId !== id);
      notices = notices.filter((n) => n.listId !== id);
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
      case 'relink':
        return relink(mine, op.id, op.hb_item);
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
          hb_item: null,
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
    /* With `known`, a list at the revision held answers in `kept`; an id the owner does not
       hold is ignored, so it reads as gone. */
    list(known) {
      const mine = own();
      if (offline || !mine) return Promise.resolve({ ok: false });
      const held = known && Object.keys(known).length ? known : null;
      const kept = held ? mine.filter((h) => held[h.row.id] === h.row.revision) : [];
      return Promise.resolve({
        ok: true,
        lists: mine
          .filter((h) => !kept.includes(h))
          .map((h) => ({
            ...h.row,
            list_entries: h.entries.map((e) => ({ ...e })).sort(entryOrder)
          })),
        ...(held ? { kept: kept.map((h) => h.row.id) } : {}),
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
    },
    /* `get_homebrew_items`, in as many calls as the real port makes: signed in only; each
       id that has an item once, in order. */
    items(ids) {
      if (offline || current === null) return Promise.resolve({ ok: false });
      const items: LinkedRow[] = [];
      for (const hid of new Set(ids)) {
        const item = recordById(hid);
        if (item) items.push({ hid, item });
      }
      return Promise.resolve({ ok: true, items });
    },
    /* `get_homebrew_item`, signed out too. */
    item(id) {
      if (offline) return Promise.resolve({ ok: false });
      return Promise.resolve({ ok: true, item: itemAnswer(id) });
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
     unknown link or a deleted list. A players' link leaves the GM-only entries out
     before it reads their items, and numbers the rest from 0; a GM's link writes
     `gm_only` on each entry. */
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
      entries: [...h.entries]
        .filter((e) => gm || !e.gm_only)
        .sort(entryOrder)
        .map((e, position) => {
          const { gm_note, hb_item, gm_only, ...rest } = e;
          const out = {
            ...rest,
            position,
            snapshot: hb_item === null ? null : recordById(hb_item),
            ...(hb_item === null ? {} : { hid: hb_item })
          };
          return gm ? { ...out, gm_note, gm_only: gm_only ?? false } : out;
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
    read(token, since) {
      if (offline) return Promise.resolve({ ok: false });
      const shared = projection(token);
      if (shared && since !== undefined && shared.revision <= since) {
        return Promise.resolve({ ok: true, unchanged: true });
      }
      return Promise.resolve({ ok: true, shared });
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
        /* Every homebrew entry links the item its source entry links, for anyone. */
        const copied: EntryRow[] = [];
        for (const e of p.entries) {
          const l = linkOf(
            {
              id: uuid(made++),
              item_key: e.item_key,
              source: e.source,
              hb_item: e.hid ?? null,
              position: e.position,
              quantity: e.quantity,
              price_coins: e.price_coins,
              player_note: e.player_note,
              gm_note: e.gm_note ?? '',
              ...(e.gm_only ? { gm_only: true } : {})
            },
            current
          );
          if (!l) return REFUSED;
          copied.push(l);
        }
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
    /* A players' link holds no GM-only entry: a request for one is stale. */
    const shown = h.entries.filter((e) => sh.audience === 'gm' || !e.gm_only);
    const stock = new Map(shown.map((e) => [e.item_key, e]));
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
      expiresAt: now + SEND_TTL_MS,
      readAt: null,
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
  /* A request's first read, by a draw or a decision: an hour left at most from now. */
  const markHeld = (r: HeldRequest, now: number): void => {
    if (r.readAt !== null) return;
    r.readAt = now;
    r.expiresAt = Math.min(r.expiresAt, now + HOUR_MS);
  };
  /* The checks apply and decline share: the caller's own list, pending, then the first read,
     then not expired. */
  type Undecidable = { ok: false; error: 'network' | 'gone' | 'decided' | 'expired' };
  const decidable = (id: string): { r: HeldRequest; h: Held } | Undecidable => {
    const mine = offline ? null : own();
    if (!mine) return NETWORK;
    const r = purchases.find((x) => x.id === id);
    const h = r ? find(mine, r.listId) : undefined;
    if (!r || !h) return { ok: false, error: 'gone' };
    if (r.status !== 'pending') return { ok: false, error: 'decided' };
    const now = Date.now();
    markHeld(r, now);
    if (now >= r.expiresAt) return { ok: false, error: 'expired' };
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
            readAt: r.readAt === null ? null : iso(r.readAt),
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
    },
    /* `mark_list_read`: the caller's own list; only unread rows change, and no message. */
    markRead(listId) {
      const mine = offline ? null : own();
      if (!mine) return Promise.resolve(NETWORK);
      if (!find(mine, listId)) return Promise.resolve(REFUSED);
      const now = Date.now();
      for (const r of purchases) if (r.listId === listId) markHeld(r, now);
      for (const n of notices) if (n.listId === listId && n.readAt === null) n.readAt = now;
      return Promise.resolve(OK);
    },
    /* Row level security: the owner's lists only, newest first; every list is cut at the
       row cap, one list is read whole. */
    notices(listId) {
      const mine = offline ? null : own();
      if (!mine) return Promise.resolve({ ok: false });
      const ids = new Set(mine.map((h) => h.row.id));
      const rows = notices
        .filter((n) => ids.has(n.listId) && (listId === undefined || n.listId === listId))
        .sort((a, b) => b.createdAt - a.createdAt || (a.id < b.id ? -1 : 1))
        .slice(0, listId === undefined ? READ_PAGE : undefined)
        .map((n): NoticeRow => ({
          id: n.id,
          list_id: n.listId,
          item_key: n.itemKey,
          hid: n.hid,
          kind: n.kind,
          name: { ...n.name },
          created_at: iso(n.createdAt),
          read_at: n.readAt === null ? null : iso(n.readAt)
        }));
      return Promise.resolve({ ok: true, notices: rows });
    },
    /* A delete under row level security: another user's list deletes nothing. */
    hideNotices(listId, ids) {
      const mine = offline ? null : own();
      if (!mine) return Promise.resolve(NETWORK);
      if (find(mine, listId)) {
        notices = notices.filter((n) => n.listId !== listId || !ids.includes(n.id));
      }
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
  /* `homebrew_links_touch`'s notices: one row per list of another user than the item's
     owner that links one of `itemIds`, made or refreshed (unread, now), with one `notice`
     message per list owner. A delete's row names no item. */
  const noticeLinks = (itemIds: readonly string[], kind: 'changed' | 'deleted'): void => {
    const told = new Set<string>();
    for (const all of lists.values()) {
      for (const h of all) {
        const owner = userIdOf(h);
        for (const e of h.entries) {
          if (e.hb_item === null || !itemIds.includes(e.hb_item)) continue;
          const found = itemById(e.hb_item);
          if (!found || users.get(found.owner)?.id === owner) continue;
          const c = found.item.content;
          const name = { en: c.en || c.ru || '', ru: c.ru || c.en || '' };
          const now = Date.now();
          const hid = kind === 'deleted' ? null : found.item.id;
          const had = notices.find(
            (n) => n.listId === h.row.id && n.itemKey === found.item.key
          );
          if (had) Object.assign(had, { kind, name, hid, createdAt: now, readAt: null });
          else {
            notices.push({
              id: uuid(8000 + noticed++),
              listId: h.row.id,
              itemKey: found.item.key,
              hid,
              kind,
              name,
              createdAt: now,
              readAt: null
            });
          }
          if (owner && !told.has(owner)) {
            told.add(owner);
            send('owner:' + owner, 'notice', { list: h.row.id });
          }
        }
      }
    }
  };
  /* Every list of any user that links one of `itemIds`, touched once, with its list
     messages and notices (`homebrew_links_touch`). */
  const touchLinks = (itemIds: readonly string[]): void => {
    noticeLinks(itemIds, 'changed');
    const was = before();
    for (const all of lists.values()) {
      for (const h of all) {
        if (h.entries.some((e) => e.hb_item !== null && itemIds.includes(e.hb_item))) touch(h);
      }
    }
    announce(was, TAB);
  };
  /* The ids of the current user's items that name the card `key` in `set` or `refs`. */
  const naming = (mine: HeldHomebrew, key: string): string[] =>
    mine.items
      .filter((i) => i.content.set === key || (i.content.refs ?? []).includes(key))
      .map((i) => i.id);
  /* The foreign key's cascade: every entry of any user that links one of `itemIds` goes. */
  const unlink = (itemIds: readonly string[]): void => {
    for (const all of lists.values()) {
      for (const h of all) {
        const kept = h.entries.filter(
          (e) => e.hb_item === null || !itemIds.includes(e.hb_item)
        );
        if (kept.length === h.entries.length) continue;
        h.entries = kept;
        touch(h);
      }
    }
  };
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
      touchLinks(mine.items.filter((i) => i.book_id === id).map((i) => i.id));
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
      touchLinks([
        ...moved.map((i) => i.id),
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
      touchLinks([i.id]);
      homebrewSaid();
      return Promise.resolve({ ok: true, revision: i.revision });
    },
    removeItem(id) {
      const mine = ownHomebrew();
      if (!mine) return Promise.resolve(NETWORK);
      const at = mine.items.findIndex((x) => x.id === id);
      const i = mine.items[at];
      if (!i) return Promise.resolve(OK);
      noticeLinks([i.id], 'deleted');
      const was = before();
      unlink([i.id]);
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
      touchLinks(naming(mine, row.key));
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
      touchLinks(naming(mine, c.key));
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
      touchLinks(naming(mine, c.key));
      homebrewSaid();
      return Promise.resolve(OK);
    },
    /* import_homebrew(): every row or none, on a copy of the account's rows. */
    import(rows): Promise<HomebrewImport> {
      const mine = ownHomebrew();
      if (!mine) return Promise.resolve(NETWORK);
      const unique = (list: readonly { key: string }[]): boolean =>
        new Set(list.map((r) => r.key)).size === list.length;
      if (
        typeof rows.update !== 'boolean' ||
        rows.books.length > IMPORT_BOOKS_MAX ||
        rows.cards.length > IMPORT_CARDS_MAX ||
        rows.items.length > IMPORT_ITEMS_MAX ||
        !unique(rows.books) ||
        !unique(rows.cards) ||
        !unique(rows.items)
      ) {
        return Promise.resolve(REFUSED);
      }
      const next = structuredClone(mine);
      const at = stamp();
      const counts = {
        books_created: 0,
        cards_created: 0,
        cards_updated: 0,
        cards_skipped: 0,
        items_created: 0,
        items_updated: 0,
        items_skipped: 0
      };
      const touched: string[] = [];
      const bump = (r: { revision: number; updated_at: string }): void => {
        r.revision++;
        r.updated_at = at;
      };
      const taken = (pick: (h: HeldHomebrew) => { id: string }[], id: string): boolean =>
        [...homebrewHeld.values()].some((h) => h !== mine && pick(h).some((r) => r.id === id));
      for (const row of rows.books) {
        const held = next.books.find((b) => b.key === row.key);
        if (!held) {
          if (!isHomebrewKey(row.key) || bookProblems(row.content).length)
            return Promise.resolve(REFUSED);
          if (taken((h) => h.books, row.id) || next.books.some((b) => b.id === row.id)) {
            return Promise.resolve(REFUSED);
          }
          next.books.push({
            ...structuredClone(row),
            revision: 1,
            created_at: at,
            updated_at: at
          });
          counts.books_created++;
          continue;
        }
        const content = structuredClone(held.content);
        const sections = [...(content.sections ?? [])];
        for (const s of row.content.sections ?? []) {
          if (!sections.some((x) => x.key === s.key)) sections.push(structuredClone(s));
        }
        if (sections.length !== (content.sections ?? []).length) content.sections = sections;
        if (rows.update && row.names) {
          if (row.content.en !== undefined) content.en = row.content.en;
          if (row.content.ru !== undefined) content.ru = row.content.ru;
        }
        if (canonJson(content) === canonJson(held.content)) continue;
        if (bookProblems(content).length || sections.length > SECTIONS_MAX) {
          return Promise.resolve(REFUSED);
        }
        held.content = content;
        bump(held);
        touched.push(...next.items.filter((i) => i.book_id === held.id).map((i) => i.id));
      }
      const bookOf = (key: string | null) =>
        key === null ? null : (next.books.find((b) => b.key === key) ?? undefined);
      for (const row of rows.cards) {
        const book = bookOf(row.book);
        if (book === undefined) return Promise.resolve(REFUSED);
        const bookId = book?.id ?? null;
        const held = next.cards.find((c) => c.key === row.key);
        if (!held) {
          if (!isHomebrewKey(row.key) || cardProblems(row.kind, row.content).length) {
            return Promise.resolve(REFUSED);
          }
          if (taken((h) => h.cards, row.id) || next.cards.some((c) => c.id === row.id)) {
            return Promise.resolve(REFUSED);
          }
          next.cards.push({
            id: row.id,
            key: row.key,
            kind: row.kind,
            book_id: bookId,
            content: structuredClone(row.content),
            revision: 1,
            created_at: at,
            updated_at: at
          });
          counts.cards_created++;
          touched.push(...naming(next, row.key));
          continue;
        }
        const same =
          canonJson({ c: held.content, b: held.book_id }) ===
          canonJson({ c: row.content, b: bookId });
        if (!rows.update || held.kind !== row.kind || same) {
          counts.cards_skipped++;
          continue;
        }
        if (cardProblems(held.kind, row.content).length) return Promise.resolve(REFUSED);
        held.content = structuredClone(row.content);
        held.book_id = bookId;
        bump(held);
        counts.cards_updated++;
        touched.push(...naming(next, held.key));
      }
      for (const row of rows.items) {
        const book = bookOf(row.book);
        if (book === undefined) return Promise.resolve(REFUSED);
        const section = row.content.section;
        if (section !== undefined && !book?.content.sections?.some((s) => s.key === section)) {
          return Promise.resolve(REFUSED);
        }
        const bookId = book?.id ?? null;
        const held = next.items.find((i) => i.key === row.key);
        if (!held) {
          if (!isHomebrewKey(row.key) || contentProblems(row.content, row.key).length) {
            return Promise.resolve(REFUSED);
          }
          if (taken((h) => h.items, row.id) || next.items.some((i) => i.id === row.id)) {
            return Promise.resolve(REFUSED);
          }
          next.items.push({
            id: row.id,
            key: row.key,
            book_id: bookId,
            content: structuredClone(row.content),
            revision: 1,
            created_at: at,
            updated_at: at
          });
          counts.items_created++;
          continue;
        }
        const same =
          canonJson({ c: held.content, b: held.book_id }) ===
          canonJson({ c: row.content, b: bookId });
        if (!rows.update || same) {
          counts.items_skipped++;
          continue;
        }
        if (contentProblems(row.content, held.key).length) return Promise.resolve(REFUSED);
        held.content = structuredClone(row.content);
        held.book_id = bookId;
        bump(held);
        counts.items_updated++;
        touched.push(held.id);
      }
      if (counts.books_created && next.books.length > maxBooks) {
        return Promise.resolve(limited('homebrew_books_per_owner', maxBooks));
      }
      if (counts.cards_created && next.cards.length > maxCards) {
        return Promise.resolve(limited('homebrew_cards_per_owner', maxCards));
      }
      if (counts.items_created && next.items.length > maxItems) {
        return Promise.resolve(limited('homebrew_items_per_owner', maxItems));
      }
      mine.books = next.books;
      mine.cards = next.cards;
      mine.items = next.items;
      touchLinks(touched);
      homebrewSaid();
      return Promise.resolve({ ok: true, counts });
    },
    /* move_homebrew_items(): every item or none. */
    moveItems(items, bookId, section): Promise<HomebrewMoved> {
      const mine = ownHomebrew();
      if (!mine) return Promise.resolve(NETWORK);
      if (
        !items.length ||
        items.length > MOVE_ITEMS_MAX ||
        new Set(items.map((i) => i.id)).size !== items.length ||
        (section !== null && bookId === null)
      ) {
        return Promise.resolve(REFUSED);
      }
      if (bookId !== null) {
        const book = mine.books.find((b) => b.id === bookId);
        if (!book) return Promise.resolve({ ok: false, error: 'gone' });
        if (section !== null && !book.content.sections?.some((s) => s.key === section)) {
          return Promise.resolve({ ok: false, error: 'gone' });
        }
      }
      const rows = items.map((x) =>
        mine.items.find((i) => i.id === x.id && i.revision === x.revision)
      );
      if (rows.some((r) => !r)) return Promise.resolve({ ok: false, error: 'conflict' });
      const at = stamp();
      for (const i of rows as ItemRow[]) {
        i.book_id = bookId;
        const content = { ...i.content };
        if (section === null) delete content.section;
        else content.section = section;
        i.content = content;
        i.revision++;
        i.updated_at = at;
      }
      touchLinks((rows as ItemRow[]).map((i) => i.id));
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
    playEntry(listId, itemKey, patch) {
      const h = anyList(listId);
      const at = h ? h.entries.findIndex((e) => e.item_key === itemKey) : -1;
      if (!h || at < 0) return false;
      const was = before();
      h.entries[at] = { ...(h.entries[at] as EntryRow), ...patch };
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
      if (!r || !h || r.status !== 'pending') return false;
      markHeld(r, Date.now());
      if (Date.now() >= r.expiresAt) return false;
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
    opCount: () => applied,
    as(who) {
      if (who !== undefined && !users.has(who)) {
        throw new Error('fake cloud: unknown user "' + who + '"');
      }
      let session: string | null = who ?? null;
      /* Each call runs as this port's user: every member answers before it returns, so
         the swap of `current` covers its whole write. */
      const view = <T extends object>(o: T): T =>
        new Proxy(o, {
          get(target, p) {
            const v: unknown = Reflect.get(target, p);
            if (typeof v !== 'function') return v;
            return (...args: unknown[]) => {
              const was = current;
              current = session;
              try {
                return (v as (...a: unknown[]) => unknown).apply(target, args);
              } finally {
                session = current;
                current = was;
              }
            };
          }
        });
      return {
        auth: view(auth),
        prefs: view(prefs),
        lists: view(listRepo),
        shares: view(shareRepo),
        events: view(events),
        requests: view(requestRepo),
        homebrew: view(homebrewRepo)
      };
    }
  };
}

/** Builds the port from `?as=<user>` (signed out without it) and `?items=<n>` (1-1000,
 *  `fillItems`) and exposes it
 *  as `window.__dhlootFake` for the browser suites. The query stays in the
 *  address, so a reload keeps the session. */
export function installFakeCloud(search: string = window.location.search): FakeCloud {
  const query = new URLSearchParams(search);
  const as = query.get('as') ?? undefined;
  const items = Number(query.get('items'));
  const port = fakeCloud(
    SEED,
    as,
    Number.isInteger(items) && items >= 1 && items <= 1000 ? { fillItems: items } : {}
  );
  window.__dhlootFake = { marker: MARKER, ...port };
  return port;
}
