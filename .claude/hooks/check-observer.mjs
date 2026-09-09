// PostToolUse(Bash): observes a real, successful `npm run check` and
// records its tree key, so bash-guard.mjs's commit gate has something to
// check against. Never blocks, never speaks - its only side effect is
// writing .check-cache.json. See issues/65/plan.md section 4, hook 3.
//
// The exit-code field name was confirmed against the official Claude Code
// hooks reference (docs.claude.com/en/docs/claude-code/hooks): `exit_code`.
// The candidate list below is kept anyway - it costs nothing and keeps the
// design correct even if a future host differs.

import { readInput, guard } from './lib.mjs';
import { treeKey, writeCache } from './tree-key.mjs';

// npm run check:built is `build && smoke && budget` and never runs the
// check suite; npm run check:fast skips format:check, npm run data,
// tests/derived.js and tests/i18n.js. Neither may satisfy the gate.
const CHECK_RE = /\bnpm\s+run\s+(?:-s\s+)?check(?![:\w-])/;

const FAILURE_MARKERS = [/npm error/i, /ELIFECYCLE/, /\bFAILED\b/, /Tests\s+\d+\s+failed/];

const EXIT_CODE_FIELDS = ['exit_code', 'exitCode', 'returnCode', 'code'];

function firstExitCode(toolResponse) {
  if (!toolResponse || typeof toolResponse !== 'object') return undefined;
  for (const field of EXIT_CODE_FIELDS) {
    if (typeof toolResponse[field] === 'number') return toolResponse[field];
  }
  return undefined;
}

guard(() => {
  const input = readInput();
  if (input.tool_name !== 'Bash') return undefined;
  const command =
    input.tool_input && typeof input.tool_input.command === 'string'
      ? input.tool_input.command
      : '';
  if (!CHECK_RE.test(command)) return undefined;
  if (input.tool_input && input.tool_input.run_in_background === true) return undefined;

  const response = input.tool_response || {};
  if (response.interrupted === true) return undefined;

  const exitCode = firstExitCode(response);
  if (exitCode !== undefined && exitCode !== 0) return undefined;

  const stdout = typeof response.stdout === 'string' ? response.stdout : '';
  const stderr = typeof response.stderr === 'string' ? response.stderr : '';
  const combined = stdout + stderr;

  if (!stdout.includes('All files')) return undefined;
  if (FAILURE_MARKERS.some((re) => re.test(combined))) return undefined;

  const key = treeKey();
  if (key === null) return undefined; // fail open: nothing to cache against

  writeCache(key);
  return undefined;
});
