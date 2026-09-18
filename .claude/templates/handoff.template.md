# Handoff - TASK <id>
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress | blocked | done
- Last agent: orchestrator | planner | implementer | reviewer | add-source
- NEEDS_HUMAN_CONFIRMATION: yes | no
- Branch:
- Base / starting commit:
- Pushed: no | yes at <sha>

## Completed
- Batch name/id:
- What shipped:
- Files changed:
- Previous sha (batch diff base): the task's HEAD entering this batch - a
  reviewer reads `git diff <this> HEAD`. There is no separate "sha after
  this amend" field: the handoff is inside the commit it would name, so
  that field is always one step behind the moment it is written.
- Deviations and rationale:
- Review: required (trigger: <which>) | not required (no trigger fired) | not run (owner's decision)

## Verification
- Commands run (exact):
- Results:
- Gates: npm run check | npm run check:built | data/image/stub tests | other

## Next batch (implement-ready)
- Name:
- Objective:
- In scope:
- Out of scope:
- Files expected:
- Steps:
- Acceptance criteria:
- Verification commands:
- Risks / do-nots:
- Fallback (optional):

## Blockers
-

## Deferred
-

## Notes
- Mocks path:
- Screenshot findings:
- Cleanup performed / retained artifacts:
- Session end partial progress (if any):
- Durable items written to their homes this batch (file, section):
