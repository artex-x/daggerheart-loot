# Plan - TASK 65: Claude Code hooks

Status: **shipped, then remediated.** B2 implemented this plan in full; a
single review pass afterwards found four bypasses of what the plan specifies
and they were fixed in place. This plan is still the spec - the remediation
changed no design decision, only code that did not implement one. See
`issues/65/handoff.md` for both commits and their verification results.

NEEDS_HUMAN_CONFIRMATION: **no**.

---

## 1. Objective and shape of the answer

Add a project-level Claude Code hooks setup under `.claude/hooks/`, register it in
`.claude/settings.json`, and prune `CLAUDE.md` and the `.claude/` prompts of the
instructions the hooks now enforce outright.

The division of labour, decided in `context.md` and unchanged here:

- **Hooks own deterministic enforcement.** A rule with a machine-checkable answer
  ("is this path generated?", "did `npm run check` pass for this tree?") belongs in
  a hook, because prose is enforced by an agent remembering it, and that is the
  kind of rule that fails.
- **Prompts own judgment, workflow and intent.** A rule that needs a human-shaped
  decision ("does this change alter what a screen draws?") stays in prose, because a
  hook that guesses at it is worse than no hook.

Three constraints shape every decision below and are restated because they are easy
to violate:

1. **Fail open.** A throw, a missing file, absent git - the action goes through. The
   deliberate blocks in section 4 are the only exceptions. Every script exits 0 on
   every path; the decision lives in the JSON, never in the exit code. A script that
   crashes before its own `try` exits 1, which Claude Code treats as non-blocking, so
   even a syntax error fails open.
2. **Nothing in a tool path takes seconds.** No `npm run check`, no browser, no
   network, no process enumeration. The one measurably expensive operation - the
   working-tree fingerprint, measured at 344 ms on this box - runs only on a
   `git commit` and only after cheaper tests have already decided the gate applies.
3. **Prettier gates `.claude/`.** `.prettierignore` excludes `*.md`, `tests/` and
   `tools/`, but **not** `.claude/**`. Every `.mjs` and `settings.json` written here
   must be Prettier-clean or `npm run format:check` - the first step of
   `npm run check` - fails. `.claude/**` is eslint-ignored and outside every tsconfig,
   so nothing else checks these files.

### Bootstrap fact the implementer must know before starting

Claude Code snapshots hook configuration at session start. **The hooks will not be
live in the session that writes them.** There is therefore no bootstrap deadlock
(the commit gate cannot block its own commit), and there is also no way to verify
behaviour by trying it. Verification is `.claude/hooks/selftest.mjs` (section 7).
The implementer's final message must tell the human to restart the session, or run
`/hooks`, to arm them.

---

## 2. File list

`.claude/hooks/` rather than `.claude/*.mjs`: `prompts/`, `agents/` and `templates/`
are already subdirectories, and eight loose scripts beside `README.md` would bury it.

| File | New? | Purpose | One-line justification for the split |
|---|---|---|---|
| `.claude/hooks/lib.mjs` | new | **Shared helper.** stdin parse, JSON emit, fail-open wrapper, repo root, path normalisation, `git()` runner, active-task detection, per-session dedupe state. | Every script needs all of it; duplicating the fail-open wrapper eight times is how one copy ends up without it. |
| `.claude/hooks/tree-key.mjs` | new | **Shared helper.** Working-tree fingerprint, plus read/write of `.check-cache.json`. | The gate's reader and the observer's writer must compute the key identically or the gate is permanently open or permanently shut; one function is the only way to guarantee that. |
| `.claude/hooks/session-start.mjs` | new | `SessionStart`: branch, HEAD, dirty files, most recently touched `issues/<id>`. | One registration, one file. |
| `.claude/hooks/bash-guard.mjs` | new | `PreToolUse(Bash)`: dangerous-command blocklist, blanket-staging block, commit-message attribution block, commit gate, long-check reminder. | All five need the same command sanitiser and segmenter; splitting them means five node spawns per Bash call instead of one. |
| `.claude/hooks/check-observer.mjs` | new | `PostToolUse(Bash)`: record a passing `npm run check` against the tree key. | Different event from the gate, so it is a separate registration; shares `tree-key.mjs` with it. |
| `.claude/hooks/edit-guard.mjs` | new | `PreToolUse(Edit\|Write\|...)`: block writes to generated files. | One registration, one file. |
| `.claude/hooks/edit-followup.mjs` | new | `PostToolUse(Edit\|Write\|...)`: derived-artefact, contract and parity-baseline reminders; records what this session wrote for the `Stop` hook. | One registration, one file. |
| `.claude/hooks/session-stop.mjs` | new | `Stop`: warn on this session's uncommitted work and a stale handoff. | One registration, one file. |
| `.claude/hooks/selftest.mjs` | new | Feeds every hook real-shaped payloads and asserts exit code and JSON. Wired into `npm run check`. | Section 7. |
| `.claude/settings.json` | new | Hook registrations. Section 3. | |
| `.claude/.gitignore` | new | `.check-cache.json`, `.check-index`, `.hook-state.json`. | Section 3. |
| `.claude/README.md` | edit | New `## Hooks` section. Section 6. | |
| `.claude/improvements.md` | edit | Six-line status header. Section 6. | |
| `.claude/prompts/implement.prompt.md` | edit | Compress lines 69-76. Section 6. | |
| `.claude/prompts/orchestrate.prompt.md` | edit | Compress lines 37-42. Section 6. | |
| `CLAUDE.md` | edit | Drop line 113; add a 5-line hooks note. Section 6. | |
| `package.json` | edit | Add `node .claude/hooks/selftest.mjs` to `check`. | |
| `eslint.config.mjs` | edit | Lines 21-24 name `statusline` and `usage-guard`, both deleted at `79e26c9`. Campsite fix. | |

**Rule of one registration, one script.** `settings.json` contains nothing but
`node .claude/hooks/<name>.mjs`. That is the issue's "a few reusable scripts over
complex inline hook logic", read literally: there is no logic in the config at all.

Nothing else changes. No agent file (`.claude/agents/*.md`) needs an edit - see
section 6. `docs/specs/COVERAGE.md` needs no row: it maps `tests/` suites onto
`FEATURES.md`, and the hook selftest is agent wiring, not product coverage. That is
also why the selftest lives in `.claude/hooks/` and not in `tests/` (section 7).

---

## 3. `.claude/settings.json` and `.claude/.gitignore`

Written to match the working shape at `60172d3` - `hooks` keyed by event, each entry
`{ matcher?, hooks: [{ type, command }] }`.

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/session-start.mjs", "timeout": 10 }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/bash-guard.mjs", "timeout": 10 }
        ]
      },
      {
        "matcher": "Edit|MultiEdit|Write|NotebookEdit",
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/edit-guard.mjs", "timeout": 10 }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/check-observer.mjs", "timeout": 10 }
        ]
      },
      {
        "matcher": "Edit|MultiEdit|Write|NotebookEdit",
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/edit-followup.mjs", "timeout": 10 }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/session-stop.mjs", "timeout": 10 }
        ]
      }
    ]
  }
}
```

Decisions inside that file:

- **Relative `node .claude/hooks/x.mjs`, not `$CLAUDE_PROJECT_DIR/...`.** The
  documented form uses the variable; the form that was *measured working on this
  Windows host* is the bare relative one at `60172d3`. Shell-variable expansion is
  the exact class of thing that differs between Git Bash and cmd. Use what is proven.
- **`"timeout": 10` on every entry.** The default is 60 s. Ten seconds is far above
  the worst measured path (344 ms) and turns "a hook hung" into "a hook was skipped",
  which is the fail-open behaviour this design promises.
- **The `Edit|MultiEdit|Write|NotebookEdit` alternation is written out** rather than
  relying on `Edit` matching `MultiEdit` as an unanchored regex. `MultiEdit` may not
  exist on this host; a matcher for a tool that never fires is inert, and it costs
  nothing to be right if the host ever differs.
- **Do not touch `.claude/settings.local.json`.** It carries the human's permission
  allowlist and is a different file with different precedence.

**`.claude/.gitignore` is needed**, exactly as at `60172d3`:

```
.check-cache.json
.check-index
.hook-state.json
```

Three runtime files, all under `.claude/`:

| File | Written by | Contents |
|---|---|---|
| `.check-cache.json` | `check-observer.mjs` | `{ "key": "<16 hex>", "at": <epoch s>, "command": "npm run check" }` |
| `.check-index` | `tree-key.mjs` | A throwaway copy of `.git/index`. Never the real one. |
| `.hook-state.json` | `lib.mjs` | Per-session dedupe markers and the set of paths this session wrote. |

`.hook-state.json` shape:

```json
{
  "sessions": {
    "<session_id>": {
      "at": 1757440000,
      "seen": ["long-check:check", "remind:data", "stop:<hash>"],
      "wrote": { "app/src/lib/x.ts": 1757440000 }
    }
  }
}
```

Pruned to the five most recent sessions by `at` on every write. Concurrent subagents
can lose a write to last-writer-wins; the only consequence is one duplicate reminder,
so no locking. A corrupt or unreadable file is replaced with `{}` - fail open.

**Both the state directory and the repo root are overridable by environment
variable**, and this is the hinge the selftest hangs on:

- `repoRoot()` returns `process.env.LOOT_HOOK_ROOT` when set, otherwise two levels
  up from `import.meta.url` (never `cwd`, which differs between subagents).
- `stateDir()` returns `process.env.LOOT_HOOK_STATE_DIR` when set, otherwise
  `.claude/`.

That lets the selftest point both at a throwaway git repo in the OS temp directory
and exercise the real code end to end without touching this working tree.

---

## 4. The hooks

### Shared protocol

Every script:

1. Reads stdin, `JSON.parse`s it inside a `try`. Failure yields `{}` and the script
   carries on; most decisions need only one or two fields.
2. Does its work inside a single `try`. `catch` prints nothing and exits 0.
3. Exits 0 always. There is no exit-2 path anywhere in this design.

Decision vocabulary, uniform across scripts:

| Intent | Output |
|---|---|
| allow, silently | print nothing |
| allow, and say something to Claude and the human | `{ "systemMessage": <text>, "hookSpecificOutput": { "hookEventName": <event>, "additionalContext": <text> } }` |
| block a tool call | `{ "hookSpecificOutput": { "hookEventName": "PreToolUse", "permissionDecision": "deny", "permissionDecisionReason": <text> } }` |
| warn at `Stop` | `{ "systemMessage": <text> }` |

Why `permissionDecision: "deny"` and not exit 2: both block, but the JSON form
carries the reason in a named field and keeps the exit code free to mean only "the
script itself broke", which is what makes the fail-open promise true.

Why the allow-and-speak form sends the same text twice: `systemMessage` reaches the
human on every event and is well established; `additionalContext` on `PreToolUse` is
the field that reaches Claude, and if this host ignores it the extra key is dropped
silently and the human still sees the message. Never emit `permissionDecision:
"allow"` for a message-only case - `allow` bypasses the permission prompt, which is a
behaviour change nobody asked for.

Hook input fields relied on (measured on this host, recorded in `context.md`):
`session_id`, `cwd`, `hook_event_name`, `agent_id`, `agent_type`, plus `tool_name`
and `tool_input` on tool events, `tool_response` on `PostToolUse`, `source` on
`SessionStart`, `stop_hook_active` on `Stop`.

### Cross-platform path matching (used by `edit-guard` and `edit-followup`)

`tool_input.file_path` arrives absolute and Windows-shaped
(`E:\dev\daggerheart-loot\catalog.csv`), sometimes with forward slashes, sometimes
with a differently-cased drive letter. `lib.mjs` exposes `relPath(filePath)`:

1. `path.resolve(filePath)`.
2. On `win32` only, lowercase both it and `repoRoot()` before comparing. Not on
   POSIX, where paths are case-sensitive and lowercasing would be a bug.
3. `path.relative(root, resolved)`.
4. If the result starts with `..` or is absolute, the file is outside the repo -
   return `null`, and every caller allows on `null`.
5. Replace `\` with `/`, lowercase the result, return it.

Every allow/deny list below is written in that normalised form.

---

### Hook 1 - `SessionStart` -> `session-start.mjs`

**Event** `SessionStart`, no matcher (fires for `startup`, `resume`, `clear`,
`compact`). **Never blocks.**

Behaviour - three git calls plus a directory scan, ~50 ms total:

1. `git rev-parse --abbrev-ref HEAD` -> branch.
2. `git log -1 --format=%h %s` -> HEAD.
3. `git status --porcelain -uall` -> changed paths, grouped staged / unstaged /
   untracked, listing at most ten with a `+N more` tail.
4. Active task: scan `issues/*/`, take the directory with the greatest
   newest-contained-file mtime, and report which of `context.md`, `plan.md`,
   `handoff.md` exist.

Output is one `additionalContext` block, under fifteen lines:

```
Repo: branch <branch>, HEAD <sha> <subject>.
Working tree: <n> changed paths.
  staged:    <path>, <path>
  unstaged:  <path>, <path>
  untracked: <path>
Most recently touched task: issues/<id>/ (context.md, plan.md).
Read issues/<id>/context.md before re-fetching the issue. Confirm the task id with
the human - the newest directory is a guess, not an assignment.
```

**"Most recently touched", not "active".** All work here happens on `main` (no
feature branches - checked: `git branch -a` shows only `main`), so mtime is the only
signal available, and CLAUDE.md line 13 already warns that issue 47 is not a default.
Overclaiming here would create exactly the mistake that line exists to prevent.

Fail open: any git failure drops that line; every line failing prints nothing.

---

### Hook 2 - `PreToolUse(Bash)` -> `bash-guard.mjs`

**Event** `PreToolUse`, **matcher** `Bash`. Five rule families, evaluated in the
order listed; the first deny wins.

#### 2a. The sanitiser and segmenter

This is where false negatives and false positives are both won or lost, so it is
specified exactly.

```
sanitize(raw):
  1. If raw contains '<<', keep only the text before the FIRST '<<'.
     A heredoc body is data being written, not commands being run.
  2. Replace every backslash-escaped character (\X) with a space.
  3. Replace every single-quoted span '...' and double-quoted span "..." with a
     space.
  4. Collapse runs of whitespace to one space.

segments(sanitized):
  Split on  &&  ||  ;  |  &  newline  $(  )  `
  For each segment: trim, drop leading VAR=value assignments, take the first
  token as the program.
  If the program is in
    { echo, printf, grep, rg, cat, head, tail, sed, awk, less, more, type, which }
  skip the segment entirely.
  If the program is `git`, skip any global options that follow it
  (-C <path>, -c <k=v>, --git-dir=..., --work-tree=...) to find the subcommand.
```

The named traps, and the step that catches each:

| Trap | Caught by |
|---|---|
| `git   reset --hard` (extra whitespace) | step 4, whitespace collapse |
| `git push --force-with-lease` | rule 2b-3 blocks every `git push`, so the flag spelling is irrelevant |
| `-f` short flags, and clusters `-fd`, `-xdf`, `-df` | flag test is "a token matching `^-[a-zA-Z]*f`", not an equality test |
| chained commands: `npm test && git reset --hard` | segmentation; every segment is tested |
| `git -C . reset --hard` | git global-option skipping |
| `echo "git reset --hard"` | step 3 removes the quoted span, and `echo` is a reader anyway |
| `grep -rn 'git clean -fd' docs/` | step 3 and the reader list |
| `cat > x.md <<'EOF' ... git reset --hard ... EOF` | step 1, heredoc truncation |
| **an edit to a doc that mentions `git reset --hard`** | **structurally impossible**: this hook is registered on `Bash` only. A documentation edit travels through `Edit`/`Write`, which this script never sees. |

Known limitation, recorded rather than papered over: a command hidden inside
`sh -c "..."` or `bash -lc '...'` is erased by the quote stripper and will not match.
This is a guard against habit and haste, not an adversary.

#### 2b. The blocklist

| id | Condition on a segment | Decision |
|---|---|---|
| `git-reset-hard` | `git` + sub `reset` + any token `--hard` | deny |
| `git-clean-force` | `git` + sub `clean` + (`--force` or a token matching `^-[a-zA-Z]*f`) + **no** `-n` / `--dry-run` | deny |
| `git-push` | `git` + sub `push` + **no** `--dry-run` | deny |
| `git-discard` | `git` + sub `checkout` with a `--` token or a bare `.` pathspec; **or** `git` + sub `restore` whose only mode flag is not `--staged` | deny |
| `git-stash-destroy` | `git` + sub `stash` + next token `drop` or `clear` | deny |
| `rm-rf-repo` | `rm` + flags containing both `r` and `f` (clustered or separate) + a target that `relPath()` places inside the repo and **not** under `dist/`, `coverage/`, `test-output/`, `node_modules/` | deny |

`git-push` blocks every push, not only forced ones. CLAUDE.md line 157 already says
pushing is the owner's job, so the narrower force-only rule from the ticket would
leave the broader standing rule unenforced for no gain. `--dry-run` is allowed
because it pushes nothing.

`git-discard` exists because `git checkout -- <path>` and `git restore <path>` are
the exact mechanisms that would silently destroy the three unrelated in-flight files
this tree is carrying right now (section 9). `git restore --staged <path>` only
unstages and is allowed.

Literal messages:

```
git-reset-hard:
Blocked: `git reset --hard` discards every uncommitted change in this tree,
including work that belongs to another task. Park your own changes with
`git stash push -- <paths>`, unstage with `git restore --staged <path>`, or ask the
human to run the reset themselves.

git-clean-force:
Blocked: `git clean` with -f deletes untracked files permanently. Run it with -n
first and act on the list, or delete the specific paths you meant.

git-push:
Blocked: pushing is the repository owner's job (CLAUDE.md). Commit locally and say
in your summary that a push is pending.

git-discard:
Blocked: this overwrites working-tree changes, and this tree carries in-flight work
from other tasks. If you only meant to unstage, use `git restore --staged <path>`.
Otherwise name the exact file and confirm with the human.

git-stash-destroy:
Blocked: this throws away a stash permanently. Inspect it first with
`git stash list` and `git stash show -p`.

rm-rf-repo:
Blocked: `rm -rf` inside the repository. Delete named files, or run `git clean -n`
to see what is actually untracked. dist, coverage, test-output and node_modules are
exempt from this rule.
```

#### 2c. Blanket staging

| id | Condition | Decision |
|---|---|---|
| `blanket-stage` | (`git add` with `-A` / `--all` / `.` / `:/`) **or** (`git commit` with `-a` / `--all`), **and** `git status --porcelain -uall` reports two or more changed paths | deny |

The two-path condition is what keeps this from being noise: with a single changed
path there is nothing to sweep in, and the command is allowed.

```
Blocked: this would stage all <n> changed paths, and this tree carries work from
other tasks. Stage the files this batch touched by name:
`git add <path> <path>`.
```

#### 2d. Commit-message attribution

| id | Condition | Decision |
|---|---|---|
| `commit-attribution` | `git` + sub `commit`, and the **raw, unsanitised** command matches `/co-?authored-by/i`, `/generated with \[?claude/i`, or contains `U+1F916` | deny |

The one deliberate exception to the sanitiser: the trailer usually lives in a
heredoc or a quoted second `-m`, which steps 1 and 3 would erase. Write the comment
in the code saying so, or someone will "fix" it later.

```
Blocked: this commit message carries AI attribution. This repository's commit
messages never carry it - no Co-Authored-By trailer, no "Generated with" line.
Rewrite the message without it.
```

#### 2e. The commit gate

| id | Condition | Decision |
|---|---|---|
| `commit-gate` | `git` + sub `commit`, no `--dry-run`, the covered-file test passes, no cached pass for the current tree key, and the raw command does not contain `SKIP_CHECK_GATE=1` | deny |

**The covered-file test - what stops this becoming noise.** Most commits in this
repository are plans, handoffs and agent wiring, which `npm run check` does not read.
Gating those would train everyone to reach for the escape hatch, which is how a gate
dies. So compute the committed set:

```
paths = git diff --cached --name-only
if the command carries -a or --all:
    paths = paths + (git diff --name-only)     # tracked, unstaged - what -a adds
```

and treat a path as **exempt** when:

```
path starts with 'issues/'
  OR (path ends with '.md' AND path is not 'README.md' AND path is not 'README.ru.md')
```

Everything else is covered. If every path is exempt, or `paths` is empty, allow
silently. The two READMEs are carved out because `tests/derived.js` - which *is* in
`npm run check` - reads their licence clause.

Deliberately **not** used: the union with `git status`. This tree permanently carries
three unrelated dirty files (section 9); folding them in would gate every documentation
commit forever, which is precisely the failure mode this test exists to avoid.
Accepted limitation, recorded: `git commit <pathspec>` with an explicit path can slip
a covered file past the test. The gate is a safety net, not a security boundary, and
CI still runs the suite.

**The tree key** (`tree-key.mjs`, measured at 344 ms on this box):

```
1. Copy .git/index to .claude/.check-index.        (copy, not move; the real index
                                                    is never touched)
2. GIT_INDEX_FILE=.claude/.check-index git add -A  (cwd = repoRoot)
3. GIT_INDEX_FILE=.claude/.check-index git ls-files -s
4. key = sha256(step 3 stdout), first 16 hex characters
```

Why this and not something simpler:

- **`git add -A` gives exactly the required set.** Untracked files in (`-A`), staged
  files in (they are already in the copied index), tracked modifications in,
  deletions in, **gitignored files out** - which is the difference between a stable
  key and one that changes every time vitest rewrites `coverage/`.
- **The copy carries the index's stat cache**, so `git add` re-hashes only files
  whose mtime or size moved. A fresh `read-tree` index would re-hash all 2990 entries.
- **Locking is safe.** git derives its lock from `GIT_INDEX_FILE`, so it locks
  `.claude/.check-index.lock` and never contends with the human's own git.
- **`ls-files -s` rather than `write-tree`**, because it writes no tree objects and
  its output is directly readable when someone is debugging a spurious miss.
- **Content, not stat.** `npm run check` runs `npm run data`, which rewrites
  `data.json`, `catalog.csv` and `i/*.html`. When they were already current the bytes
  are identical and only mtimes move - git re-hashes, gets the same blobs, and the key
  is unchanged. A stat-based key would invalidate itself on every run.
- **HEAD is deliberately excluded** from the key. The check validates content, not
  history; a commit that leaves the tree byte-identical does not invalidate it.

Any failure in any step returns `null`, and `null` means allow. A machine without git
is not a machine where commits should be blocked.

**How the cache is written** - a hook cannot run `npm run check`, so
`check-observer.mjs` (hook 3) observes a real one and writes the key.

**The escape hatch** is a token in the command itself:
`SKIP_CHECK_GATE=1 git commit -m "..."`. Chosen over a sentinel file because the
reason is visible in the transcript at the moment of use and leaves nothing behind
to forget about. When it fires, the gate allows **and emits a `systemMessage`**, so
the bypass is loud to the human rather than silent:

```
Commit gate bypassed with SKIP_CHECK_GATE=1 - npm run check has not passed for this
tree.
```

Deny message:

```
Blocked: `npm run check` has not passed for this working tree (<n> checked files in
this commit). Run `npm run check`, then commit again - a passing result is remembered
until the tree changes.
If the check genuinely cannot run, say why in your summary and repeat the command
with SKIP_CHECK_GATE=1 in front of it.
```

#### 2f. Long-check reminder (allow, not block)

| id | Condition | Output |
|---|---|---|
| `long-check` | a segment matches `npm run check`, `npm run check:built`, `node tests/parity.js` or `node tests/run-all.js` | allow + message, **once per session per command family** |

```
`<command>` takes <cost> here. Redirect its output to a file and stay in this turn
until it finishes - a turn that ends with a check still running loses the result, and
from outside a stopped turn is indistinguishable from a dead agent.
```

with `<cost>` from the measured table: `npm run check` and `npm run check:built` "a
few minutes", `node tests/parity.js` "about nine minutes for one filter",
`node tests/run-all.js` "about fifteen minutes".

This is the ticket's list being exceeded on purpose. Grounded in
`.claude/improvements.md` Finding 1: three of five workers in one recorded session
ended a turn with a check in flight, and one cold replacement cost 319k tokens. The
prompt already carries the rule; what the hook adds is *timing* - it arrives at the
moment of the command rather than 200k tokens earlier - and the repo-specific number.
Once per session per family, so it cannot become wallpaper.

---

### Hook 3 - `PostToolUse(Bash)` -> `check-observer.mjs`

**Event** `PostToolUse`, **matcher** `Bash`. Never blocks, never speaks. Its only job
is to write `.check-cache.json`.

Trigger: the command matches `/\bnpm\s+run\s+(?:-s\s+)?check(?![:\w-])/`.

The negative lookahead is load-bearing. `npm run check:built` is `build && smoke &&
budget` and never runs the check suite; `npm run check:fast` skips `format:check`,
`npm run data`, `tests/derived.js` and `tests/i18n.js`. Neither may satisfy the gate.

Success test - **all** of:

```
tool_input.run_in_background !== true
tool_response.interrupted !== true
the first present numeric field among exit_code / exitCode / returnCode / code is 0
   (if none is present, this clause passes)
stdout contains 'All files'
stdout + stderr match none of:
   /npm error/i, /ELIFECYCLE/, /\bFAILED\b/, /Tests\s+\d+\s+failed/
```

Why each clause:

- **`run_in_background`** is the dangerous one. A backgrounded command returns
  immediately, so `PostToolUse` would fire before the check finished and cache a pass
  for a run that had not started producing output. Refuse outright.
- **`All files`** is vitest's coverage table header. `vite.config.mts` line 135 sets
  `reporter: ['text', 'text-summary']`, and `text` prints it. Vitest is the *last*
  step of `check`, so this string is a positive proof of completion: a failure at
  `format:check` aborts npm long before it appears. Coverage prints on failure too,
  which is why the failure markers are also required.
- **`FAILED`** catches the legacy scripts - `tests/derived.js` prints
  `<n> FAILED` - which vitest's own markers would miss.

**Implementation step, not optional:** the implementer runs `npm run check` for the
gate anyway, and must confirm from that real output that `All files` appears and that
none of the failure patterns appear in a *passing* run. If either is wrong the gate is
either permanently shut or permanently open. If `All files` is absent, substitute the
actual terminal marker and record the substitution in `.claude/README.md`.

**Second implementation step:** the exact field name carrying the Bash exit code in
`tool_response` is not recorded for this host. Settle it with a ten-second probe
rather than a guess - temporarily register a `PostToolUse(Bash)` script that appends
`JSON.stringify(payload)` to a scratch file, restart the session, run
`node -e "process.exit(0)"` and `node -e "process.exit(1)"`, read the two payloads,
then delete the probe. Write the observed shape into `.claude/README.md`. The
"if none is present, this clause passes" fallback keeps the design correct either
way, but knowing beats hoping.

On success, write `{ key, at, command }`. On anything else, write nothing and leave
any existing cache alone.

---

### Hook 4 - `PreToolUse(Edit|MultiEdit|Write|NotebookEdit)` -> `edit-guard.mjs`

Matching is `relPath(tool_input.file_path)` as specified above; `null` allows.

**Deny list** (normalised, forward slashes, lowercase):

| Pattern | Message |
|---|---|
| `data.json` | `Blocked: data.json is generated from data.js. Edit data.js, then run `node tools/build.js`.` |
| `catalog.csv` | `Blocked: catalog.csv is generated from data.js. Edit data.js, then run `node tools/build.js`.` |
| `i/` prefix | `Blocked: i/*.html are generated share stubs. Edit data.js, then run `node tools/build.js`.` |
| `dist/` prefix | `Blocked: dist/ is build output. Edit the source under app/src/ and run `npm run build`.` |
| `package-lock.json` | `Blocked: package-lock.json is generated. Change package.json and run `npm install`.` |

**Allow list - paths that look adjacent and must not be denied:**

| Path | Why it must stay writable |
|---|---|
| `data.js` | The source of truth. Denying it would deny the only correct fix. |
| `docs/fixtures/**` | Generated-looking, but CLAUDE.md requires them to be updated by hand in the same commit as any contract change. |
| `img/**`, `og/**` | Managed separately per CLAUDE.md; not build output. |
| `tests/**`, `tools/**` | Sources. |
| anything outside the repo | `relPath()` returns `null`. |

`dist/` and `package-lock.json` are additions beyond the ticket's three, both cheap:
each is one array entry, each catches a real and plausible mistake (patching built
output instead of source; hand-editing a lockfile), and neither can fire on a
legitimate edit.

---

### Hook 5 - `PostToolUse(Edit|MultiEdit|Write|NotebookEdit)` -> `edit-followup.mjs`

Never blocks. Two jobs.

**Job A - record the write.** Add the normalised path and the current epoch second to
`.hook-state.json` under `sessions[session_id].wrote`. This is what makes hook 6's
"meaningful work" test precise, and it is the reason this hook exists even when it has
nothing to say.

**Job B - the reminders.** Each fires at most **once per session per group**, tracked
in `sessions[session_id].seen`. This is the hook most at risk of becoming wallpaper -
an agent editing `data.js` forty times in a batch must not get forty identical
paragraphs - and the dedupe is not an optimisation, it is the thing that keeps the
whole setup credible.

| Group id | Trigger paths | `additionalContext` |
|---|---|---|
| `remind:data` | `data.js` | `data.js changed. Run \`node tools/build.js\` before committing or tests/derived.js will fail. If counts or source lists changed, index.html, README.md, README.ru.md, app.js, llms.txt and robots.txt change with it.` |
| `remind:contract` | `docs/specs/contracts.md`, `docs/specs/routes.md`, `docs/fixtures/` prefix, `tests/contracts.js`, `llms.txt` | `A public contract surface changed (<path>). CLAUDE.md requires docs/fixtures/, tests/contracts.js, docs/specs/CONTRACTS.md and llms.txt to move together; \`node tests/contracts.js\` checks it.` |
| `remind:baseline` | `index.html`, `app.js`, `style.css` | `<path> is the parity baseline the rewrite is measured against. Editing it moves the target. Confirm this is a data or count update, not a migration change.` |

`remind:baseline` is the second deliberate addition beyond the ticket.
`.claude/improvements.md` Finding 5 calls the static root frozen by policy precisely
because it *is* the expectation the parity suite compares against - yet CLAUDE.md
line 89 legitimately requires editing `index.html` and `app.js` on a count change. A
block would be wrong; a once-per-session question is right, and moving the parity
baseline unnoticed mid-migration is an expensive, quiet error.

---

### Hook 6 - `Stop` -> `session-stop.mjs`

**Event** `Stop`, no matcher. **Warns; never blocks.**

First line of the script: if `stop_hook_active === true`, print nothing and exit.
That guarantees no loop can ever form, including if someone later converts this to a
block.

**"Meaningful work is uncommitted", operationally:** the intersection of

- the paths in `sessions[session_id].wrote` (recorded by hook 5), and
- the paths reported changed by `git status --porcelain -uall`

is non-empty.

The definition is deliberately narrow - *this session's* writes, not the tree's dirty
set - and that narrowness is the whole point. This tree permanently carries three
unrelated modified files (section 9). A hook that warned about the tree's dirty set
would fire on every single Stop, say nothing new, and be ignored within a day.
Accepted limitation, recorded: files written through `Bash` (a heredoc, `python -`)
are not in `wrote` and will not be warned about. This is a nudge, not an audit.

**"handoff.md is stale", operationally:**

```
let task = the most recently touched issues/<id>/  (same scan as hook 1)
if task has no handoff.md  ->  the rule does not run at all.  Print nothing about it.
otherwise stale := mtime(handoff.md) < max(mtime of paths in `wrote` that are
                                           NOT under issues/<id>/)
```

**A task with no `handoff.md` is a task that chose not to have one, and the hook does
not second-guess that.** This task, 65, deliberately has none by the human's
instruction; a hook that nagged about a missing handoff would fire spuriously on its
own task on the day it shipped. There is no "you should create a handoff" message
anywhere in this design.

**Why warn and not block**, three reasons, all of which point the same way:

1. A `Stop` block re-prompts the model to continue. On a session the human is
   deliberately ending, that burns tokens against the human's explicit intent - and
   the five-hour window is not machine-readable here (`79e26c9`), so nothing can tell
   the hook whether that is affordable.
2. Both determinations are heuristic. `wrote` misses Bash-written files; the human
   may be stopping on purpose with work parked. Blocking on a heuristic is the
   definition of noise.
3. The audience is the human. Committing and writing a handoff are the human's
   call, and a non-blocking `Stop` hook speaks to the human via `systemMessage`,
   which is the right channel for a decision that is theirs.

Fires once per session per condition, keyed on a hash of the offending path set, so a
second Stop with the same state is silent but a second Stop after new work speaks
again.

Messages:

```
Session stopping with this session's work uncommitted: <up to 8 paths><, +N more>.
CLAUDE.md asks for a coherent committed boundary - never a half-batch.
```

```
issues/<id>/handoff.md is older than the code this session changed. Update it with
decisions, checks and results, blockers, and the exact next action.
```

Both conditions true: one `systemMessage` with both paragraphs.

---

## 5. Every candidate considered

Adopted beyond the ticket's six are marked **+**. Rejected candidates are here so the
next session does not re-derive the list.

| # | Candidate | Event | Verdict | Reason |
|---|---|---|---|---|
| 1 | Session briefing: branch, dirty files, active task | `SessionStart` | **adopt** | Ticket. Cheap, once per session, states facts nothing else states. |
| 2 | Dangerous git commands | `PreToolUse(Bash)` | **adopt** | Ticket. Deterministic, destructive, irreversible. |
| 3 | Commit gate on a passing `npm run check` | `PreToolUse(Bash)` | **adopt** | Ticket. Scoped to covered files so it stays quiet on doc commits. |
| 4 | Generated-file write block | `PreToolUse(Edit\|Write)` | **adopt** | Ticket. Purely mechanical; a wrong edit here is silently overwritten by the next build. |
| 5 | Derived-artefact / contract reminder | `PostToolUse(Edit\|Write)` | **adopt** | Ticket. Once per session per group, or it is wallpaper. |
| 6 | Uncommitted work / stale handoff | `Stop` | **adopt** | Ticket. Warn only, scoped to this session's writes. |
| 7 | **+** Block every `git push`, not only forced | `PreToolUse(Bash)` | **adopt** | CLAUDE.md line 157 is already absolute; the narrower rule would leave the broader one unenforced for nothing. |
| 8 | **+** Block blanket staging (`git add -A`, `git commit -a`) with 2+ dirty paths | `PreToolUse(Bash)` | **adopt** | CLAUDE.md line 155 and `context.md` both flag the in-flight issue-47 files; blanket staging is exactly how they get swept into someone else's commit. |
| 9 | **+** Block AI attribution in a commit message | `PreToolUse(Bash)` | **adopt** | An explicit standing user rule ("no Co-Authored-By trailer, ever") against a well-known default agent behaviour. Zero false positives; fires never once respected. |
| 10 | **+** Long-check reminder | `PreToolUse(Bash)` | **adopt** | `improvements.md` Finding 1: three of five workers made this exact mistake in one session. Fires on four command shapes, once per session each. |
| 11 | **+** Parity-baseline warning on `index.html` / `app.js` / `style.css` | `PostToolUse(Edit\|Write)` | **adopt** | `improvements.md` Finding 5 calls the static root frozen because it *is* the parity expectation; a block would be wrong because count updates legitimately touch it. |
| 12 | **+** Block writes to `dist/` and `package-lock.json` | `PreToolUse(Edit\|Write)` | **adopt** | Two array entries in a list that already exists; both catch real mistakes; neither can fire on a legitimate edit. |
| 13 | Warn when a worker is dispatched with no explicit `model` | `PreToolUse(Task)` | **reject** | Fixed structurally at `60172d3` by putting real defaults in agent frontmatter. A hook would re-litigate a solved problem. |
| 14 | Warn before `TaskStop` ("run ListAgents first") | `PreToolUse(TaskStop)` | **reject** | The recorded failure (`001aa43`) was a misread status, which is judgment. `orchestrate.prompt.md` lines 67-91 own it and are the right owner. |
| 15 | Block a heavy run while another is alive | `PreToolUse(Bash)` | **reject** | Needs process enumeration; `tasklist` on Windows costs 200-500 ms and cannot distinguish a headless harness Chromium from the human's browser. Unreliable input, tool-path cost. Deferred alternative: have `tests/parity.js` write a lockfile the hook can stat in microseconds - a change to `tests/`, out of scope here. |
| 16 | Report the last CI conclusion at session start | `SessionStart` | **reject** | Needs `gh` over the network. Network in a hook can hang the session start, and the rule is that no hook path touches the network - even the one that is not a tool path. |
| 17 | Enforce Conventional Commits subject format | `PreToolUse(Bash)` | **reject** | Never a recorded failure here - every commit in the log conforms - and extracting a subject from an arbitrary `git commit` invocation (`-F`, two `-m` flags, `$'...'`) is exactly where a false block would land on a legitimate commit. The attribution check (#9) gets the value without the parsing risk, because it scans the raw string for a literal. |
| 18 | Verify `git config user.email` matches the required author | `SessionStart` | **reject** | Already configured globally on this host and has never failed. A rule that has never fired and can never fire is clutter. |
| 19 | Restrict the planner to writing under `issues/<id>/` using `agent_type` | `PreToolUse(Edit\|Write)` | **reject, top deferred candidate** | Fully enforceable in principle and a real failure mode. But `agent_type`'s value strings are unverified on this host: a wrong string either never fires (useless) or blocks a legitimate writer (harmful). The cheaper instrument is agent frontmatter - `reviewer.md` already uses `permissionMode: plan`. Settle it by logging `agent_type` from `session-start.mjs` for a session or two first. |
| 20 | Require `npm run check:built` when a screen changes | `PreToolUse(Bash)` | **reject** | "Alters what a screen draws" is judgment, not a path test. CLAUDE.md lines 101-105 keep it, and a hook must not pretend to enforce it. |
| 21 | Enforce the per-file coverage threshold | `PostToolUse(Write)` | **reject** | Already enforced by `vite.config.mts` at the real moment. A second copy would say nothing new. |
| 22 | Inject the active task on every prompt | `UserPromptSubmit` | **reject** | Duplicates `SessionStart` on every single turn. The definition of the noise the human warned against. |
| 23 | Preserve a handoff pointer across compaction | `PreCompact` | **reject** | `Stop` and `SessionStart` already bracket the session; a third copy of the same pointer earns nothing. |
| 24 | Anything reading the five-hour usage window | any | **reject** | Measured impossible on this host (`79e26c9`, `context.md`). Explicitly out of scope. |
| 25 | Block edits to `docs/fixtures/**` as "generated" | `PreToolUse(Edit\|Write)` | **reject** | They look generated but CLAUDE.md requires updating them by hand in the same commit as a contract change. Blocking them would block the correct fix. Listed here because it is the tempting mistake in hook 4. |
| 26 | `SessionEnd` bookkeeping | `SessionEnd` | **reject** | Cannot influence the model or the human in time. `Stop` already covers the moment that matters. |

---

## 6. Prompt, agent and `CLAUDE.md` cleanup

The issue's rules, applied literally: remove what a hook now **fully** enforces, keep
higher-level intent, **never** remove an instruction a hook only partially enforces,
avoid one hard requirement living in two places.

**The honest result is a short removal list, and that is the correct answer rather
than a thin one.** Almost every law in `CLAUDE.md` is enforced by these hooks only on
the `Bash` or `Edit`/`Write` path - an agent can still ask a human to push, can still
write a file through a shell heredoc, can still skip `npm run check:built`. The
issue's own third rule forbids deleting those. So the deletions below are confined to
the places where a hook genuinely displaces prose, plus one stale-documentation fix.

### `CLAUDE.md` - 181 lines now, 185 after

| Line(s) | Action | Reason |
|---|---|---|
| 113 (`node tests/parity.js "<state filter>"` inside the "Useful focused commands" fence) | **remove** | Third copy: `docs/parity.md` owns it and line 70 already links there, and the cost table in `orchestrate.prompt.md` carries the timing. CLAUDE.md line 161 says to put deep procedures in `docs/specs/*` and link them. Net -1. |
| after 118 (end of "Quality gates") | **add 5 lines** | See below. Net +5. |
| 87 (`node tools/build.js` after changing `data.js`) | **keep** | Hook 5 only *reminds*; `tests/derived.js` is what enforces it. Partial. |
| 93-99 ("Before every commit: `npm run check`") | **keep verbatim** | The gate exempts doc commits and carries an escape hatch. Partial by construction. |
| 101-105 (`npm run check:built` when a screen changes) | **keep** | Candidate #20: judgment, deliberately not hooked. |
| 155 ("Preserve unrelated working-tree changes") | **keep** | Hooks #8 and `git-discard` cover the mechanical half only. |
| 157 ("Never push") | **keep** | Hook #7 covers the `Bash` path only. Reads as intent already, which is what the issue asks to keep. |
| 13 ("issue 47 is not a default") | **keep** | Hook 1 reports a guess and says so; it cannot enforce the id. |
| everything else | **keep** | Not hook-adjacent. |

The addition, placed at the end of the "Quality gates" section:

```

Deterministic guards run as Claude Code hooks (`.claude/hooks/`): dangerous git
commands, writes to generated files, and a commit gate that wants a passing
`npm run check` for the current tree. They enforce; this file states intent.
See `.claude/README.md`.
```

185 lines, comfortably under the 200 cap.

### `.claude/prompts/implement.prompt.md`

| Line(s) | Action |
|---|---|
| 69-76 (item 7, eight lines on never ending a turn with a check running) | **compress to four.** Hook #10 now delivers the specific command's wall clock and the "redirect and stay in the turn" instruction at the moment of the command; the prompt keeps the rule and the consequence, not the retelling. Net -4. |

Replacement text:

```
7. Never end a turn with a check still running: its output dies with your shell, and
   from outside a stopped turn is indistinguishable from a dead agent. Redirect long
   runs to a file and stay in the turn until they finish. If you must stop first, name
   the command, its task id, and the output path in your final message.
```

Nothing else in this file changes. In particular line 68 ("Do not commit if required
checks fail") stays: the gate covers `npm run check` for covered files only, not
`check:built` or the data steps.

### `.claude/prompts/orchestrate.prompt.md`

| Line(s) | Action |
|---|---|
| 37-42 (the six-line retelling of the two lost checks) | **compress to three.** The lesson survives in the bullets at 53-60 and now also fires as hook #10. Net -3. |
| 44-51 (the command cost table) | **keep** | Dispatch-time planning input. The hook fires at tool time, which is far too late for the orchestrator's decision about *which* worker gets *which* check. Not displaced. |
| 58-60 (never let two heavy runs overlap) | **keep, and it is now the sole owner** | Candidate #15 was rejected, so this prose is the only thing standing between the repo and a repeat of the spurious-timeout cascade. Deleting it would be the exact mistake the issue's third rule warns about. |
| 93-101 (model selection) | **keep** | Candidate #13 rejected; frontmatter enforces it. |
| 161-173 ("Session ending", the usage paragraph) | **keep verbatim** | It is the written record of a disproved approach. `context.md` explicitly says not to rebuild a usage guard; this paragraph is why. |

Replacement for 37-42:

```
A worker that ends its turn with a check still running loses it: the shell dies with
the agent and the result is gone even though the command finished. The replacement may
be a cold agent that re-reads everything - that happened twice in one session and cost
more than the batch itself.
```

### `.claude/agents/*.md`

**No changes.** Each numbered item is either judgment (preflight the tree, stop if the
batch is not implement-ready) or only partially hooked (`implementer.md` item 9 covers
`check:built` and the data steps, which no hook gates). Removing any of them would
violate the issue's third rule. Recorded explicitly so the next reader knows this was
considered rather than skipped.

### `.claude/README.md` - where the hooks are documented

A new `## Hooks` section, and it is the right home: the file already documents the
agent/prompt wiring, and `CLAUDE.md` line 161 says to keep deep procedure out of
`CLAUDE.md` and link to it. Keep it to roughly forty lines, containing exactly:

1. A table: event, matcher, script, what it does, and **block or warn** for each of
   the six registrations.
2. The fail-open contract in one sentence: every script exits 0 on every path, and
   only the listed denials block.
3. The three runtime files, what each holds, and that `.claude/.gitignore` keeps them
   out of the repo.
4. The escape hatch: `SKIP_CHECK_GATE=1 git commit ...`, that it announces itself to
   the human, and that it is for a check that genuinely cannot run - not for a check
   that is inconvenient.
5. **Hook config is snapshotted at session start; restart the session or run `/hooks`
   to pick up an edit.** Whoever changes a hook next will otherwise conclude it is
   broken.
6. How to run the tests: `node .claude/hooks/selftest.mjs`, also part of
   `npm run check`.
7. The two facts settled by measurement during implementation: the `tool_response`
   exit-code field name, and the `npm run check` completion marker.

### `.claude/improvements.md`

Add a six-line status header at the top. It is a 400-line report of one session, three
of whose findings have shipped and one of which was **withdrawn** - and it currently
reads as live advice, including a detailed design for the usage guard that `79e26c9`
removed as impossible on this host. A future agent will otherwise rebuild it.

```
Status, updated 2026-09-09. Finding 1 (long-running checks) shipped in the prompts at
60172d3 and is now also a hook (issue 65). Finding 2 (model defaults) shipped at
60172d3. Finding 3 (shared context) shipped in the template at 60172d3. **Finding 4
(the usage nudge) was built, measured, and withdrawn at 79e26c9: the five-hour window
is not readable on this host. Do not rebuild it.** Findings 5 and 6 (the parity
harness, the vitest timeout) belong to issue 47; 5a and 5b shipped at f7308a9.
```

### `eslint.config.mjs`

Lines 21-24 explain the `.claude/**` ignore by naming "the statusline and usage-guard
scripts", both deleted at `79e26c9`. A comment that describes files which no longer
exist. Rewrite it to name `.claude/hooks/`. Campsite rule: cheap, local, in a file this
batch touches conceptually and whose ignore entry is the reason these scripts are
unlinted at all.

---

## 7. Verification

**Checked in, not a manual recipe**, and it runs inside `npm run check`. A manual
recipe rots on contact with the first refactor, and this repository already treats
plain-node gate scripts as first-class (`tests/derived.js`, `tests/i18n.js` are both
steps of `check`).

**Location: `.claude/hooks/selftest.mjs`, not `tests/hooks.js`.** Two reasons.
`docs/specs/COVERAGE.md` maps the 20 suites in `tests/` onto features in
`FEATURES.md`, and hook wiring maps onto no feature - a row there would be a lie.
And `tests/` is Prettier- and eslint-ignored, whereas `.claude/**` is
Prettier-checked, so keeping the selftest beside what it tests holds it to the same
formatting gate as the code. (`tests/run-all.js` uses an explicit `SUITES` list rather
than discovery, so a file in `tests/` would not have been auto-picked-up either -
checked, and it is not the reason.)

Wiring, in `package.json`:

```
"check": "npm run format:check && npm run lint && npm run typecheck && npm run data && node tests/derived.js && node tests/i18n.js && node .claude/hooks/selftest.mjs && npm run test"
```

**Method**, following how `60172d3` verified its two scripts: for each case, feed a
real-shaped payload on stdin, assert the exit code and the parsed stdout.

```js
const r = spawnSync(process.execPath, [hook], {
  input: JSON.stringify(payload),
  encoding: 'utf8',
  env: { ...process.env, LOOT_HOOK_ROOT: scratch, LOOT_HOOK_STATE_DIR: scratchState }
});
// assert r.status === 0
// assert on JSON.parse(r.stdout || '{}')
```

**Scratch repo, built once and reused** by every case: a directory in `os.tmpdir()`,
`git init`, `git -c user.email=... -c user.name=... commit` one file, then leave two
files modified so the blanket-staging and Stop cases have something to see. Removed
in a `finally`. `LOOT_HOOK_ROOT` and `LOOT_HOOK_STATE_DIR` point there, so **the
selftest never touches this repository's tree or state**, which matters because it
runs inside `npm run check` on a tree carrying other people's work.

Payload shapes (measured on this host, `context.md`):

```json
{ "session_id": "t1", "cwd": "<scratch>", "hook_event_name": "PreToolUse",
  "tool_name": "Bash", "tool_input": { "command": "git reset --hard" } }
```

`PostToolUse` adds `tool_response`; `SessionStart` adds `source: "startup"`; `Stop`
adds `stop_hook_active: false`.

### Case list - the acceptance criteria

`bash-guard.mjs`, expect `permissionDecision: "deny"` and the named message fragment:

| # | Command | Expect |
|---|---|---|
| 1 | `git reset --hard` | deny, "discards every uncommitted change" |
| 2 | `git   reset   --hard HEAD~1` | deny (whitespace collapse) |
| 3 | `git -C . reset --hard` | deny (git global options) |
| 4 | `npm test && git reset --hard` | deny (segmentation) |
| 5 | `git clean -fd` | deny |
| 6 | `git clean -xdf` | deny (flag cluster) |
| 7 | `git clean --force` | deny |
| 8 | `git push` | deny |
| 9 | `git push --force-with-lease origin main` | deny |
| 10 | `git checkout -- app/src/x.ts` | deny |
| 11 | `git restore app/src/x.ts` | deny |
| 12 | `git stash drop` | deny |
| 13 | `rm -rf app` | deny |
| 14 | `git add -A` (scratch has 2+ dirty paths) | deny, "stage the files this batch touched" |
| 15 | `git commit -a -m "x"` | deny (blanket) |
| 16 | `git commit -m "fix: x" -m "Co-Authored-By: Claude <n@a.com>"` | deny, "AI attribution" |
| 17 | `git commit -m "chore: x"`, a covered file staged, no cache | deny, "has not passed for this working tree" |

`bash-guard.mjs`, expect **no** deny:

| # | Command | Expect |
|---|---|---|
| 18 | `echo "git reset --hard"` | silent |
| 19 | `grep -rn 'git clean -fd' docs/` | silent |
| 20 | `cat > x.md <<'EOF'\ngit reset --hard\nEOF` | silent (heredoc) |
| 21 | `git clean -nd` | silent |
| 22 | `git push --dry-run` | silent |
| 23 | `git restore --staged app/src/x.ts` | silent |
| 24 | `rm -rf dist` | silent |
| 25 | `git add app/src/x.ts` | silent |
| 26 | `git commit -m "docs: plan"`, only `issues/65/plan.md` staged | silent (exempt) |
| 27 | `git commit -m "chore: x"`, covered file staged, cache key matches the tree | silent |
| 28 | `SKIP_CHECK_GATE=1 git commit -m "chore: x"`, no cache | allow **and** `systemMessage` containing "bypassed" |
| 29 | `npm run check` | allow **and** message containing "stay in this turn" |
| 30 | `npm run check` a second time, same session | silent (once-per-session) |

`edit-guard.mjs`:

| # | `file_path` | Expect |
|---|---|---|
| 31 | `<root>/data.json` | deny, "node tools/build.js" |
| 32 | `<root>/catalog.csv` | deny |
| 33 | `<root>/i/cc1.html` | deny |
| 34 | `<root>/dist/index.html` | deny, "npm run build" |
| 35 | `<root>/package-lock.json` | deny, "npm install" |
| 36 | the same as #31 with backslashes and an upper-case drive letter | deny (Windows normalisation) |
| 37 | `<root>/data.js` | silent |
| 38 | `<root>/docs/fixtures/lists/x.json` | silent |
| 39 | `<os.tmpdir()>/elsewhere.txt` | silent (outside the repo) |

`edit-followup.mjs`:

| # | Case | Expect |
|---|---|---|
| 40 | write `data.js` | `additionalContext` contains `node tools/build.js` |
| 41 | write `data.js` again, same session | silent |
| 42 | write `docs/specs/CONTRACTS.md` | contract reminder |
| 43 | write `index.html` | baseline reminder |
| 44 | write `app/src/lib/x.ts` | silent, but the path appears in `.hook-state.json` under `wrote` |

`check-observer.mjs`:

| # | Case | Expect |
|---|---|---|
| 45 | `npm run check`, stdout with `All files`, no failure markers | `.check-cache.json` written, `key` equals the tree key computed independently |
| 46 | same, stdout containing `2 FAILED` | no cache written |
| 47 | same, `tool_input.run_in_background === true` | no cache written |
| 48 | `npm run check:built` | no cache written |
| 49 | `npm run check:fast` | no cache written |

`session-start.mjs`:

| # | Case | Expect |
|---|---|---|
| 50 | valid payload against the scratch repo | stdout parses; `additionalContext` names the branch and the dirty count |

`session-stop.mjs`:

| # | Case | Expect |
|---|---|---|
| 51 | `stop_hook_active: true` | silent |
| 52 | a `wrote` entry that is still dirty in the scratch repo | `systemMessage` names the path |
| 53 | the same, a second time | silent (once per path set) |
| 54 | active task dir with **no** `handoff.md` | no staleness sentence anywhere in the output |
| 55 | `handoff.md` older than a written source file | staleness sentence present |

Fail-open contract, applied to **all eight** scripts:

| # | stdin | Expect |
|---|---|---|
| 56 | empty | exit 0, no stdout |
| 57 | `{}` | exit 0, no stdout |
| 58 | `not json` | exit 0, no stdout |

Roughly 80 assertions, about 60 process spawns at ~60 ms, plus one scratch-repo
setup: three to four seconds inside a multi-minute `npm run check`. Acceptable.

### Commands the implementer runs

```
npx prettier --write .claude/settings.json ".claude/hooks/*.mjs" package.json
node .claude/hooks/selftest.mjs
npm run check
```

`npm run check:built` is **not** required: this task touches no rendered screen, no
route, no generated artefact and no `dist` asset (`context.md`, "Command costs").

Do not hand-format the JSON or the `.mjs` files. Write them, then run Prettier, then
read the diff. `npm run format:check` is the first step of `npm run check` and it will
fail the whole gate on one long line.

---

## 8. Ordered implementation steps

1. **Probe the `PostToolUse` payload** (ten minutes, removes the only guess in the
   design). Add a throwaway `.claude/hooks/_probe.mjs` that appends
   `JSON.stringify(input)` to `.claude/.probe.log`, register it on
   `PostToolUse(Bash)` in a minimal `settings.json`, restart the session, run
   `node -e "process.exit(0)"` and `node -e "process.exit(1)"`, read both payloads.
   Record the exit-code field name. Delete the probe script and the log.
2. Write `.claude/hooks/lib.mjs`: `readInput`, `emit`, `deny`, `speak`, `guard`,
   `repoRoot`, `stateDir`, `relPath`, `git`, `activeTask`, `state`/`once`/`recordWrite`.
3. Write `.claude/hooks/tree-key.mjs`: `treeKey()`, `readCache()`, `writeCache(key)`.
4. Write the six hook scripts in the order of section 4.
5. Write `.claude/settings.json` and `.claude/.gitignore`.
6. Write `.claude/hooks/selftest.mjs` with the scratch repo and all 58 numbered cases.
7. `npx prettier --write` over the new `.claude` files and `package.json`.
8. Add the selftest to `check` in `package.json`; run `node .claude/hooks/selftest.mjs`
   until green.
9. Run `npm run check`. **From its real output, confirm `All files` appears and none
   of the failure patterns do**; adjust `check-observer.mjs` if either is wrong, and
   record the observed marker in `.claude/README.md`.
10. Apply the section 6 edits: `CLAUDE.md`, the two prompts, `.claude/README.md`,
    `.claude/improvements.md`, `eslint.config.mjs`.
11. Confirm `CLAUDE.md` is under 200 lines (`wc -l CLAUDE.md`, expect 185).
12. Re-run `npm run check`.
13. Stage **by name**. `git status` must still show
    `app/src/components/PageHead.svelte`, `app/src/components/TablesPage.svelte` and
    `tests/parity/driver.js` as modified and unstaged afterwards.
14. Commit. Conventional Commits, author `artex-x <artex-x@users.noreply.github.com>`,
    no AI attribution trailer. Never push.
15. In the final message: tell the human the hooks are inert until the session is
    restarted, and offer the safe live probe below.

**Safe live probe, after a restart:** `git stash drop` with no stash. The hook denies
it; without the hook it fails harmlessly on an empty stash list. Never probe with a
command that would do damage if the deny does not take - in particular, never
`git reset --hard` or `git clean -fd` against this tree.

---

## 9. Risks, do-nots, and settled decisions not to reopen

**Do not:**

- Do not stage or commit `app/src/components/PageHead.svelte`,
  `app/src/components/TablesPage.svelte`, or `tests/parity/driver.js`. All three are
  modified in the working tree, all three belong to issue 47, and this task must leave
  them exactly as it found them. Stage by name, never `git add -A` - which is also
  what hook #8 exists to prevent.
- Do not use `bash` + `jq` anywhere. `jq` is not installed on this box, and the
  previous shell version's defensive `command -v jq || exit 0` made a guard that
  could never fire (`60172d3`).
- Do not rebuild a usage or rate-limit guard. Measured impossible here (`79e26c9`).
- Do not run `npm run check`, spawn a browser, or make a network call from any hook.
- Do not use exit code 2 anywhere. The uniform protocol is exit 0 plus JSON.
- Do not add `.claude/**` to eslint or a tsconfig. It is ignored on purpose.
- Do not hand-format `.claude/settings.json` or the `.mjs` files.
- Do not change a public contract, route, generated artefact or rendered screen.

**Risks and their mitigations:**

| Risk | Mitigation |
|---|---|
| `All files` is not in this repo's check output, so the gate never opens | Step 9 verifies it against a real run before the commit; the `SKIP_CHECK_GATE=1` hatch exists regardless |
| `permissionDecision: "deny"` is not honoured on this host | Step 15's `git stash drop` probe settles it harmlessly; the fallback is exit 2 with the reason on stderr |
| `additionalContext` on `PreToolUse` is ignored | The same text also goes out as `systemMessage`, so the human sees it either way |
| The tree key costs more than 344 ms on a colder cache | It runs only on `git commit`, and only after the cheap covered-file test has already decided the gate applies |
| Concurrent subagents clobber `.hook-state.json` | Last-writer-wins is accepted; the only consequence is one duplicate reminder |
| A hook fires inside a subagent where the message is useless | The guards are meant to fire in subagents - a worker is exactly who runs `git add -A`. Only the `Stop` hook is coordinator-shaped, and `Stop` does not fire for subagents (`SubagentStop` does, and is not registered) |

**Settled - do not reopen:**

- Hooks own deterministic enforcement; prompts own judgment. (`context.md`)
- Node, ESM, `.mjs`. (`context.md`)
- Every script exits 0; decisions live in JSON.
- The `Stop` hook warns and never blocks. (Section 4, hook 6, three reasons.)
- A task with no `handoff.md` never triggers a staleness warning.
- The commit gate is scoped to files `npm run check` actually reads, and uses the
  staged set rather than the tree's dirty set.
- The escape hatch is `SKIP_CHECK_GATE=1` in the command, and it announces itself.
- The selftest lives in `.claude/hooks/`, not `tests/`.
- Candidate #19 (`agent_type` write-scoping) is deferred, not rejected forever; the
  experiment that would settle it is named in section 5.
