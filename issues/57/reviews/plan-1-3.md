# Review - plan before 1 (57)

Verdict: fix-then-continue
Reviewed: dae889dc00a449578f93e7f66b2445e07f8d69e4
Scope: plan before 1

<!-- Second look at the plan after reviews/plan-1-2.md (Reviewed deaa7989):
the plan review pass 69cc77e4, then the mock answers (9aed6514) and the print
answers (dae889dc). The "Print review" answer of context.md is not in the plan
yet; a separate planner adds its batch after 1b, so its absence is not a
finding here. -->

Read: `CLAUDE.md`, `.claude/prompts/review.prompt.md`, `context.md` (Mock
answers, Print answers, First-screen rule, Plan review answers, Print review),
`plan.md` (whole), `handoff.md` against `.claude/templates/handoff.template.md`,
`reviews/plan-1-2.md`, `git diff deaa7989 dae889dc -- plan.md handoff.md` (the
removed lines of both passes), `.claude/hooks/agent-guard.mjs`,
`tools/check/lib.mjs` and `tools/check/fast.mjs`, `tests/run-all.js`,
`.claude/README.md` ("The fast pre-check", the hook table, the stage timings),
`orchestrate.prompt.md` "When to run reviewer", `CONTRACTS.md` section 5,
`META.md` sections 2 and 9, `FEATURES.md` "Records", "Print" and "Consistency
rules", `preview/worker.mjs` (`siteCtx`, `homebrewImage`, `homebrewCtx`),
`tools/share-card.mjs` (`cardHead`), `tools/build-share-pages.js` (`pageCtx`),
`tests/derived.js` (`COUNTERS`, `COUNT_BEARING_FILES`), `PrintCard.svelte`,
`card-vectors.css`, `tokens.css`, `tests/app/inventory.js` (the states that
section 14 names), `app/src/App.svelte` (the page components), and the mock CSS
under `issues/57/mocks/`. Ran `git grep -n "_none"` over the tree,
`file og/_none.jpg og/_share.jpg`, a count of `img/*.webp`, and `git grep` for
British forms inside and outside the plan's word list.

Finding (1): every finding of `plan-1-2.md` (B1-B3, R1-R9, N1-N17) has its
change in the section the Status line names. The removed lines of both passes
are the owner's answers replacing the old questions and the old ground
decision; nothing else moved. Two stale remnants are N1 below.

## Blockers

B1. Batch 1b does not name four readers of the placeholder, one of them a count gate. (local)
- Where: section 7, "Batch 1b", the "Docs in the same commit", "Tests that
  pin" and "Gates" lines; section 8, row 1b.
- Defect: `git grep -n "_none"` finds readers that the plan does not list:
  - `README.md:298` "1193 pictures" and `README.ru.md:308` «1193 картинки».
    `tests/derived.js` counts `img/*.webp` into `N.art`, `_none.webp`
    included (its comment at line 1307 says so), and the `картин` counter
    checks `README.ru.md` against it. The deletion makes the count 1192, so
    `derived` fails until both READMEs change (`CLAUDE.md`, "Data and
    published artefacts": update the `COUNT_BEARING_FILES` files when a count
    changes).
  - `docs/specs/COVERAGE.md`: the `app/states` row ("shows
    `img/thumb/_none.webp` after the abort") and the
    `components/printPage.test.ts` row ("`img/_none.webp` for no picture on
    both sheets and for a broken image").
  - `tests/app/inventory.js:3519`, the `why` of `#/p/set-longsrc1 as gm2`
    ("the art block draws img/_none.webp"), and the header line of its golden
    `tests/app/snapshots/_p_set_longsrc1_as_gm2.txt`.
  - `tools/artwork/lib.mjs:315` (a comment that cites `_none.webp` as a legal
    ingest outcome) besides the line 132 that the plan names.
  - The 1b gates run no `derived` suite and no `app/states`, although 1b
    edits `tests/derived.js` (`wantImg`) and `tests/app/states.js`, and
    `check:fast` runs neither (`tools/check/fast.mjs`: format, typecheck,
    `test:golden`, related vitest, budget). Lint does not run either, and 1b
    edits `.mjs` and `.js` files.
- Change: add to batch 1b: the README pair (`1193` to `1192`, both
  languages, the same commit) and the `tests/derived.js` comment; the two
  `COVERAGE.md` rows; the inventory `why` with the golden re-seeded (take CI's
  golden text or the shard); the `lib.mjs:315` comment. Set the 1b gates to
  `node tests/run-all.js app/print,app/states,contracts,dataint,derived,stub`,
  `npm run check:built`, `npm run lint:untyped`, `npm run lint:typed`, `node
  --test preview/worker.test.mjs tools/check-site.test.mjs
  tools/artwork/lib.test.mjs`. Add about 5 min to section 8, row 1b.

B2. The no-picture link card names a 1200x630 picture with the 640x640 meta. (local)
- Where: section 7, "Batch 1b", the "Link cards of a record with no picture"
  line.
- Defect: `cardHead` (`tools/share-card.mjs:455`) writes
  `og:image:width`/`height` 1200x630 and `twitter:card summary_large_image`
  only when `ctx.large` is true; otherwise it writes 640x640 and `summary`.
  `homebrewCtx` sets no `large`, so the plan's change gives
  `og/_share.jpg` (1200x630, checked with `file`) the 640x640 meta and the
  small card. The plan's own reason ("a messenger needs an image to draw a
  large card") then does not hold. `homebrewImage(env, img)` also has no
  language, and the card must pick `_share.jpg` or `_share_en.jpg`.
  `pageCtx` in `tools/build-share-pages.js` has the same gap for a future
  catalog record with `img: ''` (`add-source` allows one).
- Change: in `preview/worker.mjs`, a homebrew card with no picture takes
  `img: sitePicture(env, lang)`, no `imgSrc` and `large: true` (the existing
  `siteCtx` pattern; pass `lang` to `homebrewImage`). In `pageCtx`, `!it.img`
  gives `og/_share.jpg` or `og/_share_en.jpg` and `large: true`; `wantImg` in
  `tests/derived.js` follows. Add `worker.test.mjs` asserts for
  `og:image:width` 1200, `og:image:height` 630 and `twitter:card`
  `summary_large_image` in RU and EN. Update the two `META.md` rows (line 57
  and 59, "`og/_none.jpg`") to "the site picture of its language".

B3. The batch 2 gates name a selftest that `check:fast` does not run, and miss the commit gate for `tests/db/`. (local)
- Where: section 7, "Batch 2", the "Code comments, test titles and
  `.claude/hooks/*.mjs`" line; section 8, row 2.
- Defect:
  - The plan says "`node .claude/hooks/selftest.mjs` runs in `check:fast`
    when `.claude/` changes". It does not: `check:fast` runs `format`,
    `typecheck`, `test:golden`, related vitest and the budget only. The
    selftest is a `npm run check` stage (selector `HOOKS`), so CI runs it.
    Section 8 counts it twice inside `check:fast` (8-18 min).
  - The sweep respells code comments everywhere (owner, B3). Three of them
    are under `tests/db/` ("serialises" in `import-homebrew.test.mjs:51`,
    `import-lists.test.mjs:40`, `list-writes.test.mjs:63`). Rule 2m of
    `bash-guard.mjs` denies a commit that stages `tests/db/**` without a
    passing `npm run check:db` for the tree key (`CLAUDE.md`, "Quality
    gates": on Windows through the PowerShell tool; 752 s cold,
    `.claude/README.md`). The plan names neither the path nor the gate, so
    the batch 2 commit is refused.
  - `tests/derived.js` checks the README licence line (line 1612) and the
    heads that `tools/build-share-pages.js` writes, but the batch 2 gates
    run `contracts,dataint` without `derived`.
- Change: in batch 2, replace the selftest sentence with: "`node
  .claude/hooks/selftest.mjs` runs once on its own after the hook edits
  (434-563 s on this host; past 600 s it runs in the background); CI runs it
  again". Add `tests/db/` to the file set and `npm run check:db` (PowerShell,
  about 13 min, stop the stack and Rancher before `check:fast`) to the gates.
  Alternative: keep the three `tests/db/` comments as kept forms with this
  reason, named in the decision file (the owner's yes, because the owner's
  keep list has no cost reason). Recommended: run `check:db`, because the
  owner asked for the minimum of British forms. Add `derived` to the batch 2
  suite list. Recompute section 8, row 2: the selftest once (7-9.5), plus
  `check:db` (13), in place of 8-18.

## Risks

R1. The light print well step cannot be run as written, and it omits the node's own no-picture design. (local) **[mock 1b]**
- Where: section 7, "Batch 1b", the "The print well is light" line; section
  9, "Mock 1b".
- Defect:
  - `FEATURES.md` "Print" says that the colour node `714-42387` draws "an
    outline per kind" for a card with no picture, which `_none.webp` replaced
    (owner, 2026-10-15). The plan does not name that design. The owner's
    "check it against the Figma colour node" can only be done against it, and
    `CLAUDE.md` says "Export vectors; do not redraw them".
  - "Read its paper and ink fills through the Figma export": the repository
    has no Figma export tool or procedure (`git grep -i figma` in `tools/`,
    `.claude/README.md`, `docs/artwork.md` finds none). An implementer may
    have no Figma access.
  - "Use those values in `card-vectors.css` paint tokens": that file's
    header limits it to "the paints of the print card's folded vectors",
    each value copied from an exported `card/*.svg`. The card's paper
    (`.pcard` `background: #fff`) and ink (`color: #000`) are literals in
    `PrintCard.svelte`, ported from the node.
  - "The well takes the print tone" in `printPage.test.ts`: that file reads
    no computed style, and jsdom does not resolve `var()`. Only the real
    browser (`tests/app/print.js`, 37 `getComputedStyle` reads) can prove it.
  - "On the colour print card only ... the screen keeps the dark well" can be
    read as `@media print` only. The `/p/` sheet and the editor's print
    preview show the print card on screen.
- Change: in mock 1b, show the node's no-picture art area (the per-kind
  outline) beside the glyph on the light well. The mock step (the orchestrator
  or the mock unit, with Figma access) reads the two values and writes them
  into the 1b line before the implementer starts; the implementer does not
  read Figma. If the owner prefers the node's outlines, they are exported,
  not redrawn. Put the values in `PrintCard.svelte`: it overrides the well
  and glyph custom properties in `.pcard:not(.bw) .pc-art`, `ArtWell`
  unchanged. Move the tone assertion to `tests/app/print.js`; keep the "no
  `<img>`, the glyph" case in `printPage.test.ts`. Say that the `/p/` sheet
  and the print preview draw the light well too, because they show what
  prints. Update `FEATURES.md` "Print" (lines 2258-2265) and the
  `PrintCard.svelte:120` comment in the same commit.

R2. The first-screen check misses roll pages that the tests cannot seed, and the assertion has no margin. (local)
- Where: section 14, "The check" and the measured table; section 10, the
  "First-Screen check" file line and step 10a.
- Defect:
  - No `RollPage` exists. `App.svelte` mounts `StdPanel`, `AltPanel` and
    `RollPanel` for the roll routes. The plan says "eleven primary elements"
    but names twelve components.
  - No "rolled `/roll/std`" inventory state exists. A roll is random and
    "cannot be compared by its result" (`inventory.js`, the
    `#/roll/wondrous ~ stepped` comment), so it cannot become a golden state.
  - Three estimates are at the limit: roller 360 254/256, list 360 256/256,
    shared-player 1180 287/288. The mocks render Source Sans Pro (N7 of
    `plan-1-2.md`) and the app ships Source Sans 3 Variable, so the line
    boxes differ. A hard `<= 0.4 * innerHeight` then fails by a few pixels,
    or a batch shrinks a gap to pass.
  - "At scroll 0" is a precondition with no step. A roll or a focus move can
    scroll the page. "The first `[data-primary]` with a nonzero height" also
    has no rule for zero matches (a load failure would pass by default).
  - Scale: the table measures the default states only. A route whose H1 is a
    user's name (`/lists/<uuid>`, `/s/<token>`, `/homebrew/<id>`; names reach
    80-120 characters, `FEATURES.md`) moves the first entry down by one line
    per wrap at 360. The list estimate is already 256.
- Change: name the real components (`StdPanel`, `AltPanel`, `RollPanel`) and
  the true count. On a roll route the case sets a value in the number field
  (deterministic) instead of a roll; no new inventory state. Set a design
  target of 240 px at 640 and 270 px at 720 for every section 14 fix, and
  keep the assertion at 0.4. The roller, the list page and the shared page
  re-fold to that target at their mock. The case calls `scrollTo(0, 0)` and
  waits two frames before it reads; zero `[data-primary]` matches fail with
  the route name. Add one row per route with a user-named H1 at its
  longest-name state (for example `#/homebrew/sets ~ long name as gm4`); its
  batch meets the rule there or names the exception (for example an H1
  clamped to two lines) to the owner.

R3. Section 14 fixes put one control in a different place on each sibling page, and two fixes conflict with settled rules. (local) **[mock A] [mock B]**
- Where: section 14, the rows for mock 3, 6, 8 and 9; section 7, "Batch 2"
  (the «Справка» label) and batches 3 and 5 (Q3.1, Q5.1).
- Defect:
  - «Выбрать» goes into «Ещё» on the catalog at 360, stays on a row with
    «Новый предмет» and «Фильтры» on `/homebrew`, shares a line with the
    count on `/lists`, and shares a row with «Копия в мои списки» on `/s/`.
    The search sits on a row on the catalog and inside the filter sheet on
    `/homebrew`. The plan names no reason for the differences.
  - The catalog fix puts "the view switch" into «Ещё». The owner's Q3.2
    answer says that the choice "lives in its own control for the visit",
    and the batch 3 DESIGN.md rule says "A temporary choice lives where it is
    made".
  - Rule 1 ("Counters", `FEATURES.md`): a count of a limited collection is in
    one place, at the head of that collection. The `/homebrew` fix shows the
    tab count in the H1 picker («Предметы 9 ▾») and moves "the count to the
    group head", which is a section, not the collection. The plan names no
    rule 1 departure.
  - Batch 2 labels the «?» control «Справка» / "Help" on every page.
    Batches 3 and 5 rename the panels «Об этих данных» and «Где какая
    редкость». Rule 4 ("One name") and the Same Label Rule then give the
    button and the panel two names.
- Change: in section 14, give one place for «Выбрать» and for the search on
  every list surface (catalog, `/homebrew`, `/lists`, `/lists/<uuid>`, `/s/`)
  at each width, or name each departure with its reason. Keep the view switch
  as its own control (for example in the section head beside the count).
  Name the rule 1 departure for the `/homebrew` count, or keep one count.
  The button that opens a renamed panel takes the panel's name (C1, C38); the
  label «Справка» stays only where the panel keeps that name. Each change
  goes to the folder that owns the pattern (R9): `mocks/3/` for the row and
  the selection mode, then the dependent unit B states.

R4. The spelling word list misses forms that the tree holds, and decides nothing on "cancelled". (local)
- Where: section 7, "Batch 2", the word list and its acceptance line.
- Defect: outside `issues/`, `schema/`, goldens, decisions and `data.js`, the
  tree holds `sanitiser`/`sanitised` (hooks, `.claude/README.md`),
  `tokenises`, `capitalised`/`capitalises` (`I18N.md`, `FEATURES.md`,
  `COVERAGE.md`, `tests/derived.js`, `tools/desc-style.mjs`),
  `italicises` (a `desc-style.test.mjs` title), `millimetre(s)`
  (`PrintPage.svelte`, `COVERAGE.md`, `tests/app/print.js`) and `defence`
  (`app.svelte.ts`, `preview/worker.mjs`, `.claude/README.md`). None is in
  the list, so the acceptance grep passes with them in place. About 50
  lines say `cancelled`; some are API values that must stay (GitHub
  Actions' `cancelled()` and `'cancelled'` in `ci.yml` and `backup.yml`)
  and one is an identifier (`cancelledOrder` in `tests/app/states.js`).
  "Smouldering" is fixture data that `llms.txt` quotes (it stays). The two
  `package-lock.json` files of `preview/` and `tools/artwork/` hold
  third-party "licence" metadata.
- Change: add `sanitis|tokenis|capitalis|italicis|millimetre|defence` to the
  word list. In the decision file, keep `cancelled` everywhere (an accepted
  American form and GitHub's API value), so `.github/workflows/` does not
  change; keep `smoulder` as fixture data; keep the lock files and the
  third-party licence texts as generated or quoted.

R5. The agent guard does not read this report's file name. (process; deferred-scope for the naming rule)
- Where: `issues/57/reviews/`; `agent-guard.mjs`, `planReview`.
- Defect: the guard matches `^plan-1(?:-(\d+))?\.md$`. It reads
  `plan-1.md` and `plan-1-2.md`, not `plan-1-2-2.md`. Its newest report is
  `plan-1-2.md` (fix-then-continue, applied in Status), so it allows a batch
  1 dispatch whatever this look says. `review.prompt.md` ("a second look:
  `<name>-2.md`") gives this name, so the prompt and the guard disagree for a
  third look.
- Change: the orchestrator saves this text as `reviews/plan-1-3.md` as well
  (the guard's next number), and the planner's Status line names
  `reviews/plan-1-3.md`. Deferred: align `review.prompt.md`'s naming with the
  guard (`plan-<batch>-<n>.md`, the next n), a prompt change with its own
  review.

## Nits

- N1 (local): stale question text. Section 1, theme 4: "(owner question at
  mock 2, R7)". Section 7, "Batch 2": the «Бросок» line ("Owner question at
  mock 2 ... Alternative: ... The batch ships the owner's answer") and the
  account menu line ("Owner question at mock 2; recommended: no counts. If
  the owner wants them ..."). R3 and R7 are answered (section 13); state the
  answer only.
- N2 (local): batch 1 has no acceptance line for the page ground. Add:
  "`tokens.css` `body` draws `linear-gradient(180deg, var(--bg2) 0, var(--bg)
  520px)` over `var(--bg)`; `app/src` holds no `radial-gradient` for the
  ground; DESIGN.md "Overview" and "Neutral" say so". Name the attachment:
  today `fixed`, and `mocks/1/ua.css` sets none (scroll).
- N3 (local): the 1b contract set (review prompt, section H). State in the 1b
  line: `docs/fixtures/`, `tests/contracts.js` and `llms.txt` hold no
  `_none` path, so no change; the commit says so.
- N4 (local): 1b error scenarios. A stale tab's old bundle still asks for
  `img/_none.webp`: the worker's image cache answers it if it holds a copy,
  else a 404 and the browser's broken-image mark until a reload. A revert
  brings the three files back with the code. Add both to the 1b line.
- N5 (local): handoff format. "Pushed: the orchestrator records the sha of
  this pass" and "Review: a second plan-review look ..." do not follow the
  template values (`no | yes at <sha>`; `required (trigger: <which>),
  report ...`).
- N6 (local): `measure.mjs` lives in one session's scratchpad (handoff,
  Notes), and every later mock step must re-measure (section 14). Copy it to
  `issues/57/mocks/` now; the closeout deletes it with the task directory.
- N7 (local) **[mock A] [mock B]**: section 14 names the new labels in
  Russian only («Настроить бросок», «Вид: все ▾», «Настройки листа ▾»,
  «Заметка для игроков ▾»). Each mock's `index.html` gives the EN pair with
  the same facts.

## Deviations

- Black-and-white keeps no art block, so no glyph (handoff). Accepted:
  `PrintCard.svelte` draws `.pc-art` only under `{#if !bw}`, and the owner
  answered Q1b.1.
- The H1 becomes a picker of the sibling tables or tabs at 360 (catalog,
  `/homebrew`). Accepted as a mock proposal; the owner sees it at mocks 3 and
  6. See R3 for the control placement and the counts.
- The roller hides its H1 visually at 360. Accepted with the rule 4 reason
  given; the estimate is at the limit, see R2.
- Batch 1b split from batch 1. Accepted: a public contract change is a split
  criterion (`CLAUDE.md`, "Task and session protocol"), and it has its own
  gates and review.

## Standing checks

1. Scale: checked - section 11 item 1, section 14 (each mock at 360x640 and
   1180x720, RU and EN), the 1b States line (nine and sixteen per sheet, the
   editor preview, the link card in RU and EN). Missing: the first-screen
   rule at a user-named H1's longest name (R2); three estimates with no
   margin (R2).
2. Error scenarios: checked - section 11 item 2 and the 1b Risk line (a
   messenger's cached `og/_none.jpg` answers 404, a re-share fetches the new
   card). 1b deletes files and changes no stored data and no stored key; the
   first-screen rule and the ground add no write path. Missing: the stale tab
   and the revert for 1b (N4). No loss is left unnamed.
3. Consistency: checked - `FEATURES.md` "Consistency rules" 1, 4 and 9, the
   sibling list surfaces in section 14, the batch 3 rule "A temporary choice
   lives where it is made", and the Q3.2 answer. Defects: R3 (one control in
   four places, the view switch in a menu, a second count place, the
   «Справка» label against the renamed panels).
4. RU/EN parity: checked - the 1b link card (RU `og/_share.jpg`, EN
   `og/_share_en.jpg`), the renamed panels (C1 «Об этих данных» / "About this
   data", C38 «Где какая редкость» / "Where each rarity is"), the pin pair
   in section 9, the first-screen offsets in both languages. Defects: the
   new section 14 labels are RU only (N7). The glyph and the light well
   carry no text.

Owner rules: checked - `context.md` "Mock answers", "Print answers",
"First-screen rule", "Plan review answers":
- Planned with a home: the glyph everywhere and the three files deleted
  (batch 1b, the specs it names; `COVERAGE.md` missing, B1); the linear
  ground (batch 1, DESIGN.md "Overview" and "Neutral", the share cards; no
  acceptance line, N2); C1 and C38 renamed (batches 3 and 5); Q1.1 (batch 1
  step 9); black-and-white kept and the light colour well (batch 1b, R1);
  the First-Screen Rule (DESIGN.md "Layout", batch 1, and the
  `tests/app/states.js` case, R2); B1 and B3 of the plan review (sections 5
  and 7).
- Not flagged on purpose: "Print review" (a separate planner adds its batch
  after 1b). Section 2 "Not in scope" (print layouts), section 12 "Deferred"
  (a print font change), the handoff's Deferred and the `context.md`
  Constraints line about print layouts predate it; that planner updates them.
- None of these rules is written yet, so no budget applies.

## Suggested next action

1. The orchestrator copies this report to `reviews/plan-1-3.md` (R5), so
   that `agent-guard.mjs` reads it.
2. The planner applies B1-B3, R1-R4 and N1-N7 once, with no second look,
   and adds `- Plan review findings applied: reviews/plan-1-3.md` (or
   `plan-1-2-2.md` if the orchestrator keeps the name and checks the gate by
   hand) with one sub-bullet per finding.
3. Before the owner sees the mocks again: unit A takes R1 (mock 1b, the
   node's no-picture outline beside the glyph), R2 (the 240/270 px target for
   mocks 3, 5 and 7) and R3 (mock 3: one place for «Выбрать», the search and
   the view switch); unit B takes R2 (mocks 6, 8, 9) and R3 (mock 6: the
   count). N6 first, so both units can re-measure.
4. The orchestrator commits `issues/57/mocks/` (the batch folders are
   untracked at `dae889dc`) before batch 1 is dispatched, because batch 1
   reads `mocks/1/`.
5. Then batch 1 follows its mock step (mock 1 is approved).

## Checks still needed

- Whether the host that draws mock 1b can read the Figma node `714-42387`
  (R1). Not checked: no Figma access in this review.
- The 1b link card in Telegram after the deploy: a `/h/` item with no
  picture draws the large site card (the `META.md` probe table, line 57).
- `node tests/derived.js` after the README count change (B1).
- `npm run check:db` passes with the three respelled `tests/db/` comments
  (B3).
- The real Source Sans 3 offsets of the routes at the limit, from the batch
  1 log of the first-screen case (R2).
