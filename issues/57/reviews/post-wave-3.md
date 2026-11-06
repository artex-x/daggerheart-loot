Verdict: fix-then-continue
Reviewed: 450505946120eebd0135050082fad227d99e9d47
Scope: batch post-wave-3

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

# Review - post-wave-3 (57)

A blind review of production, https://daggerheart-loot.pages.dev/, signed out, with local
state only. Read: `CLAUDE.md`, `DESIGN.md`, `docs/specs/FEATURES.md` ("Rolling", "Lists",
"Print", "Account", "Chrome", "Consistency rules"), `ROUTES.md`, `META.md` "Static pages",
`DEBT.md`, the note `material-review.md`, and the `app/src` files named below. Not read, per
the dispatch: `issues/57/plan*.md`, `handoff.md`, `context.md`, mocks and earlier reviews.

Method: headless Chrome through the repository's puppeteer, one browser at a time, a fresh
browser context per language (a stored language wins over the address), read-only probes
through stdin. Widths: 320, 360x640, 390x844, 600, 601, 760, 761, 768x1024, 900x720,
999x720, 1000x720, 1180x720, 1440x900. axe-core 4 from `node_modules`, tags wcag2a, wcag2aa,
wcag21a, wcag21aa, wcag22aa.

Build identity: not confirmed. The page exposes no build or version string. Production
serves `assets/index-BSPELwPN.css`, the same content-hashed name as the worktree's `dist/`
and `dist-test/` stylesheet; its script `assets/index-GprRXt-C.js` differs from the local
builds (`index-9KGan2Y1.js`, `index-hMRD_45g.js`), which can come from the build
environment. I did not confirm that the deployed build equals `45050594` (or main
`10011729`).

## Blockers

**B1 - the signed-out `/account` fails the First-Screen Rule at 360x640 in Russian (local).**
Route `/account`, 360x640, RU: the sign-in panel (`[data-primary]`) starts at 262.4 px, over
the 256 px limit. EN at 360x640 is 240.0 px; RU at 390x844 is 240.0 px. Cause: the lead
«Войдите, чтобы ваши данные были доступны на всех устройствах. Всё остальное работает и без
входа.» (14 px, `text-wrap: balance`) takes three lines, 67.2 px, in the 313 px column; EN
takes two (44.8 px). `tests/app/states.js` `FIRST_SCREEN` holds `#/account as gm1` only, so
the signed-out state, the one a first visitor sees, is not measured: a missing state. Source:
`app/src/components/AccountPage.svelte` and `app/src/lib/dict.ts` (the account lead), whose
text `FEATURES.md` "Account" quotes. Fix: a Russian lead that takes two lines at 313 px (the
spec quote changes in the same commit), or a named exception with the owner's yes; in either
case add a signed-out `/account` row to `FIRST_SCREEN` at 360x640 and 1180x720, RU and EN.

**B2 - «показать в таблице» on a record page is under the target size at every width (local).**
Routes `/i/ci1`, `/i/w1` (and `/h/<uuid>` for its author, the same component), RU and EN,
every width from 320 to 1440 px: the link is 127x19 px in RU and 109x19 px in EN, with no
padded box (`display: inline`, `padding: 0`). The Phone-First Rule asks 40x40 px up to 600 px
("a text link grows its padded box and keeps its line") and a 24 px padded box from 601 px.
The link sits in the path line «Core · Предметы · номер 1», which is not a sentence, so the
"link inside a sentence" exception does not apply (`FEATURES.md` "Records" calls it the path
line). WCAG 2.5.8 passes by spacing at 768 px and up (no other target in its 24 px circle),
but the project rule fails. The suite does not see it: `tests/app/lib.js` `TARGET_ALLOW` entry
`test: 'inline'` passes every inline link whose parent holds more text. Source:
`app/src/components/TableLink.svelte` `.itemtable`. Fix: a padded box with a compensating
negative margin (the footer links' pattern), so the line does not move; then narrow the
`inline` allow entry so it cannot pass a path line.

## Risks

None beyond the blockers.

## Nits

**N1 - the lit pill is wider than at rest, so a mode switch moves the pills after it (local).**
From 761 px, RU, `/roll/std` to `/roll/alt`: «Альтернативные таблицы» grows from 176 to
179 px and «Дополнения» moves from x=424 to x=427; «Обычные правила» shrinks from 134 to 132
px when it is not lit. EN: "Alternate tables" 113 to 116 px. The catalog group chips grow 1 px
when lit («Снаряжение» 99 to 100 px, «Дополнения» 99 to 100 px), and the chips after them
move 1 px. The Head Order Rule says "a switch between siblings moves no pill". Cause:
`app/src/components/ModeRow.svelte` `.mode.on { font-weight: 650 }` against 540 at rest (the
catalog chips have the same weight step). Fix: keep one weight, or reserve the lit width.

**N2 - six roll pages draw an instruction sentence as their lead (local).**
From 761 px, RU and EN: Wondrous Environments, Dread GM Toolbox, The Dragon's Vault and Arazo's
Artifacts read «Введите результат броска или получите случайную позицию.» / "Enter your roll
result, or pick a random entry."; Vault of Ages reads «Выберите раздел книги и бросьте кость
по нему.»; Community items reads «Выберите происхождение и бросьте d10.». The Clarity Rule
calls an instruction sentence a defect. Consistency: `34ae151c` removed the Many Worlds
Tavern lead of the same kind, so the nine pages now draw three kinds of lead (a description on
`/roll/std` and `/roll/alt`, none on `/roll/many_worlds_tavern`, an instruction on six). Source:
`app/src/lib/dict.ts` `subWondrous`, `subVoa`, `subCommunity`. Fix: drop them as the MWT lead
went, or describe the table; the roll goldens re-seed.

**N3 - the search start state repeats the lead (local).**
`/search` from 761 px, RU and EN: the lead «Поиск сразу по 1459 позициям - ... на русском и
на английском.» and the start plate «Ищет по названиям и описаниям, по-русски и по-английски
сразу.» both state that one search covers both languages. Up to 760 px the lead is read, not
drawn, so only the plate says it there. One of the two sentences can go (Impeccable lens:
redundant copy). Source: `app/src/lib/dict.ts` (the search lead and the start sentence).

**N4 - the static pages' tab title uses an em dash (local).**
`/pages/install.html`, `privacy.html`, `terms.html` and the `en/` copies: «Установить как
приложение — Генератор лута Daggerheart» / "Privacy — Daggerheart Loot Generator". The app's
titles use " - " (`FEATURES.md` rule 14, ASCII punctuation). Source: `tools/build-pages.js`
line 126, `<title>${esc(title[lang])} — ${t.site}</title>`; then `node tools/build.js`.

**N5 - the homebrew editor's signed-out head differs from `/homebrew` (local).**
`/homebrew/new` and `/homebrew/hb_<key>` signed out at 360x640, RU and EN: the head draws the
lead (67.2 px), so the sign-in line starts at 262 px; `/homebrew`, `/homebrew/sources` and
`/homebrew/sets` draw the heading alone and the line at 177 px, as `FEATURES.md` "Homebrew"
asks ("up to 760 px the heading is visible there, and from 761 px the lead line stays"). At
1180 px the editor's `h1` box is 1133 px wide against 152 px on `/homebrew`. Source:
`app/src/components/HomebrewEditor.svelte`, the `app.user === null` branch (`PageTitle` with
`sub`).

**N6 - the record path line's link carries the "external" icon but opens in the same tab
(local).** `/i/ci1`: «показать в таблице» draws `Icon name="external"` and has no `target`;
the icon promises a new tab or another site (Clarity Rule). Source:
`app/src/components/TableLink.svelte`. It can go with the B2 fix.

**N7 - the static pages draw the system face and small targets (deferred-scope).**
`/pages/*.html` at 360 px: no font request, body face `-apple-system, ...`; the language link
is 41x17 px («English») and 47x17 px ("Русский"), the back links 134x24 px, under the 40 px
thumb size. WCAG 2.5.8 passes by spacing. `DESIGN.md` "Notes" names `404.html` as the one
system-face exception; the static pages are not named. Needs a decision: name them in
"Notes", or give the template the self-hosted face and padded links.

**N8 - the host not-found page's links are 20 px tall at 360 px (deferred-scope).**
`/nope` and `/i/cw1` (an unknown record id): «На главную» 80x20 px, «Открыть таблицы» 121x20
px, "Home" 40x20 px, "Open the tables" 105x20 px, under the 40 px thumb size; WCAG 2.5.8
passes by spacing. `404.html` is a kept exception for its face only (`DESIGN.md` "Notes").

**N9 - Escape does not clear a selection or fold «Настроить» (deferred-scope).**
Proposed rule, The Escape Rule (`DESIGN.md` "Proposed rules", source: Android adaptive app
quality, Tier 2, Keyboard_Exit). `/tables/core_item` at 360 and 1180 px, RU and EN: two
ticks, Escape, «Выбрано: 2» stays and the focus stays on «Все». `/roll/std` at 360 px: Escape
in the open «Настроить» panel leaves `aria-expanded="true"`. The rule is not shipped; this is
input for the later task that builds it.

## Deviations

None reviewed: the dispatch forbids the handoff, so no recorded deviation was read.

## Standing checks

1. Scale: checked - signed out, the collections in reach: a four-result roll at 1180x720 shows
   every name in the first screen (names at 256 and 485 px); the supplements menu holds 7
   items of 44 px and ends inside 640 px at 360 px; the add-to-list menu signed out is 280x93
   px and opens up at 360 px (bottom 526 of 640); the selection bar is 165 px tall at 360 px
   (26% of the window) and 69 px at 1180 px; search over 1459 records; no sideways scroll at
   any width from 320 to 1440 px. List caps, a 120-character list name and 3x the default
   limits need a signed-in account (see "Checks still needed").
2. Error scenarios: checked - a refused clipboard gives the error toast «Не удалось
   скопировать» / "Could not copy" (`role="alert"`, Alarm Red, 7051-7057 ms); an unknown
   share token draws «Список больше не доступен» with «На главную»; a malformed `/p/` id
   draws «Набор не найден...»; an unknown `/h/` id and `/l/x` draw the error page with the
   address; signed-out writes (add to list, a new list, print from a record and from the
   bar) draw the sign-in prompt in place, and «Отмена» and Escape return the focus to the
   control that opened it. The only stored shape in reach is the pin (`dhloot.home.v1`):
   the pin item toasts «Приложение будет открываться на этом разделе» and returns the focus
   to «Ещё». Failed account writes, a conflict and a stale tab need a signed-in account.
3. Consistency: checked - rules 4 (the lit pill and the tab title name the mode: «Альтернативные
   таблицы - Генератор лута Daggerheart»), 5 (toast words), 7 (one `h1` on every route,
   error pages included), 12, 14 (N4 fails), 20 (focus: «Снять выделение» to «Выбрать»,
   «Отмена» to «Печать», Escape on the add-to-list menu to its toggle, a mode switch keeps the
   focus on the lit pill or the menu button, a menu pick returns it to «Ещё»), the Head Order
   Rule at 768, 1000 and 1180 px (N1 fails), the Search Head Rule (the count line «Расходники ·
   Показано 43 из 48» at the end of the kind row; the first result stays at 257.0 px after a
   pick), the Check Rule (a gold kind chip and the neutral «Все» both draw the check), and
   the sibling roll leads (N2) and homebrew heads (N5) fail.
4. RU/EN parity: checked - every lead, menu item, toast, error page, sign-in prompt and help
   panel on the routes above in both languages: the same facts, ASCII punctuation in the app,
   «ёлочки» in Russian. One defect, in both languages: the static page titles (N4). Plural
   sets were not in reach signed out.

Owner rules: checked - the owner-dated rules of `DESIGN.md` against production: the
Phone-First Rule (40 px up to 600 px, 24 px from 601 px: B2 fails, every other control
passes after a full sweep at 320-1440 px with the footer and the named exceptions excluded),
the Reading Time Rule (a notice 4012 ms, an error 7000 ms, a pointer on the toast pauses it:
3500 ms of hover gave 7537 ms in total; a newer notice replaces a notice), the Head Order Rule
(N1), the First-Screen Rule (B1; `/roll/std` 322.7 px at 360x640 inside its 325 px exception;
`/tables/*` 333.6 px at 768x1024 and 900x720 inside the 336 px hold), the Local Font Rule
(the two woff2 files load from `/assets/`, `document.fonts` reports Source Sans 3 Variable
loaded for Latin and Cyrillic, no other origin). `context.md` was not read, per the dispatch.

Other results, no finding: axe reports no violation on 12 routes at 360 and 1180 px, RU and
EN, and on the static pages; text measure holds (help passages 67-70ch, leads at most 120ch,
the dossier text in its 80ch column, the license 68-69ch, a toast at most `min(120ch,
100% - 32px)`); the add-to-list menu signed out draws «Списки» and «Новый список» alone, and
«Новый список» opens «Войдите, чтобы создать список.» with «Войти» focused.

## Suggested next action

Send B1, B2 and the local nits N1-N6 to one implementer batch: B1 needs the owner's choice
between a shorter Russian lead and a named exception (recommended: the shorter lead, because
it keeps the rule without an exception); B2, N1, N4, N5 and N6 are CSS or string changes. Add
the signed-out `/account` row to `FIRST_SCREEN`, narrow the `inline` target allowance, re-run
`npm run check:fast`, push, and let CI's green run gate the squash. File N7-N9 in the handoff's
Deferred.

## Checks still needed

- Signed in, against the hosted test project (not production): `/lists` cards and the import,
  an account list's page (the 330 px side column from 1000 px, the notes, the price switch,
  the roll panel, the requests, the share panel), the list caps at the limit, one past it and
  at 3x, at 360 and 1180 px.
- `/s/<token>` with a live token: the head, the search row, its 309 px First-Screen exception
  at 360x640 and the 312 px one at 1180x720 with a 120-character name.
- The print page `/p/<id>` with a real set: the crumb head, the dock up to 760 px, the phone
  preview at 420 px, the toolbar from 761 px.
- `/homebrew` signed in: the four pills with counts, the pin, the primary.
- A touch-device run (the hidden header, overlay scrollbars) on a real phone or with touch
  emulation.
- Confirmation that the deployed build equals the reviewed sha (no version string on the page).
