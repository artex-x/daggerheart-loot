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
alongside the nit-sized fixes `issues/phase-8/nits.md` cleared in the same
pass (`plan.md`, "Rows this plan moves to Deferred"). Entered in the commit
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
  backup at all, which today has no UI anywhere. `issues/phase-8/plan.md`
  already routes ".bad-key recovery beyond a notice" to the consistent-
  storage ticket; this is that same design question, not a second one.
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
  1180x900 (`dist/`, real Chromium, issues/phase-8 B12d): `.note-x::after`
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

