/* Whether the header is shown while the page scrolls (DESIGN.md, "The Hidden Header
   Rule"). `turn` is the offset of the last change of direction. */

/** The distance a scroll travels before the header answers it. */
export const DEAD_ZONE = 10;

export interface HeaderState {
  shown: boolean;
  turn: number;
}

export interface ScrollRead {
  /** The offset, already clamped to 0..max. */
  y: number;
  /** The furthest offset. */
  max: number;
  /** The header's own height. */
  height: number;
  /** True while something else owns the page's movement. Called only on a read
   *  that would flip the header: the check can walk the whole page. */
  held: () => boolean;
}

/** Returns the state of a page that has just arrived at `y`: the header shown. */
export function headerAt(y: number): HeaderState {
  return { shown: true, turn: y };
}

/** Returns the state after one scroll read: `s` itself when nothing changes. */
export function nextHeader(s: HeaderState, r: ScrollRead): HeaderState {
  if (r.y <= r.height || r.max < 2 * r.height) {
    return s.shown && s.turn === r.y ? s : headerAt(r.y);
  }
  const moved = r.y - s.turn;
  if (s.shown ? moved >= DEAD_ZONE : moved <= -DEAD_ZONE) {
    return { shown: r.held() ? s.shown : !s.shown, turn: r.y };
  }
  const turn = s.shown ? Math.min(s.turn, r.y) : Math.max(s.turn, r.y);
  return turn === s.turn ? s : { shown: s.shown, turn };
}
