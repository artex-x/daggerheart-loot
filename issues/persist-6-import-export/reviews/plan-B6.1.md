Verdict: fix-then-continue
Reviewed: 4e55c46c5185c08c345f298caeef4fa03df6271f
Scope: plan before B6.1

# Review - plan before B6.1 (persist-6-import-export)

The plan is thorough and mostly implement-ready. Before the implementer starts, a planner pass must settle two blockers. Both affect contracts that B6.1 freezes: `schema/import-v1.json` and the data zip layout. B1 part (b) also needs an owner answer.

## Blockers

**B1 - The site's own export can fail to import, and the schema freezes that for good.**

The plan says R6 makes the privacy page's promise true: "export the data of the account you drop ... import into the account you keep". For real accounts, the export and the schema disagree in two ways:

- **(a) Empty list names.** `lists.name` allows `''` (`20260925130100_lists.sql`: `check (char_length(name) <= 200)` only). An empty name reaches the database by three paths:
  - `ListPage.svelte` `rename()` sends the raw input value to `CloudLists.rename`, which clips it but does not trim it or fill an empty value. A user who clears the name field saves `''`.
  - `move_legacy_list` writes `v.name ?? ''`.
  - A clone copies the name as it is.

  `toBundle` then writes `"name": ""`. The schema says `minLength: 1`, so the list comes back as a field error, and "nothing imported".
  - Recommended fix: keep `minLength 1`. Make `toBundle` write the UI's `untitled` («Без названия» / "Untitled", as `CloudLists.create` does) for an empty name.
  - Add a `bundle.test.ts` round-trip case with an empty-named list.

- **(b) Accounts past the default limits.** R5's `move_legacy_list` is exempt from both count limits (`20260925130400_legacy_move.sql`; up to 5000 ids per list). Decision 31's overrides also raise the limits. Real accounts therefore hold lists with more than 100 entries, and some hold more than 50 lists.
  - Their «Скачать JSON» and «Скачать мои данные (ZIP)» files break `maxItems` 100 or 50. They cannot be imported anywhere, not even into the same account.
  - Import is not exempt, so a wider schema alone would not help.
  - Section 11 "Consequences" names "several files" only for a raised override. It does not name the moved-list case, and it does not say what the export does.

  This is a user-visible limit on the account move, so the owner decides it. Ask as Q6:
  - **Recommended:** keep the frozen bounds (they equal the defaults). Name the case in FEATURES and the export hint. The import report already names the list and the bound («Позиций больше 100»).
  - Alternative: split the export into files of at most 50 lists and 100 entries.
  - Trade-off accepted with the recommendation: a moved list over 100 entries cannot move between accounts by file.

**B2 - The `readZip` / `readDataZip` contract is under-specified for hostile or re-zipped input.**

4.14 lists null returns only for these cases: no end record, a bad central directory, a CRC mismatch. The zip layout is frozen in `CONTRACTS.md` in B6.1. State these rules and pin each one in `zip.test.ts`:

- **Never throw.** `DataView` reads past the end throw a `RangeError`, and an uncaught throw breaks the panel.
- **Bounds:**
  - Search for the end record only in the last 22 + 65535 bytes.
  - Keep the central directory offset + size inside the buffer.
  - Check each central directory entry's signature and lengths.
  - Keep each local header offset inside the buffer, and check its signature.
  - Keep data start + size inside the buffer.
- **Header agreement:** for method 0, compressed size equals uncompressed size. The central directory and the local header agree, or say which one wins.
- **Flags and markers:** refuse bit 0 (encrypted). Read bit 3 (data descriptor) from the central directory. Refuse zip64 markers (`0xFFFFFFFF`) and multi-disk fields.
- **Entry count:** set a cap, and require it to equal the end record's count.
- **Name rule:** is `lists.json` matched at the root only?
  - A person who unzips and re-zips the folder gets `<folder>/lists.json`, usually deflated. Today that answers `noLists`, not `packed`, so the reader sees the wrong message.
  - Say what happens to a duplicate `lists.json` and to `__MACOSX/` entries in `other`.
- **Decoding:** UTF-8 decode `lists.json` with a BOM strip. State whether invalid UTF-8 is an error or becomes a replacement character.

## Risks

1. **The `tests/derived.js` count check will fail on the planned `llms.txt` text.**
   - `COUNT_BEARING_FILES` includes `llms.txt`. `COUNTERS` has `/(\d{3,})\s+entries/g`, which accepts only 1272 or the Wondrous count.
   - m15's draft has "0 to 100 entries" and "a list at most 100 entries". Both fail.
   - Step 8 should name a rewording (for example "entries: 0 to 100", "at most 100 per list"). It must keep P2's bound check, and B6.2's EN strings must follow the same rule.
2. **A large import can fail on a slow connection and read as `network` for good.**
   - B3.2's `timed()` aborts at `WRITE_TIMEOUT_MS` (20 s), upload included. A valid 5 MiB file on a 1 Mbit/s uplink takes about 40 s.
   - A hosted statement timeout (57014, HTTP 500) also maps to `network` in `writeOf`. The user then retries the same doomed call and sees `accountFailed` each time.
   - The contract's maximal case sends short rows (about 1 MB). The body limit and the time for a notes-heavy 5 MiB file are not measured.
   - Add a measured notes-heavy case, or lower `FILE_MAX_BYTES` to what is measured. Consider a longer timeout for `import`.
3. **`import_lists` has no entry cap of its own.**
   - AFTER ROW triggers fire at the end of the statement: the plan's own `lists.sql` comment says so.
   - So one oversized `entries` array inserts every row, and every `list_entries_touch` update runs, before `list_entries_limit` raises. Only the 8 s statement timeout bounds the work.
   - A cap like `apply_list_writes`' (`jsonb_array_length(entries) > 5000` -> 22023) bounds the work. It still leaves the trigger to answer with the account's own limit for any realistic override.
4. **`check:db` may pass the 600 s cap.**
   - It is 545 s today ("near the cap"). R4 adds suites and R6 adds `import-lists.test.mjs`.
   - Name the fallback in step 12 (`.claude/README.md`, "Run a long check").
5. **A plain rebase in the delta check will conflict.**
   - `1cbca5f7` is not an ancestor of `main`: `94058abd` squashes B3.1 and B3.2. A plain `git rebase main` replays B3.1.
   - Use `git rebase --onto <main> 1cbca5f7`.
   - The main checkout also has uncommitted edits to `issues/persist-6-import-export/context.md` and `issues/persistent-storage/plan.md`. Say which version wins.
6. **A committed import can be re-applied by a retry.** If an import committed but its answer was lost, a retry re-inserts entries the user deleted meanwhile, or re-creates a deleted list. This is rare. Name it in section 12, or drop the kept rows once a re-read shows their list ids.
7. **B6.2, settle in its refresh: `BatchBar` CSS scoping.**
   - Snippet markup keeps the caller's scope. The classes inside the `summary`, `actions` and `below` snippets must keep their CSS in `ListPage.svelte`: `.batch-count`, `.batch-total`, `.np`, `.batch-lbl`, `.guess*`, `.money-act`, `.money-hint`.
   - Only the wrapper classes move to `BatchBar`: `.batch`, `.batch.on`, `.batch-all`, `.batch-summ`, `.batch-acts`, the 640 px rules, `.batch :global(.btn.sm)`.
   - "The inline `.batch` CSS moves with the markup" is wrong as written. The golden compare would catch it, but late.
8. **B6.2: R4's `ListCard` changes are not in the mocks.** R4 adds a gold pending line «N запроса ждут ответа» inside the card link and changes `ListCard`'s `aria-label`. m01 and m03 predate R4, and 4.11 moves the count into the meta line and puts the pick box in the corner. Add the composition to D9.
9. **B6.2: a hidden ticked card can be deleted.** «Выбрать все» ticks drawn cards only, but a single tick survives a later search. «Удалить (N)» can then delete hidden lists, and the confirm names only five. Prune the selection to drawn cards on filter change, or keep it and state that.

## Nits

- `local`: step 7's grants case should also pin `proconfig` (the `search_path`) and `service_role`, as `list-writes.test.mjs` does. The 42501 case should assert that B's list and entries did not change.
- `local`: two fixes to the P2 check:
  - Cut the section at a line-start `\n## ` (a bare `## ` matches inside `### `).
  - Check bounds as whole numbers (`99` is a substring of `99999`).
- `local`: P3's pass line checks validity only. Add structural checks on `from-llms.json`:
  - two lists, the second named Stash with `entries: []`;
  - six entries, each a tier 2 Core Set equipment record per `catalog.csv`;
  - `money_mode` `coin`, a price on every entry, one `quantity: 2`;
  - one entry `gm_note` and a list `player_note`.
- `local`: `CONTRACTS.md` needs two more edits:
  - line 10's fixture list gains `docs/fixtures/import/`;
  - section 5 ("Static asset paths") gains `schema/import-v1.json`.
- `local`: 4.12's reason "works offline in the installed app once cached" is false. `sw.js` caches only pictures and hashed build files (`CONTRACTS.md` section 5).
- `local`: step 8's `grep -n "#/l/" llms.txt` breaks the host's shell rules. Use `git grep -n` or `rtk grep`.
- `local`: `errors.json` says "in file order". State that the walk visits an object's keys in document order, and where a `missing` error sits.
- `local`: cap the file names in `importZipOther`'s `%s`, for example the first five, then «и ещё %n».
- `local`: the handoff Status "Task status: planned" is not in the template's set (in_progress | blocked | done).
- `deferred-scope` (B6.2 refresh): B6.2's acceptance puts the owner's statements 1-7 in one bullet. `CLAUDE.md` says "A placed item is its own acceptance line": split it into seven.
- `deferred-scope`: `zlib.crc32` needs Node 22.2 or later, but `engines` says `>=22`. `.nvmrc` pins 24, so CI is fine.

## Deviations

- `import_lists` is `security invoker`, not definer: **accepted**.
  - RLS covers every inserted row. `lists_insert` checks `owner_id = auth.uid()`, and the function writes `auth.uid()`.
  - `list_entries_insert` holds for every entry, because `list_id` is always `v_id`. That is either the row just inserted or a row the caller's RLS can see.
  - Extra payload keys cannot set `owner_id` or `list_id`.
  - Another owner's list id is refused (42501) before its entries are inserted.
  - There is one transaction and no handler, so the whole call rolls back on any error.
  - `search_path` is fixed, and EXECUTE is revoked from `public` and `anon`.
- No entry bound in the RPC: **accepted with Risk 3**, since a large cap keeps the plan's reason.
- The atomicity check sits in the shared contract case, timed: **accepted**. The 1300-entry move measured 304-354 ms, so 50x100 under 6000 ms is plausible. The body size is not measured (Risk 2).
- Batch deletion through the write buffer, with no new RPC: **accepted**.
  - `remove` is idempotent and optimistic, and matches the single delete ("no undo").
  - The recovery path is the confirm only. It names the lists and the loss of links and R4 requests.
  - States case (d) and the E2E flow prove it.
- The roadmap still says definer, old costs and no batch deletion: **accepted**, because `plan.md` is R6's authority. Fix the roadmap at closeout.
- R7's plan still puts `homebrew` inside the lists bundle: **accepted** as R7's refresh item.

## Suggested next action

Resume the planner once:

1. Add Q6 (B1b) with its recommendation. Stop for the owner's answer.
2. Settle B1a and B2 in 4.1, 4.3, 4.14 and the B6.1 steps and acceptance.
3. Fold Risks 1-6 into B6.1's steps, fallback and section 12. Note Risks 7-9 for the B6.2 refresh.
4. Then dispatch this reviewer for `plan-B6.1-2.md`.

Delta check lines D1-D4 and D6 already hold on `94058abd`:
- D1: `ListRow.revision` exists, and `LIST_SELECT` reads it.
- D2: the helper is `timed()` with `WRITE_TIMEOUT_MS`, not an `.abortSignal()` helper. Every write RPC uses it.
- D3: `keepaliveFetch(url, tab)` tags each `rest/v1/` request.
- D4: the fake's helper is `announce(before(), TAB)`.
- D6: `#pull` and `#epoch` are unchanged.

D5: J is the live-topics case, and R4's plan takes K and F12, so R6 takes L. D7-D9 wait for R4 to ship. R4's plan suggests `20260928120000_purchase_requests.sql`.

## Checks still needed

- The delta check D7-D9 against R4 as shipped, and the rebase per Risk 5.
- After the implementation: the maximal import time, and a notes-heavy 5 MiB body on the test project.
- `node tests/derived.js` on the new `llms.txt` text (Risk 1).
- The `check:db` wall clock with R4's and R6's suites.
- The blind round (P3) with the added structural checks.
