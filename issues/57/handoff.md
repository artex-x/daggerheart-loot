# Handoff - TASK 57
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (wave 1 is on `main`; batch 3 is implement-ready)
- Last agent: planner (the batch 3 dispatch refresh, 2026-10-30)
- NEEDS_HUMAN_CONFIRMATION: no (the owner is away; Q3-S and Q3-T of `plan.md`
  section 13 take their defaults)
- Branch: `claude/57` (worktree `.claude/worktrees/57`)
- Base / starting commit: `65829261` (batch 2 fix pass), merged with `origin/main`
  `d83384b4` (the wave 1 squash) by `51370bf8` (`-s ours`: the trees were equal)
- Pushed: yes, the merge `51370bf8`; the refresh commit `docs(57): refresh the
  plan for batch 3` is pushed with it.

## Completed
- Batch 1 - foundation: `9a31aede`, review fix `80872b35` (`reviews/1.md`).
- Batch 1b - no-picture placeholder retired: `fce4a9f8`, merge `3e5f6301`
  (`reviews/1b.md`, approve, no finding).
- Batch 2 - shell, the vault-die mark, American spelling: `30de6bf5`, fix pass
  `65829261` (`reviews/2.md`, approve). Deviations: a manual polish and harden
  pass in place of the Impeccable skill (2-R1; section 10 of `plan.md` now names
  the orchestrator-run fallback); the spelling sweep ran through a one-off
  script; the brand row at 360 uses tighter spacing; the supplements menu is
  right-aligned; the C34 and A15 live-site toast check moved to the
  post-release review.
- Wave 1 - batches 1, 1b, 2 squashed onto `main` as `d83384b4` (2026-10-30);
  `claude/57` merged it back as `51370bf8`.
- Previous sha (batch diff base): the head of the refresh commit
  `docs(57): refresh the plan for batch 3`; a reviewer reads `git diff <it> HEAD`.
- Review: not applicable to this planning pass. Batch 3 will need one (trigger:
  new or changed UI; `tests/app/` and a public contract reader changed).
- Plan review: not required for batch 3 (`plan.md` Status, no trigger fired).

## Verification
- Batch 2 and its fix pass (condensed, exact lines in `git show 65829261:issues/57/handoff.md`):
  `rtk npm run check:fast` PASS on the final tree; `npm run check:db` PASS (third
  run); `npm run check:built` pass, 249.8 of 253 kB; `node tests/app/sweep.js 360`,
  `768` and `1180` clean (RU, EN); hook selftest 1865 passed; detector 71
  findings (74 allowed), none new in a touched file; CI run 40986280172 of
  `30de6bf5` found the anchor offsets (fixed by `65829261`).
- First-screen offsets after batch 2 (case 83, RU, EN; logged, not asserted).
  Baseline for batch 3 (its rows are `/tables/eq_weapon`, 748 / 681 at 360 and
  526 / 504 at 1180):

  | Route | 360x640 | 1180x720 | Batch |
  |---|---|---|---|
  | `/roll/std` | 843, 769 | 561, 561 | 5 |
  | `/tables/eq_weapon` | 748, 681 | 526, 504 | 3 |
  | `/i/ci1` | 255, 218 | 170, 170 | 4 |
  | `/search` searched | 533, 467 | 419, 419 | 7 |
  | `/account` gm1 | 241, 218 | 170, 170 | 7 |
  | `/p/set-emberaxe` gm2 | 583, 531 | 310, 310 | P |
  | `/homebrew` gm3 | 719, 675 | 604, 604 | 6 |
  | `/homebrew/sets` long name gm4 | 522, 478 | 408, 408 | 6 |
  | `/homebrew/new` gm1 | 237, 237 | 189, 189 | 6 |
  | `/lists` gm1 | 526, 526 | 455, 455 | 8 |
  | `LIST_A` gm4 | 464, 464 | 377, 377 | 9 |
  | `/s/player-token-1` | 529, 529 | 481, 481 | 9 |

- Evidence: `issues/57/mocks/2/built/`; mock 3 and its renders: `issues/57/mocks/3/`.
- This pass ran no gate (no app code). `git merge -s ours origin/main` was run
  after `git fetch` and an empty `git diff --stat 65829261 origin/main`.

## Next batch (implement-ready)
- Name: Batch 3 - catalog tables and filters (first batch of wave 2). The full
  brief is `plan.md` section 10: objective, decisions D1-D13, in and out of scope,
  files per step, constraints from the mock, steps S1-S15, the Impeccable step,
  acceptance, first-screen rows, goldens and new states, DESIGN.md rules,
  verification, risks, the four standing checks and the gate cost.
- Objective: the catalog in direction R - list head, filter column and sheet,
  neutral «Все», selection mode and the one selection bar, two-level navigation,
  «Об этих данных», two-column grid, search highlight, the empty-state plate.
- Steps (titles; detail in section 10): S1 viewport port; S2 strings, icons,
  help; S3 pure logic (`chosenLabels`, `rowTags`, `highlightRanges`,
  `pickerLabel`); S4 `Chip` neutral; S5 `Sheet`; S6 selection mode, `SelectionBar`,
  `SelBar`, `TableRows` ticks; S7 `FilterPanel`; S8 `TableNav`; S9 `TablesPage`,
  `PageHead`, `Empty`, `SectionHead`; S10 rows, tiles, highlight; S11 browser
  suites and goldens; S12 specs and the decision file; S13 Impeccable; S14
  gates; S15 screenshots and handoff.
- Dispatch: merge `origin/main` first; the tier follows the writer tests of
  section 8 (test 3 holds). Steps S1-S15 let a fresh implementer resume from
  the progress line below.
- Verification commands: `plan.md` section 10, "Verification" (vitest while
  editing, both lints, `rtk npm run check:fast`, `node tools/build.js`,
  `node tools/decisions.js`, `npm run check:built`, `npm run build:test` then
  `node tests/run-all.js app/contracts,app/states,app/typo,app/hues,app/print,contracts,dataint,derived,stub`,
  `node tests/app/sweep.js 360` and `768`, the four golden `--update` shards,
  the detector, the spelling grep).
- Risks / do-nots: no `routes.json` value or address changes; `FilterBar` and
  `BatchBar` stay for batches 6, 8 and 9; no gold selection, no one-side accent;
  no third breakpoint (only 760 and 1000); no column table, no per-section
  select (D5, D6); a golden is re-seeded, never edited.
- Fallback (Impeccable `polish` and `harden`): the orchestrator runs them after
  the implementer's commit; if it cannot, the implementer does a manual pass
  with the skill's reference files (`plan.md` section 10, "Impeccable") and
  records it as a deviation.

## Blockers
- None.

## Deferred
- 2-R1 (answered for batch 3 on): the orchestrator-run `polish` and `harden`
  of section 10, "Impeccable". The batch 2 shell components still had a manual
  pass only; the post-release Impeccable audit is the backstop (with the C34 and
  A15 live-site toast check).
- 2-R3 (batch 10 audit): from 761 px the header draws brand, jobs, language,
  account while the DOM order is brand, language, account, jobs (WCAG 2.4.3).
  Recommended: name the trade-off in DESIGN.md "Navigation", "Header", and let
  the audit decide.
- 2-N5 (batch 5): `SECTION_LABEL['roll/alt']` is `alt` «Альт. таблицы», so the
  `/roll/alt` tab title and its `/account` start-section option differ from the
  heading «Альтернативные таблицы». Fix: `'roll/alt': 'pageAlt'` and re-seed the
  `/roll/alt` and `/account` goldens; `alt` stays for the tables group chip.
- 2-N6 (batch 10): DESIGN.md "The Same Label Rule" and FEATURES.md "Chrome" say
  "until their page's batch moves them"; batch 10's lock removes it.
- R5 of `reviews/plan-1-3.md` (deferred-scope): `review.prompt.md` names a third
  look `<name>-2.md`, while `agent-guard.mjs` reads only `plan-<batch>-<n>.md`.
- Batch 3 candidate: the 1180 px equipment column table of mock 3 (D6, Q3-T), if
  the owner says yes; one added item with its own mock check.
- N0-2 of `reviews/mocks-2.md` (batch 4): the error-page pattern's circled icon
  is a template shape; keep the heading, the cause and the action.
- The Account page's Display note and its default-view wording (batch 7, mock
  3's C57 answer); `KeepNote.svelte` leaves with batch P.
- `FilterBar.svelte`, `BatchBar.svelte`, `anyValue` and the shared page's
  `.fpill` reader in `tests/app/contracts.js` leave with their last callers
  (batches 6, 8, 9).
- The link-preview Worker's card images (`tools/share-card.mjs`).
- The EN `<title>`, manifest name and `en/index.html` wordmark.
- Uppercase controls outside the capitals rule are audited by their surface
  batches (15 components carry `text-transform: uppercase`).
- Monospace labels still outside the Key Characteristics rule, owed to their
  surface batches: `.batch-all` (BatchBar), `.ordiv i` (OrGrid), `.altcol`
  (TablesPage), the ListPage summary labels (`.lnote`, `.lroll`, `.batch-lbl`,
  `.money-l`), HelpButton, `.steps-l` (RecordCard).

## Notes
- Mocks path: `issues/57/mocks/<N>/`; batch 3's evidence goes to
  `issues/57/mocks/3/built/` (360, 1180, RU and EN, plus 768 for the mid band).
- Planner defaults taken with the owner away (for the orchestrator's owner-AFK
  decisions log, `plan.md` section 10): D1 a `viewport` port with 760 and 1000
  px bands (the filter column from 1000, the sheet below); D2 a new
  `FilterPanel`, `FilterBar` stays for batches 6 and 9; D3 `SelBar` draws
  through a new `SelectionBar` for tables, search and the shared page, `BatchBar`
  stays for 6, 8, 9; D4 the selection mode is `app.selecting`, only the catalog
  hides the ticks; D5 «Все» ticks every drawn row, the per-section strip goes
  (Q3-S); D6 no equipment column table (Q3-T); D7 a native-`<dialog>` `Sheet`;
  D8 «Ещё» is a `Menu` popover; D9 a filter link that arrives does not open the
  sheet; D10 the picker reads «<Book> · Предметы» where the sub-label alone is
  ambiguous; D11 the tile's kind dot becomes a kind badge on mixed tables only;
  D12 `Empty` draws the plate for every caller (CSS only) and the glyph tile on
  request; D13 `CHIP_SHORT` and `Chip`'s `short` prop go. Also: the empty-state
  cause names no table noun (a Russian genitive per table), so it departs from
  the mock's wording with the same facts.
- Mock 3 re-check (2026-10-30): the mock stands; its page names the count line
  twice (own line at 360, and "shares its line with «Выбрать»"); the first
  reading is final (`plan.md` section 10, "Constraints").
- Cleanup performed / retained artifacts: `plan.md` Status collapsed the two
  "findings applied" sub-bullet lists and the earlier-refresh bullets (the file
  was at the 150 KB line); the last pre-collapse commit is `65829261`
  (`git log --oneline -3 -- issues/57/`: `65829261`, `30de6bf5`, `da7a3354`).
  `issues/57/mocks/measure.mjs` stays until closeout. Print evidence and the
  mock P worktree stay at `C:\Users\Ignat\.dhloot\notes\57\`.
- Session end partial progress (if any): none.
- Durable items written to their homes this pass: none (a planning pass writes
  no durable file; batch 3's S12 writes `FEATURES.md`, `ROUTES.md`, `COVERAGE.md`,
  `STATE.md`, `DESIGN.md` and a decision file).
