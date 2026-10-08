/* The fake cloud against the contract every `CloudPort` must meet, and the
   test build's `?as=` switch. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bundleText, toBundle } from '../lib/bundle.js';
import {
  linkedOf,
  toCloudList,
  type EntryRow,
  type ImportRow,
  type ListOp
} from '../lib/cloudLists.js';
import { buildIndex, type Loot } from '../lib/data.js';
import {
  bookProblems,
  cardProblems,
  contentProblems,
  HOMEBREW_KEY,
  recordOf,
  snapshotValid
} from '../lib/homebrew.js';
import { homebrewText, toHomebrewFile } from '../lib/homebrewFile.js';
import { runCloudContract } from './cloud.contract.js';
import { fakeCloud, installFakeCloud } from './fake-cloud.js';
import { SEED, uuid } from './fake-cloud-seed.js';
import { browserEnv, fakeEnv } from './index.js';
import type { CloudPort, ListWrite, Session } from './types.js';

afterEach(() => {
  delete window.__dhlootFake;
});

describe('the fake cloud', () => {
  it('meets the cloud contract', async () => {
    const gm1 = SEED.users.gm1;
    /* Case R reads one account's writes from another: its ports share one world. */
    const world = fakeCloud(SEED);
    await runCloudContract(
      (as) => Promise.resolve(fakeCloud(SEED, as)),
      { member: { as: 'gm1', userId: gm1.id, email: gm1.email }, doomed: 'gm2' },
      (c, m) => {
        expect(c, m).toBe(true);
      },
      undefined,
      (as) => Promise.resolve(world.as(as))
    );
  });

  it('runs a port of the same world as another user, signed out too', async () => {
    const world = fakeCloud(SEED, 'gm1');
    const gm2 = world.as('gm2');
    expect((await gm2.auth.session())?.userId).toBe(SEED.users.gm2.id);
    expect((await world.auth.session())?.userId).toBe(SEED.users.gm1.id);
    expect(await world.as().auth.session()).toBeNull();
    expect(() => world.as('nobody')).toThrow(/unknown user/);
    await gm2.auth.signOut();
    expect(await gm2.auth.session()).toBeNull();
    expect((await world.auth.session())?.userId).toBe(SEED.users.gm1.id);
  });

  describe("the contract's notes-heavy import", () => {
    const gm1 = SEED.users.gm1;
    const users = { member: { as: 'gm1', userId: gm1.id, email: gm1.email }, doomed: 'gm2' };
    /* A port whose import past 5 MB answers `answer`, after writing the rows when `write`. */
    const heavyAnswers =
      (answer: ListWrite, write: boolean) =>
      (as?: string): Promise<CloudPort> => {
        const port = fakeCloud(SEED, as);
        const inner = port.lists.import.bind(port.lists);
        port.lists.import = async (rows) => {
          if (new TextEncoder().encode(JSON.stringify(rows)).length <= 5_000_000) {
            return inner(rows);
          }
          if (write) await inner(rows);
          return answer;
        };
        return Promise.resolve(port);
      };
    const TOO_SLOW: ListWrite = { ok: false, error: 'refused', reason: 'tooSlow' };
    const throwing = (c: boolean, m: string): void => {
      if (!c) throw new Error(m);
    };

    it('passesWhenTheHeavyImportIsRefusedTooSlowAndWritesNothing', async () => {
      const logs: string[] = [];
      const world = fakeCloud(SEED);
      await runCloudContract(
        heavyAnswers(TOO_SLOW, false),
        users,
        (c, m) => {
          expect(c, m).toBe(true);
        },
        (m) => logs.push(m),
        (as) => Promise.resolve(world.as(as))
      );
      expect(logs).toContainEqual(
        expect.stringMatching(
          /import of a 5 MB file \(\d+ bytes of rows\): refused tooSlow after \d+ ms/
        )
      );
    });

    it('failsWhenTheHeavyImportAnswersNetwork', async () => {
      await expect(
        runCloudContract(heavyAnswers({ ok: false, error: 'network' }, false), users, throwing)
      ).rejects.toThrow(/the notes-heavy import answered/);
    });

    it('failsWhenATooSlowHeavyImportLeftLists', async () => {
      await expect(
        runCloudContract(heavyAnswers(TOO_SLOW, true), users, throwing)
      ).rejects.toThrow(/a refused notes-heavy import left 50 lists/);
    });
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

  it("names only records of the dataset, and gm1's axe in its homebrew entries", () => {
    const official = entries.filter((e) => e.source !== 'homebrew');
    expect(official.map((e) => e.itemKey).filter((k) => !index.byId.has(k))).toEqual([]);
    const axe = SEED.homebrew.gm1.items.find((i) => i.key === 'hb_emberaxeaaaaaaaa');
    const own = SEED.lists.gm1.flatMap((l) => l.entries).filter((e) => e.source === 'homebrew');
    expect(own.map((e) => [e.itemKey, e.hbItem])).toEqual([[axe?.key, undefined]]);
    const linked = SEED.lists.gm2
      .flatMap((l) => l.entries)
      .filter((e) => e.source === 'homebrew');
    expect(linked.map((e) => [e.itemKey, e.hbItem])).toEqual([[axe?.key, axe?.id]]);
  });

  it("links gm1's entry by its key, and reads the axe for gm2 through items()", async () => {
    const gm1 = fakeCloud(SEED, 'gm1');
    const read = await gm1.lists.list();
    const axe = SEED.homebrew.gm1.items.find((i) => i.key === 'hb_emberaxeaaaaaaaa');
    const entry = read.ok
      ? read.lists.flatMap((l) => l.list_entries).find((e) => e.source === 'homebrew')
      : undefined;
    expect(entry?.hb_item).toBe(axe?.id);
    const gm2 = fakeCloud(SEED, 'gm2');
    const items = await gm2.lists.items([axe?.id ?? '', uuid(9999)]);
    expect(items.ok && items.items.map((i) => i.hid)).toEqual([axe?.id]);
    expect(items.ok && snapshotValid(items.items[0]?.item)).toBe(true);
    expect(items.ok && items.items[0]?.item).toMatchObject({
      id: axe?.key,
      ru: 'Топор Тлеющих Углей',
      book: { key: 'hb_alderworkshopaaa', section: { key: 'hb_sectbladesaaaaaa' } }
    });
    expect((await fakeCloud(SEED).lists.items([axe?.id ?? ''])).ok).toBe(false);
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
    hb_item: null,
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
      'di11',
      'hb_emberaxeaaaaaaaa'
    ]);
    expect(shop?.list_entries[9]).toMatchObject({
      source: 'homebrew',
      hb_item: uuid(511),
      price_coins: 800
    });
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
    /* List 201 holds two seeded entries. */
    const hundred = Array.from({ length: 98 }, (_, i) =>
      entry(lists.newId(), 'k' + String(i), i + 2)
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
    expect(await lists.list()).toMatchObject({ ok: true, listLimit: 1, entryLimit: 1 });
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
      'di11',
      'hb_emberaxeaaaaaaaa'
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

  it("counts a copy's entries against the entry limit", async () => {
    const port = fakeCloud(SEED, 'gm2', { limits: { entries: 1 } });
    const count = async () => {
      const read = await port.lists.list();
      return read.ok ? read.lists.length : -1;
    };
    const was = await count();
    expect(await port.shares.clone('gm-token-1', port.lists.newId())).toEqual({
      ok: false,
      error: 'limit',
      key: 'entries_per_list',
      value: 1
    });
    expect(await count()).toBe(was);
  });

  describe('GM-only entries', () => {
    /* The seed with q313 (position 2) and the axe (position 9) of gm1's shop GM-only. */
    const MARKED = {
      ...SEED,
      lists: {
        ...SEED.lists,
        gm1: SEED.lists.gm1.map((l) =>
          l.id === uuid(101)
            ? {
                ...l,
                entries: l.entries.map((e) =>
                  e.itemKey === 'q313' || e.source === 'homebrew'
                    ? { ...e, gmOnly: true as const }
                    : e
                )
              }
            : l
        )
      }
    };
    const readOf = async (port: CloudPort, token: string) => {
      const r = await port.shares.read(token);
      return r.ok ? r.shared : null;
    };

    it("leaves them out of a players' read before their items and renumbers the rest; a GM's read marks each", async () => {
      const port = fakeCloud(MARKED);
      const g = await readOf(port, 'gm-token-1');
      expect(g?.entries.map((e) => [e.item_key, e.position, e.gm_only])).toEqual([
        ['ci1', 0, false],
        ['q1', 1, false],
        ['q313', 2, true],
        ['cc1', 3, false],
        ['voa2_a3', 4, false],
        ['q23', 5, false],
        ['w51', 6, false],
        ['q35', 7, false],
        ['di11', 8, false],
        ['hb_emberaxeaaaaaaaa', 9, true]
      ]);
      const axe = g?.entries[9]?.hid ?? '';
      expect(axe).not.toBe('');
      const p = await readOf(port, 'player-token-1');
      expect(p?.entries.map((e) => [e.item_key, e.position])).toEqual([
        ['ci1', 0],
        ['q1', 1],
        ['cc1', 2],
        ['voa2_a3', 3],
        ['q23', 4],
        ['w51', 5],
        ['q35', 6],
        ['di11', 7]
      ]);
      expect(keysOf(p)).not.toContain('gm_only');
      expect(JSON.stringify(p)).not.toContain(axe);
    });

    it("answers a players' request for one stale, and takes it through the GM's link", async () => {
      const { requests } = fakeCloud(MARKED);
      const line = [{ item: 'q313', qty: 1 }];
      expect(await requests.send(uuid(9001), 'player-token-1', line)).toEqual({
        ok: false,
        error: 'stale'
      });
      expect(await requests.send(uuid(9002), 'gm-token-1', line)).toEqual({ ok: true });
    });

    it("copies none from a players' link, and keeps the mark from a GM's link", async () => {
      const port = fakeCloud(MARKED, 'gm2');
      const [fromPlayers, fromGm] = [port.lists.newId(), port.lists.newId()];
      expect(await port.shares.clone('player-token-1', fromPlayers)).toEqual({ ok: true });
      expect(await port.shares.clone('gm-token-1', fromGm)).toEqual({ ok: true });
      const read = await port.lists.list();
      const marks = (id: string) =>
        read.ok
          ? read.lists
              .find((l) => l.id === id)
              ?.list_entries.filter((e) => e.gm_only)
              .map((e) => e.item_key)
          : undefined;
      expect(marks(fromPlayers)).toEqual([]);
      expect(marks(fromGm)).toEqual(['q313', 'hb_emberaxeaaaaaaaa']);
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

  it('fills the signed-in user to ?items= items, and ignores a value out of range', async () => {
    const filled = await installFakeCloud('?as=gm1&items=300').homebrew.load();
    expect(filled.ok && filled.items).toHaveLength(300);
    expect(filled.ok && filled.itemLimit).toBe(300);
    for (const bad of ['0', '1001', '2.5', 'x']) {
      const read = await installFakeCloud('?as=gm1&items=' + bad).homebrew.load();
      expect(read.ok && read.items).toHaveLength(4);
      expect(read.ok && read.itemLimit).toBe(100);
    }
  });
});

describe('fillItems', () => {
  it('gives gm1 300 items with valid keys after the seeded four, and an item limit of 300', async () => {
    const read = await fakeCloud(SEED, 'gm1', { fillItems: 300 }).homebrew.load();
    if (!read.ok) throw new Error('The fake refused the read.');
    expect(read.itemLimit).toBe(300);
    expect(read.items).toHaveLength(300);
    expect(read.items.slice(0, 4).map((i) => i.id)).toEqual(
      SEED.homebrew.gm1.items.map((i) => i.id)
    );
    const made = read.items.slice(4);
    expect(made[0]?.content).toMatchObject({ ru: 'Предмет 001', en: 'Item 001' });
    expect(made.at(-1)?.content).toMatchObject({ ru: 'Предмет 296', en: 'Item 296' });
    expect(made.every((i) => HOMEBREW_KEY.test(i.key))).toBe(true);
    expect(new Set(read.items.map((i) => i.key)).size).toBe(300);
    expect(made.every((i) => contentProblems(i.content).length === 0)).toBe(true);
    /* Every third in the first source, every third in its first section, the rest home. */
    expect(made.slice(0, 3).map((i) => [i.book_id, i.content.section ?? null])).toEqual([
      [uuid(501), null],
      [uuid(501), 'hb_sectpistolsaaaaa'],
      [null, null]
    ]);
    expect(
      made.filter((i) => /[0-9]/.test(i.content.ru ?? '') && /9/.test(i.content.ru ?? ''))
    ).toHaveLength(54);
  });

  it('puts every generated item in the default source for a user with no source', async () => {
    const read = await fakeCloud(SEED, 'gm2', { fillItems: 5 }).homebrew.load();
    expect(read.ok && read.items.map((i) => i.book_id)).toEqual([null, null, null, null, null]);
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
    hb_item: null,
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
    const many = Array.from({ length: 1001 }, (_, i) => row(uuid(8000 + i), 'L'));
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
        new Date('2026-09-25T12:00:00.000Z'),
        () => null
      ).bundle
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

  it("edits one entry of any user's list as another device, and says false for an unknown list or key", async () => {
    const cloud = fakeCloud(SEED);
    const share = listen(cloud, 'share:' + uuid(112));
    await tick();
    expect(cloud.playEntry(SHOP, 'di11', { gm_only: true })).toBe(true);
    expect(cloud.playEntry(uuid(999), 'di11', { gm_only: true })).toBe(false);
    expect(cloud.playEntry(SHOP, 'nope', { gm_only: true })).toBe(false);
    await tick();
    expect(share.seen).toEqual(['live', ['revision', { revision: 2, id: '2' }]]);
    const players = await cloud.shares.read('player-token-1');
    expect(players.ok && players.shared?.entries.some((e) => e.item_key === 'di11')).toBe(
      false
    );
    const gm = await cloud.shares.read('gm-token-1');
    const row = gm.ok ? gm.shared?.entries.find((e) => e.item_key === 'di11') : undefined;
    expect(row?.gm_only).toBe(true);
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

  it('holds ten pending requests a list, unread for up to 30 days; once read each expires an hour later', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    for (let i = 0; i < 10; i++) {
      vi.setSystemTime(Date.now() + 13_000);
      expect((await cloud.requests.send(uuid(6100 + i), 'player-token-1', ONE)).ok).toBe(true);
    }
    const full = {
      ok: false,
      error: 'limit',
      key: 'pending_requests_per_list',
      value: 10
    };
    vi.setSystemTime(Date.now() + 61_000);
    expect(await cloud.requests.send(uuid(6110), 'player-token-1', ONE)).toEqual(full);
    vi.setSystemTime(Date.parse('2026-10-20T12:00:00Z'));
    expect(await cloud.requests.send(uuid(6110), 'player-token-1', ONE)).toEqual(full);
    expect(await cloud.requests.markRead(uuid(9))).toEqual({ ok: false, error: 'refused' });
    expect(await cloud.requests.markRead(SHOP)).toEqual({ ok: true });
    const read = await cloud.requests.list();
    const first = read.ok ? read.requests.find((r) => r.id === uuid(6100)) : undefined;
    expect([first?.readAt, first?.expiresAt]).toEqual([
      '2026-10-20T12:00:00.000Z',
      '2026-10-20T13:00:00.000Z'
    ]);
    vi.setSystemTime(Date.parse('2026-10-20T12:59:00Z'));
    expect(await cloud.requests.markRead(SHOP)).toEqual({ ok: true });
    const again = await cloud.requests.list();
    expect(again.ok && again.requests.find((r) => r.id === uuid(6100))?.readAt).toBe(
      '2026-10-20T12:00:00.000Z'
    );
    vi.setSystemTime(Date.parse('2026-10-20T13:00:01Z'));
    expect(await cloud.requests.apply(uuid(6100), false)).toEqual({
      ok: false,
      error: 'expired'
    });
    expect(await cloud.requests.decline(uuid(6100))).toEqual({ ok: false, error: 'expired' });
    expect(await cloud.requests.send(uuid(6110), 'player-token-1', ONE)).toEqual({ ok: true });
    expect(await pending(cloud)).toHaveLength(11);
  });

  it('makes a decision the first read of an unread request: an hour left from then', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    await cloud.requests.send(uuid(6100), 'player-token-1', [{ item: 'cc1', qty: 9 }]);
    vi.setSystemTime(Date.parse('2026-10-01T12:00:00Z'));
    expect(await cloud.requests.apply(uuid(6100), false)).toMatchObject({ error: 'short' });
    const read = await cloud.requests.list();
    const r = read.ok ? read.requests[0] : undefined;
    expect([r?.readAt, r?.expiresAt]).toEqual([
      '2026-10-01T12:00:00.000Z',
      '2026-10-01T13:00:00.000Z'
    ]);
    cloud.setOffline(true);
    expect(await cloud.requests.markRead(SHOP)).toEqual({ ok: false, error: 'network' });
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
          expiresAt: '2026-10-25T12:00:00.000Z',
          readAt: null,
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
      'di11@6',
      'hb_emberaxeaaaaaaaa@7'
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

/* The seed's homebrew, pinned to the database's rules. */
describe('the seeded homebrew', () => {
  const all = Object.values(SEED.homebrew);

  it('keys every source, section and item in the key shape, each key once per account', () => {
    for (const h of all) {
      const keys = [
        ...h.books.map((b) => b.key),
        ...h.books.flatMap((b) => b.content.sections ?? []).map((s) => s.key),
        ...h.items.map((i) => i.key),
        ...h.cards.map((c) => c.key)
      ];
      expect(keys.filter((k) => !HOMEBREW_KEY.test(k))).toEqual([]);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it('holds only content the validators take, and the axe in a section of its source', () => {
    for (const h of all) {
      for (const b of h.books) expect(bookProblems(b.content)).toEqual([]);
      for (const i of h.items) expect(contentProblems(i.content, i.key)).toEqual([]);
      for (const c of h.cards) expect(cardProblems(c.kind, c.content)).toEqual([]);
    }
    const axe = SEED.homebrew.gm1.items.find((i) => i.key === 'hb_emberaxeaaaaaaaa');
    const book = SEED.homebrew.gm1.books.find((b) => b.id === axe?.bookId);
    expect(book?.content.sections?.map((s) => s.key)).toContain(axe?.content.section);
  });

  it('puts the set card in its source and the rule card in none, and names neither from an item', () => {
    const { books, items, cards } = SEED.homebrew.gm1;
    expect(cards.map((c) => [c.key, c.kind, c.bookId])).toEqual([
      ['hb_aldersetaaaaaaaa', 'set', books[0]?.id],
      ['hb_alderrulecardaaa', 'ref', undefined]
    ]);
    const named = items.flatMap((i) => [i.content.set, ...(i.content.refs ?? [])]);
    for (const c of cards) expect(named).not.toContain(c.key);
  });

  it('gives gm2 no homebrew, and every row an id of its own', () => {
    expect(SEED.homebrew.gm2).toEqual({ books: [], items: [], cards: [] });
    const ids = [
      ...all.flatMap((h) => [...h.books, ...h.items, ...h.cards]).map((x) => x.id),
      ...Object.values(SEED.lists)
        .flat()
        .map((l) => l.id)
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives gm3 thirty-four items with no source that relate to ci1, q1's line and saints-ensemble, and a chain of five", () => {
    const loot = JSON.parse(
      readFileSync(join(import.meta.dirname, '..', '..', '..', 'data.json'), 'utf8')
    ) as Loot;
    const index = buildIndex(loot);
    const { books, cards } = SEED.homebrew.gm3;
    const all = SEED.homebrew.gm3.items;
    expect([books, SEED.lists.gm3]).toEqual([[], []]);
    expect(all).toHaveLength(39);
    expect(all.every((i) => i.bookId === undefined)).toBe(true);
    const items = all.slice(0, 34);
    /* The chain: A into B into C, and B, D, E in the own set; none says «спальный мешок». */
    const chain = all.slice(34);
    expect(chain.map((i) => i.id)).toEqual([661, 662, 663, 664, 665].map(uuid));
    expect(chain[1]?.content).toMatchObject({
      craft_from: ['hb_travelrollaaaaaa'],
      craft: ['hb_sentryrollaaaaaa'],
      set: 'hb_starsleepsetaaaa'
    });
    expect(chain.filter((i) => i.content.set === 'hb_starsleepsetaaaa')).toHaveLength(3);
    expect(cards.map((c) => [c.key, c.kind])).toEqual([['hb_starsleepsetaaaa', 'set']]);
    for (const i of chain) {
      expect(JSON.stringify(i.content).toLowerCase()).not.toMatch(/спальный мешок|bedroll/);
    }
    const made = items.filter((i) => i.content.craft_from?.includes('ci1'));
    const rungs = items.filter((i) => i.content.eq?.line === 'q1');
    const pieces = items.filter((i) => i.content.set === 'saints-ensemble');
    expect([made.length, rungs.length, pieces.length]).toEqual([15, 15, 4]);
    expect(rungs.map((i) => i.content.eq?.tier).join('')).toBe('111222223333444');
    expect(index.byId.get('ci1')?.en).toBe('Premium Bedroll');
    expect(index.byId.get('q1')?.eq?.line).toBe('q1');
    expect(index.setMembers.get('saints-ensemble')?.map((r) => r.id)).toEqual([
      'voa4_t3d',
      'voa4_t3e',
      'voa4_t3f'
    ]);
    const longest = Math.max(
      ...made.flatMap((i) => [
        Array.from(i.content.ru ?? '').length,
        Array.from(i.content.en ?? '').length
      ])
    );
    expect(longest).toBe(120);
  });
});

describe("the fake's homebrew", () => {
  const AXE = 'hb_emberaxeaaaaaaaa';
  const POTION = 'hb_smithpotionaaaaa';
  const ALDER = uuid(501);
  const EMPTY = uuid(102);
  const OK = { ok: true };
  const REFUSED = { ok: false, error: 'refused' };
  const NETWORK = { ok: false, error: 'network' };
  const POTION_ID = uuid(512);
  const hbEntry = (
    id: string,
    key: string,
    position: number,
    hbItem: string | null = null
  ) => ({
    id,
    item_key: key,
    source: 'homebrew' as const,
    hb_item: hbItem,
    position,
    quantity: 1,
    price_coins: null,
    player_note: '',
    gm_note: ''
  });
  const read = async (cloud: CloudPort) => {
    const r = await cloud.homebrew.load();
    if (!r.ok) throw new Error('the read failed');
    return r;
  };
  const revisions = async (cloud: CloudPort) => {
    const r = await cloud.lists.list();
    return r.ok ? Object.fromEntries(r.lists.map((l) => [l.id, l.revision])) : {};
  };
  const potionRecord = () => {
    const p = SEED.homebrew.gm1.items.find((i) => i.key === POTION);
    if (!p) throw new Error('no potion in the seed');
    return recordOf(POTION, p.content, null);
  };
  /* gm1's empty list links the axe, sent by its key, and the potion, by its id. */
  const withEntries = async (cloud: CloudPort) => {
    const r = await cloud.lists.apply([
      {
        op: 'add',
        list_id: EMPTY,
        entries: [hbEntry(uuid(7101), AXE, 0), hbEntry(uuid(7102), POTION, 1, POTION_ID)]
      }
    ]);
    expect(r).toEqual({ ok: true, results: [OK] });
  };
  const newBook = (id: string, key: string) => ({ id, key, content: { ru: 'Новый источник' } });
  const newItem = (id: string, key: string, bookId: string | null = null) => ({
    id,
    key,
    book_id: bookId,
    content: { kind: 'item' as const, ru: 'Новый предмет' }
  });

  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-09-25T12:00:00Z') });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("reads gm1's source and four items at revision 1, times back from boot, and the limit", async () => {
    const r = await read(fakeCloud(SEED, 'gm1'));
    expect(r.books.map((b) => [b.id, b.key, b.revision])).toEqual([
      [ALDER, 'hb_alderworkshopaaa', 1]
    ]);
    expect(r.items.map((i) => [i.key, i.book_id, i.revision])).toEqual([
      [AXE, ALDER, 1],
      [POTION, null, 1],
      ['hb_whispercapaaaaaa', null, 1],
      ['hb_engravedringaaaa', null, 1]
    ]);
    expect(r.books[0]?.updated_at).toBe('2026-09-21T12:00:00.000Z');
    expect(r.itemLimit).toBe(100);
    expect(r.cards.map((c) => [c.key, c.kind, c.book_id, c.revision])).toEqual([
      ['hb_aldersetaaaaaaaa', 'set', ALDER, 1],
      ['hb_alderrulecardaaa', 'ref', null, 1]
    ]);
    expect(await read(fakeCloud(SEED, 'gm2'))).toEqual({
      ok: true,
      books: [],
      items: [],
      cards: [],
      itemLimit: 100,
      bookLimit: 20,
      cardLimit: 100
    });
  });

  it('makes fixed keys in the key shape, and ids from the list counter', () => {
    const { homebrew } = fakeCloud(SEED, 'gm2');
    expect([homebrew.newKey(), homebrew.newKey()]).toEqual([
      'hb_newaaaaaaaaaaaaa',
      'hb_newaaaaaaaaaaaab'
    ]);
    for (let i = 0; i < 40; i++) expect(homebrew.newKey()).toMatch(HOMEBREW_KEY);
    expect(homebrew.newKey()).toBe('hb_newaaaaaaaaaaabk');
    expect(homebrew.newId()).toBe(uuid(5000));
  });

  it('keeps the rows it answers apart from the rows it holds', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const first = await read(cloud);
    const book = first.books[0];
    if (book) book.content.ru = 'Изменено';
    expect((await read(cloud)).books[0]?.content.ru).toBe('Мастерская Ольхи');
  });

  it('creates a source and an item, and answers ok to an id any account holds, changing nothing', async () => {
    const gm2 = fakeCloud(SEED, 'gm2');
    const { homebrew } = gm2;
    expect(await homebrew.createBook(newBook(uuid(7001), 'hb_bookbbbbbbbbbbbb'))).toEqual(OK);
    expect(
      await homebrew.createItem(newItem(uuid(7002), 'hb_itemcccccccccccc', uuid(7001)))
    ).toEqual(OK);
    expect(await homebrew.createBook(newBook(ALDER, 'hb_bookdddddddddddd'))).toEqual(OK);
    expect(await homebrew.createItem(newItem(uuid(511), 'hb_itemeeeeeeeeeeee'))).toEqual(OK);
    const r = await read(gm2);
    expect(r.books.map((b) => [b.key, b.revision])).toEqual([['hb_bookbbbbbbbbbbbb', 1]]);
    expect(r.items.map((i) => [i.key, i.book_id])).toEqual([
      ['hb_itemcccccccccccc', uuid(7001)]
    ]);
  });

  it('refuses a bad key, a repeated key and content the validators refuse', async () => {
    const { homebrew } = fakeCloud(SEED, 'gm1');
    expect(await homebrew.createBook(newBook(uuid(7001), 'hb_x1'))).toEqual(REFUSED);
    expect(await homebrew.createBook(newBook(uuid(7001), 'hb_alderworkshopaaa'))).toEqual(
      REFUSED
    );
    expect(
      await homebrew.createBook({ id: uuid(7001), key: 'hb_bookbbbbbbbbbbbb', content: {} })
    ).toEqual(REFUSED);
    expect(await homebrew.createItem(newItem(uuid(7002), 'x'))).toEqual(REFUSED);
    expect(await homebrew.createItem(newItem(uuid(7002), AXE))).toEqual(REFUSED);
    expect(
      await homebrew.createItem({
        ...newItem(uuid(7002), 'hb_itemcccccccccccc'),
        content: { kind: 'equip', ru: 'Клинок' }
      })
    ).toEqual(REFUSED);
  });

  it("refuses an item in another account's source, on create and on update", async () => {
    const { homebrew } = fakeCloud(SEED, 'gm2');
    expect(
      await homebrew.createItem(newItem(uuid(7002), 'hb_itemcccccccccccc', ALDER))
    ).toEqual(REFUSED);
    const gm1 = fakeCloud(SEED, 'gm1');
    const r = await read(gm1);
    const ring = r.items.find((i) => i.key === 'hb_engravedringaaaa');
    expect(
      await gm1.homebrew.updateItem(
        uuid(514),
        { content: ring?.content ?? { kind: 'item', ru: 'x' }, book_id: uuid(9) },
        1
      )
    ).toEqual(REFUSED);
  });

  it('answers the limits by their options, with the key and the value', async () => {
    const gm1 = fakeCloud(SEED, 'gm1', { limits: { books: 1, items: 4 } });
    expect(await gm1.homebrew.createBook(newBook(uuid(7001), 'hb_bookbbbbbbbbbbbb'))).toEqual({
      ok: false,
      error: 'limit',
      key: 'homebrew_books_per_owner',
      value: 1
    });
    expect(await gm1.homebrew.createItem(newItem(uuid(7002), 'hb_itemcccccccccccc'))).toEqual({
      ok: false,
      error: 'limit',
      key: 'homebrew_items_per_owner',
      value: 4
    });
    expect((await read(gm1)).itemLimit).toBe(4);
    expect((await read(gm1)).bookLimit).toBe(1);
    const def = fakeCloud(SEED, 'gm2');
    for (let i = 0; i < 20; i++) {
      await def.homebrew.createBook(newBook(uuid(7100 + i), def.homebrew.newKey()));
    }
    expect(
      await def.homebrew.createBook(newBook(uuid(7200), def.homebrew.newKey()))
    ).toMatchObject({ error: 'limit', value: 20 });
  });

  it('updates with the revision, answers ok to the same update again, conflict to another, gone to none', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const { homebrew } = cloud;
    const before = (await read(cloud)).items.find((i) => i.key === POTION);
    const content = { kind: 'consumable' as const, ru: 'Настой кузнеца II' };
    const patch = { content, book_id: null };
    vi.advanceTimersByTime(1000);
    expect(await homebrew.updateItem(uuid(512), patch, 1)).toEqual({ ok: true, revision: 2 });
    expect(await homebrew.updateItem(uuid(512), patch, 1)).toEqual({ ok: true, revision: 2 });
    expect(
      await homebrew.updateItem(uuid(512), { ...patch, content: { ...content, ru: 'III' } }, 1)
    ).toEqual({ ok: false, error: 'conflict' });
    expect(await homebrew.updateItem(uuid(512), patch, null)).toEqual({
      ok: true,
      revision: 3
    });
    const after = (await read(cloud)).items.find((i) => i.key === POTION);
    expect(after?.updated_at).not.toBe(before?.updated_at);
    expect([after?.id, after?.key, after?.created_at]).toEqual([
      before?.id,
      before?.key,
      before?.created_at
    ]);
    expect(await homebrew.updateItem(uuid(9), patch, 1)).toEqual({ ok: false, error: 'gone' });
    expect(
      await homebrew.updateItem(uuid(512), { ...patch, content: { kind: 'item' } }, null)
    ).toEqual(REFUSED);
    const book = { ru: 'Мастерская Ольхи', en: 'Alder Workshop' };
    expect(await homebrew.updateBook(ALDER, book, 1)).toEqual({ ok: true, revision: 2 });
    expect(await homebrew.updateBook(ALDER, book, 1)).toEqual({ ok: true, revision: 2 });
    expect(await homebrew.updateBook(ALDER, { ru: 'Другое' }, 1)).toEqual({
      ok: false,
      error: 'conflict'
    });
    expect(await homebrew.updateBook(ALDER, {}, null)).toEqual(REFUSED);
    expect(await homebrew.updateBook(uuid(9), book, null)).toEqual({
      ok: false,
      error: 'gone'
    });
  });

  it('bumps each list linking the item once, of any user, on an item edit and on a source rename', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    await withEntries(cloud);
    const gm2 = cloud.as('gm2');
    const was = { ...(await revisions(cloud)), ...(await revisions(gm2)) };
    const axe = (await read(cloud)).items.find((i) => i.key === AXE);
    if (!axe) throw new Error('no axe');
    await cloud.homebrew.updateItem(uuid(511), { content: axe.content, book_id: ALDER }, null);
    const edited = { ...(await revisions(cloud)), ...(await revisions(gm2)) };
    expect(edited[EMPTY]).toBe((was[EMPTY] ?? 0) + 1);
    expect(edited[uuid(101)]).toBe((was[uuid(101)] ?? 0) + 1);
    expect(edited[uuid(201)]).toBe((was[uuid(201)] ?? 0) + 1);
    expect(edited[uuid(103)]).toBe(was[uuid(103)]);
    await cloud.homebrew.updateBook(ALDER, { ru: 'Мастерская' }, null);
    expect((await revisions(cloud))[EMPTY]).toBe((was[EMPTY] ?? 0) + 2);
    await cloud.homebrew.updateItem(
      POTION_ID,
      { content: { kind: 'consumable', ru: 'Настой' }, book_id: null },
      null
    );
    expect((await revisions(cloud))[EMPTY]).toBe((was[EMPTY] ?? 0) + 3);
    expect((await revisions(gm2))[uuid(201)]).toBe((was[uuid(201)] ?? 0) + 2);
  });

  it('removes an item with every entry that links it, of any user', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    await withEntries(cloud);
    const gm2 = fakeCloud(SEED, 'gm2');
    const was = await revisions(cloud);
    expect(await cloud.homebrew.removeItem(uuid(511))).toEqual(OK);
    expect(await cloud.homebrew.removeItem(POTION_ID)).toEqual(OK);
    expect(await cloud.homebrew.removeItem(uuid(9))).toEqual(OK);
    const r = await cloud.lists.list();
    const list = r.ok ? r.lists.find((l) => l.id === EMPTY) : undefined;
    expect(list?.list_entries).toEqual([]);
    expect(list?.revision).toBe((was[EMPTY] ?? 0) + 2);
    const theirs = await cloud.as('gm2').lists.list();
    expect(
      theirs.ok &&
        theirs.lists.find((l) => l.id === uuid(201))?.list_entries.map((e) => e.item_key)
    ).toEqual(['q23']);
    expect((await read(cloud)).items.map((i) => i.key)).toEqual([
      'hb_whispercapaaaaaa',
      'hb_engravedringaaaa'
    ]);
    expect(await gm2.homebrew.removeItem(uuid(513))).toEqual(OK);
    expect((await read(fakeCloud(SEED, 'gm1'))).items).toHaveLength(4);
  });

  it("takes a deleted user's items out of every list that links them", async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    expect(await cloud.auth.deleteAccount()).toEqual({ ok: true });
    const theirs = await cloud.as('gm2').lists.list();
    expect(
      theirs.ok &&
        theirs.lists.find((l) => l.id === uuid(201))?.list_entries.map((e) => e.item_key)
    ).toEqual(['q23']);
  });

  it('removes a source, moving its items to the default source one revision up', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    await withEntries(cloud);
    const was = await revisions(cloud);
    expect(await cloud.homebrew.removeBook(ALDER)).toEqual(OK);
    expect(await cloud.homebrew.removeBook(ALDER)).toEqual(OK);
    const r = await read(cloud);
    expect(r.books).toEqual([]);
    expect(r.items.find((i) => i.key === AXE)).toMatchObject({ book_id: null, revision: 2 });
    expect((await revisions(cloud))[EMPTY]).toBe((was[EMPTY] ?? 0) + 1);
  });

  it("refuses a key the list owner lacks, an unknown item and a previous bundle's frozen copy", async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const results = await cloud.lists.apply(
      [
        [hbEntry(uuid(7201), 'hb_nosuchitemaaaaaa', 0)],
        [hbEntry(uuid(7202), 'hb_itemcccccccccccc', 0, uuid(9))],
        [{ ...hbEntry(uuid(7203), 'hb_itemcccccccccccc', 0), snapshot: potionRecord() }],
        [hbEntry(uuid(7204), 'q9', 0, POTION_ID)]
      ].map((entries) => ({ op: 'add' as const, list_id: EMPTY, entries }))
    );
    expect(results).toEqual({ ok: true, results: [REFUSED, REFUSED, REFUSED, OK] });
    /* The link takes its item's key, whatever key it was sent with. */
    const r = await cloud.lists.list();
    expect(
      r.ok && r.lists.find((l) => l.id === EMPTY)?.list_entries.map((e) => e.item_key)
    ).toEqual([POTION]);
    const gm2 = fakeCloud(SEED, 'gm2');
    expect(
      await gm2.lists.apply([
        { op: 'add', list_id: uuid(201), entries: [hbEntry(uuid(7301), POTION, 2)] },
        { op: 'add', list_id: uuid(201), entries: [hbEntry(uuid(7302), POTION, 2, POTION_ID)] }
      ])
    ).toEqual({ ok: true, results: [REFUSED, OK] });
    expect(
      await gm2.lists.import([
        {
          list: { id: uuid(7400), name: 'И', money_mode: 'bag', player_note: '', gm_note: '' },
          entries: [hbEntry(uuid(7401), AXE, 0)]
        }
      ])
    ).toEqual(REFUSED);
  });

  it('relinks an entry in place, keeping its id, position, quantity, price, notes and GM-only mark', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    await withEntries(cloud);
    await cloud.lists.apply([
      {
        op: 'update_entry',
        id: uuid(7102),
        patch: { quantity: 4, price_coins: 30, gm_note: 'g', gm_only: true }
      }
    ]);
    const results = await cloud.lists.apply([
      { op: 'relink', id: uuid(7102), hb_item: POTION_ID },
      { op: 'relink', id: uuid(9), hb_item: POTION_ID },
      { op: 'relink', id: uuid(7102), hb_item: uuid(9) },
      { op: 'relink', id: uuid(7102), hb_item: uuid(511) }
    ]);
    expect(results).toEqual({
      ok: true,
      results: [OK, { ok: false, error: 'gone' }, REFUSED, REFUSED]
    });
    const r = await cloud.lists.list();
    const e = r.ok ? r.lists.find((l) => l.id === EMPTY)?.list_entries[1] : undefined;
    expect(e).toMatchObject({
      id: uuid(7102),
      item_key: POTION,
      hb_item: POTION_ID,
      position: 1,
      quantity: 4,
      price_coins: 30,
      gm_note: 'g',
      gm_only: true
    });
  });

  it("projects each link from its live item, of any owner, with the item's id beside it", async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    await withEntries(cloud);
    const made = await cloud.shares.create(EMPTY, 'player');
    if (!made.ok) throw new Error('no share');
    const entries = async () => {
      const r = await cloud.shares.read(made.token);
      return (r.ok ? r.shared?.entries : undefined) ?? [];
    };
    const [axe, potion] = await entries();
    expect(axe?.snapshot).toMatchObject({
      id: AXE,
      src: 'homebrew',
      book: { key: 'hb_alderworkshopaaa', section: { key: 'hb_sectbladesaaaaaa' } }
    });
    expect([axe?.hid, potion?.hid]).toEqual([uuid(511), POTION_ID]);
    expect(potion?.snapshot).toEqual(potionRecord());
    await cloud.homebrew.updateBook(ALDER, { ru: 'Мастерская II', en: 'Workshop II' }, null);
    expect((await entries())[0]?.snapshot).toMatchObject({
      book: { key: 'hb_alderworkshopaaa', ru: 'Мастерская II', en: 'Workshop II' }
    });
    /* gm2's list links gm1's axe: the projection reads it from gm1's rows. */
    const gm2 = cloud.as('gm2');
    const theirs = await gm2.shares.create(uuid(201), 'player');
    if (!theirs.ok) throw new Error('no share');
    const read = await gm2.shares.read(theirs.token);
    const linked = read.ok
      ? read.shared?.entries.find((e) => e.source === 'homebrew')
      : undefined;
    expect(linked?.hid).toBe(uuid(511));
    expect(linked?.snapshot).toMatchObject({ id: AXE, book: { ru: 'Мастерская II' } });
  });

  it('links the same items in a copy by the owner and by another user', async () => {
    const cloud = fakeCloud({ ...SEED, defaultUser: 'gm2' }, 'gm1');
    await withEntries(cloud);
    const made = await cloud.shares.create(EMPTY, 'player');
    if (!made.ok) throw new Error('no share');
    const entriesOf = async (port: CloudPort, id: string) => {
      const r = await port.lists.list();
      return (r.ok ? r.lists.find((l) => l.id === id)?.list_entries : undefined) ?? [];
    };
    const linked = [
      [AXE, 'homebrew', uuid(511)],
      [POTION, 'homebrew', POTION_ID]
    ];
    expect(await cloud.shares.clone(made.token, uuid(7500))).toEqual(OK);
    expect(
      (await entriesOf(cloud, uuid(7500))).map((e) => [e.item_key, e.source, e.hb_item])
    ).toEqual(linked);
    /* Another user of the same port: its default user is gm2. */
    await cloud.auth.signOut();
    await cloud.auth.signIn('google');
    expect(await cloud.shares.clone(made.token, uuid(7600))).toEqual(OK);
    expect(
      (await entriesOf(cloud, uuid(7600))).map((e) => [e.item_key, e.source, e.hb_item])
    ).toEqual(linked);
  });

  it('sends one homebrew message per write with the tab, and none for a refused one', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const seen: unknown[] = [];
    cloud.events.subscribe('owner:' + SEED.users.gm1.id, {
      message: (event, payload) => seen.push([event, payload]),
      status: () => undefined
    });
    await Promise.resolve();
    await cloud.homebrew.createItem(newItem(uuid(7002), 'x'));
    await cloud.homebrew.updateItem(
      uuid(9),
      { content: { kind: 'item', ru: 'a' }, book_id: null },
      null
    );
    await cloud.homebrew.createBook(newBook(uuid(7001), 'hb_bookbbbbbbbbbbbb'));
    await cloud.homebrew.removeItem(uuid(514));
    await cloud.homebrew.removeItem(uuid(514));
    for (let i = 0; i < 5; i++) await Promise.resolve();
    expect(seen).toEqual([
      ['homebrew', { by: 'fake-tab', id: '1' }],
      ['homebrew', { by: 'fake-tab', id: '2' }]
    ]);
  });

  it('answers network offline and signed out, and drops the rows with the account', async () => {
    const off = fakeCloud(SEED, 'gm1', { offline: true });
    expect(await off.homebrew.load()).toEqual({ ok: false });
    expect(await off.homebrew.createBook(newBook(uuid(7001), 'hb_bookbbbbbbbbbbbb'))).toEqual(
      NETWORK
    );
    expect(await off.homebrew.updateBook(ALDER, { ru: 'a' }, null)).toEqual(NETWORK);
    expect(await off.homebrew.removeBook(ALDER)).toEqual(NETWORK);
    expect(await off.homebrew.createItem(newItem(uuid(7002), 'hb_itemcccccccccccc'))).toEqual(
      NETWORK
    );
    expect(
      await off.homebrew.updateItem(
        uuid(511),
        { content: { kind: 'item', ru: 'a' }, book_id: null },
        null
      )
    ).toEqual(NETWORK);
    expect(await off.homebrew.removeItem(uuid(511))).toEqual(NETWORK);
    off.setOffline(false);
    expect((await read(off)).items).toHaveLength(4);
    const out = fakeCloud(SEED);
    expect(await out.homebrew.load()).toEqual({ ok: false });
    expect(await out.homebrew.removeItem(uuid(511))).toEqual(NETWORK);
    const doomed = fakeCloud(SEED, 'gm1');
    await doomed.auth.deleteAccount();
    await doomed.auth.signIn('google');
    expect(await read(doomed)).toEqual({
      ok: true,
      books: [],
      items: [],
      cards: [],
      itemLimit: 100,
      bookLimit: 20,
      cardLimit: 100
    });
  });

  const SET = 'hb_aldersetaaaaaaaa';
  const RULE = 'hb_alderrulecardaaa';
  const newCard = (id: string, key: string, bookId: string | null = null) => ({
    id,
    key,
    kind: 'ref' as const,
    book_id: bookId,
    content: { en: 'Ember Brand', ende: 'Ignite a torch.' }
  });

  it('creates a card, answers ok to an id any account holds, and refuses a bad key, a repeated key, a bad card and a foreign source', async () => {
    const gm2 = fakeCloud(SEED, 'gm2');
    const { homebrew } = gm2;
    expect(await homebrew.createCard(newCard(uuid(7020), 'hb_carddddddddddddd'))).toEqual(OK);
    expect(await homebrew.createCard(newCard(uuid(521), 'hb_cardeeeeeeeeeeee'))).toEqual(OK);
    expect(await homebrew.createCard(newCard(uuid(7021), 'hb_x1'))).toEqual(REFUSED);
    expect(await homebrew.createCard(newCard(uuid(7021), 'hb_carddddddddddddd'))).toEqual(
      REFUSED
    );
    expect(
      await homebrew.createCard({
        ...newCard(uuid(7021), 'hb_cardffffffffffff'),
        content: { en: 'Brand', url: 'http://example.test' }
      })
    ).toEqual(REFUSED);
    expect(
      await homebrew.createCard({
        ...newCard(uuid(7021), 'hb_cardffffffffffff'),
        kind: 'set',
        content: { en: 'Set', rusub: 'x' }
      })
    ).toEqual(REFUSED);
    expect(
      await homebrew.createCard(newCard(uuid(7021), 'hb_cardffffffffffff', ALDER))
    ).toEqual(REFUSED);
    expect((await read(gm2)).cards.map((c) => c.key)).toEqual(['hb_carddddddddddddd']);
  });

  it('answers the card limit by its option, with the key and the value', async () => {
    const gm1 = fakeCloud(SEED, 'gm1', { limits: { cards: 2 } });
    expect(await gm1.homebrew.createCard(newCard(uuid(7020), 'hb_carddddddddddddd'))).toEqual({
      ok: false,
      error: 'limit',
      key: 'homebrew_cards_per_owner',
      value: 2
    });
    const def = fakeCloud(SEED, 'gm2');
    for (let i = 0; i < 100; i++) {
      await def.homebrew.createCard(newCard(uuid(7100 + i), def.homebrew.newKey()));
    }
    expect(
      await def.homebrew.createCard(newCard(uuid(7300), def.homebrew.newKey()))
    ).toMatchObject({ error: 'limit', value: 100 });
  });

  it('updates a card with the revision and keeps its kind, as an item update', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const { homebrew } = cloud;
    const patch = { content: { ru: 'Комплект Ольхи II' }, book_id: null };
    expect(await homebrew.updateCard(uuid(521), patch, 1)).toEqual({ ok: true, revision: 2 });
    expect(await homebrew.updateCard(uuid(521), patch, 1)).toEqual({ ok: true, revision: 2 });
    expect(
      await homebrew.updateCard(uuid(521), { ...patch, content: { ru: 'III' } }, 1)
    ).toEqual({ ok: false, error: 'conflict' });
    expect(await homebrew.updateCard(uuid(521), patch, null)).toEqual({
      ok: true,
      revision: 3
    });
    expect(
      await homebrew.updateCard(
        uuid(521),
        { content: { ru: 'a', url: '' }, book_id: null },
        null
      )
    ).toEqual(REFUSED);
    expect(await homebrew.updateCard(uuid(521), { ...patch, book_id: uuid(9) }, null)).toEqual(
      REFUSED
    );
    expect(await homebrew.updateCard(uuid(9), patch, null)).toEqual({
      ok: false,
      error: 'gone'
    });
    const set = (await read(cloud)).cards.find((c) => c.key === SET);
    expect([set?.kind, set?.book_id, set?.revision]).toEqual(['set', null, 3]);
  });

  it('refuses an item that names its own key in craft or craft_from, on create and on update', async () => {
    const { homebrew } = fakeCloud(SEED, 'gm1');
    const key = 'hb_itemcccccccccccc';
    expect(
      await homebrew.createItem({
        ...newItem(uuid(7002), key),
        content: { kind: 'item', ru: 'Сама', craft: [key] }
      })
    ).toEqual(REFUSED);
    expect(
      await homebrew.updateItem(
        uuid(512),
        { content: { kind: 'item', ru: 'Сама', craft_from: [POTION] }, book_id: null },
        null
      )
    ).toEqual(REFUSED);
  });

  it('bumps the lists holding a reference to an item naming a card on its writes, and embeds the named cards', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    await withEntries(cloud);
    const axe = (await read(cloud)).items.find((i) => i.key === AXE);
    if (!axe) throw new Error('no axe');
    const content = { ...axe.content, set: SET, refs: [RULE, 'slow'] };
    await cloud.homebrew.updateItem(uuid(511), { content, book_id: ALDER }, null);
    const was = await revisions(cloud);
    await cloud.homebrew.updateCard(
      uuid(522),
      { content: { en: 'Brand II' }, book_id: null },
      null
    );
    const edited = await revisions(cloud);
    expect(edited[EMPTY]).toBe((was[EMPTY] ?? 0) + 1);
    expect(edited[uuid(103)]).toBe(was[uuid(103)]);
    const made = await cloud.shares.create(EMPTY, 'player');
    if (!made.ok) throw new Error('no share');
    const shared = await cloud.shares.read(made.token);
    const snapshot = shared.ok ? shared.shared?.entries[0]?.snapshot : null;
    expect(snapshot).toMatchObject({
      cards: { sets: { [SET]: { ru: 'Комплект Ольхи' } }, refs: { [RULE]: { en: 'Brand II' } } }
    });
    expect(snapshotValid(snapshot)).toBe(true);
    const shown = (await revisions(cloud))[EMPTY] ?? 0;
    expect(await cloud.homebrew.removeCard(uuid(522))).toEqual(OK);
    expect(await cloud.homebrew.removeCard(uuid(522))).toEqual(OK);
    expect((await revisions(cloud))[EMPTY]).toBe(shown + 1);
    const after = await cloud.shares.read(made.token);
    const next = after.ok ? after.shared?.entries[0]?.snapshot : null;
    expect(next).toMatchObject({ cards: { sets: { [SET]: {} } } });
    expect((next as { cards?: { refs?: unknown } }).cards?.refs).toBeUndefined();
  });

  it('moves the cards of a removed source to no source, one revision up', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    expect(await cloud.homebrew.removeBook(ALDER)).toEqual(OK);
    const set = (await read(cloud)).cards.find((c) => c.key === SET);
    expect([set?.book_id, set?.revision]).toEqual([null, 2]);
  });

  it('answers network for a card offline and signed out', async () => {
    const off = fakeCloud(SEED, 'gm1', { offline: true });
    expect(await off.homebrew.createCard(newCard(uuid(7020), 'hb_carddddddddddddd'))).toEqual(
      NETWORK
    );
    expect(
      await off.homebrew.updateCard(uuid(521), { content: { ru: 'a' }, book_id: null }, null)
    ).toEqual(NETWORK);
    expect(await off.homebrew.removeCard(uuid(521))).toEqual(NETWORK);
  });
});

describe("the fake's homebrew import and move", () => {
  const AXE = 'hb_emberaxeaaaaaaaa';
  const ALDER_KEY = 'hb_alderworkshopaaa';
  const BLADES = 'hb_sectbladesaaaaaa';
  const PISTOLS = 'hb_sectpistolsaaaaa';
  const REFUSED = { ok: false, error: 'refused' };
  const NETWORK = { ok: false, error: 'network' };
  const none = { books: [], cards: [], items: [], update: false };
  const counts = (o: Record<string, number> = {}) => ({
    books_created: 0,
    cards_created: 0,
    cards_updated: 0,
    cards_skipped: 0,
    items_created: 0,
    items_updated: 0,
    items_skipped: 0,
    ...o
  });
  const L = 'abcdefghijklmnopqrstuvwxyz';
  /* A key from a prefix and a number: `hb_`, the prefix, two letters, padded to 16. */
  const k = (prefix: string, n: number): string =>
    'hb_' + (prefix + L.charAt(n % 26) + L.charAt(Math.floor(n / 26) % 26)).padEnd(16, 'a');
  const newItem = (n: number, extra: Record<string, unknown> = {}) => ({
    id: uuid(8000 + n),
    key: k('imp', n),
    book: null,
    content: { kind: 'item' as const, ru: 'Новый ' + String(n) },
    ...extra
  });
  const loaded = async (cloud: CloudPort) => {
    const r = await cloud.homebrew.load();
    if (!r.ok) throw new Error('the read failed');
    return r;
  };

  it('writes the rows, then skips the held keys, then updates them with the flag', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const rows = {
      books: [
        {
          id: uuid(8100),
          key: ALDER_KEY,
          names: true,
          content: {
            en: 'Alder II',
            sections: [{ key: 'hb_secttoolsaaaaaaa', ru: 'Инструменты' }]
          }
        }
      ],
      cards: [
        {
          id: uuid(8101),
          key: 'hb_aldersetaaaaaaaa',
          kind: 'set' as const,
          book: ALDER_KEY,
          content: { ru: 'Новый' }
        },
        {
          id: uuid(8102),
          key: 'hb_newcardaaaaaaaaa',
          kind: 'ref' as const,
          book: null,
          content: { en: 'R' }
        }
      ],
      items: [
        {
          id: uuid(8103),
          key: AXE,
          book: null,
          content: { kind: 'item' as const, ru: 'Топор II' }
        },
        newItem(0, {
          book: ALDER_KEY,
          content: { kind: 'item', ru: 'В разделе', section: 'hb_secttoolsaaaaaaa' }
        })
      ],
      update: false
    };
    expect(await cloud.homebrew.import(rows)).toEqual({
      ok: true,
      counts: counts({ cards_created: 1, cards_skipped: 1, items_created: 1, items_skipped: 1 })
    });
    const once = await loaded(cloud);
    const book = once.books.find((b) => b.key === ALDER_KEY);
    expect(book?.content).toEqual({
      ru: 'Мастерская Ольхи',
      en: 'Alder Workshop',
      sections: [
        { key: PISTOLS, ru: 'Пистоли', en: 'Pistols' },
        { key: BLADES, ru: 'Холодное оружие', en: 'Blades' },
        { key: 'hb_secttoolsaaaaaaa', ru: 'Инструменты' }
      ]
    });
    expect(await cloud.homebrew.import({ ...rows, update: true })).toEqual({
      ok: true,
      counts: counts({ cards_updated: 1, cards_skipped: 1, items_updated: 1, items_skipped: 1 })
    });
    const twice = await loaded(cloud);
    expect(twice.books.find((b) => b.key === ALDER_KEY)?.content.en).toBe('Alder II');
    expect(twice.items.find((i) => i.key === AXE)).toMatchObject({
      id: uuid(511),
      book_id: null,
      content: { kind: 'item', ru: 'Топор II' },
      revision: 2
    });
    expect(twice.cards.find((c) => c.key === 'hb_aldersetaaaaaaaa')?.content).toEqual({
      ru: 'Новый'
    });
  });

  it('skips a held card of another kind under the flag', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const card = {
      id: uuid(8101),
      key: 'hb_aldersetaaaaaaaa',
      kind: 'ref' as const,
      book: null,
      content: { en: 'X' }
    };
    expect(await cloud.homebrew.import({ ...none, cards: [card], update: true })).toEqual({
      ok: true,
      counts: counts({ cards_skipped: 1 })
    });
  });

  it.each([
    [
      '101 sources',
      {
        ...none,
        books: Array.from({ length: 101 }, (_, i) => ({
          id: uuid(9000 + i),
          key: k('bk', i),
          names: false,
          content: { ru: 'И' }
        }))
      }
    ],
    ['1001 items', { ...none, items: Array.from({ length: 1001 }, (_, i) => newItem(i)) }],
    ['a key twice', { ...none, items: [newItem(1), { ...newItem(1), id: uuid(8999) }] }],
    ['an unknown source', { ...none, items: [newItem(1, { book: 'hb_nosuchsourceaaaa' })] }],
    [
      'a section its source lacks',
      {
        ...none,
        items: [
          newItem(1, {
            book: ALDER_KEY,
            content: { kind: 'item', ru: 'X', section: 'hb_sectnoneaaaaaaaa' }
          })
        ]
      }
    ],
    [
      'a section with no source',
      { ...none, items: [newItem(1, { content: { kind: 'item', ru: 'X', section: PISTOLS } })] }
    ],
    [
      'an invalid item',
      { ...none, items: [newItem(1, { content: { kind: 'item', ru: 'X\r' } })] }
    ],
    [
      'a merge past 30 sections',
      {
        ...none,
        books: [
          {
            id: uuid(8100),
            key: ALDER_KEY,
            names: false,
            content: {
              ru: 'М',
              sections: Array.from({ length: 29 }, (_, i) => ({
                key: k('sc', i),
                ru: 'Р' + String(i)
              }))
            }
          }
        ]
      }
    ]
  ])('refuses %s, writing nothing', async (_what, rows) => {
    const cloud = fakeCloud(SEED, 'gm1');
    const was = await loaded(cloud);
    expect(await cloud.homebrew.import(rows)).toEqual(REFUSED);
    expect(await loaded(cloud)).toEqual(was);
  });

  it('refuses a call past the item limit whole, and takes 300 under a limit of 300', async () => {
    const cloud = fakeCloud(SEED, 'gm3');
    expect(
      await cloud.homebrew.import({
        ...none,
        items: Array.from({ length: 62 }, (_, i) => newItem(i))
      })
    ).toEqual({ ok: false, error: 'limit', key: 'homebrew_items_per_owner', value: 100 });
    expect((await loaded(cloud)).items).toHaveLength(39);
    const raised = fakeCloud(SEED, 'gm2', { limits: { items: 300 } });
    expect(
      await raised.homebrew.import({
        ...none,
        items: Array.from({ length: 300 }, (_, i) => newItem(i))
      })
    ).toEqual({ ok: true, counts: counts({ items_created: 300 }) });
  });

  it('moves every item or none, and answers conflict, gone and refused', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const items = (await loaded(cloud)).items;
    const pick = items.map((i) => ({ id: i.id, revision: i.revision }));
    expect(
      await cloud.homebrew.moveItems([{ ...pick[0]!, revision: 9 }, pick[1]!], null, null)
    ).toEqual({
      ok: false,
      error: 'conflict'
    });
    expect(await loaded(cloud)).toMatchObject({ items });
    expect(await cloud.homebrew.moveItems(pick, uuid(9999), null)).toEqual({
      ok: false,
      error: 'gone'
    });
    expect(await cloud.homebrew.moveItems(pick, uuid(501), 'hb_sectnoneaaaaaaaa')).toEqual({
      ok: false,
      error: 'gone'
    });
    expect(await cloud.homebrew.moveItems(pick, null, PISTOLS)).toEqual(REFUSED);
    expect(await cloud.homebrew.moveItems([], null, null)).toEqual(REFUSED);
    expect(await cloud.homebrew.moveItems([pick[0]!, pick[0]!], null, null)).toEqual(REFUSED);
    expect(await cloud.homebrew.moveItems(pick, uuid(501), PISTOLS)).toEqual({ ok: true });
    const moved = (await loaded(cloud)).items;
    expect(moved.every((i) => i.book_id === uuid(501) && i.content.section === PISTOLS)).toBe(
      true
    );
    expect(moved.map((i) => i.revision)).toEqual(items.map((i) => i.revision + 1));
    expect(
      await cloud.homebrew.moveItems(
        moved.map((i) => ({ id: i.id, revision: i.revision })),
        null,
        null
      )
    ).toEqual({ ok: true });
    expect(
      (await loaded(cloud)).items.every((i) => i.book_id === null && !('section' in i.content))
    ).toBe(true);
  });

  it('answers network offline and signed out', async () => {
    for (const cloud of [fakeCloud(SEED, 'gm1', { offline: true }), fakeCloud(SEED)]) {
      expect(await cloud.homebrew.import(none)).toEqual(NETWORK);
      expect(
        await cloud.homebrew.moveItems([{ id: uuid(511), revision: 1 }], null, null)
      ).toEqual(NETWORK);
    }
  });

  it('sends one homebrew message per import and per move, and none for a refused one', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const seen: string[] = [];
    cloud.events.subscribe('owner:' + SEED.users.gm1.id, {
      message: (event) => seen.push(event),
      status: () => undefined
    });
    await Promise.resolve();
    await cloud.homebrew.import({ ...none, items: [newItem(1), newItem(2)] });
    await cloud.homebrew.import({
      ...none,
      items: [newItem(3, { book: 'hb_nosuchsourceaaaa' })]
    });
    await cloud.homebrew.moveItems(
      [
        { id: uuid(512), revision: 1 },
        { id: uuid(513), revision: 1 }
      ],
      uuid(501),
      null
    );
    for (let i = 0; i < 5; i++) await Promise.resolve();
    expect(seen.filter((e) => e === 'homebrew')).toHaveLength(2);
  });

  /* The lists export as the account page writes it, from the fake's lists and items. */
  const listsExport = async (cloud: ReturnType<typeof fakeCloud>): Promise<string> => {
    const r = await loaded(cloud);
    const read = await cloud.lists.list();
    const lists = (read.ok ? read.lists : [])
      .map(toCloudList)
      .sort((a, b) => b.updated - a.updated || (a.id < b.id ? -1 : 1));
    const index = buildIndex(
      JSON.parse(
        readFileSync(join(import.meta.dirname, '..', '..', '..', 'data.json'), 'utf8')
      ) as Loot
    );
    const cards = r.cards.map((c) => ({ ...c.content, key: c.key, kind: c.kind }));
    const record = (key: string) => {
      const it = r.items.find((i) => i.key === key);
      if (!it) return null;
      const b = r.books.find((x) => x.id === it.book_id);
      return recordOf(it.key, it.content, b ? { ...b.content, key: b.key } : null, cards);
    };
    return bundleText(
      toBundle(
        lists,
        (id) => index.byId.get(id)?.ru ?? record(id)?.ru,
        'Без названия',
        new Date('2026-09-25T12:00:00.000Z'),
        (id, list) => record(id) ?? linkedOf(list)[id] ?? null
      ).bundle
    );
  };
  const importFixture = (name: string): string =>
    readFileSync(
      join(import.meta.dirname, '..', '..', '..', 'docs', 'fixtures', 'import', name),
      'utf8'
    );

  /* The lists export with a link: gm1's first list links the axe, so the file is version 2
     with the live axe as its snapshot. export.json stays the frozen v1 pin. */
  it("writes gm1's lists with their own items as docs/fixtures/import/export-v2.json", async () => {
    const text = await listsExport(fakeCloud(SEED, 'gm1'));
    expect(JSON.parse(text)).toMatchObject({ version: 2 });
    expect(text).toBe(importFixture('export-v2.json'));
  });

  /* The same lists with di11 marked GM-only: version 3, the mark on that entry only. */
  it("writes gm1's lists with a GM-only entry as docs/fixtures/import/export-v3.json", async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    await cloud.lists.apply([{ op: 'update_entry', id: uuid(1109), patch: { gm_only: true } }]);
    const text = await listsExport(cloud);
    expect(JSON.parse(text)).toMatchObject({
      version: 3,
      $schema: 'https://artex-x.github.io/daggerheart-loot/schema/import-v3.json'
    });
    expect(text.match(/"gm_only"/g)).toHaveLength(1);
    expect(text).toBe(importFixture('export-v3.json'));
  });

  it("writes gm1's homebrew as docs/fixtures/homebrew-file/export.json, byte for byte", async () => {
    const r = await loaded(fakeCloud(SEED, 'gm1'));
    const text = homebrewText(
      toHomebrewFile(r.books, r.items, r.cards, new Date('2026-09-25T12:00:00.000Z'))
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
          'homebrew-file',
          'export.json'
        ),
        'utf8'
      )
    );
  });
});

describe("the fake's item read and change log", () => {
  const AXE_ID = uuid(511);
  const GM2_LIST = uuid(201);
  const ROLL_B = uuid(662);

  it('reads one item by its id for anyone, with the related items in the database order', async () => {
    const world = fakeCloud(SEED);
    const out = await world.as().lists.item(ROLL_B);
    expect(out.ok).toBe(true);
    const a = (out.ok ? out.item : null) as Record<string, unknown>;
    expect(a).toMatchObject({ hid: ROLL_B, mine: false });
    expect((a['item'] as { id: string }).id).toBe('hb_rangerrollaaaaaa');
    expect(snapshotValid(a['item'])).toBe(true);
    /* By the lowercased English name: Camp Blanket, Moss Pillow, Sentry's Roll, Traveller's Roll. */
    expect((a['related'] as { key: string }[]).map((r) => r.key)).toEqual([
      'hb_campblanketaaaaa',
      'hb_mosspillowaaaaaa',
      'hb_sentryrollaaaaaa',
      'hb_travelrollaaaaaa'
    ]);
    expect((a['related'] as Record<string, unknown>[])[0]).toEqual({
      hid: uuid(665),
      key: 'hb_campblanketaaaaa',
      kind: 'item',
      en: 'Camp Blanket',
      ru: 'Походный плед',
      set: 'hb_starsleepsetaaaa'
    });
    expect(typeof a['updated_at']).toBe('string');
    const author = await world.as('gm3').lists.item(ROLL_B);
    expect(author.ok && (author.item as { mine: boolean }).mine).toBe(true);
    expect(await world.as().lists.item(uuid(9999))).toEqual({ ok: true, item: null });
    world.setOffline(true);
    expect(await world.as().lists.item(ROLL_B)).toEqual({ ok: false });
  });

  it('moves the revision with an edit of the item or of a related item', async () => {
    const world = fakeCloud(SEED, 'gm3');
    const rev = async (): Promise<unknown> => {
      const r = await world.as().lists.item(ROLL_B);
      return r.ok ? (r.item as { revision: string }).revision : null;
    };
    const first = await rev();
    expect(await rev()).toBe(first);
    const c = SEED.homebrew.gm3.items.find((i) => i.id === uuid(663))!;
    expect(
      (
        await world.homebrew.updateItem(
          uuid(663),
          { content: { ...c.content, en: 'Sentry Roll' }, book_id: null },
          null
        )
      ).ok
    ).toBe(true);
    expect(await rev()).not.toBe(first);
  });

  it("reads the owner's notices newest first, marks them read and hides them by id", async () => {
    const world = fakeCloud(SEED, 'gm2');
    const read = await world.requests.notices();
    expect(read.ok && read.notices.map((n) => [n.item_key, n.kind, n.read_at])).toEqual([
      ['hb_emberaxeaaaaaaaa', 'changed', null],
      ['hb_longroadrollaaaa', 'deleted', null]
    ]);
    expect(await world.as('gm1').requests.notices()).toEqual({ ok: true, notices: [] });
    expect(await world.as().requests.notices()).toEqual({ ok: false });
    expect((await world.requests.markRead(GM2_LIST)).ok).toBe(true);
    const marked = await world.requests.notices(GM2_LIST);
    expect(marked.ok && marked.notices.every((n) => n.read_at !== null)).toBe(true);
    /* Another user's list deletes nothing. */
    await world.as('gm1').requests.hideNotices(GM2_LIST, [uuid(681)]);
    expect(((await world.requests.notices()) as { notices: unknown[] }).notices).toHaveLength(
      2
    );
    expect(await world.requests.hideNotices(GM2_LIST, [uuid(681), uuid(9999)])).toEqual({
      ok: true
    });
    const left = await world.requests.notices(GM2_LIST);
    expect(left.ok && left.notices.map((n) => n.id)).toEqual([uuid(682)]);
  });

  it("writes a notice on another user's list when the author changes then deletes a linked item", async () => {
    const world = fakeCloud(SEED, 'gm1');
    const gm2 = world.as('gm2');
    await gm2.requests.hideNotices(GM2_LIST, [uuid(681), uuid(682)]);
    const axe = SEED.homebrew.gm1.items.find((i) => i.id === AXE_ID)!;
    await world.homebrew.updateItem(
      AXE_ID,
      { content: { ...axe.content, en: 'Ash Axe' }, book_id: uuid(501) },
      null
    );
    await world.homebrew.updateItem(
      AXE_ID,
      { content: { ...axe.content, en: 'Ash Axe 2' }, book_id: uuid(501) },
      null
    );
    const changed = await gm2.requests.notices(GM2_LIST);
    expect(changed.ok && changed.notices).toEqual([
      expect.objectContaining({
        item_key: 'hb_emberaxeaaaaaaaa',
        hid: AXE_ID,
        kind: 'changed',
        read_at: null,
        name: { en: 'Ash Axe 2', ru: 'Топор Тлеющих Углей' }
      })
    ]);
    /* gm1's own list links the axe too, and gets no notice. */
    expect(await world.requests.notices()).toEqual({ ok: true, notices: [] });
    await world.homebrew.removeItem(AXE_ID);
    const deleted = await gm2.requests.notices(GM2_LIST);
    expect(deleted.ok && deleted.notices.map((n) => [n.kind, n.hid])).toEqual([
      ['deleted', null]
    ]);
  });

  it('cuts a read of every list at 1000 notices, and reads one list whole', async () => {
    const lists = Array.from({ length: 11 }, (_, l) => ({
      id: uuid(9100 + l),
      name: 'L' + String(l),
      entries: [],
      createdAgoMs: 1000,
      editedAgoMs: 1000
    }));
    const notices = lists.flatMap((l, li) =>
      Array.from({ length: li === 10 ? 1 : 100 }, (_, n) => ({
        id: uuid(20000 + li * 100 + n),
        listId: l.id,
        itemKey: 'hb_x' + String(n),
        hid: null,
        kind: 'deleted' as const,
        name: { en: 'X', ru: 'Х' },
        /* The last list's one notice is the oldest of all. */
        createdAgoMs: li === 10 ? 10_000_000 : li * 1000 + n
      }))
    );
    const world = fakeCloud({ ...SEED, lists: { ...SEED.lists, gm2: lists }, notices }, 'gm2');
    const all = await world.requests.notices();
    expect(all.ok && all.notices.length).toBe(1000);
    expect(all.ok && all.notices.some((n) => n.list_id === uuid(9110))).toBe(false);
    const one = await world.requests.notices(uuid(9110));
    expect(one.ok && one.notices.map((n) => n.id)).toEqual([uuid(21000)]);
  });
});
