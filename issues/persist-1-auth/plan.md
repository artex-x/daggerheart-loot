# Plan - TASK persist-1-auth (release R1 of the persistence programme)

## Status

- Planning pass 1, 2026-09-24, planner (mode A); the programme design is
  `issues/persistent-storage/plan.md` (the roadmap) and is not repeated here.
- NEEDS_HUMAN_CONFIRMATION: no - the human confirmed section 4's proposals
  A, B and C as written (2026-09-24, cloud session 2).
- Release branch: `claude/kind-curie-nxag95` (cloud session 3; supersedes
  `claude/jolly-allen-ipojqp`). One commit per batch, pushed after each
  green commit (question A).
- `B1.1`: done 2026-09-24 in cloud session 3 (`0dd526b`, pushed), all gates
  green; review: approve, no blockers (findings `reviews.md`, placed in
  section 7's acceptance lines). Its one open line, the `CLAUDE.md` bullet of
  question A, moves to `B1.2`: the human authorised both `CLAUDE.md` edits in
  chat on 2026-09-24.
- Planning pass 2, 2026-09-24, planner (mode B): `B1.2` refreshed to
  implement-ready (section 7) on B1.1 as built and the owner's mock answers
  (`mocks/B1.2/README.md`, "Owner answer"). Sections renumbered: the later
  outlines are section 8, owner steps 9, risks 10.
- `B1.2`: done 2026-09-24 in cloud session 3 (one new commit on `0dd526b`,
  pushed), all gates green; review pending (trigger: public contract, new
  UI, hook edit). Deviations: `handoff.md`, "Completed".
- Next batch: `B1.3` - needs planner refresh (outline in section 8).

## 1. Objective and current state

R1 ships accounts: the deterministic fake cloud and the test build (layer
2), Google/Discord sign-in through Supabase Auth, `#/account` with provider
linking, "Sign out everywhere" and delete account, the hosted E2E (layer 4)
and the CI `e2e` job, account preferences (`user_prefs`), the nightly
backup workflow (roadmap decision 39) and automatic migration deploys from
CI (decision 41). Roadmap sections that bind this release: 5, 8, 12, 14, 15,
16 (decisions 14-15, 20-23, 28-31, 39-41), 17 ("Carried from R0"), 18.

State at HEAD `76497c4`: R0 is live (HTTP-only ES-module build, worker with
picture and asset caches, policy pages, `supabase/config.toml` as code,
`check:db` harness with no migration yet, cloud tooling). No `@supabase/*`
dependency, no `CloudPort`, no `dist-test/`. `tests/app/lib.js` serves
`dist/` on a free port; every browser suite drives it through
`tests/app/driver.js`. `tests/app/inventory.js` holds 150 golden states.
Cloud host facts and the step 20 results: `context.md`.

## 2. Scope and non-goals

In R1: everything in section 1. Out of R1: cloud lists and share links
(R2), Realtime (R3), purchase requests (R4), migration and the cutoff (R5),
import/export (R6), homebrew (R7-R9), legacy removal (R10). No mockup is
needed for `B1.1` (no UI); `B1.2` and `B1.4` produce theirs in their own
refresh (roadmap section 12, last paragraph).

## 3. Design for R1 - what this refresh settles beyond the roadmap

Each item is a planner decision from the repository's own rules; none
reopens an owner decision.

1. **`CloudPort` grows per release; R1's shape is `{ auth: AuthPort }`.**
   The roadmap names six members (`auth`, `prefs`, `lists`, `homebrew`,
   `media`, `events`). `CLAUDE.md` forbids an export before something uses
   it, and the roadmap itself grows the seed per release (`B2.1` "seed gains
   lists and shares", `B7.1` "seed gains homebrew"). So `B1.1` defines
   `AuthPort` and `CloudPort = { auth }`; `B1.4` adds `prefs`; R2 adds
   `lists` and so on. The types live in `app/src/ports/types.ts` (the ports'
   one types file, already excluded from coverage), not a new `cloud.ts`.
2. **Port results, not thrown errors.** `link`, `unlink` and
   `deleteAccount` resolve to `AuthResult = { ok: true } | { ok: false;
   error: 'alreadyLinked' | 'lastIdentity' | 'failed' }`, the way
   `ClipboardPort` and `SharePort` answer failure; `B1.2` maps Supabase's
   `identity_already_exists` to `alreadyLinked` and everything else to
   `failed`.
3. **The contract test takes a factory and an assert.**
   `runCloudContract(make: (as?: string) => Promise<CloudPort>, seed,
   assert)` so vitest (`expect`) and, in `B1.3`, a Node script against the
   real adapter both run it; the E2E's `make(as)` mints a session for the
   test user. R1's contract covers auth only; each later release appends
   its own cases in the batch that adds the port member.
4. **The test build is selected by `command === 'build' && mode ===
   'test'`.** Vitest's own default mode is also `test`, so gating on
   `mode` alone would flip the outDir and the define under `npm run test`.
   `import.meta.env.VITE_CLOUD_FAKE` is set through `define` (a committed
   `app/.env.test` is impossible: `.gitignore`'s `.env.*` rule).
5. **No top-level `await` in `main.ts`.** The production boot stays
   synchronous as today; the test build boots inside
   `import('./ports/fake-cloud.js').then(...)`. Rollup drops the branch and
   its chunk from `dist/`; `tools/no-fake-in-prod.mjs` proves it.
6. **`?as=` stays in the URL.** `installFakeCloud` reads `location.search`
   once and does not strip it, so a case that reloads (states case 28) keeps
   its session. Consequence, recorded in `COVERAGE.md`: `hashRouter.base()`
   is `href` up to `#` minus a trailing `index.html`, so on a signed-in page
   every link the app writes from `base()` carries `index.html?as=<user>`.
   Deterministic, so a golden may hold it; `base()` is not changed (a
   production behaviour, `?utm`-style params propagate today too).
7. **The fake's hook is `window.__dhlootFake`, the port itself** (test
   build only, the module `dist/` never holds). `B1.1`'s browser proof reads
   `__dhlootFake.auth.session()` signed out and as `gm1`. R3 adds `emit` to
   the same object.
8. **`serveDist` moves to `tests/app/serve.js`** with `serveDist(dir)` and
   `assertBuilt(dir)`: its second caller is `tools/smoke-http.mjs`, which
   keeps driving `dist/` while `lib.js` drives `dist-test/` - one module
   cannot guard both directories at require time.
9. **An unknown `?as=` user throws at boot** (the page never mounts, the
   driver's `ready()` fails loudly) - a typo must not pass as signed out.
10. **Golden naming:** a state that signs in carries `as: '<user>'` and an
    id ending ` as <user>`; `golden.js` writes `# as: <user>` into the
    header only when set, so the 150 existing goldens stay byte-identical.
    `golden.test.mjs` pins the id convention both ways.
11. **R1's fifth batch, `B1.5`, carries decisions 39 and 41** (`backup.yml`,
    CI migration deploys to test then prod around `e2e`, the applied-set
    redesign of `edit-guard.mjs`). Split from `B1.4` at "a review that
    cannot be held in one pass": a deploy pipeline holding the one
    production credential and a hook edit are judged against roadmap
    section 7 and `docs/DECISIONS.md`; `B1.4` is product UI and a schema
    row judged against `STATE.md`/`FEATURES.md`.

## 4. Questions A-C - confirmed by the human 2026-09-24 as proposed

### A. Push policy for a release longer than one cloud session

Facts (`.claude/README.md`, "Cloud sessions"; `context.md` gap 4): the
container is reclaimed after idle time and unpushed work is lost; the
session may push only its own branch; `CLAUDE.md` says "push once, at
closeout" and "a push closes the amend window: never force-push in any
form"; rule 2o allows a push of the current branch and nothing else. R1 is
five batches at roughly 80 minutes of gates plus reviews - more than one
session is likely. The environment's own Stop hook
(`~/.claude/stop-hook-git-check.sh`, outside the repository) already asks
to commit and push at every turn end - the platform's expectation is
frequent pushes, and the law below is what makes them lawful.

**Proposal.** In a cloud session, push the working branch after every green
commit and never amend a pushed commit: a cloud release is a branch of one
commit per batch (a remediation after a push is its own commit). At
closeout the owner squash-merges the branch onto `main` as the release's
one commit (`git checkout main && git pull && git merge --squash
claude/<name> && git commit --author='artex-x <artex-x@users.noreply.github.com>'
-F <the closeout commit message>`), pushes `main` (which deploys) and
deletes the branch. This keeps every law but the wording: one commit per
release on `main`, no merge commit, no force-push anywhere, the amend window
unchanged locally (a local release still amends), and it dissolves the
fast-forward's fragility (question B). What changes, after confirmation:
`CLAUDE.md` "Source and commit conventions" last bullet becomes "A cloud
session pushes its branch after every green commit (a reclaimed container
loses what is not pushed) and never amends a pushed commit; at closeout the
owner squash-merges that branch onto `main` as the release's one commit,
never a merge commit."; `.claude/README.md` "Cloud sessions" branch rule and
owner step (e); a superseding entry under the 2026-09-24 "A cloud session
runs a whole release on its own task branch" decision in `docs/DECISIONS.md`;
optionally `session-stop.mjs` gains one cloud-only warning ("N commits on
this branch are not on `origin/<branch>`"), a warn, no block, selftest case.
No `bash-guard.mjs` change: rule 2o already allows exactly these pushes.

Rejected: amend plus `--force-with-lease` of the session's private branch
(the law says never force-push in any form and the guard denies every force
shape; a rewritten pushed branch is the class the law exists for); keep
"one push at closeout" and hope a release fits one session (R1 does not;
the failure costs a whole batch's gates and review); pushing "at session
end" (no signal precedes an idle reclaim); N commits per release on `main`
without the squash (a deploy's undo stops being one revert); the
claude.ai/code merge button (a merge commit); scratch branches per batch
(rejected 2026-09-24).

### B. How `e1d7a4b` enters this release; bot commits on `main`

Facts: `e1d7a4b` (setup-field text in `.claude/README.md` "Cloud sessions",
`cloud-setup.sh` comment, the `node_modules` probe in `session-start.mjs`
and its selftest count) sits alone on `origin/claude/keen-noether-mpa4jq`
over `68643d1`. `main` moved to `76497c4`, a `previews.yml` bot commit
(`tools/tg-preview/state.json`, `[skip ci]`) that lands after every green
`check` run and every four hours by schedule - so `main` moves under any
release that takes longer than a CI cycle, and "the owner fast-forwards
`main`" cannot be relied on. `B1.1` edits the same README paragraphs
`e1d7a4b` touched.

**Proposal.** (1) `B1.1`'s first step cherry-picks `e1d7a4b` onto this
branch (`git cherry-pick e1d7a4b`, author and message kept) before any R1
edit, so the README edit is made over the setup-field text and the owner
never resolves that conflict; `B1.1`'s `npm run check` then covers the
cherry-picked tree (its selftest count included). (2) On `main` it stays a
commit of its own: at closeout the owner cherry-picks `e1d7a4b` onto `main`
first, then squash-merges the rest (question A). If A is not confirmed, the
fallback is the same cherry-pick plus a local rebase of the release commit
onto the moved `main` before the push (a bot commit touches only
`state.json`, so it never conflicts). (3) Bot commits on `main` need no
rule of their own under A's squash-merge; under the fast-forward rule the
README sentence becomes "fast-forward when `main` has not moved, otherwise
rebase the release commit onto `main` locally first".

Rejected: a merge commit (the law); folding `e1d7a4b` into R1's commit (a
verified cloud-tooling change loses its own message and its own revert;
acceptable only if the owner prefers one commit at closeout - the squash
would then simply include it); pausing `previews.yml` during a release (a
schedule nobody remembers to re-arm).

### C. Layer 4 in the cloud: how the harness gets a signed-in test user

Facts (`context.md`): a proxy API credential is host-scoped, replaces the
`Authorization` header of every request to the host, and does not grant
admin (the gateway wants the secret key in `apikey`) - RLS assertions would
be meaningless and the mint path would fail. The owner removed it and set
`E2E_*` environment variables in the cloud environment instead
(model-visible, reach new sessions only, unverified here). The `/rest/v1/`
probe form does not discriminate (that endpoint reads `apikey` only).

**Proposal.** The harness reads `E2E_SUPABASE_URL`,
`E2E_SUPABASE_PUBLISHABLE_KEY`, `E2E_SUPABASE_SECRET_KEY` and
`E2E_USER_EMAIL` from the process environment on every host: CI secrets
through the `e2e` job's `env:`; locally through `--env-file
.env.test.local` (the Supabase tools' own convention, never committed);
in the cloud through the environment variables. No proxy credential
anywhere. The mint path stays as decided (`generateLink` magiclink then
`verifyOtp`; the harness creates the user with `auth.admin.createUser({
email, email_confirm: true })` when it is absent, so `E2E_USER_EMAIL` alone
is the fixture). Model visibility of the test project's secret key is
accepted with a bounded blast radius: the key opens the test project only,
`CLAUDE.md`'s secrets rule already forbids printing it, and the owner
rotates it if it ever appears in a document or a log. The probe
(`tests/e2e/probe.mjs`, run first by `run.mjs`) changes to a discriminating
form, both halves measured 2026-09-24: `GET /auth/v1/user` with the
publishable key as `apikey` and **no** `Authorization` header must answer
401 `no_authorization` from Node and from a Puppeteer page (an injected
header answers 403 `bad_jwt` or 200); a request carrying `Authorization:
Bearer a.b.c` must be refused for *that* token ("illegal base64"), proving
the header reached the server unreplaced; the `/rest/v1/` 401 stays only as
a reachability check. R1's cloud verdict: `B1.1`, `B1.2`, `B1.4`'s layers
1-3 and the goldens are cloud-OK now; layer 4 is cloud-OK the moment the new
probe passes in a fresh session that sees the variables (`B1.3`'s first
step). If it does not, `B1.3` runs the E2E in CI by `workflow_dispatch` on
the pushed branch through the GitHub MCP tools (`actions_run_trigger`, then
`get_job_logs`), which needs no secret in the cloud - the named fallback.
Roadmap text superseded at closeout: section 15 step 20 ("no environment
variables; one API credential"), section 18 conflict 3, decision 25, and the
`docs/DECISIONS.md` entry "The hosted E2E mints its session with the secret
key, not a password" (the header is set by the harness, not a proxy).
`E2E_USER_PASSWORD` is removed from the GitHub secrets after `B1.3`.

Rejected: anonymous sign-ins on the test project (no provider identity or
email, so `#/account`'s sections and the unlink guard are untestable, and a
`config.toml` change for the test project); `signInWithPassword`
(rejected 2026-09-24, a second credential shape for one user); layer 4 in
CI only on push to `main` (the first red would land after the owner has
moved `main`; the branch dispatch above keeps CI as the fallback without
that cost); keeping the proxy credential (measured to replace every
`Authorization` header).

### D. Gate-estimate correction (placed, no confirmation needed)

`context.md` measured `npm run check` 111 s and `npm run check:built` 3 s
on this host against the 165 s / "a few minutes" of `.claude/README.md`
and `orchestrate.prompt.md`. Those tables describe the owner's Windows host
and stay; `B1.1` writes the cloud host's own measured table into
`.claude/README.md` "Cloud sessions" (a host fact's home) and adds one line
to the orchestrate prompt's cost table pointing there for a cloud session.
`B1.1` re-measures `check:built` once its chain builds both directories
(the gate run is the measurement; 3 s for a build plus a Puppeteer smoke is
suspicious enough to want a second reading) and records it in the handoff.

## 5. R1 batches: goal, gates, cost, split criterion

Costs: this cloud host (`context.md`, "Command costs"): `check` 111 s,
`check:built` 3 s (before the second build), `check:db` 30 s warm; the
layer 2 filter group and the golden shards are unmeasured here - the
roadmap's ~290 s and ~600 s (4 shards) are used until `B1.1` records the
first cloud reading. Layer 4 ~240 s is the roadmap's estimate.

| Batch | Goal | Gates (cost, one green pass) | Review | Split criterion from the previous batch |
|---|---|---|---|---|
| `B1.1` | Layer 2 reach: `AuthPort`/`CloudPort`, fake cloud and seed, contract test, `vite build --mode test` -> `dist-test/`, `main.ts` selection, marker guard in `check:built`, `tests/app/` driving `dist-test/`, driver `open(route, { as })`, golden `as` naming, CI `browser` on the test build, `COVERAGE.md` four-layer table, README cloud facts; states case 35; cherry-pick of `e1d7a4b` first (question B) | `check` x2 (222 s), `check:built` (re-measured), filter group (~290 s), goldens 4 shards (~600 s, expected "unchanged") - **~19 min** | required: harness every later golden trusts, a hook edit, CI | new release |
| `B1.2` | `@supabase/supabase-js` (lazy chunk), real `auth` adapter, PKCE callback settled before mount, header control, route `#/account`, `AccountPage.svelte` (linking, "Sign out everywhere", delete), migration `<ts>_delete_account.sql` and reversal, `privacy` link; B1.1 review findings; the two authorised `CLAUDE.md` edits; goldens: 5 new states, all 150 re-seeded (the header gains the control) - section 7 | `check` x2 (260 s), `check:built` plus a configured budget probe (~25 s), `check:db` (~120 s with the Docker start), filter group (~350 s), goldens `--update` then compare, 4 shards each (~1120 s), sweep 360 (~450 s, unmeasured here) - **~39 min**, plus CI after the push | required: public contract, new UI, a hook edit | a public-contract change; and a commit boundary the harness cannot reach (`?as=` and `dist-test/` land in `B1.1`) |
| `B1.3` | Layer 4: `tests/e2e/` (probe as in question C, mint, cleanup, flows over `#/account`, `contract.mjs` fake-vs-real), `npm run e2e`, CI `e2e` job with its concurrency group and `skip_e2e`, `deploy` needs `e2e`, README failure mode | `check`, layer 4 (~6 min) - **~7 min** | not required unless the worker deviates | a commit boundary the harness cannot reach (flows need `B1.2`'s UI); harness judged against `COVERAGE.md` |
| `B1.4` | Account preferences: `<ts>_user_prefs.sql` and reversal, RLS matrix, `PreferencesPort` real and fake, `CloudPort.prefs`, `AppState` precedence, print layout as a preference (default money mode dropped, owner Q1); goldens: tables view, print layout, language as `gm1` vs signed out; E2E: a preference read back on a fresh session | `check` x2, `check:built`, filter group, goldens, `check:db`, layer 4 - **~26 min** | required: schema rule and UI | a different route and filter set (tables, print, lists vs `#/account`) |
| `B1.5` | Release automation: `backup.yml` (nightly `supabase db dump` schema and data, `age`-encrypted to the owner's public key, 30-day artifact, fails closed without a recipient), CI migration deploy to test before `e2e` and to prod before `deploy` with `--db-url` secrets, the applied-set redesign (`applied.json` and `edit-guard.mjs` read a source CI keeps current), the R1 owner steps, `.claude/README.md` runbook | `check` x2, `check:db`, CI on the pushed branch by `workflow_dispatch` - **~5 min** plus CI | required: hooks and a production credential | a review that cannot be held in one pass (pipeline and hooks vs product UI) |

Total gate cost, one green pass per batch: about 96 minutes on this host
(`B1.1` measured ~19, `B1.2` ~39 with the full golden re-seed, `B1.3` ~7,
`B1.4` ~26, `B1.5` ~5), plus CI. Every batch fits one foreground `npm run
check` call; each golden shard and the sweep row are one call each.

Mockups: `B1.2`'s are `mocks/B1.2/` (owner-answered 2026-09-24); `B1.4`
draws nothing new (`mocks/B1.4/README.md`, owner-answered).

## 6. Batch B1.1 - fake cloud and test build (implement-ready)

**Objective.** Give every `tests/app/` suite a deterministic signed-in and
signed-out subject: a `dist-test/` build whose `CloudPort` is an in-memory
fake seeded with two users, selected by `?as=<user>`, while `dist/` stays
free of it; prove both halves; write the four-layer table into
`COVERAGE.md` and the cloud session's measured facts into the README.

**In scope.** Section 3 items 1-10; the files below. **Out of scope.** Any
UI or `AppState` change (no reader of `env.cloud` yet - the reach lands
first, roadmap section 12's criterion), `@supabase/*`, migrations, new
golden states, `applied.json`, the roadmap's own text (compacted at
closeout).

**Files.** Create: `app/src/ports/fake-cloud-seed.ts`,
`app/src/ports/fake-cloud.ts`, `app/src/ports/cloud.contract.ts`,
`app/src/ports/fake-cloud.test.ts`, `tests/app/serve.js`,
`tools/no-fake-in-prod.mjs`. Edit: `app/src/ports/types.ts`,
`app/src/ports/index.ts`, `app/src/main.ts`, `app/src/vite-env.d.ts`,
`vite.config.mts`, `package.json`, `tests/app/lib.js`, `tests/app/driver.js`,
`tests/app/golden.js`, `tests/app/golden.test.mjs`, `tests/app/states.js`,
`tests/app/inventory.js` (header comment only), `tests/app/contracts.js`,
`tests/app/print.js`, `tests/app/sweep.js`, `tests/app/typo.js`,
`tests/app/hues.js` (result lines), `tools/smoke-http.mjs`,
`.github/workflows/ci.yml`, `.gitignore`, `.prettierignore`,
`eslint.config.mjs`, `.claude/hooks/edit-guard.mjs`,
`.claude/hooks/selftest.mjs`, `docs/specs/COVERAGE.md`,
`.claude/README.md`, `.claude/prompts/orchestrate.prompt.md`, `README.md`,
`README.ru.md`.

**Steps.**

0. `git cherry-pick e1d7a4b` (question B, confirmed). Verify `.claude/README.md` "Cloud sessions" now
   holds the setup-field text and `session-start.mjs` six probes.
1. `app/src/ports/types.ts`, after the `PwaPort`/`MotionPort` block, a
   "cloud" section:
   ```ts
   export type Provider = 'google' | 'discord';
   export interface Identity { id: string; provider: Provider; email: string }
   export interface Session { userId: string; email: string; provider: Provider }
   export type AuthResult =
     | { ok: true }
     | { ok: false; error: 'alreadyLinked' | 'lastIdentity' | 'failed' };
   export interface AuthPort {
     session(): Promise<Session | null>;
     identities(): Promise<Identity[]>;
     /** Starts the provider redirect; the fake signs the seed's default user in. */
     signIn(provider: Provider): Promise<void>;
     link(provider: Provider): Promise<AuthResult>;
     unlink(identityId: string): Promise<AuthResult>;
     signOut(scope?: 'local' | 'global'): Promise<void>;
     deleteAccount(): Promise<AuthResult>;
     onChange(fn: (session: Session | null) => void): () => void;
   }
   /** Grows one member per release (R1 auth, R1 prefs, R2 lists, ...). */
   export interface CloudPort { auth: AuthPort }
   ```
   and `Env` gains `/** null in an unconfigured build: no cloud control is drawn. */ cloud: CloudPort | null;`.
2. `app/src/ports/index.ts`: `browserEnv(cloud: CloudPort | null = null)`
   sets `cloud`; `fakeEnv` defaults `cloud: null`. Do **not** re-export
   `fake-cloud.ts` from `index.ts` (it would enter the production graph).
3. `app/src/ports/fake-cloud-seed.ts`: `uuid(n)` ->
   `00000000-0000-4000-8000-<n padded to 12>`; `SEED_NOW =
   '2026-09-01T12:00:00Z'`; `USERS`: `gm1` (`uuid(1)`,
   `gm1@example.test`, identities google `uuid(11)` and discord `uuid(12)`
   with `gm1.discord@example.test`), `gm2` (`uuid(2)`, `gm2@example.test`,
   google `uuid(21)` only); `DEFAULT_USER = 'gm1'`; `type SeedUserId =
   keyof typeof USERS`. Exported as `SEED = { now, users, defaultUser }`.
4. `app/src/ports/fake-cloud.ts`: `const MARKER = 'dhloot-fake-cloud'`;
   `fakeCloud(seed, as?: string): CloudPort` - deep-copies the seed's users
   into a `Map`, `as` names the signed-in user or throws
   `Error('fake cloud: unknown user "' + as + '"')`; `auth` implements every
   `AuthPort` method over that map: `session()` resolves `null` or
   `{ userId, email, provider: identities[0].provider }`; `signIn(p)` signs
   `seed.defaultUser` in and notifies; `link(p)` appends
   `{ id: uuid(next), provider: p, email }` and notifies; `unlink(id)`
   answers `lastIdentity` when one identity remains, else removes it;
   `signOut()` clears and notifies; `deleteAccount()` removes the user and
   clears; `onChange` keeps a `Set`. `installFakeCloud(search =
   window.location.search): CloudPort` reads `new URLSearchParams(search).get('as')`,
   builds the port, assigns `window.__dhlootFake = { marker: MARKER, ...port }`
   (a `declare global { interface Window { __dhlootFake?: CloudPort & { marker: string } } }`)
   and returns it. Ports may touch `window`; the ESLint layer rule allows it here.
5. `app/src/ports/cloud.contract.ts`: `export async function
   runCloudContract(make: (as?: string) => Promise<CloudPort>, seed: typeof SEED,
   assert: (cond: boolean, msg: string) => void): Promise<void>` with the
   eight cases of section 3 item 3's family: signed out at start (session
   null, identities empty); `signIn('google')` yields the default user and
   fires `onChange` once with it; `identities()` lists the seed's two in
   order; `unlink(discord)` ok then `unlink(google)` is `lastIdentity`;
   `link('discord')` ok, two again; `signOut()` clears and fires `null`;
   `make('gm2')` starts signed in with one identity; `deleteAccount()` then
   session null and identities empty. No vitest import in this file.
6. `app/src/ports/fake-cloud.test.ts`: runs the contract with
   `make = (as) => Promise.resolve(fakeCloud(SEED, as))` and `assert =
   (c, m) => expect(c, m).toBe(true)`; plus `fakeCloud(SEED, 'nobody')`
   throws naming `nobody`; `installFakeCloud('?as=gm1')` signs `gm1` in and
   sets `window.__dhlootFake.marker`; `installFakeCloud('')` is signed out.
7. `app/src/main.ts`:
   ```ts
   function boot(cloud: CloudPort | null): void { const env = browserEnv(cloud); void env.pwa.register(); void env.pwa.persist(); mount(App, { target, props: { env } }); }
   if (import.meta.env.VITE_CLOUD_FAKE) {
     void import('./ports/fake-cloud.js').then((m) => { boot(m.installFakeCloud()); });
   } else { boot(null); }
   ```
   (drop the `export default`; nothing imports it). The comment states why
   the branch is a `.then`, not an `await` (item 5).
8. `app/src/vite-env.d.ts`: `interface ImportMetaEnv { readonly VITE_CLOUD_FAKE: boolean }`.
9. `vite.config.mts`: `export default defineConfig(({ command, mode }) => {
   const testBuild = command === 'build' && mode === 'test'; const OUT =
   testBuild ? 'dist-test' : 'dist'; ... })`; `artwork(OUT)` and
   `noscriptData(OUT)` take the directory instead of the literal `'dist'`;
   `build.outDir: '../' + OUT`; `define: { 'import.meta.env.VITE_CLOUD_FAKE':
   JSON.stringify(testBuild) }`. A comment records the vitest-mode trap
   (item 4).
10. `package.json`: `"build:test": "npm run data && vite build --mode test"`;
    `"check:built": "npm run build && npm run build:test && npm run smoke && npm run budget && node tools/no-fake-in-prod.mjs"`.
11. `tools/no-fake-in-prod.mjs`: walks `dist/assets/*.js` and fails when any
    file contains `dhloot-fake-cloud`; walks `dist-test/assets/*.js` and
    fails when **none** does (a renamed marker must not pass silently);
    prints one line per verdict; exit 1 on either failure, 1 when either
    directory is missing.
12. `tests/app/serve.js` (CommonJS): `serveDist(dir)` (the server from
    `lib.js`, `dir` instead of `DIST`), `assertBuilt(dir, label)` (the
    missing-index, byte and mtime guards from `lib.js`, messages naming
    `label` and the build command: `npm run build` for `dist/`,
    `npm run build:test` for `dist-test/`). `lib.js` requires it, defines
    `DIST_TEST`, calls `assertBuilt(DIST_TEST, 'dist-test/')` at the top,
    and serves it; its exports keep the same names (`serveDist` bound to
    `DIST_TEST`). `tools/smoke-http.mjs` requires `serve.js` and calls
    `assertBuilt(DIST, 'dist/')` then `serveDist(DIST)` - it keeps driving
    `dist/`.
13. `tests/app/driver.js`: `async open(route, { as } = {})` -> `page.goto(url +
    (as ? '?as=' + encodeURIComponent(as) : '') + route, ...)`; the doc
    comment says the query is the test build's signed-in switch.
14. `tests/app/golden.js`: `captureState` passes `{ as: state.as }` to both
    `d.open` calls; `render` emits `'# as: ' + state.as` after `# why:` only
    when `state.as` is set; result line `structural snapshots (dist-test/)`.
    `tests/app/inventory.js` header comment documents the optional `as`
    field and the ` as <user>` id suffix.
15. `tests/app/golden.test.mjs`: one `describe`: every state with `as` has
    an id ending `' as ' + s.as`, and no state without `as` contains
    `' as '` in its id.
16. `tests/app/states.js`: case 35 `fakeCloudSignedState`: open
    `#/roll/std`, `page.evaluate(() => window.__dhlootFake?.auth.session())`
    is `null`; open again with `{ as: 'gm1' }`, the session's `userId` is
    `00000000-0000-4000-8000-000000000001` and `email` `gm1@example.test`,
    and `location.search` is `?as=gm1` after arrival. Result line
    `(dist-test/)`. The header comment's count becomes thirty-five cases in
    thirty-four runs. The other five suites: result line text only.
17. `.github/workflows/ci.yml`: `check` job gains, after "Bundle size
    budget", `- name: Test build` `run: npm run build:test` and `- name: The
    production bundle carries no fake cloud` `run: node
    tools/no-fake-in-prod.mjs`; `browser` job's Build becomes `npm run
    build:test` and its artifact path `dist-test/`; the `check` job's
    failure artifact adds `dist-test/`.
18. `.gitignore` (`dist-test/` beside `dist/`), `.prettierignore`,
    `eslint.config.mjs` ignores (`dist-test/**`); `edit-guard.mjs` DENY: the
    `dist/` rule's test becomes `p.startsWith('dist/') ||
    p.startsWith('dist-test/')`, message naming both builds; `selftest.mjs`
    mirrors the existing `dist/` deny case for `dist-test/`.
19. `docs/specs/COVERAGE.md`: a new `## Test layers` section after the
    "Suites" intro with roadmap section 8's four-layer table and its two
    rules; the `tests/app/*` heading and `lib.js` sentences say
    `dist-test/` and why (the test build, `?as=`, the seed's two users, the
    marker guard, item 6's `base()` note, item 9's throw); "Features to
    suites" gains "Fake cloud and the test build" -> `fake-cloud.test.ts`,
    `tests/app/states.js` case 35, `tools/no-fake-in-prod.mjs`; the unit
    suite table gains `fake-cloud.test.ts` (the contract, and what R1's
    contract covers).
20. `.claude/README.md` "Cloud sessions": the step 20 results and the
    measured table from `context.md` (session 2), the proxy finding as a
    quirk with its symptom (`403 bad_jwt "invalid number of segments"` on
    `/auth/v1/user` when a host-scoped credential is set), the `E2E_*`
    environment variables as the credential shape **pending question C**
    (write "proposed" until confirmed), and `dist-test/` in the layer rule.
    `orchestrate.prompt.md` cost table: one row "cloud host: see
    `.claude/README.md`, 'Cloud sessions'". `README.md`/`README.ru.md`
    "Running and developing": `npm run build:test # -> dist-test/, what
    tests/app/* drive`, and the `tests/app/*` sentences name `dist-test/`.
21. Gates in order: `rtk npm run check` (foreground, 600000 ms); `npm run
    check:built` (records the new wall clock); `node tests/run-all.js
    app/print,app/contracts,app/states,app/typo,app/hues,stub`; the four
    golden shards `node tests/app/golden.js --shard=n/4`, one call each,
    each "unchanged"; commit; review; remediation amends (or, under
    question A once confirmed, commits); handoff records exact commands,
    wall clocks and results.

**Acceptance criteria.**

- `e1d7a4b` is cherry-picked onto the branch, author and message kept,
  before any R1 edit (it follows the pushed planning commit).
- Question A's durable text is written: `CLAUDE.md` "Source and commit
  conventions" last bullet (section 4A's wording), `.claude/README.md`
  "Cloud sessions" branch rule and owner step (e) (squash-merge; the
  `e1d7a4b`-first cherry-pick of question B), and a `docs/DECISIONS.md`
  entry that supersedes "A cloud session runs a whole release on its own
  task branch". The optional `session-stop.mjs` warning goes to Deferred.
- Question C's decision is written: a `docs/DECISIONS.md` entry that
  supersedes "The hosted E2E mints its session with the secret key, not a
  password" (harness reads `E2E_*` from the environment; no proxy
  credential; the discriminating probe), and `.claude/README.md` "Cloud
  sessions" "Secrets" bullet. The probe code itself stays in `B1.3`.
- `npm run build:test` writes `dist-test/index.html`, `dist-test/data.js`,
  `dist-test/assets/*` and a chunk containing `dhloot-fake-cloud`;
  `dist/assets/*.js` contains no `dhloot-fake-cloud`; `tools/no-fake-in-prod.mjs`
  passes, and fails when run with the marker renamed in a scratch copy
  (state the probe in the handoff).
- `npm run check` green: `fake-cloud.test.ts` runs the contract's eight
  cases and the three `installFakeCloud` cases; per-file coverage holds for
  `fake-cloud.ts`, `fake-cloud-seed.ts`, `cloud.contract.ts`;
  `golden.test.mjs`'s `as` convention case passes; selftest's `dist-test/`
  case passes.
- All four golden shards report `structural snapshots (dist-test/): unchanged`
  - no golden moved and none was re-seeded.
- `app/states` reports 35 cases passed, case 35 observing `null` signed out
  and `gm1`'s id and email as `gm1`.
- The filter group passes; `tools/smoke-http.mjs` still drives `dist/` and
  passes inside `check:built`.
- `ci.yml`'s `browser` matrix builds the test build and `check` runs the
  marker guard (read the diff; CI runs at the owner's push).
- `COVERAGE.md` holds the four-layer table and the two rules; the README
  "Cloud sessions" holds the measured table; `orchestrate.prompt.md`
  points there; both READMEs name `build:test`.
- The handoff records `check:built`'s new wall clock and the filter group's
  and golden shards' wall clocks on this host (`context.md`'s table rows).
- Deferred from earlier: none inherited.

**Do-nots.** No reader of `env.cloud` in `AppState` or a component (B1.2);
no `AuthPort` error injection option (B1.2 adds `linkError` with its
test); no change to `hashRouter.base()`; no `.env` file; no edit to
`tests/app/snapshots/`; no `await` at `main.ts`'s top level; no
`fake-cloud` export from `ports/index.ts`; do not edit the roadmap.

**Risks.** Vite's `define` of `import.meta.env.VITE_CLOUD_FAKE` must be a
JSON literal (`'true'`/`'false'`), or the `if` is not dead code and the
chunk ships - the marker guard is the catch. `emptyOutDir` on
`../dist-test` is explicit and outside the root, as `dist/` already is.
The golden shards are the batch's longest gate; run them last, one call
each. **Fallback:** if Rollup keeps the dynamic chunk in `dist/` despite the
literal, replace the dynamic import by a static import inside a separate
entry `app/src/main.test-build.ts` selected by `build.rollupOptions.input`
in test mode - same marker guard.

## 7. Batch B1.2 - sign-in, `#/account`, delete account (done, review pending)

**Objective.** Ship accounts: Google and Discord sign-in through Supabase
Auth (PKCE), a header control beside the language switch, the public route
`#/account` (who is signed in, connected providers with Connect and
Disconnect, Sign out and Sign out everywhere, delete account), the
`delete_account()` migration with its layer 3 proof, and the route's
contract change - on B1.1's `CloudPort` and test build as built. Close
B1.1's review findings and write the two `CLAUDE.md` edits the human
authorised.

**Inputs that bind this batch.**

- Owner answers (2026-09-24): `mocks/B1.2/README.md`, "Owner answer", and
  the two mocks there. The README's recommendations 1-13 stand, with three
  owner changes: the delete hint is exactly «Аккаунт и все связанные с ним
  данные будут удалены навсегда.» (no sentence about local lists); the
  signed-out lead is exactly «Войдите, чтобы ваши данные были доступны на
  всех устройствах. Всё остальное работает и без входа.»; a build with no
  sign-in configured draws **no** account control and `#/account` there
  draws the not-found page (mock frame G is dropped).
- Owner standing rule (2026-09-24): account texts and names describe the
  final state (after R10) in general terms, true in every release. It binds
  every string and identifier below; this batch writes it to
  `docs/specs/I18N.md` (planner's choice of home: it is a rule about
  product text, and I18N.md already holds the text rules).
- The human authorised in chat on 2026-09-24 ("approved") both `CLAUDE.md`
  edits of step 22; the implementer may edit `CLAUDE.md` for exactly those
  two lines.
- B1.1 review register `reviews.md`, rows placed in B1.2: R3, R5, N1-N7,
  N9 (N8 is deferred; R4 goes to B1.3's outline; R1 is step 22's second
  edit).

**Settled here (planner decisions; do not reopen).**

1. **supabase-js is a lazy chunk.** `app/src/ports/supabase.ts` is the only
   module that imports `@supabase/supabase-js` (ESLint enforces it).
   `main.ts` wraps it as `lazyCloud(() => import('./ports/supabase.js')
   .then(...))`, so the configured app mounts synchronously like today and
   the chunk arrives after first paint. The branch is dead in a build with
   no configuration (a `define` literal, B1.1's pattern), so `dist/` built
   by `check:built` carries neither the chunk nor the control. Rejected:
   mounting after the chunk loads (every visitor waits for it); a static
   import (the entry grows by the whole client for anonymous readers).
   Recorded in `docs/DECISIONS.md` (this planning pass).
2. **A provider redirect is settled before mount.** `ports/redirect.ts`
   `takeRedirect(window)` runs synchronously in `main.ts` when the URL holds
   `auth-callback`: it reads `code` or the error parameters, reads and
   deletes `sessionStorage['dhloot.auth.return']` (`{ hash, at, kind,
   provider }`, honoured for 10 minutes), and `history.replaceState`s the
   URL to the page without `auth-callback`, `code`, `error`, `error_code`,
   `error_description`, plus the saved hash (`#/account` when none). The
   code exchange and its outcome resolve after mount through the new
   `AuthPort.redirectResult()`. Reason: `linkIdentity` and `signInWithOAuth`
   report `identity_already_exists` and a cancelled consent on the
   *redirect back* (query parameters), not as the call's return value, and
   the router reads the hash at mount. Supabase's own `detectSessionInUrl`
   is off (it would race the router).
3. **`AuthPort` changes (types.ts), all additive to B1.1's shape except two
   return types:** `export type AuthError = 'alreadyLinked' | 'lastIdentity'
   | 'failed'` (`AuthResult` uses it); `signIn(provider)` and
   `signOut(scope?)` now resolve `AuthResult` (a redirect that cannot start
   and a failed global sign-out must reach the page); new
   `redirectResult(): Promise<AuthRedirect | null>` with `export interface
   AuthRedirect { kind: 'signIn' | 'link'; provider: Provider | null;
   result: AuthResult }`; `Session.provider` becomes `Provider | null`
   (null when the account's first provider is neither Google nor Discord -
   the test project's email user in B1.3).
4. **The fake grows options, not modes:** `fakeCloud(seed, as?, options:
   FakeCloudOptions = {})` with `FakeCloudOptions = { linkError?:
   AuthError; returned?: AuthRedirect }` - `link()` resolves `{ ok: false,
   error: linkError }` and changes nothing when set; `redirectResult()`
   resolves `returned ?? null`. The browser build never sets them
   (`installFakeCloud` passes none); vitest does.
5. **Unconfigured build:** `App.svelte` draws `AccountPage` only when
   `app.env.cloud` is non-null; otherwise `#/account` falls to the existing
   not-found block and the address stays (owner M16). `parseHash('#/account')`
   is `{ kind: 'account' }` in every build, so the address never falls home.
6. **The header control** (Shell, one use, inline): an `<a href="#/account">`
   drawn only when `app.env.cloud` is non-null **and** `app.user` is no
   longer `undefined` (no flash of «Войти» for a signed-in reader). Signed
   out: the new `user` icon plus `<span class="t">` «Войти»/"Sign in";
   below 420 px the span is visually hidden (the clip pattern
   `ListPage.svelte` uses) and stays the name. Signed in: a 38 px circle
   (44 px at <= 600 px, the system breakpoint) with the email's first
   character (CSS `text-transform: uppercase`; the `user` icon when the
   email is empty) and `aria-label` «Аккаунт: <email>»/"Account: <email>".
   On `#/account` it carries `aria-current="page"` and the gold ring; no tab
   is lit. Values: the mock's `.acct` rules (Seg's track and type, 8 px after
   the switch); the 420 px query is component-local with a comment naming
   the measured reason (the English label crowds the brand at 390).
7. **`AppState` holds the session, not the page:** `user = $state<Session |
   null | undefined>()` (`null` at construction when `env.cloud` is null,
   else `undefined` until known); `alreadyLinked = $state<Provider |
   null>(null)`; `get pagesDir()` (moved from `Shell.svelte` on its second
   use, the consent line). `start()` subscribes `cloud.auth.onChange` (a
   notification always wins over the first `session()` answer), reads
   `session()` (a rejection reads as `null`), and reads `redirectResult()`
   once: a refused link with `alreadyLinked` and a known provider sets
   `alreadyLinked`; any other refusal says `accountFailed` as an error
   toast. `stop()` unsubscribes.
8. **The migration name follows the repository's rule,** not the roadmap's
   `0002_...`: `tools/supabase/lib.mjs` `MIGRATION_NAME_RE` requires
   `<14 digits>_<snake>.sql`. Use `20260925120000_delete_account.sql`
   (reversal of the same name). It uses `create function`, not `create or
   replace`, so the existing up-down-up gate fails a reversal that forgets
   the drop (the second `up` errors "already exists") - the carried
   reversibility-base item (roadmap section 17) stays with `B1.4`, which
   has the first table.
9. **The budget measures what ships.** `check:built` keeps measuring the
   unconfigured `dist/`; the batch measures a configured build once
   (placeholder values, step 21) and the `deploy` job runs `npm run budget`
   after its configured build. If the configured build exceeds 120 kB,
   raise `BUDGET_KB` in `tools/bundle-budget.mjs` in this commit with the
   measured number and the reason in its comment (the tool's own rule).
10. **Configuration is read from the environment at build time only:**
    `vite.config.mts` defines `import.meta.env.VITE_SUPABASE_URL` and
    `VITE_SUPABASE_PUBLISHABLE_KEY` as JSON literals from `process.env`
    for `vite build` (the `deploy` job sets them from the Actions
    variables), from `loadEnv(mode, 'app', 'VITE_')` for `vite` (dev, so
    `app/.env.local` works), and `''` for the test build and vitest. So a
    local `npm run build` is unconfigured unless the variables are on the
    command line, and `check:built` stays deterministic.
11. **M6's user-name fallback is not built.** Both providers are
    `email_optional = false` (`supabase/config.toml`) and the owner's
    dashboard refuses users without email (roadmap section 15 step 4), so
    the branch has no reachable input. When an email is empty anyway, the
    "Signed in as" line shows the provider alone and the header draws the
    icon. Named to the owner in the report; no confirmation needed.
12. **One text-input component.** The typed confirmation is the third real
    `<input type="text">` with the same scoped rule (`ListsPage.svelte` has
    two): extract `components/TextInput.svelte` (props: `value` bindable,
    `el` bindable, `placeholder?`, `label?` as `aria-label`, `id?`) with the
    rule moved from `ListsPage.svelte`, which then uses it twice. The
    accessibility tree is unchanged, so no `#/lists` golden moves for this.
13. **Headings in the page:** each section is a `Panel` headed by an `h2`
    in `Field`'s `.lbl` style: `Field.svelte` gains `heading?: boolean`
    (renders `<h2 class="lbl">`, margin reset) - no new copy of `.lbl`.
14. **`Button.svelte` gains `disabled?: boolean`** (the redirect state and
    the typed confirmation both need it): `disabled` on the `<button>`,
    `.btn:disabled { opacity: 0.5; cursor: default; pointer-events: none }`
    per the mock; a link-button never takes it.

**In scope.** Everything in the files list. **Out of scope.** The Export
JSON section (R6; absent, not a placeholder); `user_prefs` (B1.4); the
hosted E2E (B1.3); pushing the migration to any hosted project (owner, rule
2n); `hashRouter.base()`; a sign-in prompt anywhere but `#/account` (R2);
any golden state for the redirect or the already-linked error (unreachable
in the test build: vitest covers both).

**Files.** Create: `app/src/ports/supabase.ts`, `supabase.test.ts`,
`lazy-cloud.ts`, `lazy-cloud.test.ts`, `redirect.ts`, `redirect.test.ts`;
`app/src/components/AccountPage.svelte`, `accountPage.test.ts`,
`TextInput.svelte`; `supabase/migrations/20260925120000_delete_account.sql`,
`supabase/reversals/20260925120000_delete_account.sql`;
`tests/db/delete-account.test.mjs`; five goldens (written by the runner).
Edit: `package.json`, `package-lock.json` (through `npm install` only),
`app/src/ports/types.ts`, `fake-cloud.ts`, `fake-cloud.test.ts`,
`cloud.contract.ts`; `app/src/main.ts`, `vite-env.d.ts`, `App.svelte`;
`app/src/lib/hash.ts`, `hash.test.ts`, `icons.ts`, `dict.ts`;
`app/src/state/app.svelte.ts`, `app.test.ts`; `app/src/components/Shell.svelte`,
`shell.test.ts`, `Button.svelte`, `button.test.ts`, `Field.svelte`,
`ListsPage.svelte`, `a11y.test.ts`; `vite.config.mts`, `eslint.config.mjs`;
`docs/fixtures/urls/routes.json`, `docs/specs/ROUTES.md`, `CONTRACTS.md`,
`FEATURES.md`, `STATE.md`, `META.md`, `I18N.md`, `COVERAGE.md`, `llms.txt`,
`DESIGN.md` ("Navigation"); `pages/src/privacy.html`,
`pages/src/en/privacy.html`, `tools/build-pages.js`, `tests/derived.js`;
`tests/app/inventory.js`, `sweep.js`, `typo.js`, `states.js`, `driver.js`,
`lib.js`, `golden.js`, `contracts.js`, `print.js`; `tools/no-fake-in-prod.mjs`,
`tools/smoke-http.mjs`, `tools/bundle-budget.mjs` (only if step 21 says so);
`tests/db/roles.mjs`, `tests/db/harness.test.mjs`; `.github/workflows/ci.yml`;
`.claude/hooks/bash-guard.mjs`, `.claude/hooks/selftest.mjs`,
`.claude/README.md`; `docs/DECISIONS.md` (N5); `CLAUDE.md` (step 22 only);
`README.md`, `README.ru.md`.

**Texts (RU / EN), exact.** Keys are `dict.ts` additions; every one obeys
the owner's standing rule. Brand names `Google` and `Discord` are not
translated (a `PROVIDER_NAME` const in `AccountPage.svelte`). `%s` is the
provider name, replaced with `.replace('%s', name)`.

| Key | RU | EN |
|---|---|---|
| `account` | Аккаунт | Account |
| `signIn` | Войти | Sign in |
| `accountSub` | Способы входа, выход и ваши данные. | Sign-in methods, signing out and your data. |
| `signInLead` | Войдите, чтобы ваши данные были доступны на всех устройствах. Всё остальное работает и без входа. | Sign in to have your data on all your devices. Everything else works without signing in. |
| `signInWith` | Войти через %s | Sign in with %s |
| `consentBefore` / `consentTerms` / `consentMid` / `consentPrivacy` / `consentAfter` | «Входя, вы принимаете » / «условия» / « и » / «политику конфиденциальности» / «.» | "By signing in you accept the " / "terms" / " and the " / "privacy policy" / "." |
| `signedInAs` | Вы вошли как | Signed in as |
| `via` | через %s | with %s |
| `providers` | Способы входа | Connected providers |
| `notConnected` | не подключён | not connected |
| `connect` | Подключить %s | Connect %s |
| `redirecting` | Переходим в %s... | Redirecting to %s... |
| `disconnect` | Отключить | Disconnect |
| `onlyMethod` | %s - единственный способ входа, поэтому его нельзя отключить. Подключите второй, чтобы отключить этот. | %s is your only sign-in method, so it cannot be disconnected. Connect another one first. |
| `alreadyLinked` | Этот аккаунт %s уже подключён к другому пользователю. | This %s account is already used by another account. |
| `signOutHead` | Выход | Sign out |
| `signOut` | Выйти | Sign out |
| `signOutAll` | Выйти на всех устройствах | Sign out everywhere |
| `signOutAllHint` | «Выйти на всех устройствах» завершает вход и на других телефонах и компьютерах. | "Sign out everywhere" also ends the session on your other phones and computers. |
| `deleteHead` | Удаление аккаунта | Delete account |
| `deleteHint` | Аккаунт и все связанные с ним данные будут удалены навсегда. | The account and all the data linked to it will be deleted for good. |
| `deleteOpen` | Удалить аккаунт... | Delete account... |
| `deleteConfirm` | Чтобы подтвердить, введите слово | To confirm, type the word |
| `deleteWord` | удалить | delete |
| `deleteFinal` | Удалить навсегда | Delete for good |
| `signedOut` | Вы вышли из аккаунта. | You are signed out. |
| `accountDeleted` | Аккаунт удалён. | The account is deleted. |
| `accountFailed` | Не получилось. Попробуйте ещё раз. | That did not work. Try again. |

`cancel` (existing) is the confirmation's cancel button; `notFound`,
`notFoundSub`, `toStart` (existing) are the unconfigured page. The signed-in
sub (`accountSub`) replaces the mock's «Способы входа, выход и удаление
аккаунта.», which the standing rule rules out (R6 adds "Your data").

**Steps.**

1. `npm install --save-exact @supabase/supabase-js@2` (devDependencies,
   like every bundled package here; record the version in the handoff).
   `eslint.config.mjs`, the "everything else in the app" block: add
   `no-restricted-imports` with `{ group: ['@supabase/*'], message: 'only
   ports/supabase.ts talks to Supabase' }` for `app/src/**` with
   `ignores: ['app/src/ports/supabase.ts']` (a new block, so the lib
   block's own patterns are untouched).
2. `ports/types.ts`: the changes of decision 3, doc comments stating that a
   refusal is an answer and that `redirectResult()` answers once per page
   load.
3. `ports/fake-cloud.ts`: decision 4; `signIn` and `signOut` resolve `{ ok:
   true }` (`signIn` with nobody to sign in cannot happen: the seed has a
   default user). `cloud.contract.ts`: every case that awaited `signIn`/
   `signOut` asserts `.ok`; one new case "a fresh port has no redirect
   result" (`redirectResult()` is `null`). `fake-cloud.test.ts`: `linkError`
   (`alreadyLinked` refused, identities unchanged, no notification) and
   `returned` (answered as given).
4. `ports/redirect.ts` (browser access through a `win` argument defaulting
   to `window`): `export const RETURN_KEY = 'dhloot.auth.return'`;
   `RETURN_MS = 10 * 60 * 1000`; `export function callbackUrl(href:
   string): string` (origin + path without a trailing `index.html` +
   `?auth-callback=1` - the allowlisted form, `supabase/config.toml`);
   `export function saveReturn(win, record: { hash; kind; provider }, now =
   Date.now()): void` (JSON with `at`, a storage throw ignored); `export
   interface Redirect { code: string | null; error: string | null; kind:
   'signIn' | 'link'; provider: Provider | null }`; `export function
   takeRedirect(win = window, now = Date.now()): Redirect | null` - `null`
   when the query has no `auth-callback`; otherwise reads `code` and
   `error_code ?? error` from the query and from a hash that starts with
   `#error` or `#access_token` (read as parameters, never routed), reads,
   validates (object, `hash` a string starting `#/` under 2048 chars, `at`
   within `RETURN_MS`, `kind` and `provider` from their sets) and removes
   the record, and `replaceState`s to the cleaned URL plus `record?.hash ??
   '#/account'`. Every storage access is wrapped: a throw means "no
   record". `redirect.test.ts` (jsdom, a stub `win` with `sessionStorage`,
   `location.href` and a spy `history`): each branch above, including a
   stale record, a foreign hash, a record with a bad provider, an error in
   the hash, and a storage that throws.
5. `ports/supabase.ts`: `export function createCloud(url: string, key:
   string, redirect: Redirect | null, win = window): CloudPort`.
   `createClient(url, key, { auth: { flowType: 'pkce', detectSessionInUrl:
   false, persistSession: true, autoRefreshToken: true } })`. With
   `redirect?.code`, start `exchangeCodeForSession(code)` at once and keep
   the promise; `session()` and `identities()` await it first. Mapping:
   `Session = { userId: user.id, email: user.email ?? '', provider: google
   or discord from app_metadata.provider, else null }`; `identities()` from
   `getUserIdentities()`, Google and Discord only, `{ id: identity_id,
   provider, email: identity_data?.email ?? '' }` in the server's order.
   `signIn(p)`/`link(p)`: `saveReturn(win, { hash: win.location.hash ||
   '#/account', kind, provider: p })`, then `signInWithOAuth`/`linkIdentity`
   with `options: { redirectTo: callbackUrl(win.location.href) }`; an error
   maps to `alreadyLinked` when `error.code === 'identity_already_exists'`,
   else `failed`. `unlink(id)`: find the `UserIdentity` by `identity_id`
   (absent -> `failed`), refuse `lastIdentity` locally when it is the only
   one, map `single_identity_not_deletable` to `lastIdentity`, else
   `failed`. `signOut(scope = 'local')`: `auth.signOut({ scope })`.
   `deleteAccount()`: `rpc('delete_account')`, on success `auth.signOut({
   scope: 'local' })` and `{ ok: true }` whatever that sign-out answers (the
   user no longer exists). `onChange`: `onAuthStateChange((_e, s) =>
   fn(map(s)))`, the synchronous mapping only (a callback that awaits
   another client call deadlocks supabase-js). `redirectResult()`: `null`
   without a redirect; with `redirect.error`: `{ kind, provider, result: {
   ok: false, error: redirect.error === 'identity_already_exists' ?
   'alreadyLinked' : 'failed' } }`; with a code: the exchange's outcome.
   `supabase.test.ts` mocks `@supabase/supabase-js` (`vi.mock`, a stub
   client with `vi.fn()` methods) and covers every mapping above, the
   exchange-before-session order, and `saveReturn` being called before the
   provider call. This is layer 1's "ports against fake clients"; the real
   client is proven in B1.3.
6. `ports/lazy-cloud.ts`: `export function lazyCloud(load: () =>
   Promise<CloudPort>): CloudPort` - loads once on first use; every method
   delegates; `onChange` returns an unsubscribe at once and subscribes when
   the port arrives (an unsubscribe before that cancels it); a load failure
   answers like a signed-out, failing port (`session()` null,
   `identities()` [], mutators `{ ok: false, error: 'failed' }`,
   `redirectResult()` null). `lazy-cloud.test.ts` over `fakeCloud` and a
   rejecting loader.
7. `vite-env.d.ts`: `readonly VITE_SUPABASE_URL: string; readonly
   VITE_SUPABASE_PUBLISHABLE_KEY: string`. `vite.config.mts`: decision 10,
   one comment naming why a literal (the dead branch, B1.1's reason) and why
   `vite build` ignores `app/.env.local`.
8. `main.ts`: `else if (import.meta.env.VITE_SUPABASE_URL &&
   import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)` between the fake branch
   and the plain boot: `const redirect = takeRedirect(); boot({ ...env,
   cloud: lazyCloud(() => import('./ports/supabase.js').then((m) =>
   m.createCloud(import.meta.env.VITE_SUPABASE_URL,
   import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, redirect))) })` (no local
   named `URL`: it would shadow the global). **R5:** the fake branch gains
   `.catch((err: unknown) => { ... })` that appends `<p id="boot-error"
   role="alert">` with the error's message to `#app`; `tests/app/driver.js`
   `open()` checks for `#boot-error` after `ready()` and throws `Error(route
   + ': the test build refused to boot - ' + text)`. States case 35 gains a
   last assertion: `d.open('#/roll/std', { as: 'nobody' })` rejects with a
   message containing `unknown user "nobody"`.
9. `lib/hash.ts`: route kind `{ kind: 'account' }` for exactly `account`
   (after the `lists/` test, before the `l/` test), `export const
   ACCOUNT_HASH = '#/account'`. `hash.test.ts`: `#/account` parses to it;
   `#/account/x` and `#/accounts` stay `unknown`.
   `docs/fixtures/urls/routes.json`: one entry `{ "hash": "#/account",
   "why": "the account page; with no sign-in configured it is the not-found
   page, address kept", "resolves": { "hash": "#/account", "tab": null,
   "rows": 0, "printCards": 0, "picked": [] } }`.
10. `lib/icons.ts`: `user` (the mock's path, size 15), with a comment that
    it is not in app.js (the `craftFrom` precedent). `lib/dict.ts`: the
    table above, one commented group per language.
11. `state/app.svelte.ts`: decision 7. `app.test.ts`: `user` null with no
    cloud; `undefined` then the session with the fake as `gm1`; follows
    sign-out; a notification before the first answer wins; a rejected
    `session()` reads null; `returned` alreadyLinked sets `alreadyLinked`;
    `returned` failed toasts `accountFailed`; `stop()` unsubscribes.
12. `App.svelte`: `{:else if app.route.kind === 'account' && app.env.cloud}
    <AccountPage {app} />` before the `{:else}` not-found block.
    `Shell.svelte`: decision 6; the title effect names `app.t.account` on
    `route.kind === 'account'` when `app.env.cloud` is non-null; `pagesDir`
    read from `app`. `FEATURES.md` "Chrome" and the no-tab-lit sentence move
    with it (step 17).
13. `AccountPage.svelte` (props `{ app }`; it reads `app.env.cloud` and
    draws nothing when it is null - `App.svelte` never mounts it then, and
    no non-null assertion is needed): a `.col` wrapper at `max-width: 70ch`; `PageTitle`
    `account` with `accountSub` (signed in) or `signInLead` (signed out);
    while `app.user === undefined` only the title and an empty sub. Signed
    out: one `Panel` headed `signIn` with two plain buttons `signInWith`
    (provider logo + text), then the consent line (`consent*` keys, links
    `app.pagesDir + 'terms.html'` and `'privacy.html'`). Signed in, in this
    order: "Signed in as" (bold email, then the logo and `via`); "Connected
    providers": one row per provider in the order Google, Discord - a
    connected one shows its logo, name and identity email and, while two or
    more identities exist, a `ghost sm` `disconnect`; a missing one shows
    `notConnected` and a plain `sm` `connect`; with exactly one identity the
    `onlyMethod` hint follows the list; `app.alreadyLinked === p` draws the
    `alreadyLinked` text as `<p class="err" role="alert">` inside that row
    (`#f0a49d`, the danger button's text colour, 13 px, full row width);
    "Sign out": `signOut` (plain) and `signOutAll` (`ghost`) then the hint;
    "Delete account": the hint, `deleteOpen` (`danger`, `expanded`) opening
    an inline confirmation - label `deleteConfirm` + « **<deleteWord>** »,
    a `TextInput` (`id`, `autocomplete="off"`), `deleteFinal` (`danger`,
    disabled until `typed.trim().toLowerCase() === t.deleteWord`) and
    `cancel` (`ghost`, closes and clears). Behaviour: every action sets a
    local `busy` (buttons disabled while set) and clears
    `app.alreadyLinked`; Connect/Sign in save nothing themselves (the port
    does), show `redirecting` on the pressed button, then on `{ ok: false,
    error: 'alreadyLinked' }` set `app.alreadyLinked = p`, on another
    refusal toast `accountFailed`, on success re-read identities (the fake
    links in place; the real port has navigated away). Disconnect: `unlink`,
    then re-read; refusal toasts. Sign out / everywhere: ok -> toast
    `signedOut` (the page becomes the chooser through `app.user`); refusal
    -> toast. Delete: ok -> toast `accountDeleted`, confirmation closed;
    refusal -> toast. Identities are re-read whenever `app.user?.userId`
    changes (a stale answer for another user is dropped). Provider logos: a
    `{#snippet logo(p)}` with the mock's Google "G" (four paths, viewBox 48)
    and Discord mark (`#5865F2`), `aria-hidden`. Long identity emails wrap
    (`overflow-wrap: anywhere`), never ellipsis (sweep's clipped-text check).
    Styles from the mock (`.who`, `.via`, `.ids`, `.err`, `.row-btns`,
    `.confirm`), tokens only.
14. `TextInput.svelte`, `Field.svelte` `heading`, `Button.svelte`
    `disabled` (decisions 12-14); `ListsPage.svelte` uses `TextInput` twice
    (its `bind:this={nameInput}` becomes `bind:el={nameInput}`).
    `button.test.ts`: disabled renders `disabled` and ignores a click.
15. Tests, vitest: `accountPage.test.ts` over `fakeEnv({ cloud:
    fakeCloud(SEED, ...) , router: memoryRouter('#/account') })` rendering
    `App` - signed out: the chooser, both buttons, the consent links to
    `pages/terms.html` and `pages/privacy.html` (`pages/en/` in English),
    sign in with Google shows `gm1`; as `gm1`: two rows with Disconnect,
    Disconnect Discord leaves one row, no Disconnect, the hint, Connect
    Discord; Connect with `linkError: 'alreadyLinked'` shows the
    `role="alert"` text naming Discord and keeps the rest; `returned`
    alreadyLinked shows it on arrival; as `gm2`: one identity, no
    Disconnect, the hint; sign out -> chooser and the toast; sign out
    everywhere calls `signOut('global')` (spy); delete: the final button is
    disabled until the word is typed (`' УДАЛИТЬ '` passes), then the
    chooser and the toast; a refusal toasts `accountFailed`; English texts
    once; axe at the end of each state (`expectNoA11yViolations`).
    `shell.test.ts`: no control with `cloud: null`; «Войти» linking
    `#/account` signed out; the initial and «Аккаунт: gm1@example.test»
    signed in; `aria-current="page"` on `#/account`; `document.title`
    «Аккаунт — Генератор лута — Daggerheart»; with `cloud: null`,
    `#/account` draws the not-found heading and keeps the address.
    `a11y.test.ts`: `COVERED` gains `AccountPage.svelte` and
    `TextInput.svelte`; the pressed state "delete confirmation open" under
    axe.
16. Layer 3. Migration (header comment: what it does and why `create
    function`; cite `docs/specs/FEATURES.md`, "Account"):
    ```sql
    create function public.delete_account()
    returns void
    language plpgsql
    security definer
    set search_path = public, pg_temp
    as $$
    begin
      if auth.uid() is null then
        raise exception 'delete_account: not signed in' using errcode = '28000';
      end if;
      delete from auth.users where id = auth.uid();
    end;
    $$;
    revoke execute on function public.delete_account() from public, anon;
    grant execute on function public.delete_account() to authenticated;
    ```
    Reversal: `drop function public.delete_account();`. `tests/db/roles.mjs`
    `asRole` gains an optional `setup(tx)` run as the connection's own role
    before `set local role` (harness case: a row the setup inserts is seen
    by the role and rolled back). `tests/db/delete-account.test.mjs`: the
    function is `security definer` with `search_path=public, pg_temp`;
    `anon` and `PUBLIC` lack EXECUTE, `authenticated` has it; as user A
    (setup inserts auth users A and B) the call removes A and keeps B; as
    `authenticated` with no `sub` it raises `not signed in`; as `anon` it is
    refused (`permission denied`). `harness.test.mjs` gains the invariant
    carried from R0: no function in `public` is executable by `anon`
    (`has_function_privilege`, which sees the PUBLIC grant), allowlist empty.
17. Specs and contract, same commit: `ROUTES.md` a section "Account"
    (`#/account`; not-found page and address kept with no sign-in
    configured; never falls home); `CONTRACTS.md` section 1 bullet list
    gains `#/account`; `llms.txt` line 6 becomes "Static site with an
    optional account (Google or Discord sign-in); no public API." and the
    "cannot do" bullet "No public API. Signing in is optional; lists live in
    the GM's browser and in links.", and the route list gains "`#/account` —
    the account page: sign in, connected providers, sign out, delete the
    account"; `FEATURES.md` "Chrome" gains the control bullet (decision 6)
    and "no tab is lit" names the account page, and a new "## Account"
    section (the page's states and order, the texts' rule, the redirect and
    return route, errors, delete, the unconfigured build); `STATE.md` the
    three-places table gains `sessionStorage` (`dhloot.auth.return`, this
    tab, 10 minutes), the keys table gains `sb-<ref>-auth-token` (and its
    `-code-verifier` during a redirect; written by supabase-js, never by the
    app), the memory table's Session group gains `user`, `alreadyLinked`;
    `META.md` section 3 retitled "Lists live in the URL hash and in the
    browser, until cloud lists ship" with "No account feature is live yet"
    replaced by one sentence that sign-in and `#/account` exist and an
    account holds no list yet, and "Static pages" says the privacy page
    describes the account service as it is and links `#/account` through
    `%APP%`; `I18N.md` Rules gains the owner's standing rule as a bullet
    ("**Account texts and names describe the final state in general
    terms.** ..." - owner, 2026-09-24; an example pair: «ваши данные», not
    «ваши настройки») and the stale "against `dist/`" in "What a test has
    to cover" names `dist-test/`; `DESIGN.md` "Navigation" one sentence on
    the account control; `COVERAGE.md` (step 18).
18. `COVERAGE.md`: unit table rows for `redirect.test.ts`,
    `supabase.test.ts`, `lazy-cloud.test.ts`, `accountPage.test.ts`; the
    `fake-cloud.test.ts` row names the new contract case and options;
    "Features to suites" row "Accounts" -> those, `shell.test.ts`, the five
    goldens, `tests/db/delete-account.test.mjs`, `tools/smoke-http.mjs`
    (no control unconfigured); layer 3 suite text names the function
    invariant; "Known thin spots" gains: the provider redirect and the real
    client are proven only against a mocked client until B1.3, and OAuth
    itself only by the owner's closeout check (roadmap section 15 step 16).
19. Privacy: `tools/build-pages.js` `page()` replaces every `%APP%` in the
    body with the page's own `backHref` (`../` or `../../`), with a comment
    that a fragment links an app route only through it. `pages/src/
    privacy.html` and `en/privacy.html`: "Что сайт хранит сейчас" / "What
    the site stores now" first bullet becomes "If you do not sign in,
    nothing about you is stored on a server. ..." (RU in kind); "Если вы
    войдёте в аккаунт" / "If you sign in": drop "Accounts are not available
    yet. When they are," - "You can sign in with Google or Discord. The site
    then stores:"; the list keeps its general items (the standing rule);
    "Удаление данных" / "Deleting your data": "on the <a
    href="%APP%#/account">account page</a>"; the date line becomes the
    batch's date. `node tools/build.js`. `tests/derived.js`: every page
    output has no `%APP%` left, and both privacy outputs link
    `<backHref>#/account`.
20. Guards and harness: **R3** `tools/no-fake-in-prod.mjs` also fails
    `dist/assets/*.js` holding `@example.test` (the seed's domain), its
    message naming the seed; **N6** `bash-guard.mjs` `rm -r` exemption
    regex and message add `dist-test`, `selftest.mjs` one allow case;
    `tools/smoke-http.mjs` over `dist/`: with `VITE_SUPABASE_URL` unset in
    its environment, no `a[href="#/account"]` in the header on `#/roll/std`,
    and `#/account` draws the not-found heading with the address kept;
    `tests/app/inventory.js` five states - `#/account` (the chooser),
    `#/account as gm2`, `#/account as gm1`, `#/account ~ delete
    confirmation as gm1` (enter: press `deleteOpen`, type `удалить`),
    `#/roll/std as gm1` (the header signed in); `sweep.js` PAGES gains
    `['#/account', 'аккаунт: вход']`; `typo.js` PAGES gains `#/account` and its
    `EXPECTED` row (no grips). **N1** `tests/app/contracts.js:1` and
    `print.js:1` say `dist-test/`; COVERAGE's `app/states` case 29 row
    ("over the same served `dist/`" -> `dist-test/`) and "each serves
    `dist/` on its own port" -> `dist-test/`; `.claude/README.md` "Hooks"
    `edit-guard.mjs` row lists `dist-test/`, and "rebuild ... before any
    `dist/`-driven suite" names `npm run build:test`. **N2** COVERAGE "Test
    layers": `main.ts` mounts with `{ ...env, cloud }` (not "hands its
    CloudPort to `browserEnv`"). **N3** `tests/app/lib.js` drops the unused
    `serveDist` and `DIST_HTML` exports. **N4** reflow the over-width comment
    in `tests/app/golden.js` near its line 244. **N5** `docs/DECISIONS.md`
    question C entry: restore the probe's Puppeteer-page half and the two
    rejections (`signInWithPassword`; a CI-side session mint), inside the
    fifteen-line cap. **N7** `app/states` result line says "runs" for its
    count. `.github/workflows/ci.yml` `deploy`: the Build step gains `env:
    VITE_SUPABASE_URL: ${{ vars.VITE_SUPABASE_URL }}` and
    `VITE_SUPABASE_PUBLISHABLE_KEY: ${{ vars.VITE_SUPABASE_PUBLISHABLE_KEY
    }}` (Actions variables, public by design); a step "Bundle size budget
    (the shipped, configured build)" `run: npm run budget` right after it.
    `README.md`/`README.ru.md` "Running and developing": one line - a
    configured local dev server reads `app/.env.local` (gitignored) with the
    two `VITE_` names; `npm run build` stays unconfigured unless they are in
    the environment.
21. Gates, in order, one foreground call each, this host: `rtk npm run
    check` (600000 ms); `npm run check:built`; the configured probe
    `VITE_SUPABASE_URL=https://example.invalid
    VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_placeholder npm run build
    && npm run budget` (record the total and the supabase chunk; decision
    9), then `npm run build` again (leave `dist/` unconfigured); start
    Docker if `docker info` does not answer (`(dockerd > /tmp/dockerd.log
    2>&1 &)`, `.claude/README.md` "Cloud sessions"), then `npm run
    check:db`; `node tests/run-all.js
    app/print,app/contracts,app/states,app/typo,app/hues,stub`; `node
    tests/app/golden.js --update --shard=n/4` for n = 1..4, then `node
    tests/app/golden.js --shard=n/4` for n = 1..4 (each "unchanged"); `node
    tests/app/sweep.js 360`. Read the golden diff before committing: every
    pre-existing golden gains exactly the signed-out control lines in both
    languages' tree and controls sections, and nothing else.
22. `CLAUDE.md`, the two edits the human authorised in chat on 2026-09-24:
    (a) "Source and commit conventions", last bullet, replaced by section
    4A's text: "A cloud session pushes its branch after every green commit
    (a reclaimed container loses what is not pushed) and never amends a
    pushed commit; at closeout the owner squash-merges that branch onto
    `main` as the release's one commit, never a merge commit."; (b) "Quality
    gates", the browser-suites line "(after `npm run build`)" becomes
    "(after `npm run build:test`)". Nothing else in `CLAUDE.md`.
23. Commit (a new commit on the release branch, question A: `feat(account):
    ...`, author `artex-x`), review, remediation as its own commit, push
    after each green commit; handoff records exact commands, wall clocks,
    the supabase-js version, the configured budget reading, and the CI
    `browser` shard timings of B1.1's CI run and of this push (roadmap
    section 8's shard rule).

**Acceptance criteria.**

- `#/account` in the test build: signed out draws the chooser (two sign-in
  buttons, the consent line linking both policy pages in the language on
  screen); as `gm1` the four sections in order with two identity rows and
  a Disconnect on each; as `gm2` one row, no Disconnect, the `onlyMethod`
  hint and Connect Discord. The header shows «Войти» signed out and the
  initial with «Аккаунт: <email>» signed in, `aria-current="page"` on
  `#/account`, no tab lit; `document.title` «Аккаунт — <docTitle>».
- Vitest proves: connect calls `link(provider)` and shows `redirecting`;
  Disconnect absent with one identity, present with two; unlink removes
  one; `alreadyLinked` (from `link()` and from `redirectResult()`) renders
  «Этот аккаунт Discord уже подключён к другому пользователю.» in the
  Discord row with `role="alert"`; sign out, sign out everywhere
  (`'global'`), delete with the typed word (trimmed, any case), toasts;
  every component test ends with axe.
- An unconfigured build: no account control on any page and `#/account`
  draws the not-found page with the address kept - vitest (`cloud: null`)
  and `tools/smoke-http.mjs` over `dist/`.
- `redirect.test.ts`, `supabase.test.ts`, `lazy-cloud.test.ts` cover every
  branch named in steps 4-6; per-file coverage holds for the three ports
  and `AccountPage.svelte`, `TextInput.svelte`.
- `dist/` built unconfigured holds neither `@example.test`, the fake's
  marker, nor a supabase chunk (the budget listing shows none); the
  configured probe's budget total is recorded, and `BUDGET_KB` is raised in
  this commit (with the reason in its comment) only if that total exceeds
  120 kB; `deploy` runs the budget after its configured build.
- `check:db` passes: the up-down-up gate over the new pair, the five
  `delete-account.test.mjs` cases, the `asRole` setup case and the new
  anon-EXECUTE invariant.
- Contract: `#/account` is in `routes.json` and replays in `hash.test.ts`
  and `tests/app/contracts.js`; `ROUTES.md`, `CONTRACTS.md` section 1 and
  `llms.txt` name it; `tests/contracts.js` passes.
- Goldens: five new states written; all 150 existing goldens re-seeded
  with only the signed-out control's lines added; the compare pass after
  `--update` reports every shard unchanged; `golden.test.mjs`'s `as`
  convention passes. The filter group passes (`app/contracts` replays
  `#/account`; `app/typo` covers `#/account`); `sweep.js 360` passes
  (no sideways scroll with the control on every page).
- Specs: `FEATURES.md` "Account" and "Chrome", `STATE.md`, `META.md`
  section 3 and "Static pages", `ROUTES.md`, `CONTRACTS.md`, `COVERAGE.md`
  match the code; the privacy page in both languages links `#/account` and
  no longer says accounts are unavailable.
- The owner's standing rule is written to `docs/specs/I18N.md`, "Rules",
  and every string and identifier this batch adds obeys it (the reviewer
  reads the text table against it).
- `CLAUDE.md` question A bullet written as step 22 (a) (authorised by the
  human in chat, 2026-09-24).
- `CLAUDE.md` "Quality gates" browser-suites line says `npm run build:test`
  as step 22 (b) (review R1; authorised by the human in chat, 2026-09-24).
- R3: `tools/no-fake-in-prod.mjs` fails a scratch `dist/assets` holding
  `@example.test` (probe stated in the handoff, as B1.1's marker probe).
- R5: an unknown `?as=` fails `driver.open` at once with a message naming
  the user (states case 35's new assertion), not a 30 s `ready()` timeout.
- N1: the listed `dist/` statements say `dist-test/` (history lines stay).
- N2: COVERAGE "Test layers" describes `main.ts` as built.
- N3: `tests/app/lib.js` exports neither `serveDist` nor `DIST_HTML`.
- N4: the `golden.js` comment fits the file's width (prettier passes).
- N5: the question C entry in `docs/DECISIONS.md` carries the probe's
  Puppeteer-page half and both rejections, within fifteen lines.
- N6: `rm -r dist-test` is allowed; selftest proves it.
- N7: the `app/states` result line counts runs.
- N9: the handoff records `SKIP_CHECK_GATE=1` on `0dd526b` and why (the
  B1.1 implementer's reason, from the session record or the orchestrator),
  and "Pushed: yes at `0dd526b`" (the planner wrote the latter; the
  former is this batch's).
- Deferred from earlier, now placed here: the fake's `linkError` option and
  `AppState.user` (B1.1 Deferred) - both delivered by decisions 4 and 7.
- The handoff records every gate's command and wall clock, the
  supabase-js version, the configured budget reading, and the CI `browser`
  shard timings.

**Risks and do-nots.** Do not re-export `supabase.ts`, `lazy-cloud.ts` or
`redirect.ts` from `ports/index.ts` (the entry graph must not hold the
client). No top-level `await` in `main.ts`. No `create or replace` in the
migration. No text that names a release or a later feature (the standing
rule). No golden state that needs a fake option in the browser build. Do
not push the migration to a hosted project (owner step; rule 2n). Risk:
supabase-js's `signOut` after `delete_account()` may answer an error for a
vanished user - the port answers `ok` regardless and B1.3's E2E proves the
session is gone. Risk: the redirect's error parameters may arrive in the
hash rather than the query for some provider errors - `takeRedirect` reads
both; the owner's closeout OAuth check (roadmap section 15 step 16) is the
proof, with a cancelled consent added to it (section 9). Risk: `postgres`
deleting from `auth.users` inside a `security definer` function is the
documented Supabase pattern, proven locally by layer 3 and on the test
project by B1.3. Risk: re-seeding 150 goldens hides a real regression in
the noise - the diff check in step 21 is the guard; a golden whose diff is
more than the control lines stops the batch. **Fallback:** if Rollup keeps
`ports/supabase.js` in an unconfigured `dist/` despite the literal (the
budget listing shows it), gate the configured branch the way B1.1's
fallback names: a separate entry selected in `vite.config.mts` when the
two variables are set.

## 8. Later batch outlines

`B1.3` Hosted E2E: roadmap section 8 "Layer 4" with question C's probe,
env-file loading, `createUser` when absent, the CI `e2e` job (job-level
`if:`, `concurrency: e2e-test-project`, `env:` from secrets, `skip_e2e`
input) and `deploy` needing it. The fake-vs-real agreement runs
`cloud.contract.ts` from Node (`tsx` is not a dependency; run it through
`vite-node`, which vitest already brings, or compile the one file with
`esbuild` from the same dependency tree - the batch picks and records).
First step in the cloud: the probe; on refusal, the CI `workflow_dispatch`
fallback (question C). Owner step 13 is done; `E2E_USER_PASSWORD` removed
after. From `B1.2` as planned: the owner pushes the migration to the test
project first (`npm run db:push -- --project test`; rule 2n denies an
agent) - the delete flow needs `delete_account()` there. The E2E user is
an email identity: the real adapter drops non-Google/Discord identities
and answers `Session.provider` null, so `#/account` shows the email, no
"via" part, no identity row, both Connect buttons and no Disconnect -
assert that. Review R4 (placed here): the contract's cases 2 (`signIn`
notifies once), 7 (a port made as `gm2` has one identity) and 8 (delete)
assume the fake; B1.3 selects which cases run against the real adapter
(the mint replaces `signIn`; `make('gm2')` has no real counterpart;
delete runs last on a throwaway user) and records the selection in
`COVERAGE.md`. `redirectResult()` stays vitest-only (no OAuth on the
test project).

`B1.4` Account preferences: roadmap section 14, `B1.4`, with the owner's
answers in `mocks/B1.4/README.md`: default money mode dropped from R1 (Q1,
recorded in `docs/DECISIONS.md` by B1.4), print layout persisted for
everyone in `dhloot.prefs.v1` (Q2). `CloudPort.prefs` and the seed's
`prefs` rows arrive here; `cloud.contract.ts` appends the prefs cases (load
null, save then load, overwrite). Carried from R0 (roadmap section 17):
the reversibility gate takes its base with `db reset --local --version
<previous>` for a real migration (the first table); the additive lint's
blind spots are listed in the migration's review; the view-without-
`security_invoker` invariant joins the anon-EXECUTE one `B1.2` adds.

`B1.5` Release automation (section 3 item 11) with the owner's answers in
`mocks/B1.4/README.md`: `backup.yml` at `17 3 * * *` UTC including the
auth rows, plus one privacy sentence that encrypted backups are kept 30
days after deletion (Q3, Q4); `ci.yml` `migrate-test` (before `e2e`) and
`migrate-prod` (before `deploy`) with `supabase db push --db-url` from
`SUPABASE_DB_URL_TEST`/`_PROD`, the production one a repository secret, no
Environment (Q5); with `skip_e2e` and a new migration, `migrate-prod` and
`deploy` refuse (Q6); the applied set: `applied-check.mjs` and
`edit-guard.mjs` read the migrations that are on `main` (every migration
on `main` is applied by CI) instead of `applied.json`, which `db:push`
stops writing (kept only for the local wrapper's log or deleted - the
batch decides and records); the restore runbook, and a restore drill into
the test project at R1 closeout (Q8). Owner steps: an `age` key pair
(public key as an Actions variable, private key in the password manager),
the two connection-string secrets. Carried from R0 and answered (Q7): rule
2n denies every hosted-capable `supabase` subcommand by default with an
allowlist of local ones, and the same hook edit closes the 2l `git commit
<pathspec>` and `git commit -a` gaps.

## 9. Owner steps for R1 (in addition to the roadmap's section 15)

- Done 2026-09-24: questions A-C confirmed; both `CLAUDE.md` edits
  authorised (`B1.2` writes them).
- Before `B1.3`: confirm the cloud environment's `E2E_*` variables are set
  (they reach new sessions only) and that no API credential remains; push
  `B1.2`'s migration to the test project (`npm run db:push -- --project
  test`).
- Before `B1.5`: `age` key pair; `SUPABASE_DB_URL_TEST` and
  `SUPABASE_DB_URL_PROD` Actions secrets; `BACKUP_AGE_RECIPIENT` variable.
- At closeout: question A's squash-merge (or the fast-forward/rebase
  fallback), `config:push` and `db:push` to test and prod only if `B1.5` did
  not automate migrations; Security Advisor; the manual OAuth check
  (roadmap section 15, step 16) with two additions from `B1.2`: cancel the
  provider's consent screen once and see «Не получилось. Попробуйте ещё
  раз.» on `#/account`, and "Sign out everywhere" on one device ends the
  other's session at its next token refresh; the restore drill (Q8); the
  roadmap compaction (sections 15 step 20, 18 conflict 3 and the verdict
  table, decision 25).

## 10. Risks, assumptions, deferred

- Assumption: Rollup drops the `.then(import())` branch and its chunk when
  the define is a literal `false` - proven by B1.1's marker guard; `B1.2`
  leans on the same fact for the supabase chunk (its fallback: section 7).
- Risk: the `E2E_*` variables are not visible to this session's
  successor either (`printenv` confirmed they do not reach a running
  session; whether a new session or a new environment is needed is
  unmeasured) - `B1.3`'s probe answers; the CI dispatch is the fallback.
- Risk: a golden shard exceeds the foreground cap on a loaded container -
  one shard per call, never a bare `golden.js`.
- Risk (B1.1 review R2, open): the test build mounts after the dynamic
  import while production mounts synchronously; B1.1's fallback (a second
  entry with a static import) removes the gap if it ever shows.
- Deferred (B1.1 review N8): `fake-cloud-seed.ts` `SEED.now`,
  `SeedIdentity`, `SeedUserId` have no outside reader - revisit when a
  reader lands (R2's seed).
- Deferred (planner, B1.2): loading supabase-js only for a reader with a
  stored session or a pending redirect (anonymous readers would skip the
  chunk); measure the chunk first (section 7 step 21).
- Deferred to closeout: the roadmap text superseded by questions A-C;
  `orchestrate.prompt.md` and README cost tables for the Windows host stay
  as they are.
- Carried from R0, placed: reversibility base (`B1.4`), additive lint
  blind spots (`B1.4` review), the anon-EXECUTE invariant (`B1.2`), the
  view invariant (`B1.4`), rule 2n's uncovered hosted writes and the 2l
  gaps (`B1.5`), `.impeccable/design.json` `file://` text,
  `AltPanel.svelte`'s "no offline copy" comment and `clipboard.ts`
  `legacyCopy` (any batch that touches those files takes them; none in R1
  is expected to - name them to the human at closeout if untouched).
