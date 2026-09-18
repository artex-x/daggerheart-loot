# Handoff - TASK phase-8
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress - **B8's one remediation cycle is spent and
  pushed.** B1-B8 plus B7's remediation committed and pushed as before
  (`e7c7b50`, `44b1761`, `3bc605d`, the B2-review remediation batch,
  `0a3d9fb`/`446e45b`, `112bd07`/`571b041`, `370fec2`/`11066f0`,
  `e80a793`/`dba6755`, B7's own review `8e43c92`, `3c0fff8`/`d946f8b`,
  `6b50945`/`17e23ac`, `8de4698`). This session fixed B8 review's three
  blockers (BL-1..BL-3) plus its two riders (B8-R1, B8-R2, both in
  `tests/app/print.js`) - the full set that cycle authorised - as one
  commit, `480c380 fix(phase-8): B8 remediation - focus ring clipping,
  gesture-safe copy, stale spec/test claims`. Nits (`B8-R3`..`B8-R6`,
  `B8-N1`..`B8-N8`) were explicitly out of scope for this pass and were not
  touched - they stay in `issues/phase-8/nits.md`, "Outstanding - B12's
  scope".
- An untracked, unrelated commit (`c90f082 docs(phase-8): record the timed
  owned-list golden flake, with decoded evidence`, `issues/phase-8/
  context.md` only, 57 lines) appeared on `origin/main` between this
  remediation's dispatch (HEAD `8de4698`) and its first `git push` - it
  landed mid-session, timestamped inside this session's own `npm run check`
  run. It is docs-only and touches no file this remediation touches, so the
  push was a clean fast-forward with no conflict, but its presence means
  `CLAUDE.md`'s "one session at a time per working tree" rule may not have
  held here - flagging for the orchestrator to confirm nothing else is
  running against this tree, not re-investigated further by this pass.
- Gate basis for this land: `rtk npm run check` (one foreground call,
  timeout 600000, no pipe) - green: 45 test files, 1131/1131 tests, coverage
  96.77 stmts / 89.05 branch / 97.21 funcs / 97.42 lines, every threshold
  green, format/lint/svelte-check/derived/selftest/tools all green. Also
  `rtk node tests/run-all.js app/print` (its own foreground call) - green,
  164.3s: "все наборы прошли за 164с (в 8 потока)". Two cheap golden probes
  (`node tests/app/golden.js --only=#/i/`, 13 states; `--only=#/print/`, 9
  states - both need `MSYS_NO_PATHCONV=1` on this Windows/git-bash host, or
  the leading `#/i/`/`#/print/` gets mangled by MSYS path conversion) both
  came back "без изменений" - no golden moved, confirming the review's own
  "no golden can have moved" claim for this remediation's changes too.
- Last agent: implementer (2026-09-18, B8 remediation - full implementation,
  commit, push, handoff update).
- Branch: `main`
- Base / starting commit for this remediation: `8de4698` (HEAD at dispatch,
  = `origin/main` per the orchestrator). HEAD is now `480c380`, pushed and
  confirmed equal to `origin/main` (`git rev-parse HEAD origin/main` agree).
- Review: not required for this remediation (no trigger fired - it is a
  CSS-only fix, a promise-ordering fix with no name/role/control moved, and
  two doc/test corrections inside an already-reviewed batch's own
  remediation cycle, not a new batch).
- **One thing this pass cannot prove and does not claim proved**: BL-1's fix
  is correct by reasoning (the CSS cascade/clipping argument in the commit
  message and in `nits.md`), not by any gate. No instrument in this
  repository can see an outline clipped by an ancestor - `sweep.js`'s
  `focusWalk` reads `getComputedStyle().outline`, which still reports a ring
  an ancestor clips; goldens read structure; axe checks neither. A human eye
  or a screenshot confirming `.card-media`'s ring is drawn inside `.card` at
  both `.full` and `.compact` is still owed.
- Next batch: **B9** - language and format: `tests/` and `tools/`. See
  `plan.md`, "B9" and "Next batch (implement-ready)" below.

## Completed

### B1 - search normalisation (O1 + PF2)
- What shipped: `foldQuery()` in `app/src/lib/search.ts` (case fold,
  `ё`/`Ё` as `е`, U+2019/U+02BC as `'`) on both the query and the catalogue;
  `hayFor(statLine)` memoises a per-record array of folded fields by id (an
  array, not one joined string, so the cached and field-by-field fallback
  paths agree on every query by construction); `matches()` takes an optional
  `hay`; `SearchPage`/`TablesPage` fold once per language. One `FEATURES.md`
  bullet. (`search()` originally also took an optional `hay` nothing passed -
  removed in the B2 review remediation, N1 below.)
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
- Verification commands and results (N8 - missing when this section was
  first written; added in the B2 review remediation): this commit's own
  `npm run check` ran as the commit gate before `e7c7b50` landed, but its
  output was never filed here - that gap is what N8 flags. Independent
  confirmation exists regardless: B2's own full green `npm run check` at
  `44b1761` (see below, "Verification commands and results") ran on a tree
  that already contained `e7c7b50` - `npm run test` (1056 tests, including
  every case in `search.test.ts`) and `node tests/run-all.js
  contracts,derived` were both green on top of B1's `search.ts`/
  `search.test.ts`, not merely at B1's own commit time. The B2 review
  remediation batch (below) re-runs `npm run check` again over
  `search.ts`/`search.test.ts` as further edited for N1-N7.

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
    mispointer corrected to name `tests/derived.js:451-453` (the actual
    nine-file array at the time; `COUNTERS` itself is the counter-regex array
    at `:439`, a separate DC12 fix). **Corrected in the B2 review
    remediation (B-2):** a line range on that array is a five-file
    maintenance trap - B3 (`3bc605d`) already moved it once. The array is
    now named `COUNT_BEARING_FILES` in `tests/derived.js` and every citation
    (here, `CLAUDE.md`, `COVERAGE.md`, `edit-followup.mjs`, `selftest.mjs`)
    points at the identifier instead of a line number. One new line after
    the batch-size paragraph: "A plan names the criterion behind every
    split...". `.claude/prompts/
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
- Commit(s): `44b1761 fix(phase-8): hooks livelock, ignore rules, truth
  fixes, CLAUDE.md, batch-size rule (B2)` - pushed. (This line was added in
  a second, doc-only commit after `git log` revealed the hash - proof by
  use of this same batch's TL2 fix: editing `handoff.md` after `44b1761`
  did not require re-running `npm run check`, and the commit gate stayed
  silent.)
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
  - **`wc -l CLAUDE.md` is 171, not the plan's predicted 168.** The file was
    167 lines before this batch; the edits add 4 - the `:24` rewrite needed
    three lines to stay within this file's manual wrap width, not one, and
    the forcing-function line adds a fourth. 171 is comfortably under
    `CLAUDE.md`'s own 200-line cap, which is the binding rule; the specific
    "168 or less" acceptance line does not hold and is recorded as not met,
    rather than forced by cutting content elsewhere. (B2 review nit 1: an
    earlier version of this note explained the gap with a "no trailing
    newline" theory; that was wrong and is corrected here to the plain
    arithmetic above.)
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
    `node tests/derived.js`, `node .claude/hooks/selftest.mjs` (329
    assertions passed, 0 failed - 316 prior + 13 new, from 5 new named
    cases: TL2's `#27b`, TL3's `TL3a`/`TL3b`, TL5's case, TL6's combined
    case; two existing fragments, `#13a`/`#13b`, updated from "rm -rf" to
    "rm -r" to match the new message text). (B2 review nit 2: an earlier
    version of this line read "324 prior + 5 new", conflating case count
    with assertion count; the cases add 13 assertions, not 5.)
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

### B3 - CI shape (T1, T2, T5, T3, T8)
- What shipped, by the plan's four steps:
  - **T5** (`tests/run-all.js`): the weight column is now CI seconds from
    `issues/phase-8/critique/tests.md`, section 0.3 (run `35214847899`,
    2026-09-17), not the old order-only local guess. The comment names the
    host/run/date and restates the advisory-local doctrine. `app/sweep`'s
    1180 row is split into `ru`/`en` at ~275s each - an even split of the
    single 550.5s measurement, not a fresh one; flagged in the comment as an
    estimate to correct after this lands.
  - **T2** (`tests/app/sweep.js`): a trailing `ru`/`en` argument narrows
    `LANGS` (default both, unchanged for a bare call); the focus walk gate
    moved from `width === 1180` to `width === 1180 && LANGS.includes('ru')`
    so the `en` row does not repeat it. `run-all.js`'s two 1180 rows pass
    `['1180','ru']`/`['1180','en']`; `keyOf`'s existing `s[3].join('-')`
    already makes `app/sweep:1180-ru` a distinct, filename-safe key with no
    change needed there.
  - **T1** (`tests/run-all.js`, `.github/workflows/ci.yml`): a `--shard=n/m`
    flag - longest-first greedy pack (LPT list scheduling) of `queue` over
    the weight column into `m` bins, keeping only bin `n`; disjoint and
    exhaustive by construction (each of the 19 rows is pushed into exactly
    one bin during the single pass over the weight-sorted list, so the union
    of all `m` bins' membership is `queue` with no gap and no overlap -
    verified by inspection of that loop, not by an extra dry-run). `ci.yml`:
    `check` keeps only the `&&` chain, build, smoke, budget, and its failure
    artifact dropped `test-output/` (no longer produced there); the `golden:`
    job is deleted; a new `browser:` matrix of 4 runs `npm run build` then
    `node tests/run-all.js --shard=N/4`, uploading `test-output/` + `dist/`
    on failure (dissolves T8's dangling-artifact problem, since goldens now
    run through `run-all.js` and get real logs for free).
  - **T3** (`tests/app/contracts.js`): `fresh()` hoisted out of the
    28-fixture address-grammar loop and the 18-call `rowsAt` helper (6
    `whole` + 12 `PROBE`), each now one reused context. Storage-clearing
    between opens needs no new code: `driver.js`'s `d.open` always does a
    full `page.goto('about:blank')` + `page.goto(url)` round trip
    (`driver.js:151-153`), and `prepare()`'s `evaluateOnNewDocument` (which
    clears `localStorage` before every new document) is registered once per
    page and fires on every subsequent navigation, not just the first - so
    reusing the page already gives every fixture/probe the same clean slate
    a fresh context would.
- **The trap the dispatch named, and how it was resolved.**
  `tests/derived.js`'s `deploy.needs` assertion hard-coded `golden`; deleting
  that job and renaming it to `browser` needed the assertion updated to
  `names.includes('browser')` (one word) or it would fail for a reason
  unrelated to the diff. Updated, and its neighbouring comment now names
  `browser` as the sharded matrix that runs `tests/run-all.js` (goldens
  included) and notes it replaced the old `golden` job.
- **Deviation from this batch's own dispatch, recorded because it changes a
  file the dispatch said not to touch.** The dispatch's "Scope" section said
  "Do not touch the deploy job's `needs:` list or its guard step; that is
  B4's" - but `plan.md`'s B3 step 3 (written the same day, more specific)
  explicitly assigns exactly this edit to B3: "`deploy.needs` becomes
  `[check, audit, secrets, browser]`; this also requires editing
  `tests/derived.js:540`". The two sources conflict. Resolved in favour of
  the plan and mechanical necessity: deleting the `golden` job while leaving
  `deploy.needs: [check, audit, secrets, golden]` unchanged would reference a
  job that no longer exists, which does not degrade gracefully - it leaves
  the workflow permanently unable to run `deploy` (and likely fails to
  schedule at all). The one-line rename in `ci.yml`'s `deploy:` block is the
  full extent of the deviation; B4's actual scope in the plan - DP1
  (timeout-minutes), DP3 (`contents: read`), DP4/T4 (the `git diff`
  guard step), DP2 (stub count), DP6 (concurrency), DP7 (`.nojekyll`
  comment), T10/DP9 (`check-site` refactor), the 404.html addition to the
  guard step and the collect list - is untouched here. Flagging this for the
  human/orchestrator to confirm the resolution was correct; nothing else in
  the guard step or `needs:` list beyond the one rename was touched.
- **Campsite fix beyond the plan's literal file list.**
  `docs/specs/COVERAGE.md:20` claimed "eighteen `run-all.js` rows (`app/sweep`
  and `app/golden` each split four ways)" - T2 makes that false (19 rows,
  `app/sweep` now five ways). One-sentence correction, same file class and
  same immediate cause as this batch's own change (precedent: B2's DC7 fix
  applied beyond the plan's literal citation for the same reason).
- **Left untouched:** `issues/phase-8/context.md` carries an unstaged
  addition (a "Review and nit policy" section) present in the working tree
  before this batch started and not part of B3 - not authored by this pass,
  not committed with it, per CLAUDE.md "Preserve unrelated working-tree
  changes. Commit only the coherent task scope."
- Files changed: `tests/run-all.js`, `tests/app/sweep.js`,
  `.github/workflows/ci.yml`, `tests/derived.js`, `tests/app/contracts.js`,
  `.claude/README.md` (the local-vs-CI fixed-cost sentence),
  `docs/specs/COVERAGE.md` (campsite count fix).
- Commit(s): `3bc605d fix(phase-8): shard the browser suites across CI runners
  instead of one job (B3)` - pushed.
- Verification commands and results:
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` (Bash timeout
    600000) - green: `format:check`, `lint`, `typecheck`, `npm run data`,
    `node tests/derived.js` (the renamed `browser` assertion passes against
    the new `ci.yml`), `node .claude/hooks/selftest.mjs`, the two
    `node --test` suites, `npm run test` (42 files, 1056 tests, coverage
    96.63%/88.63%/97.12%/97.36% - thresholds green).
  - `npm run build` - green, 1.15s (`npm run check` does not build `dist/`;
    needed once before the local shard gate below).
  - `node tests/run-all.js --shard=4/4` (Bash timeout 400000, not
    backgrounded) - green, "все наборы прошли за 384с (в 8 потока)" (this
    Windows host's `os.cpus()` gives it 8 pool slots, not CI's 4, so the
    three items this shard drew - `app/sweep 1180 ru` 383.8s,
    `app/sweep 1180 en` 184.9s, `app/golden 4/4` 104.4s - ran fully
    concurrently and wall clock is the slowest one alone, not their sum;
    CI's real per-shard wall is what the pushed run below measures).
  - Disjoint/exhaustive was **not** re-verified by running all four shards
    locally (~650-700s combined for no new information) - it follows from
    the packing loop's structure (each of the 19 rows is pushed to exactly
    one bin in a single pass) and is what the pushed CI run's four `browser`
    job logs prove in practice.
- Push and CI: `git push origin main` (`1b5bd19..3bc605d`); `gh run list
  --branch main --limit 3` found run `35232880507`; watched with `gh run
  watch 35232880507 --exit-status` (green); per-job durations read with
  `gh run view 35232880507 --json jobs --jq '.jobs[] | {name, startedAt,
  completedAt}'`; each shard's own suite membership and per-suite seconds
  read from its job log (`gh run view 35232880507 --job <id> --log`,
  grepped for the `run-all.js` summary lines).

  **Measured job durations** (`createdAt` 14:20:17Z, `deploy` `completedAt`
  14:27:33Z):

  | job | wall | contents (CI seconds, this run) |
  |---|---|---|
  | `check` | 1m47s | the `&&` chain + build/smoke/budget only |
  | `browser (1)` | 5m45s | sweep390 325.1, golden1 109.7, states 102.5, golden3 103.6, stub 2.2, dataint 0.3, derived 0.3, craft 0.1, contracts 0.0 |
  | `browser (2)` | 5m46s | sweep360 321.4, print 155.6, golden2 105.2, hues 69.8 |
  | `browser (3)` | 5m31s | sweep768 312.3, contracts(app) 246.5, typo 78.8 |
  | `browser (4)` | 6m31s | sweep1180-ru 371.9, sweep1180-en 172.7, golden4 95.6 |
  | `audit` | 20s | |
  | `secrets` | 7s | |
  | `deploy` | 36s | (started 5s after `browser (4)`, the last dependency) |

  All 19 rows are accounted for exactly once across the four shards (9 + 4 +
  3 + 3 = 19), confirming disjoint-and-exhaustive on the real pool, not just
  by construction.

  **Wall clock: 738s -> 436s, -41%** (push at 14:20:17Z, `deploy` done
  14:27:33Z) - a real win, but **short of the ~390s projection, by about
  12%**, for a traceable reason: `tests.md`'s packing table assumed the
  split 1180 row would land near ~275s per language (an even halving of the
  single 550.5s measurement). It did not - `sweep1180-ru` measured 371.9s
  here, `sweep1180-en` 172.7s (they still sum close to the original 550.5s,
  544.6s), because axe's English pass and the RU-only focus walk are not
  actually half the excess each; the RU side is the heavier one. Since RU
  also carries the focus walk, `sweep1180-ru` (371.9s) is now the single
  longest row in the whole suite, ahead of `sweep390` (325.1s) - it is the
  new critical-path floor, not the item `tests.md` designed the packing
  around. `run-all.js`'s weight table already says the split is "an even
  split of that one measurement rather than a fresh one - re-measure and
  correct after this lands"; this run is that re-measurement, and the two
  numbers to put in that comment on a future pass are 371.9/172.7, not
  275/275.
  - **Billed runner-seconds: 1244 -> 1583, +27%**, not the projected +10%
    (~1382s). Sum: old `check 689 + golden 128+126+121+115 + audit 17 +
    secrets 8 + deploy 40` from `tests.md`'s baseline run vs new `check 107 +
    browser 345+346+331+391 + audit 20 + secrets 7 + deploy 36` here. The
    gap is that each `browser` shard now pays a full `npm run build` (~2s)
    plus its own ~20s fixed cost against far more assigned work per shard
    (325-391s, vs the old `golden` shards' 115-128s) - four jobs doing what
    was one `check` step's 582s of work plus four small `golden` jobs, not
    four jobs sized like the old `golden` ones. This is the honest number,
    not the projected one: more billed time than `tests.md` estimated, for
    less wall-clock-per-billed-second improvement than hoped, but still a
    real 41% wall-clock cut on a public repo where billed minutes are free.
  - `check`'s own `npm run check` step passed inside this same run, which is
    the live proof that `tests/derived.js`'s renamed `browser` assertion
    holds against the real `ci.yml` - `deploy` would not have run otherwise
    (`deploy.needs` includes `check`).

### B2-review remediation - B2's three blockers, B1/B2 nits, N7 (owner-approved), the reviewer guide fix
- What shipped, one batch per the batch-size rule B2 itself shipped (these
  items share one `npm run check` and touch disjoint files):
  - **B-1 (blocker):** `docs/specs/CONTRACTS.md` section 4's false claim that
    `tools/build.js` strips empty `rud`/`ende` before writing `data.json` is
    deleted; replaced with the verified fact - `tools/derived.js`'s
    `dataJson(L)` is `JSON.stringify(L) + '\n'`, nothing stripped,
    `tests/derived.js` holds `data.json` to that output byte for byte inside
    `npm run check`, and `data.json` carries 112 `"rud":""` literals.
  - **B-2 (blocker):** the nine-file array in `tests/derived.js` (counts
    `npm run check` verifies against README/dict/etc.) is now a named const,
    `COUNT_BEARING_FILES`, instead of an anonymous array cited everywhere
    else by a line range - the range had already moved once (B3 touched the
    file) and every one of its five citations had gone stale or wrong at
    least once. Every citation now names the identifier instead:
    `CLAUDE.md`, `docs/specs/COVERAGE.md`'s `derived` row,
    `.claude/hooks/edit-followup.mjs`'s reminder text,
    `.claude/hooks/selftest.mjs`'s case `#40b` (assertion moved with the
    message), and this file's and `plan.md`'s own B2 records (corrected in
    place, historical narrative kept, wrong number struck through with why).
  - **B-3 (blocker):** `docs/specs/COVERAGE.md`'s DC9 sentence claimed
    `Button.svelte` and a `statLabels` helper both "existed with no caller"
    and were "deleted". False for `Button.svelte`: it exists, has real
    callers across 17 files, has its own `button.test.ts`, and
    `vite.config.mts` carves out a named coverage threshold for it - it was
    kept and later given callers, not deleted. `statLabels` was in fact
    deleted (no hits anywhere in `app/src`). Sentence corrected to say so;
    `plan.md`'s "Where every finding landed" table's `DC2-DC9` range split so
    DC9 is shown landing here, not silently inside B2 where it did not
    actually land - "Nothing fell out" now holds.
  - **B2 nits 1-3:** the handoff's invented "no trailing newline" theory for
    `CLAUDE.md`'s 171 lines replaced with the plain arithmetic (167 before,
    +4 lines); the "329 passed = 324 + 5" line corrected to "316 prior + 13
    new assertions from 5 new cases" (case count and assertion count were
    conflated); `.claude/hooks/lib.mjs`'s `isExempt` comment now states
    plainly that `tests/contracts.js` is not part of `npm run check` itself
    (runs via `node tests/run-all.js contracts`), which is why editing a spec
    alone never reruns the test that depends on it.
  - **B3 review nit (routed here by the orchestrator, same `derived` row):**
    `docs/specs/COVERAGE.md`'s `derived` row still said `deploy.needs`
    includes the structural `golden` matrix; B3 (`3bc605d`) renamed that job
    to `browser` and updated the row's own line 20 but missed this second
    mention. `golden` -> `browser`, one word.
  - **B1 nits N1-N6, N8** (verdict: approve; all in
    `app/src/lib/search.ts`/`search.test.ts`/this file):
    - N1: `search()` dropped the `hay?: Hay` parameter nothing ever passed
      (`CLAUDE.md`: "Add no module, export, component, or variant before
      something uses it"); `matches()` keeps it - it has two real callers
      (`SearchPage.svelte`, `TablesPage.svelte`).
    - N2: `'плетеная сеть'` and `"keeper's staff"` added to the
      cached-vs-fallback agreement test's query array, so the two defect
      cases (previously exercised only through `find()`, i.e. the live
      fallback path) are also proven against the cached path the app
      actually runs through `SearchPage`/`TablesPage`. A new comment records
      that all six original queries are exactly what
      `tests/app/inventory.js` seeds into the search box across its golden
      states - previously unstated provenance.
    - N3: the pre-existing `'лук'` "no near-misses" assertion re-implemented
      a bare-`toLowerCase` comparison and concatenated all four fields before
      searching - the exact field-boundary shape this batch's own `hayFor`
      design was built to reject. Rewritten to fold both sides through
      `foldQuery` and check each field separately with `.some()`.
    - N4: the two near-indistinguishable literal characters in
      `/[’ʼ]/g` replaced with explicit code points, `/[’ʼ]/g`.
    - N5: `has(hay, needle)`'s parameter renamed to `text` - `hay: Hay`
      twelve lines below is a different, record-level accessor, and reusing
      the name for a field string invited confusion.
    - N6: `hayFor`'s doc comment corrected - the cited 0.33ms is PF2's own
      proposed design (one joined lowercased string built into `data.ts`'s
      `Index`), not the array-of-folded-fields design this file actually
      ships; the two are not directly comparable measurements of the same
      code, only the warm/cold shape carries over.
    - N8: B1's "Completed" entry (above) gained a "Verification commands and
      results" line it was missing, stating that B2's own full green
      `npm run check` at `44b1761` ran on a tree that already contained B1's
      commit `e7c7b50`, so B1's `search.ts` changes have independent proof of
      passing under the fuller suite beyond the commit-gate run at the time.
  - **N7 (owner-approved, general answer):** `foldQuery` extended to fold
    Latin diacritics and the Unicode minus sign. A new `foldLatinDiacritics`
    helper NFD-decomposes and strips the combining mark **for every
    character outside the Cyrillic block (U+0400-U+04FF)** - a plain NFD
    over the whole string was tried first and rejected: it decomposes
    Cyrillic `й` (U+0439) into `и` (U+0438) plus a combining breve, which
    would merge `й` into `и`, exactly the merge `foldQuery`'s own doc comment
    has always said it does not make. Verified directly in
    `search.test.ts`: `foldQuery('й') === 'й'` and `foldQuery('чай') !==
    foldQuery('чаи')`. U+2212 (Unicode minus, 123 occurrences across 113
    descriptions) folds to ASCII `-`. `foldQuery`'s doc comment rewritten -
    it used to reject diacritic folding as "fuzziness nobody asked for";
    that stance is overridden by the owner now that `Ethereal Zweihänder`
    (q238) and `Möbius Orb` (q311) were shown unreachable by ordinary
    typing across all 1091 records. New tests: `Zweihander` -> q238,
    `Mobius` -> q311, `-1` -> q4 (whose `rud` has "−1"). `docs/specs/
    FEATURES.md`'s search bullet updated to match.
  - **The reviewer guide fix:** `CLAUDE.md:163` no longer calls the reviewer
    "(optional)" - it now points at `.claude/prompts/orchestrate.prompt.md`,
    "When to run reviewer (do not skip these)". That file's "When to run
    reviewer" section gained one line: each batch's handoff Completed
    section must record `Review: required (trigger: <which>)` or `not
    required (no trigger fired)`. `.claude/templates/handoff.template.md`'s
    `## Completed` block gained the same field so new handoffs carry it by
    default.
- Files changed: `docs/specs/CONTRACTS.md`, `docs/specs/COVERAGE.md`,
  `docs/specs/FEATURES.md`, `tests/derived.js`, `CLAUDE.md`,
  `.claude/hooks/edit-followup.mjs`, `.claude/hooks/selftest.mjs`,
  `.claude/hooks/lib.mjs`, `.claude/prompts/orchestrate.prompt.md`,
  `.claude/templates/handoff.template.md`, `app/src/lib/search.ts`,
  `app/src/lib/search.test.ts`, `issues/phase-8/plan.md`,
  `issues/phase-8/handoff.md`, `issues/phase-8/context.md` (the orchestrator's
  unstaged "Review and nit policy" section, present before this batch
  started - committed with this batch per its own instruction, not reverted).
- Commit(s): `c8cc38e fix(phase-8): B2 review remediation - blockers, nits,
  diacritic fold, guide` - pushed. (This line added in a second, doc-only
  commit after `git log` revealed the hash, per B2's own precedent: editing
  `handoff.md` after `c8cc38e` does not require re-running `npm run check`.)
- Review: not required (no trigger fired) - this batch is a documentation,
  hook-comment and test-nit remediation; it does not change a public
  contract, route, or list link (the `CONTRACTS.md`/`COVERAGE.md` edits
  correct prose about the existing contract, not the contract itself), is
  not new/changed UI, is not a data ingest or artwork refresh, and the
  implementer reported no uncertainty or deviation from the dispatch.
- Deviations and rationale: none from the dispatch's letter. One judgment
  call within it: DC9's table row (`plan.md`, "Where every finding landed")
  was split rather than left as `DC2-DC9` with a silent asterisk, because a
  reader scanning that table for "did DC9 land" needs the answer in the
  table itself, not in a cross-reference they have to already know to check.
- Verification commands and results:
  - `set -o pipefail; npm run check 2>&1 | tail -n 150` (Bash timeout
    600000) - green: `format:check` (one `prettier --write` needed on
    `.claude/hooks/edit-followup.mjs` after the `COUNT_BEARING_FILES`
    message edit - quote-style only, re-ran clean), `lint`, `typecheck`,
    `node --check tools/check-site.mjs`, `npm run data`,
    `node tests/derived.js`, `node .claude/hooks/selftest.mjs` (all cases
    including the corrected `#40b`), `node --test tools/tg-preview/lib.test.mjs`
    (110 passed), `node --test tools/artwork/lib.test.mjs` (26 passed),
    `npm run test` (42 test files, 1059 tests - three new in
    `search.test.ts`: diacritic folding, minus-sign folding, the `й`/`и`
    non-merge; coverage 96.63%/88.61%/97.13%/97.36%, thresholds green).
  - `npm run build` - green (needed once before the golden runs below).
  - `node tests/app/golden.js --only=search` - 9 states compared, "структурные
    образцы (dist/): без изменений" (no change) - green **without**
    `--update`.
  - `node tests/app/golden.js --only=searched` - 3 states compared, "без
    изменений" - green **without** `--update`.
  - q238/q311 do not enter the six seeded queries' result sets, checked two
    ways: (1) both golden runs above came back byte-identical, which already
    proves the rendered states did not move; (2) a direct check against
    `data.json` with both the old (pre-N7) and new `foldQuery` compared the
    membership of `q238`/`q311` in each of the six queries' results - identical
    before and after (`меч` and `а` already matched `q238`/`а` matched
    `q311` too, both for reasons unrelated to diacritic/minus folding - `меч`
    is a literal substring of q238's own Russian name "Двуручный Меч", and
    `а` is a near-universal Cyrillic letter matching 1055 of 1091 records
    regardless of this change); no new membership anywhere.
  - Gates: `npm run check` (full); `node tests/app/golden.js --only=search`;
    `node tests/app/golden.js --only=searched`.

### B4 - deploy and gate correctness, and `404.html` (DP1-DP7, T4/DP4, T6, T10/DP9, R8, R1)
- What shipped, by finding:
  - **DP1**: `timeout-minutes: 30` on `check` and `browser`, `10` on `audit`,
    `secrets` and `deploy`. `tools/check-site.lib.mjs`'s `fetchReader` passes
    `signal: AbortSignal.timeout(15_000)` to every `fetch`; the existing
    catch already treats an abort as a retry.
  - **DP3**: `contents: read` added to the `deploy` job's own `permissions:`
    block, which otherwise fully replaces the workflow-level one.
  - **DP4/T4**: a new `check`-job step, `git diff --exit-code -- data.json
    catalog.csv`, right after `npm run check`. Without it, `npm run check`'s
    own `npm run data` regenerates those files and `tests/derived.js` then
    compares the generator against the copy it just wrote - a data.js edit
    committed without its generated output was green forever.
    `README.md`/`README.ru.md`/`.claude/hooks/edit-followup.mjs` already
    described this step (added ahead of it existing); verified their prose
    against the landed step and none needed editing.
  - **DP2**: a stub-count check in the deploy guard - `ls _site/i | wc -l`
    against `wc -l catalog.csv` minus its header row - between the existing
    non-empty checks and the `cmp` checks.
  - **DP6**: `concurrency.group` is `pages` (never cancelled) only for a push
    to `main`; any other run (PR, `workflow_dispatch`, a push to another
    branch) gets `ci-${{ github.ref }}` with `cancel-in-progress: true`.
  - **DP7**: `.nojekyll` still copied and still guarded; the guard's comment
    now says why the check can only ever fail for a reason that does not
    matter (`upload-pages-artifact@v4` excludes dotfiles; Pages is
    `build_type: workflow`, which never ran Jekyll regardless).
  - **DP5**: the rollback comment block gained the re-run path, its
    measured cost, and an explicit warning that it republishes stale content
    if reached for as a retry rather than a rollback. Measured on this
    batch's own pushed run (`35241351714`): push-to-live 7m21s, `deploy`
    itself 37s; `gh run rerun 35241351714 --job 105272696870` (that same
    run's `deploy` job) measured 31s, confirmed via `gh run view --json
    jobs` before/after. The comment originally landed with the dispatch's
    carried-over `12m11s` estimate (pre-B3-sharding) and was corrected in a
    follow-up commit (`446e45b`) once the real number was in hand.
  - gitleaks pinned: `git ls-remote https://github.com/gitleaks/gitleaks-action.git
    refs/tags/v2 'refs/tags/v2^{}'` resolved the tag to commit
    `ff98106e4c7b2bc287b24eaf42907196329070c7`; pinned with `# v2` alongside.
  - **T10/DP9**: `tools/check-site.mjs` split into `tools/check-site.lib.mjs`
    (`checks()` - the assertion list, `{path, test(body, meta), message}`;
    `runChecks(read, list)` - runs it over an injected reader, caching one
    read per path; `fetchReader(root)` - the live-URL transport;
    `dirReader(dir)` - a local-`_site/`-build transport that emulates GitHub
    Pages' own missing-path rule: a path not on disk is served as
    `404.html`'s content with status 404, which is what makes the 404
    checks below meaningful pre-deploy, not only post-deploy) and
    `tools/check-site.mjs` (the CLI: `<url>` keeps the six-try/10s-wait retry
    loop against `fetchReader`; `--dir <path>` runs once against `dirReader`,
    no retry). `tools/check-site.test.mjs` (`node --test`) covers `checks()`
    against an in-memory good site and three broken ones (no root/falls
    through to 404, a truncated `assets/app.js`, a stub with no `og:image`),
    the two 404-fallback checks against a good and a fallback-less site, and
    `dirReader` against a real temp directory. The deploy guard's seven
    hand-written `grep`/`wc` content-assertion lines (the ones that had
    already drifted from `check-site.mjs` once) are now one step, `node
    tools/check-site.mjs --dir _site`; the two `cmp` byte-identical checks
    stayed in bash per the plan.
  - **T6**: `tests/app/golden.js` exports its DOM-free half (`KEEP_KEYS`,
    `collapse`, `normUrl`, `clean`, `sigOf`, `elisionOf`, `capName`,
    `lineFor`, `controlLine`, `serializeTree`, `headerOf`, `sectionsOf`,
    `compareGolden`, `slugOf`) at module scope; `require('./lib.js')`
    (puppeteer + the `dist/` existence check) and everything that calls it
    (`captureLang`, `waitForToast`, `captureState`, `render`, the top-level
    IIFE) moved inside `if (require.main === module)`. `compareGolden` took
    `ok` as an explicit parameter instead of a module-level closure, so it
    has no dependency on `lib.js` at all. `tests/app/golden.test.mjs` (`node
    --test`, 16 cases) covers rule A at 5 vs 6 siblings, rule B at 63/64/65
    code points (including that two names differing only past the cut do
    not hash the same), joined-vs-split text nodes, `normUrl` on both a
    `dist/index.html` url and a real outbound link, a `headerOf`/`sectionsOf`
    round trip, and `compareGolden` on identical and differing text.
  - **R1** (routed here from the B3 review, `context.md`): `tests/derived.js`
    now parses the `browser:` job's own block and asserts
    `strategy.matrix.shard`'s length equals the divisor in `--shard=${{
    matrix.shard }}/<m>`, and that the list is exactly `1..m`. Verified it
    actually catches the silent break: temporarily shortened the matrix to
    `[1, 2, 3]` locally, reran `node tests/derived.js`, got the two expected
    `FAIL` lines, then restored the file (`git diff` clean afterwards -
    confirmed with `rtk grep -n "shard: \["`).
  - **`404.html`** (owner override of R8, `context.md` "Two further owner
    decisions"): authored and tracked at the repository root, no data in it.
    Bilingual on one page (Russian then English, not switched), `noindex,
    nofollow`, the same dark palette/font stack `tools/build-share-pages.js`
    already uses for the share stubs. Marker `id="app-404"` on its content
    div, matching `index.html`'s `id="app"` convention - what both
    `check-site.lib.mjs`'s probe and `docs/specs/META.md`'s new section
    check for. Added to the collect `cp` list and the existence-guard loop
    in `ci.yml`; `docs/specs/META.md` gained section 7 (old section 7,
    "Link previews...", renumbered to 8 - the one cross-reference to the old
    number, `docs/tg-preview.md:13`, was updated in the same commit).
    `docs/specs/COVERAGE.md` gained two paragraphs describing the new
    `node --test` suites, next to the existing `tg-preview`/`artwork`
    ones they follow the same pattern as.
- **Deviation from the plan's literal example, campsite fix for
  correctness**: plan step 11 says "a link to `./#/roll/std`" - a relative
  href. `404.html` can be served by GitHub Pages while the browser still
  shows an arbitrary, possibly nested bad path (e.g. `/daggerheart-loot/i/
  <bad-id>.html`), and a relative `./` link resolves against *that* path's
  own directory, not against `404.html`'s real location - `./#/roll/std`
  from `/i/<bad-id>.html` would resolve to `/daggerheart-loot/i/#/roll/std`,
  which is wrong. Used root-anchored paths instead
  (`/daggerheart-loot/#/roll/std`, `/daggerheart-loot/#/search`), which are
  correct from any depth. `file://` is not a constraint here - nothing links
  to `404.html` locally, it exists only as a Pages serving fallback -
  so `docs/specs/META.md`'s section 4 rule does not apply to it; recorded as
  such in the new section 7. Verified live (below), not just reasoned about.
- Files changed: `.github/workflows/ci.yml`, `.prettierignore`,
  `docs/specs/COVERAGE.md`, `docs/specs/META.md`, `docs/tg-preview.md`,
  `package.json`, `tests/app/golden.js`, `tests/derived.js`,
  `tools/check-site.mjs` (rewritten). New: `404.html`,
  `tests/app/golden.test.mjs`, `tools/check-site.lib.mjs`,
  `tools/check-site.test.mjs`.
- Commit(s): `0a3d9fb fix(phase-8): B4 - deploy and gate correctness, plus
  the owner-approved 404.html`, `446e45b docs(phase-8): correct B4's
  rollback comment with the real measured numbers` - both pushed.
- Verification commands and results:
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` (Bash timeout
    600000, foreground) - green, twice (once per commit): `format:check`,
    `lint`, `typecheck`, `node --check tools/check-site.mjs`, `npm run
    data`, `node tests/derived.js` (R1 included), `node
    .claude/hooks/selftest.mjs`, `node --test tools/tg-preview/lib.test.mjs`,
    `node --test tools/artwork/lib.test.mjs`, `node --test
    tools/check-site.test.mjs` (10 cases), `node --test
    tests/app/golden.test.mjs` (16 cases), `npm run test` (42 files, 1059
    tests, coverage 96.63/88.61/97.13/97.36 - thresholds green).
  - `npm run check:built` - green (`build`, `smoke`, `budget` - 89.3 kB
    gzip within the 120 kB budget).
  - Manual guard-step replay against a real `_site/` (mirroring the deploy
    job's own `cp`/checks by hand): all bash checks green, `stub_count=1091
    csv_rows=1091`, `node tools/check-site.mjs --dir _site` green; then
    broke `i/w1.html`'s `og:image` on purpose and confirmed `--dir _site`
    failed with exactly that message before restoring it.
- Push and CI (main): `git push origin main` (`ddbfe90..0a3d9fb`, then
  `0a3d9fb..446e45b`). First run `35241351714`: `check`, `browser (1-4)`,
  `audit`, `secrets`, `deploy` all green, including the new "Generated data
  actually matches what is committed" and "The published content is what
  tools/check-site.mjs expects" steps, and the live "The published site
  answers correctly" step (the 404 probes included). Second run
  `35242988241` (the rollback-comment fixup): green the same way, `deploy`
  in 30s.
- **The PR probe (DP4/T4 acceptance line)**: branch `probe/dp4-stale-data`,
  one appended stray line to `catalog.csv` with no `data.js` change, PR #66
  against `main`. Run `35243815863`: `check` job failed at exactly
  "Generated data actually matches what is committed" (`git diff
  --exit-code`), everything before it green, `deploy` correctly did not run
  (not a push to `main`, and `check` had failed anyway). Ran `node
  tools/build.js` on the branch (reverted the stray line), pushed again; run
  `35244848051`'s `check` job went green. Confirmed the PR run used its own
  `ci-refs/pull/66/merge` concurrency group, not `pages` (DP6). Closed PR #66
  without merging (`gh pr close 66 --delete-branch`) and confirmed via `git
  ls-remote --heads origin probe/dp4-stale-data` that the remote branch is
  gone.
- **The live `404.html` (B4's own acceptance line)**: `curl -s -o - -w
  "status=%{http_code}" https://artex-x.github.io/daggerheart-loot/
  nope-does-not-exist.html` - `status=404`, `content-type: text/html;
  charset=utf-8`, body contains `id="app-404"`, `noindex, nofollow`, and
  both `<h1>Страница не найдена</h1>` and `<h1>Page not found</h1>`. Proven
  twice: once by `tools/check-site.mjs`'s own live run inside the `deploy`
  job (both pushes), once by hand against the same URL from outside CI.
- Deferred/left alone: `app/src/lib/frames.ts`'s stale `TAB_LIST` identifier
  (routed to B5 by the dispatch); `docs/specs/COVERAGE.md`'s "fifth CI
  width" count (Deferred, per the dispatch). B3's review nits N2-N8 (the
  `run-all.js` weight comment, `ci.yml:48`'s artifact comment, `ci.yml:123`'s
  stale gating description, `sweep.js`'s completion message, the `--shard`
  stability comment, the empty-shard error message, `bash-guard.mjs`'s
  `--shard=` exemption) were **not** picked up in this batch - the dispatch
  listed them under B4's scope, but B4's own file list and step list
  (`plan.md`, "B4") do not touch any of `tests/run-all.js`, `tests/app/
  sweep.js`, or `.claude/hooks/bash-guard.mjs`, and the batch was already at
  its natural gate boundary (one `npm run check` plus one CI watch) before
  reaching them. Flagging this explicitly rather than silently dropping it:
  the next batch (or a small dedicated pass) should pick up N2-N8 before the
  terminal batch turns them into a pile, per this task's "nits are processed
  immediately" policy.

### B5 - single sources: lib, generator and components (A1, A3, A4, A5, A7, A9, A11, O5, O6, H5, C1/A2, C5, H6, H7, C2, C7, C8, D7) plus seven carried-over nits
- What shipped, by finding:
  - **A1**: `label.ts` deleted its own `GROUPS`/`SUBS` copy of the table
    taxonomy; `whereFrom` resolves the group label through
    `dict(lang)[groupOf(table).label]` and the sub label through
    `tables.ts`'s exported `SUB_LABEL`, both already used by
    `TablesPage.svelte`'s own chips. Every literal was verified
    byte-identical against the dict value before deleting it.
  - **A3**: `listLink.ts` imports `MoneyMode`/`MONEY_MODES`/`MONEY_DEFAULT`
    from `money.js` instead of a second declaration; re-exports the type so
    `lists.ts`/`ListPage.svelte`/`state/lists.svelte.ts` keep importing it
    from `listLink.js` unchanged.
  - **A4**: `roll.ts` imports `Rarity` from `money.js` and types
    `RARITY_ORDER` on it instead of deriving `Rarity` from its own array;
    `alt.ts`'s `RARITIES` is now `= RARITY_ORDER` (imported), closing the
    exact silent-failure path the finding named (an unextended `RARITY_ORDER`
    no longer diverges from `BUMP`'s domain, because there is only one list).
  - **A5**: `label.ts`'s private `EQ_TABLE` (`EquipKind -> TableId`) renamed
    `EQ_TABLE_OF` - `filters.ts`'s exported `EQ_TABLE` (`TableId ->
    EquipKind`) is a different map with the same name, untouched.
  - **A7**: `std.ts`'s `DICE` is now `Partial<Record<Rarity, ...>>` (typed
    import from `money.js`), closing the "a typo in a rarity key is not a
    compile error" hole the finding named; `NDICE`'s `Object.keys(DICE)` cast
    to `Rarity[]` for the lookup.
  - **A9**: `Record_.frame` is `FrameId` (types.ts now type-imports it from
    frames.ts; the two-way type-only import is erased, no runtime cycle) and
    `frameName`'s parameter is `FrameId`. Two callers that hand it an
    out-of-domain string keep a documented `as FrameId` cast:
    `label.ts`'s `srcName` fallback (any key not one of the five books is
    already assumed to be a frame id) and `frames.test.ts`'s own
    "unknown frame" fallback test. The tightening made a real dead branch
    provable: `srcLabel`'s `case 'frame': return it.frame ? ... : t.srcFrame`
    was flagged `no-unnecessary-condition` by eslint, because `it.frame` is
    checked and returned on earlier in the same function - simplified to
    `return t.srcFrame;` with a comment; `npm run lint` clean.
  - **A11**: `roll.ts` re-exports `clamp` from `numField.js` instead of its
    own `Math.max`/`Math.min` copy (same values, `roll.test.ts` unchanged);
    `print.ts`'s `DIE_ART` renamed `DICE_WITH_ART` (`dice.ts` already
    exports an unrelated `DIE_ART`); `PrintCard.svelte`'s one call site
    updated.
  - **O5/O6/"830"**: `build-share-pages.js`'s description now falls back to
    `''` before the newline-flatten (`rawDesc = it.rud || it.ende || ''`);
    the visible paragraph is now one `<p>` per source line (a new
    `descHtml()`) instead of the raw multi-line string glued into one `<p>`,
    fixing the run-on rendering the finding named for `i/w6.html`'s "- "
    list lines (verified by inspection after `npm run data`); the stale
    "830" comment corrected to "1091"; `EQ_TYPE`/`EQ_TRAIT`/`EQ_RANGE`/
    `EQ_DT`/`EQ_CLS`/`EQ_BURDEN` added to `module.exports`.
  - **H5**: `i18n.test.ts` gained a `describe` that `createRequire`s
    `tools/build-share-pages.js` and asserts each of its six `EQ_*` maps
    equals the `ru` half of `i18n.ts`'s own `Pair`s, key for key - the guard
    the file's own header comment said did not exist. All six matched
    byte-identical on the first run.
  - **A2/C1**: `AppState.copied(run, ok)` (awaits `run()`, toasts `ok` or
    `t.copyFailed` with `error: !ok`) replaces all fourteen
    `env.clipboard`-site handlers; the ten `const say = (msg, error) =>
    app.say(msg, { error })` shims and the `say` prop on `PageHead`/
    `RecordActions` are deleted - each caller now calls `app.say(...)`
    directly for a plain toast, or `app.copied(...)` for a clipboard result.
    `state/lists.test.ts:19`'s shim is a test double for `ListStore`'s
    constructor injection, a different pattern; left alone per the dispatch.
  - **C5/H6/H7**: `--ink-on-gold: #1a1206` in `tokens.css` replaces all
    eight literal occurrences (`Button.svelte` x2, `Chip`, `DiceBar`,
    `HelpButton`, `PageHead`, `Seg`, `Toast`); `--gap`, `--gap-lg`,
    `--step--1`, `--step--2`, `--step-1`, `--step-2` deleted (verified zero
    `var()` readers each); the page-heading comment moved to sit directly
    above `--h-page-*` (it previously sat above `--wrap` instead, describing
    declarations three lines below it) and its last sentence corrected to
    what `tests/app/typo.js` actually measures (a hardcoded scale list, not
    these tokens); the `:56` "one scale" comment rewritten to describe the
    file now that only `--step-0` remains under it.
  - **D7**: `Chip.svelte`'s `.chip small` and `ListPage.svelte`'s `.nlbl i`
    each lost their `opacity: 0.72`/`0.75` decoration, leaving `--muted`/
    `--muted2` at full strength (already AA per `tokens.css`'s own
    contrast comment); `sweep.js`'s `color-contrast` allow for
    `#/roll/alt`/`#/lists/a` deleted; `docs/specs/DEBT.md`'s D7 entry
    deleted per its own "the batch that pays an entry off deletes it" rule
    (a numbering gap, same convention as D9). Verified by `node
    tests/app/sweep.js 768` reporting no `color-contrast` violation with the
    allow gone.
  - **C2**: `Badge.svelte` (`cls`, `title?`, `children: Snippet`, a one-line
    `<span class="badge {cls}" {title}>{@render children()}</span>`) holds
    the base rule plus eleven variants (the nine the plan named -
    `item`/`cons`/`eq-weapon`/`eq-secondary`/`eq-armor`/`uniq`/`tier`/`src`/
    `num` - plus `hope`/`fear`, RecordCard's own die-result badge, folded in
    too once RecordCard's *entire* local `.badge` block was going to be
    deleted anyway - leaving it behind would have meant a second, smaller
    `.badge` base-rule copy surviving in that file, the exact defect being
    fixed). Replaces all `.badge`-classed markup and CSS in `RecordCard.svelte`
    (four spans), `RowMain.svelte` (two spans, inside its documented
    whitespace-critical `.rm` run - converted tag-for-tag with identical
    hugging, no whitespace added or removed) and `ListsPage.svelte` (one
    span, inside a `<!-- prettier-ignore -->` block, same tag-for-tag
    treatment). `--badge-bg`/`--gold-rgb` added to `tokens.css` while the
    rules moved. `a11y.test.ts`'s `COVERED` guard gained a `Badge.svelte`
    entry; `badge.test.ts` added (title present/absent, a rerender that
    changes both `cls` and `title`) after `npm run test` flagged 50% branch
    coverage on the file's one attribute-update path - structurally the
    same ceiling `Button.svelte`/`DiceBar.svelte` already document, so
    `vite.config.mts` gained a matching named exception at 50% branches
    rather than lowering the general 75% floor.
  - **C7**: `NumRow.svelte` (`children: Snippet`, `<div class="numrow">`)
    replaces the five copies in `AltPanel`/`RollPanel`/`StdPanel`/
    `ListPage`/`ListsPage` (`ListsPage` has two markup uses). The named
    scoping trap: `ListsPage.svelte`'s `.numrow .grow` selector would have
    matched nothing once `.numrow` belonged to a different component (Svelte
    scopes CSS per component); changed to a bare `.grow` selector, which
    still only matches `.grow` inside that file's own two `NumRow` children.
    `.results { margin-top: 26px }` (three lines, duplicated in
    `AltPanel`/`RollPanel`/`StdPanel`) left in place per the plan, each
    given a one-line comment cross-referencing the other two rather than
    extracted into a component.
  - **C8**: `App.svelte`'s route chain restructured to an outer `{#if
    app.route.kind === 'section'}`, `{@const cfg = ROLL_TABLE[app.route.section]}`,
    `{#if cfg}` - `RollPanel` now reads `cfg.table`/`cfg.title` directly
    instead of repeating the `ROLL_TABLE[app.route.section]` lookup three
    times with unreachable `?? ''`/`?? 'pageWondrous'` fallbacks.
  - **frames.ts nit** (routed here by B4's dispatch): the header comment's
    `` `SECTIONS`/`TAB_LIST` `` corrected to `` `SECTIONS` `` alone -
    `TAB_LIST` names nothing in this codebase (`app.test.ts:68`'s own
    `TAB_LIST` mention cites the *live app's* `app.js` identifier
    historically and was left alone; only the current-codebase claim was
    wrong).
  - **Seven carried-over nits** (B3/B4 review, re-derived by content per the
    orchestrator's mid-task correction rather than by the stale line numbers
    the dispatch first carried):
    - `tests/run-all.js`'s weight-table comment corrected to record the
      371.9s/172.7s re-measurement and B3's finding that re-weighting the
      table would not change predicted wall clock, without touching the
      `275`/`275` values themselves.
    - `tests/run-all.js` gained one paragraph on why `Array.prototype.sort`'s
      stability is load-bearing (this table has two exact ties: the
      `app/sweep` 1180 rows and `dataint`/`derived`).
    - `tests/run-all.js`'s empty-queue message now names the shard as the
      cause when `--shard=` produced an empty bin, instead of always
      printing "no such suites" with an empty name list.
    - `.github/workflows/ci.yml`'s failure-artifact comment corrected: it
      claimed the upload is "only ever `coverage/`", when the same path list
      also carries `dist/`, which a failed Build/smoke/budget step (all
      three run after `npm run check`, in the same `check` job) leaves
      behind.
    - `.github/workflows/ci.yml`'s "Publishing, gated on ... structural
      goldens" comment corrected to name the `browser` job (B3 folded the
      separate `golden` job into it; `needs:` already read `[check, audit,
      secrets, browser]`).
    - `.claude/hooks/bash-guard.mjs`'s long-check reminder no longer exempts
      `node tests/run-all.js --shard=`: a run-all shard packs a whole
      `browser`-matrix row (a local `--shard=4/4` measured 384s), unlike
      `golden`/`sweep`'s own per-state/per-width shard args, which stay
      exempt. `.claude/hooks/selftest.mjs` gained case #31 proving the
      reminder now fires for `node tests/run-all.js --shard=1/4`; full
      selftest still 330/330.
    - `tests/app/sweep.js`'s completion message now names the actual
      widths/languages a narrowed run covered instead of always claiming
      "all widths and languages".
  - **Campsite, in the same touched files**: `ci.yml`'s `check` job checkout
    had `fetch-depth: 0 # gitleaks reads history, not just a snapshot` - the
    comment was wrong (gitleaks runs only in the separate `secrets` job,
    which already sets its own `fetch-depth: 0`); the stale comment deleted,
    the setting itself left alone (no evidence `check` needs shallow vs. full
    history either way, and changing the value is a behaviour question the
    dispatch did not ask for).
  - **Not taken, and said so rather than silently dropped**: B4's review
    also named `ci.yml`'s DP2 stub-count check reading the repo-root
    `catalog.csv` instead of `_site/catalog.csv` - the dispatch scoped this
    to "only if you are already editing that region"; this batch's `ci.yml`
    edits were the checkout step and the two comments above, a different
    region, so it was left untouched.
- Files changed: `.claude/hooks/{bash-guard,selftest}.mjs`,
  `.github/workflows/ci.yml`, `app/src/App.svelte`,
  `app/src/components/{AltPanel,Button,Chip,DiceBar,HelpButton,ListPage,
  ListsPage,PageHead,PrintCard,PrintPage,RecordActions,RecordCard,
  RecordModal,RecordPage,RollPanel,RowMain,SearchPage,Seg,SelBar,StdPanel,
  TablesPage,Toast}.svelte`, `app/src/components/a11y.test.ts`,
  `app/src/lib/{alt,frames,label,listLink,print,roll,std,types}.ts`,
  `app/src/lib/{frames,i18n}.test.ts`, `app/src/state/app.svelte.ts`,
  `app/src/styles/tokens.css`, `docs/specs/DEBT.md`, `tests/app/sweep.js`,
  `tests/craft.js`, `tests/run-all.js`, `tools/build-share-pages.js`,
  `vite.config.mts`. New: `app/src/components/{Badge,NumRow}.svelte`,
  `app/src/components/badge.test.ts`.
- Commit(s): `112bd07 refactor(phase-8): B5 - single sources for lib,
  generator and components`, `571b041 fix(phase-8): B5 - craft.js's
  stub-staleness probe survives a multi-line description` - both pushed.
- Deviations and rationale:
  - Badge.svelte carries eleven variants, not the nine the plan's step list
    named - see the C2 entry above; the extra two (`hope`/`fear`) were
    RecordCard's own die-result badge, not one of the three duplicated
    copies the finding described, but leaving them un-migrated would have
    required keeping a second, smaller `.badge` base-rule copy alive in
    RecordCard specifically to serve them - reintroducing the defect this
    step exists to remove. All four golden shards proved the swap moves no
    rendered bytes.
  - `vite.config.mts` gained a named coverage-threshold exception for
    `Badge.svelte` (50% branches) - not in the plan's file list, but
    `npm run test` fails without it once the file exists, for the same
    structural reason `Button.svelte`/`DiceBar.svelte` already have one.
  - Two of B4's review findings (the `ci.yml` checkout `fetch-depth`
    comment, and DP2's `catalog.csv` path) were folded in or explicitly
    declined per the orchestrator's own "campsite fix if you are in that
    area, otherwise leave it and say so" instruction mid-task - see above.
  - **CI caught a real regression the local gates did not**: the first push
    (`112bd07`) failed CI's `browser (1)` job at the `craft` suite - "stubs
    out of date: voa1_t1a, voa1_t1c, voa1_t1e, voa1_t1g, voa1_t1h". Cause:
    `tests/craft.js`'s own staleness probe (separate from, and weaker than,
    `tests/derived.js`'s exhaustive regenerate-and-diff, which stayed green
    throughout) checked a raw 40-character prefix of each record's
    description against the stub file; five Vault of Ages records open with
    a "Стоимость Призыва: N" line under 40 characters, and O6's per-line
    `<p>` rendering turned the `\n` after it into a paragraph break, so the
    old raw-prefix probe no longer matched. `craft.js` was not in this
    batch's own gate list (`derived,dataint,stub,app/typo,app/hues` -
    `plan.md`, "B5", "Gates" - never named it), which is why this was not
    caught before pushing. Fixed in `571b041`: the probe now takes only the
    first line, capped at 40 characters. The same push's `browser (1)` job
    also failed `app/states`' two-window storage-sync case ("страница B не
    получила событие storage за 30с") - untouched by this batch's diff (no
    storage/list-sync file changed) and did not recur on the next push,
    consistent with `context.md`'s documented class of CI host-contention
    flake; treated as such rather than investigated further, per that
    section's own "prove by isolation" rule (the re-run *was* the isolation
    proof - a different push, same code for that suite, clean the second
    time).
- Review: required (this task's own policy - `context.md`, "Review and nit
  policy for this task" - mandates a reviewer on every phase-8 batch
  regardless of the standard triggers; separately, this batch touches
  generated share-page output (O5/O6) and a public-ish CSS custom-property
  surface (`tokens.css`), which are this task's generated-artefacts and
  styling-surface triggers).
- Verification commands and results:
  - `npm run typecheck`, `npm run lint`, `npm run format:check` - each run
    standalone during development; one lint error surfaced by the A9
    tightening (see above) and one format diff (3 files) were fixed before
    the runs below.
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` (Bash timeout
    600000, foreground) - green: `format:check`, `lint`, `typecheck`, `node
    --check tools/check-site.mjs`, `npm run data` (1091 share pages
    written), `node tests/derived.js`, `node .claude/hooks/selftest.mjs`
    (330 passed, including the new #31), `node --test
    tools/tg-preview/lib.test.mjs`, `node --test tools/artwork/lib.test.mjs`,
    `node --test tools/check-site.test.mjs`, `node --test
    tests/app/golden.test.mjs`, `npm run test` (43 files, 1068 tests,
    coverage 96.64/88.99/97.22/97.33 - all thresholds green including
    `Badge.svelte`'s new 50%-branch exception).
  - `npm run check:built` - green (`build` including the regenerated share
    pages, `smoke`, `budget` - 88.7 kB gzip within the 120 kB budget).
  - `node tests/run-all.js derived,dataint,stub,app/typo,app/hues` - all
    five green (89s pooled, 8 threads).
  - `node tests/app/sweep.js 768` - clean, message reads "чисто на 768 (ru,
    en)" (the new scoped-completion-message fix), no `color-contrast`
    violation on `#/roll/alt` with the D7 allow removed.
  - Four golden shards, one foreground call each: `--shard=1/4` (28 states,
    116.3s), `--shard=2/4` (28 states, 129.5s), `--shard=3/4` (27 states,
    108.4s), `--shard=4/4` (27 states, 108.7s) - all four "без изменений"
    (no changes). This is the batch's own proof that none of the Badge/
    NumRow/App.svelte/label.ts/tokens.css changes moved a rendered byte.
- Push and CI: `git push origin main` twice (`39da6ae..112bd07`, then
  `112bd07..571b041`). First run `35255169877`: `check`/`audit`/`secrets`
  green, `browser (2)`/`browser (3)` green, `browser (1)` FAILED (`craft` and
  `app/states`, see the deviation above); `deploy` correctly did not run
  (gated on all four `browser` jobs). Second run `35256262165`, after the
  `craft.js` fix: `check`, all four `browser` shards, `audit`, `secrets` and
  `deploy` all green (`browser` jobs 5m35s-6m34s each); the live site's own
  post-deploy check ("The published site answers correctly") passed. This
  handoff's own docs commit (`571b041..17ac157`) triggered a third run,
  `35257445596`, also fully green including `deploy` - the code boundary
  this batch leaves is CI-verified twice over.

### B6 - router, state and lists (P1, D19, P11, S2/R7, S1, S3/D2/R10, S6, R5, R9, R4-2, DC1, R1, R2, S4, S5, S7, R3/P9, R4-1/PF3, D23, D12, A6, P5)
- What shipped, by finding, commit 1 (`370fec2`):
  - **P1**: the skip link's `onclick` calls `preventDefault()` and moves
    focus to `#main` directly, rather than letting the browser's own
    fragment jump route `#main` through the SPA's hash parser (which reads
    it as `unknown` and would have replaced it with the home section,
    clearing the person's selection).
  - **D19**: `.skip:focus` is now the live app's own gold-plate overlay
    (`position` unset from `static`, `top/left/z-index/background/color/
    font-weight/padding/border-radius`) instead of a grey inline chip that
    pushed the header down while focused. `--ink-on-gold` (added in B5)
    reused. `DEBT.md` D19 deleted; `FEATURES.md` "Chrome" gained a clause.
  - **P11**: `TabBar` gained an effect that reads `nav.querySelector('a.on')`
    and sets `nav.scrollLeft` from `offsetLeft`/`offsetWidth`/`clientWidth`
    arithmetic (centring the lit tab, clamped at 0) rather than
    `scrollIntoView`, which risked carrying an ancestor scroll along and
    whose `block`/`inline` options answer "visible", not "centred". New
    `tabBar.test.ts` (3 cases) drives it with hand-set geometry, since jsdom
    has none, and asserts `scrollIntoView` is never called.
  - **S2/R7**: `go()` now resolves its hash through the same `#fallback` the
    router's own `onChange` handler already uses, closing the one path
    (a hash this class itself builds) that bypassed it. `App.svelte` gained
    a catch-all `{:else}` (the record route's own not-found block, reused)
    and the smallest `<svelte:boundary>` around the page slot, with a
    `failed` snippet naming the error and a reset button (`pageError`/
    `reloadPage`, two new dict keys) - the general error-handling framework
    (`window.onerror`, `unhandledrejection`) stays out of scope per
    `resilience.md`'s own "Noted, out of scope"; this is only the local
    patch for R7's specific gap. New `app/src/errorBoundary.test.ts` forces
    a real throw (mocking `filters.ts`'s `groupsFor`, file-scoped via
    `vi.mock` so no other test's `#/tables/...` route is affected) and
    proves the boundary catches it and `reset` recovers.
  - **S1**: `AppState` gained `#expectHash`; `go()` sets it before
    `navigate()`, and the router's `onChange` handler skips processing when
    the incoming hash matches it (clearing it either way) - closes the
    double-count `start()` + `go()` together used to produce (unreachable by
    any test before this batch, since none exercised both at once).
  - **S3/D2/R10 (Q4 settled)**: `#expand()` now captures the packed payload
    and a `stillHere()` check re-read at resolve time; both the success and
    failure paths drop the result if the route has moved on. A failure (the
    port cannot unpack, or hands back a still-packed marker) sets
    `expandFailed = payload` instead of replacing the address with
    `#/l/zzzz` - `ListPage.svelte` draws the bad-link page
    (`route.packed && app.expandFailed === route.payload`) with the address
    left exactly where it was. `DEBT.md` D2 deleted; `FEATURES.md` "Lists"
    gained a clause. New golden `#/l/~AAAA` (valid base64url, invalid
    deflate) via a new `driver.js` helper, `expandFailed()` (waits for any
    `main h1`, since `expanded()`'s own wait - "hash stops starting with
    `#/l/~`" - would spin forever here). `app.test.ts`'s two old
    `#/l/zzzz` packed-failure tests rewritten for the new shape, plus a
    third proving a stale failure does not leak into a later, different
    route.
  - **S6**: `stop()` now also calls `hideToast()`. `route`/`section` changed
    from getters to `$derived` fields - both are read several times per
    render and a getter re-parsed the hash on every one.
  - **R5**: `hash.ts`'s plain shared-list regex narrowed from
    `/^l\/[A-Za-z0-9_-]+$/` to `/^l\//` - a stray trailing character (a chat
    client swallowing a full stop is the reachable case) no longer falls to
    `unknown` and gets replaced home; it now reaches the shared-list page,
    which draws its own bad-link state for a payload that will not decode.
    `ROUTES.md` gained a clause; `routes.json` gained the first `#/l/` row
    (`#/l/ABC.`) the fixture set has ever had.
  - **R9 (Q3 settled)**: a *named* table that resolves to neither an alias
    nor a `TableId` now returns `{ kind: 'unknown' }` instead of being
    silently ignored (the table already on screen kept) - one rule for
    every unreadable address, matching Q3. A bare `#/tables` (no name
    segment) is unaffected. `readHome`/`#fallback` needed no changes - both
    already treat `unknown` as home-bound. `routes.json` gained
    `#/tables/nosuch`; two `hash.test.ts` cases rewritten (the old
    "not swapped for a default" and "an unknown table takes no legacy
    reading" tests asserted the now-superseded behaviour) plus a new one
    proving a bare `#/tables/f_kind-item` is unaffected.
  - **R4-2**: `router.ts`'s `replace()` wraps `history.replaceState` in
    try/catch, falling back to assigning `location.hash` on a throw - covers
    WebKit's 100-calls-per-30s limit (paired with R4-1/PF3's debounce in
    commit 2, which is what actually approaches that limit). New
    `ports.test.ts` case with a `replaceState` that throws.
  - **DC1 (Q1 settled - restored)**: `AppState` gained `#tablesView`/
    `tablesView`/`setTablesView`, read from `dhloot.prefs.v1` at
    construction (bad or missing value falls back to `'list'`) and written
    on change. `TablesPage.svelte`'s local `let view = $state(...)` became
    `const view = $derived(app.tablesView)`, and the `Seg`'s `onchange`
    calls `app.setTablesView` instead of a local assignment. New
    `app.test.ts` describe block (4 cases: default, stored, four bad
    values, write-through).
  - **D5/O3 - implemented, verified, then reverted.** Built exactly as
    planned: `document.title` = `<name> — <docTitle>` on a record,
    `<section label> — <docTitle>` on a section (a new `SECTION_LABEL`
    exhaustive map in `dict.ts`, mirroring `TabBar`'s own section/label
    pairing), `<list name> — <docTitle>` on an owned list (keyed off
    `app.openList`, not `route.kind === 'storedList'`, because `ListPage`'s
    own mount effect already rewrites that address to the players' payload
    before anything downstream can see the original kind), plain elsewhere.
    Four new `shell.test.ts` cases, all green in isolation. **Then backed
    out of this commit**, discovered by running the batch's own golden
    gate: `tests/app/golden.js`'s accessibility snapshot records
    `document.title` as the `RootWebArea` node's own accessible name -
    verified directly against `tests/app/snapshots/_i_ci1.txt` (shows the
    *plain* title today, on a record page, which is D5's own bug, captured
    byte for byte) - so a per-route title moves that line for every
    section/record/list state. Proven empirically: `node tests/app/
    golden.js --only="i/ci1"` moved 14 cells the instant the fix landed,
    none of them one of this batch's two authorised new states, directly
    against the dispatch's own "nothing else moves" gate and its explicit
    "stop and report" instruction for exactly this situation. Reverted:
    `Shell.svelte`'s title effect back to the plain `app.t.docTitle`, the
    `SECTION_LABEL` export removed from `dict.ts` (nothing else used it),
    `shell.test.ts`'s four new cases and the "follows the language" test's
    title assertion reverted, `FEATURES.md`'s D5 rewrite reverted, `DEBT.md`
    D5 **not** deleted - re-added with a new closing paragraph naming this
    finding and the three options below. Left for a human/orchestrator to
    choose before D5/O3 is attempted again:
    1. Normalise `document.title`/the `RootWebArea` name out of what
       `tests/app/golden.js`'s `clean()` captures (it is already covered
       precisely by `shell.test.ts`'s own assertions; the golden tree
       reflecting it is incidental noise, not signal) - lands D5/O3's fix
       with no golden movement, but touches shared harness code and would
       need its own review of whether *any* other batch relies on the
       title showing up in a captured tree.
    2. Accept the golden movement as this specific finding's own payoff and
       re-record the affected cells in the same change that lands D5/O3 -
       against this task's own "nothing else moves" policy for B6, but
       consistent with how B7 (the batch that re-records) already handles
       comparable cases.
    3. Move D5/O3 into B7 outright, alongside the other re-record work, so
       the golden movement is attributed to and reviewed as part of the
       batch that already expects it.
- What shipped, by finding, commit 2 (`11066f0`):
  - **R1**: `ListStore` gained a private `#readCurrent()` that both `load()`
    and `save()` now call - it distinguishes "the key is absent" (`null`)
    from "the key holds something that will not parse" (backs the raw
    value up under `dhloot.lists.v2.bad`, once - checked via `get() ===
    null` first - and sets a new `unreadable` field). Closes the exact
    defect named in the dispatch: `save()` used to catch the same parse
    failure independently and silently overwrite the only copy of whatever
    was actually there. `StorageNotice.svelte` gained a third, undismissable
    branch (`app.lists.unreadable`, checked ahead of the ordinary
    "lists live here only" disclosure) with two new dict keys
    (`badStorageTitle`/`badStorage`). `STATE.md` gained the `.bad` key row.
    Five new `lists.test.ts` cases (absent vs corrupt, the backup, the
    once-only guard, the corrupt-mid-session case proving the tab's own
    edit is not lost either, and `unreadable` clearing once the key is
    readable again) plus one `listsPage.test.ts` component case. New golden
    `#/lists ~ unreadable storage`, deliberately *not* seeded in commit 1
    (where the state was scaffolded ahead of its own implementation) -
    seeded in this commit instead, once the real behaviour existed to
    capture.
  - **R2**: `browserStorage`'s `onExternalChange` also listens on
    `visibilitychange` (fires `null` when the tab becomes visible again)
    and `pageshow` (a bfcache restore, also `null`) - a backgrounded tab is
    not guaranteed a `storage` event in most browsers, which is what let a
    stale phone overwrite a desktop tab's newer edits or resurrect a
    deletion. The `storage` handler itself no longer drops a `null` key
    (`localStorage.clear()`'s own shape). `StoragePort.onExternalChange`'s
    type widened to `(key: string | null) => void`; `ListStore.watch()`
    reloads on the lists key or `null`. `memoryStorage` gained
    `fireExternalChange` as an explicit test hook, replacing the ad hoc
    capturing wrapper `state/lists.test.ts` had built for itself (now used
    directly, and by the two new S7 page-level tests). `STATE.md`'s "Two
    tabs" section gained a paragraph. `ports.test.ts`'s old single test
    replaced with five covering all three listeners, the `null` path, the
    hidden-tab no-op, and full unsubscribe.
  - **S4**: `ListPage.svelte`'s `seedText` action gained an `update` that
    re-seeds through `.value` (not `textContent`, which stops reaching a
    field's live value once the browser's "dirty value" flag is set) when
    the field is not focused and the incoming text differs from what is
    already there. The mount-time `textContent` write is untouched, which
    is what keeps `tests/app/inventory.js` reading live names from noted
    fields.
  - **S5**: `#readCurrent()` filters `this.#deleted` on every read (not only
    inside `save()`'s merge), so a plain reload (`watch()`'s own path) does
    not resurrect a list this tab already removed from a stored snapshot
    another tab has not caught up to deleting. New `lists.test.ts` case.
  - **S7**: two page-level tests close the gap the dispatch named - no test
    previously fired a storage event into a *mounted* page.
    `listPage.test.ts` fires one with a changed note and asserts an
    unfocused field re-seeds (S4) while a focused one does not;
    `listsPage.test.ts` fires a `null`-key one and asserts the index
    redraws with another tab's added list (R2's general trigger, on a
    second page type).
  - **R3/P9**: `listLink.ts`'s `parseItems` now counts `dropped` (an id
    `knows` rejects) alongside `ids`/`meta`; `decodeList`'s `DecodedList`
    carries it through. `ListsPage.svelte`'s `restore()` passes `money`/
    `note`/`hnote` through to `create()`'s `init` instead of dropping them
    (`R3`'s own bug - `ListStore.create` already accepted all three) and
    toasts the dropped count when non-zero (new `droppedItems` dict key,
    `%n` placeholder); `SharedListPage.svelte` toasts the same count once
    per distinct payload (`toldFor`, not a component-lifetime flag, since
    this page is never remounted between two plain shared-list addresses).
    Also clamped in the same `parseItems` pass, since it reads the same
    per-entry qty/gold: an entry's `qty`/`gold` from a decoded link is
    capped at 99/99999, the same maxima the list page's own fields carry -
    closing a related gap (a crafted or hand-edited link could otherwise
    write past what typing into the field could ever produce). New
    `listLink.test.ts` cases (dropped count, zero-dropped, the clamp),
    `listsPage.test.ts` (money/note/hnote pass-through plus the toast), and
    `sharedListPage.test.ts` (the toast, rows still shown).
  - **R4-1/PF3**: `ListPage.svelte`'s own-list-URL effect no longer calls
    `app.syncListUrl` directly; `scheduleUrlSync` debounces the call 150ms
    trailing, `flushUrlSync` runs a pending one immediately on `onDestroy`
    and on a new `pagehide` listener, and `cancelUrlSync` (used only by
    `del()`) drops one outright with no flush. The three-function split was
    forced by a real bug caught while testing: `flushUrlSync` reads `own`
    fresh, and Svelte does not re-run a dying component's own `$derived`s
    during teardown - reading `own` from inside `onDestroy` right after
    `del()` deletes the list and navigates away returned the *stale*,
    pre-deletion list, and flushing it put the deleted list's own payload
    back into the address bar immediately after `app.go('#/lists')` had
    already set it correctly. `del()` now calls `cancelUrlSync()` before
    removing the list, which is correct because that staleness is *only*
    wrong for the exactly-just-deleted case - for every ordinary navigation
    away from a list that still exists, `flushUrlSync`'s stale-but-accurate
    read is exactly what should be written. New `listPage.test.ts` case:
    twenty rapid keystrokes into a note produce exactly one `replace` call
    (spied on the router), the storage write staying synchronous on every
    keystroke; two existing tests that asserted `router.hash()`
    synchronously right after an edit now `await waitFor(...)`.
  - **D23**: `ListPage.svelte` gained an effect clearing `lsel` on
    `app.navigations` - Back/Forward between two different list addresses
    does not remount the component (Svelte only remounts between different
    *route kinds*), so the ticked selection and open batch bar used to
    survive onto a list whose rows were never ticked. `DEBT.md` D23
    deleted. New `listPage.test.ts` case (tick on list `a`, `router.navigate`
    to list `b`, assert nothing is ticked).
  - **D12 (owner ruling, kept)**: no code change - `Chip.svelte` already
    gives every chip `aria-pressed`, money picker included. New
    `listPage.test.ts` assertion pinning it on both modes. `DEBT.md` D12
    deleted.
  - **A6**: `applyGuess`/`repriceTicked`/`clearPrices` (each: loop the
    ticked ids, compute a new gold value, remember the old one, write it,
    toast a count with an undo) folded into one private `goldEdit(next,
    msg)`; each caller supplies only its own per-id rule and message,
    `applyGuess` alone also folding its panel when `goldEdit`'s return
    count is non-zero. Toast strings unchanged (verified via existing
    tests, unedited).
  - **P5**: `ListStore.remove()` now returns `{ list, index } | undefined`
    (an id already gone stays `undefined`); `restoreList(list, index)` is
    the undo (splices back, un-sets `#deleted`, saves). Both `ListPage` and
    `ListsPage`'s `del()` toast a new `listDeleted` dict key with an undo
    action. `AddToList.svelte`'s tick-chip untoggle (removing one id from a
    list) gains the same treatment through the *existing* `restoreEntry`
    (captures `at`/`meta` before removing). Five `state/lists.test.ts`
    cases, three `listPage.test.ts`/`listsPage.test.ts`/`lists.test.ts`
    component cases (including one proving the undo restores an entry's
    own meta, not just its id). `FEATURES.md` "Lists": "delete, with undo".
    Not touched: `deleteConfirm`'s own "cannot be undone" wording, now
    slightly imprecise within the 7s undo window - out of this step's
    literal scope (only `listDeleted` was named), flagged here rather than
    changed unbidden.
  - **Ride-alongs**: `ListStore.create()` returns `this.lists[0]` (the
    `$state`-proxied object) instead of the plain pre-assignment object -
    the two were only ever `.toEqual`, never `.toBe`, before; the affected
    `lists.test.ts` case updated. `AppState.storageWorks` caches the one
    `env.storage.works()` probe at construction instead of `StorageNotice`
    re-probing (a write and a delete) on every mount.
- Files changed, commit 1: `app/src/App.svelte`, `app/src/components/
  {ListPage,Shell,TabBar,TablesPage}.svelte`, `app/src/components/
  {listPage,shell}.test.ts`, `app/src/lib/{dict,hash}.ts`,
  `app/src/lib/hash.test.ts`, `app/src/ports/router.ts`,
  `app/src/ports/ports.test.ts`, `app/src/state/app.svelte.ts`,
  `app/src/state/app.test.ts`, `docs/fixtures/urls/routes.json`,
  `docs/specs/{DEBT,FEATURES,ROUTES}.md`, `issues/phase-8/plan.md`,
  `tests/app/driver.js`, `tests/app/inventory.js`. New:
  `app/src/components/tabBar.test.ts`, `app/src/errorBoundary.test.ts`,
  `tests/app/snapshots/_l_AAAA.txt`.
- Files changed, commit 2: `app/src/components/{AddToList,ListPage,
  ListsPage,SharedListPage,StorageNotice}.svelte`, `app/src/components/
  {listPage,lists,listsPage,sharedListPage}.test.ts`, `app/src/lib/dict.ts`,
  `app/src/lib/listLink.ts`, `app/src/lib/listLink.test.ts`,
  `app/src/ports/{index,storage,types}.ts`, `app/src/ports/ports.test.ts`,
  `app/src/state/app.svelte.ts`, `app/src/state/app.test.ts`,
  `app/src/state/lists.svelte.ts`, `app/src/state/lists.test.ts`,
  `docs/specs/{DEBT,FEATURES,STATE}.md`. New: `tests/app/
  snapshots/_lists_unreadable_storage.txt`.
- Commit(s): `370fec2 fix(phase-8): B6 commit 1 - shell, router and state
  (P1, D19, P11, S2/R7, S1, S3/D2/R10, S6, R5, R9, R4-2, DC1)`, `11066f0
  fix(phase-8): B6 commit 2 - lists and two tabs (R1, R2, S4, S5, S7,
  R3/P9, R4-1/PF3, D23, D12, A6, P5)` - both pushed.
- Deviations and rationale:
  - **D5/O3 implemented, verified, then reverted** - the one deviation from
    the dispatch's literal step list, and the dispatch's own named
    stop-and-report condition. Full evidence and the three options are in
    the commit-1 write-up above and in `docs/specs/DEBT.md` D5 (kept open,
    not deleted).
  - **A real bug found and fixed beyond the plan's literal words**:
    `flushUrlSync`'s stale-`own`-during-teardown interaction with `del()`
    (R4-1/PF3 write-up above) - the plan's own step 18 named the debounce
    and the flush-on-destroy/pagehide requirement, but not this specific
    interaction; `del()`'s `cancelUrlSync()` call is the fix, caught by the
    new twenty-keystrokes test's neighbouring "delete toasts an undo" test
    failing empirically, not by inspection.
  - Left untouched, noticed in passing: `deleteConfirm`'s RU/EN text still
    reads "cannot be undone"/`необратимо`, now imprecise for the 7-second
    undo window P5 adds. Not part of P5's named acceptance line
    (`listDeleted` only); recorded rather than changed unbidden.
- Verification commands and results:
  - `set -o pipefail; npm run check 2>&1 | tail -n 200` (Bash timeout
    600000, foreground) - green after commit 1: `format:check`, `lint`,
    `typecheck` (550 files, 0 errors), `npm run data`, `node
    tests/derived.js`, `node .claude/hooks/selftest.mjs`, the `node --test`
    suites, `npm run test` (45 files, 1090 tests, coverage
    96.51/89.02/97.03/97.29 - thresholds green). Re-run green after commit
    2's further edits: `npm run test` 45 files, 1112 tests, coverage
    96.70/88.97/97.13/97.34.
  - `npm run check:built` (after each commit) - green both times: `build`,
    `smoke`, `budget` (89.3 kB then 90.3 kB gzip, within the 120 kB budget).
  - `node tests/app/golden.js --only="i/ci1"` - the empirical proof of the
    D5/O3 golden conflict: 14 `FAIL` lines with D5/O3 in place, `без
    изменений` (clean) once reverted.
  - Four golden shards, one foreground call each, run twice (once after
    seeding `#/l/~AAAA` in commit 1, once more after seeding `#/lists ~
    unreadable storage` in commit 2): `--shard=1/4` (28 states, ~109s),
    `--shard=2/4` (28 states, ~107s), `--shard=3/4` (28 states, ~107-121s),
    `--shard=4/4` (26-28 states depending on which new state had already
    been seeded, ~102s) - the only shard-4 diffs across both runs were the
    two new states before they were seeded (`нет golden-файла`, the
    expected "not yet captured" message, never a content mismatch); every
    pre-existing state compared `без изменений` (no changes) throughout.
  - `node tests/app/golden.js --only=lists` - 22 states, `без изменений`.
  - `node tests/app/golden.js --only='l/'` (single-quoted - a double-quoted
    `--only="#/l/"` was mangled by this shell's own hook before reaching
    node) - 24 states, `без изменений`.
  - `node tests/run-all.js app/states,contracts` - both green, 104s pooled
    (the history and two-tab cases live inside `app/states`, which stayed
    green throughout - `context.md`'s documented host-contention flake for
    this suite did not recur).
  - `npm run build` before every golden run named above.

### B7 - accessible names, product text and structure - the re-record (P2, P3, P6, P7, P4/D6, P8, P10, P12, D3, D8, D11, P13, P14, P15, pill, D5/O3)

**Not yet committed - see "Status" above.** Everything below is the
implementation and gate record for a batch that is complete in the working
tree but not landed.

- What shipped, by finding:
  - **P2**: every row checkbox is named after its own record (`nameOf(it,
    lang)`), not the generic "Выбрано" (`TableRows.svelte`, both the list
    and grid branches) or "Выбрать позицию" (`ListPage.svelte`'s own row) -
    the dead `pickRow` dict key removed from both languages once nothing
    read it.
  - **P3**: `RecordModal.svelte`'s `<dialog>` is named after the record
    (`nameOf(it, app.lang)`) instead of duplicating the close button's own
    "Закрыть".
  - **P6**: the three inputs `Field` wraps without emitting a `<label>` -
    `ListsPage.svelte`'s new-list and import fields, `AddToList.svelte`'s
    new-list field - each gained an `aria-label` (`t.newList`/`t.importList`)
    instead of relying on `placeholder` for a name.
  - **Pill rule fix**: `FilterBar.svelte`'s pill cross (`<i>&times;</i>`)
    gained `aria-hidden="true"`, so a pill's accessible name is the picked
    value alone - the owner's own example, `"Двуручное×"`, is what this
    removes.
  - **P7**: `SearchPage.svelte` keeps the unsliced `matched` array alongside
    the capped `found` one, and renders `"<found.length> из <matched.length>"`
    above the rows once the 300 cap actually bites (`.scount`, styled off
    `FilterBar.svelte`'s own `.fcount`) - nothing when it does not.
  - **P4(a)**: `AddToList.svelte` gained a `<svelte:window onkeydown>`
    listener (not one on `.seldrop` itself - a `<div>` with its own key
    handler trips one eslint-plugin-svelte a11y rule or the other no matter
    which role it is given, and `app.menuFor` is a single global value, so a
    window-level listener is exactly as safe): Escape closes the menu,
    clears `newListFor`, and refocuses the toggle
    (`:scope > .btn`); `preventDefault()` (not `stopPropagation`, which only
    matters between listeners on the same target) stops the record modal's
    own native Escape-to-close from also firing on the same press.
  - **P4(b)/D6**: `.dropmenu` moved after the toggle `<Button>` in the
    markup; the placement effect now measures `:scope > .btn` (the toggle,
    always a direct child of `.seldrop`, so descendant buttons inside an
    open `.dropmenu` can never be matched by mistake) against the nearest
    `.modal-card` ancestor, falling back to `window` outside a modal.
    `RecordCard.svelte`'s `.card` changed from `overflow: hidden` to
    `overflow: clip` (rounded corners still clip; a programmatic scroll can
    no longer move the card's own content). New `tests/app/states.js` case
    23 (`addToListMenuStaysInModal`, Кольцо Тишины/`ci28`/`#/tables` at
    1100x900, no lists seeded - the exact case `DEBT.md` D6 measured):
    `.card.scrollTop === 0`, the menu box lies inside `.modal-card`, and
    after "+ Новый список" the input box does too and is focused. `DEBT.md`
    D6 deleted; `FEATURES.md`'s "Lists" bullet on the add-to-list menu
    rewritten.
  - **P8**: `toggleAllIn` moved off `TablesPage`/`SearchPage` (which had
    identical copies) onto `AppState` as a method; `SharedListPage.svelte`
    passes it as `ontoggleall`, so a shared list gains its own "Выбрать все
    (N)" the tables and search pages already had.
  - **P10**: `<SelBar>` moved before `<footer>` in `Shell.svelte` - it is
    `position: sticky` with `z-index: 45` against the footer's unpositioned
    `auto` stacking, so this changes tab order only, not paint order (the
    bar already painted over the footer regardless of DOM order). Verified
    live against the built `dist/` at 1180x900 (ticked a row, read
    `.selbarwrap`'s and `.foot`'s `getBoundingClientRect()`s - the sticky
    bar pins flush to the viewport bottom exactly as before, the footer
    stays in its own normal-flow position far below on this page's real
    content height) and via `tests/app/states.js`'s pre-existing case 16
    (`selectionBarGeometry`, 1000x900 bottom-gap and 360x840 no-spill),
    which stayed green through the reorder.
  - **P12**: `.note-x` (`ListPage.svelte`), `.warn-x` (`StorageNotice.svelte`)
    and `.selx` (`SelBar.svelte`) each gained the same `::after` 44x44 hit
    target `PageHead.svelte`'s `.homebtn` already had; `.note-x`/`.selx`
    also gained `position: relative` to host it (`.warn-x` was already
    `position: absolute`).
  - **D3**: the storage notice's dismiss button moved out of `<summary>`.
    **First attempt (wrong, caught before committing)**: a sibling of
    `<summary>` but still inside `<details class="warn">` - this reads
    correctly in the accessibility tree (no more nested-interactive
    violation) but a real browser's closed-`<details>` rendering suppresses
    *every* non-summary child at once, not per-child `display`, so the
    button painted nothing and had no hit target while the notice was
    folded - verified by building `dist/`, opening it in a real browser at
    `#/lists`, and screenshotting the folded notice (the cross was simply
    absent) - exactly the reason the live app put the cross inside
    `<summary>` in the first place, per its own comment quoted in `DEBT.md`
    D3. **Fix**: `<details>` now holds only the disclosure (`<summary>` +
    `<p>`); a `<div class="warn">` wraps it and the button as siblings,
    carrying the old background/border/position styling. `.warn[open]`
    became `.warn details[open]` (the attribute lives on `<details>`, not
    the wrapper). Re-verified live: the cross renders and is clickable
    folded, unfolding still works, dismissing still works. Every
    `{ allow: ['nested-interactive'] }` removed (`a11y.test.ts` three call
    sites, `listPage.test.ts`/`listsPage.test.ts` three each) and the
    now-dead `allow` parameter removed from `app/src/test/a11y.ts`'s
    `expectNoA11yViolations` entirely; `tests/app/sweep.js`'s per-route
    `allow` array (D3 + D8 branches) removed, `axe(page)` called plain.
    `DEBT.md` D3 deleted; `FEATURES.md`'s storage-notice bullet gained a
    clause.
  - **D8**: `SectionHead.svelte` gained an optional `heading?: 2 | 3` prop
    (`<svelte:element this={'h' + String(heading)}>` vs the existing plain
    `<span>`, `margin: 0` covering both so the heading carries no extra
    default spacing); `TablesPage.svelte`'s alt-table branch passes
    `heading={2}` and its own `.altcol` column pair changed from `<h4>` to
    `<h3>` - closes the `<h1>`-to-`<h4>` jump on `#/tables/alt_item`/
    `#/tables/alt_consumable` with no other `SectionHead` caller affected
    (none of the other sectioned bodies has a following heading to skip
    past). Also, purely stylistic per the plan: `TablesPage.svelte`'s
    `lastTable` write wrapped in `untrack`. `DEBT.md` D8 deleted;
    `FEATURES.md`'s print-card heading-level bullet rewritten to stop
    describing D8 as a separate open question.
  - **D11 (Q6 settled)**: fetched `ru.daggerheart.su/frame` (title and
    on-page term both "Сеттинги") and dropped every `isFrameRecord` guard
    that suppressed a frame record's tier or switched its source line to a
    full path: `RecordCard.svelte` (the stat chips and the tier-ladder
    `{#if}`), `RowMain.svelte` (the row stat line), `TableRows.svelte`
    (`tileTier`), `RecordPage.svelte` (the path line's tier bit),
    `PrintCard.svelte` (the print card's own tier), `share.ts`/`search.ts`
    (their `statLine` builders no longer pass `noTier`), and
    `label.ts`'s `printSrc` (a frame record's print-card source line is now
    its own tag, `srcLabel`, same as any other equipment, not the full
    `whereFrom` path). `isFrameRecord` itself is kept - `whereFrom`'s own
    path-building still needs it, and both `i18n.test.ts` and
    `search.test.ts` use it as a fixture-lookup predicate - but its doc
    comment rewritten since the "presented as setting material" premise
    `DEBT.md` called unevidenced no longer describes any behaviour.
    `record.test.ts` gained a new `frames` fixture entry (`f1`, shaped like
    the real `f33`/`beast_feast`) and a test asserting the path line reads
    `"Прочее · Сеттинги · Пир зверей · Ранг 1"`; `label.test.ts` gained a
    `printSrc` case for the same fixture; `search.test.ts`'s D11 case
    inverted (asserts the tier word is now kept, matching the file's own
    `676629d` case exactly reversed). `docs/fixtures/share/records.json`
    recaptured via `tools/capture-share-fixture.mjs` after `npm run build` -
    diff is exactly `f33`'s two language blocks gaining `"Ранг 1 · "`,
    nothing else. `DEBT.md` D11 deleted; `FEATURES.md`'s campaign-frame
    equipment bullet rewritten.
  - **P13**: `dict.ts`'s `srcFrame` (ru) changed from `'Фрейм'` to
    `'Сеттинг'`, matching `frameF`/`subFrames` (already that word) -
    verified against `ru.daggerheart.su/frame` (fetched live: page title and
    on-page term are both "Сеттинги"). `label.test.ts`'s matching assertion
    updated.
  - **P14**: an editorial pass over `dict.ts` - English curly quotes (`'`/`"`)
    straightened to ASCII in `listCreated`, `localOnly`, `playersLinkCopied`,
    `sharePlayers`, `listEmptyHint`, `notePubHint`, `removedItem` (the two
    apostrophes inside `localOnly`'s now-double-quoted phrases escaped with
    `\'` so the single-quoted string literal still parses); a standalone
    Russian hyphen changed to an em dash in `uniqueHint`, `printSub`,
    `rollHint`, `guessWhy` (`repriceHint` was already correct, left alone).
    `printPage.test.ts` and `searchPage.test.ts` updated for the changed
    exact strings. **Not done**: `app/src/lib/help.ts:544`'s own curly
    apostrophe in `"Players' link"` - out of P14's literal `dict.ts` scope,
    flagged as nit B7-N1 in `issues/phase-8/nits.md` instead of fixed here.
  - **P15**: `app/index.html`'s noscript block, "1091 записи" -> "1091
    запись" (nominative singular agrees with a numeral ending in 1, except
    11); `dict.ts`'s `subSearch`, "Поиск по всем 1091 позиции сразу" ->
    "Поиск сразу по 1091 позиции" (dropping "всем" removes the clash
    between "все" wanting dative plural and the numeral wanting singular,
    rather than forcing either). `README.ru.md` carried the identical
    "по всем 1091 записям" defect in its own Search paragraph - fixed
    alongside dict.ts's, not named in the dispatch but the same defect in a
    sibling product-text surface. `searchPage.test.ts` updated for the new
    wording.
  - **D5/O3, landed**: `Shell.svelte`'s title effect now reads `app.route`,
    `app.openList` and `app.section` and titles the tab `<name> — <docTitle>`
    for a record (`app.index?.byId.get(route.id)`, `nameOf`), an owned list
    (`app.lists.get(app.openList)` - keyed off `openList`, not
    `route.kind === 'storedList'`, because `ListPage`'s own mount effect
    rewrites that address to the players' payload before this effect can see
    the original kind) or a section (`dict.ts`'s new exhaustive
    `SECTION_LABEL: Record<Section, keyof Dict>`, mirroring `TabBar`'s own
    `TABS` pairing) - plain everywhere else. Four new `shell.test.ts` cases
    (record title, plain on a not-found record, owned-list title via
    `waitFor` since `openList` only sets after `ListPage`'s 150ms debounced
    URL sync, plain on a print sheet as the "neither record nor section nor
    list" case) plus the existing "follows the language" test's title
    assertion updated (`#/roll/std` now reads "Standard rules — Daggerheart
    Loot Generator"). `DEBT.md` D5 **deleted** (paid off - not left open);
    `FEATURES.md`'s "Records" tab-title clause rewritten to describe the new
    behaviour and cite D5/O3 as paid off instead of describing the plain
    title as permanent.
- **Two bugs found and fixed beyond the dispatch's literal step list**:
  - **`tests/app/driver.js`'s `click()`/`press()` name lookup broke under
    P2.** Both ranked matches "first exact match in DOM order, else first
    substring match" - P2 giving a row's own checkbox the same name pressing
    the row itself opens means the checkbox (always an exact match, e.g.
    `aria-label="Кольцо Тишины"`) now pre-empts the row button (almost never
    an exact match - it carries a roll number and usually a description or
    stat line too, so it could previously only ever be found by the
    `includes` fallback, which never runs once *any* exact match exists).
    Caught empirically, not by inspection: `node tests/run-all.js app/states`
    failed cases 3, 6 and the new 23 with `.modal-card не найден` after the
    golden re-record, all three cases that press a record by name expecting
    the modal to open. Fixed by ranking three tiers instead of two - exact
    non-checkbox, substring non-checkbox, exact checkbox - in both
    `click()` and `press()`, and adding a new `tick(name, nth)` that
    searches checkboxes only, for a spec that means the box specifically.
    Every affected call site updated to say which one it means:
    `inventory.js` (10 sites: the list-page and tables-page row-tick states,
    the search row-tick state, all converted `d.click(...)` -> `d.tick(...)`),
    `states.js` (3 sites, same conversion), `hues.js` (1 site, the grid-tile
    selected-fill case - ticking the box, not opening the tile). Re-verified:
    `node tests/run-all.js app/states` (23/23) and `node tests/run-all.js
    app/hues` (1/1) both green after the fix.
  - **The D3 sibling-of-`<summary>`-but-inside-`<details>` shape hides the
    button when folded** - full account above, under D3. **Caught by eye,
    not by a gate**: building `dist/`, opening it in a real browser, and
    reading a screenshot of the folded notice - the cross was simply absent
    on screen even though `getComputedStyle` and `getBoundingClientRect()`
    both reported a normal, positioned 26x26 box (a browser's `<details>`
    rendering suppresses non-summary content in a way that does not show up
    as `display: none` on the child, which is what makes this easy to miss
    from source alone). No automated gate this session ran would have
    caught it: jsdom (every vitest test, including all 123 `lists`/
    `listsPage`/`listPage` tests) does not implement `<details>`'s native
    closed-content suppression at all and passed against the *wrong*
    structure the first time; `node tests/run-all.js app/states` and
    `tests/app/sweep.js` do drive a real Chromium, but neither one's
    existing states happen to assert the dismiss button's visibility or
    hit-testability while the notice is folded. **This is a live coverage
    gap, not a closed one**: nothing in the suite now guards against this
    exact regression recurring, only this one manual check plus this
    written record. Flagged as nit B7-N2 in `issues/phase-8/nits.md` for a
    permanent `tests/app/states.js` case (open `#/lists`, read `.warn-x`'s
    `getBoundingClientRect()` while `<details>` is closed, assert non-zero
    width/height) rather than added here, since B7's own scope is the
    re-record, not new coverage infrastructure.
- **Coverage gap found and closed**: the v8 coverage report after the first
  clean `npm run check` showed `AddToList.svelte` lines 224-227 (the whole
  body of the new P4(a) `onKeydown`) uncovered - no test exercised Escape at
  all. Added one to `record.test.ts`'s "the tier ladder" describe block:
  opens the record modal, opens the add-to-list menu, presses Escape,
  asserts the menu closed, the toggle's `aria-expanded` is back to `false`,
  the toggle has focus, and the modal itself is still open (a second,
  unclaimed Escape is what closes the modal - not exercised by this test,
  since jsdom does not implement `<dialog>`'s native Escape-to-close either).
  Verified in isolation: `npx vitest run src/components/record.test.ts -t
  "Escape"` - 1 passed. **This edit is the one unstaged file** - see
  "Status".
- Files changed (all currently in the working tree; most already `git add`ed
  - see "Status" for the one exception): `README.ru.md`, `app/index.html`,
  `app/src/components/{AddToList,FilterBar,ListPage,ListsPage,PrintCard,
  RecordCard,RecordModal,RecordPage,RowMain,SearchPage,SectionHead,SelBar,
  SharedListPage,Shell,StorageNotice,TableRows,TablesPage}.svelte`,
  `app/src/components/{a11y,listPage,listsPage,printPage,record,searchPage,
  sharedListPage,shell,tables}.test.ts`, `app/src/lib/dict.ts`,
  `app/src/lib/{label,search}.ts` + their `.test.ts`, `app/src/lib/share.ts`,
  `app/src/state/app.svelte.ts`, `app/src/test/a11y.ts`,
  `docs/fixtures/share/records.json`, `docs/specs/{DEBT,FEATURES}.md`,
  `issues/phase-8/nits.md`, `tests/app/{driver,hues,inventory,lib,states,
  sweep}.js`. Plus 107 of 110 `tests/app/snapshots/*.txt` (see the next
  section for why each family moved) and this file.
- **Why every moved golden cell moved - by category, not by file (up to 107
  files, several categories apiece)**:
  1. **D5/O3 title** - the `RootWebArea`'s own name gained `<name> —
     <docTitle>` on essentially every state whose route is a record, a
     section, or an owned list - i.e. most of the 107. Plain/print/
     unknown-list states are the exception and did not move on this count.
  2. **P2 checkbox names** - every state showing a table, search, or list
     row: `checkbox "Выбрано"`/`"Выбрать позицию"` -> `checkbox "<record
     name>"`, plus every visible record's name now appearing in the state's
     `## controls` listing (previously collapsed to one `Выбрано` line) -
     the large insert counts in `_tables*`, `_search*`, `_lists_a*`,
     `_l_shared*`, `_tables_alt_*` are this.
  3. **P4(b)/D6 menu-after-button** - `_i_ci1_list_menu`, `_i_ci1_new_list`,
     `_i_ci1_many_lists`, `_tables_bar_menu`, `_tables_a_row_opened_
     list_menu`, `_tables_a_row_opened_new_list`: `button "Добавить в
     список"` now precedes the menu's own contents instead of following
     them.
  4. **P6 textbox names** - every `_lists*` state and `_i_ci1_new_list`:
     `textbox "Например: клад дракона"`/`"Ссылка на список"` -> `textbox
     "Новый список"`/`"Восстановить из ссылки"` (and the English pair).
  5. **Pill rule fix** - `_tables_eq_weapon_filtered` and siblings with a
     picked filter: a pill's name lost its trailing `×`.
  6. **D11 frame tier** - `_i_f1` (the path line and stat-chip count) and
     any state listing frame equipment with a tier (`_tables_frames`,
     `_tables_other_frames*`): the tier word/chip is now present.
  7. **D8 heading levels** - `_tables_alt_item`, `_tables_alt_consumable`:
     the rarity `StaticText` became `heading level=2`; the Hope/Fear column
     headings changed `level=4` -> `level=3`.
  8. **D3 dismiss button position** - `_lists*` (folded) and
     `_lists_notice_unfolded` (open): `button "Скрыть"`/`"Dismiss"` is now a
     sibling of the `DisclosureTriangle`, not nested inside it.
  9. **P8 shared-list select-all** - `_l_shared*`: gained `checkbox
     "Выбрать все (N)"` and its `StaticText`.
  10. **P10 SelBar-before-footer** - every state with a ticked selection
      (`_tables_a_row_ticked`, `_tables_bar_menu`, `_tables_selection_
      copied`, `_search_a_row_ticked`, `_lists_a_a_row_ticked`,
      `_lists_a_batch_deleted`, and others): the selection bar's subtree now
      precedes `contentinfo` instead of following it.
  11. **P7 search-cap line** - `_search_capped`: gained `StaticText "300 из
      1091"` above the checkboxes.
  12. **P14/P15/P13 text edits** - `_search*` (the `subSearch` rewording),
      any state whose visible text includes `uniqueHint`/`printSub`/
      `rollHint` (a hyphen became an em dash), and any state showing a
      frame record's source badge/label (`srcFrame` "Фрейм" -> "Сеттинг").
  - **Every category above was spot-checked against its own predicted diff**
    (at least one representative file per category, `git diff` read in
    full) **and matched exactly** - no unexplained content in any diff this
    session actually read. This was **not** an exhaustive line-by-line read
    of all 107 files; the categories above account for the entire visible
    diff shape (`git diff --stat`: 9239 insertions/1973 deletions, and the
    insertion count is overwhelmingly category 2's per-record name listing,
    consistent with the state fixture data). **If a review finds a cell that
    does not fit one of these twelve categories, that is a real defect this
    session did not catch, not an intentional-but-undocumented change.**
  - **Correction**: the register is 112 states, not 110 - `tests/app/
    inventory.js`'s `STATES.length` is 112 (B6 added two: `#/l/~AAAA` and
    `#/lists ~ unreadable storage`; `plan.md`'s "110" predates both). 112
    total minus 107 changed leaves **5** unchanged, named by comparing
    `ls tests/app/snapshots/*.txt` against `git status --porcelain
    tests/app/snapshots`:
    - `_i_nope.txt` (`#/i/nope`) - the not-found record page.
    - `_l_AAAA.txt` (`#/l/~AAAA`) - a packed link that cannot be unpacked.
    - `_l_zzzz.txt` (`#/l/zzzz`) - the bad-link page for an unreadable
      plain payload.
    - `_lists_nope.txt` (`#/lists/nope`) - "Список не найден", address not
      rewritten.
    - `_print_nope.txt` (`#/print/nope`) - nothing to print.

    All five keep the plain `RootWebArea` title (confirmed by reading each
    file's first tree line: `"Генератор лута — Daggerheart"`, no name
    prepended) - each is a "not found"/"nothing to show" state with no
    record resolved, no section lit, no list opened, so D5/O3 has nothing
    to name it with. None of the five has a table row, a list row, a
    filter pill, an add-to-list menu, a storage-notice disclosure, or a
    heading-level structure either, so none of the other eleven categories
    touches them. This is a complete account, not a sampled one - all 112
    files were classified as changed-with-a-reason or unchanged-with-a-
    reason.
- Gates run, and their results:
  - `npm run check` (foreground, `set -o pipefail; npm run check 2>&1 |
    tail -N`) - **passed clean at least twice** during the implementation
    pass, most recently right after the D3 restructure fix, with the full
    coverage table printed (96.65/88.87/97.14/97.23, all thresholds green,
    1119/1119 tests). It has **not** passed clean since the last edit (the
    new Escape test in `record.test.ts`, +1 test). Three attempts since:
    one used `tail -30`, too short to capture the coverage table's own "All
    files" line the commit-gate observer greps for - a tooling mistake, not
    a check failure. Two full attempts after that (a `tail -200`/`tail -250`
    each) both failed under what all the evidence says is host contention,
    not a real regression:
    - Attempt 1: `searchPage.test.ts`'s 300-cap test timed out at 30000ms;
      `sharedListPage.test.ts` failed to find a toast. Total run time 566s
      (normally ~100-130s for the full suite alone).
    - Attempt 2 (after this agent had *already* launched a targeted
      `record.test.ts -t Escape` run in the background, unaware a
      concurrent run would contend): the identical two tests failed again.
      Re-ran both files alone, nothing else running: **40/40 passed**,
      isolating the failure as contention, not a defect (`context.md`'s own
      "Reasons already disproved" names this exact pattern).
    - Attempt 3 (this agent's, unaware the orchestrator had started its own
      `npm run check` in parallel against the same tree): died with
      `vitest-pool` "Failed to start forks worker" / "Timeout waiting for
      worker to respond" - an infrastructure symptom of two heavy check runs
      fighting over one tree (this task's own "one session at a time"
      rule), not a test failure. 978s duration confirms severe contention.
    - **Attempt 4** (after the orchestrator confirmed its own check result
      was void - it had auto-backgrounded past 600s, which cannot arm the
      gate regardless of what it reports, and had overlapped a vitest run
      it could not detect - and confirmed no vitest/golden/sweep/run-all/npm
      process was running on the tree): `set -o pipefail; npm run check
      2>&1 | tail -n 120`, one foreground call, timeout 600000, exactly as
      instructed. **Also crossed the 600s cap and auto-backgrounded.** Per
      the orchestrator's own instruction 3 ("that is information, not a
      retry cue... a slow run means something changed and I would rather
      know than watch a retry loop"), this was **not retried**. The two
      confirmed-clean runs earlier in this session both finished in the
      normal range for this chain (well under 600s, coverage table printed,
      1119/1119 or 1118/1118 tests) with nothing else running, so a plain
      re-run now taking longer than that is itself the reportable fact, not
      something to work around by trying again. **No `npm run check` result
      exists for the current tree as of this record**, and no commit has
      been made. The backgrounded attempt 4 process was left running rather
      than killed; whatever it eventually reports should not be used to arm
      the gate, per the same reasoning that applied to the orchestrator's
      own void run.
  - `npm run check:built` - green (build/smoke/budget, 90.9 kB gzip within
    the 120 kB budget) after the StorageNotice fix, run in isolation.
  - `node tests/run-all.js app/states` - green (23/23, ~114s) twice: once
    right after the golden re-record with the wrong (nested-in-`<details>`)
    D3 markup - which still passed, because jsdom does not model the real
    bug - and once more after the D3 fix and the driver.js tick/click fix,
    to prove cases 3/6/23 (which the driver bug had broken) recovered.
  - `node tests/app/sweep.js 768` - clean (`обход страниц (dist/): чисто на
    768`) twice, before and after the D3 fix.
  - `node tests/run-all.js app/hues` - green (1/1) after the driver.js fix,
    to prove the grid-tile tick case recovered too.
  - Four golden shards, `--update`, one foreground call each (~105-118s
    apiece) - run **twice**: once right after all production edits landed
    (with the D3 bug still in the tree, since jsdom-based `npm run check`
    had not caught it), and again after the D3 restructure fix, since that
    changed the `.warn`/`<details>` DOM shape the goldens capture. The
    second run is the one actually committed-from; its diff is what
    "Why every moved golden cell moved" above describes. `структурные
    образцы (dist/): без изменений` printed after every shard both times -
    this message means "no orphaned/missing golden files", not "no content
    diff"; the actual diff is what `git status`/`git diff` on
    `tests/app/snapshots/` shows.
  - One shard re-run **without** `--update` (the determinism probe,
    `--shard=1/4`) - `без изменений`, and `git status`'s snapshot count was
    unchanged before and after (still 107), confirming the just-recorded
    output is stable.
  - `npx vitest run` (the full suite, not `npm run check`, run standalone in
    isolation) - **1119/1119 passed**, run twice: once before the D3 fix,
    once after. Both clean. This was *before* the Escape-key test was
    added; see the `npm run check` bullet above for what happened after.
- **Done**: a clean `npm run check` was obtained (see "Status" for the run
  that armed the gate) and the two commits landed and pushed - `e80a793`
  (code/docs) and `dba6755` (the golden `--update`). Attempt 4 (above) also
  crossed the 600s cap and was not retried, per the orchestrator's own
  instruction that a slow run past two known-clean runs is information to
  report, not a cue to loop; the clean run that eventually armed the gate
  was a later, separate foreground call (see "Status"). Nothing further is
  unfinished for B7.

## Blockers
- None. D5/O3's own open question is resolved (implemented and landed in
  B7 - see that entry). The procedural blocker - B7 could not be committed
  without a clean `npm run check` for this exact tree - is cleared: the
  orchestrator obtained one and this session committed and pushed on top of
  it. See B7's "Status" and its own entry under "Completed" for the full
  gate history.

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
- **D5/O3**: no longer deferred - implemented and landed in B7 (folded in by
  orchestrator decision, per the dispatch). See B7's entry under
  "Completed".

### B8 - record actions, print, motion and focus (D10, D13, D14, D15, D22, P16, R6, D20, D21, D1, D18)

- **What shipped, by the plan's ten steps:**
  1. **D10**: `app/src/ports/image.ts`'s `browserImage().pngOf` now probes
     `canvas.toDataURL('image/png')` in a `try/catch` right after
     `drawImage` (a tainted canvas throws synchronously there) and wraps
     `toBlob` in a 2000ms watchdog (this build's `toBlob` never calls back
     on a tainted canvas, so it never throws on its own).
     `RecordActions.svelte`'s `copyImage()` now calls `pngOf` directly
     first; a rejection falls back to `writeRich` with the record's own
     share text and a new `imgTainted` toast, instead of asking the
     clipboard to write a picture that was never produced.
  2. **D14/D15**: `ImagePort` gains `download(blob, filename): Promise<void>`
     (`<a download>`, object URL revoked after 4s) and `fakeImage` gains a
     matching double with `downloaded`/`failDownload`. Once `pngOf`
     succeeds but `clipboard.writeImage` still returns `false` (refused or
     unsupported), `copyImage()` falls back to `download()` - `imgSaved` on
     success, `imgFailed` (distinct from `copyFailed`) if the download
     itself throws.
  3. **D22**: `RecordActions.svelte`'s `send()` now builds `text` from
     `share()` (the same full share text `copyText()` uses) rather than the
     bare name, and passes a `file` callback (a `File` built from `pngOf`)
     only when `it.img && !app.artBroken(it.id)` - `SharePort` itself still
     decides whether the environment can take it. `fakeShare` gained a
     `last.file` (the callback itself, not just `hasFile`) so a test can
     invoke it and read back the produced `File`.
  4. **D13**: `dict.ts` gained `rollCopied`; `StdPanel.svelte`'s and
     `AltPanel.svelte`'s `copyRoll()` toast it instead of `textCopied`.
  5. **P16** (Q2, "look first, then shrink" - see "P16 measurement" below):
     inspected before any code was written; nothing needed shrinking, so
     `fit()` is untouched and `tests/app/print.js` gained a pinning
     assertion instead (see "Files changed").
  6. **R6**: `PrintCard.svelte` gained an `onartfail` prop and `onerror` on
     both `.pc-back`/`.pc-img`; `PrintPage.svelte` passes
     `(id) => app.markArtBroken(id)`.
  7. **D20**: `RecordModal.svelte` gained `@media print { dialog {
     display: none !important } }`; `Toast.svelte`'s existing print rule
     gained `!important`. `tests/app/print.js` gained a dedicated block
     (not folded into the existing `MEDIA_STATES` loop, since neither state
     it needs - an open modal, an action toast - is drawn by a print route
     itself) that opens `#/roll/wondrous`, opens the modal, and separately
     seeds a one-item list and triggers the "removed" undo toast, checking
     each is `display: none` under `d.media('print')`.
  8. **D21**: `AppState` gained `printBW = $state(false)` (memory-only,
     never written to storage, `kinds`' own shape); `PrintPage.svelte`
     reads/writes `app.printBW` directly instead of a page-local `$state`.
  9. **D1**: `tokens.css` gained the blanket
     `@media (prefers-reduced-motion: reduce) { *, *::before, *::after {
     animation-duration: 0.01ms !important; animation-iteration-count: 1
     !important; transition-duration: 0s !important; scroll-behavior: auto
     !important } }`. `RecordCard.svelte`'s and `TablesPage.svelte`'s own
     two named `animation: none` rules were left in place (redundant now,
     harmless, not part of this fix - `TablesPage.svelte` is outside this
     batch's file list). `tests/app/states.js` gained case 24, which
     explicitly emulates `prefers-reduced-motion: reduce` (belt-and-braces:
     `driver.js`'s own `prepare()` already does this for every case),
     hovers a button, crosses the 600px breakpoint, and asserts
     `document.getAnimations().length === 0`.
  10. **D18**: the five component-local 8px `:focus-visible` overrides
      (`RowMain.svelte`, `Seg.svelte`, `ListPage.svelte`,
      `StorageNotice.svelte`, `RecordCard.svelte`'s `.card-media` one, which
      was actually a sixth, unlisted-in-live shape - `outline-offset: -2px`,
      not `2px` - deleted the same way on the same owner instruction) are
      gone; every control now falls through to `tokens.css`'s global
      `:focus-visible` rule at `--r-sm` (9px).
- **P16 measurement** (recorded before any code was written, per Q2):
  built `dist/`, opened `#/print/cm26-f60-hi62-ci81` through
  `tests/app/lib.js`'s `fresh()` at 1100x900, both languages, both layouts
  (a scratch script, not committed - see "Deviations"). `.pc-name`'s
  `getClientRects().length` for all four cards, both languages, both
  layouts: **every one is 1.** (`cm26` ru: "Стрелы и Болты с Метеоритными
  Наконечниками"; en: "Meteoric-Tipped Arrows and Bolts"; `f60`, `hi62`,
  `ci81` all shorter.) Since none exceeded two lines, the branch taken is
  "the assertion only" - no shrink step was added to `fit()`.
  `tests/app/print.js` pins `cm26` at one line, both languages, both
  layouts (four assertions in a `nameLines()` helper). No deviation from
  Figma nodes `714-42387`/`3773-90792` was needed; `FEATURES.md`, "Print",
  records the finding and the pinning assertion anyway, per the plan's
  "either way" instruction.
- Files changed: `app/src/components/{AltPanel,ListPage,PrintCard,PrintPage,
  RecordActions,RecordCard,RecordModal,RowMain,Seg,StdPanel,StorageNotice,
  Toast}.svelte`, `app/src/components/{alt,std,printPage,record}.test.ts`,
  `app/src/lib/{dict,share}.ts`, `app/src/ports/{image,share,types}.ts`,
  `app/src/state/app.svelte.ts`, `app/src/styles/tokens.css`,
  `docs/specs/{DEBT,FEATURES}.md`, `tests/app/{print,states}.js`,
  `vite.config.mts` (the `src/ports/image.ts` coverage-exclusion comment,
  updated to say the rejection path is now exercised for real).
- Commit(s): `3c0fff8 feat(phase-8): B8 record actions, print, motion and
  focus` - pushed (`8e43c92..3c0fff8 main -> main`; confirmed
  `git rev-parse HEAD` == `origin/main`).
- Deviations and rationale:
  - **A viewport bug in the P16 addition broke the existing `printMedia`
    checks on the first `npm run check` + browser-suite pass, caught by
    `node tests/run-all.js app/states,app/print` before commit.** The new
    `nameLines()` helper (P16) set the shared `d`/`dEn` drivers to
    1100x900/1100x950 for the measurement and did not restore them, so the
    `MEDIA_STATES` loop right after it read `main`'s width against a
    leftover 1100px viewport instead of the expected 1180 (`1085px` instead
    of `1165px`, three failures). Fixed by restoring each driver to
    1180x950 (not 1180x900 - `cardFit`'s own last line already leaves `d`
    there, verified by reading it rather than guessing) in a `finally`
    inside `nameLines()`. Re-ran `npm run check` (a second full pass, since
    the tree changed after the first) and both browser gates; both clean.
    Recorded because a reviewer reading only the diff's intent, not its
    order of operations, could miss that the fix touches a driver two
    unrelated blocks share.
  - **The P16 measurement script is not committed.** It lived in the
    session's scratchpad directory (outside the repository), not in
    `tests/` or `tools/` - a one-off inspection per Q2, not a suite the
    plan asked to add. The measured numbers and the command shape are
    recorded above and in `FEATURES.md`, "Print", so the inspection is
    reproducible without the script itself.
  - **RecordCard.svelte's deleted override was not one of live's 18 named
    selectors, and used a different offset sign (`-2px`, not `2px`).**
    D18's own "Where" section lists it among the five deleted
    (`RecordCard.svelte:337`), so it was deleted per the plan's letter, but
    it is worth recording that this one was never part of the live parity
    set at all - `.card-media` sits nowhere in the closed 18-selector list,
    and its inward offset was presumably chosen to avoid the ring being
    clipped by `.card`'s own overflow. No golden or test caught a visible
    change either way (D18's own DEBT text: "no registered state reaches a
    keyboard focus ring at all").
  - **`exactOptionalPropertyTypes` needed two follow-up fixes beyond the
    plan's letter**, both caught by `svelte-check` before commit:
    `RecordActions.svelte`'s `send()` could not pass `file: undefined`
    to `Shareable` (rebuilt to spread `{ file }` in only when present); the
    new `fakeShare().last.file` field needed `(() => Promise<File>) |
    undefined` instead of `file?: ...` for the same reason. Neither changes
    behaviour, both are type-only.
  - **A `prettier --write` was needed on `record.test.ts` and
    `image.ts`** before `format:check` passed (wrapping only, from the new
    tests/JSDoc); re-ran `npm run check` clean afterward (folded into the
    "Gate basis" re-run above, not a third pass).
- Verification commands and results:
  - `set -o pipefail; npm run check 2>&1 | tail -n 150` (Bash timeout
    600000, foreground; per this session's own shell, `rtk npm run check`
    with no pipe) - green, twice as described in "Deviations": 45 test
    files, 1130/1130 tests, coverage 96.75/89.05/97.15/97.41, thresholds
    green, format/lint/svelte-check/derived/selftest/tools all green.
  - `npm run check:built` - green: build 1.37s, `smoke` ("the built page
    opens from a folder"), `budget` 91.4 kB gzip within 120 kB.
  - `node tests/run-all.js app/states,app/print` - green after the
    viewport fix: `app/print` 169.0s (24 P16 assertions + the two D20
    checks + everything pre-existing), `app/states` 107.3s (24 cases,
    including the new copy-image and reduced-motion ones).
  - `node tests/app/sweep.js 1180` (Bash timeout 600000, foreground) -
    "обход страниц (dist/): чисто на 1180 (ru, en)".
  - `MSYS_NO_PATHCONV=1 node tests/app/golden.js --only=#/i/ci1` - 7 states
    compared, "структурные образцы (dist/): без изменений" - green
    **without** `--update`. (`MSYS_NO_PATHCONV=1` needed on this Git-Bash
    host: a bare `--only='#/i/ci1'` gets `/i/` path-converted to `I:/`
    otherwise, matching this task's "Shell command style" note about this
    host's quirks; the flag changes nothing about what golden.js itself
    does.)
  - `MSYS_NO_PATHCONV=1 node tests/app/golden.js --only=print` - 9 states
    compared, "без изменений" - green **without** `--update`.
  - Gates: `npm run check` (full, twice); `npm run check:built`; `node
    tests/run-all.js app/states,app/print`; `node tests/app/sweep.js 1180`;
    both `golden.js --only=` probes.
- Review: required (trigger: this task's own standing policy - every
  phase-8 batch gets a reviewer, `context.md`).

### B7 remediation - the review's four blockers (BL-0..BL-3), plus B7-R3
- What this fixed, by blocker:
  - **BL-0 (the CI break, highest priority):** `docs/fixtures/statlines/
    equipment.json`'s `f7` entry still held the pre-D11 stat line (no tier
    word); B7's own D11/Q6 fix ("print the tier on frame equipment") moved
    what `dist/` actually renders for it, and the fixture was never
    recaptured. `app/contracts` (a real-browser suite, not part of `npm run
    check`) failed on CI run `35318680003` for exactly this - `f7/ru` and
    `f7/en`, tier word missing from the fixture's expectation. `i18n.test.ts`
    stayed green throughout because its own loop passed
    `noTier: isFrameRecord(record)`, which recomputed the very compensation
    the fixture needed instead of asserting the shipped behaviour. Fixed in
    three parts, per the dispatch: (1) `f7`'s `ru`/`en` arrays gained the
    tier word first (`"Ранг 1"`/`"Tier 1"`), matching CI's own printed
    "actual" lines exactly - verified by diff that no other of the fixture's
    nine other ids moved. (2) `noTier: isFrameRecord(record)` dropped from
    `i18n.test.ts`'s fixture loop, so it now asserts the real, shipped stat
    line instead of a line computed to match a stale fixture; the separate
    `:75-80` "can omit a tier from a direct frame-record stat line" test
    (which exercises `noTier` deliberately, via a literal `true`) was left
    alone. (3) The fixture's own header comment gained a clause: one entry
    (`f7`) is not a capture of the old app any more, it is a deliberate
    post-migration divergence per D11/Q6, so a future reader does not "fix"
    it back to match a fresh capture.
  - **BL-0's own B7-R3 clause (bundled in, same file, same reason a reader
    would delete `noTier` next):** after this fix, `noTier` has zero
    production callers - confirmed by search: no caller in `app/src`, only
    `i18n.test.ts` (the parity fixture, which legitimately still needs it)
    and a stray mention in `search.test.ts`'s own prose. One clause added at
    `app/src/lib/i18n.ts`'s `eqParts` doc comment, naming why it stays and
    which test would break if it were deleted as an unused variant. Marked
    `B7-R3 done 6b50945` in the register.
  - **BL-1:** `docs/specs/COVERAGE.md`'s "Whitespace text nodes..." section
    documented `expectNoA11yViolations(container, { allow })`, a parameter
    B7 deleted along with every call site and `DEBT.md` D3. Verified against
    the current `app/src/test/a11y.ts` (the `allow` parameter and the
    per-call `nested-interactive` disable are both gone; `color-contrast` is
    the only rule in `OFF`, unconditionally) before writing anything down -
    the dispatch's suggested wording held. Rewritten: nothing is disabled
    per call any more; `color-contrast` is the only rule off, everywhere;
    `nested-interactive` used to be narrowed to an `allow` list for the
    storage notice's old markup, that shape was fixed (the dismiss button
    moved to a sibling of `<details>`), so the parameter had no caller left
    and was deleted with it.
  - **BL-2:** `docs/specs/COVERAGE.md`'s `flows` row still said
    `share.ts`'s `eqLine(...)` call "now passes `noTier: isFrameRecord(it)`"
    and that `docs/fixtures/share/records.json` was recaptured with `f33`
    *losing* the tier word - the opposite of what B7 shipped. Verified
    against `share.ts:85` (no `noTier` argument at all now) and the fixture
    itself (`f33`'s `ru`/`en` full text both read "Броня · Ранг 1 · ..." /
    "Armor · Tier 1 · ...", tier word present). Rewritten: divergence (2) is
    D11 paid off under Q6 - the tier now prints on every stat line `eqLine`
    builds, frame or not - keeping the pointer to `share.test.ts`'s golden
    loop over all nine ids.
  - **BL-3:** B7 dropped `RecordCard.svelte:177`'s
    `!isFrameRecord(it)` guard, turning the four-rung tier ladder on for 56
    real frame records with a non-empty `eq.line`, and nothing in
    `record.test.ts`'s fixture or any golden exercised a frame record with
    one - the only frame record either covers (`f1`) has `eq.line: ''`
    (shaped after `f33`). Added two new frame records to the fixture, `f2`/
    `f3`, sharing a synthetic `eq.line: 'cookknife'` (f1 itself left
    untouched, so its own existing assertions - the page-sub path/tag test -
    stay exactly as they were). One new test in the "tier ladder" describe
    block opens `f2`'s own page and asserts: the ladder shows both rungs
    (`'12'`, same `.steps` pattern the q1 ladder test already uses), the
    record's own stat chip carries the tier word (`'Ранг 1'` - proving the
    frame record's own stats print the tier now too, not only the ladder),
    and the other rung's button has the expected accessible name. Ends with
    `expectNoA11yViolations(container)`, per `CLAUDE.md`. No `inventory.js`
    state was added - deliberately, per the review's own ruling, since it
    would force a golden re-record for no gain.
- Files changed: `docs/fixtures/statlines/equipment.json` (2 lines, `f7`
  only - verified by diff), `app/src/lib/i18n.test.ts`, `app/src/lib/i18n.ts`,
  `docs/specs/COVERAGE.md`, `app/src/components/record.test.ts`.
- Commit: `6b50945 fix(phase-8): B7 remediation - CI fixture, stale coverage
  docs, ladder coverage` - pushed.
- Deviations and rationale: none from the dispatch's letter. `docs/specs/
  CONTRACTS.md` and `llms.txt` were checked and confirmed not to pin
  `docs/fixtures/statlines/equipment.json` (only `docs/fixtures/lists/*.json`
  and `docs/fixtures/urls/routes.json` are contract fixtures in that sense),
  so `CLAUDE.md`'s four-file public-contract rule was not triggered, per the
  dispatch's own pre-check.
- Verification commands and results:
  - `rtk npm run check` (one foreground call, Bash timeout 600000, no pipe) -
    green: `format:check`, `lint` (one `no-unnecessary-condition` fix needed
    first - `steps?.textContent?.replace` had a redundant second `?.`,
    corrected to match the existing ladder test's own style, then clean),
    `typecheck`/`svelte-check` (550 files, 0 errors, 0 warnings), `npm run
    data`, `node tests/derived.js`, `.claude/hooks/selftest.mjs` (373
    passed), the `node --test` suites, `npm run test` (45 files, 1131/1131
    tests, coverage 96.75/89.05/97.15/97.41 - thresholds green).
  - `node tests/run-all.js app/contracts` (its own foreground call, ~250s
    budgeted) - green: "ok  app/contractsdist/: contracts and fixtures
    252.1s" / "все наборы прошли за 252с (в 8 потока)". This is the suite
    that caught BL-0 on CI (`35318680003`, job `browser (3)`) and the only
    local proof it is fixed.
  - Gates: `npm run check` (full); `node tests/run-all.js app/contracts`.
- Push: `git push origin main` (`d946f8b..6b50945`). CI not separately
  watched this session (no `gh` step run) - `app/contracts` passing locally
  against the exact fixture CI flagged is the load-bearing proof; nothing
  else in the diff touches a CI-relevant file (workflow, deploy guard,
  generated data). CI can be expected green on this push; confirm with `gh
  run list --branch main --limit 1` before starting B9 if that confirmation
  matters to the next session.

### B8 remediation - the review's three blockers (BL-1..BL-3), plus B8-R1/B8-R2
- What this fixed, by blocker:
  - **BL-1:** `RecordCard.svelte`'s `.card-media:focus-visible` inset offset,
    deleted by D18 as one of five redundant overrides, restored on its own -
    the other four (`RowMain`, `Seg`, `ListPage`, `StorageNotice`) stayed
    deleted; they are genuine no-ops. `.card-media` is a real `<button>`
    flush against `.card`, and `.card` is `overflow: clip` - the global
    rule's `+2px` offset (`tokens.css:160-164`) draws the ring outside the
    button's border box and so outside `.card`'s padding box, clipped on
    three sides; the restored `-2px` keeps it inside. The new rule carries a
    comment stating the reason inline, and notes the plan's step 10 mislabeled
    this override as one of "the five 8px overrides" (it was not 8px). CSS
    only - no golden can move, and the golden probe below confirms none did.
    **Not verified visually** - see "Status", "One thing this pass cannot
    prove".
  - **BL-2:** `RecordActions.svelte`'s `copyImage()` restructured to the
    reviewer's shape: `const png = app.env.image.pngOf(src);` starts the
    promise without awaiting it, `const copied = await
    app.env.clipboard.writeImage(() => png);` hands that still-pending
    promise straight to the clipboard call (preserving the user gesture on
    Safari, per `clipboard.ts:102-104`'s own documented invariant), and only
    after that call settles is `png` awaited again (`try { blob = await png;
    } catch { ... }`) to tell a tainted canvas (`pngOf` itself rejected, the
    `imgTainted` text fallback) apart from a clipboard refusal of a real blob
    (the `imgSaved`/`imgFailed` download fallback). `clipboard.ts`'s own
    `writeImage` comment gained a clause naming the caller-side half of the
    gesture invariant it had stated only from its own side, so this exact
    regression (a caller awaiting `pngOf` before calling `writeImage`, as B8
    shipped) is harder to reintroduce silently.
    **The dispatch's own instruction was tested for real**: the existing
    D10/D14/D15 tests in `record.test.ts` initially **failed** under the
    restructure - one assertion (`clip.last.image` expected `undefined`, got
    `true`) in the D10 "tainted canvas" case. Per the dispatch ("if they do
    not [pass unchanged], the restructure is wrong, not the tests"), this was
    read as a signal to stop and re-read rather than to edit the test. The
    actual cause: `fakeClipboard.writeImage` in `clipboard.ts` ignored its
    `png` argument entirely and always reported success, unlike the real
    `browserClipboard.writeImage`, which awaits `png()` inside `rich.write`
    and lets a rejection propagate to its own `catch`. The fake was not a
    faithful double of the port it doubles for - fixed there: `writeImage`
    now `await`s its `png` argument and returns `false` on rejection before
    ever touching `last.image`, matching the real port's actual contract.
    With that one-function fix, all three of D10/D14/D15 (`copies the
    picture`, `falls back to the text when the canvas cannot be read back at
    all (D10)`, `offers a download when the picture exists but the clipboard
    refuses it (D14)`, `says the picture could not be saved either (D15)`)
    passed **unchanged** - confirmed both in isolation (`npx vitest run
    app/src/components/record.test.ts app/src/ports/ports.test.ts
    --coverage=false`, 120/120) and inside the full `npm run check` run
    below.
  - **BL-3:** `docs/specs/COVERAGE.md`'s `noart` row still called "share
    attaches no file" an impossible case ("`RecordActions.svelte:68-75`
    never passes a file"), both the fact and the citation stale - D22 (this
    task's own earlier work, already shipped) makes `send()` pass a file
    where there is art. Verified the two tests actually exist and cover it
    (`record.test.ts`, "attaches no file for a record with no art" /
    "attaches the picture where there is art (D22, paid off)") before
    rewriting the clause to point at them instead of the old citation.
  - **B8-R1/B8-R2** (riders, both in `tests/app/print.js`'s `nameLines()`,
    the P16 helper): the `lines === 1` assertion became `lines <= 2` -
    matching owner decision Q2's actual cap of two lines, not the one-line
    measurement the plan's step wording ("pinning `cm26` at two lines")
    already implied should be the assertion - with the failure message
    naming the two-line cap by name. The loop now checks all four ids the
    route actually renders (`cm26`, `f60`, `hi62`, `ci81`), not only `cm26` -
    the earlier "all four longest names render at one line" claim rested on
    a scratchpad script that no longer exists in the repository; this closes
    that gap inside the same `$eval`/`ok` pair, at zero extra page loads.
    `docs/specs/FEATURES.md`'s "Print" section corrected in the same commit
    to match (it said "`tests/app/print.js` pins `cm26`'s name at one line",
    now "pins all four ids at a two-line cap") - the measured "all four at
    one line, 2026-09-18" **fact** itself was left exactly where it was, per
    the dispatch; only the sentence describing what the test asserts moved.
- Files changed: `app/src/components/RecordActions.svelte`,
  `app/src/components/RecordCard.svelte`, `app/src/ports/clipboard.ts`,
  `docs/specs/COVERAGE.md`, `docs/specs/FEATURES.md`, `tests/app/print.js`.
- Commit: `480c380 fix(phase-8): B8 remediation - focus ring clipping,
  gesture-safe copy, stale spec/test claims` - pushed.
- Deviations and rationale: the `fakeClipboard.writeImage` fix (above, under
  BL-2) is the one piece of work beyond the dispatch's literal file list
  (`app/src/ports/clipboard.ts` was already in scope for the comment fix,
  so no new file was opened) - recorded here in detail because the dispatch
  explicitly anticipated and warned against the alternative (editing the
  test instead), and this is the proof that alternative was not taken.
- Verification commands and results:
  - `rtk npm run check` (one foreground call, Bash timeout 600000, no pipe) -
    green: `format:check`, `lint`, `typecheck`/`svelte-check` (550 files, 0
    errors, 0 warnings), `npm run data`, `node tests/derived.js`,
    `.claude/hooks/selftest.mjs` (373 passed), the `node --test` suites,
    `npm run test` (45 files, 1131/1131 tests, coverage
    96.77/89.05/97.21/97.42 - thresholds green, at or above the pre-existing
    96.75/89.05/97.15/97.41).
  - `rtk node tests/run-all.js app/print` (its own foreground call) - green:
    "ok  app/print dist/: card printing  164.3s" / "все наборы прошли за
    164с (в 8 потока)".
  - `MSYS_NO_PATHCONV=1 rtk node tests/app/golden.js --only=#/i/` - 13
    record-page states compared, "структурные образцы (dist/): без
    изменений" (unchanged) - covers every state touched by `RecordCard.svelte`/
    `RecordActions.svelte`.
  - `MSYS_NO_PATHCONV=1 rtk node tests/app/golden.js --only=#/print/` - 9
    print states compared, "без изменений" - confirms the `print.js` test
    edits (assertions only, no app code touched) moved no rendered output.
  - Gates: `npm run check` (full); `node tests/run-all.js app/print`; both
    golden probes above (not individually mandated by the dispatch, run as
    the cheap "does not move" proof `context.md` recommends).
- Push and tree check: `git push origin main` (`c90f082..480c380` - see
  "Status" for the unexplained `c90f082` between dispatch and push); `git
  rev-parse HEAD origin/main` printed the same sha twice, confirming the
  push landed and `origin/main` matches this session's `HEAD`. CI not
  separately watched this session - `npm run check` and the two suites
  above are the local proof; nothing in the diff touches a CI-relevant file
  (workflow, deploy guard, generated data), so CI can be expected green.

## Next batch (implement-ready)
- **B8's remediation is committed and pushed** (`480c380`, on `main` at
  `origin/main`) - its one remediation cycle is now spent; BL-1, BL-2, BL-3,
  B8-R1 and B8-R2 are all `done 480c380` in `issues/phase-8/nits.md`. B8's
  remaining review findings (`B8-R3`..`B8-R6`, `B8-N1`..`B8-N8`) were not
  touched - they stay `outstanding` under "Outstanding - B12's scope" in
  that register, per this task's "nits are processed immediately" policy
  not applying to blockers-and-riders-only remediation cycles.
- **B9 is next**: language and format, `tests/` and `tools/` (H1, T7, H13,
  H16, H15, T12, H11). Objective, files, the four-commit split, acceptance,
  gates: `plan.md`, "B9". Re-derive every line number from the file at HEAD
  before starting - this remediation touched `docs/specs/COVERAGE.md`,
  `docs/specs/FEATURES.md` and `tests/app/print.js`; none are named in B9's
  own file list, but B9's other file-list line numbers should still be
  re-derived from HEAD per this task's standing practice.
- Do not fold B8's remaining review nits into B9 - route them through
  `issues/phase-8/nits.md` the same way B4-B7's were, per "Why this file
  exists" in that register. B12 is where the whole outstanding table clears.

## Notes
- Mocks path: none (no new UI element).
- Screenshot findings: none (no attachments).
- Cleanup performed / retained artifacts (B2): `i/` was renamed to `i.bak`
  and back during the run-all.js preflight test; verified restored (1091
  files). No other scratch artifacts.
- Cleanup performed / retained artifacts (B3): none - `npm run build`'s
  `dist/` is the normal build output and is already gitignored.
- Cleanup performed / retained artifacts (B4): a manually-collected `_site/`
  (mirroring the deploy job's `cp` step, used to prove the guard/check-site
  refactor locally before pushing) - `_site/` is **not** gitignored, so it
  was deleted with `find _site -delete` (the repo's `rm -r` guard blocks a
  direct `rm -rf` on a non-exempt directory) and confirmed gone from `git
  status`. The PR probe's branch and PR (`probe/dp4-stale-data`, PR #66) were
  closed/deleted (`gh pr close 66 --delete-branch`) and confirmed removed
  from the remote (`git ls-remote --heads origin probe/dp4-stale-data` -
  empty). No other scratch artifacts; `dist/` from local builds is
  gitignored as usual.
- Cleanup performed / retained artifacts (B5): none beyond the normal
  `npm run data`/`npm run build` outputs (`i/`, `dist/`), both already
  gitignored or untracked as usual; no scratch files, no probe branches.
- Session end partial progress (if any): none - B5 is a committed, pushed,
  and CI-verified boundary (two commits, `112bd07` and the `craft.js` fix
  `571b041`, both green on the second CI run).
- Cleanup performed / retained artifacts (B6): none beyond the normal `npm
  run data`/`npm run build` outputs (`i/`, `dist/`), both already
  gitignored or untracked as usual. Debug `console.error` calls added
  while chasing the `flushUrlSync`/`del()` staleness bug (R4-1/PF3) were
  all removed before committing - confirmed via `git grep -n
  "console.error\|DEBUG" -- app/src/components/ListPage.svelte` returning
  nothing. `issues/56/` (untracked, another task's) and
  `issues/phase-8/nits.md` plus the new `## B12` section in `plan.md`
  (both landed mid-session, presumably from a concurrent planner pass
  authorized separately - "let's instead plan b12 to fix ALL nits") were
  left untouched and unstaged in both commits, per "preserve unrelated
  working-tree changes, do not revert foreign work" - neither was written
  by this session, and `plan.md`'s own D5/O3 edit above was applied with a
  narrow `old_string`/`new_string` match specifically to avoid touching
  the new B12 section.
- Push and CI: `git push origin main` (`ae69e4c..cedc8ac`, all three
  commits - `370fec2`, `11066f0`, and this file's own docs commit
  `cedc8ac`). Run `35271584579`: `gh run watch 35271584579 --exit-status`
  - `check`, all four `browser` shards, `secrets` and `deploy` all green,
    including the live "The published site answers correctly" step.
- Session end partial progress (if any): none - B6 is a committed, pushed,
  CI-verified two-commit boundary (`370fec2`, `11066f0`).
- Cleanup performed / retained artifacts (B7): a temporary
  `.claude/launch.json` (a `serve dist` config, used twice to inspect the
  built app live in a browser - the P10 stacking-order check and the D3
  dismiss-button-visibility check) was created and deleted again before
  this note; confirmed gone from `git status`. No debug logging was added.
  Normal `npm run data`/`npm run build` outputs (`i/`, `dist/`) are
  gitignored/untracked as usual. `issues/56/` (untracked, another task's)
  left untouched.
- **Session end partial progress: yes - B7 is implemented, gate-verified
  (mostly in isolation), and re-recorded, but not committed.** Stopped on
  the orchestrator's explicit instruction because the orchestrator was
  running `npm run check` against this same tree concurrently. See
  "Status" and B7's own entry under "Completed" for the exact remaining
  steps (one clean `npm run check`, `git add` the one unstaged test file,
  then the two commits per the plan's split) and the full gate/deviation
  record so a different session could pick this up without re-deriving any
  of it.
- Cleanup performed / retained artifacts (B8): the P16 measurement script
  lived in the session's own scratchpad directory (outside the repository)
  and was never written into the tree - nothing to clean up there. Normal
  `npm run data`/`npm run build` outputs (`i/`, `dist/`) are
  gitignored/untracked as usual, regenerated several times over the course
  of the batch (the P16 build, the gate reruns). `issues/56/` (untracked,
  another task's) left untouched throughout.
- Session end partial progress (if any): none - B8 is a committed, pushed,
  gate-verified single-commit boundary (`3c0fff8`).
- Cleanup performed / retained artifacts (B7 remediation): none - no scratch
  files or probe branches; normal `npm run data`/`npm run build` outputs
  (`i/`, `dist/`) are gitignored/untracked as usual. `issues/56/` (untracked,
  another task's) left untouched throughout, per the dispatch.
- Session end partial progress (if any): none - B7's remediation is a
  committed, pushed, gate-verified single-commit boundary (`6b50945`).
