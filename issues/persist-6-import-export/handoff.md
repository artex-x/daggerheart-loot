# Handoff - TASK persist-6-import-export
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: planned; R2 is live, so the refresh of `plan.md` section 8
  ("Refresh before the build") runs before `B6.1`
- Last agent: planner (2026-09-25/26, planning pass 1)
- NEEDS_HUMAN_CONFIRMATION: no - the owner answered Q1-Q4 as recommended
  on 2026-09-26 (`plan.md` section 11)
- Branch: `main` (planned on `worktree-agent-a7cedf410497c36ee`, brought
  onto `main` by the docs commit that integrated the plans made ahead; the
  release builds on `main` or in the cloud, roadmap section 9)
- Base / starting commit: `da7378cb` (R2's local task commit, fast-forwarded
  from `cd1b3b15`)
- Pushed: no

## Completed
- Batch name/id: planning pass 1 (no production code)
- What shipped: `plan.md` (design sections 4.1-4.9, batches `B6.1` and
  `B6.2`, gates and cost, owner questions), this file, the mock
  `mocks/b62-export-import.html` + `mocks/mock.css`, three decision files
  under `docs/decisions/` (index rebuilt), the roadmap's R6 rows and
  outline (`issues/persistent-storage/plan.md` sections 5, 9, 12, 14),
  `context.md` refreshed with the key paths and costs.
- Files changed: `issues/persist-6-import-export/{plan.md,handoff.md,
  context.md,mocks/mock.css,mocks/b62-export-import.html}`,
  `docs/decisions/2026-09-26-*.md` (3), `docs/DECISIONS.md`,
  `issues/persistent-storage/plan.md`.
- Previous sha (batch diff base): `da7378cb`.
- Deviations and rationale: `B6.1` splits into `B6.1` (contract, pure
  module, port, RPC) and `B6.2` (UI) - the criteria are in `plan.md`
  section 7 (a public-contract change; SQL apart from Svelte; the states
  need the fake's `import`). Decision file 2 was "proposed" until the
  owner's Q1 answer (2026-09-26), which removed the word.
- Review: not required (planning pass).

## Verification
- Commands run (exact): `node tools/decisions.js` (index rebuilt),
  `node tests/derived.js` (green).
- Results: see the planner's report; no product gate applies to a planning
  pass.
- Gates: none (no code).

## Next batch (implement-ready)
- Name: `B6.1` - the contract and the database
- Objective: publish `import-v1` (`schema/import-v1.json`, fixtures,
  `tests/contracts.js`, `llms.txt`, `CONTRACTS.md`, the published-file
  lists), the pure module `lib/bundle.ts`, `ListRepository.import` on the
  real adapter, the lazy port and the fake, the `import_lists` migration
  with its reversal and layer 3 tests, contract case H and the real-only
  atomicity check.
- In scope: `plan.md` section 8 (steps 1-10) and sections 4.1-4.5, 4.9.
- Out of scope: every component, `dict.ts`, `help.ts`, the driver, states,
  goldens (`B6.2`).
- Files expected: `plan.md` section 8, "Files expected".
- Steps: `plan.md` section 8, steps 1-10; first the 15-minute refresh
  named there (after R2 closes: `llms.txt` as `B2.3` left it, the port and
  the fake as `B2.3` left them, the migration timestamp, the owner's
  answers).
- Acceptance criteria: `plan.md` section 8, "Acceptance criteria".
- Verification commands: `rtk npm run check` (Bash, timeout 600000);
  `npm run check:db` (PowerShell tool); `npm run check:built`; the test
  project's migration through `migrate-test` (the orchestrator's step, no
  value printed); `npm run e2e`.
- Risks / do-nots: `plan.md` section 8, "Risks / do-nots".
- Fallback (optional): `plan.md` section 8, "Fallback" (the hosted request
  body limit).

## Blockers
- The refresh in section 8 before `B6.1` starts: `B2.3` (now live)
  edited `llms.txt`, `ListPage.svelte`, `ListRepository` and the fake.
- R5 ships before R6 (roadmap section 9); `B6.2`'s refresh reads
  `ListsPage.svelte` after it.

## Deferred
- Bundle v2 with homebrew entries (R7; the seam is `plan.md` section 4.8).
- The hosted request-body limit for a large import: measure in `B6.2` if
  the 5 MiB bound is ever reached; record in `.claude/README.md`.
- A JSON-Schema runtime validator: not unless the hand-written one drifts
  twice (the drift guard is in `bundle.test.ts`).

## Notes
- Mocks path: `issues/persist-6-import-export/mocks/b62-export-import.html`
  (frames A export panel, B import preview, C refused file, D account
  panel, E list page button) over `mocks/mock.css`. Open from disk; the
  preview pane shows local files without their stylesheet.
- Screenshot findings: no issue screenshots (a local task). The mock is
  composed from the shipped index, account page and list page as `B2.2`
  built them and `B2.3`'s «Поделиться» as it stands in the main tree.
  The design hook's low-contrast flag reads the app's `--muted2` on the
  wash (as for R2's mocks); left standing.
- Cleanup performed / retained artifacts: none.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section):
  `docs/decisions/` three files (section 10 of the plan);
  `docs/DECISIONS.md` (rebuilt); `issues/persistent-storage/plan.md`
  sections 5 (R6 row), 9 (R6 batches), 12 (`B6.1`/`B6.2` rows), 14 (the
  R6 outline).
