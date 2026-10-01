// PreToolUse(Agent|Task|SubagentDispatch): "A plan that changes schema,
// contracts, stored data or sync is reviewed first" (docs/decisions/,
// 2026-09-27), and "A plan review's fix-then-continue is applied once, with
// no second look" (docs/decisions/, 2026-10-01). An implementer dispatch
// whose prompt names `TASK: <id>` is judged against issues/<id>/plan.md: its
// Status must carry a "- Plan review:" line, and for every "required before
// <batch>" line the newest reviews/plan-<batch>[-<n>].md with a verdict
// decides (lib.mjs, parseReviewHead). An approve allows; a fix-then-continue
// allows when a Status line "- Plan review findings applied: reviews/<that
// report>" names it, because no second look follows; a replan denies.
// Silent, on purpose: another agent type, no TASK line, no plan.md, and any
// throw. A resume (SendMessage) is not a dispatch and is not judged.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { readInput, guard, deny, repoRoot, parseReviewHead } from './lib.mjs';

const TASK_RE = /\bTASK:\s*([A-Za-z0-9][A-Za-z0-9._-]*)/;
const PLAN_REVIEW_RE = /^\s*-\s*Plan review:\s*(.*)$/;
const REQUIRED_RE = /^required before ([A-Za-z0-9][A-Za-z0-9._-]*)\b/;
const NOT_REQUIRED_RE = /^not required\b/;
const APPLIED_RE =
  /^\s*-\s*Plan review findings applied:\s*`?(?:issues\/[A-Za-z0-9._-]+\/)?reviews\/(plan-[A-Za-z0-9._-]+?\.md)`?(?=[\s,;.)]|$)/;

const MSG = {
  declare: (id) =>
    `Blocked: issues/${id}/plan.md declares no plan review. The planner writes one line in the plan's Status: "- Plan review: required before <batch> (trigger: <which>)" or "- Plan review: not required (no trigger fired)" (docs/decisions/, 2026-09-27, "A plan that changes schema, contracts, stored data or sync is reviewed first"). Resume the planner to declare it, then dispatch again.`,
  unapproved: (id, batch, seen, tool) =>
    `Blocked: issues/${id}/plan.md requires a plan review before ${batch}, and no issues/${id}/reviews/plan-${batch}.md (or plan-${batch}-<n>.md) reads "Verdict: approve" - seen: ${seen}. Dispatch the reviewer with "Scope: plan before ${batch}" first; it writes that report (dispatch tool: ${tool}).`,
  unapplied: (id, batch, name, seen, tool) =>
    `Blocked: the newest plan review before ${batch}, issues/${id}/reviews/${name}, reads "Verdict: fix-then-continue", and issues/${id}/plan.md Status has no "- Plan review findings applied: reviews/${name}" line - seen: ${seen}. Resume the planner to apply its findings once and write that line, then dispatch again (docs/decisions/, 2026-10-01, "A plan review's fix-then-continue is applied once, with no second look"; dispatch tool: ${tool}).`,
  replan: (id, batch, name, seen, tool) =>
    `Blocked: the newest plan review before ${batch}, issues/${id}/reviews/${name}, reads "Verdict: replan", and a replan needs a second look - seen: ${seen}. Resume the planner to revise the plan, then dispatch the reviewer with "Scope: plan before ${batch}" for the next reviews/plan-${batch}-<n>.md (dispatch tool: ${tool}).`
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

/** Returns the report names that Status lines declare as applied. */
function appliedReports(text) {
  const names = new Set();
  for (const line of statusLines(text)) {
    const m = APPLIED_RE.exec(line);
    if (m) names.add(m[1]);
  }
  return names;
}

/** Returns `{ result, name, seen }` for one required batch: `result` is
 * 'allow', 'unapproved', 'unapplied' or 'replan', judged by the newest report. */
function planReview(reviewsDir, batch, applied) {
  const nameRe = new RegExp(`^plan-${escapeRegExp(batch)}(?:-(\\d+))?\\.md$`);
  const reports = listReviews(reviewsDir)
    .map((name) => ({ name, m: nameRe.exec(name) }))
    .filter((r) => r.m)
    .map((r) => ({
      name: r.name,
      n: r.m[1] ? Number(r.m[1]) : 1,
      verdict: verdictOf(path.join(reviewsDir, r.name))
    }))
    .sort((a, b) => a.n - b.n || (a.name < b.name ? -1 : 1));
  const seen = reports.length
    ? reports.map((r) => `${r.name}: ${r.verdict || '(no Verdict: line)'}`).join(', ')
    : 'none';
  const newest = reports.filter((r) => r.verdict).pop();
  if (!newest) return { result: 'unapproved', name: null, seen };
  let result = 'replan';
  if (newest.verdict === 'approve') result = 'allow';
  else if (newest.verdict === 'fix-then-continue') {
    result = applied.has(newest.name) ? 'allow' : 'unapplied';
  }
  return { result, name: newest.name, seen };
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
  const applied = appliedReports(text);
  const tool = input.tool_name || 'unknown';
  for (const batch of batches) {
    const review = planReview(reviewsDir, batch, applied);
    if (review.result === 'unapproved') {
      return deny(event, MSG.unapproved(id, batch, review.seen, tool));
    }
    if (review.result === 'unapplied') {
      return deny(event, MSG.unapplied(id, batch, review.name, review.seen, tool));
    }
    if (review.result === 'replan') {
      return deny(event, MSG.replan(id, batch, review.name, review.seen, tool));
    }
  }
  return undefined;
});
