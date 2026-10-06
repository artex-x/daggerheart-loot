# Shared task context - TASK 70

## Goal
- Plan item visibility control for list items, with grounded mockups. No implementation in this pass.
- The owner approves mockups and design first; then the plan is committed and pushed.

## GitHub issue (if any)
- URL: https://github.com/artex-x/daggerheart-loot/issues/70
- Captured or last verified: 2026-10-06
- Title: Add item visibility control for list items
- Summary (facts only):
  - The list owner (GM) can fully hide specific items from players in the item list.
  - Examples from the issue: under-the-counter goods; items displayed on the counter rather than in storage.
  - A change to an item's visibility reaches every player immediately through the live update system (Realtime).
- Decisions already settled (owner, 2026-10-06): the GM's link shows GM-only entries, marked by the row look (Q1); the name is «Только для мастера» / "GM only" (Q2); the lists file keeps the mark as `import-v3` (Q3); the selection-bar action with undo stays (Q4); no visible text marker on any row; no counts at N = 0; the share hint names the GM notes and the GM-only items for the players' link.
- Open questions: for the planner - where the toggle lives, what a hidden item looks like to the owner, whether hidden items leak through the share payload, frozen copies, exports, counts or prints.

## Screenshot / attachment findings
- The issue has no screenshots and no comments.

## Key paths
- Specs: `docs/specs/FEATURES.md`, `STATE.md`, `CONTRACTS.md`, `META.md` (lists and the backend), `DEBT.md`
- Decisions: `docs/decisions/2026-09-2*-realtime-*`, `2026-09-25-share-topics-use-topic-key-*`, `2026-09-26-request-events-nudge-*`, `2026-10-01-a-frozen-copy-holds-*`
- Code hot paths: `supabase/migrations/`, `app/src/` list and share views (planner locates them)
- Mocks: `issues/70/mocks/` (`mocks/index.html` is the entry the Browser pane opens)

## Facts found by the planner (2026-10-06, HEAD d997f4f0)
- Non-owners reach entries only through SECURITY DEFINER functions: `get_shared_list(text)` (newest body `20261001130000_homebrew_relations.sql`; the `(text, bigint)` wrapper in `20261002120000_read_scale.sql` and `clone_shared_list` (newest `20260930130000_homebrew.sql`) call it) and `create_purchase_request` (`20260928120000_purchase_requests.sql`, a stale-item oracle). `list_entries` RLS is owner-only; Realtime sends only a revision (`20260927120000_realtime.sql`).
- Entry writes: `apply_list_writes` (`20260925130600_list_writes.sql`), allowed `update_entry` keys `quantity, price_coins, player_note, gm_note`. The statement-level touch trigger (`20260930121000_...`) bumps the revision on any entry update.
- `migrate-prod` runs before `deploy` in `ci.yml`.
- Client: `app/src/lib/cloudLists.ts` (rows, `entryMetaOf`, `entryRowsOf`, `sharedListOf`), `app/src/state/cloudLists.svelte.ts` (`setMeta`, `restoreEntry`, the buffer), `app/src/ports/supabase.ts` (list select string), `app/src/ports/fake-cloud.ts` (`projection`, `clone`, `requestSend`, test switch `play`), `app/src/ports/cloud.contract.ts` (cases A-O).
- Screens: `ListPage.svelte` (`.lrow`, `.lrow-acts` note and remove buttons), `RowMain.svelte`, `TableRows.svelte`, `SharedListPage.svelte`, `SharePanel.svelte`; strings `noteHid` «Только для мастера» / "GM only" with icon `eyeOff` already mean "owner and GM's link only".
- `import-v1` and `import-v2` are frozen (`CONTRACTS.md` section 4): a new entry field is `import-v3`.

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
