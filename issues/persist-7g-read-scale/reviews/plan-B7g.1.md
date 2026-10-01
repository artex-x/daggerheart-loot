# Review - plan before B7g.1 (persist-7g-read-scale)

Verdict: fix-then-continue
Reviewed: bb37a572977e5dfe0031dacc8a5a2e86168f989c
Scope: plan before B7g.1

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

Base: `HEAD` plus the uncommitted `context.md`, `plan.md` and `handoff.md`
of this task. Read against `supabase/migrations/` (lists, list_shares,
limits, list_writes, statement triggers, import ceiling, homebrew,
homebrew_relations), `state/cloudLists.svelte.ts`,
`state/sharedView.svelte.ts`, `ports/supabase.ts`, `ports/fake-cloud.ts`,
`ports/types.ts`, `lib/cloudLists.ts`, `lib/dict.ts`, `state/app.svelte.ts`
(clone), `ImportPanel.svelte`, `tests/db/{harness,list-shares,homebrew,limits,restore-drill}.test.mjs`,
`tests/e2e/contract.mjs`, `tools/decisions.js`, `docs/specs/{FEATURES,META}.md`
and `.claude/README.md`.

The design holds. Each finding below is a local change to the plan text:
no finding needs design work.

## Blockers

B1. Section 4.4 and step 5: the UPDATE trigger can be bypassed by a
direct client write. The plan says "lists whose rows gained or changed a
snapshot, or moved with one", but statement transition tables do not pair
rows; the natural inner join `old_rows o on o.id = n.id` misses an UPDATE
that also changes `id`. `authenticated` holds the full UPDATE grant on
`list_entries` (`20260925130100_lists.sql`), so
`update list_entries set id = <new>, snapshot = <big>` passes the sum
unchecked. `list_entries_limit()` avoids the same trap with a left join and
`o.id is null`.
- Change in 4.4 and step 5: the UPDATE trigger checks the lists of
  `select distinct n.list_id from new_rows n where n.snapshot is not null
  and not exists (select 1 from old_rows o where o.id = n.id and o.list_id =
  n.list_id and o.snapshot = n.snapshot)`, in id order.
- Add to step 8 (`tests/db/lists.test.mjs`): (a) an UPDATE that sets a new
  `id` and a snapshot past the sum is refused; (b) a reorder (a `position`
  UPDATE over rows with copies) and an entry note edit on a list that is
  already past the limit are taken. Case (b) proves that unchanged copies
  are not checked. Without it, every reorder of an over-limit list fails.

B2. The file list misses one test that `check:db` runs, and one runbook
step that a production restore needs.
- `tests/db/restore-drill.test.mjs` (the `db reset` case, about line 153)
  pins the seven seeded `limit_defaults` keys. The new row makes eight, so
  `check:db` fails. Add the file to section 6 "Files" and to step 8:
  `'snapshot_bytes_per_list=1048576'` goes last.
- `.claude/README.md`, "Restore production (owner)", step 4 lists the
  expected keys and the insert for a missing key. A backup from before R7g
  has no `snapshot_bytes_per_list`. After such a restore, every statement
  that writes a frozen copy raises `22023 unknown limit key`
  (`effective_limit`). Add to step 10: name `<ts>_read_scale.sql` with
  `snapshot_bytes_per_list` 1048576 in the step 4 sentence, in the
  expected list and in the example `insert ... on conflict (key) do
  nothing`.
- In the same step: rename `limits.test.mjs` "hold the seven defaults" to
  eight, and change `docs/specs/COVERAGE.md`'s "seven defaults" (about
  line 443).

B3. Section 6, "Verification commands", and the handoff's copy: `check:db`
runs second, not last. Gate credit arms `check:db` for the tree key it
started with. A fix that `check:built` or `app/states` forces after it
costs another 9-10 min `check:db` before the commit (rule 2m). Change both
lists to this order: `rtk npm run check`, `npm run check:built`,
`node tests/run-all.js app/states`, `npm run check:db` (last, PowerShell
tool). After the batch review approves: `npm run db:push -- --project test
--yes`, then `npm run e2e`. Step 12's "Gates in order" then refers to this
list.

## Risks

R1. Section 4.4 and step 5 do not state the trigger function's fixed
`search_path`. Review check H needs it for each SECURITY DEFINER function.
The pattern file implies it, but the plan does not say it. Add
`set search_path = public, pg_temp` to step 5. In step 8, pin
`list_entries_snapshot_limit()` as `homebrew.test.mjs` pins the touch
functions: `prosecdef` true, `proconfig ['search_path=public, pg_temp']`,
and no EXECUTE for `anon`, `authenticated` or `service_role`. No
`auth.uid()` check applies: the function is a trigger, and row level
security decides who writes the row.

R2. Step 5, the fake: the database fires after-triggers in name order, so
`list_entries_limit_*` answers before `list_entries_snapshot_limit_*`. A
statement past both limits is refused as `entries_per_list`. In the fake,
`insertEntries` and `clone` must check the entry count before the byte
sum. State this order in step 5, or a fake-vs-real contract line can
differ.

R3. Section 4.3 and D2 do not name one consequence of `p_since`.
`context.md` records it: a projection changes without a revision bump when
a migration changes `get_shared_list(text)` or `homebrew_snapshot_of`.
Section 4.3 itself says that R7d may `create or replace
get_shared_list(text)`. After such a deploy, an open page answers
`unchanged` and keeps the old projection until the list's revision moves
or the page reloads. Add one sentence to 4.3 and to D2 as an accepted
trade-off.

R4. Step 8, the exact-sum case at the default: "near-maximal copies plus
one sized remainder" needs snapshots with embedded cards to reach about
81 KB. Change the wording to "valid copies, at most 100 entries, whose
`octet_length(snapshot::text)` values sum to exactly 1048576". The helper
then needs only padded `desc` texts within the validator's caps.

## Nits

N1 (local). Step 11 and section 10 fix the id `D74`. R7e and R7f land
first and can take that number. Write "the next free D number at
dispatch" in step 11.

N2 (local). The States table says the RU `limitSnapshots` toast is "20
characters longer" than `limitEntries`. It is about 27 longer
(«копий предметов других игроков» for «позиций», plus « КБ», plus one
digit). The conclusion stays: it wraps in the same toast.

N3 (local). `%n = Math.floor(value / 1024)` shows «0 КБ» for an override
under 1024 bytes. Only `limits:set` can set such a value, so the effect is
small. Write it in the `lib/cloudLists.test.ts` line, or use `Math.ceil`.

N4 (local). `tests/e2e/contract.mjs` says "The two functions anon may run"
(about line 267). Step 8 edits this file, so step 8 should also change the
comment to three functions.

N5 (local). The handoff's "Review:" line has no report path. The template
gives the form `required (trigger: ...), report
issues/persist-7g-read-scale/reviews/plan-B7g.1.md`.

N6 (deferred-scope, pre-existing). `CloudLists.#pull` has no guard against
an older read that answers after a newer one. That older read's changed
rows replace newer objects until the next read. The kept path is safe,
because it reuses `#read`, which holds the newer object, and a missing id
reads again. One cheap guard: skip a changed row whose `revision` is below
`#read[id].rev`. This is not needed for B7g.1.

## Deviations

- The scope follows the owner's inputs of 2026-10-01: a 3x target, Q1 = C,
  Q2 = drop F6. Accepted.
- The decision files are written by B7g.1, not at planning, because R7c may
  rebuild `docs/DECISIONS.md` in the meantime. Accepted.

Verified with no finding:
- The revision-keyed re-read is correct under these conditions:
  - Concurrent edits: a list that changes between the head read and the
    changed read comes back newer, or stays kept until the next read. The
    owner message, the poll or the safety read fetches it.
  - Deletes: an id in neither `lists` nor `kept` leaves.
  - Lists that this tab created and that `#read` does not yet hold: the
    id is missing from `known`, so the read fetches the list.
  - Own writes: they bump the revision, so the next read fetches the list.
  - A refused write: the revision does not move, so the read reuses the
    `#read` object. That object is the server's state, and it replaces
    the optimistic object.
  - The 50-changed fallback: no `kept` gives the same "gone" rule.
    At the defaults the fallback is unreachable (50 lists at most), so
    unit tests carry it.
  - Other-tab writes: `#message` compares with `#read[id].rev`.
  - Each kept field comes from `#read`, which `toCloudList` built from the
    last full row. The R7f limits come from `my_limit` in both branches.
- Requests paging: keyset by `id` with a fresh builder per page. A page
  shorter than `READ_PAGE` ends the loop. Section 4.2 assumes that
  `max_rows` does not cut embedded rows. At 3x that assumption does not
  matter: one parent embeds at most 300 rows, under 1000.
- Overloads: `(text)` and `(text, bigint)` have no defaults. PostgREST
  matches `{ p_token }` to `(text)` alone and `{ p_token, p_since }` to
  `(text, bigint)` alone. These callers keep working: old tabs, the usage
  keep-alive and `clone_shared_list`, which calls `get_shared_list(p_token)`
  with one argument. A stopped or unknown token gives null through the
  overload.
- Grants and pins: the revoke and grant pattern of the overload matches
  `get_shared_list(text)`. `'get_shared_list(text,bigint)'` sorts after
  `'get_shared_list(text)'` both in `order by 1` and in JS `.sort()`, so the
  plan appends it in `EXPECTED_ANON_FUNCTIONS`. The `list-shares.test.mjs`
  pin helper sets `prosecdef: true`, so the overload needs its own pin with
  `false`. Step 8 says this.
- META.md: the step 9 text replaces "executes two functions".
- The trigger:
  - One check per list, after the statement, counts multi-row inserts,
    `import_lists` (one statement per list), `clone_shared_list` (a
    reference becomes a frozen copy for a non-owner) and `apply_list_writes`
    `add` and `create`.
  - It uses the same `entries:` lock and a fresh snapshot per statement
    under READ COMMITTED.
  - `effective_limit` gives the override and treats null as no limit.
  - The legacy move inserts official rows only.
- Stale-tab text: `limitText` maps an unknown key to `limitOther`, so the
  toast reads «Достигнут предел: 1048576. Нужно больше - напишите на
  daggerheart.loot@gmail.com.» as the plan says. The `LIMIT` regex
  `[\w-]+` accepts the key.
- The clone and import paths show `limitText` (`app.svelte.ts`,
  `ImportPanel.svelte`).
- The reversal drops the overload, both triggers, the function and the row.
  The overrides cascade from the row. The stored copies stay. The new
  frontend on a narrowed database loses only the shared page's re-reads.
- The decision amends the 131072-byte decision both ways. The D3 "Amends"
  line uses that file's exact title. The "Amended by" line goes after the
  title and before "- Task", as `tools/decisions.js` requires. Each of
  D1-D3 has the required Task, Decision and Rejected lines.

## Standing checks

1. Scale: checked - the plan's States table against `lists_per_owner`,
   `entries_per_list` and `pending_requests_per_list`, the new byte limit
   (under it, at it, past it, override 2097152, null), 1001 requests and
   the 3x sizes. The only drawn change is a toast, which wraps at 360 px
   like `limitEntries` (length figure: N2). There is no fold, popup or
   sticky change. The 1000-list override cut is a named non-goal, and the
   `.order()` makes the cut newest-first.
2. Error scenarios: checked - section 5 "Compatibility" and the Error
   table:
   - Failed head or changed read: shown state kept.
   - Kept id missing from `#read`: read again.
   - Byte refusal: the existing drop-and-re-read path. The row comes from
     the server, not from a held copy.
   - Offline, conflict, delete, stale tab, app revert and reversal: each
     has a screen and a recovery.
   B7g.1 adds no write and no retry, so no field is written from a held
   copy. No unnamed loss. The gaps found are B1 (an enforcement hole, not a
   loss) and B2 (a runbook gap after a restore).
3. Consistency: checked - the new toast uses the sibling limit form,
   `limitText` and the same error toast. The "N из M" departure is named
   with its reason. «копии предметов других игроков» follows «Список от
   другого игрока» and FEATURES "an item of another account". The loading,
   empty and error states and the actions do not change.
4. RU/EN parity: checked - `limitSnapshots` RU and EN carry the same facts
   (the list, the size in KB, the copies of other players' items, the
   email). Both use ASCII punctuation, with an ASCII apostrophe in
   "players'". There is no plural: the unit follows the number. The
   `lib/cloudLists.test.ts` lines cover 1024 and 2048 in both languages.

## Suggested next action

The planner applies B1-B3, R1-R4 and the local nits N1-N5 once. Then the
planner adds `- Plan review findings applied: reviews/plan-B7g.1.md` to
`plan.md` Status, with one sub-bullet per finding. N6 goes to the handoff's
Deferred. B7g.1 then waits for R7e's and R7f's closeout and its dispatch
refresh (section 8). No second look is needed.

## Checks still needed

- After the batch review approves, `npm run e2e` against the test project
  confirms the PostgREST overload resolution on the real gateway: anon's
  `{ p_token: 'nonsense', p_since: 1 }` answers null, and case H. A
  read-only reviewer cannot run it.
- The step 13 count on the test project after `db:push`, and the owner's
  production count before the merge.
- At the batch review, read the trigger SQL against B1's predicate and the
  `restore-drill.test.mjs` line against B2.
