# Review - plan before B3 (ai-mcp)

Verdict: fix-then-continue
Reviewed: 6f2afec62a3a37f1e7d286b4c1d51bf322bb8aa5
Scope: plan before B3

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

Tree: `6f2afec6` on `claude/ai-mcp`, clean, local. The planner commit changes only
`issues/ai-mcp/` (`git diff --stat 8019493d 6f2afec6`: 3 files).
Read: `CLAUDE.md`, `context.md` (with "B3 planner measurements (2026-11-12)"), `handoff.md`,
`plan.md` Status, 3.3-3.5, 4 (D10), 5.1, 6 (B2a outcome, B3), 7 ("B3 pass"), 9-11,
`reviews/B2a.md`, `reviews/plan-B2a.md`, the owner note `ai-mcp-live-checks.md` ("Landing 2
readings, 2026-11-12"), and the code that B3 builds on: `preview/api/service.mjs`, `rest.mjs`,
`mcp.mjs`, `read.mjs`, `openapi.json`, `tools/api-data.mjs`, `app/src/lib/search.ts`,
`filters.ts`, `data.ts`, `label.ts` `tableOf`, `apiRecord.ts`, `bundle.ts`, `homebrewFile.ts`,
`hash.ts` `recordUrl`, `ImportPanel.svelte`, `HomebrewImport.svelte`, `ImportLines.svelte`,
`TablesPage.svelte`, `dict.ts` (the refusal keys).
Coordinator message during the review (owner, chat, 2026-11-12): fallback 2 (per-total
`apidata/roll/std/<total>.json`) is dropped; the `std` roll tail stays, with no batch; fallback
1 (an isolate cache of split lines) stays the only optional step. This review does not judge
where the roll tail belongs.

Read-only probes (this host, Node 24, 2026-11-12, `node --import ./tools/ts-hooks.mjs`, no file
written):

| Probe | Result |
|---|---|
| Rows of each `apidata/table/` file against the records whose record v1 `table` is that table (`renderApiData` over `data.js`) | equal for 16 tables; `eq_weapon` 512 rows, 239 by `table` (273 missing); `eq_secondary` 148 / 73; `eq_armor` 118 / 69; `alt_item` 120 / 0; `alt_consumable` 120 / 0 |
| The same rows against `kind` (eq) and `rarity` plus `kind` (alt) | equal for all five: `eq_weapon` = `kind` `weapon`, `alt_item` = `rarity` not null and `kind` `item` |
| `index.searchable` against `[...index.byId.keys()]` (the shard and catalog order) | the same 1593 ids in the same order |

The production model, from the landing-2 readings (one cold request per case, bursts of 10):

| Quantity | Value |
|---|---|
| Slope from the cold readings, (6.360 - 4.902) / (1.170 - 0.310) | 1.70 |
| Slope from the burst p50s, (4.804 - 3.630) / (0.545 - 0.155) | 3.01 |
| The fixed floor under a request (the reading less slope x local) | about 4.4 ms cold, about 3.2 ms warm |
| Predicted cold REST search at 3x (local 1.8 ms): 4.902 + K x (1.8 - 0.310) | 7.4 ms (K 1.70), 9.4 ms (K 3.01) |
| The same at today's size (local about 0.86 ms) | 5.9-6.6 ms |
| Predicted cold MCP search at 3x: 8.913 + K x (1.8 - 1.170) | 10.0 ms (K 1.70), 10.8 ms (K 3.01) |

## Blockers

1. **plan-B3-1. B3 step 1's gate is not sound, and both of its clauses stop B3 for a reason that
   says nothing about the search.** The factor f = production / local assumes that production
   CPU is proportional to local CPU. The readings show a fixed floor of about 3-4 ms under every
   request (a record read is 3.6 ms at burst p50 for 0.155 ms of local work; the cards ran 3.1 ms
   p50 before B1). Divided by a small local number, the floor gives a large f: 15.8 for the record
   read against 5.4 for the `std` roll. The gate therefore measures the floor of the cheapest
   operation, not the slope that scales the search. The second clause ("the landing-2 pass lines
   met") fails on all three lines (`std` p99 17.1 against 5, record p99 8.1 against 2, MCP p99
   7.4 against 6). A 2 ms record line is below the floor, so no code can meet it. The intent of
   the gate is right: at f 5.5, 5.5 x 1.8 ms is about 10 ms, so the gate asks "does the cold 3x
   search fit 10 ms". Keep that question and compare differences, so that the floor cancels.
   Change B3 step 1 to:
   > 1. Gate on landing 2's readings (`context.md`, "Landing 2 readings"). (a) Every status was
   >    as expected, with no error and no exceeded-CPU count (met: 0 and 0 in 33 requests). (b)
   >    The slope K is the larger of (cold `std` roll - cold record read) / (1.170 - 0.310) and
   >    (burst p50 `std` roll - burst p50 record read) / (0.545 - 0.155), each pair read by the
   >    same method: 1.70 and 3.01, so K = 3.01. (c) The predicted cold REST search at 3x,
   >    cold record read + K x (1.8 - 0.310) ms, is at most 10 ms: 9.4 ms, met. If (a) or (c)
   >    fails, stop and hand back to the planner. The p99 of a burst of 10 is its slowest
   >    sample and is recorded, not gated: landing 2 shows 1.6-3.6 times the p50 in every case,
   >    with no exceeded-CPU count.
   Make the same change in the acceptance line ("Step 1's gate holds: (a) and (c) of step 1, or
   the batch stopped there"), in the handoff "Next batch" bullet that quotes the formula, in the
   last B3 risk bullet ("about 7.6 ms at B1's p50 factor of 4.2" becomes "7.4-9.4 ms at K 1.70-3.01
   over the 4.9 ms cold record read"), and in section 9, second bullet (the factor 4.2 model
   becomes the floor-plus-slope model with these numbers).

2. **plan-B3-2. The `table` facet answers a different set than the table of the same id, and v1
   freezes that meaning.** The plan compares the line's `table` code (record v1 `table`, which is
   `label.ts` `tableOf`) with `tableOf(param)`. The equipment tables hold every record with a stat
   block of their type (`equipOfKind`), and the alternate tables hold records by rarity, so
   `GET /api/v1/records?table=eq_weapon` answers 239 of the 512 rows of
   `GET /api/v1/tables/eq_weapon`, and `table=alt_item` or `table=alt_consumable` always answers
   `total` 0 (probe above). The fix is cheap and the probe proves it exact today. Change the
   design bullet "Facets" (step 2 of the search request) to: "`table` selects the table's
   records: for an `eq_*` table, the lines whose `kind` is the table's equipment kind
   (`EQ_TABLES` of `tools/api-data.mjs`); for `alt_item` and `alt_consumable`, the lines whose
   `rarity` is not null and whose `kind` is `item` or `consumable`; for every other table, the
   lines whose `table` code is `tableOf(param)`." The row field `table` stays the record v1 value.
   Add to step 12's parity tests: "for each table id of `apidata/tables.json`, `?table=<id>`
   answers `total` equal to the table's row count (all parts) and the same ids as its rows, in
   catalog order". Add to the `openapi.json` description of `table` (step 10): "the records of
   that table, as `GET /api/v1/tables/{table}` lists them".

3. **plan-B3-3. Step 14's pass line has the same defect, and its cases do not all give cold
   readings.** "Each p99 and each cold reading at most 5 ms" sits about 1-2 ms above the floor: a
   record read already reads 4.9 ms cold, so the line fails before the search costs anything, and
   a failure sends the file check to the owner's Edge Function question. Also, `CACHE_MS` is 10
   minutes and the cases are 3 minutes apart: case (b) reads the shards that (a) cached, and (d)
   and (e) read the `records/index.json` and `file-check.json` that (c) cached, so their warm-ups
   are not cold in a reused isolate. Change step 14 to:
   > Cases: (f) 10 `GET /api/v1/records/<id>` reads first (the baseline of the same session),
   > then (a)-(e) as listed, plus (g) 10 MCP `tools/call` `search_catalog` with the queries of
   > (a). Only the first case that reads a file family gives a cold reading (the shards: (a);
   > the file-check files: (c)); space a later case of the same family 11 minutes apart to read
   > it cold, or record its warm-up as warm. Pass: every status as expected, no error and no
   > exceeded-CPU count; each cold reading at most 10 ms; each burst p50 at most 8 ms; and the
   > 3x prediction, cold reading of (a) + K x (3x local - today local) from step 13, at most
   > 10 ms, where K is step 1's K, or (cold (a) - cold (f)) / (local (a) - 0.310) when that is
   > larger. Record each p99; it is not a pass line.
   Change the acceptance line "After landing 3" to name this pass line.

4. **plan-B3-4. The owner decision of 2026-11-12 on fallback 2 has no home, and the plan and the
   handoff still send the next step to it.** Section 3.5 ("then `apidata/roll/std/<total>.json`
   ... (60 files)"), the B2a outcome ("Fallbacks, in order ... (2) ... R1: if only the cold
   reading fails, take (2) directly"), the handoff "Next batch" ("Fallback (optional): ... then
   per-total `std` files") and its R1 sub-bullet ("go straight to fallback 2") contradict it.
   The landing-2 readings are also only in the owner note, outside the checkout, but step 1 reads
   them. Changes: in section 7, add an owner decision line: "Owner (chat, 2026-11-12): fallback 2
   (per-total `std` files) is dropped as over-engineering; the `std` roll tail stays as measured at
   landing 2, with no batch; fallback 1 (an isolate cache of each chunk's split lines) stays the
   only optional step." In section 3.5, the B2a outcome and the handoff, remove fallback 2 and the
   R1 routing to it, and keep fallback 1. In `context.md`, add "Landing 2 readings (orchestrator,
   2026-11-12)" with the six readings of the owner note (cold and burst p50/p75/p99 of the three
   cases, 0 errors, 0 exceeded-CPU) and the two slopes of Blocker 1. The handoff's "Pass" line of
   "After B2a" becomes the record of what was read: the three p99 lines failed, the owner accepted
   the roll as is, and the floor-plus-slope model replaces them. The B2a "readings go into
   `.claude/README.md`" step stays the orchestrator's.

## Risks

1. **R1. The margin at 3x is thin, and a cold MCP call reads about 2.5 ms more than a cold REST
   call.** At K 3.01 the cold REST search at 3x predicts 9.4 ms. The one cold MCP roll read 8.9 ms
   against 6.4 ms for the cold REST roll (the bursts show no MCP extra: 4.66 against 4.80), so a
   cold `search_catalog` at 3x predicts 10.0-10.8 ms, and a cold MCP `check_file` (local about
   1.0-1.3 ms with the context reads) about 9-10 ms. Each cold number is one sample, and the
   isolate start may be part of it. B3 can proceed: today's size predicts about 6.6 ms REST and
   about 8 ms MCP. Recommended: record the MCP prediction in the B3 risk bullet beside the REST
   one; step 14's case (g) reads it; if (g) or the 3x prediction fails, fallback (1) of the search
   (the capitalization delta) is the next batch, as the plan names.
2. **R2. `total` is not defined as the ranked count.** The kept lines are a necessary condition
   (a line can hold a term's `stemPrefix` with no word that stems to the term's stem); `rankHits`
   drops such a line with score 0. Step 5 says "`total` is the count of step 3", which reads as
   the kept count. Change to: "`total` is the length of `rankHits`'s result (with `q`) or the
   count of step 4 (without `q`); the 300 cap counts kept lines before the rank".
3. **R3. A repeated query parameter is not defined, and v1 freezes it.** `URLSearchParams.get`
   takes the first value. If `kind=weapon&kind=armor` answers with `weapon` now, the deferred
   multi-valued facets (section 10) can no longer widen in place. Add to "Bounds": "a parameter
   given twice is 400 `bad_request` naming it"; one `api.test.mjs` case.
4. **R4. The 3000-position cap does not say which positions it counts, and it is frozen.** An
   `indexOf` scan over the shard text also hits the head line (line 0), the id column and the
   display names, which repeat many folded names in lower case. Change step 3 to: "every
   `indexOf` hit of an anchor needle anywhere in a shard counts toward the 3000 (the scan cost is
   per hit); a hit counts for a line only inside that line's folded-names part, and a hit in line
   0 never counts for a line". Step 13 states which rule the planner's refusal counts (28 of 66,
   45 of 66) used, and re-measures them with this rule if they differ.

## Nits

1. N1 (local). Step 12's parity reference: name the pool, "`rankHits(index.searchable,
   parseQuery(q), undefined, namesHay)`". The probe shows `index.searchable` has the shard order,
   so the stable sort gives the same ties as `#/search`.
2. N2 (local). Step 5 `lineText`: write ": " only when `pos` exists (`ImportLines.svelte` puts it
   inside `{#if l.pos}`); a homebrew file's own lines have no `pos`. The parity test includes a
   line without `pos`.
3. N3 (local). Named departure in Standing check 3 and `openapi.json`: a lists skip line never
   carries the item id (the panel's rule, `skipLine`: "never the raw id"), so without names a skip
   line carries its position only. Only the error lines name the entry by item id.
4. N4 (local). `message` for `not_json`: name the key, `importNotJson` (both panels use it), so
   no join is needed. For `version` and `empty`, the key is that of the detected format
   (`importVersion`/`importNoVersion`/`importEmpty` or `hbImportVersion`/`hbImportNoVersion`/
   `hbImportEmpty`).
5. N5 (local). Step 2: pack the shards with the `DV_WIDTH` stand-in in the head, as
   `catalogFiles` packs the chunks; the 3x shards are 36 B under 262144 B, so a pack without it
   can pass the budget once the version is stamped.
6. N6 (local). Bounds: say what a `q` that parses to no terms does (`q=`, `q=%20`, `q=""`).
   Recommended: it reads as absent, so the "at least one of `q` and the facets" rule decides.
7. N7 (local). Step 3 of the search: when an anchor term has two needles, a line found by both
   counts once; the kept lines are in line order.
8. N8 (local). `check_file`'s description: the 65536 B `/mcp` body cap applies to the whole
   request. A client that escapes non-ASCII as `\uXXXX` triples a Russian file's bytes, so a
   32768 B file can meet the HTTP 413 instead of the `too_large` result. One sentence; no cap
   change.
9. N9 (local, F). `handoff.md` has "## Next batch"; the template heading is "## Next batch
   (implement-ready)".

## Deviations

- The search format is `daggerheart-loot/api-search`, not the earlier draft's `api-records`,
  because `apidata/records/index.json` already uses `api-records`. Accepted: one id, one meaning.
- File-check lines name lists entries by item id only (plan-B2a-5, default (a)). Accepted, with
  N3's correction for skip lines.
- The carried B2a findings: plan-B2a-4 (build-time folding, an anchor scan, no per-request
  split), -5, -6 (one 32768 B cap checked in `runOperation`), -R4 (step 13 and case (e)) and -N10
  (`facetsOf`) are settled in B3 as the plan says. -R1 of `reviews/B2a.md` (the cold reading) is
  applied in step 14, and Blocker 3 completes it.

Implement-readiness, apart from the findings: the steps, the files, the bounds and the fixture
names are specific; the claims about the code hold (`parseBundle`'s `owns` defaults to
`() => false`, so the `unheld` skip without an account follows; `parseHomebrew`'s `notHomebrew`
and the panels' refusal keys exist; `facetsOf` matches `TablesPage.svelte` `valueOf`;
`recordUrl(site, id, lang, v)` gives the record's `link`; `buildTools` iterates
`openapi.paths` in document order, so placing `/api/v1/records` before `/api/v1/records/{id}`
gives the stated tool order; `rest.mjs` `route` has no length-1 `records` or `file-checks` yet).
Each acceptance line is a separate check. The gates are `check:fast`, CI and the batch review;
the split criterion and its cost are stated.

## Standing checks

1. Scale: checked - the plan's limits table (rows 50/51, kept lines 300/301, positions
   3000/3001, `q` 200 characters and 8 terms, shards 1 today and 3 at 3x at most 262,108 B,
   `eq_weapon` tier 3 with `f` 39,493 B today and about 118,479 B at 3x against 131072 B, the file
   check 32768/32769 B, +3 and +5 files with a margin of about 91). No screen changes, so no
   States table. Defects: CPU at 3x is near the limit on the corrected model (Blocker 1, R1); the
   shard packing margin (N5).
2. Error scenarios: checked - no write path and no stored shape. A failed index or shard read is
   503; a shard head of another data version is one re-read, then 503 (test); the file check
   reads no Supabase; a stale isolate keeps prepared shards for 10 minutes as every cached file;
   a revert gives the JSON 404 and an ignored `filter`. Defects: the gates of steps 1 and 14
   would stop or fail on correct code (Blockers 1, 3); a repeated parameter (R3).
3. Consistency: checked - search on names with `#/search`'s word rules and order (same pool
   order, N1), `filter` by the tables page's `passes` over `facetsOf`, the panels' own lines and
   refusals, links with `?v` as the record's. Named departures: no descriptions or stat lines,
   `too_broad`, no own items, no account, item ids without names. Unnamed departures: the
   `table` facet against the table of the same id (Blocker 2); skip lines without an id (N3).
4. RU/EN parity: checked - every `text` and `message` is a `dict.ts` pair through the shared
   builders run once with `dict('ru')` and once with `dict('en')`; `unknown_format` joins two
   existing pairs with the same facts in both languages ("Это не файл списков ..." / "This is
   not a lists file ...", "Это не файл предметов ..." / "Not an items file ..."); no new
   `dict.ts` string; error messages and `openapi.json` are English with ASCII punctuation.

Owner rules: checked - the owner decision of 2026-11-12 on fallback 2 has no home in `plan.md`
section 7 or `context.md` (Blocker 4). The record-link rule (D9, `CONTRACTS.md` section 6) holds
for the search rows. The B3 AFK defaults are in section 7. No "Owner insights" rule applies.

## Suggested next action

1. Recommended: the planner applies Blockers 1-4, R2-R4 and the local nits N1-N9 as written,
   writes the landing-2 readings and the two slopes into `context.md`, and adds "- Plan review
   findings applied: reviews/plan-B3.md" to Status. Then the implementer starts B3 with no second
   look; step 1 passes on today's readings (K 3.01, 9.4 ms). Reason: each finding is a defined
   text edit, and the corrected gate keeps the plan's own question. Trade-off accepted: a 3x
   margin of about 0.6 ms on the conservative slope, which step 14 checks with real readings.
2. Not recommended: keep the gate and stop B3. The stop would come from the floor under every
   request, not from the search; B2b would land alone and B3 would wait for a replan that the
   readings do not justify.

## Checks still needed

- After landing 3: step 14 with Blocker 3's cases, spacing and pass line, including the MCP
  search case (g).
- Step 13's local numbers at 3x with R4's position rule, before the commit.
- Not verified here: whether the cold readings of landing 2 came from a new isolate; the MCP
  cold extra of about 2.5 ms is one sample.
