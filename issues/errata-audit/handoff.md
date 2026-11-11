# Handoff - TASK errata-audit
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (B1 implemented and committed; not pushed; awaits batch review, push and CI)
- Last agent: implementer
- NEEDS_HUMAN_CONFIRMATION: no - owner answered O1-O5 on 2026-11-11: O1-A, O2-A, O3-A, O4-A, O5-A (no card)
- Branch: `claude/errata-audit`
- Base / starting commit: `82e5acc4` (main merged in before B1)
- Pushed: no (the dispatch said not to push)

## Completed
- Batch name/id: B1 - Apply the errata and the source corrections.
- What shipped: Revolver line f37-f40 `d8+1/+4/+7/+10`; Sledgehammer f6 `−1 to Evasion` / `−1 к Уклонению`; Volume 4 moved to v1.2 (O1-A): voa4_t2a d8+4 and `On a hit`, voa4_t2e Horrified `until the scene ends` and `can't take rolls`, voa4_t2f `deal damage to an object`, voa4_t2h `any rolls`, voa4_t2i `On a successful investigation`, voa4_t3e d10+7, voa4_t3g `an attack roll`, voa4_t4c `total Hit Points`, voa4_t4e `critical success`, voa4_t4g magical (`dt`, `cls`), voa4_a1 `death move`, voa4_a2 vault sentence removed and `against the effects`, voa4_a3 `If a spell attack` and `Once per long rest`, Saint's Ensemble `+2`; voa3_t4a physical and `Psionic Spike` (O2-A, read on VoA3 v1.6 PDF p. 7 as an image); lr12 `cls` mag (O3-A); mw87 `damage thresholds` (O4-A); O5-A no card. Help text names Volumes 1-2 v1.5, Volume 3 v1.6, Volume 4 v1.2. `docs/provenance/errata.md` (new), `voa4-errata.md` rewritten for v1.2, three decisions plus the amend pointer in the 2026-09-23 file, `I18N.md` clause, guards in `tests/derived.js`, 41 re-seeded goldens.
- Files changed: `data.js`, `app/src/lib/help.ts`, `tests/derived.js`, `docs/provenance/errata.md`, `docs/provenance/voa4-errata.md`, `docs/specs/I18N.md`, `docs/decisions/2026-11-11-vault-of-ages-volume-4-moves-to-v1-2.md`, `docs/decisions/2026-11-11-vault-of-ages-volumes-1-3-the-page-over-the-card.md`, `docs/decisions/2026-11-11-no-rule-card-for-core-conditions.md`, `docs/decisions/2026-09-23-vault-of-ages-volume-4-the-source-errata.md`, `docs/DECISIONS.md`, 41 files under `tests/app/snapshots/`. `data.json`, `catalog.csv` and `i/*.html` are gitignored build outputs, so no commit holds them.
- Previous sha (batch diff base): `82e5acc4`
- Deviations and rationale:
  - The plan's helper list was a pointer; v1.0 and v1.2 were diffed by `pdftotext -raw` and each change applied from the v1.2 page text. Changes beyond the plan's list: voa4_t4g page now prints `d8+6 magical` (v1.2), voa4_t3g and voa4_t2f clauses, voa4_a2 vault sentence.
  - voa4_t2e: the v1.2 page says `until the scene ends`, the card says `until after its next long rest`; the page wins (a "Page over card" row).
  - voa4_t4c Russian `равный вашему общему числу Ран` for `total Hit Points`; voa4_a2 `против эффектов`; voa4_t2i `При успешном расследовании`; voa4_t2e `совершать броски против источника эффекта`: wording chosen by the implementer.
  - Register rows whose defect v1.2 fixed were dropped, including the Aku-Haptlek's Tooth and Saintly Blade balance rows (audit 9, 10) and the voa4_t4a `Spellcast trait .` row (v1.0 and v1.2 print `trait.`).
  - The Core errata rows in `errata.md` name the pre-errata value only where known; Glowing Rings, Longsword, Sweet Moss and Powerful Beast say "the pre-errata" value.
  - No help-text golden moved: no snapshot holds that sentence.
  - Decisions: three files (O1, O2, O5). O3 and O4 are register rows only.
- Review: required (trigger "generated artifacts changed"); not yet run.

## Verification
- Commands run (exact) and results:
  - `node tools/build.js`: ok.
  - `rtk npm run check:fast` (VITEST_MAX_WORKERS=2): PASS in 1051 s (prettier, eslint, svelte-check 0 errors, vitest 1708 passed, bundle 275.0 kB of 276 kB).
  - `npm run build:test`: ok.
  - `node tests/app/golden.js --update --shard=n/4`, n = 1..4: each exit 0, 111 states compared per shard, structural snapshots unchanged.
  - `node tests/run-all.js contracts,dataint`: all suites passed (exit 0). `npm run lint:typed`: exit 0. `npm run lint:untyped`: exit 0.
- Moved goldens (41, each diff read; every changed line holds a changed record): `_i_voa4_t3d`, `_i_voa4_t3d_as_gm3` (Saint's Ensemble +2); the Revolver, Sledgehammer, Cerebral Spike, Saintly Blade, Unicorn Knife, Oath of Balance, Paddle, Aku-Haptlek's Tooth, Voynarian Crossbow, Epidermal Robe, Horrid Specimen, Prismatonic, Sleuth's Fedora, Narvik Contract, Flexible Plate rows in `_tables_eq_*`, `_tables_frames`, `_tables_lr`, `_tables_mwt*`, `_tables_other_frames*`, `_tables_voa*`, `_search_*` (the Magic-class count 26 to 27: Unicorn Knife and the Paddle join, Cerebral Spike leaves).

## Next batch (implement-ready)
- Name: none. B1 is the only batch (O5-A: no B2).
- Next step: batch review, then push and a green CI run, then closeout (`/handoff`): move durable items, delete `issues/errata-audit/`, squash-merge.

## Blockers
- None.

## Deferred
- SRD 2.0 combat wheelchairs are not catalog records (named to the owner).
- Wondrous hook "Claws of Yifang (Tier 3)" against the pinned tier 4 of w25.

## Notes
- Mocks path: none (no layout change).
- Screenshot findings: none.
- Cleanup performed / retained artifacts: extracted texts and page images are in the implementer's session scratchpad only.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): `docs/provenance/errata.md`, `docs/provenance/voa4-errata.md`, three files under `docs/decisions/`, `docs/specs/I18N.md` ("Rules").
