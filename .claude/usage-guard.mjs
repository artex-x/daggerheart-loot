/**
 * Gently ask the orchestrator to wrap up before the 5-hour window runs out.
 *
 * Hooks get no usage data - see statusline.mjs, which is the one component
 * Claude Code hands `rate_limits` to and which writes .usage.json for this
 * script to read.
 *
 * A nudge, not a gate: it never blocks, never fails the turn, and stays silent
 * whenever it cannot say something useful - no file, a stale file, no
 * `rate_limits` at all (it is Pro/Max only), or below the first threshold.
 *
 * Known inert in the Claude desktop app (Code tab), verified 2026-09-09: the
 * statusLine command only runs where a status line is rendered, so .usage.json
 * is never written there and every invocation quits on the missing file. The
 * five-hour percentage exists nowhere else on disk - not in the transcripts,
 * not under ~/.claude, and no CLI reports it - so the desktop fallback is the
 * human saying "we're at 75%". Both scripts were tested in isolation and work:
 * given a synthetic payload the status line writes the snapshot and this guard
 * emits its message. Switching the source to the transcript's own token totals
 * (hook input carries `transcript_path`) would work in both, but measures this
 * session's spend rather than the account's window, so the thresholds would
 * have to be re-derived rather than carried over. See issue 47's handoff.
 *
 * Fires once per threshold per window. The marker carries the window's
 * `resets_at`, so a new window re-arms both thresholds on its own.
 *
 * Where it is registered matters, and was measured rather than assumed
 * (2026-09-09, desktop app). Hooks do fire here; only the snapshot was ever
 * missing. `additionalContext` is delivered to whoever's turn it is:
 *
 * - `UserPromptSubmit` reaches the session - correct, and kept.
 * - `SubagentStop` reaches the *subagent*, which is already stopping. A test
 *   agent asked to reply "OK" instead replied that it was wrapping up at 80%.
 *   The message is written for a coordinator ("do not dispatch another
 *   worker"), which a worker cannot act on, so this registration was dropped.
 * - `PostToolUse` on the agent tool reaches the session, at the moment a
 *   worker returns - which is exactly when a coordinator decides whether to
 *   dispatch the next one. Verified by a Bash-matched probe: the message
 *   arrived in the coordinator's own context.
 *
 * A coordinator waiting on workers submits no prompts for hours, so
 * PostToolUse is the registration that actually protects a long session.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const USAGE = path.join(HERE, '.usage.json');
const MARKER = path.join(HERE, '.usage-warned');
const TRACE = path.join(HERE, '.usage-hook.log');

/* A number nobody has refreshed for ten minutes is not evidence of anything.
   statusLine needs `refreshInterval` set, or it goes quiet exactly while a
   worker is running - which is when this matters. */
const STALE_AFTER = 600;
const FINISH_AT = 75;
const STOP_AT = 90;

const quit = () => process.exit(0);

let hook = {};
try {
  hook = JSON.parse(fs.readFileSync(0, 'utf8'));
} catch {
  /* Hook input is optional here; only the event name comes from it. */
}

/* Did this hook run at all? Every exit below is silent by design, so "the
   guard fired and had nothing to say" and "the guard was never invoked" look
   identical from outside - and one session burned real time guessing which it
   was. One line per invocation, in a gitignored file, tells them apart.
   Diagnostics must never fail a turn, so the whole thing is best-effort. */
try {
  fs.appendFileSync(
    TRACE,
    `${new Date().toISOString()} ${hook.hook_event_name ?? 'unknown-event'}\n`
  );
} catch {
  /* no trace is a worse diagnosis, not a broken turn */
}

let usage;
try {
  usage = JSON.parse(fs.readFileSync(USAGE, 'utf8'));
} catch {
  quit();
}

/* A snapshot written by a different session says nothing about this one - it
   may be another account or another provider entirely. Borrowed from
   claude-pace's reasoning for refusing to cache quota at all; a hook has no
   live source, so binding the cache to the session is the available half. */
if (hook.session_id && usage.session_id && hook.session_id !== usage.session_id) quit();

const pct = usage.five_hour_pct;
if (typeof pct !== 'number') quit();
if (Math.floor(Date.now() / 1000) - (usage.written_at ?? 0) >= STALE_AFTER) quit();

const level = pct >= STOP_AT ? 'stop' : pct >= FINISH_AT ? 'finish' : null;
if (!level) {
  try {
    fs.rmSync(MARKER, { force: true });
  } catch {
    /* nothing to clear */
  }
  quit();
}

const stamp = `${String(usage.resets_at ?? 0)}:${level}`;
try {
  if (fs.readFileSync(MARKER, 'utf8') === stamp) quit();
} catch {
  /* not warned yet for this window */
}
try {
  fs.writeFileSync(MARKER, stamp);
} catch {
  /* a marker we cannot write means we warn again; better than staying silent */
}

const when = usage.resets_at
  ? `, resets ${new Date(usage.resets_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  : '';
const at = `The 5-hour usage window is at ${String(Math.round(pct))}%${when}.`;

const message =
  level === 'finish'
    ? `${at} Finish the batch already in flight, but do not dispatch another worker and do not start a new batch after it. When the current unit of work reaches a coherent, committed boundary, update issues/<id>/handoff.md so the next session can pick it up cleanly.`
    : `${at} Stop taking on new work now. Let any running worker finish, commit the coherent boundary - never a half-batch - then write issues/<id>/handoff.md with decisions, deviations, checks and results, blockers, and the exact next action, and end the session. Losing the handoff costs far more than the work left undone.`;

process.stdout.write(
  `${JSON.stringify({
    hookSpecificOutput: {
      hookEventName: hook.hook_event_name ?? 'SubagentStop',
      additionalContext: message,
      systemMessage: message
    }
  })}\n`
);
