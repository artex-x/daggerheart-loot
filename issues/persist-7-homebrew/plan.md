# Plan - TASK persist-7-homebrew (release R7)

## Status

- Planning pass 1, 2026-09-25, planner, in a worktree from `da7378cb`
  (R2's local task commit; `B2.3` is being built in the main tree).
  Revised 2026-09-26 after the owner's answers (roadmap `context.md`,
  "Owner answers for R5 and R7"): homebrew entries are live references,
  the page is reached from the account menu, a delete warns with the
  count and removes the item from its lists.
- NEEDS_HUMAN_CONFIRMATION: no - Q1-Q3 of section 13 are answered (Q3 on
  2026-09-26: the source tag is «Хоумбрю» / "Homebrew").
- Batches: `B7.1` (schema, port, fake, pure logic), `B7.2` (the app:
  routes, the menu entry, editor, search group, references, print,
  delete), `B7.3` (bundle v2). `B7.1` is implement-ready; `B7.2` and
  `B7.3` are outlines that the refresh before the build expands, after
  R5b (the account menu), R3 and R6 have shipped.
- Refresh triggers before the build: R5b's account menu component and
  its item list (section 4.7), R3's `CapabilityEventsPort` and
  `lib/live.ts` message readers (section 4.6), R6's `lib/bundle.ts` and
  `import_lists` (section 4.8), `B2.3`'s final `SharedListPage.svelte`
  and `SharedView` (section 4.5).

## 1. Objective and current state

Release R7 adds homebrew items to a signed-in account: a record with the
same shape as an official record, made and edited in the app, found by
search under its own group, added to the owner's lists as a live
reference (an edit reaches every list holding it, shared pages
included), frozen into a snapshot when a copy leaves the account, printed
like any other card, exported and imported in bundle schema v2.

State at `da7378cb`: `list_entries.source` and `snapshot` exist and are
never written (`source` is always `official`, `snapshot` null; the CHECK
`(source = 'official') = (snapshot is null)` and the 16384-byte bound are
in `20260925130100_lists.sql`). `get_shared_list` and `clone_shared_list`
copy `source` and `snapshot` through. `limit_defaults` holds
`lists_per_owner` and `entries_per_list`; `effective_limit()` raises on
any other key. `CloudPort` has `auth`, `prefs`, `lists`. The fake cloud
seeds two users, four lists and two shares. `AppState.index` is built
once from `LOOT` and every page reads records through `index.byId`.
`Record_` (`app/src/lib/types.ts`) is the record shape; `data.js` is
canonical and this release does not touch it, `data.json`, `catalog.csv`
or `i/`. No record id starts with `hb` (checked over the 1272 ids).

Measured for the snapshot bound: the largest official record is 2466
UTF-8 bytes (`voa2_a3`), the longest description 838 characters.

Sibling plans read for the seams (their plan commits, 2026-09-25): R3
`c39f3de1` (the `owner:<uid>` topic carries `{ list, revision, by }`,
`lib/live.ts` reads messages, `CapabilityEventsPort.on.message(event,
payload)`); R6 `a22a4230` (`schema/import-v1.json`, `format`
`daggerheart-loot/lists`, `version` checked client-side, `import_lists
(p_lists jsonb)` passes `source` and `snapshot` through, `v2.json` is a
refused fixture); R5 `146be6ab` predates the account menu, which R5's
own revision adds.

## 2. Scope and non-goals

In scope: the `homebrew_items` table with owner-only RLS, the count limit
`homebrew_items_per_owner` (50), the reference and frozen-copy rule on
`list_entries`, the shared projection carrying the referenced content,
the `HomebrewRepository` port in the real adapter and the fake, the pure
module `lib/homebrew.ts`, the routes `#/homebrew`, `#/homebrew/new`,
`#/homebrew/<key>`, the account menu entry «Мои предметы» / "My items",
the editor, the "My items" search group, add-to-list as a reference, the
list page, the shared page and print drawing references and frozen
copies, delete with the count warning and the removal from lists,
account deletion by cascade, layer 1-4 coverage, the goldens, bundle
schema v2 (`B7.3`).

Non-goals (stay where the roadmap put them): art (R8), `#/h/<token>`,
clone and add from a link, print routes for cloud lists (R9), a Trash or
undo for a deleted item (deferred, decision 30), homebrew in the roll
tables or the book tables, upgrade lines, sets, crafts, referenced cards
and rarity on a homebrew record, turning a frozen copy into an own item
(R9's clone, from a list row), homebrew for a signed-out reader, the
account menu itself and "Display settings" (R5).

## 3. Existing behaviour and code paths

- Records: `app/src/lib/types.ts` `Record_`; `lib/i18n.ts` `nameOf`,
  `descOf` (Russian falls back to English per field, English never falls
  back), `eqLine`/`eqParts`; `lib/label.ts` `srcLabel` (a `switch` on
  `it.src` whose `default` returns the raw key), `printSrc`, `tableOf`
  (null for an unknown source), `cardBadges`; `lib/desc.ts` `artSrc`
  (`img/` + name, `_none.webp` fallback); `lib/print.ts` `glyphKey`.
- Index: `lib/data.ts` `buildIndex(loot)`; `Index.byId` is the one
  lookup every page uses (`RecordPage`, `RecordModal`, `PrintPage`,
  `ListPage` line 125, `SharedListPage` line 43, `ListsPage.knownItems`,
  `AddToList.knows`, `parseHash`'s `knows`); `Index.searchable` is what
  `SearchPage` filters; `Index.allEquip` and `rows` feed the tables.
- Search: `lib/search.ts` `matches(it, q, statLine, hay)`, `hayFor`
  memoised by id; `SearchPage.svelte` filters `index.searchable`, caps at
  300, draws `TableRows` in list view.
- Lists: `lib/cloudLists.ts` (`EntryRow` with `source` and `snapshot`,
  `toCloudList`, `entryRowsOf` writes `source: 'official', snapshot:
  null`), `state/cloudLists.svelte.ts` (optimistic queue, `refresh()` on
  focus and every 45 s), `AddToList.svelte` (`store.add(l.id, ids, knows,
  carried)`), `ListPage.svelte` (`byId` over `own.ids`),
  `SharedListPage.svelte` (`B2.3` adds the `#/s/` loader `SharedView`).
- Ports: `ports/types.ts` (`CloudPort`, `ListRepository`, `ListWrite`,
  `ListsRead`), `ports/supabase.ts` (one `from()`/`rpc()` per method),
  `ports/fake-cloud.ts` and `fake-cloud-seed.ts`, `ports/cloud.contract.ts`
  (`runCloudContract`, one case group per port member).
- Schema: `supabase/migrations/20260925130000_limits.sql`,
  `20260925130100_lists.sql`, `20260925130200_list_shares.sql`
  (`get_shared_list`, `clone_shared_list`), `20260925130300_lists_service_
  role.sql`; conventions in `issues/persist-2-lists/plan.md` section 4.2
  (every table `enable row level security`, `revoke all ... from public,
  anon, authenticated` before a grant, `create function` never `or
  replace`, `security definer`, `set search_path = public, pg_temp`, a
  comment naming the spec section, a reversal per migration, a stamp
  after the newest file; a changed function is dropped and created again
  in a new migration, the reversal restores the old body).
- Tests: `tests/db/lists.test.mjs` and `list-shares.test.mjs` (the
  matrix through `roles.mjs` `asRole`), `tests/app/inventory.js` (states
  with `as`), `tests/app/states.js` (pressed states), `tests/e2e/flows.mjs`
  (F0-F7) and `admin.mjs` (`listsOf`, `deleteListsOf`),
  `tests/e2e/contract.mjs` (runs `cloud.contract.ts`).
- Routes: `lib/hash.ts` `parseHash` (`#/i/[\w-]+` is a record; `#/lists/
  [\w-]+` a list; `#/account`), `ROUTES.md`, `CONTRACTS.md` sections 1
  and 2, `docs/fixtures/urls/routes.json`, `tests/app/contracts.js`,
  `llms.txt`.
- Header: `Shell.svelte` draws the account control (`.acct`) as a link to
  `#/account`; R5 turns it into the account menu («Настройки
  отображения», «Мои списки», «Выйти»); R7 adds «Мои предметы».
- Product text already uses «Хоумбрю» once: `dict.ts` `notePhHid` (the
  GM note placeholder). The privacy pages already name homebrew items.

## 4. Design

### 4.1 The record shape

A homebrew item is a `Record_` whose stored part is `HomebrewContent`:

```ts
/* lib/homebrew.ts - pure */
export interface HomebrewContent {
  kind: 'item' | 'consumable' | 'equip';
  en: string;   // 0..120 code points; at least one of en, ru non-empty
  ru: string;   // 0..120
  ende: string; // 0..3000
  rud: string;  // 0..3000
  tier?: 1 | 2 | 3 | 4;        // loot only, optional; equip carries eq.tier
  eq?: HomebrewEquip;           // present iff kind === 'equip'
}
export interface HomebrewEquip {
  t: 'weapon' | 'secondary' | 'armor';
  tier: 1 | 2 | 3 | 4;          // typed by the owner, never derived
  cls?: 'phy' | 'mag';          // weapon, secondary: required
  tr?: Trait;                   // weapon, secondary: required
  rg?: Range;                   // weapon, secondary: required
  dmg?: string;                 // weapon, secondary: required, /^d(4|6|8|10|12|20)([+-]\d{1,2})?$/
  dt?: 'phy' | 'mag' | 'any';   // weapon, secondary: required
  bu?: 1 | 2 | 'any';           // weapon: required; secondary: optional
  as?: number;                  // armor: required, 0..12
  th?: [number, number];        // armor: required, 1..99 each, th[0] <= th[1]
}
```

Field names are `Record_`'s own, so one shape serves the form model, the
database column, the frozen snapshot and bundle v2. Fields a homebrew
record never carries: `roll`, `craft`, `refs`, `set`, `frame`,
`community`, `starting`, `recall`, `line`, `alt`, `img` (R8 adds the
picture through `art_url`, section 11). `tier` on loot is the book's
`VoaTier` narrowed to 1-4: `A` and `C` are Vault of Ages categories, not
a thing a homebrew item claims. `kind === 'equip'` iff `eq` is present,
the rule `kindOf` already reads.

Validated enums: `kind`, `eq.t`, `eq.tier`, `eq.cls`, `eq.tr`, `eq.rg`,
`eq.dt`, `eq.bu`, `tier`. Free text: the four name and description
fields and `eq.dmg` (bounded by the regex). `validateDraft(content):
Problem[]` in `lib/homebrew.ts` and `public.homebrew_content_valid(jsonb)`
in SQL enforce the same rules; `docs/fixtures/homebrew/valid.json` and
`invalid.json` are run through both (layer 1 and layer 3), so the two
cannot drift.

Languages: both fields are optional and at least one name is required.
`toRecord()` fills a missing language from the other one (`en = c.en ||
c.ru`, `ru = c.ru || c.en`, the same for the descriptions), so a record
never draws blank in either language and `nameOf`/`descOf` need no
change. The stored content keeps only what was typed; the editor shows
the fallback as a placeholder, not as a value. Rejected: both languages
required - a GM at a Russian table writes one language.

`toRecord(key, content): Record_` returns `{ id: key, src: 'homebrew',
...content, en, ru, ende, rud }` with the fallbacks applied. `src:
'homebrew'` is a new source key: `srcLabel` gains a `case 'homebrew'`
returning `t.srcHomebrew` («Хоумбрю» / "Homebrew"; owner, section 13, Q3),
`tableOf` returns null for it already, `cardBadges` and `glyphKey` need
nothing, `printSrc` follows `srcLabel`.

Size: names 120 and descriptions 3000 code points per language; a
Cyrillic description is 2 bytes per character in UTF-8, so a maximal
record is about 3000 x 2 + 3000 + 2 x 120 x 2 + 300 (eq and keys) =
9.8 KB of JSON, under the 16384-byte snapshot bound with margin for the
snapshot's own keys and R8's `art_url`. The bound stays 16384; nothing
widens it. `content` carries the same bound as its own CHECK.

### 4.2 Keys, ids and addresses

`catalog_key` is `hb_` + 16 characters of lowercase base32 (`[a-z2-7]`),
80 random bits, made on the client (`newKey()` on the port: the real
adapter from `crypto.getRandomValues`, the fake from a counter so a
golden's key is fixed). The prefix is reserved in `CONTRACTS.md` section
2: no official record will ever start with `hb`. The shape fits
`list_entries.item_key` (`^[A-Za-z0-9_-]{1,64}$`), `#/i/[\w-]+` and a
`#/print/<ids>` address (19 characters per id, 180 ids fit the address).
Uniqueness is per owner: `unique (owner_id, catalog_key)`. A bundle
import keeps the keys it reads (a second import of the same bundle
creates nothing); R9's clone makes a new key for the cloner. The row's
own `id` is a client-made UUID, as `lists.id` is, so a retried create
inserts nothing twice.

`#/i/<key>` for a `hb_` key resolves in the app to the owner's item
through the merged index (section 4.4); signed out, or for a key the
account does not hold, it draws today's not-found record page. No stub
page `i/hb_<key>.html` exists: `recordUrl()` for a homebrew id returns the
app address (`appUrl(site, '#/i/<key>', lang)`) so copy-link and share
carry an address that opens for the owner, and R9's `#/h/<token>` is the
address for everyone else.

### 4.3 Schema and RLS (`B7.1`)

One migration `<stamp>_homebrew.sql` (the next free minute after the
newest file on the day, `.claude/README.md`, "Migration names") and one
reversal.

```sql
-- Validates a homebrew record's stored content (docs/specs/FEATURES.md,
-- "Homebrew"). Immutable, so a CHECK may call it.
create function public.homebrew_content_valid(p jsonb)
returns boolean language plpgsql immutable set search_path = public, pg_temp as $$ ... $$;
-- rules: p is an object; kind in ('item','consumable','equip'); en, ru,
-- ende, rud are strings (char_length <= 120, 120, 3000, 3000); en or ru
-- non-empty after btrim; tier absent or in 1..4 (a number); eq present
-- iff kind = 'equip'; eq.t in (weapon, secondary, armor); eq.tier in
-- 1..4; weapon and secondary: cls in (phy, mag), tr in the seven traits,
-- rg in the five ranges, dmg ~ '^d(4|6|8|10|12|20)([+-][0-9]{1,2})?$',
-- dt in (phy, mag, any), bu (weapon: in (1, 2, 'any'); secondary:
-- absent or one of those); armor: as in 0..12, th an array of two
-- integers 1..99 with th[0] <= th[1], and no cls/tr/rg/dmg/dt/bu;
-- no key outside the list above.

-- A frozen copy: the record as the app builds it, with the language
-- fallbacks applied - the one formula the app (snapshotOf) and every
-- RPC use.
create function public.homebrew_snapshot_of(p_key text, p_content jsonb)
returns jsonb language sql immutable set search_path = public, pg_temp as $$
  select jsonb_build_object('id', p_key, 'src', 'homebrew') || p_content
    || jsonb_build_object(
         'en',   coalesce(nullif(p_content ->> 'en', ''),   p_content ->> 'ru'),
         'ru',   coalesce(nullif(p_content ->> 'ru', ''),   p_content ->> 'en'),
         'ende', coalesce(nullif(p_content ->> 'ende', ''), p_content ->> 'rud'),
         'rud',  coalesce(nullif(p_content ->> 'rud', ''),  p_content ->> 'ende'))
$$;

create function public.homebrew_snapshot_valid(p jsonb)
returns boolean language sql immutable set search_path = public, pg_temp as $$
  select p ? 'id' and p ? 'src' and p ->> 'src' = 'homebrew'
     and (p ->> 'id') ~ '^hb_[a-z2-7]{16}$'
     and public.homebrew_content_valid(p - 'id' - 'src')
$$;

create table public.homebrew_items (
  id uuid primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  catalog_key text not null check (catalog_key ~ '^hb_[a-z2-7]{16}$'),
  content jsonb not null
    check (public.homebrew_content_valid(content))
    constraint homebrew_items_content_size check (octet_length(content::text) <= 16384),
  revision bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, catalog_key)
);
create index homebrew_items_owner_updated on public.homebrew_items (owner_id, updated_at desc);

alter table public.homebrew_items enable row level security;
revoke all on table public.homebrew_items from public, anon, authenticated;
grant select, insert, update, delete on table public.homebrew_items to authenticated;
-- four policies to authenticated on (select auth.uid()) = owner_id, as lists.sql

insert into public.limit_defaults (key, value) values ('homebrew_items_per_owner', 50);

-- homebrew_items_before_update: new.id, owner_id, catalog_key, created_at
--   := old.*; revision + 1; updated_at = now() (as lists_before_update).
-- homebrew_items_limit: after insert, pg_advisory_xact_lock(hashtext(
--   'homebrew:' || owner)), effective_limit(owner, 'homebrew_items_per_owner'),
--   raise 'limit: homebrew_items_per_owner' errcode P0001 detail = limit.
-- homebrew_items_touch: after update of content, security definer -
--   update public.lists set revision = revision + 1, updated_at = now()
--   where owner_id = new.owner_id and id in (
--     select e.list_id from public.list_entries e
--     where e.item_key = new.catalog_key and e.source = 'homebrew'
--       and e.snapshot is null);
--   an item edit is an edit of every list referencing it: the shared
--   page's poll, R3's share and owner topics and "edited N ago" all
--   follow lists.revision.
-- homebrew_items_before_delete: security definer - delete from
--   public.list_entries e using public.lists l where l.id = e.list_id
--   and l.owner_id = old.owner_id and e.item_key = old.catalog_key
--   and e.source = 'homebrew' and e.snapshot is null; return old.
--   The entries' own touch trigger bumps the lists. No dangling
--   reference can exist: the delete path is the table's, and this
--   trigger is on it.
-- EXECUTE on the four revoked from public, anon, authenticated.

-- A reference (snapshot null) or a frozen copy (a snapshot), both
-- homebrew; an official entry never carries one. Replaces the R2 CHECK
-- (source = 'official') = (snapshot is null).
alter table public.list_entries
  drop constraint list_entries_snapshot_check,
  add constraint list_entries_snapshot_source
    check (source = 'homebrew' or snapshot is null),
  add constraint list_entries_snapshot_shape
    check (snapshot is null or public.homebrew_snapshot_valid(snapshot));

-- get_shared_list(text): dropped and created again with one change - a
-- reference entry's `snapshot` in the projection is the referenced
-- item's frozen form:
--   coalesce(e.snapshot, case when e.source = 'homebrew' then
--     (select public.homebrew_snapshot_of(h.catalog_key, h.content)
--        from public.homebrew_items h
--        where h.owner_id = v_list.owner_id and h.catalog_key = e.item_key)
--   end)
-- so a viewer reads one shape, live or frozen, and the projection stays
-- the R2 shape. (A reference whose item is gone cannot occur: the delete
-- trigger removed the entry.)
-- clone_shared_list(text, uuid): dropped and created again with one
-- change - the entries insert `nullif(e -> 'snapshot', 'null')` as
-- today, which is now the frozen form for a homebrew entry (the
-- projection filled it), unless the caller owns the source list, in
-- which case a homebrew entry keeps `snapshot = null` (a copy inside the
-- account stays a reference).

grant select, delete on table public.homebrew_items to service_role;
```

Reversal: create the R2 bodies of `get_shared_list` and
`clone_shared_list` again (the text of `20260925130200_list_shares.sql`),
drop the two new constraints and add the R2 CHECK back, drop the table,
drop the five functions, `delete from limit_defaults where key =
'homebrew_items_per_owner'` (the R2 precedent: a data insert has a real
reversal, never `-- additive`).

The R2 CHECK's generated name (`list_entries_snapshot_check`) is read
from `pg_constraint` by the implementer before the migration is written;
if it differs, the migration names the one found.

Why one jsonb column and not typed columns: the record is one shape in
the form, the port, the frozen copy and the bundle; typed columns would
be a second shape to keep aligned and a wider migration for every field
R8 or a later book adds. The SQL validator gives the same guarantees as
column CHECKs. Recorded in `docs/decisions/2026-09-25-a-homebrew-item-is-stored-as-the-catalog.md`.

No `kind` column: `content ->> 'kind'` answers, and a listing page sorts
by `updated_at`, not by kind. No `art_url` in this migration: R8 adds it
as an additive migration when the bucket exists.

Account deletion: `owner_id ... on delete cascade` and R1's
`delete_account()` cover it; the before-delete trigger fires per row
under the cascade and removes the references first, so a `check:db` case
proves the order does not matter (the lists cascade too). Decision 40's
Edge Function moves to R8: no file exists before R8, so a SQL cascade is
complete in R7. The roadmap's R8 outline is amended.

### 4.4 The merged index and search

`Index` gains one field, `homebrew: readonly Record_[]` (`[]` from
`buildIndex`). `withRecords(index: Index, records: readonly Record_[]):
Index` in `lib/homebrew.ts` returns an index whose `byId` holds both
sets (official first; a `hb_` key can never shadow an official id) and
whose `homebrew` is `records`; `all`, `rows`, `searchable`, `allEquip`,
`craftedFrom`, `setMembers`, the alternate tables, `refs` and `sets` are
the base's own objects, untouched. So the book tables, the rolls and the
craft and set derivations never see a homebrew record; `byId` does, and
every page that resolves an id through it (record page, modal, print,
add-to-list's `knows`, `parseHash`'s `knows`, the owner's list page)
resolves a homebrew item without a change of its own. Because the
owner's list entries are references, the list page draws the live item
through this index: an edit redraws every list at once, with no store
change.

`AppState.index` becomes a `$derived`: `#base` is the index built from
`LOOT` at boot; `index = $derived(this.#base && withRecords(this.#base,
this.homebrew?.records ?? []))`. A signed-out or unconfigured build
keeps the base index object itself (`withRecords` returns `index` when
`records` is empty), so nothing about today's goldens moves for a
signed-out state.

Search (`SearchPage.svelte`): two groups. The official group is today's
`index.searchable.filter(...)` with the 300 cap and the shown-of-total
line; the second group is `index.homebrew.filter(...)` with the same
`matches`, `hay` and kind chips, uncapped (at most 50 rows), drawn under
a `Field`-style heading («Мои предметы» / "My items", the heading a link
to `#/homebrew`) only when it has a hit. When only the homebrew group
has hits, the official group is not drawn and "nothing found" is not
said. The `hayFor` cache is keyed by id; a homebrew edit changes the
record object but keeps its id, so `hay` is derived from `index`, not
from `t` alone (one line in `SearchPage`).

Signed out or unconfigured: `index.homebrew` is empty, no group, no
heading - the search goldens without `as` do not move.

### 4.5 References and frozen copies

Two kinds of homebrew entry share `source = 'homebrew'`:

| Entry | `snapshot` | Where it occurs | Resolves through |
|---|---|---|---|
| Reference | null | the owner's own lists (add-to-list, a clone of the owner's own link, an import whose key the account holds) | the owner's live item, `index.byId` (section 4.4) |
| Frozen copy | the record as `homebrew_snapshot_of` builds it | a list outside the account: a viewer's "Save a copy" (`clone_shared_list`), R4's add-to-my-list, R6's export and an import whose key the account does not hold, R9's add from a link | the entry's own `snapshot` |

`snapshotOf(record: Record_): HomebrewSnapshot` in `lib/homebrew.ts` is
the TypeScript twin of `homebrew_snapshot_of` (the record as `toRecord`
built it, with the fallbacks, nothing else); `tests/db/homebrew.test.mjs`
and `homebrew.test.ts` both pin `docs/fixtures/homebrew/snapshot.json`
(content in, snapshot out), so the two agree.

Writing: `entryRowsOf(ids, meta, newId, from, recordOf)` gains a last
argument, a resolver `(id) => Record_ | undefined`; for a `hb_` id whose
record is the owner's live item it writes `source: 'homebrew', snapshot:
null` (a reference); for a `hb_` id resolved from a snapshot (the shared
page's add-to-list carrying a frozen row - R4) it writes the snapshot;
for an official id `official` and null as today. `CloudLists.add`,
`create` and `restoreEntry` pass the store's resolver (section 4.6).
The fake's `insertEntries` refuses a homebrew reference whose key the
owner does not hold and a frozen row whose snapshot id is not the
entry's `item_key`, the way the triggers and CHECKs do.

Reading: `CloudList` gains `snapshots: Record<string, Record_>` (frozen
rows only, through a defensive `snapshotRecord()`); `ListPage.svelte`,
`SharedListPage.svelte` and `ListsPage.knownItems` resolve entries
through `withRecords(app.index, Object.values(list.snapshots))` - one
derived `Index` per page, so their `byId` sites stay as they are; a
frozen copy wins over an own item with the same key (the shared page
has no own items: the projection carries every homebrew row as a
snapshot). The record modal opened from a frozen row draws the snapshot
and no «Изменить»; from a reference row it draws the live item with
«Изменить».

Editing: an edit writes the item; the list, index, shared and print
pages redraw from the index; the database bumps every referencing list's
`revision` (the touch trigger), so the shared page's poll, R3's topics
and "изменён N назад" follow. A frozen copy never changes.

Deleting: the editor counts the owner's lists holding a reference
(`app.cloudLists.lists.filter((l) => l.ids.includes(key) && !(key in
l.snapshots))`) and asks through `env.dialog.confirm`: with lists,
«Предмет «%s» есть в %n списках. Удалить его и убрать из них? Отменить
нельзя.» (`plural`: 1 списке / 2 списках / 5 списках); without, «Удалить
предмет «%s»? Отменить нельзя.». Then `homebrew.remove(id)`; the
before-delete trigger removes the references; the store drops the item
and `CloudLists` re-reads (the lists' `updated_at` moved). No undo
(decision 30). Recorded in `docs/decisions/2026-09-26-a-homebrew-entry-in-the-owners-lists-is.md`.

The `#/print/<ids>` address written by a list page's print button
resolves `hb_` ids through `app.index`: a reference prints its live item
(right), a frozen copy in a viewer's list prints nothing (the viewer has
no such item). `B7.2` records this in `docs/specs/DEBT.md` under R9,
which retires it with `#/print/list/<id>` (section 11).

### 4.6 Port, fake, state

`ports/types.ts`:

```ts
export interface HomebrewRow {
  id: string; catalog_key: string; content: HomebrewContent;
  revision: number; created_at: string; updated_at: string;
}
export type HomebrewRead = { ok: true; items: HomebrewRow[] } | { ok: false };
export interface HomebrewRepository {
  newId(): string;
  newKey(): string;
  list(): Promise<HomebrewRead>;
  /** Inserts the row; a second call with the same id inserts nothing. */
  create(row: Pick<HomebrewRow, 'id' | 'catalog_key' | 'content'>): Promise<ListWrite>;
  update(id: string, content: HomebrewContent): Promise<ListWrite>;
  /** Deletes the item; the database removes its references from the owner's lists. */
  remove(id: string): Promise<ListWrite>;
}
export interface CloudPort { auth; prefs; lists; homebrew: HomebrewRepository; events? }
```

(`events` is R3's `CapabilityEventsPort`, present by the time R7 builds.)
`ListWrite` is reused as the write answer (its shape is a write's answer,
not a list's); a rename to `CloudWrite` would touch every list file for
no behaviour and is not made.

`ports/supabase.ts`: `from('homebrew_items')` select ordered by
`updated_at desc`; insert with `owner_id` from the session (the B2.2 B1
fix's pattern), `{ onConflict: 'id', ignoreDuplicates: true }`; update
`content` by id; delete by id; the `limit: <key>` DETAIL mapping already
in `written()`.

`ports/fake-cloud-seed.ts`: `SeedHomebrew { id, key, content,
createdAgoMs, editedAgoMs }`, `Seed.homebrew: Record<SeedUserId,
SeedHomebrew[]>`. `gm1`: `uuid(301)` key `hb_seedaxeaaaaaaaaa` - a tier 2
magic primary weapon, both languages («Топор Тлеющих Углей» / "Ember
Axe", `cls: mag`, `tr: spellcast`, `rg: melee`, `dmg: d10+2`, `dt: mag`,
`bu: 2`); `uuid(302)` key `hb_seedpotaaaaaaaaa` - a consumable, Russian
only («Настой кузнеца», a two-line description with a `- ` list item);
`uuid(303)` key `hb_seedcapaaaaaaaaa` - a loot item, English only
("Whispering Cap", `tier: 1`). `gm2`: none (the empty state). List
`uuid(101)` gains a tenth entry `uuid(1110)` at position 9: `item_key
hb_seedaxeaaaaaaaaa`, `source homebrew`, `snapshot null` (a reference),
`qty: 1, gold: 800`; `gm2`'s list `uuid(201)` gains `uuid(2102)` at
position 1, key `hb_seedaxeaaaaaaaaa`, `snapshot` the axe's frozen form
- what "Save a copy" of `player-token-1` leaves in `gm2`'s account. The
fake's `homebrew` port copies rows per user, `newKey()` answers `hb_` +
a 16-character base32 of a counter from 7000 (`base32(n)` in the seed
file, alphabet `abcdefghijklmnopqrstuvwxyz234567`, left-padded with
`a`), `newId()` is the lists' `uuid(made++)`, the limit is 50 or
`options.limits.homebrew`, `offline` answers `network`, signed out
`refused`; `remove` deletes the item and every reference to it in the
user's lists, bumping those lists' `updated_at`; `update` bumps the
referencing lists' `updated_at` too; the fake's `get_shared_list`
projection fills a reference's snapshot from the item. `fake-cloud
.test.ts` pins the seed: every key matches the regex, every content
passes `validateDraft`, every reference names an item its owner holds,
every frozen snapshot passes the snapshot check.

`state/homebrew.svelte.ts` - `Homebrew` class: `status` idle/loading/
ready/error, `items = $state.raw<HomebrewRow[]>([])` newest edit first,
`records = $derived(items.map((r) => toRecord(r.catalog_key, r.content)))`,
`load()`, `refresh()` (on focus, every 45 s while `#/homebrew*`, a list
page or the search page is on screen, and on R3's `owner:<uid>` messages
- section 11), `clear()` on sign-out, `get(key)`, `save(draft):
Promise<ListWrite>` (create or update, awaited - the form's own submit),
`remove(id): Promise<ListWrite>`. No optimistic queue: a form has one
submit, the page shows «Сохраняем...» on the button, then navigates on
`ok` or shows the refusal under the form and keeps the draft. Recorded
in `docs/decisions/2026-09-25-a-homebrew-save-is-a-form-submit-not-the.md`.
`AppState` owns `homebrew: Homebrew | null` (null in an unconfigured
build), loads it beside `cloudLists` when a session resolves, clears it
on sign-out. `CloudLists` takes `recordOf: (id) => Record_ | undefined`
in its constructor (`app.svelte.ts` passes `(id) => this.index?.byId
.get(id)`).

`cloud.contract.ts` gains case H on the doomed user, between G and E:
create an item, read it back (`content` equal, `catalog_key` equal), a
second create with the same id inserts nothing, update the content and
read it back, add it to a list as a reference through `lists.addEntries`
and read the entry back (`source homebrew`, `snapshot null`), update the
item and read the list (its `updated_at` moved), remove the item and
read the list again (the entry is gone), remove the list.

### 4.7 Routes, the menu entry and the pages (`B7.2`)

`parseHash`: `/^homebrew(?:\/(new|hb_[a-z2-7]{16}))?$/` ->
`{ kind: 'homebrew'; key: string | null; fresh: boolean }` (`fresh` for
`new`). `homebrewHash(key?)` builder. `#/homebrew` is read in every
build: unconfigured it draws the not-found page and keeps the address
(the `#/account` precedent); signed out it draws the page head and the
`SignInPrompt` in the place of the list («Войдите, чтобы создавать свои
предметы» / "Sign in to make your own items", `after: { hash:
'#/homebrew', action: null }`); signed in it draws the page. No tab
reads current on `#/homebrew*` (`AppState.section` stays null, as for
`#/account`): the page is the account's, not a section's. `App.svelte`
gains one branch.

Entry points (owner, 2026-09-26): the account menu R5 builds from the
header's account control gains «Мои предметы» / "My items" between «Мои
списки» and «Выйти», a link to `#/homebrew`; the search group's heading
links there; a record page or modal of the owner's own item offers
«Изменить» to the editor. Nothing on the lists index (the Lists tab goes
away at the cutoff, R5). Seam with R5: the menu component takes its
entries as an ordered list of `{ label, href }` (or a snippet) so R7
inserts one entry and no markup; R7's refresh reads the component R5
shipped.

`HomebrewPage.svelte` (`#/homebrew`): `PageHead` («Мои предметы», sub
«Предметы, которых нет в книгах: они ищутся вместе с каталогом и
добавляются в списки.», help null, no pin - the page is not a section),
a `Panel` with one primary `Button` «+ Новый предмет» (href
`#/homebrew/new`), then the items as `TableRows` in list view (the same
row as search: name, stat line, description, badges; `srcLabel» «Свой
предмет»), each row opening the editor (`onopen` -> `app.go(homebrewHash
(key))`, not the modal - a row on this page is the item, and the editor
draws the card preview), «Загружаем...» while loading, «Не получилось
загрузить предметы.» and «Повторить» on error, «Своих предметов пока
нет - создайте первый.» when empty, and the count line «3 предмета из
50» under the head (`plural`). Add-to-list and selection: the row's tick
(`TableRows` `selected`/`ontoggle`) puts the item in `app.sel`, so the
selection bar's «Добавить в список» and «Печать» work as on a table - no
control of its own.

`HomebrewEditor.svelte` (`#/homebrew/new` and `#/homebrew/<key>`): a
`Panel` with the form and, beside it at 1180 wide (under it at phone
width), a live `RecordCard` compact preview of `toRecord(draft)` - the
same card search and the tables draw. Fields, in order, each a `Field`
with the existing `lbl` caption: Kind (`Seg`: Предмет / Расходник /
Снаряжение); for equipment a second `Seg` (Основное оружие / Вторичное
оружие / Броня); Название RU and Name EN (`TextInput`, maxlength 120,
the other language's value as the placeholder when one is typed); Описание
RU and Description EN (`<textarea>` styled as the list page's note box,
maxlength 3000); Ранг (`Seg` 1 2 3 4, plus «Нет» for loot); for weapons:
Класс (`Seg` Физическое / Магическое), Характеристика (`Chip` row of the
seven traits, one on), Дистанция (`Seg` of five), Урон (`TextInput`
placeholder `d8+1`), Тип урона (`Seg` физ / маг / физ-маг), Хват (`Seg`
Одноручное / Двуручное / Одноручное/двуручное); for armour: Показатель
брони (`NumberField` 0..12) and Пороги (two `NumberField`s 1..99). The
labels are `dict.ts` keys already used by the stat line and the filters
where they exist (`t.tier`, `EQ_TRAIT`, `EQ_RANGE`, `EQ_CLS`, `EQ_DT`,
`EQ_BURDEN`, `EQ_TYPE`); new keys only for the captions that do not
exist yet. Buttons: «Сохранить» (primary), «Отмена» (back to
`#/homebrew`), and for an existing item «Удалить» (danger) at the right.
Validation on submit: `validateDraft` problems are drawn as one danger
line under the form naming the first field («Заполните название хотя бы
на одном языке», «Урон записывается как d8 или d10+2», ...) and focus
moves to that field; the database's refusal reads «Не сохранилось: сервер
не принял предмет.» and a limit reads `limitText('homebrew_items_per_owner',
n)» («Достигнут предел своих предметов: 50. ...» - a new `limitHomebrew`
key beside `limitLists`). After a successful save: toast «Предмет «%s»
сохранён», navigate to `#/homebrew`. Under the form of an existing item
that lists hold, one muted line: «Предмет есть в 3 списках: изменения
появятся в них сразу, в том числе у игроков по ссылке.» (`plural`).
Delete: the count warning of section 4.5, then `#/homebrew` and a toast
without undo (decision 30). An unknown key draws «Предмет не найден» and
a link to `#/homebrew`.

Mocks: `issues/persist-7-homebrew/mocks/b72-homebrew.html` (frames A-F,
composed from `mock.css`, R2's copy of the tokens and component rules:
the page, the editor with its preview and the "in N lists" line, the
search group, the account menu with «Мои предметы» and the signed-out
page, the delete warning, a frozen row in another account's list).

Record page and modal for a homebrew record: `RecordPage` at `#/i/<key>`
draws the card as for any record (the `where` line reads «Хоумбрю»,
no «показать в таблице» link since `tableOf` is null); its `pick` slot
keeps add-to-list and print and gains «Изменить» (a `Button` link to the
editor) for the owner's live item; the modal opened from a frozen row
draws the snapshot and no «Изменить». `RecordActions` copy-link and share
use `recordUrl`, which answers the app address for a `hb_` id (section 4.2).

Print: `PrintCard` needs nothing; `printSrc` reads «Хоумбрю»; the
picture slot draws the kind glyph (no art until R8). `tests/app/print.js`
gains the fake's axe and consumable at `#/print/hb_seedaxeaaaaaaaaa-
hb_seedpotaaaaaaaaa as gm1` in both layouts (the fit ladders run on a
card with a Cyrillic-only description and a Spellcast strip).

Dictionary: `srcHomebrew`, `homebrew` (the word for the page head, the
menu entry and the search group), `subHomebrew`, `newItem`,
`noHomebrew`, `homebrewCount` (plural form set), `save`, `itemSaved`,
`deleteItemConfirm`, `deleteItemInListsConfirm` (plural form set),
`inListsHint` (plural form set), `itemNotFound`, `signInToHomebrew`,
`limitHomebrew`, the field captions (new: `nameRu`, `nameEn`, `descRu`,
`descEn`, `tierNone`, `eqClass`, `eqTrait`, `eqRange`, `eqDamage`,
`eqDamageType`, `eqBurden`, `eqArmorScore`, `eqThresholds`), the
validation lines, `edit`. Both languages, `dict.ts`'s `Dict` type keeps
them exhaustive.

Specs: `FEATURES.md` gains a section "Homebrew" (the page, the editor,
the menu entry, the search group, the reference and frozen-copy rule,
the edit propagation, print, delete with the count, limits) and one
paragraph in "Tables and search" (the second group); `ROUTES.md` gains
the three homebrew routes and the `#/i/<key>` clause; `CONTRACTS.md`
section 1 (the routes) and section 2 (`hb_` reserved, never an official
prefix); `STATE.md` (nothing in storage; the account holds the items);
`META.md` section 3 (homebrew now shipped); `I18N.md` (a homebrew record's
language fallback); `COVERAGE.md` (the new suites and states);
`docs/fixtures/urls/routes.json` (`#/homebrew`, `#/homebrew/new`,
`#/homebrew/hb_seedaxeaaaaaaaaa` unconfigured -> not-found kept, and
`#/homebrew/x` -> home); `tests/app/contracts.js`; `llms.txt` (a
homebrew section: what a `hb_` id is, that `catalog.csv` never lists one,
that a shared list may carry one with its content in the projection).

### 4.8 Bundle schema v2 (`B7.3`)

R6 publishes `schema/import-v1.json` (`format` `daggerheart-loot/lists`,
`version` 1, `additionalProperties: false`, `source` enum `["official"]`)
and `import_lists(p_lists jsonb)`, which passes `source` and `snapshot`
through and checks nothing about homebrew. v2 extends v1:

- `version: 2`; every v1 field unchanged;
- a new top-level `homebrew: [{ key, content }]` (the `HomebrewContent`
  shape of section 4.1, `key` the `hb_` key), at most 50 entries;
- a list entry may carry `source: "homebrew"` and `snapshot` (the
  snapshot shape; required for a homebrew entry in a file - a file never
  carries a bare reference, so it is self-contained); v1 entries stay
  `official` with no snapshot.

Export: every homebrew entry is written frozen (`snapshotOf` of the live
item for a reference, the row's own snapshot for a frozen copy); "all
lists" also carries every item of the account in `homebrew`; "selected"
and "one list" carry no `homebrew` array (the snapshots suffice; the
items travel with the account, or through R9's link).

Import (create-only, all or nothing - R6 Q1): one RPC `import_bundle
(p_items jsonb, p_lists jsonb) returns integer` (a `B7.3` migration,
beside `import_lists`, which it calls after the items): inserts each
item whose key the account does not hold (a held key is skipped, the
existing item stays; the limit trigger refuses the whole call past 50),
then the lists through `import_lists`, then turns every inserted entry
with `source = 'homebrew'` whose `item_key` the account now holds into a
reference (`snapshot = null`) - so an own export re-imported restores
references, and a friend's export leaves frozen copies. `lib/bundle.ts`
gains the v2 branch of `parseBundle`/`validateBundle` (`version` 2, the
`homebrew` array, entry snapshots through `validateDraft` on `snapshot -
id - src`); the preview counts items too («3 предмета, 2 уже есть»).

`B7.3` publishes `schema/import-v2.json`, keeps v1 published and
accepted, updates `CONTRACTS.md` section 4, `llms.txt`, the `#/account`
"Your data" text (export now carries homebrew), `tests/contracts.js` (v2
fixtures under `docs/fixtures/import/`), a layer 3 case per rule above,
a layer 2 state for the import preview with homebrew counts as `gm1`,
and an E2E flow (export all, delete the item, import, the item is back
with the same key and its list entry is a reference again).

### 4.9 Deletion, account deletion, monitoring

- Item delete: the count warning, then a hard delete that removes the
  item's references from the owner's lists (the trigger); no undo, no
  Trash (decision 30). A frozen copy in another account is not touched.
- Account delete: the cascade (section 4.3); layer 3 proves a deleted
  user's items and lists are gone and another user's frozen copies stay;
  R8 replaces the SQL function by the Edge Function when files exist.
- Usage monitoring (R11): `homebrew_items` is a table to count; named to
  its planner through the roadmap.

## 5. Contracts and behaviour that stay stable

`data.js`, `data.json`, `catalog.csv`, `i/`, `og/`, the record ids and
prefixes of `CONTRACTS.md` section 2 (one reserved prefix added), the
route grammar (three routes added, no existing route changes meaning),
the list link encoding (`#/l/` carries official ids only; a homebrew
entry never enters a local list because local lists are read-only from
R5 and add-to-list writes to the account), `list_entries`' columns and
the 16384 bound (one CHECK replaced by two: an official row is exactly
as before), the share projection's shape (`snapshot` now filled for a
reference), the ten tab sections (the page is not a section), the
sign-in prompt rule, the count-limit mechanism, the print sheet
geometry, R6's `import_lists` signature.

## 6. Tests, fixtures, documentation per batch

| Batch | Layer 1 | Layer 2 | Layer 3 | Layer 4 | Docs |
|---|---|---|---|---|---|
| `B7.1` | `homebrew.test.ts` (`validateDraft` over the fixtures, `toRecord` fallbacks, `snapshotOf` vs `snapshot.json`, `withRecords` shadows nothing and returns the base when empty, `newKey` shape), `fake-cloud.test.ts` (seed pins, the port, the limit, offline, `remove` takes the references, `update` bumps the referencing lists, the projection fills a reference), `cloud.contract.ts` case H over the fake, `supabase.test.ts` (the adapter's calls and the DETAIL mapping), `cloudLists.test.ts` (`entryRowsOf` with a resolver: reference, frozen, official; `toCloudList` snapshots) | none (no UI) | `tests/db/homebrew.test.mjs`: grants (authenticated CRUD, anon none, service_role select+delete), RLS (owner reads and writes own rows, other user nothing, anon nothing), `homebrew_content_valid` over `valid.json` and `invalid.json`, `homebrew_snapshot_of` over `snapshot.json`, the size CHECK, the key CHECK, `unique (owner_id, catalog_key)` and the same key for two owners, the before-update trigger pins id/owner/key/created and bumps revision, the touch trigger bumps every referencing list's revision and no other list, the before-delete trigger removes the owner's references and leaves another owner's frozen copy, the limit refuses the 51st and an override of 2 refuses the 3rd, the `list_entries` CHECKs (a bad snapshot refused, a good frozen row taken, a reference taken, official with a snapshot refused, official with null still fine), `get_shared_list` projects a reference with the item's frozen form and a frozen row as it is, `clone_shared_list` freezes for another user and keeps a reference for the owner, the cascade on `auth.users` delete, the reversal gate; `list-shares.test.mjs` cases that read the two functions stay green | `contract.mjs` runs case H against the test project; `admin.mjs` gains `homebrewOf(userId)` and `deleteHomebrewOf(userId)` for cleanup | `COVERAGE.md` (`tests/db/homebrew.test.mjs`, the fixtures) |
| `B7.2` | `hash.test.ts` (the routes), `homebrewPage.test.ts`, `homebrewEditor.test.ts` (every field, validation focus, save, refusal, the "in N lists" line, the delete warning with and without lists, axe at the end and on the open kind states), `searchPage.test.ts` (the group), `listPage.test.ts` and `sharedListPage.test.ts` (a reference row, a frozen row, the modal from each), `recordPage.test.ts` (`#/i/<key>`, «Изменить»), the account menu test of R5's component (one more entry), `label.test.ts` (`srcLabel`, `printSrc`), `a11y.test.ts`, `app.test.ts` (`index` derived, `section` null for homebrew, load/clear/refresh) | `inventory.js` states: `#/homebrew` signed out; `#/homebrew as gm2` (empty); `#/homebrew as gm1`; `#/homebrew/new as gm1`; `#/homebrew/hb_seedaxeaaaaaaaaa as gm1` (with the "in 1 list" line); `#/search` with `q = "топор"` as gm1 (both groups) and `q = "настой"` as gm1 (homebrew only); `#/i/hb_seedaxeaaaaaaaaa as gm1`; `#/print/hb_seedaxeaaaaaaaaa-hb_seedpotaaaaaaaaa as gm1` (both layouts, `print.js`); the account menu open as `gm1` (R5's state gains one entry); the existing `#/lists/<101> as gm1`, `#/lists/<201> as gm2` and `#/s/player-token-1` goldens move (the reference row, the frozen row, the projected row); `states.js`: save a new item and find it on `#/homebrew`; edit the axe and see the list page row change without a reload; delete with the confirm stub and see the list lose the row; a validation refusal focuses the name field | none | `flows.mjs` F8: create an item, read it back through admin, add it to a list as a reference, the entry's `source`/`snapshot` read back, edit the item, the list's `updated_at` moved and the shared projection carries the new text, delete the item, the entry is gone; cleanup | `FEATURES.md`, `ROUTES.md`, `CONTRACTS.md` 1 and 2, `STATE.md`, `META.md` 3, `I18N.md`, `COVERAGE.md`, `DEBT.md` (the print-address entry under R9), `docs/fixtures/urls/routes.json`, `llms.txt`, `pages/src/privacy.html` and `en/` (no change needed - verified they already name homebrew items) |
| `B7.3` | `bundle.test.ts` (v2 validation, v1 still valid, export shapes, the frozen write of a reference) | the import preview state as `gm1` | `tests/db/import-bundle.test.mjs`: items inserted, held keys skipped, entries turned into references where held, frozen otherwise, the limit refuses the whole call, all or nothing | export-delete-import flow | `CONTRACTS.md` 4, `llms.txt`, `FEATURES.md` "Account" (Your data), `COVERAGE.md`, `docs/fixtures/import/` |

Terminology: Russian product text follows `EQ_*` in `lib/i18n.ts` (the
site's own vocabulary: «Ранг», «Вплотную», «Характеристика
Заклинателя»); the new captions reuse those words. The page and menu
name «Мои предметы» renders the owner's "My items"; the source tag is
«Хоумбрю» / "Homebrew" (owner, section 13, Q3), the word the GM note
placeholder already uses.

## 7. Batches: gates, cost, review, split criterion

Costs from `.claude/README.md`, "Batch size and the fixed cost of a run",
re-measured 2026-09-25: `check` 348 s, `check:built` 19 s, layer 2
filter group ~290 s, `app/states` 197 s, goldens 4 shards ~600 s, layer 3
`check:db` ~120 s (plus the first stack start), E2E ~50 s.

| Batch | Goal and scope | Gates (cost) | Review | Split criterion |
|---|---|---|---|---|
| `B7.1` | Section 4.3 migration and reversal (the table, the five functions, the four triggers, the `list_entries` CHECKs, `get_shared_list` and `clone_shared_list` re-created), `tests/db/homebrew.test.mjs`, `lib/homebrew.ts`, `ports/types.ts`, the real adapter, the fake and its seed (the reference row in list 101, the frozen row in list 201), `cloud.contract.ts` case H, `admin.mjs` helpers, the fixtures | layer 1 `check` (~6 min), layer 3 `check:db` (~3 min + stack start), layer 4 `npm run e2e` (~1 min; the contract case against the test project) (~11 min) | required (schema rule) | new release (R7); SQL and ports judged apart from Svelte |
| `B7.2` | Section 4.7: routes (a public-contract change), the account menu entry, `AppState.index` derived, `Homebrew` store with R3's owner-topic refresh, the page and the editor, the search group, reference and frozen resolution on the list, shared and index pages, `#/i/<key>`, print, the delete warning, dictionary, specs, fixtures, goldens, states, E2E F8, the DEBT entry | layer 1 `check` x2 (~12 min), `check:built`, layer 2 filter group (~5 min), goldens (~10 min), layer 4 E2E (~1 min) (~29 min) | required (public contract, new UI) | a commit boundary the harness cannot reach (needs `B7.1`'s port and seed) and a public-contract change with its own fixtures |
| `B7.3` | Section 4.8: `schema/import-v2.json`, export with frozen entries and the items, `import_bundle` (a migration), `lib/bundle.ts` v2, the preview, contracts, `llms.txt` | layer 1 `check` x2 (~12 min), layer 3 `check:db` (~2 min), `check:built`, layer 2 `app/states,app/contracts` (~4 min), goldens (~10 min), layer 4 E2E (~1 min) (~30 min) | required (public contract) | a second public contract (the bundle schema) with its own fixtures and review, a migration `B7.2` has none of, and a dependency on R6's shipped code |

Total, one green pass per batch, idle host: about 70 minutes.

Roadmap order: R5, R3, R4 and R6 ship before R7 (section 9 of the
roadmap), so `B7.2` finds the account menu and R3's port, and `B7.3`
finds `import_lists`; they wait on the siblings only for this plan's
refresh.

## 8. Batch `B7.1` - schema, port, fake, pure logic (implement-ready)

Objective: everything under the app that homebrew needs - the table, the
reference and frozen-copy rule in the database, the projection, the
port, the fake - proven by layers 1, 3 and 4, with no screen changed.

In scope: sections 4.1, 4.2, 4.3, 4.5 (the pure half and the fake), 4.6.
Out of scope: any Svelte file, any route, any dictionary key, the specs
beyond `COVERAGE.md`.

Files to create: `supabase/migrations/<stamp>_homebrew.sql`,
`supabase/reversals/<stamp>_homebrew.sql`, `tests/db/homebrew.test.mjs`,
`app/src/lib/homebrew.ts`, `app/src/lib/homebrew.test.ts`,
`docs/fixtures/homebrew/valid.json`, `invalid.json`, `snapshot.json`.
Files to edit: `app/src/lib/data.ts` and `data.test.ts`,
`app/src/ports/types.ts`, `app/src/ports/supabase.ts`,
`app/src/ports/supabase.test.ts`, `app/src/ports/fake-cloud-seed.ts`,
`app/src/ports/fake-cloud.ts`, `app/src/ports/fake-cloud.test.ts`,
`app/src/ports/cloud.contract.ts`, `app/src/lib/cloudLists.ts`
(`entryRowsOf`'s resolver, `CloudList.snapshots`, `toCloudList`),
`app/src/lib/cloudLists.test.ts`, `app/src/state/cloudLists.svelte.ts`
(the resolver in the constructor; behaviour unchanged for official ids),
`app/src/state/cloudLists.test.ts`, `app/src/state/app.svelte.ts` (the
resolver argument only), `tests/e2e/admin.mjs`, `tests/e2e/contract.mjs`
(nothing if it already runs the whole contract), `tests/db/list-shares
.test.mjs` (the projection cases), `docs/specs/COVERAGE.md`.

Steps:

1. Fixtures. `valid.json`: an array of `HomebrewContent` objects - a loot
   item both languages, a consumable Russian only with a `- ` list line,
   a loot item English only with `tier: 3`, a primary weapon with every
   field, a secondary weapon without `bu`, an armour with `as: 0` and
   `th: [1, 1]`, a description of exactly 3000 code points of Cyrillic
   (the size proof: its JSON is under 16384 bytes). `invalid.json`: an
   array of `{ content, why }` - both names empty, a 121-character name,
   a 3001-character description, `kind: 'weapon'`, `tier: 'A'`, `tier: 5`,
   equip without `eq`, `eq` on a consumable, `eq.tier` missing, a weapon
   without `cls`, `dmg: 'd7'`, `dmg: '2d8'`, `bu: 3`, armour with `dmg`,
   `th: [5, 4]`, `as: 13`, an unknown key `img`, `content` as an array.
   `snapshot.json`: `{ key, content, snapshot }` triples - both languages,
   Russian only, English only.
2. `lib/homebrew.ts`: the types of section 4.1, `KEY_RE`, `isHomebrewKey`,
   `NAME_MAX` 120, `TEXT_MAX` 3000, `validateDraft(content): Problem[]`
   (`Problem = { field: keyof HomebrewContent | 'eq.<field>'; code: string }`,
   codes are dictionary keys `B7.2` maps to text), `toRecord(key,
   content)`, `snapshotOf(record)`, `snapshotRecord(value: unknown):
   Record_ | null` (a defensive reader for a row's `snapshot`),
   `withRecords(index, records)` (returns `index` itself when `records`
   is empty), `emptyDraft(kind)`. Pure: no port, no DOM. Doc comment
   cites `FEATURES.md`, "Homebrew" (written by `B7.2`; the citation
   resolves after it - acceptable inside one task commit).
3. `lib/data.ts`: `Index.homebrew: readonly Record_[]`; `buildIndex`
   sets `[]`. `data.test.ts`: one assertion.
4. `ports/types.ts`: section 4.6. `CloudPort.homebrew`.
5. `lib/cloudLists.ts`: `entryRowsOf(ids, meta, newId, from = 0, recordOf?:
   (id: string) => Record_ | undefined)`; for an id where `recordOf(id)`
   has `src === 'homebrew'` write `source: 'homebrew'` and `snapshot:
   null` when the record is a live item, or `snapshotOf(rec)` when the
   resolver marks it frozen (the resolver answers `{ record, frozen }`
   for the shared page's carried rows - `B7.2` wires it; `B7.1` writes
   the branch and its test). `CloudList.snapshots: Record<string,
   Record_>` filled by `toCloudList` from frozen rows through
   `snapshotRecord`; a row whose snapshot does not read is kept as an
   entry with no record (the page draws its key, as it does for an
   unknown official id today). `cloudLists.svelte.ts` takes `recordOf`
   as a fourth constructor argument and passes it to every `entryRowsOf`
   call. `app.svelte.ts` passes `(id) => this.index?.byId.get(id)`.
6. The migration and the reversal (section 4.3), stamp per "Migration
   names"; read the R2 CHECK's constraint name from `pg_constraint`
   first. Comments on every object: the reason and the spec section. The
   two re-created functions copy R2's bodies with the one change each.
7. `tests/db/homebrew.test.mjs` (section 6 row `B7.1`), through
   `roles.mjs` `asRole`; the fixtures are read from `docs/fixtures/
   homebrew/` so layer 1 and layer 3 run the same cases; the projection
   and clone cases in `list-shares.test.mjs` beside the existing ones.
8. The seed and the fake (section 4.6); `fake-cloud.test.ts` pins.
9. The real adapter and `supabase.test.ts`.
10. `cloud.contract.ts` case H; `admin.mjs` `homebrewOf`, `deleteHomebrewOf`
    (the sweep deletes homebrew before users, as lists).
11. `COVERAGE.md`: the suite row and the fixtures.
12. Gates: `rtk npm run check` (Bash, timeout 600000); `npm run check:db`
    (PowerShell); `npm run e2e` (the contract case reaches the test
    project; the migration reaches it through `migrate-test` on the push
    of the branch, or the owner's `db:push --project test` in a local
    release - the implementer states which).

Acceptance criteria:

- `homebrew_content_valid` accepts every `valid.json` entry and refuses
  every `invalid.json` entry (layer 3), and `validateDraft` agrees on
  every one (layer 1).
- `snapshotOf(toRecord(key, content))` equals `snapshot.json`'s snapshot
  for each triple (layer 1) and `homebrew_snapshot_of(key, content)`
  equals it too (layer 3, the same file).
- The owner reads, inserts, updates and deletes only own rows; anon
  nothing; another user nothing (layer 3 matrix).
- The 51st item refuses with `limit: homebrew_items_per_owner`, DETAIL
  `50`; an override of 2 refuses the 3rd.
- An item update bumps the revision of every own list referencing it and
  of no other list; an item delete removes its references from the
  owner's lists and leaves another owner's frozen copy; the referencing
  lists' revisions bump on the delete.
- `list_entries` refuses a homebrew row with a malformed snapshot and an
  official row with a snapshot; takes a homebrew reference and a frozen
  row; an official row with a null snapshot is unchanged.
- `get_shared_list` answers a reference with the item's frozen form in
  `snapshot` and a frozen row as it is; `clone_shared_list` freezes for
  another user and keeps the reference when the caller owns the list.
- The reversal gate passes (up, down, up, schema equal); the R2 share
  cases in `list-shares.test.mjs` stay green.
- The fake's seed passes its pins; `cloud.contract.ts` case H passes over
  the fake (vitest) and over the test project (`npm run e2e`).
- No golden moves: no screen changes in this batch (the seed's new rows
  change goldens only once `B7.2` draws them; until then the list page
  resolves `hb_` ids through `index.byId`, which does not know them, and
  draws the key - the implementer confirms `app/golden` shard 1 of 4 is
  byte-identical or lists the moved files as `B7.2`'s).

Risks and do-nots: never `create or replace`; never edit a pushed
migration; the `list_entries` CHECKs and the two functions change by
`alter table` and drop-then-create in the new migration, never by
editing `lists.sql` or `list_shares.sql`; the key regex is the one
contract every later release reads - `KEY_RE` in TS, the CHECK in SQL
and the `ROUTES.md` text of `B7.2` must be the same string; do not add
a `kind` or `art_url` column; do not add a foreign key from `item_key`
(a frozen copy names a key its owner does not hold); do not touch
`data.js`.

## 9. Batch `B7.2` - the app (outline; the refresh expands it)

Section 4.4, 4.5 (the pages), 4.7, section 6 row `B7.2`. Waits on: the
R5b's account menu component; R3's port and
`lib/live.ts`; `B2.3`'s final `SharedListPage`/`SharedView` (the frozen
resolution goes into whichever component draws `#/s/`). Inherited
acceptance lines: the `DEBT.md` entry for the print address (section
4.5, last paragraph); the moved goldens of `B7.1`'s seed rows; the
`Homebrew` store's refresh on R3's `owner:<uid>` messages (section 11).

## 10. Batch `B7.3` - bundle v2 (outline; the refresh expands it)

Section 4.8, section 6 row `B7.3`. Waits on R6's shipped `lib/bundle.ts`
and `import_lists`.

## 11. What the other releases need from this design

R3 (`persist-3-realtime`, ships before R7): nothing to build for R7. R7
relies on R3's owner topic: an item edit bumps every referencing list's
`revision` through `homebrew_items_touch`, so R3's `lists` trigger sends
one `list` message per list to `owner:<uid>` and one `revision` message
per active share topic - the owner's other devices and every open shared
page refetch with no R7-specific message. For the owner's own items
list, `B7.2` adds one trigger in its own migration if needed: `after
insert or update or delete on homebrew_items` sending `{ "item":
<catalog_key>, "revision": <bigint or null>, "by": <tab id> }` as event
`item` to `'owner:' || owner_id`, read by `lib/live.ts`'s owner reader
(R3's `readOwnerMessage` gains the `item` event, or R7 adds
`readItemMessage` beside it); `Homebrew.refresh()` on it. The refresh
before the build decides after reading R3's shipped reader.

R4 (`persist-4-requests`): a request line for a homebrew entry takes its
`name_snapshot` from the projection's `snapshot` (filled for a reference
too); the signed-in viewer's add-to-my-list writes a frozen copy (the
`AddToList` carried rows resolve as `{ record, frozen: true }`, section
4.5); `apply_purchase_request` removes an entry at zero stock as today -
a reference row like any other.

R5 (`persist-5-migration`): the account menu takes its entries as data
so `B7.2` inserts «Мои предметы» between «Мои списки» and «Выйти»; local
lists hold official ids only, so the migration writes no homebrew row.

R6 (`persist-6-import-export`): `import_lists(p_lists)` keeps its
signature and its pass-through of `source` and `snapshot`; `B7.3` adds
`import_bundle(p_items, p_lists)` beside it and the v2 branch in
`lib/bundle.ts`; v1's validator refusing `version` 2 and `source:
homebrew` stays as R6 wrote it; `schema/import-v<N>.json` and the
`llms.txt` links per version. The export writers gain the frozen form of
a reference and the `homebrew` array (section 4.8).

R8 (`persist-8-media`):
- an additive migration `alter table homebrew_items add column art_url
  text` with a CHECK on the URL shape (the bucket's public URL prefix),
  `homebrew_content_valid` untouched (the URL is a column, not content);
- `toRecord` maps `art_url` to `Record_.img` as an absolute URL and
  `artSrc` passes an absolute `img` through unchanged and derives the
  160 px name by R8's own suffix rule; `homebrew_snapshot_of` and
  `snapshotOf` copy `img`, and `homebrew_snapshot_valid` then allows an
  `img` key (R8 replaces the three functions in a new migration; the
  reversal restores these);
- a replaced or deleted picture whose URL a frozen copy still carries is
  answered by the existing broken-art fallback (`artBroken`), so R8 may
  delete files freely; a reference always draws the current picture;
- the editor's picture slot: the mock reserves the card preview's art
  area; R8 adds the control beside it;
- decision 40's `delete-account` Edge Function lands in R8 with the bucket.

R9 (`persist-9-item-share`):
- `homebrew_shares` on the `list_shares` pattern (`item_id`, one active
  link per item, `token`, `topic_key`, `revoked_at`), `get_shared_homebrew
  (token)` for anon returning `{ revision, updated_at, topic_key, item:
  homebrew_snapshot_of(...) }`, `clone_shared_homebrew(token, new_id)`
  making a new key server-side with a SQL twin of `newKey()` (the
  cloner's own item, so a reference in the cloner's lists),
  `add_shared_homebrew_to_list(token, list_id, entry_id)` writing a
  frozen copy by `homebrew_snapshot_of`;
- a frozen copy in a list may offer «Сделать своим» (clone from the row)
  - R9's call;
- `#/h/<token>` draws `RecordCard` over `toRecord()` of the projection
  and subscribes to `share:<topic_key>` as `B3.1` does; an item edit
  bumps `homebrew_items.revision` (the before-update trigger), which
  R9's trigger sends;
- `#/print/list/<id>` and `#/print/s/<token>` resolve entries through
  `withRecords(index, snapshots)` (a reference from the owner's items, a
  frozen row from itself) and retire the `DEBT.md` entry `B7.2` writes;
- the `hb_` prefix and per-owner uniqueness: a cloned item is a new row
  with a new key, never the sharer's key.

R11 usage monitoring: count `homebrew_items`.

## 12. Risks, assumptions, deferred

- Assumption: a plpgsql `immutable` function is accepted in a table CHECK
  (it is, when declared immutable); the layer 3 suite is the proof.
- Assumption: the R2 CHECK's generated constraint name is
  `list_entries_snapshot_check`; step 6 reads it before writing.
- Risk: `AppState.index` as a `$derived` re-runs `withRecords` on every
  homebrew edit; the function copies one `Map` of 1272 + 50 entries - a
  millisecond. The tables and the rolls keep the base arrays by
  reference, so nothing there redraws.
- Risk: the `hayFor` cache by id serves a stale folded text after an
  edit; section 4.4 derives `hay` from `index`.
- Risk: the touch trigger bumps `lists.updated_at`, so "изменён N назад"
  on the index moves on an item edit; accepted (the list's content did
  change) and stated in `FEATURES.md`.
- Risk: `ListPage.svelte` is 65 KB and `B2.3` is editing it and the shared
  page now; `B7.2`'s change there is one derived `Index` and no other
  line, and the refresh re-reads both files.
- Risk: the goldens of lists 101 and 201 and `#/s/player-token-1` move
  in `B7.2` because the seed gains rows in `B7.1`; the reviewer reads
  the moved files against the seed.
- Risk: R5b's menu component may take markup rather than data; the
  refresh adapts the one entry to what shipped.
- Deferred: an "update in lists" action is moot (references); a Trash;
  «Сделать своим» from a frozen row (R9); homebrew in the roll tables;
  sets, crafts and referenced cards on a homebrew record; a homebrew
  filter on the search page (the group heading is the filter today).

## 13. Owner questions - answered 2026-09-26

Answered 2026-09-26 (roadmap `context.md`, "Owner answers for R5 and
R7"): Q1 placement - the account menu, not a tab and not under the Lists
tab (applied in section 4.7); Q2 editing - live references inside the
account, frozen copies outside it, a delete warns with the count and
removes the item from its lists (applied in sections 4.3, 4.5, 4.9).

Q3 answered 2026-09-26 (roadmap `context.md`, "Owner answer for R7"):
the source tag on a homebrew row, card and print card is «Хоумбрю» /
"Homebrew", against the recommendation below; the page, the menu entry
and the search group stay «Мои предметы» / "My items". The question as
asked:

Q3. The Russian words. The menu entry is the owner's "My items", so the
    page head, the menu entry and the search group read «Мои предметы» /
    "My items". What stays open is the source tag on rows, cards and the
    print card's source line.
   - (recommended) «Свой предмет» / "Homebrew" as the tag. Reason: a
     tag names where a record comes from («Основные правила», a frame, a
     community); «свой» says "yours, not a book's" in one word beside
     «Мои предметы», and «Хоумбрю» stays in the GM note placeholder as it
     is. The daggerheart.su convention for "homebrew" was not verified in
     this pass (no fetch); the owner may know it.
   - «Хоумбрю» / "Homebrew" as the tag: one word the community already
     uses; reads as jargon to a new reader.

No new question. Decided without one (sections 4 and 11): an item edit
is an edit of every referencing list (their `revision` and `updated_at`
move); the owner cloning their own link keeps references; a file never
carries a bare reference; an import turns a held key into a reference;
`#/homebrew` is the route's spelling (the label is the owner's); one
jsonb column; per-owner keys with the `hb_` prefix; both languages
optional with at least one name and a fallback at record build; tier
typed by the owner, optional on loot; the 16384 bound kept; form-submit
saves; `#/i/<key>` resolves in the app for the owner; no Trash (decision
30); 50 items (decision 31).
