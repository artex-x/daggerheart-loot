// The local stack lock: one run at a time resets the shared local Supabase
// stack on this host. tests/db/run.mjs and tools/supabase/restore-drill.mjs
// take it and release it; bash-guard.mjs rule 2u refuses a manual stack
// command while another checkout holds it. A module, not a registered hook.
// docs/decisions/2026-09-27-the-supabase-scripts-take-the-local-stack-lock.md
// is the decision; .claude/README.md, "Supabase configuration", the procedure.

import { randomBytes } from 'node:crypto';
import { readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { activeTask, git, pathKey, repoRoot } from './lib.mjs';

export const STACK_LOCK_TTL_MS = 45 * 60 * 1000;

/** Returns the lock file path: DHLOOT_STACK_LOCK when set (the selftest),
 * else `dhloot-local-stack.lock` in the OS temporary directory, which the
 * Bash and the PowerShell tool resolve to the same folder on this host. */
export function stackLockPath() {
  if (process.env.DHLOOT_STACK_LOCK) return process.env.DHLOOT_STACK_LOCK;
  return path.join(os.tmpdir(), 'dhloot-local-stack.lock');
}

// `process.kill(pid, 0)` throws EPERM for a live process it cannot open;
// only ESRCH means the process is gone (.claude/README.md, "Hooks").
function pidIsDead(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return false;
  } catch (err) {
    return !!err && err.code === 'ESRCH';
  }
}

/** Returns null when there is no lock file, else `{ holder, ageMs, stale }`.
 * `holder` is the parsed JSON body, or `{ raw }` (the first line, 120
 * characters at most) for a hand-written lock. The age comes from the
 * body's `at`, else from the file's mtime. */
export function readStackLock(now = Date.now()) {
  let text;
  let mtimeMs;
  try {
    text = readFileSync(stackLockPath(), 'utf8');
    mtimeMs = statSync(stackLockPath()).mtimeMs;
  } catch {
    return null;
  }
  let holder = null;
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) holder = parsed;
  } catch {
    // a hand-written lock
  }
  if (!holder) holder = { raw: (text.split(/\r?\n/)[0] || '').trim().slice(0, 120) };
  const at = typeof holder.at === 'string' ? Date.parse(holder.at) : NaN;
  const ageMs = Number.isFinite(at) ? now - at : now - mtimeMs;
  const stale =
    ageMs >= STACK_LOCK_TTL_MS || (holder.host === os.hostname() && pidIsDead(holder.pid));
  return { holder, ageMs, stale };
}

/** Returns the holder as `<task> (<branch>, <root>), <command>, since <at>`,
 * or the raw line of a hand-written lock. */
export function holderText(lock) {
  const h = (lock && lock.holder) || {};
  if (typeof h.raw === 'string')
    return h.raw ? `"${h.raw}"` : `an unnamed lock (${stackLockPath()})`;
  const task = h.task || 'an unnamed task';
  return `${task} (${h.branch || '?'}, ${h.root || '?'}), ${h.command || '?'}, since ${h.at || '?'}`;
}

function currentBranch() {
  const out = git(['rev-parse', '--abbrev-ref', 'HEAD']);
  return out === null ? null : out.trim() || null;
}

/** Takes the lock for `command`. Returns `{ ok: true, nonce }`, or
 * `{ ok: false, lock }` while a fresh lock holds it. A stale lock is removed
 * and the take is tried once more. A lock file that cannot be written for
 * another reason fails open: `{ ok: true, nonce: null }`. */
export function takeStackLock({ command = null } = {}) {
  const nonce = randomBytes(8).toString('hex');
  let task = process.env.DHLOOT_TASK || null;
  if (!task) {
    const active = activeTask();
    task = active ? active.id : null;
  }
  const body = {
    task,
    branch: currentBranch(),
    root: repoRoot(),
    pid: process.pid,
    host: os.hostname(),
    command,
    at: new Date().toISOString(),
    nonce
  };
  let lock = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      writeFileSync(stackLockPath(), `${JSON.stringify(body)}\n`, { flag: 'wx' });
      return { ok: true, nonce };
    } catch (err) {
      if (!err || err.code !== 'EEXIST') return { ok: true, nonce: null };
    }
    lock = readStackLock();
    if (lock && !lock.stale) return { ok: false, lock };
    if (lock) {
      try {
        unlinkSync(stackLockPath());
      } catch {
        // another run removed it first; the next write decides
      }
    }
  }
  return { ok: false, lock: readStackLock() || lock || { holder: { raw: '' }, ageMs: 0 } };
}

/** Removes the lock only when its body carries `nonce`; never throws. */
export function releaseStackLock(nonce) {
  if (!nonce) return;
  try {
    const body = JSON.parse(readFileSync(stackLockPath(), 'utf8'));
    if (body && body.nonce === nonce) unlinkSync(stackLockPath());
  } catch {
    // no lock, a foreign lock or an unreadable one: leave it
  }
}

/** Returns the fresh lock that another checkout holds, else null. A
 * hand-written lock is always foreign; a lock whose `root` is `root`
 * (case folded; the session's checkout) is this checkout's own. */
export function foreignStackLock(now = Date.now(), root = repoRoot()) {
  try {
    const lock = readStackLock(now);
    if (!lock || lock.stale) return null;
    const holderRoot = lock.holder.root;
    if (
      typeof lock.holder.raw !== 'string' &&
      typeof holderRoot === 'string' &&
      pathKey(path.resolve(holderRoot)) === pathKey(path.resolve(root))
    ) {
      return null;
    }
    return lock;
  } catch {
    return null;
  }
}
