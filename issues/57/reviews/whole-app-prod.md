Verdict: fix-then-continue
Reviewed: 02a50c39
Scope: whole-app

# Review - whole app on production, signed out (57)

Blind review of https://daggerheart-loot.pages.dev/ (deployed from main 02a50c39), signed out, local state only. Headless Chrome through the repository's puppeteer, a fresh browser context per language and per width, reduced motion on, axe-core 4 with the tags wcag2a, wcag2aa, wcag21a, wcag21aa and wcag22aa. Screenshots are in `C:\Users\Ignat\AppData\Local\Temp\claude\97bbd0b98c47ced0\33951b0e-389b-4f3e-901a-6827167c86d6\scratchpad\shots\` (named below by file name in that folder).

Build identity: partly confirmed. The production `assets/index-CwTKcKru.css` has the same hash as the worktree's `dist/assets/index-CwTKcKru.css`. The JS differs (`index-jA5xkw90.js`, 754947 bytes, against the local `index-B7bPxVR4.js`, 745411 bytes): the local `dist/` was built at 21:23 before the last two commits, and the production bundle carries the Supabase host that a local build without the CI env does not. `npm run build` was refused by the reviewer guard, so the JS identity is not confirmed. `git diff 02a50c39 9db714b4` is empty, so the worktree tree equals main.

Note for the orchestrator: another session writes into the same scratchpad `shots\` folder (signed-in `ov-*`, `list101-*`, `savefail-*` files). Its `lists-*.png`, `search-*.png` and `account-*.png` overwrote mine of the same name; this report uses only files with the `w<width>-`, `wap-` and route-name prefixes that the other session does not write, and the measurements printed by my own probes.

## Blockers

1. **Focus lands on `body` after an in-app navigation that removes the pressed control** (FEATURES.md rule 20, "else `#main`"). Measured at 360 and 1180, RU:
   - a roll result's name link (`<a href="/i/ci1" title="Открыть страницу">`) to `/i/ci1`: focus `BODY` (`wap-roll-open-enter.png`, `wap-roll-open-click.png`);
   - the error page's «На главную» on `/s/abc123` to `/roll/std`: focus `BODY`;
   - «Открыть таблицы» on `/lists/<uuid>` signed out to `/tables`: focus `BODY`;
   - the record page's «показать в таблице» on `/i/ci1` to `/tables/core_item/ci1`: focus `BODY`.
   A navigation that keeps the pressed control (the jobs, the mode pills, the group chips, the picker's tabs) keeps the focus correctly. Cause: no focus move on a route change; only the skip link (`app/src/components/Shell.svelte:229-234`) and the error page's reload (`app/src/App.svelte:96-100`) focus `#main`. Request: when the route changes and the focused element left the DOM, focus `#main`. Blocking.

2. **The record dialog and the `Sheet` draw two scrims.** The record dialog's backdrop is `rgb(6 4 12 / 78%)` with `backdrop-filter: blur(5px)` (`app/src/components/RecordModal.svelte:149-152`); every `Sheet` caller (filter sheet, table picker) draws the same color with no blur (`app/src/components/Sheet.svelte:101-103`). Measured at 360, 768, 1000, 1180 and 1920 (`w360-rec-dialog.png` against `w360-tbl-filters.png`; `w1180-rec-dialog.png` against `w768-tbl-filters.png`). DESIGN.md "Sheet" asks for one modal shape from 761 px and names no reason for two scrims. Request: one backdrop rule for both. Blocking.

3. **«Ещё» in the head row has three looks on sibling pages up to 760 px.**
   - `/tables/*`: a hand-rolled `.morebtn` (`app/src/components/TablesPage.svelte:731-741`, styles `:1052-1067`): 62x40, `--r-sm` (9 px) corners, hover border `--muted2`.
   - `/search` and the roll pages: `MoreMenu` with `Button size="sm"`: 69x40, the compact 8 px radius, hover border Seal Gold (DESIGN.md "Buttons", "Hover").
   - `/lists`: `MoreMenu` with an override to 44 px tall and 6 px padding (`app/src/components/ListsPage.svelte:588-593`): 57x44.
   Screenshots `w360-tbl-more.png`, `w360-search-more.png`, `w360-roll-linemore.png`; the `/lists` size is from my survey output (its screenshot was overwritten, see the note above). No DESIGN.md or FEATURES.md line gives a reason; CLAUDE.md asks to reuse the shared component. Request: draw the catalog's «Ещё» through `MoreMenu`, and give the three pages one size. Blocking.

## Risks

1. **The record dialog's «Ещё» scrolls the dossier at 1000x720 and 1180x720.** For a short record the menu (264 px) fits neither under the button nor above it inside the card, so `Menu.place` leaves it down and the focus on its first item scrolls the card about 30 px: the picture's top and the badge row are cut (`w1180-rec-more.png` against `w1180-rec-dialog.png`). Cause: `app/src/components/Menu.svelte:37-47`. FEATURES.md "Records" says the menu opens up where the room is only above; here there is room in neither place. Not blocking.

2. **The table picker sheet draws the current group with a check; the head draws it without one.** Up to 760 px the sheet's group chips are toggle buttons (`aria-pressed`), and the current group is gold with the check (`w360-tbl-picker.png`); from 761 px the same group is a link pill, gold with no check (`tables_eq_weapon-1180.png`). DESIGN.md "The Check Rule" says the table chips show the current place by their fill and draw none. Question: is the sheet chip a place or a choice? Not blocking.

3. **A second shadow step.** `Menu.svelte:99` and `AddToList.svelte:538` use `0 16px 40px -14px rgb(0 0 0 / 85%)`, which is not in DESIGN.md "Shadow Vocabulary" (Plate, Float, Paper). The One Shadow Rule allows the Plate or no shadow. Not blocking.

4. **Four shapes of the sign-in prompt on sibling pages.** `/lists`: the empty plate with the glyph (`lists-1180.png`, read before the overwrite); `/homebrew` and `/tables/homebrew`: a bare line and «Войти» (`homebrew-1180.png`, `tables_homebrew-1180.png`); `/lists/<uuid>`: the error page with two actions (`lists_00000000-0000-4000-8000-000000000-1180.png`). Each is named in FEATURES.md (lines 542, 1929, 383, 1149), but no line gives the reason for the difference. A decision for the owner. Not blocking.

5. **The JS bundle identity is not confirmed** (see "Build identity").

## Nits

1. `deferred-scope`: the signed-out `/lists/<uuid>` lead ends with the instruction «Войдите в него.», which repeats the heading «Войдите, чтобы открыть список» and the «Войти» button (DESIGN.md, The Clarity Rule). The text is FEATURES.md line 1150, so the fix is a spec change.
2. `local`: a roll result's name link carries `title="Открыть страницу"`, a hover-only text (FEATURES.md rule 15a: no help lives only in a hover `title`). Drop the `title` or make it the visible picture link's job.

## Deviations

Not applicable: a whole-app review has no handoff. The plan, the handoff, the context and the earlier reviews were not read (blind review).

## Seeded defect classes

| Class | Result |
|---|---|
| Placement | Found: Blocker 3 (the «Ещё» control), Risk 1 (the dialog menu). Overlays otherwise match by kind: menus are right-aligned under their control at every width; sheets are bottom-attached with 14 px top corners up to 760 px and centered with four corners and the plate shadow from 761 px; the selection bar is the same box on `/tables` and `/search` (313x164 at 360, 68 px tall from 768); the toast is centered 26 px off the bottom at all five widths. |
| Wrapped, clipped or cut names | None found: 16 routes, 360 and 1180, RU and EN; no horizontal scroll. |
| Text that looks like plain text but is a control | None found. The footer license `summary` matches the text color but draws its disclosure marker. |
| Groups with no gap | None found. The group chips and the book tabs are 10 px apart at 1180, but they are the two levels of DESIGN.md "Two-level navigation", each named; the filter column's rows have their captions between them. |
| Unnamed or misnamed controls (WCAG 2.5.3) | None found. Every `aria-label` holds the visible label; the steppers are symbol-only («-», «+»). |
| Controls under the target floor in unswept states | None found in the filter sheet, the table picker sheet, the catalog and search selection bars, the record dialog with its «Ещё», add-to-list and print prompt, the supplements menu and the roll pane, at 360, 768, 1000, 1180 and 1920 (the focus-only skip link excluded). |
| Focus on `body` | Found after an in-app navigation (Blocker 1). After a control removes itself: none found («Снять выделение» to «Выбрать», a sheet's Escape to its opener, a menu's Escape to «Ещё», the dialog's Escape to its row). |
| Instruction sentences | Found: Nit 1. |

axe: zero violations on 16 routes at 360 and 1180 in RU and EN, default states only.

## Consistency matrix

Signed out, the import, the create button, the note toggle, the counter and limit and the save status draw on no page, and `/lists/<uuid>`, `/s/<token>`, the four `/homebrew` tabs and `/p/<id>` draw only a prompt or an error page. Those cells read "n/r" (not reachable signed out). Format: 360 / 1180.

| Row | /lists | /tables/* | /search | roll pages | /account | /homebrew, /lists/uuid, /s, /p |
|---|---|---|---|---|---|---|
| «Выбрать» | n/r | button, search row last, 71x40 / 75x40 | button, search row last, 65x40 (with results) / 75x40 | none | none | n/r |
| Search box | n/r | search row first, 237 px / 711 px | search row first, 174-242 px / 720 px | none | none | n/r |
| «Фильтры» | n/r | search row button opening the sheet / column heading from 1000 px | search row button opening the sheet / kind chip row from 761 px (DESIGN.md "The Search Head Rule") | «Настроить» opens the pane in place / pane always shown | none | n/r |
| Pin | «Ещё» item / labeled head button | «Ещё» item / labeled head button | «Ещё» item / labeled head button | «Ещё» item / labeled head button | none (DESIGN.md "The Same Label Rule") | `/homebrew`: none until items are read (FEATURES.md "Chrome") |
| Help | none (FEATURES.md "Chrome") | «Ещё» item «Об этих данных» / head button | none | «Ещё» item / head button, named for its panel (FEATURES.md line 63) | none | none |
| Primary | «Войти» in the plate | none | none | the dice or the roll button in the pane | provider buttons | «Войти» or «На главную» |
| Share | none | «Ещё» item «Ссылка на таблицу» / search row button | none | per result «Поделиться»; page copy «Скопировать все варианты» in «Ещё» / results line | none | n/r |
| Print | none | selection bar «Печать»; record dialog «Печать» opens the sign-in prompt | selection bar «Печать» | none (DESIGN.md "The Dossier Rule": a roll result holds no «Печать») | none | n/r |
| Roll | none | none | none | dice or roll button | none | n/r |
| «Ещё» control | 57x44 MoreMenu override | 62x40 hand-rolled | 69x40 MoreMenu | 69x40 MoreMenu | none | none |
| «Ещё» contents | pin | table link, pin, help | pin | copy all, pin, help | - | - |

The only row with a difference that no spec line explains is the «Ещё» control (Blocker 3).

Mode and view selectors. `/roll/*` at 360: the mode row under the header, three 40 px controls, «Дополнения ▾» opens a `Menu` (367 px). At 1180: the same three as head pills after the `h1`. `/tables/*` at 360: the picker button («Оружие ▾», «Core / Предметы ▾») opens a `Sheet` with the group chips and the tabs, then the list or grid switch (neutral check) and «Ещё». At 1180: the group chips as head pills, the underlined tabs under the head, the switch in the search row. The supplements are a menu on the roll pages and a chip with seven tabs on the tables; FEATURES.md "Tables and search" and "Chrome" name both. Only Risk 2 remains.

## Standing checks

1. Scale: checked - signed out, only the catalog and search hold collections. The selection bar is 164 of 640 px at 360 and leaves the rows readable; the filter sheet is 544 px with its foot («Сбросить», «Показать 458») kept; the search box sits at the top, clear of the on-screen keyboard. The account collections at their limits are n/r signed out.
2. Error scenarios: checked - no write path is open signed out except the clipboard. Unknown `/s/`, `/lists/<uuid>`, `/p/` and `/i/<bad id>` draw their error pages with a way out. «Печать» and «Новый список» open the sign-in prompt. Offline and a failed clipboard were not tested.
3. Consistency: checked - the matrix above, overlays by kind at five widths, FEATURES.md "Consistency rules" 1, 4, 6, 7, 11, 16 and 20 where reachable. Findings: Blockers 1-3, Risks 1, 2 and 4.
4. RU/EN parity: checked - 12 routes at 360 and 1180 in English hold no Cyrillic in text, `aria-label`, `placeholder` or `title`; `lang` is `en`; headings match the Russian facts.

Owner rules: checked - the owner-dated rules of DESIGN.md that a signed-out page shows. The First-Screen Rule holds: at 360 `/roll/std` 323 px (named exception 325), `/roll/alt` 254, `/tables/*` 230, `/account` 240; at 1180 `/tables/*` 244, `/roll/std` 214. The Head Order Rule and The Same Label Rule hold on the roll, catalog, search and lists heads. No rule tagged for this review exists, because the review is blind to `context.md`.

## Suggested next action

Send Blockers 1-3 and Nit 2 to the implementer as one remediation batch: a focus move to `#main` on a route change that removes the focused element, one backdrop rule for the record dialog and `Sheet`, and `MoreMenu` with one size on `/tables`, `/search`, the roll pages and `/lists`. Ask the owner about Risks 2 and 4. Then re-run the focus and overlay probes at 360 and 1180.

## Checks still needed

- Every signed-in surface: the import and create buttons, `/lists/<uuid>`, a live `/s/<token>`, the four `/homebrew` tabs and the editor, the print dock at `/p/<id>`, the crop dialog, the account menu, the counters and the save status. A signed-out review cannot reach them.
- The toast while the selection bar shows (26 px above the bar), the selection bar's «Печать» prompt and its «Отмена» focus: the probe was refused by the harness's command check before it ran.
- axe with each overlay open.
- The JS identity: `npm run build` from 02a50c39 with the CI env, then compare `assets/index-*.js`.
- The 768 and 1000 px heads in full for the matrix (only overlays were measured at those widths).
