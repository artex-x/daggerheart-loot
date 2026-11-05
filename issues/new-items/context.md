# Context - TASK new-items

## Goal

Add three new item sources to the catalog, each with its delivered or planned art:

| Source | Key | Records | Pictures | Art |
|---|---|---|---|---|
| Pistolheart Volumes 1-3 (Carlos Cisco) | `ph` | 93 (16 weapon lines of 4 tiers, 4 armor, 29 items) | 45 | delivered |
| The Last Round Table (Hack Shack Games) | `lr` | 26 | 26 (+1 optional) | kit ready, not generated |
| Escape the Veiled Halls (Kate Balding, Fear Fest 2026) | `vh` | 15 | 15 | kit ready, not generated |

The task was named `pistolheart` until 2026-11-05 and renamed `new-items` when the other two
sources joined it (owner).

## Inputs (outside the repository)

| Source | Kit folder | Book |
|---|---|---|
| ph | `C:\Users\Ignat\Downloads\Telegram Desktop\Pistolheart` | three PDFs; `images/` holds the 45 final PNGs (1254x1254, `<Name> v<N>.png`; Laudanum and Maverick's Shuffle are v2); `final-art-registry.json`, `references.md/json`, `image-context/` |
| lr | `C:\Users\Ignat\Downloads\Last Round Table` | `LastRoundTable_PDF_v2.pdf`; items in "Items & Extras", printed pages 38-41 (PDF 41-44) |
| vh | `C:\Users\Ignat\Downloads\Escape the Veiled Halls` | `Escape_The_Veiled_Halls.pdf`; loot tables on printed pages 6, 8, 10, 12 |

Each kit holds `image-context/` (prompts, item files, style references), `FINAL-ART.md`,
`final-art-registry.json`, an empty `images/` and `card-text-audit.md` (lr, vh). The record drafts live
here: `ph-draft.json`, `lr-draft.json`, `vh-draft.json` (English verbatim from the PDFs, Russian
filled in batches B0-*), with `ph-translation-notes.md`, `lr-translation-notes.md`,
`vh-translation-notes.md` and `reviews/` (reports per batch). `lr-audit.md` and `vh-audit.md` copy each kit's card-text audit.

Text extraction: `pdftotext` in `C:\tools\poppler\poppler-26.02.0\Library\bin`.

## Product links (owner)

- ph Vol 1: https://www.drivethrurpg.com/en/product/547537/pistolheart-volume-1
- ph Vol 2: https://www.drivethrurpg.com/en/product/564429/pistolheart-volume-2
- ph Vol 3: https://www.drivethrurpg.com/en/product/578612/pistolheart-volume-3
- lr: https://heartofdaggers.com/products/the-last-round-table/
- vh: https://heartofdaggers.com/products/escape-the-veiled-halls/

They go to the help box of each source (`docs/decisions/2026-09-19-the-product-link-lives-in-the-roll-tabs.md`),
both README source tables, `llms.txt` and the `url` of each rules card.

## Settled decisions (owner)

- ph, 2026-10-29: a weapon is a four-record `eq.line` (`<Name>`, `Improved <Name>`, `Advanced <Name>`,
  `Legendary <Name>`; Russian `Улучшенный`, `Продвинутый`, `Легендарный`) with one shared picture; the nine
  Infusions ship as items; one source `ph` with the volume kept per record; War Saddle keeps "Yah!" as printed
  and the mounted-rules card names Charge and Yah!.
- ph, 2026-11-05: roll numbers in book order "the same way as Arazo's Artifacts" (one pool, a line's rungs after
  its head); ids `ph1`-`ph93` equal the rolls.
- lr, 2026-11-05: the Fruitcake and the Deed are cut to a card plus a rules card (`lr-fruitcake`, `lr-deed`);
  three rules cards in all (`lr-recipes` too). Owner, 2026-11-05: no record for the Mournguard Mark Badge and
  the four letters (lore, no rule effect), so no 27th picture; one roll pool of 26 in book order (as ph and Arazo).
- vh, 2026-11-05: the printed per-room rolls stay (a record has `room` and its roll inside the room's table, as
  an mwt record has a realm); Remembrance Potion is `craft`-linked to Major Remembrance Potion and Foresight
  Potion to Legendary Foresight Potion.
- 2026-11-05: the work starts after task 57 is closed and squashed onto `main`.

## Source facts

### ph (93 records)

Vol 1: 9 primary weapons x 4 tiers = 36. Vol 2: 4 primary + 3 secondary weapons x 4 = 28, 3 items, 4 consumables.
Vol 3: 4 armor (one tier each), 3 consumables, 6 magic saddles, 9 Infusions. Book order is the roll order.
All 93 feature texts match the PDFs word for word; all 16 lines match the printed tier rows. Book typos
fixed in the draft: "Very close", "d10 +9", "d6+1phy", "d4+3phy"; Foal .44 Revolver prints `d6` at Tier 1.
Four catalog rules cards (`ph-mounted`, `ph-saddles`, `ph-infusions`, `ph-most-wanted`), each linked to the
DriveThruRPG page of the book that prints it. Settled terms and the review verdict: `ph-translation-notes.md`,
`reviews/B0-ph.md`. Volume 3 says "Yah! (PHv1, pg7)" where Volume 1 says Charge; the table name Lever-Load
Rifle wins over the art caption.

### lr (26 records, 3 rules cards)

11 magic items, 3 weapons (Witch's Skillet, secondary, summoned by the Alewife Almanac; Loathsome Lute and Paddle of
Rising Ferment, Tier 2 primary), 12 consumables. Each weapon is one Tier 2 record, no line. The weapons carry
their features only; items carry the first description sentence and the rules. Rules cards: `lr-recipes`
(Learning Recipes and the table of seven recipes), `lr-deed` (the two actions and the Mood rules; depends on the
Living Pub Mood countdown of the Environments section), `lr-fruitcake` (the four outcomes and Impaired).
Longest card 590 characters. Book typos: "Almenac", "social roles" (kept), "it's" (in a rules card), "unsettingly"
(kept), "an Difficulty 12" (fixed). See `lr-audit.md`.

### vh (15 records)

Four room tables: Basement (d4), Dressing Room (d4), Laboratory (d3), Library (d4). 6 items, 9 consumables,
no equipment. All texts one to three sentences, longest 184 characters. The Demonic Book's hyphens are lost in
the PDF text layer (1-6, 7-9, 10-12 on the printed page). See `vh-audit.md`.

## Verified facts

- Every English text of the three drafts was matched against its PDF text (typo fixes and footnote markers aside).
- No name or id of the 93 ph records collides with an existing record; `tests/dataint.js` pins the total at
  1459 and the final count is 1459 + 93 + 26 + 15 = 1593 when all three sources land.
