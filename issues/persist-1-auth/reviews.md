# Review register - TASK persist-1-auth

Findings persisted when each review lands. Open rows go to `docs/specs/DEBT.md`
or are named to the human at closeout.

## B1.1 (`0dd526b`) - verdict: approve, no blockers (2026-09-24)

| Id | Kind | Finding | Placed |
|---|---|---|---|
| R1 | risk, human | `CLAUDE.md:124` says browser suites run "after `npm run build`"; they now need `npm run build:test` (or `check:built`). Ask with question A's bullet. | human - authorised; done in B1.2 (step 22 b) |
| R2 | risk | Test build mounts after the dynamic import (maybe after `load`); prod mounts synchronously. Plan's fallback (second entry, static import) removes the gap if it ever shows. | open |
| R3 | risk | Marker lives only in `installFakeCloud`; hardening: `no-fake-in-prod.mjs` also fails `dist/` on a seed string such as `@example.test`. | B1.2 - done |
| R4 | risk | Contract cases 2 (signIn fires onChange once), 7 (gm2 one identity), 8 (delete) assume the fake; the real adapter needs a case selection. | B1.3 planner |
| R5 | risk | Unknown `?as=` surfaces as an unhandled rejection and a 30 s `ready()` timeout, no named message. | B1.2 - done |
| R6 | risk | Deploy's own `dist/` is not scanned; the same command is proven in `check`. Acceptable. | accepted |
| N1 | nit | Now-false `dist/` statements: `tests/app/contracts.js:1`, `tests/app/print.js:1`, COVERAGE app/states case 29 row, COVERAGE "each serves `dist/` on its own port", `.claude/README.md` Hooks edit-guard row (add `dist-test/`), `.claude/README.md` "rebuild ... before any `dist/`-driven suite" (name `build:test`). History lines stay. | B1.2 - done |
| N2 | nit | COVERAGE "Test layers": `main.ts` mounts with `{ ...browserEnv(), cloud }`, not "hands its CloudPort to browserEnv". | B1.2 - done |
| N3 | nit | `tests/app/lib.js` exports `serveDist` and `DIST_HTML` with no user; drop both. | B1.2 - done |
| N4 | nit | `tests/app/golden.js` comment near line 244 past the file's width; reflow. | B1.2 - done |
| N5 | nit | `docs/DECISIONS.md` question C entry: restore the probe's Puppeteer-page half and the two rejections (`signInWithPassword`; CI-side session mint). | B1.2 - done |
| N6 | nit | `bash-guard.mjs` `rm -r` exemption lists `dist` but not `dist-test` (hook + selftest case). | B1.2 - done |
| N7 | nit | `app/states` result line "all 34 cases passed" could say "runs". Optional. | B1.2 - done |
| N8 | nit | `fake-cloud-seed.ts` `SEED.now`, `SeedIdentity`, `SeedUserId` have no outside reader. | Deferred (when a reader lands) |
| N9 | nit | Handoff: record `SKIP_CHECK_GATE=1` on `0dd526b` and why; "Pushed: yes at `0dd526b`"; replace the stale-comments Deferred bullet with N1. | B1.2 - done |

CI on `claude/kind-curie-nxag95` at `0dd526b` (run 36065518261,
`workflow_dispatch`): `check` (Test build + marker guard), `db`, `audit` and
all four `browser` shards on `build:test` green; `secrets` red - gitleaks
scans the whole history on a dispatch and reports 3 findings in old commits
(e.g. `cce10cb`, 2026-09-11, `issues/tg-preview-refresh/plan.md`), none from
R1. Named to the orchestrator in B1.2's handoff.

## B1.2 (`3a47379`) - verdict: approve, no blockers (2026-09-24)

Reviewer verified: golden diff (150 files, 0 removed lines, only the
control's four lines added); `check:built` PASS; supabase chunk is a dynamic
chunk only (no `modulepreload`); return record and callback cleanup allow no
open redirect; a forged `?code=` fails PKCE (verifier missing); migration is
`security definer`, `search_path = public, pg_temp`, revoked from
`public, anon`, reversal drops it; contract files updated; B1.1 rows placed in
B1.2 all done; every implementer deviation accepted. Budget 170 kB accepted
for R1 (META sets no first-load limit; raise reasoned in the tool).

| Id | Kind | Finding | Placed |
|---|---|---|---|
| R2-1 | risk | `tools/bundle-budget.mjs` `BUDGET_KB = 170` also applies to the unconfigured `dist/` (105.4 kB; headroom 65 kB), and the configured build is measured only in `deploy`, after merge. Patch: limit by content, e.g. 170 when `dist/` holds a `supabase-*.js` chunk, else 120, and print which applied. Together with the Deferred "load supabase-js only with a stored session or a pending redirect". | B1.4 |
| R2-2 | risk | auth-js `signInWithOAuth`/`linkIdentity` resolve right after `location.assign`, so `AccountPage.svelte` `act()` clears `going`/`busy` and `leave()` bumps `reread` while the page unloads: the "Redirecting" state only flashes (FEATURES "Account" says it stays). Fix: keep `going`/`busy` on a successful start, clear on `pageshow` with `persisted`; or reword FEATURES. | B1.3 |
| R2-3 | risk | `app/src/ports/supabase.ts` `identities()` maps a failure to `[]` (`?? []`): the page then offers Connect for the provider the user is signed in with. | B1.3 |
| R2-4 | risk, owner | `accountSub` «Способы входа, выход и ваши данные.» while R1 draws no data section - by the owner's general-wording rule. | noted to owner |
| N2-1 | nit | `docs/specs/STATE.md` supabase keys row: supabase-js 2.117.1 also writes `sb-<ref>-auth-token-flow-<id>-code-verifier` and `...-flows-code-verifier` (ring of 5); they stay after the redirect until sign-out. | B1.3 |
| N2-2 | nit | `tests/app/inventory.js` delete-confirmation state `why`: the English half keeps the Russian word, so its final button stays disabled - say so. | B1.3 |
| N2-3 | nit | handoff Verification "final re-run ... see the report": record the last `rtk npm run check` result and wall clock. | B1.3 |
| N2-4 | nit | `AccountPage.svelte` literal `font-size: 15.5px` where `--step-0` exists (`ListsPage` has the same literal). Optional. | B1.3 |
| N2-5 | nit | Header `aria-label` would read «Аккаунт: » for an account with no email - unreachable per decision 11. | Deferred |

CI on `3a47379` (run 36073608042, `workflow_dispatch`): `check` (incl. budget,
Test build, marker guard), `db`, `audit`, `browser` 1-4 green (suite step
375, 386, 364, 231 s); `secrets` red - the same 3 old-history gitleaks
findings as run 36065518261, none from R1 (owner decision pending).
