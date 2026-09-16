# Handoff - TASK art-tooling
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress
- Last agent: implementer (B2)
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `tooling/art-refresh` in worktree
  `E:/dev/daggerheart-loot-wt/tg-preview-refresh`
- Base / starting commit for this batch: `db52655`, tree clean (plus the
  planner's uncommitted r2 doc edits, committed as this batch's first commit,
  `551380f`).
- Commits made this batch: `551380f` (docs-only, gate-exempt, the planner's
  r2 `issues/art-tooling/*.md` revision - B1's established pattern) and
  `7698c95` (B2 code + docs). Branch tip is now `7698c95`.
- `origin/main` moved twice more during this batch, as expected (a peer
  session and a CI bot both push): `2ce3b08`/`80809c8`/`e2ada3f` at r2
  dispatch -> `01a91bb`/`3f693a5`/`2ce3b08` at batch start ->
  `618ad7c`/`8850600`/`7849e51` re-read just before the final commit. This
  branch was deliberately **not** rebased onto any of them;
  `.claude/hooks/**` is untouched by this batch.

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

`npm run check:built` was **not** run - confirmed against the real file list
(`tools/artwork/**`, `package.json`'s `check` script, `docs/**`,
`issues/**`, `.claude/README.md`), none of which touches `app/`, `data.js`,
`img/`, `og/`, `i/`, `style.css` or `dist/`.

## Next batch

- **Name:** B3 - the ingest verb, both prompts, and the runbook's second half
- **Status:** implement-ready - `plan.md` section 5.3 has the objective,
  scope, exact file list, nine ordered steps, per-line acceptance criteria
  (including the required negative test for the new `og/` orphan check),
  verification commands, risks/do-nots and a named intra-batch fallback
  (stop after step 5 if the full batch will not close in one pass).
- **Depends on** `tools/artwork/run.mjs`'s real verb names and
  `docs/artwork.md` existing - both shipped in B2, so B3 can start
  immediately.
- **One thing for the next implementer to check first:** re-read B2's
  `verify-previews`/`--report`-as-input interpretation above before adding
  the `ingest` verb, since B3's `ingest --dry-run` per the CLI skeleton also
  lists `--report` as (this time, plausibly) an output - confirm the two
  uses do not collide if a single invocation ever needs both.
- Re-read `git log --oneline -3 origin/main` before B3's commit; it has
  moved on every check so far in this task and will keep moving.

## Blockers
- None.

## Deferred
- **B3** - as above, `plan.md` section 5.3.
- Moving `node tests/dataint.js` into `npm run check`: `plan.md` section 8.
- A `--stale-list` equivalent on the live send path: no caller.
- Any acceptance-ledger schema: no producer; `--map`'s `assign` key is the
  escape hatch.
- Closing the conversion-settings duplicate in
  `.claude/prompts/refresh-artwork.prompt.md`: B3's acceptance criteria.

## Notes
- Mocks path: none. This task has no visual surface.
- Screenshot findings: none.
- Cleanup performed / retained artifacts: B2's verification fixtures
  (`fixture-b2/`, `fixture-install/`, `fixture-install2/`, and the synthetic
  `before.json`/`after.json`/`report.json` for `verify-previews`) lived only
  in the session scratchpad and were never in the repository; not explicitly
  deleted at session end since the scratchpad is session-scoped, but nothing
  there is referenced by anything committed.
- Session end partial progress: none. B2 is committed at a coherent boundary
  (`551380f` docs, `7698c95` code) with `git status --porcelain` clean.
- The facts most likely to be re-derived by a later session, so they are here
  as well as in `context.md`:
  - `tools/**` and `tests/**` are outside the vitest coverage thresholds
    (`vite.config.mts` has `root: 'app'`), outside `eslint .`
    (`eslint.config.mjs` ignores both) and outside `prettier --check`
    (`.prettierignore` lists both). The house obligation for a new `tools/`
    file is a `node --test` suite wired into `npm run check` plus a paragraph
    in `docs/specs/COVERAGE.md`, not a coverage percentage.
  - `npm run check` does **not** run `tests/dataint.js`. The artwork
    invariants it holds are reached only by `node tests/run-all.js dataint`,
    which is why B3 makes both prompts name that command.
  - A record may legitimately ship with `img: ''`; it renders `_none.webp`
    and `tests/noart.js` pins that path. Ingest must report it, not fail on it.
