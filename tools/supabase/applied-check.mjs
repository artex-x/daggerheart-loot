/*
  node tools/supabase/applied-check.mjs --project prod

  Exits 1 when a file in supabase/migrations/ is not listed under the
  project in supabase/applied.json. The CI `db` job runs it on a push to
  main, so a release cannot deploy code whose schema was never pushed.
*/
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseProjectArg, readApplied, unapplied } from './lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function main() {
  const { project } = parseProjectArg(process.argv.slice(2));
  const dir = path.join(ROOT, 'supabase', 'migrations');
  const migrations = existsSync(dir) ? readdirSync(dir).filter((n) => n.endsWith('.sql')) : [];
  if (!migrations.length) {
    console.log(`applied-check: no migrations yet; nothing to apply on ${project}.`);
    return 0;
  }
  const applied = readApplied(
    readFileSync(path.join(ROOT, 'supabase', 'applied.json'), 'utf8')
  );
  const pending = unapplied(migrations, applied, project);
  if (!pending.length) {
    console.log(
      `applied-check: all ${migrations.length} migrations are applied on ${project}.`
    );
    return 0;
  }
  console.error(
    `applied-check: ${pending.length} migration(s) are not applied on ${project}:\n  ${pending.join('\n  ')}\nThe owner runs \`npm run db:push -- --project ${project}\`, then amends supabase/applied.json.`
  );
  return 1;
}

try {
  process.exitCode = main();
} catch (err) {
  console.error(`applied-check: ${err.message}`);
  process.exitCode = 1;
}
