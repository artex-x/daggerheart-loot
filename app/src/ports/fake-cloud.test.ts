/* The fake cloud against the contract every `CloudPort` must meet, and the
   test build's `?as=` switch. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bundleText, toBundle } from '../lib/bundle.js';
import { toCloudList, type EntryRow, type ImportRow, type ListOp } from '../lib/cloudLists.js';
import { buildIndex, type Loot } from '../lib/data.js';
import { runCloudContract } from './cloud.contract.js';
import { fakeCloud, installFakeCloud } from './fake-cloud.js';
import { SEED, uuid } from './fake-cloud-seed.js';
import { browserEnv, fakeEnv } from './index.js';
import type { CloudPort, Session } from './types.js';

afterEach(() => {
  delete window.__dhlootFake;
});

describe('the fake cloud', () => {
  it('meets the cloud contract', async () => {
    const gm1 = SEED.users.gm1;
    await runCloudContract(
      (as) => Promise.resolve(fakeCloud(SEED, as)),
      { member: { as: 'gm1', userId: gm1.id, email: gm1.email }, doomed: 'gm2' },
      (c, m) => {
        expect(c, m).toBe(true);
      }
    );
  });

  /* The seed's own behaviour: on the test project a sign-in and a link are
     provider redirects, its user holds no Google or Discord identity, and
     there is no second seeded user (docs/specs/COVERAGE.md, "Test layers"). */
  it('signs the default user in and notifies once', async () => {
    const { auth } = fakeCloud(SEED);
    const seen: (Session | null)[] = [];
    auth.onChange((s) => seen.push(s));
    expect(await auth.signIn('google')).toEqual({ ok: true });
    const s = await auth.session();
    expect(s?.userId).toBe(SEED.users.gm1.id);
    expect(s?.email).toBe(SEED.users.gm1.email);
    expect(seen.map((x) => x?.userId)).toEqual([SEED.users.gm1.id]);
  });

  it("lists the identities in the seed's order", async () => {
    const { auth } = fakeCloud(SEED, 'gm1');
    expect((await auth.identities())?.map((i) => i.id)).toEqual(
      SEED.users.gm1.identities.map((i) => i.id)
    );
  });

  it('unlinks one identity, then refuses the last', async () => {
    const { auth } = fakeCloud(SEED, 'gm1');
    expect(await auth.unlink(uuid(12))).toEqual({ ok: true });
    expect(await auth.unlink(uuid(11))).toEqual({ ok: false, error: 'lastIdentity' });
  });

  it('links an identity back', async () => {
    const { auth } = fakeCloud(SEED, 'gm1');
    await auth.unlink(uuid(12));
    expect(await auth.link('discord')).toEqual({ ok: true });
    expect(await auth.identities()).toHaveLength(2);
  });

  it('starts a port made as gm2 signed in, with one identity', async () => {
    const { auth } = fakeCloud(SEED, 'gm2');
    expect((await auth.session())?.userId).toBe(SEED.users.gm2.id);
    expect(await auth.identities()).toHaveLength(1);
  });

  it('throws on a user the seed does not have, naming it', () => {
    expect(() => fakeCloud(SEED, 'nobody')).toThrow('"nobody"');
  });

  it('refuses what needs a user while signed out, and an identity it does not know', async () => {
    const { auth } = fakeCloud(SEED);
    expect(await auth.link('google')).toEqual({ ok: false, error: 'failed' });
    expect(await auth.unlink(uuid(11))).toEqual({ ok: false, error: 'failed' });
    expect(await auth.deleteAccount()).toEqual({ ok: false, error: 'failed' });
    const gm1 = fakeCloud(SEED, 'gm1').auth;
    expect(await gm1.unlink(uuid(99))).toEqual({ ok: false, error: 'failed' });
  });

  it('stops notifying after the listener is removed', async () => {
    const { auth } = fakeCloud(SEED);
    let calls = 0;
    const off = auth.onChange(() => {
      calls++;
    });
    off();
    await auth.signIn('discord');
    expect(calls).toBe(0);
  });

  it('refuses a link with `linkError`, changing nothing and telling nobody', async () => {
    const { auth } = fakeCloud(SEED, 'gm2', { linkError: 'alreadyLinked' });
    let calls = 0;
    auth.onChange(() => {
      calls++;
    });
    expect(await auth.link('discord')).toEqual({ ok: false, error: 'alreadyLinked' });
    expect(await auth.identities()).toHaveLength(1);
    expect(calls).toBe(0);
  });

  it('answers `redirectResult()` with `returned`, as given', async () => {
    const returned = {
      kind: 'link',
      provider: 'discord',
      result: { ok: false, error: 'alreadyLinked' },
      action: null
    } as const;
    const { auth } = fakeCloud(SEED, 'gm2', { returned });
    expect(await auth.redirectResult()).toEqual(returned);
    expect(await fakeCloud(SEED).auth.redirectResult()).toBeNull();
  });

  it('keeps each port apart from the seed and from the others', async () => {
    await fakeCloud(SEED, 'gm1').auth.deleteAccount();
    expect(await fakeCloud(SEED, 'gm1').auth.identities()).toHaveLength(2);
    expect(SEED.users.gm1.identities).toHaveLength(2);
  });

  it("loads gm1's seed row, and no row for gm2", async () => {
    expect(await fakeCloud(SEED, 'gm1').prefs.load()).toEqual({
      ok: true,
      prefs: { lang: 'ru', view: 'grid', printBw: true, printCompact: true }
    });
    expect(await fakeCloud(SEED, 'gm2').prefs.load()).toEqual({ ok: true, prefs: null });
  });

  it('keeps a saved row to its own port', async () => {
    const one = fakeCloud(SEED, 'gm1');
    expect(await one.prefs.save({ view: 'list' })).toBe(true);
    expect(await one.prefs.load()).toEqual({ ok: true, prefs: { view: 'list' } });
    expect(await fakeCloud(SEED, 'gm1').prefs.load()).toEqual({
      ok: true,
      prefs: SEED.users.gm1.prefs
    });
    expect(SEED.users.gm1.prefs).toEqual({
      lang: 'ru',
      view: 'grid',
      printBw: true,
      printCompact: true
    });
  });

  it('reads no preferences once the account is deleted', async () => {
    const port = fakeCloud(SEED, 'gm1');
    await port.auth.deleteAccount();
    expect(await port.prefs.load()).toEqual({ ok: false });
    expect(await port.prefs.save({ view: 'grid' })).toBe(false);
  });
});

/* The seed's lists and shares, pinned to the database's bounds. */
describe('the seeded lists and shares', () => {
  const loot = JSON.parse(
    readFileSync(join(import.meta.dirname, '..', '..', '..', 'data.json'), 'utf8')
  ) as Loot;
  const index = buildIndex(loot);
  const lists = Object.values(SEED.lists).flat();
  const entries = lists.flatMap((l) => l.entries);

  it('names only records of the dataset', () => {
    expect(entries.map((e) => e.itemKey).filter((k) => !index.byId.has(k))).toEqual([]);
  });

  it('gives every list, entry and share its own id', () => {
    const ids = [...lists, ...entries, ...SEED.shares].map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps quantities in 1..99, prices in 1..99999, positions in order, one record per list', () => {
    for (const e of entries) {
      expect(e.qty ?? 1).toBeGreaterThanOrEqual(1);
      expect(e.qty ?? 1).toBeLessThanOrEqual(99);
      expect(e.gold ?? 1).toBeGreaterThanOrEqual(1);
      expect(e.gold ?? 1).toBeLessThanOrEqual(99999);
    }
    for (const l of lists) {
      expect(l.entries.map((e) => e.position)).toEqual(l.entries.map((_, i) => i));
      expect(new Set(l.entries.map((e) => e.itemKey)).size).toBe(l.entries.length);
      expect(l.editedAgoMs).toBeLessThanOrEqual(l.createdAgoMs);
    }
  });

  it('shares only a seeded list, one active share per audience', () => {
    const listIds = new Set(lists.map((l) => l.id));
    expect(SEED.shares.every((s) => listIds.has(s.listId))).toBe(true);
    const keys = SEED.shares.map((s) => `${s.listId}:${s.audience}`);
    expect(new Set(keys).size).toBe(keys.length);
    const tokens = SEED.shares.map((s) => s.token);
    expect(new Set(tokens).size).toBe(tokens.length);
  });
});

describe("the fake's lists", () => {
  const HOUR = 3_600_000;
  const DAY = 24 * HOUR;
  const entry = (id: string, key: string, position: number): EntryRow => ({
    id,
    item_key: key,
    source: 'official',
    snapshot: null,
    position,
    quantity: 1,
    price_coins: null,
    player_note: '',
    gm_note: ''
  });
  const newList = (id: string, name = 'X') => ({
    id,
    name,
    money_mode: 'bag' as const,
    player_note: '',
    gm_note: ''
  });
  const OK = { ok: true };
  const OK1 = { ok: true, results: [OK] };
  const GONE = { ok: false, error: 'gone' };
  const REFUSED = { ok: false, error: 'refused' };
  const rowsOf = async (port: CloudPort) => {
    const read = await port.lists.list();
    if (!read.ok) throw new Error('the read failed');
    return read.lists;
  };

  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-09-25T12:00:00Z') });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("answers gm1's three seeded lists, times back from boot, entries in position order", async () => {
    const lists = await rowsOf(fakeCloud(SEED, 'gm1'));
    const boot = Date.now();
    expect(lists.map((l) => l.name)).toEqual(['Лавка кузнеца', 'Пустой список', 'Трофеи']);
    expect(lists.map((l) => Date.parse(l.updated_at))).toEqual([
      boot - 3 * DAY,
      boot - HOUR,
      boot - 30 * DAY
    ]);
    expect(Date.parse(lists[0]?.created_at ?? '')).toBe(boot - 10 * DAY);
    const shop = lists[0];
    expect(shop?.money_mode).toBe('coin');
    expect(shop?.list_entries.map((e) => e.item_key)).toEqual([
      'ci1',
      'q1',
      'q313',
      'cc1',
      'voa2_a3',
      'q23',
      'w51',
      'q35',
      'di11'
    ]);
    expect(shop?.list_entries[0]).toMatchObject({ quantity: 2, price_coins: 150 });
    expect(shop?.list_entries[4]).toMatchObject({ gm_note: 'Проклят.', player_note: '' });
  });

  it("answers gm2's one list, and nothing signed out", async () => {
    expect((await rowsOf(fakeCloud(SEED, 'gm2'))).map((l) => l.id)).toEqual([uuid(201)]);
    expect(await fakeCloud(SEED).lists.list()).toEqual({ ok: false });
  });

  it('counts new ids from uuid(5000)', () => {
    const { lists } = fakeCloud(SEED, 'gm1');
    expect([lists.newId(), lists.newId()]).toEqual([uuid(5000), uuid(5001)]);
  });

  it('creates once, updates, adds, reorders and removes, each bumping the edit time', async () => {
    const port = fakeCloud(SEED, 'gm2');
    const { lists } = port;
    const e1 = entry(uuid(7001), 'ci1', 0);
    const create: ListOp = { op: 'create', list: newList(uuid(7000), 'Клад'), entries: [e1] };
    expect(await lists.apply([create])).toEqual(OK1);
    expect(await lists.apply([create])).toEqual(OK1);
    let mine = await rowsOf(port);
    expect(mine.filter((l) => l.id === uuid(7000))).toHaveLength(1);
    const made = Date.parse(mine.find((l) => l.id === uuid(7000))?.updated_at ?? '');
    expect(made).toBeGreaterThanOrEqual(Date.now());

    const add: ListOp = {
      op: 'add',
      list_id: uuid(7000),
      entries: [entry(uuid(7002), 'q1', 1)]
    };
    expect(
      await lists.apply([
        { op: 'update', id: uuid(7000), patch: { name: 'Клад дракона', money_mode: 'coin' } },
        add,
        add,
        { op: 'update_entry', id: uuid(7002), patch: { quantity: 3, gm_note: 'x' } },
        { op: 'reorder', list_id: uuid(7000), ids: [uuid(7002), uuid(7001)] }
      ])
    ).toEqual({ ok: true, results: [OK, OK, OK, OK, OK] });
    mine = await rowsOf(port);
    const got = mine.find((l) => l.id === uuid(7000));
    expect(got).toMatchObject({ name: 'Клад дракона', money_mode: 'coin' });
    expect(got?.list_entries.map((e) => [e.item_key, e.quantity, e.gm_note])).toEqual([
      ['q1', 3, 'x'],
      ['ci1', 1, '']
    ]);
    expect(Date.parse(got?.updated_at ?? '')).toBeGreaterThan(made);

    expect(await lists.apply([{ op: 'remove_entries', ids: [uuid(7001)] }])).toEqual(OK1);
    expect((await rowsOf(port)).find((l) => l.id === uuid(7000))?.list_entries).toHaveLength(1);
    expect(await lists.apply([{ op: 'remove', id: uuid(7000) }])).toEqual(OK1);
    expect((await rowsOf(port)).map((l) => l.id)).toEqual([uuid(201)]);
  });

  it('answers gone to an update of an unknown row and ok to its delete', async () => {
    const port = fakeCloud(SEED, 'gm2');
    const before = await rowsOf(port);
    expect(
      await port.lists.apply([
        { op: 'update', id: uuid(9), patch: { name: 'x' } },
        { op: 'update_entry', id: uuid(9), patch: { quantity: 2 } },
        { op: 'remove_entries', ids: [uuid(9)] },
        { op: 'remove', id: uuid(9) },
        { op: 'update', id: uuid(9), patch: {} },
        { op: 'update_entry', id: uuid(9), patch: {} }
      ])
    ).toEqual({ ok: true, results: [GONE, GONE, OK, OK, OK, OK] });
    expect(await rowsOf(port)).toEqual(before);
  });

  it("answers another user's list as gone or refused, and refuses a second entry for one record", async () => {
    const port = fakeCloud(SEED, 'gm2');
    expect(
      await port.lists.apply([
        { op: 'create', list: newList(uuid(101)), entries: [] },
        { op: 'add', list_id: uuid(101), entries: [entry(uuid(7003), 'q2', 0)] },
        { op: 'add', list_id: uuid(201), entries: [entry(uuid(7004), 'q23', 1)] },
        { op: 'reorder', list_id: uuid(201), ids: [] },
        { op: 'reorder', list_id: uuid(101), ids: [uuid(1101)] },
        { op: 'reorder', list_id: uuid(201), ids: [uuid(2101)] }
      ])
    ).toEqual({ ok: true, results: [REFUSED, GONE, REFUSED, OK, GONE, OK] });
  });

  it('keeps the given order of a reorder with a stale entry set and puts the other entries after it', async () => {
    const port = fakeCloud(SEED, 'gm2');
    const [e1, e2, e3] = [uuid(7001), uuid(7002), uuid(7003)];
    const create: ListOp = {
      op: 'create',
      list: newList(uuid(7000)),
      entries: [entry(e1, 'ci1', 0), entry(e2, 'q1', 1), entry(e3, 'cc1', 2)]
    };
    expect(
      await port.lists.apply([
        create,
        { op: 'reorder', list_id: uuid(7000), ids: [e3, uuid(2101), e1, e3] }
      ])
    ).toEqual({ ok: true, results: [OK, OK] });
    const got = (await rowsOf(port)).find((l) => l.id === uuid(7000));
    expect(got?.list_entries.map((e) => [e.id, e.position])).toEqual([
      [e3, 0],
      [e1, 1],
      [e2, 2]
    ]);
  });

  it('refuses a create over the entry limit whole, leaving no list', async () => {
    const port = fakeCloud(SEED, 'gm2', { limits: { entries: 1 } });
    const r = await port.lists.apply([
      {
        op: 'create',
        list: newList(uuid(7000)),
        entries: [entry(uuid(7001), 'ci1', 0), entry(uuid(7002), 'q1', 1)]
      }
    ]);
    expect(r).toEqual({
      ok: true,
      results: [{ ok: false, error: 'limit', key: 'entries_per_list', value: 1 }]
    });
    expect((await rowsOf(port)).map((l) => l.id)).toEqual([uuid(201)]);
  });

  it('applies the writes beside a refused one, in one call', async () => {
    const port = fakeCloud(SEED, 'gm2');
    expect(
      await port.lists.apply([
        { op: 'update', id: uuid(201), patch: { name: 'a' } },
        { op: 'add', list_id: uuid(201), entries: [entry(uuid(7005), 'q23', 1)] },
        { op: 'update', id: uuid(201), patch: { player_note: 'b' } }
      ])
    ).toEqual({ ok: true, results: [OK, REFUSED, OK] });
    expect((await rowsOf(port))[0]).toMatchObject({ name: 'a', player_note: 'b' });
  });

  it('answers the 51st list and the 101st entry with the limit and its value', async () => {
    const port = fakeCloud(SEED, 'gm2');
    const { lists } = port;
    const creates: ListOp[] = Array.from({ length: 49 }, () => ({
      op: 'create',
      list: newList(lists.newId()),
      entries: []
    }));
    const made = await lists.apply(creates);
    expect(made.ok && made.results.every((r) => r.ok)).toBe(true);
    expect(
      await lists.apply([{ op: 'create', list: newList(lists.newId()), entries: [] }])
    ).toEqual({
      ok: true,
      results: [{ ok: false, error: 'limit', key: 'lists_per_owner', value: 50 }]
    });
    const hundred = Array.from({ length: 99 }, (_, i) =>
      entry(lists.newId(), 'k' + String(i), i + 1)
    );
    expect(await lists.apply([{ op: 'add', list_id: uuid(201), entries: hundred }])).toEqual(
      OK1
    );
    expect(
      await lists.apply([
        { op: 'add', list_id: uuid(201), entries: [entry(lists.newId(), 'last', 100)] }
      ])
    ).toEqual({
      ok: true,
      results: [{ ok: false, error: 'limit', key: 'entries_per_list', value: 100 }]
    });
  });

  it('takes its limits from the options', async () => {
    const { lists } = fakeCloud(SEED, 'gm2', { limits: { lists: 1, entries: 1 } });
    expect(
      await lists.apply([
        { op: 'create', list: newList(uuid(7000)), entries: [] },
        { op: 'add', list_id: uuid(201), entries: [entry(uuid(7001), 'q1', 1)] }
      ])
    ).toMatchObject({
      results: [
        { error: 'limit', key: 'lists_per_owner', value: 1 },
        { error: 'limit', key: 'entries_per_list', value: 1 }
      ]
    });
  });

  it('answers network offline and signed out, and reads again when online', async () => {
    const port = fakeCloud(SEED, 'gm1', { offline: true });
    const network = { ok: false, error: 'network' };
    expect(await port.lists.list()).toEqual({ ok: false });
    expect(
      await port.lists.apply([{ op: 'update', id: uuid(101), patch: { name: 'x' } }])
    ).toEqual(network);
    port.setOffline(false);
    expect((await rowsOf(port)).map((l) => l.name)).toContain('Лавка кузнеца');
    port.setOffline(true);
    expect(await port.lists.apply([{ op: 'remove', id: uuid(101) }])).toEqual(network);
    const out = fakeCloud(SEED);
    expect(await out.lists.apply([{ op: 'remove', id: uuid(101) }])).toEqual(network);
    /* No writes make no call, offline or signed out, as the real port. */
    expect(await port.lists.apply([])).toEqual({ ok: true, results: [] });
    expect(await out.lists.apply([])).toEqual({ ok: true, results: [] });
    expect(port.writeCount()).toBe(0);
  });

  it('counts the calls it answered and the writes it applied', async () => {
    const port = fakeCloud(SEED, 'gm2');
    await port.lists.apply([
      { op: 'update', id: uuid(201), patch: { name: 'a' } },
      { op: 'update', id: uuid(201), patch: { name: 'b' } }
    ]);
    await port.lists.apply([]);
    expect([port.writeCount(), port.opCount()]).toEqual([1, 2]);
  });

  it('answers fault while the switch matches, applying nothing, and ends with false', async () => {
    const port = fakeCloud(SEED, 'gm2');
    const rename: ListOp = { op: 'update', id: uuid(201), patch: { name: 'a' } };
    const remove: ListOp = { op: 'remove_entries', ids: [uuid(9)] };
    port.setFault(true);
    expect(await port.lists.apply([rename])).toEqual({ ok: false, error: 'fault' });
    expect([port.writeCount(), port.opCount()]).toEqual([1, 0]);
    port.setFault((op) => op.op === 'remove_entries');
    expect(await port.lists.apply([rename, remove])).toEqual({ ok: false, error: 'fault' });
    expect(await port.lists.apply([rename])).toEqual(OK1);
    port.setFault(false);
    expect(await port.lists.apply([rename, remove])).toEqual({ ok: true, results: [OK, OK] });
    expect([port.writeCount(), port.opCount()]).toEqual([4, 3]);
    expect((await rowsOf(port))[0]?.name).toBe('a');
  });

  it('keeps each port apart, and drops the lists with the account', async () => {
    const one = fakeCloud(SEED, 'gm1');
    await one.lists.apply([{ op: 'remove', id: uuid(101) }]);
    expect(await rowsOf(fakeCloud(SEED, 'gm1'))).toHaveLength(3);
    await one.auth.deleteAccount();
    await one.auth.signIn('google');
    expect(await rowsOf(one)).toEqual([]);
  });

  it('holds two edits in one millisecond as two', async () => {
    const port = fakeCloud(SEED, 'gm2');
    await port.lists.apply([{ op: 'update', id: uuid(201), patch: { name: 'a' } }]);
    const first = (await rowsOf(port))[0]?.updated_at;
    await port.lists.apply([{ op: 'update', id: uuid(201), patch: { name: 'b' } }]);
    expect((await rowsOf(port))[0]?.updated_at).not.toBe(first);
  });
});

describe("the fake's move of a browser list", () => {
  const TEXT =
    '{"ids":["ci1","q1"],"meta":{"ci1":{"gold":150,"note":"n","qty":2}},"money":"coin","name":"Клад","note":"p"}';

  it('inserts once per text, then answers the first row, with a stable fingerprint', async () => {
    const port = fakeCloud(SEED, 'gm2');
    const id = port.lists.newId();
    expect(await port.lists.move(id, TEXT)).toEqual({ ok: true, id, inserted: true });
    expect(await port.lists.move(port.lists.newId(), TEXT)).toEqual({
      ok: true,
      id,
      inserted: false
    });
    const read = await port.lists.list();
    const row = read.ok ? read.lists.find((l) => l.id === id) : undefined;
    expect(row?.legacy_fingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(row?.money_mode).toBe('coin');
    expect(row?.player_note).toBe('p');
    expect(
      row?.list_entries.map((e) => [e.item_key, e.quantity, e.price_coins, e.player_note])
    ).toEqual([
      ['ci1', 2, 150, 'n'],
      ['q1', 1, null, '']
    ]);
    const other = read.ok ? read.lists.find((l) => l.id !== id) : undefined;
    expect(other?.legacy_fingerprint).toBeNull();
  });

  it('keeps the list ids at uuid(5000) and uuid(5001) whatever the entry counts', async () => {
    const port = fakeCloud(SEED, 'gm1');
    const many = JSON.stringify({ ids: ['ci1', 'ci2', 'ci3'], name: 'А' });
    expect(await port.lists.move(port.lists.newId(), many)).toMatchObject({ id: uuid(5000) });
    expect(await port.lists.move(port.lists.newId(), '{"ids":[],"name":"Б"}')).toMatchObject({
      id: uuid(5001)
    });
    const read = await port.lists.list();
    const first = read.ok ? read.lists.find((l) => l.id === uuid(5000)) : undefined;
    expect(first?.list_entries.map((e) => e.id)).toEqual([uuid(7000), uuid(7001), uuid(7002)]);
  });

  it('moves again as a new row once the first row is deleted', async () => {
    const port = fakeCloud(SEED, 'gm2');
    const id = port.lists.newId();
    await port.lists.move(id, TEXT);
    await port.lists.apply([{ op: 'remove', id }]);
    const again = port.lists.newId();
    expect(await port.lists.move(again, TEXT)).toEqual({ ok: true, id: again, inserted: true });
  });

  it('skips the count limits, as the RPC does', async () => {
    const port = fakeCloud(SEED, 'gm2', { limits: { lists: 1, entries: 1 } });
    const big = JSON.stringify({ ids: ['ci1', 'ci2', 'ci3'], name: 'Много' });
    expect(await port.lists.move(port.lists.newId(), big)).toMatchObject({ inserted: true });
  });

  it.each([
    ['not JSON', 'nope'],
    ['not an object', '[]'],
    ['an unknown key', '{"ids":[],"x":1}'],
    ['no ids', '{"name":"a"}'],
    ['an id of another form', '{"ids":["a b"]}'],
    ['a repeated id', '{"ids":["ci1","ci1"]}'],
    ['a name too long', JSON.stringify({ ids: [], name: 'я'.repeat(201) })],
    ['an odd money mode', '{"ids":[],"money":"gems"}'],
    ['a note that is not text', '{"ids":[],"note":5}'],
    ['a GM note too long', JSON.stringify({ ids: [], hnote: 'x'.repeat(4001) })],
    ['meta that is not an object', '{"ids":["ci1"],"meta":[]}'],
    ['meta of an id not in ids', '{"ids":["ci1"],"meta":{"q1":{"qty":2}}}'],
    ['an entry that is not an object', '{"ids":["ci1"],"meta":{"ci1":1}}'],
    ['an unknown meta key', '{"ids":["ci1"],"meta":{"ci1":{"x":1}}}'],
    ['a qty of 0', '{"ids":["ci1"],"meta":{"ci1":{"qty":0}}}'],
    ['a qty of 1.5', '{"ids":["ci1"],"meta":{"ci1":{"qty":1.5}}}'],
    ['a gold of 100000', '{"ids":["ci1"],"meta":{"ci1":{"gold":100000}}}'],
    ['an entry note that is not text', '{"ids":["ci1"],"meta":{"ci1":{"note":1}}}'],
    [
      'an entry GM note too long',
      JSON.stringify({ ids: ['ci1'], meta: { ci1: { hnote: 'x'.repeat(4001) } } })
    ]
  ])('refuses a text with %s', async (_what, text) => {
    const port = fakeCloud(SEED, 'gm2');
    expect(await port.lists.move(port.lists.newId(), text)).toEqual({
      ok: false,
      error: 'refused'
    });
  });

  it('refuses an id another list holds, and answers network offline and signed out', async () => {
    const port = fakeCloud(SEED, 'gm2');
    expect(await port.lists.move(uuid(101), TEXT)).toEqual({ ok: false, error: 'refused' });
    port.setOffline(true);
    expect(await port.lists.move(port.lists.newId(), TEXT)).toEqual({
      ok: false,
      error: 'network'
    });
    expect(await fakeCloud(SEED).lists.move(uuid(9000), TEXT)).toEqual({
      ok: false,
      error: 'network'
    });
  });
});

describe("the fake's share links", () => {
  const DAY = 24 * 3_600_000;
  const keysOf = (o: unknown): string[] =>
    Array.isArray(o)
      ? o.flatMap(keysOf)
      : o && typeof o === 'object'
        ? Object.entries(o).flatMap(([k, v]) => [k, ...keysOf(v)])
        : [];

  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-09-25T12:00:00Z') });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('reads the seed links signed out, the player link with no GM note key', async () => {
    const { shares } = fakeCloud(SEED);
    const player = await shares.read('player-token-1');
    const p = player.ok ? player.shared : null;
    expect(p?.list.name).toBe('Лавка кузнеца');
    expect(p?.list.player_note).toBe('Открыта с рассвета до заката.');
    expect(Date.parse(p?.updated_at ?? '')).toBe(Date.now() - 3 * DAY);
    expect(p?.entries.map((e) => e.item_key)).toEqual([
      'ci1',
      'q1',
      'q313',
      'cc1',
      'voa2_a3',
      'q23',
      'w51',
      'q35',
      'di11'
    ]);
    expect(keysOf(p)).not.toContain('gm_note');
    const gm = await shares.read('gm-token-1');
    const g = gm.ok ? gm.shared : null;
    expect(g?.audience).toBe('gm');
    expect(g?.list.gm_note).toBe('Кузнец торгуется, если назвать имя его брата.');
    expect(g?.entries[4]?.gm_note).toBe('Проклят.');
  });

  it("answers the owner's list id to its owner only", async () => {
    expect(await fakeCloud(SEED, 'gm1').shares.ownerOf('player-token-1')).toBe(uuid(101));
    expect(await fakeCloud(SEED, 'gm2').shares.ownerOf('player-token-1')).toBeNull();
    expect(await fakeCloud(SEED).shares.ownerOf('player-token-1')).toBeNull();
  });

  it("lists a list's shares to its owner only", async () => {
    const mine = await fakeCloud(SEED, 'gm1').shares.list(uuid(101));
    expect(
      mine.ok && mine.shares.map((x) => [x.id, x.audience, x.token, x.revoked_at])
    ).toEqual([
      [uuid(111), 'player', 'player-token-1', null],
      [uuid(113), 'gm', 'gm-token-1', null]
    ]);
    expect(await fakeCloud(SEED, 'gm2').shares.list(uuid(101))).toEqual({
      ok: true,
      shares: []
    });
    expect(await fakeCloud(SEED).shares.list(uuid(101))).toEqual({ ok: false });
  });

  it("refuses a share of another user's list, and counts new shares from 1", async () => {
    expect(await fakeCloud(SEED, 'gm2').shares.create(uuid(101), 'player')).toEqual({
      ok: false,
      error: 'refused'
    });
    const { shares } = fakeCloud(SEED, 'gm1');
    expect(await shares.create(uuid(103), 'player')).toEqual({
      ok: true,
      id: uuid(3001),
      token: 'share-token-1'
    });
    expect(await shares.create(uuid(101), 'player')).toEqual({
      ok: true,
      id: uuid(111),
      token: 'player-token-1'
    });
  });

  it("reads nothing through a removed list's link", async () => {
    const port = fakeCloud(SEED, 'gm1');
    expect(await port.lists.apply([{ op: 'remove', id: uuid(101) }])).toEqual({
      ok: true,
      results: [{ ok: true }]
    });
    expect(await port.shares.read('player-token-1')).toEqual({ ok: true, shared: null });
  });

  it('copies a GM link with its notes, and refuses a copy past the list limit', async () => {
    const port = fakeCloud(SEED, 'gm2', { limits: { lists: 2 } });
    const id = port.lists.newId();
    expect(await port.shares.clone('gm-token-1', id)).toEqual({ ok: true });
    const read = await port.lists.list();
    const copy = read.ok ? read.lists.find((l) => l.id === id) : undefined;
    expect(copy?.gm_note).toBe('Кузнец торгуется, если назвать имя его брата.');
    expect(copy?.list_entries[4]?.gm_note).toBe('Проклят.');
    expect(await port.shares.clone('gm-token-1', port.lists.newId())).toEqual({
      ok: false,
      error: 'limit',
      key: 'lists_per_owner',
      value: 2
    });
    expect(await port.shares.clone('gm-token-1', uuid(101))).toEqual({
      ok: false,
      error: 'refused'
    });
  });

  it('answers not ok, network and null offline, and network to a write signed out', async () => {
    const port = fakeCloud(SEED, 'gm1', { offline: true });
    const network = { ok: false, error: 'network' };
    expect(await port.shares.list(uuid(101))).toEqual({ ok: false });
    expect(await port.shares.read('player-token-1')).toEqual({ ok: false });
    expect(await port.shares.ownerOf('player-token-1')).toBeNull();
    expect(await port.shares.create(uuid(101), 'gm')).toEqual(network);
    expect(await port.shares.revoke(uuid(111))).toEqual(network);
    expect(await port.shares.clone('player-token-1', uuid(9))).toEqual(network);
    const out = fakeCloud(SEED).shares;
    expect(await out.create(uuid(101), 'gm')).toEqual(network);
    expect(await out.revoke(uuid(111))).toEqual(network);
    expect(await out.clone('player-token-1', uuid(9))).toEqual(network);
  });
});

describe('installFakeCloud', () => {
  it('signs in the user named by ?as= and exposes the port with its marker', async () => {
    const port = installFakeCloud('?as=gm1');
    expect((await port.auth.session())?.userId).toBe('00000000-0000-4000-8000-000000000001');
    expect(window.__dhlootFake?.marker).toBe('dhloot-fake-cloud');
    expect((await window.__dhlootFake?.auth.session())?.email).toBe('gm1@example.test');
  });

  it('is signed out without ?as=', async () => {
    const port = installFakeCloud('');
    expect(await port.auth.session()).toBeNull();
  });

  it('reads the page address when no search is given', async () => {
    const port = installFakeCloud();
    expect(await port.auth.session()).toBeNull();
  });
});

describe('the cloud slot of Env', () => {
  it('starts empty in both environments', () => {
    expect(browserEnv().cloud).toBeNull();
    expect(fakeEnv().cloud).toBeNull();
  });
});

describe("the fake's import", () => {
  const entry = (
    id: string,
    key: string,
    position: number,
    over: Partial<EntryRow> = {}
  ): EntryRow => ({
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
  });
  const row = (id: string, name: string, entries: EntryRow[] = []): ImportRow => ({
    list: { id, name, money_mode: 'bag', player_note: '', gm_note: '' },
    entries
  });
  const TWO: ImportRow[] = [
    {
      list: {
        id: uuid(8000),
        name: 'Импорт',
        money_mode: 'coin',
        player_note: 'p',
        gm_note: 'g'
      },
      entries: [
        entry(uuid(8100), 'ci1', 0, { quantity: 2, price_coins: 150, player_note: 'a' }),
        entry(uuid(8101), 'q1', 1, { gm_note: 'b' })
      ]
    },
    row(uuid(8001), 'Пустой')
  ];
  const namesOf = async (cloud: CloudPort): Promise<string[]> => {
    const read = await cloud.lists.list();
    return read.ok ? read.lists.map((l) => l.name) : [];
  };
  const LIMITED = { ok: false, error: 'limit' };

  it('adds every list with its entries, in the call order, after the lists there', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    expect(await cloud.lists.import(TWO)).toEqual({ ok: true });
    const read = await cloud.lists.list();
    const lists = read.ok ? read.lists : [];
    expect(lists.map((l) => l.name)).toEqual(['Список второго ГМа', 'Импорт', 'Пустой']);
    expect(lists[1]).toMatchObject({
      money_mode: 'coin',
      player_note: 'p',
      gm_note: 'g',
      legacy_fingerprint: null
    });
    expect(lists[1]?.list_entries).toEqual(TWO[0]?.entries);
    expect(lists[2]?.list_entries).toEqual([]);
  });

  it('inserts nothing more for a retry of the same rows', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    await cloud.lists.import(TWO);
    const once = await cloud.lists.list();
    expect(await cloud.lists.import(TWO)).toEqual({ ok: true });
    expect(await cloud.lists.list()).toEqual(once);
  });

  it('refuses past the lists limit, leaving the lists as they were', async () => {
    const cloud = fakeCloud(SEED, 'gm1', { limits: { lists: 4 } });
    const before = await cloud.lists.list();
    expect(await cloud.lists.import(TWO)).toEqual({
      ...LIMITED,
      key: 'lists_per_owner',
      value: 4
    });
    expect(await cloud.lists.list()).toEqual(before);
  });

  it('refuses a list past the entries limit, and the list before it is not there', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const long = Array.from({ length: 101 }, (_, i) =>
      entry(uuid(9000 + i), 'r' + String(i), i)
    );
    expect(
      await cloud.lists.import([row(uuid(8000), 'A'), row(uuid(8001), 'B', long)])
    ).toEqual({
      ...LIMITED,
      key: 'entries_per_list',
      value: 100
    });
    expect(await namesOf(cloud)).toEqual(['Список второго ГМа']);
  });

  it("refuses another user's list id, one record twice in a list, and a call the function refuses", async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const REFUSED = { ok: false, error: 'refused' };
    expect(await cloud.lists.import([row(uuid(8000), 'A'), row(uuid(201), 'B')])).toEqual(
      REFUSED
    );
    expect(
      await cloud.lists.import([
        row(uuid(8000), 'A', [entry(uuid(8100), 'ci1', 0), entry(uuid(8101), 'ci1', 1)])
      ])
    ).toEqual(REFUSED);
    const many = Array.from({ length: 51 }, (_, i) => row(uuid(8000 + i), 'L'));
    expect(await cloud.lists.import(many)).toEqual(REFUSED);
    const huge = Array.from({ length: 5001 }, (_, i) =>
      entry(uuid(20000 + i), 'r' + String(i), i)
    );
    expect(await cloud.lists.import([row(uuid(8000), 'A', huge)])).toEqual(REFUSED);
    expect(await namesOf(cloud)).toEqual(['Лавка кузнеца', 'Пустой список', 'Трофеи']);
  });

  it('answers network offline and signed out', async () => {
    const offline = fakeCloud(SEED, 'gm1', { offline: true });
    expect(await offline.lists.import(TWO)).toEqual({ ok: false, error: 'network' });
    expect(await fakeCloud(SEED).lists.import(TWO)).toEqual({ ok: false, error: 'network' });
  });

  it('sends one owner message per list it inserted, and none when refused', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const seen: unknown[] = [];
    cloud.events.subscribe('owner:' + SEED.users.gm2.id, {
      message: (event, payload) => seen.push([event, payload]),
      status: () => undefined
    });
    await Promise.resolve();
    expect(await cloud.lists.import([...TWO, row(uuid(101), 'чужой')])).toEqual({
      ok: false,
      error: 'refused'
    });
    await cloud.lists.import(TWO);
    for (let i = 0; i < 5; i++) await Promise.resolve();
    expect(seen).toEqual([
      ['list', { list: uuid(8000), revision: 2, by: 'fake-tab', id: '1' }],
      ['list', { list: uuid(8001), revision: 1, by: 'fake-tab', id: '2' }]
    ]);
  });

  /* The fixture is the fake's export of gm1: the store's order (newest edit first), the
     Russian names, a fixed date. Here, not in lib/bundle.test.ts: src/lib imports no port. */
  it("is what docs/fixtures/import/export.json holds for gm1's lists", async () => {
    const read = await fakeCloud(SEED, 'gm1').lists.list();
    const lists = (read.ok ? read.lists : [])
      .map(toCloudList)
      .sort((a, b) => b.updated - a.updated || (a.id < b.id ? -1 : 1));
    const index = buildIndex(
      JSON.parse(
        readFileSync(join(import.meta.dirname, '..', '..', '..', 'data.json'), 'utf8')
      ) as Loot
    );
    const text = bundleText(
      toBundle(
        lists,
        (id) => index.byId.get(id)?.ru,
        'Без названия',
        new Date('2026-09-25T12:00:00.000Z')
      )
    );
    expect(text).toBe(
      readFileSync(
        join(
          import.meta.dirname,
          '..',
          '..',
          '..',
          'docs',
          'fixtures',
          'import',
          'export.json'
        ),
        'utf8'
      )
    );
  });
});

describe('the fake live topics', () => {
  const SHOP = uuid(101);
  const GM1 = SEED.users.gm1.id;
  const tick = async (): Promise<void> => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
  };
  function listen(cloud: ReturnType<typeof fakeCloud>, topic: string) {
    const seen: unknown[] = [];
    const leave = cloud.events.subscribe(topic, {
      message: (event, payload) => seen.push([event, payload]),
      status: (s) => seen.push(s)
    });
    return { seen, leave };
  }
  const revisionOf = async (cloud: ReturnType<typeof fakeCloud>, id: string) => {
    const read = await cloud.lists.list();
    return read.ok ? read.lists.find((l) => l.id === id)?.revision : undefined;
  };

  it('bumps a list revision once per changed list per write', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    expect(await revisionOf(cloud, SHOP)).toBe(1);
    await cloud.lists.apply([
      { op: 'update', id: SHOP, patch: { name: 'a' } },
      { op: 'update_entry', id: uuid(1101), patch: { quantity: 3 } },
      { op: 'reorder', list_id: SHOP, ids: [] }
    ]);
    expect(await revisionOf(cloud, SHOP)).toBe(4);
  });

  it("reads each share's topic key, the seed's and a new one's", async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const player = await cloud.shares.read('player-token-1');
    expect(player.ok && [player.shared?.topic_key, player.shared?.revision]).toEqual([
      uuid(112),
      1
    ]);
    const made = await cloud.shares.create(uuid(103), 'player');
    const fresh = made.ok ? await cloud.shares.read(made.token) : null;
    expect(fresh?.ok && fresh.shared?.topic_key).toBe(uuid(4101));
  });

  it('sends one owner and one share message per changed list of an apply', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const owner = listen(cloud, 'owner:' + GM1);
    const share = listen(cloud, 'share:' + uuid(112));
    await tick();
    await cloud.lists.apply([
      { op: 'update', id: SHOP, patch: { name: 'a' } },
      { op: 'update', id: SHOP, patch: { player_note: 'b' } }
    ]);
    await tick();
    expect(owner.seen).toEqual([
      'live',
      ['list', { list: SHOP, revision: 3, by: 'fake-tab', id: '1' }]
    ]);
    expect(share.seen).toEqual(['live', ['revision', { revision: 3, id: '2' }]]);
  });

  it('sends null for a removed list to its owner and each of its active shares', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const owner = listen(cloud, 'owner:' + GM1);
    const gm = listen(cloud, 'share:' + uuid(114));
    await tick();
    await cloud.lists.apply([{ op: 'remove', id: SHOP }]);
    await tick();
    expect(owner.seen[1]).toEqual([
      'list',
      { list: SHOP, revision: null, by: 'fake-tab', id: '1' }
    ]);
    expect(gm.seen[1]).toEqual(['revision', { revision: null, id: '3' }]);
  });

  it('sends null to the topic of a revoked share, once', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const player = listen(cloud, 'share:' + uuid(112));
    await tick();
    await cloud.shares.revoke(uuid(111));
    await cloud.shares.revoke(uuid(111));
    await tick();
    expect(player.seen).toEqual(['live', ['revision', { revision: null, id: '1' }]]);
  });

  it("refuses another user's owner topic, a malformed topic, and every topic offline", async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const other = listen(cloud, 'owner:' + SEED.users.gm2.id);
    const odd = listen(cloud, 'share:x');
    await tick();
    expect([other.seen, odd.seen]).toEqual([['down'], ['down']]);
    cloud.setOffline(true);
    const off = listen(cloud, 'owner:' + GM1);
    await tick();
    expect(off.seen).toEqual(['down']);
  });

  it('reports down to every joined topic when Realtime is switched off, and joins nothing then', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const owner = listen(cloud, 'owner:' + GM1);
    await tick();
    cloud.setLive(false);
    const late = listen(cloud, 'share:' + uuid(112));
    await tick();
    await cloud.lists.apply([{ op: 'update', id: SHOP, patch: { name: 'a' } }]);
    await tick();
    expect(owner.seen).toEqual(['live', 'down']);
    expect(late.seen).toEqual(['down']);
    cloud.setLive(true);
    const again = listen(cloud, 'owner:' + GM1);
    await tick();
    expect(again.seen).toEqual(['live']);
    expect(fakeCloud(SEED, 'gm1', { live: false }).events.tab).toBe('fake-tab');
  });

  it("edits any user's list as another device, and says false for an unknown one", async () => {
    const cloud = fakeCloud(SEED);
    const share = listen(cloud, 'share:' + uuid(112));
    await tick();
    expect(cloud.play(SHOP, { name: 'Лавка у моста' })).toBe(true);
    expect(cloud.play(uuid(999), { name: 'x' })).toBe(false);
    await tick();
    expect(share.seen).toEqual(['live', ['revision', { revision: 2, id: '2' }]]);
    const read = await cloud.shares.read('player-token-1');
    expect(read.ok && read.shared?.list.name).toBe('Лавка у моста');
  });

  it('delivers nothing after the leave', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const owner = listen(cloud, 'owner:' + GM1);
    await tick();
    owner.leave();
    await cloud.lists.apply([{ op: 'update', id: SHOP, patch: { name: 'a' } }]);
    await tick();
    expect(owner.seen).toEqual(['live']);
  });
});

describe("the fake's purchase requests", () => {
  const SHOP = uuid(101);
  const GM1 = SEED.users.gm1.id;
  const ONE = [{ item: 'ci1', qty: 1 }];
  const tick = async (): Promise<void> => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
  };
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-09-25T12:00:00Z'), toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  const pending = async (cloud: ReturnType<typeof fakeCloud>) => {
    const read = await cloud.requests.list();
    return read.ok ? read.requests.map((r) => r.id) : null;
  };

  it('counts five sends a minute per link, and one more once the minute has passed', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    for (let i = 0; i < 5; i++) {
      expect(await cloud.requests.send(uuid(6100 + i), 'player-token-1', ONE)).toEqual({
        ok: true
      });
    }
    expect(await cloud.requests.send(uuid(6105), 'player-token-1', ONE)).toEqual({
      ok: false,
      error: 'limit',
      key: 'request_rate',
      value: 5
    });
    expect(await cloud.requests.send(uuid(6106), 'gm-token-1', ONE)).toEqual({ ok: true });
    vi.setSystemTime(Date.now() + 61_000);
    expect(await cloud.requests.send(uuid(6107), 'player-token-1', ONE)).toEqual({ ok: true });
  });

  it('holds ten pending requests a list; an expired one counts for nothing and answers expired', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    for (let i = 0; i < 10; i++) {
      vi.setSystemTime(Date.now() + 13_000);
      expect((await cloud.requests.send(uuid(6100 + i), 'player-token-1', ONE)).ok).toBe(true);
    }
    vi.setSystemTime(Date.now() + 61_000);
    expect(await cloud.requests.send(uuid(6110), 'player-token-1', ONE)).toEqual({
      ok: false,
      error: 'limit',
      key: 'pending_requests_per_list',
      value: 10
    });
    vi.setSystemTime(Date.parse('2026-09-25T13:00:14Z'));
    expect(await cloud.requests.apply(uuid(6100), false)).toEqual({
      ok: false,
      error: 'expired'
    });
    expect(await cloud.requests.decline(uuid(6100))).toEqual({ ok: false, error: 'expired' });
    expect(await cloud.requests.send(uuid(6110), 'player-token-1', ONE)).toEqual({ ok: true });
    expect(await pending(cloud)).toHaveLength(11);
  });

  it('answers a replay on its own link ok and adds nothing; the id on another link is gone', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const id = uuid(6100);
    expect(await cloud.requests.send(id, 'player-token-1', ONE)).toEqual({ ok: true });
    expect(await cloud.requests.send(id, 'player-token-1', [{ item: 'zz1', qty: 1 }])).toEqual({
      ok: true
    });
    expect(await cloud.requests.send(id, 'gm-token-1', ONE)).toEqual({
      ok: false,
      error: 'gone'
    });
    expect(await pending(cloud)).toEqual([id]);
  });

  it('refuses bad lines, too many lines, a stale item and an unknown or stopped link', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const refused = { ok: false, error: 'refused' };
    for (const lines of [
      [],
      'x',
      [null],
      [{ item: 'ci1', qty: 0 }],
      [{ item: 'ci1', qty: 1.5 }],
      [{ item: 'a b', qty: 1 }],
      [
        { item: 'ci1', qty: 1 },
        { item: 'ci1', qty: 2 }
      ]
    ]) {
      expect(
        await cloud.requests.send(uuid(6100), 'player-token-1', lines as typeof ONE)
      ).toEqual(refused);
    }
    const many = Array.from({ length: 101 }, (_, i) => ({ item: 'x' + String(i), qty: 1 }));
    expect(await cloud.requests.send(uuid(6100), 'player-token-1', many)).toEqual({
      ok: false,
      error: 'limit',
      key: 'request_lines',
      value: 100
    });
    expect(
      await cloud.requests.send(uuid(6100), 'player-token-1', [{ item: 'zz1', qty: 1 }])
    ).toEqual({ ok: false, error: 'stale' });
    expect(await cloud.requests.send(uuid(6100), 'nonsense', ONE)).toEqual({
      ok: false,
      error: 'gone'
    });
    await cloud.shares.revoke(uuid(111));
    expect(await cloud.requests.send(uuid(6100), 'player-token-1', ONE)).toEqual({
      ok: false,
      error: 'gone'
    });
    cloud.setOffline(true);
    expect(await cloud.requests.send(uuid(6100), 'gm-token-1', ONE)).toEqual({
      ok: false,
      error: 'network'
    });
    expect(await cloud.requests.list()).toEqual({ ok: false });
    expect(await cloud.requests.apply(uuid(6100), false)).toEqual({
      ok: false,
      error: 'network'
    });
  });

  it("reads the owner's pending requests with the prices at the send, for no one else", async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    await cloud.requests.send(uuid(6100), 'gm-token-1', [
      { item: 'q1', qty: 1 },
      { item: 'cc1', qty: 3 }
    ]);
    expect(await cloud.requests.list()).toEqual({
      ok: true,
      requests: [
        {
          id: uuid(6100),
          listId: SHOP,
          audience: 'gm',
          createdAt: '2026-09-25T12:00:00.000Z',
          expiresAt: '2026-09-25T13:00:00.000Z',
          lines: [
            { item: 'q1', qty: 1, price: null, applied: null },
            { item: 'cc1', qty: 3, price: 20, applied: null }
          ]
        }
      ]
    });
    expect(await pending(fakeCloud(SEED, 'gm2'))).toEqual([]);
    const out = fakeCloud(SEED);
    await out.requests.send(uuid(6100), 'gm-token-1', ONE);
    expect(await out.requests.list()).toEqual({ ok: false });
    expect(await out.requests.decline(uuid(6100))).toEqual({ ok: false, error: 'network' });
  });

  it('applies by item, answers short or clamps, deletes an entry taken whole and renumbers', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    await cloud.requests.send(uuid(6100), 'player-token-1', [
      { item: 'ci1', qty: 2 },
      { item: 'cc1', qty: 9 }
    ]);
    expect(await cloud.requests.apply(uuid(6100), false)).toEqual({
      ok: false,
      error: 'short',
      short: [{ item: 'cc1', want: 9, have: 5 }]
    });
    expect(await cloud.requests.apply(uuid(6100), true)).toEqual({ ok: true, taken: 7 });
    const read = await cloud.lists.list();
    const shop = read.ok ? read.lists.find((l) => l.id === SHOP) : undefined;
    expect(shop?.list_entries.map((e) => `${e.item_key}@${String(e.position)}`)).toEqual([
      'q1@0',
      'q313@1',
      'voa2_a3@2',
      'q23@3',
      'w51@4',
      'q35@5',
      'di11@6'
    ]);
    expect(await pending(cloud)).toEqual([]);
    expect(await cloud.requests.apply(uuid(6100), false)).toEqual({
      ok: false,
      error: 'decided'
    });
    expect(await cloud.requests.apply(uuid(6999), false)).toEqual({ ok: false, error: 'gone' });
    expect(await cloud.requests.decline(uuid(6999))).toEqual({ ok: false, error: 'gone' });
  });

  it('answers short to a clamp with nothing left, and lowers a stock without a renumber', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    await cloud.requests.send(uuid(6100), 'player-token-1', [{ item: 'q1', qty: 2 }]);
    await cloud.requests.send(uuid(6101), 'player-token-1', [{ item: 'cc1', qty: 2 }]);
    await cloud.lists.apply([{ op: 'remove_entries', ids: [uuid(1102)] }]);
    expect(await cloud.requests.apply(uuid(6100), true)).toEqual({
      ok: false,
      error: 'short',
      short: [{ item: 'q1', want: 2, have: 0 }]
    });
    expect(await cloud.requests.apply(uuid(6101), false)).toEqual({ ok: true, taken: 2 });
    const read = await cloud.lists.list();
    const shop = read.ok ? read.lists.find((l) => l.id === SHOP) : undefined;
    expect(shop?.list_entries.find((e) => e.item_key === 'cc1')?.quantity).toBe(3);
  });

  it('sends a request message on a send with by null, and on a decision with the tab', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const seen: unknown[] = [];
    cloud.events.subscribe('owner:' + GM1, {
      message: (event, payload) => seen.push([event, payload]),
      status: () => undefined
    });
    await tick();
    await cloud.requests.send(uuid(6100), 'player-token-1', ONE);
    await cloud.requests.decline(uuid(6100));
    await tick();
    expect(seen).toEqual([
      ['request', { list: SHOP, by: null, id: '1' }],
      ['request', { list: SHOP, by: 'fake-tab', id: '2' }]
    ]);
  });

  it('makes a request as another reader and decides it as another device', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const owner: unknown[] = [];
    cloud.events.subscribe('owner:' + GM1, {
      message: (event, payload) => owner.push([event, payload]),
      status: () => undefined
    });
    await tick();
    expect(cloud.request('player-token-1', ONE)).toBe(uuid(6000));
    expect(cloud.request('player-token-1', [{ item: 'zz1', qty: 1 }])).toBeNull();
    expect(cloud.request('player-token-1', ONE)).toBe(uuid(6001));
    expect(cloud.decide(uuid(6000), 'applied')).toBe(true);
    expect(cloud.decide(uuid(6000), 'declined')).toBe(false);
    expect(cloud.decide(uuid(6001), 'declined')).toBe(true);
    expect(cloud.decide(uuid(6999), 'applied')).toBe(false);
    await tick();
    expect(owner).toEqual([
      ['request', { list: SHOP, by: null, id: '1' }],
      ['request', { list: SHOP, by: null, id: '2' }],
      ['list', { list: SHOP, revision: 2, by: 'other-device', id: '3' }],
      ['request', { list: SHOP, by: 'other-device', id: '6' }],
      ['request', { list: SHOP, by: 'other-device', id: '7' }]
    ]);
    const read = await cloud.shares.read('player-token-1');
    expect(read.ok && read.shared?.entries.find((e) => e.item_key === 'ci1')?.quantity).toBe(1);
    const q = cloud.request('player-token-1', [{ item: 'q1', qty: 1 }]);
    await cloud.lists.apply([{ op: 'remove_entries', ids: [uuid(1102)] }]);
    expect(q && cloud.decide(q, 'applied')).toBe(false);
  });

  it("drops a list's requests with the list and with the account", async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    await cloud.requests.send(uuid(6100), 'player-token-1', ONE);
    await cloud.lists.apply([{ op: 'remove', id: SHOP }]);
    expect(await pending(cloud)).toEqual([]);
    const other = fakeCloud(SEED, 'gm1');
    const id = other.request('gm-token-1', ONE);
    await other.auth.deleteAccount();
    expect(id && other.decide(id, 'declined')).toBe(false);
  });
});
