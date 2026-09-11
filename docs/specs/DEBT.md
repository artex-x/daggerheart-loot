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
  `<button class="warn-x">` inside `<summary>`; `app/src/test/a11y.ts`
  turns axe's `nested-interactive` rule off suite-wide to allow it.
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
- **How to verify the fix**: `OFF` in `a11y.ts` has no `nested-interactive`
  line; `listsPage.test.ts`'s notice cases end in
  `expectNoA11yViolations`; every `#/lists` state in the post-cut-over
  net still passes. `FEATURES.md`, "Lists", the storage-notice bullet.
- **Recorded by**: B9, 2026-09-11 (found by the B5.3 review).

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
