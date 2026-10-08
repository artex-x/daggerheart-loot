# Shared task context - TASK 70

## Goal
- Plan item visibility control for list items, with grounded mockups. No implementation in this pass.
- The owner approves mockups and design first; then the plan is committed and pushed.

## GitHub issue (if any)
- URL: https://github.com/artex-x/daggerheart-loot/issues/70
- Captured or last verified: 2026-10-06 (repository facts refreshed against R7h `31c1400f` on 2026-10-07)
- Title: Add item visibility control for list items
- Summary (facts only):
  - The list owner (GM) can fully hide specific items from players in the item list.
  - Examples from the issue: under-the-counter goods; items displayed on the counter rather than in storage.
  - A change to an item's visibility reaches every player immediately through the live update system (Realtime).
- Decisions already settled (owner, 2026-10-06): the GM's link shows GM-only entries, marked by the row look (Q1); the name is «Только для мастера» / "GM only" (Q2); the lists file keeps the mark as `import-v3` (Q3); the selection-bar action with undo stays (Q4); no visible text marker on any row; no counts at N = 0; the share hint names the GM notes and the GM-only items for the players' link.
- Owner 2026-10-07 (chat): risk 5 / plan-B1-2-2 = accept. A GM-only entry's item stays reachable through a shown item's related rows (`#/h/<hid>`), a player's earlier live link and its notices, and a players' clone made before the mark; the mark hides the entry, not the item. The privacy pages say so (B2).
- Open questions: for the planner - where the toggle lives, what a hidden item looks like to the owner, whether hidden items leak through the share payload, frozen copies, exports, counts or prints.

## Screenshot / attachment findings
- The issue has no screenshots and no comments.

## Key paths
- Specs: `docs/specs/FEATURES.md`, `STATE.md`, `CONTRACTS.md`, `META.md` (lists and the backend), `DEBT.md`
- Decisions: `docs/decisions/2026-09-2*-realtime-*`, `2026-09-25-share-topics-use-topic-key-*`, `2026-09-26-request-events-nudge-*`, `2026-10-01-a-frozen-copy-holds-*`
- Code hot paths: `supabase/migrations/`, `app/src/` list and share views (planner locates them)
- Mocks: `issues/70/mocks/` (`mocks/index.html` is the entry the Browser pane opens)

## Facts found by the planner (2026-10-06, HEAD d997f4f0)
- Superseded where the R7h block below differs: every "newest body" file named here is replaced by `20261007130000_homebrew_links.sql`.
- Non-owners reach entries only through SECURITY DEFINER functions: `get_shared_list(text)` (newest body `20261001130000_homebrew_relations.sql`; the `(text, bigint)` wrapper in `20261002120000_read_scale.sql` and `clone_shared_list` (newest `20260930130000_homebrew.sql`) call it) and `create_purchase_request` (`20260928120000_purchase_requests.sql`, a stale-item oracle). `list_entries` RLS is owner-only; Realtime sends only a revision (`20260927120000_realtime.sql`).
- Entry writes: `apply_list_writes` (`20260925130600_list_writes.sql`), allowed `update_entry` keys `quantity, price_coins, player_note, gm_note`. The statement-level touch trigger (`20260930121000_...`) bumps the revision on any entry update.
- `migrate-prod` runs before `deploy` in `ci.yml`.
- Client: `app/src/lib/cloudLists.ts` (rows, `entryMetaOf`, `entryRowsOf`, `sharedListOf`), `app/src/state/cloudLists.svelte.ts` (`setMeta`, `restoreEntry`, the buffer), `app/src/ports/supabase.ts` (list select string), `app/src/ports/fake-cloud.ts` (`projection`, `clone`, `requestSend`, test switch `play`), `app/src/ports/cloud.contract.ts` (cases A-O).
- Screens: `ListPage.svelte` (`.lrow`, `.lrow-acts` note and remove buttons), `RowMain.svelte`, `TableRows.svelte`, `SharedListPage.svelte`, `SharePanel.svelte`; strings `noteHid` «Только для мастера» / "GM only" with icon `eyeOff` already mean "owner and GM's link only".
- `import-v1` and `import-v2` are frozen (`CONTRACTS.md` section 4): a new entry field is `import-v3`.

## Facts found by the planner (R7h refresh, 2026-10-07, R7h task commit 31c1400f)
- R7h's task commit: `31c1400f` when read, `3c3e723c` at the second plan review (amended, code-identical); `B7h.4t` rebases it again, so `git show 31c1400f:<path>` works only while that object exists. B1 re-reads each body from its own base.
- R7h is not on `main` yet (branch `claude/r7h-homebrew-replan-275175`); its remaining batches `B7h.4t`, `B7h.5`, `B7h.6` change UI and tooling only, no migration. Task 70 ships after it as its own release.
- R7h's migrations: `20261007120000_lifecycle_cleanup.sql` (pg_cron hourly `lifecycle_cleanup()`; `create_purchase_request` without its write-time delete) and `20261007130000_homebrew_links.sql`. The second holds the newest body of all five functions B1 redefines: `apply_list_writes` (`hb_item` in `create`/`add`, a non-null `snapshot` refused, a new `relink` op that sets `hb_item` only), `get_shared_list(text)` (`snapshot` from `homebrew_item_record(e.hb_item)`, `hid` beside it), `clone_shared_list` (`hb_item` from `hid`), `create_purchase_request` (expiry 30 days, capped at 1 hour after the first read), `import_lists` (`hb_item`, `snapshot` refused). The `(text, bigint)` wrapper (`20261002120000`) is unchanged.
- `list_entries.hb_item uuid` references `homebrew_items(id) on delete cascade`, check `(source = 'homebrew') = (hb_item is not null)`; trigger `list_entries_hb_key` (before insert or update of `hb_item, item_key, source`) links a key-only homebrew row to the owner's item. `list_entries.snapshot` stays, always null (`list_entries_snapshot_null`); `DEBT.md` D91 has R9's first migration drop it.
- New owner-only state: `list_notices` (one row per list and item, written by `homebrew_links_touch`, broadcast `notice` on `owner:<uid>`), `purchase_requests.read_at`, `mark_list_read(uuid)`. New readers of items, not entries: `get_homebrew_item(uuid)` (anon too; `related` rows carry the author's related items' `hid`, key, names, kind) and `get_homebrew_items(uuid[])`.
- Touch: `homebrew_items_touch`, `homebrew_books_touch`, `homebrew_cards_touch` call `homebrew_links_touch`, which bumps every list linking the item, of any owner, and upserts a notice for lists of another owner.
- Client at 31c1400f: `EntryRow` has `hb_item`, no `snapshot`; `entryRowsOf(ids, meta, newId, from, sourceOf)`; `SharedRow.entries` is `Omit<EntryRow, 'gm_note' | 'hb_item'> & { snapshot, hid?, gm_note? }`; `CloudList.links`/`linked`; `cloudLists.svelte.ts` `relink()` (key `entry:<row>:link`); the select string `list_entries(id,item_key,source,hb_item,position,quantity,price_coins,player_note,gm_note)` (pinned in `supabase.test.ts`); the fake's projection destructures `{ gm_note, hb_item, ...rest }`; `SeedEntry.hbItem`; port `requests.notices`/`hideNotices`/`markRead`.
- Lists file at 31c1400f: `import-v1`/`import-v2` unchanged; export writes the live item as `snapshot` without `hid`; import is `importPlan` + `withCopies` (fixed copies through `import_homebrew` first, then `import_lists`); `toImportRows`/`withHeld` are gone. `CONTRACTS.md` section 4 still says "any other change is `import-v3.json`", and three `schema/` files.
- `CONTRACTS.md` section 1's `#/s/<token>` bullet now describes the projection (`hid` beside `snapshot`); no fixture, `tests/contracts.js` case or `llms.txt` line pins it.
- Contract cases at 31c1400f: A-O and R (cross-account links). P is free (R9 dropped its case P); R8 reserves Q.
- R8 (`persist-8-media`) plans to redefine `get_shared_list(text)` (`img` beside `hid`) after R9.
- R9 plans `#/print/s/<token>/<ids>` (signed out too), read through `get_shared_list`; it inherits the GM-only filter while it never reads an item by its id.
- Test push: `db-push.mjs --project test` fails on this host with `LegacyDbConfigIpv6Error` (R7h handoff, Deferred); R7h used `tools/supabase/migrate-test.mjs` over the session pooler. `db:push` also refuses while another branch's migration is on the test project (`.claude/README.md`, the `db:push` row).
- Migration stamps: `.claude/README.md`, "Migration names" - the next free minute after the newest file; production's `db push` refuses a local file older than the remote's newest, so the task that lands second renames its unpushed migration.
- Privacy pages: `pages/src/privacy.html` line 46 «Вид для игроков не показывает заметки мастера.», `pages/src/en/privacy.html` line 46 "The player view leaves out the GM notes." (at `31c1400f`).
- Measured by R7h (`B7h.4`, 2026-10-07): `npm run check` 451 s (3451 tests) quiet, 10-18 min loaded; `npm run e2e` 11 contract cases and F0-F18.

## Command costs
See `CLAUDE.md` and `.claude/README.md`, "Batch size and the fixed cost of a run". Not measured for this task yet.

## Constraints
- The Supabase backend is the only server. A hidden item must not reach a player's client at all (RLS or RPC-side filtering), not only be hidden by CSS.
- RU/EN parity for every new label.
- Related: TASK 71 (filters on the shared list view) plans the same view in parallel. Keep the two designs compatible; neither plan may assume the other ships first.

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
- You suspect drift vs issue or plan
