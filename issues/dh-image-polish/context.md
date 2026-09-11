# Daggerheart artwork polish refresh

## Scope

- Approval source: `work/distinctiveness-polish-regeneration-2026-09-11/regeneration-manifest.json`
  in the separate artwork workspace supplied by the user.
- Repository task: replace the existing catalog artwork for all 27 accepted
  manifest entries without changing record data or image mappings.
- Every accepted source is a 1254x1254 opaque RGB PNG and has a unique catalog
  destination.
- Preserve the dirty primary checkout; implement and verify in the
  `automation/dh-image-polish` worktree, then fast-forward `main`.

## Repository contract

- Catalog images are `img/<asset-id>.webp`, 640x640 RGB.
- Social previews are `og/<asset-id>.jpg`, 640x640 RGB progressive JPEG.
- `data.js` and derived data stay unchanged because all mappings are stable.
- WebP encoding: quality 85, maximum Pillow method.
- JPEG encoding: quality 80, progressive, 4:2:0 subsampling.
