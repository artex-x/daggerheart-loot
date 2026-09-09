// Stop: warn (never block) when this session's own writes are still
// uncommitted, or when the active task's handoff.md looks stale next to
// what this session wrote. See issues/65/plan.md section 4, hook 6.

import { createHash } from 'node:crypto';
import { statSync } from 'node:fs';
import path from 'node:path';
import { readInput, guard, warn, git, activeTask, getWrote, once } from './lib.mjs';

guard(() => {
  const input = readInput();
  if (input.stop_hook_active === true) return undefined; // never loop

  const wrote = getWrote(input.session_id);
  const writtenPaths = Object.keys(wrote);
  if (!writtenPaths.length) return undefined;

  const status = git(['status', '--porcelain', '-uall']);
  const dirty = new Set();
  if (status !== null) {
    for (const row of status.split('\n')) {
      if (!row) continue;
      dirty.add(row.slice(3));
    }
  }

  const uncommitted = writtenPaths.filter((p) => dirty.has(p));

  const task = activeTask();
  let staleness = null;
  if (task && task.hasHandoff) {
    try {
      const handoffMtime = statSync(path.join(task.dir, 'handoff.md')).mtimeMs;
      const nonTaskWrites = writtenPaths.filter((p) => !p.startsWith(`issues/${task.id}/`));
      const newestWrite = nonTaskWrites.reduce((max, p) => Math.max(max, wrote[p] * 1000), 0);
      if (newestWrite > handoffMtime) {
        staleness = `issues/${task.id}/handoff.md is older than the code this session changed. Update it with decisions, checks and results, blockers, and the exact next action.`;
      }
    } catch {
      // fail open: no staleness sentence
    }
  }

  if (!uncommitted.length && !staleness) return undefined;

  const parts = [];
  if (uncommitted.length) {
    const shown = uncommitted.slice(0, 8).join(', ');
    const more = uncommitted.length > 8 ? `, +${uncommitted.length - 8} more` : '';
    parts.push(
      `Session stopping with this session's work uncommitted: ${shown}${more}. CLAUDE.md asks for a coherent committed boundary - never a half-batch.`
    );
  }
  if (staleness) parts.push(staleness);

  const dedupeKey = `stop:${createHash('sha256')
    .update(uncommitted.join('\n') + '|' + (staleness || ''))
    .digest('hex')
    .slice(0, 16)}`;
  if (!once(input.session_id, dedupeKey)) return undefined;

  return warn(parts.join('\n\n'));
});
