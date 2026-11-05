# Handoff - TASK roll-per-line

## State

Planned, nothing implemented. Branch `claude/roll-per-line` from `main` at `b6f153a5`. Nothing committed.

## Start gate

Do not start until `new-items` is closed (directory deleted, squash on `main`). Then follow "Start gate" in `plan.md`.

## Next batch

B1 (see `plan.md`). Sonnet implements, Opus reviews. Pass `TASK: roll-per-line`.

## Checks to run

`node tests/run-all.js dataint,derived,contracts`, `rtk npm run check:fast`, then CI.

## Blockers

The `new-items` task. Task 57 is also open at the time of writing; its closeout comes first.
