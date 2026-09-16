// Stop: warn (never block) when this session's own writes are still
// uncommitted, or when the active task's handoff.md looks stale next to
// what this session wrote, or when a task document of the active task is
// past its size budget. See .claude/README.md, "Hooks".

import { createHash } from 'node:crypto';
import { statSync } from 'node:fs';
import path from 'node:path';
import { readInput, guard, warn, git, activeTask, getWrote, once, pathKey } from './lib.mjs';

/** issues/<id>/context.md, plan.md, handoff.md, or anything under
 * issues/<id>/mocks/ - the task-document set. Excluded from the untracked-
 * writes candidate list below: the one recorded scratch artifact
 * (issues/dh-image-polish/refresh_artwork.py) lives inside an issue
 * directory, so excluding the whole active directory would blind this rule
 * to its only measured instance. Excluding just the document names keeps a
 * planner's own fresh plan.md out of the message instead. */
function isTaskDocument(key) {
  return (
    /^issues\/[^/]+\/(context|plan|handoff)\.md$/.test(key) ||
    /^issues\/[^/]+\/mocks\//.test(key)
  );
}

/** docs/ is durable knowledge being written, never scratch - closeout step 6
 * sends behaviour there - so a new untracked file under it is out of scope
 * for this rule entirely, the same as a task document. */
function isExcluded(key) {
  return key.startsWith('docs/') || isTaskDocument(key);
}

const BUDGET_WARN_BYTES = 150 * 1024;
const BUDGET_COLLAPSE_BYTES = 300 * 1024;
const TASK_DOCS = ['context.md', 'plan.md', 'handoff.md'];
const COLLAPSE = {
  'handoff.md':
    'keep one Status (the current one), one line per shipped batch under Completed (outcome + commit), Verification for the latest batch only',
  'plan.md':
    "collapse every shipped batch's brief to its outcome and commit; keep the design, decisions, rejected alternatives and the next batch",
  'context.md':
    "keep facts, constraints, decisions and disproved reasons; move narrative to the plan's outcome lines"
};

/** Budget sentences for the active task's documents - only for a session
 * that wrote into that task directory (the author is the one who can act),
 * never for a bystander. Warn past 150 KB; past 300 KB name the collapse.
 * Sizes from statSync; a missing file is skipped. Never a decision. */
function budgetSentences(task, writtenPaths) {
  if (!task) return [];
  const prefix = pathKey(`issues/${task.id}/`);
  if (!writtenPaths.some((p) => pathKey(p).startsWith(prefix))) return [];
  const out = [];
  for (const name of TASK_DOCS) {
    let size;
    try {
      size = statSync(path.join(task.dir, name)).size;
    } catch {
      continue;
    }
    const kb = Math.round(size / 1024);
    const file = `issues/${task.id}/${name}`;
    if (size >= BUDGET_COLLAPSE_BYTES) {
      out.push(
        `${file} is ${kb} KB, past the 300 KB collapse line: ${COLLAPSE[name]} - .claude/skills/handoff/SKILL.md (/handoff). Never drop decisions and their reasons, rejected approaches, blockers, the next batch, or exact check results; history keeps the full text.`
      );
    } else if (size >= BUDGET_WARN_BYTES) {
      out.push(
        `${file} is ${kb} KB, past the 150 KB budget; compact it per .claude/skills/handoff/SKILL.md (/handoff) before it reaches 300 KB.`
      );
    }
  }
  return out;
}

guard(() => {
  const input = readInput();
  if (input.stop_hook_active === true) return undefined; // never loop

  const wrote = getWrote(input.session_id);
  const writtenPaths = Object.keys(wrote);
  if (!writtenPaths.length) return undefined;

  // Keyed by pathKey(), valued by git's own spelling: relPath() lower-cases
  // on win32, so a raw `dirty.has(p)` never matched a mixed-case name -
  // PageHead.svelte, CLAUDE.md and both READMEs were silently dropped from
  // the warning, which is most of what gets left uncommitted here. The
  // second map is the untracked (`??`) subset of the same rows, used below
  // to name this session's own untracked writes separately.
  const status = git(['status', '--porcelain', '-uall']);
  const dirty = new Map();
  const untracked = new Map();
  if (status !== null) {
    for (const row of status.split('\n')) {
      if (!row) continue;
      const raw = row.slice(3);
      dirty.set(pathKey(raw), raw);
      if (row.startsWith('??')) untracked.set(pathKey(raw), raw);
    }
  }

  // A path this session wrote, still untracked, and not excluded: named in
  // its own sentence below, never as "uncommitted work". A path this session
  // wrote, still untracked, but excluded (docs/, a task document): named
  // nowhere by this hook - it is durable-knowledge-in-progress or a
  // planner's own artefact, not a candidate for either sentence.
  const untrackedWritten = writtenPaths
    .map((p) => untracked.get(pathKey(p)))
    .filter((raw) => raw !== undefined);
  const candidates = untrackedWritten.filter((raw) => !isExcluded(pathKey(raw)));
  const candidateKeys = new Set(candidates.map(pathKey));
  const excludedUntrackedKeys = new Set(
    untrackedWritten.filter((raw) => isExcluded(pathKey(raw))).map(pathKey)
  );

  const uncommitted = writtenPaths
    .map((p) => dirty.get(pathKey(p)))
    .filter(
      (raw) =>
        raw !== undefined &&
        !candidateKeys.has(pathKey(raw)) &&
        !excludedUntrackedKeys.has(pathKey(raw))
    );

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

  const budget = budgetSentences(task, writtenPaths);

  if (!uncommitted.length && !candidates.length && !staleness && !budget.length) {
    return undefined;
  }

  const parts = [];
  if (uncommitted.length) {
    const shown = uncommitted.slice(0, 8).join(', ');
    const more = uncommitted.length > 8 ? `, +${uncommitted.length - 8} more` : '';
    parts.push(
      `Session stopping with this session's work uncommitted: ${shown}${more}. CLAUDE.md asks for a coherent committed boundary - never a half-batch.`
    );
  }
  if (candidates.length) {
    const shown = candidates.slice(0, 8).join(', ');
    const more = candidates.length > 8 ? `, +${candidates.length - 8} more` : '';
    parts.push(
      `Untracked, and written by this session: ${shown}${more}. Each is either part of the change (commit it) or task scratch (delete it, or record in the handoff why it is kept) - closeout step 5. This hook deletes nothing.`
    );
  }
  if (staleness) parts.push(staleness);
  if (budget.length) parts.push(...budget);

  const dedupeKey = `stop:${createHash('sha256')
    .update(
      uncommitted.join('\n') +
        '|' +
        candidates.join('\n') +
        '|' +
        (staleness || '') +
        '|' +
        budget.join('\n')
    )
    .digest('hex')
    .slice(0, 16)}`;
  if (!once(input.session_id, dedupeKey)) return undefined;

  return warn(parts.join('\n\n'));
});
