# Handoff - TASK 56-followup
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: **B2 done, committed, pushed.** `plan.md` defines only B1 and
  B2; no B3 is specified. Awaiting human review / further direction before
  any new batch is planned.
- Last agent: implementer
- NEEDS_HUMAN_CONFIRMATION: no design blocker. Report status and wait for the
  human before starting new work, per `CLAUDE.md`'s task protocol.
- Branch: `main`, pushed - `origin/main` is `27ac065`, verified by
  `git rev-parse HEAD` / `git rev-parse origin/main` matching after push.
- Base / starting commit for B2: `e242814`. **HEAD moved under this task
  during B2**, as the plan warned it would: the concurrent `issues/config-audit`
  session landed `3fbd129 docs(config-audit): record the fresh RTK re-measure
  and clear the row 41 probe` (docs-only, touches none of B2's files) before
  B2 committed. B2 committed on top of it rather than resetting or rebasing,
  per instruction.

## Completed
- Batch name/id: **B2 - Separate the tag from the table path**.
- What shipped: `label.ts`'s `whereFrom` (the table path) and `srcLabel` (the
  badge tag) are now used for exactly what each name says. `whereFrom` lost
  its community early return and now appends the record's own section leaf
  only when the table is sectioned by a value the record carries -
  `it.frame` for `other_frames`, `it.community` for `community` - so a
  community record's path completes to `Сообщества · Великородное` /
  `Communities · Highborne` instead of stopping at the leaf. `printSrc`
  collapsed to one rule built on `whereFrom`, byte-identical to its old
  two-rule form (proven by its own pre-existing, unchanged test). The five
  `.badge src` sites (`RecordCard.svelte:136`, `RowMain.svelte:98`,
  `app.js` `cardHTML`/`rowHTML`/`listRowHTML`) now call `srcLabel`, so a
  badge is a one-word leaf everywhere it is drawn. `RecordPage.svelte`'s
  subtitle gained the `voaArtifact1`/`voaCursed1` segment `app.js:3237`
  already printed on 11 Vault of Ages records, closing a renderer
  divergence no golden had caught. `app.js`'s own `whereFrom` was rewritten
  onto the same `tableIdOf` -> `groupOf` -> `SUB_LABEL` path the Svelte
  version uses (it previously special-cased only Other and fell back to a
  bare `srcLabel` for every other record - the fallback badge read `Core`
  where the shipped rewrite read `Core · Предметы`); `renderItemPage` now
  calls `whereFrom(it)` directly instead of duplicating its logic inline.
- Tests: `label.test.ts` - the community `whereFrom` case now asserts the
  completed path in both languages, plus a new "a tag and a path, pinned
  apart" describe block pinning `srcLabel`/`whereFrom` side by side for six
  real-data shapes (`ci61`, `hi61`, `f1`, `f95`, `cm1`, `voa2_a1`).
  `tables.test.ts` - the frame row's badge assertion updated from the full
  breadcrumb to the leaf `Пир зверей`. `record.test.ts` - new fixture
  records `cm1` (community) and `voa_a1`/`voa_c1` (artifact/cursed), and a
  new describe block asserting the completed path and the leaf badge, plus
  an axe check. `searchPage.test.ts` - a new community fixture record and a
  test that a search result row's badge carries the leaf, not the path.
- Docs: `FEATURES.md` "Records" gained two bullets stating the tag/path rule.
  `COVERAGE.md`'s `app/golden` row count updated from 108 to 110 states (the
  only other count of the same set in the file).
- Goldens: two new states added to **both** `tests/app/inventory.js` and
  `tests/parity/specs.js` (`#/i/cm1`, `#/i/voa2_a1`) at the same point,
  keeping their drift guard satisfied. All four golden shards regenerated and
  then verified clean on a second comparison pass. 64 existing snapshots
  moved plus the 2 new files - see "Verification" for the exact fallout
  check.
- Files changed: 79 files in `27ac065` (`git diff --cached --stat`: 79 files
  changed, 6946 insertions, 6499 deletions after staging).
- Commit: `27ac065 fix(app): separate the tag from the table path (issue 56,
  B2)`, pushed to `origin/main`.
- Deviations and rationale: none from the plan. `printSrc`'s ternary needed a
  `prettier --write` pass after the first edit (multi-line ternary formatting)
  - caught by `npm run check`'s `format:check` stage, fixed before the gate
  reran; no behavioural change.

## Verification
- Commands run, exact, this pass:
  - `npx vitest run --coverage=false app/src/lib/label.test.ts
    app/src/components/record.test.ts app/src/components/tables.test.ts
    app/src/components/searchPage.test.ts app/src/components/printPage.test.ts
    app/src/components/listPage.test.ts` - **6 files, 235 tests, all passed**
    (after fixing three trailing-whitespace assertions caused by the `<p>`
    snippet's text node carrying a trailing space before its link - trimmed
    in the test, not in production code).
  - `node tests/run-all.js i18n,derived,dataint,eqtest,qa` - **all 5 passed**
    (i18n: ru 251/en 251 parity held; derived: catalogue/share-stub bytes
    match; dataint, eqtest, qa clean).
  - `npm run build` - clean; `node tools/build.js` reported "wrote 1091 share
    pages into i/" and `git status --porcelain -- i/ data.json catalog.csv
    data.js` was **empty both times** (once after `build`, once after
    `check:built`'s own rebuild) - confirms B2 touches no generated data or
    share stub, as scoped.
  - `node tests/app/golden.js --update --shard=N/4` for N in 1..4,
    **sequentially, one at a time** - 28+28+27+27 = 110 states captured,
    matching the two new states landing. Inspected the full diff before
    comparing:
    - `git status --porcelain -- tests/app/snapshots` - 64 modified + 2 new
      (`_i_cm1.txt`, `_i_voa2_a1.txt`) = 66 files, not the "~95" the plan
      estimated - the difference is the golden's own documented elision: a
      same-shape StaticText run folds to its first two and last two
      occurrences (`COVERAGE.md`, "What still fails" / "does not fail"), and
      several badge changes (e.g. `_i_f1.txt`'s own card badge) landed
      entirely inside an already-elided run, so that file is legitimately
      unchanged. Spot-checked `_i_f1.txt`: the subtitle line
      `Прочее · Сеттинги · Пир зверей` is untouched (path, correct), and its
      badge text sits inside `... StaticText x8 of 12 same-shape siblings
      elided`.
    - Three "stop and diff" signals, all clean:
      `git status --porcelain -- 'tests/app/snapshots/_print_*'` - empty (0
      of 9 print snapshots touched). `git status --porcelain --
      'tests/app/snapshots/_i_nope*'` - empty. Tier-line balance: `git diff
      -U0 -- tests/app/snapshots` then counting `Ранг [0-9]`/`Tier [0-9]`
      occurrences separately on `+` and `-` lines gave **1857 and 1857** -
      exactly equal, so no tier text appeared or disappeared anywhere; the
      position shifts visible in the diff are truncation-boundary artifacts
      of shorter badges revealing more of an already-present tail, not new
      or removed tier content.
    - Confirmed the two pinned examples: `_i_cm1.txt` subtitle reads
      `Сообщества · Великородное` / `Communities · Highborne`;
      `_i_voa2_a1.txt` reads `Vault of Ages · Артефакт · номер 1` /
      `Vault of Ages · Artifact · roll 1`. `_i_q1_another_tier.txt` shows the
      exact divergence-1 fix: badge text changed from
      `СНАРЯЖЕНИЕ · ОРУЖИЕ` / `EQUIPMENT · WEAPONS` to `CORE`.
  - `node tests/app/golden.js --shard=N/4` for N in 1..4 (no `--update`),
    sequentially - **all four exit 0, no diffs**, proving the regenerated
    goldens are deterministic.
  - `node tests/run-all.js app/sweep,app/typo,app/hues,app/contracts,app/states`
    - run **twice**. The first run was launched with the Bash tool's default
    120s timeout and moved to background; a later coordinator check found its
    processes gone and its output unread by that point in the turn, so it did
    not count as evidence even though a completion notification with a full
    result table did arrive in-session. Re-ran with the tool's maximum
    600000ms foreground timeout; it still exceeds that (the suite takes
    ~11 minutes total), backgrounds again automatically past the tool's hard
    cap, but this time its output file was read directly (not only the
    notification) before proceeding. **Result, read from the captured output
    file: 8 of 8 passed** - `app/sweep` at 1180/768/390/360,
    `app/contracts`, `app/states`, `app/typo`, `app/hues`, all `ok`, exit
    code 0, "все наборы прошли за 648с (в 8 потока)". This discharges the
    B1r debt of 2/7 Puppeteer navigation timeouts under concurrent-session
    contention - a clean pass here on the same (now busier, with config-audit
    still active) box.
  - `set -o pipefail; npm run check 2>&1 | tail -n 120`, one foreground call,
    Bash timeout 600000 - **fully green, no exclusions needed** (unlike
    B1r): `format:check` clean (after the one `prettier --write` fix),
    `eslint .` clean, `svelte-check` 545 files / 0 errors / 0 warnings,
    `npm run data` + `tests/derived.js` clean ("производные файлы: всё
    сходится"), `tests/i18n.js` ru 251 / en 251 parity held,
    `.claude/hooks/selftest.mjs` 317 passed / 0 failed, `npm run test`
    **42 files, 1035 tests** (1026 + 9 new, matching the tests added this
    batch), coverage 96.61% statements / 88.58% branches / 97.1% functions /
    97.34% lines (`label.ts` itself at 100% statements). The
    `.agents`/`.claude/skills/impeccable` exclusion B1r needed is gone from
    the tree (resolved before B2, per the prior handoff), so **no
    `SKIP_CHECK_GATE=1` and no stage exclusions were used**, as instructed.
  - `npm run check:built` - green: build clean, `smoke-file-url.mjs` passed
    ("the built page opens from a folder"), bundle budget 88.9 kB against
    120 kB.
  - `git diff --check` - clean, no whitespace errors.
- Results: all of the above are green. No blocker gate.

## Blockers
- None outstanding for B2. The two process risks the plan flagged both
  resolved cleanly: `npm run check` needed no foreign-path exclusion (the
  B1r-era untracked skill install is gone from the tree), and
  `tests/parity/specs.js` / `tests/app/inventory.js` had not drifted from
  each other's `STATES` when re-read at the start of B2 - both received the
  same two new entries at the same point, and the self-retiring drift guard
  at the foot of `inventory.js` passed inside `npm run test`.
- Out of band, still unanswered, carried forward from B1r and not touched by
  B2: `8dae1b9 test(issue-56): remove parity from deploy requirements` drops
  `parity` from `deploy.needs` and confines it to `workflow_dispatch`. Only
  `docs/parity.md` records it; no plan, handoff or commit body carries the
  rationale. This is why both divergences B2 fixed (badge/path mismatch
  between the two renderers) shipped unnoticed in the first place. Not this
  task's to resolve, but worth flagging again since it is the root cause
  category, not just this batch's symptom.

## Deferred
- The seven unused `dict.ts` strings `tests/i18n.js` reports (`srcFrame`,
  `voaRecall`, `guessPrice`, `pcTh`, `printFoot`, `money_coin`, `money_bag`) -
  pre-existing, not this task's to decide. Unchanged by B2.
- `app.js`'s `tableIdOf` still tests `it.frame`, then `it.starting`, then
  `it.src === 'frame'`, where `label.ts`'s `tableOf` merged the two frame
  tests in B1r finding 12. No catalogue record reaches the difference. Fold
  them the next time either file is open for another reason. B2 did not
  touch `tableIdOf`, per its own "risks and do-nots".
- Whether a share stub's subtitle should carry a full table path for every
  record rather than only for Other records. Decided *not* to do in B2 (the
  plan's own "B2 direction" section); it would cost a 1091-stub regeneration
  and its own contract commit. `tools/build-share-pages.js` and every
  `i/*.html` are confirmed untouched by this batch.

## Notes
- Mocks path: none - B2 changed text inside existing chips and an existing
  subtitle line; no new element, no layout change. Badges got shorter, so
  `audit2`'s 360 px chip-row ceiling can only improve; not re-measured this
  pass since no CSS or layout changed.
- The advisory parity check (`MSYS_NO_PATHCONV=1 node tests/parity.js
  "#/i/"`) listed in the plan's verification commands was **not run** this
  pass - `npm run check`, `check:built`, all golden shards, and the full
  browser suite were already green, and the advisory check is explicitly
  informational (CI is the parity baseline, not this host, per
  `docs/parity.md`). If a reviewer wants that reading before merge-adjacent
  sign-off, it can be run standalone; nothing in this batch depends on it.
- Cleanup performed / retained artifacts: nothing written outside
  `issues/56-followup/plan.md` (untouched this pass) and this file. Retained
  untouched: `issues/tg-preview-refresh/` (another task's untracked files).
- Session end partial progress: none - B2 is fully committed and pushed; the
  working tree is clean apart from `issues/tg-preview-refresh/`.
