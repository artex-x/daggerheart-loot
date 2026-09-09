// Feeds every hook real-shaped payloads and asserts exit code and JSON.
// Wired into `npm run check` (see package.json). Never touches this
// repository's tree or state: every hook spawn points LOOT_HOOK_ROOT and
// LOOT_HOOK_STATE_DIR at a throwaway git repo in the OS temp directory,
// built once and reused, removed in a finally.
//
// See issues/65/plan.md section 7 for the full case list this file
// implements (numbered #1-#58 in the comments below).

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const hooksDir = path.dirname(fileURLToPath(import.meta.url));

const ALL_SCRIPTS = [
  'lib.mjs',
  'tree-key.mjs',
  'session-start.mjs',
  'bash-guard.mjs',
  'check-observer.mjs',
  'edit-guard.mjs',
  'edit-followup.mjs',
  'session-stop.mjs'
];

let pass = 0;
let fail = 0;
const failures = [];

function check(label, cond, detail) {
  if (cond) {
    pass++;
  } else {
    fail++;
    failures.push(detail ? `${label}: ${detail}` : label);
  }
}

// ---------- scratch repo ----------

let scratchRoot;
let scratchState;

function gitSh(args, cwd = scratchRoot) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (r.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed (${r.status}): ${r.stderr}`);
  }
  return r.stdout;
}

function gitCommit(message, cwd = scratchRoot) {
  return gitSh(
    [
      '-c',
      'user.email=hooks-selftest@example.com',
      '-c',
      'user.name=hooks-selftest',
      'commit',
      '-q',
      '-m',
      message
    ],
    cwd
  );
}

function writeFile(rel, content) {
  const full = path.join(scratchRoot, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

function appendFile(rel, content) {
  fs.appendFileSync(path.join(scratchRoot, rel), content);
}

function cacheFilePath() {
  return path.join(scratchState, '.check-cache.json');
}

function clearCache() {
  fs.rmSync(cacheFilePath(), { force: true });
}

function setupScratch() {
  scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'loot-hooks-root-'));
  scratchState = fs.mkdtempSync(path.join(os.tmpdir(), 'loot-hooks-state-'));

  writeFile('README.md', '# scratch\n\nLicence: MIT.\n');
  writeFile('README.ru.md', '# scratch ru\n');
  writeFile('data.js', 'window.LOOT = [];\n');
  writeFile('data.json', '[]\n');
  writeFile('catalog.csv', 'id\n');
  writeFile('i/cc1.html', '<html></html>\n');
  writeFile('dist/index.html', '<html></html>\n');
  writeFile('package-lock.json', '{}\n');
  writeFile('index.html', '<html></html>\n');
  writeFile('app.js', 'console.log(1);\n');
  writeFile('style.css', 'body{}\n');
  writeFile('docs/specs/CONTRACTS.md', '# contracts\n');
  writeFile('docs/fixtures/lists/x.json', '{}\n');
  writeFile('tests/contracts.js', '// contracts test\n');
  writeFile('llms.txt', 'llms\n');
  writeFile('app/src/lib/x.ts', 'export const x = 1;\n');
  writeFile('issues/65/context.md', '# context\n');
  writeFile('issues/65/plan.md', '# plan\n');
  writeFile('issues/65/handoff.md', '# handoff\n');

  gitSh(['init', '-q']);
  gitSh(['add', '-A']);
  gitCommit('chore: scratch init');

  // handoff.md is deliberately old, so the staleness test (55) can rely on
  // "older than a written source file" without depending on wall-clock
  // ordering inside this one test run.
  const old = new Date('2020-01-01T00:00:00Z');
  fs.utimesSync(path.join(scratchRoot, 'issues/65/handoff.md'), old, old);

  // Two tracked files modified and left unstaged: the "2+ dirty paths"
  // baseline that the blanket-stage and Stop cases need something to see.
  appendFile('app/src/lib/x.ts', '// touched\n');
  appendFile('README.md', '\ntouched\n');
}

function teardownScratch() {
  for (const dir of [scratchRoot, scratchState]) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // best effort
    }
  }
}

// ---------- hook invocation ----------

function runHook(hookName, payload, opts = {}) {
  const hookPath = path.join(hooksDir, hookName);
  const input = payload === undefined ? '' : JSON.stringify(payload);
  const result = spawnSync(process.execPath, [hookPath], {
    input,
    encoding: 'utf8',
    env: {
      ...process.env,
      LOOT_HOOK_ROOT: opts.root !== undefined ? opts.root : scratchRoot,
      LOOT_HOOK_STATE_DIR: opts.state !== undefined ? opts.state : scratchState
    }
  });
  let json = {};
  const trimmed = (result.stdout || '').trim();
  if (trimmed) {
    try {
      json = JSON.parse(trimmed);
    } catch {
      json = { __parseError: true };
    }
  }
  return { status: result.status, stdout: result.stdout, stderr: result.stderr, json };
}

function isDeny(result) {
  return !!(
    result.json &&
    result.json.hookSpecificOutput &&
    result.json.hookSpecificOutput.permissionDecision === 'deny'
  );
}

function denyReason(result) {
  return (
    (result.json &&
      result.json.hookSpecificOutput &&
      result.json.hookSpecificOutput.permissionDecisionReason) ||
    ''
  );
}

function isSilent(result) {
  return result.status === 0 && !(result.stdout || '').trim();
}

function systemMessage(result) {
  return (result.json && result.json.systemMessage) || '';
}

function bashPayload(command, extra = {}) {
  return {
    session_id: extra.session_id || 's-bash',
    cwd: extra.cwd || scratchRoot,
    hook_event_name: 'PreToolUse',
    tool_name: 'Bash',
    tool_input: { command, run_in_background: extra.run_in_background === true },
    agent_id: 'a1',
    agent_type: 'implementer'
  };
}

function editPayload(filePath, extra = {}) {
  return {
    session_id: extra.session_id || 's-edit',
    cwd: extra.cwd || scratchRoot,
    hook_event_name: extra.event || 'PreToolUse',
    tool_name: extra.tool_name || 'Write',
    tool_input: { file_path: filePath },
    agent_id: 'a1',
    agent_type: 'implementer'
  };
}

// ---------- bash-guard.mjs: deny cases (#1-17) ----------

function testBashDenyCases() {
  const cases = [
    ['#1 git reset --hard', 'git reset --hard', 'discards every uncommitted change'],
    ['#2 whitespace collapse', 'git   reset   --hard HEAD~1', '--hard'],
    ['#3 git global options', 'git -C . reset --hard', '--hard'],
    ['#4 segmentation', 'npm test && git reset --hard', '--hard'],
    ['#5 git clean -fd', 'git clean -fd', null],
    ['#6 flag cluster -xdf', 'git clean -xdf', null],
    ['#7 git clean --force', 'git clean --force', null],
    ['#8 git push', 'git push', null],
    ['#9 git push --force-with-lease', 'git push --force-with-lease origin main', null],
    ['#10 git checkout --', 'git checkout -- app/src/lib/x.ts', null],
    ['#11 git restore', 'git restore app/src/lib/x.ts', null],
    ['#12 git stash drop', 'git stash drop', null],
    ['#13 rm -rf app', 'rm -rf app', null]
  ];
  for (const [label, command, fragment] of cases) {
    const result = runHook('bash-guard.mjs', bashPayload(command));
    check(`${label}: exit 0`, result.status === 0);
    check(`${label}: denies`, isDeny(result), JSON.stringify(result.json));
    if (fragment)
      check(
        `${label}: reason mentions "${fragment}"`,
        denyReason(result).includes(fragment),
        denyReason(result)
      );
  }
}

// ---------- bash-guard.mjs: silent cases (#18-25) ----------

function testBashSilentCases() {
  const cases = [
    ['#18 echo quoting', 'echo "git reset --hard"'],
    ['#19 grep quoting', "grep -rn 'git clean -fd' docs/"],
    ['#20 heredoc', "cat > x.md <<'EOF'\ngit reset --hard\nEOF"],
    ['#21 git clean -nd (dry-run)', 'git clean -nd'],
    ['#22 git push --dry-run', 'git push --dry-run'],
    ['#23 git restore --staged', 'git restore --staged app/src/lib/x.ts'],
    ['#24 rm -rf dist', 'rm -rf dist'],
    ['#25 git add named file', 'git add app/src/lib/x.ts']
  ];
  for (const [label, command] of cases) {
    const result = runHook('bash-guard.mjs', bashPayload(command));
    check(`${label}: exit 0`, result.status === 0);
    check(`${label}: silent`, isSilent(result), result.stdout);
  }
}

// ---------- bash-guard.mjs: blanket staging (#14-15) ----------

function testBlanketStaging() {
  {
    const result = runHook('bash-guard.mjs', bashPayload('git add -A'));
    check('#14 git add -A: denies', isDeny(result));
    check(
      '#14 git add -A: reason',
      denyReason(result).includes('Stage the files this batch touched'),
      denyReason(result)
    );
  }
  {
    const result = runHook('bash-guard.mjs', bashPayload('git commit -a -m "x"'));
    check('#15 git commit -a: denies', isDeny(result));
  }
}

// ---------- bash-guard.mjs: commit attribution (#16) ----------

function testCommitAttribution() {
  const result = runHook(
    'bash-guard.mjs',
    bashPayload('git commit -m "fix: x" -m "Co-Authored-By: Claude <n@a.com>"')
  );
  check('#16 attribution: denies', isDeny(result));
  check(
    '#16 attribution: reason',
    denyReason(result).includes('AI attribution'),
    denyReason(result)
  );
}

// ---------- bash-guard.mjs: commit gate (#17, 26, 27, 28) ----------
// Implemented as testCommitGateAsync() below, since it needs to import
// tree-key.mjs directly to compute an independent key for #27.

async function importTreeKey() {
  const mod = await import(pathToFileUrlHref('tree-key.mjs'));
  return mod;
}

function pathToFileUrlHref(name) {
  return new URL(`./${name}?t=${Date.now()}`, import.meta.url).href;
}

// ---------- bash-guard.mjs: long-check reminder (#29-30) ----------

function testLongCheck() {
  const session = 's-longcheck';
  {
    const result = runHook(
      'bash-guard.mjs',
      bashPayload('npm run check', { session_id: session })
    );
    check(
      '#29 long-check: first fire',
      systemMessage(result).includes('stay in this turn'),
      systemMessage(result)
    );
  }
  {
    const result = runHook(
      'bash-guard.mjs',
      bashPayload('npm run check', { session_id: session })
    );
    check('#30 long-check: once per session', isSilent(result), result.stdout);
  }
}

// ---------- edit-guard.mjs (#31-39) ----------

function testEditGuard() {
  const denyCases = [
    ['#31 data.json', path.join(scratchRoot, 'data.json'), 'node tools/build.js'],
    ['#32 catalog.csv', path.join(scratchRoot, 'catalog.csv'), null],
    ['#33 i/cc1.html', path.join(scratchRoot, 'i', 'cc1.html'), null],
    ['#34 dist/index.html', path.join(scratchRoot, 'dist', 'index.html'), 'npm run build'],
    ['#35 package-lock.json', path.join(scratchRoot, 'package-lock.json'), 'npm install']
  ];
  for (const [label, filePath, fragment] of denyCases) {
    const result = runHook('edit-guard.mjs', editPayload(filePath));
    check(`${label}: denies`, isDeny(result));
    if (fragment)
      check(`${label}: reason`, denyReason(result).includes(fragment), denyReason(result));
  }

  // #36 - Windows normalisation: backslashes and an upper-case drive letter
  const upperDrive = scratchRoot
    .replace(/^([a-z]):/i, (m, d) => `${d.toUpperCase()}:`)
    .replace(/\//g, '\\');
  const windowsPath = `${upperDrive}\\data.json`;
  {
    const result = runHook('edit-guard.mjs', editPayload(windowsPath));
    check('#36 Windows-normalised path: denies', isDeny(result));
  }

  const silentCases = [
    ['#37 data.js', path.join(scratchRoot, 'data.js')],
    ['#38 docs/fixtures', path.join(scratchRoot, 'docs', 'fixtures', 'lists', 'x.json')],
    ['#39 outside repo', path.join(os.tmpdir(), 'elsewhere.txt')]
  ];
  for (const [label, filePath] of silentCases) {
    const result = runHook('edit-guard.mjs', editPayload(filePath));
    check(`${label}: silent`, isSilent(result), result.stdout);
  }
}

// ---------- edit-followup.mjs (#40-44) ----------

function testEditFollowup() {
  const session = 's-followup';

  {
    const result = runHook(
      'edit-followup.mjs',
      editPayload(path.join(scratchRoot, 'data.js'), {
        session_id: session,
        event: 'PostToolUse'
      })
    );
    check(
      '#40 data.js reminder',
      systemMessage(result).includes('node tools/build.js'),
      systemMessage(result)
    );
  }
  {
    const result = runHook(
      'edit-followup.mjs',
      editPayload(path.join(scratchRoot, 'data.js'), {
        session_id: session,
        event: 'PostToolUse'
      })
    );
    check('#41 data.js reminder once per session', isSilent(result), result.stdout);
  }
  {
    const result = runHook(
      'edit-followup.mjs',
      editPayload(path.join(scratchRoot, 'docs', 'specs', 'CONTRACTS.md'), {
        session_id: session,
        event: 'PostToolUse'
      })
    );
    check(
      '#42 contract reminder',
      systemMessage(result).includes('docs/fixtures/'),
      systemMessage(result)
    );
  }
  {
    const result = runHook(
      'edit-followup.mjs',
      editPayload(path.join(scratchRoot, 'index.html'), {
        session_id: session,
        event: 'PostToolUse'
      })
    );
    check(
      '#43 baseline reminder',
      systemMessage(result).includes('parity baseline'),
      systemMessage(result)
    );
  }
  {
    const result = runHook(
      'edit-followup.mjs',
      editPayload(path.join(scratchRoot, 'app', 'src', 'lib', 'x.ts'), {
        session_id: session,
        event: 'PostToolUse'
      })
    );
    check('#44 unremarkable write: silent', isSilent(result), result.stdout);
    const stateRaw = fs.readFileSync(path.join(scratchState, '.hook-state.json'), 'utf8');
    const state = JSON.parse(stateRaw);
    check(
      '#44 write recorded',
      Boolean(state.sessions[session] && state.sessions[session].wrote['app/src/lib/x.ts'])
    );
  }
}

// ---------- check-observer.mjs (#45-49) ----------

async function testCheckObserver() {
  clearCache();
  const passingResponse = {
    exit_code: 0,
    stdout: 'some output\nAll files                    |   95 |\n',
    stderr: '',
    interrupted: false
  };

  {
    const payload = {
      session_id: 's-observer',
      cwd: scratchRoot,
      hook_event_name: 'PostToolUse',
      tool_name: 'Bash',
      tool_input: { command: 'npm run check', run_in_background: false },
      tool_response: passingResponse
    };
    const result = runHook('check-observer.mjs', payload);
    check('#45 check-observer: exit 0', result.status === 0);
    const cacheRaw = fs.readFileSync(cacheFilePath(), 'utf8');
    const cache = JSON.parse(cacheRaw);
    const mod = await importTreeKey();
    process.env.LOOT_HOOK_ROOT = scratchRoot;
    process.env.LOOT_HOOK_STATE_DIR = scratchState;
    const expectedKey = mod.treeKey();
    check(
      '#45 check-observer: cache key matches independent computation',
      cache.key === expectedKey,
      `${cache.key} vs ${expectedKey}`
    );
  }

  clearCache();
  {
    const payload = {
      session_id: 's-observer',
      cwd: scratchRoot,
      hook_event_name: 'PostToolUse',
      tool_name: 'Bash',
      tool_input: { command: 'npm run check', run_in_background: false },
      tool_response: {
        exit_code: 1,
        stdout: 'All files\n2 FAILED\n',
        stderr: '',
        interrupted: false
      }
    };
    runHook('check-observer.mjs', payload);
    check('#46 failure markers: no cache written', !fs.existsSync(cacheFilePath()));
  }

  clearCache();
  {
    const payload = {
      session_id: 's-observer',
      cwd: scratchRoot,
      hook_event_name: 'PostToolUse',
      tool_name: 'Bash',
      tool_input: { command: 'npm run check', run_in_background: true },
      tool_response: passingResponse
    };
    runHook('check-observer.mjs', payload);
    check('#47 run_in_background: no cache written', !fs.existsSync(cacheFilePath()));
  }

  clearCache();
  {
    const payload = {
      session_id: 's-observer',
      cwd: scratchRoot,
      hook_event_name: 'PostToolUse',
      tool_name: 'Bash',
      tool_input: { command: 'npm run check:built', run_in_background: false },
      tool_response: passingResponse
    };
    runHook('check-observer.mjs', payload);
    check('#48 check:built: no cache written', !fs.existsSync(cacheFilePath()));
  }

  clearCache();
  {
    const payload = {
      session_id: 's-observer',
      cwd: scratchRoot,
      hook_event_name: 'PostToolUse',
      tool_name: 'Bash',
      tool_input: { command: 'npm run check:fast', run_in_background: false },
      tool_response: passingResponse
    };
    runHook('check-observer.mjs', payload);
    check('#49 check:fast: no cache written', !fs.existsSync(cacheFilePath()));
  }
  clearCache();
}

// ---------- session-start.mjs (#50) ----------

function testSessionStart() {
  const payload = {
    session_id: 's-start',
    cwd: scratchRoot,
    hook_event_name: 'SessionStart',
    source: 'startup'
  };
  const result = runHook('session-start.mjs', payload);
  check('#50 session-start: exit 0', result.status === 0);
  const ctx =
    (result.json.hookSpecificOutput && result.json.hookSpecificOutput.additionalContext) || '';
  check('#50 session-start: names the branch', /Repo: branch/.test(ctx), ctx);
  check(
    '#50 session-start: names the dirty count',
    /Working tree: \d+ changed paths/.test(ctx),
    ctx
  );
}

// ---------- session-stop.mjs (#51-55) ----------

async function testSessionStop() {
  const { recordWrite } = await import(pathToFileUrlHref('lib.mjs'));
  process.env.LOOT_HOOK_ROOT = scratchRoot;
  process.env.LOOT_HOOK_STATE_DIR = scratchState;

  // #51 - stop_hook_active guards against any loop
  {
    const result = runHook('session-stop.mjs', {
      session_id: 's-stop-active',
      cwd: scratchRoot,
      hook_event_name: 'Stop',
      stop_hook_active: true
    });
    check('#51 stop_hook_active: silent', isSilent(result), result.stdout);
  }

  // #55 - handoff.md older than a written source file -> staleness sentence
  {
    const session = 's-stop-stale';
    recordWrite(session, 'app/src/lib/x.ts');
    const result = runHook('session-stop.mjs', {
      session_id: session,
      cwd: scratchRoot,
      hook_event_name: 'Stop',
      stop_hook_active: false
    });
    check(
      '#55 staleness: message present',
      systemMessage(result).includes('handoff.md is older'),
      systemMessage(result)
    );
  }

  // #52 - a wrote entry that is still dirty -> systemMessage names the path
  const stopSession = 's-stop-dirty';
  recordWrite(stopSession, 'app/src/lib/x.ts');
  {
    const result = runHook('session-stop.mjs', {
      session_id: stopSession,
      cwd: scratchRoot,
      hook_event_name: 'Stop',
      stop_hook_active: false
    });
    check(
      '#52 uncommitted work: names the path',
      systemMessage(result).includes('app/src/lib/x.ts'),
      systemMessage(result)
    );

    // #53 - the same state again -> silent (once per path set)
    const second = runHook('session-stop.mjs', {
      session_id: stopSession,
      cwd: scratchRoot,
      hook_event_name: 'Stop',
      stop_hook_active: false
    });
    check('#53 repeat with unchanged state: silent', isSilent(second), second.stdout);
  }

  // #54 - active task with no handoff.md -> no staleness sentence
  {
    writeFile('issues/99/context.md', '# no handoff here\n');
    const session = 's-stop-nohandoff';
    recordWrite(session, 'app/src/lib/x.ts');
    const result = runHook('session-stop.mjs', {
      session_id: session,
      cwd: scratchRoot,
      hook_event_name: 'Stop',
      stop_hook_active: false
    });
    check(
      '#54 no handoff.md: no staleness sentence',
      !systemMessage(result).includes('handoff.md is older'),
      systemMessage(result)
    );
  }
}

// ---------- fail-open contract, all eight scripts (#56-58) ----------

function testFailOpen() {
  const stdins = [
    ['#56 empty stdin', undefined],
    ['#57 {} stdin', {}],
    ['#58 not-json stdin', '__RAW__not json']
  ];
  for (const script of ALL_SCRIPTS) {
    for (const [label, payload] of stdins) {
      const hookPath = path.join(hooksDir, script);
      const input =
        payload === '__RAW__not json'
          ? 'not json'
          : payload === undefined
            ? ''
            : JSON.stringify(payload);
      const result = spawnSync(process.execPath, [hookPath], {
        input,
        encoding: 'utf8',
        env: { ...process.env, LOOT_HOOK_ROOT: scratchRoot, LOOT_HOOK_STATE_DIR: scratchState }
      });
      check(
        `${script} ${label}: exit 0`,
        result.status === 0,
        `status=${result.status} stderr=${result.stderr}`
      );
      // session-start.mjs is the one deliberate exception: its report comes
      // entirely from git and the issues/ scan, never from the hook's own
      // stdin payload, so it still speaks on malformed input as long as the
      // scratch repo itself is readable. The fail-open contract it owes is
      // "never crash, never touch anything on bad input" - proven here by
      // exit 0 and, when it does speak, well-formed JSON - not silence.
      if (script === 'session-start.mjs') {
        const trimmed = (result.stdout || '').trim();
        const parses =
          !trimmed ||
          (() => {
            try {
              JSON.parse(trimmed);
              return true;
            } catch {
              return false;
            }
          })();
        check(`${script} ${label}: well-formed or silent`, parses, result.stdout);
      } else {
        check(`${script} ${label}: no stdout`, !(result.stdout || '').trim(), result.stdout);
      }
    }
  }
}

// ---------- run ----------

async function main() {
  setupScratch();
  try {
    testBashDenyCases();
    testBashSilentCases();
    testBlanketStaging();
    testCommitAttribution();
    await testCommitGateAsync();
    testLongCheck();
    testEditGuard();
    testEditFollowup();
    await testCheckObserver();
    testSessionStart();
    await testSessionStop();
    testFailOpen();
  } finally {
    teardownScratch();
  }

  if (fail > 0) {
    console.error(`\n.claude/hooks/selftest.mjs: ${pass} passed, ${fail} FAILED\n`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log(`.claude/hooks/selftest.mjs: ${pass} passed, 0 failed`);
}

async function testCommitGateAsync() {
  clearCache();

  gitSh(['add', 'app/src/lib/x.ts']);
  {
    const result = runHook('bash-guard.mjs', bashPayload('git commit -m "chore: x"'));
    check('#17 gate: denies', isDeny(result));
    check(
      '#17 gate: reason',
      denyReason(result).includes('has not passed for this working tree'),
      denyReason(result)
    );
  }

  process.env.LOOT_HOOK_ROOT = scratchRoot;
  process.env.LOOT_HOOK_STATE_DIR = scratchState;
  const { treeKey, writeCache } = await importTreeKey();
  const key = treeKey();
  check('#27 setup: tree key computed', typeof key === 'string' && key.length > 0, String(key));
  writeCache(key);
  {
    const result = runHook('bash-guard.mjs', bashPayload('git commit -m "chore: x"'));
    check('#27 gate: silent once cached', isSilent(result), result.stdout);
  }

  gitSh(['reset']);
  appendFile('issues/65/plan.md', '\nmore plan\n');
  gitSh(['add', 'issues/65/plan.md']);
  {
    const result = runHook('bash-guard.mjs', bashPayload('git commit -m "docs: plan"'));
    check('#26 gate: exempt path silent', isSilent(result), result.stdout);
  }

  gitSh(['reset']);
  clearCache();
  gitSh(['add', 'app/src/lib/x.ts']);
  {
    const result = runHook(
      'bash-guard.mjs',
      bashPayload('SKIP_CHECK_GATE=1 git commit -m "chore: x"')
    );
    check('#28 gate bypass: not denied', !isDeny(result));
    check(
      '#28 gate bypass: message',
      systemMessage(result).includes('bypassed'),
      systemMessage(result)
    );
  }

  gitSh(['reset']);
  clearCache();
}

main();
