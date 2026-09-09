// PreToolUse(Edit|MultiEdit|Write|NotebookEdit): block direct writes to
// generated files. See issues/65/plan.md section 4, hook 4.

import { readInput, guard, deny, relPath, pathKey } from './lib.mjs';

// Every test here runs against pathKey(rel), not rel itself: relPath() keeps
// real casing on POSIX, and a literal like 'data.json' must match regardless
// of how the caller happened to spell it - see pathKey()'s doc comment.
const DENY = [
  {
    test: (p) => p === 'data.json',
    message:
      'Blocked: data.json is generated from data.js. Edit data.js, then run `node tools/build.js`.'
  },
  {
    test: (p) => p === 'catalog.csv',
    message:
      'Blocked: catalog.csv is generated from data.js. Edit data.js, then run `node tools/build.js`.'
  },
  {
    test: (p) => p.startsWith('i/'),
    message:
      'Blocked: i/*.html are generated share stubs. Edit data.js, then run `node tools/build.js`.'
  },
  {
    test: (p) => p.startsWith('dist/'),
    message:
      'Blocked: dist/ is build output. Edit the source under app/src/ and run `npm run build`.'
  },
  {
    test: (p) => p === 'package-lock.json',
    message:
      'Blocked: package-lock.json is generated. Change package.json and run `npm install`.'
  }
];

guard(() => {
  const input = readInput();
  const event = input.hook_event_name || 'PreToolUse';
  const filePath = input.tool_input && input.tool_input.file_path;
  const rel = relPath(filePath, input.cwd);
  if (rel === null) return undefined;
  const key = pathKey(rel);

  for (const rule of DENY) {
    if (rule.test(key)) return deny(event, rule.message);
  }
  return undefined;
});
