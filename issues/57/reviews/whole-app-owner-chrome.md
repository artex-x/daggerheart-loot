Verdict: fix-then-continue
Reviewed: 02a50c39
Scope: whole-app

<!-- Not a reviewer report: the orchestrator's read of production signed in, in the owner's own Chrome
(Claude in Chrome), with the owner's yes to writes (chat, 2026-11-06). The reviewer-written reports are
whole-app-prod.md (production, signed out) and whole-app-signed-in.md (fixture build). -->

# Review - whole app, owner Chrome (57)

Method: production https://daggerheart-loot.pages.dev/ in the owner's Chrome, viewport 1920x895. The window
resize changes the outer window only (`innerWidth` stays 1920), so no phone or tablet width was read here. One
test list was created: "ZZ review wave 4 (delete me)". The owner deletes it. It holds one item (a sleeping bag,
`/i/ci1`). No existing list, note or setting was changed. The build is the new one: the stylesheet is
`index-CwTKcKru.css` (wave 3 review: `index-BSPELwPN.css`).

## Checked, no defect

- `/lists`: 24 lists before, 25 after. «Новый список» opens the name field; Enter creates the list.
- List page at 1920: the side plate holds the name, the meta line, «Поделиться», «Печать», «Ещё», «Заметки».
  The name field is a `textarea` with the field box (ground, 1 px border, 9 px radius), wraps the whole name
  (88 px for 28 characters in the 294 px plate), and its focus shows the gold border and the 3 px shadow.
- Add-to-list menu on `/i/ci1`: the new list is in the menu with a count; a press adds the item and the toast
  «Добавлено в «ZZ review wave 4 (delete me)»» shows at the bottom center; a second press shows «Убрано из ...».
- Share panel: «Ссылка для игроков» and «Ссылка для мастера», each with «Скопировать» and «Удалить ссылку».
- Note area: the switch «Для игроков» / «Только для мастера»; a press on the second option keeps the focus on that
  option (`aria-pressed` true).

## Findings

1. Blocking, placement. «Импорт из файла» and «Выбрать» sit in different places on sibling pages (owner, with
   screenshots, 2026-11-06). At 1920 px: `/lists` pushes both to the right edge of the column (import 1428-1588,
   «Выбрать» 1598-1672, column edge 1673); `/homebrew` Items follows the 720 px search box and the count (import
   1080-1243, «Выбрать» 1253-1327), about 350 px short of the edge. Cause: `HomebrewPage.svelte` `.grow ~ .end`
   sets `margin-left: 0` (The Field Measure Rule: the next controls follow the box); `ListFind`'s `beside` pushes
   the group right. The owner asked to make it consistent; the orchestrator took the recommended option B (both
   pages keep the tool group next to the search box and the count; option A, the right edge on both, was the
   alternative). The owner has not named a letter.
2. Not blocking, observation. In the 294 px side plate «Ещё» wraps onto a row of its own below «Поделиться» and
   «Печать» at 1920. Check with the reviewers' matrix whether this is the intended wrap.
3. Owner question, mobile screenshots 2026-11-06 (roll page and tables page at 360): the roll mode pills and the
   tables book dropdown with the list/grid switch are different controls for different jobs. The orchestrator
   recommended keeping them (option A); the owner has not answered. The matrix compares them.

## Second pass (owner asked for the full write flows, 2026-11-06)

Checked, no defect: DOM probes (overflow, targets under 24 px, unnamed controls, clipped names) on `/roll/alt`,
`/roll/std`, `/tables/eq_weapon`, `/search`: none. Search: «Выбрать», two ticked rows, «В список», the toast
«Добавлено в «ZZ review wave 4 (delete me)»: 1» (one of the two was already in the list). List page: «Выбрать»,
select all, «Цены» opens the sheet centered at 1920 (560 px wide, 310 px above and below, 14 px corners); Escape
closes it and the focus returns to «Цены». `/roll/std`: «Бросить 1d12» draws a result with «В список»,
«Поделиться», «Ещё». `/account`: two rows «Цвет печати» and «Размер карты»; the print color switch changed and was
restored. Homebrew: «Новый предмет» saved "ZZ review wave 4 item" (`hb_yonub5jq42dsemhf`).

4. Not blocking, to confirm: after the homebrew save the page opens the item page with the focus on `body`
   (rule 20 says `#main` when the pressed control leaves). The fixture reviewer's focus class should say whether
   this is the general case after an in-app navigation.
5. Not blocking, to confirm: the first click on a search row's checkbox right after «Выбрать» did not tick it
   ("Выбрано: 1" after two ticks); the second click did. Not reproduced twice.
6. Tooling: the delete of the test item raised the app's native `confirm()` (`ports/dialog.ts`), which blocks
   the tab until the owner answers it in Chrome; screenshots on the tab timed out from the second pass on.
   Cleanup left for the owner: the test item and the test list.

Not read here (needs a phone width or a second account): the compact head at 761-999 px, the price sheet, the
tick column, `/s/` as a visitor, the print page, and every state at 360 px.
