# 2026-10-21 - A value list of a frozen file schema widens in place

- Task: `many-worlds-tavern` (owner, 2026-10-21, with the trait `any`).
- Decision: a new value in an enum of `homebrew-v1`, `homebrew-v2`, `import-v2` or `import-v3`
  is a widening, as a raised bound is: every file valid before stays valid, so the schema
  changes in place and keeps its `$id` and `version` (`CONTRACTS.md` section 4). A value list
  never narrows; removing or renaming a value is a new file version.
- Rejected: a new schema version for one added value (every reader and writer would branch on
  a version that changes no file written before it).
