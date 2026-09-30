# Handoff - TASK persist-7-homebrew
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: planned (pass 3, still phase A: design level); waits on
  the owner's review of the mocks and `Q1`-`Q12` (`plan.md` section 9),
  then on phase B (the delta pass and `B7.1`'s implement-ready steps)
- Last agent: planner (2026-09-30, planning pass 3, on `main`)
- NEEDS_HUMAN_CONFIRMATION: yes - the mocks (`mocks/index.html`, m01-m22)
  and `Q1`-`Q12`; `Q9`-`Q12` are new (the owner's first mock review)
- Branch: `main` (uncommitted; the orchestrator commits)
- Base / starting commit: not started (`14e6dcf9` is the tree pass 3 read)
- Pushed: no

## Completed
- Batch name/id: none built. Planning pass 3: `plan.md` section 4.14
  answers the owner's eight review items (F1-F8); `Q9`-`Q12` added;
  sections 2, 3 (G39-G42), 4.1, 4.2, 4.4, 4.7, 4.9-4.11, 4.13, 5-13
  amended; pass 2's `B7.2` split into `B7.2` (the account's pages) and
  `B7.3` (homebrew in lists); pass 2's `B7.3` is now `B7.4`.
- Mocks: m02, m04, m05, m09, m12, m13, m15, m17 revised; m18-m22 added;
  the index lists all 22. The trademarked example source is now the
  invented «Мастерская Ольхи» / "Alder Workshop" everywhere except the
  owner's verbatim quotes in `context.md`.
- Fixed in passing: pass 2's mocks named four catalog records wrongly
  (`hi7`, `q23`, the `q38` picture, the `saints-ensemble` members) and its
  example file's keys broke the `hb_[a-z2-7]{16}` grammar.
- What shipped: nothing to production.
- Files changed: `issues/persist-7-homebrew/{context,plan,handoff,pending-apply}.md`,
  `issues/persist-7-homebrew/mocks/*` (23 files, regenerated).
- Previous sha (batch diff base): none
- Deviations and rationale: none; nothing outside `issues/persist-7-homebrew/`
  was written.
- Review: not run (planning only). `plan.md` Status keeps `Plan review:
  required before B7.1`.

## Verification
- Commands run (exact): `node -e` reads of `data.js` (craft, eq fields,
  sets, record names; `context.md`, pass 3 facts); `node gen.mjs
  E:/dev/daggerheart-loot/issues/persist-7-homebrew/mocks` (the generator
  in the scratchpad, `context.md`); `npx prettier --write
  "issues/persist-7-homebrew/mocks/*.html"`; `npx prettier --check
  "issues/persist-7-homebrew/**/*.{html,md}"`; the browser pane at 360 px.
- Results: prettier check passes; the 360 px check measured all 48 phone
  frames of m01-m22 (m17 has text frames only) - no element outside its
  frame, the tab strip excepted (`overflow: hidden` by design).
- Gates: none apply to a planning pass. No `npm run check`, browser
  suite, build or Supabase stack (the dispatch forbade them).

## Next batch (implement-ready)
- Name: none is implement-ready. The next dispatch is planning phase B
  (`plan.md` section 13), after the owner's answers; it expands `B7.1`.
- Objective: -
- In scope: -
- Out of scope: -
- Files expected: -
- Steps: -
- Acceptance criteria: -
- Verification commands: -
- Risks / do-nots: `plan.md` section 12; one session per local stack and
  per test project (`CLAUDE.md`).
- Fallback (optional): -

## Blockers
- The owner's answers to `Q1`-`Q12` and the mock review (`plan.md`
  section 9, `mocks/index.html`).
- R6's closeout and the persist-4b release run on this tree now; phase B
  reads them as shipped (`plan.md` section 13, step 1).
- The roadmap and decision changes wait in `pending-apply.md` (pass 3
  amended them; D8 and D9 are new); phase B applies them, adjusted to
  the answers, then deletes that file.

## Deferred
- Item 13 (books shared with other users, subscriptions, roll tables per
  book) - a later release; `plan.md` 4.13 keeps the shapes open.
- A homebrew Trash (decision 30); art (R8); `#/h/<token>`, clone, print
  routes for cloud lists (R9); a set filter; `recall` on a homebrew
  record; a source cover; moving items between sources in bulk; price
  and quantity in the quick draft panel.

## Notes
- **Owner review order (next session, 2026-10-01).** About 30 minutes.
  1. Open `mocks/index.html` from disk. Start with the pass 3 answers:
     m18 (a new source from the editor), m19 (sections), m20 (the
     failure states and the required-field table), m21 (rule cards),
     m22 (the quick draft from a list), m15 (import with the «Куда»
     mapping), then the revised m02, m04, m05, m09, m12, m13, m17.
  2. Answer the four new questions, `plan.md` section 9: `Q9` sources on
     import, `Q10` sections inside a source, `Q11` several upgrade links,
     `Q12` the quick draft and its mark. Each has the recommendation
     first. `plan.md` 4.14 gives the design behind each (F3, F4, F6, F8).
  3. Answer `Q1`-`Q8` (still open; pass 3 changed only `Q5`'s example
     name and `Q6`'s batch count - R7 is now four batches, about 190
     minutes of gates; R7b about 81).
  4. Confirm two small points: the field label «Карты правил» for the
     catalog's `refs` (m21, F7), and the invented example name «Мастерская
     Ольхи» / "Alder Workshop" (F1).
  5. Skim `pending-apply.md` (the roadmap rows, D1-D6 as amended, D8 and
     D9). Then dispatch phase B with the answers.
- Mocks path: `issues/persist-7-homebrew/mocks/index.html` (m01-m22; open
  from disk; the pictures load from the repository's `img/`). The
  generator and how to rerun it: `context.md`, "Facts settled by
  planning pass 3".
- Screenshot findings: no issue screenshots (no GitHub issue). The mocks
  compose the shipped screens (`RowMain`, `RecordCard`, `Panel`, `Field`,
  `Seg`, `Chip`, `Badge`, `NoticeBox`, `AccountMenu`, `FilterBar`, R6's
  `BatchBar` and `ImportPanel`).
- Mock check (browser pane, 2026-09-30): the pane opened only the
  `mocks/index.html` path, so the check copied pages of 360 px frames to
  that path one by one (`zz-check-*.html`, deleted after; the generator
  then rewrote `index.html`). 48 frames, no overflow.
- Cleanup performed / retained artifacts: the check pages are deleted;
  the generator stays in the session scratchpad (outside the repository).
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): none
  (the dispatch limited writes to this directory).
