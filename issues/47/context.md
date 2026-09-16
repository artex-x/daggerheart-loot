# Shared task context - TASK 47

Orchestrator maintains this file so later steps do not re-fetch the same sources.
Read this before `plan.md` and `handoff.md`.

Facts, constraints, decisions and disproved reasons only. Narrative, batch
design and status live in `plan.md` and `handoff.md`. Cite the siblings by
heading name: both were rewritten end to end on 2026-09-16 and every line
number into them is stale.

**Compacted 2026-09-16** (243 KB -> this), with `plan.md` (1031 KB -> 117 KB)
and `handoff.md` (556 KB -> 73 KB) in the same pass. The last pre-compaction
commit is `fc59ce4`; `git show fc59ce4:issues/47/context.md` is the full prior
text. What was dropped and why is at the end, under "What this compaction
dropped".

## Goal

**Current, 2026-09-16: R0b - re-home the live-app coverage that must survive,
then R0c's deletions.** Phases 4, 5 and 6 are closed; the site serves the
rewrite. The remaining order is `R0b.2 -> R0b.3 -> R0b.4 -> R0c`, then Phase 8
under a new task id. Design: `plan.md`, "R0b planned: re-home the live-app
coverage that must survive" and "The finishing plan - every batch from here to
done". Next batch and its gates: `handoff.md`, "Next batch (implement-ready)".

**Task 47 closes at R0c**, not at Phase 8 - Phase 8's own design gives R1 a new
task directory so this one can retire. What happens to `issues/47/` is the
owner's call; the recommendation is to keep it, since it is the only place the
migration's measurements live.

## GitHub issue

- URL: https://github.com/artex-x/daggerheart-loot/issues/47
- Summarized in `plan.md`; not re-fetched since Phase 4 and not needed.

## Key paths

- Specs: `docs/specs/CONTRACTS.md`, `ROUTES.md`, `STATE.md`, `FEATURES.md`,
  `COVERAGE.md`, `I18N.md`, `META.md`, `DEBT.md`; workflow in `docs/parity.md`.
- Parity harness: `tests/parity.js`, `tests/parity/specs.js` (`SPECS`,
  `STATES`, `ACCEPTED`, `VISUAL_DEBT`, `DEBT_SLACK`, `JITTER`).
- Real-browser suites on `dist/`: `tests/app/` (`contracts`, `golden`, `hues`,
  `states`, `sweep`, `typo`), all reaching the driver through
  `tests/app/lib.js`.
- **The driver is `tests/app/driver.js`** since R0b.1 (moved from
  `tests/parity/driver.js`, byte-identical). `tests/parity.js`'s `hashFile`
  was re-pointed with it.
- Legacy live-app suites: `tests/*.js` through `tests/run-all.js`; shared
  `tests/lib.js`.
- Live app (the fallback, deleted by R0c): `index.html`, `style.css`, `app.js`.
- Rewrite: `app/src/{lib,ports,state,components,styles}`, built to `dist/`.
- `tools/probe.mjs` - the only sanctioned way to compare a computed style or
  rect between the two apps; it uses the harness's own launch args, so a number
  taken any other way is not comparable.

## Command costs

Wall clock, and whether it fits one foreground Bash call (the tool caps at
600000 ms). **Every figure here is a load figure, not a constant** - see "The
host throttles, and it is the first thing to measure".

| Command | Wall clock | Fits one call? |
|---|---|---|
| `npm run check` | ~165 s idle; 78-96 s for vitest alone; has exceeded 600 s under load | yes when the host is healthy |
| `npm run check:built` | a few minutes | yes |
| `npm run format:check` | ~9-11 s healthy, ~55 s throttled | yes (the health probe) |
| `node tests/parity.js "<filter>"` | ~1.5 s per cell, both sides shot; ~9 min for a large filter | filter-dependent |
| full parity suite | ~1826-1849 s local, 8 workers; ~867 s single-job on CI; 8-10 min per shard on CI's 4-way split | **no** |
| `node tests/run-all.js app/sweep` | **593.5 s** | only just; treat as no |
| `node tests/run-all.js app/golden` shard | ~250-265 s local, ~2 min on CI | yes |
| `node tests/run-all.js app/contracts,app/sweep` | 574.5 s (B12.1) | only just |
| golden seeding `--update` / full comparison | 414.6 s / 1005 s | seeding yes, comparison **no** (hence `--shard=n/of`) |

Corollaries:

- **The five-suite `tests/app` line in `CLAUDE.md` is not one foreground call
  on this host.** `sweep` goes alone (four `node tests/app/sweep.js <width>`
  calls), and `app/golden`'s four shards go separately again.
- A run that crosses the cap is **re-run**, never salvaged and never
  deliberately backgrounded: `check-observer.mjs` arms the commit gate from a
  foreground call's own stdout, and a backgrounded call returns none.
  `bash-guard.mjs` refuses a deliberately backgrounded check for that reason.
- In the **main** session only, a crossed run still leaves a readable output
  file - the shell survives the turn. A subagent's does not. That asymmetry is
  why the rule reads "never backgrounded" for workers.
- Never let two heavy runs overlap; check `test-output/parity.lock` and
  `chrome.exe` first.

## The host throttles, and it is the first thing to measure

**One counter settles what three sessions guessed at:**

```
Get-Counter '\Processor Information(_Total)\% Processor Performance'
```

It read **20, 20, 20, 20** over four samples on 2026-09-12. The CPU is an
Intel i7-8565U (nominal 1.8 GHz, 15 W) running at a fifth of nominal. Every
slow reading that session is a consequence: `format:check` 11 s -> 55 s,
`npm run check` ~165 s -> ~825 s projected and ~19-20 min observed.

- **"Total CPU 75-95%" and "`explorer.exe` at 62%" were the same illusion** -
  percentages of a throttled capacity. Sampled during a real run, the top
  consumers were prettier's own node processes; `explorer.exe` did not appear.
  **Nothing on the software side starves the build**: not peer Claude sessions
  (~0.2 cores together), not `explorer.exe`, not this project.
  `NGenuity2Helper` does hold a core continuously - worth reclaiming as heat on
  a 15 W part, not the cause.
- **Not power policy** (AC, 99%, Balanced). Thermal or a stuck EC/DPTF state is
  what is left; `MSAcpi_ThermalZoneTemperature` is unavailable here, so the
  temperature was never read. Fixing it needs a human at the machine.
- **The throttle comes and goes.** It lifted on its own later the same day
  (`format:check` 9.4 s, counter 139-171%) with nothing done to the host.
- **The one-minute probe before any gated batch**: read the counter, or time
  `npm run format:check`. **~11 s means the full gate sequence fits one
  foreground call; ~55 s means it will not**, and waiting will not change it.
  This is cheaper than discovering it 19 minutes into a check.

Related host facts, all measured:

- **vitest's fork pool fails to boot workers under memory pressure.** The
  signature is zeros down the coverage table with `Errors N` equal to the file
  count - no test ran, nothing regressed. Re-run when idle; do not read it as a
  regression. At 0.35 GB free of 15.82 with the CPU pegged, 11-13 files lost
  the hardcoded 60 s `START_TIMEOUT`. The README's caution that free memory
  does not predict this holds for the 1-3 GB range; 0.35 GB is a different
  regime, recorded as a measurement, not promoted to a rule.
- **`--maxWorkers=4` made it worse, not better**, under memory starvation:
  1067 s against 437 s, 13 failed starts against 11. The README's fallback was
  measured on a host with memory to spare; the cost here is per-fork
  allocation, not scheduling.
- **A doc edit disarms the commit gate.** `tree-key.mjs` fingerprints tracked
  and untracked *content* (`issues/**` and `*.md` included); the gate exempts
  those paths from what it *counts*, not from the fingerprint. A batch whose
  last step writes `plan.md`/`handoff.md` runs one more foreground check
  immediately before `git commit`.
- **The gate arms once for a whole batch.** The key is content, not HEAD, so
  committing changes nothing: one passing check covers several commits when no
  file changes between them. The trap is the converse - any edit to any
  non-gitignored file disarms it, so a remediation cycle that touches one test
  file pays for a fresh check.
- **`npm run check` never builds.** Any `tests/app/` run needs `npm run build`
  (or `check:built`) first. CI is safe: its legacy-suite step runs after Build.
- **`--reporter=basic` no longer exists** in this vitest. The default reporter
  with a `tail` filter is how the output stays under the tool's ~30000-char cap.

### Shell and worktree hazards on this host

- **Git Bash rewrites parity filters.** `node tests/parity.js "#/i/ci1 @"`
  arrives as `#I:/ci1 @`, matches nothing, and prints `расхождений нет` for
  zero cells. **Any filter beginning `#/` needs `MSYS_NO_PATHCONV=1`** in front
  of the command; PowerShell does not convert.
- **`kill -0 <pid>` in Git Bash answers in the MSYS pid namespace**, not the
  Windows one, and reports a live `node` as dead. Use `tasklist //FI "PID eq
  <pid>"` or PowerShell `Get-Process -Id`. `tests/parity/lock.js` uses Node's
  `process.kill(pid, 0)` and is right where the shell builtin is wrong.
- **A background run's `.output` file reads 0 bytes until the run flushes.** An
  empty file is not a lost result while the pid is alive; `parity.lock` tells
  the difference - an absent lock means a clean exit, a lock left behind with a
  dead pid means the run was killed.
- **`issues/47/` exists on more than one branch and only `main`'s is true.** A
  session pinned to `E:/dev/daggerheart-loot-wt/tg-preview-refresh` reads a copy
  frozen at "B7 planned". Check `git branch --show-current` before trusting
  anything under `issues/47/`, and note that **the Bash tool resets its cwd to
  the session's pinned directory between calls** - carry an explicit
  `cd /e/dev/daggerheart-loot &&` prefix when the session is pinned elsewhere.
- **Peer sessions share this working tree.** HEAD moves under this task; a peer
  can leave dozens of tracked paths dirty. Re-read `git log --oneline -3` before
  any writer and again at closeout, stage by path, and **never `git add -A`**.
  `issues/tg-preview-refresh/` and similar untracked directories belong to other
  tasks and are preserved, never staged.
- **`docker` on this host cannot run the ubuntu container**: `docker --version`
  answers (20.10.8) but `docker info` panics in the client (`reflect:
  indirection through nil pointer`). See `handoff.md`, "Blockers", for
  `tools/parity-ubuntu`'s own build-command defect.

## Decisions taken by the repository owner - settled input, do not re-open

1. **CI (ubuntu) is authoritative for `VISUAL_DEBT` numbers** (2026-09-09). A
   debt figure must make CI green; a local Windows run is advisory and gets a
   documented per-platform tolerance. **Do not write a recorded number off a
   local run.** Rejected on the record: per-platform pairs of numbers (doubles
   the bookkeeping), and widening `JITTER`/`DEBT_SLACK` (loosens the exact
   mechanism that let three defects hide).
2. **Diagnose every failing state and fix root causes; re-baseline only genuine
   machine variance** (2026-09-09). Explicitly *not* "re-baseline to green now,
   diagnose later" - the owner's reason is that it risks writing another
   absorbing excuse of the kind a whole batch was spent removing.
3. **Reduced motion: port the live app, option (a)** (2026-09-11). Delete the
   rewrite's blanket `transition-duration: 0s !important` and transition exactly
   where the live app does. Parity wins over an improvement the rewrite
   invented, and a pixel cell cannot be parked in `ACCEPTED`.
4. **Parity-over-improvement means "fix it after the migration", not "never"**
   (2026-09-11). A defect the port reproduces *on purpose* is a third category
   beside `VISUAL_DEBT` and `ACCEPTED`, is written down, and is addressed in a
   post-migration review step together with everything recorded as deferred or
   ported-not-fixed. **Its home is `docs/specs/DEBT.md`** (decided; rejected
   homes in `plan.md`, "Phase 8 - the post-migration review"). A task directory
   retires; `docs/specs/` does not.
5. **Publish early, delete later** (2026-09-12). The cut-over is a reversible
   one: point the deploy step at the built output and go live while
   `index.html`/`app.js`/`style.css` stay in the repository and parity keeps
   running against them. Phase 7's deletions move *behind* the flip and get
   their own entry condition.
6. **The soak is dropped** (2026-09-12): "I'm ok to get rid of soak, we can
   revert to previous commit if needed, I would not block all the work."
   Phase 7's condition 4 (seven days) is removed; **condition 6 ("the owner says
   go") now gates R0c alone**, because R0a and R0b delete nothing.
7. **The roll re-render fix is never a batch of its own** (2026-09-12) - it is
   bundled into a batch that already has work in those paths. B14 hosted it.
8. **B12.1's nit 1 stays deferred** (2026-09-12): a pinned bare `#/tables` is
   accepted by the pin button and silently dropped at the next boot. It shipped
   with the flip; B14 C2 is where the fix landed.
9. **The four R0b.4 divergences: restore all four** (2026-09-16) - see "The
   owner's answer on R0b.4's four divergences" below.
10. **Playwright: not now - decide it in Phase 8, against R1's findings**
    (2026-09-16). The question had been parked as "worth a decision before
    building anything; ask first" and had never been asked; it is now asked and
    answered, so the item stops being an open question with no owner and
    becomes a scheduled one. **Scope, so it is not re-opened as something
    larger**: R0c does not reduce real-browser coverage. Nine `tests/app/`
    suites survive it (`states`, `sweep`, `hues`, `typo`, `contracts`,
    `golden`, `inventory`, plus `print` and `stub` from R0b.3 and R0b.2) and
    keep running against `dist/`. What R0c ends is the *side-by-side pixel
    comparison against the live app*, which is unavoidable - the live app is
    what is being deleted. So the open question is only whether those surviving
    suites keep their hand-rolled puppeteer stack (`tests/app/driver.js` ~29 KB,
    `tests/app/lib.js`, a custom reporter, `run-all.js`'s own job scheduler and
    per-suite weights) or move to Playwright. **Evidence to weigh when it is
    decided, both already measured rather than supposed**: R0b.1 fixed a
    `states.js` case-7 flake caused by hand-rolled event waiting, the class
    Playwright's auto-waiting locators exist for; and two Chrome runs collided
    on one tree because `run-all.js` has no lock against concurrent heavy runs.
    Against: the driver's verbs (`media`, `computed`, `eachAt`, `settle`, drag,
    click-by-name) are bespoke to this bilingual UI and its three-width sweeps,
    and the goldens are accessibility-tree text rather than pixels, so
    Playwright's screenshot tooling would replace nothing. **Why Phase 8 R1 and
    not now**: R1 is already a full read-only pass over every state in a real
    browser, so it is the pass that shows whether the harness's ergonomics
    actually cost anything. Rejected on the record: deciding it now with no
    data; a spike before R0c (informative, because the parity harness still
    exists as a cross-check, but it adds work to the riskiest stretch of the
    migration and delays the deletion); and committing to the migration
    up front as its own post-Phase-8 task.

## The owner's answer on R0b.4's four divergences: restore all four

Settled input for R0b.4 (orchestrator, 2026-09-16). Do not re-open, and do not
re-derive the evidence - it is `plan.md`, **"The fourth verdict"**, with file
and line numbers on both apps and why each was invisible to every other
instrument.

The R0b planning pass found three behaviours the rewrite does not reproduce,
each guarded by exactly one of the ten suites R0c deletes; **a fourth was found
during R0b.1's C3** and folded in by review remediation. The owner was asked one
question per item and answered **restore** to all four. **None goes to
`docs/specs/DEBT.md`**: `DEBT.md` is for a live defect the rewrite reproduces
*on purpose*, and these are the opposite - accidental losses.

1. **The roll results' live region.** Restore `role="status"
   aria-live="polite"` on the results container in `StdPanel.svelte`,
   `RollPanel.svelte` and `AltPanel.svelte`, matching the six `app.js` sites.
   `qa.js` is the only test that asserts it; **axe does not report a *missing*
   live region**, so the axe sweep cannot see it either.
2. **The referenced card.** Restore **both** halves in `RecordCard.svelte`: the
   `\n` -> `<br>` line breaks, and the
   `<a href="{r.url}" target="_blank" rel="noopener">daggerheart.su</a>`
   outbound link. **Dropping the third-party link was not deliberate** - that
   was the open half of the question and it is now answered. Invisible to every
   instrument because it sits inside a `<details>` closed by default: a pixel
   diff photographs a closed disclosure and
   `page.accessibility.snapshot()` does not descend into one.
3. **The copy-image button.** Restore the second half of the gate in
   `RecordActions.svelte`: `it.img && !brokenArt[it.id]`, not `it.img` alone.
   Live gates on `hasImage(it)`; a record whose picture 404s currently offers to
   copy the placeholder.
4. **The frame-armour tier word.** A frame-armour record's copy text keeps a
   tier word the live app now drops: `app.js:612` guards with
   `if (e.tier && !isFrameRecord(it))` (commit `106e4dd`, pre-session) and
   `app/src/lib/share.ts:85` calls `eqLine(...)` with no `noTier`. The rewrite
   already has the option (`app/src/lib/i18n.ts:117,123`) and uses it elsewhere.
   **The fix is `noTier: isFrameRecord(it)` at `app/src/lib/share.ts:85`, plus
   regenerating `docs/fixtures/share/records.json` with
   `tools/capture-share-fixture.mjs`.**

**Procedural consequences.** `NEEDS_HUMAN_CONFIRMATION` is **clear for all of
R0b** - R0b.2, R0b.3 and R0b.4 have every answer they need. R0b.4 is an ordinary
queued batch; its entry condition is R0b.1..R0b.3 landing, not an answer, and
its gates are unchanged (`npm run check`, `npm run check:built`, a parity filter
over `#/i/*` and `#/roll/*`). **The only owner gate still outstanding anywhere in
TASK 47 is R0c's go** (Phase 7 condition 6), which is a separate thing and stays
outstanding. R0b.1 implemented none of the four - its acceptance line 21 stands
and the five named components appear in no R0b.1 commit.

**Why item 4 had to be recorded rather than left.** It was first routed out of
the task through a background-task chip, which is session state. R0c's stop
condition named three, so nothing would have held the deletion of `app.js` on
account of the fourth - and `app.js` is the only place the correct behaviour is
written down. It is now in `plan.md` ("The fourth verdict", item 4), the R0b.4
batch row, `docs/specs/COVERAGE.md`'s `flows` row, and a note in
`tools/capture-share-fixture.mjs` so the next person to run that tool does not
read the resulting `f33` diff as a fresh regression. The stop condition reads
four everywhere; the chip was withdrawn. **Divergence 2 had the same problem**:
the lost `<br>`s and the lost `daggerheart.su` link lived in issue documents
only - grepping `docs/specs/` for `refHTML`, `daggerheart.su` or
`RecordCard.svelte:238` returned nothing. Both notes are now in `COVERAGE.md`'s
`flows` row.

## Reasons already disproved

Causes a session wrote down and a later one refuted. Keeping the list stops the
next session re-deriving them from the same evidence.

- **"The CI failures are cross-platform machine drift."** No: they were stale
  baselines. The control is that `#/tables ~ a row opened` and `~ help`
  reproduce their recorded numbers *to the hundredth* on the Windows host, so
  the machine does not render differently. The failing entries were recorded and
  then the components they render were changed with no re-baseline (`117af2e`
  wrote the specs; `9fa9ad5` and `e5985ff` changed the components and touched no
  entry). `#/i/f1` was simpler still - added with no `ACCEPTED` and no debt
  entry, so it had never passed. Cross-platform variance is real at the
  tenth-of-a-percent level and is not what those failures were.
- **"`cqw` units are unstable."** False diagnosis, deleted everywhere rather
  than softened; it is **not** in `docs/parity.md`'s "Two unstable classes" and
  must not be added. The real cause was `transition-duration: 0.01ms` (below).
  The staleness reproduces on a non-container element with px units,
  `document.getAnimations()` returns a `CSSTransition` on the rewrite and `[]`
  on live, and with `0s` injected the live `fitPrintCards` run verbatim over the
  rewrite's DOM reproduces the legacy numbers exactly.
- **"The print image residue is a real defect."** Three runs on one unchanged
  build produced three non-overlapping four-cell sets; the opened diff image
  showed a one-pixel edge outline over *every* element on the page, topbar and
  footer included, none of which the batch touched. It is `docs/parity.md`'s
  existing "Full-page captures" class. CI read all 54 `#/print` cells
  `совпадает` on two consecutive runs. No `VISUAL_DEBT` entry was ever written
  and none is needed.
- **"The slow host is peer sessions / `explorer.exe` / I/O."** All three were
  wrong; it is a CPU throttle to ~20% of nominal (above). The Git Bash `time`
  `user`/`sys` figures that supported the I/O reading measured nothing - Git
  Bash does not aggregate Windows child-process CPU. The wall-clock numbers
  stand.
- **"`Button.svelte` is missing its focus ring."** Stale.
  `tokens.css:148-154` has a global `:focus-visible` gold ring since `ae28b23`.
  Measured on a keyboard-focused `.btn`: rewrite `solid 2px rgb(216,171,94)`,
  offset 2 px, radius 9 px; live `style.css:1002-1005` gold 2 px, 2 px offset,
  radius 8 px. Both draw the ring; the one difference is the focused radius,
  9 px (`--r-sm`) against 8. **Rule: read focus styles only after
  `document.getAnimations()` is empty**, or a transitioning control reports its
  old value - the live read at t=0 of its 150 ms transition showed
  `solid 3px rgb(236,232,246)`, which is the pre-transition value, not a UA
  ring.
- **"`document.fonts` swapping a face is what moves the anchor."** Disproved by
  B3.6 part 1's probes - see the migrated measurements at the end of this file.
- **"`app/states` case 7 is an R0a regression."** It is a flake, on four
  readings - see "Known flakes" below.
- **"A parity group reading `расхождений нет` proves the rows drew."** It does
  not: an empty match on both apps reads green too. Print the figures.
- **"A parity filter that matches nothing looks like a failing run."** It looks
  exactly like a *passing* one - see "The harness" below.
- **"B14's parity run was 88 cells."** It was 20 states = 120 cells; "88" was a
  `tail -n 120` artifact. See the migrated measurements.

## The harness, and what it can and cannot see

- **The pixel verdict is a percentage of the whole page.** A wrong font size on
  one line of a 1100x900 screen is ~0.09%, under `JITTER` (0.1) - so a
  control-sized defect cannot outvote a page-sized denominator, and the state
  reports `вид: совпадает` with no `VISUAL_DEBT` entry at all. The durable
  countermeasure is a **nonvisual spec**, not a smaller `JITTER`: computed
  typography plus a measured text advance is deterministic across machines.
  `includeAA: false` is not the culprit - rescoring with `includeAA: true` moved
  0.092% to 0.127% and 0.131% to 0.181%. Do not "fix" the harness by flipping it.
- **The word "antialiasing" in a `VISUAL_DEBT` reason became an absorbing
  excuse.** Three of the six documented noise causes were written against
  measurements never taken at the level of the glyph run. `docs/parity.md` now
  says a whole-page percentage cannot see a control-sized defect.
- **`VISUAL_DEBT` is enforced from both sides but only outside `DEBT_SLACK`
  (0.5).** The check is `pct < debt.pct - DEBT_SLACK`, so an entry recorded at
  0.13 that now measures 0.00 sits inside the slack and passes **silently**.
  Paid-off entries are deleted by reading the run output, not by waiting for a
  failure - and still in the same change, not a follow-up.
- **`ACCEPTED` never reaches a pixel cell.** It is read only by the spec
  `diff()`, keyed `<state> @ <lang> :: <spec> :: <field>`; the pixel verdict
  consults `VISUAL_DEBT` alone. So "accept a visual difference" means writing a
  `VISUAL_DEBT` figure, which owner decision 1 forbids off this host. **A stale
  `ACCEPTED` key fails the run** (`различий больше нет, убери из ACCEPTED`), so
  an entry for an unmeasured difference is red from its first run.
- **`WANTED` matches the cell label, not only the id** (`<id> @ <lang> <width>`),
  and multiple filters are OR-ed. So `"<id> @"` selects exactly the plain state:
  `"#/lists @"` is six cells, not the twenty states `"#/lists"` prefixes.
- **A filter that matches nothing is indistinguishable from a passing run.**
  `WANTED` only `continue`s past non-matching cells; the summary prints the
  filter names, then `расхождений нет` and `exit 0`. **No cell count is printed
  anywhere.** B14's first parity call had its `#/roll` arguments rewritten by Git
  Bash, matched zero cells, and looked like a clean pass. R0a added the guard:
  if `WANTED.length` and no cell was compared, fail the run.
- **`arrive()` runs `enter(d)` with no `lang`, then presses `EN`** - deliberate,
  so every `enter` grips Russian names. Any state whose `enter` leaves DOM-only
  state that the live `render()` discards shows an English-only divergence unless
  the port re-creates the element on `app.lang`. Component state that must
  survive that press has to sit outside any `{#key app.lang}` block.
- **The width sweep is one document resized, not three arrivals** - and a browser
  moves a scrolled document on reflow to hold the reading position by picking an
  element out of the DOM, which the two apps do not share. This is an open
  blocker (`handoff.md`, "Blockers"); `overflow-anchor: none` on both sides was
  tried and shuffles the figures without removing them. `timed: true` makes the
  runner arrive afresh at every width; the whole-page class is handled by
  `shot(whole)` capturing until two consecutive captures are byte-equal (cap
  four) plus a `geometry` `perWidth` spec.
- **The legacy screenshot cache is turned off for `measured` states only, never
  for `timed` ones** - fixed by `&& !timed` on the three guards after a stale
  cache hit produced a phantom 0.74% toast cell. CI never caches (fresh
  runners), and locally `tests/run-all.js` wipes `test-output/` (which holds
  `.parity-cache`) at the start of every invocation, so a `driver.js` edit
  invalidating the cache key costs nothing in practice.
- **`d.controls()` reads `button, a[href], input, select, textarea` and dedupes**;
  it never reads `aria-pressed` or `aria-current`, so the money chips'
  `aria-pressed` against live's `aria-current="true"` is not a measured
  difference. A row count is not in the inventory - hence the `count` verb.
- **`NAME_FN` is `aria-label || title || textContent`.** Consequences that keep
  recurring: the print link is gripped by its long `title`, not "Печать";
  select-all cannot be gripped at all (no `aria-label`/`title` on the label);
  every row box is named "Выбрано", so a second row needs `d.click(name, nth)`;
  a card's accessible name is its text with **no** spaces, because the live
  markup has no whitespace between `<b>`, the badge and the empty-state `<p>` -
  a Svelte template with a newline between them would put a space in the
  inventory. `d.click(name, nth)` prefers an exact match and falls back to
  `includes` only at `nth` 0.
- **A referenced card is reachable by no registered state.** `LOOT.refs` has
  five entries and exactly five records carry a `refs` field - `w1`, `w8`,
  `w68`, `w88`, `w118` - while every `#/i/*` state in `tests/app/inventory.js`
  and `tests/parity/specs.js` is `ci1`, `q1`, `f1`, `cm1`, `voa2_a1` or `nope`.
  So the refs `<details>` is outside both the goldens and parity, on top of
  being closed by default. `#/i/w1` is in `tests/app/sweep.js`'s `PAGES`, so the
  axe pass is the one instrument that reaches it at all. This is why divergence
  2 was invisible, and why restoring the link moves no golden and no parity
  cell. Measured 2026-09-16 (planner) off `data.js` and the two inventories.
- **The controls section and the accessibility tree disagree about the same row
  by design and must not be reconciled.** Matching one against the other matched
  462 of 12,829 entries: `NAME_FN` has no inter-element spaces, carries the roll
  number and keeps the DOM's letter case, while the accessibility name inserts
  boundary spaces, omits the number and reflects `text-transform: uppercase`.
  That disagreement is the `Сообщество <i>любое</i>` class the two instruments
  exist to keep apart.
- **`d.click` is `el.click()` inside `page.evaluate`** - a synthetic dispatch.
  Trusted input exists nowhere in the parity harness; `tests/app/states.js` is
  where a real CDP click lives. The two agree in every cell tried except the
  microtask class (below).
- **`confirm()` blocks puppeteer** unless something accepts it; the driver has a
  dialog auto-accept that records the message, so delete is compared as data.
- **`tests/` is invisible to `npm run check`'s formatting and lint steps**
  (`.prettierignore` lists `tests/`, `eslint.config.mjs` ignores `tests/**`), so
  a suite there is verified only by running it. **CI picks a new
  `tests/app/` suite up with no `ci.yml` edit** - the `check` job runs
  `node tests/run-all.js --exclude=parity,app/golden` after `npm run build`. A
  suite named `app/sweep` resolves to `tests/app/sweep.js` and logs to
  `test-output/app-sweep.log` with no runner change.
- **Language leaks between states through `localStorage`**: `file://` is one
  origin, so a state that ran at `en` can leave the next state's `@ ru`
  screenshots in English. Both apps read the same storage, so no verdict is
  wrong; a human reading a `_ru_` screenshot will find English in it.

### The structural goldens (R0a)

- `page.accessibility.snapshot()` is present in the installed puppeteer 25.9.0,
  so Phase 5's "no new dependency" premise holds. Two consecutive captures of
  the same arrival were byte-identical on all seven routes probed. Capture cost
  12-120 ms; the arrival around it ~1.2 s, ~7 s on `#/tables*`.
- **Three serialized fields are per-run poison**: `elementHandle` (a function),
  `backendNodeId`, `loaderId`. A golden that keeps any of them fails its own
  second run.
- **`url` in the tree is an absolute `file:///E:/.../dist/index.html#/...`** -
  three slashes, one machine's path - and does **not** equal `driver.js`'s
  `TARGETS.next` (two slashes, Windows separators). Normalise by cutting at the
  last `/dist/index.html` substring, never by prefix-comparing. CI is ubuntu.
- **The corpus is 5,204,669 bytes over 105 files, 40,361 section lines**
  (superseding an earlier 1.5-2.5 MB estimate taken from seven routes that
  missed `eq_weapon`, `voa` and the 300-match search cap). Mean 50 KB; five
  files hold ~1.5 MB. The bytes are catalogue text, not structure: a table row
  is a `checkbox` and a `button` at the same depth with no wrapper, and the
  button's name is the whole stat line - up to 1023 characters. 14,720 of the
  40,361 lines carry a name over 64 characters, and every one of the 105 files
  has at least one.
- **The format is two local rules applying to all 105 states with no hand-listed
  set**: same-shape sibling elision (signature = role + attribute *values* +
  child shape, names excluded) and a 64-code-point cap with `namelen`/`namehash`
  appended. Replayed: **5.20 MB -> ~1.50 MB, 40,361 -> 24,346 lines**; largest
  file 372 KB -> 89 KB. The controls section gets the cap only and keeps its
  12,829 lines.
- **`--shard` suppresses neither the missing-golden nor the stale-file guard**;
  the missing check is per state, and the stale check compares the directory
  against the whole inventory, which every shard knows. Only `--only=`
  suppresses them.
- **`tests/app/inventory.js` carries exactly the module-level constants
  `specs.js`'s `STATES` reads** - the print routes, `PACKED`,
  `NOTES_BOTH_KINDS`, `QTY_AND_PRICE`, `LOOT`, the storage seeds, **and `NAME`**
  (the two-language button-name dictionary; sixteen `enter` closures call it).
  `EQUIPMENT_ENTRY` belongs to `SPECS` and does not travel. **R0c must carry
  `NAME` with the rest.** The copy is verified by reproducing seven numbers
  exactly: **105 states, 0 pending, 61 `enter`, 24 `storage`, 7 `timed`,
  5 `whole`**, 42 distinct routes.
- **A capture loop in this repository must `return await`, not `return`.**
  `return captureLang(page, d)` inside `try { ... } finally { await ctx.close() }`
  closes the browser context out from under an in-flight CDP call and throws
  `TargetCloseError` from `Accessibility.snapshot()`. It crashed loudly on the
  `timed` states, which was luck; a version that only sometimes lost the race
  would have seeded a golden nobody could trust. This is the general shape, not
  a `golden.js` detail.
- **Repository size, for perspective on any future artefact question**: 63.4 MB
  tracked, of which `img/` 29.1 MB, `i/` 4.0 MB, and
  `data.js` + `data.json` + `catalog.csv` 1.87 MB. A 1.5 MB golden corpus is
  2.4% of the tree and smaller than the generated `i/` directory.

### Known flakes

- **`app/states` case 7 (two windows) flakes on a loaded runner, and it is not
  R0a's.** CI run `34754984230` on `06658fd` came back `check: failure` on that
  one case; every other job including all four golden shards was green. Four
  readings: C3's diff goes nowhere near storage or the lists page; the same tree
  passes locally (65.0 s against CI's 66.1 s - the same work); a second CI
  sample on the same code is green (`34755188652` on `6e1269b`); and **the case
  is written to flake** - `tests/app/states.js` waits for page B with
  `waitForFunction(..., { timeout: 5000 }).catch(() => {})`, the timeout
  swallowed, then asserts on whatever the page says. Deferred rather than fixed;
  the design question is raise the timeout, poll to a deadline, or wait on the
  event itself. **`app/src/ports/storage.ts:61-71` adds a plain
  `window.addEventListener('storage')`, so a test page can add its own listener
  via `page.evaluateOnNewDocument`**: "the browser delivered the event" and "the
  app redrew" are two separately waitable conditions, not one 5000 ms guess.
  What must not happen is the next red `check` being waved through as "that
  flaky case again" without someone reading the diff first.
- **`behave` flaked once on the live app** (`FAIL приложение открылось не на
  поиске`) with all 20 other legacy suites green, and passed on re-run. If it
  recurs on a clean tree it is a real live-app regression and belongs to its own
  task, not to issue 47.

## Framework and tooling traps, earned the hard way

Svelte:

- **A literal leading space at the start of a `{#if}`/`{#each}` block is dropped
  by the compiler.** Emit it as an expression - `{' '}` - so it is a text node
  the compiler cannot trim. Do not put the space inside an `<i>`: an italic
  space is not the same glyph advance. (This is now a `CLAUDE.md` rule.)
- **Svelte prunes a scoped rule no template element can match**, and
  `npm run check` fails it as dead CSS. So drag classes must be `class:`
  bindings driven by port callbacks, not classes the port toggles; and a
  sibling rule a single instance cannot match (`.hitnote + .hitnote`) is carried
  as `:global(...)` after the base rule (equal specificity, source order
  decides - the live cascade decides by specificity, same result).
- **An `{#if}` inside an element is not free**: the compiler marks the live
  branch with an anchor comment, which lands inside that element - invisible to
  a pixel diff, visible to a `childNodes` assertion. A render-tag anchor is a
  *comment*, so it generates no box and does not split a text run;
  `CLAUDE.md`'s text-node rule is about split text nodes. The faithful form is
  still one text node per live `esc(...)` concatenation. **Authored template
  comments do not reach the DOM** (`app/svelte.config.mjs` sets no
  `preserveComments`).
- **`<textarea>{x}</textarea>` and `bind:value` both compile to a `.value`
  assignment** and leave `textContent` empty - so the harness's `NAME_FN` sees
  no name. Seed the text child with an action.
- **`.card :global(.card-acts ...)` raises specificity, it does not lose it**:
  0,3,0 -> 0,4,0.
- **A snippet declared as a child of a component is passed as the prop of that
  name**, and elements rendered inside a caller's snippet keep the caller's
  style scope. A parent's scoped rule does not reach a child component's root
  without `:global()`.
- **Svelte 5 flushes in a microtask** (`queueMicrotask`). A **trusted** event
  runs a microtask checkpoint after each listener, so between a delegated
  `onclick` and a `<svelte:document onclick>` the `{#if}` block can already have
  replaced the target: `e.target.isConnected` is false and an outside-click
  handler closes the menu. `userEvent.click` (jsdom) and `el.click()` (parity)
  dispatch on a non-empty stack - no checkpoint until they return - so **both
  test instruments pass while the real browser fails**. This was defect 2 of the
  two the owner reported.
- **Svelte does not remount a page component between two addresses of the same
  route kind.** `App.svelte` dispatches through one `{#if}`/`{:else if}` chain;
  a branch is torn down only when the *matched branch* changes. So
  `TablesPage`'s `lastTable` survives a move between two `tables` addresses and
  is what is genuinely on screen. B14's plan assumed the opposite and its
  primary design would have pinned the wrong table. **Any design reasoning about
  mount lifecycle across routes has to check the branch, not the address.**
- **`AppState.setLang()` does not bump `navigations`**; `go()` and the router's
  `onChange` do.

TypeScript / `svelte-check`:

- **Narrowing a `$derived.by` nullable across an `{#if}/{:else if}/{:else}`
  chain needs the terminating negative check to be bare.** A compound
  `{:else if route.kind === 'sharedList' && !own}` in that position breaks it;
  nest the route-kind branch *inside* a bare `{:else if !own}`.
- **`exactOptionalPropertyTypes: true` rejects `{ tail: undefined }` for
  `tail?: string`**, and rejects re-reading `m.qty` after only a
  `(m.qty ?? 0) > 1` check (the coercion does not narrow the property access).
  Neither surfaces in `vitest`; only `svelte-check`/`tsc` catch them, so a batch
  that skips the typecheck step before the full `npm run check` finds both at
  once inside the slow gate instead of a fast one.
- **An inline arrow's parameter is not contextually typed through a component
  prop**: `oninput={(v) => ...}` is flagged
  `@typescript-eslint/no-unsafe-assignment` even when the prop is typed. Write
  `(v: string) =>` at the call site.

CSS and reduced motion:

- **`0.01ms` is not zero, and the popular reduced-motion snippet ships it.** A
  non-zero duration starts a real `CSSTransition` on every inline style write,
  and a transition's value at t=0 is the **old** one - so code that writes an
  inline style and reads the layout back synchronously reads the pre-write
  layout. That is exactly what print-card fitting does: `tight()` never turned
  false, every ladder ran to its floor, the first card on each sheet lost its
  art, and 50 of 54 group-A parity cells went red. The live app's reduced-motion
  rules kill two named animations only and leave `transition-duration` at `0s`.
  The parity harness runs every cell under `prefers-reduced-motion: reduce`, so
  this surfaces in parity and nowhere else. Fixed to `0s !important`; nothing in
  `app/src` listens for `transitionend`/`animationend`.
- **Then owner decision 3 deleted the blanket kill entirely** so the rewrite
  transitions exactly where live does. Every rewrite animation has a live twin,
  none loops, and the live stylesheet has no `scroll-behavior` rule (both apps
  scroll with an explicit `scrollIntoView({ behavior: 'smooth' })`, which the
  CSS property does not override, so the `scroll-behavior: auto !important` line
  was inert). `tokens.css` declares no `transition` of its own.
- **Port a rule with every `@media` override it has.** A mobile-only override
  ported for the base width reads as growing drift, not a constant offset. This
  bit four times before it became a `CLAUDE.md` rule.
- **`document.styleSheets[n].cssRules` throws over `file://`** (the sheet is
  cross-origin to the page), so a probe cannot read which rule matched - read
  computed values and reason from the source.

vitest / puppeteer / node:

- **A component test that renders 300+ rows must not be typed into character by
  character.** `userEvent.type` fires one `input` per keystroke, each
  re-rendering every row; under coverage that alone crossed the 30 s default
  timeout. `userEvent.click` then `userEvent.paste(text)` lands the whole value
  in one event.
- **`page.$eval` queries only the first match; `page.$$eval` queries all.** Any
  driver verb that counts or reduces over several elements needs `$$eval`.
- **Node's `zlib.deflateRawSync` bytes differ from Chrome's `CompressionStream`
  output**, but both are raw deflate and `DecompressionStream('deflate-raw')`
  reads either.
- **`a11y.test.ts`'s guard compares `COVERED` against every `*.svelte` on
  disk**, so a new component fails `npm run check` until it is named there with
  a state that renders it under axe. `vite.config.mts`'s coverage glob reaches
  new component files automatically, so a new component needs no coverage-config
  edit - only a test that reaches it.
- **`coverage.reportOnFailure` is off by default**, so a red vitest writes no
  summary.
- **`.claude/hooks/edit-followup.mjs` tests `p.startsWith('docs/fixtures/')`**
  and fires on `docs/fixtures/share/` - but that directory is **not** a
  public-contract surface (`CONTRACTS.md` enumerates only
  `docs/fixtures/lists/*.json` and `docs/fixtures/urls/routes.json`, and
  `tests/contracts.js` never opens it). The reminder is not evidence that a
  contract moved. An earlier `plan.md` note claimed the hook did not match; that
  premise was false and is corrected.

## Live-app facts the port depends on, and live defects

These are read off `app.js`/`style.css` and survive until R0c deletes them.
`docs/specs/DEBT.md` D1-D6 hold the live defects the rewrite reproduces on
purpose; the entries below are the facts behind them plus the behaviours that
have no `DEBT.md` row.

- **The live app has an opt-in for DOM state that survives `render()`**:
  `restoreOpen()` re-applies `S.keepOpen[...]` to every `[data-keep]` element,
  fed by a capturing `toggle` listener. Three elements opt in - the roll panel,
  the note box, the list note. `storageWarning()` writes no `data-keep`, so the
  notice folds on every re-render, a language switch included, by the live app's
  own rule. **`RecordCard`'s refs `<details>` carries no `data-keep` either**,
  so live closes it on every rebuild and keying the rewrite's card is safe.
- **The live app re-plays the anchor scroll-and-flash on every `render()`**, not
  only on a language switch: `currentRoute()` rewrites `S.tables.anchor` on
  every call and `render()` ends with the scroll-and-flash block. `render()` is
  called 56 times in `app.js`, including from the tables search box's input
  handler - so with an anchor in the address, every keystroke scrolls back and
  re-flashes. The port carries the language-switch re-play only; the rest is
  recorded in `FEATURES.md`.
- **The list card renders the GM payload, not the players' - a live defect.**
  `listCardHTML` calls `listHash(l)` with one argument, so `forPlayers` is
  `undefined` and any `hnote` records stay on the card's own link. The two
  flavours are byte-identical whenever no record carries an `hnote`, which is
  why it went unnoticed. `syncListUrl` rewrites the address bar to the players'
  form after navigation regardless; what the bug affects is the rendered `href`
  - copy link address, the hover status bar, the pushed history entry. The port
  matches it. **Nothing in the harness could have caught this**: no parity spec
  reads an `href`, and the seeds carry no `hnote`, so 36/36 green cells and a
  full unit suite were silent. It was found by reading `app.js` against the port
  - and a false "measured" fact about it had already been written into two
  durable documents.
- **"Восстановить из ссылки" refuses the very link "Поделиться" copies**: the
  import regex has no `~` and `decodeList` `atob`s the payload, so a packed
  short link is rejected with `badShare`. The rewrite fixes it
  (`env.compress.unpack` before decode).
- **The record page's tab title is the plain app title, by a live defect**:
  `render()` writes the record name into `document.title` and then calls
  `syncChrome()`, whose last line overwrites it. `DEBT.md` D5.
- **The two-frame filter link.** `f_frame-beast_feast-colossus` decodes to
  `{frame:['beast'], feast:['colossus']}`. The legacy `_` reading fires iff the
  body has no `.` and every `_`-split piece contains a `-` after position 0.
  **The live app meets that condition only on arrival**, because `S.fSeg` stops
  it re-reading its own write; the rewrite re-read `app.route.filter` after
  every `replace()` and so broke in-page too. Arriving at that link fresh, live
  shows no pills, count 94, 0 rows - so the live app has the same defect on
  arrival. This was defect 1 of the two the owner reported; fixed in B11.
- **`.miss` has no live rule and no live screen**: `app.js:7` is
  `const DATA = window.LOOT.items;`, so a missing `data.js` throws before
  anything renders. The rewrite's `noData` screens are its own state, kept
  deliberately; `storageOff` replaced a real live warning and was deleted.
- **The storage warning is not chrome**: live draws it on the two lists pages
  only, in two forms, and only the `<details>` form is dismissible.
- **The add-to-list menu is drawn before its button in the DOM**, and the
  document click handler closes any open menu *first* - so the harness's `EN`
  press after `enter` folds the menu, and every menu state's English cells
  compare the folded row. Not a defect on either side. `placeMenu` adds `up`
  when `innerHeight - button.bottom < menu.height + 16` and then
  `scrollIntoView({ block: 'nearest' })`, so a menu state is a scrolled state.
  **style.css has no base `.dropmenu.up` rule** - only `.cardpick .dropmenu.up`
  - so the bar's menu opening above the bar at every width is live behaviour;
  the rewrite's invented `.dropmenu.up { bottom: auto; top: calc(100% + 8px) }`
  was deleted.
- **The modal menu's side (D6).** On open the two apps agree in all 24 probed
  cells: `up` iff `below < need`, decided by the card's height and the list
  count. **After "+ Новый список" live is `up` in 24/24 and the rewrite diverges
  in 7/24**: live's redraw puts the menu back at its default side and
  `placeMenu` reads "Создать" from there, while the rewrite's `$effect` reads it
  from wherever the menu already is - ~51 px higher, so `below` reads ~51 px
  larger while `need` grows by 33, and the sign flips when
  `below >= need - 18`. A downward open also overflows the `.card` article
  (`overflow: hidden`) and `scrollIntoView` scrolls *that* element, not the
  `.modal-card`; live's `refreshModal()` rebuilds the article and resets it,
  which is why "+ Новый список" appears to heal it. `overflow: clip` plus
  measuring the toggle against `.modal-card` is the candidate Phase 8 fix.
  **No fourth harness width is needed**: 1100x900 with no seed reaches the
  rewrite's regression on two records and the live chop on a third. A fourth
  `WIDTHS` entry would be global (+204 cells, ~+3 min per shard, every legacy
  PNG re-captured) and is not planned.
- **`file://` pages share one `localStorage` in Chrome**, so a previous pass's
  created lists leak into the next. A 43 px menu height difference in one probe
  was one extra list chip, not a rendering difference.
- **Copy selection has no skip set** (unlike a copied roll): each record's
  `shareText`/`shareHtml` joined by `\n\n` / `<br><br>`.
- **`S.kind` is genuinely one object** shared by Core rules, the alternate
  tables and search - which is why `AppState.kinds` is app-wide and the old
  "the kind filter is per panel" decision is retired.
- **Print fitting.** Every `.pc-strip .pc-box b` ends at `font-size: 2.2cqw`:
  `over()` never turns false (a block `b` in a shrink-to-fit box is never
  narrower than its text minus 2 px) and the loop exits at
  2.1999999999999993 after eight `-= 0.1` steps from 3. Under always-tight
  conditions the font ladders stop at `3.0cqw` then `2.6cqw`; the pad floor is
  `8cqw` in colour and **`2.8cqw`** in black-and-white. Sheets: 2 cards -> 1
  sheet / 9 places / 7 blank; 9 -> 1/9/0; 10 -> 2 sheets, 18 places, 8 blank;
  181 known ids -> 180 cards (`PRINT_MAX`), 20 sheets. **Figma is not needed**:
  `card/` holds 35 SVGs and `cardArt()` builds exactly those names; `CONTRACTS.md`
  section 5 freezes `card/*.svg`.
- **`dist/` renders the same print class names as live** - `.psheet`, `.pcard`,
  `.pcard.blank`, `.psheet[data-next]`, `.psheet.bw`,
  `[data-act="printArt"|"printBack"|"printLink"]` - and `print.js` keys the card
  name off `.pc-name` by class, so `FEATURES.md`'s deliberate `<h3>`->`<h2>`
  change does not touch it.

## The cut-over, and what still holds it together

- **GitHub Pages is already served by Actions** (`gh api
  repos/:owner/:repo/pages`: `"build_type": "workflow"`). There is no "Pages
  flip" gate and never was one after 2026-09-12. What publishes the site is one
  step in `ci.yml`'s `deploy` job, "Collect what the site is made of".
- **`dist/` carries absolute symlinks into the repo root** (`dist/card ->
  /e/dev/daggerheart-loot/card`), which do not survive `upload-pages-artifact`.
  So "copy `dist/` instead" is not a one-line change: the step still assembles
  `img/`, `og/`, `i/`, `card/`, `robots.txt`, `llms.txt` and `.nojekyll`
  explicitly. The "Nothing private slipped in" guard still applies and is
  re-checked against the new list rather than assumed.
- **The revert is one command over one file**: `git revert --no-commit 9177f3b`
  (82+/12-, `ci.yml` alone). `git show 9177f3b | git apply --reverse --check -`
  fails on context only - `--reverse` needs exact context and three intervening
  commits touched that file - while `git merge-tree 9177f3b HEAD 9177f3b^` is
  clean. **Measured twice; do not re-litigate.** **R0c ends the guarantee**:
  after the deletions, recovery is restoring paths out of history plus
  rebuilding the collect step. That is why owner condition 6 hangs on R0c alone.
- **The entry document was never ported** until B13. `app/index.html` - and so
  `dist/index.html` - was missing `viewport-fit=cover` (without which
  `SelBar`'s `env(safe-area-inset-*)` resolve to 0 on a notched phone), the live
  `<title>`, the meta description (which is where the record counts live),
  `color-scheme`, the whole Open Graph/Twitter block including `og/_share.jpg`
  at 1200x630, the icon link, and the bilingual `<noscript>` block. **Nothing in
  the tree compares the two documents' heads** - parity shoots pixels after
  boot, and its `title` spec reads `page.title()` after `Shell.svelte` has
  overwritten the static title - so this was invisible from Phase 1. Two
  mechanical traps found with it: `app/index.html` is **not** in
  `.prettierignore` (the root `index.html` is), so the ported markup is
  reformatted and can never be byte-identical - compare parsed values; and the
  `<noscript>` block's `class="wrap"` resolves to nothing in the rewrite, where
  that class lives inside Svelte-scoped components.
- **The rewrite states no record count anywhere**, so `tests/derived.js`'s
  `COUNTERS` check has nothing in the built app to re-point at; the counts reach
  the published site only through the entry document's meta description and
  `<noscript>`, and through `llms.txt`, `robots.txt` and the READMEs. The
  counts rule is **seven** files, five after R0c deletes `index.html` and
  `app.js`. **The stub pages need no edit at the cut-over** -
  `tools/build-share-pages.js` sends every stub to `SITE + '#/i/' + id`.
- **Phase 7 condition 3 is satisfied by evidence** (four green `deploy` runs,
  table below). **A cancelled run is not evidence**: `ci.yml`'s top-level
  `concurrency` is `group: pages` with `cancel-in-progress: false`, which
  protects a run already executing but allows only one *pending* run per group,
  so a burst of doc-only pushes cancels the intermediate ones. Space pushes out
  when a run's own result is the thing being collected.
- **The live site check**: `node tools/check-site.mjs
  https://artex-x.github.io/daggerheart-loot/` -> `сайт опубликован верно`. The
  script requires the URL argument (with none it exits `FAIL no base url`).
  Condition 2's *second* read belongs to R0c.

## What R0b and R0c must not walk past

- **`tests/parity/lock.js` is a live hook dependency R0c's outline does not
  name.** It is imported by `tests/parity.js`, `.claude/hooks/bash-guard.mjs`
  and `.claude/hooks/selftest.mjs`, so deleting `tests/parity/` whole would take
  two hooks with it. Deliberately **not** moved in R0b: after R0c nothing writes
  `test-output/parity.lock`, so the whole mechanism becomes dead and re-homing
  it now is work R0c would undo. Recorded as an R0c step - delete the module
  with its `bash-guard.mjs` rule and its `selftest.mjs` case, or re-home it if
  heavy-run locking is still wanted for `run-all`/`golden`.
- **`tests/lib.js`'s `readPNG` has exactly one consumer**, `tests/print.js`, and
  dies with it in R0c. `ready` and `ROOT` are live-app-only and die correctly.
- **Print's instrumentation is in two files, not one.** Beyond
  `tests/print.js`, four print-only specs in `tests/parity/specs.js` also retire
  in R0c and are measured nowhere else: `sheetCounts`, `cardFit`, `printMedia`,
  `copiedPrintLink`. `printMedia`'s `d.media('print')` emulation (chrome hidden,
  `break-inside`, `print-color-adjust`, the unshadowed sheet) and `cardFit`'s
  per-width fit numbers exist in no other instrument. A port carrying only
  `tests/print.js` loses them. The driver already has every verb the port needs
  (`media`, `computed`, `eachAt`, `count`, `settle`, `clipboard`), which is why
  the driver move had to land first.
- **"Delete the legacy browser suites" is fifteen suites, ten with no
  counterpart.** Dies with the live app: `audit2`, `behave`, `contracts`,
  `craftmob`, `eqtest`, `flows`, `hues`, `lists2`, `noart`, `notes`, `print`,
  `qa`, `select`, `states`, `typo`. Data-only and unaffected: `craft`,
  `dataint`, `derived`, `i18n` - and three of those (`derived`, `i18n`,
  `dataint`) are already load-bearing inside `npm run check`, so "retire the
  legacy suites" cannot mean retiring them. `tests/app/` counterparts already
  exist for `contracts`, `hues`, `states`, `typo`, plus `sweep` for `audit2`'s
  page walk. **Ten have none**: `behave`, `craftmob`, `eqtest`, `flows`,
  `lists2`, `noart`, `notes`, `print`, `qa`, `select`. **A suite whose coverage
  cannot be accounted for is not deleted.**
- **The ten verdicts live in `docs/specs/COVERAGE.md`'s `Fate` column**, written
  by R0b.1's C4, with the covering tests named to the line and every drop
  carrying its reason. `plan.md`, "The ten verdicts", keeps the one-line
  summaries plus the full `lists2` and `eqtest` line maps, which two
  `COVERAGE.md` rows cite back to rather than repeating. **Where the two
  disagree, `COVERAGE.md` carries the later reading and is the one to fix**; the
  maps in `plan.md` are the audit as it was taken.
- **`COVERAGE.md`'s verdict table cites line numbers, and line numbers rot.**
  R0b.1's own C2/C3 invalidated six rows of the table C4 wrote in the same
  batch, because the citations came from an audit against the pre-batch tree.
  All were re-pointed and verified content-identical against `37e4812`. **R0b.2
  adds cases to `tests/app/states.js` and will shift them again**; re-pointing
  is a required step of R0b.2's own `COVERAGE.md` edit.
- **`VISUAL_DEBT`'s 18 entries are one mechanism, not eighteen decisions.**
  Three states (`#/i/q1 ~ another tier`, `#/roll/wondrous ~ modal`,
  `#/tables ~ a row opened`) x 6 cells, all 0.02/0.03/0.07%, every reason "the
  close button's own focus ring" - the consequence of the rewrite's `<dialog>` +
  `showModal()` moving focus where live leaves it on the page. The table's own
  comment is **stale**: it says the fix is what `ACCEPTED` records, and no
  `ACCEPTED` key records it. The ten `ACCEPTED` keys are eight `#/roll/alt*`
  controls entries and two `#/tables ~ grid` controls entries, nothing else.
  R0c deletes the table, so **R0a decided each of the 18** - paid off, or
  carried into a `FEATURES.md`/`STATE.md` bullet or a `DEBT.md` section-2 entry
  - because otherwise eighteen recorded divergences disappear with the file.
- **Two of the four "Recorded, not keyed" divergences are already in
  `FEATURES.md`** and need a verdict, not an edit: the anchor re-play and the
  two-frame link. The other two - `Chip`/`Seg`'s `aria-pressed` and
  `PrintCard`'s `<h2>` - are not, and become bullets.
- **Suite widths do not line up**: `craftmob` runs 320/360/390/430/768, `sweep`
  and `audit2` run 360/390/768/1180, parity runs 375/768/1100. **320 is below
  every other instrument's floor and below `style.css`'s narrowest breakpoint
  (430)** - which is why the 320 assertion was dropped with a recorded reason.
- **`tests/app/sweep.js`'s clipped-text selector list** is
  `.card-name a, .card-name span, .badge, .chip, .fpill, .btn, .lbl, .rnum`. It
  does **not** include `.craft, .rcraft, .dicebar, .numrow`, which is what
  `tests/craftmob.js` measures, and sweep never ticks a row so `#selBar` is
  never drawn during its pass.
- **`#/tables ~ a row ticked` is already a registered state**, so a
  narrow-width selection-bar measurement adds no `STATES`/inventory entry and
  forces no golden re-seed.
- **`.claude/hooks/bash-guard.mjs` matches `node tests/run-all.js` generically**
  and `edit-guard.mjs` guards only `tests/app/snapshots/`, so a new suite needs
  no hook change.
- **`CLAUDE.md` sits at its own 200-line cap.** Any new standing rule forces a
  move-out into `docs/specs/*` or a skill. R0c, which deletes the twenty-line
  "Migration and parity" section, is where the one-line versions land.
- **A placement has to be acceptance, not a footnote.** An item the plan places
  in a batch is written into that batch's acceptance criteria in `handoff.md` as
  its own line, and the closing record says what happened to each: done, or
  re-placed with a reason. A batch is not recorded closed while an inherited
  line has no outcome. Written because two of B12's nits were placed in B13, B13
  closed without them, and both documents went on saying they were handled.

## CI and parity measurement record

Run ids and conclusions, because they cannot be re-derived once retention
expires. Local Windows figures are advisory by owner decision 1.

| run | head | verdict |
|---|---|---|
| `34019148841` | `4976cb4` | the first full red list read off CI (12 grepped lines; the run actually failed **22** cells) |
| `34404013490` | `958f182` | first green run on `main` since 2026-09-03; the 4-way shard's first proof (4-5 min per shard against 867 s single-job) |
| `34482875625` / `34485537392` | `a404a52` / `b6a2fcd` | the same five `#/i/ci1` cells, identical figures, two commits - ratchet firing in the *improvement* direction, so not flake |
| `34521343531` | `e82cd24` | `check`, `audit`, all four parity shards green; `secrets` red on three gitleaks false positives over the key name `dhloot.warn.v1`, fixed by `.gitleaks.toml` (`13bba19`) |
| `34616445556` | `9fd3000` | **all 54 `#/print` cells `совпадает`** - closes the print residue; three anchor cells red as ratchet improvements |
| `34628983995` | `435a5ac` | all four parity shards green; `#/print` clean a second consecutive run; the one red was a `behave` flake, green on attempt 2 |
| `34638174347` / `34640328352` | `dba79ee` / `55f2fa2` | two independent green readings closing B9 and all seven anchor debt deletions |
| `34715233810` | `7a729bd` | green in every job - B12.1's router change moved no parity cell |
| `34718569245` | `9177f3b` | the flip itself, green including `deploy`; the guard printed 13 published entries with no `app.js`/`style.css` |
| `34719879067` | `515e257` | green including `deploy` |
| `34720031859` | `6cb8293` | **cancelled** - superseded while pending, not a failure, not evidence |
| `34720438881` / `34721165294` | `ecbd2f4` / `37c5c2f` | green including `deploy` |
| `34747570250` | `32926a0` | green in every job - **R0a's seeding warrant** |
| `34753801089` | `30b2744` | green; the golden job costs CI nothing (table below) |
| `34754984230` | `06658fd` | `check: failure` on `app/states` case 7 only - a flake, four readings |
| `34755188652` | `6e1269b` | green - the second sample that proved it |

**The golden job costs CI nothing** (`34753801089` against `34747570250`):
`check` 11m51s -> 11m57s, longest parity shard 10m32s -> 10m33s, and the four
new `golden` shards **1m43s-2m02s each**, finishing nine minutes before the job
that gates the publish. A shard costs ~2 min on CI against ~4m20s locally.

Two standing CI annotations, pre-existing and unrelated: `gitleaks-action@v2`
and the three Pages actions target Node 20 and are forced onto Node 24. Worth an
issue of its own if they ever start failing rather than warning.

## Measurements migrated here during the 2026-09-16 compaction

Recorded measurements moved out of `plan.md` and `handoff.md`, whose home is
this file. Attributed to the batch that took them. **Not re-verified** - several
cannot be re-derived.

### The parity cache, proved (B3.6 part 0)

- `node tests/parity.js tables --no-cache` on an empty cache **12m39s**;
  `node tests/parity.js tables` **12m22s**; the same again warm, 44 cache keys,
  **11m22s**. `diff` of all three logs is byte-identical.
- Invalidation: appending a comment to `style.css` moved the key count
  **44 -> 48**. `node tests/parity.js dread --no-cache` left 48 keys before and
  after, proving the flag writes nothing.

### Full unfiltered parity suite, two readings

- On `e82cd24`: **five failing cells, 1848.8 s, 8 workers**, none of them a
  `#/lists` cell (B5.3's six states clean at 36/36, measured three times).
- On `fe0043b`: **12 failing cells, 1826 s, 8 workers**.

### B3.6 part 1's standalone probes (harness launch args, `prefers-reduced-motion: reduce`, both apps)

- `document.fonts`: `size` **0**, `status` **`loaded`** before the first paint,
  `ready` settling ~400 ms in. **This disproved the face-swap reason the anchor
  effect's comment carried.**
- Width sweep `window.scrollY`: live **368 / 368 / 374** against rewrite
  **368 / 368 / 387** at 1100 / 768 / 375, one `scrollIntoView` each at 1100,
  against the same 118 px `scroll-margin-top`.
- `.flash` presence: live **yes** on arrival, **no** after 1.6 s, **yes** again
  after the EN click; rewrite **no** at every step.

### Pixel decomposition of the CI screenshots (pixelmatch, harness settings, `diffMask`, banded by row)

`#/i/ci1 ~ whole @ ru 1100` is **0.49%** the missing row, **~1.7%** the footer
it holds down and **3.62%** the 38 px band the shorter page runs out at.
Reinserting those 38 px leaves **zero** changed pixels below the row.

### The live site's roll re-render, measured under throttling (B13 item 1)

One mutation batch at **4.3 ms**, handler **0.9 ms**, four image requests
starting at **5 ms**, and the same four `<img>` elements already present at
**t=26 ms** with three still loading. Both apps ship identical
`loading="lazy" decoding="async"` and **neither ships `srcset`/`sizes`**.

### Gate and run-size corrections

- **B14's parity run was 20 states = 120 cells, not 88.** The "88 cells" in
  B14's built record was a `tail -n 120` artifact, corrected at closeout. The
  harness prints no counts - blocker B1's origin.
- **B12.1's gate cost**: `node tests/run-all.js app/contracts,app/sweep` -
  **574.5 s** slowest entry, `app/contracts` with no `skipped` line, all 26
  route fixtures read field by field.

### Where the complete CI failing list came from

The complete list came off the **`failure-output` artifact of run
`34361836525`** (commit `79e26c9`), not off `gh run view --log-failed`: the log
shows about a dozen grepped lines and the run actually failed **22** cells. The
artifact carries `test-output/parity.log` in full plus every screenshot and diff
image the ubuntu run produced.

### Build-output facts (R0b audit)

- **`dist/assets/*.css` does not exist**; `grep -c "@page" dist/assets/app.js`
  is **1**. Vite's build for this project (iife format, no code splitting,
  `base: './'`) inlines component styles into the JS bundle rather than emitting
  a separate stylesheet.
- `ls dist/card | wc -l` is **36**, not 35.

### The focus-walk replay (reviewer)

The verdict was computed twice per real Tab stop - once genuinely focused, once
with the element forcibly blurred a settle later. The OR-combined
`outline || box || border` check **still passed while blurred on over a third of
`#/roll/std`'s stops alone**, and the same shape held on all six `FOCUS_WALK`
addresses, **894 stops** total.

### Run `34747570250`, job by job

`secrets` 7 s, `parity (1)` 9m31s, `parity (2)` 8m10s, `parity (3)` 10m32s,
`parity (4)` 8m55s, `audit` 15 s, `check` 11m51s, `deploy` 31 s - every job
green. **The four parity shard times are the cost baseline for R0c's "what does
the workflow look like without a parity job" read.**

### The legacy suites re-pointed at `dist/` (Phase 5 probe)

With exactly two edits - `ROOT` -> `dist/index.html` and `ready()`'s `#view` ->
`#app`:

- **`typo` passes** (two fonts, one scale, 13 pages, both languages).
- **`audit2` at 1180 passes** (41 addresses, both languages).
- **`hues` fails 16 assertions** because it injects bare
  `<span class="badge item">` elements and reads their colour, and the
  rewrite's `.badge` rules are Svelte-scoped, so an injected span gets none.

## Constraints

- Public contracts default to no change; an unavoidable change updates
  `docs/fixtures/`, `tests/contracts.js`, `docs/specs/CONTRACTS.md` and
  `llms.txt` in the same commit.
- All style/markup parity fixes require `npm run check:built`.
- A full parity run is not one foreground call; filter while working.
- Never write a `VISUAL_DEBT` number from this host.
- Repository gate configuration (`.prettierignore`, `eslint.config.mjs`) is
  `issues/config-audit/`'s surface, not this task's. Widening a gate to
  accommodate a third-party drop is the same move as routing around one.

## Do not re-fetch unless

- The human provides new info
- context.md is missing a fact you need
- You suspect drift vs issue or plan

## What this compaction dropped

So a reader knows where something went rather than re-measuring it.
`git show fc59ce4:issues/47/context.md` is the full prior text.

- **Every "State at the \<batch\> kickoff" section** (B4, B5.3, B5.4, B5.6,
  search, print, B7, B10, Phase 5, B12, B12.1, B13, B14, R0a, R0b): superseded
  status snapshots. Their durable content - host readings, shell hazards, tree
  hazards, owner decisions - is consolidated above.
- **The per-batch "planning facts" geometry tables for B4-B10** (live-app
  computed styles, rects and heights at 1100/768/375 for the tables, lists,
  list-page, search and print surfaces): the ports shipped, CI reads the cells
  green, `tools/probe.mjs` re-derives any single number with the harness's own
  args, and the parity suite enforces them continuously. What those sections
  *earned* - the traps, the live defects, the disproved reasons - is kept above.
- **The `app.js`/`style.css` line-number code maps** (`renderLists`,
  `renderSearch`, `renderPrint`, `printCardHTML`, `fitPrintCards`, the handler
  tables, the dictionary key inventories): re-derivable, and rotting. Specific
  line citations survive only where a decision hangs on one.
- **Per-batch "built" narratives and close-out prose** for B4 through B14: the
  code, its specs and `plan.md`'s outcome lines are the record.
- **Host-block incident sections of 2026-09-11 and 2026-09-12** (the commit gate
  that could not arm, the three-run table, the `explorer.exe` attribution): the
  mechanism is in "The host throttles" and "Command costs"; the attribution was
  wrong and is in "Reasons already disproved".
- **The B5.6 packed payload string**: it lives in `tests/parity/specs.js` and
  `docs/fixtures/`, with the generating command in `plan.md`.
