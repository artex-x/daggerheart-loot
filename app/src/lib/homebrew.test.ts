/* lib/homebrew.ts against the fixtures the SQL validators share
 * (docs/fixtures/homebrew/, tests/db/homebrew.test.mjs): every case gives exactly its
 * problems, and recordOf writes every snapshot case as homebrew_snapshot_of does. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  bookProblems,
  canonJson,
  contentProblems,
  editLang,
  groupsOf,
  HOMEBREW_KEY,
  isHomebrewKey,
  isHomebrewRecord,
  keyFrom,
  nameTaken,
  recordOf,
  SNAPSHOT_BYTES,
  snapshotValid,
  withRecords,
  type BookRef,
  type BookRow,
  type HomebrewContent,
  type Problem
} from './homebrew.js';
import { buildIndex } from './data.js';

const DIR = join(import.meta.dirname, '..', '..', '..', 'docs', 'fixtures', 'homebrew');
const read = (name: string): unknown => JSON.parse(readFileSync(join(DIR, name), 'utf8'));

interface Cases {
  valid: { name: string; content: unknown }[];
  invalid: { name: string; content: unknown; problems: Problem[] }[];
}
interface Snapshots {
  valid: {
    name: string;
    key: string;
    content: HomebrewContent;
    book: BookRef | null;
    snapshot: unknown;
  }[];
  invalid: { name: string; snapshot: unknown }[];
}

const items = read('items.json') as Cases;
const books = read('books.json') as Cases;
const snapshots = read('snapshots.json') as Snapshots;

describe('contentProblems over docs/fixtures/homebrew/items.json', () => {
  it.each(items.valid.map((c) => [c.name, c.content] as const))('accepts %s', (_n, content) => {
    expect(contentProblems(content)).toEqual([]);
  });
  it.each(items.invalid.map((c) => [c.name, c.content, c.problems] as const))(
    'refuses %s with exactly its problems',
    (_n, content, problems) => {
      expect(contentProblems(content)).toEqual(problems);
    }
  );
  it('refuses a name or a text holding U+0000, which jsonb refuses at input', () => {
    expect(contentProblems({ kind: 'item', ru: 'a\u0000' })).toEqual([
      { path: 'ru', rule: 'pattern' }
    ]);
    expect(contentProblems({ kind: 'item', ru: 'a', ende: '\u0000' })).toEqual([
      { path: 'ende', rule: 'pattern' }
    ]);
  });
  it('reads a kind that is not a string as the wrong type', () => {
    expect(contentProblems({ kind: 3, ru: 'a' })).toEqual([{ path: 'kind', rule: 'type' }]);
  });
});

describe('bookProblems over docs/fixtures/homebrew/books.json', () => {
  it.each(books.valid.map((c) => [c.name, c.content] as const))('accepts %s', (_n, content) => {
    expect(bookProblems(content)).toEqual([]);
  });
  it.each(books.invalid.map((c) => [c.name, c.content, c.problems] as const))(
    'refuses %s with exactly its problems',
    (_n, content, problems) => {
      expect(bookProblems(content)).toEqual(problems);
    }
  );
  it('refuses a source that is not an object and sections that are not a list', () => {
    expect(bookProblems('Alder')).toEqual([{ path: '', rule: 'type' }]);
    expect(bookProblems({ ru: 'a', sections: {} })).toEqual([
      { path: 'sections', rule: 'type' }
    ]);
    expect(bookProblems({ ru: 'a', sections: [1] })).toEqual([
      { path: 'sections.0', rule: 'type' }
    ]);
  });
});

describe('recordOf and snapshotValid over docs/fixtures/homebrew/snapshots.json', () => {
  it.each(snapshots.valid.map((c) => [c.name, c] as const))(
    'writes %s as its snapshot, which is valid',
    (_n, c) => {
      const record = recordOf(c.key, c.content, c.book);
      expect(record).toEqual(c.snapshot);
      expect(snapshotValid(record)).toBe(true);
    }
  );
  it.each(snapshots.invalid.map((c) => [c.name, c.snapshot] as const))(
    'refuses %s',
    (_n, snapshot) => {
      expect(snapshotValid(snapshot)).toBe(false);
    }
  );
  it('keeps the maximal snapshot under the bytes a list entry takes', () => {
    const max = snapshots.valid.find((c) => c.key === 'hb_maximalitemaaaaa');
    expect(max).toBeDefined();
    const bytes = new TextEncoder().encode(JSON.stringify(max?.snapshot)).length;
    expect(bytes).toBeGreaterThan(25_000);
    expect(bytes).toBeLessThan(SNAPSHOT_BYTES);
  });
  it('fills a missing language and an empty one from the other', () => {
    const r = recordOf('hb_aaaaaaaaaaaaaaaa', { kind: 'item', en: '', ru: 'Камень' }, null);
    expect([r.en, r.ru, r.ende, r.rud]).toEqual(['Камень', 'Камень', '', '']);
    const book = recordOf(
      'hb_aaaaaaaaaaaaaaaa',
      { kind: 'item', en: 'Stone' },
      {
        key: 'hb_bbbbbbbbbbbbbbbb',
        en: '',
        ru: 'Мастерская'
      }
    ).book;
    expect(book).toEqual({ key: 'hb_bbbbbbbbbbbbbbbb', en: 'Мастерская', ru: 'Мастерская' });
  });
  it('refuses a value that is not an object, a source with a bad key or a bad section', () => {
    expect(snapshotValid(null)).toBe(false);
    const axe = snapshots.valid.find((c) => c.key === 'hb_emberaxeaaaaaaaa')
      ?.snapshot as Record<string, unknown>;
    expect(snapshotValid({ ...axe, book: { key: 'x', en: 'A', ru: 'A' } })).toBe(false);
    expect(
      snapshotValid({ ...axe, book: { key: 'hb_bbbbbbbbbbbbbbbb', en: 'A', section: 1 } })
    ).toBe(false);
  });
});

describe('keys', () => {
  it('makes a fixed key from fixed bytes, of the key shape', () => {
    const bytes = Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    const key = keyFrom(bytes);
    expect(key).toBe('hb_aaaqeayeaudaocaj');
    expect(key).toMatch(HOMEBREW_KEY);
    expect(isHomebrewKey(key)).toBe(true);
    expect(keyFrom(new Uint8Array(10).fill(255))).toBe('hb_7777777777777777');
  });
  it('throws for fewer than 10 bytes', () => {
    expect(() => keyFrom(new Uint8Array(9))).toThrow(/10 random bytes/);
  });
  it('refuses a key of another shape', () => {
    expect(isHomebrewKey('hb_x1')).toBe(false);
    expect(isHomebrewKey('ci1')).toBe(false);
  });
});

describe('canonJson', () => {
  it('writes equal objects with keys in another order as one text, arrays in order', () => {
    expect(canonJson({ b: 1, a: { d: [2, 1], c: null } })).toBe(
      canonJson({ a: { c: null, d: [2, 1] }, b: 1 })
    );
    expect(canonJson({ a: [1, 2] })).not.toBe(canonJson({ a: [2, 1] }));
  });
});

const ALDER: BookRow = {
  id: 'b1',
  key: 'hb_alderworkshopaaa',
  content: {
    ru: 'Мастерская Ольхи',
    en: 'Alder Workshop',
    sections: [
      { key: 'hb_sectpistolsaaaaa', ru: 'Пистоли', en: 'Pistols' },
      { key: 'hb_sectbladesaaaaaa', ru: 'Холодное оружие', en: 'Blades' }
    ]
  },
  revision: 1,
  created_at: '2026-09-20T10:00:00Z',
  updated_at: '2026-09-20T10:00:00Z'
};
const LATER: BookRow = {
  id: 'b2',
  key: 'hb_laterbookaaaaaaa',
  content: { en: 'Later Book' },
  revision: 1,
  created_at: '2026-09-25T10:00:00Z',
  updated_at: '2026-09-25T10:00:00Z'
};
const refOf = (b: BookRow): BookRef => ({ ...b.content, key: b.key });

describe('isHomebrewRecord', () => {
  it('answers true for a homebrew record and false for a catalog one', () => {
    expect(
      isHomebrewRecord(recordOf('hb_aaaaaaaaaaaaaaaa', { kind: 'item', ru: 'А' }, null))
    ).toBe(true);
    expect(
      isHomebrewRecord({
        id: 'ci1',
        src: 'core',
        kind: 'item',
        en: '',
        ru: '',
        ende: '',
        rud: ''
      })
    ).toBe(false);
  });
});

describe('withRecords', () => {
  const base = buildIndex({
    items: {
      core_item: [{ id: 'ci1', src: 'core', kind: 'item', en: 'A', ru: 'А', ende: '', rud: '' }]
    }
  });
  const own = recordOf('hb_owneditemaaaaaa', { kind: 'item', ru: 'Своё' }, null);
  const frozenOwn = recordOf('hb_owneditemaaaaaa', { kind: 'item', ru: 'Старое' }, null);
  const frozen = recordOf('hb_frozenitemaaaaa', { kind: 'item', ru: 'Чужое' }, null);

  it('answers the base itself when there is nothing to add', () => {
    expect(withRecords(base, [], [])).toBe(base);
  });

  it('adds own records and frozen copies to byId and keeps the rest of the base', () => {
    const ix = withRecords(base, [own], [frozen]);
    expect(ix).not.toBe(base);
    expect(ix.byId.get('ci1')).toBe(base.byId.get('ci1'));
    expect(ix.byId.get(own.id)).toBe(own);
    expect(ix.byId.get(frozen.id)).toBe(frozen);
    expect(ix.all).toBe(base.all);
    expect(base.byId.has(own.id)).toBe(false);
  });

  it('never lets a frozen copy replace an own record, in either order of arrival', () => {
    expect(withRecords(base, [own], [frozenOwn]).byId.get(own.id)).toBe(own);
    const first = withRecords(base, [own], []);
    expect(withRecords(first, [], [frozenOwn]).byId.get(own.id)).toBe(own);
  });

  it('never lets a frozen copy replace a catalog record', () => {
    const fake = { ...frozen, id: 'ci1' };
    expect(withRecords(base, [], [fake]).byId.get('ci1')).toBe(base.byId.get('ci1'));
  });
});

describe('editLang', () => {
  it('answers the UI language for a new item and for one named in both languages', () => {
    expect(editLang(null, 'ru')).toBe('ru');
    expect(editLang(null, 'en')).toBe('en');
    expect(editLang({ kind: 'item', ru: 'А', en: 'A' }, 'en')).toBe('en');
    expect(editLang({ kind: 'item', ru: 'А', en: 'A' }, 'ru')).toBe('ru');
  });

  it('answers the one language that names the item', () => {
    expect(editLang({ kind: 'item', en: 'Cap' }, 'ru')).toBe('en');
    expect(editLang({ kind: 'item', ru: 'Кольцо', en: '  ' }, 'en')).toBe('ru');
  });
});

describe('nameTaken', () => {
  const names = [{ ru: 'Мастерская Ольхи', en: 'Alder Workshop' }, { en: 'Homebrew' }];

  it('finds a name in either language, trimmed and without case', () => {
    expect(nameTaken(names, '  мастерская ольхи ')).toBe(true);
    expect(nameTaken(names, 'ALDER WORKSHOP')).toBe(true);
    expect(nameTaken(names, 'homebrew')).toBe(true);
  });

  it('answers false for a new name and for an empty one', () => {
    expect(nameTaken(names, 'Кузня')).toBe(false);
    expect(nameTaken(names, '   ')).toBe(false);
  });
});

describe('groupsOf', () => {
  const alder = refOf(ALDER);
  const axe = recordOf(
    'hb_emberaxeaaaaaaaa',
    { kind: 'item', ru: 'Топор', en: 'Axe', section: 'hb_sectbladesaaaaaa' },
    alder
  );
  const gun = recordOf(
    'hb_gunaaaaaaaaaaaaa',
    { kind: 'item', ru: 'Пистоль', en: 'Gun', section: 'hb_sectpistolsaaaaa' },
    alder
  );
  const loose = recordOf('hb_looseaaaaaaaaaaa', { kind: 'item', ru: 'Молот' }, alder);
  const stray = recordOf(
    'hb_strayaaaaaaaaaaa',
    { kind: 'item', ru: 'Клещи', section: 'hb_sectgoneaaaaaaa' },
    alder
  );
  const ring = recordOf('hb_ringaaaaaaaaaaaa', { kind: 'item', ru: 'Кольцо' }, null);
  const cap = recordOf('hb_capaaaaaaaaaaaaa', { kind: 'item', en: 'Cap' }, null);
  const late = recordOf('hb_lateaaaaaaaaaaaa', { kind: 'item', en: 'Late' }, refOf(LATER));

  it('orders sources by creation, sections in order, the section-less items, then the default', () => {
    const groups = groupsOf(
      [LATER, ALDER],
      [ring, late, loose, axe, cap, gun, stray],
      'ru',
      'Хоумбрю'
    );
    expect(groups.map((g) => [g.id, g.label, g.items.map((i) => i.id)])).toEqual([
      ['hb_sectpistolsaaaaa', 'Мастерская Ольхи · Пистоли', [gun.id]],
      ['hb_sectbladesaaaaaa', 'Мастерская Ольхи · Холодное оружие', [axe.id]],
      ['hb_alderworkshopaaa', 'Мастерская Ольхи', [stray.id, loose.id]],
      ['hb_laterbookaaaaaaa', 'Later Book', [late.id]],
      ['hb', 'Хоумбрю', [ring.id, cap.id]]
    ]);
  });

  it('names the groups in English and leaves an empty group out', () => {
    const groups = groupsOf([ALDER], [axe], 'en', 'Homebrew');
    expect(groups.map((g) => g.label)).toEqual(['Alder Workshop · Blades']);
  });

  it('puts an item whose source is not held under the default source', () => {
    expect(groupsOf([], [late], 'ru', 'Хоумбрю').map((g) => g.id)).toEqual(['hb']);
  });
});
