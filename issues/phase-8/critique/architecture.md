# Critique - architecture: decomposition, dependency structure, domain model

Read-only review, TASK phase-8, 2026-09-17. Scope is the shape of the code:
which modules exist, what depends on what, and whether the types model the
domain. Compliance with `CLAUDE.md`'s stated boundaries is `components.md`'s
and `hygiene.md`'s; correctness is `state.md`'s and `resilience.md`'s.

Counts below are from `git grep` over `app/src`, excluding `*.test.ts`.

---

## Map

**The layers are real, and they hold.** `app/src/lib/` (25 modules) imports
nothing outside itself - not Svelte, not `ports/`, not `state/`, verified by
the full import list. `ports/` (10 adapters) imports `lib/` types downward and
never upward. `state/` imports `lib/` and `ports/`. Components import `lib/`
and `state/`. **No component imports `ports/` directly** - only `main.ts` and
`App.svelte` name it. Nothing imports `components/` except `components/` and
`App.svelte`.

**There are no import cycles anywhere** - not in `lib/`, not among the 46
components. `lib/` is a DAG whose longest chain is five hops
(`alt -> data -> money -> dict -> types`). `types.ts` is the sink: 40
importers, zero imports of its own. Then `dict.ts` (22) and `data.ts` (18).
Component depth is about five (`App -> ListPage -> RecordModal -> RecordCard
-> Icon`). This is a shallow, acyclic, conventionally-layered graph, and for a
hand-migrated app of this size that is a good result. Say so before reading the
findings: **the decomposition is sound.** Everything below is local.

**The graph's real shape is a star, not a stack.** `state/app.svelte.ts`'s
`AppState` is imported by 21 of 47 component files and reaches every screen as
a prop. It is the app-scope store (route, lang, selection, toasts, lists) *and*
a facade over URL building *and* - through its public `readonly env: Env` -
the only path from a component to a port. Ten components make 28 calls of the
form `app.env.PORT.METHOD()`. So the honest layering is
`lib -> ports -> state -> components` **plus one tunnel**: components reach
`ports` through `AppState.env`. No rule catches it, because the import is
`import type { AppState }` (A2).

**What to tell a new contributor.** Three sentences:

1. Pure rules, formats and text go in `app/src/lib/` - it may import only other
   `lib/` modules, and `types.ts` is where a shared type lands because it
   imports nothing.
2. Anything that touches a browser API gets a `ports/` adapter with a `browser*`
   and a `fake*` implementation, is wired into `Env`, and is called from
   `state/`, not from a component.
3. Anything a second screen needs to see goes on `AppState`; anything one
   subtree owns stays a `$state` in that subtree - which is why `menuFor` and
   `sel` are on `AppState` and `open` is not.

Rule 2's second half is the one the code does not yet obey; rules 1 and 3 it
obeys consistently.

---

## Findings

### A1 - the table taxonomy is written out twice, and one copy bypasses `dict.ts`

**Modules:** `app/src/lib/label.ts:169-193` vs `app/src/lib/tables.ts:46-85`.

`tables.ts` owns the nine table groups and their sub-labels as `TableId` lists
plus `keyof Dict` keys. `label.ts` declares the *same nine groups in the same
order with the same subs*, but with the Russian and English strings inlined as
literals, and `whereFrom` (`label.ts:202-212`) resolves against that copy.

**Evidence** - every literal in `label.ts` is byte-identical to the dict value
`tables.ts` already names for that table:

| table | `tables.ts` key | `dict.ts` ru | `label.ts` literal |
|---|---|---|---|
| core group | `srcCore` (:47) | `Core` (:56) | `Core` (:170) |
| alt group | `alt` (:49) | `Альт. таблицы` (:30) | `Альт. таблицы` (:172) |
| equipment | `grpEquipment` (:57) | `Снаряжение` (:186) | `Снаряжение` (:177) |
| other | `grpOther` (:62) | `Прочее` (:187) | `Прочее` (:178) |
| `core_item` sub | `fItems` (:74) | `Предметы` (:104) | `Предметы` (:182) |
| `other_frames` sub | `subFrames` (:84) | `Сеттинги` (:189) | `Сеттинги` (:192) |

All nine groups and all eleven subs match, in order, in both languages.

**What is wrong:** one product fact has two sources of truth, and the second
one is invisible to anything that reasons about `dict.ts`. Renaming a table
group in the dictionary changes the tables page and silently leaves the record
page, the print card and the share stub saying the old thing - `whereFrom` is
what those three draw (`label.ts:8-14`).

**Smallest move:** delete `GROUPS` and `SUBS` from `label.ts`; have `whereFrom`
call `groupOf(table)` / `subLabelOf(table)` from `tables.ts` and resolve the
keys through `dict(lang)`, which `label.ts` already imports (`:21`). New edge
`lib/label -> lib/tables`; `tables.ts` imports only `types` and a `Dict` type,
so no cycle.

**Risk:** `whereFrom` output is rendered on record pages, print cards and share
stubs, so it is inside the structural goldens - but the strings are identical,
so **no golden moves**. `label.test.ts` pins the strings and should pass
unchanged; that is the check that proves the merge.

**Effort/value:** ~25 lines deleted, one import added. High value, low effort.
**Do this first.**

---

### A2 - the ports layer is bypassed through `AppState.env`

**Modules:** `app/src/state/app.svelte.ts:86` (`readonly env: Env`), and ten
components.

**Evidence** - 28 call sites reach a port directly from markup logic:
`AltPanel.svelte:95,159`; `ListPage.svelte:191,192,206,213,334,469`;
`ListsPage.svelte:67,68,73,85`; `PrintPage.svelte:68,73,77`;
`RecordActions.svelte:47,53,59,64,70`; `RollPanel.svelte:89`;
`SelBar.svelte:39`; `StdPanel.svelte:67,76`; `StorageNotice.svelte:22`;
`TablesPage.svelte:174,220,225`. Eight of the ten ports are reached this way.

The claim "no component imports `ports/`" is true and meaningless: the
dependency is there, it is just spelled `app.env`.

**What this causes, measurably.** The most repeated operation in the app has no
home, so it is written out 14 times:

    const ok = await app.env.clipboard.writeRich({ html, plain: text });
    say(ok ? t.textCopied : t.copyFailed, !ok);

`env.clipboard` appears 14 times across 8 components (`RecordActions` 4,
`TablesPage` 3, `ListPage` 2, one each in `AltPanel`, `ListsPage`,
`PrintPage`, `SelBar`, `StdPanel`), each followed by the same ternary.

**This is what `components.md` C1 is a symptom of.** The ten `say` shims are
not duplication for its own sake: `AppState.say(msg, opts)`
(`app.svelte.ts:265-268`) takes an options object, the copy-with-toast idiom
wants `(msg, error)`, so each caller writes the three-line adapter
(`AltPanel.svelte:54-56`, `ListPage.svelte:173-175`, `ListsPage.svelte:32-34`,
`PrintPage.svelte:63-65`, `RecordModal.svelte:51-53`) and then threads it as a
prop *next to `app`*, which the same component already has
(`RecordActions.svelte:41` takes both `app` and `say`). The shim exists because
there is no seam between "a component wants something done" and "a port does
it".

**Smallest move, in two independent steps:**

1. Give `AppState` one method - `async copied(run: () =< Promise<boolean>,
   ok: string): Promise<void>` - that runs the port call and toasts
   `ok` / `t.copyFailed`. Converts 14 two-line sites to one line each, and
   removes the reason five of the `say` shims exist.
2. Leave the remaining `env` reads (`random`, `dialog.print`, `drag.bind`,
   `storage.works`) alone; they are single-use and a wrapper would be
   abstraction ahead of need.

**Risk:** toast text, mode and duration must not move; the failure message is
`t.copyFailed` in every one of the 14 sites, so the collapse is exact. Toasts
are transient and not in the goldens. Component tests assert on the rendered
toast, so they are the gate. Touches 8 files - size it as one batch with one
`npm run check`.

**Effort/value:** medium effort, high value. **Do this second.**

Not proposed: making `env` private, or routing every port through `AppState`.
That is the "consistent storage layer" ticket's shape and is fenced off.

---

### A3 - `MoneyMode` and its default are declared twice, and one file imports one of each

**Modules:** `app/src/lib/money.ts:13,16,17` and `app/src/lib/listLink.ts:21,43,44`.

    money.ts:13     export type MoneyMode = 'bag' | 'coin';
    money.ts:16     export const MONEY_MODES: readonly MoneyMode[] = ['bag', 'coin'];
    money.ts:17     export const MONEY_DEFAULT: MoneyMode = 'bag';
    listLink.ts:21  export type MoneyMode = 'bag' | 'coin';
    listLink.ts:43  const MONEY_MODES: readonly MoneyMode[] = ['bag', 'coin'];
    listLink.ts:44  const MONEY_DEFAULT: MoneyMode = 'bag';

**Evidence that this already confuses callers:** `state/lists.svelte.ts:20-21`
imports the *type* from `listLink.js` and the *default* from `money.js`, two
lines apart. `ListPage.svelte:37` imports `MoneyMode` from `listLink.js`;
`SharedListPage.svelte:20` imports `moneyMode` from `money.js`.

TypeScript unifies the two unions structurally, so adding a third mode to one
and not the other is not a compile error - it is a silently wrong default in
whichever half was missed.

**Smallest move:** delete the three declarations from `listLink.ts`; add
`import type { MoneyMode } from './money.js'` and import the two constants.
Checked: `money.ts` has only type-only imports (`:10-11`), so it is a runtime
leaf and `listLink.ts` stays one too - no runtime weight, no cycle.

**Risk:** none behavioural. **Effort/value:** six lines, high value.

---

### A4 - `Rarity` is declared twice and the ordered list three times

**Modules:** `app/src/lib/money.ts:101`, `app/src/lib/roll.ts:60-62`,
`app/src/lib/alt.ts:24-30`.

    money.ts:101  export type Rarity = 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary';
    roll.ts:60    export const RARITY_ORDER = ['common', ..., 'legendary'] as const;
    roll.ts:62    export type Rarity = (typeof RARITY_ORDER)[number];
    alt.ts:24     export const RARITIES: readonly Rarity[] = ['common', ..., 'legendary'];

`alt.ts` imports the type from `money.js` (`:15`) and `nextRarity` from
`roll.js` (`:16`) - so `bumpUp` (`:130`) passes a `money.Rarity` into a
function typed on `roll.Rarity`, and it compiles only because the two unions
happen to be identical. `alt.ts:24` is then a third hand-written copy of the
same ordered list.

**The failure mode is concrete.** Add a rarity to `RARITY_ORDER` and not to
`money.ts:101`: `nextRarity` returns it, `BUMP[to]` (`alt.ts:116`) has no key,
`bumpUp` returns `null`, and the critical-success "bump up" button silently
disappears. Nothing in `npm run check` says why.

**Smallest move, two lines:** in `roll.ts`, replace `:62` with
`import type { Rarity } from './money.js'` and annotate
`RARITY_ORDER: readonly Rarity[]`. Then `alt.ts:24` becomes
`export const RARITIES = RARITY_ORDER` - the `alt -> roll` edge already exists.
Checked: `roll.ts -> money.ts` is a new edge, `money.ts` imports only types,
no cycle.

**Risk:** none behavioural; both lists are already identical.
**Effort/value:** tiny effort, removes a silent-divergence class.

---

### A5 - `EQ_TABLE` is the same name for two inverse maps in two modules

**Modules:** `app/src/lib/label.ts:133-137` and `app/src/lib/filters.ts:30-34`.

    label.ts:133    const EQ_TABLE = { weapon: 'eq_weapon', ... } as const;   // EquipKind -> TableId
    filters.ts:30   export const EQ_TABLE: Record<string, EquipKind> = {   // TableId -> EquipKind
                      eq_weapon: 'weapon', ... };

One name, two directions, two homes, and `facets.ts:22` imports the exported
one while `label.ts` keeps the private one. A reader who greps `EQ_TABLE` gets
two answers.

**Smallest move:** rename `label.ts:133` to `EQ_TABLE_OF`, or delete it and
invert `filters.ts`'s map at the one call site (`label.ts:151`). Local,
private, no export change.

**Effort/value:** one rename. Low value alone; do it while in `label.ts` for A1.

---

### A6 - the same batch-edit-with-undo is written out three times in one file

**Module:** `app/src/components/ListPage.svelte:360-435`.

`applyGuess` (`:360`), `repriceTicked` (`:389`) and `clearPrices` (`:415`)
share a byte-identical skeleton: build `const before: Record<string, number>`,
walk `ticked`, call `store.setMeta(l.id, id, 'gold', v)`, bail if nothing
changed, toast with an action whose `run` is the same four lines in all three
(`:379-383`, `:405-408`, `:429-432`):

    run: () =< {
      for (const [id, gold] of Object.entries(before)) store.setMeta(l.id, id, 'gold', gold);
    }

`batchDelete` (`:440`) is the fourth of the family, with a different payload.

**What is structurally wrong:** "an operation on a list that can be undone" is
a real concept in this product - four instances - and it has no name anywhere:
not in `lib/lists.ts`, not on `ListStore`, not in the component. So each
operation restates the transaction, the guard and the undo.

**Smallest move:** one private helper *inside `ListPage.svelte`* -
`goldEdit(next, msg)` - covering the three gold cases. Do not create a `lib/`
module for it: all callers are in one file, and `CLAUDE.md` forbids a module
before a second real user.

**Risk:** the three toast strings and their counts differ (`:376`, `:402`,
`:426`); `listPage.test.ts` pins them. Behaviour-identical, no golden movement.

**Effort/value:** ~40 lines out of the largest component in the repo (48 kB).
Medium value, low effort.

---

### A7 - rarity is a domain concept with no home: five modules hold a piece

Beyond A4's duplication, the concept itself is scattered:

| fact | where |
|---|---|
| the type | `money.ts:101` |
| the ordered list | `roll.ts:60`, `alt.ts:24` |
| step-up rule | `roll.ts:65` |
| dict-key mapping | `label.ts:81` (`rarityKey`) **and** `money.ts:191` (`RAR_KEY`) |
| tier-recommendation captions | `alt.ts:38` |
| price bands | `money.ts:126` |
| which rarity each d12 count covers | `std.ts:15` |
| the heading string | `alt.ts:82` |

Two of these are worth naming. `rarityKey` (`label.ts:81`, takes `string`) and
`RAR_KEY` (`money.ts:191`, `Record<Rarity, keyof Dict>`) are the same mapping
written twice with different strictness. And `std.ts:15` keys the Core dice
bands by *untyped* rarity strings -
`const DICE: Record<string, readonly number[]>` - so a typo there is not a
compile error; it shows up as a button with no caption, because `NDICE`
(`:35-38`) filters over `Object.keys(DICE)`.

**Smallest move:** type `std.ts:15` as `Record<Rarity, readonly number[]>`
(`std.ts` gains a type-only import from `money.js`; `std -> data -> money`
already exists, so no new runtime edge). Collapse `RAR_KEY` into `rarityKey`
only if `money.ts` is being touched anyway.

**Effort/value:** the `std.ts` annotation is one line and closes a real hole.
The rest is noted, not proposed - moving `Rarity` into its own module touches
nine files and is larger than the fence allows.

---

### A8 - two different facts are both called `tier`, and the model does not separate them

**Modules:** `app/src/lib/types.ts:23,26,73,122`; `app/src/lib/data.ts:195,208`;
`app/src/lib/money.ts:160-171`.

    types.ts:23   export type Tier = 1 | 2 | 3 | 4;          // equipment rank, from the book
    types.ts:26   export type VoaTier = Tier | 'A' | 'C';    // VoA section, incl. artifact/cursed
    types.ts:74   interface Equip   { tier: Tier; ... }      // required on a stat block
    types.ts:122  interface Record_ { tier?: VoaTier; ... }  // optional, VoA only

`equipFacets` reads `e.tier` (`data.ts:195`), `plainFacets` reads `it.tier`
(`data.ts:208`), and `guessBand` reads both in one function (`money.ts:164`
then `:169`). `cardBadges` (`label.ts:67-68`) draws `it.tier` only for `'A'` and
`'C'` because a numeric one is "already in the stat row" - that is, the two
fields overlap on 1-4 and the code resolves the overlap by comment.

**Against `CLAUDE.md`'s hard rule.** "Never infer equipment tier from stats" is
*honoured*: `Equip.tier` is read straight from the data everywhere, and
`types.ts:22` says so. But the model does not make the wrong thing hard -
`Record_.tier` is a plausible-looking field on every record, and nothing stops
a future reader writing `it.tier ?? deriveFromThresholds(it.eq)`.

**Smallest move:** none that is cheap. `Record_.tier` is the wire name in
`data.js`, so renaming it to `voaTier` needs an adapter in `buildIndex` and
ripples into the generated artefacts - a contract change, not a local one.
What *is* local: one line at `types.ts:122` saying "Vault of Ages section, not
an equipment tier; equipment's own tier is `eq.tier`".

**Effort/value:** one comment. The real fix is noted as out of scope below.

---

### A9 - `Record_` models the JSON, not the domain, in three specific places

**Module:** `app/src/lib/types.ts:107-129`.

Most of `Record_` is a fair domain model - `Equip` (`:72-90`) and `RefCard`
(`:97-105`) are properly named and commented. Three fields are not:

1. **`community?: string; community_ru?: string` (`:127-128`)** - the only
   bilingual pair in the repo that does not follow the `en`/`ru`/`ende`/`rud`
   convention the same interface uses four lines earlier (`:111-114`). The
   consequence is at `label.ts:127`, which hand-picks
   `lang === 'ru' ? it.community_ru : it.community` instead of going through
   `nameOf`/`descOf` (`i18n.ts:86,90`) like every other name in the app.

2. **`src: string` (`:109`) and `frame?: string` (`:125`)** - closed sets the
   code already declares and then discards. `frames.ts:17` exports `FrameId`
   and no module outside `frames.ts` uses it; `std.ts:41-42` exports
   `Source = 'core' | 'hnf'`; `label.ts:117-130` and `tableOf` (`:147-159`)
   then switch over bare strings with a `default` branch, and `srcOf`
   (`data.ts:185`) returns `string`.

3. **`craft?: string`, `refs?: string[]`, `eq.line?: string`
   (`:120,121,86`)** - all ids or keys into another collection, typed the same
   as a name. The invariant ("`craft` points at a record that exists") is
   checked at `data.ts:111` (`byId.has(it.craft)`) - correctly, once, in the
   index, which is the right place - but no call site can tell an id from a
   label.

**Evidence the model is otherwise right:** `Index` (`data.ts:35-74`) is a real
domain object, not a JSON echo. `craftedFrom`, `rarityOf`, `altRow`,
`altColumn` and `allEquip` are all *derived*, with the reason stated
(`data.ts:3-7`), and the "only one direction is stored, so the two halves
cannot disagree" rule (`data.ts:107-112`) is exactly the right way to express
a pairing invariant. `buildIndex` is the strongest piece of design in the repo.

**Smallest move:** either type `frameName`'s parameter and `Record_.frame` as
`FrameId`, or delete the unused `FrameId` export - what is not defensible is
declaring the closed set and never using it. Items 1 and 3 are not worth
touching: `community_ru` is a `data.js` wire name (contract), and branded id
types are a repo-wide change the fence excludes.

**Effort/value:** low value, low effort. Rank last of the real findings.

---

### A10 - a bilingual string has five encodings

Not a defect; a map fact that explains why A1 happened.

| encoding | module |
|---|---|
| two mirrored flat objects, `Dict = Record<keyof typeof ru, string>` | `dict.ts:18,351,353` |
| `Pair = readonly [ru, en]` plus `pick(p, lang)` | `i18n.ts:26-28` |
| `Record<Lang, Record<FrameId, string>>` | `frames.ts:19` |
| `Record<Lang, Help>` (a rich-text AST) | `help.ts:61` and others |
| `{ ru: string; en: string }` per row | `label.ts:169,181` |
| `{ ru: [3 forms], en: [2 forms] }` (plurals) | `money.ts:30-41` |

The last is justified - Russian plurals genuinely need three forms, and
`moneyWord` (`:47`) is the only correct way to do it. `dict.ts`'s
`Dict = Record<keyof typeof ru, string>` (`:351`) is a genuinely good
invariant: the English table cannot be missing a key. The other four are drift.
Only `label.ts`'s is worth removing, and A1 removes it. No further action
proposed.

**On size as content vs size as responsibility**, which was asked: `dict.ts`
(641 lines) and `help.ts` (639 lines) are both **content**. `dict.ts` is one
flat string table with one accessor (`:639`) and a type that enforces
completeness. `help.ts` is one bilingual help document per section, plus a
five-node rich-text model (`HelpPart`, `:19-44`) and three type guards
(`:627-639`). Each is one concept; neither is a bucket. Leave them.

---

### A11 - concept coherence: the code's vocabulary against the product's

**Frames.** Asked specifically. **The code's vocabulary is coherent.** One
concept, one name, everywhere: `lib/frames.ts`, `FRAME_ORDER`, `FrameId`,
`frameName`, `Record_.frame`, `src === 'frame'`, `TableId 'other_frames'`,
filter group `'frame'` (`filters.ts:42`), route alias `frames -> other_frames`
(`hash.ts:39`). English product text is equally consistent: `Frame`, `Frame`,
`Frames` (`dict.ts:389,517,491`).

**The drift `product.md` found is Russian-only. It lives in three dict values,
with a literal fourth copy:**

| key | ru | drawn at |
|---|---|---|
| `dict.ts:61` `srcFrame` | `Фрейм` | `label.ts:125` - badge fallback when the src is a frame and no `frame` id is set |
| `dict.ts:220` `frameF` | `Сеттинг` | `facets.ts:167` - the filter group label |
| `dict.ts:189` `subFrames` | `Сеттинги` | `tables.ts:84` - the table sub-chip |
| `label.ts:192` literal | `Сеттинги` | `whereFrom` - the fourth copy, removed by A1 |

So the product answer is a three-value edit in `dict.ts`, not a rename. **It
moves rendered bytes** - `subFrames` is in the tables chip row and `frameF` in
the filter panel, both inside the 110 structural goldens - so it needs a
re-record and belongs in a batch that can run a golden shard, not as a
drive-by.

**Name collisions elsewhere.** Three, all real, none urgent:

- `DIE_ART` means `Record<number, DieArt>` (SVG geometry) at `dice.ts:20`
  and `Set<string>` (which damage dice have art) at `print.ts:38`.
- `pick` means "roll a die" at `roll.ts:75` and "choose a language out of a
  Pair" at `i18n.ts:28`.
- `Panel.svelte` is a 1.1 kB presentational box; `AltPanel`, `StdPanel`,
  `VoaPanel`, `CommunityPanel` and `RollPanel` are route-level pages.
  `AltPanel` imports `Panel` (`:18`) - one word, two layers, in one import
  list.

**One module doing two jobs.** `std.ts` is "Core rules: one roll over two
books" (`:1`), and `isLastOn` (`:87`) is a generic "would turning this chip off
leave the group empty" predicate with no Core-rules content. Its importers are
`SearchPage.svelte:19`, `AltPanel.svelte:29`, `StdPanel.svelte:26` and
`state/app.svelte.ts:35` - three of four have nothing to do with Core rules.
It is the only thing in `lib/` that reads as "put it where it was first
needed". Not worth a move on its own; move it if a fourth caller appears.

**`clamp` is byte-identical in two modules:** `roll.ts:15-16` and
`numField.ts:18-19`, both exported. `NumberField.svelte:106` uses one,
`roll.ts:41` the other. Nit; if touched, `roll.ts` should import from
`numField.ts` (which imports nothing), not the reverse.

---

### A12 - the file-protocol constraint is paid in exactly one place, and that is the right place

Asked specifically; the answer is that this one is **done well**, and it is
worth recording so nobody "fixes" it.

The whole cost of "`data.js` is a classic script assigning `window.LOOT`" is
`app/src/ports/data.ts` - 59 lines: one shape check (`looksLikeLoot`, `:20-25`)
that validates the container only, a reader injected as a function so no
`Window` has to be faked (`:34-36`), and three implementations
(`browserData`, `noData`, `fakeData`). `lib/data.ts:8-11` states in its module
header that where the data comes from is somebody else's problem. There is no
`fetch` anywhere, and no module in `lib/` knows about the global.

**The one place the cost smears** is the nullable index. `AppState.index` is
`Index | null` (`app.svelte.ts:95`, reason at `:88-94`), and nine components
open with `const index = $derived(app.index)` and then guard (`AltPanel:44`,
`ListPage:59`, `ListsPage:29`, `PrintPage:26`, `RecordPage:28`, `RollPanel:52`,
`SearchPage:32`, `StdPanel:40`, `TablesPage:69`), plus four more that inline
the same test. `RecordModal` and `RecordActions` then take `index` as a
*prop* rather than reading it off `app`, and both say why
(`RecordModal.svelte:42-44`, `RecordActions.svelte:14`): the parent has already
proved it non-null, and re-narrowing inside would be a second guard.

That is a correct response to a nullable value, not a smear. The alternative -
a non-null index plus a separate "loaded" flag - relocates the guard rather
than removing it. **No change proposed.** The nine derived lines are the price
of `data.js` being allowed to be absent, and `FEATURES.md` requires that state
to render.

---

## Component composition - the verdict asked for

**The composition model is sound, with local blemishes.** The rule the code
follows is consistent and articulable: *state lives on `AppState` when
something outside the owning subtree must see it, and locally otherwise.* The
comments state it at the point of decision - `sel` is app-wide "because the
selection bar is drawn by the frame, not by the page"
(`app.svelte.ts:151-155`); `menuFor` is app-wide so opening one closes any
other (`:144-149`); `navigations` exists so a component can tell a navigation
from a hash rewrite (`:120-130`). Every one of those is a real cross-subtree
requirement.

By that same rule, **`components.md` C6 is not a layering error**. The eight
copies of `let open = $state<Record_ | null>(null)` (`AltPanel:51`,
`ListPage:139`, `RecordPage:39`, `RollPanel:66`, `SearchPage:38`,
`SharedListPage:79`, `StdPanel:43`, `TablesPage:106`) each sit in the subtree
that renders the modal, so local is where the rule puts them. What is missing
is an *extraction* - a host component or a snippet owning `open` plus the
`RecordModal` instance - not a state relocation. That distinction decides how
it gets fixed.

`C1` (the `say` shims) **is** a layering symptom, and A2 names it: there is no
seam between a component and a port, so every component builds its own.

The page and presentational split is otherwise clear and only ambiguous in
naming. `PageHead` (title, sub, help, home pin) is used by the six roll and
browse pages; `PageTitle` (title, sub) by record, print, list and shared-list;
`SectionHead` is an in-page heading. That is a real distinction, consistently
applied. The one genuine irregularity is `RollPanel`: it is a **route-level
page** when `App.svelte:50` renders it for Wondrous and Dread, and a **child
component** when `VoaPanel.svelte:11` and `CommunityPanel.svelte:11` wrap it -
one file at two levels depending on caller. It works, and both wrappers are
thin (1.7 kB and 1.4 kB), but it is why `Panel` means two things.

---

## Noted, out of scope

- **Decompose `AppState`.** Eighteen pieces of state and about thirty methods
  spanning routing, language, selection, toasts, lists, URL building,
  broken-art tracking, home pinning and the storage warning. Every member is
  individually justified, and the class is the reason this app has no
  prop-drilling problem; splitting it is a refactor of every component prop
  list, not an incremental move.
- **A `RecordModal` host extraction** for the eight open-state pairs. Owned by
  `components.md` C6 and sized there.
- **Rename `Record_.tier` to `voaTier`** (A8). Needs a wire-name adapter in
  `buildIndex` and touches the generated artefacts - a contract change.
- **Branded id types** for `craft`, `refs`, `eq.line` and list ids (A9 item 3).
  Repo-wide.
- **Give the shared-link wire format one home.** Its constants are split across
  three modules - `hash.ts:14` (`PACK_MARK`), `listLink.ts:34-44`
  (`N_REC`, `N_SEP`, `N_LIST`, `N_MONEY`, `N_SHOW`), `lists.ts:16`
  (`N_SHARED`) - and `ports/compress.ts:15` imports one of them upward into the
  port. All are frozen by `CONTRACTS.md`, so a move touches the contract docs
  and the fixtures.

---

## Verdict

**approve.** The decomposition is sound: acyclic, shallow, honestly layered,
with a genuinely pure `lib/`, well-drawn ports, and a domain index
(`buildIndex`) that models the domain rather than the delivery format. The
findings are duplication and one bypassed boundary, not a wrong shape.

**Next action.** A1 (delete the taxonomy copy in `label.ts`) plus A3 and A4
(the duplicate `MoneyMode` and `Rarity` declarations) are independent,
mechanical, and together under 60 lines with no golden movement - one batch,
one `npm run check`. A2 is the one finding with real value and real size; give
it its own batch across its eight files. A6 rides along with any `ListPage`
work. A5, the `std.ts` annotation in A7, the comment in A8 and the `clamp` nit
in A11 are drive-bys for whichever batch opens those files. The Russian frame
vocabulary in A11 belongs in a batch that can re-record goldens.

**Checks a fix pass still needs:** `npm run check` for all of the above;
`npm run check:built` only for A11's dict edit; a golden shard only for A11.
A1 through A6 are byte-neutral by construction, and `label.test.ts`,
`tables.test.ts` and `listPage.test.ts` are the gates that prove it.
