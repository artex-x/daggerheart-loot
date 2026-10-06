# Plan - TASK 70: GM-only entries in an account list

## Status

- Planning pass 2, 2026-10-06, planner: the owner's answers to Q1-Q4 and
  the mock feedback are applied (section 12). HEAD `d997f4f0`, branch
  `claude/task-planners-mockups-079cc9`. Nothing implemented, nothing
  committed.
- Batches: B1 `gm-only-schema`, B2 `gm-only-ui`, B3 `import-v3` - all not
  started. B1 is implement-ready.
- NEEDS_HUMAN_CONFIRMATION: no - Q1-Q5 answered (section 12).
- Plan review: required before B1 (trigger: a migration and SECURITY DEFINER functions; the down migration loses every stored GM-only mark; B3 is a public contract change - this one review covers B3 too, because section 4 fixes the import-v3 shape and its SQL lands in B1; a B3 expansion that changes that shape writes a new required line)
- Plan review findings applied: reviews/plan-B1.md
  - B1: section 11, B1 step 7 - `entryRowsOf` writes `gm_only: true` only for a GM-only entry and no key otherwise; step 14 asserts no `gm_only` key on an add from a GM link and on a shown entry's row.
  - B2: section 11, B3 outline - `importVersion` and `importNoVersion` name versions 1-3 in RU and EN; `importPanel.test.ts`, `docs/fixtures/homebrew-file/README.md` and FEATURES.md "Import" added; an acceptance line for the texts; standing check 4 corrected.
  - R1: section 11, B3 outline (and section 5) - `CONTRACTS.md` section 4's count of `schema/` files, its data-zip bullet and section 5 "Static asset paths" added, with an acceptance line.
  - R2: section 6, "Conflict" row - the undo of a removal after another device's mark re-adds the entry shown to players; named and accepted as last write wins, recovery by the unpressed eye.
  - R3: section 10, risk 1 - an own item, source or card edit that only a GM-only entry references also moves the players' revision; the decision file records it.
  - N1: section 11, B1 files and step 11 - `app/src/ports/supabase.test.ts` (the pinned select string) added.
  - N2: section 11, B1 files - `docs/specs/COVERAGE.md` (case P, the new DB and fake cases) added.
  - N3: section 11, B1 steps 12-13 - the fake's GM projection writes `gm_only` on every entry, false included, a players' answer strips it; case P asserts both, with a walk for the key.
  - N4: section 11 - `playEntry` moved from B1 step 12 to the B2 file list with its first callers.
  - N5: section 11, B1 step 1c - the subquery is aliased `e`, so the rest of the copied body stays byte-identical.
  - N6: section 11, split criteria - restated in `CLAUDE.md` terms (no shared component, filter or seed; a security boundary), never deployed alone, accepted cost one more `npm run check`.
  - N7: section 11, B1 step 15 - the decision file records B3's version rule and its rejected alternative (always version 3).
  - N8: section 11, B2 outline (and section 9) - owner, 2026-10-06: the share panel's copy toasts name the GM notes and the GM-only items; new `playersShareCopied`, changed `gmShareCopied`, exact RU/EN text, an acceptance line; `playersLinkCopied` and `gmLinkCopied` stay (browser `#/l/` links only); no golden affected.
  - Orchestrator-relayed update (TASK 71 plan review, not a finding): section 9 - TASK 71's filter lives in `#/s/<token>/f_<filter>` with a copy-link button and a `gmFilterLinkCopied` warning; the N8 toast texts are quoted there, and the task that lands second aligns the strings.
- Total gate cost (section 11): about 3975-4695 s (66-78 min) of gates on
  this host, plus the plan review and the three batch reviews.

## 1. Objective and current state

Issue 70: the list owner (the GM) hides chosen entries of a list from the
players; under-the-counter goods are the issue's example. A change of the
mark reaches every open players' page through the live updates. Facts:
`issues/70/context.md`.

Today an account list's entries reach a non-owner only through two
SECURITY DEFINER functions: `get_shared_list(text)` (the share
projection; the `(text, bigint)` wrapper and `clone_shared_list` call it)
and `create_purchase_request` (an oracle: it answers `request: stale` for
an item the list does not hold). Row level security keeps `list_entries`
to its owner; Realtime carries only a revision. A players' link already
omits both `gm_note` keys. So the projection is the one place to drop an
entry.

## 2. Evidence

- The issue has no screenshots and no comments (`context.md`).
- The app already names the concept: the GM note is «Только для мастера» /
  "GM only" with the crossed-eye icon `eyeOff`, shown to the owner and on
  the GM's link, never on the players' link or in the copied text
  (`dict.ts` `noteHid`, `notePubHint`, `noteHidHint`, `shareHint`).
- DESIGN.md, "Shapes": a dashed border marks a property rather than a
  category.
- The owner's mock review (2026-10-06): no text marker on screen; the row
  look and the pressed eye carry the state.

## 3. Scope and non-goals

In scope: a GM-only mark per entry of an account list, set by its owner on
the list page (row toggle and selection-bar action with undo); the
players' link drops GM-only entries server side; the GM's link shows them
in the GM-only row look; Realtime and the poll carry the change; purchase
requests through a players' link treat a GM-only entry as absent;
«Сохранить себе» from a GM's link keeps the mark; the lists file keeps the
mark as `import-v3`.

Non-goals:
- Browser lists (`#/l/`, local storage): read-only from 2026-10-26; no
  toggle, no codec change.
- Per-player visibility, timed reveal, a hidden list note.
- TASK 71's filters. Compatibility is section 9.

## 4. Design (the owner approved it on 2026-10-06)

Names: the state is «Только для мастера» / "GM only" (the existing
`noteHid` words and icon). Column `list_entries.gm_only`, file field
`gm_only`, client meta key `gmOnly`, CSS class `gm-only`. The verbs in the
selection bar are «Скрыть от игроков» / «Показать игрокам».

Server (B1):
- `list_entries.gm_only boolean not null default false`.
- `get_shared_list(text)`: a players' share selects only `not gm_only`
  entries and writes no `gm_only` key; a GM share selects every entry and
  writes `gm_only` on each. In both, `position` is the entry's ordinal
  among the entries the link shows (`row_number() - 1` over
  `(position, id)`), so a players' answer has no gap where a GM-only entry
  was.
- `clone_shared_list`: copies `gm_only` from the projection; a players'
  link has no GM-only entry to copy.
- `create_purchase_request`: for a players' share, a GM-only entry counts as
  absent in the stale check and in the price read (`request: stale`, the
  answer for any item the list does not hold).
- `apply_list_writes`: `update_entry` accepts `gm_only`; `create` and `add`
  read `gm_only` from each entry, `coalesce(x.gm_only, false)`.
- `import_lists`: reads `gm_only` from each entry the same way, so B3's
  import needs no second migration.
- Unchanged: `move_legacy_list` (its entries default to false),
  `apply_purchase_request`, the Realtime triggers (an entry update already
  bumps the list revision once per statement, and the broadcast sends only
  that revision), every policy.

Screens (B2; mockups `issues/70/mocks/index.html`, revision 2):
- Owner's account list page: a third button in `.lrow-acts`, between
  «Заметка» and «Убрать из списка», named «Только для мастера: <item>»,
  `aria-pressed`, title «Только для мастера»; icon `eye` unpressed,
  `eyeOff` pressed in the `.lrow-note.on` look.
- A GM-only row, on the owner page and on the GM's link alike: dashed
  border `--line2`, ground `--bg2`, the art at 45%. No text on screen. The
  item's button carries the state in visually hidden text after the name
  («Кольцо Тишины Только для мастера ...»), so a screen reader hears it on
  the GM's link, which has no toggle. `RowMain` gets a `gmOnly` prop that
  draws the 45% art and the hidden text; each page's row component
  (`ListPage` `.lrow`, `TableRows` `.row`) draws its own border and ground.
- The sub of the owner page adds «только для мастера: N» between the count
  and the save status while N > 0; at N = 0 the sub is today's.
- The selection bar: «Скрыть от игроков (N)» while any ticked entry is
  shown to players, else «Показать игрокам (N)», before «Удалить (N)»; the
  toast «Скрыто от игроков: N» / «Показано игрокам: N» counts the changed
  entries, with «Вернуть»; the ticks stay.
- The players' link: nothing new; the entries are not in the answer.
- The owner on their own players' link: the «Это ваш список.» line adds
  «Только для мастера: N - по этой ссылке их не видно.» while N > 0; at
  N = 0 the line is today's.
- The share panel hint, exact text:
  - RU: «Удалить ссылку» закрывает доступ: по удалённой ссылке список
    больше не откроется. «Создать ссылку» даёт новую. Ссылка для игроков
    скрывает заметки и позиции «Только для мастера», ссылка для мастера
    показывает их - давайте её только мастерам.
  - EN: "Delete link" ends access: a deleted link no longer opens the
    list. "Create link" makes a new one. The players' link hides the "GM
    only" notes and items; the GM's link shows them - give it to GMs only.
- «Скопировать текст» leaves GM-only entries out (it is the players' text,
  as it leaves out GM notes). The selection's «Скопировать», «Печать», the
  list roll, the roll numbers and the index count keep every entry.
- A GM note on a GM-only row is only a note. The mock's «Под прилавком:
  ...» is an example note, not a marker.

The lists file (B3), `import-v3`:
- `schema/import-v3.json`, `$id`
  `https://artex-x.github.io/daggerheart-loot/schema/import-v3.json`:
  `import-v2` with `version` 3 and one more optional entry property,
  `"gm_only": { "type": "boolean" }`. Every other definition is a copy of
  `import-v2`'s; the bounds are v2's (1000 lists, 5000 entries per list).
- The export writes `"gm_only": true` on a GM-only entry and nothing on any
  other entry. It writes version 3 only when a list of the file holds a
  GM-only entry; otherwise version 2 when it holds a homebrew entry, else
  version 1. So every file without a GM-only entry stays `import-v1` or
  `import-v2` byte for byte, and both data-zip pins stay.
- The import reads versions 1-3. A v1 or v2 file with `gm_only` is refused
  as an unknown field (those schemas stay closed and frozen). The refused
  "another version" fixture moves from version 3 to version 4.
- Frozen as `import-v2`: a bound widens in place and never narrows; any
  other change is `import-v4.json`.

Rejected (record in the decision file, B1): a client-side filter or CSS
(the entry would still reach the player); a column-level RLS policy (non-
owners never select `list_entries`; the projection is the boundary); a
separate table of hidden ids (a join for one boolean); a «Скрытые» group at
the end of the list (breaks order, roll numbers and the position field); a
labelled checkbox in the row's meta box (about 80 px of every row at
360 px); a text marker in the row - a flag line or a badge (owner,
2026-10-06: the eye and the row look carry the state); the lists file
without the mark (owner, Q3).

## 5. Contracts

- Unchanged: routes, the `#/s/<token>` grammar, the `#/l/` codec,
  `import-v1`, `import-v2`, `homebrew-v1`.
- New (B3): `schema/import-v3.json` and its `llms.txt` section; the data
  zip's `lists.json` may be version 3. B3 updates `CONTRACTS.md` sections 4 and 5,
  `docs/fixtures/import/`, `tests/contracts.js` and `llms.txt` in the same
  change (`CLAUDE.md`, "Specs are the behaviour source of truth").
- `get_shared_list` keeps its signature and grants; a GM's answer gains a
  key, a players' answer loses entries. Not a public contract
  (`CONTRACTS.md` does not list the projection), but `tests/e2e/contract.mjs`
  checks it on the hosted test project through `cloud.contract.ts`.

## 6. Error scenarios and revert (all batches)

| Scenario | Screen | Stored data | Recovery |
|---|---|---|---|
| Loading | unchanged | - | - |
| Failed read | unchanged | - | unchanged |
| Failed write of the mark | the row shows the new mark at once; the sub says «Не сохранено» with «Повторить», as any edit | kept in the buffer; players still see the entry until the send lands | the buffer's resend; a refused write toasts and reads the account again, the row returns to the stored mark |
| Offline | as a failed write | as a failed write | as a failed write |
| Conflict (another device toggled) | last write wins per entry field; the other device's change arrives through the owner topic. An undo of a removal restores the meta captured at the removal: device A marks an entry GM-only; device B, not re-read yet because a write is buffered there, removes the entry and presses «Вернуть»; the re-add writes no mark and the entry shows on the players' link again. Accepted as last write wins, as for notes today, though here the effect is exposure to players | the later write; after that undo, `gm_only` false | the owner sees the unpressed eye on the next read and presses it again |
| Entry deleted meanwhile | the toggle's write is dropped with no toast (today's rule) | nothing written | the account is read again |
| Stale owner tab (old bundle) | no mark drawn; an undo of a removal there re-adds the entry shown to players; its export writes no mark; it refuses a v3 file as another version | `gm_only` false on that re-add | the owner reloads; the mark is set again |
| Stale player tab | none: the server filters | - | - |
| Frontend revert (migration kept) | the owner sees no mark; players still do not see GM-only entries; a v3 file is refused as another version | kept | redeploy |
| Down migration (`supabase/reversals/...`) | every GM-only entry shows on players' links | the column is dropped: every mark is lost; files exported as v3 keep theirs | revert the app first; set the marks again, or import the v3 file into a new list, after a new up migration. This is the plan-review trigger |
| Import of a v3 file fails (network, limit, timeout) | today's import refusals and toasts | nothing written (one call, all or nothing) | today's retry |
| Ticked by a player when it turns GM-only | the tick leaves the selection on the next read (today's rule) | - | - |
| Request already sent for an entry that turns GM-only | the owner's panel shows it as before; «Принять» applies it | applied as today | - |

A retry sends the buffer's own write, which holds the mark the owner chose
last; nothing is copied from before a failure.

## 7. Tests, fixtures, specs

- DB: `tests/db/list-shares.test.mjs`, `list-writes.test.mjs`,
  `purchase-requests.test.mjs`, `import-lists.test.mjs`; the reversal walk
  (`reversibility.test.mjs`) covers the pair by itself.
- Port: `cloud.contract.ts` case P (fake in vitest, real in `npm run e2e`).
- Units: `lib/cloudLists.test.ts`, `lib/lists.test.ts`,
  `state/cloudLists.test.ts`, `lib/bundle.test.ts` (B1 and B3),
  `lib/share.test.ts` (B2), `lib/homebrewFile.test.ts` (B3), component
  tests (B2), `tools/check-site.test.mjs` (B3).
- Browser: `tests/app/inventory.js` states and re-seeded goldens (B2).
- Contracts (B3): `schema/import-v3.json`, `docs/fixtures/import/`,
  `tests/contracts.js`, `llms.txt`, `CONTRACTS.md` section 4.
- Specs: FEATURES.md "Account and browser lists" (B1: the projection,
  requests, copies; B2: the screens, «Скопировать текст»; B3: "Exports",
  "Import"), META.md (B3: the published schema list), COVERAGE.md where it
  names the import-file suites (B3).
- Decision: `docs/decisions/<B1 day>-a-gm-only-entry-is-dropped-by-the-share-projection.md`
  (B1), then `node tools/decisions.js`.

## 8. Compatibility and deploy order

`migrate-prod` runs before `deploy` (`ci.yml`), so the column exists before
a frontend selects it. The previous frontend reads lists without
`gm_only` and writes entries without it (default false). A stale players'
tab cannot see a GM-only entry because the filter is in the database. A
v3 file needs a frontend from B3 on; an older one refuses it as another
version, which is the frozen-schema rule.

## 9. TASK 71 (shared-page filters) compatibility

- TASK 71's filter lives in the address `#/s/<token>/f_<filter>`, with a
  copy-link button, as on the tables (owner, relayed by the orchestrator
  2026-10-06). Its facets and counts come from the rows the projection
  sent; a players' link holds no GM-only entry, so no facet value, count
  or empty state can reveal one, and a filter address carries only filter
  values, never an entry. On a GM's link the GM-only rows filter like any
  row and keep their row look.
- A filter link copied on a GM's link carries the GM token, so it shows
  the GM notes and the GM-only items. TASK 71's toast
  `gmFilterLinkCopied` warns about this; it uses the same words as this
  plan's share-panel toasts (B2, review N8), which are:
  - `playersShareCopied` (new): «Ссылка для игроков скопирована - заметок
    и позиций «Только для мастера» в ней нет» / "Players' link copied - it
    carries no "GM only" notes or items".
  - `gmShareCopied` (changed): «Ссылка для мастера скопирована - в ней
    есть заметки и позиции «Только для мастера»» / "GM's link copied - it
    carries the "GM only" notes and items".
  - The shared tail: «в ней есть заметки и позиции «Только для мастера»» /
    "it carries the "GM only" notes and items".
  The task that lands second aligns its strings with the first one's, and
  may extract the tail as one key on that second use.
- Both tasks edit `SharedListPage.svelte`, `TableRows.svelte` or
  `RowMain.svelte`, `dict.ts`, FEATURES.md ("The shared page" bullet) and
  `tests/app/inventory.js`. These are textual overlaps, not design ones:
  the task that ships second rebases. Run the two implementations one
  after the other, never in one working tree at once.
- This plan adds `gmOnly` to `TableEntry` and a `gmOnly` prop to `RowMain`
  (the 45% art and the visually hidden state text); TASK 71 keeps both
  when it changes those files.
- Neither plan depends on the other's order.

## 10. Risks and assumptions

- A players' page can still see that something changed: the revision and
  «Обновлено N назад» move on a GM-only edit, as they do today on a GM-note
  edit. They also move when the owner edits an own item, a source or a
  card that only a GM-only entry references: `homebrew_items_touch`,
  `homebrew_books_touch` and `homebrew_cards_touch` bump the revision of
  every list that holds a reference. Accepted; no entry data leaks. The
  decision file records both cases.
- The mark reaches players after the write buffer's 2 s quiet window plus
  the broadcast, about 3 s. Accepted as "immediately"; the toggle does not
  bypass the buffer.
- `create_purchase_request` keeps one answer (`stale`) for "absent" and
  "GM-only", so it is not an oracle.
- On the GM's link a GM-only row with no GM note shows its state only by
  the dashed border, the darker ground and the dimmed art (the owner's
  choice); screen readers get the hidden text.

## 11. Batches and gate cost

Split criteria (`CLAUDE.md`, "Task and session protocol"):
- B1 / B2: no shared component, filter or seed - B1 runs the database and
  port gates (`check:db`, then `db:push` and `npm run e2e` after the
  review), B2 the browser suites - and B1's SQL is a security boundary
  that its own review holds. The task is one commit pushed once at
  closeout, so B1 is never deployed alone; the accepted cost of the split
  is one more `npm run check` (about 10 min).
- B3: a public-contract change (`import-v3`), its own batch by the rule.
  It changes no screen and needs no database gate: its SQL is in B1.

Order: B1, B2, B3. B3 depends on B1 only; B2 and B3 can swap if the
owner wants the file first.

Gate cost, from `.claude/README.md`, "Batch size and the fixed cost of a
run" (host figures, 2026-09-26/27; the contracts suite is an estimate):

| Batch | Gates | Cost |
|---|---|---|
| B1 | `npm run check` (400-600 s), `npm run check:db` (430-550 s), after review: `npm run db:push -- --project test --yes` (about 60 s), `npm run e2e` (about 110 s) | about 1000-1320 s |
| B2 | `npm run check` (400-600 s), `npm run check:built` (about 25 s), `node tests/run-all.js app/print,app/contracts,app/states,app/typo,app/hues,stub` (about 430 s), golden re-seed in 4 shards (about 760 s), `node tests/app/sweep.js 360` and `1180` (about 900 s) | about 2515-2715 s |
| B3 | `npm run check` (400-600 s), `node tests/run-all.js contracts,dataint` (about 60 s, not measured) | about 460-660 s |
| Total | | about 3975-4695 s, 66-78 min |

Merging B2 and B3 would save one `npm run check` (about 10 min) but
would put a contract change into a screen batch, which the split rule
forbids.

### B1 `gm-only-schema` (implement-ready)

Objective: store the GM-only mark, filter it out of the players' link and
the players' purchase requests, carry it through the GM's link, the clone,
the write buffer, the import call, the account read and the fake cloud.
No screen changes.

In scope: the migration and its reversal; DB tests; the port, the fake,
the contract case; `lib/` and `state/` data paths; the FEATURES text for
the server rules; the decision file.

Out of scope: every `.svelte` file, `dict.ts`, `tests/app/`, the lists
file's schema, validator and export (B3).

Files:
- new `supabase/migrations/20261007120000_list_entry_gm_only.sql`
- new `supabase/reversals/20261007120000_list_entry_gm_only.sql`
- `tests/db/list-shares.test.mjs`, `tests/db/list-writes.test.mjs`,
  `tests/db/purchase-requests.test.mjs`, `tests/db/import-lists.test.mjs`
- `app/src/lib/cloudLists.ts`, `app/src/lib/listLink.ts`,
  `app/src/lib/lists.ts`, `app/src/state/cloudLists.svelte.ts`,
  `app/src/ports/supabase.ts`, `app/src/ports/fake-cloud.ts`,
  `app/src/ports/fake-cloud-seed.ts` (type only), `app/src/ports/cloud.contract.ts`
- tests: `app/src/lib/cloudLists.test.ts`, `app/src/lib/lists.test.ts`,
  `app/src/state/cloudLists.test.ts`, `app/src/lib/bundle.test.ts`,
  `app/src/ports/fake-cloud.test.ts`, `app/src/ports/supabase.test.ts`
  (it pins the `list_entries(...)` select string that step 11 changes)
- `docs/specs/FEATURES.md` ("Account and browser lists": "The shared
  page", "Purchase requests: the send")
- `docs/specs/COVERAGE.md`: contract cases "A-O" become "A-P" for the
  real adapter; the new cases of the `list-shares`, `list-writes`,
  `purchase-requests`, `import-lists` and `fake-cloud` suites it owns
- new `docs/decisions/<B1 day>-a-gm-only-entry-is-dropped-by-the-share-projection.md`,
  then `node tools/decisions.js` (rebuilds `docs/DECISIONS.md`)

Steps:
1. Migration, in this order, each function as `create or replace` with its
   current body copied from its newest definition and only the named
   change:
   a. `alter table public.list_entries add column gm_only boolean not null
      default false;`
   b. `apply_list_writes(jsonb)` (body from `20260925130600_list_writes.sql`):
      add `gm_only boolean` to the `jsonb_to_recordset` column list and
      `coalesce(x.gm_only, false)` to the insert's select and column list;
      add `'gm_only'` to the `update_entry` allowed keys and
      `gm_only = case when v_patch ? 'gm_only' then (v_patch ->>
      'gm_only')::boolean else e.gm_only end` to its update. A JSON null
      `gm_only` in a patch fails the not-null constraint and answers that
      write `ok: false`, as a null quantity does today.
   c. `get_shared_list(text)` (body from `20261001130000_homebrew_relations.sql`):
      aggregate over a subquery aliased `e`: `from (select e.*,
      row_number() over (order by e.position, e.id) - 1 as ord from
      public.list_entries e where e.list_id = v_list.id and (v_gm or not
      e.gm_only)) e`; write `'position', e.ord` and `order by e.ord` in
      `jsonb_agg`; append `jsonb_build_object('gm_only', e.gm_only)` inside
      the existing `case when v_gm` branch beside `gm_note`. Every other
      line of the copied body stays byte-identical to `20261001130000`'s,
      so the up and down diff is the named change only. Keep `stable`,
      `security definer`, `search_path` and the grants.
   d. `clone_shared_list(text, uuid)` (body from `20260930130000_homebrew.sql`):
      add `gm_only` to the entry insert's column list with
      `coalesce((e ->> 'gm_only')::boolean, false)`.
   e. `create_purchase_request(uuid, text, jsonb)` (body from
      `20260928120000_purchase_requests.sql`): in the stale check's inner
      `exists` and in the price subquery add `and (v_share.audience = 'gm'
      or not le.gm_only)`.
   f. `import_lists(jsonb)` (body from `20260930120000_import_lists_ceiling.sql`):
      add `gm_only boolean` to the entries' `jsonb_to_recordset` column
      list and `coalesce(x.gm_only, false)` to the insert.
   g. Keep each function's grants as its newest definition left them (a
      `create or replace` keeps them; re-issue a line only where the
      newest file did).
   Header comment: what the migration does, `docs/specs/FEATURES.md`,
   "Account and browser lists", and the decision file.
2. Reversal: restore the five previous bodies verbatim (same sources as
   step 1), then `alter table public.list_entries drop column gm_only;`.
   Header comment: every GM-only entry shows on players' links after it;
   revert the app first (as `supabase/reversals/20261002120000_read_scale.sql`
   says).
3. `tests/db/list-shares.test.mjs`: a list of four entries, the second and
   fourth GM-only. Players' token: two entries, positions 0 and 1, no
   `gm_only` key, no `gm_note` key, a GM-only homebrew reference's snapshot
   absent. GM token: four entries, positions 0-3, `gm_only` true on two
   and false on two. `get_shared_list(text, bigint)` with the old revision
   after a toggle answers the full projection. Clone from the players'
   token: two entries, `gm_only` false. Clone from the GM token: four
   entries, two GM-only.
4. `tests/db/list-writes.test.mjs`: `update_entry` with `{gm_only: true}`
   stores it and bumps the revision once; `add` and `create` with
   `gm_only: true` store it; an entry without the key stores false; a
   patch key `hidden` is still refused as an unknown field.
5. `tests/db/purchase-requests.test.mjs`: a players' token request naming
   a GM-only item answers `request: stale` and inserts nothing; the same
   request through the GM token is stored with the entry's price.
6. `tests/db/import-lists.test.mjs`: an imported entry with `gm_only: true`
   is stored GM-only; one without the key is stored false.
7. `app/src/lib/cloudLists.ts`: `EntryRow.gm_only?: boolean` (doc: absent
   reads as false; every read names it); `EntryPatch` picks `gm_only`;
   `entryMetaOf` sets `m.gmOnly = true` when `e.gm_only`; `entryRowsOf`
   writes `gm_only: true` only when `m.gmOnly` is true and writes no key
   otherwise (the database default is false) - the same rule as B3's
   export. A row of a shown entry is byte-identical to today's, so
   `BATCH_BYTES` and the op payloads the existing tests pin do not change.
   `SharedRow` needs no edit (it derives from `EntryRow`).
8. `app/src/lib/listLink.ts`: `ListEntryMeta.gmOnly?: true` with a doc line:
   an account list's entry only; the `#/l/` codec never reads or writes it.
   Confirm `encodeListRaw`, `decodeList`, `findListByPayload` and `withIds`
   name their fields explicitly (they do at `d997f4f0`), so the key never
   travels into a `#/l/` payload or an add.
9. `app/src/lib/lists.ts`: `withMeta`'s `field` union adds `'gmOnly'`, its
   `value` type adds `boolean` (false deletes the key, as 0 and '' do).
10. `app/src/state/cloudLists.svelte.ts`: `setGmOnly(id: string, entryId:
    string, on: boolean): void` - the `setMeta` shape: `#change` with
    `withMeta(l, entryId, 'gmOnly', on)`, then `#enqueue({ key:
    \`entry:${rowId}:gmOnly\`, list: id, write: { op: 'update_entry', id:
    rowId, patch: { gm_only: on } } })`. `restoreEntry` needs no edit: the
    meta it gets carries `gmOnly` into `entryRowsOf`.
11. `app/src/ports/supabase.ts`: the list select names
    `list_entries(...,gm_note,gm_only)`; update the pinned select string
    in `supabase.test.ts`.
12. `app/src/ports/fake-cloud.ts` mirrors the database: `seedLists` reads
    `SeedEntry.gmOnly` (add `gmOnly?: true` to the seed type in
    `fake-cloud-seed.ts`; no seed data changes); `updateEntry` accepts
    `gm_only`; `insertEntries`, `createList` and `import` keep it (default
    false); `moveList` writes false; `projection` filters and renumbers as
    step 1c; a GM share writes `gm_only` on every entry, `false` included,
    as the SQL does; a players' share strips `gm_only` from each entry (the
    projection spreads `...rest` of the held row today, which would leak
    the key); `clone` copies `gm_only` from the projection; `requestSend`'s
    `stock` excludes GM-only entries for a players' share. No test switch
    in B1 (`playEntry` is B2's, with its first caller).
13. `app/src/ports/cloud.contract.ts`: case P "GM-only entries", appended
    after O and named in the header comment: the owner writes a list of
    three, one `gm_only`; the players' read omits it, renumbers, and holds
    no `gm_only` key at any depth (a walk like `hasGmNote`); the GM's read
    has `gm_only === true` on the marked entry and `gm_only === false` on
    each shown entry; an `update_entry` un-marks it and the players' read
    shows it; a players' request for a GM-only item is `stale`; an
    `import` row with a `gm_only` entry reads back GM-only. So the fake and
    the hosted project cannot drift.
14. Unit tests: `cloudLists.test.ts` (`entryMetaOf`, `entryRowsOf`,
    `sharedListOf` with a GM row carries `gmOnly`; a players' row has
    none); `lists.test.ts` (`withMeta` gmOnly on and off; `withIds` drops
    gmOnly); `state/cloudLists.test.ts` (`setGmOnly` enqueues one
    coalesced `update_entry`; a removal's undo writes `gm_only: true`
    back; an add from a GM-link selection writes no `gm_only` key; a
    `create` or `add` row of a shown entry has no `gm_only` key);
    `bundle.test.ts` (until B3, an export of a GM-only entry writes no
    `gm_only` key and stays `import-v1`; B3 replaces this case);
    `fake-cloud.test.ts` runs case P.
15. FEATURES.md, "Account and browser lists": in "The shared page" add
    that a players' link never holds an entry marked «Только для мастера»
    (the server leaves it out; the count, rows and selection know only the
    rest) and a GM's link shows it; that «Сохранить себе» keeps the mark
    from a GM's link; in "Purchase requests: the send" that a players'
    link's request for such an item is refused as «Список изменился...».
    Write the decision file (template `.claude/templates/decision.template.md`;
    the rejected list of section 4; the risk of section 10 that a players'
    page sees the revision move) and run `node tools/decisions.js`. The
    file also records B3's version rule - a lists file is version 3 only
    when a list of the file holds a GM-only entry - with its rejected
    alternative, always version 3, which would break both data-zip pins
    (the rule of `2026-10-02-a-lists-file-is-version-2-only-when-it-holds-homebrew.md`).

Acceptance:
- A players' `get_shared_list` answer holds no GM-only entry, no `gm_only`
  key, and positions 0..n-1 (DB test and case P).
- A GM's answer holds every entry with `gm_only` (DB test and case P).
- `clone_shared_list` keeps the mark from a GM's link and has nothing to
  keep from a players' link (DB test).
- `create_purchase_request` through a players' link refuses a GM-only item
  as `request: stale`; through a GM's link it accepts it (DB test).
- `apply_list_writes` stores `gm_only` on `update_entry`, `add` and
  `create`, and an omitted key stores false (DB test).
- `import_lists` stores `gm_only` from an entry and false without it (DB
  test and case P).
- The reversal restores the previous schema (`reversibility.test.mjs`).
- The fake answers case P the same as the hosted project (`npm run test`,
  then `npm run e2e`).
- `setGmOnly` coalesces repeated presses into one write; an undo of a
  removed GM-only entry writes it back GM-only (unit tests).
- No `#/l/` payload or add-to-list write carries the mark (unit tests).
- FEATURES.md states the server rules; the decision file exists and
  `docs/DECISIONS.md` lists it.

Standing checks:
1. Scale: no screen changes. The projection filters one indexed list (at
   most 100 entries by default, 300 at 3x, 5000 per write ceiling); the
   window function adds one sort the aggregate already did. Not
   applicable otherwise - B1 draws nothing.
2. Error scenarios: section 6 rows "Failed write", "Conflict", "Entry
   deleted", "Stale tab", "Frontend revert" and "Down migration" apply to
   the stored shape; B1 adds no screen state. The down migration drops
   every mark (the plan-review trigger).
3. Consistency: not applicable - no screen, string or toast in B1. The SQL
   follows the existing function shapes (security definer,
   `search_path`, grants) and the `gm_note` audience rule.
4. RU/EN parity: not applicable - no string in B1.

Verification (in order):
1. `rtk npm run check` (one foreground call, Bash timeout 600000).
2. `npm run check:db` through the PowerShell tool.
3. After the batch review approves: `npm run db:push -- --project test --yes`,
   then `npm run e2e`.

Risks and do-nots:
- Copy each redefined body from its newest definition; an older body
  drops the homebrew snapshot fill or the relations cards.
- Keep `get_shared_list(text)` the only builder of the projection; the
  `(text, bigint)` wrapper and `clone_shared_list` call it.
- Do not add a policy on `list_entries` for non-owners.
- Do not name the column `hidden`: the app's one name is "GM only".
- Do not push to production; `migrate-prod` is CI's.

### B2 `gm-only-ui` (outline; expanded when B1 closes)

Objective: the screens of section 4, the strings, the browser states, and
the screen spec text.

Files (expected):
- `app/src/components/ListPage.svelte`: the toggle in `.lrow-acts`, the
  `.lrow.gm-only` class and rules (dashed `--line2` border, `--bg2`
  ground), the sub count, the selection-bar action, its toast with undo,
  `shareList` gets the GM-only filter.
- `RowMain.svelte`: a `gmOnly` prop - the art at 45% and the visually
  hidden «Только для мастера» after the name, inside the item's button.
  No visible text.
- `TableRows.svelte`: `TableEntry.gmOnly`, passed to `RowMain`, and the
  `.row.gm-only` class and rules (the same two declarations as the list
  page).
- `SharedListPage.svelte`: `gmOnly` per entry from the meta; the owner line
  count from `app.cloudLists` on a players' link, only while N > 0.
- `SharePanel.svelte`: the hint string; the players' copy toast reads the
  new key `playersShareCopied` in place of `playersLinkCopied` (below).
- `app/src/ports/fake-cloud.ts`: the test switch `playEntry(listId:
  string, itemKey: string, patch: EntryPatch): boolean` on `FakeCloud`
  (the `play` shape: another device edits one entry, with its messages),
  with a `fake-cloud.test.ts` case; its first callers are the browser
  states below (moved from B1, review N4).
- `app/src/lib/share.ts`: `shareList` skips `gmOnly` entries.
- `app/src/lib/dict.ts`, RU and EN: `gmOnlyOf` «Только для мастера: %s» /
  "GM only: %s"; `gmOnlyN` «только для мастера: %n» / "GM only: %n";
  `gmOnlyHide` «Скрыть от игроков (%n)» / "Hide from players (%n)";
  `gmOnlyShow` «Показать игрокам (%n)» / "Show to players (%n)";
  `gmOnlyHidden` «Скрыто от игроков: %n» / "Hidden from players: %n";
  `gmOnlyShown` «Показано игрокам: %n» / "Shown to players: %n";
  `ownGmOnly` «Только для мастера: %n - по этой ссылке их не видно.» /
  "GM only: %n - this link does not show them."; `shareHint` changed to the
  section 4 text; `noteHid` reused for the toggle title and the hidden
  state text.
- The share panel's copy toasts name both the GM notes and the GM-only
  items, in the hint's words (owner, 2026-10-06, review N8):
  - new `playersShareCopied`: «Ссылка для игроков скопирована - заметок и
    позиций «Только для мастера» в ней нет» / "Players' link copied - it
    carries no "GM only" notes or items".
  - changed `gmShareCopied`: «Ссылка для мастера скопирована - в ней есть
    заметки и позиции «Только для мастера»» / "GM's link copied - it
    carries the "GM only" notes and items".
  - The tail «в ней есть заметки и позиции «Только для мастера»» / "it
    carries the "GM only" notes and items" is the reusable phrase: TASK 71
    reuses it word for word in its filter-link toast. Write it whole in
    each string (no fragment key yet); the task that ships the second use
    may extract it.
  - Unchanged: `playersLinkCopied` and `gmLinkCopied`. They serve only the
    `#/l/` links of browser lists (`ListPage.svelte` «Ссылка игрокам» /
    «Ссылка себе», `ListsPage.svelte`), which hold no GM-only entry and
    retire on 2026-10-26.
  - Tests: `sharePanel.test.ts` reads both keys. Affected goldens: none -
    no golden in `tests/app/snapshots/` draws either toast at `d997f4f0`
    (grep), and B2 adds no state for them.
- Tests: `listPage.test.ts`, `sharedListPage.test.ts`, `sharePanel.test.ts`,
  a `RowMain` case (in `record.test.ts` or `tables.test.ts`, wherever
  `RowMain` is covered), `lib/share.test.ts`; `tests/app/inventory.js` and
  re-seeded goldens (the three share-panel goldens change with the hint).
- FEATURES.md: the screens, «Скопировать текст»; the Consistency rules
  departure (the row toggle has no toast, as the note toggle).

Browser states (new, `tests/app/inventory.js`):
- `#/lists/<uuid(101)> ~ gm only as gm1`: press the toggle of the seed's
  `di11` row («Только для мастера: <its RU name>»): the pressed toggle,
  the dashed row, the sub count.
- `#/lists/<uuid(101)> ~ gm only ticked as gm1`: two rows ticked, one
  GM-only: «Скрыть от игроков (2)» in the bar.
- `#/lists/<uuid(101)> ~ gm only hidden as gm1` (timed): after the bar
  action, the toast «Скрыто от игроков: 1» with «Вернуть».
- `#/s/player-token-1 ~ gm only live`: after `fake('playEntry', uuid(101),
  'di11', { gm_only: true })` while the topic is joined: eight rows, «8
  позиций», «Список обновлён».
- `#/s/gm-token-1 ~ gm only`: the same edit; nine rows, the `di11` row
  dashed and dimmed, its button's name ends with the hidden state text.
- `#/s/player-token-1 ~ gm only as gm1`: the owner line with
  «Только для мастера: 1 - по этой ссылке их не видно.»
- N = 0 needs no new state: the existing `#/lists/<uuid(101)> as gm1` and
  `#/s/player-token-1 as gm1` goldens stay byte-identical and prove the
  absent counts.

States table (completed in the B2 expansion):

| State | Owner page | Players' link | GM's link | Proof |
|---|---|---|---|---|
| empty list | no toggle, no count | unchanged | unchanged | unchanged |
| none GM-only (N = 0) | today's sub, eye unpressed | unchanged | unchanged | existing goldens unchanged |
| one entry, GM-only | dashed row, pressed eye, «1 позиция из 100 · только для мастера: 1» | «0 позиций», no rows | one dashed row | unit + golden |
| many (10, 2 GM-only) | two dashed rows in place, order kept | 8 rows renumbered | 10 rows, 2 dashed | golden |
| at the limit (100, all GM-only) | «100 позиций из 100 · только для мастера: 100» | «0 позиций» | 100 dashed rows | unit |
| one past the limit | the 101st add refused as today | unchanged | unchanged | unchanged |
| 3x (300 by override) | as at the limit; a bar action over 300 ticks sends 300 writes, split by `BATCH_OPS` into 2 requests | as at the limit | as at the limit | unit |
| longest name | the name wraps inside the dashed row | - | same | sweep 360 |
| 360 px | the action row: note, eye, cross, 44 px each | unchanged rows | dashed rows | sweep 360 |
| 1180 px | the action column of three | unchanged | dashed rows | sweep 1180 |

Acceptance lines inherited by B2 (each its own line in the B2 expansion):
- Every state in the table above and each new inventory state has a golden
  or the named proof.
- No visible text marks a GM-only row on any page; the item's button
  carries the visually hidden state (component test).
- The sub count and the owner line are absent at N = 0 (component tests
  and the unchanged goldens).
- The toggle and the bar action pass axe (`expectNoA11yViolations` with the
  pressed state).
- RU/EN parity for every key in the B2 file list.
- «Скопировать текст» on an account list leaves GM-only entries out.
- The share panel's players' toast says the link carries neither the GM
  notes nor the GM-only items, and the GM's toast says it carries both, in
  RU and EN (`sharePanel.test.ts`).
- Consistency rules followed: 5 (a bulk change toasts «<Причастие>: N»),
  10 (undo on the bulk change, as «Цены»), 14 (text), 16 (long names).
  Departure to name: the row toggle has no toast (as the note toggle).

### B3 `import-v3` (outline; expanded when B2 closes)

Objective: the lists file keeps the GM-only mark as `import-v3` (section
4). A public contract change: `CONTRACTS.md`, `docs/fixtures/`,
`tests/contracts.js` and `llms.txt` change in this batch. No new screen
state and no SQL change (B1 holds `import_lists`); the two import refusal
texts name the new version.

Files (expected):
- new `schema/import-v3.json` (section 4; `import-v2`'s definitions copied,
  the entry gains `gm_only`).
- `app/src/lib/bundle.ts`: the v3 URL constant, the validator reads
  versions 1-3 (`gm_only` allowed only in v3), the export writes
  `gm_only: true` and chooses the version by section 4's rule; import
  rows carry `gm_only` to `import_lists`. `app/src/lib/bundle.test.ts`
  (replaces B1's "no `gm_only` in an export" case), `importPanel.test.ts`
  (the refused-version case reads `v4.json`).
- `app/src/lib/homebrewFile.test.ts`: v3's `eq` and `key` copies stay
  deep-equal to `homebrew-v1.json`'s.
- `docs/fixtures/import/`: new `example-v3.json` (a list with a GM-only
  entry and a homebrew entry), `errors-v3.json` (`gm_only` not a boolean;
  `gm_only` in a version 2 file), `export-v3.json` (gm1's lists with one
  GM-only entry, written by the export); `v3.json` renamed to `v4.json`
  with `version` 4 (the refused "another version" file). Every fixture
  canonical (`JSON.stringify(v, null, 2) + '\n'`). The two data-zip pins
  stay byte for byte.
- `tests/contracts.js`: the import-v3 schema checks (`$id`, format,
  version const 3, closed objects, bounds, `gm_only` boolean), the
  fixtures, the `llms.txt` section.
- `llms.txt`: a section "### Version 3: GM-only entries (import-v3)": what
  `gm_only` means, that the export writes it only as `true`, and that a
  file without it should stay version 1 or 2.
- `app/src/lib/dict.ts`, RU and EN: `importVersion` and `importNoVersion`
  name versions 1-3: «Приложение читает версии 1, 2 и 3.» / "The app reads
  versions 1, 2 and 3." (today «...версии 1 и 2.» / "...versions 1 and
  2."), the same facts in both languages. `importPanel.test.ts` reads the
  two strings and the `v4.json` fixture. No golden draws them at
  `d997f4f0` (grep of `tests/app/snapshots/`).
- `docs/fixtures/homebrew-file/README.md`: the hand-test row for
  `../import/v3.json` becomes `../import/v4.json` with the new text.
- `docs/specs/CONTRACTS.md`, in the same commit as the schema:
  - section 4: the `schema/import-v3.json` bullet, the version rule, the
    fixtures; "any other change is `import-v4.json`";
  - section 4, "All of them except the three `schema/` files": the count
    becomes four;
  - section 4, the data-zip bullet: `lists.json` is `import-v1`,
    `import-v2` or `import-v3` by the version rule;
  - section 5, "Static asset paths": add `schema/import-v3.json`.
- `docs/specs/META.md` (the published schema list),
  `tools/check-site.lib.mjs` (the schema id map) and
  `tools/check-site.test.mjs`, `.github/workflows/ci.yml` (the deploy
  step's published file list gains `schema/import-v3.json`).
- FEATURES.md "Exports" and "Import": the version rule, that the mark
  survives an export and an import, and "The import reads versions 1, 2
  and 3" in place of today's versions text; COVERAGE.md where it names the
  import-file suites.

Acceptance lines (each its own line in the B3 expansion):
- An export of a list with a GM-only entry is version 3 and holds
  `"gm_only": true` on that entry only; an import of it makes the entry
  GM-only (unit test; the import call is B1's case P).
- An export without a GM-only entry is byte-identical to today's v1 or v2
  output (unit test and the unchanged data-zip pins).
- A v1 or v2 file with `gm_only` is refused as an unknown field; a version
  4 file is refused as another version (unit tests, fixtures).
- `tests/contracts.js` passes over the schema, the fixtures and the
  `llms.txt` section.
- The refusal texts name versions 1-3 in RU and EN (`importPanel.test.ts`).
- `CONTRACTS.md` lists `schema/import-v3.json` in section 4 (the bullet,
  the count of four `schema/` files, the data zip's version rule) and in
  section 5.
- Standing checks: no new screen state (scale not applicable); error
  scenarios are section 6's stale-tab, revert and import rows;
  consistency: the two refusal texts keep their shape, only the version
  list changes; RU/EN parity: `importVersion` and `importNoVersion`
  change in both languages with the same facts.

Verification: `rtk npm run check`; `node tests/run-all.js contracts,dataint`.

## 12. Owner answers

Answered 2026-10-06:
- Q1: the GM's link shows GM-only entries, marked by the row look.
- Q2: «Только для мастера» / "GM only".
- Q3: the lists file keeps the mark - B3 `import-v3`.
- Q4: the selection-bar action with undo stays.
- Mock feedback: no flag line (no text marker on any page); the example GM
  note is only a note; no counts at N = 0; the share hint names both the
  GM notes and the GM-only items for the players' link.
- Q5: `import-v3` gets no blind-round fixture (no `from-llms-v3.json`);
  v3 adds one optional boolean.

## 13. Deferred

- A hidden list note or per-player visibility: not asked for.
