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

- **Pass 4, 2026-09-12 (this revision).** O1's **second** run - the first
  chunked reindex attempt - disproved the assumption that **presses are
  free**. `@WebpageBot` has its own attempt quota per user, below 115
  presses in one run, and answers everything past it with
  `"Sorry, too many attempts. Please try again in 3213 seconds."` -
  including a subsequent send, for which it then emits **no button
  messages at all**. Everything measured is in `context.md`, "The press
  axis has its own throttle, and `--mode full` re-spends it"; nothing
  there is re-derived or re-tested here.

  What that invalidates, in the order it matters: (a) the "a button
  message already in the chat is a **free** retry" framing under section
  3.4 - free on the send axis, and the send axis was never the binding
  one; (b) section 9 step G's `--mode full --limit 10` loop, which
  re-presses the previous chunk's buttons every run; (c) the confirmation
  rule's "answered is confirmed" clause, because an answer can be a
  rejection; (d) section 2's blanket non-goal on parsing the bot's text.
  Sections revised in pass 4 say **Revised (pass 4)** so a pass-3 revision
  is not mistaken for this one; the superseded pass-3 text is readable in
  full at commit `5b2a68e`.

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

**Revised (pass 4)** - the fourth non-goal is narrowed. Pass 3's revision of
the first paragraph stands.

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
- Parsing the bot's **text** for control flow, **with exactly one carve-out:
  the throttle sentence** (below). Everything else the bot says is logged
  verbatim and never branched on. What the tool otherwise reads is the bot's
  message **structure** - `media.webpage.url` and the callback buttons -
  which is typed TL data, not prose.

> Superseded: pass 1 also excluded "refreshing previews of already-posted
> messages if Telegram does not do that" - answered by owner decision 6: it
> does. Pass 3 made the text non-goal absolute; pass 4 narrows it.

**The carve-out, and why it is safe (pass 4).** `@WebpageBot` says
`"Sorry, too many attempts. Please try again in <N> seconds."` and that
sentence is the *only* signal that an attempt was refused - it arrives both
as a callback answer to a press and as the bot's summary reply to a send.
Refusing to read it is precisely what let the tool write 28 entries it could
not justify (`context.md`, fact 3). So one case-insensitive match on
`too many attempts`, plus the seconds figure, is read - and the rule around
it is **asymmetric by construction**:

- a recognised text can only **withhold** confirmation and **stop** the run;
- **no text ever grants** confirmation, and no other text is matched.

The failure modes are therefore bounded in the right direction. A false
positive stops a run early, which is green with a recorded backlog and costs
one run. A false negative (the bot invents a new wording) leaves the tool
exactly where pass 3 left it, no worse. Nothing else about the bot's prose
reaches control flow.

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

### 3.4 Rate limiting, confirmation and resumability - three limits

**Revised (pass 4).**

> Superseded: pass 1 sized the run at 107 messages, ~12 minutes, with a
> URL counted as refreshed once its message was sent and any reply arrived,
> and treated the bot's reply as an opaque string to log. All of that is
> replaced below. The error table survives with one added row.
>
> Superseded by pass 4: pass 3's two axes (sends, presses) each bounded only
> by Telegram's own `FLOOD_WAIT`; presses described as costing "nothing"
> once a button message exists; and confirmation granted by an answered
> press alone. There is a **third** limit - the bot's own attempt quota -
> and it is the binding one.

#### Constants

All in `lib.mjs`, one place. Values marked *kept* are pass 1's.

| name | value | why |
|---|---|---|
| `PER_MESSAGE` | 10 (*kept*) | still the right batch: the press cost is per URL and is the same at any batch size, so batching earns its keep only on the send axis, and the largest documented batch is the fewest sends. Ten links measured fine (three did); nothing argues for changing it |
| `PACE_MS` | 4000-6000 ms (*kept*) | between sends; doubles as the first wait for the bot's button messages |
| `BUTTON_WAIT_ROUNDS` / `BUTTON_WAIT_MS` | 6 / 5000 ms | extra polls when fewer button messages than links have arrived yet - the bot fetches every page before it can answer for it |
| `BUTTON_FETCH` | 50 | `limit` when reading replies newer than the sent message; 11 are expected per batch |
| `PRESS_PACE_MS` | 1000-2000 ms | between callback presses. Official clients press with no pacing at all; this is insurance on a days-old account |
| `RECOVER_SCAN` | 200 | how many recent chat messages are read at run start to find pressable button messages that need no new send (resumability, below). **Re-examined in pass 4 and kept at 200** - see "Why `RECOVER_SCAN` stays 200" |
| `UPDATE_BUTTON` | `'Update with content'` | matched by exact button text |
| **`PRESS_LIMIT`** | **50, `--press-limit`** | **pass 4.** The most presses one run will attempt, across **both** phases. The only measurement of the bot's quota is that 115 in one run tripped it; 50 is a deliberate under-estimate - see "The bot's own attempt quota" |
| **`THROTTLE_MATCH`** | **`/too many attempts/i`** | **pass 4.** Module-private inside `botThrottle`, not an export - nothing else uses it. The one sentence of the bot's prose that reaches control flow (section 2's carve-out); the seconds figure is read from the same text |
| `REST_EVERY` / `REST_MS` | 25 sends / 30 s (*kept*) | send axis only |
| `MAX_WAIT_S` | 600, `--max-wait` (*kept*) | applies to a `FLOOD_WAIT` on either axis |
| `NET_RETRIES` / `NET_RETRY_MS` | 3 / 10 s (*kept*) | transport errors on either axis |
| `BUDGET_MIN` | none locally; 45 in CI (*kept*) | see "The deadline" below - its semantics tightened |

#### Arithmetic

**Revised in pass 4: wall clock was never the constraint.** Pass 3's sum -
107 sends at ~5 s plus four rests (~11 min) and 1062 presses at ~1.5 s
(~27 min), so ~40 minutes for a full reindex - is arithmetically still
right and **operationally irrelevant**, because no account gets to spend
1062 presses in forty minutes. The real unit of a reindex is now **runs,
not minutes**:

| | |
|---|---|
| presses a run will attempt | `PRESS_LIMIT`, default 50 |
| URLs per run at `--limit 5 --press-limit 50` | 50 (5 sends, 50 presses) |
| wall clock of such a run | ~2 minutes (5 sends at ~5 s, 50 presses at ~1.5 s) |
| runs to clear 1062 URLs | **~22**, at a cadence the quota allows |
| observed cooldown after tripping the quota | 3213 s (~54 min), one data point |

So a first reindex is a **multi-day, spaced-out operation** the owner drives
a chunk at a time, not a job that finishes in one sitting. The runbook
(section 9, G) says that plainly rather than implying otherwise. CI's
45-minute budget is untouched and still ample: an incremental run after a
deploy is a handful of URLs.

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

`decide()` is unchanged in pass 4. The throttle below is **not** an error and
never reaches it.

#### The bot's own attempt quota - the third limit (pass 4)

Neither axis above is what stopped the owner's run. `@WebpageBot` keeps its
own counter of update attempts per user, independent of Telegram's flood
control, and refuses everything past it with
`"Sorry, too many attempts. Please try again in <N> seconds."` The measured
shape of it (`context.md`):

- 115 presses in ~4 minutes tripped it; `N` was **3213** (~54 minutes).
- The refusal then applied to a **send** too, and the bot emitted **no
  button messages at all** for that send's ten links. So the quota governs
  the bot's willingness to do any work, not one method.
- The exact quota is unknown. One data point. It may have begun well before
  press 115 - see "What the 28 are worth" below.

Two mechanisms answer it, and they are deliberately different in kind:

**1. A press budget bounds what a run spends (`PRESS_LIMIT`, `--press-limit`).**
The tool cannot know the quota, so it does not model it; it simply refuses
to spend more than a fixed number of presses per run and stops green with
the rest pending. The budget covers **both phases** - phase 1 spends from
the same allowance as phase 2, because the quota does not care which phase a
press came from. Three rules make it useful rather than decorative:

- checked before **every** press attempt, in both phases, exactly where the
  deadline is checked;
- **a batch is not sent when fewer than `PER_MESSAGE` presses remain in the
  budget** (`stopped: 'press budget too low for another batch'`). The owner's
  run ended by spending ten sends on links whose buttons it could not press;
  a send whose presses are unaffordable is pure waste on the scarcer axis.
  The batch is stopped, never trimmed - re-chunking mid-run would make
  `--limit` mean something different on the last batch;
- the default is **50**, well under the only observed failure point, because
  the costs are asymmetric: under-shooting costs one extra two-minute run,
  over-shooting costs a ~54-minute lockout **plus** the sends already spent
  in the batch that earned it. `--press-limit` is how the owner raises it
  once runs at 50 have gone through cleanly a few times; every run's
  `pressed P` line is a lower bound on the quota, so the runbook has its own
  measurement loop and B2 has its input.

**2. Recognising the refusal stops the run cleanly.** `botThrottle(text)`
(pure, in `lib.mjs`) matches `THROTTLE_MATCH` and pulls out the seconds.
It is consulted in exactly two places:

- the **callback answer** of a press. That press is **not confirmed** - it
  was refused - and the run stops;
- the bot's **summary reply** to a send, checked on each button-wait round
  so the run does not burn `BUTTON_WAIT_ROUNDS x BUTTON_WAIT_MS` waiting for
  buttons that are never coming. The batch's URLs stay pending; the send is
  already spent and nothing recovers it.

**The throttle always stops; it is never waited out.** Named and rejected:
routing it through `decide()`'s wait-or-stop table, so that `N <= MAX_WAIT_S`
sleeps and retries. Rejected because (a) the one observed `N` is 3213 s,
five times `MAX_WAIT_S` and longer than CI's entire 45-minute budget; (b)
unlike a Telegram `FLOOD_WAIT`, which suspends one method, this refusal
applies to every attempt of either kind, so there is nothing useful to do on
the other side of the sleep except what the next run would do anyway; and
(c) a stop is resumable by construction here - the state is written per
batch and per phase, and phase 1 re-presses whatever is still in the chat.
`MAX_WAIT_S` and `--budget-minutes` are therefore both **unaffected** by the
throttle path: nothing sleeps, so no wait can overshoot a deadline.

**Exit code: green (0)**, the same as `PeerFloodError`, with the backlog
recorded. This needs **no change to the CI-red rules** already in
`docs/tg-preview.md` ("What turns the CI job red"): a Telegram-side stop is
green because the site itself is live and a red job would say something
false about it. The throttle is named there as an example, nothing more.

**Rejected alternatives for bounding the press count**, each named because
the next reader will think of it:

- **Make phase 1 chunk-aware - bound it by `--limit`.** `--limit` counts
  *messages* of ten URLs; phase 1 presses individual URLs. Conflating them
  makes the number mean two things and destroys `--limit 0`, the press-only
  run. A separate flag keeps both honest.
- **Default the runbook to `--mode incremental` and stop there.** Necessary
  (it is done - see below) but not sufficient: a run that stops with a
  backlog of unpressed buttons leaves them in the scan window, so the next
  run's phase 1 spends an unbounded number of presses before phase 2 gets a
  look in. Taken *as well*, not instead.
- **Make `stale()` respect the state under `--mode full`.** This is where
  `context.md` fact 2 points, and it is the wrong repair: it deletes the
  only meaning `--mode full` has - redo everything when the state is
  distrusted - leaving no way to express that at all. The defect is the
  runbook line that put `--mode full` in a loop, and `context.md` fact 2
  says so in its own last sentence.
- **Slow `PRESS_PACE_MS` down until the quota never fills** (say 20 s). The
  cooldown's shape (a ~54-minute retry-after) reads as a count per window,
  not a rate, so pacing multiplies wall clock without changing the count -
  and 1062 presses at 20 s is six hours. No evidence supports it.
- **Persist a press ledger across runs** (how many presses in the last hour,
  in the state) so the tool refuses to start inside a cooldown. It is the
  nicest version of this and it is guessing at a window we have one sample
  of; it also needs a schema change to a committed file. Deferred to B2
  (section 13), where the runbook's per-run `pressed P` numbers are the
  evidence for it. Until then the protection is procedural: the runbook
  spaces the chunks, and a throttle stop prints the seconds the bot named.

**`--mode full` is not chunkable, and the tool now says so.** Under
`--mode full` every URL is stale on every run, so phase 1 re-presses the same
recovered buttons each time and the run never advances - a livelock the press
budget bounds but does not cure. `runRefresh` logs one warning when
`--mode full` is combined with a press budget smaller than the stale set,
pointing at section 9 step G. `--mode full` remains what it always was: one
deliberate pass for a state you do not trust, not the way to drive a reindex.

#### Why `RECOVER_SCAN` stays 200 (pass 4)

Re-examined because pass 3 justified the window by presses being free, and
they are not. It still holds, for a different reason: **the press budget,
not the scan window, is now what bounds phase 1.** The window only decides
how far back recovery can *reach*, and a button older than it is not lost -
it costs a re-send **plus** a press, strictly more than the press alone. In
the chunked flow a run leaves at most one batch's worth of unconfirmed
buttons behind, and 200 messages covers roughly eighteen batches of history,
so the window is not the limiting factor in any case the runbook produces.
Shrinking it would buy nothing the budget does not already buy and would
spend sends. `RECOVER_SCAN = 0` keeps its separate, unrelated job: the named
fallback if press-only recovery is ever shown not to update metadata.

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
2. **The press was acknowledged and not refused, or its effect was
   observed.** Either `messages.getBotCallbackAnswer` returned a
   `BotCallbackAnswer` **whose text `botThrottle()` does not recognise as a
   refusal** (answered - the bot handled the press), **or** it raised
   `BOT_RESPONSE_TIMEOUT` *and* re-fetching the button message afterwards
   shows a **different `photo.id`** than before the press (unanswered, but
   the re-download visibly happened).

   > Superseded (pass 4): pass 3 required only that an answer arrived.
   > `context.md` fact 3 measured what that costs - a press the bot refused
   > with "too many attempts" is answered, and was being written into the
   > state as refreshed. This is the same defect B3 existed to remove, one
   > axis over.

Everything else leaves the URL **pending**: no button message arrived for it
(logged as `no button message for <url>`), the press was stopped by the
deadline, a flood stop, the press budget or the bot's throttle, or the press
went unanswered and the photo did not change.

**An answered press is still not corroborated against the photo, and must
not be.** The temptation after pass 4 is to demand a *changed* photo before
recording anything. Rejected, for the reason pass 3 already gave and pass 4
does not weaken: `same` is the legitimate result for a URL whose cached
picture is already current, so demanding `changed` would leave those URLs
pending forever and hand the owner a `pending` count that never reaches
zero. The refusal text, not the photo, is what distinguishes a rejected
press - and unlike the photo it is unambiguous. The photo delta keeps
exactly the job pass 3 gave it: a gate in the unanswered case, telemetry
everywhere else.

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

#### What the 115 entries in `state.json` are worth, and what the owner does about them (pass 4)

`context.md` fact 4 leaves this as a planning decision. Taken here.

The split is 87 `photo changed` and 28 `same`. The 87 carry their own
positive evidence and are fine. The 28 are **indistinguishable** between
"the cached photo was already current" (benign) and "the press was refused
by the throttle at the tail of phase 1" (a false entry of exactly the kind
this task exists to eliminate). Two facts make the ambiguity un-resolvable
after the fact:

- the run printed **aggregate counts only**, so nothing names *which* 28;
- `state.json`'s schema is one fingerprint per URL, with no record of the
  evidence class, so the file cannot be interrogated either.

It is also plausible - and only plausible; nobody measured it - that the
throttle began well before press 115 and that the `same` entries are
clustered at the tail. If so the number of false entries is up to 28 and
the quota is nearer 87 than 115. Neither claim is evidence; both are
reasons not to keep the file.

**Decision: the owner deletes `state.json` and restarts the reindex under
the fixed tool, keeping the old file as a backup outside the repository.**
Stated as a command in section 9, step E.0. Why this and not the
alternatives:

- **Keep all 115.** Rejected. Up to 28 URLs would be recorded as refreshed
  while still showing the old picture, and an incremental run skips them
  forever - until some future artwork commit re-fingerprints them by
  accident. That is precisely the lie pass 3 was written to remove, and
  keeping it for convenience would make the state file's guarantee
  conditional on a footnote.
- **Delete only the 28.** Not actionable: nothing names them. It is the
  right answer to a question the tool cannot answer.
- **Re-press the 115 with `--mode full --only <ids>`.** Same problem - the
  ids are unknown - and it costs the same presses as restarting while
  leaving the file's provenance mixed.
- **Add an evidence class to the state (schema v2) and re-verify.** Cannot
  label entries already written; the evidence is gone. Still worth doing
  for future runs - deferred, section 13.

The cost of restarting is **~115 presses re-spent**, about 11% of the 1062
the reindex costs anyway, i.e. two to three extra chunked runs out of ~22.
Re-pressing a URL that is already current is harmless: it answers, reports
`same`, and is confirmed. What it buys is a state file where **every entry
was written by a tool that can tell an accepted press from a refused one** -
uniform provenance, no footnote, nothing for a later session to re-litigate.

This is the owner's data and the owner's call; no agent touches
`state.json`. B4 does not depend on the answer - it is a code and docs
batch - so the confirmation gates O1/O2's first step only.

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

New: **a button message already in the chat is a cheaper retry** - pass 3
said *free*, and pass 4 corrects that: pressing it needs no new link, so it
costs nothing on the **send** axis, and the send axis was never the binding
one. It still costs a press, from the same `PRESS_LIMIT` allowance phase 2
draws on, and presses are the scarce resource. Cheaper than a re-send (one
attempt instead of two), never free. At run start,
after the live check and before any send, the tool reads the last
`RECOVER_SCAN` incoming messages and matches them against the stale, ready
URLs exactly as above. Every match is pressed (**phase 1, recovery**)
before any batch is sent (**phase 2**). This covers, with no extra send:

- a run that died between the send and the presses;
- a budget, flood, press-budget or throttle stop mid-batch;
- a press that went unanswered with an unchanged photo;
- ~~**the residue** from O1's probe - `cc12`, `cc24` and `cc38`.~~ **Done,
  2026-09-12**: phase 1 of the owner's second run picked all three up and
  they are among the 115 in `state.json`. Step F is therefore no longer a
  residue check and is repurposed in section 9.

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

**Revised (pass 4)** - the test list grew again; the port did not.

Pass 4 adds to the pure suite in `tools/tg-preview/lib.test.mjs`:

- **`botThrottle(text)`**: the measured sentence is recognised and yields
  `3213`; case and surrounding words do not matter; a throttle sentence with
  no seconds figure is still a throttle, with `seconds: null`; the bot's
  normal summary (`"Link previews was updated successfully..."`), an empty
  string and `null` are **not** throttles.
- **`parseArgs`**: `--press-limit` parses, defaults to `PRESS_LIMIT`, and
  throws on a non-numeric or negative value like the other three.
- **`runRefresh`**, one case each: a press answered with the throttle text
  is **not** recorded and stops the run green, with the presses before it
  recorded; a throttle in the bot's **summary** after a send stops the run
  without pressing that batch and without burning the remaining button-wait
  rounds; the press budget stops a run mid-phase-1 with the confirmed ones
  recorded; the press budget stops phase 2 *before* a send when fewer than
  `PER_MESSAGE` presses remain, and no send is attempted (asserted against
  the fake client's `sent` list, which is the whole point of the rule);
  phase 1 and phase 2 draw on **one** budget; `--press-limit 0` sends
  nothing and presses nothing and exits green; `--mode full` with a press
  budget below the stale count logs the warning.

The pass-3 list below stands in full.

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

**Revised (pass 4)**: `--press-limit N` is added. It bounds the presses a
single run attempts, across **both** phases, and defaults to `PRESS_LIMIT`
(50). It parses under the same numeric rule as the three flags below.
`--press-limit 0` is legal and degenerates safely: phase 1 presses nothing,
and phase 2 never starts a batch it cannot press, so the run sends nothing
either and exits green - no special case is needed to stop it creating
unpressable residue.

The pass-3 rule stands: `--limit`, `--max-wait` and `--budget-minutes`
must parse to a finite, non-negative number (`--limit 0` is legal and means
"phase 1 only, send nothing"); anything else throws `--limit must be a
number, got <value>` from `parseArgs`. Pass 1 let `Number('ten')` through as
`NaN`, which made `--limit` silently send nothing and `--budget-minutes`
silently mean "no budget" - both exit 0, both lies of the kind this revision
exists to remove. `--limit` still counts **sends** and never presses; phase
1's presses are bounded by `--press-limit` (pass 4) and reachable only
within `RECOVER_SCAN`.

### 5.2 Steps

**Revised (pass 4)** - steps 7, 11 and 12 amended; pass 3's replacement of
steps 7-10 otherwise stands.

Pass 4's amendments, in one place so the implementer does not have to diff
the prose below:

- **Step 7 (dry run)** additionally prints the press budget, so the pairing
  of `--limit` and `--press-limit` can be sanity-checked before anything is
  spent: `<todo> urls stale, <ready> ready, up to <batches> messages,
  <ready> presses (press budget <N>)`.
- **A new step 10a**, after the client is connected and before phase 1: if
  `mode === 'full'` and the press budget is smaller than the stale set, log
  one warning that `--mode full` cannot finish this set in one run and that
  chunked reindexing uses the default incremental mode (section 3.4,
  "`--mode full` is not chunkable").
- **Step 11 (phase 1)** spends from the run's press budget and stops when
  it is exhausted, exactly as it stops on the deadline.
- **Step 12 (phase 2)** checks the budget **before the send**: fewer than
  `PER_MESSAGE` presses remaining stops the run rather than sending a batch
  whose buttons cannot be pressed. Each button-wait round checks the bot's
  summary with `botThrottle()` and breaks out of the wait on a match instead
  of exhausting `BUTTON_WAIT_ROUNDS`.
- **Both phases**: a press whose callback answer `botThrottle()` recognises
  is not recorded, and stops the run.
- Stop reasons added, all green: `press budget reached`, `press budget too
  low for another batch`, `bot throttled: retry in <N>s`.

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

**Revised (pass 4)** for B4. Pass 3's list is done and landed at `2a4b78b`;
what follows is what B4 moves.

- No public contract changes, still: `CONTRACTS.md`, `docs/fixtures/`,
  `tests/contracts.js`, `llms.txt`, `robots.txt` untouched.
- `docs/specs/META.md` section 7 gains **one sentence**, alongside pass 3's:
  `@WebpageBot` also throttles update attempts per user, independently of
  Telegram's flood control, and refuses further attempts of either kind -
  presses and sends - with `"Sorry, too many attempts. Please try again in
  <N> seconds."` That is a durable fact about the bot, not about this tool,
  so it belongs in the spec next to the sentence about the button.
- `docs/tg-preview.md`: "Operations" (the `--press-limit` flag, what
  `--limit` does and does not bound, `--mode full` is a single deliberate
  pass and not the way to chunk a reindex, the throttle named in the CI-red
  paragraph as another green Telegram-side stop), "Rate limiting and
  resumability" (the third limit and the press budget; phase 1 is cheaper,
  not free), steps E, F and G per section 9 below, and "Coverage".
- `docs/specs/COVERAGE.md`: the `tools/tg-preview/lib.test.mjs` paragraph
  additionally names the throttle rule and the press budget; `client.mjs`
  and `live.mjs` stay the deliberate gap.
- `README.md` / `README.ru.md`, `package.json`, `.gitignore`, `CLAUDE.md`,
  `.github/workflows/previews.yml`: untouched. The default press budget
  applies in CI too and never binds there - an incremental run after a
  deploy is a handful of URLs - so no workflow input is added for it.

## 8. Parity and gates - confirmed, not assumed

**Stands**, and is re-confirmed for B4: it touches `tools/tg-preview/lib.mjs`
and `lib.test.mjs`, three docs and this task directory - nothing under
`app/src/**`, `data.js`, `i/`, `og/` or `tests/parity/**`, and nothing a
screen draws. Gate: `npm run check` only. Not `check:built`, not parity.

Pass 3's wording, for the record: files touched by the next batch:
`tools/tg-preview/**` (not
`package*.json`, `manifest.mjs`, `login.mjs`), `docs/tg-preview.md`,
`docs/specs/META.md`, `docs/specs/COVERAGE.md`, this task directory. None of
`index.html`, `app.js`, `style.css`, `app/src/**`, `data.js`, `og/`, `i/`,
`tests/parity/**`. Nothing a screen draws changes. Gate: **`npm run check`
only**, one foreground call. Not `check:built`, not parity.

## 9. The owner's manual steps, start to finish

**Revised (pass 4)** - steps E, F and G again. A-D, H-J stand (D.3's
troubleshooting block from R2 stands). The runbook `docs/tg-preview.md`
carries the same text.

> Superseded (pass 4): pass 3's step F was a residue check on
> `cc12,cc24,cc38` - **done**, those three are in the state file now. Pass
> 3's step G told the owner to repeat `--mode full --limit 10`, which is
> the loop that re-presses the previous chunk every run (`context.md`
> fact 2). Both are replaced below.

**A-D.** Unchanged; all done by the owner on 2026-09-11 (the session exists
in the owner's `.env`).

**E. Clear the untrustworthy state, then dry-run (no Telegram involved).**

0. **Retire the 115-entry state file.** Section 3.4, "What the 115 entries
   are worth", is the reasoning; this is the command. Move it out of the
   repository rather than deleting it, so its 87 `photo changed` entries
   survive as evidence for B2:
   ```text
   mv tools/tg-preview/state.json ../state-2026-09-12-115.json.bak
   ```
   Do not leave the backup inside the working tree - nothing there is
   gitignored for it, and `git status` noise around this file is exactly
   how a half-trusted state gets committed by accident.
1. `node tools/tg-preview/run.mjs --dry-run` - **no `--mode full`.** With no
   state file, incremental mode already means "everything": expect
   `1062 urls stale, 1062 ready, up to 107 messages, 1062 presses (press
   budget 50)` when the site is deployed at the commit you are on;
   otherwise some are reported not live, which is the check working.
2. `node tools/tg-preview/run.mjs --dry-run --only w76` - one URL, one
   message, one press.

**F. The calibration run - one chunk, read carefully.**

1. `node tools/tg-preview/run.mjs --limit 5 --press-limit 50`. That is 50
   URLs: five sends, fifty presses, about two minutes. Expect
   `refreshed 50, pending 1012` and `pressed 50 (photo changed ~50, same
   ~0, none 0)`. `changed` should dominate, because every cached picture in
   this reindex is known stale.
2. What each outcome means, and what to do:
   - **`stopped: bot throttled: retry in <N>s`** - the quota is *below* 50
     on this account. Wait the full `N` the bot named, then retry with
     `--limit 2 --press-limit 20` and report the numbers.
   - **A run that completes 50 presses cleanly** - 50 is a safe floor. Two
     or three more clean runs are grounds to try `--limit 10 --press-limit
     100`; the point of the flag is that the owner tunes it on evidence
     rather than the plan guessing.
   - **Mostly `same`** - spot-check by pasting before trusting the chunk,
     and report it.
3. In Saved Messages (any account), paste one of the URLs this run
   confirmed and compare the preview picture with the live `og/` image for
   that record. Same picture = the press works through the tool.
4. **Regression check, still owed and still cheap:** find an
   already-posted message carrying one of those links and confirm its
   preview changed too. If it did not, stop and report; the runbook's
   opening claim would no longer hold. (Owner decision 6 says it does; this
   is the regression check on that, not new evidence-gathering.)

**G. The rest of the reindex - a multi-day, spaced operation.**

1. Repeat step F.1's command - `--limit 5 --press-limit 50`, **incremental
   mode, which is the default** - until it prints `pending 0`. About 22
   runs for 1062 URLs. Each run is resumable: it sends only what is not yet
   confirmed and presses anything already waiting in the chat.
2. **Space them.** The one measured cooldown was 3213 s (~54 minutes), so
   treat roughly an hour between chunks as the working assumption until the
   numbers say otherwise. Nothing in the tool remembers a cooldown across
   runs (section 13); the spacing is yours to keep.
3. Stops, and what they mean - **all of them are green and all of them
   leave the backlog recorded**: `bot throttled: retry in <N>s` (wait `N`,
   then continue); `press budget reached` (normal end of a chunk);
   `PeerFloodError` (Telegram, not the bot - stop for the day).
4. Do **not** use `--mode full` to drive this. It marks every URL stale on
   every run, so phase 1 re-presses the same recovered buttons each time
   and the reindex never advances - the tool warns when you try. `--mode
   full` is one deliberate pass for a state you do not trust, which is what
   step E.0 has already handled.
5. Read the `photo changed` count each time; a chunk reporting mostly
   `same` means spot-check a few of its links by pasting before trusting
   it, and report it.
6. When `pending 0`: `git add tools/tg-preview/state.json && git commit -m
   "chore(tg-preview): record the first full reindex"` and push. From here
   CI only ever sends and presses what changed, a handful of URLs at a
   time, well inside any quota.

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
Next, as of pass 4: **B4** (section 10a), then O2.

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

**Status: attempted 2026-09-12, stopped by the bot's attempt quota, and
this is the reason for pass 4.** What it produced: the residue
(`cc12`/`cc24`/`cc38`) pressed, 115 entries in `state.json` of which 87
carry photo evidence and 28 do not, and the first measurement of the press
axis. What it did not produce: a completed reindex, or a state file whose
entries all mean the same thing. Superseded by O2.

### B4 - make the reindex completable against the bot's attempt quota (one batch, one commit)

**Status: implemented 2026-09-12.** Full text in section 10a below. Shipped
exactly as specified: `PRESS_LIMIT = 50`, `botThrottle()`, `--press-limit`,
the run-scoped press budget spanning both phases, the pre-send and
button-wait-round throttle checks, the `--mode full` warning, and the docs
and specs it names. `npm run check` green. See `handoff.md` for the commit
and exact commands.

### O2 - the owner's operations, restarted from step E.0

Not a code batch and no agent can perform it. Section 9 as revised in pass
4: E.0 (retire the 115-entry state) -> E (dry runs) -> F (the calibration
chunk, read carefully) -> G (~22 spaced chunks) -> H-J. Needs B4 present in
the tree the owner runs from. The orchestrator collects, because they are
B2's only input: F.1's counts, whether 50 presses complete cleanly, the
`N` of any throttle stop, F.4's already-posted regression result, and the
per-chunk `photo changed`/`same` ratio.

### B2 - tuning from the first real run (outline; may be empty)

After O2: fold in what Telegram and the bot actually did on all three
limits - whether ten links per message are honoured, the real `FLOOD_WAIT` /
`PEER_FLOOD` behaviour of presses versus sends, how often presses go
unanswered, the `same`/`changed` ratio, **what the bot's attempt quota and
its window really are** (so `PRESS_LIMIT`'s default can stop being a
deliberate under-estimate), and the remaining deferred items in section 13
that O2's evidence makes worth doing. Gate: `npm run check`. If nothing
needs changing, close the task without it.

## 10a. B4 - the implement-ready batch

**Objective.** Make a chunked reindex completable against `@WebpageBot`'s
attempt quota: bound what one run presses, recognise the bot's refusal
instead of recording it as success, and correct the runbook loop that
re-presses the previous chunk. Behaviour constraints are sections 2
(carve-out), 3.4 (all of it), 5.1 and 5.2 as revised in pass 4; do not
reopen them.

**In scope.** `tools/tg-preview/lib.mjs`, `tools/tg-preview/lib.test.mjs`;
`docs/tg-preview.md`; `docs/specs/META.md` section 7 (one sentence);
`docs/specs/COVERAGE.md` (one paragraph);
`issues/tg-preview-refresh/{context,plan,handoff}.md` (stage the
orchestrator's already-modified `context.md` as-is - it is the evidence this
batch acts on, and this batch changes nothing in it).

**Out of scope.** `tools/tg-preview/run.mjs`, `client.mjs`, `live.mjs`,
`manifest.mjs`, `login.mjs`, `package*.json` (no new dependency - the
throttle match is a regex);`.github/workflows/previews.yml` and `ci.yml`;
`README*.md`; `.gitignore`; `CLAUDE.md`; every public contract. Nothing
under `app/src/**`, `data.js`, `i/`, `og/`, `tests/parity/**`.
`tools/tg-preview/state.json` is the owner's untracked file: **do not read
it, do not commit it, do not delete it, do not edit it.** Retiring it is
step E.0, the owner's own action. **No Telegram contact of any kind:** the
owner's live session is in `.env`; every `run.mjs` invocation uses
`--dry-run`.

**Steps.**

1. `lib.mjs` - constants: `export const PRESS_LIMIT = 50;` with a
   why-comment carrying the one data point (115 presses tripped the quota;
   the cost of over-shooting is a ~54-minute lockout plus the sends already
   spent, so the default under-shoots on purpose and `--press-limit`
   raises it on evidence). Keep every existing constant and value.
2. `lib.mjs` - `export function botThrottle(text)`: returns `null` when
   `text` is falsy or does not match `/too many attempts/i`; otherwise
   `{ seconds }`, where `seconds` is the first integer followed by
   `second`/`seconds` in the text, or `null` when there is none. Pure, no
   other matching, one comment pointing at section 2's carve-out and its
   asymmetry rule.
3. `lib.mjs` - `parseArgs()`: add `'--press-limit': 'pressLimit'` to
   `FLAGS`, default `opts.pressLimit = PRESS_LIMIT`, and include
   `pressLimit` in the existing numeric-guard branch alongside `limit`,
   `maxWaitS` and `budgetMinutes` (so `--press-limit ten` throws
   `--press-limit must be a number, got ten` and `--press-limit 0` is
   legal).
4. `lib.mjs` - `runRefresh`: one run-scoped counter of presses attempted,
   seeded from `opts.pressLimit`.
   - `pressOne` refuses to press when the budget is exhausted and returns
     `{ stopped: 'press budget reached' }`; a press that is attempted
     decrements it whether or not it succeeded (a refused attempt still
     counts against the bot's quota).
   - `pressOne` inspects the answer: `botThrottle(text)` non-null means the
     press was **refused** - return `{ stopped: 'bot throttled: retry in
     <N>s' }` (or `'bot throttled'` when `seconds` is null) and do **not**
     report it as answered. `pressGroup` must not push a refused press onto
     `pressedList`, so it reaches neither `confirmed` nor the photo
     telemetry.
   - Phase 2, before each send: stop with `press budget too low for another
     batch` when fewer than `PER_MESSAGE` presses remain. Stop, never trim
     the batch.
   - Phase 2, each button-wait round: if any `m.summary` entry is a
     throttle, log it, stop the run with the same reason, and press nothing
     from that batch - do not exhaust the remaining `BUTTON_WAIT_ROUNDS`.
   - New step 10a after `client()` and before phase 1: when `mode ===
     'full'` and `opts.pressLimit < todo.length`, log one warning naming
     `--mode full`, the budget, and `docs/tg-preview.md` step G.
   - Dry-run counts line gains ` (press budget <N>)`.
   - Every new stop is green: `exitCode` stays 0.
5. `lib.test.mjs` - every case named in section 3.7's pass-4 list, plus keep
   all 68 existing cases passing (the fake client already scripts `press`
   answers by text, so a throttle case is `{ text: 'Sorry, too many
   attempts. Please try again in 3213 seconds.' }`). The "no send is
   attempted" assertions read the fake client's `sent` array.
6. `docs/specs/META.md` section 7: the one sentence from section 7 of this
   plan, after the existing "Update with content" sentence.
   `docs/specs/COVERAGE.md`: extend the `tools/tg-preview/lib.test.mjs`
   paragraph with the throttle rule and the press budget.
7. `docs/tg-preview.md` - in place, in this order: (a) "Operations" gains
   `--press-limit` next to `--limit`, says plainly that `--limit` counts
   sends and `--press-limit` counts presses across both phases, and that a
   batch is not sent when its presses are unaffordable; (b) the
   `--mode full` bullet in "Operations" says it is a single deliberate pass
   and **not** how to chunk a reindex, and that the tool warns; (c) the
   CI-red bullet names the bot throttle as another green Telegram-side stop
   (the red list itself does not change); (d) "Rate limiting and
   resumability" gains the third limit - the bot's own attempt quota, the
   measured 115/3213 s data point, the press budget and why the throttle
   stops rather than waits - and corrects "free retry" to "cheaper retry"
   in the phase-1 paragraph; (e) steps E, F and G replaced by section 9's;
   (f) "Coverage" names `botThrottle` and the press budget; (g) afterwards
   `grep -in "free\|--limit\|mode full" docs/tg-preview.md` and read every
   hit - no sentence may still imply presses are free or that `--mode full`
   is the chunking mode.
8. `node --test tools/tg-preview/lib.test.mjs`; then
   `node tools/tg-preview/run.mjs --dry-run` and
   `node tools/tg-preview/run.mjs --dry-run --press-limit ten`; then
   `set -o pipefail; npm run check 2>&1 | tail -n 120` with Bash timeout
   600000. Stage by name: `tools/tg-preview/lib.mjs`,
   `tools/tg-preview/lib.test.mjs`, the three docs, the three task files.
   Never `git add -A`. Commit `fix(tg-preview): bound presses per run and
   stop on @WebpageBot's attempt throttle`.

**Acceptance criteria.**

- `node --test tools/tg-preview/lib.test.mjs` passes without
  `tools/tg-preview/node_modules` present.
- `node tools/tg-preview/run.mjs --dry-run` prints the counts line ending
  `(press budget 50)`, sends nothing, writes nothing, exits 0, without the
  three env vars.
- `node tools/tg-preview/run.mjs --dry-run --press-limit ten` exits non-zero
  with `--press-limit must be a number, got ten`.
- A `runRefresh` test proves a press answered with the throttle sentence is
  in **no** `writeState` call and that the run's `exitCode` is 0.
- A `runRefresh` test proves that with a press budget below `PER_MESSAGE`,
  the fake client's `sent` array is empty.
- A `runRefresh` test proves phase 1 and phase 2 draw on one budget.
- `git status` after the batch shows no change to `previews.yml`,
  `package*.json`, `run.mjs`, `client.mjs`, `i/`, `og/`, `data.js`;
  `tools/tg-preview/state.json` still untracked and unmodified.
- `npm run check` green in one foreground call.

**Gates.** `npm run check` only, one foreground call,
`set -o pipefail; npm run check 2>&1 | tail -n 120`, Bash timeout 600000.
**Not** `check:built` and **not** parity: nothing under `app/src/**`,
`data.js`, `i/`, `og/` or `tests/parity/**` is touched and nothing a screen
draws changes (section 8).

**Risks / do-nots.**

- Never run `run.mjs` without `--dry-run`. Every press spends the quota the
  owner needs, and the quota is the whole subject of this batch.
- Do not widen the text match beyond `too many attempts` + the seconds
  figure, and do not let any text **grant** confirmation. Section 2's
  carve-out is safe only because it is one-directional.
- Do not demand a changed photo before recording an answered press
  (section 3.4) - that is the trap pass 3 already documented.
- Do not change `stale()`, and do not touch `previews.yml` or `client.mjs`.
- Do not read, edit, commit or delete `tools/tg-preview/state.json`.
- Do not trim a batch to fit the remaining press budget; stop instead.

## 11. Open questions - NEEDS_HUMAN_CONFIRMATION: yes, one, and it does not block B4

**Revised (pass 4).** Both pass-1 questions were answered by the owner
(`context.md`, decisions 5 and 6). Pass 3 raised none. Pass 4 raises exactly
one, and it is about the owner's own data rather than about the design:

**Q: retire the 115-entry `state.json` and restart the reindex?** The plan's
answer is yes - section 3.4, "What the 115 entries are worth", with the
command in section 9 step E.0 (move it to a backup outside the repository,
do not delete it). 28 of the 115 cannot be distinguished from
throttle-refused presses, nothing names which 28, and the schema cannot be
interrogated for it. The cost of restarting is ~115 presses, two or three
extra chunked runs out of ~22. The owner may reasonably decide the residual
risk is acceptable and keep the file; in that case up to 28 URLs keep a
stale preview until some future artwork commit re-fingerprints them, and
that should be written down rather than forgotten.

**This blocks O2's first step only.** B4 is a code-and-docs batch that never
touches `state.json`; it can be implemented, reviewed and committed while
this question is open.

> Superseded (pass 3's answer to a narrower question): "no entry written by
> the unfixed tool can be trusted on its own, and there is exactly one such
> entry - `cc19`... the file as it stands is correct and should be kept."
> True when the file held one hand-pressed entry. It now holds 115 written
> by a tool that could not tell a refused press from an accepted one.

## 12. Risks and assumptions

**Revised (pass 4).** The pass-4 entries first; pass 3's list follows and
still holds except where noted.

- **The quota is one data point.** 115 presses tripped it once, with a 3213
  s cooldown. Nobody knows the count, the window, whether sends and presses
  share a counter, or whether the limit is per account, per day or per
  hour. `PRESS_LIMIT = 50` is an under-estimate chosen for asymmetric cost,
  not a measurement; the runbook's calibration step (section 9, F.2) and
  every run's `pressed P` line are how it stops being a guess. **Do not
  write the quota into a doc as if it were known.**
- **The throttle sentence could change.** The carve-out matches
  `too many attempts`, case-insensitively, and nothing else. If the bot
  rewords it, the tool silently returns to pass-3 behaviour - refused
  presses recorded as confirmed - and nothing alerts anyone. The
  countervailing signal is the photo telemetry: a run that suddenly reports
  mostly `same` is the symptom, and the runbook already tells the owner to
  spot-check on exactly that. A stronger fix (an evidence class in the
  state) is deferred, section 13.
- **The reindex is now a multi-day operation.** ~22 spaced chunks. The risk
  is not technical: it is that a partly-done reindex sits for weeks and
  nobody remembers where it stopped. The state file *is* the record, and
  `pending N` is the progress bar; the handoff carries the count.
- **Fresh-account limits, now on two axes** (pass 3, and the third limit
  above is the one that actually bit). Presses are a different method
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

Added in pass 4, all for B2 and all wanting O2's numbers first:

- **A persisted press ledger** - remember when the last presses were spent
  (and any cooldown the bot named) so a run refuses to start inside it,
  instead of the runbook asking the owner to keep the spacing by hand.
  Needs a schema change to a committed file and a model of a window we have
  one sample of; section 3.4 names it as the rejected-for-now option.
- **An evidence class per URL in the state** (`answered` / `photo-changed`)
  so a future 28 can be named and re-verified without deleting everything.
  This is the schema-v2 item below, widened: it is what would have made
  pass 4's owner decision a two-line command instead of a judgement call.
- **Tune `PRESS_LIMIT`'s default** once several clean runs bound the quota
  from below, and consider deriving the chunk's `--limit` from it so the
  two flags cannot be paired wrongly.

Other deferrals:

- **Photo id in the state (schema v2)** so incremental runs can demand a
  changed photo whenever the image sha changed - section 3.4, "Considered
  and not taken". Revisit after O2 reports the `same`/`changed` ratio.
- A pointer line in `CLAUDE.md` and `.claude/prompts/refresh-artwork.prompt.md`
  - orchestrator's call, one line each.
- Other messengers' caches. Not this task.
- Issue 47 cut-over checklist item: keep `page()` importable, or point
  `manifest.mjs` at the new generator; decide whether `og/` stays a source
  asset.
