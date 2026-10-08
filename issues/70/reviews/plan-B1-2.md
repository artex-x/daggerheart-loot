# Review - plan before B1, second look after the R7h refresh (70)

Verdict: fix-then-continue
Reviewed: 57d8c242a3467d7fc8156b7a51d9356331ceda6e
Scope: plan before B1

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

Reviewed: the plan commit `57d8c242` plus the uncommitted R7h refresh of
`issues/70/plan.md`, `handoff.md` and `context.md` (409 insertions, 161
deletions). The planner worktree HEAD is `b63af78a`, which adds only TASK
71 files on top of `57d8c242`. Scope: plan sections 5, 6, 8, 10, 11 and the
B3 outline's import lines.

Ground truth: R7h at `31c1400f`. The R7h branch head is now `3c3e723c`
(the task commit amended); `git diff --stat 31c1400f 3c3e723c` changes only
`issues/persist-7h-homebrew-page/` files, so every code fact below holds at
both. R7h's remaining batches add no migration.

The server design holds against the R7h bodies:

- `get_shared_list(text)` at `20261007130000` reads `hid` and `snapshot`
  from `e.hb_item` per entry. Step 1c's subquery `e` carries `hb_item`
  through `e.*`, so a dropped entry takes its `hid` and its record with it.
  The `(text, bigint)` wrapper (`20261002120000`) calls the one builder.
- `clone_shared_list` builds from the projection, so a players' clone has
  no GM-only entry. Step 1d copies `gm_only` from a GM's answer.
- `create_purchase_request` reads `list_entries` in two places only: the
  stale check and the price subquery. Step 1e filters both. The request
  limits run before the stale check and do not depend on an entry, so no
  limit answers differently for a GM-only item.
- `apply_list_writes` `relink` sets `hb_item` only. The
  `list_entries_hb_key` trigger rewrites `item_key` and `source` only. So a
  relinked entry keeps `gm_only`, and the fake's `relink` spreads the entry
  and keeps it too.
- `list_notices`, `mark_list_read` and the `notice` broadcast on
  `owner:<uid>` are the list owner's only (RLS and topic), so a players'
  page never learns from them that a GM-only entry exists.
- Realtime: `list_entries_touch_update` is statement level on any column,
  so a mark bumps the revision once. `homebrew_links_touch` bumps every list
  that links an item, of any owner, which risk 1 names.
- `list_entries` has table-level grants only (`20260925130100_lists.sql`),
  so the new column needs no grant. `EXPECTED_ANON_FUNCTIONS` does not
  change.
- The reversal walk compares schema snapshots, so the plan's "restore the
  five bodies verbatim, then drop the column" is the right shape.
- B3 import lines: `importPlan` builds each `EntryRow` field by field, and
  `withCopies` returns `e` or `{ ...e, item_key: key }`. So a `gm_only` key
  that `importPlan` writes survives a fixed copy and a renamed copy, as the
  outline says.

## Blockers

None.

## Risks

1. **plan-B1-2-1 - Section 11, B1 Verification step 3 and the gate-cost
   table name a test push that fails on this host.** R7h's handoff
   (Deferred) records that `db-push.mjs --project test` fails here with
   `LegacyDbConfigIpv6Error`. R7h applied both of its migrations with
   `tools/supabase/migrate-test.mjs` over the session pooler.
   `.claude/README.md` (the `db:push` row of the Supabase command table)
   also says that `db:push` refuses while another branch's migration is on
   the test project, and that `migrate-test` is the path then. Change:
   - In B1 Verification step 3 and in the B1 row of the gate-cost table,
     name `tools/supabase/migrate-test.mjs` (the path R7h used) as the
     test push after the approving review. Keep `npm run db:push -- --project
     test --yes` only as the first try where IPv6 works.
   - Add one line under "Risks and do-nots": the agent applies the
     migration to the test project only after the batch review approves,
     whatever the tool.
   I did not find the exact `migrate-test.mjs` command line that R7h ran.
   The implementer takes it from `.claude/README.md` or asks the
   orchestrator.

2. **plan-B1-2-2 - Section 10, risk 5 understates what a player reaches.
   The recommendation to accept stands.** The risk says that a player "can
   see the name of a related own item". But each `related` row of
   `get_homebrew_item` carries the item's `hid`, and the app draws a
   relation as a link to `#/h/<hid>`. So the player can open the full
   record of the GM-only item: its descriptions, stats and set bonus. The
   player still cannot learn that the list holds the item, or its quantity,
   price or notes. Two more paths are not named:
   - A player who added the item to an own list while the entry was shown
     keeps a live link. R7h then sends that player «Автор изменил ...»
     notices on each later edit of the item by the GM.
   - A players' clone («Сохранить себе» on `#/s/`) made before the mark
     keeps the entry.
   Change the risk 5 text, and the decision file that step 15 writes, to
   say: "the related row carries the `hid`, which opens the item's own
   page". Add the two paths above as accepted consequences of "the mark
   hides the entry, not the item".
   Recommendation: accept. The published privacy page already says that an
   item address opens the related items. The rejected filter would couple
   the item read to the lists, and an item can be shown in one list and
   GM-only in another. The cost that we accept: an under-the-counter item
   that relates to a shown item of the same author stays one click away.
   This is the owner's decision (plan section 12). The orchestrator asks
   the owner, with this recommendation, before B1 starts.

3. **plan-B1-2-3 - The privacy pages are not in the plan.**
   `pages/src/privacy.html` ("Ссылки для доступа") says «Вид для игроков не
   показывает заметки мастера.», and `pages/src/en/privacy.html` says "The
   player view leaves out the GM notes." After task 70 the player view also
   leaves out the entries marked GM only. These two pages are the published
   statement of what a link shows, and the change in section 4 makes them
   incomplete. Change: add both files to the B2 file list. Each sentence
   becomes, with the same facts in both languages: «Вид для игроков не
   показывает заметки мастера и позиции «Только для мастера»; такой
   предмет по-прежнему открывается по своему адресу.» / "The player view
   leaves out the GM notes and the entries marked GM only; such an item
   still opens at its own address." Add one acceptance line to B2. The
   wording is the planner's to settle, but the second clause is required
   by risk 5 (finding 2).

## Nits

4. **plan-B1-2-4** `local` - Section 11, B1 steps 3 and 13, the test
   fixtures:
   - Step 3: the only homebrew entry is the GM-only one. So "no `hid` of
     the GM-only entry in the players' answer" passes even when no
     homebrew entry is in that answer. Add a shown homebrew entry that
     links another own item, and assert that it keeps its `hid` while the
     GM-only one is absent.
   - Step 3: search the answer text for the GM-only item's uuid only, not
     for its key. A shown item's record can name that key in `craft` or
     `craft_from`, which is the accepted risk 5, not a leak of the
     projection.
   - Step 13: "a list of three, one official and one homebrew" names two
     entries. Name all three, and put the GM-only entry before the last
     shown entry, so that the players' read proves the renumbering.

5. **plan-B1-2-5** `local` - Section 11, B1 step 15: the sentence that
   lists what a relink keeps is in FEATURES.md "Records", the «Сохранить
   себе» / "Save to my items" bullet ("each keeping its position, quantity,
   price and both notes"). It is not in "Own items in lists". Add «Только
   для мастера» to that list in "Records". Keep the "Own items in lists"
   line only if it says something new.

6. **plan-B1-2-6** `local` - Section 11, B1 files, the migration
   timestamp. `.claude/README.md`, "Migration names", says: "take the next
   free minute after the newest file". The plan picks `20261008120000`,
   which is a future stamp on 2026-10-07. That is valid. But any migration
   that another branch names from today's clock then sorts before it.
   Production applies migrations with `db push`, which refuses a file
   older than the remote's newest. Change:
   - State the README rule as the rule. `20261008120000` stays as an
     example.
   - Add to section 8: the task that lands second renames its unpushed
     migration so that it sorts after the first one's.
   - Risk 6's message to the R8 and R9 planners names the stamp as well as
     the body.

7. **plan-B1-2-7** `local` - Status, section 11 "Base", context.md: R7h's
   task commit is now `3c3e723c`, the amended `31c1400f`, with
   code-identical files. R7h's `B7h.4t` rebases it again (a commit is
   reordered below the task commit). `git show 31c1400f:<path>` works only
   while that pre-amend object exists. Add "R7h's task commit (`31c1400f`
   when read, `3c3e723c` at review, code-identical)". Before step 1, B1
   re-reads each body from its own base.

8. **plan-B1-2-8** `local` - Section 8, release order: R9 plans
   `#/print/s/<token>/<ids>`, a print sheet read through `get_shared_list`
   and open to readers who are signed out. It inherits the filter, so a
   GM-only id in that address finds no entry. Add one line, and add the
   route to risk 6's message to the R9 planner: R9's print route keeps
   reading through the projection and never reads an item by its id.

## Deviations

- The handoff records one deviation: the decision file is written in B1,
  not in the planning pass. Accepted, as in `reviews/plan-B1.md`.
- The refresh moved lines that the first review checked: the timestamp,
  the source of the bodies, the `hid` rule, the relink rule, the CONTRACTS
  clause, section 6 rows, risks 1, 5 and 6, the B3 import lines and the
  gate cost. The plan Status lists each. They are reviewed here.
  `reviews.md` gets the `plan-B1-2-*` rows from the orchestrator.

## Standing checks

1. Scale: checked - B1 draws nothing. The projection filters one list (100
   entries by default, 300 at 3x, 5000 per write ceiling). `row_number()`
   orders by `(position, id)`, the order the aggregate already used. B2's
   States table (empty, N = 0, one, many, the limit, one past it, 3x,
   longest name, 360 px, 1180 px) is unchanged by the refresh.
2. Error scenarios: checked - I read section 6 against the R7h bodies:
   `relink` (keeps the mark), the cascade on a deleted linked item (the
   entry goes, the owner's notice only), the import in two calls (a failed
   lists call leaves the fixed copies, and the retry uses the same
   `ImportPlan`), the down migration (every mark lost, named), and the
   stale tabs. Copies made while the entry was shown (a player's link, a
   players' clone) are not named; finding 2 adds them. No unnamed loss of
   stored data.
3. Consistency: checked - B1 has no screen, string or toast. The SQL keeps
   the `security definer`, `search_path` and grant shape of each body, and
   the `gm_note` audience rule. The privacy pages are a sibling statement
   of what a players' link hides, and the plan does not name them
   (finding 3).
4. RU/EN parity: checked - B1 has no string. The privacy sentence of
   finding 3 is given in RU and EN with the same facts. B2 and B3 keys are
   unchanged by the refresh.

## Owner rules

- The Supabase backend is the only server: checked. The filter is in
  `get_shared_list`, `clone_shared_list` and `create_purchase_request`. No
  other endpoint and no client-side filter.
- Production is CI's: checked. "Do not push to production" is in B1's
  do-nots. The test push follows an approving review (finding 1 keeps
  this for the `migrate-test.mjs` path).
- One commit per task, amend per batch, push once at closeout: checked
  (section 11 split criteria).
- A user-visible feature dropped for cleaner code: none. Risk 5 is a
  privacy fork that the planner decided under R7h's rule. The owner
  decides it (finding 2).
- Public contracts default to no change: checked. B1 changes no fixture.
  The one CONTRACTS.md section 1 clause is the only pinned description of
  the projection (`git grep` at `31c1400f`: CONTRACTS.md line 43 only).
- Comments: the planned migration header cites FEATURES.md and the
  decision file, and no `issues/` path. Checked.

## Suggested next action

1. The orchestrator asks the owner for the risk 5 decision (finding 2),
   with the recommendation "accept".
2. The planner applies findings 1-8 to `plan.md` (sections 8, 10, 11 and the
   B2 file list) and to `context.md`.
3. The implementer starts B1, with no further plan review.

## Checks still needed

- B1: `rtk npm run check` (or the form "Run a long check" names on the B1
  base) and `npm run check:db` through PowerShell. The reversibility walk
  must show that the reversal restores the five R7h bodies byte for byte.
  The pinned privilege tests in `list-shares.test.mjs` and
  `purchase-requests.test.mjs` must stay green with no change.
- B1, after its batch review: the test push by the working path of finding
  1, then `npm run e2e` for case P on the hosted test project.
- B1 batch review: diff each redefined body against the newest definition
  on the B1 base, `20261007130000_homebrew_links.sql` or a later one.
