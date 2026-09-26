// Gate credit: `npm run check` and `npm run check:db` arm their own commit
// gate by their own exit 0, when the tree key at the end equals the key at
// the start. A run that the harness moved to the background, a run in the
// human's terminal and a run whose output is over the tool's cap all arm it.
// docs/decisions/2026-09-27-a-green-check-arms-the-commit-gate-by.md is the
// decision; .claude/README.md, "Run a long check", is the procedure.
//
// CLI: `node .claude/hooks/gate-credit.mjs begin|arm check|check-db`, run
// only by the check chain in package.json (bash-guard.mjs rule 2v denies a
// hand run). tests/db/run.mjs imports beginCredit and armCredit. Every path
// exits 0 and never throws: a credit step must never turn a green check red.

import { readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stateDir } from './lib.mjs';
import { readCache, treeKey, writeCache } from './tree-key.mjs';

const NAMES = {
  check: ['.check-cache.json', 'npm run check'],
  'check-db': ['.check-db-cache.json', 'npm run check:db']
};

function pendingPath(name) {
  return path.join(stateDir(), `.${name}-pending.json`);
}

function say(line) {
  try {
    process.stdout.write(`${line}\n`);
  } catch {
    // a closed stdout loses the line, never the exit code
  }
}

/** Records the tree key at the start of the named run, and the run's shell
 * (`ppid`), in `.<name>-pending.json`. An unknown name does nothing. */
export function beginCredit(name) {
  try {
    if (!Object.hasOwn(NAMES, name)) return;
    // A write that fails must not leave an older run's key for arm to read.
    try {
      unlinkSync(pendingPath(name));
    } catch {
      // no older pending file
    }
    const payload = { key: treeKey(), at: Math.floor(Date.now() / 1000), ppid: process.ppid };
    writeFileSync(pendingPath(name), JSON.stringify(payload));
  } catch {
    // no pending file: arm says nothing and writes nothing
  }
}

/** Writes the named gate's cache with `by: "exit"` when the tree key now
 * equals the key that beginCredit recorded, and prints one line. With no
 * pending file or an unknown name it prints nothing. */
export function armCredit(name) {
  try {
    if (!Object.hasOwn(NAMES, name)) return;
    const [cacheName, command] = NAMES[name];
    let pending;
    try {
      pending = JSON.parse(readFileSync(pendingPath(name), 'utf8'));
    } catch {
      return;
    }
    // `begin` and `arm` of one `npm run check` are children of one script
    // shell; a shell that execs the last `&&` step makes `arm` the shell
    // itself; tests/db/run.mjs calls both in one process. Another ppid is a
    // second run of the same check, whose key this run never tested.
    const ownRun = pending && (pending.ppid === process.ppid || pending.ppid === process.pid);
    if (!ownRun) {
      say('gate credit: not armed - another run began after this one');
      return;
    }
    try {
      unlinkSync(pendingPath(name));
    } catch {
      // a pending file left behind is overwritten by the next begin
    }
    const key = treeKey();
    if (!pending || typeof pending.key !== 'string' || key === null) {
      say('gate credit: not armed - the tree key could not be read');
      return;
    }
    if (pending.key !== key) {
      say('gate credit: not armed - the tree changed during the run');
      return;
    }
    writeCache(key, cacheName, command, 'exit');
    const written = readCache(cacheName);
    if (written && written.key === key && written.by === 'exit') {
      say(`gate credit: armed (${command} exited 0)`);
    }
  } catch {
    // fail open: the gate asks for another run
  }
}

function cli(argv) {
  const [verb, name] = argv;
  if (verb === 'begin') beginCredit(name);
  else if (verb === 'arm') armCredit(name);
}

try {
  if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    cli(process.argv.slice(2));
  }
} catch {
  // exit 0 whatever happened
}
