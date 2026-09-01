/* The interface icons, copied from app.js rather than redrawn.
 *
 * They are part of the look, and the look is not supposed to change - see
 * CLAUDE.md, "This is a refactor, not a redesign". `tests/parity.js` compares
 * the two apps pixel for pixel, so a path that is nearly the same is a path
 * that fails.
 *
 * Data, not markup: `Icon.svelte` draws them. The sizes travel with the paths
 * because the live app sets them per icon rather than by class. */

export interface IconDef {
  /** The path, exactly as app.js has it. */
  d: string;
  size: number;
  /** The live app dims two of these; a different opacity is a different pixel. */
  opacity?: number;
}

export const ICONS = {
  /* The brand star. Bigger than the rest and gold, so it carries its own size. */
  star: {
    d: 'M12 2l2.6 5.6L20 9.2l-4 4.2.9 5.9L12 16.7 7.1 19.3 8 13.4l-4-4.2 5.4-1.6z',
    size: 26
  },
  copy: {
    d: 'M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z',
    size: 15
  },
  link: {
    d: 'M3.9 12a5.1 5.1 0 0 1 5.1-5.1h4V5H9a7 7 0 0 0 0 14h4v-1.9H9A5.1 5.1 0 0 1 3.9 12zM8 13h8v-2H8v2zm7-8v1.9h4a5.1 5.1 0 0 1 0 10.2h-4V19h4a7 7 0 0 0 0-14h-4z',
    size: 15
  },
  share: {
    d: 'M18 16.1c-.8 0-1.5.3-2 .8l-7.1-4.2c.1-.2.1-.5.1-.7s0-.5-.1-.7L16 7.1c.5.5 1.2.8 2 .8a3 3 0 1 0-3-3c0 .3 0 .5.1.7L8 9.9a3 3 0 1 0 0 4.2l7.1 4.2c-.1.2-.1.4-.1.6a2.9 2.9 0 1 0 3-2.8z',
    size: 15
  },
  image: {
    d: 'M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z',
    size: 15
  },
  external: {
    d: 'M14 3v2h3.6l-9.8 9.8 1.4 1.4L19 6.4V10h2V3h-7zM5 5h5V3H3v18h18v-7h-2v5H5V5z',
    size: 13,
    opacity: 0.7
  },
  craft: {
    d: 'M4 11h11.2l-3.6-3.6L13 6l6 6-6 6-1.4-1.4 3.6-3.6H4v-2z',
    size: 13
  },
  home: {
    d: 'M12 3 2 11h3v9h5v-6h4v6h5v-9h3L12 3z',
    size: 15
  },
  ref: {
    d: 'M6 2h11a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2.5 2.5 0 0 1 0-5h11V4H6a.5.5 0 0 0 0 1h9v2H6a2.5 2.5 0 0 1 0-5z',
    size: 13
  }
} as const satisfies Record<string, IconDef>;

export type IconName = keyof typeof ICONS;
