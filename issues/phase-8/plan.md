# Plan - TASK phase-8

Status: revised 2026-09-18 (planner, third pass) at HEAD `78981b2`. B1-B11
and every remediation cycle have shipped; every batch has been reviewed and
the nit register is complete. This pass designs **B12** - the only remaining
batch - as four consecutive pieces (`B12a`-`B12d`), all inside phase-8, with
the criterion for each seam named and the mechanism that makes the tail land
written down. Earlier: revised 2026-09-17 (second pass) after the owner's two
revisions - B1 shipped at `e7c7b50`, B2 at `44b1761`, B2-B20 merged to B2-B11
by gate, a forcing function for batch size folded into B2. All eight owner
questions are settled (`context.md`, "Settled owner decisions"); every
settled step below is written as decided, not as an option.

## Objective

Turn the twelve critique reports (`issues/phase-8/critique/`) and the register
(`docs/specs/DEBT.md` D1-D23) into an ordered, implement-ready sequence. Every
finding is placed in a batch, deferred to one of the two excluded tickets, or
dropped with a named legitimate reason. "Where every finding landed" maps the
first plan's B2-B20 onto the merged shape so nothing fell out.

## How to read this plan

- Findings are cited by report id (`P1`, `C6`, `T4`, `H1`, `PF3`, `DC1`,
  `TL1`, `O1`, `R1`, `S1`, `DP1`, `A1`, `D1`).
- Every batch that stands alone names the criterion that keeps it apart
  from its neighbours, in `CLAUDE.md`'s terms (a public-contract change, a
  different route and filter set, a commit the harness cannot reach) or
  reviewability in one pass. A batch with no criterion would be a merge.
- "Goldens": `none` means the trees under `tests/app/snapshots/` do not move
  and the batch proves it with a targeted run; `re-record` names the states
  and the reason. `node tests/app/golden.js --only=<substring of a state
  id>` (`golden.js:32-33`, matched against `STATES[].id` such as `#/search ~
  capped`) runs a subset - the cheap "does not move" proof; the four
  `--shard=n/4` calls only where a batch re-records or claims identical DOM
  everywhere.
- Gates per `.claude/README.md`, "Batch size and the fixed cost of a run".
  `npm run check` is one foreground call with `timeout 600000`:
  `set -o pipefail; npm run check 2>&1 | tail -n 120`. A batch may hold more
  than one commit; each commit is green on its own, so a two-commit batch
  pays `check` twice and its `tests/app/` filters once.
- Write control characters as prose (NUL, U+0001), never as escape
  sequences and never literally: a tool's JSON decoding turns an escape into
  the byte, and a NUL makes the repository grep treat the file as binary and
  suppress every match. This line was bitten twice while being written.
- Parity-era reasoning is not a defence anywhere below.

## Verified facts that change what the reports proposed

Checked read-only at `f53f44d`/`e7c7b50` on 2026-09-17.

1. **D7's cause is opacity, not the tokens.** `git grep -e '--muted'
   23c00a6^ -- style.css`: the live app already used `--muted: #9b93b3` and
   `--muted2: #8a83a3` - the values `tokens.css:23,27` has today. D7's
   `#77708c` at 3.77:1 is `#9b93b3` composited at `opacity: 0.72`
   (`Chip.svelte:94`) and `0.75` (`ListPage.svelte:1111`). Two deleted
   declarations (B5), not a palette change.
2. **`#/search` has seven goldens** (`_search*.txt`); `product.md` P7 says
   none. P7's count line moves `_search_capped` (B7).
3. **The `CLAUDE.md` the harness injected into the first planning pass was
   stale.** The file on disk (unchanged since `d6371e7`) has no "Migration
   and parity" section, no `docs/parity.md` row, `node tests/run-all.js
   contracts,dataint` at `:110`, and the browser command without
   `app/sweep`. The first plan's "fact 3" (that `CLAUDE.md` named `eqtest,qa`)
   was wrong and `docs.md`'s verification was right. Of Q7's nine edits, five
   (#3, #4, #5, #6, #8) are already in the tree; three remain (`:24`, `:36`,
   `:97`). The file is 167/200 lines and will not shrink.
4. **The live `dhloot.prefs.v1` held `{ view }` only** (`app.js:1088` at
   `23c00a6^`). The READMEs' "and the height of note fields" was never true
   on either app (`COVERAGE.md:60` says so). Q1 restores the key; the
   note-height clause goes regardless.
5. **P13's word.** `help.ts:399,404` say "фреймы", `README.ru.md` uses
   "фрейм" four times and "сеттинг" once, `dict.ts` has `Фрейм` once and
   `Сеттинг`/`Сеттинги` twice. The `daggerheart-ru-terms` rule is "look it
   up": B7 fetches `https://ru.daggerheart.su/frame`, quotes the section
   title in the commit, and uses that word in all three keys.
6. **D16 has no benefit on either app.** The idle toast is `display: none`
   on both (`[popover]:not(:popover-open)` here; `hidden` on live), and a
   `display: none` element is not in the accessibility tree. Entry deleted
   with that reason (B2); no code.
7. **D8's `<h4 class="altcol">` is `TablesPage.svelte:538`**, not
   `TableRows.svelte`.
8. **P4(b) and D6 are one change.** `AddToList.svelte:174` measures the
   first `.btn` inside `.seldrop`; moving `.dropmenu` after the toggle makes
   that query return the toggle - D6's fix. `states.js:68-70,125` already
   has the 1100x900 case on Кольцо Тишины.
9. **P4(a) and the modal.** Escape inside the record modal reaches the
   `<dialog>`'s close; the menu's `onkeydown` must `stopPropagation()`.
10. **`git add -A` fingerprint (TL1/TL2)**: `work/` holds three PNGs,
    un-ignored, inside every commit-gate key today. B2 fixes the hooks and
    edits the ~40 markdown files in the same batch: every edit precedes the
    one gate, so the livelock the first plan ordered around cannot occur.
11. **O3 is D5 generalised** - one `$effect` in `Shell.svelte` (B6).
12. **B1's implementer improved the design**: `hayFor` caches an array of
    folded fields checked with `.some()`, so the cached and fallback paths
    agree by construction; `data.ts` is untouched. Recorded in the handoff.
13. **Cross-report identities the batches rely on**: T4 = DP4; PF3 = R4; S4
    + R2 one trigger gap; C1 = A2's symptom; C6 is an extraction, not a
    relocation; TL7 = DP8; T10 = DP9; DC10 = H3; DC11 = H4 = TL4's stale
    prose; H6, H7 inside C5; T9 inside C4; T8 dissolves under T1; TL8(c) is
    `CLAUDE.md:36`.

## Architecture and constraints that hold for every batch

- `app/src/lib/` stays pure; browser APIs behind `app/src/ports/`; shared UI
  in `app/src/components/`; a new component needs a `COVERED` entry in
  `app/src/components/a11y.test.ts:351` and a test that renders it under axe.
- Public contracts default to no change. No batch changes the hash grammar,
  ids, link encoding or asset paths. R5 widens what `#/l/` accepts (a payload
  that was never valid now reaches the bad-link page); R9 sends an unknown
  table name to the fallback; `404.html` adds a published file. Each updates
  `ROUTES.md`/`META.md` prose and adds a fixture row; none changes an
  encoding. B11 (data apostrophes) moves generated data and is the owner's
  opt-in, settled yes.
- Product laws are untouched.
- A behaviour change updates its spec in the same commit; a register entry
  is deleted in the commit that pays it; a new state gets its `inventory.js`
  entry and seeded golden in the same change.
- Commit as `artex-x <artex-x@users.noreply.github.com>`, Conventional
  Commits, no AI attribution trailer. Push after each batch's gates pass.

## B1 - search normalisation (O1, PF2) - SHIPPED `e7c7b50`

`foldQuery()` (case, `ё`->`е`, U+2019/U+02BC->`'`) on both sides;
`hayFor(statLine)` memoises an array of folded fields per record in
`search.ts` (the plan's joined-string design was rejected by the
implementer for a field-boundary false match - correct); `SearchPage` and
`TablesPage` fold once per language. Both `--only` golden runs green without
`--update`; `плетеная сеть` 0->1, `keeper's` 3->4. Record: `handoff.md`,
"Completed".

## Batches, in order

### B2 - hooks, ignore rules, truth fixes, `CLAUDE.md`, and the batch-size forcing function - SHIPPED `44b1761`; review remediation `c8cc38e`

Outcome: closed the hooks livelock (`isExempt` shared by `bash-guard.mjs`/`tree-key.mjs`, dropping exempt paths from the fingerprint); `.gitignore`/`.prettierignore` gained the missing entries; `bash-guard.mjs` gained the `restore --worktree`/`rm -r` guards; `tests/run-all.js` gained `--help` and the `i/`-missing preflight; `CLAUDE.md`'s three remaining Q7 edits (`:24`, `:36`, `:97`) plus the batch-size forcing-function line landed; ~20 spec/doc truth fixes landed across `COVERAGE.md`, `ROUTES.md`, `I18N.md`, `META.md`, `DEBT.md`, `CONTRACTS.md`, `llms.txt`, the READMEs; five new hook selftest cases; `H10`/`H12`/`H13`/`C4`/`T9` cleanup. Deviation: `wc -l CLAUDE.md` is 171, not the plan's predicted 168 (still comfortably under the 200-line cap; the specific "168 or less" acceptance line is recorded as unmet, not forced by cutting content). C9 (`eslint`'s `ignoreVoidReturningFunctions`) was tried and reverted - it cleared none of the three sites and exposed thirteen other pre-existing violations; the three `eslint-disable` comments stayed, with a comment recording the attempt. Review remediation (`c8cc38e`) fixed three blockers - a false `CONTRACTS.md` claim that `tools/build.js` strips empty descriptions (it does not); the nine-file count-bearing array in `tests/derived.js` renamed to `COUNT_BEARING_FILES` and every citation repointed at the identifier instead of a line range; a false `COVERAGE.md` claim that `Button.svelte` was deleted (it was not - `statLabels` was) - plus B1's nits N1-N6/N8 and the owner-approved N7 (search now folds Latin diacritics and the Unicode minus sign, so `Zweihänder`/`Möbius` and a literal minus sign are findable). Full detail: `git show 44b1761`, `git show c8cc38e`, or `issues/phase-8/handoff.md` as of `d882707`.

### B3 - CI shape (T1, T2, T5, T3, T8) - SHIPPED `3bc605d`

Outcome: `tests/run-all.js` gained `--shard=n/m` (a longest-first pack over a measured weight column); `.github/workflows/ci.yml`'s golden/sweep work moved into a 4-way `browser:` matrix, the standalone `golden:` job deleted; `tests/app/sweep.js` splits the 1180px width by language so the RU-only focus walk does not repeat on `en`; `tests/app/contracts.js` reuses one page context instead of one per fixture; `tests/derived.js`'s `deploy.needs` assertion renamed `golden` to `browser`. Deviation: this batch also renamed `deploy.needs` itself despite the dispatch's "that's B4's" note - the plan's own step assigned exactly this edit here, and leaving `deploy.needs` pointing at a deleted `golden` job would have left `deploy` permanently unable to run; resolved in the plan's favor as a one-line rename, flagged for the orchestrator to confirm. Measured (CI run `35232880507`): wall clock 738s -> 436s (**-41%**), billed runner-seconds 1244 -> 1583 (**+27%**, not the projected +10%); the 1180 split came in at 371.9s(ru)/172.7s(en), not the assumed even 275/275 - `sweep1180-ru` is now the single longest row in the suite and the CI wall-clock floor. Per-job duration table: `issues/phase-8/handoff.md` at `d882707`.

### B4 - deploy and gate correctness, and `404.html` (DP1-DP7, T4/DP4, T6, T10/DP9, R8) - SHIPPED `0a3d9fb`, `446e45b`

Outcome: `timeout-minutes` on every job; `contents: read` on `deploy`'s own `permissions`; a `check`-job step (`git diff --exit-code -- data.json catalog.csv`) that fails when generated data was not committed; a stub-count guard; push-to-main-only `concurrency.group: pages`; gitleaks pinned to a full SHA; `check-site.mjs` split into `check-site.lib.mjs` (an injectable-reader assertion list, `node --test` covered) and a thin CLI; `tests/app/golden.js` exports its DOM-free half under `require.main`, covered by new `golden.test.mjs`; `404.html` added (owner-approved, R8) - bilingual, `noindex`, tracked at the repo root, added to the deploy collect list and guard. Deviation: `404.html`'s links are root-anchored (`/daggerheart-loot/#/...`), not the plan's relative `./#/...` example - GitHub Pages can serve `404.html` for an arbitrarily nested bad path, where a relative link resolves wrong. Verified live and via the PR probe (`probe/dp4-stale-data`, PR #66, closed after use): a deliberately stale `catalog.csv` turned `check` red at the new step and green after rebuilding; the deployed 404 answers correctly (bilingual, `noindex`, `id="app-404"`).

### B5 - single sources: lib, generator and components (A1, A3, A4, A5, A7, A9, A11, O5, O6, H5, C1/A2, C5, H6, H7, C2, C7, C8, D7) - SHIPPED `112bd07`, `571b041`

Outcome: a dedup pass across `label.ts`/`listLink.ts`/`roll.ts`/`std.ts`/`print.ts`/`types.ts`/`frames.ts` (each now imports its shared domain type/table instead of keeping its own copy); `build-share-pages.js` gained per-line description rendering and exported its `EQ_*` maps, guarded against `i18n.ts` drifting from them; the fourteen clipboard/toast call sites collapsed onto `AppState.copied`/`say`; `Badge.svelte` and `NumRow.svelte` extracted, replacing duplicated markup in `RecordCard`/`RowMain`/`ListsPage`/`AltPanel`/`RollPanel`/`StdPanel`/`ListPage`; `tokens.css` gained `--ink-on-gold`/`--badge-bg`/`--gold-rgb` and dropped six unused custom properties; D7 (contrast) fixed - it was two opacity declarations, not a palette value - and deleted from `DEBT.md`. Deviation: `Badge.svelte` carries eleven variants, not the plan's nine - the extra two are `RecordCard`'s own die-result badge, folded in to avoid leaving a second, smaller `.badge` base-rule copy alive there. CI caught a real regression this batch's own local gate list did not cover (`tests/craft.js`'s stub-staleness probe broke on the new multi-line description rendering) - fixed same-day in the follow-up commit `571b041`. All four golden shards green throughout, confirming none of this moved a rendered byte.

### B6 - router, state and lists (P1, D19, D5/O3, P11, R7, S1, S2, S3/D2, S6, R5, R4, DC1, R9, R10, R1, R2, S4, S5, S7, R3/P9, PF3, D23, D12, A6, P5) - SHIPPED `370fec2` (shell/router/state), `11066f0` (lists/two-tab)

Outcome: skip-link focus fix and a proper gold overlay for it (D19); `TabBar` centres the active tab by geometry, not `scrollIntoView`; the router falls back through the same rule `go()` uses, and `App.svelte` gained a catch-all not-found branch plus the smallest `<svelte:boundary>`; a stale-hash double-navigate bug fixed (`#expectHash`); a failed shared-list expansion now keeps the address and draws a bad-link state instead of overwriting it with `#/l/zzzz` (Q4); `hash.ts` widened to accept any `#/l/` prefix and to send an unknown table name to the fallback (Q3); `router.ts`'s `replaceState` falls back to `location.hash` on a throw; `dhloot.prefs.v1`'s table-view persistence restored (Q1); list-storage corruption is now distinguished from "absent" and backed up once, with an undismissable notice; cross-tab sync also fires on `visibilitychange`/`pageshow`, not `storage` alone; a note field re-seeds live when unfocused; a stale `#deleted` entry no longer resurrects; a crafted shared-list link's dropped/clamped entries are toasted; the list-URL debounce (150ms) is flushed on `destroy`/`pagehide`, with a real `flushUrlSync`-vs-`del()` staleness bug found and fixed along the way; list-tick selection clears on navigation; delete gained an undo toast (P5). Deviation: D5/O3 (per-route `document.title`) was implemented, verified, then reverted in this batch - it moved 14 golden cells outside this batch's own two authorised new states, against its "nothing else moves" gate; it landed cleanly instead in B7, once that batch's re-record could absorb the movement (`DEBT.md` D5 closed there, not here).

### B7 - accessible names, product text and structure - the re-record (P2, P3, P6, P7, P13, P14, P15, pill name, D11, P4/D6, P8, P10, P12, D3, D8) - SHIPPED `e80a793` (code/docs), `dba6755` (golden `--update`); remediation `6b50945`

Outcome: row checkboxes, the record-modal dialog, and the list/import text fields now carry a real accessible name instead of a generic one; the filter pill's `×` is `aria-hidden`; search shows a "shown of total" line once its 300 cap bites; the add-to-list menu closes on Escape and stays clipped inside an open modal; `SelBar` now precedes `<footer>` in the DOM; three controls gained a 44x44 hit target; the storage-notice dismiss button moved out of `<summary>` (a first attempt hid it while folded in real Chromium, caught by eye and fixed before commit); the alt-item/alt-consumable tables gained correct heading levels; frame equipment's tier now prints everywhere else's does (D11/Q6, confirmed against `ru.daggerheart.su/frame`); an editorial pass on `dict.ts` (ASCII quotes, em dashes, numeral agreement) plus the matching `README.ru.md` fix; D5/O3 (per-route document titles, reverted in B6) landed for real. 107 of 112 golden states moved across twelve identified categories (all spot-checked against `git diff --stat`); the other 5 are "not found"/"nothing to show" states with no name to attach. Two bugs found and fixed beyond the dispatch's literal steps: `driver.js`'s name lookup ranked a row's own newly-named checkbox ahead of the row's own open button (P2 gave both a similar name) - split into `click()`/`tick()`; the storage-notice restructure's first attempt hid the dismiss cross while the notice was folded (a real browser detail jsdom does not model) - fixed, and the missing permanent regression coverage is flagged as `B7-N2` in `issues/phase-8/nits.md`. Remediation (`6b50945`) fixed a stale `f7` share-statline fixture that broke CI's `app/contracts` suite, a stale `noTier` doc comment, two stale `COVERAGE.md` claims, and added a frame-record tier-ladder test.

### B8 - record actions, print, motion and focus (D10, D13, D14, D15, D22, P16, R6, D20, D21, D1, D18) - SHIPPED `3c0fff8`; remediation `480c380`

Outcome: copy-image now detects a tainted canvas and falls back to text, then to a file download, when the clipboard cannot take an image (D10/D14/D15); roll-copy toasts (D13); share now sends the full text plus an image file when art exists (D22); the P16 print-name inspection (`#/print/cm26-f60-hi62-ci81`, both languages, both layouts) found every card fits in one line - no shrink needed, a pinning assertion added instead, per Q2's "look first" rule; broken print art now falls back cleanly (R6); the record modal and toasts are hidden under `@media print` (D20); black-and-white print mode moved to memory-only app state (D21); a blanket `prefers-reduced-motion: reduce` CSS kill added (D1, Q5); five redundant component-local focus-ring overrides deleted (D18). Deviation: a viewport left set by the P16 measurement broke three unrelated print-media checks on the first pass - fixed in the same commit (restore the driver's viewport in a `finally`). Remediation (`480c380`) restored one of the five deleted focus-ring overrides (`RecordCard.svelte`'s `.card-media` - genuinely needed, since the global rule's ring is clipped by `.card`'s `overflow: clip`; the other four stayed deleted as genuine no-ops), restructured `copyImage()` for Safari's user-gesture invariant (the clipboard call must receive the still-pending PNG promise, not an already-awaited blob - `clipboard.ts`'s own doc comment now states this from the caller's side too, and the vitest `fakeClipboard.writeImage` double was fixed to actually await its argument, matching the real port), and corrected two stale spec/test claims.

### B8.1 - the harness lost its settle instrument (the three timed owned-list goldens) - SHIPPED `d267a0a`; follow-up `dc7ed71`; review remediation `6b841f5`

Root cause: B8's blanket reduced-motion CSS kill collapsed the toast's real ~200ms fade to 0.01ms, so `tests/app/driver.js`'s `settle()` (an animation wait plus an 80ms sleep) started returning ~47ms before `ListPage`'s 150ms debounced URL write landed - deterministically wrong on the three toast-timed golden states that also mutate an owned list (`#/lists/a ~ removed`/`~ prices set`/`~ batch deleted`, `ru` only). Full mechanism and the measured timing table: `issues/phase-8/context.md`, "A deterministic B8 regression" / "The mechanism, measured 2026-09-18" - not to be re-derived. Fix (`d267a0a`): a new `addressSettled()` wait in `driver.js`, called before every golden capture (both languages, and after `waitForToast`), plus a `golden.test.mjs` coupling test tying the wait's constant to `ListPage`'s real debounce (proved to actually bite by temporarily changing the debounce and watching the coupling test fail, then reverting). Settled decisions, **not to be reopened without the owner**: (1) do not re-record the three goldens - their recorded payloads are the correct post-interaction ones, the untouched seed is what is wrong; (2) do not flush the URL synchronously in production to satisfy a harness timing - the 150ms debounce is a deliberate WebKit-throttling guard; (3) do not give the three states a per-state settle step in `inventory.js` - the capture-level wait covers the whole class with no per-state plumbing; (4) `timed: true` stays - it is correlated with, not the cause of, the failure (the real predicate is "the `enter` step mutates the list"); (5) keep the driver's `prefers-reduced-motion: reduce` emulation - it now exercises D1's real shipped behaviour and determinism, and dropping it would cost CI's `sweep1180-ru` (371.9s, the critical-path row) real minutes; (6) keep `settle()`'s animation wait even though the blanket CSS kill currently makes it inert - it is the correct instrument if the emulation is ever scoped down. All four golden shards green without `--update`. Follow-up (`dc7ed71`) fixed an unrelated `app/states` case-10 regression that this batch's own A6 gate surfaced (untouched by this batch's diff): the driver's clipboard `write` mock resolved without awaiting a promise-valued `ClipboardItem` entry, unlike the real API, so a tainted-canvas rejection never propagated. Review remediation (`6b841f5`) tightened `COVERAGE.md`'s B8.1 gate rule to require all four shards, not one - a single-shard proof would have missed this exact bug, which fell one failure per shard across shards 2/3/4 - plus four doc-comment nits (NIT-1..4, one proved to actually bite three refactor shapes) and one record correction (NIT-9); the rest of the review (R-1..R-6, NIT-5..NIT-8) is persisted in `issues/phase-8/nits.md`, "From B8.1's review", for B12.

### B9 - language and format: `tests/` and `tools/` (H1, T7, H13, H16, H15, T12, H11) - SHIPPED `0f0c73b`, `0baf86a`, `6b3f0eb`, `d660ce7`, `5602ca9`

Outcome: every (a) message and (c) comment in `tests/`/`tools/` (excluding
`tests/app/snapshots/`) translated to English, (b) product literals kept
byte-for-byte (page labels, list/item names, button grips, regexes
matching book vocabulary, seed/typed test data) - full per-file
acceptance-grep breakdown in `issues/phase-8/handoff.md`. H16's four-copy
`ok`/fail-counter helper extracted to `tests/ok.js` for the three files it
was free to touch alongside their (a) pass (`derived.js`, `dataint.js`,
`craft.js` - `contracts.js` was already 0-Cyrillic and outside the Files
list, so its own copy was left as is); H13 and H15 were found already
resolved by an earlier batch, verified rather than re-done; T12's stale
`sweep.js` comment likewise already fixed. `print.js`/`states.js`'s trap
(a Russian product string and a Russian message sharing one line) was read
per site, not swept; a handful of comments keep a Russian product name
beside its English gloss rather than guessing a canonical translation not
otherwise in the file (`Показатель Брони`, `Призрачный Клинок`, `Самоцвет
Чутья`, `Кольцо Тишины`). H11 landed as designed: `.prettierignore` drops
`tests/`/`tools/`, `eslint.config.mjs` un-ignores them plus
`.claude/hooks/**` (keeping `.claude/worktrees/` and the rest of
`.claude/` ignored) with a `disableTypeChecked` + node-globals block and
targeted rule turn-offs for real pre-existing patterns a format-only
commit could not otherwise touch, then `npx prettier --write tests tools`,
no hand edits. **Correction (B9 review remediation, `0686bb6`): the
ignore-pattern pair this commit shipped (`'.claude/**'` +
`'!.claude/hooks/**'`) never actually un-ignored the hooks - `.claude/**`
prunes the directory itself before the negation can apply, so
`.claude/hooks/**` stayed lint-dead until fixed to `'.claude/*'` +
`'!.claude/hooks'`. See `nits.md`, "Done", B9-BL-1.** A fifth commit
(`5602ca9`, coordinator-directed) translated
`tools/build-share-pages.js`'s last 2 Cyrillic comment lines - outside the
plan's own Files list, added because commit 4 had already made the file a
touched path via Prettier and the acceptance line covers the whole tree,
not just the Files list; the coordinator resolved that internal
inconsistency in the acceptance line's favour.

Two deviations from the plan as originally written, both raised by the
implementer and settled by the coordinator after independent verification,
not forced or silently resolved: (1) the `tools/build-share-pages.js`
gap above; (2) commit 4's "`git diff -w --stat` empty apart from the two
config files" acceptance line stays recorded as **unmet** on the
coordinator's explicit instruction - confirmed independently that these
files were never Prettier-formatted before B9, so the untranslated commit
3 tree reflows by hundreds of lines under this repo's own Prettier config
regardless of language content, which `git diff -w` cannot collapse (it
equates differing amounts of whitespace on aligned lines, not a different
number of lines). In place of the unmeetable diff-size proxy, a mechanical
substitute proof was required and delivered: `npx prettier --write` run
against commit 3's tree in an isolated scratch checkout reproduces commit
4's actual tree **byte-for-byte** (154 files, zero differences) - meaning
commit 4 truly is Prettier's output alone, with no lint-fix edits to any
file layered on top (every real per-file lint finding commit 4 surfaced
was resolved by a rule turn-off in `eslint.config.mjs`, not a file edit).
Full detail, including the per-file acceptance list and the reproduction
method: `issues/phase-8/handoff.md`.

### B10 - the record-modal host (C6) - SHIPPED `56dabbc`

Outcome: `RecordHost.svelte` extracted exactly as designed - it owns `open`,
renders `<RecordModal>`, exposes `openRecord` through its `children`
snippet parameter, and owns the close-on-navigation effect
`SearchPage`/`TablesPage` carried before this batch, now generalised to
every caller since the host owns `open` for all of them. All eight
`let open = $state<Record_ | null>(null)` sites (`AltPanel`, `ListPage`,
`RecordPage`, `RollPanel`, `SearchPage`, `SharedListPage`, `StdPanel`,
`TablesPage`) replaced with it; `ListPage` passes `extra` as a function of
the open record (`entryNoteBlock(metaOf(it.id), t)`), since which entry's
note applies depends on which record the host has open. No deviation: the
six `RecordCard` + snippet blocks were left alone - none extracted cleanly
without a new prop. `a11y.test.ts` gained a `COVERED` entry. All four
golden shards green without `--update` (112 states, none moved);
`npm run check` and `npm run check:built` both green. Full detail:
`git show 56dabbc`, or `issues/phase-8/handoff.md`.

### B11 - equipment apostrophes (O2) - SHIPPED `78b13f0`

Outcome: normalised U+2019 to the ASCII apostrophe in the `en`/`ende` fields
of 28 `eq` records in `data.js` (30 field values, 34 characters - some
records share one upgrade-chain description text, and two records had both
fields change); no other field, and no `items`/`alt`/`refs` record, touched
(verified by parsing old and new `data.js` and diffing every field).
`docs/fixtures/share/records.json` and `llms.txt` were checked and carry no
U+2019, so neither needed a matching update - no public-contract change.
`node tools/build.js` regenerated `data.json`/`catalog.csv`/`i/` from the
fixed source. Exactly the six predicted goldens moved
(`_search_searched`, `_search_a_row_ticked`, `_tables_eq_armor`,
`_tables_eq_secondary`, `_tables_eq_weapon`, `_tables_eq_weapon_panel_open`);
all four golden shards (112 states) green without `--update` confirms
nothing else did. No deviation.

## Where every finding landed

Every id from the first plan's B2-B20, by new batch. Nothing fell out.

| First plan | Findings | Now |
|---|---|---|
| B2 | TL1, TL2, TL3, TL4, TL5, TL6, TL7/DP8, TL8, H14, H4/DC11, CLAUDE.md:36 | B2 |
| B3 | DC1 (docs half), DC2-DC8, DC12, DC13, H2, H3/DC10, H5 (comment), H8, H9, H10, H11 (comment), H12, H13, H15, T11, T12, T16, O4, C3 (option 2), C4/T9, C9, A8, PF7, D4, D16, D17, the `llms.txt` and `CONTRACTS.md` clauses, Q7's three surviving edits | B2 |
| (new) | revision 2: the forcing function in `CLAUDE.md`, `plan.prompt.md`, `.claude/README.md` | B2 |
| B3 | DC9 - dropped by B2 (the `Button.svelte`/`statLabels` sentence was left false); fixed in the B2 review remediation batch, not in B2 itself - B2's three blockers, B-3 | B2 remediation |
| B4 | T1, T2, T3, T5, T8 | B3 |
| B5 | DP1, DP2, DP3, DP4/T4, DP5, DP6, DP7, T6, T10/DP9, gitleaks pin | B4 |
| (new) | R8 `404.html` (owner override) | B4 |
| B6 | A1, A3, A4, A5, A7, A9, A11 (`clamp`, `DIE_ART`), O5, O6, "830", H5 (guard) | B5 |
| B7 | C1/A2, C5, H6, H7, C2, C7, C8, D7 | B5 |
| B8 | P1, D19, D5/O3, P11, R7 (+ boundary), S1, S2, S3/D2, S6, `route` derived, R5, R4-2, DC1 (code), R9, R10 | B6 commit 1 |
| B9 | R1, R2, S4, S5, S7, R3/P9, R4-1/PF3, D23, D12, A6, P5, `create()` proxy, `works()` cache, `qty`/`gold` clamp | B6 commit 2 |
| B10 | P2, P3, P6, P7, P13, P14, P15, pill `aria-hidden`, D11 | B7 |
| B11 | P4(a), P4(b)/D6, P8, P10, P12, D3, D8, `lastTable` untrack | B7 |
| B12 | D10, D13, D14, D15, D22 | B8 |
| B13 | P16, R6, D20, D21 | B8 |
| B14 | D1, D18 | B8 |
| B15 | H1/T7 node suites and tools, H13 (tests half), H16, H15 (`stub.js`) | B9 commit 1 |
| B16 | H1/T7 small browser suites, T12 | B9 commit 2 |
| B17 | H1/T7 `print.js` + `states.js` | B9 commit 3 |
| B18 | H11 (format and lint) | B9 commit 4 |
| B19 | C6 | B10 |
| B20 | O2 | B11 |

Findings with no batch are in "Dropped" or "Deferred", unchanged from the
first plan.

## Owner decisions - settled

All eight questions are answered in `context.md`, "Settled owner
decisions", every one on the recommendation; plus `404.html` approved (B4)
and the twelve repo-decided items unvetoed. The plan above is written as
decided. `NEEDS_HUMAN_CONFIRMATION` is now `no` for B2-B11.

## `CLAUDE.md` - what remains of Q7

Fact 3 above: five of the nine proposed edits were already in the tree; the
copy the first pass read was stale. Remaining, all in B2: `:24` (the
inverted "preserves behaviour" line), `:36` ("parity run"), `:97` (the
`COUNTERS` pointer), plus revision 2's one forcing-function line. The file
ends at 168/200. No section is deleted, so nothing shrinks.

## Dropped, with the legitimate reason

Audit list. "Not a problem" means verified against the tree or accepted
from the report's own measurement.

| Finding | Reason | Note |
|---|---|---|
| PF1 (browser probe for search) | superseded | The only fix its number could justify beyond PF2 is virtualisation, excluded on golden grounds; PF2 was justified by O1's design and has shipped. |
| PF5, PF6 | not a problem | The report's own verdict, with measurements. |
| PF4 as a phase-8 batch | deferred to its own task | Contract change; not dropped. |
| T13, T14, T15, T17 | not a problem | Measured in the report; off the critical path. |
| C3 option 1 (`htmlWhitespaceSensitivity: strict`) | cure worse than disease | Reflows ~45 files permanently for a hazard with four sites; option 2 taken. |
| P6 via `Field` emitting `<label>` | cure worse than disease | `Field` wraps chip rows and segmented switches; a `<label>` around buttons is wrong. |
| D16 | not a problem | Fact 6: the idle region is `display: none` on both apps. |
| `components.md` "not worth it" (`panel` class on `ffilter`/`tablenav`, `Panel`'s inline copies, `PageHead`/`PageTitle` `.page-h`, `DiceBar`, `Shell` writing `document.title`, `app.env.*` reads, `PageTitle` branching, `ListPage` size) | not a problem / cure worse | Each has its reason at the site; the `ListPage` split is deferred. |
| A10, A12 | not a problem | Map facts; nothing proposed. |
| A11 `pick`/`Panel` naming, `isLastOn`'s home | cure worse than disease | Renames across route-level components for a word collision. |
| `open.md`: `listLink.ts` `btoa`/`atob`, `.nvmrc` vs `engines` | not a problem | Both `globalThis`, Node-safe; CI pins from `.nvmrc`. |
| `resilience.md`: truncated-note checksum | cure worse than disease | A payload-grammar change for a failure the reader can see. |
| `window.confirm` in a sandboxed iframe; unguarded `showModal()` | not a problem | Below the app's floor. |
| `state.md` `$state.raw` | cure worse than disease | The report's own verdict. |
| `load()` ignoring the v1-migration write's result | not a problem | The undismissable notice already shows. |
| `deploy.md`: the 60 s retry, `cp -r` comment, `workflow_dispatch`, burst-cancel, `[skip ci]` | not a problem | Measured or inherent to the right setting. SHA-pinning `actions/*` dropped as cure worse; `gitleaks` pinned (B4). |
| `hygiene.md`: 102 `app.js:NNNN` citations, `tools/` orphans, `test-output/` logs, `issues/` pruning, `numField.ts` comment density | not a problem | `CLAUDE.md:16-18` resolves the citations once; `app.js` is frozen. |
| `product.md`: two rarity vocabularies | unverified | Needs the Core book. Owner may confirm and add one `FEATURES.md` sentence. |
| `product.md`: a shared list with an empty name | not a problem | Correct fallback. |
| `product.md`: search help panel | owner's content | Listed under the UI/UX ticket. |
| `product.md`: roll live region summary, money-picker discoverability, undo toast focus | deferred to the UI/UX ticket | Design changes. |
| TL3 family 2 | cure worse than disease | Rewards a dead citation; recorded in the README. |
| DC14 (`issues/56`, `issues/59` cite `docs/parity.md`) | outside this task's write scope | The orchestrator passes it on. |
| The first plan's "fact 3" (`CLAUDE.md` names `eqtest,qa`) | not a problem - retracted | The injected copy was stale; the file on disk is right (fact 3 above). |
| T7's and H1's batch splits | superseded | Replaced by B9's four commits. |
| T8 | superseded | Dissolves under T1 (B3). |

R8 (`404.html`) moved from "not planned" to B4 on the owner's decision.

## Deferred to the two excluded tickets, and to tasks of their own

**Consistent storage layer** (owner's ticket) inherits: R1's general form
(versioned envelope, schema validation on read, migration chain) - B6
patches the destructive symptom only; S4's deeper half (whole-list
last-writer-wins; per-entry or per-field reconciliation);
`dhloot.lang.v1`/`home.v1`/`warn.v1` not watched across tabs; the
`.bad`-key recovery beyond a notice; PF3's `save()` debounce (measure first
with the probe `performance.md` describes); a list export/backup file
(`resilience.md`; no upload service, a local `.json` download - product
decision).

**UI/UX redesign** (owner's ticket) inherits: the focus-management pass
(toast actions unreachable by keyboard, a labelled selection region, menu
focus) - P4 and P10 are its cheap edges and are done in B7; the roll
results live region reading four whole cards; the money picker hidden until
a price exists and the "Золото" header over "3 мешка" values; a help panel
for Search (owner-written content); an inlined first-paint skeleton (PF5); a
`<svelte:boundary>` reporting framework beyond B6's minimal boundary.

**Tasks of their own** (costed, not dropped): PF4 image derivatives (a
192 px variant under a new asset path; `CONTRACTS.md`, `docs/fixtures/`,
`tests/contracts.js`, `llms.txt` in one commit; ~2 MB of files); splitting
`ListPage.svelte` (1692 lines; a golden plan per seam; after B10); A2's
remaining half (every port through `AppState`); decomposing `AppState`;
`Record_.tier` -> `voaTier` (wire-name adapter, contract); branded id types;
one home for the shared-link wire constants (contract docs + fixtures); the
release-shape change of publishing the artifact `check` proved
(`deploy.md`); a replacement heavy-run lock (`.claude/README.md:282-295`);
the Playwright decision (issue 47 handoff, "Phase 8 opening inputs").

## Gate cost, both shapes

Local, idle-host estimates from `.claude/README.md`'s table (`check` ~3-8
min as measured this week, a golden shard ~5 min, a sweep width ~5.5-10 min,
the pooled browser subset ~5 min, `app/states` ~2 min, `app/print` ~3 min,
a CI watch ~7 min after B3).

| Batch | `check` runs | Other gates | Approx. |
|---|---|---|---|
| B2 | 1 | 2 fs suites | 8 min |
| B3 | 1 | 1 local shard of `run-all`, CI watch | 18 min |
| B4 | 1 | CI watch, PR probe run, re-run timing | 23 min |
| B5 | 1 | built, typo/hues, sweep 768, 4 golden shards, fs, `--only` | 40 min |
| B6 | 2 | built, 2 `--only`, states, contracts | 25 min |
| B7 | 2 | built, 4 shards `--update`, 1 shard verify, sweep 768, states | 45 min |
| B8 | 1 | built, states+print, sweep 1180, 2 `--only` | 28 min |
| B8.1 | 1 | build, 1 `--only` probe, 4 golden shards, pooled subset | 35 min |
| B9 | 4 | pooled subset x2, sweep 390, 1 shard | 40 min |
| B10 | 1 | 4 shards | 28 min |
| B11 | 1 | build, fs suites, 2 `--only --update`, verify | 14 min |
| B12a | 1 | fs suites, build, 2 guard proofs + 2 restore runs of `app/typo` | 18 min |
| B12b | 1 | 0-2 `--only` probes; `check:built` only if a `.svelte`/CSS row lands | 15 min |
| B12c | 1 | fs suites, one CI watch after the push | 18 min |
| B12d | 1 | built, states, print, contracts, sweep 1180, 2 `--only`, 4 shards only if a row re-records | 45 min |
| **Total B2-B11** | **16** | | **~5.1 h** |
| **Total B12a-d** | **4** | | **~1.6 h** |

B8.1 was added 2026-09-18 after B8 shipped; its criterion is in its own
section ("Stands alone because"). Its four golden shards are the largest
single line in the table and are not negotiable down - a hand-picked `--only=`
is what let the defect through in the first place.

The first plan's B2-B20 shape: 18 `check` runs, 21 golden shard runs, five
sweep widths - roughly 5.5-6 h before counting review passes. The merge
removes nine batch boundaries, three `check` runs and four shard runs; the
remaining `check` count is set by the commit boundaries reviewability
demands (B6, B7, B9), not by batch count.

## B12 - clear the nit register

Added 2026-09-17 on the owner's instruction, after nits slipped twice:
B3's review nits were dispatched with B4, which shipped without them; they
were re-routed to B5, which did them; B4's own nits were then folded into B7,
repeating the move that had just failed. The owner: "it's already second time
we ask to fix nits but they are not being fixed, let's instead plan b12 to fix
ALL nits."

- **Objective**: `issues/phase-8/nits.md` has no `outstanding` or `verify`
  rows left. The nits **are** the acceptance criteria, not an addendum to
  another scope - that is the whole point of the batch existing.
- **Scope**: every row in that register's "Outstanding" and "Carried,
  needing confirmation" tables. The `verify` rows are confirmed against the
  tree first and then either actioned or marked `done <sha>` with the commit
  that actually did them.
- **Out of scope**: the "Deferred out of phase-8" table. Each row there has a
  reason; a row may only move out of it by the owner's decision, not by an
  implementer's convenience.
- **Position**: last, after B11. It collects the nits from B5-B11's reviews
  too - so B12 is dispatched only once every other batch has been reviewed,
  and the register is complete. It now is: B11's review landed 2026-09-18 and
  was the last one owed.

### The census, 2026-09-18 (planner, read-only at `78981b2`)

108 table rows exist in `nits.md`. Three (`B2-6`, `B3-N9`, `perf-PF4`) are in
"Deferred out of phase-8" and are not B12's. Three inside the Outstanding
tables already carry `done` (`B7-R3` `6b50945`; `B8-R1`, `B8-R2` `480c380`).
**103 live rows** remain - 100 in the ten "Outstanding" sections plus the
three in "Carried, needing confirmation". That is the number B12 clears. (A
dispatch note of "105" counted the two already-deferred rows; the exact
census above supersedes it, and B12a records it in the register.)

Of the 103, thirteen need no edit at all and close on a decision rather than
a diff: `B8.1-R1`..`B8.1-R6` and `B9-R3` are "verified reasoning, no action"
by the reviewer's own grading; `B5-R2`, `B5-R3`, `B4-10`, `B5-N10/11/12` are
closed by this plan below with the reason recorded.

Eight verdicts were established here, so B12a does not re-derive them:

| row | verdict at `78981b2` |
|---|---|
| `B4-4` | **live** - `ci.yml:316`'s `csv_rows` still reads the repo-root `catalog.csv`, not `_site/catalog.csv`. |
| `B4-7` | **half done** - the misplaced `# gitleaks reads history` comment is already gone from `ci.yml:39`; the bare `fetch-depth: 0` in the `check` job remains, and dropping it is the only action left. |
| `B2-4` | **moved** - `TAB_LIST` no longer exists in `app/src/lib/frames.ts`; the one surviving citation is a comment at `app/src/state/app.test.ts:68`. The row's target moves there. |
| `B2-5` | **live** - `.claude/README.md:109` still reads "commits when `npm run check` has not passed for the tree". |
| `B1-N9` | **live** - `app/src/lib/search.ts:125` is still `matches(it, q, statLine, hay?)`; the mismatch is still representable. |
| `B7-N7` / `B8-N8` | **already done** - `issues/phase-8/handoff.md:303` carries a top-level `## Verification`. Both close in B12a with no edit. |
| `B11-BL-1` | **live** - `app/src/lib/search.test.ts:143-146`'s comment still says `q80` "is stored with U+2019"; false since `78b13f0`. |
| `B11-R1` | **live** - `tests/app/lib.js:20-23` guards existence only. All seven `tests/app/` suites `require('./lib.js')` (`contracts:9`, `hues:13`, `print:39`, `states:11`, `sweep:16`, `typo:23`, and `golden:349` inside `require.main`), so one guard reaches all seven - and `golden.test.mjs`, which imports golden's DOM-free half **without** `lib.js`, is unaffected, so `npm run check` cannot be broken by it. |

**How B12a establishes the rest cheaply** (the answer to "a pass per row
would cost more than the fixes"): one scripted sweep, not 103 reads. Every
row already names a file and usually a line or an identifier, so the sweep is
one discriminating `git grep` per row, run from a throwaway script in the
session scratchpad (not committed), printing one verdict line per id. Where
the question is *which commit did it*, `git log -S'<token>' --oneline --
<path>` answers it in one call. Rows with no greppable discriminator are the
thirteen decision-closed rows above. Budget: minutes, once, for all 103.

### Shape: four consecutive pieces, all inside phase-8

One batch cannot hold 103 rows spanning `tools/`, `.github/workflows/`,
`docs/specs/`, `app/src/lib/`, `app/src/components/`, `tests/` and
`.claude/`: `CLAUDE.md`, "Task and session protocol" forbids a batch "whose
review cannot be held in one pass", and it equally forbids a split with no
criterion. B12 is therefore **one terminal batch in four consecutive
pieces**, `B12a` -> `B12d`, every one of them dispatched inside this phase,
in order, with no piece left to a future task. This is not the move that
failed twice: that move handed nits to a batch with **another** scope, which
finished its scope and treated them as optional. Here the nits are the only
scope of all four pieces, and "How the tail is guaranteed to land" below is
the mechanism, not the intention.

Merging *inside* each piece is deliberate: the 23 tooling rows in `B12c`
share one `check` and one CI watch, so forty of them would cost what eight
do. The splits are only at the three seams below, each named in
`CLAUDE.md`'s own terms.

| seam | criterion | why it is not a merge |
|---|---|---|
| `B12a` \| `B12b` | **a commit boundary the harness cannot reach** (`CLAUDE.md`'s third named criterion; `.claude/README.md`, "The test", bullet 3) | `B11-R1` *adds the reach*. Today a browser-suite run against a lagging `dist/` prints "unchanged" while measuring nothing, and a `--update` re-records the old render. Every browser proof `B12b`-`B12d` produce is worth nothing until that guard exists, so the piece that adds it lands first, on its own commit, and a later red bisects. |
| `B12b` \| `B12c` | **a review that cannot be held in one pass** (`CLAUDE.md`, same section) | The two halves are 51 unrelated one-line rows across ~28 files in two different judgement frames. `B12b` is production source, judged against `FEATURES.md`/`STATE.md`/`DEBT.md` and the architecture boundaries, and can move rendered output. `B12c` is harness, tooling and CI, judged against `COVERAGE.md` and the CI shape, and cannot move rendered output at all. Splitting costs one `check`; not splitting asks one reviewer to re-derive 51 separate contexts, which is where this phase's recorded failure - a record claiming a verification that did not happen, found three times - recurs. |
| `B12c` \| `B12d` | **a different route and filter set** (`CLAUDE.md`'s second named criterion) | `B12d`'s gates (`app/states`, `app/print`, `app/contracts`, `sweep.js 1180`, golden probes, `check:built`) are shared with nothing in `B12a`-`B12c`. Merging "saves a `check` and nothing else" (`.claude/README.md`, "The test") while adding a browser-harness frame to a code review pass. `B12d` also carries the three measurements this phase owes, which need the tree and a real browser. |

A fourth benefit, from this task's own review policy (`context.md`, "Review
and nit policy"): each piece's review runs read-only against its committed
shas **while the next piece's implementer works**, so three of the four
reviews cost no wall clock. A single 103-row batch has nothing to overlap
with.

### How the tail is guaranteed to land

1. **Every live row is a named acceptance line in exactly one piece.** The
   four id lists below place all 103. A row that appears in no list is a
   planning defect, not an implementer's discretion.
2. **The register is the ledger, updated in the same commit.** Each piece's
   commit moves its rows out of "Outstanding" to `Done <sha>`, to `closed
   <sha> (no change - <reason>)`, or to "Deferred out of phase-8" with a
   reason. A commit that leaves a routed row in "Outstanding" does not close
   its piece. `closed` is a fourth status value this batch introduces, and it
   is authorised only for the rows this plan names.
3. **Outstanding never grows and is never carried forward silently.** A row
   that cannot land moves to Deferred with a visible reason in the same
   commit and is reported in the handoff - never left where a later session
   has to notice it.
4. **Nothing is listed after `B12d`.** B12 is the **terminal** batch, so
   `orchestrate.prompt.md`, "Nits: defer mid-plan, clear on the terminal
   batch" applies: each piece's own review findings are cleared in that
   piece's one remediation cycle, not appended to the register for a fifth
   piece. Otherwise the register can never empty. A **blocker** found by a
   B12 review is remediated on that piece's own cycle and is never demoted
   into the next piece (`orchestrate.prompt.md`, "Blockers do not go to a nit
   batch").
5. **A deferral that is a live defect ships a `docs/specs/DEBT.md` entry in
   the same commit**, so it survives `issues/phase-8/`'s retirement. A task
   directory retires; a spec does not.
6. **Retirement is gated on the register.** The task is not retired while
   `nits.md` has an "Outstanding" row, and `handoff.md`'s "Next batch" names
   the next unlanded piece at all times - so a session boundary **between**
   pieces loses nothing and is not a deferral.

### Rows this plan moves to Deferred, with the owner's overrule in one line

Named here rather than discovered mid-batch. Each is not nit-sized under
`CLAUDE.md`'s campsite rule (a nit that wants a redesign, a public-contract
change, a new spec, or work outside the paths its batch touched is not a
nit). The owner reverses any of them by saying so; the row then joins
`B12b`'s or `B12d`'s acceptance list unchanged.

| row | why it is not a nit | where it goes |
|---|---|---|
| `B6-R1` (`.bad` second corruption never backed up, first backup orphaned forever) | The fix needs a backup **keying scheme** (timestamped keys grow `localStorage` without bound; dropping `.bad` on a successful read discards the first loss) and a way for a user to reach the backup at all. `plan.md`'s own deferred list already routes "the `.bad`-key recovery beyond a notice" to the consistent-storage ticket; this is that row. | Deferred to the consistent-storage ticket + a `DEBT.md` entry (live data loss behind a notice that claims preservation). |
| `B6-R5` (every id dropped -> `badShare` instead of `droppedItems`) | Telling "the link is damaged" apart from "every item in it is gone" is a new user-visible outcome: a `dict.ts` string pair in two languages, a `FEATURES.md`/`ROUTES.md` sentence, and - if it draws a different page - an `inventory.js` entry and a seeded golden in the same change (`CLAUDE.md`). That is a batch. | Deferred + a `DEBT.md` entry (the user is told the wrong thing). |
| `B8-N7` (`scrollIntoView({behavior:'smooth'})` still animates under `reduce`) | The boundary-respecting fix needs a `matchMedia` read, and there is **no `matchMedia` anywhere in `app/src` today** (verified) - so it needs a new `app/src/ports/` surface with its type, its `index.ts` entry, its fake and its per-file coverage. The one-line alternative (drop `behavior: 'smooth'` for everyone) is a UX decision the owner did not make under Q5. | Deferred + a `DEBT.md` entry (a real reduced-motion defect, one line from a fix once a port exists). |
| `B6-N4` (`dict.ts` `badStorage`: "under a separate key" is unactionable) | Removing or rewriting an informational clause is product **content**, and `context.md`'s language policy puts `dict.ts` in the product's own voice. The register grades it *(taste)*. B12 is not a product-text batch. | Deferred to the UI/UX ticket. No `DEBT.md` entry - not a defect. |
| `B8-N6` (D1's rule zeroes durations but not delays) | The register grades it *(deferred-scope)* itself: the plan specified those four declarations and **the owner approved them under Q5**, so changing the rule is a policy edit to an owner decision, for a hazard with zero sites in the tree. | Deferred. No `DEBT.md` entry - not a defect. |

The line this plan draws between "product copy is the owner's" and "an
editorial pass is in scope": `B7-N15` (an English hyphen where its neighbour
uses an em dash) **stays in scope**, because P14's editorial pass is already
owner-approved and punctuation consistency is that pass's own rule; `B6-N4`
is deferred, because it changes what the sentence tells the reader.

`B7-R4` (the 44x44 hit targets overlapping editable neighbours) is **not**
deferred but is bounded: `B12d` measures it; if the overlap reproduces, do
**not** redesign the target and do not shrink below 44px - P12's own
acceptance forbids both - record it in `DEBT.md` with the measurement and
route the redesign to the UI/UX ticket in the same commit.

### Decisions this plan takes so the implementer does not have to

Recorded here because each is a fork the register leaves open.

- **`B11-BL-2` covers all four text fields** (`en`, `ende`, `ru`, `rud`), not
  just the two Q8 normalised. The invariant exists to stop the *next* ingest
  re-introducing O2, and the source book uses typographic apostrophes in both
  languages; all four pass today (`data.js` holds zero U+2019 and zero
  U+02BC, the Russian text uses `«»`), so the wider rule costs nothing and
  closes the whole class. The register asked B12 to state which it chose.
- **`B8-R3` takes the documentation half, not a new string.** Measure the
  real `toBlob` encode time on this host, then either raise the 2000 ms
  watchdog with the measured number beside it or keep it with the number
  recorded. Do **not** add a `dict.ts` key to tell a slow encode apart from a
  tainted canvas - a new user-facing string is product text and B12 is not a
  product-text batch. Naming the two `Error` causes apart *internally* (so
  the log says which) is in scope and free.
- **`B10-N4` takes the sentence, not the structural move.** Moving
  `ListPage`'s `<RecordHost>` inside the `{:else}` branch changes what
  mounts on `#/l/<payload>` and can move a golden; one sentence recording the
  invariant cannot.
- **`B5-N10/11/12`**: reword the three comments to their true reason; delete a
  re-export only if `findReferences` shows it has no caller (`RARITIES` is
  the one to check). `CLAUDE.md`'s "add no export before something uses it"
  governs *adding*, not removing a live alias, so a re-export with callers
  stays.
- **`B1-N9`**: do the union third argument, after `findReferences` on
  `matches`. If it forces more than six call-site edits or type gymnastics,
  fall back to a doc clause and record why - the row is graded
  *(taste-adjacent)* and a sprawling refactor is not what it asked for.
- **`B4-10`, `B5-R2`, `B5-R3`** close with **no change**: `B4-10` is the
  register's own "probably leave" with a real branch-build justification;
  `B5-R2` is an understanding to record in `COVERAGE.md`'s prose, not a code
  change; `B5-R3`'s `.grow` invariant has no instrument short of a CSS test
  this repo does not have. Each records its reason in the register.
- **A user-visible string is a golden question before it is an edit.** Any
  row that changes a string a screen can draw (`B8-N2`, `B7-N15`, `B7-N1`,
  `B11-N2`) runs `git grep -F '<old string>' -- tests/app/snapshots` first.
  Zero hits -> the row is check-gated and stays in its piece. Any hit -> the
  row moves to `B12d` and re-records in the same commit, with the moved
  states named. A nit that changes what a screen draws was mis-classified,
  and this is how that is caught before the diff, not after.

### B12a - the census, the three routed findings, and the record rows - SHIPPED `e52f5de`

Outcome: verdict recorded for all 103 live register rows in `nits.md`
("### Census, 2026-09-18, at e7ce2ad"), one found already done along the
way (`B5-N15`, B9's own translation commit). The three routed findings
landed exactly as decided: `B11-BL-1` re-points the apostrophe test at
the query side and is proved to bite (deleting `search.ts:71` fails the
case; restoring it passes; `app/src/lib/search.ts` byte-identical
afterward); `B11-BL-2` adds the typographic-apostrophe invariant to
`tests/dataint.js`'s text-hygiene loop over all four fields, proved
against a fabricated record; `B11-R1` adds the fail-closed stale-`dist/`
guard to `tests/app/lib.js` (byte half + mtime half) with all six proof
results recorded, plus one sentence in `COVERAGE.md`. `B7-N3` (the
unused `allow` parameter) deleted alongside `B11-R1` in the same file.
Thirteen record/spec rows landed as doc edits; fourteen closed with no
change (decision already made, or already done); five rows moved to
"Deferred out of phase-8" with reasons, three of them owed a `DEBT.md`
entry in `B12b`. No deviation in scope; one discrepancy recorded (this
section's own step 7 undercounts "Rows this plan moves to Deferred" by
one row - both are this plan's own text, not a finding about the tree; the
five-row table is authoritative, per `nits.md`'s note under its Deferred
table). Full detail: `git show e52f5de`,
or `issues/phase-8/handoff.md`.

### B12b - production source (`app/src/**`), and the DEBT entries - SHIPPED `607b252`

Outcome: all 25 live rows landed as real edits (`B5-N5`, `B5-N6`, `B5-N8`,
`B5-N9`, `B5-N13`, `B5-N10/11/12`, `B6-R3`, `B6-R4`, `B6-N3`, `B6-N5`,
`B7-N9`, `B7-N10`, `B7-N11`, `B7-N12`, `B8-R3`, `B8-R4`, `B8-N1`, `B8-N2`,
`B10-N1`, `B10-N2`, `B10-N3`, `B10-N4`, `B10-N5`, `B2-4`); `B1-N9` closed
with no change (the union third argument touches ten-odd call sites, past
this row's own six-call-site/no-type-gymnastics budget - a doc clause on
`matches` records the risk instead); `B5-R3` confirmed already closed by
B12a's census, no further action. The two behaviour fixes (`B6-R3`,
`B6-R4`) each proved to bite with a new test, reverted and restored; every
other row is a comment, a type narrowing, a test addition, or a doc clause,
recorded as such rather than proved in the failing direction. Three new
`docs/specs/DEBT.md` entries landed (`D24`-`D26`, for `B6-R1`, `B6-R5`,
`B8-N7`) under a new, non-migration-framed heading. No row moved rendered
output - `B8-N2`'s string change was checked against `tests/app/snapshots/`
first and found zero hits, so it stayed here rather than moving to `B12d`.
`npm run check:built` not run (no `.svelte` template or CSS declaration
landed). Full detail: `git show <sha>`, or `issues/phase-8/handoff.md`.

### B12c - harness, tooling and CI

**Criterion**: see both seams above. These rows cannot move rendered output
at all, and they share one `check` plus one CI watch.

**Rows**: `B4-R1`, `B4-R2`, `B4-R3`, `B4-R4`, `B4-1`, `B4-2`, `B4-3`,
`B4-4`, `B4-5`, `B4-6`, `B4-7`, `B4-10`, `B5-R1`, `B5-N3`, `B5-N14`,
`B5-N15`, `B6-N2`, `B8.1-N1`, `B9-R2`, `B9-N3`, `B9-N5`, `B9-N6`, `B9-N11`.

Notes the implementer needs:

- **`B4-3` is the row that must record an unmet line as unmet.** Add the
  `echo` before the `if` so the deploy log actually carries the stub count,
  and record in `handoff.md` that the original acceptance line ("the deploy
  log shows the stub-count line") was **not met** at B4 - do not restate it
  as met now that it is. This phase has three times found a record claiming
  a verification that did not happen; this is the fix for one of them.
- **`B4-4` and `B4-7` are settled by the census above**, not open questions.
- **`B9-R2` and `B9-N5` are one edit**: narrow or fix the four code-rule
  turn-offs and enumerate every site per rule. `no-regex-spaces` (5 sites)
  and the two 3-line fixes prefer the fix; `preserve-caught-error` prefers
  three inline disables over a directory-wide off.
- **`B5-N15`** is likely already closed by B9's wholesale translation of
  `tests/` - the census settles it before any edit.

**Gates**: `rtk npm run check`; `node tests/run-all.js
contracts,derived,dataint,craft,stub`; **one CI watch after the push**, which
is the only instrument that can see `B4-3`'s echo and `B4-4`'s `_site` path -
the `deploy` job runs on push to `main`.

### B12d - the browser-gated rows and the three measurements this phase owes

**Criterion**: a different route and filter set (seam table above).

**Rows**: `B6-N1`, `B7-N1`, `B7-N2`, `B7-R1`, `B7-R2`, `B7-R4`, `B7-N4`,
`B7-N13`, `B7-N15`, `B8-R6`, `B8-N4`, `B8.1-N2`, `B8.1-N3`, `B11-N2`,
`B11-N3`.

**Coupled rows that must ship in one commit**: `B7-N1` (`help.ts:544`'s
`Players’ link`), `B11-N2` (`inventory.js:150-151`'s value and its false
comment) and `B11-N3` (the coupling itself). Straightening one without the
other leaves the driver's name lookup and the live label disagreeing in the
opposite direction. `help.ts` is `app/src` but rides here, because this is
the piece that can prove the string moves no golden.

**The three measurements**, each its own acceptance line - they are owed from
B7 and B8 and have never been run:

1. `node tests/app/sweep.js 1180` with the English axe path exercised, which
   the `allow` removal was never proved against (`sweep.js` runs axe on
   Russian only at that width).
2. The scroll-to-bottom measurement of `.selbarwrap` and `.foot` with a
   selection at 1180 **and** 375 - the measurement P10's own acceptance line
   asked for and `B7-R1` shows was never taken. Both existing instruments
   measure the unscrolled page, which is the one position where the
   difference cannot appear.
3. `B7-R4`'s 44x44 overlap: measure `.note-x::after` against the note
   `<textarea>` and `.warn-x::after` against the notice box. If the overlap
   reproduces, `DEBT.md` entry with the measurement; do not redesign, do not
   shrink below 44px.

**One check nothing in this repository can perform** stays owed and is
recorded as owed, not silently closed: confirming `.card-media`'s focus ring
is drawn inside `.card` at both `.full` and `.compact` needs a human eye or a
screenshot. `focusWalk` reads computed style, goldens read structure, axe
checks neither. `B12d` records it under Blockers as an owner/human action,
with the exact route and widths to look at.

**Gates**: `rtk npm run check`; `npm run check:built`; `node
tests/run-all.js app/states,app/print,app/contracts`; `node
tests/app/sweep.js 1180`; two `node tests/app/golden.js --only=<sub>` probes
for the string rows. **All four golden shards only if a row re-records** -
and a re-record in a nit batch is a stop-and-report first
(`COVERAGE.md`'s B8.1 gate rule requires all four shards, not one, when a
golden moves).

**Closeout.** After `B12d` and its review, `nits.md`'s "Outstanding" table is
empty and the task is retirable per `.claude/skills/handoff/SKILL.md`,
"Retirement". Nothing in this plan follows it.

**Standing rule this batch establishes**: a review's nits are appended to
`nits.md` when the review lands, not when somebody gets to them. The findings
otherwise live only in an orchestrator's context and are lost with the
session - which was true of four reviews' findings until this file was
written.
