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

/* No key of `o`, at any depth, is `gm_note`. */
function hasGmNote(o) {
  if (Array.isArray(o)) return o.some(hasGmNote);
  if (o === null || typeof o !== 'object') return false;
  return Object.entries(o).some(([k, v]) => k === 'gm_note' || hasGmNote(v));
}

/** Runs cases A-H and the real-only checks; throws `contract: <what>`. */
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

  /* A limit trigger's DETAIL reaches the client as `details`: 101 entries in
     one insert pass the default entries_per_list of 100 (the limits
     migration). service_role has no grant on user_limit_overrides, so the
     default is the limit a throwaway user meets. */
  const { lists: limited } = await make('doomed');
  const over = await limited.create(
    { id: limited.newId(), name: 'e2e', money_mode: 'bag', player_note: '', gm_note: '' },
    Array.from({ length: 101 }, (_, i) => ({
      id: limited.newId(),
      item_key: 'e2e' + String(i),
      source: 'official',
      snapshot: null,
      position: i,
      quantity: 1,
      price_coins: null,
      player_note: '',
      gm_note: ''
    }))
  );
  if (
    over.ok ||
    over.error !== 'limit' ||
    over.key !== 'entries_per_list' ||
    over.value !== 100
  ) {
    throw new Error(
      `contract: 101 entries answered ${JSON.stringify(over)}, not the entries_per_list limit of 100`
    );
  }

  /* A share link read by other people: signed out, the two projections; a
     second user reads the GM link, owns nothing behind it, cannot share the
     owner's list, and copies only the notes the link shows. Two throwaways;
     the sweep takes them with their lists. */
  const check = (cond, msg) => {
    if (!cond) throw new Error('contract: shares: ' + msg);
  };
  const owner = await make('doomed');
  const reader = await make('doomed');
  const out = await make();
  const listId = owner.lists.newId();
  const made = await owner.lists.create(
    { id: listId, name: 'e2e ссылки', money_mode: 'bag', player_note: 'p', gm_note: 'g' },
    [
      {
        id: owner.lists.newId(),
        item_key: 'ci1',
        source: 'official',
        snapshot: null,
        position: 0,
        quantity: 1,
        price_coins: null,
        player_note: 'n',
        gm_note: 'h'
      }
    ]
  );
  check(made.ok, 'the owner could not create the list');
  const playerShare = await owner.shares.create(listId, 'player');
  const gmShare = await owner.shares.create(listId, 'gm');
  check(playerShare.ok && gmShare.ok, 'the owner could not make both links');
  if (!playerShare.ok || !gmShare.ok) return;
  const outPlayer = await out.shares.read(playerShare.token);
  check(
    outPlayer.ok && outPlayer.shared?.list.player_note === 'p' && !hasGmNote(outPlayer.shared),
    'signed out, the player link does not read the list without a GM note'
  );
  const outGm = await out.shares.read(gmShare.token);
  check(
    outGm.ok && outGm.shared?.list.gm_note === 'g' && outGm.shared.entries[0]?.gm_note === 'h',
    'signed out, the GM link does not read both GM notes'
  );
  const readerGm = await reader.shares.read(gmShare.token);
  check(
    readerGm.ok && readerGm.shared?.list.gm_note === 'g',
    'another user does not read the GM link'
  );
  check(
    (await reader.shares.ownerOf(gmShare.token)) === null,
    "another user owns the owner's list"
  );
  const theirs = await reader.shares.create(listId, 'player');
  check(
    !theirs.ok && theirs.error === 'refused',
    "another user made a link to the owner's list"
  );
  const gmCopy = reader.lists.newId();
  const playerCopy = reader.lists.newId();
  check((await reader.shares.clone(gmShare.token, gmCopy)).ok, 'the GM copy was refused');
  check(
    (await reader.shares.clone(playerShare.token, playerCopy)).ok,
    'the player copy was refused'
  );
  const readerLists = await reader.lists.list();
  const copyOf = (id) =>
    readerLists.ok ? readerLists.lists.find((l) => l.id === id) : undefined;
  check(
    copyOf(gmCopy)?.gm_note === 'g' && copyOf(gmCopy)?.list_entries[0]?.gm_note === 'h',
    'the GM copy lost a GM note'
  );
  check(
    copyOf(playerCopy)?.gm_note === '' &&
      copyOf(playerCopy)?.list_entries.every((e) => e.gm_note === ''),
    'the player copy holds a GM note'
  );
  const outClone = await out.shares.clone(playerShare.token, out.lists.newId());
  check(!outClone.ok && outClone.error === 'refused', 'signed out, a copy was made');

  /* anon has no EXECUTE on delete_account(), end to end through PostgREST. */
  const anon = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { error } = await anon.rpc('delete_account');
  if (!error) throw new Error('contract: delete_account() answered a caller with no session');
  const read = await anon.from('user_prefs').select('user_id').limit(1);
  if (!read.error) throw new Error('contract: user_prefs answered a caller with no session');
  const lists = await anon.from('lists').select('id').limit(1);
  if (!lists.error) throw new Error('contract: lists answered a caller with no session');
  /* The one function anon may run: an unknown link reads as null, not an error. */
  const shared = await anon.rpc('get_shared_list', { p_token: 'nonsense' });
  if (shared.error || shared.data !== null) {
    throw new Error(
      `contract: get_shared_list('nonsense') answered ${JSON.stringify(shared.error ?? shared.data)}, not null`
    );
  }
}
