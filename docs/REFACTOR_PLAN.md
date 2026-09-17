# Refactor: vanilla JS to Svelte + TypeScript

Done. Task 47 (the Svelte + TypeScript rewrite) closed at R0c, which deleted
the static root (`index.html`, `app.js`, `style.css`), the legacy browser
suites and the parity harness that compared the rewrite against them, and
rewrote every document so no present-tense instruction names a file it
deleted. `issues/47/plan.md` retired in the same closing change - it was the
design and phase-status record while the migration ran, and its durable
content moved to permanent homes before it went:

- **[`docs/specs/DEBT.md`](specs/DEBT.md)** holds the live defects the
  rewrite reproduces on purpose, the live decisions kept over the rewrite's
  own, and the R0c sweep's divergences owed a decision at Phase 8.
- **[`docs/specs/COVERAGE.md`](specs/COVERAGE.md)** holds where every deleted
  suite's assertions went, and the structural goldens that replaced the
  pixel-diff harness.
- **[`issues/47/handoff.md`](../issues/47/handoff.md)** holds the closing
  record (commits, gates, CI) and "Phase 8 opening inputs" - the register,
  the goldens, the backlog and the review design Phase 8 needs to start
  without re-deriving them.

`git show <sha>:issues/47/plan.md` (any commit up to and including
`fdd015f`, the last one that has it) recovers the full pre-retirement design
and batch-by-batch history, if a decision's original reasoning is ever
needed beyond what moved to the files above.

**Phase 8**, the post-migration review, runs under its own issue once the
owner files it, against the register `DEBT.md` and `COVERAGE.md` hand it.
Standing rules that outlive the migration are in `CLAUDE.md`; behaviour is
in `docs/specs/*`.
