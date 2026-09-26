# Handoff - TASK persist-3-realtime
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: planned; waits for R5, R5b and R11 to ship (roadmap
  section 9; R2 is live)
- Last agent: planner (2026-09-25, planning pass 1)
- NEEDS_HUMAN_CONFIRMATION: no - the owner answered Q1-Q3 as
  recommended on 2026-09-26 (`plan.md` section 13)
- Branch: `main` (planned on the worktree branch
  `worktree-agent-ae90a050b0e40090a` from `da7378cb`, brought onto `main`
  by the docs commit that integrated the plans made ahead)
- Base / starting commit: `da7378cb` (planning); the release starts on
  `main`
- Pushed: no

## Completed
- Batch name/id: planning pass 1 (no implementation batch yet)
- What shipped: `plan.md` (design sections 4-9, `B3.1` implement-ready
  after Q1, `B3.2` outline, closeout, questions); two decision files;
  the roadmap's R3 rows; `context.md` refreshed with the platform facts.
- Files changed: `issues/persist-3-realtime/{context,plan,handoff}.md`,
  `issues/persistent-storage/plan.md` (R3 rows and outline only),
  `docs/decisions/2026-09-25-realtime-is-the-primary-live-path-the-45.md`,
  `docs/decisions/2026-09-25-share-topics-use-topic-key-and-carry-only-a.md`,
  `docs/decisions/2026-09-24-realtime-ships-in-v1-directly-after-lists-over.md`
  (pointer line), `docs/DECISIONS.md` (regenerated)
- Previous sha (batch diff base): `da7378cb`
- Deviations and rationale: the roadmap's single `B3.1` is split into
  `B3.1` (database) and `B3.2` (client) - a commit the harness cannot
  reach (the client's E2E needs the migration on the test project).
- Review: not required (planning only)

## Verification
- Commands run (exact): `node tools/decisions.js`; `node tests/derived.js`
- Results: the decision index is current and `validate()` reports no
  problem. `node tests/derived.js` exits 1 in this worktree for a reason
  outside the task: the generated `i/`, `i/en/`, `en/index.html` and
  `pages/*.html` files are absent here (`node tools/build.js` was not
  run); its decisions section passes.
- Gates: planning only; no `npm run check` (no code changed)

## Next batch (implement-ready)
- Name: `B3.1` - the database half (`plan.md` section 10)
- Objective: broadcast triggers, `realtime.messages` policies, tolerant
  `reorder_list`, proven by layer 3 with WebSocket clients against a local
  stack that runs `realtime` and `kong`.
- In scope: `plan.md` section 10, "In scope" and the file table.
- Out of scope: every `app/` file (`B3.2`); hosted pushes.
- Files expected: `supabase/migrations/<ts>_realtime.sql`,
  `supabase/reversals/<ts>_realtime.sql`, `tests/db/run.mjs`,
  `tests/db/roles.mjs`, `tests/db/realtime.test.mjs`,
  `tests/db/reversibility.test.mjs`, `tests/db/apply-pending.test.mjs`,
  `tests/db/lists.test.mjs`, `docs/specs/FEATURES.md`,
  `docs/specs/COVERAGE.md`, `.claude/README.md`, `docs/decisions/`.
- Steps: `plan.md` section 10, steps 1-9 (step 1 is a measured spike).
- Acceptance criteria: `plan.md` section 10, "Acceptance" (includes the
  inherited R2 row R3 and R11's `realtime_rows_24h` line).
- Verification commands: `rtk npm run check` (Bash, one foreground call,
  timeout 600000); `npm run check:db` (PowerShell, alone, timeout 600000).
- Risks / do-nots: `plan.md` section 10, last paragraph; `private` is
  `true` in every `realtime.send`.
- Fallback (optional): step 1's two fallbacks (restart in place of reset;
  `gotrue` for a real token).
- Before starting: R5, R5b and R11 closed; the
  **[R2-refresh]** marks in `plan.md` re-read against `main` (the
  migration timestamp, `B2.3`'s shares migration as shipped).

## Blockers
- R5, R5b and R11 ship first (roadmap section 9). Q2 is an owner action
  after `B3.2` is live.

## Deferred
- Closing a hidden tab's channel after a minute (`plan.md` 6.4), only if
  the monthly check shows a peak above 150 connections.
- A live share panel on the owner's other device; Presence.

## Notes
- Mocks path: none - nothing new is drawn except a visually hidden status
  region (`plan.md` 6.5).
- Screenshot findings: none (no issue screenshots for this task).
- Cleanup performed / retained artifacts: none.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): the
  two decision files above; the roadmap's R3 rows.
