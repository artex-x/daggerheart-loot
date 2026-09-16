# Handoff - TASK art-to-fix

## Completeness verdict

**Complete.** All 65 files in `UPLOAD_DIR` (`C:/Users/Ignat/Downloads/To fix`)
were the accepted set (drop-is-the-ledger, per context.md); every one matched
exactly one catalog record by name after the orchestrator's normalization
(strip trailing ` v<N>`, NFC, apostrophe/whitespace fold), 0 unmatched, 0
duplicate byte sources across different filenames. `ALLOWED_EXCLUSIONS` was
none and none were taken. Every source decoded cleanly as square opaque
RGB - no crop/pad/regeneration exception was needed (the converter aborts
loudly on a non-square input or non-fully-opaque alpha; neither path fired
for any of the 65).

## Counts

- Accepted artwork: **65**
- Unique destination asset-pair count (`img/<x>.webp` + `og/<x>.jpg`): **65**
- Catalog record-link count: **68** (65 + 3 extra from the one shared-art
  case)
- Shared case: `Advanced Wand v1.png` name-matches record `q138` ("Advanced
  Wand"), whose `img` is `q24.webp` - a field already shared by `q24`, `q70`,
  `q138`, `q205` in `data.js` before this task touched anything. One byte
  source was installed once, at `img/q24.webp` + `og/q24.jpg`; it was never
  fanned out, and `img/q138.webp`, `og/q138.jpg`, `og/q70.jpg`, `og/q205.jpg`
  do not exist and were not created (confirmed by `ls`, all four missing,
  after install).

## Conversion settings (Phase 4)

Installed into the session scratchpad (`art-venv`, a Python 3.14 venv with
Pillow 12.3.0), `convert.py`:

- `ImageOps.exif_transpose` applied
- alpha flattened only when fully opaque (`extrema == (255, 255)`); otherwise
  the script raises rather than blending - never triggered here, all 65
  sources are already RGB with no alpha channel
- resize to 640x640 with `Image.LANCZOS`
- WebP: quality 85, `method=6` (max encoder effort), `lossless=False`
- JPEG: quality 80, `progressive=True`, `subsampling=2` (4:2:0), `optimize=True`
- no EXIF/metadata written (Pillow omits it by default here; confirmed
  `im.info.get('exif') is None` on a sample output)
- writes `<dest>.tmp` siblings, install script only renames them onto the
  real destination after both temp files exist

Determinism: converting `Advanced Wand v1.png` twice into independent temp
files produced byte-identical sha256 for both the WebP and the JPEG output.

## Deterministic verification (Phase 5.1/5.2)

Re-encoded all 65 sources independently (fresh temp dir, same `convert.py`,
same args) after installing, and compared sha256 against the installed
`img/*.webp` and `og/*.jpg`: **0 mismatches across 65 pairs (130 files)**.
Decoded all 130 installed files: **0 decode failures** - every one is
WEBP/JPEG respectively, mode RGB, size 640x640.

## Repository contract preserved

- `data.js` untouched. `npm run data` (`node tools/build.js`) ran twice as
  part of the gates below (`npm run check`, then again inside
  `npm run check:built`'s `npm run build`); both runs produced **zero diff**
  against the committed `data.json`, `catalog.csv`, and `i/*.html` - the
  `img` mapping is unchanged, confirming this was a byte-only replacement.
- `git status` after staging shows exactly 130 changed paths (65 `img/*.webp`
  M, 65 `og/*.jpg` M) plus the pre-existing untracked `issues/art-to-fix/`.
  Nothing else in the tree moved.

## The tg-preview proof

Baseline (before installing anything):
`node tools/tg-preview/run.mjs --dry-run --no-verify` -> **125 urls stale**.
(`--no-verify` skips only the live-HTTP liveness probe against the deployed
site - not Telegram - and does not affect the stale count: `pending`/`todo`
in a dry run is `stale(manifest, state, mode)` regardless of verify's
outcome.) Cross-checked with a read-only scratchpad script
(`stale-list.mjs`) that calls the same `buildFromTree()` + `stale()` against
the committed `tools/tg-preview/state.json`: same 125, full URL list
captured to `baseline-stale.json`.

After installing all 65 assets: same commands -> **192 urls stale**
(`after-stale.json`). Delta = **67 newly-stale URLs**.

Set-membership check (not just the count):
- Expected affected set = 68 URLs: `i/<id>.html` for all record ids sharing
  a destination image with one of the 65 sources, computed by expanding each
  name-matched record's `img` field to every record sharing that `img`
  (`mapfull.json`) - this is exactly the 65 plus `q70`, `q138`, `q205` riding
  `q24.jpg`.
- One of those 68, `i/f25.html`, was **already stale in the baseline** (for
  an unrelated reason - some existing text/tag drift, not this delivery).
- `newlyStale` (67) == `expectedAffected` (68) minus `alreadyStale` (1),
  **exactly**: 0 missing, 0 extra.
- `after` == `before` UNION `expectedAffected`, **exactly** (verified by set
  equality, not eyeballed).
- No URL disappeared from the baseline's stale set (`disappeared: 0`).
- The root URL's stale status is unchanged (stale both before and after -
  unrelated to this delivery, no root movement).

This is the tool working exactly as designed: the shared `q24.jpg` fingerprint
folds in `sha256(image bytes)`, so one byte-swap under the unchanged
`q24.jpg` address correctly marked all four dependent stub URLs
(`q24`, `q70`, `q138`, `q205`) stale, and nothing else moved.

`tools/tg-preview/run.mjs` was never invoked without `--dry-run`. No
Telegram contact of any kind. `.env` was not read, printed, or copied by
this task (the CLI's own `process.loadEnvFile('.env')` call is pre-existing
code, not something this task added or inspected, and it is never reached
by the client in a dry run - `client()` is only called past the `dryRun`
branch in `lib.mjs`'s `runRefresh`). `tools/tg-preview/state.json` was only
read, never written, edited, or staged.

## Commands and results

```
node tests/run-all.js dataint,noart
  ok  dataint   инварианты data.js       1.3s
  ok  noart     записи без картинки      5.0s

npm run check
  (format:check, lint, typecheck, check-site, npm run data [no-op diff],
  tests/derived.js, tests/i18n.js, .claude/hooks/selftest.mjs,
  node --test tools/tg-preview/lib.test.mjs [96/96 pass, incl. runRefresh],
  npm run test / vitest [1035/1035 pass, 42 files])
  -> full chain completed to its last step with no failures; the
  context.md-flagged selftest.mjs #126-#128 failure did not reproduce on
  this Windows worktree (that note traced to a Linux-CI-specific ordering
  issue another session already has a fix in flight for).

npm run check:built
  npm run build (npm run data [no-op diff] + vite build) -> built ok
  npm run smoke -> "the built page opens from a folder"
  npm run budget -> 88.9 kB / 120 kB budget -> within budget
```

## Scratchpad (not part of the repository)

`C:/Users/Ignat/AppData/Local/Temp/claude/E--dev-daggerheart-loot-wt-tg-preview-refresh/5a5a1182-48ce-485f-b7ef-e732cd9e8de9/scratchpad/`:

- `art-venv/` - throwaway Python venv (Pillow 12.3.0), the converter
- `convert.py` - the conversion helper (settings above)
- `map-uploads.mjs`, `map-full.mjs`, `mapping.json`, `mapfull.json` - name
  match + shared-img expansion + hash inventory of the 65 uploads
- `install.mjs`, `install-result.json` - the installer (converts, then
  atomically renames temp siblings onto the real destinations)
- `verify-install.mjs`, `verify-result.json` - Phase 5.1/5.2 byte and decode
  verification
- `stale-list.mjs`, `baseline-stale.json`, `after-stale.json`,
  `expected-affected-urls.json` - the tg-preview before/after proof
- `paths-to-stage.txt` - explicit path list used for `git add`

Nothing here touches `package.json`, `package-lock.json`, or `tools/`.
Pre-existing unrelated scratchpad files from earlier sessions
(`main-checkout-stale-tg-docs/`, `corrupt.json`, `emap.sh`, etc.) were left
untouched.

## Commit

`7672f50cb3e22985e39651ba7645a90c344ef1ea` on `art/to-fix-refresh`, cut from
`origin/main` at `0871b1a` - 132 files (65 `img/*.webp`, 65 `og/*.jpg`, this
handoff, and `context.md`). Not pushed; the owner pushes.

## Next human action

None required for this task's scope. Ordering fact carried over from
context.md: `main`'s `check` run has been failing CI for an unrelated
`.claude/hooks/selftest.mjs` reason (another session's in-flight fix), so
`deploy` has not published `main`, and this branch's artwork will not reach
the live site - or Telegram - until that goes green and a deploy runs.
Once it does, the owner (or the four-hourly cron) can run the real
`tools/tg-preview/run.mjs` (no `--dry-run`) to actually press the 68 affected
URLs (67 newly stale here, plus the pre-existing `f25` entry) through
Telegram; this task deliberately never did that.
