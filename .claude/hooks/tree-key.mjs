// Working-tree fingerprint for the commit gate in bash-guard.mjs, and the
// cache that check-observer.mjs writes after a passing `npm run check`.
// See issues/65/plan.md section 4, hook 2e for the full rationale.

import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { repoRoot, stateDir } from './lib.mjs';

function checkIndexPath() {
  return path.join(stateDir(), '.check-index');
}

function cacheFilePath() {
  return path.join(stateDir(), '.check-cache.json');
}

/**
 * A content-only fingerprint of the working tree: staged, unstaged and
 * untracked changes in, gitignored files out, HEAD excluded. Copies
 * .git/index rather than touching the real one, so this never contends
 * with (or corrupts) the human's own git state. Returns null on any
 * failure - null always means "cannot tell", and callers treat that as
 * allow.
 */
export function treeKey() {
  try {
    const root = repoRoot();
    const gitIndex = path.join(root, '.git', 'index');
    if (!existsSync(gitIndex)) return null;
    const copyPath = checkIndexPath();
    copyFileSync(gitIndex, copyPath);
    const env = { ...process.env, GIT_INDEX_FILE: copyPath };
    const add = spawnSync('git', ['add', '-A'], { cwd: root, env, encoding: 'utf8' });
    if (add.error || add.status !== 0) return null;
    const ls = spawnSync('git', ['ls-files', '-s'], { cwd: root, env, encoding: 'utf8' });
    if (ls.error || ls.status !== 0) return null;
    return createHash('sha256').update(ls.stdout).digest('hex').slice(0, 16);
  } catch {
    return null;
  }
}

/** { key, at, command } of the last observed passing `npm run check`, or
 * null if there is none or the file is unreadable/corrupt. */
export function readCache() {
  try {
    const raw = readFileSync(cacheFilePath(), 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.key === 'string') return parsed;
    return null;
  } catch {
    return null;
  }
}

export function writeCache(key) {
  try {
    const payload = { key, at: Math.floor(Date.now() / 1000), command: 'npm run check' };
    writeFileSync(cacheFilePath(), JSON.stringify(payload));
  } catch {
    // fail open: a lost cache write just means the gate asks again
  }
}
