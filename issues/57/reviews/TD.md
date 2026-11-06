# Review - TD (57)

Verdict: fix-then-continue
Reviewed: cd2a2904bff9102ce4ae4bf92ae09b2c560ac667
Scope: batch TD

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

Diff read: `git diff ee4ddc74 cd2a2904` (63 source, test and doc files, six goldens, 130 shots). Guideline set:
DESIGN.md (named rules and "Proposed rules"), the Impeccable critique lens, the Clarity Rule, and the sources of the
guideline report (Android Tier 2 Touch_Targets, Apple HIG Accessibility, WCAG 2.5.8, WCAG 1.4.8, Flutter
`SnackBar.duration`). No suite, build or browser was run: CI of this tip is in progress.

The 44 acceptance lines all have an outcome. Each outcome that the diff can show is true in the diff: the token and its
`max(<size>, var(--thumb))` floors, the `.btn.bare` and text-link padded boxes, the `/lists` card corner, the four toast
classes and the hold for every mode, the bar offset, the solid plate with `--gap-plate`, the `:has` pairs, the two
measure tokens, the derived blocks, cases 108-111, the sweep step, the six re-seeded headers (line 3 only, each a `why`
that lost the word "dashed"), and the prose. Browser figures (first-screen rows, plate gaps, measure lines) were not
re-measured; they are CI's.

## Blockers

- **B1 (blocking, local) - A success after a retry now waits behind the stale error toast for up to 7-10 s.** The queue
  rule (owner, 2026-10-08) holds a plain toast said while an error shows. With the error at 2600 ms this cost about
  2 s; with 7000 or 10000 ms the screen keeps «Не получилось. Проверьте соединение и попробуйте ещё раз.» for about 5-8 s
  after the retried write has succeeded, then shows «Импортировано списков: 1». The batch's own tests found it: Deviation
  7's eight finds (`importPanel.test.ts` "keeps the preview after a lost answer and sends the same rows again",
  `homebrewImport.test.ts`, `homebrewPage.test.ts` "Удалено предметов: 3", "Сохранено: «Кольцо с гравировкой»") now wait
  `TOAST_MS.long + 2000`. The handoff records it as test timing; the plan's error scenarios (`plan-T.md` standing check 2)
  do not name it. It breaks the Clarity Rule (the page says "failed" and "done" in sequence for one action) and Apple
  HIG Accessibility, "Minimize use of time-boxed interface elements". Change, option A (recommended; inside the 10-08
  rule, which already lets an error end by "its close"): the press that retries a failed write closes the shown error
  toast first (`app.toast?.mode === 'err'` then `app.hideToast()`), at the retry sites the eight tests name
  (`ImportPanel`, `HomebrewImport`, `HomebrewPage`'s delete and the sets/rules save); the eight finds return to the
  default timeout; one `app.test.ts` or component case asserts the success toast at once after a retry. Trade-off: an
  error the person has not read closes when they retry. Option B: keep the behavior, name it to the owner and log it in
  the AFK file; the tests keep `AFTER_ERROR`.

## Risks

- **R1 (deferred-scope) - The default `TARGET_ALLOW` `.craft a` adds a second exception to an owner rule that says
  "every control".** The WCAG 2.5.8 "Inline" text ("constrained by the line-height of non-target text") supports it, and
  DESIGN.md names it. But the owner's phone feedback (1) of 2026-11-04 was about this exact line («Улучшается до»: tags
  that touch the line above), so a 19 px link there is the place a phone user is most likely to miss. Name it to the
  owner with the default; the alternative is one link per line up to 600 px.
- **R2 (deferred-scope) - `/s/<token>` at 360x640 moved further from its target**: owner 286, exception 302, now 309 px
  (default 1). The plan allowed the measured value (`plan-T.md` S3 step 5) and Status names it; no spacing fold was
  tried for that row. Keep it on the owner list for the post-release live check.
- **R3 (local, for the orchestrator's `polish`) - Crowding at 360 after the T3 folds.** `mocks/T/built/roll-std__360__en.png`
  and `roll-alt__360__ru.png`: the results line («Настроить», «Ещё») sits about 2 px above the first card, and on
  `/roll/alt` about 2 px under the picker row. Two rows of 40 px boxed controls with almost no gap read as one block.
  The first-screen budget allows it at `/roll/alt` (246 of 256 px), so a 4 px gap above the card is affordable there.
- **R4 (deferred-scope) - Bundle headroom is 0.8 kB (268.2 of 269).** Batch N adds markup and CSS; its dispatch should
  expect a budget raise under the standing rule (measured total rounded up, reason in the commit, under 300 kB).

## Nits

- **N1 (local) - A plan id in a test comment.** `app/src/components/listsPage.test.ts`: "outside the card's link (T5)".
  CLAUDE.md, "Comments": no plan section ids. Drop "(T5)".
- **N2 (local) - Stale toast durations in comments.** `tests/app/inventory.js`, state `#/lists ~ list limit as gm2`:
  "a 4000ms toast" on the 10000 ms long toast (the email address); check `~ not saved as gm2` too (the blanket
  1600 to 4000 replace). `Toast.svelte`: "before its 7000ms run out" and "still runs out at 7000 ms" (an action toast
  can be long: `saveItemRelinked`, 84 characters).
- **N3 (local) - Garbled comment.** `tests/app/golden.js`: "kept the capture inside the short toast lifetime of the
  time" reads as an edit slip; write "inside the toast's lifetime".
- **N4 (local) - `toastMs` is exported with no reader outside its module.** CLAUDE.md: "Add no ... export ... before
  something uses it." Drop `export` (the tests read `TOAST_MS` and `TOAST_LONG_CHARS`).
- **N5 (local) - Case 109 retries every failed 360 entry at 1180.** `openState(id, 360, 640, lang).catch(() =>
  openState(..., true))` also hides a real 360 regression of an enter step. Name the states that need `wideEnter`, as
  case 110 does with its regex.
- **N6 (local) - `targets` spacing test is half of WCAG 2.5.8.** It checks the 24 px circle against other targets' boxes,
  not against another undersized target's circle (the criterion names both). Add a center-distance check of 24 px
  between two undersized targets. Also, in the collect loop the clause `!(el.tagName === 'LABEL' &&
  !hidden(raw.closest('label') ?? el))` reduces to `hidden(el)` (dead code).

## Deviations

1. T5 padding 76 px, EN box 66 px: accepted (clear by construction: 66 + 4 < 76 + 16).
2. Case 108 ages a toast from its first draw (`MutationObserver` on `role`): accepted; it measures the toast, not the
   press latency.
3. Case 109/110 `wideEnter`: accepted for case 110 (a named regex); see N5 for case 109's blanket catch.
4. Case 111 (b) opens each width afresh and skips 360 where nothing draws: accepted.
5. `#/lists ~ empty as gm4` and `#/i/nope` in place of the brief's ids: accepted.
6. `#/tables/homebrew as gm2` joined case 110: accepted.
7. `AFTER_ERROR` in eight tests: not accepted as a test-only change; see B1.

Defaults (owner AFK):

1. `/s/` 309 px: accepted (plan S3 step 5); see R2.
2. `TARGET_ALLOW` `.craft a`: accepted with WCAG 2.5.8 "Inline"; name to the owner (R1).
3. The `1lh` negative-margin floor: accepted. No `@media` block holds a literal 40; the brand keeps 5 px. Where `1lh`
   is unknown (Safari before 16.4, Firefox before 120) the declarations drop and the old size stays, except
   `.btn.bare`, whose `min-height` then grows its line by about 10 px a side. Acceptable at that support level.
   `HomebrewEditor .back`, `ListPage .lnkb` and the `/s/` lead button use the literal `24px` of their own
   `min-height` in place of `1lh`: correct for those boxes.
4. `RollSelect` `inset: -1px`: accepted; the 40 px box is the target.
5. `AccountPage` signed in below 1000 px at `--measure-text`: accepted; it keeps the shipped 70ch width. The token now
   also names a column of forms, not only a passage; DESIGN.md's Measure Rule does not name that use. Not a finding.

## Standing checks

1. Scale: checked - `plan-T.md` States table and its TD additions against the diff: 150 lists (corner «Ещё», the card
   at 104 px), a 120-character list name (the name's `padding-right: 76px` keeps it clear by construction; the handoff
   gives no measured long-name figure), the 50-of-50 refusal (case 108 (d), the long toast in three lines at 360 RU),
   the selection bar three rows of 40 px with the toast above it (case 108 (e)), the 4000-character note (`.htext` at
   70ch, case 111 (b) reads the cap). No sticky region passes the viewport; the header holds 110.4 px.
2. Error scenarios: checked - every write path keeps its data; nothing is stored. The toasts of failures read 7000 or
   10000 ms and hold while touched. Found: B1, the recovery path's success toast delayed behind the stale error. A
   stale tab and a revert draw the old sizes and durations only.
3. Consistency: checked - one `--thumb` token across siblings, one plate style and gap on `/search`, `/tables/*`,
   `/homebrew`, `/lists`, the list page and `/s/`, one measure per text class (`git grep` finds `ch` literals only in
   `tokens.css` and `PickRow.svelte`; "dashed" only in PrintCard, the Drop Rule text, COVERAGE.md and the derived
   check). Named differences match the plan. Not covered by case 110: the empty account list page's plate
   (`ListPage.svelte`, «Список пуст») and `HomebrewSources`' empty plate (see Checks still needed).
4. RU/EN parity: checked - no string is added or changed; `toastMs` reads both languages; cases 108-111 and the sweep
   read RU and EN; the measure is in `ch`, so both languages take one box.

Owner rules: checked - item 10 APPROVED (Thumb Rule in DESIGN.md "The Phone-First Rule"; the Reading Time Rule in
"Components", "Named Rules", 5 of 8; FEATURES.md "Chrome"), the T answers (10000 ms class, every toast pauses, the card
corner «Ещё» in DESIGN.md "Cards" and FEATURES.md "Lists"), item 13 (The Drop Rule, "Shapes", 2 of 8; `--gap-plate` in
"Empty state"), items 14 and 15 (The Measure Rule, "Typography", 6 of 8; the One Width Rule sentence). Each is in its
home and inside the 8-per-section budget; "Proposed rules" no longer lists them.

## Suggested next action

One fix pass (the remediation cycle): B1 with option A unless the orchestrator takes option B and names it to the
owner; with it the local nits N1-N6 and R3 if `polish` agrees. Then batch N, from the fixed tip, with R4 in its
dispatch. R1 and R2 go to the owner list (AFK file) with the defaults kept.

## Checks still needed

- CI of `cd2a2904`: `sweep.js` at 360 and 390 EN, 768 and 1180 (T-1, T-3, T-4), the golden job (T-15, D-11: six
  headers only), case 17 (D-4), cases 108-111 in their shards.
- Case 110 or one probe: the gap above the plate on the empty account list page (`ListPage.svelte` `Empty` with
  `listEmptyHint`) and on `#/homebrew/sources` with no sources, at 360 and 1180 px; their parents may not collapse the
  16 px margin.
- One measured 120-character list name at 360 RU and EN on `/lists` (T-6's "the name never runs under it").
- The orchestrator's `polish` and `harden` on the T, D and text surfaces (T-19, D-13).
