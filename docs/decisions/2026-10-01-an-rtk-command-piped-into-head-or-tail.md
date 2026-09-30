# 2026-10-01 - An RTK command piped into head or tail is denied when RTK bounds it

- Task: `rtk-pipe-deny` (the owner approved the deny on 2026-09-30; the
  planner set its families from measurement on 2026-10-01).
- Decision: `bash-guard.mjs` rule 2w denies `git status`, `git log`
  without a patch flag, `git branch`, `git worktree list`, `ls`, `cat`,
  `grep`, `rg`, `vitest` without `--coverage`, `prettier` and `eslint` in a
  pipe stage whose next stage is `head` or `tail` (`.claude/README.md`,
  "Hooks").
- Rejected: `git show` and `git diff` (RTK removes 2-31% and never
  truncates: a 50-line `head` becomes a 24-71 KB read); `npm run <script>`
  (RTK strips only npm's own lines); a `--coverage` vitest run (RTK drops
  the coverage table); `git.exe` (RTK never rewrites it); `grep`/`rg` with `-l`, `-c` or `-o` (`rtk grep --max` does not cap them); a pipe into any
  other program (it filters, and dropping it raises the output).
- Evidence: 563 of 12,852 Bash commands from 2026-09-23 to 2026-09-30
  match; the rejected git, npm and coverage shapes are another 102.
