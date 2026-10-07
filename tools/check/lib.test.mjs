/*
  node:test over lib.mjs: the selector tables, the stage key, the skip loop
  with fakes, and three guards (G1-G3) that read the real tree and fail with
  the stage and the path to add when a test reads an input its selector
  does not select. The guards match the read shapes the tests use; a path
  computed in a new shape can pass them, and the uncached CI run is the
  backstop (docs/decisions/2026-10-07-a-local-check-skips-a-stage-whose-inputs.md).
*/
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import {
  ALWAYS,
  HOOKS,
  MAX_PASSES,
  STAGES,
  TYPED,
  VITEST,
  addPass,
  cacheMode,
  fastPlan,
  findPass,
  recordPath,
  rowPath,
  runStages,
  selectStages,
  selects,
  stageKey,
  stamp
} from './lib.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const posix = path.posix;

const RUNTIME = {
  version: 'v24.0.0',
  platform: 'win32',
  arch: 'x64',
  git: 'git version 2.50.0'
};

function row(p, hash = 'a'.repeat(40)) {
  return `100644 ${hash} 0\t${p}`;
}

function stage(name, select, extra = {}) {
  return { name, command: `run ${name}`, select, ...extra };
}

describe('selects', () => {
  const cases = [
    [TYPED, 'app/src/lib/x.ts', true],
    [TYPED, 'app/index.html', true],
    [TYPED, 'vite.config.mts', true],
    [TYPED, 'tsconfig.json', true],
    [TYPED, 'eslint.config.mjs', true],
    [TYPED, 'data.json', false],
    [TYPED, 'tools/build.js', false],
    [TYPED, 'appendix/x.ts', false],
    [HOOKS, '.claude/hooks/lib.mjs', true],
    [HOOKS, '.claude/cloud-nss.sh', true],
    [HOOKS, '.claude/templates/review.template.md', true],
    [HOOKS, '.claude/settings.json', true],
    [HOOKS, '.claude/README.md', false],
    [HOOKS, '.claude/prompts/plan.prompt.md', false],
    [HOOKS, '.claude/agents/implementer.md', false],
    [HOOKS, '.claude/skills/handoff/SKILL.md', false],
    [HOOKS, 'tests/db/run.mjs', true],
    [HOOKS, 'tools/supabase/lib.mjs', true],
    [HOOKS, 'supabase/migrations/x.sql', true],
    [HOOKS, 'app/src/lib/x.ts', false],
    [HOOKS, 'data.js', false],
    [VITEST, 'app/src/lib/x.ts', true],
    [VITEST, 'data.json', true],
    [VITEST, 'catalog.csv', true],
    [VITEST, 'llms.txt', true],
    [VITEST, 'schema/import-v1.json', true],
    [VITEST, 'vite.config.mts', true],
    [VITEST, 'docs/fixtures/lists/x.json', true],
    [VITEST, 'supabase/config.toml', true],
    [VITEST, 'a-new-root-file.txt', true],
    [VITEST, 'docs/specs/FEATURES.md', false],
    [VITEST, 'supabase/migrations/x.sql', false],
    [VITEST, '.claude/hooks/lib.mjs', false],
    [VITEST, '.impeccable/config.json', false],
    [VITEST, 'issues/x/plan.md', false],
    [VITEST, 'tests/derived.js', false],
    [VITEST, 'tools/build.js', false],
    [VITEST, 'tools/build-share-pages.js', true],
    [VITEST, 'img/x.webp', false],
    [VITEST, 'data.js', true],
    [VITEST, 'README.md', false],
    [VITEST, 'CLAUDE.md', false]
  ];
  const names = new Map([
    [TYPED, 'TYPED'],
    [HOOKS, 'HOOKS'],
    [VITEST, 'VITEST']
  ]);
  for (const [selector, p, expected] of cases) {
    it(`${names.get(selector)} ${expected ? 'selects' : 'skips'} ${p}`, () => {
      assert.equal(selects(selector, p), expected);
    });
  }

  it('selects every ALWAYS path for every selector', () => {
    for (const selector of [TYPED, HOOKS, VITEST]) {
      for (const p of ['package.json', 'package-lock.json', '.nvmrc', 'tools/check/lib.mjs']) {
        assert.equal(selects(selector, p), true, p);
      }
      assert.equal(selects(selector, '.claude/hooks/tree-key.mjs'), true);
    }
    assert.ok(ALWAYS.includes('tools/check/'));
  });

  it('matches a file prefix exactly and a directory prefix by its slash', () => {
    assert.equal(selects(TYPED, 'tsconfig.json.bak'), false);
    assert.equal(selects(VITEST, 'supabase/config.toml.old'), false);
  });
});

describe('rowPath', () => {
  it('returns the path after the tab', () => {
    assert.equal(rowPath(row('app/src/x.ts')), 'app/src/x.ts');
  });

  it('undoes git C-style quoting of a non-ASCII path', () => {
    assert.equal(rowPath(`100644 ${'a'.repeat(40)} 0\t"img/\\320\\264.webp"`), 'img/д.webp');
    assert.equal(rowPath(`100644 ${'a'.repeat(40)} 0\t"a\\"b\\\\c\\td"`), 'a"b\\c\td');
  });
});

describe('stageKey', () => {
  const s = stage('vitest', VITEST);
  const rows = [row('app/src/x.ts'), row('docs/specs/A.md')];
  const base = stageKey(s, rows, RUNTIME);

  it('moves with a selected row', () => {
    assert.notEqual(stageKey(s, [row('app/src/x.ts', 'b'.repeat(40)), rows[1]], RUNTIME), base);
  });

  it('ignores an unselected row', () => {
    assert.equal(stageKey(s, [rows[0], row('docs/specs/A.md', 'b'.repeat(40))], RUNTIME), base);
    assert.equal(stageKey(s, [rows[0]], RUNTIME), base);
  });

  it('moves with the command, the Node version, the platform and the arch', () => {
    assert.notEqual(stageKey({ ...s, command: 'other' }, rows, RUNTIME), base);
    assert.notEqual(stageKey(s, rows, { ...RUNTIME, version: 'v25.0.0' }), base);
    assert.notEqual(stageKey(s, rows, { ...RUNTIME, platform: 'linux' }), base);
    assert.notEqual(stageKey(s, rows, { ...RUNTIME, arch: 'arm64' }), base);
  });

  it('counts the git version only for a stage that asks for it', () => {
    assert.equal(stageKey(s, rows, { ...RUNTIME, git: 'git version 3' }), base);
    const h = stage('selftest', HOOKS, { gitVersion: true });
    assert.notEqual(
      stageKey(h, rows, RUNTIME),
      stageKey(h, rows, { ...RUNTIME, git: 'git version 3' })
    );
  });
});

describe('cacheMode', () => {
  it('is off for CHECK_CACHE=off and for any non-empty CI, else on', () => {
    assert.equal(cacheMode({}), 'on');
    assert.equal(cacheMode({ CI: '' }), 'on');
    assert.equal(cacheMode({ CHECK_CACHE: 'on' }), 'on');
    assert.equal(cacheMode({ CHECK_CACHE: 'off' }), 'off-env');
    assert.equal(cacheMode({ CI: 'true' }), 'off-ci');
    assert.equal(cacheMode({ CI: '1', CHECK_CACHE: 'off' }), 'off-env');
  });
});

describe('the store record', () => {
  it('keeps the newest pass first, one per key, at most MAX_PASSES', () => {
    let record = { passes: [] };
    for (let i = 0; i < MAX_PASSES + 3; i++) record = addPass(record, `k${i}`, i, 1);
    assert.equal(record.passes.length, MAX_PASSES);
    assert.equal(record.passes[0].key, `k${MAX_PASSES + 2}`);
    record = addPass(record, 'k5', 99, 2);
    assert.equal(record.passes[0].key, 'k5');
    assert.equal(record.passes.filter((p) => p.key === 'k5').length, 1);
  });

  it('reads a missing or malformed record as empty', () => {
    assert.equal(findPass(null, 'k'), null);
    assert.equal(findPass({}, 'k'), null);
    assert.equal(findPass({ passes: 'x' }, 'k'), null);
    assert.deepEqual(addPass({ passes: [null, { key: 1 }] }, 'k', 1, 1).passes, [
      { key: 'k', at: 1, ms: 1 }
    ]);
    assert.equal(findPass({ passes: [{ key: 'k', at: 3 }] }, 'k').at, 3);
  });

  it('names a store file that Windows accepts', () => {
    for (const [name, file] of [
      ['lint:typed', 'lint-typed.json'],
      ['vitest', 'vitest.json']
    ]) {
      assert.equal(recordPath('store', name), path.join('store', file));
    }
  });

  it('stamps local time as YYYY-MM-DD HH:MM', () => {
    assert.equal(stamp(new Date(2026, 9, 7, 9, 5).getTime()), '2026-10-07 09:05');
  });
});

/** A fake world for runStages: rows per snapshot call, a store, spawn statuses. */
function world({ rows = [row('app/src/x.ts')], env = {}, statuses = {}, onSpawn } = {}) {
  const store = new Map();
  const lines = [];
  const spawned = [];
  let snapshots = 0;
  let clock = 1000;
  const current = { rows };
  const deps = {
    snapshot: () => {
      snapshots++;
      return current.rows;
    },
    readRecord: (name) => store.get(name) || { passes: [] },
    writeRecord: (name, record) => store.set(name, record),
    spawn: (command) => {
      spawned.push(command);
      if (onSpawn) onSpawn(command, current);
      clock += 500;
      return Object.hasOwn(statuses, command) ? statuses[command] : 0;
    },
    now: () => clock,
    print: (line) => lines.push(line),
    env,
    runtime: RUNTIME
  };
  return { deps, store, lines, spawned, current, snapshotCount: () => snapshots };
}

describe('runStages', () => {
  const plain = stage('plain');
  const cached = stage('cached', VITEST);

  it('runs every stage the first time and records a cached stage after exit 0', () => {
    const w = world();
    const result = runStages([plain, cached], w.deps);
    assert.equal(result.code, 0);
    assert.deepEqual(w.spawned, ['run plain', 'run cached']);
    assert.equal(w.store.get('cached').passes.length, 1);
    assert.equal(w.store.has('plain'), false);
    assert.match(w.lines.at(-1), /^check: 2 stages run, 0 skipped, \d+ s$/);
  });

  it('skips a cached stage whose key is stored and always runs a plain one', () => {
    const w = world();
    runStages([plain, cached], w.deps);
    w.spawned.length = 0;
    w.lines.length = 0;
    const result = runStages([plain, cached], w.deps);
    assert.deepEqual(w.spawned, ['run plain']);
    assert.deepEqual(result.skipped, ['cached']);
    assert.match(
      w.lines[0],
      /^check: cached skipped - inputs unchanged since its pass at \d{4}-/
    );
    assert.match(w.lines.at(-1), /^check: 1 stages run, 1 skipped \(cached\), \d+ s$/);
  });

  it('runs a cached stage again when a selected input changed', () => {
    const w = world();
    runStages([cached], w.deps);
    w.current.rows = [row('app/src/x.ts', 'b'.repeat(40))];
    runStages([cached], w.deps);
    assert.equal(w.spawned.length, 2);
    assert.equal(w.store.get('cached').passes.length, 2);
  });

  it('writes no record when an input is edited during the run', () => {
    const w = world({
      onSpawn: (_command, current) => {
        current.rows = [row('app/src/x.ts', 'c'.repeat(40))];
      }
    });
    runStages([cached], w.deps);
    assert.equal(w.store.has('cached'), false);
  });

  it('stops at a failure with its code, runs nothing after it and writes no record', () => {
    const w = world({ statuses: { 'run cached': 3 } });
    const result = runStages([cached, plain], w.deps);
    assert.equal(result.code, 3);
    assert.deepEqual(w.spawned, ['run cached']);
    assert.equal(w.store.has('cached'), false);
    assert.equal(w.lines.at(-1), 'check: cached exited 3');
  });

  it('reads a signal as exit 1', () => {
    const w = world({ statuses: { 'run plain': null } });
    const result = runStages([plain], w.deps);
    assert.equal(result.code, 1);
    assert.equal(w.lines.at(-1), 'check: plain exited on a signal');
  });

  it('reads a spawn error as exit 1 and names its code', () => {
    const w = world({ statuses: { 'run plain': 'ENOENT' } });
    const result = runStages([plain], w.deps);
    assert.equal(result.code, 1);
    assert.equal(w.lines.at(-1), 'check: plain could not start (ENOENT)');
  });

  for (const env of [{ CHECK_CACHE: 'off' }, { CI: 'true' }]) {
    it(`runs every stage and reads and writes nothing with ${JSON.stringify(env)}`, () => {
      const w = world({ env });
      w.deps.readRecord = () => assert.fail('off mode read the store');
      w.deps.writeRecord = () => assert.fail('off mode wrote the store');
      runStages([plain, cached], w.deps);
      runStages([plain, cached], w.deps);
      assert.equal(w.spawned.length, 4);
      assert.equal(w.snapshotCount(), 0);
      assert.match(w.lines[0], /^check: stage cache off \((CHECK_CACHE=off|CI)\)/);
    });
  }

  it('runs a stage with no record when the snapshot is null, and says so once', () => {
    const w = world({ rows: null });
    runStages([cached, stage('cached2', TYPED)], w.deps);
    assert.equal(w.spawned.length, 2);
    assert.equal(w.store.size, 0);
    assert.equal(
      w.lines.filter((l) => l === 'check: stage cache off - the tree key could not be read')
        .length,
      1
    );
  });

  it('prints none of the failure markers check-observer.mjs reads', () => {
    const w = world({ statuses: { 'run plain': 1 } });
    runStages([cached], w.deps);
    runStages([cached, plain], w.deps);
    for (const line of w.lines) {
      for (const re of [/npm error/i, /ELIFECYCLE/, /\bFAILED\b/, /Tests\s+\d+\s+failed/]) {
        assert.doesNotMatch(line, re);
      }
    }
  });
});

describe('the stage table', () => {
  const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

  it('runs the stages of the check in their order', () => {
    assert.deepEqual(
      STAGES.map((s) => s.name),
      [
        'format',
        'lint:untyped',
        'lint:typed',
        'typecheck',
        'site-syntax',
        'data',
        'derived',
        'dataint',
        'selftest',
        'test:tg-preview',
        'test:artwork',
        'test:supabase',
        'test:check-site',
        'test:golden',
        'test:sw',
        'test:e2e-lib',
        'vitest'
      ]
    );
  });

  it('caches exactly the typed lint, the typecheck, the selftest and vitest', () => {
    assert.deepEqual(
      STAGES.filter((s) => s.select).map((s) => [s.name, s.select]),
      [
        ['lint:typed', TYPED],
        ['typecheck', TYPED],
        ['selftest', HOOKS],
        ['vitest', VITEST]
      ]
    );
  });

  it('runs lint:untyped then lint:typed and never `npm run lint`: the typed half runs uncached', () => {
    const commands = STAGES.map((s) => s.command);
    assert.ok(
      commands.indexOf('npm run lint:untyped') < commands.indexOf('npm run lint:typed')
    );
    assert.ok(!commands.includes('npm run lint'));
  });

  it('names only scripts that package.json has', () => {
    for (const s of STAGES) {
      const m = /^npm run (\S+)$/.exec(s.command);
      if (m) assert.ok(Object.hasOwn(pkg.scripts, m[1]), `${s.name}: no script ${m[1]}`);
    }
  });

  it('is what scripts.check runs between the two gate-credit steps', () => {
    assert.equal(
      pkg.scripts.check,
      'node .claude/hooks/gate-credit.mjs begin check && node --test --test-reporter=dot tools/check/lib.test.mjs && node tools/check/run.mjs && node .claude/hooks/gate-credit.mjs arm check'
    );
  });

  it('runs each half between its own gate-credit steps', () => {
    for (const n of [1, 2]) {
      assert.equal(
        pkg.scripts[`check:${n}`],
        `node .claude/hooks/gate-credit.mjs begin check-${n} && node --test --test-reporter=dot tools/check/lib.test.mjs && node tools/check/run.mjs --half=${n} && node .claude/hooks/gate-credit.mjs arm check-${n}`
      );
    }
    assert.equal(pkg.scripts['check:fast'], 'node tools/check/fast.mjs');
  });

  it('puts vitest alone in half 2 and every other stage in half 1', () => {
    for (const s of STAGES) assert.ok(s.half === 1 || s.half === 2, s.name);
    assert.deepEqual(
      STAGES.filter((s) => s.half === 2).map((s) => s.name),
      ['vitest']
    );
    assert.deepEqual(
      [...selectStages(STAGES, { half: 1 }), ...selectStages(STAGES, { half: 2 })],
      STAGES
    );
  });
});

describe('selectStages', () => {
  const table = [
    { name: 'a', half: 1 },
    { name: 'b', half: 1 },
    { name: 'c', half: 2 }
  ];

  it('returns one half in table order', () => {
    assert.deepEqual(
      selectStages(table, { half: 1 }).map((s) => s.name),
      ['a', 'b']
    );
    assert.deepEqual(
      selectStages(table, { half: 2 }).map((s) => s.name),
      ['c']
    );
  });

  it('returns the named stages in table order, not argument order', () => {
    assert.deepEqual(
      selectStages(table, { only: ['c', 'a'] }).map((s) => s.name),
      ['a', 'c']
    );
  });

  it('returns every stage with no filter', () => {
    assert.deepEqual(selectStages(table, {}), table);
    assert.deepEqual(selectStages(table), table);
  });

  it('throws on both filters, another half and an unknown name', () => {
    assert.throws(() => selectStages(table, { half: 1, only: ['a'] }), /not both/);
    assert.throws(() => selectStages(table, { half: 3 }), /^Error: check: no half 3/);
    assert.throws(
      () => selectStages(table, { only: ['x'] }),
      /^Error: check: no stage named x$/
    );
  });

  it('names stages that the real table has', () => {
    assert.deepEqual(
      selectStages(STAGES, { only: ['typecheck', 'format', 'test:golden'] }).map((s) => s.name),
      ['format', 'typecheck', 'test:golden']
    );
  });
});

describe('fastPlan', () => {
  it('runs nothing for no path and for a document', () => {
    for (const paths of [[], ['docs/x.md']]) {
      assert.deepEqual(fastPlan(paths), { related: [], sources: [], budget: false });
    }
  });

  it('runs the tests of a test file with no coverage list and no budget', () => {
    assert.deepEqual(fastPlan(['app/src/lib/x.test.ts']), {
      related: ['app/src/lib/x.test.ts'],
      sources: [],
      budget: false
    });
  });

  it('measures a component relative to app/ and builds the bundle', () => {
    assert.deepEqual(fastPlan(['app/src/components/X.svelte', 'app/src/lib/y.ts']), {
      related: ['app/src/components/X.svelte', 'app/src/lib/y.ts'],
      sources: ['src/components/X.svelte', 'src/lib/y.ts'],
      budget: true
    });
  });

  it('builds no bundle for a test helper', () => {
    assert.equal(fastPlan(['app/src/test/x.ts']).budget, false);
  });

  it('builds the bundle for a build input outside app/ and runs no tests for it', () => {
    for (const p of [
      'vite.config.mts',
      'package.json',
      'package-lock.json',
      'tools/bundle-budget.mjs'
    ]) {
      assert.deepEqual(fastPlan([p]), { related: [], sources: [], budget: true }, p);
    }
  });

  it('runs the tests of the vitest setup file', () => {
    assert.deepEqual(fastPlan(['app/vitest-setup.ts']).related, ['app/vitest-setup.ts']);
  });
});

// ---------- guards over the real tree ----------

function walk(dir, keep) {
  const out = [];
  for (const entry of readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const p = posix.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') out.push(...walk(p, keep));
    } else if (keep(p)) out.push(p);
  }
  return out;
}

const LITERALS = String.raw`((?:\s*,\s*'[^']*')+)`;

function literals(group) {
  return [...group.matchAll(/'([^']*)'/g)].map((m) => m[1]);
}

/** Returns the repository paths a vitest file builds from its own
 * directory: `join(import.meta.dirname, '..', ...)`, the constants made that
 * way, `join(CONST, ...)`, a `read(...)` helper defined on a constant, and
 * any string literal that starts with `../` (`require`, `new URL`,
 * `import.meta.glob`). */
function vitestReads(file, text) {
  const dir = posix.dirname(file);
  const consts = new Map();
  const out = new Set();
  const add = (p) => {
    if (p !== '.' && !p.startsWith('app/')) out.add(p);
  };
  for (const m of text.matchAll(
    new RegExp(
      String.raw`const\s+(\w+)\s*=\s*(?:join|resolve)\(\s*import\.meta\.dirname${LITERALS}\s*\)`,
      'g'
    )
  )) {
    consts.set(m[1], posix.normalize(posix.join(dir, ...literals(m[2]))));
  }
  for (const m of text.matchAll(
    new RegExp(String.raw`import\.meta\.dirname${LITERALS}`, 'g')
  )) {
    add(posix.normalize(posix.join(dir, ...literals(m[1]))));
  }
  for (const [name, base] of consts) {
    for (const m of text.matchAll(
      new RegExp(String.raw`(?:join|resolve)\(\s*${name}${LITERALS}`, 'g')
    )) {
      add(posix.normalize(posix.join(base, ...literals(m[1]))));
    }
    for (const helper of text.matchAll(
      new RegExp(
        String.raw`const\s+(\w+)\s*=\s*\([^)]*\)[^=\n]*=>[^;\n]*?readFileSync\(\s*join\(\s*${name}\s*,`,
        'g'
      )
    )) {
      for (const call of text.matchAll(
        new RegExp(String.raw`(?<![.\w])${helper[1]}\(\s*('[^']*'(?:\s*,\s*'[^']*')*)`, 'g')
      )) {
        add(posix.normalize(posix.join(base, ...literals(call[1]))));
      }
    }
  }
  for (const m of text.matchAll(/['"](\.\.\/[^'"\n]*)['"]/g)) {
    add(posix.normalize(posix.join(dir, m[1])));
  }
  return [...out];
}

/** Returns the relative import specifiers of a module, static and dynamic. */
function relativeImports(text) {
  const out = [];
  for (const re of [
    /\bfrom\s+['"](\.{1,2}\/[^'"]+)['"]/g,
    /\bimport\s*\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g,
    /\bimport\s+['"](\.{1,2}\/[^'"]+)['"]/g
  ]) {
    for (const m of text.matchAll(re)) out.push(m[1]);
  }
  return out;
}

/** Returns `path` as a selector sees it: a directory with its slash. */
function asInput(p) {
  const abs = path.join(ROOT, p);
  return existsSync(abs) && statSync(abs).isDirectory() ? `${p}/` : p;
}

function unselected(selector, paths) {
  return paths.filter((p) => !selects(selector, asInput(p)));
}

describe('G1: vitest reads only paths VITEST selects', () => {
  const files = walk(
    'app',
    (p) =>
      p.endsWith('.test.ts') || p.startsWith('app/src/test/') || p === 'app/vitest-setup.ts'
  );
  const reads = new Map();
  for (const file of files) {
    for (const p of vitestReads(file, readFileSync(path.join(ROOT, file), 'utf8'))) {
      if (!reads.has(p)) reads.set(p, file);
    }
  }
  // G1 does not follow the reads of a required module: the share-stub
  // generator loads data.js when it loads.
  if (reads.has('tools/build-share-pages.js')) {
    reads.set('data.js', 'tools/build-share-pages.js, which a vitest file requires');
  }

  it('finds the reads it knows of, so a broken extractor cannot pass', () => {
    for (const p of [
      'data.json',
      'catalog.csv',
      'llms.txt',
      'schema/import-v1.json',
      'supabase/config.toml',
      'docs/fixtures/lists',
      'docs/fixtures/homebrew-file/export.json',
      'tools/build-share-pages.js',
      'data.js'
    ]) {
      assert.ok(reads.has(p), `G1 no longer finds ${p}`);
    }
  });

  it('selects every path a vitest file reads', () => {
    const missing = unselected(VITEST, [...reads.keys()]).map(
      (p) => `stage vitest: add ${p} (read by ${reads.get(p)}) to VITEST in tools/check/lib.mjs`
    );
    assert.deepEqual(missing, []);
  });

  it('reports a read that VITEST does not select', () => {
    const text =
      "readFileSync(join(import.meta.dirname, '..', '..', '..', 'docs', 'specs', 'X.md'))";
    const p = vitestReads('app/src/lib/x.test.ts', text);
    assert.deepEqual(p, ['docs/specs/X.md']);
    assert.deepEqual(unselected(VITEST, p), ['docs/specs/X.md']);
  });

  it('finds a read through a constant and through a read helper', () => {
    const text = [
      "const ROOT = join(import.meta.dirname, '..', '..', '..');",
      "const read = (...p: string[]): string => readFileSync(join(ROOT, ...p), 'utf8');",
      "read('docs', 'plans', 'a.md'); store.read('x');",
      "join(ROOT, 'tools', 'a.js');"
    ].join('\n');
    assert.deepEqual(vitestReads('app/src/lib/x.test.ts', text).sort(), [
      'docs/plans/a.md',
      'tools/a.js'
    ]);
  });

  it('finds a `../` literal that leaves app/ and ignores one that stays inside', () => {
    const text = [
      "const stubs = require_('../../../tools/a.js');",
      "new URL('../../../docs/b.json', import.meta.url);",
      "vi.mock('../lib/c.js');"
    ].join('\n');
    assert.deepEqual(vitestReads('app/src/lib/x.test.ts', text).sort(), [
      'docs/b.json',
      'tools/a.js'
    ]);
  });

  it('finds no import in app/ that leaves app/', () => {
    const outside = [];
    for (const file of walk('app', (p) => /\.(ts|svelte|js|mjs|mts)$/.test(p))) {
      for (const spec of relativeImports(readFileSync(path.join(ROOT, file), 'utf8'))) {
        const target = posix.normalize(posix.join(posix.dirname(file), spec));
        if (!target.startsWith('app/')) outside.push(`${file} imports ${spec}`);
      }
    }
    assert.deepEqual(outside, []);
  });
});

describe('G2: the hook selftest reads only paths HOOKS selects', () => {
  const start = [
    ...readdirSync(path.join(ROOT, '.claude', 'hooks'))
      .filter((name) => name.endsWith('.mjs'))
      .map((name) => `.claude/hooks/${name}`),
    'tests/db/run.mjs'
  ];
  const seen = new Set();
  const queue = [...start];
  while (queue.length > 0) {
    const file = queue.shift();
    if (seen.has(file)) continue;
    seen.add(file);
    const abs = path.join(ROOT, file);
    if (!existsSync(abs)) continue;
    for (const spec of relativeImports(readFileSync(abs, 'utf8'))) {
      queue.push(posix.normalize(posix.join(posix.dirname(file), spec)));
    }
  }
  const selftest = readFileSync(path.join(ROOT, '.claude', 'hooks', 'selftest.mjs'), 'utf8');
  for (const m of selftest.matchAll(
    new RegExp(String.raw`join\(\s*hooksDir${LITERALS}`, 'g')
  )) {
    seen.add(posix.normalize(posix.join('.claude/hooks', ...literals(m[1]))));
  }

  it('finds the reads it knows of, so a broken walk cannot pass', () => {
    for (const p of [
      '.claude/cloud-nss.sh',
      '.claude/templates/review.template.md',
      'tests/db/run.mjs',
      'tools/supabase/lib.mjs',
      '.claude/hooks/gate-credit.mjs'
    ]) {
      assert.ok(seen.has(p), `G2 no longer finds ${p}`);
    }
  });

  it('selects every file the selftest reads, imports or spawns', () => {
    const missing = unselected(HOOKS, [...seen]).map(
      (p) => `stage selftest: add ${p} to HOOKS in tools/check/lib.mjs`
    );
    assert.deepEqual(missing, []);
  });
});

describe('G3: TYPED selects the typed files', () => {
  it("selects every tsconfig.json `include` entry and the lint config's imports", () => {
    const include = JSON.parse(readFileSync(path.join(ROOT, 'tsconfig.json'), 'utf8')).include;
    const samples = include.map((entry) => entry.replace(/\*\*\//g, '').replace(/\*/g, 'x'));
    const config = readFileSync(path.join(ROOT, 'eslint.config.mjs'), 'utf8');
    const imports = relativeImports(config).map((spec) => posix.normalize(spec));
    const missing = unselected(TYPED, [...samples, ...imports, 'tsconfig.json']).map(
      (p) => `stages lint:typed and typecheck: add ${p} to TYPED in tools/check/lib.mjs`
    );
    assert.deepEqual(missing, []);
    assert.ok(samples.includes('app/src/x.ts'));
  });
});
