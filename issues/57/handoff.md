# Handoff - TASK 57
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (wave 1 is on `main`; batch 3 is committed on `claude/57`,
  waiting for the orchestrator's `polish` and `harden` and the batch review)
- Last agent: implementer (batch 3, resumed 2026-11-03)
- NEEDS_HUMAN_CONFIRMATION: no (Q3-S answered: the strip goes; Q3-T takes its default)
- Branch: `claude/57` (worktree `.claude/worktrees/57`)
- Base / starting commit: `f150d7fd` (the batch 3 plan refresh, on top of the merge
  `51370bf8` of `origin/main` `d83384b4`)
- Pushed: yes, the batch 3 commit, with this handoff; its sha is in the implementer's
  report (`git log -1 --grep="Task: 57"`).

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
- Previous sha (batch diff base): `f150d7fd`; a reviewer reads `git diff f150d7fd HEAD`.
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
  | `polish` and `harden` outcome | Not run: the orchestrator's, after this commit |
  | Gates pass and CI green on the tip | Local gates pass; CI is the orchestrator's wait |

- Q3-S (owner, `context.md`): the catalog's per-section «Выбрать все (N)» strip is
  removed; the bar's «Все» is the one select-all control there. `/search` and
  `/s/` keep their strip until batches 7 and 9 (`ontoggleall`).
- Deviations and rationale:
  1. `data-primary` sits on the table column, section heads included, not on each
     `TableRows`: the first section head is where the table starts.
  2. The bar keeps «Добавить в список»: batch 4 owns «В список».
  3. `hiddenTags` returns a fourth flag, `core`.
  4. The bar draws no «Все» on a page that registers no rows (`/homebrew`, lists).
  5. The mid-band head cap in `sweep.js` is 140 px, not 110: measured 130 px.
     `FEATURES.md` says the same.
  6. Added at S15: the evidence showed the picker cut to «О...» at 360 RU. The
     picker is `--t-section`, the picker row's view switch has 6 px side padding
     and «Ещё» 10 px, so «Оружие» reads whole, as in the mock.
- Review: required (trigger: new or changed UI; `tests/app/` and a public contract
  reader changed), report `issues/57/reviews/3.md`, after `polish` and `harden`.
- Plan review: not required for batch 3 (`plan.md` Status, no trigger fired).

## Verification
- Batch 2 and its fix pass: exact lines in `git show 65829261:issues/57/handoff.md`.
- First-screen offsets after batch 3 (case 83, RU, EN; these two rows are asserted):

  | Route | 360x640 | 1180x720 | Limit |
  |---|---|---|---|
  | `/tables/eq_weapon` | 234, 234 | 250, 250 | 256 / 288 |
  | `/tables/eq_weapon` two filters | 252, 252 | 250, 250 | 256 / 288 |

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

- Evidence: `issues/57/mocks/3/built/`, 36 PNG files, 360, 768 and 1180, RU and EN
  (`node issues/57/mocks/3/built/shoot.js`): no sideways overflow in any state;
  the selection bar is 149 px at 360 and 69 px at 1180.
- Commands on the final tree (2026-11-03):
  - `npx vitest run app/src`: 4451 passed, 0 failed (no coverage: the per-file coverage step of `check:fast` has not run).
  - `npm run lint:typed`, `npm run lint:untyped`: exit 0.
  - `npm run check:built`: exit 0, 252.4 of 253 kB.
  - `npm run build:test`, then `rtk node tests/run-all.js app/contracts,app/states`:
    all suites passed in 603 s.
  - `rtk node tests/app/sweep.js 360`: clean (RU, EN).
  - `node tools/decisions.js`: 299 decisions.
  - `node tools/check/run.mjs --only=typecheck,test:golden`: 0 errors, 0 warnings.
  - `rtk npm run check:fast`: exit 0, run last on this tree. Two earlier runs stopped
    at Prettier on the mock F files, which the orchestrator then formatted.
- Goldens were not compared again after the picker CSS: a golden is accessibility-tree
  text, and that change is CSS only (`--t-section`, side padding), so it moves no golden.
- Before the strip removal (2026-10-30, not re-run, not touched by it):
  `node tests/run-all.js contracts,dataint,derived`, `app/typo`, `app/hues`,
  `app/print`, `stub`, `node tests/app/sweep.js 768`, `node tools/decisions.js`:
  all pass.
- `node tests/app/golden.js --update --shard=n/4`, n = 1 to 4: exit 0, 89, 89, 89,
  88 states. `git diff --stat tests/app/snapshots` read: 154 modified, 4 deleted, 9
  new; only `tables`, `search`, `s`, `lists`, `homebrew`, `account`. The `lists`,
  `homebrew` and `s` lines are the row's tags after the name and the bar.
- Detector, `impeccable detect --json --no-inline-ignores app/src`: 69 findings (72
  on 2026-10-30); in touched files only `design-system-*` advisories (`AddToList`,
  `FilterBar`, `TableRows`, `tokens.css`), which batch 10 records.
  `git grep -n impeccable-disable -- app/src`: nothing.
- Spelling scan over added lines and new files: only `aria-labelledby`.

## Next batch (implement-ready)
- Name: not an implementer batch yet. The orchestrator runs `polish` and `harden`
  on the changed surfaces (`plan.md` section 10, "Impeccable"), then the batch 3
  review; batch 4 needs its planner refresh after that.
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
- Mocks path: `issues/57/mocks/<N>/`; batch 3's evidence is `issues/57/mocks/3/built/`.
- Planner defaults D1-D13 of batch 3: `plan.md` section 10, "Decisions of this refresh".
- The owner answered the feedback (`context.md`, "Feedback answers", "Header batch"). Next
  steps: the orchestrator's `polish` and `harden`, the batch 3 review, then the batch 3b
  refresh.
- Cleanup performed / retained artifacts: `plan.md` Status collapsed the two
  "findings applied" sub-bullet lists and the earlier-refresh bullets (the file
  was at the 150 KB line); the last pre-collapse commit is `65829261`
  (`git log --oneline -3 -- issues/57/`: `65829261`, `30de6bf5`, `da7a3354`).
  `issues/57/mocks/measure.mjs` stays until closeout. Print evidence and the
  mock P worktree stay at `C:\Users\Ignat\.dhloot\notes\57\`.
- Session end partial progress (if any): none
- Durable items written to their homes this batch: `FEATURES.md`, `ROUTES.md`,
  `COVERAGE.md`, `STATE.md`, `DESIGN.md`, the decision file named under Completed.
