# Shared task context - TASK persist-7h-homebrew-page

Orchestrator (or first worker) maintains this file so later steps do not re-fetch the same sources.

## Goal
- R7h: small fixes to the homebrew pages, split from R7d by the owner
  (2026-10-02) so R7d's import and export go live first. After R7d, before
  R9 (roadmap row in `issues/persistent-storage/plan.md`, written by the
  orchestrator).
- Widened by the rework W1-W6 (below); six batches `B7h.1`-`B7h.6`
  (`plan.md`, re-planned 2026-10-06). The six page fixes of 2026-10-02 stay
  as `plan.md` 2.1-2.6, placed in `B7h.5` and `B7h.6`.

## GitHub issue (if any)
- URL: none (owner requests in chat, 2026-10-02).
- Captured or last verified: 2026-10-02.
- Title: -
- Summary (facts only): `issues/owner-afk-2026-10-02/decisions.md`, "Owner
  read-back", points (1)-(5) of the R7d `B7d.2` list, and the help removal
  above them.
- Decisions already settled:
  - Help: a «?» explains what the site does with a field or a site
    constraint, never a basic game term (users know the rules). Remove it from
    «Ранг» (both kinds) and «Урон».
  - (1) Search box on `#/homebrew` from the eighth item: `SearchBox`, the
    lists-page pattern (`LIST_SEARCH_AT`, folded as search folds, both
    languages), headings with no match hidden, «Ничего не найдено», select-all
    and bulk actions on drawn rows only, ticks a subset of drawn rows.
  - (2) «N предметов из M» moves to the head of the rows next to «Выбрать
    все», as on `#/lists`; rule 1 gains "a counter sits at the head of the
    collection it counts".
  - (3) Measure `#/homebrew` at 300 items; paging or folded sections only
    if slow.
  - (4) The «Карты» fold gets the same search box from the eighth card; pays
    the `DEBT.md` D84 line on `HomebrewCards.svelte`.
  - (5) The «Хоумбрю» chip leaves `#/search`'s kind row (with it on,
    unpressing the last kind is refused «Нужен хотя бы один тип», which reads
    as a bug) and becomes a labelled switch «Свои предметы» / "My items", on
    by default, apart from the filter chips; the same control in the
    equipment tables' toolbar. `STATE.md`: memory only, unchanged.
- Change-log expiry (owner, 2026-10-06): an entry expires 1 hour after it
  is read, or 30 days after it was created if nobody reads it.
- Purchase request expiry (owner, 2026-10-06, Q2 = B): a request expires
  1 hour after it is read, or 30 days after it is created; «Принять» works
  until then; a stale apply and unread requests against the limit of 10
  are accepted.
- Conversion (owner, 2026-10-06, Q1): rule 3 dropped; a frozen copy the
  list owner does not hold is deleted after an assert of at most one.
- Production counts (owner, read-only, 2026-10-06): `homebrew_items` 30,
  authors 2, books 5; homebrew `list_entries` 8 - 7 references to the list
  owner's own items, 1 frozen copy whose key no account holds (376 bytes,
  the owner's own test list: "it's mine, it's safe to delete"); no row
  links another account's item; no list owner holds two snapshot variants
  of one key.
- Open questions: none.

## Screenshot / attachment findings
- Owner screenshots 01 and 02 (below). Mocks m01-m05 (planner, 2026-10-02
  and 2026-10-06; `mocks/index.html`).

## Key paths
- Specs: `docs/specs/FEATURES.md` ("Tables and search" - "The «Хоумбрю»
  chip"; "Homebrew"; "Consistency rules" 1 and 15), `STATE.md` (Filters
  row), `COVERAGE.md`, `DEBT.md` D84.
- Code hot paths: `components/HomebrewPage.svelte`, `HomebrewCards.svelte`,
  `HomebrewEditor.svelte`, `SearchPage.svelte` (the kind `ChipRow`),
  `TablesPage.svelte` (the toolbar), `ListsPage.svelte` (the sibling
  pattern), `SearchBox.svelte`, `Chip.svelte`, `lib/lists.ts`
  (`LIST_SEARCH_AT`, `matchLists`), `lib/homebrew.ts` (`groupsOf`),
  `lib/homebrewForm.ts` (`cardMatches`), `state/app.svelte.ts`
  (`homebrewShown`, `toggleHomebrew`, `sel`), `lib/dict.ts`.
- Mocks: `issues/persist-7h-homebrew-page/mocks/index.html`.

## Command costs

Measured on this host (R7d's `context.md`, 2026-09-27 to 2026-10-02).

| Command | Wall clock | Fits one call? |
|---|---|---|
| `npm run check` | 7-10 min | yes, `rtk npm run check` with timeout 600000 (may background and arm the gate by its exit) |
| `npm run check:built` | about 2 min with `build:test` | yes |
| `node tests/run-all.js app/states` / `app/contracts` | 4-6 min / 7-9 min | one suite per call |
| `node tests/app/sweep.js <width>` | 7-9 min at 360 | yes |
| `node tests/app/golden.js --shard=n/4` | about 3.2 min per shard | yes, one shard per call |

## Which machine is authoritative
- For recorded numbers (visual debt, timings): this host (the 300-item
  measurement records the host and the date).
- What a difference on another machine means: a CI timing is not compared
  with the threshold.

## Reasons already disproved
- None.

## Constraints
- Contracts / parity / i18n notes: no route, contract or stored shape
  changes; every new string RU and EN; the switch state stays memory only
  (`STATE.md`); a new state needs an inventory entry and a re-seeded golden
  in the same change.
- Base: R7d closed and pushed (its `B7d.2` adds «Переместить (N)» and
  «Скачать JSON (N)» to the strip and the import states to `#/homebrew`).
  Refresh this plan against the tree after R7d's closeout.

## The rework merged into R7h (owner, 2026-10-03)

The owner's feedback after the R7d hand test (2026-10-02) joins this release;
the planner decides how to batch it (`plan.md` section 7).

### Owner feedback (2026-10-02, verbatim intent)
1. Sharing model. The GM view and the player-link view of one item differ a
   lot (screenshots 01, 02). The snapshot and link logic is overcomplicated.
   Items need not be as private as lists: sharing by a link with the item id
   is enough. Adding someone's item to a list: either add it live and "live
   with the consequences" - with a change log in the list ("an item in your
   list changed", "an item in your list was deleted"), dismissable and
   auto-cleared after the first read, like purchase requests - or make a copy
   that is fixed in time. Goals: no separate share links per item, every link
   in a relation resolves, no snapshotting, a smaller database.
2. Backend cleanup. A purchase request whose `expires_at` was
   2026-09-30 13:50:48.612518+00 is still stored. Wanted: a scheduled backend
   job (the owner suggests an Edge Function) that removes stray rows like
   this, and a rule that lifecycle logic of this kind lives on the backend,
   not in the frontend.
3. Navigation for relations. Links to an item's references (rule cards,
   sets), possibly with add and remove of items in a set or rule card. The
   owner expects this to clutter the item card, and proposes separate pages
   (tabs): Items, Sources, Sets, Rules, each managing its own kind. Import
   should stay one entry point that creates all of these; four import flows
   are too many. Export needs a matching organisation.
4. Import preview detail. Lines such as «Предметов и карт, которые уже есть
   в аккаунте: 8.» do not say what changes. Show at least the item names that
   will be skipped or replaced (not a full diff).

### Screenshot findings (`screenshots/` in this directory)
- 01 (GM, own item «Скатка следопыта», source «Привал у костра (HB)»): draws
  «Получается из» Скатка путника, «Улучшается до» Скатка стража, «Комплект»
  with the members (Подушка из мха, Походный плед, Скатка следопыта) and the
  set bonus; buttons «Отправить», «Текст», «Добавить в список», «Печать»,
  «Изменить».
- 02 (player opening the same item from a shared list link, a frozen copy):
  only «Улучшается до» Скатка стража and the set bonus; no «Получается из»,
  no set members; no «Изменить». So the frozen copy drops relations that the
  snapshot does not carry, and a related own item of the author is a name the
  player cannot open.
- Both draw the source tag as «(НВ)»/«(HB)» - check in the build that the
  marker is the Latin «(HB)» the decision fixed, not Cyrillic.

### What exists today (for the planner)
- Frozen copies: `list_entries.snapshot` (up to 131072 bytes per entry, 1 MiB
  per list, R7c/R7g), `homebrew_snapshot_of`, `snapshotOf`; lists file
  version 2 carries a snapshot per own-item entry (R7d, decision
  `2026-10-02-a-lists-file-is-version-2-only-when-it-holds-homebrew.md`).
- Item privacy: owner-only RLS on `homebrew_*`; D7
  (`docs/decisions/2026-10-01-homebrew-keeps-the-way-open-to-shared-books.md`)
  keeps the way open to shared books.
- Planned, not started, both affected by point 1: R9
  `issues/persist-9-item-share/` (a `homebrew_shares` table, `#/h/<token>`,
  «Сохранить себе») and R8 `issues/persist-8-media/` (art; frozen copies name
  the picture file). R7h `issues/persist-7h-homebrew-page/` (search, counter,
  «Свои предметы» switch, help removal) is affected by point 3 (tabs).
- Purchase requests: `expires_at` an hour after creation; expired is read,
  never stored (R4 design); R4b confirmed "request clean-up: no change". The
  local database log shows `pg_cron scheduler started`, so a SQL-side
  schedule may exist as an option beside an Edge Function.
- Edge Functions: R8 plans the first one (`delete-account`) with CI deploy
  and two project-scoped tokens (`SUPABASE_ACCESS_TOKEN` in `production`,
  `SUPABASE_ACCESS_TOKEN_TEST` as a repository secret; both set 2026-10-02).

### Constraints
- Public contracts default to no change: `#/s/`, lists files v1/v2,
  `homebrew-v1`, `llms.txt` are shipped. A change updates fixtures, tests,
  `CONTRACTS.md` and `llms.txt` in the same commit.
- Shipped frozen copies exist in production lists: any move away from
  snapshots needs a migration path for stored rows (no silent loss).
- RU/EN for every text; the consistency rules 1-16 in `FEATURES.md`.
- Scale target: 3x the default limits.

## Facts found by the re-plan (planner, 2026-10-06)

- Keys are unique per owner only (`unique (owner_id, key)`); a homebrew file
  imported into a second account carries the same keys. `homebrew_items.id`
  is a client-made uuid.
- Set membership and rule-card use live on the item (`content.set`,
  `content.refs`, at most 3); `homebrew_cards` holds only the card text,
  kind and source.
- `create_purchase_request` deletes decided rows (24 h after the decision)
  and pending expired rows (24 h after expiry) only when a new request is
  sent; no index on `decided_at` or `expires_at`. Revoked `list_shares` rows
  are never deleted. No `pg_cron` use exists in the repository; scheduled
  jobs are GitHub workflows (`backup.yml` 03:17, `usage.yml` 03:47 with
  `SUPABASE_DB_URL_PROD`, `previews.yml`).
- Functions that read or write `list_entries.snapshot`: `get_shared_list`,
  `clone_shared_list`, `apply_list_writes`, `import_lists`,
  `list_entries_snapshot_limit`, the homebrew touch and delete triggers,
  `list_entries_reference_exists`.
- `#/tables/homebrew`: the second slot is an anchor (section, source, `hb`
  or item key) or a filter `f_...` (groups `kind`, `src`, `sect`), never
  both; the facet panel has a `src` and a `sect` row and no `kind` row.
- The «(HB)» marker is Latin in `lib/dict.ts` (`hbTag`).
- Lifecycle audit: `plan.md` 2.7 (findings A1-A10 and their placement).

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
- You suspect drift vs issue or plan
