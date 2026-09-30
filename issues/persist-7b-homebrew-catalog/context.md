# Shared task context - TASK persist-7b-homebrew-catalog

Orchestrator (or first worker) maintains this file so later steps do not re-fetch the same sources.

## Goal
- R7b: homebrew items in the catalog pages - the `homebrew` table
  (`#/tables/homebrew`), own equipment in the equipment tables with dynamic
  `src` values and the `sect` facet, one merged search with the intro
  counter, the «Хоумбрю» show/hide chip (`plan.md` 7.2, D3).
- The next releases after R7b, planned in the same `plan.md` until each
  gets its own directory (7.5): R7c `persist-7c-homebrew-relations`
  (the catalog `craft` as a list, cards, upgrade lines, craft links, sets,
  relations on catalog cards) and R7d `persist-7d-homebrew-files` (two
  public schemas, `llms.txt`, import and export, `homebrew.json` in the
  zip).
- R7 `persist-7-homebrew` shipped the items themselves (commit "feat(persist):
  add homebrew items, their pages, editor and list entries"); its directory
  was deleted at its closeout and this one took its R7b-R7d plan. R8
  (homebrew art) and R9 (`#/h/<token>` item links, add and clone, print
  routes for cloud lists) build on this design.

## GitHub issue (if any)
- URL: none (a local task id; the owner's requests came through the
  orchestrator, 2026-09-27 to 2026-09-30).
- Captured or last verified: 2026-10-01, at R7's closeout.
- Title: -
- Summary (facts only): the owner's items 1-13 below.
- Decisions already settled: `plan.md` sections 9 and 10; the decision
  files D1-D11 under `docs/decisions/` (`plan.md` section 10).
- Open questions: none.

## The owner's requests (2026-09-27/28, the parts R7b-R7d still deliver)
1. Feature parity: a homebrew item supports every relation and property a
   catalog item has - tier progression (an upgrade line: the tier 1-4
   versions of one item, which can share one image), craft chains, sets,
   references. R7c.
3. Links across the boundary: a homebrew item can join a catalog set and
   upgrade from or to a catalog item; the catalog item's own view shows
   the author's homebrew relations. R7c.
4. Many-to-one: 15 homebrew variants of «Premium Bedroll» that all upgrade
   from it; the catalog card folds them («и ещё N»). R7c.
5. Marking: homebrew relations drawn on a catalog item are marked as
   homebrew. R7c (the marker answer below).
6. Visibility: a homebrew relation shows on catalog items only for its
   author; a user who only holds the item in a list (a frozen snapshot)
   does not see it there. R7c.
8. Import, export and `llms.txt` for homebrew items: an author converts the
   items of one source into a file and imports them in one go; an export
   gives them back. R7d.
10. First-class everywhere except the roll pages: the source filters are
    built from the author's sources at run time, the items sit inside the
    equipment view. R7b.
11. Filters: a "with homebrew" / "without homebrew" switch. R7b (the chip).
13. Long term, not built: homebrew "books" shared with other users. D7
    (`docs/decisions/2026-10-01-homebrew-keeps-the-way-open-to-shared-books.md`)
    holds the direction; each release keeps its shapes (`plan.md` 4.13).

## Owner answers (2026-09-30) that R7b-R7d apply
- Q1: "unique" is a one-off outside any upgrade line (the existing empty
  `line`); artifact is `eq.tier: 'A'`.
- Q2: `#/tables/homebrew`, a table page of its own.
- Q4: the bilingual stored shape, no second-language UI; only a file
  import fills the second language.
- Q5: «Мастерская Ольхи (HB)» as plain text.
- The marker, answered during R7's `B7.3`: Russian keeps the Latin «(HB)»;
  «ХБ» is rejected (it reads as х/б). One marker everywhere, the HB text:
  R7c's dashed ladder rung is replaced by an «HB» label on the rung; the
  source tag and relation lines keep «(HB)». Applied to `plan.md` 4.2,
  `B7c.4` and D2 at R7's closeout.
- Q6: finer releases where a criterion supports it (the four releases).
- Q7: skip-or-update for held keys on import, default skip.
- Q9: import creates sources automatically, with the per-source «Куда»
  mapping in the preview.
- Q11, verbatim: "we can do up to 8, I am OK to update catalog as well to
  make it compatible". Follow-up after pass 4: the catalog's `craft` becomes
  a list too - one shape everywhere. It is a public contract change (the
  record shape in `data.json`, `README.md`, `llms.txt`, `tests/derived.js`,
  tools): `B7c.1`, with its contract review.
- Q13: `import-v1`'s bounds, decided in task `limits-follow-overrides`;
  `import-v2` is "v1 plus homebrew" and inherits 1000 lists and 5000
  entries per list, and the rule that a bound widens in place, never
  narrows.
- Q14: the bundle budgets step up per batch (measured size plus about
  5 kB, each with a decision) up to 250 kB configured and 190 kB
  unconfigured. Owner, on `B7.2-4`: the ceilings may rise when a batch
  needs room, as long as the rise is reasonable; each rise gets a decision.
- Counters: the search intro keeps the catalog count (1272, pinned by
  `tests/derived.js`) and adds «И N ваших предметов.» only when the
  signed-in user has items.
- «Карты правил» confirmed as the label.
- Mocks m01-m22 approved, with the Q12 revision (no draft mark).

## Screenshot / attachment findings
- No issue screenshots. The approved mocks are `mocks/index.html`
  (m01-m22), moved here from R7's directory; `plan.md` section 8 lists
  each mock's release and the answers that override what a mock still
  draws (the dashed marks of m07 and m08 among them).

## Key paths
- Specs: `docs/specs/FEATURES.md` ("Homebrew", "Tables and search",
  "Records"), `ROUTES.md`, `CONTRACTS.md` (sections 1, 2, 4), `STATE.md`,
  `I18N.md`, `META.md`, `COVERAGE.md`, `DEBT.md` (D69 owned by R7d).
- Code hot paths: `app/src/lib/homebrew.ts` (`withRecords`, `recordOf`),
  `lib/data.ts` (`Index`: `byId`, `all`, `rows`, `searchable`, `allEquip`,
  `craftedFrom`, `setMembers`, `refs`, `sets`), `lib/facets.ts` (`EQ_SRC`,
  `srcName`), `lib/types.ts` (`TABLE_IDS`, `Record_`), `lib/label.ts` (`tableOf`,
  `srcLabel`, `whereFrom`), `components/SearchPage.svelte`,
  `TablesPage.svelte`, `RecordCard.svelte`, `RowMain.svelte`,
  `HomebrewPage.svelte`, `HomebrewEditor.svelte`,
  `state/homebrew.svelte.ts`, `state/app.svelte.ts`;
  `supabase/migrations/20260930130000_homebrew.sql`.
- Mocks: `issues/persist-7b-homebrew-catalog/mocks/index.html`.

## Command costs

Measured on this host (2026-09-27 to 2026-10-01, `.claude/README.md`, "Batch
size and the fixed cost of a run").

| Command | Wall clock | Fits one call? |
|---|---|---|
| `npm run check` | 7-10 min | yes, `rtk npm run check` with timeout 600000 |
| `npm run check:built` | about 2 min with `build:test` | yes |
| `node tests/run-all.js app/print,app/contracts,app/states,app/typo,app/hues,stub` | `app/states` 4-6 min, `app/contracts` 7-9 min, `app/print` about 8.5 min | one suite per call |
| `node tests/app/sweep.js <width>` | 7-9 min at 360 | yes |
| `node tests/app/golden.js --shard=n/4` | about 3.2 min per shard | yes, one shard per call |

Also: `check:db` 9-10 min (through the PowerShell tool on Windows); `npm run
e2e` 2-3 min; a blind round 5-10 min.

## Which machine is authoritative
- For recorded numbers (visual debt, timings): this host (Windows 11, the
  owner's workstation).
- What a difference on another machine means: a timing only; a golden or
  sweep difference is a defect.

## Reasons already disproved
- The golden `#/l/ ~ every entry gone` failure was not R7's: it failed
  2 of 4 runs at `f39534d7` and 4 of 4 at `86aaa41c`, before R7's code
  (its toast lived 1600 ms from mount and the harness arrived after
  1167-2838 ms). The toast hold fixed it (decision 2026-09-30, "A timed
  golden holds its toast until the capture reads it").

## Facts measured or settled (still true at R7's closeout)
- Catalog (`data.js`): 1272 records, 891 in `items` tables plus 381 in
  `eq`; `eq` on 604, 288 of them in 72 upgrade lines (`eq.line`), and every
  line shares one `img`; `craft` on 17 (one id string each, no target with
  two sources: Core recipes, Wondrous, the Frostwyrd chain `dve24 -> dve25
  -> dve26`); `refs` on 13 (13 ref cards in `LOOT.refs`); `set` on 5 (two
  sets: `ember-spark` - `dve19`, `dve20`; `saints-ensemble` - `voa4_t3d`
  Святой Щит, `voa4_t3e` Святой Клинок, `voa4_t3f` Святое Облачение);
  `eq.alt` on 20; `tier 'A'` on 9 and `'C'` on 5; `community` on 90 (nine
  communities); no `line` crosses a source; id prefixes `ci cc hi hc w cm
  di f voa dv dve q`. `hi7` is «Поварские Гранулы»; `q23` «Скипетр»; `q14`
  «Арбалет»; `dv34` «Одеяло от Призраков»; `q38` shares `q1.webp`.
- Every catalog weapon, secondary weapon and armour record carries all of
  `t tier tr rg dmg dt bu as th line cls`; `alt` carries all four of `tr rg
  dmg dt`. `dmg` is `d4`-`d20` with an optional `+N`, never `2d8`.
- `Index.craftedFrom` is `Map<string, string>` (one source per target);
  readers: `RecordCard`, `RowMain`, `share.ts`, `data.test.ts`. `allEquip`
  feeds `equipOfKind`, `upgradeLine` and the facets' presence filters.
  `searchable` feeds `SearchPage` only. `rows` feeds the roll panels,
  `TablesPage`, `facets.ts`, `sections.ts`, `std.ts`.
- `TABLE_IDS` (16) is read by `isTableId`, `groupsFor`, `PLAIN_GROUPS`,
  `TABLE_GROUPS`, `SUB_LABEL`, `pinOf` and `routes.json`; `TABLES_RE`
  admits `[a-z_]+` names and `[A-Za-z0-9_.-]+` tails, so `homebrew` and an
  anchor `hb_<16>` fit the grammar.
- `EQ_SRC` (`facets.ts`) is a fixed list filtered by presence in
  `allEquip`; `srcName(key, lang)` names the five books and falls back to
  `frameName`. `hayFor` caches by id; `SearchPage` derives it from
  `statLine`.
- `RowMain` draws one craft line (`craftFrom`, `craftInto`), badges and the
  `src` badge; `RecordCard` draws the ladder (`upgradeLine`; each rung a
  fixed 26 px square with its tier, titled with the item name), both craft
  lines, the set line with the bonus, the refs as `<details>`.
- A CHECK constraint calls its functions as the writing role:
  `authenticated` needs EXECUTE on the validators; `harness.test.mjs`'s
  `EXPECTED_ANON_FUNCTIONS` pins what `anon` may run.
- The limit keys are pinned in `tests/db/limits.test.mjs`,
  `tests/db/restore-drill.test.mjs` and the restore runbook's step 4 in
  `.claude/README.md`; `tests/db/usage.test.mjs` pins `PUBLIC_TABLES`. A new
  limit key (`homebrew_cards_per_owner`, R7c) updates all three.
- `apply_list_writes` and `import_lists` read entries with
  `jsonb_to_recordset`, where a JSON `null` snapshot becomes SQL null.
- The contract (`cloud.contract.ts`) has cases A-M (M is homebrew); R7c's
  cards are case N.
- `tools/decisions.js` validates a decision body at fifteen non-blank
  lines from 2026-09-26 on, a status line before "- Task", and both
  directions of every pointer.
- The golden format reads the accessibility tree: a `data-` attribute on
  `<main>` moves no golden. `driver.js` has no `<select>` verb (`states.js`
  calls `page.select`); `golden.js --only=` takes one substring. Inventory
  states are named `<route>[ ~ variant][ as gm1|gm2]`.
- `PageHead` draws the pin button; the homebrew pages use `PageTitle`.
- The bundle budget, 2026-10-01: 223.8 of 226 kB configured, 164.8 of
  167 kB unconfigured; it counts lazy chunks.
- The mock generator lived outside the repository, in an R7 session
  scratchpad (`r7mocks/gen.mjs`); it rewrote every `.html` file of the
  mocks directory. Treat it as gone: edit a mock by hand.
- The browser pane opens `mocks/index.html` from disk but refuses the other
  mock paths; a 360 px check ran on pages copied to that path, each under
  about 88 000 URL-encoded characters.
- With homebrew keys of 19 characters a purchase request's 32 KiB lines
  bound holds about 700 lines (about 360 with 64-character keys).
- "100 entries per list is at most 3.2 MB" (32 KB frozen snapshots) holds
  only at the default; an override of 1000 entries makes a shared list up
  to 32 MB in `get_shared_list()`.

## Constraints
- Contracts / parity / i18n notes: «(HB)» and the rung's «HB» are the same
  Latin text in both languages; every new text has RU and EN; every toast
  is a `Msg`; nothing of homebrew goes to `localStorage` or
  `sessionStorage`; never infer an equipment tier from stats; the roll
  pages stay the catalog's; the example source is the invented «Мастерская
  Ольхи» / "Alder Workshop" (the owner's first example is a trademark).

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
- You suspect drift vs issue or plan
