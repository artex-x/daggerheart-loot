// Shared helpers for every .claude/hooks/*.mjs script.
//
// Contract every hook script follows (see .claude/README.md, "Hooks"):
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
  renameSync,
  statSync,
  unlinkSync,
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
 * caller treats null as "allow" - and '.' for the repository root itself,
 * which is very much inside it: `rm -rf .` is the most destructive form of
 * the command bash-guard's rm rule exists to stop, and an empty string read
 * as "outside" let it straight through. */
export function relPath(filePath, cwd) {
  if (!filePath) return null;
  // A drive-letter path (a PowerShell command, normalised) names another
  // file system everywhere but win32, never a path inside this repository.
  if (process.platform !== 'win32' && /^[A-Za-z]:[\\/]/.test(filePath)) return null;
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
    if (rel === '') return '.';
    if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null;
    return rel.split(path.sep).join('/');
  } catch {
    return null;
  }
}

/** Comparison key for a repo-relative path. Always folds case, on every
 * platform: this exists for matching, not identity, and a rule site
 * comparing a repo-relative path against a hand-written literal (rmTargetInsideRepo's
 * exempt list, edit-guard's and edit-followup's deny/reminder tables) has to
 * agree with itself regardless of OS, or the literal only ever matches on
 * whichever platform happens to share its casing. relPath() itself keeps
 * real casing on POSIX (the return value is also used for display in
 * messages), so callers that recorded a path via relPath() and later match
 * it against another relPath() result, or against a literal, must fold both
 * sides with this function rather than compare `===` directly - see
 * session-stop.mjs, edit-guard.mjs, edit-followup.mjs. */
export function pathKey(p) {
  return String(p).toLowerCase();
}

/** True for a repo-relative path `npm run check` does not read: everything
 * under `issues/` and every `.md` file except the two READMEs. Shared by
 * bash-guard.mjs's commit gate (which paths in *this* commit need a passing
 * check) and tree-key.mjs's fingerprint (which paths the fingerprint hashes
 * at all) - they have to agree, or a write to an exempt path (a handoff, a
 * plan) changes the fingerprint without changing what the gate requires,
 * disarming a check that already passed. The trap this does not close:
 * tests/contracts.js reads docs/specs/CONTRACTS.md and ROUTES.md (exempt as
 * *.md) at runtime, but tests/contracts.js is not part of `npm run check`
 * itself (it runs via `node tests/run-all.js contracts`) - so editing a spec
 * alone never reruns the test that depends on its content, and neither this
 * gate nor `npm run check` would catch the two drifting silently. */
export function isExempt(p) {
  if (p.startsWith('issues/')) return true;
  if (p.endsWith('.md') && p !== 'README.md' && p !== 'README.ru.md') return true;
  return false;
}

// ---------- shell sanitiser + segmenter ----------
//
// Shared by bash-guard.mjs (which rule family sees which segment) and
// check-observer.mjs (is the FIRST segment really the check invocation).
// This is a guard against habit and haste, not against an adversary - the
// known gaps are listed in .claude/README.md.

/** Drop heredoc *bodies* only. Truncating at the first `<<` also hid every
 * command after the terminator, so `cat <<EOF ... EOF; git reset --hard`
 * was invisible to every rule. */
function stripHeredocs(s) {
  const marker = /<<-?[ \t]*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1/;
  let out = s;
  for (let i = 0; i < 8; i++) {
    const m = marker.exec(out);
    if (!m) break;
    const head = out.slice(0, m.index);
    const afterMarker = out.slice(m.index + m[0].length);
    const nl = afterMarker.indexOf('\n');
    if (nl === -1) {
      // No body at all: keep the rest of the line, drop the marker.
      out = `${head} ${afterMarker}`;
      continue;
    }
    const restOfLine = afterMarker.slice(0, nl);
    const body = afterMarker.slice(nl);
    const terminator = new RegExp(`\\n[ \\t]*${m[2]}[ \\t]*(?:\\n|$)`);
    const end = terminator.exec(body);
    const tail = end ? body.slice(end.index + end[0].length) : '';
    out = `${head} ${restOfLine}\n${tail}`;
  }
  return out;
}

// A quoted span is normally erased, because its contents are data. The one
// exception is a span that is a single shell-inert word: `git reset "--hard"`
// is the same command as `git reset --hard`, and erasing the flag was a
// bypass. Anything with a space or a shell metacharacter in it stays erased,
// so unquoting can never invent a new segment.
const INERT_WORD = /^[-A-Za-z0-9._/=:]+$/;

function keepIfInert(inner, placeholder) {
  return INERT_WORD.test(inner) ? ` ${inner} ` : ` ${placeholder} `;
}

/** Returns the command with quoted data erased. With `placeholder`, an
 * erased span leaves that word instead of nothing, so a caller that counts
 * positional arguments (the pathspec of `git commit -m "a b" x`) still sees
 * the span as the flag's value. */
export function sanitize(raw, placeholder = '') {
  let s = stripHeredocs(String(raw));
  s = s.replace(/\\./g, ' '); // backslash-escaped chars
  s = s.replace(/'([^']*)'/g, (_m, inner) => keepIfInert(inner, placeholder));
  s = s.replace(/"([^"]*)"/g, (_m, inner) => keepIfInert(inner, placeholder));
  s = s.replace(/[^\S\n]+/g, ' ').trim();
  return s;
}

const SPLIT_RE = /&&|\|\||;|\||&|\n|\$\(|\)|`/;

export function segments(sanitized) {
  return sanitized
    .split(SPLIT_RE)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function tokensOf(segment) {
  return segment.split(/\s+/).filter(Boolean);
}

/** `npm run check` and nothing else: `check:built` never runs the suite
 * and `check:fast` skips half of it, so neither may satisfy the gate, and
 * neither is the backgrounded run bash-guard blocks. The optional leading
 * `rtk ` is tolerated because RTK's own PreToolUse hook rewrites a bare
 * `npm run check` into `rtk npm run check` before any of these hooks ever
 * see it (verified live: a probe on `check-observer.mjs` logged `cat
 * package.json` as `rtk read package.json`) - without this, the gate could
 * only ever arm on the piped form RTK cannot rewrite, `set -o pipefail;
 * npm run check 2>&1 | tail -n 120`, which is exactly what was observed
 * happening in every recorded check invocation. Accepting the prefix
 * cannot weaken the gate: `rtk npm ...` propagates the child's exit code
 * directly (verified: a script exiting 3 came back `exit=3`) and shows
 * both stdout and stderr, so the non-zero test below still refuses to
 * arm on a real failure. */
export const CHECK_INVOCATION_RE = /^(?:rtk\s+)?npm\s+run\s+(?:-s\s+)?check(?![:\w-])/;

/** `npm run check:db` and nothing else, the database suite that arms the
 * second commit gate (supabase/ and tests/db/). Same prefix rules as
 * CHECK_INVOCATION_RE. */
export const CHECK_DB_INVOCATION_RE = /^(?:rtk\s+)?npm\s+run\s+(?:-s\s+)?check:db(?![:\w-])/;

/** The command text the rule families judge. A PowerShell command escapes
 * with a backtick and writes paths with `\`; the families were written for
 * Bash, where a backtick opens a substitution and `\` escapes the next
 * character. So for PowerShell each backtick and the character after it
 * become a space and `\` becomes `/`. A habit guard, not a parser: a
 * cmdlet such as `Remove-Item` is not judged. */
export function normalizeCommand(toolName, raw) {
  const s = String(raw);
  if (toolName !== 'PowerShell') return s;
  return s.replace(/`[\s\S]?/g, ' ').replace(/\\/g, '/');
}

const LAUNCHER_SUFFIX_RE = /\.(?:exe|cmd|ps1|bat)$/i;

/** Returns a program token without its Windows launcher suffix, so
 * `git.exe` and `npx.cmd` are judged as `git` and `npx`. */
export function programName(token) {
  return String(token).replace(LAUNCHER_SUFFIX_RE, '');
}

function isSupabaseProgram(token) {
  if (!token) return false;
  const name = programName(token).split('/').pop();
  return name === 'supabase' || name.startsWith('supabase@');
}

const SUPABASE_JS_RE = /(?:^|\/)supabase\/dist\/supabase\.js$/;

/** When `tokens` (already unwrapped) run the Supabase CLI, returns the
 * tokens after the program; otherwise null. The program is `supabase` or a
 * path ending in it (`node_modules/.bin/supabase`), `node
 * <...>/supabase/dist/supabase.js` (the tools' own entry), or `npx` /
 * `npm exec` / `npm x` with `supabase[@version]` after their flags, a
 * `-p`/`--package` value and a bare `--`. A leading `rtk` is skipped. */
export function isSupabaseCall(tokens) {
  let t = tokens;
  if (t[0] === 'rtk') t = t.slice(t[1] === 'proxy' ? 2 : 1);
  if (!t.length) return null;
  const head = programName(t[0]);
  if (isSupabaseProgram(head)) return t.slice(1);
  let i;
  if (head === 'node') {
    i = 1;
    while (i < t.length && t[i].startsWith('-')) i++;
    return i < t.length && SUPABASE_JS_RE.test(t[i]) ? t.slice(i + 1) : null;
  }
  if (head === 'npx') i = 1;
  else if (head === 'npm' && (t[1] === 'exec' || t[1] === 'x')) i = 2;
  else return null;
  while (i < t.length && t[i].startsWith('-')) {
    i += t[i] === '-p' || t[i] === '--package' ? 2 : 1;
  }
  return isSupabaseProgram(t[i]) ? t.slice(i + 1) : null;
}

export function dropAssignments(tokens) {
  const t = tokens.slice();
  while (t.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(t[0])) t.shift();
  return t;
}

// `env git reset --hard` read as the program `env`, so no git rule saw it.
// These wrappers all take the real program as their first non-flag argument.
const WRAPPERS = new Set(['env', 'command', 'nohup', 'time', 'xargs']);

function withProgramName(t) {
  return t.length ? [programName(t[0]), ...t.slice(1)] : t;
}

/** Strip leading assignments and any command wrappers, so the returned
 * tokens start at the program actually being run, without its launcher
 * suffix. */
export function unwrap(tokens) {
  let t = withProgramName(dropAssignments(tokens));
  for (let i = 0; i < 4 && t.length && WRAPPERS.has(t[0]); i++) {
    t = t.slice(1);
    while (t.length && t[0].startsWith('-')) t = t.slice(1);
    t = withProgramName(dropAssignments(t));
  }
  return t;
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

// The MAX_SESSIONS most recently active sessions survive a save, and the
// session being written always does: it is reserved first and the rest
// are ranked after it. Without the reservation, a tail of sessions tied at
// second granularity evicted the writer itself (measured 2026-09-16).
// 64: this host has run 15 concurrent sessions on one tree
// (orchestrate.prompt.md, 2026-09-10); an entry is lost only when 63 other
// sessions write between this session's last hook call and its Stop.
export const MAX_SESSIONS = 64;

function saveState(state, keepId) {
  let tmp = null;
  try {
    const sessions = state.sessions || {};
    const kept = keepId && sessions[keepId] ? [keepId] : [];
    const others = Object.keys(sessions)
      .filter((id) => id !== keepId)
      .sort((a, b) => (sessions[b].at || 0) - (sessions[a].at || 0));
    for (const id of others) {
      if (kept.length >= MAX_SESSIONS) break;
      kept.push(id);
    }
    const pruned = {};
    for (const id of kept) pruned[id] = sessions[id];
    const dir = stateDir();
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    // Temp file + rename: atomic on POSIX, replace-in-place on Windows, so a
    // concurrent loadState() never parses a half-written file.
    tmp = statePath() + '.' + process.pid + '.tmp';
    writeFileSync(tmp, JSON.stringify({ sessions: pruned }));
    renameSync(tmp, statePath());
  } catch {
    if (tmp) {
      try {
        unlinkSync(tmp);
      } catch {
        // nothing left to clean up
      }
    }
    // fail open: a lost write costs one duplicate reminder or one missing
    // Stop sentence, never a block. guard() swallows a throw anyway, and
    // speaking on a failed save would fire on every edit of every session
    // whenever the file is unwritable - the noisy guard nobody reads.
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
    saveState(state, sessionId);
    return false;
  }
  entry.seen.push(key);
  saveState(state, sessionId);
  return true;
}

/** Record that this session wrote `relativePath` (already repo-relative). */
export function recordWrite(sessionId, relativePath) {
  if (!sessionId || !relativePath) return;
  const state = loadState();
  const entry = sessionEntry(state, sessionId);
  entry.at = nowSeconds();
  entry.wrote[relativePath] = entry.at;
  saveState(state, sessionId);
}

/** The set of repo-relative paths this session has written, as returned by
 * recordWrite. Empty object if the session has written nothing (yet). */
export function getWrote(sessionId) {
  if (!sessionId) return {};
  const state = loadState();
  return (state.sessions[sessionId] && state.sessions[sessionId].wrote) || {};
}
