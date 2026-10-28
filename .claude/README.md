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
and their reasons are in prompts/orchestrate.prompt.md, "Model selection".
Its `Usage profile:` line picks the `max` or the `pro` column of the routing
table. A dispatch names `model` only where the active column differs from
the frontmatter, and a resume keeps its tier.

The orchestrator owns final reconciliation and cleanup: wait for workers, align context/plan/handoff, preserve evidence and unrelated work, and remove only clearly disposable task-scoped scratch artifacts.

Per-task scratch under issues/<id>/, deleted at closeout (`CLAUDE.md`,
"Task and session protocol"): context.md, plan.md, handoff.md, optional
mocks/. Durable content never waits there - see `docs/DECISIONS.md` and
the specs.

Kickoff:
  Follow .claude/prompts/orchestrate.prompt.md
  TASK: <id>
  GOAL: <feature or add source items...>

### Usage profiles

The `Usage profile:` line in prompts/orchestrate.prompt.md, "Model
selection" names the plan of the account. These facts set the two columns
(read 2026-10-08):

| Fact | Value | Source |
|---|---|---|
| Price | Pro $20 per month; Max 5x $100 per month | the owner, 2026-10-08 |
| Usage per window | Max 5x gives 5x the Pro usage per five-hour window | claude.com/pricing |
| Weekly limits | paid plans add weekly limits to the five-hour window | claude.com/pricing |
| Fable | Pro: only through paid usage credits, outside the plan's limits; Max: up to 50% of the weekly limits | claude.com/pricing; support.claude.com/en/articles/15424964 |
| Opus, Sonnet, Haiku | included on Pro and on Max | claude.com/pricing |
| Default model | Opus 5.5 on Pro and on Max | code.claude.com/docs/en/model-config |

Opus costs several times more per turn than Sonnet, and Sonnet more than
Haiku (support.claude.com/en/articles/14552983). All models share the
session and weekly windows; only a model-specific limit ("Opus limit") lets
`/model` continue the work (code.claude.com/docs/en/costs).

Switch to the Pro plan:

1. Set the line to `Usage profile: pro` in
   prompts/orchestrate.prompt.md, "Model selection".
2. Set the main session to `sonnet`: run `/model sonnet`, or keep
   `"model": "sonnet"` in `~/.claude/settings.json`. Use the alias, not a
   pinned id: a `sonnet` subagent runs on the main session's exact Sonnet
   model. The main session
   re-reads the longest transcript each turn, so its tier multiplies the
   cost of every orchestrator turn. Select `opus` by `/model` for one
   session only when you need it.

Not verified (2026-10-08):

- The absolute Pro and Max token limits.
- The weight of a Haiku turn against a Sonnet turn in the limits.
- The weight of cache reads in the limits (the docs say "count less", with
  no number).
- Which of a per-call `effort` and the frontmatter `effort` wins.
- The fixed token cost of an `Explore` spawn.

### Helper agents

A helper is a read-only subagent that a worker or the orchestrator
dispatches for wide material that needs a short answer.

- Who: a role whose tools include Agent. The reviewer's `tools:` line omits
  Agent and stays so.
- Type: `Explore`, or `claude-code-guide` for documentation. `Explore` is
  read-only and has no Agent tool (probe below), so a helper dispatches nothing;
  `claude-code-guide` answers from documentation. Never use
  `general-purpose`: it can write.
- Tier: `model: haiku` for these uses: H1 locate (every call site of a name,
  every file that cites a path); H2 log extraction (failing tests and first
  errors from `gh run view --log-failed` or a saved suite log); H3 corpus
  counts (command shapes over session transcripts before a hook decision);
  H4 documentation facts quoted verbatim with their URL. `model: sonnet` for
  synthesis across files under an `opus` parent. Never `opus` or `fable`.
  Pass no `effort`.
- When: the material is wide and the answer is short. A spawn carries about
  63K tokens of context before its first tool call (measured 2026-10-08 on
  this host: a Haiku probe with one tool call reported 63,162 tokens). A
  read that a few tool calls finish stays in the parent.
- The request: ask for paths with line numbers, counts, verbatim quotes with
  their URL, and the exact commands. Re-run a quoted command yourself before
  a conclusion rests on "no match" - an `rtk grep` without `-E` reads a real
  match as absent.
- Never delegate: a review verdict, a design choice, a judgement on a
  contract, an RLS policy or stored data, Russian text, a gate run, or any
  write.

Facts settled during measurement (`haiku-routing`, 2026-10-08, Claude Code
2.1.293, desktop host):

- `model: haiku` on the Agent tool runs Haiku 5.5: two probes, `Explore`
  and `general-purpose`, each reported `claude-haiku-5-5`. The `Explore`
  probe has no Agent, Edit or Write tool.
- A subagent can dispatch a subagent: a planner at depth 1 dispatched both
  probes, and the depth-2 `general-purpose` probe had the Agent tool. The
  docs allow three layers below the main conversation
  (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`, `1` turns nesting off); a
  `tools:` list without `Agent` blocks it (code.claude.com/docs/en/sub-agents).
- Subagent model precedence (docs): the per-call `model`, then the
  frontmatter, then `CLAUDE_CODE_SUBAGENT_MODEL`, then the main session's
  model. The environment variable does not change the built-in `Explore`
  and `Plan` agents; `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` forces one model
  on all (code.claude.com/docs/en/sub-agents).

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
  Rule 2w does not judge a `git.exe` pipe for this reason.
- A Bash command on a path with an apostrophe (`Downloads\Arazo's Aritfacts`)
  fails after the RTK rewrite: `cat` reports "cannot find the path". Read the
  file with the Read tool or PowerShell, or copy it to the scratchpad first.
  Measured 2026-10-07.
- A second session editing `.claude/hooks/**` concurrently makes this
  session's `npm run check` fail in ways that read as its own bug:
  `selftest.mjs`'s pass count changes between consecutive runs with no edit
  from this session (420 -> 430 observed), and a format warning appears in a
  file this session never touched - the symptom behind `CLAUDE.md`'s
  one-session-at-a-time rule.

| Event | Matcher | Script | What it does | Block or warn |
|---|---|---|---|---|
| `SessionStart` | - | `session-start.mjs` | Reports branch, HEAD, dirty files, most recently touched `issues/<id>/`. In a cloud session (`CLAUDE_CODE_REMOTE=true`) also runs seven probes - Node against `.nvmrc`, `docker info` (3 s), the puppeteer cache, `node_modules`, `gitleaks version` and `rtk --version` (2 s each), and the proxy's authorities in `~/.pki/nssdb` (`bash .claude/cloud-nss.sh --check`, 3 s: every CA by sha256 fingerprint; on a failure it names `bash .claude/cloud-nss.sh`) - each "ok" or what failed, and states the three cloud rules ("Cloud sessions"). `LOOT_SKIP_PROBES=1` (selftest) reads each probe as "skipped". | warn (informational) |
| `PreToolUse` | `Bash\|PowerShell` | `bash-guard.mjs` | A PowerShell command is normalised first (each backtick and the character after it become a space, `\` becomes `/`) and then judged by the same families; a cmdlet such as `Remove-Item` is not judged (`docs/DECISIONS.md`, 2026-09-24). Every git rule reads `rtk git` and `rtk proxy git` as `git`, and skips git's value-less global options (`--no-pager`, `-P`, `-p`, `--paginate`, `--no-replace-objects`, the pathspec flags, `--no-optional-locks`, `--bare`) before the subcommand. Persistence-era families, after attribution: **2n** is an allowlist of `supabase` commands, deny by default (`docs/DECISIONS.md`, 2026-09-25, "Agents may write to the test project; production is CI's or the owner's"): `--help` or `-h` anywhere is allowed (help never writes, and the CLI refuses a help flag in a value position), while `--version` and `-v` pass only on the bare CLI (`db reset --version <timestamp>` is a reset); a `db *`, `migration *` or `config push` command whose every target is the test project - `--project-ref rdjxcjkhsklhprmzxajq` (`TEST_PROJECT_REF`, equal to `PROJECTS.test` in `tools/supabase/lib.mjs`, which `tests/derived.js` asserts), or a `--db-url` with no query string whose host is `db.<ref>.supabase.co` (user `postgres` or `postgres.<ref>`) or a `*.pooler.supabase.com` host with the user `postgres.<ref>` - is allowed, while `--linked`, a variable or no target is no proof; otherwise the first two words look up a table: always allowed are the bare CLI, `start`, `stop`, `status`, `init`, `completion`, `migration new`, `functions new`, `functions serve`, `test new`, `config diff` and `db start` (it has no `--local` flag and only ever starts the local database); `db push` and `db dump` need `--dry-run` or the local stack; `db reset`, `migration down`, `migration list`, `migration squash`, `db diff`, `db lint`, `gen types`, `test db`, `inspect db` and `seed buckets` need `--local` with none of `--linked`/`--db-url`/`--project-ref`; `migration up` needs none of those three; every other pair (`link`, `login`, `secrets`, `functions deploy`, `storage`, `projects`, `config push` or `migration repair` without the test target, an unknown word) is denied. `npm run config:push`/`db:push`/`limits:set` is allowed only with `--project test` and no other `--project`; the script is read past a leading `rtk`, npm's flags on either side of the verb (`-s`, `--silent`, `-q`, `--loglevel <v>` or `=<v>`, `--prefix <v>`, `-C <v>`, any other `-` token; before the verb, any other `--name` without `=` takes the next token as its value unless that token is a verb or a flag, so `npm --registry x run db:push` is judged) and the verbs `run`, `run-script`, `rum` and `urn`. The owner-only restore: a segment whose program (past `rtk`) is a package runner - `npm`, `pnpm`, `yarn`, `bun`, `npx`, `pnpx`, `bunx`, `corepack` - with a token that is exactly `restore:prod` (quoted as one word or not), or a `node` run (past `rtk`, `rtk proxy`, `npx`, `npm exec`) with a token, or the value after its first `=`, whose last path segment is `restore-prod.mjs` is denied, because only the owner restores production ("Restore production (owner)"); a search for the name (`git grep restore:prod`, `rtk grep restore:prod docs`, `git log -S restore:prod`) and reading, diffing or staging the file are not. Not matched, and left to `main`'s terminal check: `bash -c "npm run restore:prod"`, `bun <file>` and PowerShell's `Start-Process`; the rule stops accidents, and the TTY check stops an agent's run of any of them. The CLI counts as run through a path ending in `supabase` (`node_modules/.bin/supabase`), `node <...>/supabase/dist/supabase.js` (CI's entry in `ci.yml` and `backup.yml`, and `RESET_COMMAND` in `tools/supabase/lib.mjs`, the drill's printed remedy; the tools spawn the platform binary), a package runner - `npx`, `bunx`, `pnpx`, `npm exec`/`x`, `pnpm exec`/`dlx`, `yarn exec`/`dlx`, `bun x` (past its flags, a `-p`/`--package` value and a bare `--`) - or `rtk`; **2q** (after 2n) denies a Bash or PowerShell command with a token, or the value after a token's first `=`, whose last path segment is exactly `.env.restore.local` (the owner's backup key; readers such as `cat` and `type`, a quoted single-word path and a `<` redirect included, a quoted phrase such as a commit message not), because only `npm run restore:drill` reads that file ("Run the agent drill"); a glob that expands to it, and a PowerShell colon-bound parameter (`-Path:.env.restore.local`, whose last segment is the whole token), are not caught; **2u** (after 2n) denies a Supabase CLI command that starts, stops or resets the local stack - `start`, `stop`, `db start`, and `db reset`, `db push`, `db diff`, `migration up`, `migration down`, `test db` or `seed buckets` with none of `--linked`/`--db-url`/`--project-ref` (help is never judged) - while `stack-lock.mjs`'s `foreignStackLock()` finds a fresh lock of another checkout (a hand-written lock is always foreign), naming the holder and "45 minutes" ("Supabase configuration", "The local stack lock"); **2t** (after 2q) denies a dot-source, `source` or a file printer - `cat`, `type`, `gc`, `Get-Content`, `more`, `less`, `head`, `tail`, `bat`, `nl`, `od`, `xxd`, `strings`, `rtk read` - with an operand (a leading `<` stripped) whose last path segment starts with `.env`, because `. .env.test.local` once printed part of a value; `node --env-file=<file>`, `npm run e2e`, a search (`git grep`, `rtk grep`) and a quoted phrase are not judged (`docs/decisions/`, 2026-09-27, "Agents read no .env file; the program loads it with `--env-file`"); **2v** (after 2t) denies a `node` run with a token whose last path segment is `gate-credit.mjs`, because `gate-credit.mjs` trusts its caller's exit code, so only the check chain may run it ("Run a long check", "Gate credit"); it also denies a `node` run of `ci-credit.mjs` when the command sets `LOOT_GH_CMD` or `LOOT_HOOK_ROOT` (an env prefix, `env`, `export` or `$env:`), the script's selftest overrides, because otherwise it verifies every fact through GitHub ("CI credit"); **2p** (after 2i) denies a `git rm`, `git mv`, `rm` or `mv` whose positional token is a `supabase/migrations/<file>` that a remote-tracking ref holds, with edit-guard's lookup, fetch and message (a deletion or a rename never reaches an Edit-family tool); a source token that is a directory at, under or above `supabase/migrations/` expands to the migrations under it, and a glob in a token's last segment (`*` or `?`) expands against its parent directory, because the shell expands it only after the hook has judged the command; a move's destination directory only receives and is not expanded; a `.exe`/`.cmd`/`.ps1`/`.bat` suffix is dropped from every program (`git.exe` is `git`), and `--local=false` or `--dry-run=false` counts as absent; **2s** (right after the blocklist, so a reviewer's `git reset --hard` keeps the blocklist's message) judges only `agent_type` `reviewer` and denies a git write subcommand (`add`, `am`, `apply`, `checkout`, `cherry-pick`, `clean`, `commit`, `merge`, `mv`, `pull`, `push`, `rebase`, `reset`, `restore`, `revert`, `rm`, `stash` but `stash list` and `stash show`, `switch`, `update-ref`, `worktree`; `branch` with a delete, move, copy or force flag; `tag` with a delete flag), a file writer (`rm`, `rmdir`, `mv`, `cp`, `touch`, `mkdir`, `tee`, `ln`, `chmod`, `chown`, `truncate`, `dd`, `patch`, `sed` or `perl` with `-i` alone, with a suffix, in a cluster or as `--in-place`), a writing cmdlet (`Set-Content`, `Add-Content`, `Out-File`, `New-Item`, `Remove-Item`, `Move-Item`, `Copy-Item`, `Rename-Item`, `Clear-Content`, `Set-Item` and their aliases, `del`, `erase`, `rd`, `copy`, `move`, `ren` and `md` included), a formatter or linter run with a `--write` or `--fix` token (Prettier's `-w` too, directly or through `npx`, `pnpx` or `bunx`), an `npm` verb but `ls`, `list`, `ll`, `la`, `view`, `info`, `show`, `outdated`, `explain`, `why` and `help`, a Supabase CLI call but `status` and help, and an output redirect to a file but `/dev/null`, `nul` or `$null` (`2>&1` and `>&2` are not a file), because the reviewer is read-only except its report (`docs/decisions/`, 2026-09-27, "The reviewer writes its report to `issues/<id>/reviews/` and nowhere else"); **2r** (right after 2n and 2o) denies a migration write to the test project - `npm run db:push` with `--project test`, a `node` run of `db-push.mjs` with `--project test`, any `node` run of `migrate-test.mjs` (it refuses every other target), a Supabase CLI `db push` without `--dry-run` or `migration up` whose target is the test project - while `supabase/migrations` has uncommitted changes, or while a file of `HEAD`'s `supabase/migrations` has its blob, under its name, on neither `origin/main` nor the tree of a `Reviewed:` commit of an `issues/*/reviews/*.md` that reads `Verdict: approve` and `Scope: batch <id>` (a plan review approves nothing; `lib.mjs`, `parseReviewHead`; the head lines of `.claude/templates/review.template.md`); no `refs/remotes/origin/*` ref but `origin/main` is a source for a script or CLI write, and `origin/main` is read unfetched, so a stale ref denies; the checkout that decides is the one that holds a named `db-push.mjs` or `migrate-test.mjs` (`git rev-parse --show-toplevel` in the script's directory, because each script pushes its own checkout's migrations), else the one of `cwd` (`git -C <dir>` moves it); rule 2r judges such a write only as one plain command, and every other command that holds one denies (`migration-checkout-unpinned`; `docs/decisions/`, 2026-10-21, "A script write to the test project is judged per file, like a push", "Decision (checkout)"): one segment once `2>&1` and `>&2` are dropped (no `;`, `|`, `&`, `(`, `)`, `{`, `}`, backtick, `$(` or newline); the first token, past `rtk` or `rtk proxy`, is the program: `npm` with only `run` or `run-script`, `db:push` and `-s`/`--silent` before `--`, `npx` followed by `supabase[@<v>]`, `node` with only `--env-file=<path>` before a script that resolves literally (no `~` or `$`) to `<toplevel>/tools/supabase/db-push.mjs` or `migrate-test.mjs` of an existing checkout, or the Supabase CLI; for `npm`, `npx` and the CLI, cwd is its checkout's toplevel; no `'`, `"` or Bash `\` in the command, no `--workdir`, no token with `supabase_workdir`, and the hook's own `SUPABASE_WORKDIR` unset. A write is found in any segment, at the program position or, outside a reader segment (`READERS`, `git` but `bisect run`, `submodule foreach` and `rebase -x`/`--exec`, `rtk grep`/`read`/`ls`/`find`/`diff`/`wc` past `rtk proxy`, `ls`, `find`, `wc`, `diff`, `stat`, `file`, `dir`, `Get-Content`, `gc`, `Get-ChildItem`, `gci`, `Get-Item`, `Select-String`, `sls`, `Test-Path`; `find` only without `-exec`, `-execdir`, `-ok` or `-okdir`), by a `db:push` token, a `db-push.mjs` or `migrate-test.mjs` token, or a Supabase CLI token followed by `db push` (no `--dry-run`) or `migration up`, each name compared without case; a plain production or dry-run form is left to rule 2n; the deny names the short tree hash, each unknown file, `git fetch origin` and each report seen; no migrations tree at `HEAD`, or a git failure, allows. In every session it also judges a `git push` without `--dry-run`/`-n`, because every pushed `claude/**` branch runs CI's `migrate-test`: it denies `--all` and `--mirror` and a source that does not resolve; for each refspec source (no refspec: `HEAD`) whose `supabase/migrations` tree differs from both `origin/main`'s and that of the branch it updates (`refs/remotes/origin/<branch>`, from the refspec's destination, the current branch or `@{push}`; remote `origin` only), every file must have the same blob on `origin/main`, on that branch's ref (an earlier push of that branch, judged by this rule or made by the owner, wrote it) or in the tree of an approving batch report, and a push that updates `main` also passes when `.check-cache.json` holds `by: "ci"` and the source's `commitKey` (CI applied that tree at the task branch's push); another branch's `origin/*` ref and the upstream count for nothing - else it denies, naming the files. Such a push is judged only as one plain command - the script shape's quote, segment and `rtk` tests, then `git` with no global option but `-C <dir>` (no `~` or `$`) and the value-less ones but `--bare`, then `push` - and a push in any other command, found at a segment's program position or by its `git` and `push` tokens behind a launcher or inside `submodule foreach`, `bisect run` or `rebase -x`, denies (`migration-push-unpinned`) when a source depends on the checkout (`HEAD`, `@`, a bare push, a pseudo-ref, a `~`, `^`, `:` or `@{` form) or holds a file on neither `origin/main` nor the branch it updates (a destination `HEAD` or `@`, an erased quoted span after `push`, a `$(` or backtick in the push's statement, and a push behind `xargs` depend on the checkout too); a matching refspec `:` or `+:`, `remote.origin.mirror`, a no-refspec push under `push.default=matching` or a `remote.origin.push`, and a bare-name refspec under `push.default=upstream` or a `remote.origin.push` count as `--all`; a delete with a named destination and a dry run pass; one helper, `unknownMigrations`, judges both paths (`docs/decisions/`, 2026-10-22, "A push is judged per file like a script write, and only as one plain command"); **2o** in a cloud session only (before 2r, so it keeps its own message), denies a `git push` from `main` or a detached HEAD, with `--all`/`--mirror`/`--tags`/`--delete`/`-d`, or to any destination but the current branch or `HEAD`; **2x** (after 2v, every host) denies a push that updates `main` - the current branch `main` with no refspec or with `HEAD`, a bare push whose `@{push}` is `refs/remotes/<remote>/main` (`push.default=upstream`), a refspec destination `main`, `heads/main` or `refs/heads/main` (`HEAD:main` from a task branch included), a delete of `main` (`:main`, `--delete main`), `--all`, `--mirror` - unless `.check-cache.json` holds `commitKey(<source sha>)` (`tree-key.mjs`: the tree key that the working tree has when it equals that commit), because a task-branch commit passes 2e on `check:fast` alone, and `merge`, `cherry-pick` and `revert` commit on `main` without a `git commit` that 2e could see; the deny names `node <checkout>/.claude/hooks/ci-credit.mjs <tip sha>` and `npm run check` ("CI credit"); **2l** runs `gitleaks git --pre-commit --staged --config .gitleaks.toml --redact` (4 s timeout per scan, so two scans fit the hook's 10 s) before every non-dry-run `git commit` and denies on a finding, naming `file:line (rule)` and never the secret - it speaks, and allows, when gitleaks is missing, slow or fails, and has no bypass; for `git commit -a` or a commit with a pathspec (`--pathspec-from-file` counts as the whole tree) it runs a second scan without `--staged` (the unstaged working-tree diff), so the two scans cover whatever any commit form can take from the tree, and a finding in either denies; **2m** after the check gate: a commit staging `supabase/**` or `tests/db/**` (or `-a` over them, or a pathspec that names their unstaged changes - 2e unions the unstaged paths a pathspec matches, as it unions all of them for `-a`) needs a passing `npm run check:db` for the tree key (`.check-db-cache.json`). `SKIP_CHECK_GATE=1` bypasses 2e and 2m together. Then, as before: blocks `git reset --hard`, forced `git clean`, a `git push` with any force form, `git checkout`/`restore` discards (including `restore --staged --worktree`), `git stash drop`/`clear`, `rm -r` inside the repo with or without `-f`, `rm`/`git rm` of any file under an `issues/<id>/` or of the directory while a tracked line outside it cites `issues/<id>/` (a `git show <sha>:path` citation is exempt), blanket staging (`git add -A`, `git commit -a`) with 2+ dirty paths, AI attribution in a commit message, commits when `npm run check` has not passed for the covered paths (rule 2e: `.check-cache.json` holds the tree key; on a branch other than `main`, not detached, also `.check-fast-pass.json`, the record of a `check:fast` exit 0 - the `main` rule, `.check-cache.json` only, also applies when the branch cannot be read, when `git -C` names another checkout, and when an earlier segment of the command runs `checkout`, `switch`, `merge`, `pull`, `rebase`, `reset` or `stash`, because the hook reads the branch before the command runs; the
fingerprint drops every `isExempt()` path - `issues/<id>/` markdown,
`.claude/README.md`, `docs/specs/` - so an edit confined to those cannot
arm or break the gate; `tree-key.mjs`), a backgrounded `npm run check` in a subagent (rule 2g, plain or `rtk`-prefixed; only when `agent_id` is in the hook input, because a subagent's background run dies with its turn, while the main session is notified at the exit and the check arms the gate by its own exit), a `npm run check`/`check:built` inside a pipe or redirected to a file (rule 2k - the pipe hands the tool the last stage's status, so a failed check reads as a pass; the redirect hides the stdout the gate needs), and `grep -n`/`tail -c` in a shape `rtk 0.48.0` is measured never to rewrite (`grep -n`: a non-final pipe stage, inside `$(...)`/backtick, or wrapped by `xargs`/`nohup`/`time`; `tail -c`/`--bytes`: any position at all, chain or pipe - it has no byte-offset rewrite) - a bare, chained (`&&`/`;`/`cd`), or pipe-final-stage `grep -n` passes through for RTK's own hook to rewrite; restructure a denied one into `rtk grep`/`rtk read`. **2w** (right after 2j) denies `git status`, `git log` without `-p`/`-u`/`--patch`/`-L`, `git branch`, `git worktree list`, `ls`, `cat`, `grep`, `rg`, `vitest` or `npx vitest` without `--coverage`, `prettier`/`npx prettier` and `eslint`/`npx eslint` in a pipe stage whose next stage is `head` or `tail`, because `rtk 0.48.0` never rewrites a pipe stage that is not the last; the deny names the bounded form (`git log -<n>`, `rtk read <file> --max-lines <n>`, `rtk grep --max <n>`, the command without the pipe) and, for git, `git.exe` in an isolated `agent-*` worktree. Not judged: `git show` and `git diff` (RTK never truncates them, so dropping the pipe raises the output), `npm run <script>` (2k owns `check`), a `--coverage` vitest run (RTK drops the coverage table), `git.exe`, a wrapper (`time`, `nohup`, `xargs`, `env`, `command`; an env-var prefix is judged), a pipe into any program but `head`/`tail`, and a substitution (`docs/decisions/`, 2026-10-01, "An RTK command piped into head or tail is denied when RTK bounds it"). Reminds once per session per command family before a long check, including an unsharded `golden.js`/`sweep.js` call - a sharded `run-all.js --shard=n/m` call is not read as the safe form by contrast, it gets the same reminder on its own merits, since a single bin can itself run past the idle-host minute mark (`.claude/README.md`, "Batch size and the fixed cost of a run"). | **block** (+ one allow-and-remind case) |
| `PreToolUse` | `Edit\|MultiEdit\|Write\|NotebookEdit` | `edit-guard.mjs` | Blocks writes to `data.json`, `catalog.csv`, `names.json`, `catalog-index.csv`, `i/*.html` (with `i/en/*.html`), `en/index.html`, `pages/*.html`, `pages/en/*.html`, `dist/`, `dist-test/`, `package-lock.json`, `tests/app/snapshots/**`, `docs/DECISIONS.md` (the generated index of `docs/decisions/`; the message names `node tools/decisions.js`), and a `supabase/migrations/<file>` that a remote-tracking ref holds (`git fetch --quiet origin` first when a remote `origin` exists - 5 s at most, `GIT_TERMINAL_PROMPT=0`, so a push from another clone is seen - then `git for-each-ref refs/remotes/`, then `git cat-file -e <ref>:<path>`; CI applies every pushed migration, so a pushed one is history - "write a new migration instead"). `lib.mjs`'s `remoteRefsHoldingMigration` is the lookup, shared with rule 2p. No file records applied migrations; a failed or slow fetch reads the local refs as they are, and a repository with no remote ref, or a git failure, blocks no migration (fail open). For `agent_type` `reviewer`, before every other rule: only `Write`, `Edit` or `MultiEdit` on `issues/<id>/reviews/<name>.md` is allowed, and every other write is denied, a path outside the repository included (`docs/decisions/`, 2026-09-27, "The reviewer writes its report to `issues/<id>/reviews/` and nowhere else"). Paths resolve against the session's own checkout, `lib.mjs`'s `checkoutRoot(cwd)`: the nearest ancestor of the payload's `cwd` with a `.git` file (a linked worktree; a nested `.git` directory does not count), when it is the repository root or inside it, else the repository root. The desktop app runs the main checkout's hook copy for a worktree session (measured 2026-09-30: a worktree write reached the main checkout's `.hook-state.json` as `.claude/worktrees/<name>/...`), so the hook file's own location names the wrong checkout. A reviewer's report in a linked worktree resolves against that worktree, because a reviewer dispatched from the main checkout keeps that `cwd` while the task lives in an `agent-*` worktree (measured 2026-10-07); a report in the main checkout from a worktree session is denied. For the generated-file rules, a path outside the session's checkout falls back to the repository root, so a worktree session still cannot write the main checkout's `data.json`. Selftest #301. | **block** |
| `PreToolUse` | `Agent\|Task\|SubagentDispatch` | `agent-guard.mjs` | Judges an `implementer` dispatch whose prompt names `TASK: <id>` against `issues/<id>/plan.md` Status: denies when it has no `- Plan review:` line or a malformed one ("declare it"), and for each `required before <batch>` line, the newest `issues/<id>/reviews/plan-<batch>.md` or `plan-<batch>-<n>.md` with a `Verdict:` line (numeric order; `lib.mjs`, `parseReviewHead`) decides: `approve` allows; `fix-then-continue` allows when a Status line `- Plan review findings applied: reviews/<that file>` names it; `replan` denies ("a replan needs a second look"); no such report denies ("dispatch the reviewer"); the deny names the file, each report seen with its verdict, and the dispatch tool (`docs/decisions/`, 2026-09-27, "A plan that changes schema, contracts, stored data or sync is reviewed first"; 2026-10-01, "A plan review's fix-then-continue is applied once, with no second look"). Silent for another agent type, no `TASK:` line, a `TASK: <id>` placeholder, no `plan.md`, and any throw; a resume (`SendMessage`) is not a dispatch. This host's dispatch tool is `Agent`; `Task` and `SubagentDispatch` are other builds' names. | **block** |
| `PreToolUse` | `Read\|Grep` | `read-guard.mjs` | Denies the Read tool's `file_path`, and the Grep tool's `path` or `glob`, whose last path segment starts with `.env` (case folded, `\` read as `/`), from any checkout, because a `./` pattern in `permissions.deny` binds the session's working directory and an absolute path from a worktree passed it (`docs/decisions/`, 2026-09-27, "The Read and Grep tools are denied `.env` files by a hook, not only by settings"). A Grep by pattern over a directory is not judged ("Known limitations"). A worktree agent is guarded by its worktree's tree, cut from `origin/main`, so a change reaches it only after the push ("Known limitations"). No git and no file read; any throw allows. | **block** |
| `PostToolUse` | `Bash\|PowerShell` | `check-observer.mjs` | `npm run check:db` from either tool: reads the output from `tool_response.stdout`, else `.output`, else a string response, plus `stderr`; a `check:db: BUSY` line (the local stack lock is held; tested before the FAIL markers, because npm prints its own error lines for exit 3) says BUSY and writes nothing, a `check:db: PASS` line writes `.check-db-cache.json` and says "Commit gate armed for supabase/ and tests/db/", a `check:db: FAIL` line or a failure marker says FAIL, neither says it cannot attribute the run. When a run cannot be attributed (`check:db` without its PASS line, `check` without its coverage summary) but the cache already holds the current tree key, the check's own exit armed the gate (`gate-credit.mjs`), and the line says `PASS - armed by the check's own exit.` An attributed pass does not rewrite a cache that already holds the current key, so a `by: "exit"` record stays. `npm run check` arms from Bash only, as follows. Records a passing `npm run check` against the current tree fingerprint, so the commit gate has something to check against. Accepts a leading `cd <dir> &&` or `cd <dir>;` (PowerShell 5.1 has no `&&`), `set -o pipefail;`, and `rtk `. States the verdict in one line - `PASS` and armed, or passed-but-unattributable - so the result needs no second run to establish. On this host a failed call never reaches it (see "Run a long check"), and no exit-code field reaches it at all. | warn (one line per passing check; silent otherwise) |
| `PostToolUse` | `Edit\|MultiEdit\|Write\|NotebookEdit` | `edit-followup.mjs` | Records the write for the `Stop` hook. Reminds once per session per group about `data.js` -> `node tools/build.js`, public-contract fixtures, and a write under `docs/decisions/` -> `node tools/decisions.js` (`remind:decisions`). Known false-positive, kept as a nag rather than fixed: it tests `p.startsWith('docs/fixtures/')`, so it fires its public-contract reminder on any write under `docs/fixtures/share/`, which is not itself a contract surface (`CONTRACTS.md` enumerates only `docs/fixtures/urls/routes.json` and `docs/fixtures/import/`) - the reminder firing there is not evidence a contract moved. | warn |
| `Stop` | - | `session-stop.mjs` | Warns when this session's own writes are still uncommitted, or the active task's `handoff.md` looks stale next to what this session wrote. Separately names this session's own writes that are still untracked (excluding `docs/` and the task-document set - `context.md`/`plan.md`/`handoff.md`/`mocks/` - in any `issues/<id>/`, where the review register `reviews.md` and the reports under `reviews/` count as task documents too), as candidates for either a commit or deletion; never both sentences for the same path. Warns when a task document of the active task is past its size budget (150 KB; past 300 KB it names the collapse action per file), only for the session that wrote into that task directory. | warn, never block |

Three modules under `.claude/hooks/` are not registered hooks: `gate-credit.mjs`
(the `begin` and `arm` steps of the `npm run check` and `check:fast` chains,
and the credit that `tests/db/run.mjs` imports; "Run a long check", "Gate
credit"), `stack-lock.mjs` (the local stack lock that `tests/db/run.mjs`,
`restore-drill.mjs` and rule 2u read; "Supabase configuration", "The local
stack lock") and `ci-credit.mjs` (the CLI that arms the gates from a green
CI run; "CI credit"). The first two are in the selftest's fail-open loop;
`ci-credit.mjs` reads no stdin, and the selftest runs it against a fixture
checkout with a fake `gh` (`LOOT_GH_CMD`).

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
only by settings"; `tests/derived.js` pins its registration). A subagent
in an isolated worktree is guarded by the hooks of its worktree's tree, so
only from a commit that `origin/main` carries; a desktop worktree session
runs the main checkout's copy ("Known limitations").

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

These runtime files live under `.claude/` and are gitignored
(`.claude/.gitignore`). A worktree session keeps the caches, the pending
files, the fast record and the index copies in the worktree's own `.claude/`
("Known limitations", the desktop worktree session):

| File | Written by | Contents |
|---|---|---|
| `.check-cache.json` | `check-observer.mjs`, `gate-credit.mjs`, `ci-credit.mjs` | `{ key, at, command, by }` for the last passing `npm run check`; `by` is `observer` (the hook saw the output), `exit` (the check's own exit armed it), `ci` (a green CI run of the same tree; `command` is `ci run <id>`) or, in an old record, `halves` (the retired two-call check). |
| `.check-fast-pass.json` | `gate-credit.mjs` | `{ key, at, command, by: "exit" }` of the last `npm run check:fast` exit 0. Rule 2e accepts it on a task branch only. |
| `.check-fast-pending.json` | `gate-credit.mjs` | `{ key, at, ppid }` of the running `check:fast`, as `.check-pending.json`. |
| `.check-1-pass.json`, `.check-2-pass.json`, `.check-1-pending.json`, `.check-2-pending.json` | `gate-credit.mjs` before 2026-10-21 | The records of the retired two-call check. Nothing reads them; they stay ignored because old checkouts still hold them. |
| `.check-db-cache.json` | `check-observer.mjs`, `gate-credit.mjs`, `ci-credit.mjs` | `{ key, at, command, by }` for the last passing `npm run check:db`, against the same tree key. |
| `.check-pending.json` | `gate-credit.mjs` | `{ key, at, ppid }`: the tree key at the start of the running `npm run check` and its script shell; `arm` reads it, and deletes it when the `ppid` is its own run's. Gitignored, because an unignored file would change the key it records (`tests/derived.js` pins the line). |
| `.check-db-pending.json` | `gate-credit.mjs` | `{ key, at, ppid }` of the running `npm run check:db`. |
| `.check-index-<pid>` | `tree-key.mjs` | A throwaway copy of the real index for one process, never the index itself; `treeKey()` deletes it after the read, so two processes never share one copy. Main's older `tree-key.mjs` writes `.check-index`, which stays ignored. |
| `.check-index` (older hooks) | `tree-key.mjs` before 2026-10-07 | The one shared copy the older code wrote. `tree-key.mjs` finds the index with `git rev-parse --git-path index`: in a linked worktree `.git` is a file, and the old `<root>/.git/index` path made the key null there, so every commit gate failed open in a worktree until 2026-09-24. The stage runner keeps its own copy for each process at `node_modules/.cache/check/index-<pid>` ("Run a long check", "Stage cache"). |
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

On a task branch an agent runs only the fast pre-check `rtk npm run
check:fast` before a commit, then pushes: CI's run on the pushed commit is
the full gate ("The fast pre-check" and "CI credit" below). The full `npm
run check` takes 10-18 min cold, so it runs in the main session with
`run_in_background` or in the owner's terminal, never in a subagent, whose
turn can end before the run and lose the verdict; it arms the gate by its
own exit. The rules below apply to every check call. Each part is
load-bearing:

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
  `check-observer.mjs` saying `npm run check: PASS. Commit gate armed`
  (`PASS - armed by the check's own exit.` when the stage cache skipped
  vitest; "Stage cache" below).
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
  run. The default is 120 s and the check takes minutes (stage costs:
  "Batch size and the fixed cost of a run", the 2026-10-07 table), so a
  check call without a timeout cannot finish in the foreground. 600000 is the tool's
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

A run resets the database three times whatever the migration count (the
runner, the applier test, the walk; `docs/DECISIONS.md`, 2026-09-25). One
`db reset --local` took 77 s and a warm run 532-811 s (measured 2026-10-14/15
on this host; 817 s of suite time for 562 tests on 2026-10-21, about 15 min
with the stack start), past the tool's 600 s cap, so a run arms the gate by its own
exit ("Run a long check", "Gate credit"). The runner fails in seconds:

| FAIL line | Cause | Remedy |
|---|---|---|
| `Docker did not answer in 20 s. ...` | Rancher Desktop is down, or the call ran in Git Bash | Start Rancher Desktop; run check:db through PowerShell |
| `check:db: supabase_<service>_<id> is not running. ...` | a container of `STACK_SERVICES` is missing after `supabase start` (an image Rancher lost) | Run `npx supabase stop` through PowerShell, then check:db again: it starts the stack with its excludes and pulls the image |
| `check:db: db reset --local did not finish in 5 minutes. ...` | a hung reset at any of the three reset sites (`RESET_TIMEOUT_MS`, overridden by `DHLOOT_RESET_TIMEOUT_MS`) | As the row above |
| `check:db: supabase start did not finish in 3 minutes (DHLOOT_STACK_TIMEOUT_MS ...). ...` (or `status`, `stop`) | a CLI call hung, once on a `docker container inspect` with every container healthy; or a first start pulls its images (`STACK_TIMEOUT_MS`, three times the slowest warm start) | As the row above; for a pull, set `DHLOOT_STACK_TIMEOUT_MS` |
| `check:db: FAIL - docker ps did not answer in 30 s. ...` | Docker hung (`runningContainer`, also in the restore drill) | `rdctl shutdown`, then `rdctl start` through PowerShell |
| `check:db: FAIL - The Supabase CLI binary is not installed. ...` | no `@supabase/cli-<platform>` package in any parent `node_modules` | Run `npm ci` in the checkout the run is in |

A timed case can miss its bound in the first run after `rdctl start`: on
2026-10-28 `list-shares.test.mjs` failed with "the first read's median took
2878 ms" (bound 1500 ms), and the next run passed at 1358 ms. Run check:db
once more before you read such a miss as a regression.

Its last stdout line is `check:db: PASS` or `check:db: FAIL`, and
`check-observer.mjs` arms the `supabase/` and `tests/db/` commit rule from
the PASS line. The observer matches the command at its start, so a run
wrapped in anything (a timer such as `$s = Get-Date; npm run check:db; ...`)
passed and armed nothing, and the commit was then refused by rule 2m
(2026-09-25); since gate credit the suite arms its gate by its own exit
("Gate credit" below), but the observer still cannot state the verdict.
Run the command alone. Measured live on 2026-09-24: a PowerShell call reaches the
`PostToolUse` hook with the PASS line in its text and no exit-code field, and the
`Bash|PowerShell` matchers took effect in the session that saved them.

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

**CI credit.** A task branch pushes every batch, and a green CI run of the
exact tree is the full gate (`docs/decisions/`, 2026-10-21, "A task branch
pushes every batch; a green CI run of the same tree gates main"). `ci.yml`
runs on a push of `claude/**` beside `main`. After a push the orchestrator,
in the main session, runs one background call with the script's path in the
batch's worktree:

```text
node <worktree>/.claude/hooks/ci-credit.mjs <sha> [--run <id>]
```

The script takes its checkout from its own location, never from the
session's cwd, which is the main checkout and moves on a `cd`. It finds the
newest `ci.yml` run of that commit made by a push or a dispatch (a pull
request run does not count, and a `skip_e2e` dispatch fails condition 2),
retrying every 10 s for 600 s (a push run can appear 6-8 min late), waits with `gh run watch <id> --exit-status`, and arms
`.check-cache.json` and `.check-db-cache.json` (`by: "ci"`, `command: "ci
run <id>"`) only when all three hold, each fact from GitHub through the
authenticated `gh`:
1. the run (`gh api repos/{owner}/{repo}/actions/runs/<id>`): `path`
   `.github/workflows/ci.yml`, a head repository equal to this repository
   (no fork), event `push` or `workflow_dispatch`, `completed`, `success`,
   and `head_sha` the full sha asked for;
2. the latest attempt's jobs: each job of `REQUIRED_JOBS` (`changes`,
   `check`, `browser (1)` to `browser (5)`, `db`, `e2e`, `audit`,
   `secrets`; `tests/derived.js` keeps it equal to `ci.yml`) concluded
   `success`, with two exceptions (owner, 2026-10-21; the test host stalls
   under frequent E2E runs):
   - one re-run of `e2e`: the run is at attempt 2 (`run_attempt`), its
     latest jobs are all green, and in attempt 1 (`.../attempts/1/jobs`)
     every required job but `e2e` concluded `success` and `e2e` concluded
     `failure`, `cancelled` or `timed_out`. Attempt 3 or later never counts,
     and neither does a re-run after a failure outside `e2e`;
   - a skipped `e2e`, only when the path rule below says skip. A `skip_e2e`
     dispatch still fails here;
3. `commitKey(<sha>)` equals `treeKey()` of the checkout: the tree that CI
   tested is the tree about to be committed. A key that cannot be read
   refuses, the opposite of the hooks' usual null-is-allow. On a mismatch it
   prints the paths that differ (paths only), for example an untracked,
   unignored file that `treeKey` counts and `commitKey` cannot see; the owner
   removes it, or the main session runs `npm run check` instead; for a
   migration that `origin/main` lacks rule 2r takes only the credit, so the
   owner removes the file and the credit runs again.

It prints `ci credit: armed for <short sha> (run <id>)` and exits 0, or one
`ci credit: refused - <reason>` line per reason, writes nothing and exits 1
(2 for a usage error). After `git fetch origin main`, a run whose `ci.yml`
differs from `origin/main`'s is accepted with the line `ci credit: note -
ci.yml differs from origin/main` (the owner accepts any `ci.yml`, 2026-10-21). The residual the
owner accepted: for a push GitHub runs the pushed commit's own workflow
file, so a branch that weakens `ci.yml` gets a green run from that file;
`REQUIRED_JOBS` does not stop it, because the branch edits it together with
`ci.yml`, and after the squash `main`'s own run follows the weakened file.
The barrier is a person reading the diff: `orchestrate.prompt.md`, "When to
run reviewer", fires on a change under `.github/workflows/`, a check script
in `package.json`, `tools/check/` or `tests/run-all.js`, and the note
prints. Rule 2v treats `ci-credit.mjs` apart: `gate-credit.mjs` trusts
its caller's exit code, so only the check chain may run it, while
`ci-credit.mjs` takes every fact from GitHub. Its two selftest overrides,
`LOOT_GH_CMD` (a fake `gh`) and `LOOT_HOOK_ROOT` (another checkout), would
let a hand run arm with no CI run, so rule 2v denies a `ci-credit.mjs` run
whose command sets either.

- The path rule of `e2e` (`changes` job; `e2eRuns` and `isE2eFree` in
  `ci-credit.mjs`, one rule for CI and the credit): a push of a branch other
  than `main` skips `e2e` when every path changed between its merge base
  with `origin/main` and the pushed commit is E2E-free. The E2E-free paths
  are exactly:
  - anything under `.claude/` (the hooks, prompts, skills, settings);
  - anything under `issues/`;
  - anything under `docs/` except `docs/fixtures/`;
  - any file ending in `.md`, in any directory.
  A push of `main`, a dispatch, a pull request, an empty diff or a diff that
  cannot be read always runs `e2e`. The diff is cumulative since the fork
  from `main`, so a task branch that once changed code runs `e2e` on every
  later push. `migrate-prod` and `deploy` need `changes` too.
- Late and duplicate runs: a push run can appear minutes after the push, and
  twice (the `c329dcc7` push of 2026-10-21 showed after about 7.5 min, as
  two runs). Push and dispatch runs of one branch share the concurrency
  group `ci-refs/heads/<branch>` with `cancel-in-progress`, so the newest
  survives. The credit takes the newest push or dispatch run of the sha in
  one `gh run list --workflow ci.yml --commit <sha>` call and waits up to
  600 s for it. Never dispatch CI by hand for a pushed commit (owner,
  2026-10-21: two late push runs cancelled a hand dispatch); wait for the
  push run.

- Red outside `e2e`: read `gh run view <id> --log-failed`; the fix is a
  new commit and a new push. A failed or cancelled `e2e` alone (a newer
  pending `e2e` of another run took the `e2e-test-project` slot, which also
  cancels `main`'s pending `e2e` and skips its `migrate-prod` and
  `deploy`, or the test host stalled): re-run it once with `gh run rerun
  <id> --failed`, then the credit again; a second failure needs a new push.
  A run cancelled by a newer push of the branch: credit the newer run. `gh` missing, signed out or
  offline: the script names the cause and writes nothing; the offline path
  is `npm run check` (main session, background), `npm run check:built`,
  `node tests/run-all.js --shard=n/5` per call, `npm run check:db`, and
  `db:push` plus `npm run e2e`.
- A golden that CI finds missing or changed: `tests/app/golden.js` writes
  the text `--update` would write to `test-output/golden/<slug>.txt` and
  names the path in the failure line; the `browser` job uploads
  `test-output/` on failure. Take it with `gh run download <id> --pattern
  "failure-output-browser-*" --dir <scratch>`, copy the `golden/*.txt` files
  into `tests/app/snapshots/`, read the diff, commit and push; or re-seed
  locally with `node tests/app/golden.js --update --only=<id>` after `npm
  run build:test`.
- A CI `e2e` and a local `db:push` or `npm run e2e` are each a session on
  the test project. Before a local one, run `gh run list --workflow ci.yml
  --status in_progress --json databaseId,headBranch` once; for a listed run,
  wait with one background `gh run watch <id> --exit-status`.
- Every branch merges the latest `origin/main` before each push, never a
  rebase (owner, 2026-10-22). Closeout: push, credit; then in the main
  checkout `git pull`, `git merge --squash <branch>`, `node
  E:/dev/daggerheart-loot/.claude/hooks/ci-credit.mjs <tip sha>` (the
  squash put the script in the main checkout's working tree), commit, push
  `main` (rule 2x checks the key), and delete the remote task branch after
  `main`'s run is green.

**The fast pre-check.** `rtk npm run check:fast` (one call, Bash timeout
600000) finds the cheap failures before a push pays for a CI run, and its
exit 0 arms the task-branch commit gate: the chain is `gate-credit.mjs begin
check-fast`, `tools/check/fast.mjs`, `gate-credit.mjs arm check-fast`, which
writes `.check-fast-pass.json` and prints `gate credit: armed (npm run
check:fast exited 0)`. Rule 2e accepts that record on a branch other than
`main` only.
`tools/check/fast.mjs` takes the paths changed against `HEAD` (or
`--base=<rev>`) and untracked files, then runs, stopping at the first
failure:
1. `stages`: `node tools/check/run.mjs --only=format,typecheck,test:golden`
   (prettier, svelte-check, and the 1 s test that reads every golden
   snapshot). A passing typecheck is recorded, so a later local `npm run
   check` skips it.
2. `vitest` (when a path under `app/src/` changed): `vitest related` on the
   changed files, with coverage and its per-file thresholds limited to the
   changed sources.
3. `budget` (when app code or the build changed): `npm run build`, then
   `npm run budget`.
Each step prints `check:fast: <step> passed (<s> s)` or `failed (exit <n>)`;
the last line is `check:fast: PASS in <s> s - this arms the task-branch
commit gate; ...` or `check:fast: FAIL at <step>`. A change to a module that
most files import (`lib/dict.ts`, `state/app.svelte.ts`) makes the related
run close to the whole vitest stage. Measured 215-310 s (2026-10-07).

**Stage cache.** Between `begin` and `arm`, the `npm run check` chain runs
`node --test tools/check/lib.test.mjs` (`check:fast` does not, so the guards
G1-G3 below run only in `npm run check` and in CI) and then
`node tools/check/run.mjs`, which runs
the stages one at a time in the order of `STAGES` in `tools/check/lib.mjs`
(`docs/decisions/`, 2026-10-07, "A local check skips a stage whose inputs
match its last local pass"). Four stages are cached: `lint:typed` and
`typecheck` (selector `TYPED`), `selftest` (`HOOKS`, plus `git --version`)
and `vitest` (`VITEST`). Every other stage always runs; prettier and the
untyped ESLint half use their own caches.

- The key of a cached stage is a sha256 over the stage name, its command,
  Node's version, the platform, the arch and every `git ls-files -s` row its
  selector selects, after `git add -A` on a copy of the index (the commit
  gate's view of the tree; `tree-key.mjs`, `indexRows`). `package.json`,
  `package-lock.json`, `.nvmrc`, `tools/check/` and
  `.claude/hooks/tree-key.mjs` are in every key. The runner takes the key
  before the stage and again after its exit 0, and records it only when
  the two are equal.
- When a key matches one of the stage's last 8 passes, the run prints
  `check: <stage> skipped - inputs unchanged since its pass at <YYYY-MM-DD
  HH:MM>`. The last line is `check: <n> stages run, <m> skipped (<names>),
  <s> s`. A failure prints `check: <stage> exited <code>` and stops the
  chain, so `arm` does not run. A stage that cannot start prints
  `check: <stage> could not start (<code>)`.
- The store is `node_modules/.cache/check/<stage>.json` (a `:` in a stage
  name becomes `-`). Each snapshot copies the index to `index-<pid>` beside
  the store and deletes the copy after it. Each worktree has its own store;
  `npm ci` deletes it.
- A run that skips vitest prints no coverage summary, so
  `check-observer.mjs` says `npm run check: PASS - armed by the check's own
  exit.` A run that runs vitest still ends with `npm run check: PASS.
  Commit gate armed`.
- To force a full run: `node tools/check/run.mjs --forget` (deletes
  `node_modules/.cache/prettier/`, `eslint/` and `check/`), then `rtk npm
  run check`. `CHECK_CACHE=off`, or `CI` set to any non-empty value, deletes the
  same three directories, runs every stage and writes no record. CI's check
  step sets `CHECK_CACHE: 'off'` (`tests/derived.js` pins the line).
- The guards G1-G3 in `tools/check/lib.test.mjs` fail with the stage and
  the path to add when a vitest file, the selftest or the typed files read
  a path that their selector does not select. G1 finds a path that a
  vitest file builds with `join` or `resolve` on `import.meta.dirname` or on
  a constant, and any string literal that starts with `../` and leaves
  `app/` (`require`, `new URL`, `import.meta.glob`). G1 does not follow the
  reads of a required module, so it lists `data.js` (loaded by
  `tools/build-share-pages.js`) by hand. A path built in a new shape can
  pass them; the uncached CI run is the backstop. Selftest #314-#316
  cover `indexRows`.

**More host facts about a long check, recorded so nobody re-derives them:**

- The host (owner, 2026-10-07): ASUS ZenBook UX433FA, Intel Core i7-8565U
  (15 W, 4 cores and 8 threads, base 1.8 GHz, throttles under sustained
  all-core load), 15.8 GB RAM with about 4.2 GB free, commit limit 31.6 GB
  with 7.7 GB free, one QLC NVMe SSD, the repository on an 80 GB ReFS Dev
  Drive (E:), power plan Balanced, Node v24.15.0, Windows 11. Skip work; do
  not parallelise. Run two stages at once at most, never beside vitest, and
  only after a measurement.
- Prettier and the untyped ESLint half keep their own per-file caches under
  `node_modules/.cache/prettier/` and `node_modules/.cache/eslint/`. `npm ci`
  deletes them, and each worktree has its own. To force a cold run, delete
  `node_modules/.cache/`.
- Never put `--cache` on the typed ESLint half (`lint:typed`) or on `eslint
  .`: a typed rule reads other files' types, and ESLint's cache keys a
  result on the file's own content (`docs/decisions/`, 2026-10-07, "A local check skips a stage whose
  inputs match its last local pass"). Never let ESLint write
  `.eslintcache` to the repository root: it is not gitignored and moves the
  tree key.
- Four vitest tests failed under host load (2026-10-07): "picks and
  removes in every picker" at its 30 s timeout (3.5 s on an idle host),
  "draws 20 list blocks ... for 1000 lists" at 3213.6 ms against its 3000 ms
  bound, the field help case "names its field, starts closed ..." at 30 s
  in two full runs in a row (5.3 s alone), and "draws 20 rows of 60
  sources" at 30 s in a 682 s run. All four now run in the `timed` vitest
  project (`homebrewEditor.timed.test.ts`, `importPanel.timed.test.ts`,
  `homebrewImport.timed.test.ts`; `vite.config.mts`): one file at a time,
  after every `unit` file, in the same run and coverage report. A new
  timing bound, or a case that passes 30 s under load, goes to a
  `*.timed.test.ts` file with its helpers in `app/src/test/`; the timeout
  stays 30 s.
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
- A secret-shaped literal never sits under a key-like name or in a task
  document as itself: a `.check-cache.json` tree key there becomes a
  placeholder (`<key-A>`..), and a test names a base32 alphabet `BASE32`, never `KEYS`.
  `secrets` (`generic-api-key`; gitleaks 8.24.3 scans the commit diff, a
  local 8.30.1 file scan missed the second, 2026-10-23) flagged both; the
  owner's standing answer: a placeholder, never a `.gitleaks.toml` entry.
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
- Docker is Rancher Desktop 1.24 (engine 29.5.3, measured 2026-09-24);
  Docker Desktop 3.6.0 is unused (its client panicked on `docker info`).
  Its `C:\Program Files\Docker\Docker\resources\bin\docker.exe` still comes
  first on the PATH of an agent's PowerShell (2026-10-21): `docker info`
  panics ("indirection through nil pointer") although Rancher's engine is up.
  Put `C:\Program Files\Rancher Desktop\resources\resources\win32\bin` first
  on that one call's PATH (`$env:PATH = "<dir>;" + $env:PATH; npm run
  check:db`). `rdctl start` on an app that is up without its VM says "no
  settings to change were given" and `rdctl info` says "can't open
  '/run/wsl-init.pid'": run `rdctl shutdown`, then `rdctl start`.
  Git Bash hangs on `docker version`: run `docker`, `npx supabase` and
  `npm run check:db` through PowerShell. Never run plain `npx supabase
  start`: the full stack's `supabase_vector` restart-loops, and `check:db`
  starts its own trimmed stack (`LOCAL_STACK_EXCLUDES`). Stop the
  stack and Rancher Desktop (`rdctl shutdown`) before `npm run check` and
  at a batch end: the WSL VM timed out heavy vitest cases (2026-10-07).
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
- The Browser pane opens a design mock only from `mocks/index.html` and from
  a page copied to the one path `m23-editor-feedback.html` of that
  directory (measured 2026-10-01); it refuses every other mock path. A page
  copied there stays under about 88 000 URL-encoded characters. A 360 px
  check of a mock runs on such a copy.

### Code navigation

No language server and no ast-grep run on this host since 2026-09-30
(`docs/decisions/`, 2026-09-30, "Agents search with grep; no language server
and no ast-grep"). The `svelte-lsp` and `typescript-lsp` plugins held up to
800 MB each in long multi-agent sessions, and across 665 session transcripts
agents made 18 LSP calls and no ast-grep search (`ast-grep --version` only).

- **`rtk grep`** for plain text - code, comments, strings, config values,
  documentation, filenames. It needs `-E` for alternation: `rtk grep "a|b"`
  matches nothing and exits 1, which reads as "absent" and produced one
  wrong conclusion on 2026-09-18 before it was caught.
- **`git grep`** takes alternation without a flag and is faster than a
  recursive `rtk grep` over a tracked tree; a recursive `rtk grep` over
  `.claude`/`docs` outlived a 120s Bash timeout on 2026-09-18.
- Before a rename or a signature change, search for every use of the name,
  imports and re-exports included. Type errors come from the project's own
  gate, `npm run check`.

Do not use raw `grep -n`; `bash-guard.mjs` rule 2j blocks the shapes RTK
cannot rewrite. Rule 2w blocks `grep`, `rg`, `cat`, `ls` and other commands
RTK bounds when a pipe sends their output into `head` or `tail`; cap a
search with `rtk grep --max <n>` (not with `-l`/`-c`/`-o`, which it does not cap).

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
| a CI run (push to the last gate job) | 10.5-11.5 min, about 65 runner-minutes, no Actions cost (public repository; runs 39563712504 and 39599556984, 2026-10-21) | remote; the orchestrator waits with one background `ci-credit.mjs` call ("CI credit") |
| `npm run check:fast` | 215-310 s (2026-10-07); 474-479 s when a merge of `main` puts every vitest file in the related run (2026-10-21), 841 s for the merge of R10 and CF1 (2026-10-28); 657-710 s when the changed files reach `app.test.ts` and the component suites (2026-10-22, catalog-copy, host idle); the local floor before every task-branch commit | longer; 792 s with WSL and Rancher up (2026-10-15), past 600 s it runs on in the background and still arms by its exit |
| `npm run check` | 10-18 min with nothing cached (2026-10-07); the offline path only, in the main session with `run_in_background` or the owner's terminal | past the Bash tool's 600s foreground cap; it arms the commit gate by its own exit ("Gate credit") - wait for its exit, then confirm `.check-cache.json` before the commit |
| `npm run check:built` | a few minutes | longer |
| `node tests/run-all.js app/print,app/contracts,app/states,app/typo,app/hues,stub` | ~260-290s pooled | longer; 723 s with WSL and Rancher up (2026-10-15) |
| `node tests/app/sweep.js <width>` | ~320-590s per width | longer; CI's `browser` matrix runs every width; locally (the offline path) run `node tests/run-all.js --shard=n/5` per call |
| `node tests/app/golden.js --shard=n/4` | ~100-290s per shard | longer; CI's `browser` matrix runs every shard; a batch that adds states re-seeds them with `--update --only=<id>` or takes CI's text ("CI credit") |
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

Re-measured on this host on 2026-10-07, loaded (CPU 94 %, 29 node
processes, 4.3 GB free), per stage: the hook selftest (1467 cases) 563 s,
then 253 s at 26 % CPU (1864 cases: 434 s, 2026-10-22); prettier 35 s
cold and 8 s with a warm `--cache`; ESLint over the typed half (243 files)
85 s and over the untyped half (103 files) 10.6 s, `eslint .` 116 s; the
seven `node --test` calls 4.3 s together; one tree key 0.17-0.33 s.
`npm run check` prints no per-stage time: time a stage alone, and only on
an idle host.

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
and the filter silently matches nothing. With `--update`, the closing line
still reads `structural snapshots (dist-test/): unchanged` after it wrote
files (measured 2026-10-15): read `git status -- tests/app/snapshots` for
what moved. Separately, `npm run check`'s own
`npm run data` step can move `data.json`/`catalog.csv` mtimes with unchanged
content, so a build run before the check no longer satisfies the
stale-build guard - rebuild after the check (`npm run build:test` before any
`dist-test/`-driven suite or golden probe, `npm run build` before
`tools/smoke-http.mjs`).

Every `timed` state in `tests/app/inventory.js` opens with `?toasts=held`
(`d.open(..., { holdToasts: true })`): the test build keeps each toast until
the next one replaces it, and `golden.js`'s `waitForToast` finds it however
late the capture arrives (decision "A timed golden holds its toast until the
capture reads it"). So an `enter` may wait for the page after its press, as
`~ own item added as gm1` polls the new count. The reason: before the hold, a
1600 ms toast raised at mount or by an `enter` that polled after its press
was gone before a slow capture read it ("the toast never appeared", measured
2026-09-30 on `#/s/player-token-1 ~ sent` and `#/l/ ~ every entry gone`).
The shipped build never reads the parameter.

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
`sharedListPage.test.ts`); both files passed alone. A restart cleared it and
the next check was green.

A runaway editor language server is the usual daytime cause of a check
that runs 2-10 times slower: `svelte-language-server` (`node ...
svelte-language-server\bin\server.js --stdio`) or `tsserver`. Measured
2026-09-23 (a check of about 40 min, about 5 min after the kill) and
2026-09-30 (a svelte server at 3868 CPU-s in about one hour, two
`tsserver`s at 1443 and 687 CPU-s). The owner allows any agent to stop
such a server above about 500 CPU-s without asking: `Stop-Process -Id <pid>
-Force`. The editor plugin starts it again on demand. Then run the check
once more. The plugins were removed on 2026-09-30 ("Code navigation"), so
this cause applies only if a server appears again. The other cause is
Windows idle maintenance at night (about 00:20-02:00), which a daytime kill
does not fix.

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
  every launcher. Rules 2x and 2b miss `/usr/bin/git push`, a git alias
  (`git -c alias.p=push p`) and `push` after `--git-dir <p>`, `--work-tree
  <p>`, `--namespace <n>`, `--attr-source <t>`, `--exec-path=` or
  `--config-env=` (`gitSubcommand`); rule 2r finds all but an alias.
- Rule 2r trusts the `refs/remotes/origin/<branch>` a push updates like
  `origin/main`: a judged push wrote it, though maybe no `migrate-test` run
  read it (a cancelled run, `[skip ci]`). A branch with another branch's
  unmerged migration needs a batch approve (owner). Of the push config it
  reads only `push.default`, `remote.origin.push` and `remote.origin.mirror`.
- `ci-credit.mjs` reads `origin/main` by its short name (the e2e rule's
  `merge-base`, the workflow diff), so a local `origin/main` branch shadows
  the remote ref there. Owner's call: read the full ref name.
- Nothing enforces the owner's token file: no rule denies an agent's
  `--env-file=C:\Users\Ignat\.dhloot\.env.supabase-owner`. Rule 2n still
  limits a Supabase CLI target to the test project.
- The checkout of a command is read from a named script, `git -C` and the
  session's cwd. So rule 2r judges a test-project script or CLI write, and a
  push that may change `supabase/migrations`, only as one plain command and
  denies every other form (`migration-checkout-unpinned`/`push-unpinned`): a
  chained write or push, an approved one too, needs its own call; a chained
  bare or `HEAD` push denies also when it changes nothing. A non-plain named
  push is read in cwd's repository (worktrees share `refs/heads/*`), not in
  another clone. Rules 2e and 2x judge a moved command against cwd's checkout.
  The plain shape trusts the payload's `cwd`: a Bash `cd` in an earlier call
  moves it (the PowerShell tool: not measured).
- The plain shape trusts what the hook cannot see: the cwd checkout's
  `package.json` scripts and `.npmrc` (`script-shell`), an inherited
  `NODE_OPTIONS` or `npm_config_*`, and the shell profile. `db-push.mjs`
  passes `--workdir` to the CLI itself, so a `SUPABASE_WORKDIR` from an
  `--env-file` or a profile does not move it.
- A quote or an escape inside a word splits it for the sanitiser but not for
  the shell (`npm run db\:push`, `npm run db:pu''sh`, `node
  tools/supabase/db''-push.mjs`, PowerShell ``npm run db`:push``), so no rule
  finds the write. Rule 2r refuses a found write whose command holds `'`, `"`
  or a Bash `\`. Owner-declined 2026-10-22: the full fix in `sanitize`, which
  touches every rule.
- A launcher flag that takes a value hides the program from every rule:
  `unwrap` and `isSupabaseCall` skip a flag as one token, so in `env -C sub
  npm run db:push ...`, `env --chdir sub ...`, `env -u NAME ...` and `npx
  --prefix sub supabase db push ...` the program read is the flag's value.
  `env -C sub npm run db:push -- --project prod --yes` also passes rule 2n
  (`db-push.mjs` still refuses production without a TTY); rule 2r finds
  such a write by its tokens and denies it. Also not judged:
  `bash -c "..."`, `pwsh -Command "..."`, a heredoc body (`bash <<'EOF'`,
  `sh -s <<EOF`, `node --input-type=module <<'EOF'`), which the sanitiser
  drops, `Start-Process ... -WorkingDirectory` and `node -e`. Owner's call
  for the rules other than 2r: value-taking `-C`, `--chdir`, `-u` and `-S`
  in `unwrap`, which touches every rule. Owner-declined 2026-10-22: a rule
  2r scan of heredoc bodies and quoted spans.
- The `e2e` path rule (`isE2eFree` in `ci-credit.mjs`) assumes that the
  `e2e` job reads no `*.md` file and no `docs/` file outside `docs/fixtures/`.
  True on 2026-10-21; no test asserts it, so a change that makes `e2e` read
  such a file must also narrow the rule.
- Owner-declined 2026-10-22: the Micro compute upgrade (the test project stays
  on Nano and stalls under frequent E2E runs; one `e2e` re-run counts) and
  `SUPABASE_DB_URL_TEST` as a cloud environment variable (a cloud `db:push`
  fails with `LegacyDbConfigIpv6Error` without IPv6; CI's `migrate-test` is
  the normal path).
- `gh` can update `main` with no `git push`: `gh pr merge` and `gh api -X
  PATCH .../git/refs/heads/main`. Rule 2x does not see them.
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
- A desktop worktree session is the other case: the desktop app runs the
  main checkout's hook copy for it (measured 2026-09-30), so a hook change
  reaches it only when the main checkout's working tree carries the commit.
  On 2026-10-07 the opposite was seen: an implementer subagent working in a
  worktree (its session cwd the worktree) got the worktree's new
  `LONG_CHECKS` reminders for `check:fast` and the first half of the
  retired two-call check, which the main
  checkout's `bash-guard.mjs` did not have. Which copy runs may depend on
  the session type; do not rely on either. The gates read the session's checkout, `lib.mjs`'s `checkoutRoot(cwd)`:
  the commit gate's tree key and caches (`stateDir(cwd)`, the worktree's
  own `.claude/`), the reports of rule 2r, rules 2l, 2p and 2u, the
  orphan-task rule and `agent-guard.mjs`'s task directory. A worktree
  outside the main checkout's directory, or a cwd outside the repository,
  still reads the main checkout (`checkoutRoot` returns `repoRoot()`).
  The `rm` rule, `git()`'s default cwd, the remote-ref lookup, `activeTask()`, `.hook-state.json` and
  `session-start.mjs` keep the main checkout. The worktree's own
  `gate-credit.mjs` copy writes the key that the main copy's gate reads,
  so a worktree pass arms a worktree commit only while both copies have
  the same `isExempt()`. Selftest #308-#313.
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
- `agent-guard.mjs` reads a plan report name `plan-<batch>-<digits>.md` as
  a second look of `<batch>`, so a batch id that ends in `-<digits>` (for
  example `B1-2`) is judged under `B1`. Give a batch such an id only after
  the hook learns to tell the two apart.
- `session-stop.mjs` parses `git status --porcelain` with a bare
  `row.slice(3)`: a rename row (`R old -> new`) or a quoted path (spaces,
  non-ASCII) is mis-parsed, and the Stop warning names the wrong path or
  goes silent. A parser, not a one-line fix.
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
- Model default effort is `high` on every model that supports effort, except
  Opus 5.5, Sonnet 5.5 and Haiku 5.5, which default to `medium`
  (code.claude.com/docs/en/model-config, read 2026-10-08). This is why a
  single `high` reading under a `high` session proves nothing; contrast
  levels must be `low` vs `high`.
- `set_session_effort` refuses the calling session and targets sessions, not
  subagents. The Agent tool had no `effort` parameter at 2.1.284; at 2.1.293
  it has one (`low` to `max`). Its precedence against the frontmatter key is
  unmeasured, so the orchestrator does not pass it; the frontmatter key is
  per role.

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

Facts settled during measurement (`rtk-pipe-deny`, 2026-10-01): the boundary
behind rule 2w, pinned to `rtk 0.48.0`. The probe is `rtk rewrite "<command>"`:
it exits 1 with no output when it does not rewrite.

| command without the pipe | RTK output | in 2w? |
|---|---|---|
| `git status`, `git branch`, `git worktree list` | compact (`git status` 56 characters) | yes |
| `git log` | capped at 41 lines with no `-n`; `-n` is git's own limit | yes, without `-p`/`-u`/`--patch`/`-L` |
| `git log -p -3` | passthrough, 418,190 characters | no |
| `git show <sha>`, `git diff a b` | 2-31% smaller than raw, never truncated (24-71 KB) | no |
| `ls <dir>` | about 50 entries of a large directory, `-t` order kept | yes |
| `cat f` | `rtk read f`; `--max-lines <n>`/`--tail-lines <n>` bound it | yes |
| `grep`, `rg` | `rtk grep --max <n>` caps the default line mode only (1,607 characters for 20 results; 25 lines); `-l`, `-c`, `-o` ignore `--max` (`-rl function .` printed 380 KB); also reads stdin | yes, without `-l`/`-L`/`-c`/`-o`/`--files` |
| `npx vitest run <files>` | failures only (`PASS (37) FAIL (0)`, 19 characters) | yes |
| `npx vitest run --coverage` | drops the coverage table and printed `FAIL (0)` on a run that exited 1 | no |
| `npx prettier --list-different`, `npx eslint` | dedicated filters (40 and 24 characters on a clean pass); on a failing run `rtk prettier --check` prints no file names, `--list-different` (or `-l`) keeps them | yes |
| `npm run <script>` | strips only npm's own lines | no |
| `npx svelte-check` | generic `npx` passthrough, not measured | no |

- Rewrite quirks: `head -50 f` and `head --lines=50 f` rewrite to `rtk read f
  --max-lines 50`; `head -n 50 f` and `head -n50 f` do not; `tail -20 f` and
  `tail -n 20 f` rewrite, `tail -n20 f` does not; `timeout 60 npx vitest run
  x` and `npm test` do not. `rtk rg` has no `--max`.

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

## Owner insights

A reusable rule the owner states (how a mock looks, when a field gets a «?», how a
page is laid out) is written into its home in the batch that hears it: only a rule that
changes later work, in one to three lines (`docs/decisions/2026-10-07-owner-rules-are-written-to-their-homes-in.md`).

| Rule | Home | Budget |
|---|---|---|
| A rule for every signed-in page | `docs/specs/FEATURES.md`, "Consistency rules" (a numbered rule) | 20 rules; a merged or replaced rule keeps its number as a pointer; numbers are not reused |
| Other product behaviour | the `docs/specs/` file and section that own it | one to three lines in the owning section; no new section for one rule |
| Visual design | `DESIGN.md`, "Named Rules" of the section that owns it | 8 per section |
| A mock rule | `DESIGN.md`, "Do's and Don'ts" | 8 per list |
| Tooling, hooks, host and process | `.claude/README.md`, the section that owns the tool | no net lines: the rule merges, or removes as many lines as it adds |
| A choice with rejected alternatives | `docs/decisions/` (one file) | the registry's 15-line body |
| A step of one role | that role's prompt in `.claude/prompts/` | the file under its 2026-10-07 size plus 2 KB: `orchestrate.prompt.md` 35464 bytes (33416 measured), `plan.prompt.md` 16861 (14813), `review.prompt.md` 12250 (10202) |
| A mistake that agents repeat | `CLAUDE.md` ("Maintaining this file") | one imperative line; the file under 200 lines |

A rule that would go past a budget replaces or merges an older rule of that home, and the
batch names the rule it replaced. This file's budget is net zero: it was 221 KB on
2026-10-07, past the 150 KB line that the `Stop` hook applies to task documents only.

| Role | Step |
|---|---|
| Orchestrator | Tags each rule of an owner answer with its home in `context.md`, "Decisions already settled" (`orchestrate.prompt.md`, "Shared context"); the planner adds the batch. |
| Planner | Places the write as an acceptance line of a batch (`plan.prompt.md`, after "Design decisions"). |
| Reviewer | Checks in every review that a rule tagged with the batch, or stated in its sources, is in its home (`review.prompt.md`, section I). |
| Closeout | Checks every tagged rule against its home before the directory is deleted (`skills/handoff/SKILL.md`, "Finishing a task"). |

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

Production's `site_url` is `https://daggerheart-loot.pages.dev/`, and its
redirect list holds the new host's and the old host's `?auth-callback=1`
since 2026-10-28: the owner ran `npm run config:push -- --project prod` (the
provider keys from the main checkout's `.env` through `--env-file`), and
`npm run config:diff -- --project prod` printed `drift: none (4 not-owned)`.
The old callback stays until the revert window of the Cloudflare Pages move
ends.

CLI facts (2.117.0, measured 2026-09-24):

- The CLI reads its workdir from `--workdir`, else from `SUPABASE_WORKDIR`
  (the string `a!==void 0?a:o.SUPABASE_WORKDIR` in `supabase.exe`; the Go
  sidecar uses viper `SetEnvPrefix` and `AutomaticEnv`; read 2026-10-21).
  Rule 2r denies a write while either is set, and `db-push.mjs` passes
  `--workdir` itself.
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
- 2.117.0's `db dump` takes `--exclude`/`-x` (schema.name, for a data-only
  dump; a comma list or a repeated flag), and `--dry-run` shows one
  `pg_dump --exclude-table` per name (2026-10-22). The package has no
  install script: its binary is the optional package
  `@supabase/cli-<platform>-<arch>`.
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
- `supabase status -o json` names `ANON_KEY`, `PUBLISHABLE_KEY`, `JWT_SECRET`
  (HS256, a fixed local value), `SECRET_KEY` and `SERVICE_ROLE_KEY` only while
  Auth runs, else `API_URL` and `DB_URL` alone (2026-09-27); with Storage up
  it prints the local S3 key pair too (2026-10-22): read keys in a script.
  The `check:db` and drill stacks (Realtime needs the anon key and secret):
  the database, Auth, Realtime, Storage and Kong; a configured build against
  it also needs `postgrest`, which `LOCAL_STACK_EXCLUDES` leaves out. After a
  Rancher restart `supabase start` hung past 180 s with every container
  healthy (2026-10-22); stopping the CLI by hand kept the stack up.
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
| `npm run db:push -- --project test [--yes]` | the owner; an agent only when every file of `HEAD`'s `supabase/migrations` has its blob on `origin/main` or in the tree of an approving batch report under `issues/*/reviews/` (rule 2r; only as one plain command in its own call; `docs/decisions/`, 2026-09-27, "An agent pushes migrations to the test project only after an approving review"), and only while CI is down: CI's `migrate-test` applies a branch's migrations at its push | the manual path beside CI's `migrate-test`; refuses on a migration pairing error; records nothing. With `SUPABASE_DB_URL_TEST` set (the `.env.test.local` route: `node --env-file=.env.test.local tools/supabase/db-push.mjs --project test --yes`) it refuses a string that is not the test project's, asks a typed `yes` without `--yes`, and runs `tools/supabase/migrate-test.mjs` with `SUPABASE_DB_URL` set to that string in the child's environment only: file by file, each in a transaction, another branch's versions listed and not refused, and no IPv6 needed. Without it (a cloud session) the CLI path stays: dry run, then `db push`, `--yes` needs `SUPABASE_DB_PASSWORD_TEST`; it refuses while another branch's migration sits on the test project and fails with `LegacyDbConfigIpv6Error` on a host with no IPv6 route ("A new worktree" below) |
| `npm run db:push -- --project prod` | the owner, in an interactive terminal | the fallback while CI's `migrate-prod` is broken; refuses without a TTY, and refuses `--yes`; dry run, typed `yes`, `db push`; records nothing. On a host with no IPv6 route it fails with `LegacyDbConfigIpv6Error`, as the CLI path of the test project does; a pooler route for production would need `SUPABASE_DB_URL_PROD` on the host, the owner's call (2026-10-21) |
| `npm run limits:set -- --project test\|prod --user <email\|uuid> --key <key> --value <n>\|--default\|--clear\|--unlimited` | an agent only against `test` (rule 2n); `prod` the owner, in an interactive terminal | sets or removes one user's override of one count limit over `SUPABASE_DB_URL` from the environment; refuses a string that is not the named project's, a key not in `limit_defaults`, and a user that is not exactly one row; prints `before:` and `after:` (`200`, `unlimited`, `default 50`). `--clear` is `--default`: it deletes the override; an override does not lift the ceilings of one call (`FEATURES.md`, "Limits") |
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

**A new worktree.** `.worktreeinclude` at the repository root lists
`.env.test.local`, and `.gitignore` (`.env.*`) ignores it, so Claude Code
copies the file into every worktree it creates - `claude --worktree`, a
subagent with `isolation: worktree`, the desktop app's worktree sessions -
and `node --env-file=.env.test.local tools/supabase/db-push.mjs --project
test --yes` and `npm run e2e` run there with no owner step (`docs/decisions/`,
2026-10-21, "A worktree gets the test env file at creation; db:push uses the
pooler"). The file takes effect when the main checkout holds it. A worktree
made by hand (`git worktree add`), or from a main checkout without the
file, gets no copy; run from the main checkout `cp .env.test.local
.claude/worktrees/<name>/` (rule 2t judges printers, not `cp`). The copies
also reach every agent worktree, which is kept, so copies accumulate; a
task's closeout deletes its own worktree's copy only. No copy carries an
account-wide token: the file holds the four `E2E_*` names,
`E2E_USER_PASSWORD`, `SUPABASE_DB_PASSWORD_TEST` and `SUPABASE_DB_URL_TEST`,
all scoped to the test project. `SUPABASE_ACCESS_TOKEN` (a Management API
token that can reach production) lives in
`C:\Users\Ignat\.dhloot\.env.supabase-owner`, outside every checkout, and
only the owner's interactive CLI use reads it, through `--env-file`: `npm
run config:diff -- --project test --env-file
C:\Users\Ignat\.dhloot\.env.supabase-owner` (the same for `config:push`),
or `node --env-file=C:\Users\Ignat\.dhloot\.env.supabase-owner
node_modules/supabase/dist/supabase.js <command>`. Not
`~/.supabase/access-token` or the keyring: the CLI reads those for every
caller, agents included. Why the pooler route: the pinned CLI (2.117.0)
opens `db.<ref>.supabase.co:5432`, which answers on IPv6 only, and on a
failure falls back only to `supabase/.temp/pooler-url`, which only
`supabase link` writes; no checkout on this host has it, so the CLI path
fails host-wide on a network with no IPv6 route. Proven 2026-10-21 in an
agent worktree on this host: `node --env-file=.env.test.local
tools/supabase/db-push.mjs --project test --yes` took the pooler route and
printed `migrate-test: none pending` in under 1 s, exit 0. A local `npm run
e2e` from a worktree is not proven yet; CI's green `e2e` stood in for it
(owner, 2026-10-21).

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

**Expected Security Advisor warnings.** Derived from `supabase/migrations/`
at the commit that adds `20261028120000_drop_legacy_move.sql`:
the Security Advisor reports 0 errors, 24 warnings and 5 info. A
SECURITY DEFINER function whose latest grant gives `execute` to
`authenticated` is one warning, and `anon` is a second warning on the same
function. 18 functions are such definers (18 warnings), and 5 of them are
also executable by `anon` (5 more); the reasons below:

| Function | `anon` | Reason |
|---|---|---|
| `delete_account()`, `delete_account_requests()` | no | Delete the caller's `auth.users` row, and before it the purchase requests on the caller's lists 200 a call; the user is always `auth.uid()`. |
| `create_list_share`, `revoke_list_share` | no | `list_shares` has no insert or update grant; a share changes only through them, and they check the owner. |
| `get_shared_list(text, bigint, jsonb)` | yes | Builds the projection for whoever holds the token, never the table, and reads `list_shares` and `lists`, which `anon` cannot; `anon` reads the shared page. |
| `clone_shared_list` | no | Copies a list that the caller reaches only through the token. |
| `create_purchase_request` | yes | A share link's holder sends a request signed out; `purchase_requests` has no insert grant. |
| `apply_purchase_request`, `decline_purchase_request` | no | The owner decides a request: they write the owner's list and a request row that no Data API role may write. |
| `my_limit` | no | Shows the account its own effective limit; the limit tables have no Data API grant. |
| `mark_list_read` | no | Sets read times with the database clock and caps a request's expiry; `list_notices` and `purchase_requests` are read-only to the user. |
| `get_homebrew_item` | yes | Returns one item to whoever holds its random id, without the owner or another uuid, never the table. |
| `get_homebrew_items` | no | Reads up to 1000 items of any owner by id for a signed-in caller, as `get_homebrew_item` reads one; row level security shows the caller only its own items. |
| `homebrew_art_room` | no | Counts the caller's files in `storage.objects`, which the user cannot read. |
| `create_print_set`, `get_print_set` | no | `print_sets` has no Data API grant; the functions store and read a sheet and move `opened_at`. |
| `get_item_preview`, `get_shared_list_preview` | yes | The link-card Worker reads the card of an item or share link by its id or token, signed out, and never the table. |

A definer that is a trigger function,
or that is revoked from `public`, `anon` and `authenticated`, adds no
warning (the count and limit triggers, the broadcast triggers,
`effective_limit`, `homebrew_links_touch`), and every `security invoker`
function adds none (`reorder_list`, the two older `get_shared_list` forms and
`delete_homebrew_items` among them). The 24th warning is
leaked password protection, which is off because there is no password
sign-in (Google and Discord only). The five info are "RLS enabled, no
policy" for `homebrew_art_released`, `limit_defaults`, `print_sets`,
`usage_snapshots` and `user_limit_overrides`, by design: no Data API role
reads them. A warning that is not in this list stops the release until a
review accepts it and adds it here with its reason.

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
`tests/derived.js` pins both secrets over every workflow file. The three
jobs that read the `production` Environment install with `npm ci
--ignore-scripts` and pin each action by its full commit sha, the major tag
as a comment (`# v5`); `tests/derived.js` holds both rules for every job
that declares `environment: production`. Move the pins in the commit that
moves the other jobs' major tags: `gh api repos/<owner>/<repo>/commits/<tag>
--jq .sha`. A workflow
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

**Measure the test project.** The test project is a small host in
eu-west-1: 2 CPUs (aarch64), 426 MB of RAM and swap in use. A timing on it
varies about 1.5-2 times at the same state (measured 2026-09-30), so a bound
needs that margin. The host counters come from the metrics endpoint,
`GET https://<ref>.supabase.co/customer/v1/privileged/metrics`, with basic
auth `service_role` and `E2E_SUPABASE_SECRET_KEY` from `.env.test.local`; it
refreshes about once a minute. Print only the lines you need, and never the
key. To get the server time of an RPC without the upload, run
`EXPLAIN (ANALYZE, BUFFERS) select public.<rpc>(...)` over
`SUPABASE_DB_URL_TEST` as `authenticated`, with `request.jwt.claims` set,
in a transaction that always rolls back; run `set constraints all
immediate` before the rollback to time the deferred triggers too.
`pg_stat_statements` holds each RPC's mean and maximum time since its last
reset. A client time in the e2e log includes the upload from the runner and
PostgREST's parse; the 8 s statement timeout of `authenticated` bounds only
the database's part. `docs/DECISIONS.md`, 2026-09-30, "The list_entries
touch and limit triggers run once per statement".

**The configured bundle budget.** `tools/bundle-budget.mjs` has two limits:
253 kB for the unconfigured build and 311 kB for the configured one, which
carries the account client chunk. A batch whose total passes a budget raises
it to the measured total rounded up to the next whole kB (a printed 250.3
gives 251; the tool compares the unrounded total, so a printed whole number
such as 251.0 can pass 251: add 1 kB), never past 350 kB configured and 270 kB
unconfigured (owner, 2026-10-22: "we can increase it up to 270
defensively"). `npm run check:built` builds `dist/`
unconfigured and so measures only the 253 kB limit. The 311 kB limit runs in
CI's `e2e` job, after `npm run e2e` leaves the configured build in `dist/`,
and in `deploy`. The lists release passed `check:built` locally and failed
this step in CI (run 36228323330). A batch that adds code to the app or to
`ports/supabase.ts` also runs this line from the repository root; it reads
the test project's two public values from `.env.test.local`, and `buildEnv`
drops every `E2E_*` name, the secret key included, before the build:

```text
node --env-file=.env.test.local --input-type=module -e "import { buildEnv } from './tests/e2e/lib.mjs'; import { spawnSync } from 'node:child_process'; process.exit(spawnSync('npm run build && npm run budget', { shell: true, stdio: 'inherit', env: buildEnv(process.env) }).status ?? 1);"
```

Expected: `within the 311 kB budget (with the account client chunk)`; 310.6 kB
on 2026-10-22 at `persist-review` (the homebrew pages' folds, focus and long
names, five new strings and four changed in two languages), 252.6 kB
unconfigured, from 308.5 and 250.7 before it; 308.5 kB the same day (the print
sheet's screen scale and two print headings), 250.7 kB unconfigured; 308.1 kB the same day (the requests
panel's load line, the
unknown list row, the index's save status, five strings in two languages),
250.3 kB unconfigured, from 307.0 and 249.0 before it; 306.0 kB on 2026-10-21
at `debt-cleanup` (the folded print vectors, the Items tab's
filter, the status regions, the page help, the six-tab header), 248.0 kB
unconfigured; 296.8 kB on 2026-10-16 at `debt-cleanup` (the account client from
four packages, 4.0 kB under 300.8 kB before it), 239.1 kB unconfigured; 299.4 kB
on 2026-10-15 at `authoring-print-preview` (the editor's print view, the clip
report, five strings in two languages), 238.2 kB unconfigured, which leaves 50.6
kB under the 350 kB ceiling; 297.5 kB on 2026-10-15 at `rich-descriptions` (the
formatted text box, its toolbar and the two-language forms), 236.3 kB
unconfigured, which leaves 52.5 kB under the 350 kB ceiling; 290.9 kB on
2026-10-14 at `print-snapshots` (every print a stored set: the pure module, the
print page states, the three prompts, eight strings in two languages), 229.8 kB
unconfigured, which leaves 59.1 kB under the 350 kB ceiling (owner, 2026-10-14)
for `debt-cleanup` and R10; 288.8 kB on 2026-10-14 at R8 (own pictures: the
field, the lazy crop dialog of 2.3 kB plus 0.6 kB CSS, the media port), 228.0 kB
unconfigured. 282.0 kB on 2026-10-14 with R8's storage calls, 221.4 kB
unconfigured; 264.2 kB on 2026-10-02 at R7d's closeout, rebased on the search's
Snowball stemmers and ranking, with the homebrew import, the bulk move, the
downloads and the export byte warning, 204.4 kB unconfigured (260.9 kB on
2026-10-02 at R7d before the rebase, 10.3 kB of it the lazy import and file
chunks: `HomebrewImport` 5.6 kB, its CSS 0.5 kB, `homebrewFile` 4.2 kB, 201.1 kB
unconfigured; 246.0 kB on 2026-10-02 with the search's stemmers, 186.6 kB
unconfigured; 242.8 kB on 2026-10-02 with the revision-keyed reads and the
frozen-copy byte limit, 183.4 kB unconfigured; 242.2 kB on 2026-10-02 with the
homebrew editor's field help, 183.1 kB unconfigured; 236.6 kB on 2026-10-01 with
the homebrew relations, 177.6 kB unconfigured; 224.8 kB on 2026-10-01 with
homebrew in the catalog pages, 165.9 kB unconfigured; 220.8 kB on 2026-09-30
with the homebrew pages, 203.0 kB before them, after the import and export and
the requests polish; 184.5 kB on 2026-09-27 with the Realtime client, 178.2 kB
on 2026-09-26). `dist/` stays configured until `npm run build` or `check:built`
rebuilds it. A batch raises a passed budget in the same commit by the rule
above, and past a ceiling it stops and asks the owner. Decisions: "The
configured bundle budget is 210 kB; the unconfigured stays 150 kB", amended by
"The bundle budget steps up per batch to 250 kB configured and 190
unconfigured", amended by "The bundle ceilings rise to 300 kB configured and
250 unconfigured", amended by "The configured bundle ceiling rises to 350 kB",
amended by "The unconfigured bundle ceiling rises to 270 kB".

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

The scheduled clean-up: `20261007120000_lifecycle_cleanup` creates the
`pg_cron` extension (`with schema pg_catalog`, the form the Supabase docs
name; the local probe of 2026-10-07 needed no extra grant to `postgres`) and
the job `dhloot-lifecycle`, which runs `select public.lifecycle_cleanup()`
at minute 7 of every hour as `postgres` on the local stack and on both
hosted projects (`docs/specs/META.md` section 3). The local stack runs it
too, so a layer 3 case seeds its rows inside one rolled-back transaction.
The owner reads the last runs read-only in the dashboard SQL editor:

```sql
select jobid, status, return_message, start_time from cron.job_run_details order by start_time desc limit 5
```

Expected: `succeeded` rows an hour apart. `return_message` holds the
command tag (`SELECT 1`), not the function's answer `{ "requests": n,
"shares": n, "runs": n, "notices": n, "files": n }`; run the function by
hand to see the counts, which deletes for real. The nightly
usage report's `lifecycle` row warns on a failed or missing run ("Usage
monitoring").

**Own pictures and the file deletion.** `20261014120000_homebrew_art`
makes the public Storage bucket `homebrew-art` (200 KB, WebP and JPEG), its
insert policy `homebrew_art_insert` on `storage.objects`, the column
`homebrew_items.art`, the extension `pg_net` (`with schema extensions`; its
functions live in `net`) and the two triggers that delete a file through
the Storage API when no item names it; the hourly `lifecycle_cleanup()`
deletes the rest (`docs/decisions/`, 2026-10-14, "Own pictures are
random-named files the database deletes"). The local stack runs
`storage-api` for it (`LOCAL_STACK_EXCLUDES` no longer excludes it). Each
hosted project needs two Vault secrets, set once by the owner in the
dashboard's SQL editor and never in a migration or a chat:

```sql
select vault.create_secret('https://<ref>.supabase.co', 'dhloot_api_url');
select vault.create_secret('<a secret key made for this use only>', 'dhloot_storage_key');
```

Expected: `select name from vault.secrets` lists both. Without them no file
is deleted, every write still succeeds, and the usage report's `lifecycle`
row warns "the picture clean-up has no storage key" once the bucket holds
a file. Revoke the key alone (Project Settings, API Keys) if it leaks.
Done on both projects (owner, 2026-10-08). The owner's reads of 2026-10-08,
the same on both projects: `pg_net` not installed before R8,
`default_version` 0.20.4, `postgres` with `rolbypassrls` true, and the
only foreign key on `storage.objects` is `objects_bucketId_fkey` (none to
`auth.users`, so `delete_account()` never waits for files).

The owner checks the JPEG path once after the release push, on an iPhone
(Safari encodes no WebP, and no gate runs Safari): choose a photo for an own
item, crop it, save, then open the item and its `#/h/` address. Expected:
the picture draws on both, and its file name ends in `.jpg`.

The local probe (2026-10-14, CLI 2.117.0):

- `pg_net` 0.20.4; `net.http_delete(url text, params jsonb, headers jsonb,
  timeout_milliseconds integer, body jsonb)` returns `bigint`; `postgres`
  executes it and selects `vault.decrypted_secrets`. `art_delete` calls it
  with named arguments, so another version's extra parameter is harmless.
  pg_net refuses a malformed address with an exception, which
  `art_delete` catches (the db suite's failing-call case uses one).
- `net.http_request_queue` grants every privilege to `PUBLIC`, and `net`
  is usable by `anon` and `authenticated`; the owner is `supabase_admin`,
  so a migration cannot revoke it. No API role reaches it: `net` is not in
  `[api] schemas`, which `homebrew-art.test.mjs` pins. A queued request
  holds the key until the worker sends it.
- `service_role` selects `vault.secrets` and `vault.decrypted_secrets`;
  `anon` and `authenticated` do not. The secret key already holds every
  power the storage key gives.
- `storage.objects` has the triggers `update_objects_updated_at` and
  `protect_objects_delete`; the second refuses a delete from SQL unless
  the transaction sets `storage.allow_delete_query` to `true` (only the
  db suite does, for the rows of its committed lock case). An insert from
  SQL as `postgres` works, so the db suite seeds objects directly.
- An upload through the local gateway with a member's token and the insert
  policy alone answered 200 and stored the member's id in `owner_id` (and
  `owner`): no select policy is needed. The same name again answered HTTP
  400 with `statusCode` "409" (`KeyAlreadyExists`); a name the policy
  refuses answered 400 with `statusCode` "403". A public read answered 200
  with `access-control-allow-origin: *`, `cache-control: max-age=31536000`
  and no owner in a header; `object/info/public/...` holds no `owner_id`.
- A `DELETE /storage/v1/object/homebrew-art/<name>` with the local secret
  key in the `apikey` header alone answered 200, and the public address
  then answered 400. On the test project (first `npm run e2e` after the
  push, 2026-10-14) the release trigger's requests answered 200
  "Successfully deleted" in `net._http_response`, and contract case Q
  passed: the object info answered 400 or 404 within 30 s after a removal
  and after an account deletion. The public address of a deleted file
  that had been read once still answered 200 through the CDN, so uploads
  ask for a bounded cache age: `cacheControl` 86400, one day, against
  readers' egress (`docs/decisions/2026-10-14-own-pictures-are-random-named-files-the-database-deletes.md`).

### Backups and restore

`.github/workflows/backup.yml` dumps production every night at 03:17 UTC
and on dispatch: `schema.sql` and `data.sql` (the `auth` and `public` rows
without the Auth session tables and the token sequence: `DUMP_EXCLUDES` in
`tools/supabase/lib.mjs`), each encrypted to the owner's `age` public key (the Actions variable
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

Sunday's run (`date -u +%u` is 7), or a dispatch with `-f art=true`, also
copies the public picture bucket: `tools/supabase/backup-art.mjs` lists the
names over the same connection string, downloads each own picture file from
its public address, 8 at a time (no key: the bucket is public), and the
step tars them as `art.tar`, encrypts it as `art.tar.age` and deletes the
plain files. A file deleted between the list and its download (400 or 404)
is counted and skipped; any other answer fails the job. Weekly, not
nightly (owner, Q8-10 a, 2026-10-07): a full copy downloads the whole
bucket, and a nightly one would pass the free plan's 5 GB of egress at
about 170 MB of pictures; a restore can lose up to 7 days of new
pictures, whose items then draw the placeholder. `npm run restore:drill`
opens `art.tar.age` and counts its files when the artifact holds it.

The restore keeps the pictures only through its order: `TRUNCATE` of the
`public` tables fires no row trigger, the `auth` rows are deleted after the
items are gone, and the load runs with `session_replication_role =
replica`, so the owner check refuses no restored picture and no file
delete is queued (`tests/db/restore-prod.test.mjs` guards it). A restore
by `DELETE`, or a load without `replica`, would queue the deletion of every
production picture or stop at the first restored one.

Restore the picture files (owner only, after the rows): decrypt and unpack
the tar, then `npx supabase storage cp -r <dir>/art/p ss:///homebrew-art/p
--experimental` and the same for `t`, with the CLI linked to the project.
Expected: the restored items draw their pictures. A restored file has no
`owner_id` (the CLI uploads as the service role): the restored item keeps
naming it, but no other item can newly name it. A new project needs the
two Vault secrets of "Supabase configuration" before its first picture
write.

**A restore signs readers out.** The nightly dump and the safety backup of
`restore:prod` leave out `auth.sessions`, `auth.refresh_tokens`,
`auth.mfa_amr_claims`, `auth.flow_state`, `auth.saml_relay_states` and the
sequence `auth.refresh_tokens_id_seq` (`docs/decisions/`, 2026-10-22, "The
nightly backup leaves out the Auth sessions"). The restore deletes each user
the backup holds by key, whose sessions, refresh tokens and MFA claims go by
cascade, and loads none back, so each restored reader signs in again once on
each device. A restore of a backup that holds the session tables also signs
out nearly every reader active since the night: with rotation on and a
3600 s `jwt_expiry`, a device that refreshed once after the backup holds a
token that the restore deletes. A reader created after the backup keeps its
sessions. An app open during the
restore keeps its access token up to 3600 s, and it reads and writes the
restored rows until its next refresh. The undo signs out every reader that
production held at the restore. An artifact made before `backup.yml` took
`--exclude` holds the tables until it expires (30 days) and restores as
before; its rows line shows 0 now for the session tables, because the safety
backup leaves them out.

**Remove a reported picture.** In the SQL editor, `update
public.homebrew_items set art = null where art = '<the p/ name>'`.
Expected: the release trigger queues the deletes of both files, and the
Storage API's `object/info/public/homebrew-art/<name>` answers 400 or 404
within a minute (observed on the test project, 2026-10-14: within 30 s). The
public address may still answer from a CDN copy that a reader made before:
expect 400 or 404 within a day, the upload's cache age (a bound from the
cache age, not a measurement).

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
off while it loads. `npm run restore:drill` and `npm run restore:prod` pause
the hourly clean-up job `dhloot-lifecycle` (`cron.alter_job(jobid, active
:= false)`) for the load and the count or the verify, and activate it again
after, also on a failure (`tools/supabase/restore.mjs`,
`withLifecyclePaused`): a run in between would delete loaded rows past
their retention and change the count. A target without the job (no
`pg_cron`, or a schema from before `20261007120000_lifecycle_cleanup`) loads
as before. By hand, run the same pause before step 3 or 6 and `active :=
true` after.

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
   string (the session pooler, port 5432). Expected: exit 0. A backup made
   with `--exclude` puts no production session in the test project; an older
   one does until it expires.
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
   the ids the dump holds, children first - `identities`, `users` for a
   backup without the session tables; `flow_state`, `identities`,
   `mfa_amr_claims`, `refresh_tokens`, `sessions`, `users` for an older one;
   the file `data.sql`; then, when the dump holds `refresh_tokens`, `SELECT
   pg_catalog.setval('"auth"."refresh_tokens_id_seq"',
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
   `pending_requests_per_list`; `20260930130000_homebrew.sql` adds
   `homebrew_books_per_owner` 20 and `homebrew_items_per_owner` 100;
   `20261001130000_homebrew_relations.sql` adds `homebrew_cards_per_owner`
   100; `20261002120000_read_scale.sql` adds `snapshot_bytes_per_list`
   1048576, without which every statement that writes a frozen copy raises
   `22023`), and every call that reads a missing key raises `unknown limit
   key`. Run `select key, value from public.limit_defaults order by key;`.
   Expected: `entries_per_list`, `homebrew_books_per_owner`,
   `homebrew_cards_per_owner`, `homebrew_items_per_owner`, `lists_per_owner`,
   `pending_requests_per_list`, `request_lines` and `snapshot_bytes_per_list`.
   For each missing key, insert it at its migration's default, for example
   `insert into public.limit_defaults (key, value) values ('request_lines',
   100), ('pending_requests_per_list', 10), ('homebrew_books_per_owner', 20),
   ('homebrew_cards_per_owner', 100), ('homebrew_items_per_owner', 100),
   ('snapshot_bytes_per_list', 1048576) on conflict (key) do nothing;`, and
   run the check again.

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

The reversal of `20260930120000_import_lists_ceiling` narrows
`import_lists()` from 1000 lists per call back to 50: a v1 file of more
than 50 lists written since then stops importing. Reverting the app alone
is enough: the widened function takes every call of the old frontend. To
narrow the function too, make two pushes, because `migrate-prod` runs
before `deploy` in one push: first the app revert, then a new migration
whose body is the reversal file.

To undo R7 (`20260930130000_homebrew`), revert the app alone: the old
frontend writes official list entries only, which the new `list_entries`
checks take. Run the homebrew reversal only after a backup, and only when
the tables must go: it deletes every homebrew source, every homebrew item
and every homebrew list entry.

To undo `20261001120000_homebrew_damage_bonus`, revert the app alone: the
old frontend writes a damage bonus of +1..+20, which the widened
`homebrew_content_valid()` takes. Narrow the database too only as a second
push, a new migration whose body is the reversal file, and only after a
read finds no item and no frozen list entry with a bonus past +20. A CHECK
runs on every UPDATE: after the narrowing, such an item refuses every save,
a `list_entries` row whose frozen snapshot holds such a bonus refuses every
write (in any user's list; an `apply_list_writes` batch that touches it
fails whole), and a backup restore into the narrowed database refuses those
rows.

To undo `20261001130000_homebrew_relations`, revert the app alone: the old
frontend writes items with no relation key and never reads
`homebrew_cards`, and the widened validators take its writes; a projection
then still embeds the cards the items name. Narrow the database too only as
a second push, a new migration whose body is the reversal file, and only
after a read finds no item that holds `craft`, `craft_from`, `set`, `refs`
or `eq.line`, no list entry whose snapshot holds `cards`, and no card the
owner wants to keep. The reversal deletes every card and fails while a
frozen snapshot is larger than 32768 bytes; after it, an item with a
relation key refuses every save, a list entry whose snapshot holds cards
refuses every write (an `apply_list_writes` batch that touches it fails
whole), and a backup restore into the narrowed database refuses those rows.
An app-only revert is not clean either: the old editor drops every relation
key (`craft`, `craft_from`, `set`, `refs`, `eq.line`) of an item it saves,
and only a backup restores them; the old list pages hide a frozen copy or a
shared reference whose snapshot holds any relation key (`craft`,
`craft_from`, `set`, `refs`, `eq.line`) or `cards` (the rows stay in the
database).

To undo `20261002120000_read_scale`, revert the app alone: the old frontend
never calls `get_shared_list(text, bigint)` and reads the account by its old
embedded select, and a frozen copy past `snapshot_bytes_per_list` is refused
to it with the generic limit toast («Достигнут предел: 1048576. ...»,
`limitOther`). Narrow the database too only as a second push, a new
migration whose body is the reversal file: it drops the overload, the
byte-limit triggers, their function and the `limit_defaults` row (the
overrides of the key go with it); stored copies past the sum stay.

To undo `20261002130000_homebrew_files`, revert the app alone: the old
frontend never calls `import_homebrew` or `move_homebrew_items`, and its
lists export stays official-only version 1. The migration narrows
`homebrew_names_ok()` to the explicit space class (a name of only U+00A0,
U+FEFF and their kin has no name), a superset of what the old `\S` called
space, so a row valid under it stays valid after the reversal. A CHECK runs
on every UPDATE: before a push that carries the class, run this read-only
query on the target project, written with escapes only (copy it as text;
an editor can drop U+FEFF without a sign). Expected 0; a row found blocks
the push: an own row is renamed in the app, and a frozen copy, which no
page renames, is fixed in SQL (its name rewritten inside the snapshot, or
the entry deleted). Run on 2026-10-02 at R7d's closeout: 0 on production
and 0 on the test project.

```sql
with n as (
  select content->>'en' en, content->>'ru' ru from public.homebrew_items
  union all select content->>'en', content->>'ru' from public.homebrew_books
  union all select content->>'en', content->>'ru' from public.homebrew_cards
  union all select s->>'en', s->>'ru' from public.homebrew_books b,
    jsonb_array_elements(coalesce(b.content->'sections', '[]')) s
  union all select snapshot->>'en', snapshot->>'ru' from public.list_entries
    where snapshot is not null
  union all select snapshot#>>'{book,en}', snapshot#>>'{book,ru}' from public.list_entries
    where snapshot ? 'book'
  union all select snapshot#>>'{book,section,en}', snapshot#>>'{book,section,ru}'
    from public.list_entries where snapshot #> '{book,section}' is not null
  union all select c.value->>'en', c.value->>'ru' from public.list_entries e,
    jsonb_each(coalesce(e.snapshot #> '{cards,sets}', '{}')) c
    where e.snapshot is not null
  union all select c.value->>'en', c.value->>'ru' from public.list_entries e,
    jsonb_each(coalesce(e.snapshot #> '{cards,refs}', '{}')) c
    where e.snapshot is not null
)
select count(*) from n
where not (coalesce(en, '') ~ '[^\x09-\x0d\x20\u0085\u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]'
        or coalesce(ru, '') ~ '[^\x09-\x0d\x20\u0085\u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]');
```

The reversal drops both functions and restores the old name check; run it
only as a second push, a new migration whose body is the reversal file.

To undo `20261007120000_lifecycle_cleanup`, revert the app alone: it reads
nothing the job changes. The reversal unschedules the job, drops the
function and the extension, and brings back the write-time delete of
`create_purchase_request()`; rows the job deleted are not restored - they
were past their retention.

To undo `20261007130000_homebrew_links`, revert the app alone: the
migration keeps `list_entries.snapshot`, always null, for this release, so
the previous frontend reads every list. Each converted row links its list
owner's own item, which that frontend reads as a reference by key; a link
to another account's item made after the push draws there as a record it
does not know. Its writes still land: a reference by key gets its
`hb_item` from the trigger, and a frozen copy is refused (`22023`).
Requests read with their later expiry, and notices wait unread until the
30-day clean-up. Narrow the database too only as a second push, a new
migration whose body is the reversal file; if the data must be as it was,
`restore:prod` the pre-release backup after that. The reversal rebuilds a
snapshot for every entry that links another account's item, restores the
1-hour expiry of pending requests and drops `list_notices` with its rows.
It cannot restore: the one frozen copy with no holder that the migration
deleted (owner, 2026-10-06), the content of own-held frozen copies (they
became links to the live item), the read marks of requests, and per-owner
`snapshot_bytes_per_list` overrides (deleted by cascade; only the default
row comes back). After `20261010120000_drop_list_entry_snapshot` a frontend
before R7h needs the column again: push that migration's reversal first, as
a second push, and only then this one.

To undo `20261014120000_homebrew_art`, revert the app first: the previous
frontend ignores `img` and writes no `art`, and the database still deletes
the files of rows deleted meanwhile. Push the reversal only to drop the
column: it drops every picture reference (`homebrew_items.art`), both
triggers, `art_delete`, the policy and `pg_net`; the bucket and its files
stay, for the owner to empty with the CLI. Before any later up (a forward
fix), delete the Vault secret `dhloot_storage_key` or restore `art` from
the last backup taken before the down: after the up every file is an
unnamed orphan older than an hour, and the job deletes 2000 an hour until
the bucket is empty.

To undo `20261014120200_link_previews`, revert the preview host first
(`preview/` only, never the whole commit that added
`20261014120200_link_previews.sql`): the previous Worker reads
`get_homebrew_item` and `get_shared_list`, which stay. Then push a new
migration whose body is the reversal file; it drops the two card reads, so
until the Worker is reverted every `/h/` and `/s/` card answers 503 with the
redirect kept. No table, row or stored shape changes.

To undo `20261014120100_print_sets`, revert the app first: the previous
frontend prints through the long addresses and reads no set, and the sets
stay for the next frontend. Run the reversal only as a second push, a new
migration whose body is the reversal file, and only together with a
frontend revert: it drops every print set, so no short link opens, and with
the print-set frontend still deployed no signed-in reader can print.

To undo `20261010120000_drop_list_entry_snapshot`, revert the app alone: no
frontend since R7h reads the column. Push the reversal only to run a
frontend before R7h or to restore a backup made before the migration: the
dump's `list_entries` inserts name `snapshot`, so `restore:prod` and
`restore:drill` of such a backup fail until the reversal is pushed; a drill
of a backup made after the push needs nothing.

To undo `20261015120000_shared_list_have` or
`20261015120100_account_delete_requests`, revert the app or not: the
previous frontend never names the overload and calls `delete_account()`
alone, and this one does both after `PGRST202`. Push a new migration whose
body is the reversal file.

To undo `20261021120000_homebrew_trait_any`, revert the app alone: the
previous frontend writes the seven traits, which the widened
`homebrew_content_valid()` takes. Its editor refuses to save an `any` item
until the author picks a trait, and its pages drop a linked `any` item of
another account; the rows stay. Narrow the database too only as a second
push, a new migration whose body is the reversal file, and push it only
after this read gives 0:

```sql
select count(*) from public.homebrew_items
where content #>> '{eq,tr}' = 'any' or content #>> '{eq,alt,tr}' = 'any';
```

A CHECK runs on every UPDATE: after the narrowing, such an item refuses
every save, the delete of its source fails (`on delete set null` updates the
item), and a backup restore into the narrowed database refuses those rows.

To undo `20261028120000_drop_legacy_move`, the app alone cannot be
reverted: every frontend before R10 selects `legacy_fingerprint`, so every
account list read fails. Add a new migration whose body is the reversal
file, keep `20261028120000_drop_legacy_move.sql` in the tree (R10 lands as
one squash that holds the app and the migration, and a `git revert` of it
deletes the migration file, which blocks `migrate-prod`), and push both in
the same push as the app revert (`migrate-prod` runs before `deploy`). For
30 days `restore:prod` and `restore:drill` of a nightly backup made before
the migration fail until the reversal is pushed, because the dump's `lists`
inserts name the column; a drill of a backup made after the push needs
nothing. The reversal brings the column back with nulls. The values come
back only from a restore of a backup made before R10, after the reversal; a
restore replaces every row with the backup's, so it is no way to get the
fingerprints back alone, and nothing reads them after R10.

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
| lifecycle | the rows the hourly clean-up should have deleted more than 2 hours ago (`META.md` section 3, each retention plus 2 hours), and the newest `cron.job_run_details` row of `dhloot-lifecycle` | none | none |
| keep-alive | one Data API call a night (below) | none | none |

The summary also lists every `public` table by bytes with its exact row
count, and the owners and lists at 80 % or more of a count limit (and above
100 %, for lists moved in before R10): lists per
owner, entries per list and homebrew items per owner. It holds
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
| rows past their retention plus 2 hours; the job's newest run failed, started more than 2 hours ago, or is missing; no read access to `cron` | `lifecycle: the hourly clean-up has not run: N rows past their retention`, `... failed`, `... has not run since <time>`, `... has no run on record` or `no cron.job_run_details access`, `warn` | green |
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
- Own pictures (measured on the test project by `npm run e2e` F20,
  2026-10-14): a public file of `homebrew-art` answers `cache-control:
  public, max-age=86400` and an `etag`, and a second read with
  `If-None-Match` answers 304, so a reader whose day-old copy expired
  downloads headers only for an unchanged file. Readers' egress stays the
  owner's monthly dashboard look; past 2.5 GB of cached egress in a month the
  owner chooses between a longer cache age (with the privacy text) and the
  Pro plan.
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
8. Re-run the Security Advisor on production. Expected: 0 errors, 24
   warnings, 5 info ("Expected Security Advisor warnings").
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
  4 (hosted E2E), both parts run there once `.claude/cloud-nss.sh` has put
  the proxy's certificate authority in `~/.pki/nssdb` (`session-start.mjs`
  probes it): Chrome for Testing reads that store, not the system bundle,
  and without the authority it refuses the test project
  (`net::ERR_CERT_AUTHORITY_INVALID`, measured 2026-09-25), so `npm run e2e`
  stops at the page probe while its Node half (`node tests/e2e/probe.mjs`,
  the contract, the configured build) still runs. CI's `e2e` job, on the
  push of the branch, is layer 4's verification of record. Sweep measurements there are advisory.
- **Host rule.** A whole release (one task id) runs fully in the cloud or
  fully locally; batches never mix hosts within a release.
- **Branch rule.** The common model of every host ("Run a long check", "CI
  credit"), with the session's branch: a cloud release starts from the
  pushed `main` and commits on the branch its session was given, pushing that
  branch after every green commit (a reclaimed container loses what is not
  pushed); it never amends a pushed commit, so the branch holds one commit
  per batch and a remediation after a push is its own commit. `bash-guard.mjs` rule 2o
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
commit, never a merge commit; if the squash refuses, merge the latest
`origin/main` into the branch (never a rebase) - a modify/delete conflict
on `data.json` or `catalog.csv` (a branch cut before the two files left
git, `docs/decisions/2026-10-28-data-json-and-catalog-csv-leave-git-the-build.md`)
keeps the deletion: `git rm --cached --ignore-unmatch data.json
catalog.csv`, then `node tools/build.js` - push it, and restart at (a);
(d) push `main`, which runs `deploy`, and watch it; (e) delete the branch.

## Artwork tooling

`tools/artwork/` (task `art-tooling`) converts and installs catalog item
pictures - see `docs/artwork.md` for the runbook. It is a sibling npm
project: its own `package.json` and
lockfile carry `sharp`, so root `package.json` gains no dependency and root
`npm ci` never resolves an image encoder. `node --test
tools/artwork/lib.test.mjs` is wired into `npm run check` as its own step;
`run.mjs` (which imports `sharp` lazily), `icons.mjs` (the app icons) and
`cards.mjs` (the two site share cards) are not - their honest proof is the
filesystem and the encoder, not a unit test. The `review` verb is the one
verb that serves a page: it is read-only, binds `127.0.0.1`, and transpiles
`app/src/lib/` with the root `typescript` on request (`docs/artwork.md`,
"Image review"). `cards.mjs` renders only with
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
- Three more rejected alternatives: `sharp` in the root `package.json`; a
  script that bootstraps a Python venv (the Pillow script a task directory
  left behind, since deleted, is what that path produced - stranded);
  committing a hash inventory (git already records the bytes).
- No hook guards an artwork install: the standing bar for a new hook is a
  repeated mistake, and no artwork operation has produced one a path test
  could catch - the `og/`-orphan gap was a test gap, closed as a test.

## Preview host

The Cloudflare Pages project `daggerheart-loot` at
`https://daggerheart-loot.pages.dev/` is the site's host since the task
`cloudflare-pages` (2026-10-28): Pages serves the site's files, and a worker
gives a link card to the paths whose card needs a read: a
homebrew item (`/h/<uuid>`), a shared list (`/s/<token>`), a print set
(`/p/<id>`) and a catalog table (`/tables/<table>[/<tail>]`), each also
under `/en/`. `preview/public/_routes.json` sends only these eight path
families to the worker and excludes the bare `/tables` and `/en/tables`;
every other path is a static file, a `_redirects` rewrite to the app
document, or `404.html`. A record path `/i/<id>` is the static app document
with the record's card (task `path-urls`).
`preview/public/_headers` sends `X-Robots-Tag: noindex` on the text files.
The worker runs in Pages Functions advanced mode: `preview/public/_worker.js` re-exports
`preview/worker.mjs`, which draws the cards with `tools/share-card.mjs` and
reads record text as plain text through `app/src/lib/markup.ts` (no imports;
the deploy's esbuild bundle reads TypeScript, and CI deploys on every push).
Node 24.15 requires that `.ts` file silently from this typeless package and
imports it with a MODULE_TYPELESS_PACKAGE_JSON warning (measured 2026-10-15),
so the build tools `require()` it and `preview/worker.test.mjs` requires it
before it imports the worker. It answers every client with the app document
and the card in its head: it reads the site's `index.html` from the same
deployment through `env.ASSETS` on every request (2 s, 65536 bytes, never
cached, because an isolate can outlive a deployment) and replaces the lines
between its card markers (`tools/share-card.mjs` `appDocument`). When that
read fails, it answers the card page, which sends a person to `<site>#/...`
by `meta refresh` and `location.replace`. It reads `names.json` from the
same deployment through `env.ASSETS` too. It
stores nothing (`docs/specs/META.md` section 3; `docs/decisions/`,
2026-10-14, "Link previews come from a stateless worker"). GitHub Pages
stays on as the old host, a mirror whose root forwards here
(`docs/specs/META.md` section 9, "The old host"); never turn it off.

Rules:

- The host is frozen from the first link the app hands out, and is the
  app's own host since the task `cloudflare-pages`. Never delete the
  Pages project: a deleted name can be taken by another account, and every
  handed-out link then shows its content. Pages cannot rename a project.
- Hand out only the production host. A `<hash>.daggerheart-loot.pages.dev`
  deployment host or a branch alias answers 301 to the same path on the
  production host (the host guard in `preview/worker.mjs`), because an old
  deployment stays reachable with the code and the secrets it was made with.
- Every deploy uses `--branch main`. Git integration stays off: direct
  upload has no automatic preview builds, and a direct-upload project
  cannot switch to Git integration later.
- `preview/public/` holds only the four Pages control files (`_worker.js`,
  `_routes.json`, `_headers`, `_redirects`) in git; the deploy copies the
  site into it first. `_redirects` rewrites every non-card route path to the
  app document (`docs/specs/CONTRACTS.md` section 1); `tests/app/serve.js`
  reads it and `_routes.json` to stand in for the host. Never commit a site copy there or in `_cf/`.
- Host facts, 2026-10-28 (Cloudflare Pages documentation, not re-measured):
  the free plan takes 20,000 files per deployment and 25 MiB per file; the
  site is about 6600 files and 81 MB, and the collect step prints the count
  (`published files:`). A `.html` path answers 308 to the path without it.
  Static files carry `Cache-Control: public, max-age=0, must-revalidate`
  and an `ETag`. `_headers` applies to static files only, not to a worker
  answer. Unverified: a static request costs no Functions request.
- Host facts, probed 2026-10-28 with `npx wrangler pages dev` (wrangler
  4, the collected `_site/` in `preview/public/`, a stub RPC server; not a
  deploy, and `wrangler pages dev` can differ from production):
  `_redirects` 200 rewrites apply next to `_worker.js` on a path that
  `_routes.json` leaves static: `/roll/std` and `/lists/x` answer 200 with the
  app document and no `Location`; `/en/search` answers 200 with the English
  card (`<html lang="en">`, `og:locale` `en_US`), no 308; `/en/` answers 200
  and `/en` one 308 to `/en/`; a splat after a fixed prefix matches
  (`/i/hb_<key>` 200, `/i/en/hb_<key>` 200 in English); `/en/i/w1` answers 301
  `Location: /i/en/w1`; `/i/w1` answers 200 with `og:title` of `w1` and
  `/i/w1.html` one 308 to `/i/w1`; `/i/zzzz` answers 404 with `404.html`;
  `/llms.txt` carries `X-Robots-Tag: noindex`; `/tables/core_item` answers
  200 from the worker with a count in `og:description`, and
  `/h/00000000-0000-4000-8000-000000000000` 404 with the app document, no
  `Referrer-Policy` and `no-store`. Pages also routes the bare `/tables`
  to `/tables/*`: the worker answered it 302 home until `_routes.json`
  excluded `/tables` and `/en/tables`; since then `/tables` answers 200 from
  the rewrite, and `/tables/` with a slash answers `404.html`. Both
  `check-site` lists printed `site published correctly` against the probe.

Owner setup, facts of 2026-10-14:

- The account subdomain is `daggerheart-loot`. The project was created with
  `npx wrangler pages project create daggerheart-loot --production-branch main`;
  repeat that command for a new account. Every deployment listed on
  2026-10-28 is a CI deploy of `main` (owner); none holds the test
  project's secrets.
- The token is "daggerheart-loot pages deploy": account scope Cloudflare
  Pages Edit, Workers Scripts Edit, Workers Tail Read, Account Settings
  Read; user scope User Details Read, Memberships Read; no IP filter, no TTL.
  The repository-level secrets `CLOUDFLARE_API_TOKEN` and
  `CLOUDFLARE_ACCOUNT_ID` on `artex-x/daggerheart-loot` (not an environment)
  hold it; the main checkout's `.env` holds local copies under the same
  names, which `wrangler` reads. The owner keeps "Workers Scripts Edit"
  (2026-10-28); task `ai-mcp` decides whether the token still needs it.
- The account has no Worker `share` on `workers.dev` (owner, 2026-10-28).

The owner finished the steps after the move to this host (task
`cloudflare-pages`, landed 2026-10-28) on 2026-10-28: the Telegram,
sign-in and old-root checks, the retired refresher's session and its
`TG_*` secrets, the Worker and deployment clean-up (nothing to delete),
and the repository's "About" website. One standing rule is left: keep
GitHub Pages on for good, because it serves the old host's mirror.

### Deploy the preview host by hand (owner)

Prerequisites: the main checkout's `.env` with the token; the Supabase
project the cards read is awake (the free plan pauses it after 7 idle days,
and a paused project gives the 503 card).

1. Install the deploy tool. Run `npm ci` in `preview/`. Expected: `found 0
   vulnerabilities`.
2. Confirm the project. Run `npx wrangler pages project list`. Expected: the
   project `daggerheart-loot` with the domain `daggerheart-loot.pages.dev`.
   If the domain differs, stop: the host changes in every link.
3. Set the two secrets, before the first deploy. Run
   `npx wrangler pages secret put SUPABASE_URL --project-name daggerheart-loot`
   and `npx wrangler pages secret put SUPABASE_KEY --project-name daggerheart-loot`,
   and paste the project URL and its publishable key. For the probe, use the
   test project. A deployment keeps the secrets it was made with; a changed
   secret applies only at the next deploy (Cloudflare Pages documentation,
   "Bindings": a secret is set "before a deployment that uses those secrets").
4. Copy the site. Run `npm run build` at the root, run the collect commands
   of `ci.yml`'s `deploy` job into `_site/`, then run
   `cp -r _site/. preview/public/`. A deploy without this step publishes a
   host with no site: every path but the card families answers 404.
5. Deploy. In `preview/`, run
   `npx wrangler pages deploy public --project-name daggerheart-loot --branch main`.
   Expected: a deployment URL `https://<hash>.daggerheart-loot.pages.dev`.
6. Check. Run `node tools/check-site.mjs https://daggerheart-loot.pages.dev/`
   and `node tools/check-site.mjs --preview https://daggerheart-loot.pages.dev/`.
   Expected: `site published correctly`. Run
   `curl -I https://<hash>.daggerheart-loot.pages.dev/h/x`. Expected: `301`
   with `Location: https://daggerheart-loot.pages.dev/h/x`.
7. Delete the copy: `_site/` and every file in `preview/public/` except the
   four control files.

The Worker keeps no persistent log, so no id is stored.
`npx wrangler pages deployment tail --project-name daggerheart-loot`
streams live requests, with their CPU time, only while it runs. The hand
deploy stays for an emergency and for a measurement; CI deploys every push.

### The CI deploy

`ci.yml`'s `deploy` job (after `migrate-prod`) builds the app with
`VITE_PREVIEW_BASE` set to the origin, collects `_site/` (the record and
English-root app documents from `dist/i/` and `dist/en/`), runs the guard and
`node tools/check-site.mjs --dir _site`, assembles the old host's mirror
`_old/` (the site without `assets/`, `data.js` and the install guide, with
`old-host/index.html` and `old-host/sw.js`, and the repository root's
redirect pages `i/` and `en/` in place of the app documents, counted against
`catalog.csv`) and checks it with
`node tools/check-site.mjs --mirror --dir _old`. The guard refuses a published
`_redirects` and a file or folder named `roll`, `search`, `lists`, `account`,
`homebrew`, `print` or `l`, which would shadow a rewrite. Then it runs `npm ci` in
`preview/`, copies `_site/.` into `preview/public/`, runs `npx wrangler
pages deploy public --project-name daggerheart-loot --branch main` with the
secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, and checks the
site's host with `node tools/check-site.mjs https://daggerheart-loot.pages.dev/`
and `--preview`. Only then does it upload `_old/` to GitHub Pages and check
it with `--mirror`. The site's host is live and checked before the old host
forwards to it. `timeout-minutes` is 20: the first upload is about 81 MB.

- The preview check asks for a 404 card on `s/` and 43 `A`, a well-formed
  token that no list holds, and on `h/00000000-0000-4000-8000-000000000000`,
  a well-formed uuid that no item has. A 503 there means the secrets or that
  card read are wrong, and the check names them. Neither proves the ICU
  collation: the read answers null before it sorts. It also asserts the
  site's `robots.txt`, the `X-Robots-Tag` header on `llms.txt` and
  `catalog-index.csv`, `/mcp` 404, `i/w1?v=x` and a table card's count
  (which proves the `names.json` read). Every card answer must be the app
  document, which proves the worker's read of `index.html`; the route paths
  `roll/std`, `tables`, `lists/x`, `i/hb_<key>`, `en/search`, `en/tables` and
  `i/en/hb_<key>` must answer the app document with no redirect, and
  `en/i/w1` one 301 to `/i/en/w1`. The deploy's `check-site` run on `main`
  is the first production proof of the rewrites; no branch run executes the
  deploy steps.
- After the landing of `path-urls` (owner step): paste three address-bar
  addresses into Telegram Desktop - a record (`/i/<id>?v=<v>`), a homebrew
  item (`/h/<uuid>?v=<v>`) and a share link (`/s/<token>?v=<v>`). Expected:
  each draws its own card, not the site card. A stale card is Telegram's
  cache: change `?v` by the rule of `docs/specs/META.md` section 8.
- A Cloudflare failure stops the job before GitHub Pages, so the old host
  keeps its last content; rerun the job (wrangler uploads only missing
  files).
- A lasting failure (a revoked token, a suspended account, a deleted
  project) is the revert of the move ("Quotas, recovery and failure").
- A direct upload is believed not to count toward the 500 builds a month,
  and the deploys are fewer than 500 a month either way.

### Quotas, recovery and failure

- Functions requests count against the Workers free plan: 100,000 a day,
  reset at 00:00 UTC, shared by every Worker and Pages Function of the
  account, 10 ms CPU per request. Static files are free. Past the quota
  Cloudflare answers error 1027.
- A deliberate quota burn is possible: anyone can send 100,000 requests in
  one UTC day, and the free plan has no rate-limit rule for a Pages project.
  Every card path (`/h/`, `/s/`, `/p/`, `/tables/<table>` and their `/en/`
  forms) then fails until 00:00 UTC. Recovery for a reader: open `<site>`;
  `<site>#/h/`, `#/s/`, `#/p/` and `#/tables/` addresses keep working. The
  routes file keeps the root, the record paths and every non-card route path
  out of Functions, so the burn does not reach them (unverified: a static
  request costs no Functions request).
- A failed read of `index.html` by the worker (a 2 s timeout, a status other
  than 200, more than 65536 bytes, no card markers) draws the card page with
  its redirect to `<site>#/...` and `Referrer-Policy: no-referrer`; the next
  request reads again. The live `--preview` check fails on it, because it
  asks for the app document.
- If the live check after the `path-urls` landing shows that Pages does not
  apply `_redirects` next to `_worker.js`, the recovery commit is the
  task's ready fallback: `_routes.json` sends the non-card route paths to the
  worker, which answers them with the plain app document (a quota burn then
  reaches them too). The patch, with its tests and doc hunks, is
  `git show f7e73ce:issues/path-urls/fallback-routes.patch`; apply it with
  `git apply --3way`, because this paragraph's own hunk no longer matches.
- Revert of the move to Cloudflare Pages (a defect of the new host, or a
  Cloudflare outage): two commits. Since the task `path-urls` the app has
  root-absolute URLs (`base: '/'`) and cannot run under GitHub Pages'
  `/daggerheart-loot/`, so the first commit also reverts the `path-urls`
  squash, or a commit before it reverts that squash alone; a non-card path
  copied after that landing (`/roll/std`) then answers `404.html`, while a
  card path and a record path keep opening. The first commit reverts the
  landing commit,
  sets `if: false` on the Cloudflare steps of the restored `deploy` (three:
  the `npm ci` in `preview/`, the deploy and its check) and deletes the
  restored Telegram refresher workflow again (after the owner removed the
  Telegram secrets, it would fail after each green `check`). Its `deploy` publishes the full app to GitHub Pages while the new
  host keeps the moved site, so no host sends a reader to the other in a
  loop. After that run is green and GitHub Pages' `max-age=600` has passed,
  a second commit removes `if: false`: the old worker goes live, and every
  new-host path answers 302 to the old host. After the second commit a record
  link handed out from the new host opens the old root, not the record. Between the two commits (one CI
  run and about 10 minutes) a card link and every new-host address still open
  the new host with the defect being reverted. Supabase keeps both callbacks,
  so sign-in works on the old host with no owner step; a reader who used the
  new host signs in again there.
- Never roll the Pages project back to a deployment made before the move,
  and never `gh run rerun` a `deploy` made before the move, while the old
  host forwards: the old worker's 302 and the forwarding page send a tab
  back and forth. The forwarding page stops at the second forward within
  10 s and shows its link (`docs/specs/META.md` section 9, "The old host").
- The commit that added `20261014120200_link_previews.sql` carries a
  migration. To undo the Worker or the app,
  revert those paths only and keep `supabase/migrations/` and
  `supabase/reversals/` as they are. To remove the two reads, add a new
  migration whose body is
  `supabase/reversals/20261014120200_link_previews.sql` (`ci.yml`,
  `migrate-prod`). Use the dashboard's "Rollback to this deployment" only for
  an emergency between pushes; the next deploy replaces it. Never roll back
  to a deployment made before the first CI deploy: those hold the test
  project's secrets and the `/probe/*` routes.
- A failed read draws the 503 card (the site's title and the open line)
  with the redirect kept; a failed `names.json` read draws the card without
  craft, set or table lines and is fetched again on the next request; a
  thrown error draws the 503 card with the way home.
- CPU, measured 2026-10-14 with `deployment tail` on the full reads
  `get_homebrew_item` and `get_shared_list`: 2 ms for
  a rich item and a five-entry list; 43, 45 and 71 ms for a 1,745,628-byte
  `/h/` answer (1000 related rows at the validators' maxima), past the 10 ms
  limit. The Worker therefore reads two lean projections,
  `get_item_preview` and `get_shared_list_preview`: the database orders and
  cuts the names, so an answer stays at most 32768 bytes (`/h/`) and 4096
  bytes (`/s/`) at any set or list size (`tests/db/link-previews.test.mjs`
  measures about 26 KB and 2.5 KB at the maxima). The byte bounds stay as a
  defence at twice those sizes, `ITEM_MAX` 65536 and `LIST_MAX` 8192: past a
  bound the card is the site's text with 200 and the redirect, and the body
  is never parsed.
- CPU of the lean reads, measured 2026-10-15 on the deployed Pages Function
  (`wrangler pages deployment tail <full deployment id> --format json`; a
  short id is refused as "a static site"). Each case was fetched three
  times, 1.5 s apart. All outcomes were `ok`, all at most 3 ms CPU, in a
  warm isolate after the first request, with no `names.json` on the site:

  | Case | Read size (ru) | CPU ms | Wall ms |
  |---|---|---|---|
  | rich `/h/` | 1517 B | 2 / 1 / 1 | 100 / 102 / 62 |
  | heavy `/h/` (1000 big related rows) | 1596 B | 1 / 1 / 1 | 69 / 78 / 70 |
  | 600 small related rows `/h/` | 1749 B | 1 / 1 / 3 | 63 / 105 / 75 |
  | `/s/` players', 905 entries | 559 B | 1 / 0 / 1 | 60 / 164 / 59 |
  | `/s/` GM, 906 entries | 555 B | 1 / 1 / 0 | 103 / 62 / 57 |

  The same heavy item through the full read was 1,745,628 B and 43-71 ms CPU.
  A cold `names.json` parse (93 KB) is not in these readings; `JSON.parse`
  of it measured 1.4 ms on the Windows host.
- PostgREST sends no `Content-Length` on an RPC `jsonb` answer, with or
  without gzip (`content-range: 0-0/*`). The guard reads a byte counter, so
  it does not need the header.
- Telegram fetches a link once, when it is sent, and caches the card. A
  `deployment tail` started later sees nothing, and Pages keeps no request
  log: measure CPU with your own fetches while a tail runs.

### Cross-host limits

The site and the link cards share one origin since the task
`cloudflare-pages` (2026-10-28); before it the cards were another origin than
the app on GitHub Pages.

| Concern | Result |
|---|---|
| CORS, the app and the host | Non-issue: the app only builds a URL string and never fetches the host |
| CORS, the host to Supabase | Non-issue: server to server; `names.json` comes from the deployment through `env.ASSETS`, no subrequest |
| `og:image` on Storage public URLs | Non-issue: a crawler fetches it server side; absolute `https`, a public bucket |
| `og:image` format | Measured 2026-10-14, Telegram Desktop: a WebP and a JPEG picture both drawn; own pictures stay WebP |
| Card content type | Non-issue: the Worker answers `text/html; charset=utf-8`, the app document or the card page |
| Redirects for crawlers | Non-issue: every card answer is 200, 404 or 503 with the card in the head and no redirect; only the host guard answers 301; a frozen `.html` record URL answers one 308; the card page of a failed shell read redirects a person only |
| App-document headers | `Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow`, no `Referrer-Policy`: `no-referrer` empties `document.referrer`, which the static pages' back script reads. Costs: a `no-store` document is not kept in the back-forward cache, so Back to a card path (after the sign-in's `leave()`, for one) reloads the page and reads the card again |
| Shell read | Costs: one `env.ASSETS` read of `index.html` per card request (not a subrequest), never cached, so the document always pairs with the same deployment's hashed assets; a failed read answers the card page |
| User-Agent check | Rejected: an unknown crawler would get the redirect and the site card |
| Supabase session | Costs: a card answer is the app itself on the app's origin, whose `localStorage` holds the session (`sb-<ref>-auth-token`); the card fields go through `share-card.mjs`'s escaping (`esc`), and the fallback card page's script through the `\u003c` rule on its target, which now guard the session. No defect is known; a `Content-Security-Policy: sandbox` header cannot go on an app document |
| The English language seed | No hop: an `/en/` or `/i/en/` address seeds English in the app when nothing is stored (`docs/specs/I18N.md`); the fallback card page and the mirror's English stubs store it before they redirect |
| Cookies | Non-issue: the Worker sets none; the app keeps its session in `localStorage` |
| CSP and mixed content | Non-issue for mixed content: every URL is `https`. The app has no CSP; see the session row for the card on the app's origin |
| PWA scope | The app's scope is the host root, so a tapped card link is inside it; whether a messenger opens it in the installed app is the platform's choice, so a `/p/` reader may still have to sign in in the browser |
| Telegram cache | The app writes `?v=<version>` on `/h/`, `/s/` and a record link `i/<id>`, in the copy and in the address bar, so an edit is a new URL; an old message keeps its old card, also after a delete or a revoke. A bar address pasted before the `path-urls` landing was `<site>#/...` and keeps the site card |
| Rate limits | Costs: 100,000 requests a day (above) |
| Cold starts | Costs: a cold isolate parses `names.json` on its first `/h/` or `/tables/` request (about 97 KB); the CPU row has the readings |
| Supabase pause after 7 idle days | Costs: the 503 card, which still redirects; a crawler keeps that card for its URL |
| Page size | Non-issue: the meta description is capped at 480 bytes and each line at 1200, so a card stays under 64 KB |
| CPU (10 ms) | Measured 2026-10-14 on the full reads `get_homebrew_item` and `get_shared_list`: 2 ms for a rich item and a five-entry list, 43-71 ms for a 1,745,628-byte `/h/` answer; the lean reads `get_item_preview` and `get_shared_list_preview` keep an answer at most 32768 and 4096 bytes, behind the bounds `ITEM_MAX` 65536 and `LIST_MAX` 8192 ("Quotas, recovery and failure") |

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
| 47 | Name LSP and ast-grep where agents actually read | `.claude/README.md`, the three code-facing worker prompts | **adopt** (owner decision, 2026-09-18); **withdrawn** 2026-09-30, both tools removed ("Code navigation") | Measured over the same 65 transcripts: `Grep` 109 calls, `rtk grep` 90, `git grep` 55, **LSP 16** - all in the three sessions that installed it, and only `hover`/`documentSymbol` - and **`ast-grep` 1**, that one being `--version`. `git grep` over `.claude`, `CLAUDE.md` and `docs/` found exactly one mention of either tool, `agents/reviewer.md`'s `tools:` list, which grants LSP without saying what it is for. The guidance existed only in the human's global `~/.claude/CLAUDE.md`, while every worker is told to follow a prompt file exactly - so the prompts, not a doc line, are the lever. Two live traps found while probing and written down rather than left to be rediscovered: `workspaceSymbol` returns `No symbols found in workspace` on this host for any query, so the operation the old guidance led with is the one that fails first; and an `ast-grep` pattern that does not match exits 1 with no output, which reads as "no such code" (`function $N($$$A) { $$$B }` finds nothing in `app/src/lib/search.ts` only because those functions carry return type annotations). `findReferences` works and is the reason to bother - 11 references to `foldQuery` across two files in one call. No hook: a nudge toward a tool is not a deterministic property, and candidate 43's history is what happens when a guard denies a shape that already worked. |
| 48 | Deny or fail on a comment citing a batch id, a review finding id or an `issues/<id>/` path | `tests/` grep or `PreToolUse(Edit)` | **reject for now** | The rule is new (`CLAUDE.md`, "Comments", 2026-09-18) and the sweep that applied it found ~95 files, all written before the rule existed - no recorded failure of the written rule yet (row 29's bar). Rule 2i already denies the one that does damage (an `issues/<id>/` citation, at retirement). Cheapest form if it recurs: a `tests/derived.js`-style check that greps comments in `app/src`, `tools`, `tests`, `.claude/hooks` for `issues/[^<]` without a sha prefix and for `\bB\d+(\.\d+)?[a-z]?-[NR]\d+\b`. |
| 49 | A wrap-up nudge off the five-hour usage window | `Stop` / `PreToolUse` | **withdrawn, do not rebuild** | Built, measured and withdrawn at `79e26c9`: the five-hour window is not readable on this host. The hook input's `effort` is an object `{ level }`, and the same level reaches a worker's Bash tool as `$CLAUDE_EFFORT`. Full finding: `git show b2eec64:.claude/improvements.md`, Finding 4. |
| 50 | Re-measure the configuration audit baseline | none (a manual pass) | **dated: 2026-10-15** | Same commands, same Windows host as the 2026-09-15 baseline (`rtk gain`, `rtk discover`, `wc -c` of the always-loaded markdown, the skill-listing sum); `grep -n` and `tail -c` should be near zero in `rtk discover`, and `CLAUDE.md` under 181 lines. A regression is a new row here. Baseline table and method: `git show b2eec64:.claude/improvements.md`, Finding 7. |
