/* The account list store over the fake cloud: the same writers as the local
 * store, a write buffer sent as one request two seconds after the last edit,
 * a lost network kept and retried, a row deleted elsewhere dropped quietly, a
 * request the database keeps failing halved, and re-reads that redraw only
 * what changed. docs/specs/FEATURES.md, "Account and browser lists". */

import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import type { ImportList } from '../lib/bundle.js';
import { BATCH_BYTES, toCloudList, type CloudList, type ListOp } from '../lib/cloudLists.js';
import { dict } from '../lib/dict.js';
import type { StoredList } from '../lib/lists.js';
import { fakeCloud, type FakeCloudOptions } from '../ports/fake-cloud.js';
import { SEED, uuid } from '../ports/fake-cloud-seed.js';
import { fakeEnv, memoryStorage } from '../ports/index.js';
import type { ListRepository, ListWrites } from '../ports/index.js';
import { COALESCE_MS } from '../lib/live.js';
import { CloudLists, FAULT_LIMIT, QUIET_MS, RETRY_MS } from './cloudLists.svelte.js';
import { ListStore } from './lists.svelte.js';

const t = () => dict('ru');
const said: { msg: string; error?: boolean | undefined }[] = [];
const say = (msg: string, error?: boolean): void => {
  said.push({ msg, error });
};
const REFUSED_TEXT =
  'Изменение не сохранилось: сервер его не принял. Показан список из аккаунта.';

/* Every answer of the fake is already resolved; a flush is a chain of them. */
const settle = async (): Promise<void> => {
  for (let i = 0; i < 40; i++) await Promise.resolve();
};
/* The buffer's quiet window passes, and the flush it starts settles. */
const quiet = async (): Promise<void> => {
  await vi.advanceTimersByTimeAsync(QUIET_MS);
  await settle();
};
const later = async (ms: number): Promise<void> => {
  await vi.advanceTimersByTimeAsync(ms);
  await settle();
};

const SHOP = uuid(101);
const EMPTY = uuid(102);
const TROPHIES = uuid(103);
/* «Лавка кузнеца»'s first entry's row id. */
const CI1_ROW = uuid(1101);

async function loaded(options: FakeCloudOptions = {}, as = 'gm1') {
  const cloud = fakeCloud(SEED, as, options);
  const store = new CloudLists(cloud.lists, say, t);
  await store.load();
  /* The fake's own `apply`, for a test that wraps the spy's answer. */
  const real = cloud.lists.apply.bind(cloud.lists);
  const apply = vi.spyOn(cloud.lists, 'apply');
  return { cloud, store, apply, real };
}

async function serverList(repo: ListRepository, id: string) {
  const read = await repo.list();
  if (!read.ok) throw new Error('the read failed');
  return read.lists.find((l) => l.id === id);
}

/** The writes of each `apply` call, by kind. */
const kinds = (apply: { mock: { calls: [ListOp[]][] } }): string[][] =>
  apply.mock.calls.map(([ops]) => ops.map((o) => o.op));
/** How many writes each `apply` call carried. */
const sizes = (apply: { mock: { calls: [ListOp[]][] } }): number[] =>
  apply.mock.calls.map(([ops]) => ops.length);

type Apply = ListRepository['apply'];

/**
 * Holds the next `apply` call until `release()`; the fake applies it then.
 * `answer` replaces what the fake would answer for that call.
 */
function holdNext(apply: MockInstance<Apply>, real: Apply, answer?: ListWrites) {
  let open: () => void = () => undefined;
  const gate = new Promise<void>((r) => {
    open = r;
  });
  apply.mockImplementationOnce(async (ops) => {
    await gate;
    return answer ?? real(ops);
  });
  return { release: open };
}

/** The local store's shape of an account list. */
const plain = (l: CloudList | undefined): StoredList | undefined => {
  if (!l) return undefined;
  const copy: Partial<CloudList> = { ...l };
  delete copy.updated;
  delete copy.entryIds;
  return copy as StoredList;
};

beforeEach(() => {
  said.length = 0;
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('reading the account', () => {
  it('loads the lists newest edit first, in the local store shape', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const store = new CloudLists(cloud.lists, say, t);
    expect(store.status).toBe('idle');
    const loading = store.load();
    expect(store.status).toBe('loading');
    await loading;
    expect(store.status).toBe('ready');
    expect(store.lists.map((l) => l.name)).toEqual([
      'Пустой список',
      'Лавка кузнеца',
      'Трофеи'
    ]);
    const shop = store.get(SHOP);
    expect(shop?.money).toBe('coin');
    expect(shop?.note).toBe('Открыта с рассвета до заката.');
    expect(shop?.meta?.['ci1']).toEqual({ qty: 2, gold: 150 });
    expect(shop?.meta?.['voa2_a3']).toEqual({ hnote: 'Проклят.' });
    expect(shop?.entryIds['ci1']).toBe(CI1_ROW);
    expect(store.saved).toBe(true);
  });

  it('says error when the first read fails, signed out or offline', async () => {
    const out = new CloudLists(fakeCloud(SEED).lists, say, t);
    await out.load();
    expect(out.status).toBe('error');
    const { store } = await loaded({ offline: true });
    expect(store.status).toBe('error');
  });

  it('keeps the same array and the same lists when a re-read finds nothing new', async () => {
    const { store } = await loaded();
    const drawn = store.lists;
    const shop = store.get(SHOP);
    await store.refresh();
    expect(store.lists).toBe(drawn);
    expect(store.get(SHOP)).toBe(shop);
  });

  it("re-reads another device's edit, redrawing that list alone", async () => {
    const { cloud, store } = await loaded();
    const trophies = store.get(TROPHIES);
    await cloud.lists.apply([{ op: 'update', id: SHOP, patch: { name: 'Лавка у моста' } }]);
    await store.refresh();
    expect(store.lists[0]?.name).toBe('Лавка у моста');
    expect(store.get(TROPHIES)).toBe(trophies);
  });

  it('keeps what is shown when a silent re-read fails', async () => {
    const { cloud, store } = await loaded();
    const drawn = store.lists;
    cloud.setOffline(true);
    await store.refresh();
    expect(store.lists).toBe(drawn);
    expect(store.status).toBe('ready');
  });

  it('re-reads while in error on refresh without a loading flash', async () => {
    const { cloud, store } = await loaded({ offline: true });
    expect(store.status).toBe('error');
    cloud.setOffline(false);
    const reading = store.refresh();
    expect(store.status).toBe('error');
    await reading;
    expect(store.status).toBe('ready');
    expect(store.lists.map((l) => l.name)).toContain('Лавка кузнеца');
  });

  it('keeps error while the network is still gone', async () => {
    const { store } = await loaded({ offline: true });
    await expect(store.refresh()).resolves.toBeUndefined();
    expect(store.status).toBe('error');
    expect(store.lists).toEqual([]);
  });

  it('re-reads nothing before the first load', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const list = vi.spyOn(cloud.lists, 'list');
    const store = new CloudLists(cloud.lists, say, t);
    await store.refresh();
    expect(list).not.toHaveBeenCalled();
  });

  it('refreshes nothing while an edit waits in the buffer', async () => {
    const { cloud, store } = await loaded();
    const list = vi.spyOn(cloud.lists, 'list');
    store.rename(SHOP, 'Новое');
    await store.refresh();
    expect(list).not.toHaveBeenCalled();
  });

  it('drops a read that overlapped an edit, and reads again once the edit is in', async () => {
    const { cloud, store } = await loaded();
    const list = vi.spyOn(cloud.lists, 'list');
    const pending = store.refresh();
    store.rename(SHOP, 'Новое');
    await pending;
    await quiet();
    expect(list).toHaveBeenCalledTimes(2);
    expect(store.get(SHOP)?.name).toBe('Новое');
    expect((await serverList(cloud.lists, SHOP))?.name).toBe('Новое');
  });

  it('keeps a list made while the first read was in flight', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const store = new CloudLists(cloud.lists, say, t);
    const loading = store.load();
    store.create('Пока грузится');
    await loading;
    await quiet();
    expect(store.status).toBe('ready');
    expect(store.lists.map((l) => l.name)).toEqual(['Пока грузится', 'Список второго ГМа']);
  });

  it('forgets everything on clear, the buffered writes too', async () => {
    const { cloud, store } = await loaded();
    cloud.setOffline(true);
    store.rename(SHOP, 'Не дойдёт');
    await quiet();
    expect(store.sync).toBe('failed');
    store.clear();
    expect(store.status).toBe('idle');
    expect(store.lists).toEqual([]);
    expect(store.sync).toBe('saved');
    cloud.setOffline(false);
    store.retry();
    await later(RETRY_MS);
    expect((await serverList(cloud.lists, SHOP))?.name).toBe('Лавка кузнеца');
  });

  it('drops the buffer and its timer on clear', async () => {
    const { store, apply } = await loaded();
    store.rename(SHOP, 'Не уйдёт');
    store.clear();
    await quiet();
    expect(apply).not.toHaveBeenCalled();
  });

  it('drops an answer that arrives after clear', async () => {
    const { store, apply, real } = await loaded();
    const held = holdNext(apply, real, { ok: true, results: [{ ok: true }] });
    store.rename(SHOP, 'x');
    await quiet();
    store.clear();
    held.release();
    await settle();
    expect(store.sync).toBe('saved');
    const read = store.load();
    store.clear();
    await read;
    expect(store.status).toBe('idle');
  });
});

describe('the writers', () => {
  it("change a list the way the local store's writers change it", async () => {
    const { cloud, store } = await loaded();
    const local = new ListStore(fakeEnv({ storage: memoryStorage() }), say, t);
    local.lists = [plain(store.get(SHOP)) as StoredList];
    const knows = (id: string): boolean => id !== 'ghost';
    const steps: [string, (s: CloudLists | ListStore) => unknown][] = [
      [
        'rename',
        (s) => {
          s.rename(SHOP, '  Лавка  ');
        }
      ],
      [
        'qty',
        (s) => {
          s.setMeta(SHOP, 'q1', 'qty', 3);
        }
      ],
      [
        'no price',
        (s) => {
          s.setMeta(SHOP, 'ci1', 'gold', 0);
        }
      ],
      [
        'note',
        (s) => {
          s.setMeta(SHOP, 'q313', 'note', 'Пыльный');
        }
      ],
      [
        'no hnote',
        (s) => {
          s.setMeta(SHOP, 'voa2_a3', 'hnote', '');
        }
      ],
      [
        'list note',
        (s) => {
          s.setNote(SHOP, 'note', '  Закрыто  ');
        }
      ],
      [
        'no gm note',
        (s) => {
          s.setNote(SHOP, 'hnote', '');
        }
      ],
      [
        'money',
        (s) => {
          s.setMoney(SHOP, 'bag');
        }
      ],
      ['move', (s) => s.move(SHOP, 'di11', 0)],
      ['still', (s) => s.move(SHOP, 'di11', 0)],
      [
        'remove',
        (s) => {
          s.removeEntry(SHOP, 'q1');
        }
      ],
      [
        'restore',
        (s) => {
          s.restoreEntry(SHOP, 'q1', 1, { note: 'Вернули' });
        }
      ],
      [
        'again',
        (s) => {
          s.restoreEntry(SHOP, 'q1', 1, { note: 'Вернули' });
        }
      ],
      [
        'remove last',
        (s) => {
          s.removeEntry(SHOP, 'q35');
        }
      ],
      [
        'restore last',
        (s) => {
          s.restoreEntry(SHOP, 'q35', 99, {});
        }
      ],
      ['add', (s) => s.add(SHOP, ['q2', 'ci1', 'ghost'], knows, { q2: { qty: 4, hnote: 'h' } })]
    ];
    for (const [name, run] of steps) {
      expect(run(store), name).toEqual(run(local));
      expect(plain(store.get(SHOP)), name).toEqual(local.get(SHOP));
    }
    await quiet();
    expect(store.sync).toBe('saved');
    const row = await serverList(cloud.lists, SHOP);
    const got = row && toCloudList(row);
    expect(got?.ids).toEqual(local.get(SHOP)?.ids);
    expect(got?.name).toBe('  Лавка  ');
    expect(got?.note).toBe('Закрыто');
    expect(got?.hnote).toBeUndefined();
    expect(got?.money).toBeUndefined();
    expect(got?.meta?.['q1']).toEqual({ note: 'Вернули' });
    expect(got?.meta?.['q2']).toEqual({ qty: 4 });
    expect(got?.meta?.['ci1']).toEqual({ qty: 2 });
    expect(row?.list_entries.map((e) => e.position)).toEqual(
      row?.list_entries.map((_, i) => i)
    );
  });

  it('does nothing for a list or an entry it does not hold', async () => {
    const { store, apply } = await loaded();
    const drawn = store.lists;
    store.rename('nope', 'x');
    store.setNote('nope', 'note', 'x');
    store.setMoney('nope', 'coin');
    store.setMeta(SHOP, 'ghost', 'qty', 2);
    store.removeEntry(SHOP, 'ghost');
    store.restoreEntry('nope', 'q1', 0, {});
    expect(store.move('nope', 'q1', 0)).toBe(false);
    expect(store.add('nope', ['q1'], () => true)).toEqual([]);
    expect(store.add(SHOP, ['ci1'], () => true)).toEqual([]);
    expect(store.lists).toBe(drawn);
    await quiet();
    expect(apply).not.toHaveBeenCalled();
    expect(store.sync).toBe('saved');
  });

  it('puts the edited list first and keeps the other lists as they were', async () => {
    const { store } = await loaded();
    const [empty, , trophies] = store.lists;
    store.rename(SHOP, 'Лавка!');
    expect(store.lists.map((l) => l.id)).toEqual([SHOP, EMPTY, TROPHIES]);
    expect(store.lists[1]).toBe(empty);
    expect(store.lists[2]).toBe(trophies);
  });

  it('creates a list first, with its entries, its name trimmed or untitled', async () => {
    const { cloud, store } = await loaded({}, 'gm2');
    const l = store.create('  Клад  ', {
      ids: ['ci1', 'q1'],
      meta: { ci1: { qty: 2, gold: 5, note: 'n', hnote: 'h' } },
      money: 'coin',
      note: 'p',
      hnote: 'g'
    });
    expect(l.id).toBe(uuid(5000));
    expect(store.lists[0]).toBe(l);
    expect(store.create('   ').name).toBe('Без названия');
    await quiet();
    const row = await serverList(cloud.lists, l.id);
    expect(row).toMatchObject({
      name: 'Клад',
      money_mode: 'coin',
      player_note: 'p',
      gm_note: 'g'
    });
    expect(
      row?.list_entries.map((e) => [e.item_key, e.quantity, e.price_coins, e.gm_note])
    ).toEqual([
      ['ci1', 2, 5, 'h'],
      ['q1', 1, null, '']
    ]);
  });

  it('cuts a name to 200 characters and a note to 4000, counting code points', async () => {
    const { cloud, store } = await loaded();
    /* A character outside the BMP: two UTF-16 units, one character to the database. */
    const long = (n: number): string => '\u{1F5E1}'.repeat(n);
    const l = store.create(long(250), {
      ids: ['ci1'],
      meta: { ci1: { note: long(4100), hnote: long(4100) } },
      note: long(4100),
      hnote: long(4100)
    });
    store.rename(SHOP, long(201));
    store.setNote(SHOP, 'note', long(4001));
    store.setNote(SHOP, 'hnote', long(4001));
    store.setMeta(SHOP, 'ci1', 'note', long(4001));
    store.setMeta(SHOP, 'ci1', 'hnote', long(4001));
    const chars = (s: string | undefined): number => Array.from(s ?? '').length;
    expect([l.name, l.note, l.hnote].map(chars)).toEqual([200, 4000, 4000]);
    const shop = store.get(SHOP);
    expect([shop?.name, shop?.note, shop?.hnote, shop?.meta?.['ci1']?.note].map(chars)).toEqual(
      [200, 4000, 4000, 4000]
    );
    await quiet();
    const made = await serverList(cloud.lists, l.id);
    const row = await serverList(cloud.lists, SHOP);
    const ci1 = row?.list_entries.find((e) => e.item_key === 'ci1');
    expect(
      [
        made?.name,
        made?.player_note,
        made?.gm_note,
        made?.list_entries[0]?.player_note,
        made?.list_entries[0]?.gm_note,
        row?.name,
        row?.player_note,
        row?.gm_note,
        ci1?.player_note,
        ci1?.gm_note
      ].map(chars)
    ).toEqual([200, 4000, 4000, 4000, 4000, 200, 4000, 4000, 4000, 4000]);
  });

  it('removes a list for good', async () => {
    const { cloud, store } = await loaded();
    store.remove(TROPHIES);
    expect(store.get(TROPHIES)).toBeUndefined();
    await quiet();
    expect(await serverList(cloud.lists, TROPHIES)).toBeUndefined();
    await store.refresh();
    expect(store.get(TROPHIES)).toBeUndefined();
  });
});

describe('the write buffer', () => {
  it('sends nothing until two seconds after the last edit', async () => {
    const { store, apply } = await loaded();
    store.rename(SHOP, 'Новое');
    expect(store.sync).toBe('saving');
    await later(QUIET_MS - 1);
    expect(apply).not.toHaveBeenCalled();
    expect(store.sync).toBe('saving');
    await later(1);
    expect(apply).toHaveBeenCalledOnce();
    expect(store.sync).toBe('saved');
  });

  it('restarts the wait on every edit', async () => {
    const { store, apply } = await loaded();
    store.rename(SHOP, 'a');
    await later(1500);
    store.setNote(SHOP, 'note', 'n');
    await later(500);
    expect(apply).not.toHaveBeenCalled();
    await later(1500);
    expect(apply.mock.calls).toEqual([
      [
        [
          { op: 'update', id: SHOP, patch: { name: 'a' } },
          { op: 'update', id: SHOP, patch: { player_note: 'n' } }
        ]
      ]
    ]);
  });

  it('sends ten presses of one quantity as one write with the last value', async () => {
    const { cloud, store, apply } = await loaded();
    for (let n = 3; n <= 12; n++) store.setMeta(SHOP, 'ci1', 'qty', n);
    await quiet();
    expect(apply.mock.calls).toEqual([
      [[{ op: 'update_entry', id: CI1_ROW, patch: { quantity: 12 } }]]
    ]);
    const row = await serverList(cloud.lists, SHOP);
    expect(row?.list_entries.find((e) => e.id === CI1_ROW)?.quantity).toBe(12);
  });

  it('sends a typed name once, after the writes before it', async () => {
    const { cloud, store, apply } = await loaded();
    store.rename(SHOP, 'a');
    store.rename(SHOP, 'ab');
    store.rename(SHOP, 'abc');
    store.setMoney(SHOP, 'bag');
    await quiet();
    expect(
      apply.mock.calls.map(([ops]) => ops.map((o) => (o.op === 'update' ? o.patch : o)))
    ).toEqual([[{ name: 'abc' }, { money_mode: 'bag' }]]);
    expect(await serverList(cloud.lists, SHOP)).toMatchObject({
      name: 'abc',
      money_mode: 'bag'
    });
  });

  it("keeps a list's create before its entries' edits", async () => {
    const { store, apply } = await loaded({}, 'gm2');
    const l = store.create('Клад');
    store.add(l.id, ['ci1', 'q1'], () => true);
    store.setMeta(l.id, 'ci1', 'qty', 3);
    store.setNote(l.id, 'note', 'n');
    store.move(l.id, 'q1', 0);
    await quiet();
    expect(kinds(apply)).toEqual([['create', 'add', 'update_entry', 'update', 'reorder']]);
    expect(store.sync).toBe('saved');
    expect(said).toEqual([]);
  });

  it('keeps an edit made during a flush for its own quiet window', async () => {
    const { store, apply, real } = await loaded();
    const held = holdNext(apply, real);
    store.rename(SHOP, 'a');
    await quiet();
    store.setNote(SHOP, 'note', 'n');
    held.release();
    await settle();
    expect(kinds(apply)).toEqual([['update']]);
    expect(store.sync).toBe('saving');
    await later(QUIET_MS - 1);
    expect(apply).toHaveBeenCalledOnce();
    await later(1);
    expect(apply.mock.calls[1]).toEqual([
      [{ op: 'update', id: SHOP, patch: { player_note: 'n' } }]
    ]);
    expect(store.sync).toBe('saved');
  });

  it('never merges an edit into the request in flight', async () => {
    const { cloud, store, apply, real } = await loaded();
    const held = holdNext(apply, real);
    store.rename(SHOP, 'a');
    await quiet();
    store.rename(SHOP, 'ab');
    held.release();
    await quiet();
    expect(apply.mock.calls).toEqual([
      [[{ op: 'update', id: SHOP, patch: { name: 'a' } }]],
      [[{ op: 'update', id: SHOP, patch: { name: 'ab' } }]]
    ]);
    expect((await serverList(cloud.lists, SHOP))?.name).toBe('ab');
  });

  it('splits a buffer over 60 000 bytes into requests sent one after another, in order', async () => {
    const { cloud, store, apply, real } = await loaded({}, 'gm2');
    const keys = Array.from({ length: 20 }, (_, i) => 'k' + String(i));
    const l = store.create('Длинные заметки', { ids: keys });
    for (const k of keys) store.setMeta(l.id, k, 'note', 'я'.repeat(4000));
    let flying = 0;
    let most = 0;
    apply.mockImplementation(async (ops) => {
      most = Math.max(most, ++flying);
      await Promise.resolve();
      const r = await real(ops);
      flying--;
      return r;
    });
    await quiet();
    expect(apply.mock.calls.length).toBeGreaterThan(2);
    expect(most).toBe(1);
    for (const [ops] of apply.mock.calls) {
      /* `batchSize` counts each write and a comma; the array adds one bracket more. */
      expect(new TextEncoder().encode(JSON.stringify(ops)).length).toBeLessThanOrEqual(
        BATCH_BYTES + 1
      );
    }
    const sent = apply.mock.calls.flatMap(([ops]) => ops);
    expect(sent.map((o) => o.op)).toEqual(['create', ...keys.map(() => 'update_entry')]);
    const row = await serverList(cloud.lists, l.id);
    expect(row?.list_entries.every((e) => e.player_note.length === 4000)).toBe(true);
    expect(store.sync).toBe('saved');
  });

  it('keeps the whole request on a network failure and sends it again with the edits made since, in one request', async () => {
    const { cloud, store, apply } = await loaded();
    cloud.setOffline(true);
    store.rename(SHOP, 'a');
    store.setMoney(SHOP, 'bag');
    await quiet();
    expect(store.sync).toBe('failed');
    store.setNote(SHOP, 'note', 'n');
    cloud.setOffline(false);
    await quiet();
    expect(sizes(apply)).toEqual([2, 3]);
    expect(store.sync).toBe('saved');
    expect(await serverList(cloud.lists, SHOP)).toMatchObject({
      name: 'a',
      money_mode: 'bag',
      player_note: 'n'
    });
  });

  it('keeps «Не сохранено» for an edit while not saved, and retries after the quiet window', async () => {
    const { cloud, store, apply } = await loaded();
    cloud.setOffline(true);
    store.rename(SHOP, 'a');
    await quiet();
    cloud.setOffline(false);
    store.rename(SHOP, 'ab');
    expect(store.sync).toBe('failed');
    await later(QUIET_MS - 1);
    expect(store.sync).toBe('failed');
    await later(1);
    expect(store.sync).toBe('saved');
    expect(apply.mock.calls.map(([ops]) => ops)).toEqual([
      [{ op: 'update', id: SHOP, patch: { name: 'a' } }],
      [{ op: 'update', id: SHOP, patch: { name: 'ab' } }]
    ]);
  });

  it('flushNow sends at once and says whether the buffer emptied', async () => {
    const { cloud, store, apply, real } = await loaded({ limits: { entries: 9 } });
    store.rename(SHOP, 'a');
    expect(await store.flushNow()).toBe(true);
    expect(apply).toHaveBeenCalledOnce();

    cloud.setOffline(true);
    store.rename(SHOP, 'b');
    expect(await store.flushNow()).toBe(false);
    expect(store.sync).toBe('failed');
    cloud.setOffline(false);
    expect(await store.flushNow()).toBe(true);

    /* During a running flush it waits, then sends what came after. */
    const held = holdNext(apply, real);
    store.rename(SHOP, 'c');
    await quiet();
    store.setNote(SHOP, 'note', 'd');
    const flushed = store.flushNow();
    held.release();
    expect(await flushed).toBe(true);
    expect(apply.mock.calls.slice(-2).map(([ops]) => ops.length)).toEqual([1, 1]);

    /* A refused write counts as gone. */
    store.add(SHOP, ['q2'], () => true);
    expect(await store.flushNow()).toBe(true);
    expect(said).toHaveLength(1);
    expect(await store.flushNow()).toBe(true);
  });
});

describe('a lost network', () => {
  it('keeps the edit, says not saved, retries every 15 s, and saves when the network is back', async () => {
    const { cloud, store } = await loaded();
    cloud.setOffline(true);
    store.rename(SHOP, 'Офлайн');
    expect(store.sync).toBe('saving');
    await quiet();
    expect(store.sync).toBe('failed');
    expect(store.saved).toBe(false);
    expect(store.get(SHOP)?.name).toBe('Офлайн');
    await later(RETRY_MS);
    expect(store.sync).toBe('failed');
    cloud.setOffline(false);
    await later(RETRY_MS);
    expect(store.sync).toBe('saved');
    expect((await serverList(cloud.lists, SHOP))?.name).toBe('Офлайн');
  });

  it('sends at once on retry, and on refresh while a write waits', async () => {
    const { cloud, store } = await loaded();
    cloud.setOffline(true);
    store.rename(SHOP, 'Раз');
    await quiet();
    cloud.setOffline(false);
    store.retry();
    await settle();
    expect(store.sync).toBe('saved');
    cloud.setOffline(true);
    store.rename(SHOP, 'Два');
    await quiet();
    cloud.setOffline(false);
    await store.refresh();
    await settle();
    expect(store.sync).toBe('saved');
    expect((await serverList(cloud.lists, SHOP))?.name).toBe('Два');
  });

  it('replaces a waiting edit of the same field with the newer one', async () => {
    const { cloud, store, apply } = await loaded();
    cloud.setOffline(true);
    store.rename(SHOP, 'a');
    await quiet();
    store.rename(SHOP, 'ab');
    cloud.setOffline(false);
    store.retry();
    await settle();
    expect(apply.mock.calls.map(([ops]) => ops)).toEqual([
      [{ op: 'update', id: SHOP, patch: { name: 'a' } }],
      [{ op: 'update', id: SHOP, patch: { name: 'ab' } }]
    ]);
  });
});

describe('a refused write', () => {
  it('says the entry limit with its number and re-reads the list', async () => {
    const { store } = await loaded({ limits: { entries: 9 } });
    expect(store.add(SHOP, ['q2'], () => true)).toEqual(['q2']);
    expect(store.get(SHOP)?.ids).toContain('q2');
    await quiet();
    expect(said).toEqual([
      {
        msg: 'Достигнут предел позиций в списке: 9. Нужно больше - напишите на daggerheart.loot@gmail.com.',
        error: true
      }
    ]);
    expect(store.get(SHOP)?.ids).not.toContain('q2');
    expect(store.sync).toBe('saved');
  });

  it('says the entry limit alone when an add is refused', async () => {
    const { store } = await loaded({ limits: { entries: 9 } });
    store.restoreEntry(SHOP, 'q2', 0, {});
    await quiet();
    expect(said).toEqual([
      {
        msg: 'Достигнут предел позиций в списке: 9. Нужно больше - напишите на daggerheart.loot@gmail.com.',
        error: true
      }
    ]);
    expect(store.get(SHOP)?.ids).not.toContain('q2');
  });

  it("applies a reorder that misses another device's new entry with no toast, that entry after the given ones", async () => {
    const { cloud, store, real } = await loaded();
    await real([
      {
        op: 'add',
        list_id: SHOP,
        entries: [
          {
            id: uuid(9001),
            item_key: 'q2',
            source: 'official',
            snapshot: null,
            position: 9,
            quantity: 1,
            price_coins: null,
            player_note: '',
            gm_note: ''
          }
        ]
      }
    ]);
    store.move(SHOP, 'di11', 0);
    await quiet();
    expect(said).toEqual([]);
    expect((await serverList(cloud.lists, SHOP))?.list_entries.map((e) => e.item_key)).toEqual([
      'di11',
      'ci1',
      'q1',
      'q313',
      'cc1',
      'voa2_a3',
      'q23',
      'w51',
      'q35',
      'q2'
    ]);
  });

  it('drops only a refused write, toasts once and re-reads', async () => {
    const { cloud, store } = await loaded({ limits: { entries: 9 } });
    store.rename(SHOP, 'Лавка у моста');
    store.add(SHOP, ['q2'], () => true);
    store.setNote(SHOP, 'note', 'Закрыто');
    await quiet();
    expect(said.map((s) => s.msg)).toEqual([
      'Достигнут предел позиций в списке: 9. Нужно больше - напишите на daggerheart.loot@gmail.com.'
    ]);
    expect(await serverList(cloud.lists, SHOP)).toMatchObject({
      name: 'Лавка у моста',
      player_note: 'Закрыто'
    });
    expect(store.get(SHOP)?.ids).not.toContain('q2');
    expect(store.get(SHOP)?.name).toBe('Лавка у моста');
  });

  it('says the list limit once, and drops the new list with the writes sent beside it', async () => {
    const { store } = await loaded({ limits: { lists: 3 } });
    const l = store.create('Четвёртый');
    store.add(l.id, ['ci1'], () => true);
    await quiet();
    expect(said.map((s) => s.msg)).toEqual([
      'Достигнут предел списков в аккаунте: 3. Нужно больше - напишите на daggerheart.loot@gmail.com.'
    ]);
    expect(store.get(l.id)).toBeUndefined();
  });

  it("drops a refused create with the list's writes still in the buffer", async () => {
    const { store, apply, real } = await loaded({ limits: { lists: 3 } });
    const held = holdNext(apply, real);
    const l = store.create('Четвёртый');
    await quiet();
    store.add(l.id, ['ci1'], () => true);
    store.rename(SHOP, 'Лавка у моста');
    held.release();
    await quiet();
    expect(kinds(apply)).toEqual([['create'], ['update']]);
    expect(said).toHaveLength(1);
    expect(store.get(l.id)).toBeUndefined();
  });

  it('says a refusal and shows the list from the account again', async () => {
    const { store, apply } = await loaded();
    apply.mockResolvedValueOnce({ ok: true, results: [{ ok: false, error: 'refused' }] });
    store.rename(SHOP, 'Не примут');
    await quiet();
    expect(said).toEqual([{ msg: REFUSED_TEXT, error: true }]);
    expect(store.get(SHOP)?.name).toBe('Лавка кузнеца');
  });

  it('drops what a request refused whole sent, toasts once and re-reads', async () => {
    const { cloud, store, apply } = await loaded();
    apply.mockResolvedValueOnce({ ok: false, error: 'refused' });
    store.rename(SHOP, 'Не примут');
    store.setNote(SHOP, 'note', 'Тоже');
    await quiet();
    expect(said).toEqual([{ msg: REFUSED_TEXT, error: true }]);
    expect(store.get(SHOP)?.name).toBe('Лавка кузнеца');
    expect(store.sync).toBe('saved');
    expect((await serverList(cloud.lists, SHOP))?.name).toBe('Лавка кузнеца');
  });
});

describe('a row deleted elsewhere', () => {
  /* Through the fake's own `apply`, so the spy counts only the store's calls. */
  const removedOnTheServer = async (real: Apply, op: ListOp): Promise<void> => {
    await real([op]);
  };

  it('drops an edit to a list deleted elsewhere with no toast and re-reads', async () => {
    const { store, real } = await loaded();
    await removedOnTheServer(real, { op: 'remove', id: SHOP });
    store.rename(SHOP, 'Уже нет');
    await quiet();
    expect(said).toEqual([]);
    expect(store.sync).toBe('saved');
    expect(store.get(SHOP)).toBeUndefined();
  });

  it("drops the gone list's other buffered writes", async () => {
    const { store, apply, real } = await loaded();
    await removedOnTheServer(real, { op: 'remove', id: SHOP });
    const held = holdNext(apply, real);
    store.rename(SHOP, 'Уже нет');
    await quiet();
    store.setNote(SHOP, 'note', 'n');
    store.setMeta(SHOP, 'ci1', 'qty', 5);
    held.release();
    await quiet();
    await later(RETRY_MS);
    expect(kinds(apply)).toEqual([['update']]);
    expect(said).toEqual([]);
    expect(store.sync).toBe('saved');
  });

  it("drops only a gone entry's writes and keeps the list's", async () => {
    const { cloud, store, apply, real } = await loaded();
    await removedOnTheServer(real, { op: 'remove_entries', ids: [CI1_ROW] });
    const held = holdNext(apply, real);
    store.setMeta(SHOP, 'ci1', 'qty', 5);
    store.rename(SHOP, 'Лавка у моста');
    await quiet();
    store.setMeta(SHOP, 'ci1', 'qty', 6);
    held.release();
    await quiet();
    expect(kinds(apply)).toEqual([['update_entry', 'update']]);
    expect(said).toEqual([]);
    expect((await serverList(cloud.lists, SHOP))?.name).toBe('Лавка у моста');
    expect(store.get(SHOP)?.ids).not.toContain('ci1');
  });

  it('reads a later refusal of a gone list as gone', async () => {
    const { store, apply } = await loaded();
    apply.mockResolvedValueOnce({
      ok: true,
      results: [
        { ok: false, error: 'gone' },
        { ok: false, error: 'refused' }
      ]
    });
    store.rename(SHOP, 'Уже нет');
    store.move(SHOP, 'di11', 0);
    await quiet();
    expect(kinds(apply)[0]).toEqual(['update', 'reorder']);
    expect(said).toEqual([]);
  });

  it('drops an add into a list deleted elsewhere with no toast', async () => {
    const { store, real } = await loaded();
    await removedOnTheServer(real, { op: 'remove', id: SHOP });
    store.add(SHOP, ['q2'], () => true);
    await quiet();
    expect(said).toEqual([]);
    expect(store.get(SHOP)).toBeUndefined();
  });

  it("keeps the list's rename when a replayed request answers a false gone", async () => {
    const { cloud, store, apply, real } = await loaded();
    store.setMeta(SHOP, 'di11', 'qty', 5);
    store.removeEntry(SHOP, 'di11');
    apply.mockResolvedValueOnce({ ok: false, error: 'network' });
    await quiet();
    expect(store.sync).toBe('failed');
    const held = holdNext(apply, real, {
      ok: true,
      results: [{ ok: false, error: 'gone' }, { ok: true }]
    });
    store.retry();
    await settle();
    store.rename(SHOP, 'Лавка у моста');
    held.release();
    await quiet();
    expect(kinds(apply)).toEqual([
      ['update_entry', 'remove_entries'],
      ['update_entry', 'remove_entries'],
      ['update']
    ]);
    expect((await serverList(cloud.lists, SHOP))?.name).toBe('Лавка у моста');
    expect(said).toEqual([]);
    expect(store.sync).toBe('saved');
  });
});

describe('a request the database keeps failing', () => {
  /* Four writes to four fields of «Лавка кузнеца»; the rename is the last. */
  const four = (store: CloudLists, name = 'bad'): void => {
    store.setNote(SHOP, 'note', 'a');
    store.setNote(SHOP, 'hnote', 'b');
    store.setMoney(SHOP, 'bag');
    store.rename(SHOP, name);
  };
  const isBad = (op: ListOp): boolean => op.op === 'update' && op.patch.name === 'bad';

  it('is FAULT_LIMIT, 3', () => {
    expect(FAULT_LIMIT).toBe(3);
  });

  it('treats a fault as a lost network twice', async () => {
    const { cloud, store, apply } = await loaded();
    cloud.setFault(true);
    four(store);
    await quiet();
    expect(store.sync).toBe('failed');
    await later(RETRY_MS - 1);
    expect(apply).toHaveBeenCalledOnce();
    await later(1);
    expect(sizes(apply)).toEqual([4, 4]);
    expect(store.sync).toBe('failed');
    expect(said).toEqual([]);
  });

  it('splits the request in half after the third fault', async () => {
    const { cloud, store, apply } = await loaded();
    cloud.setFault(isBad);
    four(store);
    await quiet();
    await later(RETRY_MS);
    expect(sizes(apply)).toEqual([4, 4]);
    await later(RETRY_MS);
    /* The third fault: the first half goes at once and lands, then the
       second half faults. */
    expect(sizes(apply)).toEqual([4, 4, 4, 2, 2]);
    await later(RETRY_MS);
    await later(RETRY_MS);
    expect(sizes(apply)).toEqual([4, 4, 4, 2, 2, 2, 2, 1, 1]);
    await later(RETRY_MS);
    expect(said).toEqual([]);
    await later(RETRY_MS);
    expect(sizes(apply)).toEqual([4, 4, 4, 2, 2, 2, 2, 1, 1, 1, 1]);
    expect(said).toEqual([{ msg: REFUSED_TEXT, error: true }]);
    expect(store.sync).toBe('saved');
    const row = await serverList(cloud.lists, SHOP);
    expect(row).toMatchObject({
      name: 'Лавка кузнеца',
      player_note: 'a',
      gm_note: 'b',
      money_mode: 'bag'
    });
    expect(store.get(SHOP)?.name).toBe('Лавка кузнеца');
  });

  it('drops a single write the database keeps failing', async () => {
    const { cloud, store, apply } = await loaded();
    cloud.setFault(true);
    store.rename(SHOP, 'bad');
    await quiet();
    await later(RETRY_MS);
    await later(RETRY_MS);
    expect(sizes(apply)).toEqual([1, 1, 1]);
    expect(said).toEqual([{ msg: REFUSED_TEXT, error: true }]);
    expect(store.sync).toBe('saved');
    await later(RETRY_MS);
    expect(apply).toHaveBeenCalledTimes(3);
  });

  it("takes a dropped create's buffered writes with it", async () => {
    const { cloud, store, apply } = await loaded({}, 'gm2');
    cloud.setFault((op) => op.op === 'create');
    const l = store.create('Клад');
    store.rename(l.id, 'Клад дракона');
    await quiet();
    await later(RETRY_MS);
    await later(RETRY_MS);
    await later(RETRY_MS);
    await later(RETRY_MS);
    expect(sizes(apply)).toEqual([2, 2, 2, 1, 1, 1]);
    await later(RETRY_MS);
    expect(apply).toHaveBeenCalledTimes(6);
    expect(said).toHaveLength(1);
    expect(store.get(l.id)).toBeUndefined();
  });

  it('neither counts nor resets on a network answer between faults', async () => {
    const { cloud, store, apply } = await loaded();
    cloud.setFault(true);
    four(store);
    await quiet();
    await later(RETRY_MS);
    cloud.setOffline(true);
    await later(RETRY_MS);
    cloud.setOffline(false);
    await later(RETRY_MS);
    /* Counted at 2 s and 17 s; offline at 32 s; the third counted at 47 s. */
    expect(sizes(apply)).toEqual([4, 4, 4, 4, 2]);
  });

  it('resets the count on an answer with results', async () => {
    const { cloud, store, apply } = await loaded();
    cloud.setFault(true);
    four(store, 'x');
    await quiet();
    await later(RETRY_MS);
    cloud.setFault(false);
    await later(RETRY_MS);
    expect(store.sync).toBe('saved');
    cloud.setFault(true);
    four(store, 'y');
    await quiet();
    await later(RETRY_MS);
    expect(sizes(apply)).toEqual([4, 4, 4, 4, 4]);
  });

  it('resets the count on a request refused whole', async () => {
    const { cloud, store, apply } = await loaded();
    cloud.setFault(true);
    four(store, 'x');
    await quiet();
    await later(RETRY_MS);
    apply.mockResolvedValueOnce({ ok: false, error: 'refused' });
    await later(RETRY_MS);
    expect(said).toHaveLength(1);
    four(store, 'y');
    await quiet();
    await later(RETRY_MS);
    expect(sizes(apply)).toEqual([4, 4, 4, 4, 4]);
  });

  it('ends the cap with the buffer', async () => {
    const { cloud, store, apply } = await loaded();
    cloud.setFault(isBad);
    store.setNote(SHOP, 'note', 'a');
    store.rename(SHOP, 'bad');
    await quiet();
    for (let i = 0; i < 5; i++) await later(RETRY_MS);
    expect(sizes(apply)).toEqual([2, 2, 2, 1, 1, 1, 1]);
    expect(store.sync).toBe('saved');
    store.setNote(SHOP, 'note', 'b');
    store.setNote(SHOP, 'hnote', 'c');
    store.setMoney(SHOP, 'bag');
    await quiet();
    expect(sizes(apply).slice(-1)).toEqual([3]);
  });

  it('ends the count and the cap on clear', async () => {
    const { cloud, store, apply } = await loaded();
    cloud.setFault(isBad);
    store.setNote(SHOP, 'note', 'a');
    store.rename(SHOP, 'bad');
    await quiet();
    await later(RETRY_MS);
    await later(RETRY_MS);
    /* Split: the note landed, the rename faulted once more, counted. */
    expect(sizes(apply)).toEqual([2, 2, 2, 1, 1]);
    store.clear();
    await store.load();
    cloud.setFault(true);
    store.setNote(SHOP, 'note', 'x');
    store.setMoney(SHOP, 'coin');
    await quiet();
    await later(RETRY_MS);
    await later(RETRY_MS);
    expect(sizes(apply).slice(5)).toEqual([2, 2, 2, 1]);
  });

  it('counts at most one fault per RETRY_MS', async () => {
    const { cloud, store, apply } = await loaded();
    cloud.setFault(true);
    store.setNote(SHOP, 'note', 'a');
    store.rename(SHOP, 'b');
    await quiet();
    /* 0: the first fault, counted. */
    await later(100);
    store.retry();
    await settle();
    await later(9_900);
    store.retry();
    await settle();
    /* 100 ms and 10 s: not counted; the timer is re-armed from 10 s. */
    expect(sizes(apply)).toEqual([2, 2, 2]);
    expect(store.sync).toBe('failed');
    await later(RETRY_MS);
    /* 25 s: the second counted fault. */
    expect(sizes(apply)).toEqual([2, 2, 2, 2]);
    await later(100);
    store.retry();
    await settle();
    /* 25.1 s: not counted. */
    expect(sizes(apply)).toEqual([2, 2, 2, 2, 2]);
    await later(RETRY_MS - 1);
    expect(sizes(apply)).toEqual([2, 2, 2, 2, 2]);
    await later(1);
    /* 40.1 s: the third counted fault, and the split. */
    expect(sizes(apply)).toEqual([2, 2, 2, 2, 2, 2, 1]);
  });

  it('counts a fault after a long quiet', async () => {
    const { cloud, store, apply } = await loaded();
    cloud.setFault(true);
    store.rename(SHOP, 'a');
    await quiet();
    cloud.setFault(false);
    await later(RETRY_MS);
    expect(store.sync).toBe('saved');
    await later(45_000);
    cloud.setFault(true);
    store.setNote(SHOP, 'note', 'b');
    store.setMoney(SHOP, 'bag');
    await quiet();
    await later(RETRY_MS);
    await later(RETRY_MS);
    expect(sizes(apply)).toEqual([1, 1, 2, 2, 2, 1]);
  });
});

describe('the owner topic', () => {
  /* A store that watches gm1's topic over the fake, with its handlers kept so a
     test can send a message the fake would not. */
  async function watching() {
    const cloud = fakeCloud(SEED, 'gm1');
    const handlers: { message(event: string, payload: unknown): void }[] = [];
    const events = {
      tab: cloud.events.tab,
      subscribe: (topic: string, on: Parameters<typeof cloud.events.subscribe>[1]) => {
        handlers.push(on);
        return cloud.events.subscribe(topic, on);
      }
    };
    const store = new CloudLists(cloud.lists, say, t, { events, random: () => 0.5 });
    await store.load();
    store.watch(SEED.users.gm1.id);
    await later(COALESCE_MS);
    const real = cloud.lists.apply.bind(cloud.lists);
    const apply = vi.spyOn(cloud.lists, 'apply');
    const list = vi.spyOn(cloud.lists, 'list');
    return { cloud, store, apply, real, list, handlers };
  }

  it('joins, and reads nothing for its own write', async () => {
    const { store, list } = await watching();
    expect(store.live).toBe(true);
    store.rename(SHOP, 'Своё');
    await quiet();
    await later(COALESCE_MS);
    expect(list).not.toHaveBeenCalled();
  });

  it('reads nothing for a revision already read, or a message of another shape', async () => {
    const { list, handlers } = await watching();
    const on = handlers[0];
    on?.message('list', { list: SHOP, revision: 1, by: 'other-device', id: '1' });
    on?.message('list', { list: uuid(999), revision: null, by: 'other-device' });
    on?.message('revision', { revision: 5 });
    await later(COALESCE_MS);
    expect(list).not.toHaveBeenCalled();
  });

  it("re-reads once, after the coalescing window, for another device's edits", async () => {
    const { cloud, store, list } = await watching();
    cloud.play(SHOP, { name: 'Лавка у моста' });
    cloud.play(SHOP, { name: 'Лавка у реки' });
    await later(COALESCE_MS - 1);
    expect(list).not.toHaveBeenCalled();
    await later(1);
    expect(list).toHaveBeenCalledOnce();
    expect(store.get(SHOP)?.name).toBe('Лавка у реки');
  });

  it('re-reads for a list deleted elsewhere', async () => {
    const { store, list, handlers } = await watching();
    handlers[0]?.message('list', { list: SHOP, revision: null, by: 'other-device' });
    await later(COALESCE_MS);
    expect(list).toHaveBeenCalledOnce();
    expect(store.status).toBe('ready');
  });

  it('re-reads only once the buffer is empty, for a message while a write waits', async () => {
    const { cloud, store, list } = await watching();
    store.setNote(SHOP, 'note', 'моё');
    cloud.play(SHOP, { name: 'Лавка у моста' });
    await later(COALESCE_MS);
    expect(list).not.toHaveBeenCalled();
    await quiet();
    expect(list).toHaveBeenCalledOnce();
    expect(store.get(SHOP)).toMatchObject({ name: 'Лавка у моста', note: 'моё' });
  });

  it('re-reads only once the request in flight has landed, for a message meanwhile', async () => {
    const { cloud, store, list, apply, real } = await watching();
    const held = holdNext(apply, real);
    store.setNote(SHOP, 'note', 'моё');
    await later(QUIET_MS);
    cloud.play(SHOP, { name: 'Лавка у моста' });
    await later(COALESCE_MS);
    expect(list).not.toHaveBeenCalled();
    held.release();
    await settle();
    expect(list).toHaveBeenCalledOnce();
    expect(store.get(SHOP)?.name).toBe('Лавка у моста');
  });

  it('leaves the topic on clear', async () => {
    const { store, cloud, list } = await watching();
    store.clear();
    expect(store.live).toBe(false);
    cloud.play(SHOP, { name: 'Лавка у моста' });
    await later(COALESCE_MS);
    expect(list).not.toHaveBeenCalled();
  });

  it('reads the account once the buffer drains when refresh() comes while an edit waits', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const store = new CloudLists(cloud.lists, say, t);
    await store.load();
    const list = vi.spyOn(cloud.lists, 'list');
    store.rename(SHOP, 'Своё');
    await store.refresh();
    expect(list).not.toHaveBeenCalled();
    await quiet();
    expect(list).toHaveBeenCalledOnce();
    expect(store.get(SHOP)?.name).toBe('Своё');
  });

  it('passes every message and the join refetch to the requests; a request event reads no list', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const requests = { message: vi.fn(), refetch: vi.fn() };
    const store = new CloudLists(cloud.lists, say, t, {
      events: cloud.events,
      random: () => 0.5,
      requests
    });
    await store.load();
    const list = vi.spyOn(cloud.lists, 'list');
    store.watch(SEED.users.gm1.id);
    await later(COALESCE_MS);
    expect(requests.refetch).toHaveBeenCalledOnce();
    list.mockClear();
    cloud.request('player-token-1', [{ item: 'ci1', qty: 1 }]);
    await later(COALESCE_MS);
    expect(requests.message).toHaveBeenCalledWith('request', {
      list: SHOP,
      by: null,
      id: expect.any(String) as unknown
    });
    expect(list).not.toHaveBeenCalled();
  });
});

describe('an import', () => {
  const FILE: ImportList[] = [
    {
      name: 'Новая лавка',
      money_mode: 'coin',
      player_note: '',
      gm_note: '',
      entries: [
        { item_key: 'ci1', quantity: 2, price_coins: 150, player_note: '', gm_note: '' }
      ]
    },
    { name: 'Пустой', money_mode: 'bag', player_note: '', gm_note: '', entries: [] }
  ];

  it('sends the buffer first, keeps the index drawn, and reads the imported lists', async () => {
    const { cloud, store, apply } = await loaded();
    const imp = vi.spyOn(cloud.lists, 'import');
    const made = store.create('Буфер');
    const rows = store.importRows(FILE);
    const statuses: string[] = [];
    const realList = cloud.lists.list.bind(cloud.lists);
    vi.spyOn(cloud.lists, 'list').mockImplementationOnce(() => {
      statuses.push(store.status);
      return realList();
    });
    expect(await store.import(rows)).toEqual({ ok: true });
    expect(apply.mock.invocationCallOrder[0]).toBeLessThan(
      imp.mock.invocationCallOrder[0] ?? 0
    );
    expect(statuses).toEqual(['ready']);
    expect(store.status).toBe('ready');
    expect(store.get(made.id)).toBeDefined();
    expect(store.get(rows[0]?.list.id ?? '')?.meta?.['ci1']).toEqual({ qty: 2, gold: 150 });
    expect(store.get(rows[1]?.list.id ?? '')?.ids).toEqual([]);
    expect(said).toEqual([]);
  });

  it('answers network for a call that clear() overtook, and keeps nothing', async () => {
    const { cloud, store } = await loaded();
    let open: () => void = () => undefined;
    const gate = new Promise<void>((r) => {
      open = r;
    });
    const real = cloud.lists.import.bind(cloud.lists);
    vi.spyOn(cloud.lists, 'import').mockImplementationOnce(async (rows) => {
      await gate;
      return real(rows);
    });
    const answer = store.import(store.importRows(FILE));
    await settle();
    store.clear();
    open();
    expect(await answer).toEqual({ ok: false, error: 'network' });
    expect(store.lists).toEqual([]);
  });

  it('answers ok for a lost answer whose lists the read finds', async () => {
    const { cloud, store } = await loaded();
    const real = cloud.lists.import.bind(cloud.lists);
    vi.spyOn(cloud.lists, 'import').mockImplementationOnce(async (rows) => {
      await real(rows);
      return { ok: false, error: 'network' };
    });
    const rows = store.importRows(FILE);
    expect(await store.import(rows)).toEqual({ ok: true });
    expect(store.get(rows[0]?.list.id ?? '')).toBeDefined();
  });

  it('answers network for a lost call that wrote nothing', async () => {
    const { cloud, store } = await loaded();
    vi.spyOn(cloud.lists, 'import').mockResolvedValueOnce({ ok: false, error: 'network' });
    const rows = store.importRows(FILE);
    expect(await store.import(rows)).toEqual({ ok: false, error: 'network' });
    expect(store.get(rows[0]?.list.id ?? '')).toBeUndefined();
  });

  it('passes a refusal on without a read', async () => {
    const { cloud, store } = await loaded({ limits: { lists: 3 } });
    const list = vi.spyOn(cloud.lists, 'list');
    expect(await store.import(store.importRows(FILE))).toMatchObject({
      ok: false,
      error: 'limit',
      key: 'lists_per_owner'
    });
    expect(list).not.toHaveBeenCalled();
    expect(store.lists).toHaveLength(3);
  });

  it('makes new ids on every call; the same rows sent twice carry the same ids', async () => {
    const { cloud, store } = await loaded();
    const a = store.importRows(FILE);
    const b = store.importRows(FILE);
    expect(a[0]?.list.id).not.toBe(b[0]?.list.id);
    expect(a[0]?.entries[0]?.id).not.toBe(b[0]?.entries[0]?.id);
    const imp = vi.spyOn(cloud.lists, 'import').mockResolvedValueOnce({
      ok: false,
      error: 'network'
    });
    await store.import(a);
    await store.import(a);
    expect(imp.mock.calls[1]?.[0]).toEqual(imp.mock.calls[0]?.[0]);
    expect(store.lists.filter((l) => l.name === 'Новая лавка')).toHaveLength(1);
  });
});

describe('a batch removal', () => {
  it('sends two removals made in one tick as one request', async () => {
    const { cloud, store, apply } = await loaded();
    store.remove(EMPTY);
    store.remove(TROPHIES);
    await quiet();
    expect(kinds(apply)).toEqual([['remove', 'remove']]);
    const read = await cloud.lists.list();
    expect(read.ok ? read.lists.map((l) => l.id) : null).toEqual([SHOP]);
  });

  it('draws a list the server kept again, with one toast, and keeps the other deleted', async () => {
    const { store, apply, real } = await loaded();
    /* The first removal lands; the server refuses the second. */
    apply.mockImplementationOnce(async (ops) => {
      await real(ops.slice(0, 1));
      return { ok: true, results: [{ ok: true }, { ok: false, error: 'refused' }] };
    });
    store.remove(EMPTY);
    store.remove(TROPHIES);
    expect(store.lists.map((l) => l.id)).toEqual([SHOP]);
    await quiet();
    expect(said).toEqual([{ msg: REFUSED_TEXT, error: true }]);
    expect(store.lists.map((l) => l.id)).toEqual([SHOP, TROPHIES]);
  });
});
