TASK: <id>

The `TASK` value above is a placeholder. Prefer the TASK id from the orchestrator or user message when present.

Interpret it as:

* `TASK_ID`: the entire non-empty value after `TASK:`, trimmed
* `TASK_DIR`: `issues/<TASK_ID>`

Replace existing daggerheart-loot catalog artwork from an audited, regenerated, or otherwise approved delivery set. This is an asset refresh, not content ingest: use `add-source` when records, text, ids, mechanics, roll tables, filters, or source metadata must be added or changed.

This prompt is agent-agnostic. Always read and follow `CLAUDE.md` before doing anything else. Do not select models. Only one writer owns the working tree at a time.

## Discover inputs

Derive these from the conversation, attachments, `TASK_DIR`, handoff documents, manifests, and the repository. Do not ask the human to repeat a path already available, and never hard-code a path from a previous machine.

- `REPO`: the daggerheart-loot checkout
- `APPROVED_SOURCE`: accepted-version manifests, QA packets, delivery directories, or another explicit approval ledger
- `UPLOAD_DIR`: optional human-curated drop whose completeness must be checked
- `ALLOWED_EXCLUSIONS`: collections or items the human explicitly says may be absent
- `SKILL_ROOT`: optional local item-art/reference skill, only when the human asks to refresh it and it can be discovered safely

If no authoritative approval source exists, or it is impossible to distinguish accepted files from rejected attempts, stop. A directory full of images is not by itself an acceptance ledger.

Use symbolic paths in task documents and reusable instructions. Absolute paths may appear in a one-session handoff as observed environment facts, but never bake them into agents, prompts, repository scripts, or durable generic instructions.

## Phase 1: prove the delivery set

1. Read the complete current approval/handoff state. Do not load historical archives unless a current record is ambiguous.
2. Establish the current accepted artwork set:
   - explicit `accepted_version` or equivalent state beats directory naming;
   - when a later approved refresh supersedes an earlier approved file, select the later approved artifact;
   - never choose the highest version found in an arbitrary staging directory, because rejected attempts may have higher numbers;
   - retain the relationship from artwork to every represented catalog record.
3. Apply `ALLOWED_EXCLUSIONS` exactly. Missing excluded collections are expected; do not silently widen exclusions.
4. Inventory `UPLOAD_DIR` by SHA-256 and byte size. Match approved sources by full content hash first. Treat filenames as advisory only.
5. Report filename/version differences when bytes match. Unicode apostrophe and whitespace normalization may help reporting, but must not override a hash mismatch.
6. Stop before repository writes if any required current accepted artifact is absent by hash. Historical superseded files are not blockers when the final accepted version is present.
7. Decode every accepted input and validate:
   - expected raster format;
   - square aspect ratio;
   - sane dimensions and RGB or opaque RGBA color;
   - no corrupt files or unintended transparency.
8. A non-square accepted input is a hard decision point. Do not stretch it. Inspect it and either stop for the human or, if authorized, crop, pad, or regenerate it deliberately. A regenerated replacement receives the next version, is visually QA'd, and is added to the authoritative delivery set before continuing.

Record counts for historical accepted files, current accepted artworks, required matches, allowed exclusions, duplicates, and content-hash-resolved renames.

## Phase 2: understand the repository contract

Read the current repository rather than relying on memory:

1. `CLAUDE.md`, relevant `docs/specs/`, README maintenance notes, and image/data tests.
2. Git status and diff. Preserve all unrelated user changes and untracked files.
3. Canonical record data and the derived-data generator.
4. The existing image directories, sample asset metadata, build behavior, and distribution links/copies.

Current daggerheart-loot image contract, unless repository documentation has changed:

- canonical records live in `data.js`; `data.json`, `catalog.csv`, and `i/*.html` are derived;
- catalog art lives at `img/<asset-id>.webp`, 640x640 RGB;
- social previews live at `og/<asset-id>.jpg`, 640x640 RGB progressive JPEG;
- built `dist/img` and `dist/og` may be links to the root asset directories;
- image-only byte replacement does not require editing `data.js` or rebuilding `data.json`, `catalog.csv`, or `i/*.html` when every existing `img` mapping is unchanged.

Do not regenerate HTML merely because image bytes changed: stable stubs already reference stable asset paths. Rebuild derived files only when canonical data changed, including a deliberate shared-art mapping consolidation.

## Phase 3: map approved art to asset targets

Map through repository data, not through filenames alone.

1. Resolve every approved artwork's represented record IDs against current canonical data.
2. Use each record's actual `img` field as the destination asset filename. Do not assume `record.id + '.webp'`:
   - several records may reference one shared asset;
   - standard equipment tiers may intentionally share base art;
   - one approved artwork may intentionally fan out to multiple existing asset filenames.
3. Require every destination WebP and JPEG counterpart to exist for a replacement-only task.
4. Reject two different approved byte sources mapping to the same destination asset.
5. Reconcile intentional shared-art policy with repository duplicate-byte invariants. If an approved generic tier line is meant to share one image but current records still name separate assets, point the later records at the line's anchor asset, remove only the newly orphaned duplicate pairs, and rebuild derived data/stubs. Do not manufacture byte differences to evade the test.
6. Report separately:
   - accepted artwork count;
   - unique destination asset-pair count;
    - catalog record-link count.

## Phase 4: convert and install

Use repository-documented settings when present. For the current catalog convention:

- apply EXIF orientation, flatten only opaque alpha, and convert to RGB;
- resize square inputs to 640x640 with a high-quality downsampler such as Lanczos;
- encode WebP at quality 85 with maximum practical encoder effort;
- encode JPEG at quality 80, progressive, 4:2:0 subsampling;
- omit source metadata and keep deterministic settings;
- write temporary siblings, decode and verify them, then atomically replace the destinations.

Do not distort aspect ratio, overwrite the approval sources, rename public asset IDs, or touch unrelated catalog art. A local helper may be used for a one-off run, but keep it parameterized and do not commit machine-specific paths. Add a repository script only if ongoing maintenance justifies it and the human requested that scope.

## Phase 5: verify

1. Re-encode every intended destination from its approved source with the same settings and compare exact output bytes to the installed WebP/JPEG files.
2. Decode every changed asset; require WebP/JPEG, RGB, and 640x640.
3. Confirm shared mappings contain identical bytes where policy requires them.
4. Inspect the final git diff and verify that only intended `img/`, `og/`, and explicitly requested workflow documentation changed in this task. Keep pre-existing changes separate in the report.
5. Run focused repository gates first:
   - `node tests/run-all.js dataint,noart`
   - any image/stub checks identified by current docs
6. Before a commit, run `npm run check` as required by `CLAUDE.md`. Because artwork changes what screens draw, also run `npm run check:built`; distinguish failures caused by pre-existing unrelated work.
7. Do not commit unless requested or required by the active task protocol. Never push.

## Optional local reference-cache refresh

Only perform this section when the human asks and a compatible local skill/cache is discoverable. The repository workflow must not depend on it.

1. Read the discovered skill's current instructions and cache builder before mutation.
2. Back up or stage the existing cache if its update is not naturally atomic.
3. Synchronize the repository's current `data.json` and complete `img/` set into the cache using paths discovered in this environment.
4. Run the skill's own index/contact-sheet rebuild command with the current repository commit plus an explicit note that artwork bytes may include uncommitted task changes.
5. Query representative changed IDs and affected subtypes; verify image paths, index counts, and contact sheets.
6. If the skill is unavailable on this machine, report the optional refresh as skipped; do not add absolute fallback paths to repository docs.

## Finish with

- completeness verdict and allowed exclusions
- current accepted artwork, asset-pair, and record-link counts
- hash-resolved filename mismatches
- any regenerated/cropped/padded exception and its approval
- conversion settings and deterministic verification result
- repository files changed versus pre-existing dirty files
- exact commands and results
- optional cache-refresh result
- remaining blocker or next human action
