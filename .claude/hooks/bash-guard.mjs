// PreToolUse(Bash|PowerShell): the rule families evaluated in order, first
// deny wins. A PowerShell command is normalised first (lib.mjs,
// normalizeCommand) and then judged by the same families.
// See .claude/README.md, "Hooks", for what each family blocks and for the
// sanitiser's known limits. Never blocks anything not listed there.
// segmentInfo already skips READERS and unwraps env/command/nohup/time/xargs,
// so `echo npm run check` never matches and `nohup npm run check` does.

import { spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import {
  readInput,
  guard,
  deny,
  speak,
  once,
  repoRoot,
  relPath,
  pathKey,
  isExempt,
  git,
  sanitize,
  segments,
  tokensOf,
  unwrap,
  dropAssignments,
  normalizeCommand,
  isSupabaseCall,
  programName,
  remoteRefsHoldingMigration,
  migrationLockedMessage,
  MIGRATIONS_DIR,
  CHECK_INVOCATION_RE
} from './lib.mjs';
import { treeKey, readCache } from './tree-key.mjs';

const READERS = new Set([
  'echo',
  'printf',
  'grep',
  'rg',
  'cat',
  'head',
  'tail',
  'sed',
  'awk',
  'less',
  'more',
  'type',
  'which'
]);

const MSG = {
  gitResetHard:
    'Blocked: `git reset --hard` discards every uncommitted change in this tree, including work that belongs to another task. Park your own changes with `git stash push -- <paths>`, unstage with `git restore --staged <path>`, or ask the human to run the reset themselves.',
  gitCleanForce:
    'Blocked: `git clean` with -f deletes untracked files permanently. Run it with -n first and act on the list, or delete the specific paths you meant.',
  gitPushForce:
    'Blocked: a force push in any form (`--force`, `-f`, `--force-with-lease`, `--force-if-includes`, `+<ref>`) rewrites history the remote already has, and `CLAUDE.md` forbids it: a push closes the amend window, so the fix is a new commit on top. `--dry-run` is allowed.',
  gitDiscard:
    'Blocked: this overwrites working-tree changes, and this tree carries in-flight work from other tasks. If you only meant to unstage, use `git restore --staged <path>`. Otherwise name the exact file and confirm with the human.',
  gitStashDestroy:
    'Blocked: this throws away a stash permanently. Inspect it first with `git stash list` and `git stash show -p`.',
  rmRfRepo:
    'Blocked: `rm -r` inside the repository, with or without `-f`. Delete named files, or run `git clean -n` to see what is actually untracked. dist, dist-test, coverage, test-output, node_modules and i (build output, not source) are exempt from this rule.',
  commitAttribution:
    'Blocked: this commit message carries AI attribution. This repository\'s commit messages never carry it - no Co-Authored-By trailer, no "Generated with" line. Rewrite the message without it.',
  gateBypassed: (commands) =>
    `Commit gate bypassed with SKIP_CHECK_GATE=1 - ${commands.join(' and ')} has not passed for this tree.`,
  checkDbGate: (count) =>
    `Blocked: \`npm run check:db\` has not passed for this working tree (${count} files under supabase/ or tests/db/ in this commit). Run \`npm run check:db\` in the foreground with the tool timeout set to 600000 - on Windows through the PowerShell tool, because Git Bash hangs on docker - then commit again. A passing result is remembered until the tree changes.\nIf the check genuinely cannot run, say why in your summary and repeat the command with SKIP_CHECK_GATE=1 in front of it.`,
  hostedWrite: (shape) =>
    `Blocked: \`${shape}\` is not on the allowlist of \`supabase\` commands; agents write to the test project only, never to production or to a target the command does not name. Allowed: the local stack (\`--local\`), \`--dry-run\` forms, \`status\`, \`config diff\`, \`--help\`, and a \`db\`, \`migration\` or \`config push\` command that names the test project (\`--project-ref rdjxcjkhsklhprmzxajq\`, a \`--db-url\` that carries that ref, \`npm run db:push -- --project test\`, \`npm run limits:set -- --project test\`); production is CI's (\`migrate-prod\`) or the owner's interactive \`npm run db:push -- --project prod\` (.claude/README.md, "Supabase configuration").`,
  cloudPush:
    'Blocked: a cloud session pushes only its own task branch, never `main`; the orchestrator squash-merges it onto `main` (`CLAUDE.md`). Push the current branch by name, for example `git push -u origin <current branch>`, without --all, --mirror, --tags or --delete.',
  gitleaksFinding: (hits) =>
    `Blocked: gitleaks found ${hits.length === 1 ? 'a secret' : 'secrets'} in the staged changes: ${hits.join(', ')}. Remove the value from the file and from the index, or allowlist a false positive in .gitleaks.toml. There is no bypass.`,
  gitleaksMissing: 'gitleaks is not on PATH; this commit was not scanned for secrets.',
  gitleaksFailed: (what) =>
    `gitleaks did not finish (${what}); this commit was not scanned for secrets.`,
  backgroundCheck:
    "Blocked: a backgrounded `npm run check` can never satisfy the commit gate - there is no stdout to attribute, and a turn that ends with it running loses the result. Run it in the foreground in this turn, Bash timeout 600000: `rtk npm run check` (no pipe, no `set -o pipefail` - with nothing piping the output away, the exit code the tool reports is already the check's).",
  blindCheckPipe:
    "Blocked: piping the check hands the Bash tool the *last* stage's exit status, not the check's, so a failed run comes back indistinguishable from a passing one and you spend a second run learning what you already ran. Drop the pipe: `rtk npm run check`, Bash timeout 600000. `rtk` propagates the child's exit code directly and prints both stdout and stderr (measured: 21,382 characters, under the tool's output cap), and check-observer.mjs reports PASS or FAIL in one line of its own - there is nothing left to recover through a pipe.",
  blindCheckRedirect:
    'Blocked: redirecting the check to a file hides its stdout from check-observer.mjs, so the commit gate never arms and the next `git commit` is refused - and reading the file back costs a second call. Run it plainly: `rtk npm run check`, Bash timeout 600000. If a run ever does come back persisted as too large, grep the file the tool names rather than redirecting the run yourself.',
  orphanTask: (target, hits) => {
    const shown = hits.slice(0, 4).join(', ');
    const more = hits.length > 4 ? ', ...' : '';
    return `Blocked: \`${target}\` is still cited by ${hits.length} tracked line(s): ${shown}${more}. Repair every citation first - state the fact where it is cited, retarget it to its permanent home (\`docs/specs/\`, \`.claude/README.md\`, \`docs/decisions/\`), or qualify a history-only pointer as \`git show <sha>:<path>\` - then delete in the same commit.`;
  },
  migrationLocked: migrationLockedMessage,
  orphanTaskBare:
    "Blocked: `issues` (or `issues/`) deletes every task directory in one command, including the live task's own and anyone else's in-flight work - there is no legitimate reason to retire all of `issues/` at once. Retire one task at a time: `git rm -r issues/<id>`, after its citations are repaired.",
  grepLineNumber:
    'Blocked: this `grep -n` is in a shape `rtk` 0.48.0 is measured (`rtk hook check "<command>"`) never to rewrite - a non-final pipe stage, inside `$(...)`/backtick, or wrapped by `xargs`/`nohup`/`time` - so its output lands unfiltered in context. Restructure it into its own command, `rtk grep -n <pattern> <path>` (a `&&`/`;`/`cd` prefix is fine and does not need restructuring - only a pipe or substitution does). `git grep -n` is not affected.',
  tailBytes:
    'Blocked: `tail -c`/`--bytes` has no `rtk` 0.48.0 rewrite in any position - it lacks a byte-offset mode (`rtk read` only exposes `--tail-lines`) - so its output lands unfiltered in context. Restructure it into its own command, `rtk read <file> --tail-lines <n>` if line-based tailing works, or accept the unfiltered read otherwise. `tail -n` is not affected.'
};

// ---------- sanitiser + segmenter (plan section 4, 2a) ----------
//
// sanitize/segments/tokensOf/unwrap now live in lib.mjs, because
// check-observer.mjs has to segment a command the same way this file does.

function gitSubcommand(tokens) {
  // tokens[0] === 'git'
  let i = 1;
  while (i < tokens.length) {
    const t = tokens[i];
    if (t === '-C' || t === '-c') {
      i += 2;
      continue;
    }
    if (t.startsWith('--git-dir=') || t.startsWith('--work-tree=')) {
      i += 1;
      continue;
    }
    break;
  }
  return { subcommand: tokens[i], rest: tokens.slice(i + 1) };
}

function segmentInfo(segment) {
  const tokens = unwrap(tokensOf(segment));
  if (!tokens.length) return null;
  const program = tokens[0];
  if (READERS.has(program)) return null;
  return { tokens, program };
}

// ---------- 2b: the blocklist ----------

function flagMatches(tokens, letter) {
  const re = new RegExp(`^-[a-zA-Z]*${letter}`);
  return tokens.some((t) => t.startsWith('-') && !t.startsWith('--') && re.test(t));
}

// `-f` no longer gates this: a bare `rm -r` on a tracked directory is just as
// destructive as `rm -rf` (recursion alone removes the whole tree; nothing
// about it prompts per-file unless a target is read-only), and the reviewer
// blockers this rule exists for were never about `-f` specifically.
function rmHasRecursive(tokens) {
  for (const t of tokens.slice(1)) {
    if (t === '--recursive') return true;
    if (/^-[a-zA-Z]+$/.test(t) && /[rR]/.test(t)) return true;
  }
  return false;
}

function rmTargetInsideRepo(tokens, cwd) {
  // i is exempt too: the 1272 share stubs are build output regenerated by
  // `npm run data` (tools/build.js), never hand-edited - the same standing
  // as dist and coverage.
  const exempt = /^(dist|dist-test|coverage|test-output|node_modules|i)(\/|$)/;
  const targets = tokens.slice(1).filter((t) => !t.startsWith('-'));
  for (const t of targets) {
    const rel = relPath(t, cwd);
    if (rel && !exempt.test(rel)) return true;
  }
  return false;
}

function evaluateBlocklist(segList, cwd) {
  for (const segment of segList) {
    const info = segmentInfo(segment);
    if (!info) continue;
    const { tokens, program } = info;

    if (program === 'git') {
      const { subcommand, rest } = gitSubcommand(tokens);
      if (subcommand === 'reset' && tokens.includes('--hard')) {
        return { id: 'git-reset-hard', message: MSG.gitResetHard };
      }
      if (subcommand === 'clean') {
        const hasForce = tokens.includes('--force') || flagMatches(tokens, 'f');
        const hasDryRun = tokens.includes('--dry-run') || flagMatches(tokens, 'n');
        if (hasForce && !hasDryRun) {
          return { id: 'git-clean-force', message: MSG.gitCleanForce };
        }
      }
      if (subcommand === 'push') {
        // Every force form is denied, not only a bare --force: with one
        // amended commit per task (CLAUDE.md, "Source and commit
        // conventions"), an amend after a push is the tempting mistake, and
        // a lease that succeeds is still the rewrite CLAUDE.md forbids.
        // --dry-run still exempts - it changes nothing on the remote.
        const hasForce =
          tokens.includes('--force') ||
          flagMatches(tokens, 'f') ||
          tokens.some(
            (t) => t === '--force-with-lease' || t.startsWith('--force-with-lease=')
          ) ||
          tokens.includes('--force-if-includes') ||
          tokens.some((t) => t.startsWith('+') && t.length > 1);
        if (hasForce && !tokens.includes('--dry-run')) {
          return { id: 'git-push-force', message: MSG.gitPushForce };
        }
      }
      if (subcommand === 'checkout') {
        if (tokens.includes('--') || tokens.includes('.')) {
          return { id: 'git-discard', message: MSG.gitDiscard };
        }
      }
      if (subcommand === 'restore') {
        // --worktree (or its -W cluster form) discards working-tree content
        // even alongside --staged, which only ever unstages - so a --staged
        // --worktree combo denies too, not only a bare restore.
        const hasWorktree = tokens.includes('--worktree') || flagMatches(tokens, 'W');
        if (!tokens.includes('--staged') || hasWorktree) {
          return { id: 'git-discard', message: MSG.gitDiscard };
        }
      }
      if (subcommand === 'stash') {
        if (rest[0] === 'drop' || rest[0] === 'clear') {
          return { id: 'git-stash-destroy', message: MSG.gitStashDestroy };
        }
      }
    }

    if (program === 'rm') {
      if (rmHasRecursive(tokens) && rmTargetInsideRepo(tokens, cwd)) {
        return { id: 'rm-rf-repo', message: MSG.rmRfRepo };
      }
    }
  }
  return null;
}

// ---------- 2i: deny removing a still-cited issues/<id>/ file or directory ----------
//
// bash-guard.mjs is the only site with both the input (the rm/git-rm
// target, before the file is gone) and the timing (before the retirement
// commit). edit-guard.mjs never sees a deletion; session-stop.mjs would
// fire on history rather than on the action, after the content is only
// recoverable from git history; selftest.mjs cannot be the rule, since it
// runs inside npm run check and a .md-only retirement commit is gate-exempt.
// See .claude/README.md, "Hooks", row 40, for the rejected sites and the
// fallback (a speak instead of a deny) if this proves too blunt in use.
//
// Closeout retires a whole task directory every time, not rarely, so the
// rule sees a `git rm -r issues/<id>` the same way it always saw a plan.md
// target. A bare `issues/<id>` or `issues/<id>/` token is a directory
// target, needled on the unslashed `issues/<id>`, boundary-tested on both
// sides so a sibling id sharing a prefix does not match; any other path
// under it keeps the old, exact-path behaviour. A bare `issues` or
// `issues/` token retires every task directory in one command, including
// the live task's own and anyone else's in-flight work - denied outright,
// the same class as `rm -rf` inside the repo, rather than routed through
// the citation audit below: enumerating "every issues/<id> needle" would
// still allow it the moment every existing directory happened to be
// citation-free, which is exactly the state a fresh, not-yet-cited task
// directory can be in - there is no legitimate single command that means
// "delete all of issues/ at once".

const TASK_PATH_RE = /^issues\/([^/]+)(?:\/(.+))?$/;
const BARE_ISSUES = 'issues';

function orphanTaskTargets(segList, cwd) {
  const targets = new Set();
  for (const segment of segList) {
    const info = segmentInfo(segment);
    if (!info) continue;
    const { tokens, program } = info;
    let candidateTokens = null;
    if (program === 'rm') {
      candidateTokens = tokens.slice(1);
    } else if (program === 'git') {
      const { subcommand, rest } = gitSubcommand(tokens);
      if (subcommand === 'rm') candidateTokens = rest;
    }
    if (!candidateTokens) continue;
    for (const token of candidateTokens.filter((t) => !t.startsWith('-'))) {
      const stripped = token.endsWith('/') ? token.slice(0, -1) : token;
      const rel = relPath(stripped, cwd);
      if (!rel) continue;
      const key = pathKey(rel);
      if (key === BARE_ISSUES) {
        targets.add(BARE_ISSUES);
        continue;
      }
      const m = TASK_PATH_RE.exec(key);
      if (!m) continue;
      const taskId = m[1];
      const needle = m[2] ? key : `issues/${taskId}`;
      targets.add(needle);
    }
  }
  return [...targets];
}

// A citation immediately preceded by a commit sha or HEAD (optionally with
// ~/^N) and a colon - the `git show <sha>:path` shape - resolves through git
// history, not through the working tree, so retiring the file does not break
// it. Family 2 (a citation split across lines, or wrapped some other way)
// stays unimplemented; see .claude/README.md, "Known limitations".
const SHA_CITE_RE = /(?:[0-9a-f]{7,40}|HEAD[~^\d]*)\s*:\s*$/i;

// A match whose preceding text on the line is an unbroken URL: a GitHub
// issue link and a task-directory path are the same characters, and the
// comment standard allows a GitHub issue number as a permanent citation, so
// the rule must not deny on one.
const URL_CITE_RE = /https?:\/\/[^\s)'"`]*$/;

// A character that continues an identifier segment: letters, digits,
// underscore, hyphen - a task id can itself contain hyphens. An unslashed
// directory needle (`issues/<id>`) is a substring of both a real
// citation of a file inside it (`issues/<id>/plan.md`, boundary char `/`)
// and a false one naming a sibling task whose id happens to start the same
// way (`issues/<id>-2`, boundary char `-`) - only the former is a real
// citation, and the test is the character immediately before and after the
// match, not the needle's shape.
function isIdentChar(ch) {
  return ch !== undefined && /[A-Za-z0-9_-]/.test(ch);
}

/** True when `content` contains `needle` at a real, non-sha-qualified,
 * non-URL citation: an identifier-boundary match (see isIdentChar) whose
 * preceding text does not end in a `git show <sha>:`/`HEAD:` qualifier
 * (SHA_CITE_RE) or an unbroken URL (URL_CITE_RE). Scans every occurrence,
 * not only the first: a line can carry a sha-qualified or URL
 * mention and a live one together, and `indexOf`'s first hit used to exempt
 * the whole line regardless of what came after it. */
function hasLiveCitation(content, needle) {
  let from = 0;
  for (;;) {
    const idx = content.indexOf(needle, from);
    if (idx === -1) return false;
    const before = idx > 0 ? content[idx - 1] : undefined;
    const after =
      idx + needle.length < content.length ? content[idx + needle.length] : undefined;
    if (
      !isIdentChar(before) &&
      !isIdentChar(after) &&
      !SHA_CITE_RE.test(content.slice(0, idx)) &&
      !URL_CITE_RE.test(content.slice(0, idx))
    ) {
      return true;
    }
    from = idx + 1;
  }
}

/** Tracked lines citing `needle` (a repo-relative, folded file path, or an
 * unslashed `issues/<id>` directory prefix), as "file:line" strings. `git()`
 * returns null on a non-zero exit, which covers both "no matches" and "git
 * unavailable" - both mean no deny, and this function must not try to tell
 * them apart. Drops any hit whose file is itself under `issues/` (self-
 * citation is not scoped to the target's own task id - a citation from
 * one scratch directory into another cannot outlive either, since each is
 * deleted at its own closeout, and a still-open task's own ledger of the
 * paths it is retiring would otherwise cite - and so deny - its own
 * instruction), and any hit with no live (boundary-matched, non-sha-
 * qualified) occurrence of `needle` - see hasLiveCitation. */
function citingLines(needle) {
  const out = git(['grep', '-n', '--fixed-strings', '--', needle]);
  if (out === null) return [];
  const hits = [];
  for (const row of out.split('\n')) {
    if (!row) continue;
    const first = row.indexOf(':');
    if (first === -1) continue;
    const file = row.slice(0, first);
    const rest = row.slice(first + 1);
    const second = rest.indexOf(':');
    const line = second === -1 ? rest : rest.slice(0, second);
    if (pathKey(file).startsWith('issues/')) continue;
    const content = second === -1 ? '' : rest.slice(second + 1);
    if (hasLiveCitation(content, needle)) hits.push(`${file}:${line}`);
  }
  return hits;
}

function evaluateOrphanTask(segList, cwd) {
  for (const target of orphanTaskTargets(segList, cwd)) {
    if (target === BARE_ISSUES) {
      return { id: 'orphan-task', message: MSG.orphanTaskBare };
    }
    const hits = citingLines(target);
    if (hits.length) return { id: 'orphan-task', message: MSG.orphanTask(target, hits) };
  }
  return null;
}

// ---------- 2p: deny removing or moving a pushed migration ----------
//
// edit-guard.mjs locks a migration that a remote-tracking ref holds, but a
// deletion or a rename never reaches an Edit-family tool. The same lock,
// with the same bounded fetch, for `git rm`, `git mv`, `rm` and `mv`: every
// positional token under supabase/migrations/ is checked, so `git mv <new>
// <pushed>` is refused too. The shell expands a glob only after this hook
// has judged the command, so a directory that holds the migrations and a
// glob in a token's last segment are expanded here. A move's destination
// only receives, so a directory there is not expanded.

const MIGRATIONS_KEY = MIGRATIONS_DIR.slice(0, -1);

/** Returns the repo-relative paths of every file under `rel`, a directory. */
function filesUnder(rel) {
  let entries;
  try {
    entries = readdirSync(path.join(repoRoot(), rel), { recursive: true, withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.isFile())
    .map((e) =>
      path.relative(repoRoot(), path.join(e.parentPath, e.name)).split(path.sep).join('/')
    );
}

/** Returns the migration paths that `rel` names: itself, the files under a
 * directory at, under or above supabase/migrations, or the matches of a
 * glob in its last segment. */
function expandMigrationToken(rel, { expandDirectory }) {
  const key = pathKey(rel);
  const slash = rel.lastIndexOf('/');
  const last = rel.slice(slash + 1);
  if (/[*?]/.test(last)) {
    const parent = slash === -1 ? '.' : rel.slice(0, slash);
    const source = last
      .split('')
      .map((c) =>
        c === '*' ? '[^/]*' : c === '?' ? '[^/]' : c.replace(/[.+^${}()|[\]\\]/g, '\\$&')
      )
      .join('');
    const re = new RegExp(`^${source}$`, process.platform === 'win32' ? 'i' : '');
    let names;
    try {
      names = readdirSync(path.join(repoRoot(), parent));
    } catch {
      return [];
    }
    return names
      .filter((name) => re.test(name))
      .map((name) => (parent === '.' ? name : `${parent}/${name}`))
      .filter((p) => pathKey(p).startsWith(MIGRATIONS_DIR));
  }
  const holds =
    key === MIGRATIONS_KEY ||
    key.startsWith(MIGRATIONS_DIR) ||
    key === '.' ||
    MIGRATIONS_DIR.startsWith(`${key}/`);
  if (expandDirectory && holds) {
    const stat = statSync(path.join(repoRoot(), rel), { throwIfNoEntry: false });
    if (stat && stat.isDirectory()) {
      const base = key.startsWith(MIGRATIONS_DIR) ? rel : MIGRATIONS_KEY;
      return filesUnder(base).filter((p) => pathKey(p).startsWith(MIGRATIONS_DIR));
    }
  }
  return key.startsWith(MIGRATIONS_DIR) && key.length > MIGRATIONS_DIR.length ? [rel] : [];
}

function migrationTargets(segList, cwd) {
  const targets = [];
  for (const segment of segList) {
    const info = segmentInfo(segment);
    if (!info) continue;
    const { tokens, program } = info;
    let candidates = null;
    let verb = program;
    if (program === 'rm' || program === 'mv') candidates = tokens.slice(1);
    else if (program === 'git') {
      const { subcommand, rest } = gitSubcommand(tokens);
      if (subcommand === 'rm' || subcommand === 'mv') candidates = rest;
      verb = subcommand;
    }
    if (!candidates) continue;
    const positional = candidates.filter((t) => !t.startsWith('-'));
    for (const [i, token] of positional.entries()) {
      const rel = relPath(token, cwd);
      if (!rel) continue;
      const destination = verb === 'mv' && i === positional.length - 1 && i > 0;
      targets.push(...expandMigrationToken(rel, { expandDirectory: !destination }));
    }
  }
  return targets;
}

function evaluatePushedMigration(segList, cwd) {
  const targets = migrationTargets(segList, cwd);
  for (const [i, rel] of targets.entries()) {
    const refs = remoteRefsHoldingMigration(rel.slice(MIGRATIONS_DIR.length), {
      fetch: i === 0
    });
    if (refs.length) return { id: 'pushed-migration', message: MSG.migrationLocked(rel, refs) };
  }
  return null;
}

// ---------- 2c: blanket staging ----------

function commitOrAddInfo(segList) {
  const hits = [];
  for (const segment of segList) {
    const info = segmentInfo(segment);
    if (!info || info.program !== 'git') continue;
    const { subcommand, rest } = gitSubcommand(info.tokens);
    if (subcommand === 'add') hits.push({ kind: 'add', rest });
    else if (subcommand === 'commit') hits.push({ kind: 'commit', rest });
  }
  return hits;
}

function evaluateBlanketStage(segList, cwd) {
  const hits = commitOrAddInfo(segList);
  // flagMatches, not includes(): the idiomatic spellings are clusters
  // (`git commit -am`, `git add -Av`), and an equality test against a whole
  // token missed every one of them.
  const triggered = hits.some((h) => {
    if (h.kind === 'add') {
      return (
        flagMatches(h.rest, 'A') ||
        h.rest.includes('--all') ||
        h.rest.includes('.') ||
        h.rest.includes(':/')
      );
    }
    return flagMatches(h.rest, 'a') || h.rest.includes('--all');
  });
  if (!triggered) return null;
  const status = spawnSync('git', ['status', '--porcelain', '-uall'], {
    cwd: cwd || repoRoot(),
    encoding: 'utf8'
  });
  if (status.error || status.status !== 0) return null;
  const paths = status.stdout.split('\n').filter(Boolean);
  if (paths.length < 2) return null;
  return {
    id: 'blanket-stage',
    message: `Blocked: this would stage all ${paths.length} changed paths, and this tree carries work from other tasks. Stage the files this batch touched by name: \`git add <path> <path>\`.`
  };
}

// ---------- 2d: commit-message attribution ----------

function isCommitSegment(segList) {
  return commitOrAddInfo(segList).some((h) => h.kind === 'commit');
}

function evaluateAttribution(rawCommand, segList) {
  if (!isCommitSegment(segList)) return null;
  if (
    /co-?authored-by/i.test(rawCommand) ||
    /generated with \[?claude/i.test(rawCommand) ||
    rawCommand.includes('\u{1F916}')
  ) {
    return { type: 'deny', id: 'commit-attribution', message: MSG.commitAttribution };
  }
  return null;
}

// ---------- 2e: the commit gate ----------
//
// isExempt() now lives in lib.mjs, shared with tree-key.mjs's fingerprint -
// see its comment there for why the two have to agree.

// `git commit` options that take the next token as their value, so the value
// is not read as a pathspec.
const COMMIT_VALUE_FLAGS = new Set([
  '-m',
  '--message',
  '-F',
  '--file',
  '-C',
  '--reuse-message',
  '-c',
  '--reedit-message',
  '--fixup',
  '--squash',
  '--author',
  '--date',
  '-t',
  '--template',
  '--cleanup',
  '--trailer'
]);
const COMMIT_VALUE_LETTERS = new Set(['m', 'F', 'C', 'c', 't']);

/** Returns the pathspec of `git commit`'s arguments: the positional tokens,
 * and everything after a bare `--`. A short cluster such as `-am` takes the
 * next token when its last letter takes a value. */
function commitPathspec(rest) {
  const pathspec = [];
  for (let i = 0; i < rest.length; i++) {
    const t = rest[i];
    if (t === '--') {
      pathspec.push(...rest.slice(i + 1));
      break;
    }
    // The file's paths are unknown here, so the whole tree counts.
    if (t === '--pathspec-from-file' || t.startsWith('--pathspec-from-file=')) {
      pathspec.push('.');
      if (t === '--pathspec-from-file') i++;
      continue;
    }
    if (COMMIT_VALUE_FLAGS.has(t)) {
      i++;
      continue;
    }
    if (t.startsWith('--')) continue;
    if (t.startsWith('-') && t.length > 1) {
      if (/^-[a-zA-Z]+$/.test(t) && COMMIT_VALUE_LETTERS.has(t[t.length - 1])) i++;
      continue;
    }
    // A redirect (`2>&1`, `> log`) is not a path.
    if (/^(?:\d*|&)[<>]/.test(t)) {
      if (/^(?:\d*|&)[<>]{1,2}$/.test(t)) i++;
      continue;
    }
    pathspec.push(t);
  }
  return pathspec;
}

// The word an erased quoted span leaves in `quotedSegs`: the message of
// `git commit -m "chore: x" path` is a value, not a pathspec entry.
const QUOTED = '_quoted_';

/** Returns the arguments after the first `git commit` in `segList`, or null. */
function firstCommitRest(segList) {
  for (const segment of segList) {
    const info = segmentInfo(segment);
    if (!info || info.program !== 'git') continue;
    const { subcommand, rest } = gitSubcommand(info.tokens);
    if (subcommand === 'commit') return rest;
  }
  return null;
}

/** Describes the first `git commit` in `segList`. `quotedSegs` is the same
 * command sanitized with the QUOTED placeholder; the pathspec is read from
 * it. */
function commitInfo(segList, quotedSegs = segList) {
  const rest = firstCommitRest(segList);
  if (rest === null) return { isCommit: false };
  return {
    isCommit: true,
    // Cluster-aware: `git commit -am` stages every modified tracked file
    // exactly as `-a` does, so the gate has to union the unstaged diff
    // for it too or an empty index reads as "nothing to check".
    hasAllFlag: flagMatches(rest, 'a') || rest.includes('--all'),
    hasDryRun: rest.includes('--dry-run'),
    pathspec: commitPathspec(firstCommitRest(quotedSegs) ?? rest)
  };
}

/** True only when SKIP_CHECK_GATE=1 is a real environment prefix on some
 * segment. Testing the raw command let `git commit -m "add SKIP_CHECK_GATE=1
 * support"` bypass the gate by talking about it. */
function hasGateBypass(segList) {
  for (const segment of segList) {
    for (const token of tokensOf(segment)) {
      if (!/^[A-Za-z_][A-Za-z0-9_]*=/.test(token)) break;
      if (token === 'SKIP_CHECK_GATE=1') return true;
    }
  }
  return false;
}

// 2m rides on 2e: a path under supabase/ or tests/db/ also needs a passing
// `npm run check:db` for the same tree key, which check-observer.mjs
// records in .check-db-cache.json. SKIP_CHECK_GATE=1 bypasses both.
function isDbPath(p) {
  return p.startsWith('supabase/') || p.startsWith('tests/db/');
}

/** True when `p` is a pathspec entry or lies under a directory entry. */
function matchesPathspec(p, pathspec) {
  return pathspec.some((spec) => {
    const s = spec.replace(/^\.\//, '').replace(/\/$/, '');
    return s === '.' || p === s || p.startsWith(`${s}/`);
  });
}

function evaluateCommitGate(segList, cwd, quotedSegs = segList) {
  const info = commitInfo(segList, quotedSegs);
  if (!info.isCommit || info.hasDryRun) return null;

  const cwdOpt = cwd || repoRoot();
  const cached = spawnSync('git', ['diff', '--cached', '--name-only'], {
    cwd: cwdOpt,
    encoding: 'utf8'
  });
  if (cached.error || cached.status !== 0) return null; // fail open
  let paths = cached.stdout.split('\n').filter(Boolean);
  if (info.hasAllFlag || info.pathspec.length) {
    const unstaged = spawnSync('git', ['diff', '--name-only'], {
      cwd: cwdOpt,
      encoding: 'utf8'
    });
    if (!unstaged.error && unstaged.status === 0) {
      let extra = unstaged.stdout.split('\n').filter(Boolean);
      // A pathspec commit takes the unstaged changes of the named paths only.
      if (!info.hasAllFlag) extra = extra.filter((p) => matchesPathspec(p, info.pathspec));
      paths = paths.concat(extra);
    }
  }
  const covered = paths.filter((p) => !isExempt(p));
  const dbPaths = paths.filter(isDbPath);
  // nothing npm run check or check:db reads
  if (covered.length === 0 && dbPaths.length === 0) return null;

  const key = treeKey();
  if (key === null) return null; // fail open: cannot fingerprint the tree

  const cache = readCache();
  const needCheck = covered.length > 0 && !(cache && cache.key === key);
  const dbCache = readCache('.check-db-cache.json');
  const needDb = dbPaths.length > 0 && !(dbCache && dbCache.key === key);
  if (!needCheck && !needDb) return null; // already passing

  if (hasGateBypass(segList)) {
    const missing = [];
    if (needCheck) missing.push('npm run check');
    if (needDb) missing.push('npm run check:db');
    return { type: 'speak', message: MSG.gateBypassed(missing) };
  }

  if (!needCheck) {
    return { type: 'deny', id: 'commit-gate-db', message: MSG.checkDbGate(dbPaths.length) };
  }
  const alsoDb = needDb
    ? ' This commit also stages files under supabase/ or tests/db/, so run `npm run check:db` as well, in the foreground with the tool timeout set to 600000 (on Windows through the PowerShell tool).'
    : '';
  return {
    type: 'deny',
    id: 'commit-gate',
    message: `Blocked: \`npm run check\` has not passed for this working tree (${covered.length} checked files in this commit). Run \`npm run check\`, then commit again - a passing result is remembered until the tree changes.${alsoDb}\nIf the check genuinely cannot run, say why in your summary and repeat the command with SKIP_CHECK_GATE=1 in front of it.`
  };
}

// ---------- 2n: the Supabase CLI allowlist (deny) ----------
//
// Deny by default: a `supabase` command runs only when its first two words
// are on the local allowlist below, or when it provably targets the test
// project (owner decision 2026-09-25: agents write to the test project
// only; production is CI's `migrate-prod` or the owner's). See
// .claude/README.md, "Hooks".

// Global CLI flags that take a value, so the value is not read as a
// subcommand.
const SUPABASE_VALUE_FLAGS = new Set([
  '--workdir',
  '--profile',
  '--network-id',
  '--log-level',
  '--output',
  '-o',
  '--output-format',
  '--dns-resolver',
  '--agent',
  '--project-ref',
  '--db-url'
]);

// The same ref as `PROJECTS.test` in tools/supabase/lib.mjs; tests/derived.js
// asserts that the two agree.
const TEST_PROJECT_REF = 'rdjxcjkhsklhprmzxajq';

function supabaseWords(rest) {
  const words = [];
  for (let i = 0; i < rest.length && words.length < 2; i++) {
    const t = rest[i];
    if (SUPABASE_VALUE_FLAGS.has(t)) {
      i++;
      continue;
    }
    if (t.startsWith('-')) continue;
    words.push(t);
  }
  return words;
}

function hasFlag(tokens, name) {
  return tokens.some((t) => t === name || t.startsWith(`${name}=`));
}

/** Returns every value of a flag written as `name value` or `name=value`;
 * a flag with no value gives an empty string. */
function flagValues(tokens, name) {
  const values = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] === name) values.push(tokens[i + 1] ?? '');
    else if (tokens[i].startsWith(`${name}=`)) values.push(tokens[i].slice(name.length + 1));
  }
  return values;
}

// A boolean flag set to false (`--local=false`, `--dry-run=0`) is absent,
// as the CLI's flag parser reads it.
function boolFlagOn(tokens, name) {
  return tokens.some(
    (t) =>
      t === name ||
      (t.startsWith(`${name}=`) && !/^(?:false|f|0)$/i.test(t.slice(name.length + 1)))
  );
}

/** Returns true when a connection string's host and user are the test
 * project's. A query string is refused: libpq reads `user=` and `host=`
 * there too, so it can move the target off the test project. */
function isTestDbUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (!/^postgres(?:ql)?:$/.test(url.protocol) || url.search || url.hash) return false;
  const user = decodeURIComponent(url.username);
  const poolerUser = `postgres.${TEST_PROJECT_REF}`;
  if (url.hostname === `db.${TEST_PROJECT_REF}.supabase.co`) {
    return user === 'postgres' || user === poolerUser;
  }
  return url.hostname.endsWith('.pooler.supabase.com') && user === poolerUser;
}

/** True when every target the command names is the test project: a
 * `--project-ref` equal to the test ref, or a `--db-url` whose host and user
 * are the test project's. `--linked` and a variable are not proof, because
 * the target then lives outside the command. */
function provenTestTarget(rest) {
  if (boolFlagOn(rest, '--linked')) return false;
  const refs = flagValues(rest, '--project-ref');
  const urls = flagValues(rest, '--db-url');
  if (!refs.length && !urls.length) return false;
  return refs.every((ref) => ref === TEST_PROJECT_REF) && urls.every(isTestDbUrl);
}

const ALWAYS = 'always';
const LOCAL = 'local';
const LOCAL_DEFAULT = 'local-default';
const DRY_RUN_OR_LOCAL = 'dry-run-or-local';

// Word pair (or single word) -> when the command may run. A pair that is
// not here is denied.
const SUPABASE_ALLOWLIST = new Map([
  ['', ALWAYS],
  ['start', ALWAYS],
  ['stop', ALWAYS],
  ['status', ALWAYS],
  ['init', ALWAYS],
  ['completion', ALWAYS],
  ['migration new', ALWAYS],
  ['functions new', ALWAYS],
  ['functions serve', ALWAYS],
  ['test new', ALWAYS],
  ['config diff', ALWAYS],
  ['db push', DRY_RUN_OR_LOCAL],
  ['db dump', DRY_RUN_OR_LOCAL],
  ['db reset', LOCAL],
  ['migration down', LOCAL],
  ['migration list', LOCAL],
  ['migration squash', LOCAL],
  ['db diff', LOCAL],
  ['db lint', LOCAL],
  ['db start', ALWAYS],
  ['gen types', LOCAL],
  ['test db', LOCAL],
  ['inspect db', LOCAL],
  ['seed buckets', LOCAL],
  ['migration up', LOCAL_DEFAULT]
]);

// Single-word commands take their own flags (`start -x gotrue`), whose
// values would read as a second word.
const SINGLE_WORD = new Set(['start', 'stop', 'status', 'init', 'completion']);

/** True when a `supabase` command with the arguments `rest` may run. */
function supabaseAllowed(rest) {
  // `--version` and `-v` are allowed only on the bare CLI (the '' entry):
  // `db reset --version <timestamp>` is a reset. A help flag in a value
  // position is refused by the CLI itself ("Missing value for flag").
  if (rest.some((t) => t === '--help' || t === '-h')) return true;
  const words = supabaseWords(rest);
  const pair = words.join(' ');
  if (
    provenTestTarget(rest) &&
    (words[0] === 'db' || words[0] === 'migration' || pair === 'config push')
  ) {
    return true;
  }
  const mode = SINGLE_WORD.has(words[0])
    ? SUPABASE_ALLOWLIST.get(words[0])
    : SUPABASE_ALLOWLIST.get(pair);
  const targeted =
    boolFlagOn(rest, '--linked') || hasFlag(rest, '--db-url') || hasFlag(rest, '--project-ref');
  const local = boolFlagOn(rest, '--local') && !targeted;
  if (mode === ALWAYS) return true;
  if (mode === DRY_RUN_OR_LOCAL) return boolFlagOn(rest, '--dry-run') || local;
  if (mode === LOCAL) return local;
  if (mode === LOCAL_DEFAULT) return !targeted;
  return false;
}

const HOSTED_SCRIPTS = new Set(['config:push', 'db:push', 'limits:set']);
// npm's verbs that run a package script: `run` and its aliases.
const NPM_RUN_VERBS = new Set(['run', 'run-script', 'rum', 'urn']);
// npm flags whose value is the next token when written without `=`.
const NPM_VALUE_FLAGS = new Set(['--loglevel', '--prefix', '-w', '--workspace']);

/** Returns the script that `tokens` (already unwrapped) run through `npm
 * run` or an alias of it, past a leading `rtk` and npm's own flags on
 * either side of the verb; otherwise null. */
function npmRunScript(tokens) {
  let t = tokens;
  if (t[0] === 'rtk') t = t.slice(t[1] === 'proxy' ? 2 : 1);
  if (!t.length || programName(t[0]) !== 'npm') return null;
  let i = 1;
  // Before the verb, an unknown `--name` flag without `=` takes the next
  // token as its value unless that token is a verb or a flag
  // (`npm --registry x run db:push`); after it, the next token is the script.
  const skipFlags = (beforeVerb) => {
    while (i < t.length && t[i].startsWith('-') && t[i] !== '--') {
      const next = t[i + 1];
      const takesValue =
        NPM_VALUE_FLAGS.has(t[i]) ||
        (beforeVerb &&
          t[i].startsWith('--') &&
          !t[i].includes('=') &&
          next !== undefined &&
          !NPM_RUN_VERBS.has(next) &&
          !next.startsWith('-'));
      i += takesValue ? 2 : 1;
    }
  };
  skipFlags(true);
  if (!NPM_RUN_VERBS.has(t[i])) return null;
  i++;
  skipFlags(false);
  return t[i] ?? null;
}

/** True when a `config:push`, `db:push` or `limits:set` wrapper names only
 * the test project. */
function npmTargetsTest(tokens) {
  const projects = flagValues(tokens, '--project');
  return projects.length > 0 && projects.every((p) => p === 'test');
}

function evaluateHostedWrite(segList) {
  for (const segment of segList) {
    const info = segmentInfo(segment);
    if (!info) continue;
    const joined = info.tokens.join(' ');
    if (HOSTED_SCRIPTS.has(npmRunScript(info.tokens))) {
      if (npmTargetsTest(info.tokens)) continue;
      return { id: 'hosted-write', message: MSG.hostedWrite(joined) };
    }
    const rest = isSupabaseCall(info.tokens);
    if (rest && !supabaseAllowed(rest)) {
      return { id: 'hosted-write', message: MSG.hostedWrite(joined) };
    }
  }
  return null;
}

// ---------- 2o: a cloud session pushes only its own branch (deny) ----------
//
// Only in a cloud session (CLAUDE_CODE_REMOTE=true): a release there
// pushes its task branch after every green commit, and the orchestrator
// squash-merges it onto `main` (.claude/README.md, "Cloud sessions").

const PUSH_VALUE_FLAGS = new Set(['-o', '--push-option', '--repo', '--receive-pack', '--exec']);
const PUSH_WIDE_FLAGS = new Set(['--all', '--mirror', '--tags', '--delete', '-d']);

function evaluateCloudPush(segList, cwd) {
  if (process.env.CLAUDE_CODE_REMOTE !== 'true') return null;
  for (const segment of segList) {
    const info = segmentInfo(segment);
    if (!info || info.program !== 'git') continue;
    const { subcommand, rest } = gitSubcommand(info.tokens);
    if (subcommand !== 'push') continue;
    const out = git(['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: cwd || repoRoot() });
    const branch = out === null ? null : out.trim();
    if (!branch || branch === 'main' || branch === 'HEAD') {
      return { id: 'cloud-push', message: MSG.cloudPush };
    }
    if (rest.some((t) => PUSH_WIDE_FLAGS.has(t))) {
      return { id: 'cloud-push', message: MSG.cloudPush };
    }
    const positional = [];
    for (let i = 0; i < rest.length; i++) {
      const t = rest[i];
      if (PUSH_VALUE_FLAGS.has(t)) {
        i++;
        continue;
      }
      // A redirect (`2>&1`, `> log`) is not a refspec.
      if (/^(?:\d*|&)[<>]/.test(t)) {
        if (/^(?:\d*|&)[<>]{1,2}$/.test(t)) i++;
        continue;
      }
      if (!t.startsWith('-')) positional.push(t);
    }
    for (const refspec of positional.slice(1)) {
      const dest = (refspec.includes(':') ? refspec.slice(refspec.indexOf(':') + 1) : refspec)
        .replace(/^\+/, '')
        .replace(/^refs\/heads\//, '');
      if (dest !== branch && dest !== 'HEAD') {
        return { id: 'cloud-push', message: MSG.cloudPush };
      }
    }
  }
  return null;
}

// ---------- 2l: gitleaks on every commit ----------
//
// Scans the staged changes before a non-dry-run `git commit`, and for `-a`
// or a pathspec also the unstaged working-tree diff. A finding in either
// denies, naming file, line and rule but never the secret. A missing
// binary, a timeout or any other failure allows the commit and says it was
// not scanned. LOOT_GITLEAKS_CMD (a JSON argv prefix replacing `gitleaks`)
// and LOOT_GITLEAKS_TIMEOUT_MS exist for the selftest only.

function gitleaksCommand() {
  try {
    const parsed = JSON.parse(process.env.LOOT_GITLEAKS_CMD || 'null');
    if (Array.isArray(parsed) && parsed.length && parsed.every((s) => typeof s === 'string')) {
      return parsed;
    }
  } catch {
    // an unreadable override means the real binary
  }
  return ['gitleaks'];
}

/** Runs one gitleaks scan: the index with `staged`, else the unstaged
 * working-tree diff. Returns a verdict, or null when the scan is clean. */
function gitleaksScan(staged) {
  const [program, ...prefix] = gitleaksCommand();
  // Two scans (`-a`, a pathspec) must both finish inside the hook's 10 s.
  const timeout = Number(process.env.LOOT_GITLEAKS_TIMEOUT_MS) || 4000;
  const r = spawnSync(
    program,
    [
      ...prefix,
      'git',
      '--pre-commit',
      ...(staged ? ['--staged'] : []),
      '--config',
      '.gitleaks.toml',
      '--redact',
      '--no-banner',
      '--log-level',
      'error',
      '--exit-code',
      '99',
      '--report-format',
      'json',
      '--report-path',
      '-',
      '.'
    ],
    { cwd: repoRoot(), encoding: 'utf8', timeout }
  );
  if (r.error) {
    if (r.error.code === 'ENOENT') return { type: 'speak', message: MSG.gitleaksMissing };
    if (r.error.code === 'ETIMEDOUT') {
      return { type: 'speak', message: MSG.gitleaksFailed(`no answer in ${timeout} ms`) };
    }
    return { type: 'speak', message: MSG.gitleaksFailed(r.error.code || 'spawn error') };
  }
  if (r.status === 0) return null;
  if (r.status === 99) {
    let hits = [];
    try {
      const findings = JSON.parse(r.stdout.slice(r.stdout.indexOf('[')));
      hits = findings.slice(0, 5).map((f) => `${f.File}:${f.StartLine} (${f.RuleID})`);
    } catch {
      // the finding list is unreadable; the deny still stands
    }
    if (!hits.length) hits = ['see `gitleaks git --pre-commit --staged --redact`'];
    return { type: 'deny', id: 'gitleaks', message: MSG.gitleaksFinding(hits) };
  }
  return { type: 'speak', message: MSG.gitleaksFailed(`exit ${r.status}`) };
}

function evaluateGitleaks(segList, quotedSegs = segList) {
  const info = commitInfo(segList, quotedSegs);
  if (!info.isCommit || info.hasDryRun) return null;
  const first = gitleaksScan(true);
  if (first) return first;
  // `-a` and a pathspec also commit unstaged changes; the two scans together
  // cover whatever any commit form can take from the tree.
  if (info.hasAllFlag || info.pathspec.length) return gitleaksScan(false);
  return null;
}

// Costs measured in this repository; see .claude/README.md, "Batch size and
// the fixed cost of a run", for the table these mirror. `golden` and `sweep`
// match only the *unsharded* / all-widths shape - a filtered or sharded call
// is the normal, one-call-sized way to run either and gets no reminder.
const LONG_CHECKS = [
  // Optional leading `rtk `: RTK's own hook rewrites a bare `npm run
  // check[:built]` into this shape before any hook sees it - see
  // CHECK_INVOCATION_RE in lib.mjs for the live probe that established it.
  { re: /^(?:rtk\s+)?npm run check:built\b/, family: 'check:built', cost: 'a few minutes' },
  {
    // Docker answers only the PowerShell tool on this Windows host, so this
    // entry has its own message instead of the Bash one below.
    re: /^(?:rtk\s+)?npm run check:db(?![:\w-])/,
    family: 'check:db',
    cost: 'first run 3-5 min (image pull), then ~1-2 min; on Windows run it through the PowerShell tool',
    message: (joined, cost) =>
      `\`${joined}\` takes ${cost}. Set the tool timeout to 600000 and stay in this turn until it prints its final \`check:db: PASS\` or \`check:db: FAIL\` line - check-observer.mjs arms the commit gate for supabase/ and tests/db/ from that line. Run it in the foreground, with no pipe and no redirect.`
  },
  { re: /^(?:rtk\s+)?npm run check(?![:\w-])/, family: 'check', cost: '~165s on an idle host' },
  {
    // No `--shard=` exemption, unlike `golden`/`sweep` below: a run-all
    // shard packs a whole `browser` matrix row of suites, not one small
    // slice - a local `--shard=4/4` measured 384s, so this is exactly the
    // shape the reminder exists for, not an exception to it.
    match: (joined) => /^node tests\/run-all\.js\b/.test(joined),
    family: 'run-all',
    cost: '~260-290s pooled when filtered to one route/filter set, up to ~380s for one --shard=n/4 row; an unfiltered, unsharded run cannot finish in one call'
  },
  {
    match: (joined) =>
      /^node tests\/app\/golden\.js\b/.test(joined) && !/--shard=/.test(joined),
    family: 'golden',
    cost: '~100-290s per shard; a bare, unsharded call cannot finish in one call - run --shard=n/4, four times'
  },
  {
    match: (joined) => {
      if (!/^node tests\/app\/sweep\.js\b/.test(joined)) return false;
      const rest = joined.replace(/^node tests\/app\/sweep\.js\b/, '');
      return !/\d/.test(rest); // no width argument -> all four widths
    },
    family: 'sweep',
    cost: '~320-590s per width; a call with no width argument runs all four and cannot finish in one call - run width by width'
  }
];

// ---------- 2g: a backgrounded npm run check (deny) ----------
//
// check-observer.mjs refuses a run_in_background launch by design (no
// stdout to attribute), so such a run can never satisfy the commit gate,
// and a worker whose turn ends with it running loses the result - observed
// three times despite the dispatch warning against it. Blocking it forbids
// nothing that works. Only the gate-feeding check:
// the other long checks can legitimately run detached from a main session.
// Per segment, not first-segment: the recorded shapes were piped, chained,
// `cd`-prefixed and file-redirected. Strict boolean, as the observer: an
// absent field must make this rule inert, never a false block.

function evaluateBackgroundCheck(segList, toolInput) {
  if (!toolInput || toolInput.run_in_background !== true) return null;
  for (const segment of segList) {
    const info = segmentInfo(segment);
    if (!info) continue;
    if (CHECK_INVOCATION_RE.test(info.tokens.join(' '))) {
      return { id: 'background-check', message: MSG.backgroundCheck };
    }
  }
  return null;
}

// ---------- 2k: a check whose result the tool cannot report (deny) ----------
//
// Measured across this project's 65 session transcripts (2026-09-18): of
// 71 real `npm run check` invocations, 61 were piped into `tail`/`grep`
// and 9 were redirected to a file. Exactly one was the bare form. Both
// shapes cost a second run, for different reasons:
//
//   - A pipe hands the Bash tool the last stage's exit status, not the
//     check's. `tail` always exits 0, so a failed check is indistinguishable
//     from a passing one and the worker re-runs it - or re-derives the
//     status with `echo $?` on a later line, which reports that echo's own
//     status, not the check's.
//   - A file redirect keeps the status but hides the stdout, so
//     check-observer.mjs cannot attribute the run and the gate never arms.
//     The worker then spends one call reading the file back, and if it
//     committed first, one more on the gate's refusal.
//
// The long-check reminder (2f) has told workers "no pipe needed" since
// decision 45 accepted RTK's prefix; those 61 piped runs are what a
// once-per-session reminder is worth against a habit the docs taught. The
// old advice was not wrong when it was written - before the `rtk ` prefix
// was accepted, `set -o pipefail; npm run check 2>&1 | tail -n 120` was
// the only invocation that armed the gate at all - but the shape outlived
// the reason for it.
//
// Blocking forbids nothing that works: `rtk npm run check` propagates the
// child's exit code directly and prints both streams under the output cap,
// and check-observer.mjs now states PASS or FAIL itself. `check:built` is
// covered too - same family, same blindness - though only `check` feeds the
// gate. This fires per pipe stage, not first-segment: the recorded shapes
// put the check behind `cd ... &&` and after `set -o pipefail;` as often as
// not.
const BLIND_CHECK_RE = /^(?:rtk\s+)?npm run check(?::built)?(?![:\w-])/;

function evaluateBlindCheck(sanitized) {
  // `2>&1` is a stderr merge, not a stdout redirect - the retired canonical
  // invocation carried one. It has to go before the split, not after:
  // LIST_SPLIT_RE treats its bare `&` as a list operator, so a later strip
  // would see `npm run check 2>` as a whole item and read the leftover `2>`
  // as a file redirect. Same order as check-observer.mjs, for the same
  // reason.
  const outer = sanitized.replace(/\d?>&\d/g, ' ').replace(SUBSTITUTION_RE, ' ');
  for (const listItem of splitListItems(outer)) {
    const stages = splitPipeStages(listItem);
    for (const stage of stages) {
      const tokens = unwrap(tokensOf(stage));
      if (!tokens.length) continue;
      if (!BLIND_CHECK_RE.test(tokens.join(' '))) continue;
      if (stages.length > 1) return { id: 'blind-check-pipe', message: MSG.blindCheckPipe };
      if (tokens.some((t) => /^\d?>>?/.test(t))) {
        return { id: 'blind-check-redirect', message: MSG.blindCheckRedirect };
      }
    }
  }
  return null;
}

// ---------- 2j: readers that bypass RTK (deny) ----------
//
// `grep -n` and `tail -c` were 96.4K of the 179.7K tokens RTK missed over
// thirty days (rtk discover, 2026-09-15). The boundary below is measured
// directly against the installed `rtk 0.48.0` with `rtk hook check
// "<command>"` (a reproducible probe - see .claude/README.md, "Facts
// settled during measurement (rtk-coverage, 2026-09-18)" for the full
// table), not inferred from RTK's own source or docs, because a rule
// inferred that way got it wrong twice already: RTK rewrites `grep -n`
// far more often than "leading and unchained" suggests,
// and denies it in one shape that positional reasoning alone would have
// allowed.
//
// Measured for `grep -n` (long form `--line-number` matches identically):
//   - a bare command, an env-var prefix (`A=1 grep -n f`), and on either
//     side of `&&`/`;`/`&`/a leading `cd` - always rewritten. List
//     operators never block it, in either direction: `cd d && grep -n x`,
//     `true; grep -n x`, `grep -n x && echo ok`, `grep -n x &` are all
//     rewritten.
//   - inside a pipe (`|`, never `||`, which is a list operator, not a
//     pipe): rewritten only when it is that pipe's own FINAL stage
//     (`cat f | grep -n x` -> rewritten; `grep -n x | wc -l` and
//     `a | grep -n x | b` -> not). "Anything in a pipeline is never
//     rewritten" (an earlier draft of this comment) is false; only a
//     non-final stage is out of reach.
//   - wrapped by `xargs`, `nohup`, or `time` (not `env` or `command`,
//     which are transparent to RTK) - never rewritten, at any position,
//     pipe or not. This rule cannot tell those two groups of launchers
//     apart itself (lib.mjs's `unwrap()` strips all five uniformly, per
//     its own known-limitations note), so it treats every one of them as
//     blocking - correct for three, a same-cost-as-before false deny for
//     the other two, never a false allow.
//   - inside `$(...)`/backtick, at any internal position, pipe or chain
//     alike - never rewritten.
//
// Measured for `tail -c`/`--bytes`: never rewritten, in any position -
// bare, chained, or as either end of a pipe. `rtk read` has no byte-offset
// mode to rewrite it into (only `--tail-lines`, which is why `tail -n` is
// rewritten and unaffected by this rule). So `tail` gets none of `grep`'s
// pipe-final-stage or chain exemptions: once matched, it always denies.
//
// READERS (above) hides both programs from every other rule on purpose
// (`echo git reset --hard` must stay silent), so this family tokenises
// each stage itself and tests the program token only: `echo grep -n`,
// `git grep -n` (closeout step 6) and `rtk grep -n` never match, at any
// position. See .claude/README.md, "Hooks", row 43.

const RTK_READERS = [
  // pipeOnly: true means "rewritable in every shape except a non-final
  // pipe stage or an unsupported wrapper" (grep). false means "never
  // rewritable once matched, full stop" (tail).
  {
    program: 'grep',
    letter: 'n',
    long: '--line-number',
    message: MSG.grepLineNumber,
    pipeOnly: true
  },
  { program: 'tail', letter: 'c', long: '--bytes', message: MSG.tailBytes, pipeOnly: false }
];

// Non-nested `$(...)` and `` `...` `` spans - the same shapes SPLIT_RE's
// `$(` / `)` / backtick delimiters already treat as segment boundaries,
// kept grouped here so their content can be tested regardless of where the
// substitution sits, or how it is internally structured (chained, piped):
// measured, content inside one is never rewritten either way.
const SUBSTITUTION_RE = /\$\(([^()]*)\)|`([^`]*)`/g;

// A genuine data pipe (`|`) is the only thing that groups commands for the
// pipe-final-stage rule above; `&&`, `||` (the logical operator, not a
// pipe), `;`, `&` and a newline are list operators a shell resolves before
// any data moves, and are measured to never block a rewrite on their own.
const LIST_SPLIT_RE = /&&|\|\||;|&|\n/;

function splitListItems(s) {
  return s
    .split(LIST_SPLIT_RE)
    .map((x) => x.trim())
    .filter(Boolean);
}

function splitPipeStages(item) {
  return item
    .split('|')
    .map((x) => x.trim())
    .filter(Boolean);
}

function readerSpec(tokens) {
  for (const spec of RTK_READERS) {
    if (tokens[0] !== spec.program) continue;
    if (flagMatches(tokens, spec.letter) || tokens.some((t) => t.startsWith(spec.long))) {
      return spec;
    }
  }
  return null;
}

// True when RTK is measured to rewrite this shape at all: not wrapped by
// an unsupported launcher, and - for a reader whose exemption is
// pipe-shaped (`grep`) - not sitting in a non-final pipe stage. `tail`
// (`pipeOnly: false`) never reaches the pipe check: once matched, denied.
function isRewritable(spec, { wrapped, inPipe, isFinalStage }) {
  if (wrapped) return false;
  if (!spec.pipeOnly) return false;
  if (inPipe && !isFinalStage) return false;
  return true;
}

function evaluateRtkReaders(sanitized) {
  // Substitutions deny unconditionally: test every segment of the inner
  // content, not only the one that opens it, and ignore pipe position
  // entirely - measured, none of it is ever rewritten.
  SUBSTITUTION_RE.lastIndex = 0;
  let m;
  while ((m = SUBSTITUTION_RE.exec(sanitized))) {
    const inner = m[1] !== undefined ? m[1] : m[2];
    for (const innerSegment of segments(inner)) {
      const tokens = unwrap(tokensOf(innerSegment));
      if (!tokens.length) continue;
      const spec = readerSpec(tokens);
      if (spec) return { id: `rtk-${spec.program}`, message: spec.message };
    }
  }

  // Outside any substitution: split into list items on a genuine list
  // operator, then each item into its own pipe stages, and judge each
  // stage against the measured boundary above.
  const outer = sanitized.replace(SUBSTITUTION_RE, ' ');
  for (const listItem of splitListItems(outer)) {
    const pipeStages = splitPipeStages(listItem);
    for (let i = 0; i < pipeStages.length; i++) {
      const rawTokens = tokensOf(pipeStages[i]);
      if (!rawTokens.length) continue;
      const tokens = unwrap(rawTokens);
      if (!tokens.length) continue;
      const spec = readerSpec(tokens);
      if (!spec) continue;
      const wrapped = dropAssignments(rawTokens)[0] !== tokens[0];
      const inPipe = pipeStages.length > 1;
      const isFinalStage = i === pipeStages.length - 1;
      if (!isRewritable(spec, { wrapped, inPipe, isFinalStage })) {
        return { id: `rtk-${spec.program}`, message: spec.message };
      }
    }
  }
  return null;
}

// ---------- 2f: long-check reminder (allow, not block) ----------

function evaluateLongCheck(segList, sessionId) {
  for (const segment of segList) {
    const info = segmentInfo(segment);
    if (!info) continue;
    const joined = info.tokens.join(' ');
    for (const spec of LONG_CHECKS) {
      const matches = spec.match ? spec.match(joined) : spec.re.test(joined);
      if (matches) {
        if (!once(sessionId, `long-check:${spec.family}`)) return null;
        if (spec.message) return { type: 'speak', message: spec.message(joined, spec.cost) };
        // joined may already carry a leading `rtk ` (RTK rewrote it, or the
        // model typed it directly) - strip before re-adding so the
        // suggestion never doubles up as `rtk rtk npm run check`.
        const suggested = joined.replace(/^rtk\s+/, '');
        return {
          type: 'speak',
          message: `\`${joined}\` takes ${spec.cost} here. Run it as \`rtk ${suggested}\` with the Bash timeout set to 600000 - the default 120000 is shorter than the run, and the tool moves a call that outlives its timeout to the background - and stay in this turn until it finishes: a turn that ends with a check still running loses the result. No pipe and no \`set -o pipefail\` needed: \`rtk\` propagates the child's exit code directly and shows both stdout and stderr, so there is nothing to recover through a pipe. Do not redirect it to a file; the commit gate only trusts output it can see. If the result comes back persisted as too large, grep the file it names rather than running it again.`
        };
      }
    }
  }
  return null;
}

// ---------- entry point ----------

guard(() => {
  const input = readInput();
  const event = input.hook_event_name || 'PreToolUse';
  const tool = input.tool_name;
  if (tool !== 'Bash' && tool !== 'PowerShell') return undefined;
  const rawCommand = normalizeCommand(
    tool,
    input.tool_input && typeof input.tool_input.command === 'string'
      ? input.tool_input.command
      : ''
  );
  if (!rawCommand.trim()) return undefined;
  const cwd = input.cwd;

  const sanitized = sanitize(rawCommand);
  const segList = segments(sanitized);
  const quotedSegs = segments(sanitize(rawCommand, QUOTED));

  const blocked = evaluateBlocklist(segList, cwd);
  if (blocked) return deny(event, blocked.message);

  const orphanTask = evaluateOrphanTask(segList, cwd);
  if (orphanTask) return deny(event, orphanTask.message);

  const pushedMigration = evaluatePushedMigration(segList, cwd);
  if (pushedMigration) return deny(event, pushedMigration.message);

  const blanket = evaluateBlanketStage(segList, cwd);
  if (blanket) return deny(event, blanket.message);

  const attribution = evaluateAttribution(rawCommand, segList);
  if (attribution) return deny(event, attribution.message);

  const hosted = evaluateHostedWrite(segList);
  if (hosted) return deny(event, hosted.message);

  const cloudPush = evaluateCloudPush(segList, cwd);
  if (cloudPush) return deny(event, cloudPush.message);

  // A gitleaks note (not scanned) rides along with whatever speaks later,
  // or speaks alone; any deny below still wins.
  const leaks = evaluateGitleaks(segList, quotedSegs);
  if (leaks && leaks.type === 'deny') return deny(event, leaks.message);
  const note = leaks ? leaks.message : null;
  const say = (message) => speak(event, note ? `${note}\n${message}` : message);

  const gate = evaluateCommitGate(segList, cwd, quotedSegs);
  if (gate) {
    return gate.type === 'deny' ? deny(event, gate.message) : say(gate.message);
  }

  const background = evaluateBackgroundCheck(segList, input.tool_input);
  if (background) return deny(event, background.message);

  const blindCheck = evaluateBlindCheck(sanitized);
  if (blindCheck) return deny(event, blindCheck.message);

  const rtk = evaluateRtkReaders(sanitized);
  if (rtk) return deny(event, rtk.message);

  const longCheck = evaluateLongCheck(segList, input.session_id);
  if (longCheck) return say(longCheck.message);

  return note ? speak(event, note) : undefined;
});
