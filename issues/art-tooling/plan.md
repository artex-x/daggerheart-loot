# Plan - TASK art-tooling

Read `context.md` first; every measured fact this plan rests on is there and
is not repeated.

## 0. Revision history

| Rev | Date | What changed and why |
|---|---|---|
| r1 | 2026-09-16 | First pass. Five decisions (section 3), three batches, B1 expanded to implement-ready. |
| r2 | 2026-09-16 | B1 shipped (`977b8a7`). The owner asked whether the tooling should serve **new-item ingest** as well as replacement. It should. Changes: the tool is renamed `tools/artwork/` and its runbook `docs/artwork.md` (3.1, 3.6); ingest's real delta is settled and is much smaller than it looked (3.6); shape is one library, one entry point, two verbs (3.7); the `og/`-shares-an-asset trap gains three enforcement layers, one of them a new `tests/dataint.js` check (3.4); `add-source.prompt.md` gains a cited art phase, not a manual (3.8); B2 stays replacement-only and is implement-ready, B3 becomes ingest + both prompts + the runbook's second half and is implement-ready (5.2, 5.3). |

Names that changed in r2, so an implementer reading an older note is not
confused: `tools/art-refresh/` -> **`tools/artwork/`**;
`docs/art-refresh.md` -> **`docs/artwork.md`**. Nothing shipped references the
old names - B1 touched only `tools/tg-preview/`, `docs/tg-preview.md` and
`docs/specs/COVERAGE.md` - so the rename costs nothing and is made now rather
than after the directory exists. The agent and prompt filenames
(`refresh-artwork`) do **not** change: that agent's job is still replacement.

## 1. Objective

Make the next catalog artwork operation - **a refresh of existing art or the
art phase of a new-source ingest** - cost a fraction of `art-to-fix`, by
turning the parts that were re-derived from prose into executable, tested
repository tooling, and by writing down the facts neither prompt states.
Reduce `.claude/prompts/refresh-artwork.prompt.md` to the judgment it is
actually good at, give `.claude/prompts/add-source.prompt.md` an art phase
that cites the same runbook instead of re-deriving it, and move the procedure
to one runbook beside the tool that performs it.

## 2. Recommendation in one paragraph

Build the tool, and build it for both callers. Four refreshes have now paid
for it, the third left a tracked Pillow implementation of most of it stranded
in an issue directory, and the fourth re-wrote that implementation from prose
because nobody found it. `add-source.prompt.md` carries **three sentences**
about art in total - no dimensions, no encoder, no settings, no verification -
so an ingest run today either re-derives the encoder settings (the cost this
task exists to remove) or guesses them and produces assets that do not match
the 875 already in `img/`. The dependency objection dissolves against
`tools/tg-preview/`, which already carries a heavy dependency in its own
`package.json` with its own lockfile, installed only by the one workflow that
needs it: root `npm ci` and `npm run check` never see it, and the same shape
gives `tools/artwork/` an image encoder at no CI cost. Split it the way
tg-preview is split - a pure `lib.mjs` with a `node --test` suite wired into
`npm run check`, and an impure `run.mjs` that lazily imports the encoder - and
give `run.mjs` verbs rather than two entry points, because the half that
differs between replacement and ingest is two pure planners while the half
that is identical is the encoder, the atomic install and the decode
verification. Write no new skill: this workflow already has two agents with
two prompts, and `docs/tg-preview.md` is the house precedent for where a
tool's runbook lives. Put the `og/`-is-named-after-the-asset rule in
`docs/specs/CONTRACTS.md` **stated in both directions**, and add the one test
the repository is missing: `tests/dataint.js` guards `img/` orphans and
duplicate bytes but has no `og/` orphan check, which is precisely the ingest
trap.

## 3. The decisions

### 3.1 A repository script earns its place, as a sibling npm project

**Yes.** Ship `tools/artwork/`, modelled line for line on
`tools/tg-preview/`:

- `tools/artwork/package.json` + `package-lock.json`, tracked, carrying
  `sharp` as its own dependency. `node_modules/` there is already covered by
  the root `.gitignore`.
- **Root `package.json` gains no dependency.** CI cost: zero. `ci.yml`'s
  `npm ci` resolves the root lockfile only; nothing installs `tools/artwork/`.
  The only root change is one extra step in the `check` script,
  `node --test tools/artwork/lib.test.mjs`, which is a pure suite measured in
  milliseconds against a ~165 s check.
- **It is not wired into any `npm run` target that a human or CI runs
  routinely.** No `npm run art` convenience script: `previews.yml` already
  calls `node tools/tg-preview/run.mjs` by path rather than through
  `npm run previews`, so a path invocation is the house norm and one fewer
  name to keep in sync. `npm run check` and `check:built` do not grow an image
  encoder, and cannot: `run.mjs` is the only file that imports `sharp`, no
  gate runs `run.mjs`, and `lib.mjs` must not import it.
- **The encoder is demanded, not assumed.** `run.mjs` does
  `await import('sharp')` inside a `try`, and on failure exits with a message
  naming the fix (`cd tools/artwork && npm ci`) and nothing else. The same
  lazy-import discipline `run.mjs` already uses for `client.mjs` in tg-preview.
  Verbs that need no encoder (`plan`, `verify-previews`) must not reach the
  import at all, so the tool stays useful on a machine where `sharp` will not
  install.

Rejected alternatives and why are in section 3.5.

**Determinism is per-run.** `sharp` (libvips) will not produce the same bytes
as the Pillow encoder that produced the currently committed assets. That is
harmless and must be stated rather than discovered: the verification that
matters is re-encoding each source and comparing against what was just
installed, which is self-consistent within one run. It also means
`verify` is scoped to the assets a given source set maps to, never to the
whole `img/` tree.

### 3.2 The prompts keep judgment; the runbook takes the procedure; no new skill

**No new skill.** The three existing skills (`/handoff`, `/orchestrate`,
`/small-fix`) are human-invoked session protocol that cuts across tasks.
Artwork work already has durable homes of its own - two agents
(`.claude/agents/refresh-artwork.md`, `.claude/agents/add-source.md`) whose
prompts it reads - so a skill would make a third home for one procedure and
guarantee drift. The house precedent for a tool's deep procedure is
`docs/tg-preview.md`, a runbook in `docs/` linked from the code that
implements it. r2 strengthens this: with **two** prompts needing the same
procedure, a single cited runbook is the only shape that keeps the conversion
settings in exactly one place in the repository.

The line, for `refresh-artwork.prompt.md`:

| Stays in `refresh-artwork.prompt.md` | Moves to `docs/artwork.md` |
|---|---|
| when this agent rather than `add-source` | the command sequence, verb by verb |
| input discovery (`APPROVED_SOURCE`, `UPLOAD_DIR`, `ALLOWED_EXCLUSIONS`, `SKILL_ROOT`) and the symbolic-path rule | how to reconcile a drop against a ledger by hash, with the tool's inventory output |
| the Phase 1 stop ("a directory full of images is not an acceptance ledger") **and its named exception**, see 3.4 | the drop-is-the-ledger precondition test, spelled out as checks a reader can run |
| the non-square / non-opaque hard stop, and what an authorized exception requires | the conversion settings, now as the tool's documented defaults rather than prose to re-implement |
| the repository contract summary and the "do not regenerate HTML for byte changes" rule | the before/after preview proof, as two `--stale-list` runs and one `verify-previews` call |
| gates, commit rules, and the report shape | the optional local reference-cache refresh |

The line for `add-source.prompt.md` is in 3.8. Net effect on
`refresh-artwork.prompt.md`: Phases 1, 2 and 3 shrink to their decisions and
their stops; Phases 4 and 5 become "run the tool, read its report, paste the
counts", with the settings table replaced by a link.

### 3.3 tg-preview gains `--stale-list <path>`, dry-run only - SHIPPED (B1)

Landed in `977b8a7`. `node tools/tg-preview/run.mjs --dry-run --stale-list
<path>` writes `{ version, site, mode, stale[], notLive[] }` with sorted
arrays, no `urls` key and no timestamp, so two runs on one tree produce
byte-identical files. Suite 96 -> 104 cases. `docs/tg-preview.md` and
`docs/specs/COVERAGE.md` describe it. Nothing in r2 changes it; B2 consumes
the format unaltered.

Ingest note added in r2: `--stale-list` is a **replacement**-side proof. For a
new record the stub URL did not exist before the change, so a before/after
delta degenerates to "everything is new". Ingest's stub proof is
`node tools/build.js` plus `tests/derived.js` and `tests/dataint.js`, which
already pin that `i/<id>.html` exists for every record. See 3.6.

### 3.4 Where the traps are written down, and what enforces them

Measured in r2 (`node -e` over `data.js` + `img/` + `og/`, this worktree, this
commit): 1091 records, all carrying an `img` value; **875 distinct assets**;
**72 shared assets**; 876 `img/*.webp` files (875 used plus the unreferenced
`_none.webp` placeholder); 877 `og/*.jpg` files (875 plus `_none.jpg` and
`_share.jpg`). `q24.webp` serves `q24`, `q70`, `q138`, `q205`, and all four
carry `eq.line === 'q24'`.

| Trap | Home | Form |
|---|---|---|
| `og/` is named after the **asset**, not the record - in both directions | `docs/specs/CONTRACTS.md` section 5 | Section 5 today says `img/<id>.webp`, `og/<id>.jpg` without saying which id. The fix names it as the asset id - the basename of a record's `img` - notes that several records may share one, and states **both** consequences: on replacement, `og/<record-id>.jpg` for a sharing record does not exist and must not be created; on ingest, a new record that takes an existing asset gets **no** `og/` file of its own. It is a published-artefact fact (the tag in `i/<id>.html` is public), so it belongs here and not in a procedure. |
| The destination is the record's `img` field, never `record.id + '.webp'`, and it is never fanned out | `tools/artwork/lib.mjs`, as executable behaviour with its own test cases, plus one clause in the CONTRACTS sentence above | The prompt states this today (Phase 3.2) and an agent still had to measure it. A rule that a function enforces cannot be lost; a rule in prose can. r2 makes it structural: both planners key their write set by **distinct `img` value**, never by record id, so no code path exists that could fan one source out to per-record filenames. |
| A drop with exactly one file per item and a `v<N>` suffix that is provenance rather than a choice **is** an unambiguous ledger | `docs/artwork.md`, as a named precondition beside the prompt's stop | This is judgment, so it stays next to the procedure, not in CONTRACTS. Written as the three checks that make it true - one file per item, every name resolving to exactly one record, no name appearing at two versions - so the next agent applies a test instead of re-deriving an argument. The prompt keeps the stop and cites the exception by name. |
| **New in r2:** an ingested record that joins an upgrade line must not get its own `og/<new-id>.jpg` | three layers, below | The `img/` half of this is already enforced; the `og/` half is not. |

**The three enforcement layers for the `og/` ingest trap.** This matters
because `add-source.prompt.md` says nothing about it today and the repository
catches only half of it:

1. **The tool cannot produce it.** `planIngest` keys its write set by distinct
   `img` value among the assets that are actually missing from disk. A record
   whose `img` is already claimed contributes zero writes - it appears in the
   `shares` bucket, which carries no filenames. There is no code path that
   emits `og/<record-id>.jpg` for such a record. Pinned by tests.
2. **The repository catches a hand-made one - after B3.** `tests/dataint.js`
   already fails on an `img/*.webp` that no record claims
   (`'картинка img/' + f + ' никому не принадлежит'`, ~line 167) and on two
   `img/` files holding identical bytes (~line 231). It has **no `og/`
   counterpart**, so a stray `og/<new-id>.jpg` passes every gate today.
   B3 adds the mirrored check over `og/*.jpg`, exempting `_share.jpg` and
   `_none.jpg`. Measured: it passes on the current tree unchanged (877 files,
   875 claimed, two exemptions).
3. **The documentation says it, in the direction ingest reads from.** The
   CONTRACTS sentence above, plus one sentence and a link in
   `add-source.prompt.md` (3.8).

Two further facts the ingest path needs, both already executable and neither
currently written down anywhere a reader of `add-source.prompt.md` would find:

- **Sharing is legal only inside one upgrade line.** `tests/dataint.js`
  (~line 180) computes `new Set(rows.map(r => (r.eq && r.eq.line) || r.id))`
  over the records sharing an asset and fails unless that set has one member.
  So a new record may take an existing asset only when it is equipment in the
  same `eq.line`; two unrelated records sharing a picture is a test failure,
  not a judgment call.
- **A record may legitimately ship with no art.** `img: ''` renders
  `_none.webp` with the `noart` class, and `tests/noart.js` pins that path.
  `tests/dataint.js`'s file check skips records with a falsy `img`. So ingest
  has a third legal outcome - "record now, art later" - that replacement has
  no equivalent for, and the tool must report it rather than fail on it.

`tests/dataint.js` is **not** part of `npm run check` (measured against
`package.json`: `check` runs `format:check`, `lint`, `typecheck`,
`node --check tools/check-site.mjs`, `npm run data`, `tests/derived.js`,
`tests/i18n.js`, `.claude/hooks/selftest.mjs`,
`node --test tools/tg-preview/lib.test.mjs`, then vitest). It runs via
`node tests/run-all.js dataint`. Layer 2 therefore only binds if the prompts
name that command, which is why B3 makes both of them do so explicitly rather
than saying "the data/image checks the repo expects". Moving `dataint` into
`npm run check` is a repository-wide gate decision, not an artwork decision;
it is recorded in section 8 with its measured cost, not taken here.

### 3.5 Deliberately not built

| Rejected | Why |
|---|---|
| `sharp` (or `jimp`, `imagemin`) in the **root** `package.json` | Every `npm ci` in CI and on every contributor machine would carry a native encoder for a tool that runs a few times a year. The sibling-project shape gets the same capability for zero CI cost. |
| A repository script that bootstraps and drives a Python venv | It preserves byte-identity with the currently committed assets, which is worth nothing (3.1), and it makes a Node repository depend on a second toolchain. `issues/dh-image-polish/refresh_artwork.py` is what that path produced last time: stranded, unrun, unfound. |
| A new `.claude/skills/refresh-artwork/SKILL.md` | A third durable home for one procedure that already has two agents and two prompts. See 3.2. |
| Wiring the converter into `npm run check` or `check:built` | Forbidden by the task constraints, and pointless: nothing a gate asserts depends on re-encoding an image. |
| **New in r2:** a second entry point `ingest.mjs` beside `run.mjs` | The differing half is two pure planners in `lib.mjs`; the identical half is the encoder, the atomic install and the decode verification. Two entry points would duplicate the identical half or demand a third impure module to share it, and would double the `await import('sharp')` site. See 3.7. |
| **New in r2:** a `--mode replace\|ingest` flag | Same objection the other way: a flag that silently inverts a destructive precondition (destination must exist / must not exist) is the wrong surface for the one decision a mistake is most expensive on. A verb is read aloud in the command line and in the runbook. See 3.7. |
| **New in r2:** letting the tool choose an asset id or infer sharing | The tool reads `data.js`; the agent writes `data.js`. Asking the tool to invent `<id>.webp` versus "join the line" would make it guess a source-book judgment. Instead the agent declares `img` in `data.js` and the tool **validates** that declaration against the sources, the disk and the invariants. This removes an entire class of API surface - no `share` map, no `assign-asset` function - and makes the `og/` trap structurally impossible (3.4, layer 1). |
| A manifest/acceptance-ledger format, versioned or multi-version | The repository has met exactly two delivery shapes: an id-keyed accepted-version manifest (`dh-image-polish`) and a name-keyed drop (`art-to-fix`). The tool takes a directory and matches by name, with `--map <file>` - `{ "assign": { "<source filename>": "<record id>" } }` - as the one escape hatch for any delivery whose names do not match. That covers both shapes met so far and every shape a human can describe in five minutes, without inventing a schema for a ledger nobody has produced. |
| A general `--json` / output-format flag on tg-preview | See 3.3. One writer with one caller, not a mode. |
| Making `--stale-list` work on the live path | The value is the before/after proof, which is a dry-run activity. Keeping the live path untouched is what makes the change reviewable. |
| Having `tools/artwork/run.mjs` invoke `tools/tg-preview/run.mjs` | Couples two tools and puts a Telegram-capable entry point one typo away from a run without `--dry-run`. The runbook sequences them; the art tool only reads the JSON files the preview tool wrote. |
| Committing a hash inventory of installed assets | Git already records the bytes. Nothing would read it. |
| A hook that guards artwork installs | `.claude/README.md`'s standing bar is a repeated mistake, and no artwork operation has produced one that a path test could catch. The `og/`-orphan gap is a **test** gap, not a hook gap, and B3 closes it as a test. Nothing to add to the candidates ledger. |

### 3.6 What ingest needs that replacement does not, and vice versa

This is the r2 question. The answer, against B2's planned export list:

| Export | Replacement | Ingest | Note |
|---|---|---|---|
| `normalizeName(s)` | yes | yes | **Common, unchanged.** Both resolve a delivered filename to a record name. |
| `indexRecords(records)` | `byId`, `byName`, `byImg` | same three | **Common, unchanged.** Ingest needs `byImg` to see which records already claim an asset. No `byLine` is needed: sharing is read off `data.js`'s `img` values, not inferred from lines (3.5). |
| `planInstall(...)` | yes | no | **Replacement-only.** Its contract is "this record already has an asset; replace its bytes". |
| `affectedStubUrls(pairs, site)` | yes | not used | **Replacement-only in practice.** It exists to feed `staleDelta`. Ingest's stubs are new, so there is nothing to compare against. |
| `staleDelta({before, after, expected})` | yes | no | **Replacement-only.** See 3.3's ingest note. |
| `planIngest(...)` | no | yes | **New for ingest**, added in B3. |

The convert/verify half is **identical** and is not duplicated: same EXIF
transpose, same opaque-alpha flatten, same 640x640 Lanczos, same WebP q85 at
maximum effort, same JPEG q80 progressive 4:2:0, same decode check, same
temp-sibling atomic write, same re-encode-and-compare. One implementation in
`run.mjs`, reached by both verbs.

What ingest needs that is **not** on B2's list, in full:

1. **`planIngest({ sources, records, missingAssets, map })`** - pure, returns
   `{ creates, shares, unarted, unsourced, unmatched, ambiguous,
   duplicateSources, counts }`.
   - `missingAssets` is supplied by `run.mjs`: the distinct `img` values in
     `data.js` for which `img/<value>` does not exist on disk. That is the
     definition of "new art needed", and it needs no list of new record ids.
   - `creates` is keyed by **distinct asset**, one entry per file pair to be
     written.
   - `shares` lists records whose `img` is already claimed by another record;
     they carry **no filenames** and produce no writes. This is the `og/` trap,
     made structurally impossible.
   - `unarted` lists records with `img: ''` - a legal outcome, reported, never
     an error.
   - `unsourced` lists assets that are missing from disk and have no delivered
     source - the blocker an ingest most often hits.
2. **The inverted destination precondition.** Replacement hard-stops when a
   destination `img/` or `og/` file does **not** exist; ingest hard-stops when
   it **does**, because writing over it would silently destroy another
   record's art. Same check, opposite sense, and it lives in `run.mjs` beside
   the fs.
3. **An ordering constraint replacement does not have.** The `img` value must
   be in `data.js` before or in the same change as the files, or
   `tests/dataint.js`'s orphan check fails. The runbook and the prompt state
   the order: records into `data.js` -> `ingest --dry-run` -> `ingest` ->
   `node tools/build.js` -> `node tests/run-all.js dataint`.
4. **Tolerance for a partially-arted source.** An ingest routinely lands some
   records with art and some without. `unarted` and `unsourced` are report
   buckets, not failures; only a conflict or an ambiguity stops the run.

What **replacement** needs that ingest does not: hash-based acceptance-ledger
reconciliation against `APPROVED_SOURCE` (ingest's provenance question is "is
this the picture for this item", answered by the source book, not by a version
ledger), `verify` over already-installed assets, `staleDelta`, and the
before/after preview proof.

### 3.7 One library, one entry point, two verbs

**Not** a mode flag, and **not** two entry points. `tools/artwork/run.mjs`
takes a verb as its first positional argument, the shape B2's outline already
needed for `verify-previews`:

```
node tools/artwork/run.mjs plan            --uploads <dir> [--map <f>] [--report <f>]
node tools/artwork/run.mjs install         --uploads <dir> [--map <f>] [--report <f>]
node tools/artwork/run.mjs verify          --uploads <dir> [--map <f>]
node tools/artwork/run.mjs verify-previews --before <f> --after <f> [--report <f>]
node tools/artwork/run.mjs ingest          --uploads <dir> [--map <f>] [--dry-run] [--report <f>]   # B3
```

Weighed against `tools/tg-preview/`'s split, which section 3.1 already chose
as the house shape: that tool is `lib.mjs` (pure, tested) + `run.mjs` (impure
CLI) + `client.mjs` / `live.mjs` (impure, live, deliberately untested), with
**one** entry point carrying flags and modes. `tools/artwork/` mirrors it
exactly: `lib.mjs` (pure, tested) + `run.mjs` (impure CLI, sole `sharp`
importer). The reasons this beats the alternatives:

- **Against two entry points:** the impure half - encoder settings, atomic
  temp-sibling write, decode check, re-encode-and-compare - is 100% shared.
  Two entry points either duplicate it (the exact failure mode this task
  exists to end) or need a third impure module to share it, which is more
  files and two `await import('sharp')` sites instead of one.
- **Against a mode flag:** `--mode ingest` silently inverts a destructive
  precondition. `ingest` as a word in the command line and in the runbook is
  read by the human running it and by the reviewer reading the handoff.
- **Against a library plus two callers:** same as two entry points, plus it
  invites a second `package.json`.

The pure half carries two planners because the planning questions genuinely
differ (3.6); the impure half carries one installer because the installing
question does not.

### 3.8 What `add-source.prompt.md` gains, and what it must not

It stays a prompt. It is an end-to-end ingest prompt covering records, text,
mechanics, refs and crafts; art is one phase of many, and the procedure lives
in `docs/artwork.md`. Today it says, in total: line 45 ("`img/<id>.webp` and
`og/<id>.jpg` are outside the JS build but required when records have art"),
Phase 1 step D ("Map images to ids; note missing/duplicate/wrong art"), and
Phase 2 step 5 ("Place/convert art to `img/` and `og/` naming expected by the
project").

**Gains** (about fifteen lines net, all of it decisions and pointers):

- The "Canonical data source of truth" block: replace the one art line with
  three facts - the asset id is the basename of the record's `img` field and
  is **not** necessarily the record id; several records may share one asset
  and a sharing record gets no file of its own, in `img/` or in `og/`; a
  record may legitimately ship with `img: ''` and render `_none.webp`. One
  link to `docs/artwork.md`.
- Phase 1 step D: expand from six words to the three decisions ingest actually
  owns - which source image belongs to which record; whether a record joining
  an upgrade line takes the line's existing asset or gets its own (a
  source-book judgment, and the only legal reason two records may share); and
  which records ship without art for now.
- Phase 2 step 5: becomes "declare each new record's `img` in `data.js`, then
  run `node tools/artwork/run.mjs ingest` per `docs/artwork.md`; never
  hand-convert". State the ordering constraint (3.6, item 3) in one clause.
- Phase 2 step 10 and the Done criteria: name `node tests/run-all.js dataint`
  explicitly as the art gate instead of "data/image/stub checks the repo
  expects", because that is the command that enforces the `og/` orphan check
  B3 adds, the `img/` orphan check, the duplicate-bytes invariant and the
  one-line sharing rule.

**Must not gain:** the conversion settings list, encoder flags, dimensions,
the hash-inventory procedure, the acceptance-ledger reconciliation (a
replacement concern with no ingest counterpart), or anything else that
duplicates `docs/artwork.md`. The settings appear in **exactly one place in
the repository** - already B3's acceptance criterion, now covering both
prompts. If a reader of `add-source.prompt.md` can carry out the conversion
without opening the runbook, this decision has been violated.

**Filename.** `docs/art-refresh.md` is no longer right: the document serves
ingest too, and a name that says "refresh" invites a future agent to conclude
the ingest half lives somewhere else. **`docs/artwork.md`**, matching
`docs/tg-preview.md`'s "named after the thing" pattern, and matching
`tools/artwork/`.

## 4. Architecture

```
tools/artwork/
  package.json         sharp, private, type: module, engines node >= 22
  package-lock.json    tracked; node_modules/ ignored by the root .gitignore
  lib.mjs              pure: no fs, no sharp, no network
  lib.test.mjs         node --test; wired into `npm run check`
  run.mjs              CLI, verbs; fs + a lazy `await import('sharp')`
docs/artwork.md        the runbook, mirroring docs/tg-preview.md
```

`lib.mjs` reuses nothing it can borrow instead: `run.mjs` reads records
through the `createRequire` + `window.LOOT` shim that
`tools/tg-preview/manifest.mjs` already demonstrates, and takes `everything()`
and `SITE` from `tools/derived.js`. No new data adapter, no new normalisation
module outside `lib.mjs`.

Boundary, exactly as tg-preview draws it: `lib.mjs` holds every rule that can
be stated over data (name normalisation, matching, destination resolution,
shared-asset grouping, collision and duplicate detection, the affected-stub-URL
set, the stale-set algebra, and in B3 the ingest planner) and is fully tested.
`run.mjs` holds only the parts whose honest proof is the filesystem and the
encoder.

## 5. Batches

| # | Name | Status | Gates |
|---|---|---|---|
| B1 | Machine-readable stale list in `tools/tg-preview/` | **shipped** - `fde756c`, `977b8a7`, `db52655`; suite 96 -> 104 | done |
| B2 | `tools/artwork/` - the replacement path, end to end | **shipped** - `551380f`, `7698c95`, `643df19`; suite 0 -> 19 | done |
| B3 | The ingest verb, both prompts, and the runbook's second half | **shipped** - `a38cd60`; suite 19 -> 26 | done |

Ordering. B2 before B3 because B3's `ingest` verb, its runbook section and its
prompt edits all need `tools/artwork/run.mjs` and `docs/artwork.md` to exist,
and because the prompts must name the tool's real verbs, which are only final
once B2 is reviewed. B1 came first because B2's `verify-previews` consumes the
file format B1 defined.

**Did B2 have to split?** No - because ingest was kept **out** of it. The seam
between the two remaining batches is replacement versus ingest, and it falls
on the existing B2/B3 boundary once B3 absorbs the prompt work that used to be
its whole content. Sizing by gates, as `CLAUDE.md` requires: B2 and B3 run the
same `npm run check` (~165 s) and the same pure `node --test` suite, so
merging them would buy one check call and cost a review pass over a sibling
npm project, a native dependency, two planners, two prompts and a runbook -
more than one pass can hold. Splitting B2 further would put `lib.mjs` in one
batch and its only caller in the next, which `CLAUDE.md` forbids ("Add no
module, export, component, or variant before something uses it").

**If B3 proves too large in the doing**, its seam is between code and prose:
stop after `tests/dataint.js` and the `docs/artwork.md` ingest section (a
coherent commit: the ingest verb exists, is tested, is gated and is
documented), and take the two prompts plus `.claude/README.md` as B3b. Do not
split anywhere else; in particular do not land `planIngest` without the
`ingest` verb.

**`npm run check:built` is not required by B2 or B3.** It is required when a
change alters what a screen draws. B2 touches `tools/artwork/**`,
`package.json` (the `check` script only), `docs/**` and `issues/**`. B3 adds
`tests/dataint.js` and `.claude/prompts/**`, `.claude/README.md`. Neither
touches `app/`, `data.js`, `img/`, `og/`, `i/`, `style.css` or `dist/`, and
neither runs the installer against the repository. Stated per batch so no
implementer has to assume; if a batch's real file list ever gains one of those
paths, `check:built` becomes required for that batch.

---

### 5.1 B1 - Machine-readable stale list - SHIPPED

Delivered as specified; see `handoff.md` for the exact commands and results.
`node tools/tg-preview/run.mjs --dry-run --stale-list <path>` writes
`{ version: 1, site, mode, stale[], notLive[] }`, requires `--dry-run`
regardless of flag order, emits once from both dry-run-reachable exits,
carries no `urls` key and no timestamp, and produces byte-identical files on
repeated runs. Suite 104/104. `docs/tg-preview.md` "Operations" and
`docs/specs/COVERAGE.md` (~line 302) document it. The original implement-ready
specification is preserved in the r1 history of this file; it is not repeated
here because nothing reads it any more.

---

### 5.2 B2 - `tools/artwork/`, the replacement path (implement-ready)

**Objective.** One tested tool that performs everything `art-to-fix`
re-derived by hand for a **replacement**: inventory, mapping, conversion,
atomic install, byte verification, and the preview-staleness proof over B1's
`--stale-list` files.

**In scope.** The sibling npm project; `lib.mjs` and its suite; `run.mjs` with
the verbs `plan`, `install`, `verify`, `verify-previews`; the root `check`
step; the runbook's replacement half; the `CONTRACTS.md` sentence; the
`COVERAGE.md` paragraph; the `.claude/README.md` record; removal of the
stranded Python implementation.

**Out of scope.** The `ingest` verb and `planIngest` (B3). Any edit to either
prompt (B3). Any edit to `tests/dataint.js` (B3). Running the installer
against the repository's own `img/`/`og/` (see risks). `data.js`, derived
files, `app/`, `dist/`.

**Files to create or edit.**

- create `tools/artwork/package.json`
- create `tools/artwork/package-lock.json` (generated by `npm install`, tracked)
- create `tools/artwork/lib.mjs`
- create `tools/artwork/lib.test.mjs`
- create `tools/artwork/run.mjs`
- create `docs/artwork.md`
- edit `package.json` (root) - the `check` script only
- edit `docs/specs/CONTRACTS.md` - section 5
- edit `docs/specs/COVERAGE.md` - a new paragraph beside the tg-preview one
- edit `.claude/README.md` - the tooling record and the candidate-39 amendment
- delete `issues/dh-image-polish/refresh_artwork.py`

**Constraints that are already settled - do not reopen.** The sibling-project
shape and the zero-CI-cost argument (3.1). The verb surface (3.7). The
conversion settings (context.md, "Conversion settings"). Per-run determinism,
not byte-identity with the committed assets (3.1). No new root dependency. No
`npm run` convenience target.

**Ordered steps.**

1. `tools/artwork/package.json`: `{ "name": "daggerheart-loot-artwork",
   "private": true, "type": "module", "engines": { "node": ">=22" },
   "dependencies": { "sharp": "<current>" } }`. Mirror
   `tools/tg-preview/package.json`'s field order and style. Run
   `npm install` **inside `tools/artwork/`** to produce `package-lock.json`;
   commit the lockfile, never `node_modules/`.
2. `tools/artwork/lib.mjs` - pure. No `import 'node:fs'`, no `sharp`, no
   network. Export:
   - `normalizeName(s)` - NFC; fold typographic apostrophes (`’`,
     `ʼ`) to `'`; collapse whitespace; trim; strip a trailing ` v<N>`;
     lowercase. Returns the match key. The original string is carried
     separately for reporting, never overwritten.
   - `indexRecords(records)` -> `{ byId, byName, byImg }`. `byName` is keyed by
     `normalizeName` of both `en` and `ru` and its values are **arrays**, so an
     ambiguous name is representable rather than silently last-wins. `byImg`
     maps an `img` value to the array of records claiming it.
   - `planInstall({ sources, records, map })` -> `{ pairs, unmatched,
     ambiguous, collisions, duplicateSources, counts }`.
     - `sources` is `[{ name, sha256, bytes }]` - metadata only; `run.mjs`
       reads the files.
     - `map` is the parsed `--map` object or `null`; only its `assign` key is
       read here: `{ "<source filename>": "<record id>" }`. An `assign` entry
       naming an unknown record id is a hard error in the returned
       `unmatched`, not a throw.
     - Each pair: `{ source, sourceSha256, recordId, recordName, asset, webp,
       jpeg, sharedWith }` where `asset` is the matched record's `img` value,
       `webp` is `img/<asset>`, `jpeg` is `og/<asset with .webp -> .jpg>`, and
       `sharedWith` is every **other** record id in `byImg[asset]`.
     - **Key the pair list by distinct `asset`, not by record.** Two matched
       records sharing one asset and one source produce **one** pair. This is
       the structural form of the trap in 3.4.
     - `collisions`: two different sources resolving to one asset - a hard
       error. `duplicateSources`: two source filenames with identical
       `sha256` - a hard error (it would violate `tests/dataint.js`'s
       duplicate-bytes invariant). `ambiguous`: a name resolving to more than
       one record. `unmatched`: a name resolving to none.
     - `counts` is the three numbers Phase 3.6 of the prompt asks for:
       `acceptedArtwork` (sources matched), `assetPairs` (`pairs.length`),
       `recordLinks` (matched records including every `sharedWith`).
   - `affectedStubUrls(pairs, site)` -> sorted unique stub URLs for every
     matched record and every `sharedWith` record. Use the same URL shape
     `tools/derived.js` / `tools/tg-preview` already produce; do not invent a
     second URL builder.
   - `staleDelta({ before, after, expected })` -> `{ newlyStale, alreadyStale,
     missing, extra, disappeared, ok }`. `before` and `after` are the `stale`
     arrays from two B1 `--stale-list` files; `expected` is
     `affectedStubUrls(...)`. `missing` = expected but not newly stale;
     `extra` = newly stale but not expected; `disappeared` = in `before`, not
     in `after`, not expected. `ok` is true only when `missing` and `extra`
     are both empty.
3. `tools/artwork/lib.test.mjs` - `node --test`, in the style of
   `tools/tg-preview/lib.test.mjs` (plain `node:test` + `node:assert/strict`,
   no filesystem, hand-built record fixtures). Cases, at minimum:
   - `normalizeName`: typographic apostrophe folds; ` v2` / ` v10` suffix
     stripped; internal `v2` **not** stripped; NFC; case and whitespace.
   - `indexRecords`: a name shared by two records yields a two-element array;
     `byImg` groups the four `q24.webp` sharers.
   - `planInstall`: destination is the record's `img`, **not**
     `recordId + '.webp'` - use a fixture where they differ, which is the
     regression this whole tool exists for.
   - `planInstall`: one source matching a record whose asset is shared by four
     records yields **one** pair with `sharedWith.length === 3`, and the pair's
     `jpeg` is the anchor asset's `.jpg`, never `og/<other-record-id>.jpg`.
   - `planInstall`: two sources -> one asset lands in `collisions`.
   - `planInstall`: two source names with one `sha256` land in
     `duplicateSources`.
   - `planInstall`: an unmatched name and an ambiguous name are reported, never
     guessed into a pair.
   - `planInstall`: `map.assign` overrides name matching, and an `assign` to an
     unknown id reports rather than throws.
   - `planInstall`: `counts` on the shared-asset fixture is
     `{ acceptedArtwork: 1, assetPairs: 1, recordLinks: 4 }`.
   - `affectedStubUrls`: includes every `sharedWith` record's stub, sorted and
     deduplicated.
   - `staleDelta`: the clean case (`ok: true`); a `missing`; an `extra`; a
     `disappeared`; and identical `before`/`after` with a non-empty `expected`
     yielding `missing` equal to `expected`.
4. `tools/artwork/run.mjs` - impure, the only file importing `sharp`.
   - Parse `process.argv[2]` as the verb. An unknown or absent verb prints the
     verb list and exits non-zero.
   - Read records through the `createRequire` + `window.LOOT` shim exactly as
     `tools/tg-preview/manifest.mjs` does; take `everything()` and `SITE` from
     `tools/derived.js`. `--repo <dir>` defaults to the repository root
     resolved from `import.meta.url`.
   - `plan`: hash and decode every file in `--uploads`, call `planInstall`,
     print the report and write it to `--report <path>` when given. Writes no
     image. **Must not reach the `sharp` import** for decoding metadata - use
     it only if there is no cheaper way; if it is needed, say so in the
     runbook rather than pretending the verb is encoder-free.
   - `install`: `plan`, then refuse to proceed if `collisions`,
     `duplicateSources` or `ambiguous` is non-empty, or if any input is
     non-square, or if any input has an alpha channel that is not fully
     opaque, or if **any destination `img/` or `og/` file does not already
     exist** (this verb replaces; it never creates). Then, per pair: encode to
     `<dest>.tmp` siblings, decode-check both, rename **both** only once both
     temps exist and verify, re-encode from the source and compare bytes to
     what was installed.
   - `verify`: re-encode every destination named by the current `--uploads`
     set and compare bytes; decode-check each installed file for
     WebP/JPEG, RGB and 640x640. **Scoped to the pairs of this source set**,
     never to the whole `img/` tree (3.1, determinism).
   - `verify-previews --before <f> --after <f>`: read two B1 stale-list files,
     compute `expected` via `affectedStubUrls`, call `staleDelta`, print it,
     exit non-zero when `ok` is false. Needs no encoder and must not import
     `sharp`.
   - Conversion settings, from `context.md`: apply EXIF orientation; flatten
     alpha **only** when fully opaque, otherwise hard-stop; resize to 640x640
     with Lanczos; WebP quality 85 at maximum encoder effort, lossy; JPEG
     quality 80, progressive, 4:2:0, optimised; strip metadata.
   - The `sharp` import is `await import('sharp')` inside a `try`, reached only
     by verbs that encode, failing with a message that names
     `cd tools/artwork && npm ci` and nothing else.
5. Root `package.json`: add `node --test tools/artwork/lib.test.mjs` to the
   `check` script, immediately after the existing
   `node --test tools/tg-preview/lib.test.mjs` step. Add **no** dependency and
   **no** other script.
6. `docs/artwork.md` - the runbook, modelled on `docs/tg-preview.md`. In this
   batch it covers: what the tool is and why it is a sibling npm project; the
   one-time `cd tools/artwork && npm ci`; each verb with its flags; the
   conversion settings, as the tool's documented defaults, stated **once in
   the repository**; the drop-is-the-ledger precondition as three checks a
   reader can run (3.4, row 3); the replacement command sequence end to end,
   including the two `--stale-list` runs and the `verify-previews` call; and a
   short "determinism is per-run" note (3.1) so the next refresh does not read
   differing bytes as a regression. Leave a placeholder-free gap for B3's
   ingest section - do not pre-write headings B3 will fill.
7. `docs/specs/CONTRACTS.md` section 5: after the existing sentence, add the
   asset-id clarification per 3.4 row 1, **in both directions**. Two or three
   sentences; name the asset id as the basename of a record's `img`, say that
   several records may share one, say that a sharing record has no `og/` file
   of its own and none must be created, and note that `tools/build-share-pages.js`
   derives the tag from `img` so the rule is already executable. Keep the
   file's hand-wrapped line style (`*.md` is prettier-ignored).
8. `docs/specs/COVERAGE.md`: a new paragraph beside the
   `tools/tg-preview/lib.test.mjs` one (~line 302), in the same voice, naming
   `tools/artwork/lib.test.mjs` as a separate `node --test` suite run as its
   own step in `npm run check`, listing what it covers (normalisation,
   indexing, destination resolution, shared-asset grouping, collision and
   duplicate detection, stub-URL derivation, stale-set algebra) and saying
   that `run.mjs` is deliberately outside it because its honest proof is the
   filesystem and the encoder - the same argument the tg-preview paragraph
   already makes for `client.mjs` and `live.mjs`. Link `docs/artwork.md`.
9. `.claude/README.md`: a short "Artwork tooling" note - what `tools/artwork/`
   is, why it is a sibling npm project rather than a root dependency (zero CI
   cost; root `npm ci` untouched), and that no skill was created for it, with
   the reason, so the question is not reopened. In the same commit, amend the
   candidate-39 row to record that
   `issues/dh-image-polish/refresh_artwork.py` was superseded by
   `tools/artwork/` - the row keeps the historical example it cites rather
   than losing it.
10. Delete `issues/dh-image-polish/refresh_artwork.py`. Leave that directory's
    `context.md`, `plan.md` and `handoff.md` alone; they are evidence, and
    `bash-guard.mjs` rule 40 guards a cited `plan.md`.

**Acceptance criteria** - each is its own line on purpose, including the
inherited items:

- `node --test tools/artwork/lib.test.mjs` passes, and is a step in the root
  `check` script.
- One foreground `npm run check` passes with that step in it.
- Root `package.json` gains that step and **no dependency**.
- `tools/artwork/lib.mjs` contains no `sharp` and no `node:fs` import; only
  `run.mjs` imports either.
- `node tools/artwork/run.mjs verify-previews` runs to completion on a machine
  where `tools/artwork/node_modules/` does not exist.
- A `plan` run against a scratch fixture directory reproduces the shared-asset
  case: one accepted artwork, one asset pair, four record links, and the pair's
  `jpeg` is the anchor's `.jpg` - no `og/<other-record-id>.jpg` appears
  anywhere in the output.
- `docs/artwork.md` exists and carries the drop-is-the-ledger precondition as
  three runnable checks.
- The conversion settings appear in `docs/artwork.md` and **nowhere else** in
  the repository outside `issues/` - grep for `640x640` and for the quality
  numbers to confirm. (`refresh-artwork.prompt.md` still holds its copy until
  B3; record that as the one known remaining duplicate, so B3's acceptance
  line has something to close.)
- `docs/specs/CONTRACTS.md` section 5 names the asset id and the sharing rule
  in both directions.
- `docs/specs/COVERAGE.md` documents the new `node --test` suite beside the
  tg-preview one.
- `issues/dh-image-polish/refresh_artwork.py` is deleted, and
  `.claude/README.md`'s candidate-39 row is amended in the same commit.
- `.claude/README.md` carries the artwork-tooling note including the no-skill
  reason.
- No new file under `.claude/skills/`.
- No `img/`, `og/`, `i/`, `data.js`, `app/` or `dist/` file changes in this
  batch; `git status --porcelain` shows nothing under those paths.
- `tools/tg-preview/state.json` is unchanged and unstaged.
- `tools/artwork/node_modules/` is not tracked.
- No model routing appears in any file this batch touches.

**Verification commands.**

```text
cd tools/artwork && npm install && cd ../..      # once, to produce the lockfile
node --test tools/artwork/lib.test.mjs
node --test tools/tg-preview/lib.test.mjs
node tools/artwork/run.mjs plan --uploads <scratchpad>/fixture-art
set -o pipefail; npm run check 2>&1 | tail -n 120   # one foreground call, Bash timeout 600000
git status --porcelain
```

`npm run check:built` is **not** required: no file this batch touches alters
what a screen draws (5, "check:built").

**Risks / do-nots.**

- Do not run `install` or `verify` against the repository's own `img/` and
  `og/` to "test" the tool. Copy a handful of assets into the session
  scratchpad and point `--repo` at a scratch tree. A real install here would
  rewrite committed bytes with a different encoder's output for no reason.
- Do not make `verify` walk the whole `img/` tree (3.1, determinism).
- Do not let `lib.mjs` touch the filesystem, the network or `sharp`.
- Do not add a root `npm run` target for the tool.
- Do not reformat anything under `tools/` or `tests/`: both are
  prettier-ignored and eslint-ignored, so a stray reformat produces a large
  diff no gate asked for. Match the neighbouring file's style by hand.
- Never invoke `tools/tg-preview/run.mjs` without `--dry-run`.
- Do not touch `.claude/hooks/**` - a peer session owns it.
- Do not edit either prompt or `tests/dataint.js`; those are B3.
- If `sharp` will not install, stop and record it - do not switch toolchains.
  See the fallback below.

**Fallback.** If `sharp`'s prebuilt binary does not resolve on the owner's
Windows host, the batch still has most of its value: land `lib.mjs`,
`lib.test.mjs`, the `plan` and `verify-previews` verbs, the `check` step and
every documentation change, and defer `install`/`verify` with a named note in
the handoff. Those two verbs need no encoder at all. Record the exact
`npm install` failure; do not silently reach for Python or a second toolchain
(3.5).

---

### 5.3 B3 - The ingest verb, both prompts, and the runbook's second half (implement-ready)

**Objective.** Make the same tool serve a **new-source ingest**, close the one
missing repository invariant that the ingest path can violate, and leave both
prompts citing one runbook instead of carrying two copies of a procedure.

**In scope.** `planIngest` and the `ingest` verb; the `og/` orphan check in
`tests/dataint.js`; `docs/artwork.md`'s ingest section; the art edits to
`add-source.prompt.md` (3.8); the Phase 4/5 slimming of
`refresh-artwork.prompt.md` (3.2); the agent descriptions if they promise a
procedure the prompts no longer carry.

**Out of scope.** Any change to `data.js`, `img/`, `og/` or `i/` - this batch
adds the capability, it does not perform an ingest. Moving `tests/dataint.js`
into `npm run check` (section 8). `app/`, `dist/`. `.claude/hooks/**`.

**Constraints that are already settled - do not reopen.** The tool validates
the agent's `img` declaration; it does not choose asset ids or infer sharing
(3.5, 3.6). Sharing is legal only inside one `eq.line`, and that is already
enforced by `tests/dataint.js` (3.4). `img: ''` is legal. The prompts cite,
they do not inline (3.8).

**Files to edit.**

- `tools/artwork/lib.mjs`
- `tools/artwork/lib.test.mjs`
- `tools/artwork/run.mjs`
- `tests/dataint.js`
- `docs/artwork.md`
- `docs/specs/COVERAGE.md` - extend B2's paragraph with the ingest cases
- `.claude/prompts/add-source.prompt.md`
- `.claude/prompts/refresh-artwork.prompt.md`
- `.claude/agents/add-source.md` and `.claude/agents/refresh-artwork.md`, only
  if their `description` promises something the slimmed prompts no longer do

**Ordered steps.**

1. `tools/artwork/lib.mjs`: add `planIngest({ sources, records, missingAssets,
   map })`, pure, returning `{ creates, shares, unarted, unsourced, unmatched,
   ambiguous, duplicateSources, counts }`.
   - `missingAssets` is a set/array of distinct `img` values that `run.mjs`
     found absent from disk. `planIngest` never reads the filesystem and never
     infers which records are new.
   - `creates`: one entry per distinct asset in `missingAssets` that a source
     resolves to - `{ source, sourceSha256, asset, webp, jpeg, recordIds }`,
     where `recordIds` is every record claiming that asset. **Keyed by asset,
     never by record**; this is what makes `og/<new-id>.jpg` unreachable
     (3.4, layer 1).
   - `shares`: records whose `img` is claimed by another record and whose asset
     is **not** in `missingAssets` - `{ recordId, asset, alsoClaimedBy }`, with
     no filenames at all. Normal outcome, reported, not an error.
   - `unarted`: records with a falsy `img`. Normal outcome, reported.
   - `unsourced`: assets in `missingAssets` that no source resolves to. This is
     the blocker an ingest most often hits; it must be listed by asset and by
     the record ids waiting on it.
   - `unmatched`, `ambiguous`, `duplicateSources`: as `planInstall`, reusing
     the same helpers - do not fork the matching code.
   - `counts`: `{ acceptedArtwork, newAssets, recordLinks, shared, unarted }`.
   - Reuse `normalizeName` and `indexRecords` unchanged. Add **no** `byLine`
     index and **no** share map: sharing is read off `data.js`'s `img` values.
2. `tools/artwork/lib.test.mjs`: add ingest cases.
   - The `og/` trap, stated as a test: a fixture with a new record whose `img`
     equals an existing record's `img`, that asset **not** in `missingAssets`
     -> the record appears in `shares`, `creates` is empty, and no string in
     the whole returned object contains `og/<new-record-id>.jpg`.
   - Two new records sharing one new asset with one source -> exactly **one**
     `creates` entry, `recordIds.length === 2`.
   - A record with `img: ''` -> `unarted`, not an error, and no `creates`
     entry.
   - An asset in `missingAssets` with no source -> `unsourced`, naming the
     waiting record ids.
   - A source matching no record -> `unmatched`; a source matching two ->
     `ambiguous`; two sources with one `sha256` -> `duplicateSources`.
   - `map.assign` steers an ingest source the same way it steers a replacement
     source.
   - `counts` on a mixed fixture (one new asset shared by two records, one
     shared-with-existing record, one unarted record) is exact.
3. `tools/artwork/run.mjs`: add the `ingest` verb.
   - Compute `missingAssets`: the distinct `img` values in `data.js` for which
     `img/<value>` does not exist. Call `planIngest`. Print the report; write
     it to `--report <path>` when given.
   - `--dry-run` stops after the report and writes nothing. It still decodes
     every input, because geometry and opacity are hard stops that must be
     provable before any write.
   - Hard stops, loud, before any write: `ambiguous`, `collisions`,
     `duplicateSources` non-empty; a non-square input; an alpha channel that is
     not fully opaque; and - **the inverted precondition** - a destination
     `img/` or `og/` file that **already exists** (this verb creates; it never
     replaces). `unsourced` and `unarted` are reported and do **not** stop the
     run, because a partially-arted ingest is normal.
   - Install via the same code path `install` already uses: encode to `.tmp`
     siblings, decode-check, rename both only once both verify, re-encode and
     compare bytes. Do not write a second installer.
   - Print the ordering reminder on success: run `node tools/build.js`, then
     `node tests/run-all.js dataint`.
4. `tests/dataint.js`: add the `og/` orphan check, immediately after the
   existing `img/` orphan block (~line 167) so the two read as a pair. Mirror
   its shape exactly - same `used` set, same message style, Russian message in
   the file's voice, CommonJS, no reformatting of anything around it. Exempt
   `_share.jpg` and `_none.jpg` by name, as the `img/` check exempts
   `_none.webp`. Measured precondition: 877 `og/*.jpg`, 875 claimed, exactly
   those two exempt, so the check passes on the current tree with no other
   change.
5. `docs/artwork.md`: add the ingest section after the replacement one -
   what `ingest` does, the inverted precondition and why, the three legal
   outcomes (`creates`, `shares`, `unarted`), the `unsourced` blocker, and the
   command sequence in order: declare each new record's `img` in `data.js` ->
   `ingest --dry-run` -> `ingest` -> `node tools/build.js` ->
   `node tests/run-all.js dataint`. State the ordering constraint and its
   reason (the orphan check) in one sentence. Do **not** restate the
   conversion settings; the replacement section already carries them once.
6. `.claude/prompts/add-source.prompt.md`: make exactly the four edits in 3.8 -
   the art facts in the "Canonical data source of truth" block, Phase 1 step D,
   Phase 2 step 5, and the gate name in Phase 2 step 10 plus the Done criteria.
   Every one of them cites `docs/artwork.md`. Add no settings, no dimensions,
   no encoder flags, no ledger procedure.
7. `.claude/prompts/refresh-artwork.prompt.md`: apply the 3.2 table. Phases 4
   and 5 name `tools/artwork/run.mjs`'s verbs and link `docs/artwork.md`
   instead of restating settings. The Phase 1 stop survives **verbatim** and
   cites the drop-is-the-ledger exception by name with a link to the runbook.
   The Phase 5 gate list keeps `node tests/run-all.js dataint,noart` and the
   `npm run check` / `check:built` requirement for a real artwork change.
8. `docs/specs/COVERAGE.md`: extend B2's `tools/artwork/lib.test.mjs`
   paragraph with the ingest planner's cases, in the same voice, naming the
   `og/`-trap case explicitly. Add one clause to whatever sentence covers
   `tests/dataint.js`, if there is one, for the new `og/` orphan check; if
   there is none, do not invent a new section.
9. `.claude/agents/{add-source,refresh-artwork}.md`: read both descriptions.
   Edit only if one now promises a procedure its prompt no longer carries.
   Change no `model:` line and add no routing.

**Acceptance criteria** - each is its own line, including the items this batch
inherited from B2:

- `node --test tools/artwork/lib.test.mjs` passes, with the ingest cases added.
- `node tests/run-all.js dataint` passes with the new `og/` orphan check on the
  unchanged tree.
- One foreground `npm run check` passes.
- A deliberate negative test, run by hand and recorded in the handoff: create
  a scratch `og/<unused-id>.jpg`, confirm `node tests/run-all.js dataint`
  fails naming it, delete it, confirm the suite passes again. The check is
  worthless if nobody proved it fires.
- `planIngest`'s `shares` entries contain no filename, and the `og/`-trap test
  asserts that no `og/<new-record-id>.jpg` string appears in its output.
- The `ingest` verb refuses when a destination already exists, and the refusal
  names the existing file.
- `ingest` does **not** stop on `unsourced` or `unarted`; both are reported.
- `run.mjs` contains exactly one installer code path, shared by `install` and
  `ingest` - `grep` for the temp-sibling rename and find one implementation.
- `add-source.prompt.md` cites `docs/artwork.md` and contains **no** conversion
  setting, dimension or encoder flag.
- `add-source.prompt.md` names `node tests/run-all.js dataint` as the art gate,
  in Phase 2 and in the Done criteria.
- `add-source.prompt.md` states the asset-id rule, the sharing rule and the
  `img: ''` outcome.
- `refresh-artwork.prompt.md`'s Phase 1 stop survives verbatim and cites the
  drop-is-the-ledger exception by name.
- The conversion-settings list appears in **exactly one place in the
  repository** outside `issues/` - `docs/artwork.md`. This closes the known
  duplicate B2's acceptance criteria recorded.
- `docs/specs/COVERAGE.md` covers the ingest cases.
- No new file under `.claude/skills/`.
- No model routing appears in any file this batch touches; no `model:` line
  changes.
- No `img/`, `og/`, `i/`, `data.js`, `app/` or `dist/` file changes in this
  batch (the negative test's scratch file is created and deleted within the
  verification, never committed).
- `tools/tg-preview/state.json` is unchanged and unstaged.
- `.claude/hooks/**` is untouched.

**Verification commands.**

```text
node --test tools/artwork/lib.test.mjs
node tests/run-all.js dataint
node tools/artwork/run.mjs ingest --uploads <scratchpad>/fixture-new --dry-run
set -o pipefail; npm run check 2>&1 | tail -n 120   # one foreground call, Bash timeout 600000
git status --porcelain
```

`npm run check:built` is **not** required: this batch touches
`tools/artwork/**`, `tests/dataint.js`, `docs/**` and `.claude/prompts/**`,
none of which alters what a screen draws (5, "check:built").

**Risks / do-nots.**

- Do not perform an actual ingest to exercise the verb. Build a scratch tree
  with a copied `data.js` and a scratch `img/`; the repository's own art is
  never the fixture.
- Do not reformat `tests/dataint.js`. It is CommonJS, prettier-ignored and
  eslint-ignored, with Russian assertion messages; match its neighbours
  exactly and keep the diff to the added block.
- Do not add `tests/dataint.js` to `npm run check` in this batch (section 8).
- Do not add a `share` map, a `--mode` flag or a `byLine` index (3.5).
- Do not let `add-source.prompt.md` grow into a manual (3.8). If an edit makes
  the conversion carryable without opening the runbook, it is wrong.
- Do not touch `.claude/hooks/**`.
- Never invoke `tools/tg-preview/run.mjs` without `--dry-run`.

**Fallback.** If B3 will not close in one pass, stop at the end of step 5 -
the ingest verb exists, is tested, is gated by the new `dataint` check and is
documented - commit that, and take steps 6 to 9 (the two prompts, COVERAGE's
prose and the agent descriptions) as B3b. Do not stop between `planIngest` and
the `ingest` verb; a planner without its caller is what `CLAUDE.md` forbids.

## 6. Contracts and behaviour that must remain stable

- `img/<asset>.webp` and `og/<asset>.jpg` remain the published paths. B2
  clarifies the documentation; it changes no path, no id and no mapping.
- `tests/dataint.js`'s existing invariants are additive-only in B3: the `img/`
  orphan check, the duplicate-bytes check and the one-line sharing rule keep
  their current messages and behaviour.
- `tools/tg-preview/state.json` is CI's file. No batch reads it for anything
  beyond what a dry run already does, and none writes or stages it.
- `previews.yml` is unchanged by every batch. B1's flag is opt-in.
- `data.js` and the derived set (`data.json`, `catalog.csv`, `i/*.html`) are
  untouched throughout. Nothing here is a data change.
- Both agents keep their names and their `model:` lines.

## 7. Risks, assumptions, open questions

- **Assumption**: `sharp` installs on the owner's Windows host. If its
  prebuilt binary does not resolve, B2 falls back as described in 5.2 -
  `lib.mjs`, its suite, `plan` and `verify-previews` need no encoder at all
  and carry most of the value. Record the failure; do not silently switch
  toolchains.
- **Risk**: B2's output bytes differ from the currently committed assets'
  (3.1). Mitigated by scoping verification per run; stated in the runbook so
  the next operation does not read it as a regression.
- **Risk**: the `og/` orphan check is added but never proved to fire. Closed by
  B3's explicit negative test, which is an acceptance line rather than a
  suggestion.
- **Risk**: `add-source.prompt.md` drifts back into a manual over time. The
  guard is B3's acceptance line that the settings appear in exactly one place,
  which a future reviewer can re-run as a grep.
- **Risk**: a peer session or the CI bot moves `main` under this work.
  `origin/main` was re-read by the planner at r2 and is `2ce3b08` / `80809c8`
  / `e2ada3f`; this branch (`tooling/art-refresh`, tip `db52655`) was
  deliberately not rebased onto the peer session's hook fix. Re-read
  `git log --oneline -3 origin/main` before each batch's commit and record the
  base in the handoff.
- **Open**: none that blocks an implementer. The owner-visible calls - build
  the tool, serve both callers from it, one entry point with verbs, no skill,
  add the missing `og/` test - are recorded as decisions in section 3 with
  their reasons. The one judgment a future owner might revisit is whether
  `tests/dataint.js` belongs in `npm run check`; it is recorded in section 8
  rather than taken here, because it changes what every commit in the
  repository gates on and that is not an artwork decision.

## 8. Deferred

- **Moving `node tests/dataint.js` into `npm run check`.** Measured: `check`
  does not run it today; `dataint` is plain Node (no puppeteer), reads
  `data.js` and md5s 876 image files, so the added cost is a second or two on
  a ~165 s check. Doing so would make the `img/` orphan check, the
  duplicate-bytes invariant, the one-line sharing rule and B3's new `og/`
  orphan check unconditional for every commit instead of depending on a
  prompt naming `node tests/run-all.js dataint`. Not taken here because it
  changes a repository-wide gate for every task, and its sibling in the
  documented pair (`noart`) needs puppeteer and cannot follow it. Worth a
  small task of its own.
- A `--stale-list` equivalent on the live path: no caller (3.5).
- Any acceptance-ledger schema: no producer. `--map`'s `assign` key is the
  escape hatch instead (3.5).
- Deleting `issues/dh-image-polish/` outright: its `context.md`, `plan.md` and
  `handoff.md` are still evidence, and `bash-guard.mjs` rule 40 guards a cited
  `plan.md`. Only the stranded `.py` goes, in B2.
