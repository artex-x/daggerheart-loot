# Review - plan before B1 (71)

Verdict: fix-then-continue
Reviewed: d997f4f0cd676624157b7f009257dbf703f5ef5b
Scope: plan before B1

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

Read: `CLAUDE.md`, `issues/71/{context,plan,handoff}.md`, `issues/71/mocks/frame.html`,
the decision file, `ROUTES.md` (Tables, Filter grammar, Records), `CONTRACTS.md`
section 1, `STATE.md` (Filters, `fSeg`), `FEATURES.md` "Consistency rules",
`llms.txt` "URL grammar", `docs/fixtures/urls/routes.json`, `tests/contracts.js`,
`tests/app/contracts.js`, `tests/app/typo.js`, `tests/app/states.js` (share cases),
`app/src/lib/{hash,filters,facets,data,label,pending}.ts`, `hash.test.ts`,
`ports/redirect.ts`, `ports/fake-cloud-seed.ts`, `FilterBar.svelte`,
`TablesPage.svelte`, `SharedListPage.svelte`, `App.svelte`, `AppState`
(`replace`, `copied`, `linkTo`, `keepTicksIn`, `#runPending`),
`issues/70/plan.md` sections 8-9 (read only).

Verified facts: the current `parseHash` reads `#/s/<token>/f_...` as the token
alone (the leading `[A-Za-z0-9_-]` run), so an older build draws the whole list;
`#/l/` is untouched; `en/index.html` keeps the hash (`location.replace('../' +
location.hash)`); `dhloot.auth.return` accepts any `#/` hash under 16384
characters; `App.svelte` passes `token={app.route.token}`, so a `replace` does not
re-run the `open` effect. From `data.js`: the seed list holds 3 items, 1
consumable, 5 weapons (q1, q23, q35 tier 1; w51, the axe tier 2), 1 armour (tier
1); `f_kind-weapon.tier-1` draws 3 rows, `veryfar` is absent, `«Броня» + «2»` draws
0. The Groups table matches every source in the catalog (`community` included).

## Blockers

1. **The contract check and the spec text do not match (steps 10 and 14).**
   Step 10 asserts that `llms.txt`, `CONTRACTS.md` and `ROUTES.md` each contain
   the literal `#/s/<token>/f_`. Step 14 writes the `ROUTES.md` row as
   `#/s/<token>[/f_<filter>]`, which does not contain that literal, and gives no
   exact text for `CONTRACTS.md` or `llms.txt`. The gate fails, or the
   implementer edits a public-contract check or doc on his own. Change: in step
   14, write the literal `#/s/<token>/f_<filter>` in each of the three files -
   in `ROUTES.md` as a code block under "Records, lists and print" (the same
   shape as the Tables block: `#/s/<token>` and `#/s/<token>/f_<filter>`), in
   the `CONTRACTS.md` section 1 bullet, and in the `llms.txt` `#/s/<token>`
   bullet. Keep step 10's check on that literal.

2. **The `#/l/` filter is a new state with no inventory entry.** `CLAUDE.md`,
   "Task and session protocol": "A new state gets a `tests/app/inventory.js`
   entry and a re-seeded golden". Every `#/l/` state in the inventory has 2 or 3
   entries, so no golden ever draws the `#/l/` block (the `.legacy` line above it
   and no copy-link button). The plan proves it only with component test 17.
   Change: in step 12, add `#/l/ ~ filtered`: a payload of 8 catalog entries
   (built the way the inventory builds `#/l/ ~ own list`), «Оружие» picked:
   the strip, the pills, no copy-link button, the address unchanged. Add it to
   the States table. (If the owner prefers to drop the filter on `#/l/` - it
   lives until 2026-10-26 - that is a scope change for the owner, not a review
   fix.)

## Risks

1. **The GM toast will understate the leak after TASK 70.** The plan says
   `gmFilterLinkCopied` follows `gmShareCopied` if TASK 70 rewords it. TASK 70
   does not reword `gmShareCopied` (it rewords only the share panel's text, its
   plan lines 117-118), so the condition never fires. After both tasks land, a
   GM link also shows GM-only entries, and both toasts say only "it carries the
   GM notes". Change in "The address" and step 6: word the new toast so that it
   holds in either order, for example «Ссылка на фильтры скопирована - это
   ссылка для мастера: в ней видно то, что скрыто от игроков» / "Filter link
   copied - it is the GM's link: it shows what players do not see". In
   "Compatibility with TASK 70", state that the task that lands second makes
   `gmShareCopied` use the same facts. The orchestrator also tells TASK 70: its
   plan, section 9, still says that TASK 71's filter is page memory.

2. **The block can disappear under the focus on a list below 8 entries.**
   `finding` is true below 8 only while a query or a value in force is set. A
   filter link to a 5-entry list draws the block. When the reader drops the last
   pill, presses «Сбросить всё», or deletes the last character of the query, the
   block, and the focused control in it, is removed. A re-read that shrinks a
   list from 8 to 7 has the same effect. Change in step 8: latch `finding`. When
   it is true once for a `shownFor`, it stays true until another list opens
   (reset it in the `shownFor` effect). Add the case to component test 11.

3. **The seed change breaks the statement "gm3 holds no list".** Step 11 adds a
   list to gm3. `fake-cloud.test.ts` asserts `SEED.lists.gm3` is empty (the
   `[books, cards, SEED.lists.gm3]` line), and the seed header comment says
   "`gm3` holds no list". Change in step 11: name both edits. Give the new ids
   (the entry ids, for example `uuid(3101)`-`uuid(3108)`, the share id and
   its `topicKey`), so the uniqueness test in `fake-cloud.test.ts` stays
   meaningful. Name the `as gm3` goldens (`#/i/ci1`, `#/i/q1`, `#/i/voa4_t3d`,
   `#/search ~ relations`) as states to compare. A frozen copy is never drawn in
   search (`AppState.frozenCopy`), so they are expected unchanged.

4. **Fixture completeness.** (a) The reachable bad link is a chat client's
   trailing full stop. `routes.json` already has `#/l/ABC.` and
   `#/s/<token>.` for it, but the plan adds no fixture for a stray character
   after the segment. Add
   `#/s/player-token-1/f_kind-weapon.`: rows 5, picked `["kind:weapon"]`, the
   address kept. (b) The tables have "filter group names select something"
   (`tests/app/contracts.js`), the guard that was added after `rg` and `bu`.
   The new fixtures replay only `kind` and `tier`. Add a share probe loop next
   to it over `#/s/player-token-1/f_` + `src-hnf`, `cls-mag`,
   `trait-presence`, `range-far`, `burden-2` and `line-uniq` (each one is a
   value that the seed list holds, checked against `data.js`). Each must
   draw `0 < rows < 10`. This costs one context and about seven opens.

## Nits

1. `local` - Scale. The States table says "panel rows bounded by the
   vocabulary", and the 360 px note says the open panel is "about one screen
   tall". The `src` row is bounded by the entries, not by the catalog: own
   sources (20 per owner, 60 at 3x) plus one source per frozen copy. At the
   limit the open panel can be several screens tall. It is in page flow, below
   «Сохранить себе», so nothing breaks. State the worst case and accept it.
   Also add the state "8 or more entries and no row can narrow" (one source and
   one kind). `FilterBar` then draws nothing (`{#if rows.length}`), and only the
   search box shows. Proof: a unit test of `listFacetRows` and component test
   11.
2. `local` - Error scenarios table: add "Clipboard write fails: «copyFailed»
   toast (`app.copied`), the address unchanged, nothing stored".
3. `local` - Step 8, `copyFilterLink`: read `view?.shared?.audience` at the
   press, outside the `Msg` callback. The callback runs when the toast draws,
   and a re-read or a list change can come between.
4. `local` - Step 7, `.fpill`: the pill has `padding: 0 8px 0 11px`, so a
   wrapped two-line pill puts its text against the border. Use `padding: 6px
   8px 6px 11px`. With `min-height: 32px`, a one-line pill stays 32 px tall.
   Confirm this with the table golden compare that B1 already runs.
5. `local` - Verification: replace the separate `app/contracts` and
   `app/states` calls with the pooled run `node tests/run-all.js
   app/print,app/contracts,app/states,app/typo,app/hues,stub` (`CLAUDE.md`,
   "Quality gates"). `app/typo` opens the `eq_weapon` filter panel that the
   pill change touches. The README gives the pooled run as about 260-290 s,
   which is not more than the two calls (350-415 s and about 250 s) the plan
   lists. The other two sweep widths remain for CI. Write that in the plan.
6. `local` - The departure, in `ROUTES.md` and `FEATURES.md`: say also that
   a value the address keeps but no entry answers applies again if an entry
   that answers it comes back before the next change of the filter. Say that
   the copied link holds only the values in force, so it can differ from the
   address bar.
7. `local` - The decision file: add the rejected alternative "no copy-link
   button on a GM link". Give the reason: the address bar already holds the GM
   token, and the toast warns as «Скопировать» in the share panel does.
8. `local` - Step 4, `label.ts`: the comment in `srcName` says "Anything not
   one of the five books above". It names six books now, and seven with
   `community`. Fix the comment in the same edit.

## Deviations

The handoff records none. None found: the plan stays inside the owner's
settled answers (filter in the address, threshold 8, no filter on
`#/lists/<id>`).

## Standing checks

1. Scale: checked - the States table against `entries_per_list` 100/300,
   `BOOK_NAME_MAX` 80, the 120-code-point name and the 16384-character
   return hash. The longest segment at 3x fits. The `src` row's worst case and
   the "no row can narrow" state are missing (nit 1). The only sticky region is
   the selection bar, and it does not change.
2. Error scenarios: checked - loading, failed read, offline, conflict
   (re-read), deleted record, deleted share, stale tab, revert, sign-in return,
   players' link naming a GM-only value. The filter stores nothing beyond the
   address, so no loss. The clipboard-failure row is missing (nit 2). The block
   disappears under the focus after a shrink (risk 2).
3. Consistency: checked - `TablesPage` (strip, `seenSeg`, `replace`, reset,
   no-match, copy-link and toast), `ListsPage` and `AddToList` (`LIST_SEARCH_AT`),
   `SharePanel` (`gmShareCopied`), FEATURES rules 9, 14, 16. The one departure
   (a value no drawn entry answers is ignored) is named, with its reason, in
   `ROUTES.md` and `FEATURES.md`. Its full effect is not yet written (nit 6).
   The `kind` values `weapon`/`secondary`/`armor` against the tables' `equip`
   are named.
4. RU/EN parity: checked - one new string, `gmFilterLinkCopied`, in both
   languages with the same facts and ASCII ` - `. All reused keys exist in both
   dictionaries (`fItems`, `fCons`, `subWeapon`, `subSecondary`, `subArmor`,
   `kindF`, `srcComm`, `srcHomebrew`, `voaArtifact`, `eqLineF`, `filters`,
   `anyValue`, `outOf`, `resetAll`, `dropValue`, `filterLink`,
   `filterLinkCopied`, `nothing`, `searchPh`). No plural. The wording of the
   new string changes with risk 1.

Contract same-commit set: `routes.json`, `tests/contracts.js`, `CONTRACTS.md`
and `llms.txt` are all in B1 (blocker 1 fixes the text they must agree on).
Backward compatibility holds: an older build reads the token and draws the
whole list, and `#/l/` parsing does not change. One batch is justified: the
replay of the new route fixtures needs the page, the split criterion is named,
and the gate cost is stated.

## Suggested next action

The planner applies blockers 1-2 and risks 1-4 to `issues/71/plan.md`. Because
the verdict is fix-then-continue, the local nits 1-8 go in the same pass. Then
the implementer starts B1 with no second review. The orchestrator tells TASK 70
that its plan, section 9, describes TASK 71's filter as page memory and that the
GM toasts need the same facts (risk 1).

## Checks still needed

- A reviewer cannot run browser gates. B1's batch review reads the recorded
  results of `app/contracts` (the new fixtures and the share probe), the
  re-seeded `#/s/*` goldens, the four compare shards (table goldens unchanged
  after the pill change) and `sweep.js 360` and `1180`.
- Confirm in B1 that `tests/app/contracts.js` waits for the share read before
  it reads `rows` on the `player-token-1` fixtures.
