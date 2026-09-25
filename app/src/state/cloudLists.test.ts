/* The account list store over the fake cloud: the same writers as the local
 * store, a write queue that survives a lost network, and re-reads that redraw
 * only what changed. docs/specs/FEATURES.md, "Lists". */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toCloudList, type CloudList } from '../lib/cloudLists.js';
import { dict } from '../lib/dict.js';
import type { StoredList } from '../lib/lists.js';
import { fakeCloud, type FakeCloudOptions } from '../ports/fake-cloud.js';
import { SEED, uuid } from '../ports/fake-cloud-seed.js';
import { fakeEnv, memoryStorage } from '../ports/index.js';
import type { ListRepository, ListWrite } from '../ports/index.js';
import { CloudLists, RETRY_MS } from './cloudLists.svelte.js';
import { ListStore } from './lists.svelte.js';

const t = () => dict('ru');
const said: { msg: string; error?: boolean | undefined }[] = [];
const say = (msg: string, error?: boolean): void => {
  said.push({ msg, error });
};

/* Every answer of the fake is already resolved; a flush is a chain of them. */
const settle = async (): Promise<void> => {
  for (let i = 0; i < 40; i++) await Promise.resolve();
};

const SHOP = uuid(101);
const EMPTY = uuid(102);
const TROPHIES = uuid(103);

async function loaded(options: FakeCloudOptions = {}, as = 'gm1') {
  const cloud = fakeCloud(SEED, as, options);
  const store = new CloudLists(cloud.lists, say, t);
  await store.load();
  return { cloud, store };
}

async function serverList(repo: ListRepository, id: string) {
  const read = await repo.list();
  if (!read.ok) throw new Error('the read failed');
  return read.lists.find((l) => l.id === id);
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
    expect(shop?.entryIds['ci1']).toBe(uuid(1101));
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
    await cloud.lists.update(SHOP, { name: 'Лавка у моста' });
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

  it('re-reads nothing before the first load', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const list = vi.spyOn(cloud.lists, 'list');
    const store = new CloudLists(cloud.lists, say, t);
    await store.refresh();
    expect(list).not.toHaveBeenCalled();
  });

  it('drops a read that overlapped an edit, and reads again once the edit is in', async () => {
    const { cloud, store } = await loaded();
    const list = vi.spyOn(cloud.lists, 'list');
    const pending = store.refresh();
    store.rename(SHOP, 'Новое');
    await pending;
    await settle();
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
    await settle();
    expect(store.status).toBe('ready');
    expect(store.lists.map((l) => l.name)).toEqual(['Пока грузится', 'Список второго ГМа']);
  });

  it('forgets everything on clear, the queued writes too', async () => {
    const { cloud, store } = await loaded({ offline: true });
    cloud.setOffline(false);
    await store.load();
    cloud.setOffline(true);
    store.rename(SHOP, 'Не дойдёт');
    await settle();
    expect(store.sync).toBe('failed');
    store.clear();
    expect(store.status).toBe('idle');
    expect(store.lists).toEqual([]);
    expect(store.sync).toBe('saved');
    cloud.setOffline(false);
    store.retry();
    await settle();
    expect((await serverList(cloud.lists, SHOP))?.name).toBe('Лавка кузнеца');
  });

  it('drops an answer that arrives after clear', async () => {
    const { cloud, store } = await loaded();
    let answer: (w: ListWrite) => void = () => undefined;
    cloud.lists.update = () =>
      new Promise((r) => {
        answer = r;
      });
    store.rename(SHOP, 'x');
    await settle();
    store.clear();
    answer({ ok: true });
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
    await settle();
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
    const { cloud, store } = await loaded();
    const write = vi.spyOn(cloud.lists, 'update');
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
    expect(write).not.toHaveBeenCalled();
  });

  it('puts the edited list first and keeps the other lists as they were', async () => {
    const { store } = await loaded();
    const [empty, , trophies] = store.lists;
    store.rename(SHOP, 'Лавка!');
    expect(store.lists.map((l) => l.id)).toEqual([SHOP, EMPTY, TROPHIES]);
    expect(store.lists[1]).toBe(empty);
    expect(store.lists[2]).toBe(trophies);
  });

  it('sends the writes in order, and a queued edit of one field once', async () => {
    const { cloud, store } = await loaded();
    const update = vi.spyOn(cloud.lists, 'update');
    store.rename(SHOP, 'a');
    store.rename(SHOP, 'ab');
    store.rename(SHOP, 'abc');
    store.setMoney(SHOP, 'bag');
    await settle();
    expect(update.mock.calls).toEqual([
      [SHOP, { name: 'a' }],
      [SHOP, { name: 'abc' }],
      [SHOP, { money_mode: 'bag' }]
    ]);
    expect(await serverList(cloud.lists, SHOP)).toMatchObject({
      name: 'abc',
      money_mode: 'bag'
    });
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
    await settle();
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
    await settle();
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
    await settle();
    expect(await serverList(cloud.lists, TROPHIES)).toBeUndefined();
    await store.refresh();
    expect(store.get(TROPHIES)).toBeUndefined();
  });
});

describe('a lost network', () => {
  it('keeps the edit, says not saved, retries every 15 s, and saves when the network is back', async () => {
    vi.useFakeTimers();
    const { cloud, store } = await loaded();
    cloud.setOffline(true);
    store.rename(SHOP, 'Офлайн');
    expect(store.sync).toBe('saving');
    await settle();
    expect(store.sync).toBe('failed');
    expect(store.saved).toBe(false);
    expect(store.get(SHOP)?.name).toBe('Офлайн');
    await vi.advanceTimersByTimeAsync(RETRY_MS);
    expect(store.sync).toBe('failed');
    cloud.setOffline(false);
    await vi.advanceTimersByTimeAsync(RETRY_MS);
    expect(store.sync).toBe('saved');
    expect((await serverList(cloud.lists, SHOP))?.name).toBe('Офлайн');
  });

  it('sends at once on retry, and on refresh while a write waits', async () => {
    vi.useFakeTimers();
    const { cloud, store } = await loaded();
    cloud.setOffline(true);
    store.rename(SHOP, 'Раз');
    await settle();
    cloud.setOffline(false);
    store.retry();
    await settle();
    expect(store.sync).toBe('saved');
    cloud.setOffline(true);
    store.rename(SHOP, 'Два');
    await settle();
    cloud.setOffline(false);
    await store.refresh();
    await settle();
    expect(store.sync).toBe('saved');
    expect((await serverList(cloud.lists, SHOP))?.name).toBe('Два');
  });

  it('replaces a waiting edit of the same field with the newer one', async () => {
    vi.useFakeTimers();
    const { cloud, store } = await loaded();
    const update = vi.spyOn(cloud.lists, 'update');
    cloud.setOffline(true);
    store.rename(SHOP, 'a');
    await settle();
    store.rename(SHOP, 'ab');
    await settle();
    cloud.setOffline(false);
    store.retry();
    await settle();
    expect(update.mock.calls.map((c) => c[1])).toEqual([
      { name: 'a' },
      { name: 'ab' },
      { name: 'ab' }
    ]);
  });
});

describe('a refused write', () => {
  it('says the entry limit with its number and re-reads the list', async () => {
    const { store } = await loaded({ limits: { entries: 9 } });
    expect(store.add(SHOP, ['q2'], () => true)).toEqual(['q2']);
    expect(store.get(SHOP)?.ids).toContain('q2');
    await settle();
    expect(said).toEqual([
      {
        msg: 'Достигнут предел позиций в списке: 9. Нужно больше - напишите на daggerheart.loot@gmail.com.',
        error: true
      }
    ]);
    expect(store.get(SHOP)?.ids).not.toContain('q2');
    expect(store.sync).toBe('saved');
  });

  it('says the entry limit alone when the refused add is followed by its reorder', async () => {
    const { store } = await loaded({ limits: { entries: 9 } });
    store.restoreEntry(SHOP, 'q2', 0, {});
    await settle();
    expect(said).toEqual([
      {
        msg: 'Достигнут предел позиций в списке: 9. Нужно больше - напишите на daggerheart.loot@gmail.com.',
        error: true
      }
    ]);
    expect(store.get(SHOP)?.ids).not.toContain('q2');
  });

  it('says the list limit once, and drops the new list with its queued writes', async () => {
    const { cloud, store } = await loaded({ limits: { lists: 3 } });
    const add = vi.spyOn(cloud.lists, 'addEntries');
    const l = store.create('Четвёртый');
    store.add(l.id, ['ci1'], () => true);
    await settle();
    expect(said.map((s) => s.msg)).toEqual([
      'Достигнут предел списков в аккаунте: 3. Нужно больше - напишите на daggerheart.loot@gmail.com.'
    ]);
    expect(add).not.toHaveBeenCalled();
    expect(store.get(l.id)).toBeUndefined();
  });

  it('says a refusal and shows the list from the account again', async () => {
    const { cloud, store } = await loaded();
    cloud.lists.update = () => Promise.resolve({ ok: false, error: 'refused' });
    store.rename(SHOP, 'Не примут');
    await settle();
    expect(said).toEqual([
      {
        msg: 'Изменение не сохранилось: сервер его не принял. Показан список из аккаунта.',
        error: true
      }
    ]);
    expect(store.get(SHOP)?.name).toBe('Лавка кузнеца');
  });
});
