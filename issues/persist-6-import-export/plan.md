# Plan - TASK persist-6-import-export (release R6)

## Status

- Planning pass 1, 2026-09-25, planner, in the worktree
  `.claude/worktrees/agent-a7cedf410497c36ee` (branch
  `worktree-agent-a7cedf410497c36ee`, base `da7378cb` = R2's local task
  commit, `B2.0`-`B2.2`). Planned ahead while `B2.3` is built in the main
  tree; R5, R3, R4, R7 and usage monitoring are planned in other worktrees.
- NEEDS_HUMAN_CONFIRMATION: no - the owner answered Q1-Q4 of section 11
  as recommended on 2026-09-26; the design and both batches stand.
- Next batch: `B6.1` (section 8), after a short refresh once R2 has closed
  (section 8, "Refresh before the build").
- Mocks: `mocks/b62-export-import.html` (frames A-E) over `mocks/mock.css`
  (R2's copy of `tokens.css` plus the classes marked NEW). The design hook's
  low-contrast flag reads the app's own `--muted2` on the wash, as it did
  for R2's mocks; left standing.

## 1. Objective and current state

Goal (roadmap section 3, 9, 12, 14; `context.md`): a signed-in reader
downloads their account lists as one JSON file - all, some, or one - and
imports such a file into an account as new lists. The file format,
`import-v1`, is published as a JSON Schema so that an LLM can build a file
for a GM, replacing the `#/l/` links that retire at the cutoff
(2026-10-26; `B5.1` announces, `B10.1` removes).

Current state (`da7378cb`):

- Account lists exist: `lists` and `list_entries` (`supabase/migrations/
  20260925130100_lists.sql`), owner-only RLS, limits 50 lists per owner and
  100 entries per list through `effective_limit()`, `list_entries.snapshot`
  bounded to 16384 bytes for the homebrew source; `ListRepository`
  (`app/src/ports/types.ts`) with `create`, `addEntries`, `reorder`,
  `remove`; the real adapter `supabase.ts`, the fake `fake-cloud.ts` seeded
  by `fake-cloud-seed.ts` (`gm1` three lists, `gm2` one), `lazy-cloud.ts`;
  the store `state/cloudLists.svelte.ts` (`CloudLists`, optimistic queue);
  the index `ListsPage.svelte` (group «Ваш аккаунт», cards, «Удалить»),
  the list page `ListPage.svelte` (action row «Скопировать текст»,
  «Печать», «Удалить»; `B2.3` adds «Поделиться»), `AccountPage.svelte`
  (four panels; the roadmap reserves a fifth, «Ваши данные», for R6).
- No file export or import exists anywhere. `ImagePort.download(blob,
  filename)` (`ports/image.ts`) already saves a blob as a file, and
  `fakeImage().downloaded` records it in tests.
- `llms.txt` documents the `#/l/` payload as the way an LLM hands a list
  over; `B2.3` is adding the retirement announcement with a pointer to
  "the JSON bundle from R6".
- The privacy page (`pages/src/privacy.html`, `en/`) already promises the
  recovery "export the data of the account you drop, delete it, import
  into the account you keep". R6 makes that true.
- Published machine surface: `data.json`, `catalog.csv`, `llms.txt`
  (`CONTRACTS.md` section 4; `ci.yml` "Collect" step; `check-site.lib.mjs`
  probes; `app/index.html` `<noscript>` links).

## 2. Scope and non-goals

In scope (R6):

- The file format `import-v1` (section 4.1) and its JSON Schema
  `schema/import-v1.json`, published at
  `https://artex-x.github.io/daggerheart-loot/schema/import-v1.json` - a
  public contract (section 4.2).
- Export: all account lists (`#/account`, «Ваши данные»), a chosen subset
  (the lists index, «Экспорт» panel with a checklist), one list (the list
  page's action row, «Скачать JSON»). Both notes always (Q2).
- Import: on the lists index, «Импорт» panel: choose a file, validate in
  the client, preview counts and skipped ids, one press, one transaction
  (`import_lists`), create-only with new ids (Q1).
- The pure module `lib/bundle.ts` (build, validate, parse), the port method
  `ListRepository.import`, the RPC and its layer 3 tests, the fake, the
  contract case, states and goldens, the E2E flow, `llms.txt`'s new
  section, specs.

Not in scope:

- Homebrew entries (`source: 'homebrew'`, snapshots): R7's bundle v2
  (section 4.8 names the seam).
- Preferences, shares, share tokens, purchase requests in the file: never
  (a file is lists only; shares are re-made in the new account).
- Import into browser (local) lists: never (local lists end at the cutoff,
  R5; import is for signed-in users - roadmap section 10).
- Merge or update of existing lists by id: never in v1 (create-only).
- A runtime JSON-Schema validator dependency (ajv): rejected (bundle
  budget 170 kB; a hand-written validator in `lib/` is small and the
  schema-drift test keeps the two equal).
- An import of a `#/s/<token>` shared list: «Сохранить себе» already does
  that (`B2.3`).
- A CSV export: not asked for.

## 3. Existing behaviour and code paths

| Concern | Where | What R6 reuses |
|---|---|---|
| Row shapes | `lib/cloudLists.ts`: `ListRow`, `EntryRow`, `NewListRow`, `clip`, `NAME_MAX` 200, `NOTE_MAX` 4000, `quantityOf` (1..99), `priceOf` (1..99999 or null), `entryRowsOf`, `toCloudList`, `limitText` | the bounds, the row builders, the limit toast |
| Store | `state/cloudLists.svelte.ts`: `lists`, `status`, `load()`, `#pull`, `#apply` | `load()` after an import; `lists` for export |
| App glue | `state/app.svelte.ts`: `cloudLists`, `env`, `say`, `t`, `lang`, `index` | one new method `exportLists(ids?)` |
| Download | `ports/image.ts` `download(blob, filename)`; `fakeImage().downloaded` | the export's file save and its unit-test observation |
| Real adapter | `ports/supabase.ts`: `written()`, `writeOf()` (P0001 `limit: <key>` with `details`; 5xx and thrown as `network`; else `refused`), `client.rpc('reorder_list', ...)` | `client.rpc('import_lists', { p_lists })` through `written()` |
| Fake | `ports/fake-cloud.ts`: `Held`, `insertEntries`, `limited()`, `write()`, `find()` | `import` built from the same helpers, all-or-nothing |
| Contract | `ports/cloud.contract.ts` `listCases` (case G); `tests/e2e/contract.mjs` real-only checks | case H appended; one real-only atomicity check |
| RPC pattern | `clone_shared_list` in `20260925130200_list_shares.sql`: `auth.uid()` check 28000, `on conflict (id) do nothing returning id`, 42501 for another owner's id, entries from `jsonb_array_elements` | `import_lists` copies the shape |
| Layer 3 | `tests/db/lists.test.mjs`, `list-shares.test.mjs`: `asRole`, `byCode`, `tablePrivileges`, the `world` setup | `tests/db/import-lists.test.mjs` |
| Catalog index | `lib/data.ts` `Index.byId` (`ReadonlyMap<string, Record_>`); `Record_.ru` / `.en` are the names | unknown-id check, the informational `name` on export |
| Index page | `ListsPage.svelte`: the account group (`Field label={t.groupAccount} heading`), `cloud.status`, `drawnAccount` | the two buttons and the panels go under the heading, above the grid |
| List page | `ListPage.svelte` ~891-915: `Actions` row, `isCloud` | «Скачать JSON» after «Скопировать текст», `isCloud` only |
| Account page | `AccountPage.svelte`: `Panel` + `Field heading` per section, `busy`, `PANEL` | the fifth panel between «Способы входа» and «Выход» |
| Selection | `ListPage.svelte` batch bar: the select-all box with the mixed state, «Выбрать все» (`t.selectAll`) | the export checklist's first row copies its markup |
| Layer 2 | `tests/app/driver.js`: `prepare()` installs `window.__clip`; `fake(path, ...)`; `inventory.js` states `as: 'gm1'`; `states.js` cases | a `__download` hook, an `upload(path)` verb, new states and cases |
| Published files | `ci.yml` "Collect what the site is made of" (`cp -r ... _site/`) and "Nothing private slipped in" lists; `tools/check-site.lib.mjs` probes; `app/index.html` `<noscript>`; `tests/derived.js` pins `llms.txt` facts and `ci.yml` job facts | `schema/` joins each list |
| Contract tests | `tests/contracts.js` (fs-only; fixtures under `docs/fixtures/`) | `docs/fixtures/import/` and the schema pins |

## 4. Design

### 4.1 The file format `import-v1`

One JSON document, UTF-8, `application/json`, written by the app as
`JSON.stringify(bundle, null, 2) + '\n'`. Keys are `snake_case`, the same
words as the schema's columns and `catalog.csv`'s `id`.

```json
{
  "$schema": "https://artex-x.github.io/daggerheart-loot/schema/import-v1.json",
  "format": "daggerheart-loot/lists",
  "version": 1,
  "exported_at": "2026-09-25T12:00:00.000Z",
  "lists": [
    {
      "name": "Лавка кузнеца",
      "money_mode": "coin",
      "player_note": "Открыта с рассвета до заката.",
      "gm_note": "Кузнец торгуется, если назвать имя его брата.",
      "entries": [
        { "id": "ci1", "name": "Первоклассный Спальный Мешок", "quantity": 2, "price_coins": 150 },
        { "id": "q1", "player_note": "Последний в наличии." },
        { "id": "q313" }
      ]
    }
  ]
}
```

| Key | Type and bound | Required | Import reads it as |
|---|---|---|---|
| `$schema` | string | no | ignored (editors write it) |
| `format` | const `"daggerheart-loot/lists"` | yes | the discriminator: any other value is "not a lists file" |
| `version` | const `1` | yes | any other value is "unknown version N" - checked before anything else, so a v2 file is refused with one clear line |
| `exported_at` | string, `format: date-time` | no | ignored |
| `lists` | array, 1..50 items | yes | one account list each, in file order |
| `lists[].name` | string, 1..200 code points | yes | `lists.name` |
| `lists[].money_mode` | `"bag"` or `"coin"` | no, default `"bag"` | `lists.money_mode` |
| `lists[].player_note`, `gm_note` | string, 0..4000 | no, default `""` | the two list notes |
| `lists[].entries` | array, 0..100 items | yes | `list_entries`, `position` = array index after skips |
| `entries[].id` | string, `^[A-Za-z0-9_-]{1,64}$` | yes | `item_key`; must be a `catalog.csv` id (section 4.4) |
| `entries[].name` | string, 0..200 | no | ignored; the export writes the record's name in the UI language so a person or an LLM can read the file |
| `entries[].source` | const `"official"` | no, default `"official"` | `source` - reserved for v2 (section 4.8) |
| `entries[].quantity` | integer 1..99 | no, default 1 | `quantity` |
| `entries[].price_coins` | integer 1..99999 | no | `price_coins`; absent is no price (never `null`) |
| `entries[].player_note`, `gm_note` | string, 0..4000 | no, default `""` | the two entry notes |

Every object has `additionalProperties: false`: an unknown key is an
error with its path. Reason: the same one as the `#/l/` checksum - an LLM
that writes `qty` for `quantity` must fail loudly, not import a list of
ones. The export omits every absent or default field (as `toCloudList`
keeps the shape sparse), and never writes list ids, entry ids,
`created_at`, `updated_at`, `revision` or share links: import makes new
ids always (section 4.5), so ids in the file would be noise an LLM copies.

File names: all or a subset `daggerheart-loot-lists-<YYYY-MM-DD>.json`
(the date in local time); one list `<name>.json` with `\ / : * ? " < > |`
replaced by `_`, trimmed, cut to 80 characters, `list.json` when empty.

Money: `money_mode` is the display mode of the list (`FEATURES.md`,
"Lists"); prices are whole coins, as everywhere in the app.

### 4.2 The published JSON Schema - a public contract

- File: `schema/import-v1.json` in the repository root, hand-written,
  draft 2020-12 (`"$schema": "https://json-schema.org/draft/2020-12/schema"`),
  `"$id": "https://artex-x.github.io/daggerheart-loot/schema/import-v1.json"`,
  a `title` and a `description` in English on every property (the LLM
  reads them), `examples` with the worked example of section 4.1. Prettier
  formats it (`npm run format:check` covers `*.json`).
- Published: `ci.yml`'s Collect step copies `schema` beside `llms.txt`;
  the "missing or empty" list gains `schema/import-v1.json`;
  `tools/check-site.lib.mjs` probes it (200, parses, `$id` equals the
  URL); `app/index.html`'s `<noscript>` lists it in both languages.
- Named: `docs/specs/CONTRACTS.md` section 4 gains a bullet (the file, its
  `$id`, "frozen: a v1 file written today imports for good; a change is
  `import-v2.json` beside it, `version` discriminates; both stay
  published"); `llms.txt` gains the section of 4.9.
- Pinned by `tests/contracts.js` (fs-only, no dependency), a new block
  "import bundle":
  1. `schema/import-v1.json` parses; `$id` is the URL above; `properties.
     format.const === 'daggerheart-loot/lists'`; `properties.version.const
     === 1`; `additionalProperties === false` on the root, the list and
     the entry schemas; the numeric bounds equal the database's (`maxItems`
     50 and 100, `maxLength` 200 and 4000, `quantity` 1..99, `price_coins`
     1..99999) - written as literals in the test, a second statement of
     the same numbers.
  2. `docs/fixtures/import/example.json` parses, `format` and `version`
     match, every key of every object in it is declared in the schema
     (walk the fixture against `properties` of the root, list and entry
     schemas), and `llms.txt` contains the fixture's text verbatim (the
     worked example an agent copies - the `tests/derived.js` rule for the
     `#/l/` example, applied here).
  3. `CONTRACTS.md` and `llms.txt` both name `schema/import-v1.json`.
- Fixtures `docs/fixtures/import/`: `example.json` (valid, the `llms.txt`
  example: one list, three entries, both note kinds, coins); `unknown-id.
  json` (valid shape, two lists, one id `zzz1` the data does not know, one
  duplicate `ci1` - the preview fixture); `errors.json` (four field errors:
  a 201-character name, `quantity: 0`, an extra key `qty`, `money_mode:
  "gold"`); `v2.json` (`version: 2` - refused by the version line). The
  browser states and vitest read them; `tests/contracts.js` pins only
  `example.json`.
- The schema-drift guard, layer 1: `lib/bundle.test.ts` reads
  `schema/import-v1.json` from disk and asserts the validator's exported
  constants (`BUNDLE_FORMAT`, `BUNDLE_VERSION`, `LISTS_MAX` 50,
  `ENTRIES_MAX` 100, `NAME_MAX`, `NOTE_MAX`, `QTY_MAX`, `PRICE_MAX`, the
  id pattern, the `money_mode` enum) equal the schema's values, and that
  the set of property names per object equals the validator's known keys.
  A change to one side without the other fails the check.

### 4.3 `lib/bundle.ts` - the pure module

No DOM, no port (`app/src/lib/` law). Exports:

- `BUNDLE_FORMAT`, `BUNDLE_VERSION`, `LISTS_MAX`, `ENTRIES_MAX`,
  `FILE_MAX_BYTES` (5 MiB), the id pattern.
- `toBundle(lists: readonly CloudList[], nameOf: (id: string) => string |
  undefined, now: Date): Bundle` - builds the document of 4.1 from the
  store's lists (sparse: a default is omitted); `bundleText(b)` is the
  `JSON.stringify(b, null, 2) + '\n'`; `bundleFileName(kind, now | name)`.
- `parseBundle(text: string, knows: (id: string) => boolean): Parsed`
  where
  ```ts
  type Parsed =
    | { ok: true; lists: ImportList[]; unknown: string[]; duplicate: string[] }
    | { ok: false; reason: 'notJson' | 'notBundle' | 'version' | 'empty'; version?: number }
    | { ok: false; reason: 'errors'; errors: BundleError[] };
  interface BundleError { path: string; kind: 'missing' | 'type' | 'long' | 'range' | 'enum' | 'extra' | 'many'; limit?: number | string }
  interface ImportList { name: string; money_mode: MoneyMode; player_note: string; gm_note: string; entries: ImportEntry[] }
  interface ImportEntry { item_key: string; quantity: number; price_coins: number | null; player_note: string; gm_note: string }
  ```
  Order of checks: JSON parse (`notJson`); object with `format` equal
  (`notBundle`); `version === 1` (`version`, carrying the number found);
  then the full walk collecting every error with its JSON path
  (`lists[2].entries[5].gm_note`), stopping at 50 collected; then
  `lists.length === 0` (`empty`). Unknown ids (`!knows(id)`) and a second
  occurrence of an id inside one list are removed from the result and
  listed in `unknown` and `duplicate` - never an error (section 4.4).
  Strings are measured in code points (`Array.from(s).length`), as the
  database's `char_length` counts and JSON Schema's `maxLength` means.
- `toImportRows(lists: ImportList[], newId: () => string): ImportRow[]` -
  the rows the port sends: `NewListRow & { entries: EntryRow[] }`, ids
  from `newId()`, `position` = index, `source: 'official'`, `snapshot:
  null`.

`lib/bundle.test.ts`: every branch of `parseBundle` (each reason, each
error kind with its path, the 50-error cap, the code-point length, the
skips), `toBundle` round trip (`toBundle` -> `bundleText` ->
`parseBundle` yields the same lists), the fixtures of 4.2 (`example.json`
ok with no skips; `unknown-id.json` ok with `unknown ['zzz1']` and
`duplicate ['ci1']`; `errors.json` the four errors in file order; `v2.json`
reason `version` 2), the schema-drift guard, the file names.

### 4.4 Validation, limits and the messages

| Case | Where caught | What the reader sees (RU; EN in parity) |
|---|---|---|
| File over 5 MiB (`File.size`) | the panel, before reading | «Файл больше 5 МБ.» |
| Not JSON | `parseBundle` | «Это не файл JSON.» |
| No `format` or another value | `parseBundle` | «Это не файл списков: нет поля format со значением daggerheart-loot/lists.» |
| `version` not 1 | `parseBundle` | «Неизвестная версия формата: %n. Приложение читает версию 1.» |
| Field errors | `parseBundle` | «В файле ошибки:» then up to ten lines `<path>: <reason>` («обязательное поле отсутствует», «неверный тип», «длиннее %n символов», «значение вне диапазона %r», «допустимые значения - %r», «неизвестное поле», «больше %n элементов»), then «...и ещё %n» |
| More than 50 lists or 100 entries in one list | `parseBundle` (`many`, the schema's `maxItems`) | the field-error line for `lists` or `lists[i].entries` |
| No lists | `parseBundle` | «В файле нет списков.» |
| Unknown or retired catalog id | `parseBundle`, skipped | the preview line «Пропущено позиций, которых нет в данных: %n (%s)» - the ids, comma separated, at most ten then «...»; the import proceeds without them; a list whose every entry is unknown imports empty (the `#/l/` rule for a link whose entries left the data, `FEATURES.md`) |
| A duplicate id inside one list | `parseBundle`, the second dropped | «Повторы внутри списка убраны: %n» |
| The account would pass 50 lists, or a list 100 entries after a `limits:set` lowered it | the database (`lists_limit`, `list_entries_limit`), whole transaction refused | the existing limit toast through `limitText` («Достигнут предел списков в аккаунте: 50. ...»); nothing is imported; the preview stays |
| No network, 5xx | `written()` -> `network` | «Не получилось. Попробуйте ещё раз.» (`t.accountFailed`); the preview stays, the button is enabled again |
| Any other refusal (a 23514 check, 42501) | `refused` | the same toast; the preview stays |

The client validator applies the schema's bounds as the file's shape;
the account's count limits are the database's (decision 31: a per-user
override may raise them, and the client does not know it). So a user with
a raised limit imports up to 50 lists per file, several files. The
migration exemption from limits (R5) does not apply to import.

Partial import is never done: a file imports whole or not at all (Q1).
The skipped ids and duplicates are not a refusal because the file's shape
is right and the reader sees the skip before pressing.

### 4.5 Import: ids, the RPC, atomicity, idempotency

- New ids always: the client makes a UUID for every list and entry
  (`ListRepository.newId()`, as every write does), so a retry after a
  `network` answer cannot duplicate a row (`on conflict (id) do nothing`)
  and a file can be imported twice on purpose (a second import makes a
  second copy: create-only, no merge).
- `import_lists(p_lists jsonb) returns integer` (lists inserted),
  `security definer`, `set search_path = public, pg_temp`, `execute` to
  `authenticated` only - migration `supabase/migrations/
  <ts>_import_lists.sql`, reversal `drop function public.import_lists(jsonb);`:
  1. `auth.uid() is null` -> 28000 `import_lists: not signed in`.
  2. `jsonb_typeof(p_lists) <> 'array'` or over 50 elements -> 22023
     `import_lists: lists must be an array of at most 50`; an element's
     `entries` not an array or over 100 -> 22023.
  3. For each list, in order: `insert into public.lists (id, owner_id,
     name, money_mode, player_note, gm_note) values (...) on conflict (id)
     do nothing returning id`; nothing returned and the row is not the
     caller's -> 42501 (the `clone_shared_list` shape); nothing returned
     and it is the caller's -> a retry: skip its entries.
  4. `insert into public.list_entries (id, list_id, item_key, source,
     snapshot, position, quantity, price_coins, player_note, gm_note)
     select (e->>'id')::uuid, <list>, e->>'item_key', coalesce(e->>'source',
     'official'), nullif(e->'snapshot','null'::jsonb), ordinality - 1,
     coalesce((e->>'quantity')::integer, 1), (e->>'price_coins')::integer,
     coalesce(e->>'player_note',''), coalesce(e->>'gm_note','') from
     jsonb_array_elements(l->'entries') with ordinality as e on conflict
     (id) do nothing`. The table's checks refuse a bad value (23514), the
     unique `(list_id, item_key)` a duplicate (23505); the `lists_limit`
     and `list_entries_limit` triggers refuse an account past its limits
     with `limit: <key>` (P0001) - one exception unwinds the whole call.
  5. Return the count of lists whose insert returned an id.
  `source` and `snapshot` pass through so that v2 (R7) changes the schema
  file and the client validator, not the function's signature (4.8).
- `ListRepository.import(lists: ImportRow[]): Promise<ListWrite>` on the
  port (`types.ts`): real adapter `written(() => client.rpc('import_lists',
  { p_lists: lists }))`; `lazy-cloud.ts` forwards; the fake: `write((mine)
  => ...)`: refuses `REFUSED` when an id exists anywhere, `limited(
  'lists_per_owner', maxLists)` when `mine.length + fresh.length >
  maxLists`, `limited('entries_per_list', maxEntries)` when a list holds
  more than `maxEntries`, else inserts every list and entry at once (a
  copy of `create` plus `insertEntries` without the per-call partial
  effects), stamps `updated_at`, answers `OK`; a list whose id is already
  the caller's is skipped (a retry).
- Contract case H (`cloud.contract.ts`, appended to `listCases` on the
  doomed user): import two lists (one with two entries carrying quantity,
  price and both notes, one empty), read back names, money mode, notes and
  entry order; import the same rows again -> `ok` and the count of lists
  unchanged; remove both. Real-only (`tests/e2e/contract.mjs`): an import
  whose second list holds 101 entries answers `limit` / `entries_per_list`
  / 100 and the first list of that call does not exist afterwards
  (atomicity end to end).
- The store: `CloudLists.import(rows): Promise<ListWrite>` - not queued
  and not optimistic (an import is one explicit press, rare, and up to
  5000 rows); on `ok` it calls `load()` so the new lists appear in their
  read-back order with «изменён только что»; on a refusal it answers the
  `ListWrite` for the panel to toast. `AppState.exportLists(ids?: string[])`
  builds the bundle from `cloudLists.lists` (all, or the given ids in the
  index's order), names entries through `index.byId` and the UI language,
  and calls `env.image.download(new Blob([text], { type: 'application/json'
  }), name)`; a rejected download toasts `t.accountFailed`.

### 4.6 The UI (mocks A-E)

- Lists index (`ListsPage.svelte`), signed in, once `cloud.status ===
  'ready'`: under the «Ваш аккаунт» heading, above the grid, a row of two
  `sm` buttons with a caret and `expanded`: «Экспорт» (drawn only when the
  account holds a list) and «Импорт». Each opens one panel under the row;
  opening one closes the other; a second press folds it. The panels are
  components `ExportPanel.svelte` and `ImportPanel.svelte` (each used once
  now; the account page uses no panel, only `app.exportLists()`).
- `ExportPanel`: `Field` «Какие списки сохранить в файл»; a checklist of
  the account lists in the index's order (name, entry count in mono), all
  ticked on open; the first row is the select-all box with the mixed state
  and the name «Выбрать все» (the batch bar's markup); «Скачать JSON (N)»
  primary, disabled at 0, calls `app.exportLists(ticked)`; the hint «Файл
  содержит названия, позиции, количество, цены и обе заметки. Ссылки для
  игроков и мастера в него не попадают.». No toast (the browser shows its
  download); the panel stays open.
- `ImportPanel`: `Field` «Импорт из файла JSON»; «Выбрать файл...» - a
  `Button`-styled `<label>` over a visually hidden `<input type="file"
  accept=".json,application/json">` (not `display: none`, so Puppeteer's
  `uploadFile` and the keyboard reach it); after a choice the file name
  beside the button; the size check, then `file.text()` (fallback
  `FileReader.readAsText` if jsdom lacks `Blob.text`), then `parseBundle`
  with `index.byId.has`; the preview «Списков: N, позиций: M.», the skip
  lines when any; «Импортировать (N)» primary and «Отмена» ghost; or the
  error box (`role="alert"`, the first ten lines and «...и ещё N»), with
  «Отмена» only. The press disables the buttons, awaits `cloud.import
  (toImportRows(lists, newId))`; `ok`: fold the panel, toast «Импортировано
  списков: N»; `limit`: the limit toast; else `t.accountFailed`; the
  preview stays for a retry. The hint under the panel: «Файл JSON,
  сохранённый кнопкой «Экспорт» или собранный по схеме import-v1. Списки
  добавятся как новые; существующие не изменятся.».
- `#/account` (`AccountPage.svelte`), signed in: a fifth `Panel`, «Ваши
  данные», between «Способы входа» and «Выход» (decision 14's order): the
  hint «Все списки аккаунта одним файлом JSON. Его можно импортировать в
  другой аккаунт на странице «Списки».» and «Скачать все списки (JSON)»
  (`app.exportLists()`), disabled while `cloudLists.status` is not `ready`;
  on `error` the line `t.cloudLoadFailed` and «Повторить». Import is not
  here (it belongs with the lists; the privacy text says "on the Lists
  page").
- List page (`ListPage.svelte`), an account list only: «Скачать JSON»
  after «Скопировать текст», before «Печать» (`app.exportLists([id])`).
  A browser list gets nothing.
- Texts: every string in `dict.ts`, RU and EN (`I18N.md` parity). Keys:
  `exportOpen`, `importOpen`, `exportPick`, `exportDownload` («Скачать
  JSON (%n)»), `exportOne`, `exportAll`, `exportHint`, `yourData`,
  `yourDataHint`, `importPick`, `importHint`, `importPreview`,
  `importUnknown`, `importDuplicate`, `importGo`, `importDone`,
  `importTooBig`, `importNotJson`, `importNotBundle`, `importVersion`,
  `importEmpty`, `importErrors`, `importErrMissing`, `importErrType`,
  `importErrLong`, `importErrRange`, `importErrEnum`, `importErrExtra`,
  `importErrMany`, `importErrMore`. Reused: `selectAll`, `cancel`,
  `retry`, `accountFailed`, `cloudLoadFailed`, `limitLists`,
  `limitEntries`, `itemsN`.
- Help (`help.ts` `LISTS`): one paragraph appended, RU «Списки аккаунта
  можно сохранить в файл JSON («Экспорт») и загрузить из такого файла
  («Импорт») - например, перенести в другой аккаунт. Формат файла описан
  для ИИ-помощников в llms.txt.» / EN "Account lists can be saved to a
  JSON file (Export) and loaded from one (Import) - to move them to
  another account, for example. The file format is described for AI
  assistants in llms.txt." (`#/lists ~ help` re-seeds.)

### 4.7 Layer 2, layer 4 and the harness

- `tests/app/driver.js`: `prepare()` installs `window.__download = null`
  and wraps `HTMLAnchorElement.prototype.click` - an anchor with a
  `download` name records `{ filename, blob }` (the blob kept from a
  wrapped `URL.createObjectURL`) and does not navigate; the verb
  `download()` returns `{ filename, text }` or null (the `__clip` shape).
  The verb `upload(path)` sets the page's one `input[type=file]` through
  `elementHandle.uploadFile(path)` and dispatches nothing more (Puppeteer
  fires `change`).
- `tests/app/inventory.js`, all `as gm1` on `#/lists` unless said:
  `~ export panel as gm1` (the checklist, three ticked, «Скачать JSON
  (3)»); `~ import panel as gm1` (the file button and hint); `~ import
  preview as gm1` (upload `docs/fixtures/import/unknown-id.json`: 2 lists,
  the two skip lines, «Импортировать (2)»); `~ import refused as gm1`
  (upload `errors.json`: the four lines); `~ imported as gm1` (upload
  `example.json`, press «Импортировать (1)»: the new list first with
  «изменён только что», the panel folded, the toast; `timed`). Re-seeded:
  `#/lists as gm1` (the button row), `#/lists ~ help`, `#/account as gm1`,
  `#/account as gm2`, `#/account ~ delete confirmation as gm1`, `SHOP as
  gm1`, `SHOP ~ not saved as gm1` (the action row).
- `tests/app/states.js`: 43 - export from the index: «Экспорт», untick
  «Трофеи», «Скачать JSON (2)», `d.download()` parses to `format`,
  `version` 1, two lists named «Лавка кузнеца» and «Пустой список», the
  first's `ci1` entry with `quantity` 2 and `price_coins` 150 and its `q1`
  with the player note, `money_mode` `coin`, and no `id` key on a list;
  44 - `#/account` «Скачать все списки (JSON)» downloads three lists;
  45 - the imported list opens: after case `~ imported`'s steps, follow the
  new card to `#/lists/<uuid(5000)>`: «3 позиции · Сохранено», the rows in
  file order.
- E2E flow F8 (`tests/e2e/flows.mjs`): the member on `#/lists` uploads
  `example.json`, presses «Импортировать (1)», waits for the toast, and
  `listsOf(admin, member)` shows one list «Лавка кузнеца» with `ci1`, `q1`,
  `q313` in that order, `ci1` at quantity 2 and 150 coins; `deleteListsOf`
  before and after. Contract H and the real-only atomicity check run in
  `contract.mjs` before the build.

### 4.8 Seams with the parallel releases

| Release | Seam | Rule |
|---|---|---|
| R2 `B2.3` (main tree) | `ListPage.svelte`'s action row gains «Поделиться»; `llms.txt`'s list-link section gains the retirement line with a pointer "the JSON bundle from R6"; `SharePanel.svelte` is a disclosure panel under an action row | R6's refresh after R2 closes: place «Скачать JSON» after «Скопировать текст» in the row as it then stands; rewrite the pointer to name the new `llms.txt` section; keep `ExportPanel`/`ImportPanel` separate from `SharePanel` (different content, different page); `tests/app/inventory.js` ids continue after `B2.3`'s |
| R5 `B5.1` | the cutoff, read-only local lists, `legacy_fingerprint`, the limits exemption for migration, `ListsPage.svelte`'s browser group | import never targets local lists and never sets `legacy_fingerprint` (an imported list is not a migrated one: migrating the same local list later makes a second copy - accepted); the exemption does not extend to import; R5 ships first, so R6's refresh reads `ListsPage.svelte` after it |
| R3 `B3.1` | Realtime topics per share | none: an imported list has no share; `import_lists` bumps nothing shared |
| R4 | purchase requests | none |
| R7 (bundle v2) | `version` 2; `entries[].source` gains `homebrew`; a homebrew entry carries its record content (`snapshot`, at most 16384 bytes as the column allows); `schema/import-v2.json` beside v1; a v2 reader accepts v1; `import_lists` passes `source` and `snapshot` through already (4.5) | v1 stays published and importable for good; v1's validator refuses `version` 2 with the version line; R7 changes the schema file, `lib/bundle.ts` and the fake, not the RPC signature |
| Usage monitoring | row counts | an import adds at most 50 lists and 5000 entries per press, inside the account limits; nothing to add |

### 4.9 `llms.txt` - the new section (draft; `B6.1` writes it)

Placed after "URL grammar", before "List links" (which retires with
`B10.1`): "## Lists as a file (import-v1)". Content: a signed-in GM
imports a JSON file on the Lists page and the lists are added as new ones
(never overwritten); the schema URL and that the file is validated against
it - every key is checked and an unknown key is an error; the worked
example (`docs/fixtures/import/example.json` verbatim); the rules in one
list: every `id` from `catalog.csv`, at most 50 lists and 100 entries per
list, `quantity` 1..99, `price_coins` whole coins 1..99999 (the Money
section), names up to 200 and notes up to 4000 characters, both notes as
in "The two notes" (the player note and the GM note travel in the file;
the GM decides who gets the file), `money_mode` `bag` or `coin`; how to
hand it over: a `.json` file or one code block the GM saves as a file; an
id the site does not know is skipped and named before the import, not
imported silently. The "What this site cannot do" line and `B2.3`'s
pointer are rewritten to point here (refresh after R2).

## 5. Contracts and behaviour that stay stable

- Routes, `data.json`, `catalog.csv`, `i/`, `og/`, the `#/l/` encoding:
  unchanged. The one contract change is additive (`schema/import-v1.json`
  and its `llms.txt` section), made in `B6.1` with `CONTRACTS.md`,
  `docs/fixtures/import/`, `tests/contracts.js` and `llms.txt` in one
  commit.
- `lists` and `list_entries` columns, checks, RLS, limits: unchanged; one
  function added.
- `ListRepository`'s existing methods, `CloudLists`' queue, the goldens of
  signed-out states: unchanged.
- `#/account` order of sections: decision 14, now with the fifth panel.

## 6. Tests, fixtures, documentation per batch

| Batch | Tests | Docs |
|---|---|---|
| `B6.1` | vitest: `lib/bundle.test.ts` (+ the schema-drift guard), `ports/fake-cloud.test.ts` (import: all-or-nothing, the limits, a retry), `ports/supabase.test.ts` (the `import_lists` call shape and `writeOf` on its answers), `ports/lazy-cloud.test.ts`, contract case H; `tests/contracts.js` "import bundle"; `tests/db/import-lists.test.mjs`; `tests/e2e/contract.mjs` (case H over the real adapter, the atomicity check); `tests/derived.js` if it pins the Collect list (it pins job facts; the implementer checks `jobOf('deploy')` assertions and adds none unless a list is asserted) | `CONTRACTS.md` section 4, `llms.txt` (4.9), `COVERAGE.md` (the new suites, fixtures, the contract case), `docs/decisions/` (the three files of section 10 move from proposed to decided or are amended by the owner's answers) |
| `B6.2` | vitest: `components/exportPanel.test.ts`, `importPanel.test.ts`, `listsPage.test.ts`, `listPage.test.ts`, `accountPage.test.ts`, `a11y.test.ts` (both panels open, the error box), `state/app.test.ts` (`exportLists` through `fakeImage`), `state/cloudLists.test.ts` (`import` then `load`); `inventory.js` + goldens; `states.js` 43-45; `flows.mjs` F8; `driver.js` `download()` and `upload()` | `FEATURES.md` "Account lists" (export and import), "Account" (the panel); `META.md` section 3 (the file is the per-user backup and the way between accounts); `COVERAGE.md` (states, goldens count, the driver verbs and the `__download` hook); `I18N.md` (nothing new unless a rule is touched); `help.ts` `LISTS`; the privacy page needs no change (its promise is now true) |

## 7. Batches: gates, cost, review, split criterion

Costs: this host, idle, one green pass (`.claude/README.md`, "Batch size
and the fixed cost of a run", re-measured 2026-09-25: `check` 348 s,
`check:built` 19 s + the two builds, `app/states` 197 s, `npm run e2e`
50 s; `check:db` ~120 s plus the first stack start once).

| Batch | Goal | Gates (cost) | Review | Split criterion |
|---|---|---|---|---|
| `B6.1` | the contract and the database: `schema/import-v1.json`, fixtures, `tests/contracts.js`, `llms.txt`, `CONTRACTS.md`, the published-file lists (`ci.yml`, `check-site.lib.mjs`, `<noscript>`); `import_lists` migration, reversal, layer 3 tests; `lib/bundle.ts`; `ListRepository.import` on the real adapter, the lazy port and the fake; contract case H and the real-only check | `rtk npm run check` (6 min), `npm run check:db` (2-3 min, PowerShell tool; + 3-5 min stack start once), `npm run check:built` (1 min; `dist/index.html` changes), `npm run e2e` (1-2 min; the migration reaches the test project through `migrate-test` first, as R2's orchestrator ran it) - about 12-15 min | required: public contract, schema rule | new release (R6) |
| `B6.2` | the UI: `ExportPanel`, `ImportPanel`, the index buttons, the account panel, the list page button, `AppState.exportLists`, `CloudLists.import`, dict, help; the driver verbs, states 43-45, goldens, F8; specs | `rtk npm run check` x2 (12 min), `build:test` + `check:built` (1 min), the layer 2 filter group `app/print,app/contracts,app/states,app/typo,app/hues,stub` (5 min), goldens `--update` 4 shards (10 min), `sweep` at 360 (6-10 min, the panels add controls to `#/lists`), `npm run e2e` (1-2 min) - about 37 min | required: new UI | a public-contract change and SQL judged apart from Svelte (`B6.1` needs its own commit and review), and a commit boundary the harness cannot reach: the states of `B6.2` need the fake's `import` and the fixtures of `B6.1` |

Total gate cost, one green pass per batch: about 50 minutes plus the
closeout's CI watch. Not split further: the three export surfaces and the
import panel share one component set, one seed (`gm1`) and one filter
group; the README's test says merge. Commit policy: `B6.1` commits,
`B6.2` amends (roadmap section 9).

## 8. Batch `B6.1` - the contract and the database (implement-ready)

Objective: publish `import-v1`, build the pure module and the write path,
prove them in layers 1, 3 and 4. No UI.

In scope: sections 4.1-4.5, 4.9 and the `B6.1` row of section 6. Out of
scope: every component, `dict.ts`, `help.ts`, the driver, states, goldens.

Refresh before the build (after R2 closes; 15 minutes, the orchestrator or
the planner): (1) re-read `llms.txt` as `B2.3` left it and place the new
section and the pointer rewrite; (2) confirm `ports/types.ts`
`ListRepository` and `fake-cloud.ts` as `B2.3` left them (shares methods
added) so `import` is appended, not merged by hand; (3) confirm the
migration timestamp is later than every file `B2.3` and `B5.1` added; (4)
apply the owner's answers of section 11 to the steps named there.

Files expected:

- new: `schema/import-v1.json`; `docs/fixtures/import/example.json`,
  `unknown-id.json`, `errors.json`, `v2.json`; `app/src/lib/bundle.ts`,
  `bundle.test.ts`; `supabase/migrations/<ts>_import_lists.sql`,
  `supabase/reversals/<ts>_import_lists.sql`; `tests/db/import-lists.test.mjs`;
  the three decision files of section 10 (already in `docs/decisions/`
  from this pass; the batch updates their status).
- edit: `app/src/ports/types.ts`, `supabase.ts`, `supabase.test.ts`,
  `fake-cloud.ts`, `fake-cloud.test.ts`, `lazy-cloud.ts`,
  `lazy-cloud.test.ts`, `cloud.contract.ts`; `tests/e2e/contract.mjs`;
  `tests/contracts.js`; `llms.txt`; `docs/specs/CONTRACTS.md`,
  `COVERAGE.md`; `.github/workflows/ci.yml`; `tools/check-site.lib.mjs`;
  `app/index.html`.

Steps:

1. Write `schema/import-v1.json` from section 4.1's table: draft 2020-12,
   `$id`, `title` "Daggerheart Loot lists file, version 1", `type: object`,
   `required: ["format", "version", "lists"]`, `additionalProperties: false`,
   `properties`: `$schema` (string), `format` (const), `version` (const 1),
   `exported_at` (string, `format: date-time`), `lists` (array, `minItems`
   1, `maxItems` 50, `items: { $ref: "#/$defs/list" }`); `$defs.list`
   (required `name`, `entries`; `name` `minLength` 1 `maxLength` 200;
   `money_mode` enum with `default: "bag"`; the two notes `maxLength`
   4000 `default: ""`; `entries` array `maxItems` 100 of `$defs.entry`);
   `$defs.entry` (required `id`; `id` `pattern`; `name` `maxLength` 200;
   `source` `const: "official"` `default`; `quantity` integer 1..99
   `default` 1; `price_coins` integer 1..99999; the notes). A one-sentence
   `description` on every property, English, naming `catalog.csv` for
   `id` and the Money section for `price_coins`. `examples: [<the
   example.json document>]`.
2. Write the four fixtures of section 4.2. `example.json` is the list of
   section 4.1 with `exported_at` `2026-09-25T12:00:00.000Z`; its entries
   `ci1` (quantity 2, price 150, name), `q1` (player note), `q313` (gm
   note «Проклят.»). `unknown-id.json`: list one = example's list plus
   `zzz1` and a second `ci1`; list two «Пустой список» with no entries.
   `errors.json`: section 4.2's four errors. `v2.json`: `version: 2`,
   otherwise valid.
3. Write `app/src/lib/bundle.ts` per section 4.3: the constants imported
   from `cloudLists.ts` and `listLink.ts` where they exist (`NAME_MAX`,
   `NOTE_MAX`, `QTY_MAX`), `PRICE_MAX` exported from `cloudLists.ts` (it
   is a module constant today - export it); `toBundle`, `bundleText`,
   `bundleFileName`, `parseBundle`, `toImportRows`. The walk is one
   function per object kind with a `path` prefix; error collection caps at
   50. Write `bundle.test.ts` per section 4.3, the schema read with
   `fs.readFileSync` from `schema/import-v1.json` (vitest runs in Node).
4. `ports/types.ts`: `export type ImportRow = NewListRow & { entries:
   EntryRow[] }` in `lib/cloudLists.ts`; `ListRepository.import(lists:
   ImportRow[]): Promise<ListWrite>` with the doc line "Inserts every list
   and entry in one transaction or nothing; ids already the caller's are
   skipped (a retry)". `supabase.ts`: `import: (lists) => written(() =>
   client.rpc('import_lists', { p_lists: lists }))`. `lazy-cloud.ts`:
   forward as the other writes. `fake-cloud.ts`: per section 4.5. Tests:
   `supabase.test.ts` (the stub client records `rpc('import_lists', {
   p_lists })`; a P0001 `limit: lists_per_owner` answer maps to `limit`),
   `fake-cloud.test.ts` (two lists in, read back in order; a third call
   over `limits.lists` refuses and inserts nothing; a duplicate id
   refused; a retry with the same ids inserts nothing more),
   `lazy-cloud.test.ts` (forwarded; a failed chunk answers `network`).
5. `cloud.contract.ts`: case H appended to `listCases` per section 4.5.
   `tests/e2e/contract.mjs`: the atomicity check after the 101-entry one.
6. Migration `supabase/migrations/<ts>_import_lists.sql` per section 4.5
   (the header comment: what it does, the atomicity reason, the
   pass-through of `source` and `snapshot` for the homebrew release, cite
   `docs/specs/CONTRACTS.md` section 4), the reversal (one `drop
   function`). `tests/db/import-lists.test.mjs`: grants (`authenticated`
   only; `anon` and `service_role` none); no session -> 28000; A imports
   two lists, reads them back in order with positions 0..n-1, revision 1;
   the same call again inserts nothing (count 0, rows unchanged); a list id
   owned by B -> 42501 and A holds no new list (atomic); 51 lists -> P0001
   `limit: lists_per_owner` `detail` 50 and none inserted; a list of 101
   entries -> `limit: entries_per_list` and no list inserted; `quantity 0`
   -> 23514; 51 elements in the array -> 22023; `entries` not an array ->
   22023; `source: 'homebrew'` with a snapshot inserts as such (the
   pass-through), with `snapshot` null refused by the table check (23514).
7. `tests/contracts.js`: the "import bundle" block of section 4.2.
8. `llms.txt`: the section of 4.9, the example verbatim from the fixture;
   `CONTRACTS.md` section 4: the bullet of 4.2; `COVERAGE.md`: the new
   suites and fixtures in their tables (`contracts` row, `tests/db/`
   paragraph, the contract selection paragraph gains H).
9. `ci.yml`: `schema` in the Collect `cp -r` list and `schema/import-v1.json`
   in the "missing or empty" list; `tools/check-site.lib.mjs`: the probe
   (200; `JSON.parse(body).$id === SITE + 'schema/import-v1.json'`);
   `app/index.html` `<noscript>`: one `<li>` in Russian and the file in the
   English sentence. Run `node tests/derived.js`; if an assertion names
   the Collect list or the `<noscript>` links, extend it.
10. Gates in order: `rtk npm run check` (Bash, timeout 600000); `npm run
    check:db` (PowerShell); `npm run check:built`; apply the migration to
    the test project (`node --env-file=.env.test.local
    tools/supabase/migrate-test.mjs` with `SUPABASE_DB_URL_TEST` mapped as
    R2 did - the orchestrator's step, values never printed), then `npm run
    e2e`. Commit `feat(persist): export and import account lists as a
    published JSON bundle` (the task's one commit; `B6.2` amends).

Acceptance criteria:

- `schema/import-v1.json` parses, carries the `$id`, and `tests/contracts.js`
  passes its block; `example.json` appears verbatim in `llms.txt`.
- `parseBundle` accepts `example.json` with no skips; reports `zzz1`
  unknown and `ci1` duplicate for `unknown-id.json`; lists the four errors
  of `errors.json` with their paths in file order; refuses `v2.json` with
  reason `version` and the number 2; a 51st list and a 101st entry are
  `many` errors; a 4001-code-point note is `long`; a key `qty` is `extra`.
- The schema-drift guard passes, and fails when one bound is changed on
  either side (proven once by hand and recorded in the handoff).
- `toBundle` of the fake's `gm1` lists round-trips through `parseBundle`
  to the same names, modes, notes, entries, quantities and prices, and
  writes no `id`, `created_at` or share key.
- `import_lists`: every layer 3 case of step 6 green; contract case H green
  over the fake (vitest) and the real adapter (`npm run e2e`); the
  real-only atomicity check green.
- `dist/index.html` lists `schema/import-v1.json` in `<noscript>`;
  `tools/check-site.mjs --dir _site` would probe it (the probe exists and
  CI proves it on the push).
- No component, dictionary or golden changes in this batch.
- The three decision files carry the owner's answers (status line removed
  or amended per section 11).

Verification commands: step 10.

Risks / do-nots: do not add ajv or any schema library; do not put the
catalog into the database (decision 3) - unknown ids are the client's;
do not make `import` optimistic or queued; do not touch `ListsPage.svelte`,
`ListPage.svelte` or `AccountPage.svelte` here; keep `source`/`snapshot`
pass-through in the RPC but refuse `source: 'homebrew'` in the v1
validator; the migration file name must sort after every migration R2 and
R5 added.

Fallback: if PostgREST refuses a jsonb parameter of several MB (the 5 MiB
bound is a client fact; the hosted limit is unmeasured), lower
`FILE_MAX_BYTES` to the measured value in `B6.2` and record it in
`.claude/README.md`; the schema's bounds do not change.

## 9. Batch `B6.2` - the UI (outline)

Section 4.6 and 4.7 and the `B6.2` row of section 6. Steps in order:
`dict.ts` keys (RU, EN); `CloudLists.import` and `AppState.exportLists`;
`ExportPanel.svelte`, `ImportPanel.svelte` with their tests and axe;
`ListsPage.svelte` (the button row and the two panels, drawn under the
conditions of 4.6); `ListPage.svelte` (the button, `isCloud` only);
`AccountPage.svelte` (the fifth panel); `help.ts`; `driver.js` verbs and
the `__download` hook; `inventory.js` states and the goldens re-seeded;
`states.js` 43-45; `flows.mjs` F8; `FEATURES.md`, `META.md`,
`COVERAGE.md`. Mock: `mocks/b62-export-import.html`. Acceptance carries
every line of 4.6 and 4.7 as its own line, and one line each for the
inherited items: the owner's answers Q1-Q4 as applied, and the `B6.1`
review nits (none yet). Gates: section 7.

## 10. Decisions recorded this pass (`docs/decisions/`)

1. "The list file `import-v1` is a strict JSON Schema; import makes new
   ids" - the format, the published schema as a public contract,
   strictness, create-only.
2. "An import is one `import_lists()` transaction: every list or none" -
   confirmed by the owner's Q1 answer (2026-09-26).
3. "Import validation is the client's; the count limits are the
   database's" - the client validator, the schema-drift test, unknown ids
   skipped and named, count limits the database's.

The index `docs/DECISIONS.md` is rebuilt by `node tools/decisions.js`.
File 2's "proposed" was removed when the Q1 answer was recorded.

## 11. Owner questions - answered 2026-09-26

Answers (owner, 2026-09-26, all as recommended): Q1 import is all or
nothing (one `import_lists` transaction); Q2 an export always carries both
notes, with no players' variant; Q3 three export surfaces (the account
exports all, the lists index a checklist, the list page one); Q4 unknown
catalog ids are skipped and named in the preview and the result. The
questions as asked:

- **Q1. Import: all or nothing, or partial?** Recommended: **all or
  nothing** - one `import_lists` transaction; a limit or any refusal
  imports nothing and the preview stays. Reason: a partial import needs a
  second report ("these 12 of 50 were made") and a retry that skips them;
  one transaction needs neither. Trade-off accepted: a reader at 48 of 50
  lists must delete lists before importing 5. Alternative: import what
  fits, in file order, and name the rest.
- **Q2. Export: both notes always, or a players' variant?** Recommended:
  **both notes always**, no switch. Reason: the file is the owner's backup
  and the way between accounts; a players' copy is what a share link is
  for. Trade-off: a GM who wants to hand players a file must not (the
  hint says the file holds both notes). Alternative: a «Без заметок
  мастера» checkbox in the export panel.
- **Q3. Three export surfaces?** Recommended: **yes** - `#/account` (all,
  next to deletion, as decision 14 reserved), the lists index (a
  checklist, so "selected" costs no index selection UI), the list page
  (one, ten lines in the action row). Alternative: index and account
  only.
- **Q4. Unknown catalog ids: skip and name them, or refuse the file?**
  Recommended: **skip and name them** in the preview before the press and
  in the result, the `#/l/` rule. Reason: an LLM's one wrong id must not
  block a 40-entry restore, and the reader sees the skip first.
  Alternative: refuse the file with the ids listed.

Consequences named, not asked: the schema pins 50 lists and 100 entries
per file (a raised per-user limit still applies per account: several
files); an export carries no ids, timestamps or share links; an imported
list has no share links until the owner makes them; the browser's own
download UI is the only feedback of an export.

## 12. Risks, assumptions, deferred

- Assumption: jsdom implements `Blob.prototype.text` (the panel reads the
  file with it); if not, `FileReader.readAsText` - the component test
  decides.
- Assumption: Puppeteer's `uploadFile` on a visually hidden (not
  `display: none`) input fires `change`; if the input must be visible for
  it, the label pattern gives way to a plain styled input.
- Risk: PostgREST's request body limit for a large `p_lists` is unmeasured
  (section 8, fallback).
- Risk: the `lists_limit` trigger runs per row; 50 lists in one call take
  50 advisory locks of the same key - fine in one transaction, named so
  nobody "optimises" it into one multi-row insert without reading the
  trigger's after-insert reason.
- Risk: `llms.txt`'s `#/l/` section and the new section coexist until
  `B10.1`; an LLM may still build links until the cutoff - intended.
- Risk: three goldens of `#/account` and two of `SHOP` re-seed; the
  reviewer reads the diff.
- Deferred: bundle v2 (R7); a JSON-Schema runtime validator (never, unless
  the hand-written one drifts twice); a CSV export; import of
  preferences.
