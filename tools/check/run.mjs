// CLI of the `npm run check` stages: `node tools/check/run.mjs` runs them,
// `--forget` deletes the stage store and the tool caches and exits. The
// logic is lib.mjs; this file is the real git, store, clock and spawn.
// .claude/README.md, "Run a long check", "Stage cache".

import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { indexRows } from '../../.claude/hooks/tree-key.mjs';
import { STAGES, cacheMode, recordPath, runStages } from './lib.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const CACHE = path.join(ROOT, 'node_modules', '.cache');
const STORE = path.join(CACHE, 'check');
const CACHE_DIRS = ['prettier', 'eslint', 'check'].map((name) => path.join(CACHE, name));

function forget() {
  for (const dir of CACHE_DIRS) rmSync(dir, { recursive: true, force: true });
}

function readRecord(name) {
  try {
    const parsed = JSON.parse(readFileSync(recordPath(STORE, name), 'utf8'));
    if (parsed && Array.isArray(parsed.passes)) return parsed;
  } catch {
    // missing, unreadable or malformed: read as empty
  }
  return { passes: [] };
}

function writeRecord(name, record) {
  const file = recordPath(STORE, name);
  const temp = `${file}.${process.pid}.tmp`;
  try {
    mkdirSync(STORE, { recursive: true });
    writeFileSync(temp, JSON.stringify(record));
    renameSync(temp, file);
  } catch {
    // a lost record costs one rerun of the stage
    rmSync(temp, { force: true });
  }
}

function snapshot() {
  const copy = path.join(STORE, `index-${process.pid}`);
  try {
    mkdirSync(STORE, { recursive: true });
    return indexRows(ROOT, copy);
  } catch {
    return null;
  } finally {
    try {
      rmSync(copy, { force: true });
    } catch {
      // a copy left behind is gitignored, and `--forget` deletes it
    }
  }
}

function gitVersion() {
  const r = spawnSync('git', ['--version'], { encoding: 'utf8' });
  return r.error || r.status !== 0 ? null : r.stdout.trim();
}

function spawn(command) {
  const r = spawnSync(command, { cwd: ROOT, shell: true, stdio: 'inherit' });
  if (r.error) return r.error.code || 'error';
  return r.status;
}

function main(argv) {
  if (argv.includes('--forget')) {
    forget();
    console.log('check: the stage store and the tool caches are deleted');
    return 0;
  }
  if (cacheMode(process.env) !== 'on') forget();
  const result = runStages(STAGES, {
    snapshot,
    readRecord,
    writeRecord,
    spawn,
    now: () => Date.now(),
    print: (line) => console.log(line),
    env: process.env,
    runtime: {
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      git: gitVersion()
    }
  });
  return result.code;
}

process.exitCode = main(process.argv.slice(2));
