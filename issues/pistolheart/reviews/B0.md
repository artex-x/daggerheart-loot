# Review - B0 (pistolheart)

Verdict: fix-then-continue
Reviewed: 117672abd64aa3073bc62d1ffced26f6e8afa418
Scope: batch B0

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

The batch is uncommitted. The review reads the working tree of
`issues/pistolheart/records-draft.json` and `translation-notes.md` on top of
the HEAD above. Each fix below gives the current string and the replacement
verbatim, so a find-and-replace applies it. Where the current string occurs in
the four rungs of a line, replace it in all four.

## Blockers

1. `ph-infusions` `rud` - wrong name for the Core "Touched" cards. The cards
   exist in Core (Arcana-Touched, Blade-Touched, Bone-Touched, Codex-Touched,
   Grace-Touched, Midnight-Touched). ru.daggerheart.su names them
   «Затронутый Арканой», «Затронутый Клинком», «Затронутый Костью» (checked on
   `ru.daggerheart.su/domain-card/arcana-touched`, `blade-touched`,
   `bone-touched`). «Тронутые» does not let a reader find the cards. Corpus: 0
   hits for either form.
   - Current: `Подобно картам домена «Тронутые», персонаж должен`
   - Replace: `Подобно картам домена «Затронутый» (например, «Затронутый Арканой»), персонаж должен`

2. `ph-mounted` `rud` - the case error changes who is the exception. The
   English lists two examples of a creature with a stat block that a PC rides:
   a ranger's companion, or a druid in Beastform. The Russian puts «друиды» in
   the nominative, parallel to «персонажи». The text then reads as "druids in
   Beastform are an exception", not "PCs that ride a druid". The site term is
   Ranger Companion = «Компаньон Следопыта» (skill, rules glossary). The corpus
   capitalizes class names in running text: «Следопыта» (ci70, ci71),
   «Друид»/«Друида» (w71, w118; one lowercase in dv71).
   - Current: `например на животном спутнике следопыта, а также друиды в Звериной Форме.`
   - Replace: `например на компаньоне Следопыта или на Друиде в Звериной Форме.`

## Risks

1. `ph89` `rud` - the Russian gives the Hope to the adversary.
   «заставить его отметить ещё один Стресс и получить Надежду» puts both
   verbs under «заставить его». The book means that the PC gains the Hope,
   because adversaries have no Hope.
   - Current: `Один раз за сцену, когда вы заставляете противника отметить Стресс, вы можете заставить его отметить ещё один Стресс и получить Надежду.`
   - Replace: `Один раз за сцену, когда вы заставляете противника отметить Стресс, вы можете заставить его отметить ещё один Стресс; тогда вы получаете Надежду.`

2. `ph45`-`ph48` `rud` - "bag" is a gold unit, and the Russian loses it.
   The site conventions page gives Bag = «Мешок», and the corpus renders
   "bag of gold" as «мешка золота» (w93). The diminutive «мешочек с монетами»
   reads as any small purse, not the unit (10 handfuls).
   - Current: `Если у вас есть хотя бы один мешочек с монетами,`
   - Replace: `Если у вас есть хотя бы один мешок монет,`

3. `ph90`, `ph91` `rud` - "Once per rest" does not use the conventions term.
   The conventions page gives Per Rest = «До следующего отдыха». The corpus
   has «Один раз до следующего отдыха» 38 times (aa58 and aa59 among them) and
   «Один раз за отдых» 2 times. In `ph90`, the corpus also capitalizes the
   dice: «Кость Страха» 5 / «кость Страха» 1, «Кость/Кости Надежды» 16 /
   lowercase 0.
   - `ph90` current: `Один раз за отдых, если вы совершаете успешную атаку с Надеждой, а результат вашей кости Страха на 1 меньше результата кости Надежды, вы вместо этого получаете критический успех.`
   - `ph90` replace: `Один раз до следующего отдыха, если вы совершаете успешную атаку с Надеждой, а результат вашей Кости Страха на 1 меньше результата Кости Надежды, вы вместо этого получаете критический успех.`
   - `ph91` current: `Один раз за отдых получите особую Ячейку Брони, которую можно отметить, только если она ваша последняя Ячейка Брони.`
   - `ph91` replace: `Один раз до следующего отдыха получите особую Ячейку Брони, которую можно отметить, только если это ваша последняя Ячейка Брони.`

4. `ph65` `rud` - "moment of calm" has a site form. The SRD-side source is
   Hope & Fear: Martial Artist "Once per rest during a moment of calm" and
   Hedge "During a moment of calm". ru.daggerheart.su renders both as
   «в момент спокойствия» (`/subclass/playtest-martial-artist`,
   `/subclass/hedge`). The corpus has 0 hits for «затишь» and «спокойстви».
   - Current: `в момент затишья`
   - Replace: `в момент спокойствия`

5. `ph80` `rud` - two grammar errors, an unquoted move name and the product
   name. (a) «сквозь» takes the accusative, and «цель» is grammatically
   inanimate, so the form is «сквозь которые». (b) «достигать» takes the
   genitive: «чьей Сложности вы достигаете». (c) The corpus quotes a named move
   in guillemets: ход «Подготовка» (cm19), Предсмертный Ход «Рискнуть всем»
   (hi30). (d) For the product name, see Risk 6.
   - Current: `Когда вы совершаете Ях! (Пистолхарт, том 1, с. 7), вы можете отметить Стресс, чтобы нанести d4+4 физического урона с использованием вашего Ранга целям, сквозь которых вы проходите и чью Сложность вы достигаете.`
   - Replace: `Когда вы совершаете «Ях!» (Pistolheart, том 1, с. 7), вы можете отметить Стресс, чтобы нанести d4+4 физического урона с использованием вашего Ранга целям, сквозь которые вы проходите и чьей Сложности вы достигаете.`

6. `rusub` of all four refs - the corpus does not use Cyrillic for product
   names. `translation-notes.md` divergence 3 says that "the corpus writes
   every source name in Cyrillic". That statement is false. The Russian
   `dict.ts` keeps every product name in Latin: `srcCore: 'Core'`,
   `srcHnf: 'Hope & Fear'`, `srcArazo: "Arazo's Artifacts"`,
   `srcMwt: 'Many Worlds Tavern'`, `pageArazo`, and the Russian data-credit
   line `footBefore`. `docs/decisions/2026-10-21-source-names-follow-the-source-product.md`
   requires one product name on every badge, path, heading and card. In B1 the
   Russian source badge says "Pistolheart", so «Пистолхарт» in the ref subtitle
   breaks that rule. No corpus `ru`, `rud` or `rusub` names a product. The only
   Latin words in Russian corpus text are dice and `TR-U57-Y` (mw76). The
   "no Latin except dice and .44" check therefore needs one exception for the
   product name.
   - `ph-mounted` current: `Пистолхарт, том 1 · с. 7 · Правила` - replace: `Pistolheart, том 1 · с. 7 · Правила`
   - `ph-saddles`, `ph-infusions` current: `Пистолхарт, том 3 · с. 34 · Правила` - replace: `Pistolheart, том 3 · с. 34 · Правила`
   - `ph-most-wanted` current: `Пистолхарт, том 2 · Продажный Шериф · Свойство противника` - replace: `Pistolheart, том 2 · Продажный Шериф · Свойство противника`
   - `translation-notes.md` divergences 2 and 3: correct them to match, so
     that B1 does not inherit the false statement. B1's `volumes.ts` Russian
     volume name must use the same form ("Pistolheart, том N").

## Nits

1. `local` - `ph-mounted` `ru` and `rud`: Charge = «Рывок». In the
   widespread Russian D&D 5e terms (dnd.su), «Рывок» is the Dash action. In
   these rules Spurs is the dash (a move to Very Far range), and Charge is the
   cavalry charge through adversaries in a line. «Натиск» is the usual
   Russian word for a cavalry charge. The corpus and the site have no entry
   for either word (0 hits each), so the decision is a judgment call.
   Recommended:
   - `ru` current: `Правила верховой езды: Рывок (Ях!), Змейка, Шпоры` - replace: `Правила верховой езды: Натиск (Ях!), Змейка, Шпоры`
   - `rud` current: `  - Рывок: Совершите Бросок Силы.` - replace: `  - Натиск: Совершите Бросок Силы.`
2. `local` - `ph65` `rud`: «стволов» is slang, and `ph69` uses
   «огнестрельным оружием» for the same word "firearm". Use one term for one
   concept.
   - Current: `одного из ваших стволов` - replace: `одного вашего огнестрельного оружия`
3. `local` - `ph73` `ru`: corpus Plate = «Латы» 9 times (aa33-aa36, mw48,
   mw87) and Full Plate = «Латный Доспех» (q316). In Russian,
   «Пластинчатый доспех» is lamellar armor, a different kind.
   - Current: `Пластинчатый Доспех Бурового Червя` - replace: `Латы Бурового Червя`
4. `local` - `ph72` `ru`: corpus Leathers = «Кожаный Доспех» (mw8, mw26;
   6 hits in all).
   - Current: `Кожаное Облачение Чёрной Шляпы` - replace: `Кожаный Доспех Чёрной Шляпы`
5. `local` - `ph-saddles` `ru` and `rud`: without ё, «седла» reads as the
   genitive singular. Here ё tells the plural from the singular, and the draft
   uses ё elsewhere.
   - `ru` current: `Магические седла` - replace: `Магические сёдла`
   - `rud` current: `Эти седла подстраиваются` - replace: `Эти сёдла подстраиваются`
6. `local` - `ph79` `rud`: "to allow any allied mounts ... to fly" gives
   permission. «летели» reads as a forced effect.
   - Current: `летели вместе с вами` - replace: `могли летать вместе с вами`
7. `local` - ё inside the draft's own names. The draft writes
   «Жеребёнок», «Чёрной» and «твёрдые» with ё, but «Ружье» and «Веревке»
   with е. These are not site game terms. The corpus has «верёвки» in ci62
   and «Верёвк» 4 / «Веревк» 4 in all.
   - `ph25` current: `Жаканное Ружье` - replace: `Жаканное Ружьё`. Apply the same change to `ph26`-`ph28` (`Улучшенное`, `Продвинутое`, `Легендарное Жаканное Ружьё`).
   - `ph41` current: `Топорик на Веревке` - replace: `Топорик на Верёвке`. Apply the same change to `ph42`-`ph44`.

### Style-only notes (not blocking, take or leave)

- `ph70` `ru`: «Тонизатор» is not a standard word. The corpus uses «тоник»
  (hc58; 7 hits). Current: `Сомнительный Тонизатор` - replace: `Сомнительный Тоник`.
- `ph37`-`ph40` `rud`: «Нарезка» also means sliced food. The barrel term is
  «нарезы». Current: `***Нарезка:***` - replace: `***Нарезы:***`.
- `ph73` `rud`: «в том числе под землёй» adds the meaning "also on the
  surface". Current: `Вы можете в рамках действия перемещаться в пределах Средней дистанции сквозь землю или песок, в том числе под землёй.` - replace: `Вы можете в рамках действия перемещаться под землёй сквозь грунт или песок в пределах Средней дистанции.`
- `ph74` `rud`: word order. Current: `когда впервые атакует вас за сцену.` - replace: `когда впервые за сцену атакует вас.`
- `ph41` `ru`: Core Hatchet is «Томагавк» (q247 line). «Топорик на Верёвке»
  is still a valid description of the item, so keep it unless the
  orchestrator wants the Core word.

## Deviations

- `translation-notes.md` divergence 1 (U+2212 in `ph70`, `ph73`):
  accepted. Both PDFs print U+2212 (`pdftotext` of Vol 2 p13-14 and Vol 3
  p33-34; code point 0x2212). The corpus uses U+2212 too: «−1 к Искусности»
  in voa4_t4i and «−1 к Проворности» in f6. In the English, no other field
  changed from HEAD (checked field by field). The `ende` of each ref equals
  its `text`.
- Divergence 2 (book citation in `ph80`): accepted, with Latin
  "Pistolheart" (Risk 6). No corpus record cites a book page, so no
  precedent exists.
- Divergence 3 (Cyrillic product name): rejected (Risk 6).
- Divergences 4 and 5: accepted. All 16 rung sets agree in gender (see the
  table).
- The ref `ensub` uses " · " and "Rules", but `plan.md` writes
  "Pistolheart Vol. 1 - p. 7 - rules". Accepted: the separator and the case
  are those of all 14 corpus refs.

## Standing checks

1. Scale: not applicable - B0 changes only text in a scratch JSON file. B1 owns the table and roll states.
2. Error scenarios: not applicable - B0 has no write path or stored shape.
3. Consistency: checked - I compared the corpus counts in `data.js` (all `items`, `eq` and `refs`), the conventions page, and the site pages for Touched, moment of calm and adversary action labels. I also checked feature-label style (`***Имя:***` on all 68 `eq` records and on no other record), rung identity and ё policy. Findings: Blockers 1-2, Risks 3-4 and 6, Nits 2-5 and 7.
4. RU/EN parity: checked - a script compared, in all 93 records and 4 refs, the numbers, dice, signs (U+2212 counted as `-`), and range words (Melee, Very Close, Close, Far, Very Far). It found 0 differences. Names keep `.44`. I read the costs, counts and plurals by eye: «2 Страха», «3 Надежды», «3 Страха», «12 Стресса», «2 таких предмета». The only Latin in Russian text is dice. Russian text has no en dash, em dash or curly quotation mark. The English has no British spelling. Its only non-ASCII characters are `·` (the corpus separator) and U+2212. Mechanical defects: Blocker 2 and Risks 1-2.

Owner rules: checked - `context.md`, "Settled decisions". The rung words
Улучшенный/Продвинутый/Легендарный agree in gender in all 64 weapon records.
"Yah!" stays as printed in English and as «Ях!» in Russian, and the ref names
both moves. The infusions are item records. No other owner rule is tagged to
B0.

## Suggested next action

One fix pass on `records-draft.json` and `translation-notes.md`: Blockers
1-2, Risks 1-6 and the `local` Nits 1-7, with the strings above. The style
notes are optional. Then the orchestrator commits B0 with no second review,
re-runs the parity script, and parses the JSON.

## Checks still needed

- After the fix pass: parse the JSON, re-run the numeric and range parity
  script, and check that the rung `rud` and `ru` of each line are the same.
- B1: `node tools/desc-style.mjs --write` applies the bold cost and italic
  condition styling to the Russian. Read the result for `ph-mounted` (nested
  list) and `ph-most-wanted` ("Особо Разыскиваемый - Действие:" follows the
  site's "Name - Действие" form, as on `ru.daggerheart.su/adversary/acid-burrower`).
- B1: the "Latin script" data check needs an allowance for "Pistolheart" in
  `rusub` and `ph80` `rud`.

## Terms decided

| English | Draft | Verdict | Evidence |
|---|---|---|---|
| Yah! (move name) | «Ях!» | keep; quote as «Ях!» in `ph80` | No corpus or site form. Owner keeps the printed word. The corpus quotes move names (cm19, hi30). |
| Charge | «Рывок» | change to «Натиск» (nit, judgment) | 0 corpus and site hits. «Рывок» = Dash in Russian D&D 5e, and Spurs is the dash here. |
| Serpentine | «Змейка» | keep | 0 hits. «двигаться змейкой» is the natural Russian for weaving. |
| Spurs | «Шпоры» | keep | 0 hits. A literal noun, like the book's. |
| Product name in `rusub` and `rud` | «Пистолхарт» | change to "Pistolheart" | `dict.ts` Russian keeps all product names in Latin; decision 2026-10-21. |
| Most Wanted | «Особо Разыскиваемый» | keep | 0 corpus and site hits. «особо разыскиваемый» is used in Russian, and it keeps "most". |
| moment of calm | «в момент затишья» | change to «в момент спокойствия» | ru.daggerheart.su Martial Artist and Hedge. |
| Touched (domain cards) | «Тронутые» | change to «Затронутый ...» | ru.daggerheart.su `/domain-card/*-touched`. |
| Infusion | «Инфузия» | keep | The rules put it on items, weapons and armor, not in a drink. The corpus uses «Настой»/«настой» (8 hits) for drinks, so «Настой» would collide. |
| firearm (`ph65`) | «стволов» | change to «огнестрельного оружия» (nit) | One term: `ph69`. |
| Arcpistol | «Арк-Пистолет» | keep | The art brief says "arcane lightning pistol", and «Арк-» covers both readings. Corpus capitalizes after a hyphen (cm40 «Топор-Пила»). |
| Maverick's Shuffle | «Тасовка Маверика» | keep | The art is a card deck. Maverick is the gambler's name. Feminine rungs are correct. |
| Foal .44 Revolver | «Револьвер Жеребёнок .44» | keep | The corpus does not quote model names (only hc54 has «»). The calibre stays. |
| Tug | «Притягивание» | keep | The mechanics pull the target into Melee range. |
| Pocket Sand | «Песок в глаза» | keep | A natural idiom with the same effect. |
| Spellshot | «Чародейский выстрел» | keep | The corpus uses «Чародей» outside the class name too (q335 Enchanter's Robes). |
| Macabre | «Макабр» | keep | The noun exists in Russian. An alternative is «Пляска смерти». |
| Death's Acolyte | «Служитель Смерти» | keep | - |
| Bandit's Gunny Sack | «Рогожный Мешок Бандита» | keep | «рогожный мешок» is a real coarse sack. «Джутовый» is also correct. |
| Boreworm Plate | «Пластинчатый Доспех Бурового Червя» | change to «Латы Бурового Червя» (nit) | Corpus Plate = «Латы» (9 hits). |
| Black Hat Leathers | «Кожаное Облачение Чёрной Шляпы» | change to «Кожаный Доспех Чёрной Шляпы» (nit) | Corpus Leathers = «Кожаный Доспех» (mw8, mw26). |
| Opulent Barding | «Роскошный Конский Доспех» | keep | barding = конский доспех. |
| Preservation Saddle | «Седло Хранения» | keep | The saddle stores the mount. |
| Corrupt Sheriff | «Продажный Шериф» | keep | Title case, as the corpus adversary names (huge-green-ooze, shambling-zombie). |
| ranger | «следопыта» | change to «компаньоне Следопыта» (Blocker 2) | Site Ranger Companion = «Компаньон Следопыта». The corpus capitalizes class names. |
| Per rest | «Один раз за отдых» | change to «Один раз до следующего отдыха» | Conventions page; corpus 38 : 2. |
| Hope Die / Fear Die | «кости Страха», «кости Надежды» | capitalize | Corpus 16 : 1. |
| bag (of coins) | «мешочек с монетами» | «мешок монет» | Conventions page Bag = «Мешок»; w93. |
| Severe | «Тяжелый» | keep | Conventions page. Corpus «Тяжелый» 15 / «Тяжёлый» 5, «Тяжелого» 4 / 0. Do not impose. |
| Far | «Далекой» | keep | Corpus 83 / 0 with ё. |

Rung adjectives agree with the head noun in all 16 lines, with no wrong
line. Masculine: ph1, ph5, ph9, ph21, ph33, ph37, ph41, ph45, ph53, ph57,
ph61. Feminine: ph13, ph17, ph29, ph49. Neuter: ph25. In each line, rungs
2-4 have the same `rud` and `ende` as the head, `en` = Improved/Advanced/Legendary
+ head, and tiers 2-4.

ё counts in the draft's Russian: ё in 20 word tokens (ещё 5, Жеребёнок 4,
счёт 4, неё, её, Чёрной, дёру, землёй, твёрдые, своё). е where the corpus or
the site also uses е: Тяжелый 12, Далекой/Далекую 12. е where the draft
itself uses ё elsewhere: Ружье 4, Веревке 4, седла 2 (Nits 5 and 7). Corpus
for comparison: ещё 19 / еще 47, её 65 / ее 93, Чёрн 9 / Черн 10, Верёвк 4 /
Веревк 4.
