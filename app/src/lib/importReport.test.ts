/* The lists import's report: each error kind of the parse, the skips of a good file, the
   refusals, and the line as text, in both languages (docs/specs/FEATURES.md, "Lists"). */
import { describe, expect, it } from 'vitest';
import { parseBundle, type BundleError, type Skipped } from './bundle.js';
import { dict } from './dict.js';
import {
  lineText,
  listName,
  listsErrorReport,
  listsRefusal,
  skipLine,
  type NameOf
} from './importReport.js';
import { readLoot } from '../test/loot.js';
import { buildIndex } from './data.js';
import { nameOf } from './i18n.js';
import type { Lang } from './types.js';

const index = buildIndex(readLoot());
const known = (id: string): boolean => index.byId.has(id);
const named =
  (lang: Lang) =>
  (id: string): string | undefined => {
    const it = index.byId.get(id);
    return it ? nameOf(it, lang) : undefined;
  };
const none = (): undefined => undefined;

const file = (lists: unknown, version: unknown = 1): string =>
  JSON.stringify({ format: 'daggerheart-loot/lists', version, lists });

/** Parses a file that must be refused with errors and returns its report in a language. */
function report(text: string, lang: Lang, nameFor: NameOf = none) {
  const p = parseBundle(text, known);
  if (p.ok || p.reason !== 'errors') throw new Error('the file was not refused with errors');
  return listsErrorReport(p.errors, p.names, dict(lang), nameFor);
}

describe('the error report of a lists file', () => {
  it('puts the file own errors first and then one block per list, in file order', () => {
    const r = report(
      JSON.stringify({
        format: 'daggerheart-loot/lists',
        version: 1,
        extra: 1,
        lists: [{ name: 'A', entries: [{ id: 'ci1', quantity: 0 }] }, { name: 'B' }]
      }),
      'en'
    );
    expect(r.file.map((l) => l.text)).toEqual([expect.stringContaining('extra')]);
    expect(r.lists.map((l) => [l.index, l.head])).toEqual([
      [0, '1. A'],
      [1, '2. B']
    ]);
    expect(r.lists[0]?.lines[0]?.pos).toBe('Item 1');
  });

  it('names an entry by its position and item id, and by its record when a name lookup knows it', () => {
    const text = file([{ name: 'A', entries: [{ id: 'ci1', quantity: 0 }] }]);
    const bare = report(text, 'en').lists[0]?.lines[0];
    expect(bare).toMatchObject({ pos: 'Item 1', item: 'ci1' });
    expect(bare?.name).toBeUndefined();
    const ru = report(text, 'ru', named('ru')).lists[0]?.lines[0];
    const en = report(text, 'en', named('en')).lists[0]?.lines[0];
    expect(ru?.name).toBe('Первоклассный Спальный Мешок');
    expect(en?.name).toBe('Premium Bedroll');
    expect(lineText(en as never)).toMatch(/^Item 1, Premium Bedroll \(ci1\): quantity 0/);
  });

  it('heads a list with no name by the no-name text and cuts a long name to 40 characters', () => {
    expect(listName(dict('en'), null)).toBe('(no name)');
    expect(listName(dict('ru'), '')).toBe('(без названия)');
    const long = 'x'.repeat(50);
    expect(listName(dict('en'), long)).toBe('x'.repeat(40) + '...');
    expect(listName(dict('en'), 'Loot')).toBe('Loot');
  });

  /* One file per error kind of the parse, each with the text it must give in both languages. */
  const KINDS: [string, string, RegExp, RegExp][] = [
    [
      'missing',
      file([{ entries: [] }]),
      /Название: пустое или отсутствует/,
      /Name: empty or missing/
    ],
    [
      'type',
      file([{ name: 'A', entries: [{ id: 'ci1', quantity: 'x' }] }]),
      /quantity/,
      /quantity/
    ],
    [
      'id pattern',
      file([{ name: 'A', entries: [{ id: 'bad id' }] }]),
      /не id записи/,
      /not a record id/
    ],
    [
      'not an object',
      file([{ name: 'A', entries: [7] }]),
      /(не объект|объект)/i,
      /(not an object|object)/i
    ],
    [
      'long',
      file([{ name: 'A', entries: [{ id: 'ci1', player_note: 'x'.repeat(5000) }] }]),
      /player_note/,
      /player_note/
    ],
    [
      'range',
      file([{ name: 'A', entries: [{ id: 'ci1', quantity: 0 }] }]),
      /вне диапазона/,
      /out of the range/
    ],
    [
      'enum',
      file([{ name: 'A', money_mode: 'nope', entries: [] }]),
      /money_mode/,
      /money_mode/
    ],
    ['extra', file([{ name: 'A', entries: [{ id: 'ci1', zzz: 1 }] }]), /zzz/, /zzz/],
    [
      'many entries',
      file([{ name: 'A', entries: Array.from({ length: 5001 }, () => ({ id: 'ci1' })) }]),
      /entries/,
      /entries/
    ],
    [
      'homebrew id',
      file([{ name: 'A', entries: [{ id: 'ci1', source: 'homebrew' }] }], 2),
      /id/,
      /id/
    ],
    [
      'snapshot',
      file(
        [
          {
            name: 'A',
            entries: [{ id: 'hb_aaaaaaaaaaaaaaaa', source: 'homebrew', snapshot: { x: 1 } }]
          }
        ],
        2
      ),
      /snapshot|снимок|копи/i,
      /snapshot|copy/i
    ]
  ];
  for (const [label, text, ru, en] of KINDS) {
    it(`gives the ${label} error in Russian and in English`, () => {
      const lines = (lang: Lang) => {
        const r = report(text, lang);
        return [...r.file, ...r.lists.flatMap((l) => l.lines)].map(lineText);
      };
      expect(lines('ru').join('\n')).toMatch(ru);
      expect(lines('en').join('\n')).toMatch(en);
      expect(lines('ru')).toHaveLength(lines('en').length);
    });
  }

  it('gives the many-lists error of a file past 1000 lists', () => {
    const lists = Array.from({ length: 1001 }, () => ({ name: 'A', entries: [{ id: 'ci1' }] }));
    const r = report(file(lists), 'en');
    expect(r.file.map((l) => l.text).join(' ')).toMatch(/lists/);
  });
});

describe('the skips of a good lists file', () => {
  const skipped = (text: string): Skipped[] => {
    const p = parseBundle(text, known);
    if (!p.ok) throw new Error('the file was refused');
    return p.skipped;
  };

  it('names the position, and the record when it is known, never the raw id', () => {
    const s = skipped(
      file([{ name: 'A', entries: [{ id: 'ci1' }, { id: 'nope' }, { id: 'ci1' }] }])
    );
    expect(s.map((x) => x.why)).toEqual(['unknown', 'repeat']);
    const en = s.map((x) => skipLine(x, dict('en'), named('en')));
    expect(en[0]).toEqual({ pos: 'Item 2', text: dict('en').importSkipUnknown });
    expect(en[1]).toEqual({
      pos: 'Item 3',
      name: 'Premium Bedroll',
      text: dict('en').importSkipRepeat.replace('%n', '1')
    });
    expect(en.map(lineText)).not.toContainEqual(expect.stringContaining('nope'));
    expect(skipLine(s[1] as Skipped, dict('ru'), none).name).toBeUndefined();
  });

  it('gives the unheld skip of a homebrew entry the account does not hold', () => {
    const s = skipped(
      file([{ name: 'A', entries: [{ id: 'hb_aaaaaaaaaaaaaaaa', source: 'homebrew' }] }], 2)
    );
    expect(s[0]?.why).toBe('unheld');
    expect(skipLine(s[0] as Skipped, dict('ru'), none).text).toBe(dict('ru').importSkipUnheld);
    expect(skipLine(s[0] as Skipped, dict('en'), none).text).toBe(dict('en').importSkipUnheld);
  });

  it('counts a repeat from the first position of the same list', () => {
    const line = skipLine(
      { list: 0, entry: 4, id: 'ci1', why: 'repeat', first: 2 } satisfies Skipped,
      dict('en'),
      none
    );
    expect(line.text).toBe(dict('en').importSkipRepeat.replace('%n', '3'));
  });
});

describe('the refusal of a file that is not a lists file', () => {
  const refusal = (text: string) => {
    const p = parseBundle(text, known);
    if (p.ok || p.reason === 'errors') throw new Error('the file was read');
    return listsRefusal(p);
  };

  it('maps each reason to its dictionary key, and a version to its JSON', () => {
    expect(refusal('{nope')).toEqual({ key: 'importNotJson' });
    expect(refusal('{"format":"x"}')).toEqual({ key: 'importNotBundle' });
    expect(refusal(file([]))).toEqual({ key: 'importEmpty' });
    expect(refusal(file([], 9))).toEqual({ key: 'importVersion', version: '9' });
    expect(refusal(file([], 'x'))).toEqual({ key: 'importVersion', version: '"x"' });
    expect(refusal(JSON.stringify({ format: 'daggerheart-loot/lists', lists: [] }))).toEqual({
      key: 'importNoVersion'
    });
  });

  it('reads in Russian and in English', () => {
    for (const lang of ['ru', 'en'] as const) {
      const t = dict(lang);
      const r = refusal(file([], 9));
      expect(t[r.key].replace('%s', () => r.version ?? '')).toContain('9');
      expect(t.importNotBundle.length).toBeGreaterThan(10);
    }
    expect(dict('ru').importEmpty).not.toBe(dict('en').importEmpty);
  });
});

describe('a line as text', () => {
  it('draws the position, the name and the item id, a colon, the text and the path', () => {
    expect(lineText({ text: 'a' })).toBe('a');
    expect(lineText({ text: 'a', path: 'p' })).toBe('a p');
    expect(lineText({ pos: 'Item 1', text: 'a' })).toBe('Item 1: a');
    expect(lineText({ pos: 'Item 1', item: 'ci1', text: 'a' })).toBe('Item 1, ci1: a');
    expect(lineText({ pos: 'Item 1', name: 'N', text: 'a' })).toBe('Item 1, N: a');
    expect(lineText({ pos: 'Item 1', name: 'N', item: 'ci1', text: 'a', path: 'p' })).toBe(
      'Item 1, N (ci1): a p'
    );
    expect(lineText({ name: 'N', item: 'ci1', text: 'a' })).toBe('a');
  });
});

describe('the errors of the parse as the report reads them', () => {
  it('keeps the order of the errors within a list', () => {
    const errors: BundleError[] = [
      { path: 'lists[1]', list: 1, entry: null, field: 'name', kind: 'missing' },
      { path: 'lists[0]', list: 0, entry: null, field: 'name', kind: 'missing' }
    ];
    const r = listsErrorReport(errors, ['A', null], dict('en'), none);
    expect(r.lists.map((l) => l.head)).toEqual(['1. A', '2. (no name)']);
  });
});
