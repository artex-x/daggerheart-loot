# Task 57 - Fewer batches: the merge options for the rest of wave 3

This note answers the owner's question of 2026-11-05 ("we have too many batches, maybe it would be worth merging some
of them"). It gives the fixed cost of one batch, the overlap of every pair of the batches left, five options with their
cost and risk, and one recommendation. The owner decides; nothing here changes `plan.md` until the owner answers. The
rule it applies is `CLAUDE.md`, "Task and session protocol": size a batch by its gates; merge work that shares a
component, seed and filter; split only at a public-contract change, a different route and filter set, or a commit the
harness cannot reach; a plan names the criterion behind every split and states its total gate cost.

## The batches left

| Batch | What it does, in plain words | Own cost (min) | Goldens | Source |
|---|---|---|---|---|
| 9b | The list page panels (running now) | - | 70-100 | `plan-9b.md` |
| T | Bigger touch targets on phones (40 px), toasts that stay longer | 95-130 | none | `plan-T.md` (75-100) plus its review (20-30) |
| N | One order for the page head (heading, sibling pills, pin, help, action) from 761 px; the d12 die marks | 115-150 | about 145 | `plan-N.md` (review included) |
| D | No dashed borders except "drop here"; the empty plate 16 px under the row above; a short lead on one line | 100-140 | 6 headers only | `plan-D.md` (review included) |
| P | Print: the card's text, face, size and the `/p/` page | 95-125 | print states | `plan.md` sections 8 and 15 (75-95) plus its review |
| 10 | The docs lock: DESIGN.md notes, the detector at zero, the re-audit, `rollNo` (P5) with its plan review, the reviewer-probe prompt | 65-85 | none | `plan.md` section 8 (45-55 with P5's code) plus its review |
| Tail | The wave 3 squash, the wave 3 blind review, the whole-app blind review, their fixes, the closeout | 77-94 | - | `plan.md` section 8 (12-14 and 65-80) |

`plan-P.md` does not exist yet (2026-11-05); P's figures are `plan.md`'s outline.

## The fixed cost of one batch

What a batch pays whatever its size, from the repository's own tables (`.claude/README.md`, "Batch size and the fixed
cost of a run"; `plan.md` section 8; the briefs' gate costs):

| Gate | Minutes | Source |
|---|---|---|
| Dispatch and the refresh check of the brief | 5-10 | estimate; not measured in the repository |
| `rtk npm run check:fast` with `VITEST_MAX_WORKERS=2` | 12-14 | 744 s measured at batch 8's remediation (`plan.md` section 8) |
| One CI run | 10.5-11.5 | runs 39563712504 and 39599556984 (`.claude/README.md`) |
| The batch review | 20-30 | `plan-N.md`, "Gate cost" |
| One review fix cycle (a second `check:fast` and CI run) | 22-26 | `plan.md` section 8 |
| `polish` and `harden` (the orchestrator) | 5-10 | every brief |
| Both lints, `check:built`, the detector | 4-5 | every brief |
| The screenshot set's setup (`build:test`, the shoot script) | 5-8 | `plan.md` section 8 |
| A golden re-seed run, when the batch moves goldens (`build:test`, four shards, the diff read) | 15-30 | `plan.md` section 8, `plan-N.md` |

A merge of two batches saves one row of each, except the review, which grows: about 75-105 min saved per merge
without goldens, minus 10-15 min of extra review time. It saves one CI cycle pair (the run and the fix run) too.

## Pairs: what they share

"Conflict risk" is the risk that the second batch re-opens a rule the first just wrote, or that one red gate blocks
both halves of a merge. "Review size" is the merged batch's source files and moved goldens; the largest batches this
task has reviewed in one pass were 7b (about 15 vitest files, 70-120 goldens) and 9b (about 30 files, 70-100 goldens).
A review of more than about 40 source files and 150 goldens has no precedent here, so this note treats it as past one
pass (`CLAUDE.md`'s "a review that cannot be held in one pass").

| Pair | Shared files | Shared routes and goldens | Conflict risk | Merged review size |
|---|---|---|---|---|
| T + D | `tokens.css`, `PageHead`, `ListPage`, `SharedListPage`, `TableRows`, `MarkupField`, `TablesPage`, `ListsPage`, `HomebrewCards`, `states.js`, DESIGN.md, FEATURES.md, COVERAGE.md (13) | every route; neither moves a golden tree (T none, D six headers); both run the same gates (browser cases, the sweep, no re-seed) | low: different selectors in the same files; both are CSS rules of the whole system | about 45 files, 6 goldens: within precedent |
| N + D | `PageHead` (N restructures it, D caps its lead), `TablesPage`, `HomebrewPage`, `states.js`, DESIGN.md, FEATURES.md (6) | N: roll, `/tables/*`, `/homebrew` from 761 px; D: plates and GM rows on five route families. Both move the 1180 first-screen rows of `/homebrew` (D: -22 px) | medium: adjacent rules in `PageHead`; two re-measures of the same rows if separate | about 40 files, 151 goldens: at the edge |
| T + N | `PageHead`, `Chip`, `Seg`, `RollPage`, `ModeRow`, `AltPanel`, `TablesPage`, `Shell`, `sweep.js`, `states.js`, the three docs (13) | different bands: T up to 600 px, N from 761 px | medium: the same components under different media queries | about 60 files, 145 goldens: past one pass |
| T + D + N | the union of the above | every route, every band | high: one red gate blocks three rule sets | about 65 files, 151 goldens: past one pass |
| P + 10 | DESIGN.md; 10 re-audits P's tree | P: `/p/` and the print card; 10: the whole app | medium: the re-audit's findings land in P's batch; P5 needs its own plan review | P's print files, the regenerated record stubs of P5, the review prompt |
| D + P | `PageTitle` (D caps the lead; `/p/` uses it) | none in goldens; the print card keeps its dash | low | not useful: no shared gate |
| N + P, T + P | none of note (T's rule is the base of P's bar, so P follows T) | none | low | not useful |

## The options

All totals add the tail (77-94 min). "Wall clock" adds 5-10 min of dispatch per batch to the gate minutes; the owner's
answer times are not counted.

| Option | Batches after 9b | Gate minutes | Wall clock | CI cycles (run and fix run) | Reviews | Review risk |
|---|---|---|---|---|---|---|
| A. Keep all | T, N, D, P, 10 | 547-724 | 9.5-12.9 h | 10 | 5 | low: each review is in precedent |
| **B. T+D (recommended)** | TD, N, P, 10 | 480-629 | 8.3-11.1 h | 8 | 4 | low: TD has many files and almost no goldens |
| C. T+D and P+10 | TD, N, P10 | 445-589 | 7.7-10.3 h | 6 | 3 | medium: P's print review also holds the docs lock, P5 and a prompt change |
| D. N+D | T, ND, P, 10 | 480-629 | 8.3-11.1 h | 8 | 4 | medium: N's review was already the largest; D adds five route families |
| E. T+D+N | TDN, P, 10 | 407-544 | 7.0-9.6 h | 6 | 3 | high: past one review pass; one red run blocks three rule sets |

How the merged rows are counted: TD = T 95-130 plus D's own work 38-51 minus the gates they share (lints, detector,
`polish`, `harden`, `build:test`, shot setup: 15-21) plus 10-15 of review growth = 128-175. ND = N 115-150 plus the same
D share plus N's second re-measure saved = 148-195. P10 = P 95-125 plus 10's work 20-30 plus 10-15 of review growth =
125-170. TDN = TD plus N minus N's fixed cost (dispatch, `check:fast`, CI, the fix cycle, `polish`, `harden`, lints,
shot setup: 64-84) and N's own review (20-30), plus 20-30 of review growth = about 170-240. These are ranges of
estimates added end to end; the difference between two options is firmer than either total.

### In plain words, for the choice

- **A. Keep all.** Five more batches, each small enough to check in one sitting. The slowest path: about 10 to 13 hours
  of machine time.
- **B. Join T and D (recommended).** The touch-target and toast work and the dashes, gaps and lead work are both
  "house rules" that apply on every page and move no saved test pictures, so one batch checks both with one test run
  and one review. Saves about one hour. The head-order batch (N), print (P) and the docs lock (10) stay apart.
- **C. B, and join print with the docs lock.** Saves about 35 more minutes, but the print batch, which needs the owner's
  print checks and the Figma comparison, would also carry the final cleanup and a change to the review instructions;
  if print fails a check, the finish waits too.
- **D. Join N and D instead.** Same time as B, but the head-order batch is already the biggest one; adding D's pages
  makes its review the largest of the task.
- **E. Join T, D and N.** The fastest on paper (about 2.5 hours less than A), but one batch would touch about 65 files
  and 150 test pictures; if anything fails, all three wait, and one review cannot hold it.

## Recommendation

**Option B: merge D into T; keep N, P and 10 as they are.** T and D share 13 files, both apply to every route, neither
moves a golden tree, and they run the same gates, so `CLAUDE.md`'s merge rule asks for one batch; it saves one CI cycle
pair and one review (about 67-95 min). The trade-off accepted: the TD review holds about 45 files across every route
(more files than 9b, far fewer goldens), and one red CI run blocks both rule sets; N's measured `/homebrew` offset at
1180 moves by about 22 px before N runs (N's first step re-measures it anyway). Option C saves 35 more minutes but puts
the docs lock behind print's owner checks; that is not worth it.

The order becomes 9b, TD, N, P, 10, then the tail.

## The splits that remain in option B, and the criterion of each

| Split | Criterion (`CLAUDE.md`, "Task and session protocol") |
|---|---|
| 9b / TD | 9b is in flight; TD has its own route set (every route up to 600 px and every plate state) with its own re-baseline of every `FIRST_SCREEN` row at 360, which 9b's list review cannot hold (`plan.md` section 7, row T) |
| TD / N | a different route and filter set (the nine roll pages, `/tables/*` and `/homebrew` from 761 px) with its own about 145 goldens; merged, the review passes one pass (table above) |
| N / P | a product law and its own gates: the print card size and fit (`CLAUDE.md`, "Product laws"), `app/print`, the Figma parity, and the burden export through the owner's Chrome, a step the harness cannot reach |
| P / 10 | 10 re-audits the final tree, so it follows the last code; it carries the review-prompt change (a review trigger) and P5's own plan review |

Total gate cost of option B: 480-629 min (8.0-10.5 h of gates, 8.3-11.1 h with dispatch).

## Placed items

- Owner item 13 (dashes, the plate gap): batch D, `plan-D.md` (D-1 to D-5, D-7, D-8). In option B, inside TD.
- Owner item 14 (the lead wraps early on `/search`): batch D, `plan-D.md` D-6, case 113 (owner, via the orchestrator,
  2026-11-05: "can we ask the D planner to take a look at it as well?"). Why D and not N or 9b: the fix is one CSS cap on
  `.page-sub` in `PageHead` and `PageTitle` (`PageTitle` is not N's), its check is a width-and-lines case of the same
  shape as D's plate case, and it moves no golden. 9b is in flight and does not open `PageHead`. N edits `PageHead`'s
  margins (`plan-N.md` N-D8) but not its cap; it keeps D's 120ch when it moves the lead (fold line in `plan-D.md`).
  Items 13 and 14 are both width, spacing and border rules of the page surface with no golden: a point for merging D
  with T (the same kind of batch), not with N (a markup change with 145 goldens).
- Batch 9b's dashed GM note (`plan-9b.md` M14), already in the working tree: let 9b ship it; D turns it solid (one
  line). Stopping the running implementer for one line costs more than the line.
- For batch 10: `.impeccable/design.json` draws the unique tag dashed; batch 10's `document` run regenerates it
  (`plan-D.md`, fold list 2).

## If the owner picks another option

- A: `plan-D.md` as written (after N; cases 112 and 113).
- C: as B, and `plan.md` section 15 gains batch 10's lines; P's refresh writes the plan-review line for P5.
- D: `plan-N.md` takes D's steps after its S9; D's cases become 112 and 113 inside N; N's review frame names D's routes.
- E: one brief from `plan-T.md`, `plan-D.md` and `plan-N.md`; cases 108-113; one review.
