# Review - plan before B1 (debt-cleanup)

Verdict: fix-then-continue
Reviewed: 35f1ff6af969bd691dbf6d4185ff4882daf3c423
Scope: plan before B1

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

Read: `CLAUDE.md`; `issues/debt-cleanup/context.md` (K1-K15), `plan.md` (Status, 2-10, 7.1,
7.2-7.5), `handoff.md` against `.claude/templates/handoff.template.md` (every section present);
`docs/specs/DEBT.md` (D61, D68, D81, D83, D84, D86, D87, D88, D90, D97, D98), `STATE.md` ("Two
tabs", "Account preferences", the settings keys), `FEATURES.md` ("Account and browser lists");
the code B1 touches: `ports/supabase.ts`, `ports/fake-cloud.ts`, `state/homebrew.svelte.ts`,
`state/cloudLists.svelte.ts`, `state/ownerRequests.svelte.ts`, `state/app.svelte.ts`,
`tests/db/run.mjs`, `tests/db/roles.mjs`, `tests/db/delete-account.test.mjs`,
`tools/supabase/lib.mjs`, `tools/supabase/restore.mjs`, `node_modules/supabase/dist/supabase.js`,
`tools/check/fast.mjs`, `tests/app/driver.js`, `tests/e2e/flows.mjs`, `vite.config.mts`,
`app/vitest-setup.ts`; the migrations for the revision triggers, the request writes, the
5000-entry bound, the limit defaults and the art triggers; the decision of 2026-09-26 "A request
the database fails three times is halved". Working tree clean at HEAD.

## Blockers

1. **D90: the planned fix does not end a hung reset on this host, and it covers one reset of
   three** (plan 3.6, 7.1 step 2, acceptance "D90").
   - `tests/db/run.mjs` runs the CLI as `process.execPath SUPABASE_CLI`, and
     `node_modules/supabase/dist/supabase.js` spawns the platform binary as its own child. The
     `spawnSync` `timeout` kills only the node wrapper. On Windows the kill is a
     `TerminateProcess` with no signal forward, so the Go binary stays alive and keeps resetting.
     A call with piped stdio also stays blocked until that grandchild closes the pipes, so the
     timeout does not return.
   - The suite resets in two more places with no timeout and with piped stdio:
     `resetLocal` in `tests/db/roles.mjs` (`reversibility.test.mjs`, `apply-pending.test.mjs`)
     and `resetLocal` in `tools/supabase/restore.mjs` (the restore drill tests).
   - `STACK_SERVICES = ['db', 'auth', 'realtime', 'kong']` drops `storage`. The current
     `run.mjs` checks `auth`, `realtime`, `storage` and `kong`. The comment on
     `LOCAL_STACK_EXCLUDES` says that Storage must run. The planned preflight passes a stack with
     no storage container, and that is the D90 hang shape.
   - The unit cases of `resetFailure` prove the classifier only, not that a hang ends.
   - Change: add a pure `supabaseBinary(platform, arch, resolve)` to `tools/supabase/lib.mjs`.
     It mirrors `dist/supabase.js`: `SUPABASE_CLI_BINARY_OVERRIDE`, else
     `@supabase/cli-<platform>-<arch>/bin/supabase[.exe]`. Add one reset helper that spawns
     the binary directly with `timeout: RESET_TIMEOUT_MS` (overridable by an environment
     variable for the proof). Use the helper at all three reset sites. Set
     `STACK_SERVICES = ['db', 'auth', 'realtime', 'storage', 'kong']`, and let `run.mjs`'s
     existing `complete` check read the same constant. Proof, in two parts:
     - A `node:test` case runs the helper on `process.execPath -e "setTimeout(() => {}, 60000)"`
       with piped stdio and a 1 s timeout. It expects `'timeout'` within 5 s.
     - On this host, run `npm run check:db` (PowerShell) with the override at 1000 ms. Record
       the FAIL line with the remedy and an empty `Get-Process supabase` result after it in the
       handoff.
   - Add both to the D90 acceptance line.

2. **D68: the planned fake answer is wrong** (plan 3.7). In `apply_list_writes`
   (`20261007130100_list_entry_gm_only.sql`), the 5000-entry check raises `22023` inside the
   per-op `begin ... exception when others` block. The database answers that one op as
   `{ ok: false, code: '22023', ... }`, rolls back that op's savepoint (no list is made for a
   `create`) and applies the other ops. The `refusalOf` function maps this answer to
   `{ ok: false, error: 'refused' }` for that op. A whole-call refusal applies only to more than
   200 writes. Change 3.7 and its acceptance line: the fake's `applyOne` answers
   `{ ok: false, error: 'refused' }` for a `create` or `add` of more than 5000 entries, makes
   no list for that op and applies the rest. `fake-cloud.test.ts` checks a two-op call with one
   5001-entry `create` and one good op.

3. **D86: the merge has an undefined branch and no partial-failure rule** (plan 3.4, 7.1 step
   11). `OwnerRequests.read()` has no overlap guard. `apply` and `decline` call `#decided`, which
   removes a request from `requests` while a read that sent its id in `held` is still in
   flight. That read then answers the id in `kept`, but the store has no object to merge it
   with. The plan does not say what happens. Change 3.4:
   - A kept id that the store no longer holds is dropped. It was decided in this tab, or a
     newer read removed it.
   - The read is all or nothing: a failed head page or a failed chunk answers `{ ok: false }`,
     and the store keeps what it shows.
   - The chunk reads are sequential.
   - Past `CHANGED_ROWS_MAX` new ids, the port falls back to today's whole read (the lists and
     D81 rule), so a tab that comes back after hours does not make 90 calls.
   - Add one `ownerRequests` test for each of the first two rules.

4. **D81: a locally written row keeps the client's clock forever** (plan 3.1, 7.1 step 10).
   `Homebrew` writes the revision that each write answers into its held row, with
   `created_at` and `updated_at` from `nowIso()`. The comment on `nowIso` says "A written row's
   time until the next read brings the database's own". With `known`, the next head finds the
   same revision, so the row stays in `kept` and the database's times never arrive. Sources and
   items sort by `created_at` (`byCreated`, `CardForm`, `HomebrewEditor`, `HomebrewSources`,
   `SourcePicker`, `lib/homebrew.ts`), so a source made in this tab can sort differently from
   another tab and from a reload. The lists store does not have this defect: `#read` holds only
   read revisions. So the sentence "the re-read pattern is R7g's" is not true for this store.
   Change 3.1: the store keeps a set of the row ids it wrote since its last applied read. These
   are the ok paths of create, update, `setArt` and the book writes. `known` leaves those ids
   out, so the next read fetches them whole. The set empties when a read applies. Add a
   `homebrew.test.ts` case: a create, then a kept re-read, gives the row the database's
   `created_at`.

5. **D83: the stop condition leaves a half-batch, and the halving contradicts a recorded
   decision** (plan 3.2, 7.1 step 15, "Stop condition").
   - If the delete fails at 4 s, the plan says "stop before the commit". At that point steps
     1-14 and 16-19 are not committed. This breaks `CLAUDE.md` ("leave code at a committed
     boundary (never a half-batch)"). Change: if the delete or the 150-list delete fails at 4 s,
     keep the cases as `todo` with the measured times. D83's account-delete half then stays in
     `DEBT.md` with the figures, and the timeout halving ships (it does not depend on the
     delete). Amend the commit on green gates and report the figures to the planner. A
     different change also works: move step 15 to step 1, before any production code. It costs
     one more `check:db` run.
   - `docs/decisions/2026-09-26-a-request-the-database-fails-three-times-is-halved.md` says that
     `57014` is a fault that is retried every 15 s and halved at the third counted fault. After
     B1 that text is false. Add to 7.1 step 19: an amendment line in that decision (a statement
     timeout of more than one op halves at once; a lone op keeps the counted path; the reason
     "the cancelled statement rolled back"). The new D83 decision file links to it.
     `FEATURES.md` "Account and browser lists" ("A send that the server fails three times in a
     row ...") gets the same exception.

## Risks

1. **K6: `'load'` makes some e2e checks vacuous, and the root cause is a guess** (plan 3.9,
   6). `tests/e2e/flows.mjs` has 10 `expectInPage` calls, and each checks once with no wait.
   Some are negative, for example F2 "there is a Disconnect, the only-method hint or an alert".
   With `networkidle0`, these calls ran after the page's requests had ended. With `'load'`, an
   alert that comes later goes past them. The plan's cause is also weak:
   - A 45 s poll cannot fill a 500 ms quiet window.
   - A Realtime socket is in flight only during its handshake.
   - Puppeteer's "Navigation timeout" names no pending request, so step one can name the call
     but not the cause.
   Recommended change: the e2e driver takes `waitUntil: 'networkidle2'`, not `'load'`. It keeps
   a settle point for the negative checks and allows two long-lived connections. Also, on a
   navigation timeout the e2e driver prints the URLs still in flight (from `request`,
   `requestfinished` and `requestfailed`), so that the next flake names its cause. Trade-off: a
   page with three or more connections that stay open still times out. Another change also
   works: keep `'load'`, and make each `expectInPage` that follows an `open()` wait for its
   positive condition first. Add the chosen option to 3.9 and section 10.
2. **D87 and D81: a revision guard does not fix the whole overlap.** When an older read answers
   last, the "keep the higher revision" rule protects the changed rows. But the older read still
   removes a row that a newer read created ("an id in neither is gone"), and it brings back a
   row that the newer read deleted. `Homebrew.read()` and `OwnerRequests.read()` can overlap
   too: the coalesced read, an import's read and a decision's read run concurrently. Today's
   whole read has the same defect, so this is not a regression. Recommended change: each of
   `CloudLists`, `Homebrew` and `OwnerRequests` numbers its reads, and drops an answer from a
   read that started before the last applied read. Keep the revision guard. This is one counter
   per store and one test per store. Trade-off: none known.
3. **D83: the fake cannot answer a timeout.** The existing fault tests use the fake's
   `setFault`. The plan adds `timeout: true` to the real port only. Section H asks for the fake
   on both adapters. Change: `setFault` takes an option that answers
   `{ ok: false, error: 'fault', timeout: true }`. The 7.1 step 13 cases run through the fake.
4. **D83: the 3x seed has no measured cost.** At 3x the seed is 150 lists of 300 entries and
   4500 pending requests of 300 lines. That is about 1.35 million request lines and 45 000
   entries, written through their triggers in one rolled-back transaction. `check:db` already
   takes 532-811 s. Step 15 must record the seed time beside the delete time, and the B1 gate
   cost must include it. If the seed takes minutes, seed the request lines with triggers that
   cannot fire (a direct `insert ... select` as the superuser), and write the reason in a
   comment.
5. **D90: the reset timeout is not measured against the current reset time.** The last
   recorded reset is 55-71 s (2026-09-27), and many migrations came after it. Change: the
   progress line before the reset prints its elapsed seconds when the reset ends. Step 2 records
   one figure and confirms that 300 s is at least three times that figure. Also, `resetFailure`
   gives `'timeout'` only for `error.code === 'ETIMEDOUT'`. A signal with no `ETIMEDOUT` (an
   interrupt) is `'failed'`, so the message does not say "did not finish in 5 minutes" for a
   Ctrl+C.

## Nits

1. `local` - 3.3 says "`#cardKeyFor` is unchanged (60 cards at 3x)". `homebrew_cards_per_owner`
   is 100, so 3x is 300 cards. The value 60 is the sources at 3x, and 4.1 item 1 already says
   300 cards. Give `#cardKeyFor` the same key set as `has` (one derived line), or state the
   figure correctly.
2. `local` - 3.8 makes `PREFS_KEY` conditional on a start read. The constructor reads it
   (`readLocalPrefs`), so it is in scope. `STATE.md` "Defaults and a page's pick" has a rule for
   an outside change of the default: the account's answer moves the default and keeps a page
   value. Use that rule. Do not use "as a reload does", because a reload drops the page value.
3. `local` - 3.1: build `known` inside the read loop, after the in-flight wait, so that a
   retried read sends the revisions held at that time.
4. `local` - 7.1 step 0 uses the grep `update public.homebrew_items` to show that no
   cross-table write skips the revision. That grep misses foreign-key actions. The proof is the
   `homebrew_{books,items,cards}_before_update` triggers, which add one to the revision on
   every update, foreign-key actions included. No migration disables them. Step 0 must check
   that the newest migration keeps them.
5. `local` - K12's remedy, "Run npm ci in the main checkout", sends an agent to a checkout that
   another session can use (`CLAUDE.md`, one session per working tree). Write
   `Run npm ci in <ROOT>.` In the same file, `SUPABASE_CLI` in `tools/supabase/lib.mjs` has the
   same worktree defect. If blocker 1's binary resolver does not remove it, name it in the
   handoff's Deferred.
6. `deferred-scope` (B5's expansion) - K2 lets the bulk strip act on the ticked rows that the
   filters draw. The bulk delete is the destructive path. B5's error-scenarios table must list
   a bulk delete and a bulk move with a ticked row that a filter hides. This is the search's
   existing rule, so no plan-review trigger fires, but the batch review must see the case.

## Deviations

- The handoff records none. The plan's own choices (section 10) are recorded defaults, not
  deviations. I accept them, with these exceptions: K6 (Risk 1) and the D90, D68, D86 and D81
  changes above.

## Standing checks

1. Scale: checked - the limit defaults (`20260930130000`, `20261001130000`, `20260928120000`,
   `20260925130000`, `20261014120100`) against 4.1 item 1 and 3.3. At 3x: 300 items, 300 cards,
   60 sources, 150 lists of 300 entries, and 4500 requests of 300 lines. The re-read heads fit
   one page under `READ_PAGE`, and 50 ids fit the request line. Findings: Nit 1 (the 60-card
   figure); Blocker 3 (no cap on new-request chunks); Risk 4 (the seed cost). No screen change,
   so no width or keyboard state applies.
2. Error scenarios: checked - the 4.1 table against the five stores and ports. A failed read,
   offline, another device's write and a row deleted between the two reads are answered. Not
   answered: a kept request that was decided during the read (Blocker 3); local write times
   that never become the database's (Blocker 4); an overlapping older read that removes a new
   row or brings back a deleted one (Risk 2); a hung reset on this host (Blocker 1). Retries:
   a halved resend cuts from `#queue` at send time, and a cancelled statement rolled back, so
   no resend writes from an old copy. No stored data is lost.
3. Consistency: checked - D61 against `STATE.md` "Account preferences" (Nit 2); D83 against
   the 2026-09-26 decision and `FEATURES.md` "Account and browser lists" (Blocker 5); the
   `check:db:` and `check:fast:` line shapes are kept.
4. RU/EN parity: not applicable - B1 adds and changes no user-visible string. D83 removes the
   «Не сохранено» state for a halving, and does not add a string. D90, D97 and K12 change only
   English tool output.

Owner rules: checked - the refresh before B1 (task-scoped; done 2026-10-15, Status); Q4 has
`STATE.md` as its home in B1 (7.1 step 19); Q2 goes to B2 and Q3 to B5; K1-K15 are each placed
(context table, plan 2.1); D90's README change is net zero (`.claude/README.md`, "Owner
insights", tooling row); B5's rule 19 fits the 20-rule budget of "Consistency rules". No
missing rule and no rule over budget.

## Suggested next action

The planner applies Blockers 1-5 and Risks 1-5 to `plan.md` sections 3.1, 3.2, 3.4, 3.6, 3.7,
3.9, 6, 7.1 (steps 0, 2, 10, 11, 13, 15, 19, the stop condition and the acceptance lines) and
section 10. The planner also applies Nits 1-5. The implementer then starts B1 with no second
plan look, after authoring-print-preview ships. Nit 6 goes to B5's expansion.

B4 and B5 need no plan review of their own. No trigger fires:
- B4 changes which record a print press resolves (D100), not the order, retries or shape of a
  write. Its NAME_FN change (D99) is in the harness.
- B5 has no migration, contract, stored shape or protocol change. Nit 6 is enough for K2's
  bulk strip.
B2 and B3 keep their plan reviews.

## Checks still needed

- `gh run view 38474328975 --attempt 1 --log-failed` (K6): the call that timed out. A
  read-only reviewer with no session token did not run it.
- The current `db reset --local` time on this host (Risk 5) and the 3x seed time (Risk 4).
- The D90 proof on this host (Blocker 1): the 1 s override run, and no `supabase` process
  after it.
- At dispatch, confirm that authoring-print-preview has shipped and that D82 is gone from
  `DEBT.md` (7.1 step 0). `origin/main` is still `e4f92f7c`, so it has not shipped yet.
