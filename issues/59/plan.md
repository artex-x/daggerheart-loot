# Plan - TASK 59

## 1. Current state and objective

Task 59 combines two settled scopes that must both ship:

1. GitHub issue 59: remove false roll metadata from campaign-frame equipment,
   preserve its frame-table navigation, and enforce both directions of roll
   membership plus duplicate/gap checks.
2. Replace the active Claude/Codex routing documentation with the settled
   host-aware Sol/Terra/Luna policy.

The previous documentation-only B1 was superseded before implementation. No
production, test, generated, or orchestration file has changed. Base is `main`
at `4c61eac5300c7ae88db20221502f7bc8d5c94173`.

## 2. Evidence and existing behavior

- `data.js` contains 94 frame records (`f1`-`f94`) with artificial global
  `roll: 1..94`. Frames have `#/tables/frames`, but no roll route among the six
  modes in `FEATURES.md` and `ROUTES.md`.
- `tests/dataint.js` treats every `items` array as a roll table, and
  `tests/derived.js` explicitly requires frame rolls. Neither expresses both
  directions of membership with separate duplicate/gap diagnostics.
- `app/src/lib/data.test.ts` is the real-data suite reached by `npm run check`;
  its comments also call all 155 equipment records under `items` roll-table
  members, which becomes false after this correction.
- `tableIdOf` in `app.js` and `tableOf` in `app/src/lib/label.ts` test generic
  roll-less equipment before frame source. Deleting frame rolls alone would
  break `#/i/f1`'s link to `#/tables/frames/f1`.
- The `#/i/f1` structural golden currently says `Frames · roll 1`. Correct
  output is `Frames · Tier 1` with the frame-table link unchanged. No new UI or
  layout is introduced, so no mock is needed.
- `node tools/build.js` derives `data.json`, `catalog.csv`, and `i/*.html`.
  JSON and 94 CSV roll cells change; frame stubs should not: equipment subtitles
  do not read `roll`, and the generator preserves preview ordinals for the f93/f94
  non-equipment frame consumables.
- Both READMEs incorrectly make `roll` universal within `items` and say frames
  keep roll numbers.
- Active orchestration docs mix Claude `Agent` mechanics with Codex dispatch
  and retain obsolete Fable/frontier and over-high effort guidance.

The issue screenshot could not be rendered. No visual fact is inferred from it;
issue text, data, route inventory, and tests fully determine the change.

## 3. Scope and non-goals

In scope: canonical frame data and generated artifacts; real/legacy invariants;
record-table routing in both implementations; focused unit/built evidence;
bilingual data docs and rolling spec; active orchestration prompt/README, five
worker descriptions, and the short `CLAUDE.md` pointer; task-state closeout.

Out of scope: record ids/counts/art/translations/stats; new roll UI/routes;
filters/list encoding; Claude frontmatter changes or historical measurement
rewrites; hooks/runtime configuration; `.claude/settings.local.json`,
`issues/tg-preview-refresh/`, and unrelated work.

## 4. Settled design

### 4.1 Roll invariant

`roll` denotes membership in an actual numbered roll pool, not position in any
display table. Every record reached by the six roll modes has a positive integer
roll; records outside those modes do not. Every independent pool contains each
integer from 1 through its length exactly once. Vault of Ages is checked per
tier/section, Community per community, and each other roll array as one pool.
`frames` is the known non-roll `items` array and all 94 entries omit `roll`.

Frame source is the stronger table-placement discriminator: check
`src === 'frame'` before generic `eq && !roll` in both helpers. Wondrous
equipment keeps real rolls; Vault retains its source-first exception. No frozen
id, route, fixture grammar, or list contract changes.

### 4.2 Host-aware routing

| Role | Claude default | Codex default | Codex effort |
|---|---|---|---|
| planner | `opus` | `gpt-5.6-sol` | `medium` |
| reviewer | `opus` | `gpt-5.6-sol` | `medium` |
| implementer | `sonnet` | `gpt-5.6-terra` | `medium` |
| add-source | `sonnet` | `gpt-5.6-terra` | `medium` |
| refresh-artwork | `sonnet` | `gpt-5.6-terra` | `medium` |

Codex's only ladder is Sol -> Terra -> Luna. Luna is explicit only for bounded,
low-risk mechanical/read-only helpers, never a named-role silent default and
never planning, ambiguous implementation, remediation, or risk-bearing review.
Every Codex worker spawn passes explicit `model` and `reasoning_effort`, using
`fork_turns: "none"` or a bounded positive count because full-history forks
cannot accept overrides. `medium` is default; `high` is the only escalation.
Claude keeps two Opus and three Sonnet frontmatter values and session-level,
human-controlled effort. Workers never choose or recommend routing.

## 5. Architecture and verification

`data.js` remains canonical and generated outputs are never hand-edited. Put
the complete invariant in real-data Vitest so `npm run check` enforces it, and
align legacy `dataint`/`derived`. Keep routing in existing helpers.

B1 changes data, generated artifacts, and visible output: run generator,
focused tests/golden, `npm run check`, and `npm run check:built`. The existing
f1 state is sufficient; no new parity state or route fixture. A reviewer is
required after B1 because generated/screen output changes. B2 is Markdown-only
and uses static searches plus `git diff --check` without repeating product
gates.

## 6. Risks and assumptions

- Isolate the minified `items.frames` segment and assert exactly 94 removals; a
  broad deletion or full-file reserialization risks all real roll tables.
- Change both Svelte and fallback routing; one-sided correction breaks parity.
- Any `i/f*.html` diff after regeneration is unexpected and must be investigated.
- Do not weaken coverage to array-position equality alone; test membership,
  uniqueness, and gaps explicitly.
- Do not put Codex ids in Claude frontmatter or append a second policy beside
  the obsolete block. Historical evidence remains untouched.
- No unresolved product/design decision or deferred improvement is known.

## 7. Ordered batches

| Batch | Status | Purpose |
|---|---|---|
| B1 - Correct frame rolls and enforce pool invariants | completed | Data, routing, tests, docs, generated outputs, built evidence |
| B1 review | completed | Approved independently with no remaining findings |
| B2 - Publish host-aware Claude/Codex routing | completed | Replaced active orchestration documentation with the settled host-aware policy |

## B1 - Correct frame rolls and enforce pool invariants

### Objective

Remove false roll values from all frame equipment without breaking frame-table
navigation, and make invalid membership, duplicates, or gaps fail the mandatory
gate.

### In scope / out of scope

In: 94 canonical records and generated JSON/CSV; both routing helpers;
real/legacy data tests; f1 unit/golden evidence; bilingual READMEs and feature
spec. Out: B2, new UI/routes, ids/counts/art/stats/translations, fixtures,
unrelated cleanup and paths.

### Expected files

Edit `data.js`, generated `data.json` and `catalog.csv`, `app.js`,
`app/src/lib/data.ts`, `app/src/lib/data.test.ts`, `app/src/lib/label.ts`,
`app/src/lib/label.test.ts`, `tests/dataint.js`, `tests/derived.js`,
`tests/app/snapshots/_i_f1.txt`, `tools/capture-share-fixture.mjs`, `README.md`,
`README.ru.md`, `docs/specs/FEATURES.md`, and task docs at closeout.
`i/*.html` is regenerated but must have no diff. No orchestration file is B1.

### Ordered steps

1. Preflight branch/HEAD/status; preserve the two unrelated untracked paths and
   confirm no second writer.
2. Isolate `"frames":[...]` in minified `data.js`, remove only its integer roll
   properties, assert exactly 94 removals/no remaining frame roll, and do not
   reserialize the whole file.
3. Move frame-source placement before generic roll-less equipment in
   `label.ts` and `app.js`, retaining Vault precedence. Test a roll-less frame
   maps to `frames` and retain Wondrous-with-roll coverage.
4. In `data.test.ts`, define actual roll-pool boundaries and assert both
   membership directions, positive integers, uniqueness, and complete `1..N`
   coverage. Correct adjacent all-items-are-roll-tables comments.
5. Align `dataint.js`; replace `derived.js`'s frame sequence with no-roll while
   preserving frame count/source/tier/upgrade assertions.
6. Correct the optional-roll/frame wording in both READMEs, `FEATURES.md`,
   `data.ts`, and `capture-share-fixture.mjs`; do not change counts.
7. Run `node tools/build.js`; accept only frame-roll removal in JSON and blank
   frame CSV roll cells, with no stub diff.
8. Build, update only f1 via `node tests/app/golden.js "--only=#/i/f1" --update`,
   inspect the semantic diff, then compare with the same command sans update.
9. Run focused/full gates. On green, close B1 state, commit/push only B1, and
   dispatch required review.

### Acceptance criteria

- Exactly 94 frame roll properties are removed; no other field/order/id/count/
  roll changes.
- Mandatory Vitest rejects either membership-direction violation and duplicate
  or missing faces in every supported pool shape; legacy checks agree.
- JSON matches canonical data, all frame CSV roll cells are blank, and stubs
  are byte-identical.
- Both apps route roll-less f1 to `#/tables/frames/f1`; its heading shows tier 1;
  Wondrous/Vault equipment placement remains covered.
- The f1 golden contains only intentional roll-to-tier text change, with no
  link/layout/control drift.
- Both READMEs and `FEATURES.md` agree on optional roll membership.
- `npm run check` and `npm run check:built` pass; no unrelated change.

### Verification commands

- `git status --short --branch`; `git rev-parse HEAD`
- `node tools/build.js`
- `node tests/run-all.js dataint,derived`
- `npx vitest run app/src/lib/data.test.ts app/src/lib/label.test.ts --coverage=false`
- `npm run build`
- `node tests/app/golden.js "--only=#/i/f1" --update`
- `node tests/app/golden.js "--only=#/i/f1"`
- `npm run check`
- `npm run check:built`
- `git diff --check`; `git status --short`

Inspect the scoped data/routing/golden diff before commit. Run heavy gates
sequentially.

### Risks / do-nots / fallback

Do not invent a frame roll route, renumber records, hand-edit generated files,
accept stub churn, rely only on array position, misroute frames to equipment,
or touch B2. If the focused golden cannot run after a successful build, record
the exact blocker and leave B1 uncommitted rather than inventing a snapshot.

## B2 - Publish host-aware Claude/Codex routing

### Files expected

`.claude/prompts/orchestrate.prompt.md`, `.claude/README.md`, all five active
`.claude/agents/*.md` worker descriptions, `CLAUDE.md`, and task-state docs.

### Steps

1. Replace the active routing policy with section 4.2 exactly, retaining the
   existing Claude frontmatter and historical evidence.
2. Verify the specified model names, bounded Codex worker dispatch, effort
   limits, frontmatter counts, line limit, and scoped negative searches.
3. Update task state, commit the documentation-only B2 batch, and push only
   after the required approval.

After B1 review/remediation, replace the old model-selection block in
`.claude/prompts/orchestrate.prompt.md`; update `.claude/README.md`; normalize
all five `.claude/agents/*.md` descriptions; replace the existing orchestration
sentence in `CLAUDE.md` in place. Apply section 4.2 exactly. Preserve frontmatter,
history, and the <=199-line limit; active surfaces name no Fable/GPT-6/Astra/
frontier/strong-high or effort above high. Acceptance requires one Sol -> Terra
-> Luna policy, explicit Codex model/effort and bounded/none forks, matching
worker descriptions, two Opus/three Sonnet frontmatter lines, no product change,
and task closeout. Verify with `git diff --check`, scoped negative/positive `rg`
searches, exact frontmatter/line counts, and status. This batch has no product
gate.
