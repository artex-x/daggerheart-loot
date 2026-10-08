# Handoff - TASK homebrew-followups
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: blocked (B1 waits for #71 on `main`; the plan review of B2 is a
  fix-then-continue whose findings are applied, so `agent-guard.mjs` allows the dispatch)
- Last agent: planner (third pass, 2026-10-08, the plan review's findings applied)
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `claude/homebrew-followups` (worktree `.claude/worktrees/homebrew-followups`)
- Base / starting commit: `3a899d52` (origin/main, holds R7h)
- Pushed: no

## Completed
- Batch name/id: none (planning only).
- What shipped: `issues/homebrew-followups/context.md`, `plan.md`, `handoff.md`,
  `mocks/index.html`.
- Files changed: those four; no code, no commit.
- Previous sha (batch diff base): `3a899d52`.
- Deviations and rationale: none.
- Review: required (trigger: a migration and a SECURITY DEFINER function, a public contract
  change, possible loss of stored data), report issues/homebrew-followups/reviews/plan-B2.md
  (Verdict: fix-then-continue; its twelve findings applied once, plan.md Status).

## Verification
- Commands run (exact): read-only `git grep`, `node -e` over `data.json`, reads of
  `agent-guard.mjs`.
- Results: only aa2, aa5, aa21 and aa50 carry a GM note; every catalog equipment facet value is
  answered; aa11's `rud` uses «Зерцала» once; `agent-guard.mjs` loops over every required batch
  and does not compare it with the batch dispatched.
- Gates: none run (no code changed).

## Next batch (implement-ready)
- Name: B1 - Offer rule on every page, one-notice panel, Arazo data (once #71 is on `main`);
  then B2 - Official items in an own set or rule card.
- Objective: plan.md, "B1", Objective.
- In scope: plan.md, "B1", In scope.
- Out of scope: item 1 (B2); search kind chips; roll panels; any address grammar; route
  fixtures.
- Files expected: plan.md, "B1", Files.
- Steps: plan.md, "B1", Steps 1-11.
- Acceptance criteria: plan.md, "B1", Acceptance criteria 1-13.
- Verification commands: plan.md, "B1", Verification commands.
- Risks / do-nots: plan.md, "B1", Risks and do-nots.
- Fallback (optional): if #71 is not on `main` when B1 starts, stop (step 1).

## Blockers
- #71 on `main` before B1.

## Deferred
- Option B of Q1 (a share link carries the GM's card on an official entry): no data change.

## Notes
- Mocks path: `issues/homebrew-followups/mocks/index.html` (B2; static, grounded in the Sets
  tab markup and tokens).
- Screenshot findings: none supplied.
- Cleanup performed / retained artifacts: none.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): none yet; B1 writes the
  owner rules to `FEATURES.md` ("Tables and search", "The change log") and `I18N.md` ("Rules");
  B2 writes Q1 = A to `FEATURES.md` ("Homebrew", "Cards"); three decision files in all.
- Owner answers 2026-10-08: Q1 = A; item 1 stays in this task.
- Item 5 choice: «Волшебное Зеркало» (plan.md, "Items 4 and 5").
- Item 2 choice: the tables keep a picked value offered (their addresses read as today); the
  share link keeps #71's rule 4 (plan.md, "Item 2").
