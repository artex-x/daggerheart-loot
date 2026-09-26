/*
  `npm run restore:prod -- --backup <YYYY-MM-DD|run id>` or `-- --safety
  <stamp>` (the undo): the owner restores production from a backup that a
  local drill of the same backup passed on this machine. Only the owner
  runs it, in an interactive terminal; hook rule 2n denies it for agents.
  It asks for the connection string with echo off, takes an encrypted
  safety backup, shows production's rows against the backup's, wants the
  typed production ref, then loads in one transaction and verifies.
  Procedure: .claude/README.md, "Restore production (owner)". Decision:
  docs/decisions/2026-09-26-production-restore-is-an-owner-run-command-gated.md.
*/
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { Encrypter, identityToRecipient } from 'age-encryption';
import {
  appliedVersions,
  connect,
  countKeys,
  foreignKeys,
  ownedSequences,
  publicTables,
  rowCounts,
  sequenceState,
  tableKeys
} from './db.mjs';
import {
  PROJECTS,
  authDeleteOrder,
  checkReceipt,
  dbUrlProject,
  decryptAge,
  dumpColumnValues,
  dumpPublicTables,
  dumpRowCounts,
  keyDeleteStatements,
  keyLiteral,
  localProjectId,
  migrationVersion,
  parseRestoreArgs,
  pendingMigrations,
  pgEnvFromUrl,
  prodReport,
  safetyStamp,
  sequenceGuard,
  truncateStatement
} from './lib.mjs';
import {
  KEY_FILE,
  ROOT,
  childEnv,
  defaultReceiptsFile,
  defaultSafetyRoot,
  dockerAnswers,
  dumpDatabase,
  ensureStackWithAuth,
  gh,
  loadDump,
  newestMigration,
  pruneSafety,
  readReceipts,
  readSource,
  runningContainer,
  scrubbed,
  sha256,
  takeIdentity
} from './restore.mjs';

const MIGRATIONS_DIR = path.join(ROOT, 'supabase', 'migrations');

/* The drill argument that proves the same source. */
function drillCommand(sourceId) {
  const [kind, value] = sourceId.split(' ');
  return `npm run restore:drill -- --${kind === 'run' ? 'backup' : 'safety'} ${value}`;
}

/* Reads the target and returns what the load needs, or `{ refusal }`. No
 * statement here writes. */
async function readTarget(sql, { source, migrationsDir, dumpCounts, authTables }) {
  const history = await appliedVersions(sql);
  const local = readdirSync(migrationsDir).filter((n) => n.endsWith('.sql'));
  const localVersions = new Set(local.map(migrationVersion));
  if (
    history === null ||
    pendingMigrations(local, history).length ||
    history.some((v) => !localVersions.has(v))
  ) {
    return {
      refusal:
        "the target's migrations are not this checkout's; apply the migrations first (CI migrate-prod) and update the checkout"
    };
  }
  const tables = await publicTables(sql);
  const missing = dumpPublicTables(source.schemaText).filter((t) => !tables.includes(t));
  if (missing.length) {
    return {
      refusal: `the target lacks ${missing.map((t) => `public.${t}`).join(', ')}; apply the migrations first (CI migrate-prod)`
    };
  }
  const keyColumns = await tableKeys(sql, authTables);
  const edges = await foreignKeys(sql, authTables);
  const sequences = await ownedSequences(sql, [...dumpCounts.keys()]);
  try {
    const order = authDeleteOrder(authTables, edges);
    const keys = new Map();
    for (const table of authTables) {
      const column = keyColumns.get(table);
      if (!column) throw new Error(`${table} has no single-column primary key`);
      keys.set(table, dumpColumnValues(source.dataText, table, column).map(keyLiteral));
    }
    return { tables, keyColumns, order, keys, sequences };
  } catch (err) {
    return { refusal: err.message };
  }
}

/* Writes the encrypted safety backup to `<safetyRoot>/<stamp>/`. A half
 * directory is removed. The plaintext bytes are zeroed. */
async function writeSafety(dumped, { safetyRoot, stamp, recipient }) {
  const plain = [
    new TextEncoder().encode(dumped.schemaText),
    new TextEncoder().encode(dumped.dataText)
  ];
  const dir = path.join(safetyRoot, stamp);
  try {
    const files = [];
    for (const bytes of plain) {
      const e = new Encrypter();
      e.addRecipient(recipient);
      files.push(await e.encrypt(bytes));
    }
    mkdirSync(safetyRoot, { recursive: true });
    mkdirSync(dir);
    try {
      writeFileSync(path.join(dir, 'schema.sql.age'), files[0]);
      writeFileSync(path.join(dir, 'data.sql.age'), files[1]);
    } catch (err) {
      rmSync(dir, { recursive: true, force: true });
      throw err;
    }
    return dir;
  } finally {
    for (const bytes of plain) bytes.fill(0);
  }
}

/** Restores the target from a decrypted source and returns the state for
 * prodReport. `opts`: `container` (the local database container, which
 * runs `psql` and `pg_dump`), `pgEnv` and `dbUrl` (the target), `source`
 * (`{ id, name, schemaText, dataText, dataHash }`), `receipts`,
 * `newestMigration`, `migrationsDir`, `host`, `now`, `recipient`,
 * `safetyRoot`, `expectRef`, `confirm` (async, returns the typed text),
 * `say` (prints a line). No statement writes the target before the typed
 * ref matches; the safety backup is complete before the ref is asked. */
export async function restoreToTarget(opts) {
  const { container, pgEnv, dbUrl, source, safetyRoot, expectRef, confirm, say } = opts;
  const state = { failure: null, source: { name: source.name }, printed: 0 };
  const flush = () => {
    const { lines } = prodReport(state);
    for (const line of lines.slice(state.printed)) say(line);
    state.printed = lines.length;
  };
  try {
    // (a) A passed drill of the same source on this host.
    const check = checkReceipt(opts.receipts, {
      sourceId: source.id,
      dataHash: source.dataHash,
      newestMigration: opts.newestMigration,
      host: opts.host,
      now: opts.now
    });
    if (!check.ok) {
      state.failure = `no passed drill of ${source.id} for this checkout on this host (receipt: ${check.reason}). Run first: ${drillCommand(source.id)}`;
      return state;
    }
    state.receipt = { at: check.receipt.at };

    // (b, c) Read only: migrations, tables, keys, foreign keys, sequences.
    const dumpCounts = dumpRowCounts(source.dataText);
    const authTables = [...dumpCounts.keys()].filter((n) => n.startsWith('auth.')).sort();
    let target;
    let sql = connect(dbUrl);
    try {
      target = await readTarget(sql, {
        source,
        migrationsDir: opts.migrationsDir,
        dumpCounts,
        authTables
      });
    } finally {
      await sql.end();
    }
    if (target.refusal) {
      state.failure = `${target.refusal}; nothing was written`;
      return state;
    }
    state.target = { publicTables: target.tables.length };

    // (d) The encrypted safety backup of the target as it is now.
    let dumped;
    try {
      dumped = dumpDatabase({ container, pgEnv });
      const dir = await writeSafety(dumped, {
        safetyRoot,
        stamp: safetyStamp(new Date()),
        recipient: opts.recipient
      });
      state.safety = { dir };
    } catch (err) {
      state.failure = `the safety backup failed: ${scrubbed(err.message)}; nothing was written`;
      return state;
    }
    const nowCounts = dumpRowCounts(dumped.dataText);

    // (e) Production now against the backup, counts only.
    const names = [...target.tables.map((t) => `public.${t}`), ...authTables].sort();
    state.rows = names.map((table) => ({
      table,
      now: nowCounts.get(table) ?? 0,
      backup: dumpCounts.get(table) ?? 0
    }));
    flush();

    // (f) The typed ref.
    const typed = await confirm();
    state.confirmed = String(typed ?? '').trim() === expectRef;
    if (!state.confirmed) return state;

    // (g) One transaction: guard, truncate, delete by key, the dump, guard.
    const guard = sequenceGuard(target.sequences);
    state.load = loadDump({
      container,
      pgEnv,
      prefix:
        guard.before +
        truncateStatement(target.tables) +
        keyDeleteStatements(target.order, target.keys, target.keyColumns),
      dataText: source.dataText,
      suffix: guard.after
    });
    if (!state.load.ok) return state;

    // (h) Verify.
    sql = connect(dbUrl);
    try {
      const publicNames = target.tables.map((t) => `public.${t}`);
      const loaded = await rowCounts(sql, publicNames);
      const mismatches = [];
      for (const name of publicNames) {
        const want = dumpCounts.get(name) ?? 0;
        if (loaded.get(name) !== want) mismatches.push({ name, got: loaded.get(name), want });
      }
      for (const table of authTables) {
        const want = dumpCounts.get(table);
        const got = await countKeys(
          sql,
          table,
          target.keyColumns.get(table),
          target.keys.get(table)
        );
        if (got !== want) mismatches.push({ name: table, got, want });
      }
      const sequences = (await sequenceState(sql, target.sequences)).map((s) => ({
        seq: s.seq,
        ok: s.max === null || BigInt(s.lastValue) >= BigInt(s.max)
      }));
      state.verify = { tables: publicNames.length + authTables.length, mismatches, sequences };
    } finally {
      await sql.end();
    }
    return state;
  } catch (err) {
    state.failure = scrubbed(err instanceof Error ? err.message : 'an unknown error');
    return state;
  }
}

/* Reads one line with echo off. Ctrl-C rejects. */
function readHidden(prompt) {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    let text = '';
    const done = (err) => {
      stdin.off('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
      process.stdout.write('\n');
      if (err) reject(err);
      else resolve(text);
    };
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') return done();
        if (ch === '\u0003') return done(new Error('stopped at the connection string prompt'));
        if (ch === '\u007f' || ch === '\b') text = text.slice(0, -1);
        else text += ch;
      }
      return undefined;
    };
    process.stdout.write(prompt);
    stdin.setEncoding('utf8');
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onData);
  });
}

/* Asks one visible question. Ctrl-C, or any close of the prompt before an
 * answer, answers '' (ABORTED), so main always settles. */
function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    let answer = '';
    rl.on('SIGINT', () => rl.close());
    rl.on('close', () => resolve(answer));
    rl.question(question, (text) => {
      answer = text;
      rl.close();
    });
  });
}

async function main() {
  if (!(process.stdin.isTTY && process.stdout.isTTY)) {
    return {
      failure: 'run this in your own terminal; agents never restore production.'
    };
  }
  // Before any spawn: a child started earlier would inherit the key.
  const identity = takeIdentity(process.env);
  const state = { failure: null };
  let source;
  try {
    ({ source } = parseRestoreArgs(process.argv.slice(2)));
  } catch (err) {
    state.failure = err.message;
    return state;
  }
  if (!source) {
    state.failure = 'name the source: --backup <YYYY-MM-DD|run id> or --safety <stamp>.';
    return state;
  }
  if (!identity) {
    state.failure = `the backup key is missing or malformed. Put one line BACKUP_AGE_IDENTITY=AGE-SECRET-KEY-1... in ${KEY_FILE} at the main checkout's root, or set BACKUP_AGE_IDENTITY.`;
    return state;
  }
  if (!dockerAnswers()) {
    state.failure = 'Docker did not answer in 20 s. Start Rancher Desktop.';
    return state;
  }
  const env = childEnv();
  const safetyRoot = defaultSafetyRoot();
  pruneSafety(safetyRoot, new Date());
  const projectId = localProjectId(
    readFileSync(path.join(ROOT, 'supabase', 'config.toml'), 'utf8')
  );
  // A running database container is enough: it only runs psql and pg_dump.
  // The stack starts (never restarts) only when that container is down.
  const container = projectId ? `supabase_db_${projectId}` : null;
  if (!container || (!runningContainer(container) && !ensureStackWithAuth(env, projectId))) {
    state.failure =
      'the local stack with Auth did not start; its container runs psql and pg_dump.';
    return state;
  }

  // The connection string lives only in this block's scope: never in an
  // argument, a log line or the process environment.
  const plaintext = [];
  try {
    const read = readSource(source, env);
    if (!read) {
      state.failure = `no unexpired backup artifact matches ${process.argv.slice(2).join(' ')}.`;
      return state;
    }
    const texts = {};
    for (const [key, file] of [
      ['schema', 'schema.sql.age'],
      ['data', 'data.sql.age']
    ]) {
      try {
        const bytes = await decryptAge(read.encrypted[key], identity);
        plaintext.push(bytes);
        texts[key] = new TextDecoder().decode(bytes);
      } catch {
        state.failure = `the key does not open ${file}.`;
        return state;
      }
    }
    const recipient = await identityToRecipient(identity);
    if (gh(['variable', 'get', 'BACKUP_AGE_RECIPIENT'], env).trim() !== recipient) {
      state.failure =
        'the key on this machine is not the pair of the Actions variable BACKUP_AGE_RECIPIENT; a safety backup would not open with the nightly key.';
      return state;
    }
    const url = await readHidden(
      'Paste the production session pooler connection string (not shown): '
    );
    if (dbUrlProject(url) !== 'prod') {
      state.failure =
        'the connection string is not the production project (user postgres.<ref>, no query string).';
      return state;
    }
    const pgEnv = pgEnvFromUrl(url);
    const name = read.stamp ? read.id : `${read.name} (run ${read.runId})`;
    return await restoreToTarget({
      container,
      pgEnv,
      dbUrl: url,
      source: {
        id: read.id,
        name,
        schemaText: texts.schema,
        dataText: texts.data,
        dataHash: sha256(plaintext[1])
      },
      receipts: readReceipts(defaultReceiptsFile()),
      newestMigration: newestMigration(),
      migrationsDir: MIGRATIONS_DIR,
      host: os.hostname(),
      now: new Date(),
      recipient,
      safetyRoot,
      expectRef: PROJECTS.prod,
      confirm: () => ask('Type the production ref to write production: '),
      say: (line) => console.log(line)
    });
  } catch (err) {
    state.failure = scrubbed(err instanceof Error ? err.message : 'an unknown error');
    return state;
  } finally {
    for (const bytes of plaintext) bytes.fill(0);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then(
    (state) => {
      const { verdict, lines } = prodReport(state);
      for (const line of lines.slice(state.printed ?? 0)) console.log(line);
      console.log(`restore:prod: ${verdict}`);
      process.exitCode = verdict === 'PASS' ? 0 : 1;
    },
    (err) => {
      console.error(`restore:prod: ${scrubbed(err instanceof Error ? err.message : 'failed')}`);
      console.log('restore:prod: FAIL');
      process.exitCode = 1;
    }
  );
}
