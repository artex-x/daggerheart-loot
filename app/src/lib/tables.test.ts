import { describe, expect, it } from 'vitest';
import {
  CHIP_SHORT,
  SUB_LABEL,
  TABLE_GROUPS,
  TABLE_NAV,
  groupOf,
  navGroupOf,
  navSubLabel
} from './tables.js';
import { TABLE_IDS, type TableId } from './types.js';

describe('the thirteen groups', () => {
  it('together cover every table id exactly once', () => {
    const all = TABLE_GROUPS.flatMap((g) => g.subs);
    expect([...all].sort()).toEqual([...TABLE_IDS].sort());
  });

  it('finds the group a table belongs to', () => {
    expect(groupOf('core_consumable').id).toBe('core');
    expect(groupOf('eq_armor').id).toBe('eq');
    expect(groupOf('other_frames').id).toBe('other');
    expect(groupOf('homebrew').id).toBe('hb');
  });

  it('shows a second row only where a book has more than one table', () => {
    expect(TABLE_GROUPS.filter((g) => g.subs.length < 2).map((g) => g.id)).toEqual([
      'wond',
      'dread',
      'voa',
      'dv',
      'arazo',
      'comm',
      'mwt',
      'hb'
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

  it('every sub of a multi-table group has one', () => {
    for (const g of TABLE_GROUPS) {
      if (g.subs.length < 2) continue;
      for (const sub of g.subs) expect(SUB_LABEL[sub]).toBeDefined();
    }
  });
});

describe('the tables page groups', () => {
  it('together cover every table id exactly once', () => {
    const all = TABLE_NAV.flatMap((g) => g.subs);
    expect([...all].sort()).toEqual([...TABLE_IDS].sort());
  });

  it('put the seven supplement books under one chip, between the alternate tables and equipment', () => {
    expect(TABLE_NAV.map((g) => g.id)).toEqual([
      'core',
      'hnf',
      'alt',
      'supp',
      'eq',
      'other',
      'hb'
    ]);
    const supp = navGroupOf('voa');
    expect(supp.label).toBe('grpSupplements');
    expect(supp.top).toBe('wondrous');
    expect(supp.subs).toEqual(['wondrous', 'dread', 'voa', 'dv', 'arazo', 'community', 'mwt']);
  });

  it('keep every other group as the path words have it', () => {
    for (const id of [
      'core_item',
      'hnf_consumable',
      'alt_item',
      'eq_armor',
      'other_frames',
      'homebrew'
    ] as const)
      expect(navGroupOf(id), id).toBe(groupOf(id));
  });

  it("name each group's own top chip as the first of its sub-tables", () => {
    for (const g of TABLE_NAV) expect(g.top).toBe(g.subs[0]);
  });

  it('falls back to the core group for an id nothing lists', () => {
    expect(navGroupOf('nope' as TableId).id).toBe('core');
  });
});

describe('the second-row caption on the tables page', () => {
  it("names a supplement book by its own group's caption", () => {
    expect(navSubLabel('wondrous')).toBe('pageWondrous');
    expect(navSubLabel('dread')).toBe('pageDread');
    expect(navSubLabel('voa')).toBe('voa');
    expect(navSubLabel('dv')).toBe('pageDv');
    expect(navSubLabel('arazo')).toBe('arazo');
    expect(navSubLabel('community')).toBe('pageCommunity');
    expect(navSubLabel('mwt')).toBe('mwt');
  });

  it('gives a short form under 640 px only where the short word is part of the name', () => {
    expect(CHIP_SHORT).toEqual({ wondrous: 'wondrous', dread: 'dread', dv: 'dv' });
  });

  it('keeps the short sub-table word where one exists', () => {
    expect(navSubLabel('core_item')).toBe('fItems');
    expect(navSubLabel('eq_weapon')).toBe('subWeapon');
  });
});
