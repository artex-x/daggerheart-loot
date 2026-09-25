/*
  node tools/supabase/db-push.mjs --project test|prod [--yes]

  Applies every pending migration in supabase/migrations/ to a hosted
  project. This is the manual path: CI applies migrations itself
  (`migrate-test` before every E2E run, `migrate-prod` at a push to main).
  Two callers remain: an agent's push to the test project (`--project test
  --yes`, with SUPABASE_DB_PASSWORD_TEST set) and the owner's interactive
  push, the production fallback while CI is broken, which needs a terminal
  and a typed `yes`; its password comes from SUPABASE_DB_PASSWORD or the
  CLI's own prompt. Procedure: .claude/README.md, "Supabase configuration".
*/
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SUPABASE_CLI, parseProjectArg, pairMigrations } from './lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function fail(message) {
  console.error(message);
  process.exit(1);
}

function sqlFiles(dir) {
  const full = path.join(ROOT, 'supabase', dir);
  if (!existsSync(full)) return [];
  return readdirSync(full)
    .filter((n) => n.endsWith('.sql'))
    .sort();
}

function runCli(args, env = process.env) {
  const r = spawnSync(process.execPath, [SUPABASE_CLI, ...args], {
    cwd: ROOT,
    env,
    stdio: 'inherit'
  });
  if (r.error) fail(`The Supabase CLI did not start: ${r.error.message}`);
  return r.status ?? 1;
}

async function confirm(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(question)).trim() === 'yes';
  } finally {
    rl.close();
  }
}

async function main() {
  const argv = process.argv.slice(2);
  let target;
  try {
    target = parseProjectArg(argv);
  } catch (err) {
    fail(err.message);
  }
  const { project, ref } = target;
  const unattended = argv.includes('--yes');

  let env = process.env;
  if (unattended) {
    if (project !== 'test') {
      fail("--yes is for the test project; production is CI's or a typed yes.");
    }
    const password = process.env.SUPABASE_DB_PASSWORD_TEST;
    if (!password) {
      fail('SUPABASE_DB_PASSWORD_TEST is not set; --yes needs the test database password.');
    }
    env = { ...process.env, SUPABASE_DB_PASSWORD: password };
  } else if (!(process.stdin.isTTY && process.stdout.isTTY)) {
    fail('db:push needs an interactive terminal; the owner runs it.');
  }

  const { errors } = pairMigrations(sqlFiles('migrations'), sqlFiles('reversals'));
  if (errors.length) fail(`Migration pairing failed. Nothing pushed.\n${errors.join('\n')}`);

  if (runCli(['db', 'push', '--project-ref', ref, '--dry-run'], env) !== 0) {
    fail('The dry run failed. Nothing pushed.');
  }
  if (
    !unattended &&
    !(await confirm(`Type yes to push these migrations to ${project} (${ref}): `))
  ) {
    fail('Nothing pushed.');
  }
  const pushArgs = ['db', 'push', '--project-ref', ref];
  if (unattended) pushArgs.push('--yes');
  const status = runCli(pushArgs, env);
  if (status !== 0) process.exit(status);
  console.log('Done. CI applies migrations on a push to main; this run was the manual path.');
}

main().catch((err) => fail(err.message));
