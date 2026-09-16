# Handoff - TASK config-audit

## Status
- Task status: **done** (B1, B2, B3 implemented, committed, and **CI-confirmed green** on `2ce3b08`, CI run 35086285974: `conclusion: "success"`. B3's CI failure took four remediation cycles to actually fix - the first two chased an `activeTask()` mtime-tie theory that was never the cause, a third wrongly declared that theory confirmed by a red/green delta with a different explanation, and the fourth found and fixed the real cause - session-state pruning in `lib.mjs`'s `saveState()` - via diagnostic output on an actual CI failure, then confirmed by this CI run, not merely claimed. See "B3 CI remediation" for the corrected record. Task closeout completed 2026-09-16; status **done**)
- Last agent: implementer (2026-09-16, B3 CI remediation cycle 4 - actual root cause, fix, and CI confirmation)
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `main`
- Base / starting commit: `2d2e983` (committed boundary between issue 47 batches; land all three batches before R0b planning starts)
- B1 commit: `779fae6` `docs(claude): trim CLAUDE.md, repair dead references, add manual skills` - **pushed**; `git branch -r --contains 779fae6` -> `origin/main` (2026-09-16). A peer session carried it up when it pushed `main`; no push was needed from this task.
- B2 commit: `d61aadb` `docs(agents): thin the wrappers, allowlist the reviewer, name the planner-tier policy` - **pushed**; `git branch -r --contains d61aadb` -> `origin/main` (2026-09-16). `git rev-list --left-right --count origin/main...HEAD` -> `0 0`.
- B3 commit: `7cc259d` `feat(hooks): deny RTK-bypassing readers, warn past the task-state budget` - **pushed**; landed on top of a peer session's `27ac065`/`5a36c4a` (issue 56, unrelated - preserved untouched); `git branch -r --contains 7cc259d` -> `origin/main`; `git rev-list --left-right --count origin/main...HEAD` -> `0 0`.
- B3 remediation commit 1: `3504bf7` `fix(hooks): pin issues/99's mtime in testTaskBudget so activeTask() can't tie on Linux readdir order` - **pushed**. CI run 35076587670 failed B3's `1106355` with `#126`/`#127` FAILED. This chased a mechanism that was never the cause - see "B3 CI remediation" below, cycle 1.
- B3 remediation commit 2: `743439c` `test(hooks): pin every issues/<id> dir mtime, add self-diagnosing detail to the budget cases` - **pushed**. Fixed a real, separate code/comment discrepancy and added the `budgetDiagnostics()` instrumentation that later found the actual cause; did not itself fix CI (see cycle 3's correction, below). Landed on top of an unrelated peer merge (`0871b1a`, `tg-preview-refresh` automation - confirmed touching no hook file).
- B3 remediation commit 3 (documentation only, local commit built on top of `743439c` - see "B3 CI remediation" cycle 3 below): **wrongly** declared the mtime-tie theory confirmed by CI going green on `743439c`, attributing that to the broader directory pin. This was incorrect and is corrected by cycle 4 below - CI going green on `743439c` had nothing to do with the mtime work; a later CI run on the same code (commit `e2ada3f`, after unrelated peer merges landed on `main`) failed again with the real cause.
- B3 remediation commit 4: `2ce3b08` `fix(hooks): isolate testTaskBudget's session state - the CI cause was session-state pruning, not an mtime tie` - **pushed** on top of `80809c8` (a local-only documentation commit that wrongly declared cycle 3's theory confirmed - never pushed on its own; both landed in the same push, so `main` never carried the wrong claim without its correction) and `e2ada3f` (a peer's unrelated merge, `art-to-fix` - confirmed touching no hook file). `git branch -r --contains 2ce3b08` -> `origin/main`; `git rev-list --left-right --count origin/main...HEAD` -> `0 0`. **CI run 35086285974: `conclusion: "success"` (`gh run view 35086285974 --json status,conclusion,headSha`) - `check` (which runs `.claude/hooks/selftest.mjs`) succeeded, all four `golden` shards succeeded, `audit` and `secrets` succeeded, `deploy` succeeded. `main` is confirmed green on `2ce3b08`.**

Gates for this task: all three batches are done. B1 and B2 are markdown-only and commit-gate exempt (no `npm run check` run for them). B3 edits `.claude/hooks/*.mjs`, a covered path, so its commit needed a passing foreground `npm run check` - see "B3 verification" below for the exact commands and results. **No batch changes a rendered screen or any app source, so `npm run check:built` and parity were not required anywhere in this task** (`context.md`, "Command costs"). `node .claude/hooks/selftest.mjs` now reports **357 passed, 0 failed** after B3's 19 new named cases (#112-#130) plus one precondition assertion added in the CI remediation (unnumbered, part of #128's block); the header comment's named-case scheme was `#1-#111` before B3 and is `#1-#130` now - see "Selftest count" below. **Correction to this task's own dispatch note (B2):** the dispatch for B2 called "111" a stale baseline that "317" should replace everywhere. That is not right, and B2 did not perform that blanket replacement - see "Selftest count: 111 vs 317, not a stale/fresh pair" below.

## Completed
- Batch name/id: planning pass
- What shipped: this task's `plan.md` (design, decisions D1-D12, target structure, persistence-era decisions, three batches) - retired at closeout, see Cleanup; this file; `mocks/CLAUDE.proposed.md` (the exact post-trim `CLAUDE.md`, 181 lines, verified by `wc -l` and `diff`); `mocks/skills/{orchestrate,handoff,small-fix}/SKILL.md` (the three skills, copied verbatim in B1); durable facts appended to `context.md`.
- Files changed: `issues/config-audit/` only.
- Commit(s): none at planning time (task documents landed with B1's commit, below).
- Deviations and rationale: the trim lands at 181 lines, not the audit's 148 - `plan.md` D2/D3: no `/parity` skill (collides with R0c, which deletes that section by name; a manual skill would relax the rules for the 47 sessions that need them), and every other kept line has a recorded reason. Issue 47's files are not compacted in this task - D4, with the answer to `issues/47/plan.md:14784`.

- Batch name/id: **B1 - always-loaded prose: `CLAUDE.md` trim, dead references, three manual skills**
- What shipped: `CLAUDE.md` replaced verbatim with `mocks/CLAUDE.proposed.md` (181 lines); `.claude/README.md` gained the `## Host-aware explicit routing policy` heading, a `## Skills` section (the three-skill table), and the `### Run a long check` heading, and rows 39-40 no longer cite the literal path `issues/65/plan.md`; `.claude/prompts/plan.prompt.md:81` now points at `app/src/styles/tokens.css`; `.claude/prompts/orchestrate.prompt.md` gained the `/small-fix` routing bullet and one closeout sentence pointing at `/handoff`; `.claude/templates/handoff.template.md` gained the snapshot/budget comment; `.claude/skills/{orchestrate,handoff,small-fix}/SKILL.md` created (tracked by name, `.claude/skills/impeccable/` left untracked); `issues/47/handoff.md` and `issues/47/context.md` had their stale "untracked `.gitleaks.toml`" sentences corrected to reflect it landed tracked at `13bba19`.
- Files changed: the 17 listed above (`.claude/README.md`, `.claude/prompts/orchestrate.prompt.md`, `.claude/prompts/plan.prompt.md`, `.claude/templates/handoff.template.md`, `CLAUDE.md`, `issues/47/context.md`, `issues/47/handoff.md`, three new `.claude/skills/*/SKILL.md`, and the four `issues/config-audit/` task documents including `mocks/`).
- Commit(s): `779fae6` `docs(claude): trim CLAUDE.md, repair dead references, add manual skills`. Not pushed - the tree is contended by another interactive session and push was not authorized for this task.
- Deviations and rationale: none. Step 1's pre-replacement diff (section-by-section, since the trim reflows line numbers) showed changes confined to exactly the sections the plan named - "Start here", "Task and session protocol", "Architecture boundaries" (`tokens.css` path only), "Data and published artefacts", "Quality gates" (last two paragraphs), "Source and commit conventions" (force-push bullet removed), "Maintaining this file", "Orchestration" - and "Project shape", "Specs are the behaviour source of truth", "Migration and parity", "Product laws" diffed empty. No drift; proceeded without stopping.

- Batch name/id: **B2 - agent wrappers, reviewer allowlist, planner-tier policy, Finding 7**
- What shipped: all five `.claude/agents/*.md` wrappers rewritten to frontmatter (description/model unchanged) plus a two-sentence pointer to their prompt and the same `Return:` line as before; every rule the wrappers used to restate verified present in its prompt by grep first (results below), then the two rules that were not yet carried were moved in - `plan.prompt.md` gained a "write only under `<TASK_DIR>/`" sentence after the "do not implement production code" line, and `implement.prompt.md:38`'s stop condition gained ", or another implementation batch appears mid-flight on the same files,"; `refresh-artwork.prompt.md`'s closing list also gained a durable-notes bullet (its wrapper rule 9 had no prompt line to verify against, so one was added per the mapping table's instruction, not just checked). `reviewer.md` frontmatter gained `tools: Read, Grep, Glob, Bash` (it already carried `permissionMode: plan` from an earlier session, so only the `tools:` line was new). `orchestrate.prompt.md` gained the "### Planner tier: `opus` by default, `fable` by named escalation" subsection (three named tests, fail-closed to `opus`, chat-only announcement) inserted before the Codex paragraph; `planner.md` frontmatter is untouched (`model: opus`). `.claude/README.md` gained one sentence on the Host-aware routing paragraph pointing at "Planner tier", plus candidate rows 41 (reviewer `tools:` allowlist, row 41's probe explicitly left "probe pending" - it is the orchestrator's to run) and 42 (persistence-era guards, decided-not-installed). `.claude/improvements.md` preamble re-dated to 2026-09-15 with one sentence added, and "## Finding 7 - configuration audit baseline (2026-09-15), re-measure 2026-10-15" inserted before "## Suggested batching".
- Files changed: `.claude/agents/{planner,implementer,reviewer,add-source,refresh-artwork}.md`, `.claude/prompts/{orchestrate,plan,implement,refresh-artwork}.prompt.md`, `.claude/README.md`, `.claude/improvements.md` (11 files).
- Commit(s): `d61aadb` `docs(agents): thin the wrappers, allowlist the reviewer, name the planner-tier policy`. Not pushed - the tree is contended by another interactive session and push was not authorized for this task.
- Deviations and rationale: none from `plan.md` B2's outline. One clarification beyond scope: this batch's own dispatch note asserted the `selftest.mjs` "111 cases" baseline recorded elsewhere in this task's documents was simply stale and should be replaced with "317" everywhere. Investigating that claim (required before writing "317" into more documents) found it is not a stale/fresh pair: `selftest.mjs`'s own header comment still reads "numbered #1-#111 in the comments below" and is unchanged by B1 or B2; "111" counts named cases in that comment scheme, while "317" is the runtime count of individual `check()` assertions the script executes (120 `check(` call sites, at least 16 of them inside loops over fixtures, so one named case can contribute several counted passes). Both numbers are live and correct for what they measure. B2 did **not** perform a blanket "111" -> "317" replacement; see "Selftest count" below for what was corrected versus left alone, and for what the human should decide about `plan.md`'s B3 outline (which numbers new hook cases `#112`-`#130` against the still-current `#111` scheme).

- Batch name/id: **B3 - hooks: RTK-bypass deny and task-state size budget**
- What shipped: `bash-guard.mjs` gained rule family 2j (`RTK_READERS`/`evaluateRtkReaders`, wired after `evaluateParityLock` and before `evaluateLongCheck`), header comment "eight" -> "nine rule families", and two `MSG` entries (`grepLineNumber`, `tailBytes`); `session-stop.mjs` gained the task-document size budget (`BUDGET_WARN_BYTES` 150 KB, `BUDGET_COLLAPSE_BYTES` 300 KB, `TASK_DOCS`, `COLLAPSE`, `budgetSentences()`), wired after `staleness`, folded into the early-return guard and the dedupe hash, header comment gained one clause; `selftest.mjs` header `#1-#111` -> `#1-#130`, case `#19` narrowed from `grep -rn` to `grep -r` (the `-n` spelling now belongs to 2j's own `#112`), new `testRtkReaders()` (`#112`-`#125`, deny/allow/silent cases exactly as outlined) called after `testBackgroundCheck()`, new `testTaskBudget()` (`#126`-`#130`) called after `testSessionStop()`; `.claude/README.md` hook-table rows for `bash-guard.mjs` and `session-stop.mjs` extended, one "Known limitations" bullet added, candidate rows 43-44 appended.
- Files changed: `.claude/hooks/bash-guard.mjs`, `.claude/hooks/session-stop.mjs`, `.claude/hooks/selftest.mjs`, `.claude/README.md` (4 files, exactly in scope).
- Commit(s): `7cc259d` `feat(hooks): deny RTK-bypassing readers, warn past the task-state budget` - **pushed** (`git branch -r --contains 7cc259d` -> `origin/main`; `git rev-list --left-right --count origin/main...HEAD` -> `0 0`). Landed cleanly on top of a peer session's `27ac065`/`5a36c4a` (issue 56, unrelated - untouched by this batch).
- Deviations and rationale:
  1. **One correction to `plan.md`'s drafted text, per the human's explicit instruction**: candidate README row 43's measured figure was re-dated 2026-09-15 -> 2026-09-16 and re-cited with the fresher `rtk discover` numbers recorded in `context.md`'s 2026-09-16 re-measure bullet - 198 sessions / 20,710 Bash commands; ~281.4K missed over 1,052 commands; `grep -n` 342 / ~117.6K and `tail -c` 159 / ~40.8K, together 158.4K of 281.4K = 56.3%. The row's reasoning and fallback clause are unchanged verbatim. The `bash-guard.mjs` 2j code comment and README row 44 keep the 2026-09-15 figures exactly as drafted in `plan.md` - the instruction scoped the correction to row 43 only.
  2. `npm run format:check` failed once on the first foreground gate run (`.claude/hooks/selftest.mjs` had Prettier-reformattable line wrapping in the new test code - `.md` is prettier-ignored but `.mjs` is not). Fixed with `npx prettier --write` on the three edited hook files (whitespace/wrapping only, no semantic change - reviewed the diff before re-running the gate); this is a mechanical formatting fix within the touched files, not a plan deviation.
  3. Nothing else deviates from `plan.md` section 7's outline: `RTK_READERS`, `evaluateRtkReaders`, `budgetSentences`, the `COLLAPSE`/`TASK_DOCS` constants, the wiring points, and the `selftest.mjs` case numbering are exactly as sketched.

### B3 CI remediation - four cycles, corrected record

This section was rewritten in cycle 4 to state only what is now confirmed.
Two earlier cycles chased an `activeTask()` mtime-tie theory and were wrong
about the cause (recorded below for what each got right and wrong, since
the wrong turns are as instructive as the fix); a third cycle wrongly
declared that theory *confirmed* by a red/green delta that had a different
explanation. The actual cause, found on the first CI run that carried real
diagnostic output, is session-state pruning inside `lib.mjs`'s `saveState()`
- unrelated to `activeTask()` or mtimes.

**Cycle 1 (commit `3504bf7`).** CI run 35076587670 (commit `1106355`)
failed `.claude/hooks/selftest.mjs: 354 passed, 2 FAILED` - `#126`/`#127`,
the two cases asserting the budget sentence is present; `#128`/`#129`/`#130`
passed, which a dead `budgetSentences()` produces vacuously. Hypothesis:
`activeTask()` (`lib.mjs:241`) breaks an exact mtime tie by keeping
whichever `issues/<id>/` directory `readdirSync()` returns first, and
`issues/99/context.md` (left over from `testSessionStop()`) might tie
`issues/98/handoff.md`'s mtime, resolving `activeTask()` to `99` on a
platform whose `readdirSync()` doesn't happen to sort alphabetically the
way NTFS does here. Reproduced as a *mechanism* in a standalone script
(copying `activeTask()`'s own selection loop) - real, but never confirmed
against the actual failure. Fix: pinned `issues/99/context.md`'s mtime to a
fixed old date. `issues/65` was explicitly considered and "ruled out" with
the argument that test `#54` would otherwise also have failed on CI - a
plausible-sounding argument that turned out to be irrelevant, since the
real cause was never in this directory at all. CI stayed red.

**Cycle 2 (commit `743439c`).** CI run 35076587670 on `3504bf7` was still
red, now with `#128`'s new precondition check failing too (working as
designed - it correctly flagged the feature as inert). Fixed a real,
separate discrepancy: the cycle-1 comment claimed it pinned "every other
`issues/<id>` directory", but the code pinned exactly one file - corrected
to enumerate every `issues/<id>/` directory and pin every file in each.
Added `budgetDiagnostics()` - self-diagnosing detail on `#126`/`#127`/`#128`
showing `activeTask()`'s resolution, recorded `writtenPaths`, and a
`statSync` line per task document. A Docker reproduction (`node:22-alpine`
and `node:24-alpine`, six consecutive runs) stayed green throughout with
even the narrower cycle-1 fix, which did not settle anything either way at
the time.

**Cycle 3 (documentation only, no code change - later itself corrected).**
CI run 35083072568 on `743439c` came back green. This cycle wrongly
concluded the mtime-tie theory was thereby *confirmed*, reasoning that the
only behavioural difference between the red `3504bf7` and the green
`743439c` was pinning going from one directory to all of them, so the newly
pinned `issues/65` "must" have been the real competing directory. Wrote
that conclusion into this handoff and into the `testTaskBudget()` comment
as settled fact. **This was wrong**: correlation between "pinned more
directories" and "CI went green" does not identify which change mattered,
and the real cause (below) was untouched by either cycle 1 or cycle 2's
pinning - `743439c` going green was not caused by the mtime work at all.

**Cycle 4 (this cycle) - confirmed cause.** A later CI run on `e2ada3f`
failed again and printed `budgetDiagnostics()`'s output for the first time
on a real failure:

```
#126 ... activeTask() -> id=98 dir=/tmp/loot-hooks-root-.../issues/98 hasContext=false hasPlan=false hasHandoff=true
writtenPaths(session=s-stop-budget) = []
statSync per task document: context.md: not found (ENOENT); plan.md: not found (ENOENT); handoff.md: found, 163840 bytes
systemMessage = ""
```

`activeTask()` resolved **correctly** to `id=98`, and `handoff.md` was
found on disk at the right size. The mtime-tie theory was never the cause,
in either cycle. What was empty is `writtenPaths` - the recorded write had
vanished by the time the hook read state back. Root cause, in `saveState()`
(`lib.mjs` ~line 312):

```js
const ids = Object.keys(sessions).sort((a, b) => (sessions[b].at || 0) - (sessions[a].at || 0));
const pruned = {};
for (const id of ids.slice(0, 5)) pruned[id] = sessions[id];
```

State is pruned to the 5 most recently active sessions, ranked by `at`,
which comes from `nowSeconds()` - **second** granularity. This selftest
file creates many sessions, and the whole suite runs in roughly 8 seconds
on a fast CI runner. When six or more session entries share the same `at`
second, the comparator returns 0 for all of them; `Array.prototype.sort` is
stable, so `Object.keys` insertion order decides - meaning the **earliest**-
created sessions occupy the five surviving slots and the **newest** (in
this case `s-stop-budget`, just written by `recordWrite()`) is pruned out.
Its `wrote` map vanishes, `writtenPaths` reads `[]`, `budgetSentences()`'s
`issues/98/` prefix check fails, and no budget sentence is emitted. This is
why it never reproduced locally or in a container: it needs enough
concurrently-active sessions to land inside one wall-clock second, which a
fast CI runner does routinely and this Windows host and the Docker
container, running the suite more slowly or with fewer competing sessions
at the relevant moment, did not.

**Fix, scoped to the test, no production behaviour changed.**
`testTaskBudget()` now gives its own session a dedicated state directory
(a fresh `mkdtempSync`, `LOOT_HOOK_STATE_DIR` pointed at it for the
duration via both the process env - for the in-process `recordWrite()`/
`getWrote()` calls - and each `runHook()` call's own `state` option - for
the subprocess), so `saveState()`'s prune has nothing else in that file to
prune against. This removes the dependency on session count entirely,
rather than making the tie less likely - a `sleep` would not have fixed
this, since the failure is a *count* of concurrent sessions sharing a
clock second, not a delay to wait out. Restored via `try`/`finally` so
later tests (which rely on the shared scratch state) are unaffected. The
mtime-pin work from cycles 1-2 is **kept** (fixing every `issues/<id>/`
directory rather than one is a real discrepancy worth having fixed, and is
harmless), but the `testTaskBudget()` comment and this handoff no longer
attribute the CI fix to it.

**Not touched, and why:** `saveState()`'s five-session prune and
`nowSeconds()`'s second granularity are production behaviour affecting
every hook invocation, not just this test - changing either is a design
decision for the human, not something to fold into a test remediation.
Left alone; written up as a finding instead (Deferred, below).

**`budgetDiagnostics()` is what actually found this**, on its first real
failure. It is not a false lead this time - it is being kept exactly as
cycle 2 intended it: permanent insurance that a failure explains itself
instead of costing another guessing cycle.

**Standing lesson.** A local or containerized pass does not disprove a
CI-only failure by itself - here it also did not confirm one, because the
"container passed, CI failed, so the mechanism must be right" reasoning in
cycle 1, and the "CI went green after a broader fix, so that fix must have
been the cause" reasoning in cycle 3, are the same error in two directions:
correlation across environments or across commits is not causation without
the actual failing state in hand. `budgetDiagnostics()` exists because
guessing from symptoms cost three cycles; reading its output the first time
it printed on a real failure took one.

**Verification (cycle 4):**
- `node .claude/hooks/selftest.mjs`, run three times -> `357 passed,
  0 failed` each time (same count as cycles 1-3; no case added or
  renumbered, `#1-#130` unchanged).
- Linux, via Docker (`node:24-alpine`, the same repro command as cycle 2)
  -> `357 passed, 0 failed`. This does not prove the flake is gone - only
  repeated CI runs would - it proves the fix does not regress Linux and
  removes the dependency on session count entirely rather than merely
  making the tie less likely.
- Pre-flight, before the foreground check: `Get-CimInstance Win32_Process`
  filtered to `golden.js`/`parity.js`/`run-all.js`/`vitest` -> 0 matches;
  `git status --porcelain -uall` -> only this task's own files modified.
- `set -o pipefail; npm run check 2>&1 | tail -n 120` -> passed clean: no
  `Exit code` line, `format:check`/`lint`/`typecheck` clean (typecheck
  "0 ERRORS 0 WARNINGS"), `data`/derived/i18n consistent,
  `.claude/hooks/selftest.mjs: 357 passed, 0 failed` inline, `vitest run
  --coverage` -> `Test Files 42 passed (42)`, `Tests 1035 passed (1035)`,
  coverage unchanged (96.61% / 88.58% / 97.1% / 97.34%).
- HEAD had moved twice under this session mid-remediation (`0871b1a` before
  cycle 2's commit, `e2ada3f` before cycle 3/4's) - both peer merges from
  unrelated tasks (`tg-preview-refresh`, `art-to-fix`), confirmed each time
  to touch no hook file or README before rebasing/building on top.
- Committed and pushed on top of `e2ada3f`: `2ce3b08`. **Confirmed by CI,
  not just claimed**: run 35086285974, `conclusion: "success"` - `check`
  (runs `.claude/hooks/selftest.mjs`), all four `golden` shards, `audit`,
  `secrets`, and `deploy` all succeeded. This is one green run, not a
  guarantee against a rarer timing than this run happened to exercise - the
  fix's actual strength is that it removes the *dependency* on session
  count entirely (nothing else exists in the isolated state file to prune
  against), which is a stronger property than "passed once," but only
  repeated runs build confidence in fact.

### Selftest count: 111 vs 317, not a stale/fresh pair

- `111` = the count of **named, numbered cases** in `selftest.mjs`'s own header comment ("numbered #1-#111 in the comments below") and in `issues/hooks-guardrails/plan.md` section 5, which assigns those numbers. Still accurate; the header is unchanged.
- `317` = the count of **individual `check() `assertions** `node .claude/hooks/selftest.mjs` reports as `pass` at runtime. The script has 120 `check(` call sites; several sit inside loops over fixture lists, so they fire more than once per run. `317` is the correct number for "does the suite currently pass", which is what every batch's verification command needs.
- Corrected in this batch: `context.md:91` and `:210` (both said "111 cases"/"111 numbered cases" with no further context - now read "111 named cases (317 individual assertions at runtime)"), and the two B2-specific lines in this file (`Status`/gates paragraph above, and this note) that would otherwise have repeated B1's conflation. `context.md:42`'s "111" is unrelated (`MEMORY.md`'s byte count) and was left alone.
- Deliberately **not** touched: `plan.md:366` and `:526` (B1/B2's own already-executed verification-command text, historical) and `plan.md:651-696` (B3's outline, which numbers new RTK-bypass and task-budget test cases `#112`-`#130` against the live `#111`-case scheme - that numbering is still internally consistent and correct as written; replacing "111" with "317" there would have broken it, not fixed it). `plan.md:366`'s "unchanged hooks, expected 111 pass" line is a minor unit mismatch (it means "111 named cases still present", the count that matters for B1's own acceptance) but is historical text for a shipped batch and out of B2's scope to edit.
- **Resolved by B3**: `selftest.mjs`'s header now reads `#1-#130`, and `node .claude/hooks/selftest.mjs` reported `356 passed, 0 failed` at B3's own commit (317 + 39, since several of the 19 new named cases assert more than one thing) - an assertion count above 130, not "130 passed", exactly as anticipated. `plan.md`'s B3 acceptance line ("111 + 19 new = 130 checks' worth...") needed no correction. The CI remediation cycle above added one more unnumbered precondition assertion inside `#128`'s block, so the current count is `357 passed, 0 failed`; the `#1-#130` named-case scheme itself is still unchanged.

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
  - `node .claude/hooks/selftest.mjs` -> `317 passed, 0 failed`. See "Selftest count" above for what "111" and "317" each measure; `selftest.mjs` itself is untouched by B1 (confirmed via `git status --porcelain .claude/hooks/selftest.mjs` before and after, no diff).
  - No `npm run check`, `npm run check:built`, or parity run executed (not required; B1 is markdown-only and commit-gate exempt).
- Results: as above; no hook, test or app file touched.
- Gates: none run (planning only).

- B2 verification commands (exact) and results:
  - `grep -c "Read \`CLAUDE.md\` first" .claude/agents/{planner,implementer,reviewer,add-source,refresh-artwork}.md` -> `0` for every file.
  - `grep -rin fable .claude CLAUDE.md` -> only `orchestrate.prompt.md:190,193,208,212` (the "Planner tier" subsection) and `.claude/README.md:23` (the one added sentence).
  - `grep -n "^model:" .claude/agents/planner.md` -> `model: opus` (unchanged).
  - `grep -n "tools:" .claude/agents/reviewer.md` -> `tools: Read, Grep, Glob, Bash`.
  - `grep -n "Planner tier" .claude/prompts/orchestrate.prompt.md` -> `190:### Planner tier: \`opus\` by default, \`fable\` by named escalation`.
  - Wrapper rule mapping table verified by reading each cited prompt line before deleting the wrapper's copy (all 5 prompts): every cell matched content already present, except refresh-artwork wrapper rule 9 ("update task context/handoff when durable recovery notes are useful"), which had no matching line in `refresh-artwork.prompt.md`'s closing section (confirmed by `grep -n "context\.md" .claude/prompts/refresh-artwork.prompt.md` returning nothing) - added the line the mapping table specified instead of merely checking for it.
  - `node .claude/hooks/selftest.mjs` -> `317 passed, 0 failed` (unchanged; B2 touches no hook).
  - No `npm run check` run (not required; B2 is markdown-only and commit-gate exempt).
- Results: as above.
- Gates: none run (markdown-only, commit-gate exempt).

- B3 verification commands (exact) and results:
  - Pre-flight, re-confirmed twice (before the probes and immediately before the foreground check): `Get-CimInstance Win32_Process -Filter "Name='node.exe' or Name='chrome.exe'"` -> no `golden.js`/`parity.js`/`run-all.js`/`vitest` process and no `chrome.exe` crowd, only MCP/tsserver helpers; `git status --porcelain -uall` -> only this task's own edits plus the untouched `issues/tg-preview-refresh/`.
  - `node .claude/hooks/selftest.mjs` before any B3 edit -> `317 passed, 0 failed`.
  - `node .claude/hooks/selftest.mjs` right after the code edits (before touching `#19`) -> `316 passed, 1 FAILED` (`#19 grep quoting`, denied by the new 2j rule - exactly the case `plan.md` flagged as needing a narrower fixture).
  - `#19` narrowed to `grep -r` (no `-n`); `testRtkReaders()` and `testTaskBudget()` added; header `#1-#111` -> `#1-#130`.
  - `node .claude/hooks/selftest.mjs` -> `356 passed, 0 failed` (317 baseline + 39 new assertions from the 19 new named cases, several of which assert multiple things per case).
  - Live probe 1: `grep -n guard .claude/hooks/lib.mjs` -> denied: `` Blocked: `grep -n` runs outside RTK and its output lands unfiltered in context. Use `rtk grep -n <pattern> <path>` as its own command (no pipe, no `$(...)`), or the Grep tool, which numbers lines by default. `git grep -n` is not affected. ``
  - Live probe 2: `rtk grep -n guard .claude/hooks/lib.mjs` -> ran normally, printed 6 matching lines from `lib.mjs` (`guard(fn)` definition and five comment mentions).
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` (first attempt) -> `Exit code 1` at `format:check`: `[warn] .claude/hooks/selftest.mjs` - Prettier-reformattable line wrapping in the new test code.
  - `npx prettier --write .claude/hooks/selftest.mjs .claude/hooks/bash-guard.mjs .claude/hooks/session-stop.mjs` -> `Prettier: All files formatted correctly` (whitespace-only diff, reviewed before re-running).
  - `node .claude/hooks/selftest.mjs` after the format fix -> `356 passed, 0 failed` (unchanged).
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` (second attempt) -> passed clean: `format:check` clean, `lint` clean, `typecheck` "0 ERRORS 0 WARNINGS", `data`/derived/i18n all consistent, `.claude/hooks/selftest.mjs: 356 passed, 0 failed`, `vitest run --coverage` -> `Test Files 42 passed (42)`, `Tests 1035 passed (1035)`, coverage table present with `All files` at the top (96.61% / 88.58% / 97.1% / 97.34%).
  - Staged by name (`git add .claude/README.md .claude/hooks/bash-guard.mjs .claude/hooks/selftest.mjs .claude/hooks/session-stop.mjs`, never `-A`); `git status --porcelain -uall` before commit showed exactly those 4 files plus the untouched `issues/tg-preview-refresh/`.
  - Committed and pushed: `7cc259d`. `git log --oneline -3` -> `7cc259d` on top of `5a36c4a`/`27ac065` (the peer session's issue-56 work), confirming nothing was reset or rebased. `git branch -r --contains 7cc259d` -> `origin/main`; `git rev-list --left-right --count origin/main...HEAD` -> `0 0`.
- Results: as above; `check:built` and parity not run (no app source changed, per `context.md` "Command costs").
- Gates: `npm run check` passed (second attempt, after the Prettier fix); `node .claude/hooks/selftest.mjs` passed standalone.

## Next batch
- None implement-ready. All three planned batches (B1, B2, B3) are landed and pushed. B3's CI failure took four remediation cycles - see "B3 CI remediation" for the corrected record - and is now fixed at its actual cause (session-state pruning in `saveState()`, worked around in the test by giving `testTaskBudget()` its own state directory). **Confirmed: CI run 35086285974 on `2ce3b08` is green** - `check`, all four `golden` shards, `audit`, `secrets` and `deploy` all success (2026-09-16). Read that with the caution a flaky test earns: `743439c` was also green once, on a theory since disproven. What makes this different is not the green run but the fix being structural (the test's session is alone in its own state file, so the prune cannot reach it) plus the separately measured proof of the mechanism recorded under Deferred. Closeout is done - see Cleanup performed / retained artifacts.

## Blockers
- None. **CI run 35086285974 on `2ce3b08` is green** (`check`, all four `golden` shards, `audit`, `secrets`, `deploy` all `success`), confirming the session-state-pruning fix. Said plainly, for what it is worth: the fix removes the *dependency* on session count (nothing else exists in the isolated state file to prune against, so the prune cannot reach this session regardless of timing), which is a stronger property than "less likely to flake" - but this is one green run, and only repeated runs build confidence in fact, the same caution that cycle 3's now-corrected claim skipped.
- The tree-quiet check has been re-run before every foreground gate across all four remediation cycles, most recently before cycle 4's: `Get-CimInstance Win32_Process` filtered to `golden.js`/`parity.js`/`run-all.js`/`vitest` -> 0 matches each time; `git status --porcelain -uall` -> only this task's own edits. HEAD moved under this session twice mid-remediation (peer merges `0871b1a` then `e2ada3f`, from unrelated tasks `tg-preview-refresh` and `art-to-fix`) - confirmed each time to touch no hook file or README before rebasing/building on top.
- ~~The reviewer `tools:` probe (B2 acceptance, README row 41)~~ **cleared 2026-09-16** by the orchestrator. A dispatched reviewer reported exactly `Read`, `Grep`, `Glob`, `Bash` and nothing else; `Edit`, `Write`, `NotebookEdit`, `Agent`, `ToolSearch`, `SendMessage` all absent. The frontmatter allowlist is enforced on this host, so row 36 is closed in fact. Recorded in README row 41 with two limits the probe surfaced: `permissionMode` is not observable from inside a subagent without performing an action (that half stays unverified), and `Bash` in the allowlist means read-only still rests on the prompt and permission settings rather than on the `tools:` line - a shell redirection writes.

## Deferred
- **New finding (2026-09-16, `config-audit` B3 remediation cycle 4), bigger than this task: `recordWrite()`'s data can be silently dropped in real use, not only in the test suite.** `lib.mjs`'s `saveState()` prunes `.hook-state.json` to the 5 most recently active sessions, ranked by `at` (`nowSeconds()`, second granularity); on a tie the comparator returns 0 and `Array.prototype.sort`'s stability keeps insertion order, so the **oldest** surviving entries win, not the newest - backwards for what is meant to behave as a most-recent cache. Five is a low cap on a machine that routinely runs several concurrent Claude sessions (this task alone has shared a tree with `tg-preview-refresh` and `art-to-fix` peers within one afternoon). A session's recorded writes are what `session-stop.mjs`'s uncommitted-work, staleness, and budget sentences all depend on (`getWrote()`) - if a session's entry is pruned before `Stop` runs, those sentences silently do not fire for it, with no error and no warning. This is flagged, not proposed: `saveState()` and `nowSeconds()` are production behaviour affecting every hook invocation, and whether/how to fix the cap, the tie-break direction, or the granularity is a design decision for the human to make, not something folded into a test remediation. See `.claude/hooks/selftest.mjs`'s `testTaskBudget()` and this file's "B3 CI remediation" (cycle 4) for the diagnostic evidence that found this.
  - **Measured, not inferred** (orchestrator, 2026-09-16, this Windows host, standalone probe against `lib.mjs` with a throwaway `LOOT_HOOK_STATE_DIR`): eight `recordWrite()` calls for sessions `other-1`..`other-8` followed by one for `s-stop-budget`, all inside one second. Result: `sessions kept: other-1,other-2,other-3,other-4,other-5`, and `getWrote('s-stop-budget')` empty - `s-stop-budget survived the prune: false`. The five slots go to the eight-way tie's *earliest* entries and the just-written session is discarded. Note what this also shows: the defect is not CI-specific and not Linux-specific. It needs only six or more sessions inside one `nowSeconds()` tick, which a fast runner produces and an interactive host usually does not - that timing difference, not the platform, is the whole of why it read as flaky.

- **For issue 47 (human to carry into R0c's plan):** (1) compact `issues/47/{plan,handoff,context}.md` at R0c's closeout per `.claude/skills/handoff/SKILL.md` - this task installs the budget and does not compact (D4); (2) `CLAUDE.md` "Task and session protocol" cites `docs/parity.md`, "Batch size and the fixed cost of a run" - R0c deletes that file and must retarget the citation; (3) `CLAUDE.md` line numbers move in B1 (199 -> 181); R0c's plan cites sections by name, so re-read the file rather than any recorded number.
- **For the owner, outside this repo:** the persistence design's 17.4 names the audit prompt as `docs/agent-audit.v6.prompt.md`; no such file exists here (the prompt is `audit.prompt.md` on the desktop). User-level listing pressure (20 resume skills, `docx`/`pptx`/`xlsx`) and the owner-local `.claude/skills/impeccable/` (model-invocable, not in `context.md`'s count of 58) are the owner's call; the 2026-10-15 re-measure should count `impeccable`.
- `rg -n` as a further RTK-bypass reader (README, "Known limitations"): revisit on 2026-10-15 if measured.
- ~~Closeout of this task~~ **done 2026-09-16** - section 5 moved to `.claude/README.md`, row 42 retargeted, `plan.md` and `mocks/` removed in the closing commit. See Cleanup performed / retained artifacts.

## Notes
- Mocks path: `issues/config-audit/mocks/CLAUDE.proposed.md`; `issues/config-audit/mocks/skills/{orchestrate,handoff,small-fix}/SKILL.md`. Text artefacts, not visual mocks; this task has no UI.
- Screenshot findings: none (no UI).
- Cleanup performed / retained artifacts (closeout, 2026-09-16):
  - **Removed** this task's `plan.md`. Durable content was rehoused first, in the same commit, because rule 2i denies the deletion while any tracked file still cites the path: section 5 ("Persistence era: decided now, activated at Phase 0") now lives in `.claude/README.md` as its own section, verbatim, and candidate row 42 points there instead of at the plan. Three citations in this file were rephrased for the same reason (the rule counts every tracked citation, not only the README's). A `git grep` for the plan's path returned nothing outside the target file before the removal.
  - **Removed** this task's `mocks/` (`CLAUDE.proposed.md` and `skills/{orchestrate,handoff,small-fix}/SKILL.md`). Disposable by design: B1 copied all four verbatim into their shipped homes (`CLAUDE.md`, `.claude/skills/*/SKILL.md`), so the mocks were a staging area, not evidence, and the shipped files plus git history carry everything.
  - **Kept** `context.md` and this `handoff.md`, per the closeout procedure - `context.md` holds the measured baselines (both `rtk discover` runs, byte counts, skill-listing budget) that the 2026-10-15 re-measure compares against.
  - **Kept, not this task's to touch**: `.claude/skills/impeccable/` (owner-local, untracked, referenced by the ignored `settings.local.json`) - never staged at any point. `issues/tg-preview-refresh/` (untracked, another task's) - untouched throughout B1, B2, B3 and closeout.
  - Nothing else was created by this task outside `issues/config-audit/`; the Docker image pulled for the Linux reproduction (`node:22-alpine`, `node:24-alpine`) lives in the local Docker cache, not the repo, and no container was left running.
- Session end partial progress (if any): none; B1, B2 and B3 all complete, committed and pushed (`779fae6`, `d61aadb`, `7cc259d`, all on `origin/main`), plus four B3 CI remediation commits (`3504bf7`, `743439c`, a local-only documentation commit later corrected rather than pushed, and cycle 4's - see "B3 CI remediation" and the Status section for the last one's hash). Each remediation session re-confirmed before its foreground check that the tree carried only this task's own edits and no peer heavy run was alive.
