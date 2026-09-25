/* The fake cloud against the contract every `CloudPort` must meet, and the
   test build's `?as=` switch. */
import { afterEach, describe, expect, it } from 'vitest';
import { runCloudContract } from './cloud.contract.js';
import { fakeCloud, installFakeCloud } from './fake-cloud.js';
import { SEED, uuid } from './fake-cloud-seed.js';
import { browserEnv, fakeEnv } from './index.js';
import type { Session } from './types.js';

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
      result: { ok: false, error: 'alreadyLinked' }
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
