# Plan - TASK phase-8

Status: planned 2026-09-17 (planner). No batch implemented. Base `f53f44d` on
`main`. Owner questions in "Owner decisions" below; B1 is not blocked by any.

## Objective

Turn the twelve critique reports (`issues/phase-8/critique/`) and the register
(`docs/specs/DEBT.md` D1-D23) into an ordered, implement-ready sequence. Every
finding is either placed in a batch, deferred to one of the two excluded
tickets, or dropped with a named legitimate reason (section "Dropped").

## How to read this plan

- Findings are cited by their report id (`P1`, `C6`, `T4`, `H1`, `PF3`, `DC1`,
  `TL1`, `O1`, `R1`, `S1`, `DP1`, `A1`, `D1`).
- "Goldens" per batch: `none` means the accessibility trees under
  `tests/app/snapshots/` do not move and the batch proves it with a targeted
  run; `re-record` names the states and the reason. `node tests/app/golden.js
  --only=<substring of a state id>` runs a subset (`golden.js:32-33`, matched
  against `STATES[].id` such as `#/search ~ capped`); use it for the cheap
  "does not move" proofs, and the four `--shard=n/4` calls only where a batch
  re-records or where the claim is "identical DOM everywhere".
- Gates are sized per `.claude/README.md`, "Batch size and the fixed cost of a
  run". `npm run check` is one foreground call with `timeout 600000`:
  `set -o pipefail; npm run check 2>&1 | tail -n 120`.
- Parity-era reasoning is not a defence anywhere below. "The live app did it"
  explains a line; the specs decide whether it stays.

## Verified facts that change what the reports proposed

Checked read-only against `f53f44d` on 2026-09-17. Each one changes a batch.

1. **D7's cause is opacity, not the tokens.** `git grep -e '--muted'
   23c00a6^ -- style.css` shows the live app already used `--muted: #9b93b3`
   and `--muted2: #8a83a3` - the values `tokens.css:23,27` has today, with the
   4.93:1 / 5.41:1 measurements beside them. D7's `#77708c` at 3.77:1 is
   `#9b93b3` composited at the `opacity: 0.72` on `Chip.svelte:94` (`.chip
   small`) and `opacity: 0.75` on `ListPage.svelte:1111` (`.nlbl i`). The fix
   is two deleted declarations, not a palette change (B7).
2. **`#/search` has goldens.** `product.md` P7 says none exist; seven do
   (`_search.txt`, `_search_capped.txt`, `_search_searched.txt`,
   `_search_a_row_ticked.txt`, `_search_kind_off.txt`,
   `_search_nothing_found.txt`, `_search_stat_line.txt`). P7's count line
   moves `_search_capped` (B10).
3. **`CLAUDE.md` names two deleted suites.** "Focused: ... `node
   tests/run-all.js eqtest,qa`" - neither is in `SUITES`
   (`tests/run-all.js:40-59`); the command prints "таких наборов нет" and
   exits 1. `docs.md` recorded the opposite ("every suite name ... is in
   SUITES"). Also `node tests/run-all.js app/sweep,...` as one call exceeds
   the 600 s cap (`.claude/README.md:238`). Both in the CLAUDE.md proposal.
4. **The live `dhloot.prefs.v1` held `{ view }` only** (`git grep PREFS_KEY
   23c00a6^ -- app.js`: line 1088 writes `{ view: S.tables.view }`). The
   READMEs' "and the height of note fields" was never true on either app
   (`COVERAGE.md:60` already says "`noteH` in prefs (no such key exists)").
   That clause goes whatever the DC1 answer is.
5. **P13's word.** The corpus already leans one way: `help.ts:399,404` say
   "фреймы", `README.ru.md` uses "фрейм" four times and "сеттинг" once,
   `dict.ts` has `Фрейм` once and `Сеттинг`/`Сеттинги` twice. The
   `daggerheart-ru-terms` skill's rule is "look it up, not recall": the site
   section is `https://ru.daggerheart.su/frame`. B10 fetches that page once,
   quotes its title in the commit, and uses that word in all three keys;
   expected outcome "Фрейм"/"Фреймы".
6. **D16 has no benefit on either app.** The idle toast is `display: none`
   on both (`[popover]:not(:popover-open)` here; `hidden` on live), and a
   `display: none` element is not in the accessibility tree, so neither
   "pre-registered" a live region. Entry deleted with that reason (B3); no
   code.
7. **D8's `<h4 class="altcol">` lives in `TablesPage.svelte:538`, not
   `TableRows.svelte`** as the register says. B11 edits the right file.
8. **P4(b) and D6 are one change.** `AddToList.svelte:174` measures
   `root.querySelector('.btn')` - the first `.btn` inside `.seldrop`. Moving
   `.dropmenu` after the toggle `<Button>` (P4b) makes that query return the
   toggle, which is exactly D6's "measure the toggle" fix. Done together
   (B11), verified by the existing 1100x900 `states.js` case that presses
   "Кольцо Тишины" (`states.js:70,125`).
9. **P4(a) and the modal.** Escape inside the record modal reaches the
   `<dialog>`'s own close; the menu's `onkeydown` must `stopPropagation()`
   or the whole dialog closes. Noted in B11's steps.
10. **`tests/app/states.js` already has a 1100x900 case with no seed**
    (`states.js:68-70`), so D6's verification has a home.
11. **`git add -A` fingerprint (TL1/TL2)**: `work/` holds three PNGs today,
    un-ignored (`git status --porcelain -uall`), inside every commit-gate
    key. B2 is second on purpose: B3 edits ~40 markdown files, which under
    TL2 would re-arm the gate after every handoff write.
12. **O3 is D5 generalised.** D5 owes `<name> — <docTitle>` on record pages;
    O3 adds the section and list names. One `$effect` in `Shell.svelte`
    (B8).
13. **Cross-report identities the batches rely on**: T4 = DP4; PF3 = R4; S4 +
    R2 one trigger gap; C1 = A2's symptom; C6 is an extraction (architecture
    A-verdict), not a relocation; TL7 = DP8; T10 = DP9; DC10 = H3; DC11 = H4
    = TL4's stale prose; H6 and H7 are inside C5; T9 is inside C4; T8
    dissolves under T1; TL8(c) is the CLAUDE.md "parity run" line.

## Architecture and constraints that hold for every batch

- `app/src/lib/` stays pure; browser APIs behind `app/src/ports/`; shared UI
  in `app/src/components/`; a new component needs a `COVERED` entry in
  `app/src/components/a11y.test.ts:351` and a test that renders it under axe.
- Public contracts default to no change. No batch below changes the hash
  grammar, ids, link encoding or asset paths. R5 widens what `#/l/` accepts
  (a payload that was never valid now reaches the bad-link page); R8 adds a
  published file. Both update `ROUTES.md`/`META.md` prose and add a fixture
  row; neither changes an encoding. B20 (data apostrophes) moves generated
  data and is opt-in.
- Product laws are untouched: lists stay in hash + localStorage; `noindex`
  stays; tier never inferred; print stays nine 63x88 mm cards with two
  layouts; `data.js` stays a classic script.
- A behaviour change updates its spec in the same commit; a register entry
  is deleted in the commit that pays it.
- Commit as `artex-x <artex-x@users.noreply.github.com>`, Conventional
  Commits, no AI attribution trailer. Push after each batch's gates pass.

## Batches, in order

### B1 - search normalisation (O1, PF2)

- **Objective**: search finds `плетеная сеть`, `soldier's` and every other
  name it misses today, and stops re-lowercasing 322 KB per keystroke.
- **In scope**: one fold applied to both sides; a haystack built once per
  record at index time; the stat line folded into it for `eq` records.
- **Out of scope**: fuzzy matching; an input debounce; the render cost of
  300 rows (see "Dropped", PF1).
- **Files**: `app/src/lib/search.ts`, `app/src/lib/data.ts` (the `Index`),
  `app/src/lib/search.test.ts`, `app/src/lib/data.test.ts`,
  `docs/specs/FEATURES.md` ("Tables and search", one clause).
- **Steps**:
  1. In `search.ts` add `export function foldQuery(s: string): string` -
     `toLowerCase()`, then `ё`->`е`, `Ё`->`е` (after lowering, `ё`->`е`
     only), U+2019 and U+02BC -> `'`. Pure, no locale API.
  2. `Index` gains `hayOf(it: Record_): string` backed by a lazily filled
     `Map<string, string>`: `foldQuery` over `ru`, `en`, `rud`, `ende`
     joined with `\u0001`, plus the stat line for `eq` records. The stat
     line depends on `lang` and `Dict` (`statLineFor`), so `hayOf` takes the
     `StatLine` and keys the cache by `id + '\0' + lang`; simplest:
     `hayFor(statLine: StatLine, lang: Lang): (it) => string` returning a
     memoised reader, built by `SearchPage`/`TablesPage` once per language
     via `$derived`. Keep `matches(it, q, statLine)` as the fallback for a
     caller with no index (its `has` now folds the haystack too).
  3. `search()` folds the query with `foldQuery` instead of
     `trim().toLowerCase()`.
  4. Tests: a yo name (`плетеная` finds "Плетёная сеть"), an apostrophe
     name (`soldier's` finds "Soldier’s ..."), the existing lookalike case
     (`лук` does not find `клык`) unchanged, and one asserting the haystack
     path and the fallback path agree on the full catalogue for the six
     golden queries (`меч`, `двуручное`, `а`, `кольцо`, `вторичное`,
     `zzzqqqxx123`) - that is the golden-safety proof in code.
  5. `FEATURES.md`, "Tables and search": one sentence - search folds case,
     `ё`/`е` and typographic apostrophes; substring, not fuzzy.
- **Acceptance**: the four `search.test.ts` cases pass; `data.test.ts` covers
  the new accessor (per-file coverage on `data.ts`, `search.ts` holds);
  `node tests/app/golden.js --only=search` and `--only=searched` both green
  without `--update`; no component changes its rendered output.
- **Gates**: `npm run check`; `node tests/app/golden.js --only=search`;
  `node tests/app/golden.js --only=searched`.
- **Goldens**: none (O1's replay of the six golden queries showed identical
  hit counts; the `--only` runs are the proof).
- **Risks / do-nots**: do not fold `й`/`и` or strip diacritics - that is
  fuzziness nobody asked for. Do not fold the *displayed* strings anywhere.
  The owner rates the `ё` half low priority; the apostrophe half breaks
  English search (`soldier's` -> 0) and is the same line.

### B2 - hooks and ignore rules (TL1-TL8, H14, DP8/TL7)

- **Objective**: stop the commit-gate livelocks, close the two `bash-guard`
  holes, and make the cold-clone and long-run reminders true.
- **Files**: `.gitignore`, `.claude/.gitignore`, `.prettierignore` (comment
  cross-reference only), `.claude/hooks/tree-key.mjs`,
  `.claude/hooks/lib.mjs`, `.claude/hooks/bash-guard.mjs`,
  `.claude/hooks/selftest.mjs`, `.claude/README.md` (Hooks row, Known
  limitations), `tests/run-all.js`, `tests/derived.js:26`, `CLAUDE.md:36`
  (one word - see "CLAUDE.md proposal"; this line alone is uncontroversial
  and lands here).
- **Steps**:
  1. TL1/H14: `.gitignore` gains `.claude/worktrees/` and `work/` with the
     fingerprint reason beside them; `.claude/.gitignore` gains
     `settings.local.json`. Keep the `.prettierignore` line, but its comment
     points at `.gitignore` as the superset.
  2. TL2: export `isExempt` from `lib.mjs`, import it in `bash-guard.mjs`
     and `tree-key.mjs`; `treeKey()` drops `git ls-files -s` rows whose path
     is exempt before hashing. Comment on `isExempt` naming the trap:
     `tests/contracts.js:79-81` reads `CONTRACTS.md`/`ROUTES.md` but is not
     in `npm run check`; if it ever is, `docs/specs/**` stops being exempt.
     Selftest: arm the cache, append to `issues/65/handoff.md`, stage
     `app/src/lib/x.ts`, expect no deny.
  3. TL3: `citingLines()` skips an occurrence preceded by
     `/(?:[0-9a-f]{7,40}|HEAD[~^\d]*)\s*:\s*$/i`; `MSG.orphanPlan` gains the
     way-out sentence. Two selftest cases (a `git show <sha>:` citation does
     not deny; a bare one on the same line still does). Family 2
     (out-of-range line numbers) stays unimplemented, recorded in the README
     limitations.
  4. TL5: `restore` denies when `--worktree` or a `-W` cluster is present,
     `--staged` or not. One selftest case.
  5. TL6: `rm -r` without `-f` is denied inside the repo; exempt list gains
     `i`. Selftest: `rm -r app` denies, `rm -r dist` and `rm -r i` silent.
     README limitations gains the new shape.
  6. TL4: `LONG_CHECKS` gains rows for `node tests/app/golden.js` without
     `--shard` and `node tests/app/sweep.js`, each with the README's cost and
     the per-shard/per-width sentence; the `run-all` row's cost becomes the
     README's `~260-290s` for the filtered pool and says an unfiltered run
     cannot finish in one call; the `check` row says `~165s`.
  7. TL4/H4/DC11: `tests/run-all.js:65-68` comment re-pointed at
     `app/golden`; `--help`/`-h` prints the header usage and exits 0 before
     any suite starts.
  8. TL7/DP8: after `queue` is built, if it contains any of `derived`,
     `dataint`, `craft`, `stub` and `i/` is absent, print "i/ is missing - it
     is generated, not committed. Run `node tools/build.js` (or `npm run
     build`) first." and exit 1. Guard `tests/derived.js:26` with the same
     `existsSync` shape its lines 19-23 use.
  9. TL8: README Hooks row for `edit-guard.mjs` names
     `tests/app/snapshots/**`; `CLAUDE.md:36` "parity run" -> "browser suite
     run".
- **Acceptance**: `node .claude/hooks/selftest.mjs` passes with the five new
  cases; `git status --porcelain -uall` no longer lists `work/`; `node
  tests/run-all.js --help` exits 0 in under a second; `node
  tests/run-all.js stub` on a tree with `i/` renamed away exits 1 with the
  message (restore `i/` after).
- **Gates**: `npm run check` (selftest runs inside it).
- **Goldens**: none.
- **Risks**: hooks may be snapshotted per session (`.claude/README.md:126`);
  restart the session after editing before trusting a deny. Gitignoring
  `work/` hides it from the Stop hook's untracked sentence - accepted, it is
  documented scratch.

### B3 - truth fixes: docs, comments, dead code, test prose

- **Objective**: no live file states a fact R0c reversed; specs match the
  code they describe; dead exports and misleading test comments go.
- **Files and edits** (each one line unless said):
  - `docs/specs/STATE.md`: DC1 - **pending Q1**; if "restore", the row stays
    and B8 makes it true; if "record", delete the row, strike "Table view"
    from `:15-16`, add DEBT entry. Either way the READMEs' "and the height
    of note fields" clause goes (fact 4). R2's clause under "Two tabs" lands
    with B9, not here.
  - `docs/specs/COVERAGE.md`: DC2 (four "Known thin spots" bullets
    re-pointed at `tests/app/states.js` and `app/print`; the `craftmob`
    bullet deleted as a duplicate of `:359-366`); T11 (a paragraph naming
    `tools/**` as outside every coverage gate, `capture-share-fixture.mjs`
    as the unmitigated one); T16 (one clause: axe runs RU-only at
    360/390/768); DC13 (`NoData.svelte` has no inventory state because it
    needs `data.js` blocked; vitest owns it); H15 (name the fourteen deleted
    suites in the `:139` resurrection command - `git show 23c00a6 --stat`
    lists them); `:55` "compared byte for byte" gains "in CI, `git diff
    --exit-code` after `npm run check` is what makes the comparison bite"
    (lands true once B5 ships - write it as the rule, B5 makes it so);
    DC7 wording ("written while HEAD was `7a33c22`") at `:377`.
  - `docs/specs/ROUTES.md`: DC3 (`TABLE_DEFS` -> `TABLE_IDS`, `TAB_LIST` ->
    `SECTIONS`); DC4 (the `frames` alias sentence after `:49`,
    `TABLE_ALIASES` in the implementation list at `:7-8`).
  - `docs/specs/FEATURES.md:55`: DC3 (`TABLE_DEFS` -> `TABLE_IDS`).
  - `docs/specs/I18N.md:9-11`: DC5 (every value is a string; help panels are
    `help.ts` parts); O4 (three sentences: the 1091 stubs are Russian-only by
    design - `html lang="ru"`, Russian title and og text - and why).
  - `docs/specs/META.md:83-85`: DC6 - the rule, not the state of the tree:
    "Interface text is Russian and English; everything else - tests, tools,
    comments, developer docs - is English (`CLAUDE.md`). The `tests/` tree is
    being brought into line in phase 8."
  - `docs/specs/DEBT.md`: D16 deleted with fact 6 as the reason; D4 decided
    "kept": delete the entry, add the sharing to `FEATURES.md`, "Rolling"
    (one bullet); D17 decided "kept": delete the entry, `FEATURES.md`,
    "Records" gains the hover-zoom sentence; DC8 (`:413` cross-reference ->
    "`app/golden` row"); D8's file name corrected (`TablesPage.svelte:538`).
  - `docs/specs/CONTRACTS.md`, section 4: one line - `data.js` stores empty
    descriptions as `""`, `data.json` omits the key; consumers must treat
    both alike. `node tests/contracts.js` must stay green (it reads the file
    for group names only).
  - `llms.txt:19-20`: "Fetching `index.html` gives you an empty page" -> the
    `noscript` block carries the three data links; still not the app. Prose
    only; `tests/contracts.js:88-90` greps group names, unaffected.
  - `README.md:217`, `README.ru.md:223`: fact 4 (drop the note-height
    clause; the row itself follows Q1). `README.md:285-289`,
    `README.ru.md:293`: "Forgetting is not fatal: `tests/derived.js` ...
    fails a test" -> "CI fails on a stale committed copy" (B5's step).
  - `.claude/hooks/edit-followup.mjs:20`: the false "or tests/derived.js will
    fail" -> "or CI's stale-artefact step will fail".
  - `tools/build.js:10-11`, `tests/derived.js:1-4` header: same correction
    (the header is in Russian until B15; correct the claim in place, B15
    translates it).
  - `vite.config.mts:83-85` and `.gitignore:29`: H3/DC10.
  - `app/src/lib/i18n.ts:11`: H5 comment (names the one other copy in
    `tools/build-share-pages.js:40-47` and the guard B6 adds).
  - `tools/tg-preview/lib.mjs`, `client.mjs`, `manifest.mjs`: H2 - one
    header line each naming `issues/tg-preview-refresh/plan.md`, deleted at
    `1a06122`, readable with `git show 1a06122^:...`; H9 - `manifest.mjs:5-8`
    and `:19-24` collapsed to "`ROOT_HTML` is `app/index.html` because that
    is what the build publishes as `dist/index.html`".
  - `tests/app/inventory.js`: H8 - seven `per width` -> `per language`.
  - `tests/stub.js:6`: H15 - give the citation a verb ("ported from
    `craftmob.js:101-110`, deleted at `23c00a6`").
  - `eslint.config.mjs:14-19`: H11 comment (these trees run outside every
    tsconfig; the "older style" reason is gone). C9: add
    `'@typescript-eslint/no-confusing-void-expression': ['error', {
    ignoreVoidReturningFunctions: true }]` inside the `**/*.svelte` block and
    delete the three comments at `ListPage.svelte:642,892`,
    `PrintCard.svelte:144`; if `npm run lint` still flags any, leave that one
    and record it.
  - `app/src/ports/image.ts:56` + `ports/index.ts:23`: H10 - delete
    `brokenImage`; drop `export` on `NO_ART`, `REAL_DICE`, `moneyWord`,
    `fromBase64Url`, `FakeClipboard`.
  - `app/src/components/tables.test.ts:762-766`, `listsPage.test.ts:133-140`:
    C4/T9 - correct both comments (the assertions pin text-node structure;
    Chrome computes the name with the space and `title` is the description)
    and switch the pill assertion to the `childNodes` idiom of
    `record.test.ts:271-279`; `record.test.ts:395,406,412` and
    `printPage.test.ts:341` gain the one-line "positional on purpose"
    comment; `listPage.test.ts:733` keeps its unit-level proof reference.
  - C3 option 2: the four `prettier-ignore` comments (`TableRows.svelte:160-170`,
    `ListsPage.svelte:138-147`, `PrintCard.svelte:236-243`,
    `FilterBar.svelte:114`) cut to one line each plus a pointer to the rule,
    which is written once in `docs/specs/COVERAGE.md` under a new short
    heading "Whitespace text nodes are content": Prettier's default
    `htmlWhitespaceSensitivity: css` reflows whitespace around block tags;
    where `textContent` or an accessible name reads it, `prettier-ignore` the
    whole subtree and pin it with a `childNodes` test. `.prettierignore`'s
    `app/index.html` line: mark permanent with a one-clause reason (the
    `noscript` prose is hand-wrapped; `tests/derived.js` reads its head).
  - H12: `git mv` `Chip.test.ts` -> `chip.test.ts` and `OrGrid.test.ts` ->
    `orGrid.test.ts` (case-only rename on Windows: move via a temporary name).
  - H13: the four non-ASCII punctuation marks in English comments
    (`tools/derived.js:31`, `tools/build.js:11`, `app/src/state/app.test.ts:225`,
    and `tools/build.js:26`'s output em dash).
  - `tests/app/sweep.js:92`: T12 (drop "and 360").
  - `app/src/lib/types.ts:123`: A8 comment ("Vault of Ages section, not an
    equipment tier; equipment's own tier is `eq.tier`").
  - `PrintCard.svelte:62-80`: PF7 - one clause naming `container-type: size`
    as what keeps `fit()` linear.
  - `CLAUDE.md`: **pending Q7**; only the `:36` word (B2) and the `:97`
    `COUNTERS` pointer (DC12: "the nine files `tests/derived.js:448-450`
    names") land unasked.
- **Acceptance**: `git grep -n -e TABLE_DEFS -e TAB_LIST -e 'dhloot.prefs'
  -- docs README.md README.ru.md` returns only what Q1 keeps; `git grep -n
  'per width' -- tests/app/inventory.js` is empty; `git grep -n
  'derived.js will fail' -- .claude` is empty; `npm run lint` clean with
  the three disables gone (or the survivor recorded); `git grep -n
  brokenImage -- app` is empty; `tests/contracts.js` green.
- **Gates**: `npm run check`; `node tests/run-all.js contracts,derived`.
- **Goldens**: none (comments and docs; the two test rewrites assert the
  same DOM).

### B4 - CI shape (T1, T2, T5, T3, T8)

- **Objective**: the browser work is spread over the runners that today sit
  idle; wall clock ~738 s -> ~390 s at about +10% billed minutes.
- **Files**: `tests/run-all.js`, `tests/app/sweep.js`,
  `.github/workflows/ci.yml`, `tests/derived.js:529-541`,
  `tests/app/contracts.js`, `.claude/README.md` ("Batch size..." one
  sentence: a local gate's fixed cost is minutes, a CI job's is ~20 s).
- **Steps**:
  1. T5: replace the weight column with the CI seconds in `tests.md` 0.3
     (sweep 1180 -> split below, 768 319, 390 327, 360 325, contracts 256,
     print 160, states 103, typo 78, hues 67, goldens ~100 each, fs rows
     0-2); the comment says which host and date, and that a local run is
     advisory.
  2. T2: `sweep.js` takes an optional language argument after the widths
     (`node sweep.js 1180 ru`); `run-all.js` splits the 1180 row into
     `['1180','ru']` and `['1180','en']`; the focus walk stays on the RU row.
     `keyOf` already keys on `s[3]`, so the artifact names stay unique.
  3. T1: `run-all.js` gains `--shard=n/m` partitioning `queue` by
     longest-processing-time-first over the weights (disjoint and
     exhaustive, the `golden.js:35-48` contract); drop `--exclude=app/golden`
     from CI; `ci.yml`: `check` keeps steps 1-8 (`npm run check`, build,
     smoke, budget); one `browser:` matrix job of four runs `npm run build`
     then `node tests/run-all.js --shard=N/4` and uploads `test-output/` on
     failure (T8 dissolves); the `golden:` job is deleted; `deploy.needs`
     becomes `[check, audit, secrets, browser]`; `tests/derived.js:540`
     asserts `browser` instead of `golden`.
  4. T3: in `tests/app/contracts.js` hoist `fresh()` out of the
     address-grammar loop (`:128-164`) and `rowsAt` (`:194-199`), clearing
     storage between opens; leave the list-fixture sections per-fixture.
- **Acceptance**: `node tests/run-all.js --shard=1/4 --jobs 1` locally lists
  a disjoint subset and the four shards together equal `SUITES`; CI on the
  pushed commit shows `browser (1..4)` each under ~350 s and `check` ~110 s;
  `deploy` runs; the run's total wall clock is recorded in the handoff
  against 738 s.
- **Gates**: `npm run check`; one local `node tests/run-all.js --shard=4/4`
  (the lightest shard, ~160 s); push and `gh run watch`.
- **Goldens**: none (the same 110 states run, on a different runner).
- **Risks**: `tests/derived.js` pins `deploy.needs`; change it in the same
  commit or `npm run check` goes red. A mis-packed shard is a slow shard,
  not a lost test.

### B5 - deploy and gate correctness (DP1-DP7, T4/DP4, T6, T10/DP9)

- **Objective**: every gate in `ci.yml` can actually fail for the reason it
  exists; the rollback is documented at its real cost; the deploy cannot hold
  the `pages` group for six hours.
- **Files**: `.github/workflows/ci.yml`, `tools/check-site.mjs` ->
  `tools/check-site.lib.mjs` + `tools/check-site.test.mjs`, `package.json`
  (`check` gains `node --test tools/check-site.test.mjs`),
  `tests/app/golden.js` (exports) + `tests/app/golden.test.mjs` (or under
  `tools/`; wherever `node --test` can reach it without puppeteer at import),
  `package.json` again for that test.
- **Steps**:
  1. DP1: `timeout-minutes: 30` on `check` and `browser`, `10` on `deploy`,
     `audit`, `secrets`; `check-site`'s `get()` passes
     `signal: AbortSignal.timeout(15_000)`.
  2. DP3: `contents: read` in the deploy job's `permissions`.
  3. DP4/T4: a `check`-job step after `npm run check`: `git diff --exit-code
     -- data.json catalog.csv` with the one-line reason.
  4. DP2: the three-line stub count in the guard (`wc -l catalog.csv` minus
     header equals `ls _site/i | wc -l`).
  5. DP6: `concurrency.group` becomes `pages` on push-to-main and
     `ci-${{ github.ref }}` otherwise; `cancel-in-progress` true for
     non-push.
  6. DP7: keep `.nojekyll`; correct the comment (it never reaches the
     artifact - `upload-pages-artifact` excludes dotfiles - and would matter
     only under a branch build).
  7. DP5: four comment lines in the recovery block: the re-run path with its
     measured cost, and "re-running an older run's deploy job publishes that
     commit - a rollback, never a retry". Measure by `gh run rerun <latest
     green run id> --job <deploy job id>` (republishes the same tree, safe)
     and record the wall time.
  8. gitleaks pin: `gitleaks/gitleaks-action@<full sha>` with the tag in a
     comment; `actions/*` stay on major tags (first-party, documented as the
     deliberate line).
  9. T10/DP9: `check-site.lib.mjs` exports `checks(read)`: an array of
     `{ path, test(body, meta), message }` driven by an injected reader;
     `check-site.mjs` keeps the retry loop and runs it with `fetch`;
     `check-site.test.mjs` runs it against an in-memory good site and three
     broken ones (404 root, tiny bundle, stub without `og:image`). Messages
     become English here (this file leaves B15's scope). The `ci.yml` guard's
     duplicated `grep` lines (`:231-265`) are replaced by `node
     tools/check-site.mjs --dir _site` using a filesystem reader; the `cmp`
     and "nothing private" loops stay in bash.
  10. T6: `golden.js` exports its pure half (`collapse`, `normUrl`, `clean`,
      the `bySig` retention, `namelen`/`namehash`, `sectionsOf`, `headerOf`,
      `compareGolden`) behind `if (require.main === module)`; a `node --test`
      file exercises rule A at 5 and 6 siblings, rule B at 63/64/65 code
      points, the joined-versus-split text node, `normUrl` on a `file://`
      and an `https://` URL, and a `sectionsOf`/`headerOf` round trip.
      `golden.js` must not require puppeteer at module load for this to
      work - move the `require('./lib.js')` under the main guard.
- **Acceptance**: a deliberately stale `catalog.csv` (edit, do not rebuild,
  push to a branch, open a PR) turns `check` red at the new step and green
  again after `node tools/build.js`; `node --test tools/check-site.test.mjs`
  fails on each of the three broken fakes; the deploy job's log shows the
  stub count line; the recorded re-run time is in the handoff.
- **Gates**: `npm run check`; push; `gh run watch`; the PR probe above.
- **Goldens**: none.
- **Risks**: DP6's expression must be tested on a PR before merging to
  `main`, or a syntax slip blocks every deploy.

### B6 - lib and generator single sources (A1, A3, A4, A5, A7, A9, A11, O5, O6, H5 guard)

- **Files**: `app/src/lib/label.ts`, `tables.ts`, `listLink.ts`, `money.ts`,
  `roll.ts`, `alt.ts`, `std.ts`, `frames.ts`/`types.ts`, `numField.ts`,
  `print.ts`, their tests, `tools/build-share-pages.js`,
  `app/src/lib/i18n.test.ts` (H5 guard).
- **Steps**:
  1. A1: delete `GROUPS`/`SUBS` from `label.ts`; `whereFrom` resolves
     `groupOf(table).label` and `subLabelOf(table)` through `dict(lang)`.
     `label.test.ts` pins the strings unchanged.
  2. A3: `listLink.ts` imports `MoneyMode`, `MONEY_MODES`, `MONEY_DEFAULT`
     from `money.js`; delete its copies.
  3. A4: `roll.ts` imports `Rarity` from `money.js`, `RARITY_ORDER:
     readonly Rarity[]`; `alt.ts` `RARITIES = RARITY_ORDER`.
  4. A5: `label.ts:133` -> `EQ_TABLE_OF`.
  5. A7: `std.ts:15` typed `Record<Rarity, readonly number[]>` (four of the
     five keys - use `Partial<Record<Rarity, ...>>` or a `Pick`; the point is
     a typo becomes a compile error).
  6. A9: `Record_.frame?: FrameId` and `frameName(id: FrameId, ...)`, or
     delete the unused `FrameId` export - pick the typed route if `data.js`
     values already match `FRAME_ORDER` (they do: `dataint` checks frames).
  7. A11: `roll.ts` imports `clamp` from `numField.js`; `print.ts:38`
     `DIE_ART` -> `DICE_WITH_ART`.
  8. O5/O6/"830": `build-share-pages.js:109` `(it.rud || it.ende || '')`;
     `:160` renders the description through the same flat string, or splits
     `\n`-separated "- " lines into `<p>`/`<li>` (reuse nothing from
     `desc.ts` - it is TS; a 6-line CJS split is fine); `:169` "830" ->
     "1091". Export the `EQ_*` maps.
  9. H5 guard: `i18n.test.ts` uses `createRequire(import.meta.url)` to load
     `tools/build-share-pages.js` and asserts its `EQ_*` tables equal
     `i18n.ts`'s pairs (Russian and English).
- **Acceptance**: `npm run check` green with `label.test.ts`,
  `money.test.ts`, `alt.test.ts`, `roll.test.ts` unchanged in expectations;
  `node tests/run-all.js derived,stub` green (the stubs regenerate with the
  O6 shape and `tests/derived.js` compares against the same generator);
  `node tests/app/golden.js --only=#/i/` green without `--update`.
- **Gates**: `npm run check`; `node tests/run-all.js derived,dataint,stub`;
  `node tests/app/golden.js --only=#/i/`.
- **Goldens**: none (strings identical by construction; stubs are not in the
  goldens).

### B7 - components: `say`/`copied`, tokens, Badge, NumRow, D7 (C1/A2, C5, H6, H7, C2, C7, C8, D7)

- **Files**: `app/src/state/app.svelte.ts`, `PageHead.svelte`,
  `RecordActions.svelte`, the ten page components, `Badge.svelte` (new),
  `NumRow.svelte` (new), `RecordCard.svelte`, `RowMain.svelte`,
  `ListsPage.svelte`, `AltPanel.svelte`, `RollPanel.svelte`,
  `StdPanel.svelte`, `ListPage.svelte`, `Chip.svelte`, `tokens.css`,
  `App.svelte`, `a11y.test.ts` (`COVERED`), `tests/app/sweep.js:363`,
  `docs/specs/DEBT.md` (D7 deleted).
- **Steps**:
  1. A2: `AppState.copied(run: () => Promise<boolean>, ok: string):
     Promise<void>` - awaits `run()`, toasts `ok` or `t.copyFailed` with
     `error: !ok`. Convert the 14 `env.clipboard` sites.
  2. C1: `AppState.say(msg, opts)` keeps its shape; delete the ten shims and
     the `say` prop on `PageHead`/`RecordActions` - each calls `app.say(msg,
     { error })` directly. `state/lists.test.ts:19`'s shim is a test double
     for `ListStore`'s injected `say`; leave it.
  3. C5/H6/H7: `--ink-on-gold: #1a1206` replaces the eight literals; delete
     `--gap`, `--gap-lg`, `--step--2`, `--step--1`, `--step-1`, `--step-2`
     (zero `var()` users - verified); move the page-heading comment above
     `--h-page-*` and replace its last sentence with "`tests/app/typo.js`
     measures rendered sizes against its own scale list; a new step here has
     to be added there too"; rewrite the `:56` claim to describe what the
     file is.
  4. D7: delete `opacity: 0.72` (`Chip.svelte:94`) and `opacity: 0.75`
     (`ListPage.svelte:1111`); remove the `color-contrast` allow at
     `sweep.js:363`; delete D7 from the register; `FEATURES.md` needs no
     bullet (contrast is not a feature).
  5. C2: `Badge.svelte` with `cls`, `title?`, `children`; one-line template
     with no leading/trailing whitespace (the `RowMain.svelte:96-98` run is
     whitespace-critical); the base rule plus nine variants including `.num`;
     replace the three copies; `--badge-bg: rgb(10 8 16 / 50%)` and
     `--gold-rgb: 216 171 94` in `tokens.css` while the rules move.
  6. C7: `NumRow.svelte`; replace the five copies; `ListsPage.svelte:194`
     `.numrow .grow` -> `.grow`; fold `.results { margin-top: 26px }` into
     the three files' remaining rules as-is (three lines, no component).
  7. C8: `App.svelte:49-56` -> outer `{#if app.route.kind === 'section'}`,
     `{@const cfg = ROLL_TABLE[app.route.section]}`, `{#if cfg}`.
  8. `COVERED` entries for `Badge.svelte` and `NumRow.svelte`.
- **Acceptance**: `git grep -n '#1a1206' -- app/src` returns only
  `tokens.css`; `git grep -c 'const say = ' -- app/src/components` is 0; the
  14 clipboard sites read `app.copied(...)`; all four golden shards green
  without `--update` (identical DOM is the claim; this is its proof);
  `node tests/app/sweep.js 768` reports no `color-contrast` violation on
  `#/roll/alt` or `#/lists/a` with the allow removed; `app/typo` and
  `app/hues` green.
- **Gates**: `npm run check`; `npm run check:built`; `node
  tests/run-all.js app/typo,app/hues`; `node tests/app/sweep.js 768`; the
  four golden shards, one call each.
- **Goldens**: none - and the four-shard run is required, because C2's
  whitespace claim and C7's `.grow` claim are exactly what a tree diff
  catches.

### B8 - shell, router and state (P1, D19, D5/O3, P11, R7, S1, S2, S3/D2, S6, R5, R4-2, DC1 code, R9/R10 per answer)

- **Files**: `Shell.svelte`, `TabBar.svelte`, `App.svelte`,
  `app/src/state/app.svelte.ts`, `app/src/lib/hash.ts`,
  `app/src/ports/router.ts`, `ports/types.ts`, `shell.test.ts`,
  `app.test.ts`, `hash.test.ts`, `docs/fixtures/urls/routes.json`,
  `docs/specs/ROUTES.md`, `docs/specs/FEATURES.md` ("Chrome", "Records"),
  `docs/specs/DEBT.md` (D2, D5, D19 deleted), `TablesPage.svelte` (DC1 if
  restore).
- **Steps**:
  1. P1: the skip link's `onclick` calls `preventDefault()` and focuses
     `#main` (`tabindex="-1"` is already there); `href` stays for semantics.
     `shell.test.ts`: from `#/tables/eq_weapon`, activating the link leaves
     `app.hash` unchanged and moves focus to `main`.
  2. D19: `.skip:focus` becomes the overlay - `position: absolute; left: 0;
     top: 0; z-index: 300; background: var(--gold); color:
     var(--ink-on-gold); font-weight: 700; padding: 10px 16px;
     border-radius: 0 0 10px 0` - no layout shift. `FEATURES.md`, "Chrome":
     one clause. D19 deleted.
  3. D5/O3: the `Shell.svelte:26-29` effect sets `document.title` to
     `<name> — <docTitle>` on a record route (`nameOf(it, app.lang)`), to
     `<section label> — <docTitle>` on a section, `<list name> —
     <docTitle>` on a list page, plain elsewhere. `shell.test.ts` covers
     record, section, language switch and `#/i/nope`. `FEATURES.md:153`
     rewritten. D5 deleted.
  4. P11: `TabBar.svelte` effect keyed on `current`: set the nav's
     `scrollLeft` so the lit link is in view (`offsetLeft` arithmetic, not
     `scrollIntoView`, which can scroll the page vertically). Test with
     mocked `offsetLeft`/`clientWidth`.
  5. S2/R7: `go()` assigns `this.hash = this.#fallback(hash)`; `App.svelte`
     gains `{:else}` rendering the same not-found block `RecordPage` uses
     for an unknown id; wrap the page slot in `<svelte:boundary>` with a
     `failed` snippet that names the error and offers reload (the smallest
     boundary; not a reporting framework). `app.test.ts` + a component test
     that throws in a child.
  6. S1: the router handler skips the hash `go()` just wrote (`#expectHash`
     set in `go()`, consumed in the handler); test: `start()` then `go()`
     -> `navigations === 1`.
  7. S3/D2: `#expand()` re-reads `this.route` in `then`/`catch` and returns
     unless it is still the same packed payload; test with an on-demand
     `unpack`. D2 deleted; `FEATURES.md`, "Lists": one clause.
  8. S6: `stop()` calls `hideToast()`.
  9. PF/S "noticed": `route` and `section` become `$derived` class fields.
  10. R5: `hash.ts:91` -> `/^l\//`; `ROUTES.md:112` gains "anything under
      `l/` reaches the shared-list page; `decodeList` decides"; a
      `routes.json` row for `#/l/ABC.` resolving to `sharedList`; `hash.test.ts`
      case; `tests/contracts.js` replays the fixture.
  11. R4-2: `router.ts:39-43` wraps `replaceState` in `try/catch` falling
      back to `location.hash = hash`; `ports.test.ts` case with a throwing
      `replaceState`.
  12. DC1 (**Q1 = restore**): `AppState.tablesView` read from
      `dhloot.prefs.v1` `{ view }` at construction, written on change;
      `TablesPage.svelte:91` reads/writes it; `app.test.ts` covers a bad
      value falling back. (**Q1 = record**: nothing here; B3 did the docs.)
  13. R9 (**Q3 = fallback**): `hash.ts:104` returns `{ kind: 'unknown' }`
      for a named table that is neither an alias nor a `TableId`; bare
      `#/tables` unchanged; `readHome`'s `#/tables/frames` line stays;
      `ROUTES.md:51-53` rewritten; `hash.test.ts` + a `routes.json` row.
      (**Q3 = empty state**: `TablesPage` draws `Empty` for a named unknown
      table on a cold open; `ROUTES.md` says so.)
  14. R10 (**Q4 = keep the address**): `#expand()`'s failure path sets
      `app.expandFailed = payload` instead of replacing with `zzzz`;
      `ListPage.svelte:581-584` draws the bad-link state when
      `route.packed && app.expandFailed === route.payload`; the `_l_zzzz`
      state stays (a plain bad payload still draws it). Test in
      `listPage.test.ts`.
- **Acceptance**: every step's named test; `node tests/app/golden.js
  --only=#/l/` green without `--update`; `node tests/app/states.js` case 15
  (history) green; `git grep -n zzzz -- app/src` only where Q4 leaves it.
- **Gates**: `npm run check`; `npm run check:built`; `node
  tests/app/golden.js --only=#/l/`; `node tests/run-all.js app/states`.
- **Goldens**: none expected (D19 is CSS; P1 changes no attribute; titles
  are not in the tree); the `--only=#/l/` run proves R5/R10.

### B9 - lists and two tabs (R1, R2, S4, S5, S7, R3/P9, R4-1/PF3, D23, D12, A6, P5, "noticed" ride-alongs)

- **Files**: `app/src/state/lists.svelte.ts`, `app/src/ports/storage.ts`,
  `ports/types.ts`, `app/src/lib/listLink.ts`, `ListPage.svelte`,
  `ListsPage.svelte`, `SharedListPage.svelte`, `AddToList.svelte`,
  `StorageNotice.svelte`, `app/src/lib/dict.ts`, their tests,
  `tests/app/inventory.js` + one seeded golden, `docs/specs/STATE.md`,
  `docs/specs/FEATURES.md` ("Lists"), `docs/specs/DEBT.md` (D12, D23
  deleted).
- **Steps**:
  1. R1: `load()` distinguishes absent from unreadable; on unreadable it
     copies the raw string to `dhloot.lists.v2.bad` once and sets
     `this.unreadable = true`; `ListsPage`/`ListPage` draw a notice (new
     dict pair `listsUnreadable`/`...Title`, the `.warn` shape
     `StorageNotice` already draws for "storage refuses"); `STATE.md` key
     table gains the `.bad` row; `lists.test.ts:55-58` extended; new
     inventory state `#/lists ~ unreadable storage` seeded with
     `'dhloot.lists.v2': '{'`, golden seeded with `--update --only=unreadable`.
  2. R2: `onExternalChange(fn: (key: string | null) => void)`;
     `browserStorage` also listens on `visibilitychange` (visible) and
     `pageshow` and calls `fn(null)`; `watch()` reloads on `LISTS_KEY` or
     `null`; `memoryStorage` gains a way to fire it for tests; `STATE.md`,
     "Two tabs": the re-read also happens when the page returns to the
     foreground. Note the caret-move caveat in the commit message.
  3. S4: `ListPage` re-seeds a note textarea when it is not focused and its
     value differs from the store (a `$effect` per snippet instance reading
     `o.note`/`o.hnote` and `document.activeElement`); `seedText`'s
     mount-time `textContent` write stays.
  4. S5: `load()` filters `#deleted` (or `watch()` does at assignment).
  5. S7: the two page-level tests (external write to the open list; a write
     that deletes it) via `withCapturedListener`.
  6. R3/P9: `decodeList` returns `dropped: number` alongside; `restore()`
     passes `money`, `note`, `hnote` through and toasts the dropped count
     (new dict pair `entriesDropped`); `SharedListPage` toasts it once on
     open. Encoding untouched; fixtures untouched.
  7. R4-1/PF3: the `ListPage.svelte:112-115` effect debounces
     `app.syncListUrl(l)` by 150 ms trailing, flushed in `onDestroy` and on
     `pagehide`; `own`'s `r.payload === app.urlPayload` short-circuit keeps
     resolving by id while the URL lags (`:77-79`); `save()` stays
     synchronous (its debounce is deferred - see "Deferred"). Test: twenty
     `setNote` calls produce one `replace`.
  8. D23: `ListPage` watches `app.navigations` and clears `lsel`; test with
     history between two lists.
  9. D12: keep `aria-pressed`; `listPage.test.ts` asserts it on the money
     picker; entry deleted; `FEATURES.md:218-221` already states it.
  10. A6: private `goldEdit(next: (id, gold) => number | null, msg)` in
      `ListPage.svelte` replacing the three bodies; toast strings unchanged.
  11. P5: `store.remove()` returns what it removed and its index; `del()` in
      both pages toasts `listDeleted` (new dict pair) with an undo that
      un-sets `#deleted[id]`, splices the list back at its index and saves;
      the tick-chip removal in `AddToList.svelte:81-84` gains an undo via
      `restoreEntry` at the original index. `FEATURES.md`, "Lists": "delete,
      with undo".
  12. Ride-alongs: `create()` returns `this.lists[0]`; `StorageNotice`'s
      `works()` result cached on `AppState` at construction (the comment
      becomes true); `parseItems` clamps `qty` to 99 and `gold` to 99999
      (the field maxima at `ListPage.svelte:839,859`).
- **Acceptance**: every step's test; `node tests/app/golden.js --only=lists`
  and `--only=#/l/` green without `--update` (except the one new state);
  `node tests/app/states.js` two-tab case green.
- **Gates**: `npm run check`; `node tests/app/golden.js --only=lists`;
  `node tests/app/golden.js --only=#/l/`; `node tests/run-all.js app/states`.
- **Goldens**: one new state seeded (R1). Nothing else moves; the
  mount-time seed is preserved (S4).

### B10 - accessible names and product text (P2, P3, P6, P7, P13, P14, P15, pill name, D11)

- **Files**: `TableRows.svelte`, `ListPage.svelte:803`, `RecordModal.svelte`,
  `ListsPage.svelte`, `AddToList.svelte`, `SearchPage.svelte`,
  `FilterBar.svelte`, `app/src/lib/dict.ts`, `app/index.html:56`, the
  affected tests, `tests/app/inventory.js` (no new state), all four golden
  shards, `docs/specs/FEATURES.md`, `docs/specs/DEBT.md` (D11 per Q6).
- **Steps** (commit 1 - code; commit 2 - `--update` re-record):
  1. P2: row checkboxes named `nameOf(it, lang)` at `TableRows.svelte:122,154`
     and `ListPage.svelte:803` (the list page's `t.pickRow` is the same
     class); `t.selected` keeps its selection-bar use.
  2. P3: `RecordModal.svelte:79` `aria-label={nameOf(it, app.lang)}`.
  3. P6: `aria-label` off `t.newList`, `t.importList`, `t.newList` on the
     three inputs (`ListsPage.svelte:114,127`, `AddToList.svelte:265`).
  4. P7: `SearchPage` keeps the unsliced length and renders the
     `shown out-of total` line where `FilterBar` puts it when the cap bites.
  5. P13: fetch `https://ru.daggerheart.su/frame`, quote the section title,
     set `srcFrame`, `frameF`, `subFrames` to that word (expected
     "Фрейм"/"Фреймы"); `help.ts:399,404` already say "фреймы".
  6. P14: one editorial pass over `dict.ts` - English quotes straight
     everywhere (`listCreated`, `removedItem` lose the curly pair); Russian
     dashes: em dash where a dash stands alone (`rollHint`, `uniqueHint`,
     `printSub`, `guessWhy`, `repriceHint`), en dash in ranges (unchanged);
     `roll.test.ts`'s `rollLabel` and `tests/derived.js`'s `footBefore`
     untouched.
  7. P15: `app/index.html:56` "1091 запись"; `dict.ts:200` reworded so the
     numeral agrees ("по всем 1091 позициям" or restructure).
  8. Pill: `<i aria-hidden="true">&times;</i>` in `FilterBar.svelte:88`; the
     name becomes "Ранг 1", the description stays.
  9. D11 (**Q6 = print**): drop the `isFrameRecord` guard at the seven
     rewrite sites (`label.ts:33,111`, `RecordCard.svelte:86,177`,
     `RowMain.svelte:78`, `TableRows.svelte:84`, `RecordPage.svelte:52`,
     `PrintCard.svelte:34`, `share.ts:90`, `search.ts:34`) together; invert
     `search.test.ts`'s D11 case; `record.test.ts` asserts `f33`'s tier
     word; recapture `docs/fixtures/share/records.json` with
     `tools/capture-share-fixture.mjs` (only `f33` should change); delete
     D11. (**Q6 = keep**: `FEATURES.md`'s campaign-frame line gains the
     owner's reason; delete D11; no code.)
- **Acceptance**: commit 1 leaves `npm run check` green with the named test
  updates; commit 2's golden diff contains only: `checkbox "<record name>"`
  where `checkbox "Выбрано"` was, `dialog "<record name>"` in five files,
  the three textbox names, the frame word in `_tables_other_frames*`,
  `_tables_frames`, `_tables*` filter panels and frame-record badges, the
  `subSearch` head in `_search*`, `_search_capped`'s count line, the pill
  names in `_tables_eq_weapon_filtered` and siblings, and (Q6) tier words on
  frame records. Any other diff line is a defect to explain before the
  re-record is committed.
- **Gates**: `npm run check`; `npm run check:built`; the four golden shards
  with `--update`, then the four shards again without it (green); `node
  tests/app/sweep.js 768` (names).
- **Goldens**: re-record, most of the 110 (every state with a row checkbox).

### B11 - structure, targets and the register's a11y entries (P4/D6, P8, P10, P12, D3, D8, TablesPage untrack)

- **Files**: `AddToList.svelte`, `RecordCard.svelte`, `SharedListPage.svelte`,
  `app/src/state/app.svelte.ts` (`toggleAllIn`), `TablesPage.svelte`,
  `SearchPage.svelte`, `Shell.svelte`, `ListPage.svelte`,
  `StorageNotice.svelte`, `app/src/test/a11y.ts` call sites,
  `tests/app/sweep.js:360,364-366`, `tests/app/states.js` (D6 assertions),
  the goldens, `docs/specs/FEATURES.md`, `docs/specs/DEBT.md` (D3, D6, D8
  deleted).
- **Steps** (same two-commit shape as B10):
  1. P4(a): `onkeydown` on `.seldrop`: Escape clears `app.menuFor` and
     `newListFor`, refocuses the toggle, `stopPropagation()` so the dialog
     stays open.
  2. P4(b)/D6: move `.dropmenu` after the `<Button>`; the placement effect
     measures the toggle (`:scope > .btn`) against the nearest clipping box
     (`.modal-card` or the window); `RecordCard.svelte:269` `.card` gets
     `overflow: clip` (check the rounded corners still clip). `states.js`:
     after opening the menu on Кольцо Тишины at 1100x900 with no lists,
     `.card.scrollTop === 0` and the menu box lies inside `.modal-card`;
     after "+ Новый список", the input is inside and focused. D6 deleted;
     `FEATURES.md:95-97` rewritten.
  3. P8: `toggleAllIn` moves to `AppState` (third use); `SharedListPage`
     passes `ontoggleall`; Print and Copy-text buttons are not added (the
     selection bar provides them once rows are ticked).
  4. P10: `Shell.svelte` renders `<SelBar>` before `<footer>`; measure the
     page-bottom overlap at 1180 and 375 before committing and record it.
  5. P12: the `PageHead.svelte:136-144` `::after` 44x44 target copied onto
     `.note-x`, `.warn-x` and `.selx` (26px at desktop).
  6. D3: the dismiss cross moves out of `<summary>` to a sibling positioned
     over the corner; every `{ allow: ['nested-interactive'] }` in
     `a11y.ts` call sites and `sweep.js:360` removed; D3 deleted;
     `FEATURES.md:123-131` rewritten.
  7. D8: `TablesPage.svelte:538` - each rarity section gets an `<h2>` (the
     section title already drawn as text) and the columns become `<h3>`;
     `sweep.js:364-366` allow removed; D8 deleted; `FEATURES.md:210` clause.
  8. `TablesPage.svelte:75-78` wraps its `lastTable` write in `untrack`
     (style, matching `:107`/`:136`).
- **Acceptance**: commit 2's golden diff contains only: the menu after the
  button in `_i_ci1_list_menu`, `_i_ci1_new_list`, `_i_ci1_many_lists`,
  `_tables_bar_menu`, `_tables_a_row_opened_list_menu`,
  `_tables_a_row_opened_new_list`; a select-all row in `_l_shared*`; the
  selection bar before `contentinfo` in every ticked state and
  `_tables_selection_copied`; the dismiss button outside `summary` in
  `_lists*`; `heading` levels in `_tables_alt_*`. `node tests/app/sweep.js
  768` clean with the two allows removed; `states.js` D6 case green.
- **Gates**: as B10, plus `node tests/run-all.js app/states`.
- **Goldens**: re-record, the named subsets.

### B12 - record actions (D10, D13, D14, D15, D22)

- **Files**: `RecordActions.svelte`, `StdPanel.svelte`, `AltPanel.svelte`,
  `app/src/ports/image.ts`, `ports/clipboard.ts`, `ports/share.ts`,
  `ports/types.ts`, `app/src/lib/dict.ts`, `app/src/lib/share.ts`, tests,
  `vite.config.mts:153` (coverage exclusion narrowed or a real test added),
  `docs/specs/FEATURES.md` ("Records"), `docs/specs/DEBT.md` (five
  entries deleted).
- **Steps**:
  1. D10: `pngOf` rejects on a tainted canvas (catch `toDataURL`'s
     `SecurityError` as the probe, or a `toBlob` watchdog of 2 s); the
     `copyImage` branch falls back to `copyText` with a new dict pair
     `imgTainted` saying why; `states.js` copy-image case reads a real blob
     size or the real fallback text.
  2. D14/D15: `ImagePort.download(blob, name)` via `<a download>`; the
     unsupported/refused branch offers it with `imgSaved`/`imgFailed` toasts
     distinct from `copyFailed`; a component test drives the fallback.
  3. D22: `send()` passes `text: share(it, index, lang).text`, a `file` when
     art exists and `canShare({ files })`; `record.test.ts` asserts the
     payload.
  4. D13: `rollCopied` dict pair; both panels toast it; `std.test.ts`,
     `alt.test.ts` assert the text.
- **Acceptance**: the named tests; `node tests/run-all.js app/states`
  (copy-image case) green; `node tests/app/golden.js --only=#/i/ci1` green
  without `--update`.
- **Gates**: `npm run check`; `node tests/run-all.js app/states`; `node
  tests/app/golden.js --only=#/i/ci1`.
- **Goldens**: none (toasts are transient; the `_i_ci1_toast` state is the
  add-to-list toast).

### B13 - print (P16, R6, D20, D21, PF7 done in B3)

- **Files**: `PrintCard.svelte`, `PrintPage.svelte`, `RecordModal.svelte`,
  `Toast.svelte`, `app/src/state/app.svelte.ts`, `tests/app/print.js`,
  `printPage.test.ts`, `docs/specs/STATE.md:77`, `docs/specs/FEATURES.md`
  ("Print"), `docs/specs/DEBT.md` (D20, D21 deleted).
- **Steps**:
  1. P16 (**Q2**): open `#/print/cm26-f60-hi62-ci81` in both languages and
     both layouts (`npm run build`, then the puppeteer driver at 1100 wide
     or a browser). If `.pc-name` exceeds two lines on any card: add a name
     step to `fit()` before the text ladder - shrink `.pc-name` while its
     line count exceeds two, floor at 4.6cqw - and one `print.js`
     assertion pinning `cm26`'s line count at two. If it fits: add the
     assertion only.
  2. R6: `PrintCard` gains `onartfail` and `onerror` on both `<img>`;
     `PrintPage` passes `app.markArtBroken`. Test: a broken art path draws
     the glyph.
  3. D20: `RecordModal.svelte` gains `@media print { dialog { display: none
     !important } }`; `Toast.svelte:142` gains `!important`;
     `print.js`'s `printMedia` reads both selectors.
  4. D21: `AppState.printBW` (memory); `PrintPage` reads/writes it;
     `STATE.md:77` stays true; `printPage.test.ts` pins survival across a
     navigation away and back.
- **Acceptance**: `node tests/run-all.js app/print` green including the new
  assertions; `node tests/app/golden.js --only=print` green without
  `--update`.
- **Gates**: `npm run check`; `node tests/run-all.js app/print`; `node
  tests/app/golden.js --only=print`.
- **Goldens**: none.

### B14 - motion and focus (D1, D18)

- **Files**: `tokens.css`, `RowMain.svelte:120`, `Seg.svelte:83`,
  `ListPage.svelte:1650-1656`, `StorageNotice.svelte:129`,
  `RecordCard.svelte:337`, `tests/app/states.js` (new case),
  `docs/specs/FEATURES.md` ("Chrome"), `docs/specs/DEBT.md` (D1, D18
  deleted).
- **Steps**:
  1. D1 (**Q5**): `tokens.css` gains `@media (prefers-reduced-motion:
     reduce) { *, *::before, *::after { animation-duration: 0.01ms
     !important; animation-iteration-count: 1 !important;
     transition-duration: 0s !important; scroll-behavior: auto !important }
     }` - the B9-era block; `0s` for transitions is what keeps `PrintCard`'s
     `fit()` read-back synchronous (B7's trap was a non-zero blanket
     duration). `states.js` case: `page.emulateMediaFeatures([{ name:
     'prefers-reduced-motion', value: 'reduce' }])`, hover a button, resize
     across 600 px, assert `document.getAnimations().length === 0`; then
     `#/print/ci1-q1` still fits (`app/print` is the gate).
     `FEATURES.md:228-231` rewritten.
  2. D18: delete the five 8px `:focus-visible` overrides so the global
     `--r-sm` ring applies everywhere; `FEATURES.md`, "Chrome": one sentence
     (a gold ring on every focusable element at `--r-sm`).
- **Acceptance**: `node tests/app/sweep.js 1180` focus walk clean; the new
  `states.js` case green; `app/print` green.
- **Gates**: `npm run check`; `npm run check:built`; `node
  tests/app/sweep.js 1180` (one call, `timeout 600000`; CI is
  authoritative if the host stalls); `node tests/run-all.js
  app/states,app/print`.
- **Goldens**: none (focus and motion are not in the tree).

### B15 - language L1: node suites and tools (H1, T7, H13, H16, H15)

- **Files**: `tests/derived.js` (250 Cyrillic lines: ~110 messages, ~125
  comments, ~15 product literals), `tests/dataint.js` (86), `tests/craft.js`
  (11), `tests/stub.js` (2), `tests/run-all.js` (33 - 18 display names, 3
  logs, ~12 comments), `tools/build.js` (1), `tools/derived.js` (8
  comments), `tests/ok.js` (new, H16).
- **Rules**: translate (a) messages and (c) comments; leave (b) product
  literals byte-for-byte (`craft.js`'s regexes, `derived.js`'s pinned
  strings such as `footBefore`). A comment is an argument: translate the
  argument, not the words; if a sentence's meaning is unclear, keep the
  Russian beside the English rather than guess. `keyOf`/`fileOf` key off
  `s[0]`, so display names are safe to translate.
- **Acceptance**: `git grep -c -P '\p{Cyrillic}'` on the seven files
  returns only (b) lines, each one a product string or a regex over one;
  `node tests/run-all.js derived,dataint,craft,stub` green before and
  after (messages change only on the failure path).
- **Gates**: `npm run check`; `node tests/run-all.js derived,dataint,craft,stub`.
- **Goldens**: none.

### B16 - language L2: the small browser suites (H1, T7, T12)

- **Files**: `tests/app/golden.js` (16), `tests/app/lib.js` (1),
  `tests/app/driver.js` (3), `tests/app/contracts.js` (14, 2 are product
  regexes), `tests/app/hues.js` (17, 4 are grips), `tests/app/typo.js` (15,
  `LABELS`/`STORAGE` stay), `tests/app/sweep.js` (66, ~53 are selectors and
  page labels that drive the app - keep those; translate the 13 messages),
  `tests/app/inventory.js` (3 comments only; its 138 label/seed lines stay).
- **Acceptance**: as B15 for these files.
- **Gates**: `node tests/run-all.js app/contracts,app/typo,app/hues,stub`;
  `node tests/app/sweep.js 360`; `node tests/app/golden.js --shard=1/4`.
- **Goldens**: none.

### B17 - language L3: `print.js` and `states.js` (H1, T7)

- **Files**: `tests/app/print.js` (200 lines, ~170 messages, ~29 product
  strings, many sharing a line), `tests/app/states.js` (142, ~76 / ~65).
- **Rules**: per-site read; on a line that both asserts a Russian product
  string and reports in Russian, only the report moves. `print.js:1037`'s
  "stay Russian-only" means the UI language the suite drives, not the
  language of the test - reword to "driven in Russian only" in the same
  pass.
- **Gates**: `node tests/run-all.js app/print,app/states`.
- **Goldens**: none.

### B18 - format and lint `tests/` and `tools/` (H11 full)

- **Objective**: the two trees where every stale comment in this plan lived
  get a mechanical reader.
- **Files**: `.prettierignore` (drop `tests/` and `tools/`),
  `eslint.config.mjs` (a node-globals, non-type-aware block for
  `tests/**`, `tools/**`, `.claude/hooks/**` - `disableTypeChecked`, like
  the root config block), then `npx prettier --write tests tools` and
  whatever `eslint` finds.
- **Acceptance**: `npm run check` green; the diff is whitespace plus lint
  fixes only; `node tests/run-all.js` minus the sweeps and goldens green;
  one sweep width and one golden shard green.
- **Gates**: `npm run check`; `node tests/run-all.js
  app/print,app/contracts,app/states,app/typo,app/hues,stub,derived,dataint,craft`;
  `node tests/app/sweep.js 390`; `node tests/app/golden.js --shard=2/4`.
- **Goldens**: none.
- **Why last of the non-optional batches**: a whole-tree whitespace diff
  would collide with B15-B17.

### B19 - the record-modal host (C6)

- **Objective**: the eight `open` copies and the eight `<RecordModal>`
  blocks become one extraction.
- **Design**: `RecordHost.svelte` owns `open`, renders `<RecordModal>` and
  exposes `openRecord` through its children snippet parameter
  (`{#snippet children(openRecord)}`); it also owns the "close on
  navigation" effect `SearchPage`/`TablesPage` carry today. `ListPage`
  passes `extra` as a prop. The six `RecordCard` + `nameActions`/`actions`
  blocks are left alone unless a clean `RecordCardActions` snippet falls
  out without a new prop - do not force it.
- **Acceptance**: `git grep -c "let open = \$state<Record_" -- app/src` is 0;
  all four golden shards green without `--update` (the dialog's DOM
  position is invisible while the page is inert, but this is the batch
  whose golden impact the report could not predict, so the full run is the
  gate); `COVERED` entry.
- **Gates**: `npm run check`; the four golden shards.
- **Goldens**: none expected; verified by the full run.

### B20 - equipment apostrophes (O2) - opt-in, owner's call (Q8)

- **Files**: `data.js` (`en`/`ende` of `eq` records, U+2019 -> `'`),
  regenerated `data.json`, `catalog.csv`, `i/` (untracked),
  `docs/fixtures/share/records.json` if any captured record carries one,
  six goldens.
- **Gates**: `node tools/build.js`; `npm run check`; `node
  tests/run-all.js dataint,derived,craft,stub`; `node tests/app/golden.js
  --only=search --update`, `--only=eq_ --update`, then green.
- **Goldens**: re-record six (`_search_searched`, `_search_a_row_ticked`,
  `_tables_eq_armor`, `_tables_eq_secondary`, `_tables_eq_weapon`,
  `_tables_eq_weapon_panel_open`); the twenty goldens carrying U+2019 from
  `dict.ts`'s `Players’ link` are not this batch (P14 in B10 settles that
  string).

## Owner decisions (NEEDS_HUMAN_CONFIRMATION)

Blocking their batch only; B1-B7 need none.

- **Q1 (DC1, B3/B8)** - table view persistence. The rewrite dropped
  `dhloot.prefs.v1` deliberately (`issues/47/plan.md:1456`), but
  `STATE.md:12-16`'s own rule ("how a page looks is remembered") puts the
  view on the persisted side, and the live app persisted it. Options: (a)
  restore - ~20 lines on `AppState` + `TablesPage`, key `dhloot.prefs.v1 {
  view }` as before, a test; (b) record the drop as a `DEBT.md` "kept"
  entry and delete the rows. **Recommendation: (a)** - it is the spec's own
  rule, and a one-field key is trivial for the storage ticket to migrate.
- **Q2 (P16, B13)** - if `#/print/cm26-f60-hi62-ci81` shows a name past two
  lines, may `.pc-name` shrink (a deviation from the Figma nodes' fixed
  size), or must the design stay fixed and the overflow be accepted?
  **Recommendation: shrink**, floor 4.6cqw, two-line cap, pinned by
  `print.js`.
- **Q3 (R9, B8)** - an unknown table name in a pasted link. (a) treat it as
  unreadable and fall back home like every other unreadable address
  (`ROUTES.md`, "Fallback"; one line in `hash.ts`; no fixture pins the
  current behaviour - `routes.json` has no unknown-table row); (b) draw the
  empty state for the named unknown table. **Recommendation: (a)** - one
  rule for every unreadable address, and the copied link stops lying.
- **Q4 (R10 + D2, B8)** - a packed link that cannot expand: keep the
  address and draw the bad-link page (a third `expanding/expanded/failed`
  state in `ListPage`), or keep today's `#/l/zzzz` rewrite. **Recommendation:
  keep the address** - the reader can still copy what they were sent.
- **Q5 (D1, B14)** - the blanket reduced-motion kill (`0.01ms` animations,
  `0s` transitions, `!important`), as shipped before B9. The register asks
  for the owner's word on the policy. **Recommendation: yes** - it is the
  standard policy and the print trap is a non-zero duration, which this is
  not.
- **Q6 (D11, B10)** - frame equipment's tier: print it (f33 and q313 are
  identical armour and only one prints it) or keep suppressing with a
  reason a reader can check. **Recommendation: print it.**
- **Q7 (CLAUDE.md, B3)** - the rewrite below. Only the `:36` word and the
  `:97` pointer land without an answer.
- **Q8 (O2, B20)** - normalise the 381 equipment names' U+2019 to ASCII
  (`CLAUDE.md`'s own punctuation rule; what a keyboard types). Opt-in; O1
  makes it cosmetic. **Recommendation: yes, last.**
- **Proceeding unless vetoed** (small, decided from the repo): P5's undo on
  list deletion (B9); O3's section/list titles alongside D5 (B8); R8's
  `404.html` - **not planned**: `deploy.md` and `resilience.md` disagree,
  the app is hash-routed, and the only real deep paths are stubs whose 404
  is correct; if the owner wants the bilingual way-home page, it is ~20
  lines + a `ci.yml` line + a `META.md` row; H12's two test renames (B3);
  P10's selection bar before the footer (B11); D19's overlay skip link
  (B8); D4 kept and documented (B3); D16 deleted as a non-issue (B3); D17
  kept and documented (B3); D18's global ring (B14); D21 as session memory
  (B13); D12 keeps `aria-pressed` (B9).

## CLAUDE.md proposal (Q7)

`CLAUDE.md` was rewritten in one pass at `d6371e7` and carries migration
residue. Evidence and the proposed edit, line by line (167 lines today,
cap 200; the proposal shrinks it):

1. `:36` "or parity run will corrupt" -> "or browser suite run". Harness
   deleted at `23c00a6`. (Lands in B2 regardless.)
2. `:26` "Prefer the smallest change that preserves behaviour and
   contracts." -> "Prefer the smallest change that fixes the defect. Public
   contracts default to no change; behaviour is judged against
   `docs/specs/`, not against the previous build." Read literally the
   current line argues against R1 (destroys lists), O1 (search misses
   records) and S4 (overwrites a note).
3. Specs table: delete the `docs/parity.md | operational parity workflow`
   row - the file was deleted at R0c (`.claude/README.md:226-228`).
4. "Costs and the test: `docs/parity.md`, 'Batch size and the fixed cost
   of a run'" -> `.claude/README.md`, same heading.
5. "Focused: `npm run test`, `node tests/run-all.js`, `node
   tests/run-all.js eqtest,qa`" -> "`node tests/run-all.js
   derived,dataint,craft,stub`" (fact 3).
6. "The built app in a real browser ...: `node tests/run-all.js
   app/sweep,app/typo,app/hues,app/contracts,app/states`" -> drop
   `app/sweep` from the one-call list and add "sweeps run one width per
   call: `node tests/app/sweep.js <width>`" (`.claude/README.md:238`).
7. `:97` "every file `tests/derived.js`'s `COUNTERS` list names" -> "the
   nine files `tests/derived.js:448-450` names" (DC12).
8. Section "Migration and parity" -> "Structural goldens and the register",
   keeping: the 110 goldens compare rendered output and any change that
   moves them says so; a new state gets an `inventory.js` entry and a
   seeded golden in the same change; a defect kept on purpose goes in
   `docs/specs/DEBT.md` and is deleted in the commit that pays it; the
   whitespace-text-node rule in C3's wording. Deleting: "This is a
   refactor, not a redesign"; "Compare computed/rendered results ... take
   visual values from the live styles"; "Every state is exercised in both
   languages at three widths. Pixel difference is zero unless recorded as
   explicit `VISUAL_DEBT`"; "Record intentional accessibility differences
   in `ACCEPTED`"; "Inspect diff images before changing debt. Use
   `docs/parity.md`"; "Port the live app's text-node structure" (replaced by
   the whitespace rule); "A `VISUAL_DEBT` number is whatever CI measures";
   "Port a rule with every `@media` override it has". None of `VISUAL_DEBT`,
   `ACCEPTED`, diff images or `docs/parity.md` exists.
9. "Engineering posture" gains nothing; "Product laws" unchanged.

## Dropped, with the legitimate reason

Audit list. "Not a problem" means verified against the tree or accepted
from the report's own measurement.

| Finding | Reason | Note |
|---|---|---|
| PF1 (browser probe for search) | superseded | The only fix its number could justify beyond PF2 is virtualisation, excluded on golden grounds; PF2 is justified by O1's design (fold once at index time) independently. |
| PF5, PF6 | not a problem | The report's own verdict, with measurements. |
| PF4 as a phase-8 batch | deferred to its own task (see "Deferred") | Contract change; not dropped. |
| T13, T14, T15, T17 | not a problem | Measured in the report; T14/T15's 2.3 s and T17's 17 s are off the critical path. |
| C3 option 1 (`htmlWhitespaceSensitivity: strict`) | cure worse than disease | Reflows ~45 files permanently for a hazard with four sites; option 2 taken. |
| P6 via `Field` emitting `<label>` | cure worse than disease | `Field` wraps chip rows and segmented switches; a `<label>` around buttons is wrong. `aria-label` on the three inputs taken. |
| D16 | not a problem | Fact 6: the idle region is `display: none` on both apps and never in the tree. Entry deleted in B3. |
| `components.md` "not worth it" (class `panel` on `ffilter`/`tablenav`, `Panel`'s inline copies, `PageHead`/`PageTitle` `.page-h`, `DiceBar` reimplementing `.btn.primary`, `Shell` writing `document.title`, `app.env.*` reads, `PageTitle` branching, `ListPage` size) | not a problem / cure worse | Each has its reason at the site; `ListPage` split is deferred, not dropped. |
| A10, A12 | not a problem | Map facts; the report proposes nothing. |
| A11 `pick`/`Panel` naming, `isLastOn`'s home | cure worse than disease | Renames across route-level components for a word collision; move `isLastOn` on its fourth caller. `DIE_ART` and `clamp` are taken (B6). |
| `open.md` "not worth it": `listLink.ts` `btoa`/`atob`, `.nvmrc` vs `engines` | not a problem | Both `globalThis`, Node-safe; CI pins from `.nvmrc`. |
| `resilience.md` "not worth it": truncated-note checksum | cure worse than disease | A payload-grammar (contract) change for a failure the reader can see. |
| `window.confirm` in a sandboxed iframe; unguarded `showModal()` | not a problem | Below the app's floor; nobody embeds it. |
| `state.md` `$state.raw` | cure worse than disease | The report's own verdict. |
| `load()` ignoring the v1-migration write's result | not a problem | The undismissable notice already shows. |
| `deploy.md` "not worth it": the 60 s retry, `cp -r` comment, `workflow_dispatch`, burst-cancel, `[skip ci]` | not a problem | Measured or inherent to the right setting. SHA-pinning `actions/*` dropped as cure worse (maintenance); `gitleaks` pinned (B5). |
| `hygiene.md` "not worth it": 102 `app.js:NNNN` citations, `tools/` orphans, `test-output/` logs, `issues/` pruning, `numField.ts` comment density | not a problem | `CLAUDE.md:16-18` resolves the citations once; `app.js` is frozen. |
| `product.md` "not worth it": two rarity vocabularies | unverified | Needs the Core book; not a defect until checked. Owner may confirm and add one `FEATURES.md` sentence. |
| `product.md`: a shared list with an empty name | not a problem | Correct fallback. |
| `product.md`: search help panel | owner's content | Adds product text the owner writes; listed under the UI/UX ticket. |
| `product.md`: roll live region summary, money-picker discoverability, undo toast focus | deferred to the UI/UX ticket | Design changes; see "Deferred". |
| TL3 family 2 (out-of-range line numbers) | cure worse than disease | Rewards a dead citation; recorded in the README. |
| DC14 (`issues/56`, `issues/59` cite `docs/parity.md`) | outside this task's write scope | Other tasks' state; the orchestrator should tell those tasks. |
| R8 `404.html` | duplicate judgement, not planned | Two reports disagree; the stubs' 404 is correct and the app is hash-routed. Owner may opt in (~20 lines). |
| T7's four-batch and H1's five-batch splits | superseded | Replaced by three gate-sized batches (B15-B17). |
| `tests.md`'s `--exclude=app/golden` note (T8) | superseded | Dissolves under T1. |
| DC9 (`Button.svelte` deletion wording) | taken as one word in B3 | Not dropped. |

## Deferred to the two excluded tickets, and to tasks of their own

**Consistent storage layer** (owner's ticket) inherits: R1's general form
(versioned envelope, schema validation on read, migration chain) - B9 patches
the destructive symptom only; S4's deeper half (whole-list last-writer-wins;
per-entry or per-field reconciliation); `dhloot.lang.v1`/`home.v1`/`warn.v1`
not watched across tabs (`state.md`, out of scope); the `.bad`-key recovery
beyond a notice; DC1's key if Q1 is "record"; PF3's `save()` debounce
(measure first: seed ten lists of sixty entries, bracket twenty keystrokes
with `performance.now()` - the probe `performance.md` describes); a list
export/backup file (`resilience.md` - no upload service, a local `.json`
download; adjacent to storage, product decision).

**UI/UX redesign** (owner's ticket) inherits: the focus-management pass
(`product.md`: toast actions unreachable by keyboard, a labelled selection
region, menu focus) - P4 and P10 are its cheap edges and are done here; the
roll results live region reading four whole cards; the money picker hidden
until a price exists and the "Золото" header over "3 мешка" values; a help
panel for Search (owner-written content); an inlined first-paint skeleton
(PF5); a `<svelte:boundary>` reporting framework beyond B8's minimal
boundary.

**Tasks of their own** (costed, not dropped): PF4 image derivatives (a
192 px variant under a new asset path; `CONTRACTS.md`, `docs/fixtures/`,
`tests/contracts.js`, `llms.txt` in one commit; ~2 MB of files; the largest
byte saving available); splitting `ListPage.svelte` (1692 lines; a golden
plan per seam; after B19, which removes its modal ceremony); A2's remaining
half (making `env` private / every port through `AppState`); decomposing
`AppState` (A-out-of-scope); `Record_.tier` -> `voaTier` (wire-name adapter,
contract); branded id types; one home for the shared-link wire constants
(contract docs + fixtures); the release-shape change of publishing the
artifact `check` proved (`deploy.md`, out of scope); a replacement heavy-run
lock (`.claude/README.md:282-295`) - B4's CI reshaping does not change the
local collision class; the Playwright decision (issue 47 handoff, "Phase 8
opening inputs") - nothing in this plan depends on the driver.

## Sequence and cost summary

| # | Batch | Gate cost (local, idle) | Goldens |
|---|---|---|---|
| B1 | search normalisation | check + 2 `--only` | none |
| B2 | hooks and ignores | check | none |
| B3 | truth fixes | check + 2 fs suites | none |
| B4 | CI shape | check + 1 shard local + CI | none |
| B5 | deploy correctness | check + CI + PR probe | none |
| B6 | lib and generator | check + 3 fs suites + `--only` | none |
| B7 | components | check + built + typo/hues + sweep 768 + 4 shards | none (proved) |
| B8 | shell/router/state | check + built + `--only` + states | none |
| B9 | lists and two tabs | check + 2 `--only` + states | +1 state |
| B10 | a11y names | check + built + 4 shards x2 + sweep 768 | re-record |
| B11 | structure and targets | as B10 + states | re-record |
| B12 | record actions | check + states + `--only` | none |
| B13 | print | check + app/print + `--only` | none |
| B14 | motion and focus | check + built + sweep 1180 + states/print | none |
| B15-17 | language | per-suite runs | none |
| B18 | format tests/tools | check + pooled subset + 1 sweep + 1 shard | none |
| B19 | modal host | check + 4 shards | none (proved) |
| B20 | apostrophes (opt-in) | build + check + `--only` x2 | re-record 6 |

Honest volume: roughly a hundred findings become twenty batches, of which
B1-B9 are the first phase (user-facing defects, the gates, the tooling, the
duplication) and B10-B19 the second (the re-records, the register's a11y
entries, the language sweep). Nothing waits silently; everything not in a
batch is in "Dropped" or "Deferred" with its reason or its cost.
