# Plan - TASK roll-per-line

Facts: `context.md`. Status: planned and implement-ready after the start gate. Branch `claude/roll-per-line`.
Plan self-checked 2026-11-05 against `main` at `b6f153a5` (open claims read in code; no separate plan review, see "Review").

## Start gate

Start B1 only when task `new-items` is closed: `issues/new-items/` is deleted and its squash is on `main`.
That task adds `ph` (64 rungs in 93 rows) with rolls equal to ids. This task then fixes `arazo` and `ph` together.
It must not start earlier: both tasks edit `data.js`, `tests/derived.js`, the Arazo and ph goldens and the same specs.

At the start, in a fresh worktree from `main`:

1. Merge `main` into `claude/roll-per-line`.
2. List the pools that hold a line: run
   `node -e "global.window={};require('./data.js');const L=window.LOOT;for(const [k,v] of Object.entries(L.items)){const h=v.filter(x=>x.eq&&x.eq.line&&x.roll!=null).length;if(h)console.log(k,v.length,h)}"`.
   Expected: `arazo` (78) and `ph` (93). Any other table in the list gets the same treatment.
3. Read `docs/DECISIONS.md` for decisions of `new-items` about `ph` rolls and roll tables.

## Design (decided)

A roll pool holds one row per item. An upgrade line is one item, so its head is the only rolled record.
Rungs (a record whose `eq.line` is not its own id) keep their place in the table but have no `roll`.

| Option | Verdict |
|---|---|
| A: rungs stay in the table without `roll`; one pool rule in code | Recommended: small code; the table page, search and the ladder keep every rung |
| B: move rungs out of the table | Rejected: `L.eq` is `core` and `hnf` only (`tests/dataint.js:362`); the table page loses rungs |
| C: weights | Rejected: the roll has no weights |

Ids do not change. Rolls renumber to 1..N in book order over heads and single items.
Expected pools: `arazo` 78 -> 27 (17 heads + 10 items); `ph` 93 -> 49 (16 heads + 4 armor + 29 items).

## Verified in code (these were open questions)

- Share card (`tools/share-card.mjs`): `tableOf` returns the source table for `arazo` before it reads `roll`. For a rung
  without `roll`, `where()` (line 298) already writes "Tier N" and `subtitle()` sets `noTier`, so the tier shows once.
  A head keeps "Roll N". `ph` needs its own `tableOf` case before line 271; `new-items` adds it. Confirm after merge.
- Saved roll number: `NumberField` clamps to `max` (`numField.ts`, `committed`/`typed`). No port stores the number.
  Nothing to migrate.
- `tests/dataint.js:243-305` treats a whole table as a pool: it requires `ROLLED.has(x) === (x.roll != null)` and rolls
  `1..rows.length`. This must change (step 3).

## One batch: B1

Why one batch: the rule, the data of two sources, the specs and the goldens share the same files and one public-contract
change (the roll range of two routes). No split has its own criterion. Total gate cost: one `check:fast`, one CI run,
one golden re-seed, one review and its fix pass.

1. Code: add `rollPool(rows)` in `app/src/lib/` (pure): keeps the rows with `roll != null`, in order. Use it in
   `App.svelte` (the whole-table rolls: `rows={rollPool(...)}`), and in any other roll panel that takes a whole table.
   Unit test: order kept, rung dropped, table without lines unchanged.
2. Data (`data.js`): remove `roll` from every rung; renumber heads and single items. Do it with a script that loads
   `data.js`, mutates `L` and writes the exact `window.LOOT=` + JSON + `;\n` form. Run `node tools/build.js`.
   Search `i/` for `undefined`.
3. `tests/dataint.js`: the pool of a table is the rows that are not rungs. Rewrite `ROLL_POOLS` for whole tables:
   `rows.filter(x => !isRung(x))`, where `isRung(x)` is `x.eq && x.eq.line && x.eq.line !== x.id`. Keep
   `ROLLED.has(x) === (x.roll != null)`. Add the rule: every `eq.line` has at most one rolled record, and it is the
   head. Update the Arazo block in `tests/derived.js:2458-2489` (27 rolled rows, 68 rungs-or-heads, no roll on a rung).
   Update the `ph` block the same way.
4. Readers of `roll` as a signal, none expected to break: `label.ts:215`, `RecordPage.svelte:51` (a rung shows no
   "Roll N"), `tools/derived.js:122`, `tools/artwork/review/review.mjs:144`. Confirm each with a test or a golden.
5. App tests: `app/src/components/roll.test.ts` ("Arazo's Artifacts over the real data"): button "1-27", a head at its
   new number, the ladder reaches a rung. Same for `ph`. Check `tables.test.ts` and `label.test.ts` for rung rolls.
6. Goldens: re-seed `_roll_arazo*`, `_tables_arazo*`, the `ph` ones, and any golden that prints a roll number of these
   tables. `tests/app/inventory.js` needs an entry only for a new state (none expected).
7. Rule and specs (same commit):
   - `docs/specs/FEATURES.md`, "Rolling": one roll row per item; an upgrade line is one row, its head; rungs have no
     `roll`. Update the table rows for `arazo` (21) and `ph`.
   - `docs/specs/COVERAGE.md`: the new unit test and the `dataint` rule.
   - `docs/specs/ROUTES.md:55` and the `ph` row; `CONTRACTS.md`, `docs/fixtures/urls/routes.json`, `llms.txt`,
     `README.md`, `README.ru.md` wherever they print 1-78 or 1-93; the `COUNT_BEARING_FILES` of `tests/derived.js` if a count changes.
   - `docs/decisions/<date>-one-roll-row-per-upgrade-line.md`; list it in `docs/DECISIONS.md`; mark
     `2026-10-08-arazos-artifacts-rebalanced-to-core-bands.md` "superseded in part" (rolls) and the `ph` roll decision of `new-items`.
   - `.claude/prompts/add-source.prompt.md`: one line, "an upgrade line is one roll row; give rungs no `roll`".
8. Gates: `node tests/run-all.js dataint,derived,contracts`, `rtk npm run check:fast` (Bash timeout 600000), push, CI.
9. Reviewer (Opus; trigger: public route range and a data contract change), one remediation commit.
10. Closeout (`/handoff`): audit this directory against the durable list, delete it, squash onto `main` after green CI.

## Standing checks

- Scale: Arazo pool 78 -> 27, ph 93 -> 49; each item rolls at 1/N.
- Error scenarios: a roll number above the new max (clamped); a shared link, list or search hit on a rung id (opens by id);
  a future source with lines but a missing `rollPool` use (the `dataint` rule fails the data, not the page).
- Consistency: one rule for every source; the Roll badge on heads and single items only; tier word on rungs.
- RU/EN parity: no new text; check that no golden changes in one language only.

## Review

No separate plan review: the open claims were read in code (see "Verified in code"), the design is the smallest change,
and the reviewer runs on B1 anyway. Run a plan review if the start gate finds a third pool or a changed `RollPanel`.

## Do-nots

- Do not renumber ids. Do not move rungs to `L.eq`. Do not infer tier from stats. Do not hand-edit generated files.
