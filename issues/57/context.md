# Shared task context - TASK 57

## Goal
- Audit the shipped Svelte app in every state, width and language, settle a
  design direction with the owner from mocks, then fix the findings in small
  batches whose mocks the owner approves. Lock the result in `DESIGN.md`.

## Owner directions (2026-10-28, chat)

- Scheduled: task 57 starts after `request-notices`, `catalog-filter-links`,
  the branch-CI deploy check and the address follow-ups (D118-D120).
- The mocks of direction R are a direction, not a source of truth. A state,
  page, dialog or width that no mock shows explicitly adopts the new design
  by its system (tokens, components, patterns); it does not keep the old
  look and it does not wait for a mock. Where a mock and a spec rule
  conflict, the spec wins and the difference is named to the owner.
- Reuse Impeccable as much as possible (shape, critique, audit, polish,
  harden, document) instead of hand-made equivalents.
- Minimise or remove every Impeccable exception: the detector's
  `ignoreValues` (target empty at closeout, as already settled) and the
  repository's exceptions for Impeccable's own files and hooks (on `main`
  2026-10-28: `.gitignore` lines for `.impeccable/hook.cache.json`,
  `hook.pending.json`, `config.local.json`; `.prettierignore` lines for those
  three plus `.impeccable/config.json`). The plan inventories every such
  exception (hooks, ignores, lint, prettier, guards), removes each one it
  can, and names each kept one to the owner with its reason.
- Pay the debt: the task takes every `docs/specs/DEBT.md` entry owned by
  task 57 (on `main` 2026-10-28: D116, the lists page's «Ваш аккаунт»
  heading) and every other open entry that is a UI or UX defect, unless
  another scheduled task already owns it. The refresh lists them against
  `DEBT.md` on `main` at that time, places each in a batch or names it to the
  owner, and closes the task with no UI/UX entry left in `DEBT.md` unless the
  owner keeps it. Also re-check the UI-related items in `issues/57/audit.md`
  that later tasks may have fixed or changed.
- Owner away (2026-10-28): after the refresh and plan, implement the
  batches on the task branch with their reviews and CI, foundations first
  (tokens, type, shell). Direction R is the approved direction; no batch
  lands on `main` until the owner has seen it (screenshots at 360 and
  1180 px). The owner may change the direction before implementation
  starts.
- Before planning resumes: refresh this task against `main` (path routes,
  R10's five tabs, request-notices, catalog-filter-links have changed the
  surfaces since direction R was drawn on 2026-10-23).

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
    (see Constraints). Home: `DESIGN.md`, batch 1 (owner, 2026-10-29).
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
  - Direction chosen (owner, 2026-10-23): R as recommended - B1's three
    jobs and work areas, A1's strict gold budget, Source Sans 3, and C's
    card face on roll results only. A brief A1 choice the same day was
    withdrawn; `mocks/direction/compare-a.*` stays as history.
  - Mode row (owner critique of R, 2026-10-23): B1's row of two chips, a
    label and seven supplement chips wrapped at 1180. Fix: «Обычные
    правила», «Альт. таблицы» and one «Дополнения ▾» chip that opens a
    menu of the seven; on a supplement page the chip shows its name in the
    current-place gold («Vault of Ages ▾»). Three controls, one line at
    every width. Accepted trade-off: a switch between supplements takes one
    more tap. Not taken: one row of nine that scrolls with an edge fade.
    Home: `FEATURES.md` "Chrome" and DESIGN.md, written by batch 2 (batch 7 before the 2026-10-29 refresh).
  - Job icons (owner, 2026-10-23): an icon before each job label, as in R's
    header mock; a label never gives way to an icon at any width (theme 3).
    Source: `app/src/lib/icons.ts` (`die`, `table`; `search` added from
    Material Icons, Apache 2.0). Home: batch 2.
  - Font dependency (owner, 2026-10-23): batch 1 adds
    `@fontsource-variable/source-sans-3`; print cards keep their font
    through `--print-ui`.
  - Manual review (owner, 2026-10-23): R has a mock for every screen and
    state (`mocks/direction/index.html`, R by surface); the owner reviews
    them all before batch 1.
  - Review round answers (owner, 2026-10-23, `mocks/direction/questions.html`):
    - At 360 a mode chip may show its label on two lines; the chip text
      matches the page heading. Home: batch 2.
    - The «Дополнения ▾» menu replaces the supplement chip panel on
      supplement pages (C48). Home: batch 2, `FEATURES.md` "Chrome".
    - ESLint ignores `issues/*/mocks/**` (task mock pages are scratch that a
      closeout deletes). Home: `eslint.config.mjs`.
    - Order: a plan review of R runs now. Implementation (batch 1 onward)
      starts only after R10 and `cloudflare-pages` have shipped; the
      dispatch refresh of batch 1 re-reads both landings (the `/en/` URL
      and the language switch reach batch 2 since the 2026-10-29 refresh). The owner sends review notes
      on the R states before batch 1; each note becomes an acceptance line
      in the batch that owns the screen.
  - Bundle budget (owner, 2026-10-23, `plan.md` Q1): if the font CSS
    passes the budget, batch 1 raises it to the measured total rounded up
    to the next whole kB, with the reason in the same commit, under the 270
    and 350 kB ceilings. Home: `tools/bundle-budget.mjs` and its decision
    file, written by batch 1.
  - Site share cards (owner, 2026-10-29, chat: "Yes, batch 1"): batch 1
    re-renders both cards in the new system with the font change. Home:
    `docs/artwork.md`, "The site share cards", written by batch 1. Facts:
    `og/_share.jpg` and
    `og/_share_en.jpg` are rendered by `tools/artwork/cards.mjs` from
    `shareCardSvg()` in `tools/artwork/lib.mjs`, set in Inter
    (`CARD_FONT`, faces in `tools/artwork/fonts/`), with the old violet
    and blue grounds and a gold star and gold «DAGGERHEART». `docs/artwork.md`,
    "The site share cards", says the text uses the first family of `--ui`,
    so batch 1's font change makes that sentence false. The paths are a
    contract (`CONTRACTS.md` section 5); the bytes are not. Scope: Source
    Sans 3 faces, R's ground and gold budget, `CARD_FONT`, the font files,
    hashes and text in `docs/artwork.md`, then `cards.mjs` and `--check`.
    Per-item `og/<id>.jpg` are
    art only and stay.
  - DESIGN.md timing (owner, 2026-10-29, chat): each DESIGN.md rule is
    written by the batch that ships it (plan section 5); the clarity rule
    moves from the lock batch to batch 1. The refresh adds a table that maps
    every `audit.md` finding and systemic theme to the batch that writes its
    DESIGN.md rule. Home: `DESIGN.md`, batch 1 (clarity rule).
  - Batch merges (owner, 2026-10-29, chat): the refresh merges batches 5
    and 6 (homebrew editor with homebrew pages and imports) and batches 9b
    and 10 (lists page with the shared list page), 12 batches to 10, to save
    gate cycles. The planner may pair 10 with 9a instead when the shared
    page reuses more of `ListPage.svelte` than of the lists page; it names
    the evidence. Home: `plan.md` only (scratch).
  - Batch mocks first (owner, 2026-10-29, chat): every batch's planner
    refresh makes or updates the batch mock and shows it to the owner for
    confirmation before the implementer starts, unless the owner is away
    (then the recommended option, logged as in "Owner away"). While the
    owner is present (about five hours from 2026-10-29 afternoon), draw the
    mocks of every batch that does not depend on an earlier batch's
    implementation, ahead of time and in parallel where the host allows, so
    the owner confirms them before going away. Home: `plan.md` (scratch).
  - Plan refresh answers (owner, 2026-10-29, chat, `plan.md` section 13):
    - Q1: download `SourceSans3-Regular.ttf`, `SourceSans3-Semibold.ttf`
      and the OFL `LICENSE.md` from github.com/adobe-fonts/source-sans,
      release 3.052R, `TTF/`, into `tools/artwork/fonts/` (batch 1).
    - Q2: share cards on the app's own ground, gold on the star only,
      «DAGGERHEART» in the muted brand-line colour (batch 1).
    - Q3: one English spelling everywhere: American. Not only the UI and
      the share cards - also `llms.txt` (a public contract file: its
      fixtures, `tests/contracts.js` and `CONTRACTS.md` move in the same
      commit), the developer docs and the AI-facing files in the
      repository (`.claude/` prompts, skills and agents, `CLAUDE.md`).
      Record it as a decision file under `docs/decisions/`. Home: the
      decision file and `I18N.md`, written by the batch that ships P7.
    - Q4: keep E6, E8, E9, listed as kept exceptions (batch 10).
  - Plan review answers (owner, 2026-10-29, chat, `reviews/plan-1-2.md`):
    - B1: keep E5 (the two `.gitignore` lines for the hook cache files);
      this replaces the "remove with proof" part of Q4.
    - B3: the whole American-spelling sweep goes in batch 2 (no batch 2b);
      the owner accepts the longer batch 2 review. Minimise British
      spelling: respell code comments, test titles and `.claude/hooks/`
      too. Keep only what cannot change without breaking data or a frozen
      contract: identifiers and stored values (`VectorPaint 'colour'`,
      fixture keys, golden ids, file names), the frozen `schema/*.json`
      wording, and quotations and records (earlier decision bodies, commit
      messages, DPCGL and source-book text). Each kept form is named in the
      decision file.
  - Mock questions (owner, 2026-10-29, chat: "Yes, remove all"): Q6.1
    (/homebrew «Справка» panel), Q6.2 (the eight editor field «?»
    buttons), Q8.1 (/lists «Справка» panel) and Q9.1 (the list page's
    inline «?» buttons) take option A: remove. This is the owner's yes to
    remove those visible features (Constraints, clarity rule). Q6.1 is the
    /homebrew help panel (A27).
  - Mock answers (owner, 2026-10-29, chat, interactive):
    - No-picture state: the kind glyph everywhere, print included (colour
      and black-and-white), and delete `img/_none.webp`,
      `img/thumb/_none.webp` and `og/_none.jpg`. The owner accepts the
      public contract change (asset paths) and the print change; every
      reader moves (preview worker, share stub pages, check-site,
      collect-site.sh, dataint, the offline thumbnail fallback, FEATURES.md,
      META.md, CONTRACTS.md). Home: the specs named, written by the batch
      that ships it.
    - C1 and C38 help panels: rename, not remove - «Об этих данных» with
      three data notes (C1), «Где какая редкость» with the book's four
      placement lines (C38).
    - Every other mock row takes the recommendation: share card text kept
      with "armor" (Q1.1); the linear page ground
      `linear-gradient(180deg, var(--bg2) 0, var(--bg) 520px)` in place of
      the radial washes, share cards included; R7 «Бросок» opens the start
      section; R3 the account menu in `FEATURES.md` order with no counts;
      C57 a temporary grid/table choice with no note.
    - Mock 1 approved (batch 1 may start once the plan review allows it).
  - First-screen rule (owner, 2026-10-29, chat): at 360x640 and 1180x720
    each page's primary content (roll results, first table rows, first
    list entry, the item) starts inside the first screen, and the controls
    above it take at most about 40% of the height. Every mock and batch
    review checks it; the planners re-check all nine mocks and name each
    failure. How each page meets it (folded controls, compact cards, a
    scroll, another order) is the planner's recommendation per page and
    width; the owner does not pre-judge it. Trigger: the roller at 360
    (`mocks/2/roller-supmenu__360__ru.png`): the first result starts about
    880 px down, and each result card is about 450 px tall. Home:
    `DESIGN.md` (batch 1) and a measured check in the browser suite.
- Open questions: none.

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
- Mocks: `issues/57/mocks/` (phase 2 and each batch). R's states:
  `mocks/direction/R/state.html?s=<state>&lang=en`, from `R/states.js` and
  `R/r.css`; PNGs `R/<surface>-<state>__<width>__<lang>.png`.

## Tasks that moved the UI (all on `main` at `c8243ba6`, checked 2026-10-29)
- R10 `e02364d3`: five tabs, no browser lists, no banner or move notices,
  `/l/` draws not-found; the list states of `inventory.js` are account-list
  states (`LIST_A ... as gm4`).
- Cloudflare Pages `d0fd98bc` and path addresses `1ace55e7`: every route is a
  path, `/en/` before every English one; links through `pathOf()` and
  `app.href()`; `routes.json` keeps internal `#/` strings and
  `tests/app/contracts.js` compares through `pathOf()`; the language switch
  stays a `Seg` control.
- Request toasts `198997ed`: a `go` toast action, the lowest-priority arrival
  toast, the (N) title; `DEBT.md` D121 is its focus defect.
- `f74eae09`: the Items-tab filter address, the tables nav landmark and 210 px
  strip cap (D112, D113 fixed), bold-italic set names.
- `DEBT.md` on `c8243ba6`: D116 and D121 only, both task 57.
- Detector on `app/src` (2026-10-29): 130 findings - `side-tab` on
  `HitNote.svelte` (not ignored), `broken-image` in `orGrid.test.ts`, 128
  `design-system-*` advisories (33 in `PrintCard.svelte`).
- `test:artwork` is a check stage, not an npm script: `node --test
  tools/artwork/lib.test.mjs`.

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
- `@fontsource-variable/*` packages declare the family `'<Name> Variable'`
  (expected `'Source Sans 3 Variable'`); the package is not installed yet,
  so batch 1 reads the name from its CSS.
- Bundle budget (`tools/bundle-budget.mjs`, measured 2026-10-22): 252.6 kB
  against 253 unconfigured, 310.6 against 311 configured; `.css` counts;
  decision 2026-10-22 allows a raise to the measured total under 270 / 350.
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
  Order (owner, 2026-10-23): every batch, batch 1 included, starts only
  after R10 and `cloudflare-pages` have shipped; the batch 1 dispatch
  refresh re-reads both landings.
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
