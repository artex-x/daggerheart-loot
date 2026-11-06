# Plan debt - paying the kept defects after wave 3 (TASK 57)

This file is the plan for the task that follows task 57. It lists the defects and cleanups that task 57 keeps on purpose, groups them, and gives the order. It is scratch of task 57: at closeout the user-visible defects move to `docs/specs/DEBT.md`, and this plan moves to the directory of the follow-up task, `issues/57-debt/` (task id `57-debt`, the name `DEBT.md` gives its sections).

## Status

- Planned 2026-11-06 (orchestrator, with the owner's yes on the grouping and the recommendations). Not started.
- Owner decisions: see `context.md` and the AFK decisions 24-28. `docs/specs/DEBT.md` is empty today.

## Steps, in order

| Step | Content | Home | Review |
|---|---|---|---|
| 0 | Closeout of task 57: write the DEBT.md entries below (sections "Phone overlays" and "Wide-screen text"), move this plan, delete `issues/57/` | task 57 closeout | none |
| 1 | Tooling and CI | its own small task, no UI | reviewer (hooks change) |
| 2 | Phone overlays and scroll | one batch | reviewer, mobile probes at 360x640 |
| 3 | Visual leftovers | one batch, mock first | reviewer, owner sees the mock |
| 4 | Code cleanup | folded into steps 2 and 3 where files overlap; otherwise an issue list | none |
| 5 | Impeccable `polish` and `harden`, detector re-run | after step 3, on the pages TD, N and P touched | none |

Recommended order: 1, 2, 3 (4 and 5 ride on them). Step 1 first because it shortens every later CI wait.

## Step 1 - Tooling and CI

- `ci.yml` browser comment says the fixed cost of a job is about 20 s; it is about 70 s.
- `.claude/hooks/bash-guard.mjs` says a shard row costs up to about 380 s; rows are now 440-840 s. A bare `node tests/app/states.js` (about 30 min serial) has no long-check reminder. A hook change needs selftest cases.
- Refresh the `tests/run-all.js` weights from the first fully green run (the `app/states` rows are still the 440 s projection).
- Case speed-ups: from the `took:` lines name the five slowest `app/states` cases and compare one context with `setViewport` per width against a `fresh()` context per cell.
- Output streaming: `run-all.js` writes a row's log only when the row ends, so a cancelled job keeps nothing of the running row.
- Timing limits that flaked on CI: `homebrew.timed.test.ts` (16 ms, measured 16.96 ms on a docs-only commit) and the e2e import limit `IMPORT_MS` (6000 ms; one run took 9329 ms on the hosted project). Decide a margin from several CI readings, not from one.
- The fake has no switch for a raised limit, so no suite reads 3x the default limits (150 lists, 300 entries, 30 pending requests) on the list pages (`reviews/post-wave-3-signed-in.md`, "Checks still needed").
- Acceptance: selftest cases for each hook change; one CI run with the new weights where no browser job passes 15 min.

## Step 2 - Phone overlays and scroll

Items (all measured at 360x640 unless stated):

- The toast covers the end of an open «Ещё» for 7 to 10 s (TD measured 4829 px² RU, 3405 px² EN on a roll result).
- After the list «Ещё» closes, the page sits at scroll 83-87 and the shown header covers «Ещё»; Escape returns to scroll 0, a tap outside does not.
- A `focus()` on a header control moves the page up (scroll 1500 to 1199 at 320 px).
- `/search` at 320x568 RU: after the kind sheet closes, `scrollWidth` is 313 against 305.
- Escape does not clear a selection or fold «Настроить» (`/tables/core_item`, `/roll/std`; post-wave-3 N9): input for DESIGN.md "Proposed rules", The Escape Rule.
- A toast sets `role` and `aria-live` in the same update as its text, so a screen reader can miss it (post-wave-3 signed-in R2): check with NVDA or VoiceOver first; a fix touches case 108's timing hook and case 32's role count.
- Inputs under 16 px at 360 px (the add-to-list new-list field 13 px, the row position and price 13 px, the note 14 px, «Кол-во» 15 px; post-wave-3 signed-in R3): check the iOS zoom on a device first.
- Recommended approach (Option A): `preventScroll` where the control is always in view, a toast placed above an open menu, and a header that stays hidden while a menu is open. Option B (a bottom sheet on phones) removes the family but is a larger redesign.
- Acceptance: a case per item that fails before and passes after; no new first-screen exception; RU/EN parity; the target-size sweep clean at 360, 390, 768 and 1180.

## Step 3 - Visual leftovers (mock first)

- `/s/` shows the bare list position «1» where `/search` shows «№ 89».
- Tabular stat columns on table rows from 1440 px (owner: a mock first, then the owner's yes).
- Monospace labels outside the Key Characteristics rule: `.ordiv i`, `.altcol`, `HelpButton`, `.steps-l`.
- Uppercase controls outside the capitals rule (15 components).
- `404.html`: system font and no die mark.
- The EN `<title>`, the manifest name, the `en/index.html` wordmark, and the link-preview Worker card images (`tools/share-card.mjs`).
- Acceptance: owner approves the mock before the build; DESIGN.md "Proposed rules" rows move to named rules or are deleted.

## Step 4 - Code cleanup (no behavior change)

- The tab and picker CSS copied into `HomebrewTabs` from `TableNav`.
- `EQ_DT` abbreviations in the stat line.
- One `RollPage` instance per roll mode in `App.svelte` (today each mode draws its own head).
- `typo.js` `SWITCHES`: the note switch, the price switch, `/search`'s kind row, and the Whole Message step at 360.
- `review.prompt.md` names a third look `<name>-2.md` while `agent-guard.mjs` reads `plan-<batch>-<n>.md`.
- `P5`: `rollNo` and about 1000 generated stubs (needs a plan review first).
- Home: an issue list. A refactor with no user-visible defect does not belong in DEBT.md.

## Step 5 - Impeccable pass

Run `polish` and `harden` on `/roll/alt`, `/tables/eq_weapon`, `#/homebrew` at 360, 768, 1000 and 1180 px, and on the pages batch TD and P touched. Re-run `impeccable detect --json app/src` (60 findings at the last count).

## Decisions kept from task 57

- `4-R1` (the «В список» button below the fold on 21 of 98 records at 360x640): keep the page, let the reader scroll.
- TD-R1 and TD-R2: the two target-size exceptions (`.craft a`, the fold in a relation line) and the 309 px `/s/` first-screen figure are accepted.
- Case 89: batch 10 tries a shorter roll label, then a narrower picker.

## Gate cost

Step 1: about 60-90 min. Step 2: about 150-200 min. Step 3: about 120-170 min plus the owner's time on the mock. Steps 4 and 5 ride on 2 and 3.
