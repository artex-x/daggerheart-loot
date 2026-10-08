/* `deriveFile` over a file at every bound (100 sources of 30 sections, 1000 cards, 1000
 * items, every reference field full), in the `timed` project: the bound is a time
 * (vite.config.mts, `timed`). */

import { describe, expect, it } from 'vitest';
import { CRAFT_MAX, HOMEBREW_KEY, REFS_MAX, SECTIONS_MAX } from './homebrew.js';
import {
  deriveFile,
  FILE_BOOKS_MAX,
  FILE_CARDS_MAX,
  FILE_ITEMS_MAX,
  HOMEBREW_FORMAT,
  type HomebrewFile
} from './homebrewFile.js';

const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
/* A key of 12 characters of `prefix` and `n` in four letters. */
const key = (prefix: string, n: number): string => {
  let s = '';
  for (let i = 0, v = n; i < 4; i++, v = Math.floor(v / 26)) s = LETTERS.charAt(v % 26) + s;
  return 'hb_' + prefix.padEnd(12, 'a') + s;
};

const file: HomebrewFile = {
  format: HOMEBREW_FORMAT,
  version: 2,
  books: Array.from({ length: FILE_BOOKS_MAX }, (_, b) => ({
    key: key('book', b),
    en: 'Book ' + String(b),
    sections: Array.from({ length: SECTIONS_MAX }, (_, s) => ({
      key: key('sect', b * SECTIONS_MAX + s),
      en: 'Section ' + String(s)
    }))
  })),
  cards: Array.from({ length: FILE_CARDS_MAX }, (_, c) => ({
    key: key('card', c),
    kind: c % 2 ? ('ref' as const) : ('set' as const),
    book: key('book', c % FILE_BOOKS_MAX),
    en: 'Card ' + String(c),
    items: ['ci1']
  })),
  items: Array.from({ length: FILE_ITEMS_MAX }, (_, i) => {
    const b = i % FILE_BOOKS_MAX;
    const others = (from: number): string[] =>
      Array.from({ length: CRAFT_MAX }, (_, k) => key('item', (from + k) % FILE_ITEMS_MAX));
    return {
      key: key('item', i),
      book: key('book', b),
      section: key('sect', b * SECTIONS_MAX + (i % SECTIONS_MAX)),
      kind: 'equip' as const,
      en: 'Item ' + String(i),
      set: key('card', (i * 2) % FILE_CARDS_MAX),
      refs: Array.from({ length: REFS_MAX }, (_, r) =>
        key('card', (i * 2 + 1 + 2 * r) % FILE_CARDS_MAX)
      ),
      craft: others(i + 1),
      craft_from: others(i + 1 + CRAFT_MAX),
      eq: {
        t: 'weapon' as const,
        tier: 1 as const,
        line: key('item', (i + 500) % FILE_ITEMS_MAX)
      }
    };
  })
};

describe('deriveFile at the file bounds', () => {
  it('derives every key once, unique, with every reference followed, in under 500 ms', () => {
    const start = performance.now();
    const { file: f, from } = deriveFile(file, '00000000-0000-4000-8000-000000000002', {
      books: [],
      items: [],
      cards: []
    });
    expect(performance.now() - start).toBeLessThan(500);
    const sections = f.books.flatMap((b) => (b.sections ?? []).map((s) => s.key));
    const own = [
      ...f.books.map((b) => b.key),
      ...sections,
      ...f.cards.map((c) => c.key),
      ...f.items.map((i) => i.key)
    ];
    expect(new Set(own).size).toBe(own.length);
    expect(from.size).toBe(own.length);
    for (const k of own) expect(k).toMatch(HOMEBREW_KEY);
    const books = new Set(f.books.map((b) => b.key));
    const cards = new Set(f.cards.map((c) => c.key));
    const items = new Set(f.items.map((i) => i.key));
    const named = new Set(sections);
    for (const c of f.cards) expect(books.has(c.book ?? '')).toBe(true);
    for (const i of f.items) {
      const refs = [i.set ?? '', ...(i.refs ?? [])];
      const rel = [...(i.craft ?? []), ...(i.craft_from ?? []), i.eq?.line ?? ''];
      expect(books.has(i.book ?? '') && named.has(i.section ?? '')).toBe(true);
      expect(refs.every((k) => cards.has(k)) && rel.every((k) => items.has(k))).toBe(true);
    }
  });
});
