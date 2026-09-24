// Working-tree fingerprint for the commit gates in bash-guard.mjs, and the
// caches that check-observer.mjs writes after a passing `npm run check`
// (`.check-cache.json`) or `npm run check:db` (`.check-db-cache.json`).
// See .claude/README.md, "Hooks", for the commit gate's rationale.

import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { repoRoot, stateDir, isExempt } from './lib.mjs';

function checkIndexPath() {
  return path.join(stateDir(), '.check-index');
}

function cacheFilePath(name) {
  return path.join(stateDir(), name);
}

/** The real index file of the tree at `root`. In a linked worktree `.git` is
 * a file that points into the main repository, so `<root>/.git/index` does
 * not exist there and the gate used to fail open; git itself knows where the
 * index lives. Returns null when git cannot say. */
function indexPath(root) {
  const r = spawnSync('git', ['rev-parse', '--git-path', 'index'], {
    cwd: root,
    encoding: 'utf8'
  });
  if (r.error || r.status !== 0) return null;
  const answer = r.stdout.trim();
  if (!answer) return null;
  return path.resolve(root, answer);
}

/**
 * A content-only fingerprint of the working tree: staged, unstaged and
 * untracked changes in, gitignored files out, HEAD excluded. Copies the
 * index rather than touching the real one, so this never contends with (or
 * corrupts) the human's own git state. Returns null on any failure - null
 * always means "cannot tell", and callers treat that as allow.
 */
export function treeKey() {
  try {
    const root = repoRoot();
    const gitIndex = indexPath(root);
    if (!gitIndex || !existsSync(gitIndex)) return null;
    const copyPath = checkIndexPath();
    copyFileSync(gitIndex, copyPath);
    const env = { ...process.env, GIT_INDEX_FILE: copyPath };
    const add = spawnSync('git', ['add', '-A'], { cwd: root, env, encoding: 'utf8' });
    if (add.error || add.status !== 0) return null;
    const ls = spawnSync('git', ['ls-files', '-s'], { cwd: root, env, encoding: 'utf8' });
    if (ls.error || ls.status !== 0) return null;
    // Drop every isExempt() row before hashing: the commit gate in
    // bash-guard.mjs only requires a passing check for covered paths, so a
    // row this fingerprint would otherwise move on (a handoff edit, a plan
    // edit) must not change the key - see isExempt()'s comment in lib.mjs.
    const lines = ls.stdout.split('\n').filter(Boolean);
    const covered = lines.filter((line) => {
      const tab = line.indexOf('\t');
      const p = tab === -1 ? line : line.slice(tab + 1);
      return !isExempt(p);
    });
    return createHash('sha256').update(covered.join('\n')).digest('hex').slice(0, 16);
  } catch {
    return null;
  }
}

/** { key, at, command } of the last observed passing run recorded in the
 * named cache file, or null if there is none or the file is unreadable or
 * corrupt. */
export function readCache(name = '.check-cache.json') {
  try {
    const raw = readFileSync(cacheFilePath(name), 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.key === 'string') return parsed;
    return null;
  } catch {
    return null;
  }
}

export function writeCache(key, name = '.check-cache.json', command = 'npm run check') {
  try {
    const payload = { key, at: Math.floor(Date.now() / 1000), command };
    writeFileSync(cacheFilePath(name), JSON.stringify(payload));
  } catch {
    // fail open: a lost cache write just means the gate asks again
  }
}
