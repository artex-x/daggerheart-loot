# Review - plan before B2a (ai-mcp)

Verdict: fix-then-continue
Reviewed: db90cd027d3855c5e3b88b2f8df7b597e072dbb0
Scope: plan before B2a

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

Tree: `db90cd02` (clean). Read: `plan.md` (Status, 3.2-3.8, 4, 5.1, 6 B2a/B3/B2b, 7, 9-11),
`handoff.md`, `context.md`, the owner notes `ai-mcp-live-checks.md` and `ai-mcp-docs-page.md`,
the shipped code (`preview/api/service.mjs`, `rest.mjs`, `read.mjs`, `openapi.json`,
`preview/worker.mjs`, `preview/public/_routes.json`, `tools/api-data.mjs`,
`tools/build-share-pages.js`, `tools/build.js`, `app/src/lib/apiRecord.ts`, `hash.ts`,
`search.ts`, `cloudLists.ts`, `app/src/state/app.svelte.ts` `linkToRecord`,
`ImportPanel.svelte`, `HomebrewImport.svelte`, `TablesPage.svelte`), the tests and fixtures
that pin `/mcp` (`tests/contracts.js`, `preview/worker.test.mjs`,
`docs/fixtures/urls/preview.json`, `tools/check-site.lib.mjs`, `tools/collect-site.sh`),
`CONTRACTS.md` sections 5-6, `llms.txt`, the D6 and task-57 decision files, the hooks.
MCP spec read with `curl` on 2026-11-12: `2026-07-28` Streamable HTTP, versioning,
`server/discover`, tools; `2025-11-25` transports.

Local measurements (read-only probes, this host, Node 24, 2026-11-12):

| Probe | Result |
|---|---|
| `cardVersions()` called from the `api-data.mjs` process under `ts-hooks` | works, 1.2 s; 1593 ids, every `buildIndex` id held, values 6-8 characters |
| B1 `std` roll CPU, in memory (roll parse, `buildIndex`, 4 x 64 KB chunk parse) | 1.78 ms |
| B2a design, warm (cached index, 4 x decode + split, one line parse per result) | 0.50 ms (28 % of B1) |
| B2a design, cold (roll parse and `buildIndex` once more) | 0.84 ms (47 % of B1) |
| `foldQuery` over B3's search text (`id`...`ru`,`en` lines, 156 KB) | 36 ms; at 3x (470 KB) 79 ms |
| `foldQuery` over the names only (87 KB) | 10.9 ms; `toLowerCase` of the same 0.62 ms |
| split every B3 line into columns (244 KB today, 730 KB at 3x) | 1.9 ms today, 5.3 ms at 3x |
| names whose `foldQuery` differs from `toLowerCase` | 76 of 3186 |

Production ran B1's `std` roll at 7.5-17.5 ms against 1.78 ms here, so the worker is about
4-10 times slower than this host.

## Blockers

B2a (apply before B2a):

1. **plan-B2a-1. Step 4 can pass on 403 answers.** B2a step 4 and the handoff ("After B2a") say
   "the measurement in the owner's Chrome: send 10 `POST` ...". A request that a page script
   sends from Chrome carries `Origin`, and `/mcp` answers 403 to every `Origin` (step 3.3), so
   the 10 MCP rolls measure the 403 path. Pages Metrics "errors" do not count a 4xx, so the
   pass line "no error" holds. Change step 4 and the handoff line: send every burst with `curl`
   from the shell (no `Origin`), as `context.md`, "Method", already says; use Chrome only for
   the dashboard. For the MCP burst, name the request: a legacy `tools/call` `roll` with
   `MCP-Protocol-Version: 2025-06-18`, `{"section":"std","dice":3}`. Record each status, and
   for MCP that no result has `isError`. Read the bucket's request count and repeat the burst
   when it is not 10.
2. **plan-B2a-2. The MCP body cap contradicts D10 and freezes.** Step 3.3 and the acceptance
   set 413 past 262144 B, parsed whole below it. D10 rejects a 262144 B file-check cap because
   "a 256 KB parse alone passes 10 ms at the measured rate", and section 11 says a cap that a
   client meets may rise, never fall. Set the `/mcp` body cap to 65536 B in step 3.3, the
   acceptance, the `too-large` fixture and `CONTRACTS.md` section 6. Reason: about 2-3 ms of
   parse on the worker, and it holds B3's `check_file` with a 32768 B file (JSON escaping adds
   about 1.3 times). B3 raises it if its own reading needs more.
3. **plan-B2a-3. The `/mcp` serve row stays a static 404, and the tests cannot see it.**
   `docs/fixtures/urls/preview.json` `serve` holds `{ url: <site>mcp, static: true, status:
   404, why: "reserved for the ai-mcp task" }`. Both route helpers (`tests/contracts.js` and
   `preview/worker.test.mjs`, `routed`) say "a route `/x/*` matches a path that starts with
   `/x/`", so `/mcp` reads as not routed after `/mcp/*` is added, and the stale row passes. The
   live check of 2026-11-12 found the opposite: `/api/*` also takes bare `/api` (the JSON 404),
   and step 3.4 states it. Add to step 3.6 and the file list: replace the row with a worker row
   (`GET /mcp` 405, `why`: "the MCP endpoint takes POST only"); change both `routed` helpers to
   `p === r.slice(0, -2) || p.startsWith(r.slice(0, -1))`, with the comment "as the live probe
   of `/api` shows Pages matches it"; the step 3.7 probe proves the same on the deploy.

B3 (not implement-ready; the batch goes back to the planner before it starts):

4. **plan-B2a-4. B3's search cannot fit 10 ms.** B3's decision text says that a request
   "reads every shard as text, folds it once with `foldQuery` ... filters lines by the facet
   columns". `foldQuery` maps every character through `normalize('NFD')`: 36 ms here over
   today's text and 10.9 ms over the names alone, so several times the 10 ms limit on the
   worker. To split every line into columns costs 1.9 ms here today and 5.3 ms at 3x, which
   is also past the limit on the worker. D10's cost model counts only the JSON parse rate.
   The fix needs design work: fold at build time, and use an access path that does not touch
   every line per request (for example, a folded names blob scanned with `indexOf` and mapped
   to its lines, and build-time id lists per facet value for a facet-only query). It also
   moves the shard budget and the "at most five files" rule. What the planner applies now:
   set B3's heading and Status to "needs a planner pass on the search projection before B3";
   write the measurements above into `context.md`; add a Status line "Plan review: required
   before B3 (trigger: a public contract change - two operations, two tools)"; and change
   line 21 of Status ("so B3 and B2b need no line of their own").
5. **plan-B2a-5. The file-check lines need record names that the lean context does not
   hold.** B3 step 8 requires that "a file check's `lines` equal what the component renders".
   `ImportPanel.svelte` `where()` and `skipLine()` name the record through
   `app.index?.byId.get(id)` and `nameOf`. B3 gives the worker catalog ids and
   `file-check.json` only, and it must not read `names.json`. The builders also return
   structured `Line`s (`pos`, `name`, `item`, `text`, `path`), not the `{ ru, en }` strings
   of the answer. In the B3 pass, decide and write down: (a) the builders take a name lookup
   that the app fills from its index and the API leaves empty, so the API lines carry `item`
   ids and no names, as a named departure in Standing check 3 and `openapi.json` (recommended:
   no new read); or (b) a lean id-to-name projection, with its size at 3x. Also write down one
   pure function that joins a `Line` into the text of the answer, and the parity test over
   the structured lines.
6. **plan-B2a-6. `check_file` caps characters, REST caps bytes.** B3 step 6 says the MCP `file`
   argument is "at most 32768 characters". A Russian homebrew file of 32768 characters is about
   60 KB of UTF-8, which is two times the bytes that REST takes and that the CPU estimate
   uses. In the B3 pass, write "at most 32768 B as UTF-8", checked in `runOperation`, so both
   adapters answer the same `too_large` (MCP as an `isError` result).

## Risks

1. **R1. The p99 of 10 samples is the slowest sample.** Here the cold path costs 47 % of B1 and
   the warm path 28 %. With the worker 4-10 times slower and a fixed cost per request, a cold
   first request can exceed 5 ms (`std`) or 2 ms (record) while the warm ones pass. B3 step 1
   stops on a record p99 above 2 ms. Recommended: send one warm-up request, wait for a new
   bucket, then send the burst; record p50, p75 and p99; judge the cost model on p50 and the
   limit on p99. Write this into step 4 and B3 step 1.
2. **R2. The rest of the warm cost is decoding and splitting four 64 KB texts.** That is
   0.5 ms here. Keep each chunk's split lines in the isolate cache for `CACHE_MS`, with the
   same `data_version` check (about 3.5 MB at most today and about 10 MB at 3x, against the
   128 MB isolate). This removes that cost with no file and no contract change. Name it in
   section 3.5 and B2a "Fallback" as the first fallback, before the 60 per-total files that
   use the file margin.
3. **R3. `tools/call` arguments have no type rule.** REST path values are always strings. Through
   MCP, a missing `id` or a number `part` (`2` for tier 2) reaches `runOperation`, and the
   answer is a 404 "does not exist", which misleads a model. Add to step 3.3: before
   `runOperation`, a missing required argument, or a path or query argument that is not a
   string, gives an `isError` result with the 400 `bad_request` envelope that names the
   field. Each `inputSchema` property also takes the parameter's `description` (it is on the
   parameter object in `openapi.json`, not in its `schema`). Add one fixture.
4. **R4. B3's file-check CPU counts only the JSON parse.** "About 4.5 ms for a 32 KB file at 3x"
   leaves out the parsers' validation and the report builders, and an MCP `check_file` parses
   the file twice (the envelope and the file). In the B3 pass, add a local `process.cpuUsage()`
   step for both parsers at 32768 B, as B2a step 2.4 does, and an MCP `check_file` burst in
   the landing-3 readings.
5. **R5. B2b leaves out the browser suite's footer assertion.** `tests/app/states.js` asserts
   that `.foot-nav a` equals `['/pages/install.html', '/pages/privacy.html',
   '/pages/terms.html']`. Add `tests/app/states.js` to B2b's files, and add `node
   tests/run-all.js app/states` (after `npm run build:test`), or CI's `e2e`, to its
   verification and gate cost.
6. **R6. A cloud client that sends `Origin` gets 403.** The plan names this risk and its
   fallback. The owner's connector test after landing 2 is the only proof. Keep the test.

## Nits

1. N1 (local). `llms.txt` lines 99 and 329 say that a `?v=...` "is a version for a messenger's
   cache; ignore it". After D9 the API's `link` carries `?v` "store it as given". Change step
   1.6 or 3.9 to "ignore it when you read the id; to hand a record on, give the API's `link`
   as it is".
2. N2 (local). `llms.txt` "Read this first" item 3 says that every name and id "must come out
   of `catalog-index.csv` or `catalog.csv`". The new item 1 sends agents to MCP and the API.
   Add "or from an answer of the MCP tools or the read API". Step 3.9 also leaves the summary
   blockquote ("a public read API") unchanged. Name the MCP endpoint there.
3. N3 (local, plan text). Section 5.1, the last bullet ("no `?v`, as `catalog.csv`'s `url`"),
   and the section 3.2 CPU cell ("parses at most about 290 KB today") are stale after B2a.
   Update them, or point them to D9 and section 3.5.
4. N4 (local). The 3x test of `tools/api-data.test.mjs` must pass a versions map with an
   8-character value for every synthetic id, or the 3x budgets leave out about 22 B a record.
   Add this to step 1.3.
5. N5 (local). The minimum fixture list of step 3.5 has no `initialize-2025-03-26` and no legacy
   request without `MCP-Protocol-Version` (served as `2025-03-26`, as the spec allows). That
   support is a frozen promise (section 7 default). Add both fixtures.
6. N6 (local). Step 3.5 says "returns the REST answer's bytes". REST writes
   `JSON.stringify(body) + '\n'`, and `content[0].text` has no newline. Compare
   `text + '\n'` with the REST body, or compare the parsed values, as the acceptance says.
7. N7 (local). A modern request whose `_meta` version is a legacy one (`2025-11-25`) gets
   `UnsupportedProtocolVersion` with that same version in `supported`. The spec allows this
   (its example lists `2025-11-25`), but D4 should state the rule: a legacy version is reached
   through `initialize`.
8. N8 (local, B2b). The panels' "AI assistants" link must go through `app.pagesDir + 'ai.html'`,
   as the footer link does, so that the English UI opens `pages/en/ai.html`. Step 4 says only
   `ai.html`.
9. N9 (local, B2b). After B2b, `ImportPanel.svelte` and `HomebrewImport.svelte` draw the same
   file row (`ImportFile` and `.links`). That is its second real use, so `CLAUDE.md` asks for
   one shared component and no inline copy. Add this to step 4, or name the reason it is not
   done.
10. N10 (local, B3). Section 3.8 point 4 says that B3 extracts the `TablesPage.svelte` facet
    composition into `lib/`. B3 step 4 rebuilds it in the worker and the build (`f`) and never
    extracts it. Add the extraction (a `facetValueOf(table)` beside `passes`), or change
    section 3.8.
11. N11 (local). The handoff "Completed" entry of the planner pass has no "Files changed" line.
    Also record that the merge-back `1b99e6d4` differs from `origin/main` (`aeb68c0e`) only
    under `issues/` (checked with `git diff --stat`). D6's gate for B2 ("CI's green run of that
    tree") therefore rests on main's green run of the same code tree. `1b99e6d4` and `db90cd02`
    are not pushed yet; push them with B2a.
12. N12 (deferred-scope). `/mcp/` with a trailing slash answers 404 (step 3.5 pins it). A pasted
    URL with a slash then fails. Consider serving `/mcp/` as `/mcp` before v1 freezes the
    answer; it is not needed for B2a.
13. N13 (local, B2b). The `tools/collect-site.sh` guard names each published page
    (`pages/privacy.html` ...). Add the four new pages, so that a missing page fails the
    deploy.

## Deviations

- B2 is split into B2a and B2b, and the order is B2a, B3, B2b (handoff, "Deviations"). Accepted
  for B2a: the split criteria (a public contract of its own and a production reading the
  harness cannot make) are real. The order B3 before B2b depends on B3, which goes back to the
  planner (Blocker 4). If B3 slips, the planner decides whether B2b waits or lands alone, and
  D8's landing 3 text should allow that.
- The record-link change rides in B2a, not in a B1b. Accepted: it uses the same files and the
  same review. The claim that it is not a v1 break holds. `openapi.json`'s `link` has no
  description, `CONTRACTS.md` section 5 already says that "the app and every tool hand out a
  record as `<site>i/<id>?v=<v>`", and the frozen path forms do not change.

## Standing checks

1. Scale: checked - B2a sizes: about 20 B a record for the two links (measured values 6-8
   characters), chunk count 54 to about 56, file margin about 93 at 3x; the 3x test needs the
   versions map (N4). The MCP body cap is wrong for the CPU limit (Blocker 2). B3's shards fail
   the CPU limit (Blocker 4). B2b's States table covers 360 and 1180 px for the footer, both
   panels and the static pages; no list, fold or sticky region changes.
2. Error scenarios: checked - B2a: no write path and no stored shape; a failed read gives 503
   or `isError`; a deploy between reads gives one re-read, then 503; a revert restores bare
   links, and a stored `?v` link still opens (the host ignores the query). Step 4 can report
   a false pass (Blocker 1). Wrong argument types give misleading 404s (R3). B3 and B2b: no
   write and no stored shape.
3. Consistency: checked - the MCP answers equal the REST answers, and the named departure is
   that a tool error is a 200 result with `isError` (spec: tool execution errors). The link
   rule equals `linkToRecord` for the catalog, `#/h/` and the no-`hid` case (`app.svelte.ts`,
   `cloudLists.ts` `itemOf` and `snapshotRecords`, and `cardVersion` over the same record).
   `llms.txt` says "ignore it" against "store it as given" (N1). B3's file-check lines leave
   out the names without a named departure (Blocker 5). The B3 facet composition is not
   extracted (N10). The B2b file row is copied, not shared (N9).
4. RU/EN parity: checked - B2a adds no person-facing string; the tool texts, `instructions` and
   errors are English, as `openapi.json` is. B2b gives both languages for each new string, with
   the same facts; the English hints use ASCII straight quotes and the Russian ones use
   guillemets. B3's `lines` lose the per-language record names (Blocker 5).

Owner rules: checked - record links with `?v` (owner, 2026-11-12): home D9 and `CONTRACTS.md`
section 6, both written in B2a step 1.6 and step 3.10; the documentation notes (owner,
2026-11-12): home B2b, then the pages; the `llms.txt` crawl line and "Read this first" item 1
(note 6): B2a step 3.9; the two panel links (revision 7b): B2b. Each rule has its home inside
the batch that writes it. No "Owner insights" rule applies.

## Suggested next action

1. Recommended: the planner applies Blockers 1-3 and the local nits N1-N11 and N13 to B2a and
   B2b. It applies Blockers 4-6 now only as written: B3 is marked "needs a planner pass on the
   search projection before B3", the measurements go into `context.md`, and a "Plan review:
   required before B3" line is added. Then the implementer starts B2a with no second look.
   Reason: B2a is independent of B3, and production's `std` roll runs at the CPU limit today.
   Trade-off accepted: B3, and with it B2b and landing 3, wait for a planner pass and a
   second plan review.
2. Not recommended: verdict `replan` for the whole plan. It is the strict reading of "a
   finding that needs a redesign" (Blocker 4), but B2a then waits for a B3 redesign that it
   does not depend on.

The decision between the two is the orchestrator's. Option 1 stays inside the one remediation
cycle for B2a. B3 gets its own review.

## Checks still needed

- After landing 2: the step 4 readings with the corrected method (Blocker 1, R1), and the
  `--preview` probe that shows `/mcp/*` taking bare `/mcp` (Blocker 3).
- The owner's Claude connector test with "No sign in" (does the cloud client send `Origin`?).
- The parse and builder CPU of `parseBundle` and `parseHomebrew` at 32768 B (R4), for the B3
  pass.
- Not verified here: whether the Pages Metrics 3-minute range can hold one burst alone when
  bursts are 3 minutes apart. The B1 reading used it once, so it probably can. Read the
  request count each time.
