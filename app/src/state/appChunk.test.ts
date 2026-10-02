/* A homebrew download whose lazy chunk fails to load: the toast «Не получилось...» and no
   file (docs/specs/FEATURES.md, "Homebrew"). Its own file: the module is mocked for the
   whole file. */
import { describe, expect, it, vi } from 'vitest';
import { fakeCloud } from '../ports/fake-cloud.js';
import { SEED } from '../ports/fake-cloud-seed.js';
import { fakeEnv, fakeImage, memoryRouter, memoryStorage } from '../ports/index.js';
import { AppState } from './app.svelte.js';

vi.mock('../lib/homebrewFile.js', () => {
  throw new Error('the chunk did not load');
});

describe('a homebrew download', () => {
  it('says a chunk that did not load, and downloads nothing', async () => {
    const image = fakeImage();
    const app = new AppState(
      fakeEnv({
        router: memoryRouter('#/homebrew'),
        storage: memoryStorage(),
        cloud: fakeCloud(SEED, 'gm1'),
        image
      })
    );
    app.start();
    await vi.waitFor(() => {
      expect(app.homebrew?.status).toBe('ready');
    });
    await app.exportHomebrew({ items: ['hb_emberaxeaaaaaaaa'] }, null);
    expect(app.toast).toMatchObject({ msg: app.t.accountFailed, mode: 'err' });
    await vi.waitFor(() => {
      expect(app.cloudLists?.lists.length).toBeGreaterThan(0);
    });
    app.hideToast();
    await app.exportData();
    expect(app.toast).toMatchObject({ msg: app.t.accountFailed, mode: 'err' });
    expect(image.downloaded).toEqual([]);
    app.stop();
  });
});
