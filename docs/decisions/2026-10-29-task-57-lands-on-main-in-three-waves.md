# 2026-10-29 - Task 57 lands on main in three waves

- Task: `57` (owner, 2026-10-29: release in three waves, no owner screenshot gate, the wave squash content, the interim mix).
- Decision: task 57 lands in three squashes onto `main`: wave 1 after batches 1, 1b and 2, wave 2
  after batches 3 to 7, wave 3 after batches 8, 9, P and 10. Each squash follows the last batch
  review of its wave and a green CI run of the branch tip; `claude/57` then merges `origin/main`
  and carries on. `issues/57/` goes onto `main` with each squash; the closeout deletes it there.
  One post-release live check runs after wave 3 and covers all three waves.
- Decision (interim mix): an inconsistency between batches is accepted when a planned later batch
  removes it; the option with less work is taken and that batch is named (the gold default chips
  beside the neutral switches between waves 1 and 2, removed by the surface batches).
- Rejected: one squash at closeout (the system changes wait weeks for the pages); a landing per
  batch (a review and a squash per batch); an owner screenshot review per wave (the owner checks
  the live site after release); `issues/57/` left out of each squash (a squash commit that its own
  comments and specs cannot resolve).
- Amends "A task branch pushes every batch; a green CI run of the same tree gates main" (2026-10-21): for task 57, three squashes.
