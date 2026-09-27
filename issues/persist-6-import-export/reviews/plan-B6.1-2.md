Verdict: approve
Reviewed: 01ada7c21f6f9547b71c43a64441630f5a23587d
Scope: plan before B6.1

# Review - plan before B6.1, second look (persist-6-import-export)

Pass 4 fixes all three blockers and Risks 1-6. It places Risks 7-9 in the B6.2 refresh, where each becomes its own acceptance line. It fixes or properly defers the nits. Two small new defects remain in the fixes; both are cheap. Give them to the implementer as B6.1 acceptance lines. They do not need another planner pass.

## Blockers

None.

## Risks

1. **The notes-heavy contract case sends about 9.6 MB, not about 5 MB.**
   - 4.5 contract case 6 uses "50 lists of 100 entries whose two notes are 480 Cyrillic characters each (about 5 MB of JSON)".
   - A Cyrillic character is 2 bytes in UTF-8, and `JSON.stringify` does not escape it. So the body is 480 x 2 x 2 x 5000, about 9.6 MB, plus ids. That is about twice what a valid file under `FILE_MAX_BYTES` (5 MiB) can produce.
   - Consequence: the case can take the Fallback on a body the product never sends, and lower `FILE_MAX_BYTES` for no reason.
   - Fix: size the case in bytes. Build the notes so that `utf8(JSON.stringify(rows))` is about 5.5 MB (a 5 MiB file plus two UUIDs per entry). About 240 Cyrillic characters per note gives that. Assert the byte length in the log line.
2. **Delta line D2 does not hold as written.**
   - D2 says B3.2's `timed()` "takes a bound (the review found it on `94058abd`)".
   - On `94058abd`, `timed(call)` has no bound parameter: it reads the constant `WRITE_TIMEOUT_MS`. The first review found the helper, not a parameter.
   - Read literally, D2 fails and "stops the batch for a planner pass".
   - Fix: reword D2 to say `timed()` exists and wraps every write RPC. Step 4 then gives it an optional bound (default `WRITE_TIMEOUT_MS`), which `import` calls with `IMPORT_TIMEOUT_MS`. The existing `supabase.test.ts` timeout cases keep passing.

## Nits

- `local` (B6.1 step 3 / B6.2): 4.14 rule 8 says the plain-file path "decodes the same way". Name one helper in `lib/bundle.ts` (strict UTF-8 with the BOM dropped) that both paths use. `zip.ts` loads lazily, so the plain path must not import it just to decode text.
- `local`: 4.14 rule 7 says names "are compared, never shown raw", but the `other` names are shown in `importZipOther`. Reword it: names are shown through text interpolation only.
- `local`: the refusal reason is `tooBig` and its text key is `importTooSlow`. Use one word for one meaning.
- `deferred-scope` (B6.2 refresh): the new keys `importTooSlow` and `exportOverBounds` are missing from 4.6's "New keys" list. Only `importNotZip` was added there.
- `deferred-scope`: when two `<folder>/lists.json` sit at the same depth, the answer is `noLists` («В архиве нет файла lists.json»). That text is wrong for this case, which is rare. A separate text would be accurate. The refresh may also keep it as it is.

## Deviations

Every finding from the first look, checked against `01ada7c2`:

- **B1a - fixed.**
  - `toBundle(..., untitled, now)` writes `t.untitled` for an empty or blank name.
  - The `''` and `'   '` round-trip cases and a B6.1 acceptance line are added.
  - The `export.json` fixture is unaffected, because `gm1` has no blank names.
- **B1b - fixed per the owner's Q6 answer** (keep 50/100; 4.15, section 11, `context.md`).
  - The export stays whole, and the `exportOverBounds` toast names the long lists.
  - The FEATURES line, the hint and the m15 bullet are added.
  - The B6.2 `app.test.ts` cases are placed.
- **B2 - fixed.** Reader rules 1-9 cover:
  - never throwing, with seeded random buffers and every truncation;
  - bounds, including the end-record search window;
  - the central directory as the authority, and name agreement;
  - encrypted, zip64 and multi-disk archives refused;
  - the 1000-entry cap and the count agreement;
  - the CRC;
  - the name rule: root first, then the shallowest folder, a tie gives `noLists`, and system files are ignored;
  - strict UTF-8 with the BOM dropped, giving `notText`;
  - the refusal mapping.

  Each rule is an acceptance line. Step 10 writes the *frozen* subset into `CONTRACTS.md`, and a lenient reader with a strict writer is coherent.
- **Checks on the new behaviour the fixes add:**
  - **The re-zipped folder:** a deflated re-zip now answers `packed` ("unzip it"), and a stored one imports. No new defect beyond the tie-case nit.
  - **The 5000-entry cap:** it is correct under the per-element loop, the whole call rolls back, and the layer 3 case is added.
  - **The 120 s import timeout:** it applies to `import` only, and the buffer's 20 s stays. The fake-timer case checks that the call is still pending at 20 s. Only the D2 wording is open (Risk 2).
  - **57014 -> `refused`/`tooBig`:** mapped only in `import`, and `apply`'s `writeOf` path is kept and tested. A timeout on a cold database can tell a user to split a file that a retry would pass. This is acceptable, because the text suggests an action that works.
  - **The re-read after `network`:** it answers `ok` only when every list id of the call is in the read, and atomicity makes that all or none. A read dropped for overlap falls back to `network`, whose retry stays idempotent. No new defect.
- **Risks 1-6 - fixed:**
  - the count-regex wording rule in 4.9 P2, 4.15 and m15, and m15 is now clean;
  - the timeout and the fallback's cheaper first step;
  - the 5000 cap;
  - the `check:db` background rule in step 12;
  - `git rebase --onto <main> 1cbca5f7`, with which copy wins stated;
  - the re-read.
- **Risks 7-9 - placed** in section 9 as B6.2-refresh acceptance lines: the CSS scope, R4's `ListCard` with D9 and mock updates, and pruning the selection on a filter change.
- **Nits:**
  - Fixed:
    - grants: `service_role` false and `proconfig` pinned. This matches the migration's `revoke ... from public, anon`, as `list-writes.test.mjs` already shows for `apply_list_writes`.
    - B's list is unchanged after the 42501 refusal.
    - P2 cuts at a line start and matches bounds as whole numbers.
    - P3's structural checks are added. `catalog.csv` has `source` `Core` and `kind` `weapon`, `secondary` and `armor`, so they can run.
    - `CONTRACTS.md` fixture line and section 5.
    - the 4.12 offline claim.
    - `git grep -n`.
    - the walk order.
    - the `other` cap.
    - the handoff status `blocked`.
  - Correctly deferred: `plan-B6.1-22` and `plan-B6.1-23`.
- The deviations accepted in the first look stand.

## Suggested next action

Dispatch the implementer for B6.1 after R4 closes and the delta check runs. Place Risks 1-2 and the three `local` nits as acceptance lines in B6.1. Carry the two `deferred-scope` nits into the B6.2 refresh.

## Checks still needed

- The delta check D1-D9 on `main` holding R4, with D2 reworded (Risk 2).
- On the test project: the maximal import time and the notes-heavy case, sized as Risk 1 says.
- `node tests/derived.js` on the final `llms.txt`.
- The `check:db` wall clock.
- The blind round with P3's structural checks.
