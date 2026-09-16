# Handoff - TASK art-tooling
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: done - B1, B2 and B3 are all shipped; `plan.md` defines no
  further batch. B3b was not needed - the whole batch closed in one commit.
- Last agent: implementer (B3)
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `tooling/art-refresh` in worktree
  `E:/dev/daggerheart-loot-wt/tg-preview-refresh`
- Base / starting commit for this batch: `643df19` (B2's handoff record),
  tree clean, branch already pushed (`origin/tooling/art-refresh` = `643df19`
  at dispatch).
- Commits made this batch: `a38cd60` (B3 code + docs: `planIngest`, the
  `ingest` verb, the `og/` orphan check, both prompts, `docs/artwork.md`'s
  ingest section, `docs/specs/COVERAGE.md`). This handoff update is the next
  commit. The B3/B3b seam (plan.md 5.3 fallback) was **not** used - the full
  batch, including both prompts, closed in one pass and one commit.
- `origin/main` moved during this batch, as expected (a peer session and a
  CI bot both push): `b3d0d1f`/`618ad7c`/`8850600` at dispatch ->
  `a142ee9`/`37e4812`/`db01b92` re-read just before the code commit. This
  branch was deliberately **not** rebased onto it; `.claude/hooks/**` is
  untouched by this batch.

## Completed

### B1 - machine-readable stale list (shipped)
- `tools/tg-preview/lib.mjs` / `run.mjs` / `lib.test.mjs`: `--stale-list
  <path>`, dry-run only, emitted from both dry-run-reachable exits, sorted
  `stale`/`notLive`, no `urls` key, no timestamp. `docs/tg-preview.md` and
  `docs/specs/COVERAGE.md` document it.
- Commits: `fde756c` (planning docs), `977b8a7` (B1 code + docs),
  `db52655` (B1 handoff record).
- Verified: `node --test tools/tg-preview/lib.test.mjs` -> 104/104 (96 + 8);
  a real `--dry-run --no-verify --stale-list` run wrote `stale.length === 143`
  matching the logged `143 urls stale`; a repeat run produced a byte-identical
  file; the `lib.mjs` diff is confined to `FLAGS`, `parseArgs`, the `deps`
  destructure and the two dry-run exits; `state.json` unchanged and unstaged;
  one foreground `npm run check` green (vitest 1035/1035, 42 files, no
  threshold failures). `npm run check:built` not required, confirmed against
  the file list.

### Planner pass r2 - the ingest question (this pass, no code)
- The owner asked whether the artwork tooling should serve new-item ingest as
  well as replacement. **Yes.** `plan.md` section 0 carries the revision
  history; the five decisions are settled in sections 3.4, 3.6, 3.7 and 3.8.
- Renames made now, before the directory exists and at zero cost:
  `tools/art-refresh/` -> **`tools/artwork/`**, `docs/art-refresh.md` ->
  **`docs/artwork.md`**. Agent and prompt filenames are unchanged.
- B2 and B3 are both rewritten to implement-ready form (`plan.md` 5.2, 5.3).
- Files written this pass: `issues/art-tooling/plan.md`,
  `issues/art-tooling/handoff.md`, `issues/art-tooling/context.md`.

## Completed (this pass)

### B2 - `tools/artwork/`, the replacement path end to end

Shipped in `7698c95`, per `plan.md` section 5.2, all eleven ordered steps.

- `tools/artwork/package.json` + `package-lock.json`: `sharp@^0.35.4`,
  installed cleanly on this Windows host (`cd tools/artwork && npm install`,
  8 packages, 0 vulnerabilities) and confirmed to actually load its native
  binding (`sharp loaded, version 0.35.4`). **No fallback needed** - the
  `install`/`verify` half shipped along with `plan`/`verify-previews`.
- `tools/artwork/lib.mjs`: pure, no `fs`/`sharp`/network imports. Exports
  `normalizeName`, `indexRecords`, `planInstall`, `affectedStubUrls`,
  `staleDelta`, exactly as specified. `planInstall` keys pairs by distinct
  asset (a record's `img` value), never by record - verified against the
  four-record shared-asset fixture (`counts: {acceptedArtwork:1,
  assetPairs:1, recordLinks:4}`, `jpeg: 'og/q24.jpg'`, never
  `og/<other-id>.jpg`).
- `tools/artwork/lib.test.mjs`: 19/19 (`node --test`), every case the plan's
  step 3 lists - apostrophe folding, `v<N>` suffix stripping (and the
  internal-`v2`-not-stripped negative), NFC, `byImg` grouping, the
  destination-is-`img`-not-`id` regression fixture, the shared-asset single
  pair, collisions, duplicate-bytes, unmatched/ambiguous, `map.assign`
  (including an unknown target reported not thrown), `affectedStubUrls`, and
  five `staleDelta` cases including the identical-before/after edge.
- `tools/artwork/run.mjs`: verbs `plan`, `install`, `verify`,
  `verify-previews`. Loads records via the same `createRequire` +
  `window.LOOT` shim as `tools/tg-preview/manifest.mjs`, taking
  `everything()`/`SITE` from the real `tools/derived.js` regardless of
  `--repo` (only `data.js` moves with `--repo`). `sharp` is
  `await import('sharp')` inside a `try`, reached only by `install`/`verify`;
  confirmed by inspection (`select:` grep, two call sites, both inside those
  two verb functions) and by running `verify-previews` with no flags, which
  fails on a plain validation error before ever touching the import.
  **One interpretive decision, not explicit in the CLI skeleton**: the plan's
  outline lists `verify-previews --before <f> --after <f> [--report <f>]`
  with no `--uploads`, but `affectedStubUrls` needs `pairs`, which only
  `planInstall` produces. I read `--report` here as an **input** - the same
  JSON a prior `plan`/`install --report <f>` call wrote - rather than a
  second output, so the preview proof reuses exactly what was actually
  planned/installed instead of re-deriving it a third time. Documented in
  `docs/artwork.md`'s command sequence. Flagged here in case a reviewer reads
  the plan's flag list literally.
- Root `package.json`: added `node --test tools/artwork/lib.test.mjs` to
  `check`, immediately after the `tg-preview` step. No dependency added.
- `docs/artwork.md`: created - setup, all four verbs, the drop-is-the-ledger
  three checks, conversion settings (stated once), the per-run-determinism
  note, the end-to-end command sequence, and the risks section.
- `docs/specs/CONTRACTS.md` section 5: added the asset-id/sharing sentence in
  both directions, citing `tools/build-share-pages.js` as the code that
  already enforces it. **The `PostToolUse` hook flagged this as a public-
  contract change** requiring `docs/fixtures/`/`tests/contracts.js`/
  `llms.txt` to move together. Per `plan.md`'s own decision (context.md/
  plan.md 3.4, and B2's ordered step 7): this documents behaviour the code
  already enforces, not a new contract, so those three were deliberately
  left untouched. Recording this judgment call explicitly for review.
- `docs/specs/COVERAGE.md`: added the `tools/artwork/lib.test.mjs` paragraph
  beside the `tg-preview` one, same voice, naming what it covers and that
  `run.mjs` is deliberately outside it.
- `.claude/README.md`: added an "Artwork tooling" section (what it is, why a
  sibling npm project, why no skill) before "Candidates considered", and
  amended the candidate-39 row to record that
  `issues/dh-image-polish/refresh_artwork.py` was superseded and deleted.
- Deleted `issues/dh-image-polish/refresh_artwork.py` (`git rm`); its
  `context.md`/`plan.md`/`handoff.md` are untouched.
- Grepped for the conversion-settings duplicate (acceptance criterion): `640x640`
  and the quality numbers appear in `docs/artwork.md` (the new single home)
  and still in `.claude/prompts/refresh-artwork.prompt.md` (lines 61-62,
  90-92, 101) - the one known remaining duplicate, left for B3 to close per
  the plan. `README.md`/`README.ru.md` also say "640x640" but only as a
  published-dimension fact in a stats table, not a re-derivation of the
  settings; not counted as the duplicate.

### B3 - the ingest verb, both prompts, and the runbook's second half

Shipped in `a38cd60`, per `plan.md` section 5.3, all nine ordered steps in
one commit (the B3/B3b seam was not needed).

- `tools/artwork/lib.mjs`: refactored the matching half of `planInstall`
  (name/`map.assign` resolution, duplicate-bytes detection) into a shared
  `matchSources` helper - a pure extraction, `planInstall`'s behavior and
  return shape are unchanged - so `planIngest` reuses it rather than forking
  the matching code, per the plan's explicit instruction.
  `planIngest({ sources, records, missingAssets, map })` returns
  `{ creates, shares, unarted, unsourced, unmatched, ambiguous, collisions,
  duplicateSources, counts }`. **The interpretive decision the plan leaves
  open, resolved and worth flagging for review**: `shares` (and `creates`)
  are keyed off *matched candidates* (a source in `--uploads` resolving to a
  record), not off every record in the full `records` array that happens to
  share an asset. Reasoning: `planIngest` never infers which records are
  "new," and the plan's own worked example ("one shared-with-existing
  record") only makes sense if the anchor record that already owns the asset
  is *not* also reported - which requires scoping `shares` to what a source
  actually resolved to. Confirmed against the plan's own mixed-fixture counts
  example (`shared: 1`, not 2) before committing to it. Documented in
  `lib.mjs`'s comment above `planIngest` and in `docs/artwork.md`.
- `tools/artwork/lib.test.mjs`: 7 new cases (19 -> 26 total) - the og/-trap
  negative assertion (`JSON.stringify(result).includes('og/joiner.jpg') ===
  false`), the two-new-records-one-new-asset case, `img: ''` -> `unarted`,
  an unsourced missing asset, unmatched/ambiguous/duplicate-bytes reuse,
  `map.assign` for ingest, and the mixed-fixture counts example from the
  plan verbatim.
- `tools/artwork/run.mjs`: added the `ingest` verb and `findMissingAssets`
  (distinct `img` values in `data.js` for which `img/<value>` does not exist
  - computed here, never inside `planIngest`). Extracted `installAndVerify`
  (encode to `.tmp` siblings, decode-check, rename both, re-encode-and-
  compare) as the one installer code path shared by `install` and `ingest` -
  `install`'s own behavior is unchanged, verified by re-running B2's
  fixture-install scratch case after the refactor (same log line format,
  same exit codes). `ingest`'s hard stops: ambiguous/collisions/
  duplicate-bytes (shared with `install`), non-square/non-opaque (via
  `decodeAndCheck`), and the **inverted** precondition - refuses when a
  destination `img/` or `og/` file **already exists**, naming it. Verified
  against a scratch fixture (below) including the inverted-precondition
  firing on a deliberately partial pre-existing `og/*.jpg`.
- `tests/dataint.js`: added the `og/` orphan check immediately after the
  existing `img/` orphan block, exempting `_none.jpg`/`_share.jpg`, reusing
  the same `used` set (mapped `.webp` -> `.jpg`) rather than recomputing it.
  Passes unchanged on the current tree (877 `og/*.jpg`, 875 claimed, exactly
  the two exemptions - matches `context.md`'s measured precondition, re-
  verified this session). **Negative test performed by hand**: copied
  `og/_none.jpg` to `og/__b3-negative-test.jpg`, ran
  `node tests/run-all.js dataint` - failed, naming
  `картинка og/__b3-negative-test.jpg никому не принадлежит`; deleted the
  file, re-ran - passed. `git status --porcelain -- img og` was empty both
  before and after; the scratch file never touched git.
- `docs/artwork.md`: added the `ingest` bullet to the verb list, "The ingest
  path" section (inverted precondition and why, the three legal outcomes,
  the `unsourced` blocker, the ordering constraint and why, the command
  sequence), and extended "Risks" to name `ingest` alongside `install`/
  `verify`. Did not restate the conversion settings.
- `.claude/prompts/add-source.prompt.md`: the four edits in plan.md 3.8 -
  the "Canonical data source of truth" block (asset-id/sharing/`img:''`
  facts, linking `docs/artwork.md`), Phase 1 step D (the three ingest
  decisions), Phase 2 step 5 (declare `img` then run `ingest`, states the
  ordering constraint), and Phase 2 step 10 + Done criteria (names
  `node tests/run-all.js dataint` explicitly). No settings, dimensions, or
  encoder flags added - confirmed by grep (below).
- `.claude/prompts/refresh-artwork.prompt.md`: applied the 3.2 table. The
  Phase 1 stop paragraph survives **verbatim** with one appended sentence
  citing the drop-is-the-ledger exception and linking `docs/artwork.md`.
  Phase 1 steps 4 and 7 (hashing, decode/validate) now point at
  `tools/artwork/run.mjs plan`/`install --dry-run` instead of describing the
  mechanics by hand. Phase 2's contract bullets drop the `640x640 RGB`
  specifics in favor of a `docs/artwork.md` pointer. Phase 3 keeps only the
  genuine judgment call (reconciling shared-art policy under the duplicate-
  byte invariant); the mechanical resolution/rejection/report steps now
  point at `plan`'s output. Phase 4 replaced wholesale with the `install`
  invocation and its refusal conditions, dropping the settings list. Phase 5
  items 1-3 replaced with `verify`/`verify-previews` invocations; items 4-6
  (git diff inspection, gates, `npm run check`/`check:built`, commit/push)
  are unchanged. Renumbered the trailing two Phase 5 items after the
  replacement (6/7 -> 5/6).
- **Grep confirmation (B3's closing acceptance line)**: `640x640`,
  `quality 85`, `quality 80` no longer appear in either prompt file. They
  appear only in `docs/artwork.md` (the documented home),
  `tools/artwork/run.mjs` (the implementation, not a restatement), and
  `README.md`/`README.ru.md` (a published-dimension fact in a stats table,
  per B2's handoff - not counted as the duplicate).
- `docs/specs/COVERAGE.md`: extended the `dataint` table row with the new
  `og/` orphan check, and extended the `tools/artwork/lib.test.mjs`
  paragraph with the ingest planner's cases, naming the og/-trap case
  explicitly.
- `.claude/agents/add-source.md` and `.claude/agents/refresh-artwork.md`:
  read both; neither's `description` promises a procedure its prompt no
  longer carries (both just say "follow the prompt file" plus a short,
  still-accurate summary), so **neither was edited**. No `model:` line
  touched, per the plan's constraint.
- `docs/specs/CONTRACTS.md`: **not touched this batch.** Re-checked section
  5 first - B2 already added the asset-id/sharing sentence "in both
  directions," including the ingest direction ("a new record that joins an
  existing asset gets no `img/` or `og/` file of its own"). Per the
  orchestrator's note that B2's CONTRACTS.md edit was reviewed and correct
  (states the rule `tools/build-share-pages.js` already enforces, adds no
  frozen path/id/URL), the same standard applies here: B3 adds no new
  contract fact CONTRACTS.md doesn't already state, so `tests/contracts.js`,
  `llms.txt`, and `docs/fixtures/` correctly did not move.

All exercise of `install`/`ingest`/`verify` ran against scratch fixtures
under the session scratchpad
(`.../scratchpad/fixture-b3/`, `fixture-install3/`), built with `sharp`
itself (solid-color synthetic images) since a real photo wasn't needed to
prove the code paths. Never against this repository's own `img/`/`og/`/
`data.js`.

## Verification

Commands run, in order, with results:

```text
cd tools/artwork && npm install                        # 8 packages, 0 vulnerabilities
node -e "import('sharp')..."                            # sharp loaded, version 0.35.4
node --test tools/artwork/lib.test.mjs                  # 19/19
node --test tools/tg-preview/lib.test.mjs               # 104/104
node tools/artwork/run.mjs plan --uploads <scratch fixture>   # accepted 1, asset pairs 1, record links 4; og/q24.jpg only
node tools/artwork/run.mjs verify-previews                    # clean validation error, no sharp reached, no node_modules dependency
node tools/artwork/run.mjs install --uploads <scratch fixture, real 200x200 opaque source>
                                                          # accepted 1, asset pairs 1, record links 1; wrote 640x640 webp+jpeg, re-encode-verify passed
node tools/artwork/run.mjs install <fixture with no pre-existing destination>
                                                          # refused: destination does not exist (both img/ and og/); exit 1; nothing written
node tools/artwork/run.mjs verify --uploads <fixture>    # ok: x1 (x1.webp), exit 0
node tools/artwork/run.mjs verify-previews --before --after --report <synthetic files>
                                                          # staleDelta printed, ok:true
set -o pipefail; npm run check 2>&1 | tail -n 120        # green: vitest 1035/1035 (42 files), both node --test suites clean, format/lint/typecheck/data/derived/i18n/selftest all passed
node tests/run-all.js dataint,noart                      # both ok (informational; not required by B2, run anyway since cheap)
git status --porcelain -- img og tools/tg-preview/state.json .claude/hooks
                                                          # empty every time it was checked
```

All scratch fixtures lived under the session scratchpad
(`.../scratchpad/fixture-b2/`, `fixture-install/`, `fixture-install2/`), never
under this repository's own `img/`/`og/`. `install`/`verify` were never run
against the real repository tree.

`npm run check:built` was **not** run in B2 - confirmed against B2's real
file list (`tools/artwork/**`, `package.json`'s `check` script, `docs/**`,
`issues/**`, `.claude/README.md`), none of which touches `app/`, `data.js`,
`img/`, `og/`, `i/`, `style.css` or `dist/`.

### B3 verification

Commands run, in order, with results:

```text
node --test tools/artwork/lib.test.mjs                  # 26/26 (19 + 7 new)
node --test tools/tg-preview/lib.test.mjs               # 104/104 (unaffected)
node tests/run-all.js dataint                           # ok, unchanged tree (877 og/*.jpg, 875 claimed)
node tests/run-all.js dataint,noart                     # both ok
node tools/artwork/run.mjs ingest --repo <scratch> --uploads <scratch/uploads> --dry-run
                                                          # accepted 1, new assets 1, record links 1, shared 1, unarted 1; dry run, nothing written
node tools/artwork/run.mjs ingest --repo <scratch> --uploads <scratch/uploads> --report <f>
                                                          # same counts; wrote img/newitem1.webp + og/newitem1.jpg; re-encode-verify line printed; exit 0
node tools/artwork/run.mjs ingest <same, run again>     # newitem1.webp now on disk -> reported as `shares` (no-op), exit 0 (no error)
node tools/artwork/run.mjs ingest <fixture with a pre-existing og/partial.jpg but missing img/partial.webp>
                                                          # refused: ingest refuses: destination already exists: og/partial.jpg; exit 1; nothing written
node tools/artwork/run.mjs install/verify/plan/verify-previews <scratch fixtures>
                                                          # all four unaffected by the installAndVerify refactor - same output shapes as B2's record
git status --porcelain -- img og tools/tg-preview/state.json .claude/hooks
                                                          # empty every time it was checked
# the og/ orphan negative test, run by hand (B3's required acceptance line):
cp og/_none.jpg og/__b3-negative-test.jpg
node tests/run-all.js dataint                            # FAIL: картинка og/__b3-negative-test.jpg никому не принадлежит
rm og/__b3-negative-test.jpg
node tests/run-all.js dataint                            # ok again; git status --porcelain -- img og empty throughout
set -o pipefail; npm run check 2>&1 | tail -n 120        # green: vitest 1035/1035 (42 files), both node --test suites clean (26 + 104), format/lint/typecheck/data/derived/i18n/selftest all passed, no FAIL line
```

All scratch fixtures lived under the session scratchpad
(`.../scratchpad/fixture-b3/`, `fixture-install3/`), built with `sharp`
itself (synthetic solid-color images, real `.webp`/`.jpg`/`.png` bytes so the
decode/geometry/opacity checks are real). Never against this repository's
own `img/`/`og/`/`data.js`; the one exception - the negative-test file - was
created and deleted within the verification, confirmed absent from
`git status` before and after.

**The `--report`-as-input-vs-output question B2 flagged, resolved**:
`ingest --report <f>` is an **output**, exactly like `plan`/`install`'s
`--report` - it writes the `planIngest` result JSON. `verify-previews
--report <f>` stays an **input** (B2's decision, unchanged) - it reads a
prior `plan`/`install --report` JSON for `pairs`. The two never collide
because they belong to different verbs and are never both present on one
command line; `verify-previews` has no use for `ingest`'s `creates`/`shares`
shape (it needs `pairs` with `recordId`/`sharedWith`, which `ingest` does not
produce), so there was no pressure to unify them. Documented in
`run.mjs`'s comments and not otherwise called out in `docs/artwork.md`
since each verb's own bullet already states which way its `--report` goes.

## Next batch

- **Name:** none - `plan.md` defines only B1, B2, B3, and all three are now
  shipped (`fde756c`/`977b8a7`/`db52655`, `551380f`/`7698c95`, `643df19`/
  `a38cd60`). This handoff update is the closing commit for the task as
  planned.
- Remaining work is recorded as **Deferred**, below, none of it blocking:
  each item is either explicitly out of scope for this task (section 8) or
  has no current producer/caller.
- If the owner wants one of the Deferred items taken up, it is a new task
  (or a plan revision), not a continuation of B3.

## Blockers
- None.

## Deferred
- Moving `node tests/dataint.js` into `npm run check`: `plan.md` section 8 -
  deliberately not decided here; it changes what every commit in the
  repository gates on, and `noart` (its documented sibling) needs puppeteer
  and cannot follow it.
- A `--stale-list` equivalent on the live send path: no caller.
- Any acceptance-ledger schema: no producer; `--map`'s `assign` key is the
  escape hatch.
- `.claude/agents/{add-source,refresh-artwork}.md`: read, not edited - their
  descriptions already match the slimmed prompts (see "Completed", above).
  Worth a second look only if a future prompt edit changes what either
  agent's description claims.

## Notes
- Mocks path: none. This task has no visual surface.
- Screenshot findings: none.
- Cleanup performed / retained artifacts: B2's and B3's verification
  fixtures (`fixture-b2/`, `fixture-install/`, `fixture-install2/`,
  `fixture-b3/`, `fixture-install3/`, and assorted synthetic report JSON)
  lived only in the session scratchpad and were never in the repository; not
  explicitly deleted at session end since the scratchpad is session-scoped,
  but nothing there is referenced by anything committed.
- Session end partial progress: none. B3 is committed at a coherent boundary
  (`a38cd60`, plus this handoff commit) with `git status --porcelain`
  clean apart from `issues/art-tooling/handoff.md` itself before this
  commit.
- The facts most likely to be re-derived by a later session, so they are here
  as well as in `context.md`:
  - `tools/**` and `tests/**` are outside the vitest coverage thresholds
    (`vite.config.mts` has `root: 'app'`), outside `eslint .`
    (`eslint.config.mjs` ignores both) and outside `prettier --check`
    (`.prettierignore` lists both). The house obligation for a new `tools/`
    file is a `node --test` suite wired into `npm run check` plus a paragraph
    in `docs/specs/COVERAGE.md`, not a coverage percentage.
  - `npm run check` does **not** run `tests/dataint.js`. The artwork
    invariants it holds, including B3's new `og/` orphan check, are reached
    only by `node tests/run-all.js dataint`, which is why both prompts now
    name that command explicitly.
  - A record may legitimately ship with `img: ''`; it renders `_none.webp`
    and `tests/noart.js` pins that path. `planIngest` reports it as
    `unarted`, never as an error.
  - `planIngest`'s `shares`/`creates` buckets are scoped to what a source in
    `--uploads` actually resolved to, not to every record in the catalog
    that happens to share an asset - see the interpretive note under
    "Completed (this pass)", above, since the plan's prose alone is
    ambiguous between the two readings.
