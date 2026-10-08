import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { linkedRecords, snapshotRecords, type SharedRow } from './cloudLists.js';
import { dict } from './dict.js';
import { recordOf, type HomebrewRecord } from './homebrew.js';
import {
  PRINT_SET_DAYS,
  PRINT_SET_ID,
  printEntriesValid,
  printSetEntries,
  readPrintSet
} from './printSet.js';
import type { Record_ } from './types.js';

const HID = '00000000-0000-4000-8000-000000000511';
const HID2 = '00000000-0000-4000-8000-000000000512';
const AXE = 'hb_emberaxeaaaaaaaa';
const CONTENT = { kind: 'item' as const, ru: 'Топор', en: 'Axe' };
const catalog = (id: string): Record_ => ({
  id,
  src: 'core',
  kind: 'item',
  en: id,
  ende: '',
  ru: id,
  rud: ''
});
const record = (hid?: string): HomebrewRecord => recordOf(AXE, CONTENT, null, [], hid);
const many = (n: number): Record_[] =>
  Array.from({ length: n }, (_, i) => catalog('ci' + String(i)));

describe('printSetEntries', () => {
  it('stores a catalog record by its id and a homebrew record of each source by its item id', () => {
    const own = record(HID);
    const [linked] = linkedRecords([{ hid: HID, item: record() }]).values();
    const row: SharedRow = {
      audience: 'player',
      updated_at: '2026-10-14T10:00:00Z',
      revision: 1,
      topic_key: HID2,
      list: { name: 'L', money_mode: 'bag', player_note: '' },
      entries: [
        {
          id: HID2,
          item_key: AXE,
          source: 'homebrew',
          position: 0,
          quantity: 1,
          price_coins: null,
          player_note: '',
          snapshot: record(),
          hid: HID
        }
      ]
    };
    const [shared] = snapshotRecords(row);
    /* The item view's record: the read's record with its id beside it. */
    const viewed: HomebrewRecord = { ...record(), hid: HID };
    for (const it of [own, linked, shared, viewed]) {
      expect(printSetEntries([catalog('ci1'), it as Record_], {})).toEqual({
        entries: [{ k: 'ci1' }, { h: HID }],
        cut: 0
      });
    }
  });

  it('leaves a count of 1 off, clamps 150 to 99 and keeps the first of a repeat', () => {
    expect(
      printSetEntries([catalog('ci1'), catalog('ci2'), catalog('ci3'), catalog('ci1')], {
        ci1: 1,
        ci2: 150,
        ci3: 3
      })
    ).toEqual({ entries: [{ k: 'ci1' }, { k: 'ci2', q: 99 }, { k: 'ci3', q: 3 }], cut: 0 });
    expect(printSetEntries([record(HID), record(HID)], {}).entries).toEqual([{ h: HID }]);
  });

  it('cuts past 180 and counts the cut', () => {
    expect(printSetEntries(many(180), {})).toMatchObject({ cut: 0 });
    expect(printSetEntries(many(181), {}).entries).toHaveLength(180);
    expect(printSetEntries(many(181), {}).cut).toBe(1);
    expect(printSetEntries(many(300), {}).cut).toBe(120);
  });

  it('leaves out a homebrew record with no item id', () => {
    expect(printSetEntries([record(), catalog('ci1')], {})).toEqual({
      entries: [{ k: 'ci1' }],
      cut: 0
    });
  });
});

describe('printEntriesValid', () => {
  it('takes the shape create_print_set takes', () => {
    expect(
      printEntriesValid([
        { k: 'ci1', q: 2 },
        { h: HID, q: 99 }
      ])
    ).toBe(true);
    expect(
      printEntriesValid(Array.from({ length: 180 }, (_, i) => ({ k: 'c' + String(i) })))
    ).toBe(true);
  });

  it('refuses each shape the database refuses, but the byte bound', () => {
    const bad: unknown[] = [
      null,
      'ci1',
      [],
      Array.from({ length: 181 }, (_, i) => ({ k: 'c' + String(i) })),
      [null],
      [['ci1']],
      [{ k: 'ci1', x: 1 }],
      [{ k: 'ci1', h: HID }],
      [{ q: 2 }],
      [{ k: 1 }],
      [{ k: 'CI1' }],
      [{ k: 'hb_emberaxeaaaaaaaa' }],
      [{ h: 'ABCDEF00-0000-4000-8000-000000000001' }],
      [{ k: 'ci1', q: 1 }],
      [{ k: 'ci1', q: 100 }],
      [{ k: 'ci1', q: 2.5 }],
      [{ k: 'ci1', q: '3' }],
      [{ k: 'ci1' }, { k: 'ci1', q: 2 }],
      [{ h: HID }, { h: HID }]
    ];
    for (const v of bad) expect(printEntriesValid(v), JSON.stringify(v)).toBe(false);
  });
});

describe('readPrintSet', () => {
  const knows = (id: string): boolean => id.startsWith('ci');

  it('is null for an answer that is not one', () => {
    for (const v of [
      null,
      'set',
      [],
      { entries: {}, missing: 0 },
      { entries: [], missing: -1 },
      { entries: [], missing: 1.5 },
      { entries: [] }
    ]) {
      expect(readPrintSet(v, knows), JSON.stringify(v)).toBeNull();
    }
  });

  it('keeps the order, merges the picture and keeps a count of 2..99', () => {
    const answer = {
      entries: [
        { k: 'ci2', q: 3 },
        { hid: HID, item: record(), img: 'ci1.webp', q: 99 },
        { k: 'ci1', q: 1 },
        { k: 'ci3', q: 100 }
      ],
      missing: 1
    };
    expect(readPrintSet(answer, knows)).toEqual({
      rows: [
        { id: 'ci2', q: 3 },
        { record: { ...record(), hid: HID, img: 'ci1.webp' }, q: 99 },
        { id: 'ci1' },
        { id: 'ci3' }
      ],
      missing: 1
    });
  });

  it('drops an unknown catalog id silently, and counts an invalid record as missing', () => {
    const answer = {
      entries: [{ k: 'zz9' }, { hid: HID, item: { src: 'core' } }, { k: 'ci1' }, 'junk'],
      missing: 0
    };
    expect(readPrintSet(answer, knows)).toEqual({ rows: [{ id: 'ci1' }], missing: 1 });
  });
});

describe('the lifetime of a set', () => {
  it('is 90 days in the id rule, the gone line and both privacy pages', () => {
    expect(PRINT_SET_DAYS).toBe(90);
    expect(PRINT_SET_ID.test('set-twocards')).toBe(true);
    expect(PRINT_SET_ID.test('set-twocard')).toBe(false);
    const days = String(PRINT_SET_DAYS);
    expect(dict('ru').printSetGone).toContain(days);
    expect(dict('en').printSetGone).toContain(days);
    const root = join(import.meta.dirname, '..', '..', '..', 'pages', 'src');
    for (const [file, head] of [
      ['privacy.html', '<h3>Наборы для печати</h3>'],
      [join('en', 'privacy.html'), '<h3>Print sets</h3>']
    ] as const) {
      const page = readFileSync(join(root, file), 'utf8');
      const at = page.indexOf(head);
      expect(at, file).toBeGreaterThan(0);
      const topic = page.slice(at, page.indexOf('<h3', at + head.length));
      expect(topic, file).toContain(days);
    }
  });
});
