/* What any `CloudPort` must do, the fake and the real adapter alike.
 *
 * No test framework here: the caller hands in `assert`, so vitest runs it
 * over the fake and a Node script can run it over the real adapter against
 * the hosted test project. `make(as)` builds a port signed in as that seed
 * user, or signed out without one. Each release appends the cases for the
 * port member it adds. */

import type { Seed } from './fake-cloud-seed.js';
import type { CloudPort, Session } from './types.js';

export async function runCloudContract(
  make: (as?: string) => Promise<CloudPort>,
  seed: Seed,
  assert: (cond: boolean, msg: string) => void
): Promise<void> {
  const def = seed.users[seed.defaultUser];

  /* 1. signed out at start */
  const cloud = await make();
  const { auth } = cloud;
  assert((await auth.session()) === null, 'signed out: session is not null');
  assert((await auth.identities()).length === 0, 'signed out: identities are not empty');

  /* 2. signIn yields the default user and notifies once */
  const seen: (Session | null)[] = [];
  const off = auth.onChange((s) => seen.push(s));
  await auth.signIn('google');
  const s = await auth.session();
  assert(s?.userId === def.id, 'signIn: session is not the default user');
  assert(s?.email === def.email, 'signIn: session email is not the default user');
  assert(
    seen.length === 1 && seen[0]?.userId === def.id,
    'signIn: onChange did not fire once with the user'
  );

  /* 3. identities in the seed's order */
  const ids = await auth.identities();
  assert(
    ids.map((i) => i.id).join() === def.identities.map((i) => i.id).join(),
    "identities: not the seed's, in order"
  );

  /* 4. unlink one, then the last is refused */
  const google = def.identities.find((i) => i.provider === 'google');
  const discord = def.identities.find((i) => i.provider === 'discord');
  assert(!!google && !!discord, 'seed: the default user needs a google and a discord identity');
  const unlinked = await auth.unlink(discord?.id ?? '');
  assert(unlinked.ok, 'unlink: a second identity was not removed');
  const last = await auth.unlink(google?.id ?? '');
  assert(
    !last.ok && last.error === 'lastIdentity',
    'unlink: the last identity was not refused'
  );

  /* 5. link adds one back */
  const linked = await auth.link('discord');
  assert(linked.ok, 'link: refused');
  assert((await auth.identities()).length === 2, 'link: identities are not two again');

  /* 6. signOut clears and notifies null */
  seen.length = 0;
  await auth.signOut();
  assert((await auth.session()) === null, 'signOut: session is not null');
  assert(seen.length === 1 && seen[0] === null, 'signOut: onChange did not fire null');
  off();

  /* 7. a port made as a user starts signed in */
  const other = await make('gm2');
  const gm2 = seed.users.gm2;
  assert((await other.auth.session())?.userId === gm2.id, 'as gm2: not signed in as gm2');
  assert((await other.auth.identities()).length === 1, 'as gm2: not exactly one identity');

  /* 8. deleteAccount leaves nothing signed in */
  const deleted = await other.auth.deleteAccount();
  assert(deleted.ok, 'deleteAccount: refused');
  assert((await other.auth.session()) === null, 'deleteAccount: session is not null');
  assert((await other.auth.identities()).length === 0, 'deleteAccount: identities remain');
}
