# Handoff

## Result

- Approval manifest: complete, with 27 accepted artworks and no remainder.
- Allowed exclusions: none.
- Source validation: 27 unique SHA-256 hashes; every file decoded as a
  1254x1254 opaque RGB PNG. No missing, corrupt, transparent, non-square, or
  duplicate-byte inputs were found.
- Mapping: 27 accepted artworks -> 27 unique existing asset pairs -> 27 catalog
  record links. No shared destination or filename/version conflict was found.
- Installed output: 27 `img/*.webp` and 27 `og/*.jpg` files. `data.js`, derived
  data, record mappings, public asset IDs, and HTML stubs are unchanged.
- Encoding: 640x640 RGB; WebP quality 85/method 6; JPEG quality 80,
  progressive, 4:2:0 subsampling; EXIF orientation applied and metadata
  omitted.
- Determinism: every installed file exactly matched a second encode from its
  accepted PNG source.
- Optional local reference-cache refresh: not requested; the artwork workspace
  manifest already records successful collision-library registration for all
  27 accepted files.

## Checks

- `node tests/run-all.js dataint,noart` - passed (`dataint`, `noart`).
- `npm run check` - passed: formatting, lint, Svelte diagnostics, derived data,
  translations, 292 hook self-tests, and 921 unit tests.
- `npm run check:built` - passed: production build, file-URL smoke test, and
  bundle budget.

The first full-check attempt used a junction to the primary checkout's
`node_modules` and stopped at Svelte diagnostics because Vite could not write
its `.vite-temp` directory through that read-only junction. Replacing the
junction with a private dependency copy inside this worktree resolved the
environment issue; no production or asset fix was required.

## Repository state

This change is ready to commit and fast-forward to the primary `main` checkout.
No repository work remains afterward. The repository owner may push `main` when
ready; the primary checkout's pre-existing untracked
`.claude/settings.local.json` must remain untouched.
