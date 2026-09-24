/* The fake cloud's fixed world: two users with fixed ids, so a golden that
 * signs in holds the same text on every run. `gm1` has two identities (the
 * unlink guard has something to allow), `gm2` has one (it has something to
 * refuse). docs/specs/COVERAGE.md, "Test layers". */

import type { Provider } from './types.js';

/** A fixed, valid v4-shaped id: `uuid(1)` is `00000000-0000-4000-8000-000000000001`. */
export function uuid(n: number): string {
  return '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
}

export interface SeedIdentity {
  id: string;
  provider: Provider;
  email: string;
}

export interface SeedUser {
  id: string;
  email: string;
  identities: SeedIdentity[];
}

const USERS = {
  gm1: {
    id: uuid(1),
    email: 'gm1@example.test',
    identities: [
      { id: uuid(11), provider: 'google', email: 'gm1@example.test' },
      { id: uuid(12), provider: 'discord', email: 'gm1.discord@example.test' }
    ]
  },
  gm2: {
    id: uuid(2),
    email: 'gm2@example.test',
    identities: [{ id: uuid(21), provider: 'google', email: 'gm2@example.test' }]
  }
} satisfies Record<string, SeedUser>;

export type SeedUserId = keyof typeof USERS;

export interface Seed {
  now: string;
  users: Record<SeedUserId, SeedUser>;
  defaultUser: SeedUserId;
}

export const SEED: Seed = {
  now: '2026-09-01T12:00:00Z',
  users: USERS,
  defaultUser: 'gm1'
};
