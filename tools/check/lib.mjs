// The stage table and the skip logic of `npm run check`. Pure: run.mjs
// injects git, the store, the clock and the spawn. The design and its
// rejected alternatives: docs/decisions/2026-10-07-a-local-check-skips-a-stage-whose-inputs.md;
// the procedure: .claude/README.md, "Run a long check", "Stage cache".

import { createHash } from 'node:crypto';
import path from 'node:path';

/** Paths that are inputs of every cached stage: the dependencies, the Node
 * version and the runner itself, whose tables decide what a key covers. */
export const ALWAYS = [
  'package.json',
  'package-lock.json',
  '.nvmrc',
  'tools/check/',
  '.claude/hooks/tree-key.mjs'
];

/** The typed lint and svelte-check read tsconfig.json's `include` and the
 * lint config. An allow-list: the guard in lib.test.mjs lists the reads. */
export const TYPED = {
  rules: [
    ['app/', true],
    ['vite.config.mts', true],
    ['tsconfig.json', true],
    ['eslint.config.mjs', true]
  ],
  fallback: false
};

/** The hook selftest reads the hooks, two files beside them, and spawns
 * tests/db/run.mjs with its imports. An allow-list with a guard. */
export const HOOKS = {
  rules: [
    ['.claude/README.md', false],
    ['.claude/prompts/', false],
    ['.claude/agents/', false],
    ['.claude/skills/', false],
    ['.claude/worktrees/', false],
    ['.claude/', true],
    ['tests/db/', true],
    ['tools/supabase/', true],
    ['supabase/', true]
  ],
  fallback: false
};

/** Vitest's reads are spread over many test files, so a deny-list: an
 * unknown path costs a rerun, not a false green. `i18n.test.ts` requires
 * tools/build-share-pages.js, which loads `data.js`. */
export const VITEST = {
  rules: [
    ['docs/fixtures/', true],
    ['supabase/config.toml', true],
    ['tools/build-share-pages.js', true],
    ['.claude/', false],
    ['.github/', false],
    ['.impeccable/', false],
    ['docs/', false],
    ['issues/', false],
    ['tests/', false],
    ['tools/', false],
    ['supabase/', false],
    ['img/', false],
    ['og/', false],
    ['card/', false],
    ['pages/', false],
    ['README.md', false],
    ['README.ru.md', false],
    ['CLAUDE.md', false],
    ['DESIGN.md', false],
    ['PRODUCT.md', false]
  ],
  fallback: true
};

/** The stages of `npm run check` between gate credit's `begin` and `arm`,
 * in order. A stage with `select` is skipped when its key matches a recent
 * local pass; every other stage always runs. `half` is the stage's part of
 * the check in two calls: `npm run check:1` runs half 1, `check:2` half 2. */
export const STAGES = [
  { name: 'format', command: 'npm run format:check', half: 1 },
  { name: 'lint:untyped', command: 'npm run lint:untyped', half: 1 },
  { name: 'lint:typed', command: 'npm run lint:typed', select: TYPED, half: 1 },
  { name: 'typecheck', command: 'npm run typecheck', select: TYPED, half: 1 },
  { name: 'site-syntax', command: 'node --check tools/check-site.mjs', half: 1 },
  { name: 'data', command: 'npm run data', half: 1 },
  { name: 'derived', command: 'node tests/derived.js', half: 1 },
  { name: 'dataint', command: 'node tests/dataint.js', half: 1 },
  {
    name: 'selftest',
    command: 'node .claude/hooks/selftest.mjs',
    select: HOOKS,
    gitVersion: true,
    half: 1
  },
  {
    name: 'test:tg-preview',
    command: 'node --test --test-reporter=dot tools/tg-preview/lib.test.mjs',
    half: 1
  },
  {
    name: 'test:artwork',
    command: 'node --test --test-reporter=dot tools/artwork/lib.test.mjs',
    half: 1
  },
  {
    name: 'test:supabase',
    command:
      'node --test --test-reporter=dot tools/supabase/lib.test.mjs tools/supabase/usage-lib.test.mjs',
    half: 1
  },
  {
    name: 'test:check-site',
    command: 'node --test --test-reporter=dot tools/check-site.test.mjs',
    half: 1
  },
  {
    name: 'test:golden',
    command: 'node --test --test-reporter=dot tests/app/golden.test.mjs',
    half: 1
  },
  { name: 'test:sw', command: 'node --test --test-reporter=dot tests/sw.test.mjs', half: 1 },
  {
    name: 'test:e2e-lib',
    command: 'node --test --test-reporter=dot tests/e2e/lib.test.mjs',
    half: 1
  },
  { name: 'vitest', command: 'npm run test', select: VITEST, half: 2 }
];

/**
 * Returns the stages of `stages` to run, in table order: those of `half`
 * (1 or 2), or those named in `only`, or all of them. Throws on both, on
 * another half and on an unknown name.
 */
export function selectStages(stages, { half, only } = {}) {
  if (half !== undefined && only !== undefined) {
    throw new Error('check: give --half or --only, not both');
  }
  if (half !== undefined) {
    if (half !== 1 && half !== 2) throw new Error(`check: no half ${half}; use 1 or 2`);
    return stages.filter((s) => s.half === half);
  }
  if (only !== undefined) {
    for (const name of only) {
      if (!stages.some((s) => s.name === name))
        throw new Error(`check: no stage named ${name}`);
    }
    return stages.filter((s) => only.includes(s.name));
  }
  return stages;
}

/** Files outside app/ whose change can move the production bundle. */
const BUDGET_FILES = [
  'vite.config.mts',
  'package.json',
  'package-lock.json',
  'tools/bundle-budget.mjs'
];

/**
 * Returns what the fast pre-check runs for the changed `paths` (`/`
 * separators): `related`, the paths vitest finds the tests of; `sources`,
 * the related sources relative to app/, whose coverage is measured; and
 * `budget`, true when the bundle can change.
 */
export function fastPlan(paths) {
  const related = paths.filter((p) => p.startsWith('app/src/') || p === 'app/vitest-setup.ts');
  const sources = related
    .filter((p) => /\.(ts|svelte)$/.test(p) && !p.endsWith('.test.ts'))
    .map((p) => p.slice('app/'.length));
  const budget = paths.some(
    (p) =>
      (p.startsWith('app/') && !p.endsWith('.test.ts') && !p.startsWith('app/src/test/')) ||
      BUDGET_FILES.includes(p)
  );
  return { related, sources, budget };
}

/** The most recent passes a stage keeps, so a revert to a recent state still hits. */
export const MAX_PASSES = 8;

function matches(prefix, p) {
  return prefix.endsWith('/') ? p.startsWith(prefix) : p === prefix;
}

/** Returns true when the git path `p` is an input of `selector`: ALWAYS
 * first, then the first rule whose prefix matches, else the fallback. */
export function selects(selector, p) {
  if (ALWAYS.some((prefix) => matches(prefix, p))) return true;
  for (const [prefix, include] of selector.rules) {
    if (matches(prefix, p)) return include;
  }
  return selector.fallback;
}

/** Returns the path of one `git ls-files -s` row. Git quotes a path with
 * an unusual byte in C style (`core.quotePath`), and tree-key.mjs keeps
 * that output byte for byte, so the quotes are undone here. */
export function rowPath(row) {
  const tab = row.indexOf('\t');
  const raw = tab === -1 ? row : row.slice(tab + 1);
  if (!(raw.length >= 2 && raw.startsWith('"') && raw.endsWith('"'))) return raw;
  const bytes = [];
  const body = raw.slice(1, -1);
  const SIMPLE = { n: 10, t: 9, r: 13, '"': 34, '\\': 92, a: 7, b: 8, f: 12, v: 11 };
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c !== '\\') {
      bytes.push(...Buffer.from(c, 'utf8'));
      continue;
    }
    const next = body[i + 1];
    if (next !== undefined && /[0-7]/.test(next)) {
      bytes.push(parseInt(body.slice(i + 1, i + 4), 8));
      i += 3;
    } else if (next !== undefined && Object.hasOwn(SIMPLE, next)) {
      bytes.push(SIMPLE[next]);
      i += 1;
    } else {
      bytes.push(92);
    }
  }
  return Buffer.from(bytes).toString('utf8');
}

/** Returns the store file of the stage `name` in `store`. A stage name
 * holds `:`, which a Windows file name cannot. */
export function recordPath(store, name) {
  return path.join(store, `${name.replace(/[^A-Za-z0-9_-]/g, '-')}.json`);
}

/** Returns the sha256 key of `stage` over the rows its selector selects.
 * `runtime` is `{ version, platform, arch, git }`; `git` counts only for a
 * stage with `gitVersion`. */
export function stageKey(stage, rows, runtime) {
  const parts = [stage.name, stage.command, runtime.version, runtime.platform, runtime.arch];
  if (stage.gitVersion) parts.push(runtime.git);
  for (const row of rows) {
    if (selects(stage.select, rowPath(row))) parts.push(row);
  }
  return createHash('sha256').update(JSON.stringify(parts)).digest('hex');
}

/** Returns `off-env` for CHECK_CACHE=off, `off-ci` when CI is set to any
 * non-empty value, else `on`. */
export function cacheMode(env) {
  if (env.CHECK_CACHE === 'off') return 'off-env';
  if (env.CI) return 'off-ci';
  return 'on';
}

/** Returns the stored pass with `key`, or null. */
export function findPass(record, key) {
  if (!record || !Array.isArray(record.passes)) return null;
  return record.passes.find((pass) => pass && pass.key === key) || null;
}

/** Returns a new record with the pass first and at most MAX_PASSES passes. */
export function addPass(record, key, at, ms) {
  const older =
    record && Array.isArray(record.passes)
      ? record.passes.filter((pass) => pass && typeof pass.key === 'string' && pass.key !== key)
      : [];
  return { passes: [{ key, at, ms }, ...older].slice(0, MAX_PASSES) };
}

/** Returns `YYYY-MM-DD HH:MM` in local time. */
export function stamp(ms) {
  const d = new Date(ms);
  const two = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}`;
}

const OFF_LINES = {
  'off-env': 'check: stage cache off (CHECK_CACHE=off) - every stage runs',
  'off-ci': 'check: stage cache off (CI) - every stage runs'
};

/**
 * Runs `stages` in order and returns `{ code, ran, skipped }`. `deps`:
 * `snapshot()` (rows or null), `readRecord(name)`, `writeRecord(name,
 * record)`, `spawn(command)` (an exit status, null for a signal, or the
 * error code of a spawn that could not start), `now()` (ms), `print(line)`,
 * `env`, `runtime`. The lines never contain the failure markers of check-observer.mjs.
 */
export function runStages(stages, deps) {
  const mode = cacheMode(deps.env);
  const started = deps.now();
  const ran = [];
  const skipped = [];
  let snapshotLost = false;
  if (mode !== 'on') deps.print(OFF_LINES[mode]);

  const keyNow = () => {
    const rows = deps.snapshot();
    if (rows === null && !snapshotLost) {
      snapshotLost = true;
      deps.print('check: stage cache off - the tree key could not be read');
    }
    return rows;
  };

  for (const stage of stages) {
    const cached = mode === 'on' && Boolean(stage.select);
    let key = null;
    if (cached) {
      const rows = keyNow();
      if (rows !== null) {
        key = stageKey(stage, rows, deps.runtime);
        const pass = findPass(deps.readRecord(stage.name), key);
        if (pass) {
          deps.print(
            `check: ${stage.name} skipped - inputs unchanged since its pass at ${stamp(pass.at)}`
          );
          skipped.push(stage.name);
          continue;
        }
      }
    }
    const t0 = deps.now();
    const status = deps.spawn(stage.command);
    ran.push(stage.name);
    if (status !== 0) {
      const code = typeof status === 'number' ? status : 1;
      const what =
        typeof status === 'string'
          ? `could not start (${status})`
          : `exited ${status === null ? 'on a signal' : status}`;
      deps.print(`check: ${stage.name} ${what}`);
      return { code, ran, skipped };
    }
    if (key === null) continue;
    const rows = keyNow();
    // A key that moved means an input was edited during the run.
    if (rows === null || stageKey(stage, rows, deps.runtime) !== key) continue;
    const ms = deps.now() - t0;
    deps.writeRecord(stage.name, addPass(deps.readRecord(stage.name), key, deps.now(), ms));
  }

  const seconds = Math.round((deps.now() - started) / 1000);
  const names = skipped.length > 0 ? ` (${skipped.join(', ')})` : '';
  deps.print(
    `check: ${ran.length} stages run, ${skipped.length} skipped${names}, ${seconds} s`
  );
  return { code: 0, ran, skipped };
}
