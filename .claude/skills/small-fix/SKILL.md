---
name: small-fix
description: Lightweight path for a single-file visual bug pinned to a width - reproduce it at that width first, fix, run every gate, commit. Skips the planner dispatch, context.md and review; skips no gate. Manual only.
disable-model-invocation: true
argument-hint: "<task-id> <route or state> <width>px <language>: <symptom>"
---

# Small fix

For a visual bug whose fix is one file (a component and its test, or one
stylesheet) with no public-contract, route, list-link, `data.js` or i18n
change. Anything else is the orchestrate path (`/orchestrate`). Read
`CLAUDE.md` first; it still binds, this file only shortens the route.

1. **Reproduce before proposing.** `npm run build`, then open the built app at
   the reported route, width and language - the Browser pane resized to that
   width, or `dist/index.html` from `file://`. Record the element, its
   computed value, and the expected value taken from the design node or
   Figma reference (`CLAUDE.md`, "Source and commit conventions" - open
   issue screenshots and design nodes before visual work). If it does not
   reproduce at that width, stop and report; a fix for a bug you cannot see
   is a guess.
2. **Write `issues/<id>/plan.md`, 3-10 lines**: symptom; reproduction (route,
   width, language, what was measured); root cause; the one-file fix; gates.
   It exists because `implement.prompt.md` refuses to run without one and
   `bash-guard.mjs` rule 2i guards its retirement - keep it short and cite it
   from nowhere.
3. **Write `issues/<id>/handoff.md`** with the template headings
   (`.claude/templates/handoff.template.md`); a section may be one line. No
   `context.md`.
4. **Fix the one file**, and extend its test with the reproduced state
   (component tests end with `expectNoA11yViolations`).
5. **Gates, none skipped**: `rtk npm run check`
   with the Bash timeout at 600000; `npm run check:built`, because a screen
   changed; and the golden shard(s) whose states render the touched
   component (`node tests/app/golden.js --shard=n/4`, compare mode -
   `--update` only when the change is intended, per `.claude/README.md`,
   "Batch size and the fixed cost of a run").
6. **Commit** the coherent change (Conventional Commits, author per
   `CLAUDE.md`), then close out per `/handoff`: status `done`, retire
   `issues/<id>/` in the same commit (nothing cites it), and push once - a
   small fix is still one task and one commit.

Not this path: a second file, a new state (it needs a `STATES` entry), a
contract or fixture change, or a symptom nobody has pinned to a width.
