# Refactor: vanilla JS to Svelte + TypeScript

Moved. The plan, the phase status and the decisions taken while carrying it out
now live with the task:

- **[`issues/47/plan.md`](../issues/47/plan.md)** - phases, what is built, what
  every outstanding visual debt is, and why each decision was taken
- **[`issues/47/handoff.md`](../issues/47/handoff.md)** - recovery state for the
  next session: remaining batches, ordered next steps, gates, gotchas

This file is a pointer rather than a second copy: two documents describing the
same migration is how one of them starts lying. Standing rules that outlive the
migration are in `CLAUDE.md`; behaviour is in `docs/specs/*`.

R0c (issue 47) deletes the static root (`index.html`, `app.js`, `style.css`),
the legacy browser suites and the parity harness that compared the rewrite
against them, and rewrites every document so no present-tense instruction
names a file it deleted. Task 47 closes once R0c's own closeout lands - see
`issues/47/handoff.md`, "Status", for where that stands. After it:

- **`docs/specs/DEBT.md`** holds the live defects the rewrite reproduces on
  purpose, the live decisions kept over the rewrite's own, and the R0c sweep's
  divergences owed a decision.
- **`docs/specs/COVERAGE.md`** holds where every deleted suite's assertions
  went, and the structural goldens that replaced the pixel-diff harness.
- **Phase 8**, the post-migration review, runs under its own issue once the
  owner files it, against the register the two files above hand it.
