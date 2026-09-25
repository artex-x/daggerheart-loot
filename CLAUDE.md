# Agent guide

## Start here

For task work read, in order: `CLAUDE.md`, then `issues/<id>/context.md`,
`plan.md` and `handoff.md`, then the `docs/specs/` files the change touches,
and `docs/DECISIONS.md` when the change touches a recorded decision.

Use the task id supplied by the human; there is no default task. Reuse
`context.md`; re-fetch only missing, stale, or superseded facts.
If issue evidence, specs, live behaviour, and the plan conflict, stop and surface it.

## Project shape

- The shipped app is the Svelte + TypeScript rewrite: `app/` builds to `dist/`,
  which `ci.yml`'s `deploy` job publishes to Pages. It is served over HTTP only.
- The static root (`index.html`, `style.css`, `app.js`) was deleted at R0c
  (`23c00a6`); read it from history with `git show 23c00a6^ -- index.html
  app.js style.css`, never from the working tree.
- `data.js` (`window.LOOT`) is canonical. `data.json`, `catalog.csv`, and
  `i/*.html` are generated; `img/` and `og/` are managed separately.

## Engineering posture and campsite

- Prefer the smallest change that fixes the defect. Public contracts default to
  no change; behaviour is judged against `docs/specs/`, not the previous build.
- Reuse existing modules, ports, patterns, tokens, and naming. Do not invent
  abstractions ahead of demonstrated need.
- Add no module, export, component, or variant before something uses it.
- Extract shared UI on its second real use; remove both inline copies.
- In a touched path, fix cheap, local, safe bugs, stale tests/fixtures, and cleanup required for correctness.
- Do not use "out of scope" to avoid local fixes. Record unrelated
  refactors, redesigns, or project-wide cleanup in the handoff's Deferred;
  at closeout a defect goes to `docs/specs/DEBT.md`, the rest is named to
  the human and dropped.

## Task and session protocol

One session at a time per working tree, per local Supabase stack and per
hosted test project. A second session's `npm ci`, staged index, coverage
directory, browser suite, `db reset` or E2E run corrupts the first's results
or data, and the failure looks like a bug in whatever was running. Agents
write only to the test project; production is CI's or the owner's.

Task state lives under `issues/<id>/` only while the task is open:
`context.md` (shared facts and settled decisions), `plan.md` (design, ordered
batches, status), `handoff.md` (recovery state, checks, blockers, next batch).
It is scratch: nothing outside the directory may cite it, and closeout
deletes it. Durable knowledge is written to its permanent home in the batch
that establishes it - behaviour to `docs/specs/`, tooling and host facts to
`.claude/README.md`, decisions and their rejected alternatives to
`docs/DECISIONS.md`, a defect kept on purpose to `docs/specs/DEBT.md` - never
parked in a task document. Each has a
size budget: the Stop hook warns past it; `.claude/skills/handoff/SKILL.md`
(`/handoff`) is the closeout, retirement and compaction procedure.

When asked to continue, report status and the next batch, then wait for confirmation. Implement only that batch unless the human changes scope.
A placed item is its own acceptance line in the batch that receives it; a
batch is not closed while an inherited line has no outcome.
A new state gets a `tests/app/inventory.js` entry and a re-seeded golden; a
defect kept on purpose, a `docs/specs/DEBT.md` entry; both in the same change.

Size a batch by its gates, not its diff: merge work that shares a component,
seed and filter; split only at a public-contract change, a different route
and filter set, or a commit the harness cannot reach. A plan names the
criterion behind every split and states its total gate cost; a split with no
criterion is a merge. Costs and the test: `.claude/README.md`, "Batch size
and the fixed cost of a run".

When the human says stop, handoff, or the session is ending: start no new work,
leave code at a committed boundary (never a half-batch), and run `/handoff`.
A finished task is closed by auditing its directory against `/handoff`'s
durable list, moving what qualifies, deleting the directory in the task's
commit, and pushing once. No directory is exempt; a task that is planned
but not started keeps its directory until it ships.

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
| `docs/specs/META.md` | `noindex`, crawling, lists and the backend, HTTP-only build, tiers, PWA |
| `docs/specs/DEBT.md` | defects kept on purpose, grouped under the larger task that owes each |

Public contracts default to no change. An unavoidable change updates
`docs/fixtures/`, `tests/contracts.js`, `docs/specs/CONTRACTS.md`, and `llms.txt`
in the same commit. Behaviour changes update their specs in the same commit.

## Architecture boundaries

- `app/src/lib/` is pure logic: no DOM, storage, Svelte, or network.
- Browser APIs belong behind `app/src/ports/` adapters.
- Shared UI belongs in `app/src/components/`; expose only differences real callers need.
- `app/src/styles/tokens.css` owns global colours, spacing, radii, and type steps. `DESIGN.md` records the visual system those tokens express; the code wins any conflict with it.
  Components compose tokens; they do not invent near-duplicate values.
- Preserve relative asset paths and the classic-script `data.js` adapter (cached apart from the bundle, no async bootstrap); do not use runtime `fetch()` for local data.

## Data and published artefacts

After changing `data.js`, run `node tools/build.js`; the hooks block writes to
its generated outputs. When counts or source lists change, update the files
`tests/derived.js`'s `COUNT_BEARING_FILES` array names; keep the READMEs
aligned, reuse identical image bytes, and never renumber a shipped record id.

## Quality gates

Before every commit:

```text
npm run check
```
Agents: one foreground call, `rtk npm run check`, Bash timeout 600000 - see `.claude/README.md`, "Run a long check".

If a change alters what a screen draws, also run `npm run check:built`; a change under
`supabase/` or `tests/db/` also runs `npm run check:db` (on Windows through the PowerShell tool), which the commit gate requires.
Focused: `npm run test`, `node tests/run-all.js`, `node tests/run-all.js contracts,dataint`; the built app in a real browser (after `npm run build:test`): `node tests/run-all.js app/print,app/contracts,app/states,app/typo,app/hues,stub`.
`app/sweep` and `app/golden` are each too slow for one foreground call; run them per width/shard - `.claude/README.md`, "Batch size and the fixed cost of a run".

Definition of done: checks pass, fixed defects and changed behaviour have
meaningful coverage, specs and fixtures match, and the handoff records exact
commands/results. If a required check cannot run, report why before committing.

Coverage is enforced per file and directory (a new file must be reached by a
test, not by a matching filename). End component tests with
`expectNoA11yViolations`; cover pressed/open states with axe. See `docs/specs/COVERAGE.md`.

Deterministic guards run as Claude Code hooks (`.claude/hooks/`; the table is in `.claude/README.md`, "Hooks"). They enforce; this file states intent.

## Product laws that look negotiable but are not

- The Supabase backend is the only server: add no other backend, upload endpoint or paste service.
- Keep `noindex` while allowing crawling; crawler blocks hide `noindex` and break previews.
- Never infer equipment tier from stats; use the source book data.
- Printing is nine 63x88 mm cards per A4 sheet, or sixteen 44x63 mm cards on the opt-in compact sheet. Colour and black-and-white are distinct layouts on either sheet; preserve browser-measured fitting. See `FEATURES.md`.
- Print design: Figma `88Hhc89oY9Orcbvd2ok1Hx`, nodes `714-42387` (colour) and
  `3773-90792` (black-and-white). Export vectors; do not redraw them. The
  compact sheet has no node: it is each layout's card at 70%.

## Source and commit conventions

- Open issue screenshots and design nodes before visual work; they are evidence.
- Source, identifiers, tests, and developer docs are English.
- Product text may be Russian; otherwise use ASCII punctuation and characters.
- Preserve unrelated working-tree changes. Commit only the coherent task scope.
- Use Conventional Commits.
- One commit per task: the first batch commits, every later batch and the
  closeout amend it (`git commit --amend`), each amend green on its gates.
  Push once, at closeout, after the task directory is deleted. A push closes
  the amend window: never force-push in any form; work after a push is a new
  commit. A push before closeout is the human's call and costs one more commit.
  A cloud release pushes each green commit and never amends a pushed one; at
  closeout the orchestrator squash-merges it onto `main` as one commit.

## Comments

- A comment earns its place only when the code cannot say it: a reason, a
  measured constraint, a defect reproduced on purpose, a trap the next reader
  would fall into. Never what the code does, who did it, or the session
  narrative - a measurement's own date stays (`measured 2026-09-10 on this
  host`).
- Cite only what resolves from a clean checkout: a spec section, a permanent
  doc section, a commit sha (`git show <sha>:<path>` for a deleted file), or
  a GitHub issue number - never a bare batch id, a review finding id, a plan
  or handoff section, an `issues/<id>/` path, or a line number.
- One to three lines; a longer reason belongs in a spec, `docs/DECISIONS.md`
  or `.claude/README.md`, cited from the comment. The rule binds test and
  suite titles and commit messages too: a title names the behaviour and, if
  it must, the coupling it guards, never a batch id, a finding id, or a line
  number.

## Maintaining this file

- Keep only standing laws, commands, routing, and architecture boundaries here.
- Task status goes in `issues/<id>/`; deep procedures go in `docs/specs/*` or a skill.
- Add a rule only after an agent repeats a mistake; one imperative line, not a story.
- Keep this file under 200 lines. Move detail out instead of appending.

<!-- setup-claude-agents:begin -->
## Orchestration

Feature work uses roles (see `.claude/`):
- **planner** -> `issues/<id>/plan.md` + `handoff.md` (no production code);
  decisions to `docs/DECISIONS.md`
- **implementer** -> next batch only; routing: `.claude/README.md`, "Host-aware explicit routing policy"
- **reviewer** -> required when a trigger in `.claude/prompts/orchestrate.prompt.md`, "When to run reviewer (do not skip these)" fires; one remediation cycle, which also carries the batch's local nits; nits alone defer mid-plan and clear on the terminal batch
- **add-source** -> rare end-to-end content ingest
- **refresh-artwork** -> audited replacement-art reconciliation, conversion, verification, and optional local cache refresh
- a single-file visual bug pinned to a width skips planner and review: `/small-fix` (`.claude/skills/small-fix/SKILL.md`)

Prompts: `.claude/prompts/`. Agents: `.claude/agents/`. Kickoff: `/orchestrate`. Pass `TASK: <id>` at runtime. Orchestrator selects models; effort is the session's, set by the human. It maintains `issues/<id>/context.md` so workers do not re-fetch the same issue.
Hosts without agent tools run the prompt files sequentially with `issues/<id>/` as the handoff bus; closeout and cleanup are the orchestrate prompt's.
<!-- setup-claude-agents:end -->
