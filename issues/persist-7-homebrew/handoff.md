# Handoff - TASK persist-7-homebrew
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: blocked - `B7.1` is implement-ready; it waits for the plan
  review's second look (`reviews/plan-B7.1-2.md`) and for
  `limits-follow-overrides` to commit
- Last agent: planner (2026-09-30, planning pass 4, on `main`)
- NEEDS_HUMAN_CONFIRMATION: no - every owner question is answered
  (`Q14` = A; the catalog `craft` becomes a list, `plan.md` 7.3 `B7c.1`).
- Branch: `main` (uncommitted; the orchestrator commits)
- Base / starting commit: not started (`7005abeb` is the tree pass 4 read)
- Pushed: no

## Completed
- Batch name/id: none built. Planning pass 4 (phase B): every owner answer
  applied (`plan.md` section 9); four releases R7, R7b, R7c, R7d (`Q6`,
  section 7, each cut's criterion named, about 430 minutes of gates in
  all); `B7.1` expanded (section 14); `my_limit()` for the counter. After
  pass 4, the owner's answers: `Q14` = A (the budgets step per batch to 250
  / 190 kB; the decision text waits for `B7.2`, plan section 10), and the
  catalog `craft` becomes a list in a new `B7c.1` (a public contract change
  with its own review; pass 4's `B7c.1`-`B7c.3` are `B7c.2`-`B7c.4`); D1 and
  D10 revised in place (titles unchanged, so `docs/DECISIONS.md` stays
  current). The plan review before `B7.1` (fix-then-continue) is applied
  in one text pass: both blockers, R1-R3, every local nit and nit 11 in
  `B7c.1` (`plan.md` section 13, item 6; register `reviews.md`); D4, D8
  and the 2026-09-25 item-shape mirror line revised, titles unchanged.
- What shipped: nothing to production.
- Files changed: `issues/persist-7-homebrew/{plan,handoff,context}.md`;
  `issues/persist-7-homebrew/pending-apply.md` deleted (its roadmap lines
  are `plan.md` section 11); `issues/persist-7-homebrew/mocks/*.html`
  (regenerated: m02, m22 and m09's reused rows lose the draft mark, m17
  one sentence, the index a note; every mock drops the unused
  `.badge.draft` style rule); `docs/decisions/` - ten new files (`plan.md`
  section 10), five older files with mirror lines (two dated 2026-09-25,
  three dated 2026-09-26; two of those rewrapped to stay within fifteen
  lines); `docs/DECISIONS.md` (generated).
- Previous sha (batch diff base): none
- Deviations and rationale: the dispatch named m02 and m22; the generator
  shares the draft rows with m09 and one sentence with m17, so they changed
  too (the draft mark is gone everywhere). The other answers that override
  the approved mocks (`Q3`, `Q4`, `Q5`, `Q6`) are a constraint table in
  `plan.md` section 8, not mock edits.
- Review: required (trigger: a migration with SECURITY DEFINER functions, a
  stored-data change, a new write path, a public contract change in B7.2),
  report issues/persist-7-homebrew/reviews/plan-B7.1.md (fix-then-continue;
  applied, the second look is `plan-B7.1-2.md`)

## Verification
- Commands run (exact): `node gen.mjs E:/dev/daggerheart-loot/issues/persist-7-homebrew/mocks`
  and `npx prettier --write "issues/persist-7-homebrew/mocks/*.html"` before
  the edit (no file changed: the generator reproduces the committed mocks),
  then after `edit-q12.mjs` (both in the session scratchpad); `git grep -n -i
  -E "черновик|badge draft|draft =" -- issues/persist-7-homebrew/mocks/`;
  `node tools/decisions.js`; `node -e` over `tools/decisions.js`'s
  `validate(readAll())`; `npx prettier --check` over `plan.md` and the
  decision files.
- Results: the grep finds nothing; `validate()` reports no problem; the
  index lists 182 decisions; prettier passes.
- Gates: none apply to a planning pass. No `npm run check`, browser suite,
  build or Supabase stack (the dispatch forbade them).

## Next batch (implement-ready)
- Name: `B7.1` - schema, ports and pure logic (R7). Full text: `plan.md`
  section 14.
- Objective: the database, the port and the pure logic of R7's homebrew
  items; no component, store, page or golden changes.
- In scope: the migration and its reversal (two tables, validators, the
  snapshot formula, triggers, the `list_entries` checks and the
  reference-exists trigger, `my_limit`, the two share functions);
  `docs/fixtures/homebrew/`; `lib/homebrew.ts`; `HomebrewRepository` in the
  real adapter, the lazy wrapper and the fake with its seed; contract case
  M; layer 3 suites; the usage report's items counts; `COVERAGE.md`; the
  restore runbook's keys.
- Out of scope: the store, `withRecords`, components, routes (`B7.2`); the
  list resolver and seeded list entries (`B7.3`); cards and relations
  (R7c); files (R7d).
- Files expected: `plan.md` section 14, "Files".
- Steps: `plan.md` section 14, steps 1-19.
- Acceptance criteria: `plan.md` section 14, including three inherited
  lines (F1's grep; R6's `const before` rename; the runbook's keys).
- Verification commands: `rtk npm run check` (one foreground call,
  timeout 600000); `npm run check:db` through the PowerShell tool; after
  the review's approve, `npm run db:push -- --project test` then `npm run
  e2e`.
- Risks / do-nots: `plan.md` section 14, "Risks and do-nots", and section
  12; one session per local stack and per test project (`CLAUDE.md`).
- Fallback (optional): the name of R2's column check (`plan.md` section
  14, "Fallback").

## Blockers
- The plan review's second look: `reviews/plan-B7.1.md` reads
  fix-then-continue and its fixes are applied; `agent-guard.mjs` denies the
  implementer until a `reviews/plan-B7.1-<n>.md` reads "Verdict: approve".
  The second look covers `plan.md` section 13, item 6's steps.
- Coordination: task `limits-follow-overrides` is being implemented on
  this working tree now (seen 2026-09-30: uncommitted edits to specs, tests,
  `llms.txt`, `schema/import-v1.json` and the new
  `supabase/migrations/20260930120000_import_lists_ceiling.sql`). `B7.1`
  starts after that task commits (one session per working tree), takes a
  later migration timestamp and rebases its edits of
  `tests/db/import-lists.test.mjs`, `tests/db/limits.test.mjs`,
  `cloud.contract.ts`, `fake-cloud.ts` and `.claude/README.md` on it.

## Deferred
- Item 13 (books shared with other users); a Trash; art (R8); item links
  (R9); a set filter; `recall` on a homebrew record; a source cover; bulk
  moves between sources; price and quantity in the quick item panel;
  `DEBT.md` D64 and D66 stay with the owner.

## Notes
- For the orchestrator: apply the roadmap changes in `plan.md` section 11
  to `issues/persistent-storage/plan.md` (the planner does not write it).
  At R7's closeout, move the R7b-R7d parts of this plan into
  `issues/persist-7b-homebrew-catalog/` (`plan.md` section 7.5) and write
  D7 from section 4.13.
- For the orchestrator: the `limits-follow-overrides` `B1` step 14 adds a
  mirror line to `docs/decisions/2026-09-26-the-list-file-import-v1-is-a-strict-json-schema.md`,
  which already holds fifteen lines; that batch must rewrap the file.
  `2026-09-26-import-validation-...` keeps one free line for its other
  mirror.
- Mocks path: `issues/persist-7-homebrew/mocks/index.html` (m01-m22,
  approved 2026-09-30); the overrides table is `plan.md` section 8. The
  generator and the edit script are in the session scratchpad
  (`context.md`, "Facts settled by planning pass 3"); the pre-edit copy is
  `gen.pre-q12.mjs` beside it.
- Screenshot findings: no issue screenshots (no GitHub issue).
- Cleanup performed / retained artifacts: no check pages were made in this
  pass; the scratchpad keeps `gen.mjs`, `gen.pre-q12.mjs`, `edit-q12.mjs`.
  The 360 px overflow check of pass 3 was not rerun: m02 and m22 lost rows
  and a banner and gained no wider element.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): the ten
  decisions under `docs/decisions/` and the four mirror lines (`plan.md`
  section 10).
