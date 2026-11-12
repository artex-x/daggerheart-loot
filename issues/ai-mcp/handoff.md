# Handoff - TASK ai-mcp
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (B0 and B1 live since landing 1 `aeb68c0e`; B2a live since landing 2 `89a55f1b`, merged back as `8019493d`; the landing-2 readings are taken (`context.md`, "Landing 2 readings"); the plan review before B3 (`reviews/plan-B3.md`, fix-then-continue) is applied, so B3 is implement-ready; B2b is implement-ready and waits for B3; the two land together at landing 3)
- Last agent: planner (B3 plan-review pass, 2026-11-12)
- NEEDS_HUMAN_CONFIRMATION: no (no product-law change; the owner dropped roll fallback 2 in chat, 2026-11-12, `plan.md` section 7; every other new choice is "default taken (owner AFK)", `plan.md` section 7, "Defaults taken (owner AFK), B3 pass")
- Branch: claude/ai-mcp (this pass on the temporary branch claude/ai-mcp-b3fix, based on 6f2afec6; the orchestrator merges it back)
- Base / starting commit: 6f2afec6 (the B3 planner commit)
- Pushed: no (this planner commit is local; the orchestrator pushes)

## Completed
- B0 - license statement and per-record rights audit: shipped in `aeb68c0e` (review `reviews/B0.md`, nits folded into B1).
- B1 - API core and REST v1 reads: shipped in `aeb68c0e` after the fix pass `93eac0ae` (review `reviews/B1.md`, fix-then-continue, applied); live checks 1-11 passed on 2026-11-12.
- B2a - record links with `?v`, one record per line, the roll index cache and the MCP adapter: `22755cc1`, review `reviews/B2a.md` (fix-then-continue), fix pass `5b58edf8`, squash `89a55f1b` (landing 2), merge-back `8019493d`. Local CPU (200 calls, median of 9): `std` roll warm 1.565 to 0.545 ms (35 %), cold 1.645 to 1.170 ms (71 %); record `ci12` warm 0.390 to 0.155 ms, cold 0.625 to 0.310 ms. Deviation: the cold criterion of 50 % was not met locally (71 %); the orchestrator accepted it (owner AFK), and the production readings decide with R1's cold reading. Sizes after B2a: 105 files (54 chunks, 4.02 MiB, `api/v1/catalog/index.json` 70,117 B), 209 at 3x, about 96 files left under 20,000.
- Planner pass 2026-11-12 (B3, this commit; no production code): `plan.md` Status (the guard line "Plan review: required before B3"), sections 3.2 and 3.6 (collapsed), 3.3, 3.4, 3.5, 4 (D1-D9 as written files, D10 rewritten), 5.1 (`too_broad`), 5.3 (Charkeeper table collapsed), 6 (B2a collapsed; B3 implement-ready; B5b placed line 5), 7 (the B3 defaults), 9, 10, 11; `context.md` ("B3 planner measurements (2026-11-12)"; the open-question line).
- Files changed: `issues/ai-mcp/plan.md`, `issues/ai-mcp/handoff.md`, `issues/ai-mcp/context.md` (only under `issues/`).
- Previous sha (batch diff base): 8019493d
- Deviations and rationale: none in this pass. The B3 brief's file-check line names follow default (a) of plan-B2a-5 (item ids, no names); the search answer format is `daggerheart-loot/api-search`, not the `api-records` of the earlier draft, because `apidata/records/index.json` already uses that id.
- Review: plan review before B3 required (trigger: a public contract change); report `issues/ai-mcp/reviews/plan-B3.md`. B3's batch review: required (a public contract).

## Verification
- Commands run (exact), read-only measurement scripts in the session scratchpad (not committed), from the worktree root: `node --import ./tools/ts-hooks.mjs <scratchpad>\b3bench.mjs`, `node --import ./tools/ts-hooks.mjs <scratchpad>\b3bench2.mjs`, `node --import ./tools/ts-hooks.mjs <scratchpad>\b3f.mjs`; reads of `.claude/hooks/agent-guard.mjs` and `.claude/hooks/session-stop.mjs`; `git grep "^Verdict:" -- issues/ai-mcp/reviews/`.
- Results: the numbers of `context.md`, "B3 planner measurements (2026-11-12)"; every required plan-review line but B3's is satisfied (plan-B1-3, plan-B5a and plan-B2a are fix-then-continue with an applied line); `plan.md` 150,877 B, under the 153,600 B warning line of `session-stop.mjs`.
- Gates: none (a docs-only planner commit under `issues/`; no check, vitest or run-all on the orchestrator's instruction).

## Next batch (implement-ready)
- Name: B3 - Search, table filters and file checks (`plan.md` section 6, B3). Its plan review `reviews/plan-B3.md` (fix-then-continue) is applied (`plan.md` Status); no second look.
- B3's step 1 is a gate on landing 2's readings (`context.md`, "Landing 2 readings"): (a) every status as expected, no error and no exceeded-CPU count (met: 0 and 0 in 33 requests); (b) K is the larger of (cold `std` roll - cold record read) / (1.170 - 0.310) and (burst p50 `std` roll - burst p50 record read) / (0.545 - 0.155): 1.70 and 3.01, so K = 3.01; (c) the predicted cold REST search at 3x, cold record read + K x (1.8 - 0.310) ms, is at most 10 ms: 9.4 ms, met. If (a) or (c) fails, B3 stops and returns to the planner. Burst p99 is recorded, not gated.
- Fallback (optional): B3 "Fallbacks" (search: display names as a capitalization delta, then shard skipping by facet codes); B2a outcome (roll: the chunk-line cache only; the owner dropped the per-total `std` files on 2026-11-12, `plan.md` section 7).
- After B2a (orchestrator, done 2026-11-12): curl from the shell, one warm-up per case as its cold reading, then a burst of 10; the readings are in `context.md`, "Landing 2 readings".
  - R1 (`reviews/B2a.md`): applied; each warm-up's own 1-minute range is the cold reading of its case (`std` 6.360, record 4.902, MCP 8.913 ms).
  - R2 (`reviews/B2a.md`): live check 1 expects the OpenAPI `ETag` `1.1.0-...`; after B3 it starts `1.2.0-` (the orchestrator updates the notes file).
  - Pass (as read): every status as expected, 0 errors and 0 exceeded-CPU; the three p99 lines failed (`std` roll 17.1 ms against 5, record read 8.1 ms against 2, MCP roll 7.4 ms against 6). The owner accepted the roll as it is, and the floor-plus-slope model of B3 step 1 replaces those lines. Writing the readings into `.claude/README.md` ("Quotas, recovery and failure") stays the orchestrator's.
- Then: B3, then B2b; landing 3 carries both, then B3 step 14's readings (cases (f), (a)-(e), (g); the pass line of step 14).

## Blockers
- B3: its plan review. Status carries "- Plan review: required before B3 (trigger: ...)"; `agent-guard.mjs` blocks every implementer dispatch until `reviews/plan-B3.md` (or `plan-B3-<n>.md`) reads `Verdict: approve`, or reads `fix-then-continue` and Status carries "- Plan review findings applied: reviews/plan-B3.md". The older required lines (B1, B5a, B2a) are satisfied and do not block.
- B3 step 1 waits for landing 2's readings (orchestrator, in progress).
- B2b: implement-ready, but it follows B3 (the developer page lists every operation once) and lands with it at landing 3; if B3's plan review answers `replan` or B3 step 1 stops, B2b lands alone (`plan.md` section 6, "Order of the remaining batches").
- B5a and B5b cannot start until the owner has done these (only the owner may; the orchestrator does not change security settings):
  1. Switch on "OAuth Server" (BETA) in the Supabase test project `daggerheart-loot-test` (Authentication), with the settings B5a step 1 needs: the authorization path to the app's consent route and dynamic client registration (`plan.md` B5a step 1 lists what it measures).
  2. Approve the screen mock of the consent page and of "Connected apps" on `#/account`, which a planner refresh draws under `issues/ai-mcp/mocks/` when B5a is next (owner AFK: the recommended mock is taken and logged as a default). That refresh also decides B5b placed line 5 (print sets in the client scope).
  3. Later, after the closeout squash: the production OAuth switch (B5a step 8) and the `/mcp/me` connector test with sign-in.
- Owner step after landing 2 (an account setting): add the connector in Claude with "No sign in" and ask for a roll; a 403 means the client sends `Origin` (the allowlist fallback, `plan.md` B2a outcome).
- B5a's own stop rule stays: a client token that changes the email or the password, links or unlinks an identity, or enrolls a factor.

## Deferred
- Not placed (named for a later batch or the human):
  - `names.json` at three times the records: about 330 KB against `NAMES_MAX` 196608 B in `preview/api/rest.mjs`, so every shared-list read answers 503 at 3x (`reviews/B1.md` Risk 2; `plan.md` section 10).
  - The one joined line of about 200 characters in the 2026-10-14 decision (`reviews/B1.md` Nit 7): cosmetic, and splitting it passes the 15-line limit.
  - `plan.md` section 10 (CORS on `/apidata/*`, the account-tier items of Q8-Q11, MCP output schemas and resources, search over descriptions, own items in search, multi-valued facets, names in a lists file check).
  - plan-B5a-N12: nothing shows when the shared quota is near (about 500 users polling every 15 minutes); reopened by B5b's first consumer with background sync.
  - plan-B2a-N12: `/mcp/` with a trailing slash answers 404 (a pasted URL with a slash fails); serving it as `/mcp` is a choice to make before the v1 freeze of that answer matters to a client.
- Placed (each is an acceptance line of the batch named):
  - A test that pins the Russian-credit sentence across `README.md`, `README.ru.md`, `LICENSE`, `llms.txt` and the two `dict.ts` footers: B2b step 6.
  - The export-flow link, the account text on the pages, the file-check cap raise, the issue 72 follow-up and the print-set tool (owner idea, 2026-11-12): B5b, "Placed lines" 1-5.
  - The OpenAPI `ETag` `1.2.0-` in live check 1: B3 step 10 (the orchestrator's notes update).

## Notes
- Mocks path: `issues/ai-mcp/mocks/` (B5a's consent page and "Connected apps", drawn when B5a is next). B3 changes no screen. B2b needs no mock: the lists import panel takes the existing My items panel row (default taken (owner AFK)).
- Screenshot findings: the owner's screenshot of the homebrew import panel (note 7 of `ai-mcp-docs-page.md`) shows "Формат файла" and "llms.txt" in the file row; B2b replaces the second link.
- Cleanup performed / retained artifacts: the plan's B0, B1 and B2a briefs, sections 3.2, 3.6, 5.2, 5.4 and 8, the Charkeeper table of 5.3, the written decision drafts D1-D9 and the plan-review sub-bullets of B1, B2a and B5a are collapsed; the last pre-collapse commit of `issues/ai-mcp/` is `8019493d` (`git show 8019493d:issues/ai-mcp/plan.md`; the B0 and B1 texts: `93eac0ae`). Scratch files of this pass (`status.md`, `b2a.md`, `b3.md`, `s32.md`, `s36.md`, the splice and bench scripts) are in the session scratchpad only.
- Session end partial progress (if any): none.
- Durable items written to their homes this pass (file, section): none outside `issues/ai-mcp/` (a planner pass); D10 goes to `docs/decisions/` in B3.
- Issue 72 stays open until the account-level read ships (`C:\Users\Ignat\.dhloot\notes\57\ai-mcp-closeout-posts.md`, A2; placed in B5b).
