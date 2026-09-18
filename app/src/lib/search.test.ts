/* Against the real catalogue, because the point of search is that it finds
   things in it. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildIndex, type Loot } from './data.js';
import { dict } from './dict.js';
import { eqLine } from './i18n.js';
import { isFrameRecord } from './label.js';
import { foldQuery, hayFor, matches, search, statLineFor } from './search.js';
import type { Record_ } from './types.js';

const LOOT = JSON.parse(
  readFileSync(join(import.meta.dirname, '..', '..', '..', 'data.json'), 'utf8')
) as Loot;
const index = buildIndex(LOOT);

const LABELS = { tier: 'Ранг', thresholds: 'Пороги', armorScore: 'Броня' };
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
    /* "Двуручное" is on no record as text - it is assembled from `bu` */
    const twoHanded = find('Двуручное');
    expect(twoHanded.length).toBeGreaterThan(10);
    expect(twoHanded.every((x) => x.eq?.bu === 2)).toBe(true);
  });

  it('does not invent a stat line for loot', () => {
    const noStats = matches(index.byId.get('ci1') as Record_, 'двуручное', statLine);
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
    expect(matches(loot, loot.ru.toLowerCase())).toBe(true);
    expect(matches(loot, 'заведомо отсутствующее слово')).toBe(false);
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
    expect(matches(gear, gear.ru.toLowerCase())).toBe(true);
    expect(matches(gear, 'ранг')).toBe(false);
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
    /* O2 (issues/phase-8, B11) normalised every record's own apostrophe to
       ASCII, so "Keeper's Staff" (q80) is now stored plain. The fold still has
       to run - iOS/macOS autocorrect turns a typed ' into U+2019 on the QUERY,
       not the record - so this case types the typographic form against the
       now-ASCII name. Before B11 this test exercised the record side instead;
       B11-BL-1 (issues/phase-8) found the old case had gone vacuous (both
       sides ASCII, search.ts:71's fold an identity transform on either). */
    expect(find('keeper’s staff').map((x) => x.id)).toContain('q80');
  });

  it('finds a name with a Latin diacritic typed in plain ASCII', () => {
    /* N7, owner-approved: "Ethereal Zweihänder" (q238) and "Möbius Orb"
       (q311) were unreachable by ordinary typing across all 1091 records. */
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
      "keeper's staff"
    ];
    for (const q of queries) {
      const folded = foldQuery(q);
      const withHay = index.searchable
        .filter((it) => matches(it, folded, statLine, hay))
        .map((x) => x.id);
      const withoutHay = index.searchable
        .filter((it) => matches(it, folded, statLine))
        .map((x) => x.id);
      expect(withHay).toEqual(withoutHay);
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

  it('keeps the tier word for a frame record (D11, paid off)', () => {
    /* R0b.4 (2026-09-16) once made this match the live app, which dropped the
       tier word for frame equipment - app.js:612's `if (e.tier &&
       !isFrameRecord(it))`. D11 named that a defect, not a rule: an
       identical piece of armour prints its tier when it sits in `eq` and hid
       it when it sat in a frame table, with nothing a reader can see to
       explain the difference. The owner settled on printing it like any
       other equipment (Q6), so `statLineFor` no longer passes `noTier` at
       all - this is the inverse of the case R0b.4 added. */
    const frame = index.searchable.find((r) => isFrameRecord(r) && r.eq?.tier === 1) as Record_;
    expect(frame).toBeDefined();
    const line = statLineFor('ru', dict('ru'))(frame);
    expect(line).toContain('Ранг');
    expect(
      search(index.searchable, 'ранг 1', statLineFor('ru', dict('ru'))).map((r) => r.id)
    ).toContain(frame.id);
  });
});
