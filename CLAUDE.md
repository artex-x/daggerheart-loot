# Agent guide

## Start here

For task work, read in this order:

1. `CLAUDE.md`
2. `issues/<id>/context.md`, if present
3. `issues/<id>/plan.md`
4. `issues/<id>/handoff.md`
5. the relevant files under `docs/specs/`

Use the task id supplied by the human; issue 47 is the Svelte migration, not a
default. Reuse `context.md`; re-fetch only missing, stale, or superseded facts.
If issue evidence, specs, live behaviour, and the plan conflict, stop and surface it.

## Project shape

- The shipped app is the static root (`index.html`, `style.css`, `app.js`, `data.js`) and runs from `file://` and GitHub Pages.
- The Svelte + TypeScript rewrite lives in `app/` and builds to `dist/`.
- Pages serves the static root until the migration plan and owner perform cut-over.
- `data.js` (`window.LOOT`) is canonical. `data.json`, `catalog.csv`, and
  `i/*.html` are generated; `img/` and `og/` are managed separately.

## Engineering posture and campsite

- Prefer the smallest change that preserves behaviour and contracts.
- Reuse existing modules, ports, patterns, tokens, and naming. Do not invent
  abstractions ahead of demonstrated need.
- Add no module, export, component, or variant before something uses it.
- Extract shared UI on its second real use; remove both inline copies.
- In a touched path, fix cheap, local, safe bugs, stale tests/fixtures, and cleanup required for correctness.
- Do not use "out of scope" to avoid local fixes. Record unrelated refactors,
  redesigns, or project-wide cleanup in the handoff instead.

## Task and session protocol

Task state belongs under `issues/<id>/`:

- `context.md` - shared facts, source links, constraints, and decisions
- `plan.md` - design, ordered batches, and task status
- `handoff.md` - recovery state, completed work, checks, blockers, and next batch

When asked to continue, report status and the next batch, then wait for confirmation. Implement only that batch unless the human changes scope.

When the human says stop, handoff, or the session is ending:

1. Start no new work.
2. Leave production code at a coherent committed boundary; never commit a half-batch.
3. Update plan and handoff with decisions, deviations, partial progress,
   checks/results, blockers, and the next action.
4. Update this file only for a new standing rule or recurring mistake.

Task, branch, and environment facts belong in the handoff; durable behaviour
belongs in specs.

## Specs are the behaviour source of truth

Read the files the change touches:

| File | Authority |
|---|---|
| `docs/specs/CONTRACTS.md` | frozen routes, ids, links, generated data, asset paths |
| `docs/specs/ROUTES.md` | route and filter grammar |
| `docs/specs/STATE.md` | URL, memory, localStorage, and two-tab merge |
| `docs/specs/FEATURES.md` | product behaviour and required state |
| `docs/specs/COVERAGE.md` | suite ownership, thresholds, and known gaps |
| `docs/specs/I18N.md` | bilingual behaviour |
| `docs/specs/META.md` | `noindex`, crawling, URL-only lists, `file://`, tiers |
| `docs/parity.md` | operational parity workflow |

Public contracts default to no change. An unavoidable change updates
`docs/fixtures/`, `tests/contracts.js`, `docs/specs/CONTRACTS.md`, and `llms.txt`
in the same commit. Behaviour changes update their specs in the same commit.

## Architecture boundaries

- `app/src/lib/` is pure logic: no DOM, storage, Svelte, or network.
- Browser APIs belong behind `app/src/ports/` adapters.
- Shared UI belongs in `app/src/components/`; expose only differences real callers need.
- `styles/tokens.css` owns global colours, spacing, radii, and type steps.
  Components compose tokens; they do not invent near-duplicate values.
- Preserve relative asset paths and the classic-script data adapter required by `file://`; do not use runtime `fetch()` for local data.

## Data and published artefacts

After changing `data.js`, run `node tools/build.js` to regenerate `data.json`, `catalog.csv`, and `i/*.html`; never edit outputs as source.

When counts or source lists change, update `index.html`, both READMEs, `app.js`,
`llms.txt`, and `robots.txt`. Keep the READMEs aligned, reuse identical image
bytes, and never renumber a shipped record id.

## Quality gates

Before every commit:

```text
npm run check
```

If a change alters what a screen draws, also run:

```text
npm run check:built
```

Useful focused commands:

```text
npm run test
node tests/run-all.js
node tests/run-all.js eqtest,qa
```

Definition of done: checks pass, fixed defects and changed behaviour have
meaningful coverage, specs and fixtures match, and the handoff records exact
commands/results. If a required check cannot run, report why before committing.

Coverage is enforced per file and directory; a new file must be reached by a
test but needs no matching test filename. End component tests with
`expectNoA11yViolations`; cover meaningful pressed/open states with axe. See
`docs/specs/COVERAGE.md`.

Deterministic guards run as Claude Code hooks (`.claude/hooks/`): dangerous git
commands, writes to generated files, and a commit gate that wants a passing
`npm run check` for the current tree. They enforce; this file states intent.
See `.claude/README.md`.

## Migration and parity

- This is a refactor, not a redesign. Reproduce the shipped app's rendered
  behaviour, geometry, content, controls, and states.
- Compare computed/rendered results, not apparent source intent. Take visual
  values from the live styles or design, not from screenshot guesses.
- A state is a route plus interactions. New panels, dialogs, pickers, filters,
  and empty states add `STATES` entries in the same change.
- Every state is exercised in both languages at three widths. Pixel difference
  is zero unless recorded as explicit `VISUAL_DEBT`; debt must ratchet down.
- Record intentional accessibility differences in `ACCEPTED` with a reason.
- Inspect diff images before changing debt. Use `docs/parity.md`; migration
  backlog stays in issue 47 plan/handoff.
- A `VISUAL_DEBT` number is whatever CI measures. A local run is advisory and
  may legitimately fail a cell CI passes; see `docs/parity.md`.
- Port a rule with every `@media` override it has; a base-width-only port
  reads as growing drift, not as a constant offset.

## Product laws that look negotiable but are not

- Lists live in the URL hash and localStorage; add no backend or upload service.
- Keep `noindex` while allowing crawling; crawler blocks hide `noindex` and break previews.
- Never infer equipment tier from stats; use the source book data.
- Printing is nine 63x88 mm cards per A4 sheet. Colour and black-and-white are distinct layouts; preserve browser-measured fitting. See `FEATURES.md`.
- Print design: Figma `88Hhc89oY9Orcbvd2ok1Hx`, nodes `714-42387` (colour) and
  `3773-90792` (black-and-white). Export vectors; do not redraw them.

## Source and commit conventions

- Open issue screenshots and design nodes before visual work; they are evidence.
- Comments explain why. Source, identifiers, tests, and developer docs are English.
- Product text may be Russian; otherwise use ASCII punctuation and characters.
- Preserve unrelated working-tree changes. Commit only the coherent task scope.
- Use Conventional Commits; author as `artex-x <artex-x@users.noreply.github.com>`.
- Never push; `git push` is the repository owner's job.

## Maintaining this file

- Keep only standing laws, commands, routing, and architecture boundaries here.
- Put task status in `issues/<id>/`; put deep procedures in `docs/specs/*` or a
  skill and link them.
- Add a rule only after an agent repeats a mistake. Prefer one imperative line
  over a story.
- Keep this file under 200 lines. Move detail out instead of appending.

<!-- setup-claude-agents:begin -->
## Orchestration

Feature work uses roles (see `.claude/`):
- **planner** -> `issues/<id>/plan.md` + `handoff.md` (no production code)
- **implementer** -> next batch only; never `model: inherit` (see `.claude/README.md`)
- **reviewer** (optional) -> high-risk batches; max one remediation cycle
- **add-source** -> rare end-to-end content ingest
- **refresh-artwork** -> audited replacement-art reconciliation, conversion, verification, and optional local cache refresh

Prompts: `.claude/prompts/`. Agents: `.claude/agents/`.
Pass `TASK: <id>` at runtime. Orchestrator selects models/effort and maintains `issues/<id>/context.md` so workers do not re-fetch the same issue.
Use supported agent tools when the host provides them; otherwise run the prompt files sequentially with `issues/<id>/` as handoff.
Before completion, the orchestrator waits for workers, reconciles context/plan/handoff, preserves evidence and unrelated work, and removes only clearly disposable task-scoped scratch artifacts.
<!-- setup-claude-agents:end -->
