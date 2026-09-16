# Shared task context - TASK art-to-fix

Orchestrator maintains this file so later steps do not re-measure the same
things. Read this before acting.

## Goal

The owner delivered replacement artwork for 65 existing catalog items and
asked for two things in one request:

1. Install the new art (this is an **artwork refresh**, not content ingest -
   no record, id, text, mechanic or `img` mapping changes).
2. **Confirm the Telegram preview refresh flow handles exactly this case** -
   image bytes changing under an unchanged `og:image` URL. That is the root
   cause `tools/tg-preview/` was built for, so this delivery is its first
   real regression test.

## Inputs

- `UPLOAD_DIR`: `C:/Users/Ignat/Downloads/To fix` (owner's drop, 65 `.png`).
- `APPROVED_SOURCE`: **the drop itself.** Each catalog item appears exactly
  once, with a single version suffix (`v1`, `v2`, `v4`) that records
  provenance, not a choice. There is no accepted-vs-rejected ambiguity to
  resolve, so the usual "a directory of images is not an acceptance ledger"
  stop does not apply here. Verified by the orchestrator: 65 files, 65
  distinct names, no name appearing twice at two versions.
- `ALLOWED_EXCLUSIONS`: none. The drop is the whole scope.
- `SKILL_ROOT`: not requested.

## Measured by the orchestrator, 2026-09-16 (do not re-measure)

| Fact | Value |
|---|---|
| Files in `UPLOAD_DIR` | **65**, all `.png` |
| Geometry / colour | **all 65 are 1254x1254, PNG colour type 2 (RGB, no alpha), 8 bit**. Square, opaque, uniform - no crop/pad/regeneration exception is needed |
| Name -> record match | **65 of 65 matched, 0 unmatched**, against `everything(window.LOOT)` (1091 records) by English name after NFC + apostrophe + whitespace normalisation, stripping the trailing ` v<N>` |
| Records per name | **1:1** - no delivered name resolves to more than one record |
| Shared destination art | **one case**: `Advanced Wand v1.png` -> `q24.webp`, which records **q24, q70, q138, q205** all reference. Installing it changes the catalog art of four records |
| Destination pairs | 65 unique `img/<asset>.webp` + `og/<asset>.jpg` pairs; **68 catalog record links** (65 + the three extra Advanced Wand records) |
| `og/` naming | named after the **asset**, not the record: `i/q138.html`, `i/q24.html` and `i/q70.html` all carry `og:image` = `.../og/q24.jpg`. An `og/q138.jpg` does not exist and must not be created |

## Why the tg-preview flow already covers this, and what must be proved

`lib.mjs`'s `fingerprint()` is
`sha256([og:title, og:description, og:image, sha256(image bytes)])` - the
**image bytes are folded in**, precisely so a picture swapped under an
unchanged `og:image` address is caught. `imageName()` resolves the basename
from the stub's own `og:image` tag, so the shared `q24.jpg` correctly makes
**four** stub URLs stale, not one.

So the expected behaviour is already designed. What this task must do is
**demonstrate** it, not assume it:

- before the artwork is installed, `node tools/tg-preview/run.mjs --dry-run`
  reports some baseline stale count;
- after installation, the same command must report that baseline **plus
  exactly the URLs whose bytes moved** - 68 stub URLs for 65 assets, unless
  one of them was already stale;
- the delta must be enumerated and checked against the 68, not eyeballed
  from a count.

Do not run `run.mjs` without `--dry-run`; the live flow is CI's job.

## Repository state at dispatch

- Worktree `E:/dev/daggerheart-loot-wt/tg-preview-refresh`, branch
  **`art/to-fix-refresh`**, cut from `origin/main` at
  **`0871b1a Merge branch 'automation/tg-preview-refresh'`**. Tree clean.
- That merge is what put `tools/tg-preview/`, `.github/workflows/previews.yml`
  and `docs/tg-preview.md` on `main`, together with the owner's completed
  1062-entry `tools/tg-preview/state.json`. `state.json` is now a **tracked**
  file: this task does not edit it - CI does, after deploy.
- `check` on `main` has been red on recent pushes for an unrelated reason
  (`.claude/hooks/selftest.mjs` cases #126-#128, another session's in-flight
  work). Expect that failure and do not adopt it.
- Another session holds uncommitted changes in the **main checkout**
  (`E:/dev/daggerheart-loot`): `.claude/hooks/selftest.mjs` and
  `issues/config-audit/handoff.md`. Do not touch that checkout.

## Constraints

- `CLAUDE.md` governs. Never renumber a shipped record id; never edit a
  generated file as source.
- Image-only byte replacement needs **no** `data.js` edit and **no**
  regeneration of `data.json`, `catalog.csv` or `i/*.html` - every `img`
  mapping is unchanged here. Do not rebuild derived files "to be safe": a
  no-op rebuild is noise in the diff and a non-no-op one means something
  else went wrong.
- Never push; the owner pushes. Never `git add -A`.

## Conversion tooling on this host (measured 2026-09-16)

There is **no image converter available yet**. Measured: no `sharp`, `jimp`,
`canvas` or `imagemin` under `node_modules`; no `magick`, `cwebp` or `ffmpeg`
on `PATH` (`convert` resolves to Windows' own `convert.exe`, the filesystem
tool, not ImageMagick); `python` is 3.14 with `pip` 26.0.1 but **no Pillow**.

So the converter has to be installed, and it must not land in the repository:
`CLAUDE.md` forbids adding a module before something uses it, and
`refresh-artwork.prompt.md` allows a parameterised one-off local helper but a
repository script only when ongoing maintenance justifies it and the owner
asked for that scope - they did not. Install into the **session scratchpad**
(a `venv` with Pillow, or a throwaway npm project with `sharp`), keep the
helper script there too, and leave `package.json`, `package-lock.json` and
`tools/` untouched.

## What CI is doing meanwhile (measured 2026-09-16, after the merge push)

- `check` run `35082420157` on the merge commit `0871b1a`: **failure**, with
  the identical three `.claude/hooks/selftest.mjs` cases (#126-#128) that the
  run before the merge already failed. **Not caused by this work.**
- `previews` run `35082633314` fired on `workflow_run` and **skipped**,
  exactly as designed - it only proceeds when `check` succeeded. The
  four-hourly cron is what will pick the backlog up.
- Because `check` failed, `deploy` did not run, so `main` is **not published**
  right now. Consequence for this task: new artwork committed here will not
  reach the live site, and therefore will not reach Telegram, until `check`
  on `main` goes green again (the other session's hook fix) and `deploy`
  publishes. That is an ordering fact to record, not a thing to fix here.
