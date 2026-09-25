# Claude / Codex agent wiring

| Agent | Prompt | Default model frontmatter |
|-------|--------|---------------------------|
| planner | prompts/plan.prompt.md | opus |
| implementer | prompts/implement.prompt.md | opus |
| reviewer | prompts/review.prompt.md | opus |
| add-source | prompts/add-source.prompt.md | opus |
| refresh-artwork | prompts/refresh-artwork.prompt.md | sonnet |

Orchestrator: prompts/orchestrate.prompt.md

## Host-aware explicit routing policy

Claude hosts use the frontmatter defaults above and human-controlled
session-level effort. On Codex, the orchestrator explicitly passes `model` and
`reasoning_effort` on every worker dispatch with `fork_turns: "none"` or a
bounded positive count. The role defaults are Sol/medium for planner and
reviewer, and Terra/medium for implementer, add-source, and refresh-artwork.
The only Codex ladder is Sol -> Terra -> Luna; Luna is only for an explicit,
bounded low-risk mechanical or read-only helper. `medium` is the default and
`high` the only escalation. See prompts/orchestrate.prompt.md. The planner's
tier can be escalated to `fable` for one dispatch under the named tests in
prompts/orchestrate.prompt.md, "Planner tier"; the frontmatter stays `opus`,
and a resume keeps its tier. An implementer batch runs on `sonnet` only when
it passes every test in "Writer tier" in the same prompt.

The orchestrator owns final reconciliation and cleanup: wait for workers, align context/plan/handoff, preserve evidence and unrelated work, and remove only clearly disposable task-scoped scratch artifacts.

Per-task scratch under issues/<id>/, deleted at closeout (`CLAUDE.md`,
"Task and session protocol"): context.md, plan.md, handoff.md, optional
mocks/. Durable content never waits there - see `docs/DECISIONS.md` and
the specs.

Kickoff:
  Follow .claude/prompts/orchestrate.prompt.md
  TASK: <id>
  GOAL: <feature or add source items...>

## Skills

Three project skills, all manual (`disable-model-invocation: true`),
so they cost nothing in the skill listing and are followed by reading
the file when an agent needs them:

| Skill | File | Owns |
|---|---|---|
| `/orchestrate` | `skills/orchestrate/SKILL.md` | one pointer to `prompts/orchestrate.prompt.md` |
| `/handoff` | `skills/handoff/SKILL.md` | closeout, retirement (the durable list and the homes), the size budget, compaction |
| `/small-fix` | `skills/small-fix/SKILL.md` | a single-file visual bug pinned to a width: reproduce at that width first, then fix, every gate, commit; no planner, no `context.md`, no review |

`.claude/skills/` is untracked as a directory because it also holds
owner-local tools; the three files above are tracked by name.

The `<!-- setup-claude-agents -->` markers around `CLAUDE.md`'s
Orchestration section came from `29f8920`, this repository's own
wiring commit; no generator on this host reads them. The block is
hand-owned and edited in place.

**Rejected: converting `.claude/prompts/*` into skills.** The prompts cost
zero tokens in a normal session - a dispatched worker reads one only through
its ~1-1.5 KB wrapper - while the skill listing is a hard budget
(`skillListingBudgetFraction` 0.01, ~8,000 chars) already ~2.8x
oversubscribed, and Claude Code drops descriptions starting with the
least-invoked skills on overflow.

**Rejected: three third-party skill/MCP installs**, considered together
against the same budget: superpowers and mattpocock-skills (14 and 25
listing descriptions each, retiring none of the ones here; a `SessionStart`
hook that injects mandatory-workflow directives; `using-git-worktrees`
fights one-session-per-tree); a Playwright MCP (no Playwright tests exist in
this repository; rejected three times on record); a markdown-health-check
skill (ships executing scripts, and would not have caught the commit-gate
trap row 45 fixed).

## Resuming a worker

A subagent that ended its turn is still listed and still holds its
context; `SendMessage` to its name resumes it from its transcript, and
its reply arrives as an ordinary task notification. Measured 2026-09-11
on the Windows desktop app - the host `git show b2eec64:.claude/improvements.md` Finding 1 and
the orchestrate prompt (until this change) recorded as unable to do it:

| Direction | Status | Evidence |
|---|---|---|
| main session -> its own subagent | works, context intact | the issue 47 B9 implementer, resumed with the review's blocker after its turn had ended, kept every fact and produced `84ca6df` |
| subagent -> main session | works | a probe loaded `SendMessage` via `ToolSearch` and delivered a line that arrived as `<agent-message from="...">` |
| subagent -> sibling subagent | **unproven** | only one subagent was alive; the probe's reported sibling id was its own. Settle it with two live subagents before designing on it |

A send carries no model; a resumed agent keeps its tier.

Facts that bound the rules in `prompts/orchestrate.prompt.md`, "Resume,
do not replace":

- `SendMessage` is not in a subagent's default tool list here; a subagent
  must `ToolSearch select:SendMessage` first. No prompt currently tells a
  subagent to send; one that does must say this. `ListAgents` is built in
  and lists the parent, the subagent itself and every peer session.
- A send carries no `model`; a resumed agent keeps its tier. Escalation is
  a fresh dispatch.
- A subagent's send goes out under its parent session's address and any
  reply lands in the parent's conversation, so two subagents cannot hold a
  conversation on this host; one-way dispatch is what exists.
- Direct reviewer -> implementer routing was proposed and declined
  2026-09-11: it drops the orchestrator's blocker/nit filter without
  dropping a hop (the reply still lands in the parent's conversation, not
  the reviewer's), and the filter has a measured save - the B9
  remediation, where the implementer was told the reviewer's
  third-deviation concern was already resolved and not to re-litigate it.
- Resuming a finished writer while another writer is live is two writers
  on one tree - the same violation as spawning one. The orchestrator does
  the `ListAgents` and HEAD preflight before a resume as before a spawn.
- Whether the reviewer's `permissionMode: plan` blocks `SendMessage` is
  unknown; the review prompt forbids the send in prose (candidate 36).
- The Bash tool resets its cwd to the session's pinned directory between
  calls - carry an explicit `cd` prefix when working pinned elsewhere. An
  `issues/<id>/` directory can exist on more than one branch at once; only
  `main`'s copy is the live one - check `git branch --show-current` before
  trusting anything read under `issues/`.

## Hooks

Deterministic enforcement lives in `.claude/hooks/*.mjs`, registered in
`.claude/settings.json`. Every script exits 0 on every path - a throw, a
missing file, or absent git lets the action through. The only blocks are the
ones listed below; everything else is silent or a message. `session-start.mjs`
is the one exception to the fail-open-on-bad-stdin contract the rest honour:
it builds its report from git and the `issues/` scan, never from stdin, so it
speaks even on malformed input.

Host and tool facts behind this design, kept so nobody re-derives them:

- Verifying the selftest on Linux from this Windows host: `git archive HEAD
  .claude package.json | tar -x -C <scratch>`, then run inside a `node:22`
  container. Never bind-mount the repository and run git inside the
  container - `git add -A` over a Windows bind mount of ~1000 files hangs
  for minutes.
- `jq` is not installed on this host, so a shell hook's defensive
  `command -v jq || exit 0` exits silently every time - a guard that can
  never fire. Every hook here is Node for this reason.
- A deny in `bash-guard.mjs` returns before the long-check reminder fires,
  so a deny never consumes the once-per-session reminder marker and the
  foreground retry still gets the reminder once. Rejected: consuming the
  marker inside the deny.
- Node v24 on this host: `process.kill(pid, 0)` throws `ESRCH` for a missing
  pid and `EPERM` for one it cannot open - "throws" is not "dead" - and an
  ESM hook can `await import()` a CommonJS file and read its exports as
  `.default`.
- `selftest.mjs`'s task-budget test isolates itself with its own state
  directory; any change to `lib.mjs`'s `saveState()` must keep that
  workaround working.
- A Windows worktree whose `node_modules` is a directory junction to the
  primary checkout's fails `npm run check` at the Svelte-diagnostics step:
  Vite cannot write `.vite-temp` through the read-only junction, and the
  failure looks like a real diagnostics error. A private dependency copy
  inside the worktree fixes it.
- A worktree-isolated session calls `git.exe`, not `git`: the RTK hook
  rewrites a line that starts with `git` into `rtk git ...`, and the
  isolation guard then refuses it because it cannot read which root the
  launcher targets. `git.exe` matches neither. Measured 2026-09-19.
- A second session editing `.claude/hooks/**` concurrently makes this
  session's `npm run check` fail in ways that read as its own bug:
  `selftest.mjs`'s pass count changes between consecutive runs with no edit
  from this session (420 -> 430 observed), and a format warning appears in a
  file this session never touched - the symptom behind `CLAUDE.md`'s
  one-session-at-a-time rule.

| Event | Matcher | Script | What it does | Block or warn |
|---|---|---|---|---|
| `SessionStart` | - | `session-start.mjs` | Reports branch, HEAD, dirty files, most recently touched `issues/<id>/`. In a cloud session (`CLAUDE_CODE_REMOTE=true`) also runs seven probes - Node against `.nvmrc`, `docker info` (3 s), the puppeteer cache, `node_modules`, `gitleaks version` and `rtk --version` (2 s each), and the proxy's authorities in `~/.pki/nssdb` (`bash .claude/cloud-nss.sh --check`, 3 s: every CA by sha256 fingerprint; on a failure it names `bash .claude/cloud-nss.sh`) - each "ok" or what failed, and states the three cloud rules ("Cloud sessions"). `LOOT_SKIP_PROBES=1` (selftest) reads each probe as "skipped". | warn (informational) |
| `PreToolUse` | `Bash\|PowerShell` | `bash-guard.mjs` | A PowerShell command is normalised first (each backtick and the character after it become a space, `\` becomes `/`) and then judged by the same families; a cmdlet such as `Remove-Item` is not judged (`docs/DECISIONS.md`, 2026-09-24). Persistence-era families, after attribution: **2n** is an allowlist of `supabase` commands, deny by default (`docs/DECISIONS.md`, 2026-09-25, "Agents may write to the test project; production is CI's or the owner's"): `--help` or `-h` anywhere is allowed (help never writes, and the CLI refuses a help flag in a value position), while `--version` and `-v` pass only on the bare CLI (`db reset --version <timestamp>` is a reset); a `db *`, `migration *` or `config push` command whose every target is the test project - `--project-ref rdjxcjkhsklhprmzxajq` (`TEST_PROJECT_REF`, equal to `PROJECTS.test` in `tools/supabase/lib.mjs`, which `tests/derived.js` asserts), or a `--db-url` with no query string whose host is `db.<ref>.supabase.co` (user `postgres` or `postgres.<ref>`) or a `*.pooler.supabase.com` host with the user `postgres.<ref>` - is allowed, while `--linked`, a variable or no target is no proof; otherwise the first two words look up a table: always allowed are the bare CLI, `start`, `stop`, `status`, `init`, `completion`, `migration new`, `functions new`, `functions serve`, `test new`, `config diff` and `db start` (it has no `--local` flag and only ever starts the local database); `db push` and `db dump` need `--dry-run` or the local stack; `db reset`, `migration down`, `migration list`, `migration squash`, `db diff`, `db lint`, `gen types`, `test db`, `inspect db` and `seed buckets` need `--local` with none of `--linked`/`--db-url`/`--project-ref`; `migration up` needs none of those three; every other pair (`link`, `login`, `secrets`, `functions deploy`, `storage`, `projects`, `config push` or `migration repair` without the test target, an unknown word) is denied. `npm run config:push`/`db:push` is allowed only with `--project test` and no other `--project`. The CLI counts as run through a path ending in `supabase` (`node_modules/.bin/supabase`), `node <...>/supabase/dist/supabase.js` (the tools' own entry), `npx`, `npm exec` or `npm x` (past their flags, a `-p`/`--package` value and a bare `--`), or `rtk`; a `.exe`/`.cmd`/`.ps1`/`.bat` suffix is dropped from every program (`git.exe` is `git`), and `--local=false` or `--dry-run=false` counts as absent; **2o** in a cloud session only, denies a `git push` from `main` or a detached HEAD, with `--all`/`--mirror`/`--tags`/`--delete`/`-d`, or to any destination but the current branch or `HEAD`; **2l** runs `gitleaks git --pre-commit --staged --config .gitleaks.toml --redact` (4 s timeout per scan, so two scans fit the hook's 10 s) before every non-dry-run `git commit` and denies on a finding, naming `file:line (rule)` and never the secret - it speaks, and allows, when gitleaks is missing, slow or fails, and has no bypass; for `git commit -a` or a commit with a pathspec (`--pathspec-from-file` counts as the whole tree) it runs a second scan without `--staged` (the unstaged working-tree diff), so the two scans cover whatever any commit form can take from the tree, and a finding in either denies; **2m** after the check gate: a commit staging `supabase/**` or `tests/db/**` (or `-a` over them, or a pathspec that names their unstaged changes - 2e unions the unstaged paths a pathspec matches, as it unions all of them for `-a`) needs a passing `npm run check:db` for the tree key (`.check-db-cache.json`). `SKIP_CHECK_GATE=1` bypasses 2e and 2m together. Then, as before: blocks `git reset --hard`, forced `git clean`, a `git push` with any force form, `git checkout`/`restore` discards (including `restore --staged --worktree`), `git stash drop`/`clear`, `rm -r` inside the repo with or without `-f`, `rm`/`git rm` of any file under an `issues/<id>/` or of the directory while a tracked line outside it cites `issues/<id>/` (a `git show <sha>:path` citation is exempt), blanket staging (`git add -A`, `git commit -a`) with 2+ dirty paths, AI attribution in a commit message, commits when `npm run check` has not passed for the covered paths (the
fingerprint drops every `isExempt()` path - `issues/<id>/` markdown,
`.claude/README.md`, `docs/specs/` - so an edit confined to those cannot
arm or break the gate; `tree-key.mjs`), a backgrounded `npm run check` (plain or `rtk`-prefixed), a `npm run check`/`check:built` inside a pipe or redirected to a file (rule 2k - the pipe hands the tool the last stage's status, so a failed check reads as a pass; the redirect hides the stdout the gate needs), and `grep -n`/`tail -c` in a shape `rtk 0.48.0` is measured never to rewrite (`grep -n`: a non-final pipe stage, inside `$(...)`/backtick, or wrapped by `xargs`/`nohup`/`time`; `tail -c`/`--bytes`: any position at all, chain or pipe - it has no byte-offset rewrite) - a bare, chained (`&&`/`;`/`cd`), or pipe-final-stage `grep -n` passes through for RTK's own hook to rewrite; restructure a denied one into `rtk grep`/`rtk read`. Reminds once per session per command family before a long check, including an unsharded `golden.js`/`sweep.js` call - a sharded `run-all.js --shard=n/m` call is not read as the safe form by contrast, it gets the same reminder on its own merits, since a single bin can itself run past the idle-host minute mark (`.claude/README.md`, "Batch size and the fixed cost of a run"). | **block** (+ one allow-and-remind case) |
| `PreToolUse` | `Edit\|MultiEdit\|Write\|NotebookEdit` | `edit-guard.mjs` | Blocks writes to `data.json`, `catalog.csv`, `i/*.html` (with `i/en/*.html`), `en/index.html`, `pages/*.html`, `pages/en/*.html`, `dist/`, `dist-test/`, `package-lock.json`, `tests/app/snapshots/**`, and a `supabase/migrations/<file>` that a remote-tracking ref holds (`git for-each-ref refs/remotes/`, then `git cat-file -e <ref>:<path>`; CI applies every pushed migration, so a pushed one is history - "write a new migration instead"). No file records applied migrations; a repository with no remote ref, or a git failure, blocks no migration. | **block** |
| `PostToolUse` | `Bash\|PowerShell` | `check-observer.mjs` | `npm run check:db` from either tool: reads the output from `tool_response.stdout`, else `.output`, else a string response, plus `stderr`; a `check:db: PASS` line writes `.check-db-cache.json` and says "Commit gate armed for supabase/ and tests/db/", a `check:db: FAIL` line or a failure marker says FAIL, neither says it cannot attribute the run. `npm run check` arms from Bash only, as follows. Records a passing `npm run check` against the current tree fingerprint, so the commit gate has something to check against. Accepts a leading `cd <dir> &&` or `cd <dir>;` (PowerShell 5.1 has no `&&`), `set -o pipefail;`, and `rtk `. States the verdict in one line - `PASS` and armed, or passed-but-unattributable - so the result needs no second run to establish. On this host a failed call never reaches it (see "Run a long check"), and no exit-code field reaches it at all. | warn (one line per passing check; silent otherwise) |
| `PostToolUse` | `Edit\|MultiEdit\|Write\|NotebookEdit` | `edit-followup.mjs` | Records the write for the `Stop` hook. Reminds once per session per group about `data.js` -> `node tools/build.js` and public-contract fixtures. Known false-positive, kept as a nag rather than fixed: it tests `p.startsWith('docs/fixtures/')`, so it fires its public-contract reminder on any write under `docs/fixtures/share/`, which is not itself a contract surface (`CONTRACTS.md` enumerates only `docs/fixtures/lists/*.json` and `docs/fixtures/urls/routes.json`) - the reminder firing there is not evidence a contract moved. | warn |
| `Stop` | - | `session-stop.mjs` | Warns when this session's own writes are still uncommitted, or the active task's `handoff.md` looks stale next to what this session wrote. Separately names this session's own writes that are still untracked (excluding `docs/` and the task-document set - `context.md`/`plan.md`/`handoff.md`/`mocks/` - in any `issues/<id>/`), as candidates for either a commit or deletion; never both sentences for the same path. Warns when a task document of the active task is past its size budget (150 KB; past 300 KB it names the collapse action per file), only for the session that wrote into that task directory. | warn, never block |

**Settings besides hooks.** `.claude/settings.json` also sets `attribution`
(`commit` and `pr` empty, so the harness adds no attribution line) and `env`
(`GIT_AUTHOR_*` and `GIT_COMMITTER_*` as `artex-x
<artex-x@users.noreply.github.com>`), the commit author since 2026-09-25
(`docs/DECISIONS.md`, "Commit author and attribution are set in
`.claude/settings.json`"). Both are read at session start, so an edit
applies from the next session. `bash-guard.mjs` rule 2d (an attribution line
in a commit message) stays as the backstop for a session or host that does
not load them.

**There is no git pre-commit hook** - not to be confused with the Claude
Code hooks above, which run in this harness, not in `git` itself. One
existed early in issue 47 and was removed (migrated here from that task's
`plan.md`): it ran `eslint --fix` over
staged files, over 150 seconds for three of them on a mounted working copy
against 3.5 seconds for prettier - the cost was reading `node_modules`, not
linting - and it was a strict subset of `npm run check`, which CI runs on
every push, so the only thing it added was a reason to pass `--no-verify`. A
guard that gets waved through is worse than no guard.

**Hook config may be snapshotted at session start.** Editing a hook script or
`settings.json` may have no effect on the session that made the edit - restart
the session, or run `/hooks`, to pick it up. On this Windows desktop build the
opposite has now been observed twice, deny path included: a script edited
mid-session blocked a command minutes later, so the scripts are re-read per
invocation here. Do not rely on either behaviour across hosts.

Four runtime files live under `.claude/` and are gitignored
(`.claude/.gitignore`):

| File | Written by | Contents |
|---|---|---|
| `.check-cache.json` | `check-observer.mjs` | `{ key, at, command }` for the last observed passing `npm run check`. |
| `.check-db-cache.json` | `check-observer.mjs` | `{ key, at, command }` for the last observed passing `npm run check:db`, against the same tree key. |
| `.check-index` | `tree-key.mjs` | A throwaway copy of the real index, never the index itself. `tree-key.mjs` finds the index with `git rev-parse --git-path index`: in a linked worktree `.git` is a file, and the old `<root>/.git/index` path made the key null there, so every commit gate failed open in a worktree until 2026-09-24. |
| `.hook-state.json` | `lib.mjs` | Per-session dedupe markers and the set of paths each session wrote. Holds the 64 most recently active sessions; the session being written is always kept. The cap bounds the session count, not a session's own `wrote` map, which still grows without limit for the life of one session. A save writes a temp file and renames it over this one, so a reader never parses a half write. The read-modify-write is not guarded against a second session saving in between: one session per working tree is the protocol, and a lost save costs one duplicate reminder or one missing Stop sentence (fail open). |

**Escape hatch:** `SKIP_CHECK_GATE=1 git commit -m "..."` bypasses the commit
gate (the `check` and the `check:db` rules together) and announces the
bypass to the human via `systemMessage`. It must be a real environment
prefix in the Bash tool; merely naming it in a commit message does nothing.
Use it only when a check genuinely cannot run - not because it is
inconvenient. gitleaks has no bypass: fix the finding or allowlist it in
`.gitleaks.toml`.

### Run a long check

So the gate can see it pass, and so you can read the result:
`check-observer.mjs` reads the Bash tool's own captured
stdout, and only trusts stdout it can attribute to the check: the
command must start with the check invocation (a leading `cd <dir> &&` or
`cd <dir>;`, a leading `set -o pipefail;`, and a leading `rtk ` are all fine - none
of them writes to stdout), must not chain anything after it (`&&`,
`;`, `||`), and must not redirect stdout to a file. The one
invocation, in one foreground call with the Bash tool's `timeout` set
to 600000:

```text
rtk npm run check
```

Each part is load-bearing:

- **No pipe needed to learn whether it passed** - and, since candidate 46,
  no pipe allowed. `rtk` propagates the
  child process's own exit code directly (verified: a script exiting 3
  came back `exit=3`) and prints both stdout and stderr, so the tool's
  own exit line already carries the check's status. A pipe throws that
  away: the tool reports the last stage's status, `tail` always exits 0,
  and a failed check reads as a passing one. That is now a `PreToolUse`
  deny (rule 2k), because 61 of 71 recorded invocations piped anyway.
  Unpiped, the two outcomes are each unambiguous on their own line: a
  failure opens with `Exit code 1`, and a pass ends with
  `check-observer.mjs` saying `npm run check: PASS. Commit gate armed`.
  (The observer says nothing on a failure here - a failed Bash call
  returns a plain string rather than the usual object and the hook does
  not speak; probed 2026-09-18 against a check failed at its prettier
  stage. The `Exit code 1` line already carries it.) This used to need
  `set -o pipefail; npm run check 2>&1 | tail -n 120`, because RTK's
  hook rewrites only a command it can match at the start of a line and
  a piped `npm run check` is exactly the shape it cannot rewrite - so
  that piped form was, until this rule accepted a leading `rtk `, the
  *only* invocation that reliably armed the gate at all (`CHECK_INVOCATION_RE`
  was anchored at `^npm`, and RTK silently turns a bare `npm run check`
  into `rtk npm run check` before any hook sees it - live-probed,
  `rtk-coverage` B1). The piped form still works and `check-observer.mjs`
  still accepts its prefix, but there is no reason to build one now.
- **The timeout is how the call survives.** The tool never kills a
  command; when it outlives its `timeout` it is moved to the
  background (`Command did not complete within its 120s timeout and
  was moved to the background`), and for a subagent that is a lost
  run. The default is 120 s and the check is ~165 s (stage by stage:
  format 11s, lint 30s, typecheck 12s, data 4s, derived 1s, dataint
  ~2.6s,
  selftest 19s, vitest with coverage 88s), so a check call without a
  timeout cannot finish in the foreground. 600000 is the tool's
  maximum; a check that outlives even that is the fork-pool stall
  below, not a timeout problem.
- **Measured with `rtk`, it now crosses the output cap.** A result over about
  30,000 characters is not shown - the tool saves it to
  `tool-results/<id>.txt` and names the path. `rtk npm run check`'s full
  output (both stdout and stderr, unpiped) measured 21,382 characters
  across 361 lines on this host (`rtk-coverage` remediation,
  2026-09-18), and 31.2 KB on 2026-09-24 once `tools/supabase/lib.test.mjs`
  joined the chain. The observer still sees the whole stdout and arms the
  gate, and its PASS line still reaches the transcript; grep the persisted
  file for `All files` or `fail` rather than re-running the check - the deleted parity
  harness hit the same cap from its diff lines carrying a page's whole
  text; nothing that survives R0c produces a single line that large,
  but the technique still applies if something ever does.

`npm run check > out.txt 2>&1` then reading the file does **not**
satisfy the gate, however genuinely the run passed - the hook never
saw the output, and reading the file back costs a second call. It is
blocked at `PreToolUse` alongside the pipe (rule 2k). Nor does a run started with
`run_in_background`: `check-observer.mjs` returns early on it by
design, because there is no stdout to attribute yet. Backgrounding
cost three worker runs on issue 47 and is now blocked at
`PreToolUse` (candidate 27), for a plain or `rtk`-prefixed check alike.

**The database suite.** `npm run check:db` (layer 3, `docs/specs/COVERAGE.md`)
needs Docker. On this Windows host run it through the **PowerShell** tool,
one foreground call with the tool's `timeout` set to 600000:

```text
npm run check:db
```

The first run pulls the images (measured 2026-09-24: `supabase start` with
the excludes took 288 s, pulling the `postgres` and `gotrue` images); a warm
run takes about a minute (`db reset --local` plus the suite; the four
`db dump --local` snapshots of the fixture gate cost about 4 s each). With
the reversibility base check (two more `db reset --local`) a run took 220 s,
140 s of it the base check (2026-09-25). Its
last stdout line is `check:db: PASS` or `check:db: FAIL`, and
`check-observer.mjs` arms the `supabase/` and `tests/db/` commit rule from
the PASS line. The observer matches the command at its start, so a run
wrapped in anything (a timer such as `$s = Get-Date; npm run check:db; ...`)
passes and arms nothing; the commit is then refused by rule 2m
(2026-09-25). Run the command alone. Measured live on 2026-09-24: a PowerShell call reaches the
`PostToolUse` hook with the PASS line in its text and no exit-code field
(the verdict line carried no `(exit n)`), and the `Bash|PowerShell`
matchers took effect in the session that saved them. The CLI's progress
lines go to stderr and print after the suite's stdout.

**More host facts about a long check, recorded so nobody re-derives them:**

- Without `rtk` (the Linux cloud container, measured 2026-09-24) a plain
  `npm run check` prints about 65 KB, over the tool's output cap, so the
  result is persisted to a file and `check-observer.mjs` cannot arm the
  gate. A green run there is committed with `SKIP_CHECK_GATE=1`, and the
  exact command and result are recorded in the task's handoff. Chromium is
  at `/opt/pw-browsers` there (`PLAYWRIGHT_BROWSERS_PATH`, Playwright's
  browser path); the puppeteer suites under `tests/app/` do not read it -
  `tests/app/lib.js` launches puppeteer's own Chrome from
  `~/.cache/puppeteer`, which `npm ci` installs, with no setup. Wall clocks
  there (2026-09-24): `node tests/run-all.js app/states` 130-160 s, each
  `golden.js --shard=n/4` 130-137 s - both fit one foreground call.

- The Bash tool can sometimes not start at all on this Windows host
  (`CreateInstance: E_ACCESSDENIED`); any Bash-only wrapper for the check is
  then unavailable too, and the fallback is running `rtk npm run check`
  directly, in the foreground.
- Rule 2g denies an explicitly backgrounded check, but a foreground call
  that outlives its 600 s timeout is backgrounded by the harness itself,
  and `check-observer.mjs` then never reports to a live agent - the gate
  cannot arm and the rule cannot see it either. Hit three times in one
  task. Candidate fixes considered, none chosen: Stop-time reconciliation,
  a longer-lived observer, accept-and-document.
- A PowerShell here-string (`@'...'@`) inside the Bash tool is not a
  here-string there - it left a literal `@` as a commit subject once. Use
  a real heredoc in Bash instead.
- Transcript census on this host (3,094 Bash calls over 15 sessions and 26
  subagent transcripts): 296 calls set an explicit `timeout`, 72 of those
  at 600000; 135 `run_in_background: true` launches (69 sleep/poll loops,
  35 parity, 11 vitest, 8 check, 3 run-all); 75 results persisted over the
  output cap, `npm run check` never among them.
- Claude Code desktop notifies the main session when a background command
  exits, so a backgrounded run is lost only when the launcher is a
  subagent whose own turn has already ended - the commit gate cannot see
  either case, which is why rule 2g is scoped to the gate-feeding check.
- Git Bash here: `set -o pipefail` turns a SIGPIPE into a failure -
  `yes | head -n 2` exits 0 without the prefix and 141 with it; `| tail`
  drains its input so it never fires there. Prefix a run whose exit status
  you actually need, never everything.
- No second canonical form circulates: exactly one check-invocation string
  is quoted everywhere in this repository's own guidance, and a `git grep`
  over `.claude CLAUDE.md docs` is the standing enforcement.
- A hex `.check-cache.json` tree-key literal is never quoted in a task
  document as itself - abstract it to a placeholder (`<key-A>`..); `.gitleaks
  .toml`'s allowlist stays untouched. The owner's standing answer after
  `secrets` flagged `generic-api-key` on a quoted key: a cache key is data
  that looks like a secret to a scanner, so it is written as a placeholder,
  not exempted.
- Do not cap `maxForks` or set `isolate: false` to survive a loaded host:
  capping doubles the check's cost on every healthy run, and `isolate: false`
  trades away the jsdom isolation the component suite rests on.
  `--maxWorkers=4` stays an ad-hoc fallback only, not a standing setting (see
  the memory-starvation caveat above).
- How to falsify a claimed-armed commit gate without committing: read
  `.claude/.check-cache.json`'s `key`, compute `treeKey()` by invoking the
  module against the working tree, and compare. A tool-auto-backgrounded run
  that completed exit 0 did not move the cache; a probe commit was denied
  naming "35 checked files" as still unaccounted for.
- Vitest traps that cost time to notice: `--reporter=basic` no longer exists
  in the installed version; `coverage.reportOnFailure` is off by default, so
  a red vitest run writes no coverage summary at all; and a component test
  rendering 300+ rows must not `userEvent.type` character by character (one
  `input` event per keystroke, each re-rendering every row, crossing 30 s
  under coverage) - use `userEvent.click` then `userEvent.paste` instead.

**What the check does not cover: markdown.** `.prettierignore` has
carried `*.md` since `5ab5880` (2026-08-30), with its reasoning beside
it - the markdown here is wrapped by hand because a line break carries
meaning in the specs, and the licence line is pinned by
`tests/derived.js`. `prettier --file-info` reports `"ignored": true`
for a handoff, a spec and `CLAUDE.md` alike. So an `issues/**` or
`docs/specs/` edit can neither fail a check nor be corrupted by one,
and there is no reason to hold off editing a handoff while a check
runs - which is also why the commit gate exempts those paths
(`isExempt`). To change that, remove the one line from
`.prettierignore`; the reasoning is written next to it. Beware the
opposite error too: `npx prettier --check <some>.md` prints "All
matched files use Prettier code style!" while matching zero files, so
a success message there is not evidence of anything.

**Shell hazards on this host**, gathered in one place so nobody re-derives
them mid-batch:

- Git Bash rewrites an argument beginning `#/` into a Windows path (`"#/i/ci1
  @"` arrives as `#I:/ci1 @`) - prefix with `MSYS_NO_PATHCONV=1` (PowerShell
  does not convert, so this is Git-Bash-only). `node tests/app/golden.js
  --only="#/..."` is the recurring case.
- `kill -0 <pid>` answers in the MSYS pid namespace and can report a live
  `node` process dead; use `tasklist //FI "PID eq <pid>"` or `Get-Process -Id
  <pid>` instead.
- A backgrounded run's `.output` file reads 0 bytes until the run actually
  flushes - that is not a lost result while the pid is still alive, only an
  unflushed one.
- Docker on this host is Rancher Desktop 1.24 (engine 29.5.3, linux, context
  `default` on `npipe:////./pipe/docker_engine`; measured 2026-09-24). It
  answers the PowerShell tool; the Git Bash tool hangs on `docker version`.
  Run `docker`, `npx supabase start|status|db reset` and `npm run check:db`
  through PowerShell. Docker Desktop 3.6.0 is also installed and is not used
  (its client panicked on `docker info`).
- Python's `write_text` converts LF to CRLF on Windows: a round trip through
  it leaves every line "changed" even though `git diff` shows nothing (git
  normalises line endings) while `git status` still says modified. Write
  bytes, or pass `newline=''`, when a script must touch a tracked text file.
- Use a quoted heredoc (`<<'EOF'`) for anything containing backticks: an
  unquoted one ran `npm ci` from inside a comment being written to a file,
  deleting `node_modules` while another session was four minutes into a
  check.
- `docker run --rm` with no redirect loses everything once the container
  exits (`docker logs` has nothing after `--rm` removes it) - always
  redirect a container run's stdout to a host file.

### Code navigation

Measured across this project's 65 session transcripts (2026-09-18): the
`Grep` tool 109 calls, `rtk grep` 90, `git grep` 55, **LSP 16** - all of
them in the three sessions that installed it, and only `hover` and
`documentSymbol` - and **`ast-grep` 1**, which was `ast-grep --version`.
Nothing under `.claude/`, `CLAUDE.md` or `docs/` named either tool except
`agents/reviewer.md`'s `tools:` list, which grants LSP without saying what
it is for. An agent told to follow a prompt file exactly had no reason to
reach for either. Hence this section, and the pointers in the prompts.

Use the most semantic tool that answers the question:

1. **LSP** for symbol questions on `.ts`, `.js` and `.svelte`. It is a
   *deferred* tool: load it once per session with `ToolSearch("select:LSP")`
   before the first call, or it is not callable.
   - `findReferences` **before renaming a symbol or changing a signature**.
     It answers in one call, exactly, what a grep sweep answers in several
     and approximately - probed here, 11 references to `foldQuery` across
     two files, instantly.
   - `goToDefinition`, `goToImplementation`, `hover` for one symbol;
     `incomingCalls` / `outgoingCalls` for a call chain.
   - **Not `workspaceSymbol`.** It returns `No symbols found in workspace`
     on this host whatever the query (probed 2026-09-18). Locate the file
     with grep first, then ask LSP a positional question about it.
   - **Not `documentSymbol` on a large file.** It returns every symbol in
     the file and can cost more than reading the file.
   - There is no diagnostics operation. Type errors come from the project's
     own gate, `npm run check`.
2. **ast-grep** for structural searches LSP cannot express. Invoke it as
   `ast-grep`, never `sg` - the deprecated alias prints a banner into
   context on every call. Know its failure mode before trusting it: a
   pattern that does not match the tree exits 1 with **no output at all**,
   which reads exactly like "this code does not exist". `function $N($$$A)
   { $$$B }` matches nothing in `app/src/lib/search.ts`, not because there
   are no functions but because those carry return type annotations.
   Confirm a pattern against one file you know matches before concluding
   anything from an empty result. Rule syntax: the `ast-grep` and
   `ast-grep-outline` skills. RTK does not wrap `ast-grep` (`rtk --help`,
   0.45.3), so its output lands unfiltered - prefer `ast-grep`'s own compact
   output modes and never post-filter it with a pipe, which also defeats the
   RTK hook for the whole line.
3. **`rtk grep`** for plain text - comments, strings, config values,
   documentation, filenames, exact strings. It needs `-E` for alternation:
   `rtk grep "a|b"` matches nothing and exits 1, which reads as "absent"
   and produced one wrong conclusion on 2026-09-18 before it was caught.
   `git grep` takes alternation without a flag and is faster than a
   recursive `rtk grep` over a tracked tree; a recursive `rtk grep` over
   `.claude`/`docs` outlived a 120s Bash timeout in the same session.

Do not use raw `grep -n`; `bash-guard.mjs` rule 2j blocks the shapes RTK
cannot rewrite.

### Batch size and the fixed cost of a run

The rule is in `CLAUDE.md`, "Task and session protocol": size a batch by
its gates, not its diff. This section holds the numbers behind it and the
test for where the line is. Moved here from `docs/parity.md` at R0c
(2026-09-17), which deleted that file along with the parity harness it
documented; the parity rows below are replaced by the gates that survive.

**What a batch pays whatever its size**, measured in this repository
(2026-09-10/11 and 2026-09-17, one host):

| gate | idle host | loaded host |
|---|---|---|
| `npm run check` | ~165s | past the Bash tool's 600s foreground cap; a run that crosses it is backgrounded, cannot arm the commit gate, and must be re-run - not salvaged |
| `npm run check:built` | a few minutes | longer |
| `node tests/run-all.js app/print,app/contracts,app/states,app/typo,app/hues,stub` | ~260-290s pooled | longer |
| `node tests/app/sweep.js <width>` | ~320-590s per width | longer; `app/sweep` as a whole (`run-all.js app/sweep`, all four widths) is past the cap and must run width by width |
| `node tests/app/golden.js --shard=n/4` | ~100-290s per shard | longer; the four shards must run separately, never as one bare `node tests/app/golden.js` call |
| `node tests/run-all.js <suites> --shard=n/m` | varies with what the packer bins together - measured up to ~372s for one bin (`sweep1180-ru`: 371.9s(ru)/172.7s(en), CI run `35232880507`) | longer; a shard's own bins are not interchangeable with `ci.yml`'s matrix count (`tests/derived.js` asserts the two agree) |

Re-measured on this host on 2026-09-25, at the end of the accounts release:
`npm run check` 348 s (vitest with coverage 200 s of it, 52 files and 1517
tests; the hook selftest 719 cases), `npm run check:built` 19 s, `node
tests/run-all.js app/states` 197 s. The check has grown with its suites, so
plan by these figures, not by the table's 165 s.

`check:built` and the `tests/app/` filters are paid once per batch; `npm run
check` is paid once per commit inside it. None of these scale with the
diff: eight paths and forty paths cost the same minutes.

Every figure in that table is a load figure, not a constant - the golden
suite on one unchanged `dist/` measured seeding at 414.6s and comparison at
1005s, 105/105 files byte-identical; the 2.4x gap between the two is not the
compare path itself (one read, split, join per section over 5.2 MB, a second
of work, not 590) - host contention was partly present but never
established. The suite prints capture time out of total on every run for
this reason: capture close to total means the browser or host is the cost;
capture at ~415 of 1005 means a real cost sits in the compare path.

On this Windows/Git-Bash host, `node tests/app/golden.js --only="#/..."`
needs `MSYS_NO_PATHCONV=1` in front (see "Shell hazards on this host",
"Run a long check"); without it the `#/`-leading argument is path-converted
and the filter silently matches nothing. Separately, `npm run check`'s own
`npm run data` step can move `data.json`/`catalog.csv` mtimes with unchanged
content, so a build run before the check no longer satisfies the
stale-build guard - rebuild after the check (`npm run build:test` before any
`dist-test/`-driven suite or golden probe, `npm run build` before
`tools/smoke-http.mjs`).

The full unsharded browser suite
(`app/sweep,app/typo,app/hues,app/contracts,app/states`) runs ~648s in 8
threads, past the Bash tool's 600000 ms cap: it auto-backgrounds even when
launched foreground at maximum timeout, and an in-session completion
notification carrying a result table is not evidence - the captured output
file has to be read.

A bare, unsharded `node tests/run-all.js` (~15 minutes, every suite) cannot
fit the Bash tool's 600000 ms maximum at all - the long-check reminder's
"stay in this turn" is unobeyable for it, which is why the sharded form
above is the only one that belongs in a foreground call.

This table is about a **local** foreground call. A CI job's fixed cost is
about twenty seconds (checkout, setup-node, `npm ci`, `npm run build`), not
minutes - `tests/run-all.js`'s `--shard=n/m` and `ci.yml`'s `browser` matrix
split the real-Chrome suites across four such jobs for exactly that reason.
CI run 36105652165 (2026-09-25): the `browser` shards' suite steps 361, 367,
367 and 224 s; the `e2e` job's `npm run e2e` step 20 s. CI run 36124766953
(2026-09-25): `migrate-test` 1 s when the test project is up to date, `npm
run e2e` 26 s. CI run 36131497583 (2026-09-25): the whole `e2e` job 66 s, the
whole `browser (1)` job 385 s.
Merging work to share a CI job's fixed cost follows the opposite logic from
merging a batch to share this table's local one.

The sharding trade, measured on CI runs `35214847899` -> `35232880507`: wall
clock 738s -> 436s (-41%), billed runner-seconds +27% - not the +10%
projected; the owner accepted the price.

**The two ways to get it wrong.**

1. *Too small.* A batch that adds one port and one component test still pays
   a check, a `check:built` and a `tests/app/` filter run - most of an hour
   on an idle host for a change a reviewer reads in five minutes. Three such
   batches pay three times what one would.
   Phase 8's first plan (2026-09-17) split about a hundred findings into
   twenty batches - eighteen `npm run check` runs, roughly 2.5 hours of gate
   time before any test of the work - and was merged to eleven on the
   owner's instruction.
2. *Too big.* A batch whose `npm run check` cannot finish inside one
   foreground call on the host as it is, or whose review cannot be held in
   one pass, forfeits everything when the host stalls: B5.3 (26 paths)
   needed six check attempts under load; B5.4a (43 paths) lost two sessions
   to a loaded host between "written" and "step 10 green". The cost of a
   stall is the whole run again, plus the review and the one remediation
   cycle the protocol allows.

**The test.** Merge two pieces of work when they share a component, a seed
and a `tests/app/` filter - then the filter run for the merged batch costs
what it would for either alone, and nothing is paid twice. Keep them apart,
or cut a batch, at any of these:

- a public-contract change (`CONTRACTS.md`, `docs/fixtures/`,
  `tests/contracts.js`, `llms.txt` in the same commit) - it needs its own
  commit and its own review;
- a different route and filter set - the cost is not shared, only
  serialised, so merging saves a `check` and nothing else;
- a commit boundary the harness cannot reach (a state that needs a driver
  verb or a seed that does not exist yet) - the piece that adds the
  reach lands first, on its own commit, so a later red bisects;
- a batch that could not end on a coherent committed boundary - half a
  surface on screen with faked controls is never a stopping point
  (`CLAUDE.md`, "never commit a half-batch").

A batch may hold more than one commit; each commit is green on its own.
Aim for one `tests/app/` filter group and one green check per batch; a
worked application is the Svelte migration's own R0b, cut at two named
seams: a different route and filter set (the print port is `#/print/*`
alone - its own routes, fixtures, instrument) and a review that could not be
held in one pass (~650 lines of transposed geometry). The jsdom and
real-browser placements were deliberately *not* a seam - one check, one
build, one `tests/app` run covered both.

A second worked application, at the opposite extreme: a terminal
103-row nit-clearing batch (`B12`) could not be one commit, so it split into
four consecutive pieces at exactly three seams, each named in this
section's own terms rather than by feel:

| seam | criterion |
|---|---|
| `B12a` \| `B12b` | a commit boundary the harness could not yet reach - `B12a` added the fail-closed stale-`dist/` guard every later piece's browser proof depends on, so it had to land first, on its own commit |
| `B12b` \| `B12c` | a review that could not be held in one pass - production source (judged against the architecture boundaries and able to move rendered output) and harness/tooling/CI (judged against `COVERAGE.md`, unable to move rendered output) are two different judgement frames over ~51 one-line rows |
| `B12c` \| `B12d` | a different route and filter set - `B12d`'s gates (`app/states`, `app/print`, `app/contracts`, a `sweep.js` width, golden probes) share nothing with `B12a`-`B12c`, and it alone carried the phase's three owed real-browser measurements |

Merging *inside* each piece stayed deliberate throughout: `B12c` alone
carried 21 unrelated tooling rows across ~15 files on one `check` and one
CI watch, because none of the three seams above cut between them.

**"One heavy run at a time" retired with the parity harness (R0c,
2026-09-17).** `tests/parity.js` used to write `test-output/parity.lock`
(`pid`, `startedAt`, heartbeat `at`, `argv`) while it ran, and
`bash-guard.mjs` read the same lock through `tests/parity/lock.js` to
block a heavy run (`npm run check`, `npm test`, `npm run build`, and the
parity/run-all families) beside a live one. Nothing writes that lock
today - `run-all.js` and `golden.js` never did - so two heavy runs (a
`npm run check` and a `node tests/app/golden.js`, say) can now collide on
one tree with no guard against it beyond "one session at a time per
working tree" (`CLAUDE.md`). Still open, owned by no task, and this
paragraph is its home: whether the still-surviving heavy
runs (`run-all.js`'s pool, the four `golden.js` shards) need a lock of their
own, now that the class of collision the old one caught can recur - weighed
against the Playwright decision beside it, since a second real-browser
driver would need a guard of its own too.

**This host silently downclocks under load.** `% Processor Performance` read
20 on its i7-8565U across four samples while vitest tests took 27-264 s and
three hit the 30 s timeout; with the throttle gone (145-154) the same suite
ran 1007/1007 in 63.69 s. The tell that it is throttle, not regression: the
failing set differs run to run on an unedited tree, and the same files pass
in isolation. The one-minute recognition test, run before any gated batch:
read `Get-Counter '\Processor Information(_Total)\% Processor Performance'`,
or time `npm run format:check` - ~11 s means the gate sequence fits one
foreground call, ~55-60 s means it will not and waiting will not change it
(measured 19.98-20.01 on the counter for hours straight; recovery read
137-148 the same day, with nothing done to the machine).

The negative result cost three sessions: nothing on the software side starves
this build. "Total CPU 75-95%" and "`explorer.exe` at 62%" were percentages
of a throttled capacity, not evidence of a hog; sampled during a real run the
top consumers were prettier's own node processes, a peer Claude session costs
about 0.2 cores, and `NGenuity2Helper` holds one core (heat on a 15 W part,
not the cause). Not power policy either (AC, Balanced). Thermal or a stuck
EC/DPTF state is what is left; `MSAcpi_ThermalZoneTemperature` is
unavailable on this host, so a human at the machine is needed to confirm it.
Git Bash's `time` measures nothing useful here either - its `user`/`sys`
fields read zero for Windows child processes.

Proof by isolation, on a surviving test: `sharedListPage.test.ts:296` failed
in 2 of 6 full-suite runs on one tree and passed alone 20/20 in 63.8 s -
failing only under full-suite load and passing alone is the signature of
contention, not regression.

**A runaway `svelte-language-server` is the one software-side starver found.**
Measured 2026-09-23: one such process, alive for ~8 CPU-hours since the night
before, held ~1.35 cores without a break. Symptom: `npm run check`'s vitest
step took 566-612 s, past the 600 s cap, and five runs failed only on
timeouts (`searchPage.test.ts` "the cap" at 32-44 s against 30 s, once
`sharedListPage.test.ts`); both files passed alone. Check Task Manager for
the process before a gated batch; a restart cleared it and the next check
was green.

**A check reporting zero coverage everywhere ran no test at all.** Vitest's
fork-pool worker start timeout is 60s and hardcoded (`START_TIMEOUT` in
`vitest/dist/chunks/cli-api.*.js` - no config knob), and `isolate` defaults to
true, so the forks pool spawns one child per test file. When the host cannot
boot a child in time, every file fails in turn and the output reads
`Test Files no tests`, `Errors <file count>`, `Failed to start forks worker ...
Timeout waiting for worker to respond`, with zeros down the whole coverage
table. Nothing ran, so nothing regressed - re-run it rather than investigating
a coverage drop. If it repeats on the same tree,
`npx vitest run --coverage --maxWorkers=4` is the measured fallback and costs
171s against 88s; the gate still needs a real `npm run check` call afterwards.
Free memory does **not** predict this: the failing session had 2.9 GB free and
the passing one 1.0 GB, so do not build a rule around watching it. That
171s/88s figure was itself measured with memory to spare - "free memory does
not predict this" holds in the 1-3 GB range, but `--maxWorkers=4` makes the
stall *worse*, not better, under real memory starvation: one run measured
1067s against 437s, 13 failed worker starts against 11, at 0.35 GB free of
15.82 GB with the CPU pegged. 0.35 GB is a different regime from the 1-3 GB
this fallback was measured against - do not reach for `--maxWorkers=4` there.

Run the tests: `node .claude/hooks/selftest.mjs` (also wired into `npm run
check`; it skips when git is not on PATH). It never touches this repository's
tree or state - every case runs against a throwaway git repo in the OS temp
directory.

Known limitations of `bash-guard.mjs`'s sanitiser, recorded rather than
papered over. It is a guard against habit and haste, not against an
adversary:

- A command hidden inside `sh -c "..."` or `bash -lc '...'` is erased with the
  quoted span and matches nothing.
- A quoted span is only preserved when it is a single shell-inert word, so
  `git reset "--hard"` is caught but `git reset "--hard HEAD~1"` is not.
- `git commit <pathspec>` with an explicit path can slip a checked file past
  the commit gate; CI still runs the suite.
- Wrapper stripping covers `env`, `command`, `nohup`, `time` and `xargs`, not
  every possible launcher.
- There is no guard at all against two heavy runs (`npm run check`, a
  `run-all.js` pool, a `golden.js` shard) colliding on one tree - the
  `test-output/parity.lock` mechanism that used to catch this retired with
  the parity harness at R0c, above.
- The orphan-task-directory rule (row 40) is invisible to a deletion through
  `git clean`, through `node -e "fs.rmSync(...)"`, through an unexpanded glob
  (`rm issues/<id>/*` reaches the hook as the literal token), or from the
  human's own terminal.
- It is also invisible to a citation living only in an untracked file:
  `git grep` searches tracked files.
- The RTK-bypass deny (row 43) sees the program token only: `sh -c "grep -n
  ..."` is erased with its quotes like every other quoted command, and `rg -n`
  is not covered (not in the measured miss).
- The orphan-task-directory citation exemption only recognises one family: a
  citation immediately preceded by `<sha>:` or `HEAD:` (`git show <sha>:path`
  form). Family 2 - a citation split across lines, or wrapped some other way
  that still resolves through history - is not recognised and still denies.
- `rm -r` without `-f` inside the repo denies the same as `rm -rf`; `dist`,
  `coverage`, `test-output`, `node_modules` and `i` (build output, not
  source) are exempt from both. There is no separate, gentler rule for the
  non-forced form.
- `session-stop.mjs` parses `git status --porcelain` with a bare
  `row.slice(3)`: a rename row (`R old -> new`) or a quoted path (spaces,
  non-ASCII) is mis-parsed, and the Stop warning names the wrong path or
  goes silent. A parser, not a one-line fix.
- `LONG_CHECKS`'s pattern for `npm run check` also matches `check:fast`, so
  the long-check reminder quotes the full-check wall clock for a command
  that costs far less.
- `check-observer.mjs`'s attribution rule strips a leading `cd` before
  testing for a `$(...)`/backtick substitution, so `cd $(pwd) && npm run
  check` passes the test - judged not a forgery vector, since a
  substitution's own stdout never reaches the tool's captured stdout.
- Not `bash-guard.mjs`, but worth recording beside it: `activeTask()`
  (`lib.mjs`, shared by `session-stop.mjs` and other hooks) picks the
  `issues/<id>/` directory with the newest file mtime, and on an exact tie
  keeps whichever directory `readdirSync()` returns first - filesystem-
  dependent, not alphabetical on every platform. A test (or any script) that
  depends on which task is "active" must pin the mtimes of every other
  `issues/<id>/` directory to something safely old, not just the one
  directory it expects to compete with. Traced from a CI-only failure
  (`config-audit` B3, 2026-09-16): `.claude/hooks/selftest.mjs`'s
  `testTaskBudget()` pinned only one competing directory, passed on this
  host and in a Linux container, and still failed on the GitHub runner -
  the real competing directory was a different one, rewritten later in the
  same test run, that neither local environment's filesystem happened to
  tie against. Pinning every directory's files, not just the one suspected,
  fixed it.
- `saveState()` (`lib.mjs`) keeps the 64 most recently active sessions and
  always the one being written. A session loses its record - and its Stop
  hook goes silent - only when 63 other sessions have written after its last
  hook call. Before `hook-state-cap` (2026-09-16) the cap was 5 and a tie at
  second granularity evicted the writer itself; the loss was silent and cost
  `config-audit` B3 four remediation cycles. The cap of 64 was sized against
  the live state file on 2026-09-16: 5 sessions (the old cap), `at` values
  spanning ~71 h, `wrote` maps of 1-23 paths - ties are rare in ordinary use,
  which is what the cap is sized against. The old defect reproduces
  deterministically: eight `recordWrite()` calls for eight other sessions,
  then one more inside the same second for the session under test, keep the
  first five and leave the last empty - `at` is second-granularity, the
  comparator returns 0 on a tie, and `sort` is stable, so insertion order
  wins. The recipe to re-check any future change to `saveState()` against.
  Four alternatives were considered and rejected when that fix was designed
  (`hook-state-cap`, 2026-09-16); they are recorded here so nobody re-derives
  them after the task directory retires:
  - **Fixing the tie-break instead of reserving the writer.** Moot once the
    writer is reserved: after a reload, key order is the previous save's
    ranking rather than creation order, so a tie-break carries no reliable
    recency information in either direction.
  - **A TTL instead of, or alongside, the count cap.** Under recency ranking
    dead sessions already leave before live ones, so a TTL adds nothing to
    correctness and introduces a new silent-loss path: a session resumed after
    the TTL expires Stops with its writes forgotten.
  - **Millisecond granularity for `at`.** `session-stop.mjs` scales
    `wrote[p] * 1000` against `mtimeMs`; changing the unit breaks the
    staleness sentence for new entries until a migration runs, and buys
    nothing once the writer is reserved.
  - **Warning when an entry is dropped.** At save time a live entry is
    indistinguishable from a dead one, and at Stop the hook cannot tell
    "never wrote" from "evicted", because entries are created lazily and a
    read-only session has none. The answer to silence here is margin plus
    tests that fail loudly on regression, not a sentence nobody can trust.

Facts settled during implementation (issue 65):

- Measured: `All files` (vitest's coverage-table header) reliably appears in a
  passing `npm run check`, and does not appear alongside the failure markers
  (`npm error`, `ELIFECYCLE`, `FAILED`, `Tests \d+ failed`) in a passing run.
- Looked up, not measured: `tool_response.exit_code` is the numeric Bash
  exit-code field, per the official hooks reference. `check-observer.mjs` also
  accepts `exitCode`/`returnCode`/`code`/`status`/`exitStatus`, and treats a
  missing field as a pass, so the design stays correct even off this host.

Facts settled during implementation (`hooks-guardrails`, 2026-09-10):

- `PreToolUse(Bash)` fires on a backgrounded call, and denies it under rule
  2g (probe A): `tool_input.run_in_background` reaches the hook as `true`.
- `tool_input`'s key list depends on what the caller set: a foreground call
  with an explicit `timeout: 600000` carries `["command","timeout","description"]`
  with `timeout` a number; a call with no `timeout` carries
  `["command","description"]` - the key is absent entirely, not present as
  `null` (probe A0).
- A live lock denies a heavy run and names the holder's pid and filter; a
  dead-pid lock does not deny, and after a run acquires over it and exits,
  the lock file is gone (probe B).
- On the Bash tool, `false | tail -n 2` comes back as `(Bash completed with
  no output)` and `set -o pipefail; false | tail -n 2` as `Exit code 1`.
- A command that outlives its `timeout` is moved to the background, not
  killed - 27 recorded results.
- A result over about 30,000 characters is persisted to
  `tool-results/<id>.txt`, largest shown 29,787, smallest persisted 29.8 KB.

Facts settled during measurement (`agent-effort`, 2026-09-11):

- `$CLAUDE_EFFORT` in a worker's Bash tool reports the level it runs under;
  the PowerShell tool does not carry it on this host.
- A subagent's Bash tool reports its **parent's** session id in
  `$CLAUDE_CODE_SESSION_ID`, so no instrument can attribute a line to a
  worker by session id; hook input's `agent_id`/`agent_type` are the only
  discriminators.
- Writes to `.claude/agents/**` are refused by the permission classifier on
  this host ("Blocked by classifier"), via both `sed -i` and the Edit tool,
  until the owner approves - a frontmatter probe needs that approval first.
- Hook input's `effort` field is `{ level }` (docs; not measured here - the
  fallback instrument that would read it was not needed).
- **Propagation, measured**: three probes against three controls read
  `high` / `low` / `high` in lockstep with the session (W1=E0, W2=E1,
  W3=E0) - session effort propagates to a dispatched worker.
- **Frontmatter `effort:` key, unverified**: one probe under a session at
  `high` still read `high` while `implementer.md` carried a scratch
  `effort: low` line. Agent definitions may be read once at session start,
  so a mid-session edit could simply not have been seen; a fresh-session
  repeat, not yet run, would settle it - the same standing as
  `disallowedTools` at candidate row 36.
- Model default effort is `high` on every model that supports effort, which
  is why a single `high` reading under a `high` session proves nothing;
  contrast levels must be `low` vs `high`.
- `set_session_effort` refuses the calling session and targets sessions, not
  subagents - the orchestrator has no lever to set a worker's effort per
  dispatch, only the human's own session control or `/effort`.

Facts settled during measurement (`rtk-coverage`, 2026-09-18): the measured
boundary behind rule 2j (candidate row 43), pinned to `rtk 0.48.0`. Every row
below is `rtk hook check "<command>"`, run directly in this repository's
worktree. `rtk hook check` prints the rewritten command on a rewrite, and
exits 1 with `No rewrite for: <command>` otherwise - that exit code is the
signal, not the text.

`grep -n` / `--line-number`:

| shape | rewritten? |
|---|---|
| `grep -n foo path.ts` (bare leading) | yes -> `rtk grep -n foo path.ts` |
| `A=1 grep -n foo path.ts` (env-var prefix) | yes -> `A=1 rtk grep -n foo path.ts` |
| `cd docs && grep -n x f` | yes -> `cd docs && rtk grep -n x f` |
| `true; grep -n x f` | yes -> `true; rtk grep -n x f` |
| `echo ok && grep -n x f` | yes -> `echo ok && rtk grep -n x f` |
| `grep -n x f && echo ok` | yes -> `rtk grep -n x f && echo ok` |
| `grep -n x f &` (backgrounded) | yes -> `rtk grep -n x f &` |
| `npm run check; grep -n x f` | yes -> `rtk npm run check; rtk grep -n x f` |
| `env grep -n x f` | yes -> `env rtk grep -n x f` |
| `command grep -n x f` | yes -> `command rtk grep -n x f` |
| `cat f \| grep -n x` (pipe, grep is the FINAL stage) | **yes** -> `cat f \| rtk grep -n x` |
| `a \| b \| grep -n x` (3-stage pipe, grep final) | **yes** -> `a \| b \| rtk grep -n x` |
| `grep -n x f \| wc -l` (pipe, grep is the LEADING stage) | no |
| `grep -rn x . \| head -50` (pipe, grep leading) | no |
| `a \| grep -n x \| b` (pipe, grep is a MIDDLE stage) | no |
| `find . -name x \| xargs grep -n x` | no |
| `cat f \| xargs grep -n x` | no |
| `xargs grep -n x` (bare, no pipe) | no |
| `nohup grep -n x f` | no |
| `time grep -n x f` | no |
| `echo $(grep -n x f)` | no |
| `echo \`grep -n x f\`` | no |
| `echo $(cat f \| grep -n x)` | no (substitution wins over the pipe-final-stage exemption) |

The boundary is not "leading segment" and not "outside a pipeline." Both were
tried and both are wrong: "leading segment only" (the first cut) under-denied
- `grep -rn x . | head -50` (grep leading a pipe) was silent, and unfiltered
recursive grep output reached context; "anything in a pipeline is never
rewritten" (the remediation brief that replaced it) over-denied - `cat f |
grep -n x` (grep as the pipe's own *final* stage) is measured rewritten, so
denying it was a wasted round trip with no safety benefit. The actual rule:
`grep -n` rewrites everywhere except (a) a non-final pipe stage, (b) inside
`$(...)`/backtick at any internal position, or (c) wrapped by `xargs`,
`nohup`, or `time`. `env` and `command` are transparent to RTK (measured,
both rewrite), but `bash-guard.mjs` cannot tell them apart from the blocking
three using `lib.mjs`'s shared `unwrap()` (which strips all five uniformly),
so it treats every wrapper as blocking - a same-cost-as-before false deny for
`env`/`command`, never a false allow.

`tail -c` / `--bytes`:

| shape | rewritten? |
|---|---|
| `tail -c 200 f` (bare leading) | no |
| `tail --bytes=20 f` (bare leading) | no |
| `cd d && tail -c 20 f` | no |
| `cat f \| tail -c 20` (pipe, tail trailing) | no |
| `tail -c 5 f \| wc -l` (pipe, tail leading) | no |
| `echo $(tail -c 20 f)` | no |
| `tail -n 20 f` (contrast: `-n`, not `-c`) | yes -> `rtk read f --tail-lines 20` |
| `cat f \| tail -n 20` (contrast: `-n`, piped) | no (unlike `grep -n`, `tail -n` does not get a pipe-final-stage exemption either - not relevant to this rule, since it only matches `-c`/`--bytes`, but recorded here so a future change to `tail -n`'s row does not assume it behaves like `grep -n`) |

`rtk read` has no byte-offset mode - only `--tail-lines` - so `tail -c`/
`--bytes` has nothing to rewrite into, in any position, chain or pipe. This
rule denies it unconditionally once matched; there is no leading- or
final-stage exemption to grant it the way there is for `grep -n`.

Two more facts from the same measurement pass, not specific to either
table above:

- `rtk discover` measured RTK rewriting only 38% of Bash commands overall,
  because 2025 of 3642 sampled commands (55%) contain a `|` or `$(...)` and
  RTK's hook rewrites only what it matches at the start of a line - the
  ceiling every repo-owned hook in this section sits on.
- Under host load each `bash-guard.mjs` subprocess spawn measured
  ~800-1200 ms, so a full `node .claude/hooks/selftest.mjs` can outlive the
  120 s default timeout and be backgrounded although it exits 0; bisected
  case by case with a 5 s per-case timeout, nothing hangs.

Facts settled during measurement (`phase-8`, 2026-09-18), whose designated
home was a non-exempt file out of scope for the `.md`-only batch that
retired the task directory - recorded here instead, for whoever next
touches the named file to fold in:

- The pre-lint baseline over `tests/`, `tools/`, `.claude/hooks`, not
  re-derivable (four rules were fixed at every site): 259 findings in 34
  files - 118 `no-console`, 67 `explicit-module-boundary-types`, 60
  `no-require-imports`, 5 `no-regex-spaces`, 3 `no-unused-vars`, 3
  `preserve-caught-error`, 2 `no-extraneous-class`, 1 `no-useless-
  assignment`. `eslint.config.mjs`'s rule-turn-off comment records only the
  60.
- GitHub Actions runs `bash -e`, not `-x`: a guard step whose only output
  sits inside an `if` prints nothing on success, so a log-based acceptance
  line can be signed off from a local replay by mistake; `ci.yml`'s
  stub-count guard step got an explicit `echo` for this reason (proved on
  CI run `35364353967`).
- `eslint-disable-next-line` covers only the literal next line: above a
  multi-line `//` block it lands on a comment line (reported unused) while
  the violation still fires below. The directive goes last, immediately
  before the statement.
- The documented rollback (`ci.yml`, "HOW TO UNDO A BAD DEPLOY": revert and
  push) costs 12 minutes because it is gated on the full `check` job -
  measured on CI run `35214847899`: push-to-live 11:16:52 -> 11:29:03 =
  12m11s, of which `check` alone is 11m29s and the `deploy` job alone is
  37s. The undocumented fast path - re-running just the `deploy` job on the
  last known-good run - reuses the already-green `needs` results and
  republishes in 37s; it is the right first move for "put the previous
  build back while I write the revert." The same mechanism is a footgun the
  other way: re-running an *older* run's `deploy` job republishes that old
  tree over a newer one, with nothing (the workflow's `pages` concurrency
  group, `check-site.mjs`) warning that an old commit went live. GitHub
  Actions run history is not in the git tree, so this measurement is not
  re-derivable from the repository alone. Its real home is a comment in
  `ci.yml`'s own "HOW TO UNDO A BAD DEPLOY" block - out of scope for a
  `.md`-only batch, parked here instead.
- `gitleaks-action@v2` and the three Pages actions in `ci.yml` target Node
  20 and are forced onto Node 24 by the runner: two standing annotations,
  not errors. File it only if one starts failing.

Facts settled during measurement (issue 68, 2026-09-23), the Browser pane:

- A `file://` tab is a static snapshot the page tools cannot script.
  Measure a built `dist/` over HTTP: `python -m http.server <port> --bind
  127.0.0.1 --directory <dist>`.
- The pane's embedded Chromium accepted 20 M characters in one
  `localStorage` key, so it cannot measure a real browser's quota.
- A hidden pane returns blank screenshots; read geometry with
  `read_page` or a script, or show the pane first.

## Persistence era: decided now, activated at Phase 0

Moved here verbatim from `config-audit`'s plan at that task's retirement
(2026-09-16), because the decisions outlive the task that made them and a
rejected-options list is worth exactly as much as the next person's ability
to find it. Candidate row 42 points here.

Trigger for every row: **the start of persistence Phase 0**, which runs after
issue 47 closes at R0c (`DAGGERHEART-LOOT-PERSISTENCE-DESIGN.md`, sections
17.4 and 18, revised 2026-09-08). Not a date; not this task. Aligned with
17.4's table, not re-derived. A superseded contract is recorded in
`docs/DECISIONS.md` (a decision, not a defect: `DEBT.md`'s sections are the
tasks that owe its entries), in the same commit that edits `CLAUDE.md`,
`docs/specs/CONTRACTS.md`, `docs/fixtures/`, `tests/contracts.js` and
`llms.txt` (the standing contract-change rule).

| Item | Mechanism decided | Where it goes | Why a gate, not judgement |
|---|---|---|---|
| Supersede the no-backend / hash-only-list law and the `file://` clauses | edit `CLAUDE.md`: "Product laws" bullet 1, "Architecture boundaries" last bullet, "Project shape" first bullet; a `docs/DECISIONS.md` entry names the old text and the design section that replaces it. **Installed 2026-09-24** (`persist-0-foundation`): `CLAUDE.md`, `docs/DECISIONS.md`, `META.md` sections 3, 4 and 9, `CONTRACTS.md` sections 4-5; no fixture, `tests/contracts.js` or `llms.txt` text changed | `CLAUDE.md`, `docs/DECISIONS.md`, CONTRACTS/fixtures/llms.txt | until then those laws protect 47 |
| RLS policy verification | a **gate**: negative tests against the local Supabase stack (anon reads no other user's rows; service role never reaches the client). Amended 2026-09-24: a **separate chain**, `npm run check:db` (`tests/db/`), not `npm run check`, for two reasons - Docker for every `npm run check` on a CSS fix is not acceptable, and on this host `npm run check` runs through the Bash tool while Docker answers only the PowerShell tool, so a chain that needs Docker could never arm the gate from Bash. The commit gate gains rule 2m (a `supabase/**` or `tests/db/**` commit needs a passing `check:db`), armed by `check-observer.mjs` from either tool; CI runs it in the `db` job, which `deploy` needs. **Installed 2026-09-24** (`persist-0-foundation`): the harness and its two invariants; each schema batch adds its role cases | `tests/db/`, `package.json`, `ci.yml` | an RLS mistake does not fail a test, it leaks data |
| Migration reversibility | a **gate** in `check:db`: every migration under `supabase/migrations/` has a reversal in `supabase/reversals/` or the marker `-- additive` (refused over a `drop`, `rename` or type change), and up-down-up leaves the schema dump unchanged. **Installed 2026-09-24**: proven on two fixtures (one passing, one failing); R0 ships no migration | `tests/db/reversibility.test.mjs`, `tools/supabase/lib.mjs` | "additive while two frontend versions are open" is a rule tooling enforces |
| Applied migrations never edited in place | `edit-guard.mjs` rule: a path under `supabase/migrations/` that a remote-tracking ref holds. **Installed 2026-09-24**; **redesigned 2026-09-25**: git is the record, `supabase/applied.json` is gone, because CI applies every pushed migration | `.claude/hooks/edit-guard.mjs`, selftest cases | same class as the generated-file guard |
| Secrets hygiene, `VITE_` boundary | `bash-guard.mjs` family on a `git commit` segment: run gitleaks over the staged diff with `.gitleaks.toml`; deny on findings; `speak` (not deny) when gitleaks is not on PATH so a missing control is visible; raise the hook timeout in `settings.json` only if measured slower than 10 s. **Installed 2026-09-24** (rule 2l) | `.claude/hooks/bash-guard.mjs`, `settings.json`, selftest | CI also runs it (`secrets` job); before any service-role key exists |
| One session per working tree, extended to the shared database | one sentence added to `CLAUDE.md` "Task and session protocol": a second session on the same Supabase project corrupts the first's data and the failure looks like an application bug. **Installed 2026-09-24** | `CLAUDE.md` | prose, because the hook has no input for it |
| Authenticated CI credentials | CI secret plus a documented failure mode | `ci.yml`, README | Phase 2, per 17.4 |

Rows 1-6 were installed at persistence Phase 0 (`persist-0-foundation`,
2026-09-24); row 7 waits for its batch.

Note for the owner: 17.4 names the audit prompt as
`docs/agent-audit.v6.prompt.md`; no such file exists in the repository (the
prompt is on the desktop as `audit.prompt.md`). The design document is outside
this repo, so this section records the mismatch and does not fix it.

## Supabase configuration

`supabase/config.toml` is the configuration of record for the local stack
and for both hosted projects (`test` = `rdjxcjkhsklhprmzxajq`, `prod` =
`zzmrftmzefcqehhyztjq`; `tools/supabase/lib.mjs`, `PROJECTS`). The Supabase
dashboard is read-only by convention: a setting changes in the file, then
reaches a project through `config:push`. Decided 2026-09-24
(`persist-0-foundation`):

1. **The test project's differences live in `[remotes.test]`** of the same
   file: `site_url`, the redirect list, email sign-up on, and the two OAuth
   providers off with blank credentials. Rejected: a second config file (the
   CLI has no such mechanism) and a documented manual difference (drift by
   design).
2. **The file declares only what the repository owns.** The local stack's
   sections and the Auth values of `docs/DECISIONS.md`, "Supabase
   configuration is code; the dashboard is read-only; no Branching", stay;
   every hosted property
   the repository does not mean to own is deleted (`[db.pooler]`,
   `[storage.vector]`, `[storage.analytics]`, `[auth.oauth_server]`,
   `[auth.sms.twilio]`, `[auth.external.apple]`, `[auth.web3.solana]`, the
   four `[auth.third_party.*]`, `auth.password_requirements`, the
   `[experimental]` S3 lines, `[studio]`'s OpenAI key), so a push leaves it
   unchanged. The only `env(...)` references left are the four OAuth client
   ids and secrets. Also deleted: `auth.rate_limit.email_sent` and
   `[db.network_restrictions]`, which `config diff` cannot compare.
3. **A declared value equals production's value unless `[remotes.test]`
   overrides it.** An `init` template value that differs from production is
   owned at production's value or deleted, never pushed: a production diff
   found `auth.minimum_password_length` 6 against 10 and
   `auth.email.secure_password_change` false against true, and a push would
   have weakened both. Both are security settings, so the file owns them at
   10 and true.

CLI facts (2.117.0, measured 2026-09-24):

- `supabase config diff --project-ref <ref>` is read-only, masks
  credentials, and exits 2 on any difference with `--exit-code`.
  `[remotes.<name>]` with `project_id = "<ref>"` is honoured ("using
  [remotes.test]").
- The CLI's output format defaults to text and switches to JSON (`changes[]`
  with `path`, `class`, `local`, `remote`) only when `--agent auto` detects
  an agent, not by TTY: with `AI_AGENT`, `CLAUDECODE` and `CLAUDE_*` unset,
  a Bash-tool run with no TTY printed text. An agent run therefore got JSON
  while the owner's terminal got text, so
  `diffArgs` in `tools/supabase/lib.mjs` passes `--output-format json`.
- An undeclared hosted property that differs from the CLI's default still
  shows as `class: "remote_only"`, `declared: false`. On the test project
  after the cut: `auth.sms.twilio.enabled`, `db.pooler.default_pool_size`,
  `db.pooler.max_client_conn`, `storage.vector.enabled`. A push leaves them
  unchanged ("Properties the file does not declare are left unchanged"), so
  a diff that lists only such rows is clean for the repository's purposes.
  `npm run config:diff` prints the CLI's JSON, then `drift: none (N
  not-owned)` or `drift: N` with one path per line, and exits 2 on drift.
  Only the four paths in `NOT_OWNED` (`tools/supabase/lib.mjs`), each as an
  undeclared `remote_only` row, are not drift.
- `config diff` does not compare `api.auto_expose_new_tables`: a copy of the
  file with the value set to `true` gave the same diff against the test
  project as `false`, and the key is not in the `unmanaged` list either. So
  at each release the owner opens the Data API settings of both projects in
  the dashboard, confirms that new tables are not exposed automatically,
  and runs the Security Advisor.
- `supabase config push` takes `--project-ref`, so no `supabase link` is
  needed. Its help warns that a non-interactive run proceeds without asking
  and that template-only values overwrite hosted settings - always diff
  first.
- `supabase init` sets `project_id` to the directory name, which in a
  worktree is the worktree's name; the file pins `daggerheart-loot`.
- The npm package ships the binary as an optional platform package
  (`@supabase/cli-windows-x64`, `@supabase/cli-linux-x64`); the tools run
  `node node_modules/supabase/dist/supabase.js`, the pinned version, with no
  shell and no `npx` lookup.
- `db dump --data-only` leaves out the platform schemas, `auth` included,
  unless `--schema auth,public` is passed; with it the CLI runs `pg_dump
  --data-only --schema "auth|public"` without `auth.schema_migrations`, and
  the file starts with `SET session_replication_role = replica;` (measured by
  `--dry-run`, 2026-09-25). The schema dump leaves out `auth`, `storage`,
  `supabase_migrations` and roles (`--role-only` is a separate dump).
- `db push` takes `--db-url` (percent-encoded), `--dry-run`, `--include-all`,
  `--skip-vault` and the global `--yes`. `db reset --version <timestamp>`
  resets up to that migration, so `--version` is not always the CLI's
  version flag (`db reset --help`, 2026-09-25).

| Command | Who runs it | What it does |
|---|---|---|
| `npm run config:diff -- --project test\|prod [--env-file <path>]` | anyone; an agent only against `test` | read-only diff of `config.toml` against the project; prints `drift: none (N not-owned)` or `drift: N`, exits 2 on drift |
| `npm run config:push -- --project test\|prod [--env-file <path>]` | the owner, in an interactive terminal | refuses without a TTY; for `prod` refuses while an `env(...)` name is unset; diffs, asks for a typed `yes`, then runs `config push` with the CLI's own prompt |
| `npm run db:push -- --project test [--yes]` | anyone, an agent included; `--yes` needs `SUPABASE_DB_PASSWORD_TEST` | the manual path beside CI's `migrate-test`; refuses on a migration pairing error; dry run, then `db push` (a typed `yes` without `--yes`); records nothing |
| `npm run db:push -- --project prod` | the owner, in an interactive terminal | the fallback while CI's `migrate-prod` is broken; refuses without a TTY, and refuses `--yes`; dry run, typed `yes`, `db push`; records nothing |
| `npm run check:db` | anyone (Docker; PowerShell on Windows) | layer 3 against the local stack |

The env file defaults to `supabase/.env` (gitignored by the root `*.env`
rule); its values reach the CLI's environment and are never printed. Agents
write to the test project only (owner decision 2026-09-25; `docs/DECISIONS.md`,
"Agents may write to the test project; production is CI's or the owner's"):
`bash-guard.mjs` rule 2n allows a `db`, `migration` or `config push`
command whose target is provably the test project and denies production,
`--linked` and every target a command does not name. `db:push --project
test --yes` passes `SUPABASE_DB_PASSWORD_TEST` to the CLI as its own
`SUPABASE_DB_PASSWORD`, in the child's environment only.

**Migration names.** A new migration's 14-digit stamp must sort after every
migration already applied: `supabase db push` refuses a local migration that
would be inserted before the remote's last one (short of `--include-all`).
`date -u +%Y%m%d%H%M%S` is not enough on its own - the applied
`20260925120000_delete_account.sql` was named for 12:00 UTC, and a stamp
taken at 07:46 the same day sorts before it; take the next free minute after
the newest file instead (2026-09-25). A migration once applied is never
edited: a fix is a new migration.

**Release procedure.** Configuration, `test` first, then `prod`, by the
owner before the push of `main`: `npm run config:diff`, then `npm run
config:push`. A non-empty diff the repository did not cause is drift:
record it in the task's handoff, then push the repository's value.
Migrations are CI's (`docs/DECISIONS.md`, 2026-09-25, "Migrations deploy
from CI as steps of `e2e` and `deploy`"): `migrate-test`, the first step of
every `e2e` run, applies the pending migrations to the test project, and
`migrate-prod`, the first step of `deploy`, applies them to production at
the push of `main`, before the build. A `skip_e2e` dispatch runs no
`migrate-test`, so `deploy` first runs `tools/supabase/pending-check.mjs`
against production and stops when a migration file's version is not in its
`supabase_migrations.schema_migrations`. The database is the applied
record; no file lists applied migrations, and `edit-guard.mjs` locks a
migration that any remote-tracking ref holds.

**The hosted E2E and the deploy.** CI's `e2e` job runs `npm run e2e` (layer
4, `docs/specs/COVERAGE.md`, "Test layers") against the test project, and
`deploy` needs it. `migrate-test` applies the schema before every `e2e`
run. A red `migrate-test` step names the reason, most often the connection
string: `SUPABASE_DB_URL_TEST` and `SUPABASE_DB_URL_PROD` must be the
session pooler form (`aws-0-<region>.pooler.supabase.com`, port 5432, user
`postgres.<ref>`, the password percent-encoded) - GitHub's runners have no
IPv6 and the direct `db.<ref>.supabase.co` host answers IPv6 only, and the
transaction pooler (port 6543) breaks `db push`. The owner fixes the secret
and re-runs the job. When the test project
itself is down, the escape hatch is the owner's: dispatch the `check`
workflow on `main` with `skip_e2e: true` (the one dispatch that deploys),
and record the run id and the reason in the release's handoff. Nothing else
may skip `e2e`. A job-level `concurrency` group can replace a pending `e2e`
job with a newer run's even with `cancel-in-progress: false`; that run's
`deploy` then sees `e2e` cancelled and does not publish - it fails safe, and
a re-run recovers. Every run mints its sessions through `verifyOtp`, which
Auth limits (`token_verifications = 30` per five minutes, `config.toml`), so
expect about three back-to-back local runs per five minutes before Auth
refuses a mint.

A known gap: `migrate-test` runs on every branch's `e2e`, so a migration
that a branch pushed is in the test project before `main` has its file.
Symptom: on the next push of `main` without that branch, `migrate-test`
fails - `db push` refuses a remote history that holds a version absent
locally - and `e2e` and `deploy` stay red until the branch merges onto
`main`. Recovery: merge the branch that owns the migration. No fix is
designed yet.

### Backups and restore

`.github/workflows/backup.yml` dumps production every night at 03:17 UTC
and on dispatch: `schema.sql` and `data.sql` (the `auth` and `public` rows),
each encrypted to the owner's `age` public key (the Actions variable
`BACKUP_AGE_RECIPIENT`) and kept as the artifact `backup-<date>` for 30
days. The private key lives in the owner's password manager, never on disk
longer than a restore. `docs/DECISIONS.md`, 2026-09-25, "Production is
backed up nightly, encrypted to the owner's key, kept 30 days". GitHub
refuses to dispatch a workflow that is not on the default branch (`gh
workflow run backup.yml --ref <branch>` answered `HTTP 404: workflow
backup.yml not found on the default branch`, 2026-09-25), so a new
workflow file runs first on `main`.

**Symptom.** Data is lost, or a migration must be undone together with the
data it changed.

**Diagnosis.** Find the newest nightly artifact made before the loss:

```bash
gh run list --workflow backup.yml
gh run download <run id> --dir <dir>
```

Expected: `<dir>` holds `schema.sql.age` and `data.sql.age`.

**Recovery.** Restore into the local stack first, then the test project,
then production. The dump restores against the schema the migrations
produce, and it sets `session_replication_role = replica`, so triggers stay
off while it loads.

1. Decrypt the data file: `age -d -i <the owner's key file> -o data.sql
   data.sql.age`. Expected: `data.sql`, plain SQL.
2. Start the local stack: `npx supabase start`, then `npx supabase db reset
   --local` (PowerShell on Windows). Expected: every migration applied.
3. Load the data locally: `psql
   "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
   --single-transaction --variable ON_ERROR_STOP=1 --file data.sql`.
   Expected: exit 0, and the rows are in the tables.
4. Load it into the test project: the same `psql` command with the
   `SUPABASE_DB_URL_TEST` connection string (the session pooler, port 5432).
   Expected: exit 0.
5. Clean the test project: `delete from auth.users where id in (...)` with
   the user ids the dump holds; their `user_prefs` rows cascade. The E2E's
   member is not in a production dump. Expected: the E2E runs green again.
6. Load it into production, only after steps 3 and 4 passed: the same
   command with `SUPABASE_DB_URL_PROD`, on a project whose schema matches the
   dump's. The dump inserts rows, so a live database with conflicting rows
   fails the whole transaction: load into an empty project, or first
   truncate the `public` tables and delete the `auth.users` rows that the
   dump holds. A new project needs the schema first: decrypt
   `schema.sql.age` and run `psql --file schema.sql` before `data.sql`.
7. Delete the decrypted `data.sql` and `schema.sql` from every place they
   were written, after a restore or a drill: the privacy pages promise that
   a backup lives 30 days. Expected: only the `.age` files are left.

**Undo a deploy that carried a migration.** Revert the app change only, or
add a new migration whose body is the reversal file
(`supabase/reversals/<name>`). Never delete a migration file from `main`:
`db push` refuses a remote history that holds a version absent locally, so
`migrate-prod` would then block every later deploy. `ci.yml`'s "HOW TO UNDO
A BAD DEPLOY" comment carries the same rule.

## Cloud sessions

A claude.ai/code cloud session runs in a VM the repository prepares with
`.claude/cloud-setup.sh`. Facts relied on (code.claude.com cloud-environments
documentation, read 2026-09-24): Ubuntu 24.04 x86_64, 4 vCPU, 16 GB, 30 GB;
Node 22 on PATH ahead of `/usr/local/bin` (the repository pins 24); a root
setup script (about 5 min, cached about 7 days) set in the environment
dialog; repository `SessionStart` hooks run on every start;
`CLAUDE_CODE_REMOTE=true`; environment variables are visible to the model;
the Bash tool only; the container is reclaimed after inactivity, so work
that is not pushed is lost.

Measured in the first cloud session, 2026-09-24 (section 15 step 20 of the
persistence roadmap):

- The setup script had not run: Node 22, no nvm, no gitleaks. Run by hand it
  failed on `. nvm.sh` (exit 3 beside an uninstalled `.nvmrc` version); fixed
  with `--no-use`. The Bash tool does not source nvm, so the script links
  `node`, `npm` and `npx` into `~/.local/bin`, the first PATH entry.
- `npm ci` downloads Chrome for Testing to `~/.cache/puppeteer` despite npm
  11's `allowScripts` warning for puppeteer. Playwright's Chromium is also at
  `/opt/pw-browsers/chromium`; nothing uses it.
- `rtk` is not in the image; without it the reader rules of `bash-guard.mjs`
  deny `grep -n` shapes with no rewrite to fall back on. The script installs
  `rtk` 0.48.0 (checksum checked) and its hook (`rtk init -g --hook-only`).
- `dockerd` is installed but not running, and a setup script cannot leave it
  running. Start it once per session as root: `(dockerd > /tmp/dockerd.log
  2>&1 &)`; `docker info` then answers. `session-start.mjs` prints that line
  when the probe fails.
- The network was not "Full": the proxy denied the test project
  `rdjxcjkhsklhprmzxajq.supabase.co`, the image blob hosts
  `d2glxqk2uabbnd.cloudfront.net` (`public.ecr.aws`) and
  `pkg-containers.githubusercontent.com` (`ghcr.io`), and Docker Hub answered
  429 (anonymous pull limit on a shared address). So `npm run check:db`
  failed at `supabase start`, and the layer 4 probe could not run: no
  cloud release until a session on "Full" passes both.
- `npm run check` and `npm run check:built` passed on Node 24.21.0.
- The session's branch is assigned by claude.ai/code (`claude/<name>`), not
  named after the task id, and the session may push only that branch.
- No `gh` CLI; GitHub is reached through the GitHub MCP tools.
- The proxy lists each denied host under `recentRelayFailures` in
  `curl -sS "$HTTPS_PROXY/__agentproxy/status"`.

Measured in the second cloud session, 2026-09-24, network "Full", root,
Node v24.21.0, `node_modules` present from setup (`npm ls` clean):

- Docker answered only after `(dockerd > /tmp/dockerd.log 2>&1 &)`, then
  `docker info` in about 1 s. The first `check:db` pulled its images from
  `public.ecr.aws` and met two transient registry errors (ECR "Data limit
  exceeded"; the anonymous token fetch reset, proxy
  `ws_closed_mid_exchange`); the Supabase CLI retried and passed.
- Every gate passed, one foreground call each. This host's costs, the ones
  a cloud session plans by (the Windows tables above stay the owner's; "(3)"
  marks the third session's reading, the same day, with `tests/app/` over
  `dist-test/`; "(4)" the fourth session's, 2026-09-25):

  | Command | Wall clock |
  |---|---|
  | `npm run check` | 111 s; 130-145 s (3) |
  | `npm run check:built` (both builds, smoke, budget, marker guard) | 8-9 s (3); 11 s (4) |
  | `npm run check:db` | 30 s warm; 115 s with the first image pull; 119 s cold, 39 s warm (3); 94 s (4) with the reversibility base check (its two `db reset --local` about 49 s) |
  | `node tests/run-all.js app/print,app/contracts,app/states,app/typo,app/hues,stub` | 346-356 s (3), 365 s (4), 4 at a time; `app/print` and `app/contracts` dominate |
  | `node tests/app/golden.js --shard=n/4` | 132-143 s per shard (3), `--update` and compare alike; 141-145 s (4, 157 states) |
  | `node tests/app/sweep.js 360` | 378-379 s (3) |
  | `npm run e2e`, to its refusal at the page probe (the layer rule below) | 11 s (4) |
  | `npm run e2e`, end to end, with the authority in `~/.pki/nssdb` | 35-37 s (4) |

- Quirk: a proxy API credential is host-scoped and replaces the
  `Authorization` header of every request to that host, including one the
  request already carries. Symptom: `/auth/v1/user` answers `403 bad_jwt`
  "invalid number of segments" whatever token is sent. It does not grant
  admin either (the gateway wants the secret key in `apikey`). The owner
  removed it; the same request then answered `401 no_authorization`, and a
  request's own `Bearer a.b.c` reached the server ("illegal base64").
- Environment variables added while a session runs reach only new
  sessions (`printenv` in the running one did not see them).
- The session's clone is shallow (60 commits in session 4, 2026-09-25): a
  history-wide `gitleaks git` there reports the boundary commit's old lines
  as new findings that CI's full clone does not. Run `git fetch --unshallow
  origin` (about 5 s) before such a scan; the full-history scan then took
  4 s.
- The environment's own Stop hook (`~/.claude/stop-hook-git-check.sh`,
  outside the repository) asks to commit and push at every turn end; the
  branch rule below is what makes those pushes lawful.

- **Layer rule.** A cloud session runs layers 1-3: `npm run check`,
  `npm run check:built`, the `tests/app/` suites over `dist-test/` (`npm run
  build:test`; Chrome for Testing from `npm ci`), golden re-seeds (the goldens are text, and ubuntu CI already
  compares Windows-seeded goldens green) and `npm run check:db` (Docker
  without the PowerShell detour; needs the image blob hosts above). Of layer
  4 (hosted E2E), both halves run there once `.claude/cloud-nss.sh` has put
  the proxy's certificate authority in `~/.pki/nssdb` (`session-start.mjs`
  probes it): Chrome for Testing reads that store, not the system bundle,
  and without the authority it refuses the test project
  (`net::ERR_CERT_AUTHORITY_INVALID`, measured 2026-09-25), so `npm run e2e`
  stops at the page probe while its Node half (`node tests/e2e/probe.mjs`,
  the contract, the configured build) still runs. CI's `e2e` job, by a
  `workflow_dispatch` on the pushed branch, is layer 4's verification of
  record. Sweep measurements there are advisory.
- **Host rule.** A whole release (one task id) runs fully in the cloud or
  fully locally; batches never mix hosts within a release.
- **Branch rule.** A cloud release starts from the pushed `main` and
  commits on the branch its session was given, pushing that branch after
  every green commit (a reclaimed container loses what is not pushed); it
  never amends a pushed commit, so the branch holds one commit per batch and
  a remediation after a push is its own commit. `bash-guard.mjs` rule 2o
  allows exactly a push of the current branch and denies any other push in
  a cloud session. At closeout the orchestrator, on a host whose push rule
  allows it, squash-merges the branch onto `main` as the release's one
  commit (orchestrator step (c) below); the claude.ai/code merge button (a
  pull request and a merge commit) is not used.
- **Network:** "Full" (owner decision, 2026-09-24), so no allowlist is kept.
- **Secrets.** No production secret (database password, OAuth secrets,
  service keys) enters a cloud environment, and no proxy API credential is
  set (the quirk above). The hosted E2E reads `E2E_SUPABASE_URL`,
  `E2E_SUPABASE_PUBLISHABLE_KEY`, `E2E_SUPABASE_SECRET_KEY` and
  `E2E_USER_EMAIL` from the environment's variables, as CI reads its
  secrets and a local run its `.env.test.local`. They are model-visible:
  never print a value; the key opens the test project only, and the owner
  rotates it if it ever appears in a document or a log. Before a run, the
  probe (`GET /auth/v1/user` with the publishable key: no `Authorization`
  answers `401 no_authorization`, `Bearer a.b.c` is refused for that token)
  proves nothing rewrites the header. `docs/DECISIONS.md`, 2026-09-24,
  "The hosted E2E reads its credentials from the environment". The test
  database password, `SUPABASE_DB_PASSWORD_TEST`, is a cloud variable beside
  the `E2E_*` names for `npm run db:push -- --project test --yes`: test
  only, never printed.
- **Setup script.** `.claude/cloud-setup.sh` installs Node from `.nvmrc`
  through nvm, linked into `~/.local/bin`, runs `npm ci`, installs gitleaks
  8.30.1 and rtk 0.48.0 checked against their release checksums, the rtk
  hook, `npx supabase --version`, step 4b `bash .claude/cloud-nss.sh` (every
  CA in `/root/.ccr/agent-proxy-ca.crt` - there are two - into
  `~/.pki/nssdb`, each under its own nickname `ccr-agent-proxy-ca<n>` with
  trust `C,,` and compared by sha256 fingerprint, installing
  `libnss3-tools` when `certutil` is missing; idempotent, and a session whose
  store lacks one re-runs it alone - the cached setup does not; `--check`
  installs nothing, and `session-start.mjs` runs it), then prints the
  versions. The dialog runs
  its field before Claude Code starts and not from the repository: the field
  `bash .claude/cloud-setup.sh` failed with exit 127, "No such file or
  directory" (2026-09-24). The field holds this text, which uses the clone
  when it is there and clones `main` when it is not:

  ```bash
  #!/bin/bash
  set -euo pipefail
  repo=/home/user/daggerheart-loot
  if [ ! -f "$repo/.claude/cloud-setup.sh" ]; then
    repo="$(mktemp -d)/daggerheart-loot"
    git clone --depth 1 https://github.com/artex-x/daggerheart-loot "$repo"
  fi
  bash "$repo/.claude/cloud-setup.sh"
  ```

  Setup runs again only when the field or the network hosts change, or the
  cache expires (about seven days); a resumed session never runs it. If the
  session's clone has no `node_modules`, `session-start.mjs` says so: run
  `npm ci`. It
  pulls no Docker image. `session-start.mjs` then reports each probe on every
  start.

Closeout is split by `docs/DECISIONS.md`, 2026-09-25, "The orchestrator
merges a release branch onto `main`; the owner keeps the dashboard steps".
CI applies the migrations (`migrate-test` on every `e2e` run,
`migrate-prod` at the push of `main`).

**Owner steps, local, before the merge**, in order: (a) `git fetch`, read
the release's closeout summary; (b) `npm run config:push -- --project
test`; (c) the same for `prod`; (d) the Security Advisor and the Data API
check on both projects; (e) the Google or Discord console steps the release
names. After the deploy: (f) the manual OAuth check; (g) the restore drill
with the private key, when the release asks for one.

**Orchestrator steps, after the owner's (a)-(e)**, in order: (a) confirm
the branch's last CI run is green; (b) `git checkout main && git pull`;
(c) `git merge --squash claude/<name>`, then `git commit -F <the closeout
commit message>` - the author comes from `.claude/settings.json`, and a
tooling commit the branch carries rides in the squash; the release is one
commit, never a merge commit, and a rebase is the fallback if the squash
refuses; (d) push `main`, which runs `deploy`, and
watch that run; (e) delete the task branch.

## Artwork tooling

`tools/artwork/` (task `art-tooling`) converts and installs catalog item
pictures - see `docs/artwork.md` for the runbook. It is a sibling npm
project, the same shape as `tools/tg-preview/`: its own `package.json` and
lockfile carry `sharp`, so root `package.json` gains no dependency and root
`npm ci` never resolves an image encoder. `node --test
tools/artwork/lib.test.mjs` is wired into `npm run check` as its own step;
`run.mjs` (which imports `sharp` lazily), `icons.mjs` (the app icons) and
`cards.mjs` (the two site share cards) are not - their honest proof is the
filesystem and the encoder, not a unit test. `cards.mjs` renders only with
the Inter files under `tools/artwork/fonts/`: it points fontconfig at that
directory alone, from a second process, so a host font never stands in
(`docs/artwork.md`, "The site share cards"). No skill was
created for the procedure: artwork work already has two durable homes
(`.claude/agents/refresh-artwork.md` and `.claude/agents/add-source.md`,
each with its own prompt), and a skill would be a third one, guaranteeing
drift between whichever two a future edit remembers to update.

Design decisions behind `tools/artwork/`, kept so nobody re-derives or
re-litigates them:

- **One entry point with verbs, not a `--mode replace|ingest` flag and not
  a second `ingest.mjs`.** A mode silently inverts a destructive
  precondition (a destination must already exist, or must not), and a verb
  is read aloud in the command and in the runbook; the impure half (the
  filesystem and the encoder) is 100% shared between the two paths, so a
  second entry point would duplicate it or need a third impure module.
- The tool validates the agent's `img` declaration and never chooses an
  asset id or infers sharing on its own - removing a whole API surface (no
  `share` map, no `assign-asset` verb, no `byLine` index) and making
  `og/<new-record-id>.jpg` structurally unreachable.
- No acceptance-ledger or manifest schema of its own: two delivery shapes
  have ever existed (an id-keyed manifest, a name-keyed drop) and `--map`'s
  `assign` key covers both.
- Four more rejected alternatives: `sharp` in the root `package.json`; a
  script that bootstraps a Python venv (the Pillow script a task directory
  left behind, since deleted, is what that path produced - stranded); this
  tool's `run.mjs` invoking `tools/tg-preview/run.mjs` (a Telegram-capable
  entry one typo from a live send); committing a hash inventory (git
  already records the bytes).
- No hook guards an artwork install: the standing bar for a new hook is a
  repeated mistake, and no artwork operation has produced one a path test
  could catch - the `og/`-orphan gap was a test gap, closed as a test.

## Candidates considered (issue 65)

The full list evaluated when the hooks were designed, kept so nobody re-derives
it. Adopted beyond the original ticket's six are marked **+**. Consult this
before adding a hook: several tempting ones are rejected for reasons that have
not changed.

| # | Candidate | Event | Verdict | Reason |
|---|---|---|---|---|
| 1 | Session briefing: branch, dirty files, active task | `SessionStart` | **adopt** | Ticket. Cheap, once per session, states facts nothing else states. |
| 2 | Dangerous git commands | `PreToolUse(Bash)` | **adopt** | Ticket. Deterministic, destructive, irreversible. |
| 3 | Commit gate on a passing `npm run check` | `PreToolUse(Bash)` | **adopt** | Ticket. Scoped to covered files so it stays quiet on doc commits. |
| 4 | Generated-file write block | `PreToolUse(Edit\|Write)` | **adopt** | Ticket. Purely mechanical; a wrong edit here is silently overwritten by the next build. |
| 5 | Derived-artefact / contract reminder | `PostToolUse(Edit\|Write)` | **adopt** | Ticket. Once per session per group, or it is wallpaper. |
| 6 | Uncommitted work / stale handoff | `Stop` | **adopt** | Ticket. Warn only, scoped to this session's writes. |
| 7 | Block every force-push form | `PreToolUse(Bash)` | **adopt** | Narrowed 2026-09-12 from "block every push": a plain push is not destructive, so the blanket block was the thing keeping committed work off the remote. **Tightened 2026-09-18** (`workflow-hygiene`): every force form is now denied, including `--force-with-lease` - one amended commit per task makes an amend after a push the tempting mistake, and a lease that succeeds is still the rewrite `CLAUDE.md` forbids. |
| 8 | **+** Block blanket staging (`git add -A`, `git commit -a`) with 2+ dirty paths | `PreToolUse(Bash)` | **adopt** | CLAUDE.md's preserve-unrelated-changes rule flags exactly this: blanket staging is how another task's in-flight files get swept into someone else's commit. |
| 9 | **+** Block AI attribution in a commit message | `PreToolUse(Bash)` | **adopt** | An explicit standing user rule ("no Co-Authored-By trailer, ever") against a well-known default agent behaviour. Zero false positives; fires never once respected. |
| 10 | **+** Long-check reminder | `PreToolUse(Bash)` | **adopt** | `git show b2eec64:.claude/improvements.md` Finding 1: three of five workers made this exact mistake in one session. Fires on four command shapes, once per session each. |
| 11 | **+** Parity-baseline warning on `index.html` / `app.js` / `style.css` | `PostToolUse(Edit\|Write)` | **adopt** | `git show b2eec64:.claude/improvements.md` Finding 5 called the static root frozen because it *was* the parity expectation; a block would have been wrong because count updates legitimately touched it. **Retired at R0c `23c00a6`**: the static root and the `remind:baseline` group that watched it are both deleted. |
| 12 | **+** Block writes to `dist/` and `package-lock.json` | `PreToolUse(Edit\|Write)` | **adopt** | Two array entries in a list that already exists; both catch real mistakes; neither can fire on a legitimate edit. |
| 13 | Warn when a worker is dispatched with no explicit `model` | `PreToolUse(Task)` | **reject** | Fixed structurally at `60172d3` by putting real defaults in agent frontmatter. A hook would re-litigate a solved problem. |
| 14 | Warn before `TaskStop` ("run ListAgents first") | `PreToolUse(TaskStop)` | **reject** | The recorded failure (`001aa43`) was a misread status, which is judgment. `orchestrate.prompt.md`'s "a worker that went quiet" section owns it and are the right owner. |
| 15 | Block a heavy run while another is alive | `PreToolUse(Bash)` | **reject** | Needs process enumeration; `tasklist` on Windows costs 200-500 ms and cannot distinguish a headless harness Chromium from the human's browser. Unreliable input, tool-path cost. Deferred alternative: have `tests/parity.js` write a lockfile the hook can stat in microseconds - a change to `tests/`, out of scope for issue 65. **Retired at R0c `23c00a6`** along with row 28, which built that deferred alternative; see "One heavy run at a time" above for what is unguarded now. |
| 16 | Report the last CI conclusion at session start | `SessionStart` | **reject** | Needs `gh` over the network. Network in a hook can hang the session start, and the rule is that no hook path touches the network - even the one that is not a tool path. |
| 17 | Enforce Conventional Commits subject format | `PreToolUse(Bash)` | **reject** | Never a recorded failure here - every commit in the log conforms - and extracting a subject from an arbitrary `git commit` invocation (`-F`, two `-m` flags, `$'...'`) is exactly where a false block would land on a legitimate commit. The attribution check (#9) gets the value without the parsing risk, because it scans the raw string for a literal. |
| 18 | Verify `git config user.email` matches the required author | `SessionStart` | **reject** | Already configured globally on this host and has never failed. A rule that has never fired and can never fire is clutter. |
| 19 | Restrict the planner to writing under `issues/<id>/` using `agent_type` | `PreToolUse(Edit\|Write)` | **reject, top deferred candidate** | Fully enforceable in principle and a real failure mode. But `agent_type`'s value strings are unverified on this host: a wrong string either never fires (useless) or blocks a legitimate writer (harmful). The cheaper instrument is agent frontmatter - `reviewer.md` already uses `permissionMode: plan`. Settle it by logging `agent_type` from `session-start.mjs` for a session or two first. |
| 20 | Require `npm run check:built` when a screen changes | `PreToolUse(Bash)` | **reject** | "Alters what a screen draws" is judgment, not a path test. CLAUDE.md's `check:built` rule keeps it, and a hook must not pretend to enforce it. |
| 21 | Enforce the per-file coverage threshold | `PostToolUse(Write)` | **reject** | Already enforced by `vite.config.mts` at the real moment. A second copy would say nothing new. |
| 22 | Inject the active task on every prompt | `UserPromptSubmit` | **reject** | Duplicates `SessionStart` on every single turn. The definition of the noise the human warned against. |
| 23 | Preserve a handoff pointer across compaction | `PreCompact` | **reject** | `Stop` and `SessionStart` already bracket the session; a third copy of the same pointer earns nothing. |
| 24 | Anything reading the five-hour usage window | any | **reject** | Measured impossible on this host (`79e26c9`). Explicitly out of scope. Also rejected: an autonomous usage guard summing `message.usage` from the transcript - it measures the session's own spend, not the account's shared five-hour window, so it cannot stand in for the thing being asked about. |
| 25 | Block edits to `docs/fixtures/**` as "generated" | `PreToolUse(Edit\|Write)` | **reject** | They look generated but CLAUDE.md requires updating them by hand in the same commit as a contract change. Blocking them would block the correct fix. Listed here because it is the tempting mistake in hook 4. |
| 26 | `SessionEnd` bookkeeping | `SessionEnd` | **reject** | Cannot influence the model or the human in time. `Stop` already covers the moment that matters. |
| 27 | Block `npm run check` launched with `run_in_background` | `PreToolUse(Bash)` | **adopt** | Three workers on issue 47 backgrounded the check, the third with three paragraphs of dispatch warning against it; prose is exhausted. False-positive-free: `check-observer.mjs` refuses a backgrounded run by design, so one can never satisfy the gate, and blocking it forbids nothing that works. Scoped to the gate-feeding check only - `check:built`, parity and run-all can legitimately run detached from a main session, and the reminder already covers them. Matched per segment, because the recorded shapes were piped, chained, `cd`-prefixed and file-redirected. The message names the replacement in one line, including the Bash timeout. Measured 2026-09-10: `PreToolUse(Bash)` fires for a backgrounded call and denies it (probe A); `tool_input.run_in_background` reaches the hook as `true`. |
| 28 | Block a heavy run while a parity run is alive, via a lockfile `tests/parity.js` writes | `PreToolUse(Bash)` | **adopt** (bundled with #27 by owner decision, 2026-09-10) | #15's deferred alternative. The input problem #15 rejected on is gone: the run itself writes the lock, so the hook stats one file instead of enumerating processes, and a human's terminal run is seen too. The stale-lock false positive is closed by liveness (`process.kill(pid, 0)`, no `tasklist`) plus a heartbeat TTL - a dead pid or a stale heartbeat is ignored, so the rule can only fire on a run that is actually alive, and a second heavy run beside it produces garbage, so the block forbids nothing that works. `parity.js` also refuses to start over a live lock, which covers parity-vs-parity with no hook in the loop. Fifteen peers on one tree make the overlap a matter of when. Known gaps, recorded above: the vitest-alive side is invisible; a container run is invisible; on Windows a crashed run's pid can be reused inside the TTL, which the message answers with "delete the lock". Measured 2026-09-10 (probe B): a live lock denies, a dead-pid lock does not. **Retired at R0c `23c00a6`**: `tests/parity.js` and `tests/parity/lock.js` are both deleted, and nothing replaced the writer - see "One heavy run at a time" above. |
| 29 | Report HEAD moving under a session | `PreToolUse(Bash)` on `git commit`, or `Stop` | **reject for now** | Nothing collided in the recorded case; the prose that owns it ("Your writers are not the only writers", `3541a23`/`e5a26a2`) is one day old and has not been given a chance to fail, and the standing bar is a repeated mistake. Not `PreToolUse(Task)`: the dispatch tool is `Agent` on this host and `Task` in the reference, an unverified matcher (#19-shaped). Not `UserPromptSubmit`: #22. If the prose fails once, the cheapest deterministic form needs no unverified input: `session-start.mjs` records the HEAD sha in the session's `.hook-state.json` entry; `bash-guard.mjs`, on a `git commit` segment it already parses, compares `git rev-parse HEAD` against it and speaks (never denies) "HEAD moved since this session started: X -> Y, N commits not yours - `git log --oneline X..Y`; your commit lands on top, record Y as the base in the handoff"; `check-observer.mjs` refreshes the stored sha after the session's own commit. |
| 30 | Accept a leading `set -o pipefail` in the observer's attribution rule, and make the canonical invocation carry it | `PostToolUse(Bash)` (attribution only) | **adopt** (owner decision, 2026-09-10) | The recommended pipe reports `tail`'s status, so a failed check comes back with no exit line and reads as a pass; twelve check runs across five sessions were spent learning the status a second way. With the prefix the tool prints `Exit code 1` on a failed check, `check-observer.mjs` sees `exit_code: 1` and refuses to arm, and the worker reads one line. Forgery: `set -o pipefail` writes nothing to stdout, so the check stays the only stdout producer; the strip removes exactly the tokens `set -o pipefail` plus one `;` or `&&` at the start, on either side of the `cd` strip, and nothing else, after which every existing refusal applies unchanged. `set -o pipefail; echo "All files"`, `set -o pipefail; npm run check > o.txt 2>&1; grep "All files" o.txt`, `set -o pipefail; true; npm run check ...`, `set -eo pipefail; ...` and `set -x; ...` are all still refused. A forger gains nothing: omitting the prefix is today's state, and with it the exit code only tightens the gate. Measured 2026-09-10 on the Bash tool. |
| 31 | Deny a foreground `npm run check` with no `timeout` (rule 2g, second trigger) | `PreToolUse(Bash)` | **reject for now**, sketched | The tool moves a call that outlives its timeout to the background instead of killing it, the default is 120 s, and the check is ~165 s healthy, so a check call without a `timeout` cannot finish in the foreground on this host and is lost exactly as a backgrounded one is - measured once (`8ba57351` afff seq 57). But the number was undocumented until now: B1 puts it in the 2g deny message, the 2f reminder, the README, `CLAUDE.md` and the implement prompt, and the deny message arrives at the exact moment a worker retries in the foreground. That prose has not been given a chance to fail, which is the standing bar (row 29). And the deny has a failure mode of its own: it must fire on an *absent* field, so a host that stops passing `tool_input.timeout` to hooks would deny every foreground check - loud and diagnosable, but the one thing a guard must not do. The sketch, so it is a copy-paste when this is built: the no-timeout deny fires on `run_in_background === true` OR `timeout` undefined/null, with a non-number non-null `timeout` (e.g. the string `'600000'`) counting as present so an unknown host shape leaves the rule inert; `bashPayload` gains `timeout: extra.timeout === null ? undefined : (extra.timeout ?? 600000)`, spread only when defined; the adoption probe is a foreground check with and without a `timeout` - both denied means the field is not passed, do not ship. Scope boundary if it is built: never a numeric threshold ("under 300000") and never extended to `check:built`/vitest/run-all - a number is a choice, not a measurement, and those families do not feed the commit gate. |
| 32 | The observer speaks its verdict (armed / not armed and why) | `PostToolUse(Bash)` | **reject** | Tempting and cheap. But the only recorded reads of `.check-cache.json` are issue 65 verifying its own hook, and once the exit code is the check's (row 30) the worker has the status. No evidence; the observer stays silent by design. |
| 33 | Speak on `echo $?` as the first command of a call | `PreToolUse(Bash)` | **reject** | Two occurrences, both inside one session; row 30 removes the reason to ask. One README sentence instead. |
| 34 | A hook for a result over the output cap | any | **reject** | The size is unknowable before the run, and the tool already persists the full output and names the file. The failure is re-running instead of reading it: the reminder gains one clause and the README one sentence. Parity's one-line-per-page diff text is the producer; shortening it is a `tests/` change with diagnostic cost, not this task's. |
| 35 | Deny `SendMessage` to a writer while another writer is live | `PreToolUse(SendMessage)` | **reject** | The input does not exist in a hook: liveness and role come from `ListAgents`, which a hook cannot call - it gets stdin JSON and nothing else. The matcher is unverified on this host (`tool_name` for `SendMessage` has never reached a hook here; #19/#29-shaped). Zero recorded failures; the standing bar is a repeated one. The prompt's "a resume is a dispatch" sentence owns it. |
| 36 | Deny the reviewer any `SendMessage` (write-by-proxy) | agent frontmatter `disallowedTools`, not a hook | **reject for now**, sketched | The cheaper instrument exists (row 19's argument): one frontmatter line in `reviewer.md`. But `disallowedTools` is unverified as a key this host honours, `SendMessage` is not in a subagent's default tool list so sending needs a deliberate `ToolSearch` load - a guard against habit and haste has no habit to guard here - and the failure has never been recorded. If a reviewer ever sends: add `disallowedTools: SendMessage` (or the key the host documents) under `permissionMode: plan` in `.claude/agents/reviewer.md`, and verify with a probe that the reviewer's `ToolSearch select:SendMessage` then returns nothing. |
| 37 | Warn on a second implementer dispatch for the same task while a completed one is listed | `PreToolUse(Agent)` | **reject** | The dispatch tool is `Agent` here and `Task` in the reference - the unverified matcher row 29 already rejects - and the hook cannot see the agent list. "Resume, do not replace" is a preference, and a wrong warning on a legitimate fresh dispatch (tier change, killed agent) is the one thing a guard must not do. |
| 38 | Log effort from a hook | `PreToolUse(Bash)` | **reject** | The Bash tool's `$CLAUDE_EFFORT` is the same value with no edit (measured 2026-09-11); an observe-only hook would be the first here, guards no recorded mistake, and re-measurement is one echo from any worker. Fallback, not built: an observe-only `PreToolUse(Bash)` hook that echoes `$CLAUDE_EFFORT` once per session, reverted if used. Three effort questions stayed open at the measurement: `permissionMode: plan` vs `effort` (untested); a skill-frontmatter `effort` key (none declared on this host); a `SubagentStop` hook reading `effort.level` (this row's own objection applies to that too). |
| 39 | Stop names this session's own untracked writes | `Stop` | **adopt** | `closeout-hygiene`. The ten dead citations to issue 65's retired `plan.md` were found only by a human-initiated audit; the checklist step that would have caught the underlying pattern (an untracked scratch file left behind) can be skipped without anything noticing. Excludes `docs/` and the task-document set (`context.md`/`plan.md`/`handoff.md`/`mocks/` in any `issues/<id>/`) rather than the whole active issue directory, so the rule still catches a scratch script that lives inside one (a Pillow
script left in a task directory, since deleted, superseded by
`tools/artwork/`, task `art-tooling` - the one recorded instance, kept here
as the historical example the row cites). Considered and rejected: a second
`Stop` script (re-parses the same `git status`, speaks in a second message
the human has to reconcile with the first - `session-stop.mjs` already owns
the moment and the input); a dedicated cleanup agent (three jobs with three
gate profiles, and a cold agent is the worst judge of scratch vs evidence -
this row, a reviewer nit category, and sharpened closeout prose were chosen
instead). If the checklist step this row backstops keeps being skipped
anyway, the named fallback is a read-only closeout auditor (reviewer-shaped);
not built. |
| 40 | Deny `rm`/`git rm` of a still-cited file under `issues/<id>/`, or the directory itself | `PreToolUse(Bash)` | **adopt** | A retirement looks complete on its own - nothing breaks, `npm run check` still passes - and the orphans are found months later by someone reading a citation that points at nothing; ten of them shipped this way for issue 65's retired `plan.md`. Deny, not warn: a `speak` at `PreToolUse` is acknowledged and stepped past, which is the thing being guarded against, and the escape (repair the citations first, or run the command in the human's own terminal) is the same shape every other block in this family offers. Considered and rejected: `edit-guard.mjs` never sees a deletion (no Edit-family tool fires for one); `session-stop.mjs` would fire on history rather than on the action, after the content is only recoverable from git history; `selftest.mjs` cannot be the rule, since it runs inside `npm run check` and a `.md`-only retirement commit is gate-exempt, so the check need never run between the deletion and the commit. `bash-guard.mjs` is the only site with both the input and the timing. Fallback if this proves too blunt: downgrade to `speak` at the one call site (trigger, lookup and message unchanged) - record the downgrade here rather than deleting the row. **Tightened 2026-09-18** (`workflow-hygiene`) to every file under `issues/<id>/` and the directory itself, with the unslashed `issues/<id>` as the needle: retirement is now every task's closeout, not a rare event, so the deny fires wherever the orphans would be made. Rows 31 and 38 above used to cite their originating task directories (`hooks-guardrails`, `agent-effort`) for the sketch each carries; retiring those directories needed the citations folded into the rows themselves first, or this rule denied the retirement - that is the rule working. Both rows are now fully self-contained, discharging that debt. A second, milder fallback was recorded and then overtaken by events: narrow the rule to live pointers only, recognising a `git show <sha>:path`-qualified citation as exempt - proposed while `plan.md` was still blocked by seven citations resolving only that way. The exemption above (`a git show <sha>:path citation is exempt`) is that fallback, already adopted rather than merely recorded. |
| 41 | Reviewer `tools:` allowlist (`Read, Grep, Glob, Bash`) | agent frontmatter | **adopt** (`config-audit` B2) | Read-only posture becomes deterministic instead of prose plus `permissionMode: plan`; Edit/Write/NotebookEdit/Agent/ToolSearch drop out, which also closes row 36 (no `ToolSearch`, no `SendMessage`). Bash stays for `git status`/`diff`/`log` and focused checks. **Probed 2026-09-16 on this host: enforced.** A dispatched reviewer reported exactly `Read`, `Grep`, `Glob`, `Bash` and no others; `Edit`, `Write`, `NotebookEdit`, `Agent`, `ToolSearch` and `SendMessage` were all absent, which closes row 36 in fact and not only on paper. Two limits on what the probe establishes: it covers the tool allowlist only - `permissionMode` is not observable from inside a subagent without performing an action the probe forbade, so that half stays unverified; and `Bash` in the allowlist means the read-only posture still rests on the reviewer prompt and the permission settings, since a shell redirection writes. The allowlist is not by itself a read-only guarantee. |
| 42 | Persistence-era guards: RLS gate, migration-reversibility gate, applied-migration `edit-guard.mjs` rule, gitleaks-on-commit, one session per shared database | gates, `edit-guard.mjs`, `bash-guard.mjs`, `CLAUDE.md` | **installed 2026-09-24** | Installed by `persist-0-foundation`: `npm run check:db` with the reversibility gate, rule 2m, rule 2l (gitleaks), the applied-migration `edit-guard.mjs` rule, the hosted-write rule 2n, and the `CLAUDE.md` sentence; design and status in this file's "Persistence era: decided now, activated at Phase 0" section. |
| 43 | Deny `grep -n` and `tail -c` (readers that bypass RTK) | `PreToolUse(Bash)` | **adopt** (`config-audit` B3) | Measured 2026-09-16: 198 sessions / 20,710 Bash commands over thirty days; ~281.4K tokens missed over 1,052 commands; `grep -n` 342 calls / ~117.6K and `tail -c` 159 / ~40.8K, together 158.4K of 281.4K = 56.3%, over half, in two commands. RTK's hook rewrites only at line start, so the miss is the piped, `$(...)` and `cd`-prefixed shapes prose has not moved. Matches the program token only, so `echo`, `git grep -n` and `rtk grep -n` are untouched; a line-start `grep -n` that RTK would have rewritten now costs one retry, the accepted price. Not `npm run check` and never `rtk npm run check`: the commit-gate trap this exemption once needed explaining for is superseded by row 45, which arms the gate directly on `rtk npm run check`. Fallback if the retry proves noisy: exempt a single-segment, single-line shape - record here, do not delete the row. **Narrowed twice at `rtk-coverage` B1** (first cut, then corrected on remediation against a direct probe): a bare leading `grep -n foo path` denied that exact shape RTK rewrites cleanly, so denying it earned nothing but a wasted round trip before the model took the offered escape to the Grep tool (103 such calls across the sampled transcripts) - net effect strictly worse than no rule. The first cut's own replacement boundary ("piped, substituted, or chained") was itself wrong and is not what shipped - it treated every pipe stage and every chain position alike, which a direct probe of the installed `rtk 0.48.0` (`rtk hook check "<command>"`, reproducible) disproved on both counts. **Measured boundary, pinned to `rtk 0.48.0`** (full table: this file, "Facts settled during measurement (rtk-coverage, 2026-09-18)"): `grep -n` rewrites on a bare command, an env-var prefix, and on either side of `&&`/`;`/`&`/a leading `cd` - a list operator never blocks it - and inside a pipe (`|`, never `||`) only as that pipe's own FINAL stage (`cat f | grep -n x` rewrites; `grep -n x | wc -l` and a pipe's middle stage do not); it never rewrites inside `$(...)`/backtick, or wrapped by `xargs`/`nohup`/`time` (not `env`/`command`, which are transparent, but `unwrap()` cannot tell the two groups apart so both are treated as blocking - a same-cost-as-before false deny for the transparent two, never a false allow). `tail -c`/`--bytes` gets none of `grep`'s exemptions - measured never rewritten in any position, pipe or chain, because `rtk read` has no byte-offset mode at all (only `--tail-lines`, which is why `tail -n` is unaffected by this rule) - so it denies unconditionally once matched. The deny messages point at restructuring into a standalone `rtk grep -n` / `rtk read`, not at the Grep/Read tool. |
| 44 | Warn when a task document is past its size budget | `Stop` | **adopt** (`config-audit` B3) | Measured 2026-09-15: issue 47's `plan.md` 1,031 KB (57.7% shipped-batch briefs), `handoff.md` 523 KB (96% of Status superseded snapshots), `context.md` 227 KB, growing 350-1,400 lines per working day, read by every worker at dispatch. Warn, never block: a Stop hook that blocks session-end is worse than a large file. Scoped to the session that wrote into the directory, deduped per state. The procedure and the never-drop / always-drop lists live in `.claude/skills/handoff/SKILL.md`. Rejected: a `PreToolUse(Write)` size deny (blocks the closeout write that fixes it); a `SessionStart` notice (the writer is who needs it). |
| 45 | Accept a leading `rtk ` in the commit gate's check-invocation regex, `check-observer.mjs`'s normalizer, and the two `LONG_CHECKS` regexes for `check`/`check:built`; retire the piped canonical form in favour of `rtk npm run check` | `PreToolUse(Bash)` (gate + reminder), `PostToolUse(Bash)` (observer) | **adopt** (`rtk-coverage` B1) | Live probe (this task): a `PostToolUse` hook receives RTK's already-rewritten command, not what the model typed - `cat package.json` logged as `rtk read package.json`. Since RTK silently rewrites a bare `npm run check` to `rtk npm run check`, and `CHECK_INVOCATION_RE` was anchored at `^npm`, the gate could never arm on a bare invocation; only the piped form (`set -o pipefail; npm run check 2>&1 | tail -n 120`, which RTK cannot rewrite) ever worked, in all 200 recorded check invocations sampled. A live latent bug, not a defect kept on purpose. Cannot weaken the gate: `rtk npm ...` propagates the child's exit code directly (verified: a script exiting 3 came back `exit=3`) and shows both stdout and stderr, so the non-zero test still refuses to arm on a real failure. **Fixed on remediation:** `check-observer.mjs`'s normalizer originally stripped a leading `rtk ` inside the same 3-iteration loop as `cd`/`pipefail`, so `rtk rtk npm run check` armed the observer while `CHECK_INVOCATION_RE` used directly (the gate, `LONG_CHECKS` - neither pre-strips) refused that exact string, since its own optional group can only ever consume one `rtk `. Not a live vector - RTK never doubles its own prefix - but a real mismatch between what arms the observer and what the guard recognises. Fixed by deleting the explicit strip rather than reducing it to one pass: one pass still leaves a second, independent `rtk `-tolerance layered on top of `CHECK_INVOCATION_RE`'s own, which still arms on the doubled string (verified directly: stripping one leaves one behind, and the regex's own optional group then consumes that leftover too). With no explicit strip at all, the observer's `first`-segment test and the guard's own regex agree by construction, because they are now the same test. Deleting the strip loop also moved `rtk cd /r && npm run check` (`rtk` wrapping `cd`, a shape RTK itself never produces) from armed to no-arm; nothing depends on it. |
| 46 | Deny a `npm run check`/`check:built` inside a pipe or redirected to a file, and have `check-observer.mjs` state the verdict | `PreToolUse(Bash)` (rule 2k), `PostToolUse(Bash)` (observer) | **adopt** (owner decision, 2026-09-18) | Measured over this project's 65 session transcripts: of 71 real check invocations, **61 were piped** into `tail`/`grep`, 9 redirected to a file, and exactly **one** was the canonical `rtk npm run check` that candidate 45 established. A pipe hands the Bash tool the last stage's exit status - `tail` always exits 0 - so a failed check is indistinguishable from a passing one; the recorded recovery is a second ~165s run, or an `echo $?` on a later line that reports the echo's own status. A redirect keeps the status but hides the stdout the observer needs, so the gate never arms and the file has to be read back. Candidate 10's reminder has said "no pipe needed" since 45 and fires once per session; those 61 runs are what a reminder is worth against a habit the docs themselves taught for months. The deny forbids nothing that works, and the paired verdict line removes the remaining inference: the observer already knows the failure markers and whether it armed, so it says `PASS` / `FAIL` / passed-but-unattributable in one line, and speaks only for a real foreground check invocation. Arming is unchanged and just as strict - the line states, it does not gate. **Two host facts, probed live rather than assumed, bound what that line can carry**, both on this Windows desktop build: no exit-code field reaches a `PostToolUse` hook at all here (a successful Bash call arrives as `{stdout, stderr, interrupted, isImage, noOutputExpected}`, whatever the hooks reference lists), so the pass/fail split rests on the stdout markers and the ` (exit n)` suffix stays empty; and on a *failed* Bash call the hook does not speak at all - the result comes back as a plain string, `"Exit code 1\n..."`, rather than that object, verified with a check deliberately failed at its prettier stage. Neither weakens the fix: unpiped, a failure opens with `Exit code 1` on the result's first line and a pass ends with the observer's own. The FAIL branch is kept for a host that does deliver the call, and for the case that genuinely reaches here - a run that exits 0 while printing failure markers. Covers `check:built` too (same family, same blindness) though only `check` feeds the gate; `check:fast` is out of scope, as it is everywhere else. Boundary caught while implementing: the `2>&1` strip has to run **before** the list split, because `LIST_SPLIT_RE` treats that `&` as a list operator and a later strip reads the leftover `2>` as a file redirect - `check-observer.mjs` had the order right already. Selftest #154-#171; #119 retargeted, since it asserted the now-denied shape. |
| 47 | Name LSP and ast-grep where agents actually read | `.claude/README.md`, the three code-facing worker prompts | **adopt** (owner decision, 2026-09-18) | Measured over the same 65 transcripts: `Grep` 109 calls, `rtk grep` 90, `git grep` 55, **LSP 16** - all in the three sessions that installed it, and only `hover`/`documentSymbol` - and **`ast-grep` 1**, that one being `--version`. `git grep` over `.claude`, `CLAUDE.md` and `docs/` found exactly one mention of either tool, `agents/reviewer.md`'s `tools:` list, which grants LSP without saying what it is for. The guidance existed only in the human's global `~/.claude/CLAUDE.md`, while every worker is told to follow a prompt file exactly - so the prompts, not a doc line, are the lever. Two live traps found while probing and written down rather than left to be rediscovered: `workspaceSymbol` returns `No symbols found in workspace` on this host for any query, so the operation the old guidance led with is the one that fails first; and an `ast-grep` pattern that does not match exits 1 with no output, which reads as "no such code" (`function $N($$$A) { $$$B }` finds nothing in `app/src/lib/search.ts` only because those functions carry return type annotations). `findReferences` works and is the reason to bother - 11 references to `foldQuery` across two files in one call. No hook: a nudge toward a tool is not a deterministic property, and candidate 43's history is what happens when a guard denies a shape that already worked. |
| 48 | Deny or fail on a comment citing a batch id, a review finding id or an `issues/<id>/` path | `tests/` grep or `PreToolUse(Edit)` | **reject for now** | The rule is new (`CLAUDE.md`, "Comments", 2026-09-18) and the sweep that applied it found ~95 files, all written before the rule existed - no recorded failure of the written rule yet (row 29's bar). Rule 2i already denies the one that does damage (an `issues/<id>/` citation, at retirement). Cheapest form if it recurs: a `tests/derived.js`-style check that greps comments in `app/src`, `tools`, `tests`, `.claude/hooks` for `issues/[^<]` without a sha prefix and for `\bB\d+(\.\d+)?[a-z]?-[NR]\d+\b`. |
| 49 | A wrap-up nudge off the five-hour usage window | `Stop` / `PreToolUse` | **withdrawn, do not rebuild** | Built, measured and withdrawn at `79e26c9`: the five-hour window is not readable on this host. The hook input's `effort` is an object `{ level }`, and the same level reaches a worker's Bash tool as `$CLAUDE_EFFORT`. Full finding: `git show b2eec64:.claude/improvements.md`, Finding 4. |
| 50 | Re-measure the configuration audit baseline | none (a manual pass) | **dated: 2026-10-15** | Same commands, same Windows host as the 2026-09-15 baseline (`rtk gain`, `rtk discover`, `wc -c` of the always-loaded markdown, the skill-listing sum); `grep -n` and `tail -c` should be near zero in `rtk discover`, and `CLAUDE.md` under 181 lines. A regression is a new row here. Baseline table and method: `git show b2eec64:.claude/improvements.md`, Finding 7. |
