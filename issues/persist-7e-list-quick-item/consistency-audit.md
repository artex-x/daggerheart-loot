# Consistency audit of the signed-in pages (read-only)

Scope: ListsPage, ListPage and its panels, HomebrewPage, HomebrewEditor, HomebrewSources, RecordPage (own item), AccountPage, AccountMenu, SharedListPage, TablesPage and SearchPage signed-in parts. Sources: `app/src/components/*.svelte`, `app/src/lib/dict.ts`, `docs/specs/FEATURES.md`.
Paths below are relative to `app/src/` unless they start with `docs/`. Size: S small, M medium, L large.

## A. Real inconsistencies (ordered by user impact)

### 1. Counters and limits: only one page shows them (the owner's example) - M
- `components/HomebrewPage.svelte` line 63 draws «Мои предметы: 3 из 100» (`hbCount`). It repeats the page heading and sits as a loose `p.note` between the heading and the panels.
- `components/ListsPage.svelte` draws no count. Its groups «Ваш аккаунт» / «Этот браузер» carry no number. The account has a list limit (50) and an entry limit (100), see FEATURES.md 685.
- `components/HomebrewPage.svelte` group headings show a count (`<h2>{label} <span class="n">`). ListsPage group headings do not.
- `components/HomebrewSources.svelte` shows no «N из 20» for sources and no «N из 30» for sections. Those limits are visible only after a refusal (`hbSectionsFull`, `limitHbBooks`).
- `components/ListPage.svelte` sub line shows «N позиций · Сохранено», with no «из 100».
- Why it is real: the limit text appears only as an error toast (`limitLists`, `limitEntries`), so a user learns the limit at the moment it blocks them.
- Proposed rule: every page that owns a limited collection shows «N из M» in one place (the sub line or a count line under the lead), and the heading never repeats in the count. Use «Списков: N из M» / «Позиций: N из M» / «Источников: N из M».
- Blocker: lists have no limit read yet. `itemLimit` exists only for homebrew (`state/homebrew.svelte.ts` line 68, `ports/types.ts` line 486). The port needs a list-limit read, so this is M. The no-limit-known fallback is already designed: `hbCountBare`, count without «из M».

### 2. Failure wording of writes uses two verbs and two causes - S
- «Не удалось» in homebrew: `hbDeleteFailed` «Не удалось удалить - проверьте соединение и попробуйте ещё раз.», `hbCreateFailed`, `hbWriteFailed`, `hbSaveNetwork`, `quickFailed` «Не удалось создать предмет - проверьте соединение. Текст остался в форме.»
- «Не получилось» in lists, shares, account: `shareFailed` «Не получилось изменить ссылку. Проверьте сеть и попробуйте ещё раз.», `accountFailed` «Не получилось. Попробуйте ещё раз.», `cloudLoadFailed`, `hbLoadFailed` (the last one is homebrew but uses «Не получилось»).
- The cause word also differs: «проверьте соединение» (homebrew, requests, `requestNetwork`) and «Проверьте сеть» (`shareFailed`, `sharedFailedSub`).
- Proposed rule: failed read or write = «Не получилось <глагол>. Проверьте соединение и попробуйте ещё раз.» Pick one verb phrase, one cause word. Update dict RU and EN plus the quoted lines in FEATURES.md (lines 509, 531, 952, 1005, 1032).

### 3. Delete confirm wording has three endings - S
- Local list `deleteConfirm`: «...? Это действие необратимо.»
- Account list `deleteCloudConfirm`, `deleteListsConfirm`: «...Отменить удаление нельзя.»
- Homebrew item `hbDeleteItem`, `hbDeleteMany`: «...Отменить нельзя.»
- Source and section confirms (`hbDeleteSource`, `hbDeleteSection`) have no irreversibility clause at all, although a source delete moves every item and is not undoable.
- Proposed rule: one clause for every no-undo delete, «Отменить удаление нельзя.» Add it to source and section confirms. Keep «Хоумбрю» consequence sentence after it.
- Touches FEATURES.md lines 243, 568, 930, 955, 1028, which quote the strings.

### 4. The same action is named differently in two layers: «Мои списки» vs «Списки» - S
- `dict.ts` line 421: the account menu says `menuLists` «Мои списки» (EN "My lists"). The page it opens shows `t.lists` «Списки» ("Lists") in `PageHead`.
- The sibling pair is consistent: menu «Мои предметы», heading «Мои предметы».
- Proposed rule: a page opened from the account menu carries the menu label as its heading. Either rename the heading to «Мои списки» (but then the tab bar and the pin label differ, `lists` is also the nav label) or rename the menu item to «Списки» and keep «Мои предметы» as is. Recommended: change the menu item only, to «Списки». The tab label is shared, so the cost is one string pair.

### 5. Creating the same item gives two different toasts - S
- Editor create or save: `hbSaved` «Сохранено: «%s»» (`HomebrewEditor.svelte` line 286, create and update alike).
- «Свой предмет» panel on a list page: `quickAdded` «Предмет «%s» добавлен в список» (`QuickItem.svelte` line 87). It also creates the item, and never says the item exists in «Мои предметы».
- Lists and sources toast «создан» (`listCreated`, `hbSourceCreated`, `hbSectionCreated`), items do not: a new item says «Сохранено», never «создан».
- Proposed rule: a create toast says «<Что> «%s» создан(а)» and an update says «Сохранено: «%s»». The editor knows which one it did (`create()` vs `write()`). The quick panel says «Предмет «%s» создан и добавлен в список».

### 6. Sources and sections toast on create but not on delete or rename - S
- `HomebrewSources.svelte` lines 75, 102: create toasts. Lines 121-139: `removeSource`, `removeSection` show a toast only on failure. A rename shows nothing.
- `ListsPage.svelte` `delAccount` and `delPicked`: delete toasts «Список «%s» удалён» / «Удалено списков: N». Item delete toasts too (`hbDeleted`, `hbDeletedN`).
- Proposed rule: every delete toasts «<Что> «%s» удалён(а)». Add `hbSourceDeleted`, `hbSectionDeleted`. Rename can stay silent (the row redraws), as a list rename does.

### 7. Failed-read states have four shapes - M
- `HomebrewLoad.svelte`: `p.note.err role=alert` plus a default-size «Повторить». Loading is `p.note role=status`.
- `ListsPage.svelte` lines 281-285: `p.grouptext.err` (no `role`) plus a `size="sm"` «Повторить». Loading is a plain `p` with no `role=status`.
- `SharePanel.svelte` lines 131-136: a `p.state` and a `size="sm"` retry.
- `ListPage.svelte` line 901: the title says «Список не найден» and the sub says «Не получилось загрузить списки аккаунта.» A failed read looks like a missing list. `SharedListPage.svelte` has its own title «Список не загрузился» for the same case.
- `AccountPage.svelte` line 418: a `p.err role=alert` plus a `size="sm"` retry.
- Proposed rule: one `LoadState` component (text, `role=alert`/`status`, `size="sm"` retry). Use a dedicated title «Список не загрузился» on ListPage, not «не найден». The loading line says «Загружаем...» everywhere (already true).
- FEATURES.md 565 mandates only the sub text and the button, so the ListPage title is a free fix.

### 8. The editor draws a heading in the error state and none while loading - S
- `HomebrewEditor.svelte` line 581: failed read draws `PageTitle` «Мои предметы» plus the lead, then `HomebrewLoad`.
- Line 583-584: while loading it draws `HomebrewLoad` with no heading, so the page jumps when the load ends. `HomebrewPage` draws `PageTitle` first in every state.
- `RecordPage.svelte` lines 66-70 also draws `HomebrewLoad` bare, but its heading is the item name, so that is deliberate (FEATURES.md "Records" comment at line 31).
- Proposed rule: a page with a fixed heading draws it in every state. For the editor, draw `PageTitle title={t.myItems}` while loading.

### 9. Where the primary create action sits - M
- Lists: the create panel «Новый список» (field plus «Создать») is the first block under the heading (`ListsPage.svelte` line 232).
- Homebrew: «Новый предмет» (primary) sits below the count and below the whole «Источники» panel (`HomebrewPage.svelte` lines 65-70). With several sources it moves down the screen.
- Sources: a small «Добавить» (no noun) opens «Новый источник»; sections: «Добавить раздел»; items: «Новый предмет»; lists: «Создать». Four verbs for one gesture: add / new / create.
- Proposed rule: the primary create action is the first control under the lead, before any management panel; the button names the noun: «Новый предмет», «Новый источник», «Новый раздел», and the inline-field submit stays «Создать». Move the button above `HomebrewSources`; rename `hbAdd` to `hbNewSource`.

### 10. Delete is offered per row in one place and only in batch in the other - M
- `ListsPage.svelte`: every account card has its own «Удалить» plus the batch bar «Удалить (N)».
- `HomebrewPage.svelte`: rows have no delete. The only ways are tick plus «Удалить (N)», or open the editor and press «Удалить» (`HomebrewEditor.svelte` line 990).
- Proposed rule: either accept batch-only for table rows (rows here are the shared `TableRows`, which carry ticks, not actions) or add nothing and write it in the spec. Recommended: leave it, because the spec says it (FEATURES.md 928-931). Listed because the user will see the asymmetry.

### 11. Own-item delete and homebrew delete have no undo, unlike the other destructive actions - S/spec
- FEATURES.md 1306: "Toasts with an undo action for destructive things." Local list delete and entry removal have «Вернуть». Account list delete (spec 570), batch list delete (247), homebrew item delete (1028) have none, only a confirm.
- This is documented per case, so it is a deliberate difference. Still, the general line at 1306 overstates it. Proposed rule: state in the Chrome section that irreversible server deletes confirm instead of offering undo.

### 12. Panel close buttons: «Закрыть» vs «Отмена» - S
- `QuickItem.svelte` line 154: ghost «Закрыть».
- `ImportPanel.svelte` line 329 and every `NameField` in `HomebrewSources.svelte`: ghost «Отмена».
- Both are fold-away panels with fields, sitting after a primary button. FEATURES.md 503 and 255 name the two labels but give no reason.
- Proposed rule: a panel that holds typed input and discards it says «Отмена»; a panel of read-only information says «Закрыть». QuickItem keeps typed text across closes (it clears fields only after a successful add), so «Закрыть» is defensible. Equal for the task; pick «Отмена» if you want one word everywhere.

### 13. Sharing: one word, two behaviours; one name, two labels - S
- `ListsPage.svelte` browser card: «Поделиться» copies a players' link at once. `ListPage.svelte` line 980 for an account list: «Поделиться» opens a panel. Browser group is being retired (ListsPage header comment), so low priority.
- Browser list buttons say `sharePlayers` «Ссылка игрокам» / `shareGm` «Ссылка себе» (EN "Your own link"). The share panel says «Ссылка для игроков» / «Ссылка для мастера» (EN "GM's link"). «Себе» and «для мастера» name the same audience.
- Share link «Удалить ссылку» (`SharePanel.svelte` line 165) asks nothing and has no undo, while delete list asks a confirm. Spec explains it (FEATURES.md 524: "asks nothing"). The consequence is the same as deleting a list for that audience, so this is a judgement call, not a bug.
- Proposed rule: use «для игроков» / «для мастера» in both places. Drop the «себе» labels when browser lists retire.

### 14. Russian/English parity slips - S
- `removedItem`: RU «Убрано из списка: «%s»» vs EN `"%s" removed` (no "from the list"). `batchDeleted` has the full phrase in both.
- `noLists` uses an em dash (RU and EN line 320/1021) while `noCloudLists`, `hbEmpty` use a hyphen. Project rule is ASCII punctuation. The same applies to `subTables` EN (line 943, em dash).
- `noLists` says «создайте первый выше», `hbEmpty` says «создайте первый.» with the button above. Same state, two phrasings.
- Proposed rule: «<Чего> пока нет - создайте первый выше.» in both.

### 15. Retry button size and variant vary - S
- `HomebrewLoad`: default size, secondary. `ListsPage`/`SharePanel`/`AccountPage`: `size="sm"`. `ListPage` and `SharedListPage`: primary, default size (the page is otherwise empty there, so primary fits).
- Proposed rule: inside a panel or inline line use `size="sm"`; on a whole-page failure use primary. Fold into finding 7.

## B. Deliberate differences the spec explains

| Difference | Where | Spec |
|---|---|---|
| `PageTitle` on `#/homebrew`, `PageHead` (pin) on `#/lists` | `HomebrewPage.svelte` line 6 comment | FEATURES.md 935-936 ("The page cannot be pinned"), 1290-1292 (a list is never pinned) |
| ListPage, RecordPage, SharedListPage, Account, Editor use `PageTitle` | all | `PageHead` serves only the section pages (Lists, Tables, Search, Roll, Std, Alt); a list or a record is never pinned |
| The list page autosaves with a «Сохранено/Не сохранено» status; the editor has an explicit «Сохранить» | `ListPage.svelte` line 958, `HomebrewEditor.svelte` line 986 | FEATURES.md 990 (checks on save only), 1000 |
| Account page settings save on change | `AccountPage.svelte` | FEATURES.md 1269 ("each saving the account row") |
| Share link delete asks nothing, list delete asks | `SharePanel.svelte` | FEATURES.md 524 |
| Account list and homebrew delete have no «Вернуть» | `ListsPage.delAccount`, `HomebrewEditor.remove` | FEATURES.md 247, 570, 1028 |
| Own-item page shows «Изменить» but no «Удалить» | `PickRow.svelte` | FEATURES.md 479 ("«Изменить» in its modal"); delete lives in the editor, 1028 |
| Browser lists have no ticks and no batch bar | `ListsPage.svelte` line 344 | FEATURES.md 231 ("Browser cards have none") |
| Own-item state blank on RecordPage while the session or read pends | `RecordPage.svelte` line 31 | FEATURES.md "Records" (no flash of «Предмет не найден») |
| TablesPage empty homebrew state carries «Новый предмет»; HomebrewPage empty state does not | `TablesPage.svelte` line 521 | The page already has the primary button above (see finding 9); on the table it is the only way in |
| Errors inline in forms (editor, quick panel), toasts in list actions | `HomebrewEditor.svelte` line 993 vs `ListsPage.svelte` | FEATURES.md 509, 1004, 1032 |

## C. Checked and consistent (no finding)
- Batch bars: `ListsPage` and `HomebrewPage` use the same `BatchBar`, the same «Выбрать все», «Выбрано N» and `«Удалить (N)»` (`del` + count). Batch delete toasts: «Удалено списков: N» / «Удалено предметов: N».
- Single delete toasts: «Список «%s» удалён» / «Предмет «%s» удалён», same shape; the failure toast is an error toast in both.
- Toast hold: a single hold (7000 ms, `Toast.svelte`, FEATURES.md 1308), undo takes focus. No page sets its own time.
- Loading text: `cloudLoading` «Загружаем...» is the one string for lists, shares and items.
- Danger variant is used for every delete button; small size on rows and panels, default for page-level actions.
- Sign-in prompts: `SignInPrompt` with a `lead` in each place (`hbSignIn`, `hbTablesSignIn`, `signInToCreate`, `signInToSave`, `signInToOpen`), same component. The leads differ in length by design.
- `Редактировать` vs `Изменить`: only `edit` «Изменить» exists. Editor and record pages agree.
- Search/Tables signed-in parts: `hbChipHint` «Показывать свои предметы» is the same chip on both pages; `subSearchOwn` states the own count on search.

## D. Suggested order of work
1. S batch of string fixes (findings 2, 3, 4, 5, 6, 14): one dict.ts edit pair plus the spec quotes and the tests that pin them. About 1 task.
2. S/M layout fixes (8, 9, 12, 13): move «Новый предмет» above the sources panel, add the editor loading heading.
3. M shared `LoadState` (7, 15).
4. M counters (1): needs the list-limit read in the port; decide first whether lists show «N из 50» (recommended: yes, as `hbCount` does, with the same bare fallback when the limit is unknown).

## E. Not covered
- `RequestsPanel` and the add-to-list menu (`AddToList.svelte`) were read only for labels. No toast-level audit of `app.say` calls in `state/` stores (list store, cloud store) was made; the `saveFailed` and `writeRefused` toasts come from there.
- No browser run. All findings come from source and `dict.ts`.
