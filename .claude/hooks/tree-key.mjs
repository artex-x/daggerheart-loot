// Working-tree fingerprint for the commit gates in bash-guard.mjs, and the
// caches that check-observer.mjs and gate-credit.mjs write after a passing
// `npm run check` (`.check-cache.json`) or `npm run check:db`
// (`.check-db-cache.json`).
// See .claude/README.md, "Hooks", for the commit gate's rationale.

import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { checkoutRoot, stateDir, isExempt } from './lib.mjs';

/** One index copy per process: two processes that share one copy can read
 * each other's half-written index (see indexRows). */
function checkIndexPath(cwd) {
  return path.join(stateDir(cwd), `.check-index-${process.pid}`);
}

function cacheFilePath(name, cwd) {
  return path.join(stateDir(cwd), name);
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
 * Returns the `git ls-files -s` lines of the working tree of the checkout
 * that holds `cwd` (the main checkout without one), after `git add -A` on a
 * copy of the index at `copyPath`: staged, unstaged and untracked changes
 * in, gitignored files out. The real index is never touched. Returns null
 * on any failure. `copyPath` must be one path per process: a second
 * process that copies over it between `git add -A` and `git ls-files -s`
 * makes this return the raw index. tools/check/run.mjs passes
 * `index-<pid>` beside its store and deletes it after the call.
 */
export function indexRows(cwd, copyPath) {
  try {
    const root = checkoutRoot(cwd);
    const gitIndex = indexPath(root);
    if (!gitIndex || !existsSync(gitIndex)) return null;
    copyFileSync(gitIndex, copyPath);
    const env = { ...process.env, GIT_INDEX_FILE: copyPath };
    const add = spawnSync('git', ['add', '-A'], { cwd: root, env, encoding: 'utf8' });
    if (add.error || add.status !== 0) return null;
    const ls = spawnSync('git', ['ls-files', '-s'], {
      cwd: root,
      env,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024
    });
    if (ls.error || ls.status !== 0) return null;
    return ls.stdout.split('\n').filter(Boolean);
  } catch {
    return null;
  }
}

/**
 * A content-only fingerprint of the working tree of the checkout that holds
 * `cwd` (the main checkout without one): staged, unstaged and
 * untracked changes in, gitignored files out, HEAD excluded. Copies the
 * index rather than touching the real one, so this never contends with (or
 * corrupts) the human's own git state. Returns null on any failure - null
 * always means "cannot tell", and callers treat that as allow.
 */
export function treeKey(cwd) {
  const copy = checkIndexPath(cwd);
  try {
    const lines = indexRows(cwd, copy);
    if (lines === null) return null;
    // Drop every isExempt() row before hashing: the commit gate in
    // bash-guard.mjs only requires a passing check for covered paths, so a
    // row this fingerprint would otherwise move on (a handoff edit, a plan
    // edit) must not change the key - see isExempt()'s comment in lib.mjs.
    const covered = lines.filter((line) => {
      const tab = line.indexOf('\t');
      const p = tab === -1 ? line : line.slice(tab + 1);
      return !isExempt(p);
    });
    return createHash('sha256').update(covered.join('\n')).digest('hex').slice(0, 16);
  } catch {
    return null;
  } finally {
    try {
      rmSync(copy, { force: true });
    } catch {
      // a copy left behind is gitignored (`.check-index-*`)
    }
  }
}

/** { key, at, command, by } of the last passing run recorded in the named
 * cache file, or null if there is none or the file is unreadable or
 * corrupt. `by` is `observer` (check-observer.mjs saw the output), `exit`
 * (gate-credit.mjs, after the check's own exit 0) or `halves`
 * (gate-credit.mjs, when `check:1` and `check:2` passed on one tree key). */
export function readCache(name = '.check-cache.json', cwd) {
  try {
    const raw = readFileSync(cacheFilePath(name, cwd), 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.key === 'string') return parsed;
    return null;
  } catch {
    return null;
  }
}

export function writeCache(
  key,
  name = '.check-cache.json',
  command = 'npm run check',
  by = 'observer',
  cwd
) {
  try {
    const payload = { key, at: Math.floor(Date.now() / 1000), command, by };
    writeFileSync(cacheFilePath(name, cwd), JSON.stringify(payload));
  } catch {
    // fail open: a lost cache write just means the gate asks again
  }
}
