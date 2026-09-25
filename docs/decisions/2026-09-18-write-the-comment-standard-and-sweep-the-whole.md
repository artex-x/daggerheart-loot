# 2026-09-18 - Write the comment standard and sweep the whole repository to match it now

- Task: `workflow-hygiene` (human decision).
- Decision: `CLAUDE.md` gains the comment standard in the same task that
  sweeps every existing violation - untrackable citations
  (`B10-N5`, `issues/<id>/` paths, plan/handoff section references) stripped,
  verbose block comments compressed. A large diff is expected and accepted.
- Rejected: writing the rule now and sweeping later, incrementally - the
  existing violations would keep citing a task directory this same task is
  retiring, which rule 2i would then have to deny piecemeal instead of once.
