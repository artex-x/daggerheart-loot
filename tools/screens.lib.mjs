// The README screenshots: the shot table, the budgets and the README reader.
// Pure: tools/screens.mjs drives the browser and the files. The procedure:
// .claude/README.md, "Screenshots".

/** The folder of the images, relative to the repository root. */
export const SCREENS_DIR = 'docs/img/screens';

/** The size limit of one image, in bytes. */
export const FILE_BUDGET = 400 * 1024;

/** The size limit of the whole set, in bytes. */
export const SET_BUDGET = 2.5 * 1024 * 1024;

/** The share of changed pixels below which a recapture keeps the file on disk. */
export const PIXEL_TOLERANCE = 0.001;

export const LANGS = ['ru', 'en'];

/** The id of gm5's list, `uuid(901)` of the fake cloud's seed. */
const SHOWCASE_LIST = '00000000-0000-4000-8000-000000000901';

/** The roll value of the `roll` shot: a Core rules result that has a picture on every card. */
const ROLL_VALUE = '37';

/* `build` is the built directory that holds the page: `dist` is what is published,
   `dist-test` carries the fake cloud (`?as=<user>`). A route per language is the path in the
   address (`/en/` for English). */
const DESKTOP = { width: 1280, height: 800 };
const PHONE = { width: 390, height: 844 };

/** The screens of the READMEs, in the order of the READMEs' sections. */
export const SHOTS = [
  {
    name: 'roll',
    build: 'dist',
    viewport: DESKTOP,
    route: { ru: '/roll/std', en: '/en/roll/std' },
    roll: ROLL_VALUE
  },
  {
    name: 'table',
    build: 'dist',
    viewport: DESKTOP,
    route: { ru: '/tables/eq_weapon', en: '/en/tables/eq_weapon' }
  },
  {
    name: 'list',
    build: 'dist-test',
    viewport: DESKTOP,
    route: {
      ru: '/lists/' + SHOWCASE_LIST + '?as=gm5',
      en: '/en/lists/' + SHOWCASE_LIST + '?as=gm5'
    }
  },
  {
    name: 'shared',
    build: 'dist-test',
    viewport: PHONE,
    route: { ru: '/s/showcase-player?as=gm2', en: '/en/s/showcase-player?as=gm2' }
  }
];

/** Returns the file of a shot in a language, relative to the repository root. */
export function outPath(shot, lang) {
  return SCREENS_DIR + '/' + shot.name + '-' + lang + '.webp';
}

/** Returns every image of the set as `{ shot, lang, file }`, in table order. */
export function allImages() {
  return SHOTS.flatMap((shot) =>
    LANGS.map((lang) => ({ shot, lang, file: outPath(shot, lang) }))
  );
}

/** Returns the file names (`roll-ru.webp`) a README text references under the images folder. */
export function imageRefs(text) {
  const re = new RegExp(SCREENS_DIR.replace(/[/.]/g, '\\$&') + '/([a-z0-9-]+\\.webp)', 'g');
  return [...text.matchAll(re)].map((m) => m[1]);
}

/** Returns the share of pixels that differ between two RGBA buffers of one size, 1 when the sizes differ. */
export function changedShare(a, b) {
  if (a.length !== b.length || a.length === 0) return 1;
  let changed = 0;
  for (let i = 0; i < a.length; i += 4) {
    if (
      Math.abs(a[i] - b[i]) > 8 ||
      Math.abs(a[i + 1] - b[i + 1]) > 8 ||
      Math.abs(a[i + 2] - b[i + 2]) > 8
    ) {
      changed += 1;
    }
  }
  return changed / (a.length / 4);
}
