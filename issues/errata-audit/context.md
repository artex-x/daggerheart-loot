# Shared task context - TASK errata-audit

Facts captured by the planner on 2026-11-11. Book text is quoted only where a value
depends on it; the books stay outside the repository.

## Goal
- Part 1: audit the `eq` stat block (tier, trait, range, damage, damage type, burden,
  armor score, thresholds, features) of every catalog equipment record against its
  source book and the errata; keep every intentional departure.
- Part 2: find records that would be better with a rule or reference card, better
  wording, or repeated text moved into a card; answer the four standing checks.
- Trigger: a report that the Revolver `f37` (Colossus frame) prints d6+1; Core errata
  p. 317 says "Revolver's d6 has been replaced with a d8".

## GitHub issue (if any)
- URL: none (local task id).
- Decisions already settled: `docs/decisions/2026-11-11-errata-over-srd-2-over-the-printed-book-for-darrington-equipment.md`
  (planner, 2026-11-11): errata, then SRD 2.0, then the printed book.
- Open questions: O1-O5 in `plan.md`, section 5, "Owner decisions".

## Sources (owner's machine, never committed)
TD = `C:\Users\Ignat\Downloads\Telegram Desktop`, DL = `C:\Users\Ignat\Downloads`.

| Source | File | Notes |
|---|---|---|
| Core book | DL `Daggerheart Core Set (...) (z-library...).pdf` | a pre-errata printing: Spear d10+2 Cumbersome, Revolver d6+1, Buckler "Armor Score", Sledgehammer "-1 to Agility" |
| SRD 2.0 | TD `DH_SRD_2_2026_08_25.pdf` | holds Core, Hope & Fear and frame equipment; equipment tables on printed pp. 55-74; Everyday Hero (Beast Feast) p. 190-191; Western (Colossus) p. 196; Monster Hunting (Dark Heart) p. 200; its text layer lacks the nine Core Tier 3 magic weapons q140-q148 (checked against the Core book instead) |
| Errata 1 | DL `Daggerheart-Errata-September9th2025.pdf` | 3 pages, all read |
| Errata 2 | DL `Daggerheart-Hope-and-Fear-08-25-2026.pdf` | Werewolf, Summon Horror, Darkfire, Savor the Anguish, Invoke Torment, adversary typos: none is in the catalog or `refs` |
| VoA 1-3 | DL `dtrpg-2026-08-13_10-05am\VaultOfAges{1,2}_v1_5.pdf`, DL `VaultOfAges3_v1_6.pdf` | shipped records match VoA1-2 v1.5 and VoA3 v1.6 (not the older v1.2 copies in TD) |
| VoA 4 | DL `voa4\VaultOfAges_Volume4_v1_0.pdf` (shipped), DL `VaultOfAges_Vol4_v1_2.pdf` (later) | register: `docs/provenance/voa4-errata.md` |
| Dragon's Vault | DL `The_Dragons_Vault_10_7.pdf` | PDF page = printed page + 1 |
| Arazo's Artifacts | DL `Arazo's Aritfacts\Guide_to_Arazos_Artifacts.pdf` | no text layer; read pages as images |
| Many Worlds Tavern | six zips in DL | card PNGs; the Godsvale zip's `Daggerheart/Archive/` holds an older card set - ignore it |
| Pistolheart, LRT, Veiled Halls | `.claude/README.md`, "Source kits of Pistolheart, The Last Round Table and Escape the Veiled Halls" | |

Text extraction that works on this host: `pdftotext -raw -enc UTF-8 <pdf> <txt>`
(xpdf 4.06 on the Git Bash PATH). `-layout` shifts table features by one row; do not
diff against it.

## Audit result (Part 1)
Checked: core 226, hnf 155, frame 92, voa 45, wondrous 11, dread 7, dv 68, arazo 68,
mwt 35, ph 68, lr 3 - all 778 `eq` records. Core, Hope & Fear and frames were diffed
by script against SRD 2.0 and the errata; the rest by three read-only helpers,
spot-checked by the planner (VoA4 v1.2 values).

### Mismatches that are not intentional (fix in B1)
| Record | Field | Current | Source value | Source, page | Intentional |
|---|---|---|---|---|---|
| f37, f38, f39, f40 Revolver line | eq.dmg | d6+1, d6+4, d6+7, d6+10 | d8+1, d8+4, d8+7, d8+10 | Errata 1, NEW p. 317; SRD 2.0 p. 196 | no |
| f6 Sledgehammer | ende, rud | `Massive: -1 to Agility` / `-1 к Проворности` | `Massive: -1 to Evasion` | Errata 1, NEW p. 275; SRD 2.0 p. 190 | no |

### Mismatches for the owner (unknown)
| Record | Field | Current | Source value | Source, page | Owner question |
|---|---|---|---|---|---|
| voa3_t4a Cerebral Spike | eq.dt, eq.cls | mag | page `d8+10 physical`; card `magical` | VoA3 v1.6 PDF p. 7 (printed p. 5, an image), card PDF p. 14 | O2 |
| voa3_t4a | feature name | `Neural Spike` | page `Psionic Spike`; card `Neural Spike` | same | O2 |
| voa1_t1a Blessed Chef's Knife | eq.t | weapon (page) | card `Secondary Weapon` | VoA1 v1.5 PDF p. 8 | O2 |
| voa1_t3f Ritual Blade of Sekhmet | eq.dt; trigger | mag; `When you strike a killing blow` (page) | card `physical`; `When an adversary marks its last Hit Point` | VoA1 PDF p. 10 | O2 |
| voa1_t4c Fists of the Ravager | eq.dmg | d10+15 (page) | card `d10+12` | VoA1 PDF p. 11 | O2 |
| voa1_t4h Temprus | eq.tr; Protective line | strength; `Protective: +3` present (page) | card Finesse; no Protective line | VoA1 PDF p. 11 | O2 |
| voa2_t3c Mossblossom Staff | eq.dt | mag (page) | card `physical`, name `Mossblossom Warstaff` | VoA2 v1.5 PDF p. 11 | O2 |
| voa2_t4f Veil Cutter | ende | Cut the Veil only (page) | card adds a first feature (move the target within Close range for a Stress) | VoA2 PDF p. 12 | O2 |
| voa3_t2b Corpse Lord's Raiments | eq.as | 3 (page) | card 4 | VoA3 v1.6 page PDF p. 5, card PDF p. 10 | O2 |
| voa3_t3d Meat Cleaver | eq.rg | veryclose (page) | card Melee | VoA3 page PDF p. 6, card PDF p. 12 | O2 |
| voa3_t2d Jolt Bracers, voa3_t4i Skull Lord's Key (loot, no `eq`) | ende | `Once per long rest` | `Once per day` (v1.5 and v1.6) | VoA3 | O2 |
| lr12 Paddle of Rising Ferment | eq.cls | phy | header `Tier 2 Magic Weapon`; row `Strength, Very Close, D8+6 phy` | LRT PDF p. 42 (printed p. 39) | O3 |
| mw87 | ende | `Add your Agility to your Armor Thresholds.` (printed) | the same; `rud` already reads `Порогам Урона` (damage thresholds) | MWT card | O4 |
| voa4_* (nine records) and `sets['saints-ensemble']` | several | v1.0 text and values | v1.2 values (list below) | VoA4 v1.2 | O1 |

### Departures the planner settled (keep; register in B1)
| Record | Field | Current | Source value | Source, page | Why kept |
|---|---|---|---|---|---|
| q280 Buckler | ende | `equal to your available Armor Slots` | SRD 2.0 p. 68 `available Armor Score`; Core book `Armor Score` | Errata 1, NEW p. 125 | the errata wins (decision 2026-11-11) |
| dve7 Black Corruption Axe | ende | `lose those conditions` | `lose those condition` | DV PDF p. 11 / printed p. 10 | grammar; no rule changes |
| dve9 | ende | `before taking a rest` | `before before taking a rest` | DV PDF p. 12 / p. 11 | typo |
| di3, di5 Flaming | ende | `For each 6 you roll on a damage die` | `For each 6 you on a damage die` | Dread p. 89 | a missing verb |

### Intentional departures confirmed (no change)
- Every Arazo flat bonus, threshold, Ogre-teeth die, Shield of Arcturus, Flight of the
  Phoenix and Drakebow change: `2026-10-08-arazos-artifacts-rebalanced-to-core-bands.md`,
  pinned in `tests/derived.js`. aa37-aa40 store `dt: 'any'` for "d10 (see below)".
- Dragon's Vault entries over the pp. 7-8 tables (dve57, dve41, dve46, dve42, dve56, dve26,
  dve32, dve11, dve38, dve39, dve59, dve52, dve28), Spellblade, Gryphon Hammer, Ember and
  Steampowered Gauntlets `eq.alt`, ember-spark set, Vestige, Slow ref: the 2026-09-19,
  2026-09-22 and 2026-09-23 decisions.
- MWT mw85 secondary, mw6 primary, mw47 `tr: 'any'`: 2026-10-18 and 2026-10-21 decisions.
- ph typo fixes ("Very close", "d10 +9", "d6+1phy", "d4+3phy"; Foal .44 `d6`): `.claude/README.md`, "Source kits".
- Wondrous w25 tier 4 and w82 tier 2: `tests/derived.js` `WOND_TIER` (the location tier).
- VoA4 v1.0 rows: `docs/provenance/voa4-errata.md`.
- Shadowblade line and Ghostblade store `dt: 'any'` for "phy/mag" (`app/src/lib/i18n.ts`).
- Errata lines already applied before this task: Glowing Rings q18 d10+2, Spear line
  q12/q49/q116/q184 d8+3..+12 with no Cumbersome, Longsword line q2/q39/q106/q174
  d10+3..+12, Buckler q280, Knuckle Claws q301 one-handed, Sweet Moss cc56,
  Powerful Beast ref (Strength +3, Evasion +1).
- Clean: core and hnf 381/381 against SRD 2.0 (plus q140-q148 against the Core book),
  frames 90/92, wondrous 11, dread 7 (text fix only), dv 66/68 (text fixes only),
  arazo 68, mwt 35, ph 68, lr 2/3, voa 23/24 VoA1-3 against the page, VoA4 21/21 against
  v1.0 with its register.

### VoA4 v1.2 changes that touch shipped records (for O1)
Verified by the planner: voa4_t2a damage `d8+5` -> `d8+4` (page and card); voa4_t3e
`d10+10` -> `d10+7` (page and card; the card trait is now Strength); Saint's Ensemble
`+1 Evasion` -> `+2 Evasion` (still printed on each item). Reported by the helper, to
re-verify on the PDF in B1: voa4_t2a Secretion trigger `On a hit`, card kind Secondary;
voa4_t4g page damage type `magical`; voa4_t2f `deal Major damage` -> `deal damage`;
voa4_t3g `advantage on an attack roll using this weapon`; voa4_t4c `total Hit Points`;
voa4_t4e `critical success`; voa4_a3 Essence Drain begins `If a spell attack causes`,
Skewed Balance begins `Once per long rest,`; voa4_t1c, voa4_t2e (Horrified lasts
`until the scene ends`; the p. 5 table now says `rolls` for `actions`), voa4_t2h
(`any rolls`), voa4_t2i (`On a successful investigation`), voa4_a2 (the vault sentence
removed), voa4_t4h (card clause order), voa4_a1 (`death move`). Typos v1.2 fixed:
t1c, t3d "Thy", t3h, t4c, t4e, t4f, t4h, a2 (page), t3g burden. Kept in v1.2: t2c,
t3d "; When", t3h `d86+7`, t3i, t4d, t4i, a2 "; You", a3 "stress". The register row
voa4_t4a `Spellcast trait .` could not be confirmed on v1.0.

## Part 2 findings (repeated text and custom conditions)
- Ammo tokens: only the Revolver line f37-f40 (Six Shot, self-contained). Pistolheart has
  no Ammo or Reloading rule. Reloading repeats on nine Core/H&F weapons (q36, q59, q97,
  q128, q148, q165, q214, q227, q232) as each SRD card prints it.
- Custom conditions are defined on the record that uses them: Roped (f49-f52), Sapped
  (aa74-aa77), Invincible (w32), Tethered (w51), Enraptured (w81), Incorporeal (w84,
  dv65 - two definitions), Marked (voa2_t2e, voa3_t4d), Paranoid (voa2_t4e), Seduced
  (voa3_t4e), Dominated (voa1_t3e countdown, dve7), Awed (dv10), Blinded (dv20, dve22,
  one definition), Wracked (dv21), Hexed (dv22), Terrified (dv37), Thunderstruck (dv72),
  Corrupted (dve7), Chilled (dve11), Irritated (dve15), Bleeding (dve37), Slowed (dve66),
  On Fire (aa15-aa18, dve18, dve40 - different rules), Horrified (voa4_t2e).
- Stunned has four definitions: w42 and mw94 (no reactions, no other actions until
  cleared), w54 (the same, no end), voa2_t4c (can't move until after your next
  spotlight), dv67 (can't take the spotlight until cleared).
- Core conditions used without a definition: Vulnerable (49 records), Restrained (29),
  Hidden (8).
- Same feature name, different rule: Bouncing (mw62 vs q194, q169, q237), Devastating
  (aa66-aa69 vs q122, q224, voa3_t3b), Charge Up (dve36, dve51), Diseased (dve21, dve27).
- A feature that repeats on each rung of a line is printed on each rung by every source
  (ph, aa, frames, Core); the print card needs it.

## Key paths
- Specs: `docs/specs/FEATURES.md` "Records" and "Catalog style"; `docs/specs/I18N.md` "Rules".
- Data: `data.js` (`items.frames`, `items.voa`, `items.lr`, `items.mwt`, `sets`); then `node tools/build.js`.
- Registers: `docs/provenance/voa4-errata.md`; new `docs/provenance/errata.md` (B1).
- Tests: `tests/derived.js` ("frame equipment", class-equals-type for voa/dread/frame,
  `saints-ensemble` checks), `tests/dataint.js` (catalog style).
- Goldens that show the Revolver or the Sledgehammer: 23 files under
  `tests/app/snapshots/` (`_tables_eq_weapon*`, `_tables_frames`, `_search_stat_line`, ...).

## Command costs
| Command | Wall clock | Fits one call? |
|---|---|---|
| `npm run check` | 10-18 min cold | no; offline path only |
| `rtk npm run check:fast` | 215-480 s (`.claude/README.md` table) | yes, timeout 600000 |
| `npm run check:built` | a few minutes | yes |
| `node tests/app/golden.js --shard=n/4` | 100-290 s per shard | yes, one shard per call |
| `node tests/app/sweep.js <width>` | 320-590 s per width | not needed for B1 |

## Which machine is authoritative
- For recorded numbers: CI's green run of the pushed tree.
- What a difference on another machine means: a golden text that differs only on this host is the host; take CI's text.

## Reasons already disproved
- "SRD 2.0 dropped Cumbersome from the Spear only in damage": the `-layout` text shifts
  features down one row; `-raw` shows Spear with no feature and Halberd with Cumbersome.

## Constraints
- Contracts / parity / i18n notes: no id, route or count changes. Every `ende` change
  has its `rud` change in the same commit. `cls` equals `dt` for voa, dread and frame
  records (`tests/derived.js`).
- The working tree was on `claude/ai-mcp` when this plan was written; B1 runs on `claude/errata-audit`.

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
- You suspect drift vs issue or plan
