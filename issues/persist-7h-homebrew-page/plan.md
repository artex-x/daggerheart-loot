# Plan - TASK persist-7h-homebrew-page (homebrew release R7h)

## Status

- Task status: planned 2026-10-02 (planner); not started. Starts after R7d
  `persist-7d-homebrew-files` closes; before R9 (owner, 2026-10-02).
- NEEDS_HUMAN_CONFIRMATION: no (the owner answered section 7.4 on 2026-10-03; next: a planner pass).
- Scope widened (owner, 2026-10-03): the homebrew rework W1-W5 (section 7)
  joins R7h. The planner re-plans the release and decides the batches;
  `B7h.1` below is no longer implement-ready until that pass.
- Plan review: not required (no trigger fired) - for `B7h.1` as designed;
  the planner re-declares it for the widened release (W1 likely touches
  RLS, stored snapshots and public contracts).
  - No migration or SECURITY DEFINER function, no public contract change
    (no route, link, file format or generated data), no stored data or
    `localStorage` key touched (the switch and the search stay memory
    only), no new write or sync protocol.
- Batch review: recommended for `B7h.1` (a new control, two amendments of
  `FEATURES.md` "Consistency rules"); the orchestrator decides.
- Refresh before dispatch: R7d's `B7d.2` changes `HomebrewPage.svelte` (the
  import toggle, «Переместить (N)», «Скачать JSON (N)», the import states)
  and re-seeds every `#/homebrew` golden. Check the file list, the golden
  list and the strip's actions against the tree after R7d's closeout; the
  design does not depend on them.
- Origin: the owner split these page fixes from R7d's `B7d.2` on
  2026-10-02 (R7d plan, Status). Items 1-5 come from R7d's plan (its old
  4.15, 4.16, B11, B19-B22); item 6 is new.
- Batches:

| Release | Task id | Batch | Status |
|---|---|---|---|
| R7h | `persist-7h-homebrew-page` | `B7h.1` the field help, the `#/homebrew` search and counter, the 300-item measurement, the «Карты» search, the «Свои предметы» switch | implement-ready after R7d's closeout (refresh the file and golden lists) |

## 1. Objective

Make the homebrew pages read as the owner expects: no help on game terms,
search and a counter where the rows are, a measured page at 3x, and an
own-items filter that no longer reads as a fourth kind. Owner requests of
2026-10-02 (`context.md`, "Decisions already settled").

Non-goals: anything of R7d's import, export, move or zip; a search on
`#/tables/homebrew` (it has the tables toolbar's search already); paging
unless the measurement asks for it; a stored or linked switch state.

## 2. Design

### 2.1 Field help (owner, 2026-10-02)

- Remove the «?» of «Ранг» (both kinds: `hb-tier-help`, `hb-eqtier-help`)
  and of «Урон» (`hb-dmg-help`) in `HomebrewEditor.svelte`, the keys
  `hbTierHelp` and `hbDmgHelp` in RU and EN, their rows in
  `homebrewEditor.test.ts` (`a11y.test.ts` holds none), and the `why` of
  the state `#/homebrew/<axe> as gm1` in `tests/app/inventory.js` (it names
  «Урон» with its «?»). 16 editor goldens draw the two buttons and are
  re-seeded.
- Amend rule 15(c) of `FEATURES.md` "Consistency rules": "A «?» explains
  what the site does with the field or a constraint of the site, never a
  basic game term: a player knows the Daggerheart rules (owner,
  2026-10-02)." `FEATURES.md` "Homebrew" (the editor paragraph) drops
  «Ранг» and «Урон» from the fields that carry a «?» and the hint texts
  it quotes for them.
- The other «?» hints pass the principle: «Источник», «Второй набор
  характеристик», «Улучшается до», «Получается из» and «Карты правил» say
  what the site does; «Линия улучшений» and «Комплект» open with one
  defining sentence, then explain the site's ladder and set card. `PageHead`
  page help and the money help are not form fields, outside rule 15.
- The tier law ("never infer equipment tier from stats") binds the code,
  which obeys it: an equipment tier is required with no default, loot
  defaults to «Без ранга», the card draws no stat block until a tier is
  chosen. Nothing on screen repeats it; `llms.txt` tells AI converters (R7d,
  shipped).

### 2.2 The `#/homebrew` search (owner answer 1)

- From the eighth own item the rows get a `SearchBox`. The threshold is
  `LIST_SEARCH_AT` (8) from `lib/lists.ts`, reused; its comment widens to
  "the count from which a collection draws a search box (the lists index,
  the add-to-list menu, the own items and the own cards)". The placeholder
  names the box (rule 15's departure for search boxes): `hbFindOwn`.
- The match is a new pure `matchRecords(records, query)` in
  `lib/homebrew.ts`: the query folded as search folds it (`foldQuery`, the
  rule of `matchLists`), kept when either language of the name holds it; a
  blank query keeps every item. The query is page memory (empty on a
  return), as `#/lists`'s.
- `groupsOf` runs over the matched records, so a source or section heading
  with no match is not drawn. No match draws `<Empty>{t.nothing}</Empty>`
  («Ничего не найдено» / "Nothing found") in place of the strip and the
  groups. «Выбрать все», the strip's count and every bulk action
  («Переместить (N)», «Скачать JSON (N)», «Удалить (N)») act on the drawn
  rows only. The ticks stay a subset of the drawn rows, as on `#/lists`: an
  effect removes from `app.sel` each own key the query hides; an id that is
  not an own key stays (a catalog tick made elsewhere is kept).

### 2.3 The counter at the head of the rows (owner answer 2)

- «N предметов из M» moves from above the folds to the line right above the
  strip, as `#/lists` draws «3 списка из 50» above its strip. It counts every
  own item, not the matches; with no items it still shows «0 предметов из
  100» (rule 1) above «Своих предметов пока нет...».
- The page order: the lead, «Источники», «Карты», «Новый предмет» and
  «Импорт предметов», then the rows' head (the search box from 8, the
  counter, the strip), then the groups (m01).
- Rule 1 of "Consistency rules" gains: "A counter sits at the head of the
  collection it counts: above its strip, or in its fold's summary."

### 2.4 The measured scale (owner answer 3)

- Measure `#/homebrew` at 300 own items (the 3x target) in the built test
  app in Chrome, unthrottled, on this host: (a) the route's navigation to
  the rows drawn, (b) one keystroke in the search box to the repaint; each
  the median of three runs, in a timed case of `tests/app/states.js`. The
  account: a test-build option of the fake that adds 300 generated items to
  gm1 (passed as `installFakeCloud`'s options are, the way `?as=` picks a
  user); the implementer names it.
- Thresholds: (a) at most 500 ms, (b) at most 100 ms. Both under: no paging;
  the figures go into this plan and the handoff. Either over: the rows get
  the lists index's fold - the first 100 rows (a new constant beside
  `LIST_PAGE`), then «Показать ещё» (the existing key and behaviour) adding
  100 each press, the ticks a subset of the drawn rows - and the case runs
  again; the handoff names the figures before and after. Folded sections
  are rejected as the fallback: they hide rows a search found.

### 2.5 The «Карты» search (owner answer 4)

- The fold «Карты» draws the same `SearchBox` from the eighth card
  (`LIST_SEARCH_AT`), above «Комплекты», placeholder `hbFindCards`; the
  match is `cardMatches` (`lib/homebrewForm.ts`, the picker's rule: name or
  subtitle, either language, the folded query). Each group filters its
  cards; a group with cards and no match draws `t.nothing` under its create
  button; the summary keeps counting every card. An open card form whose
  card the query hides stays open (rule 11: the form is the person's work).
- `DEBT.md` D84 loses its line "`HomebrewCards.svelte` lists up to 100 cards
  per fold with no search"; D84 keeps its other lines.

### 2.6 The «Свои предметы» switch (owner answer 5; mock m01)

- Today the «Хоумбрю» chip sits last in `#/search`'s kind row and after the
  view switch in the equipment tables' toolbar. In the kind row it reads as
  a fourth kind: with it on, unpressing the last kind is refused with
  «Нужен хотя бы один тип», which reads as a bug.
- A new `components/Switch.svelte` (two real uses in this batch: search and
  the tables): `<label class="switch"><input type="checkbox" role="switch"
  checked={on} onchange={...} /><span class="track" aria-hidden="true">
  </span>{label}</label>`. The input is the control (native Space toggles,
  `role="switch"` announces on/off); it sits invisibly over the track, and
  `:focus-visible` draws the gold ring on the track. Track 34 x 20 px,
  radius 999px; off: `--surface` fill, `--line2` border, knob `--muted`; on:
  `--gold` fill and border, knob `--ink-on-gold`; knob 14 px. Label 13.5 px
  `--txt`, gap 8 px, the whole label at least 32 px high (target size).
  The knob's move is a 0.15 s transition, none under `prefers-reduced-motion`.
  Colours come from `tokens.css`; no new token.
- `#/search`: the kind `ChipRow` holds only the three kinds; the switch sits
  in its own row under it, inside the same panel (m01). The tables: the
  switch replaces the chip at the end of the toolbar. Both are drawn only
  while the account holds an own item (as today), on by default, the state
  `app.homebrewShown` (memory only, kept across pages, on again at each
  sign-in; `STATE.md` unchanged except the name). `hbChipHint` (the hover
  title) goes: the label says what the control does (rule 15(a): no help
  only in a hover title). The tables' comment about telling the chip from
  the group chip goes with it.
- Label `ownSwitch`: «Свои предметы» / "My items" (the owner's words; «свой»
  as in «Свой предмет»).

## 3. Batch `B7h.1` - the homebrew page fixes (implement-ready)

Objective: 2.1-2.6 in one batch.

Split criterion: none. The six items share `HomebrewPage.svelte`, the gm1
and gm3 goldens and one re-seed; a split at the route set (`#/homebrew` |
`#/search`, `#/tables`) would pay a second `check`, re-seed and sweep (about
35 minutes) for two small components.

Files to create: `app/src/components/Switch.svelte`,
`app/src/components/switch.test.ts` (or rows in `a11y.test.ts`), two
decision files (section 5), `docs/DECISIONS.md` rebuilt by
`node tools/decisions.js`.

Files to edit: `HomebrewEditor.svelte`, `HomebrewPage.svelte`,
`HomebrewCards.svelte`, `SearchPage.svelte`, `TablesPage.svelte`,
`lib/homebrew.ts` (`matchRecords`), `lib/lists.ts` (the comment),
`lib/dict.ts`, `ports/fake-cloud.ts` and its test (the 300-item test-build
option), the tests (`homebrewEditor.test.ts`, `homebrewPage.test.ts`,
`homebrew.test.ts`, `components/tables.test.ts`, the search page's test,
`a11y.test.ts`), `tests/app/inventory.js` (new entries and `why` texts),
`tests/app/states.js` (the timed case), `tests/app/contracts.js` (its gm1
filter probes, if they press the chip), the goldens, `docs/specs/FEATURES.md`
("The «Хоумбрю» chip" becomes "The «Свои предметы» switch"; "Homebrew";
"Consistency rules" 1 and 15), `docs/specs/STATE.md` (the Filters row),
`docs/specs/COVERAGE.md`, `docs/specs/DEBT.md` (the D84 line).

Ordered steps:

1. 2.1: the editor, the dict keys, the tests, the inventory `why`; rule 15
   and the editor paragraph of `FEATURES.md`.
2. 2.6: `Switch.svelte` with its test and axe (on, off, focus); the search
   page and the tables toolbar; `hbChipHint` removed, `ownSwitch` added;
   `FEATURES.md` and `STATE.md` renamed.
3. 2.2 and 2.3: `matchRecords` with its tests; `HomebrewPage.svelte` (the
   rows' head, the query, the drawn rows, the ticks effect); rule 1.
4. 2.5: `HomebrewCards.svelte`; the D84 line.
5. 2.4: the test-build option and its fake test; the timed case; run it;
   add the fold only if a threshold fails, then run again; write the figures
   into this plan's section 3 outcome and the handoff.
6. The inventory entries and goldens (below); `COVERAGE.md`; the decision
   files and `node tools/decisions.js`.
7. Gates (below), each after the last tracked edit it covers.

New and changed strings:

| Key | RU | EN |
|---|---|---|
| `hbFindOwn` | Найти предмет | Find an item |
| `hbFindCards` | Найти карту | Find a card |
| `ownSwitch` | Свои предметы | My items |

Removed: `hbTierHelp`, `hbDmgHelp`, `hbChipHint`. Reused: `nothing`.

States (each a test or a golden):

| State | What the screen shows | Proof |
|---|---|---|
| editor, every kind | «Ранг» and «Урон» with no «?»; «Источник» and the relation hints keep theirs | 16 re-seeded editor goldens; `homebrewEditor.test.ts` |
| `#/homebrew`, 0 / 1 / 7 items | no search box; the counter above the strip («0 предметов из 100» above the empty text) | goldens `#/homebrew as gm2` (0), `as gm1` (4); `homebrewPage.test.ts` |
| `#/homebrew`, 8 and many (34) | the search box, the counter, the strip | new golden `#/homebrew as gm3`; `homebrewPage.test.ts` |
| a query that matches | only matched rows; headings with no match gone; the strip on drawn rows; a hidden tick dropped | new golden `#/homebrew ~ search as gm3` (the query «палаш»: the 15 «Учебный палаш» rows under «Хоумбрю», one tick kept); a hidden heading in `homebrewPage.test.ts` (a store with two sources; gm3's items have no source) |
| no match | «Ничего не найдено», no strip, no headings; the counter unchanged | `homebrewPage.test.ts` |
| at the limit (100) and 3x (300) | the rows (or the fold of 100 if 2.4 fails); a keystroke filters | the timed case of `tests/app/states.js`; `homebrewPage.test.ts` |
| the longest name (120 code points) | a matched row's name wraps at 360 (rule 16) | `sweep.js 360` |
| «Карты», 7 / 8 cards | no box / the box above «Комплекты» | `homebrewPage.test.ts` (gm1 holds 2 cards; a store with 8) |
| «Карты», a query; a group with no match; an open form hidden | matched cards per group; `t.nothing` under that group's button; the form kept | `homebrewPage.test.ts`, axe in each |
| «Карты» at 100 and 300 cards | the box; a keystroke filters both groups | `homebrewPage.test.ts` (timed under 100 ms at 300 in jsdom) |
| `#/search`, own items, switch on / off | the three kind chips; the switch on its own row; off: own items gone, the kinds unchanged; unpressing the last kind refused only by the kinds | re-seeded `#/search ~ own items as gm1`, `~ own items hidden as gm1`, `~ relations as gm3`; the search page's test |
| `#/search` with no own item | no switch | the search page's test |
| equipment table, switch on / off | the switch at the end of the toolbar; off: own rows and their `src` values gone | re-seeded `#/tables/eq_weapon as gm1`, `~ own items hidden as gm1`, the `f_src` state; `tables.test.ts` |
| the toolbar and the switch row at 360 and 1180 | no sideways scroll; the switch label wraps under the chips | `sweep.js 360` (and 1180 through the goldens' width) |

Inventory entries and goldens: new `#/homebrew as gm3` and `#/homebrew ~
search as gm3`, each with its `why`; re-seeded: the 16 editor goldens, every
`#/homebrew` golden (the counter moves: `as gm1`, `as gm2`, `~ sections`,
`~ cards`, `~ card edit`, `~ add to list`, and R7d's import and move
states), and the six switch goldens (`#/search ~ own items as gm1`, `~ own
items hidden as gm1`, `#/search ~ relations as gm3`, `#/tables/eq_weapon as
gm1`, its `f_src` state, `~ own items hidden as gm1`), with their `why`
texts naming the switch. The cards search has no golden: no seed user holds
8 cards, and a seed change moves other goldens; its states are unit tests
with axe.

Acceptance (each its own outcome in the handoff):

- C1 (owner, 2026-10-02, 2.1): the «?» of «Ранг» (both kinds) and «Урон» are
  gone with `hbTierHelp`, `hbDmgHelp`, their test rows, the inventory `why`
  and the 16 re-seeded goldens; rule 15(c) gains the principle; the
  decision file amends "Field help is a «?» by the label" (both pointers).
- C2 (owner answer 1, 2.2): `#/homebrew` draws a `SearchBox` from the eighth
  item (`LIST_SEARCH_AT`), folded as search folds, over the name in both
  languages; headings with no match hidden; «Ничего не найдено» on no
  match; «Выбрать все» and the bulk actions on the drawn rows only; the
  ticks a subset of the drawn rows.
- C3 (owner answer 2, 2.3): «N предметов из M» heads the rows above the
  strip; rule 1 gains "A counter sits at the head of the collection it
  counts".
- C4 (owner answer 3, 2.4): `#/homebrew` at 300 items measured (navigation
  to rows at most 500 ms, keystroke to repaint at most 100 ms, medians of
  three, Chrome on this host); the figures in this plan and the handoff;
  the fold of 100 rows only if a threshold fails, then measured again.
- C5 (owner answer 4, 2.5): «Карты» draws the same search box from the
  eighth card (`cardMatches`); the D84 line on `HomebrewCards.svelte` is
  deleted.
- C6 (owner answer 5, 2.6): the «Хоумбрю» chip is gone from `#/search`'s
  kind row and the tables' toolbar; `Switch.svelte` «Свои предметы» / "My
  items", on by default, memory only, sits apart from the filter chips on
  `#/search` and at the end of the equipment tables' toolbar, drawn only
  while the account holds an own item; the switch's state never changes
  the kind row, so «Нужен хотя бы один тип» answers only the last of the
  three kinds; `hbChipHint` gone;
  `FEATURES.md` and `STATE.md` name the switch; the decision file written.
- C7 (section 7 of R7d's plan, the budget rule): each build measured and
  each passed budget stepped to the measured size plus about 5 kB.
- C8 (R7d review `reviews/B7d.2.md` Nit 13, filed at R7d's closeout): the
  «Переместить (N)» panel's «Источник» on `#/homebrew` either gains its
  «?» as rule 15(c) names, or `FEATURES.md` names the departure from rule
  15(c) for it; decided with C1's rework of the «?».

Standing checks:

1. Scale: the States table (0, 1, 7, 8, 34, 100, 300 items; 7, 8, 100, 300
   cards; the longest name; 360 and 1180). At many and at the limit: the rows
   keep `groupsOf`'s order; the primary «Новый предмет» stays before the rows;
   the rows' head (search, counter, strip) is not sticky and grows by one
   line (the strip's actions wrap at 360, as in R7d); no popup. Collections
   past 3x are not designed.
2. Error scenarios: the search and the switch are page or app memory over
   rows already read; nothing is written or stored. A store read that fails
   draws the page's failure line as today, and no search box; a re-read while
   a query is typed keeps the query and re-filters; a write elsewhere that
   removes a ticked item drops its tick as a hidden row does. Signed out or
   with no own item: no switch, no search. A stale tab keeps the chip until
   it reloads (no stored state to conflict). A revert to R7d's frontend
   brings the chip back; nothing stored differs.
3. Consistency (`FEATURES.md` "Consistency rules"): rule 1 as amended (the
   counter heads the rows, as on `#/lists`); rule 15 as amended (no help on a
   game term; the switch's label is visible, no hover-only title); rule 15's
   search-box departure (the placeholder names the box), as on `#/lists`;
   rule 11 (an open card form stays open under a query); rule 16 (long names
   wrap). Siblings: the lists index (the same `SearchBox`, threshold,
   folding, «Ничего не найдено», ticks a subset of the drawn rows, the
   counter of every item); the switch is a new control kind, used only for
   this filter - the chips stay values of a filter. Departure: none.
4. RU/EN parity: `hbFindOwn`, `hbFindCards`, `ownSwitch` in both languages,
   ASCII punctuation; the removed keys leave both languages; `nothing`
   reused.

Gates (this host, `context.md` costs):

| Gate | Minutes |
|---|---|
| `rtk npm run check` x2 (before and after the re-seed) | 18 |
| `npm run build:test`, `npm run check:built` (budgets) | 2 |
| `node tests/run-all.js app/states` (with the timed case) | 8 |
| `node tests/run-all.js app/contracts` (the gm1 filter probes) | 8 |
| `node tests/app/golden.js --shard=n/4` compare, then re-seed of about 30 named states | 13 + 6 |
| `node tests/app/sweep.js 360` | 8 |

Total about 63 minutes plus the closeout (about 10). No `check:db` (no
`supabase/` or `tests/db/` change), no `npm run e2e` (no backend change).
The fallback fold of 2.4, if needed, adds one `app/states` run (about 6).

Risks, do-nots:

- Do not store the switch or the query (`STATE.md`: memory only).
- Do not add a search to `#/tables/homebrew` or change its facets.
- Do not move the editor's other «?» hints (2.1 lists them; the owner judged
  only «Ранг» and «Урон»).
- The browser suite forces reduced motion: the switch's transition is not
  measured there (memory "Browser suite forces reduced motion").

## 4. Mocks (`mocks/`)

| Mock | Screen | What it settles |
|---|---|---|
| m01 | `#/search` (switch on, off), `#/tables/eq_weapon`, `#/homebrew as gm3` (the rows' head) | the switch's look and place; the order search box, counter, strip |

Drawn by the planner on 2026-10-02 from R7d's m16 markup; open
`mocks/index.html` in the Browser pane.

## 5. Decisions (`docs/decisions/`)

| File | Decision |
|---|---|
| `2026-10-02-a-field-help-explains-the-site-never-a-game-term.md` | 2.1; amends "Field help is a «?» by the label; every input has its own visible label" (both pointers); rejected: keeping hints that explain game terms (users know the rules) |
| `2026-10-02-the-own-items-filter-is-a-labelled-switch.md` | 2.6; rejected: the chip in the kind row (reads as a kind; the last-kind refusal), a chip in its own row (still reads as a filter value), a hover title (rule 15(a)) |

## 6. Owner answers

| Question | Answer (2026-10-02) | Lands in |
|---|---|---|
| Field help | remove the «?» of «Ранг» and «Урон»; a «?» explains the site, never a game term | 2.1, C1 |
| Search on `#/homebrew` | from the eighth item, the lists index's pattern | 2.2, C2 |
| The counter | at the head of the rows; rule 1 amended | 2.3, C3 |
| 300 items | measure; paging only if slow | 2.4, C4 |
| «Карты» search | from the eighth card; pays the D84 line | 2.5, C5 |
| The «Хоумбрю» chip | a labelled switch «Свои предметы», on by default, apart from the chips, also in the equipment tables | 2.6, C6 |
| Release | its own release R7h after R7d, before R9 | Status |

No question is open.

## 7. The rework (owner feedback 2026-10-02, merged 2026-10-03; not yet designed)

Evidence and the owner's words: `context.md`, "The rework merged into R7h";
screenshots in `screenshots/`. No planner pass has run on these items.

### 7.1 Work items

| # | Item | First questions for the design |
|---|---|---|
| W1 | Sharing by item id; live add with a change log, or a fixed copy | Who may read an item by id (anyone with the id, signed-in only)? What a live reference shows when the author edits or deletes; the log's shape and lifetime (as purchase requests: dismissable, cleared after first read); what "copy fixed in time" stores (a new own item in the reader's account, as «Сохранить себе» in R9, instead of a snapshot); how relations resolve for a reader (every linked item readable by id); the migration of existing `list_entries.snapshot` rows and of lists file v2; what happens to `#/s/` shared-list pages and to D7 |
| W2 | Backend cleanup of stray rows on a schedule | Which rows: expired purchase requests first, then any other "read as expired, never stored" data; pg_cron in SQL vs a scheduled Edge Function vs the nightly workflow; retention (delete vs archive); a rule in the specs that lifecycle logic lives on the backend; an audit of frontend-owned lifecycle logic |
| W3 | Pages per kind: Items, Sources, Sets, Rules; links to references | Routes (`#/homebrew/sets`, ...) and their place in the tab bar or the account menu; add and remove of items in a set or rule card on its page; links from an item's relation lines to those pages; what moves out of `#/homebrew` (the «Источники» and «Карты» folds); one import that creates everything; how export is organised per page vs one account export |
| W4 | Import preview names the items | List the names of held items to skip or replace, folded after N (rule 12); same for cards and sources; the same for the lists import's skips |
| W5 | Process: capture owner insights for later sessions | When the owner clarifies how something should be done (for example how mocks look, or the rule for when a field gets a «?»), the workflow records it in its permanent home without being asked: which role notices it (orchestrator, planner, reviewer), where it goes (`FEATURES.md` rules, `.claude/README.md`, `docs/decisions/`, a prompt, `CLAUDE.md` per its "repeated mistake" rule), and how a later session finds it; a step in `orchestrate.prompt.md` and the planner and reviewer prompts, possibly a closeout check in `.claude/skills/handoff/SKILL.md`. A prompt change is a reviewer trigger; the planner may split W5 into its own process task |

### 7.2 What the rework changes elsewhere

- R9 `persist-9-item-share` and R8 `persist-8-media` are designed on the
  share-token and snapshot model W1 questions; both are blocked until this
  pass decides.
- `B7h.1`'s «Карты» search and the counter may move into W3's pages.
- W4 (the import preview names items) is local to `HomebrewImport.svelte`.

### 7.3 Routing questions for the owner (before the planner pass)

1. Does W1 replace R9 and change R8? Recommendation: yes; R9's share links
   and R8's snapshot art are the parts W1 removes.
2. If W3's pages are accepted, do the «Карты» search and the counter move
   there? Recommendation: yes; the switch, the help removal and C8 stay.
3. W2 inside R7h, or its own small backend task now? Recommendation: in
   R7h's first batch if the planner keeps it small; stray rows grow daily.
4. W5 inside R7h or its own process task? Recommendation: its own process
   task, because it changes prompts every later session runs under.

### 7.4 Owner answers (2026-10-03)

Routing:
- R1 (R9 and R8): the rework ships before R9. R9 is not cancelled: its plan
  stays as input, and a plan refresh at R9's dispatch decides what is still
  needed. R8 is refreshed against the rework too.
- R2: yes - the «Карты» search and the counter move onto the new pages; the
  switch, the help removal and C8 stay as designed.
- R3: W2 (scheduled clean-up) is in R7h's first batch.
- R4: W5 (owner insights) stays inside R7h as its own batch.

W1 sharing model:
- W1-a: anyone with an item's id may open it (signed out too), like a
  catalog record; ids are random, so items are unlisted, not secret.
- W1-b: «Добавить в список» adds a live link; «Сохранить себе» makes the
  reader's own fixed copy.
- W1-c: when the author deletes a linked item, the row disappears from the
  other lists and a change-log entry says what was lost.
- W1-d: migration of stored snapshots: an entry whose original item still
  exists becomes a live link; the rest become fixed copies (own items of the
  list owner). Visible content can change for re-linked entries (accepted).
- W1-e: the change log lives on the list like purchase requests - one
  mechanism and one view shared with requests; an entry is dropped soon after
  it is read (3 days after read, or faster; the planner proposes the figure).
- Acceptance line: a reader opening an item by its link sees the same
  relations as the author (without edit controls), and every relation link
  opens (screenshot 02 dropped «Получается из» and the set members).

W2 clean-up:
- The mechanism (pg_cron in SQL, a scheduled Edge Function, or the nightly
  workflow) is the planner's choice with a recommendation.
- Yes to a standing law: lifecycle data is cleaned on the backend, never by
  the frontend - a decision file plus a one-time audit of frontend-owned
  lifecycle logic, each finding placed in a batch or `DEBT.md`.

W3 pages and files:
- The planner decides where the Items, Sources, Sets and Rules pages live;
  the owner prefers tabs inside «Мои предметы».
- One import and one export (the account export); no per-tab export.

W4 import preview: names of held items (items, cards, sources) with what
happens to each (skip or replace), first 10 then «и ещё N» (rule 12); the
same for same-name new items.

W5 owner insights: a reusable rule the owner states is written into its
existing home (`FEATURES.md` rules, `DESIGN.md` for mocks,
`.claude/README.md`, `docs/decisions/`, a prompt) under documented limits:
only what changes later work, with a size budget per home, so the files do
not become a swamp. The closeout audit checks it was written.

Schema freedom (owner, 2026-10-03): the rework may redesign the homebrew
schema where the new pages and the sharing model need it - in particular
`homebrew_cards` (sets and rule cards), so that a set or rule card can be
edited, listed and shown on its own page (members added and removed there,
links from items). Public contracts and stored data still change only with
a migration path, fixtures and a plan review; the planner names each schema
change and its reversal.
The same freedom covers other persistence schemas the rework touches
(owner, 2026-10-03): for example `homebrew_items` and `homebrew_books`,
`list_entries` (snapshot removal, live links, the deleted-item path),
`purchase_requests` and their lines (one mechanism and view with the change
log), and any new table for the change log or the clean-up. Each change
follows the same rules: a migration path for stored rows, a reversal,
fixtures, and the plan review.

W6 (owner, 2026-10-05): `#/tables/homebrew` with more than one source gets
one chip per source (like the catalog's table group chips); inside a chip
the rows are grouped by that source's sections only. Today every row sits
under one long list of «<source> · <section>» headings. With one source the
page stays as it is. The planner decides how the chip relates to the
existing `src` and `sect` facets and to the anchors (`#/tables/homebrew`
anchors are source and section keys today, a public route grammar in
`ROUTES.md`), and whether the Sources page of W3 links to a chip.
W6 also reconsiders the filters of `#/tables/homebrew` after the chip
change (owner, 2026-10-05): which facets stay once a chip picks the source
(`src` may become redundant; `sect` may narrow to the chip's sections;
`kind` stays), how the filter panel, its pills and the copy-link address
behave when a chip is switched, and whether the equipment tables' `src`
facet for own sources changes in step. Filter state is in the address
(`STATE.md`, `ROUTES.md`): a change is a route-grammar change with fixtures.
