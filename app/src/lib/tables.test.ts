import { describe, expect, it } from 'vitest';
import { SUB_LABEL, TABLE_GROUPS, groupOf, subLabelOf } from './tables.js';
import { TABLE_IDS, type TableId } from './types.js';

describe('the nine groups', () => {
  it('together cover every table id exactly once', () => {
    const all = TABLE_GROUPS.flatMap((g) => g.subs);
    expect([...all].sort()).toEqual([...TABLE_IDS].sort());
  });

  it('finds the group a table belongs to', () => {
    expect(groupOf('core_consumable').id).toBe('core');
    expect(groupOf('eq_armor').id).toBe('eq');
    expect(groupOf('frames').id).toBe('frames');
  });

  it('shows a second row only where a book has more than one table', () => {
    expect(TABLE_GROUPS.filter((g) => g.subs.length < 2).map((g) => g.id)).toEqual([
      'wond',
      'dread',
      'voa',
      'comm',
      'frames'
    ]);
  });

  it("names each group's own top chip as the first of its sub-tables", () => {
    for (const g of TABLE_GROUPS) expect(g.top).toBe(g.subs[0]);
  });

  it('falls back to the core group for an id nothing lists - unreachable given a real TableId, defensive against a caller that is wrong about its own type', () => {
    expect(groupOf('nope' as TableId).id).toBe('core');
  });
});

describe('the sub-chip caption', () => {
  it('is shorter than the table name, because the group already names the book', () => {
    expect(SUB_LABEL.core_item).toBe('fItems');
    expect(SUB_LABEL.hnf_consumable).toBe('fCons');
    expect(SUB_LABEL.eq_weapon).toBe('subWeapon');
  });

  it('carries no caption for a table with no group', () => {
    expect(SUB_LABEL.wondrous).toBeUndefined();
  });

  it("every sub of a multi-table group has one, so the tab's word is never actually needed", () => {
    for (const g of TABLE_GROUPS) {
      if (g.subs.length < 2) continue;
      for (const sub of g.subs) expect(SUB_LABEL[sub]).toBeDefined();
    }
  });

  it('falls back to the tab word for an id nothing lists', () => {
    expect(subLabelOf('nope' as TableId)).toBe('tables');
    expect(subLabelOf('core_item')).toBe('fItems');
  });
});
