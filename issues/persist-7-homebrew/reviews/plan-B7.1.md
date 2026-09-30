# Review - plan before B7.1 (persist-7-homebrew)

Verdict: fix-then-continue
Reviewed: 7005abeb7ec6621a65f42e590e10599fc93257ad
Scope: plan before B7.1

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

## Points judged

Read: `plan.md` (whole), `context.md`, `handoff.md`, the ten new
`docs/decisions/2026-09-30-*` files and the five older files they amend,
the migrations `20260925130000_limits.sql`, `..._lists.sql`,
`..._list_shares.sql`, `..._list_writes.sql`, `20260927120000_realtime.sql`,
the uncommitted `20260930120000_import_lists_ceiling.sql`,
`ports/supabase.ts`, `ports/types.ts`, `ports/fake-cloud.ts`,
`tests/db/{limits,restore-drill,harness}.test.mjs`, `tests/e2e/{contract,admin}.mjs`.
No gate, stack or hosted project was run.

- Owner answers: applied faithfully. `Q3` = 100 (step 2a, `limit_defaults`);
  `Q4` bilingual stored shape with no second-language UI (4.1, 4.10; the
  validators take `en`/`ru` optional with one name required); `Q5` «... (HB)»
  as plain text (4.2, D2); `Q12` has no draft mark anywhere (no `draft`
  column, field, badge or group; the grep finds only the editor's form
  draft); the counters (4.6 search intro in R7b, 4.10 «Мои предметы: N из M»
  with M from `my_limit`); `Q11`'s catalog `craft` list is `B7c.1`, the head
  of R7c with its own plan review line; `Q14` = A (4.10, 7.1, the decision
  text held for `B7.2` in section 10); `Q6` gives four releases, each cut and
  each batch with a named criterion and a gate cost (totals check: 123 + 65 +
  121 + 81 = 390 min plus four closeouts = about 430).
- Limits through `effective_limit()`: yes everywhere. Both limit triggers,
  `my_limit()` and the usage report's `per_items` read it, so an override
  applies; the client never refuses by a count, and the refused-save line
  prints the database's `details`. The owner's concern is met.
- Migration order: holds. Only one migration (`20260930120000`) is new in the
  tree; step 1 takes a later stamp, and the handoff's blocker starts `B7.1`
  after that task commits. No later migration re-created `get_shared_list`
  or `clone_shared_list`, so "R2's bodies from `20260925130200_list_shares.sql`"
  is the correct reversal text.
- Decision files: `validate(readAll())` reports no problem; `docs/DECISIONS.md`
  equals `render(readAll())`; every new file is within fifteen body lines
  (D1 and D5 at fourteen); every "Amends" has its "Amended by" mirror.
- Implement-ready: yes, apart from the two blockers below, which are plan
  text fixes, not a redesign.

## Blockers

1. `clone_shared_list` turns the owner's frozen copies into references
   (step 2h; the fake's `shares.clone` in step 12 has the same rule).
   After step 2g the projection carries a `snapshot` for a reference and for
   a frozen copy alike, so `case when e ->> 'source' = 'homebrew' and v_owner
   = auth.uid() then null ...` also nulls a frozen entry. When the owner
   clones a list that holds a frozen copy (a copy saved from another GM's
   share, or an R7d v2 import), the new row is a reference to a key the owner
   does not hold, `list_entries_reference_exists` raises `23503`, and the
   whole clone fails. When the owner does hold that key, a frozen copy
   silently becomes live. The path is reachable: contract case H clones the
   owner's own share (`cloud.contract.ts`, `shares.clone(remade.token,
   copy)`), and `SharedListPage` offers «Сохранить себе» to the owner.
   Requested change: decide from the source row, not the projection, for
   example

   ```sql
   case when e ->> 'source' = 'homebrew' and v_owner = auth.uid()
          and exists (select 1 from public.list_entries s
                      where s.id = (e ->> 'id')::uuid and s.snapshot is null)
        then null
        else nullif(e -> 'snapshot', 'null'::jsonb) end
   ```

   The fake reads its held entry's `snapshot` the same way. Add to step 15
   "A clones its own share holding a frozen entry: the frozen entry stays
   frozen with its snapshot", and the same case to step 13.

2. Two SECURITY DEFINER functions have no stated `search_path`, and no
   step pins the functions' settings. Step 2d's "every one `set search_path
   = public, pg_temp`" covers only the functions listed in 2d; the
   Constraints section covers EXECUTE only. `list_entries_reference_exists()`
   (2e) and `my_limit()` (2f) are outside both. Requested change: add `set
   search_path = public, pg_temp` to 2e and 2f (and `language plpgsql` to
   2f). Add to step 15 the case every other suite has (`list-shares`,
   `purchase-requests`, `delete-account`, `legacy-move`): a pin of each new
   function's `prosecdef`, `proconfig` and EXECUTE per role (`anon`,
   `authenticated`, `service_role`).

## Risks

1. The 32768-byte snapshot bound does not hold for every valid item. 4.1
   measures the worst case with 4-byte characters (about 26-28 KB), but
   `jsonb::text` writes a C0 control character other than `\b \f \n \r \t`
   as `\u00XX`, 6 bytes. Two descriptions of 3000 such characters give about
   36 KB, plus names and the source: a valid item whose frozen copy the
   database refuses, so a viewer's «Сохранить себе» of that list fails whole.
   Only a deliberate author reaches it, and it harms only copies of that
   author's list. Recommended in the same remediation: refuse C0 controls
   except tab and newline in `homebrew_names_ok`, `homebrew_text_ok` and
   `contentProblems` / `bookProblems`, with an invalid fixture each. It is
   cheap now and impossible later, because 4.7 lets a validator only widen.
2. A retried update after a lost answer reads as `conflict` (step 8, write
   protocol). If the first `updateItem(id, patch, 1)` lands but its answer is
   lost (`WRITE_TIMEOUT_MS`, a dropped connection), the second press of
   «Сохранить» sends revision 1 again and draws the "newer version" banner for
   the author's own write. No data is lost («Сохранить мою версию» writes the
   same text), but the banner is false. The port shape is fixed in this
   batch, so decide it here: in the no-row path read `revision, content,
   book_id` and answer `{ ok: true, revision }` when the row is `canon`-equal
   to the patch, else `conflict`; the fake mirrors it; contract case M step 5
   gains "the same update repeated after it landed answers ok". The
   alternative (the `B7.2` store compares) is equal for the user; the port
   answer keeps both adapters honest in one place.
3. The reversal deletes every homebrew item, source and homebrew list entry,
   and only a backup restores them. Step 3's SQL comment says so, but
   `.claude/README.md`, "Undo a deploy that carried a migration", does not:
   the limits task wrote a paragraph there for its own reversal. Add one in
   step 18: revert the app alone (the old frontend writes official rows
   only, which the new checks take); run the reversal only after a backup
   and only when the tables must go.

## Nits

1. `local` - Step 7's doc comment cites a batch id and a spec section that
   does not exist yet: `(docs/specs/FEATURES.md, "Homebrew", from B7.2)`.
   `CLAUDE.md`, "Comments", forbids the bare batch id. Cite
   `docs/decisions/2026-09-30-a-homebrew-item-carries-the-whole-catalog-shape.md`
   until `B7.2` writes the section.
2. `local` - The sentence that `docs/fixtures/homebrew/` is not a public
   contract until R7d belongs in `docs/specs/CONTRACTS.md`'s fixture
   paragraph, where `docs/fixtures/share/records.json` has the same note, as
   well as in `COVERAGE.md`. `edit-followup.mjs` flags every `docs/fixtures/`
   edit as a contract surface.
3. `local` - `tests/e2e/contract.mjs` checks that `anon` reads no account
   table and runs only two functions. Add `homebrew_books` and
   `homebrew_items` to its anon loop and an anon `my_limit` call, and add the
   file to "Files": the hosted proof of the grants that layer 3 proves
   locally.
4. `local` - D8 says section "names unique in the source"; the validators
   and `books.json` check keys unique, and no step checks names. State which
   rule ships (keys in the database, names in the client like source names,
   or both).
5. `local` - The mirror line added to
   `2026-09-25-a-homebrew-item-is-stored-as-the-catalog.md` summarizes D1 as
   "snapshots bounded at 32768 bytes". D4 decides the bound, not D1; drop that
   clause.
6. `local` - Step 2b gives the language fallback for the item and for
   `book`, but not for `book.section`. State it; the fixtures then pin the
   same rule on both sides.
7. `local` - Contract case M step 10 "the list is removed" reads as an
   effect of `removeBook`. Write "then remove the list".
8. `local` - Step 12: the fake refuses a create whose id another user
   holds; the real `upsert(..., { ignoreDuplicates: true })` answers `ok` and
   writes nothing. Random UUIDs make it unreachable. Align the fake with the
   adapter, or state the difference in the fake's comment.
9. `local` - `load()` answers `{ ok: false }` when only `my_limit` fails, so
   a display-only number hides the items (for example after a restore that
   lacks the new keys, runbook step 4). Acceptable if stated; else read the
   rows and answer the count's absence separately.
10. `local` - Handoff: `Task status: planned` is not a template value
    (`in_progress | blocked | done`); the `Review:` line uses no template
    form; "four older files with mirror lines" is five (two 2026-09-25 files,
    three 2026-09-26 files). Plan section 10 says four as well.
11. `deferred-scope` - For the R7c refresh: `B7c.1`'s tool list omits
    `tools/capture-share-fixture.mjs`, which reads `rec.craft` twice.

## Deviations

- The handoff's one deviation (m09 and m17 changed with m02 and m22 because
  the generator shares their rows and text): accepted. The overrides table
  in plan section 8 is the right place for the answers that the other
  approved mocks still draw in the old form.

## Suggested next action

Send blockers 1-2, risks 1-3 and the `local` nits to the planner in one
remediation pass (plan text, D8, the one mirror line, the handoff). The
fixes touch step 2e, 2f, 2h, 8, 12, 13, 15, 18 and the Files list; none
changes a batch boundary or a gate. Then a second look (`plan-B7.1-2.md`)
limited to those steps. `B7.1` starts only after `limits-follow-overrides`
commits.

## Checks still needed

- In `B7.1`: `npm run check:db` confirms the name of R2's column check and
  the reversal round trip (plan step 1 and "Fallback").
- In `B7.1`: `tests/db/restore-prod.test.mjs` and `restore-drill.test.mjs`
  after the two new limit keys (the plan edits only the drill's list; confirm
  the prod restore test needs no change).
- In `B7.1`: `npm run check` and `npm run check:db`; after the review of the
  batch, `npm run db:push -- --project test` and `npm run e2e` (cases A-M).
