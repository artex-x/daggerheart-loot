/**
 * Status line, and the only place the 5-hour window is visible.
 *
 * Hooks receive no usage data at all - their stdin carries session_id, cwd,
 * permission_mode, effort, agent_id and friends, and nothing about tokens,
 * cost or rate limits. The statusLine command is the one component Claude Code
 * hands `rate_limits` to. So this does two jobs: it prints the status line, and
 * it side-writes the figures to .claude/.usage.json for usage-guard.mjs.
 *
 * Requires `refreshInterval` in settings.json. Without it the event-driven
 * triggers go quiet exactly while a coordinator waits on subagents, which is
 * when the guard needs a fresh number.
 *
 * `rate_limits` appears only for Claude.ai Pro and Max subscribers, and only
 * after the first API response. Every window may be independently absent, so
 * every read is optional and the line still prints without them.
 *
 * Node rather than bash + jq: jq is not installed on a stock Windows box, and
 * a silent `command -v jq` bail is a guard that never fires.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const AMBER = 75;
const RED = 90;

const read = () => {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch {
    return {};
  }
};

const s = read();
const five = s.rate_limits?.five_hour;
const week = s.rate_limits?.seven_day;

if (typeof five?.used_percentage === 'number') {
  try {
    fs.writeFileSync(
      path.join(HERE, '.usage.json'),
      JSON.stringify({
        /* Bound to the session that produced it. claude-pace refuses to cache
           quota at all, on the grounds that an account-level snapshot cannot
           be proven to belong to the current provider/account - a fair
           objection, and one a hook cannot dodge by reading live data, because
           hooks are never given any. Stamping the session id is the next best
           thing: usage-guard.mjs discards a file written by a different
           session, so a stale snapshot from another account or project can
           never be read as this session's. */
        session_id: s.session_id ?? null,
        five_hour_pct: five.used_percentage,
        resets_at: five.resets_at ?? 0,
        written_at: Math.floor(Date.now() / 1000)
      })
    );
  } catch {
    /* A status line must never be the reason a turn fails. */
  }
}

const parts = [s.model?.display_name ?? 'claude'];
if (s.workspace?.branch) parts.push(s.workspace.branch);
if (typeof s.context_window?.used_percentage === 'number') {
  parts.push(`ctx ${String(Math.round(s.context_window.used_percentage))}%`);
}

if (typeof five?.used_percentage === 'number') {
  const pct = Math.round(five.used_percentage);
  const colour = pct >= RED ? '\x1b[31m' : pct >= AMBER ? '\x1b[33m' : '\x1b[32m';
  const at = five.resets_at
    ? ` until ${new Date(five.resets_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : '';
  parts.push(`${colour}5h ${String(pct)}%${at}\x1b[0m`);
}
if (typeof week?.used_percentage === 'number') {
  parts.push(`7d ${String(Math.round(week.used_percentage))}%`);
}

process.stdout.write(`${parts.join('  ')}\n`);
