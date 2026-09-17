# Handoff - TASK phase-8
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (B1 committed at `e7c7b50`; B2 committed this
  pass; B3 next)
- Last agent: implementer (2026-09-17)
- NEEDS_HUMAN_CONFIRMATION: no - all eight questions and the two further
  decisions are settled (`context.md`, "Settled owner decisions"); the plan
  is written as decided.
- Branch: `main`
- Base / starting commit: `f53f44d`; HEAD after this batch: see "Completed",
  B2's commit(s) below.

## Completed

### B1 - search normalisation (O1 + PF2)
- What shipped: `foldQuery()` in `app/src/lib/search.ts` (case fold,
  `ё`/`Ё` as `е`, U+2019/U+02BC as `'`) on both the query and the catalogue;
  `hayFor(statLine)` memoises a per-record array of folded fields by id (an
  array, not one joined string, so the cached and field-by-field fallback
  paths agree on every query by construction); `matches()`/`search()` take
  an optional `hay`; `SearchPage`/`TablesPage` fold once per language. One
  `FEATURES.md` bullet.
- Files changed: `app/src/lib/search.ts`, `app/src/lib/search.test.ts`
  (three new tests), `app/src/components/SearchPage.svelte`,
  `app/src/components/TablesPage.svelte` (no template change in either),
  `docs/specs/FEATURES.md`.
- Commit(s): `e7c7b50 fix(search): fold ё and typographic apostrophes, cache
  the haystack` - pushed.
- Deviations and rationale: the plan's joined-string haystack was rejected
  for a field-boundary false match; `data.ts`/`Index` untouched (the plan's
  own fallback). Before/after on real data: `плетеная сеть` 0 -> 1 (`ci8`);
  `keeper's` 3 -> 4 (adds `q80`). The `ё` half is the owner's low
  priority; the apostrophe half breaks English search and is the same line.

### B2 - hooks, ignore rules, truth fixes, `CLAUDE.md`, and the batch-size forcing function
- What shipped, by the plan's 27 steps:
  - **Steps 1-9 (hooks and ignores)**: `.gitignore` gained `.claude/worktrees/`
    and `work/`, both with the fingerprint reason; `.claude/.gitignore`
    gained `settings.local.json`; `.prettierignore`'s worktrees comment now
    points at `.gitignore` as the superset. `isExempt` moved to `lib.mjs`,
    exported, and used by both `bash-guard.mjs` (the commit gate) and
    `tree-key.mjs` (the fingerprint, which now drops every exempt row
    before hashing) - this closes the exact livelock the dispatch named:
    editing a handoff/plan no longer changes the fingerprint an armed cache
    is checked against. `citingLines()` now skips a `git show <sha>:`- or
    `HEAD:`-qualified citation; `MSG.orphanPlan` gained the way-out
    sentence. `git restore --staged --worktree` (or a `-W` cluster) now
    denies even with `--staged` present. `rm -r` without `-f` now denies
    the same as `rm -rf` (the exempt list gained `i`, the generated share
    stubs). `LONG_CHECKS` gained rows for an unsharded `golden.js`/`sweep.js`
    call and the `check` cost was tightened to the README's own measured
    `~165s`. `tests/run-all.js` gained `--help`/`-h` (prints usage, exits 0)
    and an i/-missing preflight after `queue` is built (`derived`, `dataint`,
    `craft`, `stub` need `i/`; one message replaces four separate crashes);
    its stale `--exclude=parity` comment was re-pointed at `app/golden`/
    `ci.yml`. `tests/derived.js`'s `catalog.csv` read is now guarded the
    same `existsSync` shape as its neighbours. The README's Hooks row for
    `edit-guard.mjs` now names `tests/app/snapshots/**`. Five new selftest
    cases (see "Verification").
  - **Steps 10-15 (`CLAUDE.md` and the forcing function)**: verified on disk
    before editing, matching the dispatch's correction exactly - `:24`,
    `:36`, `:97` were real, the other six of Q7's nine were already in the
    tree. `:36` "parity run" -> "browser suite run"; `:24` rewritten to
    "Prefer the smallest change that fixes the defect..."; `:97`'s `COUNTERS`
    mispointer corrected to name `tests/derived.js:451-453` (the actual nine-
    file array; `COUNTERS` itself is the counter-regex array at `:439`, a
    separate DC12 fix). One new line after the batch-size paragraph: "A plan
    names the criterion behind every split...". `.claude/prompts/
    plan.prompt.md` gained the required-outputs bullet. `.claude/README.md`
    gained the scar sentence after "Too small". `CLAUDE.md` is 171 lines by
    `wc -l` (not the plan's predicted 168 - see "Deviations").
  - **Steps 16-27 (truth fixes)**: `README.md`/`README.ru.md` drop the false
    "height of note fields" (`dhloot.prefs.v1` row); `COVERAGE.md` re-points
    four "Known thin spots" bullets at surviving homes, deletes the
    `craftmob` duplicate, adds `tools/**` and the axe RU-only gap as
    documented boundaries, adds a `NoData.svelte` thin spot (DC13), fixes
    the `derived` row's overclaim (T4 - the check compares the generator
    against its own fresh output, not a commit) and its `COUNTERS`
    mispointer, names the fourteen deleted browser suites at the
    resurrection command, fixes the DC7 `sweep.md` sha-as-ref claim, and
    gains a new "Whitespace text nodes are content" heading (C3) that the
    trimmed `prettier-ignore` comments (below) point at. `ROUTES.md`:
    `TABLE_DEFS`->`TABLE_IDS`, `TAB_LIST`->`SECTIONS`, the `frames` alias
    documented (DC3, DC4); `FEATURES.md:55` same rename. `I18N.md`: the
    dictionary-shape sentence corrected (DC5) and three sentences added on
    the share stubs' deliberate Russian-only design (O4). `META.md`
    section 6 rewritten to the dispatch's exact wording (DC6). `DEBT.md`:
    D16 deleted (fact 6 - both apps' idle toast is `display: none`, so
    there is no live-region divergence to record); D4 and D17 deleted with
    their "kept" sentences moved to `FEATURES.md` "Rolling"/"Records"; D8's
    file corrected to `TablesPage.svelte:539`; DC8's dangling "The harness"
    reference repointed to the `app/golden` row; the DC7 sha-as-ref fix
    applied here too. `CONTRACTS.md` section 4 documents the `data.json`
    empty-description omission. `llms.txt` corrects the "empty page" claim -
    the `<noscript>` block already carries the data links. The false
    "derived.js will fail"/"derived.js catches a forgotten rebuild" claim
    (T4) corrected in place, still Russian where required, in
    `README.md`/`README.ru.md`/`tools/build.js`/`tests/derived.js`/
    `.claude/hooks/edit-followup.mjs` (whose selftest case #40b now checks
    for the file-list pointer instead of the retired word "COUNTERS").
    `vite.config.mts`/`.gitignore` (H3/DC10) and `tests/run-all.js` (H4,
    folded into step 7 above) no longer claim a live root app. `i18n.ts:11`
    corrected (H5 - a second, unguarded copy exists in
    `build-share-pages.js`). `tools/tg-preview/{lib,client,manifest}.mjs`
    each gained one line naming the retirement commit for their `plan.md
    section N` citations (H2, verified: `1a06122` exists and its parent
    holds the file); `manifest.mjs`'s two stale comment blocks collapsed to
    one fact (H9). `tests/app/inventory.js`'s seven `per width` comments ->
    `per language` (H8). `tests/stub.js:6`'s bare citation gained a verb
    (H15). `tests/app/sweep.js:92`'s stale "1180 and 360" corrected to
    "1180 alone" (T12), matching `:376-379`. `types.ts`'s `tier` field
    gained a comment separating it from `eq.tier` (A8). `PrintCard.svelte`'s
    `fit()` doc comment gained the `container-type: size` linearity clause
    (PF7). `.prettierignore`'s `app/index.html` line is now marked
    permanent with its actual reason (a ~60-line indent/self-closing-slash
    diff for no behaviour change), replacing the deferred "not this batch"
    wording. `eslint.config.mjs`'s H11 comment corrected (tests/app/ is not
    legacy code; it is simply outside every tsconfig, same as the rest of
    tests/**); C9 was attempted (see "Deviations" - not kept). `git mv`
    (via a temporary name) renamed `Chip.test.ts`/`OrGrid.test.ts` to
    `chip.test.ts`/`orGrid.test.ts` (H12, owner-approved); the one stale
    reference to the old name in `tests/app/states.js:455` corrected too.
    H13's four non-ASCII marks fixed (`tools/derived.js:31`,
    `tools/build.js:26`, `app/src/state/app.test.ts:225`; `tools/build.js:11`
    was already fixed as a side effect of the T4 rewrite there). H10:
    deleted `brokenImage` (+ its `ports/index.ts` re-export); dropped
    `export` on `NO_ART`, `REAL_DICE`, `moneyWord`, `fromBase64Url`,
    `FakeClipboard` (each verified used only inside its own file). C4/T9:
    `tables.test.ts`'s pill comment and assertion switched to the
    `childNodes` idiom (`toContainEqual(['label', '×'])`);
    `listsPage.test.ts`'s comment corrected (jsdom and Chrome actually
    agree on the space; `textContent` pins a different thing). The
    "positional on purpose" comment added at `record.test.ts:395,406,412`
    and `printPage.test.ts:341`. The four `prettier-ignore` blocks
    (`TableRows.svelte`, `ListsPage.svelte`, `PrintCard.svelte`,
    `FilterBar.svelte`) cut to one explanatory line pointing at
    `COVERAGE.md`'s new heading, each still followed by its own exact
    `<!-- prettier-ignore -->` line (see "Deviations" - the first attempt
    merged the two and silently broke the directive).
- Files changed: see the file list in `plan.md`, "B2", plus
  `.claude/hooks/selftest.mjs` (five new cases, two existing fragments
  updated for the TL6 message-text change), `tests/app/states.js` (one
  stale-name fix beside the H12 rename), `.claude/README.md`'s Hooks-table
  `rm`/`restore` row.
- Commit(s): see below - filled in after `git log` (this file is exempt
  from the commit-gate fingerprint per this batch's own TL2 fix, so editing
  it now does not require re-running the check that already passed).
- Deviations and rationale:
  - **C9 (eslint `ignoreVoidReturningFunctions`) did not work and was not
    kept.** Added the option, ran `npm run lint`: it cleared none of the
    three sites, and removing `PrintCard.svelte`'s file-wide disable to
    test it exposed thirteen other pre-existing violations the disable had
    also been hiding - a wider effect than intended for zero gain. Per the
    plan's own fallback ("leave the survivor... do not chase the rule"),
    all three original `eslint-disable` comments are restored unchanged;
    `eslint.config.mjs` keeps a comment recording the attempt and result so
    nobody retries it without reading this first. `npm run lint` is clean.
  - **The first attempt at trimming the four `prettier-ignore` comments
    broke the directive.** Folding the one-line explanation into the same
    HTML comment as `prettier-ignore` (e.g. `<!-- prettier-ignore:
    whatever -->`) stopped Prettier from recognising it - `prettier --check`
    immediately reformatted three of the four files. Fixed by keeping the
    explanation as its own comment line immediately before a separate,
    exact `<!-- prettier-ignore -->` line; `prettier --check` on all four
    files is clean again. Recorded here because the failure mode is
    invisible without running Prettier - a reviewer reading the diff alone
    would not catch it.
  - **`wc -l CLAUDE.md` is 171, not the plan's predicted 168.** The file's
    committed form has no trailing newline (`git show HEAD:CLAUDE.md | wc -l`
    = 167, one less than a straight line count, because `wc -l` counts
    newlines and the last line has none); the `:24` rewrite needed three
    lines to stay within this file's manual wrap width, not one, and the
    forcing-function line adds a fourth. 171 is comfortably under
    `CLAUDE.md`'s own 200-line cap, which is the binding rule; the specific
    "168 or less" acceptance line does not hold and is recorded as not met,
    rather than forced by cutting content elsewhere.
  - **DC7's fix applied to `DEBT.md:391` too, not only `COVERAGE.md:377`
    named in the plan.** Same false claim ("`issues/47/sweep.md`, read at
    `7a33c22`" - the sha does not resolve as a git ref for a file first
    committed later), same one-word fix ("written while HEAD was"), same
    file class (a spec already in scope). Campsite rule, not scope creep.
  - **D8's location is `TablesPage.svelte:539`, not the plan's `:538`** -
    verified against the file (`<h4 class="altcol {col.key}">` is on line
    539 today); used the verified number.
  - **D8's "Why parity won" clause and this batch's own new COVERAGE.md
    section both cited `CLAUDE.md`, "Migration and parity", which does not
    exist any more** (retired at `config-audit`, confirmed by `git grep`
    finding it only in `issues/47/*` and `issues/config-audit/*` history).
    Neither citation was in the plan's literal text for those two edits,
    but both are inside files this step touches for a directly related
    reason, so both were corrected in place (D8 -> past tense, no live
    citation; the new heading -> points at `FilterBar.svelte:58-66`'s
    comment instead, which documents the same real hazard).
- Verification commands and results:
  - `set -o pipefail; npm run check 2>&1 | tail -n 150` (Bash timeout
    600000) - green: `format:check`, `lint`, `typecheck` (545 files, 0
    errors), `node --check tools/check-site.mjs`, `npm run data`,
    `node tests/derived.js`, `node .claude/hooks/selftest.mjs` (329 passed,
    0 failed - 324 prior + 5 new: TL2's `#27b`, TL3's `TL3a`/`TL3b`, TL5's
    case, TL6's combined case; two existing fragments, `#13a`/`#13b`,
    updated from "rm -rf" to "rm -r" to match the new message text),
    `node --test tools/tg-preview/lib.test.mjs` (110 passed),
    `node --test tools/artwork/lib.test.mjs` (26 passed), `npm run test`
    (42 test files, 1056 tests, coverage thresholds green). One
    `prettier --write` needed on `bash-guard.mjs`/`edit-followup.mjs`
    (quote-style only) before the gate went green; re-ran after.
  - `node tests/run-all.js contracts,derived` - both green.
  - `node tests/run-all.js --help` - exits 0 in 0.1s, lists every suite and
    the golden/sweep per-shard/per-width guidance.
  - `mv i i.bak && node tests/run-all.js stub` - exits 1 with "i/ is
    missing - it is generated, not committed. Run `node tools/build.js`
    (or `npm run build`) first."; `mv i.bak i` restored it (verified 1091
    files back).
  - `git status --porcelain -uall` - `work/` no longer listed.
  - `git grep -n -e TABLE_DEFS -e TAB_LIST -- docs` - empty.
  - `git grep -n 'per width' -- tests/app/inventory.js` - empty.
  - `git grep -n 'derived.js will fail' -- .claude` - empty.
  - `git grep -n brokenImage -- app` - empty.
  - `wc -l CLAUDE.md` - 171 (see "Deviations"; under the 200-line cap).
  - `npm run lint` - clean, all three `no-confusing-void-expression`
    disables left in place (see "Deviations").
  - `git grep -c -P '[\x00-\x08]' -- issues/phase-8` - no output (zero
    matches; the three task documents stay clean of control bytes).
  - Gates: `npm run check` (full); `node tests/run-all.js contracts,derived`;
    `node .claude/hooks/selftest.mjs` (also inside `npm run check`).

## Blockers
- None. B3 (CI shape) and B4 (deploy) follow; each ends in a live CI watch
  and must not run beside another heavy run.

## Deferred
- See `plan.md`, "Deferred to the two excluded tickets, and to tasks of
  their own".
- `issues/56/context.md:38` and `issues/59/context.md:25` cite the deleted
  `docs/parity.md` (DC14) - other tasks' files; the orchestrator passes it
  on. Untouched this pass.
- C9's real fix (a rule change that actually clears the three
  `{@render}` disables, or accepting them as permanent) is not re-opened
  here - recorded as attempted-and-reverted above; a future session should
  not retry the same option without reading that note first.

## Next batch (implement-ready)
- Name: B3 - CI shape (T1, T2, T5, T3, T8)
- Objective: browser work spread over the runners that sit idle; wall clock
  ~738s -> ~390s at about +10% billed minutes.
- Files: `tests/run-all.js`, `tests/app/sweep.js`, `.github/workflows/ci.yml`,
  `tests/derived.js:529-541`, `tests/app/contracts.js`, `.claude/README.md`
  (one sentence: a local gate's fixed cost is minutes, a CI job's ~20s).
- Steps: `plan.md`, "B3", steps 1-4, in that order.
- Acceptance criteria: the four shards together equal `SUITES` and are
  disjoint (`--shard=n/4 --jobs 1` listings); CI on the pushed commit shows
  `browser (1..4)` each under ~350s and `check` ~110s; `deploy` runs; the
  total wall clock is recorded in the handoff against 738s.
- Verification commands: `npm run check`; one local
  `node tests/run-all.js --shard=4/4` (the lightest, ~160s); push;
  `gh run watch`.
- Risks / do-nots: B3 ends in a live CI watch and must not share a run with
  B4's matrix-dependent PR probe; do not start B4 in the same session
  unless the human explicitly asks.

## Notes
- Mocks path: none (no new UI element).
- Screenshot findings: none (no attachments).
- Cleanup performed / retained artifacts: `i/` was renamed to `i.bak` and
  back during the run-all.js preflight test above; verified restored
  (1091 files). No other scratch artifacts.
- Session end partial progress (if any): none - B2 is a committed boundary.
