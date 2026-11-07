# Plan - TASK readme-screens

This plan adds reproducible screenshots of the app to `README.md` and
`README.ru.md`. One npm script rebuilds the app and recaptures every image.

## Status

- Planned 2026-11-07 (planner). Not started. One implement batch, B1.
- Owner, 2026-11-07: the recommended answer to each of Q1-Q4 is accepted.
  B1 is implement-ready.
- Plan review: not declared. The plan has one batch and no contract change.

## Design

### D1. Fixture data: a separate showcase user (recommended)

Current behavior: the seed users `gm1`-`gm4` exist for the tests. `gm1`'s axe
shows the bedroll picture, its other items have no picture, and its shop list
has an entry at 99999 gold.

Options:

| Option | Effect | Cost |
|---|---|---|
| A. Add a fifth seed user `gm5` for screenshots only (recommended) | Real-looking data; no existing user, list, golden or fixture changes | About 120 lines of seed; `fake-cloud.test.ts` invariants must hold for `gm5` |
| B. Edit `gm1`'s data | No new user | Breaks `docs/fixtures/homebrew-file/export.json` parity, many unit tests and the `as gm1` goldens; the 99999 entry exists to test a wide price |
| C. The script writes data at run time through `window.__dhlootFake` | No seed change | Couples the tool to the fake's internal API; the page must re-read after each write; the data lives in a tool |

Recommendation: A. It keeps every test fixture and golden as it is. The
trade-off: the test build carries one more user that no suite opens except one
seed-shape test.

`gm5` holds (all names RU and EN, prices in the source book's range):

- One list, for example «Лавка у дороги» / "Roadside Shop", money mode `coin`,
  a players' note and a GM note, 6-8 entries of catalog records with
  pictures, three or four prices between 5 and 300 gold, one entry with a
  quantity, and one homebrew entry with a picture.
- One player share, token `showcase-player`.
- One homebrew source with one section and two or three items. Each item with
  a picture uses a catalog picture that matches the item (`art` is a catalog
  basename: the test build has no bucket). The implementer chooses the
  pictures by looking at them; no picture shows a different kind of object.
- No notices, no print sets, preferences `lang: 'ru'`, the default view.

A second account opens the share for the player view: `gm2`, signed in, so the
page shows the request controls. `gm2`'s own data does not show on that page.

### D2. The screen set

README screens (recommendation: four, each in both languages, eight files):

| Name | Route | Build | Signed in | Viewport |
|---|---|---|---|---|
| `roll` | `/roll/std`, manual entry of a fixed value | `dist/` | no | 1280x800 |
| `table` | `/tables/eq_weapon` | `dist/` | no | 1280x800 |
| `list` | `gm5`'s list page | `dist-test/` | `?as=gm5` | 1280x800 |
| `shared` | `/s/showcase-player` | `dist-test/` | `?as=gm2` | 390x844 |

- The English shots use the `/en/` routes for signed-out screens and
  `&lang=en` for account screens. The implementer confirms each route against
  `docs/specs/ROUTES.md` before the capture.
- The roll value is a constant in the shot table. The implementer picks a
  value from 1-60 whose result has pictures for every card (37 was used by the
  previous session; confirm it).
- The homebrew editor is not a README screen. The shot table can hold more
  screens for other documents later; add one only when a document uses it.
- Theme: the app is dark only, so no theme setting is needed.
- Scale: `deviceScaleFactor: 2`. Desktop files are 2560x1600, the phone file
  780x1688. The README sets `width` on each `<img>` (for example 640 for
  desktop, 260 for the phone) so a 2x image is sharp on a high-density screen.
- Format: WebP at quality 80 through Puppeteer's `type: 'webp'`. GitHub renders
  WebP in a README.
- Location: `docs/img/screens/<name>-<lang>.webp`, for example
  `docs/img/screens/roll-ru.webp`.
- Size budget: 400 KB a file, 2.5 MB for the set. The `node --test` suite
  fails above it.

### D3. The script

- `tools/screens.lib.mjs` (pure): the shot table (name, route, build, user,
  viewport, roll value), the output path of a shot, the budgets, and a
  function that lists the image references of a README text.
- `tools/screens.lib.test.mjs` (`node --test`): every shot has a file under
  the budget, the set is under the total budget, both READMEs reference the
  same shot names (RU/EN parity), every reference resolves to a file, and no
  file in `docs/img/screens/` is unreferenced.
- `tools/screens.mjs` (browser half):
  1. Call `assertBuilt` for `dist/` and `dist-test/`.
  2. Serve each directory with `serveDist(path.resolve(ROOT, dir))`.
  3. Launch Puppeteer headless with `prefers-reduced-motion: reduce`.
  4. For each shot: set the viewport, open the route, run the shot's steps
     (for `roll`, open «Настроить», type the value, press Enter).
  5. Wait until the page is settled: `document.fonts.ready`, every `img` in
     the viewport `complete` with `naturalWidth > 0` and `decode()` resolved,
     two animation frames, and no element with an active animation.
  6. Hide the text caret (`caret-color: transparent` through an injected
     style). Take the viewport screenshot, not the full page.
  7. Compare the new pixels with the file on disk (decode both through
     Puppeteer or `pngjs` from a PNG capture). Write the file only when more
     than 0.1 % of the pixels differ. This keeps git history free of
     re-encoded but equal images.
  8. Print one line per shot: the name, `written` or `unchanged`, and the size.
- Exit codes: 1 with one sentence when a build is stale or missing, when a
  route does not reach its settled state in 15 s (name the shot and the
  missing condition), or when a file is over budget.
- npm script: `"screens": "npm run build && npm run build:test && node tools/screens.mjs"`.
  An `--only=<name>` argument recaptures one shot.

### D4. CI and the rerun procedure

- CI does not capture. Linux and Windows render fonts differently, so a CI
  capture churns every file. The goldens already gate the UI.
- CI runs `tools/screens.lib.test.mjs` through `npm run check`: references,
  parity and budgets. It does not detect a stale image.
- Rerun after a UI change: `npm run screens`, look at the changed files,
  commit them with the UI change or in a `docs` commit. `.claude/README.md`
  gets a short "Screenshots" section with this procedure and the host fact
  about the native path.

### D5. README changes

- `README.md`: one `<img>` line per screen, in the section the screen shows:
  `roll` under "Rolling", `table` under "Tables, search and filters", `list`
  and `shared` under "Lists". The alt text names what the image shows.
- `README.ru.md`: the same lines in the same sections, with the `-ru` files
  and Russian alt text.
- The file tree in the "Running and developing" section gets one line for
  `docs/img/screens/` in both READMEs.

## Batches

| Batch | Content | Gate |
|---|---|---|
| B1 | D1 to D5 in one commit | `npm run check:fast`, `npm run screens`, the owner's look at the images, CI, reviewer |

Split criterion: none applies. There is no public-contract change, the seed
and the script are one filter set, and the harness reaches every commit. A
split would pay a second `check:fast` and a second CI run for nothing.

## Batch B1 - acceptance

1. `gm5` is in the seed with the data in D1; the seed header comment names it.
   `fake-cloud.test.ts` gets one case that `gm5`'s list has no price above
   1000 and every `gm5` homebrew item has a picture.
2. No golden moves: CI's golden shards pass unchanged.
3. `npm run screens` writes 8 files under `docs/img/screens/`; a second run
   prints `unchanged` for all 8.
4. The owner looks at the 8 files (send them with `SendUserFile`) before the
   commit.
5. `tools/screens.lib.test.mjs` passes and runs as a stage in
   `tools/check/lib.mjs`; it fails when a README loses a reference (proved
   once by a temporary edit, then reverted).
6. Both READMEs show the four screens in the same sections.
7. `docs/specs/COVERAGE.md` gets a paragraph for `tools/screens*.mjs` and
   names `gm5` in "Test layers" if that section lists the seed users.
8. `.claude/README.md` gets the "Screenshots" section (D4).
9. A decision file under `docs/decisions/` records D1 (option A and the
   rejected B and C) and the CI choice in D4; `docs/DECISIONS.md` indexes it.

## Standing checks

- Scale: 8 files, 2.5 MB at most. Each regeneration that changes all files
  adds up to 2.5 MB to git history; the 0.1 % rule stops re-encoded churn. The
  capture time grows by about 5 s a shot.
- Error scenarios: a stale build, a missing image, a route that never
  settles, an over-budget file and a Windows forward-slash path each stop the
  script with one sentence (D3). A missing README reference fails
  `npm run check`.
- Consistency: one shot table drives the script and the test; file names use
  `<name>-<lang>`; the tool follows `tools/capture-share-fixture.mjs` and
  reuses `serveDist`/`assertBuilt`; no new design token.
- RU/EN parity: every screen exists in both languages; the test fails when the
  two READMEs reference different shot names; the alt text is in the
  README's language.

## Gate cost

B1: `check:fast` 500-700 s, `npm run screens` about 2 min twice, the owner's
look, one CI run about 15 min, one reviewer run (trigger: a check stage in
`tools/check/lib.mjs` changes). Total about 40-50 min of gates plus the
owner's time.

## Owner answers (2026-11-07: the recommended answer to each)

- Q1. Task id `readme-screens`: keep it? (Recommended: yes.)
- Q2. Fixture data: option A, a separate showcase user `gm5`? (Recommended: A.)
- Q3. Screen set: four screens in both languages, the player view on a phone
  width? (Recommended: yes. The alternative is one language, 4 files, which
  breaks RU/EN parity of the READMEs.)
- Q4. Homebrew pictures: matching catalog pictures in the test build, or no
  homebrew item in the screens? (Recommended: matching catalog pictures; the
  list shows that an own item has a picture.)
