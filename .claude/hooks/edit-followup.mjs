// PostToolUse(Edit|MultiEdit|Write|NotebookEdit): record the write (so the
// Stop hook can tell what this session actually touched), then remind at
// most once per session per group about derived artefacts, contracts, and
// the parity baseline. Never blocks. See issues/65/plan.md section 4, hook 5.

import { readInput, guard, speak, relPath, recordWrite, once } from './lib.mjs';

const GROUPS = [
  {
    id: 'remind:data',
    test: (p) => p === 'data.js',
    message:
      'data.js changed. Run `node tools/build.js` before committing or tests/derived.js will fail. If counts or source lists changed, index.html, README.md, README.ru.md, app.js, llms.txt and robots.txt change with it.'
  },
  {
    id: 'remind:contract',
    test: (p) =>
      p === 'docs/specs/contracts.md' ||
      p === 'docs/specs/routes.md' ||
      p.startsWith('docs/fixtures/') ||
      p === 'tests/contracts.js' ||
      p === 'llms.txt',
    message: (p) =>
      `A public contract surface changed (${p}). CLAUDE.md requires docs/fixtures/, tests/contracts.js, docs/specs/CONTRACTS.md and llms.txt to move together; \`node tests/contracts.js\` checks it.`
  },
  {
    id: 'remind:baseline',
    test: (p) => p === 'index.html' || p === 'app.js' || p === 'style.css',
    message: (p) =>
      `${p} is the parity baseline the rewrite is measured against. Editing it moves the target. Confirm this is a data or count update, not a migration change.`
  }
];

guard(() => {
  const input = readInput();
  const event = input.hook_event_name || 'PostToolUse';
  const filePath = input.tool_input && input.tool_input.file_path;
  const rel = relPath(filePath, input.cwd);
  if (rel === null) return undefined;

  recordWrite(input.session_id, rel);

  for (const group of GROUPS) {
    if (!group.test(rel)) continue;
    if (!once(input.session_id, group.id)) continue;
    const text = typeof group.message === 'function' ? group.message(rel) : group.message;
    return speak(event, text);
  }
  return undefined;
});
