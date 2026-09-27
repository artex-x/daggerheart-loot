# Shared task context - TASK persist-4-requests

## Goal
Release R4: purchase requests from a shared list to its owner - anonymous
"Notify the owner", the signed-in "add to my list, notify the GM" flow,
the owner's Requests panel, apply and decline, requester status. Batches
`B4.1`, `B4.2` in the roadmap; they may change.

Planned ahead (2026-09-25) while R2's last batch is being built; R4 ships
after R5 and R3. Design level plus owner questions now; the implement-ready
steps get a refresh before the build.

## Sources (read, do not re-fetch)
- Roadmap `issues/persistent-storage/plan.md`: sections 3, 5, 9, 12, 14
  (R4 rows and outlines), section 16 (the purchase-request block: owner
  answers (1) and (2), questions 32-38 and "Answers to 32-38, owner,
  2026-09-24"), section 17 (risk: `create_purchase_request` is the first
  RPC `anon` can write through; privacy impact of a stored requester name).
- `issues/persistent-storage/context.md`: the limits amendment (R4's lines
  per request and pending requests per list are rows in `limit_defaults`;
  the rate of 5 per link per minute and the 1-hour expiry stay constants -
  check against the answer to 36, which says 14-day expiry, and raise the
  conflict).
- R2's task `issues/persist-2-lists/`: `context.md` (owner answers,
  including: rotate dropped - a link is deleted, then created), `plan.md`
  sections 4.2, 4.4, 11 (shares, tokens, `get_shared_list`, the poll).
- `docs/decisions/` (one file per decision).

## State
- Pass 2 (2026-09-27): R2, R5, R5b, `process-guards`, R11 and
  `display-settings` are shipped. R3's `B3.1` (the database half) is in
  `1cbca5f7`; R3's `B3.2` (the client half) is being built on `main` and
  is not in this plan's base. R4 is dispatched after R3's closeout push
  and before R6.

## Facts settled by the planner, pass 1 (2026-09-26, worktree at `c39f3de1`)
- R3's owner questions answered yes (owner, 2026-09-26, through the
  orchestrator): Q1 the owner's devices join `owner:<uid>`; Q2 Realtime
  "Allow public access" off after `B3.2`; Q3 a 5-minute safety re-read
  while live. R4 builds on Q1 = yes only.
- The expiry "conflict" in this file's Sources line is not one: the
  owner's answer to 36 and the limits amendment both say 1 hour; the
  14 days was the planner's recommendation 36 and roadmap text written
  before the answer (sections 5, 14, 17), rewritten in this pass.
- The answer to 36 removes the requester name field, so there is no name
  bound and no stored name to describe; a request also stores no
  requester account id (plan section 5.1).
- `regprocedure` prints `create_purchase_request(uuid,text,jsonb)`
  (pass 3 signature) with no space; `harness.test.mjs` compares that exact text.
- `tests/db/limits.test.mjs` asserts the exact `limit_defaults` rows, so
  `B4.1` updates it to four keys.

## Owner input after R5b (2026-09-27, through the orchestrator)
- R5b's Display row «Сообщать владельцу списка» / "Notify the list owner"
  reads as unclear: it answers a question nobody sees until flow b ships.
  `B4.2` rewords it, since that batch makes the setting work and re-seeds
  the `#/account` golden: label «Добавление из чужого списка», options
  «Спрашивать» / «Сообщать владельцу» / «Не сообщать» (the section 13
  option A wording), and optionally a hint line «Когда вы добавляете
  предметы из чужого списка в свой, сообщить об этом его владельцу?».
  English to match. Touches `dict.ts` (`displayNotify`, `notifyAlways`,
  `notifyNever`), `FEATURES.md` "Account", `accountPage.test.ts`.
- The task `display-settings` (planned 2026-09-27, slot after R11 and
  before R3) lands first. Its `B1` adds a lead line to the Display section
  and a note line on the print and tables pages, and leaves the notify row
  and its keys unchanged. `B4.2`'s refresh re-reads `FEATURES.md`
  "Account", `accountPage.test.ts` and the `#/account as gm1` golden after
  that batch.

## Owner input on the mocks (2026-09-27, through the orchestrator)
- Feedback, verbatim: "for the requester's status block maybe we can get
  rid of this section or reduce time when it is displayed, as a player I
  would not care much, it is more relevant for DM to keep their list
  up-to-date". Planner's reading (pass 2): remove the block (plan section
  13, item 3; decision "A requester sees no request status; the send
  toast is the only answer").
- Answer to plan section 13, question 2: "A - a select at every width, as
  the «Раздел при запуске» row, with the owner's wording word for word."
- Request (verbatim in part): "for both R4 and R6 I'd love to see mocks"
  - pass 2 added `mocks/`.

## Mocks approved
- 2026-09-27, owner: "r4 mocks lgtm" - the set in `mocks/` at `b642493f`
  (no requester status block; the Display notify row as a select).

## Facts settled by the planner, pass 2 (2026-09-27, worktree at `1cbca5f7`)
- R3's shipped database half (`supabase/migrations/20260927120000_realtime.sql`):
  the owner topic's event is `list` with `{ list, revision, by }`; the
  share topic's event is `revision` with `{ revision }`. `by` is parsed
  inline in `lists_broadcast()` (no helper function): `nullif(current_setting('request.headers',
  true), '')`, a `jsonb` cast inside its own `begin ... exception when
  others` block, kept only when it matches `^[A-Za-z0-9-]{1,40}$`. Every
  send sits in a block that turns an error into `raise warning`.
- R3's `B3.2` readers accept only their own event names
  (`readShareMessage`: `revision`; `readOwnerMessage`: `list`), so an R4
  `request` event is dropped by a client without R4's code. `B4.1` can
  reach the test project before `B4.2` without a client effect.
- R3 pass 3, S4: the owner feed runs for the whole signed-in session on
  every route, not only on the lists pages.
- The owner's apply runs with the owner tab's `x-dhloot-tab` header, so
  R3's `lists_broadcast` message for it carries the tab's own `by` and
  `CloudLists` ignores it as an echo: the owner client re-reads its lists
  itself after an apply.
- `tests/db/usage.test.mjs` pins the exact list of `public` tables
  (`PUBLIC_TABLES`), and `tests/db/restore-drill.test.mjs` pins the seed
  `limit_defaults` after a reset (`['entries_per_list=100',
  'lists_per_owner=50']`): both change in `B4.1`.
- `docs/specs/COVERAGE.md`'s `tests/db/` paragraph names "the one listed
  exception, `get_shared_list(text)`" and "the two defaults": both change
  in `B4.1`.
- Signed-in `#/account` goldens that draw the notify row: `#/account as
  gm1`, `#/account as gm2`, `#/account ~ pinned table as gm2`, `#/account
  ~ delete confirmation as gm1` (`tests/app/snapshots/_account_*`).
- The notify row today: `AccountPage.svelte`, the fifth `.set` row of the
  Display section, `Seg` over `notifyAsk` / `notifyAlways` /
  `notifyNever`, label `displayNotify`; `accountPage.test.ts` names it by
  «Сообщать владельцу списка», «Всегда», «Никогда» and the English group
  "Notify the list owner".

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
