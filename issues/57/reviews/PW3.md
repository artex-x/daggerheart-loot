# Review - PW3 (57)

Verdict: fix-then-continue
Reviewed: f148fc9509738dffc1e901688746641bd432da3f
Scope: batch PW3

## Blockers

- B1 (blocking) - `app/src/components/ListPage.svelte:1907-1954`: the side plate's new
  `<textarea class="titleinput">` lost the field box and its focus indicator. The old
  `<input type="text">` took the scoped `input[type='text']` rules (bg2 ground, 1px `--line2`
  border on four sides, `--r-sm` radius, 14px inline padding) and `input[type='text']:focus`
  (gold border and the 3px gold shadow). The textarea matches neither rule. It takes only
  `.titleinput`: transparent ground, a bottom border, `outline: none` on focus. Probe on
  `dist-test/`, `SHOP as gm1`:
  - At 1180: TEXTAREA, `bg rgba(0,0,0,0)`, `border-top 0px none`, `radius 0px`, `padding 0 0 4px`.
    Focused: `outline none`, `box-shadow none`, only the bottom border turns gold.
  - At 768 and 360: INPUT, `bg rgb(20,17,29)`, `border-top 1px solid`, `radius 9px`, `padding 0 14px`.

  Effect:
  - CI run 42281030388, `browser (4)`, `app/sweep 1180 ru`: `FAIL список @1180 ru, focus: no visible
    focus ring on TEXTAREA.titleinput`. This is the only failed job of the run.
  - A keyboard reader sees only a 1px bottom-border color change (WCAG 2.4.7).
  - The same field has two looks across the 999/1000 px crossing. The plan did not name this
    change: PW-4 says that only `multiline` moves.

  Fix: give `textarea.titleinput` the same rules as the input. Add it to both selectors
  (`input[type='text'], textarea.titleinput` and their `:focus`). Keep `display: block`,
  `resize: none`, `overflow: hidden` and `overflow-wrap: anywhere`. Give it a block padding
  so that one line is as tall as the old 46px input. `fitName` already adds the borders to
  `scrollHeight`. Proof: `app/sweep` 1180 ru (CI), and a read that the textarea and the input
  have the same ground, border, radius and focus shadow.

## Risks

- R1 (not blocking) - `app/src/components/ListsPage.svelte:345`, `SyncStatus.svelte` `onDestroy`: rule 20
  (`docs/specs/FEATURES.md:3333`) says that the focus goes "back on «Повторить» when the retry fails".
  On `#/lists`, `SyncStatus` mounts only while `sync === 'failed'`, so the press unmounts it as
  `#send` sets `saving`. `onDestroy` then sends the focus to «Новый список». If the retry
  fails, the remounted «Повторить» does not get the focus back. Only `listPage.test.ts` covers
  the failed-retry path, and `SyncStatus` is always mounted on the list page. No data is lost.
  Recommended: keep the status mounted on `#/lists` during a pressed retry, and add a
  `listsPage.test.ts` case (offline, «Повторить», the focus on «Повторить»). The other option is
  to state the `#/lists` behavior in rule 20.

## Nits

- N1 `local` - `app/src/components/MetaToggle.svelte:10,13`: the `el` bindable prop has no
  caller (`ListPage` and `SharedListPage` do not bind it). `CLAUDE.md`: "expose only differences
  real callers need". Remove it.
- N2 `local` - `ListPage.svelte` `renameArea` `onkeydown`: Enter during an IME composition
  blurs the field mid-word. Add `|| e.isComposing` to the guard.
- N3 `local` - `DESIGN.md:568-569`: two parentheticals in a row, "(the notices strip measured 260px
  on 2026-11-06) (measured 2026-11-05 while the owner was away; ...)". Merge them into one clause.
- N4 `local` - `issues/57/handoff.md:541`, Notes item 7: it still recommends that the follow-up drop
  the `/roll/voa`, `/roll/community` and `/roll/wondrous` leads. PW-6 already dropped them.
  Delete the item.
- N5 `local` - `issues/57/handoff.md:7-8,16`: the text says "merged with `origin/main`" and
  "its merge of `origin/main`". HEAD is `f148fc95` with no merge commit. `origin/main`
  (`10011729`) was already an ancestor through `45050594`. Correct the line.
- N6 `local` - `issues/57/handoff.md:416,439`: the plan's Test column asks for a browser read on
  PW-4 and PW-27. The handoff records none. The reviewer's reads, on `dist-test/`, can go in:
  - PW-4, `~ long name as gm4` (120 characters): a 336px textarea at 1180 and 1000,
    `scrollHeight` 335 = `clientHeight` 335, the rows top unchanged at 139. At 768 and 360 an
    input with `text-overflow: ellipsis`. No sideways scroll.
  - PW-27, `~ rolled as gm4`: `.lroll-wrap` 741px gives two columns (260 / 467) at 1180. The
    widths 621, 561, 615 and 555 give one column at 1060, 1000, 700 and 640.

## Deviations

- The handoff records no departure from D1-D11 (all recommended; D2 (b), D4 (a)). Accepted.
- PW-14: the give-back is kept (the hit test passes at 360). Accepted, as the plan allows.
- PW-16: «Мин» is read in `~ compact, selecting` and «Макс» in `~ picked` (named). Accepted.
- Case 83, `GM2_LIST as gm2`: `exception: 304` at 360, because the folded notices strip sits
  above the rows (260px measured). DESIGN.md names it. Accepted.
- PW-38: the unconfigured budget went from 270 to 271 kB (270.2 measured) by the rounding rule,
  under the 300 kB ceiling. The configured budget held: CI `e2e` is green against 328. Accepted.
- Not recorded as a deviation: the side-plate field's look (B1).

## Standing checks

1. Scale: checked. I read the plan's States table against the code, `FIRST_SCREEN` (`mid`
   rows, `#/account`, `GM2_LIST` with its 304 exception) and the PW-4 probe of a
   120-character name (336px plate field, rows unchanged at 1180 and 1000, ellipsis at 768 and
   360). Case 100 reads the 14-row price sheet at 1180x720. No collection or per-record cap
   changed. The fake cannot reach 3x the limits (plan, out of scope). No sticky region grew.
2. Error scenarios: checked. I read `rename` (a pasted line break becomes one space before the
   write), `SyncStatus` `refocus`/`onDestroy` against `cloudLists.svelte.ts` `retry`/`#send`
   (the buffer sends the store's current row, so no stale copy is written), the failed-retry
   focus on both pages (R1), and the print move focus. No stored shape changes, so a stale tab
   and a revert are unaffected.
3. Consistency: checked.
   - Sheet: centered from 761px for every caller, the record dialog's shape.
   - Import: in the count row before «Выбрать» on `/lists` (`.end`, `margin-left: auto`), the
     same as each homebrew tool row (`HomebrewSources`/`HomebrewCards` `.end`). In «Ещё» up to
     760px on both.
   - Note toggle: one `MetaToggle` on both list pages.
   - Compact head: on 761-999 through `compactHead`; the rows stay on `narrow`; `/s/` keeps its
     own head, as specified.
   - Name field: wraps in the side plate. `/s/` clamps at three lines, and FEATURES rule 16 gives
     the reason. One departure: the plate field's look against the compact input (B1).
   - Homebrew head: the reserve keeps the pill lines equal across tabs, read by case 112 (j).
4. RU/EN parity: checked. Changed in both languages: `subSearch` (RU and EN lose the language
   clause). RU only: `signInLead` (EN keeps the same facts) and `eachPrice` («%s за штуку» /
   "%s each"). Deleted in both: `subWondrous`, `subVoa`, `subCommunity`, `rollHint`,
   `defaultPrint` (in `i18n.test.ts`'s gone list). `printInk` and `printSize` exist in both.
   The static page titles use " - ". All ASCII punctuation; no new plural.

Owner rules: checked. The D1-D11 answers that settle a reusable rule are in their homes:
- D1: DESIGN.md "Sheet".
- D2: FEATURES rule 9.
- D3: DESIGN.md "The Two Breakpoints Rule" and FEATURES "The compact head".
- D4: DESIGN.md "The Whole Message Rule" and FEATURES rule 16.
- D6: FEATURES "Rolling".
- D11: DESIGN.md "Notes".

The `context.md` rule "consistency matters a lot" is carried by `plan-pw3.md` part C, for the
next review.

Other confirmations:
- The hidden reserve «Новый предмет» on the Sources, Sets and Rules tabs is acceptable. On
  `dist-test/` at 1180, as gm3: `visibility: hidden`, inside `[inert]`; `focus()` does not take;
  40 Tab presses never reach it; `elementFromPoint` at its center is not the reserve. The
  accessibility snapshot holds no «Новый предмет» link. The golden tree has no node for it.
  It shows only in the `controls` list, because `driver.controls()` filters by
  `offsetParent`, a layout test, not a visibility test. That is the expected kind of line.
- Goldens, sampled per family; every changed line is an expected kind:
  - The name field `multiline=true`: `~ share`, `~ rolled`, `~ note open, gm`.
  - The `/lists` import after the count: `_lists_as_gm1`.
  - The pill labels without the trailing space, and the reserve in `controls`:
    `_homebrew_as_gm1`, `_homebrew_sources_as_gm1`.
  - The roll leads gone, with the elision window moved: `_roll_voa`, `_roll_wondrous_narrow`.
  - The account lead and the extra row label: `_account`, `_account_as_gm1`.
  - The price-sheet field name: `~ price sheet`.
  - The compact head at the mid band: `~ mid band`.
  - `focused` gone from the GM field (PW-10): `~ note open, gm`.
  - The three `why` lines.
- `TARGET_ALLOW` `inline`: the narrowing (`[.!?][»")]?$` on the trimmed block) is in
  `tests/app/lib.js:310-314`, with COVERAGE.md updated. The handoff's after list keeps only the
  consent links and the in-sentence links of the privacy page.
- MetaToggle a11y: named by its label, `aria-expanded`, the chevron `aria-hidden`. Axe runs in
  `metaToggle.test.ts`, `sharedListPage.test.ts` and `listPage.test.ts` (mid). The target is
  24px and the thumb box up to 600px.
- Textarea a11y: `aria-label` "Название списка" / "List name", the `h1` labelled by the hidden
  `#list-name` span, `maxlength` kept. Axe runs in the side-plate test. The focus indicator is
  the defect in B1.

## Suggested next action

Run the one remediation pass, with an implementer:
1. B1 (blocking): give `textarea.titleinput` the field box and its focus style.
2. R1: fix the `#/lists` failed-retry focus, with a test (or correct rule 20).
3. The `local` nits N1-N6.

Then push and confirm `browser (4)` `app/sweep 1180 ru` green on CI, with no other job
regressed. No goldens should move: the accessibility tree does not carry these styles. Then
the S2 squash, as the handoff plans it.

## Checks still needed

- CI of the fix tip: `app/sweep` at 1180 RU (the focus walk) and at 360/390/768, because the
  textarea's box changes its height.
- After the fix, case 83's `mid` and 1180 rows for `LIST_A ~ long name` and `SHOP`: the plate
  field grows by the new block padding. The rows column is beside it, so no first-screen change
  is expected.
- The owner's signed-in checklist on production (`plan-pw3.md` part C) after S2.
