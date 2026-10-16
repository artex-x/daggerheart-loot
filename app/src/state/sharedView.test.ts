/* The open share link's list over the fake cloud: its read status, the
 * owner check, and re-reads that redraw only what changed.
 * docs/specs/FEATURES.md, "Account and browser lists". */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { COALESCE_MS } from '../lib/live.js';
import { fakeCloud, type FakeCloud } from '../ports/fake-cloud.js';
import { SEED, uuid } from '../ports/fake-cloud-seed.js';
import { heldSnapshots, type SharedRow } from '../lib/cloudLists.js';
import type { EventsPort, ShareRepository } from '../ports/index.js';
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

  it('names the shown revision on a re-read, and keeps the object and the count on unchanged', async () => {
    const cloud = fakeCloud(SEED);
    const read = vi.spyOn(cloud.shares, 'read');
    const view = new SharedView(cloud.shares);
    await view.open('player-token-1', null);
    expect(read.mock.calls[0]).toEqual(['player-token-1']);
    const first = view.shared;
    await view.refresh();
    expect(first && heldSnapshots(first).size).toBeGreaterThan(0);
    expect(read.mock.calls[1]).toEqual([
      'player-token-1',
      first?.revision,
      first && heldSnapshots(first)
    ]);
    expect(await read.mock.results[1]?.value).toEqual({ ok: true, unchanged: true });
    expect(view.shared).toBe(first);
    expect(view.changes).toBe(0);
    expect(view.status).toBe('ready');
  });

  it('names no revision on the refresh after a failed first read', async () => {
    const cloud = fakeCloud(SEED, undefined, { offline: true });
    const view = new SharedView(cloud.shares);
    await view.open('player-token-1', null);
    cloud.setOffline(false);
    const read = vi.spyOn(cloud.shares, 'read');
    await view.refresh();
    expect(read.mock.calls).toEqual([['player-token-1']]);
  });

  it("re-reads the owner's edit and a deleted link", async () => {
    const owner = fakeCloud(SEED, 'gm1');
    const view = new SharedView(owner.shares);
    await view.open('player-token-1', null);
    const first = view.shared;
    await owner.lists.apply([
      { op: 'update', id: uuid(101), patch: { name: 'Лавка у моста' } }
    ]);
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

  describe('live', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    /* The fake's events, with each subscriber's handlers kept so a test can
       send a message the fake would not. */
    function tapped(cloud: FakeCloud) {
      const handlers: Parameters<EventsPort['subscribe']>[1][] = [];
      const events: EventsPort = {
        tab: cloud.events.tab,
        subscribe(topic, on) {
          handlers.push(on);
          return cloud.events.subscribe(topic, on);
        }
      };
      return { events, handlers };
    }

    async function opened(cloud: FakeCloud, token = 'player-token-1') {
      vi.useFakeTimers();
      const tap = tapped(cloud);
      const view = new SharedView(cloud.shares, { events: tap.events, random: () => 0.5 });
      await view.open(token, null);
      await vi.advanceTimersByTimeAsync(COALESCE_MS);
      const read = vi.spyOn(cloud.shares, 'read');
      return { view, read, tap };
    }

    it('joins the share topic once the list is drawn', async () => {
      const { view } = await opened(fakeCloud(SEED));
      expect(view.live).toBe(true);
    });

    it("draws another device's edit after the coalescing window, two messages in one read", async () => {
      const cloud = fakeCloud(SEED);
      const { view, read } = await opened(cloud);
      cloud.play(uuid(101), { name: 'Лавка у моста' });
      cloud.play(uuid(101), { name: 'Лавка у реки' });
      await vi.advanceTimersByTimeAsync(COALESCE_MS - 1);
      expect(read).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect(read).toHaveBeenCalledOnce();
      expect(view.shared?.list.name).toBe('Лавка у реки');
      expect(view.changes).toBe(1);
    });

    it('reads nothing for a revision it already draws, or a message of another shape', async () => {
      const cloud = fakeCloud(SEED);
      const { view, read, tap } = await opened(cloud);
      const on = tap.handlers[0];
      on?.message('revision', { revision: view.shared?.revision ?? 0, id: '9' });
      on?.message('list', { revision: 99 });
      await vi.advanceTimersByTimeAsync(COALESCE_MS);
      expect(read).not.toHaveBeenCalled();
    });

    it('draws gone after a revoke, and leaves the topic', async () => {
      const owner = fakeCloud(SEED, 'gm1');
      const { view } = await opened(owner);
      await owner.shares.revoke(uuid(111));
      await vi.advanceTimersByTimeAsync(0);
      expect(view.status).toBe('gone');
      expect(view.live).toBe(false);
    });

    it('leaves the topic on close', async () => {
      const { view } = await opened(fakeCloud(SEED));
      view.close();
      expect(view.live).toBe(false);
    });

    it('moves the time but says nothing for a GM note edit on a player link, once for a name', async () => {
      const cloud = fakeCloud(SEED);
      const { view } = await opened(cloud);
      const at = view.shared?.updated_at;
      cloud.play(uuid(101), { gm_note: 'новая' });
      await vi.advanceTimersByTimeAsync(COALESCE_MS);
      expect(view.shared?.updated_at).not.toBe(at);
      expect(view.changes).toBe(0);
      cloud.play(uuid(101), { name: 'Лавка у моста' });
      await vi.advanceTimersByTimeAsync(COALESCE_MS);
      expect(view.changes).toBe(1);
    });
  });

  it('reads a failed first read again through refresh, with no loading, and draws it once online', async () => {
    const cloud = fakeCloud(SEED, undefined, { offline: true });
    const view = new SharedView(cloud.shares);
    await view.open('player-token-1', null);
    expect(view.status).toBe('error');
    const statuses: string[] = [];
    const read = cloud.shares.read.bind(cloud.shares);
    vi.spyOn(cloud.shares, 'read').mockImplementation((token, since, held) => {
      statuses.push(view.status);
      return read(token, since, held);
    });
    await view.refresh();
    expect(view.status).toBe('error');
    cloud.setOffline(false);
    await view.refresh();
    expect(statuses).toEqual(['error', 'error']);
    expect(view.status).toBe('ready');
    expect(view.shared?.list.name).toBe('Лавка кузнеца');
  });

  describe('a stub repository', () => {
    const HID = uuid(5001);
    const record = { id: 'hb_heldaaaaaaaaaaaah', kind: 'item', en: 'Held' };
    const row = (revision: number, name = 'Лавка'): SharedRow => ({
      audience: 'player',
      updated_at: `2026-10-15T10:00:0${String(revision)}.000Z`,
      revision,
      topic_key: 't',
      list: { name, money_mode: 'bag', player_note: '' },
      entries: [
        {
          id: 'e1',
          item_key: record.id,
          source: 'homebrew',
          position: 0,
          quantity: 1,
          price_coins: null,
          player_note: '',
          hid: HID,
          rev: 'r1',
          snapshot: record
        }
      ]
    });
    type Read = ReturnType<ShareRepository['read']>;
    const stub = (answers: (() => Read)[]) => {
      const calls: unknown[][] = [];
      const repo: ShareRepository = {
        list: () => Promise.resolve({ ok: false }),
        create: () => Promise.resolve({ ok: false, error: 'network' }),
        revoke: () => Promise.resolve({ ok: false, error: 'network' }),
        ownerOf: () => Promise.resolve(null),
        clone: () => Promise.resolve({ ok: false, error: 'network' }),
        read: (...args) => {
          calls.push(args);
          return answers[calls.length - 1]?.() ?? Promise.resolve({ ok: false });
        }
      };
      return { repo, calls };
    };

    it('names the shown records by hid and rev on a re-read of a ready page only', async () => {
      const { repo, calls } = stub([
        () => Promise.resolve({ ok: false }),
        () => Promise.resolve({ ok: true, shared: row(1) }),
        () => Promise.resolve({ ok: true, unchanged: true })
      ]);
      const view = new SharedView(repo);
      await view.open('tk', null);
      await view.refresh();
      await view.refresh();
      expect(calls).toEqual([
        ['tk'],
        ['tk'],
        ['tk', 1, new Map([[HID, { rev: 'r1', snapshot: record }]])]
      ]);
    });

    it('keeps the newer list when two re-reads answer out of order', async () => {
      let older: (r: Awaited<Read>) => void = () => undefined;
      const { repo } = stub([
        () => Promise.resolve({ ok: true, shared: row(1) }),
        () =>
          new Promise((resolve) => {
            older = resolve;
          }),
        () => Promise.resolve({ ok: true, shared: row(3, 'Новая') })
      ]);
      const view = new SharedView(repo);
      await view.open('tk', null);
      const first = view.refresh();
      await view.refresh();
      older({ ok: true, shared: row(2, 'Старая') });
      await first;
      expect(view.shared?.list.name).toBe('Новая');
      expect(view.shared?.revision).toBe(3);
    });
  });

  it('knows the owner after a failed first read is read again through refresh', async () => {
    const cloud = fakeCloud(SEED, 'gm1', { offline: true });
    const view = new SharedView(cloud.shares);
    await view.open('player-token-1', GM1);
    expect([view.status, view.mine]).toEqual(['error', null]);
    cloud.setOffline(false);
    await view.refresh();
    expect(view.status).toBe('ready');
    expect(view.mine).toBe(uuid(101));
  });
});
