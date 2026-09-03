/* What a roll page explains about itself. */

import { describe, expect, it } from 'vitest';
import { helpFor, isLink } from './help.js';
import type { Help, HelpLink } from './help.js';
import type { Lang } from './types.js';

const LANGS: Lang[] = ['ru', 'en'];
const SECTIONS = ['std', 'alt', 'wondrous', 'dread', 'voa', 'community'];

/** Everything a paragraph says, with the link labels in place. */
const textOf = (help: Help | null, i: number): string =>
  (help?.paragraphs[i]?.lead ?? '') +
  (help?.paragraphs[i]?.parts ?? []).map((part) => (isLink(part) ? part.label : part)).join('');

const linksOf = (help: Help | null): HelpLink[] =>
  (help?.paragraphs ?? []).flatMap((para) => para.parts.filter(isLink));

describe('the help for a section', () => {
  it('is written for every section that has one, in both languages', () => {
    for (const section of SECTIONS) {
      for (const lang of LANGS) {
        const help = helpFor(section, lang);
        expect(help, `${section}/${lang}`).not.toBe(null);
        expect(help?.paragraphs.length, `${section}/${lang}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('names every book as a link rather than as prose', () => {
    /* A source somebody cannot follow is a citation, not a source. Core rules
       is not in this list: it explains the core book's own tables and cites no
       supplement, so it has no link to check. */
    for (const section of SECTIONS.filter((s) => s !== 'std')) {
      for (const lang of LANGS) {
        const links = linksOf(helpFor(section, lang));
        expect(links.length, `${section}/${lang}`).toBeGreaterThan(0);
        for (const l of links) expect(l.href, `${section}/${lang}`).toMatch(/^https:\/\//);
      }
    }
  });

  it('carries all three volumes of Vault of Ages, not just the first', () => {
    /* One link where the live text has three would quietly drop two books. */
    const links = linksOf(helpFor('voa', 'ru'));
    expect(links.map((l) => l.label)).toEqual([
      'Vault of Ages Volume 1',
      'Volume 2',
      'Volume 3'
    ]);
  });

  it('keeps the bold opening the live text gives a named rule', () => {
    const voa = helpFor('voa', 'ru');
    expect(voa?.paragraphs[1]?.lead).toBe('Стоимость Призыва.');
    /* And does not put one where the live text has none. */
    expect(voa?.paragraphs[0]?.lead).toBeUndefined();
  });

  it('answers the question the page raises: why not a die', () => {
    expect(textOf(helpFor('wondrous', 'ru'), 0)).toContain('Кости на такой диапазон не бывает');
    expect(textOf(helpFor('dread', 'ru'), 0)).toContain('Кости на такой диапазон не бывает');
    expect(textOf(helpFor('voa', 'ru'), 0)).toContain('Своей таблицы броска у книги нет');
  });

  it('credits the alternate tables to the person who wrote them', () => {
    /* Not a book but a Reddit post, and the two links say different things -
       one names the author, the other the tables. Dropping either turns a
       credit into a claim. */
    for (const lang of LANGS) {
      const links = linksOf(helpFor('alt', lang));
      expect(links.map((l) => l.href)).toEqual([
        'https://www.reddit.com/user/PrinceOfNowhereee/',
        'https://www.reddit.com/r/daggerheart/comments/1v3z3gm/alternate_loot_tables_combining_hope_fear_with/'
      ]);
    }
    expect(linksOf(helpFor('alt', 'ru'))[1]?.label).toBe('пост на Reddit');
  });

  it('has nothing to say about a section nobody wrote one for', () => {
    expect(helpFor('nonsense', 'ru')).toBe(null);
  });
});
