# Shared task context - TASK persist-6-import-export

## Goal
Release R6: JSON export (all lists, selected, one list) and create-only
import of a versioned bundle (`import-v1`) for signed-in users, published
as a JSON Schema for LLM use. Batches `B6.1` (contract, pure module, port,
RPC) and `B6.2` (UI) - `plan.md` section 7.

Planned ahead (2026-09-25/26) while R2's last batch is being built. Design
level plus owner questions now; the implement-ready steps get a refresh
before the build (`plan.md` section 8).

## Sources (read, do not re-fetch)
- Roadmap `issues/persistent-storage/plan.md`: sections 3, 5, 9, 12, 14
  (R6), section 10 (after the cutoff there is no local JSON export; the
  bundle is for signed-in users), section 16 (decisions 3, 14, 31), 17.
- R2's task `issues/persist-2-lists/`: `context.md` (owner answers),
  `plan.md` section 4.2 (the B2.1 schema: `lists`, `list_entries` with
  `source`, `snapshot` bounded to 16384 bytes, notes, limits 50 / 100).
- `llms.txt`, `docs/specs/CONTRACTS.md`, `data.json`, `catalog.csv`.
- R7 homebrew (bundle schema v2) is planned in parallel; v1 stays
  forward-compatible (`plan.md` section 4.8).

## Key paths
- Specs: `docs/specs/CONTRACTS.md` section 4 (the published files),
  `FEATURES.md` "Account lists" and "Account", `META.md` section 3,
  `COVERAGE.md` "Test layers", `I18N.md` "Rules".
- Code hot paths: `app/src/lib/cloudLists.ts` (rows, bounds, `clip`),
  `app/src/ports/types.ts` (`ListRepository`), `supabase.ts` (`written`,
  `writeOf`), `fake-cloud.ts`, `fake-cloud-seed.ts` (`gm1` three lists,
  `gm2` one), `lazy-cloud.ts`, `cloud.contract.ts`,
  `app/src/state/cloudLists.svelte.ts`, `app.svelte.ts` (`cloudLists`,
  `env`, `index`), `ports/image.ts` (`download`, `fakeImage`),
  `components/ListsPage.svelte`, `ListPage.svelte` (action row ~891),
  `AccountPage.svelte`; `supabase/migrations/20260925130200_list_shares.sql`
  (`clone_shared_list`, the RPC shape); `tests/db/lists.test.mjs`
  (`asRole`, `byCode`); `tests/app/driver.js` (`prepare`, `fake`),
  `inventory.js`, `states.js`; `tests/e2e/flows.mjs`, `contract.mjs`;
  `tests/contracts.js`; `.github/workflows/ci.yml` "Collect what the site
  is made of"; `tools/check-site.lib.mjs`; `app/index.html` `<noscript>`.
- Mocks: `mocks/b62-export-import.html` over `mocks/mock.css`.

## Command costs (this host, idle; `.claude/README.md`, re-measured 2026-09-25)

| Command | Wall clock | Fits one call? |
|---|---|---|
| `npm run check` | 348 s | yes (`rtk npm run check`, timeout 600000) |
| `npm run check:built` | 19 s + two builds | yes |
| `node tests/run-all.js app/print,app/contracts,app/states,app/typo,app/hues,stub` | ~290 s | yes |
| `node tests/app/sweep.js <width>` | 320-590 s per width | one width per call |
| `node tests/app/golden.js --shard=n/4` | 100-290 s per shard | one shard per call |
| `npm run check:db` | ~120 s (+3-5 min first stack start) | yes (PowerShell tool) |
| `npm run e2e` | 50 s | yes |

## Settled in planning pass 1 (2026-09-26)
- The format (`plan.md` 4.1), the schema as a public contract (4.2),
  client validation and the messages (4.4), new ids and one transaction
  (4.5), the three export surfaces and the import panel (4.6), the
  harness additions (4.7), the seams (4.8), the `llms.txt` section (4.9).
- Three decision files of 2026-09-26 in `docs/decisions/`.
- Owner questions Q1-Q4 answered as recommended (2026-09-26, `plan.md`
  section 11).

## Constraints
- Public contracts default to no change; the one addition (`schema/
  import-v1.json`, `llms.txt`) ships with `CONTRACTS.md`, `docs/fixtures/
  import/` and `tests/contracts.js` in `B6.1`'s commit.
- `B6.1` starts after R2 closes (its refresh reads `B2.3`'s `llms.txt`,
  port and fake); R5 ships before R6.
- Do not run the local Supabase stack, the test project or production in
  a planning pass.

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
