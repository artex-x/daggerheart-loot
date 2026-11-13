# Handoff - TASK ai-mcp
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (B0 and B1 live since landing 1 `aeb68c0e`; B2a live since landing 2 `89a55f1b`; B3 implemented and pushed on `claude/ai-mcp` (this pass, one commit); B2b is implement-ready and follows B3; the two land together at landing 3; then B3 step 14's readings)
- Last agent: implementer (B3, 2026-11-12)
- NEEDS_HUMAN_CONFIRMATION: no (no product-law change; the file-check line cap is a default taken (owner AFK), see Deviations)
- Branch: claude/ai-mcp
- Base / starting commit: 646b2c04 (the batch diff base); the unpushed planner and merge commits go out with this push
- Pushed: yes, after `rtk npm run check:fast` passed (re-run 2026-11-13) (the orchestrator runs no CI credit)

## Completed
- B0 - license statement and per-record rights audit: shipped in `aeb68c0e` (review `reviews/B0.md`, nits folded into B1).
- B1 - API core and REST v1 reads: shipped in `aeb68c0e` after the fix pass `93eac0ae` (review `reviews/B1.md`, fix-then-continue, applied); live checks 1-11 passed on 2026-11-12.
- B2a - record links with `?v`, one record per line, the roll index cache and the MCP adapter: `22755cc1`, review `reviews/B2a.md` (fix-then-continue), fix pass `5b58edf8`, squash `89a55f1b` (landing 2), merge-back `8019493d`. Local CPU (200 calls, median of 9): `std` roll warm 1.565 to 0.545 ms (35 %), cold 1.645 to 1.170 ms (71 %); record `ci12` warm 0.390 to 0.155 ms, cold 0.625 to 0.310 ms. Deviation: the cold criterion of 50 % was not met locally (71 %); the orchestrator accepted it (owner AFK), and the production readings decide with R1's cold reading. Sizes after B2a: 105 files (54 chunks, 4.02 MiB, `api/v1/catalog/index.json` 70,117 B), 209 at 3x, about 96 files left under 20,000.
- B3 - search, table filters and file checks (one commit, subject `feat(api): catalog search, table filters and file checks`): `GET /api/v1/records` (operation `searchRecords`, tool `search_catalog`), `filter` on `GET /api/v1/tables/{table}`, `POST /api/v1/file-checks` (operation `checkFile`, tool `check_file`), `openapi.json` 1.2.0, the projections `apidata/search/index.json`, `apidata/search/<n>.txt`, `apidata/file-check.json` and `f` on the table rows, `facetsOf` in `data.ts` (used by `TablesPage.svelte` and the build), the report builders `lib/importReport.ts` and `lib/homebrewReport.ts` (the components call them; markup unchanged), the specs (`CONTRACTS.md` section 6, `ROUTES.md`, `META.md`, `COVERAGE.md`), `llms.txt`, `.claude/README.md`, decision D10 (`docs/decisions/2026-11-12-api-search-scans-build-time-folded-names-and-file-checks-start-at-32-kb.md`, `docs/DECISIONS.md` rebuilt), the fixtures (10 new REST, 2 new MCP; the others moved in `data_version`, the tool list and `serverInfo.version` only).
- Step 1 gate (landing 2 readings, `context.md`): (a) met (0 errors and 0 exceeded-CPU in 33 requests); (b) K = max(1.70, 3.01) = 3.01; (c) the predicted cold REST search at 3x = 4.902 + 3.01 x (1.8 - 0.310) = 9.39 ms, at most 10 ms: met. B3 went on.
- Previous sha (batch diff base): 646b2c04
- Files changed: see `git show --stat` of the commit.

## Verification
- Local numbers of step 13 (`process.cpuUsage()`, medians of 9 runs of 100-200 calls, this host, scratch scripts in the session scratchpad, not committed; the host is noisy, a single run varies up to 2x). Search at today's size / at 3x: cold `q=sword` (a fresh service: decode, prepare, scan, rank) 0.63 / 1.88 ms; the worst accepted warm query of a 66-query sample (the top 15 one-, two- and three-letter word starts of the names and 21 real words) 0.47 ms (`ко`) / 0.78 ms (`arm`); the refusals of that sample under the rule of search step 3 (every anchor-needle hit in a shard counts toward the 3000, the head included, a hit inside the five code characters counts for no line): 17 of 66 / 36 of 66 (all fragments; the planner's 28 and 45 used another sample of fragments), a refusal costs at most 0.16 / 0.63 ms; every one of the 21 real words answers at both sizes. File check (a 32 KB file of the shape, with the builders and `process.cpuUsage()`), cold / warm: lists ok 1.57 / 0.94 ms (3x: 3.59 / 0.94); lists with 50 errors 2.18 / 1.09 (3x: 3.44 / 1.10); lists of 2000 unknown ids 2.65 / 2.03 (3x: 3.91 / 2.18); homebrew ok 1.41 / 0.63 (3x: 2.50 / 0.62); homebrew errors 1.41 / 0.78 (3x: 2.81 / 0.78). The homebrew file of the script is 34.6 KB (a little over the cap), so it is an upper bound.
- Worker bundle (`npx esbuild preview/public/_worker.js --bundle --format=esm --minify`, then gzip): before 282,136 B / 65,552 B gzip, after 327,961 B / 80,280 B gzip (+14.7 KB; the Workers free-plan limit is 3 MB compressed).
- Sizes: `apidata/` and `api/v1/catalog/` 108 files today (one search shard of 204,395 B), 214 at 3x (3 shards of 262,071, 262,062 and 95,796 B); about 91 files left under 20,000 at 3x. `eq_weapon` tier 3 table file with `f` stays within 131072 B at 3x (`tools/api-data.test.mjs`).
- Commands run (exact, from the worktree root; results):
  - `node tools/build.js` - ok (108 files, 54 chunks, 1 search shard).
  - `node --import ./tools/ts-hooks.mjs --test --test-reporter=dot preview/worker.test.mjs preview/api/api.test.mjs preview/api/mcp.test.mjs tools/api-data.test.mjs` - all pass.
  - `node --test --test-reporter=dot tools/check-site.test.mjs` - all pass.
  - `VITEST_MAX_WORKERS=2 npx vitest run app/src/lib/data.test.ts app/src/lib/importReport.test.ts app/src/lib/homebrewReport.test.ts app/src/components/importLines.test.ts app/src/components/importPanel.test.ts app/src/components/homebrewImport.test.ts` - 221 pass, 0 fail.
  - `npm run typecheck` - 0 errors, 0 warnings; `npx eslint` on the touched paths - no issues.
  - `node tests/derived.js` - everything matches; `node tools/decisions.js` - 340 decisions; `node tests/run-all.js contracts,dataint` - passed.
  - Re-run by the finishing implementer (2026-11-13), all pass: `node tests/derived.js`, `node tools/decisions.js` (340), `node tools/build.js`, the node test lists above, `VITEST_MAX_WORKERS=2 npx vitest run` on the six files (232 pass, 0 fail), `node tests/run-all.js contracts,dataint`.
  - `VITEST_MAX_WORKERS=2 rtk npm run check:fast` - PASS in 680 s (output read): 100 files, 4634 tests, coverage 95.91 % statements, bundle 275.3 kB of 276 kB.
- Gates: CI's green run of the tip is the full gate (the orchestrator).

## Deviations
- File-check lines are capped at the first 50 for a good file too (skip lines of a lists file, note lines of a homebrew file); `more` counts the rest, and `counts` stay whole. Plan step 8 and `CONTRACTS.md` had no cap on them (only errors were capped by the parse at 50). Reason, measured in step 13: a 32 KB lists file of 2000 unknown ids made 2108 skip lines, a 283 KB answer and 4.4 ms warm locally (about 5 times that in production, past 10 ms); with the cap the same file costs about the parse. Default taken (owner AFK); `CONTRACTS.md` section 6, `openapi.json` (`lines`, `more`) and a test state it. Revert by removing `LINES_MAX` in `preview/api/service.mjs`.
- The file-check data sets and rule-card objects are built once per cached `apidata/file-check.json` (a `WeakMap`), not per request: a per-request build cost grew with the catalog.
- Alt tables: `table=alt_item` selects the lines whose `kind` is `item` and `table=alt_consumable` those whose `kind` is `consumable` (both with a rarity), not both kinds for each as plan wording read literally; the test over `apidata/tables.json` proves the set equals the table's rows (120 and 120).
- The step 12 parity tests live in `tools/api-data.test.mjs` (they need the real catalog and the tripled one), not in `api.test.mjs`, which stays on the pinned 103-record fixture catalog.
- `parseSearch` (rest.mjs) parses `q` once and hands the terms to the service, so the 8-term bound and the "no terms reads as absent" rule decide in the adapter; the service takes `terms`.
- A parameter given twice is 400 on every query parameter (`part`, `filter` too), not only on the search ones.

## Next batch (implement-ready)
- Name: B2b - the two pages, the footer, the import links (`plan.md` section 6). It needs no mock and follows B3 (the developer page lists every operation once, now eleven with `searchRecords` and `checkFile`).
- After landing 3 (the orchestrator, not a commit): B3 step 14's readings (cases (f), (a)-(e), (g); the pass line of step 14); the OpenAPI `ETag` of live check 1 starts `1.2.0-`. K of step 1 is 3.01.
- Fallbacks if a reading fails: search - display names as a capitalization delta, then shard skipping by facet codes (`plan.md` B3 "Fallbacks"); file check - the cap stays 32768 B and the Edge Function option goes to the owner.
- A usable fact for step 14: a cold file check reads `apidata/records/index.json` and `apidata/file-check.json` (one extra file family), a cold search reads the index and the shards; cold file check locally 1.4-2.2 ms today.

## After B3
- Fix pass (review `reviews/B3.md`): Blocker 1 fixed (the file check decodes strictly like the app: non-UTF-8 text answers `not_json`, and 32768 bytes of 0xFF no longer answer 413); nits N1-N4 done.
- Step 14, risk R1 (reviewer prediction from step 1's model, cold = 4.902 + 3.01 x (local - 0.310) ms): the file check's cold CPU, REST, today 8.2-11.9 ms (homebrew ok 8.2, lists ok 8.7, lists with 50 errors 10.5, worst case a lists file of 2000 unknown ids 11.9); at 3x the catalog 14.8-15.7 ms; MCP adds about 2.5 ms. Warm burst p50 for the 2000-id case predicts 9.3 ms against the 8 ms line.
- The plan's claim that the file check's cost does not grow with the catalog is contradicted: the same lists file reads 1.57 ms cold local today and 3.59 ms at 3x.
- Step 14 case (d) uses the worst lists shape: one lists file of 2000 unknown ids (about 32 KB, 2108 lines before the cap, a 283 KB answer before LINES_MAX). Landing 2 showed p99 up to 17.1 ms with 0 exceeded-CPU counts, so a reading past 10 ms may not be a refusal; only production can tell.
- A failed file-check reading goes to the owner as the plan says (Edge Function option, cap kept at 32768 B).
- R3: the app bundle has 0.7 kB left of 276 kB (275.3 of 276). B2b adds footer links to `Shell.svelte` and changes the import hints in the main chunk; read `.claude/README.md` before any budget raise.

## Blockers
- None for B2b: B3 is pushed; B2b lands with it at landing 3.
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
- Session end partial progress (if any): B5 planner refresh (2026-11-12) stopped at the usage wrap-up after the reading step; no plan, context or mock file is written yet, 1 path dirty (this file). Findings to fold in, each still to write:
  - The test project's `site_url` (`http://localhost:3000`) and redirect list are `supabase/config.toml` `[remotes.test.auth]`; only the owner runs `npm run config:push` (it needs a TTY). Recommended: keep them; step 1 reads the authorize redirect's `Location` in Node and never loads it.
  - plan-B5a-R6: `.claude/README.md`, "Supabase configuration", rule 2 says CLI 2.117.0's template held `[auth.oauth_server]`, deleted as not owned, so `config:push` leaves it. Recommended: own it (base `enabled = false`, the test project's values under `[remotes.test.auth.oauth_server]`, field names read with `npm run config:diff -- --project test`).
  - Production `site_url` ends in `/`, so the consent URL may come out `//connect`: probe it in step 8, with a router fallback.
  - The section must not draw a failure line while the OAuth server is off: step 1 measures `listGrants` with the server off.
  - The B5a acceptance probe is defective: `print_sets` has no grant to `authenticated`, so an app token also gets 403. Probe `GET /rest/v1/user_prefs?limit=1` instead.
  - Print tool, default taken (owner AFK): add `POST rpc/create_print_set` alone to the guard's list (`get_print_set` stays refused). B5b adds `POST /api/v1/me/print-sets` and MCP `create_print_set`: 1-180 cards `{ id, count? }`, unknown catalog id 400, `limit_reached` 409, 200 with `<site>p/<id>`. No product-law or grant-level change, so NEEDS_HUMAN_CONFIRMATION stays no. A second plan look (`reviews/plan-B5a-2.md`) is recommended, but `agent-guard.mjs` cannot enforce it.
  - Disconnect keeps the browser confirm (rule 10: the app cannot write a revoke back), then a toast.
  - auth-js types: `client.name`, `uri`, `logo_uri`, `redirect_uri`, `user.email`; grants have `client`, `scopes`, `granted_at`.
  - Next step: a fresh planner pass with this brief. Draw the mock under `issues/ai-mcp/mocks/`, then edit B5/B5a/B5b, section 7, the B5a guard line, the handoff Blockers and context.md, then commit.
- Durable items written to their homes this pass (file, section): none outside `issues/ai-mcp/` (a planner pass); D10 goes to `docs/decisions/` in B3.
- Issue 72 stays open until the account-level read ships (`C:\Users\Ignat\.dhloot\notes\57\ai-mcp-closeout-posts.md`, A2; placed in B5b).
