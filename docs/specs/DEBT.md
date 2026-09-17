# DEBT.md - live defects and decisions kept over the rewrite's own

The third category beside `VISUAL_DEBT` and `ACCEPTED`, which lived in
`tests/parity/specs.js` and `docs/parity.md` until R0c deleted them along with
the rest of the parity harness (issue 47, `23c00a6`). A `VISUAL_DEBT` entry was
a pixel difference not yet reproduced; an `ACCEPTED` entry was a difference
kept on purpose, keyed and enforced. Neither could hold a defect the rewrite
reproduced *because the live app had it*: there was no difference to key, both
apps were identical by construction, and the harness never mentioned it. This
file holds that - it is the one of the three that outlives the migration; the
other two were deleted with the harness.

An entry is written in the batch that makes the decision, never later. The
batch that pays an entry off deletes it - the same ratchet culture as
`VISUAL_DEBT`.

**The live sources were deleted at R0c (`23c00a6`)**; `git show
23c00a6^:app.js` (or `:style.css`, `:index.html`) reads them at their final
state. A line citation below with no other hash refers to that state; a
citation naming its own hash (`bb61db0`, `b967481`, `a52c17d`, `dc99f21`) was
read at that commit specifically. Verified before this sentence was added:
`git show bb61db0:app.js` around lines 3589-3603 matches D2's quote below.

## Defects reproduced on purpose

The live app was wrong; the rewrite copied it; parity was the reason.

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

### D11 - campaign-frame equipment hides a tier the identical Core item prints

- **Where**: live `app.js:597` `isFrameRecord(it)` guards six sites - `:612`
  (the stat line's tier word), `:856` (`lineStepsHTML`, the tier ladder),
  `:931` (the tier label), `:957` (the source label, which switches to
  `whereFrom`), `:3227` (the ` · Ранг N` suffix) and `:3385` (the print
  card's tier). The rewrite reproduces all six: `app/src/lib/label.ts:33`
  and `:111`, `RecordCard.svelte:86,177`, `RowMain.svelte:78`,
  `TableRows.svelte:84`, `RecordPage.svelte:52`, `PrintCard.svelte:34`,
  `share.ts:90`, `search.ts:34`. Read at `dc99f21`.
- **Live behaviour**: a record with `frame` set or `src === 'frame'` never
  shows its tier anywhere, even when `eq.tier` is present in `data.js`. 95
  records are frame records; **92 of them carry an `eq.tier` that is never
  drawn**.
- **Why this is filed as a defect rather than a presentation rule**: the two
  populations are not distinguishable by anything the reader can see.
  `f33` "Quilted Clothing" (`items.frames`) is `tier 1, armorScore 3,
  thresholds 5/11`. `q313` "Gambeson Armor" (`L.eq`, the equipment tables) is
  `tier 1, armorScore 3, thresholds 5/11`. **Identical armour, identical
  tier; one prints it and one hides it**, and the only difference is which
  table catalogues the record. The rule is also not "tier belongs to rollable
  loot": `#/tables/eq_weapon` is a browse surface, not a roll table, and it
  prints tiers throughout.
- **What the rewrite would do instead**: not settled, which is the point of
  the entry. Either print the tier for frame equipment as for any other
  equipment, or keep suppressing it and state a reason a reader can check.
- **Why parity won**: R0b.4 (2026-09-16). The batch's own subject was the
  opposite defect - the rewrite *keeping* a tier word the live app drops in
  four `eqLine` consumers (`share.ts`, then `search.ts` as a fifth
  divergence found in review) - and the owner answered **restore** on all
  five, matching live. Whether live is right was a separate question, raised
  by the owner in the same session and deliberately not answered inside a
  parity batch.
- **What is NOT known, and must not be re-asserted as if it were**: the
  reason. The repository records the mechanism at seven sites and no
  justification anywhere. `label.ts:33`'s comment ("presented as setting
  material even when a starter (notably `f95`) carries ordinary equipment
  metadata too") asserts intent without evidence, and was mistaken for an
  explanation once already in this session. `docs/specs/CONTRACTS.md:36`
  records only that the `f` prefix means "Campaign frame equipment".
- **How to verify the fix**: whichever way it goes, `f33` and `q313` must
  stop disagreeing without a stated reason. If the tier is printed:
  `record.test.ts` asserts a frame record's stat line carries the tier word,
  `search.test.ts`'s D11 case (added in `676629d` for the opposite claim) is
  inverted, and the six live sites' rewrite counterparts drop the guard
  together - a partial fix reintroduces exactly the inconsistency R0b.4
  closed. If suppression is kept: `FEATURES.md`'s campaign-frame line gains
  the reason, and this entry is deleted in that commit.
- **Recorded by**: the repository owner, via the orchestrator, R0b.4's
  review remediation, 2026-09-16. Raised by the owner against the
  orchestrator's own wrong explanation, which claimed tier was suppressed
  because frames are not rollable.

## Divergences found at the deletion (R0c sweep), owed a decision at Phase 8

Commissioned by the repository owner before R0c's deletions (`issues/47/
context.md`, decision 11, 2026-09-16): one more deliberate pass over
everything the migration deletes, read against `app/src/` for behaviour no
surviving instrument would notice. Full record: `issues/47/sweep.md`, read at
`7a33c22`. **None of these blocked the deletion** - the owner's ruling was
that a finding here is recorded, not fixed, in R0c; reviewing and addressing
each is Phase 8 work. Unlike section 1, these are not known to be *deliberate*
parity choices - they are accidental losses or additions the sweep caught
because no instrument (pixel diff, axe, a registered state) could see them,
the same shape R0b.4's five divergences had.

### D12 - the money picker's current chip loses `aria-current`, gains `aria-pressed`

- **Where**: `app.js:2959` (`7a33c22`): `'<button type="button" class="chip' +
  (m === cur ? ' on' : '') + '"' + ' data-money="' + esc(l.id) + '" data-val="'
  + m + '"' + (m === cur ? ' aria-current="true"' : '') + '>'`. Rewrite:
  `app/src/components/Chip.svelte:65` `aria-pressed={on}` on every chip
  button, including the money picker's.
- **Live behaviour**: the selected money mode carries `aria-current="true"`;
  the other modes carry no state attribute at all.
- **What the rewrite does instead**: every chip, money picker included,
  carries `aria-pressed="true"`/`"false"` on both the selected and
  unselected buttons - the same attribute the rest of the app's chips use.
- **Why it was recorded, not restored: owner ruling 2026-09-16.** No
  registered state, golden or unit test reads either attribute
  (`docs/specs/COVERAGE.md`, "The harness" - `d.controls()` never reads
  `aria-pressed`/`aria-current`), so nothing measured the money picker as a
  special case before the sweep.
- **How to verify the fix**: decide whether the money picker should read as a
  `radiogroup`-like "current" control (`aria-current`) or a togglable set
  (`aria-pressed`, what `Chip.svelte` already gives every other chip); a
  `listPage.test.ts` assertion on the attribute the decision picks.
- **Recorded by**: the R0c sweep, 2026-09-17 (Part A).

### D13 - copying a set of roll options toasts the generic text-copied message, not its own

- **Where**: `app.js:4142` (`7a33c22`): `if (items.length) copyRich(rollHtml(items),
  rollText(items), t().rollCopied);` - `T.ru.rollCopied` = `Варианты
  скопированы` / `T.en.rollCopied` = `Options copied`, distinct from
  `textCopied`. Rewrite: `app/src/components/StdPanel.svelte:65-69` and
  `AltPanel.svelte:92-96` both toast `t.textCopied` (`Текст скопирован`) after
  the same copy.
- **Live behaviour**: copying a set of roll options (the "Скопировать все
  варианты" button) shows a toast worded for that specific action.
- **What the rewrite does instead**: shows the same toast every other
  copy-text action uses. The button still copies the right content; only the
  confirmation wording is generic.
- **Why it was recorded, not restored: owner ruling 2026-09-16.** No test
  asserts the toast's exact wording after this button (`std.test.ts` and
  `alt.test.ts` check that a toast fires, not which one), so nothing caught
  the substitution.
- **How to verify the fix**: add `rollCopied` to `app/src/lib/dict.ts` and
  call it from both panels; `std.test.ts`/`alt.test.ts` assert the toast text
  after the copy-roll button.
- **Recorded by**: the R0c sweep, 2026-09-17 (Part B).

### D14 - the copy-image download fallback does not exist

- **Where**: `app.js:1717-1726` (`7a33c22`): `function downloadImage(it){
  imageBlob(it).then(function (blob) { const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = safeFileName(it); ...
  toast(t().imgSaved); }).catch(function () { toast(t().imgFailed, true); });
  }` - `copyImage`'s `catch`/unsupported branch calls it
  (`app.js:1731-1739`). Rewrite: `app/src/components/RecordActions.svelte:57-61`
  calls `copyFailed` and stops; `app/src/ports/image.ts` and `dict.ts` carry
  no `imgSaved`/`imgFailed` keys and no `<a download>` path.
- **Live behaviour**: a browser that cannot (or refuses to) write an image to
  the clipboard still lets the person save the record's picture as a PNG
  file, with its own success/failure toast.
- **What the rewrite does instead**: reports a generic copy failure and
  offers no way to get the picture at all.
- **Why it was recorded, not restored: owner ruling 2026-09-16.** The whole
  fallback path is missing rather than differently worded, so no instrument
  that only checks "a toast fired" could have found it; it surfaced only by
  reading `app.js`'s function bodies against the port.
- **How to verify the fix**: `app/src/ports/image.ts` gains a
  download-to-file path (`<a download>` or the File System Access API where
  available) wired to `RecordActions.svelte`'s unsupported/failed branch,
  with its own toast pair; a component test drives the fallback and asserts
  a download was triggered.
- **Recorded by**: the R0c sweep, 2026-09-17 (Part B).

### D15 - the picture-unavailable toast is the same generic failure as every other copy error

- **Where**: `app.js:1725` (`7a33c22`): `downloadImage`'s own `.catch`
  toasts `t().imgFailed` (`Не удалось получить картинку` / `Could not load
  the image`), distinct from `copyFailed`. Rewrite:
  `app/src/components/RecordActions.svelte:60` toasts `t.copyFailed` for
  every failure mode.
- **Live behaviour**: "the clipboard refused the image" and "the picture
  itself could not be read" are two different toasts.
- **What the rewrite does instead**: one generic `copyFailed` message for
  every image-copy failure.
- **Why it was recorded, not restored: owner ruling 2026-09-16.** Rides with
  D14 - the same missing fallback path is where this distinction would live;
  recorded separately because it is a wording loss even if D14's fallback is
  never restored.
- **How to verify the fix**: settled together with D14 - if the fallback is
  restored, its failure branch gets its own `imgFailed`-equivalent toast,
  distinct from `copyFailed`.
- **Recorded by**: the R0c sweep, 2026-09-17 (Part B).

### D16 - the toast's live region exists only while a toast is showing

- **Where**: `index.html:92` (`7a33c22`): `<div class="toast" id="toast"
  role="status" aria-live="polite" hidden>` - `role` and `aria-live` are on
  the element from first paint and `showToast` (`app.js:993-995`) only
  rewrites them to `alert`/`assertive` for an error; they are never removed.
  Rewrite: `app/src/components/Toast.svelte:61-62`
  `role={app.toast ? (...) : undefined} aria-live={app.toast ? (...) :
  undefined}` - both attributes disappear when `app.toast` is `null`, by
  design (`Toast.svelte:13-16`: otherwise a component test's
  `getByRole('status')` would match the idle toast).
- **Live behaviour**: the live region is always present, so a screen reader
  has already registered it before the first toast fires.
- **What the rewrite does instead**: creates the live region at the same
  moment the text arrives, which some assistive technology announces less
  reliably than a region that pre-exists.
- **Why it was recorded, not restored: owner ruling 2026-09-16.** Exactly the
  R0b.4 shape: an axe run cannot report a live region as *missing* only while
  idle, and the goldens photograph an empty toast either way, so nothing
  short of reading the two sources side by side could catch it.
- **How to verify the fix**: keep `role="status" aria-live="polite"` on
  `Toast.svelte`'s wrapper unconditionally and switch only `aria-live` to
  `assertive`/`role="alert"` for an error, then adjust the component tests
  that relied on the idle element being absent from the accessibility tree.
- **Recorded by**: the R0c sweep, 2026-09-17 (Part F).

### D17 - the card image's hover zoom is unconditional on live, guarded and narrowed on the rewrite

- **Where**: `style.css:321,326` (`7a33c22`): `.card-media:hover
  img{transform:scale(1.05)}` and `.card.full .card-media:hover
  img{transform:none}` - no `hover:hover` media guard, and every card
  (`.compact` and `.full` alike) zooms on hover; `.full` cancels it
  explicitly. Rewrite: `app/src/components/RecordCard.svelte:323-327` wraps
  the zoom in `@media (hover:hover)` **and** narrows it to `.card.compact`
  only.
- **Live behaviour**: on a touchscreen with no real hover, a tapped `.full`
  card still leaves its art visibly scaled (the touch counts as a
  hover-and-hold); on any pointer, a `.full` card's zoom is explicitly
  cancelled.
- **What the rewrite does instead**: no touch device ever scales any card's
  art (the `hover:hover` guard live lacks here, though it uses the guard
  elsewhere for `.tile`), and a `.full` card never has zoom to cancel in the
  first place because only `.compact` opts in.
- **Why it was recorded, not restored: owner ruling 2026-09-16.** A resting-state
  pixel diff cannot see a `:hover` rule at all, and no golden or parity state
  hovers or long-presses a card image.
- **How to verify the fix**: decide whether the guard and the `.full`
  narrowing are wanted (they read as an improvement, not a bug) or should
  match live exactly; either way, a `record.test.ts`/CSS assertion pins the
  chosen behaviour and `FEATURES.md` states it.
- **Recorded by**: the R0c sweep, 2026-09-17 (Part C).

### D18 - the keyboard focus ring reaches more elements, and at a different radius, than the live list

- **Where**: `style.css:999-1005` (`7a33c22`): a closed list of 18 selectors
  (`.btn`, `.chip`, `.tabs a`, `.helpbtn`, `.homebtn`, `.fpill`, `.fclear`,
  `.flink`, `.row-main`, `.tile`, `.lrow-acts button`, `.row-x`, `.warn-x`,
  `.toast-act`, `.seg button`, `.tsec-link`, `.card-name-acts button`,
  `.lrow-grip`) each get `outline:2px solid var(--gold);outline-offset:2px;
  border-radius:8px`. Rewrite: `app/src/styles/tokens.css:150-154` is a
  **global** `:focus-visible` rule at `border-radius: var(--r-sm)` (9px), plus
  five components that re-declare it at 8px for their own controls
  (`RowMain.svelte:120`, `Seg.svelte:83`, `ListPage.svelte:1650-1656`,
  `StorageNotice.svelte:129`, `RecordCard.svelte:337`).
- **Live behaviour**: only the 18 named controls get a gold keyboard ring;
  everything else (card links, `.craft a`, `.itemtable`, `.listcard-main`,
  the four `<summary>` elements, `.selall`, inputs, `main`) falls back to the
  browser's own outline. The 18 named controls' ring has an 8px radius.
- **What the rewrite does instead**: every focusable element gets a gold
  ring (a broader, arguably more consistent, keyboard experience), and the
  ring's radius is 9px except on the five components that override it back
  to 8px.
- **Why it was recorded, not restored: owner ruling 2026-09-16.** `context.md`,
  "Reasons already disproved" already measured the 9-vs-8 radius difference
  and never gave it a spec home; no registered state reaches a keyboard focus
  ring at all (parity and the goldens both photograph a resting page).
- **How to verify the fix**: decide whether the global ring (broader
  coverage) or the closed live list is the wanted policy, and whether 8px or
  `--r-sm` is the intended radius; a `tokens.css` assertion or a per-component
  test pins whichever is chosen, and `FEATURES.md` states it.
- **Recorded by**: the R0c sweep, 2026-09-17 (Part C).

### D19 - the focused skip link is a different colour, box and layout effect

- **Where**: `style.css:1018-1022` (`7a33c22`): `.skip{position:absolute;
  left:-9999px;top:0;z-index:300;background:var(--gold);color:#1a1206;
  font-weight:700;padding:10px 16px;border-radius:0 0 10px 0}
  .skip:focus{left:0}` - a focused skip link becomes a gold plate pinned over
  the page's top-left corner, out of flow. Rewrite:
  `app/src/components/Shell.svelte:80-93`: `.skip{position:absolute;
  left:-9999px}.skip:focus{position:static;display:inline-block;
  margin:var(--gap-sm);padding:8px 12px;background:var(--surface2);
  color:var(--txt);border-radius:var(--r-sm)}` - a grey chip that returns to
  the normal flow when focused, pushing the rest of the page down, with no
  `z-index`.
- **Live behaviour**: pressing Tab once reveals a bright gold plate fixed at
  the corner, layered over whatever else is there.
- **What the rewrite does instead**: reveals a muted grey chip inline at the
  top of the page, which shifts the header down while it is focused.
- **Why it was recorded, not restored: owner ruling 2026-09-16.** Only a real
  keyboard walk (Tab from a fresh load) would show this; no golden, parity
  state or axe run presses Tab before capturing.
- **How to verify the fix**: decide the wanted skip-link presentation and
  match it; a `states.js`-style real-Tab test (or a documented deliberate
  choice in `FEATURES.md`) pins it.
- **Recorded by**: the R0c sweep, 2026-09-17 (Part C).

### D20 - two `@media print` gaps: an open record dialog prints over the page, and an action toast prints

- **Where**: `style.css:1397-1415` (`7a33c22`): `.topbar,.tabs,.foot,#selBar,
  #toast,.noprint,#modal,.skip{display:none !important}` - `#modal` and
  `#toast` are both hidden unconditionally under print media. Rewrite: (i)
  `app/src/components/RecordModal.svelte` carries no print rule, so
  `dialog::backdrop`/the open dialog is not hidden by anything under
  `PrintPage.svelte:173-198`'s print block; (ii) `Toast.svelte:142` hides the
  toast without `!important`, and `.toast{display:none}` (specificity 0,1,0)
  loses under print to `.toast.act{display:inline-flex}` (0,2,0) at
  `Toast.svelte:105`.
- **Live behaviour**: printing a page always hides the record dialog and the
  toast, an action toast included, because the rules carry `!important` and
  cover both ids unconditionally.
- **What the rewrite does instead**: printing while the record dialog
  (`RecordModal`) is open prints the dialog over the page; printing while an
  *action* toast (one with a button, e.g. an undo prompt) is showing prints
  that toast, because its own higher-specificity rule beats the print-hide
  rule with no `!important` to outrank it.
- **Why it was recorded, not restored: owner ruling 2026-09-16.**
  `tests/app/print.js`'s `printMedia` (`:1125-1135`) reads only `header`,
  `nav`, `footer`, `a.skip` and `.printbar` - neither `#modal`'s nor
  `.toast`'s print display was ever in its selector list, so no gate could
  have failed on this.
- **How to verify the fix**: `RecordModal.svelte` gains a print rule hiding
  the `<dialog>`; `Toast.svelte`'s print rule gains `!important` (or enough
  specificity to beat `.toast.act`); `tests/app/print.js`'s `printMedia`
  gains both selectors to its read list so a regression fails loudly.
- **Recorded by**: the R0c sweep, 2026-09-17 (Part C).

### D21 - the print page's black-and-white choice is session memory on live, page-local on the rewrite

- **Where**: `app.js:4257` (`7a33c22`): `if (a === 'printArt') { S.printBW =
  val === 'bw'; render(); return; }` - `S.printBW` is a field on the
  in-memory state object, so it survives leaving `#/print/...` and coming
  back. Rewrite: `app/src/components/PrintPage.svelte:47` `let bw =
  $state(false)` - component-local, reset to colour every time the page is
  entered fresh. The rewrite's own comment at `:41-46` names this a
  deliberate divergence, the same shape as search's `q` and `TablesPage`'s
  `q` (B6).
- **Live behaviour**: choosing black-and-white, leaving the print page, and
  coming back keeps the black-and-white choice.
- **What the rewrite does instead**: the choice resets to colour every time
  the print page is (re-)entered.
- **Why it was recorded, not restored: owner ruling 2026-09-16.** The
  rewrite's own code names this a deliberate choice, but no spec records
  it: `docs/specs/STATE.md:72` still lists `printBW` as live in-memory
  state with no note that the rewrite drops it, and no `DEBT.md` entry
  existed until now.
- **How to verify the fix**: whichever way Phase 8 decides (session memory
  on `AppState`, or keep the page-local reset and document it as a
  deliberate improvement), `STATE.md` and this entry are updated together -
  if kept, this entry moves to "Live decisions kept over the rewrite's own"
  with the reason a reader can check; a `printPage.test.ts` case pins
  whichever is chosen.
- **Recorded by**: the R0c sweep, 2026-09-17 (Part D).

### D22 - the record "send" button never attaches a picture and sends a bare name, not the full share text

- **Where**: `app.js:1746-1768` (`7a33c22`) `sendItem`: three levels - (1)
  with `navigator.canShare`/`File` support, a record with art gets its PNG
  attached via `navigator.share({files:[file], text: shareText(it)})`; (2)
  with a share sheet but no file support,
  `navigator.share({title: nameForShare(it), text: shareText(it), url:
  itemUrl(it.id)})`; (3) with no `navigator.share` at all, the link goes to
  the clipboard. Rewrite: `app/src/components/RecordActions.svelte:68-75`
  calls `app.env.share.share({ title: name, text: name, url: link })` -
  `name` is the record's bare name, not `shareText(it)`'s full stat block -
  and falls back to `copyLink()`.
- **Live behaviour**: sharing a record with art attaches the picture and the
  full stat text; without art, the share sheet still carries the full text.
- **What the rewrite does instead**: never attaches a file (the port's
  `ports/share.ts:34-41` implements the whole `canShare({files})` dance, but
  `RecordActions.svelte:70` is the only caller and never passes a `file`, so
  that branch is unreachable code) and sends only the bare name as the share
  body, never the full share text.
- **Why it was recorded, not restored: owner ruling 2026-09-16.**
  `record.test.ts:493-524` drives the button through a fake share for the
  unsupported/dismissed/failed *paths* and asserts nothing about the
  *payload*, so the missing file and the shortened text were invisible to
  the one test that exercises this button; `docs/specs/COVERAGE.md:300-302,
  399-404` already records that no headless browser exposes a real share
  sheet to drive.
- **How to verify the fix**: `RecordActions.svelte`'s `send()` builds the
  same three-level payload `sendItem` does (full share text always, a file
  when art exists and the environment supports it) and `record.test.ts`
  asserts the payload passed to `app.env.share.share`, not just that a call
  happened.
- **Recorded by**: the R0c sweep, 2026-09-17 (Part D).

### D23 - a list's ticked selection survives Back/Forward to a different list

- **Where**: `app.js:4640-4648` (`7a33c22`) `window.addEventListener
  ('hashchange', function () { closeModal(); S.sel = {}; S.lsel = {};
  S.menuFor = ''; S.newListFor = ''; ...})` - every hash change clears the
  list-page selection (`S.lsel`) along with the tables selection. Rewrite:
  `app/src/state/app.svelte.ts`'s router handler clears `menuFor` and `sel`
  and bumps `navigations` (watched by `TablesPage.svelte:108` and
  `SearchPage.svelte:40`); `app/src/components/ListPage.svelte:133` holds
  `lsel` in a component-local `SvelteSet` that watches neither `navigations`
  nor the hash, and Svelte does not remount a page component between two
  addresses of the same route kind.
- **Live behaviour**: using Back/Forward between two different lists' pages
  always lands with no rows ticked and the batch bar closed.
- **What the rewrite does instead**: moving by history between two list
  addresses leaves the previous list's ticks and open batch bar standing,
  because `ListPage` is never told the address changed.
- **Why it was recorded, not restored: owner ruling 2026-09-16.**
  `tests/app/states.js` case 15 covers Back/Forward history in general, but
  nothing in the surviving suite moves between two *list* addresses by
  history and checks the selection.
- **How to verify the fix**: `ListPage.svelte` watches `app.navigations` (or
  the list id derived from the route) and clears `lsel` when it changes; a
  `listPage.test.ts` case navigates history between two lists with rows
  ticked on the first and asserts the second opens with none.
- **Recorded by**: the R0c sweep, 2026-09-17 (Part D).

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
