# DEBT.md - live defects and decisions kept over the rewrite's own

The third category beside `VISUAL_DEBT` and `ACCEPTED`, which lived in
`tests/parity/specs.js` and `docs/parity.md` until R0c deleted them along with
the rest of the parity harness (issue 47, `23c00a6`). A `VISUAL_DEBT` entry was
a pixel difference not yet reproduced; an `ACCEPTED` entry was a difference
kept on purpose, keyed and enforced. Neither could hold a defect the rewrite
reproduced *because the live app had it*: there was no difference to key, both
apps were identical by construction, and the harness never mentioned it. This
file holds that - it is the one of the three that outlives the migration; the
other two were deleted with the harness.

An entry is written in the batch that makes the decision, never later. The
batch that pays an entry off deletes it - the same ratchet culture as
`VISUAL_DEBT`.

**Why here, not somewhere else** (planner, 2026-09-11, migrated from issue
47's `plan.md` at closeout): `docs/specs/` is what every
agent reads for a touched path, and it is the one place `CLAUDE.md` says
durable behaviour belongs; a spec file survives a task directory's
retirement, unlike the harness that used to describe the same defects. An
entry *is* a behaviour statement ("the app does X; X is wrong; here is why
it does it anyway"), which is what a spec is for. Rejected: `ACCEPTED`
(nothing keys an identical behaviour - both apps are the same on purpose,
so there is no difference to key); the runbook that used to be
`docs/parity.md` (retired with the harness); a section inside
`docs/specs/FEATURES.md` (that file says what the app does; "and this is
wrong, fix it later" in the middle of it would be read as behaviour or
skipped - this file cross-references `FEATURES.md` bullets instead, never
the reverse); a task directory (retires with the task, and Phase 8 needs
this register as its *input*, not as something that retires alongside it);
one GitHub issue per entry (outlives the task but not in the tree, needs
`gh` and a network, and cannot carry a rule or a measurement verbatim - the
post-migration review files issues *from* this register instead); the
READMEs (a reader's document, not a maintainer's).

**The live sources were deleted at R0c (`23c00a6`)**; `git show
23c00a6^:app.js` (or `:style.css`, `:index.html`) reads them at their final
state. A line citation below with no other hash refers to that state; a
citation naming its own hash (`bb61db0`, `b967481`, `a52c17d`, `dc99f21`) was
read at that commit specifically. Verified before this sentence was added:
`git show bb61db0:app.js` around lines 3589-3603 matches D2's quote below.

## Defects reproduced on purpose

The live app was wrong; the rewrite copied it; parity was the reason.

## Divergences found at the deletion (R0c sweep), owed a decision at Phase 8

Commissioned by the repository owner before R0c's deletions (`issues/47/
context.md`, decision 11, 2026-09-16): one more deliberate pass over
everything the migration deletes, read against `app/src/` for behaviour no
surviving instrument would notice. Full record: `issues/47/sweep.md`, written
while HEAD was `7a33c22`. **None of these blocked the deletion** - the owner's ruling was
that a finding here is recorded, not fixed, in R0c; reviewing and addressing
each is Phase 8 work. Unlike section 1, these are not known to be *deliberate*
parity choices - they are accidental losses or additions the sweep caught
because no instrument (pixel diff, axe, a registered state) could see them,
the same shape R0b.4's five divergences had.

## Live decisions kept over the rewrite's own

Not a defect; a design the rewrite argued against and lost to parity.
Re-examined at Phase 8, and either kept (entry deleted, `FEATURES.md`/
`STATE.md` say so) or changed.

