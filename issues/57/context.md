# Shared task context - TASK 57

## Goal
- Audit the shipped Svelte app in every state, width and language, settle a
  design direction with the owner from mocks, then fix the findings in small
  batches whose mocks the owner approves. Lock the result in `DESIGN.md`.

## GitHub issue (if any)
- URL: https://github.com/artex-x/daggerheart-loot/issues/57
- Captured or last verified: 2026-10-23
- Title: Audit + Improve / Redesign Functional Tool UI
- Summary (facts only):
  - Dense functional RPG tool (loot roller + reference), bilingual, not a
    landing page. Primary skill: Impeccable. The issue also names Vercel
    web-design-guidelines; the owner dropped it (2026-10-23).
  - Goals in order: core flows correct; WCAG 2.2 AA; deliberate UI with no
    AI-slop tells; keeps the Daggerheart / fantasy register; polish in place
    unless the system is weak; reuse existing art; lock `design.md`.
  - Punch list P0 (a11y, broken flows), P1 (usability, hierarchy), P2
    (polish, tone, asset integration).
  - No new features unless a fix needs one. Keep IA and core flows.
  - Final report: audit summary, polish-vs-redesign decision, changes by
    group, `DESIGN.md` summary, accepted exceptions, how to re-run checks.
- Decisions already settled (owner, 2026-10-23):
  - Process: phase 1 critique, phase 2 direction with mocks, phase 3 small
    plan-implement-review-fix batches; the owner approves each mock before
    code. One batch per session; `sessions.md` holds each session's prompt.
  - Clarity rule: "a user interface is like a joke - if you have to explain
    it, it is not that good". Every critique and mock review applies it
    (see Constraints). Home: `DESIGN.md`, at the lock batch.
  - Use Impeccable wherever it applies: `critique`/`audit` in phase 1,
    `shape` and mocks in phase 2, `polish`/`harden` per batch, `document`
    for the `DESIGN.md` lock.
  - Phase 1 triage (owner, 2026-10-23), over `audit.md`:
    - Phase 2 takes all eight systemic themes, the missing-art placeholder
      (theme 7) included.
    - Help panels (`#/tables`, `#/roll/std`, `#/homebrew`): decided per
      batch mock, not at plan level. Each mock that touches a panel asks.
    - Every finding outside a theme is phase 3 input, grouped by surface;
      a `verify` row is checked in a live browser first; a row may still be
      rejected at its batch mock.
    - The EN header shows «Loot» as the wordmark; RU keeps «Лут». This
      changes the `DESIGN.md` rule "the wordmark is never translated"
      (home: `DESIGN.md`, written by the batch that ships it).
  - Detector exceptions (owner, 2026-10-23; home: `DESIGN.md` "Notes" and
    `.impeccable/config.json`): `ignoreValues` is empty at closeout. The
    list-notes batch (A5, A22) removes the `side-tab` entry for
    `ListPage.svelte`; the font batch removes `overused-font: inter`. A kept
    exception needs a reason in `DESIGN.md` "Notes", named to the owner.
    The closeout regenerates `.impeccable/design.json`.
  - UI font (owner, 2026-10-23): re-evaluate Inter; a full redesign is
    accepted. Requirements: full Cyrillic, tabular figures for stat lines,
    legible at 12 px, a licence that allows self-hosting, no third-party
    font CDN. Print card layouts stay (product law); a print font change
    needs the owner's yes and its own batch with the print checks.
  - Directions (owner, 2026-10-23): up to three directions (A, B, C) with
    up to about nine options in total; one folder per direction, an
    `index.html` overview; `plan.md` compares them in one table and
    recommends one direction and one option. The recommendation may combine
    parts (set R, shown first); the batch outline follows it. Six surfaces:
    header, catalog, item, roller, account list, homebrew editor (the
    editor added by the owner, 2026-10-23).
- Open questions: the direction and option choice (`plan.md`, section 2).

## Screenshot / attachment findings
- None attached to the issue. Phase 1 makes the evidence set.

## Key paths
- Specs: `docs/specs/FEATURES.md`, `I18N.md`, `COVERAGE.md`; `DESIGN.md`,
  `PRODUCT.md` (Impeccable context, root); `.impeccable/design.json`
  (2026-09-19, older than `DESIGN.md` of 2026-10-22 - check for drift).
- Code hot paths: `app/src/styles/tokens.css`, `app/src/components/`,
  `app/src/pages/` (confirm names at phase 2).
- State inventory: `tests/app/inventory.js` (about 370 states; goldens in
  `tests/app/snapshots/` are accessibility-tree text, one width, both
  languages - no pixels).
- Width sweep: `tests/app/sweep.js` (widths 360, 390, 768, 1180; RU and EN).
- One theme only: `tokens.css` has no dark scheme.
- Mocks: `issues/57/mocks/` (phase 2 and each batch).

## Persistence clean-up (R10) and other tasks that move the UI
- R10 (`issues/persist-10-legacy-removal/`, on `main`) is dispatchable from
  2026-10-26. It deletes the Lists tab (nine sections stay), the banner under
  the header, `MoveNotice`, `MoveStatus`, `StorageNotice`, browser lists,
  the `#/l/` pages and the signed-out print prompt of a browser list, and
  re-seeds goldens (`B10.1`, `B10.3`). Its plan section 5 is the post-R10
  shape.
- `cloudflare-pages` (after R10) puts `/en/` in the URL; the language
  switch can become a link. Repo layout changes, no visual redesign.
- `catalog-filter-links` (after R10, not ordered) touches filter UI.

## Command costs
| Command | Wall clock | Fits one call? |
|---|---|---|
| `npm run check:fast` | 215-310 s (2026-10-07) | yes |
| `npm run check` | 10-18 min cold | no; main session, background |
| `node tests/app/sweep.js <width>` | about 8 min per width (R10 plan) | yes |
| `node tests/app/golden.js --shard=n/4` | about 3-4 min per shard | yes |
| CI run to the last gate job | 10.5-11.5 min | remote; `ci-credit.mjs` |

## Which machine is authoritative
- This Windows host for timings; CI for the full gate.

## Reasons already disproved
- "About a third of the Core items and most of VoA have no art" (C55, C11,
  grid tiles): a capture artefact. Every one of the 1459 records names an
  `img/` file that exists (checked 2026-10-23); rows below about 2200 px
  had not loaded their `loading="lazy"` image in the full-page capture.
  Only homebrew without a picture shows `img/_none.webp` (the "?" pedestal).

## Font facts (checked 2026-10-23)
- No `@font-face` and no font service. `--ui` starts with the local name
  'Inter', so a machine without Inter renders Segoe UI, SF or Roboto.
- `PrintCard.svelte` sets its text in `var(--ui)`: a `--ui` change reaches
  the print cards unless the card keeps its own token.
- The detector flags Inter, Lato, Open Sans and Roboto as overused; it does
  not flag Source Sans, PT Sans, IBM Plex Sans, Golos Text or Onest.

## Constraints
- The clarity rule, as a check: a finding is raised when a control, state or
  section needs help text, a tooltip, a legend or an instruction sentence to
  be understood, or when its label does not say what it does. The fix
  changes the UI so the text can go. Removing a help panel or any visible
  feature needs the owner's yes first.
- Item art is a fixed asset (owner, 2026-10-23): the images in `img/` stay
  as they are - square, mostly dark grounds, some cut-outs on black. Design
  every surface around those exact images on screen; never propose to
  redraw, regenerate, recolour or replace them. Framing, size, crop window
  and the placeholder for a record with no image are design choices; the
  image bytes are not. Mocks use the real files from `img/`.
- Audit and design only the post-R10 shape: skip the surfaces R10 deletes.
  R10 does not have to ship first. A batch that touches the header, the tab
  bar, the notices or the list pages waits for R10 `B10.3` (same files,
  same goldens); other batches may run before it (owner, 2026-10-23).
- Contracts: routes, ids, links, asset paths stay. Print layouts (63x88 mm
  nine per sheet, 44x63 mm sixteen, colour and black-and-white, Figma
  nodes) are product law: a redesign does not touch them.
- RU/EN parity in every finding and mock; Russian terms from the
  `daggerheart-ru-terms` skill.
- A new state: an `inventory.js` entry and a re-seeded golden, same change.

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
- You suspect drift vs issue or plan
