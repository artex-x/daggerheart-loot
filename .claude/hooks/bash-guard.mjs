// PreToolUse(Bash): five rule families evaluated in order, first deny wins.
// See issues/65/plan.md section 4, hook 2, for the full specification -
// this file follows it literally, including the sanitiser/segmenter and
// the exact trap table. Never blocks anything not listed there.

import { spawnSync } from 'node:child_process';
import {
  readInput,
  guard,
  deny,
  speak,
  once,
  repoRoot,
  relPath,
  sanitize,
  segments,
  tokensOf,
  unwrap
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
  gitPush:
    "Blocked: pushing is the repository owner's job (CLAUDE.md). Commit locally and say in your summary that a push is pending.",
  gitDiscard:
    'Blocked: this overwrites working-tree changes, and this tree carries in-flight work from other tasks. If you only meant to unstage, use `git restore --staged <path>`. Otherwise name the exact file and confirm with the human.',
  gitStashDestroy:
    'Blocked: this throws away a stash permanently. Inspect it first with `git stash list` and `git stash show -p`.',
  rmRfRepo:
    'Blocked: `rm -rf` inside the repository. Delete named files, or run `git clean -n` to see what is actually untracked. dist, coverage, test-output and node_modules are exempt from this rule.',
  commitAttribution:
    'Blocked: this commit message carries AI attribution. This repository\'s commit messages never carry it - no Co-Authored-By trailer, no "Generated with" line. Rewrite the message without it.',
  gateBypassed:
    'Commit gate bypassed with SKIP_CHECK_GATE=1 - npm run check has not passed for this tree.'
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

function rmHasRecursiveForce(tokens) {
  let hasR = false;
  let hasF = false;
  for (const t of tokens.slice(1)) {
    if (t === '--recursive') hasR = true;
    else if (t === '--force') hasF = true;
    else if (/^-[a-zA-Z]+$/.test(t)) {
      if (/[rR]/.test(t)) hasR = true;
      if (t.includes('f')) hasF = true;
    }
  }
  return hasR && hasF;
}

function rmTargetInsideRepo(tokens, cwd) {
  const exempt = /^(dist|coverage|test-output|node_modules)(\/|$)/;
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
        if (!tokens.includes('--dry-run')) return { id: 'git-push', message: MSG.gitPush };
      }
      if (subcommand === 'checkout') {
        if (tokens.includes('--') || tokens.includes('.')) {
          return { id: 'git-discard', message: MSG.gitDiscard };
        }
      }
      if (subcommand === 'restore') {
        if (!tokens.includes('--staged')) return { id: 'git-discard', message: MSG.gitDiscard };
      }
      if (subcommand === 'stash') {
        if (rest[0] === 'drop' || rest[0] === 'clear') {
          return { id: 'git-stash-destroy', message: MSG.gitStashDestroy };
        }
      }
    }

    if (program === 'rm') {
      if (rmHasRecursiveForce(tokens) && rmTargetInsideRepo(tokens, cwd)) {
        return { id: 'rm-rf-repo', message: MSG.rmRfRepo };
      }
    }
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

function isExempt(p) {
  if (p.startsWith('issues/')) return true;
  if (p.endsWith('.md') && p !== 'README.md' && p !== 'README.ru.md') return true;
  return false;
}

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

// ---------- 2f: long-check reminder (allow, not block) ----------

const LONG_CHECKS = [
  { re: /^npm run check:built\b/, family: 'check:built', cost: 'a few minutes' },
  { re: /^npm run check\b/, family: 'check', cost: 'a few minutes' },
  {
    re: /^node tests\/parity\.js\b/,
    family: 'parity',
    cost: 'about nine minutes for one filter'
  },
  { re: /^node tests\/run-all\.js\b/, family: 'run-all', cost: 'about fifteen minutes' }
];

function evaluateLongCheck(segList, sessionId) {
  for (const segment of segList) {
    const info = segmentInfo(segment);
    if (!info) continue;
    const joined = info.tokens.join(' ');
    for (const spec of LONG_CHECKS) {
      if (spec.re.test(joined)) {
        if (!once(sessionId, `long-check:${spec.family}`)) return null;
        return {
          type: 'speak',
          message: `\`${joined}\` takes ${spec.cost} here. Pipe it to \`tail -n 120\` and stay in this turn until it finishes - a turn that ends with a check still running loses the result, and from outside a stopped turn is indistinguishable from a dead agent. Do not redirect it to a file: the commit gate only trusts output it can see.`
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

  const blanket = evaluateBlanketStage(segList, cwd);
  if (blanket) return deny(event, blanket.message);

  const attribution = evaluateAttribution(rawCommand, segList);
  if (attribution) return deny(event, attribution.message);

  const gate = evaluateCommitGate(segList, cwd);
  if (gate) {
    return gate.type === 'deny' ? deny(event, gate.message) : speak(event, gate.message);
  }

  const longCheck = evaluateLongCheck(segList, input.session_id);
  if (longCheck) return speak(event, longCheck.message);

  return undefined;
});
