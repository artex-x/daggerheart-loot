# Plan - TASK art-tooling

Read `context.md` first; every measured fact this plan rests on is there and
is not repeated.

## 1. Objective

Make the next catalog artwork refresh cost a fraction of `art-to-fix` by
turning the parts that were re-derived from prose into executable, tested
repository tooling, and by writing down the three facts the prompt does not
state. Reduce `.claude/prompts/refresh-artwork.prompt.md` to the judgment it
is actually good at - routing, the stop conditions, the report - and move the
procedure to a runbook beside the tool that performs it.

## 2. Recommendation in one paragraph

Build the script. Four refreshes have now paid for it, the third left a
tracked Pillow implementation of most of it stranded in an issue directory,
and the fourth re-wrote that implementation from prose because nobody found
it. The dependency objection dissolves against `tools/tg-preview/`, which
already carries a heavy dependency in its own `package.json` with its own
lockfile, installed only by the one workflow that needs it: root `npm ci` and
`npm run check` never see it, and the same shape gives `tools/art-refresh/` an
image encoder at no CI cost. Split it the way tg-preview is split - a pure
`lib.mjs` with a `node --test` suite wired into `npm run check`, and an impure
`run.mjs` that lazily imports the encoder - so the half that carries the
mapping rules cannot rot silently. Add one flag to tg-preview, `--stale-list`,
because the dry run already computes the exact URL set and only lacks a
writer; that single flag turns "prove the right previews went stale" from a
scratch program into a diff of two files. Write no new skill: this workflow
already has an agent with a prompt, and `docs/tg-preview.md` is the house
precedent for where a tool's runbook lives. Put the `og/`-is-named-after-the-
asset rule in `docs/specs/CONTRACTS.md`, because it is a published-artefact
fact that section 5 currently states ambiguously, not a procedure note.

## 3. The five decisions

### 3.1 A repository script earns its place, as a sibling npm project

**Yes.** Ship `tools/art-refresh/`, modelled line for line on
`tools/tg-preview/`:

- `tools/art-refresh/package.json` + `package-lock.json`, tracked, carrying
  `sharp` as its own dependency. `node_modules/` there is already covered by
  the root `.gitignore`.
- **Root `package.json` gains no dependency.** CI cost: zero. `ci.yml`'s
  `npm ci` resolves the root lockfile only; nothing installs
  `tools/art-refresh/`. The only root change is one extra step in the `check`
  script, `node --test tools/art-refresh/lib.test.mjs`, which is a pure suite
  measured in milliseconds against a ~165 s check.
- **It is not wired into any `npm run` target that a human or CI runs
  routinely.** No `npm run art` convenience script: `previews.yml` already
  calls `node tools/tg-preview/run.mjs` by path rather than through
  `npm run previews`, so a path invocation is the house norm and one fewer
  name to keep in sync. `npm run check` and `check:built` do not grow an image
  encoder, and cannot: `run.mjs` is the only file that imports `sharp`, no
  gate runs `run.mjs`, and `lib.mjs` must not import it.
- **The encoder is demanded, not assumed.** `run.mjs` does
  `await import('sharp')` inside a `try`, and on failure exits with a message
  naming the fix (`cd tools/art-refresh && npm ci`) and nothing else. The same
  lazy-import discipline `run.mjs` already uses for `client.mjs` in tg-preview.

Rejected alternatives and why are in section 3.5.

**Determinism is per-run.** `sharp` (libvips) will not produce the same bytes
as the Pillow encoder that produced the currently committed assets. That is
harmless and must be stated rather than discovered: the verification that
matters is re-encoding each source and comparing against what was just
installed, which is self-consistent within one run. It also means
`--verify-only` is scoped to the assets a given source set maps to, never to
the whole `img/` tree.

### 3.2 The prompt keeps judgment; the runbook takes the procedure; no new skill

**No new skill.** The three existing skills (`/handoff`, `/orchestrate`,
`/small-fix`) are human-invoked session protocol that cuts across tasks.
Artwork refresh already has a durable home of its own - an agent
(`.claude/agents/refresh-artwork.md`) whose prompt it reads - so a skill would
make two homes for one workflow and guarantee they drift. The house precedent
for a tool's deep procedure is `docs/tg-preview.md`, a runbook in `docs/`
linked from the code that implements it.

The line, then:

| Stays in `refresh-artwork.prompt.md` | Moves to `docs/art-refresh.md` |
|---|---|
| when this agent rather than `add-source` | the command sequence, flag by flag |
| input discovery (`APPROVED_SOURCE`, `UPLOAD_DIR`, `ALLOWED_EXCLUSIONS`, `SKILL_ROOT`) and the symbolic-path rule | how to reconcile a drop against a ledger by hash, with the script's inventory output |
| the Phase 1 stop ("a directory full of images is not an acceptance ledger") **and its named exception**, see 3.4 | the drop-is-the-ledger precondition test, spelled out as checks a reader can run |
| the non-square / non-opaque hard stop, and what an authorized exception requires | the conversion settings, now as the script's documented defaults rather than prose to re-implement |
| the repository contract summary and the "do not regenerate HTML for byte changes" rule | the before/after preview proof, as two `--stale-list` runs and one `verify-previews` call |
| gates, commit rules, and the report shape | the optional local reference-cache refresh |

Net effect on the prompt: Phases 1, 2 and 3 shrink to their decisions and
their stops; Phases 4 and 5 become "run the tool, read its report, paste the
counts", with the settings table replaced by a link. The prompt stops being a
specification an agent must re-implement.

### 3.3 tg-preview gains `--stale-list <path>`, dry-run only

**Yes - this is the cheapest item on the list and it is nearly free.** The
dry-run branch already sets `result.pending` to the full stale URL array
(`lib.mjs` 441-462); only a writer is missing. Flag surface grows by one
entry in the existing `FLAGS` table. Test burden is roughly eight cases in a
96-case suite that already runs inside `npm run check`, and `tools/` carries
no coverage threshold (context.md's gate table), so the cost is the tests
themselves and nothing else.

Bounded deliberately:

- It requires `--dry-run`. The live send path stays byte-identical; a reviewer
  can confirm that by reading the diff, which touches `parseArgs`, the
  empty-`todo` early return and the dry-run branch only.
- Its payload has no `urls` key and no timestamp: no timestamp so two runs on
  one tree produce identical files and a diff means a real change, and no
  `urls` so an accidental `--apply` of a stale list is provably a no-op
  (`applyResult` merges `result.urls || {}`). A test pins that.
- It is not a general `--json` output mode. That would be flag surface with no
  caller.

### 3.4 Where the three traps are written down

| Trap | Home | Form |
|---|---|---|
| `og/` is named after the **asset**, not the record | `docs/specs/CONTRACTS.md` section 5 | Two sentences. Section 5 today says `img/<id>.webp`, `og/<id>.jpg` without saying which id; the fix names it as the asset id - the basename of a record's `img` - notes that several records may share one, and states that `og/<record-id>.jpg` for a sharing record does not exist and must not be created. It is a published-artefact fact (the tag in `i/<id>.html` is public), so it belongs here and not in a procedure. `tools/build-share-pages.js:112` and `tests/dataint.js:162` already enforce it; the documentation was the only gap. |
| The destination is the record's `img` field, never `record.id + '.webp'`, and it is never fanned out | `tools/art-refresh/lib.mjs`, as executable behaviour with its own test cases, plus one clause in the CONTRACTS sentence above | The prompt states this today (Phase 3.2) and an agent still had to measure it. A rule that a function enforces cannot be lost; a rule in prose can. |
| A drop with exactly one file per item and a `v<N>` suffix that is provenance rather than a choice **is** an unambiguous ledger | `docs/art-refresh.md`, as a named precondition beside the prompt's stop | This is judgment, so it stays next to the procedure, not in CONTRACTS. Written as the three checks that make it true - one file per item, every name resolving to exactly one record, no name appearing at two versions - so the next agent applies a test instead of re-deriving an argument. The prompt keeps the stop and cites the exception by name. |

### 3.5 Deliberately not built

| Rejected | Why |
|---|---|
| `sharp` (or `jimp`, `imagemin`) in the **root** `package.json` | Every `npm ci` in CI and on every contributor machine would carry a native encoder for a tool that runs about three times a year. The sibling-project shape gets the same capability for zero CI cost. |
| A repository script that bootstraps and drives a Python venv | It preserves byte-identity with the currently committed assets, which is worth nothing (3.1), and it makes a Node repository depend on a second toolchain. `issues/dh-image-polish/refresh_artwork.py` is what that path produced last time: stranded, unrun, unfound. |
| A new `.claude/skills/refresh-artwork/SKILL.md` | Two durable homes for one workflow that already has an agent and a prompt. See 3.2. |
| Wiring the converter into `npm run check` or `check:built` | Forbidden by the task constraints, and pointless: nothing a gate asserts depends on re-encoding an image. |
| A manifest/acceptance-ledger format, versioned or multi-version | The repository has met exactly two delivery shapes: an id-keyed accepted-version manifest (`dh-image-polish`) and a name-keyed drop (`art-to-fix`). The script takes a directory and matches by name, with `--map <file>` - a flat `{ "<source filename>": "<record id>" }` JSON - as the one escape hatch for any delivery whose names do not match. That covers both shapes met so far and every shape a human can describe in five minutes, without inventing a schema for a ledger nobody has produced. |
| A general `--json` / output-format flag on tg-preview | See 3.3. One writer with one caller, not a mode. |
| Making `--stale-list` work on the live send path | The value is the before/after proof, which is a dry-run activity. Keeping the live path untouched is what makes the change reviewable. |
| Having `tools/art-refresh/run.mjs` invoke `tools/tg-preview/run.mjs` | Couples two tools and puts a Telegram-capable entry point one typo away from a run without `--dry-run`. The runbook sequences them; the art tool only reads the JSON files the preview tool wrote. |
| Committing a hash inventory of installed assets | Git already records the bytes. Nothing would read it. |
| A hook that guards artwork installs | `.claude/README.md`'s standing bar is a repeated mistake, and no artwork refresh has produced one that a path test could catch. Nothing to add to the candidates ledger. |

## 4. Architecture

```
tools/art-refresh/
  package.json         sharp, private, type: module, engines node >= 22
  package-lock.json    tracked; node_modules/ ignored by the root .gitignore
  lib.mjs              pure: no fs, no sharp, no network
  lib.test.mjs         node --test; wired into `npm run check`
  run.mjs              CLI: fs + a lazy `await import('sharp')`
docs/art-refresh.md    the runbook, mirroring docs/tg-preview.md
```

`lib.mjs` reuses nothing it can borrow instead: `run.mjs` reads records through
the `createRequire` + `window.LOOT` shim that `tools/tg-preview/manifest.mjs`
already demonstrates, and takes `everything()` and `SITE` from
`tools/derived.js`. No new data adapter, no new normalisation module outside
`lib.mjs`.

Boundary, exactly as tg-preview draws it: `lib.mjs` holds every rule that can
be stated over data (name normalisation, matching, destination resolution,
shared-art expansion, collision and duplicate detection, the affected-stub-URL
set, the stale-set algebra) and is fully tested. `run.mjs` holds only the
parts whose honest proof is the filesystem and the encoder.

## 5. Batches

| # | Name | Status | Gates |
|---|---|---|---|
| B1 | Machine-readable stale list in `tools/tg-preview/` | **next, implement-ready** | `node --test tools/tg-preview/lib.test.mjs`; one foreground `npm run check` |
| B2 | `tools/art-refresh/` - the mapping/convert/install/verify tool | planned (outline in 5.2) | `node --test` on both tool suites; one foreground `npm run check` |
| B3 | Prompt, runbook wiring and the tooling record | planned (outline in 5.3) | one foreground `npm run check` |

B1 is first because B2's `verify-previews` consumes the file format B1
defines, and because B1 is independently useful the moment it lands. B3 is
last because the prompt must name the tool's real flags, which are only final
once B2 is reviewed.

`npm run check:built` is **not required by any of the three batches**. It is
required when a change alters what a screen draws; none of these touches
`app/`, `data.js`, `img/`, `og/`, `i/` or `dist/`. Stated here so no
implementer has to assume.

---

### 5.1 B1 - Machine-readable stale list (implement-ready)

**Objective.** `node tools/tg-preview/run.mjs --dry-run --stale-list <path>`
writes the exact set of stale stub URLs as sorted JSON, so proving which
previews a change invalidated is a diff of two files rather than a scratch
program.

**In scope.** `parseArgs`; the stale-list emission inside `runRefresh`'s
dry-run paths; the `run.mjs` writer; tests; the two documentation lines.

**Out of scope.** The live send path. `--apply`. `state.json` (never read for
this feature beyond what a dry run already reads, never written).
`previews.yml`. Anything under `tools/art-refresh/` - it does not exist yet.

**Files to edit.**

- `tools/tg-preview/lib.mjs`
- `tools/tg-preview/lib.test.mjs`
- `tools/tg-preview/run.mjs`
- `docs/tg-preview.md`
- `docs/specs/COVERAGE.md`

**Steps.**

1. `tools/tg-preview/lib.mjs`, `FLAGS` (around line 264): add
   `'--stale-list': 'staleListPath'`. Add `staleListPath: null` to the
   `parseArgs` defaults object beside `resultPath`.
2. In `parseArgs`, after the argv loop, beside the existing `--mode`
   validation: `if (opts.staleListPath && !opts.dryRun) throw new Error(...)`.
   The message must name `--dry-run` as the fix. Validating after the loop is
   what makes flag order irrelevant.
3. In `runRefresh`, destructure `writeStaleList` from `deps` alongside
   `writeResult`. Define one local helper beside `baseResult()`:

   ```js
   async function emitStaleList(urls, notLiveUrls) {
     if (!writeStaleList) return;
     await writeStaleList({
       version: 1,
       site: manifest.site,
       mode,
       stale: [...urls].sort(),
       notLive: [...notLiveUrls].sort()
     });
   }
   ```

   Sorted arrays and no timestamp are load-bearing: two runs on one tree must
   produce byte-identical files, so a diff means a real change.
4. Call it from **both** dry-run-reachable exits:
   - the `todo.length === 0` early return (line ~410): `await emitStaleList([], [])`
     before `return baseResult()`. An empty stale list is a legitimate and
     useful "before" file; skipping it would make the absence of the file
     ambiguous.
   - the `if (dryRun)` branch (line ~441): `await emitStaleList(todo, notLive)`
     before returning. `todo`, not `ready` - `--only` filtering is already
     applied to `todo`, and a URL held back by the live check is reported
     under `notLive`, not dropped from `stale`.
5. Add no call anywhere past the `dryRun` branch. The live path must be
   untouched, and step 4's two sites are the whole diff in `runRefresh`.
6. `tools/tg-preview/run.mjs`: in `deps`, beside `writeResult`, add

   ```js
   writeStaleList: opts.staleListPath
     ? async (payload) => { /* tmp + rename, JSON.stringify(payload, null, 2) + '\n' */ }
     : null,
   ```

   Same atomic temp-sibling-then-rename shape as `writeResult`, and the same
   reason: a killed run must not leave a truncated file that reads as an
   answer. Add a short comment saying so.
7. `docs/tg-preview.md`, "Operations": one bullet after the `--no-verify`
   bullet. State the flag, that it requires `--dry-run`, the payload keys
   (`version`, `site`, `mode`, `stale`, `notLive`), that the arrays are sorted
   and the file carries no timestamp so two runs diff cleanly, and the one
   sentence that names its purpose - proving which stub URLs a byte change
   invalidated, before and after.
8. `docs/specs/COVERAGE.md`: extend the existing
   `tools/tg-preview/lib.test.mjs` paragraph (around line 302) with the
   stale-list writer, in the same voice as the clauses already there.

**Tests** - add to `tools/tg-preview/lib.test.mjs`, in the style of its
neighbours (fake client, clock and live check; no filesystem):

1. `parseArgs(['--dry-run', '--stale-list', 'x.json'])` sets
   `staleListPath: 'x.json'`.
2. `parseArgs(['--stale-list', 'x.json'])` throws, and the message mentions
   `--dry-run`.
3. `parseArgs(['--stale-list', 'x.json', '--dry-run'])` does **not** throw -
   order independence.
4. A dry run with a stale set calls `writeStaleList` exactly once, with
   `version: 1`, the manifest's `site`, the run's `mode`, `stale` deep-equal
   to the returned `result.pending` sorted, and `notLive` sorted.
5. A dry run with `--only` writes only the narrowed set.
6. A dry run with nothing stale still writes, with `stale: []` and
   `notLive: []`.
7. A **non**-dry run never calls `writeStaleList`, even when the dep is
   supplied - this is the test that pins "the live path is untouched".
8. `applyResult(state, <a stale-list payload>, site)` leaves `urls`
   unchanged - an accidental `--apply` of a stale list cannot corrupt state.

**Acceptance criteria.**

- `node --test tools/tg-preview/lib.test.mjs` passes, with 96 + 8 cases.
- A real dry run writes a file whose `stale.length` equals the `N urls stale`
  the same run logs. Run it into the session scratchpad, never into the
  repository:
  `node tools/tg-preview/run.mjs --dry-run --no-verify --stale-list <scratchpad>/stale-b1.json`
- Running that same command twice produces byte-identical files.
- `git diff tools/tg-preview/lib.mjs` shows changes in `parseArgs`, the
  empty-`todo` early return and the dry-run branch, and nowhere else.
- `tools/tg-preview/state.json` is unchanged and unstaged.
- `docs/tg-preview.md` and `docs/specs/COVERAGE.md` both describe the flag.
- No dependency added to any `package.json`.

**Verification commands.**

```text
node --test tools/tg-preview/lib.test.mjs
node tools/tg-preview/run.mjs --dry-run --no-verify --stale-list <scratchpad>/stale-b1.json
set -o pipefail; npm run check 2>&1 | tail -n 120      # one foreground call, Bash timeout 600000
```

`npm run check:built` is not required: no screen output changes.

**Risks / do-nots.**

- Never invoke `run.mjs` without `--dry-run` in this batch, for any reason.
- Do not write the stale list anywhere inside the repository; the scratchpad
  is the only destination. It is neither evidence nor an artefact.
- Do not touch `.env`, and do not add an env-var alias for the new flag.
- Do not reuse `--result`. Its shape belongs to `--apply`, and a second
  meaning for one flag is exactly the ambiguity this batch exists to remove.
- Do not reformat `lib.mjs`. `tools/` is prettier-ignored and eslint-ignored
  (context.md's gate table), so a stray reformat produces a large diff that no
  gate would have asked for.

---

### 5.2 B2 - `tools/art-refresh/` (outline; expand when B1 lands)

**Objective.** One tested tool that performs everything `art-to-fix`
re-derived: inventory, mapping, conversion, atomic install, byte
verification, and the preview-staleness proof.

**Files.** `tools/art-refresh/{package.json,package-lock.json,lib.mjs,lib.test.mjs,run.mjs}`;
`package.json` (root, `check` script only); `docs/art-refresh.md`;
`docs/specs/CONTRACTS.md`; `docs/specs/COVERAGE.md`; `.claude/README.md`;
delete `issues/dh-image-polish/refresh_artwork.py`.

**`lib.mjs`, settled surface** (pure; no `fs`, no `sharp`):

- `normalizeName(s)` - NFC, fold typographic apostrophes to `'`, collapse
  whitespace, trim, strip a trailing ` v<N>`, lowercase for the match key.
  The original string is carried through for reporting.
- `indexRecords(records)` - `{ byId, byName, byImg }`.
- `planInstall({ sources, records, map })` - returns
  `{ pairs, unmatched, ambiguous, collisions, duplicateSources, counts }`.
  Each pair carries `{ source, sourceSha256, recordId, recordName, asset,
  webp, jpeg, sharedWith }`, where `asset` is the record's `img` field,
  `jpeg` is that name with `.webp` replaced by `.jpg`, and `sharedWith` lists
  every other record id whose `img` is the same asset. `counts` is the three
  numbers the prompt's report asks for: accepted artwork, unique asset pairs,
  catalog record links.
- `affectedStubUrls(pairs, site)` - the stub URLs every mapped record and
  every `sharedWith` record resolves to. This is what replaces `map-full.mjs`
  and `expected-affected-urls.json`.
- `staleDelta({ before, after, expected })` - `{ newlyStale, alreadyStale,
  missing, extra, disappeared, ok }`, over the arrays B1's `--stale-list`
  writes. This is what replaces `stale-list.mjs` and the hand-run set algebra
  in `issues/art-to-fix/handoff.md`.

Rules the tests must pin, because these are the traps: the destination comes
from `record.img` and never from `record.id + '.webp'`; one source that maps
to a shared asset installs **once** and is never fanned out; two different
sources mapping to one asset is a hard error; two different filenames with
identical bytes is a hard error; a name matching zero or more than one record
is reported, never guessed.

**`run.mjs`, settled surface** (impure; the only file importing `sharp`):

- `--uploads <dir>`, optional `--map <file>`, `--repo <dir>` (default: the
  repository root), `--report <path>`, `--dry-run`, `--verify-only`, and the
  `verify-previews --before <f> --after <f> --report <f>` mode over B1's
  files.
- Order: hash + decode inventory (format, dimensions, squareness, opacity) ->
  `planInstall` -> report -> convert -> write `<dest>.tmp` siblings -> rename
  both only once both exist -> re-encode every destination and compare bytes
  -> decode-check every installed file. `--dry-run` stops after the report and
  writes nothing; it still decodes, because geometry is a Phase 1 stop that
  must be provable before any write.
- Hard stops, loud, before any write: a non-square input; an alpha channel
  that is not fully opaque; a destination `img/` or `og/` file that does not
  already exist (this tool replaces, it never creates).
- Conversion settings, from `context.md`: EXIF orientation applied; flatten
  only fully-opaque alpha; resize to 640x640 with Lanczos; WebP quality 85 at
  maximum encoder effort, lossy; JPEG quality 80, progressive, 4:2:0,
  optimised; no metadata. Record the resolved `sharp` and libvips versions in
  the handoff - not in the repository - since they are what the bytes depend
  on.

**Acceptance criteria** (each is its own line on purpose, including the
inherited items):

- `node --test tools/art-refresh/lib.test.mjs` passes and is a step in the
  root `check` script.
- Root `package.json` gains that step and **no dependency**.
- `grep -c sharp tools/art-refresh/lib.mjs` is zero; only `run.mjs` imports it.
- A `--dry-run` against a fixture directory reproduces `art-to-fix`'s three
  counts on the shared-art case - one asset pair, four record links - without
  creating `img/q138.webp` or `og/q138.jpg`.
- `docs/art-refresh.md` exists and carries the drop-is-the-ledger precondition
  test (plan 3.4, row 3) as three checks a reader can run.
- `docs/specs/CONTRACTS.md` section 5 names the asset id and the sharing rule
  (plan 3.4, row 1).
- `docs/specs/COVERAGE.md` documents the new `node --test` suite beside the
  tg-preview one.
- `issues/dh-image-polish/refresh_artwork.py` is deleted, and
  `.claude/README.md`'s candidate 39 row is amended in the same commit to
  record that it was superseded by `tools/art-refresh/` - the row keeps the
  historical example it cites rather than losing it.
- No `img/`, `og/`, `i/`, `data.js` or `dist/` file changes in this batch.

**Risks / do-nots.** Do not re-install any currently committed asset to "test"
the tool against the repository; use a scratch copy. Do not make
`--verify-only` walk the whole `img/` tree (3.1, determinism). Do not add a
root `npm run` target. Do not let `lib.mjs` read the filesystem.

---

### 5.3 B3 - Prompt, runbook wiring and the tooling record (outline)

**Objective.** Move the procedure out of
`.claude/prompts/refresh-artwork.prompt.md` per 3.2, and record the tooling
decision where `.claude/README.md` owns it.

**Files.** `.claude/prompts/refresh-artwork.prompt.md`;
`.claude/README.md`; `docs/art-refresh.md` (cross-links only);
possibly `.claude/agents/refresh-artwork.md` if its `description` still
promises a procedure the prompt no longer carries.

**Acceptance criteria.**

- The prompt's Phases 4 and 5 name `tools/art-refresh/run.mjs` and link
  `docs/art-refresh.md` instead of restating settings; the conversion-settings
  list appears in exactly one place in the repository.
- The Phase 1 stop survives verbatim, and cites the drop-is-the-ledger
  exception by name with a link to the runbook.
- `.claude/README.md` gains a short "Artwork refresh" note: what
  `tools/art-refresh/` is, why it is a sibling npm project and not a root
  dependency, and that no skill was created for it - with the reason, so the
  question is not reopened.
- No new file under `.claude/skills/`.
- No model routing appears in any file this batch touches.
- The prompt still reads correctly for an agent on a machine where
  `tools/art-refresh/node_modules/` is absent.

## 6. Contracts and behaviour that must remain stable

- `img/<asset>.webp` and `og/<asset>.jpg` remain the published paths. B2
  clarifies the documentation; it changes no path, no id and no mapping.
- `tools/tg-preview/state.json` is CI's file. No batch reads it for anything
  beyond what a dry run already does, and none writes or stages it.
- `previews.yml` is unchanged by every batch. B1's flag is opt-in.
- `data.js` and the derived set (`data.json`, `catalog.csv`, `i/*.html`) are
  untouched throughout. Nothing here is a data change.

## 7. Risks, assumptions, open questions

- **Assumption**: `sharp` installs on the owner's Windows host. If its
  prebuilt binary does not resolve, B2 stalls at `npm install` inside
  `tools/art-refresh/`; the fallback is to keep `lib.mjs`, `lib.test.mjs` and
  `verify-previews` (which need no encoder at all and carry most of the value)
  and to defer only the convert/install half. Record the failure, do not
  silently switch toolchains.
- **Risk**: B2's output bytes differ from the currently committed assets'
  (3.1). Mitigated by scoping verification per run; stated in the runbook so
  the next refresh does not read it as a regression.
- **Risk**: a peer session or the CI bot moves `main` under this work.
  Re-read `git log --oneline -3 origin/main` before each batch's commit and
  record the base in the handoff.
- **Open**: none that blocks an implementer. The three owner-visible calls -
  build the script, add the flag, write no skill - are recorded as decisions
  in section 3 with their reasons, and the plan prompt's bar for asking is
  "materially different options the repository does not clearly pick between".
  The repository picks `tools/tg-preview/`'s shape clearly.

## 8. Deferred

- A `--stale-list` equivalent on the live path: no caller (3.5).
- Any acceptance-ledger schema: no producer (3.5).
- Deleting `issues/dh-image-polish/` outright: its `context.md`, `plan.md` and
  `handoff.md` are still evidence, and `bash-guard.mjs` rule 40 guards a
  cited `plan.md`. Only the stranded `.py` goes, in B2.
