// Shared helpers for every .claude/hooks/*.mjs script.
//
// Contract every hook script follows (see issues/65/plan.md section 4):
//   1. Parse stdin JSON inside a try; failure yields {}.
//   2. Do all work inside a single try; catch prints nothing and exits 0.
//   3. Exit 0 always. There is no exit-2 path. The decision lives in the
//      emitted JSON, never in the exit code, so a throw fails open.
//
// repoRoot() and stateDir() are overridable by environment variable so the
// selftest can point both at a throwaway git repo instead of this tree.

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function readInput() {
  try {
    const raw = readFileSync(0, 'utf8');
    if (!raw || !raw.trim()) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** Run `fn`, print its JSON result (if any) to stdout, then always exit 0. */
export function guard(fn) {
  try {
    const result = fn();
    if (result) process.stdout.write(JSON.stringify(result));
  } catch {
    // fail open: print nothing, exit 0
  }
  process.exit(0);
}

/** Block a tool call. Only used from PreToolUse hooks. */
export function deny(hookEventName, reason) {
  return {
    hookSpecificOutput: {
      hookEventName,
      permissionDecision: 'deny',
      permissionDecisionReason: reason
    }
  };
}

/** Allow, but say something to both the human (systemMessage) and Claude
 * (additionalContext). Never emits permissionDecision: "allow" - that
 * bypasses the permission prompt, a behaviour change nobody asked for. */
export function speak(hookEventName, text) {
  return {
    systemMessage: text,
    hookSpecificOutput: { hookEventName, additionalContext: text }
  };
}

/** Warn at Stop. Stop has no permission decision, only a message. */
export function warn(text) {
  return { systemMessage: text };
}

export function repoRoot() {
  if (process.env.LOOT_HOOK_ROOT) return process.env.LOOT_HOOK_ROOT;
  const here = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(here), '..', '..');
}

export function stateDir() {
  if (process.env.LOOT_HOOK_STATE_DIR) return process.env.LOOT_HOOK_STATE_DIR;
  return path.join(repoRoot(), '.claude');
}

/** Resolve an absolute (or cwd-relative) path to a repo-relative, forward-
 * slashed form for matching against the deny/allow lists in edit-guard and
 * edit-followup. Returns null when the path is outside the repo - every
 * caller treats null as "allow". */
export function relPath(filePath, cwd) {
  if (!filePath) return null;
  try {
    const root = repoRoot();
    const base = cwd || process.cwd();
    let resolved = path.isAbsolute(filePath)
      ? path.resolve(filePath)
      : path.resolve(base, filePath);
    let rootCmp = root;
    if (process.platform === 'win32') {
      resolved = resolved.toLowerCase();
      rootCmp = rootCmp.toLowerCase();
    }
    const rel = path.relative(rootCmp, resolved);
    if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null;
    return rel.split(path.sep).join('/');
  } catch {
    return null;
  }
}

/** Run git synchronously against repoRoot(). Returns stdout, or null on any
 * failure (missing git, non-zero exit, thrown error). null always means
 * "cannot tell" - callers treat it as allow. */
export function git(args, opts = {}) {
  try {
    const result = spawnSync('git', args, {
      cwd: opts.cwd || repoRoot(),
      encoding: 'utf8',
      env: opts.env ? { ...process.env, ...opts.env } : process.env
    });
    if (result.error || result.status !== 0) return null;
    return result.stdout;
  } catch {
    return null;
  }
}

/** Most recently touched issues/<id>/ directory, by the newest mtime among
 * its own files. "Most recently touched", not "active" - this repo has no
 * feature branches, so mtime is the only signal, and it is a guess. */
export function activeTask() {
  try {
    const root = repoRoot();
    const issuesDir = path.join(root, 'issues');
    if (!existsSync(issuesDir)) return null;
    const dirs = readdirSync(issuesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
    let best = null;
    let bestMtime = -1;
    for (const id of dirs) {
      const dirPath = path.join(issuesDir, id);
      let newest = -1;
      let entries;
      try {
        entries = readdirSync(dirPath, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        const stat = statSync(path.join(dirPath, entry.name));
        if (stat.mtimeMs > newest) newest = stat.mtimeMs;
      }
      if (newest > bestMtime) {
        bestMtime = newest;
        best = id;
      }
    }
    if (!best) return null;
    const dirPath = path.join(issuesDir, best);
    return {
      id: best,
      dir: dirPath,
      hasContext: existsSync(path.join(dirPath, 'context.md')),
      hasPlan: existsSync(path.join(dirPath, 'plan.md')),
      hasHandoff: existsSync(path.join(dirPath, 'handoff.md'))
    };
  } catch {
    return null;
  }
}

// ---------- .hook-state.json: per-session dedupe + write tracking ----------

function statePath() {
  return path.join(stateDir(), '.hook-state.json');
}

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

function loadState() {
  try {
    const raw = readFileSync(statePath(), 'utf8');
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      parsed.sessions &&
      typeof parsed.sessions === 'object'
    ) {
      return parsed;
    }
    return { sessions: {} };
  } catch {
    return { sessions: {} };
  }
}

function saveState(state) {
  try {
    const sessions = state.sessions || {};
    const ids = Object.keys(sessions).sort(
      (a, b) => (sessions[b].at || 0) - (sessions[a].at || 0)
    );
    const pruned = {};
    for (const id of ids.slice(0, 5)) pruned[id] = sessions[id];
    const dir = stateDir();
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(statePath(), JSON.stringify({ sessions: pruned }));
  } catch {
    // fail open: a lost write costs one duplicate reminder, never more
  }
}

function sessionEntry(state, sessionId) {
  if (!state.sessions[sessionId]) {
    state.sessions[sessionId] = { at: nowSeconds(), seen: [], wrote: {} };
  }
  if (!Array.isArray(state.sessions[sessionId].seen)) state.sessions[sessionId].seen = [];
  if (!state.sessions[sessionId].wrote || typeof state.sessions[sessionId].wrote !== 'object') {
    state.sessions[sessionId].wrote = {};
  }
  return state.sessions[sessionId];
}

/** True the first time `key` is seen for this session; false every time
 * after. Used to keep a reminder from firing more than once per session. */
export function once(sessionId, key) {
  if (!sessionId) return true; // no session to dedupe against - never suppress
  const state = loadState();
  const entry = sessionEntry(state, sessionId);
  entry.at = nowSeconds();
  if (entry.seen.includes(key)) {
    saveState(state);
    return false;
  }
  entry.seen.push(key);
  saveState(state);
  return true;
}

/** Record that this session wrote `relativePath` (already repo-relative). */
export function recordWrite(sessionId, relativePath) {
  if (!sessionId || !relativePath) return;
  const state = loadState();
  const entry = sessionEntry(state, sessionId);
  entry.at = nowSeconds();
  entry.wrote[relativePath] = entry.at;
  saveState(state);
}

/** The set of repo-relative paths this session has written, as returned by
 * recordWrite. Empty object if the session has written nothing (yet). */
export function getWrote(sessionId) {
  if (!sessionId) return {};
  const state = loadState();
  return (state.sessions[sessionId] && state.sessions[sessionId].wrote) || {};
}
