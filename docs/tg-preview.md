# Telegram link-preview refresh

Telegram caches a link's unfurl preview - title, description, picture - keyed
on the URL, with no TTL, and ignores everything the origin serves: a changed
`Cache-Control`, a changed `og:image` byte, a redeploy. Nothing served from
this site can invalidate that cache; the only way to change it is to send the
URL to `@WebpageBot` **and press its "Update with content" button**. A plain
send alone only refreshes the page's title and description - it keeps the
cached picture whenever `og:image` still points at the same address, which is
exactly this site's case, because three artwork commits
(`8e7fed1`, `ce0c414`, `37ecc8d`) rewrote `og/<id>.jpg` bytes under unchanged
URLs. Only the button forces Telegram to re-download the image - see
`docs/specs/META.md` section 7 for the durable rule.

**A refresh repairs the existing backlog.** Sending a URL to `@WebpageBot` and
pressing "Update with content" on its reply updates the preview in every
message that already carries that link, not only in links shared afterwards -
the owner has done this by hand and watched already-posted messages change.
Some published write-ups claim a refresh only helps future shares; that claim
does not hold for this site and is not repeated here.

`tools/tg-preview/` is the tool that does this at scale: it derives every
share URL from `data.js`, fingerprints what Telegram would see for each one,
sends the stale ones to `@WebpageBot` in batches, waits for the bot's
one-message-per-link replies, presses "Update with content" on each, and
records a URL into the committed log (`tools/tg-preview/state.json`) only
once that press is acknowledged - paced on both the send and the press axis,
resumable after a crash or a flood wait on either.
`.github/workflows/previews.yml` runs it after every deploy that reaches
`main`; the same script runs by hand from a developer machine.

There is no bot-token path: `@WebpageBot` is a Telegram bot, and bots cannot
message other bots. Every automation route here is MTProto acting as a user
account - hence the dedicated throwaway account below, not the owner's own.

## Setup, start to finish

Everything in this section is the owner's to do by hand; no agent can perform
any of it (it needs a phone, a Telegram login, and repository settings).

**Steps A-G are done** (2026-09-11 to 2026-09-14): the throwaway account and
its credentials exist, the first full reindex finished, and its result -
`tools/tg-preview/state.json`, 1062 URLs - is committed. They are kept here
as the procedure for a future cold reindex (a new account, a rotated session,
or a state file nobody trusts any more). **H-J are the CI side**, and that is
what is live now.

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

**C. Say hello to the bot.** In the throwaway account, open `@WebpageBot` and
press *Start*. The tool would do it, but seeing the bot answer by hand proves
the account is allowed to talk to it.

**D. Local setup (after this batch is merged and pulled).**

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

   **Troubleshooting: no code arrives.** `login.mjs` now prints, before it
   asks for the code, whether Telegram delivered it in-app (the throwaway
   account's own `Telegram` service chat, from `777000`) or by SMS (the
   phone's messages, and also its call log - Telegram sometimes places a
   missed call whose calling number's last digits are the code) - read that
   line and check the place it names. If nothing arrives either way, that is
   very likely Telegram withholding codes from a third-party `api_id`, worst
   on a **new account with a new `api_id`** - exactly this setup. It has been
   observed directly: `auth.sendCode` succeeded, Telegram reported in-app
   delivery, nothing appeared, and the same account received its code
   immediately in an official client. `login.mjs --sms` (`forceSMS: true`) is
   a **last resort, not a first move** - on the number this was tried on it
   returned `SEND_CODE_UNAVAILABLE` ("all available options for this type of
   number were already used"); reaching `auth.ResendCode` at all is itself
   proof the first send used a non-SMS channel, so forcing SMS on top of that
   is what exhausts the number's remaining options. If no code arrives: **age
   the account** - use it normally from the official Telegram app for several
   days - **then retry once**, not in a loop; the code-send throttle
   escalates per attempt, and a spent number's resend options do not come
   back. Ageing is not guaranteed to fix it. If it does not, the fallbacks
   are: a manual-paste mode (not built - would need its own batch); the
   owner's own long-standing Telegram account, session for **local runs
   only**, never a repository secret; or a second throwaway account on a
   different SIM.
4. That string *is* the account. Do not paste it into chat, an issue, a
   commit, or a file outside `.env`. If it ever leaks: Telegram -> Settings
   -> Devices -> terminate that session, and redo step D.3.

**E. Clear the untrustworthy state, then dry-run (no Telegram involved).**

0. **Retire the 115-entry state file**, if one is sitting in the tree from an
   earlier run that predates the press budget below -
   `issues/tg-preview-refresh/plan.md` section 3.4 ("What the 115 entries are
   worth") has the reasoning. Move it out of the repository rather than
   deleting it, so its `photo id new` entries survive as evidence:
   ```text
   mv tools/tg-preview/state.json ../state-backup.json.bak
   ```
   Do not leave the backup inside the working tree - nothing there is
   gitignored for it, and stray `git status` noise around this file is
   exactly how a half-trusted state gets committed by accident.
1. `node tools/tg-preview/run.mjs --dry-run` - **no `--mode full`.** With no
   state file, incremental mode already means "everything": expect
   `1062 urls stale, 1062 ready, up to 107 messages, 1062 presses (press
   budget 50)` when the site is deployed at the commit you are on; otherwise
   some are reported not live, which is the check working, not a bug.
2. `node tools/tg-preview/run.mjs --dry-run --only w76` - one URL, one
   message, one press.

**F. The calibration run - one chunk, read carefully.**

1. `node tools/tg-preview/run.mjs --limit 5 --press-limit 50`. At full scale
   this is 50 URLs: five sends, fifty presses, about two minutes - but
   **not on the first two or three runs of this restart.** Step E.0 retired
   `state.json`, so every one of the 1062 URLs is stale, and the chat still
   holds roughly 115 `Update with content` button messages left over from
   the run that tripped the quota. Phase 1 presses those - in manifest
   order, no new send needed - until the 50-press budget is spent, so
   expect `phase 1: pressed 50`, **zero sends**, and
   `stopped: press budget reached` instead of `refreshed 50, pending 1012`.
   Repeat the same command two or three more times; each run drains more of
   the leftover ~115 buttons until a run reports `phase 1: pressed 0` and
   `batch 1/5` lines start appearing - that is the first run actually
   sending this reindex's own links.
2. What each outcome means, and what to do:
   - **`phase 1: pressed 50`, zero sends, `stopped: press budget reached`**
     - normal for the first two-to-three runs of this restart (see above),
     not a problem to fix. Just repeat the command.
   - **`stopped: bot throttled: retry in <N>s`** - the quota is *below* 50 on
     this account. Wait the full `N` the bot named, then retry with
     `--limit 2 --press-limit 20` and report the numbers.
   - **A run that completes 50 presses cleanly** - 50 is a safe floor. Two or
     three more clean runs are grounds to try `--limit 10 --press-limit 100`;
     the point of the flag is that you tune it on evidence rather than the
     plan guessing.
   - **Mostly `same` while `phase 1: pressed` is still nonzero** - expected,
     not a reason to distrust the chunk: those are re-presses of the
     retired state's ~115 leftover URLs, so Telegram's cached photo id is
     often already current. `new` only becomes the expected signal once a
     run shows `phase 1: pressed 0` and `batch N/5` lines - i.e. it is
     actually sending and pressing this reindex's own stale URLs.
   - **Mostly `same` once `phase 1: pressed 0` and `batch N/5` lines are
     running** - this is the genuine signal: spot-check by pasting before
     trusting the chunk, and report it.
3. In Saved Messages (any account), paste one of the URLs this run confirmed
   and compare the preview picture with the live `og/` image for that
   record. Same picture = the press works through the tool.
4. **Regression check:** find an already-posted message carrying one of
   those links and confirm its preview changed too. If it did not, stop and
   report that; it would mean this page's opening claim no longer holds.

**G. The rest of the reindex - a multi-day, spaced operation.**

1. Repeat step F.1's command - `--limit 5 --press-limit 50`, **incremental
   mode, which is the default** - until it prints `pending 0`. About 22 runs
   for 1062 URLs. Each run is resumable: it sends only what is not yet
   confirmed and presses anything already waiting in the chat.
2. **Space them.** The one measured cooldown was 3213 s (~54 minutes), so
   treat roughly an hour between chunks as the working assumption until the
   numbers say otherwise. Nothing in the tool remembers a cooldown across
   runs; the spacing is yours to keep.
3. Stops, and what they mean - **all of them are green and all of them leave
   the backlog recorded**: `bot throttled: retry in <N>s` (wait `N`, then
   continue); `press budget reached` / `press budget too low for another
   batch` (normal end of a chunk); `PeerFloodError` (Telegram, not the bot -
   stop for the day).
4. Do **not** use `--mode full` to drive this. It marks every URL stale on
   every run, so phase 1 re-presses the same recovered buttons each time and
   the reindex never advances - the tool warns when you try. `--mode full` is
   one deliberate pass for a state you do not trust, which is what step E.0
   already handles.
5. Read the photo line each time, and read it for what it measures: a
   **new photo id** proves the press made Telegram store a different image
   than the button message was showing - i.e. the press did something -
   **not** that the picture looks different. Telegram re-encodes what it
   fetches, and a webpage that had no photo yet counts as new as well. So
   `new 10, same 0, none 0, unseen 0` on every batch is the expected shape,
   not a reason to distrust the run. What *is* worth reporting is the
   opposite: a chunk reporting mostly `same` now means the presses are
   probably not landing, or the bot reworded its refusal and the throttle
   carve-out stopped matching. Spot-check a few of that chunk's links by
   pasting, and report it.
6. When `pending 0`:
   `git add tools/tg-preview/state.json && git commit -m "chore(tg-preview): record the first full reindex"`
   and push. From here, CI only ever sends and presses what changed, a
   handful of URLs at a time, well inside any quota.
7. **Optional, one press: settle what a new photo id means.** Only worth
   doing if the counter still bothers you; the reindex does not need it and
   nothing downstream is blocked on it. Between chunks - **never while a
   chunk is running**, two writers would fight over `state.json` - pick a
   record id this reindex already confirmed in the most recent batch (so
   its button message is certainly inside the recovery scan) and whose
   `og/<id>.jpg` has not changed since, then:
   ```text
   node tools/tg-preview/run.mjs --mode full --only <id> --limit 0 --press-limit 1
   ```
   `--mode full` is needed because the URL is already in the state and
   incremental mode would correctly say `nothing to refresh`; `--limit 0`
   means no send; phase 1 finds the existing button message and presses it.
   Total cost: **one press, zero sends.** Read the result:
   - **`photo id new 1`** - a press mints a new id even though the bytes on
     the site have not changed since the previous press. The counter
     measures "Telegram re-fetched", not "the picture differs".
   - **`same 1`** - the id moves only when the stored image really differs.
     Then a reindex reporting mostly `new` is literal and true.
   Report whichever it is.

**H. Repository secrets - done.** `TG_API_ID`, `TG_API_HASH` and `TG_SESSION`
exist as repository secrets. Kept here for rotation: GitHub -> the repository
-> Settings -> Secrets and variables -> Actions -> New repository secret,
three times, the same names and the same values as `.env`. The job reads
nothing else.

**I. The first CI run - what happens, and what to do while it happens.**

1. **Merge the branch into `main` and push.** That push is the trigger:
   `check` runs, `deploy` publishes, and `previews` fires on `workflow_run`
   **by itself**. There is no separate "turn it on"; the merge is the switch.
2. **While `check` is still running, dispatch a dry run:** Actions ->
   `previews` -> Run workflow -> `mode: incremental`, `dry_run: on`, `limit`
   empty. It starts immediately (a dispatch does not wait for `check`), makes
   no Telegram contact, and its job summary carries one line:
   `dry run: N url(s) stale ...`. Expect `N` on the order of 125-135: the 94
   frame stubs and the root whose `og:description` changed on `main` after the
   local reindex, plus the 30 records added since. That number is the backlog
   CI is about to work through; it is not a sign the state was lost (a lost
   state reads `1092 urls stale`).
3. **Read the automatic run's summary** when it finishes: expect
   `refreshed 50, pending ~80, stopped: press budget reached` and a second
   line `pressed 50 (photo id new ..., same ..., none ..., unseen ...)`, a
   `::warning::` about the pending count, and within a minute a commit
   `chore(tg-preview): record refreshed previews [skip ci]` on `main` by
   `github-actions[bot]`. If `phase 1: pressed N` with `N > 0` appears in the
   step log, the run found the local reindex's old button messages for
   now-stale URLs and pressed them without a send - the design working, and
   the moment to do point 5.
4. **Then leave it alone.** The schedule (every four hours at :23) runs the
   next chunk until a run reports `pending 0`; after that every scheduled run
   is `nothing to refresh` and costs a minute of runner time. Nothing needs a
   push to keep going.
5. **Spot-check - and this time the text tells you.** Paste
   `https://artex-x.github.io/daggerheart-loot/i/f1.html` (or any `f<n>` the
   summary confirmed) into Saved Messages: the description should start with
   `Прочее · Сеттинги · Пир зверей.` - the change `main` made. Old text with
   the URL recorded as refreshed would mean a press-only recovery does **not**
   refresh metadata; report it. This is cheaper and less ambiguous than
   comparing pictures, because the change this time is in the words.
6. **What a red run means from now on - and only these:** a missing or dead
   credential (`missing required env var: TG_SESSION`, or a revoked session -
   redo step D.3 and update the secret), a crash (`tg-preview run failed: ...`
   in the log - report it), a failed `npm audit`, or a state push refused
   three times (branch protection). A run that hit the 50-minute wall is
   **green** with `timed out after 50 minutes; pending urls are picked up by
   the next run` in its summary, and so is every Telegram-side stop. A red run
   whose cause is not on this list is itself worth reporting.

**J. Rotation and shutdown.** To rotate: Telegram -> Settings -> Devices ->
terminate the tool's session; redo step D.3; update the `TG_SESSION` secret
and the `.env` line. To **pause** the automation quietly: Actions ->
`previews` -> "..." -> Disable workflow (re-enable the same way; nothing else
to undo). To **stop it loudly**: delete the `TG_SESSION` secret - every run is
then red with the variable named, on purpose, so a forgotten stop cannot pass
for a healthy one. Deleting the state file is neither: it makes the next run
treat all 1092 URLs as stale and start the whole reindex over, 50 presses per
run.

Two things GitHub does on its own, so a silent stop has a known cause:
scheduled workflows are **disabled after 60 days without a push** to the
repository (any push re-enables them), and a scheduled run can be delayed by
minutes at busy times.

## Operations

- `node tools/tg-preview/run.mjs --dry-run --mode full` previews the full
  reindex: counts, the first three batches, and anything the live check
  found not yet caught up - sends and writes nothing, needs no credentials.
  In CI the counts line is also written to the job summary, so a dispatched
  dry run answers "how big is the backlog?" without opening the step log.
- `--only id1,id2` narrows to specific record ids; `root` means the site
  root. Combine with `--dry-run` for a one-URL preview, or without it to
  refresh one thing by hand.
- `--limit N` sends at most N messages, then stops (exit 0) with the rest
  left pending for the next run. `--limit` counts **sends** only, never
  presses: `--limit 0` is a press-only run - nothing new is sent, but any
  button message already waiting in the chat still gets pressed (phase 1,
  below).
- `--press-limit N` (default 50) bounds the presses a single run will
  attempt, across **both** phases - phase 1's recovery presses and phase 2's
  fresh ones draw on the same allowance, because `@WebpageBot`'s own attempt
  quota does not care which phase a press came from (below). A batch is not
  sent when fewer than `PER_MESSAGE` (10) presses remain in the budget - the
  run stops rather than sending a batch it cannot afford to press.
- The summary is two lines: `refreshed N, pending M` (`N` is how many URLs
  had their "Update with content" press acknowledged - not how many were
  merely sent), followed by `pressed P (photo id new C, same S, none Z,
  unseen U)`. `P` counts presses **attempted**, not confirmations - a press
  the bot refused with its own attempt throttle still counts here, since
  that is the number the throttle actually binds on. `pending` covers
  everything not confirmed this run - not yet live on the CDN, past
  `--limit` or `--press-limit`, an unanswered press whose photo id did not
  move, no button message ever arrived, the bot's attempt throttle, or the
  run stopped early - and a GitHub Actions run additionally prints
  `::warning::` when it is above zero.

  A new photo id proves Telegram is now holding a different image than the
  button message showed before the press - the press did something. It does
  **not** prove the rendered picture differs: Telegram re-encodes whatever
  it fetches and mints a new id even for bytes it already had, and a
  webpage that had no photo yet also counts as new. So `new 10, same 0,
  none 0, unseen 0` on a run is the expected shape, not a broken counter.
  `unseen` means the press went out but the message could not be re-read
  afterwards, so the tool does not claim to know its photo id either way.
- What turns the CI job red: a crash or a dead/missing credential (`Refresh`
  exiting 1 or 2 - a missing secret is red, with the variable named and never
  valued), a failed `npm audit --audit-level=high`, or a failed state push
  after three retries. A Telegram-side stop (`PeerFloodError`, a budget stop,
  `@WebpageBot`'s own attempt throttle) is green with a recorded backlog,
  because the site itself is already live and a red job would say something
  false about it - and so is a run that hit the 50-minute wall, which is green
  with `timed out after 50 minutes; pending urls are picked up by the next
  run` in the job summary.
- `--mode full` ignores the committed state when deciding what is stale (it
  still records into it). It is a single deliberate pass for a state you do
  not trust, **not** how to chunk a reindex: every URL is stale on every
  run, so phase 1 re-presses the same recovered buttons each time and the
  run never advances against the bot's attempt quota. The tool warns when
  `--press-limit` cannot cover the stale set under `--mode full`; chunking a
  reindex uses the default incremental mode instead (setup step G).
- Deleting `tools/tg-preview/state.json` has the same effect as `--mode
  full` on the next run, but starting cold: use it only if the file's
  content is not trusted. It is otherwise the log of what has actually been
  confirmed refreshed, not a cache to casually clear.
- `--no-verify` skips the live-CDN check. Use it only when there is no
  network path to Pages from where the tool is running, or right after
  confirming by hand that a deploy has landed; skipping it risks refreshing
  a URL into the *old* preview if Pages has not caught up yet.

## What CI does after a deploy

`.github/workflows/previews.yml` runs on `workflow_run` of `check` (only
when it succeeded, only on `main`), **every four hours at :23** on a
`schedule`, and on demand (`workflow_dispatch`, with `mode`/`dry_run`/`limit`
inputs). It checks out
the commit `check` just verified, reads `tools/tg-preview/state.json` from
the freshest `main` (not necessarily the checked-out commit - a refresh
committed between two quick pushes must not be re-sent), runs the tool, and
if anything was sent, commits the updated state back to `main` as
`github-actions[bot]` with `[skip ci]` so the commit does not retrigger
`check` or another `previews` run. It never blocks a deploy: `deploy`
finished before `previews` started, and holds `contents: write` on no job but
this one.

**Why a schedule as well as a push.** A run that stops on the bot's attempt
throttle or on the press budget leaves work pending, and `workflow_run` alone
would strand it until somebody pushed again. Every four hours is four times
the one measured cooldown (3213 s), so a backlog of ~130 URLs drains in about
half a day and a full 1062-URL re-fingerprint in under four days, with no
push at all. An idle scheduled run makes **no Telegram contact** - it prints
`nothing to refresh` before the live check and before the client is ever
loaded - and costs about a minute of runner time. GitHub disables a scheduled
workflow after 60 days without a push to the repository; any push re-arms it,
and runs can be delayed by minutes at busy times.

**Three clocks, nested**: `--budget-minutes 40` (the tool's own deadline,
checked before every send and press) inside `timeout --kill-after=30s 50m`
around `node` (the hard stop for a hang the deadline cannot see) inside the
job's `timeout-minutes: 60` (which leaves the record step its room). The
record step runs `if: always()`, so what a failed run confirmed is still
committed.

**A red run means the next run will not fix it.** Only these turn the job
red: a dead or missing credential (exit 2, the variable named and never
valued), a crash (exit 1), a failed `npm audit --audit-level=high`, or a
state push refused three times. Every Telegram-side stop - `PeerFloodError`,
a flood wait past `--max-wait`, the press budget, the deadline,
`@WebpageBot`'s attempt throttle - is green with the backlog recorded, and so
is a run killed at the 50-minute wall: exit `124`/`137` is mapped to green
with `timed out after 50 minutes; pending urls are picked up by the next run`
in the job summary. There is no `continue-on-error` anywhere, because it
would erase the honest reds along with the noisy ones.

## Rate limiting and resumability

The bot answers one send with one summary message plus **one button message
per link**, so the run has two axes with independent pacing: sends and
presses. `tools/tg-preview/lib.mjs` sends `PER_MESSAGE` (10, the bot's
documented bulk figure) URLs per message, paced 4-6 seconds apart with the
wait for the bot's button messages folded into that pace, and rests 30
seconds every 25 messages as insurance against limits Telegram has not
documented. Presses are paced separately, 1-2 seconds apart, and never
rested - they are a different RPC method (`messages.getBotCallbackAnswer`),
so a send-axis rest is not assumed to apply to them. That arithmetic (107
sends plus 1062 presses) says a full reindex is about 40 minutes end to end -
but no account gets to spend 1062 presses that fast; see the attempt quota
below, which is the limit that actually governs a first reindex.

A `FLOOD_WAIT` or `SLOW_MODE_WAIT` under the configured `--max-wait` (600
seconds by default) is slept through and the same send or press retried; a
bigger one stops the run, and so does a wait that would end past
`--budget-minutes`'s deadline - that deadline is checked before every single
send and press, not once per batch, so a run never overshoots it by more
than one wait. A `PeerFloodError` (the account is rate-limited for the day)
also stops the run, cleanly, wherever it comes from. A press that Telegram
never answers in time (`BOT_RESPONSE_TIMEOUT`) is neither of those: the tool
re-fetches the button message and treats a new photo id as confirmation,
since the press was still delivered.

Either way the run exits green: the committed state is written after every
batch's presses (and after phase 1, below), so a crash, a stop, or the next
scheduled run picks up exactly what is still unconfirmed - there is no
separate backlog file, because the backlog is simply whatever the manifest
says and the state does not.

**A third limit: `@WebpageBot`'s own attempt quota.** Independently of
Telegram's flood control above, the bot keeps its own counter of update
attempts per user and refuses everything past it - presses and sends alike -
with `"Sorry, too many attempts. Please try again in <N> seconds."` This is
the limit that actually binds: a measured run of 115 presses in about four
minutes tripped it, and the very next send got no button messages at all,
with `N` reported as 3213 (about 54 minutes). The tool cannot know the exact
quota, so it does not try to model it; `--press-limit` (default 50,
`PRESS_LIMIT` in `lib.mjs`) is a run-scoped budget on presses, spanning both
phases, that deliberately under-shoots the one observed failure point - the
costs are asymmetric, since over-shooting costs the ~54-minute lockout plus
the sends already spent, and under-shooting costs one extra two-minute run.
Recognising the refusal text (`botThrottle` in `lib.mjs`) stops the run
immediately rather than waiting the named `N` out: the one sample is 3213 s,
well past `--max-wait` and CI's own budget, and unlike a Telegram
`FLOOD_WAIT` (which suspends one RPC method) this refusal applies to every
attempt of either kind, so there is nothing useful to do on the other side of
a sleep that the next run would not do anyway. Both are green, resumable
stops with the backlog recorded - see setup steps F and G for the chunked
cadence this implies.

**Phase 1 - a button message already in the chat is a cheaper retry, not a
free one.** Pressing it needs no new link, so it costs nothing on the send
axis - but it still costs a press from the same `--press-limit` budget above,
and presses are the scarcer resource. Every run starts by scanning the last
200 chat messages for button messages that answer a still-stale URL, and
presses every one of them before sending anything new.
This is what makes a crash mid-run, a budget stop, a press-budget stop, or an
unanswered press cheap to recover from: the next run presses whatever is
still sitting in the chat before spending a single new send.

## Secrets

`TG_API_ID`, `TG_API_HASH`, `TG_SESSION` - the same three names as
repository secrets and as `.env` entries. `TG_SESSION` is a full Telegram
account credential: never printed, never committed (`.env` and `.env.*` are
gitignored), and reported only by name when missing, never by value. Nothing
under `tools/` is published to Pages - the deploy job's allow-list already
refuses it.

## Coverage

`tools/tg-preview/lib.test.mjs` runs under `node --test` inside `npm run
check` and covers every pure function: URL derivation, fingerprinting, what
counts as stale, batching, the error-handling table (including an
unanswered press), `matchButtons` (exact and trailing-slash matching, the
bot's plain summary, duplicate button messages), `botThrottle` (the bot's
attempt-throttle sentence, with and without a seconds figure), the
`--press-limit` press budget (spent across both phases, a batch refused
before its send when the budget cannot afford it, the `--mode full` warning),
and the two-phase send-and-press loop itself against a fake client, a fake
clock and a fake live check. `tools/tg-preview/client.mjs` (the real
Telegram connection) and `tools/tg-preview/live.mjs` (the real CDN fetch)
have no unit test - they are thin, and the only real proof either works is
Telegram and the CDN themselves, which is what step F above is for.
