# Handoff - TASK 57
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (batch 1b approved; batch 2 is implement-ready,
  then the wave 1 squash)
- Last agent: planner (the batch 2 refresh)
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `claude/57` (worktree `.claude/worktrees/57`)
- Base / starting commit: `9112c4ed` (the merge of `main` `c8243ba6`)
- Pushed: yes at `3e5f6301` (batch 1b and the merge of `main` `eea84371`);
  the refresh commit `docs(57): refresh the plan for batch 2 and the wave 1
  squash` is local, not pushed (the orchestrator pushes it after the CI run
  40960103117 of `3e5f6301`).

## Completed
- Batch 1 - foundation: `9a31aede`, review fix `80872b35` (`reviews/1.md`,
  fix-then-continue, applied).
- Batch 1b - no-picture placeholder retired: `fce4a9f8`, merge `3e5f6301`
  (`reviews/1b.md`, approve, no finding). Deviations accepted by the review:
  `CONTRACTS.md` section 5 and `META.md` keep the `_none` removal record and
  the 2026-10-14 probe; an English `pictures` counter in `tests/derived.js`;
  the light-well check rides the "a long source line" loop of
  `tests/app/print.js`; a one-line card gives a taller well (the fit).
- Previous sha (batch diff base) for batch 2: the tip after the dispatch
  merge of `origin/main` (the implementer names it).
- Review: batch 2 required (triggers: public contracts `routes.json` and
  `llms.txt`, `.claude/hooks/`, prompts and agents), report
  `issues/57/reviews/2.md`.

## Verification
- Batch 1b (exact commands and results; `fce4a9f8`):
  - `npx vitest run app/src/lib/desc.test.ts
    app/src/components/printPage.test.ts app/src/components/record.test.ts`:
    183 passed.
  - `node --test preview/worker.test.mjs tools/check-site.test.mjs
    tools/artwork/lib.test.mjs`: 319 passed.
  - `node tools/build.js`: no generated file changed.
  - `node tests/app/golden.js --update --only=p/set-longsrc1`, then compare:
    unchanged.
  - `node tests/run-all.js app/print,app/states,contracts,dataint,derived,stub`:
    all passed in 568 s.
  - `npm run lint:untyped`, `npm run lint:typed`, `npm run check:built`
    (247.9 of 253 kB): passed. `rtk npm run check:fast`: PASS in 513 s.
  - Detector (`impeccable detect --json --no-inline-ignores app/src`): 73
    findings (at most 74 allowed).
  - CI run 40960103117 of `3e5f6301`: in progress at the refresh; the CI
    credit goes here before the batch 2 dispatch.
- First-screen offsets after batch 1 (case 83, top of the first
  `[data-primary]`, RU then EN; logged, not asserted):

  | Route | 360x640 | 1180x720 | Batch |
  |---|---|---|---|
  | `/roll/std` | 792, 718 / 256 | 552, 552 / 288 | 5 |
  | `/tables/eq_weapon` | 750, 683 | 570, 548 | 3 |
  | `/i/ci1` | 257 (over by 1), 220 | 214, 214 | 4 |
  | `/search` searched | 535, 469 | 463, 463 | 7 |
  | `/account` gm1 | 243, 220 | 214, 214 | 7 |
  | `/p/set-emberaxe` gm2 | 585, 533 | 354, 354 | P |
  | `/homebrew` gm3 | 721, 677 | 649, 649 | 6 |
  | `/homebrew/sets` long name gm4 | 524, 480 | 452, 452 | 6 |
  | `/homebrew/new` gm1 | 239, 239 | 233, 233 | 6 |
  | `/lists` gm1 | 528, 528 | 500, 500 | 8 |
  | `LIST_A` gm4 | 466, 466 | 422, 422 | 9 |
  | `/s/player-token-1` | 531, 531 | 525, 525 | 9 |

- Gates of the refresh: none (docs only, not pushed).

## Next batch (implement-ready)
- Name: batch 2 - Shell, the mark and the American spelling (`plan.md`
  section 10; mock `mocks/2/`, the mark `mocks/mark/b-vault-die.svg`).
- Objective: the header of direction R (three jobs, the mode row and the
  supplements menu, the account control, the EN wordmark, the labelled pin
  and «Справка», the toast plate, D121); the vault-die mark everywhere it
  ships; the American-spelling sweep; the navigation, waves and spelling
  decision files. The last batch of wave 1.
- In scope / out of scope: `plan.md` section 10.
- Files expected: `plan.md` section 10, "Files expected" (by step S1-S12).
- Steps: S1 navigation logic, S2 `Menu.svelte`, S3 the job row, S4
  `ModeRow.svelte`, S5 the shell, S6 the pin and the help, S7 the toast and
  D121, S8 the contract set, S9 the mark, S10 the spelling sweep, S11 docs,
  decisions, the new state and the golden re-seed, S12 polish, evidence and
  gates.
- Acceptance criteria: `plan.md` section 10, "Acceptance criteria" (every
  earlier batch 2 line of section 7 is one of them).
- Verification commands: `plan.md` section 10, "Verification": `npm run
  check:db` (PowerShell) first, then stop Supabase and Rancher; `rtk npm run
  check:fast`; both lints; `node tools/build.js`; `node tools/decisions.js`;
  `npm run check:built`; `npm run build:test`; `node tests/run-all.js
  app/contracts,app/states,app/typo,contracts,dataint,derived,stub`; `node
  tests/app/sweep.js 360`; `node --test tools/artwork/lib.test.mjs`; `node
  tools/artwork/cards.mjs --check`; `node .claude/hooks/selftest.mjs` once on
  its own; the detector; the spelling grep; push and the CI credit.
- Risks / do-nots: `plan.md` section 10, "Risks and do-nots". Hand-edit no
  golden; respell no identifier, stored value, golden id, decision title or
  quotation; a guard that refuses a `.claude/` or `CLAUDE.md` write stops the
  implementer, who returns the text.
- Fallback (optional): none.
- After batch 2: its batch review, then the wave 1 squash (`plan.md` section
  16; `issues/57/` goes onto `main` with it, owner "Wave squash content").

## Blockers
- None.

## Deferred
- R5 of `reviews/plan-1-3.md` (deferred-scope): `review.prompt.md` names a
  third look `<name>-2.md`, while `agent-guard.mjs` reads only
  `plan-<batch>-<n>.md`.
- The link-preview Worker's card images (`tools/share-card.mjs`).
- The EN `<title>`, manifest name and `en/index.html` wordmark.
- Uppercase controls outside the capitals rule are audited by their surface
  batches (15 components carry `text-transform: uppercase`).
- Monospace labels still outside the Key Characteristics rule, owed to their
  surface batches: `.batch-all` (BatchBar), `.ordiv i` (OrGrid), `.altcol`
  (TablesPage), the ListPage summary labels (`.lnote`, `.lroll`,
  `.batch-lbl`, `.money-l`), HelpButton, `.steps-l` (RecordCard).

## Notes
- Mocks path: `issues/57/mocks/<N>/`; batch 2's evidence goes to
  `issues/57/mocks/2/built/` and the mark renders to
  `issues/57/mocks/mark/png/shipped__*`.
- Screenshot findings (refresh): `mocks/2/` round 5 is the reference - the
  mode chip reads «Альтернативные таблицы» (B5-2); the toast is a plate with
  a `--muted2` border; the 360 roll frames draw no H1 (batch 5's part); the
  mark's B renders (`mocks/mark/png/b__fav.png`) read at 16 px on the dark
  and the light strip.
- Planner defaults taken with the owner away (for the orchestrator's owner-AFK
  decisions log): below 760 px the pin and the help stay
  round buttons until their page's batch moves them (the interim rule, less
  work; lines in batches 3, 5, 6, 7, 8); the account ring also lights on the
  homebrew editor (a «Мои предметы» page); the golden re-seed runs locally
  (one CI run instead of two); the job row keeps the class `nav.tabs` so the
  browser suites' selectors hold.
- Cleanup performed / retained artifacts: `issues/57/mocks/measure.mjs` stays
  until closeout. Print evidence and the mock P worktree as before
  (`C:\Users\Ignat\.dhloot\notes\57\`).
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): none (a
  planning pass); batch 2 writes the homes `plan.md` section 10 names.
