# Nit register - TASK phase-8

Every nit and non-blocking risk returned by a phase-8 review, with its
status. **B12 is the batch that clears this file**; nits are no longer folded
into unrelated batches, because that failed twice (see "Why this file exists").

Reviews return their findings to the orchestrator as messages, not as files.
Before this register existed, four reviews' findings lived only in one
session's context and would have been lost with it. Any future review's nits
are appended here **when the review lands**, not when they are actioned.

Status values: `done <sha>` / `outstanding` / `verify` (believed done, not
confirmed) / `deferred` (deliberately out of phase-8, with a reason).

## Why this file exists

- B3's review nits N2-N8 were dispatched with B4. B4 shipped without them and
  said they were outside its file list. They were re-routed to B5, which did
  do them.
- B4's own review nits were then folded into B7 - the same move that had just
  failed once.
- The owner stopped it: "it's already second time we ask to fix nits but they
  are not being fixed, let's instead plan b12 to fix ALL nits."

The root cause is structural, not an agent failing: an implementer given a
named batch scope plus a list of unrelated one-liners will finish the scope
and treat the one-liners as optional. Phase 8's batches were merged **by
area** so they do not overlap, which means a nit usually has no later batch
to ride - the premise behind `orchestrate.prompt.md`'s "defer nits mid-plan"
does not hold here. A dedicated batch where the nits **are** the acceptance
criteria is the answer.

## Outstanding - B12's scope

### From B4's review (deploy and gate correctness)

| id | where | what |
|---|---|---|
| B4-R1 | `tools/check-site.lib.mjs` (the `dirReader` comment) | Claims it "emulates GitHub Pages' missing-path rule **exactly**". It emulates one rule. Measured divergences against the live site: extensionless `/i/w1` is 200 live, 404 locally; a directory path throws `EISDIR`; a case-insensitive filesystem returns 200 where Pages returns 404. No current check is affected - every path in `checks()` is an exact file - but the word "exactly" invites a future author to trust a local probe that would lie. Narrow the comment to the fallback rule only and say why every path is an exact file. |
| B4-R2 | `tools/check-site.test.mjs` | Asserts only `list.length > 10`. The exact failure T10/DP9 exists to prevent - an assertion silently vanishing in a refactor - would keep this suite green. Assert the sorted distinct path set and the exact count. The 14-assertion inventory in B4's review is the artefact to encode. |
| B4-R3 | `tools/check-site.lib.mjs:143-145` | The retry budget (12 paths x 15 s x 6 tries + waits, ~19 min) exceeds `deploy`'s `timeout-minutes: 10`. The comment's claim that the signal avoids hanging to the job timeout holds for one stalled socket, not a broadly stalled CDN. Reword, or bound the total. |
| B4-R4 | `404.html:43,44,48,49` | `/daggerheart-loot/` is now hardcoded in a fifth place with nothing pinning it (with `tools/derived.js:10`, `tools/build-share-pages.js:13`, `llms.txt`). A repo rename or an apex `CNAME` breaks both links with every gate green. `tests/derived.js` already reads `SITE`; one assertion that `404.html` contains `SITE`'s pathname closes it. |
| B4-1 | `tests/app/golden.js` | Exports six symbols nothing consumes (`KEEP_KEYS`, `sigOf`, `lineFor`, `controlLine`, `serializeTree`, `slugOf`) - against `CLAUDE.md`, "Add no module, export, component, or variant before something uses it". Preferred resolution is one more test: `serializeTree` exercises `lineFor` + `elisionOf` + `capName` together and would pin the two output formats nothing currently pins (the elision summary line and the `[namelen=... namehash=...]` suffix). Then drop whatever is still unused. |
| B4-2 | `tests/app/golden.test.mjs` | Rule A's most subtle property is untested: `elisionOf` groups **across the whole list, not by consecutive run**, which is why a table row's alternating siblings fold at all. Both existing tests use uniform sibling lists, so a regression to run-detection passes. One case with two interleaved signatures covers it. |
| B4-3 | `.github/workflows/ci.yml` (the guard step) | The plan's acceptance "the deploy log shows the stub-count line" is **not met and not recorded as unmet**. GHA runs `bash -e`, not `-x`, so the step echoes its source with `$stub_count` unexpanded and prints nothing on success; the `1091 = 1091` in the handoff came from a local replay. Add one `echo` before the `if`, and record the previously-unmet line. |
| B4-4 | `.github/workflows/ci.yml` (DP2) | Reads the repo-root `catalog.csv`, not `_site/catalog.csv`. `catalog.csv` has no `cmp` byte-identity guard the way `index.html` and `assets/app.js` do, so a truncated copy into `_site` is invisible. Pointing the same line at `_site/catalog.csv` also exercises the copy, at zero cost. **May already be done** - B5 was offered this mid-flight; verify before editing. |
| B4-5 | `tests/derived.js` | `404.html` is not reached by the `NOINDEX` check (which covers `app/index.html` and the stub generator). A deleted `noindex` or a deleted `id="app-404"` marker stays green through `npm run check` and only reddens in the deploy guard. Two lines make it a local gate. |
| B4-6 | `.prettierignore:20` | `404.html` inherits a comment block written about `app/index.html` ("left open at R0c, issue 47", singular, "this one is not generated"). Needs its own one-line reason, or the existing comment pluralised. |
| B4-7 | `.github/workflows/ci.yml:39` | `fetch-depth: 0 # gitleaks reads history, not just a snapshot` is in the wrong job - gitleaks runs in `secrets`, which has its own `fetch-depth: 0`. The `git diff --exit-code` step does not need full history either. **May already be done** - offered to B5 mid-flight; verify. |
| B4-8 | `issues/phase-8/handoff.md` | B4's `Review:` field is in `## Status` rather than in its own `### B4` Completed entry, which is where the rule shipped in `c8cc38e` puts it. The information is present; only its placement breaks the rule the previous batch shipped to make the check visible. |
| B4-9 | `docs/specs/META.md` section 7 | Irregular hand-wrap, breaking mid-clause at ~55 and ~40 columns against the file's ~75. *(taste)* |
| B4-10 | `.github/workflows/ci.yml:279-291` | 13 lines defending a check the same comment says can only fail for a reason that does not matter. It is what DP7 asked for and the branch-build justification is real. *(taste, probably leave)* |

### From B5's review (single sources: lib, generator, components)

Verdict **approve**, no blockers. Appended when the review landed, per the
standing rule below.

| id | where | what |
|---|---|---|
| B5-R1 | `tools/build-share-pages.js` | O6 changed **98 of 1091 published stub pages** (proved by rendering every record through both generators) and **nothing pins the new shape**. `tests/derived.js` compares the generator against its own fresh output; `tests/craft.js`'s first-line probe passes identically for the old glued `<p>` and the new split one. One assertion on a multi-line record closes it. The only behaviour change in the batch with no guard. |
| B5-R2 | (understanding, not a file) | "No rendered bytes moved" is narrower than it sounds. The goldens snapshot the accessibility tree plus the control inventory - **no class attribute, no CSS, no computed style**. The CSS half of C2 rests on `app/hues` (computed `color` on a few selectors) plus axe contrast; `.badge.tier`, `.uniq`, `.num`, `.hope`, `.fear` and every non-colour declaration are measured by nothing. Verified by reading. Do not let the handoff's phrasing be read as "no pixel moved". |
| B5-R3 | `app/src/components/ListsPage.svelte:181-188` | `.grow`'s correctness is now prose: it works because `.grow` appears exactly twice, both inside `NumRow`. A third `.grow` outside a `NumRow` in that file silently inherits `flex: 1 1 170px`. The comment records it; nothing enforces it. |
| B5-N1 | `.claude/README.md:233-239` | `bash-guard.mjs` says its `LONG_CHECKS` costs "mirror" that table, but the new `--shard=n/m` measurement went into the hook's cost string only; the table has no `run-all.js --shard=` row at all. |
| B5-N2 | `.claude/README.md:109` | The Hooks row still says "including an unsharded `golden.js`/`sweep.js` call" and never says a `run-all.js --shard=` call is deliberately **not** exempt - the asymmetry a reader would guess wrong from the golden/sweep precedent. |
| B5-N3 | `vite.config.mts:180-186` | Comment opens "The one exception, and it is a file rather than a rule" and is followed by three (`DiceBar`, `Button`, `Badge`); it also sits above the `DiceBar` entry while describing `Button`. |
| B5-N4 | `docs/specs/COVERAGE.md:195,219-223` | States components are at "75 branches" without noting three carve-outs (Button 60, DiceBar 55, Badge 50) and names only Button's. `CLAUDE.md` makes COVERAGE.md authoritative for thresholds; it is three exceptions behind. |
| B5-N5 | `app/src/components/badge.test.ts` (third case) | Does not end with `expectNoA11yViolations`, unlike the other two. `CLAUDE.md` asks component tests to end with it and to cover changed states with axe. |
| B5-N6 | `app/src/components/badge.test.ts:1` | Header says "the base rule and the nine variants"; the component ships eleven. |
| B5-N7 | `issues/phase-8/handoff.md` (B5 Deviations) | The plan's step 1 says `subLabelOf(table)`; the code uses `SUB_LABEL[table]`. The code is **right** - `subLabelOf` falls back to `'tables'` and would render `Wondrous Loot - Таблицы`, failing `label.test.ts:158` - but it is recorded only inside "What shipped". It belongs under Deviations, because it is exactly the swap a later reader "simplifies" back. |
| B5-N8 | `app/src/lib/label.test.ts` | `whereFrom` is pinned for seven groups but not Equipment. A1's byte-identity for `grpEquipment`/`subWeapon`/`subSecondary`/`subArmor` currently rests on reading `dict.ts`. Two assertions pin the last un-pinned group. |
| B5-N9 | `app/src/lib/alt.ts:111` | A4's guarantee stops one step short: `BUMP` is `Partial<Record<Rarity, keyof Dict>>`, so a sixth rarity added to **both** the union and `RARITY_ORDER` still makes `bumpUp` return `null` silently for the new top. The named defect (order extended alone) is genuinely closed; this residue is not. `alt.test.ts` never asserts that every non-top rarity bumps. |
| B5-N13 | `app/src/components/RecordModal.svelte` | The deleted `say` shim carried the only record of **why** toasting from inside a modal works ("in the top layer above this dialog's own inertness"). That fact is now written nowhere. |
| B5-N14 | `tests/run-all.js`, `app/src/components/Badge.svelte:8-9` | Prose: "the reviewer re-ran the packer..." names a session actor rather than evidence; Badge's "so this is one use late rather than early" is self-assessment rather than a reason the code is shaped that way. |
| B5-N10/11/12 | `roll.ts:14-16`, `alt.ts:25`, `listLink.ts:14-17` | *(taste)* a re-export justified by "any future caller"; `RARITIES` as a pure alias of `RARITY_ORDER` in the batch about single sources; a re-export comment overstating the rule it defends. |
| B5-N15 | `tests/run-all.js:177-178` | The new empty-shard message is a **new Russian string** in a file B9 is scheduled to translate. Cheaper in English now than rewritten in B9. Mark `deferred-scope` if B9 owns that file wholesale. |

### From B6's review (router, state, lists)

Verdict **fix-then-continue**; the two blockers go to B6's implementer as the
one remediation cycle, not to B12. R-2/N6 rides that same pass. The rows
below are B12's.

| id | where | what |
|---|---|---|
| B6-R1 | `app/src/state/lists.svelte.ts` (`#readCurrent`) | A **second** corruption is never backed up, and nothing cleans `.bad` up. The `get(LISTS_KEY_BAD) === null` guard is deliberate and its rationale is sound (do not overwrite the first loss), but the consequence is concrete: corruption #1 backs up; the key later becomes valid; `unreadable` clears and the notice disappears; `.bad` is orphaned forever with no UI to reach it; corruption #2 is **not** backed up and `save()` overwrites it, while the notice still claims preservation. Key the backup by timestamp, or drop `.bad` once a read succeeds. This is the defect one level down, not eliminated. |
| B6-R3 | `app/src/state/app.svelte.ts` (`#expectHash`) | Never cleared on a non-matching navigation. `go(X)` sets it before `navigate(X)`; if `X` equals the current hash a real browser fires no `hashchange` and the value goes stale indefinitely (`memoryRouter` announces unconditionally, so no test can see it). A later Back/Forward landing on `X` is then swallowed and `this.hash` desyncs from the address bar. Unreachable from today's four `go()` call sites, all of which navigate elsewhere. A `hash !== router.hash()` guard removes the trap. |
| B6-R4 | `app/src/components/ListPage.svelte` | `pagehide` alone for the pending URL flush. On mobile Safari a tab can be discarded from hidden without `pagehide`; `visibilitychange`->hidden is the more reliable last callback. Bounded (the address lags, the storage write is already synchronous), but on a bfcache restore the component is not remounted and the effect does not re-run, so the address can stay stale until the next edit. |
| B6-R5 | `app/src/lib/listLink.ts` (`parseItems`/`decodeList`) | When **every** id is dropped, `parseItems` returns `null`, so the user gets `badShare` ("the link is damaged") rather than `droppedItems`. The link is not damaged; its items are all gone. Pre-existing shape, but it is the worst case of the defect R3/P9 was fixing. |
| B6-N1 | `tests/app/contracts.js:128` | Comment says "One context reused across all **28** fixtures"; `routes.json` now has 30 - a count used as evidence, made stale by this batch's own two rows. |
| B6-N2 | `tests/app/golden.js:53` | `slugOf = id.replace(/\W+/g, '_')` has no uniqueness assertion and `wantFiles` is a `Set`, so two ids sharing a slug would silently share one golden and the stale-file sweep would not notice. B6 shipped the first id whose distinguishing character is stripped (`#/l/~AAAA` -> `_l_AAAA`, colliding with a hypothetical `#/l/AAAA`). One assertion over `STATES` closes it; verified no collision today (112/112). |
| B6-N3 | `app/src/state/lists.svelte.ts` / `StorageNotice.svelte` comment | Says the notice keeps showing "until a write actually clears it"; it takes **two** writes - the first `save()` reads the still-corrupt key (setting `unreadable` again) before overwriting it. |
| B6-N4 | `app/src/lib/dict.ts` `badStorage` (ru + en) | *(taste)* "under a separate key" is unactionable for a non-technical reader - there is no way to reach it without devtools. Name the key or drop the reassurance. Interacts with the BL-2 remediation. |
| B6-N5 | `app/src/ports/storage.ts` (the `storage` handler comment) | *(prose)* Claims "the merge's own `mergeLists(mine, [])` already answers 'storage came back empty' correctly" - but `watch()` performs no merge. This comment is the justification BL-1 rests on; correct it whichever way BL-1 is resolved. |

### Found while implementing B7 (accessible names, product text, structure)

| id | where | what |
|---|---|---|
| B7-N1 | `app/src/lib/help.ts:544` | `{ b: 'Players’ link' }` still carries the curly apostrophe P14's editorial pass straightened everywhere in `dict.ts` (`sharePlayers`, `notePubHint`, `playersLinkCopied`). Out of P14's literal scope (named as a `dict.ts` pass), but the same inconsistency in a sibling file. |
| B7-N2 | `tests/app/states.js` (new case needed), `app/src/components/StorageNotice.svelte` | D3's fix (the dismiss button moved from inside `<summary>` to a `.warn`-wrapped sibling of `<details>`) was verified once by eye against a real `dist/` build, not by any gate - jsdom does not implement `<details>`'s native closed-content suppression at all (every vitest test passed against the *wrong*, button-hidden structure the first time), and neither `tests/app/states.js` nor `tests/app/sweep.js` has an existing case asserting the button's visibility/hit-testability while the notice is folded, even though both drive a real Chromium. No permanent test guards against this exact regression recurring. Add a `states.js` case: open `#/lists`, confirm `<details>` is closed, read `.warn-x`'s `getBoundingClientRect()`, assert non-zero width/height (and, ideally, that it is actually clickable). |

### From B7's review (accessible names, product text, structure)

Verdict **fix-then-continue**. Appended when the review landed, per the
standing rule below. Ids continue this task's scheme: the review's own
`R-1`-`R-4` are `B7-R1`-`B7-R4`, and its `N1`-`N13` are `B7-N3`-`B7-N15`
(`B7-N1`/`B7-N2` were already taken by the two nits found while implementing
B7, above).

**Four blockers are NOT in this table and are NOT B12's** - they go to B7's
own one remediation cycle, per `orchestrate.prompt.md`, "Blockers do not go
to a nit batch". Recorded here only so the register shows they were seen.
All four, plus B7-R3 below (bundled into the same fix for the same reason a
later reader would hit both), are **done `6b50945`** - B7's one remediation
cycle is now spent; see `issues/phase-8/handoff.md`, "B7 remediation".

- **BL-0** (found by CI, not by the review): `docs/fixtures/statlines/equipment.json`
  still holds frame record `f7`'s pre-D11 stat line, so `app/contracts` fails
  in a real browser (`f7/ru`, `f7/en`). `app/src/lib/i18n.test.ts:56` hides it
  by passing `noTier: isFrameRecord(record)`, which is why `npm run check`
  stayed green. CI run `35318680003` on `fa56576`, job `browser (3)`.
  `done 6b50945`: `f7`'s fixture lines updated to the tier-first shape,
  `noTier: isFrameRecord(record)` dropped from the test loop, the fixture's
  header comment notes `f7` as a deliberate D11/Q6 divergence, not a stale
  capture. `node tests/run-all.js app/contracts` reran green (252.1s)
  against the fix.
- **BL-1**: `docs/specs/COVERAGE.md:162-165` documents the
  `expectNoA11yViolations(container, { allow })` parameter this commit deleted.
  `done 6b50945`: rewritten against the current `app/src/test/a11y.ts` -
  nothing is disabled per call any more, `color-contrast` is the only rule
  off, everywhere.
- **BL-2**: `docs/specs/COVERAGE.md:64` asserts the opposite of what shipped -
  it still says `share.ts` passes `noTier: isFrameRecord(it)` and that the
  fixture was recaptured *losing* the tier word.
  `done 6b50945`: rewritten as D11 paid off under Q6 - `share.ts` passes no
  `noTier` argument any more and `f33` gained the tier word.
- **BL-3**: the tier ladder on frame records (`RecordCard.svelte:177`, the
  guard dropped) is visible on **56 frame records** and covered by nothing -
  the only frame record in a golden and in `record.test.ts`'s fixture is `f1`,
  whose `eq.line` is empty.
  `done 6b50945`: `record.test.ts`'s `frames` fixture gained `f2`/`f3`
  sharing an `eq.line`; a new test opens `f2`'s page and asserts the ladder
  renders with both rungs and the tier word on the stat chip, ending with
  `expectNoA11yViolations`. No `inventory.js` state added, per the review's
  own ruling.

| id | where | what |
|---|---|---|
| B7-R1 | `app/src/components/Shell.svelte:105-109`, `SelBar.svelte:75-79` | P10's comment says the bar "is fixed to the bottom of the viewport"; it is `position: sticky`. The z-index half of the argument is right (a positioned `z-index: 45` box paints over the unpositioned footer whatever the DOM order), but a sticky box also has a **flow** position, and that moved from after `<footer>` to before it. Two consequences the recorded evidence cannot see: with a selection the footer is pushed down by the bar's height, and at **maximum scroll** the bar un-sticks *above* the footer instead of resting below it. Both the 1180x900 measurement and `states.js` case 16 measure the unscrolled page - the one position where the difference cannot appear. The plan's own acceptance line asked for the page-bottom overlap at 1180 and 375. Benign either way; the claim is unevidenced and the word "fixed" is what makes it read as proved. |
| B7-R2 | `tests/app/states.js` (case 23, `addToListMenuStaysInModal`) | `ok(scrollTop === 0, ...)` can no longer fail: `RecordCard.svelte:270` changed `.card` to `overflow: clip`, which creates no scroll container, so `scrollTop` is 0 whatever the placement effect does - a stray `scrollIntoView` would scroll the nearest *scrollable* ancestor and this assertion would still pass. The D6 evidence it names (`.card.scrollTop` 109) is not what it measures any more. The real assertion is `inside(menu, card)`. Drop the scrollTop line or replace it with one pinning `:scope > .btn`. |
| B7-R3 | `app/src/lib/i18n.ts:120,126,147` | After B7, `noTier` has **zero production callers** - only `i18n.test.ts:56,75-80` (the old-app parity fixture, which legitimately still needs it). Nothing says so at either site, so a later reader applying `CLAUDE.md`'s "add no variant before something uses it" deletes it and breaks the parity fixture for a reason that takes an hour to find. One clause closes it. Interacts with BL-0's fix. `done 6b50945`: bundled into BL-0's fix (same file, same reader trap) - a clause on `eqParts`'s doc comment names the zero-caller fact and the test that would break. |
| B7-R4 | `app/src/components/ListPage.svelte:1267-1276`, `StorageNotice.svelte` | P12's 44x44 targets overlap editable neighbours: `.note-x::after` extends ~12px beyond a 20px button into the note `<textarea>`; `.warn-x::after` ~3px above the notice box. The `.homebtn` precedent it copies has no editable neighbour. A tap 12px from the cross clears the note instead of placing a caret. Unmeasured, low severity. |
| B7-N3 | `tests/app/lib.js:124-135` | `axe(page, { allow })` is kept "for a future live-shared defect" with no caller - in the same commit whose `app/src/test/a11y.ts` comment argues that a parameter with no caller is a maintained shape for nothing. Pick one: delete it here too, or state why the browser suite differs. |
| B7-N4 | `tests/app/inventory.js:94,142` and `:98,146` | `selected: 'Выбрано'/'Selected'` and `importPh: 'Ссылка на список'/'Paste a list link'` are dead keys - no reader. `pickRow` was deleted in this very batch for exactly that reason. `importPh` is also now wrong: after P6 that field's accessible name is `t.importList`. |
| B7-N5 | `issues/phase-8/handoff.md` (`### B7`) | The entry still opens "**Not yet committed**", says files are "all currently in the working tree; most already `git add`ed", and calls the Escape test "the one unstaged file". All three are false as of `fa56576`, and the entry's own last bullet contradicts them. |
| B7-N6 | `issues/phase-8/handoff.md` (`### B7`) | No `Review:` line inside the batch entry - it sits in `## Status`. Identical placement miss to `B4-8`, against the rule shipped in `c8cc38e`. |
| B7-N7 | `issues/phase-8/handoff.md` | No `## Verification` section; `.claude/templates/handoff.template.md` has one. The content exists (inside `### B7` -> "Gates run") but not where the template puts it. |
| B7-N8 | `issues/phase-8/handoff.md` (golden category 6) | Category 6 reaches ~40 files, not the three named: frame equipment also sits in `#/tables/eq_weapon`, `eq_armor`, `eq_secondary`, `other_starting`, the `#/search` states and the roll states. The category *text* covers it; the parenthetical examples undersell it by an order of magnitude. |
| B7-N9 | `app/src/components/TablesPage.svelte:84` | `lastTable = route.table as TableId` - the assertion exists only because narrowing is lost inside the `untrack` callback. `const t = route.table;` before `untrack(...)` removes the cast. |
| B7-N10 | `app/src/components/SectionHead.svelte:26` | `this={'h' + String(heading)}` widens to `string`; `heading === 2 ? 'h2' : 'h3'` keeps the literal union the prop declares. *(taste)* |
| B7-N11 | `app/src/components/tables.test.ts` (folded-panel case) | `expect(container.querySelector('.ffilter')).toBeNull()` replaced a role+name assertion with a class probe. `expect(screen.queryAllByRole('button', { name: 'Предметы' })).toHaveLength(1)` keeps it at role level and still disambiguates the pill. *(taste)* |
| B7-N12 | `docs/specs/FEATURES.md:174-183`, `app/src/components/shell.test.ts` | A shared list (`#/l/<payload>`) shows a name on screen but keeps the plain tab title, because the effect keys off `app.openList`. Deliberate and documented, but it is the one case a reader expects to be titled and no test pins the negative. One `shell.test.ts` line. |
| B7-N13 | `tests/app/driver.js` (`click`/`press`) | Two ranking edges nothing exercises: (a) with `nth > 0`, `exact[idx]` and `boxExact[idx]` index two *different* arrays, so `click(name, 1)` can silently land on the second checkbox when exactly one exact non-checkbox match exists; (b) a substring non-checkbox match still pre-empts an exact checkbox, so a box whose exact name is a substring of any button's name is unreachable through `click()`. That is why `tick()` exists - one sentence saying "for a checkbox, always `tick()`" stops the next author re-deriving it. |
| B7-N14 | `issues/phase-8/handoff.md` (the `npm run check` bullet) | The attempt-by-attempt chronology is session narration; the load-bearing facts (a run past 600s auto-backgrounds and cannot arm the gate; two heavy runs on one tree contend; isolation cleared the two failing files) are already in `context.md`'s "Reasons already disproved". **The D3 first-attempt account is the opposite and must stay** - it is a live trap with the symptom that identifies it. *(never a blocker)* |
| B7-N15 | `app/src/lib/dict.ts` (en) | P14 straightened English quotes but left standalone hyphens in English strings (`droppedItems: 'Skipped %n items - no longer in the data'`) while `noLists` beside it uses an em dash. Pre-existing and outside P14's stated scope. *(taste, `deferred-scope` if B12 prefers)* |

**Two checks B7's review could not run** (read-only, and B8 was live on the
tree) - they belong to whoever next has the tree:

- `node tests/app/sweep.js 1180`. The `allow` removal was proved at 768, where
  `sweep.js`'s `width === 1180 || lang === 'ru'` guard runs axe on Russian
  only. `nested-interactive` and `heading-order` are language-independent, so
  the risk is low, but the English axe path has not run without the two allows.
- One scroll-to-bottom measurement of `.selbarwrap` and `.foot` with a
  selection at 1180 and 375 (B7-R1) - the measurement P10's acceptance line
  actually asked for.

### From B8's review (record actions, print, motion and focus)

Verdict **fix-then-continue**. Appended when the review landed, per the
standing rule above.

The review **confirmed** B8's two central claims rather than taking them on
trust, and both are worth keeping: no golden *can* have moved (`tests/app/golden.js`
captures the accessibility tree plus the control inventory, no CSS - D1/D18/D20
are CSS-only, R6 adds only handlers, D21's initial value is unchanged `false`,
D13/D22 move no name, role or control; the two `--only=` probes were
belt-and-braces, not the proof), and D1's blanket rule has no correctness blast
radius (no `transitionend`/`animationend`/`getAnimations` consumer anywhere in
`app/src`, no `allow-discrete`/`@starting-style`, every `@keyframes` ends in a
visible state, and the non-reduced-motion path is untouched because the whole
rule lives inside the media query). Print's product law is intact: `fit()` is
byte-identical, nine cards per A4, colour and black-and-white still distinct.

**Three blockers are NOT in this table and are NOT B12's** - they go to B8's
own one remediation cycle, with `B8-R1` and `B8-R2` riding along because both
touch `tests/app/print.js`, which that pass already opens. Recorded here only
so the register shows they were seen. **All five, `done 480c380`** - B8's one
remediation cycle is now spent; see `issues/phase-8/handoff.md`, "B8
remediation".

- **BL-1**: D18 deleted the one `:focus-visible` override that was not
  redundant. `.card-media` (`RecordCard.svelte:345-347`) is a real `<button>`
  flush against `.card`, and `.card` is `overflow: clip`. Its `outline-offset:
  -2px` drew the ring **inside**; the global rule's `+2px` puts it outside the
  button's border box and so outside `.card`'s padding box, clipped on three
  sides. The plan's step 10 said "the five **8px** overrides" - this one was
  not 8px. No instrument here can see it: `sweep.js`'s `focusWalk` reads
  `getComputedStyle().outline`, which still reports a ring an ancestor clips.
  `done 480c380`: the `.card-media:focus-visible { outline-offset: -2px }`
  rule restored with the reason stated inline. Fixed by reasoning, not by any
  gate - no instrument in this repository can see an outline clipped by an
  ancestor (`focusWalk` reads computed style, goldens read structure, axe
  checks neither); a human eye or a screenshot still confirms it, and that
  confirmation is owed, not done here.
- **BL-2**: `RecordActions.svelte:72` now awaits `pngOf` **before** touching
  the clipboard, defeating the gesture rule `ports/clipboard.ts:102-104`
  documents ("the promise is handed to ClipboardItem rather than awaited
  first: Safari drops the user gesture if anything is awaited in between") and
  that the deleted live app followed deliberately. On WebKit the write loses
  transient activation; B8's own new D14 path then silently downgrades the
  copy to a download. Every gate runs Chromium and the fallback masks it, so
  nothing would ever report it. The comment in `clipboard.ts` is now false for
  its only caller, which is the worse half.
  `done 480c380`: `copyImage()` restructured to the reviewer's shape -
  `pngOf`'s promise reaches `writeImage` unawaited, and is only awaited
  afterwards to tell a tainted canvas apart from a clipboard refusal.
  `clipboard.ts`'s comment gained the caller-side half of the invariant.
  The existing D10/D14/D15 tests initially **failed** under the restructure -
  not because the restructure was wrong, but because `fakeClipboard.writeImage`
  ignored its `png` argument entirely and always reported success, which is
  not how the real `browserClipboard.writeImage` behaves. Fixed the fake, not
  the tests, per the dispatch's own instruction: `writeImage` now actually
  awaits `png()` and returns `false` on rejection, mirroring the real port.
  All three tests then passed unchanged.
- **BL-3**: `docs/specs/COVERAGE.md:67` (the `noart` row) still calls "share
  attaches no file" an impossible case that "never passes a file". D22 makes
  `send()` pass one, so the spec is false on both the fact and the reason a
  case was dropped.
  `done 480c380`: the clause replaced with a pointer to `record.test.ts`'s
  "attaches no file for a record with no art" / "attaches the picture where
  there is art" cases; the stale line citation dropped.

| id | where | what |
|---|---|---|
| B8-R1 | `tests/app/print.js:1141` | *(rides B8's remediation)* Asserts `lines === 1`, but owner decision Q2 set the cap at **two** lines and the plan's own wording was "pinning `cm26` at two lines". As shipped it is a change-detector where a cap was asked for: a legitimately longer name, or a data edit lengthening this one within the design's tolerance, fails the browser suite though the layout is correct. `ok(lines <= 2, ...)` with a message naming the two-line cap. Keep the measured "all four at one line, 2026-09-18" fact where it is, in `FEATURES.md` "Print". `done 480c380`. |
| B8-R2 | `tests/app/print.js:1131-1155` | *(rides B8's remediation)* The committed `nameLines()` **is** the P16 measurement (same route, same 1100px, same `getClientRects().length`, both languages, both layouts), so the uncommitted scratchpad script costs nothing for `cm26`. But the route renders `cm26-f60-hi62-ci81` and the helper reads only `cm26`, so "the four longest names all render at one line" rests on a deleted script. Loop the four ids inside the existing `$eval` - two lines, zero extra page loads. `done 480c380`: looped `cm26`/`f60`/`hi62`/`ci81` inside the same `$eval`/`ok` pair. |
| B8-R3 | `app/src/ports/image.ts:45-51`, `RecordActions.svelte` | The 2000 ms `toBlob` watchdog can fire on a slow-but-fine encode, and `copyImage` maps *any* `pngOf` rejection to `imgTainted` - so a contended machine encoding a large source gives the user a tainted-canvas story for a slow encode and silently loses the picture. 2000 ms is defensible for card art; the residual risk is the wording. The code already builds distinct `Error` messages and `copyImage` discards them - name the two causes apart, or raise the watchdog and document the measured encode time. |
| B8-R4 | `app/src/ports/image.ts` (`browserImage().download`), `vite.config.mts` | New code exercised by nothing: no unit test imports `browserImage`, the file is coverage-excluded, and the browser path cannot reach it (`states.js` case 10 runs on a build that taints, so `writeImage` is never reached, let alone refused). The comment updated in the same commit now overstates the exclusion - "exercised for real by `states.js`'s copy-image case" is true of `pngOf`, not of `download`. The plan's step 1 offered "narrow the exclusion **or** add the rejection-path test"; the rejection path got real browser coverage, the download did not. A jsdom test on `download` with `URL.createObjectURL`/`revokeObjectURL` stubbed (asserting the `<a download>` name, the click, and the element's removal), and trim the comment's claim to `pngOf`. |
| B8-R5 | (proof, not a file) | D1 and D18 are **global CSS** reaching every rendered page, but B8's local gates were `app/states`, `app/print`, `sweep 1180` and two golden probes. `app/hues`, `app/typo`, `app/contracts`, `stub`, the other sweep widths and the four golden shards have not run against this tree. Nothing in the review's reading suggests movement (goldens are structure-only; hues reads computed colours, which a 0s transition only stabilises). **CI is the outstanding proof** - check the full browser matrix on the B8 commits or the remediation. |
| B8-R6 | `tests/app/print.js` (the D20 block, ~line 1280) | `d.seed({'dhloot.lists.v2': ...})` is never cleared, and `driver.js`'s `seed` installs an `evaluateOnNewDocument` handler that survives every later `d.open()`. Harmless today (only the print-link block follows and it reads no lists), but the next person appending to this file inherits a seeded list without knowing - the same class as the viewport leak B8's own handoff documents. Also: the assertion depends on the action toast still being alive, and `say()` gives action toasts 7000 ms - two round trips inside 7 s is comfortable, but it is a real flake budget on a contended host. |
| B8-N1 | `app/src/styles/tokens.css:172` | Cites "`docs/specs/DEBT.md`, D1's own history" for a rejected alternative, and the same commit deletes D1. The load-bearing half ("a longer non-zero duration was tried first and rejected for exactly the opposite reason") never says what the opposite reason *was*, so the dead pointer is the only route to it. State the reason inline in one clause, or cite `git show 8e43c92:docs/specs/DEBT.md`. |
| B8-N2 | `app/src/lib/dict.ts:84,432` | `imgFailed` now fires only when `download()` throws (the blob already exists), but the wording is "Не удалось получить картинку" / "Could not load the image". The strings are live's own and live's use was broader, so they are inherited rather than invented - but wrong for the only case that can now raise them. "Не удалось сохранить картинку" / "Could not save the image". |
| B8-N3 | `docs/specs/FEATURES.md` (Chrome section) | "Every focusable control gets the same gold keyboard-focus ring, **at one radius (`--r-sm`)**" is not true as built: a component's own scoped `border-radius` outranks the unscoped global rule, so `.seg button` keeps 999px - correctly. Drop "at one radius", or say the radius follows the control's own. |
| B8-N4 | `tests/app/states.js:346` | "which is what made this invisible before **B12**" cites a first-plan batch id; this work is B8. Stale, and that clause narrates the session rather than the code. The rest of the comment block earns its keep - the Chromium `toBlob` behaviour is a live trap. |
| B8-N5 | `tests/app/print.js:1131-1155` | Same edit as `B8-R2`; listed there. |
| B8-N6 | `app/src/styles/tokens.css` (D1's rule) | *(deferred-scope)* The rule zeroes `animation-duration`/`transition-duration` but not `animation-delay`/`transition-delay`, so a delayed animation still waits under `reduce`. Nothing in the tree uses a delay today, so this is cheap insurance, not a defect - and the plan specified these four declarations and the owner approved them, so changing it is a policy edit, not a fix. |
| B8-N7 | `app/src/components/TablesPage.svelte:444` | *(deferred-scope)* `scrollIntoView({ behavior: 'smooth' })` overrides CSS `scroll-behavior` per spec, so D1's `scroll-behavior: auto !important` does not reach it: the one real smooth scroll in the app still animates under `prefers-reduced-motion: reduce`. `TablesPage` is outside B8's file list. One-line fix when someone next opens that file - pick the behaviour from a `matchMedia('(prefers-reduced-motion: reduce)')` read. |
| B8-N8 | `issues/phase-8/handoff.md` | *(deferred-scope, duplicate of `B7-N7`)* No top-level `## Verification` section (`.claude/templates/handoff.template.md:19`); each batch entry carries its results inline instead. Pre-existing for the whole file, not introduced by B8. **Size**: 138,821 B against `session-stop.mjs`'s 150 KB warn threshold - B9's entry will trip it, so `/handoff` compaction is due. |

**One check this review names that nothing in the repository can perform**:
after BL-1, confirming `.card-media`'s ring is drawn inside `.card` at both
`.full` and `.compact` needs a human eye or a screenshot. `focusWalk` reads
computed style, goldens read structure, axe checks neither - none of them sees
an outline clipped by an ancestor.

### Carried, needing confirmation before B12 edits anything

| id | where | what |
|---|---|---|
| B1-N9 | `app/src/lib/search.ts` | `matches(it, q, statLine, hay)` lets a caller pass a `hay` built from one `statLine` and a different `statLine`; `hay` silently wins. A union third argument makes the mismatch unrepresentable. The review said to fold it in only if N1 was being done - N1 **was** done in `c8cc38e`, so `verify` whether this went with it. *(taste-adjacent)* |
| B2-5 | `.claude/README.md:109` | Still describes the commit gate as "commits when `npm run check` has not passed for the tree"; the fingerprint is now over covered paths only. Routed to B4, which did not obviously do it. `verify`. |
| B2-4 | `app/src/lib/frames.ts` | Stale `TAB_LIST` identifier. Routed to B5, whose report mentions adjacent `FrameId` work but not this by name. `verify`. |

## Deferred out of phase-8, with reasons

| id | what | reason |
|---|---|---|
| B2-6 | `docs/specs/ROUTES.md` documents `#/tables/frames` as a route shape with no row in `docs/fixtures/urls/routes.json` | Fixture completeness, not a coverage gap - `app/src/lib/hash.test.ts` covers the route. Touching `docs/fixtures/` is a public-contract change and needs its own justification. |
| B3-N9 | `docs/specs/COVERAGE.md`: "adding it back costs a fifth `run-all` row and a fifth CI width" | The 320px width would now be a sixth row. Cosmetic count in a sentence about a hypothetical. |
| perf-PF4 | 640x640 originals feed 60px rows and 168px tiles; grid view pulls ~11 MB against a 243 kB first load | Needs a generated derivative under a new asset path, which `CONTRACTS.md` freezes. Its own task, recorded in `plan.md`'s deferred list. |

## Done

- **B1 review** N1-N6, N7 (owner chose the general fold: diacritics + U+2212), N8 - `c8cc38e`. N10 was commit shape, nothing to do.
- **B2 review** blockers B-1, B-2, B-3 and nits 1-3 - `c8cc38e`.
- **B3 review** N1 (`COVERAGE.md`'s stale `golden` job name) - `c8cc38e`, routed mid-flight.
- **B3 review** N2-N8 - B5 (`112bd07`), after B4 skipped them.
