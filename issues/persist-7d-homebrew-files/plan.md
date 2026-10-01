# Plan - TASK persist-7d-homebrew-files (homebrew release R7d)

## Status

- Task status: not started. Moved from the plan of task
  `persist-7c-homebrew-relations` at R7c's closeout (2026-10-01). Section
  numbers (3, 4.x, 6, 7.4, 8, 9, 10, 12, 13) keep the numbers of that plan, so
  the text below reads as it did there; the omitted parts shipped in R7-R7c.
- NEEDS_HUMAN_CONFIRMATION: no.
- Plan review: required before B7d.1 (trigger: a migration and two public schemas)
- Release order (owner, 2026-10-01): R7c (shipped), R7e `persist-7e-list-quick-item`,
  R7f `persist-7f-consistency`, R7g `persist-7g-read-scale`, then R7d.
  R7e and R7f share `dict.ts`, `HomebrewPage` and `ListPage` files with R7d's
  UI: refresh `B7d.2` against the tree after them.
- Owner lines (2026-10-01), each an acceptance line below:
  - Bulk moves between sources and sections in `B7d.2`: a selection on
    `#/homebrew` with «Переместить...» in the selection bar, reusing the
    import's «Куда» source and section picker.
  - The homebrew import and export code ships as a lazy chunk like `zip`
    (or a chunk of its own) from the start, so it takes none of the bundle
    headroom (`scale-challenge`, the bundle headroom).
  - `scale-challenge` F10: the import report filters the skips once (a `Map`
    grouped per list), draws the first 20 list blocks and «и ещё N списков».
  - The scale design target is 3x the defaults (150 lists, 300 entries per
    list, 60 sources, 300 items, 300 cards); the zip reader refuses more than
    1000 entries (`lib/zip.ts`), so `homebrew.json` is one file, never one
    file per item.
- Open review rows R7d inherits: section 13 (`B7.1-3`, `B7.2-4`, `B7.2-9`),
  each an acceptance line in 7.4.
- Batches:

| Release | Task id | Batch | Status |
|---|---|---|---|
| R7d | `persist-7d-homebrew-files` | `B7d.1` import RPC, two schemas, `llms.txt` | outline (7.4); refresh before dispatch |
| R7d | | `B7d.2` import and export UI, the zip, bulk move | outline (7.4) |

## 1. Objective

R7 made, edited, listed, shared and printed homebrew items; R7b put them in
the catalog pages; R7c related them to catalog records and to each other (the
catalog `craft` is a list of ids, `homebrew_cards` holds sets and rule cards,
catalog cards draw the author's own relations). R7d moves them by file: two
public schemas (`schema/homebrew-v1.json`, `schema/import-v2.json`),
`import_homebrew`, `llms.txt` with a blind round, import with the source
mapping and skip or update, the downloads, `homebrew.json` in the account zip.
Owner items 8 and 13 (`context.md`).

Non-goals: art (R8); `#/h/<token>`, clone and add from an item link, print
routes for cloud lists (R9); books shared with other users (item 13, D7); a
second-language UI (`Q4`); a Trash (roadmap decision 30); `roll`, `frame`,
`starting`, `recall`, `community` on a homebrew record; `img` in the file
format before R8.

## 3. The gap audit, the rows R7d owns

| # | Surface | What differs | Decision | Where |
|---|---|---|---|---|
| G22 | Export | v1 refuses `source: homebrew` | `import-v2`, `homebrew.json` in the zip, the account hint | R7d |
| G23 | Import | Passes `source`, `snapshot` | v2 entries frozen, or references when the account holds the key; `import_homebrew` | R7d |
| G24 | `llms.txt`, `schema/` | Nothing | Two sections, two schemas, a blind round | R7d |
| G25 | `catalog.csv`, `data.json`, `i/`, `og/` | Generated from `data.js` | Never carry a homebrew record; `llms.txt` says so | R7d |
| G26 | `#/account` | The zip hint | The hint names homebrew (D69) | R7d |

## 4. Design

### 4.1 The record shape (the size and line-ending parts)

- Size: names 120 and descriptions 3000 code points per language; a
  maximal item in 4-byte characters is about 26 KB of JSON, its snapshot
  with a maximal source about 28 KB, under the 32768-byte bound. The bound
  holds because the validators refuse the C0 control characters except tab
  and newline (`jsonb::text` writes one as `\u00XX`, 6 bytes). A text with
  `\r` is refused: R7d's import turns `\r\n` and `\r` into `\n` before it
  validates (an inherited line of `B7d.1`). From `B7c.2` a snapshot
  with its cards holds up to 131072 bytes (4.7, `Q15`).

### 4.7 Schema (the R7d part)

- R7d (`B7d.1`): `import_homebrew(p_books, p_cards, p_items, p_update)
  returns jsonb`, security invoker, one transaction, per-call ceilings
  (never the default limits), skip or update of held keys, a held
  source's sections always merged and its name written only on update.

### 4.10 The bundle budget rule (`Q14`)

- `Q14` (answered: A) and the owner's answer to `B7.2-4`: a batch whose
  build passes a budget raises that budget in `tools/bundle-budget.mjs` to
  its measured size plus about 5 kB, rounded up, in the same commit. Such a
  step applies the existing decision
  (`2026-09-30-the-bundle-budget-steps-up-per-batch-to.md`) and writes no
  new decision file: the batch records the measured figures in the
  budget file's comment and in `.claude/README.md`'s budget paragraph. The
  ceilings are 250 kB configured and 190 kB unconfigured; they may rise
  when a batch needs room, as long as the rise is reasonable, and each
  ceiling rise writes a new decision file. A batch that raises a ceiling
  names the rise and its reason in its handoff for the owner.

### 4.11 Files, `llms.txt`, import and export (item 8; R7d; D6)

Both formats are public contracts in `CONTRACTS.md` section 4, with
`additionalProperties: false`, fixtures, and `llms.txt` sections proven by
a blind round.

- `schema/homebrew-v1.json`, `daggerheart-loot/homebrew` version 1:
  `books` with sections, `cards` and `items` in the catalog's field names
  under their `hb_` keys; written by «Скачать предметы (JSON)» and as
  `homebrew.json` in the account zip; read by «Импорт предметов» through
  `import_homebrew`. `craft` and `craft_from` are lists only (no string
  form). No `draft` field (the mark does not exist). No `img` before R8.
- `schema/import-v2.json`, `daggerheart-loot/lists` version 2: v1 plus
  `source: "homebrew"` entries with a required `snapshot`; v1 stays.
- The bounds of both files are the import call's ceilings, never the
  default limits (task `limits-follow-overrides`, 2026-09-30). `import-v2`
  inherits v1's 5000 entries per list and 1000 lists per call, and the
  rule that a bound widens in place, never narrows (`CONTRACTS.md`
  section 4).
- `import_lists` needs no change for v2: the client turns an entry whose
  key the account holds into a reference, and the reference-exists trigger
  guards the rest. A v2 frozen entry must send `snapshot` as a JSON object
  (a JSON `null` becomes SQL null in `jsonb_to_recordset` and would read as
  a reference).
- `Q7` (answered: skip or update, default skip), `Q9` (answered:
  automatic sources with the per-source «Куда» mapping): 4.14 F3.
- A v1 reader refuses `version` 2 and `source: homebrew` (R6's code); the
  R7 lists export leaves homebrew entries out (`officialOnly`) until v2.

### 4.13 Item 13: what the releases must not close off

Written as D7,
`docs/decisions/2026-10-01-homebrew-keeps-the-way-open-to-shared-books.md`.
Each batch keeps these shapes:

| Later need | Shape now | Cost later |
|---|---|---|
| A book id on the item, not a tag | `book_id` FK; `book` on the record | none |
| Stable references | per-owner `hb_` keys with 80 random bits; a subscribed item resolves by `(book, key)`; `list_entries` may gain `item_owner uuid null` | one additive column and a projection change |
| Visibility apart from ownership | owner-only RLS; a `homebrew_subscriptions(user_id, book_id)` table and a `select` policy are additive; the index merge takes "records visible to me" | one migration; the row shapes gain `owner_id` and the store `editable` |
| Subcategories | sections (D8) | none |
| Roll tables per book | `roll` refused | `roll` on the content, a `rows` entry per book, a roll panel that takes a book |
| Converting a catalog source into a book | the file format is the catalog's field names | a tool, no schema |
| Unsubscribing keeps list entries valid | an entry stores a key | the projection embeds a subscriber's snapshot, or the entry freezes on unsubscribe |

### 4.14 Answers to the owner's first mock review, the parts for R7d

- F1 - the example source name: the invented «Мастерская Ольхи» / "Alder
  Workshop" everywhere; code, fixtures, seeds, goldens and `llms.txt` use
  invented names only. Acceptance line in `B7d.1`: `git grep -i -E
  "pistolheart"` outside `issues/` finds nothing.
- F3 - sources on import (m15, R7d; `Q9`): the preview's «Куда положить
  предметы» row per file source, default: the held key, then a same-name
  source, then a new one; «Без источника» for items with no `book`; the
  client rewrites `book` before the call; sections join by key, then by
  name, else are added.
- F5 - failure states (shipped in R7; `lib/homebrewForm.ts` and the SQL
  validators over one fixture set): R7c adds the relation rows under the
  same rules - `eq.line`, `craft`, `craft_from`, `set`, `refs` optional;
  `craft` and `craft_from` at most 8 each, unique, never the item itself;
  a line starts at equipment of the same type. A form that passes never
  meets a CHECK refusal.

## 6. Tests, fixtures, documentation per batch (outline)

| Batch | Layer 1 | Layer 2 (browser) | Layer 3 | Layer 4 | Docs |
|---|---|---|---|---|---|
| `B7d.1` | `bundle.test.ts` (v2), `homebrewFile.test.ts`, fake import | none | `tests/db/import-homebrew.test.mjs` | the import case after the approve | `CONTRACTS.md` 4, `llms.txt`, `tests/contracts.js`, `tests/derived.js` |
| `B7d.2` | `importItemsPanel.test.ts`, `homebrewPage.test.ts`, `accountPage.test.ts`, `zip.test.ts`, `app.test.ts` | the import panel states, the account page | none | export, delete, import with update | `FEATURES.md` "Homebrew", "Account"; `META.md`; `COVERAGE.md`; `DEBT.md` (D69 deleted); both privacy pages |

## 7. Gates, cost, review, split criterion

Costs (`.claude/README.md`, "Batch size and the fixed cost of a run", this
host): `npm run check` 7-10 min, `check:db` 9-10 min, `build:test` plus
`check:built` 2 min, `app/states` 4-6 min, `app/contracts` 7 min, a golden
shard about 3.2 min (four shards 13 min; a compare then a re-seed 26 min),
`sweep.js 360` 7-9 min, `npm run e2e` 2-3 min, a blind round 5-10 min, a
closeout about 10 min.

| Cut | Criterion |
|---|---|
| R7c \| R7d | two public schemas and `llms.txt` with a blind round; the file format goes last so v1 carries every field |

Inherited by every batch that runs `check:built` (`Q14`, `B7.2-4`): each
build measured, configured and unconfigured, and each passed budget raised
to the measured size plus about 5 kB, rounded up, in the same commit; a
step under the ceilings writes no decision file, a ceiling rise does
(4.10). The figures after R7c (2026-10-01): 237.5 of 242 kB configured and
178.6 of 183 kB unconfigured; 12.5 and 11.4 kB remain under the 250 and 190
ceilings, shared with R7e, R7f and R7g. The lazy chunk keeps R7d's code off
the first load.

### 7.4 R7d `persist-7d-homebrew-files`

| Batch | Goal and scope | Gates (cost) | Review | Split criterion |
|---|---|---|---|---|
| `B7d.1` | `import_homebrew` (4.7), `lib/homebrewFile.ts`, `lib/bundle.ts` v2, the two schemas and fixtures, `tests/contracts.js` and `tests/derived.js` pins, `llms.txt` both sections, `HomebrewRepository.import`, the fake, the contract case, the blind round; F1's grep again | `check` 8, `check:db` 10, `check:built` 2, the blind round 10; after the approve push 1, `e2e` 3 (~34 min) | required (a migration, two public schemas) | a new release; the schema batch rule |
| `B7d.2` | The import panel on `#/homebrew` with the «Куда» mapping and the skip or update `Seg`, the three download surfaces, the batch bar's download, `homebrew.json` in the zip, the account hint, the privacy merge steps | `check` x2 16, `check:built` 2, `app/states` 6, `app/contracts` 7, goldens 13, `e2e` 3 (~47 min) | required (new UI) | a commit boundary the harness cannot reach without `B7d.1` |

R7d total: about 81 minutes plus the closeout.

Acceptance lines inherited from R7, each its own line in its batch when the
R7d refresh expands it:

- `B7d.1` (4.1, review R1 of R7's plan): the import turns `\r\n` and `\r`
  into `\n` before it validates.
- `B7d.1` (4.11): a v2 frozen entry sends `snapshot` as a JSON object; a
  test proves that a JSON `null` never reaches `import_lists` for a frozen
  entry.
- `B7d.1` (`B7.1-3`): the "holds a name" test agrees on both sides. SQL `\S`
  follows the database's ctype locale; `/\S/u` in `lib/homebrew.ts` also
  counts U+00A0, U+2007, U+202F and U+FEFF as spaces, so a name of only
  U+00A0 passes the database and fails the client. R7d's migration puts one
  explicit character class on both sides, with one fixture case in
  `docs/fixtures/homebrew/`. The R7 migration does not change.
- `B7d.1` (F1): `git grep -i -E "pistolheart"` outside `issues/` finds
  nothing.
- `B7d.1` (`B7b.2`): `schema/homebrew-v1.json`'s `dmg` pattern is `DMG`'s
  (`+1`..`+99`), and `llms.txt` names that bound.
- `B7d.1` (task `limits-follow-overrides`): `import-v2` takes v1's widened
  bounds (5000 entries per list, 1000 lists per call); the schema's bounds
  are the call's ceilings.
- `B7d.2` (`B7.2-9`): a source or section rename writes the name in the
  item's language rule, not only in the language on screen. Today a source
  named only in English and renamed in the Russian interface keeps its old
  English name, and the English interface shows the old name. Apply
  `editLang` (or the same rule) to source and section names, since R7d's
  import fills both languages.
- `B7d.2` (D69): `DEBT.md` D69 is deleted in the batch whose data zip
  carries homebrew items, sources and homebrew list entries, and the zip
  of an account with a source, an item and a list holding a reference and
  a frozen copy loads back into a new account with all of them; the hint
  `yourDataHint` and the privacy pages' merge paragraph ("Если Google или
  Discord уже занят" and its English twin) say so.
- `B7d.2`: the `#/homebrew` empty text gains «...или импортируйте файл».
- `B7d.2` (owner, 2026-10-01): bulk moves between sources and sections. A
  selection on `#/homebrew` offers «Переместить...» in the selection bar;
  it opens the import's «Куда» source and section picker (one component for
  both, extracted on its second use), moves the ticked items in one write
  per source or section pair, keeps every item key, and refuses a move that
  breaks a rule of 4.14 F5 (a section outside the target source) with the
  form's own text. The R7d refresh designs the write (a batch update on the
  repository port, one revision check per item) and the mock.
- `B7d.1` and `B7d.2`: the bundle paragraph of section 7 ("Inherited by
  every batch that runs `check:built`") holds.
- `B7d.2` (`scale-challenge` F10): `ImportPanel` groups the skips once into a
  `Map` per list, draws the first 20 list blocks and «и ещё N списков».
- `B7d.1` and `B7d.2` (owner, 2026-10-01): the import and export code is a
  lazy chunk like `zip` (or its own chunk), with a loading state and a
  failed-chunk state with «Повторить» (the `ImportPanel` pattern
  `import(...).catch(() => null)`); `homebrew.json` is one file in the zip.
- `B7d.1` and `B7d.2`: the design target is 3x the defaults (60 sources,
  300 items, 300 cards); the import ceilings stay the contract's.

## 8. Mocks (`mocks/`)

The owner approved m01-m22 on 2026-09-30. The generator is gone: edit a
mock by hand. The Browser pane opens only `mocks/index.html` and a page
copied to `m23-editor-feedback.html` of a mocks directory
(`.claude/README.md`, "Shell hazards on this host").

Answers that override what the mocks still draw - each an implementer
constraint:

| Answer | Mocks that still draw the old form | What ships |
|---|---|---|
| `Q3` limit 100 | m03, m15, m19, m20, m21 («из 500», «- 500») | 100 from the database (`my_limit`), in the count form «Мои предметы: N из M» |
| `Q4` no second-language UI | m04, m05, m20, m21 («Другой язык» fold) | no fold; the fields edit the item's own language (4.10) |

| Mock | Screen | Release, batch |
|---|---|---|
| m02 | `#/homebrew as gm1`: sources with sections, the rows | R7 (shipped); the lead line R7b `B7b.1`; the «Карты» fold R7c `B7c.3` |
| m03 | `#/homebrew` states | R7 (shipped); R7d adds the import and download buttons |
| m15 | «Импорт предметов» | R7d `B7d.2` |
| m16 | the download surfaces | R7d `B7d.2` |
| m17 | the `homebrew-v1` file and the `llms.txt` outline | R7d `B7d.1` |

## 9. Owner answers

| Question | Answer (2026-09-30) | Lands in |
|---|---|---|
| `Q4` second language | the bilingual stored shape, no second-language UI; only a file import fills both | 4.1; R7d |
| `Q7` held keys on import | skip or update, default skip | 4.11; R7d; D6 |
| `Q9` sources on import | automatic, with the per-source mapping | 4.14 F3; R7d; D6 |
| `Q13` `import-v1` bounds | decided in `limits-follow-overrides` | 4.11; R7d |
| `Q14` bundle budget | A: step up per batch to 250 kB configured, 190 kB unconfigured; the ceilings may rise when reasonable, each with a decision (`B7.2-4`) | 4.10, section 7 |
| `Q15` the `list_entries` bound with cards (2026-10-01) | A: the bound 131072 bytes; card texts 1500 code points, names 80, subtitles 60, `url` 300; a worst-case shared list of 100 frozen entries grows from 3.2 MB to 12.8 MB, accepted (rejected B: 65536 bytes and 800-code-point texts, the catalog's `huge-green-ooze` card would not fit) | 4.3, 4.7; `B7c.2`; its decision file |

No question is open.

## 10. Decisions (`docs/decisions/`)

| File | Decision |
|---|---|
| `2026-09-30-homebrew-travels-as-its-own-file.md` | D6: two file formats, skip or update, the mapping, the ceilings (R7d) |
| `2026-10-01-homebrew-keeps-the-way-open-to-shared-books.md` | D7: item 13's direction (4.13), written at R7's closeout |

## 12. Risks, assumptions

- Risk: the client-only rules (a section inside the item's source, a line
  that starts at equipment of the same type, a duplicate name) cannot be
  CHECKs; the editor and the import share one function, and a key that
  answers nothing draws nothing.
- Assumption: a frozen snapshot of up to 128 KB per entry from `B7c.2`
  (`Q15`, A). At the default entry limit a shared list is at most 12.8 MB;
  an override of 1000 entries makes it up to 128 MB in the worst case; real
  snapshots are about 2 KB. Accepted: the owner's answer, and an override
  is the owner's own grant.
- Assumption: a purchase request's 32 KiB lines bound holds about 700
  lines of homebrew keys (19 characters each).

## 13. The review register carried from R7 and R7b

| Id | Finding | Placed in |
|---|---|---|
| `B7.1-3` | SQL `\S` and JS `/\S/u` differ on U+00A0, U+2007, U+202F, U+FEFF | `B7d.1` |
| `B7.2-4` | The bundle headroom after R7; the owner: raise when reasonable, with a decision | every batch that runs `check:built` |
| `B7.2-9` | A source or section rename writes only the language on screen | `B7d.2` |
