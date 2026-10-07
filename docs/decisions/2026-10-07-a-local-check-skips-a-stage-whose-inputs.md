# 2026-10-07 - A local check skips a stage whose inputs match its last local pass

- Task: `check-cache` (owner, 2026-10-07: tool caches and stage skipping, CI uncached; mechanism by the planner).
- Decision: `npm run check` runs its stages through `tools/check/run.mjs`, which skips the typed lint,
  the typecheck, the hook selftest and vitest when a key of the stage's inputs (the git index view of
  the commit gate, the command, Node, the platform) equals a key of its last local pass. Prettier and
  the untyped half of ESLint use their own `--cache`. All caches live in `node_modules/.cache/`. Stages
  run one at a time. CI and `CHECK_CACHE=off` run every stage cold (`.claude/README.md`, "Run a long check").
- Rejected: `eslint --cache` over the typed files (a type change in one file changes another file's
  result, and the cache does not see it); wireit (globs hash ignored trees unless excluded, 16 parallel
  scripts by default, stdout replay undocumented, a new dependency); Turborepo (a native binary,
  telemetry on, strict env mode drops the variables the hooks read, 10 tasks at once); parallel stages
  on this 4-core 15 W laptop (CPU and commit-limit bound); merging the seven `node --test` calls (0.1 s
  saved one at a time, 1.8 s at two); one stage store shared by every worktree of the repository
  (owner declined on 2026-10-07; each checkout keeps its own store).
- Amends "A green check arms the commit gate by its own exit, not a host-wide lock" (2026-09-27): a skipped stage counts as passed.
- Accepted trade-off: a missed input gives a local false green; the guards in `tools/check/lib.test.mjs` and CI bound it.
