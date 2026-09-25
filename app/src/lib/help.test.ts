/* What a roll page explains about itself. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Loot } from './data.js';
import { helpFor, isBold, isBreak, isLink, moneyHelpFor } from './help.js';
import type { Help, HelpLink, HelpPart } from './help.js';
import type { Lang } from './types.js';

const LANGS: Lang[] = ['ru', 'en'];
const SECTIONS = ['std', 'alt', 'wondrous', 'dread', 'voa', 'dv', 'community'];

/** What one part reads as, so a paragraph can be compared as plain text. */
const partText = (part: HelpPart): string => {
  if (isLink(part)) return part.label;
  if (isBold(part)) return part.b;
  if (isBreak(part)) return '\n';
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

  it('carries markup as shape rather than as text', () => {
    /* The Core rules paragraph that lists where each rarity fits is one
       paragraph with four bold lines inside it. It was ported as a string with
       the tags still in it and shipped showing "<br><b>Common</b>" as words,
       because nothing rendered that panel and no parity state opened it. */
    for (const lang of LANGS) {
      for (const para of helpFor('std', lang)?.paragraphs ?? []) {
        for (const part of para.parts) {
          if (typeof part === 'string') expect(part, lang).not.toMatch(/[<>]/);
        }
      }
    }

    const ru = helpFor('std', 'ru')?.paragraphs[1];
    expect(ru?.parts.filter(isBreak)).toHaveLength(4);
    expect(ru?.parts.filter(isBold).map((b) => b.b)).toEqual([
      'Обычная',
      'Необычная',
      'Редкая',
      'Легендарная'
    ]);
    expect(
      helpFor('std', 'en')
        ?.paragraphs[1]?.parts.filter(isBold)
        .map((b) => b.b)
    ).toEqual(['Common', 'Uncommon', 'Rare', 'Legendary']);
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

  it('bolds both roles the two notes, the share button and the two links play, mid-sentence', () => {
    /* "Для игроков"/"Только для мастера", "Поделиться" and "Ссылка
       игрокам"/"Ссылка себе" sit inside running prose rather than opening
       their paragraph, so each is a run of parts rather than a `lead`. */
    const bold = (lang: 'ru' | 'en', at: number) =>
      helpFor('lists', lang)
        ?.paragraphs[at]?.parts.filter(isBold)
        .map((b) => b.b);
    for (const lang of LANGS) {
      const lists = helpFor('lists', lang);
      expect(lists?.paragraphs.length, lang).toBe(5);
      expect(lists?.paragraphs[0]?.lead, lang).toBeUndefined();
      expect(lists?.paragraphs[1]?.parts.filter(isBold), lang).toHaveLength(0);
    }
    expect(bold('ru', 2)).toEqual(['Для игроков', 'Только для мастера']);
    expect(bold('ru', 3)).toEqual(['Поделиться']);
    expect(bold('ru', 4)).toEqual(['Ссылка игрокам', 'Ссылка себе']);
    expect(bold('en', 2)).toEqual(['For players', 'GM only']);
    expect(bold('en', 3)).toEqual(['Share']);
    expect(bold('en', 4)).toEqual(["Players' link", 'Your own link']);
  });

  it('names the date the old list links stop opening', () => {
    expect(textOf(helpFor('lists', 'ru'), 4)).toContain('26 октября 2026 года');
    expect(textOf(helpFor('lists', 'en'), 4)).toContain('26 October 2026');
  });

  it('bolds the three-unit list and the three worked examples in the money help', () => {
    /* Not a section's help (no page route is called "money"), so it is read
       through its own function rather than helpFor. */
    for (const lang of LANGS) {
      const help = moneyHelpFor(lang);
      expect(help.paragraphs.length, lang).toBe(1);
      expect(help.paragraphs[0]?.parts.filter(isBold), lang).toHaveLength(5);
    }
    expect(
      moneyHelpFor('ru')
        .paragraphs[0]?.parts.filter(isBold)
        .map((b) => b.b)
    ).toEqual([
      'горстями, мешками и сундуками',
      '7 мешков 5 горстей',
      '8 мешков 9 горстей',
      '9 мешков',
      '8 мешков'
    ]);
    expect(
      moneyHelpFor('en')
        .paragraphs[0]?.parts.filter(isBold)
        .map((b) => b.b)
    ).toEqual([
      'handfuls, bags and chests',
      '7 bags 5 handfuls',
      '8 bags 9 handfuls',
      '9 bags',
      '8 bags'
    ]);
  });
});

describe('the tables help against the data', () => {
  /* Every book whose equipment also rolls on its own table is named where the
     help says so; Vault of Ages was once left out of that list. */
  const LOOT = JSON.parse(
    readFileSync(join(import.meta.dirname, '..', '..', '..', 'data.json'), 'utf8')
  ) as Loot;
  const BOOK: Record<string, string> = {
    wondrous: 'Wondrous Loot',
    dread: 'Dread',
    voa: 'Vault of Ages',
    dv: "The Dragon's Vault"
  };
  const rolled = [
    ...new Set(
      Object.values(LOOT.items)
        .flat()
        .filter((it) => it.eq && it.roll != null)
        .map((it) => it.src)
    )
  ].sort();

  it('knows every book with rolled equipment', () => {
    expect(rolled).toEqual(Object.keys(BOOK).sort());
  });

  it.each([
    ['ru', /номер/],
    ['en', /roll number/]
  ] as const)('names each of them wherever %s mentions a roll number', (lang, mark) => {
    const help = helpFor('tables', lang);
    const paras = (help?.paragraphs ?? [])
      .map((_, i) => textOf(help, i))
      .filter((text) => mark.test(text) && text.includes('Wondrous Loot'));
    expect(paras.length).toBe(2);
    for (const text of paras) {
      for (const src of rolled) expect(text, src).toContain(BOOK[src]);
    }
  });
});
