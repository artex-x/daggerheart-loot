# Plan - one sign-in plate on the page-level prompts (task 57-debt, batch SP1, D134)

This file plans one batch, SP1, from the owner's decision of 2026-11-11: D134 takes the recommended option of `plan-phone.md` section 5. A signed-out page that needs an account draws ONE shape: the plate of `/lists` (the kind glyph, the lead, «Войти»). The batch also folds in three PH3 review nits. PH1-PH3 are on `main` and merged into `claude/57-debt` (`5141e030`).

## Status

- Planned 2026-11-11 (planner). Not started. Start gate: none.
- Plan review: not required (no trigger fired). No migration, no SECURITY DEFINER function, no public contract change (`CONTRACTS.md`, `docs/fixtures/`, `tests/contracts.js`, `llms.txt` stay: `docs/fixtures/urls/routes.json` says only "signed out the sign-in prompt", which stays true), no stored row or `localStorage` key (`dhloot.auth.return` and the `after` argument of every prompt stay as they are), no write or sync protocol.
- Batch review: required (trigger: visual parity / new or changed UI, `orchestrate.prompt.md`, "When to run reviewer").
- Writer tier: `sonnet` (no `Open design question:` line; every fork below is decided with a recommendation).
- NEEDS_HUMAN_CONFIRMATION: no. The owner chose the shape; the three scope forks of section "Decisions" are decided and each reverts alone.

## Objective

Signed out, six routes draw the same prompt in four shapes (the DEBT.md row names four routes). After SP1 every one of them draws the plate: `SignInPrompt` in its default form becomes the plate, and the inline copies (`ListsPage`'s `Empty` wrapper and its CSS, the bare prompt on three pages, the error page and the print sub) go. The nits: the D129 decision file's task line, a visible NBSP in `tables.test.ts`, one unwrapped `FEATURES.md` line.

## In scope / out of scope

- In: D134 on `/lists` (no code change in behavior), `/lists/<uuid>`, `/homebrew` (with `/homebrew/new` and `/homebrew/<id>`, same lead and same component call), `/tables/homebrew`, and `/p/<id>`; the new lead `listSignInLead`; the tab title of the signed-out list address; the three PH3 nits; the decision file; DEBT.md row D134 deleted.
- Out: the compact and boxed forms (they answer a press in their own slot: the add-to-list menu, the selection bar, the record's «Печать» and «Сохранить себе», the shared page, `/h/<uuid>`); `/account` (it is the sign-in page); `NoPage`, `NoItem` and the signed-in "list not held" error page (`ListPage.gone()` keeps its signed-in branch); the preview Worker and `tools/share-card.mjs` (they quote `signInToPrint`, unchanged); D131 and every other DEBT row.

## Decisions (each with its reason; do not reopen)

1. **Scope: six routes, not four.** The DEBT row names four. `/homebrew/new` and `/homebrew/<id>` call the same component with the same `hbSignIn` lead as `/homebrew`, and `/p/<id>` is a "page-level prompt" in FEATURES.md "Lists" beside `#/lists` and «Мои предметы». Left alone they would stay a fifth and a sixth shape, which is the defect. Recommended; trade-off: two more first screens change. Each is one call site, so the owner can strike either alone.
2. **«Открыть таблицы» is not drawn on `/lists/<uuid>` signed out.** Current: the error page offers «Войти» and «Открыть таблицы». Proposed: the plate has one action. The header's «Таблицы» tab is on every page, so the reader keeps a way out. Recommended, because a second action makes a second shape. Trade-off: one link fewer on that page. (A signed-in reader's "list not held" error page keeps both actions.)
3. **`/lists/<uuid>` signed out is headed «Мои списки» / "My lists"** (the `h1`, rule 4 "One name", rule 7 "Headings"), and the tab title says the same. Current: the `h1` is the sign-in cause and the tab title is the plain site title. The plate carries the instruction, so the page needs the page's name, not the cause. The status region (`said`) goes with the error page; `/lists` has none, and the focus rule (case 116) already moves the focus to `#main` on a navigation.
4. **The default form of `SignInPrompt` is the plate.** No new prop, no new variant (`CLAUDE.md`, "Engineering posture"): after the batch no caller uses the old bare form, so it is removed, not kept. `compact` and `boxed` stay for the press-answering prompts.
5. **New string `listSignInLead`**, RU «Войдите, чтобы открыть список: он открывается только в аккаунте, где его создали.» and EN "Sign in to open this list: it opens only in the account where it was made." It folds the old heading and sentence into one line, in the form of `signInToCreate`. `listGoneSignedOut` and `listGoneSignedOutSub` are deleted in both languages (nothing else reads them).
6. **`/p/<id>`:** the heading `printTitle` stays; the sub `signInToPrint` becomes the plate's lead; the loose primary «Войти» goes into the plate.

## Behavior now and proposed, per device

The plate (proposed, every route): `Empty` with the kind glyph (56 px well), then the lead in `--t-small`, then «Войти» (primary, `md`), all centered, `--gap-plate` (16 px) under the block above. Up to 760 px the lead wraps balanced under the glyph and «Войти» sits under the lead. From 761 px the lead and «Войти» share one line while they fit (the button follows the lead's widest line, case 111 (a2)), else the same wrap. The focus stays where it is; no «Отмена».

| Route (signed out) | Now | Proposed |
|---|---|---|
| `/lists` | the plate: glyph, «Войдите, чтобы создавать списки: они хранятся в аккаунте и открываются на любом устройстве.», «Войти» | unchanged on every device (the code moves into the component; its tree and geometry stay) |
| `/homebrew`, `/homebrew/new`, `/homebrew/<id>` | the head (up to 760 px the title alone; from 761 px the title and the sub; the editor's `PageTitle` with its sub), then a bare, left-aligned line «Войдите, чтобы создавать свои предметы.» and «Войти» beside it, no glyph, no plate | the same head, then the plate with the same lead; centered |
| `/tables/homebrew` | the Tables head, 16 px, a bare line «Войдите, чтобы видеть свои предметы в таблицах.» and «Войти» | the same head, then the plate with the same lead |
| `/lists/<uuid>`, `/lists/nope` | no head. `h1` «Войдите, чтобы открыть список», the sentence «Списки открываются только в аккаунте, где их создали.», then «Войти» and «Открыть таблицы», left-aligned; tab title plain | `h1` «Мои списки»; the plate with the lead `listSignInLead`; «Войти» only; tab title «Мои списки - Генератор лута Daggerheart» |
| `/p/<id>` | `h1` «Печать карточек», the sub «Войдите, чтобы печатать карточки.», «Войти» below, left-aligned | `h1` «Печать карточек»; the plate with the lead «Войдите, чтобы печатать карточки.» |

EN reads the same facts: "My lists", "Sign in to open this list: it opens only in the account where it was made.", "Sign in to create your own items.", "Sign in to see your own items in the tables.", "Sign in to print cards.", "Sign in". Phones and wide windows differ only by the wrap above; no route draws a different shape per device. While the session is unknown the pages draw what they draw now (`/lists/<uuid>`: nothing; `/p/<id>`: the heading alone; the others: their head).

## Files

| File | Change |
|---|---|
| `app/src/components/SignInPrompt.svelte` | one `{#snippet body()}` holds the lead and the buttons. `{#if compact \|\| boxed}` draws `<div class="signin" class:compact class:boxed>`; `{:else}` draws `<Empty glyph="kindItem"><div class="signin page">...</div></Empty>`. Add `.signin.page { width: 100%; justify-content: center; }` (the two rules of `ListsPage`'s `.signedout`). Update the header comment: the default form is the page plate. The `{@render}` tags need the `no-confusing-void-expression` disable comment, as `ErrorPage.svelte` has |
| `app/src/components/ListsPage.svelte` | the `target === 'prompt'` branch becomes `<SignInPrompt {app} lead={t.signInToCreate} after={{ hash: '#/lists' }} />` with no `.stack`, `Empty` or `.signedout` wrapper; delete both `.signedout` rules; keep the `.stack` rules (the signed-in empty plate uses them). Drop the `Empty` import only if nothing else in the file uses it |
| `app/src/components/TablesPage.svelte` | the signed-out `homebrew` branch drops its `<div class="hbstate">` wrapper (the plate brings its 16 px); `.hbstate` stays for the load states |
| `app/src/components/ListPage.svelte` | `gone()` signed-out branch: `<PageTitle title={sectionLabel('lists', t)} />` and `<SignInPrompt {app} lead={t.listSignInLead} after={{ hash: app.hash }} />`; import `SignInPrompt`; the signed-in branch stays. The comment before `gone()` and the `PageTitle`/`ErrorPage` imports stay correct |
| `app/src/components/PrintPage.svelte` | the `app.user === null` branch: `PageTitle title={t.printTitle}` (no sub) and `<SignInPrompt {app} lead={t.signInToPrint} after={{ hash: app.hash }} />`; import it |
| `app/src/components/HomebrewPage.svelte`, `HomebrewEditor.svelte` | no edit (the call is already `<SignInPrompt {app} lead={t.hbSignIn} after={{ hash: app.hash }} />`); fix the editor's comment "Up to 760 px the lead is not drawn" only if it is now untrue (it is not) |
| `app/src/components/Shell.svelte` | the title chain, in the `!app.env.cloud ? undefined : ...` branch, before `route.kind === 'account'`: `route.kind === 'storedList' && app.user === null ? app.t.menuLists :`. Nothing changes while the session is unknown (plain title, as now) |
| `app/src/lib/dict.ts` | add `listSignInLead` in both languages beside the old keys; delete `listGoneSignedOut` and `listGoneSignedOutSub` in both |
| `app/src/components/signInPrompt.test.ts` | the first test and the last also assert the plate: `.empty .glyph`, one `.signin.page .signin-lead`, one button; keep the compact and boxed tests |
| `app/src/components/listPage.test.ts` | rewrite the test near line 1843 ("draws the error page signed out..."): one `h1` «Мои списки», the lead `listSignInLead`, buttons `['Войти']` only, no `.errpage`, no `.said`, no link «Открыть таблицы», axe, «Войти» opens `#/account`; lines near 1885 and 2173 test for the old heading text: point them at the new lead (they assert absence) |
| `app/src/components/printPage.test.ts` | the signed-out test near line 1665 also expects `.empty .signin-lead` holding `signInToPrint`; axe stays |
| `app/src/components/listsPage.test.ts`, `homebrewPage.test.ts`, `homebrewEditor.test.ts`, `homebrewCatalog.test.ts` | add `container.querySelector('main .empty .glyph')` to one signed-out test each (the plate, not the bare line) |
| `app/src/components/shell.test.ts` | near line 1414: `#/lists/<uuid>` signed out titles «Мои списки - ...» and "My lists - ..."; unknown session keeps the plain title |
| `app/src/components/a11y.test.ts` | line 702: `SignInPrompt.svelte` "in its three forms" stays true (plate, compact, boxed); reword to name them |
| `tests/app/inventory.js` | new state `#/homebrew/new` signed out; reword the `why` of the SHOP state (line 2257) and of `#/lists/nope` (line 2713) |
| `tests/app/states.js` | new case 131; add ids to the `LINES` and plate lists of cases 111 and 110 (below); append to `CASES` |
| `tests/app/sweep.js` | add `['#/homebrew', 'мои предметы без входа']`, `['#/homebrew/new', 'новый предмет без входа']`, `['#/tables/homebrew', 'таблица своих предметов без входа']` next to `['#/lists', 'списки без входа']` |
| `tests/app/snapshots/` | re-seed (see "Goldens") |
| `docs/specs/FEATURES.md` | "Tables and search" near line 423 (signed-out plate); "Lists" near line 583 (already a plate), the "Where a list is made" bullet near line 823 and the page-level list near line 836 (`#/lists`, `#/lists/<id>`, «Мои предметы», `#/tables/homebrew`, `#/p/<id>`); "Not found (A18, ErrorPage)" near line 1188: the signed-out case becomes its own bullet "Signed out" (the plate, `h1` «Мои списки», the lead, «Войти» only, tab title); "Homebrew" near line 1986 and "Print" near line 2561 (the lead is the plate's); nit 3 at line 1245 |
| `DESIGN.md` | "Empty state": one bullet, "A signed-out page that needs an account draws `SignInPrompt`: the plate with the kind glyph, the lead and one «Войти»; a prompt that answers a press is the compact or boxed form" |
| `docs/specs/COVERAGE.md` | the `app/states` row: case 131 and the additions to cases 110 and 111; the signed-out sentence near line 159 |
| `docs/specs/DEBT.md` | delete D134 and its section "Copy and prompt leftovers" (the file's rule: a section with no entry is deleted) |
| `docs/decisions/2026-11-11-a-page-level-sign-in-prompt-is-one-plate.md` (new) | the decision (below); then `node tools/decisions.js` |
| `docs/decisions/2026-11-11-craft-links-and-the-shared-first-entry-stay.md` | nit 1 |
| `app/src/components/tables.test.ts` | nit 2 |
| `tools/bundle-budget.mjs`, `.claude/README.md` | only if the build passes 276 kB unconfigured: the rule below |

Decision file (at most 15 non-blank lines): title "A page-level sign-in prompt is one plate with the glyph, the lead and «Войти»"; `Task: 57-debt (owner, 2026-11-11; D134)`; Decision: `SignInPrompt` draws the plate on `/lists`, `/lists/<uuid>`, `/homebrew` and its editor, `/tables/homebrew` and `/p/<id>`; a prompt that answers a press keeps the compact or boxed form; Rejected: keep the four shapes (the owner's A6 "keep" of 2026-11-06 and 2026-11-10, now reversed: no reason for the difference was ever named); the error page everywhere (it says a failure happened, and the heading would be the cause, not the page); a bare line everywhere (no plate, and a lone button floats under the head); a second action («Открыть таблицы») on the list route (a second action is a second shape).

## Standing checks

1. **Scale.** The batch changes what six signed-out screens draw. States table:

| State | What the screen shows | Proof |
|---|---|---|
| empty, one, many, at the limit, one past it, 3x the default | not applicable - a signed-out prompt draws no collection and no per-record cap | - |
| the longest lead (`signInToCreate`: 91 characters RU, 78 EN) | wraps balanced in the plate at 320 and 360 px; no sideways scroll | case 131 (c) |
| every route, RU and EN, at 360 and 1180 px (the outer widths) and at 320, 768 and 1920 px | one plate holding one glyph, one lead, one «Войти»; the button inside the window at 360x640 and 1180x720 | case 131 (a), (b) |
| the gap above the plate | 16 px, or 18 px under a `page-sub` (its bottom margin wins the collapse) | case 131 (e) and case 110 on `#/lists` |
| 360 px with the on-screen keyboard open | not applicable - no field on a signed-out page | - |
| the primary action | «Войти», alone in the plate, centered | case 131 (a) |
| a sticky region taller than the viewport | none in the plate; the header is unchanged | `unchanged` |
| `/lists`, `/homebrew` first screen | the same figures; the signed-out prompts have no `data-primary`, so case 83 has no row for them and the signed-in rows are `unchanged` | case 83 rerun |

2. **Error scenarios.** No read and no write path changes. Loading: the session-unknown frames are unchanged (see "Behavior"). A failed read, offline, a conflict, a deleted record: not applicable, because a signed-out page reads nothing; «Войти» opens `#/account`, whose provider flow owns its failures (unchanged). A stale tab: it keeps the old shapes until a reload. A revert: component, CSS and strings only; nothing stored, so no data is kept, dropped or hidden. The sign-in return is unchanged: every call keeps its `after` hash (`#/lists`, `app.hash` on the list, homebrew and print pages, `tablesHash('homebrew')`), and case 37, 44 and 73 keep proving the return.
3. **Consistency.** Rules followed: 4 (the `h1` and the tab say «Мои списки»), 7 (a fixed heading in every known state; the `/lists/<uuid>` departure for the signed-out case is removed), 14 (both languages, ASCII, «ёлочки» only where a name needs them), 20 (a page-level prompt leaves the focus where it is, has no «Отмена»; the compact and boxed forms keep «Войти» focus and «Отмена»). Siblings compared on the axes: one name (menu, heading, tab agree on the list route now), page heads in every state (each route keeps its own head, the plate follows), load and empty wording (the lead is one sentence with a colon, as `signInToCreate`), button verb («Войти» everywhere), place of the primary action (inside the plate). Departure kept: the press-answering prompts are not plates, because they answer a press in their own slot (FEATURES.md "Lists", "Where a list is made").
4. **RU/EN parity.** One new string, `listSignInLead`, in both languages with the same facts; two keys removed from both. No plural. ASCII punctuation (colon, period). Cases 131, 110 and 111 run RU and EN.

## Steps

1. Nits first. (a) In `docs/decisions/2026-11-11-craft-links-and-the-shared-first-entry-stay.md` line 3 write `- Task: \`57-debt\` (accepted design; the AFK default of 2026-11-10).` (the id D129 and "item 24" go). (b) `app/src/components/tables.test.ts` line 1102: write `.join(' · ')` where the literal NBSP stands; check with `grep -n -P "\xC2\xA0" app/src/components/tables.test.ts` (no hit left on that line). (c) `docs/specs/FEATURES.md` line 1245 ("Shared lists", the 142-character line): break it after "next opening. It" and indent the second half two spaces; leave line 1246 on.
2. `dict.ts`: add `listSignInLead` (RU and EN, texts above) next to the two old keys, then delete the old keys in both languages. `git grep -n listGoneSignedOut` must be empty before the next step ends.
3. `SignInPrompt.svelte` as the Files table says. Keep the class names `signin`, `signin-lead`, `signin-acts` (cases 37, 111 and the unit tests select them).
4. Unwrap the three call sites (`ListsPage`, `TablesPage`) and rewrite the two branches (`ListPage.gone()`, `PrintPage`). Delete the `ListsPage` `.signedout` CSS.
5. `Shell.svelte` title branch.
6. Unit tests as the Files table says; `rtk npm run test` on the touched files only first (`npx vitest run <files>` with `VITEST_MAX_WORKERS=2`).
7. `inventory.js`: add
   ```js
   {
     id: '#/homebrew/new',
     route: '#/homebrew/new',
     why: 'signed out: the heading «Мои предметы» and the sign-in plate with «Войдите, чтобы создавать свои предметы.» and «Войти»'
   },
   ```
   next to the other `#/homebrew` signed-out state, and reword the `why` of the two list states: SHOP "signed out on an account address: the heading «Мои списки» and the sign-in plate with «Войдите, чтобы открыть список: ...» and «Войти»"; `#/lists/nope` "not an account address, signed out: the same plate; the address not rewritten".
8. `states.js`: write case 131 (below); in case 111 add to `LINES`: `['#/homebrew', 'main .signin-lead']`, `['#/tables/homebrew', 'main .signin-lead']`, `[SHOP, 'main .signin-lead']` (SHOP is defined at the top of the file as `const SHOP`), and run the (a2) button-follows-lead loop over `#/homebrew` and `#/lists/nope` as well as `#/lists`; in case 110 add nothing (the 18 px collapse is case 131 (e)'s rule).
9. Specs, DESIGN.md, COVERAGE.md, DEBT.md and the decision file; `node tools/decisions.js`.
10. Gates in the order of "Verification". Re-seed only what moved ("Goldens").
11. Handoff: replace Status, record the figures and the failing run of case 131 on the PH3 build (run it before step 3: it must fail on every route but `/lists`); commit; push.

## New states cases

- 131 (one sign-in plate), signed out, states `#/lists`, `#/lists/00000000-0000-4000-8000-000000000101`, `#/lists/nope`, `#/homebrew`, `#/homebrew/new`, `#/tables/homebrew`, `#/p/set-twocards`; RU and EN; 320x568, 360x640, 768x1024, 1180x720, 1920x1080:
  - (a) shape: exactly one visible `main .empty` holding one `.glyph`, one `p.signin-lead` with the route's lead text, and one button named «Войти» / "Sign in"; nothing else focusable inside the plate; no link «Открыть таблицы» in `main` on the list routes; no `.errpage`.
  - (b) one shape: the lead's computed `font-size`, the button's height and the plate's `text-align` are equal on all seven states at one window; the button's center is within 1 px of the plate's center; at 360x640 and 1180x720 the button's bottom is inside the window (the plate's top against 40% of the window is logged, not asserted: no first-screen row for a prompt).
  - (c) `document.documentElement.scrollWidth <= clientWidth` at 320 and 360; the lead's right edge inside the plate's padding box.
  - (d) the focus: `document.activeElement` is not inside the plate after the page settles; Tab from the header's last control reaches «Войти» before the footer.
  - (e) the gap: the plate's top minus the lowest block above it is 16, or 18 when that block is a `.page-sub` (margin collapse); the plate has a solid border and the `rgb(20, 17, 29)` ground (as case 110).
  - (f) «Войти» opens `/account` (`/en/account` in English).
  - (g) `#/lists/<uuid>`: one `h1` «Мои списки» / "My lists", `document.title` starts with the same; `#/p/set-twocards`: one `h1` «Печать карточек».
  The case fails on the PH3 build for every state but `#/lists` and passes after.
- Cases 110 and 111 as step 8 says; case 83 and 116 rerun unchanged.

## Goldens

Expected diff set, read line by line (`node tests/app/golden.js --only=<id>` per state, then `--update --only=<id>`):

- `_lists_00000000_0000_4000_8000_000000000101.txt` and `_lists_nope.txt`: the header `why`; the `RootWebArea` name gains «Мои списки - » / "My lists - "; in `main` the `heading` becomes «Мои списки» / "My lists", the sentence becomes the new lead, `button "Войти"` stays, the `link "Открыть таблицы"` and the `status` block go (RU and EN).
- New: `_homebrew_new.txt` (state `#/homebrew/new`).
- Every other signed-out golden (`_lists.txt`, `_homebrew.txt`, `_tables_homebrew.txt`, `_p_set_twocards.txt`) must stay byte-identical: the accessibility tree holds no geometry and the lead is the same text node in the same order. A diff there is a defect to explain, not a re-seed.

## Verification

Order, one heavy command at a time, foreground unless noted, Bash timeout 600000, `VITEST_MAX_WORKERS=2`:

1. Before step 3: `npm run build:test`, then `node tests/app/states.js --only="131 ("` (it must fail; record which states).
2. After the edits: `rtk npm run check:fast` (about 12-14 min), `npm run lint:typed`, `npm run lint:untyped`.
3. `npm run build:test`; `node tests/app/states.js --only="131 ("`, `--only="110 ("`, `--only="111 ("`, `--only="83 ("`, `--only="116 ("`; then the shards that hold them, in the background one at a time: `node tests/run-all.js` rows `app/states` 1/4 (cases 83, 111, 131), 2/4 (116) and 4/4 (110). Shard 3/4 holds none of them; CI runs it.
4. `node tests/app/golden.js --only=<id>` for the seven states, then `--update --only=<id>` for the three that move; then `node tests/app/golden.js` for the full set (no divergence).
5. `node tests/app/typo.js` (only the two known font-origin failures of PH3 Deviations (5) may remain).
6. `npm run check:built` (build, smoke, budget). Record the printed unconfigured total.
7. `node tools/decisions.js`; `git grep -n -E "listGoneSignedOut|\.signedout"` and `git grep -n -P "\xC2\xA0" -- app/src/components/tables.test.ts` are empty.

Bundle figure rule: the limits now are 276 kB unconfigured and 333 kB configured (`tools/bundle-budget.mjs`; `.claude/README.md`, "The configured bundle budget"). The batch should move the total by -0.2 to +0.2 kB (one string added, two removed, an `Empty` import already in the entry chunk, the error-page branch gone). Print the figure and write it in the handoff with one decimal. If it passes 276 (a printed 276.0 can still fail: add 1 kB), raise `BUDGET_KB` and the README lines in this commit to the measured total rounded up, and raise the configured limit by the same step when the estimate (unconfigured plus the 57 kB account chunk, no `.env.test.local` here) passes 333; the ceilings stay 300 kB unconfigured and 350 kB configured. Otherwise change neither file.

Total gate cost, from `.claude/README.md` "Batch size and the fixed cost of a run": `check:fast` 12-14 min, `build:test` twice 4 min, the three shards 755 + 505 + 675 s (about 32 min), focused cases and goldens about 8 min, one CI run about 15 min: 70-80 min, one fix cycle 30 min more. No split: the six routes share one component, one signed-out seed and one golden set (`CLAUDE.md`, "Task and session protocol": merge work that shares a component, seed and filter). The nits are text edits and ride along.

## Acceptance

- Case 131 fails on the PH3 build for every state but `#/lists` and passes after, RU and EN.
- Each of the seven states draws one plate: the glyph, the lead, one «Войти»; `/lists/<uuid>` has no «Открыть таблицы» and no `.errpage`; its `h1` and tab title read «Мои списки» / "My lists".
- `/lists` is pixel-equivalent to before (case 110 and 111 on `#/lists` pass without a changed number).
- The compact and boxed prompts are unchanged: cases 37, 42, 44, 73 pass; the `_h_*_sign_in_prompt`, `_i_ci1_print_signed_out` and `_tables_a_row_ticked_print_signed_out` goldens are byte-identical.
- The golden diff is exactly the set of "Goldens"; each diff read.
- `listGoneSignedOut` and `listGoneSignedOutSub` are gone from both dictionaries; `listSignInLead` is in both; `i18n.test.ts` parity passes.
- DEBT.md has no D134 and no "Copy and prompt leftovers" section; FEATURES.md, DESIGN.md and COVERAGE.md hold the plate rule; the decision file exists and `docs/DECISIONS.md` lists it. (Owner rule of 2026-11-11 written into its homes in this batch.)
- Nit 1: the decision file's line 3 holds neither "D129" nor "item 24" and keeps the task line. Nit 2: `tables.test.ts` holds `' · '` and no literal U+00A0. Nit 3: FEATURES.md "Shared lists" has no unwrapped line at the former line 1245.
- Bundle figure in the handoff; limits raised in this commit when needed.
- `check:fast`, both lints and CI green; the sweep rows for the three new signed-out pages clean at 360, 390, 768 and 1180 (CI's `app/sweep`).

## Risks and do-nots

- Margin collapse: under a `page-sub` (18 px) the plate sits 18 px below, not 16. Case 131 (e) names both values; do not add a margin fix to `Empty`.
- Do not rename `.signin`, `.signin-lead` or `.signin-acts` (states cases 37, 42 and 111 and the unit tests select them) and do not add `data-primary` to the plate.
- Do not change the compact or boxed forms, `Empty`, `ErrorPage`, `PageTitle` or `PageHead`.
- Do not keep the old bare form "just in case": a variant before a caller needs it is dead code (`CLAUDE.md`).
- Do not set a focus in the plate (page-level prompts leave it).
- `ListPage.gone()` is read by the signed-in branch too: change only the `{:else}` branch.
- The tab title must not flip while the session is unknown (plain title, as now); a test holds it.
- Settled, do not reopen: one shape (owner, 2026-11-11); six routes; no «Открыть таблицы» on the signed-out list route; `listSignInLead` as worded.

## Fallback

If the owner strikes a route (for example `/p/<id>`), revert its call site alone; the component needs no change. If a route's gap of 18 px is unwanted, give `PageTitle`'s sub a smaller bottom margin only where a plate follows: a separate decision, not part of SP1.
