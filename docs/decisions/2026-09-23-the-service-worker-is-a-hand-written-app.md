# 2026-09-23 - The service worker is a hand-written `app/public/sw.js`

- Superseded in part by "Running from a folder and offline use are nice-to-haves" (2026-09-24): the offline shell and the
  one-IIFE rationale; the file, its tests and its lint block stay.
- Task: `69`; on 2026-09-23 the owner chose a minimal worker (offline
  shell, capped picture cache, silent updates).
- Decision: about 140 lines of plain JS with no dependency, copied verbatim
  into `dist/` by Vite's `publicDir`, linted by its own ESLint block and
  tested through `vm` (`tests/sw.test.mjs`). Policy: `docs/specs/META.md`
  section 9.
- Rejected: `vite-plugin-pwa`/workbox - a build dependency of several MB and
  an `npm audit` surface for a file this size, its registration is an ES module
  (forbidden under `file://`), and its default glob would precache the
  `img/` junction; a second Vite entry - Rollup refuses `iife` with two
  inputs; TypeScript in the app project - the `webworker` lib clashes with
  `dom` in one `tsconfig`; a manifest with no worker - an installed app
  that is blank offline; precaching all 34 MB of `img/`.
