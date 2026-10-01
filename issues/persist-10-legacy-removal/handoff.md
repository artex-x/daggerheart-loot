# Handoff - TASK persist-10-legacy-removal
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: blocked (planned; not dispatchable before 2026-10-26)
- Last agent: planner
- NEEDS_HUMAN_CONFIRMATION: no (Q1 answered by the owner 2026-10-01: B -
  `B10.4` drops `move_legacy_list`, the `dhloot.move` guard,
  `lists.legacy_fingerprint` and its index; plan.md section 4)
- Branch: main (the release branch is chosen at dispatch)
- Base / starting commit: to be set at dispatch (planned against
  `930dc986`; the plan itself is in `46cf7c04`)
- Pushed: the plan only, in `46cf7c04`; no R10 code

## Completed
- Batch name/id: none (planning pass 1, 2026-10-01).
- What shipped: `issues/persist-10-legacy-removal/context.md`, `plan.md`,
  this file; the roadmap rows for `debt-cleanup` and R10's batches in
  `issues/persistent-storage/plan.md` section 9 (owner, 2026-10-01).
- Files changed: the four above.
- Previous sha (batch diff base): -
- Deviations and rationale: the roadmap named one batch `B10.1`; the plan
  has four (plan.md section 8 gives each split criterion). The roadmap's
  "states cases 13, 17, 22" are list page cases today, so `B10.2` ports
  them to account lists instead of deleting them.
- Review: plan review required before B10.1 (trigger: public contract
  change; a migration that drops a SECURITY DEFINER function and a
  column), report
  `issues/persist-10-legacy-removal/reviews/plan-B10.1.md`

## Verification
- Commands run (exact): read-only greps (`git grep`) over `app/src`,
  `tests`, `supabase`, `docs/specs`, `llms.txt`, the READMEs; no gate run.
- Results: the inventory is in context.md, "Key paths", and plan.md
  section 1.
- Gates: none (planning).

## Next batch (implement-ready)
- Name: B10.1 - retire `#/l/`
- Objective: an old `#/l/` link draws the not-found page with its address
  kept; nothing reads, writes or documents the list link format.
- In scope: plan.md section 9 (the codec, `Env.compress`, the `#/l/`
  pages, buttons and address rewriting, the `retired` route kind, the
  contract fixtures and suites, the specs and READMEs).
- Out of scope: browser lists, the move, the notices, the date gates,
  `?today=`, the tab bar, the database.
- Files expected: plan.md section 9, "Files deleted" and "Files edited".
- Steps: plan.md section 9, steps 1-15.
- Acceptance criteria: plan.md section 9, "Acceptance criteria".
- Verification commands:
  ```text
  rtk npm run check                                    # Bash timeout 600000
  node tests/run-all.js contracts,dataint
  npm run build:test
  node tests/run-all.js app/contracts,app/states
  node tests/app/golden.js --shard=1/4                 # compare, then 2/4, 3/4, 4/4
  node tests/app/golden.js --update --shard=1/4        # then 2/4, 3/4, 4/4
  node tests/app/sweep.js 360
  npm run check:built
  rtk npm run check                                    # after any fix, before the commit
  ```
- Risks / do-nots: plan.md section 9, "Risks and do-nots". Before
  anything: the dispatch refresh (plan.md section 6) - confirm the date
  passed, re-run the inventory grep, re-measure the gate costs.
- Fallback (optional): none.

## Blockers
- Date: R10 is dispatched only on or after 2026-10-26, after R7c, R7d, R8,
  R9, `debt-cleanup` and `persist-review`.
- Order constraint for `B10.4` (Q1 B): it starts only after `B10.3` left no
  client file that names `legacy_fingerprint`, and R10 reaches production
  as one push holding both (plan.md section 12, "Order").

## Deferred
- D64's «Выйти» half, D66 and D61: `debt-cleanup` (owner, 2026-10-01).
- The Q1 decision file: `B10.4` writes it from plan.md section 4,
  "Decision for `B10.4` to write".

## Notes
- Mocks path: none (no new UI; the not-found page exists).
- Screenshot findings: none.
- Cleanup performed / retained artifacts: none.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): none
  yet; decision files are written by `B10.3` and `B10.4` (plan.md section 3,
  item 10).
