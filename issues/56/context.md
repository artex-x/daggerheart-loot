# Shared task context - TASK 56

## Goal
- Verify every starting and other non-standard inventory item against the Core and Hope & Fear rulebooks, correct any hallucinated or incomplete issue text, cross-check Russian terminology against daggerheart.su, and add the verified items to the site as non-rollable content.
- Preserve source tags: Core, Hope & Fear, and frame-specific placement. A separate "Other" surface is acceptable; class-specific presentation should remain useful even though the books provide descriptions rather than item names.

## GitHub issue (if any)
- URL: https://github.com/artex-x/daggerheart-loot/issues/56
- Captured or last verified: 2026-09-15
- Title: Add starting items
- State: open
- Summary (facts only): The issue proposes 35 records: 3 standard starting inventory items, 26 class-specific choices for 13 Core/Hope & Fear classes, 2 spell-carrier concepts, and 4 campaign-frame entries (one Beast Feast and three Motherboard).
- Decisions already settled: Proposed issue prose is draft evidence only; the PDFs are authoritative. Records must not be rollable. Russian copy should follow daggerheart.su where available.
- Open questions: Exact authoritative inventory, whether spell carriers and Scrap Pockets are inventory records, best record naming for class choices, and the smallest existing-compatible UI grouping all require source/repository analysis by the add-source worker.

## Screenshot / attachment findings
- Core PDF present: `C:\Users\Ignat\Downloads\Daggerheart Core Set (Spenser Starke, Rowan Hall, Matthew Mercer) (z-library.sk, 1lib.sk, z-lib.sk).pdf` (254,739,264 bytes).
- Hope & Fear PDF present: `C:\Users\Ignat\Downloads\Telegram Desktop\Daggerheart_Hope_and_Fear.pdf` (56,922,120 bytes).
- Image folder present: `C:\Users\Ignat\Downloads\Starting items` with 35 PNG files.
- Image names map one-to-one to the issue draft's 35 proposed records: 3 common, 26 class-choice, 2 spell-carrier, and 4 frame-specific images. Image presence does not prove source validity.

## Key paths
- Specs: `docs/specs/CONTRACTS.md`, `docs/specs/FEATURES.md`, `docs/specs/ROUTES.md`, `docs/specs/I18N.md`, `docs/specs/COVERAGE.md`
- Canonical data: `data.js`; derived outputs: `data.json`, `catalog.csv`, `i/*.html`
- UI hot paths: `app.js`, `app/`
- Build/tests: `tools/build.js`, `tests/`
- Task state: `issues/56/context.md` and `issues/56/handoff.md`

## Command costs

| Command | Wall clock | Fits one call? |
|---|---|---|
| `npm run check` | a few minutes (repository standing estimate) | yes, 600 s foreground cap |
| `npm run check:built` | a few minutes (repository standing estimate) | yes, 600 s foreground cap |
| `node tests/parity.js "<filter>"` | filter-dependent; tables about 9 min | barely for tables |
| `node tests/run-all.js parity` | about 867 s on CI | no |

## Measuring the live app against the rewrite
- Use `node tools/probe.mjs <route> <selector>` rather than creating a new probe.

## Which machine is authoritative
- For recorded numbers (parity debt, timings): CI unless a spec says otherwise.
- What a difference on another machine means: local parity results are advisory.

## Reasons already disproved
- The 35 supplied image filenames are not evidence that all 35 proposed entries are authoritative; book text must be checked.

## Constraints
- Preserve stable shipped ids and existing public contracts unless the source genuinely requires an extension.
- Only one writer may own the working tree at a time.
- `data.js` is canonical; generated outputs must come from `node tools/build.js`.
- Starting/non-standard records must be discoverable but non-rollable.
- Prefer explicit source/category metadata over inventing mechanics.
- Use the daggerheart.su terminology conventions, while flagging site inconsistencies rather than copying them silently.
- The tree began clean except for unrelated untracked `.claude/settings.local.json` and `issues/tg-preview-refresh/`; preserve both.
- Start state: branch `main`, HEAD `99bbb7c`, matching `origin/main` at preflight.

## 2026-09-15 continuation
- The human's latest instruction, "proceed with it, authorize," authorizes a bounded investigation and fix of the two remaining full-gate UI test failures. The required `npm run check` gate remains in force; no waiver was requested.
- Human explicitly authorized one additional narrow remediation cycle for the existing images and pointed to the separate image-addition workflow and prior Daggerheart Images work.
- Current HEAD remains `99bbb7c` on `main`; task ingest files remain uncommitted. `README.md` reports 846 images while `README.ru.md` reports 876.
- Relevant repository art instructions: `.claude/prompts/refresh-artwork.prompt.md` (640x640 RGB WebP/JPEG settings and deterministic validation) and `.claude/prompts/add-source.prompt.md` (new-record art pairing). Earlier task notes in `.claude/README.md` mention `issues/dh-image-polish/refresh_artwork.py`; use prior work as workflow evidence only, preserving its sources.
- No permission to waive a failing `npm run check` commit gate has been given. If the full gate remains red, keep the batch uncommitted and report the blocker.
- Human-authorized remediation result: all 30 accepted source PNGs map to 30 new starting records; 60 installed WebP/JPEG assets decode at 640x640 and matched fresh deterministic re-encodes. Focused data checks passed. `npm run check` exited 1 with search-page timeout and table flash failures (40/42 files, 1018/1020 tests green). A retry of `npm run check:built` after Chrome/profile contention cleared passed build, file-URL smoke, and budget. Reviewer approved the artwork and noted local accepted-manifest portability/hash nits; see handoff.

## Do not re-fetch unless
- Human provides new information.
- A source fact is missing from this context.
- GitHub issue 56 changes after 2026-09-15.
- daggerheart.su content is needed for a specific missing translation.
