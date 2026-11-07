# Shared task context - TASK readme-screens

## Goal
- Add plain app screenshots to `README.md` and `README.ru.md`, made by one
  command, so the images regenerate after a UI change.
- Promotional banners stay out of the repository.

## Source of the task
- No GitHub issue. The owner asked for it in a session on 2026-11-07.
- A previous session made promo screenshots with ad hoc Puppeteer scripts in a
  scratch folder (not in the repository). Its findings are below.
- Task id `readme-screens`, confirmed by the owner on 2026-11-07, with the
  recommended answers to plan.md Q2-Q4.

## Facts found (2026-11-07, at `62070925`)
- Puppeteer `^25.9.0` is a dev dependency. `pixelmatch` and `pngjs` are too.
- `npm run build` writes `dist/` (published). `npm run build:test` writes
  `dist-test/` with the fake cloud on (`vite.config.mts`, `VITE_CLOUD_FAKE`).
- `tests/app/serve.js` exports `serveDist(dir)` and `assertBuilt(dir, label)`.
  `serveDist` compares `file.startsWith(dir + path.sep)`: pass
  `path.resolve(ROOT, 'dist-test')`. A forward-slash `dir` on Windows makes
  every request 404.
- The fake cloud reads `?as=<user>`, `?lang=ru|en`, `?toasts=held` and others
  from the query (`app/src/ports/fake-cloud.ts`, `installFakeCloud`). The query
  stays in the address, so a reload keeps the session.
- Seed: `app/src/ports/fake-cloud-seed.ts`, users `gm1` to `gm4`.
  - `gm1`'s homebrew is `docs/fixtures/homebrew-file/export.json` byte for byte
    (seed comment). The Ember Axe `hb_emberaxeaaaaaaaa` has `art: 'ci1.webp'`,
    the bedroll picture. The other gm1 items have no picture.
  - `gm1`'s list «Лавка кузнеца» (`uuid(101)`) has `w51` at `gold: 99999`. Its
    player share token is `player-token-1`.
  - `art` is a catalog basename only: the test build has no bucket.
  - Many unit tests read `SEED.users.gm1`, `SEED.lists.gm1`,
    `SEED.homebrew.gm1` directly, and the goldens open `gm1`/`gm2`/`gm4`.
  - `fake-cloud.test.ts` asserts over `Object.values(SEED.lists)` and
    `Object.values(SEED.homebrew)`: a new user must satisfy those invariants.
- The app is dark only: `color-scheme: dark` in `app/index.html` and
  `tokens.css`. There is no theme to choose.
- Core rules roll input: 1-60 or Nd12 (`docs/specs/FEATURES.md`, "Rolling").
  «Настроить» / "Set up" opens the manual entry.
- No README has an image today. `tests/derived.js` reads both READMEs (counts,
  license paragraph).
- `tools/**` is outside the vitest coverage gate. A new `tools/` file gets its
  pure half a `node --test` suite wired into `npm run check` and a paragraph in
  `docs/specs/COVERAGE.md` (COVERAGE.md, known gaps, the `tools/**` bullet).
  The `node --test` stages are listed in `tools/check/lib.mjs`.

## Key paths
- Seed: `app/src/ports/fake-cloud-seed.ts`, its tests `app/src/ports/fake-cloud.test.ts`.
- Server: `tests/app/serve.js`.
- Check stages: `tools/check/lib.mjs`.
- Specs: `docs/specs/COVERAGE.md` ("Test layers", known gaps), `docs/specs/META.md` (HTTP-only build).
- Prior art for a capture tool: `tools/capture-share-fixture.mjs`.

## Command costs

| Command | Wall clock | Fits one call? |
|---|---|---|
| `npm run check:fast` | 215-840 s; a seed change reaches the fake-cloud and component suites, plan for 500-700 s | yes, with timeout 600000; past 600 s it runs on in the background |
| `npm run check:built` | 19-23 s | yes |
| `npm run build` + `npm run build:test` | about 20 s together | yes |
| `npm run screens` (new) | estimate 60-120 s: two builds and 8 captures | yes |
| a CI run | about 15 min | remote, CI credit |

## Constraints
- Contracts: no route, id, link or generated data changes. `docs/img/` is not a
  frozen asset path and is not published (Pages publishes `dist/`).
- RU/EN parity: each README shows the screens in its own language.
- No promotional banners, captions with marketing text, or device frames.

## Do not re-fetch unless
- The owner gives new information.
- This file lacks a fact you need.
- The seed or the server changed after `62070925`.
