# Review - B0-lr (new-items)

Verdict: fix-then-continue
Reviewed: 8a88092ebdbd3d2adefc2b9da4724a2cf4824d72
Scope: batch B0-lr

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

The batch is uncommitted. `lr-draft.json`, `lr-audit.md` and
`lr-translation-notes.md` are untracked, so HEAD does not hold the draft (see
Deviations). The review reads the working tree. Each fix gives the current
string and the replacement verbatim, so a find-and-replace applies it.

The `daggerheart-ru-terms` skill is not on this host (no skill file under
`~/.claude` or the repository, and no skill tool). The review follows its check
order as the dispatch states it: terminology, mechanical meaning, grammar,
naturalness, typography. Terms come from the corpus (`data.js`, measured
2026-11-05) and from ru.daggerheart.su.

No blocker: every number, die, range, cost and use limit of the English is in
the Russian, and no Russian sentence changes a mechanic.

## Blockers

None.

## Risks

1. `lr3` `rud` - Double Duty is a Core feature with a fixed Russian name and
   a fixed range phrase. The corpus has the same English line on the Spiked
   Shield (`q260`) and the Segmented Staff (`q271`), with +1 instead of +2:
   `***Двойная Служба:*** +1 к Показателю Брони; +1 к урону основного оружия по целям Вплотную к вам`.
   «Двойная Работа» does not let a reader find the Core feature. The phrase
   «на дистанции Вплотную» has 0 corpus hits; «по целям Вплотную» has 18.
   - Current: `***Двойная Работа:*** +1 к Показателю Брони; +2 к урону основного оружия на дистанции Вплотную`
   - Replace: `***Двойная Служба:*** +1 к Показателю Брони; +2 к урону основного оружия по целям Вплотную к вам`

2. `lr12` - the record names a Core stat block and does not link it. The
   corpus links the ref of every stat block that an item creates:
   `dv66` Staff of the Damned ("becomes a Shambling Zombie") has
   `refs: ["shambling-zombie"]`, and `voa4_t1b` ("revive it as a Rotted
   Zombie") has `refs: ["rotted-zombie"]`. The Paddle's zombie "acts on its
   own as a normal zombie would", so the GM needs the stat block. The ref
   `shambling-zombie` is in `LOOT.refs`.
   - Change: add `"refs": ["shambling-zombie"]` to `lr12` (after `"eq"`).

3. `lr8` `rud` - grammar error in the cost rule. «столько ..., каков» is not
   a Russian correlative pair («столько ..., сколько» is).
   - Current: `Ингредиенты каждой варки стоят столько мешков серебра, каков рейтинг рецепта.`
   - Replace: `Ингредиенты каждой варки стоят число мешков серебра, равное рейтингу рецепта.`

4. `lr24` `rud` - wrong word. «недаром» (one word) means "for a good
   reason". "At a cost" is «не даром» or «за это придётся заплатить». The
   current text says the opposite of the warning.
   - Current: `но недаром.`
   - Replace: `но за это придётся заплатить.`

## Nits

1. `local` - become + condition takes the instrumental case. The corpus has
   «становитесь *Уязвимым*» (`voa2_t3d`), «стать *Уязвимым*» (`w108`),
   «стать *Оглушённым*» (`w42`); instrumental after стать/становиться 11
   times, the short form once (`voa4_t3a`).
   - `lr-fruitcake` current: `Очистите 1d4 Стресса и станьте Уязвимы, пока не очистите это состояние другим Броском Реакции Силы.` - replace: `Очистите 1d4 Стресса и станьте Уязвимым, пока не очистите это состояние повторным Броском Реакции Силы.` («другим» can read as "a different roll"; "another" is a repeat roll.)
   - `lr-fruitcake` current: `Станьте Уязвимы до конца сцены.` - replace: `Станьте Уязвимым до конца сцены.`
   - `lr-fruitcake` current: `Отметьте 1 Стресс и станьте Ослаблены до конца сцены.` - replace: `Отметьте 1 Стресс и станьте Ослабленным до конца сцены.`
   - `lr24` current: `В конце сцены вы становитесь Уязвимы до следующего отдыха.` - replace: `В конце сцены вы становитесь Уязвимым до следующего отдыха.`
2. `local` - `lr20`, `lr21` `rud`: the corpus uses no `~` (0 hits in all
   `rud`). It rounds converted units silently (500 pounds = «230 кг» in
   `voa2_t1d`, 500 feet = «150 метров» in `w36`) or writes «примерно» (3
   hits). The second 0,5 кг in `lr21` is correct: the price is per pound, so
   «за килограмм» would halve it.
   - `lr20` current: `Встречается в буханках по ~4,5 кг,` - replace: `Встречается в буханках примерно по 4,5 кг,`
   - `lr21` current: `~0,5 кг хорошо уложенного` - replace: `Примерно 0,5 кг хорошо уложенного`
   - `lr21` current: `до 1 горсти меди за ~0,5 кг,` - replace: `до 1 горсти меди за каждые 0,5 кг,`
   - `lr-translation-notes.md` divergence 2: write the same forms.
3. `local` - `lr-deed` `rud`: a quoted level name keeps the nominative. The
   first line does this («уровня «Умирающее»»); the second declines it.
   - Current: `- Если Настроение остаётся «Умирающим» целые сутки,` - replace: `- Если Настроение остаётся на уровне «Умирающее» целые сутки,`
4. `local` - `lr-deed` `rud`: the two Mood lists are not parallel. Raising
   uses imperatives, Lowering uses nouns. The nouns are the better choice
   (imperatives for bad acts read as orders), so use them in both lists.
   - Current: `- Защитите гостей или персонал от вреда, предложите приют или помощь, мирно разрешите конфликт, щедро поделитесь едой или питьём или спойте из Сборника Гимнов в Святилище.`
   - Replace: `- Защита гостей или персонала от вреда, предложение приюта или помощи, мирное разрешение конфликта, щедрое угощение едой или питьём или песня из Сборника Гимнов в Святилище.`
5. `local` - `lr-recipes` `rud`: «Горький» is an adjective with no noun.
   "Bitter" is a beer style; Russian uses «биттер».
   - Current: `| Горький Бастиона |` - replace: `| Биттер Бастиона |`
6. `local` - `lr7` `rud`: "stained" is «в пятнах», not «потрёпанный» (worn).
   - Current: `Приземистый потрёпанный сборник гимнов,` - replace: `Приземистый, весь в пятнах сборник гимнов,`
7. `local` - `lr13` `rud`: «вызывают» means "summon". "Invoked with the
   phrase" means the phrase is spoken.
   - Current: `Когда его вызывают фразой, написанной на нём, фонарь` - replace: `Когда произносят написанную на нём фразу, фонарь`
8. `local` - `lr19` `rud`: «глубокий синий» is a calque. `lr15` renders
   "deep amber" as «Тёмно-янтарное»; use the same pattern.
   - Current: `Этот глубокий синий эль` - replace: `Этот тёмно-синий эль`
9. `local` - `lr1` `rud`: "stay animated" is «остаётся оживлённым». The same
   sentence says «оживлённых Благословением»; «живым» changes the term.
   - Current: `Лодыжкогрыз остаётся живым,` - replace: `Лодыжкогрыз остаётся оживлённым,`
10. `local` - `lr22` `rud`: the corpus writes «Вплотную к вам» for "in melee
    range" of the user (`f26`, `f69`-`f72`, `f77`-`f80`).
    - Current: `Когда противник Вплотную пытается` - replace: `Когда противник Вплотную к вам пытается`
11. `local` - `lr23` `rud`: the clause has no predicate.
    - Current: `что, честно говоря, единственная магия,` - replace: `что, честно говоря, и есть единственная магия,`
12. `local` - `lr25` `rud`: «она» can refer to «банка» or to «часть».
    - Current: `Если часть содержимого убрать из банки, она станет серой и умрёт.` - replace: `Если извлечь часть содержимого из банки, извлечённое посереет и умрёт.`
13. `local` - stale working text in `lr-draft.json` (not shipped). The top
    `note` says "English only; ru/rud are null". The `lr-deed` `note` says
    "Decision for the owner: ship the rules card as it is, or drop it"; the
    owner decided on 2026-11-05 (`context.md`, "Settled decisions"). Update
    or drop both sentences.
14. `local` - `lr-translation-notes.md` evidence: "Passive | - Пассивно |
    corpus 2 : 1" is not what the corpus shows (see the Terms table: corpus
    3 : 2, site 20 : 3). Write the measured counts.

### Style-only notes (not blocking, take or leave)

- `lr15` `rud`: the corpus puts a formula in the "(N)" form too: «Бросок
  Реакции Проворности (13 + ваш Ранг)» (`aa42`). Current: `нужно совершить Бросок Реакции Силы, Сложность которого равна 10 + число бокалов, выпитых за день.` - replace: `нужно совершить Бросок Реакции Силы (10 + число бокалов, выпитых за день).` `lr-recipes` keeps «Сложности 10 + Рейтинг рецепта», because its example names "Difficulty 14".
- `lr24` `ru` feature name: «Эгей» is acceptable. «Йо-Хо-Хо» is the Russian
  rum-and-sailors chant and keeps the shanty sense. Current: `Эгей - Реакция:` - replace: `Йо-Хо-Хо - Реакция:`.
- `lr25` `rud`: the Russian legal term is «бремя доказывания». Current: `Бремя Доказательства - Действие:` - replace: `Бремя Доказывания - Действие:`.
- `lr18` `rud`: «стеклянная склянка» repeats the material. Current: `Маленькая стеклянная склянка в латунной защитной оправе` - replace: `Маленький стеклянный флакон в латунной защитной оправе` (then `эту склянку` - `этот флакон`, `она разбивается и создаёт` - `он разбивается и создаёт`).
- `lr-recipes`: «Глоток Связанного Языка» is literal. «Наливка Заплетающегося Языка» says "tongue-tied" in Russian.
- `lr26` `rud`: «врагов-нежити» is awkward. Current: `против врагов-нежити` - replace: `против врагов из числа нежити`.
- `lr21` `rud`: Current: `Плотный уголь с металлическим отливом прожилок,` - replace: `Плотный уголь с прожилками металлического отлива,`.
- `lr-recipes`: "The GM rolls a D20 if it's lower" has no comparison object in English. The Russian keeps the gap. The only possible object is the Crumble Countdown: «если результат ниже значения Отсчёта Рассыпания». Keep the literal form unless the owner wants the reading.
- `lr-fruitcake` `ru` and `lr20` `rud`: «Подарок, Который Дарит Снова и Снова» is long and capitalizes function words. «Неиссякаемый Подарок» is an option; change both places or neither.

## Deviations

- The dispatch says HEAD holds `lr-draft.json`. It does not: the file is
  untracked (`git status`), and `git log --all` has no commit with an lr draft.
  Substitute baseline: the kit's
  `C:\Users\Ignat\Downloads\Last Round Table\records-draft.json`. A field-by-field
  compare shows that only `ru` and `rud` of the 26 records and the new ref
  fields differ. In each ref, `ende` equals `text` and `en` equals `title`. The
  `ende` texts match the PDF text (pages 41-44, `pdftotext -layout`), except
  the listed typo fixes and footnote markers.
- `lr-translation-notes.md` divergence 1 («социальным броскам» for the book's
  "social roles"): accepted. «ролям» states no rule.
- Divergence 2 (units): accepted with Nit 2 (no `~`).
- Divergences 3, 4, 5, 7: accepted.
- Divergence 6 ("(N)" form; «Сложность» kept in formulas): accepted. For
  `lr15`, see the style note (`aa42` puts a formula in parentheses).

## Standing checks

1. Scale: not applicable - B0-lr changes only text in a scratch JSON file. B2 owns the table, roll and print states. The longest card stays at about 590 characters in English (`lr-audit.md`).
2. Error scenarios: not applicable - B0-lr has no write path or stored shape.
3. Consistency: checked - corpus counts in `data.js` (all `items`, `eq`, `refs`) for feature suffixes, condition grammar, the "(N)" form, currency units, unit conversion, Double Duty, the zombie ref links and «Вплотную» phrasing. Site: the conventions page and 16 adversary pages for the suffix forms. Findings: Risks 1-2, Nits 1-3, 8-10, 14.
4. RU/EN parity: checked - a script compared numbers, dice and signs in all 26 records and 3 refs. Differences: `lr8` 1 to «один» (word); `lr20` 10 lb to 4,5 кг; `lr21` 1 lb to 0,5 кг twice; `lr-recipes` "a mile" to 1 км; `lr-deed` 100 miles to 160 км. No other difference. Range words (Melee, Very Close, Close, Far, Very Far) match in count in every text. The recipes table has 9 rows of 3 cells in both languages, ratings 1,2,2,3,3,4,4,5 in both. Russian text has no Latin outside dice and "The Last Round Table" in `rusub`, no en dash, em dash, ellipsis character or curly quotation mark, no double space. Every word with ё is written with ё in all its uses in the draft. No `ru` name collides with `data.js` or with another lr name; no `en` name collides. Mechanical defects: none; Risk 4 is a wrong word in a non-mechanical clause.

Owner rules: checked - `context.md`, "Settled decisions", lr, 2026-11-05. The Fruitcake and the Deed are a card plus a rules card: `lr6` has `refs: ["lr-deed"]`, `lr20` has `refs: ["lr-fruitcake"]`, and `lr8` has `refs: ["lr-recipes"]`, three rules cards in all. Each card reads correctly with its rules card: `lr20` ends with «применив следующие результаты:» and the four outcomes are the ref's first lines. 26 records, rolls 1-26 equal the ids, in book order (checked against the PDF). No Mournguard Mark Badge or letter record. Each ref `url` is the owner's product link `https://heartofdaggers.com/products/the-last-round-table/`, and each `rusub` keeps the product name in Latin (decision 2026-10-21).

## Suggested next action

One fix pass on `lr-draft.json` and `lr-translation-notes.md`: Risks 1-4 and
the `local` Nits 1-14, with the strings above. The style notes are optional.
Then the orchestrator commits B0-lr with no second review, parses the JSON and
re-runs the numeric parity check.

## Checks still needed

- After the fix pass: parse the JSON, re-run the numeric and range parity
  check, and confirm `lr12` has the `shambling-zombie` ref.
- B2: no corpus ref has a `|` table. Check how the record page, the copied
  text and the print card render the `lr-recipes` rows in both languages.
- B2: `node tools/desc-style.mjs --write` italicizes known conditions. Check
  that it styles «Ослаблен»/«Ослабленным» and "Impaired" the same way as
  «Уязвим», or record that it does not.
- B2: the feature labels `Name - Kind:` of items have no corpus precedent
  outside adversary refs (`***Name - Kind:***`). Check the result of the
  style tool on `lr2`-`lr26`.

## Terms decided

| English | Draft | Verdict | Evidence |
|---|---|---|---|
| Impaired (new condition, `lr-fruitcake`) | «Ослаблен» | keep; use the instrumental after стать (Nit 1) | SRD conditions on the site conventions page: Vulnerable, Restrained, Hidden, Cloaked only. Corpus «Ослабл» 0 hits, so no collision. The rules card defines it, and «ослаблен» fits its effects (Vulnerable, short moves, no Stress clear). |
| Sitizens | «мебельчане» | keep | Coined pun; a demonym is lowercase in Russian. «Сиделяне» does not say "furniture". |
| Anklebiter | «Лодыжкогрыз», masculine | keep | The text agrees in the masculine everywhere («сам», «его вынести», «с ним»). The book calls it "himself" (Brimley). It declines, «Кусака за Лодыжки» does not. |
| Passive suffix | «- Пассивно» | keep | Site adversary pages: «- Пассивно» 20, «- Пассивный» 3 (Huge Green Ooze 2, Minotaur Wrecker 1). Corpus refs: «- Пассивно» 3 (`shambling-zombie`, `rotted-zombie`), «- Пассивный» 2 (`huge-green-ooze`). Corpus items have no suffix. |
| Action / Reaction / Rest Move suffixes | «- Действие» / «- Реакция» / «- Ход Отдыха» | keep; all 26 records and the deed already follow | Site 14 / 9; Rest Move: site Downtime Move = «Ход Отдыха». The short adverb-like form «Пассивно» is the norm the others pair with. |
| Noggin' Boots | «Хмельные Сапоги» | keep | "noggin" = a small cup of liquor; «хмельные» keeps the drink. |
| Heavy Drinker | «Тяжёлый Выпивоха» | keep | Keeps both "heavy" (weight) and "drinker"; no Russian idiom holds both. |
| Pumped Up | «Заряд Бодрости» | keep | Natural Russian. |
| Retail Therapy | «Терапия Покупками» | keep | Understandable; «Шопинг-Терапия» is the idiom, not required. |
| The Freshmaker | «Освежитель» | keep | - |
| Stalker's Stance | «Стойка Преследователя» | keep | «Следопыт» is the Ranger class (conventions page). |
| Way Hay | «Эгей» | keep (style option «Йо-Хо-Хо») | - |
| Slime | «Желе» | keep | Ooze = «Слизь» (corpus 17). Corpus «Желе» 0 hits as a word (6 hits are «Железн-»). Ochre Jelly is «желе» in Russian D&D. |
| Mood level Dying | «Умирающее» | keep; nominative in quotes (Nit 3) | Agrees with «Настроение» (neuter). The levels are not in the catalog (printed page 14), so no other form binds. |
| Stairwell Entrance | «Лестничный Вход» | keep | 0 corpus and site hits; clear; used the same way in both deed sentences. |
| Last Round Table (tavern) | «Последний Круглый Стол» | keep | Keeps the Round Table sense. The book itself shortens the tavern to "the Last Round" (letters snippet, printed page 41; environments, page 12), so «Рецепты Последнего Круга» is the matching short form. |
| Double Duty | «Двойная Работа» | change to «Двойная Служба» (Risk 1) | `q260`, `q271`. |
| within Melee range (weapon bonus) | «на дистанции Вплотную» | change to «по целям Вплотную к вам» (Risk 1) | Corpus 18 : 0. |
| Shambling Zombie | «Бредущий Зомби» | keep; add the ref (Risk 2) | Corpus ref `shambling-zombie`; `dv66` links it. |
| 10 lb / 1 lb / a mile / 100 miles | ~4,5 кг / ~0,5 кг / 1 км / 160 км | keep the figures; drop `~` (Nit 2) | `voa2_t1d` 230 кг, `w36` 150 метров, `ci2` 1 километр, `voa2_t4g` 160 км; corpus `~` 0. "Per pound" = «за каждые 0,5 кг» keeps the price. |
| "social roles" (book typo) | «социальным броскам» | keep | «ролям» states no rule. |
| Difficulty N (Reaction Roll) | «(N)» | keep | Corpus English never prints "Difficulty N" (0 hits); Russian "(N)" 63 hits, «Сложность N» 0. |
| Copper (Handful), Silver (Bags) | «горсть меди», «мешков серебра» | keep | Site Handful = «Горсть», Bag = «Мешок». Corpus «горсть золота» 5 (`hc32`, `q209`, `w93`), «мешка золота» (`w93`) lowercase; capitalized once (`dve52`). Corpus English has no "Handful"/"Bags" denomination in parentheses. |
| `lr-recipes` table | header «Название / Рейтинг / Эффект» | keep (Nit 5 for one cell) | 9 rows x 3 cells, ratings equal in both languages. «Рейтинг» matches «Рейтингу», «рейтингом» in the text. |
| Ref titles | «Фруктовый Кекс Долгого Огня: Подарок, Который Дарит Снова и Снова»; «Рецепты Последнего Круга: изучение и варка»; «Купчая на Последний Круглый Стол: Настроение таверны» | keep | Each starts with its record's `ru` name. |
| `ensub` / `rusub` | "The Last Round Table · p. N · Rules" / "The Last Round Table · с. N · Правила" | keep | Pages 40, 39, 38 match the printed pages. Product name Latin (decision 2026-10-21, B0-ph Risk 6). |
| `url` | `https://heartofdaggers.com/products/the-last-round-table/` | keep | `context.md`, "Product links (owner)". |
| Ironwood | «Железного Дерева» | keep | Real Russian tree name; corpus Irontree = «Железного Дерева» (`q327`). |
| Blessed | «Благословленн-» | keep | Corpus «Благословленный» 5 (`f57`-`f60`). |
| Downtime Project; Prepare | «Ход Отдыха «Работа над Проектом»»; «Ход Отдыха «Подготовка»» | keep | `mw106`; `cm19`, `cm43`, `mw29`. |
| Once per Long Rest; once per day | «Один раз за продолжительный отдых»; «один раз в день» | keep | Corpus 66 and 1. |
| between rests; until you take a rest | «между отдыхами»; «до следующего отдыха» | keep | Conventions page Per Rest = «До следующего отдыха». |
