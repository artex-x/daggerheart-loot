/*
  SUPABASE_DB_URL=<the project's connection string> npm run limits:set -- \
    --project test|prod --user <email|uuid> --key <key> \
    --value <n> | --default | --clear | --unlimited

  Sets, or removes, one user's override of one count limit and prints the
  limit before and after. `--default` and `--clear` remove the override,
  `--unlimited` stores null (no limit). Refuses a connection string that
  is not the named project's, and for `prod` a session without an
  interactive terminal. Why rows and not constants: docs/DECISIONS.md,
  2026-09-25, "Count limits are rows read by `effective_limit()`".
  Procedure: .claude/README.md, "Supabase configuration".
*/
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connect } from './db.mjs';
import { dbUrlProject, describeLimit, parseLimitsArgs } from './lib.mjs';

async function readLimit(tx, userId, key, fallback) {
  const rows = await tx`select value from public.user_limit_overrides
    where user_id = ${userId} and key = ${key}`;
  return describeLimit({ override: rows.length > 0, value: rows[0]?.value ?? null, fallback });
}

/** Applies one `limits:set` change in one transaction and returns `{
 * userId, before, after }`, each side as describeLimit() words it. `user`
 * is a uuid or an email (any case); `mode` is `value`, `default` or
 * `unlimited`. Throws, writing nothing, on a user that does not match
 * exactly one row or a key not in limit_defaults. Inside a transaction
 * (a test's), it runs in a savepoint. */
export async function setLimit(sql, { user, key, mode, value }) {
  const atomic =
    typeof sql.savepoint === 'function' ? (fn) => sql.savepoint(fn) : (fn) => sql.begin(fn);
  return atomic(async (tx) => {
    const users = await tx`select id from auth.users
      where id::text = ${user} or lower(email) = lower(${user})`;
    if (users.length !== 1) {
      throw new Error(
        `limits:set: ${users.length} users match "${user}"; expected exactly one`
      );
    }
    const userId = users[0].id;
    const defaults = await tx`select value from public.limit_defaults where key = ${key}`;
    if (!defaults.length) {
      throw new Error(`limits:set: the key "${key}" is not in limit_defaults`);
    }
    const fallback = defaults[0].value;
    const before = await readLimit(tx, userId, key, fallback);
    if (mode === 'default') {
      await tx`delete from public.user_limit_overrides where user_id = ${userId} and key = ${key}`;
    } else if (mode === 'value' || mode === 'unlimited') {
      const stored = mode === 'value' ? value : null;
      await tx`insert into public.user_limit_overrides (user_id, key, value)
        values (${userId}, ${key}, ${stored})
        on conflict (user_id, key) do update set value = excluded.value`;
    } else {
      throw new Error(`limits:set: the mode "${mode}" is unknown`);
    }
    const after = await readLimit(tx, userId, key, fallback);
    return { userId, before, after };
  });
}

async function main() {
  let args;
  try {
    args = parseLimitsArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`limits:set: ${err.message}`);
    return 1;
  }
  const url = process.env.SUPABASE_DB_URL;
  if (!url) {
    console.error('limits:set: SUPABASE_DB_URL is not set');
    return 1;
  }
  if (dbUrlProject(url) !== args.project) {
    console.error(
      `limits:set: SUPABASE_DB_URL is not the ${args.project} project (the session pooler form with the user postgres.<ref>, no query string)`
    );
    return 1;
  }
  if (args.project === 'prod' && !(process.stdin.isTTY && process.stdout.isTTY)) {
    console.error(
      'limits:set: --project prod needs an interactive terminal; the owner runs it.'
    );
    return 1;
  }
  const sql = connect(url);
  try {
    const { userId, before, after } = await setLimit(sql, args);
    console.log(`user: ${userId}`);
    console.log(`before: ${args.key} = ${before}`);
    console.log(`after: ${args.key} = ${after}`);
    return 0;
  } finally {
    await sql.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then(
    (code) => {
      process.exitCode = code;
    },
    (err) => {
      console.error(
        err.message.startsWith('limits:set:') ? err.message : `limits:set: ${err.message}`
      );
      process.exitCode = 1;
    }
  );
}
