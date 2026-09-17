# Plan - TASK phase-8

Status: revised 2026-09-17 (planner, second pass) after the owner's two
revisions: B1 shipped at `e7c7b50`; B2 shipped at `44b1761` (implementer,
2026-09-17, handoff.md "Completed"); B2-B20 merged to B2-B11 by gate; a
forcing function for batch size folded into B2. All eight owner questions
are settled (`context.md`, "Settled owner decisions"); every settled step
below is written as decided, not as an option.

## Objective

Turn the twelve critique reports (`issues/phase-8/critique/`) and the register
(`docs/specs/DEBT.md` D1-D23) into an ordered, implement-ready sequence. Every
finding is placed in a batch, deferred to one of the two excluded tickets, or
dropped with a named legitimate reason. "Where every finding landed" maps the
first plan's B2-B20 onto the merged shape so nothing fell out.

## How to read this plan

- Findings are cited by report id (`P1`, `C6`, `T4`, `H1`, `PF3`, `DC1`,
  `TL1`, `O1`, `R1`, `S1`, `DP1`, `A1`, `D1`).
- Every batch that stands alone names the criterion that keeps it apart
  from its neighbours, in `CLAUDE.md`'s terms (a public-contract change, a
  different route and filter set, a commit the harness cannot reach) or
  reviewability in one pass. A batch with no criterion would be a merge.
- "Goldens": `none` means the trees under `tests/app/snapshots/` do not move
  and the batch proves it with a targeted run; `re-record` names the states
  and the reason. `node tests/app/golden.js --only=<substring of a state
  id>` (`golden.js:32-33`, matched against `STATES[].id` such as `#/search ~
  capped`) runs a subset - the cheap "does not move" proof; the four
  `--shard=n/4` calls only where a batch re-records or claims identical DOM
  everywhere.
- Gates per `.claude/README.md`, "Batch size and the fixed cost of a run".
  `npm run check` is one foreground call with `timeout 600000`:
  `set -o pipefail; npm run check 2>&1 | tail -n 120`. A batch may hold more
  than one commit; each commit is green on its own, so a two-commit batch
  pays `check` twice and its `tests/app/` filters once.
- Write control characters as prose (NUL, U+0001), never as escape
  sequences and never literally: a tool's JSON decoding turns an escape into
  the byte, and a NUL makes the repository grep treat the file as binary and
  suppress every match. This line was bitten twice while being written.
- Parity-era reasoning is not a defence anywhere below.

## Verified facts that change what the reports proposed

Checked read-only at `f53f44d`/`e7c7b50` on 2026-09-17.

1. **D7's cause is opacity, not the tokens.** `git grep -e '--muted'
   23c00a6^ -- style.css`: the live app already used `--muted: #9b93b3` and
   `--muted2: #8a83a3` - the values `tokens.css:23,27` has today. D7's
   `#77708c` at 3.77:1 is `#9b93b3` composited at `opacity: 0.72`
   (`Chip.svelte:94`) and `0.75` (`ListPage.svelte:1111`). Two deleted
   declarations (B5), not a palette change.
2. **`#/search` has seven goldens** (`_search*.txt`); `product.md` P7 says
   none. P7's count line moves `_search_capped` (B7).
3. **The `CLAUDE.md` the harness injected into the first planning pass was
   stale.** The file on disk (unchanged since `d6371e7`) has no "Migration
   and parity" section, no `docs/parity.md` row, `node tests/run-all.js
   contracts,dataint` at `:110`, and the browser command without
   `app/sweep`. The first plan's "fact 3" (that `CLAUDE.md` named `eqtest,qa`)
   was wrong and `docs.md`'s verification was right. Of Q7's nine edits, five
   (#3, #4, #5, #6, #8) are already in the tree; three remain (`:24`, `:36`,
   `:97`). The file is 167/200 lines and will not shrink.
4. **The live `dhloot.prefs.v1` held `{ view }` only** (`app.js:1088` at
   `23c00a6^`). The READMEs' "and the height of note fields" was never true
   on either app (`COVERAGE.md:60` says so). Q1 restores the key; the
   note-height clause goes regardless.
5. **P13's word.** `help.ts:399,404` say "фреймы", `README.ru.md` uses
   "фрейм" four times and "сеттинг" once, `dict.ts` has `Фрейм` once and
   `Сеттинг`/`Сеттинги` twice. The `daggerheart-ru-terms` rule is "look it
   up": B7 fetches `https://ru.daggerheart.su/frame`, quotes the section
   title in the commit, and uses that word in all three keys.
6. **D16 has no benefit on either app.** The idle toast is `display: none`
   on both (`[popover]:not(:popover-open)` here; `hidden` on live), and a
   `display: none` element is not in the accessibility tree. Entry deleted
   with that reason (B2); no code.
7. **D8's `<h4 class="altcol">` is `TablesPage.svelte:538`**, not
   `TableRows.svelte`.
8. **P4(b) and D6 are one change.** `AddToList.svelte:174` measures the
   first `.btn` inside `.seldrop`; moving `.dropmenu` after the toggle makes
   that query return the toggle - D6's fix. `states.js:68-70,125` already
   has the 1100x900 case on Кольцо Тишины.
9. **P4(a) and the modal.** Escape inside the record modal reaches the
   `<dialog>`'s close; the menu's `onkeydown` must `stopPropagation()`.
10. **`git add -A` fingerprint (TL1/TL2)**: `work/` holds three PNGs,
    un-ignored, inside every commit-gate key today. B2 fixes the hooks and
    edits the ~40 markdown files in the same batch: every edit precedes the
    one gate, so the livelock the first plan ordered around cannot occur.
11. **O3 is D5 generalised** - one `$effect` in `Shell.svelte` (B6).
12. **B1's implementer improved the design**: `hayFor` caches an array of
    folded fields checked with `.some()`, so the cached and fallback paths
    agree by construction; `data.ts` is untouched. Recorded in the handoff.
13. **Cross-report identities the batches rely on**: T4 = DP4; PF3 = R4; S4
    + R2 one trigger gap; C1 = A2's symptom; C6 is an extraction, not a
    relocation; TL7 = DP8; T10 = DP9; DC10 = H3; DC11 = H4 = TL4's stale
    prose; H6, H7 inside C5; T9 inside C4; T8 dissolves under T1; TL8(c) is
    `CLAUDE.md:36`.

## Architecture and constraints that hold for every batch

- `app/src/lib/` stays pure; browser APIs behind `app/src/ports/`; shared UI
  in `app/src/components/`; a new component needs a `COVERED` entry in
  `app/src/components/a11y.test.ts:351` and a test that renders it under axe.
- Public contracts default to no change. No batch changes the hash grammar,
  ids, link encoding or asset paths. R5 widens what `#/l/` accepts (a payload
  that was never valid now reaches the bad-link page); R9 sends an unknown
  table name to the fallback; `404.html` adds a published file. Each updates
  `ROUTES.md`/`META.md` prose and adds a fixture row; none changes an
  encoding. B11 (data apostrophes) moves generated data and is the owner's
  opt-in, settled yes.
- Product laws are untouched.
- A behaviour change updates its spec in the same commit; a register entry
  is deleted in the commit that pays it; a new state gets its `inventory.js`
  entry and seeded golden in the same change.
- Commit as `artex-x <artex-x@users.noreply.github.com>`, Conventional
  Commits, no AI attribution trailer. Push after each batch's gates pass.

## B1 - search normalisation (O1, PF2) - SHIPPED `e7c7b50`

`foldQuery()` (case, `ё`->`е`, U+2019/U+02BC->`'`) on both sides;
`hayFor(statLine)` memoises an array of folded fields per record in
`search.ts` (the plan's joined-string design was rejected by the
implementer for a field-boundary false match - correct); `SearchPage` and
`TablesPage` fold once per language. Both `--only` golden runs green without
`--update`; `плетеная сеть` 0->1, `keeper's` 3->4. Record: `handoff.md`,
"Completed".

## Batches, in order

### B2 - hooks, ignore rules, truth fixes, `CLAUDE.md`, and the batch-size forcing function

- **Merged from**: first-plan B2 (TL1-TL8, H14, DP8/TL7) + B3 (the
  docs/comments/dead-code/test-prose list) + Q7 + the owner's revision 2.
- **Stands alone because**: reviewability - a ~45-file diff of hooks,
  config, prose and test comments is one kind of review (read for truth),
  which must not share a pass with B5's component refactor whose proof is a
  four-shard golden run. Its only gate is `npm run check`.
- **Objective**: stop the commit-gate livelocks and close the two
  `bash-guard` holes; no live file states a fact R0c reversed; specs match
  the code; `CLAUDE.md` says what the tree does; the batch-size rule gains
  its test.
- **Files**: `.gitignore`, `.claude/.gitignore`, `.prettierignore`,
  `.claude/hooks/{tree-key,lib,bash-guard,selftest,edit-followup}.mjs`,
  `.claude/README.md`, `.claude/prompts/plan.prompt.md`, `CLAUDE.md`,
  `tests/run-all.js`, `tests/derived.js:1-4,26`, `tests/stub.js:6`,
  `tests/app/inventory.js`, `tests/app/sweep.js:92`,
  `docs/specs/{STATE,COVERAGE,ROUTES,FEATURES,I18N,META,DEBT,CONTRACTS}.md`,
  `llms.txt`, `README.md`, `README.ru.md`, `vite.config.mts:83-85`,
  `eslint.config.mjs`, `tools/build.js`, `tools/derived.js:31`,
  `tools/tg-preview/{lib,client,manifest}.mjs`, `app/src/lib/i18n.ts:11`,
  `app/src/lib/types.ts:123`, `app/src/ports/image.ts` + `ports/index.ts`,
  `app/src/lib/{desc,roll,money,listLink}.ts`, `app/src/ports/clipboard.ts`,
  `app/src/components/{tables,listsPage,record,printPage,listPage}.test.ts`,
  `app/src/state/app.test.ts:225`, `app/src/components/{TableRows,ListsPage,PrintCard,FilterBar,ListPage}.svelte`
  (comments only), `app/src/components/{Chip,OrGrid}.test.ts` renames.
- **Steps - hooks and ignores** (TL1-TL8, H14, DP8/TL7):
  1. TL1/H14: `.gitignore` gains `.claude/worktrees/` and `work/` with the
     fingerprint reason; `.claude/.gitignore` gains `settings.local.json`;
     the `.prettierignore` comment points at `.gitignore` as the superset.
  2. TL2: export `isExempt` from `lib.mjs`; `treeKey()` drops exempt rows
     from `git ls-files -s` before hashing; the `isExempt` comment names the
     trap (`tests/contracts.js:79-81` reads `CONTRACTS.md`/`ROUTES.md` but
     is not in `npm run check`). Selftest: arm the cache, append to
     `issues/65/handoff.md`, stage `app/src/lib/x.ts`, expect no deny.
  3. TL3: `citingLines()` skips an occurrence preceded by
     `/(?:[0-9a-f]{7,40}|HEAD[~^\d]*)\s*:\s*$/i`; `MSG.orphanPlan` gains
     the way-out sentence; two selftest cases. Family 2 stays unimplemented,
     recorded in the README limitations.
  4. TL5: `restore` denies on `--worktree` or a `-W` cluster; one selftest.
  5. TL6: `rm -r` without `-f` denied inside the repo; exempt list gains
     `i`; selftest (`rm -r app` denies; `rm -r dist`, `rm -r i` silent);
     README limitations gains the shape.
  6. TL4: `LONG_CHECKS` rows for unsharded `golden.js` and `sweep.js`;
     `run-all` cost `~260-290s` filtered, "an unfiltered run cannot finish in
     one call"; `check` `~165s`.
  7. TL4/H4/DC11: `run-all.js:65-68` re-pointed at `app/golden`;
     `--help`/`-h` prints usage, exits 0.
  8. TL7/DP8: the `i/`-missing preflight after `queue` is built; guard
     `tests/derived.js:26` with the `existsSync` shape of `:19-23`.
  9. TL8: README Hooks row for `edit-guard.mjs` names
     `tests/app/snapshots/**`.
- **Steps - `CLAUDE.md` (Q7, settled) and the forcing function (revision 2)**:
  10. `:36` "parity run" -> "browser suite run".
  11. `:24` -> "Prefer the smallest change that fixes the defect. Public
      contracts default to no change; behaviour is judged against
      `docs/specs/`, not against the previous build."
  12. `:97` -> "the nine files `tests/derived.js:448-450` names" (DC12).
      **Corrected in the B2 review remediation (B-2):** that range moved
      once already (B3) and is replaced everywhere by naming
      `tests/derived.js`'s `COUNT_BEARING_FILES` array instead.
  13. After the `:52-58` paragraph, one line: "A plan names the criterion
      behind every split and states its total gate cost; a split with no
      criterion is a merge." File stays at 168/200.
  14. `.claude/prompts/plan.prompt.md:65-69`, one bullet: "Required outputs
      of a planning pass: for every split, the criterion it invokes
      (`CLAUDE.md`, 'Task and session protocol', or a review that cannot be
      held in one pass), and the plan's total gate cost summed from
      `.claude/README.md`, 'Batch size and the fixed cost of a run'."
  15. `.claude/README.md:247-250`, after the "Too small" paragraph, one
      sentence: "Phase 8's first plan (2026-09-17) split about a hundred
      findings into twenty batches - eighteen `npm run check` runs, roughly
      2.5 hours of gate time before any test of the work - and was merged
      to eleven on the owner's instruction (`issues/phase-8/plan.md`, 'Where
      every finding landed')."
- **Steps - truth fixes** (each one line unless said):
  16. `STATE.md`: Q1 restores the key, so the `dhloot.prefs.v1` row stays
      and `:15-16` stays; `README.md:217`/`README.ru.md:223` drop "and the
      height of note fields" (fact 4). R2's "Two tabs" clause lands with B6.
  17. `COVERAGE.md`: DC2 (four thin-spot bullets re-pointed; the `craftmob`
      duplicate deleted); T11 (`tools/**` outside every coverage gate,
      `capture-share-fixture.mjs` the unmitigated one); T16 (axe RU-only at
      360/390/768); DC13 (`NoData.svelte` has no inventory state - needs
      `data.js` blocked; vitest owns it); H15 (name the fourteen deleted
      suites at `:139` - `git show 23c00a6 --stat`); `:55` gains "in CI,
      `git diff --exit-code` after `npm run check` is what makes the
      comparison bite" (B4 makes it true; write the rule); DC7 wording at
      `:377`; C3's rule under a short heading "Whitespace text nodes are
      content" (Prettier's default `htmlWhitespaceSensitivity: css` reflows
      whitespace around block tags; where `textContent` or an accessible
      name reads it, `prettier-ignore` the whole subtree and pin it with a
      `childNodes` test).
  18. `ROUTES.md`: DC3 (`TABLE_DEFS` -> `TABLE_IDS`, `TAB_LIST` ->
      `SECTIONS`); DC4 (the `frames` alias sentence after `:49`,
      `TABLE_ALIASES` in `:7-8`). `FEATURES.md:55`: DC3.
  19. `I18N.md:9-11`: DC5; O4 (three sentences: the stubs are Russian-only
      by design, and why).
  20. `META.md:83-85`: DC6 - the rule ("Interface text is Russian and
      English; everything else - tests, tools, comments, developer docs - is
      English (`CLAUDE.md`); `tests/` is being brought into line in phase
      8").
  21. `DEBT.md`: D16 deleted (fact 6); D4 kept - entry deleted, `FEATURES.md`
      "Rolling" gains the sharing bullet; D17 kept - entry deleted,
      `FEATURES.md` "Records" gains the hover-zoom sentence; DC8 (`:413` ->
      "`app/golden` row"); D8's file name corrected to
      `TablesPage.svelte:538`.
  22. `CONTRACTS.md` section 4: `data.js` stores empty descriptions as
      `""`, `data.json` omits the key. `llms.txt:19-20`: the `noscript`
      block carries the data links. `tests/contracts.js` greps group names
      only; both stay green.
  23. `README.md:285-289`, `README.ru.md:293`, `.claude/hooks/edit-followup.mjs:20`,
      `tools/build.js:10-11`, `tests/derived.js:1-4`: the false "derived.js
      catches a forgotten rebuild" -> "CI's stale-artefact step fails on a
      stale committed copy" (the header stays Russian until B9; correct the
      claim in place).
  24. `vite.config.mts:83-85`, `.gitignore:29`: H3/DC10. `i18n.ts:11`: H5
      comment. `tg-preview/{lib,client,manifest}.mjs`: H2 header lines; H9
      collapse. `inventory.js`: H8 seven `per width` -> `per language`.
      `stub.js:6`: H15 verb. `sweep.js:92`: T12. `types.ts:123`: A8.
      `PrintCard.svelte:62-80`: PF7 clause. `.prettierignore`'s
      `app/index.html` line marked permanent with its reason.
  25. `eslint.config.mjs`: H11 comment; C9 (`ignoreVoidReturningFunctions`
      inside the `**/*.svelte` block, delete the three disables; a survivor
      is recorded, not forced). H12: `git mv` `Chip.test.ts` ->
      `chip.test.ts`, `OrGrid.test.ts` -> `orGrid.test.ts` (case-only rename
      via a temporary name). H13: the four non-ASCII punctuation marks in
      English comments/output.
  26. H10: delete `brokenImage` (+ its re-export); drop `export` on
      `NO_ART`, `REAL_DICE`, `moneyWord`, `fromBase64Url`, `FakeClipboard`.
  27. C4/T9: correct the two comments (`tables.test.ts:762-766`,
      `listsPage.test.ts:133-140`); the pill assertion switches to the
      `childNodes` idiom of `record.test.ts:271-279`; `record.test.ts:395,406,412`
      and `printPage.test.ts:341` gain the "positional on purpose" comment.
      The four `prettier-ignore` comments cut to one line plus a pointer to
      the COVERAGE.md heading.
- **Acceptance**: `node .claude/hooks/selftest.mjs` passes with the five new
  cases; `git status --porcelain -uall` no longer lists `work/`; `node
  tests/run-all.js --help` exits 0 in under a second; `node tests/run-all.js
  stub` with `i/` renamed away exits 1 with the message (restore after);
  `git grep -n -e TABLE_DEFS -e TAB_LIST -- docs` is empty; `git grep -n 'per
  width' -- tests/app/inventory.js` is empty; `git grep -n 'derived.js will
  fail' -- .claude` is empty; `git grep -n brokenImage -- app` is empty;
  `wc -l CLAUDE.md` is 168 or less; `npm run lint` clean with the disables
  gone (or the survivor recorded); `node tests/run-all.js contracts,derived`
  green.
- **Gates**: `npm run check`; `node tests/run-all.js contracts,derived`.
- **Goldens**: none (prose, config, comments; the two test rewrites assert
  the same DOM).
- **Risks**: hooks may be snapshotted per session (`.claude/README.md:126`);
  restart before trusting a deny. Gitignoring `work/` hides it from the Stop
  hook's untracked sentence - accepted.

### B3 - CI shape (T1, T2, T5, T3, T8)

- **Merged from**: first-plan B4, unchanged.
- **Stands alone because**: a commit the harness cannot reach - the batch's
  proof is a live CI run of the new matrix, and B4's gates (`timeout-minutes`
  on `browser`, `deploy.needs: browser`, the stale-artefact step's position)
  target job names this batch creates; they must be green on CI before B4
  measures against them, and B4's PR probe must not share a run with a
  matrix rewrite.
- **Objective**: browser work spread over the runners that sit idle; wall
  clock ~738 s -> ~390 s at about +10% billed minutes.
- **Files**: `tests/run-all.js`, `tests/app/sweep.js`,
  `.github/workflows/ci.yml`, `tests/derived.js:529-541`,
  `tests/app/contracts.js`, `.claude/README.md` (one sentence: a local gate's
  fixed cost is minutes, a CI job's ~20 s).
- **Steps**:
  1. T5: replace the weight column with the CI seconds from `tests.md` 0.3;
     the comment names host and date and that a local run is advisory.
  2. T2: `sweep.js` takes an optional language after the widths; `run-all.js`
     splits the 1180 row into `['1180','ru']` and `['1180','en']`; the focus
     walk stays on the RU row; `keyOf` keys on `s[3]` so artifact names stay
     unique.
  3. T1: `run-all.js --shard=n/m` partitions `queue` longest-first over the
     weights (disjoint and exhaustive, the `golden.js:35-48` contract); drop
     `--exclude=app/golden`; `ci.yml`: `check` keeps `npm run check`, build,
     smoke, budget; one `browser:` matrix of four runs `npm run build` then
     `node tests/run-all.js --shard=N/4` and uploads `test-output/` on
     failure (T8 dissolves); the `golden:` job is deleted; `deploy.needs`
     becomes `[check, audit, secrets, browser]`; `tests/derived.js:540`
     asserts `browser`.
  4. T3: hoist `fresh()` out of the address-grammar loop and `rowsAt` in
     `tests/app/contracts.js`, clearing storage between opens.
- **Acceptance**: the four shards together equal `SUITES` and are disjoint
  (`--shard=n/4 --jobs 1` listings); CI on the pushed commit shows `browser
  (1..4)` each under ~350 s and `check` ~110 s; `deploy` runs; the total
  wall clock is recorded in the handoff against 738 s.
- **Gates**: `npm run check`; one local `node tests/run-all.js --shard=4/4`
  (the lightest, ~160 s); push; `gh run watch`.
- **Goldens**: none.

### B4 - deploy and gate correctness, and `404.html` (DP1-DP7, T4/DP4, T6, T10/DP9, R8)

- **Merged from**: first-plan B5, plus the owner-approved `404.html` (R8).
- **Stands alone because**: a commit the harness cannot reach - it ends in
  a live CI watch, a deliberately-stale-artefact PR probe (an extra CI run
  that must be red for the right reason), and a `gh run rerun` timing; none
  of that runs locally, and none of it should share a run with B3's matrix
  rewrite or B5's component diff.
- **Files**: `.github/workflows/ci.yml`, `tools/check-site.mjs` ->
  `tools/check-site.lib.mjs` + `tools/check-site.test.mjs`, `package.json`
  (`check` gains the two `node --test` files), `tests/app/golden.js`
  (exports under `require.main`) + `tests/app/golden.test.mjs`, `404.html`
  (new, tracked at the repo root), `docs/specs/META.md`.
- **Steps**:
  1. DP1: `timeout-minutes: 30` on `check` and `browser`, `10` on `deploy`,
     `audit`, `secrets`; `check-site`'s `get()` passes `signal:
     AbortSignal.timeout(15_000)`.
  2. DP3: `contents: read` in the deploy job's `permissions`.
  3. DP4/T4: a `check`-job step after `npm run check`: `git diff --exit-code
     -- data.json catalog.csv` with its reason.
  4. DP2: the stub count in the guard (`wc -l catalog.csv` minus header
     equals `ls _site/i | wc -l`).
  5. DP6: `concurrency.group` `pages` on push-to-main, `ci-${{ github.ref }}`
     otherwise; `cancel-in-progress` true for non-push. Test on a PR first.
  6. DP7: keep `.nojekyll`; correct the comment (never reaches the artifact;
     matters only under a branch build).
  7. DP5: four comment lines in the recovery block (the re-run path with its
     measured cost; "re-running an older run's deploy job publishes that
     commit - a rollback, never a retry"). Measure with `gh run rerun <latest
     green run id> --job <deploy job id>` (same tree, safe) and record it.
  8. gitleaks pinned to a full SHA with the tag in a comment; `actions/*`
     stay on major tags (documented as the line).
  9. T10/DP9: `check-site.lib.mjs` exports `checks(read)` - an array of
     `{ path, test(body, meta), message }` over an injected reader;
     `check-site.mjs` keeps the retry loop with `fetch`; `--dir _site` uses a
     filesystem reader and replaces the duplicated `grep` lines in the guard
     (`ci.yml:231-265`); the `cmp` and "nothing private" loops stay in bash;
     `check-site.test.mjs` drives an in-memory good site and three broken
     ones (404 root, tiny bundle, stub without `og:image`). Messages become
     English here (this file leaves B9's scope).
  10. T6: `golden.js` exports its pure half (`collapse`, `normUrl`, `clean`,
      the `bySig` retention, `namelen`/`namehash`, `sectionsOf`,
      `headerOf`, `compareGolden`) with `require('./lib.js')` moved under
      the main guard; `golden.test.mjs` covers rule A at 5 and 6 siblings,
      rule B at 63/64/65 code points, joined-versus-split text nodes,
      `normUrl` on `file://` and `https://`, a `sectionsOf`/`headerOf` round
      trip.
  11. `404.html` (owner decision, `context.md`): authored and tracked at the
      repo root (no data in it); both languages on one page (`I18N.md`);
      `<meta name="robots" content="noindex, nofollow">` (`META.md`);
      relative asset paths only; a link to `./#/roll/std` in each language
      and one to `./#/search`; added to the `cp` list at `ci.yml:199` and to
      the guard's `[ -s ]` loop; `META.md`'s inventory of published files
      gains the row; `check-site.lib` gains a probe that `GET /nope.html`
      returns 404 whose body contains the page's own marker (Pages serves
      `/404.html` for any missing path).
- **Acceptance**: a deliberately stale `catalog.csv` pushed to a branch turns
  `check` red at the new step and green after `node tools/build.js`; `node
  --test tools/check-site.test.mjs` fails on each broken fake; the deploy
  log shows the stub-count line; the re-run time is in the handoff; **the
  published site answers `https://artex-x.github.io/daggerheart-loot/nope.html`
  with 404 and the bilingual way-home page, `noindex` present, and
  `check-site.mjs` proves it on the deploy** (its own acceptance line, as
  the owner asked).
- **Gates**: `npm run check`; push; `gh run watch`; the PR probe; the
  re-run measurement.
- **Goldens**: none.

### B5 - single sources: lib, generator and components (A1, A3, A4, A5, A7, A9, A11, O5, O6, H5, C1/A2, C5, H6, H7, C2, C7, C8, D7)

- **Merged from**: first-plan B6 + B7.
- **Stands alone because**: reviewability of its proof - it is the batch
  whose claim is "identical DOM everywhere" (C2's whitespace-critical badge
  run, C7's `.grow` snag), and that claim is proved only by all four golden
  shards; B2 needs no shard and B6 needs `--only` subsets, so merging in
  either direction would pay the four shards for work that does not need
  them or hide a moved tree behind a batch that expects none.
- **Files**: `app/src/lib/{label,tables,listLink,money,roll,alt,std,frames,types,numField,print}.ts`
  and tests, `tools/build-share-pages.js`, `app/src/lib/i18n.test.ts`,
  `app/src/state/app.svelte.ts`, `PageHead.svelte`, `RecordActions.svelte`,
  the ten page components, `Badge.svelte` (new), `NumRow.svelte` (new),
  `RecordCard.svelte`, `RowMain.svelte`, `ListsPage.svelte`,
  `AltPanel.svelte`, `RollPanel.svelte`, `StdPanel.svelte`,
  `ListPage.svelte`, `Chip.svelte`, `tokens.css`, `App.svelte`,
  `a11y.test.ts` (`COVERED`), `tests/app/sweep.js:363`, `docs/specs/DEBT.md`
  (D7 deleted).
- **Steps - lib and generator**:
  1. A1: delete `GROUPS`/`SUBS` from `label.ts`; `whereFrom` resolves
     `groupOf(table).label` and `subLabelOf(table)` through `dict(lang)`;
     `label.test.ts` pins the strings unchanged.
  2. A3: `listLink.ts` imports `MoneyMode`, `MONEY_MODES`, `MONEY_DEFAULT`
     from `money.js`. A4: `roll.ts` imports `Rarity` from `money.js`,
     `RARITY_ORDER: readonly Rarity[]`; `alt.ts` `RARITIES = RARITY_ORDER`.
     A5: `label.ts:133` -> `EQ_TABLE_OF`. A7: `std.ts:15` typed on `Rarity`
     (`Partial<Record<Rarity, ...>>`). A9: `Record_.frame?: FrameId`,
     `frameName(id: FrameId, ...)` (`dataint` already pins the values). A11:
     `roll.ts` imports `clamp` from `numField.js`; `print.ts:38` `DIE_ART` ->
     `DICE_WITH_ART`.
  3. O5/O6/"830": `build-share-pages.js:109` `(it.rud || it.ende || '')`;
     `:160` renders the description as flat text or `\n`-split paragraphs
     (a 6-line CJS split); `:169` "830" -> "1091"; export the `EQ_*` maps.
  4. H5 guard: `i18n.test.ts` loads `tools/build-share-pages.js` via
     `createRequire(import.meta.url)` and asserts its `EQ_*` tables equal
     `i18n.ts`'s pairs.
- **Steps - components**:
  5. A2: `AppState.copied(run: () => Promise<boolean>, ok: string)` - awaits,
     toasts `ok` or `t.copyFailed` with `error: !ok`; convert the 14
     `env.clipboard` sites.
  6. C1: delete the ten `say` shims and the `say` prop on
     `PageHead`/`RecordActions`; each calls `app.say(msg, { error })`.
     `state/lists.test.ts:19`'s shim is a test double; leave it.
  7. C5/H6/H7: `--ink-on-gold: #1a1206` replaces the eight literals; delete
     `--gap`, `--gap-lg`, `--step--2`, `--step--1`, `--step-1`, `--step-2`
     (zero users); move the page-heading comment above `--h-page-*` and
     replace its last sentence ("`tests/app/typo.js` measures rendered sizes
     against its own scale list; a new step here has to be added there
     too"); rewrite the `:56` claim to describe the file.
  8. D7: delete `opacity: 0.72` (`Chip.svelte:94`) and `0.75`
     (`ListPage.svelte:1111`); remove the `color-contrast` allow at
     `sweep.js:363`; delete D7.
  9. C2: `Badge.svelte` (`cls`, `title?`, `children`), a one-line template
     with no leading/trailing whitespace (`RowMain.svelte:96-98` is
     whitespace-critical); the base rule plus nine variants including
     `.num`; replace the three copies; `--badge-bg` and `--gold-rgb` in
     `tokens.css` while the rules move.
  10. C7: `NumRow.svelte`; replace the five copies; `ListsPage.svelte:194`
      `.numrow .grow` -> `.grow`; `.results { margin-top: 26px }` folded
      in place (three lines, no component).
  11. C8: `App.svelte:49-56` -> outer `{#if}`, `{@const cfg = ...}`,
      `{#if cfg}`.
  12. `COVERED` entries for `Badge.svelte` and `NumRow.svelte`.
- **Acceptance**: `label.test.ts`, `money.test.ts`, `alt.test.ts`,
  `roll.test.ts` pass with unchanged expectations; `node tests/run-all.js
  derived,dataint,stub` green (stubs regenerate with the O6 shape); `git
  grep -n '#1a1206' -- app/src` returns only `tokens.css`; `git grep -c
  'const say = ' -- app/src/components` is 0; the 14 clipboard sites read
  `app.copied(...)`; all four golden shards green without `--update`; `node
  tests/app/sweep.js 768` reports no `color-contrast` violation on
  `#/roll/alt` or `#/lists/a` with the allow removed; `app/typo` and
  `app/hues` green.
- **Gates**: `npm run check`; `npm run check:built`; `node
  tests/run-all.js derived,dataint,stub,app/typo,app/hues`; `node
  tests/app/sweep.js 768`; the four golden shards, one call each.
- **Goldens**: none - proved by the four-shard run.

### B6 - router, state and lists (P1, D19, D5/O3, P11, R7, S1, S2, S3/D2, S6, R5, R4, DC1, R9, R10, R1, R2, S4, S5, S7, R3/P9, PF3, D23, D12, A6, P5)

- **Merged from**: first-plan B8 + B9.
- **Stands alone because**: a different route and filter set from B5 (its
  proofs are `--only=lists`, `--only=#/l/` and `app/states`, none of which
  B5 runs) and from B7 (which re-records); reviewability keeps it in two
  commits - shell/router/state first, lists second - each green on its own
  `npm run check`, with the `tests/app/` filters paid once at the end.
- **Files**: `Shell.svelte`, `TabBar.svelte`, `App.svelte`,
  `app/src/state/{app,lists}.svelte.ts`, `app/src/lib/{hash,listLink}.ts`,
  `app/src/ports/{router,storage,types}.ts`, `TablesPage.svelte` (Q1),
  `ListPage.svelte`, `ListsPage.svelte`, `SharedListPage.svelte`,
  `AddToList.svelte`, `StorageNotice.svelte`, `app/src/lib/dict.ts`, tests
  (`shell`, `app`, `hash`, `ports`, `lists`, `listPage`, `listsPage`,
  `sharedListPage`), `docs/fixtures/urls/routes.json`, `tests/contracts.js`
  (replays it), `tests/app/inventory.js` + two seeded goldens,
  `docs/specs/{ROUTES,STATE,FEATURES,DEBT}.md`.
- **Commit 1 - shell, router, state**:
  1. P1: the skip link's `onclick` calls `preventDefault()` and focuses
     `#main`; `href` stays. `shell.test.ts`: from `#/tables/eq_weapon`,
     activating it leaves `app.hash` unchanged and focuses `main`.
  2. D19: `.skip:focus` becomes the overlay (`position: absolute; left: 0;
     top: 0; z-index: 300; background: var(--gold); color:
     var(--ink-on-gold); font-weight: 700; padding: 10px 16px;
     border-radius: 0 0 10px 0`); `FEATURES.md` "Chrome" clause; D19 deleted.
  3. D5/O3: `document.title` = `<name> — <docTitle>` on a record, `<section
     label> — <docTitle>` on a section, `<list name> — <docTitle>` on a
     list, plain elsewhere; `shell.test.ts` covers record, section, language
     switch, `#/i/nope`; `FEATURES.md:153` rewritten; D5 deleted.
  4. P11: `TabBar` effect on `current` sets the nav's `scrollLeft` from
     `offsetLeft` arithmetic (not `scrollIntoView`); test with mocked
     geometry.
  5. S2/R7: `go()` assigns `this.hash = this.#fallback(hash)`; `App.svelte`
     gains `{:else}` with the record route's not-found block, and wraps the
     page slot in `<svelte:boundary>` with a `failed` snippet naming the
     error and offering reload (the smallest boundary); tests.
  6. S1: the router handler skips the hash `go()` just wrote (`#expectHash`);
     test `start()` then `go()` -> `navigations === 1`.
  7. S3/D2 + R10 (Q4 settled): `#expand()` re-reads `this.route` in
     `then`/`catch` and returns unless still on the same packed payload; on
     failure it sets `app.expandFailed = payload` instead of replacing with
     `zzzz`; `ListPage.svelte:581-584` draws the bad-link state when
     `route.packed && app.expandFailed === route.payload`, leaving the
     address alone; new inventory state `#/l/~AAAA` (valid base64url,
     invalid deflate) seeded with `--update --only=~AAAA`; `_l_zzzz` stays
     (a plain bad payload); D2 deleted; `FEATURES.md` "Lists" clause.
  8. S6: `stop()` calls `hideToast()`. `route`/`section` become `$derived`
     class fields.
  9. R5: `hash.ts:91` -> `/^l\//`; `ROUTES.md:112` clause; a `routes.json`
     row for `#/l/ABC.` -> `sharedList`; `hash.test.ts` case.
  10. R9 (Q3 settled): `hash.ts:104` returns `{ kind: 'unknown' }` for a
      named table that is neither an alias nor a `TableId`; bare `#/tables`
      unchanged; `readHome`'s `#/tables/frames` line stays; `ROUTES.md:51-53`
      rewritten; `hash.test.ts` + a `routes.json` row (`#/tables/nosuch` ->
      unknown).
  11. R4-2: `router.ts:39-43` wraps `replaceState` in `try/catch` falling
      back to `location.hash = hash`; `ports.test.ts` case.
  12. DC1 (Q1 settled - restore): `AppState.tablesView` read from
      `dhloot.prefs.v1 { view }` at construction (bad value -> `'list'`),
      written on change; `TablesPage.svelte:91` reads/writes it;
      `app.test.ts` covers the fallback; `STATE.md` rows already say so.
- **Commit 2 - lists and two tabs**:
  13. R1: `load()` distinguishes absent from unreadable; on unreadable it
      copies the raw string to `dhloot.lists.v2.bad` once and sets
      `this.unreadable`; `ListsPage`/`ListPage` draw a notice (new dict pair,
      the `.warn` shape `StorageNotice` uses for "storage refuses");
      `STATE.md` key table gains the `.bad` row; `lists.test.ts:55-58`
      extended; new inventory state `#/lists ~ unreadable storage` seeded
      with `'dhloot.lists.v2': '{'`, golden seeded with `--update
      --only=unreadable`.
  14. R2: `onExternalChange(fn: (key: string | null) => void)`;
      `browserStorage` also listens on `visibilitychange` (visible) and
      `pageshow`, calling `fn(null)`; `watch()` reloads on `LISTS_KEY` or
      `null`; `memoryStorage` gains a test hook; `STATE.md` "Two tabs"
      clause; the caret-move caveat in the commit message.
  15. S4: `ListPage` re-seeds a note textarea when it is not focused and its
      value differs from the store; `seedText`'s mount-time write stays.
  16. S5: `load()` filters `#deleted`. S7: the two page-level tests via
      `withCapturedListener`.
  17. R3/P9: `decodeList` returns `dropped`; `restore()` passes `money`,
      `note`, `hnote` through and toasts the dropped count (new dict pair);
      `SharedListPage` toasts it once. Encoding and fixtures untouched.
  18. R4-1/PF3: the `ListPage.svelte:112-115` effect debounces
      `app.syncListUrl(l)` 150 ms trailing, flushed in `onDestroy` and on
      `pagehide`; `own`'s `r.payload === app.urlPayload` short-circuit keeps
      resolving by id while the URL lags; `save()` stays synchronous. Test:
      twenty `setNote` calls produce one `replace`.
  19. D23: `ListPage` watches `app.navigations` and clears `lsel`; history
      test. D12: keep `aria-pressed`; `listPage.test.ts` asserts it on the
      money picker; entry deleted.
  20. A6: private `goldEdit(next, msg)` in `ListPage.svelte` replacing the
      three bodies; toast strings unchanged.
  21. P5: `store.remove()` returns the list and its index; `del()` in both
      pages toasts `listDeleted` (new dict pair) with an undo that un-sets
      `#deleted[id]`, splices it back and saves; the tick-chip removal in
      `AddToList.svelte:81-84` gains an undo via `restoreEntry` at the
      original index; `FEATURES.md` "Lists": "delete, with undo".
  22. Ride-alongs: `create()` returns `this.lists[0]`; `StorageNotice`'s
      `works()` cached on `AppState` at construction; `parseItems` clamps
      `qty` to 99 and `gold` to 99999 (the field maxima at
      `ListPage.svelte:839,859`).
- **Acceptance**: every step's named test; `node tests/app/golden.js
  --only=lists` and `--only=#/l/` green without `--update` except the two
  new states; `tests/contracts.js` replays the two new fixture rows; `node
  tests/run-all.js app/states` green (history case, two-tab case); `git
  grep -n zzzz -- app/src` returns only the `_l_zzzz` plain-payload path.
- **Gates**: `npm run check` per commit; `npm run check:built`; `node
  tests/app/golden.js --only=lists`; `node tests/app/golden.js --only=#/l/`;
  `node tests/run-all.js app/states,contracts`.
- **Goldens**: two new states seeded (R10's failed expansion, R1's
  unreadable storage). Nothing else moves; the mount-time seed is preserved
  (S4); D19 is CSS; titles are not in the tree.

### B7 - accessible names, product text and structure - the re-record (P2, P3, P6, P7, P13, P14, P15, pill name, D11, P4/D6, P8, P10, P12, D3, D8)

- **Merged from**: first-plan B10 + B11.
- **Stands alone because**: it is the one batch that re-records the
  goldens, and a re-record must not share a commit with work that claims
  "none" - reviewability of the golden diff is the whole gate. Inside the
  batch the two-commit shape (code, then `--update`) keeps the diff
  attributable.
- **Files**: `TableRows.svelte`, `ListPage.svelte`, `RecordModal.svelte`,
  `ListsPage.svelte`, `AddToList.svelte`, `SearchPage.svelte`,
  `FilterBar.svelte`, `RecordCard.svelte`, `SharedListPage.svelte`,
  `app/src/state/app.svelte.ts` (`toggleAllIn`), `TablesPage.svelte`,
  `Shell.svelte`, `StorageNotice.svelte`, `app/src/lib/dict.ts`,
  `app/index.html:56`, the D11 sites, `app/src/test/a11y.ts` call sites,
  `tests/app/sweep.js:360,364-366`, `tests/app/states.js` (D6 assertions),
  `docs/fixtures/share/records.json` (D11 recapture), all four golden
  shards, `docs/specs/{FEATURES,DEBT}.md` (D3, D6, D8, D11 deleted).
- **Commit 1 - code**:
  1. P2: row checkboxes named `nameOf(it, lang)` at
     `TableRows.svelte:122,154` and `ListPage.svelte:803`.
  2. P3: `RecordModal.svelte:79` `aria-label={nameOf(it, app.lang)}`.
  3. P6: `aria-label` off `t.newList`/`t.importList`/`t.newList` on
     `ListsPage.svelte:114,127`, `AddToList.svelte:265`.
  4. P7: `SearchPage` keeps the unsliced length and renders the
     shown-of-total line when the cap bites.
  5. P13: fetch `https://ru.daggerheart.su/frame`, quote the title in the
     commit, set `srcFrame`, `frameF`, `subFrames` to that word.
  6. P14: one editorial pass over `dict.ts` - English quotes straight;
     Russian em dash where a dash stands alone (`rollHint`, `uniqueHint`,
     `printSub`, `guessWhy`, `repriceHint`); ranges keep the en dash;
     `rollLabel` and `footBefore` untouched.
  7. P15: `app/index.html:56` "1091 запись"; `dict.ts:200` reworded so the
     numeral agrees.
  8. Pill: `<i aria-hidden="true">&times;</i>` in `FilterBar.svelte:88`.
  9. D11 (Q6 settled - print): drop the `isFrameRecord` tier guard at
     `label.ts:33,111`, `RecordCard.svelte:86,177`, `RowMain.svelte:78`,
     `TableRows.svelte:84`, `RecordPage.svelte:52`, `PrintCard.svelte:34`,
     `share.ts:90`, `search.ts:34` together; invert `search.test.ts`'s D11
     case; `record.test.ts` asserts `f33`'s tier word; recapture
     `docs/fixtures/share/records.json` with `tools/capture-share-fixture.mjs`
     (only `f33` should change); D11 deleted.
  10. P4(a): `onkeydown` on `.seldrop` - Escape clears `app.menuFor` and
      `newListFor`, refocuses the toggle, `stopPropagation()`.
  11. P4(b)/D6: `.dropmenu` after the `<Button>`; the placement effect
      measures the toggle (`:scope > .btn`) against the nearest clipping box
      (`.modal-card` or the window); `RecordCard.svelte:269` `.card` gets
      `overflow: clip` (rounded corners still clip); `states.js`: on Кольцо
      Тишины at 1100x900 with no lists, `.card.scrollTop === 0` and the menu
      box lies inside `.modal-card`; after "+ Новый список" the input is
      inside and focused; D6 deleted; `FEATURES.md:95-97` rewritten.
  12. P8: `toggleAllIn` moves to `AppState`; `SharedListPage` passes
      `ontoggleall`.
  13. P10: `<SelBar>` before `<footer>` in `Shell.svelte`; the page-bottom
      overlap at 1180 and 375 measured and recorded in the handoff.
  14. P12: the `PageHead.svelte:136-144` `::after` 44x44 target on `.note-x`,
      `.warn-x`, `.selx`.
  15. D3: the dismiss cross moves out of `<summary>` to a sibling over the
      corner; every `{ allow: ['nested-interactive'] }` in `a11y.ts` call
      sites and `sweep.js:360` removed; D3 deleted; `FEATURES.md:123-131`
      rewritten.
  16. D8: `TablesPage.svelte:538` - each rarity section gets an `<h2>`, the
      columns become `<h3>`; `sweep.js:364-366` allow removed; D8 deleted;
      `FEATURES.md:210` clause. `TablesPage.svelte:75-78` wraps its
      `lastTable` write in `untrack` (style).
- **Commit 2 - `--update`**, four shards, then inspect: the diff may
  contain only `checkbox "<record name>"` where `checkbox "Выбрано"` was;
  `dialog "<record name>"` in five files; the three textbox names; the frame
  word in `_tables_other_frames*`, `_tables_frames`, filter panels and
  frame-record badges; the `subSearch` head in `_search*`;
  `_search_capped`'s count line; the pill names in
  `_tables_eq_weapon_filtered` and siblings; tier words on frame records;
  the menu after the button in `_i_ci1_list_menu`, `_i_ci1_new_list`,
  `_i_ci1_many_lists`, `_tables_bar_menu`, `_tables_a_row_opened_list_menu`,
  `_tables_a_row_opened_new_list`; a select-all row in `_l_shared*`; the
  selection bar before `contentinfo` in every ticked state and
  `_tables_selection_copied`; the dismiss button outside `summary` in
  `_lists*`; `heading` levels in `_tables_alt_*`. Any other diff line is a
  defect to explain before the re-record is committed.
- **Acceptance**: commit 1 leaves `npm run check` green with the named test
  updates; commit 2's diff matches the list above; `node tests/app/sweep.js
  768` clean with the two allows removed; the `states.js` D6 case green;
  one shard re-run after the update is byte-identical (a determinism probe;
  the update run's own capture is the record).
- **Gates**: `npm run check` per commit; `npm run check:built`; the four
  golden shards with `--update`; one shard again without; `node
  tests/app/sweep.js 768`; `node tests/run-all.js app/states`.
- **Goldens**: re-record, most of the 110.

### B8 - record actions, print, motion and focus (D10, D13, D14, D15, D22, P16, R6, D20, D21, D1, D18)

- **Merged from**: first-plan B12 + B13 + B14.
- **Stands alone because**: a different route and filter set from B7 - its
  proofs are `app/states` (copy-image, reduced-motion), `app/print` and the
  1180 focus walk, and it claims no golden movement; B7 re-records and must
  not absorb work whose proof is "the tree did not move".
- **Files**: `RecordActions.svelte`, `StdPanel.svelte`, `AltPanel.svelte`,
  `app/src/ports/{image,clipboard,share,types}.ts`, `app/src/lib/{dict,share}.ts`,
  `vite.config.mts:153`, `PrintCard.svelte`, `PrintPage.svelte`,
  `RecordModal.svelte`, `Toast.svelte`, `app/src/state/app.svelte.ts`,
  `tokens.css`, `RowMain.svelte:120`, `Seg.svelte:83`,
  `ListPage.svelte:1650-1656`, `StorageNotice.svelte:129`,
  `RecordCard.svelte:337`, `tests/app/print.js`, `tests/app/states.js`
  (new reduced-motion case), tests, `docs/specs/{STATE,FEATURES,DEBT}.md`
  (D1, D10, D13, D14, D15, D18, D20, D21, D22 deleted).
- **Steps**:
  1. D10: `pngOf` rejects on a tainted canvas (probe `toDataURL`'s
     `SecurityError`, or a 2 s `toBlob` watchdog); `copyImage` falls back to
     `copyText` with a new `imgTainted` toast; the `states.js` copy-image
     case reads a real blob size or the real fallback text; narrow the
     `vite.config.mts:153` exclusion or add the rejection-path test.
  2. D14/D15: `ImagePort.download(blob, name)` via `<a download>`; the
     unsupported/refused branch offers it with `imgSaved`/`imgFailed` toasts
     distinct from `copyFailed`; a component test drives the fallback.
  3. D22: `send()` passes the full share text and a `file` when art exists
     and `canShare({ files })`; `record.test.ts` asserts the payload.
  4. D13: `rollCopied` dict pair; both panels toast it; `std.test.ts`,
     `alt.test.ts` assert the text.
  5. P16 (Q2 settled - look, then shrink): `npm run build`, open
     `#/print/cm26-f60-hi62-ci81` in both languages and both layouts through
     the driver at 1100 wide, record `.pc-name`'s line count per card in the
     handoff **before** writing code. If any exceeds two lines: a name step
     in `fit()` before the text ladder shrinking `.pc-name` while its line
     count exceeds two, floor 4.6cqw, and a `print.js` assertion pinning
     `cm26` at two lines. If none does: the assertion only. Either way the
     deviation from Figma nodes `714-42387`/`3773-90792` is recorded in
     `FEATURES.md` "Print".
  6. R6: `PrintCard` gains `onartfail` and `onerror` on both `<img>`;
     `PrintPage` passes `app.markArtBroken`; test with a broken path.
  7. D20: `RecordModal.svelte` gains `@media print { dialog { display: none
     !important } }`; `Toast.svelte:142` gains `!important`; `print.js`'s
     `printMedia` reads both selectors.
  8. D21: `AppState.printBW` (memory); `PrintPage` reads/writes it;
     `STATE.md:77` stays true; `printPage.test.ts` pins survival across a
     navigation away and back.
  9. D1 (Q5 settled): `tokens.css` gains `@media (prefers-reduced-motion:
     reduce) { *, *::before, *::after { animation-duration: 0.01ms
     !important; animation-iteration-count: 1 !important;
     transition-duration: 0s !important; scroll-behavior: auto !important }
     }`; `states.js` case with `page.emulateMediaFeatures([{ name:
     'prefers-reduced-motion', value: 'reduce' }])`: hover a button, resize
     across 600 px, `document.getAnimations().length === 0`;
     `FEATURES.md:228-231` rewritten; D1 deleted. `app/print` proves
     `fit()` still fits.
  10. D18: delete the five 8px `:focus-visible` overrides; `FEATURES.md`
      "Chrome" sentence; D18 deleted.
- **Acceptance**: the named tests; `node tests/run-all.js app/states,app/print`
  green including the new cases; `node tests/app/sweep.js 1180` focus walk
  clean; `node tests/app/golden.js --only=#/i/ci1` and `--only=print` green
  without `--update`; the P16 line counts are in the handoff.
- **Gates**: `npm run check`; `npm run check:built`; `node
  tests/run-all.js app/states,app/print`; `node tests/app/sweep.js 1180`
  (one call, `timeout 600000`; CI is authoritative if the host stalls);
  `node tests/app/golden.js --only=#/i/ci1`; `node tests/app/golden.js
  --only=print`.
- **Goldens**: none (toasts are transient; focus, motion and print media
  are not in the tree).

### B9 - language and format: `tests/` and `tools/` (H1, T7, H13, H16, H15, T12, H11)

- **Merged from**: first-plan B15 + B16 + B17 + B18.
- **Stands alone because**: a different route and filter set - it touches
  only `tests/**` and `tools/**` and its proof is every browser suite green
  once (messages change only on the failure path), which no other batch
  runs in full. The one split the owner allowed here is kept **as commits,
  not batches**: three translation commits (node suites and tools; the small
  browser suites; `print.js` + `states.js`) and a final format commit -
  because a reviewer cannot tell a Prettier reflow from a changed regex in
  one diff, and `print.js`/`states.js` share lines between a Russian product
  string that must stay and a Russian message that must go. `git diff -w
  --stat` on the format commit must be empty.
- **Files**: `tests/derived.js` (250 Cyrillic lines: ~110 messages, ~125
  comments, ~15 product literals), `tests/dataint.js` (86), `tests/craft.js`
  (11), `tests/stub.js` (2), `tests/run-all.js` (33), `tools/build.js` (1),
  `tools/derived.js` (8 comments), `tests/ok.js` (new, H16),
  `tests/app/golden.js` (16), `tests/app/lib.js` (1), `tests/app/driver.js`
  (3), `tests/app/contracts.js` (14; 2 are product regexes),
  `tests/app/hues.js` (17; 4 grips), `tests/app/typo.js` (15;
  `LABELS`/`STORAGE` stay), `tests/app/sweep.js` (66; ~53 selectors and page
  labels stay), `tests/app/inventory.js` (3 comments; the 138 label/seed
  lines stay), `tests/app/print.js` (200; ~170 messages, ~29 product
  strings), `tests/app/states.js` (142; ~76 / ~65), `.prettierignore`,
  `eslint.config.mjs`.
- **Rules**: translate (a) messages and (c) comments; leave (b) product
  literals byte-for-byte (`craft.js`'s regexes, `derived.js`'s pinned
  strings such as `footBefore`, `sweep.js`'s selectors). A comment is an
  argument - translate the argument; if unclear, keep the Russian beside the
  English. `keyOf`/`fileOf` key off `s[0]`, so display names are safe.
  `print.js:1037`'s "stay Russian-only" means the UI language driven -
  reword to "driven in Russian only". `check-site.mjs` is already English
  (B4).
- **Commits**: (1) node suites + tools + `ok.js` + H13 + H15; (2) the small
  browser suites + `inventory.js` comments + T12; (3) `print.js` +
  `states.js`; (4) H11 - `.prettierignore` drops `tests/` and `tools/`,
  `eslint.config.mjs` gains a node-globals `disableTypeChecked` block for
  `tests/**`, `tools/**`, `.claude/hooks/**`, then `npx prettier --write
  tests tools` and the lint fixes.
- **Acceptance**: `git grep -c -P '\p{Cyrillic}'` over `tests/` (excluding
  `snapshots/`) and `tools/` returns only (b) lines; the four suites' and
  every browser suite's green run before and after; commit 4's `git diff -w
  --stat` is empty apart from the two config files.
- **Gates**: `npm run check` per commit; after commit 3 and again after
  commit 4: `node tests/run-all.js
  app/print,app/contracts,app/states,app/typo,app/hues,stub,derived,dataint,craft`
  (~290 s pooled); `node tests/app/sweep.js 390`; `node tests/app/golden.js
  --shard=2/4`.
- **Goldens**: none.

### B10 - the record-modal host (C6)

- **Merged from**: first-plan B19, unchanged.
- **Stands alone because**: reviewability - `architecture.md` and
  `components.md` both say its golden impact must be measured before it is
  believed; the four-shard run is its whole gate and must not be confounded
  by any other change.
- **Design**: `RecordHost.svelte` owns `open`, renders `<RecordModal>` and
  exposes `openRecord` through its children snippet parameter; it also owns
  the close-on-navigation effect `SearchPage`/`TablesPage` carry today;
  `ListPage` passes `extra`. The six `RecordCard` + snippet blocks are left
  alone unless a clean extraction falls out without a new prop.
- **Acceptance**: `git grep -c "let open = \$state<Record_" -- app/src` is
  0; all four golden shards green without `--update`; `COVERED` entry.
- **Gates**: `npm run check`; the four golden shards.
- **Goldens**: none expected; verified by the full run.

### B11 - equipment apostrophes (O2) - last, owner-settled yes (Q8)

- **Merged from**: first-plan B20, unchanged.
- **Stands alone because**: a commit the harness cannot reach in any other
  batch's gate - it rewrites `data.js`, regenerates 381 stubs and moves six
  goldens and possibly the share fixture; the owner placed it last so it
  never shares a diff with a code change.
- **Files**: `data.js` (`en`/`ende` of `eq` records, U+2019 -> `'`),
  regenerated `data.json`, `catalog.csv`, `i/` (untracked),
  `docs/fixtures/share/records.json` if any captured record carries one, six
  goldens.
- **Gates**: `node tools/build.js`; `npm run check`; `node
  tests/run-all.js dataint,derived,craft,stub`; `node tests/app/golden.js
  --only=search --update`, `--only=eq_ --update`, then both green.
- **Goldens**: re-record six (`_search_searched`, `_search_a_row_ticked`,
  `_tables_eq_armor`, `_tables_eq_secondary`, `_tables_eq_weapon`,
  `_tables_eq_weapon_panel_open`); the twenty carrying U+2019 from `dict.ts`
  are P14's (B7).

## Where every finding landed

Every id from the first plan's B2-B20, by new batch. Nothing fell out.

| First plan | Findings | Now |
|---|---|---|
| B2 | TL1, TL2, TL3, TL4, TL5, TL6, TL7/DP8, TL8, H14, H4/DC11, CLAUDE.md:36 | B2 |
| B3 | DC1 (docs half), DC2-DC8, DC12, DC13, H2, H3/DC10, H5 (comment), H8, H9, H10, H11 (comment), H12, H13, H15, T11, T12, T16, O4, C3 (option 2), C4/T9, C9, A8, PF7, D4, D16, D17, the `llms.txt` and `CONTRACTS.md` clauses, Q7's three surviving edits | B2 |
| (new) | revision 2: the forcing function in `CLAUDE.md`, `plan.prompt.md`, `.claude/README.md` | B2 |
| B3 | DC9 - dropped by B2 (the `Button.svelte`/`statLabels` sentence was left false); fixed in the B2 review remediation batch, not in B2 itself - B2's three blockers, B-3 | B2 remediation |
| B4 | T1, T2, T3, T5, T8 | B3 |
| B5 | DP1, DP2, DP3, DP4/T4, DP5, DP6, DP7, T6, T10/DP9, gitleaks pin | B4 |
| (new) | R8 `404.html` (owner override) | B4 |
| B6 | A1, A3, A4, A5, A7, A9, A11 (`clamp`, `DIE_ART`), O5, O6, "830", H5 (guard) | B5 |
| B7 | C1/A2, C5, H6, H7, C2, C7, C8, D7 | B5 |
| B8 | P1, D19, D5/O3, P11, R7 (+ boundary), S1, S2, S3/D2, S6, `route` derived, R5, R4-2, DC1 (code), R9, R10 | B6 commit 1 |
| B9 | R1, R2, S4, S5, S7, R3/P9, R4-1/PF3, D23, D12, A6, P5, `create()` proxy, `works()` cache, `qty`/`gold` clamp | B6 commit 2 |
| B10 | P2, P3, P6, P7, P13, P14, P15, pill `aria-hidden`, D11 | B7 |
| B11 | P4(a), P4(b)/D6, P8, P10, P12, D3, D8, `lastTable` untrack | B7 |
| B12 | D10, D13, D14, D15, D22 | B8 |
| B13 | P16, R6, D20, D21 | B8 |
| B14 | D1, D18 | B8 |
| B15 | H1/T7 node suites and tools, H13 (tests half), H16, H15 (`stub.js`) | B9 commit 1 |
| B16 | H1/T7 small browser suites, T12 | B9 commit 2 |
| B17 | H1/T7 `print.js` + `states.js` | B9 commit 3 |
| B18 | H11 (format and lint) | B9 commit 4 |
| B19 | C6 | B10 |
| B20 | O2 | B11 |

Findings with no batch are in "Dropped" or "Deferred", unchanged from the
first plan.

## Owner decisions - settled

All eight questions are answered in `context.md`, "Settled owner
decisions", every one on the recommendation; plus `404.html` approved (B4)
and the twelve repo-decided items unvetoed. The plan above is written as
decided. `NEEDS_HUMAN_CONFIRMATION` is now `no` for B2-B11.

## `CLAUDE.md` - what remains of Q7

Fact 3 above: five of the nine proposed edits were already in the tree; the
copy the first pass read was stale. Remaining, all in B2: `:24` (the
inverted "preserves behaviour" line), `:36` ("parity run"), `:97` (the
`COUNTERS` pointer), plus revision 2's one forcing-function line. The file
ends at 168/200. No section is deleted, so nothing shrinks.

## Dropped, with the legitimate reason

Audit list. "Not a problem" means verified against the tree or accepted
from the report's own measurement.

| Finding | Reason | Note |
|---|---|---|
| PF1 (browser probe for search) | superseded | The only fix its number could justify beyond PF2 is virtualisation, excluded on golden grounds; PF2 was justified by O1's design and has shipped. |
| PF5, PF6 | not a problem | The report's own verdict, with measurements. |
| PF4 as a phase-8 batch | deferred to its own task | Contract change; not dropped. |
| T13, T14, T15, T17 | not a problem | Measured in the report; off the critical path. |
| C3 option 1 (`htmlWhitespaceSensitivity: strict`) | cure worse than disease | Reflows ~45 files permanently for a hazard with four sites; option 2 taken. |
| P6 via `Field` emitting `<label>` | cure worse than disease | `Field` wraps chip rows and segmented switches; a `<label>` around buttons is wrong. |
| D16 | not a problem | Fact 6: the idle region is `display: none` on both apps. |
| `components.md` "not worth it" (`panel` class on `ffilter`/`tablenav`, `Panel`'s inline copies, `PageHead`/`PageTitle` `.page-h`, `DiceBar`, `Shell` writing `document.title`, `app.env.*` reads, `PageTitle` branching, `ListPage` size) | not a problem / cure worse | Each has its reason at the site; the `ListPage` split is deferred. |
| A10, A12 | not a problem | Map facts; nothing proposed. |
| A11 `pick`/`Panel` naming, `isLastOn`'s home | cure worse than disease | Renames across route-level components for a word collision. |
| `open.md`: `listLink.ts` `btoa`/`atob`, `.nvmrc` vs `engines` | not a problem | Both `globalThis`, Node-safe; CI pins from `.nvmrc`. |
| `resilience.md`: truncated-note checksum | cure worse than disease | A payload-grammar change for a failure the reader can see. |
| `window.confirm` in a sandboxed iframe; unguarded `showModal()` | not a problem | Below the app's floor. |
| `state.md` `$state.raw` | cure worse than disease | The report's own verdict. |
| `load()` ignoring the v1-migration write's result | not a problem | The undismissable notice already shows. |
| `deploy.md`: the 60 s retry, `cp -r` comment, `workflow_dispatch`, burst-cancel, `[skip ci]` | not a problem | Measured or inherent to the right setting. SHA-pinning `actions/*` dropped as cure worse; `gitleaks` pinned (B4). |
| `hygiene.md`: 102 `app.js:NNNN` citations, `tools/` orphans, `test-output/` logs, `issues/` pruning, `numField.ts` comment density | not a problem | `CLAUDE.md:16-18` resolves the citations once; `app.js` is frozen. |
| `product.md`: two rarity vocabularies | unverified | Needs the Core book. Owner may confirm and add one `FEATURES.md` sentence. |
| `product.md`: a shared list with an empty name | not a problem | Correct fallback. |
| `product.md`: search help panel | owner's content | Listed under the UI/UX ticket. |
| `product.md`: roll live region summary, money-picker discoverability, undo toast focus | deferred to the UI/UX ticket | Design changes. |
| TL3 family 2 | cure worse than disease | Rewards a dead citation; recorded in the README. |
| DC14 (`issues/56`, `issues/59` cite `docs/parity.md`) | outside this task's write scope | The orchestrator passes it on. |
| The first plan's "fact 3" (`CLAUDE.md` names `eqtest,qa`) | not a problem - retracted | The injected copy was stale; the file on disk is right (fact 3 above). |
| T7's and H1's batch splits | superseded | Replaced by B9's four commits. |
| T8 | superseded | Dissolves under T1 (B3). |

R8 (`404.html`) moved from "not planned" to B4 on the owner's decision.

## Deferred to the two excluded tickets, and to tasks of their own

**Consistent storage layer** (owner's ticket) inherits: R1's general form
(versioned envelope, schema validation on read, migration chain) - B6
patches the destructive symptom only; S4's deeper half (whole-list
last-writer-wins; per-entry or per-field reconciliation);
`dhloot.lang.v1`/`home.v1`/`warn.v1` not watched across tabs; the
`.bad`-key recovery beyond a notice; PF3's `save()` debounce (measure first
with the probe `performance.md` describes); a list export/backup file
(`resilience.md`; no upload service, a local `.json` download - product
decision).

**UI/UX redesign** (owner's ticket) inherits: the focus-management pass
(toast actions unreachable by keyboard, a labelled selection region, menu
focus) - P4 and P10 are its cheap edges and are done in B7; the roll
results live region reading four whole cards; the money picker hidden until
a price exists and the "Золото" header over "3 мешка" values; a help panel
for Search (owner-written content); an inlined first-paint skeleton (PF5); a
`<svelte:boundary>` reporting framework beyond B6's minimal boundary.

**Tasks of their own** (costed, not dropped): PF4 image derivatives (a
192 px variant under a new asset path; `CONTRACTS.md`, `docs/fixtures/`,
`tests/contracts.js`, `llms.txt` in one commit; ~2 MB of files); splitting
`ListPage.svelte` (1692 lines; a golden plan per seam; after B10); A2's
remaining half (every port through `AppState`); decomposing `AppState`;
`Record_.tier` -> `voaTier` (wire-name adapter, contract); branded id types;
one home for the shared-link wire constants (contract docs + fixtures); the
release-shape change of publishing the artifact `check` proved
(`deploy.md`); a replacement heavy-run lock (`.claude/README.md:282-295`);
the Playwright decision (issue 47 handoff, "Phase 8 opening inputs").

## Gate cost, both shapes

Local, idle-host estimates from `.claude/README.md`'s table (`check` ~3-8
min as measured this week, a golden shard ~5 min, a sweep width ~5.5-10 min,
the pooled browser subset ~5 min, `app/states` ~2 min, `app/print` ~3 min,
a CI watch ~7 min after B3).

| Batch | `check` runs | Other gates | Approx. |
|---|---|---|---|
| B2 | 1 | 2 fs suites | 8 min |
| B3 | 1 | 1 local shard of `run-all`, CI watch | 18 min |
| B4 | 1 | CI watch, PR probe run, re-run timing | 23 min |
| B5 | 1 | built, typo/hues, sweep 768, 4 golden shards, fs, `--only` | 40 min |
| B6 | 2 | built, 2 `--only`, states, contracts | 25 min |
| B7 | 2 | built, 4 shards `--update`, 1 shard verify, sweep 768, states | 45 min |
| B8 | 1 | built, states+print, sweep 1180, 2 `--only` | 28 min |
| B9 | 4 | pooled subset x2, sweep 390, 1 shard | 40 min |
| B10 | 1 | 4 shards | 28 min |
| B11 | 1 | build, fs suites, 2 `--only --update`, verify | 14 min |
| **Total B2-B11** | **15** | | **~4.5 h** |

The first plan's B2-B20 shape: 18 `check` runs, 21 golden shard runs, five
sweep widths - roughly 5.5-6 h before counting review passes. The merge
removes nine batch boundaries, three `check` runs and four shard runs; the
remaining `check` count is set by the commit boundaries reviewability
demands (B6, B7, B9), not by batch count.
