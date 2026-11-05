# Translation notes - Escape the Veiled Halls (vh) B0

Scope: `ru`, `rud` of 15 records and `ru` of 4 `rooms` entries in `vh-draft.json`.
Method: `daggerheart-ru-terms`; corpus phrasing from `data.js`; settled terms from `ph-translation-notes.md` and `reviews/B0-ph.md`.

## Terms used

| English | Russian | Source |
|---|---|---|
| Potion | Зелье | corpus (cc1-cc54, hc, w) |
| Major (potion) | Большое | corpus (cc25-cc30, cc43, cc44) |
| Legendary (potion) | Легендарное | ph rung term; no Legendary potion in corpus |
| Very Close / Far | Близкой / Далекой дистанции | site, corpus |
| Hit Point, Hit Point slot | Рана, Ячейка Раны | site |
| Stress, Hope, Fear | Стресс, Надежда, Страх | site |
| Experience; utilize an Experience | Опыт; используете Опыт | site; hc27 |
| Reaction Roll; Presence Reaction Roll | Бросок Реакции; Бросок Реакции Влияния | site; corpus w14, w42 |
| action roll; attack roll | Бросок Действия; Бросок Атаки | site |
| roll with Fear / with Hope | Бросок со Страхом / с Надеждой | corpus cm18, w75 |
| advantage | преимущество | site |
| spotlight move | в свой следующий ход активировать (противника) | site /rule/spotlight, /rule/gm-move; corpus hc15, dve11 |
| adversary; GM | противник; Мастер | corpus |
| downtime | во время отдыха | corpus ci1 |
| Once per long / short rest | Один раз за продолжительный / короткий отдых | corpus |
| Once per session | Один раз за сессию | corpus (cm18) |
| Help an Ally | помочь союзнику | site page `/rule/help-an-ally` |
| Relic; Charm; Horn; Specimen | Реликвия; Оберег; Рог; Образец | corpus (ci47; w78; hi13; voa4_t2e) |

## Room names

Подвал, Гардеробная, Лаборатория, Библиотека. The corpus has no room names; plain nouns, no capitals needed for a section label.

## Deliberate divergences

1. vh3: "flip this book to a random page" becomes «открыть эту книгу на случайной странице». The Russian verb «листать» does not fit one action.
2. vh1: "when you would mark your last Hit Point" becomes «когда вы должны отметить свою последнюю Рану». The conditional is kept as an obligation.
3. vh7: "cause them to mark a Stress" becomes «заставить его отметить Стресс» (same form as ph89).
4. vh12: "use their next spotlight move to attack you with any adversary" becomes «в свой следующий ход активировать любого противника ..., чтобы тот атаковал вас». The site and the corpus give the activation to the creature, and the GM activates it (/rule/spotlight, hc15).
5. vh4: "change it to a roll with Hope" becomes «превратить его в Бросок с Надеждой», as in w75.

## Doubtful choices for the reviewer

| Item | Choice | Reason |
|---|---|---|
| Resilience Charm | Оберег Стойкости | «Стойкости» is used for Potion of Stability (cc13); «Устойчивое» is a Core armor feature name |
| Awareness Potion | Зелье Внимательности | «Бдительности» is taken by hc40; «Осознанности» is a New Age word |
| Blink Potion | Зелье Мерцания | Blink is a short teleport; no corpus form |
| Radioactive Syringe | Радиоактивный Шприц | Book word kept, as the audit asks |
| Mutated Specimen | Мутировавший Образец | Corpus Specimen = Образец (voa4_t2e) |
| Music Box | Музыкальная Шкатулка | A box of this kind is «шкатулка» |
| Legendary Foresight | Легендарное Зелье Предвидения | Same rung word as the ph weapons; neuter to agree with «Зелье» |
| vh5 "If used during downtime" | во время отдыха (lowercase) | Corpus ci1; site conventions page maps Downtime to «Отдых» |
| vh2 vs vh6 | vh2 gives one use of +1; vh6 gives +1 to a chosen Experience until rest | Wording follows each English text; the two potions differ in the book |
| Room names | see above | No corpus entry |

## Checks

| Check | Result |
|---|---|
| JSON parses; 15 records; empty `ru`/`rud` | 15 records, 0 empty; 4 rooms with `ru` |
| Numeric parity (dice, numbers, signs; `+1` = `1`) | no difference in 15 records |
| Name collision with `data.js` or inside the 15 | none; rooms also clear |
| Mixed script, imperial units, en/em dashes, curly quotes, `*` | none; Latin only in d6, d12 |
| Double spaces | none |
| Preposition case (pymorphy3 scan) | 0 hits |
| English fields | unchanged (file is untracked; re-serialized with the same 1-space indent) |
