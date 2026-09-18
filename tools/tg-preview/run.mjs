#!/usr/bin/env node
/*
  CLI entry point. Wires lib.mjs's pure runRefresh to the real repository
  tree (manifest.mjs), the committed state file, teleproto (client.mjs,
  loaded lazily) and the live check (live.mjs). See docs/tg-preview.md for
  what each flag does and the runbook that drives this by hand; see
  .github/workflows/previews.yml for how CI drives it.
*/
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseArgs, runRefresh, applyResult, sameUrls } from './lib.mjs';
import { buildFromTree } from './manifest.mjs';

try {
  process.loadEnvFile('.env');
} catch {
  // no .env locally, or none in CI - both fine, the three vars are read below
}

const HERE = dirname(fileURLToPath(import.meta.url));
const STATE_DEFAULT = join(HERE, 'state.json');

function log(msg) {
  console.log(msg);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// A file that exists and does not parse is corrupt, not absent. Returning {}
// for it made a refresh re-send the whole catalogue and, under `--apply`,
// committed a state with every other entry dropped. Only ENOENT is the
// bootstrap.
function readState(path) {
  let text;
  try {
    text = readFileSync(path, 'utf8');
  } catch (err) {
    if (err && err.code === 'ENOENT') return {};
    throw err;
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    // The message already folds err in by hand; adding { cause: err } too is
    // a real improvement, left for whatever next touches error
    // handling here rather than a directory-wide rule turn-off.
    // eslint-disable-next-line preserve-caught-error
    throw new Error(
      'state file is not valid JSON: ' +
        path +
        ' (' +
        err.message +
        ') - refusing to treat it as empty'
    );
  }
}

// The file already on disk at `path`, or null when there is none to compare
// against (absent, unreadable, or not valid JSON) - the same "absent is not
// corrupt" split as readState, but a write must never let a bad read of the
// old file crash the new one, so any failure here just means "no prior
// updatedAt to carry forward".
function previousState(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

// Atomic write, sorted keys, trailing newline. `updatedAt` moves only when
// `urls` actually changes: a run (or an --apply) that confirms nothing
// produces the same map already on disk, and minting a fresh timestamp for
// it was the whole defect - a byte that always differs, so `git diff
// --cached --quiet` in previews.yml's record step never short-circuits and
// every idle run commits noise. See docs/tg-preview.md, "What CI does after
// a deploy". Comparing against the file already at `path`
// (rather than threading a previous-state argument through both callers -
// lib.mjs's record() and --apply above) keeps the fix in the one place that
// already owns "what does this write actually change", for every writer.
function writeStateSync(path, state) {
  const sortedUrls = {};
  for (const key of Object.keys(state.urls || {}).sort()) sortedUrls[key] = state.urls[key];

  const prev = previousState(path);
  const unchanged =
    prev && prev.site === state.site && prev.urls && sameUrls(prev.urls, sortedUrls);
  const updatedAt = unchanged && prev.updatedAt ? prev.updatedAt : new Date().toISOString();

  const body = { version: 1, site: state.site, updatedAt, urls: sortedUrls };
  const tmp = path + '.tmp';
  writeFileSync(tmp, JSON.stringify(body, null, 2) + '\n');
  renameSync(tmp, path);
}

async function makeClient() {
  const missing = ['TG_API_ID', 'TG_API_HASH', 'TG_SESSION'].filter((k) => !process.env[k]);
  if (missing.length) {
    // Named, never valued - a missing TG_SESSION must never tempt anyone
    // into printing what it should have been.
    console.error(
      'missing required env var' + (missing.length > 1 ? 's' : '') + ': ' + missing.join(', ')
    );
    process.exit(2);
  }
  const { createClient } = await import('./client.mjs');
  return createClient({
    apiId: process.env.TG_API_ID,
    apiHash: process.env.TG_API_HASH,
    session: process.env.TG_SESSION,
    log
  });
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const statePath = opts.statePath || STATE_DEFAULT;

  if (opts.apply) {
    const state = readState(statePath);
    // `site` travels in the result, so the record step does not need `main`'s
    // tree to be buildable at commit time.
    const result = JSON.parse(readFileSync(opts.apply, 'utf8'));
    if (!result.site) throw new Error('result file carries no site: ' + opts.apply);
    const next = applyResult(state, result, result.site);
    writeStateSync(statePath, next);
    log('state updated from ' + opts.apply);
    return;
  }

  const manifest = buildFromTree({ assets: opts.assets || undefined });
  if (manifest.missing.length) {
    log(
      'missing image on disk for ' +
        manifest.missing.length +
        ' url(s), excluded: ' +
        manifest.missing.slice(0, 5).join(', ') +
        (manifest.missing.length > 5 ? ', ...' : '')
    );
  }
  const state = readState(statePath);

  const deps = {
    manifest,
    state,
    client: makeClient,
    async verify(picked) {
      if (opts.noVerify) return { ready: Object.keys(picked), notLive: [] };
      const { verify } = await import('./live.mjs');
      return verify(picked, { site: manifest.site, fetch, sleep, log });
    },
    sleep,
    now: () => Date.now(),
    random: () => Math.random(),
    async writeState(next) {
      writeStateSync(statePath, next);
    },
    writeResult: opts.resultPath
      ? async (result) => {
          // Atomic like the state write: CI now hard-kills a hung run
          // (previews.yml's `timeout --kill-after`), and a KILL landing
          // mid-write would leave a truncated result.json that `--apply`
          // cannot parse - dropping every press the run confirmed.
          const tmp = opts.resultPath + '.tmp';
          writeFileSync(tmp, JSON.stringify(result, null, 2) + '\n');
          renameSync(tmp, opts.resultPath);
        }
      : null,
    writeStaleList: opts.staleListPath
      ? async (payload) => {
          // Same atomic temp-sibling-then-rename shape as writeResult, and
          // the same reason: a killed run must not leave a truncated file
          // that reads as an answer.
          const tmp = opts.staleListPath + '.tmp';
          writeFileSync(tmp, JSON.stringify(payload, null, 2) + '\n');
          renameSync(tmp, opts.staleListPath);
        }
      : null,
    log
  };

  const result = await runRefresh(opts, deps);

  // A dry run already logged its own counts, batches and not-live list
  // (lib.mjs's runRefresh); the "refreshed/pending" summary and the
  // ::warning:: below describe an attempted send-and-press, which a dry run
  // never makes.
  if (!opts.dryRun) {
    const summary =
      'refreshed ' +
      result.confirmed.length +
      ', pending ' +
      result.pending.length +
      (result.notLive.length ? ', not live ' + result.notLive.length : '') +
      (result.unmatched.length ? ', no button message ' + result.unmatched.length : '') +
      (result.stopped ? ', stopped: ' + result.stopped : '');
    const pressedLine =
      'pressed ' +
      result.pressed +
      ' (photo id new ' +
      result.photo.newId +
      ', same ' +
      result.photo.sameId +
      ', none ' +
      result.photo.none +
      ', unseen ' +
      result.photo.unseen +
      ')';
    log(summary);
    log(pressedLine);
    // Exit 2 is the one condition no later run can fix, so it gets an
    // annotation on the run page, not just a line in the step log.
    if (result.exitCode === 2) {
      console.log('::error::' + result.stopped + ' - see docs/tg-preview.md, step I.6');
    }
    if (process.env.GITHUB_STEP_SUMMARY) {
      writeFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n' + pressedLine + '\n', {
        flag: 'a'
      });
    }
    if (result.pending.length > 0 && result.exitCode === 0) {
      console.log('::warning::' + result.pending.length + ' url(s) still pending a refresh');
    }
  } else if (process.env.GITHUB_STEP_SUMMARY) {
    // runRefresh already logged the counts to stdout; mirror them into the
    // job summary so a dispatched dry run answers "how big is the backlog?"
    // without opening the step log (docs/tg-preview.md step I.2).
    const dryLine =
      'dry run: ' +
      result.pending.length +
      ' url(s) stale' +
      (result.notLive.length ? ', ' + result.notLive.length + ' not live' : '') +
      ', nothing sent';
    writeFileSync(process.env.GITHUB_STEP_SUMMARY, dryLine + '\n', { flag: 'a' });
  }
  process.exitCode = result.exitCode;
}

main().catch((err) => {
  console.error('tg-preview run failed: ' + (err && err.message ? err.message : err));
  process.exitCode = 1;
});
