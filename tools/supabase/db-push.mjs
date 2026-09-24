/*
  node tools/supabase/db-push.mjs --project test|prod

  Applies every pending migration in supabase/migrations/ to a hosted
  project, then records them in supabase/applied.json. It needs an
  interactive terminal and a typed `yes`, and has no unattended path on
  purpose. The database password comes from SUPABASE_DB_PASSWORD or the
  CLI's own prompt. Procedure: .claude/README.md, "Supabase configuration".
*/
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SUPABASE_CLI,
  parseProjectArg,
  pairMigrations,
  readApplied,
  markApplied
} from './lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const APPLIED = path.join(ROOT, 'supabase', 'applied.json');

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

function runCli(args) {
  const r = spawnSync(process.execPath, [SUPABASE_CLI, ...args], {
    cwd: ROOT,
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
  let target;
  try {
    target = parseProjectArg(process.argv.slice(2));
  } catch (err) {
    fail(err.message);
  }
  const { project, ref } = target;

  if (!(process.stdin.isTTY && process.stdout.isTTY)) {
    fail('db:push needs an interactive terminal; the owner runs it.');
  }

  const migrations = sqlFiles('migrations');
  const { errors } = pairMigrations(migrations, sqlFiles('reversals'));
  if (errors.length) fail(`Migration pairing failed. Nothing pushed.\n${errors.join('\n')}`);
  const applied = readApplied(readFileSync(APPLIED, 'utf8'));

  if (runCli(['db', 'push', '--project-ref', ref, '--dry-run']) !== 0) {
    fail('The dry run failed. Nothing pushed.');
  }
  if (!(await confirm(`Type yes to push these migrations to ${project} (${ref}): `))) {
    fail('Nothing pushed.');
  }
  const status = runCli(['db', 'push', '--project-ref', ref]);
  if (status !== 0) process.exit(status);

  // A push applies every pending migration in order or fails, so after a
  // success every local file is applied on this project.
  const next = markApplied(applied, project, migrations);
  writeFileSync(APPLIED, `${JSON.stringify(next, null, 2)}\n`);
  console.log('Amend supabase/applied.json into the release commit before the git push.');
}

main().catch((err) => fail(err.message));
