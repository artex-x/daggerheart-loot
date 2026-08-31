/* The address grammar against the same fixtures tests/contracts.js replays. A
   fixture records what the address unfolds into on screen: which section is
   highlighted, how many rows survive, which filter pills appear. What the parser
   can see - the table name and the picked values - is read out of it here, so one
   file holds both implementations to account. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  legacySource,
  parseHash,
  printHash,
  printIds,
  PRINT_MAX,
  recordHash,
  sectionHash,
  sharedListHash,
  storedListHash,
  recordUrl,
  appUrl,
  stripHash,
  tablesHash,
  type Route
} from './hash.js';
import { decodeFilter, encodeFilter, groupsFor, passes } from './filters.js';
import { isTableId, SECTIONS, type TableId } from './types.js';

interface RouteFixture {
  hash: string;
  why: string;
  resolves: {
    hash: string;
    tab: string | null;
    rows: number;
    printCards: number;
    picked: string[];
    source?: string[];
  };
}

const FIXTURES: RouteFixture[] = JSON.parse(
  readFileSync(
    join(import.meta.dirname, '..', '..', '..', 'docs', 'fixtures', 'urls', 'routes.json'),
    'utf8'
  )
) as RouteFixture[];

describe('golden route fixtures', () => {
  it('there are at least twenty', () => {
    expect(FIXTURES.length).toBeGreaterThanOrEqual(20);
  });

  for (const fx of FIXTURES) {
    it(fx.hash + ' - ' + fx.why, () => {
      const route = parseHash(fx.hash);

      /* The fixture recorded which tab lit up. For the parser that is the same
         question: which section does the address lead to. */
      if (fx.resolves.tab === '#/tables') {
        expect(route.kind).toBe('tables');
      } else if (fx.resolves.printCards > 0) {
        expect(route.kind).toBe('print');
      }

      /* The pills on screen are the selection narrowed to the groups the table
         offers. Parsing keeps a foreign group (the address is read as written),
         while the panel does not show it and the filter does not apply it -
         which is why the table stays whole. */
      if (route.kind === 'tables' && route.table) {
        const shown = groupsFor(route.table).flatMap((g) =>
          (route.filter[g] ?? []).map((v) => g + ':' + v)
        );
        expect(shown.sort()).toEqual([...fx.resolves.picked].sort());
      }
    });
  }
});

describe('old section names', () => {
  /* The fixture holds the source switch state for all three */
  const legacy = FIXTURES.filter((f) => f.resolves.source && f.hash.startsWith('#/roll/'));

  it('four are in the fixtures: three old and the current one', () => {
    expect(legacy.length).toBeGreaterThanOrEqual(4);
  });

  for (const fx of legacy) {
    it(fx.hash + ' turns on the same sources as the screen', () => {
      const src = legacySource(fx.hash);
      if (!src) {
        /* The current name: the app turns both sources on itself */
        expect(fx.resolves.source).toEqual(['core:on', 'hnf:on']);
        return;
      }
      expect(['core:' + (src.core ? 'on' : 'off'), 'hnf:' + (src.hnf ? 'on' : 'off')]).toEqual(
        fx.resolves.source
      );
    });
  }

  it('lead to the same section without rewriting the address', () => {
    for (const h of ['#/roll/core', '#/roll/hnf', '#/roll/all']) {
      const r = parseHash(h);
      expect(r.kind).toBe('section');
      expect((r as Extract<Route, { kind: 'section' }>).section).toBe('roll/std');
    }
  });
});

describe('tables', () => {
  it('a name that does not exist is not swapped for a default', () => {
    const r = parseHash('#/tables/not_a_table');
    expect(r.kind).toBe('tables');
    expect((r as Extract<Route, { kind: 'tables' }>).table).toBeNull();
  });

  it('a tail without f_ is an anchor', () => {
    const r = parseHash('#/tables/alt_item/rare');
    expect(r).toEqual({ kind: 'tables', table: 'alt_item', anchor: 'rare', filter: {} });
  });

  it('anchor and filter never appear together', () => {
    const r = parseHash('#/tables/eq_weapon/f_tier-2');
    expect((r as Extract<Route, { kind: 'tables' }>).anchor).toBe('');
  });
});

describe('the filter segment', () => {
  it('a dot splits groups, a dash splits values', () => {
    expect(decodeFilter('f_tier-1-2.cls-mag')).toEqual({ tier: ['1', '2'], cls: ['mag'] });
  });

  it('an underscore inside a value does not split the group', () => {
    expect(decodeFilter('f_frame-beast_feast')).toEqual({ frame: ['beast_feast'] });
  });

  it('the older separator is still read', () => {
    expect(decodeFilter('f_tier-1_cls-phy')).toEqual({ tier: ['1'], cls: ['phy'] });
  });

  it('builds back into the same segment', () => {
    for (const seg of ['f_tier-1-2.cls-mag', 'f_range-melee', 'f_burden-2.line-uniq']) {
      expect(encodeFilter(decodeFilter(seg), groupsFor('eq_weapon'))).toBe(seg);
    }
  });

  it('an untouched filter takes no room in the address', () => {
    expect(encodeFilter({}, groupsFor('eq_weapon'))).toBe('');
    expect(encodeFilter({ tier: [] }, groupsFor('eq_weapon'))).toBe('');
    expect(tablesHash('eq_weapon', { filter: {} })).toBe('#/tables/eq_weapon');
  });

  it('a group the table does not offer never reaches the address', () => {
    /* The other side of a foreign group being ignored silently on read */
    expect(encodeFilter({ burden: ['2'] }, groupsFor('eq_armor'))).toBe('');
  });

  it('the group names are the ones written in the spec', () => {
    expect(groupsFor('eq_weapon')).toEqual([
      'tier',
      'src',
      'cls',
      'trait',
      'range',
      'burden',
      'line'
    ]);
    expect(groupsFor('eq_weapon')).not.toContain('rg');
    expect(groupsFor('eq_weapon')).not.toContain('bu');
  });
});

describe('selection', () => {
  const groups = groupsFor('eq_weapon');
  const katana = (g: string): string =>
    ({
      tier: '1',
      src: 'hnf',
      cls: 'phy',
      trait: 'agility',
      range: 'melee',
      burden: '2',
      line: 'line'
    })[g] ?? '';

  it('an empty filter lets everything through', () => {
    expect(passes({}, groups, katana)).toBe(true);
  });

  it('inside a group it is OR', () => {
    expect(passes({ tier: ['1', '4'] }, groups, katana)).toBe(true);
    expect(passes({ tier: ['2', '4'] }, groups, katana)).toBe(false);
  });

  it('groups narrow each other', () => {
    expect(passes({ tier: ['1'], cls: ['phy'] }, groups, katana)).toBe(true);
    expect(passes({ tier: ['1'], cls: ['mag'] }, groups, katana)).toBe(false);
  });

  it('a foreign group does not empty the table', () => {
    /* A value arrived by link for a facet this table does not have */
    expect(passes({ rg: ['melee'] }, groups, katana)).toBe(true);
  });
});

describe('print', () => {
  const knows = (id: string): boolean => id.startsWith('ci') || id.startsWith('q');

  it('drops unknown ids and repeats, keeping the order', () => {
    expect(printIds('ci1-zzz-q26-ci1-q33', knows)).toEqual(['ci1', 'q26', 'q33']);
  });

  it('never takes more than the limit', () => {
    const many = Array.from({ length: PRINT_MAX + 20 }, (_, i) => 'ci' + String(i + 1)).join(
      '-'
    );
    expect(printIds(many, knows)).toHaveLength(PRINT_MAX);
  });
});

describe('an unreadable address', () => {
  it('says plainly that it could not be read', () => {
    for (const h of ['#/nonsense', '#/roll/nope', '#/i/', '']) {
      expect(parseHash(h).kind).toBe('unknown');
    }
  });
});

describe('building back', () => {
  it('a section rebuilds into the address it was parsed from', () => {
    for (const fx of FIXTURES) {
      const r = parseHash(fx.hash);
      if (r.kind !== 'section') continue;
      /* Except the old names: they lead to roll/std but must not be rewritten */
      if (legacySource(fx.hash)) continue;
      expect(sectionHash(r.section)).toBe(fx.hash);
    }
  });

  it('a table with a filter builds back', () => {
    for (const fx of FIXTURES) {
      const r = parseHash(fx.hash);
      if (r.kind !== 'tables' || !r.table || !isTableId(r.table)) continue;
      const table: TableId = r.table;
      const back = tablesHash(table, { anchor: r.anchor, filter: r.filter });
      const again = parseHash(back);
      expect(again.kind).toBe('tables');
      /* What the table offers is preserved. A foreign group survives reading but
         not writing: the rebuilt address carries only what applies. */
      const kept = Object.fromEntries(
        groupsFor(table)
          .filter((g) => r.filter[g]?.length)
          .map((g) => [g, r.filter[g]])
      );
      expect(again).toEqual({ kind: 'tables', table, anchor: r.anchor, filter: kept });
    }
  });
});

describe('writing an address', () => {
  /* The writers had no test of their own: the fixtures pin what an address
     means when it arrives, and these are what the app puts in a link. A link
     the app writes and cannot read afterwards is the failure they guard. */

  it('strips the hash and the slash, and leaves a bare path alone', () => {
    expect(stripHash('#/roll/std')).toBe('roll/std');
    expect(stripHash('#roll/std')).toBe('roll/std');
    expect(stripHash('roll/std')).toBe('roll/std');
    expect(stripHash('#')).toBe('');
    expect(stripHash('')).toBe('');
  });

  it('writes an address every section can be read back from', () => {
    /* The tab bar builds its links out of this, so a section the writer and the
       parser disagree about is a tab that highlights nothing when clicked. */
    /* Only `tables` gets a kind of its own: it carries a table, an anchor and a
       filter, and the parser has to hand those back. `lists` is a plain
       section - a single stored list is what becomes `storedList`. */
    const expected: Record<string, string> = { tables: 'tables' };
    for (const s of SECTIONS) {
      const h = sectionHash(s);
      expect(parseHash(h).kind, h).toBe(expected[s] ?? 'section');
    }
  });

  it('lands every section on itself, not on a neighbour', () => {
    for (const s of SECTIONS) {
      const r = parseHash(sectionHash(s));
      if (r.kind === 'section') expect(r.section, s).toBe(s);
    }
  });

  it('round-trips a record, a stored list and a shared list', () => {
    expect(parseHash(recordHash('w12'))).toEqual({ kind: 'record', id: 'w12' });
    expect(parseHash(storedListHash('abc'))).toEqual({ kind: 'storedList', listId: 'abc' });
    /* The writer only ever produces the plain form; `packed` is set by the `~`
       prefix, which the compressor adds. */
    expect(parseHash(sharedListHash('eyJhIjoxfQ'))).toEqual({
      kind: 'sharedList',
      payload: 'eyJhIjoxfQ',
      packed: false
    });
    expect(parseHash(sharedListHash('~abc'))).toEqual({
      kind: 'sharedList',
      payload: '~abc',
      packed: true
    });
  });

  it('round-trips a print sheet, separator and all', () => {
    const ids = ['w1', 'w2', 'a3'];
    const h = printHash(ids);
    expect(h).toBe('#/print/w1-w2-a3');
    const r = parseHash(h);
    expect(r.kind).toBe('print');
    if (r.kind === 'print') expect(r.ids).toEqual(ids);
  });

  it('writes a table with a filter that reads back as the same filter', () => {
    const filter = { tier: ['1', '3'], cls: ['mag'] };
    const h = tablesHash('eq_weapon', { filter });
    const r = parseHash(h);
    expect(r.kind).toBe('tables');
    if (r.kind === 'tables') {
      expect(r.table).toBe('eq_weapon');
      expect(r.filter).toEqual(filter);
      expect(r.anchor).toBe('');
    }
  });

  it('writes a table with an anchor that reads back as the same anchor', () => {
    const r = parseHash(tablesHash('eq_armor', { anchor: 'gambeson' }));
    expect(r.kind).toBe('tables');
    if (r.kind === 'tables') {
      expect(r.anchor).toBe('gambeson');
      expect(r.filter).toEqual({});
    }
  });

  it('drops the anchor when a filter is picked, as the app does', () => {
    /* One slot, and the filter wins - otherwise the link would scroll to a row
       the filter has just removed. */
    expect(tablesHash('eq_weapon', { anchor: 'dagger', filter: { tier: ['1'] } })).toBe(
      '#/tables/eq_weapon/f_tier-1'
    );
  });

  it('writes a bare table when the filter is empty', () => {
    expect(tablesHash('eq_weapon', { filter: {} })).toBe('#/tables/eq_weapon');
    expect(tablesHash('eq_weapon')).toBe('#/tables/eq_weapon');
  });
});

describe('a link to hand somebody else', () => {
  const host = { base: 'https://e.test/loot/', hosted: true };
  const disk = { base: 'file:///tmp/loot/', hosted: false };

  it('names index.html only where nothing will serve it', () => {
    expect(appUrl(host, '#/lists')).toBe('https://e.test/loot/#/lists');
    expect(appUrl(disk, '#/lists')).toBe('file:///tmp/loot/index.html#/lists');
  });

  it('sends a record to its stub page on a host', () => {
    /* The stub carries the record's Open Graph tags, which is what makes a
       pasted link unfurl in Telegram or Discord with the picture and the name. */
    expect(recordUrl(host, 'w1')).toBe('https://e.test/loot/i/w1.html');
  });

  it('sends a record to the app itself from a folder, where no stub exists', () => {
    expect(recordUrl(disk, 'w1')).toBe('file:///tmp/loot/index.html#/i/w1');
  });

  it('lands on an address the app can read back', () => {
    const r = parseHash(recordUrl(disk, 'w1').split('index.html')[1] ?? '');
    expect(r).toEqual({ kind: 'record', id: 'w1' });
  });
});
