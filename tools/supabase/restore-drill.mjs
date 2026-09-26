/*
  `npm run restore:drill [-- --backup <YYYY-MM-DD|run id> | --safety <stamp>]`:
  loads a nightly backup of production (the newest by default) or a safety
  backup into the LOCAL stack, compares the loaded rows with the rows the
  dump holds, resets the local database and prints PASS or FAIL with counts
  only. A PASS writes the receipt that restore-prod.mjs needs for the same
  source. The key comes from BACKUP_AGE_IDENTITY or from .env.restore.local
  at the main checkout's root; no child process sees it, and no plaintext
  file is written. On Windows run it through the PowerShell tool: Git Bash
  hangs on docker. Procedure: .claude/README.md, "Run the agent drill".
*/
import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RESET_COMMAND,
  addReceipt,
  decryptAge,
  drillReport,
  localProjectId,
  parseRestoreArgs,
  receiptFor
} from './lib.mjs';
import {
  KEY_FILE,
  ROOT,
  RUNS_TO_SEARCH,
  childEnv,
  defaultReceiptsFile,
  dockerAnswers,
  ensureStackWithAuth,
  newestMigration,
  readReceipts,
  readSource,
  removeStaleTemp,
  resetLocal,
  restoreDump,
  sha256,
  takeIdentity,
  writeReceipts
} from './restore.mjs';

/* Describes a source that matched no backup. */
function notFound(source) {
  if (!source)
    return `no backup artifact in the last ${RUNS_TO_SEARCH} successful runs of backup.yml.`;
  if (source.runId) return `run ${source.runId} has no unexpired backup artifact.`;
  return `no unexpired artifact backup-${source.date} in the recent successful runs of backup.yml.`;
}

async function main() {
  // First, before any spawn: a child started earlier would inherit the key.
  const identity = takeIdentity(process.env);
  const state = {
    artifact: null,
    failure: null,
    decrypted: false,
    dumpTables: null,
    localTables: null,
    load: null,
    counts: null,
    receipt: null
  };
  const plaintext = [];
  let env = null;
  let stackUp = false;
  let cleaned = null;

  const cleanup = () => {
    if (cleaned) return cleaned;
    for (const bytes of plaintext) bytes.fill(0);
    let tempRemoved = true;
    try {
      removeStaleTemp();
    } catch {
      tempRemoved = false;
    }
    const reset = stackUp ? resetLocal(env) : null;
    cleaned = { tempRemoved, reset };
    return cleaned;
  };
  const onSignal = () => {
    const c = cleanup();
    console.error(
      c.reset === false
        ? `restore:drill: stopped; the local database was not reset. In PowerShell run: ${RESET_COMMAND}`
        : 'restore:drill: stopped; cleanup done.'
    );
    console.log('restore:drill: FAIL');
    process.exit(1);
  };
  process.once('SIGINT', onSignal);
  process.once('SIGTERM', onSignal);

  try {
    let source;
    try {
      ({ source } = parseRestoreArgs(process.argv.slice(2)));
    } catch (err) {
      state.failure = err.message;
      return state;
    }
    if (!dockerAnswers()) {
      state.failure =
        'Docker did not answer in 20 s. Start Rancher Desktop; on Windows run the drill through the PowerShell tool.';
      return state;
    }
    if (!identity) {
      state.failure = `the backup key is missing or malformed. Put one line BACKUP_AGE_IDENTITY=AGE-SECRET-KEY-1... in ${KEY_FILE} at the main checkout's root, or set BACKUP_AGE_IDENTITY.`;
      return state;
    }
    env = childEnv();
    removeStaleTemp();

    const projectId = localProjectId(
      readFileSync(path.join(ROOT, 'supabase', 'config.toml'), 'utf8')
    );
    if (!projectId) {
      state.failure = 'supabase/config.toml has no project_id.';
      return state;
    }
    const dbUrl = ensureStackWithAuth(env, projectId);
    if (!dbUrl) {
      state.failure =
        'the local stack with Auth did not start (supabase start or status failed).';
      return state;
    }
    stackUp = true;
    if (!resetLocal(env)) {
      state.failure = 'supabase db reset --local failed before the load.';
      return state;
    }

    const read = readSource(source, env);
    if (!read) {
      state.failure = notFound(source);
      return state;
    }
    if (read.stamp) state.artifact = { safety: read.stamp };
    else {
      const ageMs = Date.now() - Date.parse(read.createdAt);
      state.artifact = {
        name: read.name,
        runId: read.runId,
        ageDays: Number.isFinite(ageMs) ? Math.max(0, Math.floor(ageMs / 86400000)) : '?'
      };
    }

    const texts = {};
    const hashes = {};
    for (const [key, file] of [
      ['schema', 'schema.sql.age'],
      ['data', 'data.sql.age']
    ]) {
      try {
        const bytes = await decryptAge(read.encrypted[key], identity);
        plaintext.push(bytes);
        hashes[key] = sha256(bytes);
        texts[key] = new TextDecoder().decode(bytes);
      } catch {
        state.failure = `the key does not open ${file}.`;
        return state;
      }
    }
    state.decrypted = true;

    const result = await restoreDump({
      dbUrl,
      container: `supabase_db_${projectId}`,
      schemaText: texts.schema,
      dataText: texts.data
    });
    Object.assign(state, result);
    state.receipt = {
      source: read.id,
      schemaHash: hashes.schema,
      dataHash: hashes.data
    };
    return state;
  } catch (err) {
    state.failure = err instanceof Error ? err.message : 'an unknown error stopped the drill.';
    return state;
  } finally {
    state.cleanup = cleanup();
    process.off('SIGINT', onSignal);
    process.off('SIGTERM', onSignal);
  }
}

/* Writes the receipt of a passed drill; restore:prod refuses a source
 * without one. Returns the report line. */
function writeReceipt(receipt) {
  try {
    const file = defaultReceiptsFile();
    const entry = receiptFor({
      ...receipt,
      newestMigration: newestMigration(),
      host: os.hostname(),
      at: new Date()
    });
    writeReceipts(file, addReceipt(readReceipts(file), entry));
    return `receipt: written for ${receipt.source}`;
  } catch (err) {
    return `WARN: the receipt was not written (${err.code ?? 'error'}); restore:prod refuses this source until it is`;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then(
    (state) => {
      const { pass, lines } = drillReport(state);
      for (const line of lines) console.log(line);
      if (pass && state.receipt) console.log(writeReceipt(state.receipt));
      console.log(pass ? 'restore:drill: PASS' : 'restore:drill: FAIL');
      process.exitCode = pass ? 0 : 1;
    },
    (err) => {
      console.error(`restore:drill: ${err instanceof Error ? err.message : 'failed'}`);
      console.log('restore:drill: FAIL');
      process.exitCode = 1;
    }
  );
}
