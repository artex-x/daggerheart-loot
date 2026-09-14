# Handoff - TASK 59

## Status
- Task status: done
- Last agent: implementer
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `main`
- Base / starting commit: `4c61eac5300c7ae88db20221502f7bc8d5c94173`

## Completed
- Batch name/id: B2 - Publish host-aware Claude/Codex routing
- What shipped: Replaced active orchestration routing with the settled
  host-aware policy: Claude retains two Opus and three Sonnet frontmatter
  defaults; Codex dispatches planner/reviewer on Sol and the other named roles
  on Terra at medium effort, with Luna restricted to explicit bounded low-risk
  helpers. Every Codex worker dispatch now requires explicit model,
  reasoning_effort, and non-full-history fork context.
- Files changed: `.claude/prompts/orchestrate.prompt.md`, `.claude/README.md`,
  all five active `.claude/agents/*.md` descriptions, `CLAUDE.md`, and task
  state documents.
- Commit(s): `docs(agents): publish host-aware Codex routing` (hash recorded at
  delivery because this handoff is part of the commit).
- Deviations and rationale: No product files, hooks, runtime settings, or
  historical evidence were changed. The inherited zero-stub explanation now
  includes f93/f94; the `app/src/lib/data.ts` wording remains deferred because
  B2 does not touch product code.

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
- Commands run (B2 exact): `rg -n -i "fable|gpt-6|astra|frontier|strong-high|xhigh|ultra"
  .claude/prompts/orchestrate.prompt.md .claude/README.md .claude/agents
  CLAUDE.md`; `rg -n "gpt-5\\.6-sol|gpt-5\\.6-terra|gpt-5\\.6-luna|reasoning_effort|fork_turns|medium.*default|high.*only escalation"
  .claude/prompts/orchestrate.prompt.md .claude/README.md .claude/agents`;
  frontmatter counts; `CLAUDE.md` line count; `git diff --check`; and status
  audit. No product gate was run because B2 is Markdown-only.
- Results (B2): Negative routing search is clean; the positive search confirms
  Sol -> Terra -> Luna, explicit dispatch fields, and medium/high limits.
  Frontmatter remains two Opus and three Sonnet entries; `CLAUDE.md` is 199
  lines; `git diff --check` passes. Only the B2 documentation/task-state paths
  are modified, alongside the preserved unrelated untracked paths.
- Gates (B2): static routing searches, frontmatter/line counts, diff check, and
  status audit passed; product gates intentionally not applicable.
- Commands run (B1 exact): `node tools/build.js`; `node tests/run-all.js
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
- Name: None - terminal batch complete
- Objective: None.
- In scope: None.
- Out of scope: None.
- Files expected: None.
- Steps: Await a new human request.
- Acceptance criteria: B1 and B2 are complete.
- Verification commands: See B1 and B2 verification above.
- Risks / do-nots: Do not push without explicit human approval.

## Blockers
- None.

## Deferred
- Reviewer nit: `app/src/lib/data.ts` still calls all embedded equipment
  roll-table members; correct its frame wording in a later appropriate batch.
- Resolved in B2: `issues/59/context.md` and `issues/59/plan.md` now explain
  zero stub churn for both equipment and the f93/f94 non-equipment frame
  consumables handled by the generator.
- Resolved in B2: the handoff next-batch fields were already complete for B2;
  the terminal handoff now carries every template field.

## Notes
- Mocks path: none; no new UI or layout.
- Screenshot findings: One 831x485 attachment could not be rendered; no detail
  was inferred from it.
- Cleanup performed / retained artifacts: No cleanup. Retained
  `.claude/settings.local.json`, `issues/tg-preview-refresh/`, and unrelated
  paths untouched.
- Session end partial progress (if any): B2 is complete. No writer or
  background gate is active; B2 remains unpushed pending explicit human
  approval.
