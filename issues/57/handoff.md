# Handoff - TASK 57
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (batch 1 done; batch 1b next)
- Last agent: implementer (batch 1, continued from an interrupted session)
- NEEDS_HUMAN_CONFIRMATION: yes, for batch P only (QP.1, QP.6-QP.8 are
  answered in `context.md`, "Mock P answers"; batch P's refresh marks them);
  batch 1b does not wait
- Branch: `claude/57` (worktree `.claude/worktrees/57`)
- Base / starting commit: `9112c4ed` (the merge of `main` `c8243ba6`)
- Pushed: yes, `claude/57` tip `a07f3e3d` (batch 1); the fix pass `1-fix`
  follows it

## Completed
- Batch name/id: batch 1 - Foundation (mock 1 approved)
- What shipped:
  - Source Sans 3 self-hosted: `@fontsource-variable/source-sans-3` 5.3.1
    (exact), upright and italic CSS in `main.ts`, two preloads (Latin and
    Cyrillic upright) that Vite rewrites to the hashed `/assets/` files;
    `--ui` is `'Source Sans 3 Variable', ...`; print on `--print-ui` (the old
    stack); the artwork review page on `--t-page` (it gets no font import and
    draws the fallback stack).
  - The ten-step ramp (`--t-page` to `--t-badge`, `--t-num`), every
    component size on a token (no literal `font-size` px left in
    `app/src/components`); `--step-0` and `--h-page-size` gone; `--art-well`.
  - The linear page ground (`background-attachment: scroll`), no
    `radial-gradient` in `app/src`.
  - `Seg` `neutral` (check icon, lit `--muted2` border, no gold) on the
    language, tables view and print colour switches; unique badge neutral
    dashed; roll number in the UI face's tabular figures; stat line in the UI
    face; footer links muted and underlined.
  - `icons.ts`: `check`, `kindArmor`, `kindConsumable`, `kindItem`,
    `kindWeapon` (Material Symbols swords on its own grid; `Icon.svelte` takes
    a `viewBox`). `kindGlyph` in `label.ts`.
  - `ArtWell.svelte` and its five screen callers (RecordCard, RowMain,
    TableRows, ListCard, ArtField); print and the editor's print preview stay
    on `_none.webp`.
  - `data-primary` on the primary elements (StdPanel, AltPanel and RollPanel
    results - RollPanel serves PickerRollPanel; ItemPage and RecordPage card;
    TableRows `primary` on the tables, search, homebrew and shared pages;
    Panel `primary` on the account page's first panel; PrintPage sheet;
    HomebrewEditor form; HomebrewCards cards; ListsPage grid; ListPage rows)
    and `tests/app/states.js` case 83 with `FIRST_SCREEN` (all rows logged).
  - Share cards in Source Sans 3 (Adobe 3.052R, hashes in `docs/artwork.md`)
    on the app ground, gold on the star only, EN "armor".
  - DESIGN.md: Clarity, Local Font, Numerals, Ten Steps, Capitals, Seal
    budget, neutral pressed, icon and label, art well, First-Screen and
    Phone-First rules; frontmatter `typography` (ten steps). PRODUCT.md
    Users, Positioning, Operating Context (device shares) and the stale
    "no backend", relative-path, GitHub Pages and `localStorage` lines.
    FEATURES.md "Chrome" font bullet; the font decision file and the
    "Superseded in part" pointer in the 2026-09-23 previews decision.
  - E1 (no Inter ignore), E3 (three `.prettierignore` lines gone).
- Files changed: about 110 under `app/`, `tests/app/`, `tools/artwork/`,
  `docs/`, `og/`, `DESIGN.md`, `PRODUCT.md`, `.impeccable/config.json`,
  `.prettierignore`, `package.json`, `package-lock.json`; screenshots in
  `issues/57/mocks/1/built/`.
- Previous sha (batch diff base): `45cd6ccd` (the docs commit before the
  batch 1 code)
- Deviations and rationale:
  - Case 83 types nothing on a roll page: StdPanel draws the result for the
    number field's first value (1) on open, so the offset is already
    deterministic.
  - Longest-name rows: only `#/homebrew/sets ~ long name as gm4` exists; the
    `/lists/<uuid>` and `/s/` long-name states are added by batch 9 and the
    editor's by batch 6, as section 14 says.
  - `HitNote.svelte` (touched for its size only) keeps its N1 `side-tab`
    finding: section 5, E2, places it in batch 9.
  - `ArtWell` stacks the glyph and the picture in one grid cell, not an
    absolute box: a positioned child painted over the card's inset focus
    ring (states case 31 failed).
  - `FilterBar` `.fpill` takes `line-height: 20px`: the 13 px step with the
    inherited 1.6 made a one-line pill 32.8 px (states case 5).
  - States case 74 pins the card text look at the new 13 px step.
  - PRODUCT.md also lost its stale "no backend", relative-path, GitHub Pages
    and `localStorage` lines (campsite: the file was being rewritten).
  - The capitals rule names the brand line and the account initial as marks.
- Outcomes the plan asked for:
  - Cyrillic in the package: Chrome rendered «Возвращающийся клинок» with the
    Cyrillic upright and italic woff2 alone; CDP `getPlatformFontsForNode`
    reports `Source-Sans-3-ExtraLight` and `-Italic`, custom font, 21 glyphs,
    no fallback.
  - Swords at 36 px on the art well reads as crossed swords (scratch render
    of all four glyphs); kept.
  - Alpha: 0 of 1193 `img/` and 0 of 1193 `img/thumb/` files have an alpha
    channel, so the glyph needs no hide on `load`.
  - Budget: 247.8 kB of 253 unconfigured; no raise.
  - Detector: 73 findings over `app/src` (was 130): `design-system-*`
    advisories (N3, batch 10), HitNote `side-tab` (E2, batch 9) and
    `orGrid.test.ts` `broken-image`; `git grep impeccable-disable -- app/src`
    and `git grep radial-gradient -- app/src` return nothing.
  - Impeccable polish and harden (context loaded; review of Seg, ArtWell,
    Badge, Shell footer, the ground against the built screenshots): no
    change needed. The pressed check keeps each switch's total width (one
    option is always pressed); forced colours keep the check where the inset
    border goes; the glyph is decorative and `aria-hidden`; the muted footer
    links and badges keep their measured contrast.
- Review: required (trigger: changed UI), report `issues/57/reviews/1.md`
  (fix-then-continue; one fix pass `1-fix`).

## Verification
- Commands run (exact) and results:
  - `node tests/run-all.js app/print,app/typo,app/hues,stub`: all passed
    (print 542.8 s, typo 166.3 s, hues 89.4 s, stub 12.0 s).
  - `node tests/run-all.js app/states,app/golden` (after the case 5, 31, 74
    and 83 fixes): all passed, states 888.3 s, golden four shards 537-658 s;
    no golden moved, so nothing was re-seeded.
  - `npm run check:built`: passed; budget 247.8 kB within 253.
  - `npm run lint:untyped`, `npm run lint:typed`: passed.
  - `node --test tools/artwork/lib.test.mjs`: 76 passed.
  - `node tools/artwork/cards.mjs --check`: `_share.jpg: ok`,
    `_share_en.jpg: ok`; with `tools/artwork/fonts/` emptied: "rendered no
    text", exit 1; restored.
  - `npx prettier --file-info` on `.impeccable/hook.cache.json`,
    `hook.pending.json`, `config.local.json`: `"ignored": true` each.
  - `impeccable detect --json --no-inline-ignores app/src`: 73 findings.
  - `npx vitest run` on artWell, record, tables, listsPage, artField, shell:
    367 passed.
  - `rtk npm run check:fast` (batch 1): 769 s, PASS, budget 247.8/253 kB.
    CI on `a07f3e3d` failed at `test:sw` (asset cap 60); the fix pass
    changes that test.
- First-screen offsets (case 83, top of the first `[data-primary]` /
  limit, RU then EN; all logged, none asserted yet):

  | Route | 360x640 | 1180x720 | Batch |
  |---|---|---|---|
  | `/roll/std` | 792, 718 / 256 | 552, 552 / 288 | 5 |
  | `/tables/eq_weapon` | 750, 683 | 570, 548 | 3 |
  | `/i/ci1` | 257 (over by 1), 220 | 214, 214 | 4 |
  | `/search` searched | 535, 469 | 463, 463 | 7 |
  | `/account` gm1 | 243, 220 | 214, 214 | 7 |
  | `/p/set-emberaxe` gm2 | 585, 533 | 354, 354 | P |
  | `/homebrew` gm3 | 721, 677 | 649, 649 | 6 |
  | `/homebrew/sets` long name gm4 | 524, 480 | 452, 452 | 6 |
  | `/homebrew/new` gm1 | 239, 239 | 233, 233 | 6 |
  | `/lists` gm1 | 528, 528 | 500, 500 | 8 |
  | `LIST_A` gm4 | 466, 466 | 422, 422 | 9 |
  | `/s/player-token-1` | 531, 531 | 525, 525 | 9 |

- Gates: check:built, the browser suites above, check:fast; CI on the push.

## Next batch (implement-ready)
- Name: batch 1b - the print glyph and the placeholder files
- Objective, scope, steps, acceptance: `plan.md` section 7, batch 1b (an
  outline; its dispatch refresh expands it with mock 1b).
- Verification commands: as the 1b line in `plan.md` section 8 names them.
- Risks / do-nots: public contract change (asset paths of `CONTRACTS.md`):
  fixtures, `tests/contracts.js`, `CONTRACTS.md` and `llms.txt` move in the
  same commit.

## Blockers
- None for batch 1b.

## Deferred
- R5 of `reviews/plan-1-3.md` (deferred-scope): `review.prompt.md` names a
  third look `<name>-2.md`, while `agent-guard.mjs` reads only
  `plan-<batch>-<n>.md`.
- The link-preview Worker's card images (`tools/share-card.mjs`).
- The EN `<title>`, manifest name and `en/index.html` wordmark.
- Uppercase controls outside the capitals rule are audited by their surface
  batches (15 components carry `text-transform: uppercase`).
- Monospace labels still outside the Key Characteristics rule, owed to their
  surface batches: `.batch-all` (BatchBar), `.ordiv i` (OrGrid), `.altcol`
  (TablesPage), the ListPage summary labels (`.lnote`, `.lroll`,
  `.batch-lbl`, `.money-l`), HelpButton, `.steps-l` (RecordCard).
- N6 of `reviews/1.md`: `PrintCard.svelte` keeps a literal `#0a0810` for its
  art block; `--art-well` names it. Batch 1b takes it.

## Notes
- Mocks path: `issues/57/mocks/<N>/`; batch 1 built screenshots in
  `issues/57/mocks/1/built/` (eleven route families, 360x640 and 1180x720,
  RU and EN, the viewport at scroll 0); the share cards are `og/_share.jpg`
  and `og/_share_en.jpg`.
- Screenshot findings: the face, the ramp, the neutral switches and the
  glyph well draw as mock 1; first-screen offsets as the table above.
- Cleanup performed / retained artifacts: `issues/57/mocks/measure.mjs`
  stays until closeout. Print evidence and the mock P worktree as before
  (`C:\Users\Ignat\.dhloot\notes\57\`).
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section):
  DESIGN.md (Overview, Colors, Typography, Layout, Shapes, Components, Do's
  and Don'ts); PRODUCT.md (Users, Positioning, Operating Context, Durable
  constraints); FEATURES.md "Chrome" and "Records"; META.md section 9 (asset
  cap 60); COVERAGE.md `app/states` row (case 83); `docs/artwork.md` "The
  site share cards"; `docs/decisions/2026-10-29-the-ui-font-is-source-sans-3-self-hosted.md`.
