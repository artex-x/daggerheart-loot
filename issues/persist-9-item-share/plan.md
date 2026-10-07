# Plan - TASK persist-9-item-share (homebrew release R9)

## Status

- Task status: refreshed 2026-10-07 (planner, mode B) against R7h's plan at
  `ac23ce36` (`issues/persist-7h-homebrew-page/plan.md`), which ships the
  item address `#/h/<uuid>`, live list links, «Сохранить себе», the change
  log and D71. Not started. Dispatch order (owner): R7h, R9, R8,
  `debt-cleanup`, `persist-review`, R10.
- The design of 2026-10-02 (share tokens per item, `homebrew_shares`, the
  share panel, frozen-copy adds) is superseded by R7h W1 (owner, 2026-10-03,
  R1 and W1-a to W1-e). Its full text: `git show
  ac23ce36:issues/persist-9-item-share/plan.md`. Section 2 lists what of it
  R7h delivers, what R9 still owes, and every user-visible feature that is
  now dropped.
- NEEDS_HUMAN_CONFIRMATION: no - the owner answered Q9-6 to Q9-10 on
  2026-10-07 (section 9). Open for the orchestrator, not the owner: where
  the `updated_at` key of Q9-8 B is built (3.9; recommended: R7h B7h.3).
- Plan review: required before B9.1 (trigger: a public contract change - the
  routes `#/print/s/<token>/<ids>` and `#/print/h/<uuid>`). If the
  orchestrator places the `updated_at` migration in R9 (the schema batch
  `B9.0`, 7.3), the planner writes a new required line for `B9.0` (trigger:
  a migration that replaces a SECURITY DEFINER function `anon` executes; the
  answer then reveals the item's last edit time) before it runs.
- Plan review findings applied: reviews/plan-B9.1.md
  - plan-B9.1-1: 3.4, 5, 7.2 files and step 4 - the print page opens the
    share view with `{ watch: false }` (no Realtime topic, no safety
    refetch); the same rule for the item view on `#/print/h/`; a unit case
    that a revoke and an owner edit leave the open sheet unchanged.
  - plan-B9.1-2: 7.2 files, step 9, acceptance - `tests/contracts.js`
    checks that `llms.txt`, `CONTRACTS.md` and `ROUTES.md` name both routes.
  - plan-B9.1-3: 3.4, 10, step 4 - the view effect returns a cleanup on a
    change of kind or token and re-opens a view the old page closed; tests
    for both orders and for a print-to-print navigation.
  - plan-B9.1-4: 3.0, step 1 - five R7h assumptions (a)-(e); step 1 stops
    on (b), records (c)-(e).
  - plan-B9.1-5: 2.3, Status refresh line, Q9-9, 7.2 acceptance - details
    (f) the relinked row keeps its place, quantity, price and notes, (g) a
    refusal says `importRefused`.
  - plan-B9.1-6: 3.3, 7.2 "Do not" - a linked foreign row card on an own
    list writes `#/print/h/<uuid>`; the "Do not" names `#/s/` and `#/h/`.
  - plan-B9.1-7: 3.6, 7.2 files, 8, Q9-7 - the re-read sits beside
    `#refreshShared` (signed out too), with no visibility check (no port
    change); `STATE.md` added.
  - plan-B9.1-8: 3.3, 3.6, 6, m37 - the author on `#/h/` prints
    `#/print/h/<uuid>` too.
  - plan-B9.1-9: 3.4, 5, m37 - the failed print page uses the small
    «Повторить» (rule 6: the fixed title does not state the failure).
  - plan-B9.1-10: 3.4 - `printShare`'s set line reads the share's
    `withRecords` index.
  - plan-B9.1-11: 3.2, step 9 - the two patterns, the edge cases, a
    `#/print/s/<token>` fixture.
  - plan-B9.1-12: step 9 - two `ROUTES.md` paragraphs updated.
  - plan-B9.1-13: 3.8 - `printItemGone` says «в адресе ошибка» / "the
    address is wrong".
  - plan-B9.1-14: 3.1, 3.4, step 4 - `#/print/h/` in a build with no
    sign-in draws the not-found print page; a unit case.
  - plan-B9.1-15: 3.4, 6 - on the two new kinds «Назад» falls back to
    `#/s/<token>` or `#/h/<uuid>`, and the empty state offers «Назад» to
    `#/s/<token>`.
  - plan-B9.1-16: `handoff.md` Verification and Completed - the prettier
    result and the report path.
  - plan-B9.1-17: 10 and `handoff.md` Deferred - the print note for
    dropped own items, deferred to the owner with the reason.
  - plan-B9.1-18: R7h's (the entry limit in R7h 5.2); the orchestrator
    recorded it in R7h's `context.md`. No R9 change.
- Refresh before dispatch (after R7h's closeout): confirm the names and the
  assumptions (a)-(e) this plan takes from R7h B7h.4 (section 3.0) against
  the tree; check which of Q9-9's details (a)-(g) B7h.4 shipped (the owner
  placed all seven in B7h.4, Q9-9 A); check whether R7h's
  `get_homebrew_item` answers `updated_at` (3.9; if not, `B9.0` runs
  first); add every open R7h review row or Deferred item placed on R9 as
  its own acceptance line in B9.1. The design does not depend on the names.
- Batches:

| Release | Task id | Batch | Status |
|---|---|---|---|
| R9 | `persist-9-item-share` | `B9.0` (only if R7h does not carry it) `updated_at` in `get_homebrew_item`'s answer: the migration, its reversal, layer 3, the port, the fake, the privacy sentence | outline (7.3), conditional on the orchestrator's routing (3.9) |
| R9 | | `B9.1` the print routes of another account's items (D70), the print wait for own lists, «Печать» on `#/h/` for a reader, the item page's announcements, the 45 s re-read and «Обновлено N назад» on `#/h/`, `#/s/`'s first-read line and D65 | implement-ready after R7h's closeout (7.2); plan review done |

## 1. Objective and non-goals

Objective: after R7h, a homebrew item of another account prints from an
address that survives a reload and a hand-over: a shared list's selection
(`#/print/s/<token>/<ids>`) and one item (`#/print/h/<uuid>`) (D70; owner's
Q9-2 A, 2026-10-02, with the item's id in place of a share token). The
print page shows «Загружаем...» while it reads instead of «Печатать нечего»
for a moment. The shared list page shows «Загружаем...» on its first read
and announces a live revoke (D65; owner's Q9-5). The item page gives a
reader «Печать», re-reads every 45 s (Q9-7 B), draws «Обновлено N назад»
(Q9-8 B), and announces a change it draws.

Non-goals: everything R7h W1 builds (section 2); pictures (R8, which reads
`img` from the same projections, so R9's print routes print it with no R9
work); a print route for a whole account list by id (`#/print/list/<id>`,
dropped by Q9-2 A); live updates on a print sheet (a sheet is read once).

## 2. R9 after R7h

### 2.1 What R7h delivers (B7h.3, B7h.4)

| R9 item of 2026-10-02 | After R7h |
|---|---|
| 3.1 `homebrew_shares`, `create_homebrew_share`, `revoke_homebrew_share`, `get_shared_homebrew`, the share triggers | not built: an item is read by its id through `get_homebrew_item` (definer, `anon`) |
| 3.2 the port, the fake, contract case P | not built: R7h's case R covers the read by id |
| 3.3 `#/h/<token>` | R7h's `#/h/<uuid>` |
| 3.5 the item page: the card, «Предмет другого игрока», «Загружаем...», «Предмет не загрузился» and «Повторить» | R7h B7h.4 (m03) |
| 3.6 «Добавить в список» from the item page | R7h: a live link (owner W1-b), not a frozen copy |
| 3.6 «Сохранить себе» on `#/h/`, on a `#/s/` row and on a row of the reader's own list (the row then points to the copy), `copyRows`, one `import_homebrew` call, the limit and network refusals | R7h B7h.4 (Q9-1 A and Q9-3 A kept) |
| 3.9 the privacy pages, D71 | R7h B7h.4 |
| the author's controls on the own link («Это ваш предмет.», «Открыть для правки») | R7h: the author on `#/h/` sees «Изменить», as on `#/i/<key>` |

### 2.2 What R9 still owes (this plan)

| Item | Section |
|---|---|
| `#/print/s/<token>/<ids>` and `#/print/h/<uuid>` (D70), a public contract change | 3.1-3.4 |
| the print page's loading, failed and gone states; the wait for a signed-in reader's lists and own items | 3.4, 3.5 |
| «Печать» for a reader on `#/h/` (R7h draws none until R9, plan-B7h.1-14) | 3.6 |
| the item page announces a change and a gone item (D65's rule on the sibling page) | 3.6 |
| `#/h/` re-reads every 45 s (owner's Q9-7 B) and draws «Обновлено N назад» (owner's Q9-8 B) | 3.6, 3.9 |
| any of Q9-9's details (a)-(g) that R7h B7h.4 ships without (owner's Q9-9 A) | 3.8, 7.2 |
| `#/s/`'s first read draws «Загружаем...» (rule 6; R7h section 6 names it R9's) | 3.7 |
| D65: a live revoke on `#/s/` is announced once | 3.7 |

### 2.3 User-visible features of the 2026-10-02 design that are dropped or not named

Each row was the owner's call (section 9, answered 2026-10-07). "Changed"
rows keep the feature in another shape and asked nothing.

| Feature (mock of 2026-10-02) | After R7h | Owner's answer |
|---|---|---|
| A revocable item link: «Удалить ссылку» stops readers at once and keeps the item; «Создать ссылку» makes a new address (m30, m31) | dropped: the id is the address for as long as the item exists | Q9-6 A: dropped |
| The share panel «Поделиться» with its hint of what a reader sees and can do (m30, m31) | dropped: «Отправить» and the copied address carry `#/h/<uuid>`; the privacy pages say who reads an item | Q9-6 A: dropped |
| `#/h/` updates within about a second over a Realtime topic, and says «Предмет обновлён» (m34) | R7h re-reads when the tab is shown again (P13) | Q9-7 B: R9 adds a 45 s re-read (3.6) |
| `#/h/` announces that the item went while the page was open (m34) | not named in R7h | built in B9.1 (3.6) |
| «Обновлено N назад» on `#/h/`, as on `#/s/` (m32-m34) | the answer carries no `updated_at` | Q9-8 B: kept; the key per 3.9, the line in B9.1 |
| «Сохранить себе» signed out: a sign-in prompt, and the copy is made by itself after the sign-in (m32) | not named in B7h.4 | Q9-9 A (a): R7h B7h.4 |
| «Сохранено», disabled after the press until the page is left, so a second press makes no second copy (m33) | not named in B7h.4 | Q9-9 A (b): R7h B7h.4 |
| On a row of the reader's own list: a note before the press and a toast after it that say the row now points to the copy (m35) | not named in B7h.4 (R7h relinks the row) | Q9-9 A (c): R7h B7h.4 |
| «Изменить» on the saved toast, which opens the copy (m33) | not named in B7h.4 | Q9-9 A (d): R7h B7h.4 |
| «Сохранить себе» while own items still load says `hbNotReady` and writes nothing | not named in B7h.4 | Q9-9 A (e): R7h B7h.4 |
| The relinked row of the reader's own list keeps its position, quantity, price and both notes (old 3.6) | not named in B7h.4 («the row is relinked to the copy»); a remove plus an add loses the GM's price and notes | Q9-9 A (f): R7h B7h.4 |
| A refusal other than a limit or the network says `importRefused`'s text (old 3.6) | not named in B7h.4 (network and limit refusals only) | Q9-9 A (g): R7h B7h.4 |
| The gone page «Предмет больше не доступен» / «Владелец удалил эту ссылку или предмет.» | changed: R7h's «Предмет не найден» (the record page's) | none |
| The page heading «<name>» with the sub «Предмет от другого игрока · <path>» | changed: R7h draws the card with «Предмет другого игрока» in it | none |
| The reader's add is a frozen copy that never changes | changed by the owner (W1-b): a live link, with the change log | none |

## 3. Design (B9.1)

### 3.0 Names this plan assumes from R7h

R7h B7h.4 is not built yet. This plan calls its parts: the `#/h/` route kind
`item` (`{ kind: 'item'; id }`), the page `ItemPage.svelte`, the view
`app.itemView` (`status`, `record`, `mine`, `hid`, `revision`, a per-view
index `index` with the related items, `open(id)`, `refresh()`, `close()`),
and the account lists' linked records that replace `frozenCopy` in
`recordFor`. The refresh at dispatch writes the real names into this
section and into 7.2's file list; nothing else changes.

Assumptions step 1 checks (plan-B9.1-4):

- (a) the item view has a retry after a failed read (`retry()`), which 3.4
  calls for `printItem`;
- (b) `recordFor` finds a linked foreign item of an account list on any
  route, not only on the list page; if the linked records live only in the
  list page's index, 3.5's wait and `ListPage`'s own-list print never
  resolve the key - step 1 stops and reports;
- (c) the rule by which `#/h/` reads its uuid (the pattern and the stray
  character), which 3.1 reuses for `#/print/h/`;
- (d) the item view's status after a re-read finds no item (3.6's
  announcement keys on it);
- (e) whether R7h's "no «Печать» for another account's item" also removes
  «Печать» from a linked row card on an own list (3.3 writes
  `#/print/h/<uuid>` there);
- and whether the item view can open without its shown-again re-read, for
  `#/print/h/` (3.4).

Step 1 records (c), (d) and (e) in this section.

### 3.1 Routes (a public contract change)

| Hash | Meaning |
|---|---|
| `#/print/s/<token>/<id>[*<n>]-...` | the print sheet of a selection of an account list shared by its owner, read through that link (`get_shared_list`), signed out too; the token is read as the leading run of `[A-Za-z0-9_-]`, the selection as the leading run of `[\w*-]`, a stray character after it is dropped and the address kept; the ids and counts read as `#/print/<ids>` reads them; a stopped, deleted, unknown or empty token, and every token in a build with no sign-in, draws one "no longer available" print page, never home |
| `#/print/h/<uuid>` | the print sheet of one homebrew item, read by its id (`get_homebrew_item`), signed out too; the id is read as `#/h/` reads it; a malformed or unknown id, and every id in a build with no sign-in, draws one "not found" print page, the address kept |

`#/print/<ids>` is unchanged. Settled (owner's Q9-2 A, 2026-10-02; R7h
section 6 names the uuid form): the address of a selection that holds a
homebrew entry names its link, so it prints after a reload and for the
person it is handed to.

### 3.2 Parse and build (`lib/hash.ts`)

- `Route` gains `{ kind: 'printShare'; token: string; segment: string }` and
  `{ kind: 'printItem'; id: string }`. Both are matched before the `print`
  branch, which cannot match them: its class has no `/`.
- Patterns (plan-B9.1-11): `printShare` is
  `/^print\/s\/([A-Za-z0-9_-]*)[^/]*(?:\/([\w*-]*))?/` - the token is the
  leading run, characters after it up to the next `/` are dropped, the
  segment is the leading run after that `/`, and anything after it is
  dropped; `#/print/s/<token>` with no `/` has an empty segment (after the
  read: «Печатать нечего»). `printItem` is `/^print\/h\/(.*)$/`, the id then
  read by `#/h/`'s rule (3.0 (c)). `#/print/s` and `#/print/h` with no
  slash stay today's print addresses of the id `s` or `h` («Печатать
  нечего»).
- The `print` route gains `unknownHb: boolean`: the segment names an `hb_`
  key that `knows` did not find. The print page waits on it (3.5).
- The print branch's body moves into an exported
  `printSelection(segment, knows): { ids; dropped; qty; unknownHb }`, which
  `parseHash` and the print page call (`printShare` keeps the raw segment,
  because its ids are known only after the link reads).
- Builders: a private `printSegment(ids, qty)` (today's join in `printHash`);
  `printHash(ids, qty)` unchanged in output; `printShareHash(token, ids,
  qty)` = `'#/print/s/' + token + '/' + printSegment(ids, qty)`;
  `printItemHash(id)` = `'#/print/h/' + id`.

### 3.3 Where the app writes each address

`AppState.printHref(ids, qty?)`, the one place a print link is built:

- route `share`, `sharedView.status === 'ready'`, and any id is an `hb_`
  key: `printShareHash(sharedView.token, ids, qty)` - for the owner too, so
  the address works when it is handed on;
- route `item` and `ids` is the view's record: `printItemHash(itemView.hid)`
  - for the author too (plan-B9.1-8), so the author's address works when it
  is handed on, as the owner's on `#/s/`;
- one id that names a linked foreign item of an account list (a row card's
  «Печать» on the reader's own `#/lists/<id>`): `printItemHash(<its hid>)`,
  which survives a hand-over (plan-B9.1-6);
- anything else: `printHash(ids, qty)` (a catalog-only selection on `#/s/`
  keeps the address that never stops working).

Callers: `PickRow.svelte` (a card's «Печать»), `SelBar.svelte`, R7h's item
page pick row. `ListPage.svelte`'s own-list print keeps `printHash` (own
keys and linked foreign keys resolve after the account read, 3.5).

### 3.4 The print page (`PrintPage.svelte`, m37)

- Props: the route (`print`, `printShare` or `printItem`) instead of `ids`,
  `dropped`, `qty`; `App.svelte` mounts it for all three kinds.
- `printShare`: opens `app.sharedView` for the token with
  `open(token, userId, { watch: false })` (plan-B9.1-1): `SharedView.#ready`
  skips `#feed.watch` when `watch` is false, so the print page joins no
  Realtime topic and gets no safety refetch; a later `open` of the same
  token with `watch` true (the default, `SharedListPage`) starts the feed,
  so a return to `#/s/` is live again. Once `ready`,
  `printSelection(segment, (id) => app.knows(id))` gives the ids,
  `dropped` and `qty`; records come from `app.recordFor` (own records win,
  then the share's records, as on `#/s/`). The set line reads the share's
  index `withRecords(base, [], snapshotRecords(view.shared))` (or R7h's
  equivalent), as `#/s/` draws it, so a foreign set item names its members
  (plan-B9.1-10).
- `printItem`: opens `app.itemView` for the id without its shown-again
  re-read (the rule of plan-B9.1-1; 3.0 checks that the item view allows
  it); the sheet holds the view's record; the set line reads the view's
  per-view index, so it names the members as the reader's card does (on
  `#/h/` the answer wins a key collision, plan-B7h.1-8 of R7h). In a build
  with no sign-in (no item view) the page draws not found (plan-B9.1-14).
- The hand-over (plan-B9.1-3): one effect per view, keyed on the route
  kind, the token or id, and the session. It returns a cleanup that closes
  the view when the kind or the key changes (so `#/print/s/A/x` to
  `#/print/x` by Back or Forward closes it, though the component stays),
  and it reads `view.token` (or the item view's id), so a view that the old
  page closed after the new page opened it is opened again.
- States, each under the fixed heading «Печать карточек» (rule 7):
  - loading (the view `idle` or `loading`, or 3.5's wait): `LoadState`
    «Загружаем...»;
  - failed (the view `error`, or the account read failed during 3.5's
    wait): `LoadState` failed, `printLoadFailed`, the small «Повторить»
    (rule 6: the fixed title does not state the failure, as on
    `#/homebrew`; plan-B9.1-9), which reads the link again (`view.retry()`)
    or the account again (`cloudLists.refresh()`, `homebrew.read()`);
  - gone (`printShare`: the view `gone`, or no `sharedView` in a build with
    no sign-in): the sub `printShareGone` and «На главную»;
  - not found (`printItem`, a build with no sign-in included): the sub
    `printItemGone` and «На главную»;
  - ready with no printable id: today's «Печатать нечего»; on `printShare`
    its button is «Назад» to `#/s/<token>` in place of «Списки»
    (plan-B9.1-15);
  - ready: today's page.
- «Назад» with no history falls back to `#/s/<token>` on `printShare` and
  to `#/h/<uuid>` on `printItem` (today: `#/lists`, a page about own lists
  that a signed-out reader of a handed-over address does not have;
  plan-B9.1-15).
- «Ссылка на набор» copies the address of the route on screen with the
  resolved ids: `printShareHash(token, ids, qty)`, `printItemHash(id)` or
  `printHash(ids, qty)`.
- No live re-read: the sheet is read once; a reload reads again.

### 3.5 The wait for a signed-in reader's own records

`#/print/<ids>` resolves own keys and linked foreign keys only after the
account read; today the page draws «Печатать нечего» until then, or prints
the catalog ids alone for a moment. `AppState.printWait` answers `loading`
while the route is `print` with `unknownHb` and either the session is not
known yet (`user === undefined` in a build with sign-in) or a signed-in
user's `cloudLists` or `homebrew` status is `idle` or `loading`; `failed`
when either status is `error`; else `none`. Signed out, nothing waits: the
page prints what it knows, as today.

### 3.6 The item page (`ItemPage.svelte`, m39)

- A reader's pick row gains «Печать» after «Добавить в список», before
  «Сохранить себе», `href={app.printHref([record.id])}` (so
  `#/print/h/<uuid>`). The author's row is R7h's; its «Печать» also goes
  through `printHref`, so it writes `#/print/h/<uuid>` too (3.3,
  plan-B9.1-8).
- A visually hidden polite status region, mounted for as long as the page
  is: «Предмет обновлён» (`itemUpdated`) once per re-read that changes the
  shown `revision` after the first draw; «Предмет не найден» (`notFound`)
  once when a ready page's re-read finds no item. A first read that finds
  nothing says nothing. If R7h ships such a region, B9.1 checks both
  messages and adds nothing.
- «Обновлено N назад» (owner's Q9-8 B, m39): under the card's «Предмет
  другого игрока» line, for a reader and for the author, the line `#/s/`
  draws: `agoText(Date.parse(answer.updated_at), app.now, app.lang, t,
  'updated')` with the 45 s clock. It reads the latest answer's
  `updated_at` on every read, whatever the revision compare says. An answer
  without `updated_at` (R7h's build before the key, or a revert of 3.9's
  migration) draws no line.
- The 45 s re-read (owner's Q9-7 B): the app's 45 s tick
  (`#pollLists`) also calls `itemView.refresh()` while the route is `item`.
  The call sits beside `#refreshShared`, before the
  `if (!lists || !this.user) return`, so signed-out readers re-read too
  (plan-B9.1-7). It has no visibility check, as `#refreshShared` has none:
  `PagePort` has no "visible now" getter, and B9.1 changes no port. The
  revision compare means no redraw when nothing changed. `STATE.md`'s
  re-read cadence paragraph names the item page.

### 3.7 The shared list page (`SharedListPage.svelte`, m38)

- First read: the branch that draws nothing while the link reads draws
  `LoadState` («Загружаем...», no heading: the heading is the list's name).
- D65: the `.said` region moves out of the drawn-list branch and is mounted
  whenever `token !== undefined`. It keeps saying «Список обновлён» on
  `view.changes`, and says «Список больше не доступен» (`shareGone`) once
  when the view turns `gone` after it was `ready`. The gone page itself is
  today's. `DEBT.md` D65 and its section are deleted.

### 3.8 Strings (RU / EN)

New:

| Key | RU | EN |
|---|---|---|
| `printLoadFailed` | Не получилось загрузить карточки. | Could not load the cards. |
| `printShareGone` | Список больше не доступен: владелец удалил ссылку или сам список. | The list is no longer available: the owner deleted the link or the list. |
| `printItemGone` | Предмет не найден: автор удалил его, или в адресе ошибка. | Item not found: the author deleted it, or the address is wrong. |
| `itemUpdated` (only if R7h has no key for it) | Предмет обновлён | The item was updated |

Reused: `printTitle`, `printEmpty`, `cloudLoading`, `retry`, `toStart`,
`notFound`, `shareGone`, `listUpdated`, `print`, `printLink`, `linkCopied`,
and `agoText`'s `updated` keys for «Обновлено N назад» (no new key).

Only for a Q9-9 detail that R7h B7h.4 shipped without (owner's Q9-9 A puts
all seven in B7h.4; B7h.4 may take these strings as they are):

| Key | RU | EN |
|---|---|---|
| `signInToSaveItem` | Войдите, и копия предмета сохранится в «Мои предметы». | Sign in and a copy of the item is saved to My items. |
| `saveItemDone` | Сохранено | Saved |
| `saveItemNoteList` | Копия попадёт в «Хоумбрю», а эта строка списка будет вести на неё. | The copy goes to Homebrew, and this list row will point to it. |
| `saveItemRelinked` | Предмет «%s» сохранён в «Мои предметы», строка списка ведёт на копию | Item "%s" saved to My items; the list row now points to the copy |

`signInToSaveItem` follows `signInToSave`'s shape («Войдите, и список
сохранится в ваш аккаунт.»). The saved toasts take the action «Изменить»
(`edit`), which opens `#/homebrew/<new key>` in a new tab; (e) reuses
`hbNotReady`; (f) needs no string; (g) reuses `importRefused`.

### 3.9 `updated_at` in the item's answer (owner's Q9-8 B)

- The key: `get_homebrew_item(p_id)` answers `updated_at`, the greatest of
  the item's, its source's (`homebrew_books`) and the named cards'
  (`homebrew_cards`) `updated_at` - the columns exist
  (`20260930130000_homebrew.sql`, `20261001130000_homebrew_relations.sql`).
  It stays out of R7h's `revision` md5, so the redraw rule is unchanged.
  `get_homebrew_items` and `get_shared_list` do not change.
- Privacy: the answer then tells anybody with the address when the author
  last changed the item, its source or its cards. The privacy pages
  ("Share links") say so in the release that first answers the key, and
  `META.md` section 3's sentence on the item read names it. RU: «По адресу
  предмета видно и время его последней правки.» EN: "The item's address
  also shows when it was last changed."
- Where it is built - the orchestrator routes it; recommended first:

| Option | For | Against |
|---|---|---|
| **R1. R7h B7h.3 answers `updated_at` from the start, and B7h.4's privacy text carries the sentence (recommended)** | `get_homebrew_item` is created there and not yet committed; one definer body, one plan review that already covers it; R9 stays screen-only (no `B9.0`, about 25 minutes and a batch review saved); R7h's release never exposes a key that its privacy text does not name | B7h.3's review fix pass grows by one key and one layer 3 assertion, and its reviewer re-checks the forbidden-keys list; B7h.4 grows by one privacy sentence |
| R2. R9 `B9.0`: a migration that replaces `get_homebrew_item` with the key (7.3) | R7h stays as reviewed | a second `create or replace` of a definer function `anon` executes, its reversal, a plan review and a batch review, a test push and `e2e` before B9.1 (+25 minutes); the privacy sentence ships with B9.1 at the same release push |
| R3. A later R7h batch (B7h.4 or after) | R7h's B7h.3 stays as reviewed | a migration in a screen batch breaks the schema batch rule (a definer change stops for its review, the test push and `e2e` before a screen reads it) |

Reason for R1: the function does not exist on any database yet, so adding
the key there costs one line and avoids a second definer replace.
Trade-off accepted: R7h's B7h.3 fix pass widens slightly.

## 4. Scale (States table, B9.1)

Limits: `PRINT_MAX` 180 (a validator constant, no 3x row); entries per list
100 (`limit_defaults` `entries_per_list`; 3x 300); one item per
`#/print/h/`.

| State | Screen | Proof |
|---|---|---|
| `#/print/s/` empty selection, or no id the list holds | «Печатать нечего», «Списки» | unit `printPage.test.ts` |
| `#/print/s/` one homebrew entry; one with a count | one card; « ×2» after the name | golden `#/print/s/player-token-1/<axe>-ci1*2` (two cards), unit |
| `#/print/s/` nine entries | one sheet | unit |
| `#/print/s/` 180 ids (the cap) and 181 | 180 cards; 180 and the red note | unit over `printSelection`; the note's existing golden `#/print/<181 ids> ~ too many` unchanged |
| `#/print/s/` 100 entries (the list limit) and 300 (3x) all ticked | 100 cards on 12 sheets; 180 cards and the red note (120 dropped) | unit `printSelection` with 100 and 300 ids; the address of 300 ids (about 6 kB) is read whole |
| `#/print/h/` one item; the longest name (120) and description (3000) with three rule cards | one card fitted by today's rule | unchanged (`PrintCard` over the same projection; own-item print states exist) |
| print loading, failed, gone, not found at 360 px and 1180 px | m37 frames | goldens of gone and not found at 1180; `sweep.js 360` over the new states; loading and failed by unit |
| `#/print/<ids>` as gm2 with a linked foreign item, after a reload | «Загружаем...», then the card | golden `#/print/<key> as gm2` (today's frozen-copy state, which R7h re-seeds as a link; unchanged by R9) and unit for the wait |
| `#/h/` as a reader: three buttons in the pick row at 360 px | the row wraps to two lines; «Добавить в список» first | golden `#/h/<bedroll uuid> as gm2` re-seeded; `sweep.js 360` |
| `#/s/` first read at 360 px | one line «Загружаем...» | unit `sharedListPage.test.ts` |
| `#/h/` «Обновлено N назад»: just now, minutes, days; an answer without `updated_at` | the line under «Предмет другого игрока»; no line | golden `#/h/<bedroll uuid> as gm2` (the seed's fixed `updated_at`, as `#/s/`'s «3 дня назад»); unit for the other three |
| `#/h/` the 45 s re-read: unchanged answer; changed answer | nothing redrawn, the line's age moves; the card redraws and «Предмет обновлён» is said | unit with the fake clock |

At many and at the limit: the print bar keeps today's order with «Отправить
на печать» primary; no popup, no text field, so the on-screen keyboard does
not apply; the selection bar on `#/s/` is today's sticky region and does not
grow.

## 5. Error scenarios (B9.1)

B9.1 writes nothing to the account or the database.

| Scenario | Screen | Stored data and recovery |
|---|---|---|
| loading (the link, or 3.5's account read) | «Печать карточек», «Загружаем...» | none |
| a failed read or offline | «Не получилось загрузить карточки.» and the small «Повторить» | none; the retry reads the link or the account again |
| a failed write | not applicable; «Ссылка на набор» keeps today's clipboard toasts | none |
| conflict: the list owner edits the list, or the author the item, while the sheet is open | the sheet stays as it was read (named: a sheet does not follow; the views open with `watch: false` and no re-read, plan-B9.1-1) | none; a reload reads again |
| the link is deleted while the sheet is open | the sheet stays as it was read (no topic); a reload draws the gone print page | none |
| the view hand-over: `#/s/` closes the view after the print page opened it, or a print-to-print navigation | the effect re-opens the view or closes it (3.4) | none |
| an entry the address names left the list | its card is dropped, as an unknown id today; all dropped: «Печатать нечего» | none |
| the link was deleted, or the list | the gone print page, the address kept | none |
| the item was deleted (`#/print/h/`; a linked foreign item on an own list) | the not-found print page; on `#/print/<ids>` the key drops after the account read | none |
| the item went while `#/h/` was open | R7h's «Предмет не найден», announced once (3.6) | none |
| the link went while `#/s/` was open | today's gone page, announced once (D65) | none |
| a stale tab (the previous bundle) | `#/print/s/` and `#/print/h/` are unreadable there: the home section | none; a reload loads the new bundle |
| revert: the previous frontend | as the stale tab | none; no stored shape changes |
| `#/h/`'s 45 s re-read fails or the reader is offline | the page keeps what it shows; the next tick reads again | none |
| revert: a down migration | B9.1 has none; with `B9.0`, its reversal restores the answer without `updated_at`, and `#/h/` then draws no «Обновлено» line | none |

## 6. Consistency and RU/EN parity (B9.1)

Rules of `FEATURES.md` "Consistency rules" followed: 2 (`printLoadFailed`
is the load line), 4 (the print heading in every state), 6 (one `LoadState`
on the print routes and on `#/s/`'s first read), 7 (the print page keeps
«Печать карточек» in loading, failed, gone and not found), 14, 16 (long
names in the gone sub and on `#/h/` wrap). Not applicable: 1 (no counter),
3 and 10 (no delete), 5 (no toast except today's copy toast), 8 (no create),
9 (no management panel), 11-13 (no panel, fold or text field), 15 (no
form).

Sibling comparison: `#/s/` heads its gone and failed pages with the fact
(«Список больше не доступен», «Список не загрузился»); the print routes keep
the fixed «Печать карточек» and put the fact in the sub or the load line -
a named difference, because rule 7 binds a fixed heading; for the same
reason the failed print page uses the small «Повторить», as `#/homebrew`
does (rule 6). The author's «Печать» on `#/h/` writes `#/print/h/<uuid>`,
as the owner's on `#/s/` writes `#/print/s/`, so both can be handed on. On
the two new print kinds «Назад» falls back to the link's page, not to
`#/lists` (a named difference from `#/print/<ids>`: the reader of a
handed-over address may have no lists). The facts match
`#/s/` and R7h's `#/h/`. `#/h/`'s «Предмет обновлён» matches `#/s/`'s
«Список обновлён»; its «Обновлено N назад» line and its 45 s re-read
match `#/s/`'s (Q9-8 B and Q9-7 B remove the two named differences).
`#/s/`'s new loading line matches the account pages'.
The «Печать» verb, «Ссылка на набор» and the print bar are today's.

RU/EN: every key of 3.8 and 3.9's privacy sentence have both languages with
the same facts; no plural is new (`agoText` has its plural sets); ASCII
punctuation; «ёлочки» in RU, straight quotes in EN.

## 7. Batches, gates, cost, split criterion

### 7.1 The batch table

Costs: `context.md`, "Command costs".

| Cut | Criterion |
|---|---|
| R7h \| R9 | the owner's order (R1); R9 reads R7h's `get_homebrew_item`, item page and seed |
| no split inside R9's screens | the print routes, `#/s/`'s states and the item page share `SharedView`, the item view, the share and item seed and one golden run; nothing is a different route and filter set the harness runs apart |
| `B9.0` \| `B9.1` (only with 3.9's R2) | the schema batch rule: a migration that replaces a definer function `anon` executes stops for its review, the test push and `e2e` before a screen reads it |

| Batch | Scope | Gates (minutes) | Review |
|---|---|---|---|
| `B9.0` (only with 3.9's R2) | 3.9: the migration, its reversal, layer 3, the port and the fake, `META.md` 3 | `check` 9, `check:db` 10, `build:test` + `check:built` 2, after the approve `db:push` 1 and `e2e` 3 = 25 | plan review before (a new required line, Status); batch review required (a definer function `anon` executes) |
| `B9.1` | section 3, D65, D70, the specs, the decision file | `check` x2 18, `build:test` + `check:built` 2, `app/states` 6, `app/contracts` 8, `app/print` 4 (estimate, not measured on this host), goldens compare 13 + re-seed 3, `sweep.js 360` 8 = 62 | plan review done (fix-then-continue applied); batch review required (public contract, a changed print page) |

R9 total: about 62 minutes of gates with 3.9's R1 (recommended), or about
87 with R2, plus a 10-minute closeout and the reviews. Q9-7 B and Q9-8 B's
line add no gate to B9.1 (the same runs; the `#/h/` goldens re-seed in the
same pass). Bundle: about +2 kB, under the 300 kB ceiling; the batch raises
the passed budget to the measured size plus about 5 kB.

### 7.2 `B9.1` - the print routes, the print wait, the item page and the shared page (implement-ready)

Objective: a homebrew item of another account prints from an address that
survives a reload; no print or shared page flashes an empty state while it
reads; a reader gets «Печать» on `#/h/`; `#/h/` re-reads every 45 s and
draws «Обновлено N назад»; `#/h/` and `#/s/` announce what changes while
they are open.

In scope: section 3 except 3.9's database half (R7h B7h.3 with R1, or
`B9.0` with R2); 3.8's second table only for a detail B7h.4 shipped
without; D65, D70; the specs, the contracts and one decision file.
Out of scope: any database change; R7h's pages beyond 3.6; the change log;
`#/print/<ids>`'s grammar; print snapshots (a later release, section 10).

Files to edit (R7h names per 3.0): `app/src/lib/hash.ts`,
`lib/hash.test.ts`, `state/app.svelte.ts` (`printHref`, `printWait`, the
route kinds wherever `kind === 'print'` is read - search
`git grep -n "'print'" -- app/src`), `state/app.test.ts`, `App.svelte`,
`components/PrintPage.svelte`, `printPage.test.ts`, `PickRow.svelte`,
`SelBar.svelte` and its test, `SharedListPage.svelte`,
`sharedListPage.test.ts`, `state/sharedView.svelte.ts` and its test (the
`watch` option, plan-B9.1-1), R7h's item view if it needs the same option
(3.0), `ItemPage.svelte` and its test, `lib/dict.ts`,
`tests/app/inventory.js` and the goldens of section 4,
`docs/fixtures/urls/routes.json`, `tests/contracts.js` (a check that
`llms.txt`, `CONTRACTS.md` and `ROUTES.md` each name `#/print/s/<token>`
and `#/print/h/<uuid>`, plan-B9.1-2), `tests/app/print.js` (only if it
names its routes), `llms.txt`, `docs/specs/ROUTES.md` ("Records, lists and
print"), `CONTRACTS.md` (section 1), `FEATURES.md` ("Print", "Account and
browser lists", "Records" or wherever R7h describes `#/h/`: the 45 s
re-read and «Обновлено N назад»), `STATE.md` (the re-read cadence paragraph
names the item page; the `sharedView` row, which the print page now also
opens, without a topic; the `dhloot.auth.return` action only if B7h.4
shipped without Q9-9 (a); plan-B9.1-7), the privacy pages
(`pages/src/privacy.html`, `pages/src/en/privacy.html`) only if the release
that adds `updated_at` (3.9) did not carry 3.9's sentence, `COVERAGE.md`
(only if it names the files),
`DEBT.md` (D65 and its section; D70 and the "Item links" section). New:
`docs/decisions/<date>-a-print-address-of-another-accounts-items-reads-through-a-link.md`,
then `node tools/decisions.js` for `docs/DECISIONS.md`.

Steps:

1. Refresh 3.0's names and assumptions (a)-(e) against the tree; stop and
   report if R7h's item view has no per-view index, no `refresh()` or no
   retry, or if (b) is false (3.4, 3.5 and 3.6 then need the planner);
   record (c), (d) and (e) in 3.0. Confirm that `get_homebrew_item`
   answers `updated_at` (3.9: from R7h B7h.3, or from `B9.0`); if neither
   shipped it, stop and report.
2. `lib/hash.ts` (3.2): `printSelection`, `unknownHb`, the two kinds, the
   builders. `hash.test.ts`: the round trip of each builder; a stray
   character after the token, the selection and the uuid; a stray
   character between the token and `/`; `#/print/s/<token>` with no
   selection; an empty token; an empty selection; `#/print/s` and
   `#/print/h` with no slash read as today's print of the id `s` or `h`;
   `unknownHb` true and false; every existing print case still passes
   (`toEqual` cases gain `unknownHb: false`).
3. `state/app.svelte.ts`: `printHref` (3.3) and `printWait` (3.5); the two
   kinds in each place that reads `kind === 'print'` (the window title, the
   polls, the fallback). Unit cases in `app.test.ts` for each `printHref`
   branch, the owner on `#/s/` and the author on `#/h/` included, and a
   linked foreign row card on an own list, and for each `printWait` answer.
4. `SharedView.open(token, userId, { watch })` (3.4; `sharedView` test: no
   topic joined with `watch: false`, the feed started by a later `open`
   with `watch: true`). `PrintPage.svelte` (3.4) and `App.svelte`.
   `printPage.test.ts` over the fake: `printShare` loading, ready (the axe
   and ci1 with « ×2»), gone (an unknown token; a build with no
   `sharedView`), failed and «Повторить»; `printItem` ready, not found,
   failed, and not found in a build with no sign-in; the wait as gm2
   (loading, then the linked card; failed, then the retry); «Ссылка на
   набор» for each kind; a revoke and an owner edit while `#/print/s/` is
   open leave the sheet unchanged (no topic message reaches it); «Назад»
   with no history goes to `#/s/<token>` or `#/h/<uuid>`, and the empty
   `printShare` state offers «Назад» to `#/s/<token>`; the view hand-over
   in both orders (the old page's `close()` before and after the new page's
   `open()`), each ending with the view open and `ready`; a print-to-print
   navigation (`#/print/s/A/x` to `#/print/x`) closes the view; each case
   ends with `expectNoA11yViolations`.
5. `PickRow.svelte` and `SelBar.svelte` call `app.printHref`. A SelBar case:
   on `#/s/` an `hb_` tick writes `#/print/s/...`, a catalog-only selection
   `#/print/...`.
6. `ItemPage.svelte` (3.6): the reader's «Печать», the status region,
   «Обновлено N назад», and the 45 s re-read in `#pollLists` beside
   `#refreshShared`. Tests: the href; «Предмет обновлён» once per changed
   revision; «Предмет не найден» once after a ready page loses its item;
   nothing on a first read that finds nothing; the line at just now,
   minutes and days, and no line for an answer without `updated_at`; with
   the fake clock, a re-read every 45 s signed out and signed in, no
   redraw for an unchanged answer.
7. `SharedListPage.svelte` (3.7). `sharedListPage.test.ts`: the loading
   line during the first read; D65's verification (`DEBT.md`): open
   `#/s/player-token-1` over the fake, call `shares.revoke` for its share,
   the region reads «Список больше не доступен» once; a first read of an
   unknown token announces nothing.
8. `lib/dict.ts` (3.8) in both languages.
9. Contracts: the fixtures (an example 43-character token with
   `ci1-cc1`, the same with a stray `.`, `#/print/s/<token>` with no
   selection, `#/print/s/` with an empty token, an example uuid on
   `#/print/h/`, the same with a stray `.`; each draws its gone or
   not-found print page with the address kept); `tests/contracts.js` (the
   check of the files list); `ROUTES.md` (the two rows of 3.1 and one
   sentence under the print paragraph: only the app writes `#/print/s/`;
   `#/print/h/<uuid>` is `#/h/<uuid>`'s print; and two paragraphs updated,
   plan-B9.1-12: "`#/print/...` reads its ids from the address" gains "a
   `#/print/s/` address resolves its ids through the link", and "Only the
   list page's print button and the shared page's selection bar ... write
   counts" says the selection bar writes them in either form);
   `CONTRACTS.md` section 1; `llms.txt` (beside `#/print/<id>-<id>-...`: an
   agent may turn a `#/h/<uuid>` address into `#/print/h/<uuid>`, and cannot
   build `#/print/s/` without the list's link).
10. Inventory and goldens: new states `#/print/s/player-token-1/<axe
    key>-ci1*2` (signed out), `#/print/s/unknown-token/ci1`,
    `#/print/h/<bedroll uuid>` (signed out), `#/print/h/<unknown uuid>`;
    the changed state `#/h/<bedroll uuid> as gm2`. Re-seed only these
    (`.claude/README.md`, goldens).
11. Specs (the files list), `DEBT.md`, the decision file (context: D70, the
    model of R7h; decision: a print address that names another account's
    item names the link it reads through; rejected: a homebrew id form
    inside `#/print/<ids>` for anybody (Q9-10 B: a grant to `anon` that
    R7h's plan review withheld, and a second id form in the most-shared
    print address), `#/print/list/<id>` (Q9-2 B: the owner's lists only),
    keeping the share view open across the print page (lost on a reload);
    consequences: the owner's later "print snapshots" release, section 10,
    may replace long addresses with a stored set).
12. Gates (7.1) in this order: `rtk npm run check` (one foreground call,
    timeout 600000); `npm run build:test`; `npm run check:built`;
    `node tests/run-all.js app/states`; `node tests/run-all.js
    app/contracts`; `node tests/run-all.js app/print`; the golden re-seed
    of step 10, then the four compare shards (`node tests/app/golden.js
    --shard=n/4`, one per call); `node tests/app/sweep.js 360`; `rtk npm
    run check` again after the last fix. The task's first commit.

Acceptance (each line closes on its own):

- `#/print/s/<token>/<ids>` prints a list's homebrew entry and catalog
  entries with their counts, signed out, after a reload (D70's
  verification); D70 deleted.
- `#/print/h/<uuid>` prints one item, signed out, with its set line.
- The print page's loading, failed (with the small retry), gone and
  not-found states, each under «Печать карточек»; `#/print/h/` in a build
  with no sign-in draws not found.
- A print sheet does not follow: a revoke or an edit while `#/print/s/` or
  `#/print/h/` is open changes nothing on it (`watch: false`, no re-read).
- The view hand-over in both orders and the print-to-print navigation
  (3.4).
- «Назад» on the two new kinds falls back to `#/s/<token>` or
  `#/h/<uuid>`; the empty `printShare` state offers «Назад» to
  `#/s/<token>`.
- `#/print/<ids>` as gm2 waits for the account read, then prints the linked
  foreign item; a failed account read shows the retry.
- `#/s/` with an `hb_` tick writes `#/print/s/...`; a catalog-only
  selection writes `#/print/...`; a `#/s/` row card's «Печать» follows the
  same rule.
- A reader's `#/h/` has «Печать» to `#/print/h/<uuid>`; the author's
  «Печать» on `#/h/` and a linked foreign row card on an own list write
  `#/print/h/<uuid>` too.
- `#/h/` announces «Предмет обновлён» and a gone item once each.
- `#/s/`'s first read shows «Загружаем...».
- D65: a live revoke on `#/s/` is announced once; D65 and its section
  deleted.
- The route contract of 3.1 with its fixtures, `tests/contracts.js`'s
  check that `llms.txt`, `CONTRACTS.md` and `ROUTES.md` name both routes,
  `ROUTES.md` (with the two updated paragraphs), `CONTRACTS.md` and
  `llms.txt` in this commit.
- The decision file and `docs/DECISIONS.md`.
- Every row of section 4 and every scenario of section 5 with its proof
  named in the handoff.
- `#/h/` re-reads every 45 s, signed out too (the call beside
  `#refreshShared`; owner's Q9-7 B); a unit test with the fake clock;
  `STATE.md`'s cadence paragraph.
- `#/h/` draws «Обновлено N назад» from the answer's `updated_at` (owner's
  Q9-8 B), for a reader and for the author; no line without the key; the
  privacy pages name the edit time (3.9) in the release that answers the
  key.
- For each detail R7h B7h.4 did not ship (owner's Q9-9 A puts all seven in
  B7h.4; none is expected here): (a) the signed-out
  prompt and the copy made after the sign-in (`dhloot.auth.return` action
  `{ do: 'saveItem', id }`, `STATE.md`), (b) «Сохранено», (c) the list-row
  note and toast, (d) the toast's «Изменить», (e) `hbNotReady`, (f) the
  relinked row keeps its position, quantity, price and both notes, (g) a
  refusal other than a limit or the network says `importRefused` - each
  its own line, with 3.8's strings.
- D71: deleted by R7h B7h.4; if it is still in `DEBT.md`, B9.1 deletes it
  with the privacy text of R7h 4.4.
- Inherited from R7h: the refresh adds each open item as its own line here;
  none known on 2026-10-07.
- Standing checks: section 4 (scale), 5 (error scenarios), 6 (consistency,
  RU/EN), each with its proof.

Verification commands: step 12.

Do not: change the database or the port; change `#/print/<ids>`'s grammar
or output; give the print page a live topic or a poll; write
`#/print/<ids>` for another account's item on `#/s/` or `#/h/`; push to
production (CI does at the release push).

### 7.3 `B9.0` - `updated_at` in the item's answer (outline; only with 3.9's R2)

Runs only if the orchestrator does not fold the key into R7h B7h.3. Before
it runs, the planner expands it and writes its required plan-review line in
Status.

- Files: `supabase/migrations/<ts>_homebrew_item_updated_at.sql`
  (`create or replace` of `get_homebrew_item` with R7h's body plus the key
  of 3.9; `security definer`, `set search_path = public, pg_temp`, the same
  grants: `revoke ... from public`, `grant ... to anon, authenticated`) and
  its reversal (R7h's body as committed); a layer 3 file or an extension of
  R7h's `homebrew-links.test.mjs` (the key equals the greatest of the
  item's, the source's and the named cards' `updated_at` after each edit;
  the forbidden keys `owner_id`, `book_id`, `created_at` stay absent;
  `revision` unchanged by the key); `ports/types.ts` (the answer type),
  `supabase.ts` and its test, `fake-cloud.ts` and its test, R7h's contract
  case R (reads the key); `META.md` section 3; `COVERAGE.md`.
- Acceptance: the up-down-up walk of `check:db`; the key over the fake
  (`npm run check`) and over the test project (`npm run e2e`, after the
  batch review approves); `anon` still executes exactly R7h's four
  functions.
- Error scenarios: a revert to R7h's body drops the key; B9.1's page then
  draws no line (section 5). No stored data changes.
- Gates: 7.1 (25 minutes).

## 8. Specs and contracts

| Batch | Specs | Contracts | Tests |
|---|---|---|---|
| `B9.0` (only with 3.9's R2) | `META.md` 3 (the item read answers the edit time), `COVERAGE.md` | none (no route; the answer gains a key) | layer 3: the key's value after an item, source and card edit, and the forbidden keys; layer 1: the port and the fake; layer 4: R7h's contract case R reads the key |
| `B9.1` | `FEATURES.md`, `ROUTES.md`, `CONTRACTS.md` 1, `COVERAGE.md` if it names files, `DEBT.md` (D65, D70), `STATE.md` (the `sharedView` row; the cadence paragraph; the auth return action only for a missing Q9-9 (a)), the privacy pages only if 3.9's sentence is missing, a decision file | the two print routes; `tests/contracts.js` | layer 1: hash, app, shared view, print page, selection bar, shared page, item page; layer 2: states, contracts, print, goldens, sweep 360 |

## 9. Owner answers

Q9-1 to Q9-5 were answered on 2026-10-02. After R7h: Q9-1 A and Q9-3 A
are R7h's «Сохранить себе»; Q9-2 A stands with the item's id (3.1); Q9-4
(where «Поделиться» sits) has no subject; Q9-5 (D65: yes) is B9.1's.

Q9-6 to Q9-10 were answered by the owner in chat on 2026-10-07 (relayed by
the orchestrator). Every question is answered; the options not taken are
kept one line each for the record. Mocks: m39 (Q9-6 to Q9-9), m37 (Q9-10);
the 2026-10-02 shapes are m30-m36.

- **Q9-6 A revocable item link: A, accept the drop.** The item's id is its
  address for as long as the item exists (owner W1-a); the share panel and
  its hint are not built. Accepted trade-off: to stop readers, the author
  deletes the item, which also removes its rows from other players' lists.
  Not taken: B (a switch «Открыт по ссылке»), C («Новая ссылка», a new id).
- **Q9-7 Live updates on `#/h/`: B, re-read `#/h/` every 45 s** (3.6), signed
  out too, beside `#/s/`'s poll; no schema, no port change. Accepted
  trade-off: about 80 reads an hour per open page, also while the tab is
  hidden, and up to 45 s of delay. Not taken: A (R7h's shown-again re-read
  only), C (a Realtime topic per item).
- **Q9-8 «Обновлено N назад» on `#/h/`: B, add it, with `updated_at` in
  `get_homebrew_item`'s answer** (3.6, 3.9). This needs a migration; where
  it is built is the orchestrator's routing (3.9: R7h B7h.3 recommended,
  else R9 `B9.0`). Accepted trade-off: the answer tells anybody with the
  address when the item was last changed (the privacy pages say so). Not
  taken: A (drop the line).
- **Q9-9 The seven «Сохранить себе» details (a)-(g): A.** They go into R7h
  B7h.4's acceptance (the orchestrator carries them to R7h); R9 keeps only
  "build what B7h.4 shipped without" (7.2). Not taken: B (built in B9.1), C
  (dropped).
- **Q9-10 The print address of a homebrew item: A, the two link-scoped
  routes in R9** (`#/print/s/<token>/<ids>`, `#/print/h/<uuid>`). The
  owner's words: "I feel like we need to do some snapshoting for prints to
  avoid limitations on URL length and amount of items there and make
  sharable link more concise, but we can do it in a separate release". That
  release is a roadmap note (section 10), not planned here. Not taken: B (a
  homebrew id form inside `#/print/<ids>`).

Decided here (low impact, recorded): the print page keeps its fixed heading
in every state (rule 7) and puts the fact in the sub; a print sheet does not
follow live changes; `#/s/`'s first read shows «Загружаем...»; the owner's
print address on `#/s/` names the link too.

## 10. Risks, assumptions, deferred

- Assumption: R7h's item view exposes a per-view index and a `refresh()`
  (3.0); step 1 stops if not.
- Risk: the shared view is closed by `#/s/`'s page and opened by the print
  page in one navigation, in either order; 3.4's effect re-opens a view the
  old page closed and closes it on a print-to-print navigation; step 4
  tests both orders.
- Risk: a foreign key on an own list collides with another foreign key of
  the same name from a third account (two authors who imported one file);
  `#/print/<ids>` prints the first, as `frozenCopy` does today. Accepted;
  the reader's list row has the same rule.
- Effect on R8 (planned after R9): the print routes read `img` from
  `get_shared_list` and `get_homebrew_item` once R8 adds it; R8's refresh
  adds the print states to its goldens. R9 writes nothing for R8.
- The roadmap rows of R9 (`issues/persistent-storage/plan.md` sections 5,
  9, 12 and 14) still describe the 2026-10-02 design; the orchestrator
  updates them at R9's closeout.
- Roadmap note (owner, 2026-10-07, Q9-10): a new later release, "print
  snapshots" (working name; not planned here, no directory): a stored print
  set with a short id, so a print address no longer carries every id - no
  URL length limit, no 180-item address cap from the address itself, and a
  shorter link to hand on. Its planner decides the storage, the route, the
  retention and what happens to `#/print/<ids>`, `#/print/s/` and
  `#/print/h/`. The orchestrator places it in the roadmap (section 5 and the
  order) when it updates R9's rows.
- Deferred (to the owner, not `DEBT.md`): one shared component for the
  visually hidden status regions (`.said`, `.lsaid`, `.rsaid` and the item
  page's): a cleanup across five components, a `debt-cleanup` candidate.
- Deferred (to the owner, not `DEBT.md`; carried from 2026-10-02,
  plan-B9.1-17): a `#/print/<ids>` address handed to another GM drops own
  items silently; a print note "N cards are not available here" would say
  so. Not in B9.1 because it is a new user-visible state and string outside
  D70, and the owner accepted the silent drop as Q9-2 A's trade-off (Q9-10
  A keeps it); `unknownHb` (3.2) makes it cheap later. A `persist-review`
  candidate.

## 11. Mocks

`issues/persist-9-item-share/mocks/index.html`:

| Mock | Screen and states |
|---|---|
| `m37-print-routes.html` | `#/print/s/<token>/<ids>` signed out (desktop), loading, failed, gone; `#/print/h/<uuid>` and not found (360 px); where the app writes each address; Q9-10 B's form (not taken) |
| `m38-shared-page-states.html` | `#/s/` first read, drawn with the region, a live revoke announced (360 px) |
| `m39-item-page-additions.html` | `#/h/` as a reader with «Печать», «Обновлено N назад», the 45 s re-read and the region (B9.1, owner's Q9-7 B and Q9-8 B); Q9-9 (a)-(e) (R7h B7h.4); Q9-6 A (taken), B and C (not taken) |
| `m30`-`m36` | the 2026-10-02 design, superseded; kept for the record of Q9-6 to Q9-9 |
