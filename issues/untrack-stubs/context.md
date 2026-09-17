# Shared task context - TASK untrack-stubs

Orchestrator (or first worker) maintains this file so later steps do not re-fetch the same sources.

## Goal

Decide whether the repository's generated artefacts should stop being
committed, and if so design the change. Scope was `i/` alone in session 1 and
was extended in session 2 to the three artefacts `CLAUDE.md` names as one set:
`i/*.html`, `data.json`, `catalog.csv`. Answer: **`i/` yes, the other two no** -
see `plan.md`, "The three-artefact question".

Excluded and settled, do not re-litigate: `img/`, `og/`, `card/` are source
bytes (`og/` is a sibling encode of the original delivery art, not derived from
`img/`); `tests/app/snapshots/` (110 files) are the goldens that replaced
parity; `tools/tg-preview/state.json` is a deliberate committed log of 1,062
published URLs (`docs/tg-preview.md:27,44,404`), not build output.

## GitHub issue (if any)

- URL: none - local-only task id, dispatched by the orchestrator
- Captured or last verified: 2026-09-17
- Title: n/a
- Summary (facts only): see "Verified facts" below
- Decisions already settled: `img/` (876 files), `og/` (877) and `card/` (36)
  stay tracked. `og/` is not derived from `img/` - `tools/artwork/run.mjs:157`
  (`encodePair`) writes the WebP and the JPEG as siblings from one original
  delivery buffer, and `verify` (`run.mjs:219-222`) re-encodes from that same
  original. The originals live in untracked drop directories, so neither folder
  is recoverable from the repository.
- Open questions: the one in `plan.md`, "Open question for the owner".

## Verified facts (this session, read-only inspection)

Measured on `5d2ddf9`, in the worktree
`E:\dev\daggerheart-loot\.claude\worktrees\agent-aa938979da567fa64`.

| Fact | Value | Where |
|---|---|---|
| Tracked files, whole repo | 3278 | `git ls-files` |
| Tracked files under `i/` | 1091 | dispatch; `tests/craft.js:85` pins the number |
| `i/` share of tracked files | 33% | 1091 / 3278 |
| `i/` share of tracked **text** files | 73% | 1091 / (3278 - 1789 image files) |
| `i/` on disk | 5.4 MB | `du -sh i` |
| `img/` / `og/` / `card/` on disk | 31 MB / 44 MB / 81 KB | `du -sh` |
| `.git` | 146 MB | `du -sh .git` |
| Commits that touched `i/` | 31 of 447 (7%) | `git log -- i/` |
| Line churn under `i/`, all history | +63646 / -8926 across 4577 file-change entries | `git log --numstat -- i/` |
| Most recent such commit (`c92c8e8`) | 57 stub files, 228+/228- | `git show --stat c92c8e8 -- i/` |

### The premise that does not hold

The dispatch states the deploy job "runs no build step" for `i/`. **It does.**
`.github/workflows/ci.yml`'s `deploy` job is: checkout -> setup-node ->
`npm ci` -> **`npm run build`** -> "Collect what the site is made of".
`package.json`: `"build": "npm run data && vite build"` and
`"data": "node tools/build.js"`. `tools/build.js` writes `data.json`,
`catalog.csv` and then shells out to `tools/build-share-pages.js`, which
`mkdirSync(OUT, { recursive: true })`, deletes every `*.html` already there and
writes all 1091 fresh. So the `cp -r ... i _site/` in the collect step already
copies a folder regenerated seconds earlier in that same job, not the committed
bytes. Untracking `i/` needs **no new deploy step**.

### The guards that already exist and need no change

- `ci.yml`, "Nothing private slipped in, and nothing public left out": asserts
  `_site/i` exists and is non-empty, alongside `img`, `og`, `card`.
- `tools/check-site.mjs` fetches `i/w1.html` from the **live URL** after the
  deploy and asserts 200 plus `og:image`. It reads no repository file, so it
  does not need re-pointing; untracking makes it more load-bearing, not less.
- `.claude/hooks/edit-guard.mjs:23` already **blocks** any Edit/Write to
  `i/*.html` ("Blocked: i/*.html are generated share stubs"). The committed
  bytes therefore already carry no authoring value.

### What reads `i/` off disk

All four run inside `npm run check` (which runs `npm run data` first) or inside
`node tests/run-all.js` after it:

- `tests/derived.js:64-67` - re-renders every record with
  `tools/build-share-pages.js`'s exported `page()` and compares byte for byte
- `tests/dataint.js:179-182` - one stub per record, and no extras
- `tests/craft.js:82-88` - `i/w3.html` carries the craft line; exactly 1091 stubs
- `tests/stub.js:13` - opens `file://.../i/w3.html` in Chrome at 320 and 390

Nothing in `app/`, `dist/` or the built page references `i/` at all: the stubs
are standalone pages whose `SITE` constant is the absolute Pages URL, so they
redirect to the published site even when opened from a clone. `vite.config.mts`'s
`artwork()` plugin symlinks only `img`, `og`, `card` into `dist/`; `i/` is copied
from the repository root by the deploy collect step and never enters `dist/`.

## Verified facts (session 2) - the other two generated artefacts

Measured on `d5e3e5a` in the main working tree, read-only.

| Fact | Value | Command |
|---|---|---|
| Tracked files, whole repo | **3270** (was 3278 at `5d2ddf9`) | `git ls-files \| wc -l` |
| `data.js` / `data.json` / `catalog.csv` on disk | 661,404 B / 661,391 B / 589,062 B | `wc -c` |
| Lines in each | **1 / 1 / 1092** | `wc -l` |
| Distinct historical blobs | `data.js` 31, `data.json` 20, `catalog.csv` 17 | `git rev-list --all` + `git rev-parse <c>:<f>`, deduped |
| Raw bytes of all revisions | 15.74 MB / 11.80 MB / 8.80 MB | `git cat-file --batch-check='%(objectsize)'` |
| **Packed bytes in `.git`** | **449,101 / 432,908 / 275,268** | `%(objectsize:disk)`, same batch |
| Commits touching each, 6 months | `data.js` 32, `data.json` 21, `catalog.csv` 18 | `git log --oneline --since="6 months ago" -- <f>` |
| Line churn, all history, both derived | +1593 / -500 across 39 file-change entries | `git log --numstat -- data.json catalog.csv` |
| Typical per-commit diff | `data.json` always `1 1`; `catalog.csv` `1 1` to `94 94` | `git log --numstat -n 8 -- data.json catalog.csv` |

The measurement script is at
`<scratchpad>/packsize.sh` (session-local, not in the repository).

**The two conclusions those numbers carry:** `data.json` is a single minified
line, so its diff is invisible and there is no review noise to remove; and git's
delta compression already reduces 11.8 MB of raw revisions to 433 KB, so the
two files together are 708 KB of a 146 MB `.git` - 0.5%.

### Consumers of `data.json` and `catalog.csv`, each checked from the file

Real disk readers of `data.json` (unguarded, would throw): the seven
`app/src/lib/{alt,data,desc,i18n,label,search,share}.test.ts` (top-level
`readFileSync`, under `npm run test`); `tests/app/inventory.js:33` and
`tests/app/print.js:43` (`require('../../data.json')`); `vite.config.mts:49`
(`noscriptData()`'s unconditional `copyFileSync`, `apply: 'build'`,
`closeBundle`); `tools/capture-share-fixture.mjs:49` (manual tool, no gate).

Real disk reader of `catalog.csv`: `tests/derived.js:26` - unguarded and
throws, unlike lines 19-23 which use `existsSync` and print "запусти node
tools/build.js". Plus the same `vite.config.mts:49` loop.

Named by a grep but **not** disk readers, all seven cleared:
`.claude/hooks/edit-guard.mjs:11,16` (string compare on the path, opens
nothing); `.claude/hooks/selftest.mjs:108-109,668-669` (writes into a
`mkdtempSync` scratch root and drives the hook against paths under **that**
root); `tools/check-site.mjs:66` (HTTP `get(f)` against the deployed URL);
`tools/smoke-file-url.mjs:73` (a comment; its assertion is
`existsSync(join(DIST, href))`); `tests/app/print.js:9,49` (comments);
`app/index.html:56-57,61` (relative `<noscript>` hrefs); `.prettierignore:11-12`
(already listed, nothing to change).

### Script chains that matter

- `"check"` = `format:check && lint && typecheck && node --check
  tools/check-site.mjs && npm run data && node tests/derived.js && node
  .claude/hooks/selftest.mjs && node --test tools/tg-preview/lib.test.mjs &&
  node --test tools/artwork/lib.test.mjs && npm run test` - feeds every
  consumer.
- `"build"` = `npm run data && vite build`; `"check:built"` = `npm run build &&
  npm run smoke && npm run budget` - also feeds every consumer. A bare
  `vite build` would not, but it appears in no script, workflow or document.
- **Skip `npm run data`:** `"test"` (`vitest run --coverage`, named under
  "Focused" in `CLAUDE.md`), `"check:fast"` (`lint && typecheck && test`), and
  `"test:watch"`. These three are the regression that keeps `data.json` tracked.
- CI is safe on every job: `ci.yml:33` `npm run check`, `:36`/`:84`/`:179`
  `npm run build`, and `:47` `node tests/run-all.js --exclude=app/golden` runs
  after `:36` in the same job.

### `docs/specs/CONTRACTS.md` - where each artefact actually lives

- **Section 4, "Machine-readable data"** (lines ~91-97): `data.json`,
  `catalog.csv`, `i/<id>.html`. Says only "All three are generated from
  `data.js` by `node tools/build.js` and compared byte for byte by
  `tests/derived.js`". **No claim about being committed** - so untracking
  `data.json` or `catalog.csv` would need no edit here.
- **Section 5, "Static asset paths"** (line ~106): `img/<id>.webp`,
  `og/<id>.jpg`, `card/*.svg`, `i/<id>.html`, then "Those four are committed
  and published as they are." `data.json` and `catalog.csv` are **not** in this
  list. So the sentence is touched once, by `i/` alone - the dispatch's
  "splitting means touching it three times" premise does not hold.
- `docs/specs/COVERAGE.md:207` records `data.test.ts` as held to "the real
  `data.json`" - a spec line that tracking the file is what makes true on a
  bare clone.

## Key paths

- Specs: `docs/specs/CONTRACTS.md` (sections 4 and 5), `docs/specs/META.md`
  (sections 1-2), `docs/specs/COVERAGE.md` (`derived`, `dataint`, `craft`,
  `stub` rows)
- Generator: `tools/build.js`, `tools/build-share-pages.js`
- Deploy: `.github/workflows/ci.yml`, `deploy` job
- Live probe: `tools/check-site.mjs`
- Tests on disk: `tests/derived.js`, `tests/dataint.js`, `tests/craft.js`,
  `tests/stub.js`
- Docs to keep aligned: `README.md` (file map ~line 257, "Derived files" ~line 280),
  `README.ru.md`
- Mocks: none - this task draws no UI

## Command costs

Not measured this session: the dispatch forbade running gates while another
session holds the main checkout. Fill in on first implementation run.

| Command | Wall clock | Fits one call? |
|---|---|---|
| `npm run check` | | |
| `npm run check:built` | | |
| `node tests/run-all.js derived,dataint,craft,stub` | | |

## Reasons already disproved

- "Untracking `i/` 404s the live site." No: the deploy job's `npm run build`
  already regenerates `i/` before the collect step. See above.
- "`tools/check-site.mjs` needs re-pointing." No: it reads the deployed URL,
  not the working tree.
- "The `file://` contributor loses working stubs." Mostly no: the stubs are not
  part of the local app. They redirect to `https://artex-x.github.io/...`
  regardless of where they are opened from, and `dist/` has never contained
  them. What a cold clone does lose is the four disk-reading suites above until
  `node tools/build.js` runs once.
- "`data.json`, `catalog.csv` and `i/` share one `CONTRACTS.md` sentence, so
  they must move together." No: the sentence is in section 5, which lists only
  `img/`, `og/`, `card/`, `i/`. The other two are section 4 and are already
  described as generated.
- "Every revision of the catalog is stored twice, once as `data.js` and once as
  `data.json`." True in raw bytes, false in what `.git` holds: 20 revisions of
  a 661 KB `data.json` pack down to 433 KB after delta compression.
- "`tools/smoke-file-url.mjs` reads `data.json`." No: line 73 is a comment, and
  its assertion reads `dist/`.
- "`.claude/hooks/selftest.mjs` reads the repository's `data.json`." No: it
  writes and reads its own `mkdtempSync` scratch tree.
- "`tests/derived.js`'s byte-for-byte comparison guards the committed stubs."
  Not inside `npm run check`: `"check"` runs `npm run data && node tests/derived.js`,
  so the folder is regenerated immediately before it is compared. The comparison
  only has teeth when `derived` is run without a preceding build.

## Constraints

- Contracts: no route, record id, link grammar, generated-file format or asset
  path may change. `i/<id>.html` stays a published path.
- `docs/specs/META.md`: `noindex` in every stub, crawling still allowed.
- `docs/specs/CONTRACTS.md` section 5 currently claims the four asset families
  "are committed and published as they are" - that sentence is the only
  contract-file text the change touches.

## Do not re-fetch unless

- Human provides new info
- `context.md` is missing a fact you need
- You suspect drift vs the repository state at `d5e3e5a` (session 1's `i/`
  numbers were taken at `5d2ddf9`; only the tracked-file total moved, 3278 to
  3270)
