# Handoff - TASK readme-screens
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: B1 implemented; the eight images are on disk and untracked (owner rule).
- Last agent: implementer
- NEEDS_HUMAN_CONFIRMATION: yes - the owner looks at the images, then commits them and pushes
- Branch: `claude/readme-screens`
- Pushed: no

## Completed
- Batch name/id: B1
- What shipped: seed user `gm5` (list «Лавка у дороги», players' link `showcase-player`,
  homebrew source with three pictured items) and one seed test; `tools/screens.mjs`,
  `tools/screens.lib.mjs`, `tools/screens.lib.test.mjs`; stage `test:screens` in
  `tools/check/lib.mjs`; `npm run screens`; both READMEs show the four screens;
  COVERAGE.md, `.claude/README.md` "Screenshots", a decision file and its index entry.
- Images (untracked, in `docs/img/screens/`, bytes): `roll-ru.webp` 159092,
  `roll-en.webp` 138884, `table-ru.webp` 112804, `table-en.webp` 103304,
  `list-ru.webp` 160958, `list-en.webp` 142128, `shared-ru.webp` 80086,
  `shared-en.webp` 75634 (total 972890).
- Review: required (a check stage changed); not run.

## Verification
- `node --test tools/screens.lib.test.mjs`: 9 pass. A README reference edited to a wrong
  name made it fail (1 fail), then reverted.
- `npm run screens` twice: the second run printed `unchanged` 8 times.
- `check:fast`, `lint:typed`, `lint:untyped`: see the final report of the batch.
- The `test:screens` stage fails in CI until the images are committed: the test reads
  the files. Commit the images before the push.

## Deviations
- Q1-Q4: took the recommended option each time (owner away).
- `gm5` has no `prefs`: a `lang: 'ru'` row made the `/en/` list open in Russian.
- English shots use the `/en/` path, not `&lang=en` (the query does not set a language).
- Each capture runs in its own browser context (a stored language leaked between shots).
- The homebrew whistle is the second list entry so the first screen shows its picture.
- Images are not committed (owner rule); the README references them already.

## Next batch
- Owner looks at the eight images, commits them, pushes; then CI and the reviewer.

## Blockers
- None.

## Deferred
- A screen of the homebrew editor for a future guide document.
