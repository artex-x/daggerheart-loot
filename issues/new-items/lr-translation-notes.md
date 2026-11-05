# Translation notes - lr B0

Scope: `ru`, `rud` of 26 records and `en`, `ensub`, `ende`, `ru`, `rusub`, `rud`, `url` of 3 refs
in `lr-draft.json`. Method: `daggerheart-ru-terms`, corpus phrasing from `data.js`,
settled terms from `ph-translation-notes.md` and `reviews/B0-ph.md`. The fix pass applied `reviews/B0-lr.md`.

## Terms used

| English | Russian | Source |
|---|---|---|
| Melee / Very Close / Close / Far / Very Far | Вплотную / Близкой / Средней / Далекой / Очень Далекой | site |
| Hit Point, Stress, Hope, Fear, Armor Slot | Рана, Стресс, Надежда, Страх, Ячейка Брони | site |
| Armor Score; primary weapon | Показатель Брони; основное оружие | corpus (w22, f26) |
| Double Duty; within Melee range | Двойная Служба; по целям Вплотную к вам | corpus (q260, q271) |
| Reaction Roll (Difficulty 12) | Бросок Реакции Проворности (12) | corpus form "(N)" |
| Countdown | Отсчёт | site, corpus (w19) |
| Downtime Project | Ход Отдыха «Работа над Проектом» | corpus (mw106) |
| Prepare (downtime move) | Ход Отдыха «Подготовка» | corpus (cm19) |
| once per Session; once per Long Rest | Один раз за сессию; Один раз за продолжительный отдых | corpus 62 : 5 |
| Action / Reaction / Rest Move | - Действие / - Реакция / - Ход Отдыха | adversary pattern |
| Passive | - Пассивно | site 20 : 3; corpus refs 3 : 2 |
| Vulnerable; Restrained | Уязвим; Обездвижен (instrumental after стать: Уязвимым) | site, corpus |
| Impaired | Ослаблен (Ослабленным after стать) | no collision |
| Shambling Zombie; Ooze; Undead | Бредущий Зомби; Слизь; нежить | corpus |
| Silver (Bags); Copper (Handful) | мешки серебра; горсть меди | site, corpus |
| Mood level Dying | «Умирающее», nominative in quotes | agrees with Настроение |
| Bastion Bitter | Биттер Бастиона | "bitter" is a beer style |

## Names

| English | Russian | Kind |
|---|---|---|
| Saint Bungus; Blazing Barrel | Святой Бунгус; Пылающая Бочка | transliteration; translation |
| Doppelcrock; Peryton | Доппелькрок; Перитон | transliteration |
| Last Round Table; Last Round | Последний Круглый Стол; Последний Круг | translation (item names) |
| Anklebiter, Alewife Almanac | Лодыжкогрыз, Альманах Пивоварихи | translation |

## Deliberate divergences

1. lr4: the book says "social roles"; the Russian says «социальным броскам». A literal «ролям» states no rule. Report the typo.
2. Units, no `~` (the corpus has none): 10lb -> «примерно по 4,5 кг»; 1lb -> «Примерно 0,5 кг» and «за каждые 0,5 кг» (the price is per pound, lr21); 1 mile -> 1 км (as ci2); 100 miles -> 160 км (as voa2_t4g).
3. lr8: "1 Long Rest Downtime Move" -> «за один Ход Отдыха во время продолжительного отдыха». The digit becomes a word. The cost rule reads «число мешков серебра, равное рейтингу рецепта».
4. lr15 "unsettingly" (book typo) is rendered «тревожно».
5. `rusub` writes "The Last Round Table" in Latin (product name, decision 2026-10-21). Item names and text use «Последний Круглый Стол».
6. "Difficulty N" becomes the corpus form "(N)" in Reaction Rolls; in lr15 and lr-recipes "Difficulty 10 + ..." is a formula and keeps «Сложность».
7. lr-recipes: "Rating" -> «Рейтинг»; table cells translated one by one, `|` structure kept.
8. lr-deed: both Mood lists use nouns (parallel); a quoted level name stays nominative.

## Reviewer verdicts on the doubtful choices

All kept: Sitizens «мебельчане», Anklebiter «Лодыжкогрыз» (masculine), Longfire «Долгого Огня»,
Slime «Желе», Heavy Drinker, Pumped Up, Retail Therapy, Freshmaker, Stalker's Stance, Stairwell Entrance
«Лестничный Вход», Noggin' Boots «Хмельные Сапоги», Alewife «Пивовариха», Way Hay «Эгей».
Open style options (owner may take or leave): «Йо-Хо-Хо» for Way Hay; «Бремя Доказывания»; «Неиссякаемый Подарок».

## Source defects

- The audit lists "Almenac" (lr2) and "an Difficulty" (lr19) as typos. The draft already reads "Almanac" and "a Difficulty 12"; nothing to carry.
- lr-recipes "The GM rolls a D20 if it's lower": ambiguous; rendered literally «если результат ниже».
- lr20 and lr-fruitcake: the card ends with "the following results:" and the list is in the ref; kept.

## Checks (after the fix pass)

| Check | Result |
|---|---|
| JSON parses; 26 records; 3 refs; empty `ru`/`rud` | 26, 3, 0 empty |
| Numeric parity | 0 unexplained; lr8 digit to word; lr20 10lb -> 4,5; lr21 1lb -> 0,5 twice; recipes 1 mile -> 1 км; deed 100 miles -> 160 |
| Mixed script | Latin only in dice and `rusub` product name |
| Old strings «Двойная Работа», «недаром», «~» | none |
