# Plan - TASK persist-7f-consistency (release R7f)

## Status

- Task status: planned (2026-10-01). `B7f.1` is planned with its exact
  text and steps; a refresh before dispatch re-reads the files after R7c
  and R7e land (both add strings and move `ListPage`/`QuickItem`).
- NEEDS_HUMAN_CONFIRMATION: no. The owner answered `F1` and `F2` on
  2026-10-01 (section 5): `F1` - «Мои списки» everywhere, the `#/lists`
  heading changes, the tab and the pin keep «Списки» until the cutoff;
  `F2` - both labels stay, with the written rule.
- Plan review: not required (no trigger fired)
- Release order (owner, 2026-10-01): R7c, R7e, R7f, R7d. R7f starts after
  R7e's closeout.
- Batches:

| Batch | Goal | Status |
|---|---|---|
| `B7f.1` | The audit's findings 1-9, 11, 12, 14, 15 | planned; refresh before dispatch |

## 1. Objective

Make the signed-in pages follow one set of rules, from the audit of
2026-10-01 (`issues/persist-7e-list-quick-item/consistency-audit.md`):
counters with their limits, one failure wording, one delete-confirm ending,
one name per page, one create toast, delete toasts for sources and
sections, one load-state component, a steady heading while loading, one
create verb, an honest undo rule, one rule for «Закрыть» and «Отмена», and
RU/EN parity with ASCII punctuation. The rules go into `FEATURES.md` as a
"Consistency rules" subsection of "Chrome", so `persist-review` can check
them later.

## 2. Findings in scope and the rule each gets

| # | Finding (audit) | Rule and change |
|---|---|---|
| 1 | Only `#/homebrew` shows a counter («Мои предметы: 3 из 100», repeating the heading); lists, entries and sources show none; a limit appears only in a refusal toast | Every limited collection shows «N <plural> из M» in one place: `#/lists` the «Ваш аккаунт» group line «3 списка из 50»; `#/lists/<id>` the sub «10 позиций из 100 · Сохранено»; `#/homebrew` «3 предмета из 100» (no «Мои предметы:» prefix); the «Источники» panel «2 источника из 20»; a source's sections fold «4 раздела из 30». With no limit known, the plural alone («3 предмета»). Limits from `my_limit()` (section 3.1) |
| 2 | Write failures say «Не удалось» in homebrew and «Не получилось» elsewhere; the cause is «соединение» or «сеть» | «Не получилось <глагол>. Проверьте соединение и попробуйте ещё раз.» for a failed read or write of the account; exact strings in 3.3 |
| 3 | Three delete-confirm endings («Это действие необратимо.», «Отменить удаление нельзя.», «Отменить нельзя.»); source and section confirms have none | Every no-undo delete confirm ends with «Отменить удаление нельзя.» / "This cannot be undone.", after its consequence sentence |
| 4 | The account menu says «Мои списки», the page it opens says «Списки» | `F1` (owner): the `#/lists` heading reads «Мои списки» / "My lists" (`menuLists`), as the menu does; the tab bar and the pinned-section label keep «Списки» until the 2026-10-26 cutoff |
| 5 | An item create toasts «Сохранено: «%s»» in the editor and «Предмет «%s» добавлен в список» in the quick panel; lists and sources toast «создан» | A create toasts «<Что> «%s» создан(а)», an update «Сохранено: «%s»»; the quick panel «Предмет «%s» создан и добавлен в список» |
| 6 | Sources and sections toast on create, not on delete | A delete toasts «Источник «%s» удалён» / «Раздел «%s» удалён»; a rename stays silent, as a list rename does |
| 7 | Failed-read states have four shapes; a failed account read on `#/lists/<id>` says «Список не найден» | One `LoadState.svelte` for every load line; `#/lists/<id>` says «Список не загрузился» on a failed read |
| 8 | The editor draws «Мои предметы» on a failed read but no heading while loading | A page with a fixed heading draws it in every state; the editor draws `PageTitle` «Мои предметы» while loading |
| 9 | Four verbs for one gesture: «Добавить» (source), «Добавить раздел», «Новый предмет», «Создать» | A button that opens a create form names the noun: «Новый источник», «Новый раздел», «Новый предмет», «Новый список» (a panel); the form's submit stays «Создать». The Sources panel stays above the items (owner) |
| 11 | `FEATURES.md` says "Toasts with an undo action for destructive things", while server deletes have none | The spec line names both kinds: a browser-side removal offers «Вернуть»; a server delete that cannot be undone asks a confirm and offers no undo |
| 12 | Panel close buttons say «Закрыть» or «Отмена» with no rule | `F2` (owner): both labels stay; «Отмена» discards what was typed, «Закрыть» folds the panel and keeps it; a control that breaks the rule changes its label |
| 14 | RU/EN parity slips and em dashes | `removedItem` EN gains "from the list"; `noLists` and `hbEmpty` read alike; em dashes become ` - ` in the strings of 3.3 |
| 15 | Retry buttons vary in size and variant | Folded into 7: `size="sm"` in a panel or a line, primary default size for a whole-page failure |

Excluded (owner): #10, #13. Not in scope: the clipboard failures
(`copyFailed`, `imgTainted`, `imgFailed`: not account reads or writes),
`docTitle`'s ` — ` (the window title separator in every golden),
`uniqueHint`, `printSub`, `printSubCompact` and the browser-list strings R10
deletes (`playersLinkCopied`, `gmLinkCopied`, the storage notice); each goes
to `persist-review`'s consistency pass.

## 3. Design

### 3.1 The limit reads (finding 1)

- `my_limit()` answers every key in `limit_defaults` for the signed-in
  user, overrides included; no migration. `ListsRead` gains `listLimit:
  number | null` and `entryLimit: number | null` (`my_limit('lists_per_owner')`,
  `my_limit('entries_per_list')`, read in `ListRepository.list()` in
  parallel with the select, as `homebrew.load` reads `itemLimit`);
  `HomebrewRead` gains `bookLimit` (`my_limit('homebrew_books_per_owner')`).
  A failed limit read answers `null`, never a failed list read.
- The fake answers its `maxLists`, `maxEntries`, `maxBooks`. Contract case
  G checks `listLimit === 50 && entryLimit === 100` on the first read; case
  M checks `bookLimit === 20`.
- The stores keep the numbers (`CloudLists.listLimit`, `.entryLimit`;
  `Homebrew.bookLimit`); a `limit` refusal's value replaces the kept number.
- One pure helper in `lib/` beside `plural`: `countOf(n, limit, forms,
  lang, t)` answers `plural(n, forms, lang)` alone when `limit` is null,
  else `t.ofLimit` with `%s` the plural and `%m` the limit.

### 3.2 `LoadState.svelte` (findings 7, 15)

- `HomebrewLoad.svelte` becomes `LoadState.svelte` (a rename and a widened
  prop list, not a second component): `failed: boolean`, `text: string`
  (the failure line), `onretry: () => void`, `page?: boolean`. Loading
  draws `p role="status"` «Загружаем...» (`cloudLoading`); failure draws
  `p role="alert"` with `text` and «Повторить», `size="sm"` secondary, or
  primary default size when `page`.
- Callers: `HomebrewPage`, `HomebrewEditor`, `RecordPage`, `TablesPage`
  (`text={t.hbLoadFailed}`, retry `app.homebrew?.load()`); `ListsPage`'s
  account group (`cloudLoadFailed`); `SharePanel` (`shareLoadFailed`);
  `AccountPage`'s failed read; `ListPage`'s failed account read (`page`,
  under the title «Список не загрузился»). `SharedListPage` keeps its page
  as it is (already the whole-page form).

### 3.3 Exact text (RU / EN; a key not listed keeps its text)

| Key | RU | EN |
|---|---|---|
| `hbDeleteFailed` | Не получилось удалить. Проверьте соединение и попробуйте ещё раз. | Could not delete. Check the connection and try again. |
| `hbCreateFailed` | Не получилось создать. Проверьте соединение и нажмите «Создать» ещё раз. | Could not create. Check the connection and press "Create" again. |
| `hbWriteFailed` | Не получилось сохранить. Проверьте соединение и попробуйте ещё раз. | Could not save. Check the connection and try again. |
| `hbSaveNetwork` | Не получилось сохранить: нет связи. Правки остались в форме - нажмите «Сохранить» ещё раз. | Could not save: no connection. Your edits are still in the form - press "Save" again. |
| `quickFailed` | Не получилось создать предмет. Проверьте соединение - текст остался в форме. | Could not create the item. Check the connection - the text stays in the form. |
| `shareFailed` | Не получилось изменить ссылку. Проверьте соединение и попробуйте ещё раз. | Could not change the link. Check the connection and try again. |
| `sharedFailedSub` | Проверьте соединение и нажмите «Повторить». | Check the connection and press "Retry". |
| `accountFailed` | Не получилось. Проверьте соединение и попробуйте ещё раз. | That did not work. Check the connection and try again. |
| `deleteConfirm` | Удалить список «%s»? Отменить удаление нельзя. | (unchanged) |
| `hbDeleteItem` | Удалить предмет «%s»? Отменить удаление нельзя. | (unchanged) |
| `hbDeleteItemInLists` | Предмет «%s» есть в %l. Удалить его и убрать из списков? Отменить удаление нельзя. | (unchanged) |
| `hbDeleteMany` | Удалить предметы (%n)? Они пропадут и из ваших списков. Отменить удаление нельзя. | (unchanged) |
| `deleteNoUndo` (new; appended after the consequence in the source and section confirms) | Отменить удаление нельзя. | This cannot be undone. |
| `hbCreated` (new; the editor's create) | Предмет «%s» создан | Item "%s" created |
| `quickAdded` | Предмет «%s» создан и добавлен в список | Item "%s" created and added to the list |
| `hbSourceDeleted` (new) | Источник «%s» удалён | Source "%s" deleted |
| `hbSectionDeleted` (new) | Раздел «%s» удалён | Section "%s" deleted |
| `listsN` (new) | %n список\|%n списка\|%n списков | %n list\|%n lists |
| `hbSourcesN` (new) | %n источник\|%n источника\|%n источников | %n source\|%n sources |
| `ofLimit` (new) | %s из %m | %s of %m |
| `hbCount`, `hbCountBare` | deleted (replaced by `countOf`) | deleted |
| `hbAdd`, `hbAddSection` | deleted; the buttons read `hbNewSource` «Новый источник» and `hbNewSection` «Новый раздел» | deleted |
| `removedItem` | (unchanged) | "%s" removed from the list |
| `noLists` | Списков пока нет - создайте первый выше. | No lists yet - create one above. |
| `hbEmpty` | Своих предметов пока нет - создайте первый выше. | No items of your own yet - create the first one above. |
| `menuLists` (`F1`; now also the `#/lists` heading) | Мои списки (unchanged) | My lists (unchanged) |
| `lists` (`F1`; the tab bar and the pin label only) | Списки (unchanged) | Lists (unchanged) |
| `close`, `cancel` (`F2`) | Закрыть / Отмена (unchanged; the rule decides which a button uses) | Close / Cancel (unchanged) |

Em dash to ` - `, both languages where the string has one, and no other
change to the text: `listEmptyHint`, `rollHint`, `movedItem`,
`repriceHint`, `guessWhy`, `subTables`, `subSearch` (`subSearch`'s number
stays: `tests/derived.js` checks it in `COUNT_BEARING_FILES`). `countOf`
lives in `lib/plural.ts` beside `plural`.

The confirm for a source reads «Удалить источник «%s»? Его 3 предмета
останутся в «Хоумбрю». Отменить удаление нельзя.» (the existing
`hbDeleteSource`, `hbSourceStayN`, then `deleteNoUndo`); a section the
same with `hbSectionStayN`.

## 4. Scope and non-goals

- In scope: section 2's findings, the files in section 6.
- Non-goals: #10, #13 (owner); any migration; a new limit; the strings
  listed out of scope in section 2; the place of «Новый предмет» (owner:
  no move).

## 5. Owner answers (2026-10-01)

`F1` = the recommended answer; `F2` = the recommended answer. Rejected:
the menu item renamed to «Списки» (`F1`); «Отмена» everywhere (`F2`).

| Id | Question | Answered (recommended) | Rejected |
|---|---|---|---|
| `F1` (#4) | The menu says «Мои списки», the page says «Списки». Which name moves? | The page heading on `#/lists` becomes «Мои списки» / "My lists" (`menuLists`), the menu stays. Reason: it is the owner's own word and pairs with «Мои предметы», and after the 2026-10-26 cutoff the page opens from the menu. Trade-off accepted: the tab bar (until the cutoff) and the pinned-section label still say «Списки». | The menu item becomes «Списки» (the audit's pick): one string pair, but the menu then mixes «Списки» and «Мои предметы». |
| `F2` (#12) | «Закрыть» on the quick panel, «Отмена» on the import panel and every name field | Keep both and write the rule in "Consistency rules": «Отмена» discards what was typed, «Закрыть» folds the panel and keeps it (the quick panel keeps its text across closes). No label changes. | «Отмена» everywhere: one word, but the quick panel would then discard its text on close, or say «Отмена» while it keeps it. |

## 6. `B7f.1` (planned; refresh before dispatch)

Objective: section 2, with the owner's `F1` and `F2`.

Files (expected): `app/src/lib/dict.ts`; `app/src/lib/plural.ts` (`countOf`) and its test; `app/src/ports/{types,supabase,fake-cloud,cloud.contract}.ts`;
`app/src/state/{cloudLists,homebrew}.svelte.ts`;
`app/src/components/{ListsPage,ListPage,HomebrewPage,HomebrewSources,HomebrewEditor,RecordPage,TablesPage,SharePanel,AccountPage,QuickItem}.svelte`;
`HomebrewLoad.svelte` renamed to `LoadState.svelte`; for `F1`
`ListsPage.svelte`'s `PageHead` title (`t.menuLists` in place of `t.lists`);
for `F2` any component whose «Закрыть» or «Отмена» breaks the rule; the component and state tests that
pin the strings; `tests/e2e/flows.mjs` (F14's «Добавить» and «Добавить
раздел»); `tests/app/inventory.js` (`why` lines and any `d.click` on a
renamed label); `docs/specs/FEATURES.md` (every quoted string, the
"Consistency rules" subsection, the undo line of #11); `COVERAGE.md`
(`LoadState`, the limit reads).

Steps (order):

1. Strings: section 3.3 in both languages; then every `FEATURES.md` quote
   of a changed string (find each by its old text).
2. Toasts and confirms: the editor's `create()` says `hbCreated`, `write()`
   `hbSaved`; `HomebrewSources` toasts `hbSourceDeleted` /
   `hbSectionDeleted` after a delete and appends `deleteNoUndo` to both
   confirms.
3. Verbs: the sources panel's «Добавить» reads `hbNewSource`, the sections
   fold's «Добавить раздел» reads `hbNewSection`; delete `hbAdd`,
   `hbAddSection`; update F14 and the inventory clicks.
4. Limits: 3.1 in the port, the real adapter, the fake, the contract cases
   G and M, the stores and `countOf`; then the five counter places of
   finding 1.
5. `LoadState.svelte`: 3.2 and its callers; `ListPage`'s failed account
   read draws `sharedFailed` «Список не загрузился» as its title.
6. The editor's `PageTitle` while loading (finding 8).
7. `F1`: `ListsPage.svelte` passes `title={t.menuLists}` to `PageHead`
   («Мои списки» / "My lists"); `t.lists` stays for the tab bar and every
   other use; where `help.ts`'s lists help or `FEATURES.md` name the page
   heading, they say «Мои списки». `F2`: list every call site of `t.close` and `t.cancel`
   (`git grep -n -E "t.(close|cancel)" -- app/src/components`); a
   button that discards typed text reads «Отмена», one that folds and
   keeps it reads «Закрыть»; read-only panels and dialogs keep «Закрыть»;
   change only a button that breaks the rule and name each in the handoff
   (expected none: the quick panel keeps its text, the import panel and the
   name fields discard theirs).
8. `FEATURES.md` "Chrome": a "Consistency rules" subsection with one line
   per rule of section 2 (counters, failure wording, confirm ending, page
   name, create and delete toasts, the load state, the steady heading, the
   create verb, the undo rule, «Закрыть»/«Отмена», punctuation); the undo
   line of #11 rewritten.
9. The strings R7c and R7e added (card and set confirms and toasts, the
   add row's texts): apply the same rules.
10. Gates, in order; stage by path.

Acceptance (known now):

- Each row of section 2 holds on screen, in both languages; each changed
  string is pinned by the test that pinned the old one.
- `my_limit()` is the only limit source: `ListsRead` and `HomebrewRead`
  carry `listLimit`, `entryLimit`, `bookLimit`; cases G and M pass on the
  fake and against the test project (`npm run e2e`); a failed limit read
  draws the bare count.
- `git grep -n -E "Не удалось|Проверьте сеть|Отменить нельзя\\.|необратимо" -- app/src/lib/dict.ts`
  finds only the clipboard strings (`copyFailed`, `imgTainted`, `imgFailed`)
  and the browser storage line R10 deletes.
- `git grep -n -w -E "hbAdd|hbAddSection|hbCount|hbCountBare|HomebrewLoad" -- app/src tests`
  finds nothing.
- Every load line of section 3.2 is a `LoadState`; axe passes on each
  failed and loading state (`a11y.test.ts`).
- `FEATURES.md` holds the "Consistency rules" subsection and no quote of an
  old string.
- `F1`: `#/lists` reads «Мои списки» / "My lists" as its heading, the
  account menu item reads the same; the tab bar and the pin label still
  read «Списки» / "Lists".
- `F2`: "Consistency rules" states the «Отмена»/«Закрыть» rule; every
  `t.close` and `t.cancel` button follows it (the handoff lists the call
  sites checked and any label changed).
- The golden compare (all four shards) moves only states that draw a
  changed string, a counter, a load line or a renamed button; the re-seed
  follows with the reason in the handoff; `sweep.js 360` is clean (the
  counters at 360 px).
- The bundle budget: the unconfigured figure is recorded; the budget rises
  only if the build passes it.

Gates (estimate):

```text
rtk npm run check                       (8 min; twice with a fix cycle: 16)
npm run check:built                     (2 min)
node tests/run-all.js app/states        (5 min)
node tests/app/golden.js --shard=n/4    (n = 1-4: compare 13 min, then --update 13 min)
node tests/app/sweep.js 360             (8 min)
npm run e2e                             (3 min; cases G and M and F14, no migration)
```

About 60 minutes plus a closeout of about 10. Review: required after the
batch (changed UI). Plan review: not required (no migration, no public
contract - `dict.ts` strings and `FEATURES.md` are behaviour, not
`CONTRACTS.md`; no stored key; the limit read is a read, not a write or
sync protocol).

Split criterion: none - one batch. Every finding touches the same pages,
the same `dict.ts` and the same goldens; two batches would compare and
re-seed the same four shards twice (about 26 more minutes) for no new
proof. Fallback: if the review cannot hold the batch in one pass, the limit
reads and counters (finding 1, step 4) become `B7f.2` (criterion: a review
that cannot be held in one pass).

Risks and do-nots:

- `my_limit()` raises 22023 for an unknown key: use the exact key names of
  `limit_defaults`.
- Change no text outside section 3.3 and the em-dash list; `docTitle`
  moves every golden.
- A renamed button breaks a by-name click in `inventory.js`, `states.js`
  or `flows.mjs`: search each old label before the run.
- Stage by path.

## 7. Deferred

- To `persist-review`'s consistency pass (owner, 2026-10-01): the
  clipboard failure strings, `docTitle`'s separator, `uniqueHint`,
  `printSub`, `printSubCompact`, and anything the audit did not cover
  (its section E: `RequestsPanel` and `AddToList` toasts, the `state/`
  stores' `app.say` calls).
