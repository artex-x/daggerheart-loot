# Handoff - TASK tg-preview-refresh

Recovery state for the next session. Read `CLAUDE.md`, then
`issues/tg-preview-refresh/context.md`, then `plan.md`, then this file.

## Status
- Task status: **B1 implemented and committed.** Both owner questions were
  answered before dispatch (see `context.md`); the design in `plan.md` was
  followed as written, with a handful of small gaps filled in during
  implementation - see "Deviations" below.
- Last agent: implementer (2026-09-11), batch B1.
- NEEDS_HUMAN_CONFIRMATION: no.
- Branch: `automation/tg-preview-refresh`, in the dedicated worktree
  `E:/dev/daggerheart-loot-wt/tg-preview-refresh`, based on `8b96ff4`.
  **Not merged, not pushed** - pushing and merging are the owner's call
  (`CLAUDE.md`), and merging should wait for issue 47's B7 to land in the
  main checkout, per the original dispatch note in `context.md`.
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

## Next batch
- Name: **O1 - the owner's operations** (`plan.md` section 9, `docs/tg-preview.md`
  "Setup, start to finish"), not a code batch. No agent can perform any of
  it - it needs a phone, a Telegram login, and repository settings. Steps
  A-J: the throwaway account, `my.telegram.org` credentials, saying hello to
  the bot by hand, `npm ci` + `login.mjs` + dry runs locally, the first real
  message (and the regression check that already-posted messages update -
  `docs/tg-preview.md` step F.4), the full reindex, the three repository
  secrets, the first CI dispatch.
- After O1 produces evidence: **B2 - tuning from the first real run**
  (`plan.md` section 10, outline only) - whether ten links per message are
  honoured, the bot's real flood behaviour, its reply vocabulary. May turn
  out to be empty if the constants already hold.
- Before either: **merge `automation/tg-preview-refresh` into `main`**, the
  owner's call, and per the original dispatch note this should wait until
  issue 47's B7 (the print slice) lands in the main checkout - this branch
  and B7 never touched the same files, so ordering is about not complicating
  the merge, not about a real conflict.

## Blockers
- None for B1 itself.
- The branch is not merged and not pushed - `main` gains nothing from this
  batch until the owner merges it (see "Next batch").
- O1 cannot start until the owner has a phone number free for the throwaway
  account (`docs/tg-preview.md`, step A.1) - no timeline is recorded.

## Deferred
- B2 - tuning from the first real run; may be empty.
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
