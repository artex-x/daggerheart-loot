# Handoff - TASK readme-screens
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (planned, not started)
- Last agent: planner
- NEEDS_HUMAN_CONFIRMATION: no (owner accepted the recommended Q1-Q4, 2026-11-07)
- Branch: `claude/readme-screens`
- Base / starting commit: `62070925`
- Pushed: no

## Completed
- Batch name/id: plan
- What shipped: `issues/readme-screens/context.md`, `plan.md`, `handoff.md`.
- Files changed: the three files above. No production code.
- Previous sha (batch diff base): `62070925`
- Deviations and rationale: none.
- Review: not required (no trigger fired; plan review not declared)

## Verification
- Commands run (exact): none; the plan changes no code.
- Gates: none.

## Next batch (implement-ready)
- Name: B1
- Objective: one command makes 8 README screenshots; both READMEs show them.
- In scope: plan.md D1-D5 and the B1 acceptance list.
- Out of scope: promotional banners; screenshots for other documents; a CI
  capture; a change to `gm1`-`gm4`.
- Files expected: `app/src/ports/fake-cloud-seed.ts`,
  `app/src/ports/fake-cloud.test.ts`, `tools/screens.mjs`,
  `tools/screens.lib.mjs`, `tools/screens.lib.test.mjs`,
  `tools/check/lib.mjs`, `package.json`, `docs/img/screens/*.webp`,
  `README.md`, `README.ru.md`, `docs/specs/COVERAGE.md`, `.claude/README.md`,
  a new file under `docs/decisions/`, `docs/DECISIONS.md`.
- Steps: plan.md, "Design" D1 to D5, in that order.
- Acceptance criteria: plan.md, "Batch B1 - acceptance", items 1-9.
- Verification commands: `rtk npm run check:fast` (timeout 600000);
  `npm run screens` twice (the second prints `unchanged` 8 times);
  `node --test tools/screens.lib.test.mjs`; push, then the CI credit.
- Risks / do-nots: pass a native path to `serveDist`; do not edit `gm1`-`gm4`;
  do not commit images before the owner looks at them; the build guard fails
  after `npm run check` moves data mtimes - rebuild first.
- Fallback: if a `gm5` homebrew picture cannot match its item, drop the
  homebrew entry from the list and say so in the handoff.

## Blockers
- None.

## Deferred
- A screen of the homebrew editor for a future guide document.
