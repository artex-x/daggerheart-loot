# Shared task context - TASK persist-4b-requests-polish

## Goal
A small release after R6: the owner's feedback on R4's purchase requests
(four items) and one roll-page bug. Planned 2026-09-29 (`plan.md`,
`handoff.md`, `mocks/`). Slot: after
R6 closes, before R7 (R7 waits on the owner's mock review).

## Sources (read, do not re-fetch)
- R4 as shipped: commit `88c9f8bc` ("send and answer purchase requests on
  share links"); `docs/specs/FEATURES.md` (requests), `docs/decisions/`
  (R4's files), `issues/persistent-storage/plan.md` section 12 row
  `B4.1`-`B4.2`.
- R6 as shipped (`885d2978` plus its closeout commit): the `BatchBar`,
  `SelBar` and list page selection it touched.

## Owner input, 2026-09-29 (verbatim, typos kept)

Requests:

> I don't like much that selection disappears after we send notification.
> I might need to still write them to my inventory physicially, copy or
> print or do smth, can we leave selection?
>
> regarding history it doesn't feel so useful. can we either provide more
> insights e.g. what were the items and allow to close this pannel because
> now to get rid of it I need to reload the page because it clutters the UI
>
> also, regarding the flow of this item, when selecting specific quantity
> of items, can we support selecting min max? I guess it will improve UI UX
> especially on mobile phones where typing is not that easy
>
> do we have these request clean ups? do we need tghem?

Bug:

> roll result stays between tabs switch
> to reproduce: go to dragon's vault
> type 105, press enter
> make sure 105 item is displayed
> switch tab to dread
> see that the same 105 is displayed, nothing is rendered

## The items, as the orchestrator reads them (not decided)
1. Keep the record selection after a purchase request is sent, so the
   player can still copy, print or otherwise use it.
2. The request history panel: show which items each request held, and let
   the user close the panel without a reload.
3. The quantity control in the request flow: a min/max affordance (for
   example steppers or "max" buttons) so a phone user need not type.
4. Request cleanup: does old request data get removed (rows, limits,
   retention)? Answer from the shipped schema and specs; propose one only
   if needed, and name the cost.
5. Bug: a roll result entered on one roll tab (Dragon's Vault, number
   105) stays drawn after a switch to another roll tab (Dread). Expected:
   the switch clears or re-evaluates the result for the new table.
   The planner confirms the cause from code and the route/state specs
   (`ROUTES.md`, `STATE.md`) and adds a `tests/app/inventory.js` state or
   a unit test that fails before the fix.

## Key paths
- Specs: `docs/specs/FEATURES.md`, `STATE.md`, `ROUTES.md`, `COVERAGE.md`.
- Code: `app/src/components/SelBar.svelte`, `RequestsPanel.svelte` and the
  request send flow (R4), the roll page components (search `roll` under
  `app/src/components/` and `app/src/lib/`).

## Command costs
As `issues/persist-6-import-export/context.md` "Command costs" (measured
2026-09-26/27 on this host).

## Constraints
- Owner memory: confirm any user-visible feature a plan drops for cleaner
  code.
- Mocks first: the owner reviews mocks of every changed screen (960 px and
  360 px) before any implement batch, as for R4 and R6 - waived for this
  release by the owner instruction of 2026-09-29 below; the mocks are the
  design record.
- If item 4 needs a migration, the plan review rule applies.

## Settled in planning pass 1 (2026-09-29)
- One batch `B4b.1`, implement-ready (`plan.md` section 7); plan review
  not required; batch review required (changed UI).
- Choices C0-C4 (`plan.md` section 8), made by the planner under the
  owner's waiver: the mocks are the built design; «1» and «Все» on the take
  line (the stepper rejected); the send button disabled while the sent
  ticks stay; the decided fold lists items and has «Скрыть» (page load
  only); a roll mode restarts at row 1 on each visit.
- Item 4: no change; the housekeeping delete in `create_purchase_request`
  is global (any list), on each accepted send; `FEATURES.md` "Limits" gets
  "to any list".
- Item 5 cause: `App.svelte`'s `{#if cfg}` branch keeps one `RollPanel`
  for `roll/wondrous`, `roll/dread`, `roll/dv`; its `n` survives the
  switch. Fix `{#key app.route.section}`; proving test in
  `app/src/components/roll.test.ts`.
- A kept selection exposes a pre-existing defect: a ticked entry the
  shared list no longer holds stays in `app.sel`; `B4b.1` prunes it.

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need

## Owner instruction, 2026-09-29 (verbatim)
> I will be afk, so make sure to finish import export release, 4b polish
> and release and then replan homebrew items, but for that record updated
> mocks and questions and do not ask anything from me, I will continue
> with it tomorrow from a different session

Read for this task: the owner waives the mock review for 4b and asks for
it to ship. The planner answers its own owner questions with its
recommendation and records each choice in `plan.md`; the mocks stay in
`mocks/` as the design record. A user-visible feature drop is still
recorded as a question in the closeout summary, not made silently.

## Owner input on the mocks (2026-09-30, verbatim)
> 1 Все feel a bit detached from the current selector of quantity
> expecially on large screens, is it something we can address?

## Owner input on the joined control (2026-09-30, verbatim)
> should we name them min and max,? now there are too many numbers like 1
> 3 все i feel lost

Settled (orchestrator, on the owner's suggestion): the two ends read
«Мин» and «Макс» (EN "Min" and "Max") instead of «1» and «Все». The
shape, the behaviour and the accessible names stay as planned: «Мин» sets
the count to 1, «Макс» to all that are left.

## CI failure after R6's push (2026-09-30, run 36638258244)
- `e2e` job, step "Bundle size budget (the configured build e2e left in
  dist/)": `npm run budget` 202.1 kB of 200 kB (index 127.5 kB, supabase
  56.1 kB, css 14.9 kB, zip 1.6 kB, sw 2.0 kB). Local gates did not run
  the budget on the configured build.
- `audit` job: `undici` 8.0.0 - 8.10.1, high severity, fix via
  `npm audit fix`.
- `deploy` and `migrate-prod` skipped: production still runs R4.
- Fix route (orchestrator): after `B4b.1` commits, two separate commits by
  the same writer - load `ImportPanel` by dynamic `import()` (the
  `lib/zip.ts` precedent) so the configured build fits 200 kB with 4b's
  bytes; and `npm audit fix`. No budget raise without the owner.
