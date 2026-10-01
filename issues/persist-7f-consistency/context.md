# Shared task context - TASK persist-7f-consistency

Orchestrator (or first worker) maintains this file so later steps do not re-fetch the same sources.

## Goal
- R7f: one release of consistency fixes on the signed-in pages, from a
  read-only audit of 2026-10-01 (15 findings). The owner placed it right
  after R7e `persist-7e-list-quick-item` and before R7d
  `persist-7d-homebrew-files`.
- In scope (owner, 2026-10-01): findings 1-9, 11, 12, 14, 15. Excluded:
  #10 (keep batch-only delete for homebrew rows, as the spec says) and #13
  (share naming, left to R10, which deletes the browser share buttons and
  checks that only «Ссылка для игроков» / «Ссылка для мастера» remain).
- After R7f ships, `persist-review` re-runs a UI consistency pass over the
  persistence surfaces with this directory and its audit as the baseline
  (owner, 2026-10-01; `issues/persistent-storage/plan.md` section 9).

## GitHub issue (if any)
- URL: none (a local task id; the owner's answers came through the
  orchestrator, 2026-10-01).
- Captured or last verified: 2026-10-01.
- Summary (facts only): the audit report
  `issues/persist-7e-list-quick-item/consistency-audit.md` (R7e's directory;
  it moves here at R7e's closeout at the latest - R7e's handoff says so).
  `plan.md` section 2 restates every finding R7f fixes, so this plan does
  not depend on that file.
- Decisions already settled: the owner's answers below.
- Open questions: none (`F1`, `F2` answered, "Owner answers (2026-10-01)" below).

## Owner answers on the consistency audit (2026-10-01)
- Placement: a separate consistency release right after R7e (working id
  `persist-7f-consistency`); R7e keeps only its own two changes.
- #1: the owner's example - «Мои предметы: 3 из 100» on `#/homebrew`, no
  counter on «Мои списки» (`#/lists`); a lists counter is in scope, and its
  limit read must be checked against `my_limit()`.
- #9: one create verb everywhere; the Sources panel stays above the items
  on «Мои предметы» (no move of «Новый предмет»).
- #10: keep batch-only delete for homebrew rows (excluded).
- #13: left to R10 (excluded here; an acceptance line in R10's `B10.1`).

## Key paths
- Pages: `app/src/components/{ListsPage,ListPage,HomebrewPage,HomebrewSources,HomebrewEditor,RecordPage,TablesPage,SharePanel,AccountPage,AccountMenu,QuickItem,ImportPanel,HomebrewLoad,PageHead,PageTitle}.svelte`.
- Strings: `app/src/lib/dict.ts` (RU first block, EN second block).
- Limits: `my_limit(p_key text)` (migration `20260930130000_homebrew.sql`:
  plpgsql, stable, SECURITY DEFINER, EXECUTE for `authenticated` only,
  raises 28000 signed out and 22023 for an unknown key) answers
  `effective_limit(auth.uid(), key)` for any key in `limit_defaults`:
  `lists_per_owner` 50, `entries_per_list` 100, `homebrew_books_per_owner`
  20, `homebrew_items_per_owner` 100 (and `request_lines`,
  `pending_requests_per_list`). Today only the homebrew load calls it
  (`ports/supabase.ts`, `homebrew.load`, `itemLimit`). `ListRepository.list()`
  answers `{ ok: true; lists }` with no limit. The fake has `maxLists`,
  `maxEntries`, `maxBooks`, `maxItems` (`FakeCloudOptions.limits`). The
  sections bound 30 is a validator constant (`SECTIONS_MAX` in
  `lib/homebrew.ts`), not a limit row.
- Load states: `HomebrewLoad.svelte` (items only: `hbLoadFailed`, a
  default-size «Повторить», `role=alert`/`status`), used by `HomebrewPage`,
  `HomebrewEditor`, `RecordPage`, `TablesPage`; `ListsPage` (a
  `p.grouptext.err` and a small retry, no roles), `SharePanel` (`p.state`,
  small retry), `AccountPage` (`p.err role=alert`, small retry),
  `ListPage` (a failed account read draws «Список не найден» with
  `cloudLoadFailed`), `SharedListPage` («Список не загрузился»,
  `sharedFailed`, primary retry).
- Specs that quote the strings: `docs/specs/FEATURES.md` (the audit's line
  references: 243, 247, 255, 503, 509, 524, 531, 565, 568, 570, 930, 952,
  955, 1005, 1028, 1032, 1306 at the audit's time; re-find by text).
- Tests: `components/{listsPage,listPage,homebrewPage,homebrewEditor,quickItem,shell,a11y,accountPage}.test.ts`,
  `lib/help.test.ts`, `state/app.test.ts`, `ports/cloud.contract.ts` (cases
  G lists and M homebrew), `tests/e2e/flows.mjs` F14 (presses «Добавить»
  and «Добавить раздел», which this release renames), `tests/app/inventory.js`.

## Command costs
As in `issues/persist-7c-homebrew-relations/context.md`, "Command costs";
a golden shard about 3.2 min, four shards 13 min, compare then re-seed
26 min.

## Constraints
- Every changed text has RU and EN; product text uses ASCII punctuation
  (`-`, not an em dash), «ёлочки» stay in Russian.
- R7c and R7e add strings before R7f runs (card and set confirms, card
  create toasts, the add row); the refresh before dispatch applies each
  rule to them too.

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
- You suspect drift vs issue or plan

## Owner answers (2026-10-01)
- F1: «Мои списки» everywhere - the `#/lists` page heading becomes «Мои
  списки», pairing with «Мои предметы»; the tab and pin label keep
  «Списки» until the cutoff.
- F2: keep both labels and write the rule - «Отмена» discards what was
  typed; «Закрыть» folds a panel and keeps it. A control that breaks the
  rule is fixed in `B7f.1`.
