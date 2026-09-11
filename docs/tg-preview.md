# Telegram link-preview refresh

Telegram caches a link's unfurl preview - title, description, picture - keyed
on the URL, with no TTL, and ignores everything the origin serves: a changed
`Cache-Control`, a changed `og:image` byte, a redeploy. Nothing served from
this site can invalidate that cache; the only way to change it is to ask
`@WebpageBot` to refresh the URL. Three artwork commits
(`8e7fed1`, `ce0c414`, `37ecc8d`) rewrote `og/<id>.jpg` bytes under unchanged
URLs, which is exactly the case Telegram's cache never notices - see
`docs/specs/META.md` section 7 for the durable rule.

**A refresh repairs the existing backlog.** Asking `@WebpageBot` to refresh a
URL updates the preview in every message that already carries that link, not
only in links shared afterwards - the owner has done this by hand and watched
already-posted messages change. Some published write-ups claim a refresh only
helps future shares; that claim does not hold for this site and is not
repeated here.

`tools/tg-preview/` is the tool that does this at scale: it derives every
share URL from `data.js`, fingerprints what Telegram would see for each one,
keeps a committed log (`tools/tg-preview/state.json`) of what was last sent,
and sends only what changed - in batches, paced, resumable after a crash or a
flood wait. `.github/workflows/previews.yml` runs it after every deploy that
reaches `main`; the same script runs by hand from a developer machine.

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
   `1062 urls, 107 messages`, and the live check finding all of them ready
   (the site must be deployed at the commit you are on; otherwise you will
   see some reported not live, which is the check working, not a bug).
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
4. **Regression check:** find an old message that already contained the
   `w76` link (or any link refreshed here) and confirm its preview changed
   too - that is the whole reason the first full reindex below is worth its
   twelve minutes. If it did not change, stop and report that; it would mean
   this page's opening claim no longer holds.
5. `git status` shows `tools/tg-preview/state.json` with one entry. Keep it.

**G. The full reindex.**

1. `node tools/tg-preview/run.mjs --mode full` - about 12 minutes if
   Telegram never says wait; the log shows every batch, every reply and
   every flood wait. If it stops with a `PeerFloodError`, the account is
   limited: wait a day and run the same command again - it resumes.
2. When it prints `pending 0`:
   `git add tools/tg-preview/state.json && git commit -m "chore(tg-preview): record the first full reindex"`
   and push. From here, CI only ever sends what changed.

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
  left pending for the next run.
- The summary line is `refreshed N, pending M`. `pending` covers everything
  not sent this run - not yet live on the CDN, past `--limit`, or the run
  stopped early - and a GitHub Actions run additionally prints
  `::warning::` when it is above zero. Only a dead or missing credential
  (exit 2) or a crash (exit 1) turns the job red; Telegram-side limits and a
  budget stop are green with a recorded backlog, because the site itself is
  already live and a red job would say something false about it.
- `--mode full` ignores the committed state when deciding what is stale (it
  still records into it): the way to force a full reindex without touching
  the state file.
- Deleting `tools/tg-preview/state.json` has the same effect as `--mode
  full` on the next run, but starting cold: use it only if the file's
  content is not trusted. It is otherwise the log of what has actually been
  sent, not a cache to casually clear.
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

`tools/tg-preview/lib.mjs` sends `PER_MESSAGE` (10, the bot's documented
bulk figure) URLs per message, paced 4-6 seconds apart with the bot's reply
wait folded into that pace, and rests 30 seconds every 25 messages as
insurance against limits Telegram has not documented. A `FLOOD_WAIT` or
`SLOW_MODE_WAIT` under the configured `--max-wait` (600 seconds by default)
is slept through and the same message resent; a bigger one stops the run. A
`PeerFloodError` (the account is rate-limited for the day) also stops the
run, cleanly. Either way the run exits green: the committed state is written
after every accepted message, so a crash, a stop, or the next scheduled run
picks up exactly what is still stale - there is no separate backlog file,
because the backlog is simply whatever the manifest says and the state does
not.

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
counts as stale, batching, the error-handling table, and the send loop
itself against a fake client, a fake clock and a fake live check.
`tools/tg-preview/client.mjs` (the real Telegram connection) and
`tools/tg-preview/live.mjs` (the real CDN fetch) have no unit test - they are
thin, and the only real proof either works is Telegram and the CDN
themselves, which is what step F above is for.
