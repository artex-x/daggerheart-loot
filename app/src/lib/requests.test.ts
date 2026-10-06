import { describe, expect, it } from 'vitest';
import { dict } from './dict.js';
import {
  ageText,
  pendingFor,
  readApplied,
  readRequests,
  requestRefusal,
  requestTotal,
  shortText,
  whoText,
  type OwnerRequest,
  noticeName,
  noticeOf
} from './requests.js';

const LIST = '00000000-0000-4000-8000-000000000101';
const OTHER = '00000000-0000-4000-8000-000000000102';
const NOW = Date.parse('2026-09-27T12:00:00Z');
const iso = (ms: number): string => new Date(ms).toISOString();
const MIN = 60_000;

const row = (over: Record<string, unknown> = {}) => ({
  id: 'r1',
  list_id: LIST,
  audience: 'gm',
  created_at: '2026-09-27T11:50:00+00:00',
  expires_at: '2026-09-27T12:50:00+00:00',
  read_at: '2026-09-27T11:50:00+00:00',
  purchase_request_lines: [
    { item_key: 'q1', quantity: 1, price_coins: null, applied_quantity: null },
    { item_key: 'cc1', quantity: 9, price_coins: 20, applied_quantity: 0 }
  ],
  ...over
});

const req = (over: Partial<OwnerRequest> = {}): OwnerRequest => ({
  id: 'r1',
  listId: LIST,
  audience: 'player',
  createdAt: iso(NOW - 10 * MIN),
  expiresAt: iso(NOW + 50 * MIN),
  readAt: iso(NOW - 10 * MIN),
  lines: [],
  ...over
});

describe('readRequests', () => {
  it('reads each row with its lines by item', () => {
    expect(readRequests([row()])).toEqual([
      {
        id: 'r1',
        listId: LIST,
        audience: 'gm',
        createdAt: '2026-09-27T11:50:00+00:00',
        expiresAt: '2026-09-27T12:50:00+00:00',
        readAt: '2026-09-27T11:50:00+00:00',
        lines: [
          { item: 'cc1', qty: 9, price: 20, applied: 0 },
          { item: 'q1', qty: 1, price: null, applied: null }
        ]
      }
    ]);
  });

  it('reads an unread row, and one with no read_at, as unread', () => {
    expect(readRequests([row({ read_at: null })])?.[0]?.readAt).toBeNull();
    const older: Record<string, unknown> = row();
    delete older['read_at'];
    expect(readRequests([older])?.[0]?.readAt).toBeNull();
  });

  it('skips a row of another shape and answers null for no array', () => {
    const bad = [
      null,
      row({ id: 5 }),
      row({ list_id: 'l1' }),
      row({ audience: 'owner' }),
      row({ created_at: 1 }),
      row({ expires_at: null }),
      row({ read_at: 7 }),
      row({ purchase_request_lines: null }),
      row({ purchase_request_lines: [{ item_key: 'q1', quantity: 0 }] }),
      row({ purchase_request_lines: ['x'] }),
      row({
        purchase_request_lines: [
          { item_key: 'q1', quantity: 1, price_coins: -1, applied_quantity: null }
        ]
      }),
      row({
        purchase_request_lines: [
          { item_key: 'q1', quantity: 1, price_coins: null, applied_quantity: 'x' }
        ]
      }),
      row({ purchase_request_lines: [{ item_key: 2, quantity: 1 }] })
    ];
    expect(readRequests([...bad, row({ id: 'ok' })])?.map((r) => r.id)).toEqual(['ok']);
    expect(readRequests({})).toBeNull();
    expect(readRequests(null)).toBeNull();
  });
});

describe('readApplied', () => {
  it('reads the count taken and the short lines', () => {
    expect(readApplied({ applied: true, taken: 0 })).toEqual({ ok: true, taken: 0 });
    expect(readApplied({ short: [{ item: 'cc1', want: 9, have: 5 }] })).toEqual({
      ok: false,
      error: 'short',
      short: [{ item: 'cc1', want: 9, have: 5 }]
    });
  });

  it('answers null for any other shape', () => {
    for (const data of [
      null,
      [],
      { applied: true, taken: -1 },
      { applied: true, taken: 1.5 },
      { applied: false },
      { short: [] },
      { short: 'x' },
      { short: [null] },
      { short: [{ item: 1, want: 1, have: 0 }] },
      { short: [{ item: 'a', want: '1', have: 0 }] }
    ]) {
      expect(readApplied(data)).toBeNull();
    }
  });
});

describe('requestRefusal', () => {
  it('reads the request functions own refusals', () => {
    expect(requestRefusal('P0002', 'request: unknown link')).toBe('gone');
    expect(requestRefusal('P0002', undefined)).toBe('gone');
    expect(requestRefusal('42501', 'request: not the owner of the request')).toBe('gone');
    expect(requestRefusal('22023', 'request: stale')).toBe('stale');
    expect(requestRefusal('22023', 'request: decided')).toBe('decided');
    expect(requestRefusal('22023', 'request: expired')).toBe('expired');
  });

  it('leaves every other answer to the write rules', () => {
    expect(requestRefusal('42501', 'permission denied for function x')).toBeNull();
    expect(requestRefusal('22023', 'request: bad lines')).toBeNull();
    expect(requestRefusal('P0001', 'limit: request_rate')).toBeNull();
    expect(requestRefusal(undefined, undefined)).toBeNull();
  });
});

describe('pendingFor', () => {
  it("answers the list's unexpired requests, newest first, then the greater id", () => {
    const all = [
      req({ id: 'old', createdAt: iso(NOW - 30 * MIN) }),
      req({ id: 'b' }),
      req({ id: 'a' }),
      req({ id: 'gone', expiresAt: iso(NOW) }),
      req({ id: 'other', listId: OTHER }),
      req({ id: 'new', createdAt: iso(NOW - MIN) })
    ];
    expect(pendingFor(all, LIST, NOW).map((r) => r.id)).toEqual(['new', 'b', 'a', 'old']);
  });
});

describe('requestTotal', () => {
  it('sums the priced lines and counts the rest', () => {
    expect(
      requestTotal([
        { item: 'ci1', qty: 2, price: 150, applied: null },
        { item: 'q1', qty: 1, price: null, applied: null },
        { item: 'cc1', qty: 3, price: 20, applied: null }
      ])
    ).toEqual({ coins: 360, unpriced: 1 });
    expect(requestTotal([])).toEqual({ coins: 0, unpriced: 0 });
  });
});

describe('whoText and ageText', () => {
  const ru = dict('ru');
  const en = dict('en');

  it('names the link, the age and the time left', () => {
    expect(whoText(req(), NOW, 'ru', ru)).toBe(
      'По ссылке для игроков · 10 минут назад · истечёт через 50 минут'
    );
    expect(whoText(req({ audience: 'gm' }), NOW, 'en', en)).toBe(
      'Through the GM link · 10 minutes ago · expires in 50 minutes'
    );
  });

  it('says just now under a minute or in the future, and keeps the minutes left in 1..60', () => {
    const young = req({ createdAt: iso(NOW + 5 * MIN), expiresAt: iso(NOW + 65 * MIN) });
    expect(whoText(young, NOW, 'ru', ru)).toBe(
      'По ссылке для игроков · только что · истечёт через 60 минут'
    );
    const late = req({ expiresAt: iso(NOW + 10_000) });
    expect(whoText(late, NOW, 'en', en)).toBe(
      "Through the players' link · 10 minutes ago · expires in 1 minute"
    );
    expect(ageText(req({ createdAt: iso(NOW - 30_000) }), NOW, 'en', en)).toBe(
      "Through the players' link · just now"
    );
  });

  it('names no time left for an unread request, which has days', () => {
    const unread = req({ readAt: null, expiresAt: iso(NOW + 30 * 24 * 60 * MIN) });
    expect(whoText(unread, NOW, 'ru', ru)).toBe('По ссылке для игроков · 10 минут назад');
    expect(whoText(unread, NOW, 'en', en)).toBe("Through the players' link · 10 minutes ago");
  });
});

describe('shortText', () => {
  it('names each short line with the count asked and the stock', () => {
    const names: Record<string, string> = { cc1: 'Зелье', q1: 'Палаш' };
    expect(
      shortText(
        [
          { item: 'cc1', want: 9, have: 5 },
          { item: 'q1', want: 1, have: 0 }
        ],
        (id) => names[id] ?? id,
        dict('ru')
      )
    ).toBe(
      'Не хватает: Зелье - просят 9, есть 5, Палаш - просят 1, есть 0. Ничего не списано.'
    );
  });
});

describe('noticeOf', () => {
  const row = (over: Record<string, unknown> = {}) => ({
    id: '00000000-0000-4000-8000-000000000681',
    list_id: '00000000-0000-4000-8000-000000000201',
    item_key: 'hb_emberaxeaaaaaaaa',
    hid: '00000000-0000-4000-8000-000000000511',
    kind: 'changed',
    name: { en: 'Ember Axe', ru: 'Топор' },
    created_at: '2026-10-07T10:00:00Z',
    read_at: null,
    ...over
  });

  it('reads a row, a deleted one and a name in one language', () => {
    expect(noticeOf(row())).toEqual({
      id: '00000000-0000-4000-8000-000000000681',
      listId: '00000000-0000-4000-8000-000000000201',
      itemKey: 'hb_emberaxeaaaaaaaa',
      hid: '00000000-0000-4000-8000-000000000511',
      kind: 'changed',
      name: { en: 'Ember Axe', ru: 'Топор' },
      createdAt: '2026-10-07T10:00:00Z',
      readAt: null
    });
    const gone = noticeOf(
      row({ hid: null, kind: 'deleted', name: { en: 'Axe' }, read_at: '2026-10-07T11:00:00Z' })
    );
    expect(gone).toMatchObject({ hid: null, kind: 'deleted', name: { en: 'Axe', ru: '' } });
    expect(noticeName(gone!, 'ru')).toBe('Axe');
    expect(noticeName(noticeOf(row())!, 'ru')).toBe('Топор');
    expect(noticeName(noticeOf(row())!, 'en')).toBe('Ember Axe');
  });

  it('refuses a row of another shape', () => {
    for (const bad of [
      null,
      row({ id: 'x' }),
      row({ list_id: 'x' }),
      row({ item_key: 'a b' }),
      row({ hid: 'x' }),
      row({ kind: 'edited' }),
      row({ name: {} }),
      row({ name: 'Axe' }),
      row({ created_at: 'yesterday' }),
      row({ read_at: 5 })
    ]) {
      expect(noticeOf(bad), JSON.stringify(bad)).toBeNull();
    }
  });
});
