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
  7. **Retire the 115-entry `state.json` and restart the reindex.** Answering
     the pass-4 question (owner, 2026-09-12, via orchestrator): the file moves
     to a backup **outside the repository** - it is not deleted - and the
     reindex starts cold with the fixed tool, on the plan's
     `--limit 5 --press-limit 50` incremental cadence. Chosen over keeping it:
     nothing names which 28 of the 115 are unverified, so re-pressing only
     those is unactionable and re-pressing all of them costs the same as
     starting over. ~115 presses and 2-3 extra runs out of ~22 buys uniform
     provenance - every entry with the same evidence behind it.
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

## Telegram will not issue a login code yet (measured 2026-09-11, O1 step D.3)

The owner's first attempt at `login.mjs` failed, and the cause is **Telegram's
own policy, not this tool**. Do not "fix" `login.mjs` for it; the sequence
below is correct MTProto and was verified against an official client.

What was observed, in order:

1. `auth.sendCode` **succeeded** - the client migrated to DC 4 and Telegram
   returned a sent-code type. No error.
2. No code arrived: not by SMS, not in the throwaway account's `Telegram`
   service chat (`777000`), not as a missed call.
3. Forcing SMS (`forceSMS: true`, which issues `auth.ResendCode`) returned
   **`SEND_CODE_UNAVAILABLE`** - "all available options for this type of
   number were already used". That the client reached `ResendCode` at all
   proves the first send used a **non-SMS** channel.
4. A diagnostic that surfaces `isCodeViaApp` (which `login.mjs` discards)
   reported **`delivered IN-APP`** - and still nothing appeared in the
   service chat.
5. **Logging the same account in from another device, using an official
   Telegram client, delivered its code in-app immediately.**

Step 5 is the decisive one: the in-app channel works for that account; it
fails only for a third-party `api_id`. This is Telegram's restriction on
third-party API credentials, and it bites hardest on a **new account** using
a **new `api_id`** - which is exactly the combination the owner's security
decision 3 produced. Security and loginability pull in opposite directions
here; that is a property of Telegram, not a mistake in the plan.

**Owner decision, 2026-09-11: age the account and retry.** Use the throwaway
normally from the official Telegram app for several days, then re-run
`login.mjs`. Do not retry in a loop - Telegram's code-send throttle escalates
per attempt and the resend options for this number were already exhausted.

### Superseded the same day: the code arrived

**Later on 2026-09-11 the owner reported receiving the login code**, without
waiting for the 2026-09-16 date the decision above set. So the block above is
the record of a real failure mode and its diagnosis, **not a live blocker**:
Telegram relented within hours, on the same account and the same `api_id`.

What this changes:

- **O1 is unblocked from 2026-09-11.** Ignore any "not before 2026-09-16"
  wording elsewhere in this task directory; it is superseded by this section.
- **The diagnosis above still stands and is still worth keeping.** Telegram
  did withhold codes from a third-party `api_id` while an official client on
  the same account was served immediately. If it recurs - on a rotation, a
  second account, or a new `api_id` - this section is the map, and the
  fallbacks below are still the fallbacks.
- **What it does not establish is a cause.** Nobody proved ageing fixed it
  rather than a throttle window simply expiring. Do not write "ageing the
  account fixes this" into the docs as if it were known.
- **The account is days old and was flood-limited hours ago.** The first full
  reindex is 107 messages; `PEER_FLOOD` on a fresh account is the live risk
  now. The orchestrator advised chunking it with `--limit 10` across a day
  rather than one twelve-minute run, since `state.json` makes every run
  resumable and each one sends only what is still pending.

Rejected for now, and why they remain available if ageing fails:

- **A manual-paste mode** (tool prints batched message texts, owner pastes
  into `@WebpageBot` from the official app). Needs no session at all and
  keeps every part of the design that matters - URL derivation,
  fingerprinting, delta, 10-per-message batching. ~107 pastes for the first
  reindex, one or two per run afterwards. This is the strongest fallback.
- **The owner's personal, long-standing account.** Far likelier to be issued
  a code. Its session is full access to their real Telegram, so it would be
  for **local runs only** and the CI secrets would stay unset.
- **A second throwaway on a different SIM.** Re-rolls the same dice.

Consequence for the task: B1 (and R1) are code-complete and gated, but **O1
cannot start**, so there is no `state.json`, no first reindex, and no reason
to create the three repository secrets yet. Nothing downstream is blocked by
anything an agent can do.

## Sending a link to @WebpageBot does NOT refresh the image (measured 2026-09-11)

**This invalidates a core assumption of `plan.md` sections 3.4 and 5.5 and of
B1's `client.mjs`/`run.mjs`.** Measured on the live bot with the owner's
account, on `cc19`, after B1/R1/R2 were committed.

What a plain send does, verified end to end:

1. `run.mjs --only cc19` sent the link. The bot answered **"Link previews was
   updated successfully. Check them out!"** and `run.mjs` printed
   `refreshed 1, pending 0`.
2. **The preview did not change** - on Telegram Desktop *or* on mobile, on a
   fresh paste. Ruled out as causes: the live artefact (live `og/cc19.jpg` is
   byte-identical to local, sha256
   `0a99d061b3fbdd4e9c00d9b8e61db0cb8a628e7ff6de02cdd70dd32e021b3899`, 25401
   bytes, HTTP 200) and a client-side cache.
3. The bot's reply carries a `ReplyInlineMarkup` with **two** buttons:
   `"Update preview again"` and `"Update with content"`.
4. Pressing **"Update with content"** (one `messages.getBotCallbackAnswer`, no
   new link sent) changed the webpage's **photo id** from
   `5768401444200452036` to `5849419826076520298`, under an unchanged webpage
   id `5240737599179400329`. The owner confirmed the preview then updated.

**Conclusion: a plain send refreshes the page metadata but keeps the cached
photo when `og:image` still points at the same URL.** That is exactly this
site's case - the root cause of this whole task is `og/<id>.jpg` bytes
changing under an unchanged address - so the plain send is precisely the
operation that cannot fix it. `"Update with content"` forces the re-download.

Consequences, all of which the next plan revision must address:

- **B1's success accounting is wrong.** `run.mjs` counts a URL refreshed when
  the message was sent and any reply arrived. The bot's "updated
  successfully" is truthful about the metadata and silent about the photo, so
  the tool cannot distinguish a real refresh from a no-op. A full run today
  would write a `state.json` asserting all 1062 URLs are current while
  changing nothing - strictly worse than no state at all, because the next
  run would then skip them.
- **The interaction is now two-phase**: send a batch, then find the bot's
  button message(s) and press "Update with content" on each, then confirm
  from the callback answer.
- **The rate-limit maths in `plan.md` section 3.4 no longer holds.** 107
  messages was the budget; each batch now also costs one or more callback
  presses. How many per batch depends on whether the bot emits one button
  message per link or one per message - **measured separately, see below.**
- The click is cheap in one respect: it needs no new link, so re-pressing a
  message already in the chat costs nothing against the send budget.

### One button message per link - measured 2026-09-11

Sent **one** message containing three links (`cc12`, `cc24`, `cc38`). The bot
answered with **four** messages: one plain
`"Link previews was updated successfully. Check them out!"` carrying no
buttons, then **one message per link**, each with that link's own
`ReplyInlineMarkup` of `["Update preview again", "Update with content"]`.

So the click axis scales with **URLs, not messages**: a full reindex is 107
sends **plus 1062 callback presses**. Batching ten per message still earns its
keep on the send axis and must not be abandoned on these grounds alone.

Two facts that make the implementation tractable:

- Each button message carries `media.webpage.url`, so a button can be mapped
  back to its URL exactly, with no ordering assumption.
- The summary message is distinguishable: it has text but no `replyMarkup`.

**Residue from this probe:** `cc12`, `cc24` and `cc38` were sent but **not**
pressed, so they have refreshed metadata and stale photos, and they are not in
`state.json` (the probe bypassed `run.mjs`). They need a normal pass once the
tool is fixed. `state.json` currently holds **`cc19` only**, and that entry is
honest - its button was pressed by hand.

`docs/tg-preview.md` currently tells the owner that a send refreshes the
preview. That is now known to be false and must be corrected wherever it
appears.

## The press axis has its own throttle, and `--mode full` re-spends it (measured 2026-09-12)

The owner's **second** chunked reindex run, reported verbatim:

```
phase 1: pressed 115, confirmed 115 (photo changed 87, same 28, none 0)
bot: Sorry, too many attempts. Please try again in 3213 seconds.
no button message for .../i/cc44.html          (x10, cc44-cc53)
batch 1/10: sent 10, buttons 0, pressed 0, confirmed 0
```

Measured facts, in the order they matter:

1. **@WebpageBot throttles presses per user, and the limit is below 115 in
   one run.** After phase 1's 115 presses (about four minutes, paced
   `PRESS_PACE_MS`), the bot answered the very next *send* with
   `"Sorry, too many attempts. Please try again in 3213 seconds."` - about
   54 minutes - and emitted **no button messages at all** for that batch's
   ten links. This is the first measurement of the press-axis limit; the
   send axis was never reached. It partially answers the standing open
   question about `@WebpageBot`'s flood limits: the binding limit is on
   presses, not sends.
2. **`--mode full` makes phase 1 re-press what is already confirmed.**
   `stale()` (`lib.mjs:150`) returns every URL when `mode === 'full'`,
   ignoring `state.json`. Phase 1 then presses every "Update with content"
   button it finds in the last `RECOVER_SCAN = 200` chat messages that maps
   to a URL in that set. `--limit` bounds sends only (documented), so a
   chunked run's press count is bounded by the scan window, not by the
   chunk. **`docs/tg-preview.md` step G.1 tells the owner to run
   `--mode full --limit 10` repeatedly**, which is precisely the loop that
   re-presses the previous chunk's ~100 buttons on every subsequent run.
   The owner's read of their own output - "we're trying to click all the
   previous buttons" - is correct, and the runbook causes it.
   In `--mode incremental`, phase 1 presses only unconfirmed URLs; the
   defect is the `--mode full` runbook line, not phase 1 itself.
3. **A press answered with the throttle message is recorded as confirmed.**
   `client.mjs`'s `press()` returns the callback answer `text`, `pressOne`
   carries it, and `pressGroup` **never reads it** - `answered: true` alone
   confirms the URL. So a press the bot rejected with "too many attempts"
   would be written into `state.json` as refreshed. This is the same class
   of defect B3 was created to fix (trusting an answer that is silent about
   the photo), on the press path instead of the send path.
4. **Consequence for the 115 entries now in `state.json`.** 87 reported
   `photo changed` and are real by that evidence alone. The 28 reporting
   `same` are **not independently verified**: `same` is legitimate when
   Telegram's cached photo already matched, and is also exactly what a
   throttle-rejected press at the tail of phase 1 would produce. Nothing in
   the run's output distinguishes them. Whether to invalidate them is a
   planning decision, not a fact.

State of the world after that run: `tools/tg-preview/state.json` is still
untracked and now holds **115 URLs** (the site root, `cc12`/`cc24`/`cc38`
residue and `cc19` among them), up from `cc19` alone. `cc44`-`cc53` were
sent but never got buttons and are correctly absent.

## The owner's question about `photo changed` (orchestrator, 2026-09-13)

The owner watched the restarted reindex report
`batch 1/5: sent 10, buttons 10, pressed 10, confirmed 10 (photo changed 10,
same 0, none 0)` on every batch and doubted it, because the artwork "was not
changed much". They asked for a lazier tool: press only where the press is
actually needed, and raised resizing as the explanation - Telegram may store
its own re-encode, so the id moves even when the picture does not.

Facts, so the planner does not re-derive them:

1. **`changed` is a file-id delta, not a picture delta.** `lib.mjs`
   classifies by `after !== p.photoBefore` where `photoId` is
   `String(webpage.photo.id)` (`client.mjs`, `plain()`). Telegram mints a new
   id when it re-downloads and re-encodes. So `changed` proves a re-fetch
   visibly happened; it does not prove the rendered image differs. The
   owner's resizing hypothesis is the correct mechanism and does not make the
   counter wrong - it makes its **name** promise more than it measures.
2. **The delta is not spending presses.** Confirmation is
   `p.answered || delta === 'changed'`; an acknowledged press confirms on its
   own and the delta gates only the `BOT_RESPONSE_TIMEOUT` case (section 3.4).
   The counts are telemetry. Nothing is pressed twice because of them.
3. **10/10 `changed` is the predicted shape, not an anomaly.** The root cause
   is three artwork commits that rewrote `og/*.jpg` bytes under unchanged
   URLs, so most of the 847 images genuinely differ from Telegram's cache.
   `plan.md` section 3.4 says `changed` should dominate a first reindex and
   names a mostly-`same` chunk as the thing to spot-check.
4. **"Press only when the photo changed" is circular as stated.** The delta
   is observable only after the press. A lazy tool needs a *pre-press* test.

What a pre-press test could use, measured on this host 2026-09-13:

| candidate | finding |
|---|---|
| `webpage.title` / `webpage.description` | present on the same TL object `plain()` already receives and **discarded today** (`client.mjs` keeps id/text/url/pending/photoId/buttons). Free, exact, no request - but it tests text staleness, and the root cause is image bytes |
| image dimensions | **dead end.** 846 of 847 `og/*.jpg` are 640x640; one is 1200x630. Nothing to discriminate on |
| image byte size | 15598 / 47153 / 142163 (min/median/max). Telegram's re-encode will not match ours, so at best a coarse mismatch hint |
| download Telegram's cached photo and compare perceptually with `og/<id>.jpg` | the only pre-press test that can see image staleness. **File downloads do not spend @WebpageBot's attempt quota**, which is the scarce currency, so the economics are favourable. Costs a JPEG decoder dependency and a threshold |
| record the post-press photo id in the state (schema v2) | already deferred in `plan.md` section 13. Exact and cheap, but cannot help the **first** reindex (no prior id) and inherits section 3.4's "Telegram may reuse a photo for bytes it has seen before" caveat |

### Added by the planner, pass 5 (2026-09-13) - do not re-measure

Three findings that bear on the candidate table above and are durable:

1. **A third mechanism sets `changed`, and it is in our own code.**
   `matchButtons` does not exclude a `WebPagePending` match (it filters on
   `url` and the button text only), so `photoBefore` is `null` whenever the
   bot's button message arrived before Telegram had fetched the picture, and
   `null -> <id>` classifies as `changed`. So `changed` is over-determined:
   genuine new bytes, Telegram's re-encode, *and* "there was no photo yet"
   all land in the same bucket.
2. **The origin exposes no per-file publication time**, which kills the
   cheapest pre-press idea (compare `Api.Photo.date` - it exists,
   `tl/generated/api.d.ts` line 3072 - against when the current bytes went
   live). Measured with `curl -sI` on `og/_share.jpg`, `og/w76.jpg` and
   `og/cc19.jpg`: all three return the **identical**
   `last-modified: Sun, 13 Sep 2026 08:36:03 GMT` (the deploy, not the
   file), and `etag` is `"<deploy-stamp>-<content-length>"` - `6aa66073`
   shared, then `7c22`/`15333`/`6339`, which are the three file sizes in
   hex. The only per-file quantity the origin gives up cheaply is the size,
   which is the one quantity Telegram's re-encode makes incomparable.
3. **195 accepted presses, 195 `changed`, 0 `same`.** Under B4 a press the
   bot refuses stops the run, so every press in the live restart was
   accepted. On an obscure site, some of those 195 URLs had certainly never
   been unfurled before this reindex sent them - Telegram fetched those
   fresh at send time, so their stored photo was already current, and the
   press re-downloaded identical bytes. The id moved anyway. That is an
   **inference, not a measurement** (it assumes some were previously
   uncached); `plan.md` section 9 step G.7 is the one-press experiment that
   settles it. Do not write it into a spec until it does.

State of the world when the owner asked: the restart is mid-flight,
`tools/tg-preview/state.json` untracked at **195 of 1062 URLs**, worktree HEAD
`0f33aa2`, main checkout HEAD `b0545ed`. A peer interactive session
(`tg-preview-refresh-59`) was live in this worktree; the owner confirmed it is
theirs and authorised planning to proceed anyway.

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

## The local reindex finished; the goal is now CI (owner, 2026-09-16)

Owner's words: the tool "was successfully run locally", so embed it in CI;
pull the latest `main` first because it "significantly advanced"; make the CI
job **fail-safe** - "I'm OK with eventual consistency and these limits are
hitting hard, so e.g. if we timeout - I don't care much as long as it will be
picked up by the next CI run"; and the **GitHub repository secrets/variables
are already configured** on the owner's side (so `TG_API_ID`, `TG_API_HASH`,
`TG_SESSION` should be assumed present - the `Secrets present?` skip guard in
`previews.yml` is no longer the expected path).

Measured by the orchestrator, 2026-09-16, in this worktree at `4a042c7`:

| Fact | Value |
|---|---|
| `tools/tg-preview/state.json` | **complete**: `version 1`, 1062 urls, `updatedAt 2026-09-14T20:04:16.406Z`, 135 KB, still **untracked** |
| `node tools/tg-preview/run.mjs --dry-run` | `nothing to refresh` (exit 0) on this tree |
| Branch vs `origin/main` | **11 ahead, 101 behind**. `origin/main` is `5a36c4a docs(56-followup): record the B2 commit, real gate results, and next action` |
| `origin/main` contains none of this task's files | `git ls-tree origin/main -- tools/tg-preview .github/workflows docs/tg-preview.md` returns only `.github/workflows/ci.yml` |
| Files this branch changed that `main` also changed since the base | `README.md`, `README.ru.md`, `docs/specs/COVERAGE.md`, `docs/specs/META.md`, `package.json`. `.gitignore` is ours alone. Everything else is a new file |
| Local `git --version` | 2.33.0.windows.1 - **no `git merge-tree --write-tree`**, so a conflict dry-run needs a real trial merge |
| Peers at dispatch | `ListAgents`: 3 peer sessions, one busy (`daggerheart-loot-8b`, the main checkout), none writing this worktree |

So O2 is **done**, and the 1062-entry `state.json` is the artefact CI must
inherit: `previews.yml`'s Refresh step reads
`origin/main:tools/tg-preview/state.json` and treats a missing file as "every
url is stale", i.e. a 1062-URL re-send. Committing the owner's finished state
in the same change that turns the workflow on is therefore not a convenience,
it is the thing that stops CI redoing the whole reindex.

### What `main` changed that bears on this workflow

`.github/workflows/ci.yml` on `origin/main` (read 2026-09-16):

- The workflow is still named **`check`**, so `previews.yml`'s
  `workflow_run: workflows: [check]` still names a real workflow.
- Issue 47's **cut-over shipped**: `deploy` publishes the built rewrite
  (`dist/index.html`, `dist/assets`, `dist/data.js`) plus `data.json`,
  `catalog.csv`, `llms.txt`, `robots.txt`, `.nojekyll`, `LICENSE` and the
  `img og i card` directories copied from the repository. **`i/` and `og/`
  are still tracked repository directories**, so `manifest.mjs`'s
  `buildFromTree` still works - the cut-over risk `context.md` flagged
  earlier has not materialised.
- New `golden` job (4 shards); `parity` now runs on `workflow_dispatch` only;
  `deploy` is `needs: [check, audit, secrets, golden]`.
- `deploy` runs inside the `check` workflow, so `workflow_run` on `check`
  completing still fires **after** publication.

### Added by the planner, pass 6 (2026-09-16) - do not re-measure

Read-only measurements made while planning B6, in the order they bear on the
batch. Worktree HEAD `4a042c7`, `origin/main` `5a36c4a`, merge base `8b96ff4`.

1. **The merge has exactly one textual conflict, in `package.json`.** Git
   2.33 has the old three-argument `git merge-tree <base> <ours> <theirs>`
   (read-only, prints the merged result with conflict markers); run against
   `8b96ff4 HEAD origin/main` it reports `changed in both` for the five
   shared files and **one** `<<<<<<<` hunk: the `"check"` script line, where
   `main` inserted `node --check tools/check-site.mjs &&` after `typecheck`
   and this branch inserted `node --test tools/tg-preview/lib.test.mjs &&`
   before `npm run test`. `README.md`, `README.ru.md`, `docs/specs/COVERAGE.md`
   and `docs/specs/META.md` auto-merge cleanly (our additions are one table
   row, one table row, one paragraph at COVERAGE line 259, and META section
   7). The `"previews"` script and the `.gitignore` `.env` block are ours
   alone and merge without conflict.
2. **`main` changed what the manifest fingerprints, so the merged tree is
   *not* `nothing to refresh`.** Since the base, `main` added 30 records
   (`ci61`-`ci81`, `f95`, `hi61`-`hi68`, each with a new `og/*.jpg`),
   changed `tools/build-share-pages.js` so frame records (`f1`-`f94`) and
   `starting` records carry a provenance prefix in `og:description`
   ("Прочее · Сеттинги · Пир зверей. ..."), and changed the root's
   `og:description` count (`1061` -> `1091` позиции). `og:image` URLs and
   existing image bytes did not change. So after the merge the 1062-entry
   `state.json` is complete for everything it names and the dry run should
   report on the order of **125-135 stale of 1092 URLs** (root + 94 frames
   + 30 new + any `starting` records) - the exact number is B6's to record.
   That backlog is real (those previews are stale on Telegram) and is the
   first thing CI should refresh; **do not regenerate or edit the state to
   make it zero.** `page` is still exported from `build-share-pages.js` on
   `main` and it still reads `global.window.LOOT`, so `manifest.mjs`'s two
   `require()` seams should keep working; the post-merge dry run is the test.
3. **`state.json` facts, taken without printing an entry:** blob
   `git hash-object` = `7c6e37ebec07ef8482f8208c1da2e4b7ca0441de`; `version
   1`, `site https://artex-x.github.io/daggerheart-loot/`, 1062 keys,
   `updatedAt 2026-09-14T20:04:16.406Z`, every value a 64-hex sha256; no
   `state.json.tmp` sibling in `tools/tg-preview/`. Any later `hash-object`
   that differs means the file was touched.
4. **The commit gate's tree key already includes untracked files**
   (`.claude/hooks/tree-key.mjs` runs `git add -A` into a throwaway index),
   so a passing `npm run check` taken while `state.json` sits untracked
   still arms the gate for the commit that stages it. `issues/**` and every
   `.md` except the two READMEs are exempt (`bash-guard.mjs`, `isExempt`).
   B6 therefore needs **two** gated checks, not four: one on the merged tree,
   one on the B6 tree.
5. **`npm run check` already parses `previews.yml`.** `format:check` is
   `prettier --check .` and `.prettierignore` does not exclude `.github/`,
   so a malformed or unformatted workflow file fails the gate. No
   `actionlint` on this host, no PyYAML (`import yaml` fails), no `yaml`/
   `js-yaml` under `node_modules/`; Prettier is the local YAML parse.
6. **coreutils `timeout` is available** on ubuntu-latest and in this host's
   Git Bash (`timeout 1s sleep 5` -> exit `124`). `--kill-after` makes a
   stuck process exit `137`.
7. **`ci.yml` on `main`** (also in the orchestrator's section above): the
   workflow name is still `check`; `deploy` runs inside it on every push to
   `main` (`5a36c4a`, a docs commit, was deployed too), so the live site is
   `main`'s tip and the post-merge live check should pass in round 1 if
   `origin/main` was fetched immediately before merging.
8. **GitHub Actions facts relied on by the design** (documented behaviour,
   not measured here): `workflow_run` and `schedule` only fire from the
   default branch's copy of the workflow; a `schedule` run checks out the
   default branch's tip and `github.event.workflow_run` is null in it, so a
   job `if:` written for `workflow_run` alone skips it; `concurrency` with
   `cancel-in-progress: false` keeps at most one pending run per group (a
   third arrival cancels the queued one, which is equivalent); a workflow on
   `schedule` is disabled automatically after 60 days without repository
   activity; pushes made with `GITHUB_TOKEN` do not trigger workflows (the
   `[skip ci]` in the record commit is belt and braces); a `run:` step with
   no `shell:` executes under `bash -e`, so `cmd; code=$?` is wrong and
   `code=0; cmd || code=$?` is the shape that captures a non-zero exit.

### Added by the planner, pass 7 (2026-09-16) - do not re-measure

Read-only facts gathered while filing the B6 review (approve; risks R1-R5,
six nits - verbatim in the pass-7 dispatch and summarised in `plan.md`
3.11). Worktree HEAD `72d8de0`, tree clean; nothing here touched Telegram
or `.env`.

1. **`origin/main` moved one commit since B6**, to `3504bf7 fix(hooks): pin
   issues/99's mtime in testTaskBudget ...`. `git rev-list --count
   HEAD..origin/main` = 1; `git diff --stat HEAD...origin/main` over
   `tools/tg-preview`, `previews.yml`, `docs/tg-preview.md`, `package.json`,
   `.gitignore`, `tools/build-share-pages.js`, `tools/derived.js`,
   `app/index.html`, `index.html`, `data.js`, `og`, `i` is **empty**. No
   re-merge is needed for B7; the owner's merge takes it.
2. **The five error classes R2 needs exist in the installed teleproto
   1.229.0**, `tools/tg-preview/node_modules/teleproto/errors/RPCErrorList.js`:
   `PhoneNumberBannedError` (line 3529, `PHONE_NUMBER_BANNED`),
   `YouBlockedUserError` (6143, `YOU_BLOCKED_USER`), `UserDeactivatedError`
   (6375), `UserDeactivatedBanError` (6385, `USER_DEACTIVATED_BAN`),
   `AuthKeyDuplicatedError` (6977, `AUTH_KEY_DUPLICATED`, extends
   `AuthKeyError`). `decide()` matches on `constructor.name`, so the names
   are what matter.
3. **`client.isUserAuthorized()` swallows the error it is asked about.**
   `teleproto/client/users.js:281`:
   `try { await client.api.updates.getState(); return true; } catch (e) { return false; }`.
   So `client.mjs`'s guard (lines 59-63) cannot tell a revoked session from
   a transport blip, and throws a plain `Error` for both - which is why the
   reviewer saw exit 1 where the docs said 2. Removing the guard lets the
   first RPC (`getEntity('WebpageBot')`, a `contacts.ResolveUsername`)
   throw the real class.
4. **What a dead key does at the transport level is read, not measured.**
   `teleproto/network/MTProtoSender.js:557-560` and `613-617`: a `-404`
   from the server calls `_handleBadAuthKey()` (line 660), which resets the
   key and re-keys; the RPC then fails with the 401 class
   (`AuthKeyUnregisteredError`). A *terminated* session (Telegram ->
   Devices -> terminate) normally surfaces directly as
   `AUTH_KEY_UNREGISTERED`. Neither was exercised on a live dead session;
   rotation day (runbook step J) is when that measurement is free.
5. **The deployed root is `dist/index.html`, built from `app/index.html`.**
   `ci.yml` lines 222-225: `cp -r dist/index.html dist/assets dist/data.js
   _site/` then `img og i card` from the repository. The legacy root
   `index.html` is not published. Its three `og:` tags (`title`,
   `description`, `image`; lines 16-23) and `app/index.html`'s (lines 21-28)
   are **byte-identical today**, including the `1091 позиции` count and the
   `&amp;` entity - so `manifest.mjs` switching its root source to
   `app/index.html` changes no fingerprint and the dry-run count must stay
   at B6's 125. `og/` is still a tracked repository directory copied
   verbatim.
6. **`live.mjs` is not an R1-class hole.** `verify()` wraps
   `liveFingerprint(url)` in `try { } catch { live = null }` (lines 67-76),
   so a CDN fetch failure is `not live`, never a thrown error.
7. **`lib.test.mjs` today:** 84 cases. The fake client (lines 471-522) has
   `incoming` as a queue of canned `Msg[]` and `byIds` answering from a
   `photoAfter` map - neither can throw, so R1's tests need opt-in `{ throw }`
   entries and a `byIds` script, with defaults unchanged. The `decide` fatal
   loop (254-260) lists five classes. The `--result` test (959-967) asserts
   `.urls` only, so adding `site` to the result breaks nothing. The
   `extractMeta` root test (66-71) reads `ROOT/index.html`.
8. **`.prettierignore` excludes `tools/` and `*.md`** and does not exclude
   `.github/`, unchanged from pass 6; `.gitignore`'s `tools/tg-preview`
   block (lines 37-42) ignores `.env` patterns only - no `state.json.tmp`.
9. **`git remote add` sets `remote.origin.fetch = +refs/heads/*:refs/remotes/origin/*`**,
   and `actions/checkout` builds its repository with `git init` + `git
   remote add`; that is why `git fetch --depth=1 origin main` updates
   `origin/main` in the job today. Documented git/checkout behaviour, not
   measured in a runner; R4's explicit refspec removes the dependence.
