# Handoff - TASK 57
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (batch 1b implemented; its batch review is next,
  then batch 2)
- Last agent: implementer (batch 1b)
- NEEDS_HUMAN_CONFIRMATION: no (Q-W1, `plan.md` section 13, has a
  recommendation and blocks no batch; it applies at the wave 1 squash)
- Branch: `claude/57` (worktree `.claude/worktrees/57`)
- Base / starting commit: `9112c4ed` (the merge of `main` `c8243ba6`)
- Pushed: yes, the batch 1b commit (its sha is in the implementer's report;
  the handoff cannot name the commit that holds it)

## Completed
- Batch name/id: batch 1b - No-picture placeholder retired (`plan.md`
  section 10; mock `mocks/1b/`, owner answer M1b-1)
- What shipped:
  - `artSrc` returns `null` for no picture or a broken one; `NO_ART` is gone.
  - `PrintCard.svelte`: `ArtWell` with `kindGlyph` in `.pc-art` when there is
    no picture (`class:none`); `.pc-art` on `var(--art-well)` (N6, no
    `#0a0810`); `.pcard:not(.bw) .pc-art.none` sets `--art-well: #ebe7f0`
    and `--line2: #3a3350`. `fit()`, `ArtWell.svelte` and the
    black-and-white layout are unchanged.
  - `RecordActions.svelte`: `copyImage` returns on a `null` source; the share
    action builds `file` only with a source; no `!` assertion.
  - Link cards: the Worker's `homebrewImage(env, img, lang)` and
    `build-share-pages.js` `pageCtx` give a record with no picture the site
    card of its language as a large card (1200x630, `summary_large_image`, no
    visible `<img>`).
  - Deploy and data checks: `collect-site.sh` and `check-site.lib.mjs` probe
    `img/ci1.webp` and `img/thumb/ci1.webp`; `dataint` skips no `_none`
    file; the artwork lib comments and the thumbnail plan test hold no
    `_none.webp`.
  - `git rm img/_none.webp img/thumb/_none.webp og/_none.jpg`.
  - Docs: `CONTRACTS.md` section 5, `FEATURES.md` "Records" and "Print",
    `META.md` preview table, `COVERAGE.md` printPage row, `docs/artwork.md`,
    `add-source.prompt.md`, DESIGN.md "Cards" and "Signature component: the
    print card", `README.md` and `README.ru.md` (1192 pictures, the glyph
    sentence).
  - Tests: `desc.test.ts` (null at both sizes), `printPage.test.ts` (the
    glyph path `ICONS.kindItem.d` on both sheets and after a 404, no `.pc-img`
    or `.pc-back`, none in black and white, axe), `worker.test.mjs` (the
    picture table with width and `twitter:card`, an `/en/h/` case),
    `tests/derived.js` (the large site card for the artless stub, its width,
    no `<img>`; a new English `pictures` counter), `tests/app/print.js` (the
    light well colour, the glyph ink, the glyph inside the well and above the
    first text line on the standard and the compact colour sheet; the dark
    well behind `w7`'s picture; the parity case compares the well colour of
    the preview and the sheet and asserts the light well for `set-longsrc1`).
  - `tests/app/inventory.js`: the `why` of `#/p/set-longsrc1 as gm2`; its
    golden re-seeded, only the `# why:` line changed.
- Files changed: about 30 under `app/src/`, `preview/`, `tools/`, `tests/`,
  `docs/`, `.claude/prompts/`, `DESIGN.md`, `README.md`, `README.ru.md`; three
  files deleted; evidence in `issues/57/mocks/1b/built/`.
- Previous sha (batch diff base): `78d60726` (the merge of `origin/main`
  `dd13136d` into `claude/57` at the batch start)
- Deviations and rationale:
  - `CONTRACTS.md` section 5 and `META.md` still name `_none` files, in the
    text that items 18 and 20 prescribe (the removal record and the
    2026-10-14 probe). The acceptance line "none of them names a `_none`
    file" conflicts with those items; the item text was kept. The remaining
    `git grep -n "_none" -- . ":!issues" ":!docs/decisions"` hits are those
    three lines, the `v_none` and `hb_none...` identifiers.
  - `README.ru.md` had «1193 картинки»; `tests/derived.js` checked only the
    Russian count, so a `pictures` counter was added for the English line
    (plan item 22 said both were checked).
  - The new `print.js` well check runs in the existing "a long source line"
    loop, which opens the same item (`h` ...461, gm4's no-picture item) as
    `#/p/set-longsrc1`, on the standard and the compact colour sheet.
  - The dark-well check runs on `w7` (the damage-bonus card the suite already
    opens).
- Outcomes the plan asked for:
  - Detector (`impeccable detect --json --no-inline-ignores app/src`): 73
    findings (at most 74 allowed); `git grep impeccable-disable -- app/src`
    and `#0a0810` in `app/src/components` return nothing.
  - Polish and harden on the no-picture well (review against the evidence
    set): no change. The glyph `#3a3350` on `#ebe7f0` has a contrast of about
    10:1; the glyph is `aria-hidden`; the fit is unchanged (print suite);
    without background graphics the well prints as paper and the dark glyph
    stays.
  - Evidence against `mocks/1b/print-card__1180__ru.png`: the same well tone
    and glyph ink. One difference: the evidence card («Фляга туманов») has a
    one-line text, so `fit()` gives a taller well and a larger glyph (42% of
    the well) than the mock's two-line card; this is the fit, not a change.
- Review: required (triggers: a public contract, a prompt, changed print UI),
  report `issues/57/reviews/1b.md`.

## Verification
- Commands run (exact) and results:
  - `npx vitest run app/src/lib/desc.test.ts
    app/src/components/printPage.test.ts app/src/components/record.test.ts`:
    183 passed.
  - `node --test preview/worker.test.mjs tools/check-site.test.mjs
    tools/artwork/lib.test.mjs`: 319 passed.
  - `node tools/build.js`: no generated file changed.
  - `npm run build:test`, then `node tests/app/golden.js --update
    --only=p/set-longsrc1`: only the `# why:` line changed; `node
    tests/app/golden.js --only=p/set-longsrc1`: unchanged.
  - `node tests/run-all.js app/print,app/states,contracts,dataint,derived,stub`:
    all passed in 568 s (print 560.2 s, states 567.7 s).
  - `npm run lint:untyped`, `npm run lint:typed`: passed.
  - `npm run check:built`: passed; budget 247.9 kB within 253.
  - `rtk npm run check:fast`: PASS in 513 s (prettier, svelte-check 0
    errors, vitest 1466 passed, budget 247.9/253 kB).
- First-screen offsets of batch 1 (case 83, top of the first `[data-primary]`
  / limit, RU then EN; logged, not asserted):

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

- Gates: check:fast, check:built, the suites above; CI on the push
  (deploy-replay runs `collect-site.sh` and `check-site.mjs`).

## Next batch (implement-ready)
- Name: the batch 1b review (`issues/57/reviews/1b.md`), then batch 2 - Shell
  (`plan.md` section 7, batch 2 row and "Inherited acceptance lines",
  "Batch 2"). Batch 2 is an outline: its refresh expands it before the
  implementer starts.
- Objective, scope, files, steps, acceptance and verification: from the
  batch 2 refresh.
- Risks / do-nots: batch 2 changes public contracts (`routes.json` `tab`,
  `llms.txt`); it needs a batch review.
- Fallback (optional): none.

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
- Mocks path: `issues/57/mocks/<N>/`; batch 1b evidence in
  `issues/57/mocks/1b/built/`: `print-std`, `print-compact` and
  `editor-preview` at 360 and 1180, RU and EN (the card centred in the
  viewport); `print-std-colour-{ru,en}.pdf` (Chrome print, page 1) and their
  300 dpi JPEGs, and one card crop at 300 dpi (`...ru__card__300dpi.jpg`).
- Screenshot findings: the light well and the dark glyph on every changed
  surface; the screen art wells stay dark.
- Cleanup performed / retained artifacts: `issues/57/mocks/measure.mjs`
  stays until closeout. Print evidence and the mock P worktree as before
  (`C:\Users\Ignat\.dhloot\notes\57\`).
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section):
  `CONTRACTS.md` section 5 (no-picture link card, the removal); `FEATURES.md`
  "Records" and "Print"; `META.md` preview-card table; `COVERAGE.md`
  `components/printPage.test.ts` row; `docs/artwork.md` "Thumbnails",
  `unarted`; DESIGN.md "Cards", "Signature component: the print card";
  `README.md`, `README.ru.md`; `.claude/prompts/add-source.prompt.md`.
