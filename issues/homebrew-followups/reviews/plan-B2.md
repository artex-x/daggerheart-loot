# Review - plan before B2 (homebrew-followups)

Verdict: fix-then-continue
Reviewed: 3a899d52713e887f4a5fca96cd500c4ce347d85e
Scope: plan before B2

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

Saved by the orchestrator: the reviewer's write into this sibling worktree
was refused by the hook; the text below is the reviewer's report as returned.

**Sources read:** `CLAUDE.md`; `issues/homebrew-followups/` (context, plan,
handoff, mocks); `docs/specs/CONTRACTS.md` sections 1, 4, 5; `FEATURES.md`
("Tables and search", "The change log", "Records" - "Own relations on a
card", "Homebrew" - "Cards", "Import", "Exports"); `META.md` sections 3, 4,
8; `DEBT.md` D93; `.claude/README.md` ("Owner insights", the `timed` vitest
project); migrations `20261001130000_homebrew_relations.sql`,
`20261002130000_homebrew_files.sql`, `20261007130000_homebrew_links.sql`,
`homebrew_broadcast` in `20260930130000_homebrew.sql`; `lib/homebrew.ts`,
`lib/data.ts`, `lib/facets.ts`, `lib/filters.ts`, `lib/homebrewFile.ts`,
`lib/homebrewForm.ts`, `lib/label.ts`; `TablesPage.svelte`,
`HomebrewCards.svelte`, `CardForm.svelte`, `SharedListPage.svelte`,
`state/itemView.svelte.ts`, `RequestsPanel.svelte`; `tests/contracts.js`,
`tests/app/contracts.js`, the Arazo block of `tests/derived.js`; #71's plan
(`git show b63af78a:issues/71/plan.md`).

**Measured on `data.json`:** every catalog equipment facet value is
answered (secondary ranges include `veryfar` through `d.eq`);
`other_frames` holds all four frames, `voa` all six sections; only aa2,
aa5, aa21, aa50 carry a GM note; «Зерцал» occurs twice (aa11 `ru`, `rud`),
outside the data only in `_tables_arazo.txt`.

**Focus questions:**
- The constraint change cannot drop data: `homebrew_card_valid` only widens;
  `create or replace` does not re-check stored rows; `items` never leaves
  the owner (`homebrew_snapshot_of` copies named fields only, so
  `get_shared_list`, `get_homebrew_item`, `homebrew_item_record`,
  `clone_shared_list` cannot carry it); `homebrew_broadcast` sends to the
  owner's channel only; `copyRows` copies a record's embedded card, built
  without `items`; RLS on `homebrew_cards` unchanged.
- The touch trigger is safe: the early return is UPDATE-only and compares
  the content without `items` and `book_id`; it keeps `security definer`,
  `set search_path = public, pg_temp` and the revoke; insert and delete
  still fire; the broadcast trigger still fires.
- v1 stays byte-identical: `ordered()` writes only `CARD_KEYS`; `items` as
  the last key changes nothing for a card without it; `export.json` and
  `data-homebrew.zip` pin this.
- A v1 reader refuses items: the previous bundle refuses `version` 2 first,
  and its `cardProblems` names `items` `extra`; the new parse names `items`
  in a version 1 file `extra`.
- The revert path is in the correct order: the reversal strips `items`
  first, while the new touch body is in place, so the strip writes no
  notice; then it restores both bodies.
- B1's offer rule keeps every table address drawing as today: `shownRows`
  is the pre-facet set, a picked value stays offered, the catalog tables
  lose no value, the share page keeps #71's rule 4 through `listFacetRows`
  with no `picked`; #71's `listFacetRows` builds its candidates inline, so
  B1's extraction is a split of that function, as step 2 says.

## Blockers

- **plan-B2-1** - B2, "Error scenarios" (and the decision file's accepted
  trade-offs): an unnamed loss of `items`. `import_homebrew` with
  `p_update` replaces a held card's whole `content`
  (`20261002130000_homebrew_files.sql`, the cards loop). A version 1 file
  cannot hold `items`, so «Обновить» with any v1 file that names a held card
  strips the card's book items (an older export, a file an AI assistant
  writes from the v1 section of `llms.txt`, the previous bundle's import). A
  v2 file whose card lacks `items` does the same. A stale tab's export or
  data zip writes a v1 file without `items`, because `ordered()` drops
  unknown keys. Recommended change: (1) for a version 1 file, copy the held
  card's `items` (from `store.cards` at the press) into the row of a held
  card of the same kind; a version 2 file states them and the file wins;
  (2) name the remaining two-tab race in Error scenarios; (3) a
  `homebrewImport.test.ts` case: a v1 update keeps `items`, a v2 update
  without `items` drops them; (4) a db case: an `import_homebrew` update
  replaces `content`, `items` included. Accepted trade-off: a v1 file cannot
  remove book items. Alternative: accept "file wins" for both versions, with
  the rows in Error scenarios, the loss in the decision file's trade-offs,
  «и предметы из книг» in the «Обновить» confirm text, and the db case. In
  both cases, add the stale-tab export to the "Stale tab" row.

## Risks

- **plan-B2-2** - B2 step 13, `FEATURES.md` "Records" - "Own relations on a
  card": amend the bullet so that under an own set the fold counts every
  member, catalog ones included, and state the order of official members
  (recommended: catalog order, as `relOrder` uses; alternative: the card's
  `items` order).
- **plan-B2-3** - B2 step 13 misses three specs the change makes false:
  `FEATURES.md` "Homebrew" - "Import" (the field takes a `homebrew-v1` file;
  its hint links `schema/homebrew-v1.json`); `FEATURES.md` "Account and
  browser lists" - "Exports" (the data zip's `homebrew.json`); `META.md`
  section 3 "two known limits" of `get_homebrew_item`'s `updated_at` (a
  members-only edit moves it - a third). Add these to step 13; recommended:
  the import hint links `schema/homebrew-v2.json` beside v1.
- **plan-B2-4** - Timing bounds in the wrong files: B1 step 8 ("under 100
  ms") in `facets.test.ts`; B2 States (`withRecords` at 300 cards of 100 ids
  under 50 ms) in `homebrew.test.ts`. `.claude/README.md` requires a new
  timing bound in a `*.timed.test.ts` file with helpers in `app/src/test/`.
  Keep the "bounded by the vocabulary" assertions in the unit files; move
  each timing assertion to `facets.timed.test.ts` or
  `homebrew.timed.test.ts`; add the files to `COVERAGE.md`.
- **plan-B2-5** - Q1 = A wording: `SharedListPage` draws over `app.index`,
  so the GM sees the own set bonus on their own share link and their players
  do not. Write in `FEATURES.md`: "only the account that owns the card sees
  it, on every page it opens, its own share links included; other readers of
  a share link, `#/h/` and another account see the book's item". Add a
  `record.test.ts` or share-page case for the GM on their own `#/s/`.

## Nits

- **plan-B2-6** (local) - B2 step 2: "`cardUses` counts both" cannot work
  with `cardUses(items, kind, key)`. Option 1: leave it and count
  `cardMembers(...).length + cardItemIds(c).length` at the three callers;
  option 2: `cardUses(items, card: CardRow)` and name its callers.
- **plan-B2-7** (local) - B2 step 1 and the reversal: test the `hb_` key in
  `items` with `public.homebrew_key_ok(t.id)`; name the source of each
  restored body (`homebrew_card_valid` from
  `20261001130000_homebrew_relations.sql`, `homebrew_cards_touch` from
  `20261007130000_homebrew_links.sql`).
- **plan-B2-8** (local) - B2 step 11 db matrix: items and text in one update
  still notify and bump; a `book_id`-only update still notifies; an update
  that changes nothing writes no notice (state this behaviour change in the
  decision file).
- **plan-B2-9** (local) - B2 step 11 `data.test.ts`: an official member
  alone in a set draws no set line and no bonus, as an own item alone; add
  one line to FEATURES "Cards".
- **plan-B2-10** (local) - B2 States: add the largest open fold, 100 official
  plus up to 100 own members (300 at 3x); extend the "a set of 300 members"
  case in `homebrewPage.timed.test.ts` with 100 official members.
- **plan-B2-11** (local) - two owner-rule texts over the three-line budget
  (B1 `FEATURES.md` "Tables and search", about five lines; B1 `I18N.md`
  "Rules", about five lines): trim each to three; the decision files carry
  the rest.
- **plan-B2-12** (local) - `handoff.md` "Completed", Review: add the report
  path `issues/homebrew-followups/reviews/plan-B2.md` in the template form.

## Deviations

- The handoff records none (planning only). The plan's own three departures
  are accepted: tables keep a picked value offered while #71's share page
  keeps rule 4 (`CONTRACTS.md` section 1); the search kind chips stay static
  (a scope control); option B is deferred.

## Standing checks

1. Scale: checked - B1 States hold (own items 100 and 300, 30 sections per
   source, notices 0/1/2-3/4+ up to 300, sweeps 360 and 1180); B2 States
   hold (100 official per card, 300 cards, the 100-member record fold, the
   picker at 360 px); gap: the largest open card fold (plan-B2-10).
2. Error scenarios: checked - B1 writes no stored shape; B2's table covers
   a failed write, offline, a conflict, a gone card, the move's partial
   failure, a gone catalog id, a stale tab, a frontend revert and the down
   migration; a conflict retry reads the row at the press. Missing: the
   «Обновить» import and the stale-tab export (plan-B2-1).
3. Consistency: checked - FEATURES rules 1, 2, 3, 5, 12, 13; the member-row
   book tag is named; the record-page fold rule (plan-B2-2) and the import
   and export specs (plan-B2-3) are not yet amended.
4. RU/EN parity: checked - `hbCardItemsFull`, `hbImportVersion`,
   `hbImportNoVersion` state the same facts in both languages; B1 adds no
   string; aa11 changes only `ru` and `rud`; the four GM notes go from both
   `ende` and `rud`.

Owner rules: checked - item 2 to `FEATURES.md` "Tables and search" (B1);
item 3 to "The change log" (B1); items 4-5 to `I18N.md` "Rules" plus the
`tests/derived.js` guard (B1); Q1 = A to "Homebrew" - "Cards" plus a
decision file (B2). Two texts are over budget (plan-B2-11); Q1 = A wording
needs plan-B2-5.

## Suggested next action

1. The planner applies plan-B2-1 to plan-B2-12 once.
2. For plan-B2-1 the planner applies the recommended "v1 keeps the held
   `items`" rule or the named-and-accepted alternative.
3. B1 may then start once #71 is on `main`, with no second look.

## Checks still needed

- `npm run check:db` for the migration, the reversal walk and the db matrix
  (B2, implementer).
- `db:push --project test` and `npm run e2e`, after the B2 batch review.
- The B1 golden compare, to confirm no catalog table's filter line changes.
