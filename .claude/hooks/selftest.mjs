// Feeds every hook real-shaped payloads and asserts exit code and JSON.
// Wired into `npm run check` (see package.json). Never touches this
// repository's tree or state: every hook spawn points LOOT_HOOK_ROOT and
// LOOT_HOOK_STATE_DIR at a throwaway git repo in the OS temp directory,
// built once and reused, removed in a finally.
//
// See .claude/README.md, "Hooks", which documents this file's own case
// numbering inline (numbered #1 upward in the comments below).

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

/** This file runs inside `npm run check`, so a box without git must skip,
 * not fail the whole gate. Every case below needs a real git repository. */
function gitAvailable() {
  try {
    const r = spawnSync('git', ['--version'], { encoding: 'utf8' });
    return !r.error && r.status === 0;
  } catch {
    return false;
  }
}

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
  writeFile('docs/specs/CONTRACTS.md', '# contracts\n');
  writeFile('docs/fixtures/lists/x.json', '{}\n');
  writeFile('tests/contracts.js', '// contracts test\n');
  writeFile('llms.txt', 'llms\n');
  writeFile('app/src/lib/x.ts', 'export const x = 1;\n');
  // Mixed case on purpose: the Stop hook's record->match chain has to survive
  // relPath()'s win32 case folding (case #60).
  writeFile('app/src/components/PageHead.svelte', '<h1>x</h1>\n');
  writeFile('tests/app/snapshots/x_state.txt', '# x_state\n');
  // Near-misses for edit-guard's deny list, none of which may deny (#39a).
  writeFile('app/data.json', '{}\n');
  writeFile('docs/i/x.html', '<html></html>\n');
  writeFile('input/x.html', '<html></html>\n');
  writeFile('app/dist/x.html', '<html></html>\n');
  writeFile('tests/app/snapshot.txt', '# not inside snapshots/\n');
  writeFile('tests/app-snapshots/x.txt', '# not tests/app/snapshots/\n');
  writeFile('issues/orphan-demo/context.md', '# context\n');
  writeFile('issues/orphan-demo/plan.md', '# plan\n');
  writeFile('issues/orphan-demo/handoff.md', '# handoff\n');
  // A committed file citing issues/orphan-demo/plan.md, for the orphan-task rule
  // (#102-#104): it stays clean throughout, so no dirty-path count moves.
  writeFile('tools/cites-plan.js', '// See issues/orphan-demo/plan.md section 4.\n');

  gitSh(['init', '-q']);
  gitSh(['add', '-A']);
  gitCommit('chore: scratch init');

  // handoff.md is deliberately old, so the staleness test (55) can rely on
  // "older than a written source file" without depending on wall-clock
  // ordering inside this one test run.
  const old = new Date('2020-01-01T00:00:00Z');
  fs.utimesSync(path.join(scratchRoot, 'issues/orphan-demo/handoff.md'), old, old);

  // Two tracked files modified and left unstaged: the "2+ dirty paths"
  // baseline that the blanket-stage and Stop cases need something to see.
  appendFile('app/src/lib/x.ts', '// touched\n');
  appendFile('README.md', '\ntouched\n');
  appendFile('app/src/components/PageHead.svelte', '<p>touched</p>\n');
}

/** Restore the "several tracked files modified, nothing staged" baseline the
 * later cases assume, after a sub-case has had to commit the tree clean. */
function dirtyBaseline() {
  appendFile('app/src/lib/x.ts', '// touched again\n');
  appendFile('README.md', '\ntouched again\n');
  appendFile('app/src/components/PageHead.svelte', '<p>touched again</p>\n');
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
    [
      '#8 git push --force',
      'git push --force origin main',
      'rewrites history the remote already has'
    ],
    ['#9 git push -f cluster', 'git push -f origin main', 'force-with-lease'],
    // #22b - every force form is denied, including a lease that would have
    // refused to clobber a moved ref.
    [
      '#22b git push --force-with-lease',
      'git push --force-with-lease origin main',
      'force-with-lease'
    ],
    [
      '#177 git push --force-if-includes',
      'git push --force-if-includes origin main',
      'force-if-includes'
    ],
    [
      '#178 git push +refspec',
      'git push origin +main',
      'rewrites history the remote already has'
    ],
    ['#10 git checkout --', 'git checkout -- app/src/lib/x.ts', null],
    ['#11 git restore', 'git restore app/src/lib/x.ts', null],
    ['#12 git stash drop', 'git stash drop', null],
    ['#13 rm -rf app', 'rm -rf app', null],
    // Regression guards for the four reviewer blockers and the sanitiser
    // gaps found with them. Each of these was probed as ALLOWED before.
    ['#13a rm -rf . (repo root)', 'rm -rf .', 'rm -r'],
    ['#13b rm -rf ./ (repo root)', 'rm -rf ./', 'rm -r'],
    ['#13c env wrapper', 'env git reset --hard', '--hard'],
    ['#13d quoted flag', 'git reset "--hard"', '--hard'],
    ['#13e command after a heredoc', 'cat <<EOF\nbody\nEOF\ngit reset --hard', '--hard'],
    [
      '#13f command on a later line',
      'npm test\ngit push --force',
      'rewrites history the remote already has'
    ],
    ['#13g wrapper + quoted flag', 'command git clean "-fd"', 'deletes untracked files'],
    [
      'TL5 git restore --staged --worktree',
      'git restore --staged --worktree app/src/lib/x.ts',
      null
    ],
    ['TL6 rm -r app (no -f)', 'rm -r app', 'rm -r']
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
    // `-n` moved to 2j's deny (#112); this case keeps `-r` only so it still
    // proves the quoted-command shape stays silent under `grep -rn`'s parent
    // rule (2b's git-clean detection reading inside a reader's argument).
    ['#19 grep quoting', "grep -r 'git clean -fd' docs/"],
    ['#20 heredoc', "cat > x.md <<'EOF'\ngit reset --hard\nEOF"],
    ['#21 git clean -nd (dry-run)', 'git clean -nd'],
    ['#22 git push --dry-run', 'git push --dry-run'],
    // Pushing is the agent's to do now; #22b moved to the deny list -
    // every force form is denied.
    ['#22a git push', 'git push'],
    ['#22c git push --force --dry-run', 'git push --force --dry-run'],
    ['#23 git restore --staged', 'git restore --staged app/src/lib/x.ts'],
    ['#24 rm -rf dist', 'rm -rf dist'],
    ['#25 git add named file', 'git add app/src/lib/x.ts'],
    // The quote stripper now preserves a quoted span that is one inert word,
    // so a flag cannot hide in quotes. A span with a space or a shell
    // metacharacter in it still vanishes, and so cannot invent a segment.
    [
      '#25a message naming a blocked command',
      'git commit -m "docs: warn about git reset --hard"'
    ],
    ['#25b message with a semicolon', 'git commit -m "chore: a; then b"'],
    ['#25c rm -rf outside the repo', 'rm -rf /tmp/elsewhere'],
    ['#25d rm -rf node_modules', 'rm -rf node_modules'],
    ['TL6c rm -r dist', 'rm -r dist'],
    ['TL6d rm -r i', 'rm -r i']
  ];
  for (const [label, command] of cases) {
    const result = runHook('bash-guard.mjs', bashPayload(command));
    check(`${label}: exit 0`, result.status === 0);
    check(`${label}: silent`, isSilent(result), result.stdout);
  }
}

// ---------- bash-guard.mjs: rule 2i, orphan task-directory citation (#102-#107, #172-#186) ----------

function testOrphanPlan() {
  const target = 'issues/orphan-demo/plan.md';
  const citingFile = path.join(scratchRoot, 'tools', 'cites-plan.js');

  {
    const result = runHook('bash-guard.mjs', bashPayload(`rm ${target}`));
    check(
      '#102 rm issues/orphan-demo/plan.md: denies',
      isDeny(result),
      JSON.stringify(result.json)
    );
    check(
      '#102 rm issues/orphan-demo/plan.md: reason names the citing file and the target',
      denyReason(result).includes('tools/cites-plan.js') && denyReason(result).includes(target),
      denyReason(result)
    );
  }
  {
    const result = runHook('bash-guard.mjs', bashPayload(`git rm ${target}`));
    check(
      '#103 git rm issues/orphan-demo/plan.md: denies',
      isDeny(result),
      JSON.stringify(result.json)
    );
  }
  {
    const original = fs.readFileSync(citingFile, 'utf8');
    fs.writeFileSync(citingFile, '// nothing to see here.\n');
    const result = runHook('bash-guard.mjs', bashPayload(`rm ${target}`));
    check('#104 no remaining citation: silent', isSilent(result), JSON.stringify(result.json));
    fs.writeFileSync(citingFile, original);
  }
  {
    const result = runHook('bash-guard.mjs', bashPayload('rm issues/orphan-demo/handoff.md'));
    check(
      '#105 rm handoff.md: silent - nothing cites this file',
      isSilent(result),
      result.stdout
    );
  }
  {
    const result = runHook('bash-guard.mjs', bashPayload('rm app/src/lib/x.ts'));
    check('#106 rm an unrelated file: silent', isSilent(result), result.stdout);
  }
  {
    const result = runHook('bash-guard.mjs', bashPayload(`echo rm ${target}`));
    check(
      '#107 echo rm issues/orphan-demo/plan.md: silent - READERS already covers it',
      isSilent(result),
      result.stdout
    );
  }

  // TL3a - a citation qualified as `git show <sha>:path` resolves through
  // history, not the working tree, so it does not keep the plan.md target
  // alive on its own.
  {
    const original = fs.readFileSync(citingFile, 'utf8');
    fs.writeFileSync(citingFile, `// See \`git show 1234567:${target}\` for the old text.\n`);
    const result = runHook('bash-guard.mjs', bashPayload(`rm ${target}`));
    check(
      'TL3a sha-qualified citation only: silent',
      isSilent(result),
      JSON.stringify(result.json)
    );
    fs.writeFileSync(citingFile, original);
  }

  // TL3b - a sha-qualified line and a plain live citation together: only the
  // live one counts, and it is the one named in the deny reason.
  {
    const original = fs.readFileSync(citingFile, 'utf8');
    fs.writeFileSync(
      citingFile,
      `// See \`git show 1234567:${target}\` for history.\n// Also cited directly: ${target}\n`
    );
    const result = runHook('bash-guard.mjs', bashPayload(`rm ${target}`));
    check('TL3b denies', isDeny(result), JSON.stringify(result.json));
    check(
      'TL3b names exactly the live citation, not the sha-qualified one',
      denyReason(result).includes('is still cited by 1 tracked line') &&
        denyReason(result).includes('tools/cites-plan.js:2') &&
        !denyReason(result).includes('tools/cites-plan.js:1'),
      denyReason(result)
    );
    fs.writeFileSync(citingFile, original);
  }

  // #172-#176 - rule 2i covers any file under issues/<id>/, or the
  // directory itself, not only a single still-cited plan.md.
  // tools/cites-plan.js still cites `issues/orphan-demo/plan.md`, and the
  // unslashed `issues/orphan-demo` is a substring of that citation, so a
  // directory-level target sees the same hit a plan.md-only target would.
  {
    const result = runHook('bash-guard.mjs', bashPayload('git rm -r issues/orphan-demo'));
    check(
      '#172 git rm -r issues/orphan-demo: denies',
      isDeny(result),
      JSON.stringify(result.json)
    );
    check(
      '#172 git rm -r issues/orphan-demo: names the citing file',
      denyReason(result).includes('tools/cites-plan.js'),
      denyReason(result)
    );
  }
  {
    const result = runHook('bash-guard.mjs', bashPayload('git rm -r issues/orphan-demo/'));
    check(
      '#173 git rm -r issues/orphan-demo/ (trailing slash): denies',
      isDeny(result),
      JSON.stringify(result.json)
    );
  }
  {
    const original = fs.readFileSync(citingFile, 'utf8');
    fs.writeFileSync(citingFile, `// See \`git show 1234567:${target}\` for the old text.\n`);
    const result = runHook('bash-guard.mjs', bashPayload('git rm -r issues/orphan-demo'));
    check(
      '#174 git rm -r issues/orphan-demo: silent once the citing file is sha-qualified',
      isSilent(result),
      JSON.stringify(result.json)
    );
    fs.writeFileSync(citingFile, original);
  }
  {
    const result = runHook('bash-guard.mjs', bashPayload('rm issues/orphan-demo/context.md'));
    check(
      '#175 rm issues/orphan-demo/context.md: silent - nothing cites it',
      isSilent(result),
      result.stdout
    );
  }
  {
    // A citation living only inside the very directory being retired is a
    // self-citation: it goes away in the same commit, so it must not block
    // the deletion. Blank out the one external citation first (as #104
    // does), so the only remaining citation of `issues/orphan-demo/` is the one
    // written inside `issues/orphan-demo/handoff.md` itself. Write, track and commit
    // both changes so `git grep` (tracked files only) can see them, then
    // restore both files and the commit.
    const citingOriginal = fs.readFileSync(citingFile, 'utf8');
    fs.writeFileSync(citingFile, '// nothing to see here.\n');
    const handoffPath = path.join(scratchRoot, 'issues', 'orphan-demo', 'handoff.md');
    const handoffOriginal = fs.readFileSync(handoffPath, 'utf8');
    fs.writeFileSync(
      handoffPath,
      `${handoffOriginal}\nSelf-citation: issues/orphan-demo/ retires with this file.\n`
    );
    gitSh(['add', 'tools/cites-plan.js', 'issues/orphan-demo/handoff.md']);
    gitCommit('test: temporary self-citation for #176');
    const result = runHook('bash-guard.mjs', bashPayload('git rm -r issues/orphan-demo'));
    check(
      '#176 git rm -r issues/orphan-demo: silent - the only citation is inside issues/orphan-demo/ itself',
      isSilent(result),
      JSON.stringify(result.json)
    );
    fs.writeFileSync(citingFile, citingOriginal);
    fs.writeFileSync(handoffPath, handoffOriginal);
    gitSh(['add', 'tools/cites-plan.js', 'issues/orphan-demo/handoff.md']);
    gitCommit('test: restore #176 fixture');
  }

  // #179-#182 - the directory needle is unslashed and identifier-boundary-
  // aware, and the self-citation exemption covers all of issues/, not just
  // the target's own task id.
  {
    // #179 - a bare-name citation, no trailing slash and no filename (the
    // dominant real shape: `(issues/<id>, <label>)`), is invisible to a
    // slashed needle `issues/orphan-demo/` and must deny.
    const original = fs.readFileSync(citingFile, 'utf8');
    fs.writeFileSync(citingFile, '// See (issues/orphan-demo, B1) for context.\n');
    const result = runHook('bash-guard.mjs', bashPayload('git rm -r issues/orphan-demo'));
    check(
      '#179 git rm -r issues/orphan-demo: denies a bare-name citation with no trailing slash',
      isDeny(result),
      JSON.stringify(result.json)
    );
    check(
      '#179: names the citing file',
      denyReason(result).includes('tools/cites-plan.js'),
      denyReason(result)
    );
    fs.writeFileSync(citingFile, original);
  }
  {
    // #180 - an unslashed needle must not match a sibling task id it is a
    // prefix of: issues/orphan-demo is not a citation of issues/orphan-demo-followup.
    const original = fs.readFileSync(citingFile, 'utf8');
    fs.writeFileSync(citingFile, '// See issues/orphan-demo-followup/plan.md section 4.\n');
    const result = runHook('bash-guard.mjs', bashPayload('git rm -r issues/orphan-demo'));
    check(
      '#180 git rm -r issues/orphan-demo: silent - issues/orphan-demo-followup is a different task',
      isSilent(result),
      JSON.stringify(result.json)
    );
    fs.writeFileSync(citingFile, original);
  }
  {
    // #181 - two occurrences on one line, the sha-qualified one first: a
    // first-occurrence-only scan would exempt the whole line.
    const original = fs.readFileSync(citingFile, 'utf8');
    fs.writeFileSync(
      citingFile,
      `// git show 1234567:${target} and also directly ${target}.\n`
    );
    const result = runHook('bash-guard.mjs', bashPayload(`rm ${target}`));
    check(
      '#181 rm issues/orphan-demo/plan.md: denies - a live second occurrence follows a sha-qualified first',
      isDeny(result),
      JSON.stringify(result.json)
    );
    fs.writeFileSync(citingFile, original);
  }
  {
    // #182 - self-citation is not scoped to the target's own directory: a
    // citation living only inside a *different* issues/<id>/
    // (not the one being retired) is still scratch citing scratch, and must
    // not block the deletion either. Blank the external citation, add a
    // sibling task directory with the only remaining citation, commit both,
    // then restore.
    const citingOriginal = fs.readFileSync(citingFile, 'utf8');
    fs.writeFileSync(citingFile, '// nothing to see here.\n');
    const otherPath = path.join(scratchRoot, 'issues', 'other-task', 'note.md');
    fs.mkdirSync(path.dirname(otherPath), { recursive: true });
    fs.writeFileSync(otherPath, 'Cites issues/orphan-demo from a different task directory.\n');
    gitSh(['add', 'tools/cites-plan.js', 'issues/other-task/note.md']);
    gitCommit('test: temporary cross-task citation for #182');
    const result = runHook('bash-guard.mjs', bashPayload('git rm -r issues/orphan-demo'));
    check(
      '#182 git rm -r issues/orphan-demo: silent - the only citation is inside a different issues/<id>/',
      isSilent(result),
      JSON.stringify(result.json)
    );
    fs.writeFileSync(citingFile, citingOriginal);
    gitSh(['rm', '-q', 'issues/other-task/note.md']);
    gitSh(['add', 'tools/cites-plan.js']);
    gitCommit('test: restore #182 fixture');
  }

  // #183-#184 - a bare `issues`/`issues/` target denies outright,
  // unconditionally: there is no legitimate single command that retires all
  // of issues/ at once, and the citation audit would still allow it the
  // moment every directory happened to be citation-free.
  {
    const result = runHook('bash-guard.mjs', bashPayload('git rm -r issues'));
    check('#183 git rm -r issues: denies', isDeny(result), JSON.stringify(result.json));
    check(
      '#183: reason names the bare-issues danger, not a citation count',
      denyReason(result).includes('every task directory'),
      denyReason(result)
    );
  }
  {
    const result = runHook('bash-guard.mjs', bashPayload('git rm -r issues/'));
    check(
      '#184 git rm -r issues/ (trailing slash): denies',
      isDeny(result),
      JSON.stringify(result.json)
    );
  }

  // #185-#186 - a GitHub issue link and a task-directory path are the same
  // characters, so a line whose only occurrence is part of a URL must not
  // deny; a bare occurrence alongside one must still deny (every occurrence
  // on the line is scanned, not only the first).
  {
    const original = fs.readFileSync(citingFile, 'utf8');
    fs.writeFileSync(
      citingFile,
      '// See https://github.com/artex-x/daggerheart-loot/issues/orphan-demo for background.\n'
    );
    const result = runHook('bash-guard.mjs', bashPayload('git rm -r issues/orphan-demo'));
    check(
      '#185 git rm -r issues/orphan-demo: silent - the only occurrence is part of a GitHub issue URL',
      isSilent(result),
      JSON.stringify(result.json)
    );
    fs.writeFileSync(citingFile, original);
  }
  {
    const original = fs.readFileSync(citingFile, 'utf8');
    fs.writeFileSync(
      citingFile,
      '// See https://github.com/artex-x/daggerheart-loot/issues/orphan-demo and issues/orphan-demo directly.\n'
    );
    const result = runHook('bash-guard.mjs', bashPayload('git rm -r issues/orphan-demo'));
    check(
      '#186 git rm -r issues/orphan-demo: denies - a bare occurrence follows the URL-qualified one',
      isDeny(result),
      JSON.stringify(result.json)
    );
    fs.writeFileSync(citingFile, original);
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
  // The idiomatic spellings are clusters, and an equality test against a
  // whole token missed every one of them.
  for (const [label, command] of [
    ['#15a git commit -am', 'git commit -am "x"'],
    ['#15b git commit -avm', 'git commit -avm "x"'],
    ['#15c git add -Av', 'git add -Av'],
    ['#15d git add --all', 'git add --all']
  ]) {
    const result = runHook('bash-guard.mjs', bashPayload(command));
    check(`${label}: denies`, isDeny(result), JSON.stringify(result.json));
  }
  // ...and the flag test must still not fire on unrelated short flags.
  for (const [label, command] of [
    ['#15e git commit -m only', 'git commit -m "chore: x"'],
    ['#15f git add -N', 'git add -N app/src/lib/x.ts']
  ]) {
    const result = runHook('bash-guard.mjs', bashPayload(command));
    check(
      `${label}: no blanket-stage deny`,
      !denyReason(result).includes('Stage the files this batch touched'),
      denyReason(result)
    );
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
    check('#29 long-check: message includes 600000', systemMessage(result).includes('600000'));
    check(
      '#29 long-check: message includes the canonical invocation',
      systemMessage(result).includes('rtk npm run check'),
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
  // #31 - a run-all shard is not exempt: it packs a whole `browser` matrix
  // row (up to ~380s measured), not a small slice like golden/sweep's own
  // --shard/width arguments, so it must still get the reminder.
  {
    const result = runHook(
      'bash-guard.mjs',
      bashPayload('node tests/run-all.js --shard=1/4', { session_id: 's-longcheck-shard' })
    );
    check(
      '#31 long-check: run-all --shard is not exempt',
      systemMessage(result).includes('stay in this turn'),
      systemMessage(result)
    );
  }
}

// ---------- bash-guard.mjs: rule 2g, backgrounded check (#64-#75) ----------

function testBackgroundCheck() {
  const session = 's-bgcheck';
  const cases = [
    ['#64 background check: plain', 'npm run check'],
    ['#65 background check: recorded shape, piped', 'npm run check 2>&1 | tail -20'],
    [
      '#66 background check: recorded shape, cd-prefixed and file-redirected',
      'cd E:/dev/daggerheart-loot && npm run check > "C:/Users/x/scratchpad/check3.log" 2>&1'
    ],
    [
      '#67 background check: recorded shape, chained',
      'npm run check 2>&1 | grep -E "Test Files|Tests |FAIL" ; echo CHECK_EXIT=$?\nnpm run check:built 2>&1 | tail -15'
    ],
    // RTK rewrites a bare `npm run check` into `rtk npm run check` before
    // this hook sees it, so the same backgrounding deny has to fire on the
    // rewritten shape too, plain and wrapped in `nohup`.
    ['#140 background check: rtk-prefixed', 'rtk npm run check'],
    ['#141 background check: nohup rtk-prefixed', 'nohup rtk npm run check']
  ];
  for (const [label, command] of cases) {
    const result = runHook(
      'bash-guard.mjs',
      bashPayload(command, { run_in_background: true, session_id: session })
    );
    check(`${label}: exit 0`, result.status === 0);
    check(`${label}: denies`, isDeny(result), JSON.stringify(result.json));
    check(
      `${label}: reason includes the canonical invocation`,
      denyReason(result).includes('rtk npm run check'),
      denyReason(result)
    );
    check(`${label}: reason includes 600000`, denyReason(result).includes('600000'));
  }

  // #68 - the bypass belongs to the gate, not this rule.
  for (const command of [
    'npm run -s check',
    'SKIP_CHECK_GATE=1 npm run check',
    'nohup npm run check'
  ]) {
    const result = runHook(
      'bash-guard.mjs',
      bashPayload(command, { run_in_background: true, session_id: session })
    );
    check(`#68 background check: -s/env/nohup "${command}": denies`, isDeny(result));
  }

  // #69 - foreground is not denied by this rule (it may still speak).
  {
    const result = runHook(
      'bash-guard.mjs',
      bashPayload('npm run check', { run_in_background: false, session_id: 's-bgcheck-fg' })
    );
    check(
      '#69 background check: foreground is not denied',
      !isDeny(result),
      JSON.stringify(result.json)
    );
  }

  // #70 - a hand-built payload with no run_in_background key at all.
  {
    const payload = bashPayload('npm run check', { session_id: 's-bgcheck-absent' });
    delete payload.tool_input.run_in_background;
    const result = runHook('bash-guard.mjs', payload);
    check(
      '#70 background check: absent field is inert',
      !isDeny(result),
      JSON.stringify(result.json)
    );
  }

  // #71 - a non-boolean flag must not be read as true.
  {
    const payload = bashPayload('npm run check', { session_id: 's-bgcheck-nonbool' });
    payload.tool_input.run_in_background = 'true';
    const result = runHook('bash-guard.mjs', payload);
    check(
      '#71 background check: non-boolean flag is inert',
      !isDeny(result),
      JSON.stringify(result.json)
    );
  }

  // #72 - other families are not this rule's business.
  for (const command of [
    'npm run check:built',
    'npm run check:fast',
    'node tests/run-all.js app/states',
    'node tests/run-all.js contracts',
    'npx vitest run --coverage'
  ]) {
    const result = runHook(
      'bash-guard.mjs',
      bashPayload(command, { run_in_background: true, session_id: 's-bgcheck-other' })
    );
    check(`#72 background check: other family "${command}": not denied`, !isDeny(result));
  }

  // #73 - readers and quoted mentions must not be read as the check itself.
  for (const command of [
    'echo npm run check',
    'grep -r "npm run check" .claude',
    'git log --grep "npm run check"',
    'cat notes.txt'
  ]) {
    const result = runHook(
      'bash-guard.mjs',
      bashPayload(command, { run_in_background: true, session_id: 's-bgcheck-readers' })
    );
    check(`#73 background check: reader/mention "${command}": not denied`, !isDeny(result));
  }

  // #74 - deny wins over the reminder: no systemMessage alongside a deny.
  {
    const result = runHook(
      'bash-guard.mjs',
      bashPayload('npm run check', { run_in_background: true, session_id: 's-bgcheck-wins' })
    );
    check('#74 background check: deny wins, isDeny', isDeny(result));
    check('#74 background check: deny wins, no systemMessage', !systemMessage(result));
  }

  // #75 - after #64's deny in this same session, the foreground retry still
  // gets the long-check reminder (the deny does not consume the once marker).
  {
    const result = runHook(
      'bash-guard.mjs',
      bashPayload('npm run check', { run_in_background: false, session_id: session })
    );
    check(
      '#75 background check: foreground retry still gets the reminder',
      systemMessage(result).includes('stay in this turn') &&
        systemMessage(result).includes('600000'),
      systemMessage(result)
    );
  }
}

// ---------- bash-guard.mjs: rule 2k, a check whose result the tool cannot
// report (#154-#166) ----------
//
// The denied shapes are the two measured in the transcripts: a pipe (the
// tool reports the last stage's status, so a failed check reads as a pass)
// and a file redirect (the stdout never reaches check-observer.mjs, so the
// gate cannot arm). The allowed list is what must keep working - the bare
// canonical form, a `cd` prefix, other scripts, and a check named only
// inside a quoted commit message.

function testBlindCheck() {
  const deniedCases = [
    // The exact recorded shapes, including the one that survived RTK's
    // prefix being accepted.
    ['#154 pipe: recorded tail form', 'npm run check 2>&1 | tail -n 120'],
    ['#155 pipe: pipefail prefix', 'set -o pipefail; npm run check 2>&1 | tail -n 120'],
    ['#156 pipe: rtk-prefixed', 'rtk npm run check 2>&1 | tail -150'],
    ['#157 pipe: after cd &&', 'cd E:/dev/x && npm run check 2>&1 | grep -E "Tests "'],
    ['#158 pipe: check:built', 'npm run check:built | tail -5'],
    ['#159 pipe: check is a later stage', 'true | npm run check'],
    ['#160 redirect: to a log file', 'npm run check > /tmp/check.log 2>&1'],
    ['#161 redirect: append', 'npm run check >> out.txt'],
    ['#162 redirect: then echo $?', 'rtk npm run check > out.log 2>&1; echo EXIT=$?']
  ];
  for (const [label, command] of deniedCases) {
    const result = runHook('bash-guard.mjs', bashPayload(command, { session_id: 's-blind' }));
    check(`${label}: exit 0`, result.status === 0);
    check(`${label}: denies`, isDeny(result), JSON.stringify(result.json));
    check(
      `${label}: reason includes the canonical invocation`,
      denyReason(result).includes('rtk npm run check'),
      denyReason(result)
    );
    check(`${label}: reason includes 600000`, denyReason(result).includes('600000'));
  }

  // #163 - the deny wins over the long-check reminder, as rule 2g's does.
  {
    const result = runHook(
      'bash-guard.mjs',
      bashPayload('npm run check | tail -n 5', { session_id: 's-blind-wins' })
    );
    check('#163 blind check: deny wins, isDeny', isDeny(result));
    check('#163 blind check: deny wins, no systemMessage', !systemMessage(result));
  }

  // #164 - everything the rule must not touch. The canonical form is the
  // point of the rule, so a false block here is worse than no rule at all.
  const allowedCases = [
    ['#164a bare', 'npm run check'],
    ['#164b rtk-prefixed bare', 'rtk npm run check'],
    ['#164c cd prefix', 'cd app && rtk npm run check'],
    ['#164d check:built bare', 'npm run check:built'],
    ['#164e a different script, piped', 'npm run test 2>&1 | tail -n 20'],
    ['#164f run-all, piped', 'node tests/run-all.js contracts | tail -5'],
    ['#164g check:fast, piped', 'npm run check:fast | tail -n 5']
  ];
  for (const [label, command] of allowedCases) {
    const result = runHook(
      'bash-guard.mjs',
      bashPayload(command, { session_id: `s-blind-ok-${label.slice(0, 6)}` })
    );
    check(`${label}: not denied`, !isDeny(result), JSON.stringify(result.json));
  }

  // #165 - a check named only inside a quoted commit message is text, not a
  // command: sanitize() drops quoted content that is not a single inert
  // word, so the rule never sees it.
  {
    const result = runHook(
      'bash-guard.mjs',
      bashPayload('git commit -m "ban npm run check | tail in the guide"', {
        session_id: 's-blind-quoted'
      })
    );
    check('#165 blind check: quoted message is not a command', !isDeny(result));
  }

  // #166 - a backgrounded piped check still denies under rule 2g, which
  // runs first and names the backgrounding rather than the pipe.
  {
    const result = runHook(
      'bash-guard.mjs',
      bashPayload('npm run check 2>&1 | tail -n 40', {
        run_in_background: true,
        session_id: 's-blind-bg'
      })
    );
    check('#166 blind check: backgrounded still denies', isDeny(result));
    check(
      '#166 blind check: backgrounding is the reason given',
      denyReason(result).includes('backgrounded'),
      denyReason(result)
    );
  }
}

// ---------- bash-guard.mjs: rule 2j, RTK-bypass readers (#112-#125,
// narrowed: #135, #137, #139, corrected on remediation against a direct
// `rtk hook check` probe of the installed `rtk 0.48.0`:
// #116-#117 reverted to deny (tail is never rewritten, any position), #136
// retired (a chain prefix never blocks grep's rewrite), #144-#153 added)
// ----------
//
// The remediation round's own briefed boundary ("anything in a pipeline is
// never rewritten") turned out to be wrong too, caught by actually running
// `rtk hook check` on both a pipe's leading stage AND its final stage
// rather than trusting the generalisation: `cat f | grep -n x` comes back
// `cat f | rtk grep -n x` (rewritten - it is the pipe's final stage), while
// `grep -n x f | wc -l` and `grep -rn x . | head -50` (leading stage) and
// `a | grep -n x | b` (middle stage) do not rewrite at all. `tail -c` gets
// none of that nuance - `cat f | tail -c 20` does not rewrite either, so
// tail denies in every position once matched, pipe or not.

function testRtkReaders() {
  const allowedCases = [
    ['#112 grep -n bare leading', 'grep -n foo app/src/lib/x.ts'],
    ['#113 grep -rn cluster bare leading', "grep -rn 'x' docs/"],
    ['#114 grep --line-number bare leading', 'grep --line-number x f'],
    // #144-#149 (remediation): a list operator (`&&`, `;`, an env-var
    // prefix) never blocks RTK's rewrite of `grep -n`, on either side of
    // it - measured via `rtk hook check` on each exact shape.
    ['#144 grep -n env-assignment prefix', 'A=1 grep -n foo path.ts'],
    ['#145 grep -n after cd &&', 'cd docs && grep -n x f'],
    ['#146 grep -n after ;', 'true; grep -n x f'],
    ['#147 grep -n after echo &&', 'echo ok && grep -n x f'],
    ['#148 grep -n before &&', 'grep -n x f && echo ok'],
    // #149 - the correction that overturned the remediation's own briefed
    // table: `grep -n` as a pipe's FINAL stage rewrites cleanly. "anything
    // in a pipeline is never rewritten" is true for every other stage, not
    // this one.
    ['#149 grep -n as a pipe final stage', 'cat f | grep -n x']
  ];
  for (const [label, command] of allowedCases) {
    const result = runHook('bash-guard.mjs', bashPayload(command));
    check(`${label}: exit 0`, result.status === 0);
    check(`${label}: not denied`, !isDeny(result), JSON.stringify(result.json));
  }

  const denyCases = [
    // #115 - repurposed on remediation: the old command here (`cat f |
    // grep -n x`) is #149 now and must NOT deny. A pipe's leading, non-
    // final stage is what genuinely never rewrites.
    ['#115 grep -n as a pipe leading stage', 'grep -n x f | wc -l', 'rtk grep'],
    ['#118 xargs grep -n', 'find . -name "*.ts" | xargs grep -n x', 'rtk grep'],
    // #116-#117 - reverted from allow back to deny on remediation: `tail
    // -c`/`--bytes` has no rewrite RTK can produce in any position (it
    // lacks a byte-offset mode), so there is no leading-position exemption
    // to grant it the way there is for `grep -n`.
    ['#116 tail -c bare leading', 'tail -c 200 f', 'rtk read'],
    ['#117 tail --bytes bare leading', 'tail --bytes=200 f', 'rtk read'],
    ['#135 grep -n inside $(...)', 'echo $(grep -n x f)', 'rtk grep'],
    ['#137 tail -c inside $(...)', 'echo $(tail -c 5 f)', 'rtk read'],
    ['#138 tail -c after cd &&', 'cd docs && tail -c 5 f', 'rtk read'],
    ['#139 grep -n inside backtick substitution', 'echo `grep -n x f`', 'rtk grep'],
    // #150-#151 (remediation, item 2): the leading command of a pipe was a
    // real hole - silent under the previous narrowing, since it only
    // checked segments after the first.
    ['#150 grep -n as the leading command of a pipe', 'grep -rn x . | head -50', 'rtk grep'],
    ['#151 tail -c piped', 'tail -c 5 f | wc -l', 'rtk read'],
    // #152-#153 (remediation, bonus coverage for the corrected boundary):
    // a middle pipe stage, and an unsupported wrapper (`nohup`, `xargs`,
    // `time` - not `env`/`command`, which are transparent to RTK but
    // treated the same here since `unwrap()` cannot tell the two groups
    // apart on its own).
    ['#152 grep -n in a pipe middle stage', 'a | grep -n x | b', 'rtk grep'],
    ['#153 grep -n wrapped by nohup', 'nohup grep -n x f', 'rtk grep']
  ];
  for (const [label, command, fragment] of denyCases) {
    const result = runHook('bash-guard.mjs', bashPayload(command));
    check(`${label}: exit 0`, result.status === 0);
    check(`${label}: denies`, isDeny(result), JSON.stringify(result.json));
    check(
      `${label}: reason mentions "${fragment}"`,
      denyReason(result).includes(fragment),
      denyReason(result)
    );
  }

  // #119 - the canonical check invocation is never this rule's business.
  // #119 - `tail -n` as a pipe's final stage is rewritable, so 2j must let
  // it through. This case used to carry the then-canonical check
  // invocation, `set -o pipefail; npm run check 2>&1 | tail -n 120`; rule 2k
  // now denies that shape outright, so the same 2j property is asserted
  // against a command 2k does not cover, and the current canonical
  // invocation is checked alongside it.
  {
    const result = runHook(
      'bash-guard.mjs',
      bashPayload('set -o pipefail; node tests/run-all.js contracts 2>&1 | tail -n 120')
    );
    check(
      '#119 tail -n final stage: not denied by 2j',
      !isDeny(result),
      JSON.stringify(result.json)
    );
  }
  {
    const result = runHook('bash-guard.mjs', bashPayload('rtk npm run check'));
    check(
      '#119b canonical check: not denied by 2j or 2k',
      !isDeny(result),
      JSON.stringify(result.json)
    );
  }

  const silentCases = [
    ['#120 git grep -n', 'git grep -n "issues/orphan-demo/plan\\.md"'],
    ['#121 rtk grep -n', 'rtk grep -n x docs/'],
    ['#122 tail -n', 'tail -n 120 f'],
    ['#123 grep -r', 'grep -r x docs/'],
    ['#124 echo', 'echo "grep -n x"'],
    // A known limitation (README, "Known limitations"): a quoted `sh -c`
    // span is erased with its quotes like every other quoted command, so
    // this is silent rather than denied.
    ['#125 quoted sh -c', 'sh -c "grep -n x f"']
  ];
  for (const [label, command] of silentCases) {
    const result = runHook('bash-guard.mjs', bashPayload(command));
    check(`${label}: exit 0`, result.status === 0);
    check(`${label}: silent`, isSilent(result), result.stdout);
  }
}

// ---------- edit-guard.mjs (#31-39, #35a) ----------

function testEditGuard() {
  const denyCases = [
    ['#31 data.json', path.join(scratchRoot, 'data.json'), 'node tools/build.js'],
    ['#32 catalog.csv', path.join(scratchRoot, 'catalog.csv'), null],
    ['#33 i/cc1.html', path.join(scratchRoot, 'i', 'cc1.html'), null],
    ['#34 dist/index.html', path.join(scratchRoot, 'dist', 'index.html'), 'npm run build'],
    ['#35 package-lock.json', path.join(scratchRoot, 'package-lock.json'), 'npm install'],
    [
      '#35a tests/app/snapshots/x_state.txt',
      path.join(scratchRoot, 'tests', 'app', 'snapshots', 'x_state.txt'),
      'node tests/app/golden.js --update'
    ]
  ];
  for (const [label, filePath, fragment] of denyCases) {
    const result = runHook('edit-guard.mjs', editPayload(filePath));
    check(`${label}: denies`, isDeny(result));
    if (fragment)
      check(`${label}: reason`, denyReason(result).includes(fragment), denyReason(result));
  }

  // #36 - Windows normalisation: backslashes and an upper-case drive letter
  // only mean anything as path separators on win32. On POSIX a backslash is
  // just another filename character, so the very same string can never
  // resolve to data.json there - path.isAbsolute() is false for it, and it
  // ends up as one odd relative filename, not a path into the repo root.
  // Asserting "denies" unconditionally baked in Windows-only path shape;
  // this case could only ever pass on this one OS. Assert per-platform
  // instead, so the suite proves the real contract on both.
  const upperDrive = scratchRoot
    .replace(/^([a-z]):/i, (m, d) => `${d.toUpperCase()}:`)
    .replace(/\//g, '\\');
  const windowsPath = `${upperDrive}\\data.json`;
  if (process.platform === 'win32') {
    const result = runHook('edit-guard.mjs', editPayload(windowsPath));
    check('#36 Windows-normalised path: denies', isDeny(result));
  } else {
    const result = runHook('edit-guard.mjs', editPayload(windowsPath));
    check(
      '#36 backslash-string on POSIX: not data.json, stays silent',
      isSilent(result),
      result.stdout
    );
  }

  const silentCases = [
    ['#37 data.js', path.join(scratchRoot, 'data.js')],
    ['#38 docs/fixtures', path.join(scratchRoot, 'docs', 'fixtures', 'lists', 'x.json')],
    ['#39 outside repo', path.join(os.tmpdir(), 'elsewhere.txt')],
    // #39a - relPath() now returns '.' for the repo root instead of null, so
    // bash-guard can deny `rm -rf .`. edit-guard must not start denying on
    // that sentinel, and its near-miss paths must stay clean.
    ['#39a repo root itself', scratchRoot],
    ['#39b app/data.json', path.join(scratchRoot, 'app', 'data.json')],
    ['#39c docs/i/x.html', path.join(scratchRoot, 'docs', 'i', 'x.html')],
    ['#39d input/x.html', path.join(scratchRoot, 'input', 'x.html')],
    ['#39e app/dist/x.html', path.join(scratchRoot, 'app', 'dist', 'x.html')],
    [
      '#39f tests/app/snapshot.txt (no trailing slash)',
      path.join(scratchRoot, 'tests', 'app', 'snapshot.txt')
    ],
    [
      '#39g tests/app-snapshots/x.txt (near-miss dir name)',
      path.join(scratchRoot, 'tests', 'app-snapshots', 'x.txt')
    ]
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
    // #40b - the reminder's own content is checked, not only that it fires.
    // The reminder used to overclaim that a forgotten rebuild makes
    // tests/derived.js fail - it cannot, since npm run check regenerates
    // the files immediately before comparing them. The message now points
    // at tests/derived.js's COUNT_BEARING_FILES array by name instead of a
    // line range: a range that five files must track moved the moment the
    // file was touched again.
    check(
      '#40b data.js reminder names the derived files array by identifier',
      systemMessage(result).includes("tests/derived.js's COUNT_BEARING_FILES array"),
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
  // #42 - the real repo file is docs/specs/CONTRACTS.md (mixed case;
  // CLAUDE.md and this directory both spell it that way). The rule used to
  // compare against a lowercase literal directly: relPath() lower-cases its
  // return value on win32, so it matched there, but on POSIX relPath() keeps
  // real casing and the comparison never matched - the reminder could not
  // fire on Linux for CONTRACTS.md, ROUTES.md, or any other mixed-case
  // literal in this file. Fixed by folding both sides with pathKey() at the
  // rule site (lib.mjs); this case now exercises that fix on whichever
  // platform runs it.
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

  // #167-#171 - the verdict line. The hook already knows the failure
  // markers and whether it armed; stating so is what stops a worker
  // spending a second ~165s run to learn it. Silence outside a real,
  // foreground check invocation is part of the contract: the line must
  // never appear against some other command's output.
  //
  // These payloads carry `exit_code` because the hook must handle a host
  // that sends one. This host does not - probed 2026-09-18, a successful
  // Bash call reaches a PostToolUse hook as `{stdout, stderr, interrupted,
  // isImage, noOutputExpected}` with no exit code anywhere, and a failed
  // one does not reach it at all. So #168's FAIL line is asserted here and
  // is not expected to appear live; see check-observer.mjs's header.
  clearCache();
  {
    const payload = {
      session_id: 's-observer-says',
      cwd: scratchRoot,
      hook_event_name: 'PostToolUse',
      tool_name: 'Bash',
      tool_input: { command: 'rtk npm run check', run_in_background: false },
      tool_response: passingResponse
    };
    const result = runHook('check-observer.mjs', payload);
    check(
      '#167 verdict: a pass says PASS with the exit code',
      systemMessage(result).includes('PASS (exit 0)'),
      systemMessage(result)
    );
    check(
      '#167 verdict: a pass says the gate armed',
      systemMessage(result).includes('armed'),
      systemMessage(result)
    );
  }

  clearCache();
  {
    const payload = {
      session_id: 's-observer-says',
      cwd: scratchRoot,
      hook_event_name: 'PostToolUse',
      tool_name: 'Bash',
      tool_input: { command: 'rtk npm run check', run_in_background: false },
      tool_response: {
        exit_code: 1,
        stdout: 'All files\n2 FAILED\n',
        stderr: '',
        interrupted: false
      }
    };
    const result = runHook('check-observer.mjs', payload);
    check(
      '#168 verdict: a failure says FAIL with the exit code',
      systemMessage(result).includes('FAIL (exit 1)'),
      systemMessage(result)
    );
    check('#168 verdict: a failure still writes no cache', !fs.existsSync(cacheFilePath()));
  }

  clearCache();
  {
    const payload = {
      session_id: 's-observer-says',
      cwd: scratchRoot,
      hook_event_name: 'PostToolUse',
      tool_name: 'Bash',
      tool_input: { command: 'rtk npm run check', run_in_background: false },
      tool_response: {
        exit_code: 0,
        stdout: 'nothing useful\n',
        stderr: '',
        interrupted: false
      }
    };
    const result = runHook('check-observer.mjs', payload);
    check(
      '#169 verdict: unattributable output says the gate is not armed',
      systemMessage(result).includes('not armed'),
      systemMessage(result)
    );
    check(
      '#169 verdict: unattributable output writes no cache',
      !fs.existsSync(cacheFilePath())
    );
  }

  clearCache();
  {
    const payload = {
      session_id: 's-observer-says',
      cwd: scratchRoot,
      hook_event_name: 'PostToolUse',
      tool_name: 'Bash',
      tool_input: { command: 'npm run test', run_in_background: false },
      tool_response: passingResponse
    };
    const result = runHook('check-observer.mjs', payload);
    check(
      '#170 verdict: silent for a command that is not the check',
      !systemMessage(result),
      result.stdout
    );
  }

  clearCache();
  {
    const payload = {
      session_id: 's-observer-says',
      cwd: scratchRoot,
      hook_event_name: 'PostToolUse',
      tool_name: 'Bash',
      tool_input: { command: 'npm run check', run_in_background: true },
      tool_response: passingResponse
    };
    const result = runHook('check-observer.mjs', payload);
    check('#171 verdict: silent for a backgrounded run', !systemMessage(result), result.stdout);
  }

  // #49a-g - the observer must only trust stdout it can attribute to a real
  // check run. Every "no cache" case here was probed writing a cache entry.
  const attributionCases = [
    [
      '#49a redirect then grep (the check FAILED)',
      'npm run check > o.txt 2>&1 || true; grep "All files" o.txt',
      passingResponse,
      false
    ],
    [
      '#49b echo naming the command',
      'echo "npm run check says All files"',
      passingResponse,
      false
    ],
    ['#49c stdout redirected away', 'npm run check > o.txt', passingResponse, false],
    [
      '#49d unrecognised numeric failure field',
      'npm run check',
      { status: 1, stdout: 'All files | 96 |\n', stderr: '', interrupted: false },
      false
    ],
    [
      '#49e piped to tail (the plain pipe, still accepted)',
      'npm run check 2>&1 | tail -n 120',
      passingResponse,
      true
    ],
    // #49f - found the hard way while committing this very batch: a leading
    // `cd <dir> &&` is habit, not a second output producer, and rejecting it
    // made the gate unsatisfiable for an agent that types one.
    [
      '#49f leading cd',
      'cd "E:/dev/daggerheart-loot" && npm run check 2>&1 | tail -n 130',
      passingResponse,
      true
    ],
    // #49g - but a trailing command after the check is still not trusted:
    // its stdout is the last thing written, and it is not the check's.
    [
      '#49g cd, check, then something else',
      'cd /repo && npm run check && echo "All files"',
      passingResponse,
      false
    ],
    // #92-#101 - row 30, the set -o pipefail prefix: the four accepted
    // shapes and the six refused ones are the whole of what it promises.
    [
      '#92 pipefail prefix, semicolon',
      'set -o pipefail; npm run check 2>&1 | tail -n 120',
      passingResponse,
      true
    ],
    [
      '#93 pipefail prefix, &&',
      'set -o pipefail && npm run check 2>&1 | tail -n 120',
      passingResponse,
      true
    ],
    [
      '#94 cd then pipefail',
      'cd "E:/dev/daggerheart-loot" && set -o pipefail; npm run check 2>&1 | tail -n 120',
      passingResponse,
      true
    ],
    [
      '#95 pipefail then cd',
      'set -o pipefail; cd /repo && npm run check 2>&1 | tail -n 120',
      passingResponse,
      true
    ],
    [
      '#96 pipefail then echo (forgery)',
      'set -o pipefail; echo "All files"',
      passingResponse,
      false
    ],
    [
      '#97 pipefail, redirect, grep (forgery)',
      'set -o pipefail; npm run check > o.txt 2>&1; grep "All files" o.txt',
      passingResponse,
      false
    ],
    [
      '#98 pipefail, something between, check',
      'set -o pipefail; true; npm run check 2>&1 | tail -n 120',
      passingResponse,
      false
    ],
    [
      '#99a other set forms are not stripped: -eo pipefail',
      'set -eo pipefail; npm run check 2>&1 | tail -n 120',
      passingResponse,
      false
    ],
    [
      '#99b other set forms are not stripped: -x',
      'set -x; npm run check 2>&1 | tail -n 120',
      passingResponse,
      false
    ],
    [
      '#100 pipefail, check:built',
      'set -o pipefail; npm run check:built 2>&1 | tail -n 120',
      passingResponse,
      false
    ],
    // #101 - beside #92, which arms on the same stdout with exit_code: 0,
    // this is the case that shows the prefix tightens the gate rather than
    // loosening it: with no failure marker in the output, only the prefix
    // carrying the real exit code stops this from arming.
    [
      '#101 pipefail carries the status',
      'set -o pipefail; npm run check 2>&1 | tail -n 120',
      { exit_code: 1, stdout: 'All files | 96 |\n', stderr: '', interrupted: false },
      false
    ],
    // #142-#143 - the gate has to arm on the shape RTK's own hook actually
    // produces, `rtk npm run check`, not only on the bare invocation a
    // human types by hand.
    ['#142 rtk-prefixed check arms the gate', 'rtk npm run check', passingResponse, true],
    [
      '#143 rtk-prefixed check still refuses on failure',
      'rtk npm run check',
      { exit_code: 1, stdout: 'All files | 96 |\n', stderr: '', interrupted: false },
      false
    ]
  ];
  for (const [label, command, response, shouldCache] of attributionCases) {
    clearCache();
    runHook('check-observer.mjs', {
      session_id: 's-observer',
      cwd: scratchRoot,
      hook_event_name: 'PostToolUse',
      tool_name: 'Bash',
      tool_input: { command, run_in_background: false },
      tool_response: response
    });
    check(
      `${label}: ${shouldCache ? 'cache written' : 'no cache written'}`,
      fs.existsSync(cacheFilePath()) === shouldCache
    );
  }
  clearCache();
}

// ---------- pathKey() portability (#61-63) ----------
//
// pathKey() is now pure string folding with no process.platform branch (see
// lib.mjs), so unlike relPath() (which genuinely behaves differently per OS
// because path.resolve/relative do), these assertions are not platform-
// dependent and are real evidence on any host, this Windows box included -
// they do not merely happen to pass here the way the old #36 case did.

async function testPathKeyPortability() {
  const { pathKey } = await import(pathToFileUrlHref('lib.mjs'));

  check(
    '#61 pathKey folds mixed case the same on every platform',
    pathKey('docs/specs/CONTRACTS.md') === 'docs/specs/contracts.md'
  );
  check(
    '#61a pathKey folds a POSIX-shaped forward-slash path (no OS path resolution involved)',
    pathKey('App/Src/Components/PageHead.svelte') === 'app/src/components/pagehead.svelte'
  );
  check(
    '#62 pathKey is idempotent / already-lowercase input is unchanged',
    pathKey('docs/specs/contracts.md') === 'docs/specs/contracts.md'
  );
  // #63 - the comparison edit-followup.mjs's remind:contract group actually
  // performs: fold both the recorded path and the hand-written literal, then
  // compare. This is exactly what #42 exercises end to end through the real
  // hook; this restates it as a direct, OS-independent unit check of the
  // helper the fix relies on.
  check(
    '#63 folded comparison matches CONTRACTS.md against the lowercase literal',
    pathKey('docs/specs/CONTRACTS.md') === pathKey('docs/specs/contracts.md')
  );
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

  // #52 / #60 - a wrote entry that is still dirty -> systemMessage names the
  // path. Driven through edit-followup.mjs, not recordWrite(), and with a
  // MIXED-CASE path: recording and matching are two different normalisations
  // on win32, and a pre-normalised literal certified the bug instead of
  // catching it. PageHead.svelte stands in for every Svelte component,
  // CLAUDE.md and both READMEs - the files most likely left uncommitted.
  const stopSession = 's-stop-dirty';
  const mixedCase = 'app/src/components/PageHead.svelte';
  {
    const recorded = runHook(
      'edit-followup.mjs',
      editPayload(path.join(scratchRoot, ...mixedCase.split('/')), {
        session_id: stopSession,
        event: 'PostToolUse'
      })
    );
    check('#60 mixed-case write: silent', isSilent(recorded), recorded.stdout);
  }
  {
    const result = runHook('session-stop.mjs', {
      session_id: stopSession,
      cwd: scratchRoot,
      hook_event_name: 'Stop',
      stop_hook_active: false
    });
    check(
      '#52 uncommitted work: names the path',
      systemMessage(result).includes(mixedCase),
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

  // #108-#111 - this session's own untracked writes, named in a sentence
  // separate from "uncommitted work", excluding docs/ and the task-document
  // set (row 39).
  const candSession = 's-stop-candidates';
  writeFile('tools/scratch-tmp.js', '// scratch\n');
  recordWrite(candSession, 'tools/scratch-tmp.js');
  {
    const result = runHook('session-stop.mjs', {
      session_id: candSession,
      cwd: scratchRoot,
      hook_event_name: 'Stop',
      stop_hook_active: false
    });
    check(
      '#108 untracked session write: named',
      systemMessage(result).includes('tools/scratch-tmp.js'),
      systemMessage(result)
    );
  }

  writeFile('issues/99/plan.md', '# scratch plan\n');
  writeFile('docs/specs/NEW.md', '# scratch spec\n');
  recordWrite(candSession, 'issues/99/plan.md');
  recordWrite(candSession, 'docs/specs/NEW.md');
  {
    const result = runHook('session-stop.mjs', {
      session_id: candSession,
      cwd: scratchRoot,
      hook_event_name: 'Stop',
      stop_hook_active: false
    });
    check(
      '#109 excluded untracked writes: neither name appears',
      !systemMessage(result).includes('issues/99/plan.md') &&
        !systemMessage(result).includes('docs/specs/NEW.md'),
      systemMessage(result)
    );
  }

  const candCaseSession = 's-stop-candidate-case';
  const candMixedCase = 'tools/ScratchTmp.js';
  writeFile(candMixedCase, '// scratch\n');
  {
    const recorded = runHook(
      'edit-followup.mjs',
      editPayload(path.join(scratchRoot, ...candMixedCase.split('/')), {
        session_id: candCaseSession,
        event: 'PostToolUse'
      })
    );
    check('#110 setup write: silent', isSilent(recorded), recorded.stdout);
  }
  {
    const result = runHook('session-stop.mjs', {
      session_id: candCaseSession,
      cwd: scratchRoot,
      hook_event_name: 'Stop',
      stop_hook_active: false
    });
    check(
      '#110 mixed-case candidate: named with its own spelling',
      systemMessage(result).includes(candMixedCase),
      systemMessage(result)
    );
  }
  {
    const result = runHook('session-stop.mjs', {
      session_id: candCaseSession,
      cwd: scratchRoot,
      hook_event_name: 'Stop',
      stop_hook_active: false
    });
    check('#111 second Stop, unchanged state: silent', isSilent(result), result.stdout);
  }

  // Clean up this block's own untracked scratch so testFailOpen() sees the
  // tree it expects.
  fs.rmSync(path.join(scratchRoot, 'tools/scratch-tmp.js'), { force: true });
  fs.rmSync(path.join(scratchRoot, 'issues/99/plan.md'), { force: true });
  fs.rmSync(path.join(scratchRoot, 'docs/specs/NEW.md'), { force: true });
  fs.rmSync(path.join(scratchRoot, candMixedCase), { force: true });
}

// ---------- session-stop.mjs: task-document size budget (#126-#130) ----------

async function testTaskBudget() {
  const { recordWrite, activeTask, getWrote } = await import(pathToFileUrlHref('lib.mjs'));
  process.env.LOOT_HOOK_ROOT = scratchRoot;

  // Force every issues/<id> directory that exists at this point to a fixed,
  // safely old mtime, so activeTask()'s "newest file wins" comparison for
  // the fresh issues/98 writes below is a strict inequality regardless of
  // filesystem mtime resolution or readdirSync() order - the same pattern
  // setupScratch() already uses for issues/orphan-demo/handoff.md. A real code/
  // comment discrepancy on its own (an earlier version of this pin covered
  // only issues/99/context.md, not every directory as its comment claimed),
  // worth keeping regardless, but NOT what caused CI's failures below - an
  // mtime-tie theory was chased here and was wrong; the actual cause is the
  // session-state isolation just below.
  const old = new Date('2020-01-01T00:00:00Z');
  const issuesRoot = path.join(scratchRoot, 'issues');
  for (const dirEntry of fs.readdirSync(issuesRoot, { withFileTypes: true })) {
    if (!dirEntry.isDirectory()) continue;
    const dirPath = path.join(issuesRoot, dirEntry.name);
    for (const fileEntry of fs.readdirSync(dirPath, { withFileTypes: true })) {
      if (!fileEntry.isFile()) continue;
      fs.utimesSync(path.join(dirPath, fileEntry.name), old, old);
    }
  }

  // This block's session gets its own state directory, isolated from every
  // other test's sessions, so #126-#130 depend on nothing the rest of the
  // suite does to the shared state - not on session count, not on ordering.
  // The production prune that once evicted this block's own `s-stop-budget`
  // session on CI (GitHub-hosted runner, `e2ada3f`: recordWrite()'s entry
  // was pruned before session-stop.mjs ever read it back, writtenPaths came
  // back [], budgetSentences()'s prefix check failed, no budget sentence
  // fired - found via budgetDiagnostics() below, on its first real failure)
  // is fixed in lib.mjs's saveState() (the session being written is
  // reserved before the rest are ranked; cap raised to MAX_SESSIONS) and
  // pinned directly by #131-#134 below (task `hook-state-cap`). This
  // block's isolation stays regardless, per that task's plan section 4.5.
  const taskBudgetState = fs.mkdtempSync(path.join(os.tmpdir(), 'loot-hooks-budget-state-'));
  const previousStateDir = process.env.LOOT_HOOK_STATE_DIR;
  process.env.LOOT_HOOK_STATE_DIR = taskBudgetState;

  try {
    // Self-diagnosing detail for #126/#127/#128: when the budget sentence
    // fails to appear, this says WHY instead of just showing the (empty)
    // systemMessage - what activeTask() resolved to (id, dir, which docs it
    // sees), what this session's own recorded writes are, and what
    // budgetSentences()'s own statSync calls would see for each task
    // document. Computed in this process, right after the hook subprocess
    // returns, against the same LOOT_HOOK_ROOT/LOOT_HOOK_STATE_DIR. This is
    // what actually found the session-pruning bug above, on its first real
    // CI failure: `writtenPaths(session=s-stop-budget) = []` against a
    // correctly-resolved activeTask() and a found-on-disk handoff.md
    // pointed straight at "the write was recorded, then lost" instead of
    // leaving another guess. Kept permanently as insurance for whatever
    // fails here next.
    const TASK_DOC_NAMES = ['context.md', 'plan.md', 'handoff.md'];
    function budgetDiagnostics(sessionId, result) {
      const task = activeTask();
      const taskLine = task
        ? `activeTask() -> id=${task.id} dir=${task.dir} hasContext=${task.hasContext} hasPlan=${task.hasPlan} hasHandoff=${task.hasHandoff}`
        : 'activeTask() -> null (no issues/<id>/ directory found)';
      const writtenPaths = Object.keys(getWrote(sessionId));
      const sizeLines = TASK_DOC_NAMES.map((name) => {
        if (!task) return `${name}: (no active task to look under)`;
        try {
          const stat = fs.statSync(path.join(task.dir, name));
          return `${name}: found, ${stat.size} bytes`;
        } catch (err) {
          return `${name}: not found (${err.code || err.message})`;
        }
      });
      return [
        taskLine,
        `writtenPaths(session=${sessionId}) = ${JSON.stringify(writtenPaths)}`,
        `statSync per task document: ${sizeLines.join('; ')}`,
        `systemMessage = ${JSON.stringify(systemMessage(result))}`
      ].join('\n');
    }

    const session = 's-stop-budget';
    const results = [];

    // #126 - past the 150 KB warn line
    writeFile('issues/98/handoff.md', 'x'.repeat(160 * 1024));
    recordWrite(session, 'issues/98/handoff.md');
    {
      const result = runHook(
        'session-stop.mjs',
        {
          session_id: session,
          cwd: scratchRoot,
          hook_event_name: 'Stop',
          stop_hook_active: false
        },
        { state: taskBudgetState }
      );
      results.push(result);
      check(
        '#126 task document past 150 KB: names the file and the budget',
        systemMessage(result).includes('issues/98/handoff.md') &&
          systemMessage(result).includes('150 KB'),
        budgetDiagnostics(session, result)
      );
    }

    // #127 - past the 300 KB collapse line, names the skill
    writeFile('issues/98/plan.md', 'x'.repeat(310 * 1024));
    recordWrite(session, 'issues/98/plan.md');
    {
      const result = runHook(
        'session-stop.mjs',
        {
          session_id: session,
          cwd: scratchRoot,
          hook_event_name: 'Stop',
          stop_hook_active: false
        },
        { state: taskBudgetState }
      );
      results.push(result);
      check(
        '#127 task document past 300 KB: names the file, the budget, and the skill',
        systemMessage(result).includes('issues/98/plan.md') &&
          systemMessage(result).includes('300 KB') &&
          systemMessage(result).includes('handoff/SKILL.md'),
        budgetDiagnostics(session, result)
      );
    }

    // #128 - same state again -> silent (once per dedupe key). Silence here
    // only means something if the prior call (#127) actually fired: a
    // completely dead budgetSentences() would make #128, #129 and #130 all
    // pass vacuously (isSilent / no-"KB" / no-"decision" are all trivially
    // true when nothing is ever emitted) - exactly how this block scored 3
    // of 5 green during the CI regression above, with only #126/#127
    // catching it. Assert the precondition explicitly rather than relying
    // on that.
    {
      const prior = results[results.length - 1];
      check(
        '#128 precondition: #127 actually fired (not silent)',
        !isSilent(prior),
        `${prior.stdout}\n${budgetDiagnostics(session, prior)}`
      );
      const result = runHook(
        'session-stop.mjs',
        {
          session_id: session,
          cwd: scratchRoot,
          hook_event_name: 'Stop',
          stop_hook_active: false
        },
        { state: taskBudgetState }
      );
      results.push(result);
      check('#128 repeat with unchanged state: silent', isSilent(result), result.stdout);
    }

    // #129 - a bystander session that wrote outside the task directory never
    // gets a budget sentence, even though the active task is now issues/98.
    {
      const bystander = 's-stop-bystander';
      recordWrite(bystander, 'app/src/lib/x.ts');
      const result = runHook(
        'session-stop.mjs',
        {
          session_id: bystander,
          cwd: scratchRoot,
          hook_event_name: 'Stop',
          stop_hook_active: false
        },
        { state: taskBudgetState }
      );
      results.push(result);
      check(
        '#129 bystander session: no KB mentioned',
        !systemMessage(result).includes('KB'),
        systemMessage(result)
      );
    }

    // #130 - the Stop hook never emits a `decision` key.
    check(
      '#130 no result carries a decision key',
      results.every(
        (r) => !(r.json && Object.prototype.hasOwnProperty.call(r.json, 'decision'))
      ),
      JSON.stringify(results.map((r) => r.json))
    );
  } finally {
    // Restore the shared state dir for every later test, and discard this
    // block's own isolated one - nothing after this point should ever read
    // from it.
    process.env.LOOT_HOOK_STATE_DIR = previousStateDir;
    fs.rmSync(taskBudgetState, { recursive: true, force: true });
  }

  // Clean up this block's own scratch so testFailOpen() sees the tree it
  // expects. issues/99/context.md is left in place (only its mtime was
  // changed above, to a fixed 2020 date); nothing from here on depends on
  // which issues/<id>/ directory activeTask() resolves to - testFailOpen()
  // feeds malformed input that every script (including session-stop.mjs)
  // must reject before ever reaching activeTask().
  fs.rmSync(path.join(scratchRoot, 'issues/98'), { recursive: true, force: true });
}

// ---------- session-state cap and writer reservation (#131-#134) ----------
// Task `hook-state-cap`: saveState() (lib.mjs) reserves the session being
// written before ranking the rest, so it always survives its own save, and
// raises the cap from 5 to MAX_SESSIONS. These cases pin that reservation,
// the recency ranking, and the exact cap - all against a private state
// directory, the same `testTaskBudget()` isolation shape, since these cases
// deliberately saturate the file and must not disturb any other block's
// sessions.

async function testStateCap() {
  const { recordWrite, getWrote, once, MAX_SESSIONS } = await import(
    pathToFileUrlHref('lib.mjs')
  );

  const capState = fs.mkdtempSync(path.join(os.tmpdir(), 'loot-hooks-cap-state-'));
  const previousStateDir = process.env.LOOT_HOOK_STATE_DIR;
  process.env.LOOT_HOOK_STATE_DIR = capState;

  function readCapState() {
    return JSON.parse(fs.readFileSync(path.join(capState, '.hook-state.json'), 'utf8'));
  }

  try {
    // #131 - the writer survives its own write at saturation: this is the
    // standalone probe (eight `other-*` writers then one writer, all inside
    // one second), run at MAX_SESSIONS scale. Under the pre-fix prune (no
    // reservation, cap 5) this is exactly the shape that silently dropped
    // `s-stop-budget` on CI (measured 2026-09-16).
    // Which `other-*` ids survive alongside the writer is unspecified under
    // a full tie (plan 4.3) and is not asserted.
    for (let i = 1; i <= MAX_SESSIONS + 8; i++) {
      recordWrite(`other-${i}`, 'app/src/lib/x.ts');
    }
    recordWrite('s-cap-writer', 'app/src/lib/x.ts');
    {
      const wrote = getWrote('s-cap-writer');
      check(
        '#131 writer survives its own write at saturation: its write is intact',
        Object.keys(wrote).length === 1 && wrote['app/src/lib/x.ts'] !== undefined,
        JSON.stringify(wrote)
      );
      const ids = Object.keys(readCapState().sessions);
      check(
        '#131 writer survives its own write at saturation: capped at MAX_SESSIONS, writer present',
        ids.length === MAX_SESSIONS && ids.includes('s-cap-writer'),
        `count=${ids.length} (MAX_SESSIONS=${MAX_SESSIONS}) ids=${JSON.stringify(ids)}`
      );
    }

    // #132 - eviction is by least-recent `at`, and the cap is exact. Seed
    // MAX_SESSIONS hand-made entries with distinct, ascending `at` (e-1
    // oldest), all far in the past; one more write must evict exactly e-1.
    {
      const sessions = {};
      for (let i = 1; i <= MAX_SESSIONS; i++) {
        sessions[`e-${i}`] = { at: 1000000 + i, seen: [], wrote: {} };
      }
      fs.writeFileSync(path.join(capState, '.hook-state.json'), JSON.stringify({ sessions }));
      recordWrite('s-cap-new', 'app/src/lib/x.ts');
      const ids = Object.keys(readCapState().sessions);
      check(
        '#132 eviction is by least-recent at, and the cap is exact',
        !ids.includes('e-1') &&
          ids.includes('e-2') &&
          ids.includes(`e-${MAX_SESSIONS}`) &&
          ids.includes('s-cap-new') &&
          ids.length === MAX_SESSIONS,
        `count=${ids.length} (MAX_SESSIONS=${MAX_SESSIONS}) ids=${JSON.stringify(ids)}`
      );
    }

    // #133 - once() keeps the writer at a tied saturation: this is the Stop
    // hook's actual dedupe path (session-stop.mjs's `once()` calls), which
    // is what really lost `s-stop-budget` on CI. Seed MAX_SESSIONS entries
    // all tied at the current second, so the writer's own save ties with
    // every one of them.
    {
      const now = Math.floor(Date.now() / 1000);
      const sessions = {};
      for (let i = 1; i <= MAX_SESSIONS; i++) {
        sessions[`t-${i}`] = { at: now, seen: [], wrote: {} };
      }
      fs.writeFileSync(path.join(capState, '.hook-state.json'), JSON.stringify({ sessions }));
      const first = once('s-cap-once', 'k');
      const second = once('s-cap-once', 'k');
      check(
        '#133 once() keeps the writer at a tied saturation: seen once, not twice',
        first === true && second === false,
        `first=${first} second=${second}`
      );
    }

    // #134 - end to end: session-stop.mjs reads the retained entry, with the
    // file still saturated by #133's tied entries. Precondition asserted
    // first (the #128 pattern): app/src/lib/x.ts is left dirty by
    // dirtyBaseline() at the end of testCommitGateAsync() and nothing
    // between there and here commits it; if that ever changes, this names
    // the precondition instead of #134 failing mutely.
    {
      const porcelain = gitSh(['status', '--porcelain']);
      check(
        '#134 precondition: app/src/lib/x.ts is dirty in the scratch tree',
        porcelain.includes('app/src/lib/x.ts'),
        porcelain
      );
      recordWrite('s-cap-stop', 'app/src/lib/x.ts');
      const result = runHook(
        'session-stop.mjs',
        {
          session_id: 's-cap-stop',
          cwd: scratchRoot,
          hook_event_name: 'Stop',
          stop_hook_active: false
        },
        { state: capState }
      );
      check(
        '#134 end to end: session-stop.mjs reads the retained entry',
        systemMessage(result).includes('app/src/lib/x.ts'),
        systemMessage(result)
      );
      check(
        '#134 end to end: no decision key',
        !(result.json && Object.prototype.hasOwnProperty.call(result.json, 'decision')),
        JSON.stringify(result.json)
      );
    }
  } finally {
    process.env.LOOT_HOOK_STATE_DIR = previousStateDir;
    fs.rmSync(capState, { recursive: true, force: true });
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
  if (!gitAvailable()) {
    console.log('.claude/hooks/selftest.mjs: skipped (git is not on PATH)');
    return;
  }
  setupScratch();
  try {
    testBashDenyCases();
    testBashSilentCases();
    testOrphanPlan();
    testBlanketStaging();
    testCommitAttribution();
    await testCommitGateAsync();
    testLongCheck();
    testBackgroundCheck();
    testBlindCheck();
    testRtkReaders();
    testEditGuard();
    testEditFollowup();
    await testCheckObserver();
    await testPathKeyPortability();
    testSessionStart();
    await testSessionStop();
    await testTaskBudget();
    await testStateCap();
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

  // #27a - the gate's most important safety property: a cache that was
  // valid a moment ago must stop counting the instant the tree moves.
  appendFile('app/src/lib/x.ts', '// moved since the cached run\n');
  {
    const result = runHook('bash-guard.mjs', bashPayload('git commit -m "chore: x"'));
    check('#27a gate: stale cache denies', isDeny(result), JSON.stringify(result.json));
    check(
      '#27a gate: stale cache reason',
      denyReason(result).includes('has not passed for this working tree'),
      denyReason(result)
    );
  }

  clearCache();
  gitSh(['reset']);
  appendFile('issues/orphan-demo/plan.md', '\nmore plan\n');
  gitSh(['add', 'issues/orphan-demo/plan.md']);
  {
    const result = runHook('bash-guard.mjs', bashPayload('git commit -m "docs: plan"'));
    check('#26 gate: exempt path silent', isSilent(result), result.stdout);
  }

  // #27b - TL2: appending to an exempt path (a handoff) after the cache is
  // armed must not disarm it for a commit that only touches covered files -
  // tree-key.mjs's fingerprint now drops isExempt() rows before hashing, so
  // writing a handoff mid-batch can no longer redden an already-passing gate.
  gitSh(['reset']);
  clearCache();
  {
    const key2 = treeKey();
    writeCache(key2);
    appendFile('issues/orphan-demo/handoff.md', '\nmore handoff\n');
    gitSh(['add', 'app/src/lib/x.ts']);
    const result = runHook('bash-guard.mjs', bashPayload('git commit -m "chore: x"'));
    check(
      '#27b gate: appending to an exempt handoff does not disarm an armed cache',
      isSilent(result),
      result.stdout
    );
    gitSh(['reset']);
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

  // #28a - the bypass is an env prefix, not a word. Talking about it in a
  // commit message used to be enough to skip the gate.
  {
    const result = runHook(
      'bash-guard.mjs',
      bashPayload('git commit -m "feat: add SKIP_CHECK_GATE=1 support"')
    );
    check('#28a prose bypass: still denies', isDeny(result), JSON.stringify(result.json));
  }

  // #59 - `git commit -am` must reach the gate, not just the blanket-stage
  // rule. Proven on a clean tree plus exactly one modified file, so the
  // blanket-stage rule (which needs 2+ dirty paths) cannot be what denies,
  // and with an empty index, so only the unstaged union can supply a path.
  gitSh(['reset']);
  gitSh(['add', '-A']);
  gitCommit('chore: scratch clean');
  clearCache();
  appendFile('app/src/lib/x.ts', '// gate union\n');
  {
    const result = runHook('bash-guard.mjs', bashPayload('git commit -am "chore: x"'));
    check('#59 -am cluster: gate denies', isDeny(result), JSON.stringify(result.json));
    check(
      '#59 -am cluster: gate reason',
      denyReason(result).includes('has not passed for this working tree'),
      denyReason(result)
    );
  }
  {
    const result = runHook('bash-guard.mjs', bashPayload('git commit -m "chore: x"'));
    check('#59 without -a: empty index stays silent', isSilent(result), result.stdout);
  }

  dirtyBaseline();
  gitSh(['reset']);
  clearCache();
}

main();
