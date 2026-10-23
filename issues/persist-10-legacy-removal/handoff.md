# Handoff - TASK persist-10-legacy-removal
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: blocked (planned and refreshed; dispatchable from 2026-10-26, 00:00 UTC)
- Last agent: planner
- NEEDS_HUMAN_CONFIRMATION: yes, Q2 only (plan.md section 4): accept
  D115's changed verify criterion (A, recommended) or keep the original
  line and take the RPC (B). It blocks `B10.4` alone; `B10.1`-`B10.3` can
  run. Q1 answered by the owner 2026-10-01 (B); the P6 fork settled by the
  planner 2026-10-23.
- Branch: `claude/persist-10-legacy-removal` (worktree
  `.claude/worktrees/persist-10-legacy-removal`)
- Base / starting commit: `0b73fd5c` (`origin/main`, 2026-10-23)
- Pushed: the refreshed task documents only (this commit); no R10 code

## Completed
- Batch name/id: none. Planning pass 1 (2026-10-01, `46cf7c04`); pass 2,
  the dispatch refresh (2026-10-23, this commit).
- What shipped: `context.md`, `plan.md` and this file, refreshed against
  `0b73fd5c`.
- Files changed: the three task documents.
- Previous sha (batch diff base): `0b73fd5c`
- Deviations and rationale (pass 2 against pass 1):
  - Five batches, not four: `B10.4` is carry P6 (D115, the first read takes
    heads); the migration moved to `B10.5`, the last batch, so the test
    project window before the landing is one CI run (plan.md section 13).
  - P6 settled as a PostgREST head read with entry identities, not an
    `account_heads()` RPC (plan.md section 4); D115's "How to verify"
    gets one changed clause in `B10.4`.
  - P36 placed in `B10.3` as its own acceptance line.
  - `B10.1` ports the shared page's `#/l/` coverage to `#/s/` (unit cases,
    states case 77, two sweep rows) instead of deleting it; it adds
    `app/src/test/seed.ts` (`seedWith`), which `B10.2` reuses.
  - `B10.1` fixes `AppState.pageRecordFor` (its account-list branch read
    `openList`, which only a browser list sets).
  - The route kind is `listRetired` (beside `printRetired`), not `retired`.
  - Gates follow the push-every-batch model: `check:fast` locally, CI as
    the full gate, a local golden re-seed and the edited browser suites.
  - D64 goes whole in `B10.3` (`debt-cleanup` fixed its «Выйти» half).
- Review: plan review required before B10.1 (trigger: public contract
  change; a migration that drops a SECURITY DEFINER function and a column;
  a new sync protocol), report
  `issues/persist-10-legacy-removal/reviews/plan-B10.1.md`: fix-then-continue,
  every finding applied (plan.md Status, "Plan review findings applied");
  R7 became the owner question Q2.

## Verification
- Commands run (exact): read-only `git grep` and `git log` over `app/src`,
  `tests`, `supabase`, `tools`, `docs/specs`, `docs/decisions`,
  `llms.txt`, the READMEs, `.claude/`; the inventory grep of plan.md
  section 6, item 2.
- Results: plan.md sections 1 and 6.
- Gates: none run (planning; the commit holds only `issues/` documents).

## Next batch (implement-ready)
- Name: B10.1 - retire `#/l/`
- Objective: an old `#/l/` link draws the not-found page with its address
  kept; nothing reads, writes or documents the list link format; the
  shared page's tests run on `#/s/` share links.
- In scope: plan.md section 9.
- Out of scope: browser lists, the move, the notices, the date gates,
  `?today=`, the tab bar, the first read, the database.
- Files expected: plan.md section 9, "Files deleted", "Files created",
  "Files edited".
- Steps: plan.md section 9, steps 1-15.
- Acceptance criteria: plan.md section 9, "Acceptance criteria".
- Verification commands:
  ```text
  npm run build:test
  node tests/run-all.js app/contracts,app/states
  node tests/app/golden.js --update --shard=1/4        # then 2/4, 3/4, 4/4
  git status -- tests/app/snapshots
  node tests/app/sweep.js 360
  node tests/run-all.js contracts,dataint
  rtk npm run check:fast                               # Bash timeout 600000
  git push -u origin claude/persist-10-legacy-removal  # after git fetch origin and git merge origin/main
  ```
- Risks / do-nots: plan.md section 9, "Risks and do-nots". Step 1 confirms
  the date and merges `origin/main`.
- Fallback (optional): none.

## Blockers
- Date: R10 is dispatched on or after 2026-10-26 (00:00 UTC,
  `LEGACY_WRITE_UNTIL`).
- Plan review before `B10.1` (`agent-guard.mjs` denies the implementer
  dispatch until it approves or its fix-then-continue is applied).
- Q2 (owner) before `B10.4` (plan.md section 4).
- Order for `B10.5`: it starts only on a tree where `git grep -n
  legacy_fingerprint -- app/src tests/app tests/e2e tools` prints nothing;
  it is pushed only when `gh run list --workflow ci.yml --status
  in_progress` and `--status queued` show no run of another branch, and no
  other session pushes until `main`'s run after the squash is green; the
  closeout follows its CI credit; a stalled window is closed by the stall
  rule (plan.md section 13, "Order").

## Deferred
- A clean-up of `StoragePort`'s keyed `onExternalChange` signal: named to
  the owner at closeout, not built.
- The decision files: `B10.3`, `B10.4` and `B10.5` write them (plan.md
  sections 11-13).

## Notes
- Mocks path: none (no new UI; the not-found page exists).
- Screenshot findings: none.
- Cleanup performed / retained artifacts: the pass-1 text is in `46cf7c04`.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): none;
  each batch writes its own (plan.md section 7).
