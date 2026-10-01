# Shared task context - TASK persist-7d-homebrew-files

Orchestrator (or first worker) maintains this file so later steps do not re-fetch the same sources.

## Goal
- R7d: homebrew items travel by file. Two public schemas
  (`schema/homebrew-v1.json`, `schema/import-v2.json`), `import_homebrew`,
  `llms.txt` with a blind round, import with the «Куда» source mapping and
  skip or update, the download surfaces, `homebrew.json` in the account zip,
  the bulk move between sources and sections (`plan.md` 7.4).
- Shipped before it: R7 `persist-7-homebrew` (items, sources, sections, the
  editor, lists, frozen copies), R7b `persist-7b-homebrew-catalog` (the
  catalog pages), R7c `persist-7c-homebrew-relations` (the catalog `craft` as
  a list, `homebrew_cards`, relations in the editor and on catalog cards).
  R7e `persist-7e-list-quick-item`, R7f `persist-7f-consistency` and R7g
  `persist-7g-read-scale` ship before R7d (owner, 2026-10-01).

## The owner's requests (2026-09-27/28)
- Item 8: import, export and `llms.txt` for homebrew items. An author
  converts the items of one source into a file and imports them in one go; an
  export gives them back.
- Item 13: long term, not built: homebrew "books" shared with other users. D7
  (`docs/decisions/2026-10-01-homebrew-keeps-the-way-open-to-shared-books.md`)
  holds the direction; each release keeps its shapes (`plan.md` 4.13).

## Owner answers that R7d applies
- `Q4`: the bilingual stored shape, no second-language UI; only a file import
  fills both languages.
- `Q7`: skip or update for held keys on import, default skip.
- `Q9`: import creates sources automatically, with the per-source «Куда»
  mapping in the preview.
- `Q13`: `import-v1`'s bounds were decided in `limits-follow-overrides`;
  `import-v2` is "v1 plus homebrew" and inherits 1000 lists and 5000 entries
  per list, and the rule that a bound widens in place, never narrows.
- `Q14`: the bundle budgets step up per batch (measured size plus about
  5 kB) up to 250 kB configured and 190 kB unconfigured; a ceiling rise
  needs a decision file.
- `Q15`: the `list_entries` frozen-copy bound is 131072 bytes; card texts
  1500 code points.
- Bulk move (owner, 2026-10-01): a selection on `#/homebrew` with
  «Переместить...» in the selection bar, reusing the import's «Куда»
  source and section picker.
- Lazy chunk (owner, 2026-10-01): the import and export code ships as a lazy
  chunk like `zip` from the start.
- Scale (owner, 2026-10-01): `scale-challenge` F10 (the import report filters
  skips once, «и ещё N списков»); plans size for 3x the defaults.
- Marker: «(HB)» everywhere, the same Latin text in both languages; «ХБ» is
  rejected. The example source is the invented «Мастерская Ольхи» / "Alder
  Workshop" (the owner's first example is a trademark).

## Key paths
- Specs: `docs/specs/CONTRACTS.md` (section 4: the two formats are public
  contracts), `FEATURES.md` ("Homebrew", "Account"), `META.md`, `COVERAGE.md`,
  `DEBT.md` D69 (deleted by `B7d.2`); `docs/decisions/` D6
  (`2026-09-30-homebrew-travels-as-its-own-file.md`) and D7.
- Code: `app/src/lib/bundle.ts` (`officialOnly` leaves homebrew entries out
  of a lists export until v2), `lib/zip.ts`, `lib/homebrew.ts`,
  `lib/homebrewForm.ts`, `state/homebrew.svelte.ts`, `components/ImportPanel.svelte`,
  `HomebrewPage.svelte`, `HomebrewSources.svelte`, `HomebrewCards.svelte`,
  `AccountPage.svelte`; `app/src/ports/` (`HomebrewRepository`, the real
  adapter, the fake and its seed `gm1`, `gm2`, `gm3`);
  `supabase/migrations/20260930130000_homebrew.sql` and
  `20261001130000_homebrew_relations.sql`; `schema/import-v1.json`,
  `docs/fixtures/import/`, `llms.txt`.
- Tests: `tests/db/import-homebrew.test.mjs` (new), `ports/cloud.contract.ts`
  (cases A-N), `tests/contracts.js`, `tests/derived.js`.
- Mocks: `issues/persist-7d-homebrew-files/mocks/index.html` (m02, m03, m15,
  m16, m17).

## Command costs

Measured on this host (2026-09-27 to 2026-10-01, `.claude/README.md`, "Batch
size and the fixed cost of a run").

| Command | Wall clock | Fits one call? |
|---|---|---|
| `npm run check` | 7-10 min | yes, `rtk npm run check` with timeout 600000 |
| `npm run check:built` | about 2 min with `build:test` | yes |
| `node tests/run-all.js app/states,app/typo` | `app/states` 4-6 min, `app/typo` about 2.7 min | one suite per call |
| `node tests/run-all.js app/contracts` | 7-9 min | yes |
| `node tests/app/sweep.js <width>` | 7-9 min at 360; 3-6 min at 1180 | yes |
| `node tests/app/golden.js --shard=n/4` | about 3.2 min per shard | yes, one shard per call |

Also: `check:db` 9-10 min (through the PowerShell tool on Windows); `npm run
e2e` 2-3 min; a blind round 5-10 min. A golden `--only` argument that starts
with `#/` needs `MSYS_NO_PATHCONV=1` under Git Bash.

## Facts measured or settled
- `jsonb_to_recordset` turns a JSON `null` snapshot into SQL null
  (`apply_list_writes`, `import_lists`), which reads as a reference; a v2
  frozen entry must send an object.
- A new limit key (`homebrew_cards_per_owner`, R7c) is pinned in
  `tests/db/limits.test.mjs`, `tests/db/restore-drill.test.mjs` and the
  restore runbook's step 4 in `.claude/README.md`; `tests/db/usage.test.mjs`
  pins `PUBLIC_TABLES`. R7d adds no limit key unless the import ceilings
  need one.
- A Postgres CHECK runs on every UPDATE of its row; a narrowed validator
  locks every row that holds a refused value (`.claude/README.md`, the
  paragraph on the damage-bonus migration). A migration that replaces a
  function needs a real reversal that restores the previous body
  (`tests/db/reversibility.test.mjs` compares the schema dump up-down-up).
- A CHECK calls its validators as the writing role: `authenticated` needs
  EXECUTE on each validator; `EXPECTED_ANON_FUNCTIONS` in
  `tests/db/harness.test.mjs` pins what `anon` may run.
- With homebrew keys of 19 characters a purchase request's 32 KiB lines
  bound holds about 700 lines (about 360 with 64-character keys).
- A shared list at the default of 100 entries is at most 12.8 MB with
  131072-byte snapshots; an override of 1000 entries makes it up to 128 MB in
  the worst case; real snapshots are about 2 KB.
- The `homebrew` limit keys: `homebrew_books_per_owner` 20,
  `homebrew_items_per_owner` 100, `homebrew_cards_per_owner` 100; a section
  list holds at most 30 sections; `my_limit(key)` reads the effective value.
- The zip reader refuses more than 1000 entries (`lib/zip.ts`): export the
  homebrew items as one `homebrew.json`, never one file per item.
- The import report today runs `skipped.filter((s) => s.list === i)` per list
  and draws one `.rep-list` block per list with a skip or a taken name
  (`ImportPanel.svelte`; `scale-challenge` F10): 1000 lists with 100k skips is
  an estimated 0.3-1 s freeze.
- The fake broadcasts a homebrew write on `owner:<uid>` with `{ by: TAB }`,
  which the store ignores, so a `d.fake(...)` write never refreshes the store
  inside a state; seed a user (`?as=gm1`, `gm2`, `gm3`) instead.
- A mock named in a state or a test: check every catalog id and name taken
  from a mock against `data.js` (pass 2 of R7's plan got four wrong).
- The golden format reads the accessibility tree: Chrome's interesting-only
  snapshot drops a listbox's options and a generic `<span>`. `tests/app/
  inventory.js` holds 244 states (R7c); a new state needs an inventory entry
  and a re-seeded golden in the same change. The tree key covers
  `tests/app/snapshots/`, so a golden re-seed is a tracked edit and
  `npm run check` runs after it.
- `.check-db-cache.json` is keyed by the whole tree (`tree-key.mjs`;
  `issues/` and `.md` files other than the READMEs exempt): `check:db` runs
  after the last tracked edit.
- `tsconfig.json` sets `exactOptionalPropertyTypes`.
- The bundle after R7c (2026-10-01): 237.5 of 242 kB configured (measured
  with the README's `.env.test.local` line), 178.6 of 183 kB unconfigured;
  12.5 and 11.4 kB under the 250 and 190 ceilings, shared with R7e, R7f and
  R7g. The figure counts lazy chunks.
- `tools/decisions.js` validates a decision body at fifteen non-blank lines
  from 2026-09-26 on, a status line before "- Task", and both directions of
  every pointer.

## Constraints
- Contracts / parity / i18n: every new text has RU and EN; every toast is a
  `Msg`; nothing of homebrew goes to `localStorage` or `sessionStorage`; the
  roll pages stay the catalog's; the two schemas use `additionalProperties:
  false`, fixtures and `llms.txt` sections proven by a blind round;
  `data.json`, `catalog.csv`, `i/` and `og/` never carry a homebrew record.
- Schema batch rule: `B7d.1` stops after `npm run check`, `npm run check:db`
  and the commit; the plan review comes first, the push to the test project
  and `npm run e2e` follow the review's approve.

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
- You suspect drift vs issue or plan
