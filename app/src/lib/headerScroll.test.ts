import { describe, expect, it } from 'vitest';
import { DEAD_ZONE, headerAt, nextHeader } from './headerScroll.js';
import type { HeaderState, ScrollRead } from './headerScroll.js';

const HEIGHT = 111;

const read = (y: number, over: Partial<ScrollRead> = {}): ScrollRead => ({
  y,
  max: 5000,
  height: HEIGHT,
  held: false,
  ...over
});

const shown = (turn: number): HeaderState => ({ shown: true, turn });
const hidden = (turn: number): HeaderState => ({ shown: false, turn });

describe('the header on a scroll', () => {
  it('starts shown at the offset it arrived at', () => {
    expect(headerAt(800)).toEqual(shown(800));
  });

  it.each<[string, HeaderState, ScrollRead, HeaderState]>([
    ['stays shown at its own height', shown(0), read(HEIGHT), shown(HEIGHT)],
    ['hides past its height after the dead zone', shown(102), read(112), hidden(112)],
    ['stays shown 9 px down', shown(500), read(509), shown(500)],
    ['the turn follows the lowest offset while shown', shown(500), read(495), shown(495)],
    ['the turn follows the highest offset while hidden', hidden(500), read(620), hidden(620)],
    ['stays hidden 9 px up', hidden(500), read(491), hidden(500)],
    ['shows after 10 px up', hidden(500), read(490), shown(490)],
    [
      'a held scroll keeps it shown and moves the turn',
      shown(500),
      read(900, { held: true }),
      shown(900)
    ],
    [
      'a held scroll keeps it hidden and moves the turn',
      hidden(900),
      read(500, { held: true }),
      hidden(500)
    ],
    [
      'a short page shows it from a hidden state',
      hidden(200),
      read(200, { max: 221 }),
      shown(200)
    ],
    [
      'a page at twice its height can hide it',
      shown(150),
      read(200, { max: 222 }),
      hidden(200)
    ],
    ['the top of the page beats a hold', hidden(900), read(40, { held: true }), shown(40)],
    ['a short page beats a hold', hidden(900), read(200, { max: 100, held: true }), shown(200)]
  ])('%s', (_title, state, scroll, next) => {
    expect(nextHeader(state, scroll)).toEqual(next);
  });

  it('reads a bottom bounce back as no movement, because the offset arrives clamped', () => {
    const atEnd = nextHeader(hidden(4900), read(5000));
    expect(atEnd).toEqual(hidden(5000));
    expect(nextHeader(atEnd, read(5000))).toEqual(hidden(5000));
  });

  it('answers a move of exactly the dead zone in both directions', () => {
    expect(nextHeader(shown(500), read(500 + DEAD_ZONE)).shown).toBe(false);
    expect(nextHeader(hidden(500), read(500 - DEAD_ZONE)).shown).toBe(true);
  });
});
