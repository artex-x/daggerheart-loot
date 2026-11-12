# Handoff - TASK ai-mcp
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (B0 implemented and committed; B1 implement-ready; B5a and B5b design settled)
- Last agent: implementer (B0, 2026-11-12)
- NEEDS_HUMAN_CONFIRMATION: no (Q1-Q7 settled; Q8-Q11 and the R1, R7 and N10 options of `reviews/plan-B5a.md` "default taken (owner AFK)", `plan.md` section 7). The owner reviews `docs/rights/records.json` (Notes below) before B1's squash.
- Branch: claude/ai-mcp
- Base / starting commit: 8f194abd
- Pushed: no (the dispatch said not to push)

## Completed
- Batch name/id: B0 - license statement and per-record rights audit.
- What shipped: `docs/rights/records.json` (745 audited entries, 13 `owner` source rows, `audited` 2026-11-12, `reviewed: null`); the license statement aligned in `LICENSE`, `README.md`, `README.ru.md` and `llms.txt` (same covered clause, same outside list with Pistolheart, The Last Round Table and Escape the Veiled Halls, outside-record phrase, rights-holders tail, Russian-text credit by source, code folders with `preview/`); `tests/derived.js` "source citation" now reads six files and four outside clauses, and a new "rights audit" block; D5 `docs/decisions/2026-11-10-game-text-rights-follow-a-per-record-srd-audit.md` and its `docs/DECISIONS.md` line; one paragraph in `.claude/agents/add-source.md`.
- Files changed: `docs/rights/records.json`, `LICENSE`, `README.md`, `README.ru.md`, `llms.txt`, `tests/derived.js`, `.claude/agents/add-source.md`, `docs/decisions/2026-11-10-game-text-rights-follow-a-per-record-srd-audit.md`, `docs/DECISIONS.md`, `issues/ai-mcp/plan.md`, `issues/ai-mcp/handoff.md`.
- Previous sha (batch diff base): 6c0fd479
- Deviations and rationale (owner AFK, each default taken):
  - SRD source: the owner's local copy `DH_SRD_2_2026_08_25.pdf` (224 pages, sha256 55d8b92b7e58aa1da99a4a59aa77352483ef4fbda71baddb9af9bfc1f333bd2a) was read, not re-fetched; the file name and date equal the official one. Extracted into the session scratchpad only, with xpdf `pdftotext -raw -enc UTF-8`: `-layout` and the default mode interleave the table cells (the Cleaver and Sharpened Rake rows swap their stats), `-raw` keeps each table row together. Neither the PDF nor its text is in the repository.
  - Match rule: as the plan, plus a number sign kept as a token (`+1` is not `-1`; a bare punctuation strip made "+1 to Evasion" equal "-1 to Evasion"), the ligatures U+FB00, U+FB03 and U+FB04 expanded with U+FB01 and U+FB02, U+2212 and U+2011 read as a hyphen, and accents folded (Zweihaender, Moebius). Equipment matches a table row (name, trait, range, damage, burden) and the feature must end at a line end, so a feature that only starts like the SRD one is not a match; loot matches the roll number, the name and the whole row text; a tier-scaled SRD row (Revolver, Rifle, Shotgun, Lasso, Small Revolver, the monster hunting weapons and armor) covers the improved, advanced and legendary records whose tier value it gives.
  - The audit script lives in the scratchpad only (the plan lists no tool); the table is the committed result.
  - `owner` entries of the "text differs" kind carry the `page` where the SRD holds the name or the row; the test allows `page` on any entry.
  - The 29 starting items (`ci61`-`ci81`, `hi61`-`hi68`) are `owner` "text differs": the SRD names the item on a class page, the record text is site text ("Core starting item. ...").
  - `LICENSE` and `llms.txt` also carry the Russian-text credit sentence, so the four copies say the same facts; the `LICENSE` notice now uses the verbatim "©" where the old SRD 1.0 line used "(c)" (the test needs the verbatim citation).
  - `docs/specs/COVERAGE.md` lists no `tests/derived.js` blocks, so it is unchanged. `llms.txt` "License" is prose; `docs/fixtures/`, `tests/contracts.js` and `CONTRACTS.md` needed no change (`node tests/contracts.js` passes).
- Review: required (trigger: an agent definition changed; llms.txt), report issues/ai-mcp/reviews/B0.md. Earlier: plan-B1, plan-B1-2, plan-B1-3, plan-B5a applied.

## Verification
- Commands run (exact): `node tools/build.js` (the generated files were absent in the worktree); `node tests/derived.js`; `node tools/decisions.js` then `git diff --stat docs/DECISIONS.md` (1 insertion); `node tests/contracts.js`; `npx prettier --write docs/rights/records.json tests/derived.js`; `npm run check:fast` (VITEST_MAX_WORKERS=2).
- Results: `node tests/derived.js` ok ("derived files: everything matches", rights audit counts: core dpcgl 336 / owner 31, hnf dpcgl 275 / owner 8, frame dpcgl 89 / owner 6); `node tests/contracts.js` ok; decisions: 331 decisions. `npm run check:fast`: PASS in 189 s, gate credit armed (prettier, eslint, svelte-check 0 errors, tests).
- Gates: CI on the pushed tip is the full gate (not pushed).

## Next batch (implement-ready)
- First: B1 - API core and REST v1 reads (`plan.md` section 6, B1). Review: required (trigger: a public contract; a hook; tools/check/; a package.json check script), report issues/ai-mcp/reviews/B1.md; gate cost about 47 min; the merge-back commit about 23 min. B1's `tools/api-data.mjs` reads `docs/rights/records.json` at build time.
- B0's review (`reviews/B0.md`) is required before the push; the orchestrator dispatches it.
- Risks / do-nots: do not commit the SRD PDF or its text; do not set `reviewed` (only the owner does, in a small follow-up commit); do not add an `Access-Control-Allow-Origin` line to `_headers`; do not forward `Authorization` on a T0 path.
- Fallback (optional): none.

## Blockers
- B1 publication and squash: the owner's review of `docs/rights/records.json` (sets `reviewed`), B0's and B1's approving batch reviews, a green CI run of the tip (D6).
- B3: the owner's CPU readings of B1/B2. B5a: the screen mock (planner refresh), then step 1's measurement on the test project (stop rule: a client token that changes the email or the password, links or unlinks an identity, or enrolls a factor); after `migrate-test`, the `print_sets` probe of B5a's acceptance.
- No batch or gate waits on the Charkeeper or bacchus-atlas authors.

## Deferred
- `plan.md` section 10 (Pages CORS on `/apidata/*`; the account-tier items of Q8-Q11).
- plan-B5a-N12: nothing shows when the shared quota is near (about 500 users polling every 15 minutes, `plan.md` section 3.4); the usage report stays deferred in section 10 until B5b's first consumer with background sync.
- B0 finding for the owner, not fixed here: the Lasso records `f49`-`f52` read "When the target clears this condition" where the SRD 2.0 reads "would clear" (no provenance row); decide whether the record follows the SRD.

## Notes
- Mocks path: `issues/ai-mcp/mocks/` (B5a's consent page and "Connected apps", drawn when B5a is next).
- Screenshot findings: none.
- Cleanup performed / retained artifacts: scratch files (the SRD copy, its text, the audit script) only in the session scratchpad; generated files from `node tools/build.js` are untracked and ignored.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): D5 to `docs/decisions/`; the audit table to `docs/rights/records.json`; the add-source rule to `.claude/agents/add-source.md`.
- Owner review summary of `docs/rights/records.json` (step 11). Table: 745 records, 13 source rows all `owner`. `dpcgl` 700: core 336, hnf 275, frame 89. `owner` 45: core 31, hnf 8, frame 6.
  - Every `core` and `hnf` loot and consumable record (240 in all) matched the SRD 2.0 loot tables on pages 75-84 by roll number, name and the whole text; every core and hnf weapon, secondary weapon and armor except the ten below matched a table row on pages 56-74 (stats and feature).
  - `frame` `dpcgl` with page: p191 `f1`-`f25`; p192 `f26`-`f36`; p197 `f37`-`f48`, `f53`-`f56`, `f93` (Dynamite); p201 `f57`-`f92`.
  - `frame` `owner`: `f49`-`f52` Lasso line, p197, near match (the "clears" against "would clear" wording above); `f94` Hotspot and `f95` Network tether, "not found in the SRD 2.0".
  - `core` `owner`: `q140`-`q148` (Axe of Fortunis, Blessed Anlace, Ghostblade, Runes of Ruination, Widogast Pendant, Gilded Bow, Firestaff, Mage Orb, Ilmari's Rifle), "not found in the SRD 2.0" (the decision of 2026-11-11 on errata says the same: no text layer for them); `q280` Buckler, p68, near match: the record reads "available Armor Slots" (the errata, `docs/provenance/errata.md`), the SRD "available Armor Score"; `ci61`-`ci81` starting items, near matches, pages 5, 10, 14, 19, 20, 22, 24, 25, 28, 30.
  - `hnf` `owner`: `hi61`-`hi68` starting items, near matches, pages 9, 11, 26, 29. `hnf` equipment: all matched.
  - Records needing the owner's judgment: the Lasso wording (SRD or the printed book), whether the Buckler departure from the SRD keeps the errata line (it does, decision of 2026-11-11), and whether the starting items stay `owner` (the SRD names them, the site text is its own).
  - After the review: a follow-up commit sets `reviewed` (and applies any correction) before B1's squash.
