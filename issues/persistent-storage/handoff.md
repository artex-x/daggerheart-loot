# Handoff - TASK persistent-storage
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (programme roadmap). Every release before `ai-mcp`
  has shipped; the directory closes with `ai-mcp` (`plan.md` section 9).
- Last agent: implementer (2026-11-12: roadmap refresh, docs only)
- NEEDS_HUMAN_CONFIRMATION: no (decisions 1-41 answered, `plan.md` section 16)
- Branch: `claude/57-debt` (refresh); the releases are on `main`
- Next: `ai-mcp` (the owner lifted its postponement on 2026-11-12); its plan
  and handoff are `issues/ai-mcp/`.

## Completed
- Releases R0, R1, R2, R5, R5b, R11, R3, R4, R4b, R6, R7-R7h, R8, R9 and the
  tasks between them (`process-guards`, `display-settings`,
  `limits-follow-overrides`, `e2e-import-slowdown`, `scale-challenge`,
  `print-snapshots`, `debt-cleanup`): closed; each task directory was
  retired in its closeout commit. The per-release rows are in `plan.md`
  section 9; the closeout records of R1, R2, R5, R5b, R6 and R4b are in
  section 16.
- `persist-review`: closed 2026-10-23, `0b73fd5c`.
- R10 `persist-10-legacy-removal`: closed 2026-10-28, `e02364d3` (browser
  lists, the move and the `#/l/` page removed; account lists read by heads).
- `cloudflare-pages`: landed 2026-10-28, `d0fd98bc` (the site on Cloudflare
  Pages; the old host forwards).
- `catalog-filter-links`: closed 2026-10-29, `f74eae09` (the Items filter of
  `#/homebrew` in the address).

## Verification
- Docs-only refresh: `rtk npm run check:fast` (result in the refresh commit's
  closeout summary).

## Next batch (implement-ready)
- None in this directory. `ai-mcp` is next: `issues/ai-mcp/handoff.md`.

## Blockers
- None.

## Deferred
- The owner's R0 device checks (install prompt, no preload warning after
  the upgrade): `plan.md` section 17.
- Ideas the owner set aside for after v1: `plan.md` section 17.

## Notes
- Mocks path: none this pass.
- Screenshot findings: none (no issue, no screenshots).
- Cleanup performed / retained artifacts: the 2026-11-12 refresh replaced
  `Status`, `Completed` and `Next batch` and updated the `plan.md` status
  block and section 9 rows; the last commit before it is `5f949327`.
- Closeout: when `ai-mcp` ships, audit this directory against
  `.claude/skills/handoff/SKILL.md` and delete it in that closeout.
- Session end partial progress (if any): none.
