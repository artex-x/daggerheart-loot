/* The interface icons, copied from the live app's app.js rather than redrawn.
 *
 * They are part of the look, and the look is not supposed to change - see
 * CLAUDE.md, "This is a refactor, not a redesign". The parity harness (deleted
 * at R0c, issue 47) compared the two apps pixel for pixel, so a path that was
 * nearly the same was a path that failed.
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
  },
  /* The add-to-list button's own icon, off ICON_PLUS in app.js. */
  plus: {
    d: 'M11 5h2v14h-2zM5 11h14v2H5z',
    size: 15
  },
  /* The print link's icon, off ICON_PRINT (app.js:1044). */
  print: {
    d: 'M19 8H5a3 3 0 0 0-3 3v6h4v4h12v-4h4v-6a3 3 0 0 0-3-3zm-3 11H8v-5h8v5zm3-7a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM18 3H6v4h12V3z',
    size: 15
  },
  /* A players'/GM note's role, off ICON_EYE / ICON_EYE_OFF (app.js:1047-1048). */
  eye: {
    d: 'M12 5c-5 0-9 4.5-9.7 6.6a1.2 1.2 0 0 0 0 .8C3 14.5 7 19 12 19s9-4.5 9.7-6.6a1.2 1.2 0 0 0 0-.8C21 9.5 17 5 12 5zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
    size: 13
  },
  eyeOff: {
    d: 'M2.8 3.6 3.9 2.5l17.6 17.6-1.1 1.1-3.2-3.2A10 10 0 0 1 12 19c-5 0-9-4.5-9.7-6.6a1.2 1.2 0 0 1 0-.8A13 13 0 0 1 6 7.3L2.8 3.6zm5.3 5.3A5 5 0 0 0 12 17c1 0 1.9-.3 2.7-.8l-1.5-1.5a2.5 2.5 0 0 1-3.4-3.4L8.1 8.9zM12 5c5 0 9 4.5 9.7 6.6a1.2 1.2 0 0 1 0 .8 13 13 0 0 1-2.5 3.4l-3-3A5 5 0 0 0 9.2 6.4 9.6 9.6 0 0 1 12 5z',
    size: 13
  },
  /* A row's/list's note button, off ICON_NOTE (app.js:1049). */
  note: {
    d: 'M4 3h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H8l-4 4V4a1 1 0 0 1 1-1zm3 5h10V6.5H7V8zm0 3h10V9.5H7V11zm0 3h7v-1.5H7V14z',
    size: 14
  },
  /* A row's drag handle, off ICON_GRIP (app.js:1053) - six dots, drawn as one
     path (`IconDef` carries a single `d`) with the standard two-arc idiom for
     a filled circle, one subpath per dot; geometrically exact, so it rasterizes
     the same as the live app's six `<circle>` elements. */
  grip: {
    d: 'M7.4 6a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0M13.4 6a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0M7.4 12a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0M13.4 12a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0M7.4 18a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0M13.4 18a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0',
    size: 15
  },
  /* The roll panel's die, off ICON_DIE (app.js:1760). */
  die: {
    d: 'M12 2 2 7v10l10 5 10-5V7L12 2zm0 2.3 7.1 3.5-7.1 3.6-7.1-3.6L12 4.3zM4 9.2l7 3.5v7.1l-7-3.5V9.2zm9 10.6v-7.1l7-3.5v7.1l-7 3.5z',
    size: 16
  },
  /* The print bar's "back" button, off ICON_BACK (app.js:1039). */
  back: {
    d: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
    size: 15
  }
} as const satisfies Record<string, IconDef>;

export type IconName = keyof typeof ICONS;
