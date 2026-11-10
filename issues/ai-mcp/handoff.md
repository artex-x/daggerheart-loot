# Handoff - TASK ai-mcp
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (B0 and B1 implement-ready; neither waits on an owner answer; B1's publication and squash wait on B0 and the owner's review of the rights audit table)
- Last agent: planner
- NEEDS_HUMAN_CONFIRMATION: no (Q1-Q7 settled; Q6 = C and Q7 = A on 2026-11-10)
- Branch: claude/roll-per-line (no task branch yet; the orchestrator cuts `claude/ai-mcp` from `main` before B0 or B1)
- Base / starting commit: 342c91c4
- Pushed: no

## Completed
- Batch name/id: plan refresh for the owner decisions of 2026-11-10 (Q1, CORS, licenses, publication, issue 72, two entry points, Q6 = C, Q7 = A).
- What shipped: `plan.md` Status, "Plan refresh 2026-11-10 (owner decisions)", one sub-bullet per change: no `format=` and no published mapping; CORS on `/api/v1/*`; B0 (license statement and per-record rights audit, new); B4 dropped; section 3.8 and D2; section 8 as the announcement after B1 is live; section 11 (the v1 freeze); `rights.license` from the build-time table `docs/rights/records.json`. `context.md`: every owner decision under "Decisions already settled", the license sources.
- Files changed: `issues/ai-mcp/plan.md`, `issues/ai-mcp/handoff.md`, `issues/ai-mcp/context.md`.
- Previous sha (batch diff base): 342c91c4
- Deviations and rationale: Q1 is recorded in D3 (the contract decision), not D1. The field is `rights.license` (American spelling, 2026-10-29 decision). The audit and the statement alignment are one batch: no split criterion applies (same gates, same landing with B1's squash), and the owner's review follows the commit. Planner defaults kept from Q6's option A: `preview/` in the MIT code list and a Russian-text credit by the sources of the `README.md` "Sources" table (plan-B1-2-R1). No production code written.
- Review: required before B1 (trigger: a public contract change; a product-law change), report issues/ai-mcp/reviews/plan-B1.md (fix-then-continue, findings applied). Second look: issues/ai-mcp/reviews/plan-B1-2.md (verdict incomplete, findings final), findings applied once (`plan.md` Status, "Plan review findings applied: reviews/plan-B1-2.md"). Third look: issues/ai-mcp/reviews/plan-B1-3.md (fix-then-continue), findings applied once (`plan.md` Status, "Plan review findings applied: reviews/plan-B1-3.md"); no further look. CORS falls under the same trigger; B0 fires the batch-review trigger (an agent definition; `llms.txt`).

## Verification
- Commands run (exact): `git grep` for the license statement copies; a Node count of `data.js` records per `src`; WebFetch of https://darringtonpress.com/license/, the DPCGL 2.0 PDF and https://www.daggerheart.com/srd/; `pdftotext -layout` of `DH_SRD_2_2026_08_25.pdf` (session scratchpad) and a name search for frame, Core and Hope & Fear records; `git grep` for the filter and search composition in `app/src/`.
- Results: `LICENSE` is the only copy with the SRD 1.0 notice and Hope & Fear outside; no copy names the campaign frames; `tests/derived.js` never reads `LICENSE` or the terms pages. The name search is inconclusive (239 of 367 Core names found), so B0 audits by text and stats. `core` 367, `hnf` 283, `frame` 95 records (745 to audit).
- Gates: none (planning only).

## Next batch (implement-ready)
- Name: B0 - License statement and per-record rights audit. B1 (API core and REST v1 reads) is also implement-ready and does not wait on B0; either may go first.
- Objective: one license statement in every copy, `LICENSE` included, and the stored, checked table `docs/rights/records.json` giving each record its `rights.license` from a per-record SRD 2.0 audit; D5.
- In scope: `plan.md` section 6, B0, "In scope".
- Out of scope: the ten non-DRP sources (one `owner` row each, no per-record check), the footer and terms text, `data.js`, `apiRecord.ts`.
- Files expected: `docs/rights/records.json`, `LICENSE`, `README.md`, `README.ru.md`, `llms.txt`, `tests/derived.js`, `.claude/agents/add-source.md`, D5 under `docs/decisions/`, `docs/DECISIONS.md`.
- Steps: `plan.md` section 6, B0, steps 1-11 (step 2's match rule is the full audit procedure; the user-level skill `anthropic-skills:daggerheart-source-audit` supplies only terminology when the session lists it; the PDF stays in a scratch directory).
- Acceptance criteria: `plan.md` section 6, B0, "Acceptance criteria".
- Verification commands: `node tests/derived.js`; `node tools/decisions.js`; `rtk npm run check:fast` (Bash timeout 600000); push and CI.
- Review: required (trigger: an agent definition changed; llms.txt), report issues/ai-mcp/reviews/B0.md. Gate cost about 55 min: the commit (about 20 min), the review run (about 15 min, estimate) and the follow-up commit that sets `reviewed` (about 20 min).
- B1 verification: `plan.md` section 6, B1, "Verification commands".
- B1 review: required (trigger: a public contract; a hook; tools/check/; a package.json check script), report issues/ai-mcp/reviews/B1.md. B1 gate cost about 47 min with the review run; the merge-back commit of the mid-task landing about 23 min. Total gate cost of the plan: about 3 h 30 min (`plan.md` Status; the B2, B3 and B5 figures exclude their reviews).
- Risks / do-nots: do not commit the SRD PDF or its text; do not mark a record `dpcgl` from its name or source; do not change the verbatim notice; do not set `reviewed`.
- Fallback (optional): none.

## Blockers
- B0, B1 implementation, B2: none.
- B1 publication and squash: B0 committed, the owner's review of `docs/rights/records.json` (its `reviewed` date set on the owner's word; the orchestrator confirms the date before the squash), B1's approving batch review and a green CI run of the tip (`plan.md` section 6, B1, "Landing mid-task"; D6).
- B3: the owner's CPU readings of B1/B2 (`deployment tail`).
- No batch or gate waits on the Charkeeper author; the issue-72 announcement is an owner step after B1 is live.

## Deferred
- `plan.md` section 10 (Pages CORS on `/apidata/*`: recommended to accept).

## Notes
- Mocks path: none (B0-B3 change no screen; B5 designs its screen when expanded).
- Screenshot findings: none.
- Cleanup performed / retained artifacts: the SRD 2.0 text extraction and measurement scripts are in the session scratchpad only.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): none; D1-D3, D6 and the CORS rule go to their homes in B1, D5, the audit table and the license copies in B0.
