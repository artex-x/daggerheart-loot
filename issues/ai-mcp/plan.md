# Plan - TASK ai-mcp

## Status

- Mode: B (design pass of 2026-11-11 at `8f194abd`: the account tier B5,
  split into B5a and B5b, and the B1/B2 touchpoints it forces).
- Batches: B0 implemented 2026-11-12 (owner review of the audit table pending, `docs/rights/records.json` `reviewed` null); B1 implement-ready; B2 and B3 outlines; B5a and B5b
  design settled, implement-ready outlines (B5a keeps one `Open design
  question:`, its screen layout); B4 dropped (section 6).
- NEEDS_HUMAN_CONFIRMATION: no. Q1-Q7 are settled (Q6 = C, Q7 = A on
  2026-11-10); the B5 defaults of 2026-11-11 are "default taken (owner
  AFK)" (section 7, Q8-Q11). B1's publication and squash wait on B0 and
  on the owner's review of the audit table (an owner step, not a
  question). B3 waits on a measurement. B5a stops for the owner only on
  its step 1 stop rule (a client token that changes the email or the
  password, links or unlinks an identity, or enrolls a factor). No
  batch and no gate waits on the Charkeeper author.
- Plan review: required before B1 (trigger: a public contract change - the read API `/api/v1/`; a product-law change). The CORS rule of 2026-11-10 is part of the same contract change. B0 changes `llms.txt` (a public-contract file of the orchestrate "Plan review" list), which this review covers, and `.claude/agents/add-source.md` (an agent definition), so B0 fires the batch-review trigger and runs a batch review (plan-B1-2-R2).
- Plan review: required before B5a (trigger: a migration that changes the PostgREST role config and adds restrictive table and storage policies and a SECURITY DEFINER helper; a new write and sync protocol; possible loss of stored data by a connected app's delete; a public contract change - `/api/v1/me/`, `/mcp/me`, a new app route). `agent-guard.mjs` reads every `required` line, so this line blocks every implementer dispatch, B0 and B1 included, until `reviews/plan-B5a.md` approves or its findings are applied: intended, because the same review reads the B1 delta of this pass. The B1 delta (section 6, B1, "B5 touchpoints and the second consumer": the public bulk catalog `/api/v1/catalog/`, record `key`, `Authorization` ignored on T0 paths, the unknown-`code` rule, the `/.well-known/oauth-protected-resource/` reservation, the failing CORS probes, the B2 tool filter) is additive, adds no trigger kind that the B1 review did not cover (a public contract change), and is named in the B5a review's scope; so the B1 review needs no fourth look, and the B5a reviewer reads that paragraph as part of "plan before B5a".
- Plan review findings applied: reviews/plan-B1.md
  - plan-B1-1: section 6 B1 "Files expected", step 5, "Verification commands": stage `test:preview` of `tools/check/lib.mjs` runs the ts hooks and the three test files; `lib.test.mjs` holds the stage to every preview test and to the `preview/package.json` script.
  - plan-B1-2: sections 3.4, 3.5, 5.4, B1 step 4 and Standing check 1: `eq` leaves the table rows; each `eq_*` table is split by tier into `apidata/table/<table>/<tier>.json` and `part` is required on it (400 with the part list); counts 512 / 1536 rows written.
  - plan-B1-3: sections 3.5, 5.3, 5.4, B1 steps 3, 4 and 6: `apidata/cards.json` (budget 131072 B, not 65536 B: 29,854 B today, about 90 KB at 3x); the homebrew `Index` comes from `itemOf` and `withRecords` over `cards.json`; `site.art` from `env.SUPABASE_URL` through a new `artBaseOf`; the same for each homebrew entry of a shared list; a test case with a catalog rule card and set.
  - plan-B1-4: sections 5.1, 5.4, 9, B1 steps 6 and 10, acceptance, owner step, Standing check 1: both read caps are 65536 B; the entry counts at the cap are named; the owner measures CPU at the cap; D1 states why the API takes the full reads and the cap.
  - plan-B1-5: B1 "Files expected", steps 4 and 10, acceptance: fixtures render from a pinned catalog `docs/fixtures/api/v1/catalog.json` through the exported `renderApiData`; the real build is checked for schema, budgets and pool equality only.
  - plan-B1-6: sections 3.4, 5.3, 7, 8, B1 steps 3 and 7: Q2 = A (owner, 2026-11-10) settled, so it gates nothing; record v1 gains `rights`; `openapi.json` `info` carries the DPCGL notice; `apiRecord.test.ts` covers `rights`.
  - plan-B1-R1: sections 3.4, 3.5, B1 steps 4, 6 and 10: every `apidata/` file carries `data_version`; a mismatch or a missing id re-reads the cached file once; the `ETag` comes from this answer's files; a test with two stub `ASSETS` versions.
  - plan-B1-R2: sections 3.2, 3.5 ("Reads per operation"), B1 step 6, owner step: roll rows carry their chunk number, so a roll reads its section file and at most four chunks (five files, about 290 KB at most today); the `std` roll is the heaviest case; a named fallback parses one line per record.
  - plan-B1-R3: section 5.1, B1 steps 7 and 8: a JSON responder in `rest.mjs` for every `/api/` answer, a thrown error included, with `nosniff` and a `sandbox` CSP; messages name the schema field and echo no input; bare `/api` is the JSON 404; `openapi.json` marks user content.
  - plan-B1-R4: section 3.6, B1 "Files expected", step 11, acceptance: `PRODUCT.md`, `META.md` section 3 (both paragraphs), `.claude/README.md` "Preview host", `README.md` and `README.ru.md` (`preview/` line), `llms.txt` lines 8, 336, 686 and 1041.
  - plan-B1-R5: sections 5.1 and 5.3, B1 step 3: the app's rule holds (an empty Russian side takes the English text per field, English never takes Russian); the 5.1 sentence is deleted.
  - plan-B1-R6: sections 3.6, B1 "Files expected", step 11, acceptance, Standing check 4: owner answer (2026-11-10) - one sentence in both privacy pages with the new "Last changed" date.
  - plan-B1-R7: B1 step 9, acceptance, section 10: the `check-site` static probe of `apidata/version.json` records `Access-Control-Allow-Origin`; `CONTRACTS.md` section 5 calls `apidata/` internal; the follow-up is in Deferred.
  - plan-B1-R8: section 3.3, B1 steps 2 and 6, acceptance: `rollTables.ts` exports `rowsOf(section, index, part)`; `App.svelte` and the service call it.
  - plan-B1-N1: B1 "Files expected", steps 1 and 9: `vite.config.mts` and `std.ts` dropped; `tools/check-site.test.mjs`, `tests/app/serve.js`, `.claude/hooks/edit-guard.mjs`, `.claude/hooks/selftest.mjs`, `.claude/README.md` "Hooks" and the `CONTRACTS.md` "Fixtures:" paragraph added; step 1 names the four `ts-hooks` references.
  - plan-B1-N2: B1 "Files expected", step 2, acceptance: the `RollPanel.svelte` comment names `rollTables.ts`; the `App.svelte` module comment moves with the constants.
  - plan-B1-N3: sections 5.3 and 8: no `2d6` example; `dice` is `dN`, `bonus` 0-99, never negative; question 6 and the Charkeeper row drop multi-dice damage.
  - plan-B1-N4: section 5.2: `parts[].rows` and `options.value.max` are the roll pool length (`arazo` 27 of 78 rows, `ph` 45 of 93); the example `max` is a number.
  - plan-B1-N5: section 5.2: a section `id` is the slug without `roll/`; `dice` and `total` are exclusive, exactly one.
  - plan-B1-N6: section 3.5: 36-46 record chunks today and 110-140 at 3x (estimate); `records/index.json` lists ids per chunk; the build writes the real counts into `.claude/README.md`.
  - plan-B1-N7: section 5.3, B1 step 3: `tier` reads `eq.tier` when both exist; a test holds the 45 records with both to equal values.
  - plan-B1-N8: section 5.1, B1 step 8: a `POST` whose `Content-Type` is not `application/json` answers 415 `unsupported_media_type`.
  - plan-B1-N9: sections 3.4 and 4, B1 step 11: the owner rule "OpenAPI is the one source for the MCP tools; no extension point before a second consumer" goes into D3 in B1.
- Plan refresh 2026-11-10 (owner decisions; applied, reviewed by `reviews/plan-B1-2.md` and `plan-B1-3.md`): Q1 (no mapping, no `format=`), CORS on `/api/v1/*`, B0 (license statement and per-record rights audit, Q6 = C, Q7 = A), publication right after B1 (section 11, D6), no issue-72 post before the API is live (section 8), two entry points kept (section 3.8, D2), B4 dropped. The sections carry the result; the per-section change list is in git history at `8f194abd`.
- Design pass 2026-11-11 (B5, the orchestrator's dispatch; owner AFK):
  - Section 6: B5 becomes B5a (the account connection: the client-token guard migration, the consent route, "Connected apps" on `#/account`, D7) and B5b (the account API `/api/v1/me/` and `/mcp/me`); criterion and gate cost in each. "B5" elsewhere names both.
  - Section 3.4: sync is pull by heads (`{ id, rev }`, one design for catalog and account data); account writes are commands with client-made ids and `If-Match`; the T2 row, the CORS paragraph and the `/me` row name B5a/B5b.
  - Sections 3.4, 3.5, 5.1, 5.3, 5.4, 11, B1 (new "B5 touchpoints" and "Second consumer" paragraphs, steps 3, 4, 7, 9, acceptance): the public bulk catalog `/api/v1/catalog/index.json` (static, no Functions request) with a `rev` per record; record v1 `key`; `Authorization` ignored on T0 paths; the unknown-`code` rule; `/.well-known/oauth-protected-resource/` reserved; the CORS probes on `/img/*` and the catalog fail, not report.
  - B2 outline: `/mcp` lists only operations without `security`, never answers 401 and never reads `Authorization`; `/mcp/me` is B5b's.
  - Section 4: D7 (B5a). Section 7: Q8-Q11, "default taken (owner AFK)". Section 8: the bacchus-atlas migration note (the second worked example). Section 10: per-client read-only grants, books and cards writes, art writes.
- Total gate cost (".claude/README.md", "Batch size and the fixed cost of a
  run"): B0 about 55 min: the batch commit about 20 min (`check:fast` a
  few minutes, because `tests/derived.js` changes; one CI run 15 min; not
  docs-only, so CI runs `e2e`), one batch review run (the table has no
  row for it; about 15 min, estimate) and the follow-up commit that sets
  `reviewed` after the owner's review, always needed (about 20 min: the
  same `check:fast` and CI run); B1 about 47 min (`check:fast` 11-14 min, because
  `App.svelte` reaches `app.test.ts`, `pages/src/` reruns vitest and
  `.claude/hooks/` runs the hook selftest; `check:built` a few minutes;
  one CI run 15 min; the CORS tests add cases to `api.test.mjs`, no new
  stage; one batch review run, about 15 min, estimate); the mid-task
  landing about 23 min (the merge-back commit: `check:fast` 474-479 s,
  because a merge of `main` puts every vitest file in the related run,
  and one CI run 15 min); B2 about 20 min; B3 about 20 min plus an owner
  measurement deploy; B5a about 45 min (`check:fast` about 12 min,
  `check:db` 752 s, CI 15 min with the golden re-seed from CI's text);
  B5b about 25 min (`check:fast`, CI); the plan review before B5a about
  15 min (estimate), run before B0 and B1 (Status, "Plan review"). The
  B2, B3, B5a and B5b figures do not include their batch reviews. Sum:
  about 4 h 10 min of gates.
- Plan review findings applied: reviews/plan-B1-2.md
  - plan-B1-2-1: section 6 B0 steps 6-9 and acceptance, section 8: the covered clause names "the Core, Hope & Fear and campaign frame records whose text the SRD 2.0 holds; `docs/rights/records.json` names each"; the outside clause adds "any Core, Hope & Fear or campaign frame record that the SRD 2.0 does not hold"; the test holds the whole-book entry absent (`**Hope & Fear**` in the READMEs; in the plain-text `LICENSE` and `llms.txt`, the clause with the record phrase removed), not the bare string; section 8 uses the reviewer's sentence.
  - plan-B1-2-2: section 5.3 (`rights`), section 6 B0 table (`reviewed`, resolution) and step 5, B1 steps 3 and 4 and acceptance, section 11: `licenseOf` returns `owner` for every record while `audit.reviewed` is null; an `apiRecord.test.ts` case; the acceptance line "an unreviewed audit renders no `dpcgl`"; the pinned audit slice in `catalog.json` carries a `reviewed` date; an early squash claims too little, never too much.
  - plan-B1-2-R1: sections 4 (D5) and 5.3, B0 steps 5 and 7 and "Owner answers", B1 step 7: `dpcgl` means "the English text is SRD 2.0 Public Game Content", in D5 and in the `rights` schema description of `openapi.json`; the Russian text is credited apart, by the sources the `README.md` "Sources" table names (daggerheart.su for Core, a fan translation for Hope & Fear and the campaign frames, a community sheet for the Hope & Fear equipment).
  - plan-B1-2-R2: Status ("Plan review" line, gate cost), section 6 B0 "Review" line, `handoff.md` "Completed" and "Next batch": B0 fires the batch-review trigger (an agent definition; `llms.txt`); its handoff line is `Review: required (trigger: an agent definition changed; llms.txt)`; the review run is in B0's gate cost.
  - plan-B1-2-R3: sections 3.4 and 5.1, B1 steps 7 and 11 and acceptance, section 11: in v1 the `/api/v1/me/` JSON 404 and its preflight carry `*` only because the path is reserved and holds no data; `CONTRACTS.md` section 6 says so; B5 replaces both answers.
  - plan-B1-2-R4: section 11: v1 freezes every field name, type and value list of each answer format (`api-rolls`, `api-roll`, `api-tables`, `api-table`, `record`, `api-shared-list`, `api-error`), with the value lists named.
  - plan-B1-2-R5: section 6 B0 table (`page`), steps 2, 4 and 11: the match rule compares normalized text (case, whitespace, punctuation and markup removed); each near match is listed in the owner's review summary; `page` is the 1-based PDF page index.
  - plan-B1-2-N1: Status, "Plan refresh 2026-11-10" sub-bullets: the stale "Second look: not warranted" line names this report.
  - plan-B1-2-N2: Status, total gate cost: B0 includes the follow-up commit that sets `reviewed` (about 20 min) and the review run; the sum is about 2 h 52 min.
  - plan-B1-2-N3: sections 1 and 3.6, B1 step 11 and acceptance: `llms.txt` and the two READMEs are cited by phrase and section, not by line number.
  - plan-B1-2-N4: section 6 B1, new "Landing mid-task" paragraph and acceptance line: B1 is squashed onto `main` after a green CI run of its tip, then `main` is merged back into `claude/ai-mcp` before B2 (the `342c91c4` pattern), with no force-push.
  - plan-B1-2-N5: section 6 B5 outline: a placed line to restate the `/me/` allowlist reason when B5 is expanded (a bearer token is not an ambient credential); section 3.4 no longer gives the weak reason.
  - plan-B1-2-N6: section 6 B0 table (`reviewed`) and step 10: one `reviewed` date for the table; an entry added later (add-source) gets its review in that batch's review.
- Plan review findings applied: reviews/plan-B1-3.md
  - plan-B1-3-1: sections 3.5 (`cards.json` row, reads table) and 5.4, B1 steps 3, 4 and 6, acceptance, Standing check 3: `cards.json` gains `members` (each catalog set key's member records cut to `id`, `src`, `kind`, `set`, `en`, `ru`, `ende`, `rud`; 5 records, 2,993 B measured; budget 131072 B); the base is `buildIndex({ items: { set_members }, refs, sets })`; a homebrew item uses `withRecords(base, [record, ...related], [])` (`itemView.svelte.ts`), a shared list one index `withRecords(base, [], snapshotRecords(row))` (`SharedListPage.svelte`); test cases for `set.members` and `set.bonus`, and for a snapshot's embedded set card.
  - plan-B1-3-R1: section 6 B1 "Landing mid-task" (four ordered steps), "Files expected", step 11, acceptance; sections 3.6 and 4 (new D6): the decision "ai-mcp lands on main in two squashes" amends the 2026-10-21 decision (both pointers) and cites the task 57 decision as precedent; the squash follows B1's approving review and a green CI run, the orchestrator confirms `reviewed` holds a date first, `issues/ai-mcp/` goes onto `main` with the squash, `origin/main` merges back with no force-push; the `342c91c4` citation is removed.
  - plan-B1-3-R2: Status (gate cost), section 6 B1 new "Review:" line: B1 fires a public contract, a hook, `tools/check/` and a `package.json` check script; B1 about 47 min with its review run, the merge-back commit about 23 min, the sum about 3 h 30 min; the B2, B3 and B5 figures exclude their reviews; `handoff.md` "Next batch" carries B1's review line and the totals.
  - plan-B1-3-R3: section 6 B0 step 2: the match rule expands the ligatures U+FB01 and U+FB02, removes the soft hyphen U+00AD, and removes all whitespace and all hyphens before the compare.
  - plan-B1-3-N1: section 6 B0 steps 3 and 4, B1 step 4: 745 = 364 in `L.items` + 381 in `L.eq`, and the test walks both; "`data.js` order" is `[...buildIndex(L).byId.keys()]` (the report's `Object.keys(...byId)` returns nothing on a `Map`; B1 step 4 had the same slip).
  - plan-B1-3-N2: section 6 B0 steps 6-9 and acceptance: the `llms.txt` (and `LICENSE`) outside list is its own sentence; the READMEs' outside bullet tail becomes "their text belongs to its rights holders" and "права на эти тексты принадлежат их правообладателям".
  - plan-B1-3-N3: section 5.4, B1 steps 3 and 4: one signature `apiRecord(index, it, site, license)`; the build passes `licenseOf(audit, it)`, the service `'owner'`.
  - plan-B1-3-N4: B1 steps 3 and 6: `ApiSite = Site & { art: string }` over `hash.ts` `Site { base }`; the service's site is `{ base, art }`.
  - plan-B1-3-N5: section 5.1, B1 step 10, acceptance: the check order (301, `OPTIONS` 204, path 404, 405, section or table 404, 415, 413, 400); an empty JSON body reads as `{}`; the media type compares without case; bare `/api` gets the `OPTIONS` 204; test cases.
  - plan-B1-3-N6: section 5.1, B1 step 10, acceptance: the host guard's 301 from `answer()` in `worker.mjs` is the one answer without CORS, `nosniff` or a JSON body.
  - plan-B1-3-N7: B1 "Files expected", steps 4 and 5, acceptance: `tools/api-data.mjs` exits 1 when `docs/rights/records.json` is missing or not valid; when B1 runs first, the implementer commits the starting file once by hand.
  - plan-B1-3-N8: section 6 B5 outline: the "because" clause is deleted; the placed plan-B1-2-N5 line stays.
  - plan-B1-3-N9: section 6 B0 step 2, `handoff.md` "Next batch": the skill is the user-level `anthropic-skills:daggerheart-source-audit` (this host's session list); step 2's match rule is the full procedure, and the skill supplies only terminology.
- Plan review findings applied: reviews/plan-B5a.md
  - plan-B5a-1: B5a steps 2 and 3, D7, acceptance: restrictive `<table>_no_client` policies on every out-of-scope `public` table bound embedding; step 3 adds an embedding case per foreign-key path; the fallback keeps only its RPC half.
  - plan-B5a-2: B5a step 1, section 7 "Owner stop", section 9, Status: step 1 measures the Auth endpoints (user, identities, factors, global logout) and both discovery URLs; the stop rule covers email, password, identity link or unlink and factor enrollment.
  - plan-B5a-3: B5a step 5 (scope sentence, Russian twin), steps 7 and Standing check 4, section 3.6, B5b `DELETE` rows, `PUT` row (`art` kept), tool descriptions, Standing check 2: the list and item delete cascades and the picture clear are named.
  - plan-B5a-R1: B5a step 2 (`api_client_session_live()`, definer), step 3, Standing check 2, D7, section 7, Status trigger text: a revoked grant's unexpired token is refused; default taken (owner AFK).
  - plan-B5a-R2: B5a acceptance (the `print_sets` probe after `migrate-test`), step 8 (the production probe; "Restore production (owner)" re-applies the role setting), step 2 fallback, section 9.
  - plan-B5a-R3: section 3.4 "Sync", B5b `openapi.json` bullet: an account `rev` covers the row's own fields, not the parts of `record` from other rows; `If-Match` stays on the row revision.
  - plan-B5a-R4: sections 3.4, 3.5, 5.4, 11, B1 step 5 and acceptance: `rev` is an opaque string compared for equality, may change at other times; account `rev` in decimal; the step 5 test names the records whose JSON embeds the edited one.
  - plan-B5a-R5: B5a steps 1, 5 and 7, section 3.6: step 1 records the token claims; email and name join the consent and privacy text when present.
  - plan-B5a-R6: B5a steps 1 and 8: step 1 checks the pinned CLI's `config.toml` for an OAuth server section; settings go there, or step 8 records that `config:push` leaves them.
  - plan-B5a-R7: B5b `PATCH /me/lists/{id}` row, B5a step 2 (`PATCH` on `lists`), B5b tests and Standing check 2, section 3.4, section 7: an optional `If-Match` with the read-back rule; the remaining last-writer loss is named; default taken (owner AFK).
  - plan-B5a-N1: B5b `PUT` row and tests: `key` optional on create, ignored on replace; a duplicate key or another account's id is 409 `conflict`.
  - plan-B5a-N2: section 5.3, `key` row: a homebrew key is unique per account; `id` is the key across accounts.
  - plan-B5a-N3: B5a step 2: `grant execute` to `anon, authenticated, service_role`, exact path equality, `HEAD` as `GET`, the reversal file under `check:db`'s up-down-up gate.
  - plan-B5a-N4: section 3.5 (`version.json` row), B1 step 4: the hash is over every output rendered with `data_version` empty, then stamped into each file.
  - plan-B5a-N5: section 5.1 (headers bullet, 404 bullet), B1 step 10 and acceptance: a miss under `/api/v1/catalog/` is Pages' `404.html`; `tests/contracts.js` compares operations and lists the static catalog apart.
  - plan-B5a-N6: B1 step 9: the image probe takes the first record with a non-null `image.full` from the first chunk the index names.
  - plan-B5a-N7: section 3.5 (index row), B1 Standing check 1: the index is about 69 KB today and 210 KB at 3x.
  - plan-B5a-N8: sections 3.4 (CORS) and 11: the `*` promise covers the catalog image URLs under `<site>img/` and `<site>og/` only.
  - plan-B5a-N9: B5a step 4: `AppsRepository` becomes `AppRepository`.
  - plan-B5a-N10: B5b `GET /me/homebrew-items` and `{id}` rows, tests, section 7: `?ids=` accepts only ids in the reader's heads (else 400); `?ids=` uses one index over the answer and names the `craft.from` difference; `{id}` equals the T0 record; default taken (owner AFK).
  - plan-B5a-N11: section 4 heading (D7 in B5a, D5 in B0, D4 in B2), B5a step 5 fixture paths `docs/fixtures/urls/routes.json` and `paths.json`.
  - plan-B5a-N12 (deferred-scope): section 3.4 "Sync and the quota" states the ceiling (about 500 polling users; one read per changed list); section 10 and `handoff.md` "Deferred" record that nothing shows when the quota is near.

## 1. Objective and current state

The task `ai-mcp` gives AI assistants a remote MCP endpoint (settled Q1-Q3
of 2026-10-15, `context.md`). On 2026-11-10 the owner widened it:

1. The MCP server becomes a client of a shared backend: an API layer.
2. A second consumer, Charkeeper (GitHub issue 72), needs tables, options,
   a roll and an item payload.
3. The API is a general platform for other VTTs, character managers,
   Discord bots, GM tools, scripts and assistants; Charkeeper is the first
   worked example.
4. The planner may move any app function to the backend (roll logic,
   search, filters, sorting, tables, file checks, share-link resolution) and
   data from static files to the database, or reject a move with reasons.

Current state:

- The site's host is the Pages project `daggerheart-loot`. `cloudflare-pages`
  shipped as `d0fd98bc` (2026-10-28), not "no commits" as `context.md`
  first said; `/mcp` is reserved and answers 404 (`CONTRACTS.md` section 5).
- One stateless worker (`preview/worker.mjs`, Pages Functions advanced mode)
  answers the eight card families of `preview/public/_routes.json`. It reads
  `names.json` and `index.html` through `env.ASSETS` and two lean `anon`
  RPCs. CPU limit 10 ms a request; 100,000 Functions requests a day per
  account; static files are free.
- `data.js` (1.1 MB as JSON) is the only catalog authority
  (`docs/decisions/2026-09-24-data-js-in-git-is-the-only-catalog.md`). The
  build writes `data.json`, `catalog.csv`, `catalog-index.csv` and
  `names.json`. The app reads `data.js` as a classic script, with no async
  bootstrap and no loading state (`CONTRACTS.md` section 4).
- Every app function is a pure module in `app/src/lib/`, except the map of
  roll sections to tables, which is in `App.svelte`'s module script
  (`ROLL_TABLE`, `PICKER_ROLL`).
- `llms.txt` says "no public API" (the summary under the title and "What
  this site cannot do") or "there is no API" ("Lists as a file
  (import-v1)" and "Homebrew items as a file (homebrew-v2)").

## 2. Scope and non-goals

In scope: the API layer and its two adapters (REST and MCP) in the
existing worker; build-time projections of the catalog; the product-law,
contract, `llms.txt`, privacy-page and spec changes; CORS for browser
clients on the public reads (owner, 2026-11-10); one aligned license
statement in every copy and a per-record rights audit (B0); the OAuth account tier as the last stage.

Non-goals: no change of what the app draws or how it rolls; no catalog in
the database; no new store (KV, Durable Object, D1); no API keys, no
per-client quota, no webhooks, no write endpoint for a third party before
B5; no export format other than the neutral record and no published
mapping to any consumer's schema: every consumer maps the record as it
wants (owner Q1, 2026-11-10).

## 3. Architecture

### 3.1 The layers

| Layer | Component | Runs in | Client of |
|---|---|---|---|
| L0 data | `data.js` (catalog authority) | git, build | - |
| L0 data | Supabase Postgres: accounts, lists, homebrew, shares; RLS and definer RPCs | Supabase (EU West) | - |
| L1 projections | `apidata/` files: the catalog cut for request-time reads, rendered by the app's own pure modules | `node tools/build.js`, published as static files | L0 `data.js` |
| L2 domain | pure modules `app/src/lib/*` (roll, std, alt, sections, rollTables, filters, search, i18n, label, markup, bundle, homebrewFile, cloudLists, homebrew) and the new `apiRecord.ts` | the app (browser), the build (Node) and the worker (bundled) | - |
| L3 service | `preview/api/service.mjs`: one function per API operation | the worker | L1 through `env.ASSETS`; L0 Supabase through PostgREST as `anon` (B5: with the reader's token); L2 |
| L4 adapters | `preview/api/rest.mjs` (`/api/v1/*`) and `preview/api/mcp.mjs` (`/mcp`), both generated from one `openapi.json` | the worker | L3, in process |
| L5 clients | Charkeeper (Rails server), Claude and ChatGPT connectors, scripts, bots, GM tools | outside | L4 over HTTPS |
| - | the app | the browser | L0 `data.js` and Supabase, as today; never L4 |

The MCP adapter calls the service in process, not over HTTP: an HTTP hop to
the same host costs a second Functions request per call and adds latency,
and gives no isolation, because both run in one deployment.

### 3.2 Options compared (owner question 1)

| | (a) MCP worker with its own logic | (b) Supabase-hosted API, MCP worker as a thin client | (c) one worker API shared by MCP and REST (recommended) |
|---|---|---|---|
| Where | `/mcp` in the Pages worker | Postgres functions or Edge Functions at `<ref>.supabase.co`; `/mcp` in the worker relays | `/api/v1/*` and `/mcp` in the Pages worker over one service layer |
| Product law | amended once (settled Q3 = A) | Edge Functions are inside Supabase, so the store law holds; the relay still amends the worker sentence | amended once, the same sentence as (a) plus "the read API" |
| CPU | 10 ms a request | Edge Function: 2 s CPU (Supabase docs, not measured here); Postgres: statement timeout 3 s | 10 ms a request; each projection file at most 65536 B, a roll, table or cards file at most 131072 B; a request reads at most five files and parses at most about 290 KB today (a `std` roll, section 3.5) |
| Quota | 100,000 a day, shared with the cards | Edge: about 500,000 a month (about 16,000 a day, Supabase docs, not verified), plus 100,000 a day for each relayed MCP call; egress counts against 5 GB | 100,000 a day, shared with the cards; static files free |
| Catalog source | static files | the catalog must enter Postgres (a second authority, a sync per data change) or be bundled into the function (a deploy per data change) | build-time static files from `data.js`, the same deploy as the site |
| Public URL | frozen on the site's host | a REST URL with the project ref: a restore into a new project breaks every client; a custom domain is a paid add-on | frozen on the site's host |
| Deploy and secrets | the current CI deploy | a new `supabase functions deploy` step with a personal access token that reaches every owner project | the current CI deploy |
| Runtimes to test | Node and the worker | Node, the worker and Deno | Node and the worker |
| Second consumer | re-implements the same logic | served | served |
| Offline and static app | unchanged | unchanged | unchanged |

Decision: (c). It is the only option that serves two consumers from one
implementation with no new deploy channel, secret, runtime or authority.
The trade-off accepted: the 10 ms CPU limit, which shapes the projections,
and a quota that the cards, MCP and REST share. Option (b) stays the named
fallback for one operation only, the file check, if B3's measurement shows
that it cannot fit 10 ms at the 256 KB input cap (section 3.5).

### 3.3 What moves to the backend (owner clarification 1)

Legend: needed = the API cannot do its job without it; desirable = a
client can do it from what the API already serves; no = not served.
"Shared" means one pure module run in two places.

| Area | Lives today | API | Implementation | Offline / URL state / contracts / RU-EN |
|---|---|---|---|---|
| Catalog records, refs, sets | `data.js`; `lib/data.ts` `buildIndex` | needed (records) | shared: `tools/api-data.mjs` renders projections with `buildIndex` and `apiRecord.ts`; one implementation | app unchanged; new frozen API paths; both languages in every record |
| Record text and stat line (plain text, path, stat words) | `lib/i18n.ts`, `lib/label.ts`, `lib/markup.ts` | needed (payload) | shared, run at build time for catalog records and at request time for homebrew items (`apiRecord.ts`) | both languages from the same functions the app draws with |
| Relations: craft, set, upgrade line | `lib/data.ts` `relate`, `upgradeLine` | needed (payload) | shared, build time; at request time for homebrew through `withRecords` | ids are frozen record ids |
| Tables and their parts (VoA sections, communities, realms, volumes) | `lib/tables.ts`, `lib/sections.ts`, `lib/sectionProps.ts`, `App.svelte` module script | needed (tables, rolls) | shared; B1 moves `ROLL_TABLE` and `PICKER_ROLL` to `lib/rollTables.ts` and adds `rowsOf(section, index, part)`, which `App.svelte` and the service both call (extraction on its second use) | URL ids from `ROUTES.md`; part names from `dict.ts` in both languages |
| Rolls (Nd12, duality and crit bump, pick 1-N, upgrade-line rungs left out) | `lib/roll.ts`, `lib/std.ts`, `lib/alt.ts` | needed (the roll operation) | shared: the worker bundles the same modules and calls `buildIndex` on a lean per-section projection, then `rowsOf`, `poolFor`, `altPicks`, `bumpUp`, `rollPool`, `pick` exactly as the panels do | the app keeps rolling locally; the API answers the dice, so a GM can type the same number in the app |
| Filters (`f_` grammar, predicate) | `lib/filters.ts` (frozen grammar), `lib/facets.ts` (values, labels) | desirable (a client can filter a whole table it fetched); needed for "a table with options" in one call | shared: the API takes the frozen `f_` segment as its `filter` parameter, so one grammar serves addresses and API calls (B3) | no new grammar; facet labels from `dict.ts` in both languages |
| Search (words in any order, Snowball forms, quotes) | `lib/search.ts` with `@orama/stemmers` | desirable for REST (`catalog-index.csv` and the table reads serve a client); needed for the settled MCP catalog tool | shared, CPU-gated: B3 measures `search.ts` on a lean projection in the worker; fallback is a name-only match (open design question of B3) | both languages at once, as the app's search |
| Sorting | tables keep book order; `rankHits` ranks search | desirable | no sort parameter: a table answers in book and roll order, a search in `rankHits` order | the order the app draws |
| File checks (`import-v1/2/3`, `homebrew-v1/2`) | `lib/bundle.ts` `parseBundle`, `lib/homebrewFile.ts` `parseHomebrew` | needed for the settled MCP file tool; desirable for REST (a script checks a file before import) | shared, CPU-gated (B3); input cap 256 KB, JSON only, no zip | the same errors the import shows, in both languages |
| Share-link resolution | `get_shared_list` (definer, Supabase); the app resolves catalog ids with its index | needed (shared lists) | the service reads `get_shared_list(text)` as `anon` with a 65536 B cap, shapes it with `sharedListOf` of `lib/cloudLists.ts`, names catalog entries from `names.json` and builds each homebrew entry's record from its snapshot with `apiRecord.ts` | the link's audience decides, as in the app |
| Homebrew item by id | `get_homebrew_item(uuid)` | needed | the service reads it as `anon` with a 65536 B cap, reads it with `itemOf` of `lib/cloudLists.ts`, shapes it with `apiRecord.ts` | the `#/h/` audience |
| Clipboard text (`share.ts`) | `lib/share.ts` | desirable | not served: no `format=` parameter exists (owner Q1); a later resource would need the full index and `dict.ts` at request time | - |
| Prices (`money.ts`) | `lib/money.ts` | desirable | not served until a consumer asks | - |
| Print, card layout, fitting | `lib/print.ts`, `printSet.ts`, components | no: a browser measures the fit; a print set is signed-in only | - | - |
| Account lists, requests, live updates, homebrew editing | `lib/cloudLists.ts`, `requests.ts`, `live.ts`, `homebrew.ts`; Supabase RPCs | B5 (OAuth); the RPCs and RLS stay the authority | relayed with the reader's token; no second write path | privacy pages change again in B5 |
| Routes and links | `lib/hash.ts` | needed (every answer carries site links) | shared: `recordUrl`, `appUrl` at build time | frozen path form |
| UI-only state (prefs, pending, header scroll, editor, number field, plural words) | `lib/*` | no | - | - |

Rejected moves, with the reason:

- The app as a client of the API (rolls, search or tables over HTTP): every
  page gains a loading and an error state, a quota burn of the shared
  100,000 then breaks the app itself, and `CLAUDE.md` forbids runtime
  `fetch()` for local data. The app keeps every function local.
- The catalog in Postgres: a second authority for 1593 records, a sync step
  per data change, egress against 5 GB and the 3 s statement timeout, for
  no gain over static projections; the rejection of 2026-09-24 still holds.
- Two implementations of any rule: every rule the API applies is the app's
  own module, run at build time or bundled into the worker.

The target split: the frontend keeps everything it does today. The backend
serves (1) build-time projections that the app's own modules render and
(2) request-time operations whose answer depends on input or randomness:
roll, filter, search, file check, and the two Supabase reads. Supabase
stays the only store and the authority for account data.

### 3.4 The contract (owner clarification 2)

Resource-oriented REST, version in the path, both languages in every text
field, JSON only. B1 ships the first column; later batches add rows
additively.

| Resource | Operation | Batch | Answer |
|---|---|---|---|
| `GET /api/v1/openapi.json` | the description | B1 | OpenAPI 3.1 |
| `GET /api/v1/rolls` | list the roll sections, their modes, parts and options | B1 | `daggerheart-loot/api-rolls` v1 |
| `POST /api/v1/rolls/{section}` | roll a section, or resolve a typed number | B1 | `daggerheart-loot/api-roll` v1 |
| `GET /api/v1/tables` | list the catalog tables | B1 | `daggerheart-loot/api-tables` v1 |
| `GET /api/v1/tables/{table}` | one table's rows; `part` (required on `eq_weapon`, `eq_secondary`, `eq_armor`) | B1; `filter` B3 | `daggerheart-loot/api-table` v1 |
| `GET /api/v1/records/{id}` | one catalog record | B1 | `daggerheart-loot/record` v1 |
| `GET /api/v1/catalog/index.json`, then the chunk URLs it names | every catalog record, in few reads; static files, no Functions request | B1 | `daggerheart-loot/api-catalog` v1; chunks `daggerheart-loot/api-catalog-chunk` v1 |
| `GET /api/v1/homebrew-items/{uuid}` | one homebrew item | B1 | `daggerheart-loot/record` v1 |
| `GET /api/v1/shared-lists/{token}` | one share link's list | B1 | `daggerheart-loot/api-shared-list` v1 |
| `GET /api/v1/records?q=&kind=&source=&table=&tier=&rarity=&limit=` | search and filter the catalog | B3 | `daggerheart-loot/api-records` v1 |
| `POST /api/v1/file-checks` | check a lists or homebrew file | B3 | `daggerheart-loot/api-file-check` v1 |
| `/api/v1/me/...` | the reader's lists and homebrew items, read and write (section 6, B5b) | B5b | `api-my-lists`, `api-my-list`, `api-my-items`, `api-my-item` v1 |

Versioning and the frozen-contract policy (decision D3, below): the paths,
parameter names, field names, the values of each answer's `format` field
and the CORS rule of v1 are frozen once published (section 11 lists
them). In place: a new optional parameter, a new field, a new resource,
a widened value list (the rule of 2026-10-21, "A value list of a frozen file
schema widens in place"). Anything else is `/api/v2/` beside v1, and v1
keeps answering. Clients must ignore unknown fields; `openapi.json` says so.
Each answer names its `format` and `version`. Owner rule (2026-11-10, D3):
`openapi.json` is the one source for the MCP tools, and no extension point
is added before a second consumer needs it.

Sources and license (owner Q2 = A, 2026-11-10, D3): the API serves every
source `data.json` publishes. Each record carries `source`, `link` and
`rights` (section 5.3); `openapi.json` `info.description` carries the DPCGL
notice of `README.md`, "Rights". The `rights` value of each record comes
from B0's per-record audit table `docs/rights/records.json` (owner Q6 =
C), read at build time; B1's squash waits on the owner's review of it,
and until that review `licenseOf` answers `owner` for every record.
The API serves the Russian text on the same reading as the site and
`data.json` (owner Q7 = A).

CORS (owner, 2026-11-10, D3): every public (T0) answer under `/api/v1/`
carries `Access-Control-Allow-Origin: *` and no
`Access-Control-Allow-Credentials`; an `OPTIONS` request answers 204 with
`Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET,
POST, OPTIONS`, `Access-Control-Allow-Headers: Content-Type` and
`Access-Control-Max-Age: 86400`. A browser client calls the API directly,
with no proxy. The account paths `/api/v1/me/` (B5) are outside the
promise of this rule: in v1 the prefix is reserved and holds no data, so
its JSON 404 and its preflight carry `*` only as the one responder's
default (section 5.1); B5b replaces both answers with an explicit
`Origin` allowlist, never `*` (empty at B5b; the reason is in B5b). The
static catalog files under `/api/v1/catalog/` and the catalog image URLs
under `<site>img/` and `<site>og/` answer `Access-Control-Allow-Origin: *` from Pages, which
the `check-site` probe holds (B1 step 9). `/mcp` (B2) sends no
CORS headers and answers 403 to a browser `Origin` (MCP spec, DNS
rebinding). `apidata/` stays internal (`CONTRACTS.md` section 5): a
browser client has the frozen `/api/v1/` and no reason to bind to it.

Auth tiers:

| Tier | Serves | Status |
|---|---|---|
| T0 public read, no key | rolls, tables, records, the bulk catalog, homebrew items by id, shared lists by token, file checks; an `Authorization` header is ignored and never forwarded, so a T0 answer never depends on the caller | B1-B3 |
| T1 API key | higher limits or revocation for one client | left out: a key needs a store (a table and an issue screen) or a Pages secret per client (a deploy per key), and the worker cannot count a quota per key without a store |
| T2 OAuth 2.1 (Supabase Auth server) | the reader's own lists and homebrew items, read and write, under `/api/v1/me/` and `/mcp/me`; an OAuth client token only (a token with `client_id`) | B5a (the guard and consent), B5b (the API) |

Sync (one design for catalog and account data, 2026-11-11): a consumer
pulls; daggerheart-loot is the authority and never pushes. Each
collection has a head list of `{ id, rev }`: the client diffs it against
what it holds, re-reads each id whose `rev` moved in batches, and drops
each id the head no longer lists (a delete; no tombstones exist, so
`updated_since` is not offered). The catalog's head is
`/api/v1/catalog/index.json` (`rev` per record, `data_version` for the
whole: an equal `data_version` skips the diff); the account's heads are
`GET /api/v1/me/lists` and `GET /api/v1/me/homebrew-items` (`rev` is the
row's `revision`; an account `rev` covers the row's own fields - `book`
and `content` for an item, the list fields and entries for a list - not
the parts of `record` drawn from other rows; a client that keeps
`record` reads it again when it reads that row, and reads each linked
item by the item heads), the pattern of the app's own re-read
(`docs/decisions/`, 2026-10-02, "The account re-read fetches only lists
whose revision moved"). Every head gives `rev` as an opaque string (an
account row: its revision in decimal), compared for equality only;
`ETag` is `"<rev>"`. Account writes are commands, not replication:
each create carries a client-made uuid (a retry is idempotent, as the
app's `upsert ... ignoreDuplicates` and `on conflict (id) do nothing`),
each homebrew-item update and each delete carries `If-Match: "<rev>"`
(on the row revision), and a list `PATCH` takes an optional `If-Match`;
without it, list fields follow the app's last-writer-wins rule (section
6, B5b).
Rejected: two-way replication (a merge on a third party's model); an
`updated_since` cursor (deletes are invisible without a tombstone table,
a migration, and clock skew); a collection `ETag` (a 304 costs the same
Functions request and Supabase read). A record's `id` is the sync key:
a catalog id is never renumbered (`CLAUDE.md`), a homebrew `id` is its
row uuid for the row's life, and `key` (section 5.3) is the value every
relation field holds.

Rate limits: none per client, because counting needs state the worker may
not keep, and the free `pages.dev` host has no Cloudflare rate-limit rule
(it is not a zone the owner holds). The guard is the design: discovery
answers carry `ETag` and `Cache-Control: public, max-age=300`, a roll is
one request, and `openapi.json` and `llms.txt` state fair use ("cache the
lists; at most one request per user action"). A quota burn stops the cards,
the API and MCP until 00:00 UTC; the app itself, the record pages and every
`#/` address keep working, because static files cost no Functions request
(unverified, as for the cards). Accepted for the cards on 2026-10-14; this
plan extends the same acceptance (owner Q5 = yes, 2026-11-10).

CORS and the quota: a browser `POST` roll with `Content-Type:
application/json` sends a preflight, and each preflight is one more
Functions request on the shared 100,000. A `GET` with no custom header is
a simple request and sends none. `Access-Control-Max-Age: 86400` lets a
browser reuse the preflight per origin and URL; Chromium caps the reuse at
7200 s and Firefox at 86400 s (vendor documentation, not verified in this
session), so a browser tool that rolls one section pays at most one
preflight per 2 hours on Chromium. Browser traffic now reaches the quota
directly; the guard is the same fair-use text, and a quota burn has the
same effect as from a server.

Sync and the quota: a catalog pull reads static files only (no Functions
request at any rate). An account sync costs two head reads plus one read
per 10 changed items and one read per changed list (a list has no batch
read), each a Functions request (and one to three
PostgREST calls on Supabase, which has no request quota on the Free plan,
egress apart). A background poll every 15 minutes is 96 x 2 = 192
requests a day per user, so 100 polling users take about 19 % of the
shared 100,000; every 5 minutes, about 58 %. The ceiling: at one poll
per 15 minutes the shared quota holds about 500 polling users in all
(100,000 / 192), less the app's card traffic; nothing shows when the
quota is near (section 10). The fair-use text of B5b
therefore says: sync on a user action; a background sync at most once
per 15 minutes per user. Token refresh goes from the client to Supabase
Auth directly and costs no Functions request.

Payload formats: one neutral record, `daggerheart-loot/record` v1
(section 5.3), with normalized stats (damage dice and bonus apart, named
thresholds, numeric burden, enum traits and ranges), so a target mapping is
mechanical. There is no `format=` parameter and no published mapping:
every consumer maps the neutral record as it wants (owner Q1,
2026-11-10, D3).

Caching: every `apidata/` file carries `data_version` (the hash the build
writes into `apidata/version.json`). A projection answer carries `ETag:
"<data_version>"` of the files this answer read, and answers 304 to a
matching `If-None-Match`; a 304 still costs one Functions request, so the
saving is bytes and CPU, not quota. Homebrew, shared lists and rolls
answer `Cache-Control: no-store`; every `/api/v1/me/` answer (B5b)
answers `Cache-Control: private, no-store`. The static catalog files
carry the `ETag` and `Cache-Control` that Pages sends (free).

OpenAPI as the one source: `preview/api/openapi.json` (hand-written,
committed) names every operation, parameter and schema. The REST adapter
routes by it; the MCP adapter (B2) builds `tools/list` from each operation's
`x-mcp-tool` name, `summary`, `description` and parameter schemas at isolate
start. A test holds the parameter parsers to the document.

Left out until a second real consumer asks (`CLAUDE.md`: no abstraction
ahead of need): API keys and quotas per key;
`Access-Control-Expose-Headers` (a browser's HTTP cache revalidates with
`ETag` without it); webhooks and MCP `subscriptions/listen`; cursors (a table answers whole, or
one tier part for an `eq_*` table: the largest answer is 145 rows today,
`dv` and the tier 3 part of `eq_weapon`, and 435 at 3x; `eq_weapon` whole
is 512 rows today and 1536 at 3x, which is why its `part` is required);
`sort` and `fields` parameters; batch reads of catalog records by many
ids (the bulk catalog serves the whole catalog in few static reads; B5b's
`?ids=` serves the reader's own items); clipboard text;
prices; GraphQL; client
SDKs; a Discord interactions endpoint (a bot is a REST client); localized
error messages (English text and a stable `code`).

Where flexibility costs more than it earns:

- Full-text search composed with arbitrary filters at request time: 10 ms
  CPU. B3 measures before any promise past names and facets.
- Per-target mappers for schemas that change fast (Charkeeper's item
  modules moved and `bonuses` became `modifiers` between two sessions): a
  frozen mapper on a moving target breaks either the freeze or the target.
- API keys without a store: they cannot meter, only revoke, and each key is
  a deploy.
- Moving app functions behind HTTP: loses the static-host behavior and
  gains nothing a projection does not give.

### 3.5 CPU and size budgets

Measured 2026-11-10 in Node on this host (`context.md`): the largest table
in full, `voa`, 167,888 B, parses in 1.2 ms; its lean rows are 15,315 B.
The equipment tables are larger: `eq_weapon` 512 rows, `eq_secondary` 148,
`eq_armor` 118. The lean rows of `eq_weapon` (id, n, name, kind, tier,
rarity, part, rung) are 74,986 B without `eq` and 144,444 B with it, so the
whole table passes the 131072 B budget at 3x without `eq` and today with
it. The table rows therefore carry no `eq` (a client reads stats from
`records/{id}`), and each `eq_*` table is cut by tier. The worker runtime
is slower than this host by an unknown factor, so the projections hold
every record and index file at most 65536 B, every roll, table and cards
file at most 131072 B, and a request reads at most five files:

| File | Holds | Budget (`tests/derived.js`) | Today | At 3x, est. |
|---|---|---|---|---|
| `apidata/rolls.json` | roll sections, modes, parts, options, links | 65536 B | about 10 KB, est. | about 30 KB |
| `apidata/tables.json` | catalog tables, parts, row counts, links | 65536 B | about 8 KB, est. | about 24 KB |
| `apidata/cards.json` | the catalog `refs` and `sets`, and `members`: for each catalog set key, its member records cut to `id`, `src`, `kind`, `set`, `en`, `ru`, `ende` and `rud` (5 records today); for a homebrew record and a shared list | 131072 B | about 33 KB (29,854 B measured, plus 2,993 B of members, measured) | about 100 KB |
| `apidata/roll/<section>.json` | a lean loot of the tables one roll section reads; each record carries its chunk number `c` | 131072 B | at most about 30 KB (`std`: four tables), est. | about 90 KB |
| `apidata/table/<table>.json` | a table's rows: id, n, name, kind, part, tier, rarity, rung; no `eq` | 131072 B | at most 20,816 B (`dv`, 145 rows), measured | about 63 KB |
| `apidata/table/<eq table>/<tier>.json` | one tier part (`1`-`4`, `A`) of `eq_weapon`, `eq_secondary` or `eq_armor`, the same row fields | 131072 B | at most 21,511 B (`eq_weapon` tier 3, 145 rows), measured | about 65 KB (435 rows) |
| `api/v1/catalog/<n>.json` (public, static; the worker reads the same files) | `{ format: "daggerheart-loot/api-catalog-chunk", version, data_version, records: [<record v1>] }`, packed in id order to at most 65536 B a file | 65536 B each | about 36-46 files (2.3-3.0 MB), est. | about 110-140 files |
| `api/v1/catalog/index.json` (public, static, not read by the worker) | `{ format: "daggerheart-loot/api-catalog", version, data_version, chunks: ["<site>api/v1/catalog/<n>.json", ...], records: [{ "id", "rev", "chunk" }] }`; `rev` is an opaque string, today the first 8 hex of SHA-256 over the record's JSON; `chunk` indexes `chunks` | 262144 B | about 69 KB (1593 rows such as `{"id":"ci12","rev":"0123abcd","chunk":12},`, about 43 B), est. | about 210 KB (longer synthetic ids) |
| `apidata/records/index.json` (internal) | `chunks`: the ids of each record file, one list per file | 65536 B | about 16 KB, est. | about 57 KB, near the budget |
| `apidata/version.json` | the data version: a hash over every other output rendered with `data_version` empty, then stamped into each file | - | 40 B | 40 B |

Every file is `{ format, version, data_version, ... }`. The build reports
the real chunk count and the size of `records/index.json`; B1 writes both
into `.claude/README.md`, "The CI deploy".

Reads per operation (heaviest case at today's size):

| Operation | Reads | Parsed at most |
|---|---|---|
| `GET /rolls` | `rolls.json` (cached) | about 10 KB |
| `POST /rolls/{section}` | `roll/<section>.json`, then each distinct record file of the results (at most four), by the rows' `c`; no `records/index.json` | about 30 KB + 4 x 64 KB = about 290 KB (`std`, the heaviest) |
| `GET /tables` | `tables.json` (cached) | about 8 KB |
| `GET /tables/{table}` | `tables.json` (cached), one table or tier file | about 30 KB |
| `GET /records/{id}` | `records/index.json` (cached), one record file | about 80 KB |
| `GET /homebrew-items/{uuid}` | `get_homebrew_item` (cap 65536 B), `cards.json` (cached) | about 100 KB |
| `GET /shared-lists/{token}` | `get_shared_list` (cap 65536 B), `names.json` (cached, 93 KB), `cards.json` (cached) | about 190 KB cold |

A `data_version` mismatch adds one read (Risk rule below). Fallback, if
the owner's cold `std` reading passes 5 ms: the record files hold one
record per line, the roll rows carry `[c, line]`, and the service parses
only the lines of its results. The contract does not change.

File count: about 90-100 files today against Cloudflare's 20,000 a
deployment (6573 today, about 19,700 at 3x before this task); at 3x the
projections add about 165-195. That stays under the limit, with about 105
files to spare, and `.claude/README.md`, "The CI deploy", records the new
margin. A projection per record was rejected for this reason (1593 more
files today, 4779 at 3x).

The worker keeps `rolls.json`, `tables.json`, `cards.json` and
`records/index.json` in isolate memory for 10 minutes, as it keeps
`names.json`. An isolate can outlive a deployment (`worker.mjs`), so a
cached file and a fresh file can come from two data versions. Rule: when a
fresh file's `data_version` differs from the cached file's, or a record
file lacks an id that the cached index places in it, the service reads the
cached file again once; a second mismatch answers 503 `unavailable`.

### 3.6 Product law and contract changes this design forces

- `CLAUDE.md`, "Product laws", first line, becomes: "The Supabase backend is
  the only server that stores data; one stateless Worker renders link cards
  and answers the read API and the MCP endpoint, and stores nothing. Add no
  other backend, upload endpoint or paste service." (B1; B2 needs no second
  edit; B5b adds "and relays a connected app's account calls to Supabase
  with the reader's token" to the sentence and its copies.)
- The copies of that law change in the same commit: `PRODUCT.md` (line
  78); `META.md` section 3, first paragraph (line 104) and last paragraph
  (lines 243-258), where "an answer stays a few KB at any set size" and
  "keeps `names.json` in memory ... and nothing else" become false and are
  rewritten: the API's reads (`apidata/` through `env.ASSETS`,
  `get_homebrew_item` and `get_shared_list` as `anon` with a 65536 B cap),
  the files kept in memory, no log, no cookie, no stored state;
  `.claude/README.md`, "Preview host" (line 3625); `README.md` and
  `README.ru.md`, the `preview/` line of the file tree ("the site host's
  worker: link cards for messengers" and its Russian twin); `llms.txt`,
  "no public API" in the summary under the title and in "What this site
  cannot do", and "there is no API" in "Lists as a file (import-v1)" and
  "Homebrew items as a file (homebrew-v2)". `META.md` section 7: `/mcp`
  stays in the 404 list until B2.
- `CONTRACTS.md`: a new section 6, "The read API", with the paths, the
  freeze policy and the fixtures `docs/fixtures/api/`; section 5 reserves
  `/api/` beside `/mcp` (whose `/mcp/me` B5b takes) and
  `/.well-known/oauth-protected-resource/` for B5b, names
  `/api/v1/catalog/` as the published static part of `/api/`, and calls
  `apidata/` internal, changed without
  notice, like `img/thumb/`; the "Fixtures:" paragraph names
  `docs/fixtures/api/v1/`; B2 adds the MCP endpoint and
  `docs/fixtures/mcp/`.
- `llms.txt`: "no public API" becomes the read API (B1) and the MCP
  endpoint with how to add it in Claude and ChatGPT (B2).
- Decisions (written by B1): D1, D2, D3 and D6 below; D6 amends the
  2026-10-21 decision on task branches; D1 amends "Link previews come
  from a stateless worker" (2026-10-14) in both files. D5 is written by B0.
- Privacy pages (`pages/src/privacy.html`, `pages/src/en/privacy.html`),
  owner answer of 2026-11-10: B1 adds one sentence to "Link previews" in
  both pages, with the same facts: shared lists and homebrew items are
  readable by programs through the public API, to anyone who holds the
  link. The "Last changed" date in both pages becomes the B1 date. B5a
  changes them again: a reader's lists and homebrew items reach the app
  or AI vendor the reader connects, under that party's own policy, until
  the reader disconnects it on `#/account`; both pages also state the
  same facts as the consent page's scope sentence (B5a step 5), and the
  account's email and name when B5a step 1 finds them in the client
  token (plan-B5a-R5).
- The Cloudflare token keeps "Workers Scripts Edit"? The worker stays a
  Pages Function, so B1 does not need it; the owner may remove it after B2
  (`.claude/README.md`, "Preview host" asks `ai-mcp` to decide).

### 3.7 Assumptions about the host (`cloudflare-pages`)

The plan assumes the shipped state: the Pages project `daggerheart-loot`
on the free Workers plan, advanced mode `_worker.js`, `_routes.json`
routing, `env.ASSETS` reads that are not subrequests, CI deploys of `main`
only, and the site at the host root. What moves if that changes:

| Change | Effect |
|---|---|
| A custom domain | the API and MCP URLs are frozen on `pages.dev` from B1; a custom domain is added beside, never instead |
| The paid Workers plan | CPU 30 s and 10 million requests a month: the 64 KB budgets may relax, B3's fallback is not needed; no contract change |
| A move off Cloudflare | the worker code is plain `fetch` handlers; the projections are static files; `env.ASSETS` becomes a file read |
| Static requests found to cost Functions requests | the quota math of section 3.4 doubles for the app's traffic, not the API's; owner question for that day |

### 3.8 Maintaining two entry points (owner question, 2026-11-10)

The app and the API are two entry points to the same rules. The app does
not call the API. Checked against the repository at `342c91c4`:

1. One implementation of each rule. The rules are pure modules in
   `app/src/lib/` (`roll.ts`, `std.ts`, `alt.ts`, `sections.ts`,
   `tables.ts`, `data.ts`, `filters.ts`, `facets.ts`, `search.ts`,
   `bundle.ts`, `homebrewFile.ts`, `cloudLists.ts`, `hash.ts`, `art.ts`;
   all exist). The app imports them; the worker bundles the same files
   (B1 step 6). B1 adds two: `rollTables.ts` (moved out of `App.svelte`,
   which both call) and `apiRecord.ts` (built only from existing
   functions).
2. One data source. `data.js` is the only catalog authority; B1's
   `tools/api-data.mjs` renders `apidata/` from it at build time with
   those modules, in the same deploy as the app.
3. Enforcement by tests. Pinned fixtures (`docs/fixtures/api/v1/`,
   compared byte for byte), `tests/contracts.js` (fixtures, routes,
   `openapi.json` paths against `CONTRACTS.md` section 6), and the parity
   tests: the worker's roll pool equals the app's pool for every section
   and part (B1 step 5), and a fixed `random` gives the record the app's
   panel gives (B1 step 10).
4. The residual cost. Each new operation needs a service function, an
   `openapi.json` entry and a fixture. Anything the app computes in a
   component and the API needs must first move into a pure module: the
   tables page composes `passes` and `matches` of `lib/` inside
   `TablesPage.svelte` (the facet and search composition), so B3 extracts
   it before `filter` and `q` can be served. A change of a shared module
   can change an API answer; the pinned fixtures are the second gate that
   catches it, and an intended change re-pins a fixture inside the v1
   freeze rules (section 11).
5. Rejected: the app as a client of the API. Every page would gain a
   loading and a failure state, a quota burn would take the app down,
   `CLAUDE.md` forbids runtime `fetch()` for local data, the app would
   lose its offline use, and the app would become the API's largest
   client on the shared 100,000 requests.
6. Revisit rule. If drift shows in practice, move that one area behind
   the API in its own batch. The signal: a parity test of B1 steps 5 or
   10 fails twice on changes that touched one side only, or a review
   finds one rule implemented twice (in `preview/api/` and in
   `app/src/`). D2 records the rule.

## 4. Decisions settled by this plan (to `docs/decisions/`: D1-D3 and D6 in B1, D5 in B0, D4 in B2, D7 in B5a)

- D1 "The read API and MCP are one stateless worker over build-time
  projections". Rejected: (a) MCP-only logic (a second consumer
  re-implements it); (b) a Supabase-hosted API (a second authority or a
  deploy per data change, a project-ref URL, a broad access token, a third
  runtime); the catalog in Postgres (2026-09-24 still holds); an HTTP hop
  from MCP to REST (a second request per call); a projection file per record
  (file count at 3x). D1 also states why the API takes the full reads
  `get_homebrew_item` and `get_shared_list` that the cards rejected: a
  client needs the whole item and the whole list, which a card does not.
  The cap is 65536 B, the `ITEM_MAX` precedent: at the rate measured on
  2026-10-14 (43-71 ms CPU for a 1,745,628 B answer, about 25-40 ms a MB)
  it costs about 1.6-2.6 ms; past it the answer is 422 with the app link.
- D2 "The app keeps its logic; the API runs the same pure modules".
  Holds section 3.8: one implementation in `app/src/lib/`, one data source
  (`data.js` to `apidata/` at build time), fixtures and parity tests as
  the enforcement, the residual cost per operation, and the revisit rule
  (a parity test failing twice on one-sided changes, or a rule found
  implemented twice, moves that one area behind the API in its own
  batch). Rejected: the app as an API client (loading and failure states
  on every page, a quota burn takes the app down, no runtime `fetch()` for
  local data, no offline use, the app as the API's largest client); a
  second implementation in the worker (two rules drift); rendering at
  request time from full `data.json` (896 KB to 1.1 MB against 10 ms).
- D3 "API v1 is public read, frozen, with a v2 beside it for a break".
  Holds the owner rules of 2026-11-10: `openapi.json` is the one source for
  the MCP tools, and no extension point before a second consumer; Q2 = A,
  every source `data.json` publishes, each record with `source`, `link` and
  `rights`, and the DPCGL notice in `openapi.json`; Q1, the API serves the
  neutral record and the contract only, with no published mapping and no
  `format=` parameter, and every consumer maps as it wants; CORS
  `Access-Control-Allow-Origin: *` without credentials on the public
  `/api/v1/` answers, with the `OPTIONS` answer of section 3.4, and an
  explicit allowlist for the account paths of B5. Rejected: API keys now
  (no store to meter with); no CORS (every browser tool would need its own
  proxy, and a proxy costs the same quota); a T0 `Origin` allowlist (a
  deploy per client, and no store to keep it); a per-target payload or a
  published mapping (a moving third-party schema, Charkeeper's import
  changed between two sessions); cursors and sort parameters (whole
  tables and tier parts are small); Core and Hope & Fear only (Q2 = B: the
  supplements are the larger part of the value).
- D5 (B0) "Game text rights follow a per-record SRD 2.0 audit". Owner Q6
  = C and Q7 = A (2026-11-10): `docs/rights/records.json` gives each
  record `dpcgl` only where the SRD 2.0 holds its text (a page named),
  else `owner`; every source row is `owner`; while the table's `reviewed`
  is null, every record resolves to `owner`. `dpcgl` means "the English
  text is SRD 2.0 Public Game Content": the Russian text is a third-party
  translation (Adaptive Content, DPCGL 1.7), which the value does not
  cover, credited apart by the sources of `README.md`, "Sources". The API serves the Russian
  text on the same reading as the site and `data.json`, and the takedown
  promise covers the API; every copy of the license statement says the
  same. Rejected: a value per source (Q6 A: wrong for part of the frame
  records either way); frames `dpcgl` (Q6 B: clauses 1.5(c) and 1.9.3);
  a written request to Darrington Press first (Q7 B: an unknown delay);
  English only for `dpcgl` records (Q7 C: breaks RU/EN parity).
- D6 (B1) "ai-mcp lands on main in two squashes" (plan-B1-3-R1). Owner,
  2026-11-10: "publish as soon as B1 ships". The first squash follows
  B1's approving batch review and a green CI run of the tip, after the
  orchestrator confirms that `docs/rights/records.json` `reviewed` holds
  a date; `issues/ai-mcp/` goes onto `main` with it; `claude/ai-mcp` then
  merges `origin/main` and carries on; the second squash is the closeout.
  Amends "A task branch pushes every batch; a green CI run of the same
  tree gates main" (2026-10-21); precedent "Task 57 lands on main in
  three waves" (2026-10-29). Rejected: one squash at closeout
  (publication waits on B2-B5); a squash per batch; the task directory
  left out of the squash.
- D4 (B2) "The MCP endpoint is a hand-written dispatcher generated from the
  OpenAPI document". Rejected: `createMcpHandler` of the `agents` package
  (a dependency in a package that holds only `wrangler`, bundle size, and
  its `2026-07-28` support is not confirmed); `McpAgent` (a Durable Object,
  stored state).
- D7 (B5a) "A connected app reaches only the API's account scope, and the
  database enforces it". A Supabase OAuth access token is a normal
  `authenticated` JWT plus `client_id` (no custom scopes; verified
  2026-11-11, `context.md`), so its holder can call PostgREST at
  `<ref>.supabase.co` directly, past the worker. The guard therefore
  lives in Postgres: a PostgREST pre-request function refuses a token
  with `client_id` on every table and RPC outside the API's list,
  restrictive policies on the other tables refuse it too (they bound
  resource embedding, which the pre-request function cannot see), and
  restrictive storage policies refuse its writes; the pre-request
  function also refuses a client token whose session a revoke ended,
  so "Disconnect" stops an unexpired token at once. One grant level ("read
  and change your lists and homebrew items"); sync by heads, commands
  with client ids and `If-Match` (section 3.4); the worker relays only a
  token with `client_id`, keeps none, and never sees a refresh token; the
  `/me` CORS allowlist is empty until a browser client is reviewed.
  Rejected: scope enforced by the worker only (the token works without
  it); a per-client read-only level (needs a client table; Supabase has
  no custom scopes); accepting the app's own session token on the API (it
  carries the whole account, sign-in and deletion included); `*` on
  `/me`; audience binding by a custom access token hook (it would change
  the app's own tokens; one project is both the authorization server and
  the resource behind the worker); two-way replication; an
  `updated_since` cursor.

## 5. Contracts in detail (B1)

### 5.1 Common rules

- Host: `https://daggerheart-loot.pages.dev`; the API answers only on the
  production host, as the cards (the host guard answers 301).
- Methods: `GET` and `HEAD` on reads, `POST` on `/api/v1/rolls/{section}`,
  `OPTIONS` on every path under `/api/`; any other method answers 405 with
  `Allow` (`GET, HEAD, OPTIONS` on a read path, `POST, OPTIONS` on a roll
  path). A `POST` whose `Content-Type` is not `application/json`
  (parameters such as `charset` allowed) answers 415: the body is JSON
  only, and a form or text body is not a supported shape. The media type
  is compared without regard to case. An empty body with
  `application/json` reads as `{}`, because the `table` and `part` modes
  have only optional fields; the schema check then decides.
- Check order (plan-B1-3-N5; section 11 freezes the status of each case,
  and the fixtures pin this order): the host guard 301, `OPTIONS` 204,
  the path template 404, the method 405, the section or table id 404,
  415, 413, then the body parse and the schema 400.
- `OPTIONS` (the CORS preflight) on bare `/api` and on any path under
  `/api/`, a known path or not: 204, no body, `Access-Control-Allow-Origin: *`,
  `Access-Control-Allow-Methods: GET, POST, OPTIONS`,
  `Access-Control-Allow-Headers: Content-Type`, `Access-Control-Max-Age:
  86400`, and the security headers below except `Content-Type` (no
  body). The router answers it before
  the path lookup, so a preflight never reads a file; the request that
  follows gets its own 404 or 405. It sends no
  `Access-Control-Allow-Credentials` and no `Vary: Origin` (the value is
  `*` for every origin).
- Answer headers on every answer under `/api/` (the static catalog
  apart, below), an error, a 304 and a
  thrown error included: `Access-Control-Allow-Origin: *` (bare `/api` and
  an unknown path too: one rule in one responder, so a browser client can
  read every error), `Content-Type: application/json; charset=utf-8`,
  `X-Content-Type-Options: nosniff`, `Content-Security-Policy: default-src
  'none'; frame-ancestors 'none'; sandbox` (an API answer is not an app
  document, so the cross-host objection to a CSP on the app does not
  apply), `X-Robots-Tag: noindex, nofollow`, `Referrer-Policy: no-referrer`;
  `Cache-Control` and `ETag` by section 3.4. `rest.mjs` has its own JSON
  responder; it never calls `answer()` or `failed()` of `worker.mjs`,
  which send `text/html`. The CSP `sandbox` and `nosniff` stay with CORS:
  CORS lets another origin's script read the JSON, and the two headers
  keep a browser from running or sniffing it as a document.
- The one exception (plan-B1-3-N6): the host guard's 301 on a deployment
  host or a branch alias still comes from `answer()` in `worker.mjs`,
  before `rest.mjs` runs. It has no CORS header, no `nosniff` and no JSON
  body, because the API answers on the production host only.
- The path prefix `/api/v1/me/` is reserved for B5 and answers the JSON
  404 in v1, and its preflight the 204 above, both with
  `Access-Control-Allow-Origin: *`. They carry `*` only because the path
  is reserved and holds no data in v1; v1 promises no CORS rule for it.
  `CONTRACTS.md` section 6 states this, and that B5 replaces both answers
  with an explicit `Origin` allowlist instead of `*`.
- Bare `/api` and any unknown path under `/api/` answer the JSON 404,
  except under `/api/v1/catalog/`: there a miss is Pages' `404.html` with
  status 404.
- The static catalog files (`/api/v1/catalog/*`, section 3.5) are the
  one part of `/api/v1/` that Pages serves: `_routes.json` excludes the
  prefix, so they cost no Functions request and carry the Pages headers
  (`Access-Control-Allow-Origin: *`, held by the `check-site` probe),
  plus a `_headers` rule with `X-Robots-Tag: noindex` and
  `X-Content-Type-Options: nosniff`. They take no `OPTIONS` answer of
  this section and no CSP `sandbox` (a static JSON file is not run).
- T0 paths ignore an `Authorization` header and never forward it: every
  Supabase read of B1-B3 runs as `anon`, so a T0 answer never depends on
  the caller, and `*` stays safe. Only `/api/v1/me/` (B5b) reads it.
- A path run past 2048 characters reads as empty (the cards' rule). A
  request body past 4096 bytes (rolls) answers 413 before parsing.
- Errors: `{ "format": "daggerheart-loot/api-error", "version": 1, "error":
  { "code": "<code>", "message": "<English sentence: the cause and the
  expected state>" } }`. A message names a field by its schema name and
  never echoes the raw path, a parameter value or the body.

| Status | `code` | When |
|---|---|---|
| 400 | `bad_request` | a parameter or body field fails its schema; the message names the field (for a missing `part` on an `eq_*` table, the part list too) |
| 404 | `not_found` | an unknown path, section, table, part, record id, homebrew id or share token |
| 405 | `method_not_allowed` | another method; `Allow` names the allowed ones |
| 413 | `too_large` | a request body past its cap |
| 415 | `unsupported_media_type` | a `POST` body that is not `application/json` |
| 422 | `answer_too_large` | a Supabase answer past the service's 65536 B cap (a shared list or a homebrew item with very many entries or related rows); the message gives the app link |
| 503 | `unavailable` | an `env.ASSETS` read or a Supabase read failed, timed out or was not valid JSON; a second `data_version` mismatch |

The `code` list widens in place with new resources and cases (B5b adds
401 `unauthorized`, 403 `forbidden`, 409 `conflict` and `limit_reached`,
412 `precondition_failed`, 428 `precondition_required`); a code keeps its
status and meaning for good. `openapi.json` and `CONTRACTS.md` section 6
say from B1: a client that meets a `code` it does not know acts on the
HTTP status.

- Every text a person reads is a pair `{ "ru": "...", "en": "..." }` built
  by the app's own functions, so it follows the app's rule: an empty
  Russian side takes the English text per field (`nameOf`, `descOf`), and
  an empty English side stays `""`. The `rights.notice` and the error
  messages are English only (section 5.3).
- Links are the site's path form, `{ "ru": "<site>i/<id>", "en":
  "<site>i/en/<id>" }` (no `?v`, as `catalog.csv`'s `url`).

### 5.2 Rolls

`GET /api/v1/rolls` answers `rolls.json`: `{ format:
"daggerheart-loot/api-rolls", version: 1, data_version, sections: [ ... ]
}`, one entry per roll section of `SECTIONS` (12: every `roll/*`), in tab
order:

```json
{
  "id": "vault_of_ages",
  "ids": ["voa"],
  "name": { "ru": "...", "en": "Vault of Ages" },
  "mode": "part",
  "link": { "ru": "https://daggerheart-loot.pages.dev/roll/vault_of_ages", "en": "https://daggerheart-loot.pages.dev/en/roll/vault_of_ages" },
  "parts": [{ "id": "1", "name": { "ru": "...", "en": "..." }, "rows": 24 }],
  "options": { "part": { "required": true }, "value": { "min": 1, "max": null } }
}
```

`id` is the section's URL slug without `roll/` (`SECTION_SLUG`,
`ROUTES.md`: `vault_of_ages`, `wondrous_environments`), or the section id
without `roll/` where there is no slug (`std`, `alt`); `ids` holds the old
ids that also resolve (`voa`). `parts[].rows` and `options.value.max` are
the length of the roll pool (`rollPool`, upgrade-line rungs left out), not
of the table: `arazo` rolls 27 of its 78 rows, `ph` 45 of 93. In `table`
mode `options.value.max` is that number; in `part` mode it is `null` and
each part's `rows` is its maximum. `mode` is one of:

| Mode | Sections | Body of `POST /api/v1/rolls/{section}` | Dice in the answer |
|---|---|---|---|
| `std` | `std` | exactly one of `dice` 1-5 and `total` 1-60 (a typed number instead of the dice; both or neither is 400 naming `dice`), `sources` subset of `["core","hnf"]` (default both, never empty), `kinds` subset of `["item","consumable"]` (default both, never empty) | `{ "kind": "nd12", "count": 3, "faces": [4,7,2], "total": 13 }`, or `{ "kind": "typed", "total": 13 }` |
| `alt` | `alt` | `rarity` one of `common uncommon rare very_rare legendary` (required), `kinds`, `hope` and `fear` 1-12 (optional, both or neither) | `{ "kind": "duality", "hope": 5, "fear": 5, "crit": true }`; with `crit` the answer adds `"bump": { "rarity": "rare" }` from `bumpUp`, or no `bump` at the top |
| `table` | `wondrous_environments`, `dread_gm_toolbox`, `dragons_vault`, `arazos_artifacts`, `pistolheart`, `last_round_table`, `escape_the_veiled_halls` | `value` 1-max (optional) | `{ "kind": "pick", "max": 119, "value": 17 }` |
| `part` | `vault_of_ages`, `community_items`, `many_worlds_tavern` | `part` (required, a part id), `value` 1-max of the part (optional) | the same as `table` |

The answer: `{ format: "daggerheart-loot/api-roll", version: 1, section,
part?, dice, results: [ { "record": <record v1>, "n": 13, "col": "hope" } ]
}`. `results` keeps the app's order: `poolFor` (std), `altPicks` (alt), one
record (table, part). `col` exists in `alt` only. `Cache-Control: no-store`.
The section and table ids are checked before any read; an unknown one is
404 `not_found`.

### 5.3 The neutral record `daggerheart-loot/record` v1

Built by `app/src/lib/apiRecord.ts`, for a catalog record at build time and
for a homebrew item at request time:

```json
{
  "format": "daggerheart-loot/record",
  "version": 1,
  "id": "ci12",
  "key": "ci12",
  "origin": "catalog",
  "kind": "item",
  "name": { "ru": "...", "en": "..." },
  "text": { "ru": "<Markdown subset>", "en": "<Markdown subset>" },
  "plain": { "ru": "<markupText>", "en": "<markupText>" },
  "source": { "id": "core", "name": { "ru": "...", "en": "..." } },
  "rights": { "license": "dpcgl", "notice": "This product includes materials from the Daggerheart System Reference Document 2.0, ..." },
  "path": { "ru": "<whereFrom>", "en": "<whereFrom>" },
  "table": "core_item",
  "roll": 12,
  "tier": null,
  "rarity": "common",
  "stats": null,
  "craft": { "into": [], "from": [] },
  "set": null,
  "refs": [],
  "image": { "full": "<site>img/x.webp", "thumb": "<site>img/thumb/x.webp", "card": "<site>og/x.jpg" },
  "link": { "ru": "<site>i/ci12", "en": "<site>i/en/ci12" }
}
```

| Field | Rule |
|---|---|
| `origin` | `catalog` or `homebrew`; a homebrew `id` is the item's row uuid, stable for the row's life and never reused, and `link` is `<site>h/<uuid>` and `<site>en/h/<uuid>` |
| `key` | the value that relation fields (`craft.into`, `craft.from`, `set.members`) and list entries hold: a catalog record's `key` equals its `id`; a homebrew record's is its `hb_` key, which never changes (`homebrew_items_before_update`). A homebrew key is unique within one account only (`CONTRACTS.md`, `hb_` row, "per account"); `id` is the key across accounts. A homebrew record carries no owner, no `mine` and no visibility field: an item is unlisted, readable by anyone who holds its id (`get_homebrew_item`), and `/api/v1/me/` answers hold only the reader's own rows |
| `kind` | `item`, `consumable`, `weapon`, `secondary` or `armor`: `eq.t` when the record has a stat block, else `kind` |
| `name`, `text` | `nameOf`, `descOf` per language: an empty Russian side takes the English text, English never takes Russian (section 5.1) |
| `rights` | `{ "license": "dpcgl" or "owner", "notice": "<English text>" }` (`license`, American spelling: `docs/decisions/`, 2026-10-29; the vocabulary is frozen with v1), per record from the build-time table `docs/rights/records.json` (B0's per-record SRD 2.0 audit, owner Q6 = C): `records[id]`, else the source row, which is always `owner`; while the table's `reviewed` is null, every record is `owner`. `dpcgl` means "the English text is SRD 2.0 Public Game Content" (the Russian text is a third-party translation, credited in `README.md`, "Sources", and not covered by the value; `openapi.json`'s `rights` schema description says so). `dpcgl` carries the DPCGL notice of `README.md`, "Rights" (SRD 2.0 text); a catalog `owner` carries "Text (c) its rights holders; not covered by the DPCGL; served as a play aid."; a homebrew item is `owner` with "Written by a daggerheart-loot user, who holds the rights." |
| `tier` | `eq.tier` for equipment (1-4 or `A`), else the record's `tier` for Vault of Ages (1-4, `A`, `C`), else `null`; `eq.tier` wins when both exist (45 Vault of Ages records carry both, equal today); never inferred (`CLAUDE.md`) |
| `rarity` | `index.rarityOf(id)`, else `null` |
| `stats` | `null`, or `{ "type", "tier", "class", "trait", "range", "damage": { "dice": "d8", "bonus": 2, "type": "phy" }, "burden": 1, "armor_score": 4, "thresholds": { "major": 5, "severe": 11 }, "line": "<head id>" or null, "alt": { "trait", "range", "damage" } or null, "statline": { "ru": "<eqLine>", "en": "<eqLine>" } }`; an absent value is `null`; `dmg` is always `dN` or `dN+K` (the catalog today; homebrew `/^d(4\|6\|8\|10\|12\|20)(\+[1-9][0-9]?)?$/`, `homebrew.ts`), so `damage.dice` is the `dN` part and `bonus` the integer 0-99 after `+` (0 when none, never negative); `burden` is `1`, `2` or `"any"` |
| `thresholds` | `eq.th[0]` is the Major threshold and `eq.th[1]` the Severe one (`dict.ts` `thMajor`, `thSevere`; `i18n.ts` draws `th[0]/th[1]`); B1 corrects the stale `types.ts` comment "Minor and major" |
| `craft` | `into`: `craft`; `from`: `index.craftedFrom` ids; homebrew keys stay keys |
| `set` | `null`, or `{ "key", "name": {...}, "bonus": {...} (Markdown subset), "members": [keys] }` (a catalog member's key is its id) |
| `refs` | the record's rule cards: `{ "key", "name": {...}, "subtitle": {...}, "text": {...}, "url": { "ru", "en" } }` |
| `image` | `null` when the record has no picture; a homebrew own picture is `site.art` (the Storage public base from `env.SUPABASE_URL`, `artBaseOf`) plus `p/` and `t/` names for `full` and `thumb`, `card` null |

The Charkeeper field check (an internal design check of record v1, not
published: owner Q1 says no mapping is published and Charkeeper maps on
its side; it shows that record v1 carries every field Charkeeper's import
needs, and nothing in the repository depends on it after B1):

| Neutral field | Charkeeper import (skill `charkeeper-homebrew-import`, contracts at `38ed87d`, re-verify) |
|---|---|
| `kind` `item` | publication type `item`: `name`, `description` (at most 500 a locale; the rest to `info.features[]`, 250 a locale) |
| `kind` `consumable` | `consumables`: `name`, `description` (en required, at most 500); text past 500 imports as `item` instead; `consume[]` stays empty (no structured consume data) |
| `kind` `weapon` / `secondary` | `weapon`: `kind` `primary weapon` / `secondary weapon`; `info.tier` (1-4; `A` has no mapping: Charkeeper's choice), `info.burden` (`any` has no mapping), `info.trait` (`any` maps to `null`; `spellcast` needs a check), `info.range`, `info.damage_type`, `info.damage` = `stats.damage.dice`, `info.damage_bonus` = `bonus`, `info.versatile` from `stats.alt`, `info.features[]` from `text`; `description` `{}` when empty |
| `kind` `armor` | `armor`: `info.tier`, `info.base_score` = `String(armor_score)`, `info.bonuses.thresholds.major` / `severe` as strings, `description` (en required) from `text` |
| `name`, `text` | `ru` and `en`; Charkeeper's `es` stays absent |
| `image`, `link`, `source`, `rights` | no known field: Charkeeper's choice (attribution) |

### 5.4 Tables, records, homebrew items, shared lists

- `GET /api/v1/tables`: `tables.json`, one entry per catalog table of
  `TABLE_IDS` except `homebrew`, in `TABLE_GROUPS` order: `id` (the URL id),
  `ids`, `name`, `book` (the picker's book name or `null`), `rows`,
  `parts` (for the sectioned tables, and the tier parts of `eq_weapon`,
  `eq_secondary` and `eq_armor` in `tierValues` order), `part_required`
  (true for the three `eq_*` tables), `link`, `roll` (the roll section id
  that rolls this table, or `null`).
- `GET /api/v1/tables/{table}?part=<id>`: `{ format:
  "daggerheart-loot/api-table", version: 1, data_version, table, part?,
  rows: [ { "id", "n", "name": {...}, "kind", "tier", "rarity", "part",
  "rung": false } ] }` in the tables page's order; `n` is the row's own
  number (`roll`, or the alternate tables' face) or `null`; `rung` marks a
  rung of an upgrade line (in the table, never in a roll). The rows carry
  no stats. On `eq_weapon`, `eq_secondary` and `eq_armor` the `part` (the
  tier, `1`-`4` or `A`) is required; without it the answer is 400
  `bad_request`, and the message names `part` and the part list. A full
  record is one more call; a client that needs many uses the shared
  `records/{id}` reads with `ETag`.
- `GET /api/v1/records/{id}`: the neutral record from
  `api/v1/catalog/<n>.json`, the file the cached `apidata/records/index.json`
  names; an id the index does not hold is 404. The record files live at
  `api/v1/catalog/<n>.json`, the public chunks, so one file set serves
  both.
- The bulk catalog (static, section 3.5): a client reads
  `/api/v1/catalog/index.json`, compares `data_version` and each
  record's `rev` with what it holds, and reads only the chunks of the
  changed ids. Frozen: the index URL, both schemas, the `rev` rule
  (`rev` is an opaque string, compared for equality only; it changes
  whenever the record's JSON changes, and may change at other times, and
  a client then reads an unchanged record again), and each `chunks` entry
  being an absolute URL. Not frozen: the chunk names, their count and which ids
  a chunk holds (a client follows the index). A whole pull today is
  about 37-47 static reads (2.3-3.0 MB) and no Functions request.
- `GET /api/v1/homebrew-items/{uuid}`: the id is read as the cards read it
  (leading run of `[0-9A-Fa-f-]`, lowercased, `UUID` pattern), then
  `get_homebrew_item(p_id)` as `anon`, a byte cap of 65536 (past it 422
  `answer_too_large`); `null` is 404. The record: `itemOf` of
  `lib/cloudLists.ts` reads the answer into `record` and `related`. The
  base index is `buildIndex({ items: { set_members: <the records of
  members> }, refs, sets })`, with `refs`, `sets` and `members` (flattened
  into one list) from `apidata/cards.json` (plan-B1-3-1). The item's index
  is `withRecords(base, [record, ...related], [])`, the composition of
  `state/itemView.svelte.ts`. So a catalog rule card that the item names
  resolves; a catalog set resolves with its catalog members (`setOf`) and
  its bonus (`setBonusOf`), as the app shows them; the item's own embedded
  cards join; and `craft.from` reads the author's related items. Then
  `apiRecord(index, record, site, 'owner')`.
- `GET /api/v1/shared-lists/{token}`: a 43-character token, then
  `get_shared_list(p_token)` (the invoker form, `text` only) as `anon`, a
  byte cap of 65536; the answer keeps the list name, the audience, the
  players' note, the GM note only on a GM link, and per entry its id, its
  origin, its count, its notes as the projection gives them, its catalog
  names from `names.json` or its homebrew record from the snapshot. The
  service builds one index for the whole list over the same base,
  `withRecords(base, [], snapshotRecords(row))`, with every snapshot as
  `linked`: the composition of `SharedListPage.svelte` (plan-B1-3-1). A
  snapshot that carries its own set card then gets that bonus
  (`setBonusOf`, the `listed` branch), as the app shows it. Each homebrew
  entry's record comes from that one index, `apiRecord(index, record,
  site, 'owner')`. The newest
  definition at `342c91c4` is
  `supabase/migrations/20261022120000_shared_list_rev_and_bulk_delete.sql`
  (entry fields `id`, `item_key`, `source`, `position`, `quantity`,
  `price_coins`, `player_note`, `snapshot`, `hid`, `img`; on a GM link
  `gm_note`, `gm_only`); B1 step 6 fixes the answer's entry fields from it
  and the fixture pins them.
- What fits under the 65536 B cap, estimated from that definition: about
  400 catalog entries with empty notes on a players' link (about 150 B an
  entry; about 350 on a GM link), or about 10 homebrew entries at the
  longest text (1500 code points a language, about 6 KB a snapshot). B1
  measures both counts with the test's answer builder and writes them into
  `openapi.json` and `.claude/README.md`.

## 6. Batches

### B0 - License statement and per-record rights audit (implement-ready)

Objective: every copy of the project's license statement says the same
facts, `LICENSE` included, and a stored, checked table
`docs/rights/records.json` gives each catalog record its
`rights.license` from a per-record audit against the SRD 2.0 (owner Q6 =
C, Q7 = A, 2026-11-10). D5 records both. The owner reviews the audit
table after the commit; B1's publication and squash wait on that review.

Why a batch of this task and not its own task: B1's `rights` field and
the DPCGL notice in `openapi.json` depend on the table, and v1 freezes at
publication, so B0 must land before B1's squash; one branch carries both
with no cross-branch merge. Split criterion from B1: B1 is a public
contract change and B0 is not (`CLAUDE.md`, "Task and session
protocol").

Why the audit and the statement alignment are one batch: no split
criterion applies. Both change no public contract, run the same gates
(`tests/derived.js`, `check:fast`, one CI run) and reach `main` only with
B1's squash, so a split adds about 20 min of gates and lands nothing
sooner. The owner's review of the table is not a commit boundary: the
batch commits the table with `reviewed: null`, the owner reviews the
committed table, and a correction is a small follow-up commit on the
task branch before B1's squash.

B1 and B0, plainly: B1's implementation does not wait on the audit.
B1's publication and squash do: they need B0 committed and the table's
`reviewed` date set by the owner. The rights values are a build-time
table, so B1 ships with whatever table the audit produces, and no code
changes when a value changes.

Findings (read 2026-11-10 at `342c91c4`):

| Copy | Claims |
|---|---|
| `LICENSE` (after the MIT text) | MIT covers "index.html, style.css, app.js and tools/" (deleted at R0c, `23c00a6`); Core is Public Game Content with the SRD 1.0 notice; Hope & Fear, Wondrous Environments, Community Magic Items and the Alternate tables are "NOT covered"; seven later sources and the campaign frames are not named |
| `README.md` and `README.ru.md`, "Rights" | code `app/`, `tools/`, `tests/` is MIT; Core and Hope & Fear under the DPCGL 2.0 of 25 August 2026, SRD 2.0, SRD 1.0 kept for earlier material; eleven supplements outside; the verbatim SRD 2.0 notice; campaign frames not named |
| `llms.txt`, "License" | the SRD 2.0 notice; Core and Hope & Fear covered; eight supplements outside (Pistolheart, The Last Round Table and Escape the Veiled Halls missing); campaign frames not named |
| `app/src/lib/dict.ts` footer (both languages), `pages/src/terms.html`, `pages/src/en/terms.html` | the SRD 2.0 notice; the footer lists the data sources and credits daggerheart.su for the Russian text |
| `PRODUCT.md`, `docs/specs/FEATURES.md` (footer) | the DPCGL attribution block is required text |
| `data.js` | no rights field; `src` is one of 13 ids (`core`, `hnf`, `wondrous`, `community`, `dread`, `frame`, `voa`, `dv`, `arazo`, `mwt`, `ph`, `lr`, `vh`); `core` 367 records and `hnf` 283 (items, consumables, starting inventory and equipment), `frame` 95 (94 in `frames`, one in `starting`) |
| `tests/derived.js`, "source citation" | holds `README.md`, `README.ru.md`, `llms.txt` and both footers to the SRD 2.0 citation, and the two READMEs' outside list to six names; it never reads `LICENSE` or the terms pages, which is how `LICENSE` kept SRD 1.0 |

Official sources (fetched once, 2026-11-10):

- The DPCGL 2.0 PDF, https://darringtonpress.com/wp-content/uploads/2026/08/DPCGL_2.0_AUG_26_2026.pdf
  ("Last Updated 8/05/2026" in its header; the license page,
  https://darringtonpress.com/license/, dates DPCGL 2.0 25 August 2026).
  1.1: the DRP Games are Candela Obscura, Daggerheart and Daggerheart:
  Hope & Fear. 1.6: Public Game Content is the SRD 2.0, and the SRD 1.0
  remains Public Game Content for existing and legacy content. 1.5(c):
  Prohibited Content includes the exact text of Campaign Frames and
  rulebooks, unless DRP identifies it as Public Game Content. 1.7:
  Adaptive Content includes translated content. 1.9: Permitted Formats
  are print and digital print, streams and video, podcasts and
  whitelisted VTTs; 1.9.1 allows sharing on a VTT only from the
  whitelist; 1.9.3 limits Campaign Frames to actual play. 2.1(a) allows
  sharing the Public Game Content; 2.1(b) limits Adaptive Content to the
  Permitted Formats. 4.1 requires the notice in the shared material; the
  combined Daggerheart notice under section 4 equals the quote in
  `README.md`, "Rights", word for word.
- The SRD page, https://www.daggerheart.com/srd/: only SRD 2.0, dated 25
  August 2026, PDF `DH_SRD_2_2026_08_25.pdf`; its changelog adds Hope &
  Fear loot and equipment and "all campaign frame mechanics" of the Core
  Set and Hope & Fear.
- A planner's text search of that PDF (`pdftotext -layout`) finds the
  Beast Feast "Everyday Hero" weapons (Cleaver, Sharpened Rake), the
  Colossus firearms (Revolver, Shotgun, as tier-scaled rows) and a Holy
  Shotgun, and does not find `Hotspot` or the Beast Feast "Enchanted"
  items. The two-column layout splits names (the same search finds only
  239 of 367 Core names), so a name search alone is not the audit.

Owner answers (2026-11-10): Q6 = C, a per-record audit decides each
record's value; Q7 = A, the API serves the Russian text on the same
reading as the site and `data.json`, and the takedown promise covers the
API. Planner defaults kept from Q6's option A, which C did not replace:
`LICENSE` follows `README.md`; the code list adds `preview/`; the READMEs
credit the Russian text by the sources the `README.md` "Sources" table
names, with no license claim (plan-B1-2-R1).

The table `docs/rights/records.json` (hand-maintained, committed, not
published as a site file; B1's `tools/api-data.mjs` reads it at build
time; the ids, pages and dates below are illustrative):

```json
{
  "format": "daggerheart-loot/rights-audit",
  "version": 1,
  "srd": { "file": "DH_SRD_2_2026_08_25.pdf", "date": "2026-08-25", "url": "https://www.daggerheart.com/srd/" },
  "license": { "name": "DPCGL 2.0", "date": "2026-08-25" },
  "audited": "2026-11-xx",
  "reviewed": null,
  "sources": { "core": "owner", "hnf": "owner", "frame": "owner", "wondrous": "owner", "...": "owner" },
  "records": {
    "ci1": { "license": "dpcgl", "page": 191 },
    "f17": { "license": "owner", "reason": "not found in the SRD 2.0" }
  }
}
```

| Rule | Meaning |
|---|---|
| `sources` | one row for each of the 13 `src` ids; every row is `owner`: a source never grants `dpcgl` |
| `records` | the audit's per-record result; it overrides the source row; a `dpcgl` entry names its SRD 2.0 `page`, the 1-based page index of the PDF file (not the printed page number); an `owner` entry for a `core`, `hnf` or `frame` record names its `reason` |
| resolution | `owner` for every record while `reviewed` is null; else `records[id].license`, else `sources[src]`; a homebrew item is `owner` (B1) |
| `reviewed` | `null` until the owner reviews the table; then the review date. B1's squash requires a date. One date for the whole table: an entry added later (add-source, a new `core`, `hnf` or `frame` record) gets its review in that batch's review, and `reviewed` keeps its date |

If B1 is implemented first, B1 commits this file with the 13 `owner`
source rows, `records: {}` and `audited: null`: valid, and it claims the
DPCGL for nothing. B0 then fills `records`.

In scope: the audit of every `core`, `hnf` and `frame` record (745)
against the SRD 2.0 PDF; `docs/rights/records.json`; `LICENSE` (the part
after the MIT text; the MIT text stays verbatim); `README.md` and
`README.ru.md` "Rights"; `llms.txt` "License" (moved here from B1 step
11); `tests/derived.js` ("source citation" and a new "rights audit"
block); D5; `docs/DECISIONS.md`; one line in `.claude/agents/add-source.md`.

Out of scope: the ten other sources (`wondrous`, `community`, `dread`,
`voa`, `dv`, `arazo`, `mwt`, `ph`, `lr`, `vh`): they are not DRP Games
(DPCGL 1.1) and stay `owner` by their source row, with no per-record
check; the footer and the terms pages' text (B0 only adds them to the
test); `PRODUCT.md`; any `data.js` field; the `RIGHTS` notices and
`apiRecord.ts` (B1).

Files expected: `docs/rights/records.json` (new), `LICENSE`, `README.md`,
`README.ru.md`, `llms.txt`, `tests/derived.js`,
`.claude/agents/add-source.md`,
`docs/decisions/2026-11-10-game-text-rights-follow-a-per-record-srd-audit.md`
(new; D5), `docs/DECISIONS.md` (by `node tools/decisions.js`),
`docs/specs/COVERAGE.md` if it lists the `tests/derived.js` blocks.

Steps:

1. Fetch the SRD 2.0 PDF from the link on https://www.daggerheart.com/srd/
   into a new, empty scratch directory (never into the repository), and
   extract it with `pdftotext -layout` and without `-layout`; the two
   outputs together survive the two-column layout better than either.
2. Audit frame records first, then `core` and `hnf`. The match rule of
   this step is the full procedure. The user-level skill
   `anthropic-skills:daggerheart-source-audit` (in this host's session
   skill list, not a repository file) supplies only terminology, when the
   session lists it; the batch does not depend on it (plan-B1-3-N9). A
   record is `dpcgl` only when the SRD 2.0 holds
   it: the English name and the text (loot and consumables: the roll
   number and the effect; equipment: trait, range, damage, burden and
   feature). A tier-scaled SRD row (for example "Tier 1: d6 phy") covers
   the improved, advanced and legendary records whose values it gives.
   Match rule (plan-B1-2-R5, plan-B1-3-R3): normalize both sides -
   lowercase, punctuation and Markdown markup removed, the ligatures
   U+FB01 and U+FB02 expanded to "fi" and "fl", the soft hyphen U+00AD
   removed, then all whitespace and all hyphens removed, so a word that
   `pdftotext` breaks at a line end or a column edge ("at tack",
   "at-tack") still matches "attack". The record's English name and text
   match when the normalized forms are equal, and stats match when every
   value is equal. A record
   not found is `owner` with the reason "not found in the SRD 2.0"; a
   record found with different normalized text or stats is `owner` with
   the reason "text differs from the SRD 2.0" and the page. A near match
   (the name is found, the text or a stat differs) is `owner` and is
   listed for the owner in step 11. `page` is the 1-based PDF page index.
   Never infer from a source id or a name alone.
3. Write `docs/rights/records.json` by the table above: 13 `owner` source
   rows, one `records` entry for each of the 745 `core`, `hnf` and
   `frame` records (364 in `L.items` and 381 in `L.eq`), `audited` the
   audit date, `reviewed: null`; ids in `data.js` order, two-space JSON,
   one entry per line. "`data.js` order" is the key order of
   `buildIndex(L).byId` (`[...byId.keys()]`; `byId` is a `Map`): the
   `L.items` tables in key order, then the `L.eq` records. B1 step 4
   packs the record files in the same order (plan-B1-3-N1).
4. `tests/derived.js`, new block "rights audit": the file parses and has
   the format above; `sources` has exactly the 13 `src` ids of `data.js`,
   each `owner`; every `core`, `hnf` and `frame` record of `data.js`, in
   both `L.items` (every table) and `L.eq`, has one `records` entry; every `records` id exists in `data.js`; every
   `dpcgl` entry has an integer `page` of at least 1; every `owner` entry of those
   three sources has a non-empty `reason`; so every record resolves to
   exactly one value. Print the counts per source and license.
5. Write D5 from `.claude/templates/decision.template.md`: Q6 = C and Q7
   = A with their reasons; the `rights` vocabulary of record v1
   (`license`: `dpcgl` or `owner`; `notice`: English text); that `dpcgl`
   means "the English text is SRD 2.0 Public Game Content" and the
   Russian text is credited apart (plan-B1-2-R1); the table's home and
   resolution rule, `owner` for every record while `reviewed` is null
   (plan-B1-2-2); the match rule of step 2; that a value change is a data change, not a
   schema change; the rejected options (Q6 A: a source-level value
   claims too much or too little for frame records; Q6 B: frames `dpcgl`
   claims the DPCGL for frame text the SRD may not hold, clauses 1.5(c)
   and 1.9.3; Q7 B: an unknown delay; Q7 C: breaks RU/EN parity). Run
   `node tools/decisions.js`.
6. `LICENSE`, the part after `---`: the MIT scope names `app/`, `tools/`,
   `tests/` and `preview/`; the artwork sentence stays; the game-text
   list says what `README.md`, "Rights" says after step 7, with the
   outside list in its own sentence, as in step 8; the verbatim
   notice of `README.md`, "Rights"; the not-affiliated sentence; the
   takedown sentence with the issues link.
7. `README.md` and `README.ru.md`, "Rights", with the same facts in both:
   the code list adds `preview/`; the covered clause names "the Core,
   Hope & Fear and campaign frame records whose text the SRD 2.0 holds;
   `docs/rights/records.json` names each", used under the DPCGL 2.0
   (plan-B1-2-1); the outside list adds "any Core, Hope & Fear or
   campaign frame record that the SRD 2.0 does not hold"; the tail of the
   outside bullet, "they are paid and fan supplements whose text belongs
   to their own authors" (and its Russian twin "это платные и фанатские
   дополнения, права на тексты которых принадлежат их авторам"), is false
   once the bullet names Core, Hope & Fear and campaign frame records, so
   it becomes "their text belongs to its rights holders" and "права на
   эти тексты принадлежат их правообладателям" (plan-B1-3-N2); one sentence
   credits the Russian text by the sources the "Sources" table names -
   daggerheart.su for Core, a fan translation for Hope & Fear and the
   campaign frames, a community sheet for the Hope & Fear equipment -
   with no license claim (plan-B1-2-R1).
8. `llms.txt`, "License": the same facts as `README.md`; the covered
   clause is the one of step 7. Split the present sentence "Core and Hope
   & Fear are covered by that license; ... are not - they belong to their
   own authors." into two sentences: the covered sentence, then the
   outside list in its own sentence, which ends "are not covered by that
   license; their text belongs to its rights holders." Step 9's clause
   pattern then captures only the outside sentence, not the covered
   clause that names Hope & Fear (plan-B1-3-N2). The outside list adds Pistolheart, The
   Last Round Table, Escape the Veiled Halls and "any Core, Hope & Fear
   or campaign frame record that the SRD 2.0 does not hold"; it names
   `docs/rights/records.json`. American spelling.
9. `tests/derived.js`, "source citation": the citation check reads
   `README.md`, `README.ru.md`, `llms.txt`, `LICENSE`,
   `pages/src/terms.html` and `pages/src/en/terms.html` (HTML tags
   removed, whitespace collapsed), each with the citation and without
   "Reference Document 1.0". `OUTSIDE` gains "The Guide to Arazo's
   Artifacts", "Many Worlds Tavern", "Pistolheart", "The Last Round
   Table" and "Escape the Veiled Halls", plus the outside-record phrase of
   step 7 per language; the outside-list check runs on `README.md`,
   `README.ru.md`, `LICENSE` and `llms.txt`, each with its own clause
   pattern (in `LICENSE` and `llms.txt`, the outside sentence, which
   steps 6 and 8 keep apart from the covered sentence). The whole book Hope & Fear stays absent from each clause, and
   the bare string does not count, because the outside-record phrase
   names it (plan-B1-2-1): in `README.md` and `README.ru.md` the clause
   holds no bold entry `**Hope & Fear**`; in the plain-text `LICENSE` and
   `llms.txt`, which carry no bold, the clause with the outside-record
   phrase removed holds no "Hope & Fear". Update the block comment.
10. `.claude/agents/add-source.md`: one line - a new `core`, `hnf` or
    `frame` record needs a `docs/rights/records.json` entry from the SRD
    2.0 (the "rights audit" test fails without it), and that batch's
    review checks the new entries, because `reviewed` is one date for the
    table and is not reset (plan-B1-2-N6); a record of another source
    needs none.
11. Write the owner's review summary into `handoff.md`, "Notes": the
    counts per source and license, every `frame` record marked `dpcgl`
    with its page, every `core` and `hnf` record marked `owner` with
    its reason, and every near match of step 2 with its page and the
    difference (plan-B1-2-R5). The owner reviews `docs/rights/records.json`; on the
    owner's word, a follow-up commit sets `reviewed` (and applies any
    correction) before B1's squash.

Acceptance criteria:

- Every `core`, `hnf` and `frame` record has one entry in
  `docs/rights/records.json`; every `dpcgl` entry names an SRD 2.0 page;
  every other record resolves to `owner` through its source row; the
  "rights audit" test holds each rule (step 4).
- The audit finds each record by text, not by name or source (step 2);
  the handoff carries the owner's review summary (step 11).
- `LICENSE`, `README.md`, `README.ru.md` and `llms.txt` name the same
  covered material ("the Core, Hope & Fear and campaign frame records
  whose text the SRD 2.0 holds"), the same outside sources and outside
  records, and the same code folders; none carries the SRD 1.0 notice or
  lists the whole book Hope & Fear outside (the `tests/derived.js` check
  of step 9: `**Hope & Fear**` in the READMEs, the clause without the
  outside-record phrase in `LICENSE` and `llms.txt`).
- `README.md` and `README.ru.md` credit the Russian text by the sources
  of the "Sources" table, with no license claim; D5 says that `dpcgl`
  covers the English text only.
- The audit follows the match rule of step 2; every `page` is a 1-based
  PDF page index; the owner's review summary lists each near match.
- `LICENSE` and both terms pages carry the verbatim SRD 2.0 citation.
- The outside bullet of `README.md` and `README.ru.md` ends with the
  rights-holders tail of step 7 in both languages; in `LICENSE` and
  `llms.txt` the outside list is its own sentence (plan-B1-3-N2).
- The `llms.txt` "License" list names Pistolheart, The Last Round Table
  and Escape the Veiled Halls (placed from B1 step 11).
- D5 exists and `docs/DECISIONS.md` lists it; it holds Q6 = C and Q7 =
  A.
- `.claude/agents/add-source.md` names the audit entry for a new record.
- The MIT text of `LICENSE` is unchanged above `---`.
- `reviewed` stays `null` in this batch's commit; the owner's review sets
  it in a later commit (B1 squash precondition, not this batch's).

Verification commands:

- `node tests/derived.js`
- `node tools/decisions.js`, then `git diff --stat docs/DECISIONS.md`
- `rtk npm run check:fast` (Bash timeout 600000) before the commit; push;
  CI's green run is the gate.

Review: required (trigger: an agent definition changed; `llms.txt`) -
the handoff line of B0 is `Review: required (trigger: an agent definition
changed; llms.txt), report issues/ai-mcp/reviews/B0.md` (plan-B1-2-R2).
The follow-up commit that sets `reviewed` changes only
`docs/rights/records.json` and fires no review trigger.

Standing checks: no screen, no write path and no stored user data
changes; the new table is a committed source file. Scale: 745 audited
entries today; at 3x (about 2,200) the file stays one JSON file and the
test stays linear. Error scenarios: not applicable - no runtime path; a
missing or wrong entry fails the test before a deploy. Consistency: one
value vocabulary (`dpcgl`, `owner`) in the table, D5 and record v1.
RU/EN parity: `README.md` and `README.ru.md` carry the same facts; the
notice stays the English verbatim text in both (a quotation).

Risks and do-nots:

- Do not commit the SRD PDF or its extracted text.
- Do not mark a record `dpcgl` from its name, its `src` or a changelog
  line; the text must match a page.
- Do not change the verbatim notice; it is the DPCGL's own text.
- Do not touch `dict.ts` or the terms pages' text; a change there reruns
  the app suites for no fact change.
- Do not set `reviewed`; only the owner's word does.

### B1 - API core and REST v1 reads (implement-ready)

Objective: one service layer in the worker, fed by build-time projections
that the app's own modules render, answering the REST v1 read contract of
section 5; the product law and its copies, contracts, `llms.txt`, the
privacy pages and decisions updated in the same commit.

In scope: `/api/v1/openapi.json`, `/api/v1/rolls`, `POST
/api/v1/rolls/{section}`, `/api/v1/tables`, `/api/v1/tables/{table}`
(`part` only), `/api/v1/records/{id}`, `/api/v1/homebrew-items/{uuid}`,
`/api/v1/shared-lists/{token}`.

Out of scope: `/mcp` (B2); `q`, `filter`, `/api/v1/records` search and file
checks (B3); OAuth and `/api/v1/me/` (B5); the license statement copies
(B0); any change of what the app draws. No `format=` parameter exists
(owner Q1).

B5 touchpoints and the second consumer (design pass 2026-11-11): the
account tier (B5a, B5b) and the second worked consumer, bacchus-atlas
(section 8), need no v2 if B1 ships these, all additive and all in the
steps below: (1) the public bulk catalog `/api/v1/catalog/` (section
5.4; steps 4, 7, 9, 11), the one change-detection design of section
3.4; (2) record v1 `key` (section 5.3; step 3); (3) T0 paths ignore
`Authorization` (section 5.1; steps 8, 10); (4) the unknown-`code` rule
(section 5.1; steps 7, 11); (5) the reservation of
`/.well-known/oauth-protected-resource/` (step 11); (6) failing CORS
probes on `/img/*` and the catalog index (step 9). Not in B1, on
purpose: the service's `ctx` argument (B5b adds `op(input, ctx)` with
`ctx.token`; the service is internal, and `CLAUDE.md` adds no variant
before use), `securitySchemes` in `openapi.json` (B5b adds them; a T0
operation never gets `security`), and any 401 or 403 answer.

Depends on: B1's implementation does not wait on B0's audit. B1's
publication and squash do: they need B0 committed and
`docs/rights/records.json` `reviewed` set by the owner. The rights values
are the build-time table `docs/rights/records.json` (B0), so B1 ships
with whatever table the audit produces; if B1 runs first, it commits the
all-`owner` starting file that B0 describes. While the table's `reviewed`
is null, `licenseOf` answers `owner` for every record, so a squash before
the owner's review claims too little, never too much (plan-B1-2-2).

Landing mid-task (plan-B1-2-N4, plan-B1-3-R1): the owner publishes "as
soon as B1 ships" (2026-11-10), so `ai-mcp` lands on `main` in two
squashes: the first after B0, B0's follow-up commit and B1, the second at
closeout after B5. The decision "ai-mcp lands on main in two squashes"
(D6, B1 step 11) records it and amends "A task branch pushes every
batch; a green CI run of the same tree gates main" (2026-10-21), which
squashes a task once at closeout. The precedent is "Task 57 lands on
main in three waves" (2026-10-29). The first squash, in order:

1. B1's batch review (`reviews/B1.md`) approves, and CI runs green on the
   `claude/ai-mcp` tip that holds B0, B0's follow-up commit and B1.
2. The orchestrator confirms that `docs/rights/records.json` `reviewed`
   holds a date; while it is null, the squash waits.
3. The orchestrator squash-merges the branch onto `main` as one commit.
   `issues/ai-mcp/` goes onto `main` with the squash, as in task 57; the
   closeout deletes it there.
4. It merges `origin/main` back into `claude/ai-mcp` with a merge commit
   before B2, runs `check:fast` on it (474-479 s: a merge of `main` puts
   every vitest file in the related run) and pushes it; CI's green run of
   that tree gates B2.

No force-push and no rebase; the closeout squash after B5 carries only
the commits after that merge.

Files expected:

- New: `tools/ts-hooks.mjs` (moved from `tests/e2e/ts-hooks.mjs`),
  `tools/api-data.mjs`, `tools/api-data.test.mjs`,
  `app/src/lib/rollTables.ts`, `app/src/lib/rollTables.test.ts`,
  `app/src/lib/apiRecord.ts`, `app/src/lib/apiRecord.test.ts`,
  `preview/api/openapi.json`, `preview/api/service.mjs`,
  `preview/api/rest.mjs`, `preview/api/api.test.mjs`,
  `docs/fixtures/api/v1/catalog.json` (the pinned catalog),
  `docs/fixtures/api/v1/*.json` (the answers), four files under
  `docs/decisions/` (D1-D3, and D6
  `docs/decisions/<B1 date>-ai-mcp-lands-on-main-in-two-squashes.md`);
  `docs/rights/records.json` only if B0 has not created it (the
  all-`owner` starting file, committed once by hand).
- Edited, code and tests: `App.svelte` (imports and the module comment),
  `app/src/components/RollPanel.svelte` (the comment of line 6),
  `app/src/lib/art.ts` (`artBaseOf`), `app/src/lib/types.ts` (the `th`
  comment), `tools/build.js`, `tests/derived.js`, `.gitignore`,
  `tools/collect-site.sh` (publish `apidata/`; refuse a published `api`
  folder), `tools/check-site.lib.mjs` (probes),
  `tools/check-site.test.mjs` (it enumerates `previewChecks()`),
  `tools/check/lib.mjs` (stage `test:preview`), `tools/check/lib.test.mjs`
  (the stage's files and the preview script), `tests/app/serve.js` (it
  answers every `_routes.json` include with the app document; `/api/*`
  must stay a miss), `.claude/hooks/edit-guard.mjs` and
  `.claude/hooks/selftest.mjs` (block writes to the generated `apidata/`
  as for `names.json`), `preview/worker.mjs` (route `/api/` before the
  language split), `preview/public/_routes.json` (`/api/*`),
  `preview/public/_headers` (`/apidata/*` noindex), `preview/package.json`
  (test script with the hooks), `preview/worker.test.mjs` (control-file
  test), `package.json` (`e2e` hook path), `tests/e2e/contract.mjs` (the
  `ts-hooks.mjs` comment), `tests/contracts.js`,
  `docs/fixtures/urls/preview.json`.
- Edited, documents: `CLAUDE.md`, `PRODUCT.md`, `README.md`,
  `README.ru.md`, `docs/specs/CONTRACTS.md` (sections 5 and 6, the
  "Fixtures:" paragraph), `docs/specs/META.md` (section 3, both
  paragraphs), `docs/specs/COVERAGE.md` (the new files; the `ts-hooks.mjs`
  path), `llms.txt`, `pages/src/privacy.html`,
  `pages/src/en/privacy.html`, `.claude/README.md` ("Preview host", "The
  CI deploy", "Quotas, recovery and failure", "Hooks"),
  `docs/DECISIONS.md` (by `node tools/decisions.js`), the decision "Link
  previews come from a stateless worker" (amended-by pointer), the
  decision `2026-09-25-the-hosted-e2e-runs-cloud-contract-ts-under.md`
  (the `ts-hooks.mjs` path), the decision
  `2026-10-21-a-task-branch-pushes-every-batch-a-green-ci-run-gates-main.md`
  (an amended-by pointer to D6).

Steps:

1. Move `tests/e2e/ts-hooks.mjs` to `tools/ts-hooks.mjs` with `git mv`.
   Update the four references `git grep -n ts-hooks` finds at `342c91c4`:
   the `e2e` script in `package.json`, `docs/specs/COVERAGE.md`, the
   comment in `tests/e2e/contract.mjs`, and the 2026-09-25 decision.
2. Create `app/src/lib/rollTables.ts`: move `ROLL_TABLE`, `PickerRoll` and
   `PICKER_ROLL` and their module comment from `App.svelte`'s module script
   unchanged, and add `ROLL_MODES: Record<RollSection, 'std' | 'alt' |
   'table' | 'part'>` for the 12 `roll/*` sections and `rowsOf(section,
   index, part?): readonly Record_[]` (a `table` section: `index.rows.get`
   of its table; a `part` section: its `PICKER_ROLL` rows function for
   `part`; else `[]`). `App.svelte` imports them and calls `rowsOf` for
   the `rows` prop of `RollPanel` and the `rowsOf` prop of
   `PickerRollPanel`; nothing it draws changes. Change the
   `RollPanel.svelte` comment to name `ROLL_TABLE` in `lib/rollTables.ts`.
   `rollTables.test.ts` holds each `roll/*` section to exactly one mode,
   each `table` and `part` entry to a table of `TABLE_IDS`, and `rowsOf`
   to the rows the panels drew before the move.
3. Create `app/src/lib/apiRecord.ts`: `apiRecord(index: Index, it: Record_,
   site: ApiSite, license: 'dpcgl' | 'owner'): ApiRecord` per section 5.3,
   with `ApiSite = Site & { art: string }`, where `Site` is the `{ base }`
   of `hash.ts` that `recordUrl` and `appUrl` take, so the site base has
   one name and one field (plan-B1-3-N3, plan-B1-3-N4); built only from
   existing functions (`nameOf`, `descOf`,
   `markupText`, `eqLine`, `whereFrom`, `srcName`, `tableOf`, `rarityOf`,
   `craftedFrom`, `setOf`, `setBonusOf`, `refsOf`, `recordUrl`, the
   `art.ts` names). It never reads `ART_BASE`. In `art.ts`, export
   `artBaseOf(project: string): string` (the current formula) and define
   `ART_BASE` as `artBaseOf(PROJECT)`. Add the `RIGHTS` notices of
   section 5.3, one per value (`dpcgl`, catalog `owner`, homebrew
   `owner`), and `licenseOf(audit, it): 'dpcgl' | 'owner'` (the
   resolution rule of B0: `owner` for every record while
   `audit.reviewed` is null; else `records[id]`, else `sources[src]`,
   else `owner`). The caller resolves the value and passes it as
   `license`: the build passes `licenseOf(audit, it)` for a catalog
   record, and the service passes `'owner'` for a homebrew item. The field is `rights.license`. Add a damage parser for `dmg` (`dN` and an optional `+K`, K 1-99)
   with tests on every distinct `dmg` value in `data.js`, and a refusal
   test for a value outside the homebrew pattern. `apiRecord.test.ts`
   covers an item, a consumable, a weapon with `alt`, an armor, a Vault of
   Ages artifact (`tier` `A`), a record with both `tier` and `eq.tier`, a
   set member, a record with refs, a record without a picture, a record
   with an empty Russian name (the English name on both sides), a
   homebrew record with an own picture (`site.art`), a homebrew record
   that names a catalog rule card and a catalog set (the index built as
   section 5.4 builds a homebrew item's: the card resolves, `set.members`
   holds the catalog member ids and `set.bonus` is the catalog card), and
   a shared-list snapshot with its own embedded set card (the one index
   built as section 5.4 builds a shared list's, every snapshot as
   `linked`: `set.bonus` is that embedded card) (plan-B1-3-1); it asserts every text field
   has both keys and `rights` for a `dpcgl` record, an `owner` catalog
   record and homebrew, and `key` (a catalog record's `key` equals its
   `id`; a homebrew record's `key` is its `hb_` key and its `id` the row
   uuid; a homebrew `craft` and `set.members` hold keys). `licenseOf` tests: a `records` entry wins over the
   source row; a record with no entry takes its source row; an unknown
   source is `owner`; an audit with `reviewed: null` resolves a record
   whose entry is `dpcgl` to `owner` (plan-B1-2-2). A test holds the 45 records with both tiers to
   equal values. Fix the `th` comment in
   `types.ts` ("Major and Severe damage thresholds").
4. Create `tools/api-data.mjs` (ESM, run as `node --import
   ./tools/ts-hooks.mjs tools/api-data.mjs [--check]`). Export
   `renderApiData(loot: Loot, audit: RightsAudit): Map<path, text>`; the
   CLI loads `data.js` as `tools/build.js` does, reads
   `docs/rights/records.json` (B0's format), and calls it. The CLI exits
   1 and names the file when `docs/rights/records.json` is missing or not
   valid; it never writes that committed source file. When B1 runs
   before B0, the implementer commits the all-`owner` starting file of B0
   once, by hand (plan-B1-3-N7). Each record is `apiRecord(index, it,
   site, licenseOf(audit, it))`; a change of the table changes
   `data_version` like a data change. It calls `buildIndex` and renders
   the files of section 3.5 under `apidata/`: `rolls.json` (from
   `rollTables.ts`, `sections.ts` parts with both dicts, `SECTION_SLUG`,
   pool lengths from `rollPool(rowsOf(...))`), `tables.json`
   (`TABLE_GROUPS`, `TABLE_SLUG`, `pickerParts`, `tierValues`),
   `cards.json` (`loot.refs`, `loot.sets`, and `members`: for each key of
   `loot.sets`, the records whose `set` is that key, from `index.setMembers`,
   cut to `id`, `src`, `kind`, `set`, `en`, `ru`, `ende` and `rud`; 5
   records today; the budget stays 131072 B, plan-B1-3-1), `roll/<section>.json` (a
   `Loot` with only the tables the section reads, records cut to `id`,
   `src`, `kind`, `roll`, `en`, `ru`, `eq`, `tier`, `community`,
   `community_ru`, `realm`, `vol`, `frame`, `starting`, plus `c`, the
   record file that holds it; `alt` for `alt`), `table/<table>.json` for
   every table but the three `eq_*` ones and `table/<eq table>/<tier>.json`
   for those (rows without `eq`), the record chunks under
   `api/v1/catalog/<n>.json` (not under `apidata/`: they are the public
   chunks; records in
   `[...byId.keys()]` order, the "`data.js` order" of B0 step 3, packed while a file stays at most 65536
   bytes), `apidata/records/index.json` (`chunks`: one id list per record file),
   `api/v1/catalog/index.json` (section 3.5: absolute chunk URLs from
   `site.base`, and per record `id`, `rev` = the first 8 hex of SHA-256
   over `JSON.stringify(record)`, and `chunk`; budget 262144 B)
   and `apidata/version.json` (the first 16 hex of SHA-256 over every other output
   rendered with `data_version` empty, in path order; the value is then
   stamped into each file, the public chunks and index included). Every file is `JSON.stringify(v) + '\n'` with `format`,
   `version` and `data_version`. `renderApiData` returns both trees by
   their published paths; add `/api/` to `.gitignore` beside `/apidata/`. With `--check` it renders to memory and
   exits 1 naming each file that differs from disk or passes its budget,
   and prints the record file count and the size of `records/index.json`.
   `tools/build.js` runs it with `execFileSync(process.execPath,
   ['--import', hooks, script])` after `names.json`. Add `/apidata/` to
   `.gitignore`. Commit `docs/fixtures/api/v1/catalog.json`: a small
   `Loot` slice with one record of each case of step 3, the rule cards and
   sets they name, for each roll section the rows the tests' fixed
   `random` reaches, and a pinned `rights` audit slice (one `dpcgl` and
   one `owner` entry, and a `reviewed` date, so the `dpcgl` fixture
   renders `dpcgl`), so a change of the real audit changes no fixture.
5. `tests/derived.js` runs `tools/api-data.mjs --check` and fails on a
   non-zero exit. `tools/api-data.test.mjs` asserts, on the real
   `data.js`: every roll section's lean loot gives the same pool as the
   full index for every part (`rowsOf`, `rollPool`, `poolFor` for dice
   1-5, `altPicks` for each rarity and face 1-12); every record of `byId`
   is in exactly one record file and its roll rows' `c` names that file;
   `api/v1/catalog/index.json` lists every record once, its `chunk` names
   the file that holds it, and its `rev` is the hash of that copy; an
   edit of one record's text changes its `rev` and the `rev` of each
   record whose JSON holds that record (craft, set, refs), and no other
   (plus `data_version`);
   every file has the schema of its `format` and stays within its budget;
   a synthetic catalog of three times `data.js` (each record, rule card
   and set copied with a suffixed id or key) still fits every per-file
   budget; the audit read, exported as `readAudit(path)` and called by
   the CLI, throws an error that names the file for a missing and for an
   invalid file, and the CLI turns that error into exit 1 (plan-B1-3-N7). In `tools/check/lib.mjs`, stage `test:preview` becomes `node
   --import ./tools/ts-hooks.mjs --test --test-reporter=dot
   preview/worker.test.mjs preview/api/api.test.mjs
   tools/api-data.test.mjs` (the name stays, so the stage-order test
   passes). `preview/package.json`'s `test` becomes `node --import
   ../tools/ts-hooks.mjs --test worker.test.mjs api/api.test.mjs`. In
   `tools/check/lib.test.mjs`, add a test that the `test:preview` command
   imports `./tools/ts-hooks.mjs`, names every `*.test.mjs` under
   `preview/` outside `node_modules/` and `tools/api-data.test.mjs`, and
   that the `preview/package.json` script names the same preview files.
6. Create `preview/api/service.mjs`: `createService({ assets, rpc, random,
   site })` with one async function per operation of section 5. `assets`
   reads one `apidata/` file through `env.ASSETS` with a 2 s timeout and a
   byte cap of 131072 (`readJson` of `worker.mjs`, moved to a shared helper
   only if both use it); `rpc` is `worker.mjs`'s `rpc` with a cap of 65536
   for `get_homebrew_item` and `get_shared_list`; `site` is the `ApiSite`
   `{ base: 'https://daggerheart-loot.pages.dev/', art:
   artBaseOf(env.SUPABASE_URL) }`. The read path of each operation is the table "Reads per operation"
   of section 3.5. A roll reads `roll/<section>.json`, calls `buildIndex` on
   it, then `rowsOf` and the same functions the panels call (`coreRoll`,
   `poolFor`, `rollDuality`, `altPicks`, `bumpUp`, `rollPool`, `pick`); a
   typed `total`, `value`, `hope` and `fear` skip the dice; then it reads
   each distinct record file its results' `c` name and takes the records
   from them. The cached files follow the `data_version` rule of section
   3.5. Both homebrew reads share one base index, `buildIndex({ items: {
   set_members: <the records of cards.json members, flattened> }, refs,
   sets })` from `cards.json` (plan-B1-3-1). A homebrew item uses
   `withRecords(base, [record, ...related], [])` after `itemOf`, as
   `state/itemView.svelte.ts` does. A shared list builds one index,
   `withRecords(base, [], snapshotRecords(row))`, every snapshot as
   `linked`, as `SharedListPage.svelte` does, and takes each homebrew
   entry's record from that one index; it uses `sharedListOf` of
   `lib/cloudLists.ts`, with `knows` from `names.json`. Each homebrew
   record is `apiRecord(index, record, site, 'owner')`. Before writing the shared-list shape, read the newest
   `get_shared_list(text)` definition named in section 5.4 and fix the
   entry fields in the fixture.
7. Create `preview/api/openapi.json` (OpenAPI 3.1): every B1 operation with
   `operationId`, `summary` (10 words or less), `description`, parameters,
   request and answer schemas (record v1 with `rights`; the `rights`
   schema description says that `dpcgl` means "the English text is SRD
   2.0 Public Game Content" and that the Russian text is a third-party
   translation the value does not cover, plan-B1-2-R1), examples, the
   error schema with 415, the fair-use text, the "ignore unknown fields"
   rule, the note that homebrew text and list notes are user content in
   the Markdown subset that a client escapes before display, the entry
   counts that fit under the 65536 B cap, the DPCGL notice of
   `README.md`, "Rights", and the CORS rule of section 3.4 (`*` on the
   public operations without credentials, the preflight answer, that each
   preflight counts against the shared quota and `Max-Age` 86400 reduces
   them, and that `/api/v1/me/` is reserved, holds no data in v1, carries
   `*` only for that reason, and will take an `Origin` allowlist in B5b),
   the rule "a client that meets an unknown error `code` acts on the HTTP
   status", that T0 operations ignore `Authorization`, and the bulk
   catalog (the index URL, both schemas, the sync rule of section 3.4,
   and that its files are static and cost no quota) in
   `info.description`; the two catalog schemas go in `components` (a
   static file is not an operation, so it has no `x-mcp-tool`). No
   `securitySchemes` in B1. `OPTIONS` is not listed as an operation. There is
   no `format` parameter and no mapping to a consumer's schema. Give each
   operation an
   `x-mcp-tool` name for B2 (`list_rolls`, `roll`, `list_tables`,
   `get_table`, `get_record`, `get_homebrew_item`, `get_shared_list`).
8. Create `preview/api/rest.mjs`: `handleApi(request, env, url)` routes by
   the paths of `openapi.json`, parses and checks parameters and bodies
   (hand-written per operation; 415 before the body is read when the
   `Content-Type` is not `application/json`), calls the service, and
   answers through its own JSON responder by section 5.1 with `ETag` and
   304. Its first branch answers `OPTIONS` on any path under `/api/` with
   the 204 preflight of section 5.1, before the path lookup. The responder
   adds `Access-Control-Allow-Origin: *` to every answer, sends no
   `Access-Control-Allow-Credentials`, and keeps `nosniff` and the CSP
   `sandbox`; `Allow` names `OPTIONS`. It catches every thrown error and
   answers the JSON 503, never the HTML card. `worker.mjs`'s `handle` calls it for `/api` and every path
   under `/api/` before the language split and before its own `GET`/`HEAD`
   check; the host guard stays first.
9. Routing and publishing: `_routes.json` includes `/api/*` and
   excludes `/api/v1/catalog/*` (Pages serves the static catalog);
   `_headers` sends `X-Robots-Tag: noindex` on `/apidata/*`, and
   `X-Robots-Tag: noindex` with `X-Content-Type-Options: nosniff` on
   `/api/v1/catalog/*` (no `Access-Control-Allow-Origin` line: Pages sends
   `*` on static files, and a second value would break CORS);
   `tools/collect-site.sh` copies `apidata/` and `api/v1/catalog/` beside
   `names.json` (Vite copies neither); the guard refuses any other
   published file under `api/` and a published
   `.well-known/oauth-protected-resource`;
   `tests/app/serve.js` skips the `/api/*` include, so it stays a miss;
   `.claude/hooks/edit-guard.mjs` blocks a write under `apidata/` and the
   root `api/` (generated; `preview/api/` stays writable) with the
   `names.json` message pattern, and `selftest.mjs` gets the matching
   case; `tools/check-site.lib.mjs` probes `apidata/version.json` (static,
   and it records the `Access-Control-Allow-Origin` header it sees, a
   report line, not a failure: `apidata/` is internal whatever the host
   sends), and two failing static checks with an `Origin:
   https://example.org` header: `api/v1/catalog/index.json` (200, its
   `format`, `Access-Control-Allow-Origin: *`) and one record's
   `image.full` under `/img/` (the index holds no image URLs: the probe
   reads the first chunk the index names and takes its first record with
   a non-null `image.full`; 200, `Access-Control-Allow-Origin:
   *`; a canvas client needs it, section 8), and, with `--preview`, `/api/v1/rolls` (200, `format`, and with
   an `Origin: https://example.org` header, `Access-Control-Allow-Origin:
   *` and no `Access-Control-Allow-Credentials`), `OPTIONS
   /api/v1/rolls/std` with that `Origin` and `Access-Control-Request-Method:
   POST` (204, the three `Access-Control-Allow-*` headers and `Max-Age`
   86400), `/api/v1/records/ci1` (200), `/api/v1/records/zzzz` (404
   `not_found`, with `Access-Control-Allow-Origin: *`), `/api` (404 JSON)
   and a `POST` roll of `std` with `total` 1 (200, four results at most);
   `tools/check-site.test.mjs` lists the new checks.
10. Tests: `preview/api/api.test.mjs` drives `worker.mjs`'s default export
    with a stub `ASSETS` over `renderApiData(<the pinned catalog>)` (in
    memory, no disk) and a stub RPC server, and compares every answer with
    `docs/fixtures/api/v1/<case>.json` byte for byte: each operation's
    success, each error row of section 5.1 (415 and a missing `eq_*`
    `part` included), a 304, a HEAD, the host guard (the worker's 301,
    with no CORS header, section 5.1), the check order of section 5.1
    (a `PUT` with a text body to `/api/v1/rolls/zzzz` answers 405), an
    empty `application/json` body on a `table` roll (200), an
    `Application/JSON` media type (accepted), bare `/api`, a
    thrown service error (JSON, `nosniff`, the CSP), a 2049-character run,
    a 4097-byte body, an RPC 500, an RPC answer past 65536 bytes, an
    `ASSETS` failure, two `ASSETS` versions (a cached index with a fresh
    record file: one re-read, then the right record; a second mismatch:
    503), a fixed `random` for each roll mode (crit and no crit, the top
    rarity with no bump). CORS cases: an `OPTIONS` preflight on a read
    path, on a roll path and on an unknown path under `/api/` (204, the
    four `Access-Control-*` headers, no body, no file read); a 200, a 304,
    a 404, a 405 and a thrown-error 503 each carry
    `Access-Control-Allow-Origin: *`, no
    `Access-Control-Allow-Credentials`, `nosniff` and the CSP; a 405's
    `Allow` names `OPTIONS`; `/api/v1/me/x` is the JSON 404. A shared
    list and a homebrew item read with an `Authorization: Bearer x`
    header give the same bytes as without it, and the stub RPC server
    sees the anon bearer only. A test holds every parameter name and enum of
    `openapi.json` to the parsers' accept and refuse cases. The answer
    builder of the shared-list cases measures how many catalog and
    homebrew entries fit under 65536 B. `tests/contracts.js` checks the
    fixtures parse, `preview.json`'s `routes` equals `_routes.json` with
    `/api/*`, and `openapi.json`'s operations equal `CONTRACTS.md` section
    6's operation list; that section lists the static catalog apart,
    because it is not an operation.
11. Documents: the law text of section 3.6 into `CLAUDE.md` and every copy
    section 3.6 lists (`PRODUCT.md`, `META.md` section 3 both paragraphs,
    `.claude/README.md` "Preview host", `README.md` and `README.ru.md`
    (the `preview/` line of the file tree), `llms.txt` by phrase, since
    B0 edits these files first and moves their lines: "no public API" in
    the summary under the title and in "What this site cannot do", and
    "there is no API" in "Lists as a file (import-v1)" and "Homebrew items
    as a file (homebrew-v2)", which becomes "there is no write API");
    `CONTRACTS.md` section 6 (paths, freeze policy, the CORS rule, the
    `/api/v1/me/` prefix as reserved with no data in v1, its 404 and
    preflight carrying `*` only for that reason, and B5b replacing both
    answers with an allowlist, the bulk catalog and what of it is frozen
    (section 5.4), the unknown-`code` rule, T0 ignoring `Authorization`,
    fixtures),
    section 5 (`/api/` reserved, `/api/v1/catalog/` its static part,
    `/.well-known/oauth-protected-resource/` reserved for B5b, `apidata/`
    internal and changed without notice, like `img/thumb/`) and the
    "Fixtures:" paragraph; `llms.txt`:
    a new section "The read API (v1)" (each operation with one `curl`
    example, the bulk catalog and its sync rule, that a browser may call
    it directly, the fair-use text, the neutral record fields, `rights`;
    no mapping to any consumer's schema), the counting route stays as it is; the "License" list moved
    to B0; the privacy sentence of
    section 3.6 in both pages, same facts, the "Last changed" date in both;
    `.claude/README.md`: routes, the shared quota, the file-count margin
    and the real chunk count, the entry counts at the cap, the CPU
    readings to take, the preflight cost on the quota, the `apidata/` row
    of "Hooks"; `COVERAGE.md` rows for the new files; D1-D3 under
    `docs/decisions/` with the texts of section 4 (D2 with section 3.8, D3
    with Q1 and CORS) and the amended-by pointer in the 2026-10-14 file;
    D6 "ai-mcp lands on main in two squashes" from
    `.claude/templates/decision.template.md` with the text of section 4
    and the four steps of "Landing mid-task" (plan-B1-3-R1; a squash
    merge carries the whole branch tree, so the task directory goes with
    it);
    `- Amends "A task branch pushes every batch; a green CI run of the
    same tree gates main" (2026-10-21): for ai-mcp, two squashes.`, and
    the mirror `- Amended by "ai-mcp lands on main in two squashes"
    (<B1 date>): for ai-mcp, two squashes.` in the 2026-10-21 file, after
    its task-57 line; `node tools/decisions.js`.

Acceptance criteria:

- Every operation of section 5 answers its fixture byte for byte, rendered
  from the pinned catalog `docs/fixtures/api/v1/catalog.json`; a
  `data.js` edit changes no fixture.
- On the real build, every `apidata/` file has its schema and stays within
  its budget at today's size and at the synthetic 3x size, and
  `tools/api-data.mjs --check` passes inside `tests/derived.js`.
- `App.svelte` draws as before: the browser suites and goldens pass with no
  re-seed. `App.svelte` and the service take a roll's rows from `rowsOf`.
- For each roll section and each part, the worker's pool equals the app's
  pool (test of step 5) and a fixed `random` gives the same record the
  app's panel gives (test of step 10).
- Every text field of every answer is a `ru`/`en` pair, and an empty
  Russian name takes the English one (tests).
- Every record carries `rights.license` from `docs/rights/records.json`
  through `licenseOf` and `rights.notice` by the `RIGHTS` notices, and
  `openapi.json` carries the DPCGL notice (tests). No rights value is in
  code: a table change re-renders `apidata/` with no code change.
- An unreviewed audit renders no `dpcgl`: with `reviewed: null`,
  `licenseOf` resolves every record to `owner` (`apiRecord.test.ts`
  case); the pinned audit slice in `catalog.json` carries a `reviewed`
  date (plan-B1-2-2).
- `openapi.json`'s `rights` schema description says that `dpcgl` covers
  the English text as SRD 2.0 Public Game Content and not the Russian
  translation (plan-B1-2-R1).
- Squash precondition (not a commit condition): B0 is committed and
  `docs/rights/records.json` `reviewed` holds the owner's review date.
- The mid-task landing follows "Landing mid-task": one squash commit on
  `main` after B1's approving batch review and a green CI run of the tip,
  with `reviewed` confirmed to hold a date first and `issues/ai-mcp/` in
  the squash; then a merge of `origin/main` back into `claude/ai-mcp`
  before B2, gated by `check:fast` and CI, with no force-push
  (plan-B1-2-N4, plan-B1-3-R1).
- D6 "ai-mcp lands on main in two squashes" exists, cites the task 57
  decision as its precedent, amends the 2026-10-21 decision, and the
  2026-10-21 file carries the mirror "Amended by" line; `docs/DECISIONS.md`
  lists D6 (plan-B1-3-R1).
- `OPTIONS` on any path under `/api/` answers 204 with
  `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET,
  POST, OPTIONS`, `Access-Control-Allow-Headers: Content-Type` and
  `Access-Control-Max-Age: 86400`, and reads no file (tests).
- Every other answer under `/api/` (200, 304, each error row of section
  5.1, the thrown-error 503) carries `Access-Control-Allow-Origin: *`, no
  `Access-Control-Allow-Credentials`, `nosniff` and the CSP `sandbox`
  (tests); `/api/v1/me/` answers the JSON 404 (test).
- `openapi.json` and `CONTRACTS.md` section 6 state the CORS rule, the
  preflight's quota cost, and that `/api/v1/me/` is reserved with no data
  in v1, carries `*` only for that reason, and gets an allowlist in B5,
  which replaces its 404 and preflight answers (plan-B1-2-R3);
  neither names a `format` parameter or a mapping (`tests/contracts.js`
  checks that `openapi.json` has no `format` query parameter).
- `tests/contracts.js` holds the fixtures (each parses and names its
  `format` and `version`), `preview.json`'s `routes` to `_routes.json`
  with `/api/*`, and `openapi.json`'s operations to `CONTRACTS.md`
  section 6, which lists the static catalog apart (section 3.8, point 3).
- A homebrew record that names a catalog rule card and a catalog set
  resolves both: `set.members` holds the catalog member ids and
  `set.bonus` is the catalog card; an own picture URL starts with
  `site.art` (test).
- A shared-list snapshot with its own embedded set card gets that bonus,
  from the one index with every snapshot as `linked` (test,
  plan-B1-3-1).
- `apidata/cards.json` holds `members` for each catalog set key, within
  131072 B today and at the synthetic 3x size (plan-B1-3-1).
- A request that fails two checks answers by the check order of section
  5.1; the host guard's 301 is the one answer under `/api/` without the
  JSON headers (tests, plan-B1-3-N5, plan-B1-3-N6).
- `tools/api-data.mjs` exits 1 when `docs/rights/records.json` is missing
  or not valid (test, plan-B1-3-N7).
- The bulk catalog: `api/v1/catalog/index.json` and its chunks render
  from the pinned catalog to fixtures byte for byte; on the real build
  the index lists every record once with a `rev` that moves with that
  record's JSON (an edit of one record's text moves its `rev` and those
  of the records whose JSON holds it, and no other), and stays within
  262144 B today and at 3x;
  `_routes.json` excludes `/api/v1/catalog/*`; the `check-site` static
  checks of the index and of one `/img/` URL fail without
  `Access-Control-Allow-Origin: *` (tests).
- Every record carries `key` (catalog: equal to `id`; homebrew: the `hb_`
  key, `id` the row uuid) (test).
- A T0 answer is the same with and without an `Authorization` header,
  which is never forwarded (test); `openapi.json` and `CONTRACTS.md`
  section 6 state the unknown-`code` rule; `CONTRACTS.md` section 5
  reserves `/.well-known/oauth-protected-resource/`, and the deploy guard
  refuses a published file there.
- `GET /api/v1/tables/eq_weapon` without `part` answers 400 with the part
  list; with `part=3` it answers the tier 3 rows (tests).
- A request with a run past 2048 characters, a body past 4096 bytes, a
  `POST` that is not `application/json`, an RPC answer past 65536 bytes,
  an RPC failure, an `ASSETS` failure and a thrown error each answers its
  row of section 5.1 as JSON with `nosniff` and the CSP (each its own
  test).
- A cached file and a fresh file of two data versions give one re-read
  and the right answer; a second mismatch answers 503 (test).
- Stage `test:preview` of `npm run check` runs `preview/worker.test.mjs`,
  `preview/api/api.test.mjs` and `tools/api-data.test.mjs` with the ts
  hooks, and `tools/check/lib.test.mjs` holds it to that.
- `/mcp` still answers 404 (B2 changes it); bare `/api` answers the JSON
  404.
- `CLAUDE.md`, `PRODUCT.md`, `META.md` section 3 (both paragraphs),
  `CONTRACTS.md` sections 5 and 6, `llms.txt` (the four phrases of step
  11, found by phrase, not by line number),
  `.claude/README.md`, `README.md`, `README.ru.md` and D1-D3 say the same
  law and paths.
- Both privacy pages carry the sentence on programs reading shared lists
  and homebrew items through the public API, with the same facts and the
  same new "Last changed" date.
- The `check-site` static probe records the `Access-Control-Allow-Origin`
  header of `apidata/version.json`, and the handoff records the value the
  first deploy shows; the `--preview` probes check the CORS headers of a
  `GET` and of an `OPTIONS` preflight.
- A write under `apidata/` is blocked by the edit guard (selftest case).
- The `th` comment in `types.ts` names Major and Severe; the
  `RollPanel.svelte` comment names `lib/rollTables.ts`.

Verification commands:

- `node tools/build.js`, then `node --import ./tools/ts-hooks.mjs tools/api-data.mjs --check`
- `node --import ./tools/ts-hooks.mjs --test --test-reporter=dot preview/worker.test.mjs preview/api/api.test.mjs tools/api-data.test.mjs`
- `node --test --test-reporter=dot tools/check/lib.test.mjs tools/check-site.test.mjs`
- `node .claude/hooks/selftest.mjs`
- `node tests/run-all.js contracts,dataint` and `npm run test`
- `npm --prefix preview test`
- `rtk npm run check:fast` (Bash timeout 600000) before the commit
- `npm run check:built`; push; CI's green run is the full gate
- One local `npx wrangler pages dev` probe of the bundled worker with the
  `lib/` imports before the push: the `.js` to `.ts` mapping works and the
  bundle size; record both in the handoff.
- Owner step after the landing, or on a hand deploy that holds the test
  project's secrets (as the 2026-10-14 reading, `.claude/README.md`,
  "Quotas, recovery and failure"): `npx wrangler pages deployment tail
  <full deployment id> --format json` while fetching each case three
  times: a cold `std` roll with four results (the heaviest), a record, an
  `eq_weapon` tier part, and a homebrew item and a shared list sized just
  under 65536 B, seeded on the test project. Record the CPU in
  `.claude/README.md`, "Quotas, recovery and failure". A reading above
  5 ms reopens section 3.5 (its fallback first).

Review: required (trigger: a public contract; a hook; tools/check/; a
package.json check script) - the handoff line of B1 is `Review: required
(trigger: a public contract; a hook; tools/check/; a package.json check
script), report issues/ai-mcp/reviews/B1.md` (plan-B1-3-R2). The public
contract is `/api/v1/` with its fixtures and `tests/contracts.js`; the
hook is `edit-guard.mjs` and `selftest.mjs`; `tools/check/` is
`lib.mjs` and `lib.test.mjs`; the check script is `e2e` in `package.json`.
The first squash follows this review's approve ("Landing mid-task").
Gate cost about 47 min, and the merge-back commit of the landing about
23 min (Status).

Standing checks:

1. Scale: no screen changes, so no States table. Collections the API
   answers: roll sections 12 (3x 36, one file); the bulk catalog index,
   1593 records today and 4779 at 3x, within 262144 B (about 69 KB today
   and 210 KB at 3x), with 36-46 chunks
   (110-140 at 3x); a table's rows whole, at
   most 145 today (`dv`) and 435 at 3x; an `eq_*` table by tier part only:
   `eq_weapon` 512 rows today and 1536 at 3x in all, its largest part 145
   (tier 3) and 435 at 3x, each part within 131072 bytes; a roll at most 4
   results; a shared list past 65536 answer bytes answers 422 with the app
   link: about 400 catalog entries with empty notes (350 on a GM link) or
   about 10 homebrew entries at the longest text fit, measured in B1 (the
   limits of `FEATURES.md`, "Limits", allow far larger lists: accepted,
   the app opens them); a homebrew item with very many related rows the
   same. The longest text: a homebrew card text of 1500 code points per
   language, inside every cap.
2. Error scenarios: no write path and no stored shape. Loading: n/a
   (server). A failed read: 503 `unavailable`, nothing stored. A deleted
   homebrew item or a stopped share: 404. A data deploy between two calls:
   the `ETag` changes, record ids stay. A bulk pull across a deploy: a
   chunk's `data_version` differs from the index's, or a chunk URL
   answers 404; the client reads the index again and starts over
   (`openapi.json` says so); nothing is stored on our side. Two data versions inside one
   isolate: one re-read, then 503 (section 3.5). A thrown error: the JSON
   503, never the HTML card. A stale client: v1 answers stay; new fields
   are additive. A revert of B1: `/api/*` answers the 404 page and no data
   is lost; `apidata/` disappears with the deploy. A quota burn:
   Cloudflare 1027 on cards and API; the app works. A browser client: a
   failed preflight (a quota burn, a Cloudflare error page without CORS
   headers) shows as a network error in the client, not as JSON; the
   client retries later; nothing is stored. A cached preflight stays
   valid up to `Max-Age`, because v1 never narrows the allowed methods or
   headers. Privacy: CORS lets any web page read a shared list or a
   homebrew item whose link its visitor holds; the B1 privacy sentence
   ("readable by programs through the public API, to anyone who holds the
   link") already covers it, and no cookie or credential is sent.
3. Consistency: the API uses the app's own names for one thing (URL ids of
   `ROUTES.md`, section and part names from `dict.ts`, path lines from
   `whereFrom`), the app's row order, roll semantics (`rowsOf`), Russian
   fallback, and the app's two homebrew index compositions:
   `withRecords(base, [record, ...related], [])` of
   `state/itemView.svelte.ts` for a homebrew item, and one index with
   every snapshot as `linked` of `SharedListPage.svelte` for a shared list
   (plan-B1-3-1). `FEATURES.md`, "Consistency rules", governs screens;
   B1 has none. Departures: error messages and `rights.notice` are English
   only (developer and legal text, `META.md` section 6).
4. RU/EN parity: every person-readable field is a `ru`/`en` pair from the
   same data and functions; no field is translated by the API;
   `openapi.json` and `llms.txt` text is English, as developer documents
   are. The privacy sentence has a Russian and an English form with the
   same facts and the same date.

Risks and do-nots:

- Do not import `data.js` or `data.json` in the worker. Do not add a
  dependency to `preview/package.json`.
- Do not change `poolFor`'s behavior or signature (`buildIndex` on the lean
  loot gives a full `Index`).
- Do not let `apiRecord.ts` import a component or a port; it is `lib/`.
- Do not reuse `answer()` or `failed()` of `worker.mjs` under `/api/`.
- `tests/derived.js` is CommonJS; call the ESM script as a child process.
- The Pages deploy bundles `_worker.js` with esbuild, which maps a `.js`
  specifier to its `.ts` file; confirm with one local `npx wrangler pages
  dev` probe before the push and record the result in the handoff.
- Settled, not to reopen: option (c); no catalog in the database; no app
  call to the API; v1 public read with no key; Q2 = A (every source, with
  `rights`); Q1 (no `format=`, no published mapping); CORS `*` without
  credentials on the public paths (owner, 2026-11-10).
- Do not add `Access-Control-Allow-Credentials`, `Vary: Origin` or an
  `Origin` check under `/api/`; the `Origin` check belongs to `/mcp` (B2),
  and B5b alone adds the `/api/v1/me/` allowlist with `Vary: Origin`.
- Do not add an `Access-Control-Allow-Origin` line to `_headers`; do not
  read or forward `Authorization` on a T0 path.

Fallback: if the bundled lib modules break the worker bundle or pass the
size limit, the build renders every roll pool into `apidata/roll/` as id
lists and the worker calls only `roll.ts` (`coreRoll`, `rollDuality`,
`pick`); `std.ts` and `alt.ts` then run at build time only. Same contract.
For the CPU of a `std` roll, the line-sliced record files of section 3.5.

### B2 - MCP adapter over the service (outline)

- `preview/api/mcp.mjs`: Streamable HTTP, `POST /mcp` only, one JSON answer
  per request, no session id, no SSE, every other method 405; the
  `2025-06-18`/`2025-11-25` shape (`initialize`, `tools/list`,
  `tools/call`, 202 for a notification) and the `2026-07-28` shape
  (`server/discover`, `_meta` versions, `resultType`, `ttlMs`/`cacheScope`).
  `tools/list` is built from `openapi.json`'s `x-mcp-tool` operations
  that carry no `security` (B5b's account operations carry it and are
  listed on `/mcp/me` only); a call runs the same service function as
  REST. `/mcp` never reads `Authorization` and never answers 401, so a
  connector added with "No sign in" keeps working when B5b ships;
  `/mcp/me` stays the reserved 404 (`CONTRACTS.md` section 5 reserves
  every path under `/mcp`). Input past 256 KB refused
  before parsing; a request with a browser `Origin` answers 403 (MCP spec,
  DNS rebinding); `/mcp` sends no CORS headers and answers no `OPTIONS`
  preflight (405), unlike `/api/v1/`. Tool annotations `readOnlyHint`; descriptions mark homebrew
  text and list notes as data written by other people.
- Contract: `docs/fixtures/mcp/*.json`, `tests/contracts.js`, `CONTRACTS.md`
  section 6, `llms.txt` (how to add the connector in Claude and ChatGPT),
  `META.md` section 7 (`/mcp` leaves the 404 list), `check-site` (`/mcp`
  GET 405, a `tools/list` POST 200). D4 to `docs/decisions/`.
- Split criterion: a public-contract change of its own (the MCP endpoint and
  tool shapes), separate from REST v1. Plan review: the new contract
  (a `required` line is written when B2 is expanded).
- Owner steps: add the connector in Claude ("No sign in"); a measurement
  deploy with `deployment tail`.

### B3 - Query and file checks (outline; Open design question)

- Open design question: how search meets 10 ms - `search.ts` over a lean
  projection of names and stat lines (no descriptions), a build-time `Hay`
  projection, or a name-only match. Decide from the B1/B2 CPU readings.
- `GET /api/v1/records?q=&kind=&source=&table=&tier=&rarity=&limit=`
  (limit at most 50); `filter=f_...` on `GET /api/v1/tables/{table}` with
  `filters.ts` `decodeFilter`, `groupsFor` and the predicate the tables page
  uses (extract it to `lib/` if it lives in a component).
- `POST /api/v1/file-checks`: a JSON body of at most 262144 bytes, `kind`
  read from the file's `format`; `parseBundle` and `parseHomebrew` with no
  account context; the answer is the import's own errors and skips in both
  languages. MCP tools `search_catalog` and `check_file`.
- Split criterion: a commit the harness cannot reach - the caps and the
  search strategy come from CPU readings on the deployed worker. If the file
  check passes 10 ms at a 64 KB cap, the fallback is a Supabase Edge
  Function for that one operation (option (b)), behind the same REST path.

### B4 - dropped (2026-11-10)

- Was the Charkeeper mapping or `format=charkeeper-v1`; owner Q1 removes
  both, and no gate waits on the author. What remains: the field checks
  of sections 5.3 and 8, the announcement (an owner step), additive
  fields later (section 11). The id B4 is not reused.

### B5 - The account tier (design settled 2026-11-11; two batches)

Facts: `context.md`, "B5 design facts (2026-11-11)" (the token, the
account writes that exist, what a client token reaches). A client token
works at PostgREST directly, so the database, not the worker, bounds it
(D7). B5 needs one migration (B5a) and no new table: the head pattern
needs no tombstones, and one grant level needs no client table.

Split criterion: B5a is a different route and filter set (an app route
and screen, browser suites, goldens, `check:db`); B5b is a public-contract
change of its own (the account API and `/mcp/me`, stub tests only). B5a
goes first: the guard must hold before a client token can exist. Both
land with the closeout squash (D6); the owner switches the production
OAuth server on after it (B5a step 8). The plan review before B5a covers
both (Status).

#### B5a - The account connection (implement-ready outline; Open design question: the screen layout)

Open design question: the layout of the consent page and of the
"Connected apps" section, a mock grounded in `#/account` (its connected
providers section is the sibling) under `issues/ai-mcp/mocks/`; a planner
refresh draws it when B5a is next. Behavior, states and string facts
below are settled.

Objective: a reader connects an app or AI assistant through the Supabase
OAuth 2.1 server, sees and disconnects it on `#/account`, and the
database bounds every client token to the API's account scope; D7.

Steps:

1. Measure on the test project (the owner switches "OAuth Server" on,
   authorization path `/connect`, dynamic registration on), with the auth
   settings of `supabase/config.toml` pushed to it: a token from the flow
   with a seeded account. Record its claims (`email`, `phone`,
   `app_metadata`, `user_metadata` with the provider name and picture;
   plan-B5a-R5); whether a `resource` parameter is accepted and changes
   `aud`; whether PostgREST still accepts the access token after
   `revokeGrant` until `exp` (step 2 refuses it either way); and what the
   client token can do on Auth: `PUT /auth/v1/user` (email; password;
   `data`), `GET /auth/v1/user/identities/authorize` (link an identity),
   `DELETE /auth/v1/user/identities/{id}` (unlink), `POST
   /auth/v1/factors` (enroll), `POST /auth/v1/logout?scope=global`, and
   `GET /auth/v1/user` (which personal fields it answers). Also record
   which of `<SUPABASE_URL>/.well-known/oauth-authorization-server/auth/v1`
   (RFC 8414 path insertion, which MCP clients try) and
   `<SUPABASE_URL>/auth/v1/.well-known/oauth-authorization-server`
   answer, and whether the pinned CLI's `config.toml` has an OAuth server
   section: if it does, the settings (enabled, authorization path
   `/connect`, dynamic registration) go into `supabase/config.toml`, and
   the local stack serves them; if not, step 8 records that `config:push`
   leaves them (plan-B5a-R6). Stop rule: if a client token changes the
   email or the password, links or unlinks an identity, or enrolls a
   factor, stop and return to the owner (a connected app could take or
   lock the account); a global logout and a `data` change are recorded,
   not a stop. This is B5's one owner stop. Also check whether the local
   CLI stack serves the OAuth server; if not, `tests/db` mints client
   tokens (a JWT with `client_id` and a `session_id` whose
   `auth.sessions` row the test inserts, signed with the local JWT
   secret). Results go to `.claude/README.md`, "Supabase configuration".
2. Migration `supabase/migrations/<date>_api_client_guard.sql`:
   `public.api_client_guard()` (invoker), set by `alter role authenticator
   set pgrst.db_pre_request` and `notify pgrst, 'reload config'`, with
   `grant execute on function public.api_client_guard() to anon,
   authenticated, service_role` (the repository's `revoke ... from
   public` pattern would fail every request). With `auth.jwt() ->>
   'client_id'` not null it first refuses a token whose session ended:
   `public.api_client_session_live()`, SECURITY DEFINER, `set
   search_path = public, pg_temp`, `revoke execute ... from public,
   anon`, `grant execute ... to authenticated`, answers whether the
   token's `session_id` has a row in `auth.sessions` (one indexed read per
   client-token request; an app token skips it; plan-B5a-R1). Then it
   allows only (by `request.method`, `HEAD` judged as `GET`, and
   `request.path` by exact equality, `/lists` and not a prefix): `GET` on
   `lists`, `list_entries`, `homebrew_items`, `homebrew_books`,
   `homebrew_cards`; `POST`, `PATCH`, `DELETE` on `homebrew_items`;
   `PATCH` and `DELETE` on `lists`; `POST` on `rpc/apply_list_writes`,
   `rpc/get_homebrew_items`, `rpc/my_limit` (the B5b reads and writes; T0
   reads run as `anon` and pass); else it raises 42501 `api_client_guard:
   not allowed for a connected app`. Restrictive policies on every
   `public` table outside the scope list (`list_shares`,
   `purchase_requests`, `purchase_request_lines`, `list_notices`,
   `print_sets`, `user_prefs` and every other table that `authenticated`
   can select; the step 3 query enumerates them): `create policy
   <table>_no_client as restrictive for all to authenticated using
   ((select auth.jwt() ->> 'client_id') is null) with check ((select
   auth.jwt() ->> 'client_id') is null)`. The pre-request function bounds
   RPCs and the write methods; the restrictive policies bound embedding
   and live in the schema dump. Restrictive policies on `storage.objects`
   refuse a client token's insert, update and delete. The reversal
   `supabase/reversals/<same name>.sql` (`alter role authenticator reset
   pgrst.db_pre_request; notify pgrst, 'reload config';`, drop the
   policies, drop both functions) runs under the up-down-up gate of
   `check:db`. Named fallback, if the probe of the acceptance shows that
   the hosted project refuses or ignores the role setting: a guard call
   at the top of each other RPC `authenticated` may execute, held by the
   same test (the restrictive table policies already bound the tables).
3. `tests/db/api-client-guard.test.mjs`: it enumerates every table and
   function `authenticated` can reach (`pg_class`, `pg_proc` grants) and
   asserts that a client token is refused on each one outside step 2's
   list, and on storage writes; an embedding case from each allowed
   table to each out-of-scope table it has a foreign-key path to (for
   example `lists?select=*,list_shares(*)`) answers empty embedded
   arrays or 403 for a client token, and the full rows for an app token;
   a revoked grant's unexpired token is refused; a client token reads
   and writes its own lists and items and never another account's; an
   app token and `anon` behave as before (the existing suites pass
   unchanged); a deleted account leaves no grant.
4. Ports: an `AppRepository` in `ports/types.ts` (`details(id)`,
   `approve(id)`, `deny(id)`, `list()`, `revoke(clientId)`), in
   `ports/supabase.ts` over `auth.oauth` of auth-js 2.117.1
   (`getAuthorizationDetails`, `approveAuthorization` and
   `denyAuthorization` with `skipBrowserRedirect`, `listGrants`,
   `revokeGrant`), the fake in `fake-cloud.ts` with seeded grants and one
   pending authorization, `cloud.contract.ts` cases.
5. Route `#/connect` (`/connect`, `/en/connect`; `ROUTES.md`, fixtures
   `docs/fixtures/urls/routes.json` and `docs/fixtures/urls/paths.json`):
   its `authorization_id` query stays in
   the address while on the route, so a reload reads it again; signed
   out, the sign-in prompt returns to the same address
   (`dhloot.auth.return`); a build with no sign-in draws the not-found
   page. The page: the client's name and redirect host, the signed-in
   account, the scope sentence ("read, change and delete your lists and
   homebrew items; deleting a list also ends its share links and the
   players' requests on it; deleting an item removes it from every list
   that holds it and deletes its picture. It never changes your sign-in,
   deletes your account, uploads pictures or makes share links."; Russian
   with the same facts: «Читать, менять и удалять ваши списки и предметы
   из «Мои предметы»; удаление списка закрывает и его ссылки, и запросы
   игроков по нему; удаление предмета убирает его из всех списков, где он
   есть, и удаляет его картинку. Приложение не меняет ваш вход, не
   удаляет аккаунт, не загружает картинки и не создаёт ссылки.»; if step
   1 finds `email` or a name in the client token, both add "and your
   account's email and name" / «а также почту и имя вашего аккаунта» to
   what the app reads, plan-B5a-R5), «Разрешить» / "Allow" (primary) and
   «Отказать» / "Deny"; an approve or a deny goes to the client's
   redirect URL.
6. `#/account`: a "Connected apps" («Подключённые приложения») section
   after the connected providers: one row per grant (name, date granted),
   «Отключить» / "Disconnect" behind the app's confirm, then the row
   leaves; an empty line; a failed read with a retry; a failed revoke
   toast.
7. Privacy pages (both): the B5a sentence of section 3.6 with the same
   facts as the step 5 scope sentence (and the email and name when step
   1 finds them), one new "Last changed" date. `FEATURES.md` "Account",
   `META.md` section 3 (the OAuth server, the guard), D7, `node
   tools/decisions.js`.
8. `.claude/README.md`, "Supabase configuration": the dashboard settings
   (or, by step 1, the `config.toml` section; else the fact that
   `config:push` leaves them) and the production order (owner, after the
   closeout squash: the migration applied, `/connect` live, then the
   switch on; then the owner runs the acceptance probe on production).
   "Restore production (owner)" gains a step that re-applies the role
   setting and runs the probe: the nightly backup leaves out roles
   (`.github/workflows/backup.yml`), so a restore drops
   `pgrst.db_pre_request` with no error (the restrictive table policies
   survive in the schema dump; the RPC half depends on this step).
   Revert order: switch the OAuth server off (or revoke every grant)
   before the down migration, which would give client tokens the whole
   account back.

Acceptance: each step 2-6 line holds by its test; every state of the
table below is a `tests/app/inventory.js` entry with a golden; the
component tests end with `expectNoA11yViolations`; step 1's results
(the Auth endpoints, the claims, the discovery URLs, the `config.toml`
section, a revoked token at PostgREST) are recorded and its stop rule
did not fire; after `migrate-test` applies the migration, a client token
from step 1 gets 403 `api_client_guard` from `GET
/rest/v1/print_sets?limit=1` on the test project, and an app token gets
200 (recorded in `.claude/README.md`, "Supabase configuration"); an
embedding from an allowed table to an out-of-scope one and a revoked
grant's unexpired token are refused (test); the placed line of
plan-B1-2-N5 is answered in B5b ("CORS"); privacy pages and D7 exist.

Standing checks:

1. Scale (States; proof: goldens at 360 and 1180 px, component tests):
   consent - loading, details, signed out, no or unknown id (one "this
   request expired; start again in the app" state), already consented
   (redirect, no draw), approve in flight (buttons disabled), failed read,
   failed approve, the longest client name (200 characters, wrapped);
   connected apps - empty, one, many (no limit row exists; 30 rows in the
   test), the longest name, a revoke failure. The primary action stays
   at the bottom of the consent card; nothing sticky.
2. Errors: a failed read shows its retry and stores nothing; a failed
   approve or deny keeps the page and toasts; offline is a failed read; a
   grant revoked in another tab leaves on the next read of the section;
   a stale tab (the previous bundle) has no `/connect` and draws the
   not-found page, and a reload fixes it; a frontend revert draws the
   same, so the owner switches the server off first (step 8); the down
   migration follows step 8's order. No stored data is lost: a revoke
   ends the sessions and refresh tokens, never rows, and the guard
   refuses the app's unexpired access token on its next request
   (step 2).
3. Consistency: section heading, row and confirm follow the connected
   providers section; verbs «Отключить» and «Разрешить» as the app's
   other confirms; toasts as the account page's.
4. RU/EN parity: every string in `dict.ts` in both languages with the
   same facts; both privacy pages; the scope sentence (step 5) names the
   same facts in both languages and both privacy pages: what the app
   reads, changes and deletes, the list-delete cascade, the item-delete
   cascade, and the four things it never does (and the email and name
   when step 1 finds them).

Gate cost about 45 min (`check:fast`, `check:db`, CI with the golden
re-seed). Review: required (a migration; a public contract - the route).

#### B5b - The account API (implement-ready outline)

Objective: `/api/v1/me/` and `/mcp/me` over the service, relaying a
connected app's token, by the sync rule of section 3.4.

| Operation | Rule |
|---|---|
| `GET /me/lists` | heads `{ id, rev, name, entries, updated_at }` (`api-my-lists`) |
| `POST /me/lists` | `{ id, name, money_mode?, player_note?, gm_note? }`; 201; the same id again 200; another account's id 409 `conflict`; past the limit 409 `limit_reached` |
| `GET /me/lists/{id}` | `api-my-list`: the list fields and `entries` (`id`, `key`, `origin`, `record_id`, `quantity`, `price_coins`, `player_note`, `gm_note`, `gm_only`, in list order); `ETag: "<rev>"`; records come from T0 reads or `?ids=` |
| `PATCH /me/lists/{id}` | `name`, `money_mode`, notes; an optional `If-Match`: a direct `lists` update with `eq('revision', r)` and the read-back rule of `homebrewUpdate` (412 with the current `ETag` when the revision moved; the guard allows `PATCH` on `lists`); without `If-Match`, last writer wins, as the app (`apply_list_writes` `update`) |
| `DELETE /me/lists/{id}` | `If-Match` required (428 without); `delete ... revision = r`; 204; gone 204; moved 412 with the current `ETag`; the delete also deletes the list's share links, the players' requests and its notices (`on delete cascade`) |
| `POST /me/lists/{id}/entries` | `{ entries: [{ id, record_id, quantity?, price_coins?, player_note?, gm_note?, gm_only? }] }`, 1-100, the `add` op the app builds (`lib/cloudLists.ts`); a retry is idempotent |
| `PATCH`, `DELETE /me/lists/{id}/entries/{entry}` | the entry fields, last writer wins; a delete of a gone entry is 204 |
| `GET /me/homebrew-items` | heads `{ id, key, rev, updated_at }` (`api-my-items`); `?ids=` (1-10 own ids) adds `records`. The service accepts only ids in the reader's heads of the same request (another id is 400 `bad_request`: `get_homebrew_items` is SECURITY DEFINER and answers any id with no owner filter and no `related`). `records` is built from `get_homebrew_items` with one index over the answered records, every one as `linked` (a shared list's composition), so its `craft.from` holds only the keys among that answer; named difference: a client that mirrors every item gets the full `craft.from` by inverting `craft.into` over its copy, or reads `{id}` |
| `GET /me/homebrew-items/{id}` | `api-my-item`: `id`, `key`, `rev`, `updated_at`, `book`, `content` (the editable form), `record`; `ETag`; `record` is built as `GET /api/v1/homebrew-items/{id}` builds it (`get_homebrew_item`, `itemOf`, `withRecords(base, [record, ...related], [])`), so it equals the T0 record |
| `PUT /me/homebrew-items/{id}` | `{ book, content, key? }`: `content` is a `homebrew-v2` item's content (catalog field names), checked by `lib/homebrew.ts` as the editor checks it, then by the database; `key` optional on create (made by the service as `lib/homebrew.ts` makes it), ignored on replace; `art` is never written (the update omits it, as `updateItem` does when `patch.art` is undefined), so a replace keeps the stored picture; `If-None-Match: *` creates (201; an equal row 200; another row 412; a duplicate key 409 `conflict`; an id of another account, where the upsert inserts nothing and the read-back sees no row, 409 `conflict`), `If-Match` replaces by `homebrewUpdate`'s rule (412 with the current `ETag`, gone 404, already applied 200); neither 428; body cap 32768 B |
| `DELETE /me/homebrew-items/{id}` | `If-Match` required; 204; gone 204; moved 412; the delete also removes the item from every list that links it, other accounts' lists included (they get a notice), and deletes its picture |
| `GET /.well-known/oauth-protected-resource/api/v1/me` and `.../mcp/me` | RFC 9728: `resource`, `authorization_servers: ["<SUPABASE_URL>/auth/v1"]`, `bearer_methods_supported: ["header"]`, `resource_documentation`; CORS `*`; `public, max-age=3600` |

- Token: the worker decodes the payload without a signature check
  (PostgREST verifies it) and refuses before any read: none, 401
  `unauthorized` with `WWW-Authenticate: Bearer
  resource_metadata="<site>.well-known/oauth-protected-resource/api/v1/me"`;
  not a JWT, another `iss` or a past `exp`, the same with
  `error="invalid_token"`; no `client_id`, 403 `forbidden` (the app's own
  session token is refused). It forwards the token with the publishable
  `apikey`; a PostgREST 401 is 401 `invalid_token`, the guard's 42501 is
  403. It never logs, caches by or echoes the token; refresh is the
  client's. `aud` is not checked (D7).
- The service: `/me` operations take `op(input, ctx)` with `ctx.token`;
  `rpc` and a PostgREST table helper take the token; T0 operations stay
  as B1 wrote them.
- CORS on `/me`: `ME_ORIGINS` in `rest.mjs`, empty at B5b. A listed
  `Origin` is echoed with `Vary: Origin`, methods `GET, POST, PUT, PATCH,
  DELETE, OPTIONS`, headers `Authorization, Content-Type, If-Match,
  If-None-Match`, `Access-Control-Expose-Headers: ETag,
  WWW-Authenticate`, `Max-Age` 86400, no credentials; any other gets no
  `Access-Control-*` header. Reason (placed, plan-B1-2-N5): a bearer token
  is not ambient, so cross-site request forgery is not it; a browser
  client keeps a token that reads, changes and deletes a whole account
  in page script, where any script on that page can take it, and a public
  client also holds a refresh token. The allowlist makes each browser
  client a reviewed decision (one deploy and a `CONTRACTS.md` line); the
  known clients are servers (Charkeeper, the vendors' connectors) and
  need no CORS. Answers: `Cache-Control: private, no-store`, `nosniff`,
  the CSP `sandbox`.
- `/mcp/me`: B2's dispatcher listing every `x-mcp-tool` operation; a
  request without a valid client token is HTTP 401 with the
  `WWW-Authenticate` above (`.../mcp/me`); the `Origin` 403 holds. Tools
  `list_my_lists`, `create_list`, `get_my_list`, `update_list`,
  `delete_list`, `add_to_list`, `update_list_entry`, `remove_from_list`,
  `list_my_homebrew_items`, `get_my_homebrew_item`, `save_homebrew_item`,
  `delete_homebrew_item`; an omitted `id` is made by the adapter and
  returned; `destructiveHint` on deletes; the descriptions of
  `delete_list` and `delete_homebrew_item` name the cascades of their
  `DELETE` rows; descriptions mark notes and homebrew text as data.
- `openapi.json`: `components.securitySchemes.supabaseOAuth` (`oauth2`,
  `authorizationCode`, the production URLs, `scopes: {}`, "discover them
  from the protected-resource metadata"), `security` on each `/me`
  operation, the new error codes (section 5.1), the sync fair use and
  what an account `rev` covers (section 3.4). Also: `_routes.json` adds
  `/.well-known/oauth-protected-resource/*`; fixtures
  `docs/fixtures/api/v1/me-*.json` and `docs/fixtures/mcp/me-*.json`;
  `tests/contracts.js`; `CONTRACTS.md` section 6; `llms.txt` (how to
  connect; the sync rule); the law sentence of section 3.6 in
  `CLAUDE.md` and its copies; `check-site` (`/api/v1/me/lists` 401 with
  `WWW-Authenticate`, both metadata documents 200).
- Tests (stubs): every row above; each 401 and 403 case; 409, 412, 428;
  a repeated create, a repeated update after a lost answer and a
  repeated delete converge; 11 ids is 400, and an id outside the
  reader's heads is 400; a list `PATCH` with a stale `If-Match` is 412;
  a create with a duplicate key or another account's id is 409; a `PUT`
  replace keeps `art`; a list past 65536 B is 422;
  a listed `Origin` echoed with `Vary`, another without headers;
  `/mcp/me` `initialize` without a token is 401; `/mcp` lists no account
  tool; no answer or error holds the token.
- Owner steps after the closeout squash: the production switch (B5a step
  8); the `/mcp/me` connector in Claude with sign-in; a client for
  Charkeeper only when its author asks.

Standing checks: 1. Scale: no screen. Heads at the limits: lists 50 (150
at 3x), items 100 (300, about 33 KB), entries 100 a list (300); `?ids=`
at most 10; an add at most 100 entries; a list at 3x with long notes can
pass 65536 B and answers 422 with the app link, as a shared list. 2.
Errors: a failed write is 503 and the retry converges (a create by its
id; an update by the row read again, never a copy held from before; a
delete by 204); a conflict is 412 with the current `ETag`, and the client
reads the row again; a deleted list or item is 404 on a read and 204 on
a delete; the app's open tab gets the broadcast that the API's write
fires, as from another tab (`STATE.md`, the two-tab merge); a stale
client meets only added fields; a revert of B5b answers `/me` with the
JSON 404 again and keeps every row. Possible loss: a connected app's
delete is permanent (no undo), hence `If-Match`, `destructiveHint` and
the consent sentence; a list delete also deletes its share links, the
players' requests and its notices; an item delete also removes it from
every list that links it, other accounts' lists included (they get a
notice), and deletes its picture; a client token can clear an item's
picture at PostgREST (`PATCH` on `homebrew_items` with `art` null).
These are the app's own delete semantics; no copy is kept, and the
reader's only recovery is a lists file or a homebrew file saved before
(`FEATURES.md`, "Exports"). Remaining loss by last writer wins: an entry
`PATCH`, and a list `PATCH` without `If-Match`, can write a field from a
copy the client held from before another write; a list `PATCH` with
`If-Match` answers 412 instead. A plan-review trigger (Status). 3. Consistency:
the app's own semantics (limits, ids, keys, last writer wins, the
read-back rule); resource names as the app's tabs. 4. RU/EN parity:
records are pairs; error messages and `openapi.json` are English.

Gate cost about 25 min (`check:fast`, CI). Review: required (a public
contract; the write protocol).

## 7. Owner decisions

The owner left the architecture to the planner (option (c), sections 3.3
and 3.4) and may veto it. Settled on 2026-11-10 (owner; `context.md`
holds each answer and its home): Q1 (the neutral record only; no mapping,
no `format=`; D3); Q2 = A (every source, `rights`, the DPCGL notice in
`openapi.json`; D3); Q3 replaced (nothing posted on issue 72 before the
API is live; section 8); Q4 = B5 of this task (the Free-plan check done);
Q5 = yes (the shared 100,000 a day, no keys, no per-client limit); CORS
(`*` on public `/api/v1/`, none on `/mcp`, an allowlist on `/me`);
publication right after B1 (section 11, D6); Risk 6 (the privacy
sentence, section 3.6); two entry points (section 3.8, D2); Q6 = C (the
per-record audit, B0; rejected A and B); Q7 = A (the Russian text on the
site's reading, D5; rejected B and C).

Defaults taken (owner AFK), 2026-11-11, each the recommended option of a
B5 question; the owner may reverse any before B5a:

- Q8, the grant: one level, "read and change, and delete, your lists and
  homebrew items", bounded in the database (D7). Not chosen: a
  read-only level per client (a client table and a second consent text;
  Supabase has no custom scopes). Accepted: a reader cannot connect an
  app for reading only.
- Q9, the writes in v1: lists (create, rename and notes, delete) and
  their entries (add, change, remove), homebrew items (create, replace,
  delete). Not chosen: sources, cards, pictures, share links, purchase
  requests (more surface before a consumer asks; section 10). Accepted:
  an assistant cannot make a homebrew source or a picture.
- Q10, the token: only a connected app's token (with `client_id`); the
  app's own session token is refused with 403. Not chosen: accepting
  both (a pasted session token carries sign-in and deletion past the
  guard). Accepted: a script needs the consent flow.
- Q11, browser clients on `/me`: the allowlist is empty at B5b. Not
  chosen: `*` (any page that holds a token reads the account, section 6,
  B5b, "CORS"). Accepted: the first browser client waits for a deploy.
- From `reviews/plan-B5a.md` (default taken (owner AFK), the report's
  recommended option): R1, the guard refuses a client token whose
  session ended (`api_client_session_live()`, B5a step 2); not chosen:
  stating an up-to-an-hour window after "Disconnect"; accepted: one more
  definer function. R7, an optional `If-Match` on `PATCH /me/lists/{id}`;
  not chosen: last writer wins only; accepted: one more guard row. N10,
  `?ids=` builds `records` from one index over the answer and names the
  `craft.from` difference; not chosen: one `get_homebrew_item` per id
  (up to 10 RPCs and their CPU); accepted: a mirror inverts `craft.into`.

Owner stop, not a question: B5a step 1 (a client token that changes the
email or the password, links or unlinks an identity, or enrolls a factor
stops B5; a global logout and a `data` change are recorded, not a stop).
The owner's review of the audit table is an owner step (B0 step 11).

## 8. Announcement for issue 72 (the owner posts it after B1 is live)

Post nothing before the API answers on the production host. The owner
checks each URL below on the live host, edits the text, and posts it; it
offers no mapping and asks nothing a batch waits on.

> The public API of daggerheart-loot is live, and an MCP endpoint for AI
> assistants on the same backend will follow. Version 1:
>
> - `GET https://daggerheart-loot.pages.dev/api/v1/openapi.json` - the
>   OpenAPI description of every operation.
> - `GET https://daggerheart-loot.pages.dev/api/v1/rolls` - the roll
>   tables and their options (the dice count for the Core roll, the
>   rarity for the Hope and Fear tables, the section of a book such as
>   Vault of Ages).
> - `POST https://daggerheart-loot.pages.dev/api/v1/rolls/{section}` -
>   rolls one and returns the dice and the resulting items; it also takes
>   the number a player rolled at the table.
> - `GET https://daggerheart-loot.pages.dev/api/v1/records/{id}` - one
>   item; `GET https://daggerheart-loot.pages.dev/api/v1/catalog/index.json`
>   - every item in a few static files, with a version per item, so a
>   mirror refreshes only what changed.
> - `GET https://daggerheart-loot.pages.dev/api/v1/tables` and
>   `/api/v1/tables/{table}` - every table and its rows, if you prefer to
>   roll on your side; the equipment tables answer one tier at a time.
> - `GET https://daggerheart-loot.pages.dev/api/v1/homebrew-items/{id}`
>   and `/api/v1/shared-lists/{token}` - a homebrew item or a shared list
>   by its link.
>
> Every item comes in one neutral JSON format: Russian and English text
> (a Markdown subset), the source book, its license and notice
> (`rights`), a link back to the item page and the picture URLs.
> Equipment has normalized stats: damage dice and bonus apart, the Major
> and Severe thresholds, burden, trait and range. A Vault of Ages artifact
> has tier "A", and burden and trait can be "any". Map the record to your
> own model as you need; we keep the format stable.
>
> Public data needs no key, and the API answers CORS, so a server or a
> browser can call it. Version 1 is frozen: new fields and operations are
> added without breaking it. We run on a free plan with a shared daily
> quota, so please cache the table lists and make at most one request
> per user action. Text that the SRD 2.0 holds is used under the DPCGL
> 2.0; each item's `rights` names its license; the rest is not covered.
>
> Tell us what is missing for your integration.

Second worked example: bacchus-atlas (`Machenspieler/bacchus-atlas`, a
static GitHub Pages site in JS with no backend; read 2026-11-11 by the
orchestrator; nothing is posted there). It mirrors 264 catalog items
(`core` 120, `hnf` 120, `wondrous` 19, `dread` 5) from our old
`data.json` into its `data/items.json`, links
`https://artex-x.github.io/daggerheart-loot/i/{id}.html`, loads art from
that host's `img/`, and draws it on a canvas (`crossOrigin` anonymous),
so the image bytes need `Access-Control-Allow-Origin: *`. The record v1
field check: its `id`, `kind` (`item`, `consumable`: record v1 gives the same
values, because these records have no stat block; equipment would be
`weapon`, `secondary` or `armor`), `src` (`source.id`), `roll`, `en`/`ru` name and description
(`name`, `text` or `plain`), `img` (`image.full`, `image.thumb`), the
page link (`link.ru`, `link.en`) and the craft id (`craft.into`,
`craft.from`) all exist; no field is missing. Its refresh is a build-time
pull of `/api/v1/catalog/index.json` and the changed chunks (no account,
no write, no Functions request). The note the owner may send with the
announcement: replace the three dependencies by the record fields above;
the host is `daggerheart-loot.pages.dev` (the old `artex-x.github.io`
host is outside v1); the `image` URLs answer `Access-Control-Allow-Origin:
*`, which v1 freezes and `check-site` holds (section 11); a client stores
the URL from the record, not a path it builds; `data.json` stays a
frozen contract (`CONTRACTS.md` section 4) for a mirror that keeps it.
Measured by the orchestrator 2026-11-11: `pages.dev/img/cc7.webp` sends
`*`; `/i/cc7.html` answers 308 to `/i/cc7`, also with `*`.

## 9. Risks, assumptions, dependencies

- The worker's CPU factor against this host is unknown; B1 measures it
  before B3 commits to search and file checks. The heaviest B1 read is a
  cold `std` roll (about 290 KB parsed).
- `env.ASSETS` reads are assumed to cost no subrequest and no Functions
  request (true for `names.json` today, by the documentation).
- CORS brings browser traffic onto the shared quota; preflights count, and
  `Max-Age` 86400 (2 h on Chromium) limits them. The guard stays the
  fair-use text; a burn has the same effect as from a server.
- Charkeeper's import contracts change fast; the internal field check of
  section 5.3 is dated (contracts at `38ed87d`), and nothing in the
  repository depends on it after B1.
- `get_shared_list`'s answer at the import limits can pass 24 MB (measured
  2026-10-22); the 65536 cap refuses such a list (accepted in section 6,
  B1, scale).
- The `rights` values come from B0's per-record audit (Q6 = C); the SRD
  2.0 PDF's two-column layout makes a text search miss names, so the
  audit matches text and stats and the owner reviews the table. A later
  correction is a value change in `docs/rights/records.json`, not a
  schema change.
- Q7 = A accepts that DPCGL 1.9 names no website or API among the
  Permitted Formats; the takedown promise is the remedy if Darrington
  Press reads it otherwise.
- The DPCGL 2.0 can change (clause 11.1); D5 names the version and date
  it read.
- B5: the Supabase OAuth server is BETA; the guard's RPC half relies on
  PostgREST's pre-request setting, which a restore drops and the hosted
  project may refuse or ignore (the probe of B5a's acceptance, step 8's
  restore step, the named fallback of step 2); whether a client token
  can change the email or the password, link or unlink an identity, or
  enroll a factor on Auth is unmeasured (B5a step 1 stop rule); the
  token's personal claims are unmeasured (step 1); Supabase does not
  bind `aud` to the resource (D7 accepts it); a quota burn also stops
  account sync until 00:00 UTC.

## 10. Deferred

- A lean share-list projection RPC if the 422 path is hit in practice (a
  migration and a definer: plan review).
- API keys, per-client quotas, cursors, sort and field parameters, batch
  reads, clipboard text, prices, `Access-Control-Expose-Headers` and more
  `Access-Control-Allow-Headers` (for example `If-None-Match`): until a
  consumer asks. Export formats and published mappings are not deferred;
  owner Q1 rules them out.
- Account tier, until a consumer asks (owner defaults Q8-Q11): a
  read-only grant per client, writes of sources, cards and pictures,
  share links and purchase requests through the API, a browser client on
  the `/me` allowlist, webhooks or a push channel for sync.
- Usage numbers for the shared quota in the nightly usage report (Cloudflare
  analytics token): until the quota is near. Nothing shows today when it
  is near; the ceiling is about 500 users polling every 15 minutes
  (section 3.4), so B5b's first consumer with background sync reopens
  this item (plan-B5a-N12).
- Pages CORS on `/apidata/*` (plan review Risk 7): B1's probe records the
  header. With CORS on `/api/v1/` (owner, 2026-11-10), a browser client has
  the frozen API and no reason to bind to `apidata/`, which `CONTRACTS.md`
  section 5 calls internal and changed without notice. Recommended: accept
  whatever header Pages sends and add no `_headers` rule.

## 11. Publication and the v1 freeze

The owner posts the announcement and publishes as soon as B1 ships, then
iterates on the contract. v1 is frozen at that moment (D3), so these must
be right before B1's squash:

- The paths, the path parameters and the reserved prefixes (`/api/v1/me/`
  for B5b, `/mcp` for B2 with `/mcp/me` for B5b,
  `/.well-known/oauth-protected-resource/` for B5b).
- The bulk catalog: the URL `/api/v1/catalog/index.json`, the
  `api-catalog` and `api-catalog-chunk` schemas, the `rev` rule (an
  opaque string compared for equality only; it changes whenever its
  record's JSON changes and may change at other times), absolute chunk
  URLs; not frozen: chunk
  names, count and grouping (section 5.4). With it the sync rule of
  section 3.4 (heads of `{ id, rev }`, a dropped id is a delete), which
  B5b's account heads follow.
- `Access-Control-Allow-Origin: *` on the catalog files and on the
  catalog image URLs under `<site>img/` and `<site>og/` (a canvas client
  needs it, section 8; a homebrew `site.art` URL is Supabase's and
  outside the promise); the URLs are values a client stores, not a path
  form it builds.
- T0 answers never depend on the caller: `Authorization` is ignored on
  every T0 path.
- Every parameter name and value list: `dice`, `total`, `sources`,
  `kinds`, `rarity`, `hope`, `fear`, `part`, `value`; which are required
  (`part` on the `eq_*` tables and the `part` sections).
- Each answer's `format` id and `version`, and every field name, type and
  value list of each answer format (plan-B1-2-R4): `api-rolls`,
  `api-roll`, `api-tables`, `api-table`, `record`, `api-shared-list` and
  `api-error`. The value lists include the roll `mode` (`std`, `alt`,
  `table`, `part`), the dice `kind` (`nd12`, `typed`, `duality`, `pick`),
  `col`, the record `origin`, `kind` and `key` (the value relation fields
  hold), `rarity`, `tier`, the stats
  enums, the shared-list audience, and `rights.license` with its
  vocabulary `dpcgl` and `owner` (the values per record come from B0's
  audit table).
- The error envelope, the `code` values and the status of each case (400,
  404, 405, 413, 415, 422, 503; the list widens in place with new cases,
  and a client acts on the status of a code it does not know, section
  5.1), and the caps that a client can meet
  (65536 B on a shared list and a homebrew item, 4096 B on a roll body):
  a cap may rise later, never fall.
- The link forms (`<site>i/<id>`, `<site>i/en/<id>`, `<site>h/<uuid>`).
- The CORS rule: `*` without credentials on the public paths, the methods
  and headers of the preflight. Not frozen: the `/api/v1/me/` answers,
  which carry `*` in v1 only because the path is reserved and holds no
  data; B5b replaces both its 404 and its preflight (plan-B1-2-R3).
  Removing CORS or narrowing it to an allowlist later breaks every
  browser client.
- The host: `daggerheart-loot.pages.dev`; a custom domain comes beside
  it, never instead (section 3.7).
- The legal text: B0 committed and the audit table's `reviewed` date set
  by the owner, because the first consumers copy the `rights` values and
  the notice. If the squash comes first, `licenseOf` answers `owner` for
  every record while `reviewed` is null, so v1 claims too little, never
  too much; the reviewed values follow as a `rights` value change, which
  the list below allows (plan-B1-2-2).

Safe to add later, inside v1 (section 3.4, the 2026-10-21 rule on value
lists): a new resource (`/mcp`, `/api/v1/records` search, file checks,
`/api/v1/me/`, `/mcp/me`, the protected-resource metadata), a new error
`code` for a new case, `securitySchemes` and `security` on the new
operations only, a new optional parameter (`q`, `filter`), a new field (for
example a translation credit in `rights`), a widened value list (a new
source id, a new roll section), `Access-Control-Expose-Headers`, more
allowed request headers, a higher cap, a longer `Max-Age`, a changed
`Cache-Control` time, the fair-use text, the `rights` value of a record
after an audit. Anything else is `/api/v2/` beside v1.
