import { describe, expect, it } from 'vitest';
import {
  entryOrder,
  entryRowsOf,
  isCloudId,
  limitText,
  priceOf,
  quantityOf,
  sharedListOf,
  shareOf,
  toCloudList,
  type EntryRow,
  type ListRow,
  type SharedRow,
  type ShareRow
} from './cloudLists.js';
import { dict } from './dict.js';

const entry = (id: string, key: string, position: number, over: Partial<EntryRow> = {}) => ({
  id,
  item_key: key,
  source: 'official' as const,
  snapshot: null,
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
});

const sharedEntry = (key: string, position: number, over: Partial<EntryRow> = {}) => {
  const { gm_note, ...rest } = entry('e' + String(position), key, position, over);
  return over.gm_note === undefined ? rest : { ...rest, gm_note };
};

const known = (id: string): boolean => id !== 'gone';

describe('sharedListOf', () => {
  const player: SharedRow = {
    audience: 'player',
    updated_at: '2026-09-22T10:00:00.000Z',
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
