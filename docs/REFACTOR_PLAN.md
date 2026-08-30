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
| 1 | Vite + Svelte + TypeScript scaffold, quality gates, CI, contracts frozen | **done** |
| 2 | Extract pure logic to TypeScript modules with unit tests | **done** |
| 3 | Ports for replaceable concerns (drag and drop, search, modal) | **done** |
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

## Phase 1 - what was produced

- `package.json` with `npm run check` as the local gate: format, lint,
  typecheck, data generation, `tests/derived.js`, `tests/i18n.js`, unit tests
  with coverage thresholds. `package-lock.json` and `.nvmrc` (Node 22) are
  committed.
- Vite + Svelte 5 (runes) + strict TypeScript. The new app has its own root,
  `app/`, and builds to `dist/`; the live site stays in the repository root
  until the cut-over, so nothing has to work in two places at once.
- ESLint with type-aware rules, Prettier, `svelte-check`. `any` is an error.
  A boundary rule forbids `window`, `document`, `location`, `localStorage`,
  `navigator`, `fetch` and any Svelte import inside `app/src/lib` - that is
  where the pure logic lives, and it has to run without a browser.
- `tools/smoke-file-url.mjs` opens the built page from `file://` and checks it
  renders, that the data arrived, that no `type="module"` survived and that
  every script path is relative.
- `tools/bundle-budget.mjs`, gzip, code only, budget 120 kB; currently 9 kB.
- `.github/workflows/ci.yml`: the same gate, plus the build, the `file://`
  smoke, the budget, the 19 legacy suites, `npm audit` and gitleaks, and a
  deploy job gated on all three (see "Publishing is not gated by CI" below).
- Husky and lint-staged on staged files. The hook does not replace
  `npm run check`.

Two things had to differ from the plan as written.

`"type": "module"` in `package.json` cannot be used: it would turn every `.js`
in `tests/` and `tools/` into an ES module and break all 19 suites and the data
generator at once. The package stays CommonJS by default and the new config
files are `.mjs`; the application itself is TypeScript and unaffected.

Vite emits `<script type="module">` for the entry even when the output format is
`iife`. A page built that way loads on Pages and silently does not load from a
folder, which is exactly the failure `file://` support exists to prevent. A
build plugin rewrites the tag to a classic `defer` script, and the smoke check
fails if it ever comes back. It caught this on its first run.

## Phase 2 - what has been extracted

`app/src/lib`, each with unit tests and none of them touching a DOM:

| Module | Holds |
|---|---|
| `listLink.ts` | the frozen list link: encode, decode, the checksum, both variants |
| `hash.ts` | every route, the filter segment, and building each back |
| `filters.ts` | facet group names and order, and the selection predicate |
| `money.ts` | prices in book units or coins, Russian plurals, suggestion bands |
| `lists.ts` | reading storage defensively, the v1 note split, the two-tab merge |
| `roll.ts` | the six roll engines, with randomness as an argument |
| `data.ts` | the index: by id, the craft reverse-links, rarity, everything with stats |
| `i18n.ts` | record text by language, the equipment vocabulary, the stat line |
| `search.ts` | one substring predicate over both languages and the stat line |
| `types.ts` | the domain types the rest of them share |

203 tests, 94% statements, 84% branches.

None of it is checked only against itself, which is the point. `listLink.ts` and
`hash.ts` replay the golden fixtures that `tests/contracts.js` also runs through
the live app. `i18n.ts` is held to `docs/fixtures/statlines/equipment.json`,
captured from the old app across every equipment kind, four sources and both
languages - and `contracts.js` replays that too, so one file keeps both
implementations honest. `data.ts` runs over the real `data.json` and asserts the
counts the README and `llms.txt` publish, so a silent change to the dataset
fails in three places rather than none. `money.ts` was compared directly: twelve
sums rendered by the old app, character for character, before the tests around
it were trusted.

What is deliberately *not* here: anything that touches the DOM, storage or the
network. That is Phase 3's ports and Phase 4's components. The ESLint boundary
rule on `app/src/lib` is what keeps it that way.

## Phase 3 - the ports

`app/src/ports` names every seam where the app meets the browser, as an
interface with at least two implementations - the real one and something that
runs in a test.

| Port | What it hides |
|---|---|
| `StoragePort` | localStorage, including the fact that it throws in a private window |
| `ClipboardPort` | three levels of clipboard support, falling back one step at a time |
| `SharePort` | the share sheet, and telling a dismissal apart from a failure |
| `RouterPort` | reading the hash, and the difference between a step and a rewrite |
| `CompressPort` | `CompressionStream` for short links, absent on older browsers |
| `DragPort` | native HTML5 drag, thin, as the plan asks |

Two reasons, both practical rather than architectural taste. Every one of these
fails in a way that is not a bug - storage throws, the clipboard is refused
outside a secure context, a person dismisses their own share - and the port
puts that in the type so a caller cannot forget it. And none of them can be
exercised as a global in a unit test, while as an argument they can, which is
the difference between testing the behaviour and testing that a browser exists.

**The boundary is lint-enforced, not documented.** `app/src/lib` may not touch
`window`, `document`, `location`, `history`, `localStorage`, `navigator` or
`fetch`, nor import a port. Everywhere else in `app/src` except `ports/` may
measure the DOM - print fitting cannot be done any other way - but may not reach
for storage, the network, the address bar or the clipboard directly. Without
that rule "app code depends on ports only" is a sentence in a document; with it
it is a build failure.

Writing the tests found a defect in the storage adapter on the first run:
where `localStorage` was unavailable entirely, `set` returned `true` and the
caller would have told the person their lists were saved. That branch is only
reachable with a fake, which is the argument for the port in one line.

A search port was considered and not built. `search.ts` is already a pure
function of records and a query, so swapping a library in later means changing
one call site - a port around it would be indirection with nothing behind it. A
modal port was likewise deferred: there is nothing to abstract until Phase 4 has
a component to put behind it.

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

### Publishing is not gated by CI until Pages is switched over

The first red build still went live. Nothing in the workflow deployed it:
GitHub's own `pages-build-deployment` publishes the configured branch on every
push, and it does not know or care whether Actions passed.

Nothing in a workflow can prevent that. The only fix is in the repository
settings: **Settings -> Pages -> Source: GitHub Actions**. After that the
built-in job stops running and the `deploy` job in `ci.yml` becomes the only way
anything is published - and it `needs: [check, audit, secrets]`.

Until that switch is flipped the `deploy` job is inert, so the change is safe to
land either way.

What it publishes is the repository root, exactly what Pages serves today, from
an explicit file list rather than "everything" - the repository also holds the
sources, the specs and the new app, and none of that belongs on a public site. A
guard step fails the job if any of them reach `_site`. At the cut-over (phase 6)
that list becomes `dist/`.

### A red run has to leave something to read

`tests/run-all.js` buffers each suite's output and prints a dozen grepped lines
on failure. Sitting at the machine that is enough; in CI the run is gone by the
time anyone looks. Every suite's whole output now goes to `test-output/<name>.log`,
and the workflow uploads that directory - with `dist/` and `coverage/` - whenever
the job fails.

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
