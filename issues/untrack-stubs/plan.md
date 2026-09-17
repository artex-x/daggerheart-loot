# Plan - TASK untrack-stubs

## Recommendation

**Untrack `i/` only. `data.json` and `catalog.csv` stay tracked.**

One batch, B1, unchanged in shape from the version the owner already ruled on.
The scope extension this session was asked to make - "extend the plan from `i/`
alone to the three generated artefacts" - was investigated and comes back
**no**: the argument that carried `i/` does not transfer to the other two, and
for `data.json` it is outweighed by a measured regression. Section "The
three-artefact question" is the answer, with numbers; nothing else in the plan
moved except refreshed counts (`main` advanced from `5d2ddf9` to `d5e3e5a`).

## The three-artefact question

### Why the batching premise dissolves

The dispatch's reason for treating the three as one batch was that they share
one `docs/specs/CONTRACTS.md` sentence, so splitting means editing it three
times. **They do not share it.** Verified by reading the file:

- `CONTRACTS.md` **section 5, "Static asset paths"**, line 106: the list is
  `img/<id>.webp`, `og/<id>.jpg`, `card/*.svg`, `i/<id>.html`, followed by
  "Those four are committed and published as they are." `data.json` and
  `catalog.csv` **do not appear in section 5 at all**.
- `CONTRACTS.md` **section 4, "Machine-readable data"**, lines 91-97, is where
  they live, and it already says only: "All three are generated from `data.js`
  by `node tools/build.js` and compared byte for byte by `tests/derived.js`."
  It makes no claim about being committed, so untracking them would need **no
  section 4 edit** either.

So the sentence is touched once, by `i/` alone, whatever happens to the other
two. The shared-cost argument for one batch reduces to one `.gitignore` hunk,
one README pair and one gate run - real, but small enough that it cannot carry
a change whose own benefit is near zero.

This also answers the question the dispatch asked to confirm: the section 4 vs
section 5 distinction **needs no separate ruling**, because on this
recommendation no section 4 text is touched. The ruling already given covers
the only contract text that moves.

### What untracking the two would buy - measured

| | `data.json` | `catalog.csv` | `i/` for comparison |
|---|---|---|---|
| Tracked files removed | 1 | 1 | 1091 |
| Share of the 3270 tracked files | 0.03% | 0.03% | **33%** |
| Working tree | 661,391 B | 589,062 B | 5.4 MB |
| Lines in the file | **1** | 1092 | n/a |
| Distinct historical blobs | 20 | 17 | n/a |
| Raw bytes of all revisions | 11.80 MB | 8.80 MB | n/a |
| **Packed cost in `.git`** | **432,908 B** | **275,268 B** | n/a |
| Packed share of the 146 MB `.git` | 0.30% | 0.19% | n/a |
| Commits carrying its diff (6 mo) | 21 of 32 `data.js` commits | 18 of 32 | 31 of 447 all-history |
| Typical per-commit diff | **`1 1`** | `1 1` to `94 94` | 148 files / 456 lines |

Measurement commands are in `context.md`, "Verified facts (session 2)".

Three of those rows kill the case on their own:

1. **`data.json` is a single line.** `wc -l data.json` is `1`. Every commit
   that touches it shows `data.json | 2 +-` and a reviewer's eye passes over
   it. There is no review noise to remove - the thing `i/` untracking buys does
   not exist here. (`data.js`, which stays tracked regardless, is also one
   line, so this is the house style, not an accident.)
2. **Git already solved the storage.** The dispatch's framing was that
   `data.json` duplicates `data.js` byte-for-byte in size, so "every revision
   of the catalog is currently stored twice". In raw bytes, yes: 20 revisions
   of a 661 KB file is 11.8 MB of content. Packed, delta compression reduces
   that chain to **433 KB**. The two files together are **708 KB of a 146 MB
   `.git`, 0.5%**. Untracking them reclaims nothing a human would notice, and
   reclaims it only for future clones - the existing objects stay in history
   either way, exactly as they would for `i/`.
3. **`catalog.csv`'s diff is the one derived diff that is worth reading.** It
   is one row per record with the stat line, so a data edit produces a
   proportional, human-legible diff (`94 94` on `f450082`, `47 47` on
   `966b281`). `llms.txt:30` tells readers "Read `catalog.csv` first"; it is
   the most human-facing of the three.

### What untracking `data.json` would cost - verified from each file

Every claim below was checked by reading the cited line, not by pattern match.

**Real disk readers of `data.json` (would break):**

| Consumer | Line | How it reads | Gate it runs under |
|---|---|---|---|
| `app/src/lib/alt.test.ts` | 12 | `readFileSync(join(dirname,'..','..','..','data.json'))`, top-level, unguarded | `npm run test` |
| `app/src/lib/data.test.ts` | 21 | same shape | `npm run test` |
| `app/src/lib/desc.test.ts` | 16 | same shape | `npm run test` |
| `app/src/lib/i18n.test.ts` | 16 | `readFileSync(join(ROOT,'data.json'))` | `npm run test` |
| `app/src/lib/label.test.ts` | 16 | same shape | `npm run test` |
| `app/src/lib/search.test.ts` | 14 | same shape | `npm run test` |
| `app/src/lib/share.test.ts` | 29 | `readFileSync(join(ROOT,'data.json'))` | `npm run test` |
| `tests/app/inventory.js` | 33 | `require('../../data.json')` | `node tests/run-all.js` |
| `tests/app/print.js` | 43 | `require('../../data.json')` | `node tests/run-all.js` |
| `vite.config.mts` | 49 | `noscriptData()`'s `copyFileSync(join(ROOT,file), join(ROOT,'dist',file))` - unconditional, throws `ENOENT` if absent | `vite build` |
| `tools/capture-share-fixture.mjs` | 49 | `readFileSync(join(ROOT,'data.json'))` | manual tool, no gate |

**Real disk reader of `catalog.csv` (would break):**

| Consumer | Line | How it reads |
|---|---|---|
| `tests/derived.js` | 26 | `fs.readFileSync(path.join(ROOT,'catalog.csv'))` - **unguarded and throws**, unlike lines 19-23 which use `existsSync` and report "файла нет - запусти node tools/build.js" |
| `vite.config.mts` | 49 | the same `noscriptData()` loop |

**Named but not a disk reader (the dispatch's grep over-collected; all seven
checked and cleared):**

| File | What it actually does |
|---|---|
| `.claude/hooks/edit-guard.mjs:11,16` | compares the **path string** (`p === 'data.json'`) to decide whether to deny a write. Opens nothing. Unaffected either way, and its denial stays correct. |
| `.claude/hooks/selftest.mjs:108-109,668-669` | `setupScratch()` writes both names into a `fs.mkdtempSync(os.tmpdir(), 'loot-hooks-root-')` scratch tree and drives `edit-guard` against paths under **that** root. It never touches the repository's copies. |
| `tools/check-site.mjs:66` | `await get(f)` over HTTP against the **deployed** URL, in a loop with `llms.txt` and `robots.txt`. Reads no working-tree file - the same finding already recorded for `i/w1.html`. |
| `tools/smoke-file-url.mjs:73` | a **comment** explaining why the `vite.config.mts` copy exists. The assertion below it is `existsSync(join(DIST, href))` - it reads `dist/`, never the repository root. |
| `tests/app/print.js:9,49` | comments; the read is line 43, already counted above. |
| `app/index.html:56-57,61` | `<a href="catalog.csv">` / `<a href="data.json">` inside `<noscript>`. Relative hrefs resolved by a browser against the published site or `dist/`; the document reads nothing. |
| `.prettierignore:11-12` | both already listed, as `i/` is. Nothing to change, and nothing to remove: Prettier does not read `.gitignore`. |

**`vite.config.mts`, specifically, since the dispatch asked.** `noscriptData()`
is `apply: 'build'` and runs in `closeBundle`, so `npm run dev` never touches
it. Its `copyFileSync` is unconditional - a missing source is a hard `ENOENT`
that fails the build. **Untracked-but-present is the normal state after
`npm run data`, and `"build": "npm run data && vite build"`, so
`npm run check:built` (`npm run build && npm run smoke && npm run budget`)
still holds unchanged.** The only command that would newly fail is a bare
`vite build`, which appears in no script, no workflow and no document. So this
is not the blocker - the test commands below are.

**The regression that is the blocker.** `"check"` is
`format:check && lint && typecheck && node --check tools/check-site.mjs &&
npm run data && node tests/derived.js && ... && npm run test`, so inside the
documented gate every consumer is fed. But three commands skip `npm run data`:

- `npm run test` (`vitest run --coverage`) - **CLAUDE.md, "Quality gates", names
  it under "Focused"**, so it is a documented entry point;
- `npm run check:fast` (`lint && typecheck && test`);
- `npm run test:watch`.

On a fresh clone all three would end with seven suites erroring on a missing
file and nothing on screen explaining why. And `docs/specs/COVERAGE.md:207`
records `data.test.ts` as held to "the real `data.json`" - tracking the file is
what makes that spec line true on a bare checkout, which is a positive of the
status quo rather than only a cost of changing it. `i/` has no equivalent: no
vitest suite reads it, and `npm run test` is green without it today.

### The answer

For **`data.json`**: no. Removing 1 file of 3270, 433 KB of a 146 MB `.git` and
a one-line diff, in exchange for breaking three documented commands on a fresh
clone, is a bad trade at any price for the fix.

For **`catalog.csv`**: no, on a weaker but sufficient ground. Its consumer cost
is nearly nil - `tests/derived.js` is the only disk reader outside the build,
and it is never run except immediately after `npm run data` - but so is its
benefit: 1 file, 275 KB packed, and the one derived diff a human might want to
read. A change with no measurable benefit is not worth a commit, and moving it
alone would leave `CLAUDE.md`'s "`data.json`, `catalog.csv`, and `i/*.html` are
generated" describing a set with three different tracking states.

### The `pretest` design, and why it is not needed

Had the answer for `data.json` gone the other way, `"pretest": "npm run data"`
was the candidate. It is recorded here so it is not re-derived, and rejected on
its merits as well as by being moot:

- It is **not moot-proof by itself**: npm's lifecycle prefix matches the exact
  script name, so `pretest` fires for `npm run test` but **not** for
  `npm run test:watch`, which needs its own `pretest:watch`. Two lines, not
  one, and the watch one re-runs the build on every watch start.
- It makes `npm test` **write 1093 files into the working tree** - two derived
  files plus all 1091 stubs, since `tools/build.js` unconditionally shells out
  to `build-share-pages.js`. A test command that mutates the tree is a bad
  contract, and it is the one command a contributor is most likely to run with
  uncommitted work in progress.
- It **duplicates work inside `npm run check`**, which already runs
  `npm run data` and then reaches `npm run test` as its last step. Every gate
  run would pay the build twice.

Alternatives considered for the same problem, all rejected:

| Option | Why not |
|---|---|
| Point the seven suites at `data.js` (`global.window = {}; require('data.js')`, as `tools/build.js:20-21` does) | Seven file changes, and it changes what they prove: today they assert against the same artefact outsiders download. `tests/derived.js` would still cover the equivalence, but `COVERAGE.md:207`'s "the real `data.json`" line would have to go. Larger than the benefit. |
| `existsSync` guard plus `it.skip` | Silently drops coverage on exactly the checkout where it is least likely to be noticed, and `vitest run --coverage` enforces thresholds - a skip either fails the threshold anyway or hides a gap. |
| A vitest `globalSetup` that builds when the file is missing | Same tree mutation as `pretest`, plus a build hidden inside test configuration where nobody looks for it. |
| Document "run `node tools/build.js` once after cloning" and accept the failure | What B1 does for `i/`, and defensible there because `i/`'s four affected suites live in the legacy runner and print their own reason (`tests/derived.js:22`). Not defensible for seven vitest suites that would show only `ENOENT`. |

## The ledger for `i/` - unchanged, counts refreshed

### What it costs - and what it does not

The original dispatch priced this as: a new build step in the deploy, a
reworked collect list, a re-pointed `check-site.mjs` guard, a `CONTRACTS.md`
change, and a new regeneration-drift failure mode. Four of those five are not
real.

| Assumed cost | Actual |
|---|---|
| A new build step in `deploy` | **Already there.** `deploy` runs `npm run build` before "Collect what the site is made of", and `"build": "npm run data && vite build"` regenerates all 1091 stubs into the working tree. The collect step already copies a rebuilt folder. |
| A reworked collect list | **None.** `cp -r ... img og i card _site/` stays byte-identical. |
| A re-pointed `check-site.mjs` guard | **None.** It fetches `i/w1.html` from the *deployed URL*. Re-verified this session at `tools/check-site.mjs:72-74`. |
| A regeneration-drift failure mode that does not exist today | **Inverted.** Today a stale `i/` is possible (data committed, rebuild forgotten) and `npm run check` cannot catch it, because it runs `npm run data` immediately before `node tests/derived.js`. Untracking deletes the class: there is no committed copy to go stale. |
| A `CONTRACTS.md` change | **Real, and the only one.** One sentence in section 5. **Ruled on by the owner:** the sentence edit alone, no `docs/fixtures/` / `tests/contracts.js` / `llms.txt` companion, since no frozen value moves. |

Residual real costs, all one-time or one-line:

1. `CONTRACTS.md` section 5's "Those four are committed and published as they
   are" becomes wrong. Fixed in B1.
2. A cold clone that runs `node tests/run-all.js` **without** a build first
   loses four suites (`derived`, `dataint`, `craft`, `stub`) to a missing
   folder. `npm run check` is unaffected; so is `npm run test`, which does not
   read `i/` at all. Fixed in B1 by a README line.
3. The untracking commit is itself a 1091-file deletion diff. Once.
4. Existing clones lose `i/` from the working tree on the next pull and get it
   back from `node tools/build.js` (or any `npm run check`). Handoff note.

### What it buys

| | |
|---|---|
| Tracked files removed | 1091 of 3270 - **33% of the repository's tracked files** |
| Share of tracked *text* files removed | **73%** (1091 of the non-image tracked files) |
| Working tree | 5.4 MB (of ~82 MB tracked; `img/`+`og/` keep 75 MB either way) |
| History churn stopped | +63646 / -8926 lines across 4577 file-change entries to date |
| Review noise stopped | 31 commits of 447 carried a mechanical stub diff averaging 148 files. `c92c8e8` carried 57 files / 456 lines riding along with a five-line provenance fix. |

The byte win is small and does not carry the decision. The file-count win does.
Every repo-wide search, editor index, `git status` walk and agent grep pays for
1091 generated HTML files no human is allowed to edit -
`.claude/hooks/edit-guard.mjs:23` blocks writes to `i/*.html` outright.

### The one thing genuinely lost

The stub bytes a reviewer can see in a diff stop being the bytes Pages serves;
they become deploy-job output. Three guards already answer that, all present
before this task:

- the generator is deterministic from tracked `data.js`, and
  `tests/derived.js:64-67` re-renders every record and compares byte for byte;
- `ci.yml`'s verification step fails the deploy if `_site/i` is missing or empty;
- `tools/check-site.mjs` fetches the live `i/w1.html` after publishing and
  fails the run if it is not a 200 carrying `og:image`.

And the failure mode is not partial: if `npm run build` fails, `vite build`
fails with it and nothing is published at all.

## Alternatives considered and rejected

**A. Do nothing at all.** Cheapest, and the correct call if the owner values a
reviewable diff of generated preview text more than the file-count win. What
would flip it back: the `deploy` job ceasing to run `npm run build` before
Collect.

**B. Untrack `data.json` and `catalog.csv` too.** Investigated in full this
session and rejected with measurements - see "The three-artefact question".
Recorded under Deferred with the trigger that would reopen it.

**C. Generate the stubs into `dist/i/` and drop the root folder entirely.**
Architecturally tidier - the build would own its whole output. Rejected: it
moves a path four test files read off disk (`tests/derived.js`,
`tests/dataint.js`, `tests/craft.js`, `tests/stub.js`), changes what
`node tools/build.js` means, and buys nothing the `.gitignore` line does not.

**D. git-lfs, shallow-clone guidance, or a history rewrite.** Out of
proportion. The 146 MB `.git` is dominated by `img/`+`og/`, which stay; the
stubs are near-identical HTML and pack well. A rewrite would break every
existing clone and every commit hash cited in the specs.

## Scope

**In scope:** stop tracking `i/`; keep generating, keep publishing, keep the
path. Documentation and spec text that asserts `i/` is committed. One comment
in `ci.yml` recording why Build must precede Collect.

**Out of scope:** `img/`, `og/`, `card/`; `data.json`; `catalog.csv`;
`tests/app/snapshots/`; `tools/tg-preview/state.json`;
`tools/build-share-pages.js`'s output (not one byte changes); any route, id,
fixture or `llms.txt` value; `dist/` layout; `package.json` scripts;
`vite.config.mts`; `.prettierignore`; `.claude/hooks/edit-guard.mjs` (its
`i/*.html` block stays and is still correct).

## Batches

One batch. It is small, coherent, and has a single gate.

### B1 - Untrack the generated stub pages - **done**

**Objective.** `i/` is generated, published and gitignored. `git ls-files i/`
returns nothing; the live site serves the same 1091 stubs it serves today.

**Files expected**

| File | Change |
|---|---|
| `.gitignore` | add an `i/` entry with a why-comment, near the `dist/`/`coverage/` group |
| git index | `git rm -r --cached i` - index only, working tree keeps the files |
| `docs/specs/CONTRACTS.md` | section 5 only: `i/<id>.html` is generated at build time and published; the other three are committed. **Do not touch section 4.** |
| `README.md` | the `i/*.html` file-map line (~line 262) and the "Derived files" paragraph (~line 283) |
| `README.ru.md` | the aligned Russian edits (~lines 270, 291) - `CLAUDE.md` requires the READMEs to stay aligned |
| `docs/specs/COVERAGE.md` | one clause on the `derived` / `dataint` / `craft` / `stub` rows: they read `i/` off disk and need a build first |
| `.github/workflows/ci.yml` | **comment only**, in the "Collect what the site is made of" block |

**Steps**

1. Add to `.gitignore`, after the `dist/` / `coverage/` / `.svelte-kit/` block:
   ```
   # The share stubs: 1091 files regenerated from data.js by tools/build.js,
   # which the deploy job runs (npm run build) before it copies i/ into _site.
   # Published, never committed, and never hand-edited (.claude/hooks/edit-guard.mjs).
   # data.json and catalog.csv stay tracked on purpose - seven vitest suites and
   # two tests/app suites read data.json off disk under `npm run test`, which
   # does not build first. See issues/untrack-stubs/plan.md.
   i/
   ```
2. `git rm -r --cached i` from the repository root. Verify the working tree
   still holds 1091 files afterwards - this removes them from the index only.
3. Edit `docs/specs/CONTRACTS.md` section 5. Section 4 already states
   `i/<id>.html` is generated by `node tools/build.js`; section 5 must stop
   grouping it with the committed three. Keep both `i/<id>.html` in the path
   list and the "Referenced from outside" sentence - the public layout is
   unchanged. Leave section 4 exactly as it is.
4. Edit `README.md`: the file-map line keeps `1091 stub pages with Open Graph
   markup` (it describes the published site) and gains "generated, not
   committed". Extend "Derived files" with the cold-clone note: `i/` is not in
   the repository; run `node tools/build.js` (or any `npm run check`) once
   after cloning before `node tests/run-all.js`. Keep that paragraph's existing
   claim about `data.json` and `catalog.csv` being compared "against what is
   committed" - it stays true for those two.
5. Mirror step 4 in `README.ru.md`.
6. Edit `docs/specs/COVERAGE.md` as in the table above.
7. Add the `ci.yml` comment: `i` is no longer in the repository and arrives
   from the Build step above, so Collect must never be reordered before Build.
   Change no command in that file.
8. Commit as one commit, Conventional Commits, author
   `artex-x <artex-x@users.noreply.github.com>`, no AI attribution.

**Acceptance criteria** - each observable:

- `git ls-files i/` prints nothing, and `git check-ignore -v i/w1.html` names
  the new `.gitignore` line.
- `git ls-files | wc -l` reports **2179** (3270 - 1091). Re-measure the 3270 on
  the actual base commit first; it was 3278 at `5d2ddf9` and 3270 at `d5e3e5a`.
- The working tree still holds 1091 files under `i/` after the commit, and
  `git status` is clean.
- `node tools/build.js` after deleting `i/` recreates 1091 files and leaves
  `git status` clean - the folder is both reproducible and ignored. (Use the
  build, not `rm -rf`; `.claude/hooks/bash-guard.mjs` blocks `rm -rf` in-repo
  and must not be worked around.)
- `npm run check` is green, including `tests/derived.js`, and
  `node tests/run-all.js derived,dataint,craft,stub` is green after it.
- `git ls-files data.json catalog.csv` still prints both - this batch does not
  untrack them. `git diff` touches neither file's content.
- The commit's diff touches **no** file under `docs/fixtures/`, and not
  `tests/contracts.js`, `llms.txt`, `robots.txt`, `data.js`, `package.json`,
  `vite.config.mts`, `.prettierignore`, `tools/build-share-pages.js`,
  `tools/check-site.mjs` or any `app/src/lib/*.test.ts`.
- `docs/specs/CONTRACTS.md`'s **section 4 is byte-identical** to its current
  text; only section 5 changes. Confirm with
  `git diff -- docs/specs/CONTRACTS.md`.
- `.github/workflows/ci.yml`'s diff is comment lines only - no `run:` or step
  changes. Confirm with `git diff -- .github/workflows/ci.yml`.
- `.claude/hooks/edit-guard.mjs` is unchanged and still blocks writes to
  `i/*.html`.

**Verification commands**

- One foreground call, Bash timeout 600000:
  `set -o pipefail; npm run check 2>&1 | tail -n 120`
- Then, once, in a second call:
  `node tests/run-all.js derived,dataint,craft,stub`
- `npm run check:built` is **not** required: nothing changes what a screen
  draws, and `vite.config.mts`'s `noscriptData()` copy is untouched because
  `data.json` and `catalog.csv` stay tracked. Say so in the handoff rather than
  skipping it silently.
- Post-merge, once `deploy` has run on `main`: the job's own "The published
  site answers correctly" step is the live acceptance. Runnable by hand:
  `node tools/check-site.mjs https://artex-x.github.io/daggerheart-loot/`

**Risks / do-nots**

- Do **not** delete the `i/` files from the working tree. `git rm -r --cached`,
  never `git rm -r`.
- Do **not** touch `data.json` or `catalog.csv`, `package.json`'s scripts, or
  `vite.config.mts`. Adding a `pretest` is explicitly rejected above and is not
  part of this batch.
- Do **not** edit `docs/specs/CONTRACTS.md` section 4. Only section 5's
  "Those four are committed" sentence moves.
- Do **not** remove `i` from `ci.yml`'s collect list or its `_site/i`
  verification loop, and do **not** move Collect above Build. That ordering is
  now the only thing putting stubs on the site.
- Do **not** remove the `i/` line from `.prettierignore`: Prettier does not
  read `.gitignore`, and the entry is what keeps machine-written HTML out of
  `format:check`.
- Do **not** touch `.claude/hooks/edit-guard.mjs`. Hand-editing a stub stays
  blocked, and that is now the only thing it can be.
- Do **not** change one byte of `tools/build-share-pages.js`; `tests/derived.js`
  would then have a real diff and this commit would stop being reviewable as
  "no output changed".
- Settled, do not reopen: the deploy needs no new build step; `check-site.mjs`
  needs no re-pointing; the collect list is unchanged; the owner has ruled that
  the section 5 sentence edit needs no `docs/fixtures/` / `tests/contracts.js` /
  `llms.txt` companion.

**Fallback.** If the cold-clone friction in cost (2) bites in practice - a
contributor or agent running `node tests/run-all.js` against a fresh checkout
and reading four missing-file failures as a bug - the follow-up is to have
`tests/run-all.js` shell out to `node tools/build.js` once when `i/` is absent.
Not done up front: `npm run check` is the documented gate, it already builds,
and the README line covers the case.

## Deferred

- **`data.json` and `catalog.csv` stay tracked.** Reopen only if one of these
  changes: (a) the seven `app/src/lib/*.test.ts` suites stop reading
  `data.json` off disk, which removes the whole consumer cost; (b) `data.json`
  stops being one line, which is what makes its diff invisible today; (c) its
  packed history cost grows past a few MB - it is 433 KB now. Otherwise the
  answer stays no. Full reasoning and numbers above.
- `tests/run-all.js` auto-building a missing `i/` - the B1 fallback.
- `docs/specs/COVERAGE.md` is stale well beyond this task: it still describes
  "twenty" legacy suites, `index.html` and the parity harness that `23c00a6`
  and `5d2ddf9` deleted. B1 touches only the four rows it must; that cleanup
  belongs to issue 47's backlog.
- `.github/workflows/ci.yml`'s `deploy` header comment still describes the
  pre-`R0c` revert model ("the old app - index.html, style.css, app.js - stays
  in the repository") for files that no longer exist. Same owner: issue 47.

## Risks, assumptions, dependencies

- **Assumption, load-bearing:** `deploy` keeps running `npm run build` before
  Collect. Guarded by the `ci.yml` comment B1 adds and by the existing
  `_site/i` non-empty assertion; both fail loudly rather than silently.
- **Assumption:** `tools/build-share-pages.js` is deterministic. Established by
  `tests/derived.js:64-67`, which re-renders all 1091 and compares byte for
  byte on every `npm run check`.
- **Dependency:** none. B1 does not wait on issue 47 and does not touch `app/`.
- **Risk, low:** a future contributor greps for a stub filename and finds
  nothing tracked. Mitigated by the README file-map line and the `.gitignore`
  comment, both of which name `tools/build-share-pages.js`.
