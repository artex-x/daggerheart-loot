/*
  `node tools/supabase/backup-art.mjs <dir>`: the weekly picture copy of the
  backup (.github/workflows/backup.yml). Lists the names of the public bucket
  homebrew-art over SUPABASE_DB_URL, downloads each own picture file from its
  public address into <dir>, 8 at a time, and prints the counts. A file
  deleted after the list (400 or 404) is counted and skipped; any other
  answer fails the run. The bucket is public, so no key is read. Restore:
  .claude/README.md, "Backups and restore".
*/
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connect } from './db.mjs';
import { PROJECTS, dbUrlProject } from './lib.mjs';

/** The most downloads in flight: the job's 20 minutes hold about 92 000 files
 *  (the 3x bucket) at 100 ms a file. */
export const ART_CONCURRENCY = 8;

/* The two files of an own picture (homebrew_art_name_ok): nothing else of the
   bucket is copied. */
const NAME = /^[pt]\/[0-9a-f]{32}\.(webp|jpg)$/;

/** Returns the names that are own picture files, sorted. */
export function artNames(rows) {
  return rows
    .map((r) => r.name)
    .filter((n) => NAME.test(n))
    .sort();
}

/** Returns the public address of a bucket file of the project `ref`. */
export function publicUrl(ref, name) {
  return `https://${ref}.supabase.co/storage/v1/object/public/homebrew-art/${name}`;
}

/**
 * Downloads every name with `fetchFile(name)` (a `Response`), `concurrency`
 * at a time, and hands each body to `write(name, bytes)`. Returns `{ files,
 * bytes, gone, requests, peak }`; throws on an answer other than 200, 400
 * or 404.
 */
export async function copyArt(names, { fetchFile, write, concurrency = ART_CONCURRENCY }) {
  const out = { files: 0, bytes: 0, gone: 0, requests: 0, peak: 0 };
  let next = 0;
  let inFlight = 0;
  const worker = async () => {
    while (next < names.length) {
      const name = names[next++];
      inFlight++;
      out.peak = Math.max(out.peak, inFlight);
      try {
        out.requests++;
        const r = await fetchFile(name);
        if (r.status === 400 || r.status === 404) {
          out.gone++;
          continue;
        }
        if (r.status !== 200) throw new Error(`backup-art: ${name} answered ${r.status}`);
        const bytes = new Uint8Array(await r.arrayBuffer());
        write(name, bytes);
        out.files++;
        out.bytes += bytes.length;
      } finally {
        inFlight--;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, names.length) }, worker));
  return out;
}

async function main() {
  const dir = process.argv[2];
  const url = process.env.SUPABASE_DB_URL;
  if (!dir) throw new Error('backup-art: name the output directory.');
  const project = url ? dbUrlProject(url) : null;
  if (!project) throw new Error('backup-art: SUPABASE_DB_URL is not a known project.');
  const ref = PROJECTS[project];
  const sql = connect(url);
  let rows;
  try {
    rows = await sql`select name from storage.objects where bucket_id = 'homebrew-art'`;
  } finally {
    await sql.end();
  }
  const names = artNames(rows);
  // The step tars the directory, so it exists with no picture too.
  mkdirSync(dir, { recursive: true });
  const result = await copyArt(names, {
    fetchFile: (name) => fetch(publicUrl(ref, name)),
    write: (name, bytes) => {
      const file = path.join(dir, name);
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, bytes);
    }
  });
  console.log(
    `backup-art: ${result.files} files, ${result.bytes} bytes, ${result.gone} deleted after the list, ` +
      `${result.requests} requests, at most ${result.peak} at a time`
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : 'backup-art: failed');
    process.exitCode = 1;
  });
}
