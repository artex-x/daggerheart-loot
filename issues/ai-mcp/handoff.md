# Handoff - TASK ai-mcp
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (B0 and B1 implement-ready; B5a and B5b design settled; `reviews/plan-B5a.md` is fix-then-continue and its findings are applied, `plan.md` Status, so B0 or B1 may be dispatched)
- Last agent: planner (plan-B5a findings pass, 2026-11-11)
- NEEDS_HUMAN_CONFIRMATION: no (Q1-Q7 settled; Q8-Q11 and the R1, R7 and N10 options of `reviews/plan-B5a.md` "default taken (owner AFK)", `plan.md` section 7)
- Branch: claude/ai-mcp
- Base / starting commit: 8f194abd
- Pushed: no (the orchestrator commits this pass)

## Completed
- B5 design pass (planning only, 2026-11-11, with the bacchus-atlas input): B5 split into B5a and B5b, the B1 delta (bulk catalog, `key`, T0 ignores `Authorization`, unknown-`code` rule, `.well-known` reservation, failing CORS probes), D7, Q8-Q11; uncommitted on `8f194abd`.
- Batch name/id: plan-B5a findings pass (planning only, the same day, uncommitted on `8f194abd`).
- What shipped: every finding of `reviews/plan-B5a.md` applied once (blockers 1-3, R1-R7, N1-N11; N12 stated in section 3.4 and deferred in section 10); `plan.md` Status line "Plan review findings applied: reviews/plan-B5a.md" with one sub-bullet per finding; the B5a `Plan review:` trigger text names the restrictive table policies and the definer helper. `context.md` "B5 design facts" gains the review's facts.
- Files changed: `issues/ai-mcp/plan.md`, `issues/ai-mcp/handoff.md`, `issues/ai-mcp/context.md`.
- Previous sha (batch diff base): 8f194abd
- Deviations and rationale: N12 is both stated (section 3.4, the ceiling) and deferred (section 10 and Deferred below: nothing shows when the quota is near), as the report's finding text and its "Suggested next action" say. `plan.md` is about 189 KB, past the 150 KB warning line (warn only, 300 KB collapses); the compaction after B1 lands collapses B0 and B1 to their outcome and commit.
- Review: `reviews/plan-B5a.md` fix-then-continue, applied; no second look (`docs/decisions/`, 2026-10-01). Earlier: plan-B1, plan-B1-2, plan-B1-3 applied.

## Verification
- Commands run (exact): reads of `supabase/config.toml` (`enable_manual_linking = true`, `[auth.mfa.totp] enroll_enabled = true`, no OAuth server section), `get_homebrew_item` and `get_homebrew_items` (`20261014120000_homebrew_art.sql`), the `lists` grants and policies (`20260925130100_lists.sql`: `update` granted), the `list_notices` writers (SECURITY DEFINER, `20261007130000_homebrew_links.sql`); a `node -e` run of `agent-guard.mjs`'s `APPLIED_RE` over `plan.md` Status.
- Results: the regex reads `plan-B1.md`, `plan-B1-2.md`, `plan-B1-3.md` and `plan-B5a.md` as applied; both `Plan review:` lines parse.
- Gates: none (planning only).

## Next batch (implement-ready)
- First: B0 - License statement and per-record rights audit, or B1 (API core and REST v1 reads); either may go first. The plan review before B5a is applied; no second look.
- B0 objective, scope, files, steps, acceptance: `plan.md` section 6, B0. Verification: `node tests/derived.js`; `node tools/decisions.js`; `rtk npm run check:fast` (Bash timeout 600000); push and CI. Review: required (trigger: an agent definition changed; llms.txt), report issues/ai-mcp/reviews/B0.md; gate cost about 55 min.
- B1: `plan.md` section 6, B1 (now with the bulk catalog `/api/v1/catalog/`, record `key`, T0 ignoring `Authorization`, the unknown-`code` rule, the `.well-known` reservation, failing CORS probes; from plan-B5a: `rev` an opaque string and the step 5 test of the records that embed an edited one (R4), the `version.json` hash over outputs with `data_version` empty (N4), the catalog miss as `404.html` and `tests/contracts.js` comparing operations (N5), the image probe from the first chunk (N6)). Review: required (trigger: a public contract; a hook; tools/check/; a package.json check script), report issues/ai-mcp/reviews/B1.md; gate cost about 47 min; the merge-back commit about 23 min.
- Risks / do-nots: do not commit the SRD PDF or its text; do not set `reviewed`; do not add an `Access-Control-Allow-Origin` line to `_headers`; do not forward `Authorization` on a T0 path.
- Fallback (optional): none.

## Blockers
- B1 publication and squash: B0 committed, the owner's review of `docs/rights/records.json`, B1's approving batch review, a green CI run of the tip (D6).
- B3: the owner's CPU readings of B1/B2. B5a: the screen mock (planner refresh), then step 1's measurement on the test project (stop rule: a client token that changes the email or the password, links or unlinks an identity, or enrolls a factor); after `migrate-test`, the `print_sets` probe of B5a's acceptance.
- No batch or gate waits on the Charkeeper or bacchus-atlas authors.

## Deferred
- `plan.md` section 10 (Pages CORS on `/apidata/*`; the account-tier items of Q8-Q11).
- plan-B5a-N12: nothing shows when the shared quota is near (about 500 users polling every 15 minutes, `plan.md` section 3.4); the usage report stays deferred in section 10 until B5b's first consumer with background sync.

## Notes
- Mocks path: `issues/ai-mcp/mocks/` (B5a's consent page and "Connected apps", drawn when B5a is next).
- Screenshot findings: none.
- Cleanup performed / retained artifacts: scratch files only in the session scratchpad.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): none; D7 goes to `docs/decisions/` in B5a, the sync and bulk-catalog rules to `CONTRACTS.md` section 6 in B1.
