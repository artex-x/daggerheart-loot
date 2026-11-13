/* The homebrew import's report: each rule of the parse as a line in both languages, the notes
   of a good file, and the refusals (docs/specs/FEATURES.md, "Homebrew"). */
import { describe, expect, it } from 'vitest';
import { dict } from './dict.js';
import { parseHomebrew, type FileContext } from './homebrewFile.js';
import { homebrewErrorLines, homebrewNoteLines, homebrewRefusal } from './homebrewReport.js';
import { lineText } from './importReport.js';
import type { Lang } from './types.js';

const ctx = (over: Partial<FileContext> = {}): FileContext => ({
  catalogHas: () => false,
  catalogSet: () => false,
  catalogRef: () => false,
  ownItem: () => false,
  ownCard: () => null,
  lineMembers: () => [],
  ...over
});

const K = 'hb_aaaaaaaaaaaaaaaa';
const K2 = 'hb_bbbbbbbbbbbbbbbb';
const item = (o: Record<string, unknown> = {}): Record<string, unknown> => ({
  key: K,
  en: 'Lamp',
  kind: 'item',
  ...o
});
const doc = (o: Record<string, unknown> = {}): string =>
  JSON.stringify({
    format: 'daggerheart-loot/homebrew',
    version: 2,
    books: [],
    cards: [],
    items: [],
    ...o
  });
const armor = (eq: Record<string, unknown>) =>
  item({ kind: 'equip', eq: { t: 'armor', tier: 1, ...eq } });

/** Returns the lines of a refused file in a language. */
function lines(text: string, lang: Lang): string[] {
  const p = parseHomebrew(text, ctx());
  if (p.ok || p.reason !== 'errors') throw new Error('the file was not refused with errors');
  const parsed: unknown = JSON.parse(text);
  return homebrewErrorLines(p.errors, parsed, p.names, dict(lang), lang).map(lineText);
}

describe('the error lines of a refused homebrew file', () => {
  /* One file per rule of the parse; the first line must read as the text says in both languages. */
  const t = (lang: Lang) => dict(lang);
  const CASES: [string, string, (lang: Lang) => RegExp | string][] = [
    ['an extra key of the file', doc({ zzz: 1 }), () => /zzz/],
    ['a field of the file of the wrong type', doc({ items: 5 }), () => /items/],
    [
      'too many items',
      doc({
        items: Array.from({ length: 1001 }, (_, i) =>
          item({ key: 'hb_' + String(i).padStart(16, 'b') })
        )
      }),
      (l) => t(l).hbImportManyItems.replace('%n', '1000')
    ],
    ['an item that is not an object', doc({ items: [7] }), () => /7/],
    ['a required field', doc({ items: [{ key: K, en: 'x' }] }), () => /kind/],
    ['an extra field of an item', doc({ items: [item({ zzz: 1 })] }), () => /items\[0\]\.zzz/],
    ['a text past its bound', doc({ items: [item({ en: 'x'.repeat(500) })] }), () => /en/],
    [
      'a list past its bound',
      doc({ items: [item({ craft: Array.from({ length: 200 }, (_, i) => 'c' + String(i)) })] }),
      () => /craft/
    ],
    ['a value outside its list', doc({ items: [item({ kind: 'nope' })] }), () => /kind/],
    ['a number out of range', doc({ items: [armor({ as: 99, th: [5, 11] })] }), () => /eq\.as/],
    [
      'two thresholds out of order',
      doc({ items: [armor({ as: 3, th: [11, 5] })] }),
      (l) => t(l).hbImportErrOrder
    ],
    [
      'a line whose members hold another type',
      doc({
        items: [
          armor({ as: 3, th: [5, 11], line: K2 }),
          item({
            key: K2,
            kind: 'equip',
            eq: {
              t: 'weapon',
              tier: 1,
              cls: 'phy',
              tr: 'agility',
              rg: 'melee',
              dmg: 'd8',
              dt: 'phy',
              bu: 1
            }
          })
        ]
      }),
      (l) => t(l).hbImportErrLine
    ],
    [
      'a damage that is not dice',
      doc({
        items: [
          item({
            kind: 'equip',
            eq: {
              t: 'weapon',
              tier: 1,
              cls: 'phy',
              tr: 'agility',
              rg: 'melee',
              dmg: 'zz',
              dt: 'phy',
              bu: 1
            }
          })
        ]
      }),
      () => /eq\.dmg/
    ],
    ['a key of the wrong shape', doc({ items: [item({ key: 'x' })] }), () => /hb_/],
    ['a control character in a text', doc({ items: [item({ en: 'a\u0007b' })] }), () => /en/],
    ['a key used twice', doc({ items: [item(), item()] }), () => /items\[1\]\.key/],
    [
      'a relation id used twice',
      doc({ items: [item({ craft: ['c1', 'c1'] })] }),
      () => /craft/
    ],
    ['an item that names itself', doc({ items: [item({ craft: [K] })] }), () => /craft/],
    [
      'a book the file does not hold',
      doc({ items: [item({ book: 'hb_zzzzzzzzzzzzzzzz' })] }),
      () => /hb_zzzzzzzzzzzzzzzz/
    ],
    [
      'a section the book does not hold',
      doc({
        books: [
          {
            key: 'hb_cccccccccccccccc',
            en: 'B',
            sections: [{ key: 'hb_eeeeeeeeeeeeeeee', en: 'S' }]
          }
        ],
        items: [item({ book: 'hb_cccccccccccccccc', section: 'hb_dddddddddddddddd' })]
      }),
      () => /hb_dddddddddddddddd/
    ],
    [
      'a card of an unknown kind',
      doc({ cards: [{ key: 'hb_eeeeeeeeeeeeeeee', en: 'C', kind: 'rule' }] }),
      () => /kind/
    ]
  ];
  for (const [label, text, expected] of CASES) {
    it(`reads ${label} in Russian and in English`, () => {
      for (const lang of ['ru', 'en'] as const) {
        const got = lines(text, lang);
        expect(got.length, label).toBeGreaterThan(0);
        const want = expected(lang);
        const hit = got.some((line) =>
          typeof want === 'string' ? line.includes(want) : want.test(line)
        );
        expect(hit, `${lang}: ${got.join(' | ')}`).toBe(true);
      }
      expect(lines(text, 'ru')).toHaveLength(lines(text, 'en').length);
    });
  }

  /* The bound a long or many rule names depends on the object and the field. */
  const BOUNDS: [string, string][] = [
    ['an item description', doc({ items: [item({ ende: 'x'.repeat(9000) })] })],
    [
      'a card description',
      doc({
        cards: [{ key: 'hb_eeeeeeeeeeeeeeee', en: 'C', kind: 'ref', ende: 'x'.repeat(9000) }]
      })
    ],
    [
      'a card subtitle',
      doc({
        cards: [{ key: 'hb_eeeeeeeeeeeeeeee', en: 'C', kind: 'ref', ensub: 'x'.repeat(900) }]
      })
    ],
    [
      'a card link',
      doc({
        cards: [{ key: 'hb_eeeeeeeeeeeeeeee', en: 'C', kind: 'ref', url: 'x'.repeat(5000) }]
      })
    ],
    [
      'a card name',
      doc({ cards: [{ key: 'hb_eeeeeeeeeeeeeeee', en: 'x'.repeat(900), kind: 'ref' }] })
    ],
    ['a source name', doc({ books: [{ key: 'hb_cccccccccccccccc', en: 'x'.repeat(900) }] })],
    [
      'too many refs',
      doc({ items: [item({ refs: Array.from({ length: 300 }, (_, i) => 'r' + String(i)) })] })
    ],
    [
      'too many card items',
      doc({
        cards: [
          {
            key: 'hb_eeeeeeeeeeeeeeee',
            en: 'C',
            kind: 'set',
            items: Array.from({ length: 900 }, (_, i) => 'i' + String(i))
          }
        ]
      })
    ],
    [
      'too many sections',
      doc({
        books: [
          {
            key: 'hb_cccccccccccccccc',
            en: 'B',
            sections: Array.from({ length: 300 }, (_, i) => ({
              key:
                'hb_' +
                'abcdefghij'.repeat(2).slice(0, 15) +
                String.fromCharCode(97 + (i % 26)) +
                String(i),
              en: 'S'
            }))
          }
        ]
      })
    ],
    ['a text of the wrong type', doc({ items: [item({ ende: 5 })] })]
  ];
  for (const [label, text] of BOUNDS) {
    it(`reads ${label} in both languages`, () => {
      const ru = lines(text, 'ru');
      const en = lines(text, 'en');
      expect(ru.length).toBeGreaterThan(0);
      expect(ru).toHaveLength(en.length);
      expect(ru[0]).not.toBe(en[0]);
    });
  }

  it('places an item by its position and its quoted name in the language on screen', () => {
    const text = doc({ items: [item({ en: 'Lamp', ru: 'Лампа', kind: 'nope' })] });
    expect(lines(text, 'en')[0]).toMatch(/^Item 1, "Lamp": /);
    expect(lines(text, 'ru')[0]).toMatch(/^Предмет 1, «Лампа»: /);
  });

  it('cuts the value of an error to 40 characters and ends with the path', () => {
    const text = doc({ items: [item({ kind: 'z'.repeat(60) })] });
    const [line] = lines(text, 'en');
    expect(line).toContain('z'.repeat(40) + '...');
    expect(line).not.toContain('z'.repeat(41));
    expect(line?.endsWith('items[0].kind')).toBe(true);
  });

  it('names no object for an error of the file itself', () => {
    const [line] = lines(doc({ zzz: 1 }), 'en');
    expect(line).not.toMatch(/^Item/);
    expect(line?.endsWith('zzz')).toBe(true);
  });
});

describe('the note lines of a good homebrew file', () => {
  const read = (text: string, over: Partial<FileContext> = {}) => {
    const p = parseHomebrew(text, ctx(over));
    if (!p.ok) throw new Error('the file was refused');
    return p;
  };

  it('names a relation the file, the account and the catalog lack, in both languages', () => {
    const p = read(doc({ items: [item({ ru: 'Лампа', craft: ['zzz1'] })] }));
    const ru = homebrewNoteLines(p.notes, p.file, dict('ru'), 'ru', new Map()).map(lineText);
    const en = homebrewNoteLines(p.notes, p.file, dict('en'), 'en', new Map()).map(lineText);
    expect(ru).toHaveLength(1);
    expect(ru[0]).toMatch(/^Предмет 1, «Лампа»: .*craft.*zzz1/);
    expect(en[0]).toMatch(/^Item 1, "Lamp": .*craft.*zzz1/);
  });

  it('places a note on a file that also holds a source', () => {
    const p = read(
      doc({
        books: [{ key: 'hb_cccccccccccccccc', en: 'Book' }],
        items: [item({ craft: ['zzz1'] })]
      })
    );
    expect(homebrewNoteLines(p.notes, p.file, dict('en'), 'en', new Map())).toHaveLength(1);
  });

  it('shows the key the author wrote when the relation id was derived', () => {
    const p = read(doc({ items: [item({ craft: ['zzz1'] })] }));
    const lines = homebrewNoteLines(
      p.notes,
      p.file,
      dict('en'),
      'en',
      new Map([['zzz1', 'hb_orig']])
    );
    expect(lines.map(lineText)[0]).toContain('hb_orig');
    expect(lines.map(lineText)[0]).not.toContain('zzz1');
  });

  it('names a held card of another kind', () => {
    const p = read(doc({ cards: [{ key: 'hb_eeeeeeeeeeeeeeee', en: 'C', kind: 'ref' }] }), {
      ownCard: () => 'set'
    });
    const [line] = homebrewNoteLines(p.notes, p.file, dict('en'), 'en', new Map());
    expect(line).toEqual({
      pos: 'Card 1',
      name: '"C"',
      text: dict('en').hbImportKindDiffers
    });
    const [ru] = homebrewNoteLines(p.notes, p.file, dict('ru'), 'ru', new Map());
    expect(ru?.text).toBe(dict('ru').hbImportKindDiffers);
  });
});

describe('the refusal of a file that is not a homebrew file', () => {
  const refusal = (text: string) => {
    const p = parseHomebrew(text, ctx());
    if (p.ok || p.reason === 'errors') throw new Error('the file was read');
    return homebrewRefusal(p);
  };

  it('maps each reason to its dictionary key, and a version to its JSON', () => {
    expect(refusal('{nope')).toEqual({ key: 'importNotJson' });
    expect(refusal('{"format":"x"}')).toEqual({ key: 'hbImportNotFile' });
    expect(refusal(doc())).toEqual({ key: 'hbImportEmpty' });
    expect(
      refusal(JSON.stringify({ format: 'daggerheart-loot/homebrew', version: 7, items: [] }))
    ).toEqual({ key: 'hbImportVersion', version: '7' });
    expect(refusal(JSON.stringify({ format: 'daggerheart-loot/homebrew' }))).toEqual({
      key: 'hbImportNoVersion'
    });
  });

  it('reads in Russian and in English', () => {
    for (const lang of ['ru', 'en'] as const) {
      const r = refusal(JSON.stringify({ format: 'daggerheart-loot/homebrew', version: 7 }));
      expect(dict(lang)[r.key].replace('%s', () => r.version ?? '')).toContain('7');
    }
    expect(dict('ru').hbImportNotFile).not.toBe(dict('en').hbImportNotFile);
  });
});
