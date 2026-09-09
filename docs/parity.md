# Parity runbook

Use this loop while reproducing the shipped static app in the Svelte rewrite.
Coverage ownership and harness design live in `docs/specs/COVERAGE.md`; current
migration debt and ordering live only in `issues/47/plan.md` and
`issues/47/handoff.md`.

## Contract

- Treat the shipped root as the expectation and `dist/` as the candidate.
- Compare rendered/computed results, not source intent.
- A state is a route plus the interactions required to reach it.
- Exercise every registered state in both languages at 1100, 768, and 375 px.
- Expect zero pixel difference. `VISUAL_DEBT` is explicit debt, not tolerance;
  ratchet it down and delete it when paid.
- Record deliberate accessibility improvements in `ACCEPTED` with a reason.
- A whole-page percentage cannot see a control-sized defect. A wrong font size
  on one line of a 1100x900 screen scores about 0.09% - under `JITTER`, so the
  state reports as matching. Before writing "antialiasing", "rasterisation" or
  "line-wrap" as a reason, measure the thing itself: the computed type, the
  text content, and the advance of the run, in both apps. A reason that names
  rendering noise is only allowed once a measurement at that level has been
  taken and recorded.

## Before a run

Build the rewrite:

```text
npm run build
```

Every parity invocation clears `test-output/parity/`. Copy evidence needed for a
review or later session into the task directory before the next run.

## Register the state first

Add every new interactive surface to `STATES` in `tests/parity/specs.js` in the
same change. Include its `id`, `route`, and, where relevant, `enter`, `whole`, or
`pending`. Use localized visible names for controls. Add a nonvisual spec when a
person depends on state pixels cannot prove, such as title, URL, clipboard
content, or accessible name.

Use `pending` when the rewrite cannot reach a state yet. Use `VISUAL_DEBT` with
a precise reason when it renders but does not match. Never omit the state: an
absent state is invisible to the harness.

## Focused loop

Filter by any substring of the expanded state id:

```text
node tests/parity.js "modal 375"
node tests/parity.js "voa @ en"
node tests/parity.js "@ ru 375"
```

For one state at a time:

1. Open its diff image in `test-output/parity/`.
2. Inspect computed sizes and positions in both apps.
3. Find the source rule, token, or design value; do not measure by eye or round.
4. Re-run the focused case.
5. Lower or remove `VISUAL_DEBT` only when the result proves it.

A correct missing element can temporarily increase the diff. A made-up element
can score better by displaying less wrong content. Reproduce the original; the
metric is evidence, not the product specification.

After focused cases pass, run the full required parity suite:

```text
node tests/run-all.js parity
```

Record the command and result in the task handoff.

## Machine variance

When output looks machine-specific, first run an unchanged baseline on the same
machine. Do not replace established debt values with local drift. For a large or
unexpected diff, reproduce with the same Puppeteer arguments and inspect page
bounds, scroll position, fonts, artwork readiness, and computed styles.

## Harness invariants

- Give every state a fresh document; hash navigation alone does not reset state.
- Wait for lazy artwork and active animations, not a fixed timeout.
- Capture the intended state before unrelated toasts or transient UI appear.
- Give specs that press controls their own page.
- Do not fake determinism for random output; test the stable surrounding shape.

## Done

- All new interaction states are registered.
- Focused and required full checks pass.
- Visual debt moved toward zero; every remaining entry has a current reason.
- Every `ACCEPTED` difference is intentional and explained.
- The handoff records exact commands, results, and retained evidence.
