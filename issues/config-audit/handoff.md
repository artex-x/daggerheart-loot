# Handoff - TASK config-audit

## Status
- Task status: in_progress (B1 implemented and committed; B2 and B3 outlined, not started)
- Last agent: implementer (2026-09-15)
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `main`
- Base / starting commit: `2d2e983` (committed boundary between issue 47 batches; land all three batches before R0b planning starts)
- B1 commit: `779fae6` `docs(claude): trim CLAUDE.md, repair dead references, add manual skills` - not pushed (working tree is contended by another interactive session; push not authorized for this task)

Gates for this task: `npm run check` for B3 only (it changes `.claude/hooks/*.mjs`, a covered path; `selftest.mjs` runs inside it). B1 and B2 are markdown-only and commit-gate exempt. **No batch changes a rendered screen or any app source, so `npm run check:built` and parity are not required anywhere in this task** (`context.md`, "Command costs").

## Completed
- Batch name/id: planning pass
- What shipped: `issues/config-audit/plan.md` (design, decisions D1-D12, target structure, persistence-era decisions, three batches); this file; `mocks/CLAUDE.proposed.md` (the exact post-trim `CLAUDE.md`, 181 lines, verified by `wc -l` and `diff`); `mocks/skills/{orchestrate,handoff,small-fix}/SKILL.md` (the three skills, copied verbatim in B1); durable facts appended to `context.md`.
- Files changed: `issues/config-audit/` only.
- Commit(s): none at planning time (task documents landed with B1's commit, below).
- Deviations and rationale: the trim lands at 181 lines, not the audit's 148 - `plan.md` D2/D3: no `/parity` skill (collides with R0c, which deletes that section by name; a manual skill would relax the rules for the 47 sessions that need them), and every other kept line has a recorded reason. Issue 47's files are not compacted in this task - D4, with the answer to `issues/47/plan.md:14784`.

- Batch name/id: **B1 - always-loaded prose: `CLAUDE.md` trim, dead references, three manual skills**
- What shipped: `CLAUDE.md` replaced verbatim with `mocks/CLAUDE.proposed.md` (181 lines); `.claude/README.md` gained the `## Host-aware explicit routing policy` heading, a `## Skills` section (the three-skill table), and the `### Run a long check` heading, and rows 39-40 no longer cite the literal path `issues/65/plan.md`; `.claude/prompts/plan.prompt.md:81` now points at `app/src/styles/tokens.css`; `.claude/prompts/orchestrate.prompt.md` gained the `/small-fix` routing bullet and one closeout sentence pointing at `/handoff`; `.claude/templates/handoff.template.md` gained the snapshot/budget comment; `.claude/skills/{orchestrate,handoff,small-fix}/SKILL.md` created (tracked by name, `.claude/skills/impeccable/` left untracked); `issues/47/handoff.md` and `issues/47/context.md` had their stale "untracked `.gitleaks.toml`" sentences corrected to reflect it landed tracked at `13bba19`.
- Files changed: the 17 listed above (`.claude/README.md`, `.claude/prompts/orchestrate.prompt.md`, `.claude/prompts/plan.prompt.md`, `.claude/templates/handoff.template.md`, `CLAUDE.md`, `issues/47/context.md`, `issues/47/handoff.md`, three new `.claude/skills/*/SKILL.md`, and the four `issues/config-audit/` task documents including `mocks/`).
- Commit(s): `779fae6` `docs(claude): trim CLAUDE.md, repair dead references, add manual skills`. Not pushed - the tree is contended by another interactive session and push was not authorized for this task.
- Deviations and rationale: none. Step 1's pre-replacement diff (section-by-section, since the trim reflows line numbers) showed changes confined to exactly the sections the plan named - "Start here", "Task and session protocol", "Architecture boundaries" (`tokens.css` path only), "Data and published artefacts", "Quality gates" (last two paragraphs), "Source and commit conventions" (force-push bullet removed), "Maintaining this file", "Orchestration" - and "Project shape", "Specs are the behaviour source of truth", "Migration and parity", "Product laws" diffed empty. No drift; proceeded without stopping.

## Verification
- Planning-time commands (exact): `wc -l issues/config-audit/mocks/CLAUDE.proposed.md CLAUDE.md` -> 181 / 199; `diff CLAUDE.md issues/config-audit/mocks/CLAUDE.proposed.md` -> only the sections B1 step 1 lists differ; `git status --porcelain --ignored -- .claude/skills .claude/settings.local.json` -> `?? .claude/skills/` (untracked, holds owner-local `impeccable/`), `!! .claude/settings.local.json`; `git log -S "setup-claude-agents" --oneline -- CLAUDE.md` -> `29f8920`; `rtk --help` -> `grep`, `rg`, `read` subcommands exist.
- B1 verification commands (exact) and results:
  - `wc -l CLAUDE.md` -> `181`.
  - Section-by-section diff of HEAD's `CLAUDE.md` against the mock, per named heading -> only the eight sections listed above differ; the other four are byte-identical.
  - `git grep -n "Run a long check" -- ':!issues'` -> `.claude/README.md:135` (`### Run a long check`), `.claude/prompts/orchestrate.prompt.md:88`, `CLAUDE.md:103`.
  - `git grep -n "Host-aware explicit routing policy" -- ':!issues'` -> `.claude/README.md:13`, `CLAUDE.md:172`.
  - `git grep -n "styles/tokens.css" -- ':!issues'` -> `plan.prompt.md:81` and `CLAUDE.md:85` both read `app/src/styles/tokens.css`; `Shell.svelte:184`, `DEBT.md:22`, `DEBT.md:218`, `main.ts:4` are accepted `app/src`-relative prose/import mentions, left alone.
  - `git grep -n "issues/65/plan.md" -- ':!issues'` -> only `.claude/hooks/selftest.mjs` fixture lines (accepted).
  - `git grep -n '"Batch size"' CLAUDE.md` -> no output (citation now reads "Batch size and the fixed cost of a run").
  - `git grep -n "untracked \`.gitleaks.toml\`" issues/47` -> no output.
  - `git status --porcelain .claude/skills` -> only `?? .claude/skills/impeccable/`-holding untracked directory marker before staging; after `git add` by name, `git status --porcelain` showed the three `SKILL.md` files as `A` and `.claude/skills/impeccable/` still `??`.
  - `grep -n disable-model-invocation` on all three new `SKILL.md` files -> `true` in each.
  - `node .claude/hooks/selftest.mjs` -> `317 passed, 0 failed`. Note: the plan's B1 acceptance expected "unchanged at 111 passing cases"; actual count on this tree is 317. `selftest.mjs` itself is untouched by B1 (confirmed via `git status --porcelain .claude/hooks/selftest.mjs` before and after, no diff) - the discrepancy predates this batch and is not caused by it. Flagging for the orchestrator/human: the `context.md`/`handoff.md` baseline of "111" is stale; re-measure and correct it, do not treat 317 as a regression.
  - No `npm run check`, `npm run check:built`, or parity run executed (not required; B1 is markdown-only and commit-gate exempt).
- Results: as above; no hook, test or app file touched.
- Gates: none run (planning only).

## Next batch (implement-ready)
- Name: **B2 - agent wrappers, reviewer allowlist, planner-tier policy, Finding 7**
- Objective: land recommendations C, G, H (thin the five agent wrappers to frontmatter + two paragraphs + `Return:`, moving the two rules each prompt does not yet carry into the prompt; add `tools:`/`permissionMode: plan` to `reviewer.md`; add the "Planner tier: opus by default, fable by named escalation" policy subsection to `orchestrate.prompt.md`; append Finding 7 to `.claude/improvements.md`; add README candidate rows 41-42) in one `docs(agents)` commit. Independent of B3; markdown-only, gate-exempt.
- In scope: `.claude/agents/{planner,implementer,reviewer,add-source,refresh-artwork}.md`; `.claude/prompts/orchestrate.prompt.md` (policy subsection); `.claude/prompts/plan.prompt.md` (one moved line); `.claude/prompts/implement.prompt.md:38` (one moved clause); `.claude/README.md:13-20` (one sentence) and candidate rows 41-42; `.claude/improvements.md` (preamble sentence, `Status, updated`, Finding 7 section).
- Out of scope: hooks (B3); anything already landed in B1; agent `description:`/`model:` frontmatter (unchanged - Codex routing depends on it).
- Files expected: listed above; exact edits, wrapper rule mapping table, new wrapper shape, policy text, README sentence/rows, and Finding 7 text are all in `plan.md` section 7, "B2 - outline".
- Steps: `plan.md` section 7 B2. Verify each "verify" cell in the wrapper rule mapping table by grep against the named prompt line before deleting the wrapper's copy; if a cited line is absent, add it to the prompt first (the mapping table says where).
- Acceptance criteria: `plan.md` B2 "Acceptance" - each wrapper is frontmatter + two short paragraphs + `Return:`; `git grep -c "Read \`CLAUDE.md\` first" .claude/agents` returns 0 for every file; every wrapper-deleted rule is found in its prompt by the mapping table's grep (record each hit line in the handoff); `reviewer.md` carries `tools:`; `orchestrate.prompt.md` has the "Planner tier" subsection and `planner.md` still says `model: opus`; `git grep -in fable .claude CLAUDE.md` returns only the policy subsection and the README sentence; Finding 7 exists dated 2026-09-15; README rows 41-42 exist. Note: the reviewer `tools:` probe for row 41 ("list your available tool names and stop; write nothing") is the orchestrator's to dispatch, not the implementer's - row 41 stays "probe pending" until that happens.
- Verification commands: the greps above; `node .claude/hooks/selftest.mjs` (unchanged - re-baseline against the actual current count, see B1 Verification note below, not the stale "111"); no `npm run check` needed.
- Risks / do-nots: `plan.md` B2 - do not change agent `description:`/`model:` frontmatter; do not write the planner-tier policy into `plan.md`/`handoff.md`/`context.md` (chat-only, per `orchestrate.prompt.md:184,207` and `review.prompt.md:117`); do not touch B3's files.
- Fallback (optional): none needed; texts are exact in `plan.md`.

After B2: B3 (hooks: RTK-bypass deny in `bash-guard.mjs`, task-state size budget in `session-stop.mjs`) is independent of B2 and depends on B1 only for the `/handoff` file its messages name. It is outlined in `plan.md` section 7 with exact code sketches; pays one `npm run check` (selftest runs inside it). The planner does not need to be resumed to expand either unless a reviewer returns `replan`.

## Blockers
- None. The reviewer `tools:` probe (B2 acceptance, README row 41) is the orchestrator's to run after B2 lands; until then row 41 reads "probe pending" by design.

## Deferred
- **For issue 47 (human to carry into R0c's plan):** (1) compact `issues/47/{plan,handoff,context}.md` at R0c's closeout per `.claude/skills/handoff/SKILL.md` - this task installs the budget and does not compact (D4); (2) `CLAUDE.md` "Task and session protocol" cites `docs/parity.md`, "Batch size and the fixed cost of a run" - R0c deletes that file and must retarget the citation; (3) `CLAUDE.md` line numbers move in B1 (199 -> 181); R0c's plan cites sections by name, so re-read the file rather than any recorded number.
- **For the owner, outside this repo:** the persistence design's 17.4 names the audit prompt as `docs/agent-audit.v6.prompt.md`; no such file exists here (the prompt is `audit.prompt.md` on the desktop). User-level listing pressure (20 resume skills, `docx`/`pptx`/`xlsx`) and the owner-local `.claude/skills/impeccable/` (model-invocable, not in `context.md`'s count of 58) are the owner's call; the 2026-10-15 re-measure should count `impeccable`.
- `rg -n` as a further RTK-bypass reader: revisit on 2026-10-15 if measured.
- Closeout of this task: README row 42 cites `issues/config-audit/plan.md`; before retiring `plan.md`, move section 5 (persistence-era decisions) to its permanent home (the persistence task's plan, or the README) and retarget the row, or rule 2i denies the deletion. `mocks/` becomes disposable once B1 has copied it - delete it in the closing commit and record it here.

## Notes
- Mocks path: `issues/config-audit/mocks/CLAUDE.proposed.md`; `issues/config-audit/mocks/skills/{orchestrate,handoff,small-fix}/SKILL.md`. Text artefacts, not visual mocks; this task has no UI.
- Screenshot findings: none (no UI).
- Cleanup performed / retained artifacts: nothing removed. Retained: `.claude/skills/impeccable/` (owner-local, untracked, referenced by the ignored `settings.local.json`) - not this task's, never to be staged. `issues/tg-preview-refresh/` (untracked, another task's) - untouched. `mocks/` retained per the Deferred note above (disposable at this task's closeout, not at B1).
- Session end partial progress (if any): none; B1 complete and committed (`779fae6`, not pushed). The contended tree's unrelated modified/untracked paths named in the B1 dispatch (`app.js`, `app/src/components/TablesPage.svelte`, `app/src/lib/{dict,label,tables}.ts`, `docs/specs/{CONTRACTS,COVERAGE,FEATURES,ROUTES}.md`, all of `i/f37.html`-`i/f93.html`, `issues/56-followup/handoff.md`, `tools/build-share-pages.js`, `.agents/`, `.codex/`, `.claude/agents/impeccable-*.md`, `.claude/skills/impeccable/`, `issues/tg-preview-refresh/`) were left untouched throughout, confirmed by `git status --porcelain -uall` before staging and by the post-commit `git status` showing them still modified/untracked exactly as before.
