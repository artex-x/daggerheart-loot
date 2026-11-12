# Review - plan before B1 (ai-mcp)

Verdict: fix-then-continue
Reviewed: 342c91c405dd2b0f4c60aaedeed088c435902122
Scope: plan before B1

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

Third look. It completes the checks that `plan-B1-2.md` left open, and it
judges the fix pass of `plan-B1-2.md`.

Fix pass: the planner applied all 13 findings of `plan-B1-2.md` correctly.
The Status sub-bullets name each finding, and the plan text matches each one:

- plan-B1-2-1: B0 steps 6-9, the acceptance criteria and section 8.
- plan-B1-2-2: section 3.4, the section 5.3 `rights` row, the B0 resolution
  row, step 5, B1 "Depends on", steps 3 and 4, the acceptance criteria and
  section 11.
- R1: D5, sections 5.3 and 7, and the acceptance criteria.
- R2: the Status line, the B0 "Review" line, and the handoff "Completed" and
  "Next batch" sections.
- R3: sections 3.4, 5.1 and 11, and steps 7 and 11.
- R4: section 11.
- R5: steps 2, 4 and 11.
- N1-N6: done. One remainder of N5 is Nit 8.

`plan.md` and `handoff.md` are untracked, so `git diff` cannot show them. I
read every section that a sub-bullet names, and I read the rest of the plan
for coherence. I found no change outside the findings.

`git diff 342c91c4 -- issues/ai-mcp/` shows only `context.md`: 138 added
lines. They hold the owner decisions, the license sources and the planner
facts, and none of them conflicts with the plan.

These facts hold at `342c91c4`:

- Record counts, from a read-only `node -e` count of `data.js`: 745
  records. `core` has 367 (141 in `items`, 226 in `eq`), `hnf` has 283 (128
  and 155) and `frame` has 95 (95 and 0). There are 13 `src` ids and 1593
  records in total.
- Files that exist: `hash.ts`, `facets.ts`, `.claude/templates/decision.template.md`,
  the 2026-10-29 decision "English text uses American spelling", and the
  four `ts-hooks` references.
- Signatures: `withRecords(base, own, linked, cards = [])` in `homebrew.ts`.
  `TablesPage.svelte` composes `passes` (line 281) and `matches` (line 303).
- The `daggerheart-source-audit` skill: not found (Nit 9).

## Blockers

1. plan-B1-3-1 - The homebrew index that the plan specifies cannot meet the
   plan's own acceptance line, and it differs from the app (local).

   Section 5.4 builds the index as `withRecords(buildIndex({ items: {},
   refs, sets }), [record, ...related], [])`. A catalog set card holds no
   member list (`data.js` `sets` has `en`, `ru`, `ende`, `rud`). The members
   come from the records' `set` field (`relate`, `setMembers`), and five
   catalog records carry one. With no catalog records in the index, a
   homebrew item that names a catalog set gets these values:
   - `setOf` returns `[]`, because the item is the only member.
   - `setBonusOf` returns `undefined`.

   So the record's `set` is empty. The acceptance line "a homebrew record
   that names a catalog rule card and a catalog set resolves both" then
   fails. The app builds over the full catalog
   (`state/itemView.svelte.ts`: `withRecords(base, [r, ...this.related],
   [])`) and shows the catalog members and the bonus.

   The shared list has a second difference. Section 5.4 builds each homebrew
   entry from its snapshot alone, as `own`. `SharedListPage.svelte` builds
   one index with every snapshot as `linked`: `withRecords(base, [],
   snapshotRecords(...))`. A snapshot can carry its own set card. As `own`,
   `setBonusOf` returns `undefined`. As `linked`, it returns the carried card
   (`setBonusOf`, the `listed` branch). The API would drop a bonus that the
   app shows.

   Changes:
   - Section 3.5 (the `cards.json` row), section 5.4 and B1 step 4: add
     `members` to `apidata/cards.json`. For each catalog set key, it holds
     the member records, cut to `id`, `src`, `kind`, `set`, `en`, `ru`, `ende`
     and `rud`. There are 5 records today. The budget stays 131072 B.
   - B1 step 6 and section 5.4: the service builds the base as
     `buildIndex({ items: { set_members: <those records> }, refs, sets })`.
     A homebrew item uses `withRecords(base, [record, ...related], [])`, as
     `itemView.svelte.ts` does. A shared list builds one index,
     `withRecords(base, [], <every snapshot>)`, as `SharedListPage.svelte`
     does. Each entry's record then comes from that one index.
   - B1 step 3: the case "a homebrew record that names a catalog set" must
     check that `set.members` holds the catalog member ids and that
     `set.bonus` is the catalog card. Add one more case: a shared-list
     snapshot with its own embedded set card gets that bonus.
   - Standing check 3 of B1: add the two app compositions to the list of
     things the API reuses.

## Risks

1. plan-B1-3-R1 - The mid-task landing has no decision, and it cites the
   wrong precedent (local).

   The decision 2026-10-21, "A task branch pushes every batch; a green CI
   run of the same tree gates main", squashes a task at closeout. Task 57
   needed its own amending decision for more than one squash: 2026-10-29,
   "Task 57 lands on main in three waves". That decision also puts the task
   directory onto `main` with each squash, and the closeout deletes it there.

   The plan cites the "`342c91c4` pattern". That commit is the merge-back of
   `roll-per-line` after its closeout (`e74adffd`) and its final squash
   (`06f848fc`). It is not a mid-task landing.

   Changes, in B1 "Landing mid-task", B1 step 11 and "Files expected":
   - Write a decision "ai-mcp lands on main in two squashes". The source is
     the owner's "publish as soon as B1 ships" (2026-11-10). Add an
     "Amended by" line to the 2026-10-21 file.
   - The squash follows B1's approving batch review and a green CI run of
     the tip. Before the squash, the orchestrator confirms that
     `docs/rights/records.json` `reviewed` holds a date.
   - `issues/ai-mcp/` goes onto `main` with the squash, as in task 57.
   - After the squash, merge `origin/main` back into the task branch. Use no
     force-push.
   - Cite the task 57 decision as the precedent, not `342c91c4`.

2. plan-B1-3-R2 - The gate cost leaves out two runs (local). B0 prices its
   batch review, but B1 prices none. B1 has no "Review:" line, but it fires
   these batch-review triggers:
   - a public contract;
   - a hook (`edit-guard.mjs`, `selftest.mjs`);
   - `tools/check/` (`lib.mjs`, `lib.test.mjs`);
   - a check script in `package.json` (`e2e`).

   The merge-back commit of the landing also needs its own gates:
   - `check:fast` takes 474-479 s when a merge of `main` puts every vitest
     file in the related run (`.claude/README.md`, "Batch size and the fixed
     cost of a run").
   - One CI run takes about 15 min.

   Changes, in Status (gate cost) and B1:
   - Add `Review: required (trigger: a public contract; a hook; tools/check/;
     a package.json check script), report issues/ai-mcp/reviews/B1.md`.
   - B1 becomes about 47 min, and the landing about 23 min. The sum becomes
     about 3 h 30 min.
   - Say that the B2, B3 and B5 figures do not include their reviews.

3. plan-B1-3-R3 - The B0 match rule keeps the layout artifacts of the PDF
   (local). Step 2 lowercases the text, collapses whitespace, and removes
   punctuation and markup. `pdftotext` breaks words at line ends and at
   column edges. A collapsed break still reads as two tokens ("at tack"
   against "attack"), so a true match becomes a near match. The direction is
   safe, because the audit then claims too little. But the owner's review
   list grows by the number of these false near matches.

   Change, in step 2: compare the normalized forms with all whitespace and
   hyphens removed, the soft hyphen (U+00AD) removed, and the ligatures
   (U+FB01, U+FB02) expanded. Keep the rest of the rule and the near-match
   list.

## Nits

1. local - B0 steps 3 and 4: name both arrays of `data.js`. The 745 records
   are 364 in `L.items` and 381 in `L.eq`, and the "rights audit" test walks
   both. Define "`data.js` order" as `Object.keys(buildIndex(L).byId)`, which
   is the order that B1 step 4 packs.
2. local - B0 steps 7-9: put the outside list in its own sentence.
   - `llms.txt` "License" now holds the covered facts and the outside facts
     in one sentence ("Core and Hope & Fear are covered by that license;
     ... are not"). Step 8 must split that sentence, or step 9's clause
     pattern also captures the covered clause, which names Hope & Fear.
   - In both READMEs, the outside bullet ends "they are paid and fan
     supplements whose text belongs to their own authors". That is false
     after the bullet names Core, Hope & Fear and campaign frame records.
     Reword it in both languages.
3. local - B1 step 3 gives `apiRecord(index, it, site)` and also says that
   "`apiRecord` takes the resolved value as an argument". Section 5.4 calls
   the function with three arguments. Write one signature, for example
   `apiRecord(index, it, site, license)`, and use it in section 5.4.
4. local - B1 steps 3 and 6: `hash.ts` already exports `Site { base }`, which
   `recordUrl` and `appUrl` take. A second `Site = { origin, art }` gives one
   name two shapes and gives the site base two field names. Use `ApiSite =
   Site & { art: string }` with `base`.
5. local - Section 5.1: name the check order, because section 11 freezes the
   status of each case and the fixtures pin one order. The order: host guard
   301, `OPTIONS` 204, path template 404, method 405, section or table id
   404, 415, 413, body parse and schema 400. Also state these rules:
   - An empty body with `application/json` reads as `{}`. The `table` and
     `part` modes have only optional fields.
   - The media type is compared without regard to case.
   - Bare `/api` gets the 204 for `OPTIONS`, as any path under `/api/` does.
     Step 8 routes bare `/api` to `rest.mjs`.
6. local - Section 5.1 says "every answer under `/api/`". The host guard's
   301 on a deployment host still comes from `answer()` in `worker.mjs`.
   That answer has no CORS header, no `nosniff` and no JSON body. Name it
   as the one exception (the API answers on the production host only).
7. local - B1 step 4: "if the file is missing, B1 writes the all-`owner`
   starting file" reads as the CLI writing a committed source file at build
   time. State these two rules:
   - `tools/api-data.mjs` exits 1 when `docs/rights/records.json` is missing
     or not valid.
   - When B1 runs first, the implementer commits the starting file once.
8. local - The B5 outline still says "never `*`, because a request carries
   the reader's bearer token". That is the weak reason that the placed line
   below it (plan-B1-2-N5) asks to restate. Delete the "because" clause; the
   placed line stays.
9. local - B0 step 2 names the `daggerheart-source-audit` skill. I did not
   find it in these places:
   - the tracked `.claude/skills/`, which holds `handoff`, `orchestrate` and
     `small-fix`;
   - `C:/Users/Ignat/.claude/skills/`;
   - `D:/AppData/.claude/skills/`;
   - the plugin caches.

   It can be an account-level skill. Write that the match rule of step 2 is
   the full procedure, and that the skill supplies only terminology when the
   session lists it.

## Deviations

- Q1 is recorded in D3, not D1. Accepted.
- The field is `rights.license` (the 2026-10-29 spelling decision).
  Accepted.
- B0 is one batch: there is no split criterion, and both parts have the same
  gates and the same landing. Accepted.
- The planner kept defaults from Q6 option A: `preview/` in the MIT code
  list, and a Russian-text credit from the "Sources" table. Accepted. After
  plan-B1-2-R1, the credit names the sources of that table.
- The publication precondition (B0 committed and `reviewed` set) has no
  deterministic gate. `licenseOf` fails closed: while `reviewed` is null,
  every record is `owner`. An early squash therefore claims too little,
  never too much, and section 11 allows the later value change. Accepted.
  The confirmation step of plan-B1-3-R1 makes the precondition a named step
  of the squash.
- The Plan-review line names B1 and says that it covers B0. `agent-guard.mjs`
  judges every implementer dispatch for the task against each
  `required before` batch, so B0 is gated by the same report whichever batch
  goes first. Accepted. A "product-law change" is not on the orchestrate
  list of plan-review triggers. It does no harm.

## Standing checks

1. Scale: checked - B1 Standing check 1, the section 3.5 budgets, and
   `records/index.json` at about 57 KB at 3x against 65536 B. The audit
   count is 745 (verified against `data.js`), and the table is one file at
   3x (about 2,200 entries, read at build time only). The shared list at the
   cap holds about 10 homebrew entries. plan-B1-3-1 makes that one index
   build, not one build per entry.
2. Error scenarios: checked - the B1 answer: a failed read, a deleted item,
   a stopped share, two data versions, a thrown error, a quota burn and a
   failed preflight. For B0, a missing or invalid table fails before a
   deploy (Nit 7 makes the CLI fail closed). A squash before the owner's
   review claims too little (`licenseOf`). No write path and no stored user
   data in B0 or B1.
3. Consistency: checked - the API reuses the app's names, row order, roll
   semantics (`rowsOf`) and the Russian fallback. Defect: the homebrew
   index differs from `itemView.svelte.ts` and `SharedListPage.svelte`
   (plan-B1-3-1). Defect: `Site` names two shapes (Nit 4). The `rights`
   vocabulary is the same in the table, D5 and record v1.
4. RU/EN parity: checked - `README.md` and `README.ru.md` carry the same
   facts. The outside-record phrase is tested per language (step 9). Both
   READMEs must reword the outside bullet's tail (Nit 2). The privacy
   sentence is in both pages with the same date. Every person-readable API
   field is a `ru`/`en` pair, and `openapi.json`, `llms.txt` and `LICENSE`
   are English developer or legal text.

Owner rules: checked - in `context.md`, the decisions Q6 = C and Q7 = A have
their home in D5 and `docs/rights/records.json` (B0). Q1, Q2, CORS and the
two entry points have their home in D2 and D3 (B1). Risk 6 has its home in
the privacy pages (B1). The mid-task publication needs its decision
(plan-B1-3-R1). None of these is an "Owner insights" rule.

## Suggested next action

1. Resume the planner once with this report. It applies plan-B1-3-1,
   plan-B1-3-R1 to R3 and Nits 1-9.
2. The planner writes `- Plan review findings applied:
   reviews/plan-B1-3.md` in Status, and it updates the gate-cost line and
   the handoff "Review" lines.
3. Then dispatch the implementer for B0 or B1, with no further look.

## Checks still needed

- One local `npx wrangler pages dev` probe of the bundled worker with the
  `lib/` imports: the `.js` to `.ts` mapping and the bundle size (B1).
- The owner's `deployment tail` CPU readings: a cold `std` roll, a record,
  an `eq_weapon` tier part, and a homebrew item and a shared list at the
  65536 B cap (after B1).
- Whether Pages sends `Access-Control-Allow-Origin` on `/apidata/*` (the
  B1 probe).
- Where the `daggerheart-source-audit` skill lives (the orchestrator's
  session list), before B0 starts.
