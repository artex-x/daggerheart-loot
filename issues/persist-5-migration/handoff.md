# Handoff - TASK persist-5-migration
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: planned; R2 is live (2026-09-26), so the refresh of
  `plan.md` section 13 is next, then `B5.1`
- Last agent: planner (2026-09-26, planning pass 2 - the owner's answers of
  2026-09-26 applied: the automatic move, delete kept after the cutoff, the
  account menu with display settings, the Lists tab gone at the cutoff)
- NEEDS_HUMAN_CONFIRMATION: no (owner, 2026-09-26: the account menu ships
  as release R5b `persist-5b-account-menu` right after R5; R5 keeps `B5.1`
  and `B5.2`)
- Branch: `main`. The plan was made on the worktree branch
  `worktree-agent-ab6237f88fb7735f1` and brought onto `main` by the docs
  commit that integrated the plans made ahead; the release runs on `main`
  (a local release: one commit, amended per batch)
- Base / starting commit: `main` after that docs commit (R2 live at
  `8ebf03ea`)
- Pushed: no

## Completed
- Batch name/id: planning passes 1 and 2 (no production code)
- What shipped: `plan.md` (design, `B5.1`/`B5.2`/`B5.3` implement-ready,
  gates, schedule, the question), this file, `context.md` refreshed, four
  mocks under `mocks/`, four decision files under `docs/decisions/` with
  the index rebuilt, the roadmap's R5 rows and outline
  (`issues/persistent-storage/plan.md` sections 9, 12, 14, 17)
- Files changed: `issues/persist-5-migration/{plan,handoff,context}.md`,
  `issues/persist-5-migration/mocks/{mock.css,b52-move-notice.html,b52-read-only-list.html,b52-retired-link.html,b53-account-menu.html}`,
  `docs/decisions/2026-09-26-*.md` (four),
  `docs/decisions/2026-09-24-the-browser-suites-drive-a-test-build-with.md`
  (the mirror line), `docs/DECISIONS.md`, `issues/persistent-storage/plan.md`
- Previous sha (batch diff base): `da7378cb`
- Deviations and rationale: the task brief's "canonical-JSON SHA-256
  fingerprint" is computed by the database inside the RPC, not by the
  client (`plan.md` 4.2: no digest port, atomic and idempotent by
  construction). The brief's "remove the two-tab merge with the local write
  path" is read as the post-date behaviour (4.6): the code goes in R10,
  because the merge protects two tabs for the two weeks the lists stay
  editable after R5 deploys. Pass 2: the move is automatic (owner),
  with the notice and the first-account guard; the account menu is planned
  as `B5.3` and recommended as release R5b so R5's 2026-10-12 date holds.
- Review: not required (planning only; no trigger fired)

## Verification
- Commands run (exact): `node tools/build.js` (the worktree lacked the
  generated `i/`, `pages/`, `en/index.html`); `node tools/decisions.js`;
  `node tests/derived.js`
- Results: the index rebuilt (121 decisions); `derived files: everything
  matches`
- Gates: other (planning files only; no `npm run check` needed - no code
  changed)

## Next batch (implement-ready)
- Name: `B5.1` - schema and RPC (`plan.md` section 8), after the section 13
  refresh
- Objective: `lists.legacy_fingerprint` with its check, the partial unique
  index `(owner_id, legacy_fingerprint)`, the two limit triggers re-created
  with the `dhloot.move` exemption, `move_legacy_list(uuid, text)`, the
  layer 3 matrix and the reversal
- In scope: one migration, one reversal, `tests/db/legacy-move.test.mjs`,
  the EXECUTE matrix line in `tests/db/lists.test.mjs`, `COVERAGE.md`
  "Suites"
- Out of scope: everything under `app/`, `tests/app/`, `tests/e2e/`
- Files expected: `supabase/migrations/<stamp>_legacy_move.sql`,
  `supabase/reversals/<stamp>_legacy_move.sql`,
  `tests/db/legacy-move.test.mjs`, `tests/db/lists.test.mjs`,
  `docs/specs/COVERAGE.md`
- Steps: `plan.md` section 8, steps 1-6 (the stamp after the newest file;
  the migration in the order given; the reversal with R2's trigger bodies;
  the test cases listed; `check:db` through PowerShell then `rtk npm run
  check`; `db:push --project test` or leave it to CI)
- Acceptance criteria: `plan.md` section 8 - `check:db` and `check` green;
  the exemption proven both ways; idempotence per owner; `COVERAGE.md`
  names the file
- Verification commands: `npm run check:db` (PowerShell tool); `rtk npm run
  check` (Bash, timeout 600000)
- Risks / do-nots: no `create or replace`; `lists_before_update` untouched;
  no grant to `anon`; the `limit: <key>` message prefix unchanged
- Fallback (optional): none

## Blockers
- None. The section 13 refresh reads R2's final tree before `B5.1`; it also
  copies section 9b into `issues/persist-5b-account-menu/` (R5b).

## Deferred
- To R10: the codec, `mergeLists`, the pre-date `ListStore` writers, the
  browser group, `StorageNotice`, the pinned test clock, the `tab` of
  `#/lists` in `routes.json` (`plan.md` section 15).
- To R5b `persist-5b-account-menu`: `B5.3` (`plan.md` section 9b).
- To R7: «Мои предметы» in the account menu.
- Not planned: a per-list move; a "not now".

## Notes
- Mocks path: `issues/persist-5-migration/mocks/` (`b52-move-notice.html`
  the one-time notice under the header, the quiet status forms on
  `#/lists`, the signed-out notice before and after the date, the foreign
  case; `b52-read-only-list.html` a browser list after the date beside
  today's; `b52-retired-link.html` the `#/l/` page after the date;
  `b53-account-menu.html` the account menu open, the Display section of
  `#/account`, the nine-tab bar after the date), on `mock.css` (R2's sheet
  plus the `.move*`, `.ro`, `.acctmenu` rules; open from disk)
- Screenshot findings: none (no issue; the mocks are composed from the
  current components)
- Cleanup performed / retained artifacts: none
- Session end partial progress (if any): none
- Durable items written to their homes this batch: `docs/decisions/`
  (four files, section 11 of `plan.md`), `docs/DECISIONS.md` (rebuilt),
  `issues/persistent-storage/plan.md` (R5's rows; section 17's preferences
  page superseded)
