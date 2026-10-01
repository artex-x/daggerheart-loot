/* The fake cloud's fixed world: three users with fixed ids, so a golden that
 * signs in holds the same text on every run. `gm1` has two identities (the
 * unlink guard has something to allow), `gm2` has one (it has something to
 * refuse). `gm1` keeps a preferences row, `gm2` none (a first sign-in
 * seeds it). Both own cloud lists; `gm1`'s first list has a player and a
 * GM share link. `gm1` holds one homebrew source with two sections and four
 * homebrew items; its first list refers to the axe, and `gm2`'s list holds a
 * frozen copy of it. `gm1` also holds a set card in its source and a rule card
 * with no source, which no item names, so no screen draws them. `gm2` holds no
 * homebrew. `gm3` holds no list and 34 items in the default source that name
 * catalog records: 15 loot items made from `ci1`, 15 weapons in `q1`'s line,
 * 4 loot items in the set `saints-ensemble` - the relation folds on a catalog card.
 * docs/specs/COVERAGE.md, "Test layers". */

import {
  recordOf,
  type BookContent,
  type CardContent,
  type CardKind,
  type HomebrewContent,
  type HomebrewRecord
} from '../lib/homebrew.js';
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
  },
  gm3: {
    id: uuid(3),
    email: 'gm3@example.test',
    identities: [{ id: uuid(31), provider: 'google', email: 'gm3@example.test' }]
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
  /** Absent: `official`. A homebrew entry with no snapshot is a reference. */
  source?: 'official' | 'homebrew';
  snapshot?: HomebrewRecord;
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

/* gm1's source and its axe: the item gm1's first list refers to, and gm2's list keeps a
   frozen copy of. */
const ALDER_KEY = 'hb_alderworkshopaaa';
const ALDER: BookContent = {
  ru: 'Мастерская Ольхи',
  en: 'Alder Workshop',
  sections: [
    { key: 'hb_sectpistolsaaaaa', ru: 'Пистоли', en: 'Pistols' },
    { key: 'hb_sectbladesaaaaaa', ru: 'Холодное оружие', en: 'Blades' }
  ]
};
const AXE_KEY = 'hb_emberaxeaaaaaaaa';
const AXE: HomebrewContent = {
  kind: 'equip',
  ru: 'Топор Тлеющих Углей',
  en: 'Ember Axe',
  rud: 'Лезвие тлеет и не гаснет под дождём.',
  ende: 'The blade smoulders and does not go out in the rain.',
  section: 'hb_sectbladesaaaaaa',
  eq: {
    t: 'weapon',
    tier: 2,
    cls: 'mag',
    tr: 'spellcast',
    rg: 'melee',
    dmg: 'd10+2',
    dt: 'mag',
    bu: 2
  }
};

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
        { id: uuid(1109), itemKey: 'di11', position: 8 },
        { id: uuid(1110), itemKey: AXE_KEY, position: 9, gold: 800, source: 'homebrew' }
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
      entries: [
        { id: uuid(2101), itemKey: 'q23', position: 0 },
        {
          id: uuid(2102),
          itemKey: AXE_KEY,
          position: 1,
          source: 'homebrew',
          snapshot: recordOf(AXE_KEY, AXE, { ...ALDER, key: ALDER_KEY })
        }
      ],
      createdAgoMs: 5 * DAY,
      editedAgoMs: 2 * DAY
    }
  ],
  gm3: []
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

/** A seeded homebrew source; the times are offsets back from the port's boot. */
export interface SeedBook {
  id: string;
  key: string;
  content: BookContent;
  createdAgoMs: number;
  editedAgoMs: number;
}

/** A seeded homebrew item; `bookId` absent is the default source. */
export interface SeedItem {
  id: string;
  key: string;
  bookId?: string;
  content: HomebrewContent;
  createdAgoMs: number;
  editedAgoMs: number;
}

/** A seeded set card or rule card; `bookId` absent is no source. */
export interface SeedCard {
  id: string;
  key: string;
  kind: CardKind;
  bookId?: string;
  content: CardContent;
  createdAgoMs: number;
  editedAgoMs: number;
}

interface SeedHomebrew {
  books: SeedBook[];
  items: SeedItem[];
  cards: SeedCard[];
}

/* gm3's items, keyed by a letter in their order. The long bedroll's names are 120 code
   points, the editor's bound. */
const letter = (i: number): string => String.fromCharCode(97 + i);
const BEDROLLS: readonly (readonly [string, string])[] = [
  ['Спальный мешок странника', "Wanderer's Bedroll"],
  ['Спальный мешок следопыта', "Tracker's Bedroll"],
  ['Спальный мешок тишины', 'Bedroll of Silence'],
  ['Спальный мешок из пепла', 'Ash Bedroll'],
  ['Тёплый спальный мешок', 'Warm Bedroll'],
  ['Спальный мешок дозорного', "Sentry's Bedroll"],
  ['Спальный мешок лекаря', "Healer's Bedroll"],
  ['Спальный мешок пилигрима', "Pilgrim's Bedroll"],
  ['Мешок спокойных снов', 'Sack of Quiet Dreams'],
  ['Спальный мешок кочевника', "Nomad's Bedroll"],
  ['Спальный мешок у костра', 'Campfire Bedroll'],
  ['Спальный мешок отшельника', "Hermit's Bedroll"],
  ['Спальный мешок стража', "Warden's Bedroll"],
  ['Спальный мешок ловца снов', "Dreamcatcher's Bedroll"],
  [
    'Спальный мешок долгой дороги через перевал, болота, пустоши и старый лес, где ночуют лишь те, кто не боится шорохов ночи',
    'Bedroll of the long road over the pass, through the marshes, the wastes and the old wood, where only the brave can sleep'
  ]
];
const SWORD_TIERS = [1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4] as const;
const SAINT_PIECES: readonly (readonly [string, string])[] = [
  ['Святые Сапоги', 'Saintly Boots'],
  ['Святой Пояс', 'Saintly Belt'],
  ['Святой Венец', 'Saintly Circlet'],
  ['Святые Перчатки', 'Saintly Gloves']
];
const GM3_ITEMS: SeedItem[] = [
  ...BEDROLLS.map(([ru, en], i) => ({
    id: uuid(601 + i),
    key: 'hb_bedroll' + letter(i) + 'aaaaaaaa',
    content: {
      kind: 'item' as const,
      ru,
      en,
      rud: 'Спальный мешок для долгой дороги.',
      ende: 'A bedroll for a long road.',
      craft_from: ['ci1']
    },
    createdAgoMs: (60 - i) * HOUR,
    editedAgoMs: (60 - i) * HOUR
  })),
  ...SWORD_TIERS.map((tier, i) => ({
    id: uuid(621 + i),
    key: 'hb_broadsword' + letter(i) + 'aaaaa',
    content: {
      kind: 'equip' as const,
      ru: 'Учебный палаш ' + String(i + 1),
      en: 'Practice Broadsword ' + String(i + 1),
      rud: 'Деревянный клинок для тренировок.',
      ende: 'A wooden blade for practice.',
      eq: {
        t: 'weapon' as const,
        tier,
        cls: 'phy' as const,
        tr: 'agility' as const,
        rg: 'melee' as const,
        dmg: 'd8',
        dt: 'phy' as const,
        bu: 1 as const,
        line: 'q1'
      }
    },
    createdAgoMs: (40 - i) * HOUR,
    editedAgoMs: (40 - i) * HOUR
  })),
  ...SAINT_PIECES.map(([ru, en], i) => ({
    id: uuid(641 + i),
    key: 'hb_saintpiece' + letter(i) + 'aaaaa',
    content: {
      kind: 'item' as const,
      ru,
      en,
      rud: 'Часть убранства святого.',
      ende: "A piece of a saint's ensemble.",
      set: 'saints-ensemble'
    },
    createdAgoMs: (20 - i) * HOUR,
    editedAgoMs: (20 - i) * HOUR
  }))
];

const HOMEBREW = {
  gm1: {
    books: [
      {
        id: uuid(501),
        key: ALDER_KEY,
        content: ALDER,
        createdAgoMs: 9 * DAY,
        editedAgoMs: 4 * DAY
      }
    ],
    items: [
      {
        id: uuid(511),
        key: AXE_KEY,
        bookId: uuid(501),
        content: AXE,
        createdAgoMs: 9 * DAY,
        editedAgoMs: 4 * DAY
      },
      {
        id: uuid(512),
        key: 'hb_smithpotionaaaaa',
        content: {
          kind: 'consumable',
          ru: 'Настой кузнеца',
          rud: 'Выпейте перед работой у горна: до конца сцены вы не отмечаете Стресс от жара.'
        },
        createdAgoMs: 8 * DAY,
        editedAgoMs: 8 * DAY
      },
      {
        id: uuid(513),
        key: 'hb_whispercapaaaaaa',
        content: {
          kind: 'item',
          en: 'Whispering Cap',
          ende: 'Once per rest, hear one sentence spoken within Far range.',
          tier: 2
        },
        createdAgoMs: 7 * DAY,
        editedAgoMs: 6 * DAY
      },
      {
        id: uuid(514),
        key: 'hb_engravedringaaaa',
        content: {
          kind: 'item',
          ru: 'Кольцо с гравировкой',
          rud: 'Надпись на неизвестном языке. Тёплое на ощупь.'
        },
        createdAgoMs: 2 * DAY,
        editedAgoMs: 2 * DAY
      }
    ],
    cards: [
      {
        id: uuid(521),
        key: 'hb_aldersetaaaaaaaa',
        kind: 'set',
        bookId: uuid(501),
        content: {
          ru: 'Комплект Ольхи',
          en: 'Alder Set',
          rud: 'Два предмета комплекта: +1 к Уклонению.',
          ende: 'Two pieces of the set: +1 to Evasion.'
        },
        createdAgoMs: 6 * DAY,
        editedAgoMs: 6 * DAY
      },
      {
        id: uuid(522),
        key: 'hb_alderrulecardaaa',
        kind: 'ref',
        content: {
          ru: 'Клеймо Ольхи',
          en: 'Alder Brand',
          rusub: 'Свойство оружия',
          ensub: 'Weapon feature',
          rud: 'Раз за отдых: перебросьте одну кость урона.',
          ende: 'Once per rest: reroll one damage die.',
          url: 'https://example.test/alder-brand'
        },
        createdAgoMs: 5 * DAY,
        editedAgoMs: 5 * DAY
      }
    ]
  },
  gm2: { books: [], items: [], cards: [] },
  gm3: { books: [], items: GM3_ITEMS, cards: [] }
} satisfies Record<SeedUserId, SeedHomebrew>;

export interface Seed {
  users: Record<SeedUserId, SeedUser>;
  defaultUser: SeedUserId;
  lists: Record<SeedUserId, SeedList[]>;
  shares: SeedShare[];
  homebrew: Record<SeedUserId, SeedHomebrew>;
}

export const SEED: Seed = {
  users: USERS,
  defaultUser: 'gm1',
  lists: LISTS,
  shares: SHARES,
  homebrew: HOMEBREW
};
