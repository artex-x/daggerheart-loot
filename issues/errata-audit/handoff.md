# Handoff - TASK errata-audit
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (planned; B1 not started)
- Last agent: planner
- NEEDS_HUMAN_CONFIRMATION: no - owner answered O1-O5 on 2026-11-11: O1-A, O2-A, O3-A, O4-A, O5-A (no card)
- Branch: `claude/errata-audit` (created from the `claude/ai-mcp` tip `33d6ea59`; plan files uncommitted)
- Base / starting commit: `33d6ea59` (the tree the planner read)
- Pushed: no

## Completed
- Batch name/id: planning pass (mode A)
- What shipped: the audit of all 778 `eq` records (`context.md`, "Audit result (Part 1)"), the Part 2 review, `plan.md` with B1 implement-ready, one decision.
- Files changed: `issues/errata-audit/{context,plan,handoff}.md`, `docs/decisions/2026-11-11-errata-over-srd-2-over-the-printed-book-for-darrington-equipment.md`, `docs/DECISIONS.md` (by `node tools/decisions.js`).
- Previous sha (batch diff base): `33d6ea59`
- Deviations and rationale: three read-only helpers audited the supplements (voa/wondrous/dread; dv/ph/lr; mwt/arazo); the planner diffed Core, Hope & Fear and frames by script and re-checked the VoA4 v1.2 values.
- Review: not required (no trigger fired) for the plan; B1 fires the batch-review trigger "generated artifacts changed".

## Verification
- Commands run (exact): `pdftotext -raw -enc UTF-8` on each source; a node diff of `data.js` against the SRD 2.0 tables; `node tools/decisions.js` (324 decisions).
- Results: two unintentional mismatches (Revolver line f37-f40 damage, Sledgehammer f6 Massive); owner questions O1-O5; the rest clean or covered by a decision.
- Gates: none run (no code change).

## Next batch (implement-ready)
- Name: B1 - Apply the errata and the source corrections.
- Objective: every `eq` record agrees with its source and the errata, or its departure is a register row or a decision.
- In scope: `plan.md`, section 6, B1, "Files expected" and steps 1-14.
- Out of scope: `plan.md`, section 2, non-goals; any `refs` change unless O5 is B or C.
- Files expected: `data.js`; `data.json`, `catalog.csv`, `i/*.html` (generated); `docs/provenance/errata.md` (new); `docs/provenance/voa4-errata.md` (O1-A); decisions for O1, O2, O5 and `docs/DECISIONS.md`; `app/src/lib/help.ts`; `tests/derived.js`; moved goldens under `tests/app/snapshots/`.
- Steps: `plan.md`, section 6, B1, steps 1-14.
- Acceptance criteria: `plan.md`, section 6, B1, "Acceptance criteria".
- Verification commands: `node tools/build.js`; `rtk npm run check:fast` (timeout 600000); `npm run build:test`; `node tests/app/golden.js --update --shard=n/4` for n = 1..4; `git status -- tests/app/snapshots`; push and a green CI run.
- Risks / do-nots: `plan.md`, section 6, B1, "Risks / do-nots".
- Fallback (optional): O1-B skips step 4 and keeps v1.0 in the help text.

## Blockers
- O1-O5 wait on the owner; with the owner away, take each recommended option (A) and log it.
- The plan files sit in a tree on `claude/ai-mcp`; the orchestrator commits them on `claude/errata-audit`, not on the ai-mcp branch.

## Deferred
- SRD 2.0 combat wheelchairs are not catalog records (named to the owner).
- Wondrous hook "Claws of Yifang (Tier 3)" against the pinned tier 4 of w25.

## Notes
- Mocks path: none (no layout change).
- Screenshot findings: none.
- Cleanup performed / retained artifacts: extracted texts and helper scripts are in the planner's session scratchpad only; B1 re-extracts from the owner's PDFs (`context.md`, "Sources").
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): `docs/decisions/2026-11-11-errata-over-srd-2-over-the-printed-book-for-darrington-equipment.md`.
