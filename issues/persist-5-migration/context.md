# Shared task context - TASK persist-5-migration

## Goal
Release R5: move browser (local) lists into the account, the legacy write
cutoff `LEGACY_WRITE_UNTIL` = Monday 2026-10-26, the date-gated `#/l/`
retirement and its announcement, and the end of the local write path with
the two-tab merge after the date. Batches `B5.1` (schema and RPC) and
`B5.2` (the app); `plan.md` is the authority.

Planned 2026-09-26 in a worktree while R2's last batch (`B2.3`) was still
being built; `plan.md` section 13 lists what a short refresh re-reads after
R2 closes.

## Sources (read, do not re-fetch)
- Roadmap `issues/persistent-storage/plan.md`: section 9 (release order:
  R2, R5, R3, R4), section 10 (the cutoff), section 12 (`B5.1`/`B5.2`
  rows), section 14 (the outline), section 16 (decisions 2, 6, 11, 12, 31),
  section 17.
- R2's task `issues/persist-2-lists/`: `context.md` (every owner answer of
  2026-09-25), `plan.md` sections 4, 11, 15 (what R2 took from `B5.1`: the
  restore-from-link field, the install guide iOS paragraph - both done),
  `handoff.md` (Deferred: `legacy_fingerprint`, question f).
- `docs/decisions/`: "`LEGACY_WRITE_UNTIL` is 2026-10-26 ..." (2026-09-25),
  "The `#/l/` link decoder retires at the legacy write cutoff" (2026-09-24),
  "The restore-from-link field leaves the lists index ..." (2026-09-25),
  "A sign-in prompt opens the account page ..." (2026-09-25), "Account
  list writes are optimistic ..." (2026-09-25), "Count limits are rows read
  by `effective_limit()` ..." (2026-09-25), "The browser suites drive a
  test build ..." (2026-09-24), and this pass's three (2026-09-26).

## Owner decisions already made (2026-09-25)
- The cutoff is 2026-10-26. R5 moves directly after R2. If R5 is not live
  on production by 2026-10-12, the date moves later.
- The device check: the owner migrates their own lists on production as
  the first user right after R5 deploys; a defect found then moves the
  date. An R5 closeout step, not a merge gate.
- R2 offers no early move of local lists. Old `#/l/` "Save" saves into the
  account (R2).
- Decision 31 (roadmap section 16): the move is exempt from the count
  limits; afterwards the user cannot add past a limit.
- B2.3 (in flight): one "Share" button opens a panel with player and GM
  rows; the rotate button was dropped later (delete, then create); the
  `#/l/` announcement with the date on the old shared page, in `llms.txt`
  and `CONTRACTS.md` section 3.

## Owner answers 2026-09-26 (`issues/persistent-storage/context.md`, "Owner answers for R5 and R7")
- The move is automatic, no press: on sign-in the browser lists move on the
  reader's behalf. Two guards for a shared computer: a one-time notice
  naming the moved lists; the move runs only for the first account that
  signs in on that browser (the account id is recorded with the tombstones;
  another account sees no move and no already-moved list).
- After the cutoff a browser list may still be deleted (confirm); a moved
  list leaves the browser by itself and is never duplicated.
- The header's account control opens a menu: «Настройки отображения», «Мои
  списки», «Мои предметы» (R7), «Выйти». The Lists tab leaves the bar at the
  cutoff; until then it stays. «Настройки отображения» supersedes the
  roadmap's "not in v1: a preferences page": the smallest form over the
  existing `user_prefs` settings (`plan.md` section 4.9).
- Applied in planning pass 2; the menu is `B5.3`, recommended as release
  R5b right after R5 (`plan.md` section 12).

## Key paths (planner, 2026-09-26)
- Specs: `docs/specs/FEATURES.md` "Lists" and "Account lists", `STATE.md`
  ("localStorage keys", "Two tabs"), `ROUTES.md` ("Records, lists and
  print"), `META.md` section 3, `CONTRACTS.md` section 3, `COVERAGE.md`
  ("Test layers", "Features to suites"), `I18N.md` ("Rules").
- Code hot paths: `app/src/state/lists.svelte.ts` (`ListStore`: `save` is
  the merge, `#deleted`, `#readCurrent`, `watch`), `state/cloudLists.svelte.ts`,
  `state/app.svelte.ts` (`#expand`, `#runPending`, `syncListUrl`,
  `newListTarget`), `lib/cloudLists.ts` (`toCloudList`, `clip`,
  `quantityOf`, `priceOf`), `lib/lists.ts`, `lib/hash.ts`, `lib/listLink.ts`
  (`QTY_MAX`, the FNV-1a `stamp`), `ports/types.ts`, `supabase.ts`
  (`writeOf`, `LIST_SELECT`), `lazy-cloud.ts`, `fake-cloud.ts`,
  `fake-cloud-seed.ts`, `cloud.contract.ts` (cases A-G),
  `components/ListsPage.svelte`, `ListPage.svelte` (`own`, `isCloud`,
  `scheduleUrlSync`, the actions row, the notice slot, the batch bar),
  `SharedListPage.svelte`, `StorageNotice.svelte`, `AddToList.svelte`,
  `main.ts` (the fake branch reads `?as=`), `ports/index.ts` (`browserEnv`,
  `fakeEnv`); `supabase/migrations/20260925130100_lists.sql` (the limit
  triggers), `tests/db/lists.test.mjs`, `limits.test.mjs`, `roles.mjs`;
  `tests/app/driver.js`, `golden.js`, `golden.test.mjs`, `inventory.js`,
  `states.js` (42 cases), `tests/e2e/flows.mjs` (F0-F7), `admin.mjs`,
  `contract.mjs`; `tests/derived.js` (`COUNT_BEARING_FILES`, the decisions
  registry); `tools/decisions.js`.
- Mocks: `mocks/b52-move-notice.html`, `b52-read-only-list.html`,
  `b52-retired-link.html`, `b53-account-menu.html` on `mocks/mock.css`.
- The header control today: `Shell.svelte` `a.acct` (`aria-label` «Аккаунт:
  <email>`»), `TabBar.svelte` `TABS` (ten); `AccountPage.svelte`
  `signOut(scope)` inside a `busy` wrapper; `AddToList.svelte`'s `.dropmenu`
  holds the outside-click and Escape pattern; F2 (E2E) and `shell.test.ts`
  read the control as a link.

## Facts settled by the planner (2026-09-26, HEAD `da7378cb`)
- `restore-from-link` and the install guide's iOS link paragraph are gone
  since `B2.2`; R5 owes neither.
- `lists.legacy_fingerprint` does not exist yet; the four R2 migrations
  are `20260925130000` to `130300`; `lists_limit` and `list_entries_limit`
  are after-insert triggers calling `effective_limit()`; every function is
  `create function` (never `or replace`), so a changed trigger body is
  drop-and-create.
- PostgreSQL 17: `sha256()` is core; the RPC hashes the canonical text.
- `tests/app/lib.js` serves `dist-test/` at `http://127.0.0.1:<port>/`;
  jsdom (vitest) has no `crypto.subtle`: the fake never hashes.
- The test build reads `?as=` once at boot (`installFakeCloud`); a
  `?today=` switch beside it is the harness for the date; the default is
  pinned before the cutoff (decision, 2026-09-26).
- `Env` has no clock; `AppState` reads `Date.now()` for "edited N ago" only.
- `DEBT.md` holds D24 only; R2's `reviews.md` D1-D5 are routed at R2's
  closeout (read them in the refresh).
- Decision files dated 2026-09-26 or later are "native" for
  `tools/decisions.js`: a title of 80 characters or less, a body of 15
  non-blank lines or less, a status line first.

## Command costs (from `issues/persist-2-lists/context.md`, re-measured 2026-09-25)

| Command | Wall clock | Fits one call? |
|---|---|---|
| `npm run check` | 348 s | yes; past 600 s on a loaded host |
| `npm run check:built` | 19 s plus its builds | yes |
| `node tests/run-all.js app/states` | 197 s | yes |
| `node tests/run-all.js app/states,app/contracts` | about 8 min | yes |
| `node tests/app/sweep.js <width>` | 320-590 s per width | one width per call |
| `node tests/app/golden.js --shard=n/4` | 100-290 s per shard | one shard per call |
| `npm run check:db` | 3-5 min warm | PowerShell tool |
| `npm run e2e` | 50 s | yes |

## Constraints
- Public contracts default to no change; R5 changes none (`plan.md` section 5).
- One commit per task, amended per batch, pushed once at closeout; the
  planning commit of this worktree is separate and is never pushed.
- Do not run the local Supabase stack, `check:db`, e2e or anything against
  the test project or production from this worktree (the planning session's
  rule); `B5.1` runs `check:db` on `main`.
- Secrets never enter the repo, a `VITE_*` other than the publishable key,
  a task doc, or chat.

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
- You suspect drift vs issue or plan
