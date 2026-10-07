# Review - plan before B9.1 (persist-9-item-share)

Verdict: fix-then-continue
Reviewed: ac23ce36c636cc57f69b1d529af7bb17744cee2c
Scope: plan before B9.1

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

Reviewed content: ac23ce36 + uncommitted issues/persist-9-item-share/ (the
working-tree `context.md`, `plan.md`, `handoff.md` and mocks m37-m39 of
2026-10-07). The head line holds the full sha because `parseReviewHead`
reads hex only.

Read: `CLAUDE.md`; R9 `context.md`, `plan.md`, `handoff.md`, `mocks/m37`,
`m38`, `m39`; the 2026-10-02 plan (`git show
ac23ce36:issues/persist-9-item-share/plan.md`); R7h `plan.md` 2.8, 4.1,
4.4, 5, 6, 8, 10 (working tree); `docs/specs/ROUTES.md` "Records, lists and
print", `CONTRACTS.md` section 1, `FEATURES.md` "Consistency rules",
`STATE.md`, `DEBT.md` D65, D70, D71; `llms.txt`; `tests/contracts.js`;
`tests/app/contracts.js`; `docs/fixtures/urls/routes.json`;
`app/src/lib/hash.ts`, `hash.test.ts`, `state/app.svelte.ts`,
`state/sharedView.svelte.ts`, `cloudLists.svelte.ts`, `homebrew.svelte.ts`,
`components/PrintPage.svelte`, `SharedListPage.svelte`, `LoadState.svelte`,
`ports/types.ts` (`PagePort`), `ports/fake-cloud-seed.ts`,
`tests/app/inventory.js`, `lib/data.ts` (`setOf`, `setBonusOf`),
`lib/dict.ts` (the reused keys).

## Blockers

- **plan-B9.1-1 (blocker, local) - the print page would join the share's
  Realtime topic, against "a sheet is read once".** 3.4 says `printShare`
  "opens `app.sharedView` for the token as `SharedListPage` does". In the
  tree, `SharedView.open()` reaches `#ready()`, which calls
  `this.#feed?.watch('share:' + topic_key)`; every message and the feed's
  5-minute safety refetch then call `refresh()`, and a revoke turns the view
  `gone`. So the sheet follows live edits and swaps to the gone page while
  it is open. This contradicts 3.4 "No live re-read", 5 (conflict row: "the
  sheet stays as it was read"), 7.2 "Do not: give the print page a live
  topic or a poll" and 9 "Decided here". Change (recommended): 3.4 and 7.2
  step 4 - `SharedView.open(token, userId, { watch: false })`; `#ready`
  skips `#feed.watch` when `watch` is false; an `open` of the same token
  with `watch` true starts the feed (so a return to `#/s/` is live again).
  Add a unit case: a revoke and an owner edit while `#/print/s/` is open
  change nothing on the sheet. Apply the same rule to R7h's item view for
  `#/print/h/` (no shown-again re-read on a print route), and add it to
  step 1's checks. Alternative: accept the live sheet and rewrite 3.4, 5,
  7.2 "Do not" and 9; trade-off: a sheet can change under the print dialog's
  measurement.
- **plan-B9.1-2 (blocker, local) - `tests/contracts.js` is conditional in
  the contract set.** 7.2 "Files to edit" says "`tests/contracts.js` (only
  if it lists route kinds)". It lists no route kinds, so the implementer
  skips it; but it pins every public route by name in `llms.txt`,
  `CONTRACTS.md` and `ROUTES.md` (`#/s/<token>`, `#/homebrew`,
  `#/tables/homebrew`). `CLAUDE.md` requires `tests/contracts.js` in the
  same commit as a contract change. Change: 7.2 files and step 9 - "add to
  `tests/contracts.js` a check that `llms.txt`, `CONTRACTS.md` and
  `ROUTES.md` each name `#/print/s/<token>` and `#/print/h/<uuid>`";
  acceptance line "The route contract of 3.1" names it.

## Risks

- **plan-B9.1-3 (risk, local) - the view hand-over between pages has no
  remedy, and a print-to-print navigation keeps the component.** 10 names
  the `close()`/`open()` order and step 4 "proves the order", but the plan
  says nothing about the fix when the order is open-then-close (the view
  ends `idle` and the sheet waits for ever). Also, 3.4 mounts `PrintPage`
  for all three kinds, so `#/print/s/A/x` to `#/print/x` (Back, Forward)
  keeps the component and `onDestroy` never closes the view. Change: 3.4 -
  the effect returns a cleanup that closes the view when the route kind or
  the token changes, and reads `view.token` so a view closed by the old
  page is opened again; the same for the item view. Step 4 tests both
  orders and the print-to-print case.
- **plan-B9.1-4 (risk, local) - 3.0 and step 1 do not check every R7h
  assumption the design needs.** Missing: (a) the item view's retry - 3.4
  calls `view.retry()` for `printItem`, but 3.0 lists `open`, `refresh`,
  `close` only; (b) `recordFor` must find a linked foreign item of an
  account list on any route - R7h 2.8.2 says "a per-view index (the open
  `#/h/` page, the list's linked items)", and if that index lives only on
  the list page, 3.5's wait and `ListPage`'s own-list print never resolve
  the key (D70's defect for own lists); (c) the `#/h/` uuid read rule that
  3.1 reuses; (d) the item view's status after a re-read finds no item
  (3.6's announcement); (e) whether R7h's "no «Печать» on another account's
  item" also removes it from an own-list row card. Change: 3.0 lists (a)-(e);
  step 1 stops and reports if (b) is false, and records (c)-(e).
- **plan-B9.1-5 (risk, deferred-scope to R7h B7h.4, local to R9's 2.3) -
  two «Сохранить себе» details of 2026-10-02 are not in the 2.3 inventory.**
  Old 3.6: the relink of the reader's own row keeps "the same position with
  the same quantity, price and both notes"; and a non-limit refusal says
  `importRefused`'s text. R7h B7h.4 says only "the row is relinked to the
  copy" and names network and limit refusals. A relink built as remove plus
  add loses the GM's price and notes. Change: 2.3 gains rows (f) "the
  relinked row keeps position, quantity, price and both notes" and (g) "a
  refusal says `importRefused`"; Q9-9's list and 7.2's Q9-9 acceptance line
  name (f) and (g); the Status refresh line checks them in B7h.4.
- **plan-B9.1-6 (risk, local) - the "Do not" on «Печать» contradicts 3.3.**
  7.2 "Do not: draw «Печать» for another account's item with
  `#/print/<ids>`". 3.3's last branch writes `printHash` for every other
  route, so a linked foreign item's row card on the reader's own list
  (`#/lists/<id>`) and `ListPage`'s own-list print both write
  `#/print/<key>` (3.3 says so for `ListPage`). m39 (c) draws that row card
  with no «Печать». Change: 3.3 states what a linked foreign row card on an
  own list writes (recommended: `printItemHash(hid)`, which survives a
  hand-over; or `printHash`, which resolves after the account read), and
  the "Do not" line names only `#/s/` and `#/h/`.
- **plan-B9.1-7 (risk, local; only with Q9-7 B) - the 45 s re-read needs a
  port that does not exist and sits after the signed-in return.** 3.6 says
  "while the route is `item` and the document is visible". `PagePort` has
  `onHidden` and `guardUnload` only; there is no "visible now" getter.
  `#pollLists` returns at `if (!lists || !this.user)`, so a call placed
  after it skips signed-out readers. Change: 3.6 - put the call beside
  `#refreshShared` (before the user check); either add
  `PagePort.visible()` with its adapter, fake and port test (and name the
  port change, which 7.2 "Do not" now forbids), or drop "while visible" as
  `#refreshShared` has no such check. Add `STATE.md` (the re-read cadence
  paragraph and the `sharedView` row, which the print page now also opens)
  to 7.2's files and 8.

## Nits

- **plan-B9.1-8 (nit, local) - the author on `#/h/` gets an address that
  cannot be handed on.** 3.3 branch 2 applies only when `!mine`, so the
  author's «Печать» on `#/h/` writes `#/print/<key>`, while the owner on
  `#/s/` gets `#/print/s/` "so the address works when it is handed on".
  Change: drop `!mine` (the author prints `#/print/h/<uuid>` too), or name
  the reason in 3.3 and 6.
- **plan-B9.1-9 (nit, local) - rule 6 departure not named.** 3.4 gives the
  failed print page a primary «Повторить» (`page`). Rule 6 makes it primary
  only where the title says the failure; the tree uses `page` only on
  `ListPage` under `sharedFailed`, and `#/homebrew` (a fixed heading) uses
  the small one. Change: use the small retry, or name the departure in 6.
- **plan-B9.1-10 (nit, local) - `printShare`'s set line reads the base
  index.** `PrintPage.setLine` reads `app.index`; a foreign set item on
  `#/print/s/` then names no members, while `#/s/` draws them through
  `withRecords(base, [], snapshotRecords(view.shared))` and `#/print/h/`
  reads the per-view index (3.4). Change: 3.4 names that index for
  `printShare`'s set line.
- **plan-B9.1-11 (nit, local) - parse edges not named.** `#/print/s/<token>`
  with no `/` and no selection; a stray character between the token and
  `/`; `#/print/s` and `#/print/h` with no slash, which match today's
  `^print\/[\w*-]+$` as the id `s` or `h` («Печатать нечего»). Change: 3.2
  gives the two patterns; step 9 adds a `#/print/s/<token>` fixture; 3.2's
  "cannot match them" names the no-slash case.
- **plan-B9.1-12 (nit, local) - two `ROUTES.md` paragraphs go stale.**
  "`#/print/...` reads its ids from the address rather than from memory"
  and "Only the list page's print button and the shared page's selection bar
  ... write counts". Change: step 9 updates both (a `#/print/s/` address
  resolves its ids through the link; the selection bar writes counts in
  either form).
- **plan-B9.1-13 (nit, local) - `printItemGone` states a false fact.**
  «ссылка устарела» / "the link is out of date" implies expiry; under W1-a
  an id works for as long as the item exists. Change: «Предмет не найден:
  автор удалил его, или в адресе ошибка.» / "Item not found: the author
  deleted it, or the address is wrong.".
- **plan-B9.1-14 (nit, local) - `#/print/h/` in a build with no sign-in.**
  3.1 and 3.4 name this build for `#/print/s/` only. Change: name the
  not-found print page for `#/print/h/` there too, with a unit case.
- **plan-B9.1-15 (nit, local) - «Назад» and «Списки» on a handed-over
  address.** With no history, `back()` goes to `#/lists`, and the empty
  state offers «Списки»: a signed-out reader of `#/print/s/` or
  `#/print/h/` lands on a page about own lists. Change: on the two new
  kinds the fallback is `#/s/<token>` or `#/h/<uuid>`, or name the
  difference.
- **plan-B9.1-16 (nit, local) - handoff gaps.** Verification gives the
  prettier command but "result in the planner's report" (the result is not
  recorded); Completed "Review" has no report path. Change: record the
  result and `issues/persist-9-item-share/reviews/plan-B9.1.md`.
- **plan-B9.1-17 (nit, deferred-scope) - a deferred item of 2026-10-02 was
  dropped.** "A `#/print/<ids>` address handed to another GM drops own items
  silently; a print note would say so" is not in section 10. With
  `unknownHb` computed anyway, the note is cheap. Change: carry it to 10
  Deferred (named to the owner).
- **plan-B9.1-18 (nit, deferred-scope to R7h) - the entry limit.**
  `context.md` records that `entries_per_list` is 100
  (`20260925130000_limits.sql`) and R7h 5.2 says 200. Change: the
  orchestrator corrects R7h 5.2 at B7h.4's refresh.

## Deviations

- The 2026-10-02 B9.1 (schema) and B9.2 (screens) became one screen-only
  B9.1, because R7h W1 builds the item address, the read by id, the add and
  «Сохранить себе». Accepted: no migration remains with the recommended
  answers, and the split criterion of 7.1 is stated.
- Feature inventory against the 2026-10-02 plan: every user-visible feature
  is delivered by R7h (2.1), kept in R9 (2.2) or put to the owner (2.3,
  Q9-6 to Q9-9), except old 3.6's relink details and `importRefused`
  (plan-B9.1-5) and the deferred print note (plan-B9.1-17). The window
  title, the signed-out add-to-list prompt and the copied `#/h/` address are
  R7h's "record page's shape" and 4.4; accepted.

## Standing checks

1. Scale: checked - section 4 against `PRINT_MAX` 180 (181 refused with the
   note), `entries_per_list` 100 (verified in the migration) and 300 at 3x,
   the 6 kB address, 360 px and 1180 px rows, the `#/h/` pick row wrap. No
   popup or text field; no sticky region grows. No finding beyond
   plan-B9.1-10 (members on a set card).
2. Error scenarios: checked - section 5; B9.1 writes nothing. The live feed
   makes the "conflict" and "link deleted" rows false for `#/print/s/`
   (plan-B9.1-1); the page hand-over can leave a view closed
   (plan-B9.1-3). The stale-tab rows hold (`print/s/...` fails today's
   pattern and falls home). No data loss in R9; plan-B9.1-5 names a
   possible loss in R7h's relink.
3. Consistency: checked - section 6 against rules 2, 4, 6, 7, 14, 16 and the
   `#/s/` and `#/homebrew` siblings. Unnamed departures: the primary retry
   (plan-B9.1-9), the author's print address (plan-B9.1-8), the back target
   (plan-B9.1-15).
4. RU/EN parity: checked - 3.8 against `dict.ts` (`shareGone`,
   `shareGoneSub`, `listUpdated`, `notFound`, `signInToSave`): both
   languages, the same facts, ASCII punctuation, «ёлочки» and straight
   quotes; no new plural. One false fact (plan-B9.1-13).

## Owner questions Q9-6 to Q9-10 against this review

| Question | Another answer | Effect on findings and verdict |
|---|---|---|
| Q9-6 | B or C | adds a schema batch and a "not available" state on `#/print/h/` and list rows; the plan's Fallback sends it to the planner. No finding changes; the B9.1 verdict holds after the planner adds the batch |
| Q9-7 | A | plan-B9.1-7 is void. C: a migration; replan of the batch table; plan-B9.1-1 still holds |
| Q9-8 | B | a migration and a schema batch; no finding changes |
| Q9-9 | B | (a)-(e) and plan-B9.1-5's (f), (g) land in B9.1's acceptance; the `#/h/` goldens re-seed twice. C: plan-B9.1-5 stays as an R7h relink question. Verdict unchanged |
| Q9-10 | B | the two routes go; plan-B9.1-1, -3, -8, -10, -11, -12, -14, -15 lose their subject, plan-B9.1-2 moves to the new id form; a grant to `anon` and a schema batch follow. Verdict becomes replan |

## Suggested next action

The planner applies plan-B9.1-1 to -16 to `plan.md` (3.0, 3.1-3.6, 4, 5, 6,
7.2, 8, 10, 2.3) and `handoff.md` in one pass, and names -17 and -18 to the
orchestrator. Then the owner answers Q9-6 to Q9-10. With the recommended
answers, B9.1 is implement-ready after R7h's closeout and step 1's refresh;
no second plan review.

## Checks still needed

- None for a plan review. At B9.1: step 1's R7h checks (plan-B9.1-4), then
  the gates of 7.2 step 12 (`npm run check`, `build:test`, `check:built`,
  `app/states`, `app/contracts`, `app/print`, the golden re-seed and four
  compare shards, `sweep.js 360`). This reviewer ran no check: an
  implementer runs heavy checks in this tree.
