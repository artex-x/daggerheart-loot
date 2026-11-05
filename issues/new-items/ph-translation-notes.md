# Translation notes - pistolheart B0

Scope: `ru`, `rud` of 93 records and `en`, `ensub`, `ende`, `ru`, `rusub`, `rud`, `url` of 4 refs
in `records-draft.json`. Method: `daggerheart-ru-terms`, corpus phrasing from `data.js`.

## Terms used

| English | Russian | Source |
|---|---|---|
| Severe / Major damage | Тяжелый / Ощутимый урон | site |
| Melee / Very Close / Close / Far / Very Far | Вплотную / Близкой / Средней / Далекой / Очень Далекой | site, corpus |
| Hit Point, Armor Slot, Stress, Hope, Fear | Рана, Ячейка Брони, Стресс, Надежда, Страх | site |
| Spellcast Roll, Presence Roll | Бросок Заклинания, Бросок Влияния | site, corpus |
| Vulnerable, tier | Уязвим(ой), Ранг | site |
| Beastform | Звериная Форма | site |
| GM | Мастер | corpus |
| PC | персонаж | corpus |
| mount | скакун | corpus (cm8, cm75) |
| loadout, vault | Рука, Хранилище | corpus |
| handful of gold | горсть золота | corpus (hc32) |
| Per rest; Hope Die, Fear Die | Один раз до следующего отдыха; Кость Надежды, Кость Страха | site, corpus |
| bag of coins; moment of calm | мешок монет; в момент спокойствия | site, w93 |
| Touched; Ranger Companion | Затронутый Арканой; Компаньон Следопыта | site |
| Plate, Leathers | Латы, Кожаный Доспех | corpus |
| Infusion domains | Арканы, Клинка, Кости, Кодекса, Грации, Полночи, Мудрости, Величия, Доблести | site |

## Deliberate divergences

1. Typography: `-1` in ph70 and ph73 changed to U+2212 in `ende` and `rud`. Nothing else in `ende` changed.
2. ph80 keeps the book citation "(PHv1, pg7)" as «(Pistolheart, том 1, с. 7)».
3. `rusub` and ph80 write "Pistolheart" in Latin. `dict.ts` keeps all product names Latin (decision 2026-10-21).
4. The ref `ph-mounted` renders the book word Charge as «Натиск» and keeps «Ях!» in the title and in ph80.
5. Weapon rung names: Улучшенный/Продвинутый/Легендарный agree with the gender of the head noun
   (Улучшенная Винтовка с Прицелом, Улучшенное Жаканное Ружье, Улучшенная Тасовка Маверика).

## Doubtful choices for the reviewer

| Item | Choice | Reason |
|---|---|---|
| Most Wanted | Особо Разыскиваемый | Not on the site, not in the corpus |
| Infusion | Инфузия | Not on the site; «Настой» is an alternative |
| Charge, Serpentine, Spurs | Натиск, Змейка, Шпоры | No corpus entry; «Рывок» is Dash in D&D 5e |
| Other names | see the records | Warbringer, Boreworm Plate, Barding, Gunny Sack, Preservation Saddle: descriptive, read by the reviewer |
| Yah! | Ях! | No corpus form |
| firearm | огнестрельное оружие; ph65 uses the same term | One term for one concept |
| Corrupt Sheriff | Продажный Шериф | No corpus entry |
| Arcpistol | Арк-Пистолет | Coined word, "Arc" is unclear (arcane or electric arc) |
| Maverick's Shuffle | Тасовка Маверика | Maverick as a proper name; the item may be a card deck |
| Foal .44 Revolver | Револьвер Жеребёнок .44 | Foal translated; calibre kept |
| Macabre, Death's Acolyte | Макабр, Служитель Смерти | Feature names, no corpus form |

Corpus mixes «Тяжелый» and «Тяжёлый» (12 to 5 in favor of «е»). This batch uses «е» in game terms, like the site.

## Source defects kept

- ph80 "using your tier" after "d4+4" is unclear in English: rendered literally.
- ph80 "Yah!" names the Charge move of Volume 1.

## Checks

| Check | Result |
|---|---|
| JSON parses; 93 records; empty `ru`/`rud` | 93 records, 0 empty |
| 16 weapon lines, 4 rungs, one shared `rud` | 16 lines, all equal |
| Name collision with the existing corpus or inside the 93 | none |
| Numeric parity (dice, numbers, signs; `−` treated as `-`) | no difference in 93 records and 4 refs |
| Mixed script, imperial units, en/em dashes, curly quotes, stray bold | none |
| Double spaces | only the nested list indent in `ph-mounted` (from the English) |
| Preposition case (pymorphy3) | 2 hits, both false: «на ходу» (ph-mounted), «бах бах» (ph33 name repeat) |
| Latin letters left in Russian fields | dice letters, ".44" and "Pistolheart" only |
