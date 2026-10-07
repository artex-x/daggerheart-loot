# Shared task context - TASK persist-9-item-share

## Goal
- Release R9 of the persistence programme, refreshed 2026-10-07 against R7h
  (`issues/persist-7h-homebrew-page/plan.md` at `ac23ce36`): the print
  routes of another account's homebrew items (`#/print/s/<token>/<ids>`,
  `#/print/h/<uuid>`, D70), the print page's wait and load states, «Печать»
  for a reader on `#/h/`, the item page's announcements, its 45 s re-read
  and «Обновлено N назад» (owner, 2026-10-07), `#/s/`'s first-read line and
  D65. Ships after R7h and before R8 (owner, 2026-10-02 and R1
  2026-10-03).
- Dispatch of 2026-10-07 (orchestrator): refresh the plan so the owner
  reviews mocks and answers questions before implementers start. No
  production code.

## GitHub issue (if any)
- None. Local task id; the roadmap is `issues/persistent-storage/plan.md`
  (section 5 row R9, sections 9, 12 and 14 `B9.1`); those rows still
  describe the 2026-10-02 design (the orchestrator updates them at
  closeout).
- Decisions already settled (owner):
  - R9 is not cancelled; its plan is input, and a refresh at dispatch
    decides what is still needed (R1, 2026-10-03).
  - R7h W1 (2026-10-03): anyone with an item's id opens it at `#/h/<uuid>`,
    signed out too (W1-a); «Добавить в список» adds a live link and
    «Сохранить себе» makes the reader's own fixed copy (W1-b); no separate
    share links per item, no snapshots.
  - Q9-1 A, Q9-3 A (2026-10-02): where «Сохранить себе» is offered and what
    the copy keeps - now built by R7h B7h.4.
  - Q9-2 A (2026-10-02): `#/print/s/<token>/<ids>` written only for a
    selection that holds a homebrew entry, and a one-item print route;
    `#/print/list/<id>` dropped. R7h section 6 names the item route
    `#/print/h/<uuid>`.
  - Q9-5 (2026-10-02): R9 pays D65.
  - Owner, 2026-10-07 (chat): Q9-6 A (no revocable link, no share panel);
    Q9-7 B (re-read `#/h/` every 45 s); Q9-8 B («Обновлено N назад» on
    `#/h/`, `updated_at` in `get_homebrew_item`'s answer - a migration,
    routed by the orchestrator, `plan.md` 3.9); Q9-9 A (the seven
    «Сохранить себе» details go to R7h B7h.4; R9 builds only what B7h.4
    ships without); Q9-10 A (the two link-scoped print routes) and a later
    release "print snapshots": "I feel like we need to do some snapshoting
    for prints to avoid limitations on URL length and amount of items there
    and make sharable link more concise, but we can do it in a separate
    release".
  - 3x the default limits is the scale target (decision 2026-10-01).
- Open questions: none for the owner. For the orchestrator: where the
  `updated_at` migration is built (`plan.md` 3.9; recommended R7h B7h.3).

## Screenshot / attachment findings
- No issue screenshots. Mocks: `mocks/index.html` - m37-m39 (this refresh),
  m30-m36 (the 2026-10-02 design, superseded, kept for the record).
- R7h's m03 (`issues/persist-7h-homebrew-page/mocks/`) is the base of `#/h/`.

## Key paths
- Specs: `docs/specs/FEATURES.md` ("Print", "Account and browser lists",
  "Consistency rules" 1-16), `ROUTES.md` ("Records, lists and print"),
  `CONTRACTS.md` section 1, `DEBT.md` D65 ("A live revoke on the shared
  page") and D70, D71 ("Item links").
- Code: `app/src/lib/hash.ts` (`parseHash`, `readPrint`, `printHash`),
  `state/app.svelte.ts` (`recordFor`, `knows`, `frozenCopy`,
  `requestToken`, `#pollLists`, `route`), `App.svelte` (the print branch),
  `components/PrintPage.svelte`, `PickRow.svelte` (a card's «Печать»),
  `SelBar.svelte`, `SharedListPage.svelte` (the `.said` region, the empty
  first-read branch), `LoadState.svelte`, `state/sharedView.svelte.ts`
  (`status`: idle, loading, ready, gone, error), `cloudLists.svelte.ts` and
  `homebrew.svelte.ts` (`status`: idle, loading, ready, error).
- Tests: `lib/hash.test.ts`, `components/printPage.test.ts`,
  `sharedListPage.test.ts`, `tests/app/inventory.js` (the `#/s/` and
  `#/print/` states, `HB_AXE`), `docs/fixtures/urls/routes.json`.
- Names from R7h B7h.4 that do not exist yet: `plan.md` 3.0.

## Facts found by the refresh (planner, 2026-10-07)
- `route` is derived from `parseHash(hash, knows)` and `knows` reads
  `recordFor`, so a `#/print/<ids>` address re-derives when the account
  lists and own items load; until then the page draws «Печатать нечего»
  or the catalog ids alone.
- `#/print/<ids>`'s pattern `^print\/[\w*-]+$` has no `/`, so
  `print/s/...` and `print/h/...` cannot match it.
- Print links are built in `PickRow.svelte`, `SelBar.svelte`,
  `PrintPage.svelte` (copy) and `ListPage.svelte` (own list).
- `entries_per_list` defaults to 100 (`20260925130000_limits.sql`); R7h's
  5.2 says 200.
- `homebrew_items`, `homebrew_books` and `homebrew_cards` each have
  `updated_at timestamptz not null default now()` (`20260930130000_homebrew.sql`,
  `20261001130000_homebrew_relations.sql`), the source of Q9-8 B's key.
- Visually hidden status regions exist as `.said` (`SharedListPage`),
  `.lsaid` (`ListPage`), `.rsaid` (`RequestsPanel`).

## Command costs

From R7d's measured figures (`issues/persist-7d-homebrew-files/plan.md`
section 7, this host, 2026-10-02).

| Command | Wall clock | Fits one call? |
|---|---|---|
| `npm run check` | 7-10 min | yes, near the cap on a loaded host (gate credit otherwise) |
| `npm run check:built` (after `npm run build:test`) | about 2 min | yes |
| `node tests/run-all.js app/states` | 4-6 min | yes |
| `node tests/run-all.js app/contracts` | 7-9 min | yes |
| `node tests/run-all.js app/print` | about 4 min (estimate, not measured) | yes |
| `node tests/app/sweep.js 360` | 7-9 min | yes |
| `node tests/app/golden.js --shard=n/4` | about 3.2 min per shard | yes, one shard per call |
| `npm run check:db` (PowerShell tool) | 9-10 min | yes, under the stack lock |
| `npm run e2e` | 2-3 min | yes |

## Which machine is authoritative
- This Windows host for every figure above; CI for the shard timings.

## Reasons already disproved
- `homebrew_shares`, its three functions and contract case P: not needed
  after R7h (an item is read by its id through `get_homebrew_item`).
- `clone_shared_homebrew` and `add_shared_homebrew_to_list` (roadmap
  section 5): not needed; R7h builds the copy and the live add on
  `import_homebrew` and the write buffer.

## Constraints
- Contracts: `#/print/s/<token>/<ids>` and `#/print/h/<uuid>` are public
  contract changes (fixtures, `tests/contracts.js`, `CONTRACTS.md`,
  `ROUTES.md`, `llms.txt` in one commit). `#/print/<ids>` stays as it is.
- Every new string RU and EN (rule 14); invented names only in fixtures and
  mocks.
- Concurrency (dispatch of 2026-10-07): R7h is implemented in the same
  worktree; the planner writes only under `issues/persist-9-item-share/`.

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
- You suspect drift vs issue or plan
