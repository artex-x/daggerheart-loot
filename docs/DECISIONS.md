# Decisions

The register of decisions that outlive the task that made them, each with
the alternatives rejected and the reason. Behaviour decisions live in
`docs/specs/`; hook and tooling decisions in `.claude/README.md`,
"Candidates considered"; everything else lands here. Newest first. An entry
is superseded in place with a `Superseded by` line, never deleted; an entry
is at most fifteen lines; a superseded entry folds to its first line.

Within one task, entries run in the order the task settled them, oldest
first. The fifteen-line cap counts body lines only - the `##` heading and
the blank lines around it are free. Past ~400 lines, fold every superseded
entry to its first line before adding another.

## 2026-09-22 - The shared page's top control saves a copy; the selection bar alone adds to a list

- Task: `58`.
- Decision: the shared list page's top control is a plain gold "Сохранить
  себе" / "Save to my lists" button, no caret, always drawn whatever the
  selection. One press creates a new own list from the whole shared list -
  ids, both notes, entry meta and money mode - and opens it. Pouring the
  list into an existing list stays possible as select-all plus the
  selection bar's "Добавить в список" chip, now the only add-to-list menu.
- Rejected: relabelling the menu "Сохранить список" / "Save list", caret
  kept - two gold caret buttons with near-identical menus still read alike;
  hiding the top control while a selection exists - it would jump under the
  reader's thumb and keep the bar's own label while shown. Labels
  "Сохранить копию" / "Save a copy" - the bar already holds "Скопировать"; and
  "Клонировать список" / "Clone list" - developer jargon in Russian UI.
- Evidence: issue 58's screenshot, two identical gold "+ Добавить в список"
  buttons on screen at once with rows ticked.

## 2026-09-19 - A reorder is announced through a permanently mounted live region, not the shared toast

- Task: `dnd4` (find the commit with `git log --grep=dnd4`).
- Decision: `ListPage.svelte` mounts `<div class="lsaid" role="status"
  aria-live="polite">{said}</div>` beside `.lrows`, always present and empty
  until a move succeeds. Both movers (`setPos`, the drag port's `onDrop`)
  call one function that fills it, guarded by `store.move()`'s own return
  value - it already answers "did anything move" - so a drop or a typed
  position that changes nothing stays silent, with no new predicate. The
  Russian and English strings name the record and its new position out of
  the list's own length (`%s`, `%n`, `%m`), with no participle: a participle
  would have to agree with the record's gender, which the dictionary cannot
  know (`docs/specs/I18N.md`, "Rules").
- Rejected: the existing toast (`app.say`) - one shared slot with one timer
  would silently drop a pending undo prompt, and puts a visible pill on
  screen for a change the sighted reader already watched happen; rendering
  the region only while it holds text - the half-mounted region is the
  unreliable half of this pattern, and it would also keep every list-page
  golden blind to the fix; a region in `Shell`, shared app-wide - adds the
  node to all 110 goldens for one page's need; announcing a rejected
  out-of-range typed position too - the human approved "announce a reorder",
  and a rejected entry is not one (recorded in `issues/dnd4/handoff.md`,
  Deferred, at the time this shipped).
- Evidence: `page.accessibility.snapshot()` keeps an empty `role="status"`
  element as `status ""`, so the region's mount re-seeds every list-page
  golden (`_lists_a*.txt`, `_lists_b.txt`, `_l_own_list.txt`) - read at
  closeout, not assumed.

## 2026-09-19 - The drop-gap mark is made instant by narrowing `.row`'s transition, not by overriding the drop classes

- Task: `dnd4` (find the commit with `git log --grep=dnd4`).
- Decision: `.row`'s shorthand `transition: 0.15s` (which includes
  `box-shadow`, the mark's own property) is narrowed to `border-color 0.15s,
  opacity 0.15s`, keeping the hover border and the dragged row's fade;
  `.rnote`'s own `transition: box-shadow 0.15s` (added by TASK `dnd3` to
  match the base half's onset) is deleted outright, since removing the fade
  from the base half alone would otherwise reintroduce `dnd3`'s exact
  stagger, inverted. `dnd3`'s own commit wrote no `docs/DECISIONS.md` entry,
  so nothing here is superseded in place - this entry is the only record of
  `.rnote`'s transition history.
- Rejected: overriding the duration on `.lrow.drop-before`/`.lrow.drop-after`
  (`transition-duration: 0s`) and leaving `.row`'s shorthand alone - a
  transition is computed off the style being transitioned *to*, so leaving
  the drop class puts the element back under `.row`'s 0.15s and the mark
  fades on exit instead of on entry, the same defect moved rather than fixed.
- Evidence: measured against `dist/` built at `919d3a2` and again after this
  fix - before: `.lrow` computed `transitionProperty: 'all'`, `.rnote`
  `'box-shadow'` at `'0.15s'`; after: `.lrow` `'border-color, opacity'`,
  `.rnote` defaults to `'all'` at `'0s'` (the CSS initial value for an
  element with no declared transition - a property read cannot tell that
  apart from `dnd3`'s old shorthand, which is why `tests/app/states.js` case
  17 reads `.rnote`'s duration instead).

## 2026-09-19 - The drag grip is hidden by an `any-hover`/`any-pointer` capability query, not `hover`/`pointer`

- Task: `dnd4` (find the commit with `git log --grep=dnd4`).
- Decision: `@media (any-hover: none) and (any-pointer: coarse) { .lrow-grip {
  display: none; } }` in `ListPage.svelte`. HTML5 drag never fires from a
  touch, so the grip is an inert affordance on a device whose every pointer
  is coarse and cannot hover. `any-hover`/`any-pointer` ask whether *any*
  available device can hover/is fine, not only the primary one, so a
  touchscreen laptop or a tablet with a paired mouse keeps the grip - the
  false positive `hover`/`pointer` alone would produce.
- Rejected: `(hover: none)` or `(pointer: coarse)` alone - both describe only
  the primary input and would hide the grip on a touchscreen laptop where a
  mouse drags it fine; a script feature test (`'draggable' in
  document.createElement('div')` is true in mobile Chrome, `'ontouchstart' in
  window` is true on a touchscreen laptop) - neither is honest, and either
  would put a browser-capability check into a component, past
  `app/src/ports/`; hiding on a width - a 390px viewport with no touch still
  reports `hover: hover`, so width never correlates with the defect.
- Evidence: `page.emulateMediaFeatures` refuses `hover`/`pointer` outright;
  only `page.setViewport({ isMobile: true, hasTouch: true })` moves
  `any-hover`/`any-pointer` (`docs/specs/COVERAGE.md`, "two harness facts a
  device-capability case runs into").

## 2026-09-19 - A drop indicator redraws on a row's own note box when one is open

- Task: `dnd2` (find the commit with `git log --grep=dnd2`).
- Decision: an open note box (`.rnote`, `flex: 0 0 100%`) is a row's own
  last child, and covered `.lrow.drop-after`'s inset box-shadow, which
  paints below its element's children. `.lrow.drop-after .rnote` redraws
  the identical inset on the note; both rules paint when the note is
  open, but `.row`'s own bar is occluded, not absent. A doubled 6px bar
  is avoided only because `.row` carries no bottom padding, so `.rnote`'s
  border box lands on exactly the 3px the base rule draws into - add
  `padding-bottom` to `.lrow` and the mark splits into two lines.
- Rejected: an absolutely positioned `::after` bar - immune to a future
  opaque child, but needs `position: relative` on `.lrow`, a larger blast
  radius than the defect earns; a transparent `.rnote`, trading a visible
  defect for a visible redesign of a surface (`--bg2`) meant to read apart.
- Evidence: measured against `dist/` - a marked row's bottom 200x3 px strip
  read 0/600 gold pixels noted, 400/600 closed, list end and middle alike.

## 2026-09-19 - A list drag resolves to a gap, from the document, not to a row

- Task: `dnd` (find the commit with `git log --grep=dnd`).
- Decision: `nativeDrag` resolves the pointer to a gap index - the number of
  rows above the landing place - from the capturing document `dragover` it
  already binds for edge-scroll, against row midpoints cached at `dragstart`
  in document coordinates. The drop zone is the rows box grown by one
  measured row gap above the first row and below the last. There is no
  horizontal test, so the zone is a band. `drop` moves to the same document
  listener, so every position the highlight promises also accepts a release.
- Rejected: keeping the row-level `dragover` and widening what counts as a
  hit (the 8px `.rows` gap is not a row, so the early return that is the
  defect survives in some form); recomputing row rectangles on every
  `dragover` (a forced layout per frame, and rows cannot move during a
  drag); a horizontal bound on the zone (a person aiming between rows drifts
  vertically, and nothing sits beside the rows on this page).
- Evidence: the comment above `onDocOver` already recorded that the pointer
  spends most of a drag over the gaps between rows; only the scroll was
  moved to the document, never the targeting.

## 2026-09-19 - Both sides of the gap light, and a cancelled drag is shown, not worded

- Task: `dnd` (find the commit with `git log --grep=dnd`).
- Decision: "after 3" and "before 4" are one place, so both rows beside the
  gap carry the existing gold inset. The component derives the pair from the
  unchanged `onOver(over, where)` callback, so no port contract moves.
  Cancelling is signalled rather than worded: outside the zone the
  highlights go out and the cursor refuses the drop, which is what Escape, a
  release outside the list and a drag off the page all look like.
- Rejected: one line drawn in the gap itself (it needs a node inside a flex
  column whose rows are `overflow: hidden`, so it either shifts every row
  below it or forces `position: relative` onto a shared `.rows` rule); an
  explicit Escape key handler (the native drag already consumes Escape and
  fires `dragend`, and a second mechanism for one effect is a second thing
  to keep true); a hint string in `dict.ts` (a tooltip is read before the
  drag, not during it, which is when cancelling is decided).

## 2026-09-18 - Task documents stay tracked; closeout deletes them, never pushed

- Task: `workflow-hygiene` (find the commit with `git log --grep=workflow-hygiene`).
- Decision: `issues/<id>/` stays tracked in git while a task is open. The
  closeout amend runs `git rm -r issues/<id>` before the task's one push, so
  a task's documents never reach the remote - only its permanent-home writes
  and its commit do.
- Rejected: gitignoring `issues/` instead - the deletion path stops being
  guardable (`bash-guard.mjs` denies `rm -r` inside the repo; rule 2i sees a
  glob as a literal token), a worktree or a remote agent at the task's commit
  would not see the documents, and the issue 47 task directory was tracked by
  an owner ruling (later overridden) that would have become an exception
  inside an exception.
- Evidence: pre-amend commits stay in the local reflog only
  (`gc.reflogExpireUnreachable`, 30 days by default), so the closeout audit
  is the only thing that preserves a decision or a measurement made mid-task.

## 2026-09-18 - Durable knowledge is written to its home the batch that makes it, never parked

- Task: `workflow-hygiene`.
- Decision: a durable fact, decision, or defect is written to its permanent
  home in the batch that establishes it, never left in a task document for
  closeout to move. Homes: behaviour -> `docs/specs/`; hook/harness/host
  facts and rationale -> `.claude/README.md`; every other decision ->
  `docs/DECISIONS.md`; a defect kept on purpose or work owed ->
  `docs/specs/DEBT.md`; an idea nobody owns -> dropped, named to the human at
  closeout so they can file it.
- Rejected: parking durable content in the task directory until closeout -
  the audit would then have to reconstruct what was durable from narrative
  written once already, which is exactly how content survives as a citation
  into a directory that is about to be deleted.

## 2026-09-18 - The task-document size budget and compaction stay; retirement becomes primary

- Task: `workflow-hygiene`.
- Decision: the 150 KB warn / 300 KB collapse budget and its compaction
  procedure (`.claude/skills/handoff/SKILL.md`) stay - they guard the *open*
  task, read by every worker at dispatch. Compaction becomes the secondary
  procedure; retirement (deleting the directory at closeout) becomes primary.
- Rejected: dropping compaction now that retirement exists - a long task
  still grows for weeks before it closes (phase 8 ran twelve batches), so
  the mid-task budget problem compaction solves has not gone away.

## 2026-09-18 - Rule 2i generalised from a plan.md file to any task directory

- Task: `workflow-hygiene`.
- Decision: `bash-guard.mjs` rule 2i now denies `rm`/`git rm` of any file
  under `issues/<id>/`, or of the directory itself, while a tracked line
  outside that directory cites `issues/<id>/` (a `git show <sha>:path`
  citation stays exempt) - generalised from denying only a still-cited
  `plan.md`.
- Rejected: retiring the rule instead, on the theory that "nothing may cite
  a task directory" under the new model - a rule nobody enforces at the
  moment of deletion is exactly the rule that produced ten orphaned
  citations for issue 65's retired `plan.md`.
- Evidence: retirement was rare before this task (three directories ever)
  and is now routine (every task's closeout), so the class of orphan the
  rule prevents is attempted at every closeout, not occasionally.

## 2026-09-18 - The push-force guard denies every force form, not just a bare `--force`

- Task: `workflow-hygiene`.
- Decision: `bash-guard.mjs` rule 2b now denies `--force`, `-f`,
  `--force-with-lease` (with or without `=<x>`), `--force-if-includes`, and
  any `+<refspec>` token; `--dry-run` still exempts.
- Rejected: leaving `--force-with-lease` allowed (its previous standing) -
  with one amended commit per task, an amend after a push is the tempting
  mistake, and a lease that happens to succeed is still the force-push
  `CLAUDE.md` forbids.
- Evidence: same class as the standing AI-attribution deny - an explicit
  human rule with zero false positives.

## 2026-09-18 - One commit per task, amended per batch, pushed once at closeout

- Task: `workflow-hygiene`.
- Decision: a task's first batch runs `git commit`; every later batch and
  the closeout amend it (`git commit --amend`, message rewritten to cover
  the whole task so far); the commit gate (rule 2e) runs on each amend. The
  branch is pushed once, at closeout, after the task directory is deleted;
  the amend window closes at that push - never force-push after it.
- Rejected: pushing at every batch's committed boundary (the prior rule) -
  it produced many small commits per task and made "push once" impossible
  to reconcile with amending.
- Evidence: the reviewer diffs a batch as `git diff <previous sha> HEAD`,
  both shas recorded in the handoff's Completed section.

## 2026-09-18 - The comment standard lives in `CLAUDE.md`, enforced by review and rule 2i, no new hook yet

- Task: `workflow-hygiene`.
- Decision: the four-bullet comment standard (`CLAUDE.md`, "Comments") is
  enforced by the review prompt (section G) and, at retirement, by rule 2i -
  a comment citing `issues/<id>/` blocks the directory's deletion, and the
  writer of that comment pays for it.
- Rejected: a dedicated hook or `tests/` gate now - the written rule has not
  been given a chance to fail yet (`.claude/README.md`'s standing bar for a
  new hook is a repeated mistake, row 29). `.claude/README.md` row 48
  records the cheapest deterministic form for the day it does.

## 2026-09-18 - The issue 47 task directory is audited and retired in this task

- Task: `workflow-hygiene`.
- Decision: the issue 47 task directory (the Svelte migration backlog) is
  read in full, its durable content placed in permanent homes, and the
  directory deleted - overriding the 2026-09-17 ruling in its own handoff to
  keep it permanently. No directory is exempt from the new model.
- Rejected: keeping the 2026-09-17 ruling - it predates this task's model,
  under which every directory whose work has shipped is retired.
- Evidence: the closed records (`sweep.md`, the closing record in
  `handoff.md`) stay reachable through one history pointer,
  `git show 92d6a4b:issues/47/<file>` - `92d6a4b` is the last commit on
  `main` before this task's own commit.

## 2026-09-18 - Retire scope: audit every shipped directory, then delete - never a blind delete

- Task: `workflow-hygiene` (human decision).
- Decision: every task directory whose work has shipped is read in full,
  its durable content moved to a permanent home, every tracked citation into
  it repaired, and only then is the directory deleted.
- Rejected: a blind delete of old task directories - it is exactly what
  produced orphaned citations for issue 65's retired `plan.md`; the audit
  is the fix.

## 2026-09-18 - Decisions live in one `docs/DECISIONS.md`, not a `docs/decisions/` folder

- Task: `workflow-hygiene` (human decision).
- Decision: one register file, `docs/DECISIONS.md`, holds every decision
  that outlives the task that made it (outside behaviour, which stays in
  `docs/specs/`, and hook/tooling rationale, which stays in
  `.claude/README.md`).
- Rejected: a `docs/decisions/` directory of one file per decision - a
  single register is easier to grep and to keep a size discipline over; that
  discipline is accepted as a cost of the choice, not a reason against it.

## 2026-09-18 - Write the comment standard and sweep the whole repository to match it now

- Task: `workflow-hygiene` (human decision).
- Decision: `CLAUDE.md` gains the comment standard in the same task that
  sweeps every existing violation - untrackable citations
  (`B10-N5`, `issues/<id>/` paths, plan/handoff section references) stripped,
  verbose block comments compressed. A large diff is expected and accepted.
- Rejected: writing the rule now and sweeping later, incrementally - the
  existing violations would keep citing a task directory this same task is
  retiring, which rule 2i would then have to deny piecemeal instead of once.

## 2026-09-18 - One commit per task, amend freely, push once - replaces the per-batch push rule

- Task: `workflow-hygiene` (human decision).
- Decision: this task's commit protocol (see the amend-window entry above)
  replaces `CLAUDE.md`'s prior rule, "push the branch once a batch's
  commits pass their gates." Never force-push, in any form.
- Rejected: keeping per-batch pushes alongside amending - a pushed commit
  cannot be amended without a force-push, which the standing rule already
  forbids, so the two rules were incompatible as soon as amending was
  adopted.

## 2026-09-17 - Nits are processed immediately, per batch, not deferred to a terminal pass

- Task: `phase-8` (retired; recorded here at retirement).
- Decision: nits are cleared in the batch that finds them, against the
  standing "defer mid-plan" rule (`orchestrate.prompt.md`, "Nits") - owner
  instruction. Reviewers still list nits fully; they are acted on.
- Rejected: deferring to the terminal batch as usual - that rule's premise
  ("a later batch re-enters those paths") fails once batches are merged by
  area and do not overlap, so a deferred nit has nothing to ride and arrives
  as a pile instead. `orchestrate.prompt.md`'s "Nits" section now names this
  as the standing exception.

## 2026-09-18 - A batch whose whole scope is other reviews' findings runs with no reviewer

- Task: `phase-8` (retired; recorded here at retirement).
- Decision: the terminal nit-clearing batch ran with no reviewer, by owner
  decision - reviewing a batch whose whole scope is other reviews' findings
  opens a second-order review -> remediate loop with no floor. Substitute:
  every routed finding proves itself in the failing direction as an
  acceptance line. Handoff wording: `Review: not run (owner's decision)`,
  never `not required`. `orchestrate.prompt.md`, "When to run reviewer",
  carries the same sentence.

## 2026-09-17 - Rejected UI/architecture options from the phase-8 review, recorded once

- Task: `phase-8` (retired; recorded here at retirement).
- Decision: no change - these alternatives were considered and rejected
  during review and have no other permanent home now that the task
  directory is gone.
- Rejected: a `<label>` emitted by `Field` (it wraps chip rows and segmented
  switches; a `<label>` around buttons is wrong); `$state.raw` for `lists`
  (a cheap present-cost win traded for a silent failure if anyone later
  mutates in place); extending the truncation checksum over the notes (a
  payload-grammar contract change for a failure the reader can see anyway);
  virtualising the row lists (317 is the largest list drawn, and it moves
  goldens); SHA-pinning the `actions/*` tags (maintenance beyond its value;
  `gitleaks` alone is pinned).

## 2026-09-18 - `data.json`/`catalog.csv` staying tracked was not solved by a pretest step

- Task: `untrack-stubs` (retired; recorded here at retirement).
- Decision: `data.json` and `catalog.csv` stay tracked in git (triggers to
  reopen this: `docs/specs/CONTRACTS.md` section 4).
- Rejected: `"pretest": "npm run data"` (fires for `npm run test` but not
  `test:watch`, and makes a plain `npm test` write 1093 files); pointing the
  seven `app/src/lib/*.test.ts` suites at `data.js` instead (changes what
  they prove, voids `COVERAGE.md`'s "the real `data.json`"); `existsSync` +
  `it.skip` (coverage thresholds fail anyway, or the gap is hidden); a
  vitest `globalSetup` builder (the same tree mutation, only hidden).

## 2026-09-18 - Share stubs (`i/`) and artwork (`img/`, `og/`) stay tracked root folders

- Task: `untrack-stubs` (retired; recorded here at retirement).
- Decision: `i/*.html`, `img/`, and `og/` stay tracked at the repository
  root rather than moving under a build output or out of git entirely.
- Rejected: generating stubs into `dist/i/` and dropping the root folder
  (moves a path four suites read off disk - `derived`, `dataint`, `craft`,
  `stub` - and changes what `node tools/build.js` means); git-lfs, a
  shallow-clone recommendation, or a history rewrite for repository size
  (the 146 MB `.git` is `img/` + `og/`, which stay tracked regardless of
  this choice; a rewrite breaks every clone and every sha the specs cite).

## 2026-09-16 - Playwright: not now

- Task: the Svelte migration (issue 47; retired, recorded here at
  retirement).
- Decision: not adopted, by the owner's decision. Scope fence: R0c reduced
  no real-browser coverage (nine `tests/app/` suites run against `dist/`);
  only the side-by-side pixel comparison ended, and that end was
  unavoidable once the app being compared against was deleted.
- Evidence both ways: for adopting it - the states case-7 flake
  (`docs/specs/COVERAGE.md`, "app/states") was hand-rolled event waiting,
  exactly the class auto-waiting locators exist for, and two Chrome runs
  once collided on one tree with no lock between them; against - the
  driver's verbs (`media`, `computed`, `eachAt`, `settle`, drag, click-by-
  name) are bespoke to a bilingual UI and three-width sweeps, and the
  goldens are structural text, so screenshot tooling would replace nothing
  they check.
- Rejected: deciding with no data; a spike before R0c; committing to it up
  front. Still open - the heavy-run lock question beside it
  (`docs/specs/DEBT.md`, "Routed elsewhere, not paid") weighs against the
  same driver question, since a second real-browser dependency would need
  its own guard too.

## 2026-09-17 - The R0c sweep ran as a read-only reviewer-role dispatch, not an implementer step

- Task: the Svelte migration (issue 47; retired, recorded here at
  retirement).
- Decision: the sweep that read the deleted instruments' own assertions for
  what no surviving instrument could see ran as a read-only, reviewer-role
  dispatch, deliberately separate from the implementer batch that did the
  deleting - the implementer's incentive is to delete, which is the wrong
  incentive for a read meant to find what deleting loses.
- Rejected: a gate in `npm run check` (there is nothing mechanical to
  assert - the sweep's findings are read-only prose); the implementer doing
  it in the same batch (anchoring - the same person who wants the deletion
  reviewing what it costs); skipping it because an earlier audit (R0b)
  already covered ten suites (that audit covered suites, not markup,
  conditional CSS, the dictionary, or the 42 parity specs the sweep also
  read).
- Evidence: this generalises to any "delete a whole surface" batch, not only
  R0c's own.
