import { describe, expect, it } from 'vitest';
import { entryRowsOf, toCloudList, type ListRow } from './cloudLists.js';
import {
  canonicalList,
  ID_FORM,
  LEGACY_WRITE_UNTIL,
  legacyDateText,
  legacyWritable
} from './legacy.js';
import type { StoredList } from './lists.js';

describe('the legacy write cutoff', () => {
  it('is Monday 2026-10-26 at 00:00 UTC', () => {
    expect(new Date(LEGACY_WRITE_UNTIL).toISOString()).toBe('2026-10-26T00:00:00.000Z');
  });

  it('allows a write one millisecond before it and none from it on', () => {
    expect(legacyWritable(LEGACY_WRITE_UNTIL - 1)).toBe(true);
    expect(legacyWritable(LEGACY_WRITE_UNTIL)).toBe(false);
    expect(legacyWritable(LEGACY_WRITE_UNTIL + 86_400_000)).toBe(false);
  });

  it('says the date as the texts shipped it, in both languages', () => {
    expect(legacyDateText('ru')).toBe('26 октября 2026 года');
    expect(legacyDateText('en')).toBe('26 October 2026');
  });
});

/* The seed `noted` of tests/app/inventory.js, with the id cases added. */
const LONG_NOTE = 'x'.repeat(4001);
const NOTED: StoredList = {
  id: 'a',
  name: 'Клад дракона',
  created: 1,
  ids: [
    'ci1',
    'ci2',
    'ci3',
    'ci4',
    'ci5',
    'ci6',
    'ci7',
    'zz_new9',
    'bad id',
    'a'.repeat(65),
    'ci1'
  ],
  meta: {
    ci2: { qty: 2, gold: 750, note: 'Светится в темноте', hnote: 'Проклят' },
    ci3: { qty: 1, gold: 0 },
    ci4: { note: LONG_NOTE }
  },
  note: 'Лавка закрыта до утра'
};

const WANT =
  '{"ids":["ci1","ci2","ci3","ci4","ci5","ci6","ci7","zz_new9"],' +
  '"meta":{"ci2":{"gold":750,"hnote":"Проклят","note":"Светится в темноте","qty":2},' +
  '"ci4":{"note":"' +
  'x'.repeat(4000) +
  '"}},"name":"Клад дракона","note":"Лавка закрыта до утра"}';

describe('canonicalList', () => {
  it('keeps every id of the RPC form, known to the catalog or not, and drops the rest', () => {
    expect(canonicalList(NOTED)).toBe(WANT);
    expect(ID_FORM.test('zz_new9')).toBe(true);
    expect(ID_FORM.test('bad id')).toBe(false);
    expect(ID_FORM.test('a'.repeat(65))).toBe(false);
  });

  it('writes the same text for the same list with its keys in another order', () => {
    const reordered = {
      note: NOTED.note,
      meta: {
        ci4: { note: LONG_NOTE },
        ci3: { gold: 0, qty: 1 },
        ci2: { hnote: 'Проклят', note: 'Светится в темноте', gold: 750, qty: 2 }
      },
      ids: NOTED.ids,
      name: NOTED.name,
      id: 'b'
    } as StoredList;
    expect(canonicalList(reordered)).toBe(WANT);
  });

  it('sorts integer-like keys by code unit, and writes the coin mode and a GM note', () => {
    const l: StoredList = {
      id: 'a',
      name: '',
      ids: ['9', '10'],
      meta: { '9': { qty: 3 }, '10': { gold: 5 } },
      money: 'coin',
      hnote: 'h'
    };
    expect(canonicalList(l)).toBe(
      '{"hnote":"h","ids":["9","10"],"meta":{"10":{"gold":5},"9":{"qty":3}},"money":"coin","name":""}'
    );
  });

  it('writes an empty list, and reads a stored value of the wrong type as absent', () => {
    expect(canonicalList({ id: 'a', name: 'Пусто', ids: [] })).toBe(
      '{"ids":[],"name":"Пусто"}'
    );
    const odd = {
      id: 'a',
      name: 5,
      ids: [7, 'ci1'],
      meta: { ci1: { note: 3, qty: 'x' } },
      money: 'bag',
      note: ''
    } as unknown as StoredList;
    expect(canonicalList(odd)).toBe('{"ids":["ci1"],"name":""}');
  });

  it('reads back equal from the account row the text makes', () => {
    let n = 0;
    const once = { ...NOTED, ids: [...new Set(NOTED.ids)].filter((id) => ID_FORM.test(id)) };
    const row: ListRow = {
      id: 'r',
      name: NOTED.name,
      money_mode: 'bag',
      player_note: NOTED.note ?? '',
      gm_note: '',
      created_at: '2026-09-26T10:00:00.000Z',
      updated_at: '2026-09-26T10:00:00.000Z',
      legacy_fingerprint: 'f'.repeat(64),
      list_entries: entryRowsOf(once.ids, once.meta, () => 'e' + String(n++))
    };
    expect(canonicalList(toCloudList(row))).toBe(WANT);
  });
});
