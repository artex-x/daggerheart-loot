/* One parity run per tree at a time.
 *
 * tests/parity.js wipes test-output/parity/ when it starts, and a vitest
 * coverage pass beside a live parity run throws spurious 5000ms timeouts
 * (measured on issue 47, 2026-09-10). The run itself writes this lock, so
 * the PreToolUse hook in .claude/hooks/bash-guard.mjs can stat one file
 * instead of enumerating processes, and a run started from a human's
 * terminal is seen too.
 *
 * A lock is live only while its pid still answers `kill(pid, 0)` and its
 * heartbeat is younger than LOCK_TTL_MS. A killed run leaves a lock with
 * a dead pid, ignored by construction; a hung run stops heartbeating and
 * is ignored after the TTL. Both sides fail open: a missing or malformed
 * lock is no lock. Shared by parity.js (CommonJS) and bash-guard.mjs (ESM,
 * via import()), so the two agree on what "live" means. */
const fs = require('fs');
const path = require('path');

/* parity.js touches the lock once per state, so a long full run never
   outlives the TTL, while a crashed run's lock stops counting fifteen
   minutes after its last heartbeat - the window in which a reused pid
   could read as alive on Windows. */
const LOCK_TTL_MS = 15 * 60 * 1000;

const lockPath = (root) => path.join(root, 'test-output', 'parity.lock');

function readLock(root) {
  try {
    const parsed = JSON.parse(fs.readFileSync(lockPath(root), 'utf8'));
    if (!parsed || typeof parsed !== 'object') return null;
    if (!Number.isInteger(parsed.pid) || parsed.pid <= 0) return null;
    if (!Number.isFinite(parsed.at)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function pidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return Boolean(e) && e.code === 'EPERM';
  }
}

function isLive(lock, now = Date.now()) {
  if (!lock) return false;
  if (now - lock.at >= LOCK_TTL_MS) return false;
  return pidAlive(lock.pid);
}

function describe(lock) {
  const started = new Date(Number.isFinite(lock.startedAt) ? lock.startedAt : lock.at);
  const filter =
    Array.isArray(lock.argv) && lock.argv.length ? lock.argv.join(' ') : 'all states';
  return `pid ${String(lock.pid)}, started ${started.toISOString()}, ${filter}`;
}

function write(root, lock) {
  fs.mkdirSync(path.dirname(lockPath(root)), { recursive: true });
  fs.writeFileSync(lockPath(root), JSON.stringify(lock));
}

/* Returns { ok: true } after writing our lock, or { ok: false, held } when
   a live one is already there. A dead or stale lock is overwritten. */
function acquire(root, argv, now = Date.now()) {
  const held = readLock(root);
  if (isLive(held, now)) return { ok: false, held };
  write(root, { pid: process.pid, startedAt: now, at: now, argv });
  return { ok: true };
}

function touch(root, now = Date.now()) {
  const lock = readLock(root);
  if (!lock || lock.pid !== process.pid) return;
  write(root, { ...lock, at: now });
}

/* Only our own lock: a run that outlived a TTL and was overwritten must
   not delete its successor's lock on the way out. */
function release(root) {
  try {
    const lock = readLock(root);
    if (lock && lock.pid === process.pid) fs.unlinkSync(lockPath(root));
  } catch {
    /* nothing to release, or already gone */
  }
}

module.exports = { LOCK_TTL_MS, lockPath, readLock, isLive, describe, acquire, touch, release };
