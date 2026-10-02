/* Against the real catalogue, because the point of search is that it finds
   things in it. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildIndex, type Loot } from './data.js';
import { dict } from './dict.js';
import { eqLine } from './i18n.js';
import { isFrameRecord } from './label.js';
import {
  foldQuery,
  hayFor,
  matches,
  parseQuery,
  rankHits,
  search,
  statLineFor
} from './search.js';
import type { Record_ } from './types.js';

const LOOT = JSON.parse(
  readFileSync(join(import.meta.dirname, '..', '..', '..', 'data.json'), 'utf8')
) as Loot;
const index = buildIndex(LOOT);

const LABELS = {
  tier: 'Ранг',
  thresholds: 'Пороги',
  armorScore: 'Броня',
  artifact: 'Артефакт'
};
const statLine = (it: Record_): string => eqLine(it, 'ru', LABELS);

const find = (q: string): Record_[] => search(index.searchable, q, statLine);

describe('across both languages at once', () => {
  it('finds a record by its Russian name', () => {
    expect(find('Катана').map((x) => x.id)).toContain('q26');
  });

  it('finds the same record by its English one', () => {
    /* A GM reading the book in English and running the table in Russian */
    expect(find('Katana').map((x) => x.id)).toContain('q26');
  });

  it('does not care about case', () => {
    expect(find('КАТАНА').map((x) => x.id)).toContain('q26');
    expect(find('katana').map((x) => x.id)).toContain('q26');
  });
});

describe('what it looks at', () => {
  it('searches descriptions, not only names', () => {
    const hit = find('Стресс');
    expect(hit.length).toBeGreaterThan(10);
    expect(hit.some((x) => !x.ru.includes('Стресс'))).toBe(true);
  });

  it('searches the stat line of equipment', () => {
    /* A phrase, because the bare word also reaches «двуручный» in descriptions
       by its stem. "Двуручное" is on no record as text - it is assembled from `bu`.
       A `bu: 'any'` record's line reads "Одноручное/двуручное" and matches
       too - the word is still assembled, only now from a burden that reads
       both ways (`docs/DECISIONS.md`, "Gryphon Hammer bu: 'any'"). */
    const twoHanded = find('"Двуручное"');
    expect(twoHanded.length).toBeGreaterThan(10);
    expect(twoHanded.every((x) => x.eq?.bu === 2 || x.eq?.bu === 'any')).toBe(true);
  });

  it('does not invent a stat line for loot', () => {
    const noStats = matches(
      index.byId.get('ci1') as Record_,
      parseQuery('двуручное'),
      statLine
    );
    expect(noStats).toBe(false);
  });
});

describe('an empty query', () => {
  it('returns nothing rather than the whole catalogue', () => {
    /* The search page with nothing typed is an invitation, not a dump */
    for (const q of ['', '   ', '\n']) expect(find(q)).toEqual([]);
  });
});

describe('a substring, not a guess', () => {
  it('matches part of a word', () => {
    expect(find('катан').map((x) => x.id)).toContain('q26');
  });

  it('does not offer near-misses', () => {
    /* A fuzzy library would be a dependency bought with results nobody wanted:
       "лук" should not turn up "клык". Both sides folded through foldQuery
       (not a bare toLowerCase) and checked per field (not concatenated) -
       concatenating fields is exactly the field-boundary false-match shape
       this batch's own hayFor design was built to avoid (see Hay's comment
       in search.ts). */
    const bow = find('Лук');
    const needle = foldQuery('лук');
    expect(
      bow.every((x) =>
        [x.ru, x.rud, x.en, x.ende].some((f) => !!f && foldQuery(f).includes(needle))
      )
    ).toBe(true);
  });

  it('finds nothing for nonsense, without throwing', () => {
    expect(find('zzzqqq')).toEqual([]);
  });
});

describe('the order it returns', () => {
  it('is the order it was given, so the tables stay as the book prints them', () => {
    const all = index.searchable;
    const hits = find('меч');
    const positions = hits.map((h) => all.indexOf(h));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });
});

describe('without a stat line', () => {
  /* Most callers have no stat line to offer - the search page passes one only
     because equipment exists. Omitting it must not change what loot matches. */
  const loot = index.searchable.find((r) => !r.eq);
  const gear = index.searchable.find((r) => r.eq);

  it('has both kinds of record to test with', () => {
    expect(loot).toBeDefined();
    expect(gear).toBeDefined();
  });

  it('still finds a record by its own name', () => {
    if (!loot) return;
    expect(matches(loot, parseQuery(loot.ru))).toBe(true);
    expect(matches(loot, parseQuery('заведомо отсутствующее слово'))).toBe(false);
  });

  it('still filters a list', () => {
    if (!loot) return;
    expect(search([loot], loot.ru.toLowerCase()).map((r) => r.id)).toEqual([loot.id]);
    expect(search([loot], '')).toEqual([]);
  });

  it('gives equipment an empty stat line rather than crashing on the missing one', () => {
    /* Equipment is the only thing that consults the stat line, so a caller that
       omits it should find gear by name and never by its stats. */
    if (!gear) return;
    expect(matches(gear, parseQuery(gear.ru))).toBe(true);
    expect(matches(gear, parseQuery('ранг'))).toBe(false);
    expect(search([gear], gear.ru.toLowerCase()).map((r) => r.id)).toEqual([gear.id]);
    /* A query that reaches the stat line rather than short-circuiting on the
       name: with no stat line to consult there is nothing to match. */
    expect(search([gear], 'заведомо отсутствующее слово')).toEqual([]);
  });
});

describe('folding: ё, apostrophes, diacritics, minus sign, case', () => {
  it('finds a yo-spelled name typed with a plain е', () => {
    /* "Плетёная Сеть" (ci8) - a reader who cannot type ё gets nothing today */
    expect(find('плетеная сеть').map((x) => x.id)).toContain('ci8');
  });

  it('finds a record typed with the typographic apostrophe autocorrect produces', () => {
    /* Every record's own apostrophe is normalised to ASCII, so "Keeper's
       Staff" (q80) is now stored plain. The fold still has to run - iOS/macOS
       autocorrect turns a typed ' into U+2019 on the QUERY, not the record -
       so this case types the typographic form against the now-ASCII name.
       This test used to exercise the record side instead, until that was
       found to have gone vacuous (both sides ASCII, search.ts's fold an
       identity transform on either). */
    expect(find('keeper’s staff').map((x) => x.id)).toContain('q80');
  });

  it('finds a name with a Latin diacritic typed in plain ASCII', () => {
    /* Owner-approved: "Ethereal Zweihänder" (q238) and "Möbius Orb"
       (q311) were unreachable by ordinary typing across all 1272 records. */
    expect(find('Zweihander').map((x) => x.id)).toContain('q238');
    expect(find('Mobius').map((x) => x.id)).toContain('q311');
  });

  it('finds a Unicode minus sign typed as an ASCII hyphen', () => {
    /* U+2212 occurs 123 times across 113 descriptions; q4's rud has "−1". */
    expect(find('-1').map((x) => x.id)).toContain('q4');
  });

  it('does not merge Cyrillic й into и', () => {
    /* NFD decomposes й (U+0439) into и (U+0438) plus a combining breve -
       exactly the merge foldLatinDiacritics's Cyrillic exception exists to
       avoid. Verified directly rather than assumed: a query for one must
       not fold to the same string as a query for the other. */
    expect(foldQuery('й')).toBe('й');
    expect(foldQuery('чай')).not.toBe(foldQuery('чаи'));
  });

  it('agrees between the cached haystack and the live fallback', () => {
    /* The haystack path (hayFor) and the fallback path (no hay, folded live)
       have to return exactly the same hits, or the cache would be a second,
       silently different search engine. These six queries are exactly the
       ones tests/app/inventory.js seeds into the search box across its
       golden states (grep 'Поиск по названию или описанию…' there) - that
       provenance is load-bearing, not arbitrary: it is what pins this test's
       query list to the queries a real golden run actually exercises,
       instead of a set invented here and never checked against one.
       'плетеная сеть' and "keeper's staff" are included so the two defect
       cases above (which call find(), i.e. the live-fallback path only) are
       also proven to agree on the cached path the app itself runs through
       SearchPage/TablesPage. */
    const hay = hayFor(statLine);
    const queries = [
      'меч',
      'двуручное',
      'а',
      'кольцо',
      'вторичное',
      'zzzqqqxx123',
      'плетеная сеть',
      "keeper's staff",
      'спальный мешок',
      'зель',
      '"двуручное"',
      'лечения зелья',
      'меч огонь',
      'ранг 2 щит'
    ];
    for (const q of queries) {
      const terms = parseQuery(q);
      const withHay = index.searchable
        .filter((it) => matches(it, terms, statLine, hay))
        .map((x) => x.id);
      const withoutHay = index.searchable
        .filter((it) => matches(it, terms, statLine))
        .map((x) => x.id);
      expect(withHay).toEqual(withoutHay);
      expect(rankHits(index.searchable, terms, statLine, hay)).toEqual(
        rankHits(index.searchable, terms, statLine)
      );
    }
  });
});

describe('the stat line the pages search with', () => {
  it('still finds a record by name through it', () => {
    const line = statLineFor('ru', dict('ru'));
    expect(search(index.searchable, 'Катана', line).map((x) => x.id)).toContain('q26');
  });

  it('keeps the type word, unlike the row display', () => {
    /* `TablesPage.svelte`'s row draws `eqLine(it, lang, labels, { noType: true
       })` - the match must not; a query for the type word alone has to find
       weapons through the line `statLineFor` builds. */
    const gear = index.searchable.find((r) => r.eq?.t === 'weapon') as Record_;
    const line = statLineFor('ru', dict('ru'))(gear);
    expect(line).toContain('Основное оружие');
    expect(eqLine(gear, 'ru', LABELS, { noType: true })).not.toContain('Основное оружие');
  });

  it('is per language, like every other field it searches', () => {
    const gear = index.searchable.find((r) => r.eq?.t === 'weapon') as Record_;
    const ru = statLineFor('ru', dict('ru'))(gear);
    const en = statLineFor('en', dict('en'))(gear);
    expect(ru).toContain('Основное оружие');
    expect(en).toContain('Primary weapon');
    expect(ru).not.toBe(en);
  });

  it('keeps the tier word for a frame record', () => {
    /* This test used to match the live app, which dropped the tier word for
       frame equipment (`if (e.tier && !isFrameRecord(it))`) - tracked as a
       defect, not a rule: an identical piece of armour printed its tier when
       it sat in `eq` and hid it when it sat in a frame table, with nothing a
       reader could see to explain the difference. The owner settled on
       printing it like any other equipment (`docs/specs/FEATURES.md`,
       "Records"), so `statLineFor` no longer passes `noTier` at all. */
    const frame = index.searchable.find((r) => isFrameRecord(r) && r.eq?.tier === 1) as Record_;
    expect(frame).toBeDefined();
    const line = statLineFor('ru', dict('ru'))(frame);
    expect(line).toContain('Ранг');
    expect(
      search(index.searchable, 'ранг 1', statLineFor('ru', dict('ru'))).map((r) => r.id)
    ).toContain(frame.id);
  });
});

describe('the folded haystack cache', () => {
  const thing = (ru: string): Record_ => ({
    id: 'hb_sameidaaaaaaaaaa',
    src: 'homebrew',
    kind: 'item',
    en: '',
    ende: '',
    ru,
    rud: ''
  });

  it('refolds a new object under the same id: an edited own item is found by its new name', () => {
    const hay = hayFor(() => '');
    const before = thing('Старое имя');
    expect(matches(before, parseQuery('старое'), () => '', hay)).toBe(true);
    const after = thing('Новое имя');
    expect(matches(after, parseQuery('новое'), () => '', hay)).toBe(true);
    expect(matches(after, parseQuery('старое'), () => '', hay)).toBe(false);
  });

  it('keeps one object folding once', () => {
    const hay = hayFor(() => '');
    const it = thing('Имя');
    expect(hay(it)).toBe(hay(it));
  });
});

/** Today's rule before words and forms: the folded query as one substring of one field. */
const contiguous = (q: string): Record_[] => {
  const needle = foldQuery(q.trim());
  return index.searchable.filter((it) =>
    [it.ru, it.en, it.rud, it.ende, it.eq ? statLine(it) : ''].some(
      (f) => !!f && foldQuery(f).includes(needle)
    )
  );
};
const ids = (rs: readonly Record_[]): string[] => rs.map((r) => r.id);
const own = (id: string, ru: string, rud = ''): Record_ => ({
  id,
  src: 'homebrew',
  kind: 'item',
  en: '',
  ende: '',
  ru,
  rud
});
const atWordStart = (f: string | undefined, word: string): boolean =>
  !!f && new RegExp(`(^|[^\\p{L}\\p{N}])${word}`, 'u').test(foldQuery(f));

describe('parseQuery', () => {
  const shape = (q: string): [string, boolean][] =>
    parseQuery(q).map((t) => [t.text, t.phrase]);

  it('reads words and a phrase', () => {
    expect(shape('Меч "Ring Of" огонь')).toEqual([
      ['меч', false],
      ['ring of', true],
      ['огонь', false]
    ]);
  });

  it('runs an unclosed quote to the end, so the results do not flicker', () => {
    expect(shape('меч "ring of')).toEqual([
      ['меч', false],
      ['ring of', true]
    ]);
  });

  it('gives no terms for blank text or empty quotes', () => {
    for (const q of ['', '   ', '""', '" "', '«»', '“”']) expect(parseQuery(q)).toEqual([]);
  });

  it('folds inside quotes', () => {
    expect(shape('"Плетёная СЕТЬ"')).toEqual([['плетеная сеть', true]]);
  });

  it('reads ёлочки and smart quotes as straight quotes', () => {
    const plain = shape('"ring of"');
    expect(shape('«ring of»')).toEqual(plain);
    expect(shape('“ring of”')).toEqual(plain);
    expect(shape('„ring of“')).toEqual(plain);
  });

  it('gives a phrase no stem', () => {
    expect(parseQuery('"мечи"')[0]?.stem).toBeNull();
  });
});

describe('word forms by Snowball stem', () => {
  const stem = (w: string): string | null => parseQuery(w)[0]?.stem ?? null;

  it('reduces the forms of a word to one stem', () => {
    const cases: [string, string][] = [
      ['кольцо', 'кольц'],
      ['кольца', 'кольц'],
      ['зелье', 'зел'],
      ['зелья', 'зел'],
      ['зеленый', 'зелен'],
      ['мечи', 'меч'],
      ['луки', 'лук'],
      ['огненный', 'огнен'],
      ['огненная', 'огнен'],
      ['доспехами', 'доспех'],
      ['броня', 'брон'],
      ['бронза', 'бронз'],
      ['potions', 'potion'],
      ['daggers', 'dagger'],
      ['bows', 'bow'],
      ['healing', 'heal'],
      ['двуручное', 'двуручн'],
      ['двуручный', 'двуручн'],
      ['двуручного', 'двуручн'],
      ['зелий', 'зел'],
      ['зель', 'зел'],
      ['спальный', 'спальн'],
      ['спальные', 'спальн'],
      ['вторичное', 'вторичн'],
      ['вторичного', 'вторичн'],
      ['лечения', 'лечен']
    ];
    for (const [word, s] of cases) expect([word, stem(word)]).toEqual([word, s]);
  });

  it('carries no stem when the word is its own stem', () => {
    for (const w of ['меч', 'лук', 'клык', 'health', 'мешок', 'топор']) {
      expect([w, stem(w)]).toEqual([w, null]);
    }
  });

  it('drops a one-letter stem, so «ей» does not reach a record that holds only «ее»', () => {
    expect(stem('ей')).toBeNull();
    expect(stem('ая')).toBeNull();
    expect(search([own('hb_eeaaaaaaaaaaaaaa', 'Ее вещь')], 'ей')).toEqual([]);
  });

  it('finds the forms the substring rule missed', () => {
    for (const q of ['мечи', 'potions', 'daggers', 'луки', 'доспехами']) {
      expect([q, find(q).length > contiguous(q).length]).toEqual([q, true]);
    }
  });

  it('checks the stem on both sides: «зелёный» does not answer "зелье"', () => {
    /* hc29 «Масло Зелёной Слизи» holds «зелён-» and no form of «зелье» */
    const slime = index.byId.get('hc29') as Record_;
    expect(foldQuery(slime.ru)).toContain('зелен');
    expect(matches(slime, parseQuery('зелье'), statLine)).toBe(false);
  });

  it('reaches an English word whose stem is not its prefix: "allies" finds "ally"', () => {
    /* Snowball: ally -> alli, enemy -> enemi, moving -> move */
    const ally = own('hb_allyaaaaaaaaaaaa', 'Знамя', 'Grants an ally advantage.');
    const enemy = own('hb_enemyaaaaaaaaaaa', 'Щит', 'Pushes the enemy back.');
    const moving = own('hb_movingaaaaaaaaaa', 'Сапоги', 'Keeps you moving.');
    expect(search([ally, enemy, moving], 'allies')).toEqual([ally]);
    expect(search([ally, enemy, moving], 'enemies')).toEqual([enemy]);
    expect(search([ally, enemy, moving], 'moves')).toEqual([moving]);
  });

  it('checks the stem on both sides: «бронза» does not answer "броня"', () => {
    /* The catalogue has no loot record that holds «бронз-» without a form of «броня» */
    const bronze = own('hb_bronzeaaaaaaaaaa', 'Бронзовый колокол');
    const armour = own('hb_armouraaaaaaaaaa', 'Лёгкая броня');
    expect(search([bronze, armour], 'броня')).toEqual([armour]);
    expect(search([bronze, armour], 'брони')).toEqual([armour]);
  });
});

describe('recall is a superset of the substring rule', () => {
  const probes = [
    'ring',
    'меч',
    'лук',
    'а',
    '-1',
    "keeper's",
    'zweihander',
    'двуручное',
    'ранг 1',
    'ring of',
    'стресс',
    'спальный мешок',
    'кольцо',
    'вторичное',
    'зель',
    'топор'
  ];

  it.each(probes)('loses no record for %s', (q) => {
    const found = new Set(ids(find(q)));
    expect(ids(contiguous(q)).filter((id) => !found.has(id))).toEqual([]);
  });
});

describe('several words', () => {
  it('match in any order and form', () => {
    expect(contiguous('лечения зелья')).toEqual([]);
    expect(find('лечения зелья').map((x) => x.ru)).toContain('Зелье Лечения');
  });

  it('let each word hit a different field and language', () => {
    /* q26: the Russian name «Катана» and the English name "Katana" */
    expect(ids(find('катана katana'))).toContain('q26');
    expect(
      search([own('hb_twofieldsaaaaaa', 'Синий плащ', 'Даёт тень')], 'тень плащ')
    ).toHaveLength(1);
  });
});

describe('a phrase in quotes', () => {
  it('returns exactly what the substring rule returns', () => {
    expect(ids(find('"ring of"'))).toEqual(ids(contiguous('ring of')));
    expect(ids(find('«ring of»'))).toEqual(ids(contiguous('ring of')));
    expect(ids(find('"двуручное"'))).toEqual(ids(contiguous('двуручное')));
  });
});

describe('no near miss for a word form', () => {
  it('finds «лук» at a word start or «луки» inside a field for "луки"', () => {
    const hits = find('луки');
    expect(hits.length).toBeGreaterThan(0);
    expect(
      hits.every((x) =>
        [x.ru, x.rud, x.en, x.ende].some(
          (f) => atWordStart(f, 'лук') || (!!f && foldQuery(f).includes('луки'))
        )
      )
    ).toBe(true);
  });
});

describe('ranking', () => {
  const hay = hayFor(statLine);
  const rank = (q: string, rs: readonly Record_[] = index.searchable): Record_[] =>
    rankHits(rs, parseQuery(q), statLine, hay);
  const nameStart = (r: Record_, word: string): boolean =>
    atWordStart(r.ru, word) || atWordStart(r.en, word);

  it('puts a ring first for "ring"', () => {
    expect(nameStart(rank('ring')[0] as Record_, 'ring')).toBe(true);
  });

  it('puts every name with «меч» at a word start before every hit without', () => {
    const flags = rank('меч').map((r) => nameStart(r, 'меч'));
    const firstWithout = flags.indexOf(false);
    expect(firstWithout).toBeGreaterThan(0);
    expect(flags.slice(firstWithout)).not.toContain(true);
  });

  it('returns the records matches returns, and nothing for no terms', () => {
    const terms = parseQuery('меч огонь');
    expect(new Set(rankHits(index.searchable, terms, statLine, hay))).toEqual(
      new Set(index.searchable.filter((it) => matches(it, terms, statLine)))
    );
    expect(rankHits(index.searchable, [], statLine, hay)).toEqual([]);
  });

  it('keeps the given order on equal scores', () => {
    const a = own('hb_tieaaaaaaaaaaaaa', 'Плащ', 'Про меч');
    const b = own('hb_tiebbbbbbbbbbbbb', 'Сапог', 'Про меч');
    const c = own('hb_tieccccccccccccc', 'Меч');
    expect(rankHits([a, b, c], parseQuery('меч'))).toEqual([c, a, b]);
    expect(rankHits([b, a, c], parseQuery('меч'))).toEqual([c, b, a]);
  });

  it('ranks 300 own items with the catalogue, the catalogue first on a tie', () => {
    /* 3x the own item limit of 100 */
    const mine: Record_[] = Array.from({ length: 300 }, (_, i) =>
      i === 0
        ? own('hb_own0000000000000', 'Меч Домашний')
        : own(`hb_own${String(i).padStart(13, '0')}`, `Предмет ${String(i)}`, 'Ничего про меч')
    );
    const hits = rank('меч', [...index.searchable, ...mine]);
    const swordAt = hits.indexOf(mine[0] as Record_);
    /* an own name at a word start ranks above every catalogue description hit... */
    const catalogueDesc = hits.filter((r) => r.src !== 'homebrew' && !nameStart(r, 'меч'));
    expect(swordAt).toBeLessThan(hits.indexOf(catalogueDesc[0] as Record_));
    /* ...after the catalogue's names that score the same... */
    const catalogueSword = index.searchable.find(
      (r) => r.ru === 'Меч Адского Пламени'
    ) as Record_;
    expect(hits.indexOf(catalogueSword)).toBeLessThan(swordAt);
    /* ...and an own description hit follows the catalogue's equal ones */
    const equalDesc = catalogueDesc.filter(
      (r) =>
        ![r.ru, r.en].some((f) => foldQuery(f).includes('меч')) &&
        [r.rud, r.ende].some((f) => atWordStart(f, 'меч'))
    );
    expect(equalDesc.length).toBeGreaterThan(0);
    expect(hits.indexOf(equalDesc.at(-1) as Record_)).toBeLessThan(
      hits.indexOf(mine[1] as Record_)
    );
    expect(hits).toHaveLength(contiguous('меч').length + 300);
  });
});
