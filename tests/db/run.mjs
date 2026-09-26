/*
  `npm run check:db`: the database layer (layer 3) against a local Supabase
  stack in Docker. Starts only the database container when the stack is
  down, resets it to supabase/migrations/, runs every tests/db/*.test.mjs
  and prints one final `check:db: PASS`, `check:db: FAIL` or `check:db: BUSY`
  line, which .claude/hooks/check-observer.mjs reads to arm the commit gate.
  It holds the local stack lock for the run and arms its gate by its own exit.
  On Windows run it through the PowerShell tool: Git Bash hangs on docker.
  See docs/specs/COVERAGE.md, "Suites".
*/
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCAL_STACK_EXCLUDES, SUPABASE_CLI, envRefs } from '../../tools/supabase/lib.mjs';
import {
  holderText,
  releaseStackLock,
  takeStackLock
} from '../../.claude/hooks/stack-lock.mjs';
import { armCredit, beginCredit } from '../../.claude/hooks/gate-credit.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const BUSY = 'BUSY';

function finish(status) {
  if (status === BUSY) {
    console.log('check:db: BUSY');
    process.exit(3);
  }
  if (status === 0) armCredit('check-db');
  console.log(status === 0 ? 'check:db: PASS' : 'check:db: FAIL');
  process.exit(status);
}

function cli(args, env, capture = false) {
  return spawnSync(process.execPath, [SUPABASE_CLI, ...args], {
    cwd: ROOT,
    env,
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit'
  });
}

/** The local database URL from `supabase status -o json`, or null when the
 * stack is down. The JSON also holds the local keys; nothing of it is
 * printed. */
function dbUrl(env) {
  const r = cli(['status', '-o', 'json'], env, true);
  if (r.error || r.status !== 0) return null;
  try {
    const start = r.stdout.indexOf('{');
    const status = JSON.parse(r.stdout.slice(start));
    return typeof status.DB_URL === 'string' ? status.DB_URL : null;
  } catch {
    return null;
  }
}

function main() {
  const lock = takeStackLock({ command: 'npm run check:db' });
  if (!lock.ok) {
    console.log(
      `check:db: the local stack is held by ${holderText(lock.lock)}; it is free when that run ends, or 45 minutes after it started.`
    );
    return BUSY;
  }
  // After the lock: a BUSY run must not replace the running suite's key.
  beginCredit('check-db');
  const onSignal = () => {
    releaseStackLock(lock.nonce);
    console.log('check:db: FAIL');
    process.exit(130);
  };
  process.once('SIGINT', onSignal);
  process.once('SIGTERM', onSignal);
  try {
    return runSuite();
  } finally {
    releaseStackLock(lock.nonce);
    process.off('SIGINT', onSignal);
    process.off('SIGTERM', onSignal);
  }
}

function runSuite() {
  const docker = spawnSync('docker', ['info'], { stdio: 'ignore', timeout: 20000 });
  if (docker.error || docker.status !== 0) {
    console.error(
      'Docker did not answer in 20 s. Start Rancher Desktop; on Windows run check:db through the PowerShell tool.'
    );
    return 1;
  }

  // The local stack never serves OAuth, so the provider credentials that
  // config.toml reads from the environment get a placeholder here.
  const env = { ...process.env };
  const toml = readFileSync(path.join(ROOT, 'supabase', 'config.toml'), 'utf8');
  for (const name of envRefs(toml)) {
    if (!env[name]) env[name] = 'unused-local-stack';
  }

  let url = dbUrl(env);
  if (!url) {
    const start = cli(['start', '-x', LOCAL_STACK_EXCLUDES.join(',')], env);
    if (start.error || start.status !== 0) {
      console.error('supabase start failed.');
      return 1;
    }
    url = dbUrl(env);
  }
  if (!url) {
    console.error('supabase status did not report DB_URL.');
    return 1;
  }

  const reset = cli(['db', 'reset', '--local'], env);
  if (reset.error || reset.status !== 0) {
    console.error('supabase db reset --local failed.');
    return 1;
  }

  const files = readdirSync(HERE)
    .filter((n) => n.endsWith('.test.mjs'))
    .sort()
    .map((n) => path.join('tests', 'db', n));
  // One file at a time: every file shares the one local database.
  const tests = spawnSync(process.execPath, ['--test', '--test-concurrency=1', ...files], {
    cwd: ROOT,
    env: { ...env, DHLOOT_DB_URL: url },
    stdio: 'inherit'
  });
  if (tests.error) return 1;
  return tests.status ?? 1;
}

finish(main());
