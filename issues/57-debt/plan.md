# Plan debt - paying the kept defects after wave 3 (TASK 57)

This file is the plan for task `57-debt`, the task that follows task 57. It lists the defects and cleanups that task 57 kept on purpose, groups them, and gives the order. The user-visible defects are in `docs/specs/DEBT.md` (D122 to D140). Task 57's own files (`context.md`, `handoff.md`, `reviews/`) are deleted; read them with `git show 17d16083:issues/57/<file>`.

## Status

- Planned 2026-11-06 (orchestrator, with the owner's yes on the grouping and the recommendations). Task 57 closed on 2026-11-07; step 0 is done (the entries are in `docs/specs/DEBT.md`, this plan is moved here). Steps 1 to 5 are not started.
- Plan review: not required (no trigger fired). Batch VW1 (`plan-views.md`) is one routine batch with no open design question.
- Owner decisions: the 2026-11-06 AFK decisions 24-28 are recorded as decisions in `docs/decisions/` (the newest file of 2026-11-06 and the files it amends) and as rules in DESIGN.md and FEATURES.md.

## Steps, in order

| Step | Content | Home | Review |
|---|---|---|---|
| 0 | Closeout of task 57: write the DEBT.md entries below (sections "Phone overlays" and "Wide-screen text"), move this plan, delete the task 57 directory (done 2026-11-07) | task 57 closeout | none |
| 1 | Tooling and CI | its own small task, no UI | reviewer (hooks change) |
| 2 | Phone overlays and scroll | one batch | reviewer, mobile probes at 360x640 |
| 3 | Visual leftovers | one batch, mock first | reviewer, owner sees the mock |
| 4 | Code cleanup | folded into steps 2 and 3 where files overlap; otherwise an issue list | none |
| 5 | Impeccable `polish` and `harden`, detector re-run | after step 3, on the pages TD, N and P touched | none |
| V | One control for the view or mode on `/roll`, `/tables`, `/homebrew`: batch VW1, after step 1 and before step 2 (`plan-views.md`) | one batch | reviewer optional (no trigger) |
| D | Catalog data fixes from the owner's findings of 2026-11-07 (section "Step D" below) | one small batch, data only; first, before step 1 | none (no trigger); a second pair of eyes is the owner's production look |

| E | The share button's output carries the link, not only the picture and the text (owner, 2026-11-07; section "Step E" below) | one small code batch with unit tests | none (no trigger) |

Recommended order: D, E, 1, V, 2, 3 (4 and 5 ride on them). Steps D and E first because they are small and the owner saw the defects on production. Step 1 next because it shortens every later CI wait.

## Step D - Catalog data fixes (owner findings, 2026-11-07)

`data.js` is one line: one script keyed by id edits it, with assertions that only the named fields of the named records change; then
`node tools/desc-style.mjs`, `node tools/build.js`, `node tests/run-all.js dataint,derived,contracts,craft`, the golden re-seed of the states that
print these records (`git grep -l` over `tests/app/snapshots`), `check:fast` and both lints (`npm run lint:typed`, `npm run lint:untyped`).

- D1. `ph76` bolds half of its cost. EN "**Mark a Hit Point** and a Stress", RU «**Отметьте Рану** и Стресс». Bold the whole cost in both
  languages: "**Mark a Hit Point and a Stress**" / «**Отметьте Рану и Стресс**». A scan of all 1593 records found no other split cost. The printed
  book may bold only the first half; bold is markup the PDF text does not carry, and the catalog convention (the whole cost bold) wins.
- D2. `lr2` (Alewife Almanac) names the Witch's Skillet (`lr3`) in plain text and links nothing. The Almanac works like the potion recipes
  (`ci18` to `cc8`, `ci19` to `cc7`, `ci24` to `cc16`, `ci51` to `cc35`), which already use `craft` and draw «Улучшается до» / "Upgrades to". Add
  `craft: ["lr3"]` to `lr2` (owner, 2026-11-07, recipe-like). `lr3` then draws «Получается из» / "Made from". The `craft` suite pins the chain
  count at 33 (`tests/craft.js`): it becomes 34, with the reason in the one-line comment. No rule card: `lr3` holds Double Duty. The label stretch
  is the one every recipe has; a «Вызывает» label would be a new relation across the card, row, stub and contracts (not planned).
- D3. The `lr` trim notes for the owner (decision file `2026-11-07-the-last-round-table-records-keep-rule-text-and-lose-lore`): `lr1` lost "cannot
  move on its own" and "stays animated outside the Tower"; `lr25` kept the Doppelcrock sentence but lost who she is. Owner decides whether to restore
  either; the removed text is `git show 1af46a61:data.js`. The trim rule for another source (Vault of Ages averages 319 characters, `dv` 228) is a
  separate owner decision.
- D4. Stale `why` texts "seven supplements" at `tests/app/inventory.js` (two places; the second sits in a golden header: a re-seed).
- D5. `lr20` (Longfire Fruitcake) is not readable alone: its move ends "applying the following results:" and the four results and the
  Impaired condition live only in the rule card `lr-fruitcake`, so the page, the share link and the print card show a lead with nothing
  after it (owner, 2026-11-07). A scan of all 1593 records found no other dangling lead: every other line that ends in a colon or says
  "the following" has its list in the same description (for example `w6`, `voa2_t2a`, `mw16`); the records that depend on a rule card
  (`lr6`, `lr8`, `ph66`, `ph77`, `ph79`-`ph84`, `ph85`-`ph93`) read complete without it and the card only adds general rules.
  Default (owner may change): option A, a self-contained description. `lr20` holds the move, the four outcomes as a list, the Impaired line
  and the light line, in both languages; the card `lr-fruitcake` and `refs: ["lr-fruitcake"]` go (refs 7 to 6: update the counts that
  `tests/derived.js` `COUNT_BEARING_FILES` names, the READMEs, `llms.txt` and `CONTRACTS.md`). The print card may shrink its text for the
  longer description (the owner accepts it: card size gives way; check `app/print` and the named shortfall in FEATURES.md "Print").
  Option B (keep the card, point to it and let the card carry the trigger line) was not chosen: the reader still goes to a separate piece,
  and the share page and print show it apart. Proposed RU: the move line «Съешьте ломоть кекса, затем совершите Бросок Реакции Силы (10):»,
  then the outcomes with lower-case verbs after the colon, then «*Ослаблен*: ...», then «Кроме того, ломоть можно поджечь: он горит 1 час и даёт
  тусклый свет.» EN keeps the book's words.
- D6. Russian copy edit of the `lr` kept text (owner, 2026-11-07: «Встречается в буханках примерно по 4,5 кг, заранее нарезанных на 5
  ломтей...» reads stiff). Proposed first case, `lr20`: «Продаётся буханками примерно по 4,5 кг, заранее нарезанными на 5 ломтей. Фруктовый Кекс
  Долгого Огня не плесневеет, не сохнет и не черствеет. Одного ломтя хватает, чтобы заменить дневной рацион.» Scope: the 21 trimmed `lr`
  records; EN is the book's text and stays. Show the owner a before and after table of every changed RU sentence first and apply only what
  the owner signs; follow the `daggerheart-ru-terms` conventions (rules terms, capitalization of game terms stays).
- Acceptance: each record's changed fields are the only diff (the script's assertions); `dataint` still counts 1593 records; the changed golden set
  is the list the `git grep` found, each diff read; `craft` passes with 34 chains; CI green.

## Step E - The share button carries the link (owner, 2026-11-07)

Today (`app/src/components/RecordActions.svelte`, `send()`): «Поделиться» builds `{ title, text, url, file }` and hands it to the share port
(`app/src/ports/share.ts`). `url` is the record link (`app.linkToRecord(it)`) when the record is linked; `file` is the picture as a PNG when
there is art. **The cause is in the port, not in the targets:** when a file is attached and `canShare({ files })` is true, `browserShare` calls
`nav.share({ files: [file], text: what.text })` (line 42): `url` and `title` are not passed, so the link never leaves the app. Without a file
(`plain`) it sends `{ title, text, url }`. So every file share loses the link, on the phone too if the target shows only the text. Proposed
(default, owner may change): when a file is attached, the link goes in the shared `text` as its last line (the port or the component adds it,
once: check that the text does not already end with the link), and `url` is passed with it only where it does not duplicate (the Web Share API
accepts `files`, `text`, `title` and `url` together; a target shows what it understands). A record with no link (a build with no preview host)
sends the address `<site>[en/]#/i/<id>` the same way as the clipboard fallback does, so the output always names a place to open the record.
Check the same hand-off in the other share buttons that carry a record or a link: the roll result row (`size sm`), the dialog dock «Поделиться»,
the list «Поделиться» and the share panel (`SharePanel`), the own homebrew item (the preview link `/h/<uuid>?v=<v>`, `/en/h/` in English).

### Step E2 - Windows (owner, 2026-11-07)

The owner sees only the picture when pressing «Поделиться» on Windows; on a phone it works. Two causes stack: the port omission above, and the
Windows share UI, which hands a shared file to the chosen app and, for many apps (Mail, Teams, Nearby sharing), shows the file and drops the
text. What can be done here is limited; what to try, in this order, each a measured result on a Windows machine with Edge and Chrome (the
implementer cannot run a Windows share sheet: the owner tries it):

1. Fix the port omission first (above). If the Windows targets show text next to a file, that is enough.
2. If the Windows sheet still shows only the picture: on a desktop (a fine pointer, no touch: `matchMedia('(pointer: fine)')` and
   `!matchMedia('(any-pointer: coarse)')`, or `navigator.userAgentData?.platform === 'Windows'`) send the share WITHOUT the file, as
   `{ title, text, url }`, so Windows targets receive the link and the text; the picture stays one press away in «Ещё» («Копировать картинку»,
   already in the menu) and the phone keeps the file share. Trade-off: a desktop reader no longer shares the picture and the link in one press.
3. Alternatives, not the default: a desktop split button «Поделиться» (link and text) and «Поделиться картинкой»; bake the link into the PNG as a
   caption line (works in every target, changes the picture and the print/stub art rules); copy the picture and the link to the clipboard together
   (`ClipboardItem` with `image/png`, `text/html` with the link and `text/plain`; the target decides what it pastes) and toast it, then open the
   share sheet with the text only.
4. The port keeps the three levels of its own header comment (files, text and link, none); the Windows rule is a fourth input, not a branch in
   the component: `SharePort` decides it (as it decides `canShare` today), with a unit test per environment (`fakeShare` options) so a test
   reads which fields each environment sends.

Open owner choice after the owner has tried it on Windows: option 2 (default if step 1 is not enough) or the split button of option 3.

- Files expected: `RecordActions.svelte`, `app/src/lib/share.ts` (if the text builder is the better home), their tests (`record.test.ts`
  share cases, `ports` share port test), `docs/specs/FEATURES.md` (the share lines at "Records" and "Share links"), `docs/specs/COVERAGE.md`.
- Acceptance: with a picture the payload's `text` ends with the link and `file` is set; without a picture `text` ends with the link and `url`
  is set; no record shows the link twice in the target's preview where it reads both (document what the port does: pass the link once in
  `text` and leave `url` empty when a file is attached); an unlinked record sends the site address; RU and EN texts; one unit test per case, axe
  unchanged; `check:fast` and both lints.
- Not verifiable here: how each messenger renders the payload. Say in the handoff which targets were tried, and that the owner checks one
  phone share (Telegram and one more) on production.

## Step 1 - Tooling and CI

- `ci.yml` browser comment says the fixed cost of a job is about 20 s; it is about 70 s.
- `.claude/hooks/bash-guard.mjs` says a shard row costs up to about 380 s; rows are now 440-840 s. A bare `node tests/app/states.js` (about 30 min serial) has no long-check reminder. A hook change needs selftest cases.
- Refresh the `tests/run-all.js` weights from the first fully green run (the `app/states` rows are still the 440 s projection).
- Case speed-ups: from the `took:` lines name the five slowest `app/states` cases and compare one context with `setViewport` per width against a `fresh()` context per cell.
- Output streaming: `run-all.js` writes a row's log only when the row ends, so a cancelled job keeps nothing of the running row.
- Timing limits that flaked on CI: `homebrew.timed.test.ts` (16 ms, measured 16.96 ms on a docs-only commit) and the e2e import limit `IMPORT_MS` (6000 ms; one run took 9329 ms on the hosted project). Decide a margin from several CI readings, not from one.
- The fake has no switch for a raised limit, so no suite reads 3x the default limits (150 lists, 300 entries, 30 pending requests) on the list pages (`git show 17d16083:issues/57/reviews/post-wave-3-signed-in.md`, "Checks still needed").
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
