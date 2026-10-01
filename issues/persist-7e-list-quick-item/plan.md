# Plan - TASK persist-7e-list-quick-item (release R7e)

## Status

- Task status: planned; `B7e.1` is implement-ready (section 6). Refreshed
  2026-10-01 at HEAD `bb37a572` (R7c's unpushed task commit) while R7c's
  `B7c.4` is in the working tree: the owner's scale line F5 joined the
  batch, the four standing checks are answered, and the files shared with
  `B7c.4` are named (section 6, "Re-check at dispatch").
- NEEDS_HUMAN_CONFIRMATION: no. One owner question does not block the
  batch: where the paging half of F5 goes (handoff, "Deferred").
- Plan review: not required (no trigger fired)
- Release order (owner, 2026-10-01): R7c `persist-7c-homebrew-relations`,
  R7e, R7f `persist-7f-consistency`, then R7d `persist-7d-homebrew-files`.
  R7e dispatches after R7c's closeout is pushed.
- Scope (owner): `E1` and `E2` (the mock review) and F5 (the scale
  challenge, "Placement"). The consistency audit's findings
  (`consistency-audit.md`) go to R7f, including the rewording of
  `quickAdded` (audit #5) and «Закрыть»/«Отмена» (#12). The quick item's
  orphan item at a full list (F9) is R7f's; R7e only names the overlap.
- Mocks: `mocks/index.html`; the approved pages are `mocks/e01-add-row.html`
  (all four states) and `mocks/e02-edit-link.html`, frame "1A". The 1B
  frames of e02 and all of `e03-add-row-top.html` show rejected variants.
- Batches:

| Batch | Goal | Status |
|---|---|---|
| `B7e.1` | «+ Свой предмет» as a row after the entries; «Изменить» on the success toast; a row's note box drawn only when open or filled (F5) | implement-ready |

## 1. Objective

The owner's feedback of 2026-10-01 (`context.md`): move item creation
next to the list's entries, and after «Добавить в список» makes an item,
offer «Изменить», which opens its editor `#/homebrew/<key>` in a new tab.
The owner's scale placement adds F5: a list page with many entries keeps
two hidden textareas per row and re-walks every textarea on each keystroke.

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
- Every list row draws `<div class="rnote" hidden=...>` with two textareas,
  noted or not (`ListPage.svelte`, the `{#each items}` block). An effect
  keyed on `items` runs `autoSize` over every `.lnote textarea, .rnote
  textarea` in the document after each edit, so each quantity, price or
  note keystroke walks all of them (verified 2026-10-01: the effect after
  the drag binding, about lines 766-777; the box about line 1367).

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
  effect. The link takes the button's look (`.toast-act`) plus
  `text-decoration: none`.

### 3.3 A row's note box (F5, owner's scale placement)

- A row draws `.rnote` only when `boxHidden(id, meta)` is false: `{#if
  !boxHidden(it.id, m)}<div class="rnote">...</div>{/if}`. The predicate
  is unchanged, so the screen is unchanged: a box shows when the entry has
  a note or the person opened it, and goes when both notes are empty and
  the person did not open it, as the `hidden` attribute did.
- The `items` effect that walks every note textarea goes. Each textarea
  sizes itself instead: once at mount (after `tick()`, so it is in the
  document), again when `seedText` writes another tab's text into it, and
  on its own input (`noteInput`, as today). The list's note fold
  (`details.lnote`) sizes its two textareas on `ontoggle` when it opens,
  so text that arrived while it was closed still fits.
- A hand-resized box keeps its height across a fold and an unfold, as the
  hidden box did: a plain `Map` in the component, keyed `<key>:<kind>`
  (`key` is the entry id or `list`), records the height that the
  pointer-up handler marks `manual`; a mounting textarea with a recorded
  height takes it and the `manual` flag instead of auto-sizing. Memory
  only; it clears with the page.
- Two handlers read the box from the DOM and change with it:
  - `toggleNote` finds `.rnote` after `tick()` (the box does not exist
    before the open), then focuses its first textarea.
  - `clearNote` takes `key` and `kind`; its undo writes the held text
    through the store (`setNote` for `list`, `setMeta` trimmed for an
    entry, on the store and list id captured at the press), never through
    the textarea. Reason: clearing the only note of a box that is shown by
    default unmounts the box, and an `input` event dispatched on a detached
    textarea reaches no handler (Svelte delegates `input` to the root), so
    the old undo would restore nothing.
- No golden moves for F5: the goldens are accessibility trees, and a hidden
  box is not in the tree.

## 4. Scope and non-goals

- In scope: `ListPage.svelte`, `QuickItem.svelte`, `Toast.svelte`,
  `state/app.svelte.ts` (`ToastAction`, `Toast`, `say`, the pause),
  `dict.ts` (two keys), `FEATURES.md`, `COVERAGE.md`, the tests, states and
  sweep pages in section 6, one decision file.
- Non-goals: the wording of `quickAdded` and «Закрыть» (R7f); the
  list-full pre-check and the orphan item (F9, R7f); the entry counter
  «из 100» (R7f, audit #1); `overflow-wrap` on the toast (F14, R7f);
  paging of list rows (the paging half of F5, unplaced: handoff
  "Deferred"); price and quantity in the panel (deferred, no release);
  browser lists' look; `#/s/`; the record dialog; a pause for toasts with
  no action.

## 5. Owner answers

| Id | Question | Answer (owner, 2026-10-01) |
|---|---|---|
| `E1` | Where «+ Свой предмет» sits | e01: a row after the last entry, the panel there |
| `E2` | How to reach the editor after an add | 1A: «Изменить» on the success toast, a new tab, 7000 ms, paused on hover and focus, never taking focus |
| F5 | Scale challenge placement | R7e: a row's note box only when open or filled; no re-walk per keystroke |

Rejected, for the decision file: e03 (the row above the first entry: a new
entry lands out of view on a long list); 1B (a line in the panel instead of
the toast: the owner chose the toast for consistency with the current
design).

## 6. `B7e.1` - implement-ready

Objective: sections 3.1, 3.2 and 3.3, nothing else.

In scope: section 4's files. Out of scope: section 4's non-goals; any
other toast's text or duration; R7c's files except those named under
"Re-check at dispatch".

Behaviour and UI constraints: section 3; mocks `e01-add-row.html` (four
states) and `e02-edit-link.html` frame 1A. Every new text has RU and EN.

### Re-check at dispatch (files shared with R7c's `B7c.4`)

R7c's `B7c.4` is implemented now and amends `bb37a572`; R7e starts from
R7c's pushed closeout commit. Before step 1, the dispatch re-reads these
files at that commit and re-checks this plan's anchors in them:

| File | `B7c.4` | `B7e.1` |
|---|---|---|
| `app/src/lib/dict.ts` | adds `hbMark`, `relLess` (homebrew block) | adds `quickRowHint`, changes `listEmptyHintOwn` |
| `docs/specs/FEATURES.md` | "Records", "Tables and search", "Homebrew" | "Account and browser lists", the accessibility toast paragraph |
| `docs/specs/COVERAGE.md` | its rows for relations | the own-items row, the list notes |
| `tests/app/inventory.js`, `tests/app/snapshots/` | six `as gm3` states; re-seeds `#/tables ~ help` and `~ relations as gm1` | the `#/lists/<uuid(101)>` and `<uuid(201)>` states, a new `<uuid(102)>` state; the compare starts from R7c's pushed goldens |
| `tests/app/sweep.js` | three `gm3` pages | two `gm1` list pages |
| `tests/app/states.js` | case 63 | one new case, the next free number |
| `app/src/ports/fake-cloud-seed.ts` | adds `gm3` | reads gm1's `uuid(101)` and `uuid(102)`, unchanged |
| `app/src/components/RowMain.svelte` | edits the row's relation names | not edited; every list row and list golden draws it |
| `docs/decisions/`, `docs/DECISIONS.md` | rewords D2 in place | a new file; amends D9; both rebuild the index |

### Exact text (`dict.ts`, both languages)

| Key | RU | EN |
|---|---|---|
| `quickRowHint` (new) | название и описание, остальное потом в редакторе | a name and a description, the rest later in the editor |
| `listEmptyHintOwn` (changed) | Свой предмет можно создать здесь же, кнопкой ниже. | You can also make an item of your own here, with the button below. |

`quickOwn` («Свой предмет» / "Own item"), `quickAdded` and `edit`
(«Изменить» / "Edit") are reused unchanged.

### Files

`app/src/components/{ListPage,QuickItem,Toast}.svelte`;
`app/src/state/app.svelte.ts`; `app/src/lib/dict.ts`;
`app/src/components/{listPage,quickItem,shell,a11y}.test.ts`;
`app/src/state/app.test.ts`; `tests/app/inventory.js` and the goldens it
writes; `tests/app/sweep.js`; `tests/app/states.js`;
`docs/specs/FEATURES.md`; `docs/specs/COVERAGE.md`; one new file under
`docs/decisions/` (`<date>-<slug>.md`, the slug as the existing files cut
it from the title) and `docs/DECISIONS.md`.

### Standing checks

1. Scale. States of the account list page (`#/lists/<id>` as gm1). The
   limit is `entries_per_list` = 100; the override value is 5000 entries
   (`FEATURES.md`); the scale report's realistic override is about 1400
   rows (each key once: 1272 catalog records plus own items).

| State | What the screen shows | Proof |
|---|---|---|
| Empty (`uuid(102)` «Пустой список») | The `Empty` hint with the new sentence, then the row, folded | `listPage.test.ts`; new golden `#/lists/<uuid(102)> as gm1`; new sweep page |
| One entry | The entry, then the row; a new item lands second, above the row | `listPage.test.ts` (the row follows the last entry) |
| Many (10, `uuid(101)`) | Entries in list order, the row last, the panel under it when pressed; a box only on a noted or opened row | the 13 account-list goldens; new sweep page; `listPage.test.ts` (box count) |
| At the limit (100) | As many; 100 rows, then the row; 2 textareas only per noted or opened row | `listPage.test.ts` (box count, no walk per keystroke) |
| Past the limit (the 101st by the quick item) | The success toast with «Изменить»; about 2 s later the buffer's refusal replaces it with the limit error toast (`limitText`, 2600 ms); the optimistic entry leaves on the re-read; the item stays in «Мои предметы» | unchanged; F9 (R7f) owns the pre-check and the orphan |
| Override (1400 to 5000) | As at the limit; the row after the last row, reached by scrolling to the end; no paging | `listPage.test.ts` (F5); paging unplaced |
| Longest text (item name 120 code points) | The toast wraps inside half the window width (`.toast` has `left: 50%`); «Изменить» stays inside the viewport; an unbroken name can overflow the toast (F14, R7f) | new states case at 360 |
| 360 px | The row full width, no hint; the open panel stacked under it; nothing scrolls sideways | new states case; `sweep.js 360` (two new pages) |
| 1180 px | The row with its hint; the panel under it | `sweep.js 1180` (two new pages); goldens at 1100 |

   - Row order: the list order; a new entry is last, right above the row.
   - The primary action: the row is the last element of the entries; in
     the open panel «Добавить в список» follows «Название» and «Описание»,
     and Enter in «Название» adds.
   - The panel at 360 with the on-screen keyboard open: about 400 px tall
     (est: the heading, two fields, the buttons, the note). `QuickItem`
     focuses «Название» at mount, and the browser scrolls it into view;
     «Добавить в список» can sit under the keyboard, and Enter adds. The
     new states case proves that «Название» is in the viewport after the
     press at 360x640 (the suite cannot open a keyboard).
   - Sticky regions: the selection bar (`SelBar`, `position: sticky`) has
     its flow position after `main` (`Shell.svelte`), so at the maximum
     scroll the row and the panel sit above it; its price panel can grow,
     unchanged. The new states case proves «Добавить в список» is hit
     through, not covered, with a row ticked at the maximum scroll.
   - The toast: one slot; a later toast replaces the link toast (unchanged,
     the scale report's F14 nit).

2. Error scenarios.

| Scenario | The screen | Stored data | Recovery |
|---|---|---|---|
| Loading (the homebrew store not ready) | The row draws; «Добавить в список» says `hbNotReady` in the panel | nothing written | press again |
| A failed read (the homebrew load failed) | The panel says `hbLoadFailed` | nothing written | reload |
| A failed write (the item refused or at its limit) | The panel line (`limitText` or `quickFailed`), no toast, no entry | nothing; the id pair is kept, so a second press makes one item | press again |
| Offline at the item write | `quickFailed` | nothing; the pair is kept | press again online |
| Offline after the item write | The link toast; the sub «Не сохранено» with «Повторить»; «Изменить» opens the editor (the item exists) | the entry waits in the buffer; a resend sends the queued op, built from the store at the press | «Повторить» or the reconnect |
| Conflict: another tab deleted the list before the entry was sent | The entry is dropped as `gone`; the page leaves the list | the item kept, no entry (an orphan, F9 overlap, R7f) | the item in «Мои предметы» |
| Conflict: another tab edited a note (F5) | An unfocused box takes the text and its size; a box shown by default goes when the other tab empties both notes, as today | the store's value | none needed |
| The record named was deleted (the item deleted elsewhere before «Изменить») | The new tab draws the editor's not-found state | as deleted | none |
| The list is full | See "Past the limit" above | the item kept, the entry refused | R7f's pre-check |
| The clear cross's undo after the box went (F5) | The box comes back with the text | the undo writes the text held at the press, through the store, as today's undo wrote it through the field | none needed |
| A stale tab (the previous bundle) | The toggle in the actions row, the 1600 ms toast | no new stored shape, the same two writes | reload |
| A revert (the previous frontend) | Today's screen | no new stored shape, no migration, no key | none needed |

   No path loses stored data: no write changes its fields or its order,
   and the F5 undo writes the same fields through the same store methods
   as `noteInput`.

3. Consistency. `FEATURES.md` has no "Consistency rules" subsection yet
   (R7f's `B7f.1` adds it); the sibling pages are the reference:
   - One name: «Свой предмет» stays on the row, the panel heading stays
     «Свой предмет в этот список».
   - Counters and limits: unchanged; the list sub gains «из 100» in R7f.
   - Page heads, load, empty and error states: unchanged except the empty
     hint's last sentence.
   - Toasts: the quick toast now carries an action like the undo toasts and
     lasts 7000 ms as every action toast. Departure: it takes no focus,
     where an undo does; reason: focus stays in «Название» for the next
     item (owner, `E2`). Every action toast, the undo ones included, now
     pauses on hover and focus.
   - Confirms and undo: unchanged. Selection bars: unchanged.
   - Button verbs and close labels: «Закрыть» kept (R7f, audit #12).
   - The place of the primary action. Departure: `#/homebrew` («Новый
     предмет») and `#/lists` («Новый список») create from the page head;
     the list page creates from a row after its entries. Reason: a new
     entry lands at the end, right above the row (owner, `E1`; e03
     rejected). R7f's rules should name this exception.
   - The dashed add row is a new pattern; the owner approved it in e01.
4. RU/EN parity: `quickRowHint` and `listEmptyHintOwn` have both
   languages and the same facts; no plural; no new toast text (`quickAdded`
   and `edit` are reused).

### Steps

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
4. `ListPage.svelte`, the row: delete the `span.qtoggle` toggle from
   `<Actions>` and its `.qtoggle` CSS; after the entries' `div.rows` (and
   after `Empty` on an empty list) draw the row of 3.1 when `isCloud &&
   app.homebrew`, then the `QuickItem` panel under it when `quick`;
   `quickBtn` binds the row's button; the panel's `onclose` focuses it;
   the `Empty` text keeps `listEmptyHint` plus the new `listEmptyHintOwn`.
   Scoped CSS for `.addrow` (3.1), the hint hidden under 600 px.
5. `ListPage.svelte`, the note box (3.3):
   - wrap `.rnote` in `{#if !boxHidden(it.id, m)}` and drop its `hidden`;
   - delete the `items` effect that walks `.lnote textarea, .rnote
     textarea`;
   - in `notePair`, give each textarea `data-note="{key}:{kind}"` and a
     mount sizing: after `tick()`, take the recorded hand height and the
     `manual` flag from the map, else `autoSize`; in `seedText`'s `update`,
     call `autoSize(node)` after it writes `.value`;
   - the pointer-up handler records `ta.style.height` in the map under
     `data-note` when it sets `manual`;
   - `details.lnote` gets `ontoggle`: when open, `autoSize` its two
     textareas;
   - `toggleNote`: resolve the row before, and `.rnote` inside it after
     `tick()`; focus its first textarea;
   - `clearNote(key, kind, e)`: the clear as today; the undo writes the
     held text through the store captured at the press (`setNote` for
     `list`, `setMeta` with the trimmed text for an entry).
6. `dict.ts`: the two keys of the table.
7. `FEATURES.md` "Account and browser lists", «Свой предмет»: the toggle
   sentence becomes "a row «Свой предмет» after the last entry (pressed
   and expanded while open, folded on another list) opens «Свой предмет в
   этот список» under it"; Escape "focuses the row"; the toast sentence
   adds "with «Изменить», which opens the item's editor in a new tab"; the
   empty-list sentence quotes the new `listEmptyHintOwn`. The toast rule
   in the accessibility list (the paragraph that starts "Toasts with an
   undo action"): add "A toast whose action is a link («Изменить» after
   «Свой предмет») lasts 7000 ms too, never takes focus and opens its page
   in a new tab; a toast with an action pauses its clock while the pointer
   is over it or focus is inside it." F5 changes no behaviour and no spec
   sentence.
8. `COVERAGE.md`: the own-items row names the add row, the link toast, the
   `uuid(102)` state and the new states case; the row that covers the list
   page's notes names the box-mount tests.
9. Unit tests (titles name the behaviour):
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
   - `components/listPage.test.ts` "a row's note": "draws a note box only
     on a row that has a note or was opened" (`withA()`: one box; «Заметка»
     on `ci1` makes two, again makes one); "puts a cleared note back on
     undo when its box went with it" (an entry with a public note only:
     the cross removes the box, «Вернуть» brings it back with the text);
     "sizes no note box on a keystroke in another field" (spy the
     `offsetParent` getter of `HTMLElement.prototype`; a typed price reads
     it on no textarea). The existing "opens on «Заметка», focuses the
     first textarea" and "clears the box on the cross" cases pass
     unchanged.
   - `components/a11y.test.ts`: the row closed and open, the empty list,
     the link toast; each ends with `expectNoA11yViolations`.
10. `tests/app/inventory.js`: the `#/lists/<uuid(101)>` states keep their
    ids; rewrite their `why` lines (the actions row has no «Свой предмет»;
    the row after the axe; `~ own item added` shows «Изменить» on the
    toast); rewrite the `#/lists/<uuid(201)> as gm2` `why` line (no
    «Свой предмет» after «Поделиться»; the row after the entries); add
    `#/lists/<uuid(102)> as gm1` («Пустой список»: the hint and the row).
11. `tests/app/sweep.js` `PAGES`, the signed-in block: add
    `['#/lists/00000000-0000-4000-8000-000000000101', 'список аккаунта',
    'gm1']` and `['#/lists/00000000-0000-4000-8000-000000000102', 'пустой
    список аккаунта', 'gm1']`. Today no sweep page draws an account list.
12. `tests/app/states.js`, one new case (the next free number after
    R7c's case 63; the signed-in pattern of the existing gm1 cases):
    - at 360x640 as gm1 on `uuid(101)`: scroll to the end, press «Свой
      предмет»: `aria-expanded` true, «Название» inside the viewport, no
      sideways scroll; tick the first row, scroll to the maximum:
      `elementFromPoint` at the centre of «Добавить в список» returns
      that button; type a name of 120 characters with spaces, press
      «Добавить в список»: the toast's «Изменить» box lies inside 0..360;
    - at 1180 on the browser list `a`: open a row's note, mark its first
      textarea hand-sized (pointerdown, set `style.height` to 200px,
      pointerup), fold and unfold it: the height is still 200px.
13. The decision file (title: "The quick item opens under a list's
    entries; its toast links the editor"): Task `persist-7e-list-quick-item`
    (owner's mock review, 2026-10-01); Decision = 3.1 and 3.2 in two
    sentences; Rejected = section 5's two lines; `- Amends "A list page
    makes a plain homebrew item in one press, with no draft mark"
    (2026-09-30): the toggle's place and the toast's link.`, and the mirror
    `- Amended by ...` status line in D9 before its "- Task". Then
    `node tools/decisions.js`. F5 needs no decision (no behaviour change).
14. Gates below, in order; stage by path.

### Acceptance

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
- F5 (owner's scale placement): a list row renders its note box only when
  it is open or the entry has a note, and no effect re-walks every
  textarea per keystroke: a typed price, quantity or note sizes no other
  note box; `ListPage.svelte` has no `querySelectorAll` over note
  textareas.
- F5: the clear cross's undo restores a note whose box went with the
  clear; a hand-resized box keeps its height across a fold and an unfold
  (the new states case); a box opened by «Заметка» takes focus in its
  first textarea.
- At 360 px the row and the open panel scroll nothing sideways, «Название»
  is in view after the press, a ticked row's bar does not cover «Добавить
  в список» at the maximum scroll, and a 120-character name keeps
  «Изменить» on screen (the new states case; `sweep.js 360`).
- At 1180 px the two new sweep pages pass (`sweep.js 1180`).
- The golden compares over `#/lists/` and `#/l/` move only the
  account-list states (`4000-8000`), and only by the toggle, the row, the
  empty hint and the toast link; no browser-list and no `#/l/` state moves
  (F5 changes no tree). The moved
  ones and the new `uuid(102)` state are re-seeded on purpose, with the
  reason in the handoff.
- `npm run e2e` passes: F15 presses «Свой предмет» by name and finds the
  row.
- The decision file and D9's pointer pass `node tools/decisions.js`.
- The bundle budget: `check:built`'s unconfigured figure is recorded; the
  budget rises only if the build passes it.
- The dispatch re-checked the shared files of "Re-check at dispatch" at
  R7c's pushed commit, and the handoff records any anchor that moved.

### Gates (one foreground call each)

```text
rtk npm run check                                   (timeout 600000; 9 min)
npm run check:built                                 (2 min)
node tests/run-all.js app/states                    (5 min, with the new case)
node tests/app/golden.js --only=#/lists/            (compare, 29 states plus the new one: about 4 min)
node tests/app/golden.js --only=#/l/                (compare, 13 `#/l/` states that ListPage draws: about 2 min)
node tests/app/golden.js --only=4000-8000 --update  (re-seed after the compares are read; about 2 min)
node tests/app/sweep.js 360                         (9 min with two more pages)
node tests/app/sweep.js 1180 ru                     (6 min)
node tests/app/sweep.js 1180 en                     (4 min)
npm run e2e                                         (3 min; the test project, no migration)
```

About 46 minutes, plus a closeout of about 10. Review: required after
the batch (new UI). Plan review: not required: no migration or SECURITY
DEFINER function, no public contract, no new write or sync protocol, and
no path that can lose stored data or a `localStorage` key (the F5 undo
writes the same fields through the same store methods). Split criterion:
none - one route set (`#/lists/<id>`), one component and its panel, and one
golden filter; F5 shares `ListPage.svelte` and the list goldens with `E1`.

### Risks and do-nots

- Pause only toasts with an action: a plain notice held by a resting
  pointer would break the timed goldens and `states.js`.
- Leave the undo focus rule as it is; the link action must not take focus.
- Leave `quickAdded`'s text and «Закрыть» as they are (R7f owns them).
- Keep `boxHidden` as it is: F5 changes when a box exists, not when it
  shows.
- Never dispatch an event on a textarea that the clear may have unmounted;
  write through the store.
- The `?as=` query of the test build stays in a fragment-only `href`.
- Stage by path; never `git add -A`.
- Fallback: none.
