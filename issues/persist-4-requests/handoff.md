# Handoff - TASK persist-4-requests
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: blocked (planned; waits for R3 to ship, and for the owner's answer to plan section 13 before `B4.2`)
- Last agent: planner
- NEEDS_HUMAN_CONFIRMATION: yes - plan section 13, question 1 (where a remembered "notify the owner" answer is changed; recommended: a field on `#/account`)
- Branch: `worktree-agent-a1edb43d760ec7422` (planning worktree)
- Base / starting commit: `c39f3de1` (R3's plan on R2's local task commit `da7378cb`)
- Pushed: no

## Completed
- Batch name/id: planning pass 1 (no implementation batch yet)
- What shipped: `plan.md` (design, batches `B4.1` implement-ready, `B4.2`
  outline), `mocks/b42-requests.html` with `mocks/mock.css` (copied from
  R2) and `mocks/r4.css`; five decision files under `docs/decisions/`
  (2026-09-26: requests written only by a bounded function; over-stock
  refused whole, Apply available clamps, zero removes; request events
  nudge the owner and share topics; the status key in sessionStorage;
  flow b asks, remembered in `notifyGm`); the roadmap's R4 rows
- Files changed: `issues/persist-4-requests/{context,plan,handoff}.md`,
  `issues/persist-4-requests/mocks/*`, `docs/decisions/2026-09-26-*.md`
  (5), `docs/DECISIONS.md`, `issues/persistent-storage/plan.md`
- Previous sha (batch diff base): `c39f3de1`
- Deviations and rationale: none from the owner's answers. Two source
  conflicts resolved by the owner's own answers (plan section 2): the
  expiry is 1 hour (the 14 days was stale roadmap text), and a request
  stores no name, so there is no name bound and no name in the privacy
  text.
- Review: not required (planning only)

## Verification
- Commands run (exact): `node tools/build.js` (generated files were
  absent in the worktree), `node tools/decisions.js`, `node tests/derived.js`
- Results: `docs/DECISIONS.md - 124 decisions` with the five new files;
  `derived files: everything matches`
- Gates: planning only; no `npm run check`

## Next batch (implement-ready)
- Name: `B4.1` - the database half
- Objective: purchase-request tables, RLS, `create_purchase_request`,
  `get_purchase_requests`, `apply_purchase_request`,
  `decline_purchase_request`, the event trigger on R3's topics, two
  `limit_defaults` rows, reversal, layer 3 proof
- In scope / Out of scope / Files expected / Steps / Acceptance criteria:
  `plan.md` section 10 (implement-ready apart from its **[refresh]**
  marks, which re-read R3's shipped migration and Realtime test helpers
  and the last migration timestamp)
- Verification commands: `rtk npm run check` (Bash tool, one foreground
  call, timeout 600000); `npm run check:db` (PowerShell tool, alone,
  timeout 600000)
- Risks / do-nots: plan section 10, "Risks and do-nots"
- Fallback (optional): none

## Blockers
- R3 (`persist-3-realtime`) must be live: `B4.1` sends on its topics and
  its tests reuse R3's `realtime.messages` checks.
- Owner question 1 (plan section 13) before `B4.2`.

## Deferred
- A requester cancel; a notification outside the lists pages; a Discord
  webhook (roadmap decision 40) - not in v1.

## Notes
- Mocks path: `issues/persist-4-requests/mocks/b42-requests.html` (open
  from disk beside `mock.css` and `r4.css`; the browser pane shows local
  files without their stylesheet)
- Screenshot findings: no issue screenshots; the mock is composed from R2's
  shared page, share panel and index mocks and `SelBar.svelte`
- Cleanup performed / retained artifacts: generated files from
  `node tools/build.js` are gitignored and left in the worktree
- Session end partial progress (if any): none
- Durable items written to their homes this batch (file, section): five
  decision files (`docs/decisions/2026-09-26-*.md`); the roadmap's R4 rows
