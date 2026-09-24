// SessionStart: branch, HEAD, dirty-file summary, most recently touched
// issues/<id>/, and in a cloud session the host probes and the cloud rules.
// Never blocks - see .claude/README.md, "Hooks" and "Cloud sessions".

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readInput, guard, speak, git, activeTask, repoRoot } from './lib.mjs';

function probeCommand(program, args, timeout) {
  try {
    const r = spawnSync(program, args, { stdio: 'ignore', timeout });
    if (r.error)
      return r.error.code === 'ETIMEDOUT' ? `no answer in ${timeout} ms` : 'not found';
    return r.status === 0 ? 'ok' : `exit ${r.status}`;
  } catch {
    return 'not found';
  }
}

function probeNode() {
  try {
    const want = readFileSync(path.join(repoRoot(), '.nvmrc'), 'utf8').trim().replace(/^v/, '');
    const have = process.versions.node.split('.')[0];
    return have === want.split('.')[0] ? 'ok' : `Node ${have}, .nvmrc wants ${want}`;
  } catch {
    return '.nvmrc not readable';
  }
}

// The setup script cannot leave a daemon running, so every cloud session
// starts dockerd itself (measured 2026-09-24).
function dockerProbe() {
  const result = probeCommand('docker', ['info'], 3000);
  return result === 'ok' ? result : `${result} - start it: (dockerd > /tmp/dockerd.log 2>&1 &)`;
}

/** The cloud block: six host probes (each "ok" or what failed; "skipped"
 * under the selftest) and the three rules of a cloud session. */
function cloudLines() {
  const skip = process.env.LOOT_SKIP_PROBES === '1';
  const probe = (fn) => (skip ? 'skipped' : fn());
  return [
    'Cloud session.',
    `  Node: ${probe(probeNode)}`,
    `  docker info: ${probe(dockerProbe)}`,
    `  puppeteer cache: ${probe(() => (existsSync(path.join(os.homedir(), '.cache', 'puppeteer')) ? 'ok' : 'missing'))}`,
    `  node_modules: ${probe(() => (existsSync(path.join(repoRoot(), 'node_modules')) ? 'ok' : 'missing - run npm ci'))}`,
    `  gitleaks version: ${probe(() => probeCommand('gitleaks', ['version'], 2000))}`,
    `  rtk --version: ${probe(() => probeCommand('rtk', ['--version'], 2000))}`,
    'A whole release runs on one host.',
    'No production secret enters this environment.',
    'Push only the current task branch, never `main`.'
  ];
}

function parseStatus(text) {
  const staged = [];
  const unstaged = [];
  const untracked = [];
  for (const row of text.split('\n')) {
    if (!row) continue;
    const code = row.slice(0, 2);
    const file = row.slice(3);
    if (code.startsWith('??')) untracked.push(file);
    else {
      if (code[0] !== ' ') staged.push(file);
      if (code[1] !== ' ') unstaged.push(file);
    }
  }
  return { staged, unstaged, untracked };
}

function capped(list) {
  const shown = list.slice(0, 10).join(', ');
  const more = list.length > 10 ? `, +${list.length - 10} more` : '';
  return shown + more;
}

guard(() => {
  const input = readInput();
  const event = input.hook_event_name || 'SessionStart';
  const lines = [];

  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
  const head = git(['log', '-1', '--format=%h %s']);
  if (branch !== null && head !== null) {
    lines.push(`Repo: branch ${branch.trim()}, HEAD ${head.trim()}.`);
  }

  const status = git(['status', '--porcelain', '-uall']);
  if (status !== null) {
    const { staged, unstaged, untracked } = parseStatus(status);
    const total = staged.length + unstaged.length + untracked.length;
    lines.push(`Working tree: ${total} changed paths.`);
    if (staged.length) lines.push(`  staged:    ${capped(staged)}`);
    if (unstaged.length) lines.push(`  unstaged:  ${capped(unstaged)}`);
    if (untracked.length) lines.push(`  untracked: ${capped(untracked)}`);
  }

  const task = activeTask();
  if (task) {
    const files = [];
    if (task.hasContext) files.push('context.md');
    if (task.hasPlan) files.push('plan.md');
    if (task.hasHandoff) files.push('handoff.md');
    lines.push(`Most recently touched task: issues/${task.id}/ (${files.join(', ')}).`);
    lines.push(
      `Read issues/${task.id}/context.md before re-fetching the issue. Confirm the task id with the human - the newest directory is a guess, not an assignment.`
    );
  }

  if (process.env.CLAUDE_CODE_REMOTE === 'true') lines.push(...cloudLines());

  if (!lines.length) return undefined;
  return speak(event, lines.join('\n'));
});
