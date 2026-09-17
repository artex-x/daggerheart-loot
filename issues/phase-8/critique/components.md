# Phase 8 - component structure and DOM composition critique

Read-only pass over `app/src/**`, `.prettierrc`, `.prettierignore`,
`eslint.config.mjs` and `tests/app/snapshots/` (the 110 goldens are
accessibility trees, so two findings below are settled by quoting one).

"Moves goldens" means files under `tests/app/snapshots/` must be re-recorded.
Where it says none, the change emits identical DOM. A **new** component also
costs an entry in `COVERED` at `app/src/components/a11y.test.ts:351` - that
guard compares the map against the `.svelte` files on disk and fails on drift
in either direction, so a deletion costs an entry too.

Headline: the component layer is in better shape than the brief implies. There
is **no** over-extraction - every optional prop on `Button`, `Seg`, `ChipRow`,
`Field`, `HelpBox`, `Panel`, `Actions` and `HelpButton` has a real caller - and
**no** component-to-component `bind:` anywhere (`bind:` appears nine times, all
`bind:this` or a local `<input>`). `app/src/lib/` is genuinely pure. The
failures are duplication that was recorded instead of removed, one factual
error in test prose, and a tokens file that does not do the job it claims.

## Worth doing

### C1 - ten identical `say` shims, threaded as a prop into components that already hold `app`

- **Where**: `app/src/components/AltPanel.svelte:54`, `ListPage.svelte:173`,
  `ListsPage.svelte:32`, `PrintPage.svelte:63`, `RecordModal.svelte:51`,
  `RecordPage.svelte:32`, `RollPanel.svelte:68`, `SearchPage.svelte:47`,
  `StdPanel.svelte:46`, `TablesPage.svelte:115` - all ten byte-identical:

  ```ts
  const say = (msg: string, error?: boolean): void => {
    app.say(msg, { error });
  };
  ```

  Consumed as a prop by `PageHead.svelte:23` and `RecordActions.svelte:33`,
  both of which already take `app: AppState` (`PageHead.svelte:16`,
  `RecordActions.svelte:28`).
- **What is wrong**: a signature adapter with no variation, repeated ten times,
  then passed down a layer that could have called `app.say` itself. This is the
  "props threaded through layers" shape exactly: `say` carries no information
  the parent has and the child lacks.
- **Cost**: ~40 lines, two props on two of the most-used components, and a
  recurring decision for every new page. It has already spread to every page
  component in the app.
- **Smallest fix**: delete the `say` prop from `PageHead` and `RecordActions`;
  inside each, call `app.say(msg, { error })` directly. Delete the ten
  closures and the `{say}` at all thirteen call sites. If the two-argument
  shape is wanted, put `say(msg, error?)` on `AppState` beside the existing
  `say(msg, opts)` at `state/app.svelte.ts:265`, not in ten components.
- **Risk**: none. No DOM, no new component, no `COVERED` entry. No test passes
  `say` as a prop - every component test renders `App`.
- **Effort/value**: half an hour / high. Do this first.

### C2 - the record badge is written out three times, twice byte-identical

- **Where**: `app/src/components/RecordCard.svelte:359-418` and
  `RowMain.svelte:204-254` - the nine-declaration `.badge` base plus
  `.item`, `.cons`, `.eq-weapon`, `.eq-secondary`, `.eq-armor`, `.uniq`,
  `.tier`, `.src` are identical to the character, including the six
  eight-digit border colours such as `#7a8ee073`. `ListsPage.svelte:297-314`
  is a third copy of the base plus `.num`. The markup is duplicated too:

  ```svelte
  <span class="badge {b.cls}" title={b.title}>{b.text}</span>
  ```

  at `RecordCard.svelte:135` and `RowMain.svelte:96`, both fed by the same
  `cardBadges(it, lang, t)` from `lib/label.ts:56`.
- **What is wrong**: `CLAUDE.md` says extract on the second use and remove both
  inline copies. `ListsPage.svelte:294-296` instead records the decision not
  to - "this is the third, recorded rather than extracted". Three copies is
  where a palette drifts: a sixth kind colour, or a contrast fix, has to land
  in three files and nothing fails if it lands in two.
- **Smallest fix**: `Badge.svelte` taking `cls`, `title` and `children`,
  holding the base rule and the nine variants. Replace all three copies. Keep
  `ListsPage`'s `.num` in the shared file - it is one of the variants, not a
  fourth thing.
- **Risk**: real but bounded. `RowMain.svelte:96-98` sits inside a
  whitespace-critical run, so the new component's template must be one line
  with no leading or trailing whitespace or the run gains text nodes.
  `tests/app/snapshots/_l_shared.txt:40` and
  `_tables_eq_weapon_filtered.txt:89` are the lines that would catch it.
  Moves goldens: none if written that way.
- **Effort/value**: two hours including the `COVERED` entry / high.

### C3 - Prettier decides rendered structure, and five batches each rediscovered it alone

- **Where**: `.prettierrc` sets `printWidth`, `singleQuote`, `trailingComma`
  and the Svelte plugin, and nothing else. `htmlWhitespaceSensitivity` is
  unset, so Prettier uses its default `"css"`: whitespace around an element
  whose *default* CSS display is block (`div`, `p`, `h1`, `li`) is treated as
  insignificant and reflowed freely, while inline elements (`span`, `b`, `i`,
  `a`) and Svelte components are treated as sensitive and get the hugging `>`
  style. `app/**/*.svelte` is not in `.prettierignore`, so `npm run check`
  enforces this on every component.
- **What is wrong**: Prettier's model is "insignificant for *paint*". This app
  also reads `textContent` and accessible names, for which a whitespace text
  node between two block elements is very significant. The result is four
  `prettier-ignore` scars, each with its own hand-written explanation of the
  same mechanism:
  - `TableRows.svelte:160-170` - "Prettier reformats a short tag like
    `<div class="tile-b">` back onto its own line on every format,
    reintroducing the gap, unless the whole subtree is protected at once"
  - `ListsPage.svelte:138-147` - the same, for `.listcard-main`
  - `PrintCard.svelte:236-243` - the same, for the whole card
  - `FilterBar.svelte:114` - the same, for `.lbl`

  Searching history for when each was added returns five separate batches:
  `64e79a0`, `a82ddd0`, `2970c03`, `ba8f4b1`, `4776243`. Five independent
  rediscoveries of one fact is the definition of a missing written rule.
  `CLAUDE.md`'s existing line - "Port the live app's text-node structure, not
  only its rendered string" - states the requirement but names neither the
  cause nor the defence. `FilterBar.svelte:58-66` documents the other half of
  the same hazard: Svelte trims a leading literal space inside an `{#if}`, and
  a separate one-space expression made two text nodes where the live app had
  one, which measured 0.1px wider because a text advance rounds per node.
- **The audit is clean today**: every hugged block tag in the tree - searching
  `app/src/components` for a `>` immediately followed by `<div`, `<p`, `<li`
  or a heading tag, and the closing forms - is inside one of the four ignored
  regions. There is no unprotected instance right now.
- **Options, and what I would do**:
  1. Set `"htmlWhitespaceSensitivity": "strict"` in `.prettierrc`. This is the
     option that removes the bug class: every element becomes
     whitespace-sensitive, Prettier never adds or removes a whitespace text
     node, and all four `prettier-ignore` blocks become unnecessary.
     `node_modules/prettier-plugin-svelte/README.md:192` points at this exact
     setting.
     **Cost**: it reflows every `.svelte` file into the hugging style - the
     whole app starts reading like `PrintCard.svelte` - and the diff touches
     ~45 files. It should not move rendered bytes, because strict preserves
     the whitespace already in the source, but "should not" is a claim the 110
     goldens plus `app/typo` have to settle before it is believed.
     **Verdict: no.** A permanent readability price on every file, to fix a
     hazard that occurs in four places.
  2. Keep `"css"` and write the rule down once: one paragraph in `docs/specs/`
     (or one extra clause on the existing `CLAUDE.md` line) naming Prettier as
     the cause, `prettier-ignore` over the whole subtree as the defence, and a
     `textContent`/`childNodes` test as the proof. Then cut the four comments
     to one line plus a cross-reference, keeping only what is local - which
     elements, and which check reads them. Saves ~30 lines of duplicated prose
     and stops the sixth rediscovery.
     **Verdict: yes.** Effort: an hour. Moves goldens: none.
- **Also noticed**: `.prettierignore` excludes `app/index.html` with a comment
  saying R0c "is not the batch that decides its formatting". Phase 8 is a
  reasonable batch to decide it, or to mark the line permanent.

### C4 - the pill assertion is ugly, and the comment above it is factually wrong

- **Where**: `app/src/components/tables.test.ts:762-766`:

  ```ts
  /* The pill's own textContent carries the dismiss glyph (`&times;`) after
     the label - `title`, not text, is its accessible name. */
  const pills = [...container.querySelectorAll('.fpill')].map((p) => p.textContent);
  expect(pills).toContain('Ранг 1×');
  expect(pills).toContain('Двуручное×');
  ```

- **Is the DOM wrong?** No. `FilterBar.svelte:88` renders the label and
  `<i>&times;</i>` with nothing between them, which is exactly what the
  deleted live app emitted - `app.js` at `23c00a6^`, line 2687, concatenates
  `esc(c[2])` with `'<i>&times;</i></button>'`. Parity is intact and should
  stay.
- **Is the test wrong?** The assertion is only ugly. The **comment** is wrong,
  and wrong in the way that misdirects the next reader. The golden settles it -
  `tests/app/snapshots/_tables_eq_weapon_filtered.txt:46`:

  ```text
  button "Ранг 1 ×" [description=Убрать из фильтра]
  ```

  In Chrome the accessible *name* is the content, `"Ранг 1 ×"` - with a space,
  because `.fpill i` is `display:flex` (`FilterBar.svelte:166-177`) and the
  name computation separates block-level parts - and the `title` becomes the
  **description**, not the name. The comment asserts the opposite of both
  halves.
- **Sibling with the same defect**: `listsPage.test.ts:133-137` says "jsdom's
  accessible-name library inserts a space at the boundary between the two
  block-level elements ... that real Chrome's own computation does not".
  `tests/app/snapshots/_lists_two_lists.txt:37,41` shows Chrome computing
  `link "Клад дракона 7"` and `link "Лавка в порту 0 Список пуст"` - with the
  spaces. jsdom and Chrome agree here; what the `textContent` assertion at
  `listsPage.test.ts:160` actually pins is the *text-node structure*, which is
  a different and still worthwhile thing.
- **Smallest fix**: correct both comments to say what is true - these
  assertions pin text-node structure, not an accessible name - and switch the
  glued strings to the idiom this repository already has at
  `record.test.ts:271-279`:

  ```ts
  expect([...pill.childNodes].map((n) => n.textContent)).toEqual(['Двуручное', '×']);
  ```

  which states "two nodes, no separator" instead of leaving the reader to
  notice a missing space.
- **Risk**: none, test-only. Moves goldens: none.
- **Effort/value**: half an hour / high. Cheap, and a comment that misstates
  the accessible-name algorithm will eventually cause a wrong fix.
- **Not proposed here**: `aria-hidden="true"` on the `<i>` would make the name
  `"Ранг 1"` and keep the description. It is the better button, but it
  diverges from the live markup and moves at least four goldens, so it is a
  `docs/specs/DEBT.md` decision for the product pass, not a structural
  cleanup. Repeated under "out of scope".

### C5 - `tokens.css` claims a scale the components do not use, and misses the colour they all repeat

- **Where**: `app/src/styles/tokens.css:56-61` - "One scale, so a component
  never invents a size" - and `:74-76`.
- **What is wrong**, counted across `app/src/components/`:
  - `var(--step-*)` is used **once in the whole app**, by `body` at
    `tokens.css:103`. `--step--2`, `--step--1`, `--step-1` and `--step-2` have
    **zero** users. `--gap` and `--gap-lg` have zero. `--gap-sm` has one
    (`Shell.svelte:88`, inside the skip link that DEBT D19 already records as
    divergent). `--bg` has none outside `tokens.css`.
  - Meanwhile components hard-code `font-size: 12.5px` **17 times**, `13px`
    11 times, `10.5px` 9 times and `11.5px` 7 times, and `gap: 6px` 14 times,
    `gap: 8px` 13 and `gap: 10px` 11.
  - `#1a1206` - the ink on a gold fill - appears in **seven** components:
    `Button.svelte:151,198`, `Chip.svelte:107`, `DiceBar.svelte:88`,
    `HelpButton.svelte:61`, `PageHead.svelte:127`, `Seg.svelte:73`,
    `Toast.svelte:89`. `tokens.css:4-6` says in its own words that "a value
    that more than one component needs has to be named here first".
  - `rgb(10 8 16 / 50%)` - the badge ground - in three: `ListsPage.svelte:304`,
    `RecordCard.svelte:366`, `RowMain.svelte:211`. `#9a9aa6` in two,
    `RecordCard.svelte:413` and `RowMain.svelte:253`. `#e2b76c` and `#e8c27c`
    - the gold gradient - in `Button.svelte:149-150` and
    `DiceBar.svelte:86-87`. `rgb(216 171 94 / N%)`, which is `--gold` re-spelt
    so an alpha can be applied, in about twenty-five places across fifteen
    files.
- **Cost**: the file's opening claim is false, which is worse than having no
  claim - a reader trusts it and then puts a shared value in a component. A
  palette change is a grep, not an edit.
- **Smallest fix**, one commit, every substitution value-preserving:
  1. Add `--ink-on-gold: #1a1206` and replace the eight uses. Add
     `--badge-bg` and `--gold-rgb: 216 171 94` (then `rgb(var(--gold-rgb) /
     12%)`) only if C2 lands, since C2 rewrites those rules anyway.
  2. Delete `--gap`, `--gap-lg`, `--step--2`, `--step--1`, `--step-1` and
     `--step-2`. `CLAUDE.md`: "Add no module, export, component, or variant
     before something uses it" - six unused ones is that rule inverted.
  3. Rewrite `tokens.css:56` to describe what the file actually is - the
     palette, radii, fonts and the page heading carried over from the live app
     - and drop the claim about a scale nothing composes.
- **Risk**: none; every substitution computes the same value. Moves goldens:
  none. `app/typo` and `app/hues` are the gates.
- **Effort/value**: an hour / high. Independent of every other finding.

### C6 - eight components each own an `open` record and a copy of the modal

- **Where**: `let open = $state<Record_ | null>(null)` at `AltPanel.svelte:51`,
  `ListPage.svelte:139`, `RecordPage.svelte:39`, `RollPanel.svelte:66`,
  `SearchPage.svelte:38`, `SharedListPage.svelte:79`, `StdPanel.svelte:43`,
  `TablesPage.svelte:106`; the matching `{#if open && index}` plus
  `<RecordModal/>` at `AltPanel.svelte:255`, `ListPage.svelte:903`,
  `RecordPage.svelte:105`, `RollPanel.svelte:163`, `SearchPage.svelte:138`,
  `SharedListPage.svelte:121`, `StdPanel.svelte:181`, `TablesPage.svelte:632`.
  Seven of the eight are byte-identical; `ListPage` adds one `extra` prop.
- **What is wrong**: "which record is open over the page" is application
  state, not page state - the same category as `menuFor` and `sel`, which
  already live on `AppState` (`state/app.svelte.ts:149`). Each page also
  re-derives the `onopen`/`onclose` pair and the same six-prop `RecordCard`
  plus `nameActions`/`actions` snippet block - six near-identical ~22-line
  copies at `AltPanel.svelte:227-250`, `ListPage.svelte:676-704`,
  `RecordModal.svelte:99-115`, `RecordPage.svelte:76-95`,
  `RollPanel.svelte:137-158` and `StdPanel.svelte:155-176`.
- **Cost**: a new page needs ~35 lines of ceremony before it draws anything,
  and any change to how a record opens is eight edits.
- **Smallest fix**: put `openRecord` plus `openRecord(r)`/`closeRecord()` on
  `AppState` and render `<RecordModal>` once in `Shell.svelte`, which already
  hosts the two other app-level overlays - `SelBar` at :75 and `Toast` at :77.
  Decide `extra` when writing: a second field beside the record, or leave
  `ListPage` its own instance.
- **Moves goldens**: must be verified, not assumed. The evidence is
  encouraging - with the modal open the tree shows `dialog` as the only child
  of `RootWebArea` (`tests/app/snapshots/_tables_a_row_opened.txt:6-7`),
  because the rest of the page is inert, so the dialog's DOM position should
  not show up in a tree. Confirm against every `*_opened*`, `*_list_menu*` and
  `_i_ci1_*` snapshot before committing.
- **Effort/value**: half a day / medium-high. The largest single subtraction
  available, and the one that most needs its golden run.

### C7 - `.numrow` is written out five times, `.results` three, `.panel` three

- **Where**: an identical four-declaration `.numrow` at `AltPanel.svelte:271`,
  `ListPage.svelte:1221`, `ListsPage.svelte:187`, `RollPanel.svelte:179` and
  `StdPanel.svelte:197`, with six markup uses (`ListsPage` has two, at :112
  and :125). `.results { margin-top: 26px }` at `AltPanel.svelte:305`,
  `RollPanel.svelte:187`, `StdPanel.svelte:204`. `Panel.svelte`'s five
  declarations copied inline at `TablesPage.svelte:651-657`,
  `FilterBar.svelte:241-248` and `ListPage.svelte:1156`.
- **What is wrong**: `.numrow` is a plain layout primitive with no variant at
  all and five copies - the clearest un-taken second use in the tree.
- **Smallest fix**: `NumRow.svelte` - one `<div class="numrow">` around
  `{@render children()}` plus the one rule. `.results` is three lines total;
  fold it into whatever touches those files next rather than making it its own
  change. The three `.panel` copies are a different case - see "not worth it".
- **Risk**: one real snag. `ListsPage.svelte:194` has `.numrow .grow`; once
  `.numrow` belongs to a child component Svelte marks that selector unused and
  drops it, silently losing `flex: 1 1 170px` on the two inputs. It has to
  become `.grow` in the same edit. Moves goldens: none - identical DOM and
  identical computed styles - but `app/sweep` at the lists route is what proves
  the `.grow` half.
- **Effort/value**: an hour plus a `COVERED` entry / medium.

### C8 - `App.svelte`'s route chain reaches into `ROLL_TABLE` four times with dead fallbacks

- **Where**: `app/src/App.svelte:49-55`:

  ```svelte
  {#if app.route.kind === 'section' && ROLL_TABLE[app.route.section]}
    <RollPanel
      section={ROLL_TABLE[app.route.section]?.table ?? ''}
      title={app.t[ROLL_TABLE[app.route.section]?.title ?? 'pageWondrous']}
      rows={app.index?.rows.get(ROLL_TABLE[app.route.section]?.table ?? '') ?? []}
  ```

- **What is wrong**: the guard already proved the lookup is non-null, but the
  narrowing does not survive into the attributes, so each one repeats the
  lookup and invents a fallback that cannot be reached. The
  `?? 'pageWondrous'` is the dangerous one: a future `ROLL_TABLE` entry with a
  mistyped `title` key would silently render the Wondrous heading instead of
  failing.
- **Smallest fix**: nest and bind once - an outer `{#if app.route.kind ===
  'section'}`, then `{@const cfg = ROLL_TABLE[app.route.section]}`, then
  `{#if cfg}` - and use `cfg.table`, `app.t[cfg.title]`.
- **Risk**: the extra `{#if}` adds one anchor comment inside a branch chain
  that already has them; no text node is created and no element moves. Moves
  goldens: none.
- **Effort/value**: fifteen minutes / medium.

### C9 - three `eslint-disable` lines for the same false positive on `{@render}`

- **Where**: `ListPage.svelte:642`, `ListPage.svelte:892` and
  `PrintCard.svelte:144` all suppress
  `@typescript-eslint/no-confusing-void-expression` on a render tag. These are
  the only rule-level disables in `app/src` besides two genuine one-offs in
  `ports/`.
- **Smallest fix**: set the rule's `ignoreVoidReturningFunctions` option in
  `eslint.config.mjs`, inside the `**/*.svelte` block at :52 so `.ts` keeps the
  strict form, and delete the three comments. Verify with `npm run lint` before
  believing it; if it does not clear all three, leave them.
- **Effort/value**: twenty minutes / low-medium. Worth doing while
  `eslint.config.mjs` is open for something else.

## Noticed, not worth it

- **`class="panel ffilter"` and `class="panel tablenav"` emit a class that
  styles nothing.** `FilterBar.svelte:111` and `TablesPage.svelte:462` carry a
  `panel` class with no matching scoped rule in either file. It looks like dead
  markup, but it is the live app's class list and it is what makes the inline
  copy recognisable as a `.panel` variant. Removing it changes the rendered
  class attribute for no gain. Leave.
- **`Panel.svelte`'s three inline copies.** `Panel.svelte:3-10` gives the
  reason already: a `class` prop would force all three variants through
  `:global()`, which is worse than three five-line copies. The argument holds.
- **`PageHead` and `PageTitle` both defining `.page-h`/`.page-sub`.**
  `.page-sub` is byte-identical (`PageHead.svelte:146`, `PageTitle.svelte:55`),
  but `PageHead`'s `h1` lives inside a flex row between two buttons and takes
  `margin: 0`; sharing it needs a wrapper prop nobody else wants.
  `PageHead.svelte:43-47` says exactly this. Leave.
- **`DiceBar.svelte:84-96` reimplements `.btn.primary` rather than using
  `Button`.** Documented at :53-56 and :82-84: the live `.dicebar .btn` rule
  overrides the shared button and the two-line caption needs its own height, so
  composing `Button` would mean reaching in with `:global()`. Leave - but its
  `#e8c27c`/`#e2b76c`/`#1a1206` go through C5.
- **`Shell.svelte:26-29` writes `document.documentElement.lang` and
  `document.title` directly.** A DOM write, not storage, network or the address
  bar; jsdom implements it and `shell.test.ts` exercises it. A document port for
  two assignments would be ceremony.
- **Components reaching `app.env.clipboard` (14 uses), `.random` (4),
  `.dialog` (3), `.compress` (3), `.router` (2), `.storage`, `.share`,
  `.image`, `.drag` (1 each).** That is a component using a port, which the
  architecture allows, and `AppState` as the carrier is what keeps thirteen
  files from importing adapters directly. No violation.
- **`PageTitle.svelte:24-29` branching outside the element instead of inside
  it.** It looks like duplicated markup; it is the fix for a real defect
  (a nested `{#if}` puts Svelte's anchor comment inside the `h1` and splits a
  plain-string caller's single text node in two). Keep, and keep the comment.
- **`ListPage.svelte` at 1692 lines** - 532 script, 380 template, 775 style.
  Genuinely large, but every seam I could find (the money picker, the roll
  panel, the note pair, the batch bar) is already a component or a local
  snippet, and splitting the rest is a redesign-sized change with a matching
  golden surface. See "out of scope".

## Noted, out of scope

- **The filter pill's accessible name is `"Ранг 1 ×"`, and a list card's is
  `"Лавка в порту 0 Список пуст"`.** Both reproduce the live markup on
  purpose, both re-seed goldens if changed, and neither is recorded in
  `docs/specs/DEBT.md`. A product decision and a DEBT entry, not a cleanup.
- **Splitting `ListPage.svelte`.** A ticket of its own, with its own golden
  plan.
- **A shared "page component" base owning `app`, `t`, `index`, `say`, `open`
  and the modal.** C1 and C6 remove most of what would motivate it; do those
  first and re-ask rather than designing a base now.

## Suggested order

C1, C4 and C5 first - three independent, zero-risk commits that need no golden
re-seed and no new component, and together delete ~60 lines and two false
claims. Then C3 option 2, which is prose only. Then C2 and C7 together: both
add a component, both touch the same `COVERED` map, and both want the same
`app/sweep` and golden confirmation, so they are one batch by the gate test.
C8 and C9 ride along with whichever batch opens their file. C6 last and alone -
it is the only proposal whose golden impact is not known in advance.
