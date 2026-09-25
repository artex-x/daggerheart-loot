/*
  Pure logic for the Supabase release tools (config.mjs, db-push.mjs,
  db.mjs, limits.mjs, migrate-test.mjs, pending-check.mjs) and the
  reversibility gate in tests/db/. No process spawn, no filesystem: every
  input arrives as an argument, so lib.test.mjs covers it inside `npm run
  check`.
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

/** Returns the name in PROJECTS (`test` or `prod`) whose project a
 * connection string targets, or `null`. The target is the pooler user
 * `postgres.<ref>` on a `*.pooler.supabase.com` host, or the direct host
 * `db.<ref>.supabase.co` with the user `postgres` or `postgres.<ref>`. A
 * query string or a hash gives `null`: libpq reads `user=` and `host=`
 * there too, so it can move the target. Rule 2n's `isTestDbUrl` in
 * .claude/hooks/bash-guard.mjs reads a URL the same way. */
export function dbUrlProject(url) {
  let parsed;
  let user;
  try {
    parsed = new URL(String(url));
    user = decodeURIComponent(parsed.username);
  } catch {
    return null;
  }
  if (!/^postgres(?:ql)?:$/.test(parsed.protocol) || parsed.search || parsed.hash) return null;
  for (const [name, ref] of Object.entries(PROJECTS)) {
    const poolerUser = `postgres.${ref}`;
    if (parsed.hostname === `db.${ref}.supabase.co`) {
      if (user === 'postgres' || user === poolerUser) return name;
    } else if (parsed.hostname.endsWith('.pooler.supabase.com') && user === poolerUser) {
      return name;
    }
  }
  return null;
}

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

const LIMIT_MODES = new Map([
  ['--value', 'value'],
  ['--default', 'default'],
  ['--clear', 'default'],
  ['--unlimited', 'unlimited']
]);

/** Returns `{ project, user, key, mode, value }` from the arguments of
 * `npm run limits:set`: `--project test|prod --user <email|uuid> --key
 * <key>` and exactly one of `--value <n>`, `--default`, `--clear` (the
 * same as `--default`) or `--unlimited`. `mode` is `value`, `default` or
 * `unlimited`; `value` is the integer for `value`, else `null`. Throws on a
 * bad shape. The keys live in the database, not here. */
export function parseLimitsArgs(argv) {
  const { project } = parseProjectArg(argv);
  let user = null;
  let key = null;
  let raw = null;
  const modes = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--user') user = argv[++i] ?? null;
    else if (arg === '--key') key = argv[++i] ?? null;
    else if (arg === '--project') i++;
    else if (arg.startsWith('--project=')) continue;
    else if (LIMIT_MODES.has(arg)) {
      modes.push(arg);
      if (arg === '--value') raw = argv[++i] ?? null;
    } else throw new Error(`The argument "${arg}" is unknown.`);
  }
  if (!user) throw new Error('The user is missing. Pass --user <email or uuid>.');
  if (!key) throw new Error('The key is missing. Pass --key <limit key>.');
  if (modes.length !== 1) {
    throw new Error(
      `Pass exactly one of --value <n>, --default, --clear or --unlimited (got ${modes.length}).`
    );
  }
  const mode = LIMIT_MODES.get(modes[0]);
  let value = null;
  if (mode === 'value') {
    if (raw === null || !/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw))) {
      throw new Error(
        `The value is ${raw === null ? 'missing' : `"${raw}"`}. Pass a non-negative integer.`
      );
    }
    value = Number(raw);
    if (value > 2147483647) throw new Error(`The value ${raw} is too large for an integer.`);
  }
  return { project, user, key, mode, value };
}

/** Returns one side of a `limits:set` report: the override's value (`200`,
 * `unlimited`), or with no override the default's (`default 50`, `default
 * unlimited`). `limit` is `{ override: boolean, value: number | null,
 * fallback: number | null }`. */
export function describeLimit({ override, value, fallback }) {
  const shown = (n) => (n === null ? 'unlimited' : String(n));
  return override ? shown(value) : `default ${shown(fallback)}`;
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
