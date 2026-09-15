# Parity runbook

Use this loop while reproducing the shipped static app in the Svelte rewrite.
Coverage ownership and harness design live in `docs/specs/COVERAGE.md`; current
migration debt and ordering live only in `issues/47/plan.md` and
`issues/47/handoff.md`; behaviour reproduced on purpose lives in
`docs/specs/DEBT.md`.

## Contract

- Treat the shipped root as the expectation and `dist/` as the candidate.
- Compare rendered/computed results, not source intent.
- A state is a route plus the interactions required to reach it.
- Exercise every registered state in both languages at 1100, 768, and 375 px.
- Expect zero pixel difference. `VISUAL_DEBT` is explicit debt, not tolerance;
  ratchet it down and delete it when paid.
- Record deliberate accessibility improvements in `ACCEPTED` with a reason.
- A live defect the rewrite reproduces on purpose is identical on both sides,
  so nothing can key it; record it in `docs/specs/DEBT.md` instead.
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

A filtered run prints `сравнено ячеек: N` on every call and fails if a filter
selected no cell at all - a zero-match run used to print nothing and exit 0,
indistinguishable from a filter that matched every state and found no
difference (issue 47, B1). On a Git Bash host, a filter containing `#/` needs
`MSYS_NO_PATHCONV=1 node tests/parity.js "..."` - without it, Git Bash rewrites
the argument into a filesystem path and the run silently matches nothing.

After focused cases pass in a migration batch, run the full parity suite:

```text
node tests/run-all.js parity
```

Record the command and result in the task handoff.

## Machine variance

**The manually dispatched CI parity job is the baseline. A local run is advisory.**
Parity no longer gates routine push, PR, or deployment runs. A `VISUAL_DEBT`
figure is whatever the CI job measures, because it is the one machine every
contributor shares. A number taken on a development machine may not be written
into the table as though it were the baseline, even
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
   the toast's own pixels, not the class - open the diff. Its legacy side is
   never served from the screenshot cache - a cached timed shot is a clock
   frozen under whatever load wrote it.
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
- Both apps are photographed under `prefers-reduced-motion: reduce`, and the
  rewrite's policy there is the live app's - two named animations off, every
  transition alive - so `settle()` waits on transitions as well as animations.

## Done

- All new interaction states are registered.
- Focused and required full checks pass.
- Visual debt moved toward zero; every remaining entry has a current reason.
- Every `ACCEPTED` difference is intentional and explained.
- The handoff records exact commands, results, and retained evidence.

## Batch size and the fixed cost of a run

The rule is in `CLAUDE.md`, "Task and session protocol": size a batch by
its gates, not its diff. This section holds the numbers behind it and the
test for where the line is.

**What a batch pays whatever its size**, measured in this repository
(2026-09-10/11, one host, recorded in `issues/47/context.md`):

| gate | idle host | loaded host |
|---|---|---|
| `npm run check` | ~165s | past the Bash tool's 600s foreground cap; a run that crosses it is backgrounded, cannot arm the commit gate, and must be re-run - not salvaged |
| `npm run check:built` | a few minutes | longer |
| `node tests/parity.js "<filter>"` | up to ~9 min for a large filter | longer, and timed states drift |
| `node tests/run-all.js parity` | ~867s single-job; 4-5 min per shard on CI's 4-way split | - |

`check:built` and the parity filters are paid once per batch; `npm run
check` is paid once per commit inside it. None of these scale with the
diff: eight paths and forty paths cost the same minutes.

**The two ways to get it wrong.**

1. *Too small.* A batch that adds one port and one harness verb still pays a
   check, a `check:built` and a filter run - most of an hour on an idle
   host for a change a reviewer reads in five minutes. Three such batches
   pay three times what one would.
2. *Too big.* A batch whose `npm run check` cannot finish inside one
   foreground call on the host as it is, or whose review cannot be held in
   one pass, forfeits everything when the host stalls: B5.3 (26 paths)
   needed six check attempts under load; B5.4a (43 paths) lost two sessions
   to a loaded host between "written" and "step 10 green". The cost of a
   stall is the whole run again, plus the review and the one remediation
   cycle the protocol allows.

**The test.** Merge two pieces of work when they share a component, a seed
and a parity filter - then the filter run for the merged batch costs what
it would for either alone, and nothing is paid twice. Keep them apart, or
cut a batch, at any of these:

- a public-contract change (`CONTRACTS.md`, `docs/fixtures/`,
  `tests/contracts.js`, `llms.txt` in the same commit) - it needs its own
  commit and its own review;
- a different route and filter set - the parity cost is not shared, only
  serialised, so merging saves a `check` and nothing else;
- a commit boundary the harness cannot reach (a state that needs a driver
  verb or a seed that does not exist yet) - the piece that adds the
  reach lands first, on its own commit, so a later red bisects;
- a batch that could not end on a coherent committed boundary - half a
  surface on screen with faked controls is never a stopping point
  (`CLAUDE.md`, "never commit a half-batch").

A batch may hold more than one commit; each commit is green on its own.
Aim for one parity filter group and one green check per batch; the
first application is `issues/47/plan.md`, "B5 remainder planned".
