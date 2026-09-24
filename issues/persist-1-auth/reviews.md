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
