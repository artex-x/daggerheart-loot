// PreToolUse(Read|Grep): "The Read and Grep tools are denied .env files by a
// hook, not only by settings" (docs/decisions/, 2026-09-27). A `./` pattern
// in permissions.deny binds the session's working directory: probed
// 2026-09-27, a worktree session's Read of the main checkout's .env file by
// its absolute path passed. This hook judges the last path segment of
// `file_path`, `path` and `glob`, wherever the file is. A Grep by pattern over
// a directory is not judged. No git, no file system read.

import { readInput, guard, deny } from './lib.mjs';

const TOOLS = new Set(['Read', 'Grep']);
const FIELDS = ['file_path', 'path', 'glob'];

function namesEnvFile(value) {
  const segments = value.replace(/\\/g, '/').replace(/\/+$/, '').split('/');
  return /^\.env/i.test(segments[segments.length - 1]);
}

const message = (value) =>
  `Blocked: ${value} names a .env file; an agent never reads one into the transcript, from any checkout (docs/decisions/, 2026-09-27, "The Read and Grep tools are denied .env files by a hook, not only by settings"). A script gets its values from node --env-file=<file> <script> (npm run e2e already does).`;

guard(() => {
  const input = readInput();
  const event = input.hook_event_name || 'PreToolUse';
  const ti = input.tool_input;
  if (!TOOLS.has(input.tool_name) || !ti || typeof ti !== 'object') return undefined;
  for (const field of FIELDS) {
    const value = ti[field];
    if (typeof value === 'string' && value && namesEnvFile(value)) {
      return deny(event, message(value));
    }
  }
  return undefined;
});
