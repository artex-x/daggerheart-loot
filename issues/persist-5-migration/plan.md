# Plan - TASK persist-5-migration (release R5: the move into the account and the cutoff)

## Status

- Planning pass 2, 2026-09-26, planner, in the worktree
  `.claude/worktrees/agent-ab6237f88fb7735f1` on `da7378cb` (R2's task
  commit before `B2.3`). Pass 2 applies the owner's answers of 2026-09-26
  (`issues/persistent-storage/context.md`, "Owner answers for R5 and R7"):
  the move is automatic, delete stays after the cutoff, an account menu
  with display settings, the Lists tab leaves at the cutoff. Every step
  marked **[refresh after B2.3]** is re-read against the tree R2 leaves
  before `B5.1` is dispatched (section 13).
- NEEDS_HUMAN_CONFIRMATION: no - the owner answered section 12 on
  2026-09-26: the account menu ships as its own release R5b
  `persist-5b-account-menu`, right after R5.
- Batches: `B5.1` schema and RPC (section 8, implement-ready), `B5.2` the
  move and the cutoff (section 9, implement-ready except the marked
  steps), closeout (section 10). `B5.3` the account menu, display settings
  and the tab removal (section 9b) belongs to R5b; section 9b is its brief
  until the section 13 refresh copies it into
  `issues/persist-5b-account-menu/`.
  Gate cost: section 7.
- Roadmap: `issues/persistent-storage/plan.md` sections 9, 10, 12, 14, 16
  (decisions 2, 6, 11, 12, 31), 17; this file is R5's authority where the
  two differ.

## 1. Objective and current state

Goal: move browser lists into the account on the reader's behalf, fix the
legacy write cutoff `LEGACY_WRITE_UNTIL` = Monday 2026-10-26, retire `#/l/`
on that date and announce it, end the local write path with its two-tab
merge after the date, and give the header's account control a menu with
display settings. Live on production by 2026-10-12, or the owner moves the
date (decision "`LEGACY_WRITE_UNTIL` is 2026-10-26; the migration release
moves directly after lists", 2026-09-25).

State at `da7378cb` (R2 through `B2.2`, the fix pass and the rebase onto
`cd1b3b15`):

- `lists` and `list_entries` exist with the four R2 migrations
  (`20260925130000` to `130300`) on the test project; production gets them
  at R2's push. `legacy_fingerprint` and its unique index were deferred to
  R5 (`issues/persist-2-lists/handoff.md`, Deferred).
- Signed in, every new list is an account list (`CloudLists`,
  `ListRepository`); browser lists (`ListStore`, `dhloot.lists.v2`) stay
  editable, keep their `#/l/` address rewrite, the two link buttons and the
  storage notice. Nothing moves them (`FEATURES.md`, "Account lists").
- The header's account control is a link to `#/account` («Войти», or the
  email's first letter); `#/account` holds sign-in, providers, sign out,
  delete; the tab bar has ten tabs, `lists` among them; no settings page
  (`FEATURES.md`, "Account", "Chrome").
- The restore-from-link field and the install guide's iOS link paragraph
  are already gone (R2, `B2.2`); R5 owes neither.
- `B2.3` (share links) is being built in the main tree: `#/s/<token>`,
  `SharedListPage.svelte` reused, the share panel on `ListPage.svelte`, the
  `#/l/` announcement with the date on the old shared page, in `llms.txt`
  and `CONTRACTS.md` section 3. The owner dropped the rotate button
  (delete, then create). Its text names the date as a literal; step 9.14
  makes it read the constant.

## 2. Scope and non-goals

In scope: the `legacy_fingerprint` column and partial unique index; the
`move_legacy_list` RPC and the limit exemption; the automatic move at
sign-in with its two guards (a one-time notice naming the moved lists; the
first account on the browser only), read-back verification, per-list
removal, `dhloot.migrated.v1`; `LEGACY_WRITE_UNTIL` and everything it
gates (read-only browser lists, the retired-link page, hidden link buttons,
no `#/l/` rewrite, no link unpack, the Lists tab gone); the announcement in
the app texts and the specs; the test build's clock (`?today=`); the
account menu («Настройки отображения», «Мои списки», «Выйти») and the
display settings section of `#/account`; layer 1-4 coverage.

Non-goals: deleting the `#/l/` codec, its fixtures and `tests/contracts.js`'s
encoding half (R10, after the date); deleting the browser group and
`StorageNotice` (R10); deleting `ListStore`'s editing writers and
`mergeLists` from the code (R10, section 4.6); «Мои предметы» in the menu
(R7); Realtime (R3); a local JSON export (rejected 2026-09-24); a button
that starts the move (superseded 2026-09-26 by the automatic move).

## 3. Existing behaviour and code paths

- `app/src/state/lists.svelte.ts` `ListStore`: `load`, `save` (the merge),
  `create`, `remove`/`restoreList`, `addIds`/`add`/`removeId`, `watch`, the
  ten page writers; `#deleted` blocks a merge resurrection for the tab's
  lifetime; `#readCurrent` filters it on a read too.
- `app/src/lib/lists.ts`: `StoredList`, `keepLists`, `liftNotes`,
  `mergeLists`, `findListByPayload`, the shared writers.
- `app/src/state/cloudLists.svelte.ts` `CloudLists`, `app/src/lib/cloudLists.ts`
  (`toCloudList`, `entryRowsOf`, `clip`, `quantityOf`, `priceOf`,
  `NAME_MAX`, `NOTE_MAX`), `app/src/ports/types.ts` `ListRepository`,
  `ports/supabase.ts` (`writeOf`, `written`, `LIST_SELECT`),
  `ports/lazy-cloud.ts`, `ports/fake-cloud.ts` (`Held`, `write`,
  `insertEntries`), `ports/fake-cloud-seed.ts`, `ports/cloud.contract.ts`
  (cases A-G).
- `app/src/state/app.svelte.ts`: `#setUser` (loads the account's lists,
  then `#runPending`), `#watchAccount` (the key-less storage signal),
  `newListTarget`, `storeFor`, `#expand` (the packed `#/l/` unpack),
  `#runPending` (`saveList`), `syncListUrl`, `openNewList`, `#claimList`,
  `toggleHome`/`pinOf`, `setLang`, `setTablesView`, `setPrintBW`,
  `setPrintCompact`, the 45 s poll.
- `app/src/components/Shell.svelte` (the header: brand, the language `Seg`,
  the account control `a.acct` with `aria-label` «Аккаунт: <email>»,
  `TabBar`, `<main>`, `SelBar`, the footer, `Toast`), `TabBar.svelte`
  (`TABS`, ten entries), `AccountPage.svelte` (`Field heading` panels,
  `signOut(scope)` with its `busy` wrapper, `deleteAccount`), `Seg.svelte`,
  `ListsPage.svelte` (two groups, `StorageNotice` at the browser group's
  head, `share`, `del`), `ListPage.svelte` (`own`, `isCloud`, `store`,
  `scheduleUrlSync`, the actions row with `sharePlayers`/`shareGm`, `del`,
  the notice slot, the batch bar, the rows), `SharedListPage.svelte`
  (`#/l/` for a list not ours, `saveShared`), `StorageNotice.svelte`,
  `AddToList.svelte` (`all` = account and browser lists; the outside-click
  and Escape handling of its `.dropmenu`), `SignInPrompt.svelte`,
  `ListCard.svelte`.
- `app/src/lib/hash.ts` (`sharedList` route, `PACK_MARK`, `ACCOUNT_HASH`),
  `lib/listLink.ts` (`decodeList`, `encodeList`, `QTY_MAX`, the FNV-1a
  `stamp`), `lib/dict.ts` (`localOnly`, `sharePlayers`, `shareGm`,
  `account`, `signIn`, `signOut`, `signedOut`, `viewList`/`viewGrid`,
  `homeHint`, the account keys), `lib/help.ts` `LISTS`.
- `supabase/migrations/20260925130100_lists.sql`: `lists_limit` and
  `list_entries_limit` (after-insert triggers, `effective_limit()`),
  `lists_before_update`; `tests/db/lists.test.mjs`, `limits.test.mjs`,
  `roles.mjs` (`asRole`), `reversibility.test.mjs`.
- `tests/app/inventory.js` (`two`, `seven`, `noted`, `twelve` seeds; `as`),
  `driver.js` (`open(route, { as })`, `fake`, `seed`, `storage`),
  `golden.js` (`# as:` header), `states.js` (cases 1-42; case 7 is the
  two-tab storage case), `tests/e2e/flows.mjs` (F1-F7; F2 reads
  `header a[href="#/account"]`'s `aria-label`), `admin.mjs` (`listsOf`,
  `deleteListsOf`, `createThrowaway`), `contract.mjs`, `tests/derived.js`
  (`COUNT_BEARING_FILES`, the decisions registry), `shell.test.ts` ("the
  account control").

## 4. Architecture

### 4.1 The constant, the gate and the clock

`app/src/lib/legacy.ts` (new, pure):

```ts
/** Monday 2026-10-26, 00:00 UTC: from here browser lists are read-only,
 *  `#/l/` links stop opening and the Lists tab leaves the bar
 *  (docs/specs/FEATURES.md, "Browser lists"). */
export const LEGACY_WRITE_UNTIL = Date.UTC(2026, 9, 26);
export function legacyWritable(now: number): boolean;   // now < LEGACY_WRITE_UNTIL
export function legacyDateText(lang: Lang): string;      // Intl.DateTimeFormat, UTC, day month year
export function canonicalList(l: StoredList, knows: KnowsId): string;  // section 4.2
```

`legacyDateText` reads «26 октября 2026 г.» / "26 October 2026" - whatever
`Intl` gives; the goldens pin it (the same ICU risk as `agoText`, R2).

`Env` gains `clock: ClockPort` (`{ now(): number }`, `app/src/ports/clock.ts`:
`browserClock()` = `Date.now`, `fixedClock(ms)`, `queryClock(search,
fallback)` reads `?today=YYYY-MM-DD` as UTC midnight). `AppState` reads it
once: `readonly legacyWritable = !env.cloud || legacyWritable(env.clock.now())`.
A tab open across the midnight keeps its value until reload (accepted). The
gate applies only where a cloud exists: an unconfigured build (no
`VITE_SUPABASE_*`, the `check:built` `dist/`) has no account to move into
and keeps local creation as decided 2026-09-24; the test build has the fake
cloud, so it exercises the gate.

The test build's clock is pinned: `main.ts`'s fake branch passes
`queryClock(location.search, Date.UTC(2026, 9, 1, 12))`, so every state is
"before the cutoff" unless its `today` says otherwise, and CI stays green
after 2026-10-26 until R10 deletes the pre-date states. `fakeEnv` defaults
to the same fixed clock. Decision file: section 11.

### 4.2 The fingerprint and the canonical form

The fingerprint is SHA-256 over a canonical JSON of the normalised browser
list, hex, 64 characters - computed **by the database** inside the RPC
(`encode(sha256(convert_to(p_canonical, 'utf8')), 'hex')`, core in
PostgreSQL 17), never by the client. The client sends the canonical text;
the server hashes the exact bytes it parses. No `crypto.subtle`, no digest
port, no async hash in `lib/`.

`canonicalList(l, knows)`:

1. `name` = `clip(l.name, NAME_MAX)` as stored (no trim: the rename writer
   keeps spaces).
2. `ids` = `l.ids` with unknown ids dropped (`knows`) and repeats dropped
   (the first kept), the `#/l/` decode's own rules.
3. `meta` = for each kept id with meta: `qty` only when `quantityOf(qty) > 1`
   (then that value), `gold` = `priceOf(gold)` when not null, `note` and
   `hnote` clipped to `NOTE_MAX` when non-empty; an entry with nothing
   left is dropped; an empty `meta` is dropped.
4. `money` only when `'coin'`; `note`/`hnote` clipped when non-empty.
5. `JSON.stringify` with every object's keys sorted (code-unit order), no
   whitespace: `{"hnote":..,"ids":[..],"meta":{"ci1":{"gold":150,"qty":2}},
   "money":"coin","name":..,"note":..}`.

Two lists that normalise alike are one fingerprint: the second is "already
moved" and leaves the browser too - the right answer for a duplicate. A
list with zero known entries still moves (an empty account list). The
read-back check (section 4.4) is string equality of
`canonicalList(toCloudList(row), knows)` with the text sent, so a mapping
defect fails the same way in every layer.

### 4.3 Schema and RPC (`B5.1`)

One migration, stamp the next free minute after the newest file at dispatch
(`.claude/README.md`, "Migration names"; **[refresh after B2.3]**: confirm
`20260925130300` is still the newest), `supabase/migrations/<stamp>_legacy_move.sql`:

```sql
alter table public.lists add column legacy_fingerprint text
  check (legacy_fingerprint ~ '^[0-9a-f]{64}$');
-- One account row per moved browser list, per owner: a second device that
-- moves the same list finds this row instead of making another.
create unique index lists_legacy_fingerprint on public.lists (owner_id, legacy_fingerprint)
  where legacy_fingerprint is not null;
```

The two limit triggers are re-created (drop trigger, drop function, create
function, create trigger, the revokes again - never `create or replace`)
with one new first statement each:
`if current_setting('dhloot.move', true) = 'on' then return null; end if;`.
The setting is transaction-local and only the RPC sets it, so a plain insert
still meets the limit. Decision 31 as the owner set it (roadmap section 16):
every valid browser list moves, above the limits too; afterwards the user
cannot add past a limit until they delete or the owner raises it.

```sql
create function public.move_legacy_list(p_id uuid, p_canonical text)
returns table (id uuid, inserted boolean)
language plpgsql security definer set search_path = public, pg_temp as $$
-- auth.uid() null -> 28000. length(p_canonical) > 1048576 -> 22023.
-- v_fp := encode(sha256(convert_to(p_canonical, 'utf8')), 'hex');
-- v := p_canonical::jsonb (a parse error -> 22023 'move_legacy_list: not a list');
-- validate: an object whose keys are among name, ids, meta, money, note,
--   hnote; name text <= 200 chars; ids an array of distinct text matching
--   '^[A-Za-z0-9_-]{1,64}$', at most 5000; meta an object whose keys are
--   among ids, each an object with optional qty int 1..99, gold int
--   1..99999, note/hnote text <= 4000; money 'bag' or 'coin'; note/hnote
--   text <= 4000. Anything else -> 22023 with the field named.
-- perform set_config('dhloot.move', 'on', true);
-- insert into public.lists (id, owner_id, name, money_mode, player_note,
--   gm_note, legacy_fingerprint) values (p_id, auth.uid(), ...)
--   on conflict (owner_id, legacy_fingerprint) where legacy_fingerprint is not null
--   do nothing returning lists.id into v_id;
-- v_id null -> select id from lists where owner_id = auth.uid() and
--   legacy_fingerprint = v_fp; return (that id, false).
-- else insert the entries with gen_random_uuid() ids, position = ordinality - 1,
--   quantity coalesce(qty, 1), price_coins gold, player_note/gm_note '' when
--   absent; return (v_id, true).
$$;
revoke execute on function public.move_legacy_list(uuid, text) from public, anon;
grant execute on function public.move_legacy_list(uuid, text) to authenticated;
```

Atomic: the list and its entries land together or not at all, so a network
drop cannot leave an empty account list carrying the fingerprint (the
client's two-upsert `create` could). Idempotent by `(owner_id,
legacy_fingerprint)`: a retry, a second load and a second device all get
the same id and `inserted = false`. `lists_before_update` is not changed:
an owner could set `legacy_fingerprint` through PostgREST on their own rows
only, which breaks nothing but their own idempotence; `ListPatch` never
carries it.

Reversal `supabase/reversals/<stamp>_legacy_move.sql`: drop the function,
re-create the two trigger functions with R2's bodies (copied from
`20260925130100_lists.sql`, with their triggers and revokes), drop the
index, drop the column. Not `-- additive` (the migration drops and
re-creates functions).

### 4.4 The automatic move (`B5.2`)

The move runs on the reader's behalf, with no press (owner, 2026-09-26:
"as seamless as possible for users who don't know about it"). Two guards
against a shared computer, both the owner's: a one-time notice naming the
moved lists, and the move runs only for the first account that signs in on
that browser.

`dhloot.migrated.v1` (`localStorage`, `STATE.md`) becomes
`{ owner: <userId>, lists: { [localId]: accountId }, notice?: string[] }`:
`owner` is the first account whose app loaded with browser lists; `lists`
are the tombstones (section 4.6); `notice` the names the one-time notice
still has to show. A value that does not parse reads as absent.

`app/src/state/legacyMove.svelte.ts`, class `LegacyMove` (`AppState.legacyMove`,
null without a cloud):

- `status: 'idle' | 'moving' | 'done' | 'failed'`, `moved`, `left`,
  `attention: { id: string; name: string }[]`, `foreign: boolean` (the
  browser's lists belong to another account's move).
- `runIfDue(userId)`: called by `AppState.#setUser` right after
  `cloudLists.load()` settles `ready` (beside `#runPending`), and again by
  `#watchAccount`'s key-less storage signal (the tab shown again) while the
  last run `failed`. Returns at once when `moving`, when no browser list is
  left (tombstones excluded), when storage does not work, or when
  `migrated.owner` is set and is not `userId` (`foreign = true`: the lists
  stay, nothing moves, no notice). When `migrated.owner` is absent it is
  written as `userId` before the first RPC - the first account is the one
  whose app first loaded with browser lists, whether or not the network
  then answered.
- The loop, unchanged from the RPC design: for each list, in order,
  `canonical = canonicalList(l, knows)`, `repo.move(repo.newId(),
  canonical)`. `ok` -> remembered `{ localId, accountId, inserted,
  canonical, name }`; `refused` -> `attention` (the list stays), continue;
  `network` -> stop the loop, `status = 'failed'`, `left` = the rest; what
  succeeded still goes through the read-back.
- Read-back: one `repo.list()`. `{ ok: false }` -> `failed`, nothing
  removed (the next run is idempotent, so nothing is lost). For each
  remembered result: the row with `accountId` must exist; `inserted` and
  `canonicalList(toCloudList(row), knows) !== canonical` -> `attention`
  (the account copy stays, the browser list stays; a mapping defect, not a
  user error); otherwise verified.
- Removal: `app.lists.removeMany(verifiedLocalIds)` - one storage write
  (section 4.6); `migrated.lists` gains `{ [localId]: accountId }` and
  `migrated.notice` gains the verified names (appended to what an earlier
  run left undismissed); `moved += n`; `cloudLists.refresh()` so the index
  draws the new rows. `status = 'done'` when nothing is left and nothing
  needs attention, else `failed` (retried on the next load or the next
  tab-shown signal) or the attention stays until the next run.
- A second load with the same lists (a resurrected copy, another device,
  a run whose answer was lost) sends the same canonical text and gets
  `inserted: false`: verified without the content check, removed,
  tombstoned, and its name is **not** added to the notice again.

What the reader sees (no button anywhere):

- The one-time notice: `MoveNotice.svelte`, drawn by `Shell.svelte`
  between the header and `<main>` at the page width, on every route while
  `migrated.notice` is non-empty: «Списки из этого браузера перенесены в
  ваш аккаунт: «Клад дракона», «Лавка в порту».» and one «Скрыть» that
  deletes `notice`. Kept until dismissed, across reloads and pages, so a
  reader who signed in on `#/i/ci1` sees it there. Not drawn under print
  media. Mock: `mocks/b52-move-notice.html`.
- A quiet status in the storage notice's slot on `#/lists` (the browser
  group's head) and on a browser list's page - `MoveStatus.svelte`:
  `moving` «Переносим списки в аккаунт...» (carries `data-moving` for the
  harness); `failed` «Не все списки перенесены: нет связи. Попробуем при
  следующем открытии.»; attention «Не перенесён: «Клад дракона». Сервер не
  принял список. Напишите на daggerheart.loot@gmail.com.»; `foreign`:
  today's storage notice (another account's lists, untouched). Signed out:
  the storage notice, whose `localOnly` gains before the date «Войдите -
  списки перенесутся в аккаунт сами. С 26 октября 2026 г. списки в
  браузере нельзя будет менять.» and after the date becomes «Списки в этом
  браузере только для чтения с 26 октября 2026 г.» / «Войдите - они
  перенесутся в аккаунт, и их снова можно будет править. Скопировать текст
  и напечатать можно и так.» (a third, not dismissable, form).
- Limits: the RPC moves a list of any size and a library of any count
  (4.3); the count limits bind again from the next ordinary write, with
  R2's toast naming the number and the contact address.

Partial failure and retry, without a button: a network drop leaves K of N
moved and removed, the rest untouched, the quiet status on `#/lists`, and
the next load (or the tab shown again) runs the loop again; a refusal keeps
that one list in the browser, named, and is tried again on the next load
(a schema defect, bounded to one call per list per load); a failed
read-back removes nothing. Every path is safe to repeat. An unconfigured
build (no cloud) moves nothing, gates nothing and draws no notice.

### 4.5 The read-only list and the retired page

Read-only after the date, every place (`app.legacyWritable === false`,
configured builds):

| Place | Before the date | After |
|---|---|---|
| `#/lists` browser cards | «Поделиться», «Удалить» (undo) | «Удалить» only, with the confirm and no undo (owner, 2026-09-26); the group heading and the notice/status stay |
| The tab bar | ten tabs | nine: `lists` leaves (section 4.9); `#/lists` stays a readable route |
| Browser list page, title | rename input | the input `readonly`, no `oninput` |
| Actions row | link buttons, copy text, print, delete | copy text, print, delete (confirm, no undo); no link buttons |
| Address bar | rewritten to the players' `#/l/` on every edit | never rewritten: the page stays at `#/lists/<id>` (`scheduleUrlSync` gated) |
| Money chips, list notes, roll panel | editable | chips `disabled`; textareas `readonly`, no handler; the roll panel works (it writes nothing) |
| Rows | grip, position field, quantity, price, note buttons, remove cross | no grip, position field `readonly`, quantity and price `readonly`, note boxes open read-only, no remove cross |
| Batch bar | tick, copy, prices, delete (N) | tick and copy only |
| `AddToList` menu | account and browser lists as targets | account lists only; signed out, the prompt alone |
| `#/l/<payload>` (own or not), `#/l/~<packed>` | the list or the shared page | the retired-link page: «Ссылки такого вида перестали открываться 26 октября 2026 г.» / «Попросите у отправителя новую ссылку или войдите, чтобы собрать список.» and one button «Списки» to `#/lists`; the payload is never decoded, a packed one never unpacked (`#expand` gated); the address is kept |
| Old `#/l/` «Сохранить себе» pending action | saves into the account | dropped: the route draws the retired page |
| `help.ts` "Lists", `llms.txt`, `META.md` section 3 | name the date | the same text (static) |

Consequence named to the owner: after the date a signed-out reader reaches
browser lists only through `#/lists` (typed, bookmarked, or the retired
page's «Списки» button); signing in moves them.

Mocks: `mocks/b52-read-only-list.html`, `mocks/b52-retired-link.html`.

### 4.6 The local write path and the two-tab merge

The roadmap says R5 removes the merge with the local write path. In one
build the date selects the behaviour at run time, so the code of the
pre-date writers stays until R10 deletes them (with the codec, the browser
group and `mergeLists`). What R5 does: after the date the only browser-list
writes are the move's removal and a delete, and both go through one new
method that needs no merge:

- `ListStore.removeMany(ids): boolean` - reads storage fresh
  (`#readCurrent() ?? []`), filters `ids` and `#deleted` out, writes that
  array, sets `this.lists` from it (so this tab's memory is the stored
  truth, never the other way round), marks `#deleted`. No `mergeLists`: a
  removal is right against fresh storage by construction, and another
  tab's additions survive.
- Before the date, delete keeps `remove()` + `restoreList()` (undo), as
  tested; after the date, delete is `removeMany([id])` after the confirm,
  no undo (a write the read-only window would otherwise forbid; the
  account list's delete has none either). The owner confirmed delete stays
  (2026-09-26).
- Tombstones: `migrated.lists`, read once at `ListStore` construction;
  `#readCurrent` filters those ids like `#deleted`, and `removeMany`'s next
  write drops them from the key. A backgrounded tab whose memory still held
  a moved list, a storage rollback, a copy another tab appended: none is
  drawn again, and the account already holds the list by fingerprint - a
  moved list is never duplicated. Bounded: one id pair per moved list.

Deleting the merge in R5 was rejected: browser lists stay editable for the
two weeks between R5's deploy and the date, and two tabs would lose lists
again for exactly that window. Decision file: section 11.

### 4.7 Port, adapters, fake

- `ports/types.ts`: `MoveWrite = { ok: true; id: string; inserted: boolean }
  | { ok: false; error: 'network' | 'refused' }`; `ListRepository.move(id,
  canonical): Promise<MoveWrite>`; `ListRow.legacy_fingerprint: string | null`.
- `supabase.ts`: `LIST_SELECT` gains `legacy_fingerprint`; `move` =
  `rpc('move_legacy_list', { p_id, p_canonical })`; a thrown call, status 0
  or >= 500 or no code -> `network`; any error -> `refused`; `data[0]` ->
  `{ ok: true, id, inserted }`.
- `lazy-cloud.ts`: forwards; a chunk that never arrives answers `network`.
- `fake-cloud.ts`: per user a `Map<canonical, id>`; `move` parses the
  canonical with the same rules the RPC applies (a bad one answers
  `refused`), inserts a `Held` with `legacy_fingerprint` = FNV-1a hex of
  the text repeated to 64 characters (`listLink.ts`'s hash; the fake never
  meets the database, so its value only has to be 64 hex and stable),
  answers `inserted: true`, then `false` for the same text; `offline`
  answers `network`; signed out `refused`. `list()` carries the column.
  No `crypto.subtle`: jsdom has none, and the value is never compared with
  the real one.
- `cloud.contract.ts` case H: `move` of a canonical text answers `inserted
  true` and an id; the same text again the same id and `false`; `list()`
  shows the row with a 64-hex `legacy_fingerprint`, the name, the entries
  in order with quantity and price; a text that is not a list is `refused`.

### 4.8 The harness

- `tests/app/driver.js` `open(route, { as, today })` builds `?as=..&today=..`;
  `moveSettled()` waits until no `[data-moving]` is on the page (the
  automatic move settles before a capture); `golden.js` writes `# today:
  <date>` for a state with `today`; `golden.test.mjs` pins it. The pinned
  default (4.1) keeps every existing state where it is.
- `COVERAGE.md` "Test layers" documents `?today=` beside `?as=`, the
  pinned clock and `moveSettled()`.

### 4.9 The account menu, display settings, the Lists tab (`B5.3`)

Owner, 2026-09-26: the header's account control opens a menu «Настройки
отображения», «Мои списки», «Мои предметы» (R7), «Выйти»; the Lists tab
leaves at the cutoff (lists are account-only then); «Настройки отображения»
supersedes the roadmap's "not in v1: a preferences page" (section 17) -
the smallest form over the existing `user_prefs` settings.

- **The control**: signed out, unchanged (the «Войти» link to `#/account`).
  Signed in, the same 38px circle becomes a `<button>` with
  `aria-label` «Аккаунт: <email>», `aria-haspopup="menu"`, `aria-expanded`
  and, on `#/account`, `aria-current="page"` and the gold ring as today. It
  opens `AccountMenu.svelte`: `role="menu"` with three items -
  «Настройки отображения» (a `menuitem` link to `#/account`), «Мои списки»
  (`#/lists`), «Выйти» (a `menuitem` button calling `app.signOut('local')`,
  the toast «Вы вышли из аккаунта.»; on an account list's page
  `#listsSignedOut` already replaces the address with `#/lists`). Closes on
  a choice, Escape (focus back to the control), an outside click and a
  navigation; Up/Down/Home/End move between items. Its box reuses
  `AddToList`'s `.dropmenu` values (border `--line2`, radius 11px, the
  `--surface` ground, the drop shadow), right-aligned under the control.
  R7 adds «Мои предметы» between the second and the third item.
  `AppState.signOut(scope)` is extracted from `AccountPage.svelte`'s
  `signOut` (its second real use), the page keeping its `busy` wrapper.
- **Display settings**: `AccountPage.svelte` gains, signed in, a first
  section «Отображение» / "Display" (a `Field heading` panel before «Вы
  вошли как»; the menu item's name, «Настройки отображения», is the
  section's long name): «Язык» - the `Seg` RU/EN (`app.setLang`); «Раздел при
  запуске» - a `<select>` over the ten sections (`SECTION_LABEL`), the
  pinned hash selected, `#/roll/std` by default; a pinned `#/tables/<t>`
  shows as «Таблицы» and keeps its hash until changed; the change calls the
  new `AppState.setHome(hash)` (writes `dhloot.home.v1` or removes it for
  the default, then `#changed()`, the same as `toggleHome`); «Таблицы» -
  the `Seg` «Списком» / «Сеткой» (`setTablesView`); «Печать» - the `Seg`
  «Цветная» / «Чёрно-белая» (`setPrintBW`) and a checkbox «Компактный
  лист» (`setPrintCompact`); «Сообщать владельцу списка» / "Notify the list
  owner" - the remembered choice of R4's "Notify the GM?" question
  (`user_prefs.notifyGm`: «спрашивать» / «всегда» / «никогда», a `Seg` of
  three; owner, 2026-09-26): R5b adds the row reading and writing the
  field through a new `AppState.notifyGm` getter and `setNotifyGm` (the
  `Prefs` type and `readPrefs` gain `notifyGm?: 'ask' | 'always' | 'never'`,
  default `ask`), and R4's flow reads that field instead of adding a
  control elsewhere. Every control writes through the setters the pages
  already use, so the account row follows (`STATE.md`, "Account
  preferences"); the page's `busy` state does not cover them. The page
  title stays «Аккаунт»; the menu item leads to `#/account` and the section
  is first, so no route is added. Mock: `mocks/b53-account-menu.html`.
- **The Lists tab**: `TabBar` takes `tabs` from `Shell`, which leaves
  `lists` out when `!app.legacyWritable`. `#/lists` stays a readable route
  (the menu's «Мои списки», bookmarks, the pin, the retired page's button);
  no route, fixture or `tests/contracts.js` change. `ROUTES.md` "Sections"
  gains the sentence: from the cutoff the tab bar draws nine of them, and
  `#/lists` is reached from the account menu. The `tab` field of `#/lists`
  in `docs/fixtures/urls/routes.json` stays as it is while the test build is
  pinned before the date; R10 (the release that removes the pinned clock)
  sets it to `null` in its contract batch.
- **Goldens**: every `as gm1`/`as gm2` state re-seeds once for the header
  button (the `aria-label` and role change: about 14 states); the after-date
  states show nine tabs; `#/account as gm1`/`as gm2` gain the Display
  section; new states `#/roll/std ~ account menu as gm1` (open) and
  `#/account ~ display as gm2`. F2 (E2E) reads the button's `aria-label`.

## 5. Contracts and behaviour that stay stable

- No public-contract change: the route grammar keeps `#/l/<payload>` and
  `#/l/~<payload>` as `sharedList` (the retired page is reached, never the
  home fallback) and `#/lists` as a section route (the tab leaves the bar,
  the route stays); `docs/fixtures/urls/routes.json` and
  `tests/contracts.js` do not change in R5 (R10 sets `#/lists`'s `tab` to
  `null` with the codec's removal); `CONTRACTS.md` section 3 carries the
  date (B2.3 adds the line; R5 keeps it in step with the constant through
  `tests/derived.js`).
- `data.js`, `data.json`, `catalog.csv`, the print grammar, `#/lists/<id>`
  for both list kinds, the account preferences' keys and precedence:
  unchanged.
- The `#/s/` shared page and the share panel (B2.3): unchanged by R5 except
  step 9.14 (the date text reads the constant).
- `dhloot.lists.v1` is never touched (`STATE.md`); `dhloot.lists.v2` is
  never deleted, only rewritten with fewer lists.
- `#/account`'s existing sections, order and texts stay; the Display
  section is added before them.

## 6. Tests, fixtures, documentation per batch

`B5.1`: `tests/db/legacy-move.test.mjs`, the reversal, `COVERAGE.md`
("Suites", `tests/db/`). `B5.2`: unit and component tests named in section
9, inventory states and goldens, states cases 43-44, E2E F8, contract case
H, `FEATURES.md` ("Lists", "Account lists" renamed "Account and browser
lists" with the move and the read-only subsections), `STATE.md`
(`dhloot.migrated.v1`; "Two tabs" gains the post-date paragraph), `ROUTES.md`
(`#/l/` rows), `META.md` section 3, `I18N.md` (the date text rule),
`COVERAGE.md` (feature row, `?today=`, `moveSettled()`), `llms.txt`.
`B5.3`: `shell.test.ts`, `accountMenu.test.ts`, `accountPage.test.ts`,
`app.test.ts` (`setHome`, `signOut`), states case 45, F2, the goldens,
`FEATURES.md` ("Account", "Chrome"), `ROUTES.md` ("Sections"),
`STATE.md` ("Account preferences": the section), `COVERAGE.md`.
`docs/specs/DEBT.md` only if a defect is kept. The roadmap's section 6 row
18 is the list of superseded text; the pages fragments need nothing.

## 7. Batches: gates, cost, review, split criterion

Costs: this host, idle, one green pass (`issues/persist-2-lists/context.md`,
re-measured 2026-09-25: `check` 348 s, `check:built` 19 s plus its two
builds, `app/states` 197 s, a golden shard 100-290 s, `check:db` about 3
min warm, `npm run e2e` 50 s).

| Batch | Goal | Gates (cost) | Review | Split criterion |
|---|---|---|---|---|
| `B5.1` | the column, the index, the exempted limit triggers, `move_legacy_list`, its layer 3 matrix and reversal (section 8) | `rtk npm run check` (6 min), `npm run check:db` through PowerShell (3-5 min) - about 10 min | required (the schema rule; every `supabase/` batch) | new release (R5) |
| `B5.2` | the constant and the clock, the port and the fake, the automatic move with its notice and status, read-only mode, the retired page, the texts and specs, the harness switch, layer 1-4 coverage (section 9) | `rtk npm run check` x2 (12 min), `build:test` + `check:built` (2 min), `node tests/run-all.js app/states,app/contracts` (8 min), goldens `--update` 4 shards (12-17 min), `node tests/app/sweep.js 360` (7 min), `npm run e2e` (1 min) - about 45 min | required (new UI; data safety: a browser list leaves storage without a press) | SQL judged apart from Svelte (a review that cannot be held in one pass; the `B2.1`/`B2.2` precedent), and layer 4 needs the RPC on the test project first |
| `B5.3` | the account menu, `AppState.signOut`/`setHome`, the Display section of `#/account`, the Lists tab gone after the date (section 9b) | `rtk npm run check` x2 (12 min), `check:built` (2 min), `app/states` (4 min), goldens 4 shards (12-17 min), `sweep` at 360 (7 min), `npm run e2e` (1 min) - about 40 min | required (new UI on every page) | a different component set and seed (`Shell`, `AccountPage`, no browser-list seed) and a review that cannot be held in one pass with `B5.2`; release R5b (owner, 2026-09-26, section 12) |
| closeout | section 10 | CI on the push (`e2e` with `migrate-test`, `migrate-prod`, `deploy`); the owner's device check | - | - |

Total gate cost, one green pass per batch: about 95 minutes (55 for
`B5.1`+`B5.2`, 40 for `B5.3`), plus three reviews and the closeouts' CI
watch. Not split inside `B5.2`: the notice, the status, read-only mode and
the retired page share `ListsPage.svelte`, `ListPage.svelte`, `Shell.svelte`'s
one slot, the `two`/`seven`/`noted` seeds and the `app/states` filter; the
README's test says merge. Named fallback: if the reviewer reports `B5.2`'s
diff cannot be held in one pass, the remediation splits it at the
port/store/fake seam (first) and the UI (second) as two amends of the one
commit.

## 8. Batch `B5.1` - schema and RPC (implement-ready)

Objective: `legacy_fingerprint`, its partial unique index, the limit
exemption under `dhloot.move`, `move_legacy_list(uuid, text)`, the layer 3
proof and the reversal.

In scope: one migration, one reversal, one test file, `COVERAGE.md`. Out of
scope: any file under `app/`, `tests/app/`, `tests/e2e/`.

Files: `supabase/migrations/<stamp>_legacy_move.sql`,
`supabase/reversals/<stamp>_legacy_move.sql`, `tests/db/legacy-move.test.mjs`,
`tests/db/lists.test.mjs` (add `move_legacy_list` to the EXECUTE matrix
case), `docs/specs/COVERAGE.md` ("Suites", the `tests/db/` paragraph gains
the file).

Steps:

1. **[refresh after B2.3]** Read the newest file under `supabase/migrations/`
   and pick the stamp: the next free minute after it, UTC
   (`.claude/README.md`, "Migration names"). Never edit an applied file.
2. Write the migration as section 4.3, in this order: the column with its
   check, the partial unique index, `drop trigger lists_limit on
   public.lists; drop function public.lists_limit();`, `create function
   public.lists_limit()` with the R2 body plus the first statement
   `if current_setting('dhloot.move', true) = 'on' then return null; end
   if;`, `create trigger lists_limit ...` as before; the same for
   `list_entries_limit`; the two `revoke execute ... from public, anon,
   authenticated`; then `move_legacy_list` (security definer, `set
   search_path = public, pg_temp`, the validation, the transaction-local
   `set_config`, the insert with `on conflict (owner_id, legacy_fingerprint)
   where legacy_fingerprint is not null do nothing`, the entries insert from
   `jsonb_array_elements_text(v->'ids') with ordinality`, the return), its
   revoke and grant. A comment on each object names `docs/specs/FEATURES.md`,
   "Browser lists". Error codes: `28000` signed out, `22023` for every
   validation failure with the message `move_legacy_list: <what>`.
3. Write the reversal: `drop function public.move_legacy_list(uuid, text);`,
   drop and re-create both trigger functions with R2's exact bodies and
   triggers and revokes, `drop index public.lists_legacy_fingerprint;`,
   `alter table public.lists drop column legacy_fingerprint;`.
4. `tests/db/legacy-move.test.mjs` (node:test, `asRole`, the `lists.test.mjs`
   shape): grants (`anon` and `service_role` no EXECUTE, `authenticated`
   EXECUTE; the column exists with its check; the index is unique and
   partial); as A a canonical `{"ids":["ci1","q1"],"meta":{"ci1":{"gold":150,
   "qty":2}},"money":"coin","name":"Клад","note":"p"}` answers `inserted
   true` and the id given, the row reads back with `legacy_fingerprint`
   matching `^[0-9a-f]{64}$` equal to `encode(sha256(convert_to(...)),
   'hex')` computed in the test, the two entries in order with quantity 2
   and price 150; the same text with another `p_id` answers the first id
   and `false` with no new rows; a different text answers another id; as B
   the same text as A's answers B's own new row; signed out (no sub) ->
   `28000`; the exemption both ways: 55 moves as A pass while a plain
   insert of a 56th list as A is refused `limit: lists_per_owner`, and a
   moved list of 120 entries passes while a plain insert of one more entry
   into it is refused `limit: entries_per_list`; refused texts, each `22023`
   with the field named: not JSON, an array, an unknown key, an id with a
   space, a repeated id, `qty` 100, `gold` 0, a meta key not in `ids`, a
   name of 201 characters, `money` `"gold"`; a plain insert with a
   `legacy_fingerprint` of 63 characters fails the check; the reversal is
   paired (the reversibility gate runs it).
5. `npm run check:db` through the PowerShell tool (the local stack;
   `docs/specs/COVERAGE.md`, "Test layers"); then `rtk npm run check`
   (Bash, timeout 600000).
6. Apply the migration to the test project: `npm run db:push -- --project
   test` (agents may; `.claude/README.md`, "Supabase configuration") - or
   leave it to CI's `migrate-test` at the closeout push if the owner
   prefers; `B5.2`'s `npm run e2e` needs it on the test project.

Acceptance:

- `check:db` green with the new file's cases and the reversibility gate
  over the new pair; `check` green.
- The exemption is proven in both directions (the plain insert still
  refused).
- Idempotence proven per owner (A twice, then B).
- `COVERAGE.md` names the file.

Verification: `npm run check:db` (PowerShell), `rtk npm run check` (Bash,
timeout 600000), the handoff records both outputs' counts.

Risks / do-nots: do not `create or replace`; do not touch
`lists_before_update`; do not widen the entry `snapshot` bound; do not
grant anything to `anon`; keep the message prefix `limit: <key>` unchanged
(the client's contract).

## 9. Batch `B5.2` - the move and the cutoff (implement-ready except the marked steps)

Objective: the automatic move into the account with its two guards, the
cutoff behaviour, the retired page, the announcement, the harness switch,
coverage in every layer.

In scope: sections 4.1, 4.2, 4.4-4.8. Out of scope: schema (done in
`B5.1`), section 4.9 (`B5.3`), the codec's deletion, the browser group's
deletion.

Files expected to create: `app/src/lib/legacy.ts`, `legacy.test.ts`,
`app/src/ports/clock.ts` (covered through `ports.test.ts`),
`app/src/state/legacyMove.svelte.ts`, `legacyMove.test.ts`,
`app/src/components/MoveNotice.svelte`, `moveNotice.test.ts`,
`MoveStatus.svelte`, `moveStatus.test.ts`. To edit: `ports/types.ts`,
`ports/index.ts` (`browserEnv`, `fakeEnv`), `ports/supabase.ts`,
`supabase.test.ts`, `lazy-cloud.ts`, `lazy-cloud.test.ts`, `fake-cloud.ts`,
`fake-cloud.test.ts`, `cloud.contract.ts`, `lib/cloudLists.ts` (`ListRow`),
`state/lists.svelte.ts` (`removeMany`, the tombstones), `lists.test.ts`,
`state/app.svelte.ts`, `app.test.ts`, `main.ts`, `components/Shell.svelte`
(the notice slot), `shell.test.ts`, `ListsPage.svelte`, `listsPage.test.ts`,
`ListPage.svelte`, `listPage.test.ts`, `AddToList.svelte`, `lists.test.ts`
(components), `StorageNotice.svelte`, `SharedListPage.svelte`,
`sharedListPage.test.ts`, `a11y.test.ts`, `lib/dict.ts`, `lib/help.ts`,
`help.test.ts`, `tests/app/driver.js`, `golden.js`, `golden.test.mjs`,
`inventory.js`, `states.js`, `tests/e2e/flows.mjs`, `admin.mjs`, `run.mjs`
("8 cases"), `tests/derived.js`, `docs/specs/FEATURES.md`, `STATE.md`,
`ROUTES.md`, `META.md`, `I18N.md`, `COVERAGE.md`, `llms.txt`.

Behaviour and UI constraints: sections 4.1-4.6 and the three mocks; the
status takes the storage notice's slot and its width; the notice sits
between the header and `<main>` at `--wrap` width with the notice's
padding; nothing else on any page moves.

Steps:

1. `lib/legacy.ts` as 4.1-4.2 with `legacy.test.ts`: the constant is
   2026-10-26 00:00 UTC; `legacyWritable` one ms before and at it; the date
   text in both languages; `canonicalList` pinned to one vector (the seed
   `noted` list from `tests/app/inventory.js` with an unknown id and a
   repeat added, `qty` 1 and `gold` 0 dropped, a 4001-character note
   clipped, keys sorted at both levels, the same output for the same list
   with keys in another order); `canonicalList(toCloudList(row), knows)`
   equals the text for a row built from it (`entryRowsOf`).
2. `ports/clock.ts`, `Env.clock`, `browserEnv` (`Date.now`), `fakeEnv`
   (`fixedClock(Date.UTC(2026, 9, 1, 12))`), `main.ts`'s fake branch
   (`queryClock(location.search, that default)`), the production branches
   (`browserClock()`); `ports.test.ts` covers `queryClock` (`?today=2026-10-26`,
   a bad value falls back, an absent one falls back).
3. `dict.ts`, both languages, `%d` = `legacyDateText`: `movedNotice`
   («Списки из этого браузера перенесены в ваш аккаунт: %s.»), `dismiss`
   reused for «Скрыть»; `moving` («Переносим списки в аккаунт...»),
   `moveFailed` («Не все списки перенесены: нет связи. Попробуем при
   следующем открытии.»), `moveAttention` («Не перенесён: %s.»),
   `moveAttentionWhy` («Сервер не принял список. Напишите на
   daggerheart.loot@gmail.com.»), `localOnlyMove` («Войдите - списки
   перенесутся в аккаунт сами. С %d списки в браузере нельзя будет
   менять.»), `localReadOnlyTitle` («Списки в этом браузере только для
   чтения с %d.»), `localReadOnly` («Войдите - они перенесутся в аккаунт, и
   их снова можно будет править. Скопировать текст и напечатать можно и
   так.»), `linkRetired` («Ссылки такого вида перестали открываться %d.»),
   `linkRetiredSub` («Попросите у отправителя новую ссылку или войдите,
   чтобы собрать список.»), `toLists` («Списки»); `localOnly` loses nothing
   and `localOnlyMove` follows it as a second paragraph. English in parity:
   "Lists from this browser were moved to your account: %s.", "Moving your
   lists to your account...", "Not every list was moved: no connection. We
   will try again next time.", "Not moved: %s.", "The server did not take
   the list. Write to daggerheart.loot@gmail.com.", "Sign in and your lists
   move to your account by themselves. From %d, lists in the browser cannot
   be changed.", "Lists in this browser are read-only from %d.", "Sign in
   and they move to your account, where you can edit them again. Copying
   the text and printing still work.", "Links of this kind stopped opening
   on %d.", "Ask the sender for a new link, or sign in to build a list.",
   "Lists".
4. `ports/types.ts`, `lib/cloudLists.ts` (`ListRow.legacy_fingerprint`),
   `supabase.ts` (`LIST_SELECT`, `move`), `supabase.test.ts` (the stub's
   `rpc` answers `[{ id, inserted }]`, an error maps to `refused`, a throw
   to `network`), `lazy-cloud.ts` and its test, `fake-cloud.ts` and its
   test (4.7), `cloud.contract.ts` case H, `tests/e2e/contract.mjs` ("8
   cases" in `run.mjs`).
5. `state/lists.svelte.ts`: `removeMany(ids)` (4.6); `MIGRATED_KEY =
   'dhloot.migrated.v1'` read at construction into `{ owner, lists, notice }`
   (a value that does not parse reads as absent), `lists` filtered in
   `#readCurrent` and pruned by `removeMany`'s write; `migrated` getter and
   `markMoved(owner, pairs, names)` / `dismissNotice()` writers (a refused
   write is reported through `saved`; the lists are gone from storage
   already). `lists.test.ts`: `removeMany` against fresh storage another tab
   grew (the other tab's list survives, the removed do not, `#deleted`
   holds them, `lists` equals storage after); a tombstoned id seeded in
   storage is not drawn and leaves storage on the next `removeMany`; the
   key's bad value reads as absent; `markMoved` appends names to an
   undismissed notice.
6. `state/legacyMove.svelte.ts` as 4.4 with `legacyMove.test.ts` over the
   fake cloud and `memoryStorage`: `runIfDue` moves two lists, both rows
   read back with the canonical text, storage holds `[]`, `owner` and the
   tombstones, `notice` the two names; a `refused` list stays and is named;
   `setOffline` after the first `move` -> `failed`, `left` 1, the first
   removed, the second still there, a second `runIfDue` finishes it and
   adds only the second name; a read-back that fails removes nothing and
   the next run is `inserted: false` for both; a row that reads back
   differently (the fake patched between the move and the read) ->
   attention and nothing removed; the same lists run twice -> the second
   run inserts nothing, removes the resurrected copies and adds no name;
   `owner` set to another id -> `foreign`, nothing moves, no notice; a
   store whose storage does not work -> returns at once.
7. `state/app.svelte.ts`: `legacyWritable` (4.1), `legacyMove`;
   `#setUser` calls `legacyMove.runIfDue(s.userId)` after `load()` settles
   `ready` (before `#runPending`, which waits for `ready` anyway);
   `#watchAccount`'s key-less signal calls it again while the last run
   `failed`; `#expand` returns at once when not writable (`expandFailed`
   stays `''`); `#runPending`'s `saveList` decodes only when writable.
   `app.test.ts`: the run after sign-in with browser lists seeded, no run
   without them, the retry on the signal, the two gates.
8. `MoveNotice.svelte` (props `app`; reads `app.lists.migrated.notice`):
   the sentence with the names quoted «...» joined by ", ", a «Скрыть»
   button (`app.lists.dismissNotice()`), `role="status"`; hidden under
   `@media print`. `moveNotice.test.ts`: drawn with names, gone after the
   press and the key updated, absent with none, axe. `Shell.svelte` draws
   it between the header and `<main>` (a build with a cloud only);
   `shell.test.ts` covers it.
9. `MoveStatus.svelte` (props `app`): the `moving` (with `data-moving`),
   `failed`, attention forms of 4.4; nothing when `idle`/`done` with no
   attention. `moveStatus.test.ts`: each form, axe. `StorageNotice.svelte`:
   the second paragraph before the date when a cloud exists
   (`localOnlyMove`), the read-only form after it (not dismissable; drawn
   even with `warnHidden`). `ListsPage.svelte`: at the browser group's head
   `{#if app.user && app.legacyMove && !app.legacyMove.foreign}<MoveStatus/>
   {:else}<StorageNotice/>{/if}` (the group itself is drawn while browser
   lists exist, as today; `moving` keeps the cards until the removal);
   local cards draw «Поделиться» only when writable; `del` after the date:
   the confirm, `removeMany([id])`, the toast without «Вернуть».
   `listsPage.test.ts`: the status forms in the slot, the notice signed out,
   the foreign case, the cards after the date (fake clock), the delete
   paths both sides of the date.
10. `ListPage.svelte` **[refresh after B2.3]** (the actions row gains the
    share panel there): `readOnly = $derived(!isCloud && !app.legacyWritable)`;
    the table in 4.5 line by line - `readonly` attributes and no handlers
    (a synthetic `input` event must not write: `oninput={readOnly ?
    undefined : rename}` and alike), the grip and the cross not drawn, the
    chips `disabled`, the batch bar's «Цены» and «Удалить (N)» not drawn,
    the link buttons not drawn, `scheduleUrlSync` only when writable, `del`
    as the index; the `!own` branch draws the retired page first: `{#if
    route.kind === 'sharedList' && !app.legacyWritable}` `PageTitle`
    (`linkRetired`, `linkRetiredSub`) and «Списки» (`href` `#/lists`,
    `sameTab`); the status in the notice slot (the same swap as the index).
    `listPage.test.ts`: every row of the table both sides of the date; a
    typed rename and a typed quantity write nothing after the date; the
    address stays `#/lists/a`; the retired page for a plain, a packed and
    an own payload after the date, the address kept.
11. `AddToList.svelte` **[refresh after B2.3]**: `all` = account lists only
    when not writable (signed out: none). `components/lists.test.ts`: the
    chips after the date.
12. `SharedListPage.svelte` **[refresh after B2.3]**: nothing after the date
    (never mounted); before it, B2.3's announcement line reads
    `legacyDateText` (step 14).
13. `help.ts` `LISTS`: paragraph 2 gains «Списки, созданные до входа, при
    входе переносятся в аккаунт сами; с 26 октября 2026 г. списки в
    браузере нельзя будет менять.»; paragraph 4 ends «Ссылки вида #/l/
    перестанут открываться 26 октября 2026 г.»; English alike;
    `help.test.ts` pins the date in both.
14. **[refresh after B2.3]** B2.3's date texts (`dict.ts`, the shared page's
    announcement, `llms.txt`, `CONTRACTS.md` section 3): the app texts take
    `%d` from `legacyDateText`; the documents keep the literal and step 15
    checks it.
15. `tests/derived.js`: `console.log('legacy write cutoff')`; read
    `LEGACY_WRITE_UNTIL`'s `Date.UTC(y, m, d)` from `app/src/lib/legacy.ts`;
    require `2026-10-26` (ISO) in `llms.txt`, `docs/specs/CONTRACTS.md`,
    `docs/specs/FEATURES.md`, `docs/specs/META.md`, `docs/specs/STATE.md`,
    `docs/specs/ROUTES.md`, and «26 октября 2026» plus "26 October 2026" in
    `app/src/lib/help.ts` - each file named in a `LEGACY_DATE_FILES` array
    beside `COUNT_BEARING_FILES`, so moving the date is one edit in
    `legacy.ts` and the edits the failing check names.
16. `tests/app/driver.js` `open(route, { as, today })` and `moveSettled()`,
    `golden.js` (`# today:`), `golden.test.mjs` (the pin), `inventory.js`:
    every signed-in state with a browser-list seed now ends with the move
    settled - `#/lists as gm1` (seed `two`: the notice under the header
    naming both lists, the two lists first in «Ваш аккаунт» at `uuid(5000)`
    and `uuid(5001)` with «изменён только что», no browser group),
    `#/i/ci1 ~ list menu as gm1`, `#/i/ci1 ~ new list as gm2`, `#/i/ci1 ~
    new list from a search as gm2` (their seeds moved into the account: the
    notice above, the chips now account lists) - each `enter` starts with
    `await d.moveSettled()`; new states: `#/lists ~ notice dismissed as
    gm1` (seed `two`, press «Скрыть»: no notice, the account lists stay),
    `#/lists ~ another account as gm2` (seed `two` plus
    `dhloot.migrated.v1` `{ owner: uuid(1), lists: {} }`: the browser group
    with today's notice, nothing moved, no notice above), `#/lists ~
    read-only` (`today: '2026-10-26'`, seed `seven`, signed out: the
    read-only notice, cards without «Поделиться», nine tabs), `#/lists/a ~
    read-only` (`today`, seed `noted`: the read-only page), `#/l/ ~ retired`
    (`today`, the `QTY_AND_PRICE.player.payload` route: the retired page),
    `#/l/ ~ own list, retired` (`today`, seed `seven`, the own payload of
    the `~ own list` state: the retired page, never the list). Re-seed the
    goldens the notice text changes touch (`_lists_two_lists`,
    `_lists_notice_unfolded`, `_lists_help`, `_lists_a*` with the notice
    open).
17. `tests/app/states.js` case 43 (the automatic move, two tabs of one
    context: tab B opens `#/lists` signed out with seed `two` and is
    backgrounded; tab A opens `#/lists` as `gm1` and `moveSettled()`; A's
    `dhloot.lists.v2` reads `[]`, `dhloot.migrated.v1` holds `owner`
    `uuid(1)`, both tombstones and both names, `fake('lists.list')` holds
    both rows with a 64-hex `legacy_fingerprint` and the entries, the notice
    is on the page and «Скрыть» clears `notice`; tab B, shown again, draws
    no browser card; then a fresh page as `gm2` with seed `two` and
    `dhloot.migrated.v1` `{ owner: uuid(1), lists: {} }` moves nothing and
    `fake('lists.list')` holds `gm2`'s seeded list only) and case 44
    (read-only: `#/lists/a` with `today` 2026-10-26 and seed `noted`;
    `d.type` into the title and a quantity changes `dhloot.lists.v2` by
    nothing, the address stays `#/lists/a`, no `#/l/` rewrite lands after
    `addressSettled()`; the own `#/l/` payload draws the retired page; the
    tab bar has nine links and none reads «Списки»). Update the header
    count ("Forty-four cases").
18. `tests/e2e/flows.mjs` F8 and `admin.mjs` (`listsOf` selects
    `legacy_fingerprint`): the member's lists cleared; a context seeded
    with one browser list (`ci1` x2 at 150, a note) opens `#/lists` as the
    member and waits for «Ваш аккаунт» to hold the list; `listsOf` reaches
    one row whose `legacy_fingerprint` matches `^[0-9a-f]{64}$` with `ci1`;
    the page's `dhloot.lists.v2` reads `[]`, `dhloot.migrated.v1` names
    the member's id as `owner` and the account id; the notice names the
    list; a second context with the same seed opens `#/lists` and `listsOf`
    still holds one row with the same id; a third context with the same
    seed plus `dhloot.migrated.v1` `{ owner: <member id>, lists: {} }`,
    signed in as a throwaway, moves nothing (`listsOf(throwaway)` empty,
    the browser list still on the page); cleared after. `run.mjs` counts
    "8 cases" for the contract.
19. Specs (section 6) and `llms.txt`; `COVERAGE.md` feature row "Browser
    lists move into the account; the cutoff" naming every test above.
20. Gates: `rtk npm run check`; `rtk npm run build:test`; `rtk node
    tests/run-all.js app/states,app/contracts`; goldens per shard with
    `--update`, then the diff read golden by golden; `rtk node
    tests/app/sweep.js 360`; `rtk npm run check:built`; `rtk npm run e2e`
    (the RPC must be on the test project: step 8.6).

Acceptance criteria:

- A signed-in reader whose app loads with browser lists sees them move
  without a press: each appears in «Ваш аккаунт» with its entries,
  quantities, prices, notes and money mode; the browser group empties;
  `dhloot.lists.v2` holds `[]`; `dhloot.migrated.v1` holds the owner, the
  tombstones and the names; the notice names the moved lists on every page
  until «Скрыть» (goldens, case 43, F8).
- The move runs only for the first account on the browser: a second
  account sees the remaining browser lists untouched and no notice (case
  43, F8, `legacyMove.test.ts`).
- A second load, a second device or a resurrected copy makes no second
  account row and adds no name to the notice (contract H,
  `legacy-move.test.mjs`, F8, `legacyMove.test.ts`).
- A network drop mid-run leaves K of N moved and removed, the quiet status
  on `#/lists`, and the next load or tab-shown signal finishes the rest; a
  refusal keeps that list in the browser and names it; a failed read-back
  removes nothing (`legacyMove.test.ts`, `app.test.ts`).
- A list over 100 entries and a library over 50 lists move whole (layer 3).
- After the date, in a configured build: every row of the 4.5 table
  (goldens `~ read-only`, case 44, component tests); `#/l/` draws the
  retired page for a plain, a packed and an own payload, the address kept;
  no `#/l/` rewrite ever lands; delete works with the confirm and no undo.
- Before the date nothing changes for a signed-out reader but the notice's
  second paragraph.
- Signed out, no cloud, or a build with no sign-in configured: no move,
  no notice, no gate.
- The test build is before the cutoff by default; `?today=` moves it; the
  goldens and `golden.test.mjs` say so; every capture waits for the move.
- Moving the date is one edit in `legacy.ts` plus the files
  `tests/derived.js` names (proven by a run with the constant changed: the
  check fails naming each file).
- Every new component test ends with `expectNoA11yViolations`; coverage
  per file holds.
- Specs and `llms.txt` match; `docs/DECISIONS.md` index rebuilt.
- Inherited, `docs/specs/DEBT.md` D24 (owner, 2026-09-26): the automatic
  move also moves a readable `dhloot.lists.v2.bad` backup into the account,
  or names the backup in the move notice (a `legacyMove.test.ts` case with
  a seeded `.bad` key). The entry stays in `DEBT.md` with R5's part marked
  paid; R10 deletes it.
- Inherited, still to place: R2's closeout left `DEBT.md` D54 under R5
  (a `#/l/` link over 100 items saves an empty account list).
  **[refresh after B2.3]**: read it and `issues/persist-2-lists/reviews.md`
  D1-D5 (in R2's commit history) for a defect routed to R5 and add each as
  its own line.

Verification commands: step 20; the handoff records each output's counts
and the golden diff (re-seeded, new).

Risks / do-nots: never delete `dhloot.lists.v1` or `dhloot.lists.v2`; never
move for an account that is not `migrated.owner`; never draw the notice
or the status while the session is unknown (no flash); never write `#/l/`
after the date; do not touch the share panel beyond the date text; do not
reopen the limit exemption; do not change `mergeLists` or the pre-date
writers; do not add a button that starts the move.

Fallback: none needed; the reviewer's split (section 7) if the pass is
too wide.

## 9b. Batch `B5.3` - the account menu, display settings, the Lists tab (implement-ready)

Release R5b `persist-5b-account-menu` (owner, 2026-09-26), dispatched
after R5's push; the section 13 refresh moves this brief into R5b's own
task directory.

Objective: section 4.9 - the header's account control becomes a menu with
«Настройки отображения», «Мои списки» and «Выйти»; `#/account` gains the
Display section; the Lists tab leaves the bar after the date.

In scope: `Shell.svelte`, the new `AccountMenu.svelte`, `TabBar.svelte`,
`AccountPage.svelte`, `AppState.signOut`/`setHome`, texts, specs, tests,
goldens, F2. Out of scope: «Мои предметы» (R7), any route change, any
change to the move (`B5.2`).

Files: `app/src/components/AccountMenu.svelte` (new), `accountMenu.test.ts`
(new), `Shell.svelte`, `shell.test.ts`, `TabBar.svelte`, `AccountPage.svelte`,
`accountPage.test.ts`, `a11y.test.ts`, `state/app.svelte.ts`, `app.test.ts`,
`lib/dict.ts`, `tests/app/inventory.js`, `states.js`, `tests/e2e/flows.mjs`,
`docs/specs/FEATURES.md` ("Account", "Chrome"), `ROUTES.md` ("Sections"),
`STATE.md` ("Account preferences"), `COVERAGE.md`.

Steps:

1. `dict.ts`, both languages: `menuLabel` («Меню аккаунта» / "Account
   menu"), `menuDisplay` («Настройки отображения» / "Display settings"),
   `menuLists` («Мои списки» / "My lists"), `displayHead` («Отображение» /
   "Display"), `displayLang` («Язык» / "Language"), `displayHome` («Раздел
   при запуске» / "Section on start"), `displayTables` («Таблицы» /
   "Tables"), `displayPrint` («Печать» / "Print"), `printColour` («Цветная»
   / "Colour"), `printCompactBox` («Компактный лист» / "Compact sheet"),
   `displayNotify` («Сообщать владельцу списка» / "Notify the list
   owner"), `notifyAsk` («спрашивать» / "ask"), `notifyAlways` («всегда» /
   "always"), `notifyNever` («никогда» / "never"); `signOut`, `viewList`,
   `viewGrid` and the black-and-white label reused.
2. `state/app.svelte.ts`: `signOut(scope: 'local' | 'global'): Promise<AuthResult>`
   (moved from `AccountPage.svelte`, which now calls it inside its `busy`
   wrapper; the toasts stay on the page and the menu shows the same
   `signedOut`/`accountFailed` toast); `setHome(hash)` (a hash `pinOf`
   accepts; the default removes the key; `#changed()`); `notifyGm` getter
   and `setNotifyGm(v)` over a new `#notifyGm` field seeded `ask`, applied
   by `#applyPrefs` and saved by `#saveAccount` (`lib/prefs.ts`: `Prefs.notifyGm`,
   `readPrefs` accepts the three values only; it is an account-only
   setting, so no local key - signed out the row is not drawn);
   `menuOpen = $state(false)` closed by `go()` and the router's change
   handler. `app.test.ts` and `prefs.test.ts`: all of it.
3. `AccountMenu.svelte` (props `app`, `onclose`): `role="menu"`, three
   `role="menuitem"` entries as 4.9, Up/Down/Home/End between them, Escape
   and an outside click close and return focus to the control, a choice
   closes. Box: `AddToList`'s `.dropmenu` values, right-aligned under the
   control, `min-width` 220px. `accountMenu.test.ts`: the items and their
   targets, «Выйти» calls `app.signOut('local')`, keyboard and outside
   close, axe open.
4. `Shell.svelte`: signed in, the control is a `<button>` (4.9) toggling
   `app.menuOpen`; the menu mounts under it; `TabBar` takes `tabs` (the
   ten less `lists` when `!app.legacyWritable`). `shell.test.ts`: the
   button's name, `aria-haspopup`/`aria-expanded`, the menu opens and
   closes, the signed-out link unchanged, nine tabs after the date (fake
   clock), `aria-current` on `#/account`.
5. `TabBar.svelte`: `tabs` prop (default the ten), the `sep` rule unchanged.
6. `AccountPage.svelte`: the Display section first when signed in (4.9),
   each control bound to the `AppState` getters and writing through the
   setters; the `<select>` labelled «Раздел при запуске»; the notify `Seg`
   of three last. `accountPage.test.ts`: every control reads the current
   value and writes it (the fake storage keys and the fake prefs row
   change; `notifyGm` reaches the row and nothing local), the pinned table
   case, the section absent signed out, axe. R4's `B4.2` (its planner
   refresh) reads `app.notifyGm` and drops its own "remembered nowhere
   else" line.
7. `inventory.js`: new states `#/roll/std ~ account menu as gm1` (`enter`:
   press the control; the three items) and `#/account ~ display as gm2`
   (the section with `gm2`'s values); the existing `as gm1`/`as gm2`
   states re-seed for the control; `states.js` case 45: the menu opens,
   Escape returns focus to the control, «Мои списки» lands on `#/lists`,
   «Выйти» from `#/lists/<uuid(101)>` lands on `#/lists` signed out with the
   toast; F2 reads `header button[aria-haspopup="menu"]`'s `aria-label`
   («Аккаунт: <email>»).
8. Specs: `FEATURES.md` "Account" (the Display section, "There is no
   settings page" replaced), "Chrome" (the control and the menu; the nine
   tabs after the date); `ROUTES.md` "Sections"; `STATE.md` ("Account
   preferences": the section is a second writer of the same keys);
   `COVERAGE.md` rows.
9. Gates: `rtk npm run check`; `build:test`; `rtk node tests/run-all.js
   app/states`; goldens per shard `--update`; `sweep` at 360; `check:built`;
   `npm run e2e`.

Acceptance:

- Signed in, the control opens a menu with exactly «Настройки отображения»,
  «Мои списки», «Выйти» in that order; keyboard and pointer close it as
  4.9; «Выйти» signs out with the toast and, from an account list's page,
  lands on `#/lists` (case 45, `accountMenu.test.ts`, `shell.test.ts`).
- Signed out the control is today's «Войти» link (goldens unchanged for
  signed-out states but the tab count after the date).
- `#/account` shows the Display section first with the six controls, each
  reading and writing the account-synced setting; the pin's rule holds;
  `notifyGm` is in the account row only, `ask` by default
  (`accountPage.test.ts`, `prefs.test.ts`, golden `~ display as gm2`).
- After the date the tab bar has nine tabs and `#/lists` still opens
  (case 44's tab check in `B5.2` is repeated here, `shell.test.ts`).
- F2 green against the button; every `as` golden re-seeded once; axe on
  the open menu and the Display section.

Risks / do-nots: no new route; no provider buttons in the menu; do not
move sign-in into the menu; keep `AccountPage`'s `busy` semantics; the
menu never draws while the session is unknown.

## 10. Closeout

1. `/handoff` audit; this directory deleted in the task's commit; one push
   of `main`.
2. CI: `e2e` (`migrate-test` applies nothing if step 8.6 ran, else the
   migration), `migrate-prod`, `deploy`; the run ids in the handoff before
   the directory goes (the roadmap's R5 closeout record keeps them).
3. The owner (section 14's steps): the Data API check and the Security
   Advisor rerun (roadmap section 15, step 6) - expect one more SECURITY
   DEFINER warning, `move_legacy_list`, by design; then the device check
   (question f, settled 2026-09-25): sign in on a desktop browser and on a
   phone that hold real browser lists, watch the lists move and the notice
   name them, confirm them in «Ваш аккаунт» on the other device and the
   browser group empty; report. A defect moves the date (section 14).
4. The roadmap: R5's closeout record, section 9's row, sections 12 and 14
   compacted to "shipped"; R5b's task directory
   `issues/persist-5b-account-menu/` (copied from section 9b by the section
   13 refresh) stays until R5b ships.

## 11. Decisions written by this pass (`docs/decisions/`)

- "A browser list moves through one RPC that hashes its canonical text"
  (the server-side fingerprint, the atomic idempotent RPC, the limit
  exemption, the automatic move with its two guards; rejected: a client
  digest, the two-upsert path, refusing over-limit lists, a button).
- "The test build's clock is pinned before the cutoff, and `?today=` moves
  it" (amends "The browser suites drive a test build with a deterministic
  fake cloud"; rejected: the real clock, a second build).
- "After the cutoff a browser list is written only by the move and a
  delete" (rejected: deleting the merge in R5, a merge-based removal, no
  delete; the code deletion is R10's).
- "The account control opens a menu; display settings live on
  `#/account`" (the Lists tab leaves at the cutoff; R4's `notifyGm` choice
  lives there; supersedes the roadmap's "not in v1: a preferences page";
  rejected: a `#/account/display` route, a settings page for signed-out
  readers, keeping the tab).

Rebuilt with `node tools/decisions.js`; `node tests/derived.js` green.

## 12. Owner question - answered 2026-09-26

Answer (owner, 2026-09-26): as recommended - `B5.3` ships as release R5b
`persist-5b-account-menu`, right after R5 and live before the 2026-10-26
cutoff; R5 keeps `B5.1` and `B5.2`. The question as asked:

1. **Where the account menu ships.** Recommended: its own release **R5b**
   `persist-5b-account-menu`, dispatched right after R5's push and live by
   2026-10-19 (section 14) - `B5.3` as written in section 9b, with its own
   task directory, commit and push. Reason: R5's 2026-10-12 date is the
   hard constraint and `B5.1`+`B5.2` reach it with six days to spare;
   `B5.3` is 40 more gate minutes plus a review and a re-seed of every
   signed-in golden, and its only date is the cutoff (the tab leaves on
   2026-10-26, so the menu's «Мои списки» must be live before then).
   Trade-off accepted: one more push, deploy and closeout. Alternative:
   `B5.3` inside R5 as its terminal batch - R5 then lands about 2026-10-09
   with two days of buffer, and a stalled host or a second review cycle
   moves the date.

Settled without asking (low impact; reopen only with a new fact): the
notice is app-wide under the header, dismissable, kept until dismissed
(guard (a) has to be seen wherever sign-in returned to); the quiet status
has no button; `migrated.owner` is written before the first RPC (the first
account is the first whose app loaded with browser lists); a refused list
is retried each load; the Display section lives on `#/account` (no route);
the start-section control is a `<select>` over the ten sections; the box
of the status is the storage notice's; the retired page has one button;
the unconfigured build keeps local creation and has no gate, move or
menu; the tombstone key is the local id; the RPC takes `p_id` from the
client; the date is UTC midnight; the gate is read once per page load;
after the date a signed-out reader reaches browser lists only through
`#/lists`.

## 13. Refresh after B2.3 closes

Before `B5.1` is dispatched, one short planner pass over R2's final tree:

- the newest migration stamp (8.1);
- `ListPage.svelte`'s actions row and the share panel (9.10), `AddToList.svelte`
  (9.11), `SharedListPage.svelte` and its announcement text (9.12, 9.14),
  `app.svelte.ts` pending actions (a `saveCopy` action for `#/s/`: not
  gated, it is an account read; it must not race the move - `#runPending`
  waits for `ready` as today);
- `llms.txt` and `CONTRACTS.md` section 3 as B2.3 left them (9.14, 9.15);
- `issues/persist-2-lists/reviews.md` D1-D5 and the closeout's DEBT entries
  for anything routed to R5 (acceptance, section 9);
- `tests/app/inventory.js` state count and `states.js` case count after
  B2.3 (9.16, 9.17 renumber);
- the shard timings of the run that deployed R2 (roadmap section 8, the
  shard trigger);
- section 12 is answered (R5b): copy section 9b into
  `issues/persist-5b-account-menu/plan.md` with its own handoff and
  context, then replace section 9b here with a pointer.

## 14. Schedule and what the owner does when

Calendar (today Sat 2026-09-26; the gate figures of section 7):

| When | What | Who |
|---|---|---|
| 09-26 to 09-28 | `B2.3`, its review, R2's closeout and push; R2 live | orchestrator, owner (R2's closeout steps) |
| 09-28 | the refresh of section 13 | planner |
| 09-29 | `B5.1` and its review | implementer, reviewer |
| 09-30 to 10-02 | `B5.2` (two sessions), review, fix pass | implementer, reviewer |
| 10-03 to 10-05 | R5 closeout, push, CI green, deploy | orchestrator |
| 10-05 to 10-06 | the device check (section 10, step 3) | owner |
| 10-06 to 10-08 | R5b: `B5.3` (one to two sessions), review | implementer, reviewer |
| 10-09 to 10-10 | R5b closeout, push, deploy; live by 10-19 at the latest | orchestrator |
| 10-12 (Mon) | checkpoint: R5 live and the device check clean, or the date moves | owner |
| 10-26 (Mon) | the cutoff; roadmap section 15 step 19, then R10 is dispatched | owner |

The owner chose R5b (section 12), so the alternative schedule with `B5.3`
inside R5 is void.

What the plan needs from the owner:

- The answer of section 12: given 2026-09-26 (R5b).
- **At R5's closeout**: the Security Advisor and Data API look; the device
  check on a desktop browser and a phone with real browser lists; a report
  of what the notice named and what «Ваш аккаунт» then held.
- **If the date moves** (a defect, or 10-12 passes without R5 live): the
  owner names the new Monday; the change is `LEGACY_WRITE_UNTIL` in
  `app/src/lib/legacy.ts` plus the literal in the files `tests/derived.js`
  names (`llms.txt`, the five specs, `help.ts`) and B2.3's announcement
  text if it kept a literal; one commit, one deploy.

## 15. Risks, assumptions, deferred

- Risk: a reader on a shared browser signs in first and takes the other
  person's browser lists into their account. Accepted by the owner
  (2026-09-26) with the two guards: the notice names what moved, and the
  browser then moves lists for that account only; a moved list is deleted
  from the account in one press.
- Risk: `Intl.DateTimeFormat` for `ru` long dates may differ between Node's
  ICU and Chrome's («26 октября 2026 г.»): the goldens and the unit test
  assert the common form; if a runtime differs, pin per runtime in the test,
  as R2 did for `agoText`.
- Risk: B2.3's diff to `ListPage.svelte` and `SharedListPage.svelte` is
  unknown at planning; steps 9.10-9.12 and 9.14 are refreshed (section 13),
  not implemented from this text.
- Risk: the partial unique index inference `on conflict (owner_id,
  legacy_fingerprint) where legacy_fingerprint is not null` must match the
  index predicate exactly; the layer 3 idempotence case proves it before
  any client depends on it.
- Risk: a golden captured before the automatic move settles; `moveSettled()`
  is the guard, and a state that forgets it shows the browser group still
  drawn - visible in the diff, not silent.
- Risk: the 2026-10-12 checkpoint - R2's closeout is the tail this plan
  does not control; the buffer is six days with R5b separate (the owner's
  choice).
- Assumption: `move_legacy_list` through PostgREST returns `[{ id,
  inserted }]` for a `returns table` function; `supabase.test.ts` stubs
  that shape and case H proves it live.
- Assumption: the `visibilitychange` reload (`ListStore.watch`) lets a
  backgrounded tab drop moved lists before it can write; the tombstones
  cover the remaining race.
- Deferred to R10 (`persist-10-legacy-removal`): the codec, its fixtures,
  `tests/contracts.js`'s encoding half, `findListByPayload`, `mergeLists`,
  the pre-date writers of `ListStore`, `syncListUrl`/`#claimList`, the
  browser group and `StorageNotice`, the pinned test clock and `?today=`
  (the states that need it go with the codec), the `tab` of `#/lists` in
  `routes.json` set to `null`; `MoveNotice`, `MoveStatus` and `LegacyMove`
  stay (the move works past R10 for a reader who never signed in).
- Deferred to R7: «Мои предметы» in the account menu.
- Deferred idea, not planned: a per-list move; a "not now".
