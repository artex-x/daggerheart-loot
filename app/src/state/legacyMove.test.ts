/* The move of browser lists into the account, over the fake cloud and a
   memory storage (docs/specs/FEATURES.md, "Account and browser lists"). The
   move reads the app through `AppState`, which is not started here: each
   test calls `runIfDue` itself, with a user it controls. */

import { describe, expect, it, vi } from 'vitest';
import { toCloudList } from '../lib/cloudLists.js';
import { canonicalList } from '../lib/legacy.js';
import type { StoredList } from '../lib/lists.js';
import { brokenStorage, fakeEnv, memoryRouter, memoryStorage, noData } from '../ports/index.js';
import type { Env, MoveWrite, StoragePort } from '../ports/index.js';
import { fakeCloud, type FakeCloudOptions } from '../ports/fake-cloud.js';
import { SEED, uuid } from '../ports/fake-cloud-seed.js';
import { AppState } from './app.svelte.js';
import { LegacyMove } from './legacyMove.svelte.js';

const GM1 = SEED.users.gm1.id;
const GM2 = SEED.users.gm2.id;
const A: StoredList = {
  id: 'a',
  name: 'Клад дракона',
  ids: ['ci1', 'q1', 'zz_new'],
  meta: { ci1: { qty: 2, gold: 150, note: 'н', hnote: 'м' } },
  money: 'coin',
  note: 'лавка',
  created: 1
};
const B: StoredList = { id: 'b', name: 'Лавка в порту', ids: [], created: 2 };

const LISTS = 'dhloot.lists.v2';
const MIGRATED = 'dhloot.migrated.v1';

type Move = (id: string, canonical: string) => Promise<MoveWrite>;
/* The fake's own `move`, taken before the spy replaces it. */
const UNSPIED = new WeakMap<object, Move>();
const unspied = (cloud: object): Move => {
  const move = UNSPIED.get(cloud);
  if (!move) throw new Error('The cloud was not made by setup(). Make it there');
  return move;
};

function setup(
  lists: readonly StoredList[] = [A, B],
  over: { more?: Record<string, string>; env?: Partial<Env>; cloud?: FakeCloudOptions } = {}
) {
  const storage = memoryStorage({ [LISTS]: JSON.stringify(lists), ...over.more });
  const cloud = fakeCloud(SEED, 'gm1', over.cloud);
  const app = new AppState(
    fakeEnv({ storage, cloud, router: memoryRouter('#/lists'), ...over.env })
  );
  let who: string | null = GM1;
  const move = new LegacyMove(app, () => who);
  UNSPIED.set(cloud, cloud.lists.move.bind(cloud.lists));
  const moveSpy = vi.spyOn(cloud.lists, 'move');
  return {
    app,
    cloud,
    storage,
    move,
    moveSpy,
    as: (u: string | null): void => {
      who = u;
    }
  };
}

const idsIn = (storage: StoragePort): string[] =>
  (JSON.parse(storage.get(LISTS) ?? '[]') as { id: string }[]).map((l) => l.id);
const migratedIn = (storage: StoragePort): Record<string, unknown> | null =>
  JSON.parse(storage.get(MIGRATED) ?? 'null') as Record<string, unknown> | null;
const rowsOf = async (cloud: ReturnType<typeof fakeCloud>) => {
  const read = await cloud.lists.list();
  return read.ok ? read.lists : [];
};

describe('the automatic move', () => {
  it('moves two lists: read back equal, removed, tombstoned and named', async () => {
    const { app, cloud, storage, move } = setup();
    await app.cloudLists?.load();
    await move.runIfDue(GM1);
    expect(move.status).toBe('done');
    expect(move.moved).toBe(2);
    expect(idsIn(storage)).toEqual([]);
    expect(migratedIn(storage)).toEqual({
      owner: GM1,
      lists: { a: uuid(5000), b: uuid(5001) },
      notice: ['Клад дракона', 'Лавка в порту']
    });
    const rows = await rowsOf(cloud);
    const moved = rows.find((r) => r.id === uuid(5000));
    expect(moved?.legacy_fingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(moved && canonicalList(toCloudList(moved))).toBe(canonicalList(A));
    expect(app.cloudLists?.get(uuid(5001))?.name).toBe('Лавка в порту');
    expect(app.lists.lists).toEqual([]);
  });

  it('writes the tombstones before the lists', async () => {
    const { app, storage, move } = setup();
    const order: string[] = [];
    const set = storage.set.bind(storage);
    storage.set = (k, v) => {
      order.push(k);
      return set(k, v);
    };
    await app.cloudLists?.load();
    await move.runIfDue(GM1);
    expect(order.filter((k) => k === LISTS || k === MIGRATED).slice(-2)).toEqual([
      MIGRATED,
      LISTS
    ]);
  });

  it('keeps and names a refused list, and skips it on the next run of the page', async () => {
    const { app, storage, move, moveSpy } = setup();
    moveSpy.mockResolvedValueOnce({ ok: false, error: 'refused' });
    await app.cloudLists?.load();
    await move.runIfDue(GM1);
    expect(move.status).toBe('done');
    expect(move.refused).toEqual([{ id: 'a', name: 'Клад дракона' }]);
    expect(idsIn(storage)).toEqual(['a']);
    expect(moveSpy).toHaveBeenCalledTimes(2);
    await move.runIfDue(GM1);
    expect(moveSpy).toHaveBeenCalledTimes(2);
    expect(move.status).toBe('done');
  });

  it('stops on the network, keeps the rest, and the next run moves only the rest', async () => {
    const { app, cloud, storage, move, moveSpy } = setup();
    const real = unspied(cloud);
    moveSpy.mockImplementationOnce(async (id, text) => {
      const r = await real(id, text);
      cloud.setOffline(true);
      return r;
    });
    await app.cloudLists?.load();
    await move.runIfDue(GM1);
    expect(move.status).toBe('failed');
    expect(move.left).toBe(1);
    expect(idsIn(storage)).toEqual(['a', 'b']);
    cloud.setOffline(false);
    /* The read-back failed too: nothing was removed, and the run is repeated whole. */
    await move.runIfDue(GM1);
    expect(move.status).toBe('done');
    expect(idsIn(storage)).toEqual([]);
    expect(migratedIn(storage)?.['notice']).toEqual(['Клад дракона', 'Лавка в порту']);
  });

  it('removes the first list when the network drops at the second, and names only the rest next', async () => {
    const { app, cloud, storage, move, moveSpy } = setup();
    const real = unspied(cloud);
    moveSpy
      .mockImplementationOnce(real)
      .mockImplementationOnce(() => Promise.resolve({ ok: false, error: 'network' }));
    await app.cloudLists?.load();
    await move.runIfDue(GM1);
    expect(move.status).toBe('failed');
    expect(move.left).toBe(1);
    expect(idsIn(storage)).toEqual(['b']);
    expect(migratedIn(storage)?.['notice']).toEqual(['Клад дракона']);
    await move.runIfDue(GM1);
    expect(move.status).toBe('done');
    expect(migratedIn(storage)?.['notice']).toEqual(['Клад дракона', 'Лавка в порту']);
  });

  it('removes nothing when the read-back fails, and the next run answers inserted false', async () => {
    const { app, cloud, storage, move, moveSpy } = setup();
    await app.cloudLists?.load();
    vi.spyOn(cloud.lists, 'list').mockResolvedValueOnce({ ok: false });
    await move.runIfDue(GM1);
    expect(move.status).toBe('failed');
    expect(idsIn(storage)).toEqual(['a', 'b']);
    await move.runIfDue(GM1);
    const answers = await Promise.all(
      moveSpy.mock.results.slice(2).map((r) => r.value as Promise<MoveWrite>)
    );
    expect(answers.map((r) => r.ok && r.inserted)).toEqual([false, false]);
    expect(idsIn(storage)).toEqual([]);
    expect(await rowsOf(cloud)).toHaveLength(5);
  });

  it('holds a list whose account copy reads back differently, for good', async () => {
    const { app, cloud, storage, move, moveSpy } = setup();
    const real = unspied(cloud);
    moveSpy.mockImplementationOnce(async (id, text) => {
      const r = await real(id, text);
      await cloud.lists.apply([{ op: 'update', id, patch: { name: 'Не так' } }]);
      return r;
    });
    await app.cloudLists?.load();
    await move.runIfDue(GM1);
    expect(move.status).toBe('done');
    expect(idsIn(storage)).toEqual(['a']);
    expect(migratedIn(storage)).toMatchObject({ held: ['a'], notice: ['Лавка в порту'] });
    await move.runIfDue(GM1);
    /* A new page, its account read: the held list is still not sent. */
    const again = new AppState(fakeEnv({ storage, cloud }));
    const fresh = new LegacyMove(again, () => GM1);
    await again.cloudLists?.load();
    await fresh.runIfDue(GM1);
    expect(fresh.status).toBe('done');
    expect(moveSpy).toHaveBeenCalledTimes(2);
  });

  it('removes resurrected copies of moved lists with no second row, and names them again', async () => {
    const { app, cloud, storage, move } = setup();
    await app.cloudLists?.load();
    await move.runIfDue(GM1);
    storage.set(LISTS, JSON.stringify([A, B]));
    storage.remove(MIGRATED);
    const reloaded = new AppState(fakeEnv({ storage, cloud }));
    const second = new LegacyMove(reloaded, () => GM1);
    await reloaded.cloudLists?.load();
    await second.runIfDue(GM1);
    expect(second.status).toBe('done');
    expect(await rowsOf(cloud)).toHaveLength(5);
    expect(idsIn(storage)).toEqual([]);
    expect(migratedIn(storage)?.['notice']).toEqual(['Клад дракона', 'Лавка в порту']);
  });

  it('moves nothing for an account that is not the owner, and draws no notice', async () => {
    const { app, storage, move, moveSpy } = setup([A, B], {
      more: {
        [MIGRATED]: JSON.stringify({ owner: GM2, lists: {} }),
        'dhloot.lists.v2.bad': '{'
      }
    });
    await app.cloudLists?.load();
    await move.runIfDue(GM1);
    expect(move.foreign).toBe(true);
    expect(move.status).toBe('done');
    expect(moveSpy).not.toHaveBeenCalled();
    expect(migratedIn(storage)).toEqual({ owner: GM2, lists: {} });
  });

  it('is done at once when storage does not work', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const app = new AppState(fakeEnv({ storage: brokenStorage(), cloud }));
    const move = new LegacyMove(app, () => GM1);
    await app.cloudLists?.load();
    await move.runIfDue(GM1);
    expect(move.status).toBe('done');
  });

  it('waits for a share copy in flight, and moves on the next call', async () => {
    const { app, move, moveSpy } = setup();
    await app.cloudLists?.load();
    app.cloning = true;
    await move.runIfDue(GM1);
    expect([move.status, move.due]).toEqual(['idle', true]);
    expect(moveSpy).not.toHaveBeenCalled();
    app.cloning = false;
    await move.runIfDue(GM1);
    expect([move.status, move.due]).toEqual(['done', false]);
  });

  it('waits for the catalog and for the first read, leaving storage as it was', async () => {
    const { app, storage, move, moveSpy } = setup([A, B], { env: { data: noData() } });
    const raw = storage.get(LISTS);
    await app.cloudLists?.load();
    await move.runIfDue(GM1);
    expect([move.status, move.due]).toEqual(['idle', true]);
    expect(storage.get(LISTS)).toBe(raw);
    expect(moveSpy).not.toHaveBeenCalled();
    const unread = setup();
    await unread.move.runIfDue(GM1);
    expect([unread.move.status, unread.move.due]).toEqual(['idle', true]);
    expect(unread.moveSpy).not.toHaveBeenCalled();
  });

  it('fails at once on a first read in error with browser lists, and is done without them', async () => {
    const { app, move, moveSpy } = setup([A], { cloud: { offline: true } });
    await app.cloudLists?.load();
    expect(app.cloudLists?.status).toBe('error');
    await move.runIfDue(GM1);
    expect([move.status, move.due]).toEqual(['failed', true]);
    expect(moveSpy).not.toHaveBeenCalled();
    const empty = setup([], { cloud: { offline: true } });
    await empty.app.cloudLists?.load();
    await empty.move.runIfDue(GM1);
    expect(empty.move.status).toBe('done');
  });

  it('stops with nothing written when the user changes after the first move', async () => {
    const { app, cloud, storage, move, moveSpy, as } = setup();
    const real = unspied(cloud);
    moveSpy.mockImplementationOnce(async (id, text) => {
      const r = await real(id, text);
      as(GM2);
      return r;
    });
    await app.cloudLists?.load();
    const list = vi.spyOn(cloud.lists, 'list');
    await move.runIfDue(GM1);
    expect(move.status).toBe('failed');
    expect(list).not.toHaveBeenCalled();
    expect(idsIn(storage)).toEqual(['a', 'b']);
    expect(migratedIn(storage)).toEqual({ owner: GM1, lists: {} });
  });

  it('stops with nothing held or removed when the user changes after the read-back', async () => {
    const { app, cloud, storage, move, moveSpy, as } = setup();
    const real = unspied(cloud);
    moveSpy.mockImplementationOnce(async (id, text) => {
      const r = await real(id, text);
      await cloud.lists.apply([{ op: 'update', id, patch: { name: 'Не так' } }]);
      return r;
    });
    await app.cloudLists?.load();
    const read = cloud.lists.list.bind(cloud.lists);
    vi.spyOn(cloud.lists, 'list').mockImplementationOnce(async () => {
      const r = await read();
      as(null);
      return r;
    });
    await move.runIfDue(GM1);
    expect(move.status).toBe('failed');
    expect(idsIn(storage)).toEqual(['a', 'b']);
    expect(migratedIn(storage)).toEqual({ owner: GM1, lists: {} });
  });

  it('fails and keeps a list whose row is gone at the read-back, and moves it again next time', async () => {
    const { app, cloud, storage, move, moveSpy } = setup();
    const real = unspied(cloud);
    moveSpy.mockImplementationOnce(async (id, text) => {
      const r = await real(id, text);
      await cloud.lists.apply([{ op: 'remove', id }]);
      return r;
    });
    await app.cloudLists?.load();
    await move.runIfDue(GM1);
    expect(move.status).toBe('failed');
    expect(idsIn(storage)).toEqual(['a']);
    expect(migratedIn(storage)?.['held']).toBeUndefined();
    await move.runIfDue(GM1);
    expect(move.status).toBe('done');
    const last = (await moveSpy.mock.results.at(-1)?.value) as MoveWrite;
    expect(last.ok && last.inserted).toBe(true);
    expect(idsIn(storage)).toEqual([]);
  });

  it('holds a list edited while its move was on its way, with no second row', async () => {
    const { app, cloud, storage, move, moveSpy } = setup();
    const real = unspied(cloud);
    let release = (): void => undefined;
    const gate = new Promise<void>((r) => {
      release = r;
    });
    moveSpy.mockImplementationOnce(async (id, text) => {
      const r = await real(id, text);
      await gate;
      return r;
    });
    await app.cloudLists?.load();
    const running = move.runIfDue(GM1);
    await vi.waitFor(() => {
      expect(moveSpy).toHaveBeenCalledOnce();
    });
    expect(move.status).toBe('moving');
    storage.set(LISTS, JSON.stringify([{ ...A, name: 'Переименован' }, B]));
    release();
    await running;
    expect(idsIn(storage)).toEqual(['a']);
    expect(migratedIn(storage)).toMatchObject({ held: ['a'], notice: ['Лавка в порту'] });
    expect(await rowsOf(cloud)).toHaveLength(5);
  });

  it('fails with nothing removed when the lists key stops parsing during the move', async () => {
    const { app, cloud, storage, move, moveSpy } = setup();
    const real = unspied(cloud);
    moveSpy.mockImplementationOnce(async (id, text) => {
      const r = await real(id, text);
      storage.set(LISTS, '{broken');
      return r;
    });
    await app.cloudLists?.load();
    await move.runIfDue(GM1);
    expect(move.status).toBe('failed');
    expect(storage.get(LISTS)).toBe('{broken');
    expect(migratedIn(storage)).toEqual({ owner: GM1, lists: {} });
  });

  it('asks the notice to name a damaged backup beside the lists, never writing the backup', async () => {
    const { app, storage, move } = setup([A, B], { more: { 'dhloot.lists.v2.bad': '{bad' } });
    await app.cloudLists?.load();
    await move.runIfDue(GM1);
    expect(move.status).toBe('done');
    expect(migratedIn(storage)).toMatchObject({
      bad: true,
      notice: ['Клад дракона', 'Лавка в порту']
    });
    expect(storage.get('dhloot.lists.v2.bad')).toBe('{bad');
  });

  it('names a damaged backup with no list left, claiming the browser with no move', async () => {
    const { app, storage, move, moveSpy } = setup([], {
      more: { 'dhloot.lists.v2.bad': '{bad' }
    });
    await app.cloudLists?.load();
    await move.runIfDue(GM1);
    expect(move.status).toBe('done');
    expect(moveSpy).not.toHaveBeenCalled();
    expect(migratedIn(storage)).toEqual({ owner: GM1, lists: {}, bad: true });
  });

  it('sends a buffered account edit before the first move, and fails offline with no move', async () => {
    const { app, cloud, move, moveSpy } = setup();
    await app.cloudLists?.load();
    const order: string[] = [];
    const apply = cloud.lists.apply.bind(cloud.lists);
    vi.spyOn(cloud.lists, 'apply').mockImplementation((ops) => {
      order.push('apply');
      return apply(ops);
    });
    moveSpy.mockImplementation((id, text) => {
      order.push('move');
      return Promise.resolve<MoveWrite>({ ok: true, id: text ? id : '', inserted: true });
    });
    app.cloudLists?.rename(uuid(101), 'Лавка у моста');
    const offline = setup();
    await offline.app.cloudLists?.load();
    offline.app.cloudLists?.rename(uuid(101), 'Не дойдёт');
    offline.cloud.setOffline(true);
    await offline.move.runIfDue(GM1);
    expect(offline.move.status).toBe('failed');
    expect(offline.moveSpy).not.toHaveBeenCalled();
    offline.app.cloudLists?.clear();
    await move.runIfDue(GM1);
    expect(order.slice(0, 2)).toEqual(['apply', 'move']);
  });

  it('draws the moved lists after the closing read, though an edit was made during the move', async () => {
    const { app, cloud, move, moveSpy } = setup();
    const real = unspied(cloud);
    moveSpy.mockImplementationOnce(async (id, text) => {
      const r = await real(id, text);
      app.cloudLists?.rename(uuid(101), 'Лавка у моста');
      return r;
    });
    await app.cloudLists?.load();
    await move.runIfDue(GM1);
    expect(move.status).toBe('done');
    expect(app.cloudLists?.get(uuid(5000))?.name).toBe('Клад дракона');
    expect(app.cloudLists?.get(uuid(5001))?.name).toBe('Лавка в порту');
    const rows = await rowsOf(cloud);
    expect(rows.find((r) => r.id === uuid(101))?.name).toBe('Лавка у моста');
  });

  it('returns at once while a run is moving', async () => {
    const { app, move, moveSpy } = setup();
    await app.cloudLists?.load();
    const first = move.runIfDue(GM1);
    await move.runIfDue(GM1);
    await first;
    expect(moveSpy).toHaveBeenCalledTimes(2);
  });

  it('forgets its runs on reset, and a run that ends after it leaves the status alone', async () => {
    const { app, move, moveSpy, cloud } = setup();
    const real = unspied(cloud);
    let release = (): void => undefined;
    const gate = new Promise<void>((r) => {
      release = r;
    });
    moveSpy.mockImplementationOnce(async (id, text) => {
      await gate;
      return real(id, text);
    });
    moveSpy.mockResolvedValueOnce({ ok: false, error: 'refused' });
    await app.cloudLists?.load();
    const running = move.runIfDue(GM1);
    await vi.waitFor(() => {
      expect(moveSpy).toHaveBeenCalledOnce();
    });
    move.reset();
    expect([move.status, move.refused, move.foreign, move.due]).toEqual([
      'idle',
      [],
      false,
      false
    ]);
    release();
    await running;
    expect(move.status).toBe('idle');
  });

  it('ends a run that throws as failed, never moving for good', async () => {
    const { app, move, moveSpy } = setup();
    moveSpy.mockRejectedValueOnce(new Error('boom'));
    await app.cloudLists?.load();
    await expect(move.runIfDue(GM1)).rejects.toThrow('boom');
    expect(move.status).toBe('failed');
  });

  it('does nothing in an app with no cloud', async () => {
    const app = new AppState(fakeEnv());
    const move = new LegacyMove(app, () => GM1);
    await move.runIfDue(GM1);
    expect(move.status).toBe('idle');
  });
});
