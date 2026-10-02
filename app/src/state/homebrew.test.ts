/* The homebrew store over the fake port: every read and write, the epoch, the messages,
   the safe create retry, the read that overlapped a write, and the kept arrays. */

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HomebrewContent } from '../lib/homebrew.js';
import { COALESCE_MS } from '../lib/live.js';
import { fakeCloud, type FakeCloud } from '../ports/fake-cloud.js';
import { SEED, uuid } from '../ports/fake-cloud-seed.js';
import type { HomebrewRead, HomebrewRepository, HomebrewSaved } from '../ports/index.js';
import { Homebrew } from './homebrew.svelte.js';

const ALDER = uuid(501);
const AXE = 'hb_emberaxeaaaaaaaa';
const RING = 'hb_engravedringaaaa';

function make(as: 'gm1' | 'gm2' = 'gm1', repo?: (cloud: FakeCloud) => HomebrewRepository) {
  const cloud = fakeCloud(SEED, as);
  const refreshLists = vi.fn(() => Promise.resolve());
  const store = new Homebrew(repo ? repo(cloud) : cloud.homebrew, {
    tab: () => cloud.events.tab,
    refreshLists
  });
  return { cloud, store, refreshLists };
}

async function loaded(as: 'gm1' | 'gm2' = 'gm1') {
  const made = make(as);
  await made.store.load();
  return made;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('reading', () => {
  it('loads the sources, the items, their records and the limit', async () => {
    const { store } = make();
    expect(store.status).toBe('idle');
    const loading = store.load();
    expect(store.status).toBe('loading');
    await loading;
    expect(store.status).toBe('ready');
    expect(store.books.map((b) => b.key)).toEqual(['hb_alderworkshopaaa']);
    expect(store.items).toHaveLength(4);
    expect(store.itemLimit).toBe(100);
    expect(store.has(AXE)).toBe(true);
    expect(store.has('hb_nosuchitemaaaaa')).toBe(false);
    expect(store.item(AXE)?.book_id).toBe(ALDER);
    expect(store.book(ALDER)?.content.ru).toBe('Мастерская Ольхи');
    const axe = store.records.find((r) => r.id === AXE);
    expect(axe?.book?.section?.ru).toBe('Холодное оружие');
    expect(store.records.find((r) => r.id === RING)?.book).toBeUndefined();
    expect(store.cards.map((c) => c.key)).toEqual([
      'hb_aldersetaaaaaaaa',
      'hb_alderrulecardaaa'
    ]);
  });

  it('keeps the cards array when a read finds the same cards', async () => {
    const { store } = await loaded();
    const { cards } = store;
    expect(await store.read()).toBe(true);
    expect(store.cards).toBe(cards);
  });

  it('embeds in a record the own cards its item names and no other', async () => {
    const { cloud, store } = await loaded();
    const ring = store.item(RING)!;
    await cloud.homebrew.updateItem(
      ring.id,
      { content: { ...ring.content, set: 'hb_aldersetaaaaaaaa' }, book_id: null },
      null
    );
    await store.read();
    const record = store.records.find((r) => r.id === RING);
    expect(Object.keys(record?.cards?.sets ?? {})).toEqual(['hb_aldersetaaaaaaaa']);
    expect(record?.cards?.refs).toBeUndefined();
    expect(store.records.find((r) => r.id === AXE)?.cards).toBeUndefined();
  });

  it('empties the cards on a clear', async () => {
    const { store } = await loaded();
    expect(store.cards).toHaveLength(2);
    store.clear();
    expect(store.cards).toEqual([]);
  });

  it('draws the error on a failed first read and reads again with no loading state', async () => {
    const { cloud, store } = make();
    cloud.setOffline(true);
    await store.load();
    expect(store.status).toBe('error');
    cloud.setOffline(false);
    const again = store.read();
    expect(store.status).toBe('error');
    expect(await again).toBe(true);
    expect(store.status).toBe('ready');
  });

  it('keeps what is shown when a later read fails', async () => {
    const { cloud, store } = await loaded();
    const items = store.items;
    cloud.setOffline(true);
    expect(await store.read()).toBe(false);
    expect(store.status).toBe('ready');
    expect(store.items).toBe(items);
  });

  it('a read that finds the same rows keeps the arrays and the records', async () => {
    const { cloud, store } = await loaded();
    const { books, items, records } = store;
    expect(await store.read()).toBe(true);
    expect(store.books).toBe(books);
    expect(store.items).toBe(items);
    expect(store.records).toBe(records);
    const ring = store.item(RING);
    const axe = store.item(AXE);
    if (!axe) throw new Error('The seed has no axe. Restore the seed.');
    await cloud.homebrew.updateItem(
      axe.id,
      { content: { ...axe.content, ru: 'Топор II' }, book_id: axe.book_id },
      null
    );
    await store.read();
    expect(store.items).not.toBe(items);
    expect(store.item(RING)).toBe(ring);
    expect(store.item(AXE)?.content.ru).toBe('Топор II');
  });

  it('drops an answer that started before a clear', async () => {
    const { store } = make();
    const reading = store.load();
    store.clear();
    await reading;
    expect(store.status).toBe('idle');
    expect(store.items).toEqual([]);
    expect(await store.read()).toBe(true);
  });

  it('a read that overlapped a write is read again after it', async () => {
    let hold: ((r: HomebrewRead) => void) | null = null;
    const { store } = make('gm1', (cloud) => ({
      ...cloud.homebrew,
      load: () => {
        if (hold === null) {
          return new Promise<HomebrewRead>((resolve) => {
            hold = resolve;
          });
        }
        return cloud.homebrew.load();
      }
    }));
    const reading = store.load();
    const stale: HomebrewRead = {
      ok: true,
      books: [],
      items: [],
      cards: [],
      itemLimit: 100,
      bookLimit: 20,
      cardLimit: 100
    };
    const made = await store.createItem(store.newIds(), null, { kind: 'item', ru: 'Новое' });
    expect(made).toEqual({ ok: true });
    (hold as unknown as (r: HomebrewRead) => void)(stale);
    await reading;
    expect(store.records.map((r) => r.ru)).toContain('Новое');
    expect(store.items).toHaveLength(5);
  });
});

describe('messages', () => {
  it('reads once for a burst from another tab and ignores this tab own echo', async () => {
    vi.useFakeTimers();
    const { cloud, store } = await loaded();
    const load = vi.spyOn(cloud.homebrew, 'load');
    store.message('homebrew', { by: cloud.events.tab });
    store.message('list', { by: 'other' });
    await vi.advanceTimersByTimeAsync(COALESCE_MS);
    expect(load).not.toHaveBeenCalled();
    store.message('homebrew', { by: 'other' });
    store.message('homebrew', { by: null });
    store.refetch();
    await vi.advanceTimersByTimeAsync(COALESCE_MS);
    expect(load).toHaveBeenCalledOnce();
  });

  it('a clear stops a read that waits', async () => {
    vi.useFakeTimers();
    const { cloud, store } = await loaded();
    const load = vi.spyOn(cloud.homebrew, 'load');
    store.refetch();
    store.clear();
    await vi.advanceTimersByTimeAsync(COALESCE_MS);
    expect(load).not.toHaveBeenCalled();
  });
});

describe('sources and sections', () => {
  it('creates a source, renames it in one language and keeps the other', async () => {
    const { cloud, store } = await loaded('gm2');
    const ids = store.newIds();
    expect(await store.createBook(ids, '  Кузня  ', 'ru')).toEqual({ ok: true });
    const book = store.book(ids.id);
    expect(book).toMatchObject({ key: ids.key, content: { ru: 'Кузня' }, revision: 1 });
    if (!book) return;
    expect(await store.renameBook(book, 'Forge', 'en')).toEqual({ ok: true, revision: 2 });
    expect(store.book(ids.id)?.content).toEqual({ ru: 'Кузня', en: 'Forge' });
    expect((await cloud.homebrew.load()).ok).toBe(true);
  });

  it('adds, renames and removes a section', async () => {
    const { store } = await loaded();
    const key = store.newIds().key;
    const book = () => store.book(ALDER)!;
    expect((await store.addSection(book(), key, 'Луки', 'ru')).ok).toBe(true);
    expect(book().content.sections?.at(-1)).toEqual({ key, ru: 'Луки' });
    expect((await store.renameSection(book(), key, 'Bows', 'en')).ok).toBe(true);
    expect(book().content.sections?.at(-1)).toEqual({ key, ru: 'Луки', en: 'Bows' });
    expect((await store.removeSection(book(), key)).ok).toBe(true);
    expect(book().content.sections?.map((s) => s.key)).not.toContain(key);
  });

  it('drops the sections key when the last section goes', async () => {
    const { store } = await loaded('gm2');
    const ids = store.newIds();
    await store.createBook(ids, 'Кузня', 'ru');
    const key = store.newIds().key;
    await store.addSection(store.book(ids.id)!, key, 'Один', 'ru');
    await store.removeSection(store.book(ids.id)!, key);
    expect(store.book(ids.id)?.content).toEqual({ ru: 'Кузня' });
  });

  it('reads again after a conflict and after a gone source', async () => {
    const { cloud, store } = await loaded();
    const book = store.book(ALDER)!;
    await cloud.homebrew.updateBook(ALDER, { ...book.content, en: 'Elsewhere' }, null);
    expect(await store.renameBook(book, 'Ольха', 'ru')).toEqual({
      ok: false,
      error: 'conflict'
    });
    expect(store.book(ALDER)?.content.en).toBe('Elsewhere');
    const fresh = store.book(ALDER)!;
    await cloud.homebrew.removeBook(ALDER);
    expect(await store.renameBook(fresh, 'Ольха', 'ru')).toEqual({ ok: false, error: 'gone' });
    expect(store.book(ALDER)).toBeUndefined();
  });

  it('removes a source and reads its items back in the default source', async () => {
    const { store } = await loaded();
    expect(await store.removeBook(ALDER)).toEqual({ ok: true });
    expect(store.books).toEqual([]);
    expect(store.item(AXE)?.book_id).toBeNull();
  });

  it('answers the limit and the network', async () => {
    const { cloud, store } = await loaded('gm2');
    cloud.setOffline(true);
    expect(await store.removeBook(ALDER)).toEqual({ ok: false, error: 'network' });
    const small = new Homebrew(fakeCloud(SEED, 'gm2', { limits: { books: 0 } }).homebrew, {
      tab: () => '',
      refreshLists: () => Promise.resolve()
    });
    await small.load();
    expect(await small.createBook(small.newIds(), 'А', 'ru')).toEqual({
      ok: false,
      error: 'limit',
      key: 'homebrew_books_per_owner',
      value: 0
    });
    expect(small.books).toEqual([]);
    expect([small.bookLimit, small.cardLimit, small.itemLimit]).toEqual([0, 100, 100]);
    small.clear();
    expect([small.bookLimit, small.cardLimit, small.itemLimit]).toEqual([null, null, null]);
  });
});

describe('items', () => {
  const POTION: HomebrewContent = { kind: 'consumable', ru: 'Зелье' };

  it('creates an item, updates it over its revision and answers a conflict', async () => {
    const { cloud, store } = await loaded('gm2');
    const ids = store.newIds();
    expect(await store.createItem(ids, null, POTION)).toEqual({ ok: true });
    const row = store.item(ids.key)!;
    expect(row.revision).toBe(1);
    const patch = { content: { ...POTION, ru: 'Зелье II' }, book_id: null };
    expect(await store.updateItem(row, patch, 1)).toEqual({ ok: true, revision: 2 });
    expect(store.item(ids.key)?.content.ru).toBe('Зелье II');
    await cloud.homebrew.updateItem(ids.id, { content: POTION, book_id: null }, null);
    expect(await store.updateItem(store.item(ids.key)!, patch, 2)).toEqual({
      ok: false,
      error: 'conflict'
    });
    expect(await store.updateItem(store.item(ids.key)!, patch, null)).toEqual({
      ok: true,
      revision: 4
    });
  });

  it('removes an item and re-reads the lists', async () => {
    const { store, refreshLists } = await loaded();
    const ring = store.item(RING)!;
    expect(await store.removeItem(ring)).toEqual({ ok: true });
    expect(store.has(RING)).toBe(false);
    expect(refreshLists).toHaveBeenCalledOnce();
  });

  it('removes several items and stops at the first failure', async () => {
    const { store, refreshLists } = await loaded();
    const rows = [store.item(RING)!, store.item(AXE)!];
    expect(await store.removeItems(rows)).toEqual({ ok: true });
    expect(store.items).toHaveLength(2);
    expect(refreshLists).toHaveBeenCalledOnce();
    const failed = make('gm1', (cloud) => ({
      ...cloud.homebrew,
      removeItem: () => Promise.resolve({ ok: false, error: 'network' })
    }));
    await failed.store.load();
    expect(await failed.store.removeItems([failed.store.item(RING)!])).toEqual({
      ok: false,
      error: 'network'
    });
    expect(failed.store.has(RING)).toBe(true);
    expect(failed.refreshLists).not.toHaveBeenCalled();
  });

  it('a create whose answer was lost and that is sent again makes one row', async () => {
    let lose = true;
    const { cloud, store } = make('gm2', (c) => ({
      ...c.homebrew,
      createItem: async (row) => {
        const r = await c.homebrew.createItem(row);
        if (!lose) return r;
        lose = false;
        return { ok: false, error: 'network' };
      }
    }));
    await store.load();
    const ids = store.newIds();
    expect(await store.createItem(ids, null, POTION)).toEqual({ ok: false, error: 'network' });
    const edited = { ...POTION, ru: 'Зелье правленое' };
    expect(await store.createItem(ids, null, edited)).toEqual({ ok: true });
    const read = await cloud.homebrew.load();
    expect(read.ok && read.items.map((i) => i.content.ru)).toEqual(['Зелье правленое']);
    expect(store.items).toHaveLength(1);
  });

  it('a create sent again after a lost answer and a failed read writes nothing', async () => {
    let offlineRead = false;
    const create = vi.fn();
    const { store } = make('gm2', (c) => ({
      ...c.homebrew,
      load: () => (offlineRead ? Promise.resolve({ ok: false }) : c.homebrew.load()),
      createItem: (row) => {
        create(row);
        return Promise.resolve({ ok: false, error: 'network' });
      }
    }));
    await store.load();
    const ids = store.newIds();
    await store.createItem(ids, null, POTION);
    offlineRead = true;
    expect(await store.createItem(ids, null, POTION)).toEqual({ ok: false, error: 'network' });
    expect(create).toHaveBeenCalledOnce();
    offlineRead = false;
    expect(await store.createItem(ids, null, POTION)).toEqual({ ok: false, error: 'network' });
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('a source whose create answer was lost is renamed, not made twice', async () => {
    let lose = true;
    const { cloud, store } = make('gm2', (c) => ({
      ...c.homebrew,
      createBook: async (row) => {
        const r = await c.homebrew.createBook(row);
        if (!lose) return r;
        lose = false;
        return { ok: false, error: 'network' };
      }
    }));
    await store.load();
    const ids = store.newIds();
    await store.createBook(ids, 'Кузня', 'ru');
    expect(await store.createBook(ids, 'Кузня Ольхи', 'ru')).toEqual({ ok: true });
    const read = await cloud.homebrew.load();
    expect(read.ok && read.books.map((b) => b.content.ru)).toEqual(['Кузня Ольхи']);
  });
});

describe('cards', () => {
  const SET = { ru: 'Кузнечный', rud: '+1 к Броне.' };

  it('creates a card, updates it over its revision, and cardRefs follows the cards', async () => {
    const { store } = await loaded('gm2');
    const ids = store.newIds();
    expect(await store.createCard(ids, 'set', null, SET)).toEqual({ ok: true });
    const row = store.cards.find((c) => c.id === ids.id)!;
    expect(row).toMatchObject({ key: ids.key, kind: 'set', book_id: null, revision: 1 });
    expect(store.cardRefs).toEqual([{ ...SET, key: ids.key, kind: 'set' }]);
    const patch = { content: { ...SET, ru: 'Кузнечный II' }, book_id: null };
    expect(await store.updateCard(row, patch, 1)).toEqual({ ok: true, revision: 2 });
    expect(store.cards[0]?.content.ru).toBe('Кузнечный II');
    expect(store.cardRefs[0]?.ru).toBe('Кузнечный II');
  });

  it('reads again after a conflict and after a gone card', async () => {
    const { cloud, store } = await loaded();
    const rule = store.cards.find((c) => c.key === 'hb_alderrulecardaaa')!;
    await cloud.homebrew.updateCard(rule.id, { content: { ru: 'Чужое' }, book_id: null }, null);
    const patch = { content: { ru: 'Моё' }, book_id: null };
    expect(await store.updateCard(rule, patch, rule.revision)).toEqual({
      ok: false,
      error: 'conflict'
    });
    expect(store.cards.find((c) => c.id === rule.id)?.content.ru).toBe('Чужое');
    const set = store.cards.find((c) => c.key === 'hb_aldersetaaaaaaaa')!;
    await cloud.homebrew.removeCard(set.id);
    expect(await store.updateCard(set, patch, set.revision)).toEqual({
      ok: false,
      error: 'gone'
    });
    expect(store.cards.some((c) => c.id === set.id)).toBe(false);
  });

  it('removes a card and leaves the items, which keep its key', async () => {
    const { cloud, store, refreshLists } = await loaded();
    const ring = store.item(RING)!;
    await cloud.homebrew.updateItem(
      ring.id,
      { content: { ...ring.content, set: 'hb_aldersetaaaaaaaa' }, book_id: null },
      null
    );
    await store.read();
    const items = store.items;
    const set = store.cards.find((c) => c.key === 'hb_aldersetaaaaaaaa')!;
    expect(await store.removeCard(set)).toEqual({ ok: true });
    expect(store.cards.map((c) => c.key)).toEqual(['hb_alderrulecardaaa']);
    expect(store.items).toBe(items);
    expect(store.item(RING)?.content.set).toBe('hb_aldersetaaaaaaaa');
    expect(store.records.find((r) => r.id === RING)?.cards).toBeUndefined();
    expect(refreshLists).not.toHaveBeenCalled();
  });

  it('a card create whose answer was lost and that is sent again makes one row', async () => {
    let lose = true;
    const { cloud, store } = make('gm2', (c) => ({
      ...c.homebrew,
      createCard: async (row) => {
        const r = await c.homebrew.createCard(row);
        if (!lose) return r;
        lose = false;
        return { ok: false, error: 'network' };
      }
    }));
    await store.load();
    const ids = store.newIds();
    expect(await store.createCard(ids, 'ref', null, SET)).toEqual({
      ok: false,
      error: 'network'
    });
    const edited = { ...SET, ru: 'Клеймо' };
    expect(await store.createCard(ids, 'ref', null, edited)).toEqual({ ok: true });
    const read = await cloud.homebrew.load();
    expect(read.ok && read.cards.map((c) => c.content.ru)).toEqual(['Клеймо']);
    expect(store.cards).toHaveLength(1);
  });

  it('a card create sent again after a lost answer and a failed read writes nothing', async () => {
    let offlineRead = false;
    const create = vi.fn();
    const { store } = make('gm2', (c) => ({
      ...c.homebrew,
      load: () => (offlineRead ? Promise.resolve({ ok: false }) : c.homebrew.load()),
      createCard: (row) => {
        create(row);
        return Promise.resolve({ ok: false, error: 'network' });
      }
    }));
    await store.load();
    const ids = store.newIds();
    await store.createCard(ids, 'set', null, SET);
    offlineRead = true;
    expect(await store.createCard(ids, 'set', null, SET)).toEqual({
      ok: false,
      error: 'network'
    });
    expect(create).toHaveBeenCalledOnce();
  });

  it('answers a refused remove and keeps the card', async () => {
    const { store } = make('gm1', (c) => ({
      ...c.homebrew,
      removeCard: () => Promise.resolve({ ok: false, error: 'network' })
    }));
    await store.load();
    const set = store.cards[0]!;
    expect(await store.removeCard(set)).toEqual({ ok: false, error: 'network' });
    expect(store.cards).toHaveLength(2);
  });
});

describe('the edges', () => {
  const ROW = {
    revision: 1,
    created_at: '2026-09-20T10:00:00Z',
    updated_at: '2026-09-20T10:00:00Z'
  };

  it('orders rows made at one moment by id, and draws an item of an unknown source as the default', async () => {
    const { store } = make('gm2', (c) => ({
      ...c.homebrew,
      load: () =>
        Promise.resolve({
          ok: true,
          books: [],
          items: [
            {
              ...ROW,
              id: 'b',
              key: 'hb_bbbbbbbbbbbbbbbb',
              book_id: 'gone',
              content: { kind: 'item', ru: 'Б' }
            },
            {
              ...ROW,
              id: 'a',
              key: 'hb_aaaaaaaaaaaaaaaa',
              book_id: null,
              content: { kind: 'item', ru: 'А' }
            }
          ],
          cards: [],
          itemLimit: null,
          bookLimit: null,
          cardLimit: null
        })
    }));
    await store.load();
    expect(store.items.map((i) => i.id)).toEqual(['a', 'b']);
    expect(store.records[1]?.book).toBeUndefined();
  });

  it('a read that waits on a write drops its answer after a clear', async () => {
    let release: (() => void) | null = null;
    const { store } = make('gm2', (c) => ({
      ...c.homebrew,
      createItem: (row) =>
        new Promise((resolve) => {
          release = () => {
            void c.homebrew.createItem(row).then(resolve);
          };
        })
    }));
    await store.load();
    const writing = store.createItem(store.newIds(), null, { kind: 'item', ru: 'А' });
    const reading = store.read();
    store.clear();
    (release as unknown as () => void)();
    await writing;
    expect(await reading).toBe(false);
    expect(store.status).toBe('idle');
  });

  it('a source whose create answer was lost: a failed read writes nothing, a read that finds none sends it again', async () => {
    let lose = true;
    let failRead = false;
    const create = vi.fn();
    const { cloud, store } = make('gm2', (c) => ({
      ...c.homebrew,
      load: () => (failRead ? Promise.resolve({ ok: false }) : c.homebrew.load()),
      createBook: (row) => {
        create();
        if (lose) return Promise.resolve({ ok: false, error: 'network' });
        return c.homebrew.createBook(row);
      }
    }));
    await store.load();
    const ids = store.newIds();
    await store.createBook(ids, 'Кузня', 'ru');
    failRead = true;
    expect(await store.createBook(ids, 'Кузня', 'ru')).toEqual({ ok: false, error: 'network' });
    expect(create).toHaveBeenCalledOnce();
    failRead = false;
    lose = false;
    expect(await store.createBook(ids, 'Кузня', 'ru')).toEqual({ ok: true });
    expect(create).toHaveBeenCalledTimes(2);
    const read = await cloud.homebrew.load();
    expect(read.ok && read.books).toHaveLength(1);
  });

  it('an item sent again whose held row refuses the update answers as the next press should', async () => {
    const answers: HomebrewSaved[] = [
      { ok: false, error: 'conflict' },
      { ok: false, error: 'refused' }
    ];
    let lose = true;
    const { store } = make('gm2', (c) => ({
      ...c.homebrew,
      createItem: async (row) => {
        const r = await c.homebrew.createItem(row);
        if (!lose) return r;
        lose = false;
        return { ok: false, error: 'network' };
      },
      updateItem: () => Promise.resolve(answers.shift() ?? { ok: false, error: 'network' })
    }));
    await store.load();
    const ids = store.newIds();
    const potion: HomebrewContent = { kind: 'consumable', ru: 'Зелье' };
    await store.createItem(ids, null, potion);
    expect(await store.createItem(ids, null, potion)).toEqual({ ok: false, error: 'network' });
    expect(await store.createItem(ids, null, potion)).toEqual({ ok: false, error: 'refused' });
    expect(await store.createItem(ids, null, potion)).toEqual({ ok: false, error: 'network' });
  });

  it('renames and removes a section of a source with no sections, and keeps the other rows', async () => {
    const { store } = await loaded();
    const ids = store.newIds();
    await store.createBook(ids, 'Пустой', 'ru');
    const empty = store.book(ids.id)!;
    const alder = store.book(ALDER);
    expect((await store.renameSection(empty, 'hb_nosectionaaaaaa', 'А', 'ru')).ok).toBe(true);
    expect((await store.removeSection(store.book(ids.id)!, 'hb_nosectionaaaaaa')).ok).toBe(
      true
    );
    expect(store.book(ALDER)).toBe(alder);
    const ring = store.item(RING);
    const axe = store.item(AXE)!;
    await store.updateItem(
      axe,
      { content: { ...axe.content, ru: 'Топор II' }, book_id: axe.book_id },
      axe.revision
    );
    expect(store.item(RING)).toBe(ring);
  });

  it('answers a book write that got no answer, with no read', async () => {
    const { cloud, store } = await loaded();
    const load = vi.spyOn(cloud.homebrew, 'load');
    cloud.setOffline(true);
    expect(await store.renameBook(store.book(ALDER)!, 'Ольха', 'ru')).toEqual({
      ok: false,
      error: 'network'
    });
    expect(load).not.toHaveBeenCalled();
  });
});
