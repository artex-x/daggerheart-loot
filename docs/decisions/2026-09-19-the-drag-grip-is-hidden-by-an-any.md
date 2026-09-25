# 2026-09-19 - The drag grip is hidden by an `any-hover`/`any-pointer` capability query, not `hover`/`pointer`

- Task: `dnd4` (find the commit with `git log --grep=dnd4`).
- Decision: `@media (any-hover: none) and (any-pointer: coarse)` hides
  `.lrow-grip` in `ListPage.svelte`. HTML5 drag never starts from a touch,
  so the grip is inert where no pointer can hover or point finely. A
  touchscreen laptop or a tablet with a mouse keeps the grip.
- Rejected: `(hover: none)` or `(pointer: coarse)` - they describe only the
  primary input and hide the grip from a working mouse; a script feature
  test - `'draggable'` and `'ontouchstart'` both lie, and the check would
  leave `app/src/ports/`; a width query - width does not predict touch.
- Evidence: `page.emulateMediaFeatures` refuses `hover`/`pointer`; only
  `page.setViewport({ isMobile: true, hasTouch: true })` moves
  `any-hover`/`any-pointer` (`docs/specs/COVERAGE.md`, "app/states - two
  harness facts a device-capability case runs into").
