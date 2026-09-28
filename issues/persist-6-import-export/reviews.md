# Review register - TASK persist-6-import-export

One row per finding. Status: `fixed` (the plan applies it, section named),
`placed` (an acceptance line of a later batch), `deferred` (the handoff's
Deferred), `open`.

## `reviews/plan-B6.1.md` - plan before B6.1, fix-then-continue (2026-09-27, reviewed `4e55c46c`)

| Id | Finding | Severity | Scope | Status |
|---|---|---|---|---|
| `plan-B6.1-1` | B1a: an empty list name exports as `""` and fails `minLength` 1 | blocker | local | fixed - 4.3 `toBundle` writes `untitled`; round-trip cases; B6.1 acceptance |
| `plan-B6.1-2` | B1b: moved lists over 100 entries and accounts over 50 lists export files the schema refuses | blocker | local (owner Q6) | fixed - owner answered Q6 2026-09-27 (keep the bounds); 4.15, section 11, FEATURES and hint text in B6.2 |
| `plan-B6.1-3` | B2: `readZip`/`readDataZip` under-specified for hostile or re-zipped input | blocker | local | fixed - 4.14 "The reader's contract" rules 1-9; `zip.test.ts` pins; frozen rules in `CONTRACTS.md` (step 10); B6.1 acceptance |
| `plan-B6.1-4` | Risk 1: `tests/derived.js` count check fails on "100 entries" in `llms.txt` | risk | local | fixed - 4.9 P2 wording rule, m15 draft reworded, 4.15 dict rule, B6.1 acceptance |
| `plan-B6.1-5` | Risk 2: a large import times out at 20 s or reads 57014 as `network` | risk | local | fixed - 4.5 `IMPORT_TIMEOUT_MS` 120 s, 57014 -> `refused`/`tooBig`; contract case 6 (notes-heavy 5 MB); Fallback |
| `plan-B6.1-6` | Risk 3: `import_lists` has no entry cap; AFTER ROW limit fires late | risk | local | fixed - 4.5 step 3 caps `entries` at 5000 (22023); step 7 case |
| `plan-B6.1-7` | Risk 4: `check:db` may pass the 600 s cap | risk | local | fixed - step 12 names the background-run rule; section 12 |
| `plan-B6.1-8` | Risk 5: a plain rebase replays `B3.1`; which uncommitted copy wins | risk | local | fixed - delta check uses `git rebase --onto <main> 1cbca5f7`; committed task files win; section 12 |
| `plan-B6.1-9` | Risk 6: a committed import with a lost answer can be re-applied | risk | local | fixed - 4.5 Store re-reads on `network`; section 12 names the residue |
| `plan-B6.1-10` | Risk 7: `BatchBar` CSS scoping of snippet classes | risk | local (B6.2) | fixed - B6.2: `BatchBar.svelte` holds the strip's CSS, the snippet classes stay in `ListPage.svelte`; `svelte-check` reports no unused selector |
| `plan-B6.1-11` | Risk 8: R4's `ListCard` pending line not in the mocks | risk | local (B6.2) | fixed - B6.2: the meta line, then R4's gold line, then the thumbs; the pick box outside the link (the `#/lists ~ requests as gm1` golden re-seeds) |
| `plan-B6.1-12` | Risk 9: a hidden ticked card can be deleted | risk | local (B6.2) | fixed - B6.2: `ListsPage.svelte` prunes the ticks to the drawn cards (`listsPage.test.ts`, state 62) |
| `plan-B6.1-13` | Nit: grants case pins `proconfig` and `service_role`; 42501 leaves B unchanged | nit | local | fixed - step 7 |
| `plan-B6.1-14` | Nit: P2 cuts at a line-start `## `; bounds as whole numbers | nit | local | fixed - 4.9 P2 |
| `plan-B6.1-15` | Nit: P3 needs structural checks on `from-llms.json` | nit | local | fixed - 4.9 P3 pass line |
| `plan-B6.1-16` | Nit: `CONTRACTS.md` fixture line and section 5 | nit | local | fixed - step 10 |
| `plan-B6.1-17` | Nit: 4.12's "works offline once cached" is false | nit | local | fixed - 4.12 |
| `plan-B6.1-18` | Nit: `grep -n` breaks the host's shell rules | nit | local | fixed - step 8 uses `git grep -n` |
| `plan-B6.1-19` | Nit: "file order" for errors undefined | nit | local | fixed - 4.3 walk order |
| `plan-B6.1-20` | Nit: cap the names in `importZipOther` | nit | local | fixed - 4.6 texts, 4.14 |
| `plan-B6.1-21` | Nit: handoff "Task status: planned" is not in the template's set | nit | local | fixed - handoff Status `blocked` |
| `plan-B6.1-22` | Nit: B6.2's owner statements 1-7 in one acceptance bullet | nit | deferred-scope | fixed - section 9 Acceptance has statements 1-7 as seven lines |
| `plan-B6.1-23` | Nit: `zlib.crc32` needs Node 22.2; `engines` says `>=22` | nit | deferred-scope | deferred - handoff Deferred (`.nvmrc` pins 24, CI is fine) |

Accepted deviations (the report's own section): `import_lists` as
`security invoker`; the atomicity check in the shared contract case;
batch deletion through the write buffer; the roadmap rows and R7's plan
left to their own refreshes.

## `reviews/plan-B6.1-2.md` - plan before B6.1, second look, approve (reviewed `01ada7c2`)

| Id | Finding | Severity | Scope | Status |
|---|---|---|---|---|
| `plan-B6.1-2-R1` | The notes-heavy contract case sends about 9.6 MB, not 5 MB; size it in bytes (~240 Cyrillic characters per note, ~5.5 MB), assert the byte length | risk | local | fixed - `cloud.contract.ts` case L: notes of 250 characters, 5,461,091 bytes of rows, asserted 5.0-6.0 MB and logged with the bytes |
| `plan-B6.1-2-R2` | D2 as written fails: `timed()` has no bound; step 4 gives it an optional bound (default `WRITE_TIMEOUT_MS`), `import` calls it with `IMPORT_TIMEOUT_MS` | risk | local | fixed - `ports/supabase.ts` `timed(call, ms = WRITE_TIMEOUT_MS)`, `import` passes `IMPORT_TIMEOUT_MS`; `supabase.test.ts` "the import" (pending at 20 s, `network` at 120 s); the existing timeout cases pass |
| `plan-B6.1-2-N1` | One `lib/bundle.ts` decode helper (strict UTF-8, BOM dropped) for the plain-file and zip paths; the plain path does not import `zip.ts` | nit | local | fixed - `lib/bundle.ts` `decodeText()`; `lib/zip.ts` `readDataZip` imports it; `bundle.ts` does not import `zip.ts` |
| `plan-B6.1-2-N2` | 4.14 rule 7: names are shown through text interpolation only, not "never shown raw" | nit | local | fixed - `plan.md` 4.14 rule 7 |
| `plan-B6.1-2-N3` | One word for one meaning: refusal `tooBig` and text key `importTooSlow` | nit | local | fixed - `tooSlow` in `ports/types.ts` and `supabase.ts`, text key `importTooSlow` (`importTooBig` is the 5 MB file refusal); `plan.md` 4.5, step 4, acceptance, Fallback |
| `plan-B6.1-2-N4` | `importTooSlow` and `exportOverBounds` missing from 4.6 "New keys" | nit | deferred-scope | fixed - plan 4.6 key table (every key, RU and EN) |
| `plan-B6.1-2-N5` | Two `<folder>/lists.json` at one depth answer `noLists`, whose text is wrong for that case | nit | deferred-scope | fixed - B6.2: `readDataZip` answers `manyLists`, text `importZipManyLists` (`zip.test.ts`, `importPanel.test.ts`) |

## `reviews/B6.1.md` - batch B6.1, approve (reviewed `7753e6f2`)

| Id | Finding | Severity | Scope | Status |
|---|---|---|---|---|
| `B6.1-R1` | `README.md` and `README.ru.md` still send readers to `llms.txt` for the `#/l/` link format; point them at the import file, the schema and `CONTRACTS.md` section 3; must land before the push | risk | local | fixed - B6.2 step 1: both READMEs name the import file and its schema; the link format points at `CONTRACTS.md` section 3 |
| `B6.1-N1` | `bundle.test.ts` title "writes the file of 4.1 sparse..." cites a plan section | nit | local | fixed - B6.2: the title reads "writes a sparse file: defaults and row keys left out" |
| `B6.1-N2` | `ENTRIES_MAX` means 100 in `lib/bundle.ts` and 1000 in `lib/zip.ts`; rename the zip one `ZIP_ENTRIES_MAX` | nit | local | fixed - B6.2: `ZIP_ENTRIES_MAX` in `lib/zip.ts` and `zip.test.ts` |
| `B6.1-N3` | `PRODUCT.md` (the `<noscript>` files) and `META.md` section 4 do not name `schema/import-v1.json` or its `ROOT_DIRS` junction | nit | local | fixed - B6.2: `PRODUCT.md` and `META.md` section 4 name `schema/import-v1.json` and its `ROOT_DIRS` junction |
| `B6.1-N4` | The new decision file's Task line narrates the session ("written by the implementer...") | nit | local | fixed - B6.2: the Task line names who decided and when; `docs/DECISIONS.md` rebuilt |
| `B6.1-N5` | `handoff.md` misses template fields (`Results:`, the Next batch fields) | nit | local | fixed - `handoff.md` Verification `Results:` line and the Next batch fields (the post-review amend) |
| `B6.1-N6` | `import_lists`: the 5000-entry check and the array-type check share one `or` chain (evaluation order undefined; 22023 either way) | nit | local | deferred - handoff Deferred: only with another edit of the migration (a migration edit needs a new approve) |
| `B6.1-N7` | `tests/db/import-lists.test.mjs`: `const before` shadows `node:test`'s `before` | nit | local | deferred - left (P14): rides with R7 `B7.3`, which edits that file and runs `check:db`; handoff Deferred |
