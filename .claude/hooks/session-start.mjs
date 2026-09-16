// SessionStart: branch, HEAD, dirty-file summary, most recently touched
// issues/<id>/. Never blocks - see .claude/README.md, "Hooks".

import { readInput, guard, speak, git, activeTask } from './lib.mjs';

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

  if (!lines.length) return undefined;
  return speak(event, lines.join('\n'));
});
