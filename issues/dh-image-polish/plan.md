# Plan

- [x] Validate the complete accepted manifest, source hashes, raster dimensions,
      opacity, and repository mappings.
- [x] Convert and atomically replace the 27 existing WebP/JPEG asset pairs.
- [x] Re-encode from the accepted sources and require exact byte equality.
- [x] Run focused data/image checks, the full repository check, and
      `check:built` because artwork changes rendered screens.
- [x] Review the diff, record the final handoff, commit the task branch, and
      fast-forward `main` without touching unrelated local files.
