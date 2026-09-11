# Plan - TASK tg-preview-refresh

Refresh Telegram's cached link previews for every share URL of the site: one
full reindex, then incremental refreshes after each deployment, driven by what
actually changed. One mechanism, two callers (CI and the owner's machine).
Local-only task id; no GitHub issue. Read `context.md` first, then this file,
then `handoff.md`.

Planner pass 2026-09-11. The four owner decisions in `context.md` (task id,
both callers, a dedicated throwaway account, survive issue 47's cut-over) are
taken as settled and are not re-opened here. Two questions need the owner
before implementation starts: section 11.

## 1. Objective and current state

`og/<id>.jpg` bytes were rewritten under unchanged URLs three times
(`8e7fed1`, `ce0c414`, `37ecc8d`). Telegram keys its preview cache on the
page URL, has no TTL, and ignores everything the origin serves, so every
share link that was ever unfurled still shows the old picture. Nothing at the
app level can fix that (`context.md`, "Reasons already disproved"); the
refresh has to be pushed to `@WebpageBot`, and `@WebpageBot` is a bot, so the
pusher has to be a user account over MTProto.

Scale at `8b96ff4`: 1061 stubs `i/<id>.html` + the site root = **1062 URLs**,
847 `og/*.jpg`. The bot's only published batch figure is 10 links per message.

What exists today and is reused as-is:

- `data.js` -> `window.LOOT` is the canonical id list; `tools/derived.js`
  exports `everything(L)` (items + equipment, 1061 records) and `SITE`.
- `tools/build-share-pages.js` exports `page(it)`, which renders one stub
  into memory - the derived test already uses it that way. The stub's
  `og:image` is `SITE + 'og/' + <img>.jpg` (or `og/_none.jpg`).
- `index.html` carries the root's own OG block with `og/_share.jpg`.
- `.github/workflows/ci.yml`: `deploy` is green on push to `main`, publishes
  an explicit file list into `_site/`, and its `Nothing private slipped in`
  guard refuses `package.json node_modules app tests tools docs .git`.
- Node 24 (`.nvmrc`), which has `fetch`, `node:test`, `node --test` and
  `process.loadEnvFile` built in - no new dependency for any of those.

## 2. Scope and non-goals

In scope: a repo tool under `tools/tg-preview/` that derives the URL set from
`data.js`, fingerprints what Telegram would see, keeps a committed state file
of what was last refreshed, sends the stale URLs to `@WebpageBot` with pacing
and flood handling, and resumes after a crash; a second workflow file that
runs it after every successful deploy and on demand; the owner's runbook.

Out of scope, on purpose:

- Any change to `i/<id>.html`, `og/*.jpg`, `noindex`, `robots.txt`,
  `llms.txt`, `docs/fixtures/` or `tests/contracts.js`. The public contract
  does not move.
- A hosted service, a webhook, a backend (`META.md` section 3).
- Other messengers (Discord, WhatsApp, Slack). Their caches differ and none
  has a refresh bot; not this task.
- Parsing `@WebpageBot`'s replies for control flow. The vocabulary is
  unverified; replies are logged verbatim (section 5.5) and nothing more.
- Refreshing the previews of messages that were already posted, if Telegram
  does not do that - section 11, Q1.

## 3. The eight decisions

### 3.1 The client: `teleproto` from a repo script, not `WebpageBot-api`

**Decision.** A Node script in `tools/tg-preview/` talks MTProto directly
through **`teleproto`** (`npm view`: 1.229.0, modified 2026-08-25, MIT,
engines node >= 18). It is the maintained fork of gramjs (`telegram`), which
npm now marks *archived, development continues in teleproto*, with the same
public surface: `TelegramClient`, `sessions.StringSession`,
`client.start/connect/sendMessage/getMessages/getEntity`, `errors.RPCError`,
`errors.FloodWaitError` (`.seconds`), `errors.PeerFloodError`,
`errors.SessionRevokedError`, `errors.AuthKeyUnregisteredError`,
`errors.SessionPasswordNeededError` - all verified by introspection on
2026-09-11.

Measured in a scratchpad on this host (2026-09-11):

| package | packages installed | `npm audit --audit-level=high` | native build | install |
|---|---|---|---|---|
| `teleproto@1.229.0` | 12 | 0 vulnerabilities | none | 2 s |
| `telegram@2.26.22` (gramjs) | 46 | 0 vulnerabilities | `bufferutil`/`utf-8-validate` via prebuilds (no compile here) plus an `es5-ext` postinstall | 3 s |

**Where it lives: a nested package `tools/tg-preview/package.json` with its
own lockfile**, installed only by the refresh job (`npm ci` in that
directory) and by the owner. Not a root `devDependency`, for two reasons:

1. A high finding in an MTProto client would otherwise turn the site's
   `audit` job red and block every deploy of a static site that does not
   ship the client. The refresh job runs its own
   `npm audit --audit-level=high` against the nested lockfile, so the
   posture is the same, but a red there fails only the refresh.
2. `npm ci` on every CI job and every developer machine should not grow by a
   Telegram client nobody there uses.

The app's bundle is untouched either way (nothing under `app/` imports it),
so `npm run budget` is unaffected. `node_modules/` in `.gitignore` already
matches the nested install. ESLint and Prettier both ignore `tools/**`, so
the script is neither linted nor format-checked, same as every sibling in
`tools/`.

**Rejected: `my-telegram-bots/WebpageBot-api`.** It is a long-running Koa
service with an HTTP shim (`POST 127.0.0.1:2344`), its own `npm run login`
and its own session store. A CI step wants one process, one exit code and a
summary; it would have to start the service, wait for the port, POST, poll,
and kill it, and the service's dependency tree would sit outside every gate
this repository has. It offers no batching, pacing, flood handling or
resumability, which are the actual design problems at 1062 URLs. Everything
it does for us is one `sendMessage` call.

**Rejected: `telegram` (gramjs) itself** - archived upstream; four times the
dependency count; two packages with install scripts. Same API, so the choice
costs nothing if it ever has to be reversed.

**Rejected: `@mtcute/node`** (`better-sqlite3` native dependency, wasm;
heavier in CI) and **`@mtproto/core`** (low level: no `start()` login flow,
no session string helper; the owner would hand-roll the auth flow).
**Rejected: TDLib bindings** (a native binary per platform).

### 3.2 URL discovery: from `data.js`, through `tools/derived.js`

```text
urls(L) = [ SITE ]                                   // the root, og/_share.jpg
        ++ everything(L).map(it => SITE + 'i/' + it.id + '.html')
```

`everything` and `SITE` are `tools/derived.js`'s own exports; nothing reads
`i/`. Count at `8b96ff4`: 1062, and the unit test pins it against the real
`data.js` the way `tests/derived.js` pins the catalogue.

The root is in the set because a shared app link
(`https://artex-x.github.io/daggerheart-loot/#/i/w76`) is, to Telegram, the
root URL - fragments never reach the crawler - and its picture is
`og/_share.jpg`.

**After issue 47's cut-over.** The set depends on `data.js` and the site
base only. The stub *content* (section 3.3) is rendered in memory through
`tools/build-share-pages.js`'s exported `page(it)`, so it needs no `i/` on
disk; if the generator moves into the Vite build at cut-over, the one
`import` in `tools/tg-preview/manifest.mjs` moves with it and nothing else
changes. `og/` is a source asset today (`vite.config.mts` links it into
`dist/`); should it ever become a build output, `--assets <dir>` points the
hasher at that directory instead of the repository root. Recorded for the
issue 47 cut-over checklist in `handoff.md`, "Deferred".

### 3.3 Change detection: a committed fingerprint state, written by both callers

**What is fingerprinted.** Telegram's preview is built from three things:
`og:title`, `og:description`, `og:image` - and the *bytes* behind
`og:image`, which is the whole root cause. So, per URL:

```text
meta        = extractMeta(html)        // { title, description, image } from <meta property="og:...">
imageSha    = sha256(bytes of og/<basename of meta.image>)
fingerprint = sha256(JSON.stringify([meta.title, meta.description, meta.image, imageSha])) (hex)
```

For a stub, `html` is `page(it)` rendered in memory; for the root it is
`index.html` read from disk. Everything outside those three tags - the
stub's CSS, the redirect, the body - is deliberately ignored, so a generator
edit that does not touch the preview refreshes nothing. Hashing the stub HTML
alone is insufficient (`context.md`, root cause); hashing whole files would
turn a CSS tweak into a 1062-URL reindex.

The same `fingerprint` function runs against **fetched** bytes in the live
check (section 5.3), which is what makes "the CDN serves what I hashed"
checkable with no second implementation.

**Where the state lives: `tools/tg-preview/state.json`, committed on
`main`.**

```json
{
  "version": 1,
  "site": "https://artex-x.github.io/daggerheart-loot/",
  "updatedAt": "2026-09-11T12:34:56Z",
  "urls": {
    "https://artex-x.github.io/daggerheart-loot/": "3f...",
    "https://artex-x.github.io/daggerheart-loot/i/a1.html": "9c..."
  }
}
```

Keys sorted, two-space JSON, trailing newline; ~120 KB at 1062 entries. It
records the fingerprint *as last successfully sent to `@WebpageBot`*, not the
fingerprint in the tree - that difference is what makes it a refresh log
rather than a derived file.

- **Bootstrap.** No file, or a file whose `site` differs, means every URL is
  stale. The first run is therefore a full reindex without a flag.
- **Loss.** Deleting the file is the recovery path for "I do not trust the
  state": the next run reindexes everything. `--mode full` does the same
  without touching the file first.
- **Who writes it.** A local run writes it through (after every sent
  message - section 5.4). The CI job commits it back to `main` after the run
  (section 3.5). Both callers read it from the tree they run in; CI reads the
  freshest `main`, not the deployed sha, before committing (section 6).
- **Deleted records.** A URL in the state but not in the manifest is dropped
  on the next write. Nothing can be refreshed to for a stub that no longer
  exists, and the contract forbids renumbering anyway.

**Rejected: `git diff -- i/ og/`.** Disallowed by the owner as the only
mechanism (`context.md`, decision 4) - it stops working the day `i/` is a
build output, and it cannot tell "changed since the last *successful*
refresh" from "changed since the last commit".

**Rejected: Actions cache.** Evicted after seven days unused and at 10 GB;
the loss mode is a silent full reindex, which is the flood risk this task is
about. Fine for a backlog, wrong for the record.

**Rejected: publishing the manifest on the Pages site.** The refresh must
run *after* the deploy that changed the bytes (or Telegram re-fetches the old
ones), so the site already carries the *new* manifest by the time the job
needs the *old* one; that forces a second store (an artifact) for the
baseline and a third for a backlog, and the owner's machine cannot write any
of them. Three stores where one file will do.

**Rejected: an orphan ref (`refs/tg-preview/state`) or a Release asset.**
Both keep `main` clean, both are invisible in the places the owner looks, and
both hand a smaller implementer git plumbing or a token dance to get wrong.
If the owner declines Q2 (section 11), the orphan ref is the named fallback
because it keeps one store for both callers.

### 3.4 Rate limiting and resumability

Constants (all in `lib.mjs`, one place, tunable after the first real run):

| name | value | why |
|---|---|---|
| `PER_MESSAGE` | 10 | the bot's documented bulk figure |
| `PACE_MS` | 4000 + random(0..2000) | between messages; the reply wait (section 5.5) is folded into it, not added |
| `REST_EVERY` / `REST_MS` | 25 messages / 30 s | undocumented flood limits; a periodic pause is cheap insurance |
| `MAX_WAIT_S` | 600 (`--max-wait`) | the largest `FLOOD_WAIT` the run will sleep through; larger stops the run |
| `NET_RETRIES` | 3, 10 s apart | transport errors, not RPC errors |
| `BUDGET_MIN` | none locally; 45 in CI (`--budget-minutes`) | stop cleanly before the job's `timeout-minutes` kills the state commit |

Full reindex arithmetic: 1062 / 10 = 107 messages, ~5 s each, plus four
rests = **about 12 minutes** with no flood waits, plus the live check
(section 5.3, ~2-3 minutes for 1062 stubs and 847 images at concurrency 6).

`decide(error, ctx)` is a pure function that returns one of
`{ retry, waitMs }`, `{ stop, reason }`, `{ fatal, reason }`:

| error | outcome |
|---|---|
| `FloodWaitError`, `SlowModeWaitError` with `seconds <= MAX_WAIT_S` | retry the **same** message after `seconds + 2` |
| the same with `seconds > MAX_WAIT_S` | stop; reason names the seconds |
| `PeerFloodError` | stop: the account is limited; nothing more will go through today |
| `AuthKeyUnregisteredError`, `SessionRevokedError`, `SessionExpiredError`, `SessionPasswordNeededError`, `AuthKeyInvalidError` | fatal: the credential is dead, exit 2, do not retry |
| any other `RPCError` | stop; reason is `errorMessage` |
| non-RPC error (socket, DNS) | retry after 10 s, up to `NET_RETRIES`, then stop |

**Resumability is the state file.** The state is written after every
successful message, so a process that dies loses at most ten URLs of
progress, and the next run - local or CI, incremental - picks up exactly the
URLs that are still stale. There is no separate backlog file: *the backlog is
whatever the manifest says and the state does not*.

**When Telegram limits the run: exit green with a recorded backlog.** The
site is already live; a red job would say something false about it. The run
prints `refreshed N, pending M` with the pending URLs, writes the same to
`$GITHUB_STEP_SUMMARY` when set, and emits one `::warning::` when M > 0. The
next push, or a `workflow_dispatch`, continues from there. Only a dead
credential or a missing one (exit 2) or an unexpected crash (exit 1) turns
the job red - both are things a person has to fix.

### 3.5 Where it hangs in CI: a second workflow, `previews.yml`

**Decision.** `.github/workflows/previews.yml`, triggered by
`workflow_run` on the `check` workflow (`types: [completed]`,
`branches: [main]`), running only when
`github.event.workflow_run.conclusion == 'success'`, plus `workflow_dispatch`
with inputs `mode` (`incremental` | `full`), `dry_run` (boolean) and `limit`
(messages, empty = unlimited). It checks out
`github.event.workflow_run.head_sha` - the sha `deploy` just published - or
`github.sha` on a dispatch.

Why not a `needs: [deploy]` job inside `ci.yml`, although that is viable:

- A forced full reindex would otherwise mean a `workflow_dispatch` of the
  whole `check` workflow - fifteen minutes of check, four parity shards,
  audit and gitleaks - before the job we wanted, and `deploy` is `if: push`,
  so the job would need an `always()`-style condition to run at all.
- `contents: write` for the state commit would land in a workflow whose
  top-level permission is `contents: read` on purpose. A separate file keeps
  that permission on the one job that needs it.
- The refresh's own state commit carries `[skip ci]`, which GitHub honours
  for `push`-triggered workflows, so it starts neither `check` nor - since
  `workflow_run` only follows a run that happened - another `previews`. No
  loop.

`concurrency: { group: tg-previews, cancel-in-progress: false }`. Its own
group rather than `pages`: a refresh holding the `pages` group would queue
the next deploy behind up to 45 minutes of Telegram pacing, and the refresh
does not need exclusivity against a deploy - if a deploy changes bytes under
a running refresh, the live check (section 5.3) skips those URLs and the run
that deploy triggers picks them up. `cancel-in-progress: false` is kept so a
half-done refresh is never cut before its state commit.

**Allowed to fail the run?** The job is red only for exit 1 or 2 (crash,
missing or dead credential, a nested `npm audit` finding, a state push that
still fails after three attempts). A Telegram-side limit is green with a
warning. It never blocks a deploy: `deploy` finished before it started.

**When the secrets are not set** (before the owner's setup, or a fork), the
job notes it and exits 0 without installing anything.

### 3.6 Secret handling

Three repository secrets, three env vars, the same names everywhere:

| name | what | where |
|---|---|---|
| `TG_API_ID` | numeric app id from `my.telegram.org` | repo secret; `.env` locally |
| `TG_API_HASH` | 32-hex app hash from the same page | repo secret; `.env` locally |
| `TG_SESSION` | `StringSession` for the throwaway account - **a full-account credential** | repo secret; `.env` locally |

- Local store: **`.env` in the repository root**, read by
  `process.loadEnvFile('.env')` inside a `try` (a missing file is fine; CI
  has none). `.gitignore` gains `.env` and `.env.*` **in the same batch**.
  No `.env.example`: the names are documented in `docs/tg-preview.md`, and a
  file that exists only to be copied is a file nobody uses.
- Nothing echoes a value: the tool reads `process.env` into a config object
  and never prints it; the client's logger is set to error level; the dry run
  needs none of the three and prints URLs only; Actions masks its own secrets
  in logs anyway. The `secrets present?` step tests emptiness and prints a
  fixed sentence.
- Nothing lands in `_site`: `state.json` lives under `tools/`, which the
  `deploy` job does not copy and whose presence in `_site` the
  `Nothing private slipped in` guard already refuses. The allow-list holds
  unchanged; this batch does not touch `ci.yml`.
- gitleaks: a session string pasted into any tracked file would be a
  ~350-character base64 blob, which the default rules flag. Nothing to
  allowlist; `.gitleaks.toml` is untouched.
- Rotation: Telegram -> Settings -> Devices -> terminate the session, delete
  the secret, run `login.mjs` again (section 9, step J).

### 3.7 Verification, honestly

**What a test can assert** - all pure logic, under `node:test`, in
`tools/tg-preview/lib.test.mjs`, run by `npm run check`:

- `urls(L)`: 1062 against the real `data.js`, root first, unique, every
  other one `SITE + 'i/' + id + '.html'`.
- `extractMeta` on a real `page(it)` and on `index.html`.
- `fingerprint`: stable; changes on each of title, description, image URL,
  image bytes; unchanged when the body changes.
- `buildManifest` with an injected `readFile`: a missing image is reported,
  not thrown.
- `stale(manifest, state, mode)`: full, incremental, absent state, foreign
  `site`, a dropped record.
- `chunk`: 1062 -> 107 chunks, the last of two.
- `decide`: every row of the table in section 3.4.
- `runRefresh` with a fake client, fake clock, fake live check: sends in
  order; writes state after each message; `--limit 1` sends one; `--only`
  narrows; dry run sends and writes nothing; `FLOOD_WAIT` resends the same
  message once; `PEER_FLOOD` stops with the sent ones recorded; budget
  exhaustion stops; not-live URLs are excluded and reported; the summary
  numbers add up.
- `applyResult(state, result)`: ours wins, the rest is kept.
- `parseArgs`.

**What no test can assert:** that Telegram's cache changed. The network
client sits behind a three-method port (`send`, `lastReply`, `close`) in
`client.mjs`, and is the one file with no unit test; its surface is small
enough to read. A green job proves a message was accepted by Telegram's
API, nothing more.

**How the owner verifies a real refresh** (section 9, steps F and G):

1. Open the throwaway account's chat with `@WebpageBot` and read the bot's
   reply to the message the tool sent; the tool logs the same text.
2. In any Telegram chat (Saved Messages is enough), paste one refreshed URL
   and compare the preview picture with the live `og/<id>.jpg`.
3. For Q1: find an *old* message that already carried that URL and see
   whether its preview changed too.

Nothing in the tool's output stands in for step 2.

### 3.8 The owner's manual steps

Section 9. They are also copied into `docs/tg-preview.md` by B1 so they
outlive this task directory.

## 4. Architecture

```text
tools/tg-preview/
  package.json        private, "type": "module", dependency: teleproto
  package-lock.json   pinned; installed only here
  lib.mjs             pure: urls, extractMeta, fingerprint, buildManifest, stale,
                      chunk, decide, runRefresh, applyResult, parseArgs, constants
  lib.test.mjs        node:test over lib.mjs; imports nothing from node_modules
  manifest.mjs        composes lib with the repo: data.js, derived.js, page(), og/ reads
  live.mjs            fetch(url) -> fingerprint of the live page + its image
  client.mjs          the port over teleproto: createClient(env) -> { send, lastReply, close }
  run.mjs             the CLI: args, env, manifest, state, diff, live check, send loop, summary
  login.mjs           interactive, once: phone -> code -> 2FA -> prints TG_SESSION=...
  state.json          created by the first run; committed
.github/workflows/previews.yml
docs/tg-preview.md    the runbook (section 9 plus operations)
```

Boundaries, in the spirit of `CLAUDE.md`'s `lib`/`ports` split even though
this is tooling and not `app/src`: `lib.mjs` touches no network, filesystem,
clock or process - everything arrives as an argument (`readFile`, `client`,
`verify`, `sleep`, `now`, `writeState`, `log`). `run.mjs` is wiring. The
client is loaded lazily (`await import('./client.mjs')`) only when there is
something to send and it is not a dry run, so `npm run check`, a dry run and
a no-op run all work without `tools/tg-preview/node_modules`.

`manifest.mjs` reaches the CommonJS neighbours with
`createRequire(import.meta.url)`: `../derived.js` for `everything`/`SITE`,
`../build-share-pages.js` for `page` (it loads `data.js` into
`global.window.LOOT` itself when nothing has).

## 5. Behaviour of `run.mjs`

### 5.1 Arguments

```text
node tools/tg-preview/run.mjs [--mode incremental|full] [--dry-run] [--limit N]
     [--only id1,id2,...] [--max-wait S] [--budget-minutes M]
     [--state <path>] [--result <path>] [--assets <dir>] [--no-verify]
node tools/tg-preview/run.mjs --apply <result.json> [--state <path>]
```

- `--mode` default `incremental`. `full` ignores the state when choosing
  what to send (it still records into it).
- `--only` narrows to record ids (`root` for the site root). For the first
  real message and for a spot check.
- `--limit N` sends at most N messages, then stops green with the rest
  pending. `--limit 1` is the first real test.
- `--no-verify` skips the live check. For a machine without network reach
  to Pages, or an owner who has just watched the deploy finish. Default is
  to verify.
- `--result <path>` additionally writes `{ "urls": { url: fingerprint } }`
  of what *this run* sent. `--apply` merges such a file into the state:
  this is how CI commits onto a `main` that may have moved (section 6).

### 5.2 Steps

1. Load `.env` if present; parse args.
2. Build the manifest (1062 fingerprints) from the tree. Report any URL
   whose image is missing on disk and exclude it (a `dataint` failure, not
   ours).
3. Read the state (`{}` when absent or `site` differs).
4. `todo = stale(manifest, state, mode)` filtered by `--only`. Empty ->
   print `nothing to refresh`, exit 0, never load the client.
5. Live check (5.3) unless `--no-verify` -> `ready`, `notLive`.
6. `batches = chunk(ready, PER_MESSAGE)` cut by `--limit`.
7. Dry run -> print the counts, the first three batches in full, the
   `notLive` list, exit 0. Nothing loaded, nothing written.
8. Fail fast on config: all three env vars present or exit 2 with a fixed
   sentence naming which is missing (never its value).
9. Connect; `ensureStarted()` (5.5); loop over batches per section 3.4;
   write state and `--result` after every accepted message; pace; rest;
   stop on budget.
10. Summary to stdout and `$GITHUB_STEP_SUMMARY`; `::warning::` when pending
    > 0; `close()`; exit per section 3.4.

### 5.3 The live check

For each stale URL, `live.mjs` fetches the page and its `og:image` and
computes the same `fingerprint`. Match -> `ready`. Mismatch or HTTP error ->
retried in rounds: all mismatches again after 60 s, up to 5 rounds (Pages
edges cache for up to ten minutes after a deploy). Still mismatching ->
`notLive`, reported, not sent. Concurrency 6; images are fetched once per
distinct URL within a run (records share pictures).

Why it is not optional by default: a refresh that runs before the CDN serves
the new bytes makes Telegram re-cache the *old* preview under a state entry
that says it is current - the one failure the state cannot see. It also
makes a local run safe against an unpushed tree: unpushed changes simply
come back as `notLive`.

### 5.4 State writes

`writeState` runs after every accepted message, atomically (write to
`state.json.tmp`, rename). Keys sorted. Entries whose URL is not in the
manifest are dropped. `updatedAt` is the only timestamp in the file.

### 5.5 Talking to the bot

- `peer = await client.getEntity('WebpageBot')` once.
- `ensureStarted()`: `getMessages(peer, { limit: 1 })`; if the chat is
  empty, send `/start` and wait one pace. Idempotent.
- A message is the batch's URLs joined by `\n`, no command. `PER_MESSAGE`
  is a constant so the form can change if the first real message shows the
  bot only took the first link.
- `lastReply(sinceDate)`: after the pace sleep, `getMessages(peer,
  { limit: 3 })`, return the text of the newest incoming message newer than
  the send. Logged verbatim beside the batch; never parsed.

## 6. `previews.yml`

Sketch for the implementer; the exact YAML goes through
`npx prettier --write` before commit because `.github/**` is format-checked.

```yaml
name: previews

on:
  workflow_run:
    workflows: [check]
    types: [completed]
    branches: [main]
  workflow_dispatch:
    inputs:
      mode:
        type: choice
        options: [incremental, full]
        default: incremental
      dry_run:
        type: boolean
        default: false
      limit:
        type: string
        default: ''

permissions:
  contents: write # the state commit; nothing else

concurrency:
  group: tg-previews
  cancel-in-progress: false

jobs:
  refresh:
    if: github.event_name == 'workflow_dispatch' || github.event.workflow_run.conclusion == 'success'
    runs-on: ubuntu-latest
    timeout-minutes: 60
    env:
      TG_API_ID: ${{ secrets.TG_API_ID }}
      TG_API_HASH: ${{ secrets.TG_API_HASH }}
      TG_SESSION: ${{ secrets.TG_SESSION }}
      MODE: ${{ inputs.mode || 'incremental' }}
      DRY_RUN: ${{ inputs.dry_run || 'false' }}
      LIMIT: ${{ inputs.limit || '' }}
    steps:
      - uses: actions/checkout@v5
        with:
          ref: ${{ github.event.workflow_run.head_sha || github.sha }}

      - name: Secrets present?
        id: cfg
        run: |
          if [ -z "$TG_SESSION" ] || [ -z "$TG_API_ID" ] || [ -z "$TG_API_HASH" ]; then
            echo "::notice::Telegram secrets are not configured; nothing to do"
            echo "skip=true" >> "$GITHUB_OUTPUT"
          fi

      - uses: actions/setup-node@v5
        if: steps.cfg.outputs.skip != 'true'
        with:
          node-version-file: .nvmrc
          cache: npm
          cache-dependency-path: tools/tg-preview/package-lock.json

      - name: Install the client
        if: steps.cfg.outputs.skip != 'true'
        working-directory: tools/tg-preview
        run: npm ci

      - name: Vulnerabilities we will not wave through
        if: steps.cfg.outputs.skip != 'true'
        working-directory: tools/tg-preview
        run: npm audit --audit-level=high

      # The state is read from the freshest main, not from the deployed sha:
      # a refresh committed between two quick pushes must not be re-sent.
      - name: Refresh
        if: steps.cfg.outputs.skip != 'true'
        run: |
          git fetch --depth=1 origin main
          git show origin/main:tools/tg-preview/state.json > tools/tg-preview/state.json 2>/dev/null || true
          args="--mode $MODE --budget-minutes 45 --result $RUNNER_TEMP/result.json"
          [ "$DRY_RUN" = "true" ] && args="$args --dry-run"
          [ -n "$LIMIT" ] && args="$args --limit $LIMIT"
          node tools/tg-preview/run.mjs $args

      - name: Record what was refreshed
        if: always() && steps.cfg.outputs.skip != 'true' && env.DRY_RUN != 'true'
        run: |
          [ -s "$RUNNER_TEMP/result.json" ] || { echo "nothing sent"; exit 0; }
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          for attempt in 1 2 3; do
            git fetch --depth=1 origin main
            git checkout -q --detach origin/main
            node tools/tg-preview/run.mjs --apply "$RUNNER_TEMP/result.json"
            git add tools/tg-preview/state.json
            git diff --cached --quiet && exit 0
            git commit -q -m "chore(tg-preview): record refreshed previews [skip ci]"
            git push origin HEAD:main && exit 0
            echo "push rejected, retrying"; sleep 10
          done
          exit 1
```

Notes the implementer must keep:

- `git show origin/main:...` failing on a missing file is the bootstrap
  case; `|| true` is intentional and the run then treats everything as
  stale.
- `--apply` onto a fresh `origin/main` is what makes the commit correct when
  the owner committed a local run in the meantime: ours wins per URL, theirs
  is kept.
- The `always()` on the record step is what makes a budget stop, a
  `PEER_FLOOD` stop and even a crash mid-run leave their progress in `main`.
- `[skip ci]` is load-bearing (section 3.5).
- The `secrets present?` step prints no value. Do not "improve" it with an
  echo of the variable.

## 7. Contracts, specs and docs that move

- No public contract changes: `CONTRACTS.md`, `docs/fixtures/`,
  `tests/contracts.js`, `llms.txt`, `robots.txt` untouched.
- `docs/specs/META.md` gains a short section 7, "Link previews are cached by
  Telegram until pushed": the fact, the rule ("`og/` bytes under an unchanged
  URL need a refresh"), and a pointer to `docs/tg-preview.md`. Durable
  behaviour belongs in specs.
- `docs/tg-preview.md` (new): the runbook.
- `docs/specs/COVERAGE.md`: one paragraph under "The unit suite" saying
  `tools/tg-preview/lib.test.mjs` runs under `node --test` inside
  `npm run check`, covers the pure module, and that the client port is the
  deliberate gap.
- `README.md` / `README.ru.md`: one line each in the file map, next to
  `tools/build-share-pages.js`, aligned.
- `package.json`: `"check"` gains
  `&& node --test tools/tg-preview/lib.test.mjs` after the hooks selftest;
  a convenience script `"previews": "node tools/tg-preview/run.mjs"`.
- `.gitignore`: `.env`, `.env.*`.
- `CLAUDE.md`: untouched by B1 (194 of 200 lines). The orchestrator may add
  one pointer line under "Data and published artefacts" if it judges the
  rule standing; noted in `handoff.md`.

## 8. Parity and gates - confirmed, not assumed

Files touched: `tools/tg-preview/**`, `.github/workflows/previews.yml`,
`docs/**`, `README*.md`, `package.json` (scripts only), `.gitignore`. None of
`index.html`, `app.js`, `style.css`, `app/src/**`, `data.js`, `og/`, `i/`,
`tests/parity/**`. Nothing a screen draws changes, `dist/` is not rebuilt
differently, no `STATES` entry is owed.

Gates for B1: **`npm run check` only** (one foreground call, see
`CLAUDE.md`). Not `check:built`, not parity. The new `node --test` step adds
about a second.

## 9. The owner's manual steps, start to finish

Everything here is the owner's to do; no agent should perform any of it, and
no agent can (it needs a phone, a Telegram login and repository settings).
The same text lands in `docs/tg-preview.md`.

**A. The throwaway account.**
1. Get a phone number that is not the one on the owner's own Telegram
   account. A real SIM; Telegram routinely refuses VoIP and virtual numbers
   at registration.
2. Install Telegram (Desktop or phone) and register that number. Give the
   account a name (any) so it does not look like a blank spam account.
3. Recommended: Settings -> Privacy and Security -> Two-Step Verification,
   set a password. It does not protect an already-issued session, but it
   stops anyone with the SIM from taking the account by code alone.
4. Optional but sensible: leave the account for a day before step G. Very
   fresh accounts are the ones Telegram limits first.

**B. API credentials.**
1. Open `https://my.telegram.org`, enter the throwaway's number; the login
   code arrives *inside Telegram* on that account, not by SMS.
2. "API development tools" -> create an application: title
   `daggerheart-loot previews`, short name `dhlootprev`, platform *Other*,
   description optional.
3. Copy `api_id` (a number) and `api_hash` (32 hex characters). These
   identify the application, not the account; they go in `TG_API_ID` and
   `TG_API_HASH`.
4. Known gotcha: the form sometimes answers a bare `ERROR` for very new
   numbers or some networks. Retry later, from another network, or after
   step A.4. There is no support channel for it.

**C. Say hello to the bot.** In the throwaway account, open `@WebpageBot`
and press *Start*. The tool would do it, but seeing the bot answer by hand
proves the account is allowed to talk to it.

**D. Local setup (after B1 is merged and pulled).**
1. `cd tools/tg-preview && npm ci && cd ../..`
2. Create `.env` in the repository root (it is gitignored):
   ```text
   TG_API_ID=123456
   TG_API_HASH=0123456789abcdef0123456789abcdef
   ```
   No quotes, no spaces around `=`.
3. `node tools/tg-preview/login.mjs` - it asks for the phone number
   (international form, `+7...`), then the code Telegram shows in the app,
   then the 2FA password if set (it echoes; use a private terminal). It
   prints **one** line, `TG_SESSION=...`. Append that line to `.env`.
4. That string *is* the account. Do not paste it into chat, an issue, a
   commit, or a file outside `.env`. If it ever leaks: Telegram -> Settings
   -> Devices -> terminate that session, and redo step D.3.

**E. Dry runs (no Telegram involved).**
1. `node tools/tg-preview/run.mjs --dry-run --mode full` - expect
   `1062 urls, 107 messages`, the live check reporting 1062 ready (the site
   must be deployed at the same commit you are on; otherwise you will see
   `notLive` entries, which is the check working).
2. `node tools/tg-preview/run.mjs --dry-run --only w76` - one URL, one
   message.

**F. The first real message.**
1. `node tools/tg-preview/run.mjs --only w76`
2. Open the throwaway account's chat with `@WebpageBot`: the message with
   the link and the bot's reply should be there; the tool logged the reply
   too.
3. In Saved Messages (any account), paste
   `https://artex-x.github.io/daggerheart-loot/i/w76.html` and compare the
   preview picture with `https://artex-x.github.io/daggerheart-loot/og/`
   plus that record's image name. Same picture = the refresh works.
4. **Q1 evidence:** find an old message that already contained the `w76`
   link (or any link refreshed here) and see whether its preview changed.
   Tell the orchestrator either way.
5. `git status` shows `tools/tg-preview/state.json` with one entry. Keep it.

**G. The full reindex.**
1. `node tools/tg-preview/run.mjs --mode full` - about 12 minutes if
   Telegram never says wait; the log shows every batch, every reply and
   every `FLOOD_WAIT`. If it stops with `PEER_FLOOD`, the account is limited:
   wait a day and run the same command again - it resumes.
2. When it prints `pending 0`:
   `git add tools/tg-preview/state.json && git commit -m "chore(tg-preview): record the first full reindex"`
   and push. From here CI only ever sends what changed.

**H. Repository secrets.** GitHub -> the repository -> Settings -> Secrets
and variables -> Actions -> New repository secret, three times, the same
values as `.env`: `TG_API_ID`, `TG_API_HASH`, `TG_SESSION`.

**I. First CI run.** Actions -> `previews` -> Run workflow -> mode
`incremental`, dry run **on**. Read the job summary. Then the next push to
`main` runs it for real: `deploy` first, then `previews`, then a commit
`chore(tg-preview): record refreshed previews [skip ci]` appears on `main`
whenever something was sent.

**J. Rotation and shutdown.** Telegram -> Settings -> Devices -> terminate
the tool's session; delete the `TG_SESSION` secret and the `.env` line. To
stop the automation without touching the account, delete the three secrets:
the job then exits 0 with a notice.

## 10. Batches

### B1 - the refresh tool, its workflow and its runbook (one batch, one commit)

**Status: implemented and committed.** Built in the dedicated worktree
`E:/dev/daggerheart-loot-wt/tg-preview-refresh`, branch
`automation/tg-preview-refresh`; not merged, not pushed - see `handoff.md`.

**Objective.** Everything in sections 3-7 in one commit, verifiable by
`npm run check` and a dry run against the live site. No Telegram credentials
exist yet, so the batch never sends anything; that is by design.

**In scope.** Every file in section 4 except `state.json` (created by the
owner's first run); the doc and spec edits of section 7; `.gitignore`;
`package.json` scripts.

**Out of scope.** `ci.yml`; any public contract; running against Telegram;
`CLAUDE.md`.

**Files.**

Create: `tools/tg-preview/package.json`, `tools/tg-preview/package-lock.json`
(generated by `npm install`, never by hand), `tools/tg-preview/lib.mjs`,
`tools/tg-preview/lib.test.mjs`, `tools/tg-preview/manifest.mjs`,
`tools/tg-preview/live.mjs`, `tools/tg-preview/client.mjs`,
`tools/tg-preview/run.mjs`, `tools/tg-preview/login.mjs`,
`.github/workflows/previews.yml`, `docs/tg-preview.md`.

Edit: `.gitignore`, `package.json`, `docs/specs/META.md`,
`docs/specs/COVERAGE.md`, `README.md`, `README.ru.md`.

**Steps.**

1. `mkdir tools/tg-preview`; write `package.json`:
   `{ "name": "dhloot-tg-preview", "private": true, "type": "module", "engines": { "node": ">=22" }, "dependencies": { "teleproto": "^1.229.0" } }`.
   Run `npm install` **inside that directory** to produce the lockfile
   (the root `package-lock.json` must not change - check `git status`).
   Run `npm audit --audit-level=high` there; expect 0.
2. `lib.mjs` - exports, in this order, each a named export with a one-line
   why-comment:
   - constants `PER_MESSAGE = 10`, `PACE_MS = [4000, 6000]`,
     `REST_EVERY = 25`, `REST_MS = 30000`, `MAX_WAIT_S = 600`,
     `NET_RETRIES = 3`, `NET_RETRY_MS = 10000`, `VERIFY_ROUNDS = 5`,
     `VERIFY_ROUND_MS = 60000`, `VERIFY_CONCURRENCY = 6`.
   - `urls(L, site)` per section 3.2.
   - `extractMeta(html)` -> `{ title, description, image }` from
     `<meta property="og:title|og:description|og:image" content="...">`,
     HTML entities decoded for the five `esc()` produces (`&amp; &lt; &gt;
     &quot; &#39;`); missing tag -> `''`.
   - `fingerprint(meta, imageSha)` per section 3.3 (`node:crypto` sha256
     hex).
   - `imageName(meta, site)` -> basename under `og/`, or `null` when the
     image is not under `site + 'og/'`.
   - `buildManifest({ site, L, renderStub, rootHtml, readImage })` ->
     `{ urls: { url: fingerprint }, missing: [url] }`. `readImage(name)`
     returns a Buffer or `null`.
   - `stale(manifest, state, mode)` -> `[url]` in manifest order.
   - `chunk(list, n)`.
   - `decide(err, { attempt, maxWaitS })` per section 3.4, matching by
     `err.constructor.name` / `err.errorMessage` / `err.seconds` so the
     test needs no teleproto - document that the names are teleproto's
     class names (`FloodWaitError`, `SlowModeWaitError`, `PeerFloodError`,
     `AuthKeyUnregisteredError`, `SessionRevokedError`,
     `SessionExpiredError`, `SessionPasswordNeededError`,
     `AuthKeyInvalidError`, `RPCError`).
   - `applyResult(state, result, site)`.
   - `parseArgs(argv)` -> the options of section 5.1 with defaults;
     unknown flag throws.
   - `runRefresh(opts, deps)` - the loop of section 5.2 steps 4-10 with
     `deps = { manifest, state, client(), verify, sleep, now, random,
     writeState, writeResult, log }`; returns
     `{ sent, pending, notLive, floodWaits, stopped, exitCode }`.
     `client()` is a factory called only when there is something to send
     and it is not a dry run.
3. `manifest.mjs` - `createRequire`; load `../derived.js` and
   `../build-share-pages.js`; `readImage = name => fs.readFileSync(join(assets, 'og', name))`
   guarded to `null`; `rootHtml = readFileSync(join(assets, 'index.html'))`;
   export `buildFromTree({ assets })`.
4. `live.mjs` - `verify(urls, { site, fetch, sleep, log })` per section
   5.3, using `fingerprint`/`extractMeta` from `lib.mjs`; returns
   `{ ready, notLive }`.
5. `client.mjs` - `createClient({ apiId, apiHash, session, log })` with
   `import { TelegramClient, sessions, Logger } from 'teleproto'`;
   `StringSession`; `connect()`; refuse (exit 2 path) when
   `!await client.isUserAuthorized()`; `getEntity('WebpageBot')`;
   `send(text)`, `lastReply(sinceUnix)`, `close()` per section 5.5. Logger
   at error level. No console output of any argument.
6. `run.mjs` - section 5 wiring: `process.loadEnvFile` in `try`; build the
   manifest; read state; `runRefresh`; summary; `$GITHUB_STEP_SUMMARY`
   append when the variable is set; `process.exit(code)` after `close()`.
   `--apply` branch: read state, read result, `applyResult`, write, exit 0.
7. `login.mjs` - `readline/promises`; `client.start({ phoneNumber,
   phoneCode, password, onError })`; on success print exactly
   `TG_SESSION=<session>` and a one-line warning that it is the account;
   `disconnect()`; exit 0.
8. `lib.test.mjs` - the list in section 3.7 under `node:test`, `describe`
   / `it`, `node:assert/strict`. Load the real `data.js` for the count
   test the way `tests/derived.js` does (`global.window = {}` then
   `require`). Fake client: records `send` calls, scripted to throw a given
   error object on a given call. Fake sleep records durations and never
   waits.
9. `previews.yml` from section 6; `npx prettier --write .github/workflows/previews.yml`.
10. Docs: `docs/tg-preview.md` = section 9 verbatim plus an "Operations"
    section (dry run, `--only`, `--limit`, reading the summary, what
    `pending` means, `--mode full`, deleting `state.json`, the `[skip ci]`
    commit); `META.md` section 7; `COVERAGE.md` paragraph; the two README
    lines; `.gitignore`; `package.json` scripts.
11. Dry run against the live site from this tree (no secrets needed):
    `node tools/tg-preview/run.mjs --dry-run --mode full` - expect
    `1062 urls`, `107 messages`; note how many are `ready` (the live site
    is at `main`'s last deployed sha, so a tree ahead of it shows
    `notLive` for the changed ones - record the number, do not "fix" it).
    Then `--dry-run --only w76,root`.
12. `set -o pipefail; npm run check 2>&1 | tail -n 120` with Bash timeout
    600000. Confirm `git status` shows only this batch's paths plus the
    unrelated issue 47 work that was already there; stage **only** this
    batch's paths by name; commit
    `feat(tooling): refresh Telegram link previews after deploy`.

**Acceptance criteria.**

- `node --test tools/tg-preview/lib.test.mjs` passes with no
  `tools/tg-preview/node_modules` present (delete it to prove it, then
  `npm ci` again).
- `node tools/tg-preview/run.mjs --dry-run --mode full` prints 1062 URLs,
  107 messages, sends nothing, writes nothing, exits 0, without the three
  env vars.
- `node tools/tg-preview/run.mjs` with no state and no env exits 2 with a
  sentence that names the missing variable and not its value.
- `--apply` on a state with a foreign entry keeps the entry and takes ours.
- `git status` after the batch shows no change to the root
  `package-lock.json`, `ci.yml`, `i/`, `og/`, `data.js`.
- `grep -n "^\.env" .gitignore` finds both lines.
- `npm run check` green in one foreground call.
- The workflow file passes `npx prettier --check .github/workflows/previews.yml`.

**Verification commands.**

```text
node --test tools/tg-preview/lib.test.mjs
node tools/tg-preview/run.mjs --dry-run --mode full
node tools/tg-preview/run.mjs --dry-run --only w76,root
set -o pipefail; npm run check 2>&1 | tail -n 120        # Bash timeout 600000
npx prettier --check .github/workflows/previews.yml
```

**Risks / do-nots.**

- Do not add `teleproto` (or anything) to the root `package.json`.
- Do not touch `ci.yml`, the deploy allow-list, `og/`, `i/`, any fixture.
- Do not run anything that sends to Telegram; there are no credentials and
  there must not be any in the tree.
- Do not commit a `state.json`; the owner's first run creates it.
- Do not `git add -A`; the tree carries issue 47's B7 files.
- The `Secrets present?` step and every log line: no secret values, ever.
- `PER_MESSAGE`, the pacing and the rest interval are guesses around the
  one documented number; leave them as named constants with the reason, so
  B2 can tune them from the first real run.

**Fallback.** If `teleproto` turns out to lack something at implementation
time, `telegram@2.26.22` is API-identical (measured), audit-clean today, and
a one-line swap in `client.mjs` and `package.json`; record the reason in the
handoff.

### O1 - the owner's operations (not a code batch)

Section 9, A through I, in order. Produces `state.json` on `main` and the
three secrets. The orchestrator collects the Q1 evidence from step F.4.

### B2 - tuning from the first real run (outline; may be empty)

After O1: fold in what Telegram actually did - whether one message with ten
links is honoured, the real flood behaviour, the bot's reply vocabulary
(then, and only then, decide whether a reply like "not found" should mark a
URL pending). Update the constants and `docs/tg-preview.md`. Gate:
`npm run check`. If nothing needs changing, close the task without it.

## 11. Open questions - NEEDS_HUMAN_CONFIRMATION: yes

**Q1 - does a refresh change previews in already-posted messages?**
`context.md` records a claimed caveat that only *new* shares pick up the
refreshed preview and old messages keep theirs forever. The owner has
refreshed links by hand before and may know. It does not change the design;
it changes the promise: if the caveat is true, this task makes every new
share correct and cannot touch old ones, and `docs/tg-preview.md` must say
so in its first paragraph. Step F.4 in section 9 is the cheap way to find
out. Recommended: proceed with B1 either way; the answer only edits one
paragraph.

**Q2 - may the CI job commit `tools/tg-preview/state.json` to `main` as
`github-actions[bot]` with `[skip ci]`?** Section 3.3 chose a committed
state file because it is the one store both callers can read and write with
plain git, it is visible and diffable, and its loss mode is explicit. The
cost is a bot commit on `main` after every deploy that changed a preview
(artwork or data pushes, not every push), the job holding
`contents: write`, and any branch protection on `main` having to admit the
bot. `CLAUDE.md`'s "never push" is an agent rule, but the owner should say
yes to a bot doing it. Recommended: **yes**. Fallback if no: an orphan ref
`refs/tg-preview/state` written with `git push origin <sha>:refs/tg-preview/state`
- same file, no commits on `main`, harder to see; the plan's sections 3.3
and 6 would be revised before dispatch.

## 12. Risks and assumptions

- **Fresh-account limits.** A new account is the kind Telegram limits first
  (`PEER_FLOOD`). The tool stops green; the owner waits a day. Section 9,
  A.4 softens it.
- **"10 links per message" is the reference's number**, not Telegram's
  documentation. The first real message (`--limit 1`, `--only`) shows what
  the bot did with it; `PER_MESSAGE` is one constant.
- **Pages edge caching** after a deploy: the live check waits up to five
  minutes per round set; beyond that, URLs stay pending for the next run.
- **`workflow_run` semantics.** Fires on the completion of `check` for
  `main`; a dispatch of `check` on `main` also fires it, which is a
  harmless no-op run. The checkout is `head_sha`, the deployed commit. If
  the owner later renames the `check` workflow, `workflows: [check]` must
  follow.
- **Branch protection**, if any, must allow `github-actions[bot]` to push
  to `main` (Q2).
- **Two writers.** A local run and a CI run at the same time are serialised
  by `--apply` onto fresh `origin/main` plus three push attempts; the
  residue of a lost race is one URL refreshed twice, never a lost record.
- **The session's IP.** Created on the owner's machine, used from GitHub's
  runners. Telegram allows a session from anywhere; nothing to configure.
- **Cut-over.** Section 3.2; the generator import and `--assets` are the
  two seams. Carried in `handoff.md`, "Deferred", for issue 47.

## 13. Deferred

- A pointer line in `CLAUDE.md` ("after changing `og/` bytes, CI refreshes
  Telegram previews; see `docs/tg-preview.md`") and in
  `.claude/prompts/refresh-artwork.prompt.md` - orchestrator's call, one
  line each.
- Other messengers' caches (Discord re-fetches on its own; WhatsApp has no
  refresh path). Not this task.
- Reply parsing (B2, only with evidence).
- An issue 47 cut-over checklist item: keep `page()` importable, or point
  `manifest.mjs` at the new generator; decide whether `og/` stays a source
  asset.
