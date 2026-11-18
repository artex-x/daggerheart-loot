// The root `npm audit` gate of CI's `audit` job: it fails on every high or
// critical advisory, except an allowlisted one before its expiry date.
// docs/decisions/2026-11-17-the-root-audit-allows-one-picomatch-advisory-until-2026-12-17.md
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** The advisories the gate lets through. `range` is the vulnerable range at
 * the time of the entry; a new range means a patched version may exist. */
export const ALLOWLIST = [];

const SEVERITIES = ['info', 'low', 'moderate', 'high', 'critical'];
const GATED = new Set(['high', 'critical']);

/** Returns the GHSA id at the end of an advisory's url, or null. */
export function ghsaOf(advisory) {
  const match = /\/(GHSA-[a-z0-9-]+)$/i.exec(String(advisory.url ?? ''));
  return match ? match[1] : null;
}

function isAdvisory(via) {
  return (
    via !== null &&
    typeof via === 'object' &&
    typeof via.url === 'string' &&
    SEVERITIES.includes(via.severity)
  );
}

/**
 * Returns the problems of an `npm audit --json` report (auditReportVersion
 * 2) against `allowlist` on the day `today` (YYYY-MM-DD); an empty list
 * passes. A report that cannot be read fails closed.
 */
export function gate(report, allowlist, today) {
  if (report === null || typeof report !== 'object' || Array.isArray(report))
    return ['the npm audit output is not a JSON object. Expected an audit report'];
  if (report.error) return [`npm audit reported an error: ${JSON.stringify(report.error)}`];
  const vulns = report.vulnerabilities;
  if (
    report.auditReportVersion !== 2 ||
    vulns === null ||
    typeof vulns !== 'object' ||
    Array.isArray(vulns)
  )
    return [
      'the npm audit output is not an audit report version 2 with a vulnerabilities object'
    ];

  const problems = [];
  for (const [name, entry] of Object.entries(vulns)) {
    if (!entry || !SEVERITIES.includes(entry.severity) || !Array.isArray(entry.via)) {
      problems.push(`${name}: the audit entry has no known severity or no via list`);
      continue;
    }
    for (const via of entry.via) {
      if (typeof via === 'string') {
        if (!vulns[via]) problems.push(`${name}: via ${via}, which the report does not list`);
      } else if (!isAdvisory(via)) {
        problems.push(`${name}: an advisory without a url or a known severity`);
      }
    }
  }
  if (problems.length) return problems;

  const active = new Set();
  for (const allowed of allowlist) {
    if (today > allowed.expires) {
      problems.push(
        `${allowed.id} (${allowed.package}): the exception expired on ${allowed.expires}. Remove it from ALLOWLIST in tools/audit-gate.mjs and fix or re-decide the advisory`
      );
      continue;
    }
    const seen = Object.values(vulns).flatMap((entry) =>
      entry.via.filter((via) => typeof via !== 'string' && ghsaOf(via) === allowed.id)
    );
    if (seen.length === 0) {
      problems.push(
        `${allowed.id} (${allowed.package}): the allowlisted advisory is no longer reported. Remove the stale entry from ALLOWLIST in tools/audit-gate.mjs`
      );
      continue;
    }
    const ranges = [...new Set(seen.map((via) => via.range))].filter(
      (r) => r !== allowed.range
    );
    if (ranges.length) {
      problems.push(
        `${allowed.id} (${allowed.package}): the vulnerable range is now ${ranges.join(', ')}, not ${allowed.range}. A patched version may exist: update the dependency and remove the entry`
      );
      continue;
    }
    active.add(allowed.id);
  }

  for (const [name, entry] of Object.entries(vulns)) {
    if (!GATED.has(entry.severity)) continue;
    const advisories = reachable(vulns, name).filter((via) => GATED.has(via.severity));
    if (advisories.length === 0) {
      problems.push(
        `${name}: ${entry.severity}, but no ${entry.severity} advisory is reachable through via`
      );
      continue;
    }
    for (const via of advisories) {
      const id = ghsaOf(via);
      if (id && active.has(id)) continue;
      problems.push(
        `${name}: ${via.severity} advisory ${id ?? via.url} (${via.name}: ${via.title})`
      );
    }
  }
  return problems;
}

/** Returns the advisory objects reachable from package `name` through via. */
function reachable(vulns, name) {
  const found = new Map();
  const visited = new Set();
  const stack = [name];
  while (stack.length) {
    const current = stack.pop();
    if (visited.has(current)) continue;
    visited.add(current);
    for (const via of vulns[current].via) {
      if (typeof via === 'string') stack.push(via);
      else found.set(via.url, via);
    }
  }
  return [...found.values()];
}

/** Returns the parsed output of `npm audit --json` in `cwd`, or null. */
export function readAudit(cwd) {
  // One command string: Windows runs npm.cmd only through a shell.
  const run = spawnSync('npm audit --json', {
    cwd,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    shell: true
  });
  try {
    return JSON.parse(run.stdout);
  } catch {
    return null;
  }
}

function main() {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
  const today = new Date().toISOString().slice(0, 10);
  const problems = gate(readAudit(root), ALLOWLIST, today);
  if (problems.length) {
    for (const problem of problems) console.error(`audit gate: ${problem}`);
    process.exit(1);
  }
  const allowed = ALLOWLIST.map((a) => `${a.id} until ${a.expires}`).join(', ');
  console.log(`audit gate: no high or critical advisory outside the allowlist (${allowed})`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
