# Hand-test import files

This directory holds the `homebrew-v1` contract fixtures, and the table
below is the hand test the owner runs with them on the deployed site after a
release that changes the import. Each file is canonical JSON, and the tests
hold each one to the expected result (`app/src/lib/homebrewFile.test.ts`,
`app/src/lib/bundle.test.ts`, `app/src/components/importPanel.test.ts`,
`tests/contracts.js`).

## Prerequisites

- Sign in on the deployed site.
- A `homebrew-v1` file loads on `#/homebrew`: «Импорт предметов», then
  «Выбрать файл...».
- A lists file (`../import/`) loads on `#/lists`: «Новый список», then
  «Импорт из файла».
- Every catalog id in the files was checked against `data.json` on
  2026-10-02: `ci1` «Первоклассный Спальный Мешок», `dv34` «Одеяло от
  Призраков», `f37` «Револьвер» (a weapon, the line `f37`), the rule card
  `enrapture` «Очарование».

## Files and expected results

| File | What to do | Expected result |
|---|---|---|
| `example.json` (the `llms.txt` example: «Мастерская Ольхи» with «Пистоли» and «Холодное оружие», a set card «Тлеющая пара», a rule card «Перезарядка», two pistols in a new line, a bedroll with no source made from `ci1` and `dv34`) | Import into an account that does not hold it. | Preview «Источников: 1, разделов: 2, карт: 2, предметов: 3.», rows «Мастерская Ольхи» - «Новый источник «Мастерская Ольхи»» and «Без источника» - «В «Хоумбрю»»; toast «Импортировано предметов: 3, новых источников: 1, новых карт: 2»; `#/homebrew` shows «Мастерская Ольхи · Пистоли» (2) and «Хоумбрю» (1). |
| `example.json` again | Import with the default «Пропустить». | «Предметов и карт, которые уже есть в аккаунте: 5.», the row note «Ключ источника совпал с вашим...»; toast «Импортировано предметов: 0, пропущено: 5»; nothing changes. |
| `example-edited.json` (the keys of `example.json`, every held object with a new name or text, two new items) | Choose «Обновить», confirm. | Toast «Импортировано предметов: 2, обновлено: 5»; the pistols show the new names; a list that refers to a pistol shows the new text at once. With «Пропустить» instead: «Импортировано предметов: 2, пропущено: 5». |
| `no-book.json` (three items and a rule card with no `book`) | Choose «+ Новый источник...» on «Без источника», type «Находки», import. | Only the «Без источника» row is drawn; a new source «Находки» holds the three items and the card. An empty name reads «Введите название источника.»; «Хоумбрю» reads «Источник «Хоумбрю» уже есть.». |
| `bedrolls.json` («Привал у костра» with «Спальные мешки» and «Снаряжение лагеря»; both languages everywhere) | Import into an account that does not hold it; open the cards and the editor. | 6 items, 2 cards, 1 source. «Скатка путника» is made from `ci1` and upgrades into «Скатка следопыта», which upgrades into «Скатка стража»; `#/i/ci1` shows «Улучшается до: Скатка путника (HB)». «Скатка следопыта», «Подушка из мха» and «Походный плед» show the set «Сон под звёздами» with its bonus. «Скатка путника» and «Скатка стража» show the rule card «Привал»; «Подушка из мха» shows the catalog card «Очарование» too. The editor's «Связи» of «Скатка путника» holds «Получается из: Первоклассный Спальный Мешок», «Улучшается до: Скатка следопыта», «Карты правил: Привал». |
| `lines.json` («Ясеневый лук» tiers 1-4 in its own line; «Револьвер с гравировкой» tier 2 in the catalog line `f37`) | Import; open a bow and `#/i/f37`. | Each bow's card draws the ladder 1-4; the editor of the tier-1 bow reads «Новая линия», the others «В линии»; `#/i/f37`'s ladder holds «Револьвер с гравировкой (HB)» as a second tier-2 rung. |
| `line-mixed.json` (a valid ring and an armour «Кираса-револьвер» with `eq.line` `f37`, a weapon line) | Import. | Refused, nothing imported: «Предмет 2, «Кираса-револьвер»: eq.line - в этой линии снаряжение другого типа» with the path `items[1].eq.line`. |
| `crlf.json` (descriptions written with `\r\n`) | Import. | Imports; each description shows its line breaks; the editor saves it again with no error (no `\r` stored). |
| `errors.json` (three errors: `eq.dmg` `2d8`, an item with no name, an item with 4 `refs`) | Import. | Refused: «В файле ошибки - ничего не импортировано...» and three lines, each with its object («Предмет 3, «Мушкет»»), its text and its path (`items[2].eq.dmg`, `items[6]`, `items[11].refs`). |
| `nbsp-name.json` (an item whose only name is U+00A0) | Import. | Refused: «Предмет 1: нет названия - нужен en или ru» with `items[0]`. |
| `wrong-version.json` (`"version": 2`) | Import. | One line: «Файл предметов версии 2: сайт читает версию 1.». |
| `bad-section.json` (an item whose `section` is not a section of its source) | Import. | Refused: «Предмет 1, «...»: раздела «hb_...» нет в источнике предмета» with `items[0].section`. |
| `over-limit.json` (101 items with no source) | Import into an account at the default item limit with no items. | Preview «предметов: 101»; the press toasts «Достигнут предел своих предметов: 100. Нужно больше - напишите на daggerheart.loot@gmail.com.»; nothing imported; the preview stays. An account with a raised limit imports them: delete them with «Выбрать все» and «Удалить». |
| `same-names.json` (two items with new keys and the names of the two pistols of `example.json`, one new item) | Import after `example.json`. | The preview counts nothing held and shows «Предметов с таким же названием уже есть: 2 - они добавятся ещё раз»; the toast «Импортировано предметов: 3»; `#/homebrew` shows each pistol name twice. |
| [`../import/example-v2.json`](../import/example-v2.json) (a list «Лавка Ольхи»: `ci1`, the pistol `hb_flintlockpistola` with its snapshot, a frozen «Лампа странника» of another author) | Import on `#/lists` after `example.json`. | One list: `ci1`, the pistol as a live reference (rename it in the editor and the list shows the new name), the lamp as a frozen copy; no copy line in the preview. In an account without `example.json` the preview reads «Своих предметов, которых нет в аккаунте: 2 - они сохранятся копиями...» and both import as frozen copies. |
| [`../import/errors-v2.json`](../import/errors-v2.json) (a version 2 list with a homebrew entry whose `snapshot` is not a valid copy, and one whose `id` is not a key) | Import on `#/lists`. | Refused: «В файле ошибки - ничего не импортировано...», the list's block with two lines: «snapshot: не копия предмета - сверьте поля с описанием в llms.txt» and «id «...»: не ключ своего предмета - hb_ и 16 знаков a-z, 2-7», each with its path. |
| [`../import/v3.json`](../import/v3.json) (`"version": 3`) | Import on `#/lists`. | One line: «Неизвестная версия формата: 3. Приложение читает версии 1 и 2.». |
| [`../import/bedroll-shop.json`](../import/bedroll-shop.json) (a version 2 list «Лавка спальников» with `ci1` and the six items of `bedrolls.json`, each with its snapshot, quantities and prices) | Import on `#/lists` after `bedrolls.json`; then, in an account without it, import it alone. | After `bedrolls.json`: one list with `ci1` and six live references (an edit of «Скатка путника» shows in the list at once), no copy line. Alone: the preview reads «Своих предметов, которых нет в аккаунте: 6 - они сохранятся копиями...» and the six import as frozen copies with their source, set and rule cards. |

## Checks with no file of their own

1. After `example.json`, tick the two pistols, press «Переместить (2)»,
   choose «Источник» «Мастерская Ольхи» and «Раздел» «Холодное оружие», and
   press «Переместить». Expected: «Перемещено предметов: 2».
2. Press «Скачать JSON» on the «Мастерская Ольхи» row. Expected: the file
   «Мастерская Ольхи.json»; importing it back skips everything.
3. Press «Скачать мои данные (ZIP)» on `#/account`. Expected: a zip with
   `lists.json` and `homebrew.json`; the zip on «Импорт предметов» skips
   everything.
4. In a second account, load the zip on «Импорт предметов», then on
   «Импорт из файла». Expected: the items, the source, and the list with a
   live reference.
