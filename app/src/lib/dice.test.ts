/* Which die is drawn, and when there is none.
 *
 * The rule is a promise about what is being thrown: a cube on a button that
 * picks one of 119 would say the table is rolled on a die it is not. */

import { describe, expect, it } from 'vitest';
import { DIE_ART, dieArt, WHEEL_SPOKES } from './dice.js';

describe('the die on a roll button', () => {
  it('has art for every die the game uses', () => {
    for (const faces of [4, 6, 8, 10, 12, 20]) {
      expect(dieArt(faces), `d${String(faces)}`).not.toBe(null);
    }
  });

  it('draws a hundred as a ten, because that is how it is rolled', () => {
    expect(dieArt(100)).toBe(DIE_ART[10]);
  });

  it('has nothing for a range no die covers', () => {
    /* 119 and 29 are the two in this app, and both take the wheel instead. */
    for (const faces of [29, 119, 3, 0]) {
      expect(dieArt(faces), String(faces)).toBe(null);
    }
  });

  it('carries a body and its faces for each', () => {
    for (const [faces, art] of Object.entries(DIE_ART)) {
      expect(art.viewBox, faces).toMatch(/^0 0 [\d.]+ [\d.]+$/);
      expect(art.body.length, faces).toBeGreaterThan(20);
      expect(art.faces.length, faces).toBeGreaterThan(art.body.length);
    }
  });

  it('gives the wheel its sixteen spokes', () => {
    expect(WHEEL_SPOKES).toHaveLength(16);
    for (const spoke of WHEEL_SPOKES) expect(spoke).toHaveLength(4);
  });
});
