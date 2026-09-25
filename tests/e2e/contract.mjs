/* The cloud contract over the real adapter, on the test project: the same
 * `runCloudContract` vitest runs over the fake, here in Node (loaded through
 * ts-hooks.mjs). Each port gets its own store, holding a minted session or
 * none; the ports are used one after another, never interleaved. */

import { runCloudContract } from '../../app/src/ports/cloud.contract.ts';
import { createCloud } from '../../app/src/ports/supabase.ts';
import { createClient } from '@supabase/supabase-js';
import { createThrowaway, mint } from './admin.mjs';
import { assertTestProject, memoryStorage, storageKey } from './lib.mjs';

/* The window the port saves its way back through; no redirect starts here. */
function winStub() {
  const store = memoryStorage();
  return {
    location: { href: 'http://127.0.0.1/index.html#/account', hash: '#/account' },
    sessionStorage: store,
    history: { replaceState: () => undefined },
    addEventListener: () => undefined,
    removeEventListener: () => undefined
  };
}

/** Runs cases A-F and the real-only checks; throws `contract: <what>`. */
export async function runRealContract(env, admin, member) {
  assertTestProject(env.E2E_SUPABASE_URL);
  const url = env.E2E_SUPABASE_URL;
  const key = env.E2E_SUPABASE_PUBLISHABLE_KEY;

  const make = async (as) => {
    const store = memoryStorage();
    let session = null;
    if (as === 'member') session = await mint(env, admin, member.email);
    else if (as === 'doomed') {
      const doomed = await createThrowaway(admin, member.email);
      session = await mint(env, admin, doomed.email);
    }
    if (session) store.setItem(storageKey(url), JSON.stringify(session));
    return createCloud(url, key, null, winStub(), store);
  };

  await runCloudContract(
    make,
    { member: { as: 'member', userId: member.id, email: member.email }, doomed: 'doomed' },
    (cond, msg) => {
      if (!cond) throw new Error('contract: ' + msg);
    }
  );

  /* anon has no EXECUTE on delete_account(), end to end through PostgREST. */
  const anon = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { error } = await anon.rpc('delete_account');
  if (!error) throw new Error('contract: delete_account() answered a caller with no session');
  const read = await anon.from('user_prefs').select('user_id').limit(1);
  if (!read.error) throw new Error('contract: user_prefs answered a caller with no session');
}
