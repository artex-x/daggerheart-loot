# Review - post-wave-2 (57)

Verdict: fix-then-continue
Reviewed: 10a47edc4a7841edf9b402dede3fc068778d54c0
Scope: batch post-wave-2

Blind review of production, https://daggerheart-loot.pages.dev/, after the
wave 2 deploy. Scope: the surfaces of waves 1 and 2, signed out, with local
state only. Per the dispatch, this review did not read plan*.md, handoff.md,
context.md, mocks or earlier reviews. It read CLAUDE.md, docs/specs and
app/src only to judge what production draws. `Reviewed:` is the branch head.
The review did not confirm that the deployed build equals this sha.

Method: headless Chrome through the repo's puppeteer, against production
only, one browser at a time, at 360x640, 390x844, 768x1024 and 1180x720,
plus 760/761 for the header edge and 640x360 for the bar. All probes were
read-only. The Write guard refused a scratch script, so each probe ran as
`node -` with the script on stdin. Screenshots are in
`C:\Users\Ignat\AppData\Local\Temp\claude\03ce522f574f0209\783834fa-1a36-44cc-8e86-e39b68eac805\scratchpad\shots`.

## Blockers

None.

## Risks

**R1. The record picture is a button named «Страница» / "Page" that never opens the page.**
`RecordCard` always draws the picture as `<button class="card-media"
aria-label={t.openPage}>`. No caller makes it open the page:
- Record dialog: open `/tables/core_item` at 390x844 RU, press row 2
  («Пронзительная Свирель»), then press the picture. The URL stays
  `/tables/core_item`, the dialog stays open and nothing changes. This
  dead control is the first tab stop after «Закрыть». The tab order at
  1180x720 is «Закрыть» -> «Страница» -> «В список».
- Item page: open `/i/w1` at 390x844 RU and press the picture. The record
  dialog of the same record opens over its own page. A press on the
  picture in that dialog does nothing.
- Roll result: open `/roll/std` and press a result's picture. A dialog
  opens, not a page.

The accessible name does not match the function (WCAG 4.1.2 / 2.5.3), and
the record dialog keeps a no-op stop in its tab order. The defect comes
from task 47 (`5780a070`, `ItemPage.svelte:149` from `0957fce5`), but it
shows on two of this wave's surfaces. Likely at fault:
`app/src/components/RecordCard.svelte:250` (the button is unconditional),
`app/src/components/ItemPage.svelte:149` (`onopen={opener(openRecord)}`) and
`app/src/components/RecordModal.svelte:111` (it passes the opener of the
record already on screen). Suggested fix: draw a plain figure when `onopen`
would show the record already on screen. Elsewhere, give the button a name
that says what it opens.

**R2. The focus drops to `<body>` after a pick in the table-picker sheet (up to 760 px).**
Repro: 390x844 RU, `/tables/eq_weapon`. Focus «Таблица: Оружие» and press
Enter. Focus «Броня» in the sheet and press Enter. The URL becomes
`/tables/eq_armor` and `document.activeElement` is `BODY` (a mouse click
gives the same result). Escape on the sheet returns the focus to the picker
correctly. At 1180x720 the inline tab keeps the focus (`A.tab «Броня»`).
FEATURES.md "Consistency rules" 20 says that a closed sheet returns the
focus to "what opened it". Chrome keeps its sequential starting point, so
the next Tab reaches «Список». A screen reader announces nothing, and other
engines can restart at the top. Likely at fault:
`app/src/components/TableNav.svelte:95-99`. The link's `onclick={() =>
close?.()}` unmounts the `{#if picking}` sheet. `Sheet.svelte` has no
return path, because the native restore runs only on `dialog.close()`. Fix:
focus the `.picker` button after the pick closes the sheet.

**R3. The weapons table draws all 458 rows in one task, which is slow on a slow CPU.**
Measured 2026-11-04 in headless Chrome, 390x844, warm HTTP cache:

| Route | CPU | First paint | Longest task | Rows / nodes |
|---|---|---|---|---|
| `/tables/eq_weapon` | 1x | 1.2 s | 677 ms | 458 / 8319 |
| `/tables/eq_weapon` | 4x | 9.5-10.2 s | 6.0-7.0 s | 458 / 8319 |
| `/tables/core_item` | 4x | 4.5 s | 1.3 s | 60 / 975 |
| `/roll/std` | 4x | 4.8 s (cold) | 1.3 s | - |

The first scroll pass at 4x drops 26 of 105 frames past 50 ms (lazy
thumbnails decoding). After the thumbnails load: 6-7 frames at 390 px, 4 at
1180 px and 0 at 800 px. The page shows no layout shift during the scroll,
and the header's slide does not move the content. I am not sure how much of
this is new: I have no build from before the wave to compare, and headless
throttling is not a real phone. Likely at fault: the row rendering in
`app/src/components/TablesPage.svelte`. See "Checks still needed".

## Nits

**N1. The host's 404 page draws the not-found state in a second way.** `local`.
Repro: `/nope` or `/en/nope` at any width. `404.html` (wave 1 touched it,
`30de6bf5`) has these defects:
- Its `<title>` holds an em dash: "Страница не найдена / Page not found
  — Daggerheart Loot". This breaks rule 14.
- It draws two `h1`s, against rule 7.
- It keeps the system font with no die mark.
- It names its actions «генератор» / «поиск». The app's not-found page
  (`/l/abc`) says «Страницы по этому адресу нет» with «На главную» /
  «Открыть таблицы».

The em dash and the second `h1` are cheap fixes. Aligning the look and the
action names is `deferred-scope`.

**N2. Signed out, `/homebrew` offers the pin at one width only.** `deferred-scope`.
At 1180x720 it draws «Открывать при запуске» beside the `h1` (`PageHead`
with `home`). At 390x844 it draws `PageTitle` with no «Ещё», so it has no
pin. The specs disagree on whether a pin may hold the route. ROUTES.md
"Homebrew" says that "a pin may not hold them". FEATURES.md "Chrome" and
STATE.md `dhloot.home.v1` say that «Мои предметы» pins `#/homebrew`. The
owner or the planner must settle the conflict. File:
`app/src/components/HomebrewPage.svelte:340-373`.

**N3. Signed out, `/homebrew/new` names the page two ways.** `local`.
The tab title is «Новый предмет» / "New item", but the `h1` is «Мои
предметы» / "My items" (rule 4). File: `app/src/components/Shell.svelte:127`
and `:137-142` (`homebrewTitle`).

**N4. The sign-in prompts of one action row behave differently.** `deferred-scope`.
On `/i/w1` at 390x844 RU, signed out:
- «Печать» opens a prompt with no «Отмена», and the focus stays on
  «Печать».
- «В список» -> «+ Новый список» opens a prompt with «Войти» and «Отмена»,
  and the focus moves to «Войти».
- «Ещё» -> «Сохранить себе» opens a prompt with no «Отмена», and the focus
  returns to «Ещё».

The selection bar's «Печать» prompt has «Отмена» and moves the focus to
«Войти». `/p/<id>` puts its «Войти» under the lead, not beside it. Files:
`app/src/components/PickRow.svelte:125-150`,
`app/src/components/SelBar.svelte:201-213`.

**N5. The footer's static-page links each take one redirect.** `deferred-scope`.
`/pages/install.html`, `/pages/privacy.html` and `/pages/terms.html` (and
the `/pages/en/` copies) answer 308 to the path without `.html`
(Cloudflare's pretty URLs). Every link resolves, and none is dead. File:
the footer's `pagesDir` links.

**N6. On the catalog up to 760 px, the menu item «Об этих данных» does not show the panel's state.** `deferred-scope`.
The panel opens inline with no close control. To close it, the reader
opens «Ещё» again and presses the same item, whose label stays the same.
The open state exists only as `aria-expanded`. Repro: 390x844 RU,
`/tables/core_item`, «Ещё» -> «Об этих данных». File:
`app/src/components/HelpItem.svelte`.

## Deviations

Not applicable. The dispatch makes this review blind, so the handoff and
its deviations were not read.

## Standing checks

1. Scale: checked. The 458-row weapons table at 360/390/768/1180 in list,
   grid and selection mode (458 selectable rows; the bar is 149 px of 640 at
   360x640 and 109 px of 360 at 640x360). At the end of the page the bar sits
   above the footer and the last row stays reachable. The filter sheet with
   13 source chips at 390 and 768 keeps «Показать N» visible. The
   supplements menu is 367 px in a 640 px window, and no page scrolls
   sideways. The cost of the 458-row draw is R3. The signed-in caps
   (homebrew items, lists, sources) cannot be reached signed out: see
   "Checks still needed".
2. Error scenarios: checked. Signed out, no wave 1-2 surface writes to the
   server, and no probe sent a non-GET request. These local-state cases
   fall back with no console error: a broken `dhloot.home.v1`
   (`garbage`, `#/tables/nope`), `dhloot.prefs.v1` (`{bad`,
   `{"view":"cards"}`) and `dhloot.lang.v1` (`xx`). A valid pin and
   `view: grid` apply. A language switch in one tab moves the other tab.
   Offline, a reload does not open (no offline shell, by META.md design),
   and in-app search keeps working. `/h/zz`, `/s/abc`, `/p/<12>`, `/l/abc`
   and `/print/x` draw their own pages, in RU and EN.
3. Consistency: checked. The record actions on the page, the dialog and
   the roll result match FEATURES.md "Records". The jobs, the lit states,
   the mode row and the account ring match "Chrome". The error pages:
   N1. The pin by width: N2. Page names: N3. The sign-in prompts: N4. The
   picture control: R1. The focus after a sheet: R2.
4. RU/EN parity: checked. Every route listed above in both languages at
   360 and 1180, plus the tables and the roll pages at 390 in EN. Both
   dictionaries in `app/src/lib/dict.ts` are typed `Dict`, and no string
   in them holds an em dash, an en dash, an arrow, an ellipsis character or
   curly quotes. One defect: the em dash in the title of `404.html` (N1).
   No label is cut or clipped at 360 px in either language.

Owner rules: not applicable. The dispatch forbids `issues/57/context.md`,
where this batch's owner rules are tagged.

Other checks the dispatch named:
- Header: up to 760 px it leaves on a scroll down (`top` -111 at 390, -105
  at 760). It returns on a 60 px scroll up and ignores a 5 px move. It
  stays at 761, 768 and 1180 px. It is 111 px at 360/390 and 63 px from
  761 px. Shift+Tab into it brings it back. A focused row stops clear of
  its full height.
- Console and network: no page error and no failed request. The only
  console errors are the 404 status lines of `/h/zz`, `/s/abc` and the
  host 404, which answer 404 on purpose.
- Small controls: the footer links (21 px tall) and the upgrade link on a
  roll face (20 px) are under 24 px. Both pass the WCAG 2.5.8 spacing
  exception: each is alone on its line, or 16 px from the next.

## Suggested next action

Send R1 and R2 to the implementer. Both are local and cheap. Each needs a
component test: R1 for the picture's role and name per caller, R2 for the
focus after a pick in the table sheet. Include the `local` nits N1 (title
and second `h1`) and N3. Give R3 a baseline measurement before any change.
Put N2 to the owner or the planner as a spec conflict. File N4-N6 in
handoff Deferred.

## Checks still needed

- Signed-in surfaces that a read-only probe cannot reach: the homebrew
  editor and its tabs, the add-to-list menu with account lists, the
  selection bar's print set, the account page signed in, and the caps of
  the Scale check at the limit, one past it and at 3x.
- R3: a baseline from the build before wave 1 on the same host and
  throttle, and a measurement on a real mid-range phone.
- R2 on Safari/VoiceOver, where the sequential starting point can differ.
- `prefers-reduced-motion` on the header slide and the help panel's
  animation.
- «Поделиться» with a real share sheet. In headless Chrome the press
  showed no toast and no sheet, which the probe cannot tell apart from a
  pending `navigator.share`.
