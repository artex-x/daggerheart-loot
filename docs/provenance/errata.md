# Equipment errata and source corrections register

This register lists every place where a shipped record outside Vault of Ages Volume 4
departs from its printed source, and every place where an official errata changes the
printed book. Use it to audit an `eq` record or to diff a newer book version: a row whose
source changed is re-checked, and a row the source fixed is dropped. Volume 4 has its own
register, `docs/provenance/voa4-errata.md`.

Authority order for Darrington Press equipment: the official errata, then SRD 2.0, then the
printed book (`docs/DECISIONS.md`, "Errata over SRD 2.0 over the printed book for Darrington
Press equipment"). For Vault of Ages Volumes 1-3 the description page wins over the card sheet
("Vault of Ages Volumes 1-3: the description page over the card"). The sources are the Core
errata of 2025-09-09 (page numbers marked NEW are in its list), SRD 2.0 of 2026-08-25, Vault of
Ages Volumes 1-2 v1.5 and Volume 3 v1.6, Dragon's Vault 10.7, The Last Round Table, Many Worlds
Tavern and the Dread GM Toolbox. A `-1` in a shipped cell is written with U+2212.

## Errata applied (the printed Core book is a pre-errata printing)

| Record | Field | Printed text | Shipped text | Errata page |
|---|---|---|---|---|
| f37-f40 Revolver line | eq.dmg | `d6+1`, `d6+4`, `d6+7`, `d6+10` | `d8+1`, `d8+4`, `d8+7`, `d8+10` | NEW p. 317 |
| f6 Sledgehammer | ende, rud | `Massive: -1 to Agility` | `-1 to Evasion` / `-1 к Уклонению`, the line of every other Massive weapon | NEW p. 275 |
| q18 Glowing Rings | eq.dmg | `d10+1` (tier 1) | `d10+2` (tier 1) | NEW p. 115 |
| q12, q49, q116, q184 Spear line | eq.dmg, ende | `d10+2`, `d10+5`, `d10+8`, `d10+11` with `Cumbersome` | `d8+3`, `d8+6`, `d8+9`, `d8+12`; no Cumbersome | NEW pp. 115-120 |
| q2, q39, q106, q174 Longsword line | eq.dmg | `d8+3`, `d8+6`, `d8+9`, `d8+12` | `d10+3`, `d10+6`, `d10+9`, `d10+12` | NEW pp. 115-120 |
| q301 Knuckle Claws | eq.bu | two-handed | one-handed | p. 125 |
| cc56 Sweet Moss | ende | the pre-errata amount | `1d10 HP or 1d10 Stress` | NEW p. 133 |
| `refs['powerful-beast']` | stats | `Strength +1, Evasion +3` | `Strength +3, Evasion +1` | NEW p. 33 |

## Errata over SRD 2.0

| Record | Field | SRD 2.0 | Shipped text | Errata page |
|---|---|---|---|---|
| q280 Buckler | ende | `your available Armor Score` (Core book: `Armor Score`) | `equal to your available Armor Slots` | NEW p. 125 |

## Text fixes (the printed text has a defect; the rule is not changed)

| Record | Field | Printed text | Shipped text | Source |
|---|---|---|---|---|
| dve7 Black Corruption Axe | ende | `lose those condition` | `lose those conditions` | Dragon's Vault p. 10 |
| dve9 | ende | `before before taking a rest` | `before taking a rest` | Dragon's Vault p. 11 |
| di3, di5 Flaming | ende | `For each 6 you on a damage die` | `For each 6 you roll on a damage die` (a missing verb) | Dread p. 89 |
| mw87 Flexible Plate | ende | `Add your Agility to your Armor Thresholds.` | `... to your damage thresholds.` (the game has damage thresholds only; the Russian already named them) | Many Worlds Tavern card |

## Page over card, Vault of Ages 1-3

| Record | Field | Page (shipped) | Card |
|---|---|---|---|
| voa1_t1a Blessed Chef's Knife | eq.t | weapon | Secondary Weapon |
| voa1_t3f Ritual Blade of Sekhmet | eq.dt, ende | magical; `When you strike a killing blow` | physical; `When an adversary marks its last Hit Point` |
| voa1_t4c Fists of the Ravager | eq.dmg | `d10+15` | `d10+12` |
| voa1_t4h Temprus | eq.tr, ende | Strength; a `Protective: +3` line | Finesse; no Protective line |
| voa2_t3c Mossblossom Staff | eq.dt | magical | physical; the name `Mossblossom Warstaff` |
| voa2_t4f Veil Cutter | ende | the Cut the Veil feature only | adds a first feature |
| voa3_t2b Corpse Lord's Raiments | eq.as | 3 | 4 |
| voa3_t3d Meat Cleaver | eq.rg | Very Close | Melee |
| voa3_t4a Cerebral Spike | eq.dt, eq.cls, ende | physical; `Psionic Spike` | magical; `Neural Spike` |

## Kept on purpose

| Record | Field | Printed text | Why it stays |
|---|---|---|---|
| voa3_t2d Jolt Bracers, voa3_t4i Skull Lord's Key | ende | `Once per day` (v1.5 and v1.6) | `Once per long rest`: a day is not a Daggerheart timing |
| lr12 Paddle of Rising Ferment | eq.cls | header `Tier 2 Magic Weapon`, row `D8+6 phy` | class `mag` follows the printed table, damage type `phy` follows the row (the Dragon's Vault precedent) |
