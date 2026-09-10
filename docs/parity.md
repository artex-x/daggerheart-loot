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

One parity run per tree. `tests/parity.js` writes `test-output/parity.lock`
while it runs and removes it on exit. A second parity run refuses to start
over a live lock, and `bash-guard.mjs` blocks `npm run check`, `npm
test`/vitest, `npm run build`, `check:built` and `run-all` beside one. A lock
is live only while its pid answers and its heartbeat is under fifteen minutes
old, so a killed run's lock is ignored by itself; if the block names a run
that is not alive, delete `test-output/parity.lock`. CI shards run on
separate runners and never share a lock; parallel local shards share one tree
and now refuse each other, which they always should have.

## Register the state first

Add every new interactive surface to `STATES` in `tests/parity/specs.js` in the
same change. Include its `id`, `route`, and, where relevant, `enter`, `whole`,
`timed`, or `pending`. Use localized visible names for controls. Add a
nonvisual spec when a person depends on state pixels cannot prove, such as
title, URL, clipboard content, or accessible name.

Mark a state `timed` when its `enter` raises a toast or anything else that
fades on its own clock. A timed state is arrived at afresh at every width
instead of swept on one page, so every shot is the same fixed distance from
the press rather than however far a width sweep happened to get before the
clock ran out - see "Two unstable classes" below.

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

**CI is the baseline. A local run is advisory.** A `VISUAL_DEBT` figure is
whatever the CI job measures, because CI is the gate that has to go green and
it is the one machine every contributor shares. A number taken on a development
machine may not be written into the table as though it were the baseline, even
when that machine is the only one in front of you. Settled by the repository
owner on 2026-09-09; per-platform pairs of numbers and a wider `JITTER` were
both considered and rejected.

There is also a **local ubuntu container that reproduces CI exactly**
(`tools/parity-ubuntu/`): on 2026-09-09 it matched runs `34382722764` and
`34383263349` to the hundredth on all four then-failing cells, so a figure it
measures may be written into the table. Its calibration is against a moving
target - the runner image and puppeteer's Chrome both roll forward - so re-run
the comparison in its README after either changes, and fall back to CI if it
drifts. It agrees on states whose difference is layout and **disagrees on
states whose difference is timed**: a toast that fades scores 0.00% there and
3.5% on CI, because the slower machine photographs it after it has gone. Use
CI for those.

The CI numbers are readable without pushing: `gh run view <id> --log-failed`
prints about a dozen grepped lines, and the run's `failure-output` artifact
(`gh run download <id> -n failure-output`, roughly 200 MB, expiring) carries the
whole log plus every screenshot and diff image the run produced. Download it
outside the repository.

When a local run disagrees with the table, the question is which of the two it
is, and the answer is in the size and in whether both machines agree:

- **Under about 0.3pp, and only one machine sees it: variance.** Text hinting
  and wrapping differ between platforms; a state whose diff is mostly text will
  read a little differently. Leave the table alone and say so in the handoff.
- **Over about 0.5pp, or both machines are over the recorded number: a
  defect, or a stale baseline.** Diagnose it. Both machines agreeing that a
  figure is wrong means the figure is wrong, whatever machine it was taken on.
- **A whole-page state amplifies both.** Its denominator is the whole document
  and its numerator includes every line of text below whatever moved, so it is
  the most platform-sensitive shape in the suite. `#/i/ci1 ~ whole` reads about
  half a percent higher on CI than on a Windows machine for one unchanged
  cause.
- **A state that is scrolled when the width sweep reaches it amplifies them
  further**, because the browser repositions a scrolled document on reflow.
  Expect whole percents, not tenths, between machines there.

Because the table follows CI, a local run can legitimately fail a cell that CI
passes - it fails as `стало лучше` when the local machine reads more than
`DEBT_SLACK` under the recorded figure. That is expected, and it is not licence
to edit the number. Record which cells and why in the handoff.

When output looks machine-specific, first run an unchanged baseline on the same
machine. For a large or unexpected diff, reproduce with the same Puppeteer
arguments and inspect page bounds, scroll position, fonts, artwork readiness,
and computed styles.

### Two unstable classes

Two shapes of instability turned out to have a mechanism each, not a tolerance
- found while measuring B5.1, closed in B5.2 part 0. Neither is fixed by
widening `JITTER` or `DEBT_SLACK`: both would have to grow past the size of
defect the state exists to catch.

1. **Timed states.** The width sweep opens one page, presses `enter`, and
   shoots three viewports off the same document one after another - so a
   1600ms toast is photographed at whatever distance from the press host load
   happened to leave it, and the legacy side may come from a cache written on
   a different clock. Mark the state `timed: true` and the runner arrives at
   it afresh at every width, on both sides, so every shot is the same fixed
   distance from the press. A `timed` cell that is still non-zero locally is
   the toast's own pixels, not the class - open the diff.
2. **Full-page captures.** `whole: true` rasterises the whole document in one
   `page.screenshot({ fullPage: true })`, most of it never painted before that
   call; the geometry read back byte-identical while the pixels swung
   0.00-7.31% on an unchanged build, worse under load - a capture returned
   before the raster finished, not anything the app drew. `shot(whole)` now
   retakes the capture until two in a row agree (capped at four) and a
   `geometry` spec (`only: ['#/i/ci1 ~ whole']`) records the document height
   and the rects of `.card`, `.cardpick` and `.foot` at every width on both
   apps, so "paint or layout?" is a line in the report rather than an hour
   with a scratch script. The recipe for a local red on `~ whole`: open
   `geometry` for that width first. Agreeing on both apps, with a diff image
   showing no content change, is this host's paint - re-run the one state
   (`node tests/parity.js "ci1 ~ whole"`) and write no entry, the latest CI
   shard decides. Disagreeing is a real layout difference, and the field that
   differs names it.

Neither class licenses a number from this host: owner decision 1 (above)
still stands, and a `timed` or `whole` cell only ever enters `VISUAL_DEBT` off
a CI reading.

## Harness invariants

- Give every state a fresh document; hash navigation alone does not reset state.
- Wait for lazy artwork and active animations, not a fixed timeout.
- Capture the intended state before unrelated toasts or transient UI appear.
- Give specs that press controls their own page.
- Do not fake determinism for random output; test the stable surrounding shape.
- A `timed` state is arrived at afresh at every width, not swept on one page.
- A full-page capture is taken until two in a row agree, not on the first try.

## Done

- All new interaction states are registered.
- Focused and required full checks pass.
- Visual debt moved toward zero; every remaining entry has a current reason.
- Every `ACCEPTED` difference is intentional and explained.
- The handoff records exact commands, results, and retained evidence.
