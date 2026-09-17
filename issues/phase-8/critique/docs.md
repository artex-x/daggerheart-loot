# Phase 8 critique: specs and developer docs vs the code

Read-only audit of `CLAUDE.md`, the eight `docs/specs/*.md`, both READMEs,
`.claude/README.md` and `docs/REFACTOR_PLAN.md` after R0c (`d6371e7`), its
remediation (`fdd015f`), closeout (`5dcce33`, `d78b60f`, `d5e3e5a`) and the
stub untracking (`f53f44d`). No heavy commands were run.

Ranked by how likely the error is to mislead the next batch.

## Worth doing

### DC1 - `dhloot.prefs.v1` does not exist in the shipped app

**Claim** - `docs/specs/STATE.md:29`:

> | `dhloot.prefs.v1` | `{ view: 'list' \| 'grid' }` |

and `docs/specs/STATE.md:15-16`:

> Table view, language and starting section describe the app's behaviour, so
> they persist

Same row in `README.md:217` ("table view (list or grid) and the height of note
fields") and `README.ru.md:223`.

**Code** - `app/src/state/app.svelte.ts:40-42` is the whole set of preference
keys the app knows:

    const LANG_KEY = 'dhloot.lang.v1';
    const HOME_KEY = 'dhloot.home.v1';
    const WARN_KEY = 'dhloot.warn.v1';

plus `LISTS_KEY`/`LISTS_KEY_V1` in `app/src/state/lists.svelte.ts:24-25` and
`PROBE` in `app/src/ports/storage.ts:10`. A repository-wide search for
`dhloot.prefs` returns only the three documents above and
`issues/47/plan.md:1456`, which records the removal as deliberate:

> Dropped: the `dhloot.prefs.v1` group, which guards a feature the rewrite
> deliberately removed

The view itself is component-local memory,
`app/src/components/TablesPage.svelte:91`:

    let view = $state<'list' | 'grid'>('list');

**Which side is wrong**: the documents. This is not a public contract -
`CONTRACTS.md` freezes routes, ids, link encoding, generated data and asset
paths, not `localStorage` keys - and the drop is recorded as an owner-visible
decision, so the code is behaving as intended.

**Smallest fix**: delete the `dhloot.prefs.v1` row from `STATE.md`, `README.md`
and `README.ru.md`; strike "Table view" from `STATE.md:15-16` so the sentence
reads "Language and starting section describe the app's behaviour, so they
persist". `STATE.md:74` already lists `view` correctly under memory-only
`tables {t, q, view, anchor}`, so the file currently contradicts itself and one
half of it is already right.

**Effort/value**: three line edits; high value. This is the exact failure mode
the task description names - a spec confidently describing behaviour the code
does not have. A batch touching table view or storage would read `STATE.md`,
find a key, and either look for a bug or restore a removed feature. It is also
a user-visible regression from the live app (view no longer survives a reload)
that no `DEBT.md` entry owns - see the gap note at the end.

### DC2 - COVERAGE.md's "Known thin spots" names five deleted suites in the present tense

**Claim** - `docs/specs/COVERAGE.md:314-315`:

> The short (`~`, deflate) link form is exercised by `lists2` and `notes`
> through the share buttons

`:318-319`:

> `print` and `app/print` check geometry against the design's numbers

`:322-323`:

> `states` walks click-only states but does not assert much about them

`:324`:

> Touch-only behaviour is checked statically in `craftmob`

**Code**: none of `tests/lists2.js`, `tests/notes.js`, `tests/print.js`,
`tests/states.js` or `tests/craftmob.js` exists. `tests/` holds five suite
files (`contracts.js`, `craft.js`, `dataint.js`, `derived.js`, `stub.js`) plus
`run-all.js`; `tests/app/` holds seven (`contracts`, `golden`, `hues`, `print`,
`states`, `sweep`, `typo`) plus three helpers. `tests/run-all.js`'s `SUITES`
array names no such suite. COVERAGE.md's own line 16-21 says so:

> R0c (issue 47, `23c00a6`) deleted the static root ... and the fourteen
> browser suites that drove it ... Twelve suite files remain

**Which side is wrong**: the document. `docs/REFACTOR_PLAN.md:5-7` claims R0c
"rewrote every document so no present-tense instruction names a file it
deleted"; this section is the counter-example.

**Smallest fix**: re-point each bullet at the surviving home the fate table
(COVERAGE.md:52-73) already names - `lists2`/`notes` -> `tests/app/states.js`
cases 13/17/22 and the share-button jsdom tests; bare `print` -> drop, leaving
`app/print`; `states` -> `tests/app/states.js`; `craftmob` -> the bullet at
`:359-366` already restates this correctly for the rewrite, so `:324-326` is a
duplicate that can be deleted outright.

**Effort/value**: four bullets; high value. "Known thin spots" is the one
section of COVERAGE.md that is explicitly a *current* list rather than a
record, so a reader has no cue to discount it, and a Phase 8 batch closing a
thin spot would start by looking for a file that is not there.

### DC3 - three spec citations of symbols that exist nowhere in the tree

**Claim** - `docs/specs/ROUTES.md:47`:

> Table names (`TABLE_DEFS`): `core_item`, `core_consumable`, ...

`docs/specs/FEATURES.md:55`:

> 15 tables (`TABLE_DEFS`), each with its own search box and a list/grid switch.

`docs/specs/ROUTES.md:24`:

> These nine are also the tab bar (`TAB_LIST`) and the nine a person may pin

**Code**: `git grep TABLE_DEFS -- app tests tools` returns nothing outside
those two spec lines. The real exports are in `app/src/lib/types.ts:28` and
`:53`:

    export const TABLE_IDS = [ 'core_item', ... ] as const;   // fifteen, correct
    /** The nine sections: also the tabs, also what may be pinned as the start. */
    export const SECTIONS = [ 'roll/std', ... ] as const;

`TAB_LIST` survives only inside a prose comment in `app/src/lib/frames.ts:4`
and one in `app/src/state/app.test.ts:68`, both describing the live app.

**Which side is wrong**: the documents. Both were `app.js` names; the lists
themselves are correct (fifteen tables, nine sections, names match).

**Smallest fix**: `TABLE_DEFS` -> `TABLE_IDS` (`app/src/lib/types.ts`),
`TAB_LIST` -> `SECTIONS` (same file), three occurrences.

**Effort/value**: three token swaps; moderate value. An agent told to read the
route grammar's implementation greps for a symbol and finds nothing, which
reads as "the spec is ahead of the code" rather than "the spec used the old
name".

### DC4 - ROUTES.md does not document the `frames` table alias, and positively contradicts it

**Claim** - `docs/specs/ROUTES.md:51-53`:

> A name that is not in that list is ignored and the table already on screen is
> kept.

The list at `:47-49` does not include `frames`. ROUTES.md:7-8 names the whole
implementation as "`parseHash()` ... plus `TABLES_RE` and `legacySource()`",
omitting the alias map.

**Code** - `app/src/lib/hash.ts:39` and `:104`:

    const TABLE_ALIASES: Record<string, TableId> = { frames: 'other_frames' };
    ...
    const table = name ? (TABLE_ALIASES[name] ?? (isTableId(name) ? name : null)) : null;

`#/tables/frames` therefore resolves to `other_frames` rather than being
ignored. `docs/specs/CONTRACTS.md:18` freezes exactly this and says the
opposite of ROUTES.md:

> legacy `frames` resolves to `other_frames` without rewriting the pasted hash

It is also load-bearing elsewhere: `app/src/state/app.svelte.ts:78`
special-cases a stored pin - `if (v === '#/tables/frames') return
'#/tables/other_frames';` - and `#/tables/frames` is a registered golden state
in `tests/app/inventory.js`.

**Which side is wrong**: ROUTES.md. The behaviour is frozen by CONTRACTS.md and
covered by a golden, so the code is right and the two specs disagree.

**Smallest fix**: one sentence after ROUTES.md:49 - "`frames` is a legacy alias
resolving to `other_frames` (`TABLE_ALIASES` in `hash.ts`); the address is not
rewritten" - and add `TABLE_ALIASES` to the implementation list at `:7-8`.

**Effort/value**: one sentence; moderate value. ROUTES.md is the named
authority for route grammar, and a reader who trusts `:51-53` over
CONTRACTS.md:18 would conclude the alias is a bug and delete it.

### DC5 - I18N.md describes the *live* dictionary's value shapes, not `dict.ts`'s

**Claim** - `docs/specs/I18N.md:9-11`:

> Some values are HTML (the help panels), most are plain strings, and a few are
> nested groups.

**Code** - `app/src/lib/dict.ts:351`:

    export type Dict = Record<keyof typeof ru, string>;

Every value is a `string`, so a nested group would not typecheck. A search for
a nested object literal in `dict.ts` returns nothing. The help panels are not
in the dictionary at all and are not HTML: `app/src/lib/help.ts:34` defines
`export type HelpPart = string | HelpLink | HelpBold | HelpBreak`, a structured
tree the components render as real nodes.

**Which side is wrong**: the document; it is an unrevised sentence about
`app.js`'s `T`.

**Smallest fix**: replace the sentence with "Every value is a plain string
(`Dict` is `Record<keyof typeof ru, string>`); the help panels are structured
parts in `app/src/lib/help.ts`, not dictionary entries."

**Effort/value**: one sentence; moderate value - it invites a change that fails
`npm run typecheck`, and it points at the wrong file for help text.

**The neighbouring claim is correct, and I checked it because the task asked.**
I18N.md:11-13 and `:25-26` say key parity is a compile error in both
directions. It is. `dict.ts:353` declares `const en: Dict = { ... }` - an
annotated fresh object literal, so TypeScript's excess-property check fires on
an English-only key, and the `Record<keyof typeof ru, ...>` requirement fires
on a missing one. Had `en` been declared bare and only narrowed at
`dict.ts:637` (`const DICTS: Record<Lang, Dict> = { ru, en }`), the
English-only direction would *not* have been caught, because freshness does not
propagate through a shorthand property. The annotation is what makes the spec
true; worth knowing before anyone "tidies" it.

### DC6 - META.md and CLAUDE.md disagree on what language tests are written in

**Claim** - `docs/specs/META.md:83-85`:

> Interface text and test messages are Russian. English only in code comments
> and in the machine-facing files

**Claim** - `CLAUDE.md:139`:

> Comments explain why. Source, identifiers, tests, and developer docs are English.

**Code**: both are half-true and neither says so. `tests/run-all.js` prints
Russian throughout - `'таких наборов нет: '`, `' наборов упало'`, and every
`SUITES` label such as `['app/sweep', 'dist/: обход страниц 1180', 370,
['1180']]`; `tests/stub.js:24` asserts with `'заглушка i/w3.html
прокручивается вбок на '`. The vitest suites under `app/src/**/*.test.ts` are
English.

**Which side is wrong**: neither exactly; they overlap with different wording
and no arbiter, which is the "same rule stated twice" failure the task asks
about.

**Smallest fix**: make META.md section 6 name the split - "the `tests/`
node/browser suites print Russian; `app/src/**/*.test.ts` is English" - and
leave CLAUDE.md as the rule for new code.

**Effort/value**: one clause; moderate value, because a writer adding a suite
has to guess today.

## Noticed, not worth it

- **DC7 - the sweep citation's sha does not resolve as a git ref.**
  `docs/specs/DEBT.md:391` and `docs/specs/COVERAGE.md:377-378` both write
  "`issues/47/sweep.md`, read at `7a33c22`", and thirteen of D12-D23 cite
  `app.js:N` (`7a33c22`). The `app.js` half is sound: `git show 7a33c22:app.js`
  line 2959 returns D12's quoted
  `(m === cur ? ' aria-current="true"' : '')` verbatim, and line 4142 returns
  D13's `copyRich(rollHtml(items), rollText(items), t().rollCopied)`. But
  `git show 7a33c22:issues/47/sweep.md` is `fatal: Not a valid object name` -
  `sweep.md` was first committed later, at `5b2e693`. The file is in the
  working tree, so nothing is lost in practice; the sha just cannot be used the
  way the `app.js` ones can. One clarifying word ("written while HEAD was
  `7a33c22`") would fix it.
- **DC8 - a dangling section cross-reference.** `docs/specs/DEBT.md:413` cites
  `docs/specs/COVERAGE.md`, "The harness". COVERAGE.md has no such heading; the
  content described (`d.controls()` never reads `aria-pressed`) is under
  "`tests/app/*` - the same real Chrome, against `dist/` (B12)", the
  `app/golden` row at `:85`. It is the only dangling section reference I found
  across the specs.
- **DC9 - a deletion that was undone.** `docs/specs/COVERAGE.md:192-194` says
  "Three things existed with **no caller**: a `Button.svelte`, a `statLabels`
  helper ... The first two were deleted". `statLabels` is indeed gone;
  `app/src/components/Button.svelte` exists, and `vite.config.mts:197` carves
  out a named coverage threshold for it with a comment about "its own tests -
  seven of them". The sentence sits in a past-tense "what this found the day it
  was turned on" section so it is not strictly false, but it reads as a
  standing fact.
- **DC10 - a stale comment in `.gitignore:41`**: "Build output of the new app
  (issue #47). The live site is still in the root." The root app was deleted at
  `23c00a6`. Outside the documents named in the brief, but it is the same class
  of error and is one line.
- **DC11 - a run-all comment about a deleted suite.** `tests/run-all.js:74-77`
  explains `--exclude=` entirely in terms of `parity.js --shard` and "the same
  867s", a suite deleted at R0c. The flag still works generically; the worked
  example no longer exists.
- **DC12 - a slightly wrong pointer in `CLAUDE.md:96-98`**: "update every file
  `tests/derived.js`'s `COUNTERS` list names". `COUNTERS`
  (`tests/derived.js:436`) names *counter regexes*; the nine file names are the
  separate unnamed array at `tests/derived.js:448-450`. The count "nine" that
  COVERAGE.md:55 quotes is correct - I counted the array.
- **DC13 - one feature with no registered state.** `FEATURES.md:155-157`
  describes the `NoData.svelte` "data did not load" screen as the rewrite's own
  state; it has no `tests/app/inventory.js` entry and no "Known thin spots"
  line. It is unreachable by address (it needs `data.js` blocked), so a golden
  is arguably impossible and vitest covers it - but `CLAUDE.md`'s "a new state
  gets an inventory entry" rule has no recorded exception for it.
- **DC14 - two live task contexts point at a deleted runbook.**
  `issues/56/context.md:38` and `issues/59/context.md:25` both cite
  `docs/parity.md`, which R0c deleted. Other-task state, not mine to change,
  but those are in-flight tasks that will read it.

## What I verified and found correct

Recorded so Phase 8 does not re-derive it.

- **CONTRACTS.md, all five sections.** Section 1's grammar and group keys match
  `hash.ts`/`filters.ts` (`range`/`burden`, not `rg`/`bu`). Section 3's stamp is
  exactly `app/src/lib/listLink.ts:74`, and `~`/`$` as the list-note and money
  ids are `N_LIST`/`N_MONEY` at `:37,39`. Section 5's `i/` edit at `f53f44d` is
  accurate **and** complete: `git ls-files i/` is empty, `.gitignore` carries
  the entry with its reasoning, `ci.yml:191-194` records the
  Build-before-Collect ordering, and `dist/index.html` plus `dist/assets/app.js`
  match `vite.config.mts:92,107` (`base: './'`, `format: 'iife'`). The
  asset-id-vs-record-id paragraph matches `tools/build-share-pages.js`.
- **FEATURES.md's numbers, all of them, recomputed from `data.json`**: 1091
  records; 317 weapons / 108 secondary / 90 armour across all sources;
  239 / 73 / 69 for Core plus Hope & Fear; 15 tables; 119 Wondrous.
- **COVERAGE.md's counts**, which the brief flagged as re-derived under time
  pressure, are right: twelve suite files (five in `tests/`, seven in
  `tests/app/`), eighteen `run-all.js` rows, nine `COUNTERS` files, 28 route
  fixtures, six list fixtures, 110 `STATES` entries with `LANGS = ['ru','en']`,
  twenty-two `CASES` in `tests/app/states.js`, and all four threshold rows
  (`src/lib` 95/95/85/90, `src/ports` 70/80/55/70, components 85/80/75/85,
  `src/state` 95/95/85/90) against `vite.config.mts:168-203`. The claim that
  `craft`, `dataint`, `derived` and `stub` all read `i/` off disk is true of all
  four. The one omission is the two named per-file exceptions
  (`DiceBar.svelte` branches 55, `Button.svelte` branches 60), which the prose
  does not mention.
- **DEBT.md** is the most accurate file in the set. D1-D23 with the D9 gap;
  every cited sha resolves (`23c00a6`, `bb61db0`, `b967481`, `a52c17d`,
  `dc99f21`, `676629d`, `7a33c22`); `git show 23c00a6^:app.js`, `:style.css`
  and `:index.html` all read; and the rewrite-side line citations I spot-checked
  land on the right line - D3 (`StorageNotice.svelte`, the
  `<button class="warn-x">` inside `<summary>`), D5 (`Shell.svelte:28`
  `document.title = app.t.docTitle;`), D12 (`Chip.svelte:65`
  `aria-pressed={on}`), D13 (`StdPanel.svelte:68` and `AltPanel.svelte:96` both
  `t.textCopied`, and `dict.ts` has no `rollCopied` key).
- **META.md sections 1-5 and 7**: the `noindex` tag is in `app/index.html`,
  `robots.txt` says `Allow: /` and names all eight training crawlers, and
  `base: './'` with `format: 'iife'` is what section 4 requires.
- **STATE.md's two-tab merge** matches `mergeLists`
  (`app/src/lib/lists.ts:101-109`) and `ListStore.save`/`watch` exactly,
  including the session tombstone. The `dhloot.home.v1` description, including
  "reading also accepts a bare `#/tables` from an older pin", matches
  `readHome` (`app/src/state/app.svelte.ts:66-83`).
- **ROUTES.md's filter grammar** - the legacy underscore separator heuristic,
  the fail-open on an unknown group, and the per-table group lists - matches
  `decodeFilter`/`groupsFor` row for row.
- **CLAUDE.md's commands** all work as written: every suite name in its two
  `run-all.js` examples is in `SUITES`, and all four cross-references into
  `.claude/README.md` ("Host-aware explicit routing policy", "Run a long check",
  "Batch size and the fixed cost of a run", "Hooks") resolve to real headings.

## A gap nothing owns

Table view no longer surviving a reload (DC1) is a live-app feature the rewrite
dropped. That is precisely what `docs/specs/DEBT.md` exists to hold - "live
decisions kept over the rewrite's own", or its converse - and no entry covers
it. Deleting the `dhloot.prefs.v1` rows without recording the drop somewhere
turns a known decision into an undocumented regression. The same applies to the
note-field height the READMEs attribute to that key.

## Noted, out of scope

The documentation set's structure is sound and I am not proposing changes to
it. Two observations only, for the owner rather than for a batch: COVERAGE.md
at 431 lines mixes a historical record (the twenty-row fate table, "The rewrite
against the app it replaces") with a current list ("Known thin spots"), and DC2
is the direct cost of that mixing; and `docs/specs/DEBT.md` at 740 lines is now
larger than the six other specs combined, which is fine while it is Phase 8's
input register and worth revisiting once entries start being paid off.

## Verdict

**fix-then-continue.** The specs are substantially trustworthy: every frozen
contract, every count, every threshold and every commit citation I checked is
correct, and `DEBT.md` - the file Phase 8 depends on most - survived scrutiny
intact, quoted line numbers included. The R0c pass did the hard, mechanical
half well. What it did not do is re-read the narrative prose against the code
it had just changed, and all six worth-doing findings are that same failure:
`STATE.md` and both READMEs still document a storage key the rewrite deleted;
COVERAGE.md's only current-state section names five deleted suites in the
present tense; ROUTES.md and FEATURES.md cite three `app.js` symbols that no
longer exist; ROUTES.md flatly contradicts CONTRACTS.md on the `frames` alias;
and I18N.md describes the old dictionary's value shapes. DC1 and DC4 are the
two that would actively cost a batch time - one sends a reader looking for a
key that is not there, the other sends one to delete a frozen alias. All six
are single-sentence edits in a single commit, and none of them touches a public
contract. Treat the specs as reliable on contracts, counts and coverage
mechanics, and as needing one verification pass on any sentence that describes
what the app remembers or which suite watches what.
