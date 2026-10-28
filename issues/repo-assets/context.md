# Shared task context - TASK repo-assets

Orchestrator (or first worker) maintains this file so later steps do not re-fetch the same sources.

## Goal
- Keep generated files out of git where the build can make them, and do the
  related repository clean-up in the same release (owner, 2026-10-28).
- Planned after `cloudflare-pages` lands (owner, 2026-10-28: "your
  recommendation sounds good, if we need to do some additional related
  cleanup let's plan to the same release"). Not started; this directory
  stays until the task ships.

## GitHub issue (if any)
- URL: none (local task id).
- Captured or last verified: 2026-10-28, `origin/main` `0b73fd5c`.
- Summary (facts only), tracked files on 2026-10-28:
  - `img/*.webp` 2386 files: converted by the artwork pipeline from art
    sources outside the repository (`refresh-artwork`); not rebuildable
    from the repository.
  - `og/<id>.jpg` about 1193 files: same pipeline. Candidate: derive from
    `img/` at build; whether a re-encode from WebP keeps quality is not
    measured.
  - `og/_share.jpg`, `og/_share_en.jpg`: rendered by
    `tools/artwork/cards.mjs` (`--check` compares). Candidate: render at
    build.
  - `card/*.svg` 36 files: Figma exports (print design); sources, stay.
  - `data.json`, `catalog.csv`: generated from `data.js`, tracked by a
    recorded decision (`docs/specs/CONTRACTS.md` section 4, "stay tracked
    in git", three reopen triggers; 433 KB of packed history). The task
    reopens that decision.
  - Already untracked, built at deploy: `i/*.html`, `i/en/*.html`,
    `en/index.html`, `names.json`, `catalog-index.csv`, `dist/`.
- Decisions already settled:
  - Not part of `cloudflare-pages` (CF1 stays a host move only).
  - `img/` and `card/` are sources and stay in git; moving binaries to Git
    LFS or a bucket is not in scope (a new storage piece, owner policy).
  - Related clean-up found while planning goes into this same release.
- Open questions: for the planner, after CF1 lands (the deploy pipeline
  changes there).

## Key paths
- Specs: `docs/specs/CONTRACTS.md` sections 4 and 5, `META.md`,
  `.claude/README.md` (artwork, deploy), `CLAUDE.md` "Data and published
  artefacts".
- Code: `tools/build.js`, `tools/build-share-pages.js`, `tools/artwork/`,
  `.github/workflows/ci.yml` (`deploy`), `tests/derived.js`,
  `app/src/lib/*.test.ts` (read `data.json` off disk), `.gitignore`.

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
- You suspect drift vs issue or plan
