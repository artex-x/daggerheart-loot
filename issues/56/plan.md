# TASK 56 plan

## Status
- [x] Reconcile sourcebook inventory and issue draft.
- [x] Add verified non-rollable starting records and contract-compliant art (30 asset pairs normalize to 640x640 RGB; README image count is 876).
- [x] Stabilize the two existing synthetic UI assertions exposed by the full gate, then complete repository gates and commit.

## Authoritative inventory
- Core p. 19: Torch, 50 feet of rope, Basic supplies (Minor potions and gold already exist as standard records/currency).
- Core pp. 27-50: 18 named class choices for Bard, Druid, Guardian, Ranger, Rogue, Seraph, Sorcerer, Warrior, and Wizard.
- Hope & Fear pp. 8, 10, 14, and 16: 8 named class choices for Assassin, Brawler, Warlock, and Witch.
- Core p. 301: Network tether for Motherboard.

## Reconciliation
- Excluded draft-only Bardic Carrier, Wizard's Carrier, Scrap Pockets, and Quantum Disc: neither book names them as starting inventory records. Quantum is currency and scrap is a campaign resource.
- Beast Feast starting equipment already exists as f1-f36, so it was not duplicated.

## Product decision
- Records are in a non-rollable `starting` data collection. Existing search and direct record pages expose them; source/class context is explicit in descriptions. No new mechanics or refs are needed.

## Completed batch: deterministic UI gate remediation and final commit

**Diagnosis from source and prior same-tree evidence.** The `searchPage.test.ts` cap case creates 305 fake records, renders 300, computes accessible names for all 300 buttons with `getAllByRole`, then drives select-all through asynchronous `userEvent` work. Vitest already gives each test 30 seconds (`vite.config.mts`); issue 47's handoff records this exact case timing out in full checks while all 17 search tests passed alone in about 14 seconds, and a later full check passed on the unchanged tree. This is a load-sensitive synthetic test, not evidence that the 300 cap is broken. The table case asserts an initial `flash`, awaits an asynchronous grid-button click, and immediately reads the replacement tile's class. `TablesPage.svelte` holds the outline in `flashKey` for 1600 ms; a delayed Svelte flush or a click that crosses the timer boundary can yield a bare `tilewrap`. Issue 47's handoff records the same assertion red in a full check and all 79 table tests green alone. The prior task 56 check retained only the two test names, not stdout or a stack trace, so the exact latency split remains unmeasured. Both failures predate and are independent of the 30-record ingest.

**Objective.** Make those two tests assert the same product behavior without relying on expensive 300-element accessibility traversal or wall-clock scheduling, preserve the prepared ingest/artwork, and satisfy the required `npm run check` gate. No gate waiver is authorized.

**In scope.** The two named component tests, their local test utilities/imports if needed, final accepted-artwork manifest portability/hash nits, and task-56 verification/commit state. **Out of scope.** Search or table production behavior, the 30 records and 60 installed images, public routes/contracts, global Vitest timeout/worker settings, and unrelated UI/performance refactors.

**Expected edits.** `app/src/components/searchPage.test.ts`, `app/src/components/tables.test.ts`, `issues/56/accepted-artwork.json`, `issues/56/plan.md`, and `issues/56/handoff.md`. Do not edit generated outputs directly; they are already prepared from `data.js`.

**Ordered steps.**
1. Record a read-only preflight: HEAD and status, all task-56 ingest/art paths, the unrelated `.claude/settings.local.json` and `issues/tg-preview-refresh/`, and whether a parity/check process owns the tree. Do not start a heavy gate beside a live parity run.
2. In the 305-record search-cap test, preserve one-event query entry but replace the 300-button accessible-name walk with a direct count of the rendered `[data-row]` nodes. Assert 300 nodes, first and last capped IDs (`m0`, `m299`), absence of `m300`, the visible `Выбрать все (300)` control, and after toggling it the selected count plus all 300 rendered rows selected. Use a direct label/control lookup and one change event if `userEvent` on the 301-checkbox DOM remains the latency source; retain a separate small-fixture accessibility test already present. Do not weaken the cap/selection assertions or increase the test timeout.
3. In the grid-flash test, control the 1600 ms timer locally with fake timers before rendering, use a synchronous button event rather than `userEvent` (which can spend the flash interval before dispatch), and flush Svelte with `tick()` before reading the replacement tile. Assert the initial row flashes, the replacement `tilewrap` flashes while the clock is under 1600 ms, and the outline clears after the timer expires. Restore real timers in `finally`, with no fake clock leaking to other tests. Keep the scroll-once assertion. If fake timers interfere with app setup, use a narrowly mocked 1600 ms flash timer with the same cleanup; do not extend the product flash duration.
4. Run the named tests alone without coverage to distinguish a real behavior failure from full-suite scheduling, then run the two complete component files with coverage or the repository's normal `npm run test` path. A deterministic failure in a focused run warrants inspection of the component state/event path before making further test edits; do not paper over it with a timeout bump.
5. Close the accepted-artwork manifest nits: replace its absolute Downloads `source_root` with a symbolic source label, preserve the observed path in `handoff.md`, and add SHA-256 plus byte size for each of the 30 accepted PNGs. Verify those values against the original source files if still available; if they are unavailable, record that limitation and do not invent hashes.
6. Review the final diff for coherent task scope and preservation of unrelated files. Run `git diff --check`, focused data/art checks, `npm run check` in one foreground call within 600 seconds, and `npm run check:built` if any screen output or production asset changed since its green retry. Commit only after the full gate passes, using the repository's author and Conventional Commit rule, then push the branch per `CLAUDE.md`.

**Acceptance.** The cap test still proves exactly the first 300 of 305 are shown and all shown rows become selected. The grid test proves flash continuity across list-to-grid replacement, one scroll, and timer cleanup. The named focused tests and `npm run check` pass without a waiver; `npm run check:built` remains green when required. All 30 authoritative records, 60 normalized assets, generated stubs and public contracts remain intact. Both unrelated untracked paths remain untouched. The manifest has portable provenance and exact source hashes/sizes when the supplied PNGs are accessible.

**Verification.** Passed: `npx vitest run app/src/components/searchPage.test.ts -t "shows the first 300 matches"`; `npx vitest run app/src/components/tables.test.ts -t "the outline follows the record into the grid view"`; `npx vitest run app/src/components/searchPage.test.ts app/src/components/tables.test.ts` (96 tests); `node tests/dataint.js`; `node tests/craft.js`; `node tests/derived.js`; `node tests/i18n.js`; `git diff --check`; and foreground `npm run check` (42 files, 1020 tests). The earlier green `npm run check:built` remains applicable because this remediation changed tests and task metadata only, with no production screen or asset changes. Commands ran sequentially on one tree, with no concurrent parity run.
