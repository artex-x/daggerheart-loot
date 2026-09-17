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
