/* What any `CloudPort` must do, the fake and the real adapter alike.
 *
 * No test framework here: the caller hands in `assert`, so vitest runs it
 * over the fake (`fake-cloud.test.ts`) and `tests/e2e/contract.mjs` runs it
 * over the real adapter against the hosted test project. `make(as)` builds a
 * port signed in as that user, or signed out without one. Only what every
 * port does belongs here; what depends on the fake's seed stays in its own
 * tests (docs/specs/COVERAGE.md, "Test layers"). Each release appends the
 * cases for the port member it adds. */

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

  /* E. deleteAccount leaves nothing signed in */
  const doomed = doomedPort.auth;
  const deleted = await doomed.deleteAccount();
  assert(deleted.ok, 'deleteAccount: refused');
  assert((await doomed.session()) === null, 'deleteAccount: session is not null');
  const gone = await doomed.identities();
  assert(Array.isArray(gone) && gone.length === 0, 'deleteAccount: identities are not []');
}
