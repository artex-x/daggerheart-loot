/* Which table each roll section rolls over: one mode per section, every named table
   real, and `rowsOf` giving the rows the panels drew before the move out of App.svelte. */

import { describe, expect, it } from 'vitest';
import { readLoot } from '../test/loot.js';
import { buildIndex } from './data.js';
import {
  communities,
  communityGroup,
  sectionGroup,
  sectionParts,
  voaGroup
} from './sections.js';
import { PICKER_ROLL, ROLL_MODES, ROLL_TABLE, rowsOf } from './rollTables.js';
import type { RollSection } from './rollTables.js';
import { SECTIONS, TABLE_IDS } from './types.js';
import type { Section } from './types.js';

const ROLL_SECTIONS = SECTIONS.filter((s): s is RollSection => s.startsWith('roll/'));
const index = buildIndex(readLoot());

describe('ROLL_MODES', () => {
  it('holds the twelve roll sections, each with exactly one mode', () => {
    expect(ROLL_SECTIONS).toHaveLength(12);
    expect(Object.keys(ROLL_MODES).sort()).toEqual([...ROLL_SECTIONS].sort());
    for (const s of ROLL_SECTIONS) {
      const mode = ROLL_MODES[s];
      expect(mode === 'table').toBe(s in ROLL_TABLE);
      expect(mode === 'part').toBe(s in PICKER_ROLL);
      expect(mode === 'std' || mode === 'alt').toBe(!(s in ROLL_TABLE) && !(s in PICKER_ROLL));
    }
  });

  it('names a real table for every table and part entry', () => {
    const ids: readonly string[] = TABLE_IDS;
    for (const cfg of Object.values(ROLL_TABLE)) expect(ids).toContain(cfg.table);
    for (const pr of Object.values(PICKER_ROLL)) expect(ids).toContain(pr.section);
  });
});

describe('rowsOf', () => {
  it('gives a table section its whole table', () => {
    for (const [section, cfg] of Object.entries(ROLL_TABLE)) {
      expect(rowsOf(section as Section, index)).toBe(index.rows.get(cfg.table));
    }
  });

  it('gives a part section the rows of its part', () => {
    expect(rowsOf('roll/voa', index, '3')).toEqual(voaGroup(index, '3'));
    const community = communities(index)[0]?.id ?? '';
    expect(rowsOf('roll/community', index, community)).toEqual(
      communityGroup(index, community)
    );
    const realm = sectionParts('mwt', 'en')[0]?.id ?? '';
    expect(rowsOf('roll/mwt', index, realm)).toEqual(sectionGroup(index, 'mwt', realm));
    expect(rowsOf('roll/mwt', index, realm).length).toBeGreaterThan(0);
  });

  it('gives no rows to std and alt, or to a part section with no part', () => {
    expect(rowsOf('roll/std', index)).toEqual([]);
    expect(rowsOf('roll/alt', index)).toEqual([]);
    expect(rowsOf('roll/voa', index)).toEqual([]);
  });
});
