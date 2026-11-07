/* What a roll page explains about itself. */

import { describe, expect, it } from 'vitest';
import { helpFor, isBold, isLink } from './help.js';
import type { Help, HelpLink, HelpPart } from './help.js';
import type { Lang } from './types.js';

const LANGS: Lang[] = ['ru', 'en'];
const SECTIONS = ['std', 'alt', 'wondrous', 'dread', 'voa', 'dv', 'arazo', 'community', 'mwt'];

/** What one part reads as, so a paragraph can be compared as plain text. */
const partText = (part: HelpPart): string => {
  if (isLink(part)) return part.label;
  if (isBold(part)) return part.b;
  return part;
};

/** Everything a paragraph says, with the link labels in place. */
const textOf = (help: Help | null, i: number): string =>
  (help?.paragraphs[i]?.lead ?? '') + (help?.paragraphs[i]?.parts ?? []).map(partText).join('');

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

  it('carries all four volumes of Vault of Ages, not just the first', () => {
    /* One link where the live text has four would quietly drop three books. */
    const links = linksOf(helpFor('voa', 'ru'));
    expect(links.map((l) => l.label)).toEqual([
      'Vault of Ages Volume 1',
      'Volume 2',
      'Volume 3',
      'Volume 4'
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

  it('holds the four placement lines of the book and nothing else on the Core rules page', () => {
    const leads = {
      ru: ['Обычная', 'Необычная', 'Редкая', 'Легендарная'],
      en: ['Common', 'Uncommon', 'Rare', 'Legendary']
    };
    for (const lang of LANGS) {
      const paragraphs = helpFor('std', lang)?.paragraphs ?? [];
      expect(paragraphs.map((p) => p.lead)).toEqual(leads[lang]);
      for (const para of paragraphs) {
        for (const part of para.parts) {
          if (typeof part === 'string') expect(part, lang).not.toMatch(/[<>]/);
        }
      }
    }
  });

  it('names each roll help button after its panel, in both languages', () => {
    const names: Record<string, [string, string]> = {
      std: ['Где какая редкость', 'Where each rarity is'],
      alt: ['Об этих таблицах', 'About these tables'],
      wondrous: ['Об этой таблице', 'About this table'],
      dread: ['Об этой книге', 'About this book'],
      voa: ['Об этой книге', 'About this book'],
      dv: ['Об этой книге', 'About this book'],
      arazo: ['Об этой книге', 'About this book'],
      mwt: ['Об этой книге', 'About this book'],
      community: ['Об этих предметах', 'About these items']
    };
    for (const section of SECTIONS) {
      expect(helpFor(section, 'ru')?.button, section).toBe(names[section]?.[0]);
      expect(helpFor(section, 'en')?.button, section).toBe(names[section]?.[1]);
    }
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

  it('links each Many Worlds Tavern realm to its own product page', () => {
    for (const lang of LANGS) {
      expect(linksOf(helpFor('mwt', lang)).map((l) => l.label)).toEqual([
        'Sporopolis',
        'Wagerwood',
        "Warrin' Warrens",
        'Godsvale',
        'Hornet Hold',
        'The Drome'
      ]);
    }
    expect(textOf(helpFor('mwt', 'ru'), 0)).toContain('Воюющие Норы - 21');
    expect(textOf(helpFor('mwt', 'en'), 0)).toContain("Warrin' Warrens 21");
    expect(textOf(helpFor('mwt', 'ru'), 0)).toContain('Оплот Шершней - 11, Дром - 17');
    expect(textOf(helpFor('mwt', 'en'), 0)).toContain('Hornet Hold 11 and The Drome 17');
  });

  it('writes no help for «Мои предметы» and «Мои списки»', () => {
    for (const lang of LANGS) {
      expect(helpFor('homebrew', lang)).toBeNull();
      expect(helpFor('lists', lang)).toBeNull();
    }
  });

  it('has nothing to say about a section nobody wrote one for', () => {
    expect(helpFor('nonsense', 'ru')).toBe(null);
  });

  it('tells a bold word, a link and a plain run apart', () => {
    expect(isBold({ b: 'word' })).toBe(true);
    expect(isBold({ href: '/x', label: 'x' })).toBe(false);
    expect(isBold('plain')).toBe(false);
    expect(isLink({ href: '/x', label: 'x' })).toBe(true);
    expect(isLink({ b: 'word' })).toBe(false);
    expect(isLink('plain')).toBe(false);
  });
});

describe('the tables help, «Об этих данных»', () => {
  it.each(LANGS)('holds three data notes, each with a bold lead, in %s', (lang) => {
    const help = helpFor('tables', lang);
    expect(help?.paragraphs).toHaveLength(3);
    expect(help?.paragraphs.every((para) => !!para.lead)).toBe(true);
    expect(help?.button).toBe(lang === 'ru' ? 'Об этих данных' : 'About this data');
    expect(linksOf(help).map((l) => l.label)).toEqual(['daggerheart.su']);
  });
});
