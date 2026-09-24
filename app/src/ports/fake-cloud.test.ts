/* The fake cloud against the contract every `CloudPort` must meet, and the
   test build's `?as=` switch. */
import { afterEach, describe, expect, it } from 'vitest';
import { runCloudContract } from './cloud.contract.js';
import { fakeCloud, installFakeCloud } from './fake-cloud.js';
import { SEED, uuid } from './fake-cloud-seed.js';
import { browserEnv, fakeEnv } from './index.js';

afterEach(() => {
  delete window.__dhlootFake;
});

describe('the fake cloud', () => {
  it('meets the cloud contract', async () => {
    await runCloudContract(
      (as) => Promise.resolve(fakeCloud(SEED, as)),
      SEED,
      (c, m) => {
        expect(c, m).toBe(true);
      }
    );
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

  it('keeps each port apart from the seed and from the others', async () => {
    await fakeCloud(SEED, 'gm1').auth.deleteAccount();
    expect(await fakeCloud(SEED, 'gm1').auth.identities()).toHaveLength(2);
    expect(SEED.users.gm1.identities).toHaveLength(2);
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
