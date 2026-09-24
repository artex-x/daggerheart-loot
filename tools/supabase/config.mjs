/*
  node tools/supabase/config.mjs diff|push --project test|prod [--env-file <path>]

  `diff` is read-only and runs anywhere; it exits 2 on drift, which is any
  difference outside lib.mjs's NOT_OWNED rows. `push` writes the hosted
  project's configuration: it needs an interactive terminal and a typed
  `yes`, and has no unattended path on purpose. The env file (default supabase/.env) feeds
  the `env(...)` references of config.toml to the CLI; no value is printed.
  Procedure: .claude/README.md, "Supabase configuration".
*/
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SUPABASE_CLI,
  parseProjectArg,
  diffArgs,
  envRefs,
  parseEnvFile,
  missingEnv,
  splitDrift,
  driftSummary
} from './lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function fail(message) {
  console.error(message);
  process.exit(1);
}

function loadEnv(envFile) {
  const file = path.resolve(ROOT, envFile ?? 'supabase/.env');
  if (!existsSync(file)) {
    if (envFile) fail(`The env file ${envFile} does not exist.`);
    return { ...process.env };
  }
  return { ...process.env, ...parseEnvFile(readFileSync(file, 'utf8')) };
}

function runCli(args, env) {
  const r = spawnSync(process.execPath, [SUPABASE_CLI, ...args], {
    cwd: ROOT,
    env,
    stdio: 'inherit'
  });
  if (r.error) fail(`The Supabase CLI did not start: ${r.error.message}`);
  return r.status ?? 1;
}

/** Runs `config diff`, prints its JSON and then `drift: none (N not-owned)`
 * or `drift: N` with one owned path per line. Returns `{ status }`: 0 when
 * clean, 2 on drift, 1 when the CLI failed or printed no JSON. */
function diffConfig(ref, env) {
  const r = spawnSync(process.execPath, [SUPABASE_CLI, ...diffArgs(ref)], {
    cwd: ROOT,
    env,
    stdio: ['ignore', 'pipe', 'inherit'],
    encoding: 'utf8'
  });
  if (r.error) fail(`The Supabase CLI did not start: ${r.error.message}`);
  process.stdout.write(r.stdout ?? '');
  if (r.status !== 0) return { status: 1 };
  let report;
  try {
    report = JSON.parse(r.stdout);
  } catch {
    console.error('The Supabase CLI printed no JSON diff.');
    return { status: 1 };
  }
  const split = splitDrift(report.changes);
  console.log(driftSummary(split));
  for (const change of split.drift) {
    console.log(`  ${change.class} ${[].concat(change.path).join('.')}`);
  }
  return { status: split.drift.length ? 2 : 0 };
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
  const [mode, ...rest] = process.argv.slice(2);
  if (mode !== 'diff' && mode !== 'push') {
    fail(
      'Usage: node tools/supabase/config.mjs diff|push --project test|prod [--env-file <path>]'
    );
  }
  let target;
  try {
    target = parseProjectArg(rest);
  } catch (err) {
    fail(err.message);
  }
  const { project, ref, envFile } = target;

  if (mode === 'push' && !(process.stdin.isTTY && process.stdout.isTTY)) {
    fail('config:push needs an interactive terminal; the owner runs it.');
  }

  const env = loadEnv(envFile);
  if (mode === 'push' && project === 'prod') {
    const toml = readFileSync(path.join(ROOT, 'supabase', 'config.toml'), 'utf8');
    const missing = missingEnv(envRefs(toml), env);
    if (missing.length) {
      fail(
        `These variables are not set: ${missing.join(', ')}. Pass --env-file <path> to the .env that holds them. Nothing pushed.`
      );
    }
  }

  const diff = diffConfig(ref, env);
  if (mode === 'diff') process.exit(diff.status);
  if (diff.status === 1) fail('The diff failed. Nothing pushed.');

  if (!(await confirm(`Type yes to push this configuration to ${project} (${ref}): `))) {
    fail('Nothing pushed.');
  }
  process.exit(runCli(['config', 'push', '--project-ref', ref], env));
}

main().catch((err) => fail(err.message));
