// PreToolUse(Agent|Task|SubagentDispatch): "A plan that changes schema,
// contracts, stored data or sync is reviewed first" (docs/decisions/,
// 2026-09-27). An implementer dispatch whose prompt names `TASK: <id>` is
// judged against issues/<id>/plan.md: its Status must carry a
// "- Plan review:" line, and every "required before <batch>" line needs a
// reviews/plan-<batch>.md (or plan-<batch>-<n>.md) whose head reads
// "Verdict: approve" (lib.mjs, parseReviewHead). Silent, on purpose: another
// agent type, no TASK line, no plan.md, and any throw. A resume
// (SendMessage) is not a dispatch and is not judged.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { readInput, guard, deny, repoRoot, parseReviewHead } from './lib.mjs';

const TASK_RE = /\bTASK:\s*([A-Za-z0-9][A-Za-z0-9._-]*)/;
const PLAN_REVIEW_RE = /^\s*-\s*Plan review:\s*(.*)$/;
const REQUIRED_RE = /^required before ([A-Za-z0-9][A-Za-z0-9._-]*)\b/;
const NOT_REQUIRED_RE = /^not required\b/;

const MSG = {
  declare: (id) =>
    `Blocked: issues/${id}/plan.md declares no plan review. The planner writes one line in the plan's Status: "- Plan review: required before <batch> (trigger: <which>)" or "- Plan review: not required (no trigger fired)" (docs/decisions/, 2026-09-27, "A plan that changes schema, contracts, stored data or sync is reviewed first"). Resume the planner to declare it, then dispatch again.`,
  unapproved: (id, batch, seen, tool) =>
    `Blocked: issues/${id}/plan.md requires a plan review before ${batch}, and no issues/${id}/reviews/plan-${batch}.md (or plan-${batch}-<n>.md) reads "Verdict: approve" - seen: ${seen}. Dispatch the reviewer with "Scope: plan before ${batch}" first; it writes that report (dispatch tool: ${tool}).`
};

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Returns the lines of the plan's Status section, or of the whole file
 * when it has no `## Status` heading. */
function statusLines(text) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => /^## Status\s*$/.test(line));
  if (start === -1) return lines;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^## /.test(line));
  return end === -1 ? rest : rest.slice(0, end);
}

/** Returns the batches the plan requires a review before, or null when the
 * declaration is missing or malformed. */
function requiredBatches(text) {
  const values = [];
  for (const line of statusLines(text)) {
    const m = PLAN_REVIEW_RE.exec(line);
    if (m) values.push(m[1].trim());
  }
  if (!values.length) return null;
  const batches = [];
  for (const value of values) {
    const required = REQUIRED_RE.exec(value);
    if (required) batches.push(required[1]);
    else if (!NOT_REQUIRED_RE.test(value)) return null;
  }
  return batches;
}

function listReviews(reviewsDir) {
  try {
    return existsSync(reviewsDir) ? readdirSync(reviewsDir) : [];
  } catch {
    return [];
  }
}

function verdictOf(file) {
  try {
    return parseReviewHead(readFileSync(file, 'utf8')).verdict;
  } catch {
    return null;
  }
}

/** Returns `{ approved, seen }` for one required batch. */
function planReview(reviewsDir, batch) {
  const nameRe = new RegExp(`^plan-${escapeRegExp(batch)}(?:-\\d+)?\\.md$`);
  const seen = [];
  let approved = false;
  for (const name of listReviews(reviewsDir)
    .filter((n) => nameRe.test(n))
    .sort()) {
    const verdict = verdictOf(path.join(reviewsDir, name));
    seen.push(`${name}: ${verdict || '(no Verdict: line)'}`);
    if (verdict === 'approve') approved = true;
  }
  return { approved, seen: seen.length ? seen.join(', ') : 'none' };
}

guard(() => {
  const input = readInput();
  const event = input.hook_event_name || 'PreToolUse';
  const ti = input.tool_input;
  if (!ti || typeof ti !== 'object' || ti.subagent_type !== 'implementer') return undefined;
  const m = TASK_RE.exec(String(ti.prompt || ''));
  if (!m) return undefined;
  const id = m[1];
  const taskDir = path.join(repoRoot(), 'issues', id);
  let text;
  try {
    text = readFileSync(path.join(taskDir, 'plan.md'), 'utf8');
  } catch {
    return undefined;
  }
  const batches = requiredBatches(text);
  if (batches === null) return deny(event, MSG.declare(id));
  const reviewsDir = path.join(taskDir, 'reviews');
  for (const batch of batches) {
    const review = planReview(reviewsDir, batch);
    if (!review.approved) {
      return deny(event, MSG.unapproved(id, batch, review.seen, input.tool_name || 'unknown'));
    }
  }
  return undefined;
});
