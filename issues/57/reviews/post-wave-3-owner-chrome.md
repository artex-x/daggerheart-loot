# Review - post-wave-3, signed-in check in the owner's Chrome (57)

Verdict: fix-then-continue
Reviewed: 45050594
Scope: batch post-wave-3

<!-- Not a reviewer report: the orchestrator's read of production signed in, in the owner's own Chrome
(Claude in Chrome), with the owner's yes to writes (chat, 2026-11-06). The reviewer-written reports are
post-wave-3.md (production, signed out) and post-wave-3-signed-in.md (fixture build). -->

Method: production https://daggerheart-loot.pages.dev/ in the owner's maximized Chrome, viewport 1920x951 (the
window did not resize, so no phone or tablet width was read here). One test list was created by the check, named
"ZZ review wave 3 (delete me)": the owner deletes it. No existing list, note or setting was changed. The account's
email is not recorded here.

## Checked, no defect

- `/lists`: 34 of 50 lists, the cards, the new-list field (focused on open, «Создать» and «Отмена»); a created list
  appears first with «Список пуст».
- Add-to-list menu on `/i/ci1`: lists with a check on the ones holding the item, a count per list, «Новый список»;
  adding to the test list set its check and count at once.
- List page at 1920: the page column is 1440 px, centered; the side column (name, meta line, «Поделиться», «Печать»,
  «Ещё», notes) is at the right; the rows at the left; «Добавить свой предмет» under the rows.
- Notes: the area opens with «Для игроков» / «Только для мастера», the toolbar, «Готово», «Очистить»; after «Готово»
  the note draws as a read-only box with the bold rendered.
- Price: the «Цены: Как в книге / Монетами» switch with the example line appears as soon as a price is set.
- Share panel: opens at the top of the rows column with a players' link and a GM link, each with «Скопировать» and
  «Удалять ссылку»; the shared page `/s/...` shows the banner «Это ваш список. Открыть для правки», the name, the meta
  line, «Сохранить себе», «Выбрать», the row with «5 горстей» (50 in the book form).
- Account (signed in): the three cards, language, start section, table view, print defaults, borrow behavior, sign-in
  methods, ZIP export, sign-out, account deletion.

## Findings

- **OC-1 (nit, local).** The list name field in the side plate shows a long name cut at about 26 characters at 1920 px
  ("ZZ review wave 3 (delete m"); a list named with 200 characters (one exists) is cut the same way. Check against the
  Whole Message Rule and the list-name decision (one line up to 760 px).
- **OC-2 (nit, local).** On `/s/...` the word «Заметка» at the end of the meta line is the toggle that opens the note,
  and it reads as plain text: no link color, underline or border. A reader may not find the note.
- **OC-3 (nit, local).** The print defaults row on the account page draws the color pair and the size pair in one row
  («Цвет | Ч/б | 63×88 | 44×63») with no gap or label between the groups; two checks sit in one row.
- **OC-4 (unverified).** No toast was seen one second after adding an item to the test list; the check mark and the
  count changed. Confirm whether a toast is meant there (the read-only look may have missed a 4000 ms toast).
- **OC-5 (not checked).** Phone and tablet widths, the roll panel from a list (needs two items), the requests panel
  (needs a visitor request), the lists import (needs a file), the selection bar and bulk delete (writes real data).
  The fixture review and the owner's phone cover them.
- **OC-6 (design, owner's call, reported by the owner with a screenshot of `/lists/<uuid>` in selection mode at 1920x975).**
  The «Цены выбранных» `Sheet` is attached to the bottom edge (560 px wide, centered horizontally), as DESIGN.md "Bottom
  sheet" says for every width. The record dialog is a centered dialog above 760 px, so on a desktop the sheets and the
  dialog differ. Recommended: center `Sheet` from 761 px and keep the bottom sheet up to 760 px (one CSS block in
  `Sheet.svelte`; DESIGN.md "Bottom sheet" and FEATURES.md; adapt the browser cases that read the sheet's position at wide
  widths). Waiting for the owner's yes.
- **OC-7 (consistency, owner's call, reported by the owner with two screenshots).** «Импорт из файла» is in the
  search row on «Мои предметы» (between the count and «Выбрать», with «Новый предмет» alone in the head row) and in the
  head row beside «Новый список» on «Мои списки». The search field and «Выбрать» are in the same place on both. The
  homebrew toolbar beside the search field was a named departure of an earlier batch. Recommended: import beside the
  primary in the head row on both pages (measure the homebrew first screen at 768, 900, 1000 and 1180 RU first; 900 px
  is 286.2 of 288); fallback: import in the search row on both pages. Waiting for the owner's yes.
