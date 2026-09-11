# Handoff - TASK tg-preview-refresh

Recovery state for the next session. Read `CLAUDE.md`, then
`issues/tg-preview-refresh/context.md`, then `plan.md`, then this file.

## Status
- Task status: **All code work is complete. B1, R1 and R2 are implemented,
  committed and gated. The task is parked waiting on O1, which no agent can
  perform** - it needs a phone, a Telegram login, and repository settings,
  and per `context.md` ("Telegram will not issue a login code yet") the
  owner's throwaway account cannot retry before **2026-09-16** at the
  earliest, and ageing is not guaranteed to fix it. Nothing else in this task
  is blocked on anything an agent can do; the next session on this task
  should re-read `context.md` for whether O1 produced evidence before
  assuming there is a code batch to run.
- Both owner questions were answered before dispatch (see `context.md`); the
  design in `plan.md` was followed as written, with a handful of small gaps
  filled in during B1 implementation - see "Deviations" below. A reviewer
  then approved the design, the pure logic, all six of B1's deviations, and
  the docs, and raised seven risks and five nits against
  `.github/workflows/previews.yml`; four were blockers and were fixed in R1,
  the rest are Deferred below for B2. R2 is a small, evidence-driven
  follow-up (not part of the reviewer's findings) - see "R2" below.
- Last agent: implementer (2026-09-11), batch R2 (login.mjs diagnostics for
  O1's retry, driven by the owner's first O1 attempt).
- NEEDS_HUMAN_CONFIRMATION: no.
- Branch: `automation/tg-preview-refresh`, in the dedicated worktree
  `E:/dev/daggerheart-loot-wt/tg-preview-refresh`, HEAD now the R2 commit on
  top of the R1 commit on top of `cce10cb`. **Not merged, not pushed** -
  pushing and merging are the owner's call (`CLAUDE.md`), and merging should
  wait for issue 47's B7 to land in the main checkout, per the original
  dispatch note in `context.md`.
- The worktree's `node_modules` (root) and `tools/tg-preview/node_modules`
  (nested) both exist from this session's `npm ci` / `npm install`; both are
  gitignored and neither was committed.

## Completed
- Batch: **B1 - the refresh tool, its workflow and its runbook**, one commit.
- Commit: `feat(tooling): refresh Telegram link previews after deploy` on
  `automation/tg-preview-refresh`. Files: `.gitignore`, `README.md`,
  `README.ru.md`, `docs/specs/COVERAGE.md`, `docs/specs/META.md`,
  `package.json` (scripts only), `.github/workflows/previews.yml`,
  `docs/tg-preview.md`, `tools/tg-preview/{package.json,package-lock.json,
  lib.mjs,lib.test.mjs,manifest.mjs,live.mjs,client.mjs,run.mjs,login.mjs}`,
  and this task's `context.md`/`plan.md`/`handoff.md`. No `state.json` was
  created or committed (correct - the owner's first run creates it, O1).
  Root `package-lock.json`, `ci.yml`, `i/`, `og/`, `data.js` untouched.
- `teleproto@1.229.0` held up with no fallback needed. Installed clean (12
  packages, `npm audit --audit-level=high`: 0 findings) and its API matched
  `context.md`'s introspection exactly: `TelegramClient` with
  `start/connect/disconnect/sendMessage/getMessages/getEntity/
  isUserAuthorized`, `sessions.StringSession` (`load`/`save`/`delete`), and
  every named error class (`FloodWaitError`, `SlowModeWaitError`,
  `PeerFloodError`, `AuthKeyUnregisteredError`, `SessionRevokedError`,
  `SessionExpiredError`, `SessionPasswordNeededError`, `AuthKeyInvalidError`,
  `RPCError`) present as constructors. The `telegram@2.26.22` fallback in
  `plan.md` section 10 was not needed.

## Deviations and rationale
Small gaps in the plan's sketch, filled in during implementation; none
change the design in `plan.md` sections 3-7, all recorded here per
`CLAUDE.md`'s "smallest change" posture:

1. **`buildManifest`'s return gained a `site` field** (`{ site, urls,
   missing }` instead of the sketched `{ urls, missing }`). `stale()` needs
   to tell a state recorded for a foreign site from a real match, and
   nothing else in the plan supplies that comparison value to `stale()`
   directly. Kept as an additive field on an already-plain object; nothing
   in the plan depended on the shape being exactly `{urls, missing}`.
2. **`lib.mjs` never imports `derived.js`/`build-share-pages.js`.** The
   architecture note in `plan.md` section 4 assigns those `require()`s to
   `manifest.mjs` only; `lib.mjs`'s `urls(records, site)` and
   `buildManifest({site, L, ...})` take the flat record list (`L` = what
   `everything(window.LOOT)` produces) as a plain argument rather than
   reaching for `everything` themselves. `manifest.mjs`'s `buildFromTree`
   does that call and passes the result in. This is what makes `lib.mjs`
   testable with a two-record fixture instead of the real 1061-record
   catalogue for every `buildManifest` test.
3. **`--limit N` counts messages, not URLs** - the plan states this exactly
   in section 5.1 ("sends at most N messages"), but section 3.7's bullet
   ("`--limit 1` sends one") reads ambiguously against a naive URL-count
   reading. Implemented as messages throughout (`batches.slice(0, limit)`);
   `lib.test.mjs`'s `--limit` test asserts the invariant
   (`sent.length + pending.length === total`) rather than a hard-coded
   count, so it holds under either reading.
4. **The pace/reply-wait fold (section 3.4)** is implemented literally: the
   loop sleeps `PACE_MS` immediately after `cx.send()`, then calls
   `cx.lastReply(sentAt)` where `sentAt` is the timestamp captured *before*
   the send - not after the pace sleep. Getting this backwards (as an
   earlier draft in this same session did, caught before committing) would
   have made every real reply arrive "before" the comparison timestamp and
   look absent.
5. **`client.mjs`'s `ensureStarted` behaviour lives inside `createClient`**,
   not as a separate call `runRefresh` makes. Section 5.5 describes
   `ensureStarted()` and `lastReply()` against the raw teleproto client, but
   section 4 fixes the port's surface at exactly three methods (`send`,
   `lastReply`, `close`). `createClient` resolves the `WebpageBot` peer and
   sends `/start` if the chat history is empty as part of connecting, before
   returning the three-method object - so `runRefresh` never sees a peer or
   a raw client, matching the port boundary in section 4 exactly.
6. **`applyResult`'s return omits `updatedAt`**; `run.mjs`'s `--apply`
   branch and `writeState` both stamp it at write time. `applyResult`
   itself takes no clock, matching lib.mjs's "no clock" rule (section 4)
   more literally than the sketched three-argument signature otherwise
   would allow.

None of these needed a fallback or touched anything outside
`tools/tg-preview/`.

## R1 - review remediation, blockers only

A reviewer read B1's commit (`.github/workflows/previews.yml`,
`tools/tg-preview/**`, `.gitignore`, docs) and raised seven risks and five
nits, all against the workflow file or `.gitignore` - none against the pure
`lib.mjs`/`client.mjs`/`manifest.mjs` logic, which was approved as-is. Four of
the seven risks were blockers; this batch fixed exactly those four, in one
commit, and touched no other file. The remaining three risks and all five
nits are recorded verbatim enough to act on in "Deferred" below.

Fixed, all in `.github/workflows/previews.yml` unless noted:

1. **`git checkout -q --detach origin/main` in `Record what was refreshed`
   aborted in the exact race it exists for.** After any real send,
   `tools/tg-preview/state.json` is always locally modified, so a plain
   `git checkout` to a different commit refuses to switch when that tracked
   file differs between HEAD and the target - Actions' `bash -e {0}` then
   kills the step, `result.json` is never recorded, and the next run
   re-sends everything just sent. Fixed by adding `-f`:
   `git checkout -q -f --detach origin/main`. Discarding the worktree copy is
   correct here - the immediately following `--apply` rebuilds state from
   `origin/main`'s file plus `result.json`.
2. **The state read in `Refresh` truncated before it could fail.**
   `git show origin/main:tools/tg-preview/state.json > tools/tg-preview/state.json
   2>/dev/null || true` redirects onto the destination file before `git show`
   runs, so any failure (network hiccup, path briefly missing) leaves
   `state.json` empty rather than unchanged; `readState` swallows the
   `JSON.parse` throw and returns `{}`, every one of the ~1062 URLs becomes
   stale, and a fresh throwaway account fires 107 messages straight into
   `PEER_FLOOD` - the exact outcome the rate-limit design exists to prevent.
   Fixed by reading into `$RUNNER_TEMP/state.json` first and `mv`-ing it into
   place only on success, with a comment explaining why (kept in the file's
   existing comment style, per the review's own instruction not to let this
   get "simplified back"); the `|| true` bootstrap case became an `if/else`
   with an explanatory `echo` on the missing-state branch.
3. **The full-account credential (`TG_API_ID`, `TG_API_HASH`, `TG_SESSION`)
   sat in job-level `env:`**, so it was present in the environment of
   `actions/checkout`, `npm ci`, `npm audit`, and the commit/push step, none
   of which need it. Moved to step-level `env:` on exactly the two steps that
   use them - `Secrets present?` and `Refresh`. `MODE`, `DRY_RUN`, and
   `LIMIT` stayed at job level, since `Record what was refreshed`'s `if:`
   reads `env.DRY_RUN` and moving them would have broken that condition.
4. **`.gitignore` did not cover `local.env`.** It had `.env` and `.env.*`,
   neither of which matches a bare `local.env` (no leading dot) - the owner
   already has one in this worktree, protected only by a local `info/exclude`
   entry that travels to no other machine. Added `*.env` alongside the
   existing two patterns, extending the existing comment rather than adding
   a second block (`.env.*` stays, since it still catches `.env.local`,
   which `*.env` alone would not).

## Verification
- Commands run (exact) and results:
  - `node --test tools/tg-preview/lib.test.mjs` - 46/46 passed, both with
    `tools/tg-preview/node_modules` present and after temporarily removing
    it (proving the pure suite needs no install).
  - `node tools/tg-preview/run.mjs --dry-run --mode full` - printed
    `1062 urls, 107 messages`, exit 0, wrote nothing (`git status` clean
    apart from this batch's own new files both before and after).
  - `node tools/tg-preview/run.mjs --dry-run --only w76,root` - printed
    `2 urls, 1 messages`, exit 0.
  - `node tools/tg-preview/run.mjs --limit 1` with no `.env` and no repo
    secrets - printed `missing required env vars: TG_API_ID, TG_API_HASH,
    TG_SESSION` (names only, confirmed by inspection - no value ever
    appears) and exited 2.
  - `node tools/tg-preview/run.mjs --apply <result.json> --state
    <state.json>` against a scratch state holding one foreign entry and a
    scratch result touching a different URL - the resulting state kept the
    foreign entry untouched and took the result's value for its own URL
    (manually inspected; also covered by `lib.test.mjs`'s `applyResult`
    suite).
  - `npx prettier --check .github/workflows/previews.yml` - clean; the file
    was written already matching Prettier's style, `--write` made no
    change.
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` (Bash timeout
    600000), run three times: the first two runs (one piped correctly, one
    mistakenly redirected to a file for a side inspection - **not** a valid
    gate arm, noted so the mistake isn't repeated) both surfaced the same
    flake: `app/src/components/searchPage.test.ts > the cap > shows the
    first 300 matches, and select-all ticks all 300` timing out at 30000ms
    under this machine's load (`context.md` records ~28 peer sessions on
    this host). Confirmed unrelated to this batch: the test passes in 6.5s
    run alone (`npx vitest run src/components/searchPage.test.ts -t
    "shows the first 300 matches" --root .` from `app/`), and nothing in
    this batch touches `app/**`. A third, correctly-piped run passed
    clean: **39/39 test files, 947/947 vitest tests, 46/46 `node --test`
    tests, format/lint/typecheck/data/derived/i18n/hooks-selftest all
    green.** This third run is what the commit is staged against.
- Gates: `npm run check` is B1's only required gate (`plan.md` section 8;
  confirmed - nothing under `index.html`, `app.js`, `style.css`,
  `app/src/**`, `og/`, `i/`, `data.js`, `tests/parity/**` changed). Not run:
  `check:built`, parity - both correctly out of scope for this batch.

### R1 verification
- `npx prettier --check .github/workflows/previews.yml` - clean.
- `set -o pipefail; npm run check 2>&1 | tail -n 120` (Bash timeout 600000,
  single foreground call) - the arming run: format/lint/typecheck/data,
  `node tests/derived.js`, `node tests/i18n.js`, hooks selftest (292 passed),
  `node --test tools/tg-preview/lib.test.mjs` (46/46), and `npm run test`
  (vitest: **39/39 test files, 947/947 tests**) all green, no failures
  visible in the tail. No `searchPage.test.ts` flake this time - host load
  was apparently lower than during B1's run.
- A second run, piped to a log file for full-output inspection only (not a
  valid gate arm per this task's own instructions - noted so it is not
  mistaken for the one that counts), confirmed the same result with nothing
  hidden above the `tail -n 120` cutoff: every step from `format:check`
  through `test` passed, same 947/947 and 46/46 counts.
- `git status` after `npm run check` (which regenerates `i/*.html`,
  `data.json`, `catalog.csv` via the `data` step): clean except the two
  intended files - the regenerated outputs matched the committed state
  exactly, confirming this batch needed no `tools/build.js` re-run.
- Diff scope confirmed via `git diff --stat` before staging: exactly
  `.github/workflows/previews.yml` (+19/-5) and `.gitignore` (+2/-0) -
  nothing under `tools/tg-preview/**`, `docs/tg-preview.md`, `ci.yml`, or any
  spec touched, per the batch's explicit boundary.

## R2 - login.mjs diagnostics, driven by the owner's first O1 attempt

Small, contained follow-up. Not one of the R1 review's deferred items; driven
by real evidence from the owner's first attempt at O1 step D.3, recorded in
`context.md`'s "Telegram will not issue a login code yet" section. Touched
exactly three files, none of the files the dispatch named off-limits
(`tools/tg-preview/lib.mjs`, `run.mjs`, `manifest.mjs`, `live.mjs`,
`client.mjs`, `previews.yml`, `ci.yml`, no spec).

1. **`tools/tg-preview/login.mjs` reports the delivery channel.** The
   `phoneCode` callback teleproto calls already receives `isCodeViaApp`
   (confirmed by reading `teleproto`'s `client/auth.d.ts`/`auth.js` in
   `node_modules` - `phoneCode: (isCodeViaApp?: boolean) => Promise<string>`,
   sourced from `sendCodeResult.isCodeViaApp`); the callback previously
   ignored it. Now it prints, before asking for the code: in-app -> the
   throwaway account's `Telegram` service chat (from `777000`), no SMS will
   arrive while that session exists; otherwise -> the phone's texts and its
   call log (a missed call's last digits can be the code). Still prints only
   `TG_SESSION=<...>` as its stdout result line and writes no file.
2. **`tools/tg-preview/login.mjs` gained `--sms`** (`process.argv.includes('--sms')`),
   passed as `forceSMS` in the `client.start()` options object (confirmed
   against `UserAuthParams.forceSMS?: boolean` in `auth.d.ts`). Documented in
   the file's header comment: on the owner's number this returned
   `SEND_CODE_UNAVAILABLE`, so it is a last resort; reaching
   `auth.ResendCode` at all proves the first send used a non-SMS channel.
   Default stays off (flag absent -> `forceSMS: false`).
3. **`docs/tg-preview.md` gained a troubleshooting block inside step D.3**
   (not a new top-level step, to keep it next to the command it explains):
   what the owner saw, what it means, what to do - age the account and retry
   once, not in a loop, and the three fallbacks from `context.md` if ageing
   fails (manual-paste mode - not built; the owner's own long-standing
   account for local runs only; a different SIM). States plainly that ageing
   is not guaranteed to work, per `context.md`.

Also staged `issues/tg-preview-refresh/context.md` - the orchestrator's own
write of the "Telegram will not issue a login code yet" section, left
unstaged by the previous session, which is the entire reason for this batch
and belongs in the same commit.

Coverage: checked before touching the file. `login.mjs` is interactive and
network-bound (asks for phone/code/password over a live MTProto connection);
it was already outside every coverage mechanism and stays that way - vitest's
`coverage-v8` is scoped to `app/src/**` only (`root: 'app'` in
`vite.config.mts`), and `tools/tg-preview/lib.test.mjs` (the `node --test`
step) does not import `login.mjs` and carries no coverage threshold of its
own (`docs/specs/COVERAGE.md`: "`client.mjs`... and `live.mjs`... deliberately
outside it"; `login.mjs` was already implicitly in that same category and
this batch changed nothing about that). No test was added or needed for the
new code; none was invented to satisfy a threshold that does not apply.

### R2 verification
- `node --check tools/tg-preview/login.mjs` - syntax OK.
- `npx eslint tools/tg-preview/login.mjs` - 0 errors (1 "file ignored"
  warning: `tools/**` is excluded from ESLint's config, same as every other
  file under `tools/`, unrelated to this change).
- `npx prettier --check docs/tg-preview.md issues/tg-preview-refresh/context.md`
  - clean (`tools/` stays outside Prettier's scope per `.prettierignore`,
    same as B1/R1).
- `git diff --stat` before staging: exactly `docs/tg-preview.md` (+25),
  `issues/tg-preview-refresh/context.md` (+52), `tools/tg-preview/login.mjs`
  (+30/-1) - nothing else in the tree touched.
- `set -o pipefail; npm run check 2>&1 | tail -n 120` (Bash timeout 600000,
  single foreground call) - clean: `node --test tools/tg-preview/lib.test.mjs`
  46/46 passed (unaffected by this change, confirming `login.mjs` stayed
  outside it), then `npm run test` (vitest): **39/39 test files, 947/947
  tests**, coverage summary printed with no threshold failures (96.27%
  statements / 88.53% branches / 96.67% funcs / 97.01% lines - `src/**`
  only, `tools/tg-preview/**` not in scope). No `searchPage.test.ts` flake
  this run. This is the run the commit is staged against.
- Manual read-through only for the interactive path itself (asking for a
  phone/code/live Telegram round trip is exactly what O1 needs and no agent
  has the credentials or phone to drive) - confirmed by inspection that
  `phoneCode`'s two branches are mutually exclusive on `isCodeViaApp`'s
  truthiness and that `forceSMS` defaults to `false` when `--sms` is absent
  from `process.argv`.

## Next batch
- Name: **O1 - the owner's operations** (`plan.md` section 9, `docs/tg-preview.md`
  "Setup, start to finish"), not a code batch. No agent can perform any of
  it - it needs a phone, a Telegram login, and repository settings. Steps
  A-J: the throwaway account, `my.telegram.org` credentials, saying hello to
  the bot by hand, `npm ci` + `login.mjs` + dry runs locally, the first real
  message (and the regression check that already-posted messages update -
  `docs/tg-preview.md` step F.4), the full reindex, the three repository
  secrets, the first CI dispatch. The owner's first attempt reached step D.3
  and could not get a login code (see `context.md`); R2 above gives the retry
  better diagnostics, but the retry itself still needs the account aged past
  **2026-09-16** and is still the owner's to run.
- After O1 produces evidence: **B2 - tuning from the first real run**
  (`plan.md` section 10, outline only) - whether ten links per message are
  honoured, the bot's real flood behaviour, its reply vocabulary - **plus**
  the R1 review's deferred items below, which do not need O1's evidence and
  can be picked up independently. May turn out non-empty even if the tuning
  half is empty.
- Before either: **merge `automation/tg-preview-refresh` into `main`**, the
  owner's call, and per the original dispatch note this should wait until
  issue 47's B7 (the print slice) lands in the main checkout - this branch
  and B7 never touched the same files, so ordering is about not complicating
  the merge, not about a real conflict.

## Blockers
- None for B1, R1 or R2.
- The branch is not merged and not pushed - `main` gains nothing from any
  batch until the owner merges it (see "Next batch").
- **O1 cannot start before 2026-09-16** (`context.md`, "Telegram will not
  issue a login code yet") - the owner's throwaway account and `api_id` were
  denied a login code on the first attempt, diagnosed as Telegram withholding
  codes from third-party `api_id`s on a new account; the owner's decision was
  to age the account and retry no earlier than that date, and not in a loop.
  Ageing is not guaranteed to fix it (`context.md` is explicit about the
  uncertainty). No agent can perform or accelerate this.

## Deferred
- B2 - tuning from the first real run; may be empty.
- **R1 review findings, deferred by the dispatch (explicitly out of scope for
  R1, not fixed in this session), recorded verbatim enough for B2 to act on
  without re-reading the review:**
  1. The flood-wait deadline check - a risk in the review, not yet detailed
     further here; re-derive from the review or ask the owner if it resurfaces.
  2. `live.mjs`'s cached rejected promises.
  3. Missing `NaN` guards on `--limit`/`--budget-minutes`.
  4. `sinceMs` is not floored.
  5. `$args`/`$LIMIT` are unquoted in the workflow's shell steps.
  6. The unused `urls()` export (in `lib.mjs`, per B1's `Deviations` item 2 -
     `manifest.mjs`'s `buildFromTree` calls it, but nothing else does; the
     review flagged it as dead surface, not a bug).
  7. The `--apply` branch's needless `buildFromTree()` call - it rebuilds
     the whole manifest to apply a result that only needs the state file and
     `result.json`.
  8. The dry-run counts wording (imprecise phrasing in a dry-run summary
     line - cosmetic, not a correctness issue).
  9. A `docs/tg-preview.md` sentence about what turns the CI job red is
     imprecise given the actual `if:` conditions in
     `.github/workflows/previews.yml`.

  R1 fixed only the four blockers (checkout `-f`, the state-read truncation,
  moving credentials to step-level `env:`, and `*.env` in `.gitignore` - see
  "R1 - review remediation" above). None of the nine items above were
  touched; `tools/tg-preview/**`, `docs/tg-preview.md`, and `ci.yml` are
  untouched by R1 per the dispatch's explicit boundary.
- One pointer line in `CLAUDE.md` ("Data and published artefacts") and in
  `.claude/prompts/refresh-artwork.prompt.md` - orchestrator's call, not
  taken in B1 (`CLAUDE.md` was explicitly out of scope for this batch).
- Issue 47 cut-over checklist: keep `page()` importable from wherever the
  stub generator ends up, or repoint `manifest.mjs`'s two `require()`s;
  decide whether `og/` stays a source asset or the tool gets `--assets
  dist` (the flag already exists and is wired through `buildFromTree`,
  unused until then).
- Other messengers: not this task.

## Notes
- Mocks path: none (no UI; this batch is tooling and CI).
- Screenshot findings: none.
- Cleanup performed / retained artifacts: none needed - no scratch state
  files were left in the tree; the manual `--apply` verification above used
  files under this session's scratchpad directory, outside the repository.
- An untracked `local.env` file was present in the worktree at the start of
  this session (not mentioned in `context.md`/prior `handoff.md`). Inspected
  before touching anything else: it held no credential, only a
  tab-separated fragment of `plan.md`'s own secrets table, not a real
  `KEY=value` pair. Left untouched, never staged. It is gone from `git
  status` by the end of this session (unclear how; possibly cleaned up by
  another process on this host) - noted in case it resurfaces.
- Session end partial progress: none - B1 is complete and committed.

### R1 notes
- Mocks path: none. Screenshot findings: none.
- The dispatch for R1 stated `local.env` "has already been created in this
  worktree" (referring to B1's own note above). At R1's start it was not
  present (`ls local.env` - no such file; `git status --ignored` does not
  list it either) - consistent with B1's note that it disappeared by that
  session's end for an unclear reason. `.gitignore`'s new `*.env` line
  covers it regardless of whether or when it reappears.
- Cleanup performed / retained artifacts: none - no scratch files left in
  the tree.
- Session end partial progress: none - R1 is complete and committed.

### R2 notes
- Mocks path: none. Screenshot findings: none.
- No `local.env` or any other stray file present at this session's start;
  `git status` was clean apart from the pre-staged `context.md` edit named in
  the dispatch.
- Verified via `node_modules` introspection (not assumed from memory) that
  `teleproto`'s `phoneCode` callback signature and `UserAuthParams.forceSMS`
  match what the dispatch described - `tools/tg-preview/node_modules/teleproto/client/auth.d.ts`
  and `auth.js`.
- Cleanup performed / retained artifacts: none - no scratch files left in
  the tree.
- Session end partial progress: none - R2 is complete and committed.
