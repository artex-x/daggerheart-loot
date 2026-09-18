# Artwork tooling

`tools/artwork/` converts and installs the catalog's item pictures - the
80% that four artwork operations (`8e7fed1`, `ce0c414`, `37ecc8d`,
`art-to-fix`) each re-derived from prose, one of them leaving a Pillow
script behind in a task directory, since deleted and superseded by this
tool. It is a sibling npm project, modelled on `tools/tg-preview/`: its own
`package.json` and lockfile carry `sharp`, so the root `package.json` gains
no dependency and root `npm ci` never installs an image encoder. Only
`tools/artwork/run.mjs` imports `sharp`, and only lazily, so the verbs that
need no encoder still run on a machine where `tools/artwork/node_modules/`
does not exist.

This page covers both callers: the **replacement** path (installing new bytes
over an already-cataloged item's picture) and the **ingest** path (installing
art for a record a source ingest just added). `.claude/prompts/refresh-artwork.prompt.md`
and `.claude/prompts/add-source.prompt.md` are the agent-facing procedures
that cite this page for the command sequence and the settings below; this
page is where those settings live, once.

## One-time setup

```text
cd tools/artwork && npm ci && cd ../..
```

On Windows, `convert` on `PATH` resolves to the OS's own `convert.exe` (the
FAT->NTFS tool), not ImageMagick - a `which convert`/`where convert` probe
is a false positive and proves nothing about an ImageMagick install.

## Verbs

```text
node tools/artwork/run.mjs plan            --uploads <dir> [--repo <dir>] [--map <f>] [--report <f>]
node tools/artwork/run.mjs install         --uploads <dir> [--repo <dir>] [--map <f>] [--report <f>] [--dry-run]
node tools/artwork/run.mjs verify          --uploads <dir> [--repo <dir>] [--map <f>]
node tools/artwork/run.mjs verify-previews --before <f> --after <f> --report <f>
node tools/artwork/run.mjs ingest          --uploads <dir> [--repo <dir>] [--map <f>] [--report <f>] [--dry-run]
```

`--repo <dir>` defaults to the repository root; point it at a scratch tree
when testing the tool itself - **never** at this repository's own `img/`
and `og/` to "try it out" (Risks, below).

- **`plan`** - matches every file in `--uploads` against `data.js`'s records
  by name (falling back to `--map`'s `assign` table, `{ "<source
  filename>": "<record id>" }`, for anything that does not match) and prints
  what it found: how many sources were accepted, how many distinct assets
  they resolve to, how many records are linked (a shared asset's other
  claimants included), and any unmatched name, ambiguous name, two-sources-
  one-asset collision, or duplicate-bytes pair. `--report <path>` writes the
  same result as JSON. **Needs no encoder** - it hashes and matches names,
  it does not decode images - so run it first, cheaply, before `npm ci` in
  `tools/artwork` if you only want the inventory.
- **`install`** - runs `plan`'s matching again, then refuses (prints every
  reason, writes nothing) if any name is ambiguous, any two sources collide
  on one asset, any two sources share bytes, any input is non-square, any
  input carries a non-fully-opaque alpha channel, or **any destination
  `img/<asset>.webp` or `og/<asset>.jpg` does not already exist** - this
  verb replaces, it never creates. Past that gate: encodes both formats,
  writes each to a `.tmp` sibling, decode-checks the temp files, renames
  both into place, then re-encodes from the source a second time and
  compares against what was just installed. `--dry-run` stops after the
  refusal checks and geometry/opacity decode, before any write.
- **`verify`** - re-encodes every source in `--uploads` and compares the
  result byte-for-byte against what is currently installed at that pair's
  destination, decode-checking format/mode/size on the installed file too.
  Scoped to the pairs this source set resolves to, never the whole `img/`
  tree (see "Determinism is per-run" below) - a bare `verify` with no
  `--uploads` is not a full-catalog audit.
- **`verify-previews`** - the before/after preview-staleness proof. Reads
  two `tools/tg-preview --dry-run --stale-list` files and the `--report`
  a `plan` or `install` call wrote (for the `pairs` it resolved), computes
  which stub URLs the change was expected to invalidate, and reports
  `missing` (expected but never went stale - the change did not reach that
  stub) and `extra` (went stale but was not expected) as failures; a
  `disappeared` entry (stale before, not stale after, not expected) is
  reported but is not itself a failure. Exits non-zero unless both `missing`
  and `extra` are empty. Needs no encoder.
- **`ingest`** - the counterpart to `install` for a **new-source ingest**: it
  *creates* art for a record a source ingest just added; it never replaces.
  See "The ingest path" below for what it does and the command sequence.

## The drop-is-the-ledger precondition

A directory full of images is not an acceptance ledger on its own
(`refresh-artwork.prompt.md` Phase 1's stop) - **unless** it is a drop with
exactly one file per item and a `v<N>` suffix that is provenance rather than
a choice. That is true precisely when all three of these hold; run them
before trusting the drop:

1. **One file per item.** `ls <uploads> | wc -l` matches the number of items
   the drop is supposed to cover.
2. **Every name resolves to exactly one record.** `plan`'s `unmatched` and
   `ambiguous` lists are both empty.
3. **No name appears at two versions.** No two files in the drop normalize
   to the same match key (`plan`'s `duplicateSources` catches identical
   bytes; a same-name-different-version collision surfaces as two sources
   resolving to one asset, in `collisions`).

## Conversion settings

Established independently across three refreshes - identical in
`refresh_artwork.py` (the second and third refresh) and `art-to-fix`'s
`convert.py` - and measured byte-deterministic across repeated runs of the
same encoder within one run. Stated **once, here** - nowhere else in the
repository restates these numbers:

- Apply EXIF orientation.
- Flatten alpha only when the input is fully opaque; a non-opaque alpha
  channel is a hard stop, not a silent flatten.
- Resize to 640x640 with a Lanczos filter.
- WebP: quality 85, maximum encoder effort, lossy.
- JPEG: quality 80, progressive, 4:2:0 chroma subsampling, optimized.
- No metadata in the output (EXIF/ICC/XMP stripped).

## Determinism is per-run, not byte-identical with what is committed

`sharp` (libvips) will not reproduce the exact bytes the Pillow encoder that
produced the currently committed assets emitted, and that is expected, not a
regression. The verification that matters is re-encoding a source and
comparing it against what this run just installed from that same source -
self-consistent within the run - never a comparison against a different
encoder's or a different run's output. `verify` is deliberately scoped to
the pairs a given `--uploads` set resolves to, never to the whole `img/`
tree, for the same reason: a whole-tree byte comparison would flag every
asset a Pillow-based refresh ever touched as "wrong."

## The replacement command sequence, end to end

```text
node tools/tg-preview/run.mjs --dry-run --stale-list before.json
node tools/artwork/run.mjs plan    --uploads <drop> --report plan.json
node tools/artwork/run.mjs install --uploads <drop> --report install.json
node tools/tg-preview/run.mjs --dry-run --stale-list after.json
node tools/artwork/run.mjs verify-previews --before before.json --after after.json --report install.json
```

`verify-previews`'s `--report` reads `install.json`'s `pairs` (the same file
`install` just wrote) rather than re-deriving the match a third time, so the
proof is over exactly what was installed.

## The ingest path

`ingest` is the counterpart to `install` for a **new-source ingest**
(`.claude/prompts/add-source.prompt.md`): it installs art for a record a
source ingest just declared, and it never touches an existing asset.

**The inverted precondition.** `install` replaces, so it refuses when a
destination does not already exist. `ingest` creates, so it refuses when a
destination `img/<asset>.webp` or `og/<asset>.jpg` **already exists** -
writing over it would silently destroy another record's art. This is the
same existence check as `install`'s, with the sense flipped.

**Three legal outcomes**, all reported, none of them an error on their own:

- **`creates`** - a source resolves to an asset that is missing from disk.
  Keyed by distinct asset, never by record, exactly like `install`'s `pairs`
  - two brand-new records sharing one not-yet-installed asset still produce
  one file pair. This is what makes `og/<new-record-id>.jpg` structurally
  unreachable: the destination name only ever comes from the asset, never
  from a record id.
- **`shares`** - a source was matched to a record whose asset already exists
  on disk. No new file is needed; the record is joining an already-arted
  line (legal only inside one `eq.line` - `tests/dataint.js` enforces that
  separately). A `shares` entry carries no filenames at all.
- **`unarted`** - a record with `img: ''`. Legal (`record.test.ts` pins the
  `_none.webp` render path); reported so the ingest report is honest about
  which records still need art.

**The blocker an ingest most often hits: `unsourced`.** An asset that is
missing from disk and that no delivered source resolves to, named by asset
and by the record ids waiting on it. Like `unarted`, it does not stop the
run - a partially-arted ingest is normal - but unlike `unarted` it usually
means the ingest is not finished yet.

**Ordering.** A record's `img` value must already be in `data.js` before or
in the same change as running `ingest`, because `ingest` reads `data.js` to
know what to create; running it against files without the records to match
leaves everything `unmatched`. Running `tests/run-all.js dataint` before the
records exist would also fail its new `og/` orphan check on any file
`ingest` had already written. The command sequence, in order:

```text
# 1. declare each new record's img in data.js
node tools/artwork/run.mjs ingest --uploads <drop> --dry-run
node tools/artwork/run.mjs ingest --uploads <drop> --report ingest.json
node tools/build.js
node tests/run-all.js dataint
```

`--dry-run` still decodes every input and runs every hard stop (ambiguous
names, collisions, duplicate bytes, non-square, non-opaque alpha, the
inverted precondition) before writing anything, because geometry and opacity
must be provable before a write, not only before a decision to write.

The conversion settings are exactly `install`'s, above - not restated here.

## Risks

- Never run `install`, `ingest` or `verify` against this repository's own
  `img/` and `og/` to "try the tool out." Point `--repo` at a scratch tree.
  `sharp`'s output differs from the currently committed Pillow-encoded bytes
  (see above); a real run here would rewrite or create committed assets for
  no reason.
- `plan` and `verify-previews` need no encoder; `install`, `ingest` and
  `verify` do. If `tools/artwork/npm ci` cannot resolve `sharp`'s prebuilt
  binary on a given machine, the first two verbs are still useful there.
- `og/` is not derived from `img/`: `tools/artwork/run.mjs`'s `encodePair`
  writes the WebP and the JPEG as siblings from one original delivery
  buffer, and `verify` re-encodes from that same original; the originals
  live in untracked drop directories, so neither folder is recoverable from
  the other or from the repository - why both stay tracked whatever the
  generated-artefact policy elsewhere says.
