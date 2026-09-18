# Shared task context - TASK phase-8

Orchestrator maintains this file so later steps do not re-fetch the same sources.

## Goal

Work through what the Svelte migration deliberately left behind, plus what a
broad post-refactoring critique found. Two input streams, one plan:

1. **The divergence register** - `docs/specs/DEBT.md` entries `D1`-`D23`
   (`D9` is a numbering gap). Live defects and decisions the rewrite
   reproduced on purpose, each owed a decision now that the old app is
   deleted and can no longer answer the question.
2. **The critique sweep** - seven read-only agents run 2026-09-17, one report
   each under `issues/phase-8/critique/`. See "Key paths".

The owner's framing, verbatim, so it is not paraphrased away:

> for sure we should improve test timing - goldens are pretty fast to be in
> separate shards, maybe we can re-distribute tests more evenly across shards
> or get rid of the sharding idea?
>
> we need to look for items such as wierd DOM compositions (like why the fuck
> prettier decides how components will be rendered or things such as
> `expect(pills).toContain('Двуручное×')`), gaps, useless or outadated or too
> verbose comments, style incosnsistences, repository structure, any shared
> component extractions or refactoring oppurtinities, wierd components
> interactions, so both technical and user-facing staff that can be improved
> post-refactoring
>
> make sure all code e.g. tests use english, minimize amount of russian in the
> code itself, only user-facing content and russian markdown alternative
>
> do not plan huge features such as consistent storage or significant UI/UX
> redesign, it will be done in the scope of the different tickets

## GitHub issue (if any)

- URL: none. Task id is the slug `phase-8`, assigned by the orchestrator
  2026-09-17. The owner may file an issue later; nothing waits on it.
- Predecessor: issue 47 (Svelte migration), **closed** at `d5e3e5a`.
  Its `handoff.md` carries the "Phase 8 opening inputs" section - the full
  R1/R2-Rn/Exit review design, migrated out of `plan.md` at closeout so this
  task can open without it.

## Screenshot / attachment findings

- None. This task opens from code, specs and the deployed site, not from
  issue attachments.

## Key paths

- Specs: `docs/specs/{CONTRACTS,ROUTES,STATE,FEATURES,COVERAGE,I18N,META,DEBT}.md`
- Register: `docs/specs/DEBT.md` section 3 (the R0c sweep's findings) and the
  older sections (`D1`-`D11`)
- Critique reports (all written 2026-09-17, read-only agents):
  - `issues/phase-8/critique/product.md` - user-facing, 16 findings `P1`-`P16`
  - `issues/phase-8/critique/components.md` - DOM composition, extraction, boundaries
  - `issues/phase-8/critique/tests.md` - CI timing, sharding, assertion quality
  - `issues/phase-8/critique/hygiene.md` - comments, language policy, structure, dead code
  - `issues/phase-8/critique/performance.md` - bundle, render at 1091 rows, images, print
  - `issues/phase-8/critique/docs.md` - specs verified against actual behaviour
  - `issues/phase-8/critique/tooling.md` - `.claude/hooks/` subsystem, cold-clone DX
- Predecessor record: `issues/47/{context,handoff,plan,sweep}.md`
  (`plan.md` is retained as a historical record - see "Reasons already disproved")
- Code hot paths: `app/src/{components,lib,ports,state,styles}/`
- Mocks: none; `docs/fixtures/` holds contract fixtures, not mocks

## Command costs

Measured on this machine 2026-09-17. The Bash tool caps at 600s.

| Command | Wall clock | Fits one call? |
|---|---|---|
| `npm run check` | ~6-11 min (11m29s on CI) | yes, but only just - use timeout 600000 |
| `npm run check:built` | a few minutes | yes |
| `node tests/run-all.js app/print,app/contracts,app/states,app/typo,app/hues,stub` | minutes | yes |
| `node tests/app/sweep.js <width>` | minutes | yes |
| `node tests/app/golden.js --shard=n/4` | ~290s per shard (286.7s measured) | yes, one shard per call |
| `node tests/run-all.js derived,dataint,craft,stub` | ~5s total | yes |

Always one **foreground** call: `set -o pipefail; npm run check 2>&1 | tail -n 120`.
`bash-guard.mjs` rule 2g denies a backgrounded `npm run check`, and a turn that
ends with a check still running loses the result - the shell dies with the agent.

## Which machine is authoritative

- For recorded numbers: **CI**. A local run is advisory. The host throttles -
  see "Reasons already disproved".
- A difference on another machine means the number is contended, not that the
  code changed. Prove it by isolation before believing it.

## Reasons already disproved

Causes a previous session wrote down and a later one refuted. Keeping the list
stops the next session re-deriving them from the same evidence.

- **"A test failing under the full suite is a regression."** No. On 2026-09-17
  `app/src/components/sharedListPage.test.ts:296` failed in 2 of 6 full runs
  and passed clean in isolation (20/20, 63.8s) on a tree whose diff never
  touched it. Host contention. Prove by isolation before treating a
  full-suite-only failure as real.
- **"A backgrounded `npm run check` that later exits 0 arms the commit gate."**
  It does not. `.check-cache.json` was read before and after such a run and had
  not moved; `check-observer.mjs` never fired. Only a foreground call arms it.
- **"The deploy job has no build step, so untracking generated files breaks
  Pages."** False - `deploy` runs `npm ci` then `npm run build`
  (`npm run data && vite build`) **before** the collect step. This is why
  untracking `i/` at `f53f44d` was safe, and the deploy proved it.
- **"`og/` is derived from `img/`."** False. `tools/artwork/run.mjs:157`
  (`encodePair`) encodes both from the same original delivery buffer;
  `verify` (`:219-222`) re-encodes from that original to compare against both.
  Nothing reads `img/*.webp` to make `og/*.jpg`. Both are unrecoverable from
  the repo once a delivery drop is gone.
- **"`data.json`/`catalog.csv` cost review noise and repo weight."** Refuted by
  measurement: `wc -l data.json` is **1**, so every commit shows
  `data.json | 2 +-`; and 20 revisions pack to 432,908 B (`catalog.csv`
  275,268 B across 17) - together 708 KB of a 147 MB `.git`, 0.5%. They stay
  tracked. `i/` was the only one worth untracking, and on file count
  (1091 files, 73% of tracked non-image files), not bytes.
- **"The shared-list hash is an injection surface."** No. Production components
  avoid `{@html}` deliberately - `record.test.ts:187,261` say so - and there is
  no `{@html}` outside tests. Untrusted hash input becomes text nodes.
- **"`issues/47/plan.md` was retired at closeout."** It was not. The owner
  chose to keep it permanently: `bash-guard.mjs`'s retirement guard greps the
  whole repository and 7 citations remain in `issues/closeout-hygiene/` and
  `issues/config-audit/`, one of which explicitly forbids the edit. All 7 are
  historical measurements that already resolve only via `git show <sha>:...`.
  `plan.md` carries a Status line marking it historical.

## A deterministic B8 regression, measured 2026-09-18: the three timed owned-list goldens

**Not a product defect and not B7's title - but it IS caused by B8, and it is
deterministic, not a flake.** Written down with the decoded evidence so nobody
re-derives it or re-opens the wrong suspect.

**This section was first written calling it a race that pre-dated B7. That was
wrong on both counts**, and the correction is kept rather than overwritten
because the wrong version was already pushed and the reasoning that produced it
is the reasoning to avoid: one failure scattered per shard *looked* like a
race, and one green run (`fa56576`) *looked* like luck. Two things settled it -
a second consecutive CI run failing identically, and a local reproduction.

CI run `35324207396` on `6b50945`: `browser (3)` green (B7's remediation fixed
the `f7` fixture), but `browser (1)`, `(2)` and `(4)` each failed with exactly
one golden, `ru` only, diverging at tree line 1:

- `#/lists/a ~ removed` (shard 2), `~ prices set` (shard 3), `~ batch deleted`
  (shard 4).

Line 1 is the `RootWebArea`, which carries the document title **and** the
packed list URL. The **title is byte-identical in all three**
(`"Клад дракона — Генератор лута — Daggerheart"`), so D5/O3 is not implicated.
The whole divergence is the URL payload. Decoded:

| state | expected (`было`) | actual on CI (`стало`) |
|---|---|---|
| `~ removed` | `Клад дракона\n6.9cfk~ci2,ci3,ci4,ci5,ci6,ci7` | `Клад дракона\n7.trm3~ci1,...,ci7` |
| `~ prices set` | `Клад дракона\n7.r35z~ci1*1*100,ci2,...,ci7` | `Клад дракона\n7.trm3~ci1,...,ci7` |
| `~ batch deleted` | `Клад дракона\n6.9cfk~ci2,ci3,ci4,ci5,ci6,ci7` | `Клад дракона\n7.trm3~ci1,...,ci7` |

**All three actuals are the same string**, and it is the untouched `seven`
seed. So on CI the hash still carried the pre-interaction list when the
snapshot was taken: the interaction ran, but `ListPage`'s **150 ms debounced
URL sync** had not fired yet. `compareGolden` reports only the first
divergence, so the rest of each tree is unverified by this evidence, not known
to differ.

Why exactly these three and no others: the failure needs both conditions at
once, and only these three states have both.

- `timed: true` (`tests/app/inventory.js`) - the capture is scheduled against a
  7000 ms toast window rather than a settled page. Seven states carry it.
- an **owned-list route**, which is where the URL is written on the debounce.
  The other four timed states (`#/roll/wondrous ~ pinned`, `#/i/ci1 ~ toast`,
  `#/tables ~ selection copied`, `#/lists ~ created`) are not; every other
  `#/lists/a` state is not timed.

### The cause: B8's D1 meeting a driver setting that predates it

`tests/app/driver.js:775`, inside `prepare(page)`, has **always** run every
driver page - every golden capture included - under emulated
`prefers-reduced-motion: reduce`. Its comment is parity-era ("both apps fade a
card in over 0.28s... takes timing out of the pixel comparison"), so it long
predates B8 and was deliberate.

B8 then shipped D1, the **blanket** reduced-motion kill in `tokens.css:176`
(`animation-duration: 0.01ms`, `transition-duration: 0s`, `scroll-behavior:
auto`, all `!important`, on `*`). Under the driver's emulation that rule is
live in every capture, where before B8 only the app's own specific reduce
handling was. The toast-timed states therefore reach their snapshot earlier
than they used to - earlier, now, than `ListPage`'s 150 ms debounced URL sync.

Evidence it is deterministic and not host-dependent:

- CI failed identically on two consecutive runs, `35324207396` (`6b50945`) and
  `35325098367` (`c90f082`) - same three states, same payloads.
- It **reproduces locally**: `node tests/app/golden.js --only="#/lists/a ~"`
  on this Windows host, 11 states compared, the same 3 FAILED in 24.5s.
- It bisects cleanly. `fa56576` was green across all four golden shards (112
  states). The only code change between that and the first red run is B8
  (`3c0fff8`); `8e43c92`, `d946f8b` and `c90f082` are docs-only and `6b50945`
  touches a fixture, `i18n.ts` comments and tests.

**Why B8's own gates missed it**: B8 claimed no golden movement and proved it
with two `--only` probes, `#/i/ci1` and `print`. Neither reaches an owned-list
route, and the three affected states are the only ones that are both
`timed: true` and on one. The claim was true of everything it measured.

Related: B6 already chased a `flushUrlSync`/`del()` staleness bug in this same
area (R4-1/PF3).

Do **not** re-record these goldens to match CI - the recorded payloads are the
correct post-interaction ones. The fix belongs in how the state is captured or
flushed, and the choice between waiting on hash stability in the driver, giving
these three states an explicit settle step, and flushing the URL synchronously
in production is a design call, not an implementer's pick.

Evidence kept: CI logs `test-output/app-golden---shard-{2,3,4}-4.log` from run
`35324207396`'s failure artifacts.

## Constraints

- **Scope fence, owner-set:** no large features. Specifically no consistent
  storage layer and no significant UI/UX redesign - the owner has separate
  tickets for those. A critique that raised one recorded it under "Noted, out
  of scope"; keep it there.
- **Language policy** (`CLAUDE.md`, and the owner reaffirmed it): source,
  identifiers, tests and developer docs are English. Product text may be
  Russian. `app/src/lib/dict.ts` is the product's own voice and stays Russian;
  `README.ru.md` is the sanctioned Russian markdown. A message *about* a test
  must be English; an assertion *on* user-facing text may be Russian.
- **Public contracts default to no change** - `docs/specs/CONTRACTS.md`,
  `docs/fixtures/`, `tests/contracts.js`, `llms.txt` grammar. An unavoidable
  change updates all four in the same commit.
- **Product laws that are not negotiable:** lists in URL hash + localStorage,
  no backend or upload service; `noindex` while crawling stays allowed;
  equipment tier from the source book, never inferred from stats; print is
  nine 63x88 mm cards per A4 with colour and black-and-white as distinct
  layouts and browser-measured fitting; `data.js` stays a classic script with
  relative paths so `file://` works.
- **The 110 structural goldens** (`tests/app/snapshots/`, matching
  `tests/app/inventory.js`'s `STATES`) compare rendered output. Any change that
  moves rendered bytes must say so and justify the re-record. A change that
  moves them silently is a defect. A new state gets an `inventory.js` entry and
  a re-seeded golden in the same change.
- **Coverage is enforced per file and directory.** A new file must be reached
  by a test, not by a matching filename. Component tests end with
  `expectNoA11yViolations`.
- `i/` is no longer tracked (`f53f44d`); it is built by `npm run data` and
  published as deploy-job output. `img/`, `og/`, `card/`, `data.json` and
  `catalog.csv` remain tracked.

## Planner findings (2026-09-17) - durable, verified read-only at f53f44d

Corrections to the reports, so no batch re-derives them:

- **D7's cause is opacity, not the tokens.** `git grep -e '--muted'
  23c00a6^ -- style.css`: live already had `--muted:#9b93b3` and
  `--muted2:#8a83a3`, the same values `tokens.css:23,27` carries. D7's
  `#77708c` is `#9b93b3` at `opacity: 0.72` (`Chip.svelte:94`, `.chip
  small`) / `0.75` (`ListPage.svelte:1111`, `.nlbl i`). Fix is two deleted
  declarations (plan B7), not a palette change.
- **`#/search` has seven goldens** (`_search*.txt`); `product.md` P7 said
  none. P7's count line moves `_search_capped`.
- **RETRACTED (orchestrator, 2026-09-17): `CLAUDE.md` does *not* name deleted
  suites.** The planner reported `node tests/run-all.js eqtest,qa` at
  `CLAUDE.md:110`; that is the **pre-R0c** text. C4 (`d6371e7`) already
  changed it, and the current line 110 reads `node tests/run-all.js
  contracts,dataint`. Verified twice: `rtk grep -n eqtest CLAUDE.md` returns
  nothing, and `git grep -n eqtest` finds it only in `tests/`, `COVERAGE.md`
  and other tasks' documents. `docs.md` was right and the correction was
  wrong. Do not plan an edit for this.
  The planner's *other* `CLAUDE.md` line citations were checked against the
  current 167-line file and hold (`:36` is the stale "parity run" word,
  `:97` the `COUNTERS` pointer), so only this one claim is retracted.
  **The cause is worth keeping**: an agent's injected `CLAUDE.md` copy can be
  the version from when its context was built, not the version on disk. The
  orchestrator hit the identical trap earlier the same day. Re-read
  `CLAUDE.md` from disk before citing a line in it.
- **Also retracted (planner, second pass): the one-call `app/sweep,...`
  command.** On disk `CLAUDE.md:111` reads `node tests/run-all.js
  app/print,app/contracts,app/states,app/typo,app/hues,stub` and `:112-114`
  already say `app/sweep`/`app/golden` run per width/shard - the same stale
  injected copy. Consequence for Q7: of the nine accepted edits, #3 (the
  `docs/parity.md` row), #4 (the cost pointer), #5 (`eqtest,qa`), #6 (the
  `app/sweep` command) and #8 (the "Migration and parity" section) were
  already in the tree at `d6371e7`; only `:24`, `:36` and `:97` remain, and
  they land in B2. The file is 167 lines and gains one (the batch-size
  forcing function), so nothing shrinks.
- **The live `dhloot.prefs.v1` held `{ view }` only** (`app.js:1088` at
  `23c00a6^`); the READMEs' "height of note fields" was never true.
- **D8's `<h4 class="altcol">` is in `TablesPage.svelte:538`**, not
  `TableRows.svelte`.
- **D16 has no benefit on either app**: the idle toast is `display: none`
  on both, so no live region pre-exists in the accessibility tree.
- **P4(b) is D6's fix**: `AddToList.svelte:174` reads the first `.btn` in
  `.seldrop`; moving `.dropmenu` after the toggle makes that the toggle.
  `tests/app/states.js:68-70,125` already has the 1100x900 case on Кольцо
  Тишины.
- **`golden.js --only=<substring of a state id>`** (`golden.js:32-33`) runs
  a subset - the cheap "does not move" proof used throughout the plan.

Class counts (exact, Grep tool): `say` shims 10 (+1 test double in
`state/lists.test.ts:19`, legitimate); `let open = $state<Record_|null>`
8; `use:seedText` 2; `app.env.clipboard` 14 in 8 components; `#1a1206` 8
in 7 components; `.numrow {` 5; `.badge {` 3; `.results {` 3;
`prettier-ignore` regions 4; `{@render}` eslint disables 3; `per width`
comments in `inventory.js` 7; `plan.md section` citations in
`tools/tg-preview` 21 across 7 files; Cyrillic lines per file under
`tests/` and `tools/` equal `hygiene.md`'s table exactly (`derived.js`
250, `dataint.js` 86, `print.js` 200, `states.js` 142, `inventory.js` 141,
`sweep.js` 66, `run-all.js` 33 ...). No `pageshow`/`visibilitychange`/
`focus` listener anywhere in `app/src`. `work/` holds three untracked PNGs
matched by no `.gitignore` rule. Every `uses:` in `ci.yml` is a mutable
tag; no `timeout-minutes`; no `git diff` anywhere under `.github/`;
`deploy`'s `permissions` lacks `contents: read`.

Cross-report identities: T4 = DP4; PF3 = R4; S4 + R2 share one trigger
gap; C1 is A2's symptom; C6 is an extraction not a relocation; TL7 = DP8;
T10 = DP9; DC10 = H3; DC11 = H4 = TL4's stale prose; H6, H7 inside C5; T9
inside C4; T8 dissolves under T1; O3 = D5 generalised; TL8(c) = CLAUDE.md:36.

Owner decisions pending: see `plan.md`, "Owner decisions" (Q1-Q8).

## Do not re-fetch unless

- Human provides new info
- context.md is missing a fact you need
- You suspect drift vs the critique reports or the register

## Settled owner decisions (2026-09-17)

The eight `NEEDS_HUMAN_CONFIRMATION` questions in `plan.md`, "Owner
decisions", are answered. The owner took the planner's recommendation in
every case. Verbatim outcomes, so no later session re-opens them:

| Q | Decision |
|---|---|
| Q1 (DC1) | **Restore** table-view persistence - `dhloot.prefs.v1 { view }` on `AppState` + `TablesPage`, with a test. Do not delete the `STATE.md` rows. |
| Q2 (P16) | **Look first, then shrink.** Open `#/print/cm26-f60-hi62-ci81` and inspect the real worst case before writing code; then `.pc-name` may shrink, floor 4.6cqw, two-line cap, pinned by `print.js`. A deliberate, evidenced deviation from Figma nodes `714-42387` / `3773-90792`. |
| Q3 (R9) | **Fall back home** on an unknown table name - one rule for every unreadable address. |
| Q4 (R10 + D2) | **Keep the address** on a failed expansion and draw the bad-link page; the third `expanding/expanded/failed` state is authorised, with its `inventory.js` entry and golden in the same change. |
| Q5 (D1) | **Keep the blanket reduced-motion kill** as policy. |
| Q6 (D11) | **Print the tier on frame equipment.** Moves printed output; re-record in the batch that already re-records. |
| Q7 (CLAUDE.md) | **Accept all nine edits**, including #2 (the inverted "preserves behaviour" rule) and #8 (replace "Migration and parity" with "Structural goldens and the register"). |
| Q8 (O2) | **Yes, last.** Normalise the 381 equipment names' U+2019 to ASCII in its own final batch. Cosmetic once B1 lands. |

Two notes that are part of the decisions, not commentary:

- Q2 is **not** a licence to skip the inspection. The owner chose the option
  whose first step is opening that route and looking; a floor picked without
  it is a guess wearing a number.
- Q8 is cosmetic **only because B1 ships first**. If B1 is ever dropped or
  deferred, Q8 stops being cosmetic and becomes the search fix, and the
  ranking has to be revisited.

### Two further owner decisions (2026-09-17)

- **`404.html`: ADD it.** The planner deliberately did not plan this (R8)
  and the orchestrator recommended skipping; the owner chose to add it.
  Scope as the planner costed it: a small bilingual "way home" page, ~20
  lines, plus a line in `ci.yml`'s collect step and a row in
  `docs/specs/META.md`. Design notes for whoever implements it: GitHub
  Pages serves `/404.html` from the published root, so it has to reach
  `_site` - the collect step is an **explicit list**, so it will not arrive
  by itself. Decide deliberately whether the file is authored-and-tracked
  at the repo root or generated by `tools/build.js`; authored is simpler
  and it has no data in it. It must carry both languages (`I18N.md`), keep
  `noindex` like every other page (`META.md`), and use relative asset paths
  so it does not break `file://`. **It has no home in the plan's twenty
  batches** - fold it into B5 (deploy and gate correctness), which is the
  batch that already opens `ci.yml`, and give it its own acceptance line
  rather than letting it ride unnamed.
  Rationale for the owner's call, recorded because it overrides the
  recommendation: the realistic way a reader hits a bad stub URL is a
  preview link truncated by a chat client, not navigation inside the app -
  which is exactly the case `resilience.md` R5 documents for share links.
- **The twelve repo-decided items proceed as planned**, unvetoed: P5 undo
  on list deletion, O3 per-page titles, P10 selection-bar tab order, D19
  overlay skip link, D18 global focus ring, H12's two test renames, D4 and
  D17 kept and documented, D16 deleted as a proven non-issue, D21 as
  session memory, D12 keeping `aria-pressed`.

## Review and nit policy for this task (owner, 2026-09-17)

**Every batch gets a reviewer**, run read-only against its **committed shas**
while the next batch's implementer works. Reviews therefore cost no wall
clock; only remediation serialises, and that resumes the reviewed batch's own
implementer after the in-flight batch commits.

**Nits are processed immediately, even when a review returns no blockers.**
This is a deliberate deviation from `.claude/prompts/orchestrate.prompt.md`,
"Nits: defer mid-plan and clear on the terminal batch". That rule's stated
premise is "a later batch re-enters those paths, and one pass over the
finished area beats a pass per batch". Phase 8's eleven batches were merged
**by area** precisely so they do not overlap, so the premise does not hold
here: a deferred nit would have nothing to ride and would reach the terminal
batch as a pile. Owner's instruction, with that reasoning, 2026-09-17.

Consequence for reviewers: list nits fully and precisely, because they will
be acted on rather than filed. Mark genuine matters of taste as such.

**Why this section exists.** B2 (`44b1761`) touched `docs/specs/CONTRACTS.md`
and `llms.txt` across 57 files and recorded three deviations - two separate
triggers in the orchestrate prompt's "When to run reviewer (do not skip
these)" list - and the orchestrator skipped the review to keep the batch loop
moving. It was caught by the owner asking, not by the process. A contributing
cause is a real contradiction in the standing documents, **queued to be fixed
once B3 and the B1/B2 reviews land**:

- `CLAUDE.md:163` calls the reviewer **"(optional)"**.
- `.claude/prompts/orchestrate.prompt.md` heads the same rule **"When to run
  reviewer (do not skip these)"** and lists five triggers.

The fix has the same shape as the batch-size forcing function B2 shipped,
and for the same reason - a rule nothing asks you to demonstrate is a rule
that erodes:

1. Delete "(optional)" from `CLAUDE.md:163` and point at the triggers.
2. Each batch's handoff record states `Review: required (trigger: <which>)`
   or `not required (no trigger fired)`. Both are already derivable from what
   the record contains - files changed and deviations reported - so this
   forces the check to be shown, not performed anew.

## B3 review findings that outlive the batch (2026-09-17)

Verdict was **approve**; the partition was independently replicated offline
for `m = 1..25` and the CI numbers re-downloaded from run `35232880507`.
Two findings are recorded here because they change what a *later* pass
should do, and would otherwise be re-derived at full cost.

- **Do not spend a batch correcting the shard weight table expecting speed.**
  The packer minimises bin sums, but each CI runner is itself a 4-way pool,
  so sums are nearly irrelevant to wall clock: real wall is
  `max(longest single row, total / 4)`, and `total / 4` is ~160 s against a
  longest row of 312-372 s, so the sums never bind. The reviewer re-ran the
  packer with the corrected 371.9/172.7 weights: **predicted wall clock
  unchanged at 371.9 s** - only membership shuffles. Correcting the weights
  buys documentation accuracy and a re-proof CI run, not time. The only lever
  that moves 436 s further down is **splitting `sweep1180-ru` itself** - the
  RU focus walk is what makes that half heavier than `en` (371.9 s vs
  172.7 s), so hoisting it into its own row is the change with the payoff.
- **The matrix/divisor coupling is the last silent-coverage hole** and is
  routed into **B4** as an explicit acceptance line. `.github/workflows/
  ci.yml`'s `shard: [1, 2, 3, 4]` and `--shard=<n>/4` must agree. Three ways
  to break that are loud (a divisor above the matrix throws; a deleted
  `browser:` job invalidates the workflow; a renamed job fails
  `tests/derived.js`'s `needs:` assertion). **One is silent**: shortening the
  matrix to `[1, 2, 3]` while leaving `/4` drops shard 4's three suites -
  including `sweep1180-ru` and `golden4` - and CI stays green. `derived.js`
  already parses `ci.yml` for the deploy block, so one assertion there that
  the matrix list length equals the divisor and the list is `1..m` closes it.
  B4 opens both files, so it costs nothing extra.
- Cross-shard determinism rests on `Array.prototype.sort` being stable over
  equal weights (currently two ties). Four separate node processes each
  recompute the partition and agree only because of that. Load-bearing and
  invisible; a comment is queued as a nit.
