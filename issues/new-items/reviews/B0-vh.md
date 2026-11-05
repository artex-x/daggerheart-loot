# Review - B0-vh (new-items)

Verdict: fix-then-continue
Reviewed: 8a88092ebdbd3d2adefc2b9da4724a2cf4824d72
Scope: batch B0-vh

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

The batch is uncommitted. `vh-draft.json`, `vh-translation-notes.md` and
`vh-audit.md` are untracked, so `git diff HEAD` has no base. The English was
compared against the kit's `records-draft.json`
(`C:\Users\Ignat\Downloads\Escape the Veiled Halls`): with `ru` and `rud`
removed, the two files are equal key for key (note, product, craft, rooms
and all 15 records). Each `ende` was read again against
`pdftotext -layout` of the PDF (printed pages 6, 8, 10, 12): all 15 match.
The PDF breaks "1-6" and "7-9" at the hyphen in the Demonic Book; the
draft's "1-6, 7-9, 10-12" is correct.

The mechanics of all 15 Russian texts match the English. One wording gives
the GM an activation that the corpus and the site never give to the GM
(Risk 1). The other findings are wording only.

The `daggerheart-ru-terms` skill file is not on this host (no Skill tool;
nothing under `~/.claude/skills`, `~/.agents/skills` or the plugin cache).
The review applies its check order as the dispatch states (terminology,
mechanical meaning, grammar, naturalness, typography). The term authority is
`ru.daggerheart.su/rule/terms-translation` and the site pages cited below.

## Blockers

None.

## Risks

1. `vh12` `rud` - the GM gets an «активация». In the corpus, an activation
   always belongs to a creature: 54 hits, for example «получает активацию»
   (dv5, dv61), «во время своей активации» (voa3_t1e) and «когда её
   активируют» (hc15). The cited w15 and cm67 say «вы можете активироваться»
   about a PC. The site gives the same split: the GM activates an adversary
   (`/rule/spotlight`: «Мастеру активировать противника»;
   `/adversary/minotaur-wrecker`: «потратить Страх для активации
   Минотавра»), and the GM has a «ход Мастера» (`/rule/gm-move`; corpus
   dve11 «Ход Мастера»). In the book, a "spotlight move" is the GM move that
   spotlights an adversary ("spotlight the Mannequin as an additional GM
   move", p. 8). «Мастер должен использовать свою следующую активацию» does
   not follow that usage, and «атаковать вас любым противником» is a calque
   of "attack you with". The replacement names the GM's turn, the
   activation of an adversary and the attacker.
   - Current: `Один раз за продолжительный отдых Мастер должен использовать свою следующую активацию, чтобы атаковать вас любым противником в пределах Далекой дистанции.`
   - Replace: `Один раз за продолжительный отдых Мастер должен в свой следующий ход активировать любого противника в пределах Далекой дистанции, чтобы тот атаковал вас.`

## Nits

1. `local` - `vh4` `rud`: the corpus renders the same mechanic as
   «превратить Бросок со Страхом в Бросок с Надеждой» (w75). «изменить его
   на» is correct Russian, but it is a second form for one rule. The
   remainder of the sentence («совершаете Бросок со Страхом») matches the
   corpus (w50, mw60, hc58).
   - Current: `вы можете вместо этого изменить его на Бросок с Надеждой.`
   - Replace: `вы можете вместо этого превратить его в Бросок с Надеждой.`
2. `local` - `vh-translation-notes.md`: bring the notes in line with Risk 1
   and Nit 1, and correct the evidence for the spotlight row.
   - Terms row current: `| spotlight move | активация | site, corpus (w15, cm67) |`
   - Replace: `| spotlight move | в свой следующий ход активировать (противника) | site /rule/spotlight, /rule/gm-move; corpus hc15, dve11 |`
   - Divergence 4 current: `4. vh12: "use their next spotlight move to attack you" becomes «использовать свою следующую активацию, чтобы атаковать вас». The corpus uses «активация» for the spotlight.`
   - Replace: `4. vh12: "use their next spotlight move to attack you with any adversary" becomes «в свой следующий ход активировать любого противника ..., чтобы тот атаковал вас». The site and the corpus give the activation to the creature, and the GM activates it (/rule/spotlight, hc15).`
   - Divergence 5 current: `5. vh4: "change it to a roll with Hope" becomes «изменить его на Бросок с Надеждой».`
   - Replace: `5. vh4: "change it to a roll with Hope" becomes «превратить его в Бросок с Надеждой», as in w75.`
3. `deferred-scope` (B2 merge) - `vh6` `ende`: the book prints "an
   experience of your choice" in lowercase. The corpus capitalizes the term
   ("an/your Experience" 3, lowercase 0; ci47 "an Experience of your
   choice"). The ph draft fixed the same kind of book typo ("Very close").
   B0 must not change English, so B2 decides: current
   `You gain a +1 bonus to an experience of your choice until your next rest.`,
   replace `You gain a +1 bonus to an Experience of your choice until your next rest.`,
   and list it in the audit's book notes.

### Style-only notes (not blocking, take or leave)

- `vh13` `rud`: the site's Blink Out card (`/domain-card/blink-out`,
  «Мерцание») has no comma before the range: «в точку, которую вы можете
  видеть в пределах Далекой дистанции». Current: `в точку, которую видите, в пределах Далекой дистанции.` - replace: `в точку, которую видите в пределах Далекой дистанции.`
- `vh7` `rud`: "hold up to" means "present to". «выставить» says that more
  exactly than «поднять ... перед». Current: `поднять эту реликвию перед противником` - replace: `выставить эту реликвию перед противником`.
- `vh-draft.json` `note`: "English only; ru/rud are null" is stale. The note
  is not shipped (`plan.md`, "B1 and B2 order of work", step 2), and B0
  must not change English fields, so leave it unless the orchestrator wants
  it current.

## Deviations

- Divergence 1 (vh3 «открыть эту книгу на случайной странице»): accepted.
  «открыть книгу на случайной странице» is the natural Russian for one flip.
  The rest of the record follows ci34 (Box of Many Goods) word for word:
  «При результате 1-6 ...».
- Divergence 2 (vh1 «когда вы должны отметить свою последнюю Рану»):
  accepted. It is the q347 form (Dragonscale Armor, Impenetrable) and aa9.
- Divergence 3 (vh7 «заставить его отметить Стресс»): accepted. q157 and
  q291 use the same form.
- Divergence 4 (vh12 «активация»): rejected (Risk 1).
- Divergence 5 (vh4 «изменить его на»): replace with the w75 form (Nit 1).
- "English fields unchanged": confirmed against the kit's
  `records-draft.json` (see the head of this report).

## Standing checks

1. Scale: checked - the longest Russian text is vh3 at 241 characters (English 184). The corpus `rud` median is 165, p90 334, max 847. The longest name is vh15 «Легендарное Зелье Предвидения» at 29 characters (corpus p90 27, max 43). Every card fits without a rules card. The table and room states belong to B2.
2. Error scenarios: not applicable - B0-vh has no write path or stored shape.
3. Consistency: checked - the corpus counts in `data.js` (all `items`, `eq` and `refs`) for every name word and rule phrase in the table below. Also the conventions page and the site pages for spotlight, GM move, Help an Ally, reaction roll, utilize an Experience, Blink Out, Major Stride Potion, Airblade Charm and Control Relic. Also the sibling drafts: lr14 also uses Charm = «Оберег», and Horn = «Рог». Findings: Risk 1, Nit 1.
4. RU/EN parity: checked - a script compared dice, numbers, ranges and signs in all 15 records: 0 differences (`+1` x3, `15`, `d12`, `d6`, `1-6`, `7-9`, `10-12`). Range words: Very Close = «Близкой» (vh7, vh11), Far = «Далекой» (vh12, vh13). Latin letters in Russian fields: only `d12` and `d6`. No en dash, em dash, curly quotation mark, ellipsis, double space or mixed-script word. `ru` names: 15 unique, 0 collisions with `data.js` (case- and ё-folded), 0 with `ph-draft.json` and `lr-draft.json`. Room names: 0 collisions. `craft` keeps vh2 to vh6 and vh8 to vh15. Both families read as one family in Russian: «Зелье Воспоминаний» / «Большое Зелье Воспоминаний», «Зелье Предвидения» / «Легендарное Зелье Предвидения».

Owner rules: checked - `context.md`, "Settled decisions", vh 2026-11-05: the per-room rolls stay (`room` and `roll` unchanged; d4, d4, d3, d4), and the two `craft` links are present. The settled terms of `reviews/B0-ph.md` that apply here hold: «Один раз за продолжительный отдых», Legendary = «Легендарн-». «в момент спокойствия», «Один раз до следующего отдыха» and «Затронутый» do not occur in vh. vh has no product name in Russian text.

## Suggested next action

One fix pass on `vh-draft.json` and `vh-translation-notes.md`: Risk 1 and
the `local` Nits 1-2, with the strings above. The style notes are optional.
After that the orchestrator commits B0-vh with no second review. Nit 3 goes
to the handoff's Deferred list for B2.

## Checks still needed

- After the fix pass: parse the JSON, run the numeric parity again, and
  confirm that only `ru`, `rud` and `rooms.*.ru` differ from the kit's
  `records-draft.json`.
- B2: `node tools/desc-style.mjs --write` must leave vh unchanged (no costs
  or conditions to bold or italicize; confirm on vh3 and vh11).
- B2: the rooms module gives the Russian labels as single nouns. The realms
  drop the article in Russian too («Дром» = "The Drome", `realms.ts`).

## Terms decided

| English | Draft | Verdict | Evidence |
|---|---|---|---|
| Potion | «Зелье ...» | keep | Corpus: 36 potion records, all «Зелье» (cc, hc, w, voa, dv). |
| Major (potion) | «Большое» | keep | Corpus 10 of 10 (cc25-cc30, cc43, cc44); cc38 «Большой Мистический Осколок»; site `/equipment/major-stride-potion` «Большое Зелье Быстрого Шага». |
| Legendary (potion) | «Легендарное» | keep | No source has a Legendary potion. Legendary = «Легендарн-» 89 of 89 (Core q173-q231, Arazo aa4-aa77, frames f40-f92); neuter «Легендарное» 4 times (f52, aa4, aa61, q184). «Великое» and «Высшее» occur 0 times as a rung word; Superior = «Превосходный» once (w91). |
| Presence Reaction Roll | «Бросок Реакции Влияния» | keep | Corpus w14, w42 and 4 more; site `/rule/reaction-roll` uses «Бросок Реакции Проворности (14)». |
| Help an Ally | «помочь союзнику» | keep | Site `/rule/help-an-ally`: the title is «Помощь Союзнику», but the body text is lowercase, «чтобы помочь союзнику в броске действия». Corpus: 0 hits. Same verb form as hc27 «использовать Опыт, не тратя Надежду». |
| spotlight move | «свою следующую активацию» | change (Risk 1) | Site `/rule/spotlight`, `/rule/gm-move`, `/adversary/minotaur-wrecker`; corpus hc15, dve11. |
| downtime | «во время отдыха» | keep lowercase | Corpus: lowercase 6 (ci1, cc56, cm19, di5, mw20, mw40), «Отдыха» 3 (dv20, dv24, dv31), «привала» 1. Conventions page: Downtime = «Отдых». |
| Once per long rest / short rest / session | «Один раз за продолжительный отдых» / «за короткий отдых» / «за сессию» | keep | Corpus: 66 against 28 for «до следующего продолжительного»; short rest 2 against 1; session 35. |
| when you would mark your last Hit Point | «когда вы должны отметить свою последнюю Рану» | keep | q347, aa9, hc59. |
| Hit Point slot | «Ячейка Раны» | keep | Conventions page; dv30 «одну дополнительную Ячейку Раны». |
| roll with Fear / turn into Hope | «совершаете Бросок со Страхом» / «изменить его на» | keep / change to «превратить его в» (Nit 1) | w50, mw60, hc58; w75. |
| advantage on | «преимущество на» | keep | Corpus 98 against 3 for «ко». |
| Resilience Charm | «Оберег Стойкости» | keep | Charm = «Оберег» 5 (w78, w110, w113, cm81, voa2_t1c), «Амулет» 4 (Core ci35, voa3_t1b, voa4_a1). «Амулет» is also Amulet (di9), so «Оберег» keeps the two apart; lr14 uses «Оберег». «Стойкости» also names cc13 Зелье Стойкости, but the full names differ. |
| Remembrance Potion | «Зелье Воспоминаний» | keep | 0 corpus hits. «Зелье Памяти» is equal; prefer it only to echo ci52 «Осколок Памяти». |
| Demonic Book | «Демоническая Книга» | keep | Book = «Книга» 5 of 5; w29 «Демонической». |
| Bravery Potion | «Зелье Храбрости» | keep | q121 «Меч Храбрости». |
| Music Box | «Музыкальная Шкатулка» | keep | 0 hits. «шкатулка» is the Russian word for this object; Box = «Коробка» (ci34) would read as a crate. |
| Holy Relic | «Святая Реликвия» | keep | Relic = «Реликвия» 11 of 11; Holy = «Святой» (di29, f61-f64, voa3_t1g). |
| Foresight Potion | «Зелье Предвидения» | keep | Foresight = «Предвидения» 2 of 2 (dve45, aa28). |
| Awareness Potion | «Зелье Внимательности» | keep | 0 hits; «Бдительности» is hc40 (Vigilance). |
| Radioactive Syringe | «Радиоактивный Шприц» | keep | Book word, kept as the audit asks; 0 collisions. |
| Mutated Specimen | «Мутировавший Образец» | keep | Specimen = «Образец» (voa4_t2e). |
| War Horn | «Боевой Рог» | keep | War = «Боевой» 3 (q58, q87, q292), «Военный» 1 (cm30); Horn = «Рог» 7 of 7. |
| Blink Potion | «Зелье Мерцания» | keep | Site `/domain-card/blink-out` = «Мерцание», the same short teleport within Far range. |
| Ring of Aid | «Кольцо Помощи» | keep | Ring of X = «Кольцо X» 12 of 12; site «Помощь Союзнику». |
| Rooms: The Basement, The Dressing Room, The Laboratory, The Library | «Подвал», «Гардеробная», «Лаборатория», «Библиотека» | keep | No corpus room names. The realms drop "The" in Russian (`realms.ts`: «Дром»). The frames use sentence case and the realms use title case, so a one-word label needs no case rule. The book's room 2 is "a manor-house room ... furnished with wardrobes, dressing tables, dusty mirrors", which is a «гардеробная». |
