# Review - plan before B1 (ai-mcp)

Verdict: incomplete
Reviewed: 342c91c405dd2b0f4c60aaedeed088c435902122
Scope: plan before B1

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

The review stopped at the usage wrap-up (5-hour limit at 94 %). The
findings below are provisional; the leaning verdict is fix-then-continue.
Each finding needs no redesign. The guard reads `Verdict: incomplete` as
no verdict, so the implementer stays blocked until a complete report
exists.

Read: `CLAUDE.md`, `context.md`, `plan.md` (all sections), `handoff.md`,
`reviews.md`, `reviews/plan-B1.md`, `review.prompt.md`, the orchestrate
"When to run reviewer" and "Plan review" sections, `agent-guard.mjs`,
`tests/derived.js` "source citation", `README.md` "Sources" and "Rights",
`LICENSE`.

## Blockers

1. plan-B1-2-1 - The license statement claims more than the per-record
   audit supports (local). B0 step 7 writes "Core and Hope & Fear, and the
   campaign frame equipment that the SRD 2.0 holds, are used under the
   DPCGL 2.0". This puts all of Core and Hope & Fear under the license.
   DPCGL 1.6 makes only the SRD 2.0 Public Game Content, and 1.5(c) makes
   the exact text of rulebooks Prohibited Content. Under Q6 = C, a `core`
   or `hnf` record can resolve to `owner` ("not found", "text differs").
   Step 9 then locks the overclaim in place: the test requires "Hope &
   Fear" to stay absent from the outside clause. Section 8 says the same
   thing ("The Core and Hope & Fear text is under the Darrington Press
   Community Gaming License").
   Change: in B0 steps 6-8, the covered clause names "the Core, Hope &
   Fear and campaign frame records whose text the SRD 2.0 holds;
   `docs/rights/records.json` names each". The outside clause adds "any
   Core, Hope & Fear or campaign frame record that the SRD 2.0 does not
   hold". In step 9, test that the bold whole-book entry `**Hope & Fear**`
   is absent from the outside clause, not the bare string. In section 8,
   use: "Text that the SRD 2.0 holds is used under the DPCGL 2.0; each
   item's `rights` names its license; the rest is not covered".

2. plan-B1-2-2 - The publication precondition is enforced only by prose
   (local). "B0 committed and `reviewed` set before B1's squash" appears in
   Status, B1 "Depends on", the acceptance list and section 11. No test,
   hook or CI step checks it. A green CI run arms the squash, and the
   owner-AFK default lets the orchestrator take it.
   Change: `licenseOf(audit, it)` returns `owner` for every record while
   `audit.reviewed` is null. Add an `apiRecord.test.ts` case and a B1
   acceptance line ("an unreviewed audit renders no `dpcgl`"). Give the
   pinned audit slice in `catalog.json` a `reviewed` date. An early squash
   then claims too little, never too much, and section 11 allows a later
   rights value as an addition.

## Risks

1. plan-B1-2-R1 - A record's `rights.license: dpcgl` also covers `text.ru`
   (local). The Russian text is a translation by third parties.
   `README.md`, "Sources", gives daggerheart.su for Core, "fan
   translation" for Hope & Fear, and "a community sheet" for Hope & Fear
   equipment. DPCGL 1.7 makes a translation Adaptive Content, and 2.1(b)
   and 1.9 limit Adaptive Content to formats that name no API.
   Change: in D5 and in the `rights` schema description of `openapi.json`,
   define `dpcgl` as "the English text is SRD 2.0 Public Game Content".
   Credit the Russian text apart from that value. B0 step 7's credit
   "daggerheart.su and the project's own translation" conflicts with the
   "Sources" table: credit the sources that the table names.

2. plan-B1-2-R2 - B0 fires the batch-review trigger (local). It changes
   `.claude/agents/add-source.md`, which is an agent definition, and
   `llms.txt`, which the orchestrate "Plan review" list names as a
   public-contract file. Status and the handoff say that B0 fires none.
   Change: B0's handoff line becomes `Review: required (trigger: an agent
   definition changed; llms.txt)`. Add the review run to B0's gate cost.

3. plan-B1-2-R3 - The plan contradicts itself on `/api/v1/me/` (local).
   Section 3.4 puts the prefix outside the `*` rule "from v1 on". Section
   5.1 gives its JSON 404 the `*` headers, and the router answers `OPTIONS`
   before the path lookup, so `/me/` also gets the `*` 204. Section 11
   freezes both.
   Change: section 5.1 and `CONTRACTS.md` section 6 say that in v1 the
   `/me/` 404 and its preflight carry `*` only as a reserved path that
   holds no data, and that B5 replaces both answers.

4. plan-B1-2-R4 - Section 11 freezes the field names of record v1 only
   (local). The formats `api-rolls`, `api-roll`, `api-tables`,
   `api-table`, `api-shared-list` and `api-error` are not listed, and
   neither are their value lists (`mode`, the dice `kind`).
   Change: write "every field name and type of each answer format".

5. plan-B1-2-R5 - The B0 audit has no match rule (local). The plan does
   not say how different a text must be to count as "text differs". It
   also does not say whether `page` is the PDF page index or the printed
   page number.
   Change: compare normalized text (case, whitespace, punctuation and
   markup removed). List each near match in the owner's review summary.
   Define `page` as the 1-based PDF page index.

## Nits

1. local - The Status line "Second look: not warranted" is stale. Replace
   it with the line for this report.
2. local - B0's gate cost leaves out the follow-up commit that sets
   `reviewed`. Step 11 always needs that commit, so price it (about 20
   min).
3. local - B1 step 11 and its acceptance cite `llms.txt` lines 8, 336,
   686 and 1041 and `README.md` line 333 and `README.ru.md` line 345. B0
   edits these files first, so the line numbers move. Cite the phrases.
4. local - The plan does not name the procedure for the squash of B1 onto
   `main` in the middle of the task. Name it: after the squash, merge
   `main` back into `claude/ai-mcp` before B2 (the `342c91c4` pattern),
   with no force-push.
5. deferred-scope - B5's reason for the `/me/` allowlist ("because they
   carry the reader's token") is weak: a bearer token is not an ambient
   credential. Restate the reason when B5 is expanded.
6. local - `reviewed` is one date for the whole table. Say that entries
   added later (add-source) get their review in that batch's review.

## Deviations

- The handoff records these deviations: Q1 is in D3; the field is spelled
  `rights.license`; B0 is one batch; the planner's defaults come from Q6
  option A. All are accepted, except the two `README.md` defaults that
  plan-B1-2-1 and plan-B1-2-R1 change.

## Standing checks

1. Scale: checked, partly - the B1 Standing check 1 answer and the budgets
   of section 3.5, unchanged since `plan-B1.md`. Not checked again: the 745
   audit count (`core` 367, `hnf` 283, `frame` 95) against `data.js`.
2. Error scenarios: checked, partly - the B1 answer, including the CORS
   preflight failure and the quota. No write path and no stored user data.
   The `/me/` contradiction is in plan-B1-2-R3.
3. Consistency: checked, partly - the statement copies against the
   per-record table (plan-B1-2-1) and the `rights` vocabulary.
4. RU/EN parity: checked, partly - `README.md` and `README.ru.md` must
   carry the same facts after plan-B1-2-1 and plan-B1-2-R1. The privacy
   sentence has both pages and the same date.

Owner rules: checked - the 2026-11-10 decisions have homes in D2, D3 and
D5, the privacy pages and `docs/rights/records.json`. None is an "Owner
insights" rule.

## Suggested next action

When the usage limit resets, dispatch a fresh reviewer with this file as
its brief. It completes the open checks below and replaces
`Verdict: incomplete`. The leaning verdict is fix-then-continue with the
findings above.

## Checks still needed

- Interplay of CORS with the JSON responder, the 415 rule and `HEAD` under
  `rest.mjs`. From the plan text, no defect was found beyond
  plan-B1-2-R3.
- Spot-check that the 23 `plan-B1.md` findings are applied. Lines 15-37
  of `plan.md` look correct. The full "nothing else moved" pass is not
  done.
- Confirm that the counts (745) and the named modules exist: `hash.ts`,
  `facets.ts`, `withRecords` with that signature, and the `passes` and
  `matches` composition in `TablesPage.svelte`.
- Confirm that `.claude/skills/daggerheart-source-audit/`,
  `.claude/templates/decision.template.md` and the 2026-10-29 spelling
  decision exist. Glob timed out on these paths.
- Stale Q1 mentions: none found in `issues/ai-mcp/` (grep for `format=`,
  `charkeeper-v1`, mapping, B4).
