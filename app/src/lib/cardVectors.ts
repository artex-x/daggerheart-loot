/* The print card's vectors that the colour and the black-and-white layouts share one
 * geometry for (docs/specs/FEATURES.md, "Print"): each shape's `viewBox`, its paths and
 * the gradient line of each paint slot, read from the files Figma exported into `card/`
 * (nodes 714-42387 and 3773-90792). `CardVector.svelte` draws them inline and
 * `styles/card-vectors.css` colours each slot per layout, so one drawing serves both.
 *
 * Every `d` is the file's own, and `tests/derived.js` pins each shape to its colour, magic
 * and black-and-white files; the dice take their paths from `DIE_ART` (one copy). A pair
 * whose files differ in shape is not folded and stays two files drawn by `<img>`:
 * `shield`, `burden-1` and `burden-2` (docs/decisions, "The print card recolours its
 * exported vectors with CSS; the files stay published").
 *
 * Pure module: no DOM. */

import { DIE_ART } from './dice.js';

/** Which layout paints a shape: the colour card, a magic weapon's die on it, or black
 *  and white. */
export type VectorPaint = 'colour' | 'mag' | 'bw';

/** A gradient line in the file's user space, or across the path's own box (`box`). */
export interface GradientLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  box?: true;
}

/** One path: its geometry, the paint slot of its fill and its stroke, and its stroke. */
export interface VectorPath {
  d: string;
  fill?: 'fill';
  stroke?: 'stroke';
  width?: number;
  cap?: 'round' | 'square';
  join?: 'round';
}

export interface CardVectorShape {
  viewBox: string;
  /** The file's `preserveAspectRatio="none"`: the shape fills the box it is given. */
  stretch?: true;
  paths: VectorPath[];
  /** A slot's gradient line per paint, where the file draws a gradient; a solid paint
   *  takes the default line, and two equal stops paint the same pixels. */
  lines: Partial<Record<VectorPaint, Partial<Record<'fill' | 'stroke', GradientLine>>>>;
}

/* The black-and-white die files paint across each path's own box. */
const BOX: GradientLine = { x1: 0, y1: 0, x2: 0, y2: 1, box: true };

const FLAT = {
  banner: {
    viewBox: '0 0 44 74',
    stretch: true,
    paths: [
      {
        d: 'M0 61.0396V0H44V61.0396C44 61.0396 33.5238 60.6215 22 74C10.4762 60.6215 0 61.0396 0 61.0396Z',
        fill: 'fill'
      },
      {
        d: 'M2 2.99439e-05V59C2 59 11.3143 59.0848 22 71C32.6857 59.0848 42 59 42 59V0',
        stroke: 'stroke',
        width: 1.25
      }
    ],
    lines: {
      colour: {
        fill: { x1: 22.1134, y1: 0, x2: 22.1134, y2: 74 },
        stroke: { x1: 22, y1: 0, x2: 22, y2: 71 }
      }
    }
  },
  thbox: {
    viewBox: '0 0 36 36',
    stretch: true,
    paths: [
      {
        d: 'M35 10.4141L33 12.4141V23.5859L35 25.5859V32.4141L32.4141 35H25.5859L23.5859 33H12.4141L10.4141 35H3.58594L1 32.4141V25.5859L3 23.5859V12.4141L1 10.4141V3.58594L3.58594 1H10.4141L12.4141 3H23.5859L25.5859 1H32.4141L35 3.58594V10.4141Z',
        fill: 'fill',
        stroke: 'stroke',
        width: 2
      }
    ],
    lines: { colour: { stroke: { x1: 18.0645, y1: -1.13745, x2: 18.0645, y2: 34.7739 } } }
  },
  ribbon: {
    viewBox: '0 0 275.5 47.9271',
    stretch: true,
    paths: [
      {
        d: 'M113.25 5.67705L109.75 9.67705H89.25L82.25 5.67705H62.75M113.25 5.67705L116.75 2.17705H145.75L149.25 5.67705M113.25 5.67705H149.25M113.25 5.67705H93.25L90.75 6.17705M149.25 5.67705L152.75 9.67705H171.25L179.25 5.67705H197.75M149.25 5.67705H167.25L169.75 6.17705M194.75 8.67705L197.75 5.67705L194.75 2.67705M202.75 5.67705H263.75M199.75 9.67705H271.75M18.25 9.67705H26.75L30.75 5.67705M80.75 9.17705L78.25 9.67705H66.75L62.75 5.67705M85.25 37.6771C85.25 37.6771 83.25 29.8136 83.25 24.6771C83.25 19.5405 85.25 11.6771 85.25 11.6771M175.25 37.6771C175.25 37.6771 177.25 29.8136 177.25 24.6771C177.25 19.5405 175.25 11.6771 175.25 11.6771M80.75 40.1771L78.25 39.6771H58.25L53.75 37.6771M113.25 43.6771L109.75 39.6771H89.25L82.25 43.6771H58.25L53.75 45.6771M113.25 43.6771L116.75 47.1771H145.75L149.25 43.6771M113.25 43.6771H93.25L90.75 43.1771M113.25 43.6771H149.25M149.25 43.6771L152.75 39.6771H171.25L179.25 43.6771H253.75M149.25 43.6771H167.25L169.75 43.1771M179.75 40.1771L182.25 39.6771H245.75M189.75 9.67705H182.25L179.75 9.17705M271.75 36.6771L274.75 33.6771V15.6771L271.75 12.6771M62.75 5.67705L59.75 2.67705H58.25M62.75 5.67705H53.25L50.25 8.67705M30.75 5.67705L33.75 2.67705H35.25M30.75 5.67705H16.75L4.75 17.6771H0.75M30.75 5.67705H40.25L43.25 8.67705M18.25 39.6771H35.25L40.25 41.6771M0.75 31.6771H4.75L16.75 43.6771H34.25M271.75 39.6771H255.75M263.75 43.6771H258.75M50.25 8.67705L44.25 2.17705L43.25 1.67705L43.75 2.67705L49.75 9.17705L50.25 8.67705ZM43.25 8.67705L43.75 9.17705L44.75 8.17705L44.25 7.67705L43.25 8.67705ZM42.25 41.6771V40.1771H49.25L53.25 41.6771L49.25 43.1771H42.25V41.6771ZM42.25 41.6771H40.75M40.75 41.6771L41.75 36.6771L40.25 41.6771M40.75 41.6771H40.25M40.75 41.6771L41.75 46.6771L40.25 41.6771M250.75 46.6771L253.75 43.6771L250.75 40.6771M48.75 3.17705L49.25 3.67705L50.25 2.67705L50.75 1.67705L49.75 2.17705L48.75 3.17705Z',
        stroke: 'stroke',
        width: 1.5,
        cap: 'round'
      }
    ],
    lines: { colour: {} }
  },
  'ribbon-mag': {
    viewBox: '24 1 274 47',
    stretch: true,
    paths: [
      {
        d: 'M136.5 6.47266L133 10.4727H112.5L105.5 6.47266H85M136.5 6.47266L140 2.97266H169L172.5 6.47266M136.5 6.47266H172.5M136.5 6.47266H116.5L114 6.97266M172.5 6.47266L176 10.4727H194.5L202.5 6.47266H221M172.5 6.47266H190.5L193 6.97266M218 9.47266L221 6.47266L218 3.47266M226 6.47266H287M223 10.4727H295M41.5 10.4727H51L55 6.47266M104 9.97266L101.5 10.4727H89L85 6.47266M108.5 38.4727C108.5 38.4727 106.5 30.6092 106.5 25.4727C106.5 20.3361 108.5 12.4727 108.5 12.4727M198.5 38.4727C198.5 38.4727 200.5 30.6092 200.5 25.4727C200.5 20.3361 198.5 12.4727 198.5 12.4727M104 40.9727L101.5 40.4727H91L87.4995 40.4725L80.5 47.4719H76.5M136.5 44.4727L133 40.4727H112.5L105.5 44.4727H91L79 44.4722M136.5 44.4727L140 47.9727H169L172.5 44.4727M136.5 44.4727H116.5L114 43.9727M136.5 44.4727H172.5M172.5 44.4727L176 40.4727H194.5L202.5 44.4727H277M172.5 44.4727H190.5L193 43.9727M203 40.9727L205.5 40.4727H269M213 10.4727H205.5L203 9.97266M295 37.4727L298 34.4727V16.4727L295 13.4727M85 6.47266L82 3.47266H80M85 6.47266H75M55 6.47266L58 3.47266H60M55 6.47266H40L28 18.4727H24M55 6.47266H65M41.5 40.4727H49L52.5 40.4725L59.5 47.4719H63.5M24 32.4727H28L40 44.4727H49L61 44.4722M295 40.4727H279M287 44.4727H282M65 6.47266C65 6.47266 66.4485 6.02418 67.5 4.97266C68.5515 3.92114 70 1.47266 70 1.47266C70 1.47266 71.4485 3.92114 72.5 4.97266C73.5515 6.02418 75 6.47266 75 6.47266M65 6.47266C65 6.47266 66.4485 6.92114 67.5 7.97266C68.5515 9.02418 70 11.4727 70 11.4727C70 11.4727 71.4485 9.02418 72.5 7.97266C73.5515 6.92114 75 6.47266 75 6.47266M274 47.4727L277 44.4727L274 41.4727M76.5 40.9727L75.5 41.4727L75 42.4727L74.5 41.4727L73.5 40.9727L74.5 40.4727L75 39.4727L75.5 40.4727L76.5 40.9727ZM71.5 45.9727L70.5 46.4727L70 47.4727L69.5 46.4727L68.5 45.9727L69.5 45.4727L70 44.4727L70.5 45.4727L71.5 45.9727ZM66.5 40.9727L65.5 41.4727L65 42.4727L64.5 41.4727L63.5 40.9727L64.5 40.4727L65 39.4727L65.5 40.4727L66.5 40.9727Z',
        stroke: 'stroke',
        width: 1.5,
        cap: 'square'
      }
    ],
    lines: { colour: {} }
  }
} satisfies Record<string, CardVectorShape>;

/* Each die's stroke width and the gradient lines of its physical and magic files; a
   magic die's solid stroke takes the default line. */
const DIE_PAINT: Record<
  number,
  {
    width: number;
    colour: Record<'fill' | 'stroke', GradientLine>;
    mag: { fill: GradientLine; stroke?: GradientLine };
  }
> = {
  4: {
    width: 1.5,
    colour: {
      fill: { x1: 0, y1: 0, x2: 0, y2: 23.5 },
      stroke: { x1: 0, y1: 0, x2: 0, y2: 23.5 }
    },
    mag: { fill: { x1: 0, y1: 0, x2: 0, y2: 23.5 }, stroke: { x1: 0, y1: 0, x2: 0, y2: 23.5 } }
  },
  6: {
    width: 1.75,
    colour: {
      fill: { x1: 15.1985, y1: 0.875, x2: 15.1985, y2: 33.875 },
      stroke: { x1: 0, y1: 0, x2: 0, y2: 34.75 }
    },
    mag: { fill: { x1: 15.1985, y1: 0.875, x2: 15.1985, y2: 33.875 } }
  },
  8: {
    width: 1.75,
    colour: {
      fill: { x1: 15.9523, y1: 0.875, x2: 15.9523, y2: 33.875 },
      stroke: { x1: 15.875, y1: 0.875, x2: 15.875, y2: 33.875 }
    },
    mag: { fill: { x1: 15.9523, y1: 0.875, x2: 15.9523, y2: 33.875 } }
  },
  10: {
    width: 1.75,
    colour: {
      fill: { x1: 18.2139, y1: 0.875, x2: 18.2139, y2: 33.875 },
      stroke: { x1: 18.125, y1: 0.875, x2: 18.125, y2: 33.875 }
    },
    mag: { fill: { x1: 18.2139, y1: 0.875, x2: 18.2139, y2: 33.875 } }
  },
  12: {
    width: 1.25,
    colour: {
      fill: { x1: 0, y1: 0, x2: 0, y2: 24.25 },
      stroke: { x1: 0, y1: 0, x2: 0, y2: 24.25 }
    },
    mag: {
      fill: { x1: 0, y1: 0, x2: 0, y2: 24.25 },
      stroke: { x1: 0, y1: 0, x2: 0, y2: 24.25 }
    }
  },
  20: {
    width: 1.15,
    colour: {
      fill: { x1: 0, y1: 0, x2: 0, y2: 25.15 },
      stroke: { x1: 0, y1: 0, x2: 0, y2: 25.15 }
    },
    mag: {
      fill: { x1: 0, y1: 0, x2: 0, y2: 25.15 },
      stroke: { x1: 0, y1: 0, x2: 0, y2: 25.15 }
    }
  }
};

function die(faces: number): CardVectorShape {
  const art = DIE_ART[faces];
  const paint = DIE_PAINT[faces];
  if (!art || !paint) throw new Error(`cardVectors: no die art for d${String(faces)}`);
  return {
    viewBox: art.viewBox,
    paths: [
      { d: art.body, fill: 'fill' },
      { d: art.faces, stroke: 'stroke', width: paint.width, join: 'round' }
    ],
    lines: { colour: paint.colour, mag: paint.mag, bw: { fill: BOX, stroke: BOX } }
  };
}

/** A folded shape, by the file name its colour layout exports. */
export type VectorName = keyof typeof FLAT | `die-d${4 | 6 | 8 | 10 | 12 | 20}`;

/** Every folded shape. */
export const CARD_VECTORS: Readonly<Record<VectorName, CardVectorShape>> = {
  ...FLAT,
  'die-d4': die(4),
  'die-d6': die(6),
  'die-d8': die(8),
  'die-d10': die(10),
  'die-d12': die(12),
  'die-d20': die(20)
};

/** The folded shape of a die (`d8`), or null where the layout has no shape for it. */
export function dieVector(die: string): VectorName | null {
  const name = `die-${die}`;
  return name in CARD_VECTORS ? (name as VectorName) : null;
}

/** The pairs whose two files differ in shape: drawn by `<img>` through `cardArt`. */
export const UNFOLDED: readonly string[] = ['shield', 'burden-1', 'burden-2'];

/** The default gradient line of a solid paint: down the `viewBox`. */
export function solidLine(viewBox: string): GradientLine {
  const [, y = 0, , h = 0] = viewBox.split(' ').map(Number);
  return { x1: 0, y1: y, x2: 0, y2: y + h };
}

/** The line a slot paints along: the file's gradient, else the default. */
export function lineOf(
  shape: CardVectorShape,
  paint: VectorPaint,
  slot: 'fill' | 'stroke'
): GradientLine {
  return shape.lines[paint]?.[slot] ?? solidLine(shape.viewBox);
}
