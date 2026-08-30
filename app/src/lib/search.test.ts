/* Against the real catalogue, because the point of search is that it finds
   things in it. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildIndex, type Loot } from './data.js';
import { eqLine } from './i18n.js';
import { matches, search } from './search.js';
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
       "лук" should not turn up "клык" */
    const bow = find('Лук');
    expect(bow.every((x) => (x.ru + x.rud + x.en + x.ende).toLowerCase().includes('лук'))).toBe(
      true
    );
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
