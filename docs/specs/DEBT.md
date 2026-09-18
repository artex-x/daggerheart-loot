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

**Why here, not somewhere else** (planner, 2026-09-11, migrated from issue
47's `plan.md` at closeout): `docs/specs/` is what every
agent reads for a touched path, and it is the one place `CLAUDE.md` says
durable behaviour belongs; a spec file survives a task directory's
retirement, unlike the harness that used to describe the same defects. An
entry *is* a behaviour statement ("the app does X; X is wrong; here is why
it does it anyway"), which is what a spec is for. Rejected: `ACCEPTED`
(nothing keys an identical behaviour - both apps are the same on purpose,
so there is no difference to key); the runbook that used to be
`docs/parity.md` (retired with the harness); a section inside
`docs/specs/FEATURES.md` (that file says what the app does; "and this is
wrong, fix it later" in the middle of it would be read as behaviour or
skipped - this file cross-references `FEATURES.md` bullets instead, never
the reverse); a task directory (retires with the task, and Phase 8 needs
this register as its *input*, not as something that retires alongside it);
one GitHub issue per entry (outlives the task but not in the tree, needs
`gh` and a network, and cannot carry a rule or a measurement verbatim - the
post-migration review files issues *from* this register instead); the
READMEs (a reader's document, not a maintainer's).

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

## Divergences found at the deletion (R0c sweep), owed a decision at Phase 8

Commissioned by the repository owner before R0c's deletions (`issues/47/
context.md`, decision 11, 2026-09-16): one more deliberate pass over
everything the migration deletes, read against `app/src/` for behaviour no
surviving instrument would notice. Full record: `issues/47/sweep.md`, written
while HEAD was `7a33c22`. **None of these blocked the deletion** - the owner's ruling was
that a finding here is recorded, not fixed, in R0c; reviewing and addressing
each is Phase 8 work. Unlike section 1, these are not known to be *deliberate*
parity choices - they are accidental losses or additions the sweep caught
because no instrument (pixel diff, axe, a registered state) could see them,
the same shape R0b.4's five divergences had.

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

## Live decisions kept over the rewrite's own

Not a defect; a design the rewrite argued against and lost to parity.
Re-examined at Phase 8, and either kept (entry deleted, `FEATURES.md`/
`STATE.md` say so) or changed.

