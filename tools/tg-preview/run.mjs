#!/usr/bin/env node
/*
  CLI entry point. Wires lib.mjs's pure runRefresh to the real repository
  tree (manifest.mjs), the committed state file, teleproto (client.mjs,
  loaded lazily) and the live check (live.mjs). See docs/tg-preview.md for
  what each flag does and the runbook that drives this by hand; see
  .github/workflows/previews.yml for how CI drives it.
*/
import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseArgs, runRefresh, applyResult } from './lib.mjs';
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

function readState(path) {
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return {};
  }
}

// Atomic write, sorted keys, trailing newline - plan.md section 5.4.
function writeStateSync(path, state) {
  const sortedUrls = {};
  for (const key of Object.keys(state.urls || {}).sort()) sortedUrls[key] = state.urls[key];
  const body = {
    version: 1,
    site: state.site,
    updatedAt: state.updatedAt || new Date().toISOString(),
    urls: sortedUrls
  };
  const tmp = path + '.tmp';
  writeFileSync(tmp, JSON.stringify(body, null, 2) + '\n');
  renameSync(tmp, path);
}

async function makeClient() {
  const missing = ['TG_API_ID', 'TG_API_HASH', 'TG_SESSION'].filter((k) => !process.env[k]);
  if (missing.length) {
    // Named, never valued - a missing TG_SESSION must never tempt anyone
    // into printing what it should have been.
    console.error('missing required env var' + (missing.length > 1 ? 's' : '') + ': ' + missing.join(', '));
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
    const manifest = buildFromTree({ assets: opts.assets || undefined });
    const state = readState(statePath);
    const result = JSON.parse(readFileSync(opts.apply, 'utf8'));
    const next = applyResult(state, result, manifest.site);
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
    if (process.env.GITHUB_STEP_SUMMARY) {
      writeFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n' + pressedLine + '\n', { flag: 'a' });
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
