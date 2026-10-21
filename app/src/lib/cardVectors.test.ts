import { describe, expect, it } from 'vitest';
import {
  CARD_VECTORS,
  dieVector,
  lineOf,
  solidLine,
  UNFOLDED,
  type VectorName
} from './cardVectors.js';
import { DIE_ART } from './dice.js';

const NAMES = Object.keys(CARD_VECTORS) as VectorName[];

describe('the folded print vectors', () => {
  it('fold the ten shapes whose files share one geometry', () => {
    expect(NAMES.sort()).toEqual(
      [
        'banner',
        'die-d10',
        'die-d12',
        'die-d20',
        'die-d4',
        'die-d6',
        'die-d8',
        'ribbon',
        'ribbon-mag',
        'thbox'
      ].sort()
    );
  });

  it('leave the three pairs whose files differ in shape to their files', () => {
    expect(UNFOLDED).toEqual(['shield', 'burden-1', 'burden-2']);
    for (const name of UNFOLDED) expect(name in CARD_VECTORS).toBe(false);
  });

  it('give every path a paint slot for its fill or its stroke', () => {
    for (const name of NAMES) {
      for (const p of CARD_VECTORS[name].paths) {
        expect(p.fill === 'fill' || p.stroke === 'stroke').toBe(true);
        expect(p.d.length).toBeGreaterThan(0);
      }
    }
  });

  it('take the dice from the one copy in dice.ts', () => {
    const d8 = CARD_VECTORS['die-d8'];
    expect(d8.viewBox).toBe(DIE_ART[8]?.viewBox);
    expect(d8.paths.map((p) => p.d)).toEqual([DIE_ART[8]?.body, DIE_ART[8]?.faces]);
  });

  it("paint a black-and-white die across each path's own box", () => {
    expect(lineOf(CARD_VECTORS['die-d4'], 'bw', 'fill')).toEqual({
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 1,
      box: true
    });
  });

  it("give a solid paint the line down the viewBox, the ribbon-mag's offset one too", () => {
    expect(lineOf(CARD_VECTORS.ribbon, 'colour', 'stroke')).toEqual(
      solidLine('0 0 275.5 47.9271')
    );
    expect(solidLine('24 1 274 47')).toEqual({ x1: 0, y1: 1, x2: 0, y2: 48 });
    expect(lineOf(CARD_VECTORS['die-d8'], 'mag', 'stroke')).toEqual(
      solidLine(CARD_VECTORS['die-d8'].viewBox)
    );
  });

  it('name the folded die of a damage die, and none for a die with no shape', () => {
    expect(dieVector('d12')).toBe('die-d12');
    expect(dieVector('d100')).toBeNull();
    expect(dieVector('')).toBeNull();
  });
});
