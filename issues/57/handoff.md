# Handoff - TASK 57
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (wave 1 is on `main`; batch 3 and its one remediation pass are
  on `claude/57`; `polish`, `harden` and the batch review are done; CI of the tip is the
  orchestrator's wait)
- Last agent: implementer (batch 3 fix pass, 2026-11-04)
- NEEDS_HUMAN_CONFIRMATION: no (Q3-S answered: the strip goes; Q3-T takes its default)
- Branch: `claude/57` (worktree `.claude/worktrees/57`)
- Base / starting commit: `f150d7fd` (the batch 3 plan refresh, on top of the merge
  `51370bf8` of `origin/main` `d83384b4`)
- Pushed: yes, the fix commit, with this handoff; its sha is in the implementer's report
  (`git log -1 --grep="Task: 57"`).

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
- Batch 3 - catalog tables and filters: the list head, the filter column and
  sheet, the neutral «Все», the selection mode and the one bar, two-level
  navigation, «Об этих данных», the two-column grid, the search highlight and
  the empty-state plate. New: `viewport` port, `Sheet`, `SelectionBar`,
  `FilterPanel`, `TableNav`, `rowTags.ts`, the decision file
  `2026-10-30-list-pages-share-one-head-and-one-selection-bar.md`.
- Batch 3 fix pass (`reviews/3.md`, verdict fix-then-continue): B1-B5, R1-R7, N1-N6, N8,
  polish and harden items 1-3, and the CI coverage failure of `ef44bb5d`. Files changed:
  `rowTags.ts`, `tables.ts`, `icons.ts`, `dict.ts`, `help.ts`, `TablesPage`, `TableNav`,
  `SelectionBar`, `SelBar`, `FilterPanel`, `RowMain`, `Sheet`, `KeepNote` (comment),
  their tests, `tests/app/states.js` (cases 84, 85), `tests/app/contracts.js` (comment),
  `FEATURES.md`, `COVERAGE.md`, 30 goldens.
- Previous sha (fix pass diff base): `ef44bb5d`; batch 3's own base was `f150d7fd`.
- Acceptance lines of `plan.md` section 10:

  | Line | Outcome |
  |---|---|
  | List head at 360 and from 761 px, filter column from 1000 px, `h1` always | Done: `tables.test.ts`, goldens, `sweep.js 360` |
  | «Выбрать» opens the mode, «Снять выделение» leaves it, focus both ways | Done: `tables.test.ts`, `selectionBar.test.ts` |
  | The bar: «Все», summary, actions, clear last, zero ticks | Done, with deviation 2 below. C12 closed: `--selbar-h` scroll padding, 0 covered focus stops at 360 and 1180 |
  | Filter row «Все» neutral, picked value gold, no `любое` | Done: `filterPanel.test.ts`, `chip.test.ts` (axe) |
  | Count line | Done: goldens `~ two filters`, `app/states` |
  | Filter sheet | Done: `filterPanel.test.ts`, `sheet.test.ts`, three sheet goldens |
  | Labeled table, filter and section links; none on `homebrew` | Done: `tables.test.ts` |
  | Navigation labeled at both levels; three taps through the picker | Done: `tableNav.test.ts`, `tables.test.ts` |
  | «Об этих данных», three notes | Done: `help.test.ts` |
  | View switch «Список» / «Сетка», no note | Done; `KeepNote` draws only on `/p/` |
  | Rows, `rowTags`, highlight (P1, A40, C59) | Done: `rowTags.test.ts`, `search.test.ts`, goldens |
  | Grid (C56, C58, P15, D11) | Done: `tables.test.ts`, evidence `catalog-grid` |
  | Empty state (D12) | Done: `tables.test.ts`, evidence `catalog-nothing` |
  | Correct at 360, 390, 768, 1180 | 360 re-run on the final tree; 768 clean on 2026-10-30, 390 and 1180 are CI's |
  | `routes.json` unchanged, `app/contracts` passes | Done |
  | Each new state has an entry, a golden and an axe case | Done: nine new goldens, four retired |
  | Inherited: N1 and N3 hold; 2-R1; 2-N5 and 2-N6 | N1, N3 hold (no "labelled" in `DESIGN.md`, `FEATURES.md`); 2-R1 answered by the orchestrator's run; 2-N5, 2-N6 stay deferred to batches 5 and 10 |
  | `FIRST_SCREEN` rows `shipped: true`; DESIGN rules; detector; spelling; screenshots | Done, see Verification |
  | `polish` and `harden` outcome | Run by the orchestrator; items 1-3 fixed as `reviews/3.md` amended them, item 4 replaced by R2 |
  | Gates pass and CI green on the tip | Local gates pass; CI of the fix commit is the orchestrator's wait |

- Q3-S (owner, `context.md`): the catalog's per-section «Выбрать все (N)» strip is
  removed; the bar's «Все» is the one select-all control there. `/search` and
  `/s/` keep their strip until batches 7 and 9 (`ontoggleall`).
- Deviations and rationale:
  1. `data-primary` sits on the table column, section heads included, not on each
     `TableRows`: the first section head is where the table starts. Accepted, and
     load-bearing: the first row itself starts near 270 and 288 at 360, past the 256 limit.
  2. The bar keeps «Добавить в список»: batch 4 owns «В список». Accepted under the interim
     rule. Plan lines 947 and 1242 stay unmet in batch 3, so batch 4's refresh gives the
     bar's label its own acceptance line.
  3. `hiddenTags` returns a fourth flag, `core`.
  4. The bar draws no «Все» on a page that registers no rows (`/homebrew`, lists).
  5. The mid-band head cap in `sweep.js` is 140 px, not 110: measured 130 px.
     `FEATURES.md` says the same.
  6. Added at S15: the picker CSS. Accepted as CSS, but it did not close the defect: B4
     did, in the fix pass (deviation 7).
  7. B4, named departure from mock 3 and from the review's option: the picker is two lines
     at `--t-small`, the book in `--muted` over the table (`pickerParts`). Reason: the
     review's two lines at `--t-body` were built and measured, and 8 of 18 RU captions still
     cut («Расходники» and «Environments» broke inside the word in 80 px). The row now
     leaves 94 px (gap 4 px, «Ещё» padding 7 px). No caption cuts at 360 in RU or EN, and the
     offset stays 234. Accepted: the only visible page name below 761 px is 14 px, not 20.
  8. R5, departure from plan section 10, standing check 1: no `max-height: 45dvh` and no
     scroll. Measured 189 px at 640x360 against a cap of 162. A scroll would clip the add
     menu, so below 481 px of height the actions share one line. Case 85 holds it.
  9. R7: the search row stays across the page above the column, not in the rows column as
     in mock 3 (offset 244 against 269). From 1000 px the row draws the count alone.
  10. R6: the 300-item row's fixture draws 199 rows in its first source tab, because
     `fillItems` spreads the items over the sources. The test asserts that tab.
- CI of `ef44bb5d` failed on coverage only: `KeepNote.svelte` branches 50%, because batch 3
  removed its table caller and left the no-cloud branch unreached. Fixed with a test in
  `printPage.test.ts`; no threshold changed. `check:fast` missed it because it measures
  coverage only on changed sources (`--coverage.include`, `tools/check/fast.mjs`), and
  `KeepNote.svelte` was not changed: a file that loses reach through its caller shows only
  in CI's whole run.
- Review: done, `issues/57/reviews/3.md`, verdict fix-then-continue; the one remediation
  pass is this commit. No second review is needed: the picker fix leaves the first-screen
  rows unmoved (234 at 360).
- Plan review: not required for batch 3 (`plan.md` Status, no trigger fired).

## Verification
- Batch 2 and its fix pass: exact lines in `git show 65829261:issues/57/handoff.md`.
- First-screen offsets after batch 3 (case 83, RU, EN; these two rows are asserted):

  | Route | 360x640 | 1180x720 | Limit |
  |---|---|---|---|
  | `/tables/eq_weapon` | 234, 234 | 244, 244 | 256 / 288 |
  | `/tables/eq_weapon` two filters | 252, 252 | 244, 244 | 256 / 288 |

  The other routes, measured after batch 2 and logged only (360 RU, EN; 1180 RU, EN):

  | Route | 360x640 | 1180x720 | Batch |
  |---|---|---|---|
  | `/roll/std` | 843, 769 | 561, 561 | 5 |
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

- Evidence: `issues/57/mocks/3/built/`, 360, 768 and 1180, RU and EN
  (`node issues/57/mocks/3/built/shoot.js`), with `picker-*` and `catalog-alt` at 360 added.
- Fix pass, confirmed in the built app of `ef44bb5d` before the fix (one puppeteer probe):
  B5 53 px of the column and 38 px of the last chip under the bar at 1180x720; R1 focus on
  `body` after the link and the pin; R2 sheet and menu reopen on return, focus on `body`,
  while the picker does not reopen (`TableNav` remounts); R3 focus on `body`; R4 «Нет
  совпадений с «»». The same probe on the fixed build: each is gone.
- Failing direction: a detached worktree at `ef44bb5d` with the new tests: 14 failed, 132
  passed (`tables`, `selectionBar`, `rowTags`). B5 and R5 are CSS: cases 84, 85 of `app/states`.
- Commands on the fix pass (2026-11-04):
  - `npm run build:test`, then `node tests/app/golden.js --update --shard=n/4`, n = 1 to 4,
    one at a time: exit 0, 89, 89, 89, 88 states. 30 goldens moved: the alternate tables, idle
    `/s/`, the wide search row's values, «Выбрать» on empty tables. `~ searched` did not move.
  - `rtk node tests/run-all.js app/contracts,app/states,app/typo,app/hues,app/print,contracts,dataint,derived,stub`: all suites passed in 797 s.
  - `rtk node tests/app/sweep.js 360`: clean (RU, EN); `rtk node tests/app/sweep.js 768`: clean (RU, EN).
  - `npx vitest run app/src/components app/src/lib/rowTags.test.ts app/src/lib/tables.test.ts`:
    1646 passed, 1 stale count assertion, fixed; `homebrewCatalog.test.ts` re-run in `check:fast`.
  - `npm run lint:typed`, `npm run lint:untyped`: exit 0.
  - `rtk npm run check:fast`: exit 0 on the final tree, 2726 tests with coverage, within the 253 kB budget.
- Not run locally in the fix pass (the orchestrator dropped them; CI covers them):
  `sweep.js` at 390 and 1180, `npm run check:built` (the `check:fast` budget step runs the
  bundle budget).
- Detector, `impeccable detect --json --no-inline-ignores app/src`: 69 findings (72
  on 2026-10-30); in touched files only `design-system-*` advisories (`AddToList`,
  `FilterBar`, `TableRows`, `tokens.css`), which batch 10 records.
  `git grep -n impeccable-disable -- app/src`: nothing.
- Spelling scan over added lines and new files: only `aria-labelledby`.

## Next batch (implement-ready)
- Name: batch 3b (the hide-and-show header), after its refresh; batch 4 follows. Batch 4's
  refresh adds an acceptance line for the bar's label (deviation 2).
- Risks / do-nots: `FilterBar` and `BatchBar` stay for batches 6, 8 and 9; a golden
  is re-seeded, never edited.

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
- Impeccable `polish` and `harden` (orchestrator, 2026-11-03, on `ef44bb5d`): outcomes are
  under Completed and in `reviews/3.md`. Clean: `Sheet` focus, scrim and Escape; `viewport`
  listener cleanup.
- Mocks path: `issues/57/mocks/<N>/`; batch 3's evidence is `issues/57/mocks/3/built/`.
- Planner defaults D1-D13 of batch 3: `plan.md` section 10, "Decisions of this refresh".
- The owner answered the feedback (`context.md`, "Feedback answers", "Header batch"). Next
  step: the batch 3b refresh.
- Cleanup performed / retained artifacts: `plan.md` Status collapsed the two
  "findings applied" sub-bullet lists and the earlier-refresh bullets (the file
  was at the 150 KB line); the last pre-collapse commit is `65829261`
  (`git log --oneline -3 -- issues/57/`: `65829261`, `30de6bf5`, `da7a3354`).
  `issues/57/mocks/measure.mjs` stays until closeout. Print evidence and the
  mock P worktree stay at `C:\Users\Ignat\.dhloot\notes\57\`.
- Session end partial progress (if any): none
- Durable items written to their homes this batch: `FEATURES.md`, `ROUTES.md`,
  `COVERAGE.md`, `STATE.md`, `DESIGN.md`, the decision file named under Completed.
