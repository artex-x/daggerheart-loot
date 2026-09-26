# 2026-09-27 - Agents read no .env file; the program loads it with `--env-file`

- Amended by "The Read and Grep tools are denied `.env` files by a hook, not only by settings" (2026-09-27): the Read deny gains a hook.
- Task: `process-guards` (owner's rule, 2026-09-26; mechanism by the planner, 2026-09-27).
- Decision: `bash-guard.mjs` denies `.`, `source` and the file printers
  (`cat`, `type`, `Get-Content` and the others it lists) on a file whose
  name starts with `.env`, and `.claude/settings.json` denies the Read
  tool on `.env` files. A script that needs a value gets it from
  `node --env-file=<file>`, so the value never reaches a transcript.
- Rejected: extending rule 2q to every `.env` token (it would deny the
  `--env-file` loader); a PowerShell parser for the file (it reads the
  file into the shell, the thing the rule stops); judging `sed`, `awk` and
  `grep` too (their first operand is a pattern, so a search for the name
  would be denied).
