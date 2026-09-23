# Artwork tooling

`tools/artwork/` converts and installs the catalog's item pictures - the
80% that four artwork operations (`8e7fed1`, `ce0c414`, `37ecc8d`,
`art-to-fix`) each re-derived from prose, one of them leaving a Pillow
script behind in a task directory, since deleted and superseded by this
tool. It is a sibling npm project, modelled on `tools/tg-preview/`: its own
`package.json` and lockfile carry `sharp`, so the root `package.json` gains
no dependency and root `npm ci` never installs an image encoder. It also
makes the 160 px row thumbnails under `img/thumb/` ("Thumbnails", below).
`tools/artwork/run.mjs` imports `sharp` only lazily, so the verbs that need
no encoder still run on a machine where `tools/artwork/node_modules/` does
not exist; `tools/artwork/icons.mjs` ("Icons", below) always needs it.

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
node tools/artwork/run.mjs thumbs          [--repo <dir>] [--dry-run]
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
  input carries a non-fully-opaque alpha channel, or **any of the three
  destinations `img/<asset>.webp`, `img/thumb/<asset>.webp` and
  `og/<asset>.jpg` does not already exist** - this verb replaces, it never
  creates. Past that gate: encodes both formats and the thumbnail,
  decode-checks them, writes each to a `.tmp` sibling and renames it into
  place, then re-encodes from the source a second time and compares all
  three against what was just installed. `--dry-run` stops after the
  refusal checks and geometry/opacity decode, before any write.
- **`verify`** - re-encodes every source in `--uploads` and compares the
  result byte-for-byte against what is currently installed at that pair's
  destination (the WebP, its thumbnail and the JPEG), decode-checking
  format/mode/size on the installed files too.
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
- **`thumbs`** - (re)generates the whole thumbnail set: one
  `img/thumb/<asset>.webp` for every `img/*.webp`, `_none.webp` included.
  It reads the committed 640 px files, not `data.js` and not an upload, and
  writes only `img/thumb/`. A thumbnail whose picture is gone is refused
  (`refused: orphan thumbnail ...`, nothing written); remove it with
  `git rm` - the tool never deletes a committed file. After writing, it
  re-encodes every thumbnail and compares it with the file just written.
  `--dry-run` prints the count and writes nothing.

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
- Thumbnail: the 640 px WebP, resized to 160x160 with a Lanczos filter, WebP
  quality 80, maximum encoder effort, lossy.
- No metadata in the output (EXIF/ICC/XMP stripped).

The thumbnail is made from the 640 px WebP, never from the upload, so
`thumbs` reproduces from the committed file the exact bytes `install` and
`ingest` wrote (on the same encoder build), and `verify` checks it against
the WebP it re-encodes. The cost is two lossy passes; at a 4x downscale the
first pass's artefacts do not survive.

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
destination `img/<asset>.webp`, `img/thumb/<asset>.webp` or
`og/<asset>.jpg` **already exists** -
writing over it would silently destroy another record's art. This is the
same existence check as `install`'s, with the sense flipped.

**Three legal outcomes**, all reported, none of them an error on their own:

- **`creates`** - a source resolves to an asset that is missing from disk.
  Keyed by distinct asset, never by record, exactly like `install`'s `pairs`
  - two brand-new records sharing one not-yet-installed asset still produce
  one set of three files. This is what makes `og/<new-record-id>.jpg` structurally
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

**The drop.** `--uploads` is a scratch directory that holds image files
only. A delivery folder also carries the draft data, notes, backups and the
book; copy the pictures out of it. Before any other step, count the files
against the records they are for: a delivery note's count is a claim (one
said 142 for a 132-file folder). Deliveries arrive incomplete and are
refilled mid-task, so measure again immediately before `ingest`, never from
a figure taken at planning time.

**No renaming pass.** `normalizeName` already folds the typographic
apostrophes (U+2018, U+2019, U+02BC, U+2032) and strips a trailing
` v<N>` suffix, so a drop named `<Name> v<N>.png` matches its record as
delivered. Use `--map`'s `assign` only for a name that `plan` still lists
as unmatched.

**`unarted` is a normal outcome.** Name each unarted record in the
handoff; the record ships with `img: ''` and renders `_none.webp` until its
art arrives.

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

## Thumbnails

Rows draw `img/thumb/<asset>.webp` (`docs/specs/FEATURES.md`, "Records").
The set is committed, not built: CI builds from the commit, and root
`npm ci` carries no encoder. Measured 2026-09-23 on this host: 1057
thumbnails, 2,361,628 bytes in total, a mean of 2,234 bytes, against a
mean of about 34 KB for a 640 px picture; `thumbs` wrote the set in about
60 s. A row draws its picture at 60 CSS px and the lists index strip at
40, so 160 px is sharp up to a pixel ratio of 2.67 and 4; at 3 a row
upsamples by 1.125, which the owner accepted with the size. `install` and
`ingest` keep the set complete; `tests/dataint.js` fails on a missing,
orphan or non-160x160 thumbnail.

## Icons

The installable app's icons (`docs/specs/META.md` section 9) are not item
art, but they use the same encoder. `app/public/icons/icon.svg` is the
source (a flat key, which the owner chose over an artwork-style render on
2026-09-23); the four PNGs beside it are committed build inputs, like
`card/*.svg`. After an edit to the SVG, run the one-time setup above, then:

```text
node tools/artwork/icons.mjs
```

Expected result: one line per file - `icon-192.png`, `icon-512.png`,
`maskable-512.png` and `apple-touch-icon.png` (180x180) with its byte size.
The SVG renders at 384 dpi and each size is a Lanczos downsample to PNG. The
drawing must stay inside the maskable safe zone, a centred circle of radius
40% of the side (204.8 units of the 512 viewBox), because the maskable icon
is the same drawing. Commit the SVG and the four PNGs
together.

## Risks

- Never run `install`, `ingest` or `verify` against this repository's own
  `img/` and `og/` to "try the tool out." Point `--repo` at a scratch tree.
  `sharp`'s output differs from the currently committed Pillow-encoded bytes
  (see above); a real run here would rewrite or create committed assets for
  no reason.
- `thumbs` is the one verb that runs against this repository's own `img/`,
  because it writes only `img/thumb/` from the committed files. Run it when
  the set is missing or the thumbnail settings change, never "to try it":
  another encoder build rewrites every file. Commit the whole set.
- A picture replaced outside `install` or `ingest` (a hand copy, another
  tool) keeps its old thumbnail, and no gate sees it: `tests/dataint.js`
  checks only that each thumbnail exists, has a picture and is 160x160,
  because root `npm ci` carries no encoder to compare pixels. Change a
  picture only through `install` or `ingest`, which write the thumbnail
  from the new WebP.
- `plan` and `verify-previews` need no encoder; `install`, `ingest`,
  `verify` and `thumbs` do. If `tools/artwork/npm ci` cannot resolve `sharp`'s prebuilt
  binary on a given machine, the first two verbs are still useful there.
- `og/` is not derived from `img/`: `tools/artwork/run.mjs`'s `encodePair`
  writes the WebP and the JPEG as siblings from one original delivery
  buffer, and `verify` re-encodes from that same original; the originals
  live in untracked drop directories, so neither folder is recoverable from
  the other or from the repository - why both stay tracked whatever the
  generated-artefact policy elsewhere says.
