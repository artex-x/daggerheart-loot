# Shared task context - TASK 59

## Goal
- Complete GitHub issue 59's campaign-frame roll cleanup and invariant checks, and also adapt the repository's agent-model selection guidance/defaults for the current ChatGPT/Codex landscape.
- The human explicitly requested Fable for the planner, then clarified that Codex model routing must not use Astra and must map only across Sol -> Terra -> Luna. For this run, the unavailable Fable planner maps to GPT-5.6 Sol.
- The human prefers only medium -> high reasoning effort for token efficiency; do not route routine work to xhigh, max, or ultra.

## GitHub issue (if any)
- URL: https://github.com/artex-x/daggerheart-loot/issues/59
- Captured or last verified: 2026-09-14 via `gh issue view 59 --json number,title,body,url,state,labels,comments`
- Title: Remove rolls from campaign frame values
- Summary (facts only): The issue asks to remove `roll` values from campaign-frame equipment that does not appear on the roll page and add invariants for roll-page membership, opposite-roll assignment, uniqueness, and gaps.
- Decisions already settled: On 2026-09-14 the human clarified that this task must both implement GitHub issue 59 and extend the orchestration documentation for Codex. The roll-value work and model-routing documentation belong to the same task plan.
- Open questions: None about task identity.

## Screenshot / attachment findings
- GitHub issue 59 embeds one 831x485 screenshot related to campaign-frame roll values. Attempts to open the direct attachment and issue page through the available web reader returned no renderable content, so its detailed visual contents remain unavailable. Do not infer details from the image; ground implementation in the issue text, canonical data, roll-page behavior, and tests.

## Key paths
- Specs: `.claude/README.md`, `.claude/prompts/orchestrate.prompt.md`
- Code hot paths: `.claude/agents/planner.md`, `.claude/agents/implementer.md`, `.claude/agents/reviewer.md`, `.claude/agents/add-source.md`, `.claude/agents/refresh-artwork.md`
- Supporting evidence: `.claude/improvements.md`, `CLAUDE.md`
- Issue 59 product hot paths: canonical `data.js`; generated `data.json` and
  `catalog.csv`; `tests/dataint.js`, `tests/derived.js`, and
  `app/src/lib/data.test.ts`; record-to-table routing in `app.js` and
  `app/src/lib/label.ts`; `app/src/lib/label.test.ts`; the `#/i/f1` structural
  golden; both READMEs and `docs/specs/FEATURES.md`.
- Mocks: none expected; this appears to be documentation/configuration work, not UI work.

## Command costs

| Command | Wall clock | Fits one call? |
|---|---|---|
| `npm run check` | Known repo baseline: a few minutes | yes (600s cap) |
| `npm run check:built` | Known repo baseline: a few minutes | yes (600s cap) |
| `node tests/parity.js "<filter>"` | Known `tables` example: about 9 minutes | barely |
| `node tests/run-all.js parity` | Known CI baseline: about 867 seconds | no |

## Measuring the live app against the rewrite
- Not applicable unless planning unexpectedly reaches product/UI code.

## Which machine is authoritative
- For recorded numbers (parity debt, timings): CI unless a task-specific source says otherwise.
- What a difference on another machine means: local parity numbers are advisory per `CLAUDE.md`.

## Reasons already disproved
- Fable is not currently available on this Codex host. The human explicitly excluded Astra and set the Codex routing ladder to Sol -> Terra -> Luna only.
- The current repository guidance records that Fable access lapsed on 2026-09-13, but its Codex cheat-sheet still mentions Astra-era assumptions indirectly and needs a current ChatGPT/Codex mapping review.

## Constraints
- The orchestrator owns model routing; workers must not select models.
- Codex routing must use only GPT-5.6 Sol, GPT-5.6 Terra, and GPT-5.6 Luna, in that descending capability order; do not select GPT-6 Astra for this task or propose it in the target routing.
- Effort guidance must prefer medium and escalate to high only when justified by design complexity or implementation/review risk.
- Do not use inherited session models as worker defaults.
- Planner output may edit only `issues/59/` and must not implement production/config changes.
- Current branch/base at dispatch: `main` at `4c61eac5300c7ae88db20221502f7bc8d5c94173`.
- Preserve unrelated untracked paths: `.claude/settings.local.json` and `issues/tg-preview-refresh/`.
- The required `rtk` wrapper is unusable on this Windows host because its WinGet alias cannot launch; direct commands are being used as a fallback.
- The prior docs-only implementer was interrupted immediately after the human expanded scope; it made no tracked or untracked changes beyond the already-existing `issues/59/` task documents.
- `window.LOOT.items.frames` has 94 records (`f1`-`f94`), all currently carrying
  artificial global `roll` values 1-94 even though the application has no frame
  roll route. The six real roll modes are listed in `docs/specs/FEATURES.md`.
- Removing those values changes the `#/i/f1` heading from `roll 1` to its
  equipment tier. It also requires frame-source routing to precede the generic
  `eq && !roll` branch in both implementations, or the existing "show in the
  table" link would incorrectly move from `#/tables/frames/f1` to equipment.
- `node tools/build.js` is the required generator. `data.json` and the 94 frame
  rows' `roll` column in `catalog.csv` will change; `i/f*.html` should remain
  byte-identical because equipment subtitles derive from `eq`, while the f93/f94
  non-equipment frame consumables retain their preview ordinals in the generator.

## Do not re-fetch unless
- Human provides new info
- `context.md` is missing a fact you need
- You suspect drift vs issue or plan
