# 2026-09-27 - The Read and Grep tools are denied `.env` files by a hook, not only by settings

- Task: `process-guards` (planner, 2026-09-27, after a worktree probe).
- Decision: `.claude/hooks/read-guard.mjs` (PreToolUse, `Read|Grep`) denies
  a `file_path`, `path` or `glob` whose last segment starts with `.env`,
  wherever the file is; the `permissions.deny` patterns stay as the first
  line. A `./` pattern binds the session's working directory: a worktree
  session's Read of the main checkout's `.env.<name>` by absolute path
  answered "File does not exist" (a missing file, so nothing leaked),
  while the same relative Read was refused by the permission settings.
- Rejected: an absolute-path pattern (`Read(//E:/dev/...)`: one host's
  path in a committed file); a `**/.env*` pattern (its reach is not
  documented, so every host would need its own probe); keeping the gap
  as a known limitation (worktree sessions are routine here: isolated
  agents and the restore drill).
- Amends "Agents read no .env file; the program loads it with `--env-file`" (2026-09-27): the Read deny gains a hook.
