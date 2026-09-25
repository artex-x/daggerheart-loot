// PostToolUse(Bash|PowerShell): observes a real `npm run check` (Bash only)
// or `npm run check:db` (either tool), records its tree key when it passed -
// so bash-guard.mjs's commit gates have something to check against - and
// states the verdict in one line either way. Never blocks.
// See .claude/README.md, "Hooks".
//
// It speaks because the verdict was measurably not obvious. Across 65
// session transcripts (2026-09-18), 61 of 71 check invocations were piped
// into `tail`, which hands the Bash tool `tail`'s exit status rather than
// the check's, so a failed run read as a passing one; workers then spent a
// second run, or an `echo $?` that reported the echo's own status, learning
// what they had already run. bash-guard.mjs rule 2k now denies that shape,
// and this line removes the remaining inference: the hook already knows the
// failure markers and whether the gate armed, so saying so costs one line
// and saves a ~165s re-run. It states, never instructs - the arming
// decision below is unchanged and just as strict.
//
// Two host facts, both probed live on this Windows desktop build
// (2026-09-18), that decide how much this line can carry:
//
//   1. No exit-code field reaches the hook at all. A successful Bash call
//      arrives as `{stdout, stderr, interrupted, isImage, noOutputExpected}`
//      - `exit_code` is absent, whatever the docs list. So `firstExitCode`
//      returns undefined here and the ` (exit n)` suffix stays empty; the
//      pass/fail split rests on the stdout markers. The field list below is
//      kept for hosts that do send one.
//   2. On a failed Bash call this hook does not speak. The tool result
//      comes back as a plain string (`"Exit code 1\n..."`) rather than the
//      object above, and no verdict line appeared from a check deliberately
//      failed at its prettier stage. That costs nothing: a failure already
//      announces itself as `Exit code 1` on the result's first line. The
//      FAIL branch below is for a host that does deliver it, and for the
//      real case that reaches here - a run that exits 0 while printing
//      failure markers.
//
// The exit-code field name was confirmed against the official Claude Code
// hooks reference (docs.claude.com/en/docs/claude-code/hooks): `exit_code`.
// The candidate list below is kept anyway - it costs nothing and keeps the
// design correct even if a future host differs.

import {
  readInput,
  guard,
  speak,
  sanitize,
  segments,
  tokensOf,
  unwrap,
  normalizeCommand,
  CHECK_INVOCATION_RE,
  CHECK_DB_INVOCATION_RE
} from './lib.mjs';
import { treeKey, writeCache } from './tree-key.mjs';

const EVENT = 'PostToolUse';

const FAILURE_MARKERS = [/npm error/i, /ELIFECYCLE/, /\bFAILED\b/, /Tests\s+\d+\s+failed/];

// vitest's `text-summary` coverage block, the last thing a passing check
// prints: its banner and its `Lines` row.
const COVERAGE_SUMMARY_RE = /^=+ Coverage summary =+\s*$/m;
const COVERAGE_LINES_RE = /^Lines\s*:\s*[\d.]+%/m;

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
 * through: `npm run check > o.txt 2>&1 || true; grep "Coverage summary" o.txt`
 * (the check failed; grep supplied the pass-shaped output),
 * `echo "npm run check says Coverage summary"`, and anything else that merely
 * mentions the command. So:
 *   - the command must not chain, background or command-substitute, because
 *     then the stdout may belong to some later segment;
 *   - the first segment must be the check invocation itself; and
 *   - that segment must not redirect stdout away, because then what the hook
 *     sees is by definition not the check's own output.
 * A pipeline is still allowed: `set -o pipefail; npm run check 2>&1 | tail -n 120`
 * shows the check's own stdout, and is the invocation .claude/README.md
 * recommends. So is a leading `cd <dir> &&`, which is habit rather than a second output
 * producer - cd writes nothing to stdout, so the check is still the only
 * thing that can have produced what the hook reads. A leading
 * `set -o pipefail;` is accepted for the same reason and is the recommended
 * prefix: without it the pipeline's
 * status is `tail`'s, the Bash tool prints no exit line for a failed check,
 * and a worker re-runs the check to learn what it already ran - measured
 * twelve times across five sessions (`.claude/README.md`, "Candidates
 * considered", row 30). With it `exit_code` is the check's and the non-zero
 * test below refuses to arm. Accepting the prefix cannot weaken the gate: a
 * forger who omits it is where the gate stood before.
 *
 * A leading `rtk ` needs no stripping here at all - RTK's own PreToolUse
 * hook rewrites a bare `npm run check` into `rtk npm run check` before
 * this hook (or any other) ever sees the command (verified live by a
 * probe that logged `cat package.json` arriving here as `rtk read
 * package.json`), and `CHECK_INVOCATION_RE` (lib.mjs) already tolerates
 * exactly one leading `rtk ` on its own, on whatever the final segment
 * turns out to be. Do not strip `rtk ` in the loop above too: doing so
 * lets `rtk rtk npm run check` arm this hook while `CHECK_INVOCATION_RE`
 * used directly (bash-guard.mjs's gate and `LONG_CHECKS`, neither of which
 * pre-strips) still refuses that doubled string - the observer would then
 * arm on a command the gate itself denies.
 */
function isCheckInvocation(rawCommand, invocationRe) {
  let s = sanitize(rawCommand).replace(/\d?>&\d/g, ' ');
  // `cd <dir> &&` (`cd <dir>;` in PowerShell 5.1, which has no `&&`) and
  // `set -o pipefail;` are habit and hygiene, not output producers: neither
  // writes to stdout, so the check is still the only thing that can have
  // produced what this hook reads. Exactly those tokens, at the start, in
  // either order; `set -eo pipefail`, `set -x` or anything else between
  // them and the check leaves a separator behind and is refused below.
  for (let i = 0; i < 3; i++) {
    s = s.replace(/^cd(\s+[^\s;&|]+)?\s*(?:&&|;)\s*/i, '');
    s = s.replace(/^set -o pipefail\s*(?:;|&&)\s*/, '');
  }
  if (/&&|\|\||;|&|\n|\$\(|`/.test(s)) return false;
  const first = segments(s)[0];
  if (!first) return false;
  const tokens = unwrap(tokensOf(first));
  if (tokens.some((t) => /^\d?>>?/.test(t))) return false;
  return invocationRe.test(tokens.join(' '));
}

function firstExitCode(toolResponse) {
  if (!toolResponse || typeof toolResponse !== 'object') return undefined;
  for (const field of EXIT_CODE_FIELDS) {
    if (typeof toolResponse[field] === 'number') return toolResponse[field];
  }
  return undefined;
}

/** The text a tool call printed. A Bash result carries `stdout` and
 * `stderr`; for the PowerShell result the text is taken from `stdout`,
 * else `output`, else a plain string, so either shape reaches the markers. */
function responseText(response) {
  if (typeof response === 'string') return response;
  if (!response || typeof response !== 'object') return '';
  let out = '';
  if (typeof response.stdout === 'string') out = response.stdout;
  else if (typeof response.output === 'string') out = response.output;
  if (typeof response.stderr === 'string') out += response.stderr;
  return out;
}

function observeCheckDb(response) {
  if (response && typeof response === 'object' && response.interrupted === true)
    return undefined;
  const exitCode = firstExitCode(response);
  const text = responseText(response);
  const code = exitCode === undefined ? '' : ` (exit ${exitCode})`;
  if (
    (exitCode !== undefined && exitCode !== 0) ||
    /^check:db: FAIL\s*$/m.test(text) ||
    FAILURE_MARKERS.some((re) => re.test(text))
  ) {
    return speak(
      EVENT,
      `npm run check:db: FAIL${code}. The commit gate for supabase/ and tests/db/ is not armed - fix the failure above and run \`npm run check:db\` again.`
    );
  }
  if (!/^check:db: PASS\s*$/m.test(text)) {
    return speak(
      EVENT,
      `npm run check:db: no failure seen${code}, but its final PASS line never reached this hook, so the run cannot be attributed and the commit gate for supabase/ and tests/db/ is not armed. Run it plainly in the foreground, with no pipe and no redirect.`
    );
  }
  const key = treeKey();
  if (key === null) return undefined; // fail open: nothing to cache against
  writeCache(key, '.check-db-cache.json', 'npm run check:db');
  return speak(
    EVENT,
    `npm run check:db: PASS${code}. Commit gate armed for supabase/ and tests/db/.`
  );
}

guard(() => {
  const input = readInput();
  const tool = input.tool_name;
  if (tool !== 'Bash' && tool !== 'PowerShell') return undefined;
  const command = normalizeCommand(
    tool,
    input.tool_input && typeof input.tool_input.command === 'string'
      ? input.tool_input.command
      : ''
  );
  if (input.tool_input && input.tool_input.run_in_background === true) return undefined;

  if (isCheckInvocation(command, CHECK_DB_INVOCATION_RE)) {
    return observeCheckDb(input.tool_response);
  }
  // `npm run check` arms from Bash only: its attribution rests on the Bash
  // result shape measured in the header above.
  if (tool !== 'Bash' || !isCheckInvocation(command, CHECK_INVOCATION_RE)) return undefined;

  const response = input.tool_response || {};
  if (response.interrupted === true) return undefined;

  const exitCode = firstExitCode(response);
  const stdout = typeof response.stdout === 'string' ? response.stdout : '';
  const stderr = typeof response.stderr === 'string' ? response.stderr : '';
  const combined = stdout + stderr;
  // Only ever appended, so a host that reports no exit code at all says
  // nothing about one rather than inventing a number.
  const code = exitCode === undefined ? '' : ` (exit ${exitCode})`;

  if (
    (exitCode !== undefined && exitCode !== 0) ||
    FAILURE_MARKERS.some((re) => re.test(combined))
  ) {
    return speak(
      EVENT,
      `npm run check: FAIL${code}. The commit gate is not armed - fix the failure above and run \`rtk npm run check\` again.`
    );
  }

  if (!COVERAGE_SUMMARY_RE.test(stdout) || !COVERAGE_LINES_RE.test(stdout)) {
    return speak(
      EVENT,
      `npm run check: no failure seen${code}, but its coverage summary never reached this hook, so the run cannot be attributed and the commit gate is not armed. Run it plainly - \`rtk npm run check\`, no pipe and no redirect.`
    );
  }

  const key = treeKey();
  if (key === null) return undefined; // fail open: nothing to cache against

  writeCache(key);
  return speak(
    EVENT,
    `npm run check: PASS${code}. Commit gate armed for this tree - it stays armed until a covered file changes.`
  );
});
