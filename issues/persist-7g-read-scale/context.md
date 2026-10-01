# Shared task context - TASK persist-7g-read-scale

Orchestrator (or first worker) maintains this file so later steps do not re-fetch the same sources.

## Goal
- R7g (owner, 2026-10-01; after R7f, before R7d): fix the scale findings F1,
  F2 and F6 of the `scale-challenge` report, sized for at most three times
  the default limits (owner input below).
- Report: `issues/persist-7f-consistency/scale-challenge.md` (findings and its
  "Placement" section). Roadmap row: `issues/persistent-storage/plan.md`
  section 9, "R7g". Both live in other task directories: read them, do not
  edit them, and do not cite them from code (they are deleted at closeout).

## GitHub issue (if any)
- URL: none (a local task id; the owner's input came through the
  orchestrator, 2026-10-01).
- Captured or last verified: 2026-10-01.
- Summary (facts only), from the report:
  - F1: `ports/supabase.ts` `LIST_SELECT` embeds `list_entries(...snapshot...)`;
    `lists.list()` has no `.order()`; `state/cloudLists.svelte.ts` `#pull`
    reads the whole account on the first load, on the 45 s poll while the
    owner topic is down, on the 300 s safety re-read (`lib/live.ts`) and on
    every other-tab edit (`#remote`). PostgREST `max_rows` is 1000
    (`supabase/config.toml`, `[api]`); the hosted value follows the file
    through `npm run config:diff`.
  - F2: `get_shared_list(text)` (last body: migration
    `20261001130000_homebrew_relations.sql`) returns the whole projection,
    references filled from the live item with its cards;
    `state/sharedView.svelte.ts` `refresh()` downloads it all and compares
    `updated_at` after the download.
  - F6: `components/ListPage.svelte` `batchDelete` and `goldEdit` call
    `removeEntry`/`setMeta`/`restoreEntry` once per ticked row.
- Decisions already settled: the owner's input below; the plan's decisions
  in `plan.md` section 4.
- Open questions: none (Q1 and Q2 answered, "Owner answers" below).

## Owner input (2026-10-01, through the orchestrator)
- First: "I would not care a lot about limits raised that hard." Scope R7g
  to what users hit at the defaults; keep at most a cheap guard for reads
  past 1000 rows; list-page paging past about 1400 rows is dropped; size
  the per-list snapshot byte-limit question against the defaults.
- Refinement (supersedes the first where they differ): plan for up to 2x-3x
  the default limits, no more. Design target = 3x defaults: 150 lists, 300
  entries per list, 30 pending requests per list (about 4500 pending across
  150 lists - past the 1000-row cap, so ordered paging of the requests read
  is in scope), 60 sources, 300 items, 300 cards, frozen copies up to
  131072 bytes each. Size F1, F2, F6 and the byte-limit question against
  that target; anything only reachable past 3x is out of scope.

## Owner answers (2026-10-01, through the orchestrator)
- Q1 = C: a per-list frozen-copy byte limit of 1048576 bytes (1 MiB), an
  overridable `limit_defaults` row `snapshot_bytes_per_list`. Trade-off
  accepted: some real 300-entry lists at 3x are refused; an override lifts
  it. Rejected: 2 MiB (the planner's recommendation), no limit.
- Q2: drop F6.
- The unplaced finding (the owner's pending-requests read re-sent whole
  after every new request and on the 300 s safety read) goes to
  `persist-review`'s scale re-run as a line in the handoff's "Deferred".

## Key paths
- Specs: `docs/specs/FEATURES.md` ("Account and browser lists": "Two
  devices", "The shared page", "Limits"; "Lists": "Own items in lists"),
  `docs/specs/META.md` (the paragraph on the functions `anon` executes),
  `docs/specs/COVERAGE.md` (`ports/supabase.test.ts` row, tests/db rows),
  `docs/specs/DEBT.md`.
- Decisions: `docs/decisions/2026-10-01-a-frozen-copy-holds-up-to-131072-bytes.md`
  (the byte limit amends it), `docs/decisions/2026-09-30-a-frozen-copy-embeds-its-source-a-reference-must-exist.md`.
- Code: `app/src/ports/{types,supabase,lazy-cloud,fake-cloud,cloud.contract}.ts`,
  `app/src/state/{cloudLists,sharedView}.svelte.ts`, `app/src/lib/cloudLists.ts`
  (`limitText`), `app/src/lib/dict.ts` (`limitEntries` neighbours, RU and EN
  blocks).
- Database: `supabase/migrations/20260925130200_list_shares.sql` (grants of
  `get_shared_list(text)`), `20260930121000_list_entries_statement_triggers.sql`
  (the statement-trigger pattern and the `entries:` advisory lock),
  `20260925130000_limits.sql` (`limit_defaults`, `effective_limit`),
  `20261001130000_homebrew_relations.sql` (the current `get_shared_list(text)`
  and the 131072-byte check); reversals in `supabase/reversals/`.
- Tests: `tests/db/{list-shares,harness,homebrew,limits,lists}.test.mjs`
  (`harness.test.mjs` `EXPECTED_ANON_FUNCTIONS`; `homebrew.test.mjs` and
  `list-shares.test.mjs` pin `get_shared_list(text)` grants),
  `tests/e2e/contract.mjs` (anon calls `get_shared_list`).
- Runbooks: `.claude/README.md` "Undo a deploy that carried a migration"
  (app revert first; a narrowing is a second push), "Expected Security
  Advisor warnings".
- Mocks: none (no drawn change but one toast text).

## Revision facts the design relies on (read from the migrations, 2026-10-01)
- `lists.revision` grows by one on every list update (`lists_before_update`)
  and on every statement that changes its entries (`list_entries_touch`).
- An own item's, source's or card's update bumps every list of the owner
  that holds a reference to it (`homebrew_items_touch`,
  `homebrew_books_touch`, `homebrew_cards_touch`); an item delete deletes
  its references, which bumps the lists. So a share projection changes only
  with its list's revision, except when a migration changes
  `homebrew_snapshot_of` itself.
- `list_entries` has a full UPDATE grant for `authenticated` (row level
  security only): a client can rewrite `snapshot` directly, so a snapshot
  check needs an UPDATE trigger too.
- `clone_shared_list` calls `public.get_shared_list(p_token)` by name.
- The usage report's keep-alive (`tools/supabase/usage.mjs`) posts
  `get_shared_list` with `{ p_token }` only.

## Command costs
As in `issues/persist-7c-homebrew-relations/context.md`, "Command costs":
`npm run check` 7-10 min; `npm run check:db` 9-10 min (PowerShell tool on
Windows); `npm run check:built` about 2 min; `node tests/run-all.js
app/states` 4-6 min; `npm run db:push -- --project test --yes` about 1 min;
`npm run e2e` 2-3 min.

## Constraints
- Every changed text has RU and EN; ASCII punctuation; «ёлочки» in Russian.
- Concurrency (2026-10-01): R7c's `B7c.4` is being implemented now
  (`dict.ts`, catalog cards); R7e and R7f ship before R7g and edit
  `ListPage.svelte`, `RequestsPanel`, `dict.ts`, the ports and
  `cloudLists.svelte.ts` (R7f: `ListsRead.listLimit`/`entryLimit`,
  `HomebrewRead.bookLimit`, `my_limit` reads, `LoadState.svelte`). The
  dispatch refresh re-reads `plan.md` section 8's list.

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
- You suspect drift vs issue or plan
