# Refactor: vanilla JS to Svelte + TypeScript

Done. Task 47 (the Svelte + TypeScript rewrite) closed 2026-09-17 at
`23c00a6` (R0c), which deleted the static root (`index.html`, `app.js`,
`style.css`), the legacy browser suites and the parity harness that compared
the rewrite against them, and rewrote every document so no present-tense
instruction names a file it deleted, and its closeout (`5dcce33`/`d78b60f`).
The task's own documents (`plan.md`, `context.md`, `handoff.md`, `sweep.md`)
had their durable content moved to permanent homes and the directory
retired; the closing record itself is `git show
92d6a4b:issues/47/handoff.md` (`92d6a4b` is the last commit on `main` before
the directory's own retirement).

- **[`docs/specs/DEBT.md`](specs/DEBT.md)** holds the live defects the
  rewrite reproduces on purpose, the live decisions kept over the rewrite's
  own, and the R0c sweep's divergences owed a decision at Phase 8, plus a
  "Routed elsewhere, not paid" section for the phase-8 work that was costed
  as its own ticket instead of filed here.
- **[`docs/specs/COVERAGE.md`](specs/COVERAGE.md)** holds where every deleted
  suite's assertions went, the structural goldens that replaced the
  pixel-diff harness, and the design rationale behind both (why the
  replacement is text, not pixels; the golden format and its measurements;
  the R0c sweep's own findings).
- **[`docs/DECISIONS.md`](DECISIONS.md)** holds the decisions the migration
  made that outlive it - Playwright ("not now"), the sweep's own dispatch as
  a read-only reviewer-role pass, and the rest.

Phase 8, the post-migration review, ran under this repository's own workflow
against the register `DEBT.md` and `COVERAGE.md` handed it, and is itself
done and retired. Standing rules that outlive the migration are in
`CLAUDE.md`; behaviour is in `docs/specs/*`.
