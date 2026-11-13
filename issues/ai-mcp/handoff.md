# Handoff - TASK ai-mcp
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (B0-B3 and B2b live: landing 1 `aeb68c0e`, landing 2 `89a55f1b`, landing 3 `c4742c53`; B5a-B5d planned; the plan review before B5b and the UI action audit are applied)
- Last agent: planner (2026-11-13, on `claude/ai-mcp-b5plan`: `claude/ai-mcp` merged in, `reviews/plan-B5b.md` and `reviews/audit-ui-actions.md` applied, B3 and B2b collapsed)
- NEEDS_HUMAN_CONFIRMATION: no (no product-law change and no grant-level change of D7; the consent-endpoint stop of B5a step 1 is an owner stop, not a question; the defaults of this pass are "default taken (owner AFK)", `plan.md` section 7)
- Branch: claude/ai-mcp-b5plan (temporary; the orchestrator merges it into `claude/ai-mcp`)
- Base / starting commit: 71c6827c; merge of `claude/ai-mcp` at `8571dbe0` in `51f830de`
- Pushed: no (planner pass; the orchestrator pushes)

## Completed
- B0 - license statement and per-record rights audit: shipped in `aeb68c0e` (review `reviews/B0.md`).
- B1 - API core and REST v1 reads: shipped in `aeb68c0e` after the fix pass `93eac0ae` (review `reviews/B1.md`); live checks 1-11 passed on 2026-11-12.
- B2a - record links with `?v`, one record per line, the roll index cache and the MCP adapter: `22755cc1`, review `reviews/B2a.md`, fix pass `5b58edf8`, squash `89a55f1b` (landing 2). The cold criterion of 50 % was not met locally (71 %); accepted (owner AFK).
- B3 - search, table filters and file checks: review `reviews/B3.md` (fix-then-continue; Blocker 1, the strict UTF-8 decode, fixed; N1-N4 done); step 1's gate held (K = 3.01); shipped at landing 3 `c4742c53`.
- B2b - the two pages, the footer links and the import-row links: `ed3d8954` (base `4cc114e7`), review `reviews/B2b.md`, fix pass `a3448d16` (all goldens re-seeded, nits 1-12); shipped at landing 3 `c4742c53`.
- Landing 3 step 14 readings: `context.md`, "Landing 3 readings and owner instructions"; the burst p50 lines met, the cold readings of search and the file checks past 10 ms (`plan.md` B3 outcome).
- Previous sha (batch diff base): ed3d8954 (B2b); this pass changes only `issues/ai-mcp/`.
- Files changed (this pass): `issues/ai-mcp/plan.md`, `handoff.md`, `context.md`, `reviews/plan-B5b.md`, `reviews/audit-ui-actions.md`.
- Review: the plan review before B5b (`reviews/plan-B5b.md`, fix-then-continue) and the UI action audit (`reviews/audit-ui-actions.md`, fix-then-continue), both applied once (`plan.md` Status); no second look (the change does no more than the findings name).

## Verification
- B3 step 13 (local, `process.cpuUsage()`, medians of 9 runs; the host is noisy): search cold 0.63 ms today, 1.88 ms at 3x; the worst accepted warm query 0.47 / 0.78 ms; refusals 17 of 66 today and 36 of 66 at 3x (all fragments). File check (32 KB) cold / warm: lists ok 1.57 / 0.94 ms (3x 3.59), lists of 2000 unknown ids 2.65 / 2.03 ms (3x 3.91), homebrew 1.41 / 0.63-0.78 ms (3x 2.50-2.81).
- Worker bundle after B3: 327,961 B, 80,280 B gzip (before 65,552 B gzip). App bundle after B2b: 275.2 kB of 276 kB (B5a step 10 raises it).
- Sizes after B3: `apidata/` and `api/v1/catalog/` 108 files today (one search shard of 204,395 B), 214 at 3x; about 91 files left under 20,000 at 3x.
- B2b client steps were checked on 2026-11-13 against: support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp, cursor.com/docs/context/mcp, code.claude.com/docs/en/mcp. ChatGPT has no block.
- Commands of the B3 and B2b batches and their results: `git show 51f830de:issues/ai-mcp/handoff.md`, "Verification".
- This pass (documents only): no heavy run; `wc -c issues/ai-mcp/plan.md` 143 KB.
- Gates: CI's green run of the tip is the full gate (the orchestrator).

## Deviations
- B2b: the `Shell.svelte` footer CSS gained `min-width` for the short «API» link.
- B3: file-check lines are capped at the first 50 for a good file too (`LINES_MAX`; `more` counts the rest, `counts` stay whole); default taken (owner AFK). Reason: a 32 KB lists file of 2000 unknown ids made 2108 skip lines, a 283 KB answer and 4.4 ms warm locally. Revert by removing `LINES_MAX` in `preview/api/service.mjs`.
- B3: the file-check data sets are built once per cached `apidata/file-check.json` (a `WeakMap`); `table=alt_item` and `alt_consumable` select by `kind` and rarity; the step 12 parity tests live in `tools/api-data.test.mjs`; `parseSearch` parses `q` once in the adapter; a parameter given twice is 400 on every query parameter.

## Next batch (implement-ready)
- Name: B5a - The account connection (`plan.md` section 6, "B5a"; the plan text is the brief).
- Objective: a reader connects an app through the Supabase OAuth 2.1 server on `/connect/<id>`, sees and disconnects it on `#/account`, and the database bounds every client token to the "UI action coverage" scope; Auth is bounded by step 1's measurement and stop rule; D7.
- In scope / out of scope, files, steps 1-10, acceptance 1-22, standing checks: `plan.md` B5a.
- Verification commands: `rtk npm run check:fast` (Bash timeout 600000); `npm run check:db` (PowerShell tool, the migration and `tests/db`); `npm run budget` in both builds (step 10); `npm run build:test`, then the golden re-seed of the new inventory states; `node tests/run-all.js contracts,dataint`; push, CI.
- Risks / do-nots: stop and return to the owner if a client token changes the email or the password, links or unlinks an identity, enrolls a factor, or approves an OAuth authorization (step 1); never write `location.pathname` as given in the bar rewrite; never a restrictive storage policy `for all`; raise a bundle limit only by the README rule.
- Fallback: the guard call at the top of each out-of-list RPC if the hosted project ignores `pgrst.db_pre_request` (step 3).
- After B5a: B5b, B5c and B5d in order, each implement-ready in `plan.md`; no planner pass between them unless a batch changes a shared rule.

## Blockers
- B5a can start once the orchestrator merges `claude/ai-mcp-b5plan` into `claude/ai-mcp` (the plan review and the audit are applied, `plan.md` Status). The owner's OAuth step on the test project is done: "OAuth Server" on (path `/connect`, dynamic apps on, 2026-11-12, `context.md` "B5 refresh facts"); the landing-3 note's "B5a-B5d wait on the owner's OAuth steps" predates that fact on this branch. The orchestrator confirms with the owner that no other OAuth step is meant before the dispatch.
- B5a step 1 is B5's one owner stop: a client token that changes the email or the password, links or unlinks an identity, enrolls a factor, or approves an OAuth authorization (a connected app could connect another app that survives its revoke; plan-B5b-1). A list or revoke of grants, a global logout and a `data` change are recorded, not a stop.
- Open owner decision (not a B5a block): the landing-3 cold readings past 10 ms (search 12.6, homebrew check 13.8, lists check 10.2, MCP `check_file` 19.5 ms); the orchestrator recommends accepting them as for the roll. B5b's import inherits that decision (`plan.md` "Common rules", "Imports").
- Owner step after landing 2 (an account setting): add the connector in Claude with "No sign in" and ask for a roll; a 403 means the client sends `Origin` (`plan.md` B2a outcome).
- Later, after the closeout squash (owner): `npm run config:diff -- --project prod` (only `auth.oauth_server` rows), then `npm run config:push -- --project prod`, the probe on production, the `/mcp/me` connector test with sign-in; then the orchestrator's closeout steps: the live `ETag` `1.3.0-` and the issue 72 follow-up A2 with the close (`plan.md` section 6, "B5").

## Deferred
- Not placed (named for a later batch or the human):
  - `names.json` at three times the records: about 330 KB against `NAMES_MAX` 196608 B in `preview/api/rest.mjs`, so every shared-list read answers 503 at 3x (`reviews/B1.md` Risk 2; `plan.md` section 10).
  - The one joined line of about 200 characters in the 2026-10-14 decision (`reviews/B1.md` Nit 7): cosmetic, and splitting it passes the 15-line limit.
  - `plan.md` section 10 (CORS on `/apidata/*`, the account-tier items of Q8-Q11, developer tokens, MCP output schemas and resources, search over descriptions, own items in search, multi-valued facets, names in a lists file check).
  - plan-B5a-N12: nothing shows when the shared quota is near (about 500 users polling every 15 minutes); reopened by B5b's first consumer with background sync.
  - plan-B2a-N12: `/mcp/` with a trailing slash answers 404; serving it as `/mcp` is a choice to make before the v1 freeze of that answer matters to a client.
- Placed (each is an acceptance line of the batch named): every finding of `reviews/plan-B5b.md` and `reviews/audit-ui-actions.md` (B5a-B5d, `plan.md` Status lists each); the export-flow link, the account text on the pages, the file-check cap outcome and the print-set tool: B5d acceptance 12-16; the live `ETag` and the issue 72 follow-up: closeout steps (`plan.md` section 6, "B5").

## Notes
- Mocks path: `issues/ai-mcp/mocks/b5a-screens.html` (screens `consent` and `apps`, a state, RU/EN and 360/1180 px switch; URL parameters `screen`, `state`, `lang`, `w`, `shot=1`, `mark=1`) and 14 PNGs in `issues/ai-mcp/mocks/png/`. The constraints are in `plan.md` B5a, "Approved mock". The route key `#/connect/<id>` (plan-B5b-2) changes no drawn state of the mock.
- Screenshot findings: none new this pass.
- Cleanup performed / retained artifacts: B3, B2b, sections 1, 3.3, 3.4 (in part), 3.5, 3.8, 5.1, 5.3, 9 and 11, and the B3-era parts of Status and section 7 are collapsed to their outcomes; the last pre-collapse commit of `issues/ai-mcp/` is `51f830de` (`git show 51f830de:issues/ai-mcp/plan.md`; the earlier collapses: `8019493d`, `93eac0ae`). The splice scripts of this pass are in the session scratchpad only.
- Defaults taken (owner AFK) this pass, `plan.md` section 7, "Defaults taken (owner AFK), plan review and audit, 2026-11-13": the audit findings go to the batch of their own row (R2, R3, R7 to B5b; R4, R5, R6 to B5c; R8 to B5d; cost: B5b gains 3 acceptance clauses and B5c 4, no new batch, gate run or migration); `/mcp/me` lists the public tools; a request to the reader's own list is 409 `conflict`; import ids are UUIDv5 names under `import_id`; the H11 body cap is 413696 B.
- Not applied as worded: plan-B5b-4 says the cold cost is "in the class the owner accepted for landing 3"; the owner has not decided on the landing-3 cold readings yet (`context.md`), so the plan says the import inherits that decision.
- Session end partial progress (if any): none.
- Durable items written to their homes this pass (file, section): none outside `issues/ai-mcp/` (a planner pass); D7 goes to `docs/decisions/` in B5a.
- Issue 72 stays open until the account-level read ships (`C:\Users\Ignat\.dhloot\notes\57\ai-mcp-closeout-posts.md`, A2; a closeout step after the owner's production switch).
