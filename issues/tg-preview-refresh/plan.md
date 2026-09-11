# Plan - TASK tg-preview-refresh

Refresh Telegram's cached link previews for every share URL of the site: one
full reindex, then incremental refreshes after each deployment, driven by what
actually changed. One mechanism, two callers (CI and the owner's machine).
Local-only task id; no GitHub issue. Read `context.md` first, then this file,
then `handoff.md`.

## Revision history - read this first

- **Pass 1, 2026-09-11.** The original design (sections 1-13 below). Two
  owner questions; both answered before dispatch (`context.md`, decisions
  5 and 6). B1, R1 and R2 implemented it and were reviewed and approved.
- **Pass 3, 2026-09-11 (this revision).** O1's first real run **disproved
  the assumption under section 3.4 and 5.5 and under B1's send loop**: a
  plain send to `@WebpageBot` refreshes a page's title and description and
  **keeps the cached photo** when `og:image` still points at the same URL -
  which is this site's exact case. Only pressing the bot's **"Update with
  content"** inline button re-downloads the image. Everything measured is in
  `context.md`, "Sending a link to @WebpageBot does NOT refresh the image";
  nothing there is re-derived or re-tested here.

  How to read the rest of this file: every section carries one of these
  markers at its top. **Stands** - unchanged and still true. **Revised** -
  rewritten in this pass; the superseded text is summarised in a
  `> Superseded:` note and is readable in full at commit `0ab04eb`.
  Sections without a marker are pass-3 additions.

The six owner decisions in `context.md` stand and are not re-opened here.

## 1. Objective and current state

**Stands**, with one addition at the end.

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

**Added in pass 3 - what the bot actually does (measured, `context.md`).**
One outgoing message with N links makes the bot answer with **N + 1
messages**: one plain summary (`"Link previews was updated successfully.
Check them out!"`, text only, no `replyMarkup`, no webpage media) and then
**one message per link**, each carrying that link as `media.webpage.url` and
an inline keyboard of two callback buttons, `"Update preview again"` and
`"Update with content"`. The send alone updates the page's metadata and keeps
the cached photo; pressing `"Update with content"` (one
`messages.getBotCallbackAnswer`, no new link) changed the webpage's photo id
under an unchanged webpage id, and the owner saw the preview update. So the
click axis scales with **URLs**, not messages: a full reindex is 107 sends
**plus 1062 presses**.

## 2. Scope and non-goals

**Revised** - the fourth non-goal changed.

In scope: a repo tool under `tools/tg-preview/` that derives the URL set from
`data.js`, fingerprints what Telegram would see, keeps a committed state file
of what was last **confirmed refreshed**, sends the stale URLs to
`@WebpageBot` in batches, **presses "Update with content" on every button
message the bot produces**, records a URL only when that press is confirmed,
paces both axes and handles flood limits on both, and resumes after a crash;
a second workflow file that runs it after every successful deploy and on
demand; the owner's runbook.

Out of scope, on purpose:

- Any change to `i/<id>.html`, `og/*.jpg`, `noindex`, `robots.txt`,
  `llms.txt`, `docs/fixtures/` or `tests/contracts.js`. The public contract
  does not move. See "Cache-busting the `og:image` URL - not taken" in
  section 3.4 for why this stays true even now.
- A hosted service, a webhook, a backend (`META.md` section 3).
- Other messengers (Discord, WhatsApp, Slack). Their caches differ and none
  has a refresh bot; not this task.
- Parsing the bot's **text** for control flow. The reply and callback-answer
  vocabulary is still unverified beyond the one summary sentence; texts are
  logged verbatim and never branched on. What the tool *does* read is the
  bot's message **structure** - `media.webpage.url` and the callback buttons -
  which is typed TL data, not prose.

> Superseded: pass 1 also excluded "refreshing previews of already-posted
> messages if Telegram does not do that" - answered by owner decision 6: it
> does.

## 3. The decisions

### 3.1 The client: `teleproto` from a repo script, not `WebpageBot-api`

**Stands.** `teleproto@1.229.0` in a nested package `tools/tg-preview/`,
verified by introspection and by B1's install; `telegram@2.26.22` is the
API-identical fallback. The rejections (`WebpageBot-api`, gramjs itself,
`@mtcute/node`, `@mtproto/core`, TDLib) stand. Full text at `0ab04eb`.

One pass-3 addition: the button press uses `client.invoke(new
Api.messages.GetBotCallbackAnswer(...))`, not `Message.click()`. `click()`
swallows `BOT_RESPONSE_TIMEOUT` into `null` (read in
`tl/custom/messageButton.js`), and the loop must tell an answered press from
an unanswered one (section 3.4).

### 3.2 URL discovery: from `data.js`, through `tools/derived.js`

**Stands.** 1062 URLs, root first, from `everything(L)` and `SITE`; stub
content rendered in memory by `page(it)`; cut-over seams are the two
`require()`s in `manifest.mjs` and `--assets`.

### 3.3 Change detection: a committed fingerprint state, written by both callers

**Stands**, with the meaning of one sentence sharpened.

Fingerprint per URL: `sha256([og:title, og:description, og:image, sha256(image bytes)])`.
State at `tools/tg-preview/state.json`, committed on `main`, schema
`version: 1`, `{ site, updatedAt, urls: { url: fingerprint } }`. Bootstrap,
loss, deleted-record and two-writer rules unchanged; the rejected
alternatives (git diff, Actions cache, Pages-published manifest, orphan ref)
unchanged.

The sharpened sentence: the state records the fingerprint *as last
**confirmed** refreshed*, where confirmed is defined in section 3.4 - a sent
message with a reply is **no longer** sufficient evidence. The schema does
not change (still a fingerprint string per URL), so the one honest entry
that exists today (`cc19`, whose button the owner pressed by hand) stays
valid without migration.

### 3.4 Rate limiting, confirmation and resumability - two axes

**Revised.**

> Superseded: pass 1 sized the run at 107 messages, ~12 minutes, with a
> URL counted as refreshed once its message was sent and any reply arrived,
> and treated the bot's reply as an opaque string to log. All of that is
> replaced below. The error table survives with one added row.

#### Constants

All in `lib.mjs`, one place. Values marked *kept* are pass 1's.

| name | value | why |
|---|---|---|
| `PER_MESSAGE` | 10 (*kept*) | still the right batch: the press cost is per URL and is the same at any batch size, so batching earns its keep only on the send axis, and the largest documented batch is the fewest sends. Ten links measured fine (three did); nothing argues for changing it |
| `PACE_MS` | 4000-6000 ms (*kept*) | between sends; doubles as the first wait for the bot's button messages |
| `BUTTON_WAIT_ROUNDS` / `BUTTON_WAIT_MS` | 6 / 5000 ms | extra polls when fewer button messages than links have arrived yet - the bot fetches every page before it can answer for it |
| `BUTTON_FETCH` | 50 | `limit` when reading replies newer than the sent message; 11 are expected per batch |
| `PRESS_PACE_MS` | 1000-2000 ms | between callback presses. Official clients press with no pacing at all; this is insurance on a days-old account |
| `RECOVER_SCAN` | 200 | how many recent chat messages are read at run start to find pressable button messages that need no new send (resumability, below) |
| `UPDATE_BUTTON` | `'Update with content'` | matched by exact button text |
| `REST_EVERY` / `REST_MS` | 25 sends / 30 s (*kept*) | send axis only |
| `MAX_WAIT_S` | 600, `--max-wait` (*kept*) | applies to a `FLOOD_WAIT` on either axis |
| `NET_RETRIES` / `NET_RETRY_MS` | 3 / 10 s (*kept*) | transport errors on either axis |
| `BUDGET_MIN` | none locally; 45 in CI (*kept*) | see "The deadline" below - its semantics tightened |

#### Arithmetic

Send axis: 107 sends at ~5 s plus four rests = **~11 min**. Press axis: 1062
presses at ~1.5 s = **~27 min**. Button waits mostly fall inside the pace;
one re-fetch per batch is negligible. A full reindex with no flood waits is
therefore **~40 minutes**, up from 12. That fits CI's 45-minute budget with
little to spare, and the state is written after every batch, so a budget
stop simply leaves the remainder for the next run. The runbook keeps the
orchestrator's advice for the first reindex: run it locally in `--limit 10`
chunks (100 URLs, ~4 minutes each) rather than as one run.

#### The pace and flood model per axis

- **Sends** behave as in pass 1: pace, rest every 25, `decide()` on error,
  retry the same message after a `FLOOD_WAIT` under `MAX_WAIT_S`.
- **Presses** are paced by `PRESS_PACE_MS`, never rested (rests are a
  send-axis guess and presses are a different method). A `FLOOD_WAIT` on
  `messages.getBotCallbackAnswer` goes through the same `decide()` table:
  sleep `seconds + 2` and **re-press the same button**; over `MAX_WAIT_S`
  stops the run; `PEER_FLOOD` stops the run. Presses are not sends, so a
  send-side `PEER_FLOOD` does not imply presses would fail - but the run
  stops on the first `PEER_FLOOD` wherever it comes from; nothing is gained
  by finding out.
- **`BOT_RESPONSE_TIMEOUT`** (`BotResponseTimeoutError`, `errorMessage
  'BOT_RESPONSE_TIMEOUT'`, present in teleproto's error list) is the one
  press-only error: Telegram delivered the callback query but the bot did
  not answer within Telegram's window. It is neither a retry nor a stop;
  `decide()` returns `{ unanswered: true }` and confirmation falls back to
  the photo check below.

`decide(error, ctx)` table, pass 1's rows plus one:

| error | outcome |
|---|---|
| `FloodWaitError`, `SlowModeWaitError` with `seconds <= MAX_WAIT_S` | retry the **same** send or press after `seconds + 2` |
| the same with `seconds > MAX_WAIT_S` | stop; reason names the seconds |
| `PeerFloodError` | stop: the account is limited; nothing more will go through today |
| **`BotResponseTimeoutError`** | **`{ unanswered: true }` - the press was delivered; confirmation needs the photo check** |
| `AuthKeyUnregisteredError`, `SessionRevokedError`, `SessionExpiredError`, `SessionPasswordNeededError`, `AuthKeyInvalidError` | fatal: the credential is dead, exit 2, do not retry |
| any other `RPCError` | stop; reason is `errorMessage` |
| non-RPC error (socket, DNS) | retry after 10 s, up to `NET_RETRIES`, then stop |

#### The deadline (`--budget-minutes`)

Still meaningful - it is what keeps a CI run inside `timeout-minutes: 60`
with room for the state commit - and tightened, folding in the reviewer's
deferred item 1 (section 13):

- The deadline is checked before **every send attempt and every press
  attempt**, not once per batch. Pass 1 checked it per batch, so a
  `FLOOD_WAIT` sleep followed by the retry could overshoot it by up to
  `MAX_WAIT_S`; with ten presses per batch the per-batch check would have
  been looser still.
- A wait that would **end** past the deadline is not started: `stop` with
  reason `flood wait of Ns would exceed the budget`. The run therefore ends
  no later than the deadline plus one pace.
- The clock starts after the live check, as before (the check has its own
  five-round bound).

When the deadline hits mid-batch, the presses already confirmed are
recorded, the rest of the batch stays pending, and the next run recovers
those without a new send (below).

#### What counts as confirmed - the state's evidence rule

The state must not assert what the tool cannot show. A URL's entry is
written only when **all** of these hold:

1. **A button message was matched to it exactly.** Among the bot's incoming
   messages, a *button message* is one whose `media.webpage.url` is
   non-null and whose inline keyboard contains a callback button with text
   `UPDATE_BUTTON`. It is matched to a sent URL by **`media.webpage.url`
   equality**, never by position or count. One permitted normalisation:
   if exact equality fails, compare with a single trailing `/` stripped from
   both sides - that covers the site root, the one URL Telegram could
   plausibly canonicalise; nothing else is normalised. When the same URL
   has several button messages, the newest (highest id) wins. The summary
   message is excluded by construction: it has no webpage media and no
   buttons.
2. **The press was acknowledged, or its effect was observed.** Either
   `messages.getBotCallbackAnswer` returned a `BotCallbackAnswer` (answered
   - the bot handled the press), **or** it raised `BOT_RESPONSE_TIMEOUT`
   *and* re-fetching the button message afterwards shows a **different
   `photo.id`** than before the press (unanswered, but the re-download
   visibly happened).

Everything else leaves the URL **pending**: no button message arrived for it
(logged as `no button message for <url>`), the press was stopped by the
deadline or a flood stop, or the press went unanswered and the photo did not
change.

**The photo-id trap, handled.** A photo id that stays the same is **not**
evidence of failure: an image whose bytes are genuinely unchanged on the
site keeps its Telegram photo, and so does a URL whose cache was already
current (the hand-pressed `cc19`, or a page first unfurled after the artwork
commits). So the photo delta is a **gate only in the unanswered case**, where
it is the sole signal, and **telemetry everywhere else**: after each batch's
presses, the button messages are re-fetched once by id and each is classed
`changed`, `same` or `none` (no photo on the webpage - a pending or
imageless preview). The counts go into the log, the summary line and
`$GITHUB_STEP_SUMMARY`. The runbook tells the owner what to expect: on the
first full reindex `changed` should dominate, because most cached photos are
known stale; a chunk that reports mostly `same` is the signal to spot-check
by pasting a link before trusting that chunk's state. The tool cannot make
that judgement, and does not pretend to.

**Considered and not taken: recording the photo id in the state** so an
incremental run could demand a *changed* photo whenever the image sha
changed since the last entry. It is the stronger rule, but it needs a
schema `version: 2`, it cannot apply to the first reindex (no prior id), and
Telegram may reuse a photo for bytes it has seen before (an artwork revert),
which would leave a URL pending forever. Recorded in section 13 as a
follow-up worth doing once the first reindex shows how often `same` really
occurs.

**Cache-busting the `og:image` URL - not taken.** Appending a content hash
to the image URL would make even a plain send re-download, and would break a
frozen contract: `og/<id>.jpg` is a published artefact (`CONTRACTS.md`), so
`docs/fixtures/`, `tests/contracts.js`, `CONTRACTS.md` and `llms.txt` would
move in the same commit, `tools/build-share-pages.js` would change, and
every previously shared stub would still carry the *old* image URL in
Telegram's cache until refreshed anyway - so it saves nothing on the first
reindex and only helps future artwork refreshes, which the incremental path
already handles. The press is measured to do the job without any of that.
It stays the named escape hatch only if a later measurement shows the press
stops working.

#### Resumability - the state file plus the chat itself

Pass 1's rule stands: the backlog is whatever the manifest says and the
state does not; the state is written after every batch (and after the
recovery phase), so a crash loses at most one batch of presses.

New: **a button message already in the chat is a free retry.** Pressing it
needs no new link, so it costs nothing on the send axis. At run start,
after the live check and before any send, the tool reads the last
`RECOVER_SCAN` incoming messages and matches them against the stale, ready
URLs exactly as above. Every match is pressed (**phase 1, recovery**)
before any batch is sent (**phase 2**). This covers, with no extra send:

- a run that died between the send and the presses;
- a budget or flood stop mid-batch;
- a press that went unanswered with an unchanged photo;
- **the residue** from O1's probe - `cc12`, `cc24` and `cc38` were sent and
  never pressed, so their button messages sit in the chat now. The first
  run of the fixed tool, `--only cc12,cc24,cc38`, is exactly this path:
  three presses, zero sends, three state entries. The runbook makes it
  step F.

A stale URL whose button message is older than the scan window is simply
re-sent in phase 2 and pressed like any other. URLs matched in phase 1 but
left unconfirmed are **not** re-sent in the same run - a fresh send would
only produce another button message to press - they stay pending for the
next run.

The assumption under phase 1, stated so it can be checked: pressing "Update
with content" on an **older** button message performs the whole update -
page metadata and image - not only the image. Evidence for it: the measured
`cc19` press changed the photo on a message created by an earlier send, and
"with content" names the superset of "Update preview again". If the residue
check (runbook F) ever shows a stale *title* after a press-only refresh,
the fallback is one constant: `RECOVER_SCAN = 0` disables phase 1 and every
stale URL is re-sent.

**Exit codes stand:** green with a recorded backlog on any Telegram-side
limit or a budget stop; red (2) only for a dead or missing credential; red
(1) for a crash.

### 3.5 Where it hangs in CI: a second workflow, `previews.yml`

**Stands.** `previews.yml` is **not touched** by the next batch: its inputs,
permissions, concurrency, the state read from the freshest `main`,
`--budget-minutes 45`, the `[skip ci]` record step and R1's four fixes all
remain correct under the two-phase loop. The only thing that changed is what
the 45 minutes buy (section 3.4, arithmetic).

### 3.6 Secret handling

**Stands.**

### 3.7 Verification, honestly

**Revised** - the test list and the port grew.

What a test can assert, all pure, under `node:test` in
`tools/tg-preview/lib.test.mjs`, run by `npm run check` (pass 1's list is
kept in full; additions are marked):

- `urls`, `extractMeta`, `fingerprint`, `imageName`, `buildManifest`,
  `stale`, `chunk`, `applyResult` - unchanged.
- `decide`: every row of the table in 3.4, **plus** `BotResponseTimeoutError`
  -> `{ unanswered: true }`.
- `parseArgs`: unchanged, **plus** a non-numeric or negative `--limit`,
  `--max-wait` or `--budget-minutes` throws (reviewer's item 3).
- **`matchButtons(messages, urls)`**: exact `url` match; a message without
  webpage media (the summary) is never a button message; a message with a
  webpage but without the `UPDATE_BUTTON` button is not one either; the
  newest of duplicate button messages wins; the trailing-slash fallback
  matches the root and nothing else; unmatched URLs are reported in input
  order; outgoing messages are ignored.
- `runRefresh` with a fake client, fake clock and fake live check. Kept from
  pass 1: sends in manifest order; `--limit` counts sends; `--only`
  narrows; dry run sends and writes nothing and never loads the client;
  small `FLOOD_WAIT` on a send resends the same message once; `PEER_FLOOD`
  on a send stops green with the confirmed ones recorded; a dead credential
  is exit 2; not-live URLs are excluded and reported; the summary numbers
  add up. **Added:** a batch's button messages are pressed and only
  confirmed URLs reach the state; fewer button messages than links leaves
  the unmatched ones pending and unrecorded; button messages that arrive
  late are found on a later wait round; a `FLOOD_WAIT` on a press re-presses
  the same button; `PEER_FLOOD` on a press stops with earlier presses
  recorded; an unanswered press with a changed photo is confirmed and with
  an unchanged photo is pending; phase 1 presses a button message found in
  the scan and sends nothing for that URL; `--limit 0` still runs phase 1;
  the deadline stops between two presses with the confirmed ones recorded;
  a flood wait that would end past the deadline is not started; the photo
  telemetry counts are right.

**What no test can assert:** that Telegram's cache changed. The network
client is now a **five**-method port (section 4) in `client.mjs`, still the
one file with no unit test; its surface is small enough to read, and every
TL field it touches is named in section 5.5 against the installed
teleproto's generated types. A green job proves messages were accepted and
presses acknowledged, nothing more.

**How the owner verifies a real refresh** (runbook steps F and G): paste
the URL in any chat and compare the picture with the live `og/<id>.jpg`;
find an already-posted message with that link and confirm it changed too;
read the `photo changed` count in the summary. Nothing in the tool's output
stands in for the paste.

### 3.8 The owner's manual steps

**Stands** as a pointer to section 9, which is revised.

## 4. Architecture

**Revised** - one port grew, one pure function was added.

```text
tools/tg-preview/
  package.json        private, "type": "module", dependency: teleproto   (unchanged)
  package-lock.json   pinned; installed only here                         (unchanged)
  lib.mjs             pure: urls, extractMeta, fingerprint, imageName, buildManifest,
                      stale, chunk, decide, matchButtons, runRefresh, applyResult,
                      parseArgs, constants
  lib.test.mjs        node:test over lib.mjs; imports nothing from node_modules
  manifest.mjs        composes lib with the repo (unchanged)
  live.mjs            fetch(url) -> fingerprint of the live page + its image
  client.mjs          the port over teleproto:
                      createClient(env) -> { send, incoming, byIds, press, close }
  run.mjs             the CLI: args, env, manifest, state, diff, live check, the two
                      phases, summary
  login.mjs           interactive, once (unchanged)
  state.json          created by the owner's runs; committed by the owner
.github/workflows/previews.yml                                             (unchanged)
docs/tg-preview.md    the runbook (section 9 plus operations)
```

Boundaries unchanged: `lib.mjs` touches no network, filesystem, clock or
process; the client is loaded lazily only when there is something to press
or send and it is not a dry run.

**The port, and why five methods is the smallest honest surface.** Pass 1's
three (`send`, `lastReply`, `close`) described a one-way conversation. The
loop now has to (a) anchor "the bot's answers to *this* message" on
something exact, (b) read button messages both after a send and from recent
history, (c) re-read messages by id after pressing, and (d) press. That is
four reads and writes of genuinely different shape, and hiding them behind
fewer methods would mean a union-typed selector argument or a method that
does two things. `lastReply` goes away: its job (log the bot's text) is done
by the summary message that `incoming` returns anyway, and its epoch-ms
comparison - the reviewer's unfloored `sinceMs` - is replaced by the sent
message's **id**, which needs no clock at all.

```text
send(text)                  -> { id }             the sent message's id
incoming({ afterId, limit }) -> Msg[]             incoming (not `out`) messages, ascending by id;
                                                 with afterId: only ids > afterId; always capped by limit
byIds(ids)                  -> Msg[]             the current state of those messages (edited in place after a press)
press(id, data)             -> { text }          messages.getBotCallbackAnswer; throws teleproto errors through
close()
```

`Msg` is a plain object the port builds from teleproto's `Api.Message`, so
`lib.mjs` and its tests never see a TL class:

```text
{ id: number, text: string, url: string | null, pending: boolean,
  photoId: string | null, buttons: [{ text: string, data: Buffer }] }
```

## 5. Behaviour of `run.mjs`

### 5.1 Arguments

**Stands**, plus one rule: `--limit`, `--max-wait` and `--budget-minutes`
must parse to a finite, non-negative number (`--limit 0` is legal and means
"phase 1 only, send nothing"); anything else throws `--limit must be a
number, got <value>` from `parseArgs`. Pass 1 let `Number('ten')` through as
`NaN`, which made `--limit` silently send nothing and `--budget-minutes`
silently mean "no budget" - both exit 0, both lies of the kind this revision
exists to remove. `--limit` still counts **sends**; phase 1 presses are
bounded by `RECOVER_SCAN`, not by `--limit`.

### 5.2 Steps

**Revised** - steps 7-10 replaced.

1. Load `.env` if present; parse args.
2. Build the manifest (1062 fingerprints) from the tree. Report and exclude
   any URL whose image is missing on disk.
3. Read the state (`{}` when absent or `site` differs).
4. `todo = stale(manifest, state, mode)` filtered by `--only`. Empty ->
   `nothing to refresh`, exit 0, never load the client.
5. Live check (5.3) unless `--no-verify` -> `ready`, `notLive`.
6. `batches = chunk(ready, PER_MESSAGE)` cut by `--limit` (a provisional
   count - phase 1 may shrink it).
7. Dry run -> print `<todo> urls stale, <ready> ready, up to <batches>
   messages, <ready> presses`, the first three batches in full, the
   `notLive` list, exit 0. Nothing loaded, nothing written. A dry run cannot
   show what phase 1 would recover: that needs the chat, which needs the
   credential.
8. Nothing ready -> `nothing ready to send (<n> not live)`, exit 0.
9. Fail fast on config: all three env vars present or exit 2, names only.
10. Connect (`createClient` still resolves the peer and sends `/start` on an
    empty history).
11. **Phase 1 - recovery.** `scan = incoming({ limit: RECOVER_SCAN })`;
    `found = matchButtons(scan, ready)`. Press each match in manifest order
    (deadline check, `PRESS_PACE_MS`, `decide()`); then `byIds` on the
    pressed ids once for the photo delta; record the confirmed URLs; write
    state and `--result`. Remove every URL matched in phase 1 - confirmed
    or not - from `ready`; rebuild `batches` from what is left, cut by
    `--limit`.
12. **Phase 2 - send and press**, per batch: deadline check; send (with
    `decide()` retries) -> `{ id }`; sleep one pace; `replies = incoming({
    afterId: id, limit: BUTTON_FETCH })`; `m = matchButtons(replies, batch)`;
    while `m.unmatched` is non-empty and rounds remain, sleep
    `BUTTON_WAIT_MS` and re-read; log the summary text verbatim once; press
    each match (deadline check per press); `byIds` once; record the
    confirmed URLs; write state and `--result`; log one line per batch:
    `batch 3/107: sent 10, buttons 10, pressed 10, confirmed 10 (photo
    changed 9, same 1, none 0)`; rest every `REST_EVERY` sends.
13. Summary to stdout and `$GITHUB_STEP_SUMMARY`: `refreshed N, pending M`
    (N = confirmed), then `pressed P (photo changed C, same S, none Z)`,
    then `not live L` / `no button message U` / `stopped: <reason>` when
    non-zero; `::warning::` when pending > 0; `close()`; exit per section
    3.4.

### 5.3 The live check

**Stands**, plus one local fix folded in (reviewer's item 2): `live.mjs`
caches the image-hash *promise* per name, so a fetch that fails in round 1
(a **new** `og/<name>.jpg` returning 404 while Pages catches up - the exact
case the rounds exist for) stays rejected for rounds 2-5 and the URL is
reported not live for the whole run. Fix: drop the cache entry when the
promise rejects, so the next round fetches again. Three lines; no unit test
(the file is outside the pure suite by design).

### 5.4 State writes

**Revised.** `writeState` runs after phase 1 and after every batch,
atomically, sorted, with only **confirmed** URLs added; the carry-forward of
entries for records still in the manifest is unchanged. `--result` is
written alongside with the same confirmed set. `updatedAt` is still the only
timestamp.

### 5.5 Talking to the bot

**Revised.**

> Superseded: pass 1's `lastReply(sinceDate)` (read the newest incoming
> message newer than an epoch-ms timestamp and log it) and the sentence
> "a message is the batch's URLs joined by `\n`" - the second stands, the
> first is gone.

Every TL name below was read from the installed
`tools/tg-preview/node_modules/teleproto/tl/generated/api.d.ts` and
`tl/custom/message.d.ts` on 2026-09-11; the implementer does not need to
re-derive them, and should not guess alternatives.

- `peer = await client.getEntity('WebpageBot')` once; `/start` on an empty
  history - unchanged.
- **`send(text)`**: `const m = await client.sendMessage(peer, { message:
  text })` returns `Api.Message`; return `{ id: m.id }`.
- **`incoming({ afterId, limit })`**: `client.getMessages(peer, { minId:
  afterId || 0, limit })` - `minId` excludes ids `<=` the value, `limit`
  caps the newest-first result and is always passed explicitly (gramjs's
  `getMessages` changes its default when `limit` is the only key). Filter
  `!m.out`, map to `Msg`, sort ascending by `id`.
- **`byIds(ids)`**: `client.getMessages(peer, { ids })`; the result has
  `undefined` in the place of a deleted message - filter those, map, sort.
- **`press(id, data)`**: `client.invoke(new Api.messages.GetBotCallbackAnswer({
  peer, msgId: id, data }))` -> `Api.messages.BotCallbackAnswer` with
  optional `message`, `alert`, `url`; return `{ text: r.message || null }`.
  Let every error propagate: `decide()` in `lib.mjs` owns the table, and
  `BotResponseTimeoutError` must reach it. `Api` is exported from
  `teleproto`'s index.
- **`Msg` mapping**, with the TL shapes:
  - `media` is `Api.MessageMediaWebPage { webpage }` for a button message;
    `webpage` is `Api.WebPage { id, url, photo? }` or
    `Api.WebPagePending { id, url?, date }`. `url = media?.webpage?.url ??
    null`; `pending = media?.webpage?.className === 'WebPagePending'`.
  - `photoId = String(media.webpage.photo.id)` when `webpage.photo` exists
    and is an `Api.Photo` (its `id` is a `BigInteger` - stringify, never
    compare as a number); else `null`.
  - `replyMarkup` is `Api.ReplyInlineMarkup { rows: KeyboardInlineButtonRow[]
    }`; each row's `buttons[]` is `Api.KeyboardInlineButton { text, type }`;
    keep those whose `type.className === 'InlineButtonTypeCallback'` as
    `{ text, data: type.data }` (`data` is a Buffer; pass it back to `press`
    untouched). Every other button type is dropped. No `replyMarkup` ->
    `buttons: []`.
  - `text = m.message || ''`.
- **`matchButtons(messages, urls)`** (pure, `lib.mjs`): a message qualifies
  when `url !== null` and `buttons.some(b => b.text === UPDATE_BUTTON)`;
  index qualifying messages by `url`, newest id winning; for each wanted
  URL look up exact, then with one trailing `/` stripped from both sides;
  return `{ matched: { [url]: { id, data, photoId } }, unmatched: [url],
  summary: [text] }` where `summary` holds the texts of non-qualifying
  messages that have text and no webpage (logged verbatim, never parsed).

## 6. `previews.yml`

**Stands.** Not touched by the next batch. The notes at `0ab04eb` and the
four R1 fixes all remain in force.

## 7. Contracts, specs and docs that move

**Revised** for the next batch.

- No public contract changes, still: `CONTRACTS.md`, `docs/fixtures/`,
  `tests/contracts.js`, `llms.txt`, `robots.txt` untouched.
- `docs/specs/META.md` section 7 gains **one sentence** of durable Telegram
  behaviour: a plain send to `@WebpageBot` refreshes the page's text and
  keeps the cached picture when `og:image` still points at the same URL;
  only the bot's "Update with content" button re-downloads it. That is a
  fact about Telegram, not about this tool, so it belongs in the spec.
- `docs/tg-preview.md`: every sentence that says or implies a send
  refreshes the preview is corrected - the opening paragraphs, the tool
  description, step E's counts line, all of step F, step G's timing and
  chunking, the "Operations" summary vocabulary, "Rate limiting and
  resumability", and "Coverage". The full list is in the batch below.
- `docs/specs/COVERAGE.md`: the `tools/tg-preview/lib.test.mjs` paragraph
  names button matching and the two-phase loop; `client.mjs` and `live.mjs`
  stay the deliberate gap.
- `README.md` / `README.ru.md`, `package.json`, `.gitignore`, `CLAUDE.md`:
  untouched.

## 8. Parity and gates - confirmed, not assumed

**Stands.** Files touched by the next batch: `tools/tg-preview/**` (not
`package*.json`, `manifest.mjs`, `login.mjs`), `docs/tg-preview.md`,
`docs/specs/META.md`, `docs/specs/COVERAGE.md`, this task directory. None of
`index.html`, `app.js`, `style.css`, `app/src/**`, `data.js`, `og/`, `i/`,
`tests/parity/**`. Nothing a screen draws changes. Gate: **`npm run check`
only**, one foreground call. Not `check:built`, not parity.

## 9. The owner's manual steps, start to finish

**Revised** - steps E, F and G. A-D, H-J stand (D.3's troubleshooting block
from R2 stands). The runbook `docs/tg-preview.md` carries the same text.

**A-D.** Unchanged; all done by the owner on 2026-09-11 (the session exists
in the owner's `.env`).

**E. Dry runs (no Telegram involved).**
1. `node tools/tg-preview/run.mjs --dry-run --mode full` - expect
   `1062 urls stale, 1062 ready, up to 107 messages, 1062 presses` when the
   site is deployed at the commit you are on; otherwise some are reported
   not live, which is the check working.
2. `node tools/tg-preview/run.mjs --dry-run --only w76` - one URL, one
   message, one press.

**F. The residue check - the first run of the fixed tool.**
1. `node tools/tg-preview/run.mjs --only cc12,cc24,cc38`. These three were
   sent by the probe and never pressed; their button messages are already
   in the chat. Expect the log to show phase 1 pressing three buttons and
   phase 2 sending **nothing**, and the summary `refreshed 3, pending 0` /
   `pressed 3 (photo changed 3, same 0, none 0)`. `changed 3` is the
   expected result because all three pictures are known stale; `same` on
   any of them is worth reporting before going on.
2. Open the throwaway account's chat with `@WebpageBot`: nothing new was
   sent; the three button messages now show the new pictures.
3. In Saved Messages (any account), paste
   `https://artex-x.github.io/daggerheart-loot/i/cc12.html` and compare the
   preview picture with the live `og/` image for that record. Same picture
   = the press works through the tool, not only by hand.
4. **Regression check:** find an already-posted message carrying one of
   those three links and confirm its preview changed too. If it did not,
   stop and report; the runbook's opening claim would no longer hold.
5. `git status` shows `tools/tg-preview/state.json` with four entries
   (`cc19` from the hand press plus these three). Keep it.

**G. The full reindex.**
1. Run it in chunks, locally: `node tools/tg-preview/run.mjs --mode full
   --limit 10` sends 100 URLs and presses 100 buttons in about four
   minutes; repeat it, spread across the day, until it prints `pending 0`.
   Each run is resumable: it only sends what is not yet confirmed and
   presses anything already waiting in the chat. If a run stops with
   `PeerFloodError`, the account is limited: stop for the day. One
   unchunked run is ~40 minutes and is fine on a healthier account.
2. Read the `photo changed` count each time. On this reindex it should be
   the large majority; a chunk reporting mostly `same` means spot-check a
   few of its links by pasting before trusting it, and report it.
3. When `pending 0`: `git add tools/tg-preview/state.json && git commit -m
   "chore(tg-preview): record the first full reindex"` and push. From here
   CI only ever sends and presses what changed.

**H-J.** Unchanged.

## 10. Batches

### B1 - the refresh tool, its workflow and its runbook

**Status: implemented, committed (`cce10cb`), reviewed and approved.** Full
implement-ready text at `0ab04eb`, section 10. Its send loop is what B3
replaces; everything else it built stands.

### R1 - review remediation, blockers only

**Status: done (`5a959ca`).** Four workflow/.gitignore fixes; see
`handoff.md`.

### R2 - login.mjs diagnostics

**Status: done (`a4c9066`).** See `handoff.md`.

### O1 (first attempt) - the owner's operations

**Status: partially done, and the reason for this revision.** Steps A-D
complete; the first real send (`cc19`) proved the plain send does not
refresh the image; the owner pressed the button by hand and probed a
three-link message. Residue: `cc12`, `cc24`, `cc38` sent, not pressed.
`state.json` holds `cc19` only, honestly. O1 resumes at step E after B3.

### B3 - the two-phase refresh: press "Update with content", record only confirmed presses (one batch, one commit)

**Status: implemented, committed.** `lib.mjs`'s `runRefresh` is now the
two-phase loop (recovery then send-and-press); `client.mjs` is the
five-method port with the `Msg` mapper; `live.mjs`'s cached-rejection fix,
`decide()`'s `BotResponseTimeoutError` row, `parseArgs`'s numeric guards, and
`matchButtons` all landed as specified. 68 `lib.test.mjs` cases pass (up from
23), all three doc/spec files corrected. Full record in `handoff.md`.
Next: O1 (resumed) at section 9, step E.

**Objective.** Replace B1's send-and-trust loop with the send-and-press loop
of sections 3.4, 4 and 5, so that `state.json` records a URL only when its
"Update with content" press was confirmed; correct every document that says
a send refreshes the preview; fold in the four reviewer items that live on
the same paths.

**In scope.** `tools/tg-preview/lib.mjs`, `lib.test.mjs`, `client.mjs`,
`run.mjs`, `live.mjs` (item 2 only); `docs/tg-preview.md`;
`docs/specs/META.md` section 7 (one sentence); `docs/specs/COVERAGE.md`
(one paragraph); `issues/tg-preview-refresh/{context,plan,handoff}.md`
(stage the orchestrator's unstaged `context.md` - it is the evidence this
batch acts on).

**Out of scope.** `.github/workflows/previews.yml`, `ci.yml`,
`tools/tg-preview/package.json` and lockfile (no new dependency),
`manifest.mjs`, `login.mjs`, `README*.md`, `package.json`, any public
contract, `CLAUDE.md`. `tools/tg-preview/state.json` is the owner's
untracked file: **do not commit it, do not delete it, do not edit it.** Any
Telegram contact of any kind: the owner's live session is in `.env`; the
implementer never runs `run.mjs` without `--dry-run`.

**Behaviour constraints (settled; do not reopen).** Sections 3.4, 4, 5.1,
5.2, 5.4, 5.5 as written. `PER_MESSAGE` stays 10. The state schema stays
`version: 1`. The five-method port and the `Msg` shape are fixed. The
confirmation rule is fixed. Phase 1 runs before phase 2 and is not limited
by `--limit`.

**Steps.**

1. `lib.mjs` - constants: add `PRESS_PACE_MS = [1000, 2000]`,
   `BUTTON_WAIT_ROUNDS = 6`, `BUTTON_WAIT_MS = 5000`, `BUTTON_FETCH = 50`,
   `RECOVER_SCAN = 200`, `UPDATE_BUTTON = 'Update with content'`, each with
   a one-line why-comment from the table in 3.4. Keep every existing
   constant and its value.
2. `lib.mjs` - `decide()`: add the `BotResponseTimeoutError` row before the
   generic `errorMessage` branch: match `name === 'BotResponseTimeoutError'
   || err.errorMessage === 'BOT_RESPONSE_TIMEOUT'` -> `{ unanswered: true }`.
3. `lib.mjs` - `parseArgs()`: after `Number(value)` for `limit`, `maxWaitS`,
   `budgetMinutes`, throw `<flag> must be a number, got <value>` unless
   `Number.isFinite(n) && n >= 0`. Keep `--limit 0` legal.
4. `lib.mjs` - export `matchButtons(messages, urls)` per 5.5. Pure; takes
   `Msg[]` and `string[]`; returns `{ matched, unmatched, summary }`.
5. `lib.mjs` - `runRefresh(opts, deps)`: rewrite the send loop as steps
   10-13 of section 5.2. Structure it as three inner helpers so a reader can
   hold each in one screen: `pressOne(url, entry)` (deadline check, one
   press with `decide()` retries, pace, returns `{ answered, text } |
   { unanswered } | { stopped, reason, exitCode }`), `pressGroup(matched)`
   (presses in manifest order, then one `byIds`, classifies the photo delta,
   returns `{ confirmed: [url], photo: { changed, same, none }, stopped }`),
   and `record(confirmedUrls)` (the carry-forward write of state and
   `--result`, unchanged in spirit from B1). The deadline is checked inside
   `pressOne` and before each send attempt; a `retry` whose `waitMs` would
   end past the deadline becomes `stopped: 'flood wait of Ns would exceed
   the budget'`. Return `{ sent, pressed, confirmed, pending, notLive,
   unmatched, photo, floodWaits, stopped, exitCode }` where `pending = todo
   - confirmed` (so the summary's numbers still add up to the stale count).
   The dry-run branch prints the new counts line from 5.2 step 7 and still
   returns before `client()` is called.
6. `client.mjs` - replace `lastReply` with `incoming`, add `byIds` and
   `press`, make `send` return `{ id }`; add `Api` to the lazy `import`;
   add the `Msg` mapper as a module-private `plain(m)` exactly per 5.5.
   Keep the header comment's promise: nothing prints `apiId`, `apiHash`,
   `session`; the logger stays at error level. Add one comment line saying
   why `invoke(GetBotCallbackAnswer)` is used instead of `Message.click()`.
7. `run.mjs` - summary block per 5.2 step 13; `result.confirmed` feeds
   `refreshed N`; append the `pressed P (photo changed C, same S, none Z)`
   line to stdout and `$GITHUB_STEP_SUMMARY`; keep the `::warning::` on
   pending. No other wiring changes (the deps object is unchanged - the
   client factory already returns whatever `createClient` returns).
8. `live.mjs` - in `imageSha(name)`, attach `.catch` that deletes the cache
   entry and rethrows, so a failed image fetch is retried on the next round.
   One why-comment.
9. `lib.test.mjs` - the fake client gains scripted `send` (returns
   incrementing ids), `incoming` (a queue of canned `Msg[]` answers, one per
   call, so a test can make button messages arrive on the second wait
   round), `byIds` (returns from a mutable `photoAfter` map so a test can
   flip a photo id after a press) and `press` (a script of `{ ok, text } |
   { throw }` per call). Add small builders `buttonMsg(id, url, photoId)`
   and `summaryMsg(id)`. Add every test named in section 3.7; keep every
   existing test, adapting the B1 loop tests to the new result shape
   (`confirmed` where they asserted `sent`). Fake presses must count
   against the same `sleep` recorder so the pace is observable.
10. `docs/specs/META.md` section 7: the one sentence from section 7 of this
    plan. `docs/specs/COVERAGE.md`: extend the `tools/tg-preview/lib.test.mjs`
    paragraph with "button matching and the two-phase send-and-press loop".
11. `docs/tg-preview.md` - correct, in place, in this order: (a) paragraph 1,
    "the only way to change it is to ask `@WebpageBot` to refresh the URL"
    -> send the URL **and press its "Update with content" button**, with
    the measured reason (a plain send updates title and description and
    keeps the cached picture when `og:image` still points at the same
    address - this site's exact case); (b) paragraph 2, define "a refresh"
    as send + press; (c) paragraph 3, the tool description: "sends only
    what changed" -> sends, waits for the bot's one-message-per-link
    replies, presses each, and records a URL only after the press is
    acknowledged; (d) step E counts line; (e) step F replaced by section
    9's F; (f) step G replaced by section 9's G; (g) "Operations": the
    summary vocabulary (`refreshed` = confirmed presses; `pressed`/`photo`
    line; `pending` now also covers "no button message" and "unconfirmed
    press"; `--limit` counts sends and does not cap phase 1; `--limit 0`
    is the press-only run), and fix the sentence about what turns the CI
    job red so it matches `previews.yml`'s actual `if:` conditions
    (reviewer's item 9: the job is red on exit 1/2 from `Refresh` or on a
    failed `npm audit`/state push; a Telegram-side stop is green); (h)
    "Rate limiting and resumability": the two axes, the constants, the
    deadline rule, phase 1 as the free retry, the ~40-minute figure; (i)
    "Coverage": name `matchButtons` and the loop; (j) grep the file for
    "reply" and "refresh" afterwards and make sure no remaining sentence
    implies a send is enough.
12. `node --test tools/tg-preview/lib.test.mjs`; then
    `node tools/tg-preview/run.mjs --dry-run --mode full` and `--dry-run
    --only cc12,cc24,cc38` (needs no credential; must print the new counts
    line and load no client); then `set -o pipefail; npm run check 2>&1 |
    tail -n 120` with Bash timeout 600000. Stage by name: the five
    `tools/tg-preview/*.mjs`, the three docs, the three task files. Commit
    `fix(tg-preview): press "Update with content" and record only confirmed
    presses`.

**Acceptance criteria.**

- `node --test tools/tg-preview/lib.test.mjs` passes without
  `tools/tg-preview/node_modules` present.
- `node tools/tg-preview/run.mjs --dry-run --mode full` prints `1062 urls
  stale, ... up to 107 messages, ... presses`, sends nothing, writes nothing,
  exits 0, without the three env vars. (The `ready` count depends on the
  live site; record it, do not fix it.)
- `node tools/tg-preview/run.mjs --limit ten --dry-run` exits non-zero with
  `--limit must be a number, got ten`.
- A `runRefresh` test proves a URL whose button message never arrives is
  absent from every `writeState` call; another proves an unanswered press
  with an unchanged photo is absent and with a changed photo is present.
- `grep -n "lastReply" tools/tg-preview/*.mjs` finds nothing;
  `grep -n "sinceMs" tools/tg-preview/*.mjs` finds nothing.
- `grep -in "send.*refresh\|refresh.*send" docs/tg-preview.md` shows no
  sentence claiming a send refreshes the preview (the implementer reads
  each hit).
- `git status` after the batch shows no change to `previews.yml`,
  `package*.json`, `i/`, `og/`, `data.js`; `state.json` remains untracked.
- `npm run check` green in one foreground call.

**Verification commands.**

```text
node --test tools/tg-preview/lib.test.mjs
node tools/tg-preview/run.mjs --dry-run --mode full
node tools/tg-preview/run.mjs --dry-run --only cc12,cc24,cc38
node tools/tg-preview/run.mjs --limit ten --dry-run        # expect a thrown parse error, non-zero exit
set -o pipefail; npm run check 2>&1 | tail -n 120          # Bash timeout 600000
```

**Risks / do-nots.**

- Never run `run.mjs` without `--dry-run`. The owner's session is live in
  `.env`; every send and press costs a young account's flood budget. No
  agent presses anything.
- Do not "improve" `matchButtons` with fuzzy URL matching beyond the
  trailing-slash rule; do not match by order or by count.
- Do not treat an unchanged photo id as failure in the answered case, and
  do not treat it as success in the unanswered case.
- Do not touch `previews.yml`; it is correct as is and R1 was reviewed.
- Do not add a dependency; teleproto already exports `Api`.
- Do not `git add -A`; stage by path.
- The `Msg` shape and the TL field names in 5.5 were verified against the
  installed package; if the implementer finds a mismatch at runtime of the
  tests (they cannot at runtime of the client - no agent runs it), record
  it in the handoff rather than guessing a new name.

**Fallback.** None needed for the design. If the implementer cannot make
`getMessages(peer, { ids })` return holes as `undefined` in a way the mapper
tolerates, filter with `Array.isArray(list) ? list.filter(Boolean) : []` -
that is the documented behaviour, not a workaround.

### O1 (resumed) - the owner's operations, from step E

Not a code batch. Section 9, E then F (the residue check) then G (chunked),
then H-J. Produces `state.json` on `main` and the three secrets. The
orchestrator collects: F.1's `photo changed` count, F.4's already-posted
check, and G.2's per-chunk `photo` counts.

### B2 - tuning from the first real run (outline; may be empty)

After O1: fold in what Telegram actually did on both axes - whether ten
links per message are honoured across 107 sends, the real `FLOOD_WAIT` /
`PEER_FLOOD` behaviour of presses versus sends, how often presses go
unanswered, the `same`/`changed` ratio, and the remaining deferred items in
section 13 that O1's evidence makes worth doing. Gate: `npm run check`. If
nothing needs changing, close the task without it.

## 11. Open questions - NEEDS_HUMAN_CONFIRMATION: no

Both pass-1 questions were answered by the owner (`context.md`, decisions 5
and 6). Pass 3 raises none: every fork was decided from measured evidence.

**Can the owner trust `state.json` entries written before B3?** Stated
plainly: **no entry written by the unfixed tool can be trusted on its own,
and there is exactly one such entry - `cc19` - which happens to be honest
only because the owner pressed its button by hand.** No other run ever
wrote state: CI has no secrets and the probe bypassed `run.mjs`. So the file
as it stands is correct and should be kept; nothing needs deleting. If that
is ever in doubt, `--mode full` re-does every URL - send and press - and
overwrites the entries honestly.

## 12. Risks and assumptions

**Revised.**

- **Fresh-account limits, now on two axes.** Presses are a different method
  from sends and may have their own limits; the account is days old. The
  run stops green on the first `PEER_FLOOD` from either. Chunked local
  runs (section 9, G) are the mitigation.
- **Unanswered presses.** If `@WebpageBot` never answers callback queries,
  every press waits out Telegram's bot-response window before
  `BOT_RESPONSE_TIMEOUT` arrives, and confirmation rests entirely on the
  photo delta - a URL whose image really is unchanged would then stay
  pending. The measured press on `cc19` produced an answer, so this is not
  the expected case; if F.1 shows `unanswered` on all three, B2 tunes (a
  shorter effective pace and treating "unanswered and pending is false"
  as confirmed are the candidates - not decided now, no evidence).
- **Press-only recovery updates metadata too** (the phase-1 assumption in
  3.4). Fallback: `RECOVER_SCAN = 0`.
- **`media.webpage.url` equality for the root.** The one URL Telegram might
  canonicalise; the trailing-slash rule covers the plausible form. The
  `--only root` dry run cannot see this; the first real send that includes
  the root will, and an unmatched root shows up in the log as `no button
  message for <url>` next to the bot's actual `url`, which is enough to
  fix in B2.
- **The 45-minute CI budget** now fits roughly one full reindex, not four.
  Incremental runs are small; a full CI reindex is two runs at most, and
  the state is written per batch.
- **Pages edge caching**, `workflow_run` semantics, branch protection, two
  writers, the session's IP, cut-over: unchanged from pass 1 (`0ab04eb`).

## 13. Deferred

**Revised** - the reviewer's nine deferred items from R1, decided:

Folded into B3 (they live on the paths B3 rewrites, and each is a few
lines):

1. **Flood-wait deadline check** - the loop is rewritten and presses make
   the per-batch check materially looser; section 3.4, "The deadline".
2. **`live.mjs` cached rejected promises** - a real bug in the deploy-lag
   case the rounds exist for; three lines; section 5.3.
3. **`NaN` guards on `--limit`/`--budget-minutes`** - a silent exit-0
   no-op is the same species of lie as the success accounting; section 5.1.
4. **`sinceMs` not floored** - resolved by construction: the anchor is now
   the sent message id, and `lastReply` is gone.
8. **Dry-run counts wording** - the dry-run line is rewritten anyway
   (section 5.2, step 7).
9. **The doc sentence about what turns the CI job red** - the doc is
   rewritten anyway (B3 step 11g).

Left deferred, with the reason:

5. **Unquoted `$args`/`$LIMIT` in the workflow** - `previews.yml` is
   deliberately untouched by B3 (R1 was reviewed as a unit; nothing in the
   loop change needs the workflow to move). `$args` must stay unquoted to
   word-split; `"$LIMIT"` should be quoted. B2.
6. **The unused `urls()` export** - test-only surface in `lib.mjs`; removing
   it churns the 1062-count test for no behaviour change. B2, or never.
7. **`--apply`'s needless `buildFromTree()`** - it exists only to obtain
   `site`; cosmetic cost on a path B3 does not touch. B2.

Other deferrals:

- **Photo id in the state (schema v2)** so incremental runs can demand a
  changed photo whenever the image sha changed - section 3.4, "Considered
  and not taken". Revisit after O1 reports the `same`/`changed` ratio.
- A pointer line in `CLAUDE.md` and `.claude/prompts/refresh-artwork.prompt.md`
  - orchestrator's call, one line each.
- Other messengers' caches. Not this task.
- Issue 47 cut-over checklist item: keep `page()` importable, or point
  `manifest.mjs` at the new generator; decide whether `og/` stays a source
  asset.
