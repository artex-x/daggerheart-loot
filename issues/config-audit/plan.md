# Plan - TASK config-audit

Claude Code configuration refactor for context efficiency and maintainability,
plus the owner's task-sensitive planner-tier request. Local task id; no GitHub
issue. Read `context.md` first (settled measurements, the commit-gate trap,
disproved reasons), then this file, then `handoff.md`.

Planner pass 2026-09-15 (mode A: no prior plan). Three batches, all landing at
the committed boundary the tree sits on now (`main`, HEAD `2d2e983`). B1 and
B2 are markdown-only and commit-gate exempt; B3 changes two hooks and pays
one `npm run check`. No batch touches app source, so `check:built` and
parity are not required by any batch here.

## 1. Objective and current state

Turn the approved audit recommendations A-I (`context.md`, "Goal"; the
dispatch message) into ordered, implement-ready batches without changing
any behaviour a worker or hook has today, except where a recommendation says
so. Current state: `.claude/` is well factored (prompts cost zero context;
wrappers 1-1.5 KB each); `CLAUDE.md` is at 199 of 200 lines; six references
are dead; the skill listing is ~2.8x over budget at user level; issue 47's
task state is 1.78 MB; RTK misses `grep -n` and `tail -c` for 96.4K of
179.7K tokens per 30 days.

## 2. Scope and non-goals

In scope: A dead references; B `CLAUDE.md` trim; C agent wrappers and the
reviewer allowlist; D three manual skills; E task-state budget in
`session-stop.mjs`; F `bash-guard.mjs` deny for `grep -n` / `tail -c`; G
planner escalation policy and reconciliation of every model-selection
location; H Finding 7; I persistence-era items decided, not installed.

Non-goals, each with the reason it stays out:

- Compacting `issues/47/*` - decision D4 below.
- Anything on R0c's list: `CLAUDE.md` "Migration and parity", "Project
  shape", the parity rows of "Quality gates" and the spec table, the static
  root, `docs/parity.md`, `.claude/hooks/edit-followup.mjs`,
  `.claude/prompts/add-source.prompt.md` (`issues/47/plan.md:14707-14714`).
- The `npm run check` invocation and `check-observer.mjs` - the commit-gate
  trap (`context.md`).
- User-level skills and plugins (the 20 resume skills, `docx`/`pptx`/`xlsx`)
  - not this repository's files; noted for the owner in `handoff.md`, Deferred.
- The owner's untracked `.claude/skills/impeccable/` - retained, untouched.
- Converting prompts to skills, `rtk npm run check`, ast-grep prose,
  superpowers, Playwright MCP, markdown-health-check, Finding 4 - all
  disproved in `context.md`; do not reopen.

## 3. Decisions

**D1 - the `setup-claude-agents` marker block is hand-owned.** The markers
arrived in `29f8920 chore: add agent wiring, shared context, and orchestration
loop`, this repository's own initial wiring commit. No file outside this repo
on this host references the marker (searched `~/.claude`, excluding session
transcripts), no commit message names a generator, and `issues/agent-effort/`
edited the block in place on 2026-09-11 ("has been hand-edited before; edit in
place"). The markers are vestigial and harmless; keep them, edit inside them,
and record the ownership in `.claude/README.md` so nobody asks again.

**D2 - `CLAUDE.md` goes to 181 lines, not 148.** The audit's 148 assumed
moving "Migration and parity" (20 lines) into a `/parity` skill. Rejected
(D3), so the trim is the 18 lines that a hook now enforces deterministically,
a list duplicated verbatim in `.claude/README.md`, or a wrapped sentence that
reads the same on one line. Every line kept was kept for a recorded reason:
the one-session rule (fifteen peers on one tree, 2026-09-10), the batch-size
paragraph (cited by `docs/parity.md:220`), the definition of done, the
campsite rules, the push rule (`6e05a11`), the product laws. After R0c
deletes its twenty lines and the parity clauses, the file sits near 155,
which is the headroom the persistence era needs (section 5: net +6 to +8).
The exact text is `mocks/CLAUDE.proposed.md`; `diff` against `CLAUDE.md`
shows only the intended sections.

**D3 - no `/parity` skill.** R0c's plan already says "Migration and parity"
(twenty lines) goes" (`issues/47/plan.md:14711`); an implementer that finds
the section already gone hits a plan/file mismatch and must stop. A skill
created to be deleted two batches later is churn, and a manual skill is not
loaded unless invoked, so moving the rules out of the always-loaded file is
exactly relaxing them for the 47 sessions that still need them.

**D4 - install the budget; do not compact issue 47 in this task.** Three
reasons. (a) 47 is in flight, two batches from done, and R0c's own closeout
marks the files historical - the right moment to collapse them is that
commit, by the session that knows which measurements are still load-bearing,
not a config task touching a 1 MB design it did not write. (b) Compacting
1.78 MB is judgment work, not mechanical; it cannot be handed to a cheaper
model as a step list, which is what every batch here must be. (c) The
counter-argument at `issues/47/plan.md:14784` - "three of this migration's
worst hours were spent re-deriving facts a previous session had already
measured" - is an argument for keeping *measurements*, and the budget's
never-drop list keeps exactly those: decisions with reasons, rejected
approaches, blockers, the next batch, exact check results, and any measured
fact not re-derivable from the repo. What the always-drop list removes is
pre-implementation briefs for batches that shipped (the code and its specs
are the record), superseded status snapshots, and file contents the commit
holds - none of which is a measured fact. So the answer to :14784 is the
list, not an exemption for 47. Consequence: while 47 stays large, every 47
session that writes into `issues/47/` gets one budget warning per session
(deduped); that is two remaining batches. The compaction itself is recorded
in `handoff.md`, Deferred, as an item for R0c's closeout, since this task
writes nothing into `issues/47/` beyond the two stale sentences in B1.

**D5 - the RTK deny matches the program token, in every shape.** `READERS`
in `bash-guard.mjs` hides `grep` and `tail` from every rule on purpose
(`echo git reset --hard` must stay silent), so the new family tokenises the
segment itself and tests `tokens[0]` only: `echo grep -n`, `git grep -n`
(closeout step 6 depends on it) and `rtk grep -n` never match. It denies a
line-start `grep -n` too, which RTK's own hook would have rewritten; the
retry (`rtk grep -n`) is one token and works in every shape, and the
measured miss is the piped and `$(...)` shapes RTK cannot reach. Fallback if
that retry proves noisy: exempt a single-segment, single-line command - a
row in the README candidates table, not a deletion. `tail -n 120` (the
canonical check invocation) is not `-c` and gets an explicit silent case.

**D6 - the budget warning is scoped to the author and never blocks.**
`session-stop.mjs` measures the active task's three documents only when the
session wrote a path under that task's directory - the session that wrote
the file is the one that can act; a bystander gets nothing. Thresholds:
150 KB warn, 300 KB name the collapse action per file. Output is `warn()`
(`systemMessage` only; no `decision` key exists in this hook and a selftest
asserts it stays that way). Rejected: a `PreToolUse(Write)` deny on size
(it would block the closeout write that fixes the problem); a `SessionStart`
notice (the writer is who needs it, at the moment of writing).

**D7 - reviewer gets `tools: Read, Grep, Glob, Bash`.** Bash stays for
`git status`/`diff`/`log` and focused checks; `permissionMode: plan` stays;
Edit, Write, NotebookEdit, Agent and ToolSearch drop out deterministically,
which also closes README row 36 (a reviewer cannot load `SendMessage` without
`ToolSearch`). The key is documented but unverified on this desktop host, so
B2's acceptance carries a probe and the README row says "unverified" until
the probe result is written in.

**D8 - planner escalation is a named test, not a default.** Policy text in
B2. `planner.md` stays `model: opus`. Fable is chosen for one dispatch only
when the orchestrator names which of three tests the GOAL meets, in chat; no
named test means `opus`. This is the first Claude-side conditional in the
repository (`context.md`, "Model selection"), so the tests are written to
fail closed: size, hurry and availability are listed as non-reasons.

**D9 - the three skills are manual (`disable-model-invocation: true`) and
cite their own path.** A manual skill cannot be invoked by the model, so the
hook message and `CLAUDE.md` name the file path as well as the slash name;
any agent follows the procedure by reading it. Zero listing cost.

**D10 - Finding 7 is appended at the end of `.claude/improvements.md`,
after "Suggested batching".** The file's findings are numbered sections and
the preamble is a dated status paragraph; both conventions are kept. One
sentence joins the preamble; `Status, updated` moves to 2026-09-15.

**D11 - persistence-era items are decided here and installed at Phase 0.**
Section 5. Nothing is written into a hook or `CLAUDE.md` today except the
README row that records the decision and its trigger.

**D12 - the two stale `.gitleaks.toml` sentences in `issues/47/` are edited
in place, minimally.** Two sentences, historical context, not R0c's list;
editing is not retiring.

## 4. Target structure: durable or provisional

| Element | Status | Changes when |
|---|---|---|
| `CLAUDE.md` "Start here", "Engineering posture", "Source and commit conventions", "Maintaining this file", "Orchestration" block | durable | - |
| `CLAUDE.md` "Task and session protocol" | durable; the one-session sentence gains the shared database | persistence Phase 0 |
| `CLAUDE.md` "Project shape", "Quality gates" parity clauses, spec-table `docs/parity.md` row, "Migration and parity" | provisional, R0c's | issue 47 R0c |
| `CLAUDE.md` "Architecture boundaries" `file://` clause; "Project shape" "runs from `file://` too"; "Product laws" bullet 1 (hash + localStorage, no backend) | provisional | persistence Phase 0, recorded in `docs/specs/DEBT.md` |
| `CLAUDE.md` "Data and published artefacts" | durable; its file list is B14/R0c's to edit | issue 47 |
| `.claude/skills/orchestrate`, `.claude/skills/handoff` | durable | - |
| `.claude/skills/small-fix` | durable; its parity-filter clause is provisional | R0c (drop the clause) |
| `.claude/agents/*.md` (thin wrappers), reviewer `tools:` | durable | - |
| `orchestrate.prompt.md` "Planner tier" | durable policy | - |
| `bash-guard.mjs` 2j, `session-stop.mjs` budget, selftest cases | durable | - |
| `edit-guard.mjs` applied-migration rule, gitleaks-on-commit hook, RLS gate, migration-reversibility gate | decided, not installed | persistence Phase 0 |
| `.claude/README.md` rows 41-44, "Skills", "Run a long check", "Host-aware explicit routing policy" | durable | - |
| `.claude/improvements.md` Finding 7 | durable record | re-measured 2026-10-15 |
| `issues/config-audit/` | task state | retired per closeout when done |

## 5. Persistence era: decided now, activated at Phase 0

Trigger for every row: **the start of persistence Phase 0**, which runs after
issue 47 closes at R0c (`DAGGERHEART-LOOT-PERSISTENCE-DESIGN.md`, sections
17.4 and 18, revised 2026-09-08). Not a date; not this task. Aligned with
17.4's table, not re-derived. Superseded contracts are recorded in
`docs/specs/DEBT.md` under a new heading, "Contracts superseded by the
persistence design", in the same commit that edits `CLAUDE.md`,
`docs/specs/CONTRACTS.md`, `docs/fixtures/`, `tests/contracts.js` and
`llms.txt` (the standing contract-change rule).

| Item | Mechanism decided | Where it goes | Why a gate, not judgement |
|---|---|---|---|
| Supersede the no-backend / hash-only-list law and the `file://` clauses | edit `CLAUDE.md`: "Product laws" bullet 1, "Architecture boundaries" last bullet, "Project shape" first bullet; DEBT.md entry names the old text and the design section that replaces it | `CLAUDE.md`, `docs/specs/DEBT.md`, CONTRACTS/fixtures/llms.txt | until then those laws protect 47 |
| RLS policy verification | a **gate**: negative tests against the local Supabase stack (anon reads no other user's rows; service role never reaches the client) wired into `npm run check`, so the existing commit gate (`check-observer.mjs` + rule 2e) covers it with no new hook | `package.json` check chain, `tests/` | an RLS mistake does not fail a test, it leaks data |
| Migration reversibility | a **gate** in the same chain: every migration under `supabase/migrations/` has a reversal or is proven additive by a test that applies up, down, up | `tests/`, `package.json` | "additive while two frontend versions are open" is a rule tooling enforces |
| Applied migrations never edited in place | `edit-guard.mjs` `DENY` entry: path under `supabase/migrations/` listed in the applied manifest the apply step writes | `.claude/hooks/edit-guard.mjs`, selftest cases | same class as the generated-file guard |
| Secrets hygiene, `VITE_` boundary | `bash-guard.mjs` family on a `git commit` segment: run gitleaks over the staged diff with `.gitleaks.toml`; deny on findings; `speak` (not deny) when gitleaks is not on PATH so a missing control is visible; raise the hook timeout in `settings.json` only if measured slower than 10 s | `.claude/hooks/bash-guard.mjs`, `settings.json`, selftest | today `.gitleaks.toml` runs in CI only (`ci.yml:154`); before any service-role key exists |
| One session per working tree, extended to the shared database | one sentence added to `CLAUDE.md` "Task and session protocol": a second session on the same Supabase project corrupts the first's data and the failure looks like an application bug | `CLAUDE.md` | prose, because the hook has no input for it |
| Authenticated CI credentials | CI secret plus a documented failure mode | `ci.yml`, README | Phase 2, per 17.4 |

Nothing above is installed early: a dormant gate guards nothing and a Postgres
skill installed now spends listing budget until Phase 0 (17.4's second
ordering constraint). Note for the owner: 17.4 names the audit prompt as
`docs/agent-audit.v6.prompt.md`; no such file exists in the repository (the
prompt is on the desktop as `audit.prompt.md`). The design document is outside
this repo, so this plan records the mismatch and does not fix it.

## 6. Model selection: every location, reconciled

| Location | Today | After B2 |
|---|---|---|
| `.claude/agents/*.md` frontmatter `model:` and descriptions | planner/reviewer `opus`, writers `sonnet`; descriptions name Claude and Codex defaults | unchanged |
| `.claude/README.md:3-9` table | frontmatter defaults | unchanged |
| `.claude/README.md:13-20` | Claude hosts use frontmatter defaults; Codex mapping | + one sentence: planner may be escalated to `fable` for one dispatch under the named tests in the orchestrate prompt; frontmatter stays `opus`; a resume keeps its tier |
| `.claude/README.md:48, 57-58` | "a send carries no model; escalation is a fresh dispatch" | unchanged; the policy cites it |
| `orchestrate.prompt.md:183-207` | flat assignment + Codex ladder | + "Planner tier" subsection (B2 text) |
| `plan.prompt.md:19-22`, `implement.prompt.md:18-19`, `review.prompt.md:14,117`, `add-source.prompt.md:16`, `refresh-artwork.prompt.md:12` | "do not select models" | unchanged - the policy is the orchestrator's |
| `CLAUDE.md:189` | dead "host-aware explicit routing policy" reference | cites the new README heading (B1) |
| `CLAUDE.md:196` | "Orchestrator selects models" | unchanged |
| `issues/agent-effort/plan.md:357-360` | historical mention of Fable as planner | untouched (done task) |

## 7. Batches

### B1 - always-loaded prose: `CLAUDE.md` trim, dead references, three manual skills - implement-ready

**Status: landed, `779fae6`.** Markdown-only; commit-gate exempt (`isExempt`: every
path is `issues/`, `.md`, or `.claude/README.md`, which is not root
`README.md`).

**Objective.** Land recommendations A (dead references 1-6), B (the trim,
per D2/D3), D (the skills, per D9), and the `CLAUDE.md`/prompt hooks those
need, in one `docs(claude)` commit.

**In scope.** `CLAUDE.md`; `.claude/README.md` (two headings, one section,
two rows); `.claude/prompts/plan.prompt.md:81`; `.claude/prompts/
orchestrate.prompt.md` (one route bullet, one closeout sentence);
`.claude/templates/handoff.template.md` (one comment line);
`.claude/skills/{orchestrate,handoff,small-fix}/SKILL.md`;
`issues/47/handoff.md:5975-5981` and `issues/47/context.md:571-573` (two
sentences). **Out of scope.** Agents, the model policy, hooks, Finding 7 (B2,
B3); anything in section 2's non-goals.

**Files to create.** `.claude/skills/orchestrate/SKILL.md`,
`.claude/skills/handoff/SKILL.md`, `.claude/skills/small-fix/SKILL.md` -
copied from `issues/config-audit/mocks/skills/<name>/SKILL.md`. **Files to
edit.** `CLAUDE.md` (replace with `mocks/CLAUDE.proposed.md`),
`.claude/README.md`, `.claude/prompts/plan.prompt.md`,
`.claude/prompts/orchestrate.prompt.md`, `.claude/templates/handoff.template.md`,
`issues/47/handoff.md`, `issues/47/context.md`.

**Constraints.** `.claude/skills/` is untracked and holds the owner's local
`impeccable/` (referenced by the ignored `settings.local.json`): stage the
three new `SKILL.md` files **by name**; never `git add .claude/skills`. The
marker block in `CLAUDE.md` is edited in place (D1). `CLAUDE.md` stays
hand-wrapped and ASCII; `.md` is prettier-ignored, so nothing reformats it.
The four-place invocation string (`set -o pipefail; npm run check 2>&1 |
tail -n 120`) is not touched anywhere.

**Steps.**

1. `cp issues/config-audit/mocks/CLAUDE.proposed.md CLAUDE.md`. Then
   `diff` against `git show HEAD:CLAUDE.md` and confirm the only changed
   sections are: Start here; Task and session protocol; Architecture
   boundaries (the `tokens.css` path only); Data and published artefacts;
   Quality gates (the last two paragraphs only); Source and commit
   conventions (last bullet removed); Maintaining this file; Orchestration.
   "Project shape", "Specs", "Migration and parity", "Product laws" and line
   114 are byte-identical to HEAD. `wc -l CLAUDE.md` prints 181.
2. `.claude/README.md`:
   - Insert a heading line `## Host-aware explicit routing policy` plus a
     blank line immediately before the paragraph that starts `Claude hosts
     use the frontmatter defaults above` (line 13 today). This is the target
     of `CLAUDE.md`'s implementer bullet.
   - After the `Kickoff:` block (line 32 today) and before `## Resuming a
     worker`, insert:

     ```
     ## Skills

     Three project skills, all manual (`disable-model-invocation: true`),
     so they cost nothing in the skill listing and are followed by reading
     the file when an agent needs them:

     | Skill | File | Owns |
     |---|---|---|
     | `/orchestrate` | `skills/orchestrate/SKILL.md` | one pointer to `prompts/orchestrate.prompt.md` |
     | `/handoff` | `skills/handoff/SKILL.md` | session closeout, the task-state size budget (150 KB warn, 300 KB collapse), the never-drop and always-drop lists, per-file collapse actions, retirement |
     | `/small-fix` | `skills/small-fix/SKILL.md` | a single-file visual bug pinned to a width: reproduce at that width first, then fix, every gate, commit; no planner, no `context.md`, no review |

     `.claude/skills/` is untracked as a directory because it also holds
     owner-local tools; the three files above are tracked by name.

     The `<!-- setup-claude-agents -->` markers around `CLAUDE.md`'s
     Orchestration section came from `29f8920`, this repository's own
     wiring commit; no generator on this host reads them. The block is
     hand-owned and edited in place.
     ```
   - Replace the bold lead-in at line 113 (`**Run a long check so the gate
     can see it pass, and so you can read the result.** \`check-observer.mjs\`
     reads`) with a heading line `### Run a long check`, a blank line, and
     `So the gate can see it pass, and so you can read the result:
     \`check-observer.mjs\` reads` continuing the same paragraph. This is
     the heading `CLAUDE.md:114`, `orchestrate.prompt.md:87` and
     `implement.prompt.md:77` already cite.
   - Rows 39 and 40 (lines 335-336): replace each literal
     `` `issues/65/plan.md` `` with `issue 65's retired \`plan.md\`` (row 39:
     "The ten dead citations to ..."; row 40: "ten of them shipped this way
     for ..."). Leave the row-40 citations of `issues/hooks-guardrails/plan.md`
     and `issues/agent-effort/plan.md` alone - those files exist and the
     sentence says the rule is meant to fire on them.
3. `.claude/prompts/plan.prompt.md:81`: `styles/tokens.css` ->
   `app/src/styles/tokens.css`.
4. `.claude/prompts/orchestrate.prompt.md`:
   - In "Route the GOAL", add a final bullet: `- **Single-file visual bug
     pinned to a width**: the human runs \`/small-fix\`
     (\`.claude/skills/small-fix/SKILL.md\`) - no planner, no \`context.md\`,
     no review, every gate. Anything wider is the feature path.`
   - In "Task closeout and cleanup" step 2, append one sentence: `If the
     Stop hook named a task document over its size budget, compact it per
     \`.claude/skills/handoff/SKILL.md\` before reporting.`
5. `.claude/templates/handoff.template.md`: after line 1, add
   `<!-- Status is a snapshot: replace it, never append. Budget and
   compaction: .claude/skills/handoff/SKILL.md -->`.
6. Create the three skills by copying from `mocks/skills/`. Read each after
   copying; the frontmatter must be exactly `name`, `description`,
   `disable-model-invocation: true`, `argument-hint`.
7. `issues/47/handoff.md:5975-5981`: replace `**Already being handled outside
   this session** - an untracked \`.gitleaks.toml\` sits in the working
   tree, written by another session, extending` with `**Handled outside
   this session** - \`.gitleaks.toml\` (tracked; landed \`13bba19\`)
   extends`, and `The orchestrator left it untouched and uncommitted. **Do
   not duplicate that work**; check whether it has landed` with `**Do not
   duplicate that work**; it has landed`. Read the surrounding sentence
   after editing so it still parses. `issues/47/context.md:571-573`:
   replace `Another session is already fixing that with an untracked
   \`.gitleaks.toml\` - see \`handoff.md\`, "Blockers". Do not duplicate
   it.` with `Fixed by \`.gitleaks.toml\` (tracked; landed \`13bba19\`).`
8. Verify (below), then stage by name and commit:
   `docs(claude): trim CLAUDE.md, repair dead references, add manual skills`.
   Push.

**Acceptance criteria.**

- `wc -l CLAUDE.md` = 181; `diff <(git show HEAD~1:CLAUDE.md) CLAUDE.md`
  touches no line of "Project shape", "Specs are the behaviour source of
  truth", "Migration and parity", "Product laws", or line 114.
- `git grep -n "Run a long check" -- ':!issues'` finds the README heading
  and the three citations, and the README hit is a `###` line.
- `git grep -n "Host-aware explicit routing policy" -- ':!issues'` finds the
  README heading and `CLAUDE.md`.
- `git grep -n "styles/tokens.css" -- ':!issues'` returns only paths that
  read `app/src/styles/tokens.css` (`DEBT.md:218` and `Shell.svelte:184`
  are prose mentions inside `app/src`-relative context; leave them).
- `git grep -n "issues/65/plan.md" -- ':!issues'` returns only
  `.claude/hooks/selftest.mjs` fixture lines (accepted: a scratch-repo
  fixture must name some path; the README's two narrative mentions are gone).
- `git grep -n '"Batch size"' CLAUDE.md` returns nothing; the citation reads
  `"Batch size and the fixed cost of a run"`.
- `git grep -n "untracked \`.gitleaks.toml\`" issues/47` returns nothing.
- The three `SKILL.md` files exist, are tracked, and each has
  `disable-model-invocation: true`; `git status --porcelain .claude/skills`
  still shows `impeccable/` untracked and nothing else of it staged.
- `CLAUDE.md` "Task and session protocol" names `/handoff` with its path;
  "Orchestration" names `/small-fix` with its path and `/orchestrate`.
- Every deleted `CLAUDE.md` line is either enforced by a hook (`git push
  --force`, generated outputs), present in the skill that replaced it
  (closeout steps 1-4), or a wrap of a sentence that survives.

**Verification commands.** The greps above; `wc -l CLAUDE.md`;
`node .claude/hooks/selftest.mjs` (unchanged hooks, expected 111 pass - run
it because the README rows changed and row 40's text is quoted nowhere in
the tests, so this only proves nothing else broke); no `npm run check` is
required (no covered path changes), and the commit gate will not ask for
one.

**Risks / do-nots.** Do not "fix" `CLAUDE.md:114`'s invocation or cite RTK
there. Do not touch "Migration and parity" even to re-wrap. Do not add
`.claude/skills/` wholesale. Do not renumber README candidate rows. Do not
edit `issues/47/plan.md`. If the `diff` in step 1 shows a change outside the
listed sections, stop: the mock and HEAD have drifted, and the planner
re-derives the mock before B1 continues.

### B2 - agent wrappers, reviewer allowlist, planner-tier policy, Finding 7 - outline

**Status: landed, `d61aadb`.** Markdown-only; gate exempt. Independent of B3.

**Objective.** Recommendations C, G, H. One `docs(agents)` commit.

**Files.** `.claude/agents/{planner,implementer,reviewer,add-source,refresh-artwork}.md`;
`.claude/prompts/orchestrate.prompt.md` (policy subsection);
`.claude/prompts/plan.prompt.md` (one line moved in from the wrapper);
`.claude/prompts/implement.prompt.md:38` (one clause moved in);
`.claude/README.md:13-20` (one sentence) and candidates rows 41-42;
`.claude/improvements.md` (preamble sentence, `Status, updated`, Finding 7).

**Wrapper rule mapping** - a wrapper line is deleted only where the prompt
already carries it; the two that are not are moved into the prompt:

| Wrapper line | Prompt line that carries it |
|---|---|
| all: read `CLAUDE.md` first; read `context.md`; follow the prompt; TASK id from the dispatch; do not select models | `plan.prompt.md:17,22,26-27`; `implement.prompt.md:16,19,24-25`; `review.prompt.md:13-14,18-20`; `add-source.prompt.md:15-16,35` (verify the `context.md` line by grep; if absent, add it after :35); `refresh-artwork.prompt.md:12` (verify the `context.md` line; if absent, add it under "Discover inputs") |
| planner 5: write only under `issues/<TASK_ID>/` | **moved**: add after `plan.prompt.md:14`: `Write only under \`<TASK_DIR>/\` (\`plan.md\`, \`handoff.md\`, optional \`mocks/\`; refresh \`context.md\` with durable facts).` |
| planner 6, 9 | `plan.prompt.md:139,147`; `:76` |
| implementer 5, 6, 7, 8, 9 | `implement.prompt.md:36-39`; `:49`; `:43`; `:82-83`; `:68-72` |
| implementer 11: another batch mid-flight on the same files | **moved**: extend `implement.prompt.md:38` with `, or another implementation batch appears mid-flight on the same files,` before `stop and report` |
| reviewer 4, 5, 6 | `review.prompt.md:25`; `:21`; `:115-116` |
| add-source 5, 6, 7, 9 | `add-source.prompt.md:23`; `:19,112`; `:20`; `:17` |
| refresh-artwork 5, 6, 7, 8, 9 | `refresh-artwork.prompt.md:16,26`; `:54`; `:39`; `:64`; verify 9 (update context/handoff) - if absent, add one line to the prompt's closing section |

**New wrapper shape** (descriptions and `model:` unchanged - they carry the
Codex routing `3144379` published and the orchestrator reads them):

```
---
name: planner
description: >
  (unchanged)
model: opus
---

You are the **planner** for this repository. Follow
`.claude/prompts/plan.prompt.md` exactly, with the TASK id and GOAL from the
dispatch message; it says what to read first, where to write, and when to stop.

Return: paths written, next batch name, blockers, and NEEDS_HUMAN_CONFIRMATION yes/no.
```

Same shape for the other four, keeping each file's existing `Return:` line.
`reviewer.md` frontmatter becomes `model: opus`, `permissionMode: plan`,
`tools: Read, Grep, Glob, Bash`; its body says `(read-only)` after the role.

**Policy text** - insert after `orchestrate.prompt.md:187` (the "Claude
effort is session-level" sentence), before the Codex paragraph:

```
### Planner tier: `opus` by default, `fable` by named escalation

`planner.md`'s frontmatter is `opus` and stays so; a routine planning
dispatch names no `model`. One dispatch may name `model: fable` when the
GOAL meets at least one test below, and the dispatch message in chat says
which:

1. The plan will settle a public contract, a product law, a hook that
   denies, or configuration every later session runs under - and a wrong
   call is not caught by `npm run check` or a reviewer, only by the next
   failure.
2. The design must reconcile three or more sources that can conflict (issue
   evidence, specs, live behaviour, an in-flight plan, a design held outside
   the repo), and the human has said the call is the planner's to make.
3. A previous planning pass on this task came back not implement-ready, or a
   batch of it failed review with `replan`.

Not a test: the task is large, the diff is wide, the human is in a hurry, or
Fable is available. Feature planning, a next-batch refresh and source-ingest
design stay on `opus`. If no test is named in the dispatch, the tier is
`opus`. Escalation is per dispatch and never edits the frontmatter; a resume
carries no `model` ("Resume, do not replace"), so a tier change is a fresh
dispatch. Fable's availability moves (unavailable 2026-09-12, available
2026-09-15): when it is not there, plan on `opus` and say so - never wait.
Announce the routing in chat only; never write it into `plan.md`,
`handoff.md` or `context.md`.
```

README sentence for lines 13-20, appended to that paragraph: `The planner's
tier can be escalated to \`fable\` for one dispatch under the named tests in
prompts/orchestrate.prompt.md, "Planner tier"; the frontmatter stays \`opus\`,
and a resume keeps its tier.`

README candidates rows (append after row 40):

- `| 41 | Reviewer \`tools:\` allowlist (\`Read, Grep, Glob, Bash\`) | agent frontmatter | **adopt** (\`config-audit\` B2) | Read-only posture becomes deterministic instead of prose plus \`permissionMode: plan\`; Edit/Write/NotebookEdit/Agent/ToolSearch drop out, which also closes row 36 (no \`ToolSearch\`, no \`SendMessage\`). Bash stays for \`git status\`/\`diff\`/\`log\` and focused checks. Key documented, unverified on this host: **probe pending** - dispatch the reviewer with "list your tool names and stop; write nothing", record the list here. |`
- `| 42 | Persistence-era guards: RLS gate, migration-reversibility gate, applied-migration \`edit-guard.mjs\` rule, gitleaks-on-commit, one session per shared database | gates, \`edit-guard.mjs\`, \`bash-guard.mjs\`, \`CLAUDE.md\` | **decided, not installed** | Trigger: persistence Phase 0, after issue 47 closes at R0c; design in \`issues/config-audit/plan.md\` section 5 until that directory retires, then the persistence task's own plan. A dormant gate guards nothing and a skill installed early spends listing budget until it is needed. |`

Row 42 cites `issues/config-audit/plan.md`: the retirement of this task
must retarget that citation (rule 2i will deny the deletion otherwise) -
record the section 5 table in the README or the persistence task's plan
first. This is written into this task's closeout acceptance in `handoff.md`.

**Finding 7 text** - append to `.claude/improvements.md` after "Suggested
batching"; change the preamble's first line to `Status, updated 2026-09-15.`
and add to the end of the preamble paragraph: `Finding 7 (the configuration
audit baseline) is recorded for a same-command re-measure on 2026-10-15.`

```
## Finding 7 - configuration audit baseline (2026-09-15), re-measure 2026-10-15

The audit behind `issues/config-audit/` measured the configuration's cost
once, so the next pass measures drift instead of re-deriving numbers. Same
commands, same host (this Windows desktop), on 2026-10-15:

| Measure | Command | 2026-09-15 |
|---|---|---|
| RTK savings, global | `rtk gain` | 424 commands, 563.0K saved, 60.5% |
| RTK misses, 30 days | `rtk discover` | 178 sessions, 19,194 commands, 40.9% handled, ~179.7K missed; top: `grep -n` 160 / 61.2K, `tail -c` 144 / 35.2K, `git commit` 206 / 26.3K, `npm run` 51 / 20.4K, `npx vitest` 6 / 11.7K |
| Always-loaded markdown | `wc -c CLAUDE.md ~/.claude/CLAUDE.md ~/.claude/RTK.md ~/.claude/projects/E--dev-daggerheart-loot/memory/MEMORY.md` | 13,308 B (~3,300 tokens); project `CLAUDE.md` 10,469 B / 199 lines |
| Skill listing | count model-invocable skills and sum `description:` chars over `~/.claude/plugins`, `~/.claude/skills`, `.claude/skills` | 58 skills, 14,705 chars + ~7,700 built-in = ~22,400 chars (~5,600 tokens) against a ~8,000-char budget (`skillListingBudgetFraction` 0.01); per-skill cap 1,536 |
| Task state | `wc -c issues/47/*.md` | plan 1,031,333 B / 16,012 lines; handoff 522,543 B / 7,671; context 227,406 B / 3,701 |

What `config-audit` changed against that baseline (commits in its
`handoff.md`): `bash-guard.mjs` denies `grep -n` and `tail -c` (96.4K of the
miss, over half); `session-stop.mjs` warns past 150 KB and names the
collapse past 300 KB; `CLAUDE.md` 199 -> 181 lines; three manual skills at
zero listing cost; the agent wrappers lost their duplicated rules; the
planner-tier policy is in the orchestrate prompt.

What the re-measure decides: `grep -n` and `tail -c` should be near zero in
`rtk discover`. The next-largest misses are `git commit` (the message body -
not filterable without losing it) and `npm run` (the commit-gate trap - do
not "fix" it), so the next rule may well be none. The 47 files must not have
grown past their 2026-09-15 sizes once R0c marks them historical; `CLAUDE.md`
should be under 181 after R0c, not over. Anything that moved the wrong way
is a new finding in this file, not a second backlog.
```

**Acceptance.** Each wrapper is frontmatter + two short paragraphs + its
`Return:` line; `git grep -c "Read \`CLAUDE.md\` first" .claude/agents`
returns 0 for every file; every rule deleted from a wrapper is found in its
prompt by the grep in the mapping table (the implementer records each grep
hit line in the handoff); `reviewer.md` carries the `tools:` line;
`orchestrate.prompt.md` has the "Planner tier" subsection and `planner.md`
still says `model: opus`; `git grep -in fable .claude CLAUDE.md` returns only
the policy subsection and the README sentence; Finding 7 exists and the
preamble is dated 2026-09-15; README rows 41-42 exist. Probe: the
orchestrator (not the implementer) dispatches the reviewer once with GOAL
"list your available tool names and stop; write nothing" and writes the
returned list into row 41, replacing "probe pending" - this line is
acceptance for the task's closeout, carried in `handoff.md`.

**Verification.** The greps above; `node .claude/hooks/selftest.mjs`
(unchanged, 111); no `npm run check` needed. Commit: `docs(agents): thin the
wrappers, allowlist the reviewer, name the planner-tier policy`. Push.

### B3 - hooks: RTK-bypass deny and task-state size budget - outline

**Status: not started, blocked on the tree going quiet** (see
`issues/config-audit/handoff.md`, "Next batch"). Pays one `npm run check`
(selftest runs inside it).
Independent of B2; depends on B1 only for the `/handoff` file the message
names.

**Objective.** Recommendations E and F. One `feat(hooks)` commit.

**Files.** `.claude/hooks/bash-guard.mjs`, `.claude/hooks/session-stop.mjs`,
`.claude/hooks/selftest.mjs`, `.claude/README.md` (hook table rows for
`bash-guard.mjs` and `session-stop.mjs`; candidates rows 43-44; one
"Known limitations" bullet). Not `lib.mjs`, not `check-observer.mjs`, not
`settings.json` (both rules live in scripts already registered), not
`edit-followup.mjs` (R0c's).

**bash-guard.mjs, rule family 2j** (header comment: "eight" -> "nine rule
families"). Add to `MSG`:

```js
grepLineNumber:
  'Blocked: `grep -n` runs outside RTK and its output lands unfiltered in context. Use `rtk grep -n <pattern> <path>` as its own command (no pipe, no `$(...)`), or the Grep tool, which numbers lines by default. `git grep -n` is not affected.',
tailBytes:
  'Blocked: `tail -c` runs outside RTK and its output lands unfiltered in context. Use `rtk read <file>`, or the Read tool with `offset`/`limit`. `tail -n` is not affected.'
```

Add after the 2h section:

```js
// ---------- 2j: readers that bypass RTK (deny) ----------
//
// `grep -n` and `tail -c` were 96.4K of the 179.7K tokens RTK missed over
// thirty days (rtk discover, 2026-09-15): RTK's own hook rewrites only a
// command at the start of a line, and these arrive piped, in `$(...)`, or
// after a `cd`. READERS hides both programs from every other rule on
// purpose (`echo git reset --hard` must stay silent), so this family
// tokenises the segment itself and tests the program token only:
// `echo grep -n`, `git grep -n` (closeout step 6) and `rtk grep -n` never
// match. See .claude/README.md, "Hooks", row 43.

const RTK_READERS = [
  { program: 'grep', letter: 'n', long: '--line-number', message: MSG.grepLineNumber },
  { program: 'tail', letter: 'c', long: '--bytes', message: MSG.tailBytes }
];

function evaluateRtkReaders(segList) {
  for (const segment of segList) {
    const tokens = unwrap(tokensOf(segment));
    if (!tokens.length) continue;
    for (const spec of RTK_READERS) {
      if (tokens[0] !== spec.program) continue;
      if (flagMatches(tokens, spec.letter) || tokens.some((t) => t.startsWith(spec.long))) {
        return { id: `rtk-${spec.program}`, message: spec.message };
      }
    }
  }
  return null;
}
```

Entry point: after `evaluateParityLock` and before `evaluateLongCheck`
(safety denies keep precedence; the reminder still fires for a check
invocation, which this rule never matches):

```js
const rtk = evaluateRtkReaders(segList);
if (rtk) return deny(event, rtk.message);
```

**session-stop.mjs, the budget.** Constants and one function above `guard`:

```js
const BUDGET_WARN_BYTES = 150 * 1024;
const BUDGET_COLLAPSE_BYTES = 300 * 1024;
const TASK_DOCS = ['context.md', 'plan.md', 'handoff.md'];
const COLLAPSE = {
  'handoff.md':
    'keep one Status (the current one), one line per shipped batch under Completed (outcome + commit), Verification for the latest batch only',
  'plan.md':
    "collapse every shipped batch's brief to its outcome and commit; keep the design, decisions, rejected alternatives and the next batch",
  'context.md':
    "keep facts, constraints, decisions and disproved reasons; move narrative to the plan's outcome lines"
};

/** Budget sentences for the active task's documents - only for a session
 * that wrote into that task directory (the author is the one who can act),
 * never for a bystander. Warn past 150 KB; past 300 KB name the collapse.
 * Sizes from statSync; a missing file is skipped. Never a decision. */
function budgetSentences(task, writtenPaths) {
  if (!task) return [];
  const prefix = pathKey(`issues/${task.id}/`);
  if (!writtenPaths.some((p) => pathKey(p).startsWith(prefix))) return [];
  const out = [];
  for (const name of TASK_DOCS) {
    let size;
    try {
      size = statSync(path.join(task.dir, name)).size;
    } catch {
      continue;
    }
    const kb = Math.round(size / 1024);
    const file = `issues/${task.id}/${name}`;
    if (size >= BUDGET_COLLAPSE_BYTES) {
      out.push(
        `${file} is ${kb} KB, past the 300 KB collapse line: ${COLLAPSE[name]} - .claude/skills/handoff/SKILL.md (/handoff). Never drop decisions and their reasons, rejected approaches, blockers, the next batch, or exact check results; history keeps the full text.`
      );
    } else if (size >= BUDGET_WARN_BYTES) {
      out.push(
        `${file} is ${kb} KB, past the 150 KB budget; compact it per .claude/skills/handoff/SKILL.md (/handoff) before it reaches 300 KB.`
      );
    }
  }
  return out;
}
```

Wire it after `staleness` is computed: `const budget = budgetSentences(task,
writtenPaths);`; extend the early return to `if (!uncommitted.length &&
!candidates.length && !staleness && !budget.length) return undefined;`;
`parts.push(...budget)` after the staleness push; include
`budget.join('\n')` in the dedupe hash. Header comment gains one clause.
`warn()` is the only emitter; no `decision` key anywhere.

**selftest.mjs.** Header comment `#1-#111` -> `#1-#130`. Case #19 becomes
`grep -r 'git clean -fd' docs/` with a comment that `-n` is now 2j's (#112).
New `testRtkReaders()` after `testBackgroundCheck()`:

- deny, reason fragment: `#112 grep -n` `grep -n foo app/src/lib/x.ts` /
  `rtk grep`; `#113 grep -rn cluster` `grep -rn 'x' docs/`; `#114
  --line-number` `grep --line-number x f`; `#115 piped` `cat f | grep -n x`;
  `#116 tail -c` `tail -c 200 f` / `rtk read`; `#117 tail --bytes`
  `tail --bytes=200 f`; `#118 xargs` `find . -name "*.ts" | xargs grep -n x`.
- not denied (`!isDeny`, because 2f may speak): `#119 canonical check`
  `set -o pipefail; npm run check 2>&1 | tail -n 120`.
- silent: `#120 git grep -n` `git grep -n "issues/65/plan\\.md"`; `#121 rtk
  grep -n` `rtk grep -n x docs/`; `#122 tail -n` `tail -n 120 f`; `#123 grep
  -r` `grep -r x docs/`; `#124 echo` `echo "grep -n x"`; `#125 quoted sh -c`
  `sh -c "grep -n x f"` (erased with its quotes: a known limitation, listed).

New `testTaskBudget()` inside or after `testSessionStop()` (it needs
`recordWrite`): write `issues/98/handoff.md` of `160 * 1024` bytes, record
the write for session `s-stop-budget`, run Stop: `#126` message contains
`issues/98/handoff.md` and `150 KB`; write `issues/98/plan.md` of `310 *
1024` bytes, record it, run: `#127` contains `issues/98/plan.md`, `300 KB`
and `handoff/SKILL.md`; run again unchanged: `#128` silent; a session
`s-stop-bystander` that recorded only `app/src/lib/x.ts`: `#129` message
does not contain `KB`; `#130` no result JSON from any of the above has a
`decision` key. Clean up `issues/98/` with `fs.rmSync(..., { recursive:
true, force: true })` so `testFailOpen()` sees the tree it expects, and note
that `activeTask()` returns to `issues/99/` afterwards as before.

**README.** Hook-table row `bash-guard.mjs`: add `, and \`grep -n\` /
\`tail -c\` (readers that bypass RTK; use \`rtk grep\`, \`rtk read\`, or
the Grep/Read tools)` to the block list. Row `session-stop.mjs`: add `Warns
when a task document of the active task is past its size budget (150 KB;
past 300 KB it names the collapse action per file), only for the session
that wrote into that task directory.` "Known limitations": `- The RTK-bypass
deny (row 43) sees the program token only: \`sh -c "grep -n ..."\` is erased
with its quotes like every other quoted command, and \`rg -n\` is not
covered (not in the measured miss).` Candidates rows:

- `| 43 | Deny \`grep -n\` and \`tail -c\` (readers that bypass RTK) | \`PreToolUse(Bash)\` | **adopt** (\`config-audit\` B3) | Measured 2026-09-15: 96.4K of the 179.7K tokens RTK missed in thirty days, over half, in two commands. RTK's hook rewrites only at line start, so the miss is the piped, \`$(...)\` and \`cd\`-prefixed shapes prose has not moved. Matches the program token only, so \`echo\`, \`git grep -n\` and \`rtk grep -n\` are untouched; a line-start \`grep -n\` that RTK would have rewritten now costs one retry, the accepted price. Not \`npm run check\` and never \`rtk npm run check\`: the commit-gate trap (\`issues/config-audit/context.md\`; \`check-observer.mjs\` arms only on the bare invocation with the coverage table in stdout). Fallback if the retry proves noisy: exempt a single-segment, single-line shape - record here, do not delete the row. |`
- `| 44 | Warn when a task document is past its size budget | \`Stop\` | **adopt** (\`config-audit\` B3) | Measured 2026-09-15: issue 47's \`plan.md\` 1,031 KB (57.7% shipped-batch briefs), \`handoff.md\` 523 KB (96% of Status superseded snapshots), \`context.md\` 227 KB, growing 350-1,400 lines per working day, read by every worker at dispatch. Warn, never block: a Stop hook that blocks session-end is worse than a large file. Scoped to the session that wrote into the directory, deduped per state. The procedure and the never-drop / always-drop lists live in \`.claude/skills/handoff/SKILL.md\`. Rejected: a \`PreToolUse(Write)\` size deny (blocks the closeout write that fixes it); a \`SessionStart\` notice (the writer is who needs it). |`

Row 43 cites `issues/config-audit/context.md` - a `context.md`, kept at
retirement, so rule 2i is not triggered by it.

**Acceptance.** `node .claude/hooks/selftest.mjs` reports every case
passing (111 + 19 new = 130 checks' worth; the tool prints pass/fail
counts); `set -o pipefail; npm run check 2>&1 | tail -n 120` passes in one
foreground call, Bash timeout 600000; a live probe from the implementer's
own Bash tool: `grep -n guard .claude/hooks/lib.mjs` is denied with the
`rtk grep` message and `rtk grep -n guard .claude/hooks/lib.mjs` runs
(record both in the handoff); README rows and table text present.
`check:built` and parity: not required (no app source changed).

**Verification.** `node .claude/hooks/selftest.mjs`; the foreground check;
the two probes. Commit: `feat(hooks): deny RTK-bypassing readers, warn past
the task-state budget`. Push.

**Risks / do-nots.** Do not touch `CHECK_INVOCATION_RE`, `check-observer.mjs`
or `LONG_CHECKS`. Do not add `grep`/`tail` handling to `segmentInfo` or
remove them from `READERS` - every existing silent case depends on that
skip. The Stop hook must never emit `decision`. Hook scripts may be
snapshotted at session start on other hosts (README, "Hook config may be
snapshotted"): the implementer's live probe is on this host, where scripts
re-read per invocation.

## 8. Risks, assumptions, dependencies

- **Line drift for R0c.** B1 moves `CLAUDE.md` line numbers (199 -> 181).
  R0c is not yet planned in implement-ready detail (R0b planning is next),
  and its plan cites sections by name, not number (`plan.md:14711`); its
  planner reads the then-current file. Land this task before R0b planning
  starts, at the current boundary. The `docs/parity.md` citation at
  `CLAUDE.md` "Task and session protocol" dies when R0c deletes that file:
  R0c must retarget it (the batch-size numbers move to their permanent home
  then). Recorded in `handoff.md` for the human to carry to 47.
- **`tools:` frontmatter unverified on this host** (D7): probe in B2's
  acceptance. If the host ignores the key, the row says so and
  `permissionMode: plan` remains the posture - no capability lost either way.
- **`activeTask()` is an mtime guess** (`lib.mjs:238`): the budget warning
  names the newest directory. Since it fires only when the session wrote
  under that directory, a wrong guess yields silence, never a wrong name.
- **Selftest fixture literal** `issues/65/plan.md` stays in
  `selftest.mjs`; a recreated `issues/65/plan.md` would be undeletable
  through the hook until the fixture id changes. Accepted: the file is
  retired for good and the fixture must name some path. Recorded in B1's
  acceptance.
- **The design document's audit-prompt path** (section 5) is stale outside
  this repo; owner's to fix.
- **Assumption**: the Agent tool on this host accepts `model: fable` (its
  enum lists `sonnet|opus|haiku|fable`, observed 2026-09-15 in this session's
  tool schema).

## 9. Deferred

- Compaction of `issues/47/*` at R0c's closeout, per `/handoff` (D4).
- User-level listing pressure: 20 resume skills (1,474 chars) and
  `docx`/`pptx`/`xlsx` (2,939 chars) are 30% of the measured listing and
  irrelevant here; `.claude/skills/impeccable/` (owner-local, untracked,
  model-invocable, ~900 description chars) is not in `context.md`'s count of
  58. Owner's call; the 2026-10-15 re-measure should count it.
- `rg -n` as a fourth RTK-bypass reader: not in the measured miss; revisit
  on 2026-10-15 if `rtk discover` shows it.
- README row 31 (deny a foreground check with no `timeout`) and row 29
  (HEAD moved): unchanged standing, not this task's.

## 10. Status

| Batch | Status | Commit |
|---|---|---|
| B1 always-loaded prose, dead references, skills | not started | - |
| B2 wrappers, reviewer allowlist, planner-tier policy, Finding 7 | not started | - |
| B3 hooks: RTK deny, task-state budget | not started | - |
| Closeout: reviewer probe recorded in README row 41; row 42's citation of this plan retargeted before retirement | not started | - |
