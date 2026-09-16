# Shared task context - TASK art-tooling

Orchestrator (or first worker) maintains this file so later steps do not
re-fetch the same sources.

## Goal

Decide what should become durable - repository tooling, a skill, prompt edits,
or nothing - so the next catalog artwork refresh costs a fraction of the one
that just finished (`art-to-fix`). The owner's question: "should we update that
prompt / convert to skills / introduce new items in tools given insights
retrieved by that agent to simplify art update work in future?"

**Scope widened at r2, 2026-09-16.** The owner then asked: "should we also
write it to add source so it knows how to transform images etc when adding new
items, not only refreshing existing?" Answer: yes. The tooling serves both
callers - `.claude/prompts/refresh-artwork.prompt.md` (replacement) and
`.claude/prompts/add-source.prompt.md` (ingest) - from one library, one entry
point and one runbook. The tool is `tools/artwork/`, the runbook
`docs/artwork.md`; `tools/art-refresh/` / `docs/art-refresh.md` were r1 names
and were never created.

The planner writes `issues/art-tooling/{context,plan,handoff}.md` only. No
production code is written by the planner.

## GitHub issue (if any)

- None. Local task id, dispatched by the owner from the `art-to-fix` result.

## Screenshot / attachment findings

- None. This task has no visual surface: nothing it proposes draws a screen.

## Key paths

| Path | Why it matters here |
|---|---|
| `.claude/prompts/refresh-artwork.prompt.md` | the five-phase prompt under question; `.claude/agents/refresh-artwork.md` points at it and adds nothing procedural |
| `.claude/README.md` | owns tooling rationale, the hook table, and the candidates ledger (rows 1-44) |
| `.claude/skills/{handoff,orchestrate,small-fix}/SKILL.md` | the three house skills; all `disable-model-invocation: true`, all human-invoked session protocol |
| `tools/tg-preview/` | the precedent for a sibling npm project inside `tools/` with its own native-ish dependency |
| `docs/tg-preview.md` | the precedent for a tool runbook living in `docs/`, not in a skill |
| `docs/specs/CONTRACTS.md` section 5 | the frozen asset paths, written as `img/<id>.webp`, `og/<id>.jpg` |
| `docs/specs/COVERAGE.md` (the `tools/tg-preview/lib.test.mjs` paragraph, ~line 302) | how a `tools/` suite is documented |
| `issues/art-to-fix/{context,handoff}.md` | the measured delivery this task reacts to |
| `issues/dh-image-polish/refresh_artwork.py` | a **tracked** 161-line Pillow installer left in an issue directory by the third refresh |
| `.claude/prompts/add-source.prompt.md` | the second caller, added to scope at r2; its art guidance is three sentences (line 45, Phase 1 step D, Phase 2 step 5) |
| `tests/dataint.js` | holds every executable artwork invariant: `img/` orphans (~167), one-line-only sharing (~180), duplicate bytes (~231), per-record `img`/`og` existence (~157). No `og/` orphan check. |
| `tests/noart.js` | pins the `img: ''` -> `_none.webp` render path, so "record now, art later" is a legal ingest outcome |

## Measured by the planner, 2026-09-16 (do not re-measure)

### The recurrence is real

Four artwork refreshes are in the log: `8e7fed1` (which is where
`refresh-artwork.prompt.md` itself was added), `ce0c414`, `37ecc8d`, and
`7672f50` (65 assets, `art-to-fix`). The third left
`issues/dh-image-polish/refresh_artwork.py` behind - the one instance
`.claude/README.md` candidate 39 names when it justifies the `Stop` hook that
warns about untracked scratch writes. That file is tracked, is a working
Pillow implementation of roughly 70% of what `art-to-fix` re-derived from
prose, and nobody found it during `art-to-fix`.

### `tools/` faces no lint, format or coverage gate

Measured against the config files, because the dispatch asked what coverage
means for `tools/` specifically:

| Gate | Applies to `tools/**`? | Evidence |
|---|---|---|
| vitest coverage thresholds | **no** | `vite.config.mts` sets `root: 'app'` and `coverage.include: ['src/**/*.ts', 'src/**/*.svelte']`. `CLAUDE.md`'s per-file coverage rule is an `app/src/` rule. |
| `eslint .` | **no** | `eslint.config.mjs` line 19 ignores `tools/**` |
| `prettier --check .` | **no** | `.prettierignore` lists `tools/` (and `*.md`) |
| `npm run check` | **yes, only if wired** | `check` runs `node --test tools/tg-preview/lib.test.mjs` as an explicit step |

So the house rule for a new `tools/` file is not a coverage threshold: it is
"the pure half gets a `node --test` suite wired into `npm run check`, and the
suite is documented in `COVERAGE.md`". `tools/tg-preview/` is the worked
example: `lib.mjs` is pure and tested (96 cases), `client.mjs` and `live.mjs`
are thin wrappers around a live network and are deliberately outside it.
Root `package.json` has no new dependency; `tools/tg-preview/package.json`
carries `teleproto` and is installed only by `previews.yml`
(`working-directory: tools/tg-preview`, `npm ci`, cached off its own
`package-lock.json`). `.gitignore`'s `node_modules/` already covers a nested
one.

### tg-preview already computes the stale URL list; it just never writes it

`lib.mjs`'s `runRefresh` dry-run branch (lines 441-462) sets
`result.pending = todo` - the full stale URL array - and returns it. `run.mjs`
logs only counts on that path. `deps.writeResult` is called at line 638, in
the send loop, never in a dry run, and its shape (`{ site, urls }`) is the one
`--apply` consumes. So the missing piece is a writer, not a computation.

`applyResult` (lines 258-262) merges `result.urls || {}` over the existing
state, so a file with no `urls` key applied by mistake is a no-op, not a
corruption. That is worth a test, not a guard.

### `og/` is named after the asset, and a test already enforces it

`tools/build-share-pages.js:112` builds the tag as
`SITE + 'og/' + it.img.replace(/\.webp$/, '.jpg')`, and `tests/dataint.js:162`
fails when that file is missing. So the rule is already executable; it is only
the **documentation** that reads as if the name were the record id.
`CONTRACTS.md` section 5 says `img/<id>.webp`, `og/<id>.jpg` and never says
which id. That sentence is where `art-to-fix` had to supply the fact by
measurement.

### Prior art available for reuse

- `tools/derived.js` exports `everything(L)` and `SITE`; `tools/tg-preview/manifest.mjs`
  shows the `createRequire` + `window.LOOT` shim for reading `data.js` from a
  `tools/` script. A new art script reuses both; it invents nothing.
- `issues/dh-image-polish/refresh_artwork.py` already encodes the settings,
  the `record.img`-not-`record.id` destination rule, the collision check, the
  duplicate-source-bytes check, the temp-sibling atomic write and the
  re-encode verification. It does **not** do name-based matching or shared-art
  expansion reporting, and it hard-fails on more than one record per id.

### Conversion settings, established across three refreshes

Identical in `refresh_artwork.py` (2nd/3rd refresh) and `art-to-fix`'s
`convert.py`: EXIF transpose; flatten alpha **only** when fully opaque,
otherwise raise; resize to 640x640 Lanczos; WebP quality 85 / method (effort)
6 / lossy; JPEG quality 80 / progressive / 4:2:0 / optimize; no metadata.
`art-to-fix` measured them byte-deterministic across repeated runs.

## Measured by the planner at r2, 2026-09-16 (do not re-measure)

Added when the owner asked whether the tooling should serve **new-item ingest**
as well as replacement.

### Catalog asset census

`node -e` over `data.js` + `tools/derived.js` + the two asset directories, this
worktree, commit `db52655`:

| Quantity | Value |
|---|---|
| records (`everything(L)`) | 1091 |
| records carrying a non-empty `img` | 1091 (all of them, today) |
| distinct assets referenced | **875** |
| assets referenced by more than one record | **72** |
| `img/*.webp` files | 876 (875 used + the unreferenced `_none.webp`) |
| `og/*.jpg` files | 877 (875 + `_none.jpg` + `_share.jpg`) |

`q24.webp` serves `q24`, `q70`, `q138`, `q205`; all four carry
`eq.line === 'q24'`. Same pattern at `f37.webp` -> `f37..f40`, and so on.

### Which artwork rules are already executable, and which are not

All of these live in `tests/dataint.js`:

| Rule | Enforced? | Where |
|---|---|---|
| every record's `img/<img>` exists | yes | ~line 157 |
| every record's `og/<img -> .jpg>` exists | yes | ~line 159 |
| every `img/*.webp` is claimed by some record (`_none.webp` exempt) | yes | ~line 167 |
| **every `og/*.jpg` is claimed** | **NO - the gap** | nothing checks it; a stray `og/<id>.jpg` passes every gate |
| records sharing one asset are all in one `eq.line` (or are one record) | yes | ~line 180 |
| no two `img/*.webp` hold identical bytes | yes | ~line 231 (md5) |
| a record may ship with `img: ''` and render `_none.webp` | yes | `tests/dataint.js` skips falsy `img`; `tests/noart.js` pins the render |

`tools/build-share-pages.js:112` derives the OG tag as
`SITE + 'og/' + it.img.replace(/\.webp$/, '.jpg')` - from `img`, never from
`id` - so the naming rule itself is executable. Only the **documentation**
(`CONTRACTS.md` section 5) and the **`og/` orphan direction** are gaps.

### `npm run check` does not run `tests/dataint.js`

Measured against root `package.json`. `check` =
`format:check` -> `lint` -> `typecheck` -> `node --check tools/check-site.mjs`
-> `npm run data` -> `tests/derived.js` -> `tests/i18n.js` ->
`.claude/hooks/selftest.mjs` -> `node --test tools/tg-preview/lib.test.mjs` ->
`npm run test` (vitest). `dataint` and `noart` are reached only through
`node tests/run-all.js <names>` (`npm run test:legacy`). So every artwork
invariant above binds only when a prompt names that command.

`dataint` is plain Node - no puppeteer - reads `data.js` and md5s 876 files, so
adding it to `check` would cost a second or two. Its documented sibling `noart`
does need puppeteer. See `plan.md` section 8.

### `tests/**` is ignored by the same gates as `tools/**`

`.prettierignore` lists both `tests/` and `tools/`; `eslint.config.mjs`'s
`ignores` lists `tests/**`, `tools/**`, `.claude/**`, `app.js`, `data.js`,
`i/**`. `tests/dataint.js` is CommonJS with Russian assertion messages. A file
edited in either tree must match its neighbours by hand; a reformat produces a
large diff no gate asked for.

### What ingest needs that replacement does not

Settled in `plan.md` 3.6 and not repeated here, except the one fact that drove
it: the tool must **validate** the `img` value the agent wrote into `data.js`,
not choose an asset id or infer sharing. That removes the whole "assign a
filename" API surface and makes `og/<new-record-id>.jpg` structurally
unreachable, because both planners key their write set by distinct asset value
rather than by record.

## Command costs

| Command | Wall clock | Fits one call? |
|---|---|---|
| `npm run check` | ~165 s (see `.claude/README.md`, "Run a long check") | yes, with Bash `timeout: 600000` |
| `npm run check:built` | not required by any batch here - nothing this task proposes alters what a screen draws | n/a |
| `node --test tools/tg-preview/lib.test.mjs` | seconds; already a step inside `npm run check` | yes |
| `node --test tools/artwork/lib.test.mjs` | seconds once it exists; pure, no image work | yes |
| `node tests/run-all.js dataint` | seconds; md5s 876 files, no browser | yes |

## Which machine is authoritative

- For recorded numbers: not applicable. This task records no parity or timing
  number; the only numbers it adds are test counts.
- A difference on another machine: the one real portability fact is that the
  image encoder is a native dependency. Byte-identical output is required
  **within** a run (re-encode and compare), never across machines or across
  encoder versions - see `plan.md`, "Determinism is per-run".

## Reasons already disproved

- "A repository script would put an image encoder into every `npm ci`." It
  would not, if it follows `tools/tg-preview/`: its own `package.json` and
  lockfile, its own `node_modules/`, installed on demand, and no workflow
  installs it. Root `npm ci` is untouched.
- "A new file under `tools/` must clear the coverage threshold." It must not;
  the thresholds are scoped to `app/src/**` (table above).
- "Writing the settings down more clearly would be enough." They were already
  written down - `refresh-artwork.prompt.md` Phase 4 carries every one of
  them - and the `art-to-fix` agent still wrote six scratch programs and a
  venv. This is the argument `.claude/README.md` candidate 27 used when prose
  had been exhausted three times over the backgrounded check.
- "`--dry-run` cannot prove which URLs went stale." It already computes them;
  only the writer is missing (above).

## Constraints

- `CLAUDE.md` governs. "Add no module, export, component or variant before
  something uses it" - so a lib may not land without its caller.
- No new dependency in the **root** `package.json` without stating the CI cost.
- `npm run check` must not grow an image encoder.
- Never run `tools/tg-preview/run.mjs` without `--dry-run` in this work.
- `.env` is never read. `tools/tg-preview/state.json` is the CI bot's file;
  nothing in this task edits, stages or deletes it.
- No model routing in any task document.
- Never push; the owner pushes.

## Repository state

- Worktree `E:/dev/daggerheart-loot-wt/tg-preview-refresh`, branch
  `tooling/art-refresh`, tree clean. Branch tip at r2: `db52655`.
- At r1 dispatch the branch was `art/to-fix-refresh` and `origin/main` was
  `e2ada3f` / `c3b2b88` / `7672f50`.
- `git log --oneline -3 origin/main` re-read by the planner at r2, 2026-09-16:
  `2ce3b08`, `80809c8`, `e2ada3f`. The two new commits are a peer session's
  fix for the Linux-only `.claude/hooks/selftest.mjs` failure. This branch was
  deliberately **not** rebased onto them, and no batch in this task touches
  `.claude/hooks/**` - the peer session owns it. A peer session and a CI bot
  both push to `main`; re-read before writing or committing.

## Do not re-fetch unless

- The owner provides new info
- `context.md` is missing a fact you need
- You suspect drift versus the repository or the plan
