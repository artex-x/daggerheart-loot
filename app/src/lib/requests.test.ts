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
  type OwnerRequest
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
        lines: [
          { item: 'cc1', qty: 9, price: 20, applied: 0 },
          { item: 'q1', qty: 1, price: null, applied: null }
        ]
      }
    ]);
  });

  it('skips a row of another shape and answers null for no array', () => {
    const bad = [
      null,
      row({ id: 5 }),
      row({ list_id: 'l1' }),
      row({ audience: 'owner' }),
      row({ created_at: 1 }),
      row({ expires_at: null }),
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
