# Shared task context - TASK persist-9-item-share

## Goal
- Release R9 of the persistence programme: a share link to one own homebrew
  item (`#/h/<token>`), add to a list and «Сохранить себе» from it, print
  routes that resolve another account's homebrew items, and the two `DEBT.md`
  entries R9 owns (D70, D71). Ships after R7h and before R8 (owner,
  2026-10-02: R9 needs nothing of R8). R8 later brings pictures to R9's
  surfaces (`issues/persist-8-media/`).
- Dispatch of 2026-10-02 (orchestrator): draft the design and the mocks so
  the owner reviews them before R9 is dispatched. No production code.

## GitHub issue (if any)
- None. Local task id; the roadmap is `issues/persistent-storage/plan.md`
  (section 5 row R9, section 6 row `B9.1`, section 12 row `B9.1`, section 14
  outline `B9.1`, section 9 row R9).
- Decisions already settled (owner): one TASK id per release; R9 before R8
  (2026-10-02); 3x the default limits is the scale target (decision
  2026-10-01); frozen copies embed source and cards and never change
  (decisions 2026-09-26 and 2026-09-30); share links are made when the share
  panel opens and a deleted one stays deleted (2026-09-25); share topics use
  `topic_key` and carry only a revision (2026-09-25); `#/i/<key>` opens for
  the author only (R7).
- Open questions: none. Owner answers of 2026-10-02 to Q9-1 to Q9-5 and the
  accepted label clash: `plan.md` section 9.

## Screenshot / attachment findings
- No screenshots. Mocks: `mocks/index.html` (m30-m36), hand-written on the
  real tokens.

## Key paths
- Specs: `docs/specs/FEATURES.md` ("Records", "Homebrew", "Account and browser
  lists" share links and shared page, "Print", "Consistency rules" 1-16),
  `ROUTES.md`, `CONTRACTS.md` section 1, `STATE.md` (memory), `META.md`
  section 3, `DEBT.md` "Item links" (D70, D71) and D65.
- Code hot paths: `app/src/components/SharePanel.svelte`,
  `SharedListPage.svelte`, `RecordPage.svelte`, `PickRow.svelte`,
  `RecordActions.svelte`, `HomebrewEditor.svelte` (`addPick`),
  `PrintPage.svelte`, `SelBar.svelte`; `app/src/state/sharedView.svelte.ts`,
  `liveFeed.svelte.ts`, `app.svelte.ts` (`frozenCopy`, `recordFor`);
  `app/src/lib/hash.ts` (`parseHash`, `readPrint`), `lib/homebrew.ts`
  (`recordOf`, `withRecords`), `lib/cloudLists.ts` (`entrySource`,
  `snapshotRecords`); `app/src/ports/types.ts` (`ShareRepository`,
  `HomebrewRepository.import`), `supabase.ts`, `fake-cloud.ts`,
  `fake-cloud-seed.ts`, `cloud.contract.ts` (cases A-O exist).
- Database: `supabase/migrations/20260925130200_list_shares.sql` (the token
  default and check, `get_shared_list`), `20260927120000_realtime.sql`
  (`lists_broadcast`, `list_shares_gone`, the `share:<uuid>` receive
  policy), `20260930130000_homebrew.sql` (`homebrew_items_touch`,
  `homebrew_books_touch`, `homebrew_broadcast`),
  `20261001130000_homebrew_relations.sql` (`homebrew_snapshot_of` with 4
  arguments, `homebrew_cards_touch`, the current `get_shared_list`),
  `20261002130000_homebrew_files.sql` (`import_homebrew`).
- Mocks: `issues/persist-9-item-share/mocks/`.

## Command costs

From R7d's measured figures (`issues/persist-7d-homebrew-files/plan.md`
section 7, this host, 2026-10-02).

| Command | Wall clock | Fits one call? |
|---|---|---|
| `npm run check` | 7-10 min | yes, near the cap on a loaded host (gate credit otherwise) |
| `npm run check:built` (after `npm run build:test`) | about 2 min | yes |
| `node tests/run-all.js app/states` | 4-6 min | yes |
| `node tests/run-all.js app/contracts` | 7-9 min | yes |
| `node tests/app/sweep.js 360` | 7-9 min | yes |
| `node tests/app/golden.js --shard=n/4` | about 3.2 min per shard | yes, one shard per call |
| `npm run check:db` (PowerShell tool) | 9-10 min | yes, under the stack lock |
| `npm run e2e` | 2-3 min | yes |

## Which machine is authoritative
- This Windows host for every figure above; CI for the shard timings.

## Reasons already disproved
- An RPC `clone_shared_homebrew` and an RPC `add_shared_homebrew_to_list`
  (roadmap section 5) are not needed: the copy is one `import_homebrew` call
  built in the client from the projection, and the add is the write buffer's
  existing frozen-copy path (`plan.md` 3.6). Neither needs a definer.

## Constraints
- Contracts: `#/h/<token>`, `#/print/s/<token>/<ids>`, `#/print/h/<token>` are
  public contract changes (fixtures, `tests/contracts.js`, `CONTRACTS.md`,
  `ROUTES.md`, `llms.txt` in one commit).
- Every new string RU and EN (rule 14); invented names only in fixtures and
  mocks («Мастерская Ольхи» / "Alder Workshop", the bedrolls).

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
- You suspect drift vs issue or plan
