/* The open share link's list over the fake cloud: its read status, the
 * owner check, and re-reads that redraw only what changed.
 * docs/specs/FEATURES.md, "Account lists". */

import { describe, expect, it } from 'vitest';
import { fakeCloud } from '../ports/fake-cloud.js';
import { SEED, uuid } from '../ports/fake-cloud-seed.js';
import { SharedView } from './sharedView.svelte.js';

const GM1 = SEED.users.gm1.id;
const GM2 = SEED.users.gm2.id;

describe('SharedView', () => {
  it('reads the link: loading, then ready with the row', async () => {
    const view = new SharedView(fakeCloud(SEED).shares);
    const opened = view.open('player-token-1', null);
    expect(view.status).toBe('loading');
    await opened;
    expect(view.status).toBe('ready');
    expect(view.shared?.list.name).toBe('Лавка кузнеца');
    expect(view.mine).toBeNull();
  });

  it('answers gone for an unknown token', async () => {
    const view = new SharedView(fakeCloud(SEED).shares);
    await view.open('unknown', null);
    expect(view.status).toBe('gone');
    expect(view.shared).toBeNull();
  });

  it('answers error offline, and reads again on retry', async () => {
    const cloud = fakeCloud(SEED, 'gm1', { offline: true });
    const view = new SharedView(cloud.shares);
    await view.open('player-token-1', GM1);
    expect(view.status).toBe('error');
    cloud.setOffline(false);
    await view.retry();
    expect(view.status).toBe('ready');
    expect(view.mine).toBe(uuid(101));
  });

  it('keeps the same object when a re-read finds nothing new', async () => {
    const view = new SharedView(fakeCloud(SEED).shares);
    await view.open('player-token-1', null);
    const first = view.shared;
    await view.refresh();
    expect(view.shared).toBe(first);
  });

  it("re-reads the owner's edit and a deleted link", async () => {
    const owner = fakeCloud(SEED, 'gm1');
    const view = new SharedView(owner.shares);
    await view.open('player-token-1', null);
    const first = view.shared;
    await owner.lists.update(uuid(101), { name: 'Лавка у моста' });
    await view.refresh();
    expect(view.shared).not.toBe(first);
    expect(view.shared?.list.name).toBe('Лавка у моста');
    expect(view.shared?.updated_at).not.toBe(first?.updated_at);
    await owner.shares.revoke(uuid(111));
    await view.refresh();
    expect(view.status).toBe('gone');
    expect(view.shared).toBeNull();
  });

  it('keeps the row when a re-read fails', async () => {
    const cloud = fakeCloud(SEED);
    const view = new SharedView(cloud.shares);
    await view.open('player-token-1', null);
    const first = view.shared;
    cloud.setOffline(true);
    await view.refresh();
    expect(view.status).toBe('ready');
    expect(view.shared).toBe(first);
  });

  it('knows the owner, and checks again for another user on the same token', async () => {
    const view = new SharedView(fakeCloud(SEED, 'gm1').shares);
    await view.open('player-token-1', undefined);
    expect(view.mine).toBeNull();
    await view.open('player-token-1', GM1);
    expect(view.mine).toBe(uuid(101));
    await view.open('player-token-1', null);
    expect(view.mine).toBeNull();
    const other = new SharedView(fakeCloud(SEED, 'gm2').shares);
    await other.open('player-token-1', GM2);
    expect(other.mine).toBeNull();
  });

  it('drops an answer for a token no longer open', async () => {
    const view = new SharedView(fakeCloud(SEED).shares);
    const late = view.open('player-token-1', null);
    view.close();
    await late;
    expect(view.status).toBe('idle');
    expect(view.shared).toBeNull();
    const other = view.open('gm-token-1', null);
    await view.open('player-token-1', null);
    await other;
    expect(view.token).toBe('player-token-1');
    expect(view.shared?.audience).toBe('player');
  });

  it('empties on close, and refreshes nothing then', async () => {
    const view = new SharedView(fakeCloud(SEED).shares);
    await view.open('gm-token-1', null);
    view.close();
    await view.refresh();
    await view.retry();
    expect([view.token, view.status, view.shared, view.mine]).toEqual([
      null,
      'idle',
      null,
      null
    ]);
  });
});
