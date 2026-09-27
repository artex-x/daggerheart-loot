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
  implement-ready after the delta check (section 8); `B6.2` (UI) -
  outline with the design settled (section 9); closeout.
- Gate cost: `B6.1` about 35 minutes, `B6.2` about 80 minutes, closeout
  about 5 minutes; about 120 minutes in total (section 7).
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
| `version` not 1 | `parseBundle` | «Неизвестная версия формата: %n. Приложение читает версию 1.» |
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
  new `reason: 'tooBig'` on `ListWrite`'s refused branch (optional, only
  `import` sets it); the panel then shows «Файл слишком большой для одного
  импорта: разделите его на несколько.» (`importTooSlow`). `writeOf`
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
    page's `lsel`), is cleared on leaving the route, and drops an id whose
    list is gone after a re-read.
- **Import** (`ImportPanel.svelte`, used once): «Импорт из файла» - a
  ghost `sm` button with a caret and `expanded` in the «Новый список»
  panel under the name row (an import makes new lists); it opens a second
  `Field` «Импорт из файла» inside the same panel. «Выбрать файл...»
  is a `Button`-styled `<label>` over a visually hidden `<input
  type="file" accept=".json,.zip,application/json,application/zip">` (not
  `display: none`); the file name beside it; the size check; the bytes
  (`file.arrayBuffer()`, fallback `FileReader.readAsArrayBuffer`); a file
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
  данные». Списки добавятся как новые; существующие не изменятся.».
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
- **Texts**: every string in `dict.ts`, RU and EN. New keys:
  `exportSelected` («Скачать JSON (%n)»), `exportOne` («Скачать JSON»),
  `yourData`, `yourDataHint`, `exportData` («Скачать мои данные (ZIP)»), `importZipNoLists` («В архиве нет файла lists.json.»), `importZipPacked` («Архив сжат другой программой: распакуйте его и выберите lists.json.»), `importZipOther` («В архиве есть файлы, которые эта версия не читает: %s.» - `%s` the first five names, then «и ещё %n»), `importNotZip` («Это не архив данных.»),
  `pickList` («Выбрать: %s»), `deleteListsConfirm`, `listsDeleted`
  («Удалено списков: %n»), `importOpen` («Импорт из файла»), `importPick`,
  `importHint`, `importSchema` («схеме import-v1»), `importLlms`
  («описание для ИИ-помощников»), `importPreview`, `importSkippedN`,
  `importSkipUnknown`, `importSkipRepeat`, `importNameTaken`,
  `importListEmpty`, `importNoName`, `importGo`, `importDone`,
  `importTooBig`, `importNotJson`, `importNotBundle`, `importVersion`,
  `importEmpty`, `importErrors`, `importErrMissing`, `importErrType`,
  `importErrLong`, `importErrRange`, `importErrEnum`, `importErrExtra`,
  `importErrMany`, `importErrMoreList`, `importErrMore`, `importPos`
  («Позиция %n»), `listMeta` («%s · %t» for the card's count and edited
  time). Reused: `pickAll`, `selected`, `cancel`, `retry`, `del`,
  `accountFailed`, `cloudLoadFailed`, `limitLists`, `limitEntries`,
  `itemsN`, `writeRefused`.
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
  `download()` returns `{ filename, text }` or null. The verb
  `upload(path)` sets the page's one `input[type=file]` through
  `elementHandle.uploadFile(path)`. The existing confirm answer and
  message verbs serve the batch delete.
- `tests/app/inventory.js`, all `as gm1` on `#/lists`: `~ lists
  selected` (two ticked, `m02`); `~ import panel` (`m04`); `~ import
  preview` (`unknown-id.json`, `m06`); `~ import refused` (`errors.json`,
  `m07`); `~ imported` (`example.json`, press, `m10`; `timed`); `~ lists
  deleted` (two ticked, confirm answered yes, `m17`; `timed`). Re-seeded:
  every `#/lists` state, signed in or out (the card's count moves, 4.11;
  the pick boxes and the strip on the account group), `#/lists ~ help`,
  `#/account as gm1`, `#/account as gm2`, `#/account ~ delete
  confirmation as gm1`, and every `#/lists/<uuid(101)>` state as `gm1`
  (the action row) - the implementer lists them from `inventory.js`.
- `tests/app/states.js`, cases numbered after the last case on `main`
  (`B3.2` adds 52-53; R4 adds more `[B3.2]` `[R4]`): (a) tick «Пустой
  список» and «Лавка кузнеца», «Скачать JSON (2)»: `d.download()` parses
  to `format` `daggerheart-loot/lists`, `version` 1, the two lists in the
  index order, `ci1` at `quantity` 2 and `price_coins` 150, `q1` with the
  player note, `money_mode` `coin`, no `id` on a list; (b) `#/account`
  «Скачать мои данные (ZIP)» downloads `daggerheart-loot-data-<date>.zip`
  (the driver's `download()` returns the bytes as base64 for a binary
  blob); the case reads it with the test's own zip reader of 4.14: one
  entry `lists.json`, stored, CRC right, its text equal to
  `docs/fixtures/import/export.json` apart from `exported_at`; (b2)
  importing `docs/fixtures/import/data.zip` previews «Списков: 3»; (c) the
  imported list opens at `#/lists/<uuid of the new list>` with «3
  позиции» and the rows in file order; (d) tick two, «Удалить (2)»: the
  confirm names both, «Отмена» keeps both and the selection; yes removes
  both, the toast, and a reload (the fake keeps its rows) shows them gone;
  (e) «Выбрать все» with a search query ticks only the drawn cards.
- E2E flow (`tests/e2e/flows.mjs`, the next free number after `B3.2`'s
  F11 and R4's flows `[B3.2]` `[R4]`): the member on `#/lists` uploads
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
     compared, never shown raw). `readDataZip` matches `lists.json` by the
     last path segment, case-sensitive: `lists.json` at the root wins; if
     none is at the root, the shallowest `<folder>/lists.json` is taken (a
     person unzipped and re-zipped the folder), so a re-zipped archive
     gives `packed` (usually deflated) or imports when stored - never a
     wrong `noLists`. Two candidates at the same depth: `noLists`, never
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
     other than 0: `packed`. None found: `noLists`.
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
| `B6.2` | vitest: `components/batchBar.test.ts` (new: mixed state, summary, actions snippet, axe), `importPanel.test.ts` (the grouped report, the name note, a retry sends equal ids), `listCard.test.ts` or `listsPage.test.ts` (the count line, the pick box, axe with a picked card), `listsPage.test.ts` (select, select-all over the drawn cards, export, batch delete with confirm yes and no, the selection pruned after a re-read), `listPage.test.ts` (unchanged behaviour through `BatchBar`), `accountPage.test.ts`, `a11y.test.ts` (the strip on, the import field open, the error report), `state/app.test.ts` (`exportLists`, `exportData` through `fakeImage`), `state/cloudLists.test.ts` (`import`: flush first, re-read, a dropped answer after `clear()`; batch `remove` of two in one request; a refused `remove` re-reads); `inventory.js` + goldens; `states.js` five cases; `flows.mjs` one flow; `driver.js` `download()` and `upload()` | `FEATURES.md` "Lists" (the card's count line, selection and batch deletion) and "Account and browser lists" (export and import) and "Account" (the panel); `docs/decisions/` (batch deletion, section 10); `META.md` section 3 (the file is the per-user backup and the way between accounts); `COVERAGE.md` (states, goldens, the driver verbs); `help.ts` `LISTS`; the privacy page needs no change |

## 7. Batches: gates, cost, review, split criterion

Costs: `context.md`, "Command costs" (this host, 2026-09-26/27).

| Batch | Goal | Gates (cost) | Review | Split criterion |
|---|---|---|---|---|
| `B6.1` | the contract, `llms.txt` and the database: section 8 | before the review: `rtk npm run check` (7-10 min), `npm run check:db` (9-10 min, PowerShell tool), `npm run check:built` (2 min; `dist/index.html` changes); the blind round (5-10 min, P3); after the approve: `db-push.mjs --project test` (1 min), `npm run e2e` (2-3 min) - about 35 min | required: plan review before the batch (Status), batch review after it (a migration, a public contract) | a public contract and SQL judged apart from Svelte, and the schema-batch rule: the test-project push and the E2E wait for the review's approve, which the UI batch must not hold up |
| `B6.2` | the UI: section 9 | `rtk npm run check` x2 (15-20 min), `npm run build:test` + `check:built` (2 min), `node tests/run-all.js app/contracts` (6 min) and `node tests/run-all.js app/print,app/states,app/typo,app/hues,stub` (6-8 min), goldens `--update` 4 shards (13 min; every `#/lists` state moves), goldens compare 4 shards (13 min; the list page must not move after the `BatchBar` extraction - compare before the re-seed), `node tests/app/sweep.js 360` (7-9 min, the strip and the pick boxes add controls to `#/lists`), `npm run e2e` (2-3 min) - about 80 min | required: new UI; batch deletion (stored data) | a commit the harness cannot reach otherwise: the states and the flow need `B6.1`'s fake `import`, fixtures and the migration on the test project |

Total gate cost, one green pass per batch: about 115 minutes, plus the
closeout's push and CI watch (about 5 minutes). Not split further: the
selection, batch deletion, the count line, the three export surfaces and
the import field share one route (`#/lists`), one component set, one
seed (`gm1`) and one golden re-seed; the README's test says merge. The
`BatchBar` extraction rides with them because its second use is on the
same page; its no-change proof is the golden compare before the re-seed. Commit
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
   `[B3.2]`; a 500 with code `57014` answers `refused` / `tooBig`, while
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
  to `tooBig`; the contract's notes-heavy case is logged with its time.
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
  test project, answers `tooBig` (57014), or PostgREST refuses the body: record the measurement in
  `.claude/README.md` ("Supabase configuration") and stop for a planner
  pass - the candidate is a lower `FILE_MAX_BYTES` and a client split of
  a file into calls of at most N lists with one confirmation, which
  breaks Q1's all-or-nothing and needs the owner. The schema's bounds do
  not change. The cheaper first step, no owner needed: lower
  `FILE_MAX_BYTES` to the largest body measured green, with the panel's
  «Файл больше N МБ.» following it (review item `plan-B6.1-5`).

## 9. Batch `B6.2` - the UI (outline; the refresh after `B6.1` expands it)

Sections 4.6, 4.7, 4.10-4.14 and the `B6.2` row of section 6. Steps in
order: `dict.ts` keys (RU, EN); `CloudLists.import` (4.5, "Store"),
`AppState.exportLists` and `exportData`; `BatchBar.svelte` extracted from
`ListPage.svelte`'s `.batch` (run the golden compare of the list page
states before any other change lands, 4.10); `ListCard.svelte` (the count
line, the pick box); `ImportPanel.svelte` with its tests and axe (a JSON file and `data.zip` both preview; the three zip refusals; the other-files line);
`ListsPage.svelte` (the selection, the strip, export and batch delete,
«Импорт из файла» in «Новый список»); `ListPage.svelte` (the button,
`isCloud` only; R4's panel below the row `[R4]`); `AccountPage.svelte`
(«Ваши данные»); `help.ts`; `driver.js` verbs and the `__download`
hook; `inventory.js` states and the goldens re-seeded; `states.js` five
cases; `flows.mjs` one flow; `FEATURES.md`, `META.md`, `COVERAGE.md`;
the batch-deletion decision file (section 10). Mocks: `mocks/m01`-`m18`
(section 4.6's table); the drawn result matches them.

Acceptance carries every line of 4.6, 4.7 and 4.10-4.14 as its own line,
and these inherited lines each as its own:

- the owner's answers Q1-Q4 as applied (all or nothing; both notes; the
  export surfaces - now the account, the selection strip and the list
  page; unknown ids skipped and named);
- the owner's statements 1-7 of 2026-09-27 as applied (selection on the
  index and batch deletion; the count line; the schema link; duplicates;
  the grouped report; the generic account export per the Q5 answer;
  `llms.txt` teaching files only - done in `B6.1`, checked again here
  through the help text and the hint links);
- `lib/zip.ts` is reached only through a dynamic `import()` (account export, zip import) and `node tools/bundle-budget.mjs` stays within the configured build's 200 kB; the handoff records the zip chunk's gzip size (estimated about 1 kB);
- the list page's goldens compare equal after the `BatchBar` extraction,
  before the re-seed;
- a retry after `network` sends the same rows (an `importPanel.test.ts`
  case: the port records two calls with equal ids);
- `CloudLists.import` flushes the buffer first and re-reads without
  «Загружаем...» (a `cloudLists.test.ts` case);
- the `B6.1` review's deferred nits (none yet; the orchestrator places
  them here as lines).

Settle in the `B6.2` refresh, each then its own acceptance line
(review items `plan-B6.1-10` to `plan-B6.1-12`):

- `BatchBar` CSS scoping: only the wrapper classes move to
  `BatchBar.svelte` (`.batch`, `.batch.on`, `.batch-all`,
  `.batch-summ`, `.batch-acts`, the 640 px rules, `.batch :global(.btn.sm)`);
  the classes inside the caller's snippets keep their CSS in
  `ListPage.svelte` (`.batch-count`, `.batch-total`, `.np`, `.batch-lbl`,
  `.guess*`, `.money-act`, `.money-hint`), because snippet markup keeps the
  caller's scope. 4.10's "the inline `.batch` CSS moves with the markup"
  is read this way.
- R4's `ListCard` changes: R4 adds a gold pending line inside the card's
  link and changes its `aria-label`; compose it with 4.11's meta line and
  the corner pick box (the pending line under the meta line, the label
  carrying count, edited time and pending requests), and check it in
  delta line D9 with a mock update of `m01`/`m02`.
- A hidden ticked card: a filter change prunes the selection to the drawn
  cards (a tick that leaves the view is dropped), so «Удалить (N)» never
  counts a list out of sight; a `listsPage.test.ts` case.
- Review nit `plan-B6.1-22` (`deferred-scope`, handoff Deferred): the
  acceptance line for the owner's statements 1-7 above is split into
  seven lines in the refresh.

Gates: section 7, `B6.2` row.

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

- Assumption: jsdom implements `Blob.prototype.text`; if not,
  `FileReader.readAsText` - the component test decides.
- Assumption: Puppeteer's `uploadFile` on a visually hidden (not
  `display: none`) input fires `change`; if not, a plain styled input.
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
- Risk: every `#/lists` golden, signed out included (the count line), the
  `#/account` goldens and every `#/lists/<uuid(101)>` golden re-seed; the
  reviewer reads the diff, and the list page's goldens are compared equal
  before the re-seed.
- Deferred: bundle v2 (R7); pictures in the data zip (R8, a `pictures/` folder) and deflate in `lib/zip.ts` if R8 needs it; a
  JSON-Schema runtime validator (never, unless the hand-written one
  drifts twice); a CSV export; import of preferences; selection of
  browser lists (they end at the cutoff).
