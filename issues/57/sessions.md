# Session prompts - TASK 57

This file gives the prompt for each session of task 57. Run one session at a
time, in the worktree `.claude/worktrees/57` (branch `claude/57`). Each
session ends at a committed and pushed boundary, runs `/handoff`, and names
the next prompt.

## Order and gates

| Session | Phase | Writes app code? | Can start | Ends at |
|---|---|---|---|---|
| S1 | Critique of all states, widths, languages | no | now | `audit.md`, owner triage |
| S2 | Direction and mocks | no | after S1 triage | owner approves a direction |
| S3..Sn | One batch: mock, implement, review, fix | yes | after S2; header, tab bar and list batches after R10 `B10.3` | batch pushed, CI green |
| Close | `DESIGN.md` lock, re-audit, squash | docs | after the last batch | squash on `main` |

## Owner questions

Settled (owner, 2026-10-23):
- S1 and S2 assume the post-R10 shape and do not wait for R10.
- A batch that touches the header, the tab bar, the notices or the list
  pages waits for R10 `B10.3`. Any other batch may run before R10.
- Critique widths: 360, 390, 768, 1180, 1600.
- No Vercel guideline cross-check.

---

## S1 - critique

```text
Follow .claude/prompts/orchestrate.prompt.md. TASK: 57
GOAL: phase 1 only - critique. No app code.

Work in .claude/worktrees/57 (branch claude/57). Read CLAUDE.md, then
issues/57/context.md and issues/57/sessions.md. Do not re-fetch the issue.

1. Capture the evidence set. Write a scratch script (scratchpad, not
   committed) that reuses tests/app/driver.js and the inventory in
   tests/app/inventory.js: npm run build:test, then one screenshot per
   state family (one representative state per route and per component
   state: empty, loading, error, selected, open, signed in/out, long text)
   at 360, 390, 768, 1180 and 1600, in RU and EN. Skip the surfaces that R10 deletes
   (context.md). Save PNGs and a manifest (state id, route, width, lang)
   to C:\Users\Ignat\.dhloot\notes\57\evidence\, outside the checkout, so
   no untracked file blocks the CI credit.
2. Run Impeccable critique and audit over the set. Dispatch at most two
   helpers in parallel, split by route family; each loads the impeccable
   skill, reads PRODUCT.md and DESIGN.md first, and returns findings only.
3. Apply the clarity rule from context.md to every surface: list each help
   text, tooltip, legend and instruction sentence, and each label that does
   not say what it does.
4. Write issues/57/audit.md: P0/P1/P2 tables, one row per finding - id,
   surface, width, lang, evidence file, the Impeccable rule or WCAG
   criterion, the clarity verdict, and "systemic" or "local". Add a short
   section of systemic themes (type scale, density, colour, navigation)
   that phase 2 must decide. Add RU/EN parity findings in their own table.
5. Commit issues/57/, push, run the CI credit.
6. Stop. Ask the owner to triage: which systemic themes go to phase 2,
   which findings are leftovers, which are rejected. Record the answers
   in context.md, "Decisions already settled". Then /handoff.
```

## S2 - direction and mocks

```text
Follow .claude/prompts/orchestrate.prompt.md. TASK: 57
GOAL: phase 2 only - design direction with mocks. No app code.

Work in .claude/worktrees/57. Read CLAUDE.md, issues/57/context.md,
issues/57/audit.md (the triaged systemic themes), DESIGN.md, PRODUCT.md.

1. Dispatch the planner (opus). It uses Impeccable shape for the triaged
   systemic themes and decides polish in place or redesign per area, with
   the rejected alternatives. The post-R10 shape (context.md) is the base.
2. The planner makes mocks in issues/57/mocks/direction/: two directions at
   most, each as static HTML built from tokens.css values, plus PNG
   renders at 360 and 1180 in RU (EN for the screens where text length
   differs). Cover the header and navigation, the catalog table and cards,
   the item detail, the roller, and a list page. Each mock passes the
   clarity rule: no help text needed.
3. The planner writes issues/57/plan.md: the direction, the token changes,
   the ordered batch outline (each batch = one surface, its findings from
   audit.md, its gates, its mock to approve), the four standing checks,
   and NEEDS_HUMAN_CONFIRMATION: yes.
4. Commit and push (docs only). Show the owner the mocks side by side.
   Stop until the owner chooses a direction. Record the answer in
   context.md, then /handoff with batch 1 as the next batch.
```

## S3..Sn - one batch per session

```text
Follow .claude/prompts/orchestrate.prompt.md. TASK: 57
GOAL: batch <N> only, as plan.md names it.

Work in .claude/worktrees/57. Merge origin/main first (R10 must be on it).
Read CLAUDE.md, issues/57/context.md, plan.md, handoff.md.

1. Planner refresh (sonnet; opus if the batch has an open design question):
   make the batch's mock in issues/57/mocks/<N>/ from the approved
   direction - the changed surface at 360 and 1180, RU and EN, with each
   changed state (empty, error, open, focus). Impeccable polish rules apply;
   the clarity rule applies.
2. Stop and show the owner the mock. Wait for approval or corrections.
3. Implementer (opus: visual-judgement test 3). It builds the batch,
   re-seeds the goldens it changes, adds inventory entries for new states,
   runs rtk npm run check:fast, commits, pushes; then the CI credit.
4. Reviewer (trigger: changed UI). It compares the build with the approved
   mock and runs Impeccable audit on the changed surface. One fix cycle with
   the blockers and local nits, then the CI credit again.
5. Update audit.md rows to fixed <N>. /handoff, and name the next batch.
```

## Close - lock and land

```text
Follow .claude/prompts/orchestrate.prompt.md. TASK: 57
GOAL: closeout - lock DESIGN.md, re-audit, land on main.

1. Impeccable document: update DESIGN.md (and .impeccable/design.json)
   from the shipped build; add the clarity rule and the accepted
   exceptions.
2. Re-run the S1 capture and a short Impeccable audit; every P0 and P1 row
   in audit.md is fixed, accepted (DESIGN.md "Notes") or in DEBT.md.
3. Write the issue's final report as a comment draft for the owner.
4. Retire issues/57 per /handoff, squash onto main per orchestrate.prompt.md,
   "Task closeout and cleanup".
```
