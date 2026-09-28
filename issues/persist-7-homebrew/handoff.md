# Handoff - TASK persist-7-homebrew
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: planned (pass 2, phase A: design level); waits on the
  owner's review of the mocks and `plan.md` section 9, then on phase B
  (the delta pass and `B7.1`'s implement-ready steps), then on the
  release order: R4 and R6 ship before R7
- Last agent: planner (2026-09-28, planning pass 2 phase A, on `main`)
- NEEDS_HUMAN_CONFIRMATION: yes - the mocks (`mocks/index.html`) and
  `Q1`-`Q8` of `plan.md` section 9; `Q1` and `Q2` are the two readings
  `context.md` names
- Branch: `main` (uncommitted; the orchestrator commits with R6's push)
- Base / starting commit: not started (`b38bc5ab` is the tree the pass read)
- Pushed: no

## Completed
- Batch name/id: none built. Planning: `plan.md` rewritten for the widened
  scope (the gap audit, the design of items 1-11 and 13, two releases and
  five batches with costs, eight owner questions, the decision texts and
  roadmap changes named for the report); `mocks/` (seventeen files and an
  index, each screen at 960 px and 360 px); `context.md` refreshed with
  the settled facts.
- What shipped: nothing to production.
- Files changed: `issues/persist-7-homebrew/{context,plan,handoff}.md`,
  `issues/persist-7-homebrew/mocks/*` (`mock.css` extended; `b72-homebrew.html`
  of pass 1 deleted, superseded by `m01`-`m17`).
- Previous sha (batch diff base): none
- Deviations and rationale: nothing outside `issues/persist-7-homebrew/`
  was edited (the dispatch's rule); the roadmap rows and the decision
  texts are in the planner's report for the orchestrator to apply after
  R6's push. Pass 1's `B7.1` implement-ready steps are gone from `plan.md`:
  the schema changed (three tables, the widened bound, the reference
  trigger, the event), so phase B writes them again.
- Review: not run (planning only). `plan.md` Status carries `Plan review:
  required before B7.1`.

## Verification
- Commands run (exact): `node -e` reads of `data.js` (field statistics,
  section 1 of `plan.md`); the browser pane over `mocks/*.html` at 360 px
  (Notes); `npx prettier --write "issues/persist-7-homebrew/mocks/*.html"`
  and `npx prettier --check "issues/persist-7-homebrew/**/*.{html,md}"`.
  No `npm run check`, no browser suite, no Supabase stack (the dispatch
  forbade them; another agent runs heavy gates on this tree).
- Results: the catalog statistics in `plan.md` section 1; the mock
  overflow check in Notes.
- Gates: none apply to a planning pass.

## Next batch (implement-ready)
- Name: none is implement-ready. The next dispatch is planning pass 2
  phase B (`plan.md` section 13), after the owner's answers; it expands
  `B7.1` - schema, ports, fake, pure logic (`plan.md` sections 4.1-4.3,
  4.7-4.9, 6 row `B7.1`, 7.1).
- Objective: -
- In scope: -
- Out of scope: -
- Files expected: -
- Steps: -
- Acceptance criteria: -
- Verification commands: -
- Risks / do-nots: `plan.md` section 12; one session per local stack and
  per test project (`CLAUDE.md`).
- Fallback (optional): -

## Blockers
- The owner's answers to `Q1`-`Q8` and the mock review (`plan.md` section
  9, `mocks/index.html`).
- Release order: R4 (`B4.2` in progress) and R6 ship before R7; phase B
  reads both as shipped (`plan.md` section 13, step 1).
- The roadmap and decision changes wait in `pending-apply.md` (the
  planner's report, saved by the orchestrator); phase B applies them,
  adjusted to the owner's answers, then deletes that file.

## Deferred
- Item 13 (books shared with other users, subscriptions, subcategories,
  roll tables per book) - a later release; `plan.md` 4.13 keeps the
  shapes open.
- A homebrew Trash (decision 30); art (R8); `#/h/<token>`, clone, print
  routes for cloud lists (R9); a set filter; `recall` on a homebrew
  record; a source cover; moving items between sources in bulk.

## Notes
- **Owner review pending (next session; owner, 2026-09-28: nothing in the
  R4/R6 session waits on it).** In order: (1) open
  `mocks/index.html` (m01-m17, 960 px and 360 px each); (2) answer `Q1`-`Q8`
  in `plan.md` section 9 - each has the planner's recommendation first; (3)
  skim the gap table, `plan.md` section 3 (G1-G38), and the release split,
  section 7 (R7: `B7.1`-`B7.3`, ~140 min; R7b `persist-7b-homebrew-files`:
  `B7b.1`-`B7b.2`, ~80 min); (4) the proposed decisions D1-D6 and roadmap
  changes in `pending-apply.md`. Then dispatch phase B with the answers.
- Mocks path: `issues/persist-7-homebrew/mocks/index.html` (m01-m17; open
  from disk; the pictures load from the repository's `img/`).
- Screenshot findings: no issue screenshots (no GitHub issue). The mocks
  compose the shipped screens (`RowMain`, `RecordCard`, `Panel`, `Field`,
  `Seg`, `Chip`, `Badge`, `AccountMenu`, `FilterBar`, R6's `BatchBar` and
  import panel as planned).
- Mock check (browser pane, 2026-09-28): every phone frame of m01-m17
  measured at 360 px - no element wider than its frame, the tab strip
  excepted (`overflow: hidden` by design, as in the app). `npx prettier
  --check "issues/persist-7-homebrew/**/*.{html,md}"` passes (the R4
  trap of literal `<uuid(101)>` text is escaped in the generator).
- Cleanup performed / retained artifacts: `mocks/b72-homebrew.html`
  deleted (pass 1's frames are replaced by m01-m17).
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): none
  (the dispatch limited writes to this directory; `plan.md` section 10
  and 11 name what the orchestrator applies).
