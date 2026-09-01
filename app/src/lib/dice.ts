/* The die drawn on a roll button.
 *
 * Its shape says what is being rolled faster than the letters "d12" do. A
 * hundred is rolled as a pair of tens, so it takes the ten; where no die of
 * that many faces exists, a wheel - drawing a cube for a hundred and nineteen
 * faces would be a lie about what is being thrown.
 *
 * The outlines come from `card/die-dN-bw.svg` word for word, and `derived`
 * checks them against those files: the file cannot be read at run time because
 * `fetch` is refused from a folder. Lines only, no fill, so the button shows
 * through the way it does through every other icon in the row. */

export interface DieArt {
  viewBox: string;
  /** The body, and then the faces drawn over it. */
  body: string;
  faces: string;
}

export const DIE_ART: Record<number, DieArt> = {
  4: {
    viewBox: '0 0 21.5 23.5',
    body: 'M0.75 22.75V0.75L20.75 11.75L0.75 22.75Z',
    faces:
      'M20.75 11.75H7.70652M0.75 22.75V0.75L20.75 11.75L0.75 22.75ZM7.70652 11.75L0.75 0.75M7.70652 11.75L0.75 22.75'
  },
  6: {
    viewBox: '0 0 30.25 34.75',
    body: 'M15.125 0.875L29.375 9.55921V26.0592L15.125 33.875L0.875 26.0592V9.55921L15.125 0.875Z',
    faces:
      'M0.875 9.55921V26.0592L15.125 33.875L29.375 26.0592V9.55921L15.125 0.875L0.875 9.55921ZM29.375 9.55921L15.125 17.375M15.125 33.875V17.375M0.875 9.55921L15.125 17.375'
  },
  8: {
    viewBox: '0 0 31.75 34.75',
    body: 'M30.875 26.356L15.875 33.875L0.875 26.356V9.64715L15.875 0.875L30.875 9.64715V26.356Z',
    faces:
      'M15.875 0.875L30.875 26.356M15.875 0.875L0.875 26.356M0.875 26.356L15.875 33.875L30.875 26.356V9.64715L15.875 0.875L0.875 9.64715V26.356ZM30.875 26.356H0.875'
  },
  10: {
    viewBox: '0 0 36.25 34.75',
    body: 'M18.125 0.875L35.375 14.2534V19.6047L18.125 33.875L0.875 19.6047V14.2534L18.125 0.875Z',
    faces:
      'M18.125 33.875L35.375 19.6047V14.2534L18.125 0.875L0.875 14.2534V19.6047L18.125 33.875ZM18.125 0.875L27.2039 16.0372M18.125 0.875L9.04605 16.0372M35.375 19.6047L27.2039 16.0372M18.125 33.875V21.3885M0.875 19.6047L9.04605 16.0372M27.2039 16.0372L18.125 21.3885M18.125 21.3885L9.04605 16.0372'
  },
  12: {
    viewBox: '0 0 23.25 24.25',
    body: 'M18.3472 21.2039L22.625 15.7566V8.49342L18.3472 3.04605L11.625 0.625L4.90278 3.04605L0.625 8.49342V15.7566L4.90278 21.2039L11.625 23.625L18.3472 21.2039Z',
    faces:
      'M18.3472 21.2039L22.625 15.7566V8.49342L18.3472 3.04605L11.625 0.625L4.90278 3.04605L0.625 8.49342V15.7566L4.90278 21.2039L11.625 23.625L18.3472 21.2039ZM11.625 0.625V6.07237M22.625 8.49342L18.3472 10.3092M18.3472 21.2039L15.9028 18.1776M4.90278 21.2039L7.34722 18.1776M0.625 8.49342L4.90278 10.3092M11.625 6.07237L18.3472 10.3092M11.625 6.07237L4.90278 10.3092M18.3472 10.3092L15.9028 18.1776M15.9028 18.1776H7.34722M7.34722 18.1776L4.90278 10.3092'
  },
  20: {
    viewBox: '0 0 23.15 25.15',
    body: 'M22.575 18.8908V6.25921L11.575 0.575L0.575 6.25921V18.8908L11.575 24.575L22.575 18.8908Z',
    faces:
      'M22.575 18.8908V6.25921L11.575 0.575L0.575 6.25921V18.8908L11.575 24.575L22.575 18.8908ZM11.575 0.575V5.62763M22.575 6.25921L11.575 5.62763M22.575 6.25921L17.3985 15.7329M22.575 18.8908L17.3985 15.7329M11.575 24.575L5.75147 15.7329M11.575 24.575L17.3985 15.7329M0.575 18.8908L5.75147 15.7329M0.575 6.25921L11.575 5.62763M0.575 6.25921L5.75147 15.7329M11.575 5.62763L17.3985 15.7329M11.575 5.62763L5.75147 15.7329M17.3985 15.7329H5.75147'
  }
};

/** The art for a range, or null where no die has that many faces. */
export function dieArt(faces: number): DieArt | null {
  return DIE_ART[faces === 100 ? 10 : faces] ?? null;
}

/** The wheel's sixteen spokes, as pairs of endpoints. */
export const WHEEL_SPOKES: readonly [number, number, number, number][] = [
  [16, 2, 16, 7],
  [10.6, 3.1, 12.6, 7.7],
  [6.1, 6.1, 9.6, 9.6],
  [3.1, 10.6, 7.7, 12.6],
  [2, 16, 7, 16],
  [3.1, 21.4, 7.7, 19.4],
  [6.1, 25.9, 9.6, 22.4],
  [10.6, 28.9, 12.6, 24.3],
  [16, 30, 16, 25],
  [21.4, 28.9, 19.4, 24.3],
  [25.9, 25.9, 22.4, 22.4],
  [28.9, 21.4, 24.3, 19.4],
  [30, 16, 25, 16],
  [28.9, 10.6, 24.3, 12.6],
  [25.9, 6.1, 22.4, 9.6],
  [21.4, 3.1, 19.4, 7.7]
];
