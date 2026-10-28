/* The two forms of one address against docs/fixtures/urls/paths.json, and the
   round trip of every route the app parses. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { addressOf, pathOf } from './address.js';
import { parseHash, recordUrl } from './hash.js';
import type { Lang } from './types.js';

const FIX = join(import.meta.dirname, '..', '..', '..', 'docs', 'fixtures', 'urls');

interface PathsFixture {
  parse: { path: string; fragment: string; hash: string; lang: Lang | null; why: string }[];
  build: { hash: string; lang: Lang; path: string; why: string }[];
}

const PATHS = JSON.parse(readFileSync(join(FIX, 'paths.json'), 'utf8')) as PathsFixture;
const ROUTES = JSON.parse(readFileSync(join(FIX, 'routes.json'), 'utf8')) as { hash: string }[];
const PREVIEW = JSON.parse(readFileSync(join(FIX, 'preview.json'), 'utf8')) as {
  origin: string;
  build: { hash: string; lang: Lang; v?: string; url: string | null }[];
};

const parses = (h: string): boolean => parseHash(h).kind !== 'unknown';

describe('addressOf, docs/fixtures/urls/paths.json', () => {
  for (const c of PATHS.parse) {
    it(`${c.path}${c.fragment} - ${c.why}`, () => {
      expect(addressOf(c.path, c.fragment, parses)).toEqual({ hash: c.hash, lang: c.lang });
    });
  }

  it('keeps a trailing slash when no parser is given', () => {
    expect(addressOf('/roll/std/', '')).toEqual({ hash: '#/roll/std/', lang: 'ru' });
  });

  it('keeps a trailing slash when the address without it does not parse either', () => {
    expect(addressOf('/nonsense/', '', parses)).toEqual({ hash: '#/nonsense/', lang: 'ru' });
  });
});

describe('pathOf, docs/fixtures/urls/paths.json', () => {
  for (const c of PATHS.build) {
    it(`${c.hash} (${c.lang}) - ${c.why}`, () => {
      expect(pathOf(c.hash, c.lang)).toBe(c.path);
    });
  }
});

describe('the round trip', () => {
  it('reads back every route of routes.json in both languages', () => {
    for (const { hash } of ROUTES) {
      for (const lang of ['ru', 'en'] as const) {
        const key = hash === '#/' ? '#/' : hash;
        expect(addressOf(pathOf(key, lang), '', parses)).toEqual({ hash: key, lang });
      }
    }
  });

  it('builds the record link of recordUrl', () => {
    const base = 'https://e.test/';
    for (const lang of ['ru', 'en'] as const) {
      expect(recordUrl({ base }, 'ci1', lang)).toBe(base + pathOf('#/i/ci1', lang).slice(1));
    }
  });

  it('builds the link of every card family in preview.json', () => {
    for (const c of PREVIEW.build) {
      expect(PREVIEW.origin + pathOf(c.hash, c.lang) + (c.v ? '?v=' + c.v : '')).toBe(c.url);
    }
  });
});
