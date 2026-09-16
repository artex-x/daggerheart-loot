# Shared task context - TASK art-tooling

Orchestrator (or first worker) maintains this file so later steps do not
re-fetch the same sources.

## Goal

Decide what should become durable - repository tooling, a skill, prompt edits,
or nothing - so the next catalog artwork refresh costs a fraction of the one
that just finished (`art-to-fix`). The owner's question: "should we update that
prompt / convert to skills / introduce new items in tools given insights
retrieved by that agent to simplify art update work in future?"

This task produces `issues/art-tooling/{context,plan,handoff}.md` only. No
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

## Command costs

| Command | Wall clock | Fits one call? |
|---|---|---|
| `npm run check` | ~165 s (see `.claude/README.md`, "Run a long check") | yes, with Bash `timeout: 600000` |
| `npm run check:built` | not required by any batch here - nothing this task proposes alters what a screen draws | n/a |
| `node --test tools/tg-preview/lib.test.mjs` | seconds; already a step inside `npm run check` | yes |
| `node --test tools/art-refresh/lib.test.mjs` | seconds once it exists; pure, no image work | yes |

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

## Repository state at dispatch

- Worktree `E:/dev/daggerheart-loot-wt/tg-preview-refresh`, branch
  `art/to-fix-refresh`, tree clean.
- `git log --oneline -3 origin/main` re-read by the planner, 2026-09-16:
  `e2ada3f` (merge), `c3b2b88`, `7672f50` - the branch tip is already on
  `main`. A peer session and a CI bot both push there; re-read before writing.

## Do not re-fetch unless

- The owner provides new info
- `context.md` is missing a fact you need
- You suspect drift versus the repository or the plan
