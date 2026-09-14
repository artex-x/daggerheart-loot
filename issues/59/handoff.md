# Handoff - TASK 59

## Status
- Task status: in_progress
- Last agent: implementer
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `main`
- Base / starting commit: `4c61eac5300c7ae88db20221502f7bc8d5c94173`

## Completed
- Batch name/id: B1 - Correct frame rolls and enforce pool invariants
- What shipped: Removed exactly 94 artificial frame `roll` properties; made
  frame source routing win before generic roll-less equipment in both apps;
  added real and legacy roll-pool membership, positive-integer, uniqueness,
  and coverage checks; updated the f1 built golden and optional-roll wording.
  The second review remediation made all mutation row access strict-TypeScript
  safe while retaining standalone-equipment membership coverage.
  The share-page generator retains existing frame preview ordinals for the two
  non-equipment frame consumables, so no `i/f*.html` files drift.
- Files changed: canonical/generated data, both route helpers and their tests,
  real and legacy data checks, f1 golden, generator, READMEs, `FEATURES.md`,
  and task documents.
- Commit(s): one local, unpushed, amendable B1 commit; it was
  `c30e036d4ad22353e4e9a056cbb5447eaa971127` when this second remediation
  started, so that pre-amend hash is evidence rather than a final identifier.
- Deviations and rationale: `tools/build-share-pages.js` additionally changed
  because regeneration otherwise made f93/f94 stubs render an undefined roll.

## Verification
- Commands run (exact): `node tools/build.js`; `node tests/run-all.js
  dataint,derived`; `npx vitest run app/src/lib/data.test.ts
  app/src/lib/label.test.ts --coverage=false`; `npm run build`; `node
  tests/app/golden.js "--only=#/i/f1" --update`; `node tests/app/golden.js
  "--only=#/i/f1"`; `npm run check`; `npm run check:built`; `git diff --check`.
- Results: generator output has 94 blank frame CSV roll cells and zero
  `i/f*.html` diff; focused legacy and Vitest suites pass (53 Vitest tests);
  both f1 golden passes succeed. The final direct foreground `npm run check`
  completed successfully after the strict-TypeScript correction; direct
  `svelte-check` also reported 0 errors and 0 warnings.
- Gates: final correction passed focused Vitest, `dataint,derived`, direct
  `npm run check`, strict typecheck, and `git diff --check`.
- Independent final review verdict: approved, with no remaining findings.
  Its verification recorded `npm run check` with 0 errors/warnings across 42
  files and 1,020 tests, focused Vitest with 53 tests, `dataint,derived`, and
  `git diff --check`.

## Next batch (implement-ready)
- Name: B2 - Publish host-aware Claude/Codex routing
- Objective: Replace the settled active orchestration documentation after the
  approved B1 review.
- In scope: only the B2 files listed in `plan.md`. Out of scope: B1 product
  code/data, generated artifacts, and unrelated paths.
- Acceptance criteria: apply section 4.2's Sol -> Terra -> Luna policy without
  changing Claude frontmatter or product behavior.
- Verification commands: scoped `rg` checks, `git diff --check`, exact
  frontmatter/line counts, and status audit.
- Risks / do-nots: do not alter historical evidence, hooks, runtime settings,
  or B1 production files.

## Blockers
- None.

## Deferred
- Reviewer nit: `app/src/lib/data.ts` still calls all embedded equipment
  roll-table members; correct its frame wording in a later appropriate batch.
- Reviewer nit: `issues/59/context.md` and `issues/59/plan.md` still explain
  zero stub churn as equipment-only, omitting the two non-equipment frame
  consumables handled by the generator.
- Reviewer nit: the pre-review handoff's next-batch fields were incomplete;
  they are now completed for B2, but keep task-state template fidelity under
  review in subsequent batches.

## Notes
- Mocks path: none; no new UI or layout.
- Screenshot findings: One 831x485 attachment could not be rendered; no detail
  was inferred from it.
- Cleanup performed / retained artifacts: No cleanup. Retained
  `.claude/settings.local.json`, `issues/tg-preview-refresh/`, and unrelated
  paths untouched.
- Session end partial progress (if any): B1 review is approved and B2 is the
  active next batch. No writer or background gate is active.
