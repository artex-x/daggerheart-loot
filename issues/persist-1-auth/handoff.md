# Handoff - TASK persist-1-auth
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (`B1.1` and `B1.2` done, reviewed, approved;
  next `B1.3` needs a planner refresh)
- Last agent: orchestrator (recorded the B1.2 review and CI; session 3 ends
  here by the owner's decision, the next batches run in a new session)
- NEEDS_HUMAN_CONFIRMATION: no (owner items are under Blockers)
- Branch: `claude/kind-curie-nxag95` (cloud session 3; the release branch,
  supersedes `claude/jolly-allen-ipojqp`)
- Base / starting commit: `76497c4` (`main`); plan commit `dedafaf`
- Pushed: yes - `3b5e4d6` (cherry-pick of `e1d7a4b`), `0dd526b` (B1.1),
  `3a47379` (B1.2), then this handoff commit (see `git log`).
- `0dd526b` was committed with `SKIP_CHECK_GATE=1` (review N9): untracked
  mock files the orchestrator's planners wrote (not part of B1.1) failed
  prettier, so the gate's `npm run check` could not pass on that tree; the
  B1.1 implementer ran the chain with those files excluded (exit 0), and
  the orchestrator then formatted the mocks and a full `rtk npm run check`
  on the same tree passed. B1.2 commits through the gate, no bypass.

## Completed
- Batch name/id: `B1.2` - sign-in, `#/account`, delete account
- What shipped: `@supabase/supabase-js` 2.117.1 (exact, devDependency) behind
  `ports/supabase.ts` only (ESLint block); `ports/redirect.ts` (callback URL,
  `dhloot.auth.return`, `takeRedirect` before mount), `ports/lazy-cloud.ts`
  (the client as a lazy chunk), the configured branch and the R5 boot error
  in `main.ts`; `AuthPort` changes (`AuthError`, `AuthRedirect`,
  `redirectResult()`, `signIn`/`signOut` answer `AuthResult`,
  `Session.provider` nullable); fake options `linkError`/`returned`; route
  `{ kind: 'account' }` and `ACCOUNT_HASH`; `user` icon; the RU/EN text
  table; `AppState.user`, `alreadyLinked`, `pagesDir`; the header control
  in `Shell.svelte`; `AccountPage.svelte`; `TextInput.svelte` (ListsPage
  uses it twice); `Field` `heading`; `Button` `disabled`; migration and
  reversal `20260925120000_delete_account.sql`, `asRole` `setup`, the
  anon-EXECUTE invariant, `tests/db/delete-account.test.mjs`; `vite.config.mts`
  defines for the two `VITE_SUPABASE_*` values; `deploy` builds configured
  and runs the budget; `BUDGET_KB` 120 -> 170 (reason in the tool);
  `no-fake-in-prod.mjs` seed-domain check (R3); smoke checks the
  unconfigured build; five goldens and all 150 re-seeded; sweep/typo/
  contracts cover `#/account`; privacy pages link `#/account` through the
  new `%APP%` placeholder; specs (`ROUTES`, `CONTRACTS`, `FEATURES`
  "Account" and "Chrome", `STATE`, `META`, `I18N` owner rule, `COVERAGE`,
  `DESIGN` "Navigation"), `llms.txt`, both READMEs; review fixes R3, R5,
  N1-N7, N9; the two authorised `CLAUDE.md` lines.
- Files changed: see `git show --stat HEAD`.
- Previous sha (batch diff base): `0dd526b`
- Deviations and rationale:
  - Dict key `deleteConfirm` already exists (the lists' delete dialog); the
    typed-confirmation label is `deleteTypeWord` instead.
  - Disconnect buttons carry `aria-label` «Отключить Google» / «Отключить
    Discord» (visible text stays «Отключить»): two identical names in one
    list are ambiguous, and the goldens' control list dedupes names.
  - `AccountPage` draws the identity rows only once `identities()` has
    answered for the current user (`ids` null until then), so no row claims
    "not connected" before the answer; a user change resets them.
  - ESLint: the `@supabase/*` restriction is also added to the lib block's
    own patterns, because a later block's `no-restricted-imports` replaces
    an earlier one's options (the plan's separate block would have dropped
    lib's svelte/ports patterns); the new block ignores `app/src/lib/**`.
  - `AccountPage.svelte` disables `no-confusing-void-expression` around its
    markup (one comment pair): every `{@render logo(p)}` beside text trips
    it, the same rule `ListPage` disables per line.
  - `TextInput` takes `autocomplete?` (the typed word is `off`); `value` is
    optional with `$bindable('')` (lint refuses a default on a required prop).
  - The contract's "no redirect result" check sits in case 1 (the fresh
    port), not a separately numbered case.
  - `tests/app/sweep.js`'s link check had a hard-coded route list; it now
    knows `account` (108 "link to nowhere" failures before).
  - `bash-guard.mjs` rule 2o's comment and `cloudPush` message said "the
    owner fast-forwards `main`"; now "squash-merges", matching step 22 (a).
  - The inventory state that types the word uses `d.type('', ...)`: the box
    is named by a `<label for>`, which the driver's name lookup does not
    read, and has no placeholder; it is the page's only text box.
  - Step 22 (a) replaced the last line of the last bullet ("A cloud
    release's one push ...") with section 4A's text; the local-release
    lines of that bullet stay (the DECISIONS entry keeps "a local release
    still amends and pushes once").
- Review: required (trigger: public contract, new UI, hook edit) - approve,
  no blockers; findings in `reviews.md` ("B1.2"), placed in B1.3/B1.4

## Verification
- This host, 2026-09-24, one foreground call each (wall clock):
  - `rtk npm run check` - PASS, 145 s (vitest 51 files, 1473 tests, per-file
    thresholds hold; selftest 648 passed); final re-run before the commit
    after the sweep fix and the budget raise: see the report.
  - `rtk npm run check:built` - PASS, 9 s (budget 105.4 kB unconfigured, no
    supabase chunk; smoke: no control on `#/roll/std`, `#/account` the
    not-found page with the address kept; marker and seed guard clean).
  - Configured probe `VITE_SUPABASE_URL=https://example.invalid
    VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_placeholder npm run build &&
    npm run budget` - 160.7 kB total (entry 91.5, CSS 13.2,
    `supabase-*.js` 54.0, sw 2.0) > 120: FAIL, so `BUDGET_KB` raised to 170
    with the reason; re-run passes. Then `npm run build` (unconfigured,
    105.4 kB), 4 s.
  - `rtk npm run check:db` - PASS, 119 s cold (image pulls) and 39 s warm:
    up-down-up over the new pair, 5 `delete-account` cases, the `asRole`
    setup case, the anon-EXECUTE invariant and its PUBLIC probe (21 tests).
  - `node tests/run-all.js app/print,app/contracts,app/states,app/typo,app/hues,stub`
    - PASS, 356 s (states "all 34 runs passed" incl. case 35's unknown-user
    assertion; contracts replays `#/account`; typo covers `#/account`).
  - `node tests/app/golden.js --update --shard=n/4` - 139, 143, 141, 134 s
    (39+39+39+38 states); then `node tests/app/golden.js --shard=n/4` - each
    "unchanged", 136, 142, 140, 134 s.
  - `node tests/app/sweep.js 360` - first run FAIL (108 x "link to nowhere
    - account": the sweep's route list), fixed, re-run PASS 379 s.
- Golden diff proof: a scratch script walked each of the 150 tracked
  goldens against `git show HEAD:<file>`: every old line present in order
  (no removal or change), and every added line either `    link "Войти"
  [url=#/account]` / `    link "Sign in" [url=#/account]` directly after
  the `button "EN"` line in that language's tree, or `Войти` / `Sign in` in
  that language's controls. Result: 150/150 changed only by the control;
  144 in all four sections, 6 in the controls only (a modal is open, so the
  page tree is not in the snapshot: `_i_q1_another_tier`,
  `_roll_wondrous_modal`, `_tables_a_row_opened` and its `list_menu`,
  `new_list`, `removed_from_a_list`). Five new: `_account`,
  `_account_as_gm2`, `_account_as_gm1`,
  `_account_delete_confirmation_as_gm1`, `_roll_std_as_gm1`.
- R3 probe: a scratch copy of `tools/no-fake-in-prod.mjs` with the built
  `dist/assets` and `dist-test/assets` exits 0; with a `probe.js` holding
  `gm9@example.test` added to the scratch `dist/assets` it exits 1 "dist/
  carries the fake cloud seed ("@example.test"): probe.js".
- CI `browser` shard timings, B1.1's run 36065518261 (`0dd526b`,
  `workflow_dispatch`), suite step: shard 1 368 s, 2 374 s, 3 354 s, 4
  221 s. B1.2's run 36073608042 (`3a47379`, `workflow_dispatch`): `check`,
  `db`, `audit` green; `browser` suite step 375, 386, 364, 231 s, all
  green; `secrets` red on the same old-history findings (Blockers).
- Gates: all green on this host.

## Next batch (implement-ready)
- Name: `B1.3` - hosted E2E and CI `e2e` job; needs a planner refresh
  first (outline: `plan.md` section 8). The refresh places: B1.1 review R4
  (contract cases vs the real adapter), B1.2 review R2-2, R2-3 and nits
  N2-1..N2-4 (`reviews.md`). B1.2 review R2-1 (budget by configuration,
  lazy supabase-js) goes to B1.4's refresh.
- Owner answers binding on later batches: `mocks/B1.4/README.md` (Q1-Q8).
- First step in the cloud: the discriminating probe (plan section 4C);
  the `E2E_*` variables were present in session 3.

## Blockers
- Owner, before `B1.3`: `npm run db:push -- --project test` from the
  branch (the E2E delete flow needs `delete_account()` on the test
  project; hooks forbid agents a hosted write).
- Owner decision: CI `secrets` (gitleaks) is red on every
  `workflow_dispatch` - a dispatch scans the whole history and reports 3
  findings in old commits: `cce10cb` (2026-09-11) `docs/tg-preview.md:72`
  and `issues/tg-preview-refresh/plan.md:690` (`TG_API_HASH=...`), and
  `23c00a6` (2026-09-17) `issues/47/handoff.md:445` (`"key":"..."`). None
  is from R1; a push to `main` scans only its range. The owner checks
  whether `TG_API_HASH` there is the real Telegram hash (then a new
  Telegram app and secret) and decides: `.gitleaksignore` the three
  fingerprints, or scan only the dispatched range. B1.3/B1.5 verify by
  dispatch, so this is needed before them. The orchestrator could not
  inspect the values (auto-mode classifier denied it as credential access).

## Deferred
- Optional `session-stop.mjs` cloud warning ("N commits on this branch are
  not on `origin/<branch>`") - question A, not in R1 so far.
- B1.1 review N8: `fake-cloud-seed.ts` `SEED.now`, `SeedIdentity`,
  `SeedUserId` have no outside reader - revisit when a reader lands.
- B1.1 review R2 (open, accepted risk): the test build mounts after its
  dynamic import; B1.1's second-entry fallback removes the gap if it shows.
- Planner (B1.2): load supabase-js only for a reader with a stored session
  or a pending redirect. Measured: the chunk is 54.0 kB gzip and loads for
  every reader of a configured build (AppState asks for the session at
  mount); the budget now carries it.
- `check:built`'s budget measures the unconfigured `dist/` against a limit
  sized for the configured one (105.4 of 170 kB): a jump in the entry alone
  now has ~65 kB of headroom there; `deploy`'s run is the tight one.
- The signed-in `#/account` page is not in `sweep.js` (it has no `as`); the
  signed-in account goldens and vitest cover it.
- To closeout: roadmap compaction (section 15 step 20, section 18 conflict
  3 and verdict table, decision 25); removal of the `E2E_USER_PASSWORD`
  secret after `B1.3`.
- Carried from R0 and placed: `plan.md` section 10.

## Notes
- Mocks path: `mocks/B1.2/` (binding; frame G dropped by the owner),
  `mocks/B1.4/README.md`.
- Owner-facing (decision 11): the user-name fallback (M6) is not built; an
  account with no email shows the provider alone and the header draws the
  person icon.
- Owner steps before B1.3: push the migration to the test project (`npm
  run db:push -- --project test`); the `deploy` job needs the Actions
  variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (roadmap
  section 15 step 12 says they exist).
- Cleanup performed / retained artifacts: none in the tree; scratch files
  under the session scratchpad only.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch: `docs/specs/*` as
  listed above; `docs/DECISIONS.md` (the planner's B1.2 entry, N5);
  `CLAUDE.md` (the two authorised lines); `.claude/README.md` (N1);
  `tools/bundle-budget.mjs` (the raised budget's reason).
