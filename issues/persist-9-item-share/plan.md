# Plan - TASK persist-9-item-share (homebrew release R9)

## Status

- Task status: planned 2026-10-02 (planner, planning mode A); not started.
  Dispatch order (owner, 2026-10-02): R7d, R7h, R9, R8, `debt-cleanup`,
  `persist-review`, R10. Refresh before dispatch: R7d's `B7d.2` and R7h's
  `B7h.1` change `HomebrewPage.svelte`, `HomebrewEditor.svelte` (the «?»
  removals), `ImportPanel.svelte` and the goldens; check the file lists and
  the golden lists of section 7 against the tree after R7h's closeout. The
  design does not depend on them.
- NEEDS_HUMAN_CONFIRMATION: no - the owner answered Q9-1 to Q9-5 on
  2026-10-02 (section 9); the batches follow the answers.
- Plan review: required before B9.1 (trigger: a migration with three
  SECURITY DEFINER functions, one of them executable by `anon`; a public
  contract change in B9.2; a new write protocol for share links of items;
  the reversal drops stored share rows)
- Batches:

| Release | Task id | Batch | Status |
|---|---|---|---|
| R9 | `persist-9-item-share` | `B9.1` the migration (`homebrew_shares`, three functions, the touch and broadcast triggers), the port, the fake, contract case P, layer 3 cases | implement-ready after the plan review (7.3) |
| R9 | | `B9.2` every screen: the share panel on `#/i/<key>` and in the editor, `#/h/<token>`, «Сохранить себе», the print routes, D70, D71, D65, the route contract | outline (7.4) |

## 1. Objective and non-goals

Objective: an author shares one own homebrew item by a link, as a list is
shared today; anybody with the link sees the item as it is now; a signed-in
reader adds it to a list (a frozen copy) or saves a copy to their own items
(«Сохранить себе»); a homebrew card of another account prints from a pasted
or reloaded address. Roadmap rows: `issues/persistent-storage/plan.md`
section 5 (R9), section 12 and 14 (`B9.1`).

Non-goals: pictures (R8, which then draws them on every R9 surface); a link
to a source or a book (decision "Homebrew keeps the way open to shared books
without building them"); a GM/player split for an item link (an item has no
GM note); purchase requests from an item link (requests belong to a list);
a link preview with the item's name (the fragment never reaches a crawler,
`META.md` section 2); an index of the author's shared items; `#/print/list/<id>`
(Q9-2).

## 2. What the tree holds today (2026-10-02, `d82e3e1f` plus R7d's working tree)

- A list's share links: `list_shares` (raw 43-character token, `topic_key`,
  `revoked_at`, one active row per audience), `create_list_share`,
  `revoke_list_share`, `get_shared_list` (definer, `anon`), the deferred
  `lists_broadcast` and `list_shares_gone` triggers, and a `realtime.messages`
  policy that lets `anon` and `authenticated` receive any `share:<uuid>`
  topic. An item link reuses that topic shape, so it needs no new policy.
- `homebrew_items`, `homebrew_books` and `homebrew_cards` carry `revision`;
  the touch triggers bump the revision of each owner list that holds a
  reference, and `homebrew_broadcast` nudges `owner:<uid>`.
  `homebrew_snapshot_of(key, content, book, cards)` writes the record that a
  frozen copy and a list projection carry.
- `import_homebrew(p_books, p_cards, p_items, p_update)` (R7d, security
  invoker) writes items and cards with client-made ids and keys in one
  transaction, skips a held key and checks every limit. The copy uses it.
- The write buffer adds a frozen copy for a homebrew key the account does not
  hold when the page holds a valid copy (`entrySource` in
  `lib/cloudLists.ts`, `AppState.frozenCopy`): the add from an item link
  needs only the projection in `frozenCopy`.
- `SharePanel.svelte` draws two link rows inline; the item panel is the second
  use of the row, so the row is extracted (`CLAUDE.md`, "Extract shared UI on
  its second real use").
- `SharedView` (`state/sharedView.svelte.ts`) with `LiveFeed` is the pattern
  for the item page's state: open, owner check, refresh with the revision,
  messages coalesced, the 45 s poll and the 5-minute safety read.
- `#/print/<ids>` resolves ids at parse time (`parseHash(hash, knows)`), so a
  frozen copy that only `#/s/` held is dropped after a reload (D70).
- `SharedListPage.svelte` keeps its status region inside the drawn-list
  branch, so a live revoke is not announced (D65).
- The privacy pages already say an item link works (D71).
- Bundle after R7g: 242.8 of 247 kB configured, ceiling 300 (R7d plan 7).

## 3. Design

### 3.1 Schema (migration `<ts>_homebrew_shares.sql`, `<ts>` after `20261002130000`)

| Object | Shape |
|---|---|
| `public.homebrew_shares` | `id uuid pk default gen_random_uuid()`, `item_id uuid not null references homebrew_items (id) on delete cascade`, `token text not null unique` with `list_shares`'s default and check (`^[A-Za-z0-9_-]{43}$`), `topic_key uuid not null default gen_random_uuid()`, `revision bigint not null default 1`, `created_at timestamptz not null default now()`, `revoked_at timestamptz` |
| index | `homebrew_shares_active` unique on `(item_id) where revoked_at is null` (one active link per item) |
| grants and RLS | RLS on; `revoke all ... from public, anon, authenticated`; `grant select to authenticated`; `grant select, delete to service_role` (the E2E cleanup); policy `homebrew_shares_select` for `authenticated` using `exists (select 1 from homebrew_items i where i.id = item_id and i.owner_id = (select auth.uid()))`. No insert, update or delete grant: a share changes only through the functions |
| `create_homebrew_share(p_item uuid) returns table (id uuid, token text)` | security definer, `set search_path = public, pg_temp`. Locks the item row `for no key update` where `owner_id = auth.uid()`, else `42501`. Returns the active row, or inserts one. `execute` to `authenticated` only |
| `revoke_homebrew_share(p_share uuid) returns void` | definer; `42501` unless the share's item is the caller's; sets `revoked_at = now()` where it is null. `authenticated` only |
| `get_shared_homebrew(p_token text) returns jsonb` | definer, `stable`. Null for a null, malformed, unknown or stopped token (one answer for all four). Else `{ revision, updated_at, topic_key, item }`: `item` is `homebrew_snapshot_of(i.key, i.content, <book content with key or null>, <the owner's cards the item names>)`, the same call as `get_shared_list`'s reference branch; `updated_at` is the greatest of the item's, its source's and the named cards' `updated_at`; `revision` is the share's. `execute` to `anon` and `authenticated` |
| touch | `create or replace` of `homebrew_items_touch`, `homebrew_books_touch` and `homebrew_cards_touch`: each keeps its list update and adds `update homebrew_shares set revision = revision + 1 where revoked_at is null and item_id in (<the affected items>)` - the item itself; the items of the source; the owner's items whose `set` or `refs` names the card |
| `homebrew_shares_broadcast()` | deferred constraint trigger `after update on homebrew_shares`, once per share per transaction (a transaction-local mark, as `lists_broadcast`): reads the row again; skips a stopped or deleted row; sends `{ revision }`, event `revision`, private, to `share:<topic_key>`. A failed send raises a warning, never fails the write |
| `homebrew_shares_gone()` | `after update of revoked_at or delete on homebrew_shares`: a share that was active sends `{ revision: null }` once (as `list_shares_gone`); an item delete cascades here, so the page goes within about a second |

Reversal `supabase/reversals/<ts>_homebrew_shares.sql`: drop the triggers, the
three functions and the table; restore the three touch bodies exactly as
`20260930130000_homebrew.sql` (items, books) and
`20261001130000_homebrew_relations.sql` (cards) wrote them. A revert loses
every item link: the links stop opening (section 5).

`META.md` section 3: `anon` executes four functions (adds
`get_shared_homebrew(text)`); `tests/db/harness.test.mjs` pins the list.

Relations in the projection follow the frozen copy's rule (decision "A frozen
copy embeds its source and cards; a reference must exist when written"):
relation keys stay keys; a catalog relation draws, a relation to the author's
other items draws nothing for a reader. No new projection field.

### 3.2 Port, fake, contract case P

`app/src/ports/types.ts`:

```ts
export interface ItemShareRow { id: string; item_id: string; token: string; created_at: string; revoked_at: string | null }
export interface ItemSharedRow { revision: number; updated_at: string; topic_key: string; item: HomebrewRecord }
export type ItemSharesRead = { ok: true; shares: ItemShareRow[] } | { ok: false };
export type ItemSharedRead = { ok: true; shared: ItemSharedRow | null } | { ok: false };
export interface ItemShareRepository {
  list(itemId: string): Promise<ItemSharesRead>;      // stopped rows too
  create(itemId: string): Promise<ShareMade>;         // create_homebrew_share
  revoke(shareId: string): Promise<ListWrite>;        // revoke_homebrew_share
  read(token: string): Promise<ItemSharedRead>;       // get_shared_homebrew, signed out too
  ownerOf(token: string): Promise<string | null>;     // the reader's own item id, else null
}
```

`CloudPort` gains `itemShares`. The real adapter validates `item` with
`snapshotValid` and its `id` against nothing else; an answer it cannot read is
`{ ok: false }`. The fake keeps shares per item in memory, bumps a share's
revision on its own item, source and card writes, emits `revision` on the
share topic through its events hook and `null` on a revoke or an item
delete. Seed: gm1's axe has the active link `item-token-1` (topic
`uuid(532)`); gm1's «Whispering Cap» has a stopped link `item-token-2`.

Contract case P (`cloud.contract.ts`, run over the fake by vitest and over the
real adapter by `tests/e2e/contract.mjs`): as the member, make an item, make
its link, read it signed out (the record's `id` is the key, `src` is
`homebrew`), a second `create` answers the same token, `ownerOf` answers the
item id as the member and null signed out, `revoke`, read null, `create`
again answers a new token, delete the item, read null.

### 3.3 Routes (B9.2, a public contract change)

| Hash | Meaning |
|---|---|
| `#/h/<token>` | one own homebrew item shared by its author, read-only for everyone; the token is the leading run of `[A-Za-z0-9_-]` (a stray character is dropped, the address kept); a stopped, deleted, unknown or empty token, and every token in a build with no sign-in, draws one "no longer available" page, never home |
| `#/print/s/<token>/<id>[*<n>]-...` | the print sheet of a selection of a shared list, read through the link (the list's frozen copies and references print after a reload) |
| `#/print/h/<token>` | the print sheet of one shared item |

`parseHash` gains `{ kind: 'itemShare'; token }`, `{ kind: 'printShare';
token; segment }` and `{ kind: 'printItem'; token }`; `printShare` keeps the
raw segment, and the page reads it with `readPrint` once the link is read
(the ids are known only then). `#/print/<ids>` is unchanged. Builders:
`itemShareHash`, `printShareHash(token, ids, qty)`, `printItemHash`.
Fixtures in `docs/fixtures/urls/routes.json` (the three kinds, a stray
character, an empty token), `tests/contracts.js`, `CONTRACTS.md` section 1,
`ROUTES.md` "Records, lists and print", `llms.txt` (an item link is made only
by its author; an agent cannot build one).

### 3.4 The share panel (m30, m31)

- Where: «Поделиться» is a toggle in the card's pick row of an own item, on
  `#/i/<key>` after «Изменить», and in the editor's preview card after
  «Добавить в список» (a saved item only; a new item has no pick row).
  Pressed and `aria-expanded` while open (the list page's «Поделиться»). The
  panel opens under the card (`RecordPage.svelte`; in the editor, under the
  preview card inside the preview column). Q9-4.
- Behaviour: the list panel's rules with one row, «Ссылка на предмет»: on
  open the panel reads the item's links (stopped ones too) and makes a link
  only when the item never had one; an active row shows `#/h/<token>`,
  «Скопировать» (copies `<site>#/h/<token>`, or `<site>en/#/h/<token>` in
  English; toast «Ссылка на предмет скопирована») and «Удалить ссылку» (stops
  it at once, asks nothing, toast «Ссылка удалена: по ней предмет больше не
  откроется.»); a stopped row says «Ссылка удалена» and offers «Создать
  ссылку» alone (toast «Ссылка создана.»). The hint under the row says what a
  reader sees and can do (strings 3.10). «Загружаем...», the failed read
  «Не получилось загрузить ссылки.» with «Повторить», a failed change toasts
  `shareFailed` and reloads the panel on a refusal; a row's buttons are
  disabled while its change runs. The editor's panel shares the stored row;
  the leave guard does not count it.
- Code: `ShareRow.svelte` (new, extracted from `SharePanel.svelte`: label,
  link or «Ссылка удалена», the buttons, busy) used by `SharePanel.svelte` (two
  rows) and `ItemSharePanel.svelte` (new, one row, `itemShares`); the inline
  row markup leaves `SharePanel.svelte`.

### 3.5 The item page `#/h/<token>` (m32-m34)

- Shape: the record page's: heading = the item's name; the sub line
  «Предмет от другого игрока · <path>» (path = `whereFrom` plus the tier, as
  `#/i/` writes it); «Обновлено N назад» under it (`agoText`, the 45 s
  clock); the full `RecordCard` over `withRecords(base, [], [item])`; the
  window title `<name> — <docTitle>`. The card's name actions copy and send
  the `#/h/` address (`RecordActions` gains an optional `link`); on own
  `#/i/<key>` they keep carrying none.
- Pick row (`PickRow.svelte`): «Добавить в список», «Печать» (to
  `#/print/h/<token>`), «Сохранить себе» with its one-line note (3.6). The
  owner (the reader's own link, `ownerOf`): «Это ваш предмет.» with
  «Открыть для правки» (`#/homebrew/<key>`) above the heading, as `#/s/`
  draws «Это ваш список.»; the card is the owner's live record (an own key
  wins in `withRecords`); no «Сохранить себе».
- Signed out: «Добавить в список» opens today's menu with the sign-in prompt
  in its new-list slot; «Сохранить себе» opens the prompt «Войдите, чтобы
  сохранить предмет себе: ...» under the row; after the sign-in the page comes
  back and the copy is made by itself (`dhloot.auth.return` action
  `{ do: 'saveItem', key }`, as `saveList`).
- States: «Загружаем...» (`LoadState`) while the first read runs - a named
  difference from `#/s/`, which draws nothing (rule 6); gone: «Предмет больше
  не доступен» / «Владелец удалил эту ссылку или предмет.» and «На главную»,
  the address kept; failed: «Предмет не загрузился» / «Проверьте соединение
  и нажмите «Повторить».» and «Повторить»; a build with no sign-in: gone.
- Live: `ItemShareView` (new, `state/itemShareView.svelte.ts`, the
  `SharedView` pattern without audience, notes or `p_since`) joins
  `share:<topic_key>`, re-reads on a message newer than the shown revision
  (coalesced), on a `null` message, when the tab is shown again, every 45 s
  while the topic is down and every 5 minutes while it is joined. A
  permanently mounted, visually hidden status region says «Предмет обновлён»
  once per change of what the page draws and «Предмет больше не доступен»
  when the link goes while the page is open.
- `AppState.itemShare` holds the view; `frozenCopy(key)` reads the open item
  projection first, then the open list share, then the account's lists.

### 3.6 Add to list and «Сохранить себе» (Q9-1, Q9-3)

- Add: the existing menu and write buffer. A signed-in reader who does not
  own the item adds a frozen copy (the projection is the copy, `entrySource`);
  the owner adds a reference. No new RPC, no request flow.
- «Сохранить себе» / "Save to my items" (owner's Q9-1 A, the shared list's
  «Сохранить себе» / "Save to my lists" wording): drawn in the pick
  row of every record of another account's item for a signed-in reader - on
  `#/h/`, in a `#/s/` row's card, and in a frozen row's card on the reader's
  own account list - and on `#/h/` signed out (the prompt). Never on an own
  item, a catalog record, or a browser list.
- The copy (owner's Q9-3 A), a pure `copyRows(record, newId, newKey)` in
  `lib/homebrew.ts` returning `HomebrewImportRows` (`import type`): one item
  in «Хоумбрю» (no source, no section) with the record's kind, names,
  descriptions, `tier`, `eq` and `alt`; `craft`, `craft_from` and `eq.line`
  keep catalog ids and drop `hb_` keys; `set` and `refs` keep catalog keys;
  each own set or rule card the snapshot embeds becomes a new own card in
  «Хоумбрю» under a new key, and the item names the new key; an `hb_` key the
  snapshot does not embed is dropped. One `import_homebrew` call with
  `update: false` writes all or nothing; the ids and keys are made once per
  press, so a retry after a lost answer writes nothing twice (a held key is
  skipped).
- On the reader's own account list the press then replaces the frozen row
  with a reference to the new key: after the homebrew store has read the new
  item, one buffer flush sends `remove_entries` for the old entry and `add`
  for a new entry at the same position with the same quantity, price and
  both notes. Elsewhere the press only saves the copy.
- Toasts (rule 5, worded as a saved copy as «Сохранить себе» on `#/s/` is; a
  named departure like R7e's): «Предмет «%s» сохранён в «Мои предметы»» with
  «Изменить» (a new tab), or «Предмет «%s» сохранён в «Мои предметы» и заменил
  копию в списке» with «Изменить». The button then reads «Сохранено», disabled
  until the page is left (memory: `AppState.savedItems`, a set of source keys,
  cleared on a navigation). Refusals: the item or card limit (their texts), a
  lost network «Не получилось сохранить предмет себе. Проверьте соединение и
  попробуйте ещё раз.» (the sibling of `cloneFailed`), a refusal `importRefused`'s text, items still loading
  (`hbNotReady`); each keeps the
  page as it was.

### 3.7 The print routes and D70 (Q9-2, m36)

- `SelBar.svelte` writes `printShareHash(app.requestToken, ids, taken)` when
  the page is `#/s/` and a ticked id is an `hb_` key; any other selection
  keeps `printHash` (a catalog-only print address never stops working).
- `#/h/`'s «Печать» writes `printItemHash(token)`.
- `PrintPage.svelte` with `printShare` opens `app.sharedView` for the token and
  with `printItem` opens `app.itemShare`, closes it when left, and resolves
  ids through `app.recordFor` (which reads both views). While the link reads,
  and while a signed-in reader's own items read for an address that names an
  `hb_` key, it draws the heading and «Загружаем...» (today it draws «nothing
  to print» for a moment; a cheap fix in the touched path). A link that opens
  nothing draws the gone page of `#/s/` or `#/h/`. «Ссылка на печать» copies
  the address on screen.
- `DEBT.md` D70 is deleted in B9.2.

### 3.8 D65 on `#/s/` (Q9-5)

`SharedListPage.svelte` keeps the status region mounted outside the branches
(as the item page), so a live revoke says «Список больше не доступен» once.
`DEBT.md` D65 and its section are deleted in B9.2.

### 3.9 Privacy pages and D71

`pages/src/privacy.html` and `pages/src/en/privacy.html`, "Share links" and
"Deleting your data" (`D71` deleted; "Last changed" moves to the release
day). EN (RU is its translation with the same facts):

- Share links, replacing the sentence "A share link to a homebrew item works
  the same way.": "A share link to a homebrew item shows that item as it is
  now, with its source, section, set card and rule cards, until you delete
  the link or the item. Anybody signed in who holds a link can add a copy of
  your item to their own list, or save a copy of it to their own items,
  which they can then change."
- Deleting your data: "whether they saved a list from a share link, added an
  item from one, or saved an item to their items from one".
- RU: «Ссылка на собственный предмет показывает его таким, какой он сейчас, с
  источником, разделом, комплектом и картами правил, пока вы не удалите
  ссылку или предмет. Любой, у кого есть ссылка и кто вошёл в аккаунт, может
  добавить копию вашего предмета в свой список или сохранить копию себе
  в «Мои предметы» и потом менять её.» and «сохранили себе список по ссылке, добавили
  из неё предмет или сохранили предмет себе».

### 3.10 Strings (RU / EN)

Reused as they are: `share` («Поделиться»), `shareCopy`, `shareDelete`,
`shareCreate`, `shareStopped`, `shareCreated`, `shareFailed`,
`shareLoadFailed`, `sharedFailedSub`, `shareGone`, `shareGoneSub`,
`ownListEdit` (as the value of `ownItemEdit` below, kept as its own key for
the separate meaning), `toStart`, `retry`, `print`, `edit`,
`limitHbItems`, `limitHbCards`, `hbNotReady` («Ваши предметы ещё
загружаются - повторите через секунду.»), `importRefused`, and the
add-to-list menu's sign-in keys. The implementer confirms each name in
`lib/dict.ts`; a name that differs there wins. New:

| Key | RU | EN |
|---|---|---|
| `itemShareLink` | Ссылка на предмет | Item link |
| `itemShareCopied` | Ссылка на предмет скопирована | Item link copied |
| `itemShareDeleted` | Ссылка удалена: по ней предмет больше не откроется. | Link deleted: the item no longer opens from it. |
| `itemShareHint` | Кто откроет ссылку, увидит предмет таким, какой он сейчас, с источником и картами, и сможет добавить копию в свой список или сохранить предмет себе - эти копии потом не меняются. «Удалить ссылку» закрывает доступ сразу. | Whoever opens the link sees the item as it is now, with its source and cards, and can add a copy to their list or save the item to their items; those copies do not change later. "Delete link" closes access at once. |
| `sharedItem` | Предмет от другого игрока | An item from another player |
| `ownItem` | Это ваш предмет. | This is your item. |
| `ownItemEdit` | Открыть для правки | Open to edit |
| `itemGone` | Предмет больше не доступен | This item is no longer available |
| `itemGoneSub` | Владелец удалил эту ссылку или предмет. | The owner deleted this link or the item. |
| `itemFailed` | Предмет не загрузился | The item did not load |
| `itemUpdated` | Предмет обновлён | The item was updated |
| `saveItem` | Сохранить себе | Save to my items |
| `saveItemNote` | Копия попадёт в «Хоумбрю» - без источника автора и без связей с другими его предметами. | The copy goes to Homebrew, without the author's source and without links to the author's other items. |
| `saveItemNoteList` | Копия попадёт в «Хоумбрю», а эта строка списка станет ссылкой на неё. | The copy goes to Homebrew, and this list row becomes a link to it. |
| `saveItemDone` | Сохранено | Saved |
| `saveItemSaved` | Предмет «%s» сохранён в «Мои предметы» | Item "%s" saved to My items |
| `saveItemReplaced` | Предмет «%s» сохранён в «Мои предметы» и заменил копию в списке | Item "%s" saved to My items; it replaced the copy in the list |
| `saveItemFailed` | Не получилось сохранить предмет себе. Проверьте соединение и попробуйте ещё раз. | Could not save the item to your items. Check the connection and try again. |
| `signInToSaveItem` | Войдите, чтобы сохранить предмет себе: копия появится в «Мои предметы», и её можно будет править. | Sign in to save the item to your items: the copy appears in My items, and you can edit it. |

The saved-copy toast `saveItemSaved` takes the action `edit` («Изменить»), as
`listCreated` follows «Сохранить себе» on `#/s/`. D65's announcement reuses `shareGone`.

## 4. Scale (States table, B9.2)

Limits: one active link per item (a uniqueness rule, no 3x row); own items
100 (3x 300); cards 100 (3x 300); a frozen copy at most 131072 bytes.

| State | Screen | Proof |
|---|---|---|
| no link yet / one active / stopped | panel row: made on open / link and two buttons / «Ссылка удалена» and «Создать ссылку» | unit `itemSharePanel.test.ts`; golden `#/i/hb_emberaxeaaaaaaaa as gm1 ~ share open` |
| shared items: 300 at 3x (one link each) | nothing lists them; each panel reads one item's rows | not applicable (no list of links) |
| stopped rows per item, many | the panel draws the newest state only (active, else stopped) | unit test with 20 stopped rows |
| `#/h/` signed out / as gm2 / as gm1 | m32 / m33 / m33 owner line | goldens `#/h/item-token-1`, `as gm2`, `as gm1` |
| `#/h/` gone / failed / loading | m34 | goldens `#/h/unknown-token`; unit for failed and loading |
| the longest name (120) and description (3000), three rule cards of 1500 | wraps at 360 px (rule 16); the card grows, the pick row follows | `sweep.js 360` on `#/h/item-token-3` (gm3's long bedroll, a new seed share) |
| «Сохранить себе» at the item limit (100, 3x 300) and one past it | the limit toast; nothing written | unit `app.test.ts` (fake at the limit) |
| a copy with three own rule cards and a set card at the card limit | the card limit toast; nothing written (one call) | unit |
| `#/print/s/<token>/<ids>` with 300 ticked entries (3x) | the first 180 cards and the red note (unchanged rule) | `tests/app/print.js` case with the share seed |
| 360 px and 1180 px for each page row above | m30-m36 frames | sweep 360, goldens at 1180 |

Order and primary action at many: the pick row keeps «Добавить в список»
first; the panel sits right under the pick row, so its buttons stay within
one screen of the press at 360 px. The add-to-list menu's height is today's
(R7h measured). No sticky region grows.

## 5. Error scenarios

| Scenario | Screen | Stored data and recovery |
|---|---|---|
| panel read fails / a create on open fails | «Не получилось загрузить ссылки.» and «Повторить» | nothing written, or one share row made; the retry reads again and makes none twice (the active-row index) |
| create or revoke: network | toast `shareFailed`, the row stays | the row read again on the next open; a revoke sent twice is a no-op |
| create or revoke: refused (not the owner, item deleted on another device) | toast `shareFailed`, the panel reloads | the reload shows the stored state |
| `#/h/` first read fails / offline | «Предмет не загрузился» and «Повторить»; read again on the shown-again and 45 s signals | nothing stored |
| a re-read fails while drawn | the page keeps what it shows | none |
| conflict: the author edits while a reader views | the page redraws within about a second, says «Предмет обновлён» | none |
| the link or the item deleted while open | gone page, announced once | none |
| add-to-list: the buffer's existing failures | today's toasts and «Не сохранено» on the list | the frozen copy waits in the buffer, as any add |
| «Сохранить себе»: network, lost answer | `saveItemFailed`; a second press sends the same ids and keys | a lost answer whose rows landed: the retry skips the held key and toasts the saved copy; nothing written twice |
| «Сохранить себе»: limit | the limit text | nothing written (one transaction) |
| the row replacement after a made item: the buffer fails | «Не сохранено» on the list page, today's retry | the new item exists; the frozen row stays until the buffer lands (the add and the remove are one flush) |
| the record named by the row was removed on another device before the replace | the buffer drops the edit for a deleted entry (today's rule), reads the account again | the new item stays in «Хоумбрю» |
| stale tab (previous bundle) | `#/h/` is an unknown address there and falls to the start section; print addresses of the new shape too | nothing stored; a reload loads the new bundle |
| revert: previous frontend over the new schema | no reader of `homebrew_shares`; the touch functions keep working | share rows kept |
| revert: down migration | item links stop opening; the panel is gone with the frontend | share rows dropped (a plan-review trigger; the owner accepts: links are made again) |

## 6. Consistency and RU/EN parity

Departure from rule 4, accepted by the owner (2026-10-02): on `#/s/` the row
card's «Сохранить себе» (an item) and the page's «Сохранить себе» (the list)
share one Russian label; the item button's note line names «Мои предметы».
Rules of `FEATURES.md` "Consistency rules" followed: 2 (the failure texts),
5 (the saved-copy toasts, worded as «Сохранить себе» on `#/s/`: a named departure from the create form, as R7e's), 6 (one
`LoadState` on `#/h/` and the print routes), 7 (not applicable: the item
page heading is the item's name, as `#/s/`), 8 (no create form), 10 (no undo
for a share change, as lists; no confirm, as lists), 11 («Закрыть» not
needed: the toggle folds the panel), 12 (no fold), 13 (no text field), 14,
15 (no form field; the note under «Сохранить себе» is a rule 15(d) line),
16 (long names wrap). Sibling comparison: the panel matches the list panel
word for word but «Ссылка на предмет»; the gone and failed pages match `#/s/`
with «предмет»; the loading state departs from `#/s/` (rule 6 wins; `#/s/`
keeps drawing nothing, a candidate for `persist-review`); «Сохранить себе»
follows «Сохранить себе»'s signed-out prompt and return. RU/EN: every key of
3.10 has both languages with the same facts; no plural is new; ASCII
punctuation; «ёлочки» in RU, straight quotes in EN.

## 7. Batches, gates, cost, review, split criterion

Costs: `context.md`, "Command costs".

| Cut | Criterion |
|---|---|
| R8 \| R9 | the owner's order (R9 first, needs nothing of R8) |
| `B9.1` \| `B9.2` | the schema batch rule: the migration and its definer functions stop for the plan review, the test-project push and `npm run e2e` before any screen reads them; a commit the harness cannot reach without `B9.1` (the fake's seed, the port) |

`B9.2` stays one batch: the route contract, the pages and the print routes
share `withRecords`, the item view, the share seed and `#/h/`'s goldens;
splitting the contract from its screens would ship routes that draw nothing.

| Batch | Goal and scope | Gates (cost) | Review |
|---|---|---|---|
| `B9.1` | 3.1, 3.2, layer 3 cases, the decision file | `check` 9, `check:db` 10, `build:test` + `check:built` 2; after the approve: `db:push --project test` 1, `e2e` 3 (~25 min) | plan review before; batch review (migration, definer functions, `anon` execute) |
| `B9.2` | 3.3-3.10, D65, D70, D71, the specs | `check` x2 18, `check:built` 2, `app/states` 6, `app/contracts` 8, `app/print` 4, goldens compare 13 and re-seed 3, `sweep.js 360` 8, `e2e` 3 (~65 min) | required (a public contract, new screens, a new write path from a shared page) |

R9 total: about 90 minutes of gates plus a 10-minute closeout. Bundle: about
+9 kB (the item page, the panel, the view, the copy builder), under the
300 kB ceiling; each batch raises the passed budget to the measured size plus
about 5 kB (R7d plan 7).

### 7.3 `B9.1` - the item link in the database, the port and the fake (implement-ready)

Objective: the database and port half of item links, held to the plan review
before any screen reads it.

In scope: the migration and reversal of 3.1; the port, adapter, fake, seed and
contract case P of 3.2; layer 3 cases; `META.md` section 3; `COVERAGE.md`; one
decision file. Out of scope: every screen, route, string and privacy text
(`B9.2`).

Files:
- new `supabase/migrations/<ts>_homebrew_shares.sql`,
  `supabase/reversals/<ts>_homebrew_shares.sql`,
  `tests/db/homebrew-shares.test.mjs`,
  `docs/decisions/<date>-an-item-link-is-a-share-row-with-its-own-revision.md`
- edit `tests/db/harness.test.mjs` (anon's function list),
  `app/src/ports/types.ts`, `supabase.ts`, `supabase.test.ts`,
  `fake-cloud.ts`, `fake-cloud-seed.ts`, `fake-cloud.test.ts`,
  `cloud.contract.ts`, `lazy-cloud.ts` (only if it lists `CloudPort` members),
  `docs/specs/META.md` (section 3), `docs/specs/COVERAGE.md`, then
  `node tools/decisions.js` for `docs/DECISIONS.md`.

Steps:
1. Write the migration of 3.1 in this order: table, index, RLS, grants,
   policy; the three functions with their grants; the three `create or
   replace` touch functions (copy today's bodies, add the share update);
   `homebrew_shares_broadcast` (copy `lists_broadcast`'s mark-and-send shape:
   setting `dhloot.hbs_broadcast`, the share id as the mark) and its deferred
   constraint trigger; `homebrew_shares_gone` and its trigger; `revoke
   execute` on every trigger function from `public, anon, authenticated`.
   Each function: `security definer`, `set search_path = public, pg_temp`, a
   one-line comment that says why.
2. Write the reversal (3.1). Run `npm run check:db` (PowerShell tool): the
   up-down-up walk must pass.
3. `tests/db/homebrew-shares.test.mjs` with the six-role helper
   (`tests/db/roles.mjs`): create as owner, again (same token), as another
   user (`42501`), as `anon` (no execute); read as `anon` (shape, the key,
   `src`, `book`, `cards`), malformed, unknown and stopped tokens (null);
   revoke as owner and as another user; create after a revoke (new token);
   the owner's select sees active and stopped rows, another user sees none;
   the revision moves by one for an item edit, a source rename of its source,
   an edit and a delete of a card it names, and not for another item's edit;
   an item delete removes its shares; the messages of `realtime.test.mjs`'s
   pattern: one `revision` per share per transaction, `null` on a revoke and
   on an item delete. Extend `harness.test.mjs`.
4. Port types (3.2); `supabase.ts`: `list` selects from `homebrew_shares`
   by `item_id`; `create`/`revoke`/`read` call the RPCs; `ownerOf` selects
   `item_id` by `token` (RLS answers only the owner's row). Map errors as
   `shares` does (`network`, `refused`). `supabase.test.ts` cases for each
   call's request and answer mapping, an unreadable `item` included.
5. Fake and seed (3.2); `fake-cloud.test.ts` cases for the revision bump and
   the emits.
6. Contract case P (3.2) after case O; the fake run passes in `npm run check`.
7. `META.md` section 3: four `anon` functions, the item link sentence; the
   decision file (context: the roadmap's two extra RPCs; decision: a share
   row with its own revision bumped by the touch triggers, the copy and the
   add built on existing calls; rejected: `clone_shared_homebrew` and
   `add_shared_homebrew_to_list` definers (two more definer functions for
   writes the client already makes), an owner-wide broadcast to every item
   link (a message to every open item page per write), a computed revision
   (not monotonic when a card is deleted)).
8. `npm run check` (one foreground call, `rtk npm run check`, timeout 600000);
   `npm run build:test` and `npm run check:built` (bundle measured, budget
   step). Commit (the task's first commit). After the batch review approves:
   `npm run db:push -- --project test`, then `npm run e2e`.

Acceptance:
- `check:db` green with the new file; the reversal walk passes.
- `anon` executes exactly the four functions `harness.test.mjs` names.
- Contract case P passes over the fake (`npm run check`) and over the test
  project (`npm run e2e`, after the approve).
- A second `create` never makes a second active row; a revoked token reads
  null; an item delete makes its token read null.
- Standing checks: scale, consistency and RU/EN not applicable - no screen
  and no string. Error scenarios: section 5 rows "create or revoke" and
  "revert" hold, each with its test (refused create, idempotent revoke, the
  reversal walk).

Verification commands: `npm run check:db` (PowerShell), `rtk npm run check`,
`npm run build:test`, `npm run check:built`; after the approve
`npm run db:push -- --project test`, `npm run e2e`.

Do not: add an RPC for the copy or the add; add a `realtime.messages`
policy; give `anon` a table grant; push to production (CI does at the
release push).

### 7.4 `B9.2` - the screens, the routes and the print (outline)

Files (expected): new `ShareRow.svelte`, `ItemSharePanel.svelte`,
`ItemSharePage.svelte`, `MakeOwn.svelte` (button, note, prompt) and their
tests, `state/itemShareView.svelte.ts` and test; edit `SharePanel.svelte`,
`RecordPage.svelte`, `PickRow.svelte`, `RecordActions.svelte`,
`HomebrewEditor.svelte`, `SharedListPage.svelte`, `SelBar.svelte`,
`PrintPage.svelte`, `App.svelte` (the route kinds), `state/app.svelte.ts`
(`itemShare`, `frozenCopy`, `saveItem`, `savedItems`, the pending action),
`state/cloudLists.svelte.ts` (the replace), `lib/hash.ts`, `lib/homebrew.ts`
(`copyRows`), `lib/pending.ts`, `lib/dict.ts`, `a11y.test.ts`,
`tests/app/inventory.js` and goldens, `tests/app/print.js`,
`tests/app/contracts.js`, `docs/fixtures/urls/routes.json`,
`tests/contracts.js`, `llms.txt`, `docs/specs/FEATURES.md` ("Records",
"Homebrew", "Account and browser lists", "Print"), `ROUTES.md`,
`CONTRACTS.md`, `STATE.md` (session memory; the `saveItem` action of
`dhloot.auth.return`), `COVERAGE.md`, `DEBT.md` (D65, D70, D71 deleted),
both privacy pages, `tests/e2e/flows.mjs` (a flow: share an item, open it
signed out, revoke, gone).

Acceptance lines (each its own line at the batch's close):
- The panel on `#/i/<key>` and in the editor (3.4), with its five states.
- `#/h/<token>` signed out, as a reader, as the owner, loading, gone,
  failed, live update and live gone announced (3.5).
- Add to list from `#/h/` writes a frozen copy for a reader and a reference
  for the owner (3.6).
- «Сохранить себе» on `#/h/`, on a `#/s/` row and on a frozen row of the
  reader's own list (with the replace), its refusals, its retry, the
  signed-out return (3.6).
- `#/print/s/<token>/<ids>` and `#/print/h/<token>` print after a reload,
  with the loading and gone states; a catalog-only `#/s/` selection keeps
  `#/print/<ids>` (3.7). D70 deleted.
- D65: a live revoke on `#/s/` is announced once (3.8). D65 deleted.
- Privacy pages (3.9); D71 deleted.
- The route contract of 3.3 in one commit with its fixtures.
- Every state of section 4 and scenario of section 5 that B9.2 adds: its
  proof named in the handoff.
- Inherited from R7d and R7h: none known today; the refresh before dispatch
  adds any open review row as its own line here.

## 8. Specs and contracts per batch

| Batch | Specs | Contracts | Tests |
|---|---|---|---|
| `B9.1` | `META.md` 3, `COVERAGE.md`, a decision file | none (no public surface) | layer 3 new file and harness; layer 1 port, fake, contract case P; layer 4 case P |
| `B9.2` | `FEATURES.md`, `ROUTES.md`, `CONTRACTS.md` 1, `STATE.md`, `COVERAGE.md`, `DEBT.md`, privacy pages, `llms.txt` | the three routes | layer 1 components and states; layer 2 states, goldens, print, contracts, sweep 360; layer 4 a flow |

## 9. Owner answers (2026-10-02)

Every question is answered; nothing stays open. The options not taken are
kept one line each for the record.

- **Q9-1 Where «Сохранить себе» is offered: A.** On `#/h/` and in the card of
  every record of another account's item - a `#/s/` row and a frozen row of
  the reader's own list, where the press also turns the row into a reference
  to the saved copy (m35). Accepted trade-off: a replace write (a remove and
  an add in one flush) on the list page, with no undo. Not taken: B (`#/h/`
  only), C (rows too, the frozen row stays frozen).
- **The label clash: accepted.** On `#/s/` the Russian label of a row card's
  button and the page's list button both read «Сохранить себе» (English
  differs: "Save to my items" and "Save to my lists"); the note line under the
  item button (`saveItemNote`, `saveItemNoteList`) says where the copy goes.
  A named departure from rule 4 (one name for one thing), the owner's wording.
- **Q9-2 The print routes: A.** `#/print/s/<token>/<ids>` (written by `#/s/`'s
  selection bar only when it holds a homebrew entry) and `#/print/h/<token>`;
  `#/print/list/<id>` is dropped (m36). Accepted trade-off: a `#/print/<ids>`
  address with own items handed to another GM still prints no homebrew card
  there. Not taken: B (the roadmap's pair).
- **Q9-3 What the copy keeps: A.** The item and its own set and rule cards
  (copied as the reader's new cards) in «Хоумбрю»; catalog relations stay;
  the author's source and the links to the author's other items are dropped.
  Accepted trade-off: up to four cards count against the reader's card limit.
  Not taken: B (drop the cards), C (copy the source).
- **Q9-4 Where «Поделиться» sits: A.** The card's action row on `#/i/<key>` and
  on the editor's preview card, the panel under the card (m30, m31). Not
  taken: B (the editor's button row).
- **Q9-5 D65: yes.** B9.2 pays D65 (3.8) and deletes its `DEBT.md` entry.

The roadmap's section 9 row and section 14 outline of `B9.1` take these
answers at R9's closeout (`/handoff` compacts the roadmap).

Decided here, no question (low impact, recorded): the item link has no
audience and no GM notes; relations follow the frozen copy's rule; the copy
and the add use existing calls (no new definer); `#/h/` draws «Загружаем...»
while it reads.

## 10. Risks, assumptions, deferred

- Risk: `homebrew_cards_touch` already runs per card row; a card delete that
  names many items now also updates their shares. At 3x (300 items naming
  one card) that is one statement over at most 300 rows. Measured in step 3's
  timed case only if it passes 1 s on the local stack.
- Risk: the replace on a list page races a manual edit of the same row;
  today's per-entry last-write-wins and the dropped-edit rule cover it.
- Assumption: R7h ships the editor without «?» on «Ранг» and «Урон»; the
  editor goldens B9.2 re-seeds start from R7h's.
- Deferred (to the owner, not `DEBT.md`): a `#/print/<ids>` address handed to
  another GM drops own items silently; a print note "N cards are not
  available" would say so (`persist-review` candidate). `#/s/`'s blank first
  read versus rule 6 (`persist-review` candidate).

## 11. Mocks

`issues/persist-9-item-share/mocks/index.html`:

| Mock | Screen and states |
|---|---|
| `m30-item-share-panel.html` | `#/i/<key>` as gm1: closed, open and ready, loading, failed read, deleted link, failed change; desktop and 360 px |
| `m31-editor-share.html` | the editor: the panel in the preview column (desktop), under the form (360 px), a new item without it |
| `m32-item-page-signed-out.html` | `#/h/` signed out: desktop, 360 px RU and EN, the two sign-in prompts |
| `m33-item-page-signed-in.html` | `#/h/` as gm2: the menu, «Сохранить себе» success, limit, network, items loading; as gm1: the owner line |
| `m34-item-page-states.html` | loading, gone (announced), failed, a live update, the longest name at 360 px |
| `m35-save-from-a-list.html` | Q9-1 A (owner, 2026-10-02): a frozen row's card on gm2's own list (replace), a `#/s/` row's card |
| `m36-print-routes.html` | Q9-2 A (owner, 2026-10-02): `#/print/s/<token>/<ids>`, `#/print/h/<token>`, loading, both gone pages |
