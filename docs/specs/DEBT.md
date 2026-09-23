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

**What does not belong here.** A pure refactor question about the rewrite's
own code, with no live-app counterpart, does not fit this register: it
cannot fill the `Where`/`What`/`Why deferred`/`How to verify` shape (there is
no live behaviour to cite, and a hash-verified entry with no live-code
citation weakens the check that every entry here names real, still-current
source), so it stays a named, open question instead. The `Panel.svelte`/
`.ffilter`/`.tablenav` extraction question is the standing example -
`TableRows`/`SectionHead` are not `.panel` copies, so the extraction is
narrower than it looks, and it is still open (`CLAUDE.md`'s campsite rule is
the test for whether it is ever worth doing).

**The live sources were deleted at R0c (`23c00a6`)**; `git show
23c00a6^:app.js` (or `:style.css`, `:index.html`) reads them at their final
state. A line citation below with no other hash refers to that state; a
citation naming its own hash (`bb61db0`, `b967481`, `a52c17d`, `dc99f21`) was
read at that commit specifically. Verified before this sentence was added:
`git show bb61db0:app.js` around lines 3589-3603 matches D2's quote below.

## Defects reproduced on purpose

The live app was wrong; the rewrite copied it; parity was the reason.

## Divergences found at the deletion (R0c sweep), owed a decision at Phase 8

Commissioned by the repository owner before R0c's deletions (`git show
92d6a4b:issues/47/context.md`, decision 11, 2026-09-16): one more deliberate
pass over everything the migration deletes, read against `app/src/` for
behaviour no surviving instrument would notice. Full record: `git show
92d6a4b:issues/47/sweep.md`, written while HEAD was `7a33c22`. **None of
these blocked the deletion** - the owner's ruling was
that a finding here is recorded, not fixed, in R0c; reviewing and addressing
each is Phase 8 work. Unlike section 1, these are not known to be *deliberate*
parity choices - they are accidental losses or additions the sweep caught
because no instrument (pixel diff, axe, a registered state) could see them,
the same shape R0b.4's five divergences had.

## Live decisions kept over the rewrite's own

Not a defect; a design the rewrite argued against and lost to parity.
Re-examined at Phase 8, and either kept (entry deleted, `FEATURES.md`/
`STATE.md` say so) or changed.

## Live defects found in phase-8's own reviews, deferred with a reason

Unlike the sections above, these were never a parity question - they are
real bugs a phase-8 batch review caught in code this same phase wrote or
touched, each one bounded (`CLAUDE.md`'s campsite rule) to more than a nit
can fix in the batch that found it: a public-contract change, a new spec
sentence, a new `app/src/ports/` surface, or (D27) a layout redesign the
owner's own scope fence bars this task from doing - none of which fits
alongside the ~103 one-line review findings the terminal batch cleared in
the same pass. Entered in the commit
that makes the deferral decision, per this file's own rule above; paid off
by whichever task lands the real fix, most likely the consistent-storage
ticket (D24), a dedicated batch (D25, D26), or the UI/UX ticket (D27).

### D24 - a second `dhloot.lists.v2` corruption is never backed up, and the first backup is orphaned forever

- **Where**: `app/src/state/lists.svelte.ts`, `ListStore#readCurrent`.
- **What**: the first unreadable `dhloot.lists.v2` value is backed up once,
  under `dhloot.lists.v2.bad` - `get(LISTS_KEY_BAD) === null` guards it, on
  purpose, so this tab's own next successful write does not overwrite the
  one copy of what was actually lost. The guard has a consequence nothing
  else in the code addresses: once that key reads back as valid again (this
  tab's own next `save()`, or another tab's write), `unreadable` clears and
  the storage notice stops warning - but the `.bad` backup stays sitting
  there with no UI that ever reads it, orphaned for good. A **second**
  corruption after that point is not backed up at all (the guard still
  finds `.bad` occupied by the first one) and `save()` writes straight over
  it, while the notice tells the reader their data survived.
- **Why deferred**: the real fix needs a backup **keying scheme** - a
  timestamped key grows `localStorage` without bound, and dropping `.bad`
  the moment a read succeeds discards the one copy of the first loss before
  anyone could reach it - plus a way for a person to actually reach a
  backup at all, which today has no UI anywhere. The consistent-storage
  ticket already owns ".bad-key recovery beyond a notice"; this is that same
  design question, not a second one.
- **How to verify the fix**: corrupt `dhloot.lists.v2` twice in a row (a
  plain write of unparsable text, then - after the app has re-validated the
  key once, clearing `unreadable` - corrupt it again) and confirm two
  distinct, reachable backups exist rather than one overwritten copy.

### D25 - a shared link with every item gone reports "damaged" instead of "empty"

- **Where**: `app/src/lib/listLink.ts`, `parseItems`/`decodeList`.
- **What**: `parseItems` returns `null` when **every** id in a shared link's
  payload fails to decode, and a `null` result is what sends the reader to
  `badShare` ("the link is damaged") rather than `droppedItems` ("some
  entries are no longer in the data"). The link decoded fine; its entries
  are simply all gone from the catalogue (an item removed or renumbered
  since the link was made) - the worst case of exactly the defect R3/P9
  already fixed for a partial drop, left standing for a total one.
- **Why deferred**: telling the two outcomes apart on screen is a new
  user-visible state, not a nit-sized change - a `dict.ts` string pair in
  both languages, a `docs/specs/FEATURES.md`/`ROUTES.md` sentence, and
  possibly a new `tests/app/inventory.js` state with its own seeded golden,
  per `CLAUDE.md`'s rule that a new state gets both in the same change.
- **How to verify the fix**: open a shared-list link whose payload decodes
  but whose every id is now unknown to the catalogue, and confirm the page
  reads as "these items are gone" rather than "this link is damaged".

### D26 - a smooth scroll still animates under `prefers-reduced-motion: reduce`

- **Where**: `app/src/components/TablesPage.svelte`, the filter-panel
  scroll (`target?.scrollIntoView({ behavior: 'smooth', block: 'start' })`).
- **What**: D1's blanket `scroll-behavior: auto !important` rule
  (`tokens.css`) cannot reach this call, because the CSS `scroll-behavior`
  property is defined to be overridden by a call-site `behavior` argument -
  `scrollIntoView({ behavior: 'smooth' })` always scrolls smoothly, reduced
  motion or not. This is the one real smooth scroll left in the app after
  D1, and it is the one D1's own CSS-only fix structurally cannot cover.
- **Why deferred**: the boundary-respecting fix needs to read
  `matchMedia('(prefers-reduced-motion: reduce)')` and choose `behavior`
  from it, and there is no `matchMedia` read anywhere in `app/src` today
  (verified at the time this entry was written) - it needs a new
  `app/src/ports/` surface: a type, an `index.ts` entry, a fake for tests,
  and its own per-file coverage, which is a batch, not a one-line fix in
  the file that happens to be open.
- **How to verify the fix**: with the OS/browser's reduced-motion
  preference on, open `#/tables/<any book with more than one table>`, pick
  a filter that moves the panel into view, and confirm the jump is instant
  rather than eased - `document.getAnimations()` (or, once a `matchMedia`
  port exists, a mocked-`matchMedia` Vitest assertion on the branch it
  picks) is the same instrument D1's own entry used.

### D27 - two P12 44x44 hit targets overlap an editable neighbour

- **Where**: `app/src/components/ListPage.svelte` (`.note-x::after`, the note
  clear button's extended target) and `app/src/components/StorageNotice.svelte`
  (`.warn-x::after`, the notice dismiss button's extended target).
- **What**: both are the same P12 shape as `PageHead.svelte`'s `.homebtn::after`
  - a 20px or 26px button given an invisible, centred 44x44 tap target via
  `position: absolute; ... transform: translate(-50%, -50%)` - but unlike
  `.homebtn`, both buttons sit flush against an editable or interactive
  neighbour, so the extended target spills into it. Measured on this host at
  1180x900 (`dist/`, real Chromium): `.note-x::after`
  extends **7px** into the note `<textarea>` immediately below it
  (`.nfield`'s label/textarea pair, `ListPage.svelte`); `.warn-x::after`
  extends **2px** above the notice box's own top edge (`.warn`,
  `StorageNotice.svelte`). Both overlaps reproduce B7-R4's finding (which
  estimated ~12px and ~3px respectively from the CSS alone, before any
  browser measured it). A tap in the overlap clears the note or dismisses
  the notice instead of focusing the textarea or landing inside the box -
  low severity (the note case needs a tap within a few px of the button, not
  inside the textarea generally; the notice case needs a tap just above the
  box, mostly empty page background), but real.
- **Why deferred**: P12's own acceptance line forbids both obvious fixes -
  shrinking the target below 44px, and this task is not scoped for a
  redesign (`CLAUDE.md`'s campsite rule; `context.md`'s scope fence bars
  UI/UX redesign work). A real fix needs a layout change - moving the button
  away from the editable neighbour, or giving the neighbour a matching
  inset/margin so the target has room - which belongs with the UI/UX ticket
  that already owns the redesign work this phase excluded.
- **How to verify the fix**: repeat this entry's own measurement (a
  `getBoundingClientRect()` comparison of the button's computed 44x44 target
  against its neighbour, at 1180x900) and confirm zero overlap in both
  directions, with the target still at 44x44 and the button unmoved in
  every other respect.

### D30 - `.card-media`'s focus ring at `.full`/`.compact` is unconfirmed by any instrument

- **Where**: `app/src/components/RecordCard.svelte`, the `.card-media`
  `outline-offset: -2px` rule.
- **What**: nothing in the repository can confirm the ring is actually drawn
  inside `.card` at both `.full` and `.compact`: the sweep's focus walk reads
  computed style (which reports a ring an ancestor clips, not whether it is
  visible), the goldens read structure only, and axe checks neither. The
  `-2px` offset was reasoned from `.card`'s `overflow: clip`, never
  instrumented.
- **Why deferred**: needs a human eye, not a new gate - the failure mode (a
  ring clipped by an ancestor) is exactly the class no automated instrument
  here can see.
- **How to verify the fix**: a human check at `#/i/ci1` and
  `#/tables/core_item`, tabbing to a card's image and confirming the ring is
  visible in both card sizes.

### D31 - `dict.ts`'s storage-corruption message is unactionable without devtools

- **Where**: `app/src/lib/dict.ts`, `badStorage` (`ru`, `en`).
- **What**: tells a reader their unreadable data is kept "under a separate
  key" with no way to act on that outside devtools.
- **Why deferred**: product copy, routed to the UI/UX ticket rather than
  rewritten as a nit.

### D32 - the reduced-motion rule zeroes duration but not delay

- **Where**: `app/src/styles/tokens.css`, the `prefers-reduced-motion`
  block.
- **What**: zeroes `animation-duration`/`transition-duration` but not the
  paired `-delay` properties.
- **Why deferred**: zero sites in the app are affected today; fixing the
  rule anyway is a policy edit, not a bug fix for a live symptom.

### D33 - the `#/tables/frames` legacy alias has no fixture row

- **Where**: `docs/specs/ROUTES.md` (documents the alias);
  `docs/fixtures/urls/routes.json` (only carries `other_frames` rows).
- **What**: `hash.test.ts` covers the route directly, so nothing is
  untested, but the alias has no row in the fixture that is supposed to
  enumerate every documented address - a completeness gap in a file
  `CONTRACTS.md` freezes as a public contract, which needs its own
  justification to touch.
- **Why deferred**: a fixture change needs the same public-contract
  handling as any other `docs/fixtures/` edit, not a nit-sized fix.

### D36 - two accessible names reproduce the live app's markup on purpose, unrecorded

- **Where**: `app/src/components/FilterBar.svelte` (a filter pill's
  accessible name, `"Ранг 1 ×"` - `title` becomes the description, the
  visible content the name); `app/src/components/ListPage.svelte` (an owned
  list's row/card name, `"Лавка в порту 0 Список пуст"`).
- **What**: both names read as run-together, mid-sentence noise to a screen
  reader. Both reproduce exactly what the deleted live app emitted, and both
  move goldens (`tests/app/snapshots/_tables_eq_weapon_filtered.txt`,
  `_lists_two_lists.txt`, among others) if changed. A cleaner shape exists
  for the filter pill (`aria-hidden="true"` on the dismiss glyph would read
  `"Ранг 1"` and keep the rest as the description) but it diverges from
  parity, so it was never applied.
- **Why deferred**: a product decision, not a structural cleanup - whether
  to trade parity with the live app for a better accessible name is the
  product pass's call, not a review finding to act on unasked.
- **How to verify the fix**: change the markup so each name reads as
  intended text (e.g. `aria-hidden` on the dismiss glyph, a visually-hidden
  span reordering the list-card name), re-seed the affected goldens, and
  confirm the golden diff is exactly the accessible-name lines.

### D37 - the undo toast's action is unreachable by keyboard in practice

- **Where**: `app/src/components/Toast.svelte` (the `$effect` that shows the
  toast, no focus management); `app/src/state/app.svelte.ts` (the 7000 ms
  duration).
- **What**: the toast is a `popover="manual"` element at the end of the
  document with no focus moved into it on show, so a keyboard user has to
  tab through the rest of the page to reach the undo button before the
  7000 ms window closes it - realistically unusable from the keyboard.
- **Why deferred**: fixing it properly means moving focus into the toast on
  show, which is intrusive for a transient notice that is not always an
  error; judged not worth it as a small change. A real fix belongs with the
  UI/UX ticket's broader focus-management pass (`docs/specs/DEBT.md`,
  "Routed elsewhere, not paid").
- **How to verify the fix**: trigger an undoable action with the keyboard
  only, and confirm the undo control is reachable (and used) before the
  toast's own timeout closes it.

## Routed elsewhere, not paid

Findings a review raised that were routed to an existing ticket, a new task
of their own, or a named decision, instead of becoming a `DEBT.md` entry or
being dropped - recorded here so the routing itself is not lost.

**Consistent storage** (a separate ticket): a versioned envelope with
validation and migration, per-entry reconciliation, `dhloot.lang`/`home`/
`warn` not watched cross-tab, a `save()` debounce, a local `.json` export.

**UI/UX** (a separate ticket): a focus-management pass, the roll live region
reading four whole cards, money-picker discoverability, a Search help panel,
an inlined first-paint skeleton, boundary reporting.

**Own tasks** (costed rather than folded into a review batch): generated
image derivatives (`img/` ships 640x640 originals - 1021 files, 35 MB, mean
33,912 B - into 60px rows and 168px tiles; scrolling `#/tables/eq_weapon` in
grid view pulled ~11 MB at 317 rows (381 now) against a 243 kB first load;
the fix is a generated ~192px derivative under a new asset path, which `CONTRACTS.md` would
freeze); splitting `ListPage.svelte`; decomposing `AppState`; `Record_.tier`
-> `voaTier`; branded ids; one home for the shared-link wire constants;
publishing the artefact `check` proves; a replacement heavy-run lock, weighed
against the Playwright decision (`docs/DECISIONS.md`, "Playwright: not now")
beside it, since a second real-browser dependency would need a guard of its
own too.

**Open, from the R0c sweep's own findings, never picked up**: B12.1's nits
2 and 6, and B12's nits 4 and 5 - text that survives only in the retired
task's history (`git show 92d6a4b:issues/47/handoff.md`, "Deferred"); the
`.selbox:has(:focus-visible)` keyboard question (`TableRows.svelte:222-226`
- nothing today drives a row checkbox by keyboard, so the rule's own value
is unconfirmed).

## Other live defects, deferred with a reason

Not a phase-8 review finding - caught by a later task's own review, same
deferral discipline.

### D34 - a generated share stub's subtitle is a path only for two of the fifteen tables

- **Where**: `tools/build-share-pages.js`, `provenance()`; `docs/specs/
  FEATURES.md` "Records" ("a generated share stub's subtitle" is held to the
  same path rule as the record page's own heading line).
- **What**: `provenance()` returns a full breadcrumb only for frame and
  starting records; every other record's stub keeps the old `Предмет · Core
  · №12` tag form instead of a path.
- **Why deferred**: making it a path for all 1272 records needs a full stub
  regeneration plus its own public-contract commit (`i/*.html` is generated,
  frozen output) - not a nit-sized fix in a batch that touched only the two
  tables that already agree.
- **How to verify the fix**: regenerate the stubs and confirm every
  `i/<id>.html` subtitle reads as a full table path, matching the record
  page's own heading line for the same id.

### D42 - cached drag midpoints go stale under a two-tab storage merge mid-drag

- **Where**: `app/src/ports/drag.ts`, the `onStart` cache (`zone.mids`).
- **What**: row midpoints are measured once, at `dragstart`, and cached in
  document coordinates so the resolver does not re-read every row's rect on
  each `dragover`. A second tab writing to the same list mid-drag re-renders
  the rows through the storage merge, which invalidates the cache: the
  highlight, and the eventual drop, then land at the old layout's gap
  rather than the new one. The old per-`dragover` rect read this design
  replaced was immune, since it read live layout on every event. The
  window is a fraction of a second and needs a second tab actively editing
  the very list being dragged.
- **Why deferred**: kept on purpose, in exchange for not recomputing every
  row's rectangle on every `dragover` - a cost this task's own plan weighed
  against the two-tab window (`docs/DECISIONS.md`, "A list drag resolves to
  a gap, from the document, not to a row"). A real fix needs either a
  mid-drag `onExternalChange` hook the port does not have today, or
  re-measuring per `dragover`, which undoes the caching decision.
- **How to verify the fix**: start a drag in one tab, write a reorder to the
  same list from a second tab mid-drag, and confirm the highlight and the
  eventual drop track the post-merge row order rather than the cached one.

### D44 - a drag released on the list's own note bypasses both drop guards

- **Where**: `app/src/ports/drag.ts`, `onDocOver` and `onDocDrop`; the
  list's own `.lnote` in `ListPage.svelte`, which sits above `.rows`.
- **What**: the port prevents `dragenter`/`dragover` and sets `dropEffect =
  'move'` only inside the drop zone (`zone.top` to `zone.bottom`). A release
  on `.lnote`, above `zone.top`, gets neither, and `dataTransfer` carries
  `text/plain` set to the row index. The native drop may insert that index
  into the note. Unverified: no trusted drag has reproduced the insert there
  (`git show dcc8c8d` refutes it only inside the zone).
- **Why deferred**: the one-line fix, `dropEffect = 'move'` for every
  `dragover`, makes the cursor read "move" outside the list too, which
  removes the cancellation signal a release outside the zone gives
  (`docs/DECISIONS.md`, "A list drag resolves to a gap, from the document,
  not to a row"). A fix needs its own behaviour decision.
- **How to verify the fix**: with a trusted drag (`page.mouse.dragAndDrop`),
  drag a row's grip onto `.lnote` and release. Confirm that the note text
  and the row order do not change, and that a release outside the list still
  shows the "no drop" cursor.

### D45 - the removal toast's Russian participle agrees with a masculine record only

- **Where**: `app/src/lib/dict.ts`, `removedItem: '«%s» убран'`; called from
  `ListPage.svelte`'s single-row removal toast.
- **What**: `убран` is masculine, so the toast for a feminine or neuter
  record name has a wrong ending. This violates `docs/specs/I18N.md`,
  "Rules" (a message that names a record avoids a word that must agree with
  the record's gender).
- **Why deferred**: the fix changes shipped product text, and that change
  was not approved when the rule was written (TASK `dnd4`).
- **How to verify the fix**: replace the participle with a gender-free form,
  remove a feminine record from a list, and confirm that the toast reads
  correctly in Russian.

### D46 - a secondary weapon's class shows only on the print card and in the filter

- **Where**: `app/src/lib/i18n.ts`, `eqParts` (the class for `t === 'weapon'`
  only); `app/src/components/PrintCard.svelte`, `tag2` (any non-armour);
  `app/src/lib/facets.ts`, the `cls` row (labelled «Тип урона» on
  `eq_secondary`).
- **What**: all 123 secondary weapons have `cls === dt`. The record card,
  the table row, copied text and the share stub never name the class; the
  print card does («Магическое»), and the filter reads `cls`.
- **Why deferred**: not a Dragon's Vault defect, and either fix moves the
  copied text of 123 records (the share fixture is re-captured) and 123
  stubs - its own reviewed change.
- **Fix**: recommended - print the class on a secondary weapon's stat line
  as on a primary one (`eqParts`: `e.t !== 'armor'`), because the print card
  follows the Figma node and the stat line is this app's own; the cost is a
  line that says «Магическое» and «маг» for the same fact. The other option:
  drop `tag2` from secondary print cards - cheaper, but it departs from the
  print design.
- **How to verify the fix**: `#/i/<a secondary id>` and `#/print/<same id>`
  name the class the same way.

### D48 - a refused write near the storage quota says storage is blocked, not full

- **Where**: `app/src/ports/storage.ts`, `set`; `app/src/lib/dict.ts`,
  `saveFailed`.
- **What**: `set` reports only that a write failed. Near the origin's quota
  a list edit toasts `saveFailed`, whose text blames a browser that blocks
  local storage, not a full one.
- **Why deferred**: to tell the two apart, `StoragePort.set` must report the
  error (a port change). The design target of issue 68, 200 lists, stays
  near 0.7 MiB, far under the quota.
- **How to verify the fix**: fill the origin's quota, edit a list, and read
  the toast.

### D49 - Vault of Ages Volume 4 writes three Russian roll terms unlike the catalogue

- **Where**: `data.js`, `rud` of voa4_t2i («броски Инстинкта»), voa4_t1f
  («броски Характеристик»), and voa4_t1d, voa4_t3b, voa4_a2 (plural «Броски
  Заклинания», «Броскам Заклинания»).
- **What**: the catalogue writes «Броски Инстинкта» (w43, w100) with a
  capital, and Proving's core line reads «Броскам Заклинаний» (ci17,
  voa4_t4d). The five records use a lowercase «броски» or a singular
  «Заклинания» after a plural roll.
- **Why deferred**: the approved Russian text shipped as the plan's `rud`;
  a casing and number pass is its own reviewed change of product text.
- **How to verify the fix**: grep `rud` for `броски [А-Я]` and
  `Бросками? Заклинания` after a plural; neither matches, and
  `node tests/derived.js` passes.

### D51 - the dropped-items toast reads as one item at 21, 31, 101

- **Where**: `app/src/lib/dict.ts`, Russian `droppedItems`; shown by the
  `ListsPage.svelte` and `SharedListPage.svelte` toasts.
- **What**: `plural()` picks the `one` form for 21, 31 and 101, so the toast
  reads "Пропущена 21 позиция — её больше нет в данных". The count agrees,
  but "её" refers to 21 records as to one.
- **Why deferred**: the owner approved the three forms in `plural()`'s own
  change, and a fix changes shipped product text. The toast needs a stored
  or shared list with 21 or more records gone from the data.
- **Fix**: remove the pronoun from all three forms ("— больше нет в данных"),
  or give the `one` form a clause without a pronoun.
- **How to verify the fix**: `plural(21, dict('ru').droppedItems, 'ru')` has
  no singular pronoun; `plural.test.ts` covers 1, 2, 5 and 21.

## Hook and tooling defects, kept open

Not a parity question and not a phase-8 review finding - a real gap in a
harness or tool this repository owns, recorded rather than silently
tolerated.

`gitleaks-action@v2` and the three Pages actions in `ci.yml` target Node 20
and are forced onto Node 24 by the runner - two standing, pre-existing CI
annotations, neither an error. Worth filing only if one starts failing
rather than warning; not filed today.

### D28 - `.hook-state.json` has no defence against a torn read or a concurrent read-modify-write

- **Where**: `lib.mjs`'s `loadState()`/`saveState()`.
- **What**: two gaps, neither yet reproduced end to end. A `loadState()`
  parse failure (a torn read mid-write) makes the next `saveState()` hold
  only the writer, discarding every other session's record. Two sessions
  racing a read-modify-write on the same file can each save over the
  other's update.
- **Why deferred**: needs a Windows rename-over-open-file probe first, to
  know whether the platform's own atomic-rename behaviour already closes
  the torn-read half before designing a fix for the rest.
- **How to verify the fix**: force a parse failure mid-write and confirm
  every other session's entry survives; force two saves to race and confirm
  neither is silently dropped.

### D29 - `node tests/dataint.js` is not wired into `npm run check`

- **Where**: `package.json`'s check chain; `tests/dataint.js`.
- **What**: the `img/`/`og/` orphan checks, the duplicate-bytes invariant,
  and the artwork-sharing rule only run when a prompt explicitly names
  `run-all.js dataint` - not on every check. The old objection (its sibling
  `noart` needed puppeteer) is moot: `tests/noart.js` no longer exists.
- **Why deferred**: undecided whether the added second or two per check is
  worth paying on every run rather than only when artwork changes.
- **How to verify the fix**: `npm run check` fails when `dataint.js` would,
  with no separate `run-all.js dataint` invocation needed.

### D38 (idea, not built) - nothing pins `build-share-pages.js`'s equipment vocabulary to `i18n.ts`'s

- **Where**: `app/src/lib/i18n.ts` (claims to be "the single place those
  words live"); `tools/build-share-pages.js` (`EQ_TYPE`, `EQ_TRAIT`,
  `EQ_RANGE`, `EQ_DT`, `EQ_CLS`, `EQ_BURDEN` - a second, unguarded copy).
- **What**: `tests/derived.js` regenerates the stubs from
  `build-share-pages.js` and compares against disk, so it catches a stale
  stub, but nothing checks the generator's own tables against `i18n.ts`'s.
  A renamed equipment word would ship as an app that says one thing and a
  share preview that says another, silently.
- **Why deferred**: an idea, not built - a real guard is a new derived-test
  assertion (that the two tables agree), which is a separate item, not a
  hygiene-pass fix.
- **How to verify the fix**: rename one equipment word in `i18n.ts` only
  and confirm `npm run check` fails on the mismatch.

### D39 (idea, not built) - `tests/` and `tools/` sit outside both lint and format, on a rationale that no longer holds

- **Where**: `eslint.config.mjs`'s ignore comment for `tests/`/`tools/`
  ("an older style, no lint config of their own to satisfy"); `.prettierignore`.
- **What**: that reasoning was true of the suites R0c deleted; what is left
  under `tests/app/` (220 KB across ten files) is new code written during
  the migration, and it is where several review findings (stray Russian
  messages, stale comments) all lived - not a coincidence, since nothing
  mechanical reads those files today.
- **Why deferred**: bringing `tests/app/` under Prettier is a whole-tree,
  pure-whitespace diff; a candidate follow-up, sequenced after the language
  sweep (`docs/specs/META.md` section 6) or not at all.
- **How to verify the fix**: `npx prettier --check tests/app` passes with
  no manual reformatting, and the ignore comment states the real reason
  (outside every tsconfig) rather than the retired one.

### D40 (idea, not built) - `tests/run-all.js` does not regenerate `i/` when it is missing

- **Where**: `tests/run-all.js`.
- **What**: a cold clone running `run-all.js` outside `npm run check` (which
  does shell out to `node tools/build.js`) loses `derived`, `dataint`,
  `craft` and `stub` to a missing `i/` folder. A one-time `node
  tools/build.js` call when `i/` is absent would close it.
- **Why deferred**: an idea, not a defect hit in practice - reopen only if
  the friction is actually hit.


### D50 - the Saint's Ensemble set guard does not check the old set name

- **Where**: `tests/derived.js`, the Vault of Ages Volume 4 block (the
  check that voa4_t3d, voa4_t3e and voa4_t3f carry no set bonus in their
  own text).
- **What**: the check rejects `Saint's Ensemble` and «Убранство Святого»
  in the record text, but not «Облачение Святого:», the set name of the
  source draft. A re-sync from that draft can put the old line back, and
  the guard passes.
- **Why deferred**: found at the final review, when no record carries the
  old name; a guard change belongs with the next Volume 4 re-sync.
- **How to verify the fix**: put «Облачение Святого: ...» into voa4_t3d's
  `rud` and confirm that `node tests/derived.js` fails.
