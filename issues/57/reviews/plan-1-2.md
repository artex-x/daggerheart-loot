# Review - plan before 1 (57)

Verdict: fix-then-continue
Reviewed: deaa7989c2d3973fb6e60db3d87fc30d3f186fe7
Scope: plan before 1

<!-- Second look at the plan after the 2026-10-29 refresh. The first review
of the plan of 2026-10-23 is reviews/plan-1.md. -->

Read: `CLAUDE.md`, `.claude/prompts/review.prompt.md`, `context.md` (with the
owner's "Plan refresh answers" Q1-Q4 of 2026-10-29), `plan.md`, `handoff.md`,
`audit.md` ("Re-check against main (2026-10-29)"), `reviews.md`,
`reviews/plan-1.md`, `DEBT.md`, `CONTRACTS.md` sections 1, 4 and 5,
`ROUTES.md` "Sections", `FEATURES.md` "Lists", "Chrome" and "Consistency
rules", `.claude/README.md` "Batch size and the fixed cost of a run",
`orchestrate.prompt.md` "When to run reviewer" and "Plan review",
`docs/fixtures/urls/routes.json` (97 rows), `tests/app/contracts.js`,
`hash.test.ts`, `tests/contracts.js`, `tests/derived.js`, `.prettierignore`,
`.gitignore`, `.git/info/exclude`, `.impeccable/config.json`,
`app/public/sw.js`, the R mocks (`states.js`, `shared/kit.js`,
`shared/base.css`, `header__360__ru.png`, `shell-signed-out__360__en.png`,
`list-note__1180__ru.png`). Ran `impeccable detect --json --no-config
--no-advisory app/src`, and the same on `PrintCard.svelte`, `tokens.css`,
`app/index.html` and `DESIGN.md`. Ran `git grep` for British spellings over
the repository.

Mock marks: **[mock A]** changes a unit A folder (`mocks/1-5,7`), **[mock B]**
changes a unit B folder (`mocks/6,8,9`).

## Blockers

B1. E3 and E5 together leave two hook files that no Prettier ignore covers. (local)
- Where: section 5 rows E3 and E5; section 7 "Batch 1" lines E3 and E5;
  section 10 step 7 and the E3 and E5 acceptance lines; section 13 Q4.
- Defect: E3 removes the three `.prettierignore` lines because the root
  `.gitignore` lists the same files, and Prettier 3 reads `.gitignore`. E5
  removes the `.gitignore` lines for `hook.cache.json` and `hook.pending.json`
  when batch 1 finds the code that writes the `impeccable-hook-ignore` block in
  `.git/info/exclude`. Prettier does not read `.git/info/exclude` (the
  `.prettierignore` comment says so). So if E5 removes its two lines, no ignore
  covers those two files for Prettier. Then `format:check` fails in every
  session where the hook writes them. The batch 1 commit can pass, so the
  failure shows up later and does not point to its cause. The block marker
  `# impeccable-hook-ignore-start .` on this host suggests that Impeccable
  wrote the block, so the "found" branch is the likely one.
- The owner's Q4 answer (2026-10-29) is "remove E5 only with proof of what
  writes the exclude block". That proof does not stop the failure above. If
  the proof is found, E5 can go only if its two `.prettierignore` lines come
  back, which swaps one exception for another.
- Change: name this to the owner. Recommended: keep E5. Reason, recorded where
  N14 puts kept repository exceptions: the tracked `.gitignore` lines are what
  let E3 go, because Prettier reads `.gitignore` but not `.git/info/exclude`.
  If the owner keeps the Q4 answer, the E5 "found" branch must restore the
  two `.prettierignore` lines in the same commit, and `handoff.md` says that
  the exception count did not drop.

B2. E2's ignore covers the list's drag-and-drop line, not the notes. (local) **[mock B]**
- Where: section 5 row E2 ("remove with the list page's note redesign (A5,
  A22)"); section 7 "Batch 9" line E2.
- Defect: with `--no-config`, the detector reports three `side-tab` findings
  in `ListPage.svelte`. All three are the reorder drop mark:
  `.lrow.drop-before` and `.lrow.drop-after` (`inset 0 +-3px 0 0 var(--gold)`)
  and `.lrow.drop-after .rnote`. None of them is the note style.
  `FEATURES.md` "Lists" specifies this mark ("the highlight is drawn on that
  row's own last visible line ..."). The note redesign (A5, A22) leaves all
  three findings in place, so the batch 9 line "the detector passes on
  `ListPage.svelte` ... with no ignore" cannot pass as planned. The N1 finding
  in `HitNote.svelte` (`border-left: 2px solid var(--gold)`) is the only
  note-style finding.
- Change: correct E2's cause in section 5. Add a batch 9 line: redraw the
  drop mark so that the detector does not flag it, and keep every
  `FEATURES.md` "Lists" drop rule (both rows lit, the mark on the last visible
  line under an open note). Recommended: a 2 px gold line drawn by a gap
  element between the rows, not an inset shadow on the row. Prove it with
  `impeccable detect --no-config` on `ListPage.svelte` and with the existing
  reorder cases. Add a drag state (a drop between two rows, one of them with an
  open note) to unit B's `mocks/9/`. If no form passes the detector, keep a
  value-scoped ignore and name it to the owner in batch 10.

B3. The plan places Q3 as "American in the UI only", and the owner's answer covers much more. (local) **[mock A]**
- Where: section 2 "Not in scope" (`llms.txt` spelling), section 7 "Batch 2"
  P7 line, section 8, section 12 "Deferred", section 13 Q3, handoff
  "Deferred" and "NEEDS_HUMAN_CONFIRMATION", Status (the plan review trigger).
- Owner's answer (context, "Plan refresh answers"): American spelling
  everywhere - the UI, the share cards, `llms.txt` (with its fixtures,
  `tests/contracts.js` and `CONTRACTS.md` in the same commit), the developer
  docs and the AI-facing files (`.claude/` prompts, skills and agents,
  `CLAUDE.md`). A decision file records it. Home: the decision file and
  `I18N.md`, written by the batch that ships P7 (batch 2).
- What the repository holds today (`git grep` on `deaa7989`):
  - British forms in 15 lines of `llms.txt` ("armour", "colour", "catalogue",
    "## Licence", "Recognising"), in `README.md` (20), `CLAUDE.md` (14),
    `DESIGN.md` (27), `PRODUCT.md` (4), `docs/specs/` (FEATURES 34, COVERAGE
    32 and others), `docs/artwork.md`, `.claude/README.md` (23), the prompts,
    skills, agents and the decision template.
  - User-facing English outside `dict.ts` that the plan's P7 list misses:
    `tools/build-share-pages.js` (the EN meta descriptions of `en/index.html`
    and `i/en/*.html`: "weapons and armour") and `tools/build-pages.js` (the
    Terms page description: "the licence for the game content"). Link
    previews show these.
  - Tests pin some of the British text: `tests/contracts.js:187` asserts
    `'| Artefact | Field | Carries |'` in `CONTRACTS.md`, and
    `tests/derived.js:1612` matches `fall\s+outside that licence` in
    `README.md`. Each one moves in the same commit as its text.
    `tools/decisions.js:45` writes "Behaviour decisions" into the generated
    `docs/DECISIONS.md`, so that file must be rendered again.
  - No `docs/fixtures/` file that `llms.txt` quotes verbatim holds a British
    form. `from-llms.json` has keys `hb_sectarmouraaaaaa` and
    `hb_furarmouraaaaaaa` and the value "Armour"; these are data, not prose.
- Spec conflicts to name to the owner (the spec wins until the owner decides):
  - `CONTRACTS.md` section 4: "the frozen schemas' descriptions keep their
    published wording". `schema/import-v2.json`, `import-v3.json`,
    `homebrew-v1.json` and `homebrew-v2.json` say "armour" four times each.
    They stay.
  - Identifiers and stored values stay: `VectorPaint` `'colour'`
    (`cardVectors.ts`), the fixture keys, the inventory ids and golden file
    names (`~ colour for this visit`, `~ armour`), and the decision file names
    and titles (they are cited by path and title, and `tools/decisions.js`
    checks the citations).
  - Earlier decision bodies, commit messages, quotations (the DPCGL text, the
    source-book text, log excerpts) and the `issues/57/` scratch stay.
  - Code comments, test titles and `.claude/hooks/*.mjs` are not in the
    owner's list. A hook change is its own review trigger and moves
    `selftest.mjs`. Recommended: they stay, with the campsite rule (a comment
    that a batch rewrites takes American spelling).
  - `CLAUDE.md`, "Maintaining this file": "Add a rule only after an agent
    repeats a mistake". The decision file and `I18N.md` are the homes, so
    `CLAUDE.md` gets the respelling only, not a new rule line.
- Placement, recommended:
  - Batch 2 keeps the UI part of P7 and adds the two `tools/` description
    strings (then `node tools/build.js`; `tests/derived.js` already checks the
    heads). It also writes the decision file (template; rejected: British
    everywhere, and the plan's "UI only" default; the exceptions above), the
    `I18N.md` rule and `node tools/decisions.js`. This puts the home where the
    owner put it.
  - A new batch "2b" follows batch 2. It keeps the name 2b so that the mock
    folders keep their numbers, and it has no mock. It holds the sweep of
    `llms.txt`, `CONTRACTS.md` with `tests/contracts.js`, `README.md` with
    `tests/derived.js`, `docs/specs/`, `DESIGN.md`, `PRODUCT.md`,
    `docs/artwork.md`, `.claude/README.md`, the prompts, skills, agents and
    templates, `CLAUDE.md`, and `tools/decisions.js` with a new
    `docs/DECISIONS.md` render.
  - Split criterion for 2b: "a review that cannot be held in one pass"
    (`plan.prompt.md`). Production source and prose or tooling are two
    different judgement frames, which is the B12b/B12c precedent in
    `.claude/README.md`. 2b also needs no browser suite. It comes after 2 so
    that it also covers batch 2's new `FEATURES.md`, `ROUTES.md` and
    `CONTRACTS.md` text.
  - Alternative: all of it in batch 2. That saves one CI run and one review
    (about 30 min), but the batch 2 review then reads the shell code and a
    prose diff of about 60 files together.
- 2b contract set and gates:
  - Files: `llms.txt`, `CONTRACTS.md`, `tests/contracts.js` (line 187), and
    `docs/fixtures/` (no change expected; state it).
  - Gates: `rtk npm run check:fast` (215-310 s; plus the hook selftest when it
    selects `.claude/` paths, 253-563 s); `node tests/run-all.js
    contracts,dataint`; one CI run (not docs-only, because `tests/` changes:
    10.5-11.5 min); one review fix cycle. About 30-45 min.
  - Add the cost to section 8. The new total is about 8.0-10.4 hours.
- Review triggers: an `llms.txt` change is on `orchestrate.prompt.md` "Plan
  review" list, so 2b is a second plan-review trigger. Set Status to
  "required before 1 (trigger: public contract changes in batches 2 and 2b)".
  This review covers 2b's set as stated here, so no second plan review is
  needed if the planner applies it as written. 2b needs a batch review: its
  contract change, and the prompt and agent changes ("When to run reviewer").
- Acceptance for 2b: the decision file names a word list. `git grep -n -i -E
  "<the list>"` over the paths in scope returns only the named exceptions. Add
  a line to "Each of batches 2-9": new prose uses American spelling. Batch 10
  re-runs the grep. Optional, recommended: a `tests/derived.js` check of the
  EN strings in `dict.ts` and of `llms.txt` against the word list, so that the
  rule holds after closeout.
- Mock: R's `states.js:736` and `:757` draw the EN print segment "Colour" on
  `account-settings` and `print-preview`. Unit A's `mocks/7/` shows "Color".
- Also change: Q3 in section 13 reads as answered. Remove "`llms.txt`
  spelling (Q3)" from section 2, section 12 and handoff "Deferred". Mark
  Q1, Q2 and Q4 answered, and set handoff NEEDS_HUMAN_CONFIRMATION to the
  questions that stay open (B1, B3's exceptions, R3, R7).

## Risks

R1. The batch 2 contract line does not define the new fields well enough to prove them. (local)
- Where: section 2 "Public contract change"; section 7 "Batch 2", the first
  line.
- Defect: `tab` becomes a job id (`roll`, `tables`, `search`, `null`), but the
  line says that `tests/app/contracts.js` "compares through `pathOf()`, as
  today". `pathOf()` of a job id has no meaning. The line does not say how the
  value of `mode` is written (`#/roll/<id>` or a bare slug), or which DOM
  element the browser test reads. Today the test reads `nav.tabs
  a[aria-current="page"]`'s `href`, and «Дополнения ▾» is a menu button, not a
  link. Two more items are wrong or missing. `tests/contracts.js` and
  `address.test.ts` read only `hash` from the fixture, so neither one needs a
  change for `tab`. `CONTRACTS.md` section 1 does not mention `tab` today, so
  the plan must give the sentence that the batch adds. "with `/en/` twins
  where the fixture has them" is empty, because `routes.json` has no `/en/`
  row.
- Change: state the shapes and the read:
  - `tab` is read from `data-job` on the lit job link.
  - `mode` is the canonical route key `#/roll/<URL id>` (for example
    `#/roll/vault_of_ages` for `/roll/voa`), or `null` off the roll routes. It
    is read from `data-section` on the mode control with `aria-current`, the
    menu button included. It is compared through `pathOf()`.
  - Name `hash.test.ts` (`fx.resolves.tab === 'tables'`), `tests/app/contracts.js`,
    `CONTRACTS.md` section 1 (one sentence: "`routes.json` pins each route's
    resolved address, its lit job and its lit mode") and the `COVERAGE.md`
    rows at "`hash.test.ts`" and "Route resolution had no fixture" (its "28
    shapes" is stale: 97).
  - Drop `tests/contracts.js` from the batch 2 set, or keep it with "no change
    expected" (its spelling change is in 2b, B3).
  - Replace the `/en/` phrase with one `/en/roll/dread` probe in
    `tests/app/contracts.js`.
  - Add `tabBar.test.ts` and its `COVERAGE.md` row to the deletions beside
    `SupplementNav`.

R2. Batch 9 has no acceptance line for A1, the only P0 row, and no mock at the width where A1 occurs. (local) **[mock B]**
- Where: section 7 "Batch 9" inherited lines (A2, A3 and A42 have one; A1 has
  none); section 9 unit B (360 and 1180 only); section 7 screenshot set.
- Defect: A1 occurs at 640-900 px (768). There, the title column shrinks to
  20-60 px. No mock draws that width, so the owner confirms a fix that nobody
  has seen at 768.
- Change: add a batch 9 line for A1. At 640-900 px, quantity, price and row
  actions stack under the row body below about 900 px. The title column holds
  at least one word per line, and no badge draws over a title. `node
  tests/app/sweep.js 768` and a `states.js` geometry case prove it. Add 768 px
  renders (RU and EN) of `list`, `list-prices` and `shared-player` to
  `mocks/9/`, and add 768 to batch 9's screenshot set.

R3. R's account menu adds counts and a new order that the plan does not name. (local) **[mock A]**
- Where: `R/shell-account-menu` (`header__360__ru.png`, the last frame);
  section 7 "Batch 2"; section 11 item 2.
- Defect: the mock menu reads «Вы вошли как gm1@example.test», «Мои списки 3»,
  «Мои предметы 12», «Аккаунт», «Выйти». `FEATURES.md` "Chrome" orders it
  «Аккаунт», «Мои списки», «Мои предметы», then «Выйти», with no counts. The
  counts are a new feature. They need a lists read and a homebrew read on
  every page, with loading, failure and limit states. They also go against
  consistency rule 1: a count appears in one place, at the head of its
  collection. The plan names none of this, and the mock unit draws from R as
  it is.
- Change: in unit A's `mocks/2/`, keep the `FEATURES.md` order and remove the
  counts. If the plan keeps them, name them in batch 2 as an owner question,
  with the reads, their failure states, rule 1's departure and both
  languages. Recommended: remove them, because "no new features unless a fix
  needs one" (issue 57).

R4. Batch 1 adds a neutral pressed variant to `Chip` and `Button` that no batch 1 caller uses. (local)
- Where: section 10 "In scope", "Files expected" (`Chip.svelte`, `Seg.svelte`,
  `Button.svelte`), step 5, the `chip.test.ts` acceptance line; section 11
  item 5.
- Defect: the three switches that batch 1 moves are all `Seg`
  (`Shell.svelte:155`, `TablesPage.svelte:701`, `PrintSwitches.svelte:26,35`),
  and «Все» stays gold until batch 3. This goes against `CLAUDE.md`: "Add no
  module, export, component, or variant before something uses it."
- Change: in batch 1, give the variant, the `check` icon and the
  icon-and-label centre to `Seg` only, with the `shell.test.ts` case. Move the
  `Chip` variant and its `chip.test.ts` case to batch 3 («Все»). Move the
  `Button` variant to the first batch that has a caller. The DESIGN.md rule
  can still be written in batch 1, with `Seg` as its reader.

R5. The plan does not apply the owner's direction to use Impeccable for the batch work. (local) **[mock A] [mock B]**
- Where: section 7 "Every batch starts with its mock step" and "Each of
  batches 2-9"; section 10 steps; section 7 "Batch 10".
- Defect: the plan does not contain the words `polish`, `harden`, `critique`,
  `shape` or `document` as steps. The only Impeccable steps are `detect` and
  the batch 10 `design.json` regeneration. Context (owner, 2026-10-23 and
  2026-10-28): "Use Impeccable wherever it applies: ... `shape` and mocks ...
  `polish`/`harden` per batch, `document` for the `DESIGN.md` lock", and
  "Reuse Impeccable as much as possible ... instead of hand-made equivalents".
- Change: add one line to "Each of batches 2-9" and to batch 1: run
  Impeccable `polish` and `harden` on the changed surfaces before the
  screenshot set, and give the outcome in the handoff. Add to the mock step:
  run Impeccable `critique` with the Clarity Rule on each batch mock before
  the owner sees it. Unit A and unit B apply this to their folders. Name
  `audit` for batch 10's re-audit and `document` for `design.json`.

R6. An inline `impeccable-disable` comment can move an exception into the code, where no inventory finds it. (local)
- Where: section 5 (E7, "No hook, agent guard or lint rule names
  Impeccable"); section 7 "Batch 10" first line.
- Defect: `impeccable detect --help` documents in-file ignores
  (`impeccable-disable`, `-line`, `-next-line`). None exists today. A batch
  that must reach "no detector finding in a file it touches" can pass by
  adding a comment. The inventory and the batch 10 check do not catch that.
- Change: add an E11 row ("inline ignores: none on `deaa7989`; none may be
  added"). In batch 10, and in every batch's detector line, run
  `impeccable detect --json --no-inline-ignores app/src` and add `git grep -n
  impeccable-disable -- app/src` with no result.

R7. «Бросок» goes to `/roll/std` with no visit, even when the start section is a roll section. (local)
- Where: section 1 theme 4; section 7 "Batch 2", the «Бросок» line.
- Defect: a reader who pinned `/roll/voa` and arrives at `/tables/...` from a
  link presses «Бросок» and gets `/roll/std`, not the section they chose. The
  pin's own meaning is "open the app here" (`FEATURES.md` "Chrome").
- Change: «Бросок» opens the last roll section of this tab, else the start
  section when it is a roll section, else `/roll/std`. Add a `state/app.test.ts`
  case. Or keep `/roll/std` and name the reason. This is the owner's decision
  at mock 2; put it in `mocks/2/index.html` as a question. Recommended: the
  start section.

R8. E4 assumes that only `impeccable hooks ignore-value` rewrites `config.json`. (local)
- Where: section 5 row E4; section 7 "Batch 9" line E4.
- Defect: the `.prettierignore` comment says "the impeccable skill's hook and
  CLI rewrite these four during a session". If the hook also rewrites
  `config.json` on a normal edit, the E4 removal turns `format:check` red in
  ordinary sessions, not only when someone adds a new exception.
- Change: in batch 9, before the line goes: make one edit with the hook live
  and run `impeccable detect`. Then confirm that `config.json` is
  byte-identical and that `npx prettier --check .impeccable/config.json`
  passes. Else keep E4 with that reason.

R9. Unit A and unit B draw shared patterns at the same time. (deferred-scope, process) **[mock A] [mock B]**
- Where: section 9, "Shared code stays in `mocks/direction/shared/` and `R/`
  (read-only for both units); a unit copies what it changes".
- Defect: unit B's rows, filter strip, selection mode, «Ещё» menu and
  empty/error states (6, 8, 9) reuse rules that unit A's mocks 3 and 4 fix.
  If unit A changes one of them while it updates R to `main`, unit B draws the
  old form, and the owner confirms two forms of one pattern.
- Change: add one line to section 9. A unit changes a shared pattern only in
  the folder of the batch that owns it (3: row, filter, selection; 4: «Ещё»,
  dialog, error page; 2: header). A unit names each change in that folder's
  `index.html`. The orchestrator re-renders the dependent unit B states after
  the owner confirms 2, 3 and 4.

## Nits

- N1 (local): E1's acceptance proves nothing about the font. At `deaa7989`,
  `impeccable detect --json --no-config app/src` reports no `overused-font`
  while `tokens.css` still starts `--ui` with 'Inter', so the ignore is already
  stale. Write E1 as "the stale ignore leaves", and remove the claim that the
  detector proves the font.
- N2 (local): the batch 1 font proof. `document.fonts.check()` returns true
  when no face matches the family, so it cannot fail. "The package face
  ... `loaded`" passes on a RU page through the Latin subset, even if the
  Cyrillic subset is broken. Assert that the face whose `unicodeRange` covers
  U+0400-045F is `loaded` on the RU page, and the face for U+0000-00FF on the
  EN page.
- N3 (local): the batch 1 line "no request leaves the origin for a font" has
  no proof. Add a `typo.js` request listener that asserts every font request
  is same-origin under `/assets/`.
- N4 (local) **[mock A] [mock B]**: the pin's pinned and unpinned labels in
  R's `shared/kit.js` do not give the same facts in RU and EN. RU has
  `home`/`homeOn` «Стартовый раздел» / «Стартовый», EN has "Start section" /
  "Start section", so EN shows no change when the pin is set. The shipped
  pair is `homeHint`/`homeOn` ("Open this section on start" / "Opens on
  start"). Every mock with a page head shows the pin (2, 3, 5, 6). Use one
  pair with the same facts in both languages, for example «Открывать при
  запуске» / "Open on start" and «Открывается при запуске» / "Opens on start".
- N5 (local) **[mock A]**: `mocks/2/` does not show the mode chip with the
  longest supplement names at 360. Draw «Предметы сообществ», "Wondrous
  Environments" and "Many Worlds Tavern" on the chip, in RU and EN.
- N6 (local) **[mock A] [mock B]**: R draws no lit state for the account
  control, and A37 lights it on `/account`, `/lists`, `/lists/<uuid>` and
  `/homebrew`. In `list-note__1180__ru.png` the «G ˅» control looks the same
  as off its pages. Draw the lit state in `mocks/2/`. Unit B's headers in
  `mocks/6`, `8` and `9` use it.
- N7 (local) **[mock A]**: the mocks render Source Sans Pro TTFs
  (`shared/base.css`, `C:\Users\Ignat\.dhloot\notes\57\fonts\SourceSansPro-*`),
  not Source Sans 3. `mocks/1/index.html` names the face that renders the
  specimen and the share cards. Step 9h then compares against that face. The
  Q1 download (owner yes, 2026-10-29) can also give the mock its Source Sans
  3 face.
- N8 (local): the rule 4 departure rewrite in batch 2 names only «Альт.
  таблицы». The «Бросок» job also names a group of nine pages and has no
  page heading of its own. Add «Бросок» to the rewritten departure.
- N9 (local): E7 and N3 are placed in batches 1-10, but only batches 1 and 10
  have an acceptance line for them (`CLAUDE.md`: a placed item is its own
  acceptance line). Add to "Each of batches 2-9": "no detector finding in a
  file this batch touches, except the N3 advisories that batch 10 records".
- N10 (local): section 4, "The empty-state pattern ... C16, C59 (applied in
  7)". C59 is the search-match highlight, not an empty state. C60 is probably
  the row meant.
- N11 (local): the clarity inventory rows are placed by name only for the
  editor (6) and the list page (9). Name the others where they go: account
  (settings scope sentence, notify question, «Выйти везде» note) to 7,
  «ЛИНЕЙКА» on `/tables` to 3, the `/h/` signed-out box to 4. They are drawn
  in unit A's folders 3, 4 and 7.
- N12 (local): the gate table does not count the golden re-seed. Batch 2
  re-seeds every golden (the header and P7's `footSummary`). Add "takes CI's
  golden text (CI credit)" or the shard cost (4 x 3-4 min).
- N13 (local): section 10 step 9e reads `cd tools/artwork && npm ci`. A `cd`
  moves the session's working directory. Write `npm ci --prefix tools/artwork`.
- N14 (deferred-scope): section 7 "Batch 10" puts E5, E6, E8 and E9 in
  DESIGN.md "Notes", and DESIGN.md has no "Notes" section today. These four
  are repository and tooling exceptions. `CLAUDE.md` routes tooling facts to
  `.claude/README.md`, and `document` regenerates `design.json` from
  DESIGN.md. Keep the detector exceptions (owner) in DESIGN.md "Notes", and
  put the kept repository exceptions in `.claude/README.md`. The owner's Q4
  answer says "listed as kept exceptions (batch 10)" and names no home, so
  this does not conflict with it.
- N15 (local): section 7 "Batch 10", the first line, says the detector
  "reports nothing; any finding left is fixed, or recorded in DESIGN.md
  'Notes'". A finding recorded in "Notes" still shows in the report. Write:
  intended literals become DESIGN.md frontmatter entries. Today 32 of
  `PrintCard`'s 33 advisories are print colours (`#000`, `#fff`, the Figma
  golds), and one is `2.4cqw` (a radius). A finding that is neither fixed nor
  documented is named to the owner as a kept exception.
- N16 (local): section 11 item 1 does not mention 3x, and it leaves out the
  card cap of 100 (rule 1: «2 карты из 100»). Add both. Each batch's States
  table covers the limit, one past it and 3x.
- N17 (local): the D116 line in section 6 does not say that the DEBT.md
  section "Tool UI redesign" goes with it. Batch 8 removes the last entry,
  because D121 leaves in batch 2.

## Deviations

- Batch 9 is old 9a + 10. Accepted: `SharedListPage.svelte` imports 15
  components, and 10 of them are in `ListPage.svelte`'s imports (checked).
  `ListsPage.svelte` shares only generic ones.
- Pin and «Справка» labels moved to batch 2. Accepted: `PageHead` and
  `HelpButton` are shared chrome, and R draws both under the H1. See N4 for
  the labels.
- Icon-and-label centre rule moved to batch 1. Accepted for `Seg` only (R4).
- Share card EN subtitle "armor" in batch 1. Accepted. It agrees with the
  owner's Q3 answer, and the UI has no "armour" today (`dict.ts` checked).
  The decision file follows in batch 2 (B3); the card change does not wait
  for it.

## Standing checks

1. Scale: checked - section 11 item 1, batch 1's States table, R
   `header__360__ru.png` (the brand row and the job row are about 107 px,
   under 112). The seven-item supplements menu fits at 360. Missing: 3x and
   the card cap (N16), the longest supplement name on the mode chip (N5), and
   A1 at 768 (R2). Each batch's States table waits for its refresh, which is
   acceptable for outlines.
2. Error scenarios: checked - section 11 item 2, batch 1 item 2, D121. No
   write path is added. The «Бросок» memory is per tab. The font failure,
   offline, stale tab and revert cases are answered. No loss is left unnamed.
   The account menu counts in R would add two reads with no failure state
   (R3). Batch 9's note switch must say that a pending edit is saved before
   the switch shows the other note (batch 9 refresh). The spelling sweep
   (B3) changes no stored data and no stored key.
3. Consistency: checked - `FEATURES.md` "Consistency rules" 1, 4, 9 and 11
   to 20, and "Chrome" (account menu order, the no-lit-tab bullet). Named
   departures: «Альт. таблицы» and the interim gold. Missing: «Бросок» as a
   group name (N8), the menu counts against rule 1 (R3), and the start
   section against «Бросок» (R7). The spelling rule against `CONTRACTS.md`
   section 4 (frozen schema wording) and against `CLAUDE.md` "Maintaining
   this file" is not named (B3).
4. RU/EN parity: checked - R's `shared/kit.js` strings, the EN 360 mock
   `shell-signed-out__360__en.png`, the P7 strings (`footSummary`,
   `printColor`, and the files that quote them), the EN head descriptions in
   `tools/build-share-pages.js` and `tools/build-pages.js`. Defects: the
   pinned and unpinned labels give different facts in RU and EN (N4), and the
   plan's P7 list misses the EN link-preview descriptions (B3). RU text does
   not change with the spelling rule. The new mocks render both languages for
   every state (section 9).

Owner rules: checked - `context.md` "Decisions already settled", "Owner
directions" and "Plan refresh answers":
- Planned in a batch with a home: the Clarity Rule (DESIGN.md, batch 1), the
  EN wordmark, the mode row, the job icons and the two-line chip at 360
  (batch 2, `FEATURES.md` "Chrome" and DESIGN.md), the font dependency and
  the bundle budget (batch 1, the 2026-10-22 decision already allows the
  raise), the share cards with Q1 and Q2 (batch 1, `docs/artwork.md`),
  DESIGN.md per batch (the section 4 table), the batch merges (section 7,
  with the evidence), mocks first (section 9), Q4 (batch 10, but see B1).
- Already in place: the ESLint mock ignore (`eslint.config.mjs:27`).
- Missing: the "reuse Impeccable" direction has no acceptance line (R5). Q3's
  decision file and `I18N.md` rule (batch 2), and its `llms.txt`, docs and
  AI-file scope (B3), are not in the plan.

None of these rules is written yet, so no budget applies. Their homes are
planned, except Q3's.

## Suggested next action

The planner applies B1, B2, B3, R1-R8 and the local nits to `plan.md`, with
no second review. The orchestrator names three questions to the owner:
- B1: E5 kept, against the Q4 answer;
- B3: the spelling exceptions (the frozen schemas, identifiers, comments,
  hooks), and 2b against "all in batch 2";
- R3 and R7, at mock 2.

Before the owner sees any mock, the orchestrator sends the mock-affecting
findings to the two mock units:
- unit A: B3 ("Color" in `mocks/7/`), R3, R5, N4, N5, N6, N7, N11;
- unit B: B2 (the drag state), R2 (768 px), R5, N4, N6.

R9 is a process line for the orchestrator. Batch 1 then follows with its mock
step. Q1 is answered, so step 9 is no longer blocked.

## Checks still needed

- `npx prettier --file-info` on the three E3 paths after the removal (batch 1).
- That Adobe's `source-sans` release 3.052R holds `TTF/SourceSans3-Regular.ttf`
  and `SourceSans3-Semibold.ttf` (Q1). Not checked: no network read in this
  review.
- `impeccable detect --no-config` on `ListPage.svelte` after the drop-mark
  redraw (batch 9, B2).
- Whether the hook rewrites `.impeccable/config.json` outside `ignore-value`
  (batch 9, R8).
- Whether `check:fast` selects the hook selftest for a change under
  `.claude/prompts/`, `skills/` or `agents/` (2b gate cost, B3).
