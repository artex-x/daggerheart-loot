// CLI of the fast pre-check `npm run check:fast`: the cheap failures of the
// gate before an agent pays for `npm run check:1` and `check:2`. It arms
// nothing. The plan of what runs is fastPlan in lib.mjs; the procedure is
// .claude/README.md, "Run a long check", "The fast pre-check".
//
//   node tools/check/fast.mjs [--base=<rev>]   changes against <rev>, default HEAD

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fastPlan } from './lib.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..');

function git(args) {
  const r = spawnSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024
  });
  if (r.error || r.status !== 0) {
    throw new Error(`check:fast: git ${args.join(' ')} failed`);
  }
  return r.stdout.split('\n').filter(Boolean);
}

/** Returns the changed and untracked paths against `base` that exist. */
function changedPaths(base) {
  const paths = [
    ...git(['diff', '--name-only', base]),
    ...git(['ls-files', '--others', '--exclude-standard'])
  ];
  return [...new Set(paths)].filter((p) => existsSync(path.join(ROOT, p)));
}

/** Runs one step and returns its exit code; a spawn that cannot start is 1. */
function step(name, run) {
  const started = Date.now();
  const r = run();
  const code = r.error ? 1 : r.status === null ? 1 : r.status;
  const seconds = Math.round((Date.now() - started) / 1000);
  if (code === 0) console.log(`check:fast: ${name} passed (${seconds} s)`);
  else console.log(`check:fast: ${name} failed (exit ${code})`);
  return code;
}

function main(argv) {
  const baseArg = argv.find((a) => a.startsWith('--base='));
  const base = baseArg ? baseArg.slice('--base='.length) : 'HEAD';
  const started = Date.now();
  const plan = fastPlan(changedPaths(base));
  const steps = [
    [
      'stages',
      () =>
        spawnSync(
          process.execPath,
          ['tools/check/run.mjs', '--only=format,typecheck,test:golden'],
          { cwd: ROOT, stdio: 'inherit' }
        )
    ]
  ];
  if (plan.related.length > 0) {
    // No shell: the argument list is not bound by cmd.exe's 8191 characters.
    const args = [
      path.join(ROOT, 'node_modules', 'vitest', 'vitest.mjs'),
      'related',
      ...plan.related.map((p) => path.join(ROOT, p)),
      '--run'
    ];
    if (plan.sources.length > 0) {
      args.push('--coverage', ...plan.sources.map((p) => `--coverage.include=${p}`));
    }
    steps.push([
      'vitest',
      () => spawnSync(process.execPath, args, { cwd: ROOT, stdio: 'inherit' })
    ]);
  }
  if (plan.budget) {
    steps.push([
      'budget',
      () => {
        const build = spawnSync('npm run build', { cwd: ROOT, shell: true, stdio: 'inherit' });
        if (build.error || build.status !== 0) return build;
        return spawnSync('npm run budget', { cwd: ROOT, shell: true, stdio: 'inherit' });
      }
    ]);
  }
  for (const [name, run] of steps) {
    const code = step(name, run);
    if (code !== 0) {
      console.log(`check:fast: FAIL at ${name}`);
      return code;
    }
  }
  const seconds = Math.round((Date.now() - started) / 1000);
  console.log(
    `check:fast: PASS in ${seconds} s - this arms nothing; the gate is npm run check:1 and npm run check:2`
  );
  return 0;
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  console.log(error.message);
  process.exitCode = 2;
}
