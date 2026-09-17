# Agent guide

## Start here

For task work read, in order: `CLAUDE.md`, then `issues/<id>/context.md`,
`plan.md` and `handoff.md`, then the `docs/specs/` files the change touches.

Use the task id supplied by the human; issue 47 is the Svelte migration, not a
default. Reuse `context.md`; re-fetch only missing, stale, or superseded facts.
If issue evidence, specs, live behaviour, and the plan conflict, stop and surface it.

## Project shape

- The shipped app is the Svelte + TypeScript rewrite: `app/` builds to `dist/`,
  which `ci.yml`'s `deploy` job publishes to Pages. It runs from `file://` too.
- The static root (`index.html`, `style.css`, `app.js`) was deleted at R0c
  (`23c00a6`); read it from history with `git show 23c00a6^ -- index.html
  app.js style.css`, never from the working tree.
- `data.js` (`window.LOOT`) is canonical. `data.json`, `catalog.csv`, and
  `i/*.html` are generated; `img/` and `og/` are managed separately.

## Engineering posture and campsite

- Prefer the smallest change that fixes the defect. Public contracts default
  to no change; behaviour is judged against `docs/specs/`, not against the
  previous build.
- Reuse existing modules, ports, patterns, tokens, and naming. Do not invent
  abstractions ahead of demonstrated need.
- Add no module, export, component, or variant before something uses it.
- Extract shared UI on its second real use; remove both inline copies.
- In a touched path, fix cheap, local, safe bugs, stale tests/fixtures, and cleanup required for correctness.
- Do not use "out of scope" to avoid local fixes. Record unrelated refactors,
  redesigns, or project-wide cleanup in the handoff instead.

## Task and session protocol

One session at a time per working tree. A second session's `npm ci`, staged
index, vitest coverage directory or browser suite run will corrupt the
first's results, and the failure looks like a bug in whatever was running.

Task state lives under `issues/<id>/`: `context.md` (shared facts and settled
decisions), `plan.md` (design, ordered batches, status), `handoff.md` (recovery
state, checks, blockers, next batch). Each has a size budget: the Stop hook
warns past it, and `.claude/skills/handoff/SKILL.md` (`/handoff`) is the
compaction and closeout procedure.

When asked to continue, report status and the next batch, then wait for confirmation. Implement only that batch unless the human changes scope.
A placed item is its own acceptance line in the batch that receives it; a
batch is not closed while an inherited line has no outcome.
A new state gets a `tests/app/inventory.js` entry and a re-seeded golden in
the same change; a defect kept on purpose gets a `docs/specs/DEBT.md` entry in
the same change.

Size a batch by its gates, not its diff: `npm run check`, `check:built` and a
golden shard or `tests/app/` filter cost the same minutes for eight paths as
for forty, so merge work that shares a component, seed and filter. Split only
at a public-contract change, a different route and filter set, or a commit the
harness cannot reach; never plan a batch whose check cannot finish one
foreground call or whose review cannot be held in one pass. Costs and the
test: `.claude/README.md`, "Batch size and the fixed cost of a run".
A plan names the criterion behind every split and states its total gate
cost; a split with no criterion is a merge.

When the human says stop, handoff, or the session is ending: start no new work,
leave code at a committed boundary (never a half-batch), and run `/handoff`.
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
| `docs/specs/DEBT.md` | live defects the rewrite reproduces on purpose, and live decisions kept over its own; owed a fix after the migration |

Public contracts default to no change. An unavoidable change updates
`docs/fixtures/`, `tests/contracts.js`, `docs/specs/CONTRACTS.md`, and `llms.txt`
in the same commit. Behaviour changes update their specs in the same commit.

## Architecture boundaries

- `app/src/lib/` is pure logic: no DOM, storage, Svelte, or network.
- Browser APIs belong behind `app/src/ports/` adapters.
- Shared UI belongs in `app/src/components/`; expose only differences real callers need.
- `app/src/styles/tokens.css` owns global colours, spacing, radii, and type steps.
  Components compose tokens; they do not invent near-duplicate values.
- Preserve relative asset paths and the classic-script data adapter required by `file://`; do not use runtime `fetch()` for local data.

## Data and published artefacts

After changing `data.js`, run `node tools/build.js`; the hooks block writes to
its generated outputs. When counts or source lists change, update the nine
files `tests/derived.js:451-453` names; keep the READMEs aligned, reuse
identical image bytes, and never renumber a shipped record id.

## Quality gates

Before every commit:

```text
npm run check
```
Agents: one foreground call, `set -o pipefail; npm run check 2>&1 | tail -n 120`, Bash timeout 600000 - see `.claude/README.md`, "Run a long check".

If a change alters what a screen draws, also run `npm run check:built`.
Focused: `npm run test`, `node tests/run-all.js`, `node tests/run-all.js contracts,dataint`.
The built app in a real browser (after `npm run build`): `node tests/run-all.js app/print,app/contracts,app/states,app/typo,app/hues,stub`.
`app/sweep` and `app/golden` are each too slow for one foreground call; run
them per width/shard - `.claude/README.md`, "Batch size and the fixed cost of
a run".

Definition of done: checks pass, fixed defects and changed behaviour have
meaningful coverage, specs and fixtures match, and the handoff records exact
commands/results. If a required check cannot run, report why before committing.

Coverage is enforced per file and directory (a new file must be reached by a
test, not by a matching filename). End component tests with
`expectNoA11yViolations`; cover pressed/open states with axe. See `docs/specs/COVERAGE.md`.

Deterministic guards run as Claude Code hooks (`.claude/hooks/`; the table is in
`.claude/README.md`, "Hooks"). They enforce; this file states intent.

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
- Push the branch once a batch's commits pass their gates; a committed boundary
  the remote never saw is one lost session away from gone.

## Maintaining this file

- Keep only standing laws, commands, routing, and architecture boundaries here.
- Task status goes in `issues/<id>/`; deep procedures go in `docs/specs/*` or a skill.
- Add a rule only after an agent repeats a mistake; one imperative line, not a story.
- Keep this file under 200 lines. Move detail out instead of appending.

<!-- setup-claude-agents:begin -->
## Orchestration

Feature work uses roles (see `.claude/`):
- **planner** -> `issues/<id>/plan.md` + `handoff.md` (no production code)
- **implementer** -> next batch only; routing: `.claude/README.md`, "Host-aware explicit routing policy"
- **reviewer** (optional) -> high-risk batches; one remediation cycle; nits defer mid-plan and clear on the terminal batch
- **add-source** -> rare end-to-end content ingest
- **refresh-artwork** -> audited replacement-art reconciliation, conversion, verification, and optional local cache refresh
- a single-file visual bug pinned to a width skips planner and review: `/small-fix` (`.claude/skills/small-fix/SKILL.md`)

Prompts: `.claude/prompts/`. Agents: `.claude/agents/`. Kickoff: `/orchestrate`.
Pass `TASK: <id>` at runtime. Orchestrator selects models; effort is the session's, set by the human. It maintains `issues/<id>/context.md` so workers do not re-fetch the same issue.
Hosts without agent tools run the prompt files sequentially with `issues/<id>/` as the handoff bus; closeout and cleanup are the orchestrate prompt's.
<!-- setup-claude-agents:end -->
