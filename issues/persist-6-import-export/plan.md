# Plan - TASK persist-6-import-export (release R6)

## Status

- Plan review: required before B6.1 (trigger: a migration with a new writing RPC `import_lists`; a public contract change - `schema/import-v1.json`, `docs/fixtures/import/`, `tests/contracts.js`, `llms.txt` (the new section, and the `#/l/` guidance removed), `CONTRACTS.md` sections 3 and 4; a new write protocol - the import; possible loss of stored data - batch deletion of account lists in `B6.2`)
- Planning pass 2 (refresh), 2026-09-27, planner, in the worktree
  `.claude/worktrees/agent-a733808c488c43153`, fast-forwarded from
  `288ca549` to `1cbca5f7` (R3's `B3.1`: the Realtime migration, the
  tolerant reorder, R3's refreshed plan). R3's `B3.2` (client half) is
  being built on `main` and is not in this tree: its shape is R3's plan
  section 11. R4 is re-planned in parallel and ships before R6: its shape
  is `issues/persist-4-requests/plan.md` sections 6 and 11. Pass 1:
  2026-09-25/26 from `da7378cb`.
- Release slot: after R4, before R7 (roadmap section 9; R7's `B7.3`
  builds on `import_lists` and `lib/bundle.ts`).
- Plan reviews: `reviews/plan-B6.1.md` fix-then-continue (2026-09-27,
  reviewed `4e55c46c`); planning pass 4 applies every finding (register
  `reviews.md`: B1a, B1b as Q6, B2, Risks 1-6 and the local nits fixed;
  Risks 7-9 placed in the `B6.2` refresh; two deferred-scope nits in the
  handoff). The second look, `reviews/plan-B6.1-2.md`, comes next.
- NEEDS_HUMAN_CONFIRMATION: no - Q6 (keep the frozen bounds) answered
  2026-09-27; Q1-Q4 answered 2026-09-26; Q5 answered
  2026-09-27 (B: the account's «Скачать мои данные» downloads a zip,
  section 4.14); the owner's statements of 2026-09-27 (`context.md`) are
  applied in sections 4.6 and 4.9-4.14.
- Batches: `B6.1` (contract, `llms.txt`, pure module, port, RPC) -
  committed `7753e6f2`, batch review approve (`reviews/B6.1.md`); the
  test-project push and `npm run e2e` run in its resumed step before `B6.2`;
  `B6.2` (UI) - implemented 2026-09-28 and amended onto the task commit;
  its batch review and the orchestrator's goldens (P12) come next; closeout.
- Gate cost: `B6.1` about 35 minutes (paid), `B6.2` about 55 minutes (33
  for the implementer, 22 for the orchestrator's goldens and sweep),
  closeout about 5 minutes; about 95 minutes in total (section 7).
- Planning pass 5 (the `B6.2` refresh), 2026-09-28, on `main` at
  `7753e6f2`, against R4 as shipped (`88c9f8bc`: `SelBar.svelte`,
  `ListCard.svelte`'s `requests` line, `RequestsPanel.svelte`,
  `ListPage.svelte`) and `B6.1` as committed. What it changed: "What pass 5
  changed" below.
- Mocks (owner request, 2026-09-27): `mocks/index.html` lists 18
  self-contained files: `m01`-`m14` and `m16`-`m18` one screen state each
  at desktop width and at 360 px side by side, `m15` the `llms.txt`
  section and edits as plain text. The table in section 4.6 maps each to
  its step. The design hook's low-contrast flag,
  if raised, reads the app's own `--muted2` on the wash, as for R2's mocks.
- Roadmap: `issues/persistent-storage/plan.md` sections 5, 9, 12, 14, 17.
  This file is R6's authority where the two differ (the roadmap still says
  `security definer` for `import_lists`, section 5 row R6; section 4.5
  here says invoker).

### What pass 5 changed (the `B6.2` refresh, 2026-09-28)

- Section 9 is implement-ready; its "Decided in this refresh" list (P1-P21)
  settles Risks 7-9, review nits `plan-B6.1-2-N4`, `-N5`, `plan-B6.1-22`,
  the error texts `B6.1` left open, the owner's QA-file offer and the
  `B6.1` review items (`B6.1-R1`, `-N1` to `-N4`, `-N7`).
- 4.3 gains `names` on the refused result, `item` on an error,
  `overBounds` and `dataFileName`; 4.14 rule 7 answers `manyLists` for two
  `lists.json` at one depth (review nit `plan-B6.1-2-N5`).
- 4.6 "Texts" is one table with every new key, RU and EN (review nit
  `plan-B6.1-2-N4`); `listMeta` and `exportSelected` are dropped.
- 4.7: states 58-62, flow F13, the goldens seeded by one `--update` whose
  diff is the proof; a reload does not keep the fake's rows (state (d)
  reads the fake instead).
- Section 7: `B6.2` costs about 55 minutes (one `npm run check`, the golden
  compare folded into the update).
- No mock changes. One mock line differs from the settled rule and the
  rule wins (P15); the field's caption follows the mocks (P16).

### What pass 3 changed (owner review of the mocks, 2026-09-27)

- The separate export checklist is gone: account cards on `#/lists` are
  selectable, and a selection strip (`BatchBar`, extracted from the list
  page's `.batch` on its second use) carries «Скачать JSON (N)» and
  «Удалить (N)» (4.6, 4.10). Batch deletion joins R6 (4.10).
- The list count leaves the gold box that also draws a roll number and
  joins the card's meta line (4.11).
- The import hint links the site's own `schema/import-v1.json` and
  `llms.txt` (4.12). «Импорт из файла» moved into the «Новый список»
  panel.
- Duplicates are stated: list names may repeat, as in the app; a file
  carries no list ids; a repeated entry keeps the first (4.13).
- The skip and error report is grouped by list and names each entry by
  position and record name (4.4, 4.13).
- The account's export is generic, «Скачать мои данные (ZIP)»: a zip
  holding `lists.json` now, R7's `homebrew.json` and R8's pictures later
  (owner, Q5 answered B; 4.14). Import reads the zip and plain JSON; the
  `#/lists` exports stay plain JSON.
- `llms.txt` stops teaching `#/l/` links: the "List links" section is
  removed and the file teaches import files only (4.9).
- Mocks regenerated: `m01`-`m18` plus `index.html` (4.6).

### What pass 2 changed

- `llms.txt` became a first-class deliverable with a three-part proof
  (section 4.9), on the owner's input of 2026-09-27.
- `import_lists` is `security invoker`, a copy of `apply_list_writes`'
  `create` branch without the per-write handler (section 4.5); decision
  file 2 amended.
- The port's row shape reuses the `create` op (`{ list, entries }`); the
  store flushes the buffer first and re-reads through `#pull`, not
  `load()` (no «Загружаем...» over the index).
- A retry after `network` resends the same ids: the panel builds the rows
  once per chosen file (section 4.6).
- The seams with R3's Realtime feed and R4's requests are real now
  (section 4.8); every step that depends on code not in this tree carries
  a tag `[B3.2]` or `[R4]` and a line in the delta check (section 8).
- Fixtures: `export.json` (the export of `gm1`, pinned byte for byte) and
  `from-llms.json` (the blind round's file) join the four of pass 1; every
  fixture is `JSON.stringify(v, null, 2) + '\n'`.
- The contract case adds a maximal import (50 lists of 100 entries),
  timed, then a refusal at the lists limit; the real-only check is gone
  (the fake refuses atomically too).
- Costs re-measured (`context.md`).

## 1. Objective and current state

Goal (roadmap sections 3, 9, 12, 14; `context.md`): a signed-in reader
downloads their account lists as one JSON file - all, some, or one - and
imports such a file into an account as new lists. The file format,
`import-v1`, is published as a JSON Schema and described in `llms.txt`
so that an AI assistant can build a file for a GM, replacing the `#/l/`
links that retire at the cutoff (2026-10-26).

Current state (`1cbca5f7`):

- Account lists: `lists` and `list_entries` (`20260925130100_lists.sql`),
  owner-only RLS, limits 50 lists per owner and 100 entries per list
  through `effective_limit()`; `list_entries.snapshot` bounded to 16384
  bytes for the homebrew source.
- Every owner write goes through R5's write buffer: `CloudLists` queues
  `ListOp`s and sends one `apply_list_writes(p_ops jsonb)` request per
  flush (`20260925130600_list_writes.sql`, `security invoker`, each write
  in its own subtransaction). `ListRepository` is `newId`, `list`,
  `apply`, `move`.
- R3's `B3.1` (`20260927120000_realtime.sql`): a deferred constraint
  trigger `lists_broadcast` sends one owner message (`owner:<uid>`, event
  `list`, `{ list, revision, by }`) and one message per active share per
  list per transaction, at commit; `by` is the `x-dhloot-tab` request
  header. `B3.2` (the client: `CloudPort.events`, the owner feed, the
  write timeout) is in progress on `main`.
- R5b: `#/account` signed in draws Display, «Вы вошли как», «Способы
  входа», «Выход», «Удаление аккаунта»; the account menu opens it.
- No file export or import exists. `ImagePort.download(blob, filename)`
  saves a blob as a file; `fakeImage().downloaded` records it.
- `llms.txt` documents the `#/l/` payload and says the links stop on
  2026-10-26, with no replacement for an AI assistant that builds a list.
- The privacy page promises "export the data of the account you drop,
  delete it, import into the account you keep". R6 makes that true.
- Published machine surface: `data.json`, `catalog.csv`, `llms.txt`
  (`CONTRACTS.md` section 4; `ci.yml` Collect step; `check-site.lib.mjs`
  probes; `app/index.html` `<noscript>` links).

## 2. Scope and non-goals

In scope (R6):

- The file format `import-v1` (4.1) and its JSON Schema
  `schema/import-v1.json`, published at
  `https://artex-x.github.io/daggerheart-loot/schema/import-v1.json` - a
  public contract (4.2).
- `llms.txt`'s new section, proven sufficient for an AI assistant that
  reads nothing else (4.9).
- Export: all of the account's data (`#/account`, «Ваши данные», «Скачать
  мои данные (ZIP)» - `lists.json` now, R7's homebrew later; 4.14), the selected
  lists (the lists index's selection strip, «Скачать JSON (N)»), one list
  (the list page's action row, «Скачать JSON»). Both notes always (Q2).
- Selection of account lists on the index and batch deletion of the
  selected lists (owner, 2026-09-27; 4.10).
- The list count on a card, moved out of the roll number's look (owner,
  2026-09-27; 4.11).
- Import: in the lists index's «Новый список» panel, «Импорт из файла»:
  choose a file, validate in the client, a report grouped by list (4.13),
  one press, one transaction (`import_lists`), create-only with new ids
  (Q1); the hint links the schema and `llms.txt` (4.12).
- `llms.txt` teaches import files only: the `#/l/` guidance is removed
  (owner, 2026-09-27; 4.9).
- The pure module `lib/bundle.ts`, the port method `ListRepository.import`,
  the RPC and its layer 3 tests, the fake, the contract case, states and
  goldens, the E2E flow, specs.

Not in scope:

- Homebrew entries (`source: 'homebrew'`, snapshots): R7's bundle v2
  (4.8 names the seam).
- Preferences, shares, share tokens, purchase requests in the file: never
  (a file is lists only; shares are re-made in the new account; R4's
  requests belong to a share and expire in an hour).
- Import into browser lists: never (they end at the cutoff; import is for
  signed-in users - roadmap section 10).
- Merge or update of existing lists by id: never in v1 (create-only).
- A runtime JSON-Schema validator dependency (ajv): rejected (bundle
  budget; a hand-written validator in `lib/` is small and the drift test
  keeps the two equal).
- An import of a `#/s/<token>` shared list: «Сохранить себе» does that.
- A CSV export: not asked for.

## 3. Existing behaviour and code paths (re-read at `1cbca5f7`)

| Concern | Where | What R6 reuses |
|---|---|---|
| Row shapes | `lib/cloudLists.ts`: `EntryRow`, `ListRow`, `NewListRow`, `ListOp` (`create` is `{ op, list: NewListRow, entries: EntryRow[] }`), `clip`, `NAME_MAX` 200, `NOTE_MAX` 4000, module-local `PRICE_MAX` 99999, `quantityOf`, `priceOf`, `entryRowsOf`, `toCloudList`, `limitText`; `lib/listLink.ts` `QTY_MAX` 99; `lib/money.ts` `MONEY_MODES`, `MONEY_DEFAULT` | the bounds, the row shapes, the limit toast |
| Store | `state/cloudLists.svelte.ts`: `lists` (newest edit first), `status`, `load()`, `flushNow()`, `#pull()` (drops a read that overlapped a local write and re-reads when idle), `#epoch` | `flushNow()` before an import; `#pull()` after it; `lists` for export |
| App glue | `state/app.svelte.ts`: `cloudLists`, `env`, `say`, `t`, `lang`, `index` | one new method `exportLists(ids?)` |
| Download | `ports/image.ts` `download(blob, filename)`; `fakeImage().downloaded` | the export's file save |
| Real adapter | `ports/supabase.ts`: `written()`, `writeOf()` (P0001 `limit: <key>` with `details` -> `limit`; status 0, 401, 5xx, a session code -> `network`; else `refused`), `client.rpc(...)` | `client.rpc('import_lists', { p_lists })` through `written()` |
| Fake | `ports/fake-cloud.ts`: `createList(mine, list, entries)` (an own id: add the missing entries; another user's id: `REFUSED`; the lists limit), `insertEntries` (duplicate record `REFUSED`, the entries limit), `own()`, `offline`, `maxLists`, `maxEntries`, `limited()` | `import` runs `createList` per row on a copy, all or nothing |
| Contract | `ports/cloud.contract.ts` `runCloudContract` cases A-I (G `listCases`, H `shareCases`, I `moveCases` with the timed 1300-entry move, `MOVE_MS` 6000); `tests/e2e/contract.mjs` runs it on the real adapter | an import case after I, before E |
| RPC pattern | `apply_list_writes`' `create` branch (`security invoker`; `insert ... on conflict (id) do nothing`; not visible afterwards -> 42501; entries from `jsonb_to_recordset`) | `import_lists` copies it, one transaction |
| Broadcast | `lists_broadcast` (deferred, one owner message per list per transaction, none on rollback) | an import of N lists sends N owner messages at commit, none when refused |
| Layer 3 | `tests/db/roles.mjs` (`connect`, `asRole`, `commitAs`), `tests/db/list-writes.test.mjs`, `tests/db/realtime.test.mjs` (`rowsOf`), `tests/db/harness.test.mjs` | `tests/db/import-lists.test.mjs` |
| Catalog index | `lib/data.ts` `Index.byId`; `Record_.ru` / `.en` names | the unknown-id check, the informational `name` on export |
| Index page | `ListsPage.svelte`: the account group (`Field label={t.groupAccount} heading`), `cloud.status`, `drawnAccount` | the two buttons and the panels under the heading, above the grid |
| List page | `ListPage.svelte` `Actions` row: «Поделиться» (account list), «Скопировать текст», «Печать», «Удалить»; `isCloud` | «Скачать JSON» after «Скопировать текст», `isCloud` only |
| Account page | `AccountPage.svelte` (R5b): `Panel` + `Field heading` per section, `busy`, `PANEL`; signed in: Display, «Вы вошли как», «Способы входа», «Выход», delete | the panel «Ваши данные» between «Способы входа» and «Выход» (decision 14) |
| Selection | `ListPage.svelte` `.batch` strip: the select-all box with the mixed state (`t.pickAll`), the polite summary, the actions | extracted as `BatchBar.svelte` for the index (4.10) |
| Layer 2 | `tests/app/driver.js`: `prepare()` installs `window.__clip`; `inventory.js`; `states.js` | a `__download` hook, an `upload(path)` verb, new states and cases |
| Published files | `ci.yml` Collect (`cp -r ... _site/`) and the "missing or empty" list; `tools/check-site.lib.mjs` `status200` probes; `app/index.html` `<noscript>`; `tests/derived.js` pins `llms.txt` facts | `schema/` joins each list |
| Contract tests | `tests/contracts.js` (fs-only; fixtures under `docs/fixtures/`, which Prettier ignores) | `docs/fixtures/import/` and the pins of 4.2 and 4.9 |

## 4. Design

### 4.1 The file format `import-v1`

One JSON document, UTF-8, `application/json`, written by the app as
`JSON.stringify(bundle, null, 2) + '\n'`. Keys are `snake_case`, the
database's column words and `catalog.csv`'s `id`.

The worked example (`docs/fixtures/import/example.json`, and verbatim in
`llms.txt`; `B6.1` writes it in exactly this shape, two-space indent):

```json
{
  "$schema": "https://artex-x.github.io/daggerheart-loot/schema/import-v1.json",
  "format": "daggerheart-loot/lists",
  "version": 1,
  "lists": [
    {
      "name": "Лавка кузнеца",
      "money_mode": "coin",
      "player_note": "Открыта с рассвета до заката.",
      "gm_note": "Кузнец торгуется, если назвать имя его брата.",
      "entries": [
        {
          "id": "ci1",
          "name": "Первоклассный Спальный Мешок",
          "quantity": 2,
          "price_coins": 150
        },
        {
          "id": "q1",
          "player_note": "Последний в наличии."
        },
        {
          "id": "q313",
          "gm_note": "Проклят."
        }
      ]
    }
  ]
}
```

The `name` of `ci1` is read from `data.json` at write time (`B6.1` step
2 checks it equals the record's `ru` name).

| Key | Type and bound | Required | Import reads it as |
|---|---|---|---|
| `$schema` | string | no | ignored (editors use it) |
| `format` | const `"daggerheart-loot/lists"` | yes | the discriminator: any other value is "not a lists file" |
| `version` | const `1` | yes | any other value is "unknown version N", checked before the walk |
| `exported_at` | string, `format: date-time` | no | ignored; the export writes it |
| `lists` | array, 1..50 items | yes | one account list each, in file order |
| `lists[].name` | string, 1..200 code points | yes | `lists.name` |
| `lists[].money_mode` | enum `"bag"`, `"coin"` | no, default `"bag"` | `lists.money_mode` |
| `lists[].player_note`, `gm_note` | string, 0..4000 | no, default `""` | the two list notes |
| `lists[].entries` | array, 0..100 items | yes | `list_entries`, `position` = index after skips |
| `entries[].id` | string, `^[A-Za-z0-9_-]{1,64}$` | yes | `item_key`; a `catalog.csv` id (4.4) |
| `entries[].name` | string, 0..200 | no | ignored; the export writes the record's name in the UI language |
| `entries[].source` | enum `["official"]` | no, default `"official"` | `source`; v2 (R7) adds `homebrew` |
| `entries[].quantity` | integer 1..99 | no, default 1 | `quantity` |
| `entries[].price_coins` | integer 1..99999 | no | `price_coins`; absent is no price (never `null`) |
| `entries[].player_note`, `gm_note` | string, 0..4000 | no, default `""` | the two entry notes |

Every object has `additionalProperties: false`: an unknown key is an
error with its path (an LLM that writes `qty` must fail loudly, not
import a list of ones). The export omits every absent or default field
and never writes list ids, entry ids, `created_at`, `updated_at`,
`revision`, `legacy_fingerprint` or share links.

File names: the account's «Скачать мои данные» `daggerheart-loot-data-<YYYY-MM-DD>.zip`
holding `lists.json` (4.14); selected lists `daggerheart-loot-lists-<YYYY-MM-DD>.json` (local date); one list `<name>.json` with `\ / : * ? " < > |` and control
characters replaced by `_`, trimmed, cut to 80 code points, `list.json`
when empty.

### 4.2 The published JSON Schema - a public contract

- File: `schema/import-v1.json` in the repository root, hand-written,
  draft 2020-12, `"$id": "https://artex-x.github.io/daggerheart-loot/schema/import-v1.json"`,
  a `title` and a `description` in English on every property, `examples`
  holding the example of 4.1. Prettier formats it (`schema/` is not in
  `.prettierignore`).
- Published: `ci.yml`'s Collect step copies `schema` beside `llms.txt`;
  the "missing or empty" list gains `schema/import-v1.json`;
  `tools/check-site.lib.mjs` probes it (200; `JSON.parse(body).$id` equals
  the URL); `app/index.html`'s `<noscript>` lists it in both languages.
- Named: `docs/specs/CONTRACTS.md` section 4 gains a bullet: the file, its
  `$id`, hand-written (not generated by `tools/build.js`), "frozen: a v1
  file written today imports for good; a change is `import-v2.json`
  beside it, `version` discriminates, both stay published".
- Fixtures `docs/fixtures/import/` (Prettier ignores the directory; each
  file is exactly `JSON.stringify(v, null, 2) + '\n'`):

  | File | Content | Read by |
  |---|---|---|
  | `example.json` | 4.1's example | `tests/contracts.js` (verbatim in `llms.txt`), `bundle.test.ts` (imports clean), E2E flow |
  | `export.json` | `toBundle` of the fake's `gm1` lists in the store's order («Пустой список», «Лавка кузнеца», «Трофеи»), RU names, `exported_at` `2026-09-25T12:00:00.000Z` | `bundle.test.ts` (byte for byte), the blind round's reading task |
  | `from-llms.json` | the blind round's file (4.9) | `bundle.test.ts` (imports clean), `tests/contracts.js` (declared keys only) |
  | `unknown-id.json` | two lists: list one = example's list plus `zzz1` and a second `ci1`; list two «Пустой список» with no entries | `bundle.test.ts`, the preview state |
  | `errors.json` | one list: a 201-character `name`, `money_mode: "gold"`, entries `{ "id": "ci1" }`, `{ "id": "q1", "quantity": 0 }`, `{ "id": "q313", "qty": 2 }` - four errors, in this file order (mock `m07`) | `bundle.test.ts`, the refused state |
  | `v2.json` | `version: 2`, otherwise valid | `bundle.test.ts` |
  | `data.zip` | the account's data zip of `export.json` (4.14), binary, byte-pinned; exempt from the canonical-JSON check | `zip.test.ts`, `tests/contracts.js`, the states import case |

- `tests/contracts.js`, a new block "import bundle":
  1. `schema/import-v1.json` parses; `$id` is the URL; `properties.format.
     const === 'daggerheart-loot/lists'`; `properties.version.const === 1`;
     `additionalProperties === false` on the root, the list and the entry
     schemas; the bounds equal the database's, written as literals in the
     test (`maxItems` 50 and 100, `maxLength` 200 and 4000, `quantity`
     1..99, `price_coins` 1..99999).
  2. Every file in `docs/fixtures/import/` is canonical
     (`JSON.stringify(JSON.parse(text), null, 2) + '\n' === text`).
  3. `example.json`, `export.json` and `from-llms.json` parse, carry
     `format` and `version` 1, and use only keys the schema declares
     (walk each object against the root, list and entry `properties`).
  4. The `llms.txt` pins of 4.9 (the example verbatim, the completeness
     check).
  5. `CONTRACTS.md` and `llms.txt` both name `schema/import-v1.json`.
- The schema-drift guard, layer 1: `lib/bundle.test.ts` reads the schema
  from disk and asserts the validator's constants (`BUNDLE_FORMAT`,
  `BUNDLE_VERSION`, `LISTS_MAX`, `ENTRIES_MAX`, `NAME_MAX`, `NOTE_MAX`,
  `QTY_MAX`, `PRICE_MAX`, `ID_PATTERN`, `MONEY_MODES`, `SOURCES`) equal the
  schema's values and that each object's property names equal the
  validator's known keys.

### 4.3 `lib/bundle.ts` - the pure module

No DOM, no port (`app/src/lib/` law). Exports:

- `BUNDLE_FORMAT`, `BUNDLE_VERSION`, `LISTS_MAX` 50, `ENTRIES_MAX` 100,
  `FILE_MAX_BYTES` (5 MiB), `ID_PATTERN`, `SOURCES` (`['official']`),
  `ERRORS_MAX` 50; `NAME_MAX`, `NOTE_MAX` re-used from `cloudLists.ts`,
  `QTY_MAX` from `listLink.ts`, `PRICE_MAX` exported from `cloudLists.ts`
  (today module-local - export it).
- `toBundle(lists: readonly CloudList[], nameOf: (id: string) => string |
  undefined, untitled: string, now: Date): Bundle` - the document of 4.1
  from the store's lists, in the order given, sparse. A list whose name
  is empty or only spaces (the database allows `''`: a cleared name field
  in `ListPage` `rename()`, `move_legacy_list`'s `v.name ?? ''`, a clone
  of either) is written with `untitled` - the UI's «Без названия» /
  "Untitled" (`t.untitled`, as `CloudLists.create` fills it) - so the
  schema's `minLength` 1 holds for every export (review item
  `plan-B6.1-1`); `bundleText(b)` is
  `JSON.stringify(b, null, 2) + '\n'`; `bundleFileName(lists, now)` - the
  dated name for any call but one list, `<name>.json` for one.
- `parseBundle(text: string, knows: (id: string) => boolean): Parsed`
  where
  ```ts
  type Parsed =
    | { ok: true; lists: ImportList[]; skipped: Skipped[] }
    | { ok: false; reason: 'notJson' | 'notBundle' | 'version' | 'empty'; version?: unknown }
    | { ok: false; reason: 'errors'; errors: BundleError[]; more: number };
  /** `list` and `entry` are indexes in the file (0-based); null for the file itself or a list field. */
  interface BundleError { path: string; list: number | null; entry: number | null; field: string; value?: string; kind: 'missing' | 'type' | 'long' | 'range' | 'enum' | 'extra' | 'many'; limit?: number | string }
  /** An entry left out: `unknown` - no record with this id; `repeat` - the id is already at `first` in the same list. */
  interface Skipped { list: number; entry: number; id: string; why: 'unknown' | 'repeat'; first?: number }
  interface ImportList { name: string; money_mode: MoneyMode; player_note: string; gm_note: string; entries: ImportEntry[] }
  interface ImportEntry { item_key: string; quantity: number; price_coins: number | null; player_note: string; gm_note: string }
  ```
  Order: JSON parse (`notJson`); a plain object whose `format` equals
  `BUNDLE_FORMAT` (`notBundle`); `version === 1` (`version`, carrying the
  value found); the full walk collecting errors with their JSON path
  (`lists[2].entries[5].gm_note`), keeping the first `ERRORS_MAX` and
  counting the rest in `more`. The walk visits an object's keys in
  document order (`Object.keys` of the parsed object), then reports the
  object's `missing` required keys in the schema's `required` order after
  them; lists and entries in array order (review nit `plan-B6.1-19`); then `lists.length === 0` (`empty`; an
  empty array is not a `many`/`range` error, the schema's `minItems` 1 is
  reported as `empty`). An unknown id (`!knows(id)`) and a later
  occurrence of an id inside one list are dropped from the result and
  recorded in `skipped` with their list and entry index, in file order -
  never an error (4.13). Strings are measured in code points
  (`Array.from(s).length`). `value` is the offending value as text, cut to
  40 code points, for a `range`, `enum` or `type` error. The report's
  words (record names through `index.byId`, the field names) are the
  component's; `lib/bundle.ts` returns indexes and keys only.
- `toImportRows(lists: readonly ImportList[], newId: () => string):
  ImportRow[]` where `ImportRow` (declared in `lib/cloudLists.ts`) is
  `{ list: NewListRow; entries: EntryRow[] }` - the `create` op's shape
  without `op`; ids from `newId()`, `position` = index, `source:
  'official'`, `snapshot: null`.
- Added in `B6.2` (pass 5; the report of mock `m07` names a refused
  file's lists and entries, which the error records alone cannot):
  - the `errors` result gains `names: (string | null)[]` - per list index
    of the file's `lists` array, the list's `name` when it is a string
    (any length), else null; an empty array when `lists` is not an array;
  - `BundleError` gains `item?: string` - for an error inside an entry,
    that entry's `id` when it is a string matching `ID_PATTERN`, read before
    the walk of the entry's keys (so an error on a key before `id` carries
    it too); absent otherwise. `At` carries it to `fieldError` and
    `notObject`;
  - `overBounds(b: Bundle): { many: boolean; long: string[] }` - `many`
    when `b.lists.length > LISTS_MAX`; `long` the names of the lists whose
    `entries.length > ENTRIES_MAX`, in file order (4.15);
  - `dataFileName(now: Date): string` -
    `daggerheart-loot-data-<YYYY-MM-DD>.zip` in local time, the day part
    shared with `bundleFileName`.

`lib/bundle.test.ts`: every branch of `parseBundle` (each reason, each
error kind with its path, the cap and `more`, code-point length, the
skips), the round trip `toBundle` -> `bundleText` -> `parseBundle` (one
case with a list named `''` and one named `'   '`: both export as
«Без названия» and import clean), the
fixtures (`example.json` and `from-llms.json` ok with no skips and every
id known to `data.json`; `export.json` equal byte for byte to
`bundleText(toBundle(gm1 lists, ru names, fixed date))`; `unknown-id.json`
ok with `skipped` `[{ list: 0, entry: 3, id: 'zzz1', why: 'unknown' }, {
list: 0, entry: 4, id: 'ci1', why: 'repeat', first: 0 }]`; `errors.json` the four
errors in file order; `v2.json` reason `version` 2), the `llms.txt`
example parse (4.9), the drift guard, the file names.

### 4.4 Validation, limits and the messages

| Case | Where caught | What the reader sees (RU; EN in parity) |
|---|---|---|
| File over 5 MiB (`File.size`) | the panel, before reading | «Файл больше 5 МБ.» |
| Not JSON | `parseBundle` | «Это не файл JSON.» |
| No `format` or another value | `parseBundle` | «Это не файл списков: нет поля format со значением daggerheart-loot/lists.» |
| `version` not 1 | `parseBundle` | «Неизвестная версия формата: %s. Приложение читает версию 1.» (`%s` the value as JSON; no `version` key: «В файле нет поля version. Приложение читает версию 1.», pass 5) |
| Field errors | `parseBundle` | «В файле ошибки - ничего не импортировано. Исправьте их и выберите файл снова.», then a report grouped by list (mock `m07`): the file's own errors first, then one block per list with errors, headed «N. <name cut to 40>» («N. (без названия)» when the name is missing); each line names the field in words («Название», «money_mode», «Позиция 2, Палаш (`q1`): quantity 0»), the reason («обязательное поле отсутствует», «неверный тип», «длиннее %n символов», «значение вне диапазона %r», «допустимые значения - %r», «неизвестное поле %s», «больше %n элементов») and the JSON path in mono; at most ten lines per list, then «...и ещё %n в этом списке»; past `ERRORS_MAX` «...и ещё %n ошибок» |
| More than 50 lists or 100 entries in one list | `parseBundle` (`many`) | a line in the file block («Списков больше 50») or in the list's block («Позиций больше 100») |
| No lists | `parseBundle` | «В файле нет списков.» |
| Unknown or retired catalog id | `parseBundle`, skipped | the preview's report grouped by list (mock `m06`): «Позиция 4, `zzz1`: пропущена - такой записи нет в данных»; a list whose every entry is unknown imports empty and says so; the head line «Пропущено позиций: %n» |
| A repeated id inside one list | `parseBundle`, the later one skipped | «Позиция 5, Первоклассный Спальный Мешок (`ci1`): пропущена - уже есть в позиции 1» |
| A list name the account already holds | the panel, against `cloudLists.lists` | «Список с таким названием уже есть в аккаунте - появится второй» in that list's block; never a refusal (4.13) |
| The account would pass its limits | the database (`lists_limit`, `list_entries_limit`), whole call refused | the limit toast through `limitText`; nothing is imported; the preview stays |
| No network, 5xx, the write timeout | `written()` -> `network` | `t.accountFailed`; the preview stays, the button is enabled again; the next press resends the same rows |
| Any other refusal (23514, 42501, 22023) | `refused` | the same toast; the preview stays |

The client validator applies the schema's bounds; the account's count
limits are the database's (decision 31: a per-user override may raise
them). The migration exemption from limits (R5) does not apply to import.
Partial import is never done (Q1).

### 4.5 Import: ids, the RPC, atomicity, idempotency, the feed

- **New ids always.** The client makes a UUID for every list and entry
  (`ListRepository.newId()`); a retry sends the same rows, so it cannot
  duplicate (`on conflict (id) do nothing`); a file imported twice on
  purpose makes a second copy (create-only).
- **`import_lists(p_lists jsonb) returns integer`** (lists inserted),
  migration `supabase/migrations/<ts>_import_lists.sql` (`<ts>` later
  than every file in `supabase/migrations/` when `B6.1` starts - R4's
  lands first `[R4]`), reversal `supabase/reversals/<ts>_import_lists.sql`
  (`drop function public.import_lists(jsonb);`). `security invoker`, `set
  search_path = public, pg_temp`; `revoke execute ... from public, anon`,
  `grant execute ... to authenticated`. Reason for invoker: the function
  writes only the caller's rows, so row level security, the insert
  policies and the limit triggers apply as to a plain write - the
  `apply_list_writes` pattern (R5); `definer` would bypass RLS and need
  its own owner checks. Body, in order:
  1. `auth.uid() is null` -> 28000 `import_lists: not signed in`.
  2. `p_lists` null, not an array, or over 50 elements -> 22023
     `import_lists: not a list of at most 50 lists`.
  3. For each element in array order: not an object, `list` not an
     object, `entries` not an array, or `entries` longer than 5000 -> 22023
     `import_lists: invalid list` (the 5000 bound is `apply_list_writes`
     own: the AFTER ROW limit trigger raises only after the whole insert
     and every `list_entries_touch` update ran, so without it one huge
     array costs the whole statement timeout; under it the trigger still
     answers `limit: entries_per_list` with the account's own limit, an
     override included; review item `plan-B6.1-6`); `v_id := (v_item #>> '{list,id}')::uuid`;
     `insert into public.lists (id, owner_id, name, money_mode,
     player_note, gm_note) select v_id, auth.uid(), x.name, x.money_mode,
     x.player_note, x.gm_note from jsonb_to_record(v_item -> 'list') as
     x(name text, money_mode text, player_note text, gm_note text) on
     conflict (id) do nothing`; `found` -> count it; else, when `not
     exists (select 1 from public.lists l where l.id = v_id)` (row level
     security hides another owner's row) -> 42501 `import_lists: the id
     belongs to another list`; else it is the caller's (a retry) - go on.
  4. `insert into public.list_entries (id, list_id, item_key, source,
     snapshot, position, quantity, price_coins, player_note, gm_note)
     select x.id, v_id, x.item_key, x.source, x.snapshot, x.position,
     x.quantity, x.price_coins, x.player_note, x.gm_note from
     jsonb_to_recordset(v_item -> 'entries') as x(id uuid, item_key text,
     source text, snapshot jsonb, position integer, quantity integer,
     price_coins integer, player_note text, gm_note text) on conflict (id)
     do nothing` - the same column list as `apply_list_writes`.
  5. Return the count. No exception handler: the table checks (23514,
     23502), the unique `(list_id, item_key)` (23505) and the limit
     triggers (P0001 `limit: <key>`) unwind the whole call.
  `source` and `snapshot` pass through, so R7's `import_bundle` calls
  `import_lists` unchanged (R7 plan section 4.8).
- **Realtime (R3, in this tree).** The deferred `lists_broadcast` trigger
  sends one owner message per inserted list at the import's commit (with
  the final revision) and nothing when the call is refused. The call
  carries the tab header `[B3.2]` (`x-dhloot-tab` on every PostgREST
  request), so the importing tab ignores its own echoes and the other
  devices coalesce the N messages into one re-read (250 ms). A 50-list
  import is 50 sends plus one delivery per subscribed device - inside the
  free plan's 100 messages per second for up to one other device; past
  that Realtime may drop the connection, the feed goes `down`, the poll
  and the rejoin's refetch cover it (R3 plan 6.2). Accepted; named in
  section 12.
- **Port.** `ListRepository.import(lists: ImportRow[]): Promise<ListWrite>`
  (`types.ts`), doc line: "Inserts every list and entry in one transaction
  (`import_lists`), or nothing; a list id already the caller's is a retry
  and adds only its missing entries." Real (`supabase.ts`): `import:
  (rows) => written(() => client.rpc('import_lists', { p_lists: rows }))`,
  wrapped in B3.2's `timed()` helper (D2) with its own bound,
  `IMPORT_TIMEOUT_MS = 120_000`: the 20 s `WRITE_TIMEOUT_MS` exists to
  unstick the write buffer, which an import never enters, and a 5 MiB
  body on a 1 Mbit/s uplink needs about 40 s (review item
  `plan-B6.1-5`). A statement timeout (`57014`, HTTP 500) is not a
  network failure for an import - the same call would fail again - so the
  adapter's `import` maps it to `{ ok: false, error: 'refused' }` with a
  new `reason: 'tooSlow'` on `ListWrite`'s refused branch (optional, only
  `import` sets it); the panel then shows «Файл слишком большой для одного
  импорта: разделите его на несколько.» (`importTooSlow`; one word,
  `tooSlow`, because `importTooBig` already names the 5 MB file refusal -
  review nit `plan-B6.1-2-N3`). `writeOf`
stays as it is for every other write. Lazy (`lazy-cloud.ts`): forwards as `apply` does; a chunk that
  fails answers `network`. Fake (`fake-cloud.ts`): offline or signed out
  -> `NETWORK`; `rows.length` over 50 -> `REFUSED` (the function's 22023);
  else deep-copy the owner's `Held[]`, run `createList(copy,
  row.list, row.entries)` per row in order; the first non-ok answer is
  returned and the owner's array is left as it was; all ok -> replace the
  array's contents with the copy and answer `OK`. The fake sends one owner
  message per list the call inserted `[B3.2]`, through the helper its
  `apply` uses (`by` = the fake's tab).
- **Contract case** (`cloud.contract.ts`, a function `importCases(port,
  assert, log)` run on the doomed user after case I, before E; its letter
  is the next free one after `B3.2`'s J and R4's requests case `[B3.2]`
  `[R4]`):
  1. Import two lists (one with two entries carrying quantity, price and
     both notes, one empty); read back names, money mode, notes and entry
     order; import the same rows again -> `ok`, the count of lists
     unchanged.
  2. Atomicity: two new lists, the second with 101 entries -> `limit` /
     `entries_per_list` / 100, and the first list does not exist.
  3. Remove every list the doomed user holds (`apply` of `remove` ops),
     then import 50 lists of 100 entries (ids `r0000`...; the database does
     not know the catalog) -> `ok`, timed and logged as `contract: import
     of 50 lists of 100 entries: <ms> ms`, under `IMPORT_MS` 6000 (the
     hosted `authenticated` statement timeout is 8 s; `COVERAGE.md` names
     it for the move case).
  4. One more list -> `limit` / `lists_per_owner` / 50, nothing inserted.
  5. Remove the 50.
  6. Notes-heavy body (review item `plan-B6.1-5`): 50 lists of 100
     entries whose two notes are 480 Cyrillic characters each (about
     5 MB of JSON, near `FILE_MAX_BYTES`) -> `ok`, timed and logged as
     `contract: import of a 5 MB file: <ms> ms`, under `IMPORT_MS`; then
     remove the 50. On the fake it only proves the shape; on the test
     project it measures the body limit and the statement time.
- **Store.** `CloudLists.import(rows: ImportRow[]): Promise<ListWrite>`:
  `await this.flushNow()` first (the database counts the buffered creates
  against the limit, and the re-read is not deferred behind the buffer);
  then the port call; an answer after `clear()` (the `#epoch` moved) is
  dropped as `network`; on `network` it re-reads (`#pull`) and, when
  every list id of the call is in the read, answers `ok` - the call
  committed and only its answer was lost, so the panel must not offer a
  retry that would re-insert entries deleted meanwhile (review item
  `plan-B6.1-9`); on `ok`, `await this.#pull()` - not `load()`,
  which draws «Загружаем...» over the index `[B3.2]` (R3 plan S5: `#read`
  keeps each list's revision). Not queued, not optimistic, no toast (the
  panel toasts). `AppState.exportLists(ids?: string[])` builds the bundle
  from `cloudLists.lists` (all, or the given ids in the store's order),
  names entries through `index.byId` and `lang`, and calls
  `env.image.download(new Blob([text], { type: 'application/json' }),
  name)`; a rejected download toasts `t.accountFailed`.
  `AppState.exportData()` is the account's generic export (4.14): it
  loads `lib/zip.ts` with a dynamic `import()`, packs the bundle of every
  list as `lists.json` into a store-only zip, and downloads
  `daggerheart-loot-data-<date>.zip` (`application/zip`); R7 adds
  `homebrew.json` there.

### 4.6 The UI (mocks `m01`-`m18`)

| Mock | State | Where below |
|---|---|---|
| `m01-lists-index.html` | the index: selectable account cards, the strip idle, «Импорт из файла» in «Новый список», the new count line | index, 4.10, 4.11 |
| `m02-lists-selected.html` | two lists ticked: «Скачать JSON (2)», «Удалить (2)»; the 360 px strip puts the actions on their own line | index, 4.10 |
| `m03-list-count.html` | the count before (the roll number's gold box) and after (the meta line) | 4.11 |
| `m04-import-empty.html` | the import field open, no file; the schema and `llms.txt` links | `ImportPanel`, 4.12 |
| `m05-import-preview.html` | a clean file: the preview and the confirm button | `ImportPanel` |
| `m06-import-skips.html` | the skip report grouped by list: an unknown id, a repeat, a name the account holds | 4.4, 4.13 |
| `m07-import-field-errors.html` | a refused file: the error report grouped by list | 4.4 |
| `m08-import-one-line.html` | the one-line refusals (version; too big, not JSON, not a data file, no lists) | 4.4 |
| `m09-import-sending.html` | the press: both buttons disabled | 4.5 Store |
| `m10-import-done.html` | field folded, new list first, the toast | `ImportPanel` |
| `m11-import-limit.html` | the limit refusal: the toast, the preview stays | 4.4 |
| `m12-account-your-data.html`, `m13-account-your-data-states.html` | «Ваши данные» with «Скачать мои данные (ZIP)»; loading and failed | `#/account`, 4.14 |
| `m14-list-page-button.html` | «Скачать JSON» in the action row, R4's panel below it; the entry strip drawn by the extracted `BatchBar` | list page |
| `m15-llms-section.html` | `llms.txt`: the new section and the edits, the `#/l/` guidance removed | 4.9 |
| `m16-batch-delete-confirm.html` | «Удалить (2)»: the browser's confirm | 4.10 |
| `m17-batch-deleted.html` | the cards gone, the toast «Удалено списков: 2» | 4.10 |
| `m18-batch-delete-refused.html` | one removal refused by the server: the list is drawn again, one toast | 4.10 |

- **Lists index** (`ListsPage.svelte`), signed in, `cloud.status ===
  'ready'`, the account group only (browser lists get no pick box):
  - each account card carries a pick box in its top corner (`ListCard`
    gains an optional `picked`/`onpick` pair; the box is a `<label>` with
    a checkbox outside the card's link, `aria-label` «Выбрать: <name>»,
    a 44 px target); a picked card takes the gold border of the strip's on
    state;
  - under «Ваш аккаунт», above the grid, the selection strip `BatchBar`
    (4.10): «Выбрать все» with the mixed state, the live summary «Выбрано
    N», and while N > 0 the actions «Скачать JSON (N)»
    (`app.exportLists(ticked)`, the selection stays) and «Удалить (N)»
    (4.10). «Выбрать все» ticks the drawn cards only (the search filter
    and «Показать ещё» decide what is drawn), so nothing out of sight is
    deleted;
  - the selection lives in the page (`SvelteSet` of list ids, as the list
    page's `lsel`), is cleared on leaving the route, and is kept a subset
    of the drawn account cards at all times (pass 5, Risk 9): a search, a
    fold back to 24, a re-read without the list, or a sign-out drops the
    ticks that leave the view.
- **Import** (`ImportPanel.svelte`, used once): «Импорт из файла» - a
  ghost `sm` button with a caret and `expanded` in the «Новый список»
  panel under the name row (an import makes new lists); it opens a second
  `Field` «Импорт из файла JSON» (the mocks' caption, pass 5) inside the
  same panel. «Выбрать файл...» is a `Button` whose press clicks a
  `hidden` `<input type="file" accept=".json,.zip,application/json,application/zip">`
  (pass 5: `Button`'s look is scoped to `Button.svelte`, so a `<label>`
  cannot take it; the drawing is the same); the file name beside it; the
  size check; the bytes (`file.arrayBuffer()`; jsdom 30 has it, checked
  2026-09-28, so there is no fallback); a file
  that starts with `PK\x03\x04` goes through `readDataZip` (4.14) to its
  `lists.json` text, anything else is decoded as UTF-8 text; then
  `parseBundle` with `index.byId.has`; on `ok`
  the panel builds `rows = toImportRows(lists, () => repo.newId())` once
  and keeps them with the preview «Списков: N, позиций: M.» («Пропущено
  позиций: K.» when any) and the report grouped by list (4.4, 4.13),
  «Импортировать (N)» primary and «Отмена» ghost; else the error report
  (`role="alert"`), «Отмена» only. The press disables the buttons and
  awaits `app.cloudLists.import(rows)`; `ok`: fold, forget the rows, toast
  «Импортировано списков: N»; `limit`: the limit toast; else
  `t.accountFailed`; the preview and the same `rows` stay for a retry. A
  new file choice builds new rows. Hint with the two links of 4.12: «Файл
  JSON, сохранённый кнопкой «Скачать JSON» или собранный по [схеме
  import-v1] ([описание для ИИ-помощников]), или архив ZIP из «Скачать мои
  данные». Списки добавятся как новые; существующие не изменятся.» (keys
  `importHintBefore`, `importSchema`, `importHintMid`, `importLlms`,
  `importHintAfter`).
- **`#/account`**, signed in: a panel «Ваши данные» between «Способы
  входа» and «Выход» (decision 14's order; R5b's Display section stays
  first): the hint «Всё, что хранится в аккаунте, одним архивом ZIP:
  сейчас в нём файл lists.json с вашими списками. Архив можно
  импортировать в другой аккаунт на странице «Списки».» and «Скачать мои
  данные (ZIP)» (`app.exportData()`, file
  `daggerheart-loot-data-<YYYY-MM-DD>.zip`; 4.14), disabled while
  `cloudLists.status` is not `ready`; on `error` the line
  `t.cloudLoadFailed` and «Повторить». Import is not here.
- **List page**, an account list only: «Скачать JSON» after «Скопировать
  текст», before «Печать» (`app.exportLists([id])`, file `<name>.json`).
  R4's `RequestsPanel` sits below the row `[R4]`. The entry strip is drawn
  by `BatchBar` with no visible change (4.10).
- **Texts**: every string in `dict.ts`, RU and EN (pass 5: the complete
  list, review nit `plan-B6.1-2-N4`). A `|` separates plural forms, as
  `itemsN` does. Placeholders: `%n` a number, `%s` a text, `%l` the lists
  count, `%f` a field name, `%v` a value (cut to 40 code points by
  `lib/bundle.ts`). The count rule of 4.15 holds for every line: no number
  of three or more digits directly before «позици», `entries` or
  `records` (EN says "items").

  | Key | RU | EN |
  |---|---|---|
  | `exportJson` | Скачать JSON | Download JSON |
  | `exportOverBounds` | Этот файл нельзя импортировать целиком. | This file cannot be imported whole. |
  | `exportManyLists` | В нём больше 50 списков: экспортируйте их частями. | It holds more than 50 lists: export them in parts. |
  | `exportLongLists` | В списках %s позиций больше 100: разделите такие списки. | Lists with more than 100 items: %s. Split those lists. |
  | `yourData` | Ваши данные | Your data |
  | `yourDataHint` | Всё, что хранится в аккаунте, одним архивом ZIP: сейчас в нём файл lists.json с вашими списками. Архив можно импортировать в другой аккаунт на странице «Списки». Импорт принимает до 50 списков, а в одном списке позиций - не больше 100. | Everything your account holds, in one ZIP archive: today it holds lists.json with your lists. You can import the archive into another account on the Lists page. An import takes up to 50 lists, and up to 100 items in one list. |
  | `exportData` | Скачать мои данные (ZIP) | Download my data (ZIP) |
  | `pickList` | Выбрать: %s | Select: %s |
  | `deleteListsConfirm` | Удалить списки (%n): %s? Ссылки для игроков и мастера на них перестанут работать. Отменить удаление нельзя. | Delete %n lists: %s? Their player and GM links will stop working. This cannot be undone. |
  | `listsDeleted` | Удалено списков: %n | Lists deleted: %n |
  | `quoted` | «%s» | "%s" |
  | `andMore` | и ещё %n | and %n more |
  | `importOpen` | Импорт из файла | Import from file |
  | `importHead` | Импорт из файла JSON | Import from a JSON file |
  | `importPick` | Выбрать файл... | Choose a file... |
  | `importHintBefore` | Файл JSON, сохранённый кнопкой «Скачать JSON» или собранный по&#32; | A JSON file saved with "Download JSON" or written to the&#32; |
  | `importSchema` | схеме import-v1 | import-v1 schema |
  | `importHintMid` | &#32;( | &#32;( |
  | `importLlms` | описание для ИИ-помощников | a description for AI assistants |
  | `importHintAfter` | ), или архив ZIP из «Скачать мои данные». Списки добавятся как новые; существующие не изменятся. | ), or the ZIP archive from "Download my data". The lists are added as new ones; the lists you have do not change. |
  | `importPreview` | Списков: %l, позиций: %n. | Lists: %l, items: %n. |
  | `importSkippedN` | Пропущено позиций: %n. | Items skipped: %n. |
  | `importWillN` | %n позиция будет импортирована\|%n позиции будут импортированы\|%n позиций будут импортированы | %n item will be imported\|%n items will be imported |
  | `importListEmpty` | без позиций | no items |
  | `importNoName` | (без названия) | (no name) |
  | `importPos` | Позиция %n | Item %n |
  | `importSkipUnknown` | пропущена - такой записи нет в данных | skipped - the data has no such record |
  | `importSkipRepeat` | пропущена - уже есть в позиции %n | skipped - already at item %n |
  | `importNameTaken` | Список с таким названием уже есть в аккаунте - появится второй | Your account already has a list with this name - there will be two |
  | `importZipOther` | В архиве есть файлы, которые эта версия не читает: %s. | The archive holds files this version does not read: %s. |
  | `importGo` | Импортировать | Import |
  | `importDone` | Импортировано списков: %n | Lists imported: %n |
  | `importTooBig` | Файл больше 5 МБ. | The file is larger than 5 MB. |
  | `importTooSlow` | Файл слишком большой для одного импорта: разделите его на несколько. | The file is too large for one import: split it into several. |
  | `importNotJson` | Это не файл JSON. | This is not a JSON file. |
  | `importNotBundle` | Это не файл списков: нет поля format со значением daggerheart-loot/lists. | This is not a lists file: it has no "format" field with the value daggerheart-loot/lists. |
  | `importVersion` | Неизвестная версия формата: %s. Приложение читает версию 1. | Unknown format version: %s. The app reads version 1. |
  | `importNoVersion` | В файле нет поля version. Приложение читает версию 1. | The file has no "version" field. The app reads version 1. |
  | `importEmpty` | В файле нет списков. | The file holds no lists. |
  | `importZipNoLists` | В архиве нет файла lists.json. | The archive has no lists.json. |
  | `importZipManyLists` | В архиве несколько файлов lists.json: распакуйте его и выберите нужный. | The archive holds more than one lists.json: unzip it and choose the one you need. |
  | `importZipPacked` | Архив сжат другой программой: распакуйте его и выберите lists.json. | Another program compressed this archive: unzip it and choose lists.json. |
  | `importNotZip` | Это не архив данных. | This is not a data archive. |
  | `importErrors` | В файле ошибки - ничего не импортировано. Исправьте их и выберите файл снова. | The file has errors - nothing was imported. Fix them and choose the file again. |
  | `importFieldName` | Название | Name |
  | `importErrMissing` | %f: обязательное поле отсутствует | %f: a required field is missing |
  | `importErrName` | Название: пустое или отсутствует | Name: empty or missing |
  | `importErrType` | %f «%v»: неверный тип - нужен %s | %f "%v": wrong type - expected %s |
  | `importErrNotObject` | «%v»: неверный тип - нужен объект JSON | "%v": wrong type - expected a JSON object |
  | `importErrId` | id «%v»: не id записи - только латинские буквы, цифры, _ и -, до 64 символов | id "%v": not a record id - Latin letters, digits, _ and - only, up to 64 characters |
  | `importErrLong` | %f: длиннее %n символов | %f: longer than %n characters |
  | `importErrRange` | %f %v - значение вне диапазона %s | %f %v - out of the range %s |
  | `importErrEnum` | %f «%v»: допустимые значения - %s | %f "%v": allowed values - %s |
  | `importErrExtra` | неизвестное поле %f | unknown field %f |
  | `importErrManyLists` | Списков больше %n | More than %n lists |
  | `importErrManyEntries` | Позиций больше %n | More than %n items |
  | `importErrMoreList` | ...и ещё %n в этом списке | ...and %n more in this list |
  | `importErrMore` | ...и ещё %n ошибка\|...и ещё %n ошибки\|...и ещё %n ошибок | ...and %n more error\|...and %n more errors |

  `&#32;` in the table is one space at the end or the start of the text
  (the consent line's `consentBefore`/`consentTerms` pattern: the hint's
  two links sit between three texts). Reused: `pickAll`, `selected`,
  `cancel`, `retry`, `del`, `untitled`, `accountFailed`,
  `cloudLoadFailed`, `limitLists`, `limitEntries` (through `limitText`),
  `itemsN`, `writeRefused`. Dropped in pass 5: `listMeta` (the card joins
  count and edit time with `' · '` in code, as `i18n.ts` and the list
  page's sub do), `exportSelected` and `importHint` (`exportJson` and
  `importGo` take ` (N)` in code, as `t.del` does on the list page).
- **Help** (`help.ts` `LISTS`): one paragraph appended, RU «Списки
  аккаунта можно отметить и скачать файлом JSON или удалить разом, а
  «Импорт из файла» добавляет списки из такого файла - например, чтобы
  перенести их в другой аккаунт. Формат файла описан для ИИ-помощников в
  llms.txt.» / EN "Tick account lists to download them as a JSON file or
  delete them together; «Import from file» adds lists from such a file -
  to move them to another account, for example. The file format is
  described for AI assistants in llms.txt."

### 4.7 Layer 2, layer 4 and the harness

- `tests/app/driver.js`: `prepare()` installs `window.__download = null`
  and wraps `HTMLAnchorElement.prototype.click` - an anchor with a
  `download` name records `{ filename, blob }` (the blob kept from a
  wrapped `URL.createObjectURL`) and does not navigate; the verb
  `download()` returns `{ filename, type, base64 }` or null (pass 5: one
  shape for the JSON and the zip; a case decodes with `Buffer.from(base64,
  'base64')`). The verb `upload(path)` sets the page's one
  `input[type=file]` through `elementHandle.uploadFile(path)` (CDP
  `DOM.setFileInputFiles`, which ignores `hidden`) and settles. The
  driver accepts every `confirm()` and keeps its message (`d.dialog()`), so
  a browser case can press «Удалить (N)» and read the confirm; the
  «Отмена» answer is a component test.
- `tests/app/inventory.js`, all `as gm1` on `#/lists`: `~ lists
  selected` (two ticked, `m02`); `~ import panel` (`m04`); `~ import
  preview` (`unknown-id.json`, `m06`); `~ import refused` (`errors.json`,
  `m07`); `~ imported` (`example.json`, press, `m10`; `timed`); `~ lists
  deleted` (two ticked, confirm answered yes, `m17`; `timed`). Each new id
  ends in ` as gm1`. Re-seeded: the 26 ids of section 9, "Golden ids" (pass
  5 listed them from `inventory.js`: every `#/lists` state that draws a
  card or the account group ready, `#/lists ~ help`, every account list
  page, the four signed-in `#/account` states).
- `tests/app/states.js`, cases 58-62 (`states.js` ends at 57 on `main`,
  delta line D5; pass 5 fixed the numbers and the shapes; section 9 step
  12 has each case's exact steps): 58 export of two ticked lists; 59 the
  account's zip, read back through the import field, and `data.zip`
  previewed; 60 an import opened as a list; 61 batch deletion, read back
  from the fake (`d.fake('lists.list')`, case 41's pattern - a reload
  re-seeds the fake, so it cannot show the rows gone); 62 the selection
  pruned by a search and «Выбрать все» over the drawn cards only.
- E2E flow F13 (`tests/e2e/flows.mjs`; F12 is R4's, delta line D5): the member on `#/lists` uploads
  `example.json`, presses «Импортировать (1)», waits for the toast;
  `listsOf(admin, member)` shows one list «Лавка кузнеца» with `ci1`,
  `q1`, `q313` in that order, `ci1` at quantity 2 and 150 coins; then the
  member ticks it and one more list made by the flow, «Удалить (2)», the
  confirm answered yes, and `listsOf` shows none; `deleteListsOf` before
  and after.

### 4.8 Seams with the other releases

| Release | Seam | Rule |
|---|---|---|
| R3 `B3.1` (in tree) | the deferred `lists_broadcast` trigger | an import of N lists sends N owner messages at commit, none when refused; a layer 3 case proves both (section 8, step 7) |
| R3 `B3.2` (on `main`, not in tree) | `ListRow.revision`, `CloudPort.events`, the tab header on PostgREST requests (S1), the 20 s write timeout (S7), the fake's owner sends and `live` option (S9), `CloudLists`' `#read` with revision (S5), contract case J, states 52-53, flow F11 | `import` rides the header and the timeout like every write RPC; the fake's `import` sends one owner message per inserted list; the store re-reads through `#pull`; case, state and flow numbers follow B3.2's. Delta check lines D1-D6 |
| R4 (re-planned, ships before R6) | `CloudPort.requests`, the fake's requests and `__dhlootFake.request`/`decide`, a requests contract case, `RequestsPanel` under the list page's action row, `ListCard`'s pending line, a migration, new states and flows | nothing of R4 is in the file (`llms.txt` says so); R6's migration sorts after R4's; numbers follow R4's; «Скачать JSON» stays in the action row above R4's panel. Delta check lines D7-D9 |
| R5 (shipped) | the write buffer, `move_legacy_list`, the limits exemption, `legacy_fingerprint` | import is its own RPC beside `apply`; the store flushes first; import never sets `legacy_fingerprint` and gets no exemption |
| R5b (shipped) | `#/account` Display section first, the account menu | «Ваши данные» sits between «Способы входа» and «Выход»; the menu gains nothing |
| R11 (shipped) | the nightly usage report (`realtime_rows_24h`, row counts) | an import adds at most 50 lists, 5000 entries and 50 owner messages per press; nothing to add |
| `display-settings` (shipped) | `Prefs` is the one source of defaults | preferences are not in the file |
| R7 (after R6) | bundle v2: `version` 2, `homebrew` array, entries with `source: homebrew` and a frozen `snapshot`, `schema/import-v2.json`, `import_bundle(p_items, p_lists)` calling `import_lists` | v1 stays published and importable for good; v1's validator refuses `version` 2 and `source: "homebrew"`; `import_lists` keeps its signature and return type; `format` stays `daggerheart-loot/lists`; the account's data zip (4.14) gains `homebrew.json` with its own format and schema beside `lists.json` - R7's plan puts a `homebrew` array inside the lists bundle, and its refresh moves it to the zip file; the control stays |
| R10 (after the cutoff) | the `#/l/` codec, `docs/fixtures/lists/`, `CONTRACTS.md` section 3 | R6 already removed the `#/l/` guidance from `llms.txt` (4.9); R10 removes the rest |

### 4.9 `llms.txt` - a first-class deliverable, and its proof

Owner, 2026-09-27: "pay additional attention to modifying llms.txt to
unblock AI users". The acceptance is: an AI assistant that reads only
`llms.txt` (and `catalog.csv`, which `llms.txt` sends it to) writes a file
the site imports with no error and no skipped id, and reads an export
correctly.

**Import files only** (owner, 2026-09-27: "should we delete old
guidelines on how to create urls with items? ... llms should know only
about new one"). `llms.txt` stops teaching `#/l/` links in `B6.1`,
whatever the date: the format is retired (R5), stops opening on
2026-10-26 and R10 removes the codec.

| Part of `llms.txt` | R6 does | Why |
|---|---|---|
| "List links" (the payload, `stamp` and its code, the note separators, "How long the link gets", `unpack` with deflate-raw, the `Blacksmith of Redmarch` example) | removed whole | the retired way; an agent that learns it builds links that stop opening |
| "The two notes" (a subsection of "List links") | kept as its own `##` section, reworded for a file (both notes travel in a file; players read the player note through a share link) | notes are half of what a list is for; `tests/derived.js` pins "Player note" and "GM note" |
| "Read this first" item 2 (a list link is base64 you decode) | rewritten: the fragment never leaves the browser, a `#/s/<token>` is opaque | the rule stays true for share links |
| "Read this first" item 3 (an invented id drops an entry from a link) | reworded for a file | same rule |
| "Read this first" | a fourth item: a list for a GM is a file; do not build `#/l/` links (retired, stop opening on 2026-10-26) | the date stays pinned (`tests/derived.js` "legacy write cutoff", `tests/contracts.js`) |
| URL grammar `#/l/<payload>` | one line: retired, do not build; a person holding one opens it, saves it to the account ("Сохранить себе") and sends an export | an agent may still meet an old link |
| URL grammar, the rest (`#/roll/...`, `#/tables/...` with filters, `#/print/<ids>`, `#/i/<id>`, `#/search`, `#/s/<token>`, `#/account`) | kept; `#/lists` added; `#/account` gains "download my data"; one line names the English interface `.../daggerheart-loot/en/` | these routes still work and need no storage; `#/print/<ids>` is how an agent hands over a printable sheet; `tests/contracts.js` pins `daggerheart-loot/en/` |
| "What this site cannot do" | the lists sentence names the file as the way into an account and says the agent cannot import it | - |
| New "Lists as a file (import-v1)" | after "URL grammar" | the section below |

Pins that move in the same commit: `tests/derived.js`'s `llms.txt` list
loses `stamp`, `deflate-raw` and "Do not invent a compression scheme",
and its worked-example check (the `items`/`stamp`/`payload`/`notes`
regexes, about 50 lines) is deleted; it keeps `#/l/` (the retirement
line), `Player note`, `GM note` and the rest. `tests/contracts.js` keeps
its `2026-10-26`, `#/s/<token>`, `i/en/<id>.html` and
`daggerheart-loot/en/` checks; its list-encoding block reads
`docs/fixtures/lists/`, not `llms.txt`, and stays until R10. The
`docs/fixtures/lists/` fixtures stay (the codec is still frozen until
R10). `CONTRACTS.md`: the opening sentence becomes "an agent reading
`llms.txt` has to be able to build a working address or import file";
section 3 gains "`llms.txt` no longer documents building a `#/l/` link
(R6); an agent writes an import file (section 4)". `app/index.html`'s
`<noscript>` drops "формат ссылки на список" and "a list link keeps its
contents after the #": it names `llms.txt` as "что это за сайт, адреса и
формат файла списков" and lists the schema.

**Draft text.** `mocks/m15-llms-section.html` holds the whole new section
and every edit above as plain text; `B6.1` starts from it. The list below
is the content that text must keep.

**The section's content** (`B6.1` writes it in this order; English; the
Russian UI labels in «» with the English label beside them):

1. What it is: the only way to hand a GM a list; a signed-in GM loads
   lists from a JSON file with «Импорт из файла» / "Import from file" in the «Новый список» / "New list" panel on `#/lists`; every
   list is added as a new one, nothing in the account changes. «Скачать
   JSON» on a list or on selected lists writes this format; «Скачать мои
   данные (ZIP)» on `#/account` writes a zip whose `lists.json` is this
   format; import takes either the JSON file or that zip. Hand a GM a
   JSON file, never a zip.
2. The schema URL, and that the site checks every file against it before
   importing: every key and value is checked; a key the schema does not
   name is an error, not ignored (write `quantity`, never `qty`).
3. "A complete file": one fenced ```` ```json ```` block holding
   `docs/fixtures/import/example.json` verbatim.
4. "The fields": one table - key, required, value - naming every key of
   the schema (`$schema`, `format`, `version`, `exported_at`, `lists`,
   `name`, `money_mode`, `player_note`, `gm_note`, `entries`, entry `id`,
   entry `name`, `source`, `quantity`, `price_coins`, the entry notes)
   with its bound, its default and its meaning: `format` exactly
   `daggerheart-loot/lists`; `version` exactly `1`; 1 to 50 lists; name 1
   to 200 characters; `money_mode` `bag` (default) or `coin`, with a
   pointer to "Money"; notes up to 4000 characters, with a pointer to "The
   two notes"; `entries`: 0 to 100 (`[]` for an empty list); `id` a
   `catalog.csv` id; entry `name` optional and ignored; `source` only
   `official`; `quantity` 1 to 99, default 1; `price_coins` whole coins 1
   to 99999, key left out for no price - never `null` or `0`.
5. "What the site does with a file" (a list): characters are Unicode
   code points; an `id` not in `catalog.csv` is skipped and named to the
   GM with its list and position before the import, the rest imports;
   the same id twice in one list keeps the first and names the second; a
   list may share its name with a list in the account or in the file;
   any other error refuses the whole file and names each error by list,
   position and path (`lists[0].entries[2].quantity`); an account holds
   at most 50 lists, and at most 100 per list, and a file that would pass
   that imports nothing; a file is at most 5 MB; importing the same file
   twice makes two copies (a file carries no list ids, so nothing is
   matched or overwritten).
6. "What a file never carries": list ids, share links, purchase requests,
   settings, edit dates; the two notes always travel together - a file is
   the GM's own; players get a share link.
7. "How to hand it over": one ```` ```json ```` code block with the whole
   file, never split across messages; tell the GM to save it as
   `<list name>.json` and press «Импорт из файла» / "Import from file" on the Lists page;
   before handing it over, check every `id` against `catalog.csv` and
   every key against the table.
8. "Reading an export": the same format; lists in the order the account
   shows them (newest edit first); an entry's `name` is the record's name
   in the site's language at export time - the `id` finds the rest in
   `catalog.csv`; `price_coins` is coins whatever `money_mode` says;
   defaults are left out, so a missing `quantity` is 1 and a missing note
   is empty.

**The proof** (three parts; each is an acceptance line of `B6.1`):

- **P1 - the example imports.** `tests/contracts.js` asserts `llms.txt`
  contains `example.json`'s text verbatim inside the new section;
  `bundle.test.ts` extracts the first ```` ```json ```` block after `##
  Lists as a file (import-v1)` from `llms.txt`, and `parseBundle` with
  `data.json`'s ids answers `ok` with an empty `skipped`.
- **P2 - the text is complete.** `tests/contracts.js` reads the section
  (from its heading to the next line-start `\n## ` - a bare `## `
  would stop at a `### ` heading) and, walking the schema's root, list and
  entry `properties`, asserts each key appears as `` `key` ``; each enum or
  const value (`daggerheart-loot/lists`, `bag`, `coin`, `official`)
  appears; each bound appears as a whole number, matched with
  `(^|\D)<n>(\D|$)` so `99` is not found inside `99999` (50, 100, 200,
  4000, 99, 99999), and `5 MB`, `lists.json` and `zip` appear; the
  schema URL and `catalog.csv` appear (review nit `plan-B6.1-14`). Wording
  rule (review item `plan-B6.1-4`): `tests/derived.js`' count check reads
  any number of three or more digits before `entries`, `records` or
  `позици` as a record count, so the section writes `entries: 0 to 100`
  and `at most 100 per list`, never `100 entries`; the schema URL and `catalog.csv` appear. A key
  added to the schema without a line in `llms.txt` fails the check.
- **P3 - the blind round.** After `llms.txt` and `lib/bundle.ts` are
  written, the orchestrator dispatches a fresh agent that has not read
  this plan or the code. Its prompt, fixed here:

  > Read only these files: `<abs>/llms.txt`, `<abs>/catalog.csv`,
  > `<abs>/docs/fixtures/import/export.json`. Do not open any other file
  > of the repository. Task 1: a GM asks "Build me a file I can import:
  > a tier 2 blacksmith's shop with six pieces of tier 2 equipment from
  > the Core Set, prices in coins, a player note on the shop, a GM note
  > on one item, quantity 2 on one item, and a second, empty list named
  > Stash." Write the file to `<abs>/docs/fixtures/import/from-llms.json`.
  > Task 2: from `export.json`, answer: how many lists; each list's name;
  > the quantity and price of `ci1` in «Лавка кузнеца»; which entries of
  > «Лавка кузнеца» carry a GM note; the money mode of «Лавка кузнеца».
  > Reply with the answers only.

  Pass: `from-llms.json` imports clean (`bundle.test.ts`: `ok`, an
  empty `skipped`; `tests/contracts.js`: canonical, declared keys
  only - the implementer may re-serialise it canonically, never edit its
  content), and it does what was asked (`bundle.test.ts`, review nit
  `plan-B6.1-15`): two lists, the second named `Stash` with `entries: []`;
  the first holds six entries, each a `catalog.csv` row with `source`
  `Core`, `tier` `2` and `kind` `weapon`, `secondary` or `armor`; its
  `money_mode` is `coin`, every entry has `price_coins`, exactly one has
  `quantity` 2, at least one has a `gm_note`, and the list has a
  `player_note`; the answers are 3 lists; «Пустой список», «Лавка кузнеца»,
  «Трофеи»; quantity 2, 150 coins; `voa2_a3`; `coin`. Fail: fix
  `llms.txt` (never the agent's file) and dispatch a new fresh agent; at
  most three rounds, then stop for the planner. The handoff records each
  round (the agent's file errors, its answers, the `llms.txt` change).
  `COVERAGE.md` names the blind round and its fixture as the proof of the
  section, so a later change to the section repeats it.

### 4.10 Selection on the index and batch deletion (owner, 2026-09-27)

Owner: "instead of selecting what to export in a separate view should we
make selection of lists directly on that view? I think it would be also
useful for batch deletion".

- **One strip, extracted on its second use.** The list page's entry strip
  (`ListPage.svelte` `.batch`: the select-all box with the mixed state and
  `t.pickAll`, the polite summary, the actions at the right, at 640 px or
  less the summary beside the box and the actions on their own full line)
  becomes `components/BatchBar.svelte`. Props: `total`, `picked` (counts),
  `label` (the select-all's `aria-label`), `onall(checked)`, and two
  snippets, `summary` and `actions` (the list page passes its taken count
  and total, its money button, copy and delete, and keeps its `.guess`
  row as a third snippet `below`). The list page draws exactly what it
  draws today: its goldens must not move, and `listPage.test.ts` keeps
  passing unchanged apart from imports. The inline `.batch` CSS moves with
  the markup.
- **R4.** R4 extends `SelBar.svelte` (the sticky record-selection bar of
  a table, search or `#/s/` page), not the list page's strip. Two
  patterns stay two components on purpose: `SelBar` selects records
  across the app and floats at the window's bottom; `BatchBar` selects
  rows of the page it sits in. Both put their actions on their own line
  at phone width, as R4's notify button does - the same rule, no shared
  code needed. Delta check D9 confirms R4 did not touch `.batch`.
- **Delete: confirm, no undo.** «Удалить (N)» asks `env.dialog.confirm`
  (the port a single delete uses): «Удалить списки (%n): «А», «Б»,
  «В»...? Ссылки для игроков и мастера на них перестанут работать.
  Отменить удаление нельзя.» - up to five names, then «и ещё %n»
  (`deleteListsConfirm`). Cancel changes nothing and keeps the selection.
  No undo, as for one list: a deleted list takes its share links and R4's
  pending requests with it (cascade), so an undo could not bring those
  back; the confirm says so.
- **Write path: the write buffer, not a new RPC.** On yes, the page calls
  `CloudLists.remove(id)` for each ticked list, clears the selection and
  toasts «Удалено списков: %n» (`listsDeleted`). The buffer merges them
  into one `apply_list_writes` request after its quiet window (at most 50
  `remove` ops, well under the 200 a request takes). Reasons: `remove` is
  already idempotent (a list deleted elsewhere is a no-op), row level
  security confines it to the owner, each op runs in its own
  subtransaction, R3's trigger sends one message per list per request,
  and the page-hidden flush already covers a closed tab. Rejected: a
  `delete_lists(uuid[])` RPC - a second migration and a second write
  path for no behaviour the buffer lacks; all-or-nothing is not wanted
  here, because each deletion stands alone.
- **Failure paths** (the buffer's own, unchanged): no network - the
  removals wait and are sent again, the cards stay gone (optimistic, as
  one delete); a refused or faulted `remove` - the buffer toasts
  `writeRefused` once and re-reads, so a list the server kept is drawn
  again (mock `m18`) and the others stay deleted.
- **Scope of selection.** Account lists only (browser lists end at the
  cutoff and keep their one-by-one «Удалить»). «Выбрать все» ticks the
  drawn cards only, so a search or «Показать ещё» never lets a hidden list
  be deleted unseen.
- **Plan review.** Batch deletion can lose stored data: the Status line
  names it as a trigger.

### 4.11 The list count on a card (owner, 2026-09-27)

Owner: "can we also change the counter of list count? now it looks like
roll indicator which is confusing". The element is `ListCard.svelte`'s
`<Badge cls="num">{items.length}</Badge>` beside the name: gold mono
digits in a gold-bordered box - the same `Badge` variant `RecordCard.svelte`
uses for a record's roll number, and the look of a table row's roll
number (`RowMain.svelte` `.rnum`). After (mock `m03`): no badge; the count
joins the meta line in words, «9 позиций · изменён 3 дня назад»
(`listMeta`, `plural(n, t.itemsN)`), in the edited line's type (12.5 px,
`--muted2`); a browser list, which has no edited time, reads «9 позиций».
The card's `aria-label` already carries the count. The corner the badge
held takes the pick box (4.10). `Badge.svelte`'s `num` variant stays (the
roll number uses it). Every `#/lists` golden re-seeds, signed out too.

### 4.12 The schema link (owner, 2026-09-27)

Owner: "for import, should we link schema somehow? maybe even github link
would work". Checked 2026-09-27: `artex-x/daggerheart-loot` is a public
repository (`gh repo view`: `PUBLIC`), so both targets open signed out.

- **Recommended: the site's own files.** The import hint links «схеме
  import-v1» to `schema/import-v1.json` and «описание для ИИ-помощников»
  to `llms.txt`, relative to the page like every other asset (the
  published URL `https://artex-x.github.io/daggerheart-loot/schema/import-v1.json`),
  `target="_blank"` with `rel="noopener"`. `llms.txt` already names the
  schema URL. Reasons: same origin, the paths are the public contract
  (frozen, probed by `check-site`), always the version the page itself
  reads, and needs no second host (the service worker does not cache it:
  `sw.js` keeps only pictures and hashed build files, so the link needs
  the network, as a GitHub link would). Trade-off accepted: a browser shows the schema as raw JSON,
  less readable to a person than GitHub's rendered view - the `llms.txt`
  link is the readable one.
- Rejected as the primary link: a GitHub `blob/main/schema/import-v1.json`
  link - it shows `main`, which can run ahead of the deployed site, and it
  breaks on a repository rename or a change of visibility. No GitHub link
  is added.

### 4.13 Duplicates (owner, 2026-09-27)

Owner: "how duplicates are considered in import? now we allow imports
with same names, so maybe we should do the same".

| Case | The app today | Import |
|---|---|---|
| Two lists with the same name | allowed: `create` never checks names | allowed, the same: each list in the file becomes its own list, whether its name repeats another in the file or one the account holds; the report notes a name the account already holds («появится второй»), never a refusal |
| A list id the account already holds | - | cannot happen from a file: a file carries no list ids (`additionalProperties: false`; an `id` key on a list is the error «неизвестное поле id»); the client makes every id. The one real collision is a retry of the same press, which the RPC skips (4.5); a UUID of another user's list refuses the call (42501) |
| The same record twice in one list | impossible: `unique (list_id, item_key)`; adding a record already in the list changes nothing (`lib/lists.ts`) | the first occurrence stays with its quantity, price and notes; a later one is skipped and named with both positions (mock `m06`). Rejected: summing quantities (a repeat an LLM wrote by mistake would multiply stock silently) |
| The same file imported twice | - | two copies (create-only; Q1) |

### 4.14 The account's export: a zip (owner, 2026-09-27; Q5 answered B)

Owner: "for downloading from account view, should we make it more
abstract given we plan to add export of homebrew items later as well?"
and "and it will be downloaded as zip file maybe"; Q5 answer (2026-09-27):
B - «Скачать мои данные» downloads a zip holding `lists.json` now,
`homebrew.json` in R7, pictures in R8.

- **Control.** «Скачать мои данные (ZIP)» with the hint «Всё, что
  хранится в аккаунте, одним архивом ZIP: сейчас в нём файл lists.json с
  вашими списками.»; R7 changes the hint, not the control.
  `AppState.exportData()`, file `daggerheart-loot-data-<YYYY-MM-DD>.zip`.
- **Layout (a public contract, pinned).** A zip whose root holds one file
  per kind, each a JSON document with its own `format` and `version`:
  `lists.json` - exactly the `import-v1` bundle (`format`
  `daggerheart-loot/lists`, the same bytes `bundleText` writes for the
  index export of every list). No manifest: the file name names the kind
  and the document inside names its format; R7 adds `homebrew.json` with
  its own format and schema, R8 a `pictures/` folder. Every entry is
  stored (method 0, no compression), UTF-8 names (flag bit 11), the DOS
  time of `exported_at` (so a fixed date gives fixed bytes), no extra
  fields, no comment, no zip64 (a data file is far below 4 GiB), no
  folders as entries in v1.
- **The `format` values.** `lists.json` and every plain-JSON export keep
  `daggerheart-loot/lists` - the file is lists only. Pass 3's generic
  `daggerheart-loot/data` is dropped: the zip is the generic container,
  so no JSON document needs a generic name. The published schema
  `schema/import-v1.json` describes `lists.json`'s content and the plain
  JSON file alike (they are the same document).
- **Writer and reader: hand-written, store-only, in `lib/zip.ts`.**
  Exports: `crc32(bytes)` (the table form, IEEE polynomial),
  `zipStored(files: { name: string; bytes: Uint8Array }[], at: Date):
  Uint8Array`, `readZip(bytes: Uint8Array): ZipEntry[] | null` with
  `interface ZipEntry { name: string; method: number; bytes: Uint8Array |
  null }` (`bytes` null for any method but 0), and `readDataZip(bytes):
  { ok: true; lists: string; other: string[]; more: number } | { ok:
  false; reason: 'notZip' | 'noLists' | 'packed' | 'notText' }`. Pure: no DOM, no
  stream API. Estimated 150-200 lines with the checks below, about 1.5 kB
  gzip; loaded with a dynamic `import()` only when the account export or a
  zip import runs, so the first paint pays nothing. `B6.2` measures it
  with `node tools/bundle-budget.mjs` (the configured build: 178.2 kB of
  200 kB on 2026-09-26) and records the chunk size in the handoff.
  Reasons: the site writes the zip it reads, so store-only is enough;
  pictures (R8) are already compressed WebP, which deflate would not
  shrink; no dependency to audit or update. Rejected: fflate
  (`zipSync`/`unzipSync`, several kB gzip even tree-shaken, and its
  deflate is unused by a store-only file); `CompressionStream` (compresses
  bytes but neither builds nor parses the zip container). R8 may add
  deflate later behind the same functions.
- **The reader's contract** (review item `plan-B6.1-3`; each rule is a
  `zip.test.ts` case, and the ones marked *frozen* are also written into
  `CONTRACTS.md`'s zip layout, because they bound what a v1 data zip may
  be):
  1. **Never throws.** Every read goes through one bounds-checked helper;
     `readZip` wraps its body in `try`/`catch` and answers null for any
     `RangeError` it did not foresee. A test feeds 200 random buffers
     (seeded, 0-4 KiB) and truncations of `data.zip` at every length:
     each answers null or a list, none throws.
  2. **Bounds.** The end record (`0x06054b50`) is searched backwards only
     in the last 22 + 65535 bytes; its central directory offset + size
     lies inside the buffer and ends at the end record; each central
     entry starts with `0x02014b50` and its name, extra and comment lengths
     stay inside the directory; each local header offset lies inside the
     buffer and starts with `0x04034b50`; data start + compressed size
     lies inside the buffer. Any breach: null.
  3. **Header agreement.** For method 0 the compressed size equals the
     uncompressed size. The central directory wins for sizes, CRC and
     flags (bit 3, a data descriptor, puts them only there); the local
     header's name must equal the central one, and its name and extra
     lengths place the data. A disagreement in the name: null.
  4. **Flags and markers.** Bit 0 (encrypted): null. Bit 3: read from the
     central directory, accepted. Any size, offset or count field equal to
     `0xFFFFFFFF` / `0xFFFF` (a zip64 marker), a zip64 end locator
     (`0x07064b50`) before the end record, or disk numbers other than 0:
     null. *Frozen:* a v1 data zip has none of these.
  5. **Entry count.** At most 1000 entries; the count read from the
     directory equals the end record's total and the disk's count; else
     null. *Frozen:* at most 1000 entries (room for R8's pictures; the
     limit is the reader's, raised by a later version).
  6. **CRC.** A stored entry's CRC must match; else null.
  7. **Names.** Decoded as UTF-8 when bit 11 is set, else as CP437 for
     the ASCII range and replacement characters beyond it (names are
     compared, and shown only through text interpolation). `readDataZip` matches `lists.json` by the
     last path segment, case-sensitive: `lists.json` at the root wins; if
     none is at the root, the shallowest `<folder>/lists.json` is taken (a
     person unzipped and re-zipped the folder), so a re-zipped archive
     gives `packed` (usually deflated) or imports when stored - never a
     wrong `noLists`. Two candidates at the same depth: `manyLists`
     (`B6.2`, review nit `plan-B6.1-2-N5`; `B6.1` answered `noLists`,
     whose text «В архиве нет файла lists.json.» is wrong for it), never
     a guess. Entries under `__MACOSX/`, names starting with `._`,
     `.DS_Store`, `Thumbs.db` and directory entries (a name ending in
     `/`) are ignored and never listed in `other`. `other` names the rest
     (the last segment), the first five, with `more` counting the rest.
     *Frozen:* a v1 data zip holds `lists.json` at its root, no folders.
  8. **Decoding.** `lists.json` is decoded with `new TextDecoder('utf-8',
     { fatal: true })` after a leading BOM (`EF BB BF`) is dropped; invalid
     UTF-8 is an error, never replacement characters: `notText`, and the
     panel shows «Это не файл JSON.» (the line a plain file that is not
     text gets; the plain-file path decodes the same way, BOM dropped). `readDataZip`
     returns the text; `parseBundle` does the rest.
  9. **Refusal mapping.** No end record, a bound or agreement breach,
     encryption, zip64, multi-disk, too many entries, a bad CRC:
     `notZip` («Это не архив данных.»). A chosen `lists.json` with method
     other than 0: `packed`. None found: `noLists`. Two at the shallowest
     depth: `manyLists` («В архиве несколько файлов lists.json:
     распакуйте его и выберите нужный.»).
- **What import accepts.** Plain JSON stays first-class (AI assistants
  hand over JSON), and the zip from «Скачать мои данные» too: the panel
  reads the file's bytes, and one that starts with `PK\x03\x04` goes
  through `readDataZip`; anything else is JSON text. Detection is by the
  bytes, not the name, so a renamed file still works. The zip's
  `lists.json` then goes through `parseBundle` like a JSON file. Refusals,
  one line each (mock `m08`'s strip): no `lists.json` - «В архиве нет
  файла lists.json.»; an entry compressed by another program (method 8,
  after a person re-zipped the folder) - «Архив сжат другой программой:
  распакуйте его и выберите lists.json.» (the way out is the plain file);
  a broken zip - «Это не архив данных.». Other files beside `lists.json`
  (R7's `homebrew.json` read by an R6 build) are named in the preview
  (the first five, then «и ещё %n»),
  «В архиве есть файлы, которые эта версия не читает: homebrew.json.»,
  and the lists import.
- **The `#/lists` exports stay plain JSON.** One list and the selected
  lists are one kind of data: a JSON file opens anywhere, a person or an
  AI can read it, and it is what `llms.txt` describes.
- **`llms.txt`.** The section describes the JSON document only, and adds
  one paragraph: the account page's «Скачать мои данные (ZIP)» gives a zip
  whose `lists.json` is this same document; unzip it to read the lists;
  the site imports the JSON file or that zip; hand a GM a JSON file,
  never a zip. P2's completeness check gains `lists.json` and `zip`.
- **Pins.**
  - `docs/fixtures/import/data.zip` (binary; Prettier ignores the
    directory): `zipStored([{ name: 'lists.json', bytes: utf8(export.json)
    }], new Date('2026-09-25T12:00:00.000Z'))`, byte for byte.
  - `lib/zip.test.ts`: `crc32` of `123456789` is `0xCBF43926`; the writer
    reproduces `data.zip` byte for byte; `readZip` round-trips several
    files, UTF-8 names included; a changed byte in the data fails the CRC
    (null); a truncated file and a missing end record are null; a
    hand-built method 8 entry answers `packed`; a zip with no `lists.json`
    answers `noLists`; another entry is listed in `other`.
  - `tests/contracts.js` (fs-only, a second implementation): reads
    `data.zip` with its own 30-line walk (the end record, the central
    directory, the local header), asserts exactly one entry named
    `lists.json`, method 0, flag bit 11, sizes equal, CRC equal to Node's
    `zlib.crc32`, and the content byte-equal to `export.json`.
  - `CONTRACTS.md` section 4: the zip layout above as a frozen contract
    ("a v1 data zip written today imports for good; a new kind is a new
    root file").

### 4.15 Exports past the frozen bounds (review item `plan-B6.1-2`; Q6)

Real accounts can hold more than the schema's bounds: `move_legacy_list`
is exempt from both count limits (up to 5000 entries per moved list), and
decision 31's overrides raise them. Owner, 2026-09-27 (Q6): keep the
frozen bounds equal to the default limits (50 lists, 100 entries per
list).

- The export still downloads everything the reader asked for; it never
  cuts a list. When an exported file breaks a bound, the page says so
  once, after the download starts: «Этот файл нельзя импортировать
  целиком: в нём больше 50 списков или списки, где позиций больше 100
  («А», «Б»...). Разделите такие списки или экспортируйте их частями.»
  (`exportOverBounds`; the names of the lists over 100, the first five,
  then «и ещё %n»). The account panel's hint gains: «Импорт принимает до
  50 списков, а в одном списке позиций - не больше 100.». Every new
  string, RU and EN, keeps `tests/derived.js`' count rule (`dict.ts` is
  in `COUNT_BEARING_FILES`): no number of three or more digits directly
  before «позици», `entries` or `records` (review item `plan-B6.1-4`).
- The import report already names the list and the bound («Позиций
  больше 100» in that list's block; «Списков больше 50» in the file's).
- `FEATURES.md` ("Account and browser lists") names the case: a moved
  list over 100 entries cannot move between accounts by file; split it
  first. Trade-off accepted by the owner: exactly that.
- Rejected: splitting the export into several files (a second report and
  a partial move); a wider schema (import is not exempt from the limits,
  so the file would still be refused).
- Tests (`B6.2`): `app.test.ts` - exporting a fake list of 101 entries
  downloads it whole and toasts `exportOverBounds` with its name; a
  51-list selection toasts it too.
## 5. Contracts and behaviour that stay stable

- Routes, `data.json`, `catalog.csv`, `i/`, `og/`, the `#/l/` encoding
  (still frozen until R10): unchanged. The contract changes, all in
  `B6.1`'s commit with `CONTRACTS.md`, `docs/fixtures/import/`,
  `tests/contracts.js` and `tests/derived.js`: `schema/import-v1.json`
  and the `llms.txt` section are added; the `#/l/` building guidance
  leaves `llms.txt` (4.9).
- `lists` and `list_entries` columns, checks, RLS, limits, triggers:
  unchanged; one function added. `EXPECTED_ANON_FUNCTIONS` unchanged
  (`import_lists` is not `anon`'s).
- `ListRepository`'s existing methods and `CloudLists`' buffer:
  unchanged (batch deletion uses `remove` as it is). The list page's entry
  strip draws as today after its extraction into `BatchBar`. The
  signed-out `#/lists` goldens move once, for the card's count (4.11).
- `#/account` order of sections: decision 14, with the new panel.

## 6. Tests, fixtures, documentation per batch

| Batch | Tests | Docs |
|---|---|---|
| `B6.1` | vitest: `lib/bundle.test.ts` (with the drift guard, P1, the fixtures), `lib/zip.test.ts` (4.14's pins, `data.zip` byte for byte), `lib/cloudLists.test.ts` (`PRICE_MAX` exported), `ports/fake-cloud.test.ts` (import: all or nothing, the limits, a retry, the owner sends `[B3.2]`), `ports/supabase.test.ts` (the `import_lists` call shape, the timeout, `writeOf` on its answers), `ports/lazy-cloud.test.ts`, the contract's import case over the fake; `tests/contracts.js` "import bundle" (4.2, P2, the zip walk); `tests/db/import-lists.test.mjs`; `tests/e2e/contract.mjs` runs the import case over the real adapter | `CONTRACTS.md` sections 3 and 4 and the opening sentence; `llms.txt` (4.9, the `#/l/` guidance removed); `tests/derived.js` (the pins of 4.9); `app/index.html` `<noscript>`; `COVERAGE.md` (the new suites, fixtures, the contract case and its timing, the blind round); the decision files (section 10) |
| `B6.2` | vitest (pass 5 adds): `lib/bundle.test.ts` (`names`, `item`, `overBounds`, `dataFileName`; review nit `B6.1-N1`'s title), `lib/zip.test.ts` (`manyLists`, `ZIP_ENTRIES_MAX`), `lib/i18n.test.ts` (`fewNames`; the labels `llms.txt` names equal `dict.ts`); `components/batchBar.test.ts` (new: mixed state, summary, actions snippet, axe), `importPanel.test.ts` (the grouped report, the name note, a retry sends equal ids), `listCard.test.ts` or `listsPage.test.ts` (the count line, the pick box, axe with a picked card), `listsPage.test.ts` (select, select-all over the drawn cards, export, batch delete with confirm yes and no, the selection pruned after a re-read), `listPage.test.ts` (unchanged behaviour through `BatchBar`), `accountPage.test.ts`, `a11y.test.ts` (the strip on, the import field open, the error report), `state/app.test.ts` (`exportLists`, `exportData` through `fakeImage`), `state/cloudLists.test.ts` (`import`: flush first, re-read, a dropped answer after `clear()`; batch `remove` of two in one request; a refused `remove` re-reads); `inventory.js` + goldens; `states.js` five cases; `flows.mjs` one flow; `driver.js` `download()` and `upload()` | `FEATURES.md` "Lists" (the card's count line, selection and batch deletion) and "Account and browser lists" (export and import) and "Account" (the panel); `docs/decisions/` (batch deletion, section 10; decision 5's Task line, review nit `B6.1-N4`); `META.md` section 3 (the file is the per-user backup and the way between accounts) and section 4 (`B6.1-N3`); `STATE.md` (the index selection and the import field are page memory); `COVERAGE.md` (states, goldens, the driver verbs, the new tests); `help.ts` `LISTS`; `README.md`, `README.ru.md` (`B6.1-R1`); `PRODUCT.md` (`B6.1-N3`); the privacy page needs no change |

## 7. Batches: gates, cost, review, split criterion

Costs: `context.md`, "Command costs" (this host, 2026-09-26/27).

| Batch | Goal | Gates (cost) | Review | Split criterion |
|---|---|---|---|---|
| `B6.1` | the contract, `llms.txt` and the database: section 8 | before the review: `rtk npm run check` (7-10 min), `npm run check:db` (9-10 min, PowerShell tool), `npm run check:built` (2 min; `dist/index.html` changes); the blind round (5-10 min, P3); after the approve: `db-push.mjs --project test` (1 min), `npm run e2e` (2-3 min) - about 35 min | required: plan review before the batch (Status), batch review after it (a migration, a public contract) | a public contract and SQL judged apart from Svelte, and the schema-batch rule: the test-project push and the E2E wait for the review's approve, which the UI batch must not hold up |
| `B6.2` | the UI: section 9 | implementer (pass 5): `rtk npm run check` once (7-10 min), `npm run check:built` (2-3 min; it builds `dist-test/` last), `node tests/run-all.js app/states` (5 min), `node tests/run-all.js app/print,app/contracts,app/typo,app/hues,stub` (7-8 min), `npm run e2e` (2-3 min) - about 33 min; orchestrator after the commit: `node tests/app/golden.js --update --shard=n/4` x4 (13 min; the diff of `tests/app/snapshots/` is the compare, section 9 "Golden ids"), `node tests/app/sweep.js 360` (7-9 min) - about 22 min; about 55 min in all. No `check:db`: `B6.2` edits nothing under `supabase/` or `tests/db/` (P14) | required: new UI; batch deletion (stored data) | a commit the harness cannot reach otherwise: the states and the flow need `B6.1`'s fake `import`, fixtures and the migration on the test project |

Total gate cost, one green pass per batch: about 90 minutes (`B6.1` 35,
`B6.2` 55), plus the closeout's push and CI watch (about 5 minutes). Not split further: the
selection, batch deletion, the count line, the three export surfaces and
the import field share one route (`#/lists`), one component set, one
seed (`gm1`) and one golden re-seed; the README's test says merge. The
`BatchBar` extraction rides with them because its second use is on the
same page; its no-change proof is that the one `--update` leaves every
local list page golden byte-identical (section 9, "Golden ids"). The
`B6.1` review's items ride in the same amend: each is a local edit whose
gates `B6.2` pays anyway (`B6.1-R1` must land before the push). Commit
policy: `B6.1` commits, `B6.2` amends, the closeout amends and pushes.

## 8. Batch `B6.1` - the contract, `llms.txt` and the database (implement-ready)

**Objective.** Publish `import-v1` with a proven `llms.txt` section,
build the pure module and the write path, prove them in layers 1, 3 and
4. No UI.

**In scope.** Sections 4.1-4.5, 4.9 and the `B6.1` row of section 6.
**Out of scope.** Every component, `dict.ts`, `help.ts`, the driver,
states, goldens, `CloudLists.import`, `AppState.exportLists` (`B6.2`).

### Delta check (before step 1; the orchestrator or the planner, about 15 minutes)

Rebase the task onto `main` holding R3 and R4 with `git rebase --onto
<main> 1cbca5f7` - not a plain `git rebase main`: `1cbca5f7` is not an
ancestor of `main` (`94058abd` squashed R3's `B3.1` and `B3.2`), and a
plain rebase would replay `B3.1` (review item `plan-B6.1-8`). The main
checkout holds uncommitted copies of
`issues/persist-6-import-export/context.md` and
`issues/persistent-storage/plan.md`: this task's committed files win for
R6 (`context.md`, `plan.md`, `handoff.md`, `reviews/`, `mocks/`); the
orchestrator merges the main checkout's uncommitted edits into them at the
cherry-pick and names any conflict to the owner. Then confirm each line
against the shipped code; a line that does not hold stops the batch for a
planner pass.

| Line | Confirm | Steps it feeds |
|---|---|---|
| D0 (owner) | Q5 answered 2026-09-27 (B, 4.14) - held; nothing to check | - |
| D1 `[B3.2]` | `ListRow` has `revision: number` and `LIST_SELECT` reads it; the fake's rows carry it | 3 (row literals in `bundle.test.ts`), 4 (the fake's copy) |
| D2 `[B3.2]` | the real adapter's `timed()` helper with `WRITE_TIMEOUT_MS` wraps every write RPC and takes a bound (the review found it on `94058abd`) | 4 (`import` uses it with `IMPORT_TIMEOUT_MS`) |
| D3 `[B3.2]` | `keepaliveFetch(url, tab)` adds `x-dhloot-tab` to every `rest/v1/` request, `rpc/` included | 4.5 (echo suppression; nothing to write) |
| D4 `[B3.2]` | the fake's `apply` sends one owner message per changed list per call through a named helper, `by` = the fake's tab | 4 (the fake's `import` calls it) |
| D5 `[B3.2]` | the contract letters (J = events), the last `states.js` case number, the last `flows.mjs` flow | 5, `B6.2` |
| D6 `[B3.2]` | `CloudLists.#pull` still drops a read that overlapped a write and re-reads when idle | `B6.2` (`import`) |
| D7 `[R4]` | R4's migration file name; `import_lists`' `<ts>` sorts after it | 6 |
| D8 `[R4]` | `CloudPort.requests` and the fake's requests members exist; `import` is added to `ListRepository` only, no conflict | 4 |
| D9 `[R4]` | R4's contract case letter, states and flows numbers; `RequestsPanel` is under the list page's action row; R4 left the list page's `.batch` strip as it is (it extends `SelBar`) | 5, `B6.2` |

### Files

| File | Change |
|---|---|
| `schema/import-v1.json` | new (step 1) |
| `docs/fixtures/import/example.json`, `export.json`, `unknown-id.json`, `errors.json`, `v2.json` | new (step 2) |
| `docs/fixtures/import/from-llms.json` | new, the blind round's file (step 9) |
| `app/src/lib/bundle.ts`, `bundle.test.ts` | new (step 3) |
| `app/src/lib/zip.ts`, `zip.test.ts`; `docs/fixtures/import/data.zip` | new (step 3b) |
| `docs/decisions/<date>-the-accounts-data-file-is-a-store-only-zip.md`, `docs/DECISIONS.md` | decision 5 of section 10 (step 10) |
| `app/src/lib/cloudLists.ts`, `cloudLists.test.ts` | `PRICE_MAX` exported; `ImportRow` (step 3) |
| `app/src/ports/types.ts` | `ListRepository.import` (step 4) |
| `app/src/ports/supabase.ts`, `supabase.test.ts` | `import` (step 4) |
| `app/src/ports/lazy-cloud.ts`, `lazy-cloud.test.ts` | `import` forwarded (step 4) |
| `app/src/ports/fake-cloud.ts`, `fake-cloud.test.ts` | `import` (step 4) |
| `app/src/ports/cloud.contract.ts` | `importCases`, `IMPORT_MS` (step 5) |
| `supabase/migrations/<ts>_import_lists.sql`, `supabase/reversals/<ts>_import_lists.sql` | new (step 6) |
| `tests/db/import-lists.test.mjs` | new (step 7) |
| `tests/contracts.js` | the "import bundle" block and the zip walk (step 8) |
| `llms.txt` | the new section, the `#/l/` guidance removed, the edits of 4.9's table (step 8) |
| `tests/derived.js` | the `llms.txt` pins of 4.9 (step 8) |
| `docs/specs/CONTRACTS.md`, `COVERAGE.md` | step 10 |
| `.github/workflows/ci.yml`, `tools/check-site.lib.mjs`, `app/index.html` | step 11 |

### Steps

1. **`schema/import-v1.json`** from 4.1's table: `"$schema":
   "https://json-schema.org/draft/2020-12/schema"`, `$id`, `title`
   "Daggerheart Loot lists file, version 1", a `description` naming
   `llms.txt`; `type: object`, `required: ["format", "version", "lists"]`,
   `additionalProperties: false`, `properties`: `$schema` (string),
   `format` (`const`), `version` (`const: 1`), `exported_at` (string,
   `format: date-time`), `lists` (array, `minItems` 1, `maxItems` 50,
   `items: { "$ref": "#/$defs/list" }`); `$defs.list` (`type: object`,
   `required: ["name", "entries"]`, `additionalProperties: false`; `name`
   `minLength` 1 `maxLength` 200; `money_mode` `enum: ["bag", "coin"]`
   `default: "bag"`; `player_note`, `gm_note` `maxLength` 4000 `default:
   ""`; `entries` array `maxItems` 100 of `$defs.entry`); `$defs.entry`
   (`required: ["id"]`, `additionalProperties: false`; `id` `pattern:
   "^[A-Za-z0-9_-]{1,64}$"`; `name` `maxLength` 200; `source` `enum:
   ["official"]` `default: "official"`; `quantity` integer 1..99 `default:
   1`; `price_coins` integer 1..99999; the notes). A one-sentence English
   `description` on every property (`id` names `catalog.csv`,
   `price_coins` names "Money" in `llms.txt`). `examples`: the example of
   4.1 as an object.
2. **Fixtures** (4.2's table), each written with `JSON.stringify(v, null,
   2) + '\n'`: `example.json` exactly as 4.1 (check `ci1`'s `name` equals
   its `ru` name in `data.json`; `q313`'s GM note «Проклят.»);
   `unknown-id.json`, `errors.json`, `v2.json` as 4.2 says; `export.json`
   generated once by a throwaway script through `toBundle` (after step 3)
   from `fakeCloud(seed, 'gm1')`'s lists mapped by `toCloudList` and
   sorted as the store sorts them (newest edit first), RU names,
   `new Date('2026-09-25T12:00:00.000Z')` - the script is not committed;
   the test of step 3 regenerates the text and compares.
3. **`app/src/lib/bundle.ts`** per 4.3 and **`bundle.test.ts`** per 4.3's
   test list. `cloudLists.ts`: `export const PRICE_MAX = 99999` (the doc
   line kept) and `export interface ImportRow { list: NewListRow;
   entries: EntryRow[] }` with the doc line "One list of an import: the
   `create` op's shape (`import_lists`)". The walk is one function per
   object kind taking a `path` prefix. The schema and the fixtures are
   read with `fs.readFileSync` from the repository root (vitest runs in
   Node; follow how `lib/*.test.ts` read `data.json` today). P1: read
   `llms.txt`, take the text after `## Lists as a file (import-v1)`, take
   the first block between a line ```` ```json ```` and the next line
   ```` ``` ````, and `parseBundle` it. Row literals of `ListRow` carry
   `revision` `[B3.2]` (D1).
3b. **`app/src/lib/zip.ts`** per 4.14 (`crc32`, `zipStored`, `readZip`,
   `readDataZip`; header comment cites `docs/specs/CONTRACTS.md` section 4
   and names the store-only reason in one line). Local file header
   `0x04034b50`, version needed 20, flags `0x0800`, method 0, DOS time and
   date from `at` in UTC, CRC, sizes, name; then the central directory
   (`0x02014b50`, version made by 20, the same fields, local header
   offset) and the end record (`0x06054b50`, entry counts, directory size
   and offset, comment length 0). Write `data.zip` once with a throwaway
   script from `export.json` (step 2) and the fixed date; `zip.test.ts`
   per 4.14's pins. `zip.ts` is not imported by any page in this batch
   (`B6.2` loads it lazily); coverage reaches it through its test.
4. **The port.** `types.ts`: `import(lists: ImportRow[]):
   Promise<ListWrite>` on `ListRepository` after `move`, with 4.5's doc
   line. `supabase.ts`: `import: (rows) => written(() =>
   client.rpc('import_lists', { p_lists: rows }))` with the write timeout
   `[B3.2]` (D2). `lazy-cloud.ts`: forward as `apply` does. `fake-cloud.ts`:
   4.5's fake, placed after `move` in `listRepo`; the owner sends `[B3.2]`
   (D4). Tests: `supabase.test.ts` (the stub records `rpc('import_lists',
   { p_lists })`; a P0001 `limit: lists_per_owner` with `details` `50`
   answers `limit`; status 0 answers `network`; with fake timers the call
   is still pending at 20 s and aborts at `IMPORT_TIMEOUT_MS` as `network`
   `[B3.2]`; a 500 with code `57014` answers `refused` / `tooSlow`, while
   `apply`'s `writeOf` path still reads a 500 as `network`); `fake-cloud.test.ts`
   (two lists in, read back in order; over `limits.lists` refuses and
   leaves the owner's lists as they were; a 101-entry list refuses and
   the first list of the call is absent; another user's list id refuses;
   a retry with the same rows inserts nothing more; offline and signed
   out answer `network`; one owner message per inserted list, none on a
   refusal `[B3.2]`); `lazy-cloud.test.ts` (forwarded; a failed chunk
   answers `network`).
5. **Contract.** `cloud.contract.ts`: `const IMPORT_MS = 6000;` and
   `importCases(port, assert, log)` per 4.5, called from
   `runCloudContract` after `moveCases` with a comment in the style of
   the others ("<letter>. lists imported from a file, all or nothing, on
   the doomed user; the account's deletion takes the rows with it"); the
   letter per D5/D9. `tests/e2e/contract.mjs` needs no change unless it
   lists the cases; the vitest file that runs the contract on the fake
   picks the case up.
6. **Migration** `supabase/migrations/<ts>_import_lists.sql` per 4.5
   (`<ts>` per D7). Header comment, three lines: what it does; one
   transaction, every list or none; `source` and `snapshot` pass through
   for the homebrew bundle - cite `docs/specs/CONTRACTS.md` section 4 and
   `docs/decisions/2026-09-26-an-import-is-one-import-lists-transaction.md`.
   Reversal: `drop function public.import_lists(jsonb);`.
7. **`tests/db/import-lists.test.mjs`** (the `list-writes.test.mjs`
   pattern: `connect`, `asRole`, `commitAs` from `roles.mjs`): grants
   (`authenticated` executes; `anon` and `service_role` do not; the
   function is `security invoker`, read from `pg_proc.prosecdef = false`,
   and `pg_proc.proconfig` holds `search_path=public, pg_temp`, as
   `list-writes.test.mjs` pins them - review nit `plan-B6.1-13`); no
   session -> 28000;
   A imports two lists and reads them back with entries in order,
   positions 0..n-1, `source` `official`, `snapshot` null, and the call
   returns 2; the same call again returns 0 and changes no row; a list id
   owned by B -> 42501, A holds no new list, and B's list and entries are
   unchanged (read as `service_role` before and after); 51 elements ->
   22023; an `entries` that is not an array -> 22023; an `entries` of 5001
   -> 22023 before any row is written; two lists, the second of 101
   entries -> P0001 `limit: entries_per_list` with `detail` `100`, and the
   first list is absent; A holding 49 lists imports
   two -> P0001 `limit: lists_per_owner` with `detail` `50`, none
   inserted; a `limits:set` override of `entries_per_list` to 3 and a
   list of four entries -> P0001 `limit: entries_per_list`, no list
   inserted; `quantity 0` -> 23514, nothing inserted; a duplicate
   `item_key` in one list -> 23505, nothing inserted; `source:
   'homebrew'` with a valid snapshot inserts as such (the pass-through)
   and with `snapshot` null is refused by the table check (23514).
   Realtime (R3, in tree): through `commitAs`, an import of three lists
   commits three `realtime.messages` rows on `owner:<A>` (event `list`,
   each list's final revision); a refused import commits none. If
   `realtime.test.mjs`'s `rowsOf` is needed, move it to `roles.mjs` and
   import it in both files (its second use).
8. **`tests/contracts.js`** - the "import bundle" block of 4.2, P2 of
   4.9 (with `lists.json` and `zip` in its list) and the zip walk of 4.14
   (`zlib.crc32`, Node 22). **`llms.txt`** - the new section with 4.14's
   zip paragraph after "Reading an export", and every row of 4.9's table
   (the "List links" section removed, "The two notes" kept as its own
   section, the reworded items), the example pasted from `example.json`
   byte for byte; start from `mocks/m15-llms-section.html`. Keep the
   prose in the file's voice; new text needs no em dash (the file already
   carries some; do not rewrite them). **`tests/derived.js`** - the
   `llms.txt` pin list loses `stamp`, `deflate-raw` and "Do not invent a
   compression scheme"; the worked-example block (from `const items =
   /\nitems` to the end of its `if`) is deleted; run `node
   tests/derived.js` and `node tests/run-all.js contracts` - both green
   with the `#/l/` guidance gone (the wording rule of 4.9 P2 keeps the
   count check green). `git grep -n "#/l/" -- llms.txt` shows only the
   retirement lines (review nit `plan-B6.1-18`).
9. **The blind round (P3).** Stop after step 8 is green on `rtk npm run
   test` (vitest) and `node tests/run-all.js contracts`, and hand the
   round to the orchestrator: it dispatches a fresh agent with 4.9's
   prompt, absolute paths filled in. On the agent's answer, the
   implementer resumes: re-serialise `from-llms.json` canonically if
   needed (content unchanged), add it to `bundle.test.ts` and the
   contracts walk, run both again; compare the answers with 4.9's
   expected ones. A failure follows 4.9's fix loop.
10. **Docs.** `CONTRACTS.md` section 4: the bullet of 4.2 (hand-written,
    not generated; the sentence "All of them are generated from `data.js`"
    gains "except `schema/import-v1.json`"), the zip layout bullet of
    4.14 with the rules the reader's contract marks *frozen* (no zip64, no
    encryption, one disk, at most 1000 entries, `lists.json` at the root,
    no folders, UTF-8 names), the `Fixtures:` line gains
    `docs/fixtures/import/`, section 5 (static asset paths) gains
    `schema/import-v1.json` (review nit `plan-B6.1-16`); the opening sentence
    and section 3's note of 4.9. Decision 5 of
    section 10 as a file from `.claude/templates/decision.template.md`,
    then `node tools/decisions.js`. `COVERAGE.md`: the new
    suites and fixtures in their tables (`contracts` row, the
    `tests/db/` paragraph, the contract paragraph gains the import case
    and its logged timing), and the blind round as the proof of
    `llms.txt`'s import section.
11. **Published files.** `ci.yml`: `schema` in the Collect `cp -r` list
    and `schema/import-v1.json` in the "missing or empty" list;
    `tools/check-site.lib.mjs`: a `status200` probe for
    `schema/import-v1.json` and a test that `JSON.parse(body).$id` equals
    `SITE + 'schema/import-v1.json'`; `app/index.html` `<noscript>`: the
    `llms.txt` line reads «что это за сайт, адреса и формат файла списков»,
    one `<li>` «schema/import-v1.json — схема файла списков для импорта»,
    and the English sentence names the schema and drops the list-link
    sentence. Run `node tests/derived.js`; if an
    assertion names the Collect list or the `<noscript>` links, extend
    it.
12. **Gates, in order.** `rtk npm run check` (Bash, timeout 600000);
    `npm run check:db` (PowerShell; it ran 545 s before R4's and R6's
    suites - if the call passes the 600 s cap it goes to the background and
    arms the gate by its own exit: wait for that exit and confirm
    `.claude/.check-db-cache.json` before the commit, `.claude/README.md`,
    "Run a long check"; review item `plan-B6.1-7`); `npm run check:built`. Commit
    `feat(persist): export and import account lists as a published JSON
    bundle` (the task's one commit; `B6.2` amends). Stop for the review.
    After the approve, resumed once: `node --env-file=.env.test.local
    tools/supabase/db-push.mjs --project test --yes`, then `npm run e2e`,
    then the handoff amend.

### Acceptance

- The delta check's ten lines (D0-D9) each hold, or the batch stopped for
  a planner pass (the handoff records the outcome of each).
- `llms.txt` teaches import files only: the "List links" section is gone,
  `#/l/` appears only in the retirement lines, "The two notes" stands as
  its own section; `tests/derived.js` and `tests/contracts.js` green.
- `schema/import-v1.json` parses, carries the `$id`, and passes the
  "import bundle" block of `tests/contracts.js`.
- P1: `llms.txt` holds `example.json` verbatim, and its first `json`
  block in the section imports with no skip.
- P2: every key, value and bound of the schema is named in the section,
  and the zip paragraph names `lists.json`.
- `lib/zip.ts`: `crc32('123456789')` is `0xCBF43926`; `zipStored`
  reproduces `data.zip` byte for byte; every case of 4.14's pins green;
  `tests/contracts.js`' own walk reads `data.zip` as one stored
  `lists.json` equal to `export.json`.
- P3: the blind round's `from-llms.json` imports with no error and no
  skipped id, and its answers about `export.json` are right; the rounds
  are recorded in the handoff.
- `parseBundle`: `example.json` ok with no skips; `unknown-id.json` ok
  with `skipped` naming `zzz1` (list 0, entry 3, `unknown`) and `ci1`
  (list 0, entry 4, `repeat`, first 0); `errors.json` the four errors
  with their paths, list and entry indexes, in file order; `v2.json` reason `version` 2; a
  51st list and a 101st entry are `many`; a 4001-code-point note is
  `long`; a key `qty` is `extra`.
- `export.json` equals `bundleText(toBundle(...))` of `gm1` byte for
  byte, and carries no list id, `created_at`, `revision` or share key.
- The drift guard passes, and fails when one bound is changed on either
  side (proven once by hand and recorded in the handoff).
- Every `.json` fixture under `docs/fixtures/import/` is canonical.
- `import_lists`: every layer 3 case of step 7 green, the Realtime pair
  included; the function is `security invoker`, executable by
  `authenticated` only.
- The contract's import case green over the fake (vitest) and the real
  adapter (`npm run e2e`), the maximal import under 6000 ms with its time
  logged.
- `dist/index.html` lists `schema/import-v1.json` in `<noscript>`;
  `tools/check-site.lib.mjs` probes it.
- `CONTRACTS.md` section 4 and `COVERAGE.md` updated in the same commit.
- `lib/zip.ts` meets every rule of 4.14's reader contract, each a named
  `zip.test.ts` case (never throws on 200 seeded random buffers and every
  truncation of `data.zip`; bounds; header agreement; encrypted, zip64 and
  multi-disk refused; the 1000-entry cap and the count agreement; the CRC;
  `<folder>/lists.json` stored imports and deflated answers `packed`; two
  roots answer `noLists`; `__MACOSX/`, `._*`, `.DS_Store`, `Thumbs.db`
  and folder entries ignored; `other` capped at five with `more`; a BOM
  dropped; invalid UTF-8 `notText`).
- `toBundle` writes «Без названия» for an empty or blank list name, and
  the round trip of such a list imports clean.
- `import_lists` refuses an `entries` array over 5000 with 22023 before
  writing; the adapter's `import` uses `IMPORT_TIMEOUT_MS` and maps 57014
  to `tooSlow`; the contract's notes-heavy case is logged with its time.
- `llms.txt` passes `tests/derived.js`' count check (no `100 entries`).
- No component, dictionary or golden changes in this batch.

### Verification

Step 12, and the focused runs of step 9 (`rtk npm run test`, `node
tests/run-all.js contracts`).

### Risks / do-nots

- Do not add ajv or any schema library. Do not put the catalog into the
  database (decision 3): unknown ids are the client's.
- Do not make the RPC `security definer`; do not add an exception handler
  inside its loop (one refusal must unwind the call).
- Keep `source`/`snapshot` pass-through in the RPC but refuse `source:
  'homebrew'` in the v1 validator (`SOURCES`).
- Do not edit the blind agent's file to make it pass; fix `llms.txt`.
- Do not push to the test project or run `npm run e2e` before the
  review's approve (the schema-batch rule).
- Do not touch `ListsPage.svelte`, `ListPage.svelte`, `AccountPage.svelte`
  or `cloudLists.svelte.ts` here.

### Fallback

- If the maximal or the notes-heavy import runs past `IMPORT_MS` on the
  test project, answers `tooSlow` (57014), or PostgREST refuses the body: record the measurement in
  `.claude/README.md` ("Supabase configuration") and stop for a planner
  pass - the candidate is a lower `FILE_MAX_BYTES` and a client split of
  a file into calls of at most N lists with one confirmation, which
  breaks Q1's all-or-nothing and needs the owner. The schema's bounds do
  not change. The cheaper first step, no owner needed: lower
  `FILE_MAX_BYTES` to the largest body measured green, with the panel's
  «Файл больше N МБ.» following it (review item `plan-B6.1-5`).

## 9. Batch `B6.2` - the UI (implement-ready; refreshed 2026-09-28, pass 5)

**Objective.** Draw R6 in the app: selection and batch deletion of account
lists on `#/lists`, the count line on a card, «Импорт из файла», the
three exports and «Ваши данные»; prove them in layers 1, 2 and 4; land the
`B6.1` review's placed items in the same amend.

**Entry state.** `B6.1` committed (`7753e6f2`) and approved
(`reviews/B6.1.md`); its resumed step pushed `import_lists` to the test
project and ran `npm run e2e` green before `B6.2` starts (the handoff
records it). If that step took section 8's Fallback, stop: this section
assumes `FILE_MAX_BYTES` 5 MiB. `B6.2` amends the task's one commit.

**In scope.** Sections 4.6, 4.7, 4.10-4.15 as amended in pass 5; the `B6.2`
row of section 6; P1-P21 below; the `B6.1` review items `B6.1-R1` and
`B6.1-N1` to `B6.1-N4`.

**Out of scope.** Any edit under `supabase/` or `tests/db/` (`B6.1-N6`
waits for the next edit of the migration; `B6.1-N7` is P14); the content
of `llms.txt` and `schema/import-v1.json` (`B6.1`; read by a new test
only); homebrew (R7); selection of browser lists; `SelBar.svelte` (R4's
record bar stays as shipped: P2); `B6.1-N5` (the post-review handoff
amend).

### Decided in this refresh (settled; do not reopen)

- **P1 - `BatchBar` and its CSS scope (Risk 7, `plan-B6.1-10`).**
  `components/BatchBar.svelte`:
  ```ts
  interface Props {
    /** The rows or cards the strip can tick. */
    total: number;
    /** How many of them are ticked. */
    picked: number;
    /** The select-all box's name; also its visible text while nothing is ticked. */
    label: string;
    /** The ticked count as text, first in the live summary. */
    count: string;
    onall: (checked: boolean) => void;
    /** Joined to the rows under it (the list page): no bottom border, square bottom corners. */
    joined?: boolean;
    /** More of the summary after the count (the list page's total). */
    summary?: Snippet | undefined;
    /** The buttons, drawn while `picked` > 0. */
    actions: Snippet;
    /** A full-width part inside the strip (the list page's price panel). */
    below?: Snippet | undefined;
  }
  ```
  Markup, byte for byte the list page's today with the counts swapped in:
  `<div class="batch" class:on={picked > 0} class:joined>`, the
  `<label class="batch-all">` with the checkbox (`aria-label={label}`,
  `checked={picked > 0 && picked === total}`, `indeterminate={picked > 0
  && picked < total}`, `onchange` -> `onall(e.currentTarget.checked)`)
  and `{#if !picked}{label}{/if}`; the comment "Mounted while empty, so the
  first tick is announced too."; `<span class="batch-summ"
  aria-live="polite">{#if picked}<span class="batch-count">{count}</span>&#32;{@render summary?.()}{/if}</span>`;
  `{#if picked}<span class="batch-acts">{@render actions()}</span>{/if}`;
  `{@render below?.()}`. The list page passes `picked={ticked.length}`
  (today `.on`, `checked` and `indeterminate` read `lsel.size`: a ticked
  row removed by its own cross left the strip gold with nothing ticked -
  a campsite fix, no golden reaches it), `total={own.ids.length}`,
  `label={t.pickAll}`, `count={selCountText(...)}`, `joined`, `summary`
  = the `.batch-total` span, `actions` = its three buttons, `below` = the
  `{#if ticked.length && guess && !readOnly}` `.guess` block. CSS that
  moves into `BatchBar.svelte`: `.batch` (with the index's look as the
  base: `margin: 0 0 14px; border-radius: 10px;` and a full border),
  `.batch.joined` (the list page's `margin: 16px 0 0; border-radius: 10px
  10px 0 0; border-bottom: none;`), `.batch.on`, both `.batch-all` rules,
  `.batch.on .batch-all`, `.batch-summ`, `.batch-count` (`font-weight:
  650; white-space: nowrap`), `.batch-acts`, `.batch :global(.btn.sm)`,
  and the 640 px rules; plus one rule the index needs (mock `m02` at 360
  px): `@media (max-width: 640px) { .batch:not(.joined) .batch-acts
  :global(.btn) { flex: 1 1 0; justify-content: center; } }`. CSS that
  stays in `ListPage.svelte`, because snippet markup keeps its caller's
  scope: `.batch-total b` (`font-weight: 650`, split off the shared
  `.batch-count, .batch-total b` rule), `.batch-total .np`, `.guess*`,
  `.money-act*`, `.money-hint`, `.batch-lbl`. Nothing else in
  `ListPage.svelte`'s CSS changes.
- **P2 - R4's pending line on a selectable card (Risk 8,
  `plan-B6.1-11`).** An account card reads, top to bottom: the name
  (the badge gone); the meta line «9 позиций · изменён 3 дня назад»; R4's
  gold `.listcard-req` line «2 запроса ждут ответа», unchanged and still
  directly under the line that carries the edit time, where R4 put it; the
  thumbs or «Список пуст»; «Удалить». The pick box is absolute in the top
  right corner and overlaps none of them (`.listcard-top` gains 34 px of
  right padding on a pickable card). The link's `aria-label` stays R4's
  `[name, count, edited, requests].join(', ')`; the pick box is outside
  the link with its own name «Выбрать: <name>». No mock draws a pending
  request, and nothing a mock draws changes: the outline's "mock update of
  `m01`/`m02`" is dropped. The golden `#/lists ~ requests as gm1` shows
  the composition (re-seeded). R4's `SelBar.svelte` is a different
  selection (records, sticky at the window's bottom); `BatchBar` does not
  share code with it (4.10).
- **P3 - the selection is a subset of the drawn cards (Risk 9,
  `plan-B6.1-12`).** `ListsPage.svelte` keeps `sel = new SvelteSet<string>()`,
  derives `ticked = drawnAccount.filter((l) => sel.has(l.id))` for every
  count, label and action, and prunes in an effect: `$effect(() => { const
  drawn = new Set(drawnAccount.map((l) => l.id)); untrack(() => { for
  (const id of [...sel]) if (!drawn.has(id)) sel.delete(id); }); });`. A
  search, a fold back to 24, a delete elsewhere, a re-read or a sign-out
  drops the ticks that leave the view; a card that comes back is not
  ticked. «Удалить (N)» and «Скачать JSON (N)» therefore never act on a
  list out of sight.
- **P4 - `lib/bundle.ts` additions** (4.3, pass 5): `names` on the refused
  result, `item` on an error, `overBounds`, `dataFileName`. Not a public
  contract; `bundle.test.ts` pins each.
- **P5 - two `lists.json` at one depth (`plan-B6.1-2-N5`).** A separate
  reason and text, not `noLists`: `readDataZip` answers `{ ok: false,
  reason: 'manyLists' }` (4.14 rules 7 and 9), text `importZipManyLists`.
  `noLists` and its text stay for none. Rejected: rewording `noLists` to
  cover both - its text is drawn in mock `m08`'s list.
- **P6 - the error texts `B6.1` left open.** An `id` that is not a string
  matching `ID_PATTERN` is kind `type` with `limit` `ID_PATTERN.source`:
  the line uses `importErrId` (never «неверный тип» alone). A list's
  `name` error of kind `missing` (absent or `""`; the two records are
  identical) uses `importErrName` «Название: пустое или отсутствует». The
  report's line grammar, per error `e`:
  - prefix, when `e.entry !== null`: `importPos` with `e.entry + 1`, then
    when `e.item` is set, `, <name> (<code>item</code>)` if
    `index.byId` knows it, else `, <code>item</code>`; then `: `;
  - field word `%f`: `importFieldName` for `field === 'name' && entry ===
    null`; else the key as written;
  - text by kind: `missing` -> `importErrName` for the list name, else
    `importErrMissing`; `type` -> `importErrId` when `limit ===
    ID_PATTERN.source`, `importErrNotObject` when `field === ''`, else
    `importErrType` with `%s` the JSON type (`string`, `integer`,
    `array`, `object`); `long` -> `importErrLong`; `range` ->
    `importErrRange` (`%s` the `lo..hi` limit); `enum` -> `importErrEnum`
    (`%s` the allowed values); `extra` -> `importErrExtra`; `many` ->
    `importErrManyLists` for `field === 'lists'`, else
    `importErrManyEntries`;
  - then ` <code>{e.path}</code>` when the path is not empty.
  Mock `m07`'s four lines come out exactly: «Название: длиннее 200
  символов», «money_mode «gold»: допустимые значения - bag, coin»,
  «Позиция 2, Палаш (`q1`): quantity 0 - значение вне диапазона 1..99»,
  «Позиция 3, Стеганый Доспех (`q313`): неизвестное поле qty», each with
  its path.
- **P7 - «Выбрать файл...» and the bytes.** A `Button` (`size="sm"`)
  whose press calls `input.click()` on `<input type="file" hidden
  accept=".json,.zip,application/json,application/zip">`; after each
  read, `input.value = ''` so the same file can be chosen again. Bytes
  through `file.arrayBuffer()` only (jsdom 30 implements it, checked
  2026-09-28). Section 12's two assumptions are closed by this.
- **P8 - the export's clock.** `exportLists` and `exportData` read `new
  Date(this.env.clock.now())`: `browserClock` in production, the test
  build's fixed `TEST_NOW` (2026-10-01 12:00 UTC) in `dist-test/`, so a
  browser case knows the file name and `exported_at`.
- **P9 - keys.** 4.6's table is the whole list. No key for the meta line's
  `' · '`; `exportJson` and `importGo` take ` (N)` in code.
- **P10 - the account zip in the browser.** State 59 reads the download
  back through the import field (a round trip through the app's own
  `readDataZip`) and checks the file name and the `PK\x03\x04` start;
  `state/app.test.ts` checks the bytes (`readDataZip` of the downloaded
  blob gives `lists.json` equal to `bundleText(toBundle(...))`). No second
  zip walk in `tests/app/`.
- **P11 - the fake and a reload.** The test build's fake re-seeds on every
  page load (only the session rides in the address), so a reload cannot
  show deleted rows gone; state 61 reads `d.fake('lists.list')` after
  `d.writesSettled()`, as case 41 does.
- **P12 - goldens.** The orchestrator runs `node tests/app/golden.js
  --update --shard=n/4` for n = 1..4 once and reads `git status --short
  tests/app/snapshots/`: the changed files must be exactly the 26
  re-seeded ids and the 6 new ids of "Golden ids" below. A changed file of
  any other id, or an id of the list that did not change, stops for the
  implementer. The goldens are deterministic (`.claude/README.md`, "Batch
  size and the fixed cost of a run": 105/105 files byte-identical on an
  unchanged build), so the diff is the compare; this replaces the
  outline's compare-then-update (13 minutes saved) and is the `BatchBar`
  no-change proof (every `#/lists/a*` golden unchanged).
- **P13 - the owner's QA files.** No `B6.2` test uses one: every shape a
  test needs is in the repository already (`docs/fixtures/import/` for
  the import states and the flow; nine browser lists seeded in state 62
  for the search; the fake's `limits` for the limit and over-bounds unit
  cases). The set stays outside the repository for the owner's manual
  QA; nothing is added (`CLAUDE.md`, campsite).
- **P14 - `B6.1-N7`.** Left, not taken: the rename (`const before` ->
  `sentBefore` in `tests/db/import-lists.test.mjs`) is a `tests/db/` edit,
  and a `tests/db/` edit makes the commit gate require `npm run check:db`
  (about 10 minutes, near the 600 s cap) that `B6.2` otherwise does not
  pay; the shadowing breaks nothing today. It rides with R7's `B7.3`,
  which edits the same file for `import_bundle` and pays `check:db`
  anyway; the closeout names it to the human.
- **P15 - one mock line against the rule.** Mock `m06` (the `~ import
  preview as gm1` state, `unknown-id.json`) draws the name note under
  list 1 «Лавка кузнеца» but not under list 2 «Пустой список», and `gm1`
  holds both names. The rule (4.4, 4.13, and `m06`'s own caption: "A
  list name the account already holds is allowed ... and noted") notes
  both; the golden shows the note under both. The drawing's omission is
  a mock error, not a design choice; no mock is edited.
- **P16 - the field's caption.** Mocks `m04`-`m11` caption the import field
  «Импорт из файла JSON» (`importHead`); the toggle button stays «Импорт
  из файла» (`importOpen`), the label `llms.txt` names.
- **P17 - the pick box.** A `<label class="listcard-pick">` 32 px square
  (mock `m01`), `position: absolute; top: 10px; right: 10px`, its
  target grown to 44 px by `::after { content: ''; position: absolute;
  inset: -6px; }` (the note clear button's pattern, state 30); the
  checkbox inside is 17 px with `accent-color: var(--gold)` and `margin:
  0` (`TableRows.svelte` `.selbox input`). No `title` (the mock's
  `title="Выбрать"` repeats the accessible name). A picked card:
  `border-color: var(--gold); background: linear-gradient(180deg,
  rgb(var(--gold-rgb) / 9%), var(--surface));` (mock `m02`).
- **P18 - when the import toggle shows.** Signed in and `cloud.status ===
  'ready'` only (the name note reads `cloud.lists`); `~ load failed`
  therefore does not move.
- **P19 - «Отмена» and the fold.** «Отмена» and the toggle both fold the
  field and forget the file, the preview and the rows; an `ok` import
  folds it too. After a fold the focus goes to «Импорт из файла»
  (`ListsPage` wraps the toggle's `Actions` in `<div
  bind:this={importRow}>` and calls `importRow?.querySelector('button')?.focus()`
  after `await tick()`, the `showMore()` pattern).
- **P20 - no icon on «Скачать JSON».** The mocks draw none, and
  `lib/icons.ts` has no download icon to reuse.
- **P21 - `fewNames`.** `lib/i18n.ts` gains `fewNames(names: readonly
  string[], t: Pick<Dict, 'andMore'>, more = 0): string` - the first five
  joined with `', '`, then `' ' + andMore` with `names.length - 5 + more`
  when that is above 0. Three callers on its first use: the batch-delete
  confirm (names wrapped in `quoted`), `exportLongLists` (wrapped), the zip's
  other files (`fewNames(other, t, more)`, bare names).

### Files

| File | Change |
|---|---|
| `README.md`, `README.ru.md` | step 1 (`B6.1-R1`) |
| `app/src/lib/bundle.test.ts` | step 1 (`B6.1-N1` title), step 2 |
| `app/src/lib/zip.ts`, `zip.test.ts` | step 1 (`B6.1-N2`), step 2 (`manyLists`) |
| `PRODUCT.md`, `docs/specs/META.md` | step 1 (`B6.1-N3`), step 13 |
| `docs/decisions/2026-09-28-the-accounts-data-file-is-a-store-only-zip.md`, `docs/DECISIONS.md` | step 1 (`B6.1-N4`), step 13 |
| `app/src/lib/bundle.ts` | step 2 (P4) |
| `app/src/lib/i18n.ts`, `i18n.test.ts` | step 2 (`fewNames`, the `llms.txt` labels) |
| `app/src/lib/dict.ts` | step 2 (4.6's table) |
| `app/src/state/cloudLists.svelte.ts`, `cloudLists.test.ts` | step 3 |
| `app/src/state/app.svelte.ts`, `app.test.ts` | step 3 |
| `app/src/components/BatchBar.svelte`, `batchBar.test.ts` | new, step 4 |
| `app/src/components/ListPage.svelte` | steps 4 and 8 |
| `app/src/components/listPage.test.ts` | step 8 (imports untouched for `BatchBar`: the page's own test drives it) |
| `app/src/components/ListCard.svelte` | step 5 |
| `app/src/components/ImportPanel.svelte`, `importPanel.test.ts` | new, step 6 |
| `app/src/components/ListsPage.svelte`, `listsPage.test.ts` | step 7 |
| `app/src/components/AccountPage.svelte`, `accountPage.test.ts` | step 9 |
| `app/src/lib/help.ts`, `help.test.ts` (if it pins the paragraph count) | step 10 |
| `app/src/components/a11y.test.ts` | step 11 |
| `tests/app/driver.js`, `tests/app/inventory.js`, `tests/app/states.js`, `tests/e2e/flows.mjs` | step 12 |
| `docs/specs/FEATURES.md`, `STATE.md`, `COVERAGE.md`; `docs/decisions/<date>-account-lists-are-selected-on-the-index-and-deleted-together.md` | step 13 |
| `tests/app/snapshots/*` | the orchestrator, after the commit (P12) |

### Steps

1. **The `B6.1` review items** (mechanical; each its own acceptance line):
   - `B6.1-R1`, `README.md`: lines 28-29 read "[`llms.txt`](...) for the
     URL grammar, the lists import file, and guidance on which set to draw
     from."; line 144's last sentence reads "The format is frozen in
     `docs/specs/CONTRACTS.md` section 3 and is backward compatible."; the
     file tree's `llms.txt` row reads "what the site is, URL grammar, the
     lists import file", followed by a new row `schema/import-v1.json the
     JSON Schema of the lists import file` (the name column is 22
     characters wide, as its neighbours); in "Machine readability and
     search", "the list-link format" becomes "the lists import file", and
     the sentence "The list-link format is documented well enough ... an
     implementation of its own." becomes "The import file is documented
     well enough to write one that imports clean without touching the
     site: `schema/import-v1.json` is its JSON Schema, and
     `tests/contracts.js` checks that `llms.txt` names every key, value
     and bound in it." `README.ru.md` at the same four places: «с
     грамматикой адресов, форматом файла импорта списков и советами, из
     какого набора брать»; «Формат заморожен в `docs/specs/CONTRACTS.md`,
     раздел 3, и обратно совместим.»; the tree row «что это за сайт,
     грамматика адресов, файл импорта списков» and a new row
     `schema/import-v1.json JSON Schema файла импорта списков`; «с
     грамматикой адресов, форматом файла импорта списков, разбором двух
     заметок и ориентирами по ценам» and «Файл импорта описан так, чтобы
     по нему можно было собрать файл, который импортируется без ошибок,
     не обращаясь к сайту: `schema/import-v1.json` - его JSON Schema, а
     `tests/contracts.js` проверяет, что `llms.txt` называет каждый его
     ключ, значение и границу.» Write no date and no number of three
     digits before «позици» or `entries` (`tests/derived.js` reads both
     READMEs). `git grep -n -e "list-link" -e "ссылки на список" --
     README.md README.ru.md` then shows no line that sends a reader to
     `llms.txt` for the link format.
   - `B6.1-N1`: `bundle.test.ts`' title "writes the file of 4.1 sparse:
     defaults and row keys left out" becomes "writes a sparse file: defaults
     and row keys left out".
   - `B6.1-N2`: `lib/zip.ts`' `ENTRIES_MAX` becomes `ZIP_ENTRIES_MAX` (the
     constant, its doc comment's mention, `zip.test.ts`' import and three
     uses).
   - `B6.1-N3`: `PRODUCT.md` line 108 reads "Published machine-readable
     artefacts: `catalog.csv`, `data.json`, `llms.txt`,
     `schema/import-v1.json`."; `META.md` section 4's `<noscript>` bullet
     gains ", `schema/import-v1.json` resolves through the `schema` entry
     of `vite.config.mts`' `ROOT_DIRS` (a junction in `dist/`, as `img/`)"
     before ", and `tools/smoke-http.mjs` asserts".
   - `B6.1-N4`: the decision file's Task line reads "- Task:
     `persist-6-import-export` (the owner answered Q5 with B on
     2026-09-27)."; then `node tools/decisions.js`.
2. **Pure modules.**
   - `lib/bundle.ts` per P4 and 4.3: `At` gains `item?: string`;
     `walkEntry` reads `const item = typeof v['id'] === 'string' &&
     ID_PATTERN.test(v['id']) ? v['id'] : undefined` first and puts it on
     every `At` it passes; `fieldError` and `notObject` copy `at.item` to
     the error when set; `parseBundle` collects `names` (for each element of
     an array `lists`: `isObj(x) && typeof x['name'] === 'string' ?
     x['name'] : null`) and returns it on the `errors` result;
     `overBounds` and `dataFileName` (the day helper of `bundleFileName`
     extracted as a module-local `dayOf(now)`). Doc lines in the module's
     style. `bundle.test.ts`: `errors.json` gives `names` `[<the
     201-character name>]` and `item` `q1` on the `quantity` error, `q313`
     on the `qty` error, none on the list's `name` and `money_mode` errors;
     an entry `{ "qty": 2, "id": "ci1" }` carries `item` `ci1` on its
     `extra` error (the key before `id`); `{ "id": "ci 1" }` carries no
     `item`; `lists: 5` gives `names` `[]`; a list that is not an object
     gives `null` in `names`; `overBounds` of 51 lists is `many`, of one
     list with 101 entries names it in `long`, of `export.json`'s bundle is
     neither; `dataFileName(new Date(2026, 9, 1, 23, 59))` is
     `daggerheart-loot-data-2026-10-01.zip`.
   - `lib/zip.ts` per P5: the `DataZip` reason union gains `'manyLists'`;
     `if (!chosen) return noLists; if (at.length > 1) return manyLists;`;
     the doc comment names it. `zip.test.ts`: the "two at one depth" case
     expects `manyLists`; "none" keeps `noLists`.
   - `lib/i18n.ts` `fewNames` per P21; `i18n.test.ts`: 3 names, 5 names,
     7 names («..., «Е» и ещё 2»), `more` 4 with 5 names. And one case
     "the labels llms.txt names are the interface's": it reads `llms.txt`
     from the repository root (as `bundle.test.ts` does) and asserts it
     contains `dict('ru')` and `dict('en')` of `importOpen`, `newList`,
     `exportJson` and `exportData` (`«Импорт из файла»` with `("Import
     from file")` and so on, the file's own form).
   - `lib/dict.ts`: every key of 4.6's table, RU in the `ru` object and EN
     in the `en` object, placed beside the related keys (the lists block
     for the index and import keys, the account block for `yourData*` and
     `exportData`).
3. **State.**
   - `CloudLists` (`state/cloudLists.svelte.ts`):
     ```ts
     /** The rows of an import, every id new: built once per chosen file, so a retry sends
      *  the same ids. */
     importRows(lists: readonly ImportList[]): ImportRow[] {
       return toImportRows(lists, () => this.#repo.newId());
     }

     /** Imports lists in one call (`import_lists`) after the buffer is sent, then reads the
      *  account again, without «Загружаем...». A lost answer whose lists are all in that
      *  read is `ok`: the call committed, and a retry would bring back entries deleted
      *  since. Not queued, not optimistic, no toast. */
     async import(rows: ImportRow[]): Promise<ListWrite> {
       const epoch = this.#epoch;
       await this.flushNow();
       if (epoch !== this.#epoch) return NETWORK_WRITE;
       const answer = await this.#repo.import(rows);
       if (epoch !== this.#epoch) return NETWORK_WRITE;
       if (answer.ok || answer.error === 'network') {
         await this.#pull();
         if (epoch !== this.#epoch) return NETWORK_WRITE;
         if (!answer.ok && rows.every((r) => this.get(r.list.id))) return { ok: true };
       }
       return answer;
     }
     ```
     with a module-local `const NETWORK_WRITE: ListWrite = { ok: false,
     error: 'network' };`. `cloudLists.test.ts`: a buffered `create`
     reaches the fake before the import (the fake's write order); `status`
     stays `ready` through the import and the imported lists are in
     `lists` after it; `clear()` during the call answers `network` and
     leaves `lists` empty; a repo whose `import` commits on the fake and
     then answers `network` gives `ok`; one that answers `network` without
     committing gives `network`; `importRows` makes new ids per call, equal
     to what the panel sends twice; two `remove`s in one tick reach the fake
     as one `apply` of two `remove` ops; a refused `remove` (the fake's
     other-owner or refusal hook) toasts `writeRefused` once and the next
     read draws that list again.
   - `AppState` (`state/app.svelte.ts`), beside `retryLists`:
     - `async exportLists(ids?: readonly string[]): Promise<void>` - no-op
       without `cloudLists`; `lists = ids ? cloudLists.lists.filter((l) =>
       ids.includes(l.id)) : cloudLists.lists` (the store's order);
       `now = new Date(this.env.clock.now())`; `b = toBundle(lists, (id) =>
       { const it = this.index?.byId.get(id); return it ? nameOf(it,
       this.lang) : undefined; }, this.t.untitled, now)`; `await
       this.env.image.download(new Blob([bundleText(b)], { type:
       'application/json' }), bundleFileName(lists, now))`; a rejection
       toasts `t.accountFailed` (error) and returns; then
       `this.#warnBounds(b)`.
     - `async exportData(): Promise<void>` - the same bundle of every
       list; `const { zipStored } = await import('../lib/zip.js')` (the
       only way `zip.ts` is reached from `AppState`); `bytes =
       zipStored([{ name: 'lists.json', bytes: new
       TextEncoder().encode(bundleText(b)) }], now)`; download `new
       Blob([bytes], { type: 'application/zip' })` as `dataFileName(now)`;
       a failed import of the chunk or a rejected download toasts
       `t.accountFailed`; then `#warnBounds(b)`.
     - `#warnBounds(b)`: `const { many, long } = overBounds(b)`; when
       either, one toast (not an error: the download happened):
       `[t.exportOverBounds, many ? t.exportManyLists : '', long.length ?
       t.exportLongLists.replace('%s', fewNames(long.map((n) =>
       t.quoted.replace('%s', n)), t)) : ''].filter(Boolean).join(' ')`.
     - `app.test.ts` (through `fakeImage().downloaded` and a fixed clock):
       all lists as `daggerheart-loot-lists-<day>.json` in the store's
       order; two ids in the store's order whatever the argument's order;
       one id as `<name>.json`; the text equals `bundleText(toBundle(...))`
       and the entry names follow `lang`; a failed download toasts
       `accountFailed` and no bounds toast; `exportData` downloads
       `daggerheart-loot-data-<day>.zip` of type `application/zip` whose
       `readDataZip` gives the same `lists.json` text; a list of 101 fake
       entries downloads whole and toasts the over-bounds text naming it
       (4.15's test); 51 lists (the fake's `maxLists` raised) toast the
       many-lists sentence; both at once give one toast with both
       sentences.
4. **`BatchBar`** per P1. Create `components/BatchBar.svelte` (header
   comment: what it is and that it was extracted on its second use from
   the list page's strip; the snippet-scope reason for the CSS split in
   one line). In `ListPage.svelte` replace the `.batch` block (from `<div
   class="batch"` to its closing `</div>`, the `.guess` block included)
   with `<BatchBar ...>` and the three snippets; delete the moved CSS
   rules listed in P1 and split `.batch-count, .batch-total b`. Run
   `npx vitest run listPage` (focused, without coverage: a filtered run
   under `npm run test` fails the per-file thresholds): green with no test
   edited. `batchBar.test.ts` (a small wrapper component in the test, as
   the other snippet-taking components' tests do): idle - the box
   unchecked, the label text shown, no actions, the live region present
   and empty; one of three - `.on`, `indeterminate`, the label text gone,
   the count and the summary snippet in the live region, the actions
   drawn; three of three - `checked`; `onall` receives the box's state;
   `joined` sets the class; `below` renders inside the strip; axe clean
   idle and on.
5. **`ListCard.svelte`** per 4.11, P2 and P17. Props gain `picked?:
   boolean` and `onpick?: ((on: boolean) => void) | undefined`. Remove the
   `Badge` import and element; the name stays in `.listcard-top`. Replace
   `{#if edited}<p class="listcard-edited">{edited}</p>{/if}` with `<p
   class="listcard-meta">{meta}</p>` where `meta = [plural(items.length,
   t.itemsN, app.lang), edited].filter(Boolean).join(' · ')` (a browser
   card reads «7 позиций»); the `.listcard-edited` rule is renamed
   `.listcard-meta`. `.listcard-req` stays where it is, right after the
   meta line. When `onpick` is set: `<div class="listcard"
   class:pickable={!!onpick} class:picked>`, and before the `<a>` a
   `<label class="listcard-pick"><input type="checkbox" checked={picked}
   aria-label={t.pickList.replace('%s', list.name || t.untitled)}
   onchange={(e) => onpick(e.currentTarget.checked)} /></label>`; CSS
   `.listcard { position: relative; }`, `.listcard-pick` per P17 with
   `:hover { background: var(--surface2); }` and `cursor: pointer`,
   `.listcard.pickable .listcard-top { padding-right: 34px; }`,
   `.listcard.picked` per P17. Keep the whitespace comment and the
   `prettier-ignore` markup shape of the link. Update the header comment
   (the count is a meta line; account cards can be ticked). Existing
   `listsPage.test.ts` reads of `.listcard-edited` (two places) read
   `.listcard-meta` and expect the joined text; the "badge counts known
   records" test reads the count from the meta line.
6. **`ImportPanel.svelte`** (new, used once, in `ListsPage`'s «Новый
   список» panel). Props `{ app: AppState; onclose: () => void }`. It
   renders one `<Field label={t.importHead}>`:
   - `<Actions>` holding «Выбрать файл...» (P7) and, once chosen, `<span
     class="fname">{name}</span>`;
   - state `view`: `{ kind: 'empty' } | { kind: 'refused'; line: string }
     | { kind: 'errors'; errors: BundleError[]; more: number; names:
     (string | null)[] } | { kind: 'preview'; lists: ImportList[];
     skipped: Skipped[]; rows: ImportRow[]; other: string[]; otherMore:
     number }` and `sending = $state(false)`;
   - on a file: `file.size > FILE_MAX_BYTES` -> refused `importTooBig`;
     `bytes = new Uint8Array(await file.arrayBuffer())` (a throw -> refused
     `t.accountFailed`); when `bytes` starts with `50 4B 03 04`: `const {
     readDataZip } = await import('../lib/zip.js')` (a failed chunk ->
     refused `t.accountFailed`), and `notZip` -> `importNotZip`, `noLists`
     -> `importZipNoLists`, `manyLists` -> `importZipManyLists`, `packed`
     -> `importZipPacked`, `notText` -> `importNotJson`, `ok` -> its text
     with `other`/`more` kept; else `decodeText(bytes)`, null ->
     `importNotJson`; then `parseBundle(text, (id) =>
     app.index?.byId.has(id) ?? false)`: `notJson` -> `importNotJson`,
     `notBundle` -> `importNotBundle`, `version` -> `importVersion` with
     `%s` = `JSON.stringify(version)` (`importNoVersion` when it is
     `undefined`), `empty` -> `importEmpty`, `errors` -> the errors view,
     `ok` -> the preview with `rows = app.cloudLists.importRows(lists)`
     built here, once (`app.cloudLists` is set: the panel renders only
     signed in with the lists read);
   - refused: `<div class="errs" role="alert"><b>{line}</b></div>` and
     «Отмена» (ghost, sm) in an `Actions` with `margin-top:12px`;
   - errors: the same box with `<b>{t.importErrors}</b>` and, when any
     error has `list === null`, a `<ul>` of those lines inside the box
     (the file's own errors, before any list, mock `m07`'s caption); then
     `<div class="rep">` with one `<div class="rep-list bad">` per list
     index that has errors, in file order: `<b>{i + 1}. {name}</b>` where
     `name` is `names[i]` cut to 40 code points plus `...` when cut, or
     `importNoName`; a `<ul>` of at most ten lines (P6's grammar), then
     `importErrMoreList` with the rest of that list's kept errors; after
     the blocks, when `more > 0`, `<p class="rep-more">` with
     `importErrMore` (plural by `more`); «Отмена» only;
   - preview: `<p class="preview">` with `importPreview` (`%l` the lists,
     `%n` the entries after skips, each number in `<b>`, mock `m05`), then
     ` ` and `importSkippedN` (number in `<b>`) when anything was skipped;
     a second `<p class="preview">` with `importZipOther` and
     `fewNames(other, t, otherMore)` when `other` is not empty; the report
     `<div class="rep">` only when a list has a skip or a taken name (mock
     `m05` has none, `m06` has both): one `<div class="rep-list">` per list
     in file order, `<b>{i + 1}. {name cut to 40}</b><small>{entries ?
     plural(n, t.importWillN, app.lang) : t.importListEmpty}</small>` and
     a `<ul>` of at most ten `<li class="skip">` lines - each skip of the
     list («Позиция 4, `zzz1`: пропущена - такой записи нет в данных»,
     «Позиция 5, Первоклассный Спальный Мешок (`ci1`): пропущена - уже
     есть в позиции 1», the prefix of P6 with `entry + 1` and the skip's
     `id`, `first + 1` in `importSkipRepeat`), then `importNameTaken` when
     `app.cloudLists.lists.some((l) => l.name.trim() === name.trim())` -
     then `importErrMoreList` past ten; then an `Actions`
     (`margin-top:12px`) with «Импортировать (N)» (primary, sm) and
     «Отмена» (ghost, sm), both `disabled={sending}`;
   - the press: `sending = true`; `const answer = await
     app.cloudLists.import(view.rows)`; `sending = false`; `ok` ->
     `app.say(t.importDone.replace('%n', String(rows.length)))` and
     `onclose()`; `limit` -> `app.say(limitText(answer.key, answer.value,
     t), { error: true })`; `refused` with `reason === 'tooSlow'` ->
     `importTooSlow` (error); anything else -> `t.accountFailed` (error);
     the preview and the same `rows` stay after every failure;
   - «Отмена» calls `onclose()`;
   - the hint `<p class="hint">`: `importHintBefore`, `<a
     href="schema/import-v1.json" target="_blank"
     rel="noopener">{t.importSchema}</a>`, `importHintMid`, `<a
     href="llms.txt" target="_blank" rel="noopener">{t.importLlms}</a>`,
     `importHintAfter` (relative, like `app.pagesDir`'s links: the app
     document is at the site root);
   - CSS copied from the mocks (`m01`'s `.rep`, `.rep-list`,
     `.rep-list.bad`, `.rep-list > b`, `.rep-list.bad > b`, `.rep-list
     small`, `.rep-list ul`, `.rep-list code`, `.rep-list.bad code`,
     `.rep-list .skip`, `.fname`, `.preview`, `.preview code`, `.errs`,
     `.errs b`, `.errs ul`, `.errs p`, `.errs code`; `m04`'s `.hint`),
     tokens only as written there; `.rep-more` is `.errs p`'s margin with
     `font-size: 13px; color: var(--warn-text)`.
   - `importPanel.test.ts` (App at `#/lists` as the fake's `gm1`, files
     from `docs/fixtures/import/` read with `fs` and uploaded with
     `userEvent.upload` on the `hidden` input - if user-event refuses a
     `hidden` input, `fireEvent.change` with `files` defined on it):
     `example.json` previews «Списков: 1, позиций: 3.», no report,
     «Импортировать (1)»; `unknown-id.json` previews «Списков: 2, позиций:
     3. Пропущено позиций: 2.» and the two blocks of P15 (both name notes);
     `errors.json` draws `importErrors` and m07's four lines of P6 with
     their paths, «Отмена» only; `v2.json` «Неизвестная версия формата: 2.
     ...»; a file without `version` `importNoVersion`; `{}` and `[]` and
     `not json` the one-line texts; a 5 MiB + 1 byte file `importTooBig`
     without reading it; `data.zip` previews «Списков: 3»; a zip with
     another file names it (`importZipOther`); a hand-built zip with two
     `a/lists.json` and `b/lists.json` `importZipManyLists`; a deflated
     entry `importZipPacked`; garbage after `PK\x03\x04` `importNotZip`; an
     `id` `"ci 1"` line uses `importErrId`; `"name": ""` uses
     `importErrName`; eleven errors in one list draw ten lines and
     «...и ещё 1 в этом списке»; 51 errors draw `importErrMore`; the press
     sends the rows and toasts «Импортировано списков: 1», folds, and the
     new card is first; the fake offline: `accountFailed`, the preview
     stays, and a second press after going online sends rows whose ids
     equal the first call's (a spy on the fake's `import`); the fake at
     `maxLists` 3: the limit toast; a repo answer `refused`/`tooSlow`:
     `importTooSlow`; «Отмена» folds and focuses «Импорт из файла»; the
     hint's two links have the hrefs above; axe clean on the empty field,
     the preview with its report, and the error report.
7. **`ListsPage.svelte`** per 4.6 (index), 4.10, P3, P18, P19.
   - Imports `untrack` from `svelte`, `SvelteSet` from `svelte/reactivity`,
     `BatchBar`, `ImportPanel`, `Actions`, `fewNames`.
   - «Новый список» panel (the `target === 'local' || target === 'cloud'`
     branch): after `</NumRow>`, when `signedIn && cloud?.status ===
     'ready'`: `<div bind:this={importRow}><Actions
     style="margin-top:10px"><Button size="sm" variant="ghost" caret
     on={importing} expanded={importing} onclick={toggleImport}>{t.importOpen}</Button></Actions></div>`;
     after the first `</Field>`, `{#if importing && signedIn && cloud?.status
     === 'ready'}<ImportPanel {app} onclose={closeImport} />{/if}`.
     `closeImport`: `importing = false; await tick();
     importRow?.querySelector('button')?.focus();`.
   - The account group's `{:else if drawnAccount.length}` branch: before
     `.listgrid`, `<BatchBar total={drawnAccount.length}
     picked={ticked.length} label={t.pickAll} count={`${t.selected}
     ${String(ticked.length)}`} onall={pickAllCards}>` with `actions`:
     `<Button size="sm" onclick={() => void app.exportLists(ticked.map((l)
     => l.id))}>{`${t.exportJson} (${String(ticked.length)})`}</Button>`
     and `<Button size="sm" variant="danger"
     onclick={delPicked}>{`${t.del} (${String(ticked.length)})`}</Button>`.
     Each account `ListCard` gets `picked={sel.has(l.id)}` and `onpick={(on)
     => { if (on) sel.add(l.id); else sel.delete(l.id); }}`; browser
     cards get neither.
   - `pickAllCards(on)`: `sel.clear(); if (on) for (const l of
     drawnAccount) sel.add(l.id);`. The prune effect of P3.
   - `delPicked()`: `const gone = ticked;` `names = fewNames(gone.map((l)
     => t.quoted.replace('%s', l.name || t.untitled)), t)`; `if
     (!app.env.dialog.confirm(t.deleteListsConfirm.replace('%n',
     String(gone.length)).replace('%s', names))) return;` then `for (const
     l of gone) cloud?.remove(l.id); sel.clear(); app.say(t.listsDeleted.replace('%n',
     String(gone.length)));`. The single-card «Удалить» stays as it is.
   - `listsPage.test.ts`: the count moves to the meta line on account and
     browser cards (no `.badge.num` on the index); a pick box per account
     card named «Выбрать: <name>», none on browser cards; ticking two draws
     «Выбрано 2», «Скачать JSON (2)», «Удалить (2)», the mixed box, the
     picked cards' class; «Скачать JSON (2)» downloads the two in index
     order and keeps the ticks; «Удалить (2)» with the fake dialog
     answering no changes nothing and keeps the ticks, answering yes
     removes both cards, toasts «Удалено списков: 2», clears the ticks, and
     the fake holds neither after the quiet window (fake timers); the
     confirm names five lists then «и ещё 2» for seven; «Выбрать все» with
     a query ticks only the drawn matches (a fake seed of nine account
     lists, two matching «порт»); a ticked card hidden by a query is
     unticked and not counted, and stays unticked when the query is
     cleared (P3); «Показать ещё» keeps the ticks; the import toggle is
     absent signed out, while loading and on a failed read; axe clean with
     one card picked.
8. **`ListPage.svelte`** - «Скачать JSON» in the `Actions` row after
   «Скопировать текст», before «Печать», `{#if isCloud}` only: `<Button
   size="sm" onclick={() => void app.exportLists([own.id])}>{t.exportJson}</Button>`
   (P20: no icon). `listPage.test.ts`: the button on an account list
   downloads `<name>.json`; no button on a browser list; every existing
   case passes unchanged.
9. **`AccountPage.svelte`** - a `Panel` between «Способы входа» and
   «Выход» (mocks `m12`, `m13`): `<Field label={t.yourData} heading>`,
   `<p class="hint lead">{t.yourDataHint}</p>`, `<div class="row-btns"><Button
   disabled={exporting || app.cloudLists?.status !== 'ready'}
   onclick={() => void exportData()}>{t.exportData}</Button></div>`; when
   `app.cloudLists?.status === 'error'`: `<p class="err"
   role="alert">{t.cloudLoadFailed}</p>` and `<div class="row-btns"
   style="margin-top:8px"><Button size="sm" onclick={() => void
   app.retryLists()}>{t.retry}</Button></div>`. `exporting` is a local
   `$state(false)` set around `await app.exportData()`. `accountPage.test.ts`:
   the panel's place (between the two headings), the download of
   `daggerheart-loot-data-<day>.zip`, disabled while loading, the failed
   line and «Повторить» re-reading, axe clean.
10. **`help.ts` `LISTS`** - a sixth paragraph, RU: «Списки аккаунта можно
    отметить и скачать файлом JSON или удалить разом, а «Импорт из файла»
    добавляет списки из такого файла - например, чтобы перенести их в
    другой аккаунт. Формат файла описан для ИИ-помощников в llms.txt.»;
    EN: 'Tick account lists to download them as a JSON file or delete them
    together; "Import from file" adds lists from such a file - to move them
    to another account, for example. The file format is described for AI
    assistants in llms.txt.' (`p(...)` form, as the first two paragraphs).
11. **`a11y.test.ts`** - the index with the strip on (two ticked), the
    import field open with the preview report, the error report, and
    «Ваши данные»: no axe violation.
12. **Harness.**
    - `tests/app/driver.js`: the `prepare()` hook and the `download()` and
      `upload(path)` verbs of 4.7; `upload` then waits as `click` does
      (`settle`).
    - `tests/app/inventory.js`: the six new states of 4.7 (ids and their
      `why` in "Golden ids" below; paths through `path.join(__dirname,
      '../../docs/fixtures/import/<file>')`); in the re-seeded states only,
      a `why` that names the badge («a badge of 7») or «изменён» without the
      count now names the meta line, `#/lists ~ help` says six paragraphs,
      the `#/account` states name «Ваши данные», the account list page
      states name «Скачать JSON» where they list the actions. Do not edit
      the `why` of any state outside the 26 (its golden header would stop
      matching).
    - `tests/app/states.js`, cases 58-62, registered in the run list after
      57:
      - 58 "the ticked lists download as one lists file": as `gm1` on
        `#/lists`, tick «Выбрать: Пустой список» and «Выбрать: Лавка
        кузнеца», press «Скачать JSON (2)»; `d.download()` is
        `daggerheart-loot-lists-2026-10-01.json`, type `application/json`;
        its JSON has `format` `daggerheart-loot/lists`, `version` 1,
        `exported_at` `2026-10-01T12:00:00.000Z`, the two lists in index
        order, `ci1` at `quantity` 2 and `price_coins` 150, `q1` with its
        player note, `money_mode` `coin` on «Лавка кузнеца», no `id` key on
        a list; the two boxes are still ticked.
      - 59 "the account's data zip reads back through the import field":
        as `gm1` on `#/account`, press «Скачать мои данные (ZIP)»;
        `d.download()` is `daggerheart-loot-data-2026-10-01.zip`, type
        `application/zip`, starting `PK\x03\x04`; write its bytes to a
        file under `os.tmpdir()`, `d.go('#/lists')`, press «Импорт из
        файла», `d.upload(<that file>)`: the preview reads «Списков: 3»
        and «Импортировать (3)»; then `d.upload(docs/fixtures/import/data.zip)`
        previews «Списков: 3» too; delete the temporary file.
      - 60 "an imported list opens with its rows in file order": as `gm1`,
        upload `example.json`, press «Импортировать (1)», wait for
        «Импортировано списков: 1»; the first card is «Лавка кузнеца» with
        «изменён только что»; open it: the sub reads «3 позиции», the rows
        are ci1, q1, q313 in that order, ci1 shows «×2» and 150.
      - 61 "ticked lists are deleted together after one confirm": as
        `gm1`, tick «Выбрать: Пустой список» and «Выбрать: Трофеи», press
        «Удалить (2)»; `d.dialog()` names «Пустой список» and «Трофеи»; the
        two cards are gone, the toast «Удалено списков: 2» has no
        «Вернуть»; after `d.writesSettled()`, `d.fake('lists.list')` holds
        «Лавка кузнеца» alone (P11).
      - 62 "a search prunes the ticks and select-all ticks the drawn
        cards only": seed nine browser lists («Порт Ветров», «Рынок»,
        «Лавка в порту» and «Сессия 1»..«Сессия 6», no entries) with
        `d.seed`, open `#/lists` as `gm1`, `d.moveSettled()` (twelve account
        lists: the search box shows); tick «Выбрать: Порт Ветров» and
        «Выбрать: Рынок»; type «порт» into «Найти список»: «Выбрано 1» and
        «Удалить (1)»; clear the query: «Рынок» is drawn unticked,
        «Выбрано 1»; type «порт» again and tick «Выбрать все»: «Выбрано 2»,
        «Скачать JSON (2)»; the checkboxes of the twelve-list page are
        never ticked out of sight (count the checked `.listcard-pick
        input` equal to the summary's number at each step).
    - `tests/e2e/flows.mjs` F13 (after F12, the same `deleteListsOf` /
      `withPage` / `until` shape): the member's lists deleted; on
      `#/lists`, wait for «Ваш аккаунт», press «Импорт из файла»,
      `d.upload(<repo>/docs/fixtures/import/example.json)`, press
      «Импортировать (1)», wait for «Импортировано списков: 1»; `until`
      `listsOf(admin, member.id)` holds one list «Лавка кузнеца» whose
      entries by position are ci1 (quantity 2, `price_coins` 150), q1,
      q313; type «F13» into the name field and press «Создать»; `until`
      the member holds two lists; tick «Выбрать: Лавка кузнеца» and
      «Выбрать: F13», press «Удалить (2)» (the driver accepts the confirm);
      `until` the member holds none; `deleteListsOf` in `finally`; log
      `e2e: F13 ok`. The file's header list of flows gains F13.
13. **Docs**, each in this commit:
    - `FEATURES.md` "Lists": the card's meta line (count and edit time; a
      browser card the count); the pick boxes on account cards, the strip
      («Выбрать все» over the drawn cards; a search or a fold drops the
      ticks that leave the view), «Скачать JSON (N)», «Удалить (N)» with
      its confirm and no undo; «Импорт из файла» in «Новый список» with
      the preview, the grouped skip and error reports, and the one-line
      refusals. "Account and browser lists": the three exports, the file
      and the zip, the import (create-only, all or nothing, new ids, a
      repeated name allowed and noted), and 4.15's case (a moved list
      over 100 entries cannot move by file; split it first) - spell 100
      and the word apart as 4.15 says. "Account": «Ваши данные».
    - `META.md` section 3: one paragraph - an account's lists leave it only
      as the reader's own file (the JSON or the data zip), which is the
      per-user backup and the way between two accounts; the site keeps no
      copy and imports nothing it did not get from the reader.
    - `STATE.md` "The in-memory state object", the Lists row: the index's
      ticked account lists (page memory, pruned to the drawn cards) and the
      import field's file, preview and rows (page memory, forgotten on the
      fold).
    - `COVERAGE.md`: the `app/states` row (sixty-two states; 58-62 in its
      list), the flows list (F13), the golden count (+6), the new unit
      tests in "The unit suite" (`batchBar.test.ts`, `importPanel.test.ts`,
      the added cases of `bundle.test.ts`, `zip.test.ts` - `manyLists` in
      its row, which says `noLists` for two today - `i18n.test.ts`,
      `cloudLists.test.ts`, `app.test.ts`), the driver's `download()` and
      `upload()`.
    - Decision 4 of section 10 as a file from
      `.claude/templates/decision.template.md`, then `node
      tools/decisions.js`.
14. **Gates**, in order (Verification below). Amend: `git commit --amend`
    with the subject unchanged (`feat(persist): export and import account
    lists as a published JSON bundle`) and a body that adds the UI. Stop
    for the batch review; the orchestrator runs the goldens (P12) and
    `node tests/app/sweep.js 360`, and amends the golden files.

### Golden ids

Re-seeded (26; each changes: the card's meta line, the pick boxes, the
strip, the import toggle, «Скачать JSON» or «Ваши данные»):

- `#/lists as gm1`, `#/lists ~ move notice dismissed as gm1`, `#/lists ~
  another account as gm2`, `#/lists ~ read-only`, `#/lists ~ two lists`,
  `#/lists ~ notice unfolded`, `#/lists ~ notice dismissed`, `#/lists ~
  help`, `#/lists ~ created as gm2`, `#/lists ~ many lists`, `#/lists ~
  shown more`, `#/lists ~ filtered`, `#/lists ~ requests as gm1`;
- `#/lists/<uuid(101)>` (`SHOP`) `as gm1`, `~ share as gm1`, `~ share
  deleted as gm1`, `~ requests as gm1`, `~ short as gm1`, `~ not saved as
  gm1`; `#/lists/<uuid(103)>` (`TROPHIES`) `~ share as gm1`;
- `#/l/ ~ shared, saved as gm2`, `#/s/gm-token-1 ~ saved as gm2` (both land
  on an account list page);
- `#/account as gm1`, `#/account as gm2`, `#/account ~ delete confirmation
  as gm1`, `#/account ~ pinned table as gm2`.

New (6), each `as gm1` on `#/lists`:

| Id | Enter | Mock |
|---|---|---|
| `#/lists ~ lists selected as gm1` | tick «Выбрать: Пустой список» and «Выбрать: Трофеи» | `m02` |
| `#/lists ~ import panel as gm1` | press «Импорт из файла» | `m04` |
| `#/lists ~ import preview as gm1` | the panel, `d.upload(unknown-id.json)`, wait for «Пропущено позиций» | `m06` (P15) |
| `#/lists ~ import refused as gm1` | the panel, `d.upload(errors.json)`, wait for the error box | `m07` |
| `#/lists ~ imported as gm1` | the panel, `d.upload(example.json)`, press «Импортировать (1)»; `timed` | `m10` |
| `#/lists ~ lists deleted as gm1` | tick «Выбрать: Пустой список» and «Выбрать: Трофеи», press «Удалить (2)» (the driver accepts the confirm); `timed` | `m17` |

Unchanged (the `BatchBar` proof and the rest; P12): every `#/lists/a*`
state, `#/lists/b`, `#/lists/nope`, `#/l/ ~ own list`, `#/lists`, `#/lists
~ load failed`, `#/lists ~ unreadable storage`, `#/lists ~ nothing found`,
`SHOP` signed out, `#/account` signed out, and every other id.

### Acceptance

Each line is its own outcome; the batch is not closed while one has none.

Inherited - the owner's answers and statements:

- Q1: an import is all or nothing - a refused call leaves the account as
  it was and the preview up (`importPanel.test.ts`, the limit case).
- Q2: every export carries both notes of the lists and entries (state 58,
  `app.test.ts`).
- Q3: three export surfaces - «Скачать мои данные (ZIP)» on `#/account`,
  «Скачать JSON (N)» on the selection strip, «Скачать JSON» on an account
  list page.
- Q4: an unknown id is skipped and named with its list and position
  before the press (the `~ import preview as gm1` golden).
- Owner statement 1 (selection on the index, batch deletion): account
  cards tick in place; «Удалить (N)» deletes the ticked lists after one
  confirm that names them, with no undo, through the write buffer
  (state 61, `listsPage.test.ts`).
- Owner statement 2 (the count): no gold badge on a list card; the count
  is in the meta line «N позиций · изменён ...» (every re-seeded
  `#/lists` golden).
- Owner statement 3 (the schema link): the import hint links
  `schema/import-v1.json` and `llms.txt`, relative, in a new tab
  (`importPanel.test.ts`).
- Owner statement 4 (duplicates): a name the account holds imports as a
  second list and is noted in the preview; a repeated id keeps the first
  and names the second with both positions (`importPanel.test.ts`).
- Owner statement 5 (a richer report): skips and errors are grouped by
  list, each line naming the position, the record and the path
  (`importPanel.test.ts`, the `~ import preview` and `~ import refused`
  goldens).
- Owner statement 6 (a generic account export): «Скачать мои данные
  (ZIP)» downloads `daggerheart-loot-data-<date>.zip` holding
  `lists.json` (state 59, `app.test.ts`).
- Owner statement 7 (`llms.txt` teaches files only): done in `B6.1`;
  here the help paragraph and the hint name `llms.txt`, and the labels
  `llms.txt` names are the interface's (`i18n.test.ts`).

Placed items:

- Risk 7 (`plan-B6.1-10`): `BatchBar` holds only the strip's own CSS; the
  snippet classes keep theirs in `ListPage.svelte` (P1); `npm run check`
  reports no unused selector.
- Risk 8 (`plan-B6.1-11`): an account card with pending requests draws
  the meta line, then R4's gold line, then the thumbs, with the pick box in
  its corner and R4's link label unchanged (P2; the `#/lists ~ requests as
  gm1` golden); no mock changed.
- Risk 9 (`plan-B6.1-12`): the selection never holds a list that is not
  drawn (P3; `listsPage.test.ts`, state 62).
- `plan-B6.1-22`: the owner's statements 1-7 are seven lines above.
- `plan-B6.1-2-N4`: 4.6's key table holds every new key, `importTooSlow`
  and `exportOverBounds` included, and `dict.ts` holds exactly those.
- `plan-B6.1-2-N5`: two `lists.json` at one depth answer `manyLists` with
  its own text (P5; `zip.test.ts`, `importPanel.test.ts`).
- The error texts left by `B6.1`: an `id` failing `ID_PATTERN` reads
  `importErrId`; an empty or absent list name reads `importErrName`;
  a `tooSlow` refusal toasts `importTooSlow` (P6; `importPanel.test.ts`).
- The owner's QA files: none enters the repository (P13).
- `B6.1-R1`: both READMEs point at the import file, the schema and
  `CONTRACTS.md` section 3, not at `llms.txt` for the `#/l/` format; this
  lands before the push.
- `B6.1-N1`: no test title in `bundle.test.ts` cites a plan section.
- `B6.1-N2`: `lib/zip.ts` exports `ZIP_ENTRIES_MAX`; `ENTRIES_MAX` means
  100 entries only.
- `B6.1-N3`: `PRODUCT.md` and `META.md` section 4 name
  `schema/import-v1.json` (and its `ROOT_DIRS` junction).
- `B6.1-N4`: the zip decision file's Task line names who decided and
  when, nothing else; `docs/DECISIONS.md` rebuilt.
- `B6.1-N7`: left with its reason (P14) and named in the handoff's
  Deferred for R7's `B7.3`.

From the outline:

- `lib/zip.ts` is reached only through `import('../lib/zip.js')`
  (`AppState.exportData`, `ImportPanel`): `git grep -n "lib/zip" --
  app/src ':!*.test.ts'` shows only those two dynamic imports; `npm run
  check:built`'s budget passes; the handoff records the zip chunk's gzip
  size from `node tools/bundle-budget.mjs` (estimated about 1.5 kB).
- The list page draws exactly what it drew: after the orchestrator's
  `--update`, no `#/lists/a*`, `#/lists/b` or `#/l/ ~ own list` golden
  changed, and `listPage.test.ts` passes with no case edited.
- A retry after `network` sends the same rows (`importPanel.test.ts`: two
  calls with equal ids).
- `CloudLists.import` sends the buffer first and re-reads without
  «Загружаем...» (`cloudLists.test.ts`).

Behaviour (4.6, 4.7, 4.10-4.15):

- The pick box is a 32 px box with a 44 px target, outside the card's
  link, named «Выбрать: <name>»; a ticked card has the gold border
  (P17; the `~ lists selected` golden; sweep 360 green).
- «Выбрать все» ticks the drawn cards only; the strip at 360 px puts
  «Скачать JSON (N)» and «Удалить (N)» on their own line, each half the
  width (mock `m02`).
- «Скачать JSON (N)» keeps the selection; a file past 50 lists or with a
  list past 100 entries still downloads whole and toasts the over-bounds
  text (4.15; `app.test.ts`).
- A refused `remove` in a batch draws that list again with one
  `writeRefused` toast; the others stay deleted (`cloudLists.test.ts`,
  mock `m18`).
- The import field: `m04` empty, `m05` preview, `m06` skips, `m07`
  errors, `m08` one-line refusals (each of the seven texts plus
  `importZipManyLists` and `importNoVersion`), `m09` both buttons disabled
  while sending, `m10` folded with the toast and the new card first,
  `m11` the limit toast with the preview kept.
- A file of more than 5 MiB is refused before it is read.
- The zip's other files are named under the preview (first five, then
  «и ещё N») and the lists import.
- «Ваши данные» sits between «Способы входа» and «Выход», disabled until
  the lists are read, with «Повторить» after a failed read (`m12`, `m13`).
- «Скачать JSON» sits after «Скопировать текст» on an account list page
  only (`m14`).
- `help.ts` `LISTS` has the sixth paragraph in both languages.
- Every new string is in `dict.ts` in both languages; `tests/derived.js`'
  count check passes.
- States 58-62 and flow F13 green; the six new goldens seeded.
- `FEATURES.md`, `META.md`, `STATE.md`, `COVERAGE.md` and decision file 4
  are in the commit.
- Every new component test ends with `expectNoA11yViolations`; coverage
  reaches `BatchBar.svelte` and `ImportPanel.svelte` through their own
  tests.

### Verification

Implementer, in this order (each one foreground call):

1. `npx vitest run <file>` while working (focused, no coverage), and
   `rtk npm run test` once before the check (vitest with coverage, about
   3-5 minutes).
2. `rtk npm run check` (Bash, timeout 600000; about 7-10 minutes; it runs
   `node tests/derived.js`, so the README and dictionary counts are
   checked here).
3. `npm run check:built` (about 2-3 minutes; the budget and the smoke;
   it builds `dist-test/` last, after the check, so the stale-build guard
   holds).
4. `node tests/run-all.js app/states` (about 5 minutes; cases 58-62).
5. `node tests/run-all.js app/print,app/contracts,app/typo,app/hues,stub`
   (about 7-8 minutes).
6. `npm run e2e` (about 3 minutes; F13 on the test project, where `B6.1`'s
   resumed step pushed `import_lists`).

Orchestrator, after the implementer's amend (P12): `node tests/app/golden.js
--update --shard=1/4` through `--shard=4/4` (one call each, about 3
minutes each), `git status --short tests/app/snapshots/` against "Golden
ids", then `node tests/app/sweep.js 360` (about 7-9 minutes); amend the
golden files.

Total: about 33 minutes for the implementer, 22 for the orchestrator.

### Risks / do-nots

- Do not edit anything under `supabase/` or `tests/db/` (P14; it would
  add `npm run check:db`).
- Do not edit `llms.txt`, `schema/import-v1.json` or `docs/fixtures/`: the
  contract shipped in `B6.1`. If a label `llms.txt` names must change,
  stop: that is a contract change.
- Do not edit any mock; P15 and P16 are the two recorded differences.
- Do not import `lib/zip.ts` statically anywhere in `app/src`.
- Do not give `BatchBar` a prop no caller needs, and do not merge it with
  `SelBar`.
- Do not change the `why` of a state whose golden is not re-seeded.
- Do not add a toast to a successful export (the browser's download is
  the feedback), and do not make the over-bounds toast an error.
- Do not queue the import in the write buffer or draw an optimistic card.
- The fake does not survive a reload: read it through `d.fake(...)`.
- Do not push; the closeout pushes once (`B6.1-R1` is in this amend).

### Fallback

- If `userEvent.upload` refuses the `hidden` input in jsdom, the tests set
  `files` with `Object.defineProperty` and fire `change` (P7 keeps the
  `hidden` input).
- If CDP's `uploadFile` does not fire `change` on the `hidden` input in
  Chrome, the input becomes visually hidden (the app's `.vh` pattern if one
  exists, else `position: absolute; width: 1px; height: 1px; overflow:
  hidden; clip-path: inset(50%)`) with `tabindex="-1"`, and the sweep's
  name check reads its `aria-label={t.importPick}`.
- If the `--update` diff of P12 shows an unexpected golden, the
  implementer is resumed with that id; no golden outside the list is
  committed changed.

## 10. Decisions (`docs/decisions/`)

1. "The list file `import-v1` is a strict JSON Schema; import makes new
   ids" - unchanged (`format` stays `daggerheart-loot/lists`).
2. "An import is one `import_lists()` transaction: every list or none" -
   amended in pass 2: `security invoker` (the `apply_list_writes`
   pattern), with `security definer` added to the rejected options.
3. "Import validation is the client's; the count limits are the
   database's" - unchanged.
4. New in `B6.2` (not written in a planning pass, because it is behaviour
   the batch establishes): "Account lists are selected on the lists index
   and deleted together through the write buffer, with one confirm and no
   undo" - with the rejected `delete_lists` RPC and the rejected undo
   (4.10).

5. New in `B6.1` (the batch that publishes the zip layout): "The account's
   data file is a store-only zip with one JSON file per kind; import reads
   it and plain JSON" - the owner's Q5 answer, the hand-written writer and
   reader, and the rejected fflate and single-JSON options (4.14).

The index `docs/DECISIONS.md` is rebuilt by `node tools/decisions.js`.

## 11. Owner questions

### Q6 - answered 2026-09-27 (review item `plan-B6.1-2`)

Owner: keep the frozen bounds equal to the default limits (50 lists, 100
entries); name the case in FEATURES and the export hint; the import
report names the list and the bound. Trade-off accepted: a moved list
over 100 entries cannot move between accounts by file. Applied in 4.15.
### Q5 - answered 2026-09-27: B, a zip

Owner, 2026-09-27: "for downloading from account view, should we make it
more abstract given we plan to add export of homebrew items later as
well?" and "and it will be downloaded as zip file maybe". Asked: one JSON
file with a section per kind (A, recommended) or a zip (B). Answer: **B** -
the account's «Скачать мои данные» downloads a zip holding `lists.json`
now, `homebrew.json` in R7, pictures in R8. Applied in 4.14: a
hand-written store-only writer and reader, loaded lazily; import reads the
zip and plain JSON; the `#/lists` exports stay plain JSON; `format`
stays `daggerheart-loot/lists`.

### Q1-Q4 - answered 2026-09-26

Answers (owner, 2026-09-26, all as recommended): Q1 import is all or
nothing (one `import_lists` transaction); Q2 an export always carries both
notes, with no players' variant; Q3 three export surfaces (the account,
the lists index, the list page one - the index's checklist became the
selection strip on 2026-09-27); Q4 unknown catalog ids are skipped and
named in the preview and the result. The questions as asked are in `git
show 1cbca5f7:issues/persist-6-import-export/plan.md` section 11.

### Owner input of 2026-09-27, applied

`context.md` quotes the eight statements. `llms.txt` as a first-class
deliverable - 4.9; selection on the index and batch deletion - 4.6,
4.10; the list count - 4.11; the schema link - 4.12; duplicates - 4.13;
the grouped skip and error report - 4.4, 4.13; the generic account
export - 4.14 and Q5; `llms.txt` without the `#/l/` guidance - 4.9.

Consequences named, not asked: the schema pins 50 lists and 100 entries
per file (a raised per-user limit still applies per account: several
files); an export carries no ids, timestamps or share links; an imported
list has no share links until the owner makes them; the browser's own
download UI is the only feedback of an export; the order of imported
lists on the index is by the database's stamp (one transaction, one time,
then the id), not the file order; a batch deletion cannot be undone, as
one deletion cannot.

## 12. Risks, assumptions, deferred

- Closed in pass 5: jsdom 30.0.1 implements `File.prototype.arrayBuffer`
  and `text` (checked 2026-09-28), so the panel reads with
  `file.arrayBuffer()` alone. Puppeteer's `uploadFile` is CDP
  `DOM.setFileInputFiles`, which does not depend on visibility, so the
  input is `hidden` (section 9, P7; its Fallback names the visually hidden
  input if Chrome disagrees).
- Risk: a 50-list import (or a 50-list batch delete) sends 50 owner
  messages in one commit; with two or more other devices subscribed that
  passes the free plan's 100 messages per second and Realtime may drop
  the connection. The feed goes `down`, the poll and the rejoin's refetch
  cover it (R3 plan 6.2); the acting tab re-reads by itself. Accepted.
- Risk: the hosted statement timeout (8 s for `authenticated`) and the
  request body limit for a maximal import are unmeasured; the contract
  case measures the first (section 8, Fallback).
- Risk: the `lists_limit` trigger runs per row and takes the owner's
  advisory lock per row; 50 lists in one call is fine in one
  transaction - named so nobody turns the loop into one multi-row insert
  without reading the trigger.
- Risk: removing the `#/l/` guidance before 2026-10-26 (if R6 ships
  first) leaves an agent unable to build a link that still opens for a
  few days - intended by the owner; `llms.txt` points at files.
- Risk: the blind round depends on one agent's reading; three rounds are
  the bound, and the pins P1 and P2 stay as the regression guard after it.
- Risk (review item `plan-B6.1-9`): an import that committed but whose
  answer was lost is recognised by the store's re-read (4.5, Store) and
  not offered again; if the re-read also fails, the preview stays and a
  retry re-applies the same rows - their ids are the same, so the RPC
  skips the lists and inserts only entries that are missing, which can
  bring back an entry deleted in between. Rare (two failures in a row);
  accepted.
- Risk (review item `plan-B6.1-8`): the task is rebased with `git rebase
  --onto <main> 1cbca5f7`; the worktree's committed `context.md`,
  `plan.md` and roadmap rows win over the main checkout's uncommitted
  copies, which the orchestrator merges at the cherry-pick.
- Risk (review item `plan-B6.1-7`): `check:db` may pass the 600 s cap
  with R4's and R6's suites; step 12 names the background-run rule.
- Risk: batch deletion removes data with no undo; the confirm names the
  lists and the count, «Выбрать все» ticks only drawn cards, and the
  plan review covers the path.
- Risk: 26 goldens re-seed and 6 are new (section 9, "Golden ids"); the
  reviewer reads the diff, and the one `--update`'s diff must leave every
  local list page golden unchanged (P12).
- Size: this file passed the 150 KB warning line in pass 5 (about 180 KB).
  Section 8 collapses to its outcome and commit once `B6.1`'s resumed step
  (the push and `npm run e2e`) has run - its full text stays at
  `7753e6f2` - in the `B6.2` amend or at the closeout
  (`.claude/skills/handoff/SKILL.md`).
- Deferred: `B6.1-N7` (the `before` shadow in
  `tests/db/import-lists.test.mjs`) to R7's `B7.3`, and `B6.1-N6` (the
  `or` chain in `import_lists`) to the next edit of that migration
  (section 9, P14); bundle v2 (R7); pictures in the data zip (R8, a `pictures/` folder) and deflate in `lib/zip.ts` if R8 needs it; a
  JSON-Schema runtime validator (never, unless the hand-written one
  drifts twice); a CSV export; import of preferences; selection of
  browser lists (they end at the cutoff).
