/* What any `CloudPort` must do, the fake and the real adapter alike.
 *
 * No test framework here: the caller hands in `assert`, so vitest runs it
 * over the fake (`fake-cloud.test.ts`) and `tests/e2e/contract.mjs` runs it
 * over the real adapter against the hosted test project. `make(as)` builds a
 * port signed in as that user, or signed out without one. Only what every
 * port does belongs here; what depends on the fake's seed stays in its own
 * tests (docs/specs/COVERAGE.md, "Test layers"). Each release appends the
 * cases for the port member it adds: A-F the account, G the lists, H the
 * share links. */

import type { EntryRow, ListRow } from '../lib/cloudLists.js';
import type { Prefs } from '../lib/prefs.js';
import type { CloudPort, Session } from './types.js';

export interface ContractUsers {
  /** A user that is never deleted, and what its session must say. */
  member: { as: string; userId: string; email: string };
  /** A user with no preferences row: case F writes one, case E deletes
   *  the user. */
  doomed: string;
}

const PROVIDERS: readonly string[] = ['google', 'discord'];

/** No port holds an identity with this id. */
const UNKNOWN_IDENTITY = '00000000-0000-4000-8000-000000000999';

const PREF_KEYS = ['lang', 'home', 'view', 'printBw', 'printCompact'] as const;

function samePrefs(a: Prefs | null, b: Prefs): boolean {
  if (!a) return false;
  return (
    Object.keys(a).length === Object.keys(b).length && PREF_KEYS.every((k) => a[k] === b[k])
  );
}

type Assert = (cond: boolean, msg: string) => void;

function entryOf(
  id: string,
  key: string,
  position: number,
  over: Partial<EntryRow> = {}
): EntryRow {
  return {
    id,
    item_key: key,
    source: 'official',
    snapshot: null,
    position,
    quantity: 1,
    price_coins: null,
    player_note: '',
    gm_note: '',
    ...over
  };
}

/** The port's lists by id, or null when the read failed. */
async function listsOf(
  port: CloudPort,
  assert: Assert,
  when: string
): Promise<ListRow[] | null> {
  const read = await port.lists.list();
  assert(read.ok, 'lists: ' + when + ', list() is not ok');
  return read.ok ? read.lists : null;
}

/** The one list with `id`, or null when there is not exactly one. */
async function theList(
  port: CloudPort,
  id: string,
  assert: Assert,
  when: string
): Promise<ListRow | null> {
  const found = ((await listsOf(port, assert, when)) ?? []).filter((l) => l.id === id);
  assert(found.length === 1, 'lists: ' + when + ', not exactly one list with the id');
  return found[0] ?? null;
}

const view = (e: EntryRow): string =>
  [e.item_key, e.quantity, e.price_coins, e.player_note, e.gm_note].join('|');

async function listCases(port: CloudPort, assert: Assert): Promise<void> {
  const { lists } = port;
  const before = (await listsOf(port, assert, 'at first'))?.length ?? 0;

  const id = lists.newId();
  const [a, b, c] = [lists.newId(), lists.newId(), lists.newId()];
  const row = { id, name: 'Клад', money_mode: 'coin' as const, player_note: 'p', gm_note: 'g' };
  const two = [
    entryOf(a, 'ci1', 0, { quantity: 2, price_coins: 150, player_note: 'a' }),
    entryOf(b, 'q1', 1, { gm_note: 'b' })
  ];
  assert((await lists.create(row, two)).ok, 'lists: create() was refused');
  assert((await lists.create(row, two)).ok, 'lists: a second create() was refused');
  let got = await theList(port, id, assert, 'after create');
  assert(
    got?.name === 'Клад' &&
      got.money_mode === 'coin' &&
      got.player_note === 'p' &&
      got.gm_note === 'g',
    'lists: the list does not read back as created'
  );
  assert(
    got?.list_entries.map(view).join(';') === 'ci1|2|150|a|;q1|1|||b',
    'lists: the entries do not read back in order'
  );

  assert(
    (
      await lists.update(id, {
        name: 'Клад дракона',
        money_mode: 'bag',
        player_note: '',
        gm_note: 'G'
      })
    ).ok,
    'lists: update() was refused'
  );
  assert(
    (await lists.addEntries(id, [entryOf(c, 'q313', 2)])).ok,
    'lists: addEntries() was refused'
  );
  assert(
    (
      await lists.updateEntry(b, {
        quantity: 5,
        price_coins: 20,
        player_note: 'n',
        gm_note: ''
      })
    ).ok,
    'lists: updateEntry() was refused'
  );
  assert((await lists.reorder(id, [c, a, b])).ok, 'lists: reorder() was refused');
  got = await theList(port, id, assert, 'after the edits');
  assert(
    got?.name === 'Клад дракона' &&
      got.money_mode === 'bag' &&
      got.player_note === '' &&
      got.gm_note === 'G',
    'lists: update() does not read back'
  );
  assert(
    got?.list_entries.map(view).join(';') === 'q313|1|||;ci1|2|150|a|;q1|5|20|n|',
    'lists: addEntries(), updateEntry() or reorder() does not read back'
  );

  const missed = await lists.reorder(id, [c, a]);
  assert(
    !missed.ok && missed.error === 'refused',
    'lists: a reorder that misses an entry was taken'
  );

  assert((await lists.removeEntries([a, b, c])).ok, 'lists: removeEntries() was refused');
  got = await theList(port, id, assert, 'after removeEntries');
  assert(got?.list_entries.length === 0, 'lists: removeEntries() left an entry');
  assert((await lists.remove(id)).ok, 'lists: remove() was refused');
  const after = await listsOf(port, assert, 'after remove');
  assert(
    after?.length === before && !after.some((l) => l.id === id),
    'lists: remove() left the list'
  );
}

/* No key of `o`, at any depth, is `gm_note`. */
function hasGmNote(o: unknown): boolean {
  if (Array.isArray(o)) return o.some(hasGmNote);
  if (o === null || typeof o !== 'object') return false;
  return Object.entries(o).some(([k, v]) => k === 'gm_note' || hasGmNote(v));
}

async function shareCases(port: CloudPort, assert: Assert): Promise<void> {
  const { lists, shares } = port;
  const id = lists.newId();
  const [a, b] = [lists.newId(), lists.newId()];
  const row = {
    id,
    name: 'Ссылки',
    money_mode: 'bag' as const,
    player_note: 'p',
    gm_note: 'g'
  };
  assert(
    (await lists.create(row, [entryOf(a, 'ci1', 0), entryOf(b, 'q1', 1, { gm_note: 'h' })])).ok,
    'shares: the list was not created'
  );
  const none = await shares.list(id);
  assert(none.ok && none.shares.length === 0, 'shares: a new list does not read no shares');

  const player = await shares.create(id, 'player');
  const again = await shares.create(id, 'player');
  assert(player.ok, 'shares: create(player) was refused');
  assert(
    player.ok && again.ok && again.id === player.id && again.token === player.token,
    'shares: a second create(player) made another share'
  );
  const gm = await shares.create(id, 'gm');
  assert(gm.ok, 'shares: create(gm) was refused');
  if (!player.ok || !gm.ok) return;

  const seen = await shares.read(player.token);
  const p = seen.ok ? seen.shared : null;
  assert(
    p?.audience === 'player' && p.list.name === 'Ссылки' && p.list.player_note === 'p',
    'shares: the player link does not read the list'
  );
  assert(p !== null && !hasGmNote(p), 'shares: the player link reads a GM note');
  assert(
    p?.entries.map((e) => e.item_key).join(',') === 'ci1,q1',
    'shares: the player link does not read the entries in order'
  );
  const seenGm = await shares.read(gm.token);
  const g = seenGm.ok ? seenGm.shared : null;
  assert(
    g?.list.gm_note === 'g' && g.entries[1]?.gm_note === 'h',
    'shares: the GM link does not read the GM notes'
  );
  assert(
    (await shares.ownerOf(player.token)) === id,
    "shares: ownerOf is not the owner's list"
  );

  /* A link is replaced by deleting it and making a new one. */
  assert((await shares.revoke(player.id)).ok, 'shares: revoke(player) was refused');
  const old = await shares.read(player.token);
  assert(old.ok && old.shared === null, 'shares: a deleted link still opens the list');
  const remade = await shares.create(id, 'player');
  assert(remade.ok && remade.token !== player.token, 'shares: create() reused a deleted link');
  if (!remade.ok) return;
  const fresh = await shares.read(remade.token);
  assert(
    fresh.ok && fresh.shared?.list.name === 'Ссылки',
    'shares: the new link opens nothing'
  );

  assert((await shares.revoke(gm.id)).ok, 'shares: revoke(gm) was refused');
  assert((await shares.revoke(gm.id)).ok, 'shares: a second revoke() was refused');
  const stopped = await shares.read(gm.token);
  assert(
    stopped.ok && stopped.shared === null,
    'shares: a deleted GM link still opens the list'
  );

  const all = await shares.list(id);
  const rows = all.ok ? all.shares : [];
  assert(
    rows.length === 3 &&
      rows.filter((r) => r.revoked_at !== null).length === 2 &&
      rows.filter((r) => r.revoked_at === null).length === 1,
    'shares: the owner does not read two stopped rows and one active'
  );
  const gmAgain = await shares.create(id, 'gm');
  assert(
    gmAgain.ok && gmAgain.token !== gm.token,
    'shares: create() after a deleted GM link reused it'
  );

  const copy = lists.newId();
  assert((await shares.clone(remade.token, copy)).ok, 'shares: clone() was refused');
  assert((await shares.clone(remade.token, copy)).ok, 'shares: a second clone() was refused');
  const got = await theList(port, copy, assert, 'after clone');
  assert(
    got?.name === 'Ссылки' &&
      got.player_note === 'p' &&
      got.gm_note === '' &&
      got.list_entries.length === 2 &&
      got.list_entries.every((e) => e.gm_note === ''),
    'shares: a player copy does not hold the list without its GM notes'
  );
  const nobody = await shares.create(lists.newId(), 'player');
  assert(!nobody.ok && nobody.error === 'refused', 'shares: a share of no list was made');
}

export async function runCloudContract(
  make: (as?: string) => Promise<CloudPort>,
  users: ContractUsers,
  assert: (cond: boolean, msg: string) => void
): Promise<void> {
  /* A. signed out, with no redirect to report and no preferences */
  const signedOut = await make();
  const out = signedOut.auth;
  assert((await out.session()) === null, 'signed out: session is not null');
  const none = await out.identities();
  assert(Array.isArray(none) && none.length === 0, 'signed out: identities are not []');
  assert((await out.redirectResult()) === null, 'a fresh port: there is a redirect result');
  const outRead = await signedOut.prefs.load();
  assert(!outRead.ok, 'prefs: signed out, load() is not { ok: false }');
  assert(
    !(await signedOut.prefs.save({ view: 'grid' })),
    'prefs: signed out, save() was taken'
  );
  assert(!(await signedOut.lists.list()).ok, 'lists: signed out, list() is not { ok: false }');
  const nothing = await signedOut.shares.read('nonsense');
  assert(nothing.ok && nothing.shared === null, 'shares: an unknown token does not read null');
  assert(
    (await signedOut.shares.ownerOf('nonsense')) === null,
    'shares: signed out, ownerOf() is not null'
  );
  const outClone = await signedOut.shares.clone('nonsense', signedOut.lists.newId());
  assert(
    !outClone.ok && outClone.error === 'refused',
    'shares: signed out, clone() was not refused'
  );

  /* B. a port made as the member is signed in as the member */
  const { member } = users;
  const { auth, prefs } = await make(member.as);
  const s = await auth.session();
  assert(s?.userId === member.userId, 'as member: session is not the member');
  assert(s?.email === member.email, "as member: session email is not the member's");
  const ids = await auth.identities();
  assert(Array.isArray(ids), 'as member: identities are not an array');
  assert(
    (ids ?? []).every((i) => PROVIDERS.includes(i.provider)),
    'as member: an identity is neither google nor discord'
  );
  assert((await prefs.load()).ok, 'prefs: as member, load() is not ok');

  /* C. an identity the account does not hold is refused */
  const unlinked = await auth.unlink(UNKNOWN_IDENTITY);
  assert(
    !unlinked.ok && unlinked.error === 'failed',
    'unlink: an unknown identity was not refused'
  );

  /* D. signOut clears and announces null. The real client announces the
     current session on subscribe and the fake does not: that is let land,
     and only what follows the sign-out is compared. */
  const seen: (Session | null)[] = [];
  const off = auth.onChange((x) => seen.push(x));
  await auth.session();
  await new Promise((r) => setTimeout(r, 0));
  const before = seen.length;
  const left = await auth.signOut();
  assert(left.ok, 'signOut: refused');
  assert((await auth.session()) === null, 'signOut: session is not null');
  const after = seen.slice(before);
  assert(after.length === 1 && after[0] === null, 'signOut: onChange did not fire null once');
  off();

  /* F. the doomed user's preferences: none, then a whole row, then a save
     that replaces it */
  const doomedPort = await make(users.doomed);
  const first = await doomedPort.prefs.load();
  assert(first.ok && first.prefs === null, 'prefs: a new account does not read { ok, null }');
  const P1: Prefs = {
    lang: 'en',
    home: '#/lists',
    view: 'grid',
    printBw: true,
    printCompact: false
  };
  assert(await doomedPort.prefs.save(P1), 'prefs: save() of a whole row was refused');
  const saved = await doomedPort.prefs.load();
  assert(saved.ok && samePrefs(saved.prefs, P1), 'prefs: load() does not read the row saved');
  assert(await doomedPort.prefs.save({ view: 'list' }), 'prefs: a second save() was refused');
  const replaced = await doomedPort.prefs.load();
  assert(
    replaced.ok && samePrefs(replaced.prefs, { view: 'list' }),
    'prefs: a save() did not replace the whole row'
  );

  /* G. a list written and read back through every write, on the doomed
     user. The account's deletion (E) takes the rows with it,
     so a run against the hosted project leaves nothing behind. */
  await listCases(doomedPort, assert);

  /* H. share links made, read, deleted, made again and copied, on the doomed
     user; the account's deletion takes them with it. */
  await shareCases(doomedPort, assert);

  /* E. deleteAccount leaves nothing signed in */
  const doomed = doomedPort.auth;
  const deleted = await doomed.deleteAccount();
  assert(deleted.ok, 'deleteAccount: refused');
  assert((await doomed.session()) === null, 'deleteAccount: session is not null');
  const gone = await doomed.identities();
  assert(Array.isArray(gone) && gone.length === 0, 'deleteAccount: identities are not []');
}
