import { describe, expect, it } from 'vitest';
import { SUPPLEMENTS, isRoll, isSupplement, jobOf, modeOf } from './nav.js';
import { navGroupOf } from './tables.js';
import { SECTIONS } from './types.js';

const ROLL_OWN = ['roll/std', 'roll/alt'] as const;

describe('the jobs and the mode row', () => {
  it('lists every roll section exactly once between the supplements and the own modes', () => {
    expect([...SUPPLEMENTS, ...ROLL_OWN].sort()).toEqual(
      SECTIONS.filter((s) => s.startsWith('roll/')).sort()
    );
  });

  it('lights the roll job and the section itself as the mode on each roll section', () => {
    for (const s of [...ROLL_OWN, ...SUPPLEMENTS]) {
      expect(isRoll(s), s).toBe(true);
      expect(jobOf(s), s).toBe('roll');
      expect(modeOf(s), s).toBe(s);
    }
  });

  it('counts only the seven supplements as supplements', () => {
    for (const s of SUPPLEMENTS) expect(isSupplement(s), s).toBe(true);
    for (const s of [...ROLL_OWN, 'tables', 'lists', 'search'] as const) {
      expect(isSupplement(s), s).toBe(false);
    }
  });

  it('lights the tables and search jobs with no mode', () => {
    expect([jobOf('tables'), modeOf('tables')]).toEqual(['tables', null]);
    expect([jobOf('search'), modeOf('search')]).toEqual(['search', null]);
  });

  it('lights no job and no mode on the lists section or with no section open', () => {
    expect([jobOf('lists'), modeOf('lists')]).toEqual([null, null]);
    expect([jobOf(null), modeOf(null), isSupplement(null), isRoll(null)]).toEqual([
      null,
      null,
      false,
      false
    ]);
  });

  it('lists the supplement books in the order of the tables page row', () => {
    expect(SUPPLEMENTS.map((s) => s.slice(5))).toEqual(navGroupOf('wondrous').subs);
    expect(SUPPLEMENTS.at(-1)).toBe('roll/mwt');
  });
});
