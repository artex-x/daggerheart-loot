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

### From B8.1's review (the harness lost its settle instrument)

Verdict **fix-then-continue**. The one blocker, four folded nits, and one
factual-record correction below are **done in this commit** (B8.1's own
remediation cycle); everything else in this section is B12's, per this
task's "nits are processed immediately" policy not applying mid-plan the way
`orchestrate.prompt.md`'s default does (`context.md`, "Review and nit policy
for this task").

- **BL-1**: `docs/specs/COVERAGE.md`'s gate rule required only "at least one
  `--shard=n/4` run", which `--shard=1/4` alone would have satisfied even
  though B8's three failures fell one each in shards 2, 3 and 4 - the rule as
  written would have shipped the exact defect it exists to prevent.
  Done: rewritten to require all four shards (or `--only=` probes reaching
  every route kind the change can touch), with the shard-2/3/4 counterexample
  cited in the rule's own text so it cannot be re-weakened unread.
- **NIT-1**: `tests/app/driver.js`'s `addressSettled()` doc comment claimed an
  app that never writes the address "is quiet from the very first read, so
  this returns at once" - false; `lastChange` initialises to `start`, so the
  helper always pays one full quiet window before returning, whether or not
  the address ever changes. The no-masking property holds because the wait is
  bounded, not because it is skipped.
  Done: comment rewritten to say what is true - it returns after one quiet
  window having waited for nothing when nothing was pending; it waits only
  for a write landing within `quiet` of the call; a later write is missed and
  the golden then fails red on content, same as today.
- **NIT-2**: `tests/app/driver.js` (`settle()`'s doc comment) - "so the wait
  above resolves immediately" pointed at the `getAnimations()` race, which
  sits below the comment, inside the function body.
  Done: "the animation wait below".
- **NIT-3**: `tests/app/golden.js` - the comment explaining the `timed`
  branch's `addressSettled()` call sat above `const oneLang = ...` rather
  than at the call site, reading as if the ordinary branch five lines up were
  its antecedent.
  Done: moved to sit directly above the call, inside `oneLang`.
- **NIT-4**: `tests/app/golden.test.mjs`'s coupling regex,
  `/function scheduleUrlSync[\s\S]*?\}, (\d+)\);/`, was unbounded past
  `scheduleUrlSync`'s own function body - a literal-to-named-constant refactor
  would walk on to the next `}, <digits>);` anywhere later in the file
  (silently wrong), and a second `setTimeout` earlier in the same function
  would take the first match (also silently wrong); only the absence of any
  other such literal in `ListPage.svelte` kept it from biting today.
  Done: the match is now bounded to the function body
  (`/function scheduleUrlSync[\s\S]*?\n  \}/`, verified against the file
  before relying on it - the function is at 2-space indent, its closing brace
  is the first `\n  }` after the opener), plus an assertion that the body
  contains exactly one `setTimeout`. Proved to actually bite: each of the
  three refactor cases (a Prettier-style split call, the literal replaced by
  a named constant, a spurious second `setTimeout` earlier in the function)
  was made in the working tree and each failed the test loudly with a
  distinct message, then reverted by hand (`git diff --stat -- app/src`
  empty afterward - `git checkout`/`restore` are refused by the bash-guard
  hook while `issues/56/`, another task's untracked directory, sits in this
  same tree).
- **NIT-9** (`issues/phase-8/handoff.md`): `Review:` read "not required (no
  trigger fired)" for B8.1 in both `## Status` and the `### B8.1` Completed
  entry, while the same entries describe a worker-reported deviation (the A6
  gate's `app/states` finding) - a listed trigger in `orchestrate.prompt.md`.
  A review did in fact happen (this one); the record was wrong, not the
  policy.
  Done: both locations now read `required (trigger: worker reported
  deviation from plan)`.

The review also confirmed both of B8.1's central claims independently rather
than taking them on trust: the fix and its gates are sound (all four golden
shards compare clean, the coupling test bites, no `app/src/**` or
`tests/app/snapshots/**` file touched), and the `app/states` case-10 failure
A6 found is a real, pre-existing, unrelated regression rather than host
contention - both matching what the implementer's own handoff already
recorded.

| id | where | what |
|---|---|---|
| B8.1-R1 | (verified reasoning, no action) | The "never returns at once" finding (NIT-1's root cause) - confirmed by reading `addressSettled`'s loop: `lastChange` starts at call time, so `now - lastChange >= quiet` cannot be true on the first iterations regardless of the address. |
| B8.1-R2 | (verified reasoning, no action) | The `cap` throw is effectively unreachable in practice and, if it ever fires, is not the real truncation risk - a late write inside `cap` but outside the golden's own patience fails the comparison red on content, which is the intended, loud failure mode, not a silent one. |
| B8.1-R3 | (verified reasoning, no action) | The ~208ms margin `addressSettled()`'s wait leaves before the shortest toast lifetime (1600ms) is adequate today but does not scale with a slower host; the 111-119s per-shard times recorded in this batch's own gate run are D1 removing animation waits (B8), not evidence of contention on the machine that ran B8.1's gates. |
| B8.1-R4 | (verified reasoning, no action) | The timed states' toast margin shrank roughly 25% under this fix (capture now lands ~380-560ms into a 1600ms toast lifetime, versus before); documented in `golden.js`'s own comment, and the failure mode if it is ever too tight is loud (a missing toast), not silent. |
| B8.1-R5 | (verified reasoning, no action) | Scoping `addressSettled()`'s call to goldens only, not to every suite sharing `driver.js`, is the right call - with one residual: `tests/app/contracts.js:37-38` reads an owned-list address immediately after `d.open()` and passes only because `ready()`'s own wait happens to already exceed 150ms, not because anything there asserts settlement. See B8.1-N... below (routed as NIT-7). |
| B8.1-R6 | (verified reasoning, no action; closed by NIT-4) | The coupling assertion (`golden.test.mjs`) proves `URL_DEBOUNCE_MS` equals whatever number the regex extracts, not that the regex extracted the right one - it proves the comparison, not the extraction. NIT-4's bound and setTimeout-count assertion close the extraction half. |
| B8.1-N1 | (taste) | Nothing guards the *call sites* of `addressSettled()`: deleting `await d.addressSettled()` from `golden.js` would reintroduce the original defect with no unit-level signal, only intermittent red golden shards on an owned-list route. |
| B8.1-N2 | `tests/app/states.js:838` | *(deferred-scope)* Still justifies the reduced-motion emulation with the parity-era "timing out the pixel comparisons" reasoning this batch's own `prepare()`/`settle()` comment fixes retired. The fourth stale cross-reference of that family found across phase-8. |
| B8.1-N3 | `tests/app/contracts.js` (before its hash read, per B8.1-R5) | *(deferred-scope)* Add `await d.addressSettled()` before the owned-list hash read at `:37-38`, so the pass stops resting on `ready()`'s wait happening to already exceed 150ms. |
| B8.1-N4 | `docs/specs/COVERAGE.md` | The three B8.1-inserted paragraphs (the coupling-assertion note, the gate rule, the capture-wait note) sit between the pre-existing `golden.test.mjs` paragraph and a line whose "those fixtures" antecedent is the fixture table far above (`:243-245`), not anything adjacent. `plan.md` step 7 pointed at the `app/golden` table row or "Known thin spots" as candidate homes; neither was used. Considered moving the block now (it is BL-1's own paragraph and this pass is already in the file) - not done: the `app/golden` row is one dense table cell and "Known thin spots" is a bulleted list, so landing prose paragraphs in either is a format change beyond a nit-sized edit, not a cheap, clearly-right move. Recorded for B12 instead. |

### From B9's review (language and format: `tests/` and `tools/`)

Verdict **fix-then-continue**. Two blockers (B9-BL-1, B9-BL-2) and the
record corrections B9-N1/N2/N7/N8/N9 plus B9-N4 were sent to a remediation
pass; everything else in this section is B12's. The reviewer ran no heavy
gate by dispatch (B10's implementer held the tree), so every measurement
below is from `git show`/`git archive` against committed shas and from
`npx eslint` runs in a scratch directory outside the repository.

**Both blockers and all six record corrections are `done 0686bb6`** - B9's
remediation cycle is now spent; see `issues/phase-8/handoff.md`, "B9
remediation".

- **B9-BL-1**: `eslint.config.mjs:24-25`'s ignore-pattern pair
  (`'.claude/**'` + `'!.claude/hooks/**'`) never actually un-ignored the
  hooks - `.claude/**` prunes the directory itself before the negation can
  apply, so the nine hook files stayed lint-dead and the commit's only
  claimed coverage gain from that half was inert. Confirmed independently
  before dispatch (`npx eslint .claude/hooks/tree-key.mjs` returned "File
  ignored because of a matching ignore pattern") and three other
  formulations tried and rejected, all still ignored.
  `done 0686bb6`: fixed to `'.claude/*'` + `'!.claude/hooks'` - `npx eslint
  .claude` now lints exactly the nine hook files (`bash-guard`,
  `check-observer`, `edit-followup`, `edit-guard`, `lib`, `selftest`,
  `session-start`, `session-stop`, `tree-key`), zero errors/warnings, and
  `.claude/worktrees/` stays pruned. The three records asserting the
  widening as already-done (`plan.md`'s B9 entry, `handoff.md`'s B9
  Completed entry) were corrected in place; `d660ce7`'s commit message
  overstates and, being history, was left uncorrected with a note pointing
  at the correction of record.
- **B9-BL-2**: `eslint.config.mjs:178`'s
  `@typescript-eslint/no-unused-vars: 'off'` stood as a blanket off for
  three real findings (`tests/app/states.js:154`'s dead `page` destructure;
  `tools/check-site.test.mjs:79,112`'s destructure-to-drop-a-key idiom) -
  two of which are exactly what the rule's own `^_` options exist for and
  the third a one-token deletion.
  `done 0686bb6`: rule re-armed as `'error'` with
  `{ argsIgnorePattern: '^_', varsIgnorePattern: '^_',
  caughtErrorsIgnorePattern: '^_' }`; `page` dropped from the
  `twoFramesPicked` destructure in `tests/app/states.js:154` (unused for
  the rest of the function - the case drives everything through `d`).
  `npx eslint .` clean afterward.
- **Record corrections, all `done 0686bb6`**: the acceptance-grep table's
  missing `tests/app/typo.js` row (9 lines, all (b)) added to
  `handoff.md`; the commit-4 verification bullet's wrong "141 across 15
  files" restated as "259 findings across 34 files" with the full
  per-rule breakdown; the stale `d882707`/`5602ca9` Status and Notes
  wording from B9's own handoff text was checked against the current file
  and found **already superseded** by B10's own routine Status rewrite (a
  "replace, never append" section) - no separate edit was needed there,
  verified rather than silently skipped; `tools/build-share-pages.js:150`'s
  redundant comment (a duplicate of line 149's already-English fact)
  deleted.

| id | where | what |
|---|---|---|
| B9-R1 | (risk, recorded) | The pre-compaction plan's commit-4 step was "`npx prettier --write tests tools` **and the lint fixes**" (`git show c0ff1d0^:issues/phase-8/plan.md`). What shipped is eight rule turn-offs *instead of* the lint fixes - a third deviation, unrecorded alongside the two that were. Not hidden (each turn-off carries a rationale in the config), but the substitution is standing policy where the plan authorised only a `disableTypeChecked` block. |
| B9-R2 | `eslint.config.mjs:184-191` | Four code-rule turn-offs suppress **11 real findings**, and the written rationales enumerate only 6 of the 11 sites. Measured: `no-regex-spaces` 5 (`tests/derived.js:798,819,821,841`; `tests/app/golden.test.mjs:231` - rationale names derived.js only); `preserve-caught-error` 3 (`tools/artwork/run.mjs:124`; `tools/tg-preview/run.mjs:47`; **`tests/app/driver.js:369`** - rationale names the first two); `@typescript-eslint/no-extraneous-class` 2 (`tools/capture-share-fixture.mjs:97`; **`tests/app/driver.js:859`** - rationale names the first); `no-useless-assignment` 1 (`tools/tg-preview/live.mjs:75` - correct). None is a live defect. Reviewer's per-rule recommendation: `no-regex-spaces` narrow or fix (` {2}` is byte-equivalent for the ci.yml indentation regexes); `preserve-caught-error` prefer three inline disables or `{ cause }` over a directory-wide off, because a *new* catch/rethrow in `tests/`/`tools/` will now pass silently; the other two are 3 lines total, prefer the fix. |
| B9-R3 | (verified sound, no action) | The three structural turn-offs should stand unchanged: `no-console` (118 findings - every suite's reporting mechanism; the repo rule at `eslint.config.mjs:44` is a browser-bundle policy), `@typescript-eslint/no-require-imports` (60 - all in `.js` CommonJS suites), `@typescript-eslint/explicit-module-boundary-types` (67 - all in `tools/**/*.mjs`, untyped JS with no annotation to write). |
| B9-N3 | `tests/ok.js:1` and `tests/contracts.js:23-28` | The new module's comment names four users - "derived, dataint, craft, contracts" - but `contracts.js` still carries its own identical inline copy (`let fail = 0; const ok = ...`). Either wire it to `./ok.js` (6 deleted lines; it already ends `process.exit(failed() ? 1 : 0)` in the same shape at `:116-117`) or drop `contracts` from the comment. Reviewer prefers the former - `CLAUDE.md`'s "remove both inline copies". |
| B9-N5 | `eslint.config.mjs:184-191` | The per-rule rationale comments name a subset of the sites they cover (see B9-R2's table). A later reader greps the named file, finds it clean after a fix, and deletes a turn-off that is still load-bearing elsewhere. Enumerate every site per rule. |
| B9-N6 | `eslint.config.mjs:145-152` | The block justifies itself by "lines this same commit's own acceptance line requires untouched (`git diff -w --stat` empty ...)" - the acceptance line this very batch records as **unmet and the wrong instrument**. A standing config should not rest on a retracted criterion. Re-word to the durable reason (pre-existing patterns, enumerated sites). |
| B9-N10 | `issues/phase-8/context.md:165` | The deterministic-regression table's header reads ``| state | expected (`было`) | actual on CI (`стало`) |``. `golden.js` now prints `want:`/`got:`, so a session following that record greps for a word the tool no longer emits. One word per header cell. *(deferred-scope: task record, mid-plan)* |
| B9-N11 | `eslint.config.mjs` | `@typescript-eslint/no-require-imports: 'off'` could be narrowed to a `files: ['**/*.js']` block - all 60 findings are in `.js`, so a future `.mjs` tool reaching for `require` would still be caught, at no cost today. *(taste)* |

**Verified sound in B9's review, recorded so it is not re-derived:**

- **The Prettier-reproduction proof is real, reproduced independently.**
  `git archive 6b3f0eb tests tools` and `git archive d660ce7 tests tools`
  into two scratch directories outside the repo, both formatted with the
  repo's own Prettier and `.prettierrc`: `diff -rq` between the trees is
  **empty**, 154 files each. Commit 4 is Prettier's output and nothing else.
  The unmet `git diff -w --stat` acceptance line is correctly recorded as
  unmet and is not re-raised.
- **No product literal moved, proved mechanically.** Token-level comparison
  of every `.js`/`.mjs` under `tests/` (minus `snapshots/`) and `tools/`,
  `d882707` vs `2d404c7`, strings elided and comments stripped: the only
  structural changes in the whole batch are the `ok.js` extraction in
  `craft.js`/`dataint.js`/`derived.js` and two regex literals in
  `golden.test.mjs` (the disclosed coupling update). Every other regex
  literal is byte-identical, including `print.js`'s `/ОРУЖИЕ/i`, `/БРОНЯ/i`,
  `/АРТЕФАКТ/i` family, `craft.js:47,67,98`, `dataint.js:279` and
  `derived.js`'s `footBefore`/licence/step-word regexes. Selector, route, id
  and storage-key literal multisets: zero removals, one addition (`./ok.js`).
- **H16 is safe.** `tests/run-all.js:247` spawns each suite as its own
  `process.execPath` child, so `tests/ok.js`'s module-level counter cannot be
  shared across suites; all three consumers end `process.exit(failed() ? 1 : 0)`
  and no stray `fail` reference survives.
- **The acceptance grep re-derives exactly**: 14 files, 395 Cyrillic lines,
  per-file counts matching the handoff's table once `typo.js` (9) is added.
  All 24 remaining Cyrillic-bearing *comment* lines were classified by hand:
  every one is an English sentence quoting a product term.
- The plan's "every browser suite's green run before and after" was met by
  the Gates list (nine pooled suites + `sweep.js 390` + `golden --shard=2/4`)
  rather than literally. Exposure is limited to failure-path strings in the
  unrun suites, and the reviewer's grep closes it: no Russian (a) message
  remains anywhere in the tree. No action needed.

### From B10's review (the record-modal host)

Verdict **fix-then-continue**. Two blockers (B10-B1, B10-B2) and B10-N6 were
sent to a remediation pass; B10-N1..B10-N5 below are B12's. The reviewer ran
no heavy gate by dispatch (B9's remediation held the tree), so every finding
is from the commits (`56dabbc`, `506a6ba`) plus cheap read-only greps.

**Both blockers and B10-N6 are done (sha in the follow-up docs commit)** -
B10's one remediation cycle is now spent; see `issues/phase-8/handoff.md`,
"B10 review remediation".

- **B10-B1**: `issues/phase-8/handoff.md`'s "B10's own verification" recorded
  `git grep -c "let open = \$state<Record_" -- app/src` as "no matches
  (acceptance line 1)" - a recorded acceptance result that does not
  reproduce. Re-run, it returns **two** matches, both in
  `app/src/components/RecordHost.svelte` - the host's own declaration and
  its header comment quoting it. The acceptance line's *intent* is met
  perfectly: no page owns its own `open` any more, and `git grep -l` returns
  `RecordHost.svelte` alone - but the handoff recorded a green on a command
  that anyone can falsify in one second, in a file whose own text invokes
  this task's standing rule against unverified verification claims. The
  exact failure mode this phase has now found three times.
  done (sha in the follow-up docs commit): the false line replaced with the
  command's true result (`app/src/components/RecordHost.svelte:2`) and its
  reading, in place.
- **B10-B2**: the batch's one behaviour change ships with zero coverage.
  `app/src/components/RecordHost.svelte:44-49` puts the close-on-navigation
  effect on eight pages; six of them (`AltPanel`, `ListPage`, `RecordPage`,
  `RollPanel`, `SharedListPage`, `StdPanel`) never had it. No test anywhere
  opens a modal and then navigates - every existing modal-close test
  (`searchPage.test.ts:295`, `roll.test.ts:246,260,268`,
  `record.test.ts:744,764`, `sharedListPage.test.ts:354-358`,
  `listPage.test.ts:846`) closes it via the close button or the backdrop.
  The effect's lines are covered because it runs once on mount, so
  `perFile` coverage cannot see this hole.
  done (sha in the follow-up docs commit): one jsdom test added,
  `app/src/components/record.test.ts` ("closes on a real navigation, but a
  filter pick or a list mutation would not (RecordHost, C6)") - opens the
  record modal on `#/i/q1`, drives a real `router.navigate()`-shaped
  navigation (the `app.navigations`-bumping kind - `app.navigations` bumps
  on `go()` and on an external hash change only, never on `replace()`),
  asserts the dialog is gone. Proved to bite: the effect's body was
  temporarily swapped for a no-op, the new test failed on exactly that
  assertion, then reverted (`git diff --stat --
  app/src/components/RecordHost.svelte` empty afterward).
- **B10-N6**: `docs/specs/FEATURES.md:229-233` described the record modal
  but said nothing about what closes it beyond the user's own action;
  `STATE.md:89` lists `modal` under UI memory with no lifetime rule. No
  spec claim was false, but B10 is the commit that made the rule app-wide,
  and a test asserting undocumented app-wide behaviour is half the job.
  done (sha in the follow-up docs commit): one sentence added near
  `FEATURES.md:229` - a real navigation closes the modal, a filter pick
  (which rewrites the address with `replace()`) does not.

| id | where | what |
|---|---|---|
| B10-N1 | `app/src/components/RecordHost.svelte:9-18` | A load-bearing rejected alternative was deleted rather than moved. `TablesPage.svelte:105-121` at `56dabbc^` carried: "Route strings cannot tell one table from another on their own - they all read `tables` - which is why a hash-only move needs this signal rather than `app.hash` itself." Most of the surrounding rationale survives at the definition (`app.svelte.ts:136-145` says `go()` counts, `replace()` does not, and names "an open modal" as a watcher), but the `app.hash` rejection and its reason are now nowhere in the tree. One sentence back into `RecordHost.svelte`'s header comment. |
| B10-N2 | `app/src/components/RecordHost.svelte:36` | `extra`'s return type is wider than anything can produce: `extra?: ((it: Record_) => readonly ShareBlock[] \| undefined) \| undefined`. `entryNoteBlock` (`app/src/lib/share.ts:200`) returns `ShareBlock[]` and never `undefined` - `share.test.ts:247-248` pins that it returns `[]` for an entry with no visible note. The `\| undefined` on the *return* is dead: `extra?.(open)` already yields `\| undefined` from the optional call, which is what `RecordModal`'s `extra?: readonly ShareBlock[] \| undefined` wants. Narrow to `((it: Record_) => readonly ShareBlock[]) \| undefined`. The prop being a *function* rather than a value is the right call and should not change - the doc comment at `:31-35` gives the reason. |
| B10-N3 | `app/src/components/RecordHost.svelte:28` | `index: Index \| null \| undefined` is wider than any caller. Seven callers pass `const index = $derived(app.index)`, typed `Index \| null` (`app.svelte.ts:111`); the eighth (`SharedListPage`) passes a non-nullable `Index`. Nothing can pass `undefined` and the prop is not optional. Narrow to `index: Index \| null`. |
| B10-N4 | `app/src/components/ListPage.svelte:684,706` | Nested hosts on the shared-list route: `ListPage` opens `<RecordHost>` at `:684` and renders `<SharedListPage>` inside it at `:706`, which opens its own. Two `open` states and two navigation effects are alive on `#/l/<payload>`; the outer one can never be set, because `SharedListPage` uses its own host's `openRecord`. Harmless today, and harmless even if `metaOf` were reached there (`ListPage.svelte:239-241` returns `{}` when `own` is null, so `extra` would return `[]`). But the invariant that keeps it harmless - "nothing passes the outer `openRecord` into `SharedListPage`" - is invisible and easy to break. Either one sentence recording it, or move `ListPage`'s `<RecordHost>` inside the `{:else}` branch so the shared route never mounts two. |
| B10-N5 | `app/src/components/{StdPanel,AltPanel,RollPanel}.svelte` | The batch's "none fell out clean without a new prop" claim is under-argued for the three roll panels. Their `{#snippet cardOf(...)}` blocks are byte-identical apart from `it={pick.it}` and two **existing** `RecordCard` props being forwarded (`col={pick.col}`, `rollLabel={pick.n}`) - so the batch's own stated criterion does not actually rule the extraction out, and three copies is well past `CLAUDE.md`'s "extract shared UI on its second real use". Against it: `plan.md`'s "do not over-extract", and a fourth prop (`{#key}` or not) would have to be threaded. The reviewer would not reopen B10 for this, but the rejection and its three-way comparison should be written down, or it will be re-derived by whoever reads `AltPanel` and `StdPanel` side by side. |

**Verified sound in B10's review, recorded so it is not re-derived:**

- **No caller loses a legitimately-open modal.** `app.navigations` fires on
  `go()` and on an external hash change only (`app/src/state/app.svelte.ts:312`,
  `:460`); `replace()` never touches it and `#expectHash` (`:307`) already
  de-duplicates `go()`'s own echo.
- **`ListPage` was the sharpest suspect and is immune**: `app.syncListUrl`
  (`app.svelte.ts:562-568`) writes the packed list with `replace()`, so
  mutating a list while the modal is open - including adding the open record
  to a list from inside the modal - does not bump `navigations`. The 150 ms
  debounce (`ListPage.svelte:141-146`) is likewise invisible to the effect.
- **No in-modal add can navigate**: `AddToList`'s single `app.go()`
  (`AddToList.svelte:148`) is gated on `key === N_SHARED`, and inside the
  modal `AddToList` is always `key={it.id}`. The other three `app.go()` call
  sites in `app/src/components` are unreachable while the modal has the page
  inert (`showModal()`).
- **`RecordPage` is an improvement, not a loss.** On `#/i/a`, opening the
  tier-ladder rung for `b` and clicking the modal's own name link goes to
  `#/i/b` without remounting `RecordPage`. Before B10 the modal stayed open
  showing `b` over a page that had just become `b` - the same card twice.
  Same reasoning for `#/lists/a`->`#/lists/b` and `#/l/p`->`#/l/q`.
- **First mount is a no-op**: the effect assigns `open = null` when `open` is
  already `null`, and `untrack` (`RecordHost.svelte:46`) stops it
  re-triggering itself.
- **`ListPage` already set the precedent**: `ListPage.svelte:203-209` (D23)
  clears `lsel` on `app.navigations` for exactly the "same route kind, no
  remount" case.
- **All eight swaps are faithful.** Focus handling, restore, Escape, backdrop
  close, the `app.menuFor = ''` fold ahead of `onclose` and scroll/inert
  behaviour all live in `RecordModal.svelte`, untouched. Two per-site quirks,
  both no-ops: `SharedListPage` alone rendered `{#if open}` without
  `&& index` (its own `index` prop is a non-nullable `Index`, and it mounts
  only once `app.index` is confirmed), and `RollPanel` alone passed
  `index={app.index}` to the modal while passing `shown.index` to the card
  (in that file `const index = $derived(app.index)` - same value).
- **Moving `AltPanel`/`StdPanel`'s `{#snippet cardOf(...)}` inside the
  `children` snippet moves no DOM and no style** - a snippet emits no wrapper
  element and CSS scoping is per component file, not per snippet.
- **The golden claim's falsifiable half checks out**:
  `git show --stat 56dabbc -- tests/app/snapshots` returns nothing - not one
  golden file changed in the commit.
- **Coverage is real, not linter-shaped**: `vite.config.mts:170-186` sets
  `perFile: true` over `src/**/!(Button|DiceBar|Badge).svelte`, so
  `RecordHost.svelte` cleared a per-file bar rather than merely being named
  `COVERED`. Its **open** state is reached under axe by `a11y.test.ts`'s
  first `STATES` entry (`:132-136`) and by "the record modal over a table"
  (`:198-201`).

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
- **B9 review** blockers BL-1, BL-2 and record corrections N1/N2/N4/N7/N8/N9 - `0686bb6`.
