import { describe, expect, it } from 'vitest';
import { SUPPLEMENTS, isSupplement, tabOf } from './nav.js';
import { SECTIONS } from './types.js';

const OWN_TAB = ['roll/std', 'roll/alt', 'tables', 'lists', 'search'] as const;

describe('the supplements tab', () => {
  it('lists every section exactly once between the supplements and the own tabs', () => {
    expect([...SUPPLEMENTS, ...OWN_TAB].sort()).toEqual([...SECTIONS].sort());
  });

  it('counts each supplement as a supplement and lights the supplements tab for it', () => {
    for (const s of SUPPLEMENTS) {
      expect(isSupplement(s), s).toBe(true);
      expect(tabOf(s), s).toBe('roll/wondrous');
    }
  });

  it('lights its own tab for every other section', () => {
    for (const s of OWN_TAB) {
      expect(isSupplement(s), s).toBe(false);
      expect(tabOf(s), s).toBe(s);
    }
  });

  it('lights nothing when no section is open', () => {
    expect(isSupplement(null)).toBe(false);
    expect(tabOf(null)).toBeNull();
  });
});
