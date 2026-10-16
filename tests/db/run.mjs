/*
  `npm run check:db`: the database layer (layer 3) against a local Supabase
  stack in Docker. Starts the database, Auth, Realtime, Storage and Kong when
  the stack is down, or restarts a stack that runs without one of them;
  resets it to supabase/migrations/, runs every tests/db/*.test.mjs
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
import {
  LOCAL_STACK_EXCLUDES,
  envRefs,
  failLine,
  localProjectId,
  missingContainers,
  resetLocal,
  resetTimeoutMs,
  runTimed,
  spanText,
  stackAdvice,
  stackContainers,
  stackTimeoutMs,
  stalledText,
  supabaseCli
} from '../../tools/supabase/lib.mjs';
import { runningContainer } from '../../tools/supabase/restore.mjs';
import {
  holderText,
  releaseStackLock,
  takeStackLock
} from '../../.claude/hooks/stack-lock.mjs';
import { armCredit, beginCredit } from '../../.claude/hooks/gate-credit.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const BUSY = 'BUSY';
/* The run already printed its one FAIL line. */
const SAID = 'SAID';

function finish(status) {
  if (status === BUSY) {
    console.log('check:db: BUSY');
    process.exit(3);
  }
  if (status === SAID) process.exit(1);
  if (status === 0) armCredit('check-db');
  console.log(status === 0 ? 'check:db: PASS' : 'check:db: FAIL');
  process.exit(status);
}

/* A CLI call stopped after stackTimeoutMs(env): `supabase start` once waited 15 minutes on a
   `docker container inspect` with every container healthy (2026-10-15). `status` is piped
   (its JSON is read); `start` and `stop` show their output, so a pull shows progress and no
   grandchild holds a pipe of this process. Returns runTimed's `{ failure, seconds, result }`. */
function cli(bin, args, env, capture = false) {
  return runTimed(bin, args, {
    cwd: ROOT,
    env,
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'inherit', 'inherit'],
    timeout: stackTimeoutMs(env)
  });
}

/** Returns the stack remedy for a CLI call that ran out of stackTimeoutMs(env). */
function stalled(what, env) {
  return stackAdvice(stalledText(what, env));
}

/** Returns `{ db, api, anonKey, jwtSecret }` from `supabase status -o
 * json`, `'timeout'`, or null when the stack is down or a value is missing.
 * The keys and the secret are named only while Auth runs; nothing of them is
 * printed. */
function stackStatus(bin, env) {
  const { failure, result: r } = cli(bin, ['status', '-o', 'json'], env, true);
  if (failure === 'timeout') return 'timeout';
  if (failure) return null;
  try {
    const start = r.stdout.indexOf('{');
    const s = JSON.parse(r.stdout.slice(start));
    const out = { db: s.DB_URL, api: s.API_URL, anonKey: s.ANON_KEY, jwtSecret: s.JWT_SECRET };
    return Object.values(out).every((v) => typeof v === 'string' && v) ? out : null;
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

/* Starts the stack when it is down or lacks a service, and answers `{ status }`, or
   `{ code }` after the run's FAIL line. */
function readyStack(bin, env, toml) {
  // A stack another run started without Auth, Realtime or Storage (an older
  // checkout's excludes) is started again with this list.
  const id = localProjectId(toml);
  const containers = stackContainers(id);
  const isRunning = (name) => runningContainer(name) !== null;
  const complete = missingContainers(containers, isRunning).length === 0;
  let status = complete ? stackStatus(bin, env) : null;
  if (status === 'timeout') {
    console.error(stalled('supabase status', env));
    return { code: 1 };
  }
  if (!status) {
    if (runningContainer(`supabase_db_${id}`)) {
      const stop = cli(bin, ['stop'], env);
      if (stop.failure) {
        console.error(
          stop.failure === 'timeout' ? stalled('supabase stop', env) : 'supabase stop failed.'
        );
        return { code: 1 };
      }
    }
    console.log('check:db: starting the local stack (supabase start)');
    const start = cli(bin, ['start', '-x', LOCAL_STACK_EXCLUDES.join(',')], env);
    if (start.failure === 'timeout') {
      console.error(stalled('supabase start', env));
      return { code: 1 };
    }
    if (start.failure) {
      console.error('supabase start failed.');
      return { code: 1 };
    }
    status = stackStatus(bin, env);
  }
  if (status === 'timeout') {
    console.error(stalled('supabase status', env));
    return { code: 1 };
  }
  if (!status) {
    console.error('supabase status did not report DB_URL, API_URL, ANON_KEY and JWT_SECRET.');
    return { code: 1 };
  }

  // A started stack can lack a container whose image is missing; the reset
  // then waited about 20 minutes for it with no output (2026-10-02).
  const missing = missingContainers(containers, isRunning);
  if (missing.length > 0) {
    console.error(
      stackAdvice(`${missing.join(', ')} ${missing.length > 1 ? 'are' : 'is'} not running`)
    );
    return { code: 1 };
  }
  return { status };
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
  let bin;
  try {
    bin = supabaseCli(env);
  } catch (e) {
    console.log(failLine('check:db', e));
    return SAID;
  }

  let ready;
  try {
    ready = readyStack(bin, env, toml);
  } catch (e) {
    // runningContainer's `docker ps` ran out of its time.
    console.log(failLine('check:db', e));
    return SAID;
  }
  if (!ready.status) return ready.code;
  const status = ready.status;

  console.log('check:db: db reset --local');
  const reset = resetLocal({ env, cwd: ROOT, stdio: 'inherit' });
  if (reset.failure === 'timeout') {
    console.error(
      stackAdvice(`db reset --local did not finish in ${spanText(resetTimeoutMs(env))}`)
    );
    return 1;
  }
  if (reset.failure) {
    console.error('supabase db reset --local failed.');
    return 1;
  }
  console.log(`check:db: db reset --local took ${reset.seconds} s`);

  const files = readdirSync(HERE)
    .filter((n) => n.endsWith('.test.mjs'))
    .sort()
    .map((n) => path.join('tests', 'db', n));
  // One file at a time: every file shares the one local database.
  const tests = spawnSync(process.execPath, ['--test', '--test-concurrency=1', ...files], {
    cwd: ROOT,
    env: {
      ...env,
      DHLOOT_DB_URL: status.db,
      DHLOOT_API_URL: status.api,
      DHLOOT_ANON_KEY: status.anonKey,
      DHLOOT_JWT_SECRET: status.jwtSecret
    },
    stdio: 'inherit'
  });
  if (tests.error) return 1;
  return tests.status ?? 1;
}

finish(main());
