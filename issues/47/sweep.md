# R0c pre-deletion divergence sweep - TASK 47

The last measurement of the migration: everything R0c deletes, read against the
rewrite, before it is deleted. Commissioned by the repository owner on
2026-09-16 (`context.md`, decision 11) with two rulings - one more deliberate
pass over the deleted code, and **what it finds does not block the deletion**.

- **Read at**: `7a33c22` (`main`). The plan fixes its row counts at `a6b4a94`;
  `git diff --stat a6b4a94 7a33c22 -- app.js index.html style.css app/` is
  **empty** (the two intervening commits replace artwork under `img/`/`og/`
  only), so every file this pass reads is byte-identical at both shas and the
  plan's counts apply unchanged. All three runners verified this independently.
- **Date**: 2026-09-17.
- **Spec**: `plan.md`, "R0c designed: the sweep, the deletions, and the cliff"
  -> "The sweep: what is read, in what order, against what, and what comes out".
- **Run as a three-way split** (A+B+F / C+D / E), the fallback that section's
  "Cost and the fallback" paragraph allows, dispatched in parallel as read-only
  passes. The per-runner tables below are merged verbatim under this header;
  the row counts are what make a partial merge visible, and no part is partial.
- **Nothing was fixed here, and nothing was run**: no `npm run check`, no parity
  filter, no golden shard. One runner ran `tests/i18n.js`, which piece (iii)
  requires. Every other row was settled by reading source.

**Verdicts**: `same` / `differs` (both do it, differently) / `absent` (live does
it, the rewrite does not) / `n.a.` (already decided and recorded; invalid
without a citation).
**Homes**: **(a)** an observable divergence -> `docs/specs/DEBT.md` section 3,
with the live code quoted against a sha so the record outlives the deleted file;
**(b)** a lost question with no known divergence -> `docs/specs/COVERAGE.md`
thin spots; **(c)** anything else -> the Phase 8 opening handover.

## Merged totals

| runner | rows | same | differs | absent | n.a. |
|---|---|---|---|---|---|
| A+B+F | 251 | 215 | 30 | 3 | 3 |
| C+D | 120 | 107 | 8 | 0 | 3 |
| E | 148 | 109 | 17 | 21 | 1 |
| **total** | **519** | **431** | **55** | **24** | **7** |

The verdict columns sum to 517, not 519: Part C's 74 rows include two Russian
comment lines that matched its grep and carry no verdict.

**Rows carrying a home: 82** - **(a) 13 rows / 12 distinct entries**,
**(b) 34**, **(c) 34**, plus one Part F row already homed as R0c's own N6.
That exceeds the 79 non-`same` rows on purpose: a handful of Part D rows are
behaviourally `same` and still carry a **(b)**, because after R0c no surviving
instrument watches them at all.

**What the shape of the result says.** Part E - the deleted instruments'
assertions, 148 rows - found **no observable divergence between the two apps**;
its 38 non-`same` rows are lost *questions*, which is what the plan predicted
for it. Every one of the 13 **(a)** rows came from parts A, B, D and F: the
classes no instrument can see. That is the same lesson R0b.4 paid for, measured
a second time on a wider surface.

**Per the owner's ruling, none of this blocks R0c.** C0 writes every non-`same`
row's durable record into its home in the same commit, so this file is never
the only place a finding lives; reviewing and addressing them is Phase 8 work.

---

## R0c pre-deletion divergence sweep - parts A, B and F

- **Read at**: `7a33c22` (`main`). The plan quotes its counts at `a6b4a94`;
  `git diff --stat a6b4a94 7a33c22 -- app.js index.html style.css app/` is
  **empty**, so every file this pass reads is byte-identical at the two shas and
  the plan's fixed row counts apply unchanged. The two intervening commits
  replace artwork under `img/` only.
- **Date**: 2026-09-17
- **Runner**: `sweep A+B+F` - one of the three-way split the plan's "Cost and
  the fallback" paragraph allows (A+B+F / C+D / E).
- **Spec**: `issues/47/plan.md`, "R0c designed: the sweep, the deletions, and
  the cliff" -> "The sweep: what is read, in what order, against what, and what
  comes out". Owner ruling: `issues/47/context.md`, decision 11.
- **Nothing else in the tree was changed by this pass.** No `npm run check`, no
  parity filter, no golden shard and no legacy suite was run; every row below
  was settled by reading files.

**Verdicts**: `same` / `differs` / `absent` / `n.a.` (citation required).
**Homes**: (a) `docs/specs/DEBT.md` section 3; (b) `docs/specs/COVERAGE.md`
"Known thin spots"; (c) the Phase 8 opening handover in `handoff.md`.

---

### Part A - attributes, links, breaks

**Match count reconciled.** The plan's grep over `app.js` returns **216
matching lines**, exactly the figure recorded at `a6b4a94`. No discrepancy, so
the per-token breakdown in the plan is taken as given and not re-counted.

One row per matching line, in file order. A row may cover several attributes on
one line. The `file:line` on the rewrite side is the emitting site, not the only
site that mentions the name.

| where | live | rewrite | verdict | home |
|---|---|---|---|---|
| app.js:194 | `T.ru.help.std[0]` - help prose | `app/src/lib/help.ts` STD paragraphs, rendered by `HelpBox.svelte:20-31` | same | - |
| app.js:204 | `T.ru.help.std[1]`: four `<br>` separating the rarity list, `<b>` per rarity | `help.ts` models the same paragraph as lead plus text parts; `HelpBox.svelte` emits the breaks | same | - |
| app.js:212 | `T.ru.help.alt[4]`: two `<a href target="_blank" rel="noopener">` | `help.ts` link parts -> `HelpBox.svelte:26-29` `target="_blank" rel="noopener"` | same | - |
| app.js:219 | `T.ru.help.wondrous[4]`: one source `<a ... target rel>` | `help.ts` -> `HelpBox.svelte:26-29` | same | - |
| app.js:226 | `T.ru.help.dread[4]`: one source `<a ... target rel>` | `help.ts` -> `HelpBox.svelte:26-29` | same | - |
| app.js:233 | `T.ru.help.voa[4]`: three source `<a ... target rel>` (volumes 1-3) | `help.ts` -> `HelpBox.svelte:26-29` | same | - |
| app.js:238 | `T.ru.help.community[2]`: one source `<a ... target rel>` | `help.ts` -> `HelpBox.svelte:26-29` | same | - |
| app.js:250 | `T.ru.help.tables[9]`: one `<a ... target rel>` to ru.daggerheart.su | `help.ts` -> `HelpBox.svelte:26-29` | same | - |
| app.js:375 | `T.en.help.std[0]` | `help.ts` EN paragraphs | same | - |
| app.js:385 | `T.en.help.std[1]`: four `<br>`, `<b>` per rarity | `help.ts` EN -> `HelpBox.svelte` | same | - |
| app.js:393 | `T.en.help.alt[4]`: two `<a ... target rel>` | `help.ts` EN -> `HelpBox.svelte:26-29` | same | - |
| app.js:400 | `T.en.help.wondrous[4]`: source `<a ... target rel>` | `help.ts` EN -> `HelpBox.svelte:26-29` | same | - |
| app.js:407 | `T.en.help.dread[4]`: source `<a ... target rel>` | `help.ts` EN -> `HelpBox.svelte:26-29` | same | - |
| app.js:414 | `T.en.help.voa[4]`: three source `<a ... target rel>` | `help.ts` EN -> `HelpBox.svelte:26-29` | same | - |
| app.js:419 | `T.en.help.community[2]`: source `<a ... target rel>` | `help.ts` EN -> `HelpBox.svelte:26-29` | same | - |
| app.js:560 | `shareHtml`: `'<br>' + esc(stats)` | `app/src/lib/share.ts` stat line, same single break | same | - |
| app.js:561 | `shareHtml`: `'<br><br>' + descHtml(it)` | `share.ts` description block | same | - |
| app.js:585 | `blockHtml`: `'<br><br><i>head</i><br>' + lines(body)` | `share.ts` block renderer, replayed by `docs/fixtures/share/records.json` | same | - |
| app.js:590 | the helper itself: `lines = s => esc(s).replace(/\n/g,'<br>')` | `share.ts` newline-to-break helper | same | - |
| app.js:675 | note lines joined with `<br>` | `share.ts` note block | same | - |
| app.js:689 | `blockHtml` inserts a leading `<br>` between two non-array blocks | `share.ts` block join | same | - |
| app.js:736 | batch select-all `<label class="batch-all"><input type="checkbox" data-lsel-all>` | `ListPage.svelte:714-720` batch checkbox | same | - |
| app.js:739 | `<button type="button" class="btn sm[ on]" data-guess>` | `ListPage.svelte` batch-money `Button on={guess}` | same | - |
| app.js:740 | `aria-expanded="true/false"` on the batch-money button, label `t().batchMoney` | `ListPage.svelte:726` -> `Button.svelte:87` `aria-expanded={expanded}` | same | - |
| app.js:742 | `<button type="button" class="btn sm danger" data-batch-del>` | `ListPage.svelte` batch-delete `Button variant="danger"` | same | - |
| app.js:759 | `<button type="button" class="btn sm" data-reprice>` | `ListPage.svelte` reprice `Button` | same | - |
| app.js:774 | `<button type="button" class="btn sm primary" data-guess-apply>` | `ListPage.svelte` apply `Button variant="primary"` | same | - |
| app.js:777 | `<button type="button" class="btn sm" data-batch-clearprice>` | `ListPage.svelte` clear-price `Button` | same | - |
| app.js:862 | current rung `<span class="step on" aria-current="true">` | `RecordCard.svelte:186` identical | same | - |
| app.js:863 | other rung `<button type="button" class="step" data-open>` | `RecordCard.svelte:190-198` step button | same | - |
| app.js:864 | the rung button carries `title="<record name>"` and **no** `aria-label` | `RecordCard.svelte:197-198` sets **both** `title` and `aria-label={nameOf(rung,lang)}` | differs | (c) |
| app.js:890 | refs `<details><summary>` per reference | `RecordCard.svelte:232` `<details>` | same | - |
| app.js:893 | `'<p>' + lines(r.text) + '</p>'` - newlines become `<br>` | `RecordCard.svelte:239` splits on newline and emits `<br>` between lines (restored in R0b.4) | same | - |
| app.js:894 | `<a href="{r.url}" target="_blank" rel="noopener">daggerheart.su</a>` | `RecordCard.svelte:243-245`, same element (restored in R0b.4) | same | - |
| app.js:911 | craft chain `<a href="#/i/<id>">` inside `.craft` | `RecordCard.svelte` craft block via `recordHash(id)` | same | - |
| app.js:1054 | `ICON_PLUS` svg `aria-hidden="true"` | `app/src/lib/icons.ts` + `Icon.svelte:20` | same | - |
| app.js:1055 | `ICON_HOME` svg `aria-hidden="true"` | `icons.ts` + `Icon.svelte:20` | same | - |
| app.js:1056 | `ICON_EYE` svg `aria-hidden="true"` | `icons.ts` + `Icon.svelte:20` | same | - |
| app.js:1057 | `ICON_EYE_OFF` svg `aria-hidden="true"` | `icons.ts` + `Icon.svelte:20` | same | - |
| app.js:1058 | `ICON_NOTE` svg `aria-hidden="true"` | `icons.ts` + `Icon.svelte:20` | same | - |
| app.js:1059 | `ICON_COIN` svg `aria-hidden="true"` | `icons.ts` + `Icon.svelte:20` | same | - |
| app.js:1060 | `ICON_REF` svg `aria-hidden="true"` | `icons.ts` + `Icon.svelte:20` | same | - |
| app.js:1061 | `ICON_CRAFT` svg `aria-hidden="true"` | `icons.ts` + `Icon.svelte:20` | same | - |
| app.js:1062 | `ICON_GRIP` svg `aria-hidden="true"` | `icons.ts` + `Icon.svelte:20` | same | - |
| app.js:1308 | `goldTitle` returns ` title="<gold in words>"` or nothing | `ListPage.svelte:864` `title={goldText(m.gold ?? 0) or undefined}` | same | - |
| app.js:1318 | `<span class="goldhint" data-goldhint title>?</span>` | `ListPage.svelte:851-854` `<span class="goldhint" title={goldText(...)}>?</span>` | same | - |
| app.js:1648 | `listAsHtml` leading `'<br><br>'` before the entries | `share.ts` list renderer | same | - |
| app.js:1651 | `listAsHtml` `'<br>' + esc(stats)` per entry | `share.ts` | same | - |
| app.js:1652 | `listAsHtml` `'<br><br>' + descHtml(it)` per entry | `share.ts` | same | - |
| app.js:1654 | entries joined with `'<br><br>'` | `share.ts` | same | - |
| app.js:1692 | `imgTag`: `<img src alt="" loading="lazy" decoding="async">` plus `data-art` or `class="noart"` | `RecordCard.svelte:114-118` `alt="" loading="lazy" decoding="async"`; `TableRows.svelte` tile art the same | same | - |
| app.js:1827 | card action `<button type="button" class="btn sm[ primary]" data-<action>>` | `RecordActions.svelte:96-115` -> `Button.svelte:82-91` | same | - |
| app.js:1829 | that button's `title` and `aria-label` both the long label, because the visible text collapses to an icon on narrow screens (comment at `:1825`) | `RecordActions.svelte:99-113` passes `title=` and `label=` on all three, and `Button.svelte:85-86` emits both | same | - |
| app.js:1846 | `<input type="search" class="pickq" id="pickq" value>` | `AddToList.svelte:237-243` `type="search" class="pickq"` - **no `id`**; the live ids exist for `restoreFocus`, which the rewrite does not need | differs | (c) |
| app.js:1847 | `placeholder` and `aria-label` both `t().findList` | `AddToList.svelte:241-242`, same key | same | - |
| app.js:1852 | list chip `<button type="button" class="chip[ on]">` | `AddToList.svelte:346` list chips | same | - |
| app.js:1859 | `<input type="text" id="newlist" value placeholder=t().listNamePh>` | `AddToList.svelte:264-270`, no `id` | differs | (c) |
| app.js:1860 | `<button type="button" class="btn sm primary" data-act="createFor" data-val>` = `t().create` | `AddToList.svelte:274` create `Button` | same | - |
| app.js:1861 | `<button type="button" class="btn sm ghost" data-act="cancelNew">` = `t().cancel` | `AddToList.svelte:275` cancel `Button variant="ghost"` | same | - |
| app.js:1863 | `<button type="button" class="chip ghost" data-act="newListFor">` = `+ t().newList` | `AddToList.svelte:278` new-list chip | same | - |
| app.js:1892 | menu toggle `<button type="button" class="btn sm[ primary][ on]">` | `AddToList.svelte:282-289` `Button on={open} caret` | same | - |
| app.js:1893 | menu toggle `data-act="menu" data-val` plus `aria-expanded="true/false"` | `AddToList.svelte:286` `expanded={open}` -> `Button.svelte:87` | same | - |
| app.js:1974 | roll options joined with `'<br><br>'` in the copied HTML | `share.ts` `shareRoll` | same | - |
| app.js:2010 | `<span class="badge uniq" title=t().uniqueHint>` | `RecordCard.svelte:134` `<span class="badge {b.cls}" title={b.title}>`, titles from `label.ts:62` | same | - |
| app.js:2025 | card name `<a href="#/i/<id>" title=t().openPage>` | `RecordCard.svelte:142` same | same | - |
| app.js:2029 | `<button type="button" class="card-media" data-open aria-label=t().openPage>` | `RecordCard.svelte:113` same element and label | same | - |
| app.js:2036 | copy-name `<button type="button" data-copy-name title aria-label=t().copyName>` | `RecordActions.svelte:79-86`, both `t.copyName` | same | - |
| app.js:2037 | copy-link `<button type="button" data-share title aria-label=t().copyLink>` | `RecordActions.svelte:87-94`, both `t.copyLink` | same | - |
| app.js:2067 | or-separator `'<br><br><b>- ' + t().or + ' -</b><br><br>'` in copied HTML | `share.ts` `shareRoll`, `t.or` passed from `StdPanel.svelte:66` / `AltPanel.svelte:93` | same | - |
| app.js:2073 | `<button type="button" class="btn sm" data-copy-roll="<ids>">` | `StdPanel.svelte:143` / `AltPanel.svelte:185` `Button size="sm" label={t.copyRoll}` | same | - |
| app.js:2100 | comment: "Deliberately type=text. A number input refuses setSelectionRange" | `NumberField.svelte:3-5` carries the same reason | same | - |
| app.js:2107 | step-down `<button type="button" data-step="-1" data-for aria-label=t().stepDown>` | `NumberField.svelte:110-118` `aria-label={stepDownLabel}` | same | - |
| app.js:2108 | `<input type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off">` | `NumberField.svelte:122-125`, all four identical | same | - |
| app.js:2112 | that input's `id`, `value`, `data-min`, `data-max` | `NumberField.svelte` holds min/max as props and emits **no `id`**, no `data-min`/`data-max` | differs | (c) |
| app.js:2113 | that input's `aria-label=t().rollResult` | `NumberField.svelte:126` `aria-label={label}`; every caller passes `t.rollResult` | same | - |
| app.js:2114 | step-up `<button type="button" data-step="1" data-for aria-label=t().stepUp>` | `NumberField.svelte:129-135` `aria-label={stepUpLabel}` | same | - |
| app.js:2129 | kind chip `<button type="button" class="chip[ on]">` | `Chip.svelte:60-70` button branch | same | - |
| app.js:2131 | kind chip `aria-pressed="true/false"` | `Chip.svelte:65` `aria-pressed={on}` | same | - |
| app.js:2132 | the last-on kind chip gets `data-last="1"` and `title=t().keepOneKind` | `StdPanel.svelte:129`, `AltPanel.svelte:173`, `SearchPage.svelte:101` pass the `title`; **no `data-last`** | differs | (c) |
| app.js:2145 | rarity chip `<button type="button" class="chip[ on]" data-act data-val>` | `Chip.svelte` button branch with `value` | same | - |
| app.js:2158 | help `<button type="button" class="helpbtn[ on]" data-act="help" data-val>` | `HelpButton.svelte:28-34` | same | - |
| app.js:2159 | help `title` and `aria-label` both `t().whatIsThis` | `HelpButton.svelte:31-32` both `t.helpHint` - the same two strings under a renamed key, see Part B | same | - |
| app.js:2160 | help `aria-expanded="true/false"` | `HelpButton.svelte:33` | same | - |
| app.js:2168 | home `<button type="button" class="homebtn[ on]" data-act="home">` | `PageHead.svelte:52-58` | same | - |
| app.js:2169 | home `title` = `t().isHome` when on else `t().setHome` | `PageHead.svelte:56` `title={on ? t.homeOn : t.homeHint}` - same two strings, renamed keys | same | - |
| app.js:2170 | home `aria-label` = the same pair | `PageHead.svelte:57` | same | - |
| app.js:2171 | home `aria-pressed="true/false"` | `PageHead.svelte:58` | same | - |
| app.js:2212 | dice `<button type="button" class="btn primary">` | `DiceBar.svelte:27-31` | same | - |
| app.js:2214 | dice `title="<roll> <n>d12 - <rarities>"` | `DiceBar.svelte:31`, same composition | same | - |
| app.js:2225 | source chip `<button type="button" class="chip[ on]">` | `Chip.svelte` button branch | same | - |
| app.js:2227 | source chip `aria-pressed` | `Chip.svelte:65` | same | - |
| app.js:2228 | the last-on source chip gets `data-last="1"` and `title=t().keepOneSource` | `StdPanel.svelte:114` passes the `title`; no `data-last` | differs | (c) |
| app.js:2235 | std results `<div class="results" role="status" aria-live="polite">` | `StdPanel.svelte:150` identical (restored in R0b.4) | same | - |
| app.js:2269 | crit table link `<a class="btn sm" target="_blank" rel="noopener">` | `AltPanel.svelte:204` `Button href=` with no `sameTab`, so `Button.svelte:75-76` emits `target="_blank" rel="noopener"` | same | - |
| app.js:2270 | that link's absolute `href` from `tableHref` | `AltPanel.svelte:204` `app.linkTo(tablesHash(...))` - absolute for the same reason | same | - |
| app.js:2272 | bump `<button type="button" class="btn sm" data-act="rarity" data-val>` | `AltPanel.svelte:208-217` | same | - |
| app.js:2286 | `<button type="button" class="btn primary" data-act="rollDuality">` | `AltPanel.svelte:155-162` | same | - |
| app.js:2292 | alt results `<div class="results" role="status" aria-live="polite">` | `AltPanel.svelte:192` identical | same | - |
| app.js:2305 | comment: absolute href so it survives `target="_blank"` | `app/src/lib/hash.ts` with `app.linkTo`, same reason | same | - |
| app.js:2321 | wondrous roll `<button type="button" class="btn primary" data-act="roll">` | `RollPanel.svelte` roll `Button variant="primary"` | same | - |
| app.js:2325 | wondrous results `role="status" aria-live="polite"` | `RollPanel.svelte:128` identical | same | - |
| app.js:2337 | dread roll `<button type="button" class="btn primary" data-act="roll">` | `RollPanel.svelte` (dread routes through the same panel) | same | - |
| app.js:2341 | dread results `role="status" aria-live="polite"` | `RollPanel.svelte:128` | same | - |
| app.js:2358 | voa section chip `<button type="button" class="chip[ on]">` | `VoaPanel.svelte:31-38` | same | - |
| app.js:2364 | voa roll `<button type="button" class="btn primary" data-act="roll">` | `RollPanel.svelte` roll button | same | - |
| app.js:2368 | voa results `role="status" aria-live="polite"` | `RollPanel.svelte:128` | same | - |
| app.js:2381 | community chip `<button type="button" class="chip[ on]" data-act="comm" data-val>` | `CommunityPanel.svelte:41-49` | same | - |
| app.js:2387 | community roll `<button type="button" class="btn primary" data-act="roll">` | `RollPanel.svelte` roll button | same | - |
| app.js:2391 | community results `role="status" aria-live="polite"` | `RollPanel.svelte:128` | same | - |
| app.js:2401 | `<button type="button" class="tsec-link" data-copy-sec>` | `SectionHead.svelte:19` | same | - |
| app.js:2402 | that button's `title` and `aria-label` both `t().copySection` | `SectionHead.svelte:19` `{title} aria-label={title}`; `TablesPage.svelte:532,578` pass `t.copySection` | same | - |
| app.js:2446 | table-group nav `<a class="chip[ on]" href="#/tables/<sub>">` with **no** `aria-current` | `Chip.svelte:48-57` href branch adds `aria-current={on ? 'page' : undefined}` | differs | (c) |
| app.js:2452 | table-section nav `<a class="chip sm[ on]" href="#/tables/<id>">`, no `aria-current` | `Chip.svelte:53` adds `aria-current="page"` | differs | (c) |
| app.js:2554 | empty-result reset `<button type="button" class="btn sm" data-act="flt" data-val="reset">` | `TablesPage.svelte` empty-state reset `Button size="sm"` | same | - |
| app.js:2565 | tables search `<input type="search" id="tq" value placeholder=t().searchPh>` | `TablesPage.svelte:482-486` -> `SearchBox.svelte:33-38`; no `id` | differs | (c) |
| app.js:2566 | table-link `<button type="button" class="btn" data-copy-sec title aria-label=t().tableLink>` | `TablesPage.svelte:490` `Button title={t.tableLink} label={t.tableLink}` -> `Button.svelte:85-86` | same | - |
| app.js:2568 | view switch `<div class="seg small" role="group" aria-label=t().view>` | `Seg.svelte:26`; `TablesPage.svelte:497` passes `t.view` | same | - |
| app.js:2569 | list-view `<button type="button" data-act="view" data-val="list"[ class="on"]>`, **no `aria-pressed`** | `Seg.svelte:31` adds `aria-pressed`, deliberately (`Seg.svelte:5-7`) | differs | (c) |
| app.js:2570 | grid-view button, same shape, no `aria-pressed` | `Seg.svelte:31` adds `aria-pressed` | differs | (c) |
| app.js:2680 | filter toggle `<button type="button" class="btn sm ftoggle[ has]">` | `FilterBar.svelte:70-76` `Button variant={chosen.length ? 'toggle' : 'plain'} caret` | same | - |
| app.js:2681 | filter toggle `data-act="fOpen" aria-expanded="true/false"` | `FilterBar.svelte:74` `expanded={open}` -> `Button.svelte:87` | same | - |
| app.js:2685 | chosen-value pill `<button type="button" class="fpill" data-act="flt">` | `FilterBar.svelte:80-87` | same | - |
| app.js:2687 | pill `title=t().dropValue`, text is the value plus `<i>&times;</i>` | `FilterBar.svelte:85` | same | - |
| app.js:2690 | `<button type="button" class="fclear" data-act="flt" data-val="reset">` | `FilterBar.svelte:92` | same | - |
| app.js:2692 | `<button type="button" class="flink" data-act="fLink">` | `FilterBar.svelte:93-95` | same | - |
| app.js:2693 | flink `title` and `aria-label` both `t().filterLink` | `FilterBar.svelte:96-97` | same | - |
| app.js:2710 | facet chip `<button type="button" class="chip[ on]">` | `Chip.svelte` button branch via `FilterBar.svelte` | same | - |
| app.js:2712 | facet chip `aria-pressed="true/false"` | `Chip.svelte:65` | same | - |
| app.js:2762 | list-empty reset `<button type="button" class="btn sm" data-act="flt" data-val="reset">` | `TablesPage.svelte` empty-state reset | same | - |
| app.js:2784 | select-all `<input type="checkbox" data-sel-all="<ids>">` with **no** `aria-label` or `title` | `TableRows.svelte:94-99`, no name either | same | - |
| app.js:2805 | row body `<button type="button" class="row-main" data-open>` with no `aria-label` | `RowMain.svelte:48-52`, deliberately no `aria-label` | same | - |
| app.js:2816 | row remove `<button type="button" class="row-x" data-remove title aria-label=t().removeItem>` | `ListPage.svelte:880-886` | same | - |
| app.js:2828 | row tick `<label class="selbox"><input type="checkbox" data-sel[ checked]>` | `TableRows.svelte:118-122` and `:149-153` | same | - |
| app.js:2829 | that box's `aria-label=t().selected` | `TableRows.svelte:122,153` | same | - |
| app.js:2836 | grid tile `<button type="button" class="tile" data-open>` | `TableRows.svelte:157-162`, no `aria-label` (`:159` says so) | same | - |
| app.js:2841 | kind dot `<span class="..." title="<equipment word or cons/item>">` | `TableRows.svelte:175`, same ternary | same | - |
| app.js:2870 | search page `<input type="search" id="sq" value placeholder=t().searchPh autofocus>` | `SearchPage.svelte:86-90` -> `SearchBox.svelte:33-38`: no `id`, and focus is driven from `onMount` rather than the attribute (`SearchBox.svelte:6-11`) | differs | (c) |
| app.js:2894 | comment: the cross lives inside the summary because a closed `<details>` hides everything else | `StorageNotice.svelte:36-42` carries the same reason | same | - |
| app.js:2896 | storage warning `<details class="warn"><summary>` | `StorageNotice.svelte:42`, wrapped in `{#key app.lang}` so it folds on a language switch the way live's re-render does | same | - |
| app.js:2898 | `<button type="button" class="warn-x" data-act="hideWarn">` | `StorageNotice.svelte:44-49` | same | - |
| app.js:2899 | warn-x `title` and `aria-label` both `t().dismiss` | `StorageNotice.svelte:47-48` | same | - |
| app.js:2909 | list card `<a class="listcard-main" href="<listHash(l)>">` - one-argument `listHash`, so the GM payload is rendered | `ListsPage.svelte:239-243` reproduces the one-argument call | n.a. - `docs/specs/DEBT.md` D2 | - |
| app.js:2918 | `<button type="button" class="btn sm" data-share-list>` = icon plus `t().share` | `ListsPage.svelte:164-167` | same | - |
| app.js:2919 | `<button type="button" class="btn sm danger" data-del-list>` = `t().del` | `ListsPage.svelte` delete `Button variant="danger"` | same | - |
| app.js:2930 | `<input type="text" id="lname" value placeholder=t().listNamePh>` | `ListsPage.svelte:113-119`, no `id` | differs | (c) |
| app.js:2931 | `<button type="button" class="btn primary" data-act="createList">` = `t().create` | `ListsPage.svelte:121` | same | - |
| app.js:2936 | `<input type="text" id="limport" value placeholder=t().importPh>` | `ListsPage.svelte:127`, no `id` | differs | (c) |
| app.js:2937 | `<button type="button" class="btn" data-act="importList">` = `t().importBtn` | `ListsPage.svelte:129` | same | - |
| app.js:2957 | money chip `<button type="button" class="chip[ on]">` | `Chip.svelte` button branch | same | - |
| app.js:2959 | the current money chip gets `aria-current="true"`, and nothing when off | `Chip.svelte:65` emits `aria-pressed={on}` instead - `aria-current="page"` sits on the href branch, which the money picker does not use. Two differences in one: the attribute and, on the nav chips, its value | differs | (a) |
| app.js:2962 | money help `<button type="button" class="helpbtn sm[ on]">` | `HelpButton.svelte:28-34` with the small variant | same | - |
| app.js:2963 | money help `data-act="moneyHelp" aria-expanded="true/false"` | `HelpButton.svelte:33` | same | - |
| app.js:2964 | money help `title`/`aria-label` both `t().whatIsThis` | `HelpButton.svelte:31-32` both `t.helpHint` | same | - |
| app.js:2980 | list-not-found `<a class="btn primary" href="#/lists">` = `t().lists` | `ListPage.svelte:579` with `sameTab`, which suppresses `target`/`rel` and matches live | same | - |
| app.js:2984 | rename `<input type="text" id="rename" class="titleinput" value data-list aria-label=t().rename>` | `ListPage.svelte:591-597`: `aria-label={t.rename}` present, `id` and `data-list` absent | differs | (c) |
| app.js:2988 | `<button type="button" class="btn sm" data-share-list>` (players' link) | `ListPage.svelte:606` | same | - |
| app.js:2990 | `<button type="button" class="btn sm" data-share-gm>` | `ListPage.svelte:608` | same | - |
| app.js:2992 | `<button type="button" class="btn sm" data-copy-listtext>` = icon plus `t().copyText` | `ListPage.svelte:609` | same | - |
| app.js:2994 | `<button type="button" class="btn sm danger" data-del-list>` = `t().del` | `ListPage.svelte:615` | same | - |
| app.js:3026 | list roll panel `<details class="panel lroll" data-keep="roll:<id>"` plus `open` **whenever a roll result exists** - the comment at `:3022-3025` gives the reason: the panel opens itself once a roll has been made, so the result is not hidden behind its own button | `ListPage.svelte:651` `<details class="panel lroll">` - no `open` binding, no `data-keep`. Svelte never rebuilds the element, so the user toggle survives; what is gone is the rule that a panel holding a result renders open. No path was found that reaches the auto-open without the panel already being open - the roll button and the number field both live inside it - so this is a lost question rather than a known divergence | differs | (b) |
| app.js:3031 | `<button type="button" class="btn primary" data-act="rollList" data-val>` | `ListPage.svelte:665-667` | same | - |
| app.js:3033 | `<button type="button" class="btn ghost" data-act="clearRoll">` = `t().clear` | `ListPage.svelte:668`, behind the same `{#if hit}` | same | - |
| app.js:3049 | rolled-entry note `<b>label</b>` plus `lines(text)` inside `.hitnote` | `HitNote.svelte:28-32` splits the text into `<br>`-separated lines | same | - |
| app.js:3062 | row note box `<div class="rnote" data-keep="rnote:<key>"[ hidden]>` - always in the DOM, revealed by dropping `hidden` | `ListPage.svelte:894` `<div class="rnote" hidden={boxHidden(...)}>` - the same `hidden` mechanism; `data-keep` is unnecessary because Svelte does not rebuild it | same | - |
| app.js:3069 | grip `<span class="lrow-grip" draggable="true" data-drag title=t().dragHint aria-hidden="true">` | `ListPage.svelte:793-798`, all three | same | - |
| app.js:3072 | `<label class="lrow-pick"><input type="checkbox" data-lsel[ checked]>` | `ListPage.svelte:800-806` | same | - |
| app.js:3073 | that box carries `aria-label=t().pickRow` | `ListPage.svelte:804` | same | - |
| app.js:3074 | position `<input type="number" class="lrow-n" min="1" max="<len>">` | `ListPage.svelte:810-814` | same | - |
| app.js:3075 | position input `inputmode="numeric" value data-pos` | `ListPage.svelte:815-816` has `inputmode` and `value`; no `data-pos` | differs | (c) |
| app.js:3076 | position `aria-label=t().position` | `ListPage.svelte:817` | same | - |
| app.js:3077 | list row body `<button type="button" class="row-main" data-open>` | `RowMain.svelte`, shared with the tables rows | same | - |
| app.js:3089 | qty `<input type="number" min="1" max="99" inputmode="numeric" data-qty value placeholder="1">` | `ListPage.svelte:835-844` | same | - |
| app.js:3095 | gold `<input type="number" min="0" max="99999" inputmode="numeric" data-gold>` | `ListPage.svelte:855-862` | same | - |
| app.js:3096 | gold `value`, `placeholder` em-dash, and `goldTitle(...)` | `ListPage.svelte:863-864` | same | - |
| app.js:3099 | `<button type="button" class="lrow-note[ on]" data-note-toggle>` | `ListPage.svelte:871-878` | same | - |
| app.js:3100 | note button `title`/`aria-label` both `t().note` | `ListPage.svelte:876-877` | same | - |
| app.js:3101 | row remove `<button type="button" class="row-x" data-remove title aria-label=t().removeItem>` | `ListPage.svelte:880-886` | same | - |
| app.js:3110 | list note `<details class="lnote" data-keep="note:<id>"` plus `open` when either note is non-empty | `ListPage.svelte:640` `open={untrack(...)}` - an initial value only, which is the live effect once `data-keep` has recorded a toggle | same | - |
| app.js:3133 | `<button type="button" class="note-x" data-note-clear>` | `ListPage.svelte:537-543` and `:555-561`, one per note field | same | - |
| app.js:3134 | note-x `title`/`aria-label` both `t().noteClear` | `ListPage.svelte:541-542`, `:559-560` | same | - |
| app.js:3137 | `<textarea ... placeholder>esc(value)</textarea>` - the value is a text child, not a property | `ListPage.svelte:546-551` `placeholder` plus `use:seedText`, which writes `node.textContent` once at mount for exactly that reason (`:524-530`) | same | - |
| app.js:3150 | shared-list-not-found `<a class="btn primary" href="#/roll/std">` = `t().toStart` | `SharedListPage.svelte:84` with `sameTab` | same | - |
| app.js:3161 | shared-list note `<b>label</b>` plus `lines(text)` in `.hitnote` | `HitNote.svelte:28-32` | same | - |
| app.js:3213 | record-not-found `<a class="btn primary" href="#/roll/std">` = `t().toStart` | `RecordPage.svelte:63` with `sameTab` | same | - |
| app.js:3228 | `<a class="itemtable" href="<back>">` = `t().showInTable` plus the external icon | `RecordPage.svelte:67-71`, same tab | same | - |
| app.js:3260 | print `<a class="btn[ sm]" href="#/print/<ids>">` with **no** `target`/`rel` | `Button.svelte:70-79` with `sameTab` passed at `ListPage.svelte:611`, `RecordModal.svelte:117`, `RecordPage.svelte:96`, `SelBar.svelte:60` | same | - |
| app.js:3261 | print link `title=t().printHint`, text is icon plus `t().print`, **no** `aria-label` | the four call sites pass `title` and no `label`, so `Button` emits no `aria-label` | same | - |
| app.js:3281 | `printGlyph` `<svg class="pc-glyph" viewBox="0 0 48 50" aria-hidden="true">` | `PrintCard.svelte:251-254` | same | - |
| app.js:3321 | ribbon `<img src="<ribbon or ribbon-mag>" alt="">` | `PrintCard.svelte:197-202` | same | - |
| app.js:3340 | die `<img src="<die-N-phy or -mag>" alt="">` when owned | `PrintCard.svelte:183-186` | same | - |
| app.js:3349 | threshold dots `<img src="card/dotsN.svg" alt="">` | `PrintCard.svelte:222,226,230` | same | - |
| app.js:3353 | threshold box `<img src="<thbox>" alt="">` | `PrintCard.svelte:224,228` | same | - |
| app.js:3355 | threshold arrow `<img class="pc-th-arrow" src="card/arrow.svg" alt="">` | `PrintCard.svelte:225,229` | same | - |
| app.js:3398 | tier banner `<span class="pc-tier"><img src="<banner>" alt="">` | `PrintCard.svelte:152-153` | same | - |
| app.js:3402 | armour shield `<span class="pc-shield"><img src="<shield>" alt="">` | `PrintCard.svelte:160-161` | same | - |
| app.js:3411 | burden `<img src="<burden-1 or -2>" alt="">` | `PrintCard.svelte:165-167` | same | - |
| app.js:3423 | blurred backdrop `<img class="pc-back" src alt="" aria-hidden="true">` | `PrintCard.svelte:246-250` | same | - |
| app.js:3424 | print art `<img class="pc-img" src alt="">` | `PrintCard.svelte:251` | same | - |
| app.js:3530 | print-empty `<a class="btn primary" href="#/lists">` = `t().lists` | `PrintPage.svelte:86` with `sameTab` | same | - |
| app.js:3545 | `<button type="button" class="btn" data-act="printBack">` = icon plus `t().back` | `PrintPage.svelte:91` | same | - |
| app.js:3546 | `<button type="button" class="btn primary" data-act="doPrint">` = icon plus `t().printNow` | `PrintPage.svelte:92` | same | - |
| app.js:3547 | art switch `<div class="seg small" role="group" aria-label=t().printTitle>` | `Seg.svelte:26` with `small`; `PrintPage.svelte:97` passes the label | same | - |
| app.js:3548 | colour `<button type="button" data-act="printArt" data-val="color">`, no `aria-pressed` | `Seg.svelte:31` adds `aria-pressed` | differs | (c) |
| app.js:3550 | b/w `<button type="button" data-act="printArt" data-val="bw">`, no `aria-pressed` | `Seg.svelte:31` adds `aria-pressed` | differs | (c) |
| app.js:3553 | `<button type="button" class="btn" data-act="printLink">` = icon plus `t().printLink` | `PrintPage.svelte:102` | same | - |
| app.js:3671 | `syncChrome` ends with `document.title = t().docTitle`, overwriting the record name written at `:3808` | `Shell.svelte:26-29` writes `document.title = app.t.docTitle` unconditionally, reproducing the overwrite | n.a. - `docs/specs/DEBT.md` D5 | - |
| app.js:3683 | tab `<a href="#/<tab>" class="[on][ sep]">` with **no** `aria-current` | `TabBar.svelte:34-39` adds `aria-current={section === current ? 'page' : undefined}` | differs | (c) |
| app.js:3726 | `<button type="button" class="selx" data-act="clearSel">` | `SelBar.svelte:47-53` | same | - |
| app.js:3727 | selx `title`/`aria-label` both `t().clearSel` | `SelBar.svelte:51-52` | same | - |
| app.js:3732 | `<button type="button" class="btn sm" data-act="copySel">` = icon plus `t().copySel` | `SelBar.svelte:63` | same | - |
| app.js:3778 | comment: the page is rebuilt whole, so `<details>` openness lives in `S.keepOpen` | no counterpart needed - Svelte does not rebuild the element; the equivalent reasons are at `ListPage.svelte:647-650` and `RecordCard.svelte:670-673` | same | - |
| app.js:3808 | record route `document.title = nameOf(it) + em-dash + t().docTitle`, then overwritten at `:3671` | `Shell.svelte:28` writes only `app.t.docTitle` - the rewrite never writes the record name at all, reaching the same rendered title by a shorter route | n.a. - `docs/specs/DEBT.md` D5 | - |
| app.js:3814 | stored-list route `document.title = t().docTitle` | `Shell.svelte:28` | same | - |
| app.js:3829 | shared-list route `document.title = t().docTitle` | `Shell.svelte:28` | same | - |
| app.js:3833 | every other route `document.title = t().docTitle` | `Shell.svelte:28` | same | - |
| app.js:4152 | list delete guarded by `confirm(t().deleteConfirm.replace('%s', l.name))` | `ListPage.svelte:213` and `ListsPage.svelte:73` `app.env.dialog.confirm(...)`, same string and substitution | same | - |

**Part A counts**: 216 rows of 216 matching lines (complete).
`same` 192, `differs` 21, `absent` 0, `n.a.` 3.
Non-`same` by home: **(a) 1, (b) 1, (c) 19**.

The `(c)` cluster is one observation repeated. The rewrite drops the live app
`id` and `data-*` grips (nine rows), because those exist for `restoreFocus`,
`restoreOpen` and the delegated `data-act` dispatcher, none of which the rewrite
has; and it *adds* `aria-pressed`, `aria-current` or `aria-label` where live had
none (eight rows). Neither class loses behaviour, but both change what a future
instrument can grip, which is why they are recorded rather than dropped.

---

### Part B - the dictionary

**Extraction.** `app.js`'s `const T = {...}` was parsed with the same
brace-matcher `tests/i18n.js:9-17` uses, and flattened with the same `walk`.
`app/src/lib/dict.ts`'s `ru` and `en` object literals were parsed the same way.

**Counts read, not assumed**: live `T.ru` **251** flattened keys, `T.en` **251**
- the figure `docs/specs/I18N.md:9` records. `dict.ts` **252** keys per
language. 42 `dict.ts` keys have no live counterpart under the same name; most
are the renamings below.

One row per key that is not identical. Keys not listed are byte-identical in
both languages.

| where | live | rewrite | verdict | home |
|---|---|---|---|---|
| `T.*.tabs.{std,alt,wondrous,dread,voa,community,tables,lists,search}` (9 keys) | nested under `tabs`, read by `renderTabs` (`app.js:3684`) | flattened to the top level in `dict.ts:29-40` / `:361-372`, read by `TabBar.svelte:38` `t[key]`. Values identical in both languages except `community` (next row) | same | - |
| `T.*.community` | `Сообщество` / `Community` - the singular label above the community picker | `dict.ts:156,464` `communityLabel` holds exactly those two strings; `dict.ts` reuses the name `community` for the **tab** word (`Сообщества` / `Communities`), which live keeps at `T.*.tabs.community` | same | - |
| `T.*.help.{std,alt,wondrous,dread,voa,community,tables,lists}` (8 keys, array-valued) | arrays of help paragraphs, several carrying `<b>` and `<a>` markup | restructured into `app/src/lib/help.ts` as `{lead, text, link}` parts and rendered by `HelpBox.svelte`. Listed here for a rendered comparison, not a string one; `help.test.ts` and the `#/...~help` golden states are the instruments that hold it | listed for rendered comparison | - |
| `T.*.pages.{std,alt,wondrous,dread,voa,community,tables,lists,search}` (9 keys, array-valued `[title, sub]`) | `[heading, subheading]` per section | split into `dict.ts` `page*` and `sub*` pairs (`:145-166`, `:402-...`): `pageStd`/`subStd`, `pageAlt`/`subAlt`, `pageWondrous`/`subWondrous`, `pageDread`/`subDread`, `pageVoa`/`subVoa`, `pageCommunity`/`subCommunity`, `tables`/`subTables`, `lists`/`subLists`, `search`/`subSearch` | same | - |
| `T.*.foot` | one HTML string containing `<a href="https://www.daggerheart.com" target="_blank" rel="noopener">daggerheart.com</a>`, written with `innerHTML` at `app.js:3838`. Carries `Hope &amp; Fear` as an entity | `dict.ts:81-84`, `:405-408` split into `footBefore`/`footLink`/`footAfter`, assembled as a real element at `Shell.svelte:69-71`. `footBefore` carries the literal `Hope & Fear`, which is what live renders | same | - |
| `T.*.whatIsThis` | `Как это работает` / `How this works` | `dict.ts:152,462` `helpHint`, byte-identical | same | - |
| `T.*.setHome` | `Открывать этот раздел при запуске` / `Open this section on start` | `dict.ts:148,460` `homeHint`, byte-identical | same | - |
| `T.*.isHome` | `Открывается при запуске` / `Opens on start` | `dict.ts:151,461` `homeOn`, byte-identical | same | - |
| `T.*.tierLadder` | `Ранг` / (EN equivalent) - the label on the upgrade ladder | `dict.ts:163` `tier`, the same word, reused for the stat line too | same | - |
| `T.*.pcTh` | `Пороги` - the print card threshold caption | `dict.ts:164` `eqTh`, same word | same | - |
| `T.*.bumpTo` | `Поднять до` / `Bump to`, composed at `app.js:2273` with a genitive rarity from `RAR_GEN_RU` | `dict.ts:132-138`, `:448-451` carry the four whole phrases (`bumpUncommon`..`bumpLegendary`) with the comment that Russian needs the genitive. `AltPanel.svelte:216` renders `t[up.label]`. The rendered strings match | same | - |
| `T.*.moneyHelp` | one HTML paragraph on gold, rendered at `app.js:2970` into `.helpbox.money-help` | moved into `app/src/lib/help.ts` and rendered through `HelpBox.svelte`. Listed for a rendered comparison | listed for rendered comparison | - |
| `T.*.voaRecall` | `Стоимость Призыва` - **no `t().voaRecall` call site exists in `app.js`**; it is one of the dead keys `tests/i18n.js:43` reports | the phrase survives inside `help.ts:196-198` as the VoA help lead. Nothing is lost | same | - |
| `T.*.guessPrice` | `Подсказать цены` - **no `t().guessPrice` call site in `app.js`**; a dead key | not in `dict.ts`; nothing asks for it | same | - |
| `T.*.printFoot` | `Лут Daggerheart` - **no `t().printFoot` call site in `app.js`**; a dead key | not in `dict.ts`; the wordmark is written literally at `Shell.svelte:45` | same | - |
| `T.*.copied` | `Скопировано` - the fallback toast in `copyRich`/`copyText` when no message is passed (`app.js:1026,1031`). Every one of the twelve live call sites passes an explicit message, so the fallback is unreachable | no key in `dict.ts`; `clipboard` callers in the rewrite always pass a message too | same | - |
| `T.*.rollCopied` | `Варианты скопированы` / the EN twin - the toast after `data-copy-roll` (`app.js:4142`), distinct from `textCopied` | `StdPanel.svelte:65-69` and `AltPanel.svelte:92-96` both say `t.textCopied` (`Текст скопирован`) after copying the roll options. `rollCopied` exists in neither `dict.ts` side. The button label is unaffected (`copyRoll` is present in both) | absent | (a) |
| `T.*.imgSaved` | `Картинка сохранена` - the toast after `downloadImage` (`app.js:1724`), the fallback `copyImage` takes when `ClipboardItem` image write is unavailable or rejects | no key in `dict.ts`, and **no download fallback exists**: `RecordActions.svelte:57-61` says `t.copyFailed` instead. The whole "save the PNG to disk" path (`app.js:1717-1726`, `safeFileName`, the `<a download>`) has no counterpart in `app/src/` | absent | (a) |
| `T.*.imgFailed` | `Не удалось получить картинку` - the error toast when the PNG cannot be produced at all (`app.js:1725`) | `RecordActions.svelte:60` says `t.copyFailed`. The distinction between "the clipboard refused" and "the picture could not be read" is gone | absent | (a) |

**Part B counts**: 19 rows over the keys that are not identical.
Summary, in the three counts the plan asks for:
- **keys absent from `dict.ts`**: 24 by name, of which **21 are renames or
  restructurings with identical rendered values** (9 `tabs.*`, 9 `pages.*`,
  `whatIsThis`, `setHome`, `isHome`, `tierLadder`, `pcTh`, `bumpTo`, `foot`,
  `community`, plus the three live-dead keys `voaRecall`, `guessPrice`,
  `printFoot` and the unreachable `copied`) and **3 are real losses**
  (`rollCopied`, `imgSaved`, `imgFailed`).
- **keys present on both sides whose plain-string value differs**: **0**. The
  one raw mismatch the extraction reported, `community`, is a key collision and
  not a changed string: the rewrite reuses the name for the tab word and keeps
  the singular under `communityLabel`.
- **HTML-valued keys listed for a rendered comparison rather than a string
  one**: **17** - the 8 `help.*` arrays and `moneyHelp`, plus the 8 help
  paragraphs inside them that carry `<a>`/`<b>` markup (`app.js:212, 219, 226,
  233, 238, 250` and the EN twins), all of which are Part A rows as well.

Non-`same` by home: **(a) 3, (b) 0, (c) 0**.

---

### Part F - the entry document's body

`index.html:40-81` against `app/index.html` and `Shell.svelte`. Rows past line
81 are marked "beyond the range" - they are body elements of the same document
and were cheap to read, so they are reported rather than left out.

| where | live | rewrite | verdict | home |
|---|---|---|---|---|
| index.html:2 (context for the row below) | `<html lang="ru">` in the served markup | `app/index.html:2` `<html lang="ru">`, identical | same | - |
| **`<html lang>` on a language switch** | `app.js:3839`, inside `render()`: `document.documentElement.lang = S.lang`. `render()` runs on every language press, so the attribute follows the switch | `Shell.svelte:26-29` `$effect` writes `document.documentElement.lang = app.lang`, with the reason in the comment above it. **The rewrite does update it, the same way live does.** This was the row the dispatch singled out; it is clean | same | - |
| index.html:37 | `<a class="skip" href="#view" id="skip"></a>` - empty in the markup; `syncChrome` (`app.js:3669-3670`) fills `textContent` with `t().skipToContent` | `Shell.svelte:32` `<a class="skip" href="#main">{app.t.skipToContent}</a>` - the text is in the template, so it is never momentarily empty; the target id moved with the element it points at (below); `id="skip"` is gone with `syncChrome` | differs | (c) |
| index.html:39-44 | `<header class="topbar"><div class="wrap topbar-in">`, brand `<a class="brand" href="#/roll/std">` with `<svg class="brand-ico" aria-hidden="true">` | `Shell.svelte:34-46`: same header, same brand link, same `aria-hidden`. The `wrap` class is gone because `Shell.svelte:106-114` puts `width: var(--wrap)` on `.topbar-in` directly | same | - |
| index.html:43 | `<span class="brand-txt"><b>Лут</b><i>Daggerheart</i></span>` - a wordmark, not a translated string | `Shell.svelte:45`, identical, with the note at `:40-44` that an earlier rewrite had wrongly put it in the dictionary | same | - |
| index.html:46 | `<div class="seg" id="langSeg" role="group">` - **no `aria-label` in the markup**; `syncChrome` (`app.js:3666`) sets it to `t().langLabel` after the first render | `Shell.svelte:48-55` -> `Seg.svelte:26` `role="group" aria-label={label}`, present from the first paint | same | - |
| index.html:47-48 | `<button data-lang="ru" class="on">RU</button>` and its EN twin - **no `type="button"`**; `aria-pressed` is added by `syncLangButtons` (`app.js:3673-3678`) | `Seg.svelte:28-34` emits `type="button"` and `aria-pressed` from the template. Both apps end with the same `aria-pressed`; the rewrite also has `type="button"`, which the live buttons lack | differs | (c) |
| index.html:52 | `<nav class="tabs wrap" id="tabs"></nav>` - empty, filled by `renderTabs`; `aria-label` set by `syncChrome` to `t().sectionsLabel` | `TabBar.svelte:32` `<nav class="tabs" aria-label={label}>`, label present from the template, the nine tabs in the markup rather than injected | same | - |
| index.html:55 | `<main class="wrap" id="view" tabindex="-1"></main>` | `Shell.svelte:61-63` `<main id="main" tabindex="-1">`. `tabindex="-1"` preserved - the skip link lands here - but the **id changed from `view` to `main`**, and the skip link moved with it. `#view` appears in no spec, fixture or route grammar: `docs/specs/CONTRACTS.md` names routes, record ids, links and asset paths, not DOM ids | differs | (c) |
| index.html:56-58 | Russian comment explaining why the `<noscript>` block exists | `app/index.html:46-50` carries the same explanation in English, plus why the `wrap` class is dropped | same | - |
| index.html:59-73 | `<noscript><div class="wrap" style="padding:24px 0">` with `<h1>`, the Russian paragraph, a `<ul>` of three links and the English paragraph repeating them plus the `<code>#</code>` note | `app/index.html:51-65`: identical text, the same six `<a href>`s, wrapper `<div style="padding:24px 0">` with `wrap` dropped because it would resolve to nothing outside a Svelte-scoped component | same | - |
| index.html:64-66, 69-70 (the six noscript hrefs) | `catalog.csv`, `data.json`, `llms.txt` resolve beside `index.html` at the repository root and on Pages | the same three relative names resolve on Pages, where the deploy collect step copies them beside `index.html`, and **to nothing under `dist/` over `file://`**, where `vite.config.mts:22-29` links only `img/`, `og/` and `card/` | differs | already homed - R0c's own **N6**, closed in the build per `plan.md`, "Decisions, each with the alternative rejected" |
| index.html:75-77 | `<footer class="wrap foot"><p id="footText"></p></footer>`, filled by `render()` with `t().foot` as HTML | `Shell.svelte:67-73` `<footer class="foot"><p>` assembled from three dictionary parts around a real `<a target="_blank" rel="noopener">`. The `id="footText"` grip is gone with the `innerHTML` write. For the text-node rule: live parses its fragment into text-node, anchor, text-node, which is what the rewrite emits directly | same | - |
| index.html:79-81 | comment plus `<div class="selbarwrap" id="selBar" hidden></div>`, after the content so the add-to-list menu opens upward into view | `Shell.svelte:75` `<SelBar {app} />`, in the same position between the footer and the toast; `SelBar.svelte` carries the same placement reason. The bar is absent from the DOM rather than `hidden` when nothing is ticked | differs | (c) |
| index.html:83-89 (beyond the range) | `<div class="modal" id="modal" hidden>` with `.modal-back[data-close]`, `<div class="modal-card" role="dialog" aria-modal="true">`, `<button class="modal-x" data-close>` (no `type`, `aria-label` set by `syncChrome`) and `<div id="modalBody">` | `RecordModal.svelte` is a native `<dialog>` opened with `showModal()` - implicit `role="dialog"` and `aria-modal`, plus real inertness and UA Escape handling the hand-rolled live version does not have (`:12-14`). `:79` and `:92-93` carry `aria-label={app.t.close}`, and `:92` adds a `title` live has not | differs | (c) |
| index.html:92 (beyond the range) | `<div class="toast" id="toast" role="status" aria-live="polite" hidden>` - the live region is **in the document from first paint and never removed**; `showToast` (`app.js:993-995`) only rewrites `role`/`aria-live` to `alert`/`assertive` for an error | `Toast.svelte:62-63` sets `role` and `aria-live` **only while `app.toast` is not null**, dropping both when it clears; the reason is at `:13-16` (otherwise a component test's `getByRole('status')` matches it while idle). A live region created at the same moment as its text is announced less reliably than one that already existed, and nothing in the tree reads this: axe cannot report a live region as absent, and the goldens photograph an empty toast either way | differs | (a) |

**Part F counts**: 16 rows, 13 inside `index.html:40-81` and 3 beyond it.
`same` 7, `differs` 9, `absent` 0, `n.a.` 0. One `differs` row is already homed
as R0c's N6 and needs no new entry.
Non-`same` by home: **(a) 1, (b) 0, (c) 7, already homed 1**.

---

### Totals for this runner

| part | rows | same | differs | absent | n.a. | (a) | (b) | (c) |
|---|---|---|---|---|---|---|---|---|
| A | 216 | 192 | 21 | 0 | 3 | 1 | 1 | 19 |
| B | 19 | 16 | 0 | 3 | 0 | 3 | 0 | 0 |
| F | 16 | 7 | 9 | 0 | 0 | 1 | 0 | 7 |
| **total** | **251** | **215** | **30** | **3** | **3** | **5** | **1** | **26** |

Part F carries one further non-`same` row whose home already exists (N6), so the
home columns sum to 32 of the 33 non-`same` rows plus that one.

Parts C, D and E belong to the other two runners; merge under one header per
`plan.md`, "Cost and the fallback".

#### The five rows a person should read first

1. **`Toast.svelte:62-63` drops `role`/`aria-live` while idle**, where
   `index.html:92` keeps them from first paint. Exactly the R0b.4 shape: an
   attribute axe cannot report as *absent*, on an element the goldens photograph
   empty. Home (a).
2. **The copy-image download fallback is gone.** `app.js:1717-1726`
   (`downloadImage`, `safeFileName`, the `<a download>`, `imgSaved`/`imgFailed`)
   has no counterpart; `RecordActions.svelte:57-61` says `copyFailed` and stops.
   A browser without `ClipboardItem` image write gets an error where live saves a
   file. Home (a).
3. **`rollCopied` became `textCopied`.** `app.js:4142` toasts
   `Варианты скопированы` after copying a set of roll options;
   `StdPanel.svelte:68` and `AltPanel.svelte:95` both toast `Текст скопирован`.
   Home (a).
4. **The money picker's `aria-current="true"` became `aria-pressed`**
   (`app.js:2959` against `Chip.svelte:65`). `context.md`, "The harness",
   already records that the parity driver never read either attribute, so the two
   have never been compared by anything. Home (a).
5. **`app.js:3026`'s self-opening list roll panel.** Live renders
   `<details class="panel lroll">` with `open` whenever a roll result exists;
   `ListPage.svelte:651` has no `open` binding. No reachable path was found that
   needs it, which is why it is a lost question rather than a divergence.
   Home (b).

---

## R0c pre-deletion divergence sweep - parts C and D

- **Read at**: `7a33c22` (HEAD of `main` at dispatch). The plan's counts are
  quoted at `a6b4a94`; `git diff --stat a6b4a94..7a33c22` is two image files
  (`img/ci4.webp`, `og/ci4.jpg`, 0 insertions, 0 deletions), so `style.css`,
  `app.js` and `index.html` are byte-identical to the sha the plan cites and
  every line number below is valid at both.
- **Date**: 2026-09-17
- **Runner**: sweep C+D (read-only; nothing in the tree changed but this file)
- **Verdicts**: `same` / `differs` / `absent` / `n.a.` (citation required).
  Homes: **(a)** `docs/specs/DEBT.md` section 3, **(b)** `COVERAGE.md` thin
  spots, **(c)** the Phase 8 handover. `-` means no home is owed.

**What was run**: nothing. No legacy suite, no parity filter, no golden shard,
no browser. Every row is settled by reading source on both sides; where a
cascade decides a row, the two competing rules are quoted in the row.

### Part C - conditional and interactive style

**Count reconciliation.** The plan's grep over `style.css`
(`@media|:hover|:focus-visible|:active|prefers-reduced-motion|hover: ?hover|@page|:focus`)
returns **83 lines**, matching the plan's 83 exactly. Two of them are Russian
comment lines, not rules (`499`, `1009`), and nine are continuation lines of a
selector or block that is already a row (`503`, `553`, `763`, `764`, `1000`,
`1001`, `1002`, `1003`, `1401`). So 83 matched lines = 2 comment rows + 72 rule
rows = **74 rows**.

| where | live | rewrite | verdict | home |
|---|---|---|---|---|
| style.css:79 | `.seg button:not(.on):hover{color:var(--txt)}` | `Seg.svelte:76`, identical | same | - |
| style.css:88 | `@media(max-width:640px){.tabs{flex-wrap:nowrap;overflow-x:auto}}` | `TabBar.svelte:59-64`, identical | same | - |
| style.css:97 | `.tabs a:hover{color:var(--txt)}` | `TabBar.svelte:85` (`a:hover`, scoped to the component) | same | - |
| style.css:111 | `.helpbtn:hover{border-color:var(--gold);color:var(--gold)}` | `HelpButton.svelte:53` | same | - |
| style.css:123 | `.homebtn:hover{border-color:var(--gold);color:var(--gold-soft)}` | `PageHead.svelte:119` | same | - |
| style.css:161 | `.chip:hover{border-color:var(--gold);color:var(--txt)}` | `Chip.svelte:99` | same | - |
| style.css:169 | `.itemtable:hover{border-bottom-color:currentColor}` | `RecordPage.svelte:129` | same | - |
| style.css:176 | `@media(max-width:600px){.tsection,[data-row]{scroll-margin-top:132px}}` | `TableRows.svelte:260-263` ports the `[data-row]` half (118 base / 132 at 600). The `.tsection` half is **dead live**: `style.css:537` re-declares `.tsection{scroll-margin-top:110px}` later at equal specificity, so 110px wins at every width - which is what `TablesPage.svelte:697` writes | same | - |
| style.css:203-206 | `@media(max-width:430px){.numbox input[type=text]{width:56px};.numbox button{width:36px}}` | `NumberField.svelte:214-218` ports the button half only; the input half is dead live for the same source-order reason, and `NumberField.svelte:208-213` records the measurement | same | - |
| style.css:207 | `.numbox button:hover{background:var(--surface2);color:var(--gold)}` | `NumberField.svelte:198` | same | - |
| style.css:217 | `.numbox input[type=text]:focus{outline:none;box-shadow:none;border-color:transparent}` | `NumberField.svelte:166` | same | - |
| style.css:218 | `.numbox:focus-within{border-color:var(--gold);box-shadow:0 0 0 3px rgba(216,171,94,.14)}` | `NumberField.svelte:172` | same | - |
| style.css:219 | `.numbox.hope:focus-within{...--hope...}` | `NumberField.svelte:177` | same | - |
| style.css:220 | `.numbox.fear:focus-within{...--fear...}` | `NumberField.svelte:182` | same | - |
| style.css:247 | `.btn:hover{border-color:var(--gold);background:var(--surface2)}` | `Button.svelte:143` | same | - |
| style.css:249 | `.btn.primary:hover{filter:brightness(1.07)}` | `Button.svelte:155` - adds the gradient back explicitly, reproducing live's cascade (live `.btn.primary` at :248 outranks `.btn:hover` at :247 by source order, so a hovered primary keeps its gradient and border) | same | - |
| style.css:258 | `input[type=search]:focus,input[type=text]:focus{outline:none;border-color:gold;box-shadow:0 0 0 3px}` | four scoped copies, one per live input site: `SearchBox.svelte:57`, `ListPage.svelte:940`, `ListsPage.svelte:212`, `NumberField.svelte:166` | same | - |
| style.css:285-287 | `@media(max-width:860px){.orgrid.c2,.orgrid.c4{grid-template-columns:1fr}}` | `OrGrid.svelte:143-147` | same | - |
| style.css:297-301 | `@media(max-width:860px){.ordiv{padding:14px 0;width:100%};.ordiv::before/::after;.ordiv i}` | `OrGrid.svelte:149-164`, merged into the one block | same | - |
| style.css:311 | `@media(prefers-reduced-motion:reduce){.card{animation:none}}` | `RecordCard.svelte:285-289` | same | - |
| style.css:321 | `.card-media:hover img{transform:scale(1.05)}` - unconditional, every pointer type, every card | `RecordCard.svelte:323-327` wraps it in `@media (hover:hover)` **and** narrows it to `.card.compact`. Live has neither guard here (it uses `hover:hover` only for `.tile` and `.row`) | differs | (a) |
| style.css:322 | `.card-media:focus-visible{outline:2px solid var(--gold);outline-offset:-2px}` | `RecordCard.svelte:337` | same | - |
| style.css:326 | `.card.full .card-media:hover img{transform:none}` - cancels the zoom on a full card | no counterpart; folded into the `.card.compact` scope of the row above. Same rendered result with a fine pointer; under `hover:none` live still leaves a tapped compact card's art scaled and the rewrite never scales it | differs | (a) - one finding with style.css:321 |
| style.css:363 | `.card-name a:hover{color:var(--gold-soft);border-bottom-color:currentColor}` | `RecordCard.svelte:509` | same | - |
| style.css:369 | `.card-name button:hover{color:var(--gold);background:var(--surface2)}` | `RecordActions.svelte:132` (`button:hover`, scoped) | same | - |
| style.css:384 | `.craft a:hover{border-bottom-style:solid}` | `RecordCard.svelte:618` | same | - |
| style.css:395 | `.refs summary:hover .ref-n{color:var(--gold-soft)}` | `RecordCard.svelte:700` | same | - |
| style.css:419 | `.selall:hover{color:var(--muted);background:rgba(255,255,255,.03)}` | `TableRows.svelte:241` | same | - |
| style.css:450 | `.picker .chip.ghost:hover{border-style:solid;color:var(--gold)}` | none - and the live rule is **dead**: `app.js` emits no `class="picker"` (0 matches; only `picker-none`, `picker-new`, `pickchips`), so the ghost chip at `app.js:1863` is styled by `.chip` alone. The rewrite draws the same plain chip (`AddToList.svelte:278`) | same | - |
| style.css:456 | `.picker-new input:focus{outline:none;border-color:var(--gold)}` | `AddToList.svelte:410` | same | - |
| style.css:461-466 | `@media(max-width:900px){.toolbar .btn .btn-lbl{...clip:rect(0 0 0 0)...};.toolbar .btn{padding:0 13px}}` | `TablesPage.svelte:677-690`; `clip: rect(0 0 0 0)` written as `clip-path: inset(50%)` - same 1x1 clipped box, no rendered difference | same | - |
| style.css:468-482 | `@media(max-width:600px){.card.compact .card-media 96px; .card-body; .card-name; .card-desc; .card-acts .btn-lbl; .card-acts .btn.sm:has(.btn-lbl)}` | `RecordCard.svelte:741-782`, all six, same `clip`->`clip-path` substitution | same | - |
| style.css:499 | comment line (why `.tile:hover` needs a `hover:hover` guard) | the same note is carried in `TableRows.svelte` | n/a (comment) | - |
| style.css:502-504 | `@media(hover:hover){.tile:hover{border-color:var(--gold);transform:translateY(-2px)}}` | `TableRows.svelte:355-360` | same | - |
| style.css:533 | `.tsec-link:hover{color:var(--gold);background:var(--surface)}` | `SectionHead.svelte:47` | same | - |
| style.css:544 | `@media(prefers-reduced-motion:reduce){.tsection.flash{animation:none;outline:2px solid var(--gold)}}` | `TablesPage.svelte:721-726` | same | - |
| style.css:552-554 | `@media(hover:hover){.row:hover{border-color:var(--gold)}}` | `TableRows.svelte:295-299` and `ListPage.svelte:1415-1417` | same | - |
| style.css:563 | `.row-x:hover{background:rgba(224,104,95,.14);color:var(--danger)}` | none - and dead live: the only `.row-x` `app.js` renders is `app.js:3101`, inside `.lrow-acts`, where `.lrow-acts button:hover:not(:disabled)` (0,3,1) outranks `.row-x:hover` (0,2,0); `rowHTML`'s other `.row-x` branch (`app.js:2816`) is unreachable - all four call sites (`2505`, `2792`, `2865`, `3178`) pass an empty `removeFrom`. The rewrite ports the winning rule at `ListPage.svelte:1624` | same | - |
| style.css:599 | `.modal-x:hover{border-color:var(--gold);color:var(--gold)}` | `RecordModal.svelte:196` | same | - |
| style.css:643 | `.lnote summary:hover span{color:var(--gold-soft)}` | `ListPage.svelte:1032` | same | - |
| style.css:655 | `.lnote textarea:focus,.rnote textarea:focus{outline:none;border-color:gold;box-shadow}` | `ListPage.svelte:1063-1064` | same | - |
| style.css:670 | `@media(max-width:640px){.npair{grid-template-columns:1fr}}` | `ListPage.svelte:1119-1123` | same | - |
| style.css:684 | `.lroll>summary:hover span{color:var(--gold-soft)}` | `ListPage.svelte:1196` | same | - |
| style.css:737 | `.lrow-grip:hover{color:var(--gold-soft)}` | `ListPage.svelte:1474` | same | - |
| style.css:738 | `.lrow-grip:active{cursor:grabbing}` | `ListPage.svelte:1478` | same | - |
| style.css:746 | `.lrow-n:focus{outline:none;background:rgba(216,171,94,.16);box-shadow:inset 0 0 0 1px var(--gold)}` | `ListPage.svelte:1504` | same | - |
| style.css:762-764 | `.goldhint:hover,.lrow-meta label:hover .goldhint,.lrow-meta label:focus-within .goldhint{border-color:gold;color:gold-soft}` | `ListPage.svelte:1565-1567`, all three selectors | same | - |
| style.css:776 | `.lrow-meta input:focus{outline:none;border-color:var(--gold)}` | `ListPage.svelte:1600` | same | - |
| style.css:782 | `.lrow-acts button:hover:not(:disabled){background:var(--surface2);color:var(--gold)}` | `ListPage.svelte:1624` | same | - |
| style.css:796 | `.btn.danger:hover{border-color:var(--danger);background:rgba(224,104,95,.12)}` | `Button.svelte:181` | same | - |
| style.css:815 | `.selx:hover{background:rgba(216,171,94,.16);border-color:var(--gold)}` | `SelBar.svelte:129` | same | - |
| style.css:817-829 | `@media(max-width:600px){.selx 32px;.selbox 38px;.selacts;.selacts .seldrop;.selacts .btn;.dropmenu{left:0;right:0;max-width:none}}` | split by owner, all six present: `SelBar.svelte:141-163`, `TableRows.svelte:265-267` (`.selbox`), `AddToList.svelte:417-423` (`.dropmenu`) | same | - |
| style.css:837 | `.listcard:hover{border-color:var(--line2)}` | `ListsPage.svelte:237` | same | - |
| style.css:842 | `.listcard-main:hover .listcard-top b{color:var(--gold-soft)}` | `ListsPage.svelte:263` | same | - |
| style.css:852 | `.titleinput:focus{outline:none;border-bottom-color:var(--gold)}` | `ListPage.svelte:960` | same | - |
| style.css:853 | `.titleinput:hover{border-bottom-color:var(--muted2)}` | `ListPage.svelte:965` | same | - |
| style.css:864-896 | the mobile block: `.row-main` wrap, `.row-main .rm`, `.rt span` clamp, `.card-name button`/`.tsec-link` 11px, `.card-name-acts`, `.card-name` align, `.seg button` padding, `.helpbtn`/`.homebtn` 34px + svg 17px, `.crit-acts` + its `.btn`, `.lrow`/`.lrow .row-main`/`.lrow-meta`/`.lrow-acts`/its `button`/`.row-x` | every sub-rule placed with its owner: `RowMain.svelte:265`, `RecordCard.svelte:741`, `RecordActions.svelte:139`, `SectionHead.svelte:70`, `Seg.svelte:89`, `HelpButton.svelte:82`, `PageHead.svelte:153`, `AltPanel.svelte:364-373`, `ListPage.svelte:1660-1691` | same | - |
| style.css:870 | `@media(max-width:400px){.row-main .rm{padding-left:0}}` (nested inside the 600 block) | `RowMain.svelte:277`, nested the same way | same | - |
| style.css:940 | `.fpill:hover{border-color:var(--gold)}` | `FilterBar.svelte:179` | same | - |
| style.css:941 | `.fpill:hover i{background:rgba(255,255,255,.1);color:var(--txt)}` | `FilterBar.svelte:183` | same | - |
| style.css:955 | `.fclear:hover{background:rgba(255,255,255,.06);color:var(--txt)}` | `FilterBar.svelte:202` | same | - |
| style.css:961 | `.flink:hover{border-color:var(--gold);color:var(--gold-soft)}` | `FilterBar.svelte:223` | same | - |
| style.css:974 | `.warn-x:hover{background:rgba(255,255,255,.07);color:var(--txt)}` | `StorageNotice.svelte:123` | same | - |
| style.css:984 | `input.pickq:focus{outline:none;border-color:gold;box-shadow:0 0 0 3px}` | `AddToList.svelte:373` | same | - |
| style.css:994 | `.toast-act:hover{background:rgba(26,18,6,.28)}` | `Toast.svelte:124` | same | - |
| style.css:999-1005 | the keyboard ring, written as a closed list of **18 selectors** (`.btn`, `.chip`, `.tabs a`, `.helpbtn`, `.homebtn`, `.fpill`, `.fclear`, `.flink`, `.row-main`, `.tile`, `.lrow-acts button`, `.row-x`, `.warn-x`, `.toast-act`, `.seg button`, `.tsec-link`, `.card-name-acts button`, `.lrow-grip`) with `outline:2px solid var(--gold);outline-offset:2px;border-radius:8px` | `tokens.css:150-154` is a **global** `:focus-visible` with `border-radius: var(--r-sm)` (**9px**, not 8), plus five components that re-declare the rule at 8px for their own controls (`RowMain:120`, `Seg:83`, `ListPage:1650-1656`, `StorageNotice:129`, `RecordCard:337`). Two differences, neither on any registered state: (i) every control live's list omits - card links, `.craft a`, `.itemtable`, `.listcard-main`, the four `<summary>` elements, `.selall`, inputs, `main` - now takes a gold ring where live leaves the UA ring; (ii) a `.btn`/`.chip`/`.tabs a`/`.fpill`/`.flink`/`.tile` ring is radius 9 against live's 8 (measured already in `context.md`, "Reasons already disproved"; never homed in a spec) | differs | (a) |
| style.css:1009 | comment line (why `.selbox` needs its own inside-ring rule) | the same note is `TableRows.svelte:217-221` | n/a (comment) | - |
| style.css:1013 | `.selbox:has(:focus-visible){outline:2px solid gold;outline-offset:-3px;border-radius:8px}` | `TableRows.svelte:222-226` | same | - |
| style.css:1022 | `.skip:focus{left:0}` - with `.skip` (1018-1021) `position:absolute;top:0;z-index:300;background:var(--gold);color:#1a1206;font-weight:700;padding:10px 16px;border-radius:0 0 10px 0`, so the focused skip link is a gold plate pinned over the top-left corner, out of flow | `Shell.svelte:80-93`: `.skip{position:absolute;left:-9999px}` and `.skip:focus{position:static;display:inline-block;margin:var(--gap-sm);padding:8px 12px;background:var(--surface2);color:var(--txt);border-radius:var(--r-sm)}` - a grey in-flow chip that **pushes the rest of the page down** when focused, with no `z-index`. Different colour, box and layout effect; only a keyboard walk could see it, and none exists | differs | (a) |
| style.css:1033 | `.steps button.step:hover{color:var(--txt);border-color:var(--gold);cursor:pointer}` | `RecordCard.svelte:456` | same | - |
| style.css:1043 | `.reprice summary:hover span{color:var(--gold-soft)}` | none - and the live rule is **dead**: `app.js` emits no `class="reprice"`; the whole `.reprice` family (`style.css:1037-1044`) has no element, because the reprice controls live in the batch bar (`app.js:757-761`). The rewrite draws that same batch bar (`ListPage.svelte:737-753`) | same | - |
| style.css:1084 | `@media(max-width:640px){.batch-acts{margin-left:0;width:100%}}` | `ListPage.svelte:1280-1285` | same | - |
| style.css:1094 | `.note-x:hover{background:var(--surface);color:var(--txt)}` | `ListPage.svelte:1144` | same | - |
| style.css:1397-1415 | the `@media print` block: `@page{size:A4 portrait;margin:0}`; `html,body{background:#fff;color:#000}`; `.topbar,.tabs,.foot,#selBar,#toast,.noprint,#modal,.skip{display:none !important}`; `.wrap,#view{max-width:none;...}`; `.psheet`; `.psheet[data-next]`; `.psheet:last-child{height:296.9mm}`; `.pcard{break-inside:avoid}`; `*{print-color-adjust:exact}` | split across `Shell.svelte:186-201` and `:206` (`@page` at top level - equivalent, it only applies to print), `tokens.css:113-119`, `TabBar.svelte:105-109`, `SelBar.svelte:166-170`, `Toast.svelte:141-145`, `PrintPage.svelte:173-198` (incl. `:global(*)` for `print-color-adjust`, emitted into the always-loaded bundle stylesheet, so it is as global as live's), `PrintCard.svelte:908-912`. **Two gaps**: (i) `#modal` has no counterpart - `RecordModal.svelte` carries no print rule, so printing with the record dialog open prints the dialog over the page where live hides it; (ii) `Toast.svelte:142` drops live's `!important`, and `.toast` (0,1,0) loses to `.toast.act{display:inline-flex}` (0,2,0) at `Toast.svelte:105`, so an **action toast prints** where live's `!important` hides it. `tests/app/print.js`'s `printMedia` (`:1125-1135`) reads only `header`, `nav`, `footer`, `a.skip`, `.printbar`, and passes on `null`, so it sees neither | differs | (a) |

**Rewrite-only conditional rules with no live line to row** (recorded, not
counted): `Shell.svelte:176` `main:focus-visible{outline-offset:-2px}` - live
has no rule for `main`, which carries `tabindex="-1"` on both sides, so this
rides with the ring finding; `NumberField.svelte:203` `button:disabled`.

**Part C counts**: 74 rows = 72 rule rows + 2 comment rows. Over the 72 rule
rows: **same 67**, **differs 5** (`style.css:321`, `:326`, `:999-1005`,
`:1022`, `:1397-1415`), **absent 0**, **n.a. 0**. Homes: (a) 5, (b) 0, (c) 0.
Rows 321 and 326 are one finding, so the five rows are **four distinct
entries**, and the print row carries two defects in one entry.

### Part D - behaviour behind an event no state fires

**Count reconciliation.** `app.js` emits **29** distinct `data-act` names - the
plan's list exactly - dispatched by one chain at `app.js:4166-4305`.
`addEventListener` appears on **15 lines** (`app.js:3793, 3877, 4324, 4463,
4502, 4506, 4517, 4523, 4545, 4566, 4575, 4579, 4607, 4634, 4640`) carrying
**14 event names**: `dragover` twice, as the plan says. `keydown` handles
exactly **one** key. 29 + 15 + 1 = 45 rows, **plus one** the plan's
enumeration could not reach: the share sheet hangs off `[data-send]`, not
off a `data-act` name (row at the end of the act block). **46 rows**.

| where | live | rewrite | verdict | home (instrument) |
|---|---|---|---|---|
| act `rarity` (4171) | sets `st.rarity`, redraws the alternate panel | `AltPanel.svelte` rarity step | same | - (golden `#/roll/alt ~ legendary crit`; `alt.test.ts`) |
| act `help` (4172) | toggles `S.help` for one key; a second press folds it | `HelpButton`/`HelpBox` per page | same | - (goldens `#/roll/wondrous ~ help`, `#/roll/std ~ help`, `#/tables ~ help`, `#/lists ~ help`) |
| act `kind` (4173) | flips `S.kind[val]`; turning the last one off refuses with `keepOneKind` | `app.svelte.ts:369-377` (same refusal and toast); chips at `StdPanel:129`, `AltPanel:173`, `SearchPage:101` | same | - (goldens `#/search ~ kind off`, `#/roll/std ~ items only`; `app.test.ts`) |
| act `home` (4178) | pins/unpins the starting section in `localStorage`, toasts `homeSet`/`homeReset`, `saveFailed` on refusal | `PageHead`'s pin through `AppState` | same | - (golden `#/roll/wondrous ~ pinned`) |
| act `hideWarn` (4188) | `preventDefault`, dismisses the storage notice, redraws | `StorageNotice.svelte` cross | same | - (golden `#/lists ~ notice dismissed`; `states.js` case 20) |
| act `fOpen` (4189) | folds/unfolds the filter panel | `FilterBar` `ontoggle` -> `TablesPage:511` | same | - (goldens `~ panel open`, three of them) |
| act `fLink` (4190) | copies `fltUrl()`, toasts `filterLinkCopied` | `FilterBar` `oncopylink` | same | - (goldens `~ filter link`, two of them) |
| act `flt` (4191-4201) | `reset` clears; otherwise toggles one `field:value`, then `syncFltUrl()` | `TablesPage` filter state plus `replace()` | same | - (goldens `~ filtered`, `~ two frames`; `states.js` case 4/5) |
| act `src` (4202) | flips a Core-rules source; the last one on refuses with `keepOneSource` | `StdPanel.svelte:82,114` | same | - (golden `#/roll/std ~ one source`; `std.test.ts`) |
| act `createList` (4208) | empty name -> `nameFirst` toast **and** focuses the field; otherwise creates, clears the draft, and toasts only if the save was not refused | `ListsPage.svelte:49-60`, including `nameInput?.focus()` and the same no-toast-on-refusal rule | same | - (golden `#/lists ~ created`; `listsPage.test.ts:178,190`) |
| act `newListFor` (4218) | opens the inline new-list form; from a shared link the draft inherits the link's name | `AddToList.svelte` `openNew` | same | - (goldens `#/i/ci1 ~ new list`, `#/tables ~ a row opened, new list`; `states.js` cases 1-3) |
| act `cancelNew` (4224) | closes the form, drops the draft | `AddToList.svelte:100-103` | same | - (`lists.test.ts:169`) |
| act `createFor` (4225) | empty name -> `nameFirst` and focus; from `N_SHARED` copies ids, meta, `note` **and** `hnote` into the new list and navigates; otherwise adds the key's ids | `AddToList.svelte:105-131`, same guard, same four-field copy in one `create` | same | - (`states.js` cases 1, 2, 3) |
| act `menu` (4247) | toggles which add-to-list menu is open | `app.menuFor` plus `AddToList` | same | - (goldens `~ list menu`, `~ bar menu`, `~ many lists`) |
| act `clearSel` (4248) | `S.sel={}` and `S.menuFor=''` | `SelBar.svelte:53-54` -> `app.clearSel()`; the bar and its menu unmount together (`{#if n}`), so the menu half is unobservable | same | - (`tables.test.ts:373`) |
| act `doPrint` (4249) | `window.print()` | `PrintPage.svelte:72-73` -> `app.env.dialog.print()` | same | - (`printPage.test.ts:499` through the stub port; no browser instrument can assert a print dialog, and none did before) |
| act `printBack` (4251) | `history.length > 1 ? history.back() : location.hash = '#/lists'` | `PrintPage.svelte:67-70` over `router.canGoBack()`, which is `win.history.length > 1` (`ports/router.ts:59`) | same | - (`printPage.test.ts:482,490`) |
| act `printArt` (4257) | `S.printBW = val === 'bw'`; `S.printBW` is session state and **survives leaving the print page** | `PrintPage.svelte:47` `let bw = $state(false)` - component-local, so leaving `#/print/...` and coming back resets to colour. The divergence is deliberate and explained in code (`:41-46`), but no spec records it: `STATE.md:72` still lists `printBW` as live state and says nothing about the rewrite dropping it, and `DEBT.md` has no entry | differs | (a) (golden `#/print/ci1-q1 ~ black and white`; `tests/app/print.js`) |
| act `printLink` (4258) | copies the print address, toasts `linkCopied` | `PrintPage.svelte:76-79` | same | - (`tests/app/print.js` `copiedPrintLink`) |
| act `copySel` (4259) | rich copy (HTML plus plain) of every ticked record, toast `selCopied` | `SelBar.svelte:33-41` via `shareSelection` and `clipboard.writeRich` | same | - (golden `#/tables ~ selection copied`; `tables.test.ts:346`) |
| act `rollList` (4264) | rolls over a list's entries, ignoring an empty list | `ListPage.svelte` roll panel | same | - (golden `#/lists/a ~ rolled`; `listPage.test.ts:373`) |
| act `clearRoll` (4269) | clears the list roll without folding the panel | `ListPage.svelte` `clearRoll` | same | - (`listPage.test.ts:373`) |
| act `importList` (4270) | accepts a URL or a bare payload; `decodeList` `atob`s it, so a **packed** (`~`) link - the one "Поделиться" copies - is rejected with `badShare` | `ListsPage.svelte:85-89` unpacks through `compress.unpack` first, so the packed link imports | n.a. | cited: `FEATURES.md:113-114`, "either link form, plain or packed" (`listsPage.test.ts:305`) |
| act `comm` (4285) | picks a community, resets its roll to 1 | `CommunityPanel.svelte` | same | - (golden `#/roll/community ~ second`) |
| act `moneyHelp` (4287) | toggles the coin help on a list page | `ListPage.svelte` money help | same | - (golden `#/lists/a ~ money help`; `states.js` case 22) |
| act `voa` (4288) | `S.voa.k = (val === 'A' \|\| val === 'C') ? val : +val`, roll back to 1 | `VoaPanel.svelte` tier keys | same | - (golden `#/roll/voa ~ artifacts`) |
| act `view` (4289) | list/grid switch, saved to prefs | `TablesPage.svelte:498` plus prefs | same | - (golden `#/tables ~ grid`) |
| act `roll` (4291) | one chain: wondrous / dread / voa / community / else `clamp(rollNd12(+val), 1, 60)` | `StdPanel`/`RollPanel`/`AltPanel`/`VoaPanel`/`CommunityPanel` over `lib/roll.ts` | same | - (the `#/roll/*` goldens; `states.js` case 14; `roll.test.ts`) |
| act `rollDuality` (4301) | two d12, hope and fear | `AltPanel.svelte` | same | - (golden `#/roll/alt ~ crit`; `alt.test.ts`) |
| `[data-send]` -> `sendItem` (app.js:1746-1768) - **not a `data-act` name**, which is why the plan's enumeration of 29 missed it: the delegated click handler tests `e.target.closest('[data-send]')` at `app.js:3922-3923`, one of six `data-*` grips (`data-copy-name`, `data-share`, `data-copy-full`, `data-send`, `data-copy-img`, ...) listed at `app.js:3746` and dispatched before the `[data-act]` chain | the record card's "Отправить" button, three levels deep: (1) with `navigator.canShare` and `File`, a record that has art gets its PNG attached - `navigator.share({files:[file], text: shareText(it)})` (`:1756-1760`); (2) with a share sheet but no file support, `{title: nameForShare(it), text: shareText(it), url: itemUrl(it.id)}` (`:1749,1753`); (3) with no `navigator.share` at all, the link goes to the clipboard (`:1747`). A picture that fails to build falls back to (2), and an `AbortError` - the person dismissing their own sheet - is swallowed (`:1762-1766`) | `RecordActions.svelte:68-75` shares `{title: name, text: name, url: link}` and falls back to `copyLink()` on `unsupported`/`failed`. **No file is ever passed and the body is the bare name, not `share(it, ...)`'s text.** The capability is not missing from the port - `ports/share.ts:34-41` implements the whole `canShare({files})` dance off `what.file()` - but `RecordActions.svelte:70` is the **only** caller of `env.share.share` in `app/src`, and it passes no `file`, so `share.ts`'s file branch is unreachable code. Level 1 is gone and level 2's body text is a name where live sends the full share text; level 3 matches | differs | (a) (`record.test.ts:493-524` drives the button through `fakeShare` for the unsupported/dismissed/failed paths and asserts nothing about the payload, so the divergence itself has **`none`**; `COVERAGE.md:300-302,399-404` already records that no headless browser exposes a share sheet to drive) |
| listener `toggle` (3793, capture) | records `[data-keep]` open/closed into `S.keepOpen`, because `render()` replaces `#view.innerHTML`; only three elements opt in (roll panel, note box, list note) | no counterpart and none needed - Svelte patches in place, so a `<details>` keeps its own DOM state. The one live consequence of the opt-in - a card's `refs` `<details>` **closing** on every re-render, since it carries no `data-keep` - is reproduced by keying the card | same | - (`states.js` case 18) |
| listener `click` (3877) | the whole delegated surface: `[data-act]` above plus `data-open`, `data-remove`, `data-copy*`, `data-step`, `data-sel`, `data-drag`, and the outside click that folds an open menu | per-element `onclick` handlers, plus `<svelte:document onclick>` at `AddToList.svelte:230` for the outside click, with the microtask guard at `:223` | same | - (`states.js` cases 1-3 and 22; every interaction golden) |
| listener `input` (4324) | auto-sizes a note box as it is typed, and keeps `#n`/`#hope`/`#fear` to digits without moving the caret | `NumberField.svelte` (`lib/numField.ts`) and `ListPage.svelte:489-498` `autoSize` | same | - (`states.js` cases 12 and 13; `numField.test.ts`) |
| listener `dragstart` (4463) | only a `[data-drag]` grip starts a reorder; sets `effectAllowed`, a text payload for Firefox, and a row drag image | `ports/drag.ts:91-113,163`, the same four steps with the same two reasons written down | same | - (`states.js` case 17; `listPage.test.ts:746`) |
| listener `dragover` capture (4502) | edge auto-scroll while dragging: a 120px band at either edge, speed to 22px a frame, run off `requestAnimationFrame` rather than off the mouse | `ports/drag.ts:113` registers the same capture listener on dragstart; live keeps it registered and gates on `dragKey` - same effect | same | **(b)** - instrument `none`: no test drags near a viewport edge, on either side, and no live `ok()` covered it either |
| listener `dragover` (4506) | marks the row under the pointer `drop-before`/`drop-after` and `preventDefault`s so a drop can happen at all | `ports/drag.ts:118-...` -> `ListPage.svelte:477-479` `dragMark` | same | - (`states.js` case 17; `listPage.test.ts:751`) |
| listener `dragend` (4517) | clears the key, stops the edge scroll, clears the marks and the `dragging` class | `ports/drag.ts:166` -> `ListPage.svelte:480-483` | same | - (`states.js` case 17; `listPage.test.ts:751`) |
| listener `drop` (4523) | computes the target index with the before/after correction, moves the entry, refreshes the list URL | `ports/drag.ts:165` -> `ListPage.svelte:470-473` `store.move` | same | - (`states.js` case 17; `listPage.test.ts:738`) |
| listener `change` (4545) | commits a number field (clamped; an empty field is meaningful on a list page) and the `data-pos` position field (out of range redraws) | `NumberField.svelte:80-108` and `ListPage.svelte:805,818` | same | - (`listPage.test.ts:557`; `numField.test.ts`) |
| listener `keydown` (4566) | `if (e.key === 'Escape') closeModal()` - a hand-rolled close on a non-modal `#modal` div | none: the record card is a native `<dialog>` opened with `showModal()`, so Escape, the focus trap and the inert background are the browser's | n.a. | cited: `FEATURES.md:185-190` (`states.js` case 6 `dialogSemantics`) |
| key `Escape` (4567) | the only key handled anywhere in `app.js`: no shortcuts, no arrow handling, no Enter handling | the same single key, handled by the browser | n.a. | cited: `FEATURES.md:185-190` (`states.js` case 6) |
| listener `pointerdown` (4575) | remembers a note box's height when a pointer goes down on it | `ListPage.svelte:503-522`, ported verbatim - same selector, same shape, with cleanup | same | **(b)** - instrument `none`: nothing asserts the `data-manual` flag on either side (`states.js` case 13 covers auto-size and the clear cross only; no `manual` in `listPage.test.ts` or anywhere under `tests/app/`) |
| listener `pointerup` (4579) | if the box's height changed, marks it `data-manual='1'` so auto-sizing stops undoing the person's own resize | `ListPage.svelte:510-515` | same | **(b)** - instrument `none`, as above |
| listener `error` (4607, capture) | any `img[data-art]` that fails: remembers the id in `brokenArt`, swaps to `img/_none.webp`, adds `.noart`, and removes the copy-image button from the holder | four per-element `onerror` handlers covering every `<img>` live tags with `data-art` - `RecordCard:119`, `RowMain:64`, `TableRows:181`, `ListsPage:158` - all feeding `app.artBroken`; the button is gated at `RecordActions.svelte:105` (`it.img && !app.artBroken(it.id)`, restored in R0b.4). The print card's `<img>` has no handler on either side: `app.js:3423-3424` writes no `data-art` there. `.noart` is a marker only - `style.css` has no `.noart` rule | same | - (`states.js` case 11; `record.test.ts:374`) |
| listener `storage` (4634) | another tab wrote the lists: merge theirs over ours and redraw | `ports/storage.ts:67` -> `lists.watch()` | same | - (`states.js` case 7; `ports.test.ts:86`) |
| listener `hashchange` (4640) | closes the modal, then clears **`S.sel`, `S.lsel`, `S.menuFor`, `S.newListFor`**, expands a packed address or redraws | `ports/router.ts:50` -> `app.svelte.ts:238-245`: clears `menuFor` and `sel` and bumps `navigations` (watched by `TablesPage:108` and `SearchPage:40`); `newListFor` dies with its `AddToList`. **`lsel` has no equivalent**: `ListPage.svelte:133` holds it in a component-local `SvelteSet`, `ListPage` watches neither `navigations` nor `hash`, and Svelte does not remount a page component between two addresses of the same route kind - so Back/Forward between two list addresses leaves the batch ticks, and the batch bar, standing where live clears them | differs | (a) (`states.js` case 15 covers history; nothing covers a list-to-list move) |

**Part D counts**: 46 rows = 29 acts + the `[data-send]` share sheet + 15
registration lines (14 event names) + 1 key. **same 40**, **differs 3** (act
`printArt`, `[data-send]`, listener `hashchange`), **absent 0**, **n.a. 3**
(act `importList`, listener `keydown`, key `Escape` - each cited). Homes:
(a) 3, (b) 3, (c) 0. **Instrument `none`: 4 rows** - the capture-phase
`dragover` edge scroll, `pointerdown`, `pointerup` (all three `same` in
behaviour) and the `[data-send]` payload, where the button has a test but
the divergence does not. All four are unwatched after R0c.

### Totals for this runner

- Part C: 74 rows (72 rules, 2 comments) - same 67, differs 5, absent 0, n.a. 0.
- Part D: 46 rows - same 40, differs 3, absent 0, n.a. 3.
- Non-`same` rows by home: **(a) 8 rows / 7 distinct entries**, **(b) 3 rows**,
  **(c) 0**.
- Part D rows whose instrument is `none`: **4**.
- Nothing here blocks R0c (owner ruling, `context.md` decision 11b).

---

## R0c pre-deletion divergence sweep - part E

- **Read at:** `a6b4a94` (tree clean apart from the uncommitted `issues/47/*.md`
  and the untracked `issues/56/`, `work/`, none of which were touched).
- **Date:** 2026-09-17.
- **Runner:** sweep E (the deleted instruments' own assertions).
- **Scope:** part E only, four pieces - (i) the 42 `SPECS` in
  `tests/parity/specs.js:1903-1946`; (ii) `tests/craft.js` sections 2-5 and the
  five suites with `tests/app/` counterparts, assertion by assertion;
  (iii) `tests/i18n.js`'s dead-key report, run once; (iv)
  `tools/capture-share-fixture.mjs`. Parts A, B, C, D and F belong to the other
  runners and are not in this file.

### How to read the verdicts

`same` - a surviving instrument asks the same question. `differs` - both ask
it, but the survivor asks a narrower or indirect version. `absent` - the
deleted instrument asks it and nothing surviving does. `n.a.` - a difference
already decided and recorded, with the citation in the row.

Homes: **(a)** an observable divergence -> `DEBT.md` section 3; **(b)** a lost
question with no known divergence -> `COVERAGE.md` thin spots; **(c)** anything
else -> the Phase 8 handover. As expected for this part, almost every non-`same`
row is (b).

**One caveat that applies to every `same` row and is not repeated in them.**
The parity harness read the *live app* as the expectation on every run. Every
successor named below - a golden snapshot, a vitest assertion, a `tests/app/`
case - freezes or asserts the **rewrite's own** output. The question survives;
the second opinion does not. That is inherent in deleting the app being
compared against (owner decision 10's scope note) and is recorded here once
rather than as a hundred identical rows.

**Instruments used, once, for the whole part.** `node tests/i18n.js` (piece
(iii) requires it). No other legacy suite was run; no `npm run check`, no
parity filter, no golden shard. Nothing in the tree changed but this file.

### (i) The 42 `SPECS` (`tests/parity/specs.js:1903-1946`)

| where | live | rewrite | verdict | home |
|---|---|---|---|---|
| `inventory` (`:188`) | `d.controls()` - names of `button, a[href], input, select, textarea`, deduped, every state x lang x width | `tests/app/golden.js` `controls` section, 105 states x 2 langs, byte-for-byte against `tests/app/snapshots/*.txt` | same | - |
| `heading` (`:195`) | first 80 chars of `document.body.innerText` | golden tree - the heading and StaticText lines of each state | same | - |
| `title` (`:210`) | `document.title` per state | golden's first tree line, `RootWebArea "Генератор лута — Daggerheart" [url=...]`, both languages | same | - |
| `recordActions` (`:224`) | six record controls present, on 7 states including `#/roll/wondrous ~ modal` | golden `controls` on the same seven states (`_i_ci1`, `_i_q1`, `_i_ci1_whole`, `_i_f1`, `_roll_wondrous_modal`, `_i_q1_another_tier`, `_tables_a_row_opened`) | same | - |
| `copiedName` (`:248`) | clipboard text after a copy-name press on `ci1`/`q1` | `share.test.ts:67-78` golden over `docs/fixtures/share/records.json` (`name.text`, 9 ids x 2 langs), `record.test.ts:459` | same | - no real-browser press of copy-name survives; `states.js` case 9 presses copy-text, case 8 drives `writeText` through the share button |
| `copiedText` (`:259`) | clipboard text and html after copy-text | `share.test.ts:67-78` (`full.text`/`full.html`) plus `tests/app/states.js:284` case 9, both flavours through a real clipboard | same | - |
| `copiedImage` (`:278`) | the image type that lands on the clipboard | `tests/app/states.js:309` case 10 asserts the pending shape instead | n.a. | `docs/specs/DEBT.md` D10 - the canvas taints on both apps under `file://`, so this spec has been comparing two identical nulls |
| `rollControls` (`:736`) | the roll label with its range, the stepper pair, the pin toggle, 6 roll states | golden `button "Случайно 1–119"` and friends in `_roll_*.txt` | same | - |
| `filteredAddress` (`:296`) | `location.hash` after a filter pick on two table states | golden `[url=...]` on `#/tables/wondrous ~ filtered` and `#/tables/eq_weapon ~ filtered`; `tests/app/states.js:101` case 4 | same | - |
| `copiedFilterLink` (`:313`) | hash of the copied filter link | `tables.test.ts:680-682` asserts the exact copied URL | same | - |
| `listMembership` (`:337`) | storage read back after an add-to-list chip press, plus the tick | `lists.test.ts:90-102` - tick, menu stays open, stored ids | same | - |
| `copiedSelection` (`:362`) | text and html of a two-row selection export, on two states | `tables.test.ts:426-438` - both names present, no OR separator, toast | differs | (b) the exact selection export string is asserted nowhere, only its two names and the absence of a separator |
| `barMembership` (`:384`) | storage plus bar survival after the selection bar's own menu chip | `tables.test.ts:410-423` - both ids in one press, ticks kept, stored ids | same | - |
| `sharedListLink` (`:406`) | the short players' link a share press copies | `listsPage.test.ts:217` | same | - deflate byte-stability is an already recorded thin spot |
| `deletedList` (`:424`) | the confirm question and the storage after it | `listsPage.test.ts:246,257` | same | - |
| `restoredList` (`:442`) | hash and storage after restoring a plain link | `listsPage.test.ts:276,292,305` | same | - |
| `listAddress` (`:459`) | the hash 19 list states settle on | golden `[url=...]` on each of those states, both languages | same | - |
| `tookSharedList` (`:491`) | the new list's name, ids, note, hnote and meta | `sharedListPage.test.ts:273` | same | - |
| `addedSharedToList` (`:512`) | ids and meta poured into an existing list | `sharedListPage.test.ts:232,257` | same | - |
| `renamedList` (`:524`) | stored name after typing in the title field | `listPage.test.ts:185` | same | - |
| `movedByPosition` (`:535`) | ids after a committed position | `listPage.test.ts:557` | same | - |
| `reorderedByDrag` (`:546`) | ids after two drags, with a no-op guard | `tests/app/states.js:543` case 17 (a real HTML5 drag) and `listPage.test.ts:738,751` | same | - |
| `guessedPrices` (`:568`) | `meta.gold` after apply, and after undo | `listPage.test.ts:487` | same | - |
| `repricedRows` (`:585`) | `meta.gold` after a discount, and after undo | `listPage.test.ts:502` | same | - |
| `clearedPrices` (`:602`) | `meta.gold` after clearing a price, and after undo | `listPage.test.ts:516` | same | - |
| `batchDeleted` (`:619`) | ids and meta after a batch delete, and after undo | `listPage.test.ts:530` | same | - |
| `pricedRow` (`:639`) | meta after typing a first price, and the money picker it raises | `listPage.test.ts:578` and `:262` | same | - |
| `removedRow` (`:654`) | ids after remove, the hash, and after undo | `listPage.test.ts:639` | same | - |
| `deletedFromPage` (`:668`) | the confirm question and the hash after deleting from the list page | `listPage.test.ts:695` | same | - |
| `copiedListText` (`:678`) | the list export, both flavours | `listPage.test.ts:655` (equals `shareList`) plus `share.test.ts:252-312` | same | - |
| `ownLinks` (`:690`) | the players' and the GM's own link hashes | `listPage.test.ts:666` | same | - |
| `moneyMode` (`:708`) | stored money mode and the hash after switching to coins | `listPage.test.ts:278` | same | - |
| `noteCleared` (`:719`) | the list note after the cross, and after undo | `listPage.test.ts:617` | same | - |
| `visuals` (`:767`) | `d.metrics()` - body background, colour and family, and the h1's weight, size, line-height, letter-spacing and colour, on every state | `tests/app/typo.js` (family and size-scale membership only), `tests/app/hues.js` (badges and the roll button) | differs | (b) heading weight, line-height, letter-spacing and colour, and the page background, are measured by nothing that survives |
| `typeRuns` (`:789`) | computed type, text content and a measured text advance for four named controls, once per viewport, on 9 states | `tests/app/typo.js` - family and scale, at 1180 only, no advance | differs | (b) the measured advance and the per-width run are the two things B3.6 added because a page percentage could not see a control-sized defect |
| `foundRows` (`:820`) | how many rows a search drew, as a number, on four search states | golden `_search_searched/_kind_off/_stat_line/_capped.txt` - a row added or removed moves the group total; `searchPage.test.ts:172` for the 300 cap | same | - the count is implicit in the snapshot, never printed |
| `packedExpanded` (`:847`) | that a packed address expanded rather than landing on the bad-link page | `tests/app/states.js:240` case 8 (a real `CompressionStream`) plus the golden url in `_l_packed.txt` | same | - |
| `geometry` (`:863`) | `rectsAt` of `.card`, `.cardpick`, `.foot` at three widths on `#/i/ci1 ~ whole` | nothing - `tests/app/sweep.js` reads only sideways overflow, and a golden says nothing about geometry | absent | (b) |
| `sheetCounts` (`:880`) | sheets, cards, blanks, breaks, the bw class, the warn note | `tests/app/print.js:991` (ported R0b.3) | same | - |
| `cardFit` (`:903`) | per-card font-size, `--pcpad`, art height/`--artw`/display, strip size, per width | `tests/app/print.js:1024` | same | - |
| `printMedia` (`:924`) | computed display, colours, shadow and break rules under print media | `tests/app/print.js:1104`; R0c also turns the chrome loop into a non-null read | same | - |
| `copiedPrintLink` (`:962`) | the hash of the copied set link | `tests/app/print.js:1205` | same | - |

**Counts, piece (i): 42 rows - same 37, differs 3, absent 1, n.a. 1. Non-`same` homes: (b) 4, plus one `n.a.` citing DEBT.md D10.**

### (ii) The five ported suites and `tests/craft.js`, assertion by assertion

Read as: one row per `ok(` site in the deleted file, in source order. A site
inside a loop is one row, not one row per iteration.

#### (ii-a) `tests/craft.js` sections 2-5 (the JSDOM render of `index.html` + `app.js`)

Sections 1 and 6 are kept by the trim and are not rows here; the file's 48
`ok(` sites split 16 kept and **32** in sections 2-5.

| where | live | rewrite | verdict | home |
|---|---|---|---|---|
| `craft.js:105` | `w3` draws a `.craft` block at all | `record.test.ts:243-248` renders the block's link, so the block exists | same | - |
| `craft.js:106` | the forward label on the card reads `Улучшается до` | nothing - `tables.test.ts:190` is the **row** caption, not the card; no golden state renders a card craft block (`ci1`, `q1`, `f1`, `cm1`, `voa2_a1` carry no `craft`) | absent | (b) |
| `craft.js:107` | the target's name is inside the card's block | `record.test.ts:245` grips the link by the target's name | same | - |
| `craft.js:108` | the forward link's href is `#/i/w2` | `record.test.ts:245-248` (`#/i/cc1` on the synthetic pair) | same | - |
| `craft.js:114` | the reverse label on the card reads `Получается из` | nothing, same reason as `:106` | absent | (b) |
| `craft.js:115` | the reverse link points back at the source | `record.test.ts:253-256` | same | - |
| `craft.js:120` | `w15` draws no craft block once its target is gone from the data | nothing renders that branch; `data.test.ts:191-199` makes a dangling `craft` unreachable in real data, and `RecordCard.svelte:93` resolves through `index.byId` so the block simply never draws | absent | (b) - a guard on a branch real data cannot reach |
| `craft.js:126` | every one of the 30 real records in a chain draws at least one `.craft p` | one synthetic pair in `record.test.ts:243`; no real-data sweep | differs | (b) |
| `craft.js:129` | every rendered craft row carries a link | same one synthetic pair | differs | (b) |
| `craft.js:130` | every rendered craft link points at a record that exists | `data.test.ts:191-199` at the data level, and the template reads the same `byId` map | same | - asserted one layer below the render |
| `craft.js:138` | `ci19` (a core recipe) carries the same neutral forward label | nothing, same reason as `:106` | absent | (b) |
| `craft.js:139` | `ci19`'s link target is `#/i/cc7` | only the synthetic `ci1 -> cc1` pair | differs | (b) real-data chain targets are checked as data, never as a rendered href |
| `craft.js:143` | `w1` (no chain) draws no craft block | nothing - there is no negative craft assertion anywhere in `app/src` | absent | (b) |
| `craft.js:149` | the English card label reads `Upgrades to` | `dict.ts:372` holds the string; nothing renders the English craft block and no golden carries it | absent | (b) |
| `craft.js:150` | the English card shows the target's English name | `nameOf(lang)` is covered generally (`label.test.ts`), never in the craft block | differs | (b) |
| `craft.js:163` | a copy-full press puts something on the clipboard | `tests/app/states.js:289` case 9 | same | - |
| `craft.js:173` | the plain flavour carries the forward craft line | `share.test.ts:67-78` golden, id `ci18` (`upgrades into cc8`), both languages | same | - a different record carries the shape |
| `craft.js:174` | the description survives beside the craft line | the same golden `full.text` | same | - |
| `craft.js:175` | the rich flavour keeps the bold name | the same golden `full.html` | same | - |
| `craft.js:176` | the rich flavour keeps the craft line | the same golden `full.html` for `ci18` | same | - |
| `craft.js:177` | the rich flavour pastes link-free (no `<a `) | `share.test.ts:105` (`not.toMatch` anything but `b`, `br`, `i`) plus every golden html | same | - |
| `craft.js:178` | no stray markdown in the plain flavour | `share.test.ts:82-91` over every fixture id and both languages | same | - |
| `craft.js:184` | the reverse chain never travels to players | `share.test.ts:127-137` | same | - |
| `craft.js:185` | the item's own description survives that | the golden `full.text` | same | - |
| `craft.js:188` | an item with no chain gains no craft line in its copy | implicit in `ci1`'s golden text; no assertion says "and no craft line" | differs | (b) |
| `craft.js:194` | the list page offers a copy-text button | `listPage.test.ts:202` | same | - |
| `craft.js:201` | the plain **list export** carries the craft line | only by composition - `listPage.test.ts:655` says the copy equals `shareList`, `share.test.ts:275` says `shareList` equals the concatenation of `share()` outputs, and `share()`'s craft line is golden-pinned by `ci18` | differs | (b) no single assertion holds a craft line inside a list export |
| `craft.js:202` | the rich list export carries the craft line | the same composition | differs | (b) |
| `craft.js:212` | `#/tables/wondrous` renders rows at all | golden `_tables_wondrous.txt`, `tables.test.ts:182` | same | - |
| `craft.js:214` | the `w3` row carries an `.rcraft` caption | `tables.test.ts:190` on synthetic rows, and the golden's `namelen`/`namehash` on the real row name (the caption is inside the row button's accessible name, past the 64-code-point cap) | same | - the golden's half is opaque: a hash moves, a human reads nothing |
| `craft.js:215` | no `<a>` nested inside the row button | `RowMain.svelte:87-92` emits text and no link, and `tests/app/sweep.js`'s axe pass runs `nested-interactive` over every table address | same | - |
| `craft.js:217` | a chainless row draws no caption | the golden's `namelen`/`namehash` would move if one appeared | same | - opaque, as `:214` |

**Counts, `craft.js` sections 2-5: 32 rows - same 19, differs 7, absent 6. All 13 non-`same` rows are (b).**

#### (ii-b) `tests/audit2.js` -> `tests/app/sweep.js` (11 `ok(` sites)

| where | live | rewrite | verdict | home |
|---|---|---|---|---|
| `audit2.js:114` | the address rendered at all, after three attempts | `sweep.js:243-248` - `d.open` in a `try`, a failure is a named `ok(false, ...)` | same | - |
| `audit2.js:161` | the address did not rewrite itself | `sweep.js:316-320`, same regex and message | same | - |
| `audit2.js:163` | no `pageerror` and no console error on the page | `sweep.js:234-237,322`, same listeners and the same per-address reset | same | - |
| `audit2.js:165` | no sideways scroll | `sweep.js:324` | same | - |
| `audit2.js:166` | the word `undefined` is not printed | `sweep.js:325` | same | - |
| `audit2.js:167` | no duplicate `id` | `sweep.js:326` | same | - |
| `audit2.js:168` | no control without an accessible name | `sweep.js:327` | same | - |
| `audit2.js:169` | no text clipped by its own box | `sweep.js:328`, with four more selectors (`.craft`, `.rcraft`, `.dicebar`, `.numrow`) | same | - strictly wider |
| `audit2.js:170` | no `#/` link into nowhere | `sweep.js:329` | same | - |
| `audit2.js:181` | the section strip stays under its per-width cap | `sweep.js:332-338`, the same three caps | same | - |
| `audit2.js:186` | no picture failed to load | `sweep.js:341-344` | same | - |

**Counts: 11 rows - same 11.** The port also adds what `audit2` never had: the
craft-block spill reads, axe with `color-contrast`, the focus-ring walk, three
more addresses and two print addresses at 1180.

#### (ii-c) `tests/contracts.js` browser half -> `tests/app/contracts.js` (24 `ok(` sites plus one implicit)

Six of the 24 sites are the pure half and stay in the trimmed `tests/contracts.js`;
they are listed so the count is the file's, not a subset nobody can check.

| where | live | rewrite | verdict | home |
|---|---|---|---|---|
| `contracts.js:42` | at least six list fixtures on disk | kept in the trimmed file | same | - pure half |
| `contracts.js:48` | payload is `base64url(utf8(raw))`, by a second implementation | kept | same | - pure half |
| `contracts.js:53` | the items line carries a checksum | kept | same | - pure half |
| `contracts.js:55` | the checksum matches the items | kept | same | - pure half |
| `contracts.js:57` | the link holds as many entries as the list | kept | same | - pure half |
| `contracts.js:65` | no GM note survived into the player link | kept | same | - pure half |
| `contracts.js:74` | the page never threw (`pageerror` -> `fail++`) | nothing - `tests/app/lib.js`'s `fresh()` attaches no `pageerror` listener, and `tests/app/contracts.js` adds none | absent | (b) a thrown exception during this suite is now silent unless it also breaks an assertion |
| `contracts.js:96` | the address bar holds the fixture's player link | `tests/app/contracts.js:39` | same | - |
| `contracts.js:113` | the player link opens as the named list | `:59` | same | - |
| `contracts.js:114` | every players' note is on the page | `:61` | same | - |
| `contracts.js:116` | no GM-only note is visible through it | `:64` | same | - |
| `contracts.js:123` | the GM link carries every note | `:71` | same | - |
| `contracts.js:138` | a truncated link opens the broken-link page | `:81` | same | - |
| `contracts.js:145` | at least twenty route fixtures exist | nothing - the port drops the floor and the planned trim keeps only the list-encoding and docs-name halves | absent | (b) a fixture file emptied to two routes would pass every surviving check |
| `contracts.js:164` | the hash each fixture resolves to | `:148` | same | - |
| `contracts.js:165` | which tab is lit | `:149`, gripping `nav.tabs a[aria-current="page"]` instead of `#tabs a.on` | same | - |
| `contracts.js:166` | the row count | `:150` | same | - |
| `contracts.js:168` | the print-card count | `:152` | same | - |
| `contracts.js:170` | the picked pills | `:156` | same | - |
| `contracts.js:173` | which source chips are on | `:160`, reading `aria-pressed` instead of `.on` | same | - |
| `contracts.js:188` | at least ten stat-line fixtures exist | nothing, as `:145` | absent | (b) |
| `contracts.js:202` | the stat line, span by span, per language | `:177`, and `i18n.test.ts` replays the same fixture through the ported module | same | - |
| `contracts.js:235` | every documented filter group narrows its table | `:205` | same | - |
| `contracts.js:247` | every group name appears in `llms.txt`, `CONTRACTS.md`, `ROUTES.md` | kept in the trimmed file | same | - pure half |
| `contracts.js:253` | `llms.txt` carries no `rg`/`bu` | kept | same | - pure half |

**Counts: 25 rows (24 `ok(` sites plus the `pageerror` tripwire) - same 22, absent 3, all (b).**

#### (ii-d) `tests/hues.js` -> `tests/app/hues.js`

The plan's count of 10 is a naive `ok(` grep: two of the ten matches are the
suite's own `rollLook(` calls (`hues.js:90,96`). There are **8** real
assertion sites, plus the `pageerror` tripwire - 9 rows.

| where | live | rewrite | verdict | home |
|---|---|---|---|---|
| `hues.js:37` | the page never threw | nothing - `fresh()` attaches no `pageerror` listener and `tests/app/hues.js` adds none | absent | (b) |
| `hues.js:69` | two washed-out badges are told apart by saturation or lightness | `tests/app/hues.js:93-96`, same thresholds | same | - |
| `hues.js:73` | any two colourful badges are 40 degrees of hue apart | `:99-102` | same | - reading rendered badges instead of injected spans (COVERAGE fate `rewritten`) |
| `hues.js:91` | the standard tables offer at least four roll buttons | `:119` | same | - |
| `hues.js:92` | every roll button carries a die | `:120-123` | same | - |
| `hues.js:93` | all of them look identical | `:124-127` | same | - |
| `hues.js:97` | alt, wondrous and voa each offer exactly one | `:130` | same | - |
| `hues.js:98` | that one carries a die | `:131` | same | - |
| `hues.js:99` | it looks like the standard one | `:132` | same | - |

**Counts: 9 rows - same 8, absent 1, (b).** The port also adds the equipment
stat-line tone and the selected tile's own fill.

#### (ii-e) `tests/states.js` (7 `ok(` sites) - the click-only states

`tests/states.js` sweeps **24 click-reached states at 360 and 1180**. Its
successor is not one file: `tests/app/sweep.js` visits addresses only, and
`tests/app/states.js` asserts each of its own 22 cases' own point. This is the
thinnest subsection of part E.

| where | live | rewrite | verdict | home |
|---|---|---|---|---|
| `states.js:88` | the click actually reached the state | each `tests/app/states.js` case asserts its own arrival (case 3 `модалка не открылась`, case 1 `форма нового списка не открылась`) - for its 22 cases, not for the 24 legacy states | differs | (b) eleven of the legacy states (both help panels, five roll results, two grid views, the rarity and community re-rolls, the two searches) have no arrival assertion of their own |
| `states.js:133` | no console or page error **in a click-reached state** | nothing - `sweep.js` listens for `pageerror` but only over addresses; `tests/app/states.js` attaches no listener at all | absent | (b) |
| `states.js:134` | no sideways scroll in a click-reached state | `tests/app/states.js:526-538` case 16 covers the selection bar at 360 only; `sweep.js` covers addresses | differs | (b) |
| `states.js:135` | the word `undefined` is not printed in a click-reached state | nothing | absent | (b) |
| `states.js:136` | every overlay (`.dropmenu`, `.modal-box`, modal `.card`, `.helpbox`, `.ffilter`, `#selBar`) stays inside the viewport at 360 and 1180 | `tests/app/states.js:86-88` case 3 keeps the new-list input inside `.modal-card` (D6); nothing sweeps the other five overlay classes at either width | differs | (b) |
| `states.js:137` | no tap target under 26x22 on a phone, over `button`, `a.chip`, `.selbox` | nothing - `sweep.js`'s narrow widths check clipping and contrast, not hit size | absent | (b) |
| `states.js:138` | a tile's tick does not cover its label, and an open menu is not buried under the sticky header (`elementFromPoint`) | `tests/app/states.js:667-678` case 19 covers the tile overlap at 360 with art blocked; the buried-menu hit test has no successor | differs | (b) |

**Counts: 7 rows - differs 4, absent 3, all (b).**

#### (ii-f) `tests/typo.js` -> `tests/app/typo.js` (2 `ok(` sites plus one implicit)

| where | live | rewrite | verdict | home |
|---|---|---|---|---|
| `typo.js:27` | the page never threw | nothing - no `pageerror` listener in `tests/app/typo.js` | absent | (b) |
| `typo.js:69` | no element falls back to a font outside the two allowed faces | `tests/app/typo.js:177`, same walk, same two faces | same | - |
| `typo.js:70` | every computed size is on the agreed scale | `:178`, the same 16-step scale | same | - |

**Counts: 3 rows - same 2, absent 1, (b).** The port is stricter than the
original on the grips themselves: `EXPECTED` turns "the control was not found"
into a failure, which the live suite swallowed.

**Counts, piece (ii): 87 rows - same 62, differs 11, absent 14. All 25
non-`same` rows are (b).**

### (iii) `tests/i18n.js`, run once

Command and output, verbatim, at `a6b4a94`:

```
$ node tests/i18n.js
ключей: ru 251, en 251
  строки без обращений: srcFrame, voaRecall, guessPrice, pcTh, printFoot, money_coin, money_bag

переводы: паритет соблюдён
```

Green. The dead-key line is `console.log`, never a failure (`i18n.js:44`). In
the rows below the verdict answers "does the rewrite carry the same string, and
does anything read it".

| where | live | rewrite | verdict | home |
|---|---|---|---|---|
| `i18n.js:25-26` | neither language carries a key the other lacks - 251 and 251, no failure | `dict.ts:7-10` - `Dict` is derived from `ru` and `en` is typed as `Dict`, so a one-sided key is a compile error in both directions | same | - `docs/specs/I18N.md` already records this succession |
| `i18n.js:33-34` | every `t().key` the code asks for exists in both languages | the same typing - an unknown key is a type error, not a runtime miss | same | - |
| `i18n.js:43-44` | the informational dead-key report itself | nothing - no surviving instrument lists dictionary keys with no reader, and `svelte-check` does not flag an unused object property | absent | (b) the report is the one thing the deletion actually loses |
| dead key `srcFrame` | `app.js:119,305` - `Фрейм`/`Frame`, no `t().srcFrame` anywhere | `dict.ts:61,389`, and it **is** read, at `label.ts:125` | same | - live carries the string for a reader it lost; the rewrite has one |
| dead key `voaRecall` | `app.js:119,305` - `Стоимость Призыва`/`Recall Cost`, no reader | absent from `dict.ts`; the wording survives only inside the Vault of Ages help paragraph (`help.ts:196,222`), which both apps write out in full | absent | (c) dead on both sides, nothing owed |
| dead key `guessPrice` | `app.js:120,306` - `Подсказать цены`/`Suggest prices`, no reader (the three `guessPrice` hits in `app.js` are the function, not the key) | absent from `dict.ts`; `money.ts:174`'s `guessPrice` is the function, and the button a person presses is `guessApply` | absent | (c) dead on both sides |
| dead key `pcTh` | `app.js:123,307` - `Пороги`/`Thresholds`, no reader | absent from `dict.ts` | absent | (c) dead on both sides |
| dead key `printFoot` | `app.js:134,318` - `Лут Daggerheart`/`Daggerheart Loot`, no reader | absent from `dict.ts` | absent | (c) dead on both sides |
| dead key `money_coin` | `app.js` - `Монетами`/`In coins`; the report's `used` regex cannot see a computed key | `dict.ts:331,618`, read dynamically at `ListPage.svelte:625` | same | - a false positive of the report on both sides |
| dead key `money_bag` | `app.js` - `Как в книге`/`As in the book`, same false positive | `dict.ts:330,617`, same dynamic read | same | - |

**Counts, piece (iii): 10 rows - same 5, absent 5. Homes: (b) 1 (the report itself), (c) 4 (the four keys dead on both sides).**

### (iv) `tools/capture-share-fixture.mjs`

What it captures today, and what would have to be true of `dist/` for a
re-pointed run to reproduce `docs/fixtures/share/records.json` byte for byte.
**This runner did not re-point it and did not run it** - the re-point is C2's.

| where | live | rewrite | verdict | home |
|---|---|---|---|---|
| target (`:33`) | `file://<root>/index.html`, opened per record, `networkidle0` | must become `dist/index.html`, so the tool stops working on a fresh clone until `npm run build` has run - a new precondition for a tool that had none | differs | (c) say so in the header, beside the existing R0b.4 note |
| readiness (`:103-107`) | `waitForFunction` on `#view` having children | `dist/` renders `<div id="app">` and no `#view` anywhere in `app/src` or `app/index.html` - the wait would never resolve and the tool would hang rather than fail | absent | (c) the single most likely way the re-point goes wrong; `tests/app/lib.js`/`driver.js` already have a working readiness wait to borrow |
| grip (`:122`) | `[data-copy-name]` | `RecordActions.svelte:81-83` - a `Button` with `title` and `aria-label` set to `t.copyName`; must be gripped by that name | differs | (c) |
| grip (`:123`) | `[data-copy-full]` | `RecordActions.svelte:113` - `title`/`label` of `t.copyText` | differs | (c) `:133`'s `throw` keeps a lost grip loud, which is why this is a re-point and not a risk |
| clipboard stub (`:80-101`) | `isSecureContext = true`, a `ClipboardItem` class that keeps its map, `write` and `writeText` doubles | `ports/clipboard.ts:31-32` requires exactly `isSecureContext`, `navigator.clipboard.write` and `ClipboardItem`; `:87-88` writes `text/html` and `text/plain` Blobs (whose `.text()` the tool already awaits) and `:67-71` is the `writeText` fallback | same | - the stub needs no change |
| language (`:114-118`) | writes `dhloot.lang.v1`, then reloads | the rewrite reads the same key at boot | same | - |
| output shape (`:135-141`) | `{name, full}` x `{html, text}`; `name.html` is `null` because copy-name goes through `writeText` | `RecordActions.svelte:47` copies the name with `clipboard.writeText` too, so `name.html` stays `null` | same | - |
| id selection (`:52-72`) | walks `data.json` (`items`, `alt`, `eq`) and takes the first record per shape, plus `w118` | reads the same generated file, independent of which app is driven - the nine ids do not move | same | - |
| the fixture's content | the live app's own clipboard output for nine ids in two languages | must be identical after the re-point: `f33` depends on `share.ts:85`'s `noTier: isFrameRecord(it)` and `w1`/`w118` on `RecordCard`/`share`'s restored refs text - both landed in R0b.4 | same | - a non-empty diff on the first re-pointed run is a **fresh** divergence, not the known `f33` one, and the plan already requires that run to be empty |

**Counts, piece (iv): 9 rows - same 5, differs 3, absent 1. All 4 non-`same`
rows are (c), and all four are C2 implementation notes rather than coverage
losses.**

### Part E totals

| piece | rows | same | differs | absent | n.a. |
|---|---|---|---|---|---|
| (i) 42 parity `SPECS` | 42 | 37 | 3 | 1 | 1 |
| (ii) craft + five ported suites | 87 | 62 | 11 | 14 | 0 |
| (iii) `tests/i18n.js` | 10 | 5 | 0 | 5 | 0 |
| (iv) share-fixture tool | 9 | 5 | 3 | 1 | 0 |
| **total** | **148** | **109** | **17** | **21** | **1** |

**Non-`same` rows by home: (b) 30, (c) 8, (a) 0, plus one `n.a.` citing
`docs/specs/DEBT.md` D10.** No row in part E found an observable divergence
between the two apps, so nothing here is a `DEBT.md` section 3 entry; what this
part found is lost *questions*, which is the shape the plan predicted for it.

Nothing else in the tree was changed by this runner.
