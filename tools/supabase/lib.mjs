/*
  Pure logic for the Supabase release tools (config.mjs, db-push.mjs,
  pending-check.mjs) and the reversibility gate in tests/db/. No process
  spawn, no filesystem: every input arrives as an argument, so
  lib.test.mjs covers it inside `npm run check`.
  Procedure: .claude/README.md, "Supabase configuration".
*/

import { fileURLToPath } from 'node:url';

/** The CLI's node entry from the pinned `supabase` devDependency. Callers
 * run it as `process.execPath SUPABASE_CLI ...`, so no shell and no `npx`
 * lookup sits between the script and the pinned version. */
export const SUPABASE_CLI = fileURLToPath(
  new URL('../../node_modules/supabase/dist/supabase.js', import.meta.url)
);

export const PROJECTS = Object.freeze({
  test: 'rdjxcjkhsklhprmzxajq',
  prod: 'zzmrftmzefcqehhyztjq'
});

/** Returns `{ project, ref, envFile }` from `--project test|prod` and an
 * optional `--env-file <path>`; throws when the project is absent or
 * unknown. */
export function parseProjectArg(argv) {
  let project = null;
  let envFile = null;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--project') project = argv[++i] ?? null;
    else if (arg.startsWith('--project=')) project = arg.slice('--project='.length);
    else if (arg === '--env-file') envFile = argv[++i] ?? null;
    else if (arg.startsWith('--env-file=')) envFile = arg.slice('--env-file='.length);
  }
  if (!project || !Object.hasOwn(PROJECTS, project)) {
    throw new Error(
      `The project is ${project ? `"${project}"` : 'missing'}. Pass --project test or --project prod.`
    );
  }
  if (envFile === '') envFile = null;
  return { project, ref: PROJECTS[project], envFile };
}

/** Returns the CLI arguments of a read-only `config diff` against `ref`.
 * The CLI prints text to an interactive terminal and JSON only to an agent
 * or when asked, so the JSON format is explicit. */
export function diffArgs(ref) {
  return ['config', 'diff', '--project-ref', ref, '--output-format', 'json'];
}

/** Hosted properties that config.toml leaves undeclared on purpose, so a
 * push leaves them unchanged; `config diff` still lists them when they
 * differ from the CLI's default (.claude/README.md, "Supabase
 * configuration"). */
export const NOT_OWNED = new Set([
  'auth.sms.twilio.enabled',
  'db.pooler.default_pool_size',
  'db.pooler.max_client_conn',
  'storage.vector.enabled'
]);

/** Splits the `changes` of a `config diff` into `{ drift, notOwned }`. A
 * change is not owned only when its path is in NOT_OWNED, its class is
 * `remote_only` and the file does not declare it; every other change is
 * drift. */
export function splitDrift(changes) {
  const drift = [];
  const notOwned = [];
  for (const change of changes ?? []) {
    const key = Array.isArray(change.path) ? change.path.join('.') : String(change.path);
    const skip =
      NOT_OWNED.has(key) && change.class === 'remote_only' && change.declared === false;
    (skip ? notOwned : drift).push(change);
  }
  return { drift, notOwned };
}

/** Returns the summary line of a split diff: `drift: none (N not-owned)`
 * or `drift: N`. */
export function driftSummary({ drift, notOwned }) {
  return drift.length ? `drift: ${drift.length}` : `drift: none (${notOwned.length} not-owned)`;
}

/** Returns the distinct `env(NAME)` names that config.toml reads outside
 * comments, in the order they first appear. */
export function envRefs(tomlText) {
  const names = [];
  for (const line of String(tomlText).split(/\r?\n/)) {
    const code = line.replace(/^\s*#.*$/, '');
    for (const m of code.matchAll(/env\(([A-Za-z_][A-Za-z0-9_]*)\)/g)) {
      if (!names.includes(m[1])) names.push(m[1]);
    }
  }
  return names;
}

/** Returns the `KEY=VALUE` pairs of a dotenv file as an object. Skips blank
 * lines and `#` comments, accepts an `export ` prefix and strips one pair of
 * matching quotes. */
export function parseEnvFile(text) {
  const out = {};
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    let value = m[2];
    const q = value[0];
    if ((q === '"' || q === "'") && value.length >= 2 && value.endsWith(q)) {
      value = value.slice(1, -1);
    }
    out[m[1]] = value;
  }
  return out;
}

/** Returns the names from `names` that `env` does not set to a non-empty
 * value. */
export function missingEnv(names, env) {
  return names.filter((name) => typeof env[name] !== 'string' || env[name] === '');
}

export const MIGRATION_NAME_RE = /^\d{14}_[a-z0-9_]+\.sql$/;

/** Pairs every migration with the reversal of the same name. Returns
 * `{ pairs, errors }`: a pair is `{ name }`, an error names a migration
 * without a reversal, a reversal without a migration, or a bad name. */
export function pairMigrations(migrationNames, reversalNames) {
  const errors = [];
  const migrations = [...migrationNames].sort();
  const reversals = new Set(reversalNames);
  const pairs = [];
  for (const name of migrations) {
    if (!MIGRATION_NAME_RE.test(name)) {
      errors.push(`${name}: the name does not match <14 digits>_<snake_case>.sql`);
      continue;
    }
    if (!reversals.has(name)) {
      errors.push(`${name}: no reversal in supabase/reversals/${name}`);
      continue;
    }
    pairs.push({ name });
  }
  const known = new Set(migrations);
  for (const name of [...reversalNames].sort()) {
    if (!known.has(name)) errors.push(`${name}: a reversal without a migration`);
  }
  return { pairs, errors };
}

/** True when a reversal file says only `-- additive`: the migration adds
 * objects that a later reversal of the release does not need to remove. */
export function isAdditiveMarker(reversalText) {
  return /^-- additive(?:\r?\n)?$/.test(String(reversalText));
}

function stripSqlComments(sql) {
  return String(sql)
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\n]*/g, ' ');
}

/** Returns the statements of a migration that an `-- additive` reversal
 * cannot undo: a `drop`, a `rename`, or a type change (`alter table ...
 * alter column ... type`, `alter type`). Blind spots, read by a reviewer
 * instead: `create or replace` of an existing object, `set not null`,
 * `revoke` (every table migration revokes the default grants) and data
 * statements (`update`, `delete`, `insert`) - docs/specs/COVERAGE.md,
 * "Known thin spots". */
export function nonAdditiveStatements(migrationText) {
  const statements = stripSqlComments(migrationText)
    .split(';')
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  return statements.filter((s) => {
    const lower = s.toLowerCase();
    if (/\bdrop\b/.test(lower)) return true;
    if (/\brename\b/.test(lower)) return true;
    if (/^alter\s+type\b/.test(lower)) return true;
    if (
      /^alter\s+table\b.*\balter\s+(?:column\s+)?\S+\s+(?:set\s+data\s+)?type\b/.test(lower)
    ) {
      return true;
    }
    return false;
  });
}

/** Returns the 14-digit version of a migration file name, or `null` when
 * the name does not match MIGRATION_NAME_RE. */
export function migrationVersion(name) {
  return MIGRATION_NAME_RE.test(name) ? name.slice(0, 14) : null;
}

/** Returns the sorted migration names whose version is not in
 * `appliedVersions` (the versions of `supabase_migrations.schema_migrations`).
 * A name without a version is listed too, so a bad name is loud. */
export function pendingMigrations(localNames, appliedVersions) {
  const done = new Set(appliedVersions);
  return [...localNames]
    .filter((name) => {
      const version = migrationVersion(name);
      return version === null || !done.has(version);
    })
    .sort();
}
