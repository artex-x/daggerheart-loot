# Refactor: vanilla JS to Svelte + TypeScript

Source: [issue #47](https://github.com/artex-x/daggerheart-loot/issues/47). That
issue is the agreed plan; this file is the working copy, plus the decisions
taken while carrying it out. Where the two differ, the difference is written
down here with a reason.

Historical once the cut-over is done. After that, work is driven by `CLAUDE.md`,
`docs/specs/*` and the tests.

## What must survive

Static site, no server, no build required to open it, lists in the URL hash,
two languages, GitHub Pages, `file://`. These are in `docs/specs/META.md` and
`docs/specs/CONTRACTS.md`, which outlive this file.

## Phases

| Phase | What | State |
|---|---|---|
| 0 | Baseline, inventory, durable specs, golden fixtures, coverage matrix | **done** |
| 1 | Vite + Svelte + TypeScript scaffold, quality gates, CI, contracts frozen | not started |
| 2 | Extract pure logic to TypeScript modules with unit tests | not started |
| 3 | Ports for replaceable concerns (drag and drop, search, modal) | not started |
| 4 | Svelte component architecture, styling, i18n, the rewrite itself | not started |
| 5 | Testing pyramid: unit, component, a11y, e2e | not started |
| 6 | Build, artefacts, deployment | not started |
| 7 | Cut-over, cleanup, README, standing agent guidance | not started |

## Phase 0 - what was produced

- `docs/specs/ROUTES.md` - every route and the hash grammar, including the
  filter segment
- `docs/specs/STATE.md` - the state object, the localStorage keys, the rule for
  what is shareable and what is a preference, the two-tab merge
- `docs/specs/CONTRACTS.md` - the frozen public surface
- `docs/specs/FEATURES.md` - user-visible features and the state each needs
- `docs/specs/COVERAGE.md` - the matrix, the gaps that were closed, the thin
  spots that remain
- `docs/specs/I18N.md` - how two languages work here
- `docs/specs/META.md` - policies that look like bugs and are not
- `docs/fixtures/lists/*.json` - six lists, both link variants each
- `docs/fixtures/urls/routes.json` - 26 route shapes and what they resolve to
- `tests/contracts.js` - replays all of the above

Three documentation defects surfaced and were fixed in the same pass: `llms.txt`
named the equipment filter groups `rg` and `bu` where the code expects `range`
and `burden`, so a link built from the documentation silently returned an
unfiltered table; `robots.txt` still advertised 830 records; and both READMEs
claimed the equipment tables reproduce only the two books, when they hold
equipment from every source.

## Decisions taken while working

### `base: './'`, not `base: '/daggerheart-loot/'`

Phase 1 item 6 of the issue asks for the absolute Pages base path. That
contradicts the `file://` requirement stated in the same issue's opening
constraints: an absolute base breaks every asset URL when the page is opened
from a folder.

Relative asset URLs work on a GitHub Pages project site exactly as well as
absolute ones, and hash routing needs no server rewrites either way, so nothing
is lost by choosing `./`. Recorded in `docs/specs/META.md` section 4.

Consequences for Phase 1:

- output must be a single classic bundle (IIFE), not `<script type="module">` -
  Chrome refuses to load modules over `file://`
- no code splitting or dynamic import, which costs little here: one dataset is
  needed on nearly every route
- `data.js` stays a classic script assigning `window.LOOT`; `fetch()` of a local
  JSON is blocked under `file://`. TypeScript reads it through one typed
  adapter rather than importing it
- a build smoke check should open the built `index.html` from `file://`

### Phase 0 kept the puppeteer suites

The plan moves to Vitest and Playwright. The existing 19 suites are the
baseline the migration is measured against, so they stay until the code they
test is gone. `tests/contracts.js` is written in the same style deliberately -
it has to run today, against the current app, or it is not a baseline.

## Working rules during the migration

From the issue, unchanged:

- repo files are authoritative; do not depend on chat history
- small vertical slices, each with its own tests
- never break a public contract without updating fixtures, `CONTRACTS.md`,
  `llms.txt` and the tests in the same change
- update `docs/specs/*` in the change that alters behaviour, not afterwards
- pure logic free of Svelte and DOM; ports for replaceable behaviour
- strict TypeScript, `any` is an error
- scoped CSS and tokens, plain CSS only
- never infer a tier from stats
- every defect fix gets a test
- bad deploys are fixed by `git revert`
