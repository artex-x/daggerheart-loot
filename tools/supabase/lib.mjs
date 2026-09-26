/*
  Pure logic for the Supabase release tools (config.mjs, db-push.mjs,
  db.mjs, limits.mjs, migrate-test.mjs, pending-check.mjs, restore.mjs,
  restore-drill.mjs, restore-prod.mjs) and the reversibility gate in
  tests/db/. No process
  spawn, no filesystem: every
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

// Every service of the local stack but the database. `npm run check:db`
// starts the stack without them; the restore drill keeps `gotrue` (a
// production dump names the columns that hosted Auth migrated). The release
// that ships Realtime removes `realtime` from this list.
export const LOCAL_STACK_EXCLUDES = Object.freeze([
  'gotrue',
  'realtime',
  'storage-api',
  'imgproxy',
  'kong',
  'mailpit',
  'postgrest',
  'postgres-meta',
  'studio',
  'edge-runtime',
  'logflare',
  'vector',
  'supavisor'
]);

/** Returns the top-level `project_id` of a config.toml, or `null`. The CLI
 * names the local containers after it (`supabase_db_<id>`). */
export function localProjectId(tomlText) {
  for (const line of String(tomlText).split(/\r?\n/)) {
    if (/^\s*\[/.test(line)) break;
    const m = /^\s*project_id\s*=\s*"([^"]+)"\s*(?:#.*)?$/.exec(line);
    if (m) return m[1];
  }
  return null;
}

/** True when `s` has the shape of a native X25519 age identity
 * (`AGE-SECRET-KEY-1` and 58 Bech32 characters in upper case). */
export function isAgeIdentity(s) {
  return typeof s === 'string' && /^AGE-SECRET-KEY-1[0-9A-Z]{58}$/.test(s.trim());
}

/** Returns the plaintext of an age file (binary format) as a Uint8Array.
 * Any library error becomes one message that names no key and no data. */
export async function decryptAge(bytes, identity) {
  // Loaded here, not at the top: every release tool imports this module,
  // and only the drill needs the library.
  const { Decrypter } = await import('age-encryption');
  try {
    const d = new Decrypter();
    d.addIdentity(String(identity).trim());
    return await d.decrypt(bytes);
  } catch (err) {
    throw new Error('the key does not open the file', { cause: err });
  }
}

const BACKUP_ARTIFACT_RE = /^backup-\d{4}-\d{2}-\d{2}$/;

/** Returns `{ name, createdAt }` of the first artifact in one run's GitHub
 * API `artifacts` array that `backup.yml` made and that has not expired,
 * or `null`. */
export function pickBackupArtifact(artifacts) {
  for (const a of artifacts ?? []) {
    if (a && BACKUP_ARTIFACT_RE.test(a.name) && a.expired !== true) {
      return { name: a.name, createdAt: a.created_at ?? null };
    }
  }
  return null;
}

const DUMP_ERROR = 'the dump has an unterminated string or statement';

/* Reads a qualified name (`"auth"."users"`, `public.lists`) at `i`.
 * Returns `{ name, end }`; quotes are removed. */
function readQualifiedName(text, i) {
  const parts = [];
  let j = i;
  for (;;) {
    if (text[j] === '"') {
      let part = '';
      j++;
      for (;;) {
        if (j >= text.length) throw new Error(DUMP_ERROR);
        if (text[j] === '"') {
          if (text[j + 1] === '"') {
            part += '"';
            j += 2;
            continue;
          }
          j++;
          break;
        }
        part += text[j++];
      }
      parts.push(part);
    } else {
      const m = /^[A-Za-z_][A-Za-z0-9_$]*/.exec(text.slice(j, j + 128));
      if (!m) break;
      parts.push(m[0]);
      j += m[0].length;
    }
    if (text[j] !== '.') break;
    j++;
  }
  return { name: parts.join('.'), end: j };
}

/* Returns the index after the `;` that ends the statement at `i`, and the
 * number of row tuples after its top-level VALUES. */
function scanStatement(text, i) {
  let depth = 0;
  let afterValues = false;
  let lastWord = '';
  let rows = 0;
  let j = i;
  while (j < text.length) {
    const ch = text[j];
    if (ch === "'") {
      j++;
      for (;;) {
        if (j >= text.length) throw new Error(DUMP_ERROR);
        if (text[j] === "'") {
          if (text[j + 1] === "'") {
            j += 2;
            continue;
          }
          j++;
          break;
        }
        j++;
      }
      lastWord = "'";
      continue;
    }
    if (ch === '"') {
      j = readQualifiedName(text, j).end;
      lastWord = '"';
      continue;
    }
    if (ch === '-' && text[j + 1] === '-') {
      const nl = text.indexOf('\n', j);
      j = nl === -1 ? text.length : nl + 1;
      continue;
    }
    if (ch === ';' && depth === 0) return { end: j + 1, rows };
    if (ch === '(') {
      if (depth === 0 && afterValues && (lastWord === 'VALUES' || lastWord === ',')) rows++;
      depth++;
      lastWord = '(';
      j++;
      continue;
    }
    if (ch === ')') {
      depth = Math.max(0, depth - 1);
      lastWord = ')';
      j++;
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      const m = /^[A-Za-z_][A-Za-z0-9_$]*/.exec(text.slice(j, j + 64));
      const word = m[0].toUpperCase();
      if (depth === 0 && word === 'VALUES') afterValues = true;
      lastWord = word;
      j += m[0].length;
      continue;
    }
    if (!/\s/.test(ch)) lastWord = ch;
    j++;
  }
  throw new Error(DUMP_ERROR);
}

/** Returns a Map of `schema.table` to the rows a data dump holds: each
 * tuple of an `INSERT ... VALUES (...), (...);` and each data line of a
 * `COPY ... FROM stdin;` block. Skips `--` comments and psql meta lines
 * (`\restrict`). Throws on an unterminated string or statement; the
 * message quotes no text of the dump. */
export function dumpRowCounts(sqlText) {
  const text = String(sqlText);
  const counts = new Map();
  const add = (name, n) => {
    if (n > 0) counts.set(name, (counts.get(name) ?? 0) + n);
  };
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === '\\' || (ch === '-' && text[i + 1] === '-')) {
      const nl = text.indexOf('\n', i);
      i = nl === -1 ? text.length : nl + 1;
      continue;
    }
    const insert = /^INSERT\s+INTO\s+/i.exec(text.slice(i, i + 64));
    const copy = /^COPY\s+/i.exec(text.slice(i, i + 16));
    if (insert) {
      const { name } = readQualifiedName(text, i + insert[0].length);
      const { end, rows } = scanStatement(text, i);
      add(name, rows);
      i = end;
      continue;
    }
    if (copy) {
      const { name } = readQualifiedName(text, i + copy[0].length);
      const { end } = scanStatement(text, i);
      const head = text.slice(i, end);
      i = end;
      if (!/\bFROM\s+stdin\s*;$/i.test(head)) continue;
      const nl = text.indexOf('\n', i);
      if (nl === -1) throw new Error(DUMP_ERROR);
      i = nl + 1;
      let rows = 0;
      for (;;) {
        if (i >= text.length) throw new Error(DUMP_ERROR);
        const eol = text.indexOf('\n', i);
        const line = text.slice(i, eol === -1 ? text.length : eol).replace(/\r$/, '');
        i = eol === -1 ? text.length : eol + 1;
        if (line === '\\.') break;
        rows++;
      }
      add(name, rows);
      continue;
    }
    i = scanStatement(text, i).end;
  }
  return counts;
}

/** Returns the sorted names of the `public` tables that a schema dump
 * creates, without the schema and without quotes. */
export function dumpPublicTables(schemaText) {
  const re =
    /\bCREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:"public"|public)\.(?:"((?:[^"]|"")+)"|([A-Za-z_][A-Za-z0-9_$]*))/gi;
  const names = new Set();
  for (const m of String(schemaText).matchAll(re)) {
    names.add(m[1] !== undefined ? m[1].replace(/""/g, '"') : m[2]);
  }
  return [...names].sort();
}

/** Returns one statement that empties the given `public` tables, or `''`
 * for none. The migrations seed rows (limit_defaults) that a data dump
 * holds too, so a load starts from empty tables. */
export function truncateStatement(tables) {
  if (!tables.length) return '';
  const quoted = tables.map((t) => `"public"."${String(t).replace(/"/g, '""')}"`);
  return `TRUNCATE TABLE ${quoted.join(', ')} CASCADE;\n`;
}

const SQLSTATE_HINTS = new Map([
  [
    '42703',
    'a column the backup names is missing locally - hosted Auth may be newer than the pinned CLI'
  ],
  [
    '42P01',
    'a table the backup names is missing locally - hosted Auth or the migrations may be newer than this checkout'
  ],
  ['23505', 'a row of the backup collides with a row already in the local database'],
  [
    '42501',
    'the local database user may not run a statement of the backup, for example SET session_replication_role'
  ]
]);

/* Returns the report line of a failed load: the SQLSTATE, the dump line
 * and a hint from `hints`, or psql's exit status. */
function loadFailLine(load, hints) {
  if (!load.sqlstate) {
    return `load: FAIL psql exited with status ${load.status}; no SQLSTATE was reported`;
  }
  const hint = hints.get(load.sqlstate);
  const at = load.line ? ` at dump line ${load.line}` : '';
  return `load: FAIL SQLSTATE ${load.sqlstate}${at}${hint ? ` (${hint})` : ''}`;
}

/** The recovery command when a drill could not reset the local database. */
export const RESET_COMMAND = 'node node_modules/supabase/dist/supabase.js db reset --local';

/** Returns `{ pass, lines }`, the counts-only report of a restore drill.
 * `input`: `artifact` (`{ name, runId, ageDays }`, `{ safety: <stamp> }`
 * for a drill of a safety backup, or null), `failure` (the
 * message of a step that stopped the drill, or null), `decrypted`,
 * `dumpTables` and `localTables` (bare `public` names, or null), `load`
 * (null, `{ ok: true }`, `{ ok: false, skipped: true }` or `{ ok: false,
 * sqlstate, line, status }`), `counts` (Map of `schema.table` to `{ loaded,
 * dump }`, or null), `cleanup` (`{ tempRemoved, reset }`; `reset` is null
 * when the drill stopped before the local stack). */
export function drillReport(input) {
  const lines = [];
  let pass = true;
  const fail = (line) => {
    pass = false;
    lines.push(line);
  };
  const { artifact, failure, decrypted, dumpTables, localTables, load, counts, cleanup } =
    input;

  if (artifact && artifact.safety) {
    lines.push(`source: safety ${artifact.safety}`);
  } else if (artifact) {
    lines.push(`artifact: ${artifact.name} (run ${artifact.runId}, ${artifact.ageDays} d old)`);
    if (artifact.ageDays > 2) {
      lines.push(
        `WARN: the newest backup is ${artifact.ageDays} days old; the nightly backup may be failing`
      );
    }
  } else pass = false;
  if (decrypted) lines.push('decrypt: schema.sql.age ok, data.sql.age ok');
  else pass = false;
  if (failure) fail(`FAIL: ${failure}`);

  if (dumpTables && localTables) {
    const local = new Set(localTables);
    const inDump = new Set(dumpTables);
    const missing = dumpTables.filter((t) => !local.has(t));
    const extra = localTables.filter((t) => !inDump.has(t));
    lines.push(
      `schema: ${dumpTables.length} public tables in the dump, ${localTables.length} local; missing locally: ${missing.length ? missing.join(', ') : 'none'}`
    );
    if (missing.length) {
      fail(
        `FAIL: production has a table the migrations do not make: ${missing.map((t) => `public.${t}`).join(', ')}`
      );
    }
    if (extra.length) {
      lines.push(
        `info: local tables not in the dump: ${extra.map((t) => `public.${t}`).join(', ')}`
      );
    }
  } else pass = false;

  if (!load) pass = false;
  else if (load.ok) lines.push('load: ok (1 transaction)');
  else if (load.skipped) fail('load: skipped (the schema check failed)');
  else fail(loadFailLine(load, SQLSTATE_HINTS));

  if (counts) {
    lines.push('rows (loaded / in dump):');
    const names = [...counts.keys()].sort();
    const otherAuth = names.filter((n) => n.startsWith('auth.') && n !== 'auth.users');
    const authMatch = otherAuth.every((n) => counts.get(n).loaded === counts.get(n).dump);
    for (const name of names) {
      if (authMatch && otherAuth.includes(name)) continue;
      const { loaded, dump } = counts.get(name);
      if (loaded === dump) lines.push(`  ${name} ${loaded} / ${dump}`);
      else fail(`  ${name} ${loaded} / ${dump} MISMATCH`);
    }
    if (authMatch && otherAuth.length) {
      lines.push(`  auth: ${otherAuth.length} other tables match (${otherAuth.join(', ')})`);
    }
  } else pass = false;

  if (cleanup && cleanup.tempRemoved && cleanup.reset) {
    lines.push('cleanup: temp files deleted, local database reset');
  } else if (cleanup && cleanup.tempRemoved && cleanup.reset === null) {
    lines.push('cleanup: temp files deleted; the drill stopped before the local stack');
  } else {
    const parts = [];
    if (!cleanup || !cleanup.tempRemoved) parts.push('the temp directory was not deleted');
    if (!cleanup || !cleanup.reset) {
      parts.push(
        `the local database was not reset and may hold production rows; in PowerShell run: ${RESET_COMMAND}`
      );
    }
    fail(`cleanup: FAIL ${parts.join('; ')}`);
  }
  return { pass, lines };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const RUN_ID_RE = /^\d{1,20}$/;
/** The name of a safety backup's directory: its UTC time to the second. */
export const SAFETY_STAMP_RE = /^\d{8}T\d{6}Z$/;

/** Returns `{ source }` from the arguments of restore-drill.mjs and
 * restore-prod.mjs: `--backup <YYYY-MM-DD>` gives `{ kind: 'backup', date
 * }`, `--backup <run id>` gives `{ kind: 'backup', runId }`, `--safety
 * <stamp>` gives `{ kind: 'safety', stamp }`, and no argument gives
 * `source: null`. Throws on both, on an unknown argument or a bad value. */
export function parseRestoreArgs(argv) {
  let source = null;
  const usage = 'Use --backup <YYYY-MM-DD|run id> or --safety <YYYYMMDDTHHMMSSZ>, not both.';
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const eq = arg.indexOf('=');
    const name = eq === -1 ? arg : arg.slice(0, eq);
    if (name !== '--backup' && name !== '--safety') {
      throw new Error(`Unknown argument "${arg}". ${usage}`);
    }
    if (source) throw new Error(`Two sources were given. ${usage}`);
    const value = (eq === -1 ? argv[++i] : arg.slice(eq + 1)) ?? '';
    if (name === '--backup' && DATE_RE.test(value)) source = { kind: 'backup', date: value };
    else if (name === '--backup' && RUN_ID_RE.test(value))
      source = { kind: 'backup', runId: value };
    else if (name === '--safety' && SAFETY_STAMP_RE.test(value)) {
      source = { kind: 'safety', stamp: value };
    } else throw new Error(`${name} has a missing or bad value. ${usage}`);
  }
  return { source };
}

/** Returns the stamp of a safety backup made at `date`: `YYYYMMDDTHHMMSSZ`. */
export function safetyStamp(date) {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

/* Returns the time of a stamp in milliseconds, or NaN. */
function stampTime(s) {
  if (!SAFETY_STAMP_RE.test(s)) return Number.NaN;
  return Date.parse(
    `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(9, 11)}:${s.slice(11, 13)}:${s.slice(13, 15)}Z`
  );
}

/** Returns the stamps in `stamps` older than `days` days at `now`. A name
 * that is not a stamp is never returned. */
export function staleSafetyStamps(stamps, now, days = 30) {
  const limit = now.getTime() - days * 86400000;
  return stamps.filter((s) => stampTime(s) < limit);
}

/* Returns the index after the single-quoted string that starts at `j`. */
function skipString(text, j) {
  let k = j + 1;
  for (;;) {
    if (k >= text.length) throw new Error(DUMP_ERROR);
    if (text[k] === "'") {
      if (text[k + 1] === "'") {
        k += 2;
        continue;
      }
      return k + 1;
    }
    k++;
  }
}

/* Reads the bracketed list that starts at `i` (`text[i]` is `(`). Returns
 * `{ items, end }`: the trimmed texts between its top-level commas. */
function readTuple(text, i) {
  const items = [];
  let depth = 0;
  let start = i + 1;
  let j = i;
  while (j < text.length) {
    const ch = text[j];
    if (ch === "'") {
      j = skipString(text, j);
      continue;
    }
    if (ch === '"') {
      j = readQualifiedName(text, j).end;
      continue;
    }
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) {
        items.push(text.slice(start, j).trim());
        return { items, end: j + 1 };
      }
    } else if (ch === ',' && depth === 1) {
      items.push(text.slice(start, j).trim());
      start = j + 1;
    }
    j++;
  }
  throw new Error(DUMP_ERROR);
}

function skipSpace(text, j) {
  let k = j;
  while (k < text.length && /\s/.test(text[k])) k++;
  return k;
}

/** Returns the literal text of `column` in each row of `table`'s `INSERT`
 * statements in a data dump, in order (`'...'`, a number or `NULL`).
 * `table` is `schema.table` without quotes. Throws when a statement has no
 * column list or lacks the column, or when the dump holds the table as
 * COPY rows; no message quotes a value. */
export function dumpColumnValues(sqlText, table, column) {
  const text = String(sqlText);
  const values = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === '\\' || (ch === '-' && text[i + 1] === '-')) {
      const nl = text.indexOf('\n', i);
      i = nl === -1 ? text.length : nl + 1;
      continue;
    }
    const head = /^(?:INSERT\s+INTO|COPY)\s+/i.exec(text.slice(i, i + 64));
    const named = head ? readQualifiedName(text, i + head[0].length) : null;
    if (named && named.name === table) {
      if (/^COPY/i.test(head[0])) {
        throw new Error(`the dump holds ${table} as COPY rows; only INSERT rows are read`);
      }
      let j = skipSpace(text, named.end);
      if (text[j] !== '(') throw new Error(`an INSERT into ${table} has no column list`);
      const cols = readTuple(text, j);
      const names = cols.items.map((c) => {
        const m = /^"((?:[^"]|"")*)"$/.exec(c);
        return m ? m[1].replace(/""/g, '"') : c;
      });
      const at = names.indexOf(column);
      if (at === -1) throw new Error(`an INSERT into ${table} has no column ${column}`);
      const values_ = /^\s*(?:OVERRIDING\s+\w+\s+VALUE\s+)?VALUES\s*/i.exec(
        text.slice(cols.end, cols.end + 64)
      );
      if (!values_) throw new Error(`an INSERT into ${table} has no VALUES`);
      j = cols.end + values_[0].length;
      for (;;) {
        j = skipSpace(text, j);
        if (text[j] !== '(') break;
        const row = readTuple(text, j);
        values.push(row.items[at]);
        j = skipSpace(text, row.end);
        if (text[j] !== ',') break;
        j++;
      }
    }
    i = scanStatement(text, i).end;
  }
  return values;
}

/** Returns `text` when it is a quoted uuid or a bare integer, the two key
 * shapes of the dumped `auth` tables; otherwise throws without quoting it. */
export function keyLiteral(text) {
  const s = String(text);
  if (/^'[0-9a-f-]{36}'$/i.test(s) || /^\d{1,19}$/.test(s)) return s;
  throw new Error('a key of the dump is not a uuid or an integer');
}

/** Returns `tables` (`schema.table`) in the order that deletes a child row
 * before the row it references: `edges` are `{ from, to }`, `from`
 * referencing `to`. Ties go by name. Throws on a cycle. */
export function authDeleteOrder(tables, edges) {
  const left = new Set(tables);
  const inner = edges.filter((e) => e.from !== e.to && left.has(e.from) && left.has(e.to));
  const order = [];
  while (left.size) {
    const ready = [...left].filter((t) => !inner.some((e) => e.to === t && left.has(e.from)));
    if (!ready.length) {
      throw new Error('the foreign keys among the dumped auth tables form a cycle');
    }
    const next = ready.sort()[0];
    order.push(next);
    left.delete(next);
  }
  return order;
}

/** Returns `schema.name` as a quoted SQL name: `"schema"."name"`. */
export function quoteQualified(name) {
  const dot = name.indexOf('.');
  const q = (s) => `"${s.replace(/"/g, '""')}"`;
  return `${q(name.slice(0, dot))}.${q(name.slice(dot + 1))}`;
}

const KEYS_PER_DELETE = 1000;

/** Returns the statements that delete the dumped keys, one `DELETE` per
 * 1000 keys, in `order`: `keysByTable` maps a table to its key literals,
 * `keyColumnByTable` to its single key column. A table with keys and no
 * single key column throws before any statement is returned. */
export function keyDeleteStatements(order, keysByTable, keyColumnByTable) {
  for (const table of order) {
    if ((keysByTable.get(table) ?? []).length && !keyColumnByTable.get(table)) {
      throw new Error(
        `${table} has no single-column primary key; a delete by key is not possible`
      );
    }
  }
  let out = '';
  for (const table of order) {
    const keys = keysByTable.get(table) ?? [];
    if (!keys.length) continue;
    const column = `"${String(keyColumnByTable.get(table)).replace(/"/g, '""')}"`;
    for (let i = 0; i < keys.length; i += KEYS_PER_DELETE) {
      const chunk = keys.slice(i, i + KEYS_PER_DELETE).map(keyLiteral);
      out += `DELETE FROM ${quoteQualified(table)} WHERE ${column} IN (${chunk.join(', ')});\n`;
    }
  }
  return out;
}

/** Returns `{ before, after }`, the statements around a load that keep
 * each sequence (`{ seq, table, column }`, `schema.name`) at or above both
 * its value before the load and its column's highest value after it. The
 * dump's own `setval` holds the backup's value, which may be lower than
 * the target's; a lower sequence gives a new row a key that exists. */
export function sequenceGuard(sequences) {
  if (!sequences.length) return { before: '', after: '' };
  const lit = (name) => `'${quoteQualified(name).replace(/'/g, "''")}'`;
  const selects = sequences.map(
    (s) => `SELECT ${lit(s.seq)}::text AS seq, last_value FROM ${quoteQualified(s.seq)}`
  );
  const before = `CREATE TEMP TABLE restore_seq_before ON COMMIT DROP AS ${selects.join(' UNION ALL ')};\n`;
  const after = sequences
    .map((s) => {
      const column = `"${s.column.replace(/"/g, '""')}"`;
      const max = `COALESCE((SELECT max(${column}) FROM ${quoteQualified(s.table)}), 1)`;
      const was = `(SELECT last_value FROM pg_temp.restore_seq_before WHERE seq = ${lit(s.seq)})`;
      return `SELECT pg_catalog.setval(${lit(s.seq)}, GREATEST(${max}, ${was}), true);\n`;
    })
    .join('');
  return { before, after };
}

/** Returns a `pg_dump --data-only` output in the shape of the CLI's data
 * dump: `SET session_replication_role = replica;` first, the `\restrict`
 * and `\unrestrict` lines as `--` comments, `RESET ALL;` last. */
export function cliShapedDataDump(pgDumpText) {
  const body = String(pgDumpText).replace(/^\\(un)?restrict .*$/gm, '-- $&');
  const nl = body.endsWith('\n') ? '' : '\n';
  return `SET session_replication_role = replica;\n${body}${nl}RESET ALL;\n`;
}

/** Returns the receipt of a passed drill: the source id (`run <id>` or
 * `safety <stamp>`), the hashes, the newest migration, the host and the
 * time. */
export function receiptFor({ source, schemaHash, dataHash, newestMigration, host, at }) {
  return {
    source,
    schemaHash,
    dataHash,
    newestMigration,
    host,
    at: at.toISOString()
  };
}

const RECEIPTS_KEPT = 20;

/** Returns `list` with `receipt` first and no other receipt of its source,
 * at most 20. */
export function addReceipt(list, receipt) {
  const others = (list ?? []).filter((r) => r && r.source !== receipt.source);
  return [receipt, ...others].slice(0, RECEIPTS_KEPT);
}

const RECEIPT_MAX_AGE_MS = 24 * 3600 * 1000;

/** Returns `{ ok: true, receipt }` when `list` holds a receipt of
 * `sourceId` under 24 h old with the same data hash, newest migration and
 * host; otherwise `{ ok: false, reason }` (`none`, `older than 24 h`,
 * `other data`, `other newest migration`, `other host`). */
export function checkReceipt(list, { sourceId, dataHash, newestMigration, host, now }) {
  const receipt = (list ?? []).find((r) => r && r.source === sourceId);
  if (!receipt) return { ok: false, reason: 'none' };
  const age = now.getTime() - Date.parse(receipt.at);
  if (!(age >= 0 && age <= RECEIPT_MAX_AGE_MS)) return { ok: false, reason: 'older than 24 h' };
  if (receipt.dataHash !== dataHash) return { ok: false, reason: 'other data' };
  if (receipt.newestMigration !== newestMigration) {
    return { ok: false, reason: 'other newest migration' };
  }
  if (receipt.host !== host) return { ok: false, reason: 'other host' };
  return { ok: true, receipt };
}

/** Returns the libpq environment of a connection string: `PGHOST`,
 * `PGPORT` (5432 when absent), `PGUSER` and `PGPASSWORD` (both
 * percent-decoded), `PGDATABASE` (`postgres` when absent) and `PGSSLMODE`
 * `require`. Throws on another scheme or a query string; no message holds
 * any part of the string. */
export function pgEnvFromUrl(url) {
  let parsed;
  try {
    parsed = new URL(String(url));
  } catch {
    throw new Error('the connection string is not a URL');
  }
  if (!/^postgres(?:ql)?:$/.test(parsed.protocol)) {
    throw new Error('the connection string is not a postgres:// or postgresql:// URL');
  }
  if (parsed.search || parsed.hash) {
    throw new Error('the connection string has a query string; remove it');
  }
  try {
    return {
      PGHOST: parsed.hostname,
      PGPORT: parsed.port || '5432',
      PGUSER: decodeURIComponent(parsed.username),
      PGPASSWORD: decodeURIComponent(parsed.password),
      PGDATABASE: decodeURIComponent(parsed.pathname.slice(1)) || 'postgres',
      PGSSLMODE: 'require'
    };
  } catch {
    throw new Error('the connection string has a bad percent-encoding');
  }
}

const PROD_SQLSTATE_HINTS = new Map([
  ['42703', 'a column the backup names is missing in the target'],
  ['42P01', 'a table the backup names is missing in the target'],
  ['23505', 'a row of the backup collides with a row that the delete by key did not remove'],
  [
    '42501',
    'the database user may not run a statement of the load, for example SET session_replication_role'
  ]
]);

/** Returns `{ verdict, pass, lines }`, the counts-only report of a
 * production restore; `verdict` is `PASS`, `FAIL` or `ABORTED`. `state`:
 * `failure` (a refusal or an error), `source` (`{ name }`), `receipt` (`{
 * at }`), `target` (`{ publicTables }`), `safety` (`{ dir }`), `rows` (`[{
 * table, now, backup }]`), `confirmed` (true or false), `load` (as
 * drillReport's), `verify` (`{ tables, mismatches: [{ name, got, want }],
 * sequences: [{ seq, ok }] }`); each may be absent. The lines only grow as
 * the state grows, so a caller may print a prefix before the prompt. */
export function prodReport(state) {
  const lines = [];
  let pass = true;
  const fail = (line) => {
    pass = false;
    lines.push(line);
  };
  const { failure, source, receipt, target, safety, rows, confirmed, load, verify } = state;
  if (source) {
    const at = receipt
      ? `, receipt ${String(receipt.at).slice(0, 16).replace('T', ' ')} UTC ok`
      : '';
    lines.push(`source: ${source.name}${at}`);
  }
  if (target) {
    lines.push(`target: migrations match; ${target.publicTables} public tables present`);
  }
  if (safety) lines.push(`safety backup: ${safety.dir} (schema.sql.age, data.sql.age)`);
  if (rows) {
    lines.push('rows (production now -> backup):');
    for (const r of rows) lines.push(`  ${r.table} ${r.now} -> ${r.backup}`);
  }
  if (confirmed === true) lines.push('confirm: typed ref ok');
  else if (confirmed === false) {
    lines.push('confirm: the typed text is not the production ref; nothing was written');
  }
  // Only an SQL error (a SQLSTATE, or psql's exit 3 under ON_ERROR_STOP)
  // proves the rollback; a killed or failed psql may have committed.
  const rolledBack = Boolean(load && !load.ok && (load.sqlstate || load.status === 3));
  if (load && load.ok) lines.push('load: ok (1 transaction)');
  else if (load) {
    fail(loadFailLine(load, PROD_SQLSTATE_HINTS));
    lines.push(
      rolledBack
        ? '  production is unchanged: the transaction rolled back'
        : '  production state is unknown: psql stopped without an SQL error; compare the counts with a drill of the backup, and run the undo line if they differ'
    );
  }
  if (verify) {
    const lowered = verify.sequences.filter((s) => !s.ok);
    if (!verify.mismatches.length && !lowered.length) {
      const seqs = verify.sequences.map((s) => s.seq);
      const seqPart = seqs.length ? `; sequences not lowered: ${seqs.join(', ')}` : '';
      lines.push(`verify: ${verify.tables} tables match${seqPart}`);
    } else {
      fail('verify: FAIL');
      for (const m of verify.mismatches) fail(`  ${m.name} ${m.got} / ${m.want} MISMATCH`);
      for (const s of lowered) fail(`  ${s.seq} is below its column's highest value`);
    }
  }
  if (failure) fail(`FAIL: ${failure}`);
  if (safety) {
    const stamp = safety.dir.split(/[\\/]/).pop();
    if (load && !rolledBack) {
      lines.push(
        `undo: npm run restore:drill -- --safety ${stamp}, then npm run restore:prod -- --safety ${stamp}`
      );
    } else if (confirmed === false || load || failure) {
      lines.push(`safety backup kept: ${safety.dir}; production is unchanged`);
    }
  }
  if (confirmed !== false && !(load && load.ok && verify)) pass = false;
  const verdict = !pass ? 'FAIL' : confirmed === false ? 'ABORTED' : 'PASS';
  return { verdict, pass: verdict === 'PASS', lines };
}
