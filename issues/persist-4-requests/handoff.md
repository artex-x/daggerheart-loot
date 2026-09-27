# Handoff - TASK persist-4-requests
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: blocked (planned; `B4.1` is implement-ready and waits for R3's closeout push; the plan review returned fix-then-continue, planning pass 3 answered it (`reviews.md`), and the second look `reviews/plan-B4.1-2.md` runs next)
- Last agent: planner
- NEEDS_HUMAN_CONFIRMATION: no - plan section 13: question 1 answered 2026-09-26; question 2 answered 2026-09-27 (A: the Display row is a select at every width); item 3, the requester's status, decided by the planner from the owner's feedback of 2026-09-27 (removed - the owner's first suggestion)
- Branch: the planning worktree's branch (pass 2)
- Base / starting commit: `1cbca5f7` (R3's `B3.1` on `origin/main` `288ca549`)
- Pushed: no

## Completed
- Planning pass 3 (2026-09-27): the fixes for `reviews/plan-B4.1.md` -
  a client-made request id with a replay, apply by `list_id` +
  `item_key` locked in `id` order with no `entry_id`, the position
  renumber after an apply, pinned grants and function flags, `by` null
  on insert, housekeeping just before the insert, the concurrency case,
  the restore runbook line, accepted risks in 14, the B4.2 notes, the
  roadmap's R4 lines; register `reviews.md`.
- Batch name/id: planning pass 2 (no implementation batch yet). Pass 1
  (2026-09-26, `c39f3de1`): design, `B4.1` brief, `B4.2` outline, mocks,
  five decisions, the roadmap's R4 rows.
- What shipped: `plan.md` refreshed against `1cbca5f7` - the `Plan
  review:` line, the release slot, R3's shipped event names and inline
  header parse, the four layer 3 pins that move (`harness`, `limits`,
  `usage`, `restore-drill`) and the `COVERAGE.md` paragraph, the flush
  before apply and the lists re-read after it, the owner-feed routing
  through a `requests` option, the Display row rewording as a select
  (owner, 2026-09-27), no requester status (owner's feedback,
  2026-09-27: no `status_key`, no `get_purchase_requests`, no share-topic
  event, no `sessionStorage` key or `env.session` port), no seeded
  requests in the fake, the schema-batch push order, gate costs, every
  `B3.2`-dependent step marked, and section 16 (the delta check).
  `context.md` carries the owner's notes and feedback verbatim. Mocks
  (owner request, 2026-09-27): one self-contained file per screen.
- Files changed: `issues/persist-4-requests/context.md`,
  `issues/persist-4-requests/plan.md`, `issues/persist-4-requests/handoff.md`,
  `issues/persist-4-requests/mocks/` (7 new files; 3 deleted),
  `docs/decisions/2026-09-27-a-requester-sees-no-request-status-the-send-toast.md`
  (new), the pointer lines in
  `docs/decisions/2026-09-26-a-requester-reads-the-status-by-a-key.md` and
  `docs/decisions/2026-09-26-request-events-nudge-the-owner-and-share-topics.md`,
  `docs/DECISIONS.md`
- Previous sha (batch diff base): `1cbca5f7`
- Deviations and rationale: none from the owner's answers. Decided in
  this pass: the Display row's hint is drawn (the owner left it
  optional); the requester's status is removed rather than shortened
  (plan section 13, item 3); the request trigger copies R3's inline
  header parse instead of a shared helper (R3's copy is in a shipped
  migration); the fake seed holds no requests, so no default golden
  re-seeds for them.
- Review: not required (planning only); the plan review of `B4.1` is
  required before its implementer (plan Status)

## Verification
- Commands run (exact): `git merge --ff-only 1cbca5f7`; `node
  tools/build.js` (generated files were absent in the worktree); `node
  tools/decisions.js`; `node tests/derived.js`
- Results: fast-forward `288ca549..1cbca5f7`; `docs/DECISIONS.md - 163
  decisions`; `derived files: everything matches`
- Gates: planning only; no `npm run check`

## Next batch (implement-ready)
- Name: `B4.1` - the database half
- Objective: purchase-request tables, RLS,
  `create_purchase_request(uuid,text,jsonb)` (the one new `anon`
  function, replay-safe), `apply_purchase_request`,
  `decline_purchase_request`, the event trigger on R3's owner topic, two
  `limit_defaults` rows, reversal, layer 3 proof
- In scope / Out of scope / Files expected / Steps / Acceptance criteria:
  `plan.md` section 10
- Prerequisite: R3 closed and pushed; start from that `main`. The plan
  review (`Scope: plan before B4.1`) approves first.
- Verification commands: `rtk npm run check` (Bash tool, one foreground
  call, timeout 600000); `npm run check:db` (PowerShell tool, alone,
  timeout 600000); after the batch review's approve: `node
  --env-file=.env.test.local tools/supabase/db-push.mjs --project test
  --yes`, then `npm run e2e`
- Risks / do-nots: plan section 10, "Risks and do-nots"
- Fallback (optional): none

## Blockers
- R3 (`persist-3-realtime`) must be closed and pushed: `B4.1` sends on its
  owner topic, and `B4.2` builds on `B3.2`'s client (plan section 16).
- The second look of the plan review (`reviews/plan-B4.1-2.md`) must
  approve.

## Deferred
- A requester cancel; a notification outside the lists pages; a Discord
  webhook (roadmap decision 40) - not in v1.

## Notes
- Mocks path: `issues/persist-4-requests/mocks/index.html` (one line per
  mock and its plan step): `send.html`, `status.html` (what the requester
  sees after a send), `flow-b.html`, `owner-panel.html`,
  `index-card.html`, `display-row.html` - each self-contained, every
  state at 960 px and 360 px; open from disk. Pass 1's
  `b42-requests.html`, `mock.css` and `r4.css` are deleted. Checked in the
  browser pane on 2026-09-27: no element past a 360 px frame's edge in
  `owner-panel.html` and `flow-b.html`; the Display row's segmented
  control overflows, hence the select
- Screenshot findings: no issue screenshots
- Cleanup performed / retained artifacts: generated files from `node
  tools/build.js` are gitignored and left in the worktree
- Session end partial progress (if any): none
- Durable items written to their homes this batch (file, section): the
  decision "A requester sees no request status; the send toast is the
  only answer" and its two pointers
