# Shared task context - TASK persist-7e-list-quick-item

Orchestrator (or first worker) maintains this file so later steps do not re-fetch the same sources.

## Goal
- R7e: two changes to «Свой предмет» on an account list page, from the
  owner's feedback of 2026-10-01 after R7b's push. A small release between
  R7c `persist-7c-homebrew-relations` and R7d `persist-7d-homebrew-files`
  (owner, 2026-10-01).
- The owner reviewed the mocks (`mocks/index.html`) on 2026-10-01 and chose
  e01 and 1A.

## GitHub issue (if any)
- URL: none (a local task id; the owner's request came through the
  orchestrator, 2026-10-01).
- Captured or last verified: 2026-10-01.
- Summary (facts only): the feedback below.
- Decisions already settled: R7's D9
  (`docs/decisions/2026-09-30-a-list-page-makes-a-plain-homebrew-item-in-one-press.md`):
  a name and an optional description make a plain item, then a reference
  entry; no draft mark.
- Open questions: none. `E1` = e01 and `E2` = 1A (owner, 2026-10-01,
  "Owner answers (2026-10-01, mock review)" below).

## Owner feedback of 2026-10-01 (after R7b's push)
Moved here from R7c's `context.md`.
- The «Свой предмет» panel on a list page: after «Добавить в список» makes
  the item, offer a link to edit it (opens the editor `#/homebrew/<key>`,
  possibly in a new tab), for example inside the success toast; the toast
  must then stay long enough to read and click.
- The «Свой предмет» toggle sits among the list actions («Поделиться»
  and others) and reads as a list action; the owner wants item creation
  closer to the list's items (for example beside or under the entries).
- Owner: "maybe later". The release is the owner's pick: R7e, between R7c
  and R7d (orchestrator's message, 2026-10-01).
- Orchestrator's reading of item 1: likely the success toast's action;
  the toast holds longer while it carries an action and pauses on hover
  and focus. Item 2: the toggle leaves the actions row; a «+ Свой предмет»
  row after the last entry opens the same panel there; the empty-list hint
  changes with it.

## Key paths
- `app/src/components/ListPage.svelte` (2202 lines): the toggle
  `span.qtoggle` > `Button` «Свой предмет» inside `<Actions>`, after
  «Поделиться», only when `isCloud && app.homebrew`; state `quick`,
  `quickBtn`, folded when another list opens; the panel `QuickItem` mounted
  under the actions, its `onclose` focuses the toggle; the empty state
  `Empty` with `t.listEmptyHint` plus `t.listEmptyHintOwn` on an account
  list.
- `app/src/components/QuickItem.svelte` (183 lines): two writes in order
  (the item awaited, then the entry through the list buffer), then clears
  the fields, focuses «Название» and says `t.quickAdded`; Enter adds;
  Escape closes.
- `app/src/components/Toast.svelte` and `AppState.say`
  (`state/app.svelte.ts`): durations 1600 ms (notice), 2600 ms (error),
  7000 ms (with an action); an action toast moves focus to its button;
  `ToastAction` is `{ label: Msg; run(): void }`; no pause on hover or
  focus today.
- `app/src/components/Button.svelte`: an `href` opens a new tab with
  `rel="noopener"` unless `sameTab`.
- `app/src/lib/hash.ts` `homebrewItemHash(key)`: the editor route.
- `app/src/lib/dict.ts`: `quickOwn` «Свой предмет», `quickHead`,
  `quickNote`, `quickAdded` «Предмет «%s» добавлен в список»,
  `quickFailed`, `listEmptyHint`, `listEmptyHintOwn` «Или добавьте свой
  предмет кнопкой «Свой предмет».», `edit` «Изменить».
- Specs: `docs/specs/FEATURES.md` "Account and browser lists", the item
  «Свой предмет» (and the toast rule in the accessibility list);
  `COVERAGE.md`, the own-items row.
- Tests: `components/quickItem.test.ts`, `listPage.test.ts`,
  `a11y.test.ts`; `tests/app/inventory.js` states `#/lists/<uuid(101)> as
  gm1`, `~ own item`, `~ own item added` (timed), `~ own item refused`,
  `#/lists/<uuid(201)> as gm2`; `tests/e2e/flows.mjs` F15 presses
  «Свой предмет».
- Seed: gm1 holds «Лавка кузнеца» `uuid(101)` (10 entries), «Пустой
  список» `uuid(102)` (no entries, no golden state yet) and «Трофеи»
  `uuid(103)`.
- 13 goldens draw an account list (`_lists_00000000_0000_4000_8000_*`);
  every one draws the actions row, so moving the toggle moves all 13.

- Toast facts (planner, 2026-10-01): `Toast.svelte` focuses `.toast-act`
  keyed on the action's `run` (a link action with no `run` takes no
  focus); `AppState.say` sets one `setTimeout` per toast and none on a
  clock with `holdsToasts` (the golden build); `.toast` is `position:
  fixed; left: 50%`, so it wraps at half the window width. Toast tests:
  `state/app.test.ts` "the toast", `components/shell.test.ts` "the toast
  component, directly"; `tests/app/states.js` case 32 (undo toast in the
  record dialog).
- `lib/hash.ts` `homebrewItemHash(key)`; a fragment-only `href` keeps the
  page's query, so the test build's `?as=gm1` survives into the new tab.
- `ImportPanel`'s «Отмена» closes the panel; `QuickItem`'s «Закрыть» keeps
  the typed text (R7f, audit #12, owns that wording).
- The consistency audit (`consistency-audit.md`) placed every finding in
  R7f `persist-7f-consistency`; R7e keeps only `E1` and `E2` (owner). R7f
  later rewords `quickAdded` (audit #5); R7e keeps today's text.

## Command costs
As in `issues/persist-7c-homebrew-relations/context.md`, "Command costs"
(`.claude/README.md`, "Batch size and the fixed cost of a run").

## Constraints
- Every new text has RU and EN; every toast is a `Msg`; nothing of homebrew
  goes to `localStorage` or `sessionStorage`.
- The add row's dashed border is an "add" affordance, not the homebrew
  marker (the owner rejected dashed borders as the marker, `Q5` of R7); the
  owner may ask for a solid row.

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
- You suspect drift vs issue or plan

## Owner answers (2026-10-01, mock review)
- E1: e01 - «+ Свой предмет» is a row after the last entry; the panel opens
  there and a new item lands right above it.
- E2: 1A - «Изменить» on the success toast (opens `#/homebrew/<key>` in a
  new tab), the toast held 7000 ms and paused on hover and focus, never
  taking focus. Owner's reason: consistency with the current design
  matters most to them.
- Consistency: a read-only audit of the signed-in pages runs now; its small
  fixes join R7e (which already touches the list page), the larger ones the
  owner places. The owner's example: «Мои предметы: 3 из 100» on
  `#/homebrew`, no counter on «Мои списки» (`#/lists`).
- The mocks are copied into `mocks/` (owner allowed it).

## Owner answers on the consistency audit (2026-10-01)
- Report: `consistency-audit.md` in this directory (15 findings).
- Placement: a separate consistency release right after R7e (working id
  `persist-7f-consistency`); R7e keeps only E1 and E2.
- #9: one create verb everywhere; the Sources panel stays above the items
  on «Мои предметы» (no move).
- #10: keep batch-only delete for homebrew rows, as the spec says.
- #13 (share naming): left to R10, which deletes browser lists and the «Ссылка себе» / «Ссылка игрокам» labels; R10 checks that only «для игроков» / «для мастера» remain.
