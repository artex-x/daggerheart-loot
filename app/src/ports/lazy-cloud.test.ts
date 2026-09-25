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
    expect(await auth.signIn('google')).toEqual({ ok: true });
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

  it('answers signed out and refuses every change when the load fails', async () => {
    const { auth, prefs } = lazyCloud(() => Promise.reject(new Error('offline')));
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
    off();
    expect(fn).not.toHaveBeenCalled();
  });
});
