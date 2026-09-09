// PostToolUse(Bash): observes a real, successful `npm run check` and
// records its tree key, so bash-guard.mjs's commit gate has something to
// check against. Never blocks, never speaks - its only side effect is
// writing .check-cache.json. See issues/65/plan.md section 4, hook 3.
//
// The exit-code field name was confirmed against the official Claude Code
// hooks reference (docs.claude.com/en/docs/claude-code/hooks): `exit_code`.
// The candidate list below is kept anyway - it costs nothing and keeps the
// design correct even if a future host differs.

import { readInput, guard, sanitize, segments, tokensOf, unwrap } from './lib.mjs';
import { treeKey, writeCache } from './tree-key.mjs';

// npm run check:built is `build && smoke && budget` and never runs the
// check suite; npm run check:fast skips format:check, npm run data,
// tests/derived.js and tests/i18n.js. Neither may satisfy the gate.
const CHECK_RE = /^npm\s+run\s+(?:-s\s+)?check(?![:\w-])/;

const FAILURE_MARKERS = [/npm error/i, /ELIFECYCLE/, /\bFAILED\b/, /Tests\s+\d+\s+failed/];

// 'status' and 'exitStatus' are not field names any host is known to use.
// They are listed so an unrecognised *numeric failure* field cannot read as
// "field absent, assume a pass". `exit_code` is the documented one.
const EXIT_CODE_FIELDS = [
  'exit_code',
  'exitCode',
  'returnCode',
  'code',
  'status',
  'exitStatus'
];

/**
 * True only when the observed stdout can actually have come from a real
 * `npm run check`. Matching the raw command let three shapes of false pass
 * through: `npm run check > o.txt 2>&1 || true; grep "All files" o.txt`
 * (the check failed; grep supplied the pass-shaped output),
 * `echo "npm run check says All files"`, and anything else that merely
 * mentions the command. So:
 *   - the command must not chain, background or command-substitute, because
 *     then the stdout may belong to some later segment;
 *   - the first segment must be the check invocation itself; and
 *   - that segment must not redirect stdout away, because then what the hook
 *     sees is by definition not the check's own output.
 * A pipeline is still allowed: `npm run check 2>&1 | tail -120` shows the
 * check's own stdout, and is the invocation .claude/README.md recommends.
 * So is a leading `cd <dir> &&`, which is habit rather than a second output
 * producer - cd writes nothing to stdout, so the check is still the only
 * thing that can have produced what the hook reads. (Found the hard way:
 * the first version of this rule rejected the very command that was meant
 * to satisfy the gate.)
 */
function isCheckInvocation(rawCommand) {
  let s = sanitize(rawCommand).replace(/\d?>&\d/g, ' ');
  for (let i = 0; i < 2; i++) s = s.replace(/^cd(\s+[^\s;&|]+)?\s*&&\s*/i, '');
  if (/&&|\|\||;|&|\n|\$\(|`/.test(s)) return false;
  const first = segments(s)[0];
  if (!first) return false;
  const tokens = unwrap(tokensOf(first));
  if (tokens.some((t) => /^\d?>>?/.test(t))) return false;
  return CHECK_RE.test(tokens.join(' '));
}

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
  if (!isCheckInvocation(command)) return undefined;
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
