/*
  The one module of the release tools that opens a database connection.
  migrate-test.mjs applies the test project's pending migrations with it,
  pending-check.mjs reads production's history, restore.mjs and
  restore-prod.mjs read the tables, keys, sequences and rows of the restore
  target, and tests/db/apply-pending.test.mjs
  proves applyPending on the local stack.
  Why CI does not run `supabase db push` for the test project:
  docs/DECISIONS.md, 2026-09-25, "CI applies the test project's migrations
  file by file and ignores other branches' versions".
*/
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';
import { migrationVersion, pendingMigrations } from './lib.mjs';

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost']);

/** Returns a one-connection client for `url`. The local stack serves no
 * TLS; a hosted project always does. `prepare: false` keeps the session
 * pooler from seeing named statements. */
export function connect(url) {
  const ssl = LOCAL_HOSTS.has(new URL(url).hostname) ? false : 'require';
  return postgres(url, { ssl, max: 1, prepare: false, onnotice: () => {} });
}

/** Returns the versions in supabase_migrations.schema_migrations, or `null`
 * when the table is absent (the project never received a migration). */
export async function appliedVersions(sql) {
  try {
    const rows = await sql`select version from supabase_migrations.schema_migrations`;
    return rows.map((row) => row.version);
  } catch (err) {
    if (err.code === '42P01') return null;
    throw err;
  }
}

/** Applies every migration in `dir` whose version the history lacks,
 * oldest first, each in its own transaction with its history row, so a
 * failed file leaves neither objects nor a row. Returns `{ applied, foreign
 * }`: the file names applied, and the history versions that no file in
 * `dir` names (another branch's migrations), which are listed, never an
 * error. Throws, naming the file, on the first file that fails. */
export async function applyPending(sql, dir, log = () => {}) {
  const history = await appliedVersions(sql);
  if (history === null) {
    throw new Error(
      "the project has no migration history; run the CLI's `db push` once to create it"
    );
  }
  const local = readdirSync(dir).filter((n) => n.endsWith('.sql'));
  const localVersions = new Set(local.map(migrationVersion));
  const foreign = history.filter((v) => !localVersions.has(v)).sort();
  const applied = [];
  for (const file of pendingMigrations(local, history)) {
    const version = migrationVersion(file);
    if (version === null) {
      throw new Error(`${file}: the name does not match <14 digits>_<snake_case>.sql`);
    }
    // The CLI records the name without the 14-digit stamp, its `_` and `.sql`.
    const name = file.slice(15, -'.sql'.length);
    const text = readFileSync(path.join(dir, file), 'utf8');
    try {
      await sql.begin(async (tx) => {
        await tx.unsafe(text);
        await tx`insert into supabase_migrations.schema_migrations (version, name)
          values (${version}, ${name})`;
      });
    } catch (err) {
      throw new Error(`${file} failed and was rolled back: ${err.message}`, { cause: err });
    }
    applied.push(file);
    log(file);
  }
  return { applied, foreign };
}

/** Returns the sorted names of the tables in the `public` schema. */
export async function publicTables(sql) {
  const rows =
    await sql`select tablename from pg_tables where schemaname = 'public' order by 1`;
  return rows.map((row) => row.tablename);
}

/* Splits `schema.table` into its two parts. */
function split(name) {
  const dot = name.indexOf('.');
  return [name.slice(0, dot), name.slice(dot + 1)];
}

/** Returns a Map of each `schema.table` in `names` to the name of its
 * single-column primary key, or `null` for a composite key or none. */
export async function tableKeys(sql, names) {
  const rows = await sql`
    select n.nspname || '.' || c.relname as name, array_agg(a.attname::text) as cols
    from pg_index i
    join pg_class c on c.oid = i.indrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a on a.attrelid = c.oid and a.attnum = any(i.indkey)
    where i.indisprimary
    group by 1`;
  const byName = new Map(rows.map((r) => [r.name, r.cols]));
  return new Map(
    names.map((n) => {
      const cols = byName.get(n);
      return [n, cols && cols.length === 1 ? cols[0] : null];
    })
  );
}

/** Returns the foreign keys among `names` as `{ from, to }`: `from`
 * references `to`, both `schema.table`. */
export async function foreignKeys(sql, names) {
  const rows = await sql`
    select fn.nspname || '.' || f.relname as "from", tn.nspname || '.' || t.relname as "to"
    from pg_constraint k
    join pg_class f on f.oid = k.conrelid
    join pg_namespace fn on fn.oid = f.relnamespace
    join pg_class t on t.oid = k.confrelid
    join pg_namespace tn on tn.oid = t.relnamespace
    where k.contype = 'f'`;
  const wanted = new Set(names);
  return rows
    .filter((r) => wanted.has(r.from) && wanted.has(r.to))
    .map((r) => ({ from: r.from, to: r.to }));
}

/** Returns `{ seq, table, column }` (`schema.name`) for each sequence that
 * a column of a table in `names` owns: `serial` or identity. */
export async function ownedSequences(sql, names) {
  const rows = await sql`
    select sn.nspname || '.' || s.relname as seq, tn.nspname || '.' || t.relname as "table",
      a.attname::text as "column"
    from pg_depend d
    join pg_class s on s.oid = d.objid and s.relkind = 'S'
    join pg_namespace sn on sn.oid = s.relnamespace
    join pg_class t on t.oid = d.refobjid
    join pg_namespace tn on tn.oid = t.relnamespace
    join pg_attribute a on a.attrelid = t.oid and a.attnum = d.refobjsubid
    where d.classid = 'pg_class'::regclass and d.refclassid = 'pg_class'::regclass
      and d.deptype in ('a', 'i')
    order by 1`;
  const wanted = new Set(names);
  return rows
    .filter((r) => wanted.has(r.table))
    .map((r) => ({ seq: r.seq, table: r.table, column: r.column }));
}

/** Returns the number of rows of `table` whose `column` is one of the key
 * literals (`'<uuid>'` or an integer), compared as text. */
export async function countKeys(sql, table, column, literals) {
  if (!literals.length) return 0;
  const values = literals.map((l) => String(l).replace(/^'|'$/g, ''));
  const [schema, name] = split(table);
  const [{ n }] = await sql`
    select count(*)::int as n from ${sql(schema)}.${sql(name)}
    where ${sql(column)}::text = any(string_to_array(${values.join(',')}, ','))`;
  return n;
}

/** Returns `{ seq, lastValue, max }` for each sequence (`{ seq, table,
 * column }`): its `last_value` and its column's highest value, as
 * strings (`max` is null for an empty table). */
export async function sequenceState(sql, sequences) {
  const out = [];
  for (const s of sequences) {
    const [seqSchema, seqName] = split(s.seq);
    const [schema, name] = split(s.table);
    const [{ v }] =
      await sql`select last_value::text as v from ${sql(seqSchema)}.${sql(seqName)}`;
    const [{ m }] =
      await sql`select max(${sql(s.column)})::text as m from ${sql(schema)}.${sql(name)}`;
    out.push({ seq: s.seq, lastValue: v, max: m });
  }
  return out;
}

/** Returns a Map of each `schema.table` name in `names` to its row count. */
export async function rowCounts(sql, names) {
  const counts = new Map();
  for (const name of names) {
    const dot = name.indexOf('.');
    const schema = name.slice(0, dot);
    const table = name.slice(dot + 1);
    const [{ n }] = await sql`select count(*)::int as n from ${sql(schema)}.${sql(table)}`;
    counts.set(name, n);
  }
  return counts;
}
