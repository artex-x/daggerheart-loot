# Plan - TASK 71: filters on the shared list view

## Status

- Mode: A (new plan), planner passes 2026-10-06, HEAD `d997f4f0`. Revised the
  same day after the owner's answers (the filter goes into the address).
- Batches: B1 planned, implement-ready. Not started.
- The owner approved the mocks and answered the three questions
  (`handoff.md`, "Notes"). The plan review returned fix-then-continue; its
  findings are applied below, with no second look. B1 is ready.
- Plan review: required before B1 (trigger: public contract change)
- Plan review findings applied: reviews/plan-B1.md
  - B1, "B1" steps 10 and 14: the literal `#/s/<token>/f_<filter>` is written in `ROUTES.md` (a code block under "Records, lists and print"), the `CONTRACTS.md` section 1 bullet and the `llms.txt` `#/s/<token>` bullet; step 10 checks `#/s/<token>/f_`.
  - B2, "B1" step 12 and States: new state `#/l/ ~ filtered` (8 catalog entries, «Оружие» picked, no copy-link button, the address unchanged).
  - R1, "The address", step 6 and "Compatibility with TASK 70": `gmFilterLinkCopied` reuses TASK 70's phrase word for word when TASK 70 lands first, and leaves out «и позиции» / "and items" when TASK 71 lands first; the task that lands second aligns the strings.
  - R2, "Placement and controls", step 8, acceptance 11: the block is latched per list once drawn.
  - R3, step 11: the seed header comment and the `fake-cloud.test.ts` gm3 assertion change; the new ids are named; the `as gm3` goldens are compared.
  - R4, steps 9 and 10, acceptance 3: fixture `#/s/player-token-1/f_kind-weapon.`; a share probe loop over six groups in `tests/app/contracts.js`.
  - N1, States and "Placement and controls": the `src` row's worst case is stated and accepted; the state "8 or more entries, no row can narrow" is added (search box only).
  - N2, Error scenarios: a clipboard failure row.
  - N3, step 8: the audience is read at the press, outside the toast callback.
  - N4, step 7: `.fpill` padding `6px 8px 6px 11px`.
  - N5, Batches and Verification: the pooled browser run replaces the separate `app/contracts` and `app/states` calls; gate cost updated.
  - N6, "What dynamic means" and step 14: a value the address keeps applies again if an answering entry returns before the next change; the copied link holds only the values in force.
  - N7, the decision file: rejected "no copy-link button on a GM link".
  - N8, step 4: the `srcName` comment names the books and `community`.
- Owner challenge on minimal lists (2026-10-06) answered in "Minimal lists"
  below; the strip rule is added to the block rule, not put in its place.

## Objective and evidence

GitHub issue 71, "Add filters to the shared list view" (`context.md`): the
shared list view gets filters - dynamic, "maybe as everywhere" in the app -
with type, trait and the other filters the table view and search have. The
issue has no screenshots and no comments.

The shared list view is `SharedListPage.svelte`: `#/s/<token>` (an account
list's share link) and `#/l/<payload>` (the legacy link, retired in a build
with sign-in on 2026-10-26). Today it draws the head, «Сохранить себе», the
notes, «Выбрать все (N)» and the rows; it has no search and no filter.

Live UI inspected on the test build (`dist-test`, seed `#/s/player-token-1`,
«Лавка кузнеца», 10 entries: 3 items, 1 consumable, 5 weapons, 1 armour, from
Core, Hope & Fear, Wondrous, Dread, Vault of Ages and one own source), and the
filter of `#/tables/eq_weapon` at 800 px and 360 px.

Owner answers, 2026-10-06:

1. The filter state follows the tables: a filter segment in the `#/s/`
   address and the copy-link button ("consistent way with tables").
2. The mocks are approved: the placement, the search box, the threshold of
   8 entries (`LIST_SEARCH_AT`), the Type row, no counts on chips.
3. The owner's own list page `#/lists/<id>` gets no filter.

## Mockups

`issues/71/mocks/index.html` (one self-contained file, approved by the
owner 2026-10-07; its build sources are not committed, because ESLint
lints every `.mjs` in the tree; `#state=active&lang=en` opens one state). Every frame is the
running app's own markup and stylesheet; the parts tagged NEW are proposed.
States: folded, open, active folded (with a tick the filter hides), active
open (also how a filter link opens), no match, a `#/l/` link, the three
minimal lists of the owner's challenge (case 1: 8 Core potions, all alike;
case 2: 8 weapons that differ only by tier; case 3: 8 tier 2 armours from
five sources; rows built from `data.json`), and the
rejected "counts on chips" alternative; each at 360 px and 1180 px, RU and
EN, with the address bar and the copied link of each state.

## Design

### The address

```
#/s/<token>
#/s/<token>/f_<group>-<value>[-<value>...][.<group>-<value>...]
```

- The segment is the tables' filter grammar (`ROUTES.md`, "Filter
  grammar"), read by `decodeFilter` and written by `encodeFilter` with the
  share link's group list `LIST_GROUPS`. The old `_` group separator is read
  as on a table.
- `parseHash` reads the token as today (the leading run of
  `[A-Za-z0-9_-]`); then, when `/f_` follows, the segment. Anything else
  after the token is dropped and the address kept, as today.
- A build before this one reads the token and drops the segment: the whole
  list, never an error page. This holds for a stale tab too.
- A pick writes the address with `app.replace` (`replaceState`), as a table
  does. A filter link that arrives from outside opens the panel, as a table
  link does (the `seenSeg` rule, `STATE.md`, `fSeg`).
- The query of the search box stays page memory, as on a table.
- The copy-link button copies `<site>#/s/<token>/f_...` in Russian and
  `<site>en/#/s/<token>/f_...` in English (`app.linkTo`), and toasts
  `filterLinkCopied` «Ссылка на фильтры скопирована». On a GM link
  (`view.shared.audience === 'gm'`, read at the press) it toasts the new
  `gmFilterLinkCopied`, because the copy carries the GM token, as
  «Скопировать» in the share panel warns (`gmShareCopied`). Its text
  depends on the landing order with TASK 70 (owner, 2026-10-06: the share
  copy toasts name the GM notes and the GM-only items in the share panel
  hint's words; TASK 70's reusable tail is «в ней есть заметки и позиции
  «Только для мастера»» / "it carries the "GM only" notes and items"):
  - TASK 70's B2 already on `main`: «Ссылка на фильтры скопирована - это
    ссылка для мастера: в ней есть заметки и позиции «Только для мастера»» /
    "Filter link copied - it is the GM's link: it carries the "GM only"
    notes and items" (TASK 70's tail, word for word).
  - TASK 70's B2 not yet on `main`: «Ссылка на фильтры скопирована - это
    ссылка для мастера: в ней есть заметки «Только для мастера»» / "Filter
    link copied - it is the GM's link: it carries the "GM only" notes".
    There are no GM-only items yet, so the shorter text is the true one.
  - Rule: the task that lands second aligns the strings. If TASK 70 lands
    second, its B2 adds «и позиции» / "and items" to `gmFilterLinkCopied`.
    Before B1 starts, the implementer reads `dict.ts` on the branch base to
    see which case holds.

### `#/l/<payload>`

Page memory, no copy-link button. Reason: `parseHash` reads everything after
`l/` as the payload (R5), so a `/f_` segment would become part of the
payload, and every bundle before this one would draw the bad-link page for
it. The route also retires on 2026-10-26 in a build with sign-in, and
`CONTRACTS.md` section 3 is scheduled for removal; the grammar of a retiring
route does not change. On `#/l/` the strip works as on `#/s/`, the address
stays as it opened, and a reload starts unfiltered.

### What "dynamic" means

1. The groups and the values come only from the entries the page draws for
   this reader. A value that no drawn entry answers is not offered.
2. A row is drawn only when it can narrow: two or more values, or one value
   that some drawn entry does not answer (a potion has no trait).
3. A row never narrows itself by the picks in another row, as on a table
   (`facetRows`' own rule).
4. The values in force are the picked values that a drawn row offers
   (`listFacetRows`). A picked value no drawn row offers (an old link, a
   re-read after the owner sold the last armour, or a value of a row that
   cannot narrow) draws no pill and narrows nothing. The address keeps it
   until the next change of the filter, which writes only the values in
   force; if an entry that answers it comes back before that change, it
   applies again. The copied link holds only the values in force, so it can
   differ from the address bar. Departure from a table, where such a value
   narrows to nothing and draws no pill: on a share link the facets follow a
   list that changes under the reader, so an empty page with nothing to drop
   would be the common case, not an edge.

### Groups, in order (`LIST_GROUPS`)

| Group | Label RU / EN (existing key) | Values in order (existing label keys) | A record answers |
|---|---|---|---|
| `kind` | Тип / Type (`kindF`) | `item` Предметы (`fItems`), `consumable` Расходники (`fCons`), `weapon` Оружие (`subWeapon`), `secondary` Вторичное (`subSecondary`), `armor` Броня (`subArmor`) | `it.eq?.t ?? kindOf(it)` |
| `src` | Источник / Source (`source`) | `core`, `hnf`, `wondrous`, `dread`, `voa`, `dv`, `community`, the frames in `FRAME_ORDER` (`srcName`); then `hb` (`srcHomebrew`) and each own or frozen-copy source by name (`homebrewSrcValues`) | `srcOf(it)` |
| `tier` | Ранг / Tier (`tier`) | `1`-`4`, `A` (`voaArtifact`) | equipment only: `eq.tier` |
| `cls` | Класс / Class (`eqClass`) | `phy`, `mag` (`EQ_CLS`) | equipment only (`equipFacets`) |
| `trait` | Характеристика / Trait (`eqTrait`) | the six of `EQ_TRAIT` | equipment only; `spellcast` answers all six |
| `range` | Дистанция / Range (`eqRange`) | `EQ_RANGE` order | equipment only |
| `burden` | Хват / Burden (`eqBurden`) | `1`, `2` (`EQ_BURDEN`); `any` answers both | equipment only |
| `line` | Линейка / Line (`eqLineF`) | `line`, `uniq` (`EQ_LINE`) | equipment only |

`kind` takes `weapon`, `secondary` and `armor` on a share link where a table
takes `equip`: a list mixes the three kinds that the tables split by table.
The Vault of Ages section (`Record_.tier`) is not merged into `tier`.

### Placement and controls (the approved mocks are the reference)

- One block between the list notes and «Выбрать все»: `SearchBox` (the
  tables' placeholder `searchPh`), then `FilterBar`. The block has
  `margin-bottom: 18px`.
- The block opens when the page draws 8 entries or more (`LIST_SEARCH_AT`),
  or when a query or a value in force is set. Once open it stays open until
  another list opens (a latch reset with `shownFor`), so dropping the last
  pill, clearing the query or a re-read that shrinks the list never removes
  the control that has the focus. Below 8 the page is as today; every
  existing `#/l/` golden (2 and 3 entries) stays byte-identical.
- Inside the open block the search box is always drawn; the strip
  (`FilterBar`) is drawn only while at least one row can narrow - its own
  `{#if rows.length}` rule. A re-read that leaves no row able to narrow
  removes the strip and keeps the search box (accepted: a re-read changes
  the list under the reader anyway).
- `FilterBar` as on a table: «Фильтры (N)», pills, «Сбросить всё», the
  copy-link button on `#/s/` only (`oncopylink` becomes optional), «N из M»
  (M = entries drawn), «любое» on an untouched row.
- The `src` row grows with the list, not with the catalog: one value per
  catalog source, own source (20 per owner, 60 at 3x) and frozen-copy
  source. At the limit the open panel can be several screens tall at 360
  px. It is in the page flow under «Сохранить себе» and folds with one
  press; accepted.
- The search box matches as a table's box does (`parseQuery`, `matches`,
  `statLineFor`, `hayFor`). It does not search the list notes.
- No match: `Empty` with «Ничего не найдено» and, while a value is in force,
  «Сбросить всё», which clears the filter only (the table's rule).
- Ticks survive filtering: `app.keepTicksIn` keeps pruning to `shared.ids`.
  «Выбрать все (N)» ticks the drawn rows only; the bar counts every tick.
- The sub «Список от другого игрока · N позиций» keeps the whole count.
- The owner's list page `#/lists/<id>` gets no filter (owner, 2026-10-06).

### Minimal lists (owner's challenge, 2026-10-06)

Decision: two rules, one per control. The block (and with it the search
box) keeps the count rule of 8 drawn entries, latched as above. The strip
adds the rule "at least one row can narrow". The count rule is kept, not
replaced, because the owner confirmed it and because a 3-entry mixed list
would otherwise draw a filter for three rows the reader sees at once.

| Case (mock) | Rows that can narrow | Shows | Accepted trade-off |
|---|---|---|---|
| 1. 8+ entries, all alike (8 Core potions) | none | the search box only: no toggle, no count, no copy-link button | a reader of such a list does not see that a filter exists elsewhere; the names still differ, so a name search still helps |
| 2. one type, small spread (8 presence melee one-handed weapons, tiers 1-4) | `tier` only | the strip with one row behind «Фильтры» | one press to open one row, as on a table with one row (`wondrous`) |
| 3. one type, many sources (8 tier 2 armours from five sources) | `src`, `line` | the strip with two rows | the `src` row wraps and grows with the list (above) |

In the real catalog a set of weapons of one source and one tier still
differs by range, burden or class, so case 1 is reached mostly by loot and
consumables of one source, or by armours of one tier and one source.

A filter link that names a value of a row that cannot narrow (for example
`f_kind-consumable` on case 1) is not in force: no pill and no narrowing
(rule 4); with the block's latch the search box is drawn, the strip not.

### Compatibility with TASK 70 (GM-only entries)

The facets, the counts and the threshold read one array: the records the
page draws before the filter (today `items`). A players' link never receives
a GM-only entry, so a GM-only entry can never appear as a value or in «N из
M» there; a players' filter link that names a value only a GM-only entry
answers draws nothing for it (rule 4 above). A GM link draws GM-only entries
and offers their values; a filter link copied there carries the GM token,
and its toast says so. Neither task assumes the other ships first; the
second to land rebases `SharedListPage.svelte`, `sharedListPage.test.ts`,
`fake-cloud-seed.ts`, `tests/app/inventory.js`, `dict.ts` and the
`FEATURES.md` shared-page paragraph. TASK 70's B2 rewords `gmShareCopied`
and adds `playersShareCopied` with the reusable tail «в ней есть заметки и
позиции «Только для мастера»»; `gmFilterLinkCopied` follows the landing-order
rule in "The address": the task that lands second aligns the strings, so
both GM toasts name the same facts.

### Architecture

- `app/src/lib/filters.ts`: `LIST_GROUPS` beside `EQ_GROUPS` and
  `PLAIN_GROUPS` (it is now address grammar).
- `app/src/lib/hash.ts`: the `share` route gains `filter: FilterState`;
  `shareHash(token, opts = {})` writes the segment.
- `app/src/lib/data.ts`: `listFacets(it)`.
- `app/src/lib/facets.ts`: `listFacetRows(records, t, lang)`.
- `app/src/lib/label.ts`: `srcName('community')` returns `srcComm`.
- `app/src/lib/dict.ts`: `gmFilterLinkCopied`, RU and EN.
- `app/src/components/FilterBar.svelte`: optional `oncopylink`; the
  long-pill fix.
- `app/src/components/SharedListPage.svelte`: the block, the state, the
  filtered rows.

### Rejected alternatives

In `docs/decisions/2026-10-06-a-share-links-filter-lives-in-its-address-its-facets.md`:
page memory on `#/s/` (the owner chose consistency with the tables), counts
on chips, cross-row narrowing, merging the Vault of Ages section into
`tier`, no copy-link button on a GM link, and for the minimal lists: "a
row can narrow" in place of the count, hiding the search box when no row
can narrow, and a strip with nothing to open. Also rejected here: a `/f_`
segment on `#/l/` (breaks the link in
every earlier bundle; a retiring route); no filter at all on `#/l/` (one
component would draw two different pages for the same list); a separate
list-filter component (the extraction rule: this is the second use of the
same strip); searching the list notes (no table searches notes).

## Batches

One batch, B1. The split test of `.claude/README.md`, "Batch size and the
fixed cost of a run":

- A public-contract change needs its own commit and its own review. B1 is
  the task's only commit and holds nothing but this change and the page
  that answers it; its review is the contract review. A cut between the
  grammar and the page would leave a batch whose own gate cannot pass: the
  built-app replay of the new route fixtures (`tests/app/contracts.js`)
  reads the rows and the pills that only the page draws.
- The `FilterBar` pill fix touches the tables' route set, but its proof is
  a share-link state and a compare of the table goldens that B1 runs
  anyway; a separate batch would pay a second check and save nothing.

Total gate cost of B1, from the README figures on this host: `npm run check`
400-600 s, `npm run check:built` about 25 s, `node tests/run-all.js
contracts,dataint` under a minute, the pooled browser run `node
tests/run-all.js app/print,app/contracts,app/states,app/typo,app/hues,stub`
about 260-290 s by the README table (its newer single-suite figures,
`app/contracts` up to 414 s, put it nearer 450 s on a loaded host), the
golden re-seed of the changed and new states about 150 s, the four golden
shards in compare mode about 800 s, `node tests/app/sweep.js 360` and
`1180` about 430-590 s each. About 45-55 minutes, plus the batch review.
The two inner sweep widths run in CI.

### B1 - Filter and search on the shared list page (implement-ready)

**Objective.** A reader of a share link narrows the list by type, source,
tier, class, trait, range, burden and line, and by text, as on a table, with
the filter in the address and a copy-link button; facets are limited to what
the list holds. A `#/l/` link gets the same filter as page memory.

**In scope.** The files below. **Out of scope.** The owner's list page;
the `#/l/` grammar; the account and the database.

**Files.**

- `app/src/lib/filters.ts`, `filters.test.ts` - `LIST_GROUPS`.
- `app/src/lib/hash.ts`, `hash.test.ts` - the `share` route's filter,
  `shareHash`.
- `app/src/lib/data.ts`, `data.test.ts` - `listFacets`.
- `app/src/lib/facets.ts`, `facets.test.ts` - `listFacetRows`.
- `app/src/lib/label.ts`, `label.test.ts` - `community`.
- `app/src/lib/dict.ts` (and `i18n.test.ts` if it pins key sets) -
  `gmFilterLinkCopied`.
- `app/src/components/FilterBar.svelte`, `tables.test.ts` - optional link,
  pill wrap.
- `app/src/components/SharedListPage.svelte`, `sharedListPage.test.ts`.
- `app/src/ports/fake-cloud-seed.ts` (and any seed-counting test it breaks).
- `docs/fixtures/urls/routes.json`, `tests/contracts.js`,
  `tests/app/contracts.js` (only if the replay needs a wait, step 9).
- `tests/app/inventory.js`, `tests/app/snapshots/` (re-seeded and new).
- `docs/specs/ROUTES.md`, `CONTRACTS.md`, `FEATURES.md`, `STATE.md`,
  `I18N.md` (if it lists toasts), `COVERAGE.md` (if it lists the shared
  page's states), `llms.txt`, `docs/DECISIONS.md` (rebuilt by `node
  tools/decisions.js`).

**Steps.**

1. `filters.ts`: add `export const LIST_GROUPS: readonly string[] = ['kind',
   'src', 'tier', 'cls', 'trait', 'range', 'burden', 'line']` with a
   comment: the groups of a share link's filter, in address order
   (`ROUTES.md`, "Filter grammar").
2. `hash.ts`:
   - Route: `{ kind: 'share'; token: string; filter: FilterState }`.
   - Parse: `const s = /^s\/([A-Za-z0-9_-]*)(?:\/(f_[A-Za-z0-9_.-]*))?/.exec(h)`
     for `h` starting `s/`; `token = s[1]`, `filter = decodeFilter(s[2] ??
     '', LIST_GROUPS)`. Keep the comment on the stray character.
   - `export function shareHash(token: string, opts: { filter?: FilterState }
     = {}): string` writes `'#/s/' + token` and, when `encodeFilter(filter,
     LIST_GROUPS)` is not empty, `'/' + segment`. Every current caller
     passes one argument and is unchanged.
3. `data.ts`: `export function listFacets(it: Record_): Record<string, string
   | readonly string[]>` returning `{ ...equipFacets(it), kind: it.eq?.t ??
   kindOf(it), src: srcOf(it) }`.
4. `label.ts`: add `community: t.srcComm` to `srcName`'s `named` map, and
   fix the comment beside it: "Anything not one of the six books above or
   `community` is assumed to be a frame id".
5. `facets.ts`: `export function listFacetRows(records: readonly Record_[],
   t: Dict, lang: Lang): FacetRow[]` - per group of `LIST_GROUPS`, the
   candidate values in the Groups table order (for `src`: `['core', 'hnf',
   'wondrous', 'dread', 'voa', 'dv', 'community', ...FRAME_ORDER]` labelled
   by `srcName`, then `homebrewSrcValues(records, t, lang)`); keep a value
   that some record's `listFacets(it)[group]` includes; keep a row with two
   or more values, or one value some record lacks. `tier` `'1'`-`'4'` are
   labelled by the digit and `'A'` by `t.voaArtifact`; the equipment groups
   through `eqWord`.
6. `dict.ts`: `gmFilterLinkCopied` in both dictionaries, ASCII ` - `. Read
   `gmShareCopied` on the branch base first: if it already holds TASK 70's
   tail «в ней есть заметки и позиции «Только для мастера»», use the long
   text of "The address"; otherwise the short one.
7. `FilterBar.svelte`: `oncopylink?: (() => void) | undefined` (the caller
   passes `undefined` on `#/l/`); draw `.flink` only when it is set. In
   `.fpill`, replace `height: 32px`, `padding: 0 8px 0 11px` and
   `white-space: nowrap` with `flex: none; max-width: 100%; min-height:
   32px; padding: 6px 8px 6px 11px; white-space: normal; overflow-wrap:
   anywhere; text-align: start;` and one comment line with the reason
   (`FEATURES.md` rule 16). A one-line pill stays 32 px tall (the table
   golden compare proves it).
8. `SharedListPage.svelte`:
   - `const linked = $derived(token !== undefined)`; page `$state`:
     `q = ''`, `memPicked: FilterState = {}` (the `#/l/` filter),
     `filterOpen = false`, `seenSeg = ''`.
   - `const picked = $derived(linked ? (app.route.kind === 'share' ?
     app.route.filter : {}) : memPicked)`.
   - `const rows = $derived(listFacetRows(items, t, app.lang))`;
     `const inForce = $derived(...)`: per group of `LIST_GROUPS`, the picked
     values that `rows` offers.
   - The `TablesPage` effect, keyed on `shownFor` (token or payload)
     instead of the table: a new list resets `q`, `memPicked`, `seenSeg`
     and `filterOpen`; on `#/s/`, a segment (`encodeFilter(route.filter,
     LIST_GROUPS)`) that differs from `seenSeg` opens the panel, and
     `seenSeg` takes it.
   - `applyFilter(next)`: on `#/s/`, `seenSeg = encodeFilter(next,
     LIST_GROUPS)` and `app.replace(shareHash(token, { filter: next }))`;
     on `#/l/`, `memPicked = next`. `pickFacet(group, value)` as in
     `TablesPage`, built on `inForce`; `resetFacets()` is `applyFilter({})`.
   - `copyFilterLink()` (on `#/s/` only): read `const gm =
     view?.shared?.audience === 'gm'` and the address at the press, then
     `app.copied(() => app.env.clipboard.writeText(link), (t) => gm ?
     t.gmFilterLinkCopied : t.filterLinkCopied)`, with `link =
     app.linkTo(shareHash(token, { filter: inForce }))`. The toast callback
     runs later; a re-read in between must not change the toast.
   - Filter `items` with `passes(inForce, LIST_GROUPS, (g) =>
     listFacets(it)[g] ?? '')`, then the query as `TablesPage`'s
     `filtered`; `entries` maps the result (the tail logic unchanged).
   - The block's latch: `let finding = $state(false)`; an effect sets it to
     `true` when `items.length >= LIST_SEARCH_AT || q !== '' ||
     chosenCount(inForce, LIST_GROUPS) > 0` (write only on a change), and
     the `shownFor` effect resets it to `false`. Nothing else sets it back.
   - The strip needs no rule of its own: `FilterBar` draws nothing while
     `rows` is empty (`{#if rows.length}`), so a list where no row can
     narrow shows the search box alone.
   - Markup after the notes block, before `TableRows`: `{#if finding}<div
     class="lfind"><SearchBox .../><FilterBar rows={rows} picked={inForce}
     shown={entries.length} total={items.length} open={filterOpen} {t}
     ontoggle=... onpick={pickFacet} onreset={resetFacets}
     oncopylink={linked ? () => void copyFilterLink() : undefined}
     /></div>{/if}`, `.lfind { margin: 0 0 18px; }`.
   - No match with `items.length > 0`: `Empty` with `t.nothing` and, while
     `chosenCount(inForce, LIST_GROUPS) > 0`, `<Button size="sm"
     onclick={resetFacets}>{t.resetAll}</Button>`, in place of
     `TableRows`.
   - `app.keepTicksIn(shared.ids)`, `ontoggleall` and the `open` effect stay
     as they are. A filter write must not call `view.open` again: the effect
     reads `token`, which does not change.
   - Update the header comment (the filter, its address on `#/s/`, page
     memory on `#/l/`; cite `FEATURES.md`, "Lists").
9. `routes.json`: add, each with a `why`:
   - `#/s/player-token-1/f_kind-weapon.tier-1`: rows 3, picked
     `["kind:weapon", "tier:1"]`, the address kept.
   - `#/s/player-token-1/f_kind-weapon_tier-1`: the old separator, the same
     result.
   - `#/s/player-token-1/f_range-veryfar`: a value the list does not hold:
     rows 10, picked `[]`.
   - `#/s/player-token-1/f_rg-melee`: an unknown group: rows 10, picked
     `[]`.
   - `#/s/player-token-1/f_kind-weapon.`: a chat client's trailing full
     stop after the segment: rows 5, picked `["kind:weapon"]`, the address
     kept.
   - `#/s/Qm9vZ2xlLXBsYXllci10b2tlbi1leGFtcGxlLXgxMjM/f_kind-weapon`: a
     token that opens nothing: the no-longer-available page, the address
     kept.
   `player-token-1` is the test build's seeded share; say so in each `why`.
   In `tests/app/contracts.js`, next to "filter group names select
   something", add a share probe loop in one context: open
   `#/s/player-token-1/f_` + each of `src-hnf`, `cls-mag`, `trait-presence`,
   `range-far`, `burden-2`, `line-uniq` (each a value the seed list holds)
   and assert `0 < rows < 10`.
   In `hash.test.ts`, add a `share` branch to the fixture loop: the route
   is `share` and every `picked` entry is in the parsed filter. Update the
   five `toEqual({ kind: 'share', token })` expectations to carry `filter`,
   and add unit tests: the segment, the old separator, a stray `.` after
   the segment, `shareHash` round trips, an empty filter writes no segment.
   If `tests/app/contracts.js` reads the rows before the fake share read
   lands, wait for `.page-h` on a `#/s/` fixture before the evaluate.
10. `tests/contracts.js`: next to the `#/s/<token>` check, `llms.txt`,
    `CONTRACTS.md` and `ROUTES.md` each contain the literal
    `#/s/<token>/f_`; `ROUTES.md` and `llms.txt` name the share link's
    `kind` values `weapon`, `secondary` and `armor`.
11. `fake-cloud-seed.ts`: a gm3 list «Склад» (`uuid(301)`) with 8 entries,
    ids `uuid(3101)`-`uuid(3108)`: `ci1`, `cc1`, `q1`, `q313`, `q23`,
    `w51`, gm3's 120-code-point bedroll (`hb_bedrolloaaaaaaaa`), and a
    frozen copy `hb_longsrcaaaaaaaaa` (`source: 'homebrew'`, a snapshot
    built as gm2's axe is, whose source name is 80 code points,
    `BOOK_NAME_MAX`); a player share `player-token-3` with id `uuid(311)`
    and `topicKey` `uuid(312)`. Change the header comment ("`gm3` holds no
    list") and the `fake-cloud.test.ts` assertion that `SEED.lists.gm3` is
    empty (the `[books, cards, SEED.lists.gm3]` line) to the new facts, and
    keep its id-uniqueness test meaningful. Compare, unchanged, the `as gm3`
    goldens `#/i/ci1`, `#/i/q1`, `#/i/voa4_t3d` and `#/search ~ relations`
    (a frozen copy is never drawn in search, `AppState.frozenCopy`).
12. `tests/app/inventory.js`, after `#/s/player-token-1 ~ ticked`, signed
    out unless stated:
    - `#/s/player-token-1 ~ filters open`: «Фильтры» pressed; the panel
      with Тип (4), Источник (6), Ранг (1, 2), Класс, Характеристика (6),
      Дистанция (3), Хват, Линейка, each «любое».
    - `#/s/player-token-1/f_kind-weapon.tier-1`: the filter link as it
      opens: the panel open, «Оружие» and «1» pressed, two pills, «Сбросить
      всё», the copy-link button, «3 из 10», three rows.
    - `#/s/player-token-1 ~ filtered`: «Первоклассный Спальный Мешок»
      ticked, then «Оружие» and Ранг «1» picked and the panel folded; the
      bar «Выбрано 2 позиции»; the address ends `/f_kind-weapon.tier-1`.
    - `#/s/player-token-1 ~ no match`: «Броня» and Ранг «2»: «0 из 10»,
      «Ничего не найдено» and «Сбросить всё».
    - `#/s/player-token-1 ~ searched`: «кинжал» typed: one row, the strip
      «10», the address unchanged.
    - `#/s/gm-token-1 ~ filter link copied`: «Оружие» picked and the
      copy-link button pressed: the GM toast (timed, as the other toasts).
    - `#/s/player-token-3 ~ long source picked`: the 80-code-point source
      picked: its pill wraps inside the strip at 360 px.
    - `#/l/ ~ filtered`: a payload of 8 catalog entries (`ci1`, `cc1`,
      `q1`, `q313`, `q23`, `w51`, `q35`, `di11`), computed once off the
      frozen format and checked byte-identical to `encodeList`, as `#/l/ ~
      own list` is; «Оружие» picked: the 26 October line, the strip, the
      pill, «Сбросить всё», no copy-link button, «4 из 8», the address as
      it opened.
    Use the driver verbs the file already uses; where a chip text is not
    unique (the digit «1»), add the narrowest driver support, or press the
    chip inside `.ffilter`.
13. Re-seed the goldens of every existing `#/s/player-token-1*` and
    `#/s/gm-token-1*` state (the block draws above their rows), seed the
    new states, and compare every other state unchanged.
14. Specs and docs:
    - `ROUTES.md`, "Records, lists and print": under the table, a code
      block of the same shape as the Tables block:

      ```
      #/s/<token>
      #/s/<token>/f_<filter>
      ```

      and a paragraph: the token rule as today; `<filter>` is the "Filter
      grammar" with the share link's groups; an earlier build reads the
      token and ignores the segment; `#/l/` carries no segment. The table
      row for `#/s/<token>` keeps its text and points to the block.
      "Filter grammar": a row `#/s/<token>` | `kind`, `src`, `tier`, `cls`,
      `trait`, `range`, `burden`, `line`; the values sentence adds `kind`
      `weapon`/`secondary`/`armor` on a share link and `src` `community`;
      and the departure: on a share link a value no drawn entry answers
      draws no pill and narrows nothing (a table empties instead); the
      address keeps it until the next change of the filter, and it applies
      again if an entry that answers it comes back before that change; the
      copied link holds only the values in force, so it can differ from
      the address bar.
    - `CONTRACTS.md` section 1, the `#/s/<token>` bullet: add "optionally
      followed by a filter, `#/s/<token>/f_<filter>`, in the grammar and
      with the groups of `ROUTES.md`; an earlier build ignores the filter".
    - `llms.txt`, "URL grammar", the `#/s/<token>` bullet: add "A link a
      person gave you may end in a filter, `#/s/<token>/f_<filter>`, with
      the keys `kind` (`item`/`consumable`/`weapon`/`secondary`/`armor`),
      `src`, `tier`, `cls`, `trait`, `range`, `burden`, `line`, written as
      on a table; you still cannot build the token."
    - `FEATURES.md`, "Lists", the `#/s/<token>` paragraph: the block, its
      threshold and latch, the strip only while a row can narrow, the
      groups (refer to the table filter for the strip), the address and the
      copy-link button with both toasts, the values in force (the same
      departure text as `ROUTES.md`), no match, ticks surviving; the `#/l/` paragraph: the same
      filter as page memory with no copy-link button. "Tables and search":
      "The filter panel is one component across all tables and the shared
      list page"; "Filter state lives in the address" adds "on a share link
      too; on `#/l/` it is page memory".
    - `STATE.md`: the Filters row adds the `#/l/` page's picked values and
      both pages' query and fold (page memory, reset on another list); the
      URL row already covers filters.
    - `I18N.md` and `COVERAGE.md`: add the new toast and states where they
      list such things.
    - Run `node tools/decisions.js`.

**Acceptance criteria.** Each line is observable in a named test or state.

1. `parseHash` reads `#/s/<token>/f_<seg>` as the token and the filter, the
   old separator included; a stray character after the token or the
   segment keeps the token and the address (unit, fixtures).
2. `shareHash(token)` is unchanged; with a filter it writes `/f_<seg>` in
   `LIST_GROUPS` order; an empty filter writes no segment (unit).
3. The six new route fixtures pass in `hash.test.ts` and in the built-app
   replay (`app/contracts`), the trailing full stop after the segment
   included; the share probe draws `0 < rows < 10` for `src-hnf`,
   `cls-mag`, `trait-presence`, `range-far`, `burden-2` and `line-uniq`.
4. `llms.txt`, `CONTRACTS.md` and `ROUTES.md` name `#/s/<token>/f_` and the
   share link's `kind` values (`tests/contracts.js`).
5. `listFacets` answers `kind` `weapon`/`secondary`/`armor` for equipment,
   `item`/`consumable` otherwise, and `src` for every record (unit).
6. `listFacetRows` on no record and on one record returns no row (unit).
7. On the seed's 10 records it returns the rows and values of the "open"
   mock, in that order, RU and EN (unit).
8. A row whose one value every record answers is dropped; one that some
   record lacks is kept; `spellcast` offers all six traits; burden `any`
   answers both chips (unit).
9. `src` lists the catalog keys in book order, then `hb`, then own and
   frozen-copy sources by name; `community` reads «Сообщества» /
   "Communities" (unit).
10. At 100 and 300 mixed records (the limit and 3x `entries_per_list`) the
    rows are bounded by the vocabulary and filtering returns the expected
    subset (unit).
11. Below 8 drawn entries the page draws no block; at 8 it does (component
    test; the `#/l/` goldens unchanged). Once drawn, the block stays when
    the last pill is dropped, the query is cleared or a re-read shrinks the
    list below 8, and it resets when another list opens (component test).
11a. With 8 or more entries and no row that can narrow (8 Core potions), the
    block draws the search box alone: no toggle, no count, no copy-link
    button; a filter link naming a value of such a row draws no pill and
    narrows nothing (unit test of `listFacetRows`; component test).
11b. With 8 weapons that differ only by tier, the panel holds the «Ранг» row
    alone; with 8 armours from five sources, «Источник» and «Линейка»
    (unit test of `listFacetRows`).
12. On `#/s/`, a pick narrows the rows, reads «N из M» and writes the
    address with `replace`; a pill drops its value; «Сбросить всё» writes
    the bare address; the list is not read again (component test).
13. A filter link that arrives opens the panel with its values pressed
    (component test; the filter-link state).
14. A value no drawn entry answers draws no pill and narrows nothing; the
    next pick writes only the values in force (component test; fixture
    `f_range-veryfar`).
15. A re-read that removes the last entry answering a value in force drops
    it from the pills and the narrowing (component test with the fake share
    topic, as "drops a ticked entry the list no longer holds").
16. The copy-link button copies the `<site>` or `<site>en/` address with the
    segment and toasts «Ссылка на фильтры скопирована»; on a GM link it
    toasts `gmFilterLinkCopied` (component test; `~ filter link copied`
    state).
17. On `#/l/`, a pick narrows the rows, the address stays as it opened, no
    copy-link button is drawn, and another payload starts unfiltered
    (component test; `#/l/ ~ filtered`).
17a. A failed clipboard write toasts `copyFailed` (`app.copied`) and leaves
    the address unchanged (component test).
18. The query narrows the rows as a table's box does and never reaches the
    address (component test; `~ searched`).
19. No match draws «Ничего не найдено» and «Сбросить всё» (component test;
    `~ no match`).
20. A tick the filter hides stays ticked and counted; «Выбрать все» ticks
    the drawn rows only (component test; `~ filtered`).
21. Without `oncopylink`, `FilterBar` draws no link button; the tables draw
    as before (`tables.test.ts`; table goldens unchanged).
22. A long pill wraps and the page has no horizontal scroll at 360 px
    (`#/s/player-token-3 ~ long source picked`, `sweep.js 360`); short pills
    draw as before (table goldens unchanged).
23. Axe: no violations with the panel open, with picks, with the copy-link
    button, and on no match (`expectNoA11yViolations`).
24. English: the strip, the panel labels, both toasts and the no-match line
    read in English (component test; goldens run both languages).
25. Every state in the States table and every row of the Error scenarios
    table has its proof.
26. `ROUTES.md`, `CONTRACTS.md`, `llms.txt`, `FEATURES.md`, `STATE.md`,
    `I18N.md`, `COVERAGE.md`, the fixtures and `docs/DECISIONS.md` match the
    code in the same commit.

**States (scale check).**

| State | Shows | Proof |
|---|---|---|
| empty list (0 entries) | today's page, no block | unchanged (`#/l/ ~ every entry gone`) |
| one entry | no block | unit 6; component test 11 |
| 2-7 entries | no block | `#/l/ ~ shared` (3) unchanged |
| many (10) folded | block, «Фильтры», «10» | `#/s/player-token-1` re-seeded |
| many, panel open | 8 rows | `~ filters open` |
| many, a filter link arrives | panel open, pills, link button, «3 из 10» | `#/s/player-token-1/f_kind-weapon.tier-1` |
| many, filtered and folded | pills, link button, bar counts a hidden tick | `~ filtered` |
| many, no match | «0 из 10», «Ничего не найдено», «Сбросить всё» | `~ no match` |
| many, no row can narrow (8 alike) | the search box alone | unit 11a; component test 11a |
| many, one row can narrow (8 weapons by tier) | the strip with «Ранг» alone | unit 11b |
| `#/l/` with 8 entries, filtered | the strip and pill, no copy-link button, the address as opened | `#/l/ ~ filtered` |
| at the limit, 100 entries | as many; every row but `src` is bounded by its vocabulary; `src` holds one value per catalog, own (20, 60 at 3x) and frozen-copy source, so the open panel can be several screens tall at 360 px, in the page flow (accepted) | unit 10 |
| one past the limit | not applicable: the page reads; the refusal is the owner's write path | - |
| 3x, 300 entries | as at the limit; the longest segment (every value of every group, own keys of 19 characters) stays under the 16384 characters `dhloot.auth.return` accepts | unit 10 |
| longest name: 80-code-point source | the chip and the pill wrap | `#/s/player-token-3 ~ long source picked` |
| longest item name: 120 code points | the row wraps as today | same state |

Each state at 360 px and 1180 px: `node tests/app/sweep.js 360` and `1180`.
At many and at the limit: rows keep the list's order; «Сохранить себе» stays
first under the lead (rule 9); the open panel at 360 px is about one screen
tall on the seed list and up to several at the limit (the `src` row), in
the page flow; with the keyboard open for the search box nothing
sticky grows; the only sticky region is the selection bar, unchanged.

**Error scenarios.**

| Scenario | Screen | Stored data |
|---|---|---|
| Loading | nothing drawn until the first read, no block (unchanged); the address keeps its segment | none written |
| Failed read | «Список не загрузился» and «Повторить», no block; the address kept | none |
| Failed write | not applicable: the filter writes only the address | - |
| Offline | the last read draws; the filter works on it | none |
| Conflict: the owner edits while a reader filters | the re-read redraws; facets recompute; a value with no entry left stops applying (no pill); the query stays; «Список обновлён» announced | none |
| A named record deleted | the entry is dropped as today and leaves the facets | none |
| The share or the list deleted | «Список больше не доступен», the address with its segment kept | none |
| Stale tab (previous bundle) | reads the token, ignores the segment: the whole list, no strip | none |
| Revert (previous frontend) | the same as a stale tab; a filter link still opens the list | none |
| Sign-in from the page | `dhloot.auth.return` returns to the filtered address | unchanged shape |
| A players' link naming a GM-only value | the value draws no pill and narrows nothing | none |
| Clipboard write fails | the `copyFailed` toast (`app.copied`); the address unchanged | none |

No path loses stored data: the batch stores nothing beyond the address.

**Consistency.**

- Follows rules 9 (the primary action stays first), 14 (the one new
  string has RU and EN with the same facts, ASCII ` - `) and 16 (the pill
  fix).
- Siblings: the tables - the same strip, pills, «N из M», copy-link button
  and toast, address written with `replace`, a link opening the panel, the
  same no-match line and reset; one departure, named in `ROUTES.md` and
  `FEATURES.md`: a value no drawn entry answers is ignored instead of
  emptying the page. Search - the same placeholder and matching. The lists
  index - the same `LIST_SEARCH_AT` threshold. The share panel - the GM
  toast follows `gmShareCopied`'s warning.
- The Type row names equipment by the equipment tables' tab words where
  search says «Снаряжение»: a list mixes the three that the tables split.
  No confirm or undo is added; the selection bar is unchanged.

**RU/EN parity.** One new string, `gmFilterLinkCopied`, both languages, the
same facts. Reused keys: `kindF`, `fItems`, `fCons`, `subWeapon`,
`subSecondary`, `subArmor`, `source`, `srcComm`, `srcHomebrew`, `tier`,
`voaArtifact`, `eqClass`, `eqTrait`, `eqRange`, `eqBurden`, `eqLineF`,
`filters`, `anyValue`, `outOf`, `resetAll`, `dropValue`, `filterLink`,
`filterLinkCopied`, `nothing`, `searchPh`; the `EQ_*` pairs. No plural.

**Verification commands.**

```text
rtk npm run check                                   (Bash timeout 600000)
npm run check:built
npm run build:test
node tests/run-all.js contracts,dataint
node tests/run-all.js app/print,app/contracts,app/states,app/typo,app/hues,stub
MSYS_NO_PATHCONV=1 node tests/app/golden.js --only="#/s/..."   (re-seed, per state)
node tests/app/golden.js --shard=1/4  ... --shard=4/4           (compare, one call each)
node tests/app/sweep.js 360
node tests/app/sweep.js 1180
```

Use the re-seed flags `tests/app/golden.js` documents; run each shard and
each sweep width in its own foreground call. The pooled run (`CLAUDE.md`,
"Quality gates") includes `app/typo`, which opens the `eq_weapon` filter
panel that the pill change touches. The two inner sweep widths run in CI.

**Risks and do-nots.**

- Do not write a segment on `#/l/`, and do not change how `parseHash` reads
  `l/`.
- Do not prune ticks to the filtered rows; do not write the filter to
  `localStorage` or the account; the query never reaches the address.
- Do not add counts on chips or cross-row narrowing (decided).
- Do not read `Record_.tier` for the `tier` group.
- A filter write must not re-open the share (`view.open`): check that the
  `open` effect does not re-run on `replace`.
- `.fpill` must keep `flex: none`, or short pills shrink and wrap, which
  changes table goldens.
- The route fixtures name a seeded token; the built-app replay may need to
  wait for the share read (step 9).
- Keep the edits to `SharedListPage.svelte` in one block and one derivation
  chain: TASK 70 edits the same file.
- The block's latch is the only path that keeps it drawn; never derive
  `finding` from the current entry count alone, or the focused control can
  vanish.
