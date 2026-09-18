# Nit register - TASK phase-8

Every nit and non-blocking risk returned by a phase-8 review, with its
status. **B12 is the batch that clears this file**; nits are no longer folded
into unrelated batches, because that failed twice (see "Why this file exists").

Reviews return their findings to the orchestrator as messages, not as files.
Before this register existed, four reviews' findings lived only in one
session's context and would have been lost with it. Any future review's nits
are appended here **when the review lands**, not when they are actioned.

Status values: `done <sha>` / `outstanding` / `verify` (believed done, not
confirmed) / `deferred` (deliberately out of phase-8, with a reason).

## Why this file exists

- B3's review nits N2-N8 were dispatched with B4. B4 shipped without them and
  said they were outside its file list. They were re-routed to B5, which did
  do them.
- B4's own review nits were then folded into B7 - the same move that had just
  failed once.
- The owner stopped it: "it's already second time we ask to fix nits but they
  are not being fixed, let's instead plan b12 to fix ALL nits."

The root cause is structural, not an agent failing: an implementer given a
named batch scope plus a list of unrelated one-liners will finish the scope
and treat the one-liners as optional. Phase 8's batches were merged **by
area** so they do not overlap, which means a nit usually has no later batch
to ride - the premise behind `orchestrate.prompt.md`'s "defer nits mid-plan"
does not hold here. A dedicated batch where the nits **are** the acceptance
criteria is the answer.

## Outstanding

None. Every row B12 was scoped for is resolved; the census below is the
index and "Review findings, by batch" (below it) holds the reasoning behind
each verdict.

## Census, 2026-09-18, at `e7ce2ad` (B12a, planner's sweep confirmed)

One verdict per live row, per `plan.md`'s "The census" - a scripted sweep
(session scratchpad, not committed), one discriminating check per id against
the tree at `e7ce2ad`, folding in the eight verdicts `plan.md` already
established rather than re-deriving them. `live` means the row's own "where"
still reads exactly as the review found it; `already done <sha>` means a
later batch fixed it as a side effect without the register noticing;
`moved: <site>` means the target relocated but the defect is the same;
`closed (no change - reason)` matches a verdict `plan.md` or this piece
already decided. Every `already done` row below is moved to `## Done` in
this same commit. Rows this piece itself lands (`B11-BL-1`, `B11-BL-2`,
`B11-R1`, `B7-N3`, and the record/spec list) carry `done <sha>` where they
live in their own review section below, not repeated here.

| id | verdict |
|---|---|
| B4-R1 | done `639f7eb`, this piece (`dirReader`'s jsdoc narrowed to the one Pages rule it actually emulates, with the three measured divergences named as why they don't matter to any check here) |
| B4-R2 | done `639f7eb`, this piece (`check-site.test.mjs`'s shape test now asserts the exact count, 21, and the exact sorted distinct path set, not `length > 10`) |
| B4-R3 | done `639f7eb`, this piece (`fetchReader`'s jsdoc reworded: states the true worst-case retry budget, ~19 minutes, and that it can still exceed `deploy`'s own 10-minute job timeout - reword, not a behaviour change) |
| B4-R4 | done `639f7eb`, this piece (`tests/derived.js` asserts `404.html` contains `SITE`'s own pathname) |
| B4-1 | done `639f7eb`, this piece (`golden.test.mjs` gained a `serializeTree` test pinning rule A's elision-summary line and rule B's `[namelen=... namehash=...]` suffix together; `KEEP_KEYS`/`sigOf`/`lineFor`/`controlLine` dropped from `golden.js`'s `module.exports` - each is used internally only, and a `git grep` outside `golden.js` for all four found nothing) |
| B4-2 | done `639f7eb`, this piece (`golden.test.mjs` gained a 12-child interleaved checkbox/button case for `elisionOf`, proving whole-list grouping where a run-detection algorithm would elide nothing at all) |
| B4-3 | done `639f7eb`, this piece (`ci.yml`'s guard step gained the `echo` before the `if` - the deploy log now actually carries the stub-count line; **the original acceptance line stays recorded as unmet at B4**, per the plan's own instruction - see `handoff.md`) |
| B4-4 | done `639f7eb`, this piece (`ci.yml`'s DP2 guard now reads `_site/catalog.csv`, not the repo-root copy, so a truncated collect-step copy is exercised) |
| B4-5 | done `639f7eb`, this piece (`tests/derived.js` gained two local assertions: `404.html` carries `noindex` and its `id="app-404"` marker) |
| B4-6 | done `639f7eb`, this piece (`.prettierignore`'s shared comment reworded to give `404.html` its own clause instead of inheriting `app/index.html`'s singular one) |
| B4-7 | done `639f7eb`, this piece (the bare `fetch-depth: 0` dropped from the `check` job's checkout - `git diff --exit-code` needs no history) |
| B4-8 | closed (no change - `handoff.md` was compacted since B4; no batch's Completed entry carries a per-entry `Review:` field any longer, so "in `## Status` rather than its own entry" no longer maps onto the file's structure) |
| B4-9 | done `e52f5de`, this piece (`docs/specs/META.md` section 7 reflowed) |
| B4-10 | closed (no change - `plan.md`'s own decision, real branch-build justification) |
| B5-R1 | done `639f7eb`, this piece (`tests/craft.js` gained an assertion pinning O6's one-`<p>`-per-line rendering against record `w6`, a real multi-line record) |
| B5-R2 | done `e52f5de`, this piece (`docs/specs/COVERAGE.md` gained the "no golden moved is narrower than it sounds" paragraph) |
| B5-R3 | closed (no change - `plan.md`'s own decision, no instrument short of a CSS test this repo does not have) |
| B5-N1 | done `e52f5de`, this piece (`.claude/README.md`'s cost table gained a `run-all.js --shard=n/m` row) |
| B5-N2 | done `e52f5de`, this piece (`.claude/README.md`'s Hooks row states the asymmetry) |
| B5-N3 | done `639f7eb`, this piece (`vite.config.mts`'s threshold comment moved to sit above `Button.svelte`, reworded for three named exceptions rather than "the one exception") |
| B5-N4 | done `e52f5de`, this piece (`docs/specs/COVERAGE.md` names all three carve-outs) |
| B5-N5 | done `607b252`, this piece (`badge.test.ts`'s third case now ends `expectNoA11yViolations`) |
| B5-N6 | done `607b252`, this piece (`badge.test.ts:1`'s header now says eleven variants) |
| B5-N7 | done `e52f5de`, this piece (`handoff.md`'s B5 entry gained the `SUB_LABEL` deviation) |
| B5-N8 | done `607b252`, this piece (`label.test.ts` pins `whereFrom` for the Equipment group) |
| B5-N9 | done `607b252`, this piece (`alt.test.ts` asserts every non-top rarity bumps) |
| B5-N10/11/12 | done `607b252`, this piece - `RARITIES` (`app/src/lib/alt.ts:25`) confirmed to have real callers (`AltPanel.svelte`, `TablesPage.svelte`, `alt.test.ts`), so kept, not deleted; all three comments (`roll.ts:14`, `alt.ts:25`, `listLink.ts:14`) reworded to their true reasons |
| B5-N13 | done `607b252`, this piece (`RecordModal.svelte` gained a comment on why toasting from inside the modal still works) |
| B5-N14 | done `639f7eb`, this piece (`tests/run-all.js`'s weight comment reworded to drop "the reviewer re-ran the packer"; `Badge.svelte`'s comment reworded to state the actual reason - an earlier deliberate decision to wait for a third real copy, not a missed second-use deadline) |
| B5-N15 | already done `0f0c73b` - `tests/run-all.js`'s empty-shard message is already English ("shard ... is empty: fewer suites than bins"), fixed incidentally by B9's translation sweep |
| B6-R1 | live - routed to Deferred, this piece (see "Deferred out of phase-8") |
| B6-R3 | done `607b252`, this piece (`app.svelte.ts`'s `go()` only sets `#expectHash` when the hash actually changes - proved to bite: a new `app.test.ts` case failed 2 navigations instead of 3 with the guard reverted, passed restored) |
| B6-R4 | done `607b252`, this piece (`ListPage.svelte` gained a `visibilitychange` flush beside `pagehide`, sharing `flushUrlSync`'s own no-double-flush guard - proved to bite: a new `listPage.test.ts` case failed with the listener reverted, passed restored) |
| B6-R5 | live - routed to Deferred, this piece |
| B6-N1 | done `bb20a0d`, this piece (`tests/app/contracts.js`'s "28 fixtures" comment corrected to 30) |
| B6-N2 | done `639f7eb`, this piece (`golden.test.mjs` gained a `slugOf` uniqueness assertion over the whole `STATES` inventory - 112/112 confirmed distinct) |
| B6-N3 | done `607b252`, this piece (`StorageNotice.svelte`'s comment now says it takes two writes, not one) |
| B6-N4 | live - routed to Deferred, this piece |
| B6-N5 | done `607b252`, this piece (`storage.ts`'s `onExternalChange` comment corrected - `watch()` does no merge for either shape) |
| B7-N1 | done `bb20a0d`, this piece (`help.ts:544`'s `Players' link` straightened to ASCII - coupled with `B11-N2`/`B11-N3`, one commit) |
| B7-N2 | done `bb20a0d`, this piece (`states.js` gained case 25, real-Chromium coverage of the dismiss button while `<details>` is folded) |
| B7-R1 | done `bb20a0d`, this piece (`Shell.svelte`'s comment corrected to `sticky`, plus the measurement: at 1180, opening a selection pushes the footer down by exactly the bar's own 53px, and at max scroll the bar rests ~20px above the footer rather than overlapping it - same at 375) |
| B7-R2 | done `bb20a0d`, this piece (`states.js` case 23's dead `.card.scrollTop` assertion replaced with a `.seldrop > .btn` count) |
| B7-R4 | done `bb20a0d`, this piece (measured: `.note-x::after` extends 7px into the note textarea, `.warn-x::after` extends 2px above the notice box, both at 1180x900 - reproduces; `docs/specs/DEBT.md` gained `D27`, no redesign, no shrink below 44px) |
| B7-N3 | done `e52f5de`, this piece (`tests/app/lib.js`'s unused `allow` parameter deleted) |
| B7-N4 | done `bb20a0d`, this piece (`inventory.js`'s dead `selected`/`importPh` LABELS keys deleted, ru and en) |
| B7-N5 | closed (no change - `handoff.md`'s "Not yet committed"/"one unstaged file" text this row names was already superseded by later compaction; not present in the current file) |
| B7-N6 | closed (no change - same compaction; no batch's Completed entry carries a per-entry `Review:` field, identical resolution to B4-8) |
| B7-N7 | closed (no change - already done; `handoff.md:318` carries a top-level `## Verification`) |
| B7-N8 | closed (no change - `handoff.md`'s "Category 6" text this row names was compacted away; the current B7 entry's prose no longer itemises categories) |
| B7-N9 | done `607b252`, this piece (`TablesPage.svelte:84`'s `as TableId` cast removed - narrowed before `untrack`) |
| B7-N10 | done `607b252`, this piece (`SectionHead.svelte` uses a `Record<2\|3, 'h2'\|'h3'>` lookup, not a string concatenation or a branching ternary) |
| B7-N11 | done `607b252`, this piece (`tables.test.ts`'s folded-panel case now asserts `queryAllByRole` at role level, not a class probe) |
| B7-N12 | done `607b252`, this piece (`shell.test.ts` pins the negative: a shared list names itself on screen but keeps the plain tab title) |
| B7-N13 | done `bb20a0d`, this piece (`driver.js`'s `click()` doc comment gained the two ranking edges and "for a checkbox, always `tick()`") |
| B7-N14 | closed (no change - the attempt-by-attempt `npm run check` chronology this row names was compacted away) |
| B7-N15 | done `bb20a0d`, this piece (`dict.ts`'s `droppedItems` (en) now uses an em dash, matching `noLists`) |
| B8-R3 | done `607b252`, this piece (measured `toBlob` on this host - 640x640, five runs, 1032-1074ms; `image.ts`'s watchdog comment records it and stays at 2000ms; `RecordActions.svelte`'s `copyImage` now names the rejection cause with `console.warn` before falling back, `imgTainted`'s wording unchanged; no `dict.ts` key added) |
| B8-R4 | done `607b252`, this piece (`ports.test.ts` gained a jsdom test on `download` - the `<a download>` name, the click, the removal - and `vite.config.mts`'s exclusion comment now attributes the `states.js` claim to `pngOf` alone) |
| B8-R5 | done `e52f5de`, this piece (discharged by evidence - see "From B8's review", below) |
| B8-R6 | done `bb20a0d`, this piece (`print.js`'s D20 block gained two comments: the seed-never-cleared hazard, and the 7000ms toast flake budget) |
| B8-N1 | done `607b252`, this piece (`tokens.css`'s D1 comment states the rejected alternative's reason inline instead of citing the deleted `DEBT.md` entry) |
| B8-N2 | done `607b252`, this piece (`imgFailed` reworded to "could not save" in both languages; `record.test.ts` updated; no golden hit) |
| B8-N3 | done `e52f5de`, this piece (`docs/specs/FEATURES.md`'s focus-ring radius claim corrected) |
| B8-N4 | done `bb20a0d`, this piece (`states.js:390`'s stale "before B12" citation corrected to "before B8") |
| B8-N5 | done, already `480c380` - the same edit as `B8-R2`, which that sha already shipped; this row simply duplicated it |
| B8-N6 | live - routed to Deferred, this piece |
| B8-N7 | live - routed to Deferred, this piece |
| B8-N8 | closed (no change - already done, same as B7-N7) |
| B8.1-R1 | closed (no change - verified reasoning, the reviewer's own grading) |
| B8.1-R2 | closed (no change - verified reasoning) |
| B8.1-R3 | closed (no change - verified reasoning) |
| B8.1-R4 | closed (no change - verified reasoning) |
| B8.1-R5 | closed (no change - verified reasoning) |
| B8.1-R6 | closed (no change - verified reasoning, and NIT-4 already closes the actionable half) |
| B8.1-N1 | done `639f7eb`, this piece (`golden.test.mjs` gained a source-text assertion counting `golden.js`'s three `await d.addressSettled()` call sites - a call-site guard, per this row's own *(taste)* framing: it proves the calls are still there, not that they are in the right place) |
| B8.1-N2 | done `bb20a0d`, this piece (`states.js` case 24's comment re-pointed at `driver.js`'s own current `prepare()` reasoning, not the retired parity-era one) |
| B8.1-N3 | done `bb20a0d`, this piece (`contracts.js` calls `d.addressSettled()` before the owned-list hash read) |
| B8.1-N4 | closed (no change - the review's own conclusion stands: a location fix is a format change beyond nit-size, the same class as `B4-10`/`B5-R2`/`B5-R3`) |
| B9-R1 | closed (no change - a documented risk, per the review's own framing ("risk, recorded")); no action was ever specified |
| B9-R2 | done `639f7eb`, this piece - one edit with B9-N5 (see below) |
| B9-R3 | closed (no change - verified sound, the reviewer's own grading) |
| B9-N3 | done `639f7eb`, this piece (`tests/contracts.js` wired to `./ok.js`; its own inline fail counter deleted) |
| B9-N5 | done `639f7eb`, this piece - one edit with B9-R2: `no-regex-spaces` fixed at all 5 measured sites (`derived.js:798,819,821,841`, `golden.test.mjs:231`, literal double-space runs replaced with `{2}`/`{4}`); `preserve-caught-error` narrowed to three inline `eslint-disable-next-line` comments at its exact pre-existing sites (`tools/artwork/run.mjs`, `tools/tg-preview/run.mjs`, `tests/app/driver.js:369`), replacing the directory-wide off, so a *new* catch/rethrow is still caught; `@typescript-eslint/no-extraneous-class`'s two constructor-only classes (`tools/capture-share-fixture.mjs`, `tests/app/driver.js:859`) rewritten as plain constructor functions; `no-useless-assignment`'s one dead `let live = null` initialiser (`tools/tg-preview/live.mjs:75`) dropped. `npx eslint .` clean afterward. |
| B9-N6 | done `639f7eb`, this piece (`eslint.config.mjs`'s block comment reworded to the durable per-rule reasons instead of citing this batch's own retracted `git diff -w --stat` acceptance line) |
| B9-N10 | done `e52f5de`, this piece (`context.md:165`'s header cells now read `want`/`got`) |
| B9-N11 | done `639f7eb`, this piece (`@typescript-eslint/no-require-imports`'s off narrowed to `files: ['tests/**/*.js', 'tools/**/*.js']` - all 60 measured sites are `.js`; a future `.mjs` tool reaching for `require` is still caught) |
| B10-N1 | done `607b252`, this piece (`RecordHost.svelte`'s header comment gained the `app.hash`-rejection sentence back) |
| B10-N2 | done `607b252`, this piece (`extra`'s return type narrowed - no `\| undefined` on the function's own return) |
| B10-N3 | done `607b252`, this piece (`index: Index \| null`, dropped `\| undefined`) |
| B10-N4 | done `607b252`, this piece (`ListPage.svelte` gained the nested-host invariant as a comment, not a structural move) |
| B10-N5 | done `607b252`, this piece (`StdPanel`/`AltPanel`/`RollPanel` gained the extraction rejection and its three-way comparison, written once) |
| B11-BL-1 | done `e52f5de`, this piece (see "From B11's review", below - proved to bite) |
| B11-BL-2 | done `e52f5de`, this piece (proved to bite) |
| B11-R1 | done `e52f5de`, this piece (both halves, six proofs) |
| B11-N1 | done `e52f5de`, this piece (`docs/specs/FEATURES.md`'s example re-pointed at the query side, with a real U+2019) |
| B11-N2 | done `bb20a0d`, this piece (`inventory.js`'s `sharePlayers` straightened to ASCII, false "curly apostrophe" comment corrected - coupled with `B7-N1`/`B11-N3`, one commit) |
| B11-N3 | done `bb20a0d`, this piece (the coupling itself - both sides moved together) |
| B11-N4 | done `e52f5de`, this piece (append-only note under `context.md`'s Q8 row) |
| B11-N5 | done `e52f5de`, this piece (`handoff.md`'s B11 entry reflowed) |
| B1-N9 | closed (no change - this piece, B12b) - `matches`'s union third argument touches ten-odd call sites across `SearchPage.svelte`, `TablesPage.svelte` (twice) and `search.test.ts` (eight), past the plan's own six-call-site/no-type-gymnastics budget; `search.ts`'s own doc comment on `matches` now records the risk and the reason instead |
| B2-4 | done `607b252`, this piece - `app/src/state/app.test.ts:106-115`'s comment reworded to drop the dead `TAB_LIST` identifier, keeping the substance in prose |
| B2-5 | done `e52f5de`, this piece (`.claude/README.md:109`'s commit-gate description now says "covered paths", not "the tree") |

## Review findings, by batch - detail behind the census, all resolved

Every row below is resolved; see the census above for the verdict. Most rows
here were left exactly as the originating review wrote them, without an
inline marker restating the census - only rows this task's later pieces
edited in place carry a `done <sha>` note. Absence of a marker is not an
open item; the census is authoritative.

### From B4's review (deploy and gate correctness)

| id | where | what |
|---|---|---|
| B4-R1 | `tools/check-site.lib.mjs` (the `dirReader` comment) | Claims it "emulates GitHub Pages' missing-path rule **exactly**". It emulates one rule. Measured divergences against the live site: extensionless `/i/w1` is 200 live, 404 locally; a directory path throws `EISDIR`; a case-insensitive filesystem returns 200 where Pages returns 404. No current check is affected - every path in `checks()` is an exact file - but the word "exactly" invites a future author to trust a local probe that would lie. Narrow the comment to the fallback rule only and say why every path is an exact file. |
| B4-R2 | `tools/check-site.test.mjs` | Asserts only `list.length > 10`. The exact failure T10/DP9 exists to prevent - an assertion silently vanishing in a refactor - would keep this suite green. Assert the sorted distinct path set and the exact count. The 14-assertion inventory in B4's review is the artefact to encode. |
| B4-R3 | `tools/check-site.lib.mjs:143-145` | The retry budget (12 paths x 15 s x 6 tries + waits, ~19 min) exceeds `deploy`'s `timeout-minutes: 10`. The comment's claim that the signal avoids hanging to the job timeout holds for one stalled socket, not a broadly stalled CDN. Reword, or bound the total. |
| B4-R4 | `404.html:43,44,48,49` | `/daggerheart-loot/` is now hardcoded in a fifth place with nothing pinning it (with `tools/derived.js:10`, `tools/build-share-pages.js:13`, `llms.txt`). A repo rename or an apex `CNAME` breaks both links with every gate green. `tests/derived.js` already reads `SITE`; one assertion that `404.html` contains `SITE`'s pathname closes it. |
| B4-1 | `tests/app/golden.js` | Exports six symbols nothing consumes (`KEEP_KEYS`, `sigOf`, `lineFor`, `controlLine`, `serializeTree`, `slugOf`) - against `CLAUDE.md`, "Add no module, export, component, or variant before something uses it". Preferred resolution is one more test: `serializeTree` exercises `lineFor` + `elisionOf` + `capName` together and would pin the two output formats nothing currently pins (the elision summary line and the `[namelen=... namehash=...]` suffix). Then drop whatever is still unused. |
| B4-2 | `tests/app/golden.test.mjs` | Rule A's most subtle property is untested: `elisionOf` groups **across the whole list, not by consecutive run**, which is why a table row's alternating siblings fold at all. Both existing tests use uniform sibling lists, so a regression to run-detection passes. One case with two interleaved signatures covers it. |
| B4-3 | `.github/workflows/ci.yml` (the guard step) | The plan's acceptance "the deploy log shows the stub-count line" is **not met and not recorded as unmet**. GHA runs `bash -e`, not `-x`, so the step echoes its source with `$stub_count` unexpanded and prints nothing on success; the `1091 = 1091` in the handoff came from a local replay. Add one `echo` before the `if`, and record the previously-unmet line. |
| B4-4 | `.github/workflows/ci.yml` (DP2) | Reads the repo-root `catalog.csv`, not `_site/catalog.csv`. `catalog.csv` has no `cmp` byte-identity guard the way `index.html` and `assets/app.js` do, so a truncated copy into `_site` is invisible. Pointing the same line at `_site/catalog.csv` also exercises the copy, at zero cost. **May already be done** - B5 was offered this mid-flight; verify before editing. |
| B4-5 | `tests/derived.js` | `404.html` is not reached by the `NOINDEX` check (which covers `app/index.html` and the stub generator). A deleted `noindex` or a deleted `id="app-404"` marker stays green through `npm run check` and only reddens in the deploy guard. Two lines make it a local gate. |
| B4-6 | `.prettierignore:20` | `404.html` inherits a comment block written about `app/index.html` ("left open at R0c, issue 47", singular, "this one is not generated"). Needs its own one-line reason, or the existing comment pluralised. |
| B4-7 | `.github/workflows/ci.yml:39` | `fetch-depth: 0 # gitleaks reads history, not just a snapshot` is in the wrong job - gitleaks runs in `secrets`, which has its own `fetch-depth: 0`. The `git diff --exit-code` step does not need full history either. **May already be done** - offered to B5 mid-flight; verify. |
| B4-8 | `issues/phase-8/handoff.md` | B4's `Review:` field is in `## Status` rather than in its own `### B4` Completed entry, which is where the rule shipped in `c8cc38e` puts it. The information is present; only its placement breaks the rule the previous batch shipped to make the check visible. |
| B4-9 | `docs/specs/META.md` section 7 | Irregular hand-wrap, breaking mid-clause at ~55 and ~40 columns against the file's ~75. *(taste)* |
| B4-10 | `.github/workflows/ci.yml:279-291` | 13 lines defending a check the same comment says can only fail for a reason that does not matter. It is what DP7 asked for and the branch-build justification is real. *(taste, probably leave)* |

### From B5's review (single sources: lib, generator, components)

Verdict **approve**, no blockers. Appended when the review landed, per the
standing rule below.

| id | where | what |
|---|---|---|
| B5-R1 | `tools/build-share-pages.js` | O6 changed **98 of 1091 published stub pages** (proved by rendering every record through both generators) and **nothing pins the new shape**. `tests/derived.js` compares the generator against its own fresh output; `tests/craft.js`'s first-line probe passes identically for the old glued `<p>` and the new split one. One assertion on a multi-line record closes it. The only behaviour change in the batch with no guard. |
| B5-R2 | (understanding, not a file) | "No rendered bytes moved" is narrower than it sounds. The goldens snapshot the accessibility tree plus the control inventory - **no class attribute, no CSS, no computed style**. The CSS half of C2 rests on `app/hues` (computed `color` on a few selectors) plus axe contrast; `.badge.tier`, `.uniq`, `.num`, `.hope`, `.fear` and every non-colour declaration are measured by nothing. Verified by reading. Do not let the handoff's phrasing be read as "no pixel moved". |
| B5-R3 | `app/src/components/ListsPage.svelte:181-188` | `.grow`'s correctness is now prose: it works because `.grow` appears exactly twice, both inside `NumRow`. A third `.grow` outside a `NumRow` in that file silently inherits `flex: 1 1 170px`. The comment records it; nothing enforces it. |
| B5-N1 | `.claude/README.md:233-239` | `bash-guard.mjs` says its `LONG_CHECKS` costs "mirror" that table, but the new `--shard=n/m` measurement went into the hook's cost string only; the table has no `run-all.js --shard=` row at all. |
| B5-N2 | `.claude/README.md:109` | The Hooks row still says "including an unsharded `golden.js`/`sweep.js` call" and never says a `run-all.js --shard=` call is deliberately **not** exempt - the asymmetry a reader would guess wrong from the golden/sweep precedent. |
| B5-N3 | `vite.config.mts:180-186` | Comment opens "The one exception, and it is a file rather than a rule" and is followed by three (`DiceBar`, `Button`, `Badge`); it also sits above the `DiceBar` entry while describing `Button`. |
| B5-N4 | `docs/specs/COVERAGE.md:195,219-223` | States components are at "75 branches" without noting three carve-outs (Button 60, DiceBar 55, Badge 50) and names only Button's. `CLAUDE.md` makes COVERAGE.md authoritative for thresholds; it is three exceptions behind. |
| B5-N5 | `app/src/components/badge.test.ts` (third case) | Does not end with `expectNoA11yViolations`, unlike the other two. `CLAUDE.md` asks component tests to end with it and to cover changed states with axe. **done `607b252`**: `container` destructured and the call added at the end of the case. |
| B5-N6 | `app/src/components/badge.test.ts:1` | Header says "the base rule and the nine variants"; the component ships eleven. **done `607b252`**: reworded to "eleven". |
| B5-N7 | `issues/phase-8/handoff.md` (B5 Deviations) | The plan's step 1 says `subLabelOf(table)`; the code uses `SUB_LABEL[table]`. The code is **right** - `subLabelOf` falls back to `'tables'` and would render `Wondrous Loot - Таблицы`, failing `label.test.ts:158` - but it is recorded only inside "What shipped". It belongs under Deviations, because it is exactly the swap a later reader "simplifies" back. |
| B5-N8 | `app/src/lib/label.test.ts` | `whereFrom` is pinned for seven groups but not Equipment. A1's byte-identity for `grpEquipment`/`subWeapon`/`subSecondary`/`subArmor` currently rests on reading `dict.ts`. Two assertions pin the last un-pinned group. **done `607b252`**: two assertions added (`eq_weapon`/ru, `eq_armor`/en). |
| B5-N9 | `app/src/lib/alt.ts:111` | A4's guarantee stops one step short: `BUMP` is `Partial<Record<Rarity, keyof Dict>>`, so a sixth rarity added to **both** the union and `RARITY_ORDER` still makes `bumpUp` return `null` silently for the new top. The named defect (order extended alone) is genuinely closed; this residue is not. `alt.test.ts` never asserts that every non-top rarity bumps. **done `607b252`**: `alt.test.ts` gained a loop asserting every rarity but the top bumps to a non-null result. |
| B5-N13 | `app/src/components/RecordModal.svelte` | The deleted `say` shim carried the only record of **why** toasting from inside a modal works ("in the top layer above this dialog's own inertness"). That fact is now written nowhere. **done `607b252`**: a comment restoring the fact added above the `nameActions` snippet's `<RecordActions>`. |
| B5-N14 | `tests/run-all.js`, `app/src/components/Badge.svelte:8-9` | Prose: "the reviewer re-ran the packer..." names a session actor rather than evidence; Badge's "so this is one use late rather than early" is self-assessment rather than a reason the code is shaped that way. |
| B5-N10/11/12 | `roll.ts:14-16`, `alt.ts:25`, `listLink.ts:14-17` | *(taste)* a re-export justified by "any future caller"; `RARITIES` as a pure alias of `RARITY_ORDER` in the batch about single sources; a re-export comment overstating the rule it defends. **done `607b252`**: `roll.ts`'s `clamp` re-export now names `roll.test.ts` as the one real caller; `alt.ts`'s `RARITIES` comment now says it is a reference, not a copy, kept as a name for alt-table callers; `listLink.ts`'s `MoneyMode` re-export comment now says two of its three named callers already reach into `money.ts` directly, so it saves nothing for them - it only keeps the list-entry vocabulary in one place. `RARITIES` itself kept (real callers, confirmed by the census above). |
| B5-N15 | `tests/run-all.js:177-178` | The new empty-shard message is a **new Russian string** in a file B9 is scheduled to translate. Cheaper in English now than rewritten in B9. Mark `deferred-scope` if B9 owns that file wholesale. |

### From B6's review (router, state, lists)

Verdict **fix-then-continue**; the two blockers go to B6's implementer as the
one remediation cycle, not to B12. R-2/N6 rides that same pass. The rows
below are B12's.

| id | where | what |
|---|---|---|
| B6-R1 | `app/src/state/lists.svelte.ts` (`#readCurrent`) | A **second** corruption is never backed up, and nothing cleans `.bad` up. The `get(LISTS_KEY_BAD) === null` guard is deliberate and its rationale is sound (do not overwrite the first loss), but the consequence is concrete: corruption #1 backs up; the key later becomes valid; `unreadable` clears and the notice disappears; `.bad` is orphaned forever with no UI to reach it; corruption #2 is **not** backed up and `save()` overwrites it, while the notice still claims preservation. Key the backup by timestamp, or drop `.bad` once a read succeeds. This is the defect one level down, not eliminated. **Moved to Deferred, this piece (B12a)** - see "Deferred out of phase-8"; `DEBT.md` entry `D24` lands in `B12b`. |
| B6-R3 | `app/src/state/app.svelte.ts` (`#expectHash`) | Never cleared on a non-matching navigation. `go(X)` sets it before `navigate(X)`; if `X` equals the current hash a real browser fires no `hashchange` and the value goes stale indefinitely (`memoryRouter` announces unconditionally, so no test can see it). A later Back/Forward landing on `X` is then swallowed and `this.hash` desyncs from the address bar. Unreachable from today's four `go()` call sites, all of which navigate elsewhere. A `hash !== router.hash()` guard removes the trap. **done `607b252`**: the guard added; proved to bite with a new `app.test.ts` case and a purpose-built `quirkyRouter` double that, unlike `memoryRouter`, only announces on an actual hash change - reverting the guard made the case fail (2 navigations, not 3), restoring it passed. |
| B6-R4 | `app/src/components/ListPage.svelte` | `pagehide` alone for the pending URL flush. On mobile Safari a tab can be discarded from hidden without `pagehide`; `visibilitychange`->hidden is the more reliable last callback. Bounded (the address lags, the storage write is already synchronous), but on a bfcache restore the component is not remounted and the effect does not re-run, so the address can stay stale until the next edit. **done `607b252`**: a `visibilitychange`->`hidden` listener added beside `pagehide`, both calling `flushUrlSync`, whose existing `syncTimer === null` guard prevents a double flush when both fire for the same teardown. Proved to bite: a new `listPage.test.ts` case failed with the listener reverted (`replace` never called on `visibilitychange`), passed restored; the same case also fires `pagehide` right after and confirms `replace` still called only once. |
| B6-R5 | `app/src/lib/listLink.ts` (`parseItems`/`decodeList`) | When **every** id is dropped, `parseItems` returns `null`, so the user gets `badShare` ("the link is damaged") rather than `droppedItems`. The link is not damaged; its items are all gone. Pre-existing shape, but it is the worst case of the defect R3/P9 was fixing. **Moved to Deferred, this piece (B12a)** - see "Deferred out of phase-8"; `DEBT.md` entry `D25` lands in `B12b`. |
| B6-N1 | `tests/app/contracts.js:128` | Comment says "One context reused across all **28** fixtures"; `routes.json` now has 30 - a count used as evidence, made stale by this batch's own two rows. **done `bb20a0d`**: both occurrences of "28" in the comment corrected to 30. |
| B6-N2 | `tests/app/golden.js:53` | `slugOf = id.replace(/\W+/g, '_')` has no uniqueness assertion and `wantFiles` is a `Set`, so two ids sharing a slug would silently share one golden and the stale-file sweep would not notice. B6 shipped the first id whose distinguishing character is stripped (`#/l/~AAAA` -> `_l_AAAA`, colliding with a hypothetical `#/l/AAAA`). One assertion over `STATES` closes it; verified no collision today (112/112). |
| B6-N3 | `app/src/state/lists.svelte.ts` / `StorageNotice.svelte` comment | Says the notice keeps showing "until a write actually clears it"; it takes **two** writes - the first `save()` reads the still-corrupt key (setting `unreadable` again) before overwriting it. **done `607b252`**: `StorageNotice.svelte`'s comment now states the two-write mechanism. |
| B6-N4 | `app/src/lib/dict.ts` `badStorage` (ru + en) | *(taste)* "under a separate key" is unactionable for a non-technical reader - there is no way to reach it without devtools. Name the key or drop the reassurance. Interacts with the BL-2 remediation. **Moved to Deferred, this piece (B12a)** - product content, no `DEBT.md` entry; see "Deferred out of phase-8". |
| B6-N5 | `app/src/ports/storage.ts` (the `storage` handler comment) | *(prose)* Claims "the merge's own `mergeLists(mine, [])` already answers 'storage came back empty' correctly" - but `watch()` performs no merge. This comment is the justification BL-1 rests on; correct it whichever way BL-1 is resolved. **done `607b252`**: rewritten - `watch()` calls `load()` plain for either a matched key or `null`, replacing `this.lists` wholesale; `mergeLists` is `save()`'s own, a different question. |

### Found while implementing B7 (accessible names, product text, structure)

| id | where | what |
|---|---|---|
| B7-N1 | `app/src/lib/help.ts:544` | `{ b: 'Players’ link' }` still carries the curly apostrophe P14's editorial pass straightened everywhere in `dict.ts` (`sharePlayers`, `notePubHint`, `playersLinkCopied`). Out of P14's literal scope (named as a `dict.ts` pass), but the same inconsistency in a sibling file. **done `bb20a0d`**: straightened to `"Players' link"` (ASCII). Coupled with `B11-N2`/`B11-N3` in the same commit - checked first against `tests/app/snapshots/` for the curly form, zero hits, so no golden moved. |
| B7-N2 | `tests/app/states.js` (new case needed), `app/src/components/StorageNotice.svelte` | D3's fix (the dismiss button moved from inside `<summary>` to a `.warn`-wrapped sibling of `<details>`) was verified once by eye against a real `dist/` build, not by any gate - jsdom does not implement `<details>`'s native closed-content suppression at all (every vitest test passed against the *wrong*, button-hidden structure the first time), and neither `tests/app/states.js` nor `tests/app/sweep.js` has an existing case asserting the button's visibility/hit-testability while the notice is folded, even though both drive a real Chromium. No permanent test guards against this exact regression recurring. Add a `states.js` case: open `#/lists`, confirm `<details>` is closed, read `.warn-x`'s `getBoundingClientRect()`, assert non-zero width/height (and, ideally, that it is actually clickable). **done `bb20a0d`**: added case 25, `storageNoticeDismissWhileFolded` - opens `#/lists`, asserts `<details>` is closed on arrival, `.warn-x`'s box is non-zero, and `elementFromPoint` at its centre resolves inside `.warn-x` (real hit-testability, not just a non-zero rect). `node tests/run-all.js app/states` green. |

### From B7's review (accessible names, product text, structure)

Verdict **fix-then-continue**. Appended when the review landed, per the
standing rule below. Ids continue this task's scheme: the review's own
`R-1`-`R-4` are `B7-R1`-`B7-R4`, and its `N1`-`N13` are `B7-N3`-`B7-N15`
(`B7-N1`/`B7-N2` were already taken by the two nits found while implementing
B7, above).

**Four blockers are NOT in this table and are NOT B12's** - they go to B7's
own one remediation cycle, per `orchestrate.prompt.md`, "Blockers do not go
to a nit batch". Recorded here only so the register shows they were seen.
All four, plus B7-R3 below (bundled into the same fix for the same reason a
later reader would hit both), are **done `6b50945`** - B7's one remediation
cycle is now spent; see `issues/phase-8/handoff.md`, "B7 remediation".

- **BL-0** (found by CI, not by the review): `docs/fixtures/statlines/equipment.json`
  still holds frame record `f7`'s pre-D11 stat line, so `app/contracts` fails
  in a real browser (`f7/ru`, `f7/en`). `app/src/lib/i18n.test.ts:56` hides it
  by passing `noTier: isFrameRecord(record)`, which is why `npm run check`
  stayed green. CI run `35318680003` on `fa56576`, job `browser (3)`.
  `done 6b50945`: `f7`'s fixture lines updated to the tier-first shape,
  `noTier: isFrameRecord(record)` dropped from the test loop, the fixture's
  header comment notes `f7` as a deliberate D11/Q6 divergence, not a stale
  capture. `node tests/run-all.js app/contracts` reran green (252.1s)
  against the fix.
- **BL-1**: `docs/specs/COVERAGE.md:162-165` documents the
  `expectNoA11yViolations(container, { allow })` parameter this commit deleted.
  `done 6b50945`: rewritten against the current `app/src/test/a11y.ts` -
  nothing is disabled per call any more, `color-contrast` is the only rule
  off, everywhere.
- **BL-2**: `docs/specs/COVERAGE.md:64` asserts the opposite of what shipped -
  it still says `share.ts` passes `noTier: isFrameRecord(it)` and that the
  fixture was recaptured *losing* the tier word.
  `done 6b50945`: rewritten as D11 paid off under Q6 - `share.ts` passes no
  `noTier` argument any more and `f33` gained the tier word.
- **BL-3**: the tier ladder on frame records (`RecordCard.svelte:177`, the
  guard dropped) is visible on **56 frame records** and covered by nothing -
  the only frame record in a golden and in `record.test.ts`'s fixture is `f1`,
  whose `eq.line` is empty.
  `done 6b50945`: `record.test.ts`'s `frames` fixture gained `f2`/`f3`
  sharing an `eq.line`; a new test opens `f2`'s page and asserts the ladder
  renders with both rungs and the tier word on the stat chip, ending with
  `expectNoA11yViolations`. No `inventory.js` state added, per the review's
  own ruling.

| id | where | what |
|---|---|---|
| B7-R1 | `app/src/components/Shell.svelte:105-109`, `SelBar.svelte:75-79` | P10's comment says the bar "is fixed to the bottom of the viewport"; it is `position: sticky`. The z-index half of the argument is right (a positioned `z-index: 45` box paints over the unpositioned footer whatever the DOM order), but a sticky box also has a **flow** position, and that moved from after `<footer>` to before it. Two consequences the recorded evidence cannot see: with a selection the footer is pushed down by the bar's height, and at **maximum scroll** the bar un-sticks *above* the footer instead of resting below it. Both the 1180x900 measurement and `states.js` case 16 measure the unscrolled page - the one position where the difference cannot appear. The plan's own acceptance line asked for the page-bottom overlap at 1180 and 375. Benign either way; the claim is unevidenced and the word "fixed" is what makes it read as proved. **done `bb20a0d`**: `Shell.svelte`'s comment corrected to `position: sticky`; the owed measurement taken (`tests/app/lib.js`'s `fresh()`, a scratch probe, not committed - `#/tables/core_item`, one row ticked, scrolled to `document.body.scrollHeight`): at 1180, page height with no selection 5885px vs 5938px with one (a 53px difference, exactly `.selbarwrap`'s own height there), and at max scroll `.selbarwrap`'s bottom (757.09) sits above `.foot`'s top (777.09), a ~20px gap, not an overlap; at 375, the same shape (bar bottom 617.31, foot top 637.31, ~20px gap). Both widths confirm the comment's claim - the bar rests above the footer, it does not overlap it. |
| B7-R2 | `tests/app/states.js` (case 23, `addToListMenuStaysInModal`) | `ok(scrollTop === 0, ...)` can no longer fail: `RecordCard.svelte:270` changed `.card` to `overflow: clip`, which creates no scroll container, so `scrollTop` is 0 whatever the placement effect does - a stray `scrollIntoView` would scroll the nearest *scrollable* ancestor and this assertion would still pass. The D6 evidence it names (`.card.scrollTop` 109) is not what it measures any more. The real assertion is `inside(menu, card)`. Drop the scrollTop line or replace it with one pinning `:scope > .btn`. **done `bb20a0d`**: replaced with `document.querySelectorAll('.seldrop > .btn').length === 1` - pins that the toggle `AddToList.svelte` itself selects via `:scope > .btn` cannot accidentally resolve to a `.dropmenu` button. |
| B7-R3 | `app/src/lib/i18n.ts:120,126,147` | After B7, `noTier` has **zero production callers** - only `i18n.test.ts:56,75-80` (the old-app parity fixture, which legitimately still needs it). Nothing says so at either site, so a later reader applying `CLAUDE.md`'s "add no variant before something uses it" deletes it and breaks the parity fixture for a reason that takes an hour to find. One clause closes it. Interacts with BL-0's fix. `done 6b50945`: bundled into BL-0's fix (same file, same reader trap) - a clause on `eqParts`'s doc comment names the zero-caller fact and the test that would break. |
| B7-R4 | `app/src/components/ListPage.svelte:1267-1276`, `StorageNotice.svelte` | P12's 44x44 targets overlap editable neighbours: `.note-x::after` extends ~12px beyond a 20px button into the note `<textarea>`; `.warn-x::after` ~3px above the notice box. The `.homebtn` precedent it copies has no editable neighbour. A tap 12px from the cross clears the note instead of placing a caret. Unmeasured, low severity. **done `bb20a0d`**: measured (`tests/app/lib.js`'s `fresh()`, a scratch probe, not committed - 1180x900, real Chromium): `.note-x::after`'s computed 44x44 rect extends **7px** into the note `<textarea>` below it; `.warn-x::after`'s extends **2px** above `.warn`'s own top edge. Both reproduce (smaller than the CSS-only estimate, but present). Per the plan's own instruction, not redesigned and not shrunk below 44px - `docs/specs/DEBT.md` gained `D27` with the measurement, routed to the UI/UX ticket. |
| B7-N3 | `tests/app/lib.js:124-135` | `axe(page, { allow })` is kept "for a future live-shared defect" with no caller - in the same commit whose `app/src/test/a11y.ts` comment argues that a parameter with no caller is a maintained shape for nothing. Pick one: delete it here too, or state why the browser suite differs. **done `e52f5de`, this piece (B12a)** - deleted; `sweep.js:432`'s `axe(page)` was the only caller and passed nothing. |
| B7-N4 | `tests/app/inventory.js:94,142` and `:98,146` | `selected: 'Выбрано'/'Selected'` and `importPh: 'Ссылка на список'/'Paste a list link'` are dead keys - no reader. `pickRow` was deleted in this very batch for exactly that reason. `importPh` is also now wrong: after P6 that field's accessible name is `t.importList`. **done `bb20a0d`**: both keys deleted, ru and en - `git grep` confirmed zero readers for `.selected`/`.importPh` anywhere in `tests/app/` before deleting. |
| B7-N5 | `issues/phase-8/handoff.md` (`### B7`) | The entry still opens "**Not yet committed**", says files are "all currently in the working tree; most already `git add`ed", and calls the Escape test "the one unstaged file". All three are false as of `fa56576`, and the entry's own last bullet contradicts them. |
| B7-N6 | `issues/phase-8/handoff.md` (`### B7`) | No `Review:` line inside the batch entry - it sits in `## Status`. Identical placement miss to `B4-8`, against the rule shipped in `c8cc38e`. |
| B7-N7 | `issues/phase-8/handoff.md` | No `## Verification` section; `.claude/templates/handoff.template.md` has one. The content exists (inside `### B7` -> "Gates run") but not where the template puts it. |
| B7-N8 | `issues/phase-8/handoff.md` (golden category 6) | Category 6 reaches ~40 files, not the three named: frame equipment also sits in `#/tables/eq_weapon`, `eq_armor`, `eq_secondary`, `other_starting`, the `#/search` states and the roll states. The category *text* covers it; the parenthetical examples undersell it by an order of magnitude. |
| B7-N9 | `app/src/components/TablesPage.svelte:84` | `lastTable = route.table as TableId` - the assertion exists only because narrowing is lost inside the `untrack` callback. `const t = route.table;` before `untrack(...)` removes the cast. **done `607b252`**: a `const routeTable = route.table;` before `untrack` removes the cast. |
| B7-N10 | `app/src/components/SectionHead.svelte:26` | `this={'h' + String(heading)}` widens to `string`; `heading === 2 ? 'h2' : 'h3'` keeps the literal union the prop declares. *(taste)* **done `607b252`**: a `Record<2\|3, 'h2'\|'h3'>` lookup used instead of the suggested ternary - a ternary is a branch, and `heading={3}` is never given anywhere in the tree to exercise it (confirmed - `heading={2}` is the only value any caller passes), which would have failed the file's own branch-coverage threshold; a lookup is one computed property read, no branch. |
| B7-N11 | `app/src/components/tables.test.ts` (folded-panel case) | `expect(container.querySelector('.ffilter')).toBeNull()` replaced a role+name assertion with a class probe. `expect(screen.queryAllByRole('button', { name: 'Предметы' })).toHaveLength(1)` keeps it at role level and still disambiguates the pill. *(taste)* **done `607b252`**: replaced exactly as suggested; the now-unused `container` destructure dropped too. |
| B7-N12 | `docs/specs/FEATURES.md:174-183`, `app/src/components/shell.test.ts` | A shared list (`#/l/<payload>`) shows a name on screen but keeps the plain tab title, because the effect keys off `app.openList`. Deliberate and documented, but it is the one case a reader expects to be titled and no test pins the negative. One `shell.test.ts` line. **done `607b252`**: a new `shell.test.ts` case opens a shared-list route and asserts the heading names the list while `document.title` stays plain - new coverage of already-correct, deliberate behaviour, not a behaviour change. |
| B7-N13 | `tests/app/driver.js` (`click`/`press`) | Two ranking edges nothing exercises: (a) with `nth > 0`, `exact[idx]` and `boxExact[idx]` index two *different* arrays, so `click(name, 1)` can silently land on the second checkbox when exactly one exact non-checkbox match exists; (b) a substring non-checkbox match still pre-empts an exact checkbox, so a box whose exact name is a substring of any button's name is unreachable through `click()`. That is why `tick()` exists - one sentence saying "for a checkbox, always `tick()`" stops the next author re-deriving it. **done `bb20a0d`**: both edges and the "always `tick()` for a checkbox" rule added to `click()`'s own doc comment. |
| B7-N14 | `issues/phase-8/handoff.md` (the `npm run check` bullet) | The attempt-by-attempt chronology is session narration; the load-bearing facts (a run past 600s auto-backgrounds and cannot arm the gate; two heavy runs on one tree contend; isolation cleared the two failing files) are already in `context.md`'s "Reasons already disproved". **The D3 first-attempt account is the opposite and must stay** - it is a live trap with the symptom that identifies it. *(never a blocker)* |
| B7-N15 | `app/src/lib/dict.ts` (en) | P14 straightened English quotes but left standalone hyphens in English strings (`droppedItems: 'Skipped %n items - no longer in the data'`) while `noLists` beside it uses an em dash. Pre-existing and outside P14's stated scope. *(taste, `deferred-scope` if B12 prefers)* **done `bb20a0d`**: `droppedItems` (en) now reads "... — no longer in the data", matching `noLists`; checked against `tests/app/snapshots/` first, zero hits (the string carries `%n`, never rendered literally in a golden). |

**Two checks B7's review could not run** (read-only, and B8 was live on the
tree) - they belong to whoever next has the tree:

- `node tests/app/sweep.js 1180`. The `allow` removal was proved at 768, where
  `sweep.js`'s `width === 1180 || lang === 'ru'` guard runs axe on Russian
  only. `nested-interactive` and `heading-order` are language-independent, so
  the risk is low, but the English axe path has not run without the two allows.
- One scroll-to-bottom measurement of `.selbarwrap` and `.foot` with a
  selection at 1180 and 375 (B7-R1) - the measurement P10's acceptance line
  actually asked for.

### From B8's review (record actions, print, motion and focus)

Verdict **fix-then-continue**. Appended when the review landed, per the
standing rule above.

The review **confirmed** B8's two central claims rather than taking them on
trust, and both are worth keeping: no golden *can* have moved (`tests/app/golden.js`
captures the accessibility tree plus the control inventory, no CSS - D1/D18/D20
are CSS-only, R6 adds only handlers, D21's initial value is unchanged `false`,
D13/D22 move no name, role or control; the two `--only=` probes were
belt-and-braces, not the proof), and D1's blanket rule has no correctness blast
radius (no `transitionend`/`animationend`/`getAnimations` consumer anywhere in
`app/src`, no `allow-discrete`/`@starting-style`, every `@keyframes` ends in a
visible state, and the non-reduced-motion path is untouched because the whole
rule lives inside the media query). Print's product law is intact: `fit()` is
byte-identical, nine cards per A4, colour and black-and-white still distinct.

**Three blockers are NOT in this table and are NOT B12's** - they go to B8's
own one remediation cycle, with `B8-R1` and `B8-R2` riding along because both
touch `tests/app/print.js`, which that pass already opens. Recorded here only
so the register shows they were seen. **All five, `done 480c380`** - B8's one
remediation cycle is now spent; see `issues/phase-8/handoff.md`, "B8
remediation".

- **BL-1**: D18 deleted the one `:focus-visible` override that was not
  redundant. `.card-media` (`RecordCard.svelte:345-347`) is a real `<button>`
  flush against `.card`, and `.card` is `overflow: clip`. Its `outline-offset:
  -2px` drew the ring **inside**; the global rule's `+2px` puts it outside the
  button's border box and so outside `.card`'s padding box, clipped on three
  sides. The plan's step 10 said "the five **8px** overrides" - this one was
  not 8px. No instrument here can see it: `sweep.js`'s `focusWalk` reads
  `getComputedStyle().outline`, which still reports a ring an ancestor clips.
  `done 480c380`: the `.card-media:focus-visible { outline-offset: -2px }`
  rule restored with the reason stated inline. Fixed by reasoning, not by any
  gate - no instrument in this repository can see an outline clipped by an
  ancestor (`focusWalk` reads computed style, goldens read structure, axe
  checks neither); a human eye or a screenshot still confirms it, and that
  confirmation is owed, not done here.
- **BL-2**: `RecordActions.svelte:72` now awaits `pngOf` **before** touching
  the clipboard, defeating the gesture rule `ports/clipboard.ts:102-104`
  documents ("the promise is handed to ClipboardItem rather than awaited
  first: Safari drops the user gesture if anything is awaited in between") and
  that the deleted live app followed deliberately. On WebKit the write loses
  transient activation; B8's own new D14 path then silently downgrades the
  copy to a download. Every gate runs Chromium and the fallback masks it, so
  nothing would ever report it. The comment in `clipboard.ts` is now false for
  its only caller, which is the worse half.
  `done 480c380`: `copyImage()` restructured to the reviewer's shape -
  `pngOf`'s promise reaches `writeImage` unawaited, and is only awaited
  afterwards to tell a tainted canvas apart from a clipboard refusal.
  `clipboard.ts`'s comment gained the caller-side half of the invariant.
  The existing D10/D14/D15 tests initially **failed** under the restructure -
  not because the restructure was wrong, but because `fakeClipboard.writeImage`
  ignored its `png` argument entirely and always reported success, which is
  not how the real `browserClipboard.writeImage` behaves. Fixed the fake, not
  the tests, per the dispatch's own instruction: `writeImage` now actually
  awaits `png()` and returns `false` on rejection, mirroring the real port.
  All three tests then passed unchanged.
- **BL-3**: `docs/specs/COVERAGE.md:67` (the `noart` row) still calls "share
  attaches no file" an impossible case that "never passes a file". D22 makes
  `send()` pass one, so the spec is false on both the fact and the reason a
  case was dropped.
  `done 480c380`: the clause replaced with a pointer to `record.test.ts`'s
  "attaches no file for a record with no art" / "attaches the picture where
  there is art" cases; the stale line citation dropped.

| id | where | what |
|---|---|---|
| B8-R1 | `tests/app/print.js:1141` | *(rides B8's remediation)* Asserts `lines === 1`, but owner decision Q2 set the cap at **two** lines and the plan's own wording was "pinning `cm26` at two lines". As shipped it is a change-detector where a cap was asked for: a legitimately longer name, or a data edit lengthening this one within the design's tolerance, fails the browser suite though the layout is correct. `ok(lines <= 2, ...)` with a message naming the two-line cap. Keep the measured "all four at one line, 2026-09-18" fact where it is, in `FEATURES.md` "Print". `done 480c380`. |
| B8-R2 | `tests/app/print.js:1131-1155` | *(rides B8's remediation)* The committed `nameLines()` **is** the P16 measurement (same route, same 1100px, same `getClientRects().length`, both languages, both layouts), so the uncommitted scratchpad script costs nothing for `cm26`. But the route renders `cm26-f60-hi62-ci81` and the helper reads only `cm26`, so "the four longest names all render at one line" rests on a deleted script. Loop the four ids inside the existing `$eval` - two lines, zero extra page loads. `done 480c380`: looped `cm26`/`f60`/`hi62`/`ci81` inside the same `$eval`/`ok` pair. |
| B8-R3 | `app/src/ports/image.ts:45-51`, `RecordActions.svelte` | The 2000 ms `toBlob` watchdog can fire on a slow-but-fine encode, and `copyImage` maps *any* `pngOf` rejection to `imgTainted` - so a contended machine encoding a large source gives the user a tainted-canvas story for a slow encode and silently loses the picture. 2000 ms is defensible for card art; the residual risk is the wording. The code already builds distinct `Error` messages and `copyImage` discards them - name the two causes apart, or raise the watchdog and document the measured encode time. **done `607b252`**: measured the real `toBlob` time on this host against the largest catalogue art file (640x640 `img/f95.webp`, http:// so the canvas is not tainted) - five runs, 1032-1074ms; `image.ts`'s watchdog comment now records the number and keeps 2000ms (roughly double the measured worst case). `RecordActions.svelte`'s `copyImage` now `console.warn`s the caught `Error` (whose message already names which cause) before falling back - `imgTainted`'s user-facing wording unchanged, no new `dict.ts` key. |
| B8-R4 | `app/src/ports/image.ts` (`browserImage().download`), `vite.config.mts` | New code exercised by nothing: no unit test imports `browserImage`, the file is coverage-excluded, and the browser path cannot reach it (`states.js` case 10 runs on a build that taints, so `writeImage` is never reached, let alone refused). The comment updated in the same commit now overstates the exclusion - "exercised for real by `states.js`'s copy-image case" is true of `pngOf`, not of `download`. The plan's step 1 offered "narrow the exclusion **or** add the rejection-path test"; the rejection path got real browser coverage, the download did not. A jsdom test on `download` with `URL.createObjectURL`/`revokeObjectURL` stubbed (asserting the `<a download>` name, the click, and the element's removal), and trim the comment's claim to `pngOf`. **done `607b252`**: `app/src/ports/ports.test.ts` gained `describe('the picture download fallback (D14)')`, stubbing `URL.createObjectURL`/`revokeObjectURL` and `HTMLAnchorElement.prototype.click`, asserting the anchor's `download` name, one click, and its removal from the DOM. `vite.config.mts`'s exclusion comment now says the `states.js` claim covers `pngOf` alone and points at this new test for `download`. |
| B8-R5 | (proof, not a file) | D1 and D18 are **global CSS** reaching every rendered page, but B8's local gates were `app/states`, `app/print`, `sweep 1180` and two golden probes. `app/hues`, `app/typo`, `app/contracts`, `stub`, the other sweep widths and the four golden shards have not run against this tree. Nothing in the review's reading suggests movement (goldens are structure-only; hues reads computed colours, which a 0s transition only stabilises). **CI is the outstanding proof** - check the full browser matrix on the B8 commits or the remediation. **done `e52f5de`, this piece (B12a) - discharged by evidence, not by a re-run** (per `plan.md`'s own instruction not to re-run B8's gates): the `check` workflow (`.github/workflows/ci.yml`, which runs the full four-shard `browser` matrix as part of it) ran green on the state B8 landed at each of three later shas - run `35341735535` (`2d404c7`, the docs commit immediately after B9's own `5602ca9`), run `35344512741` (`56dabbc`, B10's own implementation commit), and run `35350599995` (`78981b2`, the docs commit immediately after B11's own `78b13f0`). All three succeeded; no golden re-record happened between B8 and any of them except B8.1's `addressSettled()` fix and B11's own six-golden update, both accounted for and green. |
| B8-R6 | `tests/app/print.js` (the D20 block, ~line 1280) | `d.seed({'dhloot.lists.v2': ...})` is never cleared, and `driver.js`'s `seed` installs an `evaluateOnNewDocument` handler that survives every later `d.open()`. Harmless today (only the print-link block follows and it reads no lists), but the next person appending to this file inherits a seeded list without knowing - the same class as the viewport leak B8's own handoff documents. Also: the assertion depends on the action toast still being alive, and `say()` gives action toasts 7000 ms - two round trips inside 7 s is comfortable, but it is a real flake budget on a contended host. **done `bb20a0d`**: a comment above `d.seed(...)` names the residual-seed hazard for a later addition to this file, and a comment above the toast assertion names the flake budget - no unseed API exists, so documented rather than "fixed" away. |
| B8-N1 | `app/src/styles/tokens.css:172` | Cites "`docs/specs/DEBT.md`, D1's own history" for a rejected alternative, and the same commit deletes D1. The load-bearing half ("a longer non-zero duration was tried first and rejected for exactly the opposite reason") never says what the opposite reason *was*, so the dead pointer is the only route to it. State the reason inline in one clause, or cite `git show 8e43c92:docs/specs/DEBT.md`. **done `607b252`**: the comment now states the reason inline (a non-zero `transition-duration` still starts a running `CSSTransition` whose value at t=0 is the old one, breaking `fit()`'s synchronous read-back), sourced from `git show 8e43c92:docs/specs/DEBT.md`. |
| B8-N2 | `app/src/lib/dict.ts:84,432` | `imgFailed` now fires only when `download()` throws (the blob already exists), but the wording is "Не удалось получить картинку" / "Could not load the image". The strings are live's own and live's use was broader, so they are inherited rather than invented - but wrong for the only case that can now raise them. "Не удалось сохранить картинку" / "Could not save the image". **done `607b252`**: both strings reworded exactly as suggested; `record.test.ts:648`'s matching assertion updated (its own old string had zero golden hits, confirmed before editing). |
| B8-N3 | `docs/specs/FEATURES.md` (Chrome section) | "Every focusable control gets the same gold keyboard-focus ring, **at one radius (`--r-sm`)**" is not true as built: a component's own scoped `border-radius` outranks the unscoped global rule, so `.seg button` keeps 999px - correctly. Drop "at one radius", or say the radius follows the control's own. |
| B8-N4 | `tests/app/states.js:346` | "which is what made this invisible before **B12**" cites a first-plan batch id; this work is B8. Stale, and that clause narrates the session rather than the code. The rest of the comment block earns its keep - the Chromium `toBlob` behaviour is a live trap. **done `bb20a0d`**: "before B12" corrected to "before B8". |
| B8-N5 | `tests/app/print.js:1131-1155` | Same edit as `B8-R2`; listed there. |
| B8-N6 | `app/src/styles/tokens.css` (D1's rule) | *(deferred-scope)* The rule zeroes `animation-duration`/`transition-duration` but not `animation-delay`/`transition-delay`, so a delayed animation still waits under `reduce`. Nothing in the tree uses a delay today, so this is cheap insurance, not a defect - and the plan specified these four declarations and the owner approved them, so changing it is a policy edit, not a fix. **Moved to Deferred, this piece (B12a)** - policy edit to an owner decision, no `DEBT.md` entry; see "Deferred out of phase-8". |
| B8-N7 | `app/src/components/TablesPage.svelte:444` | *(deferred-scope)* `scrollIntoView({ behavior: 'smooth' })` overrides CSS `scroll-behavior` per spec, so D1's `scroll-behavior: auto !important` does not reach it: the one real smooth scroll in the app still animates under `prefers-reduced-motion: reduce`. `TablesPage` is outside B8's file list. One-line fix when someone next opens that file - pick the behaviour from a `matchMedia('(prefers-reduced-motion: reduce)')` read. **Moved to Deferred, this piece (B12a)** - needs a new `app/src/ports/` surface; `DEBT.md` entry `D26` lands in `B12b`; see "Deferred out of phase-8". |
| B8-N8 | `issues/phase-8/handoff.md` | *(deferred-scope, duplicate of `B7-N7`)* No top-level `## Verification` section (`.claude/templates/handoff.template.md:19`); each batch entry carries its results inline instead. Pre-existing for the whole file, not introduced by B8. **Size**: 138,821 B against `session-stop.mjs`'s 150 KB warn threshold - B9's entry will trip it, so `/handoff` compaction is due. |

**One check this review names that nothing in the repository can perform**:
after BL-1, confirming `.card-media`'s ring is drawn inside `.card` at both
`.full` and `.compact` needs a human eye or a screenshot. `focusWalk` reads
computed style, goldens read structure, axe checks neither - none of them sees
an outline clipped by an ancestor.

### From B8.1's review (the harness lost its settle instrument)

Verdict **fix-then-continue**. The one blocker, four folded nits, and one
factual-record correction below are **done in this commit** (B8.1's own
remediation cycle); everything else in this section is B12's, per this
task's "nits are processed immediately" policy not applying mid-plan the way
`orchestrate.prompt.md`'s default does (`context.md`, "Review and nit policy
for this task").

- **BL-1**: `docs/specs/COVERAGE.md`'s gate rule required only "at least one
  `--shard=n/4` run", which `--shard=1/4` alone would have satisfied even
  though B8's three failures fell one each in shards 2, 3 and 4 - the rule as
  written would have shipped the exact defect it exists to prevent.
  Done: rewritten to require all four shards (or `--only=` probes reaching
  every route kind the change can touch), with the shard-2/3/4 counterexample
  cited in the rule's own text so it cannot be re-weakened unread.
- **NIT-1**: `tests/app/driver.js`'s `addressSettled()` doc comment claimed an
  app that never writes the address "is quiet from the very first read, so
  this returns at once" - false; `lastChange` initialises to `start`, so the
  helper always pays one full quiet window before returning, whether or not
  the address ever changes. The no-masking property holds because the wait is
  bounded, not because it is skipped.
  Done: comment rewritten to say what is true - it returns after one quiet
  window having waited for nothing when nothing was pending; it waits only
  for a write landing within `quiet` of the call; a later write is missed and
  the golden then fails red on content, same as today.
- **NIT-2**: `tests/app/driver.js` (`settle()`'s doc comment) - "so the wait
  above resolves immediately" pointed at the `getAnimations()` race, which
  sits below the comment, inside the function body.
  Done: "the animation wait below".
- **NIT-3**: `tests/app/golden.js` - the comment explaining the `timed`
  branch's `addressSettled()` call sat above `const oneLang = ...` rather
  than at the call site, reading as if the ordinary branch five lines up were
  its antecedent.
  Done: moved to sit directly above the call, inside `oneLang`.
- **NIT-4**: `tests/app/golden.test.mjs`'s coupling regex,
  `/function scheduleUrlSync[\s\S]*?\}, (\d+)\);/`, was unbounded past
  `scheduleUrlSync`'s own function body - a literal-to-named-constant refactor
  would walk on to the next `}, <digits>);` anywhere later in the file
  (silently wrong), and a second `setTimeout` earlier in the same function
  would take the first match (also silently wrong); only the absence of any
  other such literal in `ListPage.svelte` kept it from biting today.
  Done: the match is now bounded to the function body
  (`/function scheduleUrlSync[\s\S]*?\n  \}/`, verified against the file
  before relying on it - the function is at 2-space indent, its closing brace
  is the first `\n  }` after the opener), plus an assertion that the body
  contains exactly one `setTimeout`. Proved to actually bite: each of the
  three refactor cases (a Prettier-style split call, the literal replaced by
  a named constant, a spurious second `setTimeout` earlier in the function)
  was made in the working tree and each failed the test loudly with a
  distinct message, then reverted by hand (`git diff --stat -- app/src`
  empty afterward - `git checkout`/`restore` are refused by the bash-guard
  hook while `issues/56/`, another task's untracked directory, sits in this
  same tree).
- **NIT-9** (`issues/phase-8/handoff.md`): `Review:` read "not required (no
  trigger fired)" for B8.1 in both `## Status` and the `### B8.1` Completed
  entry, while the same entries describe a worker-reported deviation (the A6
  gate's `app/states` finding) - a listed trigger in `orchestrate.prompt.md`.
  A review did in fact happen (this one); the record was wrong, not the
  policy.
  Done: both locations now read `required (trigger: worker reported
  deviation from plan)`.

The review also confirmed both of B8.1's central claims independently rather
than taking them on trust: the fix and its gates are sound (all four golden
shards compare clean, the coupling test bites, no `app/src/**` or
`tests/app/snapshots/**` file touched), and the `app/states` case-10 failure
A6 found is a real, pre-existing, unrelated regression rather than host
contention - both matching what the implementer's own handoff already
recorded.

| id | where | what |
|---|---|---|
| B8.1-R1 | (verified reasoning, no action) | The "never returns at once" finding (NIT-1's root cause) - confirmed by reading `addressSettled`'s loop: `lastChange` starts at call time, so `now - lastChange >= quiet` cannot be true on the first iterations regardless of the address. |
| B8.1-R2 | (verified reasoning, no action) | The `cap` throw is effectively unreachable in practice and, if it ever fires, is not the real truncation risk - a late write inside `cap` but outside the golden's own patience fails the comparison red on content, which is the intended, loud failure mode, not a silent one. |
| B8.1-R3 | (verified reasoning, no action) | The ~208ms margin `addressSettled()`'s wait leaves before the shortest toast lifetime (1600ms) is adequate today but does not scale with a slower host; the 111-119s per-shard times recorded in this batch's own gate run are D1 removing animation waits (B8), not evidence of contention on the machine that ran B8.1's gates. |
| B8.1-R4 | (verified reasoning, no action) | The timed states' toast margin shrank roughly 25% under this fix (capture now lands ~380-560ms into a 1600ms toast lifetime, versus before); documented in `golden.js`'s own comment, and the failure mode if it is ever too tight is loud (a missing toast), not silent. |
| B8.1-R5 | (verified reasoning, no action) | Scoping `addressSettled()`'s call to goldens only, not to every suite sharing `driver.js`, is the right call - with one residual: `tests/app/contracts.js:37-38` reads an owned-list address immediately after `d.open()` and passes only because `ready()`'s own wait happens to already exceed 150ms, not because anything there asserts settlement. See B8.1-N... below (routed as NIT-7). |
| B8.1-R6 | (verified reasoning, no action; closed by NIT-4) | The coupling assertion (`golden.test.mjs`) proves `URL_DEBOUNCE_MS` equals whatever number the regex extracts, not that the regex extracted the right one - it proves the comparison, not the extraction. NIT-4's bound and setTimeout-count assertion close the extraction half. |
| B8.1-N1 | (taste) | Nothing guards the *call sites* of `addressSettled()`: deleting `await d.addressSettled()` from `golden.js` would reintroduce the original defect with no unit-level signal, only intermittent red golden shards on an owned-list route. |
| B8.1-N2 | `tests/app/states.js:838` | *(deferred-scope)* Still justifies the reduced-motion emulation with the parity-era "timing out the pixel comparisons" reasoning this batch's own `prepare()`/`settle()` comment fixes retired. The fourth stale cross-reference of that family found across phase-8. **done `bb20a0d`**: case 24's comment now points at `driver.js`'s own current `prepare()` reasoning (D1 is shipped behaviour, not a timing convenience) instead of the retired one. |
| B8.1-N3 | `tests/app/contracts.js` (before its hash read, per B8.1-R5) | *(deferred-scope)* Add `await d.addressSettled()` before the owned-list hash read at `:37-38`, so the pass stops resting on `ready()`'s wait happening to already exceed 150ms. **done `bb20a0d`**: added, with a comment explaining why. |
| B8.1-N4 | `docs/specs/COVERAGE.md` | The three B8.1-inserted paragraphs (the coupling-assertion note, the gate rule, the capture-wait note) sit between the pre-existing `golden.test.mjs` paragraph and a line whose "those fixtures" antecedent is the fixture table far above (`:243-245`), not anything adjacent. `plan.md` step 7 pointed at the `app/golden` table row or "Known thin spots" as candidate homes; neither was used. Considered moving the block now (it is BL-1's own paragraph and this pass is already in the file) - not done: the `app/golden` row is one dense table cell and "Known thin spots" is a bulleted list, so landing prose paragraphs in either is a format change beyond a nit-sized edit, not a cheap, clearly-right move. Recorded for B12 instead. |

### From B9's review (language and format: `tests/` and `tools/`)

Verdict **fix-then-continue**. Two blockers (B9-BL-1, B9-BL-2) and the
record corrections B9-N1/N2/N7/N8/N9 plus B9-N4 were sent to a remediation
pass; everything else in this section is B12's. The reviewer ran no heavy
gate by dispatch (B10's implementer held the tree), so every measurement
below is from `git show`/`git archive` against committed shas and from
`npx eslint` runs in a scratch directory outside the repository.

**Both blockers and all six record corrections are `done 0686bb6`** - B9's
remediation cycle is now spent; see `issues/phase-8/handoff.md`, "B9
remediation".

- **B9-BL-1**: `eslint.config.mjs:24-25`'s ignore-pattern pair
  (`'.claude/**'` + `'!.claude/hooks/**'`) never actually un-ignored the
  hooks - `.claude/**` prunes the directory itself before the negation can
  apply, so the nine hook files stayed lint-dead and the commit's only
  claimed coverage gain from that half was inert. Confirmed independently
  before dispatch (`npx eslint .claude/hooks/tree-key.mjs` returned "File
  ignored because of a matching ignore pattern") and three other
  formulations tried and rejected, all still ignored.
  `done 0686bb6`: fixed to `'.claude/*'` + `'!.claude/hooks'` - `npx eslint
  .claude` now lints exactly the nine hook files (`bash-guard`,
  `check-observer`, `edit-followup`, `edit-guard`, `lib`, `selftest`,
  `session-start`, `session-stop`, `tree-key`), zero errors/warnings, and
  `.claude/worktrees/` stays pruned. The three records asserting the
  widening as already-done (`plan.md`'s B9 entry, `handoff.md`'s B9
  Completed entry) were corrected in place; `d660ce7`'s commit message
  overstates and, being history, was left uncorrected with a note pointing
  at the correction of record.
- **B9-BL-2**: `eslint.config.mjs:178`'s
  `@typescript-eslint/no-unused-vars: 'off'` stood as a blanket off for
  three real findings (`tests/app/states.js:154`'s dead `page` destructure;
  `tools/check-site.test.mjs:79,112`'s destructure-to-drop-a-key idiom) -
  two of which are exactly what the rule's own `^_` options exist for and
  the third a one-token deletion.
  `done 0686bb6`: rule re-armed as `'error'` with
  `{ argsIgnorePattern: '^_', varsIgnorePattern: '^_',
  caughtErrorsIgnorePattern: '^_' }`; `page` dropped from the
  `twoFramesPicked` destructure in `tests/app/states.js:154` (unused for
  the rest of the function - the case drives everything through `d`).
  `npx eslint .` clean afterward.
- **Record corrections, all `done 0686bb6`**: the acceptance-grep table's
  missing `tests/app/typo.js` row (9 lines, all (b)) added to
  `handoff.md`; the commit-4 verification bullet's wrong "141 across 15
  files" restated as "259 findings across 34 files" with the full
  per-rule breakdown; the stale `d882707`/`5602ca9` Status and Notes
  wording from B9's own handoff text was checked against the current file
  and found **already superseded** by B10's own routine Status rewrite (a
  "replace, never append" section) - no separate edit was needed there,
  verified rather than silently skipped; `tools/build-share-pages.js:150`'s
  redundant comment (a duplicate of line 149's already-English fact)
  deleted.

| id | where | what |
|---|---|---|
| B9-R1 | (risk, recorded) | The pre-compaction plan's commit-4 step was "`npx prettier --write tests tools` **and the lint fixes**" (`git show d882707:issues/phase-8/plan.md`, `c0ff1d0`'s parent). What shipped is eight rule turn-offs *instead of* the lint fixes - a third deviation, unrecorded alongside the two that were. Not hidden (each turn-off carries a rationale in the config), but the substitution is standing policy where the plan authorised only a `disableTypeChecked` block. |
| B9-R2 | `eslint.config.mjs:184-191` | Four code-rule turn-offs suppress **11 real findings**, and the written rationales enumerate only 6 of the 11 sites. Measured: `no-regex-spaces` 5 (`tests/derived.js:798,819,821,841`; `tests/app/golden.test.mjs:231` - rationale names derived.js only); `preserve-caught-error` 3 (`tools/artwork/run.mjs:124`; `tools/tg-preview/run.mjs:47`; **`tests/app/driver.js:369`** - rationale names the first two); `@typescript-eslint/no-extraneous-class` 2 (`tools/capture-share-fixture.mjs:97`; **`tests/app/driver.js:859`** - rationale names the first); `no-useless-assignment` 1 (`tools/tg-preview/live.mjs:75` - correct). None is a live defect. Reviewer's per-rule recommendation: `no-regex-spaces` narrow or fix (` {2}` is byte-equivalent for the ci.yml indentation regexes); `preserve-caught-error` prefer three inline disables or `{ cause }` over a directory-wide off, because a *new* catch/rethrow in `tests/`/`tools/` will now pass silently; the other two are 3 lines total, prefer the fix. |
| B9-R3 | (verified sound, no action) | The three structural turn-offs should stand unchanged: `no-console` (118 findings - every suite's reporting mechanism; the repo rule at `eslint.config.mjs:44` is a browser-bundle policy), `@typescript-eslint/no-require-imports` (60 - all in `.js` CommonJS suites), `@typescript-eslint/explicit-module-boundary-types` (67 - all in `tools/**/*.mjs`, untyped JS with no annotation to write). |
| B9-N3 | `tests/ok.js:1` and `tests/contracts.js:23-28` | The new module's comment names four users - "derived, dataint, craft, contracts" - but `contracts.js` still carries its own identical inline copy (`let fail = 0; const ok = ...`). Either wire it to `./ok.js` (6 deleted lines; it already ends `process.exit(failed() ? 1 : 0)` in the same shape at `:116-117`) or drop `contracts` from the comment. Reviewer prefers the former - `CLAUDE.md`'s "remove both inline copies". |
| B9-N5 | `eslint.config.mjs:184-191` | The per-rule rationale comments name a subset of the sites they cover (see B9-R2's table). A later reader greps the named file, finds it clean after a fix, and deletes a turn-off that is still load-bearing elsewhere. Enumerate every site per rule. |
| B9-N6 | `eslint.config.mjs:145-152` | The block justifies itself by "lines this same commit's own acceptance line requires untouched (`git diff -w --stat` empty ...)" - the acceptance line this very batch records as **unmet and the wrong instrument**. A standing config should not rest on a retracted criterion. Re-word to the durable reason (pre-existing patterns, enumerated sites). |
| B9-N10 | `issues/phase-8/context.md:165` | The deterministic-regression table's header reads ``| state | expected (`было`) | actual on CI (`стало`) |``. `golden.js` now prints `want:`/`got:`, so a session following that record greps for a word the tool no longer emits. One word per header cell. *(deferred-scope: task record, mid-plan)* |
| B9-N11 | `eslint.config.mjs` | `@typescript-eslint/no-require-imports: 'off'` could be narrowed to a `files: ['**/*.js']` block - all 60 findings are in `.js`, so a future `.mjs` tool reaching for `require` would still be caught, at no cost today. *(taste)* |

**Verified sound in B9's review, recorded so it is not re-derived:**

- **The Prettier-reproduction proof is real, reproduced independently.**
  `git archive 6b3f0eb tests tools` and `git archive d660ce7 tests tools`
  into two scratch directories outside the repo, both formatted with the
  repo's own Prettier and `.prettierrc`: `diff -rq` between the trees is
  **empty**, 154 files each. Commit 4 is Prettier's output and nothing else.
  The unmet `git diff -w --stat` acceptance line is correctly recorded as
  unmet and is not re-raised.
- **No product literal moved, proved mechanically.** Token-level comparison
  of every `.js`/`.mjs` under `tests/` (minus `snapshots/`) and `tools/`,
  `d882707` vs `2d404c7`, strings elided and comments stripped: the only
  structural changes in the whole batch are the `ok.js` extraction in
  `craft.js`/`dataint.js`/`derived.js` and two regex literals in
  `golden.test.mjs` (the disclosed coupling update). Every other regex
  literal is byte-identical, including `print.js`'s `/ОРУЖИЕ/i`, `/БРОНЯ/i`,
  `/АРТЕФАКТ/i` family, `craft.js:47,67,98`, `dataint.js:279` and
  `derived.js`'s `footBefore`/licence/step-word regexes. Selector, route, id
  and storage-key literal multisets: zero removals, one addition (`./ok.js`).
- **H16 is safe.** `tests/run-all.js:247` spawns each suite as its own
  `process.execPath` child, so `tests/ok.js`'s module-level counter cannot be
  shared across suites; all three consumers end `process.exit(failed() ? 1 : 0)`
  and no stray `fail` reference survives.
- **The acceptance grep re-derives exactly**: 14 files, 395 Cyrillic lines,
  per-file counts matching the handoff's table once `typo.js` (9) is added.
  All 24 remaining Cyrillic-bearing *comment* lines were classified by hand:
  every one is an English sentence quoting a product term.
- The plan's "every browser suite's green run before and after" was met by
  the Gates list (nine pooled suites + `sweep.js 390` + `golden --shard=2/4`)
  rather than literally. Exposure is limited to failure-path strings in the
  unrun suites, and the reviewer's grep closes it: no Russian (a) message
  remains anywhere in the tree. No action needed.

### From B10's review (the record-modal host)

Verdict **fix-then-continue**. Two blockers (B10-B1, B10-B2) and B10-N6 were
sent to a remediation pass; B10-N1..B10-N5 below are B12's. The reviewer ran
no heavy gate by dispatch (B9's remediation held the tree), so every finding
is from the commits (`56dabbc`, `506a6ba`) plus cheap read-only greps.

**Both blockers and B10-N6 are done `bfea223`** -
B10's one remediation cycle is now spent; see `issues/phase-8/handoff.md`,
"B10 review remediation".

- **B10-B1**: `issues/phase-8/handoff.md`'s "B10's own verification" recorded
  `git grep -c "let open = \$state<Record_" -- app/src` as "no matches
  (acceptance line 1)" - a recorded acceptance result that does not
  reproduce. Re-run, it returns **two** matches, both in
  `app/src/components/RecordHost.svelte` - the host's own declaration and
  its header comment quoting it. The acceptance line's *intent* is met
  perfectly: no page owns its own `open` any more, and `git grep -l` returns
  `RecordHost.svelte` alone - but the handoff recorded a green on a command
  that anyone can falsify in one second, in a file whose own text invokes
  this task's standing rule against unverified verification claims. The
  exact failure mode this phase has now found three times.
  done `bfea223`: the false line replaced with the
  command's true result (`app/src/components/RecordHost.svelte:2`) and its
  reading, in place.
- **B10-B2**: the batch's one behaviour change ships with zero coverage.
  `app/src/components/RecordHost.svelte:44-49` puts the close-on-navigation
  effect on eight pages; six of them (`AltPanel`, `ListPage`, `RecordPage`,
  `RollPanel`, `SharedListPage`, `StdPanel`) never had it. No test anywhere
  opens a modal and then navigates - every existing modal-close test
  (`searchPage.test.ts:295`, `roll.test.ts:246,260,268`,
  `record.test.ts:744,764`, `sharedListPage.test.ts:354-358`,
  `listPage.test.ts:846`) closes it via the close button or the backdrop.
  The effect's lines are covered because it runs once on mount, so
  `perFile` coverage cannot see this hole.
  done `bfea223`: one jsdom test added,
  `app/src/components/record.test.ts` ("closes on a real navigation, but a
  filter pick or a list mutation would not (RecordHost, C6)") - opens the
  record modal on `#/i/q1`, drives a real `router.navigate()`-shaped
  navigation (the `app.navigations`-bumping kind - `app.navigations` bumps
  on `go()` and on an external hash change only, never on `replace()`),
  asserts the dialog is gone. Proved to bite: the effect's body was
  temporarily swapped for a no-op, the new test failed on exactly that
  assertion, then reverted (`git diff --stat --
  app/src/components/RecordHost.svelte` empty afterward).
- **B10-N6**: `docs/specs/FEATURES.md:229-233` described the record modal
  but said nothing about what closes it beyond the user's own action;
  `STATE.md:89` lists `modal` under UI memory with no lifetime rule. No
  spec claim was false, but B10 is the commit that made the rule app-wide,
  and a test asserting undocumented app-wide behaviour is half the job.
  done `bfea223`: one sentence added near
  `FEATURES.md:229` - a real navigation closes the modal, a filter pick
  (which rewrites the address with `replace()`) does not.

| id | where | what |
|---|---|---|
| B10-N1 | `app/src/components/RecordHost.svelte:9-18` | A load-bearing rejected alternative was deleted rather than moved. `TablesPage.svelte:105-121` at `56dabbc^` carried: "Route strings cannot tell one table from another on their own - they all read `tables` - which is why a hash-only move needs this signal rather than `app.hash` itself." Most of the surrounding rationale survives at the definition (`app.svelte.ts:136-145` says `go()` counts, `replace()` does not, and names "an open modal" as a watcher), but the `app.hash` rejection and its reason are now nowhere in the tree. One sentence back into `RecordHost.svelte`'s header comment. **done `607b252`**: the header comment gained a paragraph naming both the rejected alternative and why (a table-to-table move via a filter pick uses `replace()`, which changes `app.hash` too, so the address alone cannot tell that apart from a real navigation). |
| B10-N2 | `app/src/components/RecordHost.svelte:36` | `extra`'s return type is wider than anything can produce: `extra?: ((it: Record_) => readonly ShareBlock[] \| undefined) \| undefined`. `entryNoteBlock` (`app/src/lib/share.ts:200`) returns `ShareBlock[]` and never `undefined` - `share.test.ts:247-248` pins that it returns `[]` for an entry with no visible note. The `\| undefined` on the *return* is dead: `extra?.(open)` already yields `\| undefined` from the optional call, which is what `RecordModal`'s `extra?: readonly ShareBlock[] \| undefined` wants. Narrow to `((it: Record_) => readonly ShareBlock[]) \| undefined`. The prop being a *function* rather than a value is the right call and should not change - the doc comment at `:31-35` gives the reason. **done `607b252`**: narrowed exactly as suggested; the one caller (`ListPage.svelte`'s `entryNoteBlock` wrapper) confirmed to match. |
| B10-N3 | `app/src/components/RecordHost.svelte:28` | `index: Index \| null \| undefined` is wider than any caller. Seven callers pass `const index = $derived(app.index)`, typed `Index \| null` (`app.svelte.ts:111`); the eighth (`SharedListPage`) passes a non-nullable `Index`. Nothing can pass `undefined` and the prop is not optional. Narrow to `index: Index \| null`. **done `607b252`**: narrowed exactly as suggested. |
| B10-N4 | `app/src/components/ListPage.svelte:684,706` | Nested hosts on the shared-list route: `ListPage` opens `<RecordHost>` at `:684` and renders `<SharedListPage>` inside it at `:706`, which opens its own. Two `open` states and two navigation effects are alive on `#/l/<payload>`; the outer one can never be set, because `SharedListPage` uses its own host's `openRecord`. Harmless today, and harmless even if `metaOf` were reached there (`ListPage.svelte:239-241` returns `{}` when `own` is null, so `extra` would return `[]`). But the invariant that keeps it harmless - "nothing passes the outer `openRecord` into `SharedListPage`" - is invisible and easy to break. Either one sentence recording it, or move `ListPage`'s `<RecordHost>` inside the `{:else}` branch so the shared route never mounts two. **done `607b252`**: took the sentence, not the structural move, per `plan.md`'s own decision - a comment above `<SharedListPage>` records the invariant and what would break it. |
| B10-N5 | `app/src/components/{StdPanel,AltPanel,RollPanel}.svelte` | The batch's "none fell out clean without a new prop" claim is under-argued for the three roll panels. Their `{#snippet cardOf(...)}` blocks are byte-identical apart from `it={pick.it}` and two **existing** `RecordCard` props being forwarded (`col={pick.col}`, `rollLabel={pick.n}`) - so the batch's own stated criterion does not actually rule the extraction out, and three copies is well past `CLAUDE.md`'s "extract shared UI on its second real use". Against it: `plan.md`'s "do not over-extract", and a fourth prop (`{#key}` or not) would have to be threaded. The reviewer would not reopen B10 for this, but the rejection and its three-way comparison should be written down, or it will be re-derived by whoever reads `AltPanel` and `StdPanel` side by side. **done `607b252`**: written down once, at `StdPanel.svelte`'s own `cardOf` snippet (the two real variances, and `RollPanel`'s different single-result shape); `AltPanel.svelte` and `RollPanel.svelte` each carry a one-line pointer to it rather than a second copy of the essay. |

**Verified sound in B10's review, recorded so it is not re-derived:**

- **No caller loses a legitimately-open modal.** `app.navigations` fires on
  `go()` and on an external hash change only (`app/src/state/app.svelte.ts:312`,
  `:460`); `replace()` never touches it and `#expectHash` (`:307`) already
  de-duplicates `go()`'s own echo.
- **`ListPage` was the sharpest suspect and is immune**: `app.syncListUrl`
  (`app.svelte.ts:562-568`) writes the packed list with `replace()`, so
  mutating a list while the modal is open - including adding the open record
  to a list from inside the modal - does not bump `navigations`. The 150 ms
  debounce (`ListPage.svelte:141-146`) is likewise invisible to the effect.
- **No in-modal add can navigate**: `AddToList`'s single `app.go()`
  (`AddToList.svelte:148`) is gated on `key === N_SHARED`, and inside the
  modal `AddToList` is always `key={it.id}`. The other three `app.go()` call
  sites in `app/src/components` are unreachable while the modal has the page
  inert (`showModal()`).
- **`RecordPage` is an improvement, not a loss.** On `#/i/a`, opening the
  tier-ladder rung for `b` and clicking the modal's own name link goes to
  `#/i/b` without remounting `RecordPage`. Before B10 the modal stayed open
  showing `b` over a page that had just become `b` - the same card twice.
  Same reasoning for `#/lists/a`->`#/lists/b` and `#/l/p`->`#/l/q`.
- **First mount is a no-op**: the effect assigns `open = null` when `open` is
  already `null`, and `untrack` (`RecordHost.svelte:46`) stops it
  re-triggering itself.
- **`ListPage` already set the precedent**: `ListPage.svelte:203-209` (D23)
  clears `lsel` on `app.navigations` for exactly the "same route kind, no
  remount" case.
- **All eight swaps are faithful.** Focus handling, restore, Escape, backdrop
  close, the `app.menuFor = ''` fold ahead of `onclose` and scroll/inert
  behaviour all live in `RecordModal.svelte`, untouched. Two per-site quirks,
  both no-ops: `SharedListPage` alone rendered `{#if open}` without
  `&& index` (its own `index` prop is a non-nullable `Index`, and it mounts
  only once `app.index` is confirmed), and `RollPanel` alone passed
  `index={app.index}` to the modal while passing `shown.index` to the card
  (in that file `const index = $derived(app.index)` - same value).
- **Moving `AltPanel`/`StdPanel`'s `{#snippet cardOf(...)}` inside the
  `children` snippet moves no DOM and no style** - a snippet emits no wrapper
  element and CSS scoping is per component file, not per snippet.
- **The golden claim's falsifiable half checks out**:
  `git show --stat 56dabbc -- tests/app/snapshots` returns nothing - not one
  golden file changed in the commit.
- **Coverage is real, not linter-shaped**: `vite.config.mts:170-186` sets
  `perFile: true` over `src/**/!(Button|DiceBar|Badge).svelte`, so
  `RecordHost.svelte` cleared a per-file bar rather than merely being named
  `COVERED`. Its **open** state is reached under axe by `a11y.test.ts`'s
  first `STATES` entry (`:132-136`) and by "the record modal over a table"
  (`:198-201`).

### From B11's review (equipment apostrophes)

Verdict **fix-then-continue**, with nothing for B11's implementer to
remediate: the data edit, the generated artefacts, the six goldens and the
public-contract claim all replicated exactly, and this is the **first batch
record this phase that carried no claim failing to reproduce**. The two
blockers and R-1 below are new work, not fixes to what B11 wrote, and were
dispatched to B12 as **named acceptance lines, not as nits** - see the note
under "Outstanding" about blockers never being demoted into a nit batch.
They are listed here for the record, already routed.

**All three, done `e52f5de`, this piece (B12a)** - `search.test.ts:143-151` re-points
the case at the query side and is proved to bite (deleted `search.ts:71`,
watched the case fail with `AssertionError: expected [] to include 'q80'`,
restored, `git diff --stat -- app/src/lib/search.ts` empty afterward);
`tests/dataint.js:52-72`'s text-hygiene loop gained the apostrophe
assertion over all four fields, proved to bite against a fabricated record
(`FAIL zzTEST.en: typographic apostrophe`, never against the tree's own
`data.js`); `tests/app/lib.js` gained both halves of the stale-`dist/`
guard with all six proof results recorded in `handoff.md`, "Verification".

| id | where | what |
|---|---|---|
| B11-BL-1 | `app/src/lib/search.test.ts:143-146` | *(routed to B12 as an acceptance line)* B11 removed the last live U+2019 from `data.js`, so the repository's **only** apostrophe test stopped biting: `q80`'s `en` is now ASCII, the query is ASCII, and `foldQuery`'s `.replace(/[’ʼ]/g, "'")` (`app/src/lib/search.ts:71`) is an identity transform on both sides. That line could be deleted today and the test would still pass; line coverage stays 100% because the `.replace` still executes, which is why `npm run check` stayed green. The folding must stay - iOS/macOS autocorrect turns a typed `'` into U+2019 on the **query** side - B11 simply inverted which side needs it. Fix: type the typographic form against the now-ASCII record and re-point the comment at the query side. Prove it bites by deleting `search.ts:71` and watching it fail. |
| B11-BL-2 | `tests/dataint.js:52-72` | *(routed to B12 as an acceptance line)* B11 fixed a data defect and added no invariant, so the next equipment ingest re-introduces O2 silently - the source book uses typographic apostrophes. `dataint.js`'s text-hygiene loop already iterates `['en','ende','ru','rud']` per record with sibling rules of the same shape (`markdown markup in the text`, `broken character`, `double space`) and runs inside `npm run check` in 0.7 s. One assertion in that existing loop closes it: `ok(!/[’ʼ]/.test(v), x.id + '.' + k + ': typographic apostrophe')`. All four fields pass today (`data.js` holds zero U+2019 and zero U+02BC; the Russian text uses `«»`), so it can cover the whole loop; gating it to `en`/`ende` is also defensible to stay strictly inside Q8's decided scope. B12 states which it chose. |
| B11-R1 | `tests/app/lib.js:20-23`, `docs/specs/COVERAGE.md:358-367` | *(routed to B12 as an acceptance line)* **The stale-`dist/` trap.** `tests/app/golden.js` compares captures against `dist/` (its header comment, `:5`) and `tests/app/lib.js:20-23` guards only that `dist/index.html` *exists*. `npm run check`'s `npm run data` regenerates `data.json`/`catalog.csv`/`i/` but never runs `vite build`, so `dist/` can lag the tree arbitrarily; a `--update` run against a lagging `dist/` re-records the **old** render and the following verification run prints `structural snapshots (dist/): unchanged`. Same failure class as B8.1's lost settle instrument - a green run that measures nothing. It hits `app/sweep`, `app/states`, `app/print`, `app/typo`, `app/hues` and `app/contracts` identically; they all drive `dist/` through the same `lib.js`, so the guard belongs there, once, not in seven suites. Reviewer's minimal fix, fail-closed, both halves: (1) byte-compare `data.js`, `data.json`, `catalog.csv` against their `dist/` copies (~1.3 MB, milliseconds); (2) compare `mtime` of `dist/assets/app.js` against the newest `mtime` under `app/src` plus `index.html` and the vite config (safe on CI - checkout sets source mtimes, the build follows). On mismatch print `dist/ is stale - run npm run build first` and `process.exit(1)`. Then one sentence in `COVERAGE.md`'s existing "gate rule for 'no golden moved' (issues/phase-8, B8.1)" paragraph. Explicitly **not** `.claude/README.md` - that file costs runs, not correctness, and a third copy of the rule is a third thing to drift. |
| B11-N1 | `docs/specs/FEATURES.md:69-70` | The search-folding bullet illustrates the apostrophe fold with ``soldier's` finds "Soldier's"` - both spellings written ASCII in the spec, and after B11 the catalogue side is ASCII too, so the example demonstrates nothing (`Soldier's Pike` is one of the 28 records B11 normalised). The same vacuity as B11-BL-1, in the spec rather than the test. Re-point it at the query side and write the U+2019 in the spec so the example is legible as an example. |
| B11-N2 | `tests/app/inventory.js:150-151` | `sharePlayers: 'Players’ link'` carries the comment "A curly apostrophe, the way the live app prints it - not a plain one." False since B7/P14: `app/src/lib/dict.ts:624` is `"Players' link"` (ASCII). No state consumes `sharePlayers` today (only the two definitions, ru `:102` and en `:151`), so nothing fails - it is a latent trap: the first English state that grips that button gets a "button missing" failure while the comment actively vouches for the wrong spelling. Straighten the value, delete or invert the comment. **done `bb20a0d`**: value straightened to `"Players' link"`, comment inverted to say plain, not curly, and now cites P14/B7 as the reason. |
| B11-N3 | `app/src/lib/help.ts:544` + `tests/app/inventory.js:151` | **A coupling constraint on the existing B7-N1**, not a new nit. B7-N1 asks that `help.ts:544`'s `{ b: 'Players’ link' }` be straightened; whoever does it must move `inventory.js:151` (B11-N2) in the same commit, or the driver's name lookup and the live label disagree in the other direction. Attach this to B7-N1 so B12 does not ship half of it. **done `bb20a0d`**: `help.ts:544`, `inventory.js:150-151`'s value and comment all moved in the one commit that landed this piece. |
| B11-N4 | `issues/phase-8/context.md:394` (Q8's row) | "Normalise the **381** equipment names' U+2019 to ASCII" reads as 381 names carrying one; 381 is the `eq` record count, and the true figures are 13 distinct names, 28 records, 30 field values, 34 characters - which `issues/phase-8/critique/open.md:53` already said ("the 13 English equipment names"). This is a verbatim owner-decision row: **do not rewrite it**. If B12 touches it at all, append the measured counts rather than edit the owner's sentence. *(taste; arguably leave alone)* |
| B11-N5 | `issues/phase-8/handoff.md:285` | B11's "Completed" bullet wraps at ~110 columns against the file's own ~76. *(taste)* |

**A premise correction that reached this task's own documents.** The plan's
pre-ship B11 text said "the twenty carrying U+2019 from `dict.ts` are P14's
(B7)", and the orchestrator repeated it in B11's dispatch. It was wrong twice
over: pre-B11, exactly **six** of the 112 snapshot files carried U+2019 - the
same six B11 re-recorded, now zero - and `app/src/lib/dict.ts` holds **zero**
U+2019 (P14 straightened them; `dict.ts:624` is `"Players' link"`, ASCII).
The "twenty" is the count of tracked *text files* containing U+2019 today,
none of them a golden. The SHIPPED B11 text has already overwritten the
claim, so nothing needs editing - recorded so it is not re-derived or
re-believed.

**Verified sound in B11's review, recorded so it is not re-derived:**

- **Scope, checked leaf by leaf** by parsing both `data.js` revisions as JSON
  and walking the trees including key order: exactly **30** leaf differences
  in **28** distinct `eq` records (17 `ende`, 13 `en`). `items`, `alt` and
  `refs` structurally and byte-identical; no `ru`/`rud` moved; no key added,
  removed or reordered at any depth, so no id was renumbered. Affected ids:
  `q29, q80, q84, q89, q90, q148, q152, q156, q157, q168, q192, q219, q235,
  q236, q237, q249, q261, q265, q285, q289, q305, q335, q336, q339, q349,
  q350, q356, q359`.
- **Character class**: **34** changed code points, every one U+2019 ->
  U+0027, zero exceptions. Whole-file census: U+2019 34 -> 0; U+0027 208 ->
  242 (+34, exactly balancing); U+2018, U+02BC, U+00B4, U+2032, U+0060,
  U+201C, U+201D all zero before and after; U+00AB unchanged at 22. No
  straight-quote sweep rode along.
- **Post-B11 every ASCII apostrophe in `eq` is in one of the 30 touched
  fields** - before the batch `eq` was uniformly typographic and `items`
  uniformly ASCII. The batch unified the catalogue exactly, not mostly, which
  is what makes B11-BL-2's invariant clean to state.
- **The generated artefacts came from the generator**: loading the committed
  `data.js` and calling `tools/derived.js`'s `dataJson()`/`catalogCsv()`
  directly produced output **byte-identical** to the committed `data.json`
  and `catalog.csv`. `catalog.csv`'s 56-line stat is 28 deletions + 28
  insertions, one per affected record, zero non-apostrophe character changes
  - the CSV's one-record-per-line shape, nothing riding along.
- **Exactly six goldens, and the right six.** Pre-B11 census of all 112
  snapshots: those six were the only ones carrying U+2019 (3, 3, 11, 2, 14,
  14 occurrences); post-B11, zero of 112. Every changed line is an apostrophe
  flip and/or a `namehash` hex change; the `namehash` movement is `capName()`'s
  SHA-1 over the whole uncapped name (`tests/app/golden.js:193-202`), so a
  line whose visible prefix shows no apostrophe (`Bladed Fan`, `Crystal
  Spear`, `Extended Polearm`, `Throwing Knives`) changed only because the
  apostrophe sits in the elided interior - the correct, fail-closed behaviour
  of rule B.
- **The public-contract claim, verified and widened**: all nine files under
  `docs/fixtures/` contain zero U+2019 **and** reference none of the 28
  affected ids; `llms.txt`, `tests/contracts.js`, `docs/specs/CONTRACTS.md`,
  `README.md` and `README.ru.md` mention none of the 13 apostrophe-bearing
  names. A repo-wide search for each of the 13 names in both spellings,
  outside `data.js`/`data.json`/`catalog.csv`/`snapshots/`, returns four
  hits: `search.test.ts` (B11-BL-1), this task's own handoff, and two in
  `critique/open.md` (the dated report that raised O2 - correctly historical).
  The four-file rule did not fire. No record count changed, so
  `tests/derived.js`'s `COUNT_BEARING_FILES` is not implicated.
- **The shipped goldens were re-recorded against a correct `dist/`**, so the
  trap fired once, was caught, and needs a guard rather than a re-record:
  `dist/data.js`, `dist/data.json`, `dist/catalog.csv` and `dist/llms.txt`
  are byte-identical to the committed files, and `dist/assets/app.js`'s mtime
  (13:10:49Z) is newer than both the newest `app/src` mtime (12:47:44Z) and
  `data.js` (12:58:02Z). Both probes re-run without `--update`: `--only=eq_`
  8 states unchanged (72.1 s), `--only=search` 9 states unchanged (35.7 s).
- **Q8's premise holds**: `search.ts:71` still folds `[’ʼ]` on both sides and
  `tools/artwork/lib.mjs:16-17` still folds `[’ʼ′]` for artwork name
  matching, so the `refresh-artwork` path is indifferent to the spelling in
  either direction. B1 has not regressed; the batch stayed cosmetic.

### Carried, needing confirmation before B12 edits anything

Empty as of this piece (B12d). `B1-N9` and `B2-4`, formerly here, are
resolved - see the census table above and `## Done` below. `B2-5` (this
table's last row) was left `verify` through B12a-B12c even though the
census table above already recorded it `done e52f5de` - re-checked here,
this piece: `.claude/README.md:108` reads "commits when `npm run check` has
not passed for the covered paths (the fingerprint drops every `isExempt()`
path ...)", confirming B12a's own fix is real and the census entry was
right. The stale `verify` row is removed, not carried further - the census
table is the one source of truth for `B2-5`'s status.

## Deferred out of phase-8, with reasons

| id | what | reason |
|---|---|---|
| B2-6 | `docs/specs/ROUTES.md` documents `#/tables/frames` as a route shape with no row in `docs/fixtures/urls/routes.json` | Fixture completeness, not a coverage gap - `app/src/lib/hash.test.ts` covers the route. Touching `docs/fixtures/` is a public-contract change and needs its own justification. |
| B3-N9 | `docs/specs/COVERAGE.md`: "adding it back costs a fifth `run-all` row and a fifth CI width" | The 320px width would now be a sixth row. Cosmetic count in a sentence about a hypothetical. |
| perf-PF4 | 640x640 originals feed 60px rows and 168px tiles; grid view pulls ~11 MB against a 243 kB first load | Needs a generated derivative under a new asset path, which `CONTRACTS.md` freezes. Its own task, recorded in `plan.md`'s deferred list. |
| B6-R1 | `app/src/state/lists.svelte.ts` (`#readCurrent`) - a **second** storage corruption is never backed up, and the first backup is orphaned forever once a read succeeds | Moved out of B12 by `plan.md`, "Rows this plan moves to Deferred": the fix needs a backup **keying scheme** (a timestamped key grows `localStorage` without bound; dropping `.bad` on a successful read discards the first loss) and a way for a user to reach the backup at all - the consistent-storage ticket already owns ".bad-key recovery beyond a notice". Gets a `docs/specs/DEBT.md` entry (`D24`) in `B12b`, so it survives this task directory's retirement. |
| B6-R5 | `app/src/lib/listLink.ts` (`parseItems`/`decodeList`) - when every id in a shared link is dropped, the user sees "the link is damaged" (`badShare`) rather than "every item in it is gone" (`droppedItems`) | Moved out of B12: telling the two apart is a new user-visible outcome - a `dict.ts` string pair in two languages, a `FEATURES.md`/`ROUTES.md` sentence, and possibly an `inventory.js` entry plus a seeded golden. That is a batch, not a nit. Gets a `docs/specs/DEBT.md` entry (`D25`) in `B12b`. |
| B8-N7 | `app/src/components/TablesPage.svelte:444` - `scrollIntoView({behavior:'smooth'})` still animates under `prefers-reduced-motion: reduce`, since the CSS property `scroll-behavior` cannot override a call-site `behavior` argument | Moved out of B12: the boundary-respecting fix needs a `matchMedia` read, and there is no `matchMedia` anywhere in `app/src` today - it needs a new `app/src/ports/` surface with its type, `index.ts` entry, fake and per-file coverage. Gets a `docs/specs/DEBT.md` entry (`D26`) in `B12b`. |
| B6-N4 | `app/src/lib/dict.ts` `badStorage` (ru + en) - "under a separate key" is unactionable for a non-technical reader, who has no way to reach it without devtools | Moved out of B12: rewriting an informational clause is product **content**, in `dict.ts`'s own voice (`context.md`, language policy) - not a batch B12 is scoped for. Deferred to the UI/UX ticket. No `DEBT.md` entry - not a defect. |
| B8-N6 | `app/src/styles/tokens.css` (D1's rule) - zeroes `animation-duration`/`transition-duration` but not `animation-delay`/`transition-delay`, so a delayed animation would still wait under `reduce` | Moved out of B12: the plan specified exactly these four declarations and the owner approved them under Q5 - changing the rule now is a policy edit to an owner decision, for a hazard with zero sites in the tree today. No `DEBT.md` entry - not a defect. |

*(`plan.md`'s own step 7 text says "the four Deferred rows"; its fuller table
just above, "Rows this plan moves to Deferred", names five - `B6-R1`,
`B6-R5`, `B8-N7`, `B6-N4` and `B8-N6`. The five-row table is the one with an
itemised reason per row and is treated as authoritative here; the "four" in
step 7 is recorded as a discrepancy, not silently resolved by dropping one.)*

## Done

- **B1 review** N1-N6, N7 (owner chose the general fold: diacritics + U+2212), N8 - `c8cc38e`. N10 was commit shape, nothing to do.
- **B2 review** blockers B-1, B-2, B-3 and nits 1-3 - `c8cc38e`.
- **B3 review** N1 (`COVERAGE.md`'s stale `golden` job name) - `c8cc38e`, routed mid-flight.
- **B3 review** N2-N8 - B5 (`112bd07`), after B4 skipped them.
- **B9 review** blockers BL-1, BL-2 and record corrections N1/N2/N4/N7/N8/N9 - `0686bb6`.
- **B5-N15** (`tests/run-all.js`'s empty-shard message, flagged `deferred-scope` if B9 owned the file) - found already done `0f0c73b`, B9's own translation sweep; census, B12a.
- **B12a** - the census (all 103 rows), the three routed findings
  (`B11-BL-1`, `B11-BL-2`, `B11-R1`), `B7-N3`, and the record/spec rows
  (`B4-9`, `B5-R2`, `B5-N1`, `B5-N2`, `B5-N4`, `B5-N7`, `B8-R5`, `B8-N3`,
  `B9-N10`, `B11-N1`, `B11-N4`, `B11-N5`, `B2-5`) - `e52f5de`. Closed with no change (decision or already
  done, no edit needed): `B4-8`, `B4-10`, `B5-R3`, `B7-N5`, `B7-N6`,
  `B7-N7`, `B7-N8`, `B7-N14`, `B8-N5` (already `480c380`), `B8-N8`,
  `B8.1-R1`-`B8.1-R6`, `B8.1-N4`, `B9-R1`, `B9-R3`. Moved to "Deferred out
  of phase-8": `B6-R1`, `B6-R5`, `B8-N7`, `B6-N4`, `B8-N6`.
- **B12b** - production source (`app/src/**`) and the three new `DEBT.md`
  entries - `607b252`. Twenty-five rows
  landed as real edits, each proved to bite where the row was a behaviour
  fix (`B6-R3`, `B6-R4`) and recorded plainly as a comment/type/test-only
  change otherwise: `B5-N5`, `B5-N6`, `B5-N8`, `B5-N9`, `B5-N13`,
  `B5-N10/11/12`, `B6-R3`, `B6-R4`, `B6-N3`, `B6-N5`, `B7-N9`, `B7-N10`,
  `B7-N11`, `B7-N12`, `B8-R3`, `B8-R4`, `B8-N1`, `B8-N2`, `B10-N1`, `B10-N2`,
  `B10-N3`, `B10-N4`, `B10-N5`, `B2-4`. One row closed with no change:
  `B1-N9` (the union-third-argument fix touches ten-odd call sites, past the
  plan's own six-call-site/no-type-gymnastics budget - a doc clause on
  `matches` records the risk instead). `B5-R3` was already closed by B12a's
  census; confirmed on arrival, no further action. Plus `docs/specs/DEBT.md`
  gained `D24`-`D26` (`B6-R1`, `B6-R5`, `B8-N7`, deferred out of phase-8 by
  B12a) under a new heading. Two string changes (`B8-N2`'s `imgFailed`)
  checked against `tests/app/snapshots/` first - zero hits, stayed
  check-gated in this piece as the plan's own rule requires.
- **B12c** - harness, tooling and CI - `639f7eb`. Review: not run
  (owner's decision, 2026-09-18 - see
  `context.md`, "Review and nit policy for this task"). All 23 rows landed
  as real edits, none moving rendered output (this piece's own criterion):
  `B4-R1`, `B4-R2`, `B4-R3`, `B4-R4`, `B4-1`, `B4-2`, `B4-3`, `B4-4`, `B4-5`,
  `B4-6`, `B4-7`, `B5-R1`, `B5-N3`, `B5-N14`, `B6-N2`, `B8.1-N1`, `B9-R2`,
  `B9-N3`, `B9-N5`, `B9-N6`, `B9-N11`. `B4-3`'s original B4 acceptance line
  ("the deploy log shows the stub-count line") stays recorded as **unmet at
  B4** - the `echo` that finally satisfies it lands in this piece, not
  retroactively at B4 (see `handoff.md`, "B4-3"). `B4-4` and `B4-7` were
  live, not already done, contrary to their own "may already be done"
  hedges - the census (B12a) had already downgraded `B4-7` to "half done"
  and left `B4-4` "live"; both closed here. `B4-10` and `B5-N15` needed no
  edit - already closed/already-done by B12a's own census, confirmed on
  arrival. `B9-R2`/`B9-N5` landed as one edit across four ESLint rules:
  three (`no-regex-spaces`, `no-extraneous-class`, `no-useless-assignment`)
  fixed at every measured site, replacing their directory-wide `off`;
  `preserve-caught-error` narrowed from a directory-wide `off` to three
  inline `eslint-disable-next-line` comments at its exact pre-existing
  sites, so a *new* catch/rethrow in `tests/`/`tools/` is still caught.
  `npx eslint .` clean throughout. Full detail: `git show <sha>`, or
  `issues/phase-8/handoff.md`.
