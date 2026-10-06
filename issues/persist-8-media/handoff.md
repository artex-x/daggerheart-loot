# Handoff - TASK persist-8-media
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: planned; waiting for R9's closeout, the owner's step 1
  (`plan.md` 9.1) and the plan review before `B8.1`
- Last agent: planner
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: main (planning only; no code)
- Base / starting commit: `d82e3e1f` plus R7d's uncommitted working tree
- Pushed: no

## Completed
- Batch name/id: planning pass 1 (2026-10-02), with the owner's answers of
  the same day applied
- What shipped: `context.md`, `plan.md`, `mocks/` (index, m40-m45). No
  production code.
- Files changed: `issues/persist-8-media/**` only.
- Previous sha (batch diff base): not applicable (no task commit yet).
- Deviations and rationale: the roadmap's absolute URL in `Record_.img`
  becomes the stored name (plan 3.2); decision 40's Edge Function stays and
  CI deploys it with two project-scoped tokens, plus an agent wrapper for
  the test project (owner's Q8-1 B and follow-ups, plan 3.9); the roadmap's
  single batch `B8.1` is split by the schema batch rule (plan 7); the bucket
  admits JPEG beside WebP (owner's Q8-2 A); pictures per account are the
  item limit + 5 (owner's Q8-4).
- Review: required (trigger: storage bucket and policies, definer functions,
  file deletion, a new write protocol, an Edge Function, two CI steps, a hook
  change, CI secrets); plan review before `B8.1`.

## Verification
- Commands run (exact): none (planning). Mock sizes measured by the
  generator: every page under 88 000 URL-encoded characters; m41 opened in
  the Browser pane.
- Results: not applicable.
- Gates: none.

## Next batch (implement-ready)
- Name: `B8.1` - storage, schema, ports, the Edge Function and the backup
  copy (`plan.md` 7.3), after R9's closeout, the owner's step 1 and the plan
  review.
- Objective: the `homebrew-art` bucket and policies, `homebrew_items.art`,
  the snapshot and projection changes, the `delete_account()` refusal, the
  `delete-account` Edge Function with its CI deploy steps and the
  `functions:deploy` wrapper and hook rule, `MediaPort`, the homebrew port's
  art calls, the fake, contract case Q, layer 3 cases, the nightly backup
  copy.
- In scope: `plan.md` 3.1-3.3, 3.6 (backup), 3.9, 7.3.
- Out of scope: every screen and string, the export change, privacy text
  (`B8.2`).
- Files expected: `plan.md` 7.3, "Files".
- Steps: `plan.md` 7.3, steps 1-10 with 8a.
- Acceptance criteria: `plan.md` 7.3, "Acceptance".
- Verification commands: `npm run check:db` (PowerShell tool),
  `rtk npm run check` (timeout 600000), `npm run build:test`,
  `npm run check:built`; after the approve
  `npm run db:push -- --project test`,
  `npm run functions:deploy -- --project test`, `npm run e2e`.
- Risks / do-nots: `plan.md` 7.3, "Do not"; section 10.
- Fallback (optional): none.

## Blockers
- Blocked by the rework merged into R7h (`issues/persist-7h-homebrew-page/plan.md` section 7) (owner feedback 2026-10-02: share items by id, live add with a change log or a fixed copy, no snapshots). Do not dispatch before that task decides.
- R9 closes first (owner's order); B8.1 extends R9's `get_shared_homebrew`.
- Owner step 1 (`plan.md` 9.1) before B8.1's test deploy: the test-scoped
  token as the repository secret `SUPABASE_ACCESS_TOKEN_TEST` and in
  `.env.test.local`.
- Owner steps 2-3 before the release push: the production-scoped token as
  `SUPABASE_ACCESS_TOKEN` and `SUPABASE_SECRET_KEY_PROD`, both in the
  Environment `production`; step 4 after the push (one backup dispatch).

## Deferred
- Pictures for sources and cards; pictures in the data zip; a WebP encoder
  for Safari (`plan.md` section 10).

## Notes
- Mocks path: `issues/persist-8-media/mocks/index.html`.
- Screenshot findings: none (no issue screenshots).
- Cleanup performed / retained artifacts: the mock generator lives in the
  planner's scratchpad, not in the repository.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): none;
  each batch writes its own (`plan.md` 7.3 steps 8a and 9, 7.4).
