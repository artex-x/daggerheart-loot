# Handoff - TASK persist-4b-requests-polish
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (`B4b.1` built and committed; batch review,
  the orchestrator's golden shards and sweeps pending)
- Last agent: implementer (2026-09-30)
- NEEDS_HUMAN_CONFIRMATION: no
- Plan review: not required (`plan.md` Status).
- Branch: `main`
- Base / starting commit: `a6503c49` (R6 closed and pushed)
- Pushed: no

## Completed
- Batch name/id: `B4b.1` - requests polish and the roll-tab fix.
- What shipped:
  - Item 5: `App.svelte` keys `RollPanel` on `app.route.section`; the
    proving test `roll.test.ts`, "switching between two tables", failed
    before the fix (field "25") and passes after it.
  - Item 1: a send keeps the ticks and counts; `RequestSender` keeps the
    sent key (`isSent`), guards `send()` and `afterAdd()`, `dismiss()`
    clears it; `SelBar` reads «Запрос отправлен», disabled; the `clearSel`
    hook is gone. `AppState.keepTicksIn` prunes the shared page's ticks to
    the drawn list (`SharedListPage` effect, under `untrack`).
  - Item 3: `PickQty` is one joined control «Мин» - count - «Макс» (the
    owner's naming change of 2026-09-30; `plan.md` Status), 30 px tall,
    36 px with 44 px ends at 600 px or less; both list pages pass it.
  - Item 2: `DecidedRequest.lines`, `OwnerRequests.forget`; the fold lists
    each decided request's items and has «Скрыть» with the focus rule.
  - Item 4: `FEATURES.md` "Limits" says "sent to any list"; no
    `supabase/` change.
  - Specs: `FEATURES.md` (Rolling, Lists take line, shared page, the send,
    flow b, the owner, Limits), `STATE.md` (UI and Lists rows),
    `COVERAGE.md` (rows for `app/states` case 55, requests, the two test
    files). Decisions: four new files, both pointer directions,
    `docs/DECISIONS.md` rebuilt (170 decisions).
  - Browser suites: inventory states `#/s/player-token-1 ~ sent` and
    `SHOP ~ decided as gm1` with goldens; `states.js` case 55 rewritten.
- Previous sha (batch diff base): `a6503c49`
- Deviations and rationale:
  - The ends read «Мин»/«Макс» per the owner (context.md, "Owner input on
    the joined control"). Their accessible names start with the visible
    word («Мин, взять 1: <name>», «Макс, взять все: <name>»), so a speech
    user can say what is drawn (WCAG 2.5.3); the plan's names had no «Мин».
  - The roll test sits in its own `describe` at the end of `roll.test.ts`
    and waits with `findByRole` in place of `tick`, so the line citations
    of `roll.test.ts` in `COVERAGE.md` rows `behave` and `qa` stay valid.
  - `keepTicksIn` uses `ids.includes` (the lint rule
    `svelte/prefer-svelte-reactivity` refuses a plain `Set` in state code).
  - The `~ sent` state relies on golden.js's own toast wait; an enter loop
    on `d.text()` let the 1600 ms toast expire.
- Review: not run; required (trigger: changed UI).

## Verification
- Commands run (exact), results:
  - `npx vitest run app/src/components/roll.test.ts` without the
    `App.svelte` change: 1 failed (expected '25' to be '1'); with it: 32
    passed.
  - `npm run build:test`: ok.
  - `rtk node tests/app/golden.js --update "--only=player-token-1 ~ sent"`
    and `"--only=~ decided as gm1"`: each wrote its new golden (1 state).
  - `rtk npm run check`: PASS (74 files, 2405 tests; coverage 98.28 /
    92.54 / 98.9 / 99.04).
  - `rtk node tests/run-all.js app/states`: ok, 272.8 s.
  - `rtk npm run check:built`: ok (default build 144.9 kB of 150 kB).
  - `rtk npm run e2e`: PASS (F0-F13, contract 11 cases).
  - `rtk npm run budget` on the configured build e2e left in `dist/`: FAIL,
    203.0 kB of 200 kB (index 128.2, supabase 56.1, css 15.1, zip 1.6, sw
    2.0). Pre-existing since R6 (CI: 202.1 kB); the next commit's job.
  - Take control measured in `dist-test/` (puppeteer): 141x30 px at 960
    and 1180 px, 141x36 px at 360 px (ends 44 and 47 px; EN 138x36, 44 and
    44 px); at 360 px «Взять», the control and «из N» share one line and
    the sum wraps; no page overflow.
- Not run by the implementer (the orchestrator's): the four golden
  `--update` shards, `sweep.js 360`, `sweep.js 1180`.

## Next batch (implement-ready)
- None in this plan. Next: the orchestrator's golden shards and sweeps,
  then the batch review; then closeout.
- Goldens expected to change in the shards (the take line gains «Мин» and
  «Макс»): `_l_shared_a_row_ticked`, `_l_shared_picked`, `_lists_a_picked`,
  `_lists_a_prices`, `_s_player_token_1_ticked`,
  `_s_player_token_1_notify_question_as_gm2`. No other golden should move.

## Blockers
- None for `B4b.1`. The configured-build budget fails (203.0 kB); the
  orchestrator routes it to a separate `fix(persist)` commit.

## Deferred
- The «Запросы (0)» heading when only decided requests remain (`plan.md`
  section 9).
- The R4b row in `issues/persistent-storage/plan.md` section 12 (the
  orchestrator's file).

## Notes
- Mocks path: `issues/persist-4b-requests-polish/mocks/index.html` (the
  ends read «1»/«Все» there; the owner has seen the «Мин»/«Макс» change).
- Item 4 answer for the owner: clean-up exists (1-hour expiry; each
  accepted send deletes every request of any list answered or expired more
  than 24 hours earlier; list and account deletes cascade); no change.
- Durable items written to their homes this batch: `FEATURES.md`
  (Rolling, Lists, Account and browser lists, Limits), `STATE.md` (the
  in-memory state table), `COVERAGE.md`, `docs/decisions/` (four files and
  two amended pointers), `docs/DECISIONS.md`.
