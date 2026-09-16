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

If no authoritative approval source exists, or it is impossible to distinguish accepted files from rejected attempts, stop. A directory full of images is not by itself an acceptance ledger. The one exception: a drop with exactly one file per item and a `v<N>` suffix that is provenance rather than a choice **is** an unambiguous ledger - see `docs/artwork.md`, "The drop-is-the-ledger precondition", for the three checks that make it true before relying on it.

Use symbolic paths in task documents and reusable instructions. Absolute paths may appear in a one-session handoff as observed environment facts, but never bake them into agents, prompts, repository scripts, or durable generic instructions.

## Phase 1: prove the delivery set

1. Read the complete current approval/handoff state. Do not load historical archives unless a current record is ambiguous.
2. Establish the current accepted artwork set:
   - explicit `accepted_version` or equivalent state beats directory naming;
   - when a later approved refresh supersedes an earlier approved file, select the later approved artifact;
   - never choose the highest version found in an arbitrary staging directory, because rejected attempts may have higher numbers;
   - retain the relationship from artwork to every represented catalog record.
3. Apply `ALLOWED_EXCLUSIONS` exactly. Missing excluded collections are expected; do not silently widen exclusions.
4. Inventory `UPLOAD_DIR` with `node tools/artwork/run.mjs plan --uploads <dir> --report <f>` (`docs/artwork.md`), which hashes and byte-sizes every file. Match approved sources against `APPROVED_SOURCE` by full content hash first; treat filenames as advisory only.
5. Report filename/version differences when bytes match. Unicode apostrophe and whitespace normalization may help reporting, but must not override a hash mismatch.
6. Stop before repository writes if any required current accepted artifact is absent by hash. Historical superseded files are not blockers when the final accepted version is present.
7. `node tools/artwork/run.mjs install --uploads <dir> --dry-run` decodes and
   validates every accepted input the same way before writing anything -
   raster format, square aspect ratio, opaque alpha only, no corruption. Do
   not hand-validate; read its refusals instead.
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
- catalog art lives at `img/<asset-id>.webp`; social previews live at `og/<asset-id>.jpg` - dimensions and encoding are `tools/artwork/`'s documented defaults, see `docs/artwork.md`;
- built `dist/img` and `dist/og` may be links to the root asset directories;
- image-only byte replacement does not require editing `data.js` or rebuilding `data.json`, `catalog.csv`, or `i/*.html` when every existing `img` mapping is unchanged.

Do not regenerate HTML merely because image bytes changed: stable stubs already reference stable asset paths. Rebuild derived files only when canonical data changed, including a deliberate shared-art mapping consolidation.

## Phase 3: map approved art to asset targets

Map through repository data, not through filenames alone. `node tools/artwork/run.mjs plan` (`docs/artwork.md`) does this mechanically: it resolves each approved artwork's record by name (never assuming `record.id + '.webp'` - the destination is the record's actual `img` field, and several records may share one asset), requires every destination WebP/JPEG counterpart to already exist, rejects two sources mapping to one destination, and prints the accepted-artwork, asset-pair, and record-link counts to report. Read its output rather than deriving the mapping by hand.

The one judgment call the tool cannot make: reconciling intentional shared-art policy with the repository's duplicate-byte invariant. If an approved generic tier line is meant to share one image but current records still name separate assets, point the later records at the line's anchor asset in `data.js`, remove only the newly orphaned duplicate pairs, and rebuild derived data/stubs. Do not manufacture byte differences to evade the test.

## Phase 4: convert and install

Run `node tools/artwork/run.mjs install --uploads <drop> --report install.json`
(one-time setup: `cd tools/artwork && npm ci`). It applies the repository's
documented conversion settings and encoder (`docs/artwork.md`, "Conversion
settings" - not restated here) and refuses, writing nothing, if a name is
ambiguous, two sources collide on one asset, two sources share bytes, an
input is non-square, an input carries non-opaque alpha, or a destination
does not already exist. It writes temporary siblings, decodes and verifies
them, then atomically replaces the destinations, and re-encodes from the
source a second time to confirm what it wrote. `--dry-run` runs every check
without writing. Do not hand-convert, hand-install, or write a one-off local
helper; the tool is what "ongoing maintenance" already justified.

Do not distort aspect ratio, overwrite the approval sources, rename public asset IDs, or touch unrelated catalog art.

## Phase 5: verify

1. `node tools/artwork/run.mjs verify --uploads <drop>` re-encodes every
   source and compares it byte-for-byte against what is installed,
   decode-checking format/size on the installed file too - scoped to the
   pairs this drop resolves to, never the whole `img/` tree (`docs/artwork.md`,
   "Determinism is per-run"). Confirm shared mappings resolve to the one
   asset policy intends; the tool's `sharedWith` report is the source of
   truth for that, not a byte comparison across records.
2. When a before/after `--stale-list` pair exists, run
   `node tools/artwork/run.mjs verify-previews --before before.json --after after.json --report install.json`
   (`docs/artwork.md` has the exact two-`--stale-list`-runs sequence).
3. Inspect the final git diff and verify that only intended `img/`, `og/`, and explicitly requested workflow documentation changed in this task. Keep pre-existing changes separate in the report.
4. Run focused repository gates first:
   - `node tests/run-all.js dataint,noart`
   - any image/stub checks identified by current docs
5. Before a commit, run `npm run check` as required by `CLAUDE.md`. Because artwork changes what screens draw, also run `npm run check:built`; distinguish failures caused by pre-existing unrelated work.
6. Do not commit unless requested or required by the active task protocol. When you do commit, push the branch; never force-push.

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
- update `<TASK_DIR>/context.md` / `handoff.md` when durable recovery notes are useful
