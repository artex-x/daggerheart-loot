// CI credit: arms the commit gates of the checkout that holds this file from
// a green CI run of the same tree. The orchestrator runs it once, in the
// background, after a push of a task branch, and again at closeout after the
// squash. Every fact comes from GitHub through the authenticated `gh` CLI,
// never from the caller, so bash-guard.mjs rule 2v judges only its overrides.
// docs/decisions/2026-10-21-a-task-branch-pushes-every-batch-a-green-ci-run-gates-main.md
// is the decision; .claude/README.md, "CI credit", is the procedure.
//
// CLI: `node <checkout>/.claude/hooks/ci-credit.mjs <sha> [--run <id>]`.
// `--e2e-rule` is CI's `changes` job: it prints `e2e=true` or `e2e=false`
// for GITHUB_EVENT_NAME, GITHUB_REF and GITHUB_SHA, by the same rule
// (`e2eRuns`) that the credit applies to a skipped `e2e`.
// Exit 0: armed. Exit 1: refused, one reason per line, nothing written.
// Exit 2: usage. The checkout is the one that holds this file (repoRoot()),
// never the session's cwd, which is the main checkout and moves on a `cd`.
// LOOT_GH_CMD (a JSON argv prefix replacing `gh`) exists for the selftest;
// bash-guard.mjs rule 2v denies a run that sets it or LOOT_HOOK_ROOT.

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { repoRoot } from './lib.mjs';
import {
  commitKey,
  commitRows,
  readCache,
  rowPath,
  treeRows,
  writeCache
} from './tree-key.mjs';

export const WORKFLOW_PATH = '.github/workflows/ci.yml';

/** The jobs of ci.yml that must each conclude `success`; tests/derived.js
 * keeps this list equal to ci.yml's job ids and browser matrix. */
export const REQUIRED_JOBS = Object.freeze([
  'changes',
  'check',
  'browser (1)',
  'browser (2)',
  'browser (3)',
  'browser (4)',
  'browser (5)',
  'db',
  'e2e',
  'audit',
  'secrets'
]);

// A push run appeared 6-8 min after its push on 2026-10-21; the owner's
// rule is to wait for it, never to dispatch by hand.
const FIND_TIMEOUT_MS = 600000;
const FIND_INTERVAL_MS = 10000;

/** True for a path whose change cannot move the hosted E2E: `.claude/`,
 * `issues/`, `docs/` but `docs/fixtures/`, and any `*.md` file. */
export function isE2eFree(p) {
  if (p.startsWith('.claude/') || p.startsWith('issues/') || p.endsWith('.md')) return true;
  return p.startsWith('docs/') && !p.startsWith('docs/fixtures/');
}

/** True when CI's `e2e` job must run: always but for a push of a branch
 * other than `main` whose every path changed since its merge base with
 * `origin/main` is E2E-free. `paths` null (the diff could not be read) or
 * empty runs it. */
export function e2eRuns({ event, ref, paths }) {
  if (event !== 'push' || ref === 'refs/heads/main') return true;
  if (!Array.isArray(paths) || paths.length === 0) return true;
  return !paths.every(isE2eFree);
}

/** Returns the paths changed between the merge base of `sha` and
 * `origin/main`, and `sha`, or null. `--no-renames` lists both sides of a
 * move, so a file moved from `app/` into `docs/` still names `app/`. */
export function changedSinceMain(sha, checkout) {
  const base = git(['merge-base', 'origin/main', sha], checkout);
  if (base.status !== 0 || !base.stdout.trim()) return null;
  const diff = git(['diff', '--name-only', '--no-renames', base.stdout.trim(), sha], checkout);
  if (diff.status !== 0) return null;
  return diff.stdout.split('\n').filter(Boolean);
}

const RERUN_CAUSES = new Set(['failure', 'cancelled', 'timed_out']);

/** Returns the reasons that the run (`gh api .../actions/runs/<id>`) and its
 * latest attempt's jobs (`.../jobs?filter=latest`) do not credit commit
 * `sha`; none means the run counts. `e2eSkip`: the path rule says `e2e`
 * skips, so a skipped `e2e` counts. `firstJobs`: the jobs of attempt 1,
 * read for a run at attempt 2: one re-run of a failed `e2e` counts when
 * every other required job passed in attempt 1. */
export function verifyRun(run, jobs, sha, { e2eSkip = false, firstJobs = null } = {}) {
  const reasons = [];
  if (!run || typeof run !== 'object') return ['the run could not be read'];
  if (run.path !== WORKFLOW_PATH) {
    reasons.push(`the run is of ${run.path || 'an unknown workflow'}, not ${WORKFLOW_PATH}`);
  }
  const head = run.head_repository?.full_name;
  const repo = run.repository?.full_name;
  if (!head || !repo || head !== repo) {
    reasons.push(`the run's head repository ${head || 'unknown'} is not ${repo || 'this one'}`);
  }
  if (run.event !== 'push' && run.event !== 'workflow_dispatch') {
    reasons.push(`the run's event is ${run.event || 'unknown'}, not push or workflow_dispatch`);
  }
  if (run.status !== 'completed')
    reasons.push(`the run is ${run.status || 'in an unknown state'}`);
  else if (run.conclusion !== 'success') reasons.push(`the run concluded ${run.conclusion}`);
  if (run.head_sha !== sha)
    reasons.push(`the run tested ${run.head_sha || 'no commit'}, not ${sha}`);
  const list = Array.isArray(jobs) ? jobs : [];
  for (const name of REQUIRED_JOBS) {
    const job = list.find((j) => j && j.name === name);
    if (!job) reasons.push(`the job ${name} is not in the run`);
    else if (name === 'e2e' && job.conclusion === 'skipped' && e2eSkip) continue;
    else if (job.conclusion !== 'success') {
      const why =
        name === 'e2e' && job.conclusion === 'skipped' ? ' and the path rule says it runs' : '';
      reasons.push(
        `the job ${name} concluded ${job.conclusion || job.status || 'nothing'}${why}`
      );
    }
  }
  const attempt = Number(run.run_attempt || 1);
  if (attempt > 2) {
    reasons.push(
      `the run is at attempt ${attempt}; one re-run of a failed e2e is the most that counts`
    );
  } else if (attempt === 2) {
    const first = Array.isArray(firstJobs) ? firstJobs : null;
    if (!first) reasons.push('the jobs of attempt 1 could not be read');
    else {
      for (const name of REQUIRED_JOBS) {
        const job = first.find((j) => j && j.name === name);
        const conclusion = job ? job.conclusion : null;
        if (name === 'e2e') {
          if (!RERUN_CAUSES.has(conclusion)) {
            reasons.push(
              `attempt 1's e2e concluded ${conclusion || 'nothing'}, not a failure to re-run`
            );
          }
        } else if (conclusion !== 'success') {
          reasons.push(
            `attempt 1's ${name} concluded ${conclusion || 'nothing'}; only a failed e2e may be re-run`
          );
        }
      }
    }
  }
  return reasons;
}

/** Returns the paths whose rows differ between two row lists. */
export function differingPaths(a, b) {
  const left = new Set(a);
  const right = new Set(b);
  const paths = new Set();
  for (const row of a) if (!right.has(row)) paths.add(rowPath(row));
  for (const row of b) if (!left.has(row)) paths.add(rowPath(row));
  return [...paths].sort();
}

function ghCommand() {
  try {
    const parsed = JSON.parse(process.env.LOOT_GH_CMD || 'null');
    if (Array.isArray(parsed) && parsed.length && parsed.every((s) => typeof s === 'string')) {
      return parsed;
    }
  } catch {
    // an unreadable override means the real binary
  }
  return ['gh'];
}

function gh(args, checkout, stdio = 'pipe') {
  const [program, ...prefix] = ghCommand();
  return spawnSync(program, [...prefix, ...args], {
    cwd: checkout,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    stdio,
    windowsHide: true
  });
}

function ghJson(args, checkout) {
  const r = gh(args, checkout);
  if (r.error) throw new Error(`gh did not start (${r.error.code || r.error.message})`);
  if (r.status !== 0) {
    const first = (r.stderr || '').trim().split('\n')[0] || `exit ${r.status}`;
    throw new Error(`gh ${args.slice(0, 2).join(' ')} failed: ${first}`);
  }
  return JSON.parse(r.stdout);
}

function git(args, checkout, extra = {}) {
  return spawnSync('git', args, {
    cwd: checkout,
    encoding: 'utf8',
    windowsHide: true,
    ...extra
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Returns the id of the newest run in `runs` (`gh run list` rows) made by a
 * push or a dispatch, or null: a pull request run does not count, and push
 * and dispatch runs of one branch share a concurrency group, so only the
 * newest can survive. */
export function newestRun(runs) {
  const rows = (Array.isArray(runs) ? runs : []).filter(
    (r) => r && r.databaseId && (r.event === 'push' || r.event === 'workflow_dispatch')
  );
  rows.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  return rows.length ? String(rows[0].databaseId) : null;
}

/** Returns the id of the newest ci.yml push or dispatch run of `sha`,
 * waiting up to FIND_TIMEOUT_MS (600 s) for the trigger; null when there
 * is none. */
async function findRun(sha, checkout) {
  const deadline = Date.now() + FIND_TIMEOUT_MS;
  for (;;) {
    const id = newestRun(
      ghJson(
        [
          'run',
          'list',
          '--workflow',
          'ci.yml',
          '--commit',
          sha,
          '--json',
          'databaseId,event,createdAt',
          '--limit',
          '20'
        ],
        checkout
      )
    );
    if (id !== null) return id;
    if (Date.now() + FIND_INTERVAL_MS > deadline) return null;
    await sleep(FIND_INTERVAL_MS);
  }
}

function say(line) {
  process.stdout.write(`${line}\n`);
}

function refuse(reasons) {
  for (const reason of reasons) say(`ci credit: refused - ${reason}`);
  return 1;
}

/** CI's `changes` job: `e2e=<bool>` for the pushed commit. */
function e2eRuleCli() {
  const sha = process.env.GITHUB_SHA || 'HEAD';
  const paths = changedSinceMain(sha, repoRoot());
  const runs = e2eRuns({
    event: process.env.GITHUB_EVENT_NAME,
    ref: process.env.GITHUB_REF,
    paths
  });
  say(`e2e=${runs}`);
  return 0;
}

async function main(argv) {
  if (argv.length === 1 && argv[0] === '--e2e-rule') return e2eRuleCli();
  const positional = [];
  let runId = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--run') runId = argv[++i] ?? '';
    else if (argv[i].startsWith('--run=')) runId = argv[i].slice('--run='.length);
    else positional.push(argv[i]);
  }
  if (positional.length !== 1 || runId === '' || (runId !== null && !/^\d+$/.test(runId))) {
    say('usage: node <checkout>/.claude/hooks/ci-credit.mjs <sha> [--run <id>]');
    return 2;
  }
  const checkout = repoRoot();
  const resolved = git(
    ['rev-parse', '--verify', '--quiet', `${positional[0]}^{commit}`],
    checkout
  );
  const sha = resolved.status === 0 ? resolved.stdout.trim() : '';
  if (!sha) return refuse([`${positional[0]} is not a commit in ${checkout}`]);

  let run;
  let jobs;
  let firstJobs = null;
  try {
    if (runId === null) {
      runId = await findRun(sha, checkout);
      if (runId === null) {
        return refuse([
          `no ci.yml push run of ${sha.slice(0, 12)} appeared within 600 s; push the branch (git push -u origin <branch>) if it is not pushed, else run this again; never dispatch a pushed commit by hand`
        ]);
      }
    }
    run = ghJson(['api', `repos/{owner}/{repo}/actions/runs/${runId}`], checkout);
    if (run.status !== 'completed') {
      say(`ci credit: waiting on run ${runId}`);
      gh(['run', 'watch', runId, '--exit-status', '--interval', '30'], checkout, 'ignore');
      run = ghJson(['api', `repos/{owner}/{repo}/actions/runs/${runId}`], checkout);
    }
    jobs = ghJson(
      ['api', `repos/{owner}/{repo}/actions/runs/${runId}/jobs?filter=latest&per_page=100`],
      checkout
    ).jobs;
    if (Number(run.run_attempt || 1) === 2) {
      firstJobs = ghJson(
        ['api', `repos/{owner}/{repo}/actions/runs/${runId}/attempts/1/jobs?per_page=100`],
        checkout
      ).jobs;
    }
  } catch (error) {
    return refuse([
      `${error.message}; nothing is armed (offline path: .claude/README.md, "CI credit")`
    ]);
  }

  git(['fetch', '--quiet', 'origin', 'main'], checkout, {
    timeout: 60000,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
  });
  const e2eSkip = !e2eRuns({
    event: run.event,
    ref: run.head_branch ? `refs/heads/${run.head_branch}` : null,
    paths: changedSinceMain(sha, checkout)
  });
  const reasons = verifyRun(run, jobs, sha, { e2eSkip, firstJobs });
  if (reasons.length) return refuse(reasons.map((r) => `${r} (run ${runId})`));

  // A credit must prove a pass, so a key that cannot be read refuses.
  const committed = commitRows(sha, checkout);
  const current = treeRows(checkout);
  const key = commitKey(sha, checkout);
  if (committed === null || current === null || key === null) {
    return refuse(['the tree key of the commit or of the working tree could not be read']);
  }
  const paths = differingPaths(committed, current);
  if (paths.length) {
    const shown = paths.slice(0, 20).join(', ') + (paths.length > 20 ? ', ...' : '');
    return refuse([`the working tree differs from ${sha.slice(0, 12)} in ${shown}`]);
  }

  const ci = git(['diff', '--quiet', 'origin/main', sha, '--', WORKFLOW_PATH], checkout);
  if (ci.status === 1) say('ci credit: note - ci.yml differs from origin/main');

  for (const name of ['.check-cache.json', '.check-db-cache.json']) {
    writeCache(key, name, `ci run ${runId}`, 'ci', checkout);
    const written = readCache(name, checkout);
    if (!written || written.key !== key || written.by !== 'ci') {
      return refuse([`${name} could not be written`]);
    }
  }
  say(`ci credit: armed for ${sha.slice(0, 12)} (run ${runId})`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(
    (code) => {
      process.exitCode = code;
    },
    (error) => {
      say(`ci credit: refused - ${error.message}`);
      process.exitCode = 1;
    }
  );
}
