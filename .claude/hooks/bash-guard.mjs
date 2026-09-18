// PreToolUse(Bash): eight rule families evaluated in order, first deny wins.
// See .claude/README.md, "Hooks", for what each family blocks and for the
// sanitiser's known limits. Never blocks anything not listed there.
// segmentInfo already skips READERS and unwraps env/command/nohup/time/xargs,
// so `echo npm run check` never matches and `nohup npm run check` does.

import { spawnSync } from 'node:child_process';
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
    'Blocked: a bare `git push --force` overwrites whatever the remote has, including commits this tree never saw. Push normally, or use `git push --force-with-lease`, which refuses when the remote ref moved under you.',
  gitDiscard:
    'Blocked: this overwrites working-tree changes, and this tree carries in-flight work from other tasks. If you only meant to unstage, use `git restore --staged <path>`. Otherwise name the exact file and confirm with the human.',
  gitStashDestroy:
    'Blocked: this throws away a stash permanently. Inspect it first with `git stash list` and `git stash show -p`.',
  rmRfRepo:
    'Blocked: `rm -r` inside the repository, with or without `-f`. Delete named files, or run `git clean -n` to see what is actually untracked. dist, coverage, test-output, node_modules and i (build output, not source) are exempt from this rule.',
  commitAttribution:
    'Blocked: this commit message carries AI attribution. This repository\'s commit messages never carry it - no Co-Authored-By trailer, no "Generated with" line. Rewrite the message without it.',
  gateBypassed:
    'Commit gate bypassed with SKIP_CHECK_GATE=1 - npm run check has not passed for this tree.',
  backgroundCheck:
    "Blocked: a backgrounded `npm run check` can never satisfy the commit gate - there is no stdout to attribute, and a turn that ends with it running loses the result. Run it in the foreground in this turn, Bash timeout 600000: `rtk npm run check` (no pipe, no `set -o pipefail` - with nothing piping the output away, the exit code the tool reports is already the check's).",
  blindCheckPipe:
    "Blocked: piping the check hands the Bash tool the *last* stage's exit status, not the check's, so a failed run comes back indistinguishable from a passing one and you spend a second run learning what you already ran. Drop the pipe: `rtk npm run check`, Bash timeout 600000. `rtk` propagates the child's exit code directly and prints both stdout and stderr (measured: 21,382 characters, under the tool's output cap), and check-observer.mjs reports PASS or FAIL in one line of its own - there is nothing left to recover through a pipe.",
  blindCheckRedirect:
    'Blocked: redirecting the check to a file hides its stdout from check-observer.mjs, so the commit gate never arms and the next `git commit` is refused - and reading the file back costs a second call. Run it plainly: `rtk npm run check`, Bash timeout 600000. If a run ever does come back persisted as too large, grep the file the tool names rather than redirecting the run yourself.',
  orphanPlan: (target, hits) => {
    const shown = hits.slice(0, 4).join(', ');
    const more = hits.length > 4 ? ', ...' : '';
    return `Blocked: ${target} is still cited by ${hits.length} tracked line(s): ${shown}${more}. Retiring a plan.md leaves those pointing at nothing. Closeout step 6: move the durable content to its permanent home (.claude/README.md for tooling rationale, docs/specs/ for behaviour), update every citation, and remove the file in that same commit. The way out for a citation that only needs the file's content as of a past commit, not the file itself: rewrite it as \`git show <sha>:${target}\` - that form resolves through history and does not count as a live citation here.`;
  },
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
  // i is exempt too: the 1091 share stubs are build output regenerated by
  // `npm run data` (tools/build.js), never hand-edited - the same standing
  // as dist and coverage.
  const exempt = /^(dist|coverage|test-output|node_modules|i)(\/|$)/;
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
        // Pushing itself is allowed. Only the force that ignores the remote's
        // state is not: --force-with-lease still refuses to clobber a ref that
        // moved, so it is a normal push here.
        const hasForce = tokens.includes('--force') || flagMatches(tokens, 'f');
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

// ---------- 2i: deny removing a still-cited issues/<id>/plan.md ----------
//
// bash-guard.mjs is the only site with both the input (the rm/git-rm
// target, before the file is gone) and the timing (before the retirement
// commit). edit-guard.mjs never sees a deletion; session-stop.mjs would
// fire on history rather than on the action, after the content is only
// recoverable from git history; selftest.mjs cannot be the rule, since it
// runs inside npm run check and a .md-only retirement commit is gate-exempt.
// See .claude/README.md, "Hooks", row 40, for the rejected sites and the
// fallback (a speak instead of a deny) if this proves too blunt in use.

const PLAN_MD_RE = /^issues\/[^/]+\/plan\.md$/;

function orphanPlanTargets(segList, cwd) {
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
      const rel = relPath(token, cwd);
      if (!rel) continue;
      const key = pathKey(rel);
      if (PLAN_MD_RE.test(key)) targets.add(key);
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

/** Tracked lines citing `target` (a repo-relative, folded path), as
 * "file:line" strings. `git()` returns null on a non-zero exit, which
 * covers both "no matches" and "git unavailable" - both mean no deny, and
 * this function must not try to tell them apart. Drops any hit inside the
 * target file itself, and any hit whose citation is `git show <sha>:` (or
 * `HEAD:`) qualified - see SHA_CITE_RE. */
function citingLines(target) {
  const out = git(['grep', '-n', '--fixed-strings', '--', target]);
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
    if (pathKey(file) === target) continue;
    const content = second === -1 ? '' : rest.slice(second + 1);
    const idx = content.indexOf(target);
    if (idx !== -1 && SHA_CITE_RE.test(content.slice(0, idx))) continue;
    hits.push(`${file}:${line}`);
  }
  return hits;
}

function evaluateOrphanPlan(segList, cwd) {
  for (const target of orphanPlanTargets(segList, cwd)) {
    const hits = citingLines(target);
    if (hits.length) return { id: 'orphan-plan', message: MSG.orphanPlan(target, hits) };
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

function commitInfo(segList) {
  for (const segment of segList) {
    const info = segmentInfo(segment);
    if (!info || info.program !== 'git') continue;
    const { subcommand, rest } = gitSubcommand(info.tokens);
    if (subcommand === 'commit') {
      return {
        isCommit: true,
        // Cluster-aware: `git commit -am` stages every modified tracked file
        // exactly as `-a` does, so the gate has to union the unstaged diff
        // for it too or an empty index reads as "nothing to check".
        hasAllFlag: flagMatches(rest, 'a') || rest.includes('--all'),
        hasDryRun: rest.includes('--dry-run')
      };
    }
  }
  return { isCommit: false };
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

function evaluateCommitGate(segList, cwd) {
  const info = commitInfo(segList);
  if (!info.isCommit || info.hasDryRun) return null;

  const cwdOpt = cwd || repoRoot();
  const cached = spawnSync('git', ['diff', '--cached', '--name-only'], {
    cwd: cwdOpt,
    encoding: 'utf8'
  });
  if (cached.error || cached.status !== 0) return null; // fail open
  let paths = cached.stdout.split('\n').filter(Boolean);
  if (info.hasAllFlag) {
    const unstaged = spawnSync('git', ['diff', '--name-only'], {
      cwd: cwdOpt,
      encoding: 'utf8'
    });
    if (!unstaged.error && unstaged.status === 0) {
      paths = paths.concat(unstaged.stdout.split('\n').filter(Boolean));
    }
  }
  const covered = paths.filter((p) => !isExempt(p));
  if (covered.length === 0) return null; // nothing npm run check reads

  const key = treeKey();
  if (key === null) return null; // fail open: cannot fingerprint the tree

  const cache = readCache();
  if (cache && cache.key === key) return null; // already passing

  if (hasGateBypass(segList)) {
    return { type: 'speak', message: MSG.gateBypassed };
  }

  return {
    type: 'deny',
    id: 'commit-gate',
    message: `Blocked: \`npm run check\` has not passed for this working tree (${covered.length} checked files in this commit). Run \`npm run check\`, then commit again - a passing result is remembered until the tree changes.\nIf the check genuinely cannot run, say why in your summary and repeat the command with SKIP_CHECK_GATE=1 in front of it.`
  };
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
  { re: /^(?:rtk\s+)?npm run check\b/, family: 'check', cost: '~165s on an idle host' },
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
// and a worker whose turn ends with it running loses the result. Three
// workers on issue 47 did exactly this with the dispatch warning against
// it. Blocking it forbids nothing that works. Only the gate-feeding check:
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
// "<command>"` (a reproducible probe - see issues/rtk-coverage/context.md
// for the full table), not inferred from RTK's own source or docs, because
// the first version of this rule (adopted at `config-audit` B3, then
// narrowed once already at `rtk-coverage` B1) got it wrong twice: RTK
// rewrites `grep -n` far more often than "leading and unchained" suggests,
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
  if (input.tool_name !== 'Bash') return undefined;
  const rawCommand =
    input.tool_input && typeof input.tool_input.command === 'string'
      ? input.tool_input.command
      : '';
  if (!rawCommand.trim()) return undefined;
  const cwd = input.cwd;

  const sanitized = sanitize(rawCommand);
  const segList = segments(sanitized);

  const blocked = evaluateBlocklist(segList, cwd);
  if (blocked) return deny(event, blocked.message);

  const orphanPlan = evaluateOrphanPlan(segList, cwd);
  if (orphanPlan) return deny(event, orphanPlan.message);

  const blanket = evaluateBlanketStage(segList, cwd);
  if (blanket) return deny(event, blanket.message);

  const attribution = evaluateAttribution(rawCommand, segList);
  if (attribution) return deny(event, attribution.message);

  const gate = evaluateCommitGate(segList, cwd);
  if (gate) {
    return gate.type === 'deny' ? deny(event, gate.message) : speak(event, gate.message);
  }

  const background = evaluateBackgroundCheck(segList, input.tool_input);
  if (background) return deny(event, background.message);

  const blindCheck = evaluateBlindCheck(sanitized);
  if (blindCheck) return deny(event, blindCheck.message);

  const rtk = evaluateRtkReaders(sanitized);
  if (rtk) return deny(event, rtk.message);

  const longCheck = evaluateLongCheck(segList, input.session_id);
  if (longCheck) return speak(event, longCheck.message);

  return undefined;
});
