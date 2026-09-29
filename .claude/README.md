# Claude agent wiring

| Agent | Prompt | Default model frontmatter | Effort frontmatter |
|-------|--------|---------------------------|--------------------|
| planner | prompts/plan.prompt.md | opus | high |
| implementer | prompts/implement.prompt.md | sonnet | medium |
| reviewer | prompts/review.prompt.md | opus | high |
| add-source | prompts/add-source.prompt.md | opus | medium |
| refresh-artwork | prompts/refresh-artwork.prompt.md | sonnet | low |

Orchestrator: prompts/orchestrate.prompt.md

## Model and effort routing policy

Workers use the frontmatter defaults above. Every role pins an effort from
`low` to `high`, so the human's session effort does not reach a worker;
`xhigh` and `max` are the human's exception for one task. The routing rules
and their reasons are in
prompts/orchestrate.prompt.md, "Model selection". The planner's
tier goes to `fable` for one dispatch only under the tests in "Planner tier"
and after the human's yes; the frontmatter stays `opus`, and a resume keeps
its tier. An implementer batch goes to `opus` when it meets a test in
"Writer tier" in the same prompt.

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
- The reviewer has had no `permissionMode` since `process-guards`: it has
  the Write tool for its report, and rule 2s with `edit-guard.mjs`'s
  reviewer rule is its read-only guarantee (`docs/decisions/`, 2026-09-27,
  "The reviewer writes its report to `issues/<id>/reviews/` and nowhere
  else"). The review prompt still forbids `SendMessage` in prose
  (candidate 36).
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
| `PreToolUse` | `Bash\|PowerShell` | `bash-guard.mjs` | A PowerShell command is normalised first (each backtick and the character after it become a space, `\` becomes `/`) and then judged by the same families; a cmdlet such as `Remove-Item` is not judged (`docs/DECISIONS.md`, 2026-09-24). Persistence-era families, after attribution: **2n** is an allowlist of `supabase` commands, deny by default (`docs/DECISIONS.md`, 2026-09-25, "Agents may write to the test project; production is CI's or the owner's"): `--help` or `-h` anywhere is allowed (help never writes, and the CLI refuses a help flag in a value position), while `--version` and `-v` pass only on the bare CLI (`db reset --version <timestamp>` is a reset); a `db *`, `migration *` or `config push` command whose every target is the test project - `--project-ref rdjxcjkhsklhprmzxajq` (`TEST_PROJECT_REF`, equal to `PROJECTS.test` in `tools/supabase/lib.mjs`, which `tests/derived.js` asserts), or a `--db-url` with no query string whose host is `db.<ref>.supabase.co` (user `postgres` or `postgres.<ref>`) or a `*.pooler.supabase.com` host with the user `postgres.<ref>` - is allowed, while `--linked`, a variable or no target is no proof; otherwise the first two words look up a table: always allowed are the bare CLI, `start`, `stop`, `status`, `init`, `completion`, `migration new`, `functions new`, `functions serve`, `test new`, `config diff` and `db start` (it has no `--local` flag and only ever starts the local database); `db push` and `db dump` need `--dry-run` or the local stack; `db reset`, `migration down`, `migration list`, `migration squash`, `db diff`, `db lint`, `gen types`, `test db`, `inspect db` and `seed buckets` need `--local` with none of `--linked`/`--db-url`/`--project-ref`; `migration up` needs none of those three; every other pair (`link`, `login`, `secrets`, `functions deploy`, `storage`, `projects`, `config push` or `migration repair` without the test target, an unknown word) is denied. `npm run config:push`/`db:push`/`limits:set` is allowed only with `--project test` and no other `--project`; the script is read past a leading `rtk`, npm's flags on either side of the verb (`-s`, `--silent`, `-q`, `--loglevel <v>` or `=<v>`, any other `-` token; before the verb, any other `--name` without `=` takes the next token as its value unless that token is a verb or a flag, so `npm --registry x run db:push` is judged) and the verbs `run`, `run-script`, `rum` and `urn`. The owner-only restore: a segment whose program (past `rtk`) is a package runner - `npm`, `pnpm`, `yarn`, `bun`, `npx`, `pnpx`, `bunx`, `corepack` - with a token that is exactly `restore:prod` (quoted as one word or not), or a `node` run (past `rtk`, `rtk proxy`, `npx`, `npm exec`) with a token, or the value after its first `=`, whose last path segment is `restore-prod.mjs` is denied, because only the owner restores production ("Restore production (owner)"); a search for the name (`git grep restore:prod`, `rtk grep restore:prod docs`, `git log -S restore:prod`) and reading, diffing or staging the file are not. Not matched, and left to `main`'s terminal check: `bash -c "npm run restore:prod"`, `bun <file>` and PowerShell's `Start-Process`; the rule stops accidents, and the TTY check stops an agent's run of any of them. The CLI counts as run through a path ending in `supabase` (`node_modules/.bin/supabase`), `node <...>/supabase/dist/supabase.js` (the tools' own entry), a package runner - `npx`, `bunx`, `pnpx`, `npm exec`/`x`, `pnpm exec`/`dlx`, `yarn exec`/`dlx`, `bun x` (past its flags, a `-p`/`--package` value and a bare `--`) - or `rtk`; **2q** (after 2n) denies a Bash or PowerShell command with a token, or the value after a token's first `=`, whose last path segment is exactly `.env.restore.local` (the owner's backup key; readers such as `cat` and `type`, a quoted single-word path and a `<` redirect included, a quoted phrase such as a commit message not), because only `npm run restore:drill` reads that file ("Run the agent drill"); a glob that expands to it, and a PowerShell colon-bound parameter (`-Path:.env.restore.local`, whose last segment is the whole token), are not caught; **2u** (after 2n) denies a Supabase CLI command that starts, stops or resets the local stack - `start`, `stop`, `db start`, and `db reset`, `db push`, `db diff`, `migration up`, `migration down`, `test db` or `seed buckets` with none of `--linked`/`--db-url`/`--project-ref` (help is never judged) - while `stack-lock.mjs`'s `foreignStackLock()` finds a fresh lock of another checkout (a hand-written lock is always foreign), naming the holder and "45 minutes" ("Supabase configuration", "The local stack lock"); **2t** (after 2q) denies a dot-source, `source` or a file printer - `cat`, `type`, `gc`, `Get-Content`, `more`, `less`, `head`, `tail`, `bat`, `nl`, `od`, `xxd`, `strings`, `rtk read` - with an operand (a leading `<` stripped) whose last path segment starts with `.env`, because `. .env.test.local` once printed part of a value; `node --env-file=<file>`, `npm run e2e`, a search (`git grep`, `rtk grep`) and a quoted phrase are not judged (`docs/decisions/`, 2026-09-27, "Agents read no .env file; the program loads it with `--env-file`"); **2v** (after 2t) denies a `node` run with a token whose last path segment is `gate-credit.mjs`, because only the check chain arms a gate by its exit ("Run a long check", "Gate credit"); **2p** (after 2i) denies a `git rm`, `git mv`, `rm` or `mv` whose positional token is a `supabase/migrations/<file>` that a remote-tracking ref holds, with edit-guard's lookup, fetch and message (a deletion or a rename never reaches an Edit-family tool); a source token that is a directory at, under or above `supabase/migrations/` expands to the migrations under it, and a glob in a token's last segment (`*` or `?`) expands against its parent directory, because the shell expands it only after the hook has judged the command; a move's destination directory only receives and is not expanded; a `.exe`/`.cmd`/`.ps1`/`.bat` suffix is dropped from every program (`git.exe` is `git`), and `--local=false` or `--dry-run=false` counts as absent; **2s** (right after the blocklist, so a reviewer's `git reset --hard` keeps the blocklist's message) judges only `agent_type` `reviewer` and denies a git write subcommand (`add`, `am`, `apply`, `checkout`, `cherry-pick`, `clean`, `commit`, `merge`, `mv`, `pull`, `push`, `rebase`, `reset`, `restore`, `revert`, `rm`, `stash` but `stash list` and `stash show`, `switch`, `update-ref`, `worktree`; `branch` with a delete, move, copy or force flag; `tag` with a delete flag), a file writer (`rm`, `rmdir`, `mv`, `cp`, `touch`, `mkdir`, `tee`, `ln`, `chmod`, `chown`, `truncate`, `dd`, `patch`, `sed` or `perl` with `-i` alone, with a suffix, in a cluster or as `--in-place`), a writing cmdlet (`Set-Content`, `Add-Content`, `Out-File`, `New-Item`, `Remove-Item`, `Move-Item`, `Copy-Item`, `Rename-Item`, `Clear-Content`, `Set-Item` and their aliases, `del`, `erase`, `rd`, `copy`, `move`, `ren` and `md` included), a formatter or linter run with a `--write` or `--fix` token (Prettier's `-w` too, directly or through `npx`, `pnpx` or `bunx`), an `npm` verb but `ls`, `list`, `ll`, `la`, `view`, `info`, `show`, `outdated`, `explain`, `why` and `help`, a Supabase CLI call but `status` and help, and an output redirect to a file but `/dev/null`, `nul` or `$null` (`2>&1` and `>&2` are not a file), because the reviewer is read-only except its report (`docs/decisions/`, 2026-09-27, "The reviewer writes its report to `issues/<id>/reviews/` and nowhere else"); **2r** (right after 2n) denies a migration write to the test project - `npm run db:push` with `--project test`, a `node` run of `db-push.mjs` with `--project test`, a Supabase CLI `db push` without `--dry-run` or `migration up` whose target is the test project, and, in a cloud session only, a `git push` without `--dry-run`/`-n` whose `HEAD:supabase/migrations` tree differs from its upstream's (else `origin/main`'s) - while `supabase/migrations` has uncommitted changes, or while no `issues/*/reviews/*.md` reads `Verdict: approve` with a `Reviewed:` commit whose `supabase/migrations` tree equals `HEAD`'s (`lib.mjs`, `parseReviewHead`; the head lines of `.claude/templates/review.template.md`); the deny names the short tree hash and each report seen; no migrations tree at `HEAD`, or a git failure, allows; a local `git push` is not judged, because a local release pushes once, at closeout, after its review (`docs/decisions/`, 2026-09-27, "An agent pushes migrations to the test project only after an approving review"); **2o** in a cloud session only, denies a `git push` from `main` or a detached HEAD, with `--all`/`--mirror`/`--tags`/`--delete`/`-d`, or to any destination but the current branch or `HEAD`; **2l** runs `gitleaks git --pre-commit --staged --config .gitleaks.toml --redact` (4 s timeout per scan, so two scans fit the hook's 10 s) before every non-dry-run `git commit` and denies on a finding, naming `file:line (rule)` and never the secret - it speaks, and allows, when gitleaks is missing, slow or fails, and has no bypass; for `git commit -a` or a commit with a pathspec (`--pathspec-from-file` counts as the whole tree) it runs a second scan without `--staged` (the unstaged working-tree diff), so the two scans cover whatever any commit form can take from the tree, and a finding in either denies; **2m** after the check gate: a commit staging `supabase/**` or `tests/db/**` (or `-a` over them, or a pathspec that names their unstaged changes - 2e unions the unstaged paths a pathspec matches, as it unions all of them for `-a`) needs a passing `npm run check:db` for the tree key (`.check-db-cache.json`). `SKIP_CHECK_GATE=1` bypasses 2e and 2m together. Then, as before: blocks `git reset --hard`, forced `git clean`, a `git push` with any force form, `git checkout`/`restore` discards (including `restore --staged --worktree`), `git stash drop`/`clear`, `rm -r` inside the repo with or without `-f`, `rm`/`git rm` of any file under an `issues/<id>/` or of the directory while a tracked line outside it cites `issues/<id>/` (a `git show <sha>:path` citation is exempt), blanket staging (`git add -A`, `git commit -a`) with 2+ dirty paths, AI attribution in a commit message, commits when `npm run check` has not passed for the covered paths (the
fingerprint drops every `isExempt()` path - `issues/<id>/` markdown,
`.claude/README.md`, `docs/specs/` - so an edit confined to those cannot
arm or break the gate; `tree-key.mjs`), a backgrounded `npm run check` in a subagent (rule 2g, plain or `rtk`-prefixed; only when `agent_id` is in the hook input, because a subagent's background run dies with its turn, while the main session is notified at the exit and the check arms the gate by its own exit), a `npm run check`/`check:built` inside a pipe or redirected to a file (rule 2k - the pipe hands the tool the last stage's status, so a failed check reads as a pass; the redirect hides the stdout the gate needs), and `grep -n`/`tail -c` in a shape `rtk 0.48.0` is measured never to rewrite (`grep -n`: a non-final pipe stage, inside `$(...)`/backtick, or wrapped by `xargs`/`nohup`/`time`; `tail -c`/`--bytes`: any position at all, chain or pipe - it has no byte-offset rewrite) - a bare, chained (`&&`/`;`/`cd`), or pipe-final-stage `grep -n` passes through for RTK's own hook to rewrite; restructure a denied one into `rtk grep`/`rtk read`. Reminds once per session per command family before a long check, including an unsharded `golden.js`/`sweep.js` call - a sharded `run-all.js --shard=n/m` call is not read as the safe form by contrast, it gets the same reminder on its own merits, since a single bin can itself run past the idle-host minute mark (`.claude/README.md`, "Batch size and the fixed cost of a run"). | **block** (+ one allow-and-remind case) |
| `PreToolUse` | `Edit\|MultiEdit\|Write\|NotebookEdit` | `edit-guard.mjs` | Blocks writes to `data.json`, `catalog.csv`, `i/*.html` (with `i/en/*.html`), `en/index.html`, `pages/*.html`, `pages/en/*.html`, `dist/`, `dist-test/`, `package-lock.json`, `tests/app/snapshots/**`, `docs/DECISIONS.md` (the generated index of `docs/decisions/`; the message names `node tools/decisions.js`), and a `supabase/migrations/<file>` that a remote-tracking ref holds (`git fetch --quiet origin` first when a remote `origin` exists - 5 s at most, `GIT_TERMINAL_PROMPT=0`, so a push from another clone is seen - then `git for-each-ref refs/remotes/`, then `git cat-file -e <ref>:<path>`; CI applies every pushed migration, so a pushed one is history - "write a new migration instead"). `lib.mjs`'s `remoteRefsHoldingMigration` is the lookup, shared with rule 2p. No file records applied migrations; a failed or slow fetch reads the local refs as they are, and a repository with no remote ref, or a git failure, blocks no migration (fail open). For `agent_type` `reviewer`, before every other rule: only `Write`, `Edit` or `MultiEdit` on `issues/<id>/reviews/<name>.md` is allowed, and every other write is denied, a path outside the repository included (`docs/decisions/`, 2026-09-27, "The reviewer writes its report to `issues/<id>/reviews/` and nowhere else"). | **block** |
| `PreToolUse` | `Agent\|Task\|SubagentDispatch` | `agent-guard.mjs` | Judges an `implementer` dispatch whose prompt names `TASK: <id>` against `issues/<id>/plan.md` Status: denies when it has no `- Plan review:` line or a malformed one ("declare it"), and when a `required before <batch>` line has no `issues/<id>/reviews/plan-<batch>.md` or `plan-<batch>-<n>.md` whose head reads `Verdict: approve` (`lib.mjs`, `parseReviewHead`); the deny names the file, each report seen with its verdict, and the dispatch tool (`docs/decisions/`, 2026-09-27, "A plan that changes schema, contracts, stored data or sync is reviewed first"). Silent for another agent type, no `TASK:` line, a `TASK: <id>` placeholder, no `plan.md`, and any throw; a resume (`SendMessage`) is not a dispatch. This host's dispatch tool is `Agent`; `Task` and `SubagentDispatch` are other builds' names. | **block** |
| `PreToolUse` | `Read\|Grep` | `read-guard.mjs` | Denies the Read tool's `file_path`, and the Grep tool's `path` or `glob`, whose last path segment starts with `.env` (case folded, `\` read as `/`), from any checkout, because a `./` pattern in `permissions.deny` binds the session's working directory and an absolute path from a worktree passed it (`docs/decisions/`, 2026-09-27, "The Read and Grep tools are denied `.env` files by a hook, not only by settings"). A Grep by pattern over a directory is not judged ("Known limitations"). A worktree agent is guarded by its worktree's tree, cut from `origin/main`, so a change reaches it only after the push ("Known limitations"). No git and no file read; any throw allows. | **block** |
| `PostToolUse` | `Bash\|PowerShell` | `check-observer.mjs` | `npm run check:db` from either tool: reads the output from `tool_response.stdout`, else `.output`, else a string response, plus `stderr`; a `check:db: BUSY` line (the local stack lock is held; tested before the FAIL markers, because npm prints its own error lines for exit 3) says BUSY and writes nothing, a `check:db: PASS` line writes `.check-db-cache.json` and says "Commit gate armed for supabase/ and tests/db/", a `check:db: FAIL` line or a failure marker says FAIL, neither says it cannot attribute the run. When a run cannot be attributed (`check:db` without its PASS line, `check` without its coverage summary) but the cache already holds the current tree key, the check's own exit armed the gate (`gate-credit.mjs`), and the line says `PASS - armed by the check's own exit.` An attributed pass does not rewrite a cache that already holds the current key, so a `by: "exit"` record stays. `npm run check` arms from Bash only, as follows. Records a passing `npm run check` against the current tree fingerprint, so the commit gate has something to check against. Accepts a leading `cd <dir> &&` or `cd <dir>;` (PowerShell 5.1 has no `&&`), `set -o pipefail;`, and `rtk `. States the verdict in one line - `PASS` and armed, or passed-but-unattributable - so the result needs no second run to establish. On this host a failed call never reaches it (see "Run a long check"), and no exit-code field reaches it at all. | warn (one line per passing check; silent otherwise) |
| `PostToolUse` | `Edit\|MultiEdit\|Write\|NotebookEdit` | `edit-followup.mjs` | Records the write for the `Stop` hook. Reminds once per session per group about `data.js` -> `node tools/build.js`, public-contract fixtures, and a write under `docs/decisions/` -> `node tools/decisions.js` (`remind:decisions`). Known false-positive, kept as a nag rather than fixed: it tests `p.startsWith('docs/fixtures/')`, so it fires its public-contract reminder on any write under `docs/fixtures/share/`, which is not itself a contract surface (`CONTRACTS.md` enumerates only `docs/fixtures/lists/*.json` and `docs/fixtures/urls/routes.json`) - the reminder firing there is not evidence a contract moved. | warn |
| `Stop` | - | `session-stop.mjs` | Warns when this session's own writes are still uncommitted, or the active task's `handoff.md` looks stale next to what this session wrote. Separately names this session's own writes that are still untracked (excluding `docs/` and the task-document set - `context.md`/`plan.md`/`handoff.md`/`mocks/` - in any `issues/<id>/`, where the review register `reviews.md` and the reports under `reviews/` count as task documents too), as candidates for either a commit or deletion; never both sentences for the same path. Warns when a task document of the active task is past its size budget (150 KB; past 300 KB it names the collapse action per file), only for the session that wrote into that task directory. | warn, never block |

Two modules under `.claude/hooks/` are not registered hooks: `gate-credit.mjs`
(the `begin` and `arm` steps of the `npm run check` chain, and the credit
that `tests/db/run.mjs` imports; "Run a long check", "Gate credit") and
`stack-lock.mjs` (the local stack lock that `tests/db/run.mjs`,
`restore-drill.mjs` and rule 2u read; "Supabase configuration", "The local
stack lock"). Both are in the selftest's fail-open loop.

**Settings besides hooks.** `.claude/settings.json` also sets `attribution`
(`commit` and `pr` empty, so the harness adds no attribution line) and `env`
(`GIT_AUTHOR_*` and `GIT_COMMITTER_*` as `artex-x
<artex-x@users.noreply.github.com>`), the commit author since 2026-09-25
(`docs/DECISIONS.md`, "Commit author and attribution are set in
`.claude/settings.json`"). Both are read at session start, so an edit
applies from the next session. `bash-guard.mjs` rule 2d (an attribution line
in a commit message) stays as the backstop for a session or host that does
not load them. Since 2026-09-27 it also sets `permissions.deny`: the Read
tool on `.env*` files at the root and under `supabase/` ("Supabase
configuration"; `tests/derived.js` pins `Read(./.env.*)`). A `./` pattern
binds the session's working directory: from a worktree, a Read of the main
checkout's `.env` file by its absolute path passed (probed 2026-09-27), so
`read-guard.mjs` is the deny that reaches an absolute path (`docs/decisions/`,
2026-09-27, "The Read and Grep tools are denied `.env` files by a hook, not
only by settings"; `tests/derived.js` pins its registration). A worktree
agent is guarded by the hooks of its worktree's tree, so only from a
commit that `origin/main` carries ("Known limitations").

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

Seven runtime files live under `.claude/` and are gitignored
(`.claude/.gitignore`):

| File | Written by | Contents |
|---|---|---|
| `.check-cache.json` | `check-observer.mjs`, `gate-credit.mjs` | `{ key, at, command, by }` for the last passing `npm run check`; `by` is `observer` (the hook saw the output) or `exit` (the check's own exit armed it). |
| `.check-db-cache.json` | `check-observer.mjs`, `gate-credit.mjs` | `{ key, at, command, by }` for the last passing `npm run check:db`, against the same tree key. |
| `.check-pending.json` | `gate-credit.mjs` | `{ key, at, ppid }`: the tree key at the start of the running `npm run check` and its script shell; `arm` reads it, and deletes it when the `ppid` is its own run's. Gitignored, because an unignored file would change the key it records (`tests/derived.js` pins the line). |
| `.check-db-pending.json` | `gate-credit.mjs` | `{ key, at, ppid }` of the running `npm run check:db`. |
| `.check-index` | `tree-key.mjs` | A throwaway copy of the real index, never the index itself. `tree-key.mjs` finds the index with `git rev-parse --git-path index`: in a linked worktree `.git` is a file, and the old `<root>/.git/index` path made the key null there, so every commit gate failed open in a worktree until 2026-09-24. |
| `.restore-receipts.json` | `tools/supabase/restore-drill.mjs` | The receipts of passed restore drills, newest first, 20 at most, one per source: the source id, the hashes of the decrypted files, the newest migration, the host and the time; no row count and no row. `npm run restore:prod` refuses a source without a receipt under 24 h old. It lives in the main checkout's `.claude/`, also for a drill run from a worktree. |
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
- **Measured with `rtk`, it crossed the output cap until 2026-09-25.** A result over about
  30,000 characters is not shown - the tool saves it to
  `tool-results/<id>.txt` and names the path. `rtk npm run check`'s full
  output (both stdout and stderr, unpiped) measured 21,382 characters
  across 361 lines on this host (`rtk-coverage` remediation,
  2026-09-18), and 31.2 KB on 2026-09-24 once `tools/supabase/lib.test.mjs`
  joined the chain. On 2026-09-25 on this host it printed 34.4 KB: the
  result was persisted and `check-observer.mjs` did not arm the gate. The
  same day vitest's coverage reporter became `text-summary` only (the
  per-file table was 4.9 KB): 29.6 KB, still persisted. The `node --test`
  steps then took `--test-reporter=dot` (one dot per test; a failure still
  prints in full): about 3 KB, shown inline, and the observer armed. The
  observer's marker is the summary block (`= Coverage summary =` and its
  `Lines` row); the per-file table prints with `npx vitest run --coverage
  --coverage.reporter=text`. A focused vitest file runs from the repository
  root (`npx vitest run app/src/state/lists.test.ts`); from `app/` it finds
  no file and exits 1. If a result is persisted again, grep the
  persisted file for `Coverage summary`, `fail` or `gate credit:` rather
  than re-running the check: since gate credit a green run arms the gate by
  its own exit even when the observer cannot attribute it ("Gate credit"
  below) - the deleted parity
  harness hit the same cap from its diff lines carrying a page's whole
  text; nothing that survives R0c produces a single line that large,
  but the technique still applies if something ever does.

`npm run check > out.txt 2>&1` then reading the file does **not**
satisfy the gate, however genuinely the run passed - the hook never
saw the output, and reading the file back costs a second call. It is
blocked at `PreToolUse` alongside the pipe (rule 2k). A run started with
`run_in_background` is not attributed either: `check-observer.mjs`
returns early on it by design, because there is no stdout to attribute
yet. Since gate credit the check arms the gate by its own exit there too,
but a subagent whose turn ends with the run still going loses the result:
backgrounding cost three worker runs on issue 47, and rule 2g (candidate
27) still denies it inside a subagent, for a plain or `rtk`-prefixed check
alike. The main session is notified when the run exits.

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
one `db reset --local` per migration in the reversibility base check, seven
migrations took 723 s (2026-09-25), past the tool's 600 s cap. Since the
base check walks forward from one reset (`docs/DECISIONS.md`, 2026-09-25),
a run resets three times whatever the migration count (the runner, the
applier test, the walk): seven migrations took 192-203 s wall clock, the
suite about 146 s of it, 72-76 s the walk (measured 2026-09-25 on this
host); each
new migration adds about 10 s. Since `persist-3-realtime` the stack also
runs Auth, Realtime and Kong: the first `supabase start` pulled Kong and
took 82 s, a restart 51 s, and each `db reset --local` 55-71 s, because
the CLI restarts the containers after it. A warm run with 238 tests took
545 s wall clock, the suite 487 s (measured 2026-09-27 on this host), close
to the tool's 600 s cap; a run past it arms the gate by its own exit
("Run a long check", "Gate credit"). Its
last stdout line is `check:db: PASS` or `check:db: FAIL`, and
`check-observer.mjs` arms the `supabase/` and `tests/db/` commit rule from
the PASS line. The observer matches the command at its start, so a run
wrapped in anything (a timer such as `$s = Get-Date; npm run check:db; ...`)
passed and armed nothing, and the commit was then refused by rule 2m
(2026-09-25); since gate credit the suite arms its gate by its own exit
("Gate credit" below), but the observer still cannot state the verdict.
Run the command alone. Measured live on 2026-09-24: a PowerShell call reaches the
`PostToolUse` hook with the PASS line in its text and no exit-code field
(the verdict line carried no `(exit n)`), and the `Bash|PowerShell`
matchers took effect in the session that saved them. The CLI's progress
lines go to stderr and print after the suite's stdout.

**Gate credit.** Both checks arm their commit gate by their own exit 0
(`docs/decisions/`, 2026-09-27, "A green check arms the commit gate by its
own exit, not a host-wide lock"). `npm run check` starts with `node
.claude/hooks/gate-credit.mjs begin check` and ends with `node
.claude/hooks/gate-credit.mjs arm check`; `&&` runs `arm` only after every
step passed. `tests/db/run.mjs` calls `beginCredit('check-db')` once it holds the stack lock and
`armCredit('check-db')` before its PASS line. `begin` records the tree key
in `.check-pending.json` (`.check-db-pending.json`); `arm` computes the key
again and writes the cache with `by: "exit"` only when the two are equal,
because a background run leaves the agent free to edit, and a key taken
only at the end would credit edits the run never saw. It prints one line:
`gate credit: armed (npm run check exited 0)`, `gate credit: not armed -
the tree changed during the run`, `gate credit: not armed - the tree key
could not be read`, or `gate credit: not armed - another run began after
this one`. The pending file also records `ppid`, the run's script shell
(`begin` and `arm` of one chain are its children; `tests/db/run.mjs` calls
both in one process), and `arm` accepts only its own run's key: when two
runs of one check overlap in one tree, the older run's `arm` must not
credit the key of a newer run that failed. `beginCredit` deletes an older
pending file first, and `tests/db/run.mjs` calls it only after it holds the
stack lock, so a BUSY run never replaces the running suite's key. So a run that the harness moved to the background, a
run in the human's terminal and a run whose output is over the tool's cap
all arm the gate. Every path of `gate-credit.mjs` exits 0: a credit step
never turns a green check red. To confirm without a commit, read
`.claude/.check-cache.json`: `by: "exit"` and a `key` equal to `treeKey()`
(computed by invoking `tree-key.mjs` against the working tree) mean the run
passed and armed the gate. A hand run of `gate-credit.mjs` is denied (rule
2v); `SKIP_CHECK_GATE=1` stays the visible bypass. The trade-off: the credit
trusts the chain's exit, so a step that exits 0 on a failure would credit
it; the observer's FAIL markers still speak for a foreground run.

**More host facts about a long check, recorded so nobody re-derives them:**

- Without `rtk` (the Linux cloud container, measured 2026-09-24) a plain
  `npm run check` prints about 65 KB, over the tool's output cap, so the
  result is persisted to a file and `check-observer.mjs` cannot attribute
  it. Since gate credit the check arms the gate by its own exit there
  ("Gate credit"); grep the persisted file for `gate credit: armed`. Commit
  with `SKIP_CHECK_GATE=1` only when a green run lacks that line, and record
  the exact command and result in the task's handoff. Chromium is
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
- Rule 2g denies a subagent's explicitly backgrounded check, but a
  foreground call that outlives its 600 s timeout is backgrounded by the
  harness itself, and `check-observer.mjs` then never reports to a live
  agent - the rule cannot see it either. Hit three times in one task.
  Candidate fixes considered: Stop-time reconciliation, a longer-lived
  observer, accept-and-document, a host-wide heavy-run lock. The chosen
  fix is gate credit (`docs/decisions/`, 2026-09-27, "A green check arms
  the commit gate by its own exit, not a host-wide lock"): the check arms
  the gate by its own exit, so such a run is no longer lost - wait for its
  exit, then confirm the cache before the commit.
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
  subagent whose own turn has already ended. The commit gate sees both
  cases since gate credit (the check's own exit arms it), which is why rule
  2g is scoped to a subagent (`agent_id` in the hook input) and to the
  gate-feeding check.
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
  module against the working tree, and compare. Before gate credit, a
  tool-auto-backgrounded run that completed exit 0 did not move the cache;
  a probe commit was denied naming "35 checked files" as still unaccounted
  for. Such a run now writes the cache with `by: "exit"`.
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
| `npm run check` | ~165s | near or past the Bash tool's 600s foreground cap; a run that crosses it is backgrounded and still arms the commit gate by its own exit ("Gate credit") - wait for its exit, then confirm `.check-cache.json` before the commit |
| `npm run check:built` | a few minutes | longer |
| `node tests/run-all.js app/print,app/contracts,app/states,app/typo,app/hues,stub` | ~260-290s pooled | longer |
| `node tests/app/sweep.js <width>` | ~320-590s per width | longer; `app/sweep` as a whole (`run-all.js app/sweep`, all four widths) is past the cap and must run width by width |
| `node tests/app/golden.js --shard=n/4` | ~100-290s per shard | longer; the four shards must run separately, never as one bare `node tests/app/golden.js` call |
| `node tests/run-all.js <suites> --shard=n/m` | varies with what the packer bins together - measured up to ~372s for one bin (`sweep1180-ru`: 371.9s(ru)/172.7s(en), CI run `35232880507`) | longer; a shard's own bins are not interchangeable with `ci.yml`'s matrix count (`tests/derived.js` asserts the two agree) |

Re-measured on this host on 2026-09-25, at the end of the accounts release:
`npm run check` 348 s (vitest with coverage 200 s of it, 52 files and 1517
tests; the hook selftest 719 cases), `npm run check:built` 19 s, `node
tests/run-all.js app/states` 197 s. The check has grown with its suites, so
plan by these figures, not by the table's 165 s. `npm run e2e` runs end to
end on this host too: 50 s on 2026-09-25, F0-F7 in Chrome. Its configured
build runs `npm` through a shell on Windows (`npm.cmd`; without the shell
the spawn failed with ENOENT and the run stopped at "the configured build
failed").

Re-measured on this host on 2026-09-26, at the end of the lists release:
vitest with coverage 156 s (59 files, 1700 tests), the hook selftest 812
cases, `node tests/run-all.js app/states` 188 s, `node tests/run-all.js
app/contracts` 343 s. The same day a check died with Windows status
0xC000012D (the commit limit): the host ran out of memory with seven agents
and their worktrees open. Run the heavy gates with one agent session open.

Re-measured on this host on 2026-09-26, at the end of the migration
release: `npm run check` 396-404 s (vitest 63 files, about 1945 tests) and
528-593 s on a loaded host, close to the 600 s cap; `npm run check:db`
403 s for 216 tests under the stack lock (422 s for 211 on a loaded host);
`node tests/run-all.js app/states` 218 s, `app/contracts` 364 s; a golden
shard 175-182 s (181 states); `node tests/app/sweep.js 360` 430 s; `npm
run e2e` 104-117 s (contract cases A-I, F0-F10); `check:built` 23 s.

Re-measured on this host on 2026-09-27, at the account menu release: a
golden shard 186-199 s (183 states); `node tests/run-all.js
--exclude=app/golden --shard=n/5` 405-532 s per call, each under the 600 s
cap (`app/states`, 51 cases, 299 s; one `app/sweep` width 328-532 s);
vitest 64 files, 1984 tests. The same day, after the review's fixes:
`node tests/run-all.js app/states` alone 254 s; a golden shard in compare
mode 186-201 s; `npm run check` passed inside one 600 s call (vitest 207 s,
1988 tests). Later the same day, at the usage-monitoring release: `npm run
check` (1988 tests, selftest 1295 cases) and `npm run check:db` (one more
migration and test file) each ran past the 600 s cap in one pass and armed
the gate by its own exit.

Re-measured on this host on 2026-09-27, at the Realtime database batch:
`npm run check` passed in one call (vitest 277 s, 2003 tests); `npm run
check:db` with Realtime, Auth and Kong in the stack 545 s wall clock for
238 tests (each `db reset --local` 55-71 s, the reversibility walk 131 s,
the restore suites 198 s).

Re-measured on this host on 2026-09-27, at the Realtime client batch:
`npm run check` passed in one call (vitest 187 s, 66 files, 2078 tests);
`npm run check:db` 432 s of suite time for 239 tests; `node
tests/run-all.js app/states` 243 s (53 cases); `node tests/run-all.js
app/print,app/contracts,app/typo,app/hues,stub` 432 s pooled
(`app/contracts` 414 s); `npm run e2e` (contract cases A-J, F0-F11)
passed inside one 600 s call.

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
split the real-Chrome suites across five such jobs for exactly that reason
(four until 2026-09-26, when the slowest suite step passed 360 s on two
consecutive runs, 36229149582 and 36230695846).
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
working tree" (`CLAUDE.md`). Settled on 2026-09-27 (`process-guards`,
`docs/decisions/`, "A green check arms the commit gate by its own exit, not
a host-wide lock"): no heavy-run lock. A lock guards data; two heavy runs
share CPU and memory, not files, so a lock converts the cost into a wait,
and every heavy entry point would need a writer with stale-lock recovery.
The costly failure, a green run lost at the 600 s cap, is removed by gate
credit instead ("Run a long check", "Gate credit"). "At most two heavy
agents on this host" stays an orchestrator rule
(`.claude/prompts/orchestrate.prompt.md`, "Long-running checks"). The one
shared resource that is data, the local Supabase stack, has its own lock
("Supabase configuration", "The local stack lock").

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
  the parity harness at R0c, above, and none replaces it on purpose
  (`docs/decisions/`, 2026-09-27, "A green check arms the commit gate by its
  own exit, not a host-wide lock").
- A manual local-stack command (`npx supabase db reset --local`) is refused
  under another checkout's stack lock (rule 2u) but takes no lock itself, so
  a `check:db` started while it runs does not see it.
- Rule 2t does not judge `sed`, `awk` or `grep` with a `.env` operand: their
  first operand is a pattern, so the rule would be noisy. A glob that
  expands to a `.env` file is not caught either.
- The Read deny in `.claude/settings.json` (`Read(./.env.*)` and the
  others) uses `./`-relative patterns, which resolve against the
  session's working directory. Probed 2026-09-27 from a worktree: a Read of
  the main checkout's `.env` file by its absolute path passed the deny.
  `read-guard.mjs` closes it for the Read and Grep tools; rule 2t covers
  Bash and PowerShell.
- A worktree agent is guarded by the hooks of its worktree's tree, which
  is cut from `origin/main`, not by the main checkout's unpushed hooks.
  Measured: the tree had no new hook and no deny came. Inferred cause:
  the relative hook command runs the worktree's copy, or the agent loads
  the worktree's `settings.json`. So a hook change guards worktree agents
  only after it is pushed (P3 in the `process-guards` facts list).
- Rule 2s, `edit-guard.mjs`'s reviewer rule and `read-guard.mjs` are habit
  guards: `node -e` can write a file, `bash -c "..."` is erased with its
  quotes, and a Grep by pattern over a directory is not judged (`rg` skips
  hidden and ignored files unless told otherwise). Rule 2s does not judge
  a bare `git branch <name>` or `git tag <name>`, which creates a ref:
  to tell it from a list form (`git tag -l <pattern>`, `git branch
  --contains <sha>`) the rule would need each subcommand's option grammar.
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

- Measured: vitest's coverage summary (the `= Coverage summary =` banner and
  its `Lines : n%` row) reliably appears in a passing `npm run check`, and
  does not appear alongside the failure markers (`npm error`, `ELIFECYCLE`,
  `FAILED`, `Tests \d+ failed`) in a passing run. It replaced the per-file
  table's `All files` header as the observer's marker on 2026-09-25, when
  the table left the check's output.
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
  On 2026-09-27 a Write of `.claude/agents/reviewer.md` passed with no
  prompt (the `process-guards` facts list), so the refusal is not constant.
- Hook input's `effort` field is `{ level }` (docs; not measured here - the
  fallback instrument that would read it was not needed).
- **Propagation, measured**: three probes against three controls read
  `high` / `low` / `high` in lockstep with the session (W1=E0, W2=E1,
  W3=E0) - session effort propagates to a dispatched worker.
- **Frontmatter `effort:` key, measured**: the sub-agents docs
  (code.claude.com/docs/en/sub-agents) list `effort` (`low` to `max`) as
  overriding the session level, with no `inherit` value - omit the key to
  inherit. On 2026-09-29 (Claude Code 2.1.284, desktop host) a fresh session
  at `medium` dispatched `planner` (`effort: high`) and its `$CLAUDE_EFFORT`
  read `high`, so the key overrides the session and `$CLAUDE_EFFORT` is per
  worker. Two probes in the session that added the key read the session's
  `medium`, because the desktop host loads agent definitions once at
  session start, despite the docs' hot-reload note. The headless
  `claude.exe -p` cannot run a probe: it is not logged in on this host.
- An edit to `.claude/agents/*.md` takes effect in the next session, not the
  current one (the probe above).
- Model default effort is `high` on every model that supports effort, which
  is why a single `high` reading under a `high` session proves nothing;
  contrast levels must be `low` vs `high`.
- `set_session_effort` refuses the calling session and targets sessions, not
  subagents. The Agent tool has no `effort` parameter (2.1.284), so the
  orchestrator has no per-dispatch lever; the frontmatter key is per role.

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

Facts settled during measurement (`process-guards`, 2026-09-27), gate
credit, the local stack lock and the `.env` guards:

- `node -e "console.log(require('os').tmpdir())"` prints
  `C:\Users\Ignat\AppData\Local\Temp` from both the Bash and the
  PowerShell tool, so `stack-lock.mjs` uses `os.tmpdir()` with no
  fallback.
- `rtk npm run check` took 544 s wall clock (vitest 219 s, 1988 tests; the
  hook selftest 1016 cases) and ended with `gate credit: armed (npm run
  check exited 0)`. `.check-cache.json` then held `by: "exit"` and a key
  equal to `treeKey()`; the observer also said PASS and kept that record.
  The first run failed at `format:check`: Prettier checked the new
  `.claude/.check-pending.json`, which `.prettierignore` now lists.
- Under a hand-written foreign JSON lock (root `C:/probe`, no pid), `npm run
  check:db` printed the holder and `check:db: BUSY` and exited 3 within
  seconds, and the lock's SHA-256 did not change. The observer said
  nothing: the failed call did not reach it, as for every failed call on
  this host. `npx supabase db reset --local` from the PowerShell tool was
  denied by rule 2u, naming the holder. `npm run restore:drill` failed with
  the holder in its `FAIL:` line and `cleanup: ... the drill stopped before
  the local stack`, and left the lock unchanged.
- `npm run check:db` with no lock took 517 s wall clock (the suite 437 s,
  216 tests), printed `gate credit: armed (npm run check:db exited 0)`
  before `check:db: PASS`, and left no lock file.
- The `permissions.deny` edit of `.claude/settings.json` passed the
  permission classifier without a prompt and took effect in the session
  that saved it: a Read of a missing `.env.<name>` at the root was refused
  ("denied by your permission settings"), while a Read of another missing
  file said "File does not exist". The probe used a missing file, so no
  value could reach the transcript. `cat` of the same missing file was
  denied by rule 2t.
- The `./` Read deny binds the session's working directory. A
  `general-purpose` agent with `isolation: worktree` (cwd
  `.claude/worktrees/agent-<id>`) used the Read tool on missing files only:
  the relative `.env.process-guards-probe` answered "File is in a directory
  that is denied by your permission settings."; the absolute
  `E:\dev\daggerheart-loot\.env.process-guards-probe` and
  `E:\dev\daggerheart-loot\supabase\.env.process-guards-probe` answered
  "File does not exist." - the same answer as the control
  `E:\dev\daggerheart-loot\.no-such-file-process-guards-probe`. So the deny
  did not reach an absolute path into another checkout; `read-guard.mjs`
  does, but only in a worktree cut from a commit that carries it (P3
  below).
- The Write of `.claude/agents/reviewer.md` (the `Write` tool added, the
  `permissionMode` line removed) and the two new `PreToolUse` entries in
  `.claude/settings.json` passed the permission classifier without a
  prompt, in an implementer subagent, 2026-09-27.
- P1, the `Agent` matcher, in a session started after the commit that
  added it: with a probe `plan.md` that declares `- Plan review: required
  before B1 (trigger: probe)` and no `reviews/`, an `implementer`
  dispatch was denied ("PreToolUse:Agent hook error: Blocked: ... requires
  a plan review before B1 ... seen: none ... (dispatch tool: Agent)").
  After a `reviews/plan-B1.md` from the template with `Verdict: approve`,
  the same dispatch ran.
- P2, the reviewer definition: a `reviewer` subagent wrote
  `issues/<id>/reviews/probe.md` with no permission prompt; its Write of
  `issues/<id>/notes.md` was denied ("the reviewer writes only its
  report, issues/<id>/reviews/<name>.md"); `git status --short` ran;
  `touch x` was denied ("the reviewer is read-only in Bash and
  PowerShell"). So the hook input's `agent_type` is `reviewer`, the
  agent's name.
- P3, before the push: a `general-purpose` agent with `isolation:
  worktree` read the missing `E:\dev\daggerheart-loot\.env.process-guards-probe`
  by absolute path and got "File does not exist." - the control's answer,
  no deny. Measured: the worktree was cut from `origin/main` in the probe
  (HEAD `d0acbe13`, not the local unpushed commit), and its tree had no
  `read-guard.mjs` or `agent-guard.mjs`. The cause is inferred, not
  measured: either the relative hook command (`node
  .claude/hooks/read-guard.mjs`) ran the worktree's missing copy, and
  `node`'s exit 1 does not block, or the agent loaded the worktree's
  `.claude/settings.json`, which has no `Read|Grep` entry. Both vanish
  once the hook is on `origin/main`. In the same agent, `git log --oneline -1` (rewritten by
  the RTK hook) was refused by the worktree isolation guard ("a
  worktree-isolated agent's git operations must target its own
  worktree"); `pwd`, `git rev-parse HEAD` and `git grep` ran.
- Gate credit in live use: an implementer's foreground `rtk npm run
  check` (Bash timeout 600000) outlived the timeout and was moved to the
  background (vitest 217.50 s, selftest 1295 cases). It exited 0, printed
  `gate credit: armed (npm run check exited 0)`, and `.check-cache.json`
  held `by: "exit"`; the observer said the run could not be attributed,
  and the next `git commit --amend` passed the gate.

Facts settled during implementation (`persist-usage-monitoring`,
2026-09-27):

- The session's auto-mode permission classifier denied an implementer
  subagent's `npm run e2e` ("Modify Shared Resources": the hosted test
  project). The owner then told the orchestrator to run it, and it ran.
  Plan the hosted E2E as the orchestrator's step, with the owner's go.
- The same classifier denied an Edit that set `contents: write` in a
  workflow file ("Permission Grant", then "Security Weaken" for the retry),
  even as a temporary negative proof for `tests/derived.js`. A later Edit
  that added `actions: write` and `permissions: write-all` passed. Prove a
  `contents: write` pin on a copy of the text instead (a stdin `node`
  script that calls the pin's function).
- `postgres` (postgres.js) sends `${JSON.stringify(x)}::jsonb` as a JSON
  string, so the column holds a jsonb string, not an object; two
  `tests/db/usage.test.mjs` cases failed on it. Pass `${sql.json(x)}` (or `tx.json(x)`), as
  every `tests/db/` file and `tools/supabase/usage.mjs` do.

## Decisions registry

A decision is one file, `docs/decisions/<YYYY-MM-DD>-<slug>.md` (the slug:
at most eight lowercase words of the title), in the shape of
`.claude/templates/decision.template.md`. `docs/DECISIONS.md` is the index
that `tools/decisions.js` generates from those files; `edit-guard.mjs`
blocks a hand edit of it, and `tests/derived.js` ("decisions registry")
compares it with a fresh render and validates every file (name, heading,
`Task`/`Decision`/`Rejected`, both-way supersession pointers, the
15-line and 80-character caps on files dated 2026-09-26 or later, the
template, every quoted citation and every cited path). A label matches by
prefix, so the legacy `Decision (Q1 = B)` and `Rejected, Q1` count. The one
legacy entry with no rejected alternative carries `- Rejected: none
recorded.`, not a grandfather list: one rule, no list to drift, and the
marker is refused on a file dated 2026-09-26 or later. Four legacy entries
keep a status line after `- Task`, so that order rule, like the caps,
starts on 2026-09-26, and the index reads the status from every line.
Decision:
`docs/decisions/2026-09-25-decisions-are-one-file-each-under-docs-decisions.md`.

| Command | Effect |
|---|---|
| `node tools/decisions.js` | Rewrites the index from the files on disk. |
| `node tools/decisions.js --split <path>` | Writes each inline `## <date> - <title>` entry of `<path>` to its own file (identity by title; `wrote`, or `rewrote` for a changed body), appends the missing mirror pointers and the `- Rejected: none recorded.` marker of a legacy file, then rewrites the index. It never deletes a file. |

Add a decision: copy the template to `docs/decisions/<date>-<slug>.md`,
fill it, run `node tools/decisions.js`, commit both. Supersede one: add
the status line to the older file, the mirror line to the newer one, run
the tool.

Resolve a conflict on `docs/DECISIONS.md` at a rebase or merge (both sides
added a decision): run `node tools/decisions.js`, then `git add
docs/DECISIONS.md`, then continue. The merge has already united the files
on disk, so the render is complete.

Resolve a branch that still carries inline `## <date> - <title>` entries
(cut before the registry):

1. Run `node tools/decisions.js --split docs/DECISIONS.md` on the
   conflicted file. New titles become files; an older entry whose block
   differs is overwritten and named `rewrote`.
2. Read each `rewrote` file with `git diff -- docs/decisions/`. A block
   the branch amended keeps the branch's text; a block the branch did not
   touch can revert a line the registry added (a status or pointer line),
   so put that line back with the Edit tool.
3. Run `node tests/derived.js`; expect no `docs/decisions/` failure.
   Every pointer quotes the full title, not a prefix; the test names each
   pointer to fix.
4. Run `git add docs/DECISIONS.md docs/decisions/`, then continue. Do not
   use `git checkout --ours/--theirs`: `bash-guard.mjs` denies it.

A merge driver was evaluated and not adopted. `merge=union` gives no
conflict but a silently wrong index (both sides' rows unsorted, and a
legacy side's whole file appended), and `.md` is exempt from the commit
gate. A custom driver needs a `git config` step in every clone, never
runs in GitHub's merge, and cannot render from the tree mid-merge, so it
would have to merge the two index texts by row; revisit that design only
when a session resolves the index conflict more than once per release.

Measured 2026-09-25 at `734794c4`, before the split: 107 entries written
in ten days (2026-09-16 to 2026-09-25), 12.4 body lines on average;
folding every entry to the old fifteen-line cap removed 22 of 1660 lines
(1.3%). `734794c4` and the `persist-2-lists` task's commit both
inserted entries at line 15 of the one file, a conflict on every
concurrent pair.

## Persistence era: decided now, activated at Phase 0

Moved here verbatim from `config-audit`'s plan at that task's retirement
(2026-09-16), because the decisions outlive the task that made them and a
rejected-options list is worth exactly as much as the next person's ability
to find it. Candidate row 42 points here.

Trigger for every row: **the start of persistence Phase 0**, which runs after
issue 47 closes at R0c (`DAGGERHEART-LOOT-PERSISTENCE-DESIGN.md`, sections
17.4 and 18, revised 2026-09-08). Not a date; not this task. Aligned with
17.4's table, not re-derived. A superseded contract is recorded in
a file under `docs/decisions/` (a decision, not a defect: `DEBT.md`'s sections are the
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
- The data dump's rows are `INSERT`, not `COPY`: the CLI runs `pg_dump
  --data-only --quote-all-identifier --role "postgres" --column-inserts
  --rows-per-insert 100000`, so each table is one or more `INSERT INTO
  "schema"."table" ("col", ...) VALUES (...), (...);` with up to 100000
  rows. It pipes the output through `sed -E 's/^\\(un)?restrict .*$/-- &/'`,
  so newer pg_dump's `\restrict` and `\unrestrict` lines arrive as `--`
  comments, and it ends the file with `RESET ALL;`. No `ON CONFLICT` clause
  (`db dump --local --data-only --schema auth,public --dry-run`, 2026-09-26).
- The first real restore drill (`npm run restore:drill`, 2026-09-26,
  artifact `backup-2026-09-26`, PASS, 12 tables matched; 159 s with a
  stack restart, 90 s warm): production's data dump holds rows in six
  `auth` tables - `users`, `identities`, `sessions`, `refresh_tokens`,
  `mfa_amr_claims`, `flow_state` - and each one's primary key is the single
  column `id` (`refresh_tokens.id` is `bigint`, the others `uuid`), read
  from the local catalog with Auth running. `identities` and `sessions`
  reference `auth.users` with `on delete cascade`; `refresh_tokens` and
  `mfa_amr_claims` reference `auth.sessions` with `on delete cascade`;
  `flow_state` has no foreign key. The load ran as `postgres`, which is not
  a superuser locally, and the dump's `SET session_replication_role =
  replica` passed with it; `supabase_admin` was not needed. No Auth skew:
  the pinned CLI's Auth image (`gotrue:v2.196.0`) had every column the
  dump names. `psql` prefixes an error with `psql:<stdin>:<line>:` only
  when it reads standard input as a file (`-f -`); without it, the line
  number is absent.
- `supabase start -x` with every service but the database and `gotrue`
  (so without `kong`) brings Auth up healthy, and `db reset --local`
  restarts it (2026-09-26).
- `supabase status -o json` names `ANON_KEY`, `PUBLISHABLE_KEY`,
  `JWT_SECRET` (HS256, a fixed local value), `SECRET_KEY` and
  `SERVICE_ROLE_KEY` only while Auth runs; with `gotrue` excluded it names
  `API_URL` and `DB_URL` alone (2026-09-27). The second answer applies to
  a stack started without Auth, for example by a checkout older than the
  current `LOCAL_STACK_EXCLUDES` after a run with it. The Realtime suite
  needs the anon key and the secret, so the `check:db` stack and the
  drill's stack are the same: the database, Auth, Realtime and Kong
  (`LOCAL_STACK_EXCLUDES`).
- With Realtime running, `db reset --local` applies a migration that makes
  a policy on `realtime.messages`, and restarts the realtime container
  itself; Realtime makes the day partitions of `realtime.messages` when it
  starts, and the first send after a restart was not delivered once
  (2026-09-27). `realtime.send` adds the message id to the payload as `id`.
- A hosted project's `realtime.messages` has no partition until Realtime
  starts for it, on a client's join. On the test project after the
  `persist-3-realtime` migration push, the list writes of `npm run e2e`
  left 0 rows and no partition (each send only warned); the first anon
  private join answered `CHANNEL_ERROR` with `MissingPartition` and made 5
  partitions, and the next e2e run left 55 `owner:*` and 15 `share:*`
  rows (2026-09-27). Read the count as `postgres` through
  `SUPABASE_DB_URL_TEST`; 0 rows with no partition means no client has
  joined yet, not a broken trigger. The app has no warm-up join: a send
  dropped for a missing partition had no subscriber to reach, and the first
  viewer pays one `down` and a rejoin about 2 s later, whose read covers
  the gap.
- The data dump carries the sequences it touches: with one fake
  `auth.refresh_tokens` row in the local stack, `db dump --local
  --data-only --schema auth,public` wrote `SELECT
  pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 1, true);`
  (2026-09-26). A restore that loads such a line into a live database
  lowers the sequence to the backup's value, so both restore commands
  wrap the load in a guard that sets it back to the higher of its value
  before the load and its column's highest value.
- `pg_dump --version` in `supabase_db_daggerheart-loot` is 17.6, the local
  server is 17.6, and `[db] major_version` in `supabase/config.toml` is 17
  (2026-09-26). `pg_dump` refuses a server of a newer major version, so
  the safety backup of `restore:prod` fails before any write when
  production's major version passes the local image's.
- The `check:db` stack ran without the Auth container until
  `persist-3-realtime`. Started that way
  after a run with Auth (the volume kept), its `auth` schema held every
  table the drill found in production (`identities` and `sessions`
  included), `auth.refresh_tokens` had `instance_id`, `id` (`bigint`,
  sequence `auth.refresh_tokens_id_seq`), `token`, `user_id`, `revoked`,
  `created_at`, `updated_at`, `parent` and `session_id`, and `auth.users`
  had `instance_id`, `id`, `aud`, `role`, `email`, `created_at` and
  `updated_at` among its columns (2026-09-26). The restore fixtures in
  `tests/db/fixtures/` name only those early columns, so they load on a
  database image's baseline too.
- `db push` takes `--db-url` (percent-encoded), `--dry-run`, `--include-all`,
  `--skip-vault` and the global `--yes`. `db reset --version <timestamp>`
  resets up to that migration, so `--version` is not always the CLI's
  version flag (`db reset --help`, 2026-09-25).

| Command | Who runs it | What it does |
|---|---|---|
| `npm run config:diff -- --project test\|prod [--env-file <path>]` | anyone; an agent only against `test` | read-only diff of `config.toml` against the project; prints `drift: none (N not-owned)` or `drift: N`, exits 2 on drift |
| `npm run config:push -- --project test\|prod [--env-file <path>]` | the owner, in an interactive terminal | refuses without a TTY; for `prod` refuses while an `env(...)` name is unset; diffs, asks for a typed `yes`, then runs `config push` with the CLI's own prompt |
| `npm run db:push -- --project test [--yes]` | the owner; an agent only after an approving report under `issues/*/reviews/` whose `Reviewed:` commit has `HEAD`'s `supabase/migrations` tree (rule 2r; `docs/decisions/`, 2026-09-27, "An agent pushes migrations to the test project only after an approving review"); `--yes` needs `SUPABASE_DB_PASSWORD_TEST` | the manual path beside CI's `migrate-test`; refuses on a migration pairing error; dry run, then `db push` (a typed `yes` without `--yes`); records nothing. It keeps `db push`, so it refuses while another branch's migration sits on the test project; CI's `migrate-test` is the path then |
| `npm run db:push -- --project prod` | the owner, in an interactive terminal | the fallback while CI's `migrate-prod` is broken; refuses without a TTY, and refuses `--yes`; dry run, typed `yes`, `db push`; records nothing |
| `npm run limits:set -- --project test\|prod --user <email\|uuid> --key <key> --value <n>\|--default\|--clear\|--unlimited` | an agent only against `test` (rule 2n); `prod` the owner, in an interactive terminal | sets or removes one user's override of one count limit over `SUPABASE_DB_URL` from the environment; refuses a string that is not the named project's, a key not in `limit_defaults`, and a user that is not exactly one row; prints `before:` and `after:` (`200`, `unlimited`, `default 50`). `--clear` is `--default`: it deletes the override |
| `npm run check:db` | anyone (Docker; PowerShell on Windows) | layer 3 against the local stack |
| `npm run restore:drill [-- --backup <YYYY-MM-DD\|run id> \| --safety <stamp>]` | anyone, an agent included (Docker, `gh`, the key; PowerShell on Windows) | loads a backup (the newest by default) or a safety backup into the local stack, compares the rows and resets; a PASS writes the receipt that `restore:prod` needs ("Run the agent drill") |
| `npm run restore:prod -- --backup <YYYY-MM-DD\|run id> \| --safety <stamp>` | the owner, in an interactive terminal (rule 2n denies it for agents) | refuses without a TTY and without a receipt of the same source; takes an encrypted safety backup, wants the typed production ref, restores production in one transaction and verifies ("Restore production (owner)") |

The env file defaults to `supabase/.env` (gitignored by the root `*.env`
rule); its values reach the CLI's environment and are never printed. Agents
write to the test project only (owner decision 2026-09-25; `docs/DECISIONS.md`,
"Agents may write to the test project; production is CI's or the owner's"):
`bash-guard.mjs` rule 2n allows a `db`, `migration` or `config push`
command whose target is provably the test project and denies production,
`--linked` and every target a command does not name. `db:push --project
test --yes` passes `SUPABASE_DB_PASSWORD_TEST` to the CLI as its own
`SUPABASE_DB_PASSWORD`, in the child's environment only. On the owner's
Windows host `SUPABASE_DB_PASSWORD_TEST` is in the gitignored
`.env.test.local` (owner, 2026-09-26), not in the shell environment; the
wrapper does not read the file. Pass it with `node --env-file=.env.test.local`
or a parser, never `. .env.test.local`: a line that is not shell syntax
prints part of its value in the error (2026-09-26). `bash-guard.mjs` rule
2t denies a dot-source, `source` or a file printer on a `.env*` file, and
`.claude/settings.json` denies the Read tool on `./.env`, `./.env.*`,
`./supabase/.env` and `./supabase/.env.*` (a Read deny also covers Edit and
Write of the path); `node --env-file=<file>` stays the way to load one
(`docs/decisions/`, 2026-09-27, "Agents read no .env file; the program
loads it with `--env-file`").

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
from CI as steps of `e2e` and `deploy`", amended by "CI applies the test
project's migrations file by file and ignores other branches' versions"):
`migrate-test`, the first step of every `e2e` run, runs
`tools/supabase/migrate-test.mjs`, which applies the pending migrations to
the test project file by file - each file and its history row in one
transaction, oldest first - and lists, without failing, a history version
that no local file names (another branch's migration). It refuses a
connection string that is not the test project's (`dbUrlProject` in
`tools/supabase/lib.mjs`). A migration that must run outside a transaction
(`create index concurrently`) is not supported by it; none exists. The
`migrate-prod` job applies them to production with `db push` at the push of
`main`, before `deploy` builds. A `skip_e2e` dispatch runs no
`migrate-test`, so `migrate-prod` first runs
`tools/supabase/pending-check.mjs` against production and stops when a
migration file's version is not in its
`supabase_migrations.schema_migrations`. The database is the applied
record; no file lists applied migrations, and `edit-guard.mjs` and rule 2p
lock a migration that any remote-tracking ref holds, after a fetch.
The history rows that `migrate-test` writes hold a version and a name and
no `statements` (`tools/supabase/db.mjs`), so `supabase migration fetch`
against the test project writes empty files; never fetch migrations from it.

**Expected Security Advisor warnings.** On both projects after R5's
`migrate-prod` (2026-09-26) the Security Advisor reports 0 errors, 9
warnings and 2 info. Eight warnings are the execute grants of seven
SECURITY DEFINER functions: seven executable by a signed-in user, and
`get_shared_list` also by `anon`; the reasons below:

| Function | Reason |
|---|---|
| `delete_account` | Deletes the caller's `auth.users` row, which the caller may not touch; the user is always `auth.uid()`. |
| `reorder_list` | Rewrites every position of the caller's list in one statement; it checks the owner itself. |
| `create_list_share`, `revoke_list_share` | `list_shares` has no insert or update grant; a share changes only through them, and they check the owner. |
| `get_shared_list` | Returns the projection to whoever holds the token, never the table. It is also executable by `anon` for the anonymous shared page: a second warning. |
| `clone_shared_list` | Copies a list that the caller reaches only through the token. |
| `move_legacy_list` | Moves a browser list whole, past the count limits (`docs/specs/DEBT.md` D62). |

The ninth warning is leaked password protection, which is off because there
is no password sign-in (Google and Discord only). `apply_list_writes` is
`security invoker` and adds none. After R11's `migrate-prod` the report is 0
errors, 9 warnings and 3 info. The three info are "RLS enabled, no policy"
for `limit_defaults`, `user_limit_overrides` and `usage_snapshots`, by
design: no Data API role reads them. A warning that is not in this list stops
the release until a review accepts it and adds it here with its reason.

**The local stack lock.** One local Supabase stack serves every checkout on
this host, and `npm run check:db` and `npm run restore:drill` reset it.
Both take the lock `dhloot-local-stack.lock` in the OS temporary directory
(`C:\Users\Ignat\AppData\Local\Temp` from both the Bash and the PowerShell
tool, measured 2026-09-27) through `.claude/hooks/stack-lock.mjs`
(`docs/decisions/`, 2026-09-27, "The Supabase scripts take the local stack
lock themselves"). The body is JSON: `task` (`DHLOOT_TASK`, else the most
recently touched `issues/<id>/`, which can name another task - `branch` and
`root` identify the holder), `branch`, `root`, `pid`, `host`, `command`,
`at` and a `nonce`; the file is created exclusively, and a release deletes
it only when its `nonce` matches. A lock is stale 45 minutes after its `at`
(a hand-written lock: after its mtime), or when its `pid` on this host is
gone (`ESRCH`); a stale lock is taken over. Under a fresh lock `check:db`
prints the holder and `check:db: BUSY` and exits 3 (the observer says BUSY
and arms nothing); the drill fails with the holder in its failure line;
both touch nothing. The drill takes the lock after its Docker and key
checks and releases it after its final reset. `bash-guard.mjs` rule 2u
refuses a manual command that starts, stops or resets the local stack
while another checkout holds the lock. Run `npm run check:db` alone; a
PowerShell chain such as `$env:DHLOOT_TASK = 'x'; npm run check:db` is not
attributed by the observer ("Run a long check"), although the check's own
exit still arms the gate. `DHLOOT_STACK_LOCK` moves the lock file; only
the selftest sets it. Two limits are kept by design: two runs that take
over the same stale lock at once can both proceed (a small window), and
`tests/db/run.mjs` cannot release on a signal while `spawnSync` blocks;
the dead-pid check and the 45-minute staleness recover the lock.

**The hosted E2E and the deploy.** CI's `e2e` job runs `npm run e2e` (layer
4, `docs/specs/COVERAGE.md`, "Test layers") against the test project, and
`deploy` needs it. `migrate-test` applies the schema before every `e2e`
run. A red `migrate-test` step names the reason, most often the connection
string: `SUPABASE_DB_URL_TEST` and `SUPABASE_DB_URL_PROD` must be the
session pooler form (`aws-0-<region>.pooler.supabase.com`, port 5432, user
`postgres.<ref>`, the password percent-encoded, no query string - the tools
refuse one, because `user=` or `host=` there can move the target) -
GitHub's runners have no IPv6 and the direct `db.<ref>.supabase.co` host
answers IPv6 only, and the transaction pooler (port 6543) breaks `db push`.
The owner fixes the secret and re-runs the job. If `migrate-test` cannot
reach the session pooler through the `postgres` client at all, the named
fallback is `psql --single-transaction --variable ON_ERROR_STOP=1 --file`
per pending file plus its history row (ubuntu runners ship `psql`).

Where the secrets live: `SUPABASE_DB_URL_TEST` is a repository secret,
because every branch's `e2e` needs it. `SUPABASE_DB_URL_PROD` is a secret
of the GitHub Environment `production` (deployment branch `main` only, no
reviewers; `docs/DECISIONS.md`, 2026-09-25, "The production connection
string lives in an Environment limited to `main`"), read only by the jobs
that declare it - `ci.yml`'s `migrate-prod`, `backup.yml`'s `dump` and
`usage.yml`'s `report`. `SUPABASE_USAGE_TOKEN_PROD` is a secret of the same
Environment, read only by `usage.yml`'s `report` ("Usage monitoring").
`tests/derived.js` pins both secrets over every workflow file. A workflow
edited on another branch cannot read them. To create the Environment, or to rotate the string, the owner
follows the four steps below, in order.

1. GitHub, Settings, Environments: create (or open) `production`;
   Deployment branches and tags: "Selected branches and tags", add `main`;
   no required reviewers, no wait timer. Expected: the environment lists
   the rule `main`.
2. In that environment, add (or update) the secret `SUPABASE_DB_URL_PROD`,
   the session pooler form; remove a query string (for example
   `?sslmode=require`), if there is one. While a repository secret of the same name
   exists, the environment secret shadows it in a job that declares the
   environment. Expected: the secret is listed under the environment.
3. Push `main` (or re-run its latest `check` run) and watch `migrate-prod`
   run in the environment and `deploy` after it; then dispatch the backup
   once with `gh workflow run backup.yml` and watch `dump` run there too.
   Expected: both runs green.
4. Delete the repository secret `SUPABASE_DB_URL_PROD` (Settings, Secrets
   and variables, Actions), once, after the first green pair. Expected: the
   next runs of both workflows stay green.

When the test project
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

**The configured bundle budget.** `tools/bundle-budget.mjs` has two limits:
150 kB for the unconfigured build and 200 kB for the configured one, which
carries the account client chunk. `npm run check:built` builds `dist/`
unconfigured and so measures only the 150 kB limit. The 200 kB limit runs in
CI's `e2e` job, after `npm run e2e` leaves the configured build in `dist/`,
and in `deploy`. The lists release passed `check:built` locally and failed
this step in CI (run 36228323330). A batch that adds code to the app or to
`ports/supabase.ts` also runs this line from the repository root; it reads
the test project's two public values from `.env.test.local`, and `buildEnv`
drops every `E2E_*` name, the secret key included, before the build:

```text
node --env-file=.env.test.local --input-type=module -e "import { buildEnv } from './tests/e2e/lib.mjs'; import { spawnSync } from 'node:child_process'; process.exit(spawnSync('npm run build && npm run budget', { shell: true, stdio: 'inherit', env: buildEnv(process.env) }).status ?? 1);"
```

Expected: `within the 200 kB budget (with the account client chunk)`; 184.5
kB on 2026-09-27 with the Realtime client (182.2 kB earlier that day, 178.2
kB on 2026-09-26). `dist/` stays configured until `npm run build` or
`check:built` rebuilds it. Decision: "The bundle budget is 150 kB
unconfigured and 200 kB configured"; the slimmer client it no longer waits
on is still `docs/specs/DEBT.md`, D60.

Branch migrations on the test project: `migrate-test` runs on every
branch's `e2e`, so a migration that a branch pushed is in the test project
before `main` has its file. `db push` refuses such a history ("Remote
migration versions not found in local migrations directory"), so
`migrate-test` does not use it: it applies what the run's checkout has and
lists the other versions as "version(s) from other branches". The test
project's schema is then the union of every pushed branch, and `main`'s
runs stay green while a branch is open. `--include-all` does not help: it
covers a local file older than the remote's newest, never a remote-only
version.

An orphan is a branch migration that will never reach `main` (the branch
was abandoned, or the migration was renamed after its push - rule 2p and
`edit-guard.mjs` refuse both once the migration is on a remote ref). Its
objects stay on the test project and its version stays in every later
`migrate-test` list. Recovery, by the owner: run the branch's reversal file
(`supabase/reversals/<name>`) against the test project with `psql` and the
`SUPABASE_DB_URL_TEST` string, then `delete from
supabase_migrations.schema_migrations where version = '<version>'`; or
reset the test project. Expected: the next `migrate-test` log no longer
lists the version.

### Backups and restore

`.github/workflows/backup.yml` dumps production every night at 03:17 UTC
and on dispatch: `schema.sql` and `data.sql` (the `auth` and `public` rows),
each encrypted to the owner's `age` public key (the Actions variable
`BACKUP_AGE_RECIPIENT`) and kept as the artifact `backup-<date>` for 30
days. The private key lives in the git-ignored `.env.restore.local` at the
main checkout's root, as `BACKUP_AGE_IDENTITY`, so that an agent can run the
drill: `docs/decisions/2026-09-26-the-backup-key-lives-in-env-restore-local.md`,
"The backup key lives in .env.restore.local so an agent runs the restore
drill". `docs/DECISIONS.md`, 2026-09-25, "Production is
backed up nightly, encrypted to the owner's key, kept 30 days". The `dump`
job reads `SUPABASE_DB_URL_PROD` from the Environment `production`, so it
runs only on `main`; the four steps in "The hosted E2E and the deploy"
create or rotate that secret. GitHub
refuses to dispatch a workflow that is not on the default branch (`gh
workflow run backup.yml --ref <branch>` answered `HTTP 404: workflow
backup.yml not found on the default branch`, 2026-09-25), so a new
workflow file runs first on `main`. The first run on `main` (2026-09-25,
schema only, no user rows yet) took 74 s for the `dump` job and uploaded
an 11 KB artifact.

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

Steps 1-3 and 7 against the local stack are one command for anyone, an
agent included: `npm run restore:drill` ("Run the agent drill" below).

1. Decrypt the data file: `age -d -i <the owner's key file> -o data.sql
   data.sql.age`. The key file can be one that holds the value of
   `BACKUP_AGE_IDENTITY` from `.env.restore.local`. Expected: `data.sql`,
   plain SQL.
2. Start the local stack with Auth: `npx supabase start -x <list>`, where
   `<list>` is `LOCAL_STACK_EXCLUDES` (`tools/supabase/lib.mjs`, which
   no longer excludes `gotrue`), comma-separated; then `npx supabase db reset --local` (PowerShell on Windows). A
   production dump names the `auth` columns that hosted Auth migrated, and
   the database image's baseline lacks them. Expected: every migration
   applied.
3. Load the data locally in one transaction, after a truncate of every
   `public` table: the migrations seed `public.limit_defaults`, and the
   dump holds the same keys. Prepend `TRUNCATE TABLE "public"."<t1>",
   "public"."<t2>", ... CASCADE;` (every table of `select tablename from
   pg_tables where schemaname = 'public'`) to the file, then `psql
   "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
   --single-transaction --variable ON_ERROR_STOP=1 --file data.sql`.
   Expected: exit 0, and the rows are in the tables.
4. Load it into the test project: first `delete from
   public.limit_defaults` (it cascades to `user_limit_overrides`), because
   the dump's `limit_defaults` rows collide with the test project's; then
   the same `psql` command with the `SUPABASE_DB_URL_TEST` connection
   string (the session pooler, port 5432). Expected: exit 0.
5. Clean the test project: `delete from auth.users where id in (...)` with
   the user ids the dump holds; their `user_prefs` rows cascade. The E2E's
   member is not in a production dump. Expected: the E2E runs green again.
6. Load it into production, the owner only, after a drill of the same
   backup passed on this machine: `npm run restore:drill -- --backup
   <date|run id>`, then, in your own terminal, `npm run restore:prod --
   --backup <date|run id>` ("Restore production (owner)" below). Expected:
   the prompts for the connection string and the production ref, and the
   last line `restore:prod: PASS`.
   The manual fallback, when the command cannot run: on a project whose
   migrations match the checkout, one `psql --single-transaction
   --variable ON_ERROR_STOP=1` over `SUPABASE_DB_URL_PROD` with, in this
   order: `CREATE TEMP TABLE restore_seq_before ON COMMIT DROP AS SELECT
   '"auth"."refresh_tokens_id_seq"'::text AS seq, last_value FROM
   "auth"."refresh_tokens_id_seq";`; `TRUNCATE TABLE` of every `public`
   table `CASCADE`; `DELETE FROM "auth"."<t>" WHERE "id" IN (...)` with
   the ids the dump holds, children first - `flow_state`, `identities`,
   `mfa_amr_claims`, `refresh_tokens`, `sessions`, `users`; the file
   `data.sql`; then `SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"',
   GREATEST(COALESCE((SELECT max("id") FROM "auth"."refresh_tokens"), 1),
   (SELECT last_value FROM pg_temp.restore_seq_before)), true);`. A user
   created after the backup keeps the `auth` rows and loses the `public`
   rows. A new project gets its schema from the migrations (CI
   `migrate-prod`), never from `schema.sql`.
7. Delete the decrypted `data.sql` and `schema.sql` from every place they
   were written, after a restore by hand: the privacy pages promise that a
   backup lives 30 days. Expected: only the `.age` files are left.
   `npm run restore:drill` writes no plaintext file; its final database
   reset is its cleanup.

#### Run the agent drill

`npm run restore:drill` (`tools/supabase/restore-drill.mjs`) proves that the
newest nightly backup opens with the key and loads into the local stack
against the migrations. It runs on demand only; its target is the local
stack only, and it has no option for another target:
`docs/decisions/2026-09-26-the-restore-drill-loads-the-newest-backup-into.md`.

Prerequisites:

- Docker (Rancher Desktop) is running, and no other session uses the local
  stack: the drill resets the local database twice. The drill takes the
  local stack lock after its Docker and key checks and fails, naming the
  holder, while another run holds it ("Supabase configuration", "The local
  stack lock").
- `gh auth status` shows a login that can read this repository's Actions
  artifacts.
- `.env.restore.local` at the main checkout's root holds the line
  `BACKUP_AGE_IDENTITY=AGE-SECRET-KEY-1...` (the owner creates it once), or
  the variable is set in the terminal. The script finds the main checkout
  from a worktree too (`git rev-parse --git-common-dir`).

Steps:

1. Run `npm run restore:drill` in the foreground, through the PowerShell
   tool on Windows (Git Bash hangs on docker), tool timeout 600000.
   Expected: the last line is `restore:drill: PASS`, the `cleanup:` line
   says `temp files deleted, local database reset`, and the line before
   the verdict is `receipt: written for run <id>`.

Other sources: `npm run restore:drill -- --backup <YYYY-MM-DD>` drills the
newest successful `backup.yml` run of the last 30 whose unexpired artifact
is `backup-<date>`; `-- --backup <run id>` drills that run's artifact; `--
--safety <stamp>` drills a safety backup that `restore:prod` wrote to
`.restore-safety/<stamp>/` (the first line then reads `source: safety
<stamp>`). A PASS writes a receipt to `.claude/.restore-receipts.json` at
the main checkout's root: the source id (`run <id>` or `safety <stamp>`),
the SHA-256 of both decrypted files, the newest migration, the host and
the time. `npm run restore:prod` accepts a receipt
of the same source id and data hash, from the same newest migration and
host, for 24 h. The load keeps each sequence the dumped tables own from
moving down, as the production restore does, so the drill proves that
guard too.

The script takes the key, removes it from its own environment, and gives
no child process the variable. It starts the stack with Auth when the Auth
container is not running, resets the local database, downloads the newest
`backup-<date>` artifact of the last 10 successful `backup.yml` runs into a
temp directory, reads the two files into memory and deletes the directory,
decrypts in memory (`age-encryption`), pipes `TRUNCATE` of every `public`
table and the dump into `psql` inside the database container in one
transaction, compares each table's rows with the rows the dump holds
(`dumpRowCounts`), and resets the local database again. It prints counts
only; never a row, an email or a dump line. `psql` errors are reduced to
the SQLSTATE and the dump line.

The final reset removes the restored rows at the SQL level only. The load
writes them into Postgres data files and WAL in the local Docker volume,
and `db reset` does not scrub freed pages or recycled WAL segments, so row
bytes can stay on this host's disk until Postgres overwrites them. The
drill writes no plaintext file, and it does not scrub the volume. To
remove every trace, the owner deletes the volume (`supabase stop
--no-backup`, which also drops the local stack's data).

| FAIL line | Meaning | Action |
|---|---|---|
| `FAIL: Docker did not answer in 20 s.` | Docker is down | start Rancher Desktop, run again |
| `FAIL: the backup key is missing or malformed.` | no `BACKUP_AGE_IDENTITY` of the `AGE-SECRET-KEY-1` shape | the owner writes the file (prerequisites) |
| `FAIL: gh run list ...` or `FAIL: no backup artifact ...` | `gh` is signed out, or no successful backup run in the last 10 has an unexpired artifact | `gh auth login`; check `backup.yml` runs |
| `FAIL: the key does not open <file>.` | the key is not the pair of `BACKUP_AGE_RECIPIENT` | the owner checks the key |
| `FAIL: production has a table the migrations do not make` | the checkout is older than production's schema | update the checkout, run again |
| `load: FAIL SQLSTATE <code> at dump line <n> (<hint>)` | `psql` stopped; the transaction rolled back | `42703`: hosted Auth is newer than the pinned CLI's Auth image - upgrade the `supabase` devDependency |
| `  <table> <loaded> / <in dump> MISMATCH` | a table lost or gained rows in the load | a finding for the owner |
| `WARN: the newest backup is N days old` | the nightly backup may be failing | check `backup.yml` runs; the verdict does not change |

What a partial failure leaves behind:

| Where it stops | What is left | Recovery |
|---|---|---|
| Docker, key, `gh` or decryption | nothing decrypted; the temp directory is removed | fix the named cause, run again |
| The load (a `psql` error) | nothing: the transaction rolled back, and the drill resets anyway | read the SQLSTATE hint |
| A count mismatch | production rows in the local database until the drill's final reset | none |
| The final reset fails (`cleanup: FAIL`) | production rows in the local database | PowerShell: `node node_modules/supabase/dist/supabase.js db reset --local`, then `npm run restore:drill` again |
| The process is killed (tool timeout, closed terminal) | production rows in the local database; maybe encrypted files in `%TEMP%\restore-drill-*` | `npm run restore:drill` again (it resets first and deletes stale `restore-drill-*` directories), or the reset command above |

An agent runs the command and never opens, prints or searches the key file
(`bash-guard.mjs` rule 2q refuses a command that names it). The Read tool
is not guarded for it from a worktree: the user-global `Read(./.env.*)`
deny is relative to the session's project root, so a session in a
worktree is not covered for the main checkout's file. An agent never
writes production counts into a committed file, a handoff or a commit
message: the repository is public. It records the date, the artifact name,
the duration and "N tables matched".

#### Restore production (owner)

`npm run restore:prod` (`tools/supabase/restore-prod.mjs`) restores
production from a backup that a local drill of the same backup passed on
this machine. Only the owner runs it, in an interactive terminal: it
refuses without a TTY, and `bash-guard.mjs` rule 2n denies it for agents
in every spelling. Decision:
`docs/decisions/2026-09-26-production-restore-is-an-owner-run-command-gated.md`.

Prerequisites:

- A receipt of the same source under 24 h old, from this checkout's newest
  migration and this host: `npm run restore:drill -- --backup <date|run
  id>` printed `receipt: written for run <id>` and `restore:drill: PASS`.
- Docker with the local stack (the database container runs `psql` and
  `pg_dump`; the local database is not written), `gh` signed in, and the
  key as for the drill. A running `supabase_db_daggerheart-loot` container
  is used as it is; when it is down, the command starts the stack with
  Auth, as the drill does. It never restarts a running stack, so run it
  while no other session uses the stack.
- Production's migrations equal the checkout's (CI `migrate-prod` ran).
- The production session pooler string, ready to paste (the form in "The
  hosted E2E and the deploy"). It is never an argument, an environment
  variable or a file.

Steps:

1. Run `npm run restore:prod -- --backup <date|run id>` in your own
   terminal. Expected: the prompt `Paste the production session pooler
   connection string (not shown):`.
2. Paste the string and press Enter. Expected: `source:`, `target:
   migrations match`, `safety backup: <path>` and the table `rows
   (production now -> backup):`, then the prompt `Type the production ref
   to write production:`.
3. Read the rows. Type `zzmrftmzefcqehhyztjq` and press Enter to write
   production; anything else aborts. Expected: `load: ok (1 transaction)`,
   `verify: N tables match; sequences not lowered: ...`, the `undo:` line
   and `restore:prod: PASS`.
4. Check the limit keys in the production SQL editor. A backup older than
   a migration that seeds `limit_defaults` lacks that migration's keys
   (`20260928120000_purchase_requests.sql` adds `request_lines` and
   `pending_requests_per_list`), and every call that reads a missing key
   raises `unknown limit key`. Run
   `select key, value from public.limit_defaults order by key;`. Expected:
   `entries_per_list`, `lists_per_owner`, `pending_requests_per_list` and
   `request_lines`. For each missing key, insert it at its migration's
   default, for example `insert into public.limit_defaults (key, value)
   values ('request_lines', 100), ('pending_requests_per_list', 10) on
   conflict (key) do nothing;`, and run the check again.

Before it asks for the ref, the command checks the receipt, reads
production's migrations, tables, keys, foreign keys and sequences, and
takes a safety backup: `pg_dump` of production in memory, encrypted to
`BACKUP_AGE_RECIPIENT` (the command first proves the key on this machine
is that recipient's pair), written to `.restore-safety/<stamp>/` at the
main checkout's root (git-ignored). No plaintext file is written. Both
restore commands delete safety backups older than 30 days at start. After
the ref, one transaction keeps each sequence from moving down, empties
every `public` table, deletes the `auth` rows the dump holds by primary
key, children first, and loads the dump; then the command compares every
`public` table and each dumped key set with the dump. A user created after
the backup keeps the `auth` rows and loses the `public` rows.

The undo, after a PASS that was wrong: `npm run restore:drill -- --safety
<stamp>`, then `npm run restore:prod -- --safety <stamp>`. The safety
backup restores through the same path as a nightly one. The undo is exact
for `public` and for the `auth` rows the safety backup holds, but it only
adds and replaces `auth` rows: a user that the restore brought back (in
the backup, deleted from production before the restore) keeps the `auth`
row after the undo, with no `public` rows. Delete such a user by hand if
it must stay deleted.

The rehearsal: run the steps and answer the ref with anything else.
Production is read, a safety backup is written, nothing in production
changes, and the last line is `restore:prod: ABORTED`.

**Known limit.** Production keeps taking writes. A write between the
safety backup and the commit is in neither and is lost: run the restore at
a quiet time; the window is the time to read the rows and type the ref.

| FAIL line | Meaning | Action |
|---|---|---|
| `FAIL: run this in your own terminal` | no TTY | run it in your own terminal |
| `FAIL: no passed drill of <source> ... (receipt: <reason>)` | `none`, `older than 24 h`, `other data`, `other newest migration` or `other host` | run the drill command the line names, then again |
| `FAIL: the target's migrations are not this checkout's` or `the target lacks public.<t>` | production and the checkout differ | apply the migrations (CI `migrate-prod`) or update the checkout |
| `FAIL: the key on this machine is not the pair of ... BACKUP_AGE_RECIPIENT` | the safety backup would not open with the nightly key | the owner fixes the key or the variable |
| `FAIL: the connection string is not the production project` | the string names another project or has a query string | paste the production session pooler string |
| `FAIL: the safety backup failed: pg_dump failed: ... server version mismatch` | production's major version is newer than the local image's | upgrade the `supabase` devDependency and `[db] major_version` |
| `load: FAIL SQLSTATE 42501 ...` | the hosted `postgres` user may not run a statement of the load | production is unchanged; record the statement, see Risk R2 in the decision (no other role exists on the hosted project) |
| `load: FAIL SQLSTATE 42703 ...` | a column the backup names is missing in production | production is unchanged; apply the migrations or check hosted Auth |
| `load: FAIL psql exited with status <n>; no SQLSTATE was reported` | psql stopped without an SQL error (killed, network) | production state is unknown: compare the counts with a drill of the backup, and run the undo line if they differ |
| `verify: FAIL` and `MISMATCH` lines | the load committed and a count differs | run the undo line |

What a partial failure leaves behind:

| Where it stops | Production | Left on disk | Recovery |
|---|---|---|---|
| TTY, key, arguments, receipt, recipient, prompt, read checks | unchanged | nothing | fix the named cause |
| The safety backup | unchanged | nothing (a half directory is removed) | fix the cause (`pg_dump` version, network) |
| A wrong ref | unchanged | the safety backup | none; it is deleted after 30 days |
| The load, with an SQL error (a SQLSTATE, or psql's exit 3) | unchanged: the transaction rolled back | the safety backup | read the SQLSTATE |
| The load, without an SQL error | unknown: committed or not | the safety backup | compare the counts with a drill of the backup; the undo line if they differ |
| The verify, after the commit | restored, with a mismatch | the safety backup | the undo line |
| Killed after the load started | committed or not (one transaction) | the safety backup | compare by a drill of the backup and the counts; the undo if needed |

**Undo a deploy that carried a migration.** Revert the app change only, or
add a new migration whose body is the reversal file
(`supabase/reversals/<name>`). Never delete a migration file from `main`:
`db push` refuses a remote history that holds a version absent locally, so
`migrate-prod` would then block every later deploy. `ci.yml`'s "HOW TO UNDO
A BAD DEPLOY" comment carries the same rule.

### Usage monitoring

`.github/workflows/usage.yml` reports production's free-plan usage every
night at 03:47 UTC (30 minutes after the backup) and on dispatch. Its job
`report` runs in the Environment `production` and calls
`node tools/supabase/usage.mjs --project prod`. The pure half is
`tools/supabase/usage-lib.mjs`. Decisions: `docs/DECISIONS.md`,
2026-09-25, "Production's free-plan usage is reported nightly by its own
workflow", "The usage history is a table in production that the nightly
report writes" and "The free-tier keep-alive is the usage report's Data API
call, not the dump".

| Row | Source | Limit | Forecast |
|---|---|---|---|
| Database | `sum(pg_database_size(datname))` over `pg_database` | 500,000,000 bytes (read-only mode above 500 MB) | least-squares slope over the last 28 days before today plus today; at least 7 points |
| Storage | `sum((metadata->>'size')::bigint)` over `storage.objects`; 0 without the table; `null` and a `warn` row `no storage.objects access` when `postgres` may not read it | 1,000,000,000 bytes | as Database |
| MAU (estimate) | distinct users since the 1st of the month (UTC): `auth.users.last_sign_in_at`, union `auth.sessions` by `refreshed_at` (else `updated_at`); a lower bound; no source gives a `warn` row `no MAU source` | 50,000 | the month's rate so far; "resets first" when the crossing falls in the next month |
| Accounts, Storage objects | `count(*)` | none | growth a day |
| Realtime messages (24 h, lower bound) | `count(*)` of `realtime.messages` with `inserted_at` in the last 24 hours: one row per broadcast, delivered once per subscriber, so the billed messages are at least this many; 0 and a note without the table, `null` and a note when the role may not read it | none (the quota is 2 million a month, the dashboard's) | growth a day |
| requests | Management API `usage.api-counts?interval=1day`, summed per service: an egress proxy, never bytes | none | none |
| keep-alive | one Data API call a night (below) | none | none |

The summary also lists every `public` table by bytes with its exact row
count, and the owners and lists at 80 % or more of a count limit (and above
100 %, which `move_legacy_list` allows, `docs/specs/DEBT.md` D62). It holds
totals only: no email, id or list name, because the repository and its run
summaries are public. The public API has no endpoint for billed egress,
billed MAU, database size, Storage size or Realtime (2026-09-25); billed
egress and Realtime stay the owner's monthly dashboard look.

Thresholds (owner, 2026-09-26): `warn` at 50 % of a limit or under 60 days
left (a `::warning::` annotation); `fail` at 80 % or under 14 days left (a
`::error::` annotation and exit 1 after the summary). Other answers:

| Answer | Row | Run |
|---|---|---|
| no `SUPABASE_USAGE_TOKEN_PROD` | `requests: no token`, `warn` | green |
| HTTP 401 or 403 from the Management API | `requests`, `FAIL`: "the usage token is expired or lacks Usage Analytics read" | red |
| HTTP 429, 5xx, the 10 s timeout (the body read included), a body without `result[]` | `requests: unavailable (<reason>)`, `warn` | green |
| a keep-alive answer that is not 2xx, a network error, the timeout | `keep-alive: not reached (HTTP <status>)` or `(<reason>)`, `warn` | green |
| an SQL error or a refused connection | none: the error line | red |
| a failed snapshot save (for example read-only mode) | `usage: the snapshot was not saved: <message>` after the summary | red |

The history is `public.usage_snapshots`: one `jsonb` row a day, upserted on
`taken_on`, rows older than 400 days deleted; row level security on, no
policy and no grant to a Data API role; the nightly dump backs it up. A lost
history costs 7 nights without a forecast.

The keep-alive: a free project pauses after a week without "user database
activity", and the documentation does not say whether a `pg_dump` counts;
a Supabase collaborator confirms that Data API calls do. So the report posts
`get_shared_list` with a well-formed 43-character token that matches no
share, which reads `list_shares` and answers `null`. Only a 2xx answer is
"reached": a 4xx never reaches Postgres. The headers are `apikey` and
`Content-Type` alone, because the gateway refuses `Authorization: Bearer
a.b.c` with 403 `bad_jwt` and a publishable key is not a JWT. This command
proves the choice on the test project and prints only the result:

```text
node --env-file=.env.test.local --input-type=module -e "import { keepAlive } from './tools/supabase/usage-lib.mjs'; const r = await keepAlive({ url: process.env.E2E_SUPABASE_URL, key: process.env.E2E_SUPABASE_PUBLISHABLE_KEY, fetchImpl: fetch }); console.log(r.ok, r.status ?? r.reason);"
```

Expected: `true 200`. On 401 or 403, `keepAlive` must send `apikey` and
`Authorization: Bearer <key>`, as `supabase-js` does.

Log Query: `usage.api-counts` is a Management API log read, so it counts
against the organisation's Log Query allowance (Free: 100 GB scanned, not
billed; from 2027 an overage rate-limits log queries and cuts log
retention). One 1-day window a night is the smallest read that gives the
trend. Deleting the secret `SUPABASE_USAGE_TOKEN_PROD` turns the read off
with no code change.

Platform facts (supabase.com pricing, billing and usage pages, and the
Management API OpenAPI document `https://api.supabase.com/api/v1-json`,
read 2026-09-25):

- Other free-plan quotas: egress 5 GB uncached plus 5 GB cached
  (independent); Storage 1 GB is 744 GB-hours, time-weighted, while the
  report reads the current size; max upload 50 MB; Realtime 200 peak
  connections and 2 million messages a month; 500,000 Edge Function
  invocations; 2 active free projects. MAU is "distinct users who sign in
  or refresh their token during the billing cycle"; over quota on the free
  plan gives an email and a grace period.
- Pausing: "Free projects are paused after 1 week of inactivity"; Supabase
  emails about one week before; a paused project restores from the
  dashboard for up to a year
  (`https://supabase.com/docs/guides/platform/free-project-pausing`;
  staff: `https://github.com/orgs/supabase/discussions/38442`).
- Management API: `Authorization: Bearer <token>`, 120 requests a minute,
  30 for analytics. `usage.api-counts` lists no OAuth scope; the `interval`
  enum is `15min` to `7day` and its bucket width is not documented.
  `analytics/endpoints/logs` needs `analytics:read` and counts against Log
  Query; `database/query/read-only` (Beta) needs `database:read`.
- Personal access tokens: a classic token has the account's full access to
  every organization; a scoped token has only the chosen organizations,
  projects and permissions (Read or Read-write; "Usage Analytics" and
  "Logs" among them). The documentation maps no permission to an OAuth
  scope.
- GitHub emails a failed scheduled run to the user who created the
  workflow, or who last changed its cron or re-enabled it.

**Symptom.** GitHub emails that a `usage` run failed, or a run shows a
`warn` annotation.

**Diagnosis.** Open the run's summary: the `FAIL` or `warn` row names the
metric, the used percentage and the days left, or the check and its reason.

**Recovery.** A count limit: `npm run limits:set` for one user or the
default ("Supabase configuration"). The database or Storage: delete data,
or accept the growth and plan the paid plan. The token: repeat setup steps
2 and 3. A failed save in read-only mode: free space first; the summary is
the alert.

Owner setup, in order, after R11 is on `main`:

1. Confirm that `migrate-prod` applied the migration. Expected: the `check`
   run on `main` is green.
2. Create the token: supabase.com, Account, Access Tokens, "Generate new
   token", scoped: the organization of production, project
   `zzmrftmzefcqehhyztjq` only, permission "Usage Analytics" = Read,
   nothing else; the longest expiry the form offers; name
   `github-usage-report`. If the first run (step 6) reports 403, edit the
   token and add "Logs" = Read. Expected: the token string, shown once.
3. GitHub, Settings, Environments, `production`: add the secret
   `SUPABASE_USAGE_TOKEN_PROD` with the token. Expected: the secret is listed
   under the environment, not under repository secrets.
4. GitHub, your account, Settings, Notifications, Actions: "Only notify for
   failed workflows" with email on. Expected: the setting is saved.
5. Put the token's expiry date in your calendar, 14 days early. Expected: a
   reminder; on expiry the run fails with "the usage token is expired or
   lacks Usage Analytics read", and steps 2 and 3 rotate it.
6. Dispatch once: `gh workflow run usage.yml`, then open the run. Expected:
   a green run whose summary has three limited rows (Database, Storage,
   MAU), "forecast: n/a (1 of 7 days)", a requests line and "keep-alive:
   reached". `keep-alive: not reached (HTTP 401)` or `(HTTP 403)` is a header
   problem first (above), then a key that differs from the dashboard's
   publishable key. A Storage row `no storage.objects access` means
   `postgres` may not read `storage.objects`.
7. The next day, open the organization's usage page, Log Query, for the
   production project. Expected: the dispatch day is not visibly above the
   days around it. If it is more than 1 GB above them, delete the secret
   `SUPABASE_USAGE_TOKEN_PROD`; the report then shows `requests: no token`.
8. Re-run the Security Advisor on production. Expected: 0 errors, 9
   warnings, 3 info ("Expected Security Advisor warnings").
9. After seven nights, open the latest summary. Expected: a forecast on the
   Database row.

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
| 19 | Restrict the planner to writing under `issues/<id>/` using `agent_type` | `PreToolUse(Edit\|Write)` | **reject, top deferred candidate** | Fully enforceable in principle and a real failure mode. But `agent_type`'s value strings are unverified on this host: a wrong string either never fires (useless) or blocks a legitimate writer (harmful). The cheaper instrument is agent frontmatter. Since `process-guards`, `edit-guard.mjs` and rule 2s read `agent_type` for the reviewer, and P2 measured the value as `reviewer`, the agent's name ("Facts settled during measurement (`process-guards`, 2026-09-27)"). |
| 20 | Require `npm run check:built` when a screen changes | `PreToolUse(Bash)` | **reject** | "Alters what a screen draws" is judgment, not a path test. CLAUDE.md's `check:built` rule keeps it, and a hook must not pretend to enforce it. |
| 21 | Enforce the per-file coverage threshold | `PostToolUse(Write)` | **reject** | Already enforced by `vite.config.mts` at the real moment. A second copy would say nothing new. |
| 22 | Inject the active task on every prompt | `UserPromptSubmit` | **reject** | Duplicates `SessionStart` on every single turn. The definition of the noise the human warned against. |
| 23 | Preserve a handoff pointer across compaction | `PreCompact` | **reject** | `Stop` and `SessionStart` already bracket the session; a third copy of the same pointer earns nothing. |
| 24 | Anything reading the five-hour usage window | any | **reject** | Measured impossible on this host (`79e26c9`). Explicitly out of scope. Also rejected: an autonomous usage guard summing `message.usage` from the transcript - it measures the session's own spend, not the account's shared five-hour window, so it cannot stand in for the thing being asked about. |
| 25 | Block edits to `docs/fixtures/**` as "generated" | `PreToolUse(Edit\|Write)` | **reject** | They look generated but CLAUDE.md requires updating them by hand in the same commit as a contract change. Blocking them would block the correct fix. Listed here because it is the tempting mistake in hook 4. |
| 26 | `SessionEnd` bookkeeping | `SessionEnd` | **reject** | Cannot influence the model or the human in time. `Stop` already covers the moment that matters. |
| 27 | Block `npm run check` launched with `run_in_background` | `PreToolUse(Bash)` | **adopt** | Three workers on issue 47 backgrounded the check, the third with three paragraphs of dispatch warning against it; prose is exhausted. False-positive-free: `check-observer.mjs` refuses a backgrounded run by design, so one can never satisfy the gate, and blocking it forbids nothing that works. Scoped to the gate-feeding check only - `check:built`, parity and run-all can legitimately run detached from a main session, and the reminder already covers them. Matched per segment, because the recorded shapes were piped, chained, `cd`-prefixed and file-redirected. The message names the replacement in one line, including the Bash timeout. Measured 2026-09-10: `PreToolUse(Bash)` fires for a backgrounded call and denies it (probe A); `tool_input.run_in_background` reaches the hook as `true`. **Narrowed to a subagent at `process-guards`** (2026-09-27): a backgrounded check now arms the gate by its own exit (`docs/decisions/`, 2026-09-27, "A green check arms the commit gate by its own exit, not a host-wide lock"), so only a subagent's run, which dies with its turn, is denied. |
| 28 | Block a heavy run while a parity run is alive, via a lockfile `tests/parity.js` writes | `PreToolUse(Bash)` | **adopt** (bundled with #27 by owner decision, 2026-09-10) | #15's deferred alternative. The input problem #15 rejected on is gone: the run itself writes the lock, so the hook stats one file instead of enumerating processes, and a human's terminal run is seen too. The stale-lock false positive is closed by liveness (`process.kill(pid, 0)`, no `tasklist`) plus a heartbeat TTL - a dead pid or a stale heartbeat is ignored, so the rule can only fire on a run that is actually alive, and a second heavy run beside it produces garbage, so the block forbids nothing that works. `parity.js` also refuses to start over a live lock, which covers parity-vs-parity with no hook in the loop. Fifteen peers on one tree make the overlap a matter of when. Known gaps, recorded above: the vitest-alive side is invisible; a container run is invisible; on Windows a crashed run's pid can be reused inside the TTL, which the message answers with "delete the lock". Measured 2026-09-10 (probe B): a live lock denies, a dead-pid lock does not. **Retired at R0c `23c00a6`**: `tests/parity.js` and `tests/parity/lock.js` are both deleted, and nothing replaced the writer - see "One heavy run at a time" above. |
| 29 | Report HEAD moving under a session | `PreToolUse(Bash)` on `git commit`, or `Stop` | **reject for now** | Nothing collided in the recorded case; the prose that owns it ("Your writers are not the only writers", `3541a23`/`e5a26a2`) is one day old and has not been given a chance to fail, and the standing bar is a repeated mistake. Not `PreToolUse(Task)`: the dispatch tool is `Agent` on this host and `Task` in the reference, an unverified matcher (#19-shaped). Not `UserPromptSubmit`: #22. If the prose fails once, the cheapest deterministic form needs no unverified input: `session-start.mjs` records the HEAD sha in the session's `.hook-state.json` entry; `bash-guard.mjs`, on a `git commit` segment it already parses, compares `git rev-parse HEAD` against it and speaks (never denies) "HEAD moved since this session started: X -> Y, N commits not yours - `git log --oneline X..Y`; your commit lands on top, record Y as the base in the handoff"; `check-observer.mjs` refreshes the stored sha after the session's own commit. |
| 30 | Accept a leading `set -o pipefail` in the observer's attribution rule, and make the canonical invocation carry it | `PostToolUse(Bash)` (attribution only) | **adopt** (owner decision, 2026-09-10) | The recommended pipe reports `tail`'s status, so a failed check comes back with no exit line and reads as a pass; twelve check runs across five sessions were spent learning the status a second way. With the prefix the tool prints `Exit code 1` on a failed check, `check-observer.mjs` sees `exit_code: 1` and refuses to arm, and the worker reads one line. Forgery: `set -o pipefail` writes nothing to stdout, so the check stays the only stdout producer; the strip removes exactly the tokens `set -o pipefail` plus one `;` or `&&` at the start, on either side of the `cd` strip, and nothing else, after which every existing refusal applies unchanged. `set -o pipefail; echo "All files"`, `set -o pipefail; npm run check > o.txt 2>&1; grep "All files" o.txt`, `set -o pipefail; true; npm run check ...`, `set -eo pipefail; ...` and `set -x; ...` are all still refused. A forger gains nothing: omitting the prefix is today's state, and with it the exit code only tightens the gate. Measured 2026-09-10 on the Bash tool. |
| 31 | Deny a foreground `npm run check` with no `timeout` (rule 2g, second trigger) | `PreToolUse(Bash)` | **reject for now**, sketched | The tool moves a call that outlives its timeout to the background instead of killing it, the default is 120 s, and the check is ~165 s healthy, so a check call without a `timeout` cannot finish in the foreground on this host and is lost exactly as a backgrounded one is - measured once (`8ba57351` afff seq 57). But the number was undocumented until now: B1 puts it in the 2g deny message, the 2f reminder, the README, `CLAUDE.md` and the implement prompt, and the deny message arrives at the exact moment a worker retries in the foreground. That prose has not been given a chance to fail, which is the standing bar (row 29). And the deny has a failure mode of its own: it must fire on an *absent* field, so a host that stops passing `tool_input.timeout` to hooks would deny every foreground check - loud and diagnosable, but the one thing a guard must not do. The sketch, so it is a copy-paste when this is built: the no-timeout deny fires on `run_in_background === true` OR `timeout` undefined/null, with a non-number non-null `timeout` (e.g. the string `'600000'`) counting as present so an unknown host shape leaves the rule inert; `bashPayload` gains `timeout: extra.timeout === null ? undefined : (extra.timeout ?? 600000)`, spread only when defined; the adoption probe is a foreground check with and without a `timeout` - both denied means the field is not passed, do not ship. Scope boundary if it is built: never a numeric threshold ("under 300000") and never extended to `check:built`/vitest/run-all - a number is a choice, not a measurement, and those families do not feed the commit gate. |
| 32 | The observer speaks its verdict (armed / not armed and why) | `PostToolUse(Bash)` | **reject** | Tempting and cheap. But the only recorded reads of `.check-cache.json` are issue 65 verifying its own hook, and once the exit code is the check's (row 30) the worker has the status. No evidence; the observer stays silent by design. |
| 33 | Speak on `echo $?` as the first command of a call | `PreToolUse(Bash)` | **reject** | Two occurrences, both inside one session; row 30 removes the reason to ask. One README sentence instead. |
| 34 | A hook for a result over the output cap | any | **reject** | The size is unknowable before the run, and the tool already persists the full output and names the file. The failure is re-running instead of reading it: the reminder gains one clause and the README one sentence. Parity's one-line-per-page diff text is the producer; shortening it is a `tests/` change with diagnostic cost, not this task's. |
| 35 | Deny `SendMessage` to a writer while another writer is live | `PreToolUse(SendMessage)` | **reject** | The input does not exist in a hook: liveness and role come from `ListAgents`, which a hook cannot call - it gets stdin JSON and nothing else. The matcher is unverified on this host (`tool_name` for `SendMessage` has never reached a hook here; #19/#29-shaped). Zero recorded failures; the standing bar is a repeated one. The prompt's "a resume is a dispatch" sentence owns it. |
| 36 | Deny the reviewer any `SendMessage` (write-by-proxy) | agent frontmatter `disallowedTools`, not a hook | **reject for now**, sketched | The cheaper instrument exists (row 19's argument): one frontmatter line in `reviewer.md`. But `disallowedTools` is unverified as a key this host honours, `SendMessage` is not in a subagent's default tool list so sending needs a deliberate `ToolSearch` load - a guard against habit and haste has no habit to guard here - and the failure has never been recorded. If a reviewer ever sends: add `disallowedTools: SendMessage` (or the key the host documents) under `permissionMode: plan` in `.claude/agents/reviewer.md`, and verify with a probe that the reviewer's `ToolSearch select:SendMessage` then returns nothing. Since `process-guards` the reviewer has no `permissionMode`; the review prompt still forbids the send. |
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
| 41 | Reviewer `tools:` allowlist (`Read, Grep, Glob, Bash`) | agent frontmatter | **adopt** (`config-audit` B2) | Read-only posture becomes deterministic instead of prose plus `permissionMode: plan`; Edit/Write/NotebookEdit/Agent/ToolSearch drop out, which also closes row 36 (no `ToolSearch`, no `SendMessage`). Bash stays for `git status`/`diff`/`log` and focused checks. **Probed 2026-09-16 on this host: enforced.** A dispatched reviewer reported exactly `Read`, `Grep`, `Glob`, `Bash` and no others; `Edit`, `Write`, `NotebookEdit`, `Agent`, `ToolSearch` and `SendMessage` were all absent, which closes row 36 in fact and not only on paper. Two limits on what the probe establishes: it covers the tool allowlist only - `permissionMode` is not observable from inside a subagent without performing an action the probe forbade, so that half stays unverified; and `Bash` in the allowlist means the read-only posture still rests on the reviewer prompt and the permission settings, since a shell redirection writes. The allowlist is not by itself a read-only guarantee. Since `process-guards` the allowlist also has `Write` for the report, and rule 2s with `edit-guard.mjs`'s reviewer rule is the read-only guarantee the allowlist is not. |
| 42 | Persistence-era guards: RLS gate, migration-reversibility gate, applied-migration `edit-guard.mjs` rule, gitleaks-on-commit, one session per shared database | gates, `edit-guard.mjs`, `bash-guard.mjs`, `CLAUDE.md` | **installed 2026-09-24** | Installed by `persist-0-foundation`: `npm run check:db` with the reversibility gate, rule 2m, rule 2l (gitleaks), the applied-migration `edit-guard.mjs` rule, the hosted-write rule 2n, and the `CLAUDE.md` sentence; design and status in this file's "Persistence era: decided now, activated at Phase 0" section. |
| 43 | Deny `grep -n` and `tail -c` (readers that bypass RTK) | `PreToolUse(Bash)` | **adopt** (`config-audit` B3) | Measured 2026-09-16: 198 sessions / 20,710 Bash commands over thirty days; ~281.4K tokens missed over 1,052 commands; `grep -n` 342 calls / ~117.6K and `tail -c` 159 / ~40.8K, together 158.4K of 281.4K = 56.3%, over half, in two commands. RTK's hook rewrites only at line start, so the miss is the piped, `$(...)` and `cd`-prefixed shapes prose has not moved. Matches the program token only, so `echo`, `git grep -n` and `rtk grep -n` are untouched; a line-start `grep -n` that RTK would have rewritten now costs one retry, the accepted price. Not `npm run check` and never `rtk npm run check`: the commit-gate trap this exemption once needed explaining for is superseded by row 45, which arms the gate directly on `rtk npm run check`. Fallback if the retry proves noisy: exempt a single-segment, single-line shape - record here, do not delete the row. **Narrowed twice at `rtk-coverage` B1** (first cut, then corrected on remediation against a direct probe): a bare leading `grep -n foo path` denied that exact shape RTK rewrites cleanly, so denying it earned nothing but a wasted round trip before the model took the offered escape to the Grep tool (103 such calls across the sampled transcripts) - net effect strictly worse than no rule. The first cut's own replacement boundary ("piped, substituted, or chained") was itself wrong and is not what shipped - it treated every pipe stage and every chain position alike, which a direct probe of the installed `rtk 0.48.0` (`rtk hook check "<command>"`, reproducible) disproved on both counts. **Measured boundary, pinned to `rtk 0.48.0`** (full table: this file, "Facts settled during measurement (rtk-coverage, 2026-09-18)"): `grep -n` rewrites on a bare command, an env-var prefix, and on either side of `&&`/`;`/`&`/a leading `cd` - a list operator never blocks it - and inside a pipe (`|`, never `||`) only as that pipe's own FINAL stage (`cat f | grep -n x` rewrites; `grep -n x | wc -l` and a pipe's middle stage do not); it never rewrites inside `$(...)`/backtick, or wrapped by `xargs`/`nohup`/`time` (not `env`/`command`, which are transparent, but `unwrap()` cannot tell the two groups apart so both are treated as blocking - a same-cost-as-before false deny for the transparent two, never a false allow). `tail -c`/`--bytes` gets none of `grep`'s exemptions - measured never rewritten in any position, pipe or chain, because `rtk read` has no byte-offset mode at all (only `--tail-lines`, which is why `tail -n` is unaffected by this rule) - so it denies unconditionally once matched. The deny messages point at restructuring into a standalone `rtk grep -n` / `rtk read`, not at the Grep/Read tool. |
| 44 | Warn when a task document is past its size budget | `Stop` | **adopt** (`config-audit` B3) | Measured 2026-09-15: issue 47's `plan.md` 1,031 KB (57.7% shipped-batch briefs), `handoff.md` 523 KB (96% of Status superseded snapshots), `context.md` 227 KB, growing 350-1,400 lines per working day, read by every worker at dispatch. Warn, never block: a Stop hook that blocks session-end is worse than a large file. Scoped to the session that wrote into the directory, deduped per state. The procedure and the never-drop / always-drop lists live in `.claude/skills/handoff/SKILL.md`. Rejected: a `PreToolUse(Write)` size deny (blocks the closeout write that fixes it); a `SessionStart` notice (the writer is who needs it). |
| 45 | Accept a leading `rtk ` in the commit gate's check-invocation regex, `check-observer.mjs`'s normalizer, and the two `LONG_CHECKS` regexes for `check`/`check:built`; retire the piped canonical form in favour of `rtk npm run check` | `PreToolUse(Bash)` (gate + reminder), `PostToolUse(Bash)` (observer) | **adopt** (`rtk-coverage` B1) | Live probe (this task): a `PostToolUse` hook receives RTK's already-rewritten command, not what the model typed - `cat package.json` logged as `rtk read package.json`. Since RTK silently rewrites a bare `npm run check` to `rtk npm run check`, and `CHECK_INVOCATION_RE` was anchored at `^npm`, the gate could never arm on a bare invocation; only the piped form (`set -o pipefail; npm run check 2>&1 | tail -n 120`, which RTK cannot rewrite) ever worked, in all 200 recorded check invocations sampled. A live latent bug, not a defect kept on purpose. Cannot weaken the gate: `rtk npm ...` propagates the child's exit code directly (verified: a script exiting 3 came back `exit=3`) and shows both stdout and stderr, so the non-zero test still refuses to arm on a real failure. **Fixed on remediation:** `check-observer.mjs`'s normalizer originally stripped a leading `rtk ` inside the same 3-iteration loop as `cd`/`pipefail`, so `rtk rtk npm run check` armed the observer while `CHECK_INVOCATION_RE` used directly (the gate, `LONG_CHECKS` - neither pre-strips) refused that exact string, since its own optional group can only ever consume one `rtk `. Not a live vector - RTK never doubles its own prefix - but a real mismatch between what arms the observer and what the guard recognises. Fixed by deleting the explicit strip rather than reducing it to one pass: one pass still leaves a second, independent `rtk `-tolerance layered on top of `CHECK_INVOCATION_RE`'s own, which still arms on the doubled string (verified directly: stripping one leaves one behind, and the regex's own optional group then consumes that leftover too). With no explicit strip at all, the observer's `first`-segment test and the guard's own regex agree by construction, because they are now the same test. Deleting the strip loop also moved `rtk cd /r && npm run check` (`rtk` wrapping `cd`, a shape RTK itself never produces) from armed to no-arm; nothing depends on it. |
| 46 | Deny a `npm run check`/`check:built` inside a pipe or redirected to a file, and have `check-observer.mjs` state the verdict | `PreToolUse(Bash)` (rule 2k), `PostToolUse(Bash)` (observer) | **adopt** (owner decision, 2026-09-18) | Measured over this project's 65 session transcripts: of 71 real check invocations, **61 were piped** into `tail`/`grep`, 9 redirected to a file, and exactly **one** was the canonical `rtk npm run check` that candidate 45 established. A pipe hands the Bash tool the last stage's exit status - `tail` always exits 0 - so a failed check is indistinguishable from a passing one; the recorded recovery is a second ~165s run, or an `echo $?` on a later line that reports the echo's own status. A redirect keeps the status but hides the stdout the observer needs, so the gate never arms and the file has to be read back. Candidate 10's reminder has said "no pipe needed" since 45 and fires once per session; those 61 runs are what a reminder is worth against a habit the docs themselves taught for months. The deny forbids nothing that works, and the paired verdict line removes the remaining inference: the observer already knows the failure markers and whether it armed, so it says `PASS` / `FAIL` / passed-but-unattributable in one line, and speaks only for a real foreground check invocation. Arming is unchanged and just as strict - the line states, it does not gate. **Two host facts, probed live rather than assumed, bound what that line can carry**, both on this Windows desktop build: no exit-code field reaches a `PostToolUse` hook at all here (a successful Bash call arrives as `{stdout, stderr, interrupted, isImage, noOutputExpected}`, whatever the hooks reference lists), so the pass/fail split rests on the stdout markers and the ` (exit n)` suffix stays empty; and on a *failed* Bash call the hook does not speak at all - the result comes back as a plain string, `"Exit code 1\n..."`, rather than that object, verified with a check deliberately failed at its prettier stage. Neither weakens the fix: unpiped, a failure opens with `Exit code 1` on the result's first line and a pass ends with the observer's own. The FAIL branch is kept for a host that does deliver the call, and for the case that genuinely reaches here - a run that exits 0 while printing failure markers. Covers `check:built` too (same family, same blindness) though only `check` feeds the gate; `check:fast` is out of scope, as it is everywhere else. Boundary caught while implementing: the `2>&1` strip has to run **before** the list split, because `LIST_SPLIT_RE` treats that `&` as a list operator and a later strip reads the leftover `2>` as a file redirect - `check-observer.mjs` had the order right already. Selftest #154-#171; #119 retargeted, since it asserted the now-denied shape. |
| 47 | Name LSP and ast-grep where agents actually read | `.claude/README.md`, the three code-facing worker prompts | **adopt** (owner decision, 2026-09-18) | Measured over the same 65 transcripts: `Grep` 109 calls, `rtk grep` 90, `git grep` 55, **LSP 16** - all in the three sessions that installed it, and only `hover`/`documentSymbol` - and **`ast-grep` 1**, that one being `--version`. `git grep` over `.claude`, `CLAUDE.md` and `docs/` found exactly one mention of either tool, `agents/reviewer.md`'s `tools:` list, which grants LSP without saying what it is for. The guidance existed only in the human's global `~/.claude/CLAUDE.md`, while every worker is told to follow a prompt file exactly - so the prompts, not a doc line, are the lever. Two live traps found while probing and written down rather than left to be rediscovered: `workspaceSymbol` returns `No symbols found in workspace` on this host for any query, so the operation the old guidance led with is the one that fails first; and an `ast-grep` pattern that does not match exits 1 with no output, which reads as "no such code" (`function $N($$$A) { $$$B }` finds nothing in `app/src/lib/search.ts` only because those functions carry return type annotations). `findReferences` works and is the reason to bother - 11 references to `foldQuery` across two files in one call. No hook: a nudge toward a tool is not a deterministic property, and candidate 43's history is what happens when a guard denies a shape that already worked. |
| 48 | Deny or fail on a comment citing a batch id, a review finding id or an `issues/<id>/` path | `tests/` grep or `PreToolUse(Edit)` | **reject for now** | The rule is new (`CLAUDE.md`, "Comments", 2026-09-18) and the sweep that applied it found ~95 files, all written before the rule existed - no recorded failure of the written rule yet (row 29's bar). Rule 2i already denies the one that does damage (an `issues/<id>/` citation, at retirement). Cheapest form if it recurs: a `tests/derived.js`-style check that greps comments in `app/src`, `tools`, `tests`, `.claude/hooks` for `issues/[^<]` without a sha prefix and for `\bB\d+(\.\d+)?[a-z]?-[NR]\d+\b`. |
| 49 | A wrap-up nudge off the five-hour usage window | `Stop` / `PreToolUse` | **withdrawn, do not rebuild** | Built, measured and withdrawn at `79e26c9`: the five-hour window is not readable on this host. The hook input's `effort` is an object `{ level }`, and the same level reaches a worker's Bash tool as `$CLAUDE_EFFORT`. Full finding: `git show b2eec64:.claude/improvements.md`, Finding 4. |
| 50 | Re-measure the configuration audit baseline | none (a manual pass) | **dated: 2026-10-15** | Same commands, same Windows host as the 2026-09-15 baseline (`rtk gain`, `rtk discover`, `wc -c` of the always-loaded markdown, the skill-listing sum); `grep -n` and `tail -c` should be near zero in `rtk discover`, and `CLAUDE.md` under 181 lines. A regression is a new row here. Baseline table and method: `git show b2eec64:.claude/improvements.md`, Finding 7. |
