import { describe, expect, it } from 'vitest';
import {
  BATCH_BYTES,
  batchSize,
  entryOrder,
  entryRowsOf,
  entrySource,
  isCloudId,
  limitText,
  linkedOf,
  linkedRecords,
  OFFICIAL,
  priceOf,
  quantityOf,
  sameProjection,
  sharedListOf,
  shareOf,
  snapshotRecords,
  toCloudList,
  type EntryRow,
  type ListOp,
  type ListRow,
  type SharedRow,
  type ShareRow,
  itemOf
} from './cloudLists.js';
import { dict } from './dict.js';
import { recordOf } from './homebrew.js';

const entry = (id: string, key: string, position: number, over: Partial<EntryRow> = {}) => ({
  id,
  item_key: key,
  source: 'official' as const,
  hb_item: null,
  position,
  quantity: 1,
  price_coins: null,
  player_note: '',
  gm_note: '',
  ...over
});

const row = (over: Partial<ListRow> = {}): ListRow => ({
  id: '00000000-0000-4000-8000-000000000101',
  name: 'Лавка',
  money_mode: 'bag',
  player_note: '',
  gm_note: '',
  created_at: '2026-09-20T10:00:00.000Z',
  updated_at: '2026-09-22T10:00:00.000Z',
  revision: 1,
  legacy_fingerprint: null,
  list_entries: [],
  ...over
});

describe('isCloudId', () => {
  it('knows a UUID from a local list id', () => {
    expect(isCloudId('00000000-0000-4000-8000-000000000101')).toBe(true);
    expect(isCloudId('9b2f4c1e-8d3a-4f6b-a1c2-3d4e5f6a7b8c')).toBe(true);
    expect(isCloudId('l1a2b3c4')).toBe(false);
    expect(isCloudId('a')).toBe(false);
    expect(isCloudId('9B2F4C1E-8D3A-4F6B-A1C2-3D4E5F6A7B8C')).toBe(false);
  });
});

describe('toCloudList', () => {
  it('orders the entries by position, then by id', () => {
    const l = toCloudList(
      row({
        list_entries: [entry('c', 'q3', 1), entry('b', 'q2', 0), entry('a', 'q1', 1)]
      })
    );
    expect(l.ids).toEqual(['q2', 'q1', 'q3']);
    expect(l.entryIds).toEqual({ q2: 'b', q1: 'a', q3: 'c' });
    expect(entryOrder(entry('a', 'x', 0), entry('a', 'y', 0))).toBe(0);
  });

  it('keeps a quantity above 1, a price and the notes, and leaves no key for none', () => {
    const l = toCloudList(
      row({
        list_entries: [
          entry('a', 'q1', 0, { quantity: 3, price_coins: 20, player_note: 'p', gm_note: 'g' }),
          entry('b', 'q2', 1)
        ]
      })
    );
    expect(l.meta).toEqual({ q1: { qty: 3, gold: 20, note: 'p', hnote: 'g' } });
    expect(l).not.toHaveProperty('money');
    expect(l).not.toHaveProperty('note');
    expect(l).not.toHaveProperty('hnote');
    expect(toCloudList(row())).not.toHaveProperty('meta');
  });

  it('keeps a GM-only mark, and no key for a shown entry', () => {
    const l = toCloudList(
      row({
        list_entries: [
          entry('a', 'q1', 0, { gm_only: true }),
          entry('b', 'q2', 1, { gm_only: false })
        ]
      })
    );
    expect(l.meta).toEqual({ q1: { gmOnly: true } });
  });

  it('keeps the money mode only for coins, the list notes, and both times in ms', () => {
    const l = toCloudList(row({ money_mode: 'coin', player_note: 'p', gm_note: 'g' }));
    expect(l).toMatchObject({
      name: 'Лавка',
      money: 'coin',
      note: 'p',
      hnote: 'g',
      created: Date.parse('2026-09-20T10:00:00.000Z'),
      updated: Date.parse('2026-09-22T10:00:00.000Z')
    });
  });
});

describe('entryRowsOf', () => {
  it('numbers the positions from `from` and carries the meta into the columns', () => {
    let n = 0;
    const rows = entryRowsOf(
      ['q1', 'q2'],
      { q1: { qty: 150, gold: 123456, note: 'p', hnote: 'g' } },
      () => 'id' + String(n++),
      4
    );
    expect(rows).toEqual([
      entry('id0', 'q1', 4, {
        quantity: 99,
        price_coins: 99999,
        player_note: 'p',
        gm_note: 'g'
      }),
      entry('id1', 'q2', 5)
    ]);
    expect(entryRowsOf(['q1'], undefined, () => 'x')[0]?.position).toBe(0);
  });

  it('writes gm_only only for a GM-only entry, and no key for a shown one', () => {
    const rows = entryRowsOf(['q1', 'q2'], { q1: { gmOnly: true }, q2: { qty: 2 } }, () => 'x');
    expect(rows[0]).toEqual(entry('x', 'q1', 0, { gm_only: true }));
    expect(rows[1]).toEqual(entry('x', 'q2', 1, { quantity: 2 }));
    expect('gm_only' in (rows[1] ?? {})).toBe(false);
  });

  it('leaves a homebrew key out and numbers the rest without a gap', () => {
    const rows = entryRowsOf(['hb_emberaxeaaaaaaaa', 'q1'], undefined, () => 'x', 2);
    expect(rows.map((r) => [r.item_key, r.position])).toEqual([['q1', 2]]);
  });

  it('holds a quantity to 1..99 and a price to none or 1..99999', () => {
    expect([quantityOf(undefined), quantityOf(0), quantityOf(2.7), quantityOf(500)]).toEqual([
      1, 1, 2, 99
    ]);
    expect([priceOf(undefined), priceOf(0), priceOf(-5), priceOf(12), priceOf(1e6)]).toEqual([
      null,
      null,
      null,
      12,
      99999
    ]);
  });
});

describe('limitText', () => {
  it('names the list and the entry limit, any other limit, and the number', () => {
    const t = dict('en');
    expect(limitText('lists_per_owner', 50, t)).toBe(
      'You have reached the limit of 50 lists. Need more? Write to daggerheart.loot@gmail.com.'
    );
    expect(limitText('entries_per_list', 100, dict('ru'))).toBe(
      'Достигнут предел позиций в списке: 100. Нужно больше - напишите на daggerheart.loot@gmail.com.'
    );
    expect(limitText('homebrew_items', null, t)).toBe(
      'A limit has been reached: ?. Need more? Write to daggerheart.loot@gmail.com.'
    );
  });

  it('says the removed frozen-copy byte limit as any other limit', () => {
    expect(limitText('snapshot_bytes_per_list', 1048576, dict('en'))).toBe(
      'A limit has been reached: 1048576. Need more? Write to daggerheart.loot@gmail.com.'
    );
  });

  it('names the homebrew item and source limits', () => {
    const t = dict('ru');
    expect(limitText('homebrew_items_per_owner', 100, t)).toBe(
      'Достигнут предел своих предметов: 100. Нужно больше - напишите на daggerheart.loot@gmail.com.'
    );
    expect(limitText('homebrew_books_per_owner', 20, dict('en'))).toBe(
      'You have reached the limit of 20 sources. Need more? Write to daggerheart.loot@gmail.com.'
    );
    expect(limitText('homebrew_cards_per_owner', 100, t)).toBe(
      'Достигнут предел карт (комплектов и карт правил): 100. Нужно больше - напишите на daggerheart.loot@gmail.com.'
    );
    expect(limitText('homebrew_cards_per_owner', 100, dict('en'))).toBe(
      'You have reached the limit of 100 cards (sets and rule cards). Need more? Write to daggerheart.loot@gmail.com.'
    );
  });
});

type SharedEntry = SharedRow['entries'][number];
const sharedEntry = (
  key: string,
  position: number,
  over: Partial<SharedEntry> = {}
): SharedEntry => {
  const {
    id,
    item_key,
    source,
    position: at,
    quantity,
    price_coins,
    player_note
  } = entry('e' + String(position), key, position);
  return {
    id,
    item_key,
    source,
    position: at,
    quantity,
    price_coins,
    player_note,
    snapshot: null,
    ...over
  };
};

const known = (id: string): boolean => id !== 'gone';

describe('sharedListOf', () => {
  const player: SharedRow = {
    audience: 'player',
    updated_at: '2026-09-22T10:00:00.000Z',
    revision: 1,
    topic_key: '00000000-0000-4000-8000-000000004000',
    list: { name: 'Лавка', money_mode: 'coin', player_note: 'p' },
    entries: [
      sharedEntry('q1', 0, { quantity: 2, price_coins: 150, player_note: 'a' }),
      sharedEntry('gone', 1),
      sharedEntry('ci1', 2)
    ]
  };

  it('keeps the players notes and no GM note on a player link', () => {
    const d = sharedListOf(player, known);
    expect(d).toEqual({
      name: 'Лавка',
      ids: ['q1', 'ci1'],
      dropped: 1,
      money: 'coin',
      note: 'p',
      meta: { q1: { qty: 2, gold: 150, note: 'a' } }
    });
    expect('hnote' in d).toBe(false);
  });

  it('keeps both notes on a GM link', () => {
    const d = sharedListOf(
      {
        ...player,
        audience: 'gm',
        list: { name: 'Лавка', money_mode: 'bag', player_note: 'p', gm_note: 'g' },
        entries: [sharedEntry('ci1', 0, { gm_note: 'h' }), sharedEntry('q1', 1)]
      },
      known
    );
    expect(d).toEqual({
      name: 'Лавка',
      ids: ['ci1', 'q1'],
      dropped: 0,
      note: 'p',
      hnote: 'g',
      meta: { ci1: { hnote: 'h' } }
    });
    expect('money' in d).toBe(false);
  });

  it("carries a GM link's GM-only mark into the meta, and none for a shown entry", () => {
    const d = sharedListOf(
      {
        ...player,
        audience: 'gm',
        entries: [
          sharedEntry('ci1', 0, { gm_only: true }),
          sharedEntry('q1', 1, { gm_only: false })
        ]
      },
      known
    );
    expect(d.meta).toEqual({ ci1: { gmOnly: true } });
    expect(JSON.stringify(sharedListOf(player, known))).not.toContain('gmOnly');
  });
});

describe('shareOf', () => {
  const share = (id: string, audience: 'player' | 'gm', stopped: boolean): ShareRow => ({
    id,
    audience,
    token: 'token-' + id,
    created_at: '2026-09-20T10:00:00.000Z',
    revoked_at: stopped ? '2026-09-21T10:00:00.000Z' : null
  });

  it('answers the active share over the stopped ones', () => {
    expect(
      shareOf([share('a', 'player', true), share('b', 'player', false)], 'player')
    ).toEqual({ id: 'b', token: 'token-b' });
  });

  it('answers stopped when every row of the audience is stopped', () => {
    expect(shareOf([share('a', 'gm', true), share('b', 'player', false)], 'gm')).toBe(
      'stopped'
    );
  });

  it('answers none when the audience has no row, the other audience ignored', () => {
    expect(shareOf([share('a', 'player', false)], 'gm')).toBe('none');
    expect(shareOf([], 'player')).toBe('none');
  });
});

describe('batchSize', () => {
  /* One write's size in the request: its JSON in UTF-8, and a comma. */
  const note = (text: string): ListOp => ({
    op: 'update',
    id: 'l1',
    patch: { player_note: text }
  });
  const size = (op: ListOp): number => new TextEncoder().encode(JSON.stringify(op)).length + 1;

  it('answers every write when they fit', () => {
    expect(batchSize([note('a'), note('b'), note('c')])).toBe(3);
    expect(batchSize([])).toBe(0);
  });

  it('stops before the write that would pass 60 000 bytes', () => {
    const big = note('a'.repeat(29_000));
    expect(2 * size(big)).toBeLessThanOrEqual(BATCH_BYTES);
    expect(3 * size(big)).toBeGreaterThan(BATCH_BYTES);
    expect(batchSize([big, big, big, note('b')])).toBe(2);
  });

  it('counts a Cyrillic text in UTF-8 bytes', () => {
    const cyrillic = note('я'.repeat(20_000));
    expect(size(cyrillic)).toBeGreaterThan(40_000);
    expect(batchSize([cyrillic, cyrillic])).toBe(1);
    expect(batchSize([note('a'.repeat(20_000)), note('a'.repeat(20_000))])).toBe(2);
  });

  it('answers 1 for a first write over 60 000 bytes', () => {
    expect(batchSize([note('a'.repeat(70_000)), note('b')])).toBe(1);
  });

  it('stops at 200 writes', () => {
    expect(batchSize(Array.from({ length: 250 }, () => note('a')))).toBe(200);
  });
});

describe('sameProjection', () => {
  const base: SharedRow = {
    audience: 'player',
    updated_at: '2026-09-22T10:00:00.000Z',
    revision: 1,
    topic_key: '00000000-0000-4000-8000-000000004000',
    list: { name: 'Лавка', money_mode: 'bag', player_note: '' },
    entries: []
  };

  it('holds when only the revision, the time or the topic key moved', () => {
    expect(
      sameProjection(base, {
        ...base,
        revision: 2,
        updated_at: '2026-09-23T10:00:00.000Z',
        topic_key: '00000000-0000-4000-8000-000000004001'
      })
    ).toBe(true);
  });

  it('fails when the audience, the list or an entry changed', () => {
    expect(sameProjection(base, { ...base, audience: 'gm' })).toBe(false);
    expect(sameProjection(base, { ...base, list: { ...base.list, name: 'Другая' } })).toBe(
      false
    );
    expect(
      sameProjection(base, {
        ...base,
        entries: [sharedEntry('ci1', 0)]
      })
    ).toBe(false);
  });
});

describe('homebrew entries', () => {
  const AXE = 'hb_emberaxeaaaaaaaa';
  const copy = recordOf(AXE, { kind: 'item', ru: 'Топор' }, null);
  const HID = '00000000-0000-4000-8000-000000000511';
  const MINE = '00000000-0000-4000-8000-000000000512';
  const linked = { ...copy, hid: HID };
  const ready = {
    ready: true,
    has: (k: string) => k === 'hb_mineaaaaaaaaaaaa',
    hidOf: (k: string) => (k === 'hb_mineaaaaaaaaaaaa' ? MINE : null)
  };

  it("links a catalog key as official, an own item by its id, another account's record by its hid, and nothing else", () => {
    expect(
      entrySource('q1', { ready: false, has: () => false, hidOf: () => null }, undefined)
    ).toBe(OFFICIAL);
    expect(entrySource('hb_mineaaaaaaaaaaaa', ready, undefined)).toEqual({
      source: 'homebrew',
      hb_item: MINE
    });
    expect(entrySource(AXE, ready, linked)).toEqual({ source: 'homebrew', hb_item: HID });
    expect(entrySource(AXE, ready, undefined)).toBeNull();
    /* A record with no id, of another key, or a catalog record is never written. */
    expect(entrySource(AXE, ready, copy)).toBeNull();
    expect(entrySource(AXE, ready, { ...linked, id: 'hb_otheraaaaaaaaaaa' })).toBeNull();
    expect(entrySource(AXE, ready, { ...linked, src: 'core' })).toBeNull();
  });

  it('answers null for every homebrew key while the account items are not read', () => {
    const loading = { ready: false, has: () => true, hidOf: () => MINE };
    expect(entrySource('hb_mineaaaaaaaaaaaa', loading, undefined)).toBeNull();
    expect(entrySource(AXE, loading, linked)).toBeNull();
  });

  it('writes each row as the resolver answers and leaves a refused key out', () => {
    const rows = entryRowsOf(
      ['q1', AXE, 'hb_mineaaaaaaaaaaaa', 'q2'],
      undefined,
      () => 'x',
      0,
      (k) => entrySource(k, ready, k === AXE ? linked : undefined)
    );
    expect(rows.map((r) => [r.item_key, r.source, r.hb_item, r.position])).toEqual([
      ['q1', 'official', null, 0],
      [AXE, 'homebrew', HID, 1],
      ['hb_mineaaaaaaaaaaaa', 'homebrew', MINE, 2],
      ['q2', 'official', null, 3]
    ]);
    expect(
      entryRowsOf(
        [AXE],
        undefined,
        () => 'x',
        0,
        () => null
      )
    ).toEqual([]);
  });

  it('reads the item each homebrew entry links into `links`, and no record into `linked`', () => {
    const l = toCloudList(
      row({
        list_entries: [
          entry('a', AXE, 0, { source: 'homebrew', hb_item: HID }),
          entry('c', 'hb_mineaaaaaaaaaaaa', 1, { source: 'homebrew', hb_item: MINE }),
          entry('d', 'q1', 2)
        ]
      })
    );
    expect(l.ids).toEqual([AXE, 'hb_mineaaaaaaaaaaaa', 'q1']);
    expect(l.links).toEqual({ [AXE]: HID, hb_mineaaaaaaaaaaaa: MINE });
    expect(l.linked).toBeUndefined();
    expect(toCloudList(row()).links).toBeUndefined();
    expect(linkedOf(l)).toBe(linkedOf({ id: 'x', name: '', ids: [] }));
    expect(linkedOf({ id: 'x', name: '', ids: [] })).toEqual({});
    const withLinked = { ...l, linked: { [AXE]: linked } };
    expect(linkedOf(withLinked)).toBe(withLinked.linked);
  });

  it('reads the valid records of an items() answer by id, each with its hid', () => {
    const got = linkedRecords([
      { hid: HID, item: copy },
      { hid: MINE, item: { id: 1 } }
    ]);
    expect([...got.entries()]).toEqual([[HID, linked]]);
  });

  it("returns a projection's valid snapshots, each with its entry's hid", () => {
    const shared: SharedRow = {
      audience: 'player',
      updated_at: '2026-09-22T10:00:00.000Z',
      revision: 1,
      topic_key: '00000000-0000-4000-8000-000000004000',
      list: { name: 'Лавка', money_mode: 'bag', player_note: '' },
      entries: [
        sharedEntry('q1', 0),
        sharedEntry(AXE, 1, { source: 'homebrew', snapshot: copy, hid: HID }),
        sharedEntry('hb_brokenaaaaaaaaaa', 2, { source: 'homebrew', snapshot: copy })
      ]
    };
    expect(snapshotRecords(shared)).toEqual([linked]);
    expect(snapshotRecords(null)).toEqual([]);
  });
});

describe('itemOf', () => {
  const HID = '00000000-0000-4000-8000-000000000662';
  const REL = '00000000-0000-4000-8000-000000000661';
  const item = recordOf(
    'hb_rangerrollaaaaaa',
    { kind: 'item', ru: 'Скатка', craft_from: ['hb_travelrollaaaaaa'] },
    null
  );
  const answer = (over: Record<string, unknown> = {}) => ({
    hid: HID,
    mine: false,
    revision: 'r1',
    item,
    related: [
      {
        hid: REL,
        key: 'hb_travelrollaaaaaa',
        kind: 'item',
        en: 'Roll',
        ru: 'Скатка путника',
        craft: ['hb_rangerrollaaaaaa']
      },
      {
        hid: REL,
        key: 'hb_bladeaaaaaaaaaaa',
        kind: 'equip',
        en: 'Blade',
        ru: 'Клинок',
        eq: { t: 'weapon', tier: 2, line: 'q1' },
        tier: 'A'
      }
    ],
    updated_at: '2026-10-07T10:00:00Z',
    ...over
  });

  it('reads the record with its id and each related item as a record', () => {
    const read = itemOf(answer());
    expect(read?.record).toEqual({ ...item, hid: HID });
    expect(read?.mine).toBe(false);
    expect(read?.revision).toBe('r1');
    expect(read?.related).toEqual([
      {
        id: 'hb_travelrollaaaaaa',
        src: 'homebrew',
        hid: REL,
        kind: 'item',
        en: 'Roll',
        ru: 'Скатка путника',
        ende: '',
        rud: '',
        craft: ['hb_rangerrollaaaaaa']
      },
      {
        id: 'hb_bladeaaaaaaaaaaa',
        src: 'homebrew',
        hid: REL,
        kind: 'equip',
        en: 'Blade',
        ru: 'Клинок',
        ende: '',
        rud: '',
        tier: 'A',
        eq: { t: 'weapon', tier: 2, line: 'q1' }
      }
    ]);
  });

  it('drops a related row of another shape', () => {
    const bad = [
      null,
      { hid: REL, key: 'q1', kind: 'item', en: 'A', ru: 'А' },
      { hid: 'x', key: 'hb_travelrollaaaaaa', kind: 'item', en: 'A', ru: 'А' },
      { hid: REL, key: 'hb_travelrollaaaaaa', kind: 'weapon', en: 'A', ru: 'А' },
      { hid: REL, key: 'hb_travelrollaaaaaa', kind: 'item', en: 1, ru: 'А' }
    ];
    expect(itemOf(answer({ related: bad }))?.related).toEqual([]);
    expect(itemOf(answer({ related: 'none' }))?.related).toEqual([]);
  });

  it('answers null for anything that is not an item answer', () => {
    for (const a of [
      null,
      [],
      answer({ hid: 'not-a-uuid' }),
      answer({ mine: 'no' }),
      answer({ revision: 3 }),
      answer({ item: { ...item, id: 'q1' } }),
      answer({ item: null })
    ]) {
      expect(itemOf(a), JSON.stringify(a)).toBeNull();
    }
  });
});
