# Shared task context - TASK config-audit

Orchestrator maintains this file so later steps do not re-fetch the same sources.
Everything below was measured on 2026-09-15 by an orchestrated audit pass.
Treat it as settled evidence. Do not re-measure unless you suspect drift.

## Goal

Refactor this repository's Claude Code configuration for context efficiency and
maintainability, preserving existing behaviour and workflows. Plus one explicit
owner request: make planner model selection task-sensitive (Opus by default,
Fable for unusually meticulous / difficult / high-risk planning), and record
that policy in the persistent orchestration resources.

Owner approved the audit's recommendations on 2026-09-15 with "let's do
whatever you recommend to do".

## GitHub issue (if any)

- None. This is owner-initiated configuration work, not an issue.

## The audit that precedes this task

A full inventory ran on 2026-09-15 using seven subagents. Its conclusions are
the input to this plan. The headline, which shapes everything:

**The `.claude/` tree is already well factored for context efficiency.
Converting prompts into skills would make it worse.** The six prompt files cost
zero tokens in a normal session - they are read only by the worker agent
dispatched to run them, via 1-1.5 KB agent wrappers. The skill listing is a
hard budget already ~2.8x oversubscribed, and when it overflows Claude Code
drops descriptions starting with the least-invoked skills.

## Measured baseline (do not re-measure)

- `rtk gain` (global): 424 commands, 563.0K saved, 60.5%.
- `rtk discover`: 178 sessions / 19,194 Bash commands / 30 days; 40.9% handled;
  ~179.7K missed. Top misses: `grep -n` 160 calls / 61.2K; `tail -c` 144 /
  35.2K; `git commit` 206 / 26.3K; `npm run` 51 / 20.4K; `npx vitest` 6 / 11.7K.
- Always-loaded markdown: 13,308 bytes ~ 3,300 tokens.
  Project `CLAUDE.md` 10,469 B (199 lines) + global `CLAUDE.md` 1,738 +
  `RTK.md` 990 + `MEMORY.md` 111.
- Skill listing: 58 model-invocable skills, 14,705 description chars on disk,
  plus ~7,700 chars of built-ins = ~22,400 chars ~ 5,600 tokens.
  Budget is `skillListingBudgetFraction` default 0.01 = 1% of context ~ 8,000
  chars. Per-skill cap `skillListingMaxDescChars` = 1,536.
- Representative orchestrated session: ~1.12M subagent tokens
  (`.claude/improvements.md`).
- Task state: `issues/47/plan.md` 1,031,333 B / 16,012 lines;
  `handoff.md` 522,543 B / 7,671 lines; `context.md` 227,406 B / 3,701 lines.

**Re-measure date: 2026-10-15**, same commands, recorded as Finding 7 in
`.claude/improvements.md`.

## The commit-gate trap (load-bearing, verified by live test)

`CLAUDE.md:114` prescribes
`set -o pipefail; npm run check 2>&1 | tail -n 120`.

The obvious "RTK fix" is to replace it with `rtk npm run check`. **That would
silently disarm the commit gate.** Verified by feeding synthetic PostToolUse
payloads to `check-observer.mjs` with `LOOT_HOOK_STATE_DIR` sandboxing:

    ARMED      <-  npm run check
    ARMED      <-  set -o pipefail; npm run check 2>&1 | tail -n 120
    NOT ARMED  <-  rtk npm run check
    NOT ARMED  <-  npm run check   (stdout without the "All files" line)

`check-observer.mjs` arms the gate only when the first segment matches
`/^npm\s+run\s+check/` AND stdout contains `All files`. The `rtk` prefix fails
the first; RTK's output filtering removes the coverage table and fails the
second. The pipeline shape is accidentally load-bearing: RTK's global hook only
rewrites at the start of a line, so the pipeline is what stops RTK rewriting
`npm run check` at all.

**Do not change that line for RTK's sake.** The safe RTK win is `grep -n`
(61.2K) + `tail -c` (35.2K) = 96.4K of 179.7K, over half, with zero blast
radius - and it belongs in `bash-guard.mjs` as a deny, not in prose.

## Key paths

- Always loaded: `CLAUDE.md` (199 of a stated 200-line limit).
- Prompts: `.claude/prompts/{orchestrate,plan,implement,review,add-source,refresh-artwork}.prompt.md`.
  None have YAML frontmatter. None are slash commands. All are lazily read.
- Agents: `.claude/agents/{planner,implementer,reviewer,add-source,refresh-artwork}.md`.
  All are thin wrappers pointing at their prompt, but each re-states 6-10 rules
  already in the prompt and CLAUDE.md (~40 lines of duplication total).
  None declare `tools:`. None set `disable-model-invocation:`.
- Hooks: `.claude/hooks/` - 6 registered in `.claude/settings.json`, plus
  `lib.mjs` and `tree-key.mjs` (shared libraries) and `selftest.mjs`
  (111 named cases in its header comment; `node .claude/hooks/selftest.mjs`
  prints 317 individual assertions passing at runtime - different units,
  not a stale/fresh pair; run inside `npm run check` via `package.json`).
- On-demand reference: `.claude/README.md` (35 KB), `.claude/improvements.md`
  (20 KB), `docs/parity.md` (14 KB), `docs/specs/*`.
- Templates: `.claude/templates/{context,handoff}.template.md`.
- This repository declares **no plugins and no marketplaces**. Everything
  installed is at user level.

## Dead references found (fix these)

1. `.claude/README.md` has **no "Run a long check" heading** - it is a bold
   paragraph at README:113. Cited by `CLAUDE.md:114`,
   `orchestrate.prompt.md:87`, and implied by `implement.prompt.md:77`.
2. `CLAUDE.md:189` promises a "host-aware explicit routing policy" in
   `.claude/README.md`. That phrase appears nowhere in README. The nearest
   content is the unlabeled paragraph at README:13-20.
3. `CLAUDE.md:95` and `plan.prompt.md:81` cite `styles/tokens.css`.
   No `styles/` directory exists at repo root. Actual: `app/src/styles/tokens.css`.
4. `CLAUDE.md:57` cites `docs/parity.md`, "Batch size". Actual heading is
   `## Batch size and the fixed cost of a run` (docs/parity.md:218). Resolvable
   but not verbatim.
5. `.claude/README.md:335-336` cites `issues/65/plan.md`, which was retired.
   Note `bash-guard.mjs` rule 2i denies deleting a `plan.md` still cited by a
   tracked line - so those README lines would make a recreated file undeletable.
6. `issues/47/handoff.md:5976` and `context.md:572` describe `.gitleaks.toml`
   as untracked. It is tracked and clean (landed `13bba19`). Stale prose.

## Duplication found

- The long-check invocation string appears in **four** places: `CLAUDE.md:114`,
  `.claude/README.md:126`, `implement.prompt.md:77`, `orchestrate.prompt.md:81-83`.
- "Read CLAUDE.md first" is stated **16 times** across agents and prompts.
- "Do not select models" appears in all 6 prompts, all 5 agents, all 5 agent
  `description:` fields, and `CLAUDE.md:196`.
- Model defaults are triplicated: agent frontmatter, `.claude/README.md:3-9`,
  `orchestrate.prompt.md:185-187`.
- `bash-guard.mjs` already denies force-push (2b) and AI attribution (2d),
  which `CLAUDE.md:170-173` also states in prose.
- `edit-guard.mjs` already blocks the generated files that `CLAUDE.md:99-106`
  describes in prose.

## Model selection: the current state

**There is no existing Claude-side Opus-vs-Sonnet judgment to mirror.**
`orchestrate.prompt.md:186` is a flat assignment: "planner and reviewer use
`opus`; implementer, add-source, and refresh-artwork use `sonnet`". The only
judgment-shaped escalation text in the repository is Codex-only
(`orchestrate.prompt.md:201-207`). A task-sensitive planner rule would be the
**first** Claude-side conditional, not a parallel to an existing one.

Constraints any such rule must live inside:
- `orchestrate.prompt.md:184` - "Agents must not choose models or effort."
- `orchestrate.prompt.md:207` - "Never write it into plan.md or handoff.md."
- `review.prompt.md:117` - "Do not write model routing into markdown files."
  So the new text must be phrased as **policy in the orchestrator prompt**, not
  as a per-task record.
- `orchestrate.prompt.md:175-180` - "a resume carries no `model`". A tier can
  only change on a fresh dispatch, never on a resume.

Every location that names model selection, and would need to stay consistent:
`.claude/agents/*.md` (frontmatter `model:` and `description:` on all five),
`.claude/README.md:3-9` and `:13-20` and `:48` and `:57-58`,
`orchestrate.prompt.md:183-207`, `plan.prompt.md:19-22`,
`implement.prompt.md:18-19`, `review.prompt.md:14,117`,
`add-source.prompt.md:16`, `refresh-artwork.prompt.md:12`,
`CLAUDE.md:189,196`.

### Fable history - read this before writing the rule

`issues/47/context.md:3478` records, 2026-09-12: "Fable is unavailable (owner,
this session). `.claude/agents/planner.md` already carries `model: opus`, so the
planner runs at its real documented tier with no per-dispatch override; the
agent and orchestrator prose are corrected to stop naming Fable as the default."

**The owner confirmed on 2026-09-15 that Fable is available again**, and asked
for it to be used for this task's planning and written into the policy as a
conditional escalation - not as a default. The 2026-09-12 correction stands for
the default; only the escalation path is new.

## Installed at user level (this repo installs nothing)

- Plugins: `i-have-adhd` v0.3.0 (git marketplace), plus desktop-app plugins
  `pdf-viewer`, `design`, `engineering`, `cowork-plugin-management`,
  `typescript-lsp`, and an inline `anthropic-skills` bundle (39 skills).
- Skill descriptions by source: `anthropic-skills` 8,843 chars (38 invocable),
  `engineering` 2,538 (10), `design` 1,825 (7), `cowork-plugin-management` 631
  (2), `pdf-viewer` 278 (1), user-dir ast-grep pair 590 (2).
- `i-have-adhd` and `setup-cowork` already set `disable-model-invocation: true`.
- 20 of the `anthropic-skills` entries are resume/career skills (1,474 chars),
  byte-identical copies from `ResumeSkills.git`, irrelevant to this project.
- `docx`+`pptx`+`xlsx` alone are 2,939 chars - 20% of the measured budget.
- `~/.claude.json` `skillUsage` records only four skills ever used:
  `claude-api`, `doctor`, `schedule`, `update-config`.
- User-level hooks: one, `PreToolUse`/`Bash` -> `rtk hook claude`. The project
  hooks know nothing about RTK and do not coordinate with it.
- No user-level agents directory exists.

## ast-grep

`ast-grep 0.45.3` is installed and on PATH. `rtk --help` confirms **RTK does
not wrap `ast-grep`** - its output is unfiltered, so prefer ast-grep's own
compact output modes and never post-filter it with a pipe (a pipe defeats the
RTK hook for any wrapped command in the same line).

`ast-grep` appears in **0 of 19,194 commands** over 30 days, and in zero files
under `.claude/` or `CLAUDE.md`. But the global `~/.claude/CLAUDE.md` **already
tells the model to prefer it**. An instruction present and ignored 19,194 times
is not a prose problem. Do not solve it by adding prose to this repository.

## Command costs

| Command | Wall clock | Fits one call? |
|---|---|---|
| `npm run check` | ~165s idle host; past 600s under load | yes, on an idle host |
| `npm run check:built` | a few minutes | yes |
| `node tests/parity.js "<filter>"` | up to ~9 min for a large filter | barely |
| `node tests/run-all.js parity` | ~867s single job; 4-way shard on CI | **no** |

`npm run check` is a nine-step chain ending in `vitest run --coverage`, and it
includes `node .claude/hooks/selftest.mjs`. **Any change to a hook must pass
selftest**, which has 111 named cases in its header comment and prints 317
individual assertions passing at runtime (`config-audit` B2, 2026-09-16).

This task changes no rendered screen, so `check:built` and parity are **not**
required unless the plan touches app source. Say so explicitly in the handoff.

## Which machine is authoritative

- For recorded numbers: this Windows host for RTK and byte counts; CI (ubuntu)
  for any parity number (not applicable to this task).
- A difference on another machine: for skill-listing chars, none expected -
  it is a byte count on disk.

## Reasons already disproved

- **"Convert the prompts to skills to save context."** Refuted: the prompts are
  never in context. They are read on dispatch by the worker. Converting them
  moves zero-cost files into an over-budget listing.
- **"`rtk npm run check` removes the need for the pipeline."** Refuted by live
  test - it disarms the commit gate. See above.
- **"Add an ast-grep preference rule to this repo's CLAUDE.md."** Refuted: the
  rule already exists globally and has been ignored 19,194 times.
- **"Install superpowers / mattpocock-skills to replace our prompts."**
  Refuted on context arithmetic (14 and 25 descriptions added, zero of ours
  retired) and on conflict: superpowers ships a SessionStart hook injecting
  mandatory-workflow directives, and `using-git-worktrees` fights CLAUDE.md's
  "One session at a time per working tree".
- **"Install Playwright MCP."** Refuted: `issues/47/plan.md:11534` - "There are
  no Playwright tests, and never were." Rejected three times on record.
- **"Install claude-markdown-health-check."** 46 stars, 2 contributors, zero
  issue history; ships executing scripts. It would not have found the
  commit-gate trap, which needed measured command data and a live hook test.
- **Finding 4 in `.claude/improvements.md` (the usage nudge)** was built,
  measured and withdrawn at `79e26c9`: "Do not rebuild it."

## Constraints

- `CLAUDE.md` is at 199 of its stated 200-line limit. Any addition needs a
  matching deletion.
- `CLAUDE.md:184-199` sits inside `<!-- setup-claude-agents:begin -->` /
  `<!-- setup-claude-agents:end -->` markers. External tooling may regenerate
  that block. Do not hand-edit it without checking what owns it.
- Issue 47 is in flight and two batches from done (R0b planning, then R0c
  deletions). R0c will delete `CLAUDE.md`'s migration section, the static root,
  `docs/parity.md`, and will edit `.claude/hooks/edit-followup.mjs` and
  `.claude/prompts/add-source.prompt.md`. **Do not collide with R0c's list.**
- The persistence design (held outside this repo,
  `OneDrive\Desktop\DAGGERHEART-LOOT-PERSISTENCE-DESIGN.md`, revised
  2026-09-08) supersedes the no-backend, hash-only-list and `file://` laws -
  but only at its Phase 0, which runs after 47 closes. **Do not relax those
  laws now.** Its section 17.4 already specifies the configuration changes the
  persistence era needs; align with it rather than re-deriving it.
- Land this at a committed boundary between 47 batches, never mid-batch. The
  tree is at such a boundary now: `main`, HEAD `2d2e983`, only untracked
  `issues/tg-preview-refresh/` and this task's own directory.

## Do not re-fetch unless

- Human provides new info
- context.md is missing a fact you need
- You suspect drift vs the repository

## Facts added by the planner (2026-09-15)

- The `<!-- setup-claude-agents -->` markers in `CLAUDE.md` arrived in
  `29f8920 chore: add agent wiring, shared context, and orchestration loop`,
  this repository's own initial wiring commit. Nothing outside the repo on
  this host references the marker (searched `~/.claude`, excluding session
  transcripts), no commit message names a generator, and
  `issues/agent-effort/plan.md:382` records that the block "has been
  hand-edited before; edit in place". The block is hand-owned.
- `.claude/skills/` is **untracked as a directory** (`?? .claude/skills/`)
  and holds the owner's local `impeccable/` skill (SKILL.md 11.6 KB,
  `reference/`, `scripts/`), which the gitignored `settings.local.json`
  hooks reference. It is model-invocable and not in the count of 58 above.
  New project skills are staged by name; `impeccable/` stays untracked.
- `rtk --help` (2026-09-15): `rtk grep`, `rtk rg` and `rtk read` exist, so
  the deny messages can name them.
- `bash-guard.mjs`'s `READERS` set skips `grep` and `tail` for every rule
  (`segmentInfo` returns null), so a `grep -n` rule must tokenise the
  segment itself and test the program token only.
- R0c's `CLAUDE.md` list (`issues/47/plan.md:14711-14714`) cites sections
  by name: "Migration and parity" goes; "Project shape" and "Quality gates"
  lose the live app and parity harness; the spec table loses
  `docs/parity.md`; a placement rule goes in. `issues/47/handoff.md:326-327`
  lists `edit-followup.mjs`, `selftest.mjs` and `add-source.prompt.md` under
  commit `a7f8787` (C3, landed), not under R0c.
- The persistence design's 17.4 (line 1937 of the desktop document) names
  the audit prompt as `docs/agent-audit.v6.prompt.md`; no such file exists
  in the repository.
- The Agent tool's `model` enum on this host, observed in this session's
  tool schema: `sonnet | opus | haiku | fable`.
