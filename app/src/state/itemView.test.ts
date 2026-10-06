/* The `#/h/` item view over the fake cloud: each status, a re-read that keeps its objects,
 * keeps the shown item on a failure or turns `gone`, a user change, and the per-view index
 * that draws the author's relations over a reader who holds the same keys. */

import { describe, expect, it } from 'vitest';
import { madeFrom, setOf, upgradesTo, buildIndex, type Loot } from '../lib/data.js';
import type { ListRepository } from '../ports/index.js';
import { fakeCloud } from '../ports/fake-cloud.js';
import { SEED, uuid } from '../ports/fake-cloud-seed.js';
import { withRecords, recordOf } from '../lib/homebrew.js';
import { ItemView } from './itemView.svelte.js';

const LOOT: Loot = { items: {}, eq: [], refs: {} };
const CATALOG = buildIndex(LOOT);
const ROLL_B = uuid(662);

const keysOf = (rs: readonly { id: string }[]): string[] => rs.map((r) => r.id).sort();

describe('ItemView', () => {
  it('reads an item: loading, then ready with its record, related items and mine', async () => {
    const view = new ItemView(fakeCloud(SEED).as().lists, () => CATALOG);
    expect(view.status).toBe('idle');
    const opened = view.open(ROLL_B, null);
    expect(view.status).toBe('loading');
    await opened;
    expect(view.status).toBe('ready');
    expect(view.hid).toBe(ROLL_B);
    expect(view.mine).toBe(false);
    expect(view.record?.id).toBe('hb_rangerrollaaaaaa');
    expect(keysOf(view.related)).toEqual([
      'hb_campblanketaaaaa',
      'hb_mosspillowaaaaaa',
      'hb_sentryrollaaaaaa',
      'hb_travelrollaaaaaa'
    ]);
    const it = view.index?.byId.get('hb_rangerrollaaaaaa');
    expect(it).toBeDefined();
    const index = view.index!;
    expect(keysOf(madeFrom(index, it!))).toEqual(['hb_travelrollaaaaaa']);
    expect(keysOf(upgradesTo(index, it!))).toEqual(['hb_sentryrollaaaaaa']);
    expect(keysOf(setOf(index, it!))).toEqual([
      'hb_campblanketaaaaa',
      'hb_mosspillowaaaaaa',
      'hb_rangerrollaaaaaa'
    ]);
    expect(index.sets['hb_starsleepsetaaaa']?.ru).toBe('Сон под звёздами');
  });

  it('marks the author mine, and re-reads when the user changes', async () => {
    const world = fakeCloud(SEED);
    let port = world.as();
    const repo: ListRepository = {
      ...world.lists,
      item: (id) => port.lists.item(id)
    };
    const view = new ItemView(repo, () => CATALOG);
    await view.open(ROLL_B, null);
    expect(view.mine).toBe(false);
    const record = view.record;
    port = world.as('gm3');
    await view.open(ROLL_B, null);
    expect(view.mine).toBe(false);
    await view.open(ROLL_B, SEED.users.gm3.id);
    expect(view.mine).toBe(true);
    /* An equal revision keeps the objects. */
    expect(view.record).toBe(record);
  });

  it('re-reads once when the user changes while the first read runs', async () => {
    const world = fakeCloud(SEED);
    let port = world.as();
    let reads = 0;
    const repo: ListRepository = {
      ...world.lists,
      item: (id) => {
        reads++;
        return port.lists.item(id);
      }
    };
    const view = new ItemView(repo, () => CATALOG);
    const first = view.open(ROLL_B, null);
    port = world.as('gm3');
    await view.open(ROLL_B, SEED.users.gm3.id);
    await first;
    expect(view.mine).toBe(true);
    expect(reads).toBe(2);
  });

  it('keeps the shown item on a failed re-read, and turns gone when the item goes', async () => {
    const world = fakeCloud(SEED, 'gm3');
    const view = new ItemView(world.as().lists, () => CATALOG);
    await view.open(ROLL_B, null);
    const record = view.record;
    world.setOffline(true);
    await view.refresh();
    expect([view.status, view.record]).toEqual(['ready', record]);
    world.setOffline(false);
    const c = SEED.homebrew.gm3.items.find((i) => i.id === ROLL_B)!;
    await world.homebrew.updateItem(
      ROLL_B,
      { content: { ...c.content, en: 'Ranger Roll' }, book_id: null },
      null
    );
    await view.refresh();
    expect(view.record).not.toBe(record);
    expect(view.record?.en).toBe('Ranger Roll');
    await world.homebrew.removeItem(ROLL_B);
    await view.refresh();
    expect([view.status, view.record]).toEqual(['gone', null]);
  });

  it('draws not found for an unknown id, and a failed read until «Повторить» answers', async () => {
    const world = fakeCloud(SEED);
    const view = new ItemView(world.as().lists, () => CATALOG);
    await view.open(uuid(9999), null);
    expect(view.status).toBe('gone');
    view.close();
    expect([view.status, view.id]).toEqual(['idle', null]);
    world.setOffline(true);
    await view.open(ROLL_B, null);
    expect(view.status).toBe('error');
    await view.refresh();
    expect(view.status).toBe('error');
    world.setOffline(false);
    await view.retry();
    expect(view.status).toBe('ready');
  });

  it("draws the author's relation lines over a reader who holds the same keys", async () => {
    /* The reader's own item of B's key, with no relations, in the reader's index. */
    const own = recordOf('hb_rangerrollaaaaaa', { kind: 'item', ru: 'Моя скатка' }, null);
    const readerIndex = withRecords(CATALOG, [own], []);
    const view = new ItemView(fakeCloud(SEED).as().lists, () => readerIndex);
    await view.open(ROLL_B, null);
    const index = view.index!;
    const it = index.byId.get('hb_rangerrollaaaaaa')!;
    expect(it.ru).toBe('Скатка следопыта');
    expect(keysOf(madeFrom(index, it))).toEqual(['hb_travelrollaaaaaa']);
    expect(keysOf(upgradesTo(index, it))).toEqual(['hb_sentryrollaaaaaa']);
  });

  it('builds one index over 300 related items', async () => {
    const related = Array.from({ length: 300 }, (_, i) => ({
      hid: uuid(30000 + i),
      key:
        'hb_rel' +
        String(i)
          .padStart(3, '0')
          .replace(/\d/g, (d) => 'abcdefghij'[Number(d)] ?? 'a') +
        'aaaaaaaaaa',
      kind: 'item',
      en: 'Piece ' + String(i),
      ru: 'Часть ' + String(i),
      set: 'hb_bigsetaaaaaaaaaa'
    }));
    const item = recordOf(
      'hb_bigpieceaaaaaaaa',
      { kind: 'item', ru: 'Часть', set: 'hb_bigsetaaaaaaaaaa' },
      null
    );
    const repo = {
      item: () =>
        Promise.resolve({
          ok: true as const,
          item: { hid: uuid(29999), mine: false, revision: 'r1', item, related }
        })
    } as unknown as ListRepository;
    const view = new ItemView(repo, () => CATALOG);
    await view.open(uuid(29999), null);
    expect(view.related).toHaveLength(300);
    const it = view.index!.byId.get('hb_bigpieceaaaaaaaa')!;
    expect(setOf(view.index!, it)).toHaveLength(301);
  });
});

describe('ItemView edges', () => {
  it('draws no index with no catalog, and names no id before a read', async () => {
    const view = new ItemView(fakeCloud(SEED).as().lists, () => null);
    expect([view.hid, view.index]).toEqual([null, null]);
    await view.refresh();
    await view.retry();
    expect(view.status).toBe('idle');
    await view.open(ROLL_B, null);
    expect(view.status).toBe('ready');
    expect(view.index).toBeNull();
    await view.retry();
    expect(view.status).toBe('ready');
  });

  it('drops the answer for an id the page left, read or re-read', async () => {
    const world = fakeCloud(SEED);
    const real = world.as().lists;
    let hold: (() => void) | null = null;
    const repo = {
      item: (id: string) =>
        new Promise<Awaited<ReturnType<ListRepository['item']>>>((resolve) => {
          hold = () => {
            void real.item(id).then(resolve);
          };
        })
    } as unknown as ListRepository;
    const view = new ItemView(repo, () => CATALOG);
    const first = view.open(ROLL_B, null);
    const firstHold = hold as unknown as () => void;
    const second = view.open(uuid(661), null);
    const secondHold = hold as unknown as () => void;
    firstHold();
    await first;
    expect(view.id).toBe(uuid(661));
    expect(view.status).toBe('loading');
    secondHold();
    await second;
    expect(view.record?.id).toBe('hb_travelrollaaaaaa');
    const again = view.refresh();
    const againHold = hold as unknown as () => void;
    view.close();
    againHold();
    await again;
    expect([view.status, view.record]).toEqual(['idle', null]);
  });
});
