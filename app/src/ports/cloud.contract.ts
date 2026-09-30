/* What any `CloudPort` must do, the fake and the real adapter alike.
 *
 * No test framework here: the caller hands in `assert`, so vitest runs it
 * over the fake (`fake-cloud.test.ts`) and `tests/e2e/contract.mjs` runs it
 * over the real adapter against the hosted test project. `make(as)` builds a
 * port signed in as that user, or signed out without one. Only what every
 * port does belongs here; what depends on the fake's seed stays in its own
 * tests (docs/specs/COVERAGE.md, "Test layers"). Each release appends the
 * cases for the port member it adds: A-F the account, G the lists, H the
 * share links, I the move of a browser list, J the live topics, K the purchase
 * requests, L the import of a lists file, M the homebrew rows. */

import type { EntryRow, ImportRow, ListRow } from '../lib/cloudLists.js';
import {
  canonJson,
  HOMEBREW_KEY,
  recordOf,
  type BookContent,
  type HomebrewContent
} from '../lib/homebrew.js';
import { readOwnerMessage, readRequestMessage, readShareMessage } from '../lib/live.js';
import type { Prefs } from '../lib/prefs.js';
import type { CloudPort, ListWrites, LiveStatus, Session } from './types.js';

export interface ContractUsers {
  /** A user that is never deleted, and what its session must say. */
  member: { as: string; userId: string; email: string };
  /** A user with no preferences row: case F writes one, case E deletes
   *  the user. */
  doomed: string;
}

const PROVIDERS: readonly string[] = ['google', 'discord'];

/** No port holds an identity with this id. */
const UNKNOWN_IDENTITY = '00000000-0000-4000-8000-000000000999';

const PREF_KEYS = ['lang', 'home', 'view', 'printBw', 'printCompact', 'notifyGm'] as const;

function samePrefs(a: Prefs | null, b: Prefs): boolean {
  if (!a) return false;
  return (
    Object.keys(a).length === Object.keys(b).length && PREF_KEYS.every((k) => a[k] === b[k])
  );
}

type Assert = (cond: boolean, msg: string) => void;

function entryOf(
  id: string,
  key: string,
  position: number,
  over: Partial<EntryRow> = {}
): EntryRow {
  return {
    id,
    item_key: key,
    source: 'official',
    snapshot: null,
    position,
    quantity: 1,
    price_coins: null,
    player_note: '',
    gm_note: '',
    ...over
  };
}

/** The port's lists by id, or null when the read failed. */
async function listsOf(
  port: CloudPort,
  assert: Assert,
  when: string
): Promise<ListRow[] | null> {
  const read = await port.lists.list();
  assert(read.ok, 'lists: ' + when + ', list() is not ok');
  return read.ok ? read.lists : null;
}

/** The one list with `id`, or null when there is not exactly one. */
async function theList(
  port: CloudPort,
  id: string,
  assert: Assert,
  when: string
): Promise<ListRow | null> {
  const found = ((await listsOf(port, assert, when)) ?? []).filter((l) => l.id === id);
  assert(found.length === 1, 'lists: ' + when + ', not exactly one list with the id');
  return found[0] ?? null;
}

const view = (e: EntryRow): string =>
  [e.item_key, e.quantity, e.price_coins, e.player_note, e.gm_note].join('|');

/** An `apply` answer in short: each write's `ok` or error, or the call's own error. */
const answered = (w: ListWrites): string =>
  w.ok ? w.results.map((r) => (r.ok ? 'ok' : r.error)).join(',') : 'call:' + w.error;

async function listCases(port: CloudPort, assert: Assert): Promise<void> {
  const { lists } = port;
  const before = (await listsOf(port, assert, 'at first'))?.length ?? 0;

  const id = lists.newId();
  const [a, b, c] = [lists.newId(), lists.newId(), lists.newId()];
  const row = { id, name: 'Клад', money_mode: 'coin' as const, player_note: 'p', gm_note: 'g' };
  const two = [
    entryOf(a, 'ci1', 0, { quantity: 2, price_coins: 150, player_note: 'a' }),
    entryOf(b, 'q1', 1, { gm_note: 'b' })
  ];
  const create = { op: 'create' as const, list: row, entries: two };
  assert(answered(await lists.apply([create])) === 'ok', 'lists: a create was refused');
  assert(answered(await lists.apply([create])) === 'ok', 'lists: a second create was refused');
  let got = await theList(port, id, assert, 'after create');
  assert(
    got?.name === 'Клад' &&
      got.money_mode === 'coin' &&
      got.player_note === 'p' &&
      got.gm_note === 'g',
    'lists: the list does not read back as created'
  );
  assert(
    got?.list_entries.map(view).join(';') === 'ci1|2|150|a|;q1|1|||b',
    'lists: the entries do not read back in order'
  );

  const edits = await lists.apply([
    {
      op: 'update',
      id,
      patch: { name: 'Клад дракона', money_mode: 'bag', player_note: '', gm_note: 'G' }
    },
    { op: 'add', list_id: id, entries: [entryOf(c, 'q313', 2)] },
    {
      op: 'update_entry',
      id: b,
      patch: { quantity: 5, price_coins: 20, player_note: 'n', gm_note: '' }
    },
    { op: 'reorder', list_id: id, ids: [c, a, b] }
  ]);
  assert(answered(edits) === 'ok,ok,ok,ok', 'lists: the edits answered ' + answered(edits));
  got = await theList(port, id, assert, 'after the edits');
  assert(
    got?.name === 'Клад дракона' &&
      got.money_mode === 'bag' &&
      got.player_note === '' &&
      got.gm_note === 'G',
    'lists: an update does not read back'
  );
  assert(
    got?.list_entries.map(view).join(';') === 'q313|1|||;ci1|2|150|a|;q1|5|20|n|',
    'lists: an add, an entry update or a reorder does not read back'
  );

  /* A refused write drops alone: the write after it lands. */
  const missed = await lists.apply([
    { op: 'add', list_id: id, entries: [entryOf(lists.newId(), 'ci1', 3)] },
    { op: 'update', id, patch: { name: 'Клад дракона II' } }
  ]);
  assert(
    answered(missed) === 'refused,ok',
    'lists: a second entry for one record, then a rename, answered ' + answered(missed)
  );
  got = await theList(port, id, assert, 'after the refused add');
  assert(got?.name === 'Клад дракона II', 'lists: the rename after a refused write was lost');

  /* A reorder from a device with an old entry set is applied, not refused:
     the given entries first, the others after them. The order is c, a, b. */
  const stale = await lists.apply([{ op: 'reorder', list_id: id, ids: [a, c] }]);
  assert(answered(stale) === 'ok', 'lists: a stale reorder answered ' + answered(stale));
  got = await theList(port, id, assert, 'after the stale reorder');
  assert(
    got?.list_entries.map((e) => e.item_key).join(',') === 'ci1,q313,q1',
    'lists: a stale reorder does not put the entries it was not given after the given ones'
  );

  /* A row that is not there: an edit of it is gone, a delete of it is ok. */
  const [x, y] = [lists.newId(), lists.newId()];
  const gone = await lists.apply([
    { op: 'update', id: x, patch: { name: 'Нет' } },
    { op: 'update', id: x, patch: {} },
    { op: 'update_entry', id: y, patch: { quantity: 2 } },
    { op: 'reorder', list_id: x, ids: [] },
    { op: 'add', list_id: x, entries: [entryOf(lists.newId(), 'ci1', 0)] },
    { op: 'remove', id: x },
    { op: 'remove_entries', ids: [y] }
  ]);
  assert(
    answered(gone) === 'gone,ok,gone,gone,gone,ok,ok',
    'lists: the writes of a missing row answered ' + answered(gone)
  );

  assert(
    answered(await lists.apply([{ op: 'remove_entries', ids: [a, b, c] }])) === 'ok',
    'lists: a removal of the entries was refused'
  );
  got = await theList(port, id, assert, 'after the entries were removed');
  assert(got?.list_entries.length === 0, 'lists: the removal left an entry');
  assert(
    answered(await lists.apply([{ op: 'remove', id }])) === 'ok',
    'lists: a removal of the list was refused'
  );
  const after = await listsOf(port, assert, 'after remove');
  assert(
    after?.length === before && !after.some((l) => l.id === id),
    'lists: the removal left the list'
  );
}

/* No key of `o`, at any depth, is `gm_note`. */
function hasGmNote(o: unknown): boolean {
  if (Array.isArray(o)) return o.some(hasGmNote);
  if (o === null || typeof o !== 'object') return false;
  return Object.entries(o).some(([k, v]) => k === 'gm_note' || hasGmNote(v));
}

async function shareCases(port: CloudPort, assert: Assert): Promise<void> {
  const { lists, shares } = port;
  const id = lists.newId();
  const [a, b] = [lists.newId(), lists.newId()];
  const row = {
    id,
    name: 'Ссылки',
    money_mode: 'bag' as const,
    player_note: 'p',
    gm_note: 'g'
  };
  const made = await lists.apply([
    {
      op: 'create',
      list: row,
      entries: [entryOf(a, 'ci1', 0), entryOf(b, 'q1', 1, { gm_note: 'h' })]
    }
  ]);
  assert(answered(made) === 'ok', 'shares: the list was not created');
  const none = await shares.list(id);
  assert(none.ok && none.shares.length === 0, 'shares: a new list does not read no shares');

  const player = await shares.create(id, 'player');
  const again = await shares.create(id, 'player');
  assert(player.ok, 'shares: create(player) was refused');
  assert(
    player.ok && again.ok && again.id === player.id && again.token === player.token,
    'shares: a second create(player) made another share'
  );
  const gm = await shares.create(id, 'gm');
  assert(gm.ok, 'shares: create(gm) was refused');
  if (!player.ok || !gm.ok) return;

  const seen = await shares.read(player.token);
  const p = seen.ok ? seen.shared : null;
  assert(
    p?.audience === 'player' && p.list.name === 'Ссылки' && p.list.player_note === 'p',
    'shares: the player link does not read the list'
  );
  assert(p !== null && !hasGmNote(p), 'shares: the player link reads a GM note');
  assert(
    p?.entries.map((e) => e.item_key).join(',') === 'ci1,q1',
    'shares: the player link does not read the entries in order'
  );
  const seenGm = await shares.read(gm.token);
  const g = seenGm.ok ? seenGm.shared : null;
  assert(
    g?.list.gm_note === 'g' && g.entries[1]?.gm_note === 'h',
    'shares: the GM link does not read the GM notes'
  );
  assert(
    (await shares.ownerOf(player.token)) === id,
    "shares: ownerOf is not the owner's list"
  );

  /* A link is replaced by deleting it and making a new one. */
  assert((await shares.revoke(player.id)).ok, 'shares: revoke(player) was refused');
  const old = await shares.read(player.token);
  assert(old.ok && old.shared === null, 'shares: a deleted link still opens the list');
  const remade = await shares.create(id, 'player');
  assert(remade.ok && remade.token !== player.token, 'shares: create() reused a deleted link');
  if (!remade.ok) return;
  const fresh = await shares.read(remade.token);
  assert(
    fresh.ok && fresh.shared?.list.name === 'Ссылки',
    'shares: the new link opens nothing'
  );

  assert((await shares.revoke(gm.id)).ok, 'shares: revoke(gm) was refused');
  assert((await shares.revoke(gm.id)).ok, 'shares: a second revoke() was refused');
  const stopped = await shares.read(gm.token);
  assert(
    stopped.ok && stopped.shared === null,
    'shares: a deleted GM link still opens the list'
  );

  const all = await shares.list(id);
  const rows = all.ok ? all.shares : [];
  assert(
    rows.length === 3 &&
      rows.filter((r) => r.revoked_at !== null).length === 2 &&
      rows.filter((r) => r.revoked_at === null).length === 1,
    'shares: the owner does not read two stopped rows and one active'
  );
  const gmAgain = await shares.create(id, 'gm');
  assert(
    gmAgain.ok && gmAgain.token !== gm.token,
    'shares: create() after a deleted GM link reused it'
  );

  const copy = lists.newId();
  assert((await shares.clone(remade.token, copy)).ok, 'shares: clone() was refused');
  assert((await shares.clone(remade.token, copy)).ok, 'shares: a second clone() was refused');
  const got = await theList(port, copy, assert, 'after clone');
  assert(
    got?.name === 'Ссылки' &&
      got.player_note === 'p' &&
      got.gm_note === '' &&
      got.list_entries.length === 2 &&
      got.list_entries.every((e) => e.gm_note === ''),
    'shares: a player copy does not hold the list without its GM notes'
  );
  const nobody = await shares.create(lists.newId(), 'player');
  assert(!nobody.ok && nobody.error === 'refused', 'shares: a share of no list was made');
}

/* The most a catalog-size move may take, client wall clock with the upload and PostgREST;
   the `authenticated` role's 8 s statement timeout bounds only the database's part. */
const MOVE_MS = 6000;

async function moveCases(
  port: CloudPort,
  assert: Assert,
  log: (msg: string) => void
): Promise<void> {
  const { lists } = port;
  const text = JSON.stringify({
    hnote: 'g',
    ids: ['ci1', 'q1', 'zz_unknown'],
    meta: { ci1: { gold: 150, note: 'a', qty: 2 }, q1: { hnote: 'b' } },
    money: 'coin',
    name: 'Перенос',
    note: 'p'
  });
  const id = lists.newId();
  const first = await lists.move(id, text);
  assert(
    first.ok && first.id === id && first.inserted,
    'move: the first move answered ' + JSON.stringify(first)
  );
  const again = await lists.move(lists.newId(), text);
  assert(
    again.ok && again.id === id && !again.inserted,
    'move: the same text again answered ' + JSON.stringify(again)
  );
  const got = await theList(port, id, assert, 'after the move');
  assert(
    /^[0-9a-f]{64}$/.test(got?.legacy_fingerprint ?? ''),
    'move: the row has no 64-hex fingerprint'
  );
  assert(
    got?.name === 'Перенос' &&
      got.money_mode === 'coin' &&
      got.player_note === 'p' &&
      got.gm_note === 'g',
    'move: the list does not read back as moved'
  );
  assert(
    got?.list_entries.map(view).join(';') === 'ci1|2|150|a|;q1|1|||b;zz_unknown|1|||',
    'move: the entries do not read back in order'
  );
  const bad = await lists.move(lists.newId(), '{"ids":["a b"]}');
  assert(!bad.ok && bad.error === 'refused', 'move: a text that is not a list was taken');

  /* A catalog-size list: the move is one statement pair, timed at the client with the upload;
     the 8 s statement timeout bounds only the database's part. */
  const ids = Array.from({ length: 1300 }, (_, i) => 'r' + String(i).padStart(4, '0'));
  const meta = Object.fromEntries(
    ids.filter((_, i) => i % 10 === 0).map((k) => [k, { note: 'n ' + k }])
  );
  const started = Date.now();
  const big = await lists.move(lists.newId(), JSON.stringify({ ids, meta, name: 'e2e 1300' }));
  const ms = Date.now() - started;
  log('move of 1300 entries: ' + String(ms) + ' ms');
  assert(big.ok && big.inserted, 'move: 1300 entries answered ' + JSON.stringify(big));
  assert(ms < MOVE_MS, 'move: 1300 entries took ' + String(ms) + ' ms');
}

/** A message a joined topic delivered. */
export interface Delivered {
  topic: string;
  event: string;
  payload: unknown;
}

const JOIN_WAIT_MS = 10_000;
const pause = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** Waits up to `ms` for `pred`, checking every 50 ms; answers whether it held. */
async function waitFor(pred: () => boolean, ms = JOIN_WAIT_MS): Promise<boolean> {
  const until = Date.now() + ms;
  while (!pred()) {
    if (Date.now() >= until) return false;
    await pause(50);
  }
  return true;
}

/** Subscribes once and answers the first status (null when none came in 10 s), with the
 *  leave. */
async function joinOnce(
  port: CloudPort,
  topic: string,
  into: Delivered[]
): Promise<{ status: LiveStatus | null; leave: () => void }> {
  let status: LiveStatus | null = null;
  const leave = port.events.subscribe(topic, {
    message: (event, payload) => into.push({ topic, event, payload }),
    status: (s) => {
      status ??= s;
    }
  });
  await waitFor(() => status !== null);
  return { status, leave };
}

/**
 * Joins `topic`, up to three attempts 2 s apart: a project's first join after a quiet
 * spell can be refused once while Realtime makes its message partitions. Answers the
 * leave, or null after three refusals.
 */
export async function joinLive(
  port: CloudPort,
  topic: string,
  into: Delivered[]
): Promise<(() => void) | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { status, leave } = await joinOnce(port, topic, into);
    if (status === 'live') return leave;
    leave();
    await pause(2000);
  }
  return null;
}

/* J. The owner topic and a share topic deliver the broadcast triggers' messages to a
   joined port; a signed-out port cannot join the owner topic. */
async function liveCases(
  port: CloudPort,
  signedOut: CloudPort,
  userId: string,
  assert: Assert
): Promise<void> {
  const got: Delivered[] = [];
  const leaves: (() => void)[] = [];
  const { lists, shares } = port;
  const id = lists.newId();
  try {
    const ownerTopic = 'owner:' + userId;
    const owner = await joinLive(port, ownerTopic, got);
    assert(owner !== null, 'live: the owner topic was refused three times');
    if (!owner) return;
    leaves.push(owner);
    const made = await lists.apply([
      {
        op: 'create',
        list: { id, name: 'Живой', money_mode: 'bag', player_note: '', gm_note: '' },
        entries: [entryOf(lists.newId(), 'ci1', 0)]
      }
    ]);
    assert(answered(made) === 'ok', 'live: the list was not created');
    const share = await shares.create(id, 'player');
    assert(share.ok, 'live: the share was not made');
    if (!share.ok) return;
    const read = await shares.read(share.token);
    const key = read.ok ? read.shared?.topic_key : undefined;
    assert(typeof key === 'string', 'live: the share read has no topic key');
    if (typeof key !== 'string') return;
    const shareTopic = 'share:' + key;
    const joined = await joinLive(port, shareTopic, got);
    assert(joined !== null, 'live: the share topic was refused three times');
    if (!joined) return;
    leaves.push(joined);

    const renamed = await lists.apply([{ op: 'update', id, patch: { name: 'J' } }]);
    assert(answered(renamed) === 'ok', 'live: the rename was refused');
    const revision = (await theList(port, id, assert, 'after the live rename'))?.revision;
    const ownerSaw = await waitFor(() =>
      got.some((m) => {
        const o = m.topic === ownerTopic ? readOwnerMessage(m.event, m.payload) : null;
        return o?.list === id && o.revision === revision && o.by === port.events.tab;
      })
    );
    assert(ownerSaw, "live: no owner message named the list, its revision and this port's tab");
    const shareSaw = await waitFor(() =>
      got.some(
        (m) =>
          m.topic === shareTopic && readShareMessage(m.event, m.payload)?.revision === revision
      )
    );
    assert(shareSaw, 'live: no share message named the revision');

    assert((await shares.revoke(share.id)).ok, 'live: the revoke was refused');
    const goneSaw = await waitFor(() =>
      got.some(
        (m) => m.topic === shareTopic && readShareMessage(m.event, m.payload)?.revision === null
      )
    );
    assert(goneSaw, 'live: no share message said the link is gone');

    const refused = await joinOnce(signedOut, ownerTopic, got);
    leaves.push(refused.leave);
    assert(refused.status === 'down', 'live: a signed-out port joined the owner topic');
  } finally {
    for (const leave of leaves) leave();
    await lists.apply([{ op: 'remove', id }]);
  }
}

/* K. A request sent through the owner's own share link (any token holder may send),
   replayed, read by the owner, applied short then clamped, declined twice, and refused
   as stale, over the rate and for a link or a request that is not there. */
async function requestCases(port: CloudPort, assert: Assert): Promise<void> {
  const got: Delivered[] = [];
  let leave: (() => void) | null = null;
  const { lists, shares, requests } = port;
  const id = lists.newId();
  try {
    const userId = (await port.auth.session())?.userId;
    assert(typeof userId === 'string', 'requests: the port is signed out');
    if (typeof userId !== 'string') return;
    const made = await lists.apply([
      {
        op: 'create',
        list: { id, name: 'Запросы', money_mode: 'bag', player_note: '', gm_note: '' },
        entries: [
          entryOf(lists.newId(), 'ci1', 0, { quantity: 5, price_coins: 150 }),
          entryOf(lists.newId(), 'cc1', 1, { quantity: 1, price_coins: 20 })
        ]
      }
    ]);
    assert(answered(made) === 'ok', 'requests: the list was not created');
    const share = await shares.create(id, 'player');
    assert(share.ok, 'requests: the share was not made');
    if (!share.ok) return;
    leave = await joinLive(port, 'owner:' + userId, got);
    assert(leave !== null, 'requests: the owner topic was refused three times');
    if (!leave) return;
    const saw = (by: (b: string | null) => boolean): Promise<boolean> =>
      waitFor(() =>
        got.some((m) => {
          const r = readRequestMessage(m.event, m.payload);
          return r?.list === id && by(r.by);
        })
      );

    const r1 = lists.newId();
    const ONE = [{ item: 'ci1', qty: 1 }];
    const sent = await requests.send(r1, share.token, ONE);
    assert(sent.ok, 'requests: a send answered ' + JSON.stringify(sent));
    assert(await saw((b) => b === null), 'requests: no request message with by null');
    const replay = await requests.send(r1, share.token, ONE);
    assert(replay.ok, 'requests: a replay answered ' + JSON.stringify(replay));

    const read = await requests.list();
    const mine = read.ok ? read.requests.filter((r) => r.listId === id) : [];
    const first = mine[0];
    assert(
      mine.length === 1 &&
        first?.id === r1 &&
        first.audience === 'player' &&
        JSON.stringify(first.lines) ===
          JSON.stringify([{ item: 'ci1', qty: 1, price: 150, applied: null }]),
      'requests: the owner does not read the one request: ' + JSON.stringify(mine)
    );
    const hour = first ? Date.parse(first.expiresAt) - Date.parse(first.createdAt) : 0;
    assert(Math.abs(hour - 3_600_000) <= 1000, 'requests: it does not expire in an hour');

    const r2 = lists.newId();
    const two = [
      { item: 'ci1', qty: 1 },
      { item: 'cc1', qty: 2 }
    ];
    assert((await requests.send(r2, share.token, two)).ok, 'requests: the second send failed');
    const short = await requests.apply(r2, false);
    assert(
      JSON.stringify(short) ===
        JSON.stringify({
          ok: false,
          error: 'short',
          short: [{ item: 'cc1', want: 2, have: 1 }]
        }),
      'requests: an over-stock apply answered ' + JSON.stringify(short)
    );
    const clamped = await requests.apply(r2, true);
    assert(
      clamped.ok && clamped.taken === 2,
      'requests: a clamped apply answered ' + JSON.stringify(clamped)
    );
    const after = await theList(port, id, assert, 'after the apply');
    assert(
      after?.list_entries
        .map((e) => [e.item_key, e.quantity, e.position].join('|'))
        .join(';') === 'ci1|4|0',
      'requests: the apply did not lower ci1 and delete cc1'
    );

    assert((await requests.decline(r1)).ok, 'requests: the decline was refused');
    assert(
      await saw((b) => b === port.events.tab),
      "requests: no request message with this port's tab"
    );
    const twice = await requests.decline(r1);
    assert(
      !twice.ok && twice.error === 'decided',
      'requests: a second decline was not decided'
    );
    const late = await requests.apply(r1, false);
    assert(!late.ok && late.error === 'decided', 'requests: an apply after it was not decided');
    const left = await requests.list();
    assert(
      left.ok && !left.requests.some((r) => r.listId === id),
      'requests: a decided request is still pending'
    );

    const stale = await requests.send(lists.newId(), share.token, [{ item: 'zz1', qty: 1 }]);
    assert(!stale.ok && stale.error === 'stale', 'requests: an unknown item was not stale');

    for (let i = 0; i < 3; i++) {
      assert(
        (await requests.send(lists.newId(), share.token, ONE)).ok,
        'requests: a send failed'
      );
    }
    const rate = await requests.send(lists.newId(), share.token, ONE);
    assert(
      !rate.ok && rate.error === 'limit' && rate.key === 'request_rate' && rate.value === 5,
      'requests: the sixth send in a minute answered ' + JSON.stringify(rate)
    );

    const nowhere = await requests.send(lists.newId(), 'nonsense', ONE);
    assert(!nowhere.ok && nowhere.error === 'gone', 'requests: an unknown link was not gone');
    const noApply = await requests.apply(lists.newId(), false);
    assert(!noApply.ok && noApply.error === 'gone', 'requests: an unknown apply was not gone');
    const noDecline = await requests.decline(lists.newId());
    assert(
      !noDecline.ok && noDecline.error === 'gone',
      'requests: an unknown decline was not gone'
    );
  } finally {
    leave?.();
    await lists.apply([{ op: 'remove', id }]);
  }
}

/* The most the maximal import may take, client wall clock with the upload and PostgREST;
   the `authenticated` role's 8 s timeout bounds only the database's part. */
const IMPORT_MS = 6000;
/* A note of 250 characters, mostly Cyrillic: 50 lists of 100 entries with two such notes
   are about 5.5 MB of rows, the rows a file of 5 MiB (`FILE_MAX_BYTES`) makes. */
const HEAVY_NOTE = 'Заметка мастера о предмете. '.repeat(9).slice(0, 250);

const importRow = (
  id: string,
  name: string,
  entries: EntryRow[] = [],
  over: Partial<ImportRow['list']> = {}
): ImportRow => ({
  list: { id, name, money_mode: 'bag', player_note: '', gm_note: '', ...over },
  entries
});

/** Returns 50 lists of 100 entries (the catalog-shaped ids `r0000`...), each entry's two
 *  notes set to `note`. */
function fullImport(port: CloudPort, note: string): ImportRow[] {
  return Array.from({ length: 50 }, (_, i) =>
    importRow(
      port.lists.newId(),
      'e2e ' + String(i),
      Array.from({ length: 100 }, (_, j) =>
        entryOf(port.lists.newId(), 'r' + String(j).padStart(4, '0'), j, {
          player_note: note,
          gm_note: note
        })
      )
    )
  );
}

async function removeAll(port: CloudPort, assert: Assert, when: string): Promise<void> {
  const all = (await listsOf(port, assert, when)) ?? [];
  if (!all.length) return;
  const gone = await port.lists.apply(all.map((l) => ({ op: 'remove' as const, id: l.id })));
  assert(
    answered(gone) === all.map(() => 'ok').join(','),
    'import: removing the lists ' + when + ' answered ' + answered(gone)
  );
}

async function importCases(
  port: CloudPort,
  assert: Assert,
  log: (msg: string) => void
): Promise<void> {
  const { lists } = port;
  const before = (await listsOf(port, assert, 'before the import'))?.length ?? 0;
  const [l1, l2] = [lists.newId(), lists.newId()];
  const rows = [
    importRow(
      l1,
      'Импорт',
      [
        entryOf(lists.newId(), 'ci1', 0, {
          quantity: 2,
          price_coins: 150,
          player_note: 'a',
          gm_note: 'b'
        }),
        entryOf(lists.newId(), 'q1', 1)
      ],
      { money_mode: 'coin', player_note: 'p', gm_note: 'g' }
    ),
    importRow(l2, 'Пустой')
  ];
  const first = await lists.import(rows);
  assert(first.ok, 'import: two lists answered ' + JSON.stringify(first));
  const got = await theList(port, l1, assert, 'after the import');
  assert(
    got?.name === 'Импорт' &&
      got.money_mode === 'coin' &&
      got.player_note === 'p' &&
      got.gm_note === 'g',
    'import: the list does not read back as imported'
  );
  assert(
    got?.list_entries.map(view).join(';') === 'ci1|2|150|a|b;q1|1|||',
    'import: the entries do not read back in order'
  );
  const empty = await theList(port, l2, assert, 'after the import');
  assert(empty?.list_entries.length === 0, 'import: the empty list reads back with entries');
  const again = await lists.import(rows);
  assert(again.ok, 'import: the same rows again answered ' + JSON.stringify(again));
  const count = (await listsOf(port, assert, 'after the retry'))?.length;
  assert(count === before + 2, 'import: the same rows again changed the count of lists');

  /* All or nothing: a refused second list leaves no first list. */
  const [a, b] = [lists.newId(), lists.newId()];
  const long = Array.from({ length: 101 }, (_, i) =>
    entryOf(lists.newId(), 'r' + String(i).padStart(4, '0'), i)
  );
  const over = await lists.import([importRow(a, 'A'), importRow(b, 'B', long)]);
  assert(
    !over.ok && over.error === 'limit' && over.key === 'entries_per_list' && over.value === 100,
    'import: a list of 101 entries answered ' + JSON.stringify(over)
  );
  const left = (await listsOf(port, assert, 'after the refused import')) ?? [];
  assert(!left.some((l) => l.id === a || l.id === b), 'import: a refused import left a list');

  /* The largest import an account at the default limits holds, timed at the client with the
     upload; the 8 s statement timeout bounds only the database's part. */
  await removeAll(port, assert, 'before the maximal import');
  let started = Date.now();
  const full = await lists.import(fullImport(port, ''));
  let ms = Date.now() - started;
  log('import of 50 lists of 100 entries: ' + String(ms) + ' ms');
  assert(full.ok, 'import: 50 lists of 100 entries answered ' + JSON.stringify(full));
  assert(ms < IMPORT_MS, 'import: 50 lists of 100 entries took ' + String(ms) + ' ms');
  const more = await lists.import([importRow(lists.newId(), 'Лишний')]);
  assert(
    !more.ok && more.error === 'limit' && more.key === 'lists_per_owner' && more.value === 50,
    'import: a 51st list answered ' + JSON.stringify(more)
  );
  assert(
    (await listsOf(port, assert, 'after the 51st list'))?.length === 50,
    'import: a refused 51st list was inserted'
  );
  await removeAll(port, assert, 'after the maximal import');

  /* The same with long notes: the request body a 5 MiB file makes. Its time is logged, not
     asserted: it swings 0.4-5 s on the swapping test host (docs/specs/COVERAGE.md, case L). */
  const heavy = fullImport(port, HEAVY_NOTE);
  const bytes = new TextEncoder().encode(JSON.stringify(heavy)).length;
  started = Date.now();
  const sent = await lists.import(heavy);
  ms = Date.now() - started;
  log('import of a 5 MB file (' + String(bytes) + ' bytes of rows): ' + String(ms) + ' ms');
  assert(
    bytes > 5_000_000 && bytes < 6_000_000,
    'import: the notes-heavy rows are ' + String(bytes) + ' bytes, not about 5.5 MB'
  );
  assert(sent.ok, 'import: the notes-heavy import answered ' + JSON.stringify(sent));
  await removeAll(port, assert, 'after the notes-heavy import');
}

/* M. A source and an item written, read back, updated with and without the revision,
   referred to and frozen in a list, projected through a share, and removed, on the doomed
   user; the account's deletion takes whatever is left. */
async function homebrewCases(port: CloudPort, assert: Assert): Promise<void> {
  const { homebrew, lists, shares } = port;
  const first = await homebrew.load();
  assert(
    first.ok && !first.books.length && !first.items.length && first.itemLimit === 100,
    'homebrew: a new account does not read no rows and the limit 100: ' + JSON.stringify(first)
  );
  const [k1, k2] = [homebrew.newKey(), homebrew.newKey()];
  assert(
    HOMEBREW_KEY.test(k1) && HOMEBREW_KEY.test(k2) && k1 !== k2,
    'homebrew: newKey() does not make two different keys of the key shape'
  );

  const bookId = homebrew.newId();
  const section = homebrew.newKey();
  const book: BookContent = {
    ru: 'Мастерская Ольхи',
    en: 'Alder Workshop',
    sections: [{ key: section, ru: 'Холодное оружие', en: 'Blades' }]
  };
  const bookRow = { id: bookId, key: homebrew.newKey(), content: book };
  assert((await homebrew.createBook(bookRow)).ok, 'homebrew: a source was refused');
  assert(
    (await homebrew.createBook(bookRow)).ok,
    'homebrew: a second create of a source was refused'
  );

  const itemId = homebrew.newId();
  const key = homebrew.newKey();
  const axe: HomebrewContent = {
    kind: 'equip',
    ru: 'Топор Тлеющих Углей',
    en: 'Ember Axe',
    section,
    eq: {
      t: 'weapon',
      tier: 2,
      cls: 'mag',
      tr: 'spellcast',
      rg: 'melee',
      dmg: 'd10+2',
      dt: 'mag',
      bu: 2
    }
  };
  const itemRow = { id: itemId, key, book_id: bookId, content: axe };
  assert((await homebrew.createItem(itemRow)).ok, 'homebrew: an item was refused');
  const twice = await homebrew.createItem({ ...itemRow, id: homebrew.newId() });
  assert(
    !twice.ok && twice.error === 'refused',
    'homebrew: a repeated key answered ' + JSON.stringify(twice)
  );
  const weapon = await homebrew.createItem({
    id: homebrew.newId(),
    key: homebrew.newKey(),
    book_id: null,
    content: { kind: 'weapon', ru: 'Клинок' } as unknown as HomebrewContent
  });
  assert(
    !weapon.ok && weapon.error === 'refused',
    'homebrew: the kind weapon answered ' + JSON.stringify(weapon)
  );

  const read = await homebrew.load();
  const gotBook = read.ok ? read.books : [];
  const gotItem = read.ok ? read.items : [];
  assert(
    gotBook.length === 1 &&
      gotBook[0]?.revision === 1 &&
      canonJson({ id: gotBook[0].id, key: gotBook[0].key, content: gotBook[0].content }) ===
        canonJson(bookRow),
    'homebrew: the source does not read back as created'
  );
  assert(
    gotItem.length === 1 &&
      gotItem[0]?.revision === 1 &&
      canonJson({
        id: gotItem[0].id,
        key: gotItem[0].key,
        book_id: gotItem[0].book_id,
        content: gotItem[0].content
      }) === canonJson(itemRow),
    'homebrew: the item does not read back as created'
  );

  const edited: HomebrewContent = { ...axe, rud: 'Лезвие тлеет.' };
  const patch = { content: edited, book_id: bookId };
  const saved = await homebrew.updateItem(itemId, patch, 1);
  assert(
    canonJson(saved) === canonJson({ ok: true, revision: 2 }),
    'homebrew: an update answered ' + JSON.stringify(saved)
  );
  const again = await homebrew.updateItem(itemId, patch, 1);
  assert(
    canonJson(again) === canonJson({ ok: true, revision: 2 }),
    'homebrew: the same update sent again answered ' + JSON.stringify(again)
  );
  const stale = await homebrew.updateItem(
    itemId,
    { ...patch, content: { ...edited, rud: 'Другое.' } },
    1
  );
  assert(
    !stale.ok && stale.error === 'conflict',
    'homebrew: a stale update answered ' + JSON.stringify(stale)
  );
  const forced = await homebrew.updateItem(itemId, patch, null);
  assert(
    canonJson(forced) === canonJson({ ok: true, revision: 3 }),
    'homebrew: a forced update answered ' + JSON.stringify(forced)
  );

  const potionKey = homebrew.newKey();
  const frozen = recordOf(
    potionKey,
    { kind: 'consumable', ru: 'Настой кузнеца', rud: 'Выпейте перед работой у горна.' },
    null
  );
  const listId = lists.newId();
  const made = await lists.apply([
    {
      op: 'create',
      list: { id: listId, name: 'Хоумбрю', money_mode: 'bag', player_note: '', gm_note: '' },
      entries: [
        entryOf(lists.newId(), key, 0, { source: 'homebrew' }),
        entryOf(lists.newId(), potionKey, 1, { source: 'homebrew', snapshot: frozen })
      ]
    },
    {
      op: 'add',
      list_id: listId,
      entries: [entryOf(lists.newId(), homebrew.newKey(), 2, { source: 'homebrew' })]
    }
  ]);
  assert(
    answered(made) === 'ok,refused',
    'homebrew: the list writes answered ' + answered(made)
  );

  const share = await shares.create(listId, 'player');
  assert(share.ok, 'homebrew: the share was not made');
  if (!share.ok) return;
  const projected = async (): Promise<unknown[]> => {
    const r = await shares.read(share.token);
    return r.ok && r.shared ? r.shared.entries.map((e) => e.snapshot) : [];
  };
  const withBook = { ...book, key: bookRow.key };
  let snaps = await projected();
  assert(
    snaps.length === 2 &&
      canonJson(snaps[0]) === canonJson(recordOf(key, edited, withBook)) &&
      canonJson(snaps[1]) === canonJson(frozen),
    'homebrew: the share does not project the live item and the frozen copy: ' +
      canonJson(snaps)
  );

  const renamed: BookContent = { ...book, ru: 'Мастерская Ольхи II' };
  const bookSaved = await homebrew.updateBook(bookId, renamed, 1);
  assert(
    canonJson(bookSaved) === canonJson({ ok: true, revision: 2 }),
    'homebrew: a source update answered ' + JSON.stringify(bookSaved)
  );
  snaps = await projected();
  const projectedBook = (snaps[0] as { book?: { ru?: string } } | null)?.book;
  assert(
    projectedBook?.ru === 'Мастерская Ольхи II',
    'homebrew: the share does not show the renamed source'
  );

  assert((await homebrew.removeItem(itemId)).ok, 'homebrew: the item removal was refused');
  const left = await theList(port, listId, assert, 'after the item removal');
  assert(
    left?.list_entries.map((e) => e.item_key).join(',') === potionKey,
    'homebrew: the item removal did not leave only the frozen entry'
  );
  const gone = await homebrew.updateItem(itemId, patch, null);
  assert(
    !gone.ok && gone.error === 'gone',
    'homebrew: an update of a removed item answered ' + JSON.stringify(gone)
  );

  assert((await homebrew.removeBook(bookId)).ok, 'homebrew: the source removal was refused');
  const end = await homebrew.load();
  assert(end.ok && !end.books.length, 'homebrew: the removed source is still read');
  assert(
    answered(await lists.apply([{ op: 'remove', id: listId }])) === 'ok',
    'homebrew: the list removal was refused'
  );
}

export async function runCloudContract(
  make: (as?: string) => Promise<CloudPort>,
  users: ContractUsers,
  assert: (cond: boolean, msg: string) => void,
  log: (msg: string) => void = () => undefined
): Promise<void> {
  /* A. signed out, with no redirect to report and no preferences */
  const signedOut = await make();
  const out = signedOut.auth;
  assert((await out.session()) === null, 'signed out: session is not null');
  const none = await out.identities();
  assert(Array.isArray(none) && none.length === 0, 'signed out: identities are not []');
  assert((await out.redirectResult()) === null, 'a fresh port: there is a redirect result');
  const outRead = await signedOut.prefs.load();
  assert(!outRead.ok, 'prefs: signed out, load() is not { ok: false }');
  assert(
    !(await signedOut.prefs.save({ view: 'grid' })),
    'prefs: signed out, save() was taken'
  );
  assert(!(await signedOut.lists.list()).ok, 'lists: signed out, list() is not { ok: false }');
  const nothing = await signedOut.shares.read('nonsense');
  assert(nothing.ok && nothing.shared === null, 'shares: an unknown token does not read null');
  assert(
    (await signedOut.shares.ownerOf('nonsense')) === null,
    'shares: signed out, ownerOf() is not null'
  );
  /* Signed out is a lapsed session to a write: kept, and sent again. */
  const outClone = await signedOut.shares.clone('nonsense', signedOut.lists.newId());
  assert(
    !outClone.ok && outClone.error === 'network',
    'shares: signed out, clone() does not answer network'
  );
  const outApply = await signedOut.lists.apply([{ op: 'remove', id: signedOut.lists.newId() }]);
  assert(
    answered(outApply) === 'call:network',
    'lists: signed out, apply() answered ' + answered(outApply)
  );
  const outMove = await signedOut.lists.move(signedOut.lists.newId(), '{"ids":[]}');
  assert(
    !outMove.ok && outMove.error === 'network',
    'move: signed out, move() does not answer network'
  );
  assert(
    !(await signedOut.homebrew.load()).ok,
    'homebrew: signed out, load() is not { ok: false }'
  );
  const outItem = await signedOut.homebrew.createItem({
    id: signedOut.homebrew.newId(),
    key: signedOut.homebrew.newKey(),
    book_id: null,
    content: { kind: 'item', ru: 'Кольцо' }
  });
  assert(
    !outItem.ok && outItem.error === 'network',
    'homebrew: signed out, createItem() does not answer network'
  );

  /* B. a port made as the member is signed in as the member */
  const { member } = users;
  const { auth, prefs } = await make(member.as);
  const s = await auth.session();
  assert(s?.userId === member.userId, 'as member: session is not the member');
  assert(s?.email === member.email, "as member: session email is not the member's");
  const ids = await auth.identities();
  assert(Array.isArray(ids), 'as member: identities are not an array');
  assert(
    (ids ?? []).every((i) => PROVIDERS.includes(i.provider)),
    'as member: an identity is neither google nor discord'
  );
  assert((await prefs.load()).ok, 'prefs: as member, load() is not ok');

  /* C. an identity the account does not hold is refused */
  const unlinked = await auth.unlink(UNKNOWN_IDENTITY);
  assert(
    !unlinked.ok && unlinked.error === 'failed',
    'unlink: an unknown identity was not refused'
  );

  /* D. signOut clears and announces null. The real client announces the
     current session on subscribe and the fake does not: that is let land,
     and only what follows the sign-out is compared. */
  const seen: (Session | null)[] = [];
  const off = auth.onChange((x) => seen.push(x));
  await auth.session();
  await new Promise((r) => setTimeout(r, 0));
  const before = seen.length;
  const left = await auth.signOut();
  assert(left.ok, 'signOut: refused');
  assert((await auth.session()) === null, 'signOut: session is not null');
  const after = seen.slice(before);
  assert(after.length === 1 && after[0] === null, 'signOut: onChange did not fire null once');
  off();

  /* F. the doomed user's preferences: none, then a whole row, then a save
     that replaces it */
  const doomedPort = await make(users.doomed);
  const first = await doomedPort.prefs.load();
  assert(first.ok && first.prefs === null, 'prefs: a new account does not read { ok, null }');
  const P1: Prefs = {
    lang: 'en',
    home: '#/lists',
    view: 'grid',
    printBw: true,
    printCompact: false,
    notifyGm: 'always'
  };
  assert(await doomedPort.prefs.save(P1), 'prefs: save() of a whole row was refused');
  const saved = await doomedPort.prefs.load();
  assert(saved.ok && samePrefs(saved.prefs, P1), 'prefs: load() does not read the row saved');
  assert(await doomedPort.prefs.save({ view: 'list' }), 'prefs: a second save() was refused');
  const replaced = await doomedPort.prefs.load();
  assert(
    replaced.ok && samePrefs(replaced.prefs, { view: 'list' }),
    'prefs: a save() did not replace the whole row'
  );

  /* G. a list written and read back through every write, on the doomed
     user. The account's deletion (E) takes the rows with it,
     so a run against the hosted project leaves nothing behind. */
  await listCases(doomedPort, assert);

  /* H. share links made, read, deleted, made again and copied, on the doomed
     user; the account's deletion takes them with it. */
  await shareCases(doomedPort, assert);

  /* I. browser lists moved into the account, once per text, on the doomed
     user; the account's deletion takes the rows with it. */
  await moveCases(doomedPort, assert, log);

  /* J. the live topics, on a fresh member port; the list it makes is removed. */
  await liveCases(await make(member.as), await make(), member.userId, assert);

  /* K. the purchase requests, on the doomed user; the list it makes is removed. */
  await requestCases(doomedPort, assert);

  /* L. lists imported from a file, all or nothing, on the doomed user; the account's
     deletion takes the rows with it. */
  await importCases(doomedPort, assert, log);

  /* M. the homebrew rows, on the doomed user; the account's deletion takes the rows with
     it. */
  await homebrewCases(doomedPort, assert);

  /* E. deleteAccount leaves nothing signed in */
  const doomed = doomedPort.auth;
  const deleted = await doomed.deleteAccount();
  assert(deleted.ok, 'deleteAccount: refused');
  assert((await doomed.session()) === null, 'deleteAccount: session is not null');
  const gone = await doomed.identities();
  assert(Array.isArray(gone) && gone.length === 0, 'deleteAccount: identities are not []');
}
