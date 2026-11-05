# Context - TASK pistolheart

## Goal

Add the equipment of Pistolheart Volumes 1-3 (Carlos Cisco, DPCGL community supplement) to the
catalog as one new source `ph`, with the art that is already delivered.

## Inputs (outside the repository)

Folder `C:\Users\Ignat\Downloads\Telegram Desktop\Pistolheart` (the "kit"):

| Path | Content |
|---|---|
| `Pistolheart_Vol_1_1.pdf`, `Pistolheart vol 2 (2).pdf`, `Pistolheart-vol3-.pdf` | The books. Equipment: Vol 1 PDF p10-11 (printed 7-8), Vol 2 PDF p13-14 (printed 9-10), Vol 3 PDF p33-34 (printed 33-34). Vol 3 PDF p35-37 are third-party advertisements: ignore. |
| `images/` | 45 final PNGs, 1254x1254, named `<English name> v<N>.png` (Laudanum and Maverick's Shuffle are v2). Complete: `FINAL-ART.md` says 45/45, serving 93 records. |
| `final-art-registry.json` | Per picture: id, the records that share it, version, SHA-256, QA status. |
| `references.md`, `references.json` | The four rules references (verbatim) and the product links. |
| `image-context/` | Generation prompts and item files. Only needed to regenerate art. |
| `records-draft.json` | Draft of the 93 records (copy of `issues/pistolheart/records-draft.json`). |

Text extraction: `pdftotext` in `C:\tools\poppler\poppler-26.02.0\Library\bin`.

## Inventory: 93 records, 45 pictures

| Vol | Kind | Entries | Records |
|---|---|---|---|
| 1 | Primary weapons, damage per tier 1-4 | Snubnose Revolver, Warbringer Revolver, Arcpistol, Scoped Rifle, Bolt Action Rifle, Sawed Off, Slug Gun, Lever-Load Rifle, Pocket Pistol | 36 |
| 2 | Primary weapons | Foal .44 Revolver, Rope Hatchet, Prospector's Pouch, Maverick's Shuffle | 16 |
| 2 | Secondary weapons | Carving Knife, Wood Axe, Sand Pouch | 12 |
| 2 | Items | Hexer's Bandolier, Bandit Mask, White Hat | 3 |
| 2 | Consumables | Bandit's Gunny Sack, Ricochet Round, Questionable Invigorator, Laudanum | 4 |
| 3 | Armor, one tier each | Black Hat Leathers T1, Boreworm Plate T2, Gilded Ribcage T3, The Inexorable's Duster T4 | 4 |
| 3 | Consumables | Gunpowder Whiskey, Paper Horse, Coati Paw | 3 |
| 3 | Magic saddles (items) | Pegasus Saddle, War Saddle, Preservation Saddle, Opulent Barding, Bubble Tack, Rodeo Saddle | 6 |
| 3 | Infusions (items) | Arcana, Blade, Bone, Codex, Grace, Midnight, Sage, Splendor, Valor | 9 |

Volume 1 holds 36 records, Volume 2 holds 35, Volume 3 holds 22.

## Settled decisions (owner)

- 2026-10-29: a weapon is a four-record `eq.line` (`<Name>`, `Improved <Name>`, `Advanced <Name>`,
  `Legendary <Name>`; Russian `Улучшенный`, `Продвинутый`, `Легендарный`), one shared picture. The
  rung names are not book text. Precedent: frame Revolver line `f37`, and Arazo's lines.
- 2026-10-29: the nine Infusions ship as item records, drawn as a vial series.
- 2026-10-29: one source `ph` "Pistolheart", volume kept per record.
- 2026-10-29: War Saddle keeps "Yah!" as printed (Volume 3 calls Volume 1's Charge move "Yah!"); the
  mounted-rules reference names both.
- 2026-11-05: the book prints no roll numbers, so roll numbers are assigned in book order, "the same
  way as Arazo's Artifacts" (`docs/decisions/2026-10-07-arazos-artifacts-source-arazo-section-roll-arazo-ids-aa.md`:
  one pool, `roll` in book order, a line's rungs directly after its head, a random pick as for `roll/dv`).
  Ids `ph1`-`ph93` equal the roll numbers.
- 2026-11-05: the work starts after task 57 is closed and squashed onto `main`.

## Verified facts

- All 93 feature texts were matched word for word against the PDF text (after quote and minus
  normalisation). All 16 weapon lines were checked against the printed tier rows: 10 by script
  and 6 (Volume 2, where the text order interleaves) by eye.
- Book typos fixed in the draft: "Very close" (Pocket Pistol), "d10 +9" (Maverick's Shuffle),
  "d6+1phy" and "d4+3phy" (secondary weapons). Foal .44 Revolver prints `d6` at Tier 1 with no bonus.
- No name or id of the 93 records collides with an existing record. `tests/dataint.js` pins the record
  total at 1459; it becomes 1552.
- The draft carries `ru` and `rud` as `null`: translate them (`daggerheart-ru-terms`).

## Source facts to settle in the batch

- Volume 3 text says "Yah! (PHv1, pg7)". Volume 1 names the move Charge in four places.
- Lever-Load Rifle: the table name wins over the art caption "Lever Action Rifle".
- Infusions depend on the shared Infusions paragraph; saddles on the Magic Saddles paragraph.

## Rules references (four catalog refs)

Stored once in `LOOT.refs`, attached to the records below; text verbatim in `records-draft.json`.
The link of each is the DriveThruRPG page of the book that prints it.

| Key | Source | Records |
|---|---|---|
| `ph-mounted` | Vol 1 printed p7, "Optional Rules for Mounted PCs" (Charge, Serpentine, Spurs) | Paper Horse, Pegasus Saddle, War Saddle, Preservation Saddle, Opulent Barding, Bubble Tack, Rodeo Saddle |
| `ph-saddles` | Vol 3 printed p34, "Magic Saddles" | the 6 saddles |
| `ph-infusions` | Vol 3 printed p34, "Infusions" | the 9 Infusions |
| `ph-most-wanted` | Vol 2, Corrupt Sheriff, "Most Wanted - Action" | Bandit Mask |

No reference: Core terms (Vulnerable, moment of calm, grimoire card, vault, bag and chest of gold,
undead), weapon features and armor features.

## Product links (owner, 2026-10-29)

- Vol 1: https://www.drivethrurpg.com/en/product/547537/pistolheart-volume-1
- Vol 2: https://www.drivethrurpg.com/en/product/564429/pistolheart-volume-2
- Vol 3: https://www.drivethrurpg.com/en/product/578612/pistolheart-volume-3

These go to the help box of the source (`docs/decisions/2026-09-19-the-product-link-lives-in-the-roll-tabs.md`),
both README source tables, `llms.txt` and the `url` of the references.
