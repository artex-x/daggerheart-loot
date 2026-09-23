# Vault of Ages Volume 4 - errata register

This register lists every place where the shipped `voa4_*` records, the
`saints-ensemble` set and the `rotted-zombie` ref depart from Vault of Ages
Volume 4 v1.0, or keep a printed defect on purpose. Use it to diff a later
version of the book: a row whose defect the author fixed is dropped, and our
fix is kept only where the author left the defect. The policy is in
`docs/DECISIONS.md`, "Vault of Ages Volume 4: the source errata policy".

The source is `VaultOfAges_Volume4_v1_0.pdf`: description pages are PDF
pp. 6-13, card sheets PDF pp. 14, 16, 18, 20, optional rules PDF p. 5. The
audit numbers are the numbers of the audit sent to the author (47 issues).
The audit is the external document `voa4-audit.md`; it is not in the repository.

## Classes

| Class | Meaning | What ships |
|---|---|---|
| T | Typography, spelling, or the site's line for a core feature | The corrected text, in `ende` (and `rud` where the Russian repeated it) |
| D | The description page and the card sheet disagree | The page; the card's reading is recorded here |
| V | The page prints a value that is not valid | The only valid printed value (the card) |
| R | A rule the book states two ways, or a rule that is hard to play | Edited only where the book contradicts itself; otherwise the printed rule |
| B | Balance outside the core bands | Never changed; the author's call |

A `-1` in a shipped cell is written with U+2212, the minus sign the catalogue uses in feature
modifiers.

## Edits (the shipped text differs from the page)

| Record | Field | Printed text | Shipped text | Class | Audit |
|---|---|---|---|---|---|
| voa4_t1c | ende | `until your after your next rest` | `until after your next rest` | T | 32 |
| voa4_t2c | ende | `Barrier: +2 to Armor Score, -1 to Evasion` | `Barrier: +2 to Armor Score; -1 to Evasion` (the core line) | T | - |
| voa4_t2c | rud | `Барьер: +2 к Показателю Брони, -1 к Уклонению` (draft) | the site's Barrier line, `; -1 к Уклонению` | T | - |
| voa4_t2a | rud | Parry, the draft's own wording | the site's Parry line (core Parrying Dagger) | T | - |
| voa4_t2e | ende | `Horrified creatures can't use passive features or make action rolls against you, and must be beyond Close range of you at the end of their spotlight.` | sentence removed; a third line `Horrified: A Horrified creature can't use passive features and can't take actions against or approach within Close range of the source of the effect.` (the p. 5 Conditions table) | R | 15 |
| voa4_t2e | rud | the same sentence (draft, `Объятые Ужасом`) | a third line `Устрашён: ...` from the p. 5 table; the condition is `Устрашён` | R | 15 |
| voa4_t1b | rud | `Гнилой Зомби падает замертво` (draft) | `Гнилой Зомби падает наземь` | T | - |
| voa4_t3d | ende | `Thy must succeed` | `They must succeed` | T | 33 |
| voa4_t3d | ende | `+1 to Armor Score; When` | `+1 to Armor Score; when` | T | 42 |
| voa4_t3d, voa4_t3e, voa4_t3f | ende, rud | `Saint's Ensemble: When you possess the Saintly Guard, Vestments and Blade, gain +1 Evasion.` on each | line removed; `sets['saints-ensemble']`: `When every piece of this set is in your loadout, gain +1 Evasion.` (the p. 5 Item Sets rule, stated once) | R | 11 |
| voa4_t3h | ende | `(Close, Far, Very Far.)` | `(Close, Far, Very Far).` | T | 41 |
| voa4_t3h | eq.dmg | page `d86+7` | `d6+8` (card) | V | 2 |
| voa4_t3i | ende | `Massive: -1 to Evasion. On a successful attack, roll` | `Massive: -1 to Evasion; on a successful attack, roll` (the core line) | T | 43 |
| voa4_t3i | rud | `Массивное: -1 к Уклонению. При успешной атаке` (draft) | the site's Massive line | T | 43 |
| voa4_t4c | ende | `damage tresholds` | `damage thresholds` | T | 34 |
| voa4_t4d | ende | `Channeling: +1 to Spellcast rolls.` | `Channeling: +1 to Spellcast Rolls.` | T | 40 |
| voa4_t4d | rud | `Проводящее: +1 к Броскам Заклинания.` (draft) | the site's Channeling line, `Броскам Заклинаний` | T | 40 |
| voa4_t4e | ende | `teleport anwhere` | `teleport anywhere` | T | 35 |
| voa4_t4e | rud | `критическое попадание` (draft) | `критический успех`; `ende` keeps `critical hit` as printed | T | 26 |
| voa4_t4f | ende | `During your spotlight, You can` | `During your spotlight, you can` | T | 37 |
| voa4_t4f | ende | `this staff .` | `this staff.` | T | 38 |
| voa4_t4a | ende | `Spellcast trait .` | `Spellcast trait.` | T | 39 |
| voa4_t4h | ende, rud | page: `Until the end of the scene, you can spend a Hope to gain power from the success of your enemies; whenever you are hit ...` | card order: `You can spend a Hope to gain power from the success of your enemies; until the scene ends, whenever you are hit ...` (the page states no playable duration) | D | 14 |
| voa4_t4i | ende | `Cumbersome: -1 to Finesse` (ASCII hyphen) | the same line with the minus sign U+2212 (the core line) | T | - |
| voa4_t4i | rud | `Громоздкое: -1 к Искусности` (draft) | the site's Cumbersome line | T | - |
| voa4_a2 | ende | `well-being; You gain` | `well-being; you gain` | T | - |
| voa4_a2 | ende | `on your Spellcast rolls` | `on your Spellcast Rolls` | T | 40 |
| voa4_a3 | ende | `has no stress remaining` | `has no Stress remaining` | T | - |
| voa4_a3 | eq.tier | no tier; printed in the Artifacts section | `'A'` | - | E4 |
| voa4_t3g | eq.bu | `Burden: 1h` | `1` (One-Handed) | T | 36 |

## Page over card (the page ships; the card reads otherwise)

| Record | Field | Page (shipped) | Card | Class | Audit |
|---|---|---|---|---|---|
| voa4_t4i | eq | Agility, Very Far, d8+12 physical, Two-Handed | Finesse, Melee, d6+7 physical, One-Handed | D | 3 |
| voa4_t3f | recall, ende | Recall Cost 2, `Gilded: +1 to Presence` | Recall 1, no Gilded | D | 4 |
| voa4_t3e | eq.tr | Strength | Presence | D | 5 |
| voa4_t3d | eq.tr | Instinct | Strength | D | 6 |
| voa4_t4g | eq.tr, eq.dt | Finesse, physical | Presence, magical | D | 7 |
| voa4_t4f | eq.dt | physical | magical | D | 8 |
| voa4_t2a | eq.t | Secondary Weapon | `Primary Weapon - Mace` | D | 9 |
| voa4_a3 | ende | `When your attack causes ...`; allies choose the resource; `mark a Hit Point instead, and gain advantage` | `If a spell attack causes ...`; you choose the split; `instead to gain advantage` | D | 12 |
| voa4_t3i | ende | `Adversaries who start their spotlight ...` | `Creatures starting their spotlight ...` | D | 17 |
| voa4_t3a | ende | `mortal creatures`, the GM's Fear escape | no `mortal`, no Fear escape | D | 18 |
| voa4_t3g | ende | `advantage on attack rolls using this weapon` | `advantage on an attack roll with this weapon` | D | 19 |
| voa4_a1 | ende | `or your adversary marks their last Hit Point from an attack you make` | `or when your adversary marks their last Hit Point from your attack` | D | 30 |
| voa4_t1b, voa4_t4c, voa4_t2i, voa4_t1d | ende | `The creature remains ...`, `you clear a Hit Point`, `On a success`, `Downtime move` | `It remains ...`, `you can clear`, `If you succeed`, `downtime move` | D | 31 |

## Kept as printed (the author's call)

| Record | Printed text | Why it stays | Class | Audit |
|---|---|---|---|---|
| voa4_t4c | `a bonus to your Armor Score equal to your Hit Points` | Playable; the core Armor Score cap of 12 applies | R | 1 |
| voa4_t2a | `Damage: d8+5 physical` on a secondary weapon | Above the tier 2 secondary band | B | 9 |
| voa4_t3e | `Burden: One-Handed` / `Damage: d10+10 physical` | Above the tier 3 one-handed band | B | 10 |
| voa4_a3 | Skewed Balance with no use limit or Hope cost | Playable as printed | R | 12 |
| voa4_a2 | `On a failure, permanently gain both features below.` | Playable; failure is stronger than success | R | 13 |
| voa4_t4h | tokens that are never spent, no use limit | Playable as printed | R | 14 |
| voa4_t2f | `When you deal Major damage to an object` | Playable: the GM gives the object thresholds | R | 16 |
| voa4_t3g | `a number of creatures equal to half your Agility` | No rounding printed; the table rounds | R | 19 |
| voa4_t2f | `Damage: d8+5 physical`, One-Handed | Above the tier 2 one-handed band | B | 20 |
| voa4_t4d | the core Channeling Armor line plus Thoughtbreaker | A strict upgrade of a core armour | B | 21 |
| voa4_t4a | `equal to your current Spellcast trait` | Playable; no Spellcast trait gives no bonus | R | 22 |
| voa4_t1b | `a living adversary with no more than 3 Hit Points`; a zombie whose Group Attack costs Fear | Playable; the `rotted-zombie` ref shows the stat block | R | 23 |
| voa4_t2i | `On a success, clear a Stress.` | Playable as printed | R | 24 |
| voa4_t2h | `Creatures in the area have disadvantage on any action rolls` | Playable as printed | R | 25 |
| voa4_t4e | the repeat that can trigger itself again | Playable; Stress is the limit | R | 26 |
| voa4_t2a | `teleport within Melee range of the slime`, no range limit | Playable as printed | R | 27 |
| voa4_t1f | `trait rolls associated with mental or social tasks` | Playable; the GM picks the traits | R | 28 |

## Not stored

Flavour text is not stored (Volumes 1-3 store none), so Issues 29 and
44-46 have no row. The p. 5 typos (Issue 47) are not record text.

## The Rotted Zombie ref

`refs['rotted-zombie']` is fetched from `ru.`/`en.daggerheart.su/adversary/rotted-zombie`
on 2026-09-23 and kept verbatim, as the site prints it. The Russian page names
the target of Minion as «Мертвецу» and ends its description with no full stop;
both are the site's text. The attack line has no damage cell in either language
(`ATK: -3 | Bite: Melee`; re-checked on 2026-09-23); Group Attack states the
damage, 2 physical each.
