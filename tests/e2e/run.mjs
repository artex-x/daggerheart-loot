/* Layer 4: the real adapter and the account flows on the hosted test
 * project - `npm run e2e`. In order: the variables, the project guard, the
 * Node probe, the sweep and the member, the cloud contract over the real
 * adapter, the configured build, the page probe and the flows, then the
 * cleanup, whatever happened. docs/specs/COVERAGE.md, "Test layers". */

import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import puppeteer from 'puppeteer';
import { adminClient, clearPrefs, ensureUser, revokeMember, sweep } from './admin.mjs';
import { runRealContract } from './contract.mjs';
import { runFlows } from './flows.mjs';
import { assertTestProject, buildEnv, missingVars, redactAddresses } from './lib.mjs';
import { probeNode } from './probe.mjs';

const ROOT = join(import.meta.dirname, '..', '..');
const DIST = join(ROOT, 'dist');
const { assertBuilt, serveDist } = createRequire(import.meta.url)('../app/serve.js');

const env = process.env;
let admin = null;
let browser = null;
let server = null;
let failure = null;

try {
  const missing = missingVars(env);
  if (missing.length) throw new Error('e2e: not set: ' + missing.join(', '));
  assertTestProject(env.E2E_SUPABASE_URL);
  console.log('e2e: variables and the test project ok');

  await probeNode(env);
  console.log('e2e: probe ok (node)');

  admin = adminClient(env);
  await sweep(admin, env.E2E_USER_EMAIL);
  const member = await ensureUser(admin, env.E2E_USER_EMAIL);
  /* No row, so F2 sees a first sign-in seed it. */
  await clearPrefs(admin, member.id);
  console.log('e2e: sweep and member ok');

  await runRealContract(env, admin, member);
  console.log('e2e: contract ok (8 cases)');

  /* The deploy job's own build, configured for the test project; `dist/`
     is left so until `npm run build` or `check:built` rebuilds it. */
  /* On Windows `npm` is `npm.cmd`, which only a shell runs (ENOENT without one). */
  const build = spawnSync('npm', ['run', 'build'], {
    cwd: ROOT,
    stdio: 'inherit',
    env: buildEnv(env),
    shell: process.platform === 'win32'
  });
  if (build.status !== 0) throw new Error('e2e: the configured build failed');
  assertBuilt(DIST, 'dist/');
  server = await serveDist(DIST);
  const base = 'http://127.0.0.1:' + String(server.address().port) + '/';
  console.log('e2e: configured build ok');

  /* tests/app/lib.js's arguments; requiring it would demand dist-test/. */
  browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  await runFlows({ env, admin, member, browser, base });
} catch (e) {
  failure = e instanceof Error ? e.message : String(e);
} finally {
  if (admin) {
    try {
      await sweep(admin, env.E2E_USER_EMAIL);
      await revokeMember(env, admin, env.E2E_USER_EMAIL);
      console.log('e2e: cleanup ok');
    } catch (e) {
      failure ??= 'cleanup: ' + (e instanceof Error ? e.message : String(e));
    }
  }
  await browser?.close();
  server?.close();
}

console.log(
  failure === null
    ? 'e2e: PASS'
    : 'e2e: FAIL - ' + redactAddresses(failure.replace(/^e2e:? /, ''))
);
process.exit(failure === null ? 0 : 1);
