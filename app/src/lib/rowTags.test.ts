import { describe, expect, it } from 'vitest';
import { hiddenTags } from './rowTags.js';

describe('the tags a catalog row hides', () => {
  it('hides the kind, the source and the Core tag on an equipment table, and keeps another book', () => {
    expect(hiddenTags('eq_weapon', {}, false)).toEqual({
      kind: true,
      tier: false,
      src: false,
      core: true
    });
  });

  it('hides the tier under a tier heading or one picked tier, and the source under one picked book', () => {
    expect(hiddenTags('eq_weapon', {}, true).tier).toBe(true);
    expect(hiddenTags('eq_weapon', { tier: ['1'] }, false).tier).toBe(true);
    expect(hiddenTags('eq_weapon', { tier: ['1', '2'] }, false).tier).toBe(false);
    expect(hiddenTags('eq_weapon', { src: ['hnf'] }, false).src).toBe(true);
  });

  it('hides the kind and the source on a one-book, one-kind table', () => {
    expect(hiddenTags('core_item', {}, false)).toEqual({
      kind: true,
      tier: false,
      src: true,
      core: false
    });
  });

  it('keeps the kind on a mixed table until one kind is picked', () => {
    expect(hiddenTags('wondrous', {}, false).kind).toBe(false);
    expect(hiddenTags('wondrous', { kind: ['item'] }, false).kind).toBe(true);
    expect(hiddenTags('wondrous', { kind: ['equip'] }, false).kind).toBe(false);
    expect(hiddenTags('wondrous', {}, false).src).toBe(true);
  });

  it('keeps the kind on the own items table, whose source is the chosen tab', () => {
    expect(hiddenTags('homebrew', {}, false)).toEqual({
      kind: false,
      tier: false,
      src: true,
      core: false
    });
  });
});
