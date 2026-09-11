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

**E. Dry runs (no Telegram involved).**

1. `node tools/tg-preview/run.mjs --dry-run --mode full` - expect
   `1062 urls stale, 1062 ready, up to 107 messages, 1062 presses`, and the
   live check finding all of them ready (the site must be deployed at the
   commit you are on; otherwise you will see some reported not live, which
   is the check working, not a bug).
2. `node tools/tg-preview/run.mjs --dry-run --only w76` - one URL, one
   message, one press.

**F. The residue check - the first run of the fixed tool.**

1. `node tools/tg-preview/run.mjs --only cc12,cc24,cc38`. These three were
   sent by an earlier probe of the unfixed tool and never pressed; their
   button messages are already sitting in the chat. Expect the log to show
   phase 1 pressing three buttons and phase 2 sending **nothing**, and the
   summary `refreshed 3, pending 0` / `pressed 3 (photo changed 3, same 0,
   none 0)`. `changed 3` is the expected result because all three pictures
   are known stale; `same` on any of them is worth reporting before going on.
2. Open the throwaway account's chat with `@WebpageBot`: nothing new was
   sent; the three button messages now show the new pictures.
3. In Saved Messages (any account), paste
   `https://artex-x.github.io/daggerheart-loot/i/cc12.html` and compare the
   preview picture with the live `og/` image for that record. Same picture =
   the press works through the tool, not only by hand.
4. **Regression check:** find an already-posted message carrying one of
   those three links and confirm its preview changed too. If it did not,
   stop and report that; it would mean this page's opening claim no longer
   holds.
5. `git status` shows `tools/tg-preview/state.json` with four entries (one
   from an earlier hand press, plus these three). Keep it.

**G. The full reindex.**

1. Run it in chunks, locally: `node tools/tg-preview/run.mjs --mode full
   --limit 10` sends 100 URLs and presses 100 buttons in about four minutes;
   repeat it, spread across the day, until it prints `pending 0`. Each run is
   resumable: it only sends what is not yet confirmed and presses anything
   already waiting in the chat. If a run stops with `PeerFloodError`, the
   account is limited: stop for the day. One unchunked run is about 40
   minutes (up from 12, now that every URL also costs a press) and is fine on
   a healthier account.
2. Read the `photo changed` count each time. On this reindex it should be
   the large majority, because most cached photos are known stale; a chunk
   reporting mostly `same` means spot-check a few of its links by pasting
   before trusting it, and report it.
3. When `pending 0`:
   `git add tools/tg-preview/state.json && git commit -m "chore(tg-preview): record the first full reindex"`
   and push. From here, CI only ever sends and presses what changed.

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

## Operations

- `node tools/tg-preview/run.mjs --dry-run --mode full` previews the full
  reindex: counts, the first three batches, and anything the live check
  found not yet caught up - sends and writes nothing, needs no credentials.
- `--only id1,id2` narrows to specific record ids; `root` means the site
  root. Combine with `--dry-run` for a one-URL preview, or without it to
  refresh one thing by hand.
- `--limit N` sends at most N messages, then stops (exit 0) with the rest
  left pending for the next run. `--limit` counts sends only, never phase 1's
  presses (below): `--limit 0` is a press-only run - nothing new is sent, but
  any button message already waiting in the chat still gets pressed.
- The summary is two lines: `refreshed N, pending M` (`N` is how many URLs
  had their "Update with content" press acknowledged - not how many were
  merely sent), followed by `pressed P (photo changed C, same S, none Z)`.
  `pending` covers everything not confirmed this run - not yet live on the
  CDN, past `--limit`, no button message ever arrived, the press went
  unanswered with no photo change, or the run stopped early - and a GitHub
  Actions run additionally prints `::warning::` when it is above zero.
- What turns the CI job red: a crash or a dead/missing credential (`Refresh`
  exiting 1 or 2), a failed `npm audit --audit-level=high`, or a failed state
  push after three retries. A Telegram-side stop (`PeerFloodError`, a budget
  stop) is green with a recorded backlog, because the site itself is already
  live and a red job would say something false about it.
- `--mode full` ignores the committed state when deciding what is stale (it
  still records into it): the way to force a full reindex without touching
  the state file.
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
when it succeeded, only on `main`) and on demand
(`workflow_dispatch`, with `mode`/`dry_run`/`limit` inputs). It checks out
the commit `check` just verified, reads `tools/tg-preview/state.json` from
the freshest `main` (not necessarily the checked-out commit - a refresh
committed between two quick pushes must not be re-sent), runs the tool, and
if anything was sent, commits the updated state back to `main` as
`github-actions[bot]` with `[skip ci]` so the commit does not retrigger
`check` or another `previews` run. It never blocks a deploy: `deploy`
finished before `previews` started, and holds `contents: write` on no job but
this one.

## Rate limiting and resumability

The bot answers one send with one summary message plus **one button message
per link**, so the run has two axes with independent pacing: sends and
presses. `tools/tg-preview/lib.mjs` sends `PER_MESSAGE` (10, the bot's
documented bulk figure) URLs per message, paced 4-6 seconds apart with the
wait for the bot's button messages folded into that pace, and rests 30
seconds every 25 messages as insurance against limits Telegram has not
documented. Presses are paced separately, 1-2 seconds apart, and never
rested - they are a different RPC method (`messages.getBotCallbackAnswer`),
so a send-axis rest is not assumed to apply to them. A full reindex is
therefore about 40 minutes end to end (107 sends plus 1062 presses), up from
the 12 minutes a send-only pass would take.

A `FLOOD_WAIT` or `SLOW_MODE_WAIT` under the configured `--max-wait` (600
seconds by default) is slept through and the same send or press retried; a
bigger one stops the run, and so does a wait that would end past
`--budget-minutes`'s deadline - that deadline is checked before every single
send and press, not once per batch, so a run never overshoots it by more
than one wait. A `PeerFloodError` (the account is rate-limited for the day)
also stops the run, cleanly, wherever it comes from. A press that Telegram
never answers in time (`BOT_RESPONSE_TIMEOUT`) is neither of those: the tool
re-fetches the button message and treats a changed photo as confirmation,
since the press was still delivered.

Either way the run exits green: the committed state is written after every
batch's presses (and after phase 1, below), so a crash, a stop, or the next
scheduled run picks up exactly what is still unconfirmed - there is no
separate backlog file, because the backlog is simply whatever the manifest
says and the state does not.

**Phase 1 - a button message already in the chat is a free retry.** Pressing
it needs no new link, so it costs nothing on the send axis. Every run starts
by scanning the last 200 chat messages for button messages that answer a
still-stale URL, and presses every one of them before sending anything new.
This is what makes a crash mid-run, a budget stop, or an unanswered press
cheap to recover from, and it is also how the residue from an earlier probe
of the unfixed tool gets fixed with zero new sends (setup step F).

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
bot's plain summary, duplicate button messages), and the two-phase
send-and-press loop itself against a fake client, a fake clock and a fake
live check. `tools/tg-preview/client.mjs` (the real Telegram connection) and
`tools/tg-preview/live.mjs` (the real CDN fetch) have no unit test - they are
thin, and the only real proof either works is Telegram and the CDN
themselves, which is what step F above is for.
