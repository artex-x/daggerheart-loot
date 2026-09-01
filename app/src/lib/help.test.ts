/* What a roll page explains about itself. */

import { describe, expect, it } from 'vitest';
import { helpFor } from './help.js';
import type { Lang } from './types.js';

const LANGS: Lang[] = ['ru', 'en'];

describe('the help for a section', () => {
  it('is written for both sections that have one, in both languages', () => {
    for (const section of ['wondrous', 'dread']) {
      for (const lang of LANGS) {
        const help = helpFor(section, lang);
        expect(help, `${section}/${lang}`).not.toBe(null);
        expect(help?.paragraphs.length, `${section}/${lang}`).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it('names the book as a link rather than as prose', () => {
    /* A source somebody cannot follow is a citation, not a source. */
    const help = helpFor('wondrous', 'ru');
    expect(help?.source.href).toMatch(/^https:\/\//);
    expect(help?.source.label).toBe('Wondrous Environments');
  });

  it('answers the question the page raises: why not a die', () => {
    expect(helpFor('wondrous', 'ru')?.paragraphs[0]).toContain(
      'Кости на такой диапазон не бывает'
    );
    expect(helpFor('dread', 'ru')?.paragraphs[0]).toContain(
      'Кости на такой диапазон не бывает'
    );
  });

  it('has nothing to say about a section nobody wrote one for', () => {
    expect(helpFor('voa', 'ru')).toBe(null);
    expect(helpFor('nonsense', 'ru')).toBe(null);
  });
});
