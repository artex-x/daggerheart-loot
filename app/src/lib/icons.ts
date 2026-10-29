/* The interface icons, copied from the live app's app.js rather than redrawn.
 *
 * They are part of the look, and the look is not supposed to change - see
 * CLAUDE.md, "This is a refactor, not a redesign". The parity harness
 * (deleted at 23c00a6, issue 47) compared the two apps pixel for pixel, so a
 * path that was nearly the same was a path that failed.
 *
 * Data, not markup: `Icon.svelte` draws them. The sizes travel with the paths
 * because the live app sets them per icon rather than by class. */

export interface IconDef {
  /** The path, exactly as app.js has it. */
  d: string;
  size: number;
  /** The live app dims two of these; a different opacity is a different pixel. */
  opacity?: number;
  /** A path drawn on another grid than `0 0 24 24`, as its source publishes it. */
  viewBox?: string;
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
  /* Not in app.js: the `craft` arrow mirrored, so "Made from" points back
     along the chain (FEATURES.md, "Records"). */
  craftFrom: {
    d: 'M20 11H8.8l3.6-3.6L11 6l-6 6 6 6 1.4-1.4-3.6-3.6H20v-2z',
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
  /* The print link's icon, off ICON_PRINT (`git show 23c00a6^:app.js`). */
  print: {
    d: 'M19 8H5a3 3 0 0 0-3 3v6h4v4h12v-4h4v-6a3 3 0 0 0-3-3zm-3 11H8v-5h8v5zm3-7a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM18 3H6v4h12V3z',
    size: 15
  },
  /* A players'/GM note's role, off ICON_EYE / ICON_EYE_OFF (`git show 23c00a6^:app.js`). */
  eye: {
    d: 'M12 5c-5 0-9 4.5-9.7 6.6a1.2 1.2 0 0 0 0 .8C3 14.5 7 19 12 19s9-4.5 9.7-6.6a1.2 1.2 0 0 0 0-.8C21 9.5 17 5 12 5zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
    size: 13
  },
  eyeOff: {
    d: 'M2.8 3.6 3.9 2.5l17.6 17.6-1.1 1.1-3.2-3.2A10 10 0 0 1 12 19c-5 0-9-4.5-9.7-6.6a1.2 1.2 0 0 1 0-.8A13 13 0 0 1 6 7.3L2.8 3.6zm5.3 5.3A5 5 0 0 0 12 17c1 0 1.9-.3 2.7-.8l-1.5-1.5a2.5 2.5 0 0 1-3.4-3.4L8.1 8.9zM12 5c5 0 9 4.5 9.7 6.6a1.2 1.2 0 0 1 0 .8 13 13 0 0 1-2.5 3.4l-3-3A5 5 0 0 0 9.2 6.4 9.6 9.6 0 0 1 12 5z',
    size: 13
  },
  /* A row's/list's note button, off ICON_NOTE (`git show 23c00a6^:app.js`). */
  note: {
    d: 'M4 3h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H8l-4 4V4a1 1 0 0 1 1-1zm3 5h10V6.5H7V8zm0 3h10V9.5H7V11zm0 3h7v-1.5H7V14z',
    size: 14
  },
  /* A row's drag handle, off ICON_GRIP (`git show 23c00a6^:app.js`) - six dots, drawn as one
     path (`IconDef` carries a single `d`) with the standard two-arc idiom for
     a filled circle, one subpath per dot; geometrically exact, so it rasterizes
     the same as the live app's six `<circle>` elements. */
  grip: {
    d: 'M7.4 6a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0M13.4 6a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0M7.4 12a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0M13.4 12a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0M7.4 18a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0M13.4 18a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0',
    size: 15
  },
  /* The roll panel's die, off ICON_DIE (`git show 23c00a6^:app.js`). */
  die: {
    d: 'M12 2 2 7v10l10 5 10-5V7L12 2zm0 2.3 7.1 3.5-7.1 3.6-7.1-3.6L12 4.3zM4 9.2l7 3.5v7.1l-7-3.5V9.2zm9 10.6v-7.1l7-3.5v7.1l-7 3.5z',
    size: 16
  },
  /* The print bar's "back" button, off ICON_BACK (`git show 23c00a6^:app.js`). */
  back: {
    d: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
    size: 15
  },
  /* Not in app.js: the formatting toolbar's buttons (FEATURES.md, "Consistency rules",
     rule 18), Material Icons format_bold, format_italic, format_list_bulleted,
     format_list_numbered and grid_on, the family of `copy` (Apache 2.0). */
  bold: {
    d: 'M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z',
    size: 18
  },
  italic: {
    d: 'M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z',
    size: 18
  },
  listBullet: {
    d: 'M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z',
    size: 18
  },
  listNumber: {
    d: 'M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z',
    size: 18
  },
  table: {
    d: 'M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 20H4v-4h4v4zm0-6H4v-4h4v4zm0-6H4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4z',
    size: 18
  },
  /* Not in app.js: the header's account control (FEATURES.md, "Chrome"). */
  user: {
    d: 'M12 12a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4zm0 2.1c-3.4 0-8.4 1.7-8.4 5v1.3h16.8v-1.3c0-3.3-5-5-8.4-5z',
    size: 15
  },
  /* Not in app.js: the neutral pressed state's mark (DESIGN.md, "Segmented
     control"), Material Icons check (Apache 2.0). */
  check: {
    d: 'M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
    size: 16
  },
  /* Not in app.js: the kind glyphs of the art well (DESIGN.md, "Cards"), filled,
     Apache 2.0. Material Icons shield, science and diamond; the weapon is
     Material Symbols swords (fill 1), on that family's own grid. */
  kindArmor: {
    d: 'M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z',
    size: 24
  },
  kindConsumable: {
    d: 'M19.8 18.4 14 10.67V6.5l1.35-1.69c.26-.33.03-.81-.39-.81H9.04c-.42 0-.65.48-.39.81L10 6.5v4.17L4.2 18.4c-.49.66-.02 1.6.8 1.6h14c.82 0 1.29-.94.8-1.6z',
    size: 24
  },
  kindItem: {
    d: 'M19 3H5L2 9l10 12L22 9l-3-6zM9.62 8l1.5-3h1.76l1.5 3H9.62zM11 10v6.68L5.44 10H11zm2 0h5.56L13 16.68V10zm6.26-2h-2.65l-1.5-3h2.65l1.5 3zM6.24 5h2.65l-1.5 3H4.74l1.5-3z',
    size: 24
  },
  kindWeapon: {
    d: 'M762-96 645-212l-88 88-28-28q-23-23-23-57t23-57l169-169q23-23 57-23t57 23l28 28-88 88 116 117q12 12 12 28t-12 28l-50 50q-12 12-28 12t-28-12Zm118-628L426-270l5 4q23 23 23 57t-23 57l-28 28-88-88L198-96q-12 12-28 12t-28-12l-50-50q-12-12-12-28t12-28l116-117-88-88 28-28q23-23 57-23t57 23l4 5 454-454h160v160ZM278-526 80-724v-160h160l198 198-160 160Z',
    size: 24,
    viewBox: '0 -960 960 960'
  }
} as const satisfies Record<string, IconDef>;

export type IconName = keyof typeof ICONS;
