/* The lazy port: loads once, delegates everything, and answers like a
   signed-out, refusing port when the load fails. */
import { describe, expect, it, vi } from 'vitest';
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
      snapshot: null,
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
    const ok = { ok: true };
    expect(await lists.create(row, [])).toEqual(ok);
    expect(await lists.update(uuid(7000), { name: 'Клад' })).toEqual(ok);
    expect(await lists.addEntries(uuid(7000), [e])).toEqual(ok);
    expect(await lists.updateEntry(uuid(7001), { quantity: 2 })).toEqual(ok);
    expect(await lists.reorder(uuid(7000), [uuid(7001)])).toEqual(ok);
    expect(await lists.removeEntries([uuid(7001)])).toEqual(ok);
    const read = await lists.list();
    expect(read.ok && read.lists.map((l) => l.name)).toEqual(['Список второго ГМа', 'Клад']);
    expect(await lists.remove(uuid(7000))).toEqual(ok);
    expect(load).toHaveBeenCalledOnce();
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

  it('answers signed out and refuses every change when the load fails', async () => {
    const { auth, prefs, lists, shares } = lazyCloud(() =>
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
    expect(
      await lists.create(
        { id: 'x', name: '', money_mode: 'bag', player_note: '', gm_note: '' },
        []
      )
    ).toEqual(unsent);
    expect(await lists.update('x', {})).toEqual(unsent);
    expect(await lists.addEntries('x', [])).toEqual(unsent);
    expect(await lists.updateEntry('x', {})).toEqual(unsent);
    expect(await lists.removeEntries([])).toEqual(unsent);
    expect(await lists.reorder('x', [])).toEqual(unsent);
    expect(await lists.remove('x')).toEqual(unsent);
    expect(await shares.list('x')).toEqual({ ok: false });
    expect(await shares.read('t')).toEqual({ ok: false });
    expect(await shares.create('x', 'player')).toEqual(unsent);
    expect(await shares.revoke('x')).toEqual(unsent);
    expect(await shares.clone('t', 'x')).toEqual(unsent);
    expect(await shares.ownerOf('t')).toBeNull();
    off();
    expect(fn).not.toHaveBeenCalled();
  });
});
