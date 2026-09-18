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
