# Handoff - TASK tg-preview-refresh

Recovery state for the next session. Read `CLAUDE.md`, then
`issues/tg-preview-refresh/context.md` (in full), then `plan.md` (its
"Revision history" block first), then this file.

## Start here - a session that has none of this in context

**This work is not in the main checkout.** It lives in a worktree the owner
authorised on 2026-09-11:

| | |
|---|---|
| Worktree | `E:/dev/daggerheart-loot-wt/tg-preview-refresh` |
| Branch | `automation/tg-preview-refresh` |
| Base | `8b96ff4`, the main checkout's local HEAD at the time |
| Commits | `cce10cb` -> `5a959ca` -> `a4c9066` -> `0ab04eb` -> `2a4b78b` |

The task-directory copies **in that worktree** are authoritative. The copy
under `E:/dev/daggerheart-loot` is a snapshot taken before the worktree
existed and is stale by several batches - do not read it as current.

Establish state before acting; do not assume this file is the newest thing
that happened:

```
git log --oneline -5
git status --porcelain
```

Five facts a fresh session will not infer, in descending order of how much
damage getting them wrong does:

1. **`.env` in this worktree holds a live Telegram user session** for a
   days-old account that Telegram flood-limited once on 2026-09-11. **No
   agent runs `run.mjs` without `--dry-run`, ever** - every send and press
   spends a budget the owner needs for a 1062-URL reindex. Do not read,
   print or copy `.env`; `bash-guard` denies it and that is correct.
2. **`tools/tg-preview/state.json` is untracked and holds `cc19` only.** That
   entry is honest because the owner pressed its button by hand before B3
   existed. Keep it. Do not commit it until after the full reindex (runbook
   step G.2), do not delete it, do not edit it.
3. **`origin/main` moved during the session that did this work** - from
   `37ecc8d` to `9fd3000 docs(issue-47): the print image residue, measured a
   third time`, pushed by a peer session on the same machine. Nothing here
   is affected (this branch never pushes), but **merge onto the current
   `origin/main`**, not onto the base this branch was cut from. Re-read
   `git log --oneline -3 origin/main` rather than trusting that sha too.
4. **Nobody pushes.** Pushing and merging are the owner's, per `CLAUDE.md`.
   Merging should still wait for issue 47's B7 to land in the main checkout.
5. **Parity is confirmed not required** for this task, and a
   `app/src/components/searchPage.test.ts` timeout in `npm run check` is a
   known load flake on this host - this task touches nothing under `app/**`.
   Re-run it; do not diagnose it as a regression.

The next batch is **O1, the owner's own operations**. No agent can perform
it and none should be dispatched for it. See "Next batch" below.

## Status
- Task status: **in_progress - B3 implemented and committed; O1 (resumed)
  is next, and it is the owner's operations, not a code batch.**
- B3 replaced B1's send-and-trust loop with the two-phase design `plan.md`
  section 10 specifies: phase 1 (recovery - press any "Update with content"
  button already sitting in the chat, no new send) then phase 2 (send a
  batch, wait for the bot's one-message-per-link button replies, press each,
  record only confirmed URLs). `state.json` now records a URL only when its
  press was acknowledged, or - in the unanswered case only - when a re-fetch
  shows the photo id changed. An unchanged photo id is not treated as
  failure when the press was answered, and not treated as success when it
  was not.
- Last agent: implementer (2026-09-11) - implemented B3, ran the gates, no
  Telegram contact (every `run.mjs` invocation used `--dry-run`).
- NEEDS_HUMAN_CONFIRMATION: **no**.
- Branch: `automation/tg-preview-refresh`, worktree
  `E:/dev/daggerheart-loot-wt/tg-preview-refresh`. Base for B3: `0ab04eb`.
  Not merged, not pushed - the owner's call, and still best after issue 47's
  B7 lands in the main checkout.
- Working tree after B3: `tools/tg-preview/state.json` still **untracked**,
  unchanged by this batch (holds `cc19` only, as before - B3 touched no
  Telegram surface). `issues/tg-preview-refresh/{context,plan,handoff}.md`
  updated and staged for the commit.
- **The owner's live Telegram session is in `.env` in this worktree.** No
  agent runs `run.mjs` without `--dry-run`, ever.

## Completed
- Batch name/id: **B3** - the two-phase refresh.
- What shipped:
  - `tools/tg-preview/lib.mjs`: six new constants (`PRESS_PACE_MS`,
    `BUTTON_WAIT_ROUNDS`, `BUTTON_WAIT_MS`, `BUTTON_FETCH`, `RECOVER_SCAN`,
    `UPDATE_BUTTON`); `decide()` gained the `BotResponseTimeoutError` ->
    `{ unanswered: true }` row; `parseArgs` now throws
    `<flag> must be a number, got <value>` on a non-finite or negative
    `--limit`/`--max-wait`/`--budget-minutes` (`--limit 0` stays legal);
    new pure `matchButtons(messages, urls)` (exact `url` match, one
    trailing-slash fallback, newest-id-wins, the bot's plain summary
    collected separately); `runRefresh` rewritten around three inner
    helpers - `attempt()` (the shared retry/deadline table for both sends
    and presses), `pressGroup()` (presses a set of matched URLs, paced,
    then one `byIds` re-fetch for the photo delta), and `record()` (the
    carry-forward state/`--result` write) - driving phase 1 (recovery scan
    + press) then phase 2 (send, wait for button messages up to
    `BUTTON_WAIT_ROUNDS`, press, record) per batch. Returns
    `{ sent, pending, notLive, unmatched, pressed, confirmed, photo,
    floodWaits, stopped, exitCode }`, `pending = todo - confirmed`.
  - `tools/tg-preview/client.mjs`: grew from three methods (`send`,
    `lastReply`, `close`) to five (`send -> {id}`, `incoming({afterId,
    limit})`, `byIds(ids)`, `press(id, data)` via
    `client.invoke(Api.messages.GetBotCallbackAnswer(...))`, `close`), plus
    a module-private `plain(m)` `Msg` mapper so `lib.mjs` never sees a TL
    class. Every TL field name (`MessageMediaWebPage.webpage`, `WebPage` /
    `WebPagePending`, `Photo.id` as `BigInteger`,
    `ReplyInlineMarkup.rows[].buttons[]` as `KeyboardInlineButton { text,
    type }`, `InlineButtonTypeCallback { data }`) was verified against the
    installed `teleproto@1.229.0` before writing the mapper - see
    Verification below. Uses `invoke()` rather than `Message.click()`
    because `click()` swallows `BOT_RESPONSE_TIMEOUT` into `null`
    (confirmed by reading `tl/custom/messageButton.js`).
  - `tools/tg-preview/live.mjs`: `imageSha(name)`'s cache now drops a
    rejected promise (`promise.catch(() => imageCache.delete(name))`) so a
    404 on a **new** `og/<name>.jpg` in round 1 (Pages still catching up) is
    retried in round 2 instead of failing every remaining round.
  - `tools/tg-preview/run.mjs`: summary block now reads
    `result.confirmed`/`result.pending`/`result.unmatched`/`result.stopped`
    for line 1 (`refreshed N, pending M[, not live L][, no button message
    U][, stopped: reason]`) and appends line 2, `pressed P (photo changed
    C, same S, none Z)`, to both stdout and `$GITHUB_STEP_SUMMARY`. No other
    wiring changed.
  - `tools/tg-preview/lib.test.mjs`: rewritten fake client (`send` returns
    incrementing `{id}`; `incoming` is a queue of canned `Msg[]`, one per
    call; `byIds` reads a mutable `photoAfter` map; `press` is a scripted
    `{text}|{throw}` queue), plus `buttonMsg(id, url, photoId)` and
    `summaryMsg(id, text)` builders. **68 tests** (up from 23): every B1
    test kept and adapted to the `confirmed` field; a new `matchButtons`
    describe block (7 cases); 19 new `runRefresh` cases covering the
    two-phase loop, both flood axes, the unanswered-press/photo-delta rule,
    phase 1 recovery, `--limit 0`, the deadline mid-press, and the
    photo-telemetry counts.
  - `docs/specs/META.md` section 7: one added sentence - a plain send keeps
    the cached picture when `og:image` is unchanged; only the button
    re-downloads it.
  - `docs/specs/COVERAGE.md`: the `tools/tg-preview/lib.test.mjs` paragraph
    now names `matchButtons` and the two-phase loop.
  - `docs/tg-preview.md`: corrected per `plan.md` B3 step 11(a)-(j) - the
    opening paragraphs, the tool description, setup steps E/F/G (F is now
    "the residue check", G is now chunked with the ~40-minute figure),
    "Operations" (summary vocabulary, the CI-red sentence matched against
    `previews.yml`'s actual `if:` conditions), "Rate limiting and
    resumability" (both axes, the constants, the deadline rule, phase 1 as
    the free retry), and "Coverage". Verified afterwards with
    `grep -in "send.*refresh\|refresh.*send"` - no remaining sentence
    claims a send alone refreshes the preview.
  - `issues/tg-preview-refresh/{context,plan,handoff}.md`: `context.md`
    staged as-is (the orchestrator's measured-findings sections, already
    correct - this batch acted on them, changed nothing in them); `plan.md`
    B3 marked implemented; this file.
- Files changed: `tools/tg-preview/lib.mjs`, `lib.test.mjs`, `client.mjs`,
  `live.mjs`, `run.mjs`; `docs/tg-preview.md`; `docs/specs/META.md`;
  `docs/specs/COVERAGE.md`; `issues/tg-preview-refresh/{context,plan,
  handoff}.md`.
- Commit(s): one Conventional Commit on top of `0ab04eb`, staged by path
  (never `git add -A`), authored `artex-x
  <artex-x@users.noreply.github.com>`, no AI attribution trailer. SHA
  recorded by the orchestrator/human from `git log -1` after this handoff
  lands (the implementer's final message names it).
- Deviations and rationale: none from the plan's behaviour constraints
  (section 3.4, 4, 5.1, 5.2, 5.4, 5.5 as written; `PER_MESSAGE` stayed 10;
  state schema stayed `version: 1`; the five-method port and `Msg` shape as
  specified; no new dependency - `teleproto` already exports `Api`). One
  clarification made while implementing, not a deviation: the "nothing
  ready to send" early-exit (step 5.2, step 8) now keys off `ready.length
  === 0`, not `batches.length === 0` - the plan's step 8 numbering and the
  `--limit 0` acceptance criterion only work together if that check ignores
  `--limit`, since `--limit 0` legitimately produces an empty `batches`
  while `ready` (and therefore phase 1) is still non-empty. The plan's
  prose already implies this (step 11 relies on `ready`, not `batches`,
  being what phase 1 filters); this is a precise reading, not a new
  decision.

## Verification
- Commands run (exact) and results:
  - `node --test tools/tg-preview/lib.test.mjs` - **68/68 pass** (`tests
    68, pass 68, fail 0`).
  - `node tools/tg-preview/run.mjs --dry-run --mode full` -
    `1062 urls stale, 1062 ready, up to 107 messages, 1062 presses` (one
    `og/` image needed a live-check retry round; all 1062 ended up ready -
    the site is deployed at this worktree's commit). Sent nothing, wrote
    nothing, loaded no client.
  - `node tools/tg-preview/run.mjs --dry-run --only cc12,cc24,cc38` -
    `3 urls stale, 3 ready, up to 1 messages, 3 presses`.
  - `node tools/tg-preview/run.mjs --limit ten --dry-run` - exits 1,
    `tg-preview run failed: --limit must be a number, got ten`.
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` (Bash timeout
    600000) - **green, exit 0**. `format:check`, `lint`, `typecheck`,
    `data`, `tests/derived.js`, `tests/i18n.js`, the hooks selftest,
    `node --test tools/tg-preview/lib.test.mjs` (68 pass), and `npm run
    test` (vitest: 39 files, 947 tests, all pass; coverage 96.27%
    statements / 88.53% branches / 96.67% functions / 97.01% lines - all
    above their thresholds) all passed in this one run. No
    `searchPage.test.ts` flake this time.
  - `grep -n "lastReply" tools/tg-preview/*.mjs` and
    `grep -n "sinceMs" tools/tg-preview/*.mjs` - both empty.
  - `grep -in "send.*refresh\|refresh.*send" docs/tg-preview.md` - two
    hits, both read and confirmed accurate (a plain send *only* refreshes
    title/description; "a refresh" is defined as send+press) - neither
    claims a send alone refreshes the preview.
  - `git status --porcelain` after the batch - no change to `previews.yml`,
    `ci.yml`, `package*.json`, `manifest.mjs`, `login.mjs`, `i/`, `og/`,
    `data.js`; `tools/tg-preview/state.json` still untracked.
- TL names verified against the installed
  `tools/tg-preview/node_modules/teleproto@1.229.0` before writing
  `client.mjs` (read directly, not re-derived from the plan's claims):
  `messages.GetBotCallbackAnswer({ peer, msgId, data, password? })` ->
  `messages.BotCallbackAnswer { message?, alert?, url?, cacheTime }`
  (`tl/generated/api.d.ts:28458,21088`); `BotResponseTimeoutError` is one of
  `MessagesGetBotCallbackAnswerErrors` and carries `errorMessage
  'BOT_RESPONSE_TIMEOUT'` (`errors/RPCErrorList.js`); `getMessages(client,
  entity, { minId, ids, limit, ... })` (`client/messages.d.ts:317`), and its
  `_IDsIter` pushes `undefined` for a `MessageEmpty` or wrong-peer result
  (`client/messages.js:407-413`) - documented behaviour, not a workaround;
  `Message` extends `CustomMessage`, which carries `id`, `out?`, `message?`,
  `media?`, `replyMarkup?` (`tl/custom/message.d.ts`);
  `MessageMediaWebPage.webpage: TypeWebPage` is `WebPage { id, url,
  photo? }` or `WebPagePending { id, url?, date }`; `Photo.id: long`
  (`BigInteger`); `ReplyInlineMarkup.rows: TypeKeyboardInlineButtonRow[]`,
  `KeyboardInlineButtonRow.buttons: TypeKeyboardInlineButton[]`,
  `KeyboardInlineButton { style?, text, type: TypeInlineButtonType }`,
  `InlineButtonTypeCallback { requiresPassword?, data: bytes }`; every
  generated TL class sets `this.className` on the **instance**, not only as
  a static/type-level property (`tl/runtime/createApi.js:234`), so
  `x.className === 'Foo'` runtime checks (used throughout `client.mjs`'s
  `plain()` mapper) work as written. `Message.click()` swallows
  `BOT_RESPONSE_TIMEOUT` into `null` (`tl/custom/messageButton.js:75-85`) -
  confirms the plan's reason for calling `invoke()` directly. **No mismatch
  found between the plan's section 5.5 and the installed package**; nothing
  needed to be reported as a deviation on this front.
- Gates: `npm run check` only, per `plan.md` section 8 (nothing under
  `app/src/**`, `data.js`, `og/`, `i/`, `tests/parity/**` touched). Not run:
  `check:built`, parity - both correctly out of scope for this batch.

## Next batch (implement-ready)
- Name: **O1 (resumed) - the owner's operations, from step E**
  (`plan.md` section 10, O1 resumed). Not a code batch - no agent can
  perform it (needs the owner's phone, Telegram session, and judgement
  calls on the `photo changed`/`same` ratio).
- What it covers: `docs/tg-preview.md` section 9 (mirrored in `plan.md`
  section 9), steps E (dry runs against the now-fixed tool) -> F (the
  residue check: `--only cc12,cc24,cc38`, expected `refreshed 3, pending 0`
  / `pressed 3 (photo changed 3, same 0, none 0)`, plus the regression check
  on an already-posted message) -> G (the chunked full reindex,
  `--limit 10` repeated across the day, ~4 minutes per 100 URLs) -> H-J
  (repository secrets, first CI run, rotation/shutdown notes - unchanged).
- Produces: `tools/tg-preview/state.json` fully populated on `main`, plus
  the three repository secrets. The orchestrator should collect: F.1's
  `photo changed` count, F.4's already-posted-message regression result,
  and G.2's per-chunk `photo` counts - these are B2's input (below).
- Blockers for O1: none technical. B3 is present in this worktree; O1 needs
  it merged (or at least available in the tree the owner runs from) before
  the owner starts step E for real, since the fixed tool is what makes step
  F's residue check meaningful.

## Blockers
- None for B3 - it is done.
- Merging this worktree's branch into `main` still waits for issue 47's B7
  to land in the main checkout first (orchestrator's ordering, unchanged
  from before this batch).
- O1 is paused at step E until B3 is merged or otherwise available where
  the owner runs from.

## Deferred
- **Reviewer's remaining R1 items** (`plan.md` section 13) - left for B2:
  5 (`$LIMIT`/`$args` quoting in `previews.yml`, untouched on purpose this
  batch), 6 (unused `urls()` export, test-only surface), 7 (`--apply`'s
  needless `buildFromTree()` call).
- Photo id in the state (schema v2) so an incremental run could demand a
  changed photo whenever the image sha changed - `plan.md` 3.4, "Considered
  and not taken". Revisit after O1 reports the real `same`/`changed` ratio.
- B2 - tuning from the first real run on both axes (send and press flood
  behaviour, how often presses go unanswered, the `same`/`changed` ratio);
  may end up empty if O1's numbers look fine.
- One pointer line in `CLAUDE.md` and
  `.claude/prompts/refresh-artwork.prompt.md` - orchestrator's call.
- Issue 47 cut-over checklist: keep `page()` importable or repoint
  `manifest.mjs`; decide whether `og/` stays a source asset (`--assets`
  already exists).
- Other messengers: not this task.

## Notes
- Mocks path: none (tooling and CI; no UI).
- Screenshot findings: none.
- **Can the owner trust any `state.json` entry written before B3?** Same
  answer as before this batch, unchanged by it: no entry written by the
  *unfixed* tool is trustworthy on its own; the one that exists (`cc19`) is
  honest only because the owner pressed its button by hand. B3 changes
  nothing about entries already on disk - it only changes what future runs
  write. `--mode full` re-does everything honestly if that is ever in
  doubt.
- Why the "nothing ready to send" check moved to `ready.length === 0`: the
  acceptance criterion "`--limit 0` still runs phase 1" only holds if the
  early exit before connecting to Telegram does not key off `batches`
  (which `--limit 0` always empties) - it must key off whether there is
  anything live to work with at all (`ready`). See "Deviations" above.
- Why `pressGroup`'s photo check treats a `byIds` miss (a deleted message)
  as `'same'` rather than `'none'`: `'none'` is reserved for "the webpage
  currently has no photo at all" (an observed fact from `byIds`); a message
  that vanished is an unknown, and treating an unknown as `'same'` is the
  conservative choice - it never manufactures an unanswered-and-changed
  confirmation from missing data.
- Cleanup performed / retained artifacts: none. `tools/tg-preview/
  state.json` (untracked, the owner's `cc19` entry) and `.env` (gitignored,
  the owner's session) left exactly as found - neither was read, printed,
  or modified.
- Session end partial progress: none - B3 is complete at a committed
  boundary.
