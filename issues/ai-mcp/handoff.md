# Handoff - TASK ai-mcp
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (B0 and B1 live on production since the first squash `aeb68c0e`; the plan review before B2a (`reviews/plan-B2a.md`, fix-then-continue) is applied in one pass on 2026-11-12, with no second look; B2a is next and implement-ready; B3 needs a planner pass and its own plan review; B2b is implement-ready and waits for B3, and the two land together at landing 3)
- Last agent: planner (plan-review fix pass, 2026-11-12)
- NEEDS_HUMAN_CONFIRMATION: no (no product-law change; every new choice is "default taken (owner AFK)", `plan.md` section 7 and B3's "Status" paragraph)
- Branch: claude/ai-mcp
- Base / starting commit: 1b99e6d4 (main merged in after the B0 and B1 squash)
- Pushed: no (the dispatch said not to push; `1b99e6d4` and the planner commits go out with B2a's push)

## Completed
- B0 - license statement and per-record rights audit: shipped in `aeb68c0e` (review `reviews/B0.md`, nits folded into B1).
- B1 - API core and REST v1 reads: shipped in `aeb68c0e` after the fix pass `93eac0ae` (review `reviews/B1.md`, fix-then-continue, applied); live checks 1-11 passed on production on 2026-11-12. Sizes as `.claude/README.md` "The CI deploy" states them: 105 files (54 catalog chunks, 3.97 MiB; `apidata/records/index.json` 11,561 B, `api/v1/catalog/index.json` 70,114 B), 207 at three times the records, about 98 files left under 20,000.
- Planner pass 2026-11-12 (`db90cd02`, no production code): `plan.md` Status, sections 3.2, 3.3, 3.5, 4 (D4, D8, D9, D10, decision drafts), 5.2 and 5.4 (collapsed), 6 (B0 and B1 collapsed; B2a, B3, B2b expanded; B5b placed lines), 7, 8 (collapsed), 9, 10, 11; `context.md` (owner decisions, live readings, MCP spec facts, planner facts).
- Plan-review fix pass 2026-11-12 (this commit): every finding of `reviews/plan-B2a.md` applied once (`plan.md` Status, "Plan review findings applied: reviews/plan-B2a.md", one sub-bullet per finding); B3 marked for a planner pass; the reviewer's measurements in `context.md`; the report committed with it.
- Files changed: `issues/ai-mcp/plan.md`, `issues/ai-mcp/handoff.md`, `issues/ai-mcp/context.md`, `issues/ai-mcp/reviews/plan-B2a.md` (only under `issues/`).
- Merge-back facts (plan-B2a-N11): `1b99e6d4` differs from `origin/main` (`aeb68c0e`) only under `issues/` (the reviewer's `git diff --stat`), so main's green CI run of `aeb68c0e` covers the same code tree and stands as D6's gate for B2a's start; `1b99e6d4`, `db90cd02` and this commit are not pushed yet and go out with B2a.
- Previous sha (batch diff base): 1b99e6d4
- Deviations and rationale: B2 is split into B2a and B2b (`plan.md` section 6, "Order of the remaining batches"); the record-link decision rides in B2a, not in a B1b (same files, same plan review). The dispatch asked for a "Plan review: required before B3" Status line; `agent-guard.mjs` reads every such line and would block B2a's implementer dispatch until a `plan-B3` review approves, so the Status carries "B3's plan review: required before B3 ..." (a line the guard does not parse) and the B3 planner pass writes the guard line itself.
- Review: plan review before B2a done (`reviews/plan-B2a.md`, fix-then-continue, applied; no second look). B2a's batch review: required (trigger: a public contract; `tools/check/` and a `package.json` test script), report `issues/ai-mcp/reviews/B2a.md`.

## Verification
- Commands run (exact): read-only: `git log`, `Get-ChildItem apidata`, `Get-ChildItem api\v1\catalog` (sizes), WebFetch of the MCP `2026-07-28` changelog, versioning, `server/discover` and Streamable HTTP pages; in the fix pass, a read of `.claude/hooks/agent-guard.mjs` (every "- Plan review: required before <batch>" Status line gates every implementer dispatch).
- Results: sizes as in `context.md`, "Planner facts (2026-11-12)"; spec facts as in "MCP spec facts"; the reviewer's probes as in "Plan review measurements (2026-11-12)".
- Gates: none (a docs-only commit under `issues/`).

## Next batch (implement-ready)
- Name: B2a - Record links, roll CPU and the MCP adapter (`plan.md` section 6, B2a). Implement-ready after the plan-review fix pass; no second plan look. Writer: no open design question.
- Objective: the API record `link` carries the app's `?v` card version; a `std` roll and a record read parse one record per result (one record per line in the chunk files, an isolate cache of the roll index), so the heaviest read falls well under 10 ms; `POST /mcp` answers MCP (legacy `initialize` for `2025-03-26`, `2025-06-18`, `2025-11-25`, and modern `2026-07-28`) over the same service with the seven `x-mcp-tool` tools.
- In scope: `plan.md` B2a steps 1-3; the folded nits: the null-`hid` shared-list entry fallback (`reviews/B1.md` Nit 6, stated in `openapi.json`), the `CONTRACTS.md` wording "accepted since 2026-11-12" and the ETag sentence; `llms.txt` MCP changes ("Read this first" new item 1, items 2 and 3, the summary blockquote, the crawl line, the two `?v` sentences, "The MCP endpoint"); D4, D8, D9.
- Out of scope: `/mcp/me` and OAuth (B5b), search, filters and file checks (B3), the pages, the footer and the import panels (B2b), any REST path, parameter or field name, serving `/mcp/` as `/mcp`.
- Files expected: `app/src/lib/apiRecord.ts` and its test; `tools/api-data.mjs` and its test; `preview/api/service.mjs`, `rest.mjs`, `openapi.json`, `api.test.mjs`; new `preview/api/mcp.mjs` and `mcp.test.mjs`; `preview/worker.mjs`, `preview/worker.test.mjs` (the `routed` helper), `preview/public/_routes.json`, `preview/package.json`; `tools/check/lib.mjs` and its test; `tools/check-site.lib.mjs` and its test; `tools/collect-site.sh` (comment); `docs/fixtures/api/v1/*`, new `docs/fixtures/mcp/*.json`, `docs/fixtures/urls/preview.json` (`routes` and the `/mcp` serve row); `tests/contracts.js` (the `routed` helper and the MCP tests); `docs/specs/CONTRACTS.md` sections 5 and 6, `META.md` sections 3 and 7, `COVERAGE.md`; `llms.txt`; `.claude/README.md`; D4, D8, D9 and the D6 pointer under `docs/decisions/`, `docs/DECISIONS.md`.
- Steps: `plan.md` B2a steps 1.1-1.6 (links), 2.1-2.5 (one record per line, the roll index cache, the local before/after measurement), 3.1-3.10 (the MCP adapter, its wiring, probes, specs, `llms.txt`, decisions); step 4 is the orchestrator's after landing 2.
- Acceptance criteria: `plan.md` B2a "Acceptance criteria" (each line is its own check), including: every catalog `link` equals `recordUrl({ base: SITE }, id, lang, cardVersions()[id])`; one record per line with `(c, l)` on every roll row; the local `std` roll at most 40 % of its B1 cost warm and 50 % cold; both MCP eras as step 3.3 says, each pinned by a fixture (with `initialize-2025-03-26`, `tools-list-legacy-no-header`, `tools-call-bad-argument`); `tools/list` lists exactly the seven tools, each property with its description; a missing or non-string argument is a 400 `bad_request` `isError` result; no CORS, `Origin` 403, no `Authorization`, no 401, a 65536 B body cap on `/mcp`; `/mcp/me` 404; `preview.json` holds `GET /mcp` 405 and both `routed` helpers match bare `/x`; the folded nits fixed; D4, D8, D9 written.
- Verification commands: `node tools/build.js`; `node --import ./tools/ts-hooks.mjs --test --test-reporter=dot preview/worker.test.mjs preview/api/api.test.mjs preview/api/mcp.test.mjs tools/api-data.test.mjs`; `node --test --test-reporter=dot tools/check/lib.test.mjs tools/check-site.test.mjs`; `node tests/derived.js`; `node tests/run-all.js contracts,dataint`; `rtk npm run check:fast` (Bash timeout 600000); push (with `1b99e6d4` and the planner commits), CI.
- Risks / do-nots: no CORS header and no `OPTIONS` answer on `/mcp`; never read or forward `Authorization`; no `Mcp-Session-Id`; no REST field, path or status change (REST fixtures move only in `link`, `rev`, `data_version`, ETags); no hand edit of `apidata/` or `api/`; a cloud client that sends `Origin` gets 403 (the four-step allowlist fallback of B2a "Risks", recorded in D4).
- Fallback (optional): if landing 2's `std` p99 stays above 5 ms: first an isolate cache of each chunk's split lines (no file, no contract change), then per-total `apidata/roll/std/<total>.json` files (60 files; same contract).
- Gate cost: about 70 min (`check:fast` 5-8 min, CI 15 min, the batch review about 15 min, landing 2 about 23 min, the readings about 10 min). Review: required (trigger: a public contract; `tools/check/` and a `package.json` test script).
- After B2a: landing 2 (D8: the squash, the merge-back with `check:fast` and CI), then the readings of B2a step 4 by the orchestrator: every request with `curl` from the shell (no `Origin`), Chrome only for the Pages Metrics dashboard; per case one warm-up request, a new bucket, then a burst of 10 1 s apart, each status recorded; cases 3 minutes apart: `POST /api/v1/rolls/std` `{"dice":3}`, 10 record reads from different chunks, and 10 legacy MCP calls (`MCP-Protocol-Version: 2025-06-18`, `tools/call` `roll` with `{"section":"std","dice":3}`, each 200 with no `isError`); read the bucket's request count (repeat when it is not 10) and p50, p75, p99 (Production, a 3-minute range).
- Then: B3's planner pass (inputs: `plan.md` B3 "Status" paragraph) and its plan review; then B3; then B2b; B3 and B2b land together at landing 3 (D8 says what happens if B3 slips).

## Blockers
- B3: a planner pass on the search projection and the file-check line names, then its own plan review (`plan.md` Status, "B3's plan review"). The B3 pass writes the guard line "Plan review: required before B3" into Status; while that line lacks an approving or applied review, `agent-guard.mjs` blocks every implementer dispatch.
- B2b: implement-ready, but it follows B3 (the developer page lists every operation once) and lands with it at landing 3.
- B5a and B5b cannot start until the owner has done these (only the owner may; the orchestrator does not change security settings):
  1. Switch on "OAuth Server" (BETA) in the Supabase test project `daggerheart-loot-test` (Authentication), with the settings B5a step 1 needs: the authorization path to the app's consent route and dynamic client registration (`plan.md` B5a step 1 lists what it measures).
  2. Approve the screen mock of the consent page and of "Connected apps" on `#/account`, which a planner refresh draws under `issues/ai-mcp/mocks/` when B5a is next (owner AFK: the recommended mock is taken and logged as a default).
  3. Later, after the closeout squash: the production OAuth switch (B5a step 8) and the `/mcp/me` connector test with sign-in.
- The orchestrator continues with B2a, B3's pass, B3 and B2b first.
- Owner step after landing 2 (an account setting): add the connector in Claude with "No sign in" and ask for a roll; a 403 means the client sends `Origin` (the allowlist fallback of B2a "Risks").
- B5a's own stop rule stays: a client token that changes the email or the password, links or unlinks an identity, or enrolls a factor.

## Deferred
- Not placed (named for a later batch or the human):
  - `names.json` at three times the records: about 330 KB against `NAMES_MAX` 196608 B in `preview/api/rest.mjs`, so every shared-list read answers 503 at 3x (`reviews/B1.md` Risk 2; `plan.md` section 10).
  - The one joined line of about 200 characters in the 2026-10-14 decision (shortened to 15 body lines for `tests/derived.js`; `reviews/B1.md` Nit 7): cosmetic, and splitting it passes the 15-line limit.
  - `plan.md` section 10 (CORS on `/apidata/*`, the account-tier items of Q8-Q11, MCP output schemas and resources, search over descriptions).
  - plan-B5a-N12: nothing shows when the shared quota is near (about 500 users polling every 15 minutes); reopened by B5b's first consumer with background sync.
  - plan-B2a-N12: `/mcp/` with a trailing slash answers 404 in B2a (a pasted URL with a slash fails); serving it as `/mcp` is a choice to make before the v1 freeze of that answer matters to a client.
- Placed (each is an acceptance line of the batch named):
  - The null-`hid` shared-list entry fallback: B2a step 1.5 (stated in `openapi.json`, link `<site>i/<key>`).
  - The `CONTRACTS.md` wording nits ("accepted since 2026-11-12", the ETag clause): B2a step 3.8.
  - A test that pins the Russian-credit sentence across `README.md`, `README.ru.md`, `LICENSE`, `llms.txt` and the two `dict.ts` footers: B2b step 6.
  - The export-flow link, the account text on the pages, the file-check cap raise and the issue 72 follow-up: B5b, "Placed lines".
  - The stale size numbers of this handoff's Completed: corrected in this pass (105 files, 54 chunks, 3.97 MiB, 70,114 B index, 207 at 3x, about 98 left).

## Notes
- Mocks path: `issues/ai-mcp/mocks/` (B5a's consent page and "Connected apps", drawn when B5a is next). B2b needs no mock: the lists import panel takes the existing My items panel row (default taken (owner AFK)).
- Screenshot findings: the owner's screenshot of the homebrew import panel (note 7 of `ai-mcp-docs-page.md`) shows "Формат файла" and "llms.txt" in the file row; B2b replaces the second link.
- Cleanup performed / retained artifacts: the plan's B0 and B1 briefs, sections 5.2, 5.4 and 8, and the B1-era plan-review sub-bullets are collapsed; the last pre-collapse commit of `issues/ai-mcp/` is `93eac0ae` (`git show 93eac0ae:issues/ai-mcp/plan.md`). `plan.md` is about 165 KB, past the 150 KB warning line: the next compaction collapses B2a's brief once it ships. Scratch files of this pass (`batches.md`, `status.md`) are in the session scratchpad only.
- Session end partial progress (if any): none.
- Durable items written to their homes this pass (file, section): none outside `issues/ai-mcp/` (a planner pass); D4, D8 and D9 go to `docs/decisions/` in B2a, D10 in B3.
- Issue 72 stays open until the account-level read ships (`C:\Users\Ignat\.dhloot\notes\57\ai-mcp-closeout-posts.md`, A2; placed in B5b).
