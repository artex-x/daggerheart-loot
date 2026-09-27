# Review - plan before B3.1, second look (persist-3-realtime)

Verdict: approve
Reviewed: 2205e7a3603119122c2e3720c48c5f9539244740
Scope: plan before B3.1

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

The plan resolves every finding of `reviews/plan-B3.1.md` that the register marks fixed. `B3.0` is sound, and it is ordered correctly before `B3.1`'s test push. Two local nits remain. Neither blocks the implementer.

## Blockers

None.

## Risks

- R7 (new): other open branches. A branch cut from `main` before `B3.0` still carries the strict case G. After `B3.1`'s test push, such a branch fails its `e2e` until it rebases onto `B3.0`.
  - The serial order covers `display-settings`.
  - Any other branch that runs `e2e` in the window (for example an R4 worktree that reaches implementation) needs `B3.0` in its base first.
  - A one-line note in section 15 or 10.0 is enough.
- The plan commit (`2205e7a3`) lives on a worktree branch. It reaches `main` before or with `B3.0` (cherry-pick). `B3.0`'s commit edits `handoff.md`, which must already exist on `main`. The handoff does not state this order. The orchestrator owns it.

Findings of the first review, checked against `2205e7a3`:

| Id | Status | Where it is fixed |
|---|---|---|
| B1 | resolved | Section 10.0 `B3.0`: the owner's choice and the window are named, the freeze is rejected with a reason. The acceptance has a `merge-base --is-ancestor` check before the test push. Verification step 4 repeats that check. |
| B2 | resolved | Section 5.4 and step 2: `nullif(..., '')`, a guarded `jsonb` parse, and one warning wrapper after the mark, also in `list_shares_gone()`. Step 7 adds the same-connection `''` case. A new acceptance line covers it. Section 5.3 is reworded. |
| R1 | resolved | Step 1 fallback (a): one restart helper that all three reset sites call (`roles.mjs`, `run.mjs`, `restore.mjs`, whose `resetLocal` the restore tests and scripts use). The fallback re-measures and raises `timeout-minutes` above 15 minutes. |
| R2 | resolved | Step 1 (a3): apply and drop the policy through a plain `postgres` connection. A failure of (a3) is a stop. |
| R3 | resolved | (b) asks for an HS256 `JWT_SECRET`. The `gotrue` fallback covers (b). `jwtFor` sets `role`, `sub`, `aud` and `exp`. |
| R4 | resolved | Section 15 has the full `display-settings` list, the shared files per batch, and the serial order as the stated mitigation. The vacuous acceptance line is replaced. |
| R5 | deferred, placed | Section 11, "For the `B3.2` refresh to decide", and the handoff's Deferred. |
| R6 | resolved | Section 14 names CI's 20-minute limit and the fallback's raise. |
| N1 | resolved | Step 10: `[a, c]` reads back `a, c, b`. The order before the call is `c, a, b`, so a reorder that does nothing fails the case. |
| N2 | resolved | Step 2: `coalesce(new.owner_id, old.owner_id)`, with the reason. |
| N3 | resolved | File table: the `DEBT.md` intro names D57 and D59 only. |
| N4 | resolved | `B3.1` step 10 retitles the test. The `#send` comment is placed on `B3.2` ("Carried from `B3.1`"). |
| N5 | resolved | Step 11 adds the Q2 and Q3 decision files, each with `Amends` and the `Amended by` line. The handoff counts four decision files. |
| N6 | resolved | The owner-topic file is dated 2026-09-26. |
| N7 | resolved | Step 8: `EB` keeps its position in B's list. |
| N8 | resolved | Step 1 (c): a Node `postgres` script or `docker exec supabase_db_<id> psql -U postgres`. |
| N9 | resolved | Handoff Status reads `blocked`. |

The `B3.0` section, checked:
- The change is correct under both rules. On the real adapter, `apply_list_writes`'s `add` uses `on conflict (id) do nothing`, so the `unique (list_id, item_key)` violation raises `23505`, which `writeOf` maps to `refused`. The fake's `insertEntries` refuses a duplicate `item_key`. The rename after it still answers `ok`.
- The gates are sufficient: `rtk npm run check` (the contract over the fake) and `npm run e2e` against the current strict test project. No `check:db` (nothing under `supabase/` or `tests/db/`) and no `check:built` (nothing drawn). Rule 2r does not apply (no migration).
- Review "not required" is consistent with `orchestrate.prompt.md`, "When to run reviewer". `cloud.contract.ts` is a test contract, not a public contract (`CONTRACTS.md`, `docs/fixtures/`, `tests/contracts.js`, `llms.txt`).
- The commit and push model follows `CLAUDE.md`: the owner decided the push before closeout, and it costs one more commit. `B3.1` makes a new commit. `B3.2` and the closeout amend it. The closeout pushes once.
- The ordering against `B3.1`'s test push is enforced in three places: the `B3.1` acceptance line, verification step 4, and the handoff's verification commands.
- The split criterion is named (a commit the harness cannot reach otherwise), and the gate cost (about 15 minutes) is in the total.

## Nits

- N10 (`local`): section 10.0, "**Files.**", says "`app/src/ports/cloud.contract.ts` only". Step 3 and section 15 also edit `docs/specs/COVERAGE.md` (line 214, "a `reorder` that misses an entry refused"). Add it to the files line.
- N11 (`local`): `B3.0` keeps `fake-cloud.test.ts`'s title "... and a reorder that misses an entry". That is still true while the fake is strict, and `B3.1` step 10 retitles it. No action in `B3.0`. It is recorded here so that nobody moves the retitle into `B3.0`.

## Deviations

- `B3.0`, a pushed precursor commit before closeout. Accepted: the owner decided it on 2026-09-27 (`context.md`, "Settled after the plan review"). It costs one more commit, as `CLAUDE.md` states.
- The deviations of the first review stand as accepted (the four `app/` files in `B3.1`, and the `FEATURES.md` shared-page text on `B3.2`).

## Suggested next action

1. Optional: fix N10 and add R7's one-line note. Both are cheap and can ride the `B3.0` handoff edit.
2. Once `display-settings` has shipped, get the plan commit onto `main`.
3. Dispatch the implementer for `B3.0`, then `B3.1` from `main` with `B3.0` in its base.

## Checks still needed

- `B3.0`: `rtk npm run check` and `npm run e2e` green, and the commit on `origin/main` before `B3.1`'s test push.
- `B3.1`: the step 1 spike results (a), (a2), (a3), (b) and (c) in the handoff before step 2. Then the batch review. Then the test push and `npm run e2e`.
