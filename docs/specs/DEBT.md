# DEBT.md - live defects and decisions kept over the rewrite's own

The third category beside `VISUAL_DEBT` and `ACCEPTED` (`tests/parity/specs.js`,
`docs/parity.md`). A `VISUAL_DEBT` entry is a pixel difference not yet
reproduced; an `ACCEPTED` entry is a difference kept on purpose, keyed and
enforced. Neither can hold a defect the rewrite reproduced *because the live
app has it*: there is no difference to key, both apps are identical by
construction, and the harness will never mention it. This file holds that -
and it is the one of the three that outlives the migration; the other two are
deleted with the harness.

An entry is written in the batch that makes the decision, never later. The
batch that pays an entry off deletes it - the same ratchet culture as
`VISUAL_DEBT`.

## Defects reproduced on purpose

The live app is wrong; the rewrite copies it; parity was the reason.

### D1 - transitions run under `prefers-reduced-motion: reduce`

- **Where**: `app/src/styles/tokens.css` - no reduced-motion block, by
  design (a comment marks the place). Live: `style.css:311`
  `@media (prefers-reduced-motion:reduce){.card{animation:none}}` and
  `:544` `@media (prefers-reduced-motion:reduce){.tsection.flash{
  animation:none;outline:2px solid var(--gold)}}` - the only two
  reduced-motion rules in the live stylesheet; every `transition:` (`.btn`
  232, `.row` 550, `.chip` 159, `.tsec-link` 531 and twenty-odd more) and
  the `pop`/`toastIn` animations on the help box (134), the menu (435),
  the modal (591) and the toast (606) stay live. Read at `bb61db0`.
- **Live behaviour**: a person who has asked their system for less motion
  still gets every 150 ms colour, width and position ease on hover,
  press and breakpoint, the toast's slide-in, the menu's and the modal's
  pop. Only the card's entrance and the section outline's fade are off.
- **What the rewrite would do instead**: a real policy - the blanket
  kill it shipped with until B9 (`animation-duration: 0.01ms`,
  `animation-iteration-count: 1`, `transition-duration: 0s`,
  `scroll-behavior: auto`, all `!important` on `*`) or a narrower one,
  designed with `PrintCard.svelte`'s `fit()` in mind: a non-zero blanket
  `transition-duration` starts a `CSSTransition` whose value at t=0 is
  the old one and breaks the synchronous read-back (B7).
- **Why parity won**: the harness photographs both apps under reduced
  motion. With every transition killed the rewrite is not adjusted by
  Chrome's scroll anchoring when the width sweep crosses 600 px and the
  live app is - 6 px on `#/tables/core_item ~ row anchor @ 375`, both
  languages, proved by injection both ways (B8, `issues/47/context.md`,
  "B8 planning facts"). The owner chose full parity over the rewrite's
  invented improvement (2026-09-11). **The blanket kill in `tokens.css`
  was deleted in B9 - this entry is not: it stays open, the real policy
  is owed at Phase 8, and only that fix deletes D1.**
- **How to verify the fix**: this is the register's own category, so the
  check has to survive the harness that photographed the original
  problem, not depend on it. Toggle Chrome DevTools' rendering emulation
  ("Emulate CSS media feature `prefers-reduced-motion`" -> `reduce`) by
  hand, hover a button and change the viewport width, and confirm
  `document.getAnimations()` reads empty against whatever the real policy
  keeps alive - or, if the policy is componentised the way D1's
  `RecordCard`/`TablesPage` rules are, a Vitest assertion against each
  component's own reduced-motion CSS block (`getComputedStyle` inside a
  mocked `matchMedia`) is the one that runs on every `npm run check`
  rather than by hand. Either way: `#/print/ci1-q1` still fits (the
  `print` suite's geometry, while it exists) and the first cards keep
  their art; `FEATURES.md`, "Chrome", reduced-motion bullet rewritten.
- **Recorded by**: B9, 2026-09-11.

### D2 - a stale packed-link expansion rewrites the address after the reader has left

- **Where**: `app/src/state/app.svelte.ts`, `#expand()` - the `.then`
  replaces the address unconditionally. Live: `app.js:3589-3603`
  `expandHash()`: `unpackPayload(h.slice(2)).then(function (plain) {
  if (history.replaceState) history.replaceState(null, '',
  appUrl('#/l/' + plain)); else location.hash = '#/l/' + plain;
  render(); })`. Read at `bb61db0`.
- **Live behaviour**: open a `#/l/~...` link, navigate away before it has
  unpacked (a slow device, a large list), and the unpack, resolving late,
  sends you back to the shared list.
- **What the rewrite would do instead**: drop the result when the route
  is no longer the packed address it was unpacking (compare the payload
  captured at start with `this.route` at resolve time).
- **Why parity won**: B5.6 (2026-09-11) ported the live shape; its review
  named the flaw and said it must not be fixed without recording the
  divergence. Nothing pins it: the harness's `ready()` blocks until the
  expansion is done, so no state can observe the window.
- **How to verify the fix**: `app.test.ts` - a `compress` port whose
  `unpack` resolves on demand; `go()` elsewhere before it resolves; the
  hash stays where the person went. `STATE.md`, "The list migration" or
  `FEATURES.md`, "Lists", one clause.
- **Recorded by**: B9, 2026-09-11 (found by the B5.6 review).

### D3 - the storage notice's dismiss button lives inside its `<summary>`

- **Where**: `app/src/components/StorageNotice.svelte:43-50`, a
  `<button class="warn-x">` inside `<summary>`; `app/src/test/a11y.ts`'s
  `expectNoA11yViolations(container, { allow })` disables axe's
  `nested-interactive` rule only for the call sites that actually render the
  notice - `listsPage.test.ts`, `listPage.test.ts`, `a11y.test.ts`'s two
  list-page states, each with a `D3` comment (narrowed from a suite-wide
  disable at B12, so every other component is still checked against the
  rule); `tests/app/lib.js`'s `axe()` helper does the same over the built app,
  for the same two routes.
  Live: `app.js:2881-2884` `'<details class="warn"><summary>' + '<b>' +
  ... + '<button type="button" class="warn-x" data-act="hideWarn" ...
  >&times;</button>'`, with the comment "The cross lives inside the
  summary: a closed <details> hides everything else, which would leave
  nothing to dismiss it with." Read at `bb61db0`.
- **Live behaviour**: a screen reader lands on a summary that is also a
  button; activating the cross toggles and dismisses in one gesture on
  some assistive technology, and the nested-interactive shape is a WCAG
  4.1.2 failure axe reports on any page it runs on.
- **What the rewrite would do instead**: a notice that is a region with
  its own "read more" toggle and a sibling dismiss button, or the cross
  outside the `<details>`; then `nested-interactive` back on for the
  whole suite (the per-call override the B5.3 review suggested is the
  interim shape if only this component needs it).
- **Why parity won**: B5.3 (2026-09-10) ported the live markup so the
  `#/lists` states compare pixel for pixel; the rule was switched off
  rather than the markup changed.
- **How to verify the fix**: no call site passes `{ allow: ['nested-interactive'] }`
  to `expectNoA11yViolations` and `tests/app/lib.js`'s `axe()` allows nothing
  for `#/lists`/`#/lists/a`; every `#/lists` state in the post-cut-over net
  still passes with the rule fully on. `FEATURES.md`, "Lists", the
  storage-notice bullet.
- **Recorded by**: B9, 2026-09-11 (found by the B5.3 review). Narrowed from a
  suite-wide disable to per-call sites at B12, 2026-09-12.

### D5 - a record page's tab title loses the record's name

- **Where**: `app/src/components/Shell.svelte:28` - the rewrite's only
  `document.title` write, `app.t.docTitle` on every route. Live:
  `app.js:3795` `document.title = (it ? nameOf(it) + ' — ' : '') +
  t().docTitle;` in `render()`'s `i/` branch, then `app.js:3822`
  `syncChrome();`, whose last line (`:3658`) is `document.title =
  t().docTitle;` - every render ends by writing the plain title over the
  name. Read at `b967481`.
- **Live behaviour**: the tab and a bookmark of `#/i/<id>` read "Генератор
  лута — Daggerheart" (or the English), never the record's name; the name is
  written and overwritten inside one render.
- **What the rewrite would do instead**: title a record page `<name> —
  <docTitle>` in the current language - what line 3795 intends - and keep
  the plain title everywhere else.
- **Why parity won**: B10 (2026-09-11), found while porting the not-found
  page. The harness's `title` spec compares `page.title()` on every state,
  and `#/i/ci1 @` reads a match on all six cells because both apps end on
  the plain title; writing the name would fail that spec on `#/i/ci1`,
  `#/i/q1`, `#/i/f1` and `#/i/ci1 ~ whole` without an `ACCEPTED` key per
  cell.
- **How to verify the fix**: `record.test.ts` - after rendering `#/i/ci1`,
  `document.title` starts with the record's name in the page's language and
  follows a language switch; `#/i/nope` keeps the plain title. If the
  harness is still alive, the four record states' `title` cells get
  `ACCEPTED` keys; after the cut-over, nothing. `FEATURES.md`, "Records",
  the tab-title clause rewritten.
- **Recorded by**: B10, 2026-09-11.

### D6 - the add-to-list menu's flip measures the window, not the card, and re-measures against the wrong button

- **Where**: `app.js:3695-3704` `placeMenu` (`$('.dropmenu')`,
  `drop.querySelector('.btn')`, `innerHeight - btn.bottom` against
  `menu.height + 16`, `scrollIntoView({ block: 'nearest' })`), run after
  every render (`app.js:3824`); the port `AddToList.svelte`'s placement
  `$effect`; `.card{overflow:hidden}` at `style.css:306` /
  `RecordCard.svelte:260`. One reading is unsettled rather than untrue: the
  live app re-inserts the `.dropmenu` markup on every render, so
  `animation: pop .16s ... both` restarts and `placeMenu` measures a menu
  still at `translateY(10px) scale(.985)`, while the port's menu element
  persists across the "+ Новый список" re-measurement and is taken at rest -
  same side basis, an unmeasured ~10 px against a 17 px band, never observed
  as a defect. Phase 8's toggle measurement (`:scope > .btn`) sits outside
  the animated menu and genuinely retires the question, which is why B12
  records rather than settles it - see "How to verify the fix".
- **Live behaviour**: on a tall window a short card's menu opens downward
  inside the modal, overflows the `.card` article, and `scrollIntoView`
  scrolls that `overflow: hidden` article (measured `scrollTop` 109 at
  1913x981 and 1100x900, Кольцо Тишины, no lists) - the top of the picture
  is chopped with no scrollbar and no way back; pressing "+ Новый список"
  redraws the card and flips the menu up because the first `.btn` is then
  the form's own "Создать", under the fold from the default side - which is
  what heals it.
- **What the rewrite would do instead**: measure the toggle
  (`:scope > .btn`) against the nearest clipping box (`.modal-card`), and
  make `.card` `overflow: clip` so a programmatic scroll cannot move its
  content (check the rounded corners still clip).
- **Why parity won**: B11.1 (2026-09-12) - every `~ list menu` /
  `~ new list` cell compares the side and the article's scroll; the correct
  measurement flips `#/i/ci1 ~ new list` and the new modal state against the
  live app with no `ACCEPTED` home for a whole-menu difference.
- **How to verify the fix**: `tests/app/states.js` - after opening the menu
  in the modal on Кольцо Тишины at 1100x900 with no lists, `.card.scrollTop`
  is 0 and the menu's box lies inside `.modal-card`'s; after "+ Новый
  список", the input's box lies inside `.modal-card`'s and is focused;
  `#/i/ci1 ~ new list` is re-read by the same instrument.
- **Recorded by**: B11.1, 2026-09-12.

### D7 - the muted-text tokens fail WCAG AA contrast on their dark backgrounds

- **Where**: `style.css` `--muted` (`#77708c` on `--surface` `#1a1626`,
  measured 3.77:1) and `--muted2` (`#6e6884`/`#6d6782` on `--surface`/
  `--surface2` `#1a1626`/`#14111d`, measured 3.35:1 and 3.46:1) - both need
  4.5:1 at their font sizes (10.5px, under the 18.66px/14pt-bold large-text
  threshold). Ported: `AltPanel.svelte`'s rank subtitle (`Chip.svelte`'s
  optional `sub` prop, a `<small>` after the label - off `.chip small` in
  style.css, `opacity:.72`) and `ListPage.svelte`'s note-pair hints
  (`notePubHint`/`noteHidHint`, `app/src/lib/dict.ts:309-310`; rendered as
  `<i>{t.notePubHint}</i>`/`<i>{t.noteHidHint}</i>` at `ListPage.svelte:538`
  and `:556`, inside `.lnote > .npair > .nfield.n-pub > .nlbl > i` and its
  `.n-hid` sibling). Read at `a52c17d`, `tests/app/sweep.js`'s axe pass
  (B12).
- **Live behaviour**: `axe.run()` with `color-contrast` on reports the
  identical node, at the identical measured ratio, against `index.html` and
  `dist/index.html` alike - the two muted tokens have always read below AA on
  a dark background, on both apps, at every width (contrast is not a function
  of layout).
- **What the rewrite would do instead**: lighten `--muted`/`--muted2` (or the
  two surfaces they sit on) until both combinations clear 4.5:1, checked
  against every other place the tokens are used - a global colour change, not
  a per-component one.
- **Why parity won**: B12 (2026-09-12) - the tokens are shared globally
  (`styles/tokens.css`), so changing either for these two call sites alone
  would either diverge from the live app's exact colours (parity's whole
  reason to exist) or require a value the live app itself never uses. Not
  found earlier because no gate ever ran real contrast measurement against
  either app before B12's sweep.
- **How to verify the fix**: `tests/app/sweep.js`'s axe pass finds no
  `color-contrast` violation on `#/roll/alt` (checked - `#/roll/wondrous`,
  `#/roll/community`, `#/roll/voa` and `#/roll/std` carry no such subtitle
  and read clean already) or `#/lists/<id>` with a note open on some entry -
  the trigger is a NOTE, not a price: `#/lists/b` and `#/lists/empty` read
  clean because they carry no note, not because they carry no price - with
  no `allow` naming it; the `--muted`/`--muted2` values in `docs/specs/*` (if
  any cite them) updated to match.
- **Recorded by**: B12, 2026-09-12.

### D10 - copying an image taints the canvas under `file://`, on both apps

- **Where**: `app/src/ports/image.ts`'s `pngOf` (`<img>` -> `<canvas>` ->
  `toBlob('image/png')`) and the live app's equivalent bitmap conversion for
  "Скопировать изображение" - both draw the record's own `<img>` (loaded from
  a relative `img/*.webp` path) onto a canvas and then read it back. Read at
  `a52c17d`, isolated in the scratchpad against both `dist/index.html` and
  `index.html` directly (`puppeteer.launch()`, no other stub involved) -
  `img.onload` fires and `ctx.drawImage()` succeeds on both apps, but
  `canvas.toDataURL('image/png')` throws `"Tainted canvases may not be
  exported"` on both, for the identical image, with and without
  `--disable-gpu`. `canvas.toBlob('image/png')` does not throw at all in this
  Chromium build - it never calls its callback, which is what made this
  invisible before: `tests/app/driver.js`'s `clipboardImage()` reads
  `m[key].arrayBuffer ? m[key] : null` and a *pending promise* has no
  `.arrayBuffer`, so it always resolved `{ empty: null }` on both apps -
  parity's own `copiedImage` spec has been comparing two identical `null`s,
  never a real byte count.
- **Live behaviour**: a `file://` document's own resources are treated as
  cross-origin by Chrome's canvas taint check (no
  `--allow-file-access-from-files`), so drawing the record's own picture -
  loaded from the very same folder the document opened from - taints the
  canvas regardless. "Скопировать изображение"/"Copy image" therefore cannot
  actually put a picture on the clipboard when the app is opened as a folder
  - the one HTML-file-serving mode `docs/specs/META.md` names as supported -
  though the button still shows, presses, and (on the live app) reports
  success text, because nothing there reads the canvas back to know it
  failed.
- **What the rewrite would do instead**: catch the failure (a rejected
  `pngOf`, or a `toBlob` watchdog timeout) and fall back to `copyText`'s
  path with a toast that says why - the way `RecordActions.svelte` already
  does when `it.img` is empty - rather than reporting success (or, for
  `tests/app/states.js`'s purposes, hanging) on a picture that never left
  the canvas.
- **Why parity won**: not caught before B12 - `clipboardImage()`'s own
  `empty: null` result satisfied every prior reading, on both sides alike,
  and nobody had awaited the promise itself until `tests/app/states.js`'s
  copy-image case did.
- **How to verify the fix**: `tests/app/states.js`'s copy-image case reads a
  real, non-empty blob size (or, if the fallback is chosen, real text) with
  no bounded-timeout retry needed; `src/ports/image.ts`'s coverage exclusion
  in `vite.config.mts` gains a real assertion on the rejection path.
- **Recorded by**: B12, 2026-09-12 (found while writing `tests/app/states.js`'s
  copy-image case - the suite's own real unknown, not the step 1 probe's).

### D8 - the alternate-tables page jumps from `<h1>` straight to `<h4>`

- **Where**: `TableRows.svelte`'s `.altcol` column headers
  (`<h4 class="altcol hope">`/`<h4 class="altcol fear">`, one pair per
  rarity section on `#/tables/alt_item` and `#/tables/alt_consumable`) sit
  directly under the page's own `<h1>` with no `<h2>`/`<h3>` between them.
  Ported: the live markup carries the identical `<h4>` with no intervening
  level either (`app.js`'s alt-table renderer). Read at `a52c17d`,
  `tests/app/sweep.js`'s axe pass (B12).
- **Live behaviour**: `axe.run()`'s `heading-order` rule (moderate) reports
  the same `<h4 class="altcol hope">Надежда</h4>` node against both apps - a
  screen reader's heading list jumps two levels at the same place on either
  one.
- **What the rewrite would do instead**: give each rarity section its own
  `<h2>`/`<h3>` (the section title already drawn as plain text) and demote
  the column pair to `<h4>` under it, or promote the columns to `<h2>` and
  drop the empty levels between - either heals the sequence without
  inventing a heading nobody reads today.
- **Why parity won**: B12 (2026-09-12) - the heading level is part of the
  ported DOM structure `CLAUDE.md`'s "Migration and parity" asks for; only
  Phase 7/8's structural review is positioned to change it without touching
  a pixel the parity harness still measures.
- **How to verify the fix**: `tests/app/sweep.js`'s axe pass finds no
  `heading-order` violation on `#/tables/alt_item`/`#/tables/alt_consumable`
  with no `allow` naming it.
- **Recorded by**: B12, 2026-09-12.

## Live decisions kept over the rewrite's own

Not a defect; a design the rewrite argued against and lost to parity.
Re-examined at Phase 8, and either kept (entry deleted, `FEATURES.md`/
`STATE.md` say so) or changed.

### D4 - one kind filter shared by Core rules, the alternate tables and search

- **Where**: `app/src/state/app.svelte.ts`, `kinds`/`toggleKind`, memory
  only, untouched by navigation. Live: `S.kind`, one object - the
  kind chips flip it (`app.js:4162` `S.kind[val] = !S.kind[val]`) and
  `kindAllows()` (2132), the alternate-table pickers (2286-2293) and
  `renderSearch` (2841) all read it. Read at `bb61db0`.
- **Live behaviour**: switching consumables off on Core rules switches
  them off on the alternate tables and on search too.
- **What the rewrite would do instead**: a kind filter per page, which
  is what `docs/specs/STATE.md`'s own rule argues for ("what was asked
  on a page belongs to the page") and what the rewrite shipped until B6.
- **Why parity won**: B6 (2026-09-11) moved it to `AppState` as the live
  shape - `plan.md`, "The kind filter: per panel first, then per app".
  No parity state navigates between two roll modes, so neither shape
  is measured; parity won as the default, not as a finding.
- **How to verify the fix**: if per-page wins at Phase 8, `app.test.ts`
  loses `kinds` and each page's test pins its own; `STATE.md`, "The
  in-memory state object", says which. If the live shape is kept, delete
  this entry and write the sharing down in `FEATURES.md`, "Rolling".
- **Recorded by**: B9, 2026-09-11.
