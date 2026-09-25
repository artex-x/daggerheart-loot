# 2026-09-18 - Decisions live in one `docs/DECISIONS.md`, not a `docs/decisions/` folder

- Superseded by "Decisions are one file each under docs/decisions/; the index is generated" (2026-09-25).
- Task: `workflow-hygiene` (human decision).
- Decision: one register file, `docs/DECISIONS.md`, holds every decision
  that outlives the task that made it (outside behaviour, which stays in
  `docs/specs/`, and hook/tooling rationale, which stays in
  `.claude/README.md`).
- Rejected: a `docs/decisions/` directory of one file per decision - a
  single register is easier to grep and to keep a size discipline over; that
  discipline is accepted as a cost of the choice, not a reason against it.
