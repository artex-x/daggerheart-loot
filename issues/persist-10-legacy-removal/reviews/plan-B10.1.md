# Review - plan before B10.1 (persist-10-legacy-removal)

Verdict: fix-then-continue
Reviewed: 537f7d52d80a576eaba8114953f8a3f4bea527e0
Scope: plan before B10.1

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

B10.1 itself is implement-ready: its contract set is complete, the
`listRetired` route is sound, and the `#/s/` port and the `pageRecordFor`
fix are correct. The two blockers are in the outlines of B10.4 and B10.5.
Each is a text change that the planner can make now without design work.
B10.5 gets no second plan review, and B10.4's refresh starts from this
text.

## Blockers

**B1 - B10.4 outline (plan.md sections 4 "P6" and 12, "State"): relink is
wrongly classed as a write that copies an entry's meta.** The outline says
that "a write that copies an entry's meta (restore after a remove, relink,
the add-to-list menu's remove-with-undo) runs only on a detailed list".
The `relink` op does not copy meta. It relinks the row in place on the
server: "its position, quantity, price and notes stay" (`ListOp` in
`lib/cloudLists.ts`). `CloudLists.relinkAs` moves the `meta` keys only when
they are present. «Сохранить себе» (`AppState.saveItem`) relinks every
list that `relinkTargets` names. Most of these lists have no details after
P6. If B10.4 follows the outline as written, the rows of those lists keep
the author's link. This is a silent regression against
`docs/decisions/2026-10-21-each-save-to-my-items-press-makes-a-new-copy.md`.
The other result is a detail read of every target list on each press.
Change: delete "relink" from that sentence in sections 4 and 12. Add one
line: "`relinkAs` runs on a list with heads only; the server keeps the
row's meta, and the local `meta` moves only when it is present." The
writes that need details are `restoreEntry`'s callers only: the list
page's row remove and sell undo, and the add-to-list menu's
remove-with-undo.

**B2 - B10.5 outline (plan.md sections 13 and 14): the undo and the
restore path of the column drop are not named.** Standing check 2 (a
revert and its recovery path) has three gaps:
(a) The app alone cannot be reverted after R10. Every frontend before R10
selects `legacy_fingerprint` in `LIST_SELECT`, so every account list read
fails. The reversal must be in the same push as the app revert, and
`migrate-prod` runs before `deploy`.
(b) For 30 days, `restore:prod` and `restore:drill` fail on every nightly
backup made before the migration, until the reversal is pushed. The
dump's `lists` inserts name the column. `.claude/README.md` records the
same trap for `20261010120000_drop_list_entry_snapshot`.
(c) The reversal brings back the column with nulls. The values come back
only from a restore of a backup made before R10, after the reversal.
Change: add these items to B10.5's files and acceptance:
- a paragraph "To undo `<ts>_drop_legacy_move`" in `.claude/README.md`,
  "Undo a deploy that carried a migration", with (a), (b) and (c) in the
  form of the `drop_list_entry_snapshot` paragraph;
- the same three facts in B10.5's "Standing checks at its refresh" and in
  section 14's "fingerprint values" risk, which now says only "the nightly
  backups of the last 30 days keep them".

## Risks

**R1 - P6 consumer list (sections 4 and 12) misses
`SharedListPage.svelte`'s `hiddenN`.** The owner can open the players'
link of an own list. `hiddenN` then counts that list's GM-only entries
from `app.cloudLists.get(mine)` and `itemMeta`, so the page can say how
many entries the link leaves out. If the list has heads only, the count
reads 0 and no error shows. Change: add `SharedListPage` (`hiddenN`) to
the consumers that read details first. It calls `detail([mine])`. Also
add a unit case where the owner's players' link with a GM-only entry
counts it on a list that has heads only.

**R2 - P6 detail read (section 12, "State"): the protocol has no guards.**
`#pull` has guards: the epoch, `#edits` with the queue (re-read when idle),
`#readSeq`, and revision ordering against `#read`. The outline gives
`detail(ids)` none of them. Add these items as acceptance lines of B10.4,
each with a `fake-cloud` case and a `cloud.contract.ts` case where the
real adapter is involved:
- A detail answer that overlaps a local edit or a buffered write is
  dropped and read again when idle, or the store flushes first.
  Otherwise an add from the menu, followed by «Открыть» within the 2 s
  quiet window, loses the added row from the page until the next read.
- A list that this tab makes (`create`, the menu's new list) has details
  at birth. Its detail read never runs before its `create` has flushed.
  Otherwise `rows` answers nothing, and "a deleted list answers nothing"
  draws the not-found page for a list that exists.
- A re-read of a list with details applies the new head together with its
  rows, or not at all. When the rows read fails, the store keeps the last
  list that had details and sets the detail state to `error`. It never
  stores a head without `meta`. An undo captured from that list would
  restore an entry without its quantity, price and notes.
- The detail state, not the presence of `meta`, decides "has details".
  `add()` on a list that has heads only writes `meta` for the added keys
  only (`withIds`).
- An answer with a revision older than the held one is dropped, as in
  `#apply`.

**R3 - P6, the add-to-list menu's remove-with-undo (section 12,
"Consumers").** `AddToList.pick` is synchronous today. If it reads details
first, the chip waits for a network round trip. This is a new pressed or
busy state, which section 2's "No new UI" does not allow for. Change: let
B10.4's refresh define the state as its own acceptance line. The chip
reports busy (`aria-busy`, disabled) while the read runs. A failed read
toasts `cloudLoadFailed` and removes nothing. The state gets axe coverage.
The alternative is to name in the refresh why the remove can wait without
a state.

**R4 - the 4000 ms bar (sections 4 and 12; D115) is not yet a sound
acceptance line.** "Measured once on the local stack" has no start point,
no end point, no build, no width, no run count and no load condition.
This host downclocks under load (`.claude/README.md`). On a local link
the network costs nothing, so the bar tests parse time, not bytes.
Change:
- Define the bar. Configured build, local stack, 3x seed with `analyze`,
  idle host, 1180 px. Measure from navigation start to the moment that
  `cloud.status` is `ready` and the cards draw. Take the median of three
  runs.
- Give the `tests/db/` head-size bound a number (for example "the head
  JSON at 3x is at most 6 MB", from the est. 4-5 MB plus a margin). The
  number is the gate that does not depend on the host, and `check:db`
  enforces it.
- Add the list page. D115's "What the reader sees" names it, and after
  P6 it waits for one more round trip: `#/lists/<the largest list>` draws
  its rows under the same bar.
- Record the request count and the bytes of each signed-in page state at
  3x, before and after. D115's 82-217 MB per state is up to 2.6 full
  reads. Explain where the extra reads come from before a miss sends
  B10.4 to the RPC fallback, so that the fallback fixes the cause it
  targets.

**R5 - the test project window (section 13, "Order", item 2; handoff
Blockers).** No safer order exists inside one squash. Every drop that
Q1 B requires breaks other branches' `e2e`: the column breaks every list
read of an older client, and the function breaks contract case I and F9.
A computed-column shim for `legacy_fingerprint` keeps the reads working
but not case I and F9, and it works against Q1 B, so do not use it. The
rule needs three changes:
- "No other branch waits to land on `main`" is too narrow. Every push of
  another task branch runs `e2e` and fails in the window. Change it to:
  before the push, `gh run list --workflow ci.yml --status in_progress`
  and `--status queued` show no run of another branch, and no other
  session pushes until `main`'s run after the squash is green.
- Add a stall rule. A red after B10.5's push can need a remediation and
  keep the window open. If that happens, the owner applies the reversal
  to the test project with the orphan procedure of `.claude/README.md`,
  "Branch migrations on the test project". After that, the next push of
  R10 applies the migration again.
- At closeout, name each open `claude/*` branch that must merge
  `origin/main` before its next push. Put the names in section 15 and in
  the closeout report. Without the merge, that branch's `e2e` fails, and
  the failure looks like its own bug.

**R6 - B10.5 re-creates two SECURITY DEFINER functions (section 13,
"Steps").** `lists_limit` (`20260925130400_legacy_move.sql`) and
`list_entries_limit` (`20260930121000_list_entries_statement_triggers.sql`)
are both `security definer` and `set search_path = public, pg_temp`. The
plan says "`create or replace function ... with the body of ...`".
`create or replace` takes the attributes from the new statement. If the
statement leaves out the header, each function silently becomes invoker
with no fixed `search_path`. The up-down-up walk cannot see a drift that
the up makes itself. Change: "copy each function whole, header included
(`language`, `security definer`, `set search_path = public, pg_temp`),
less the guard", and the same for the reversal. Add a layer 3 assertion
to `legacy-move-dropped.test.mjs`, after the migration and after the
reversal: both functions have `prosecdef` true and `proconfig`
`{search_path=public, pg_temp}`, and `public`, `anon` and `authenticated`
have no EXECUTE on them.

**R7 - D115's verify line (section 4 "Deviation" against section 12
"`DEBT.md`").** Section 4 says that B10.4 rewrites D115's "How to verify".
Section 12 says to rewrite it "only if the batch cannot close it; on a
pass, delete D115". The design never meets the original line "the first
read does not embed `list_entries`", so the two sections contradict each
other. The owner gave the carry with that line on 2026-10-22. Change: in
section 12, D115 is deleted when the rewritten criterion and the defined
bar (R4) pass. B10.4's decision file records the changed criterion as a
deviation from the carry. Closeout names it to the owner (when the owner
is AFK, log it as the default).

## Nits

- **N1 (local, step 11):** add the two cases of the filter threshold to
  the port list: "draws no search box below 8 entries, and the box and
  the strip at 8" and "starts unfiltered, folded and without the box on
  another list". Both open `#/l/` payloads, and their subject is
  shared-page behaviour (settled item 11). The step-11 list does not name
  them, and its delete list names only "encodes the 8-entry #/l/ list"
  and "on a #/l/ link". Port them to `seedWith` lists of 7 and 8 entries
  with player shares.
- **N2 (local, step 1 and "Files edited"):** the comment of
  `components/FilterBar.svelte` (the prop doc: "Absent where the address
  cannot carry the filter (`#/l/`, ...") names `#/l/`. The inventory grep
  does not find it, because that grep has no `#/l/` term over `app/src`.
  Add the file, and add `git grep -n "#/l/" -- app/src` to step 1.
  `tools/check/lib.test.mjs` holds a synthetic `docs/fixtures/lists`
  path. Like `selftest.mjs`, it stays.
- **N3 (local, step 11):** `SeedUserId` is not exported from
  `ports/fake-cloud-seed.ts`. Type `seedWith`'s argument as
  `Partial<Record<keyof Seed['lists'], SeedList[]>>`, so no new export is
  needed.
- **N4 (local, step 8):** pin the fixture of the `pageRecordFor` case. An
  own item never reaches `linked`, because `#withLinked` leaves out the
  keys that the account holds. The clash that fails on the old code is
  this: two lists link two other accounts' items of one key, and the
  other list comes first in `cloudLists.lists`. Then `recordFor` and
  `linkedRecord` return the other list's record.
- **N5 (local, verification commands):** B10.1 edits `tests/app/sweep.js`
  (two new `#/s/` rows and the `#/l/zzzz` label) but does not run it.
  Section 8 says that a batch "runs the browser suites it edits once".
  Add `node tests/app/sweep.js 360` (about 8 min), or record why CI's run
  is enough.
- **N6 (local, section 8):** the "split criterion" cell of B10.2 explains
  the B10.2 | B10.3 boundary, not B10.1 | B10.2. Name B10.1's boundary
  (the public contract change and its own review). Add "B10.1+B10.2" to
  "Merges considered and rejected" with its reason. The two share
  `seed.ts`, five unit files and `app/states`. The merge would save one
  `check:fast`, one `build:test` and one CI run, about 22 min. The gate
  totals are otherwise right (214 min plus 22 for the closeout).

## Deviations

The handoff records eight pass-2 deviations against pass 1. All are
accepted:
- five batches, with the migration last;
- P6 as PostgREST heads (accepted, subject to B1, R1-R4);
- P36 in B10.3;
- the `#/s/` port with `seed.ts`;
- the `pageRecordFor` fix;
- the name `listRetired`;
- the push-every-batch gates;
- D64 whole in B10.3.

P6 against the RPC: the rejection reasons hold, because the menu,
`listsHolding` and `relinkTargets` need every key at once. The trade-off
is stated, and the fallback is named.

## Standing checks

1. Scale: checked - B10.1's States table (`#/l/` plain, packed, empty and
   stray; a browser list's page and card; 360 and 1180); no collection or
   cap changes in B10.1. B10.4's States table is deferred to its refresh,
   and R4 adds the list page at 3x and a byte bound. B10.3's nine tabs
   already ship after the cutoff (`lib/legacy.ts`).
2. Error scenarios: checked - B10.1: a stale tab, a pending `saveList`
   from an older bundle that returns to `#/l/` (named, with a test), and
   the revert. B10.4: detail failure, offline, a deleted list and a stale
   tab are listed for the refresh; the overlap guards are missing (R2,
   R3). B10.5: the old-tab failure (owner Q1 B) and the test project
   window (R5); the app-only revert and the restore of an older backup
   are missing (B2).
3. Consistency: checked - `#/l/` draws the same not-found page as
   `#/homebrew` and `#/account` with no sign-in (the address kept,
   «На главную»); `printRetired` stays its own kind (2026-10-08); rule 4
   ("One name") ends in B10.3; the share labels left are «Ссылка для
   игроков» and «Ссылка для мастера». No unnamed departure.
4. RU/EN parity: checked - B10.1 adds no string and removes each key in
   both languages; the help paragraph 5 goes in both. B10.3's verbatim
   paragraph has the same facts in both languages, with an ASCII hyphen.

Owner rules: checked - `context.md` tags no owner rule to B10.1. The owner
decisions are at home or have a planned home:
- 2026-09-27: `docs/decisions/2026-09-27-r10-removes-browser-lists-and-the-move.md`;
- Q1 B (2026-10-01): B10.5's decision file (settled item 10);
- carries P6 and P36 (2026-10-22): placed as acceptance lines in B10.4
  and B10.3;
- R10 deletes no `localStorage` key (`STATE.md`): verified against
  `SETTINGS_KEYS` and every `storage.remove` (only `HOME_KEY` is removed;
  `dhloot.probe` goes with `works()`).

## Suggested next action

The planner applies B1, B2 and R1-R7 to plan.md sections 4, 8, 12, 13 and
14. These are text changes, and they need no redesign of B10.1. In the
same pass, the planner applies N1-N6 to section 9. The implementer then
runs B10.1 on or after 2026-10-26 (step 1's date check), with no second
plan review. B10.4 keeps its own plan review at its refresh. That review
checks R2-R4 against the refreshed brief.

## Checks still needed

- B10.1: `npm run build:test`, `node tests/run-all.js
  app/contracts,app/states`, the four golden shards with `--update` and
  `git status -- tests/app/snapshots`, `node tests/run-all.js
  contracts,dataint`, `node tests/app/sweep.js 360` (N5), `rtk npm run
  check:fast`, and CI's run of the pushed tip. This read-only review ran
  none of them.
- B10.4: the defined 3x bar (R4) and the head-size bound in `check:db`.
- B10.5: `npm run check:db` with the reversibility walk and the R6
  assertions; the `gh run list` check (R5) right before the push.
