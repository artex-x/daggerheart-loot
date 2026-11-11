# Plan - TASK errata-audit

## Status

- Mode: A (first pass, 2026-11-11).
- Batches: B1 implement-ready; no other batch. B2 exists only if the owner picks a
  rule-card option in O5 (section 6).
- NEEDS_HUMAN_CONFIRMATION: yes - O1-O5 (section 5). Each has a recommended default; with the
  owner away the orchestrator takes the default and logs it (memory "Owner AFK").
- Plan review: not required (no trigger fired). B1 changes no id, route, count, migration,
  write path or stored shape; `data.js` values are not a frozen contract (`docs/specs/CONTRACTS.md`).
- Batch review: B1 fires "generated artifacts changed" (`data.json`, `catalog.csv`, `i/*.html`).
- Total gate cost: one batch - `rtk npm run check:fast` (215-480 s), four golden shards
  re-seeded (100-290 s each) or CI's text, one CI run (about 15 min), one review. About
  35-45 min of gates. No split, so no second CI run and no second `check:fast`.

## 1. Current state and objective

A report says the Revolver `f37` prints `d6+1`; the Core errata (NEW p. 317) replaces
the d6 with a d8. The owner's Core book is a pre-errata printing, which is where `d6+1`
came from. The task audits every `eq` record (778) against its source and the errata
(Part 1), and reviews the catalog for rule or reference cards and wording (Part 2).
The audit is done; its full result is `context.md`, "Audit result (Part 1)" and
"Part 2 findings". This plan fixes what the audit found.

No screenshots or mocks: no screen changes its layout.

## 2. Scope and non-goals

In scope: the two errata defects (Revolver line, Sledgehammer); the owner-decided
source corrections O1-O4; one provenance register for every departure outside
Vault of Ages 4; the Vault of Ages version line in the help text; guards in
`tests/derived.js`; regenerated outputs and goldens.

Non-goals: rebalancing anything (Arazo stays as decided, MWT keeps printed stats);
Russian re-translation beyond the changed sentences; flavor text; the combat
wheelchairs of SRD 2.0 (not catalog loot, named to the owner); the older Godsvale
archive cards; any change to `refs` unless O5 picks it.

## 3. Existing behavior and code paths

- `data.js` is canonical; `node tools/build.js` writes `data.json`, `catalog.csv` and
  `i/*.html`. The stat line comes from `eq` (`app/src/lib/` statline code, the share
  card `tools/share-card.mjs` at runtime); no picture shows a stat, so `img/` and `og/`
  do not change.
- `sets['saints-ensemble']` holds the set bonus once; the three members carry `set`.
- `tests/derived.js` holds the source rules: "frame equipment", `cls === dt` for
  `voa`, `dread`, `frame`, the Saint's Ensemble membership, `WOND_TIER`, Arazo pins.
- `docs/provenance/voa4-errata.md` registers every Volume 4 departure; its own text says
  a later book version is diffed against it.
- `app/src/lib/help.ts` lines 209 (RU) and 238 (EN) say "Volumes 1-3 at v1.5, Volume 4
  at v1.0"; the shipped Volume 3 matches v1.6.

## 4. Architecture approach

Data and documentation only, plus one help string pair. No new module, export or
component. The register is a new file because the departures span seven sources and
`voa4-errata.md` is scoped to one book; it reuses the `voa4-errata.md` table shapes.
Decisions go to `docs/decisions/` (template `.claude/templates/decision.template.md`),
then `node tools/decisions.js`.

Settled by the planner (recorded): `docs/decisions/2026-11-11-errata-over-srd-2-over-the-printed-book-for-darrington-equipment.md`
- errata, then SRD 2.0, then the printed book. Consequences: Buckler `q280` keeps the
errata text; the four editorial fixes (dve7, dve9, di3, di5) stay and get register rows.

## 5. Owner decisions

O1. Vault of Ages Volume 4 source version.
- Current: the 21 `voa4_*` records, the set and the register follow v1.0. A reader sees
  voa4_t2a d8+5, voa4_t3e d10+10 and the Saint's Ensemble +1 Evasion on every device.
- A (recommended): move Volume 4 to v1.2. The author fixed his own book; the register was
  written for this diff. Changed values: voa4_t2a d8+4, voa4_t3e d10+7, Saint's Ensemble
  +2 Evasion, voa4_t4g magic damage, and the text lines in `context.md`, "VoA4 v1.2
  changes". Trade-off: about fifteen records change text in two languages, and the
  register is rewritten.
- B: stay on v1.0. No change; the register stays true. Trade-off: the catalog prints values
  the author has withdrawn.

O2. Vault of Ages Volumes 1-3: the description page against the card sheet.
- Current: 23 of 24 records follow the page; voa3_t4a follows the card (magic damage,
  "Neural Spike"). Eight records differ from their cards (`context.md` table). Jolt Bracers
  and Skull Lord's Key say "Once per long rest"; both versions print "Once per day".
- A (recommended): the page wins for Volumes 1-3, as for Volume 4. voa3_t4a becomes
  physical (`dt` and `cls` `phy`) and "Psionic Spike" / «Псионический Шип», after the
  implementer re-reads PDF p. 7. The eight card readings and the two "per day" lines
  become register rows; the "per long rest" text stays (a day is not a Daggerheart
  timing). Trade-off: Cerebral Spike changes its class chip from magic to physical.
- B: keep voa3_t4a as it is and register it as "card over page". Trade-off: the rule for
  Volumes 1-3 cannot be stated in one line.

O3. lr12 Paddle of Rising Ferment class.
- Current: `cls: 'phy'`; the equipment table files it under Physical.
- A (recommended): `cls: 'mag'`, `dt` stays `phy`. The book prints it under "Tier 2 Magic
  Weapon", and class is the table the book prints a weapon in (`app/src/lib/help.ts`,
  the Dragon's Vault precedent for Nature's Fall). Trade-off: a Strength weapon with
  physical damage shows in the Magic filter.
- B: keep `phy` and register the header as a book defect. Trade-off: the filter departs
  from the printed class.

O4. mw87 "Add your Agility to your Armor Thresholds."
- Current: English prints the card's "Armor Thresholds"; Russian says «Порогам Урона»
  (damage thresholds). The two languages name different things.
- A (recommended): English "damage thresholds", one register row. The game has no armor
  thresholds, and RU/EN parity requires one fact. Trade-off: one MWT text line departs
  from the card; the MWT decision covers stats, not text.
- B: keep the card text and change the Russian to match. Trade-off: the Russian names a
  term the rules do not have.

O5. Rule and reference cards (Part 2).
- Current: every custom condition is defined on the record that uses it; core
  conditions (Vulnerable 49 records, Restrained 29, Hidden 8) are not defined; Ammo
  tokens appear only on the Revolver line, and the feature defines them.
- A (recommended): add no rule or reference card; keep each definition on its record.
  The same condition name carries different rules in different books (Stunned four
  times, On Fire three times, Incorporeal twice), so a shared card would merge rules
  that differ, and the print card and the share stub show no card text. Trade-off: a
  reader looks up Vulnerable, Restrained and Hidden elsewhere.
- B: one "Core conditions" rule card (Hidden, Restrained, Vulnerable, temporary), linked
  from every record that uses them (fewer than 86: the 49, 29 and 8 overlap; count in B2). Trade-off: a new B2 (data, goldens, a 3-card cap
  check per record), and the card is invisible in print.
- C: per-source condition cards (for example Dragon's Vault conditions). Trade-off: the
  card text repeats what each record already says.

## 6. Ordered batches

### B1 - Apply the errata and the source corrections (implement-ready)

Objective: every `eq` record agrees with its source and the errata, or its departure is a
register row or a decision.

In scope: the edits below; out of scope: section 2 non-goals.

Files expected:
- `data.js` (records f37-f40, f6; with O1-A the `voa4_*` records and `sets['saints-ensemble']`;
  with O2-A voa3_t4a; with O3-A lr12; with O4-A mw87).
- `data.json`, `catalog.csv`, `i/*.html` (by `node tools/build.js` only).
- `docs/provenance/errata.md` (new), `docs/provenance/voa4-errata.md` (O1-A).
- `docs/decisions/<date>-...md` for each owner answer that rejected an alternative
  (O1, O2, O5 at least), with the pointer lines both ways where one amends
  `2026-09-23-vault-of-ages-volume-4-the-source-errata.md`; `docs/DECISIONS.md` by
  `node tools/decisions.js`.
- `app/src/lib/help.ts` lines 209 and 238.
- `tests/derived.js` ("frame equipment" block and the Saint's Ensemble block).
- `tests/app/snapshots/*.txt` that hold a changed record (re-seeded, never hand-edited).
- `docs/specs/I18N.md` line 207-208 sentence, if O1-A or O2-A widens the register's scope
  (one clause: "or `docs/provenance/errata.md`").

Steps:
1. Branch: work on `claude/errata-audit` from `main` (the plan was written on a tree
   checked out at `claude/ai-mcp`; the orchestrator moves the plan commit).
2. Revolver line: in `data.js` set `eq.dmg` of f37, f38, f39, f40 to `d8+1`, `d8+4`,
   `d8+7`, `d8+10`. Leave the Six Shot text.
3. Sledgehammer f6: `ende` `−1 to Agility` -> `−1 to Evasion`; `rud` `−1 к Проворности` ->
   `−1 к Уклонению`. Keep U+2212. The line then equals the Greatsword q4 Massive line in
   both languages; compare with q4 and copy its wording exactly.
4. O1-A: re-read `VaultOfAges_Vol4_v1_2.pdf` against v1.0 for each record in `context.md`,
   "VoA4 v1.2 changes". Change `eq` values (voa4_t2a `d8+4`, voa4_t3e `d10+7`, voa4_t4g
   `dt`/`cls` `mag` if the v1.2 page prints magical) and each changed English sentence;
   write the matching Russian sentence (skill `anthropic-skills:daggerheart-ru-terms`).
   Set `sets['saints-ensemble']` to `+2 Evasion` / `+2 к Уклонению`. Rewrite
   `voa4-errata.md` for v1.2: name the v1.2 file; drop each row whose defect v1.2 fixed;
   keep each row whose defect v1.2 kept; update the Horrified rows to the v1.2 p. 5 text;
   move "Kept as printed" rows the author changed out of that table. Check the
   unconfirmed row voa4_t4a `Spellcast trait .` on the v1.2 page and drop it if not printed.
5. O2-A: open VoA3 v1.6 PDF p. 7 as an image. If the page prints `d8+10 physical` and
   "Psionic Spike", set voa3_t4a `dt` and `cls` to `phy`, the label `***Psionic Spike:***`
   and `***Псионический Шип:***`. If the page does not, stop and report.
6. O3-A: lr12 `eq.cls` `mag`.
7. O4-A: mw87 `ende` `Add your Agility to your damage thresholds.`
8. Write `docs/provenance/errata.md`: purpose paragraph (every place a shipped record
   outside Vault of Ages 4 departs from its printed source); the authority order with a
   link to the 2026-11-11 decision; tables "Errata applied" (Revolver line, Sledgehammer,
   and the earlier Glowing Rings, Spear, Longsword, Buckler, Knuckle Claws, Sweet Moss,
   Powerful Beast ref, each with the errata page), "Errata over SRD 2.0" (Buckler),
   "Text fixes" (dve7, dve9, di3, di5, mw87), "Page over card, Vault of Ages 1-3" (the
   eight records and voa3_t4a per O2), "Kept on purpose" (Jolt Bracers and Skull Lord's
   Key "per long rest", lr12 per O3). Quote at most the changed words, as
   `voa4-errata.md` does.
9. `app/src/lib/help.ts`: RU line 209 «тома 1-2 в версии 1.5, том 3 в версии 1.6, том 4 в
   версии 1.2» (1.0 with O1-B); EN line 238 "Volumes 1-2 at v1.5, Volume 3 at v1.6,
   Volume 4 at v1.2" (v1.0 with O1-B). Search `rtk grep -n "v1.5"` in `app/src` and
   `tests` for a test that pins the old string, and update it.
10. `tests/derived.js`, "frame equipment" block: assert the Revolver line damage is
    `d8+1`, `d8+4`, `d8+7`, `d8+10` by tier and f6's `ende` contains `−1 to Evasion`,
    with a comment that cites the errata pages (Core errata, NEW p. 317 and p. 275). With
    O1-A, extend the Saint's Ensemble block: `L.sets['saints-ensemble'].ende` contains
    `+2 Evasion`. With O3-A, assert lr12 `cls === 'mag'` and `dt === 'phy'`.
11. Decisions for the owner answers (template; title 80 characters or less; amend
    pointers both ways for O1). Run `node tools/decisions.js`.
12. `node tools/build.js`; `rtk npm run check:fast` (timeout 600000).
13. `npm run build:test`, then `node tests/app/golden.js --update --shard=n/4` for n = 1 to
    4, one call each (prefix `MSYS_NO_PATHCONV=1` only with `--only`). Read
    `git status -- tests/app/snapshots`: each moved file must hold a changed record
    (Revolver, Sledgehammer, a `voa4_*`, voa3_t4a, lr12, mw87, the Vault of Ages help
    text). Or push and take CI's text (`.claude/README.md`, "CI credit").
14. Commit (Conventional Commits, `fix(data): ...`), push, wait for CI.

Acceptance criteria:
- f37-f40 show `d8+1`, `d8+4`, `d8+7`, `d8+10 phy` on the record page, the equipment
  table and the print card, in both languages.
- f6 reads "−1 to Evasion" / «−1 к Уклонению».
- Each owner answer O1-O4 is applied as answered, or as the logged default.
- O5's answer is a decision file; with O5-A no `refs` change.
- `docs/provenance/errata.md` holds a row for every departure in `context.md` that is
  not covered by an older decision or by `voa4-errata.md`.
- `docs/provenance/voa4-errata.md` names the version the records follow, and every row
  is true for that version.
- The help text names Volume 3 at v1.6 in both languages.
- `tests/derived.js` fails on a revert of each data edit of this batch.
- Each moved golden holds a changed record; no other golden moves.
- `rtk npm run check:fast` passes; CI is green on the pushed tree.

Standing checks:
1. Scale: no screen changes its layout or a collection size. States table - empty, one,
   many, at the limit, one past it, 3x, longest text, 360 px and 1180 px: `unchanged`.
   The longest changed text is a `voa4_*` sentence of about the same length as before;
   `tests/derived.js` caps only `lr` text. Proof: the re-seeded goldens and
   `node tests/derived.js` in `check:fast`.
2. Error scenarios: loading, a failed read, offline: unchanged (`data.js` is a classic
   script). No write path or stored shape changes. A stale tab or a cached `data.js`
   shows the old values until reload; nothing stored references a damage value. A list,
   a share or a print set stores ids only, so the new values show on the next read; a
   homebrew rung in the `f37` line keeps its own `eq`. Revert: the previous build reads
   the new `data.js` with no error. No data is lost.
3. Consistency: `FEATURES.md`, "Catalog style" (S1 labels, bold costs, italic conditions;
   `tools/desc-style.mjs` and `tests/dataint.js` hold it). f6's Massive line becomes the
   same string as q4's. The `cls === dt` rule for `voa` holds for voa3_t4a. lr12 follows
   the Dragon's Vault rule (class from the printed table). No page, toast, menu or verb changes.
4. RU/EN parity: every changed `ende` has its `rud` change in the same commit: f6, each
   `voa4_*` sentence, the set bonus, voa3_t4a's label, the help string pair. mw87 makes
   the two languages state one fact. Distances stay metric in Russian; ASCII punctuation
   except the catalog's U+2212.

Verification commands:
- `node tools/build.js`
- `rtk npm run check:fast` (Bash timeout 600000)
- `npm run build:test`; `node tests/app/golden.js --update --shard=n/4` (n = 1..4)
- `git status -- tests/app/snapshots`
- push; CI green (the full gate)

Risks / do-nots:
- Do not renumber an id or touch `img/`, `og/` or a roll.
- Do not hand-edit `data.json`, `catalog.csv`, `i/*.html` or a golden.
- Do not apply a v1.2 change without reading it on the PDF page; the helper list in
  `context.md` is a pointer, not the source.
- Do not reopen the Arazo rebalance, the MWT printed-stats rule, the Dragon's Vault
  entries rule, or the errata authority order.
- Put no book page text beyond the changed words into the repository (public).
- `app/src/components/record.test.ts` and `app/src/lib/share.test.ts` read real
  `voa4_a2`; a v1.2 text change there can move their expectations. Fix the expectation
  only when it quotes the record text.

Fallback: if the owner answers O1-B, step 4 is skipped and the help text keeps v1.0.

### B2 - Rule card (outline, only with O5-B or O5-C)

A `refs` card (or cards) with both languages, linked from the records that use the
conditions; a `tests/app/inventory.js` state and re-seeded goldens; the per-item card
cap checked. Planned after the owner's answer; a refresh writes its Plan review line
(a new card kind is not a contract change unless `CONTRACTS.md` lists `refs` keys).

## 7. Contracts and behavior that stay

Ids, routes, counts, rolls, `COUNT_BEARING_FILES`, `llms.txt` counts, image paths. The
record shape is unchanged.

## 8. Tests, fixtures, docs and specs

`tests/derived.js` guards (B1 step 10); goldens re-seeded; no fixture change
(`docs/fixtures/homebrew*` use the `f37` line id only, not its damage). Specs: only the
`I18N.md` register clause if a register widens. `llms.txt` holds no changed value.

## 9. Risks, assumptions, unresolved questions

- Assumption: SRD 2.0's missing Tier 3 Core magic weapons are an extraction gap of
  that PDF, not a withdrawal; the nine records match the Core book.
- The VoA3 Cerebral Spike page is an image; the helper read "physical". B1 step 5
  re-reads it before any change.
- Unresolved: O1-O5.

## 10. Deferred

- The SRD 2.0 combat wheelchairs (12 records) are not in the catalog; name to the owner,
  no task.
- The Wondrous adventure hook "Claws of Yifang (Tier 3)" against the shipped tier 4
  (pinned by `WOND_TIER`): the owner may look; no change planned.
