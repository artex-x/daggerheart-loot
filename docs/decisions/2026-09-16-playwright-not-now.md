# 2026-09-16 - Playwright: not now

- Task: the Svelte migration (issue 47; retired, recorded here at
  retirement).
- Decision: not adopted, by the owner's decision. Scope fence: R0c reduced
  no real-browser coverage (nine `tests/app/` suites run against `dist/`);
  only the side-by-side pixel comparison ended, and that end was
  unavoidable once the app being compared against was deleted.
- Evidence both ways: for adopting it - the states case-7 flake
  (`docs/specs/COVERAGE.md`, "app/states") was hand-rolled event waiting,
  exactly the class auto-waiting locators exist for, and two Chrome runs
  once collided on one tree with no lock between them; against - the
  driver's verbs (`media`, `computed`, `eachAt`, `settle`, drag, click-by-
  name) are bespoke to a bilingual UI and three-width sweeps, and the
  goldens are structural text, so screenshot tooling would replace nothing
  they check.
- Rejected: deciding with no data; a spike before R0c; committing to it up
  front. Still open - the heavy-run lock question beside it
  (`.claude/README.md`, "Batch size and the fixed cost of a run") weighs against the
  same driver question, since a second real-browser dependency would need
  its own guard too.
