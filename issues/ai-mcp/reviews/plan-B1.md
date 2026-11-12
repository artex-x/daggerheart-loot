# Review - plan before B1 (ai-mcp)

Verdict: fix-then-continue
Reviewed: 342c91c405dd2b0f4c60aaedeed088c435902122
Scope: plan before B1

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

The architecture holds: option (c), one stateless Pages worker, build-time
projections, the app outside the API. The host facts are true: `d0fd98bc`
and `1ace55e7` exist, `/mcp` is reserved (`CONTRACTS.md` section 5,
`collect-site.sh` guard, `check-site.lib.mjs`, `tests/contracts.js`,
`worker.test.mjs`), and `handle()` can route `/api/` after the host guard and
before the `GET`/`HEAD` check. Moving `ROLL_TABLE`/`PICKER_ROLL` is safe. B1
is not implement-ready yet: six defects below are in the plan text, and each
has a fix that needs no redesign.

## Blockers

1. B1-gate - the CI gate does not run the new tests, and the current preview
   stage breaks (local). `npm run check` runs the stage `test:preview` =
   `node --test --test-reporter=dot preview/worker.test.mjs`
   (`tools/check/lib.mjs`), with no `--import`. `npm --prefix preview test`
   is in no gate. Today the worker imports only `markup.ts`, which imports
   nothing. After B1 it imports `roll.ts`, `std.ts`, `alt.ts`, `data.ts`,
   `rollTables.ts`, whose `./numField.js`, `./label.js` specifiers Node cannot
   map to `.ts` without `tools/ts-hooks.mjs`. `preview/api/api.test.mjs` and
   `tools/api-data.test.mjs` are named in no stage ("add it to the
   `node --test` list of `tools/check/`" names no list that exists).
   Change: in B1 "Files expected", add `tools/check/lib.mjs` (stage
   `test:preview` becomes `node --import ./tools/ts-hooks.mjs --test
   --test-reporter=dot preview/worker.test.mjs preview/api/api.test.mjs
   tools/api-data.test.mjs`, or a new stage `test:api`) and
   `tools/check/lib.test.mjs` (it pins the stage names). Add that command to
   "Verification commands". Keep the `preview/package.json` script equal to it.

2. B1-scale - the largest table is `eq_weapon`, not `dv`, and its projection
   passes the budget today (local). Measured 2026-11-10 on this host from
   `data.js`: `eq_weapon` 512 rows, `eq_secondary` 148, `eq_armor` 118. The
   lean rows of section 3.5 (id, roll, names, kind, part, tier, rarity, eq)
   are 153,438 B for `eq_weapon` today and about 460 KB at 3x, against the
   131072 B budget of `apidata/table/<table>.json`. Without `eq` they are
   about 90 KB today and 270 KB at 3x. Step 5's synthetic 3x test fails as
   written. Section 3.4 "at most 435 rows at three times today's largest"
   and Standing check 1 "at most 145 today (`dv`)" are wrong.
   Change: drop `eq` from the table projection (a client reads stats from
   `records/{id}`), and split each `eq_*` table by tier into
   `apidata/table/<table>/<tier>.json`. Pick one contract: `part` (the tier)
   is required on `eq_*` tables and a missing `part` answers 400 with the
   part list, or the service joins the tier files only while the answer
   stays under the budget. Correct section 3.4, 3.5, 5.4 and Standing check 1
   with the 512 / 1536 row counts.

3. B1-homebrew - the inputs of a request-time homebrew record are not
   defined (local). `apiRecord(index, it, site)` needs an `Index`, and the
   worker has none. A homebrew item may name catalog rule cards and a
   catalog set (`homebrew.ts`: `set` "a catalog set's key or an own set
   card's", `refs` "1-3 keys of catalog or own rule cards"). The snapshot of
   `homebrew_item_record` embeds only own cards; catalog rule-card text is in
   no projection and not in `names.json`. `craft.from` comes from
   `index.craftedFrom`, which is empty for a one-record index, while the app
   draws the author's related items from `get_homebrew_item`'s `related`.
   `art.ts` `ART_BASE` is empty in Node and in the worker (`import.meta.env`
   is undefined), so an own picture URL cannot come from it.
   Change: in step 4 add `apidata/cards.json` (the catalog `refs` and `sets`,
   about 30 KB, budget 65536 B). In step 6 state that the service builds
   `buildIndex({ items: { homebrew: [record, ...related] }, refs, sets })`
   from the snapshot, `related` and `cards.json`, and that `site` carries the
   Storage base from `env.SUPABASE_URL`. Say the same for each homebrew entry
   of a shared list. Add a homebrew item that names a catalog rule card and a
   catalog set to the `apiRecord.test.ts` cases.

4. B1-cpu - the 262144 B caps on `get_homebrew_item` and `get_shared_list`
   are past the measured CPU rate (local). `.claude/README.md`, "Quotas,
   recovery and failure": the full `/h/` read of 1,745,628 B cost 43-71 ms
   CPU. That is about 25-40 ms per MB, so 262144 B is about 6.5-10.5 ms
   before `names.json` (cold parse 1.4 ms) and `apiRecord`. The decision "A
   link preview reads a lean projection" rejected a byte bound on
   `get_homebrew_item` for this reason. Past 10 ms Cloudflare answers its
   own error, not the 422 of section 5.1. The plan's own rule (section 3.5,
   "every request-time read under 64 KB") also contradicts the caps.
   Change: set both caps to 65536 B (the `ITEM_MAX` precedent), name in
   Standing check 1 how many catalog and homebrew entries fit under that cap,
   and add to the owner step a CPU reading of one item and one list at the
   cap (seeded on the test project). D1 states why the API takes the full
   reads that the cards rejected, and what the cap is.

5. B1-fixtures - "byte for byte" fixtures over the real build churn on every
   data edit (local). Step 10 compares answers from the built `apidata/`
   with `docs/fixtures/api/v1/<case>.json`. `data_version` and `ETag` change
   on every `data.js` change, and a record fixture changes with its text, so
   every `add-source` or text batch must regenerate contract fixtures. A
   regenerated fixture proves nothing.
   Change: render the test's `apidata/` from a small pinned catalog
   committed under `docs/fixtures/api/v1/` (a `Loot` slice with one record of
   each case of step 3) through the same `tools/api-data.mjs` code, and pin
   the fixtures to it. Against the real build, assert only schema, budgets
   and the pool equality of step 5.

6. B1-licence - owner question Q2 must gate the first publish of v1, not B4
   (local). v1 is frozen (D3). B1 publishes every source's full text, also the
   paid supplements that `LICENSE` keeps "as a play aid only", and section 8
   invites Charkeeper to import it. If the owner answers Q2 = B later, v1
   loses rows and records, which D3 calls a break. No record says under
   which licence its text is, and the DPCGL notice is in no answer.
   Change: in Status and section 7, Q2 blocks the B1 squash onto `main` (not
   the implementation). Add to the record v1 a field `rights`:
   `{ "licence": "dpcgl" | "owner", "notice": "<text>" }` from the source id,
   and the DPCGL notice in `openapi.json` `info`. Put the field in the
   `apiRecord.test.ts` cases.

## Risks

1. B1-cache - cached files and fresh files can come from two data versions
   (local). The worker keeps `rolls.json`, `tables.json` and
   `records/index.json` for 10 minutes; `worker.mjs` itself says "an isolate
   can outlive a deployment". Chunks are packed by size, so a data change
   moves ids between chunks: a cached `index.json` with a fresh chunk answers
   404 for a record that exists, and the `ETag` names the wrong version.
   Change: each `apidata/` file carries `data_version`. On a mismatch with a
   cached file, or on an id missing from its chunk, the service reads the
   index again once. The `ETag` comes from the files of this answer. Add a
   test with two versions of the stub `ASSETS`.

2. B1-roll-read - the plan does not say how a roll result gets its record v1
   (local). The lean roll file has no text. A `std` or `alt` roll then reads
   up to four record chunks (up to 4 x 64 KB) plus the roll file plus a cold
   `index.json`: six reads and about 300 KB to parse, against section 3.5's
   "at most five files a request". Section 3.2 says "each read at most
   64 KB" while 3.5 gives 131072 B budgets.
   Change: write the read path in step 6, correct the read count and the
   3.2 cell, and name the `std` roll as the heaviest case in the owner CPU
   step.

3. B1-headers - API answers carry other people's text on the app's origin,
   where `localStorage` holds the session (local). `answer()` in
   `worker.mjs` sets `text/html` for every body, and `failed()` answers a
   thrown error with the HTML card. A reuse of either serves JSON or an error
   message as HTML.
   Change: `rest.mjs` has its own JSON responder. Every API answer, also a
   thrown error under `/api/`, is JSON with `X-Content-Type-Options:
   nosniff` and `Content-Security-Policy: default-src 'none';
   frame-ancestors 'none'; sandbox` (an API answer is not an app document,
   so the cross-host table's objection does not apply). An error message
   names the field by its schema name and never echoes the raw path or body.
   Route `/api` (bare; Pages sends it to the worker, `tests/contracts.js`)
   to the JSON 404. `openapi.json` says that homebrew text and list notes are
   user content in the markup subset, to escape before display.

4. B1-law - copies of the product law that the plan leaves out (local).
   `PRODUCT.md` line 78, `META.md` section 3 first paragraph (line 104),
   `.claude/README.md` line 3625, `README.md` line 333 (and its Russian
   twin), and `llms.txt` line 336 ("there is no API"). In `META.md` section 3
   last paragraph, "an answer stays a few KB at any set size" and "keeps
   `names.json` in memory ... and nothing else" become false.
   Change: add these files to "Files expected" and to the acceptance line
   "say the same law and paths".

5. B1-ru-fallback - two rules for an empty Russian side (local). Section 5.1
   says an empty side is `""` and "never filled from the other language";
   step 3 builds names and text with `nameOf`/`descOf`, which fill Russian
   from English (`i18n.ts`). Change: keep the app's rule (Russian falls back
   to English per field, English never) and delete the 5.1 sentence, or name
   the raw fields instead of `nameOf`/`descOf`.

6. B1-privacy - the privacy pages describe what the host answers for a link
   (owner's call, local). "Link previews" says the server draws a card and a
   GM note never appears. After B1 the same host answers the whole list
   (with GM notes on a GM link) and the whole item to any program that holds
   the link. The plan's reason for no change holds in substance (the app
   already shows this to a link holder). Recommended: one sentence in both
   pages in B1, with the "Last changed" date, Russian and English with the
   same facts. Ask the owner.

7. B1-static-cors - unverified: Pages may send `Access-Control-Allow-Origin:
   *` on static files. Then `/apidata/*` is a free, unfrozen API that browser
   clients will find, and D3's CORS reason ("invites browser traffic onto the
   shared quota") is half moot (deferred-scope). Change: the `check-site`
   static probe of `apidata/version.json` records the header; `CONTRACTS.md`
   section 5 says `apidata/` is internal and changes without notice.

8. B1-glue - the roll glue is copied, not shared (local). The panels hold
   `rollPool(rows)[n - 1]`, the first part as the default and the typed clamp.
   The service and the step 10 test copy that glue, so the test cannot see a
   later change in a panel. Change: export `rowsOf(section, index, part)`
   from `rollTables.ts`, and call it from `App.svelte` (`rows` and `rowsOf`
   props) and from the service.

## Nits

1. Files expected (local): drop `vite.config.mts` (Vite does not copy
   `names.json`; `collect-site.sh` copies it from the root) and `std.ts`
   (`buildIndex` on the lean loot gives a full `Index`). Add
   `tools/check-site.test.mjs` (it enumerates `previewChecks()`),
   `tests/app/serve.js` (it answers every `_routes.json` include with the app
   document, so `/api/*` would too), `.claude/hooks/edit-guard.mjs` and
   `selftest.mjs` (block writes to the generated `apidata/` as for
   `names.json`), and the `CONTRACTS.md` "Fixtures:" paragraph, which
   `tests/contracts.js` reads.
2. `RollPanel.svelte` line 6 says "`ROLL_TABLE` in App.svelte"; the
   `App.svelte` module comment moves with the constants (local).
3. Damage (local): the catalog has only `dN` and `dN+K` values, and the
   homebrew rule is `/^d(4|6|8|10|12|20)(\+[1-9][0-9]?)?$/`. The `"2d6"`
   example in 5.3 and question 6 of section 8 ("`2d6+3`") name a value that
   cannot exist; `bonus` is never negative.
4. `parts[].rows` and `options.value.max` are the roll pool length, not the
   table length: `arazo` has 51 rungs, `ph` 48, `frames` 42. The example
   `"max": "rows of the part"` is a string in a number field (local).
5. Say that a section `id` is the slug without `roll/` (`vault_of_ages`,
   `std`, `alt`), and whether `dice` is required when `total` is typed
   (local).
6. Record chunk estimate (local): my estimate is 2.3-3.0 MB of neutral
   records (text and plain in both languages, refs and sets copied per
   record), 36-46 chunks today and 110-140 at 3x, not 20 and 60. The file
   margin holds (19,700 + about 190 < 20,000). `records/index.json` at 3x with
   suffixed ids comes near 65536 B; write the real counts from the build.
7. 45 Vault of Ages records carry both `tier` and `eq.tier` (equal today);
   say which one `tier` reads (local).
8. A `POST` with a `Content-Type` other than `application/json` answers 415,
   so a cross-site simple request cannot start a roll without a preflight
   (local).
9. Owner rule "OpenAPI is the one source for the MCP tools; no extension
   point before a second consumer" goes into D1 or D3 in B1, not only D4 in
   B2 (local).

## Deviations

- The handoff records one: `context.md` said `cloudflare-pages` had no
  commits. Accepted: `d0fd98bc` and `1ace55e7` exist, and the plan assumes
  the shipped host (section 3.7).

## Standing checks

1. Scale: checked - the plan's States answer (no screen), section 3.5
   budgets against `data.js`. Defects: `eq_weapon` 512 rows and 153 KB today
   (Blocker 2); the 262144 B read cap against the CPU rate (Blocker 4); the
   chunk count (Nit 6). Shared-list refusal at the cap is named; its entry
   count is not (Blocker 4).
2. Error scenarios: checked - no write path and no stored shape in B1. A
   failed read, a deleted item, a stopped share, a revert and a quota burn
   are named. Missing: two data versions across a deploy (Risk 1); a thrown
   error under `/api/` answers HTML (Risk 3).
3. Consistency: checked - URL ids from `ROUTES.md`, names from `dict.ts`,
   book order, roll semantics against `RollPanel`, `PickerRollPanel`,
   `StdPanel`, `AltPanel`; English-only errors are a named departure. Defects:
   the Russian fallback rule (Risk 5); the law copies (Risk 4).
4. RU/EN parity: checked - every reader-facing field is a `ru`/`en` pair from
   the app's functions; `openapi.json` and `llms.txt` are English developer
   text. A privacy sentence, if the owner takes Risk 6, needs both pages with
   the same facts.

Owner rules: checked - the 2026-11-10 owner statements in `context.md`
("what moves to the backend", "a general platform", "OpenAPI as the one
source", "no extension point before a second consumer") are design inputs
whose home is D1-D3, written in B1; one is placed only in D4 (Nit 9).
None is a `.claude/README.md`, "Owner insights" rule.

## Suggested next action

The planner applies Blockers 1-6 and Risks 1-5 and 8 to `plan.md` (sections
3.2, 3.4, 3.5, 5.1-5.4, 6 B1, 7) and lists Nits 1-9 as B1 lines. The
orchestrator asks the owner Q2 (now a gate of the B1 squash) and Risk 6. Then
the implementer takes B1 with no second plan look.

## Checks still needed

- One `npx wrangler pages dev` probe of the bundled worker with the `lib/`
  imports (the `.js` to `.ts` mapping and the bundle size), as the plan says.
- The owner's `deployment tail` CPU readings: a cold `std` roll, a record,
  `eq_weapon` (or one tier part), and a homebrew item and a shared list at
  the read cap.
- Whether Pages sends `Access-Control-Allow-Origin` on `/apidata/*` (Risk 7).
