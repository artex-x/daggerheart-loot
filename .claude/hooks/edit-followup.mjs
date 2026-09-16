// PostToolUse(Edit|MultiEdit|Write|NotebookEdit): record the write (so the
// Stop hook can tell what this session actually touched), then remind at
// most once per session per group about derived artefacts, contracts, and
// the parity baseline. Never blocks. See .claude/README.md, "Hooks".

import { readInput, guard, speak, relPath, pathKey, recordWrite, once } from './lib.mjs';

// Every test here runs against pathKey(rel) (always-folded), not rel itself.
// docs/specs/CONTRACTS.md and docs/specs/ROUTES.md are the real, mixed-case
// filenames in this repo (CLAUDE.md, docs/specs/CONTRACTS.md); relPath()
// keeps that real casing on POSIX, so a lowercase-literal `===` comparison
// matched only on win32, where relPath() itself lower-cases first, and this
// reminder never fired on Linux. Messages still use `rel` (real casing), not
// the folded key, so the spoken text names the file the way it is spelled.
const GROUPS = [
  {
    id: 'remind:data',
    test: (p) => p === 'data.js',
    message:
      'data.js changed. Run `node tools/build.js` before committing or tests/derived.js will fail. If counts or source lists changed, index.html, app/index.html, README.md, README.ru.md, app.js, llms.txt and robots.txt change with it.'
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
  const key = pathKey(rel);

  recordWrite(input.session_id, rel);

  for (const group of GROUPS) {
    if (!group.test(key)) continue;
    if (!once(input.session_id, group.id)) continue;
    const text = typeof group.message === 'function' ? group.message(rel) : group.message;
    return speak(event, text);
  }
  return undefined;
});
