/* The fake cloud's fixed world: two users with fixed ids, so a golden that
 * signs in holds the same text on every run. `gm1` has two identities (the
 * unlink guard has something to allow), `gm2` has one (it has something to
 * refuse). `gm1` keeps a preferences row, `gm2` none (a first sign-in
 * seeds it). Both own cloud lists; `gm1`'s first list has a player and a
 * GM share link. docs/specs/COVERAGE.md, "Test layers". */

import type { MoneyMode } from '../lib/money.js';
import type { Prefs } from '../lib/prefs.js';
import type { Provider } from './types.js';

/** A fixed, valid v4-shaped id: `uuid(1)` is `00000000-0000-4000-8000-000000000001`. */
export function uuid(n: number): string {
  return '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
}

interface SeedIdentity {
  id: string;
  provider: Provider;
  email: string;
}

export interface SeedUser {
  id: string;
  email: string;
  identities: SeedIdentity[];
  prefs?: Prefs;
}

const USERS = {
  gm1: {
    id: uuid(1),
    email: 'gm1@example.test',
    identities: [
      { id: uuid(11), provider: 'google', email: 'gm1@example.test' },
      { id: uuid(12), provider: 'discord', email: 'gm1.discord@example.test' }
    ],
    /* No `home` and the default language, so the `as gm1` goldens keep their
       pin state and their Russian half; states case 36 opens it English. */
    prefs: { lang: 'ru', view: 'grid', printBw: true, printCompact: true }
  },
  gm2: {
    id: uuid(2),
    email: 'gm2@example.test',
    identities: [{ id: uuid(21), provider: 'google', email: 'gm2@example.test' }]
  }
} satisfies Record<string, SeedUser>;

type SeedUserId = keyof typeof USERS;

/** An entry of a seeded cloud list; `gold` is the price in coins. */
export interface SeedEntry {
  id: string;
  itemKey: string;
  position: number;
  qty?: number;
  gold?: number;
  note?: string;
  hnote?: string;
}

/** A seeded cloud list. The times are offsets back from the port's boot,
 * so an "edited N ago" text reads the same on every run. */
export interface SeedList {
  id: string;
  name: string;
  money?: MoneyMode;
  note?: string;
  hnote?: string;
  entries: SeedEntry[];
  createdAgoMs: number;
  editedAgoMs: number;
}

/** A seeded share link. The tokens are not the database's 43-character
 * shape on purpose: only the fake resolves them. */
export interface SeedShare {
  id: string;
  listId: string;
  audience: 'player' | 'gm';
  token: string;
  topicKey: string;
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/* gm1: a full list with both notes, two shares and prices in coins; an
   empty list; an old list. gm2: one list of its own. The offsets keep
   away from the boundaries of an "edited N ago" text. */
const LISTS = {
  gm1: [
    {
      id: uuid(101),
      name: 'Лавка кузнеца',
      money: 'coin',
      note: 'Открыта с рассвета до заката.',
      hnote: 'Кузнец торгуется, если назвать имя его брата.',
      entries: [
        { id: uuid(1101), itemKey: 'ci1', position: 0, qty: 2, gold: 150 },
        { id: uuid(1102), itemKey: 'q1', position: 1, note: 'Последний в наличии.' },
        { id: uuid(1103), itemKey: 'q313', position: 2 },
        { id: uuid(1104), itemKey: 'cc1', position: 3, qty: 5, gold: 20 },
        { id: uuid(1105), itemKey: 'voa2_a3', position: 4, hnote: 'Проклят.' },
        { id: uuid(1106), itemKey: 'q23', position: 5 },
        { id: uuid(1107), itemKey: 'w51', position: 6, qty: 1, gold: 99999 },
        { id: uuid(1108), itemKey: 'q35', position: 7 },
        { id: uuid(1109), itemKey: 'di11', position: 8 }
      ],
      createdAgoMs: 10 * DAY,
      editedAgoMs: 3 * DAY
    },
    {
      id: uuid(102),
      name: 'Пустой список',
      entries: [],
      createdAgoMs: 2 * HOUR,
      editedAgoMs: HOUR
    },
    {
      id: uuid(103),
      name: 'Трофеи',
      entries: [
        { id: uuid(1301), itemKey: 'q1', position: 0 },
        { id: uuid(1302), itemKey: 'ci1', position: 1 }
      ],
      createdAgoMs: 40 * DAY,
      editedAgoMs: 30 * DAY
    }
  ],
  gm2: [
    {
      id: uuid(201),
      name: 'Список второго ГМа',
      entries: [{ id: uuid(2101), itemKey: 'q23', position: 0 }],
      createdAgoMs: 5 * DAY,
      editedAgoMs: 2 * DAY
    }
  ]
} satisfies Record<SeedUserId, SeedList[]>;

const SHARES: SeedShare[] = [
  {
    id: uuid(111),
    listId: uuid(101),
    audience: 'player',
    token: 'player-token-1',
    topicKey: uuid(112)
  },
  { id: uuid(113), listId: uuid(101), audience: 'gm', token: 'gm-token-1', topicKey: uuid(114) }
];

export interface Seed {
  users: Record<SeedUserId, SeedUser>;
  defaultUser: SeedUserId;
  lists: Record<SeedUserId, SeedList[]>;
  shares: SeedShare[];
}

export const SEED: Seed = {
  users: USERS,
  defaultUser: 'gm1',
  lists: LISTS,
  shares: SHARES
};
