# Shared task context - TASK persist-1-auth

Orchestrator maintains this file so later steps do not re-fetch the same sources.

## Goal
- Release R1 of the persistence programme (`issues/persistent-storage/plan.md`,
  sections 5, 8, 12, 14 (R1 outlines), 15, 16 (decisions 14-15, 20-23,
  28-31, 39-40), 17 ("Carried from R0"), 18). Batches `B1.1`-`B1.4`, plus
  the nightly backup workflow (decision 39).
- First step: planner refresh of `B1.1` (fake cloud and test build,
  layer 2) to implement-ready.

## GitHub issue (if any)
- None. The programme's facts are in `issues/persistent-storage/context.md`;
  read it for the health check, secrets key names, Auth dashboard state and
  owner inputs. Do not copy it here.

## Inherited from issues/persistent-storage/ (R0 closed 2026-09-24)
- R0 shipped: HTTP-only ES-module build, service worker, policy pages,
  `supabase/` config as code with `config:diff`/`config:push`/`db:push`,
  layer 3 `check:db`, persistence guards, CI `db` job, cloud tooling.
  What R1 inherits in detail: `plan.md` section 17, "Carried from R0".
- R0 owner closeout C1-C4 done (owner, 2026-09-24): Google Branding set,
  consent screen published, support email `daggerheart.loot@gmail.com`.
- `persistent-storage/` stays until the programme closes; it is the roadmap.

## Cloud session 2 (2026-09-24): section 15 step 20 results

For `.claude/README.md`, "Cloud sessions", in R1's first commit.

- Session branch: `claude/jolly-allen-ipojqp` (assigned by claude.ai/code;
  the release branch, not `persist-1-auth`). Base `76497c4` (`main`).
- Network "Full". Host: root, Node v24.21.0.
- SessionStart probes: Node, puppeteer cache, gitleaks, rtk "ok"; docker
  "no answer" until `(dockerd > /tmp/dockerd.log 2>&1 &)`, then `docker
  info` answered in about 1 s. No `node_modules` probe in this session's hook
  (see gap 1); `node_modules` present, `npm ls` clean, no `npm ci` needed.
- Gates, all PASS, foreground, one call each:

| Command | Wall clock |
|---|---|
| `rtk npm run check` | 111 s |
| `rtk npm run check:built` | 3 s |
| `rtk npm run check:db`, first (image pulls from `public.ecr.aws`) | 115 s (about 85 s of pulls) |
| `rtk npm run check:db`, warm | 30 s |

- First pull: two transient registry errors (ECR "Data limit exceeded";
  anonymous token fetch reset, proxy `ws_closed_mid_exchange` on
  `public.ecr.aws:443`); the Supabase CLI retried and passed.
- Layer 4 probe, pre-`B1.3` form (publishable key as `apikey`, `GET
  /rest/v1/`): 401 "Secret API key required" - passes as written, but
  does not discriminate: that endpoint reads only `apikey`.
- Controls with the API credential `Authorization: Bearer
  <E2E_SUPABASE_SECRET_KEY>` set for the test host: `/auth/v1/user` and
  `/auth/v1/admin/users` with the publishable key answered 403 `bad_jwt`
  "invalid number of segments", also when the request carried its own
  `Authorization: Bearer a.b.c`. The proxy dialog states custom headers are
  "added to every request Claude sends to the allowed websites" - host
  scope, no path scope, and it replaces an existing header. So the
  credential replaces every user JWT (RLS assertions meaningless) and does
  not grant admin either (the gateway wants the secret key in `apikey`).
  Layer 4 fails conflict 3's condition with this credential shape.
- Owner removed the credential. Same controls then: `/auth/v1/user` 401
  `no_authorization`; own `Bearer a.b.c` reached the server ("illegal
  base64"). The proxy no longer touches the test host.
- Owner says E2E_* environment variables are now set in the environment
  (2026-09-24). Not verified here: the auto-mode classifier denied listing
  them; variables added mid-session likely reach only new sessions.
  Owner then asked for `E2E_SUPABASE_URL` alone: `printenv` says not set
  in this session - confirms mid-session variables do not arrive.
- The environment's own Stop hook (`~/.claude/stop-hook-git-check.sh`, not
  the repo's) asks to commit and push untracked files at every turn end;
  it conflicts with CLAUDE.md "push once, at closeout" (open question A).
  Environment variables are visible to the model, unlike an API credential.

## Cloud workflow gaps found (for the planner and the human)
1. `e1d7a4b` (setup field text, `node_modules` probe) is only on
   `claude/keen-noether-mpa4jq`. `main` got `76497c4` (tg-preview bot,
   `[skip ci]`) on `68643d1`, so `main` cannot fast-forward to it. A bot
   commit on `main` breaks "the owner fast-forwards `main`".
2. Proxy API credentials are host-scoped and overwrite; see above.
3. Tooling estimates: hook and orchestrate prompt say `check:built` "a few
   minutes" (measured 3 s) and `check` ~165 s (measured 111 s).
4. Results of a cloud session live only in an uncommitted tree until the
   one push; a reclaimed container loses them (open question below).
5. No `gh` CLI; GitHub through MCP tools only (already in README).

## Open questions for the planner
- Push policy for a release longer than one cloud session (container
  deleted after idle; CLAUDE.md "push once, at closeout").
- How `e1d7a4b` enters this release (merge commit, cherry-pick, or folded
  into R1's commit) given "one commit per release, no merge commit".
- Layer 4 in the cloud without a proxy credential: how the harness gets a
  signed-in test user (candidates seen: test-user password as an
  environment variable; anonymous sign-ins on the test project only;
  layer 4 in CI only). The owner has now put E2E_* variables in the
  environment; the plan's secrets rule said API credentials only.

## Repository facts found by the planner (2026-09-24, HEAD `76497c4`)
- `hashRouter.base()` (`app/src/ports/router.ts`) is `href` up to `#`
  minus a trailing `index.html`: with `?as=gm1` in the URL the base keeps
  `index.html?as=gm1`, so links the app writes on a signed-in test page
  carry the query. Deterministic; noted in `plan.md` section 3 item 6.
- Vitest's default mode is `test`, the same word as `vite build --mode
  test`; the test build must be gated on `command === 'build'` too.
- `vite.config.mts`'s `artwork()` and `noscriptData()` plugins hard-code
  `dist/`; `tests/app/lib.js` guards and serves `dist/` at require time and
  `tools/smoke-http.mjs` reuses its server - hence `tests/app/serve.js`.
- `previews.yml` commits `tools/tg-preview/state.json` to `main` after
  every green `check` run on `main` and every four hours (`git push origin
  HEAD:main` from a detached checkout of `origin/main`), so `main` moves
  under any release longer than a CI cycle.
- `e1d7a4b` edits the same `.claude/README.md` "Cloud sessions" paragraphs
  `B1.1` rewrites; cherry-picking it first avoids the owner's conflict.
- Rule 2o (`bash-guard.mjs`) allows any push of the current branch; no
  hook forbids a push before closeout - that is prose in `CLAUDE.md` only.
- `tests/app/states.js` has 34 cases in a `CASES` array; `golden.js`
  compares the header lines (`# id`, `# route:`, `# why:`) byte for byte,
  so a new header line may appear only on states that set it.
- No `tests/e2e/`, no `supabase/migrations/`, `applied.json` is
  `{ "prod": [], "test": [] }`.

## Key paths
- Roadmap: `issues/persistent-storage/plan.md`, `handoff.md`, `context.md`
- Cloud facts: `.claude/README.md`, "Cloud sessions"; `.claude/cloud-setup.sh`;
  `.claude/hooks/session-start.mjs`, `bash-guard.mjs` rule 2o
- Specs: `docs/specs/META.md`, `STATE.md`, `FEATURES.md`, `COVERAGE.md`
- Code: `app/src/ports/`, `app/src/state/`, `supabase/`, `tests/app/`, `tests/db/`

## Command costs (this cloud host, 2026-09-24)

| Command | Wall clock | Fits one call? |
|---|---|---|
| `npm run check` | 111 s | yes |
| `npm run check:built` | 3 s | yes |
| `npm run check:db` | 30 s warm; 115 s with first image pull | yes |
| `node tests/run-all.js app/print,app/contracts,app/states,app/typo,app/hues,stub` | unmeasured here | - |
| `node tests/app/sweep.js <width>` | unmeasured here | - |
| `node tests/app/golden.js --shard=n/4` | unmeasured here | - |

## Which machine is authoritative
- Timings: this cloud host for this release (host rule: a whole release on
  one host). Sweep numbers here are advisory; CI is authoritative.

## Reasons already disproved
- "The step 20 `/rest/v1/` 401 shows the proxy adds no secret": disproved
  2026-09-24 by the `/auth/v1/user` controls above.

## Constraints
- Secrets never enter the repo, a task doc or chat; key names only.
- Public contracts default to no change.

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
- You suspect drift vs issue or plan
