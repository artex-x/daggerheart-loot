# Plan - TASK persist-7e-list-quick-item (release R7e)

## Status

- Task status: planned; `B7e.1` is implement-ready (section 6). The owner
  answered the mock review on 2026-10-01: `E1` = e01, `E2` = 1A
  ("consistency with the current design matters most").
- NEEDS_HUMAN_CONFIRMATION: no.
- Plan review: not required (no trigger fired)
- Release order (owner, 2026-10-01): R7c `persist-7c-homebrew-relations`,
  R7e, R7f `persist-7f-consistency`, then R7d `persist-7d-homebrew-files`.
  R7e starts after R7c's closeout; it holds no file of R7c's batches except
  `dict.ts`.
- Scope (owner): R7e keeps only `E1` and `E2`. The consistency audit's
  findings (`consistency-audit.md`) go to R7f, including the rewording of
  `quickAdded` (audit #5) and «Закрыть»/«Отмена» (#12).
- Mocks: `mocks/index.html`; the approved pages are `mocks/e01-add-row.html`
  (all four states) and `mocks/e02-edit-link.html`, frame "1A". The 1B
  frames of e02 and all of `e03-add-row-top.html` show rejected variants.
- Batches:

| Batch | Goal | Status |
|---|---|---|
| `B7e.1` | «+ Свой предмет» as a row after the entries; «Изменить» on the success toast | implement-ready |

## 1. Objective

The owner's feedback of 2026-10-01 (`context.md`): move item creation
next to the list's entries, and after «Добавить в список» makes an item,
offer «Изменить», which opens its editor `#/homebrew/<key>` in a new tab.

## 2. Current behaviour (`FEATURES.md` "Account and browser lists", «Свой предмет»)

- On an account list a toggle «Свой предмет» sits in the actions row
  after «Поделиться»; the panel opens under the actions.
- «Добавить в список» makes the item, adds a reference entry at the end of
  the list, clears the fields, focuses «Название» and toasts «Предмет «%s»
  добавлен в список» for 1600 ms. Escape closes the panel and focuses the
  toggle.
- An empty account list's hint ends with «Или добавьте свой предмет
  кнопкой «Свой предмет».».
- A toast with an action (today only an undo) lasts 7000 ms and moves focus
  to its button; nothing pauses its clock.

## 3. Design (owner-approved)

### 3.1 The add row (`E1` = e01)

- The toggle leaves the actions row. After the last entry, outside the
  entries' `div.rows`, a button row «+ Свой предмет» opens the existing
  `QuickItem` panel directly under itself. A new entry goes to the end of
  the list, so it lands right above the row.
- The row: a `<button type="button" class="addrow">` with `<Icon
  name="plus" />`, the text «Свой предмет» (`t.quickOwn`), on a window of
  600 px and more a grey hint «название и описание, остальное потом в
  редакторе» (`t.quickRowHint`, `aria-hidden="true"`: the panel's note
  says the same), and the caret. `aria-expanded={quick}`. Its accessible
  name stays «Свой предмет» (F15 and the inventory press it by name).
- Look: the list row's box (`.row` in `ListPage.svelte`: `border-radius:
  11px`, `width: 100%`), a `1px dashed var(--line2)` border, a transparent
  background, the text in `var(--gold-soft)`, at least 48 px high; pressed,
  the border is `solid var(--gold)`. The dashed border is the "add"
  affordance, not the homebrew marker (that marker has no dashes, `Q5`).
- Pressed, the row stays as the toggle and the panel opens under it.
  Escape and «Закрыть» fold the panel and focus the row; the panel folds
  when another list opens (today's `quick` effect).
- An empty account list draws the `Empty` hint and the same row under it;
  the hint's last sentence becomes «Свой предмет можно создать здесь же,
  кнопкой ниже.» / "You can also make an item of your own here, with the
  button below." (`listEmptyHintOwn`).
- The row shows where the toggle showed: `isCloud && app.homebrew` (a
  browser list never holds a homebrew entry).

### 3.2 «Изменить» on the toast (`E2` = 1A)

- After a successful add, `QuickItem` says today's text (`quickAdded`)
  with an action: the link «Изменить» (`t.edit`) to
  `homebrewItemHash(key)`, opened in a new tab (`target="_blank"
  rel="noopener"`). A press hides the toast; the link opens as any link.
- A toast with an action lasts 7000 ms (unchanged). New: its clock pauses
  while the pointer is over it or focus is inside it, and runs on with the
  time it had left when both end. A toast with no action keeps its 1600 ms
  or 2600 ms and never pauses (a resting pointer must not hold a notice in
  the browser suites).
- A link action never takes focus: focus stays in «Название» for the next
  item. An undo still takes focus, as `FEATURES.md` says. A keyboard user
  reaches the editor through the new row's record («Изменить» in its
  dialog) as today.
- `ToastAction` becomes a union: `{ label: Msg; run: () => void }` or
  `{ label: Msg; href: string }`; `Toast` carries `action?: { label:
  string; run?: () => void; href?: string }`. `Toast.svelte` draws an
  `href` action as `<a class="toast-act" href target="_blank"
  rel="noopener" onclick={() => app.hideToast()}>`; its focus effect is
  keyed on `run`, so a link action moves no focus with no change to that
  effect.

## 4. Scope and non-goals

- In scope: `ListPage.svelte`, `QuickItem.svelte`, `Toast.svelte`,
  `state/app.svelte.ts` (`ToastAction`, `Toast`, `say`, the pause),
  `dict.ts` (two keys), `FEATURES.md`, `COVERAGE.md`, the tests and states
  in section 6, one decision file.
- Non-goals: the wording of `quickAdded` and «Закрыть» (R7f); price and
  quantity in the panel (deferred, no release); browser lists; `#/s/`;
  the record dialog; a pause for toasts with no action.

## 5. Owner answers

| Id | Question | Answer (owner, 2026-10-01) |
|---|---|---|
| `E1` | Where «+ Свой предмет» sits | e01: a row after the last entry, the panel there |
| `E2` | How to reach the editor after an add | 1A: «Изменить» on the success toast, a new tab, 7000 ms, paused on hover and focus, never taking focus |

Rejected, for the decision file: e03 (the row above the first entry: a new
entry lands out of view on a long list); 1B (a line in the panel instead of
the toast: the owner chose the toast for consistency with the current
design).

## 6. `B7e.1` - implement-ready

Objective: sections 3.1 and 3.2, nothing else.

In scope: section 4's files. Out of scope: section 4's non-goals; any
other toast's text or duration; R7c's files.

Behaviour and UI constraints: section 3; mocks `e01-add-row.html` (four
states) and `e02-edit-link.html` frame 1A. Every new text has RU and EN.

Exact text (`dict.ts`, both languages):

| Key | RU | EN |
|---|---|---|
| `quickRowHint` (new) | название и описание, остальное потом в редакторе | a name and a description, the rest later in the editor |
| `listEmptyHintOwn` (changed) | Свой предмет можно создать здесь же, кнопкой ниже. | You can also make an item of your own here, with the button below. |

`quickOwn` («Свой предмет» / "Own item"), `quickAdded` and `edit`
(«Изменить» / "Edit") are reused unchanged.

Files: `app/src/components/{ListPage,QuickItem,Toast}.svelte`;
`app/src/state/app.svelte.ts`; `app/src/lib/dict.ts`;
`app/src/components/{listPage,quickItem,shell,a11y}.test.ts`;
`app/src/state/app.test.ts`; `tests/app/inventory.js` and the goldens it
writes; `docs/specs/FEATURES.md`; `docs/specs/COVERAGE.md`;
one new file under `docs/decisions/` (`<date>-<slug>.md`, the slug as the existing files cut it from the title)
and `docs/DECISIONS.md`.

Steps:

1. `state/app.svelte.ts`: the `ToastAction` union and the `Toast.action`
   shape of 3.2; `say` keeps its durations and records the deadline
   (`env.clock.now() + ms`) for an action toast; a new method
   `holdToast(on: boolean)` stops the timer and keeps the time left when
   `on`, and starts a timer with the time left when not; it does nothing
   for a toast with no action, for no toast, or on a clock that
   `holdsToasts`. `hideToast` clears the kept time. The `toast` derived
   value passes `run` or `href` through.
2. `Toast.svelte`: draw an `href` action as the link of 3.2; keep the
   button for a `run` action. On the toast element, `onpointerenter` /
   `onpointerleave` and `onfocusin` / `onfocusout` keep two local flags,
   and an effect calls `app.holdToast(hover || focused)`. Update the
   header comment (one or two lines: a link action never takes focus; an
   action toast pauses while hovered or focused).
3. `QuickItem.svelte`: after a successful add,
   `app.say((t) => t.quickAdded.replace('%s', shown), { action: { label:
   (t) => t.edit, href: homebrewItemHash(pair.key) } })`; the name field
   keeps focus as today.
4. `ListPage.svelte`: delete the `span.qtoggle` toggle from `<Actions>`;
   after the entries' `div.rows` (and after `Empty` on an empty list) draw
   the row of 3.1 when `isCloud && app.homebrew`, then the `QuickItem`
   panel under it when `quick`; `quickBtn` binds the row; the panel's
   `onclose` focuses the row; the `Empty` text keeps `listEmptyHint` plus
   the new `listEmptyHintOwn`. Scoped CSS for `.addrow` (3.1), the hint
   hidden under 600 px.
5. `dict.ts`: the two keys of the table.
6. `FEATURES.md` "Account and browser lists", «Свой предмет»: the toggle
   sentence becomes "a row «Свой предмет» after the last entry (pressed
   and expanded while open, folded on another list) opens «Свой предмет в
   этот список» under it"; Escape "focuses the row"; the toast sentence
   adds "with «Изменить», which opens the item's editor in a new tab"; the
   empty-list sentence quotes the new `listEmptyHintOwn`. The toast rule
   in the accessibility list (the paragraph that starts "Toasts with an
   undo action"): add "A toast whose action is a link («Изменить» after
   «Свой предмет») lasts 7000 ms too, never takes focus and opens its page
   in a new tab; a toast with an action pauses its clock while the pointer
   is over it or focus is inside it."
7. `COVERAGE.md`, the own-items row: name the add row, the link toast and
   the new state.
8. Tests (titles name the behaviour):
   - `state/app.test.ts` "the toast": "holds an action toast while it is
     hovered or focused and runs on with the time it had left"; "never
     holds a plain notice"; "carries a link action's href".
   - `components/shell.test.ts` "the toast component, directly": "draws a
     link action as a link to its page in a new tab"; "leaves focus where
     it is for a link action"; "hides the toast when its link is pressed";
     "pauses while the pointer is over it".
   - `components/quickItem.test.ts`: the add raises a toast whose action
     is «Изменить» with `href` `#/homebrew/<the new key>`.
   - `components/listPage.test.ts`: no «Свой предмет» in the actions; the
     row follows the last entry with `aria-expanded` false, then true with
     the panel under it; Escape and «Закрыть» focus the row; an empty
     account list draws the hint and the row; a browser list draws no row.
   - `components/a11y.test.ts`: the row closed and open, the empty list,
     the link toast; each ends with `expectNoA11yViolations`.
9. `tests/app/inventory.js`: the `#/lists/<uuid(101)>` states keep their
   ids; rewrite their `why` lines (the actions row has no «Свой предмет»;
   the row after the axe; `~ own item added` shows «Изменить» on the
   toast); add `#/lists/<uuid(102)> as gm1` («Пустой список»: the hint and
   the row).
10. The decision file (title: "The quick item opens under a list's
    entries; its toast links the editor"): Task `persist-7e-list-quick-item`
    (owner's mock review, 2026-10-01); Decision = 3.1 and 3.2 in two
    sentences; Rejected = section 5's two lines; `- Amends "A list page
    makes a plain homebrew item in one press, with no draft mark"
    (2026-09-30): the toggle's place and the toast's link.`, and the mirror
    `- Amended by ...` status line in D9 before its "- Task". Then
    `node tools/decisions.js`.
11. Gates below, in order; stage by path.

Acceptance:

- The actions row of an account list holds no «Свой предмет»; the row
  «Свой предмет» follows the last entry, opens the panel under itself and
  reads `aria-expanded`; Escape and «Закрыть» fold the panel and focus the
  row.
- A new item's entry lands last, right above the row.
- After an add the toast reads «Предмет «%s» добавлен в список» with the
  link «Изменить» to `#/homebrew/<key>` (`target="_blank"`,
  `rel="noopener"`); focus stays in «Название».
- An action toast pauses while hovered or focused and lasts its remaining
  time after; a plain notice and an error never pause; an undo toast still
  takes focus (the existing `shell.test.ts` cases pass unchanged).
- An empty account list draws the hint with the new sentence and the row;
  a browser list draws neither.
- At 360 px the row and the open panel scroll nothing sideways
  (`sweep.js 360`).
- The 13 account-list goldens compare first and move only by the toggle,
  the row and the toast link; they and the new `uuid(102)` state are
  re-seeded on purpose, with the reason in the handoff.
- `npm run e2e` passes: F15 presses «Свой предмет» by name and finds the
  row.
- The decision file and D9's pointer pass `node tools/decisions.js`.
- The bundle budget: `check:built`'s unconfigured figure is recorded; the
  budget rises only if the build passes it.

Gates (one foreground call each):

```text
rtk npm run check                                   (timeout 600000; 8 min)
npm run check:built                                 (2 min)
node tests/run-all.js app/states                    (5 min)
node tests/app/golden.js --only=4000-8000           (compare: about 2 min)
node tests/app/golden.js --only=4000-8000 --update  (re-seed after the compare is read; about 2 min)
node tests/app/sweep.js 360                         (8 min)
npm run e2e                                         (3 min; the test project, no migration)
```

About 30 minutes, plus a closeout of about 10. Review: required after
the batch (new UI). Plan review: not required (no migration, no public
contract, no stored key, no new write or sync protocol). Split criterion:
none - one route set (`#/lists/<id>`) and one component pair.

Risks and do-nots:

- Pause only toasts with an action: a plain notice held by a resting
  pointer would break the timed goldens and `states.js`.
- Leave the undo focus rule as it is; the link action must not take focus.
- Leave `quickAdded`'s text and «Закрыть» as they are (R7f owns them).
- The `?as=` query of the test build stays in a fragment-only `href`.
- Stage by path; never `git add -A`.
- Fallback: none.
