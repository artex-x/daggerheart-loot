# Handoff - TASK persist-7-homebrew
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: planned; waits on the release order: R5, R5b, R11, R3, R4
  and R6 ship before R7
- Last agent: planner (2026-09-25, planning pass 1; revised 2026-09-26
  after the owner's answers, in a worktree)
- NEEDS_HUMAN_CONFIRMATION: no - Q1-Q3 answered and applied (Q3,
  2026-09-26: the source tag is «Хоумбрю» / "Homebrew"; `plan.md` section
  13)
- Branch: the planner's worktree branch, from `da7378cb` (R2's local
  task commit). The build starts from `main` once R2, R5, R3, R4 and R6
  have shipped (roadmap section 9).
- Base / starting commit: not started
- Pushed: no

## Completed
- Batch name/id: none built. Planning: `plan.md` (the reference design,
  three batches, `B7.1` implement-ready), `mocks/b72-homebrew.html`,
  four decision files under `docs/decisions/`, the roadmap's R7 rows and
  the R3/R4/R5/R6/R8/R9 outline amendments (`issues/persistent-storage/
  plan.md` sections 5, 12, 14).
- What shipped: nothing to production.
- Files changed: `issues/persist-7-homebrew/{context,plan,handoff}.md`,
  `issues/persist-7-homebrew/mocks/{mock.css,b72-homebrew.html}`,
  `docs/decisions/2026-09-25-a-homebrew-item-is-stored-as-the-catalog.md`,
  `docs/decisions/2026-09-25-a-homebrew-save-is-a-form-submit-not-the.md`,
  `docs/decisions/2026-09-26-a-homebrew-entry-in-the-owners-lists-is.md`,
  `docs/decisions/2026-09-26-homebrew-is-reached-from-the-account-menu.md`,
  `docs/DECISIONS.md` (generated), `issues/persistent-storage/plan.md`.
- Previous sha (batch diff base): none
- Deviations and rationale: the roadmap's `B7.2` is split into `B7.2`
  (routes, menu entry, editor, search, references, print, delete) and
  `B7.3` (bundle v2) - a second public contract with its own fixtures
  and a migration `B7.2` has none of (`plan.md` section 7). The
  roadmap's R7 row loses `kind` and `art_url` columns and
  `homebrew_shares` (R9's); decision 40's Edge Function moves to R8. The
  2026-09-25 snapshot-on-add and Lists-tab designs were replaced by the
  owner's 2026-09-26 answers before anything shipped; their decision
  files were rewritten, not superseded.
- Review: not run (planning only)

## Verification
- Commands run (exact): `node tools/build.js` (the untracked stubs a
  fresh worktree lacks); `node tools/decisions.js`; `node tests/derived.js`.
- Results: `docs/DECISIONS.md - 121 decisions`; `derived files:
  everything matches`. No check, build gate or database command:
  planning only, no production code.
- Gates: none apply to a planning commit.

## Next batch (implement-ready)
- Name: `B7.1` - schema, port, fake, pure logic
- Objective: everything under the app that homebrew needs - the
  `homebrew_items` table with owner-only RLS and the 50-item limit, the
  reference and frozen-copy rule on `list_entries` (two CHECKs replace
  R2's one), the touch and before-delete triggers, `get_shared_list` and
  `clone_shared_list` re-created for references, `HomebrewRepository` in
  the real adapter and the fake, `lib/homebrew.ts`, the seed's items and
  rows, `cloud.contract.ts` case H - proven by layers 1, 3 and 4, with no
  screen changed.
- In scope: `plan.md` sections 4.1, 4.2, 4.3, 4.5 (pure half and fake),
  4.6, 8.
- Out of scope: any Svelte file, route, dictionary key or spec beyond
  `COVERAGE.md`; art; shares; the bundle; the account menu.
- Files expected: `plan.md` section 8, "Files to create" and "Files to
  edit".
- Steps: `plan.md` section 8, steps 1-12.
- Acceptance criteria: `plan.md` section 8, "Acceptance criteria" (ten
  lines; the last one names the golden check).
- Verification commands: `rtk npm run check` (Bash, timeout 600000);
  `npm run check:db` (PowerShell tool); `npm run e2e` (after the
  migration has reached the test project: `migrate-test` on the branch's
  push in a cloud release, or the owner's `db:push --project test`
  locally); `node tests/app/golden.js --shard=1/4` after `npm run
  build:test` to confirm no golden moves.
- Risks / do-nots: `plan.md` section 8, "Risks and do-nots"; one
  session per local stack and per test project (`CLAUDE.md`).
- Fallback (optional): if a plpgsql `immutable` function in a CHECK is
  refused by the local stack's Postgres, keep the validator as a
  `before insert or update` trigger raising `22023` and record the
  change in the migration's comment and `plan.md` section 4.3.

## Blockers
- Release order: R5, R5b, R11, R3, R4 and R6 ship first (R2 is live).
  The refresh before the build re-reads R5b's account menu component,
  R3's `CapabilityEventsPort` and `lib/live.ts`, R6's `lib/bundle.ts`
  and `import_lists`, and `B2.3`'s `SharedListPage.svelte`/`SharedView`.

## Deferred
- «Сделать своим» from a frozen row (R9's clone).
- A homebrew Trash (decision 30); import beyond create-only.
- Homebrew in the roll tables; sets, crafts, referenced cards, rarity on
  a homebrew record; a homebrew filter chip on the search page.

## Notes
- Mocks path: `issues/persist-7-homebrew/mocks/b72-homebrew.html`
  (frames: A the page `#/homebrew as gm1`, B the editor for the seed's
  weapon with the card preview and the "in 1 list" line, C the search
  page with both groups, D the account menu with «Мои предметы» and the
  signed-out page, E the delete warning, F a frozen row in `gm2`'s list
  after "Save a copy"). `mock.css` is R2's copy of the tokens and
  component rules, unchanged.
- Screenshot findings: no issue screenshots exist (no GitHub issue). The
  mocks compose existing screens (`b22-lists-index.html`,
  `b23-share.html`, the search page, the record card, the header's
  account control).
- Cleanup performed / retained artifacts: none.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): the
  four decision files above; `issues/persistent-storage/plan.md` section
  5 (R7, R8 and R9 rows), section 12 (`B7.1`-`B7.3` rows), section 14
  (the R7 outline; the R8 and R9 outlines), section 16 (decision 40
  moved to R8).
