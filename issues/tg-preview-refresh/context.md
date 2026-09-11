# Shared task context - TASK tg-preview-refresh

Orchestrator maintains this file so later steps do not re-fetch the same sources.
Read this before `plan.md` and `handoff.md`.

## Goal

Telegram's cached link previews for this site are stale. Give the owner a
mechanism that refreshes them without hand-picking URLs: a **first full
reindex** of every share URL, then **incremental refreshes** driven by what
actually changed, run **after deployment**. The owner asked explicitly for
both a CI path and a local path, and for a step-by-step list of the manual
setup they must perform themselves.

Example of the stale link shape:
`https://artex-x.github.io/daggerheart-loot/i/w76.html`

## GitHub issue (if any)

- URL: none. The owner stated this is not documented in GitHub.
- Captured or last verified: 2026-09-11, from the owner's message.
- Decisions already settled (owner, 2026-09-11, via orchestrator):
  1. Task id is `tg-preview-refresh` (slug, matching `dh-image-polish` and
     `hooks-guardrails`; no GitHub issue exists).
  2. **Both** a CI path and a local path. One mechanism, two callers.
  3. The automation logs in as a **dedicated throwaway Telegram account**, not
     the owner's personal account, because the credential is a full-account
     session (see "Constraints").
  4. **It must stay correct after issue 47's cut-over.** The owner believes the
     share artefacts will be generated dynamically there rather than committed.
     A design that discovers URLs by listing the committed `i/` directory, or
     that detects change by `git diff` over `i/` + `og/`, is therefore
     explicitly disallowed as the only mechanism. See "Constraints".
  5. **CI may commit the fingerprint state to `main`.** Answering the
     planner's Q2: `tools/tg-preview/state.json` is a committed file, pushed
     by the refresh job as `github-actions[bot]` with `[skip ci]`, and that
     one job holds `contents: write`. The orphan-ref fallback
     (`refs/tg-preview/state`) is **not** taken; `plan.md` sections 3.3 and 6
     stand as written.
  6. **A refresh does repair already-posted messages.** Answering the
     planner's Q1: the owner has refreshed links by hand before and saw the
     preview change in messages that were **already posted**, not only in
     links pasted afterwards. The published caveat below is therefore wrong
     for this site's case. `docs/tg-preview.md` must promise repair of the
     existing backlog of shared links, not merely correct future shares.
     Runbook step F.4 is no longer evidence-gathering; it is a regression
     check, and a result contradicting this is worth reporting.
- Open questions:
  - ~~Does a `@WebpageBot` refresh fix previews in already-posted messages?~~
    **Answered by the owner, 2026-09-11: yes, it does.** See decision 6.
  - What `@WebpageBot`'s real flood limits are. Undocumented; see below. The
    first full reindex (runbook step G) is what measures them; B2 exists to
    tune the constants from that run.

## Reference findings (fetched 2026-09-11 - do not re-fetch)

Sources the owner supplied, plus one search pass.

### There is no bot-token path. It is a userbot, or nothing.

`@WebpageBot` is a Telegram **bot**, and bots cannot message bots. So the Bot
API is unusable here and a `TELEGRAM_BOT_TOKEN` is the wrong credential. Every
automation route is MTProto acting as a **user**:

- `https://github.com/my-telegram-bots/WebpageBot-api` is a userbot. It needs
  `TG_API_ID` and `TG_API_HASH` from `my.telegram.org`, plus a one-time
  interactive `npm run login` that produces a stored session. It then exposes
  `POST http://127.0.0.1:2344/` taking `url=<one url>` form data or
  `{"url": ["...", "..."]}` JSON, answering `{"ok": true, "status": "sent"}`.
  Koa-based; marks messages read with randomised 500-2000ms delays. **No rate
  limits documented.** It is a long-running local service, which is a poor fit
  for a CI step that wants one shot and an exit code - the planner should weigh
  it against calling an MTProto client library directly from a repo script.

### Telegram's caching behaviour

- Cached preview data has **no documented TTL** and in practice persists
  indefinitely until someone forces a refresh. Nothing served from the origin -
  `Cache-Control`, `ETag`, a changed `og:image` byte - invalidates it. So
  there is no app-level or headers-level fix; this has to be pushed to
  Telegram.
- The manual path is: open `@WebpageBot`, `/start` once, then send the URL or
  `/updatepreview <url>`.
- Documented bulk figure: **up to 10 links at a time**.
- ~~Claimed caveat: a refresh affects only new shares; already-sent messages
  keep their original preview permanently.~~ **Refuted by the owner's own
  experience, 2026-09-11** - they have refreshed links by hand and watched the
  preview change in messages already posted. Do not repeat this claim in docs
  or commit messages; see decision 6 above.
- Telegram also retains a "noindex memory" - if a page served `noindex` when
  Telegram first crawled it, removing it later is not enough on its own.
  **This site serves `noindex` on every stub on purpose** (`docs/specs/META.md`
  section 2), and that is a product law, not a defect. Do not "fix" `noindex`.

Sources: `https://opengraphplus.com/consumers/telegram/caching`,
`https://github.com/my-telegram-bots/WebpageBot-api`.

## Scale, measured 2026-09-11 at `8b96ff4`

| Thing | Count |
|---|---|
| `i/*.html` share stubs | 1061 |
| `og/*.jpg` preview images | 847 |
| `img/*.webp` catalog images | 846 |
| `card/*.svg` | 36 |

Plus the site root `index.html`. A first full reindex is therefore ~1062 URLs
against a bot whose only published batch figure is 10 links per submission.
Flood-wait handling and resumability are first-class design problems, not
polish.

## Why the previews are stale (root cause, confirmed)

Three commits rewrote artwork bytes under **unchanged URLs**:
`8e7fed1 chore: refresh catalog artwork`,
`ce0c414 chore(art): refresh polished catalog images`,
`37ecc8d feat(artwork): refresh audited polish batch`.
`og/<id>.jpg` changed content while `og:image` kept pointing at the same
address, which is precisely the case Telegram's cache never notices.

## Key paths

- Specs: `docs/specs/META.md` (noindex + crawler policy, section 2 governs
  this task), `docs/specs/CONTRACTS.md` (`i/<id>.html` and `og/<id>.jpg` are
  frozen published artefacts - lines 95 and 107).
- Share stub generator: `tools/build-share-pages.js`. `SITE` is hardcoded to
  `https://artex-x.github.io/daggerheart-loot/`. Invoked by `tools/build.js`,
  which is `npm run data`, which `npm run check` and `npm run build` both run.
- Canonical data: `data.js` -> `window.LOOT.items` (+ `.eq`). This, not the
  filesystem, is the authoritative list of ids.
- CI: `.github/workflows/ci.yml`. Jobs `check`, `parity` (4 shards), `audit`,
  `secrets` (gitleaks), then `deploy`. `deploy` runs only on push to `main`,
  `needs: [check, audit, secrets, parity]`, publishes an **explicit** file list
  to Pages, and has a `Nothing private slipped in` guard. `concurrency: pages`,
  `cancel-in-progress: false`. Confirmed green end-to-end on run
  `34404013490` (issue 47 context), so a `needs: [deploy]` job is viable.
- `.gitignore` currently has **no `.env` entry**. Anything local that stores a
  session must be gitignored in the same change; gitleaks runs on full history.
- `.prettierignore` excludes `tools/`, so a new script there is not
  format-checked, but eslint still covers it.

## Constraints

- **Do not add a backend.** `docs/specs/META.md` section 3 and `CLAUDE.md`
  ("Product laws"). A refresh tool that runs in CI or on the owner's machine
  is not a backend; a hosted service would be.
- **Do not weaken `noindex` or `robots.txt`.** `CLAUDE.md` states crawler
  blocks hide `noindex` and break previews. Messenger unfurlers must keep
  fetching the stubs.
- **`i/<id>.html` and `og/<id>.jpg` are frozen contracts.** This task should
  need no change to either; if it does, `docs/fixtures/`, `tests/contracts.js`,
  `docs/specs/CONTRACTS.md` and `llms.txt` move in the same commit.
- **Survive issue 47's cut-over (owner requirement).** Derive the URL set from
  the canonical data (`window.LOOT` ids + the site base) or from the published
  artefact, not from `ls i/`. Detect change by something that still works when
  `i/` and `og/` are build outputs rather than tracked files - a persisted
  content-hash manifest is the obvious candidate, `git diff -- i/ og/` is not.
  The planner owns the choice and must state why the alternative was rejected.
- **The credential is a full Telegram account session.** Treat it as such:
  dedicated throwaway account (owner decision 3), repository secret only,
  never echoed into logs, never written to a file the deploy job copies.
  `_site` is an allow-list copy, so the existing guard helps, but a new
  top-level artefact must not land in it by accident.
- **One writer per tree.** See below.

## Working tree state at dispatch (orchestrator, 2026-09-11)

HEAD `8b96ff4 docs(issue-47): B7 planned - the print slice, one batch`.
The tree is **not clean**: issue 47's B7 print slice is in flight - 21 modified
`app/src/**` paths, `docs/specs/COVERAGE.md`, `docs/specs/FEATURES.md`,
`tests/parity/driver.js`, `tests/parity/specs.js`, a staged
`issues/47/context.md`, and 6 untracked files (`PrintCard.svelte`,
`PrintPage.svelte`, `Seg.svelte`, `printPage.test.ts`, `print.ts`,
`print.test.ts`). `ListAgents` showed 28 peer sessions, 6 of them interactive.

Consequence: **planning is safe, implementation is not.** No implementer is
dispatched for this task until B7 is at a committed boundary. A commit for this
task must stage only its own paths and must never `git add -A`. Re-read
`git log --oneline -3` before any writer dispatch; HEAD moves under this
session.

## Command costs

Inherited from issue 47's context; re-measure only if a number looks wrong.

| Command | Wall clock | Fits one call? |
|---|---|---|
| `npm run check` | ~165s idle; has exceeded the 600s cap under load | usually, but expect the cap to be reachable |
| `npm run check:built` | a few minutes | yes |
| `node tests/parity.js "<filter>"` | ~9 min for `tables` | barely |
| `node tests/run-all.js parity` | ~867s single job; sharded 4x in CI | no |

A backgrounded or file-redirected `npm run check` cannot arm the commit gate,
however honestly it passes. One foreground call:
`set -o pipefail; npm run check 2>&1 | tail -n 120`, `timeout: 600000`.

This task is unlikely to need parity at all - it touches tooling and CI, not
what a screen draws. Confirm that rather than assuming it.

## Which machine is authoritative

- For recorded numbers (parity debt, timings): CI (ubuntu). A local Windows run
  is advisory.
- For this task specifically: the **only** authoritative proof that a refresh
  worked is Telegram itself. A green CI job proves the request was sent, not
  that the preview changed. The plan must say how the owner verifies a real
  refresh, and must not let a passing job stand in for that.

## Reasons already disproved

- *"Set cache headers or change the og:image URL and Telegram will re-fetch."*
  No. The cache has no TTL and is keyed on the page URL; nothing the origin
  serves invalidates it. Refuted 2026-09-11 against the caching reference.
- *"Use a Telegram bot token."* No. Bots cannot message bots, and
  `@WebpageBot` is a bot. Refuted 2026-09-11.
- *"It is solvable at the app level."* The owner raised this as a possibility.
  It is not - see both entries above. The fix has to be pushed to Telegram.
- *"A refresh only helps future shares, so the existing backlog is lost."*
  No. Refuted by the owner's direct experience, 2026-09-11. The published
  caveat does not hold here. See decision 6.

## Client library facts (planner, measured 2026-09-11, scratchpad on this host)

- npm marks `telegram` (gramjs) **archived**; development continues in
  `teleproto`, a compatible fork. Do not pick gramjs by habit.
- `teleproto@1.229.0`: 12 packages, `npm audit --audit-level=high` clean, no
  native build, MIT, engines node >= 18, modified 2026-08-25. Exports verified
  by introspection: `TelegramClient` (`start`, `connect`, `disconnect`,
  `sendMessage`, `getMessages`, `getEntity`, `isUserAuthorized`),
  `sessions.StringSession`, `errors.RPCError`, `errors.FloodWaitError`
  (`.seconds`), `errors.SlowModeWaitError`, `errors.PeerFloodError`,
  `errors.AuthKeyUnregisteredError`, `errors.SessionRevokedError`,
  `errors.SessionExpiredError`, `errors.SessionPasswordNeededError`.
- `telegram@2.26.22`: 46 packages, audit clean today, two install scripts
  (`bufferutil`, `utf-8-validate` via prebuilds; `es5-ext` postinstall).
  Same API; the named fallback.
- Node 24 (`.nvmrc`) provides `fetch`, `node:test`, `process.loadEnvFile`:
  the tool needs no dependency beyond the MTProto client.
- Decisions taken by the planner on these facts are in `plan.md` section 3;
  the two questions for the owner are in `plan.md` section 11 and
  `handoff.md`.

## Do not re-fetch unless

- The owner provides new info
- context.md is missing a fact you need
- You suspect drift vs the plan
