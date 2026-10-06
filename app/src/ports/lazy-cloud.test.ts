/* The lazy port: loads once, delegates everything, and answers like a
   signed-out, refusing port when the load fails. */
import { describe, expect, it, vi } from 'vitest';
import { HOMEBREW_KEY } from '../lib/homebrew.js';
import { fakeCloud } from './fake-cloud.js';
import { SEED, uuid } from './fake-cloud-seed.js';
import { lazyCloud } from './lazy-cloud.js';
import type { Session } from './types.js';

describe('lazyCloud', () => {
  it('loads nothing until it is used, then once', async () => {
    const load = vi.fn(() => Promise.resolve(fakeCloud(SEED, 'gm1')));
    const { auth } = lazyCloud(load);
    expect(load).not.toHaveBeenCalled();
    await auth.session();
    await auth.identities();
    expect(load).toHaveBeenCalledOnce();
  });

  it('delegates every method to the loaded port', async () => {
    const real = fakeCloud(SEED);
    const { auth } = lazyCloud(() => Promise.resolve(real));
    expect(await auth.redirectResult()).toBeNull();
    expect(await auth.signIn('google', { hash: '#/lists' })).toEqual({ ok: true });
    expect((await auth.session())?.email).toBe('gm1@example.test');
    expect(await auth.identities()).toHaveLength(2);
    expect(await auth.unlink(uuid(12))).toEqual({ ok: true });
    expect(await auth.link('discord')).toEqual({ ok: true });
    expect(await auth.signOut('global')).toEqual({ ok: true });
    expect(await real.auth.session()).toBeNull();
    await auth.signIn('google');
    expect(await auth.deleteAccount()).toEqual({ ok: true });
  });

  it('subscribes once the port arrives, and forwards changes', async () => {
    const real = fakeCloud(SEED);
    const { auth } = lazyCloud(() => Promise.resolve(real));
    const seen: (Session | null)[] = [];
    const off = auth.onChange((s) => seen.push(s));
    await auth.session();
    await real.auth.signIn('google');
    expect(seen.map((s) => s?.userId)).toEqual([uuid(1)]);
    off();
    await real.auth.signOut();
    expect(seen).toHaveLength(1);
  });

  it('cancels a subscription removed before the port arrives', async () => {
    const real = fakeCloud(SEED);
    const { auth } = lazyCloud(() => Promise.resolve(real));
    const fn = vi.fn();
    auth.onChange(fn)();
    await auth.session();
    await real.auth.signIn('google');
    expect(fn).not.toHaveBeenCalled();
  });

  it('passes a null identities answer through', async () => {
    const real = fakeCloud(SEED, 'gm1');
    const { auth } = lazyCloud(() =>
      Promise.resolve({
        ...real,
        auth: { ...real.auth, identities: () => Promise.resolve(null) }
      })
    );
    expect(await auth.identities()).toBeNull();
  });

  it("passes the loaded port's preference answers through", async () => {
    const { prefs } = lazyCloud(() => Promise.resolve(fakeCloud(SEED, 'gm2')));
    expect(await prefs.load()).toEqual({ ok: true, prefs: null });
    expect(await prefs.save({ view: 'grid' })).toBe(true);
    expect(await prefs.load()).toEqual({ ok: true, prefs: { view: 'grid' } });
    const out = lazyCloud(() => Promise.resolve(fakeCloud(SEED)));
    expect(await out.prefs.load()).toEqual({ ok: false });
    expect(await out.prefs.save({ view: 'grid' })).toBe(false);
  });

  it('forwards every list call to the loaded port, and makes ids before it loads', async () => {
    const load = vi.fn(() => Promise.resolve(fakeCloud(SEED, 'gm2')));
    const { lists } = lazyCloud(load);
    expect(lists.newId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
    expect(load).not.toHaveBeenCalled();
    const e = {
      id: uuid(7001),
      item_key: 'ci1',
      source: 'official' as const,
      hb_item: null,
      position: 0,
      quantity: 1,
      price_coins: null,
      player_note: '',
      gm_note: ''
    };
    const row = {
      id: uuid(7000),
      name: 'К',
      money_mode: 'bag' as const,
      player_note: '',
      gm_note: ''
    };
    expect(
      await lists.apply([
        { op: 'create', list: row, entries: [] },
        { op: 'add', list_id: uuid(7000), entries: [e] }
      ])
    ).toEqual({ ok: true, results: [{ ok: true }, { ok: true }] });
    const read = await lists.list();
    expect(read.ok && read.lists.map((l) => l.name)).toEqual(['Список второго ГМа', 'К']);
    expect(await lists.move(uuid(7002), '{"ids":[],"name":"Перенос"}')).toEqual({
      ok: true,
      id: uuid(7002),
      inserted: true
    });
    expect(
      await lists.import([{ list: { ...row, id: uuid(7003), name: 'Импорт' }, entries: [] }])
    ).toEqual({ ok: true });
    const after = await lists.list();
    expect(after.ok && after.lists.map((l) => l.name)).toContain('Импорт');
    const known = after.ok
      ? Object.fromEntries(after.lists.map((l) => [l.id, l.revision]))
      : {};
    const again = await lists.list(known);
    expect(again.ok && again.lists).toEqual([]);
    expect(again.ok && again.kept).toHaveLength(Object.keys(known).length);
    const items = await lists.items([uuid(511)]);
    expect(items.ok && items.items.map((i) => i.hid)).toEqual([uuid(511)]);
    expect(load).toHaveBeenCalledOnce();
  });

  it('forwards the known revisions and the shown revision', async () => {
    const real = fakeCloud(SEED, 'gm1');
    const list = vi.spyOn(real.lists, 'list');
    const read = vi.spyOn(real.shares, 'read');
    const { lists, shares } = lazyCloud(() => Promise.resolve(real));
    await lists.list();
    await lists.list({ [uuid(101)]: 1 });
    expect(list.mock.calls).toEqual([[], [{ [uuid(101)]: 1 }]]);
    const first = await shares.read('player-token-1');
    const revision = first.ok ? (first.shared?.revision ?? 0) : 0;
    expect(await shares.read('player-token-1', revision)).toEqual({
      ok: true,
      unchanged: true
    });
    expect(read.mock.calls).toEqual([['player-token-1'], ['player-token-1', revision]]);
  });

  it('forwards every share call to the loaded port', async () => {
    const { shares, lists } = lazyCloud(() => Promise.resolve(fakeCloud(SEED, 'gm1')));
    const read = await shares.list(uuid(101));
    expect(read.ok && read.shares).toHaveLength(2);
    const made = await shares.create(uuid(103), 'gm');
    expect(made).toEqual({ ok: true, id: uuid(3001), token: 'share-token-1' });
    expect(await shares.revoke(uuid(3001))).toEqual({ ok: true });
    const shared = await shares.read('player-token-1');
    expect(shared.ok && shared.shared?.list.name).toBe('Лавка кузнеца');
    expect(await shares.ownerOf('player-token-1')).toBe(uuid(101));
    expect(await shares.clone('player-token-1', lists.newId())).toEqual({ ok: true });
  });

  it('forwards every request call to the loaded port', async () => {
    const { requests } = lazyCloud(() => Promise.resolve(fakeCloud(SEED, 'gm1')));
    const id = uuid(6100);
    expect(await requests.send(id, 'player-token-1', [{ item: 'ci1', qty: 1 }])).toEqual({
      ok: true
    });
    const read = await requests.list();
    expect(read.ok && read.requests.map((r) => r.id)).toEqual([id]);
    expect(await requests.apply(id, false)).toEqual({ ok: true, taken: 1 });
    expect(await requests.decline(id)).toEqual({ ok: false, error: 'decided' });
    expect(await requests.markRead(uuid(101))).toEqual({ ok: true });
    expect(await requests.notices()).toEqual({ ok: true, notices: [] });
    expect(await requests.notices(uuid(101))).toEqual({ ok: true, notices: [] });
    expect(await requests.hideNotices(uuid(101), [uuid(681)])).toEqual({ ok: true });
  });

  it('reads an item by its id through the loaded port', async () => {
    const { lists } = lazyCloud(() => Promise.resolve(fakeCloud(SEED)));
    const read = await lists.item(uuid(511));
    expect(read.ok && (read.item as { hid: string }).hid).toBe(uuid(511));
  });

  it('forwards every homebrew call to the loaded port, and makes ids and keys before it loads', async () => {
    const load = vi.fn(() => Promise.resolve(fakeCloud(SEED, 'gm1')));
    const { homebrew } = lazyCloud(load);
    expect(homebrew.newId()).toMatch(/^[0-9a-f-]{36}$/);
    expect(homebrew.newKey()).toMatch(HOMEBREW_KEY);
    expect(load).not.toHaveBeenCalled();
    const read = await homebrew.load();
    expect(
      read.ok && [read.books.length, read.items.length, read.cards.length, read.itemLimit]
    ).toEqual([1, 4, 2, 100]);
    const book = { id: uuid(7010), key: 'hb_bookbbbbbbbbbbbb', content: { ru: 'Источник' } };
    expect(await homebrew.createBook(book)).toEqual({ ok: true });
    expect(await homebrew.updateBook(uuid(7010), { ru: 'Источник II' }, 1)).toEqual({
      ok: true,
      revision: 2
    });
    const item = {
      id: uuid(7011),
      key: 'hb_itemcccccccccccc',
      book_id: uuid(7010),
      content: { kind: 'item' as const, ru: 'Предмет' }
    };
    expect(await homebrew.createItem(item)).toEqual({ ok: true });
    expect(
      await homebrew.updateItem(uuid(7011), { content: item.content, book_id: null }, 1)
    ).toEqual({ ok: true, revision: 2 });
    expect(await homebrew.removeItem(uuid(7011))).toEqual({ ok: true });
    const card = {
      id: uuid(7012),
      key: 'hb_carddddddddddddd',
      kind: 'set' as const,
      book_id: uuid(7010),
      content: { ru: 'Комплект' }
    };
    expect(await homebrew.createCard(card)).toEqual({ ok: true });
    expect(
      await homebrew.updateCard(
        uuid(7012),
        { content: { ru: 'Комплект II' }, book_id: null },
        1
      )
    ).toEqual({ ok: true, revision: 2 });
    expect(await homebrew.removeCard(uuid(7012))).toEqual({ ok: true });
    const moved = { id: uuid(512), revision: 1 };
    expect(await homebrew.moveItems([moved], uuid(7010), null)).toEqual({ ok: true });
    expect(
      await homebrew.import({
        books: [],
        cards: [],
        items: [
          { id: uuid(7013), key: 'hb_itemeeeeeeeeeeee', book: null, content: item.content }
        ],
        update: false
      })
    ).toMatchObject({ ok: true, counts: { items_created: 1 } });
    expect(await homebrew.removeBook(uuid(7010))).toEqual({ ok: true });
    expect(load).toHaveBeenCalledOnce();
  });

  it('answers signed out and refuses every change when the load fails', async () => {
    const { auth, prefs, lists, shares, requests, homebrew } = lazyCloud(() =>
      Promise.reject(new Error('offline'))
    );
    const fn = vi.fn();
    const off = auth.onChange(fn);
    expect(await auth.session()).toBeNull();
    expect(await auth.identities()).toEqual([]);
    expect(await auth.redirectResult()).toBeNull();
    const failed = { ok: false, error: 'failed' };
    expect(await auth.signIn('google')).toEqual(failed);
    expect(await auth.link('discord')).toEqual(failed);
    expect(await auth.unlink('x')).toEqual(failed);
    expect(await auth.signOut()).toEqual(failed);
    expect(await auth.deleteAccount()).toEqual(failed);
    expect(await prefs.load()).toEqual({ ok: false });
    expect(await prefs.save({ view: 'grid' })).toBe(false);
    expect(await lists.list()).toEqual({ ok: false });
    const unsent = { ok: false, error: 'network' };
    expect(await lists.apply([{ op: 'remove', id: 'x' }])).toEqual(unsent);
    expect(await lists.move('x', '{}')).toEqual(unsent);
    expect(await lists.import([])).toEqual(unsent);
    expect(await lists.items(['x'])).toEqual({ ok: false });
    expect(await shares.list('x')).toEqual({ ok: false });
    expect(await shares.read('t')).toEqual({ ok: false });
    expect(await shares.create('x', 'player')).toEqual(unsent);
    expect(await shares.revoke('x')).toEqual(unsent);
    expect(await shares.clone('t', 'x')).toEqual(unsent);
    expect(await shares.ownerOf('t')).toBeNull();
    expect(await requests.list()).toEqual({ ok: false });
    expect(await requests.send('x', 't', [{ item: 'ci1', qty: 1 }])).toEqual(unsent);
    expect(await requests.apply('x', false)).toEqual(unsent);
    expect(await requests.decline('x')).toEqual(unsent);
    expect(await requests.markRead('x')).toEqual(unsent);
    expect(await requests.notices()).toEqual({ ok: false });
    expect(await requests.notices('x')).toEqual({ ok: false });
    expect(await requests.hideNotices('x', ['y'])).toEqual(unsent);
    expect(await lists.item('x')).toEqual({ ok: false });
    expect(await homebrew.load()).toEqual({ ok: false });
    const book = { id: 'x', key: 'hb_bookbbbbbbbbbbbb', content: { ru: 'a' } };
    expect(await homebrew.createBook(book)).toEqual(unsent);
    expect(await homebrew.updateBook('x', { ru: 'a' }, null)).toEqual(unsent);
    expect(await homebrew.removeBook('x')).toEqual(unsent);
    const content = { kind: 'item' as const, ru: 'a' };
    expect(
      await homebrew.createItem({ id: 'x', key: 'hb_itemcccccccccccc', book_id: null, content })
    ).toEqual(unsent);
    expect(await homebrew.updateItem('x', { content, book_id: null }, 1)).toEqual(unsent);
    expect(await homebrew.removeItem('x')).toEqual(unsent);
    const card = { id: 'x', key: 'hb_carddddddddddddd', kind: 'ref' as const };
    expect(await homebrew.createCard({ ...card, book_id: null, content: { en: 'a' } })).toEqual(
      unsent
    );
    expect(await homebrew.updateCard('x', { content: { en: 'a' }, book_id: null }, 1)).toEqual(
      unsent
    );
    expect(await homebrew.removeCard('x')).toEqual(unsent);
    expect(await homebrew.import({ books: [], cards: [], items: [], update: false })).toEqual(
      unsent
    );
    expect(await homebrew.moveItems([{ id: 'x', revision: 1 }], null, null)).toEqual(unsent);
    off();
    expect(fn).not.toHaveBeenCalled();
  });

  it('subscribes once the port arrives, and names its tab id only then', async () => {
    const real = fakeCloud(SEED);
    const { events, auth } = lazyCloud(() => Promise.resolve(real));
    expect(events.tab).toBe('');
    const seen: string[] = [];
    events.subscribe('share:' + uuid(112), {
      message: () => undefined,
      status: (s) => seen.push(s)
    });
    await auth.session();
    await Promise.resolve();
    expect(seen).toEqual(['live']);
    expect(events.tab).toBe(real.events.tab);
  });

  it('subscribes nothing for a leave before the port arrives', async () => {
    const real = fakeCloud(SEED);
    const subscribe = vi.spyOn(real.events, 'subscribe');
    const { events, auth } = lazyCloud(() => Promise.resolve(real));
    const status = vi.fn();
    events.subscribe('share:' + uuid(112), { message: () => undefined, status })();
    await auth.session();
    await Promise.resolve();
    expect(subscribe).not.toHaveBeenCalled();
    expect(status).not.toHaveBeenCalled();
  });

  it('answers down to a subscribe when the load fails', async () => {
    const { events } = lazyCloud(() => Promise.reject(new Error('offline')));
    const status = vi.fn();
    events.subscribe('share:' + uuid(112), { message: () => undefined, status });
    await vi.waitFor(() => {
      expect(status).toHaveBeenCalledWith('down');
    });
    expect(events.tab).toBe('');
  });
});
