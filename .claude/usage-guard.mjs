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
 * Fires once per threshold per window. The marker carries the window's
 * `resets_at`, so a new window re-arms both thresholds on its own.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const USAGE = path.join(HERE, '.usage.json');
const MARKER = path.join(HERE, '.usage-warned');

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
