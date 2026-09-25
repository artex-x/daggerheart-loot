# 2026-09-23 - Row-sized art draws a committed 160 px `img/thumb/` derivative

- Task: `69`; the owner chose 160 px and this task on 2026-09-23.
- Decision: rows (tables, search, shared lists, list pages) and the lists
  index strip draw `img/thumb/<asset>.webp`, 160x160, WebP quality 80, one
  per `img/*.webp` including `_none.webp`; tiles, cards, print and
  copy-image keep the 640 px file (`docs/specs/FEATURES.md`, "Records").
  The set is committed. `tools/artwork/` makes each thumbnail from the
  640 px WebP as the third file of every `install` and `ingest`; `thumbs`
  regenerates the set and refuses an orphan (`docs/artwork.md`). Measured:
  a mean of 2,234 bytes against about 34 KB for the full picture.
- Rejected: `srcset` - a DPR-3 or DPR-4 phone picks the full file; 320 px -
  three times the bytes for a 60 px row; built in CI - root `npm ci`
  carries no encoder and CI builds from the commit; a top-level `thumb/`
  folder - a new junction, CI copy and worker rule for nothing; the
  thumbnail from the upload - a second resize pipeline, and `thumbs` could
  not reproduce what `install` wrote.
