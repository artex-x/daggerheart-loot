# Handoff - TASK phase-8
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (B1 implemented and committed; B2-B20 not started)
- Last agent: implementer (2026-09-17)
- NEEDS_HUMAN_CONFIRMATION: yes - eight questions in `plan.md`, "Owner
  decisions" (now answered - see `context.md`, "Settled owner decisions").
  None blocks B2-B7; Q1 shapes B3's `STATE.md` edit and B8; Q2-Q6, Q8 block
  one step each in B8/B10/B13/B14/B20; Q7 is the `CLAUDE.md` rewrite.
- Branch: `main`
- Base / starting commit: `f53f44d`

## Completed
- Batch name/id: B1 - search normalisation (O1 + PF2)
- What shipped: `foldQuery()` in `app/src/lib/search.ts` - case fold, `ё`/`Ё`
  read as `е`, U+2019/U+02BC read as `'` - applied to both the query and the
  catalogue; `hayFor(statLine)` builds a per-record folded haystack (an array
  of folded fields, not one joined string, so it agrees with the field-by-
  field fallback on every query, not just the ones tested) memoised by id, so
  `SearchPage`/`TablesPage` fold the whole catalogue once per language rather
  than once per keystroke (PF2); `matches()`/`search()` take an optional
  `hay` and prefer it when given, falling back to live per-field folding for
  a caller with no index to cache against. One `FEATURES.md` clause.
- Files changed:
  - `app/src/lib/search.ts` - `foldQuery`, `hayFor`, `matches`/`search` gain
    the optional `hay` parameter.
  - `app/src/lib/search.test.ts` - three new tests (yo-folded name, apostrophe
    -folded name, haystack/fallback agreement over the six golden queries)
    plus the `foldQuery`/`hayFor` imports.
  - `app/src/components/SearchPage.svelte` - `query` folds via `foldQuery`
    instead of `.trim().toLowerCase()`; a `hay = $derived(hayFor(statLine))`
    passed into `matches()`. No template change.
  - `app/src/components/TablesPage.svelte` - same shape at both call sites
    (`filtered`'s `matches()` and `altSections`'s `matches()`); one shared
    `hay` derived beside the existing `statLine`. No template change.
  - `docs/specs/FEATURES.md`, "Tables and search" - one bullet stating the
    fold and giving both examples.
- Deviation from the plan's literal wording, and why: `plan.md`/this file's
  own "Next batch" section (below, superseded) described `hayFor`'s cached
  value as one joined-and-folded string per record. Built that way, a query
  could match across a field boundary the field-by-field fallback would never
  cross (e.g. one field ending and the next beginning inside the joining
  space) - the two paths would then disagree on some query nobody happened to
  test, rather than by construction. Implemented instead as an array of
  separately folded fields (`readonly string[]`), checked with `.some()`; the
  agreement test asserts this over six queries but the array shape makes it
  hold for every query, not only those six. Also took the plan's own
  documented fallback: `data.ts`/`Index` is untouched - `hayFor` lives in
  `search.ts` alone, closed over its own `Map`, no `WeakMap<Index, ...>`.
  Each `$derived(hayFor(statLine))` in the two pages is Svelte's own
  memoisation of the reader itself, stable across keystrokes and only
  rebuilt when `app.lang` (or `t`) actually changes - which is what PF2
  asked for. Neither deviation touches a public contract, a rendered string,
  or `data.ts`.
- Commit(s): see below (created after this file's edit, per the tree-key
  rule - `git log -1` after this handoff is written and committed).
- Ranking claim, stated the way the owner framed it: the `ё` half (37 names)
  is low priority to the owner; the apostrophe half (13 names, and it is what
  breaks English search - `soldier's` typed plainly found nothing) is the
  one that matters, and one fix covers both. Not oversold as "the `ё` fix"
  anywhere in the commit message.

## Before/after behaviour

Computed against the real `data.json` (post-build, unchanged by this batch):
a plain-JS replay of the old `has()` (lowercase only) versus the new
`foldQuery`-based one, same records, same two queries.

- **`ё` query** - `плетеная сеть` (typed with plain `е`) against "Плетёная
  Сеть" (`ci8`):
  - Before: 0 hits.
  - After: 1 hit - `ci8`.
- **Apostrophe query** - `keeper's` (typed with a plain `'`) against "Keeper’s
  Staff" (`q80`, stored with U+2019) and three other records that already
  matched on plain text:
  - Before: 3 hits - `hi47`, `cm72`, `voa1_t4i` (not `q80`).
  - After: 4 hits - adds `q80`; the other three are unchanged.

## Verification
- Commands run (exact), in order, each a single foreground call:
  1. `set -o pipefail; npm run check 2>&1 | tail -n 120` - first attempt
     failed at `format:check` (prettier wanted `search.ts`'s new
     `.replace().replace().replace()` chain collapsed onto one line);
     `npx prettier --write` on the five touched files, re-ran `npm run
     check` clean (format, lint, typecheck, `check-site.mjs` syntax check,
     `npm run data`, `tests/derived.js`, hook selftest, the two `tg-preview`/
     `artwork` `node --test` files, `npm run test` - 42 test files, 1056
     tests, coverage green including per-file: `search.ts` is 100/100/100/100
     across statements/branches/functions/lines, confirmed via a scratch
     `--coverage.reporter=json-summary` run, then deleted).
  2. `npm run build` - `node tools/build.js` (regenerates `data.json`,
     `catalog.csv`, `i/`, none of it moved a byte - `git status --porcelain
     -- data.json catalog.csv i/` empty) then `vite build`, clean.
  3. `node tests/app/golden.js --only=search` - "съёмка: 28.5s из 28.8s /
     сравнено состояний: 9 (не полный прогон - --only=search) / структурные
     образцы (dist/): без изменений" - green, no `--update`.
  4. `node tests/app/golden.js --only=searched` - "съёмка: 16.4s из 16.6s /
     сравнено состояний: 3 (не полный прогон - --only=searched) / структурные
     образцы (dist/): без изменений" - green, no `--update`.
  5. `npm run check` re-run once more after writing this handoff file (the
     tree-key gate hashes tracked and untracked non-gitignored files
     including this one, so the edit has to precede the arming run) - see
     the commit's own preceding command in the session log; recorded here so
     a later session does not wonder why `check` ran twice.
- Results: every gate green. No golden moved. `git status --porcelain -uall`
  after all of the above shows only the five intended file edits plus this
  task's own untracked documents and the pre-existing, unrelated `work/`
  scratch and `issues/56/` - nothing else touched.
- Per-file coverage: `search.ts` fully covered (new code exercised by the
  three new tests plus the pre-existing suite); no other file's coverage
  moved (`hayFor`/`foldQuery` are additive, the two `.svelte` call sites
  changed no branch a component test does not already exercise).

## Next batch (implement-ready)
- Name: B2 - hooks and ignore rules (TL1-TL8, H14, DP8/TL7)
- See `plan.md`, "B2 - hooks and ignore rules" for the full step list
  (`.gitignore`/`.claude/.gitignore` entries for `work/` and
  `.claude/worktrees/`, `isExempt` shared between `bash-guard.mjs` and
  `tree-key.mjs`, the `citingLines()` `git show <sha>:` exemption, the
  `restore --worktree` deny, the `rm -r` guard gaining `i` as an exempt path,
  `LONG_CHECKS` rows for unsharded `golden.js`/`sweep.js`, `run-all.js
  --help`, the `i/`-missing guard before `derived`/`dataint`/`craft`/`stub`,
  and the one-word `CLAUDE.md:36` fix). Not blocked by any owner question.
- Gates: `node .claude/hooks/selftest.mjs` (runs inside `npm run check`);
  `npm run check`.

## Blockers
- None for B2-B7. Owner answers are now settled (`context.md`, "Settled
  owner decisions") but each still lands as its own step inside B3/B8/B10/
  B13/B14/B20 per the plan; nothing blocks starting B2.

## Deferred
- See `plan.md`, "Deferred to the two excluded tickets, and to tasks of
  their own" - the consistent-storage and UI/UX tickets each have an
  explicit inheritance list there; PF4, the `ListPage` split, the
  `AppState` decomposition, the release-shape change and the heavy-run lock
  are costed tasks of their own.
- `issues/56/context.md:38` and `issues/59/context.md:25` cite the deleted
  `docs/parity.md` (DC14) - other tasks' files; the orchestrator should pass
  it on.
- Q8 (data-side apostrophe normalisation, B20) stays last and stays
  cosmetic now that B1 has shipped - `context.md`'s note that it "becomes
  the search fix" if B1 were ever dropped no longer applies.

## Notes
- Mocks path: none (no new UI element).
- Screenshot findings: none (no attachments).
- Cleanup performed / retained artifacts: a scratch
  `app/coverage-tmp/coverage-summary.json` from the per-file coverage check
  above was created and deleted in the same session; `git status` confirmed
  clean of it. `work/` (three PNGs) remains untracked artwork scratch,
  unrelated to this task, left alone as instructed.
- Session end partial progress (if any): none - B1 is a committed boundary.
