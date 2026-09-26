/*
  The shared half of the two restore commands: restore-drill.mjs (the local
  drill, anyone) and restore-prod.mjs (production, the owner only). It
  finds and reads a backup or a safety backup, keeps the key out of every
  child process, drives the local stack, loads a dump through `psql` and
  dumps a database through `pg_dump`, both inside the local database
  container, and reads and writes the drill receipts. Procedure:
  .claude/README.md, "Run the agent drill" and "Restore production (owner)".
*/
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connect, ownedSequences, publicTables, rowCounts } from './db.mjs';
import {
  LOCAL_STACK_EXCLUDES,
  SUPABASE_CLI,
  cliShapedDataDump,
  dumpPublicTables,
  dumpRowCounts,
  envRefs,
  isAgeIdentity,
  parseEnvFile,
  pickBackupArtifact,
  sequenceGuard,
  staleSafetyStamps,
  truncateStatement
} from './lib.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const KEY_VAR = 'BACKUP_AGE_IDENTITY';
export const KEY_FILE = '.env.restore.local';
const TMP_PREFIX = 'restore-drill-';
export const RUNS_TO_SEARCH = 10;
const RUNS_FOR_A_DATE = 30;

/** The libpq environment of the local database, as `psql` and `pg_dump`
 * reach it inside its own container. Fixed local values, not secrets. */
export const LOCAL_PG_ENV = Object.freeze({
  PGHOST: '127.0.0.1',
  PGPORT: '5432',
  PGUSER: 'postgres',
  PGPASSWORD: 'postgres',
  PGDATABASE: 'postgres',
  PGSSLMODE: 'disable'
});
const PG_ENV_NAMES = Object.keys(LOCAL_PG_ENV);

/** Returns the root of the main checkout (the parent of git's common
 * directory), also from a worktree, or null. */
export function mainRoot(env = process.env) {
  const r = spawnSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], {
    cwd: ROOT,
    env,
    encoding: 'utf8'
  });
  if (r.error || r.status !== 0) return null;
  return path.dirname(r.stdout.trim());
}

/** Returns the environment for the CLI and the other children: the
 * parent's, without the key, with a placeholder for each provider
 * credential that config.toml reads (the local stack serves no OAuth). */
export function childEnv() {
  const env = { ...process.env };
  delete env.BACKUP_AGE_IDENTITY;
  const toml = readFileSync(path.join(ROOT, 'supabase', 'config.toml'), 'utf8');
  for (const name of envRefs(toml)) {
    if (!env[name]) env[name] = 'unused-local-stack';
  }
  return env;
}

export function cli(args, env, stdio = ['ignore', 'ignore', 'inherit']) {
  return spawnSync(process.execPath, [SUPABASE_CLI, ...args], {
    cwd: ROOT,
    env,
    encoding: 'utf8',
    stdio
  });
}

/** Returns the local database URL from `supabase status -o json`, or null
 * when the stack is down. Nothing of the JSON is printed. */
export function localDbUrl(env) {
  const r = cli(['status', '-o', 'json'], env, ['ignore', 'pipe', 'pipe']);
  if (r.error || r.status !== 0) return null;
  try {
    const status = JSON.parse(r.stdout.slice(r.stdout.indexOf('{')));
    return typeof status.DB_URL === 'string' ? status.DB_URL : null;
  } catch {
    return null;
  }
}

/** Resets the local database to supabase/migrations/. Returns true on
 * success. It drops every connection. */
export function resetLocal(env = childEnv()) {
  const r = cli(['db', 'reset', '--local'], env, ['ignore', 'ignore', 'pipe']);
  return !r.error && r.status === 0;
}

/** Returns the key and removes it from `env` (the process environment in
 * `main`) before any child process starts. The variable wins over the
 * file; only that one variable of the file is taken. Returns null when it
 * is absent or not an age identity. */
export function takeIdentity(env) {
  let value = env.BACKUP_AGE_IDENTITY;
  delete env.BACKUP_AGE_IDENTITY;
  if (!value) {
    const root = mainRoot(env);
    const file = root ? path.join(root, KEY_FILE) : null;
    if (file && existsSync(file)) value = parseEnvFile(readFileSync(file, 'utf8'))[KEY_VAR];
  }
  return isAgeIdentity(value) ? value.trim() : null;
}

/** True when Docker answers in 20 s. */
export function dockerAnswers() {
  const r = spawnSync('docker', ['info'], { stdio: 'ignore', timeout: 20000 });
  return !r.error && r.status === 0;
}

/** Returns the name of the running container `name`, or null. */
export function runningContainer(name) {
  const r = spawnSync(
    'docker',
    ['ps', '--filter', `name=^${name}$`, '--format', '{{.Names}}'],
    {
      encoding: 'utf8'
    }
  );
  if (r.error || r.status !== 0) return null;
  return r.stdout.split(/\r?\n/).includes(name) ? name : null;
}

/** Starts the local stack with Auth when its container is not running and
 * returns the database URL, or null. A production dump names the columns
 * that hosted Auth migrated; the database image's baseline lacks them. */
export function ensureStackWithAuth(env, projectId) {
  if (!runningContainer(`supabase_auth_${projectId}`)) {
    if (localDbUrl(env)) {
      const stop = cli(['stop'], env);
      if (stop.error || stop.status !== 0) return null;
    }
    const excludes = LOCAL_STACK_EXCLUDES.filter((s) => s !== 'gotrue');
    const start = cli(['start', '-x', excludes.join(',')], env);
    if (start.error || start.status !== 0) return null;
  }
  return localDbUrl(env);
}

export function gh(args, env) {
  const r = spawnSync('gh', args, { cwd: ROOT, env, encoding: 'utf8', maxBuffer: 16 << 20 });
  if (r.error || r.status !== 0) {
    const why = r.error ? r.error.message : (r.stderr || '').trim().split(/\r?\n/)[0];
    throw new Error(`gh ${args[0]} ${args[1]} failed: ${why}`);
  }
  return r.stdout;
}

/* Returns the successful runs of backup.yml, newest first. */
function backupRuns(env, limit) {
  const runs = JSON.parse(
    gh(
      [
        'run',
        'list',
        '--workflow',
        'backup.yml',
        '--status',
        'success',
        '--limit',
        String(limit),
        '--json',
        'databaseId,createdAt'
      ],
      env
    )
  );
  return runs.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

function runArtifacts(runId, env) {
  return JSON.parse(gh(['api', `repos/{owner}/{repo}/actions/runs/${runId}/artifacts`], env))
    .artifacts;
}

/** Returns `{ name, runId, createdAt }` of the newest backup artifact in
 * the last successful runs of backup.yml, or null. */
export function newestBackup(env) {
  for (const run of backupRuns(env, RUNS_TO_SEARCH)) {
    const picked = pickBackupArtifact(runArtifacts(run.databaseId, env));
    if (picked) return { ...picked, runId: run.databaseId };
  }
  return null;
}

/** Returns `{ name, runId, createdAt }` of the backup that `source` names
 * (`parseRestoreArgs`): the newest when `source` is null; for a date, the
 * newest successful run of the last 30 whose unexpired artifact is
 * `backup-<date>`; for a run id, that run's backup artifact. Or null. */
export function findBackup(source, env) {
  if (!source) return newestBackup(env);
  if (source.runId) {
    const picked = pickBackupArtifact(runArtifacts(source.runId, env));
    return picked ? { ...picked, runId: Number(source.runId) } : null;
  }
  const name = `backup-${source.date}`;
  for (const run of backupRuns(env, RUNS_FOR_A_DATE)) {
    const picked = pickBackupArtifact(
      runArtifacts(run.databaseId, env).filter((a) => a && a.name === name)
    );
    if (picked) return { ...picked, runId: run.databaseId };
  }
  return null;
}

/** Deletes the temp directories that a killed drill left. */
export function removeStaleTemp() {
  for (const name of readdirSync(os.tmpdir())) {
    if (name.startsWith(TMP_PREFIX)) {
      rmSync(path.join(os.tmpdir(), name), { recursive: true, force: true });
    }
  }
}

/** Returns the directory of the safety backups: `.restore-safety/` at the
 * main checkout's root. */
export function defaultSafetyRoot() {
  return path.join(mainRoot() ?? ROOT, '.restore-safety');
}

/** Returns the receipts file: `.claude/.restore-receipts.json` at the main
 * checkout's root. */
export function defaultReceiptsFile() {
  return path.join(mainRoot() ?? ROOT, '.claude', '.restore-receipts.json');
}

/** Returns `{ id, name, stamp?, runId?, createdAt?, encrypted: { schema,
 * data } }` for `source` (`parseRestoreArgs`), or null when no backup
 * matches. A backup is downloaded into a temp directory, read into memory
 * and the directory deleted; a safety backup is read from `safetyRoot`. */
export function readSource(source, env, { safetyRoot = defaultSafetyRoot() } = {}) {
  const read = (dir) => ({
    schema: readFileSync(path.join(dir, 'schema.sql.age')),
    data: readFileSync(path.join(dir, 'data.sql.age'))
  });
  if (source && source.kind === 'safety') {
    const dir = path.join(safetyRoot, source.stamp);
    if (!existsSync(dir)) throw new Error(`no safety backup ${source.stamp} in ${safetyRoot}`);
    const id = `safety ${source.stamp}`;
    return { id, name: id, stamp: source.stamp, encrypted: read(dir) };
  }
  const found = findBackup(source, env);
  if (!found) return null;
  const tmp = mkdtempSync(path.join(os.tmpdir(), TMP_PREFIX));
  try {
    gh(['run', 'download', String(found.runId), '--name', found.name, '--dir', tmp], env);
    return { id: `run ${found.runId}`, ...found, encrypted: read(tmp) };
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

/** Returns the SHA-256 of `bytes` in hex. */
export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

/** Returns the receipts in `file`; a missing or unreadable file reads as
 * none. */
export function readReceipts(file) {
  try {
    const list = JSON.parse(readFileSync(file, 'utf8'));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** Writes the receipts through a temp file and a rename, so a reader never
 * sees a half write. */
export function writeReceipts(file, list) {
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(list, null, 2)}\n`);
  renameSync(tmp, file);
}

/** Deletes the safety backups in `root` older than 30 days at `now` and
 * returns their stamps. */
export function pruneSafety(root, now) {
  if (!existsSync(root)) return [];
  const stale = staleSafetyStamps(readdirSync(root), now);
  for (const stamp of stale) rmSync(path.join(root, stamp), { recursive: true, force: true });
  return stale;
}

/** Returns the name of the newest file in supabase/migrations/. */
export function newestMigration(dir = path.join(ROOT, 'supabase', 'migrations')) {
  return (
    readdirSync(dir)
      .filter((n) => n.endsWith('.sql'))
      .sort()
      .at(-1) ?? null
  );
}

/* The `docker exec` arguments that hand the libpq names, never the values,
 * to a program in `container`. */
function execArgs(container, program) {
  return ['exec', '-i', ...PG_ENV_NAMES.flatMap((n) => ['-e', n]), container, program];
}

/* Returns the environment of a `docker exec`: the children's, plus the
 * connection as libpq variables. */
function execEnv(pgEnv) {
  const env = childEnv();
  for (const name of PG_ENV_NAMES) env[name] = String(pgEnv[name] ?? '');
  return env;
}

/** Pipes `prefix`, the dump and `suffix` into `psql` inside `container`,
 * in one transaction, against the database that `pgEnv` names. Keeps only
 * the SQLSTATE and the dump line of psql's error output: the rest may
 * quote a row. */
export function loadDump({ container, pgEnv, prefix = '', dataText, suffix = '' }) {
  const body = dataText.endsWith('\n') ? dataText : `${dataText}\n`;
  const r = spawnSync(
    'docker',
    [
      ...execArgs(container, 'psql'),
      '-X',
      '-q',
      '--single-transaction',
      '-v',
      'ON_ERROR_STOP=1',
      '-v',
      'VERBOSITY=sqlstate',
      '-o',
      '/dev/null',
      // Read as a file, psql prefixes each error with `psql:<stdin>:<line>:`.
      '-f',
      '-'
    ],
    {
      env: execEnv(pgEnv),
      input: prefix + body + suffix,
      stdio: ['pipe', 'ignore', 'pipe'],
      encoding: 'utf8',
      maxBuffer: 64 << 20
    }
  );
  if (!r.error && r.status === 0) return { ok: true };
  const m = /psql:<stdin>:(\d+):\s*ERROR:\s+([0-9A-Z]{5})\b/.exec(r.stderr ?? '');
  if (!m) return { ok: false, status: r.error ? 'error' : r.status };
  const prefixLines = prefix.split('\n').length - 1;
  const line = Number(m[1]) - prefixLines;
  const inDump = line > 0 && line <= body.split('\n').length - 1;
  return { ok: false, sqlstate: m[2], line: inDump ? line : null, status: r.status };
}

/** Returns the first line of a tool's error output without any connection
 * string in it. */
export function scrubbed(text) {
  const first =
    String(text ?? '')
      .trim()
      .split(/\r?\n/)[0] ?? '';
  return first.replace(/postgres(?:ql)?:\/\/\S*/gi, '<connection string>');
}

/** Dumps the database that `pgEnv` names with `pg_dump` inside `container`
 * into memory: `{ schemaText, dataText }`, the `public` schema and the
 * `auth` and `public` rows in the CLI's data dump shape, so a safety backup
 * restores through the same path as a nightly one. Throws with the first
 * line of pg_dump's error output, any connection string removed. */
export function dumpDatabase({ container, pgEnv }) {
  const env = execEnv(pgEnv);
  const run = (args) => {
    const r = spawnSync('docker', [...execArgs(container, 'pg_dump'), ...args], {
      env,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 256 << 20
    });
    if (r.error || r.status !== 0) {
      throw new Error(`pg_dump failed: ${scrubbed(r.error ? r.error.message : r.stderr)}`);
    }
    return r.stdout;
  };
  const data = run([
    '--data-only',
    '--quote-all-identifiers',
    '--column-inserts',
    '--rows-per-insert',
    '100000',
    '--schema',
    'auth',
    '--schema',
    'public',
    '--exclude-table',
    'auth.schema_migrations'
  ]);
  const schemaText = run([
    '--schema-only',
    '--quote-all-identifiers',
    '--no-owner',
    '--no-privileges',
    '--schema',
    'public'
  ]);
  return { schemaText, dataText: cliShapedDataDump(data) };
}

/** Loads a decrypted backup into the local database and counts the rows.
 * Empties every local `public` table first and keeps each sequence the
 * dumped tables own from moving down, in the load's transaction. Returns
 * `{ dumpTables, localTables, load, counts }` for drillReport; a dump table
 * the migrations do not make skips the load. */
export async function restoreDump({ dbUrl, container, schemaText, dataText }) {
  const dumpTables = dumpPublicTables(schemaText);
  const dumpCounts = dumpRowCounts(dataText);
  let sql = connect(dbUrl);
  let localTables;
  let sequences;
  try {
    localTables = await publicTables(sql);
    sequences = await ownedSequences(sql, [...dumpCounts.keys()]);
  } finally {
    await sql.end();
  }
  if (dumpTables.some((t) => !localTables.includes(t))) {
    return { dumpTables, localTables, load: { ok: false, skipped: true }, counts: null };
  }
  const guard = sequenceGuard(sequences);
  const load = loadDump({
    container,
    pgEnv: LOCAL_PG_ENV,
    prefix: guard.before + truncateStatement(localTables),
    dataText,
    suffix: guard.after
  });
  if (!load.ok) return { dumpTables, localTables, load, counts: null };
  const names = [
    ...new Set([...dumpCounts.keys(), ...localTables.map((t) => `public.${t}`), 'auth.users'])
  ].sort();
  sql = connect(dbUrl);
  let loaded;
  try {
    loaded = await rowCounts(sql, names);
  } finally {
    await sql.end();
  }
  const counts = new Map(
    names.map((n) => [n, { loaded: loaded.get(n), dump: dumpCounts.get(n) ?? 0 }])
  );
  return { dumpTables, localTables, load, counts };
}
