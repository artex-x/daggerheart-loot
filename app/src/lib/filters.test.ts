/* Facet filtering, on its own.
 *
 * It had no test file until now: `hash.test.ts` exercised it in passing, on the
 * way to checking an address, which covered decoding and left the selection
 * predicate and the panel's two counters dark. Those three are what the filter
 * panel is built out of, so they are the ones a component would have found
 * broken. The grammar itself is frozen - docs/specs/ROUTES.md - and the golden
 * side of it is replayed against the live app by tests/contracts.js. */

import { describe, expect, it } from 'vitest';
import {
  chosenCount,
  decodeFilter,
  encodeFilter,
  EQ_GROUPS,
  groupHits,
  groupIsAny,
  groupsFor,
  passes
} from './filters.js';
import { TABLE_IDS } from './types.js';

describe('which groups a table offers', () => {
  it('gives equipment tables the groups their kind has', () => {
    expect(groupsFor('eq_weapon')).toEqual(EQ_GROUPS.weapon);
    expect(groupsFor('eq_secondary')).toEqual(EQ_GROUPS.secondary);
    expect(groupsFor('eq_armor')).toEqual(EQ_GROUPS.armor);
  });

  it('leaves armour without class, trait, range or burden', () => {
    /* Not an omission: no armour in either book carries any of the four. */
    for (const absent of ['cls', 'trait', 'range', 'burden']) {
      expect(groupsFor('eq_armor'), absent).not.toContain(absent);
    }
  });

  it('leaves secondary weapons without burden', () => {
    /* Every secondary in both books is one-handed. */
    expect(groupsFor('eq_secondary')).not.toContain('burden');
    expect(groupsFor('eq_weapon')).toContain('burden');
  });

  it('gives a table with nothing to sort by an empty list, not a default', () => {
    expect(groupsFor('core_item')).toEqual([]);
    expect(groupsFor('alt_consumable')).toEqual([]);
  });

  it('never offers a group twice, on any table', () => {
    for (const t of TABLE_IDS) {
      const g = groupsFor(t);
      expect(new Set(g).size, t).toBe(g.length);
    }
  });
});

describe('reading the address', () => {
  it('reads a group with one value and a group with several', () => {
    expect(decodeFilter('f_tier-1-2.cls-mag')).toEqual({ tier: ['1', '2'], cls: ['mag'] });
  });

  it('is not a filter without the prefix', () => {
    expect(decodeFilter('tier-1')).toEqual({});
    expect(decodeFilter('anchor-name')).toEqual({});
    expect(decodeFilter('')).toEqual({});
    expect(decodeFilter('f_')).toEqual({});
  });

  it('drops a repeat: a value is picked or it is not', () => {
    expect(decodeFilter('f_tier-1-1-2')).toEqual({ tier: ['1', '2'] });
  });

  it('ignores a group with a name and no values', () => {
    expect(decodeFilter('f_tier.cls-mag')).toEqual({ cls: ['mag'] });
    expect(decodeFilter('f_-1.cls-mag')).toEqual({ cls: ['mag'] });
  });

  it('still reads the older underscore separator', () => {
    /* Links written before the separator changed are in other people's chats. */
    expect(decodeFilter('f_tier-1_cls-mag')).toEqual({ tier: ['1'], cls: ['mag'] });
  });

  it('does not mistake an underscore inside a value for a separator', () => {
    /* `frame-beast_feast` is one group whose value has an underscore, and
       reading it the old way would produce two groups and lose the value. This
       is the case that made the separator a dot. */
    expect(decodeFilter('f_frame-beast_feast')).toEqual({ frame: ['beast_feast'] });
    expect(decodeFilter('f_kind-armor.frame-beast_feast')).toEqual({
      kind: ['armor'],
      frame: ['beast_feast']
    });
  });
});

describe('writing the address', () => {
  it('writes the groups in the order the table offers them', () => {
    /* The order is the panel's order too, so a link and the panel agree. */
    const state = { cls: ['mag'], tier: ['1'], src: ['core'] };
    expect(encodeFilter(state, groupsFor('eq_weapon'))).toBe('f_tier-1.src-core.cls-mag');
  });

  it('leaves an untouched filter out of the link entirely', () => {
    expect(encodeFilter({}, groupsFor('eq_weapon'))).toBe('');
    expect(encodeFilter({ tier: [] }, groupsFor('eq_weapon'))).toBe('');
  });

  it('drops a group this table does not offer', () => {
    /* Otherwise a link copied from the weapon table would carry burden onto
       armour, where nothing has it, and empty the page. */
    expect(encodeFilter({ burden: ['2'], tier: ['1'] }, groupsFor('eq_armor'))).toBe(
      'f_tier-1'
    );
  });

  it('round-trips everything the weapon table can hold', () => {
    const state = {
      tier: ['1', '3'],
      src: ['core', 'hnf'],
      cls: ['phys'],
      trait: ['agi'],
      range: ['melee', 'far'],
      burden: ['2'],
      line: ['a']
    };
    const groups = groupsFor('eq_weapon');
    expect(decodeFilter(encodeFilter(state, groups))).toEqual(state);
  });
});

describe('what the filter lets through', () => {
  it('narrows nothing while nothing is picked', () => {
    expect(groupIsAny({}, 'tier')).toBe(true);
    expect(groupIsAny({ tier: [] }, 'tier')).toBe(true);
    expect(groupIsAny({ tier: ['1'] }, 'tier')).toBe(false);
  });

  it('ORs the values inside one group', () => {
    const state = { tier: ['1', '2'] };
    expect(groupHits(state, 'tier', '1')).toBe(true);
    expect(groupHits(state, 'tier', '2')).toBe(true);
    expect(groupHits(state, 'tier', '3')).toBe(false);
  });

  it('lets anything through a group nobody touched', () => {
    expect(groupHits({}, 'tier', 'whatever')).toBe(true);
  });

  it('ANDs the groups against each other', () => {
    const row: Record<string, string> = { tier: '1', cls: 'mag', src: 'core' };
    const of = (g: string): string => row[g] ?? '';
    const groups = ['tier', 'cls', 'src'];

    expect(passes({ tier: ['1'], cls: ['mag'] }, groups, of)).toBe(true);
    expect(passes({ tier: ['1'], cls: ['phys'] }, groups, of)).toBe(false);
    expect(passes({}, groups, of)).toBe(true);
  });

  it('ignores a group carried in for a facet this table has not got', () => {
    /* A link from the weapon table opened on armour must show armour, not an
       empty page. */
    const row: Record<string, string> = { tier: '1' };
    const of = (g: string): string => row[g] ?? '';
    expect(passes({ tier: ['1'], burden: ['2'] }, ['tier'], of)).toBe(true);
  });
});

describe('how many are picked', () => {
  it('counts values, not groups', () => {
    expect(chosenCount({ tier: ['1', '2'], cls: ['mag'] }, ['tier', 'cls'])).toBe(3);
  });

  it('counts nothing for an untouched filter', () => {
    expect(chosenCount({}, ['tier', 'cls'])).toBe(0);
    expect(chosenCount({ tier: [] }, ['tier'])).toBe(0);
  });

  it('does not count a group this table does not offer', () => {
    /* This number is what the reset button reads: counting an invisible group
       would offer a reset that appears to do nothing. */
    expect(chosenCount({ tier: ['1'], burden: ['2'] }, ['tier'])).toBe(1);
  });
});
