# Daggerheart Loot Generator

*[Эта страница по-русски](README.ru.md)*

A loot generator for the Daggerheart tabletop RPG, in English and Russian. Roll
on any of the published loot tables, browse them in full, collect what you rolled
into a list, hand that list to your players as a single link, or print it as
cards.

**Open it: https://artex-x.github.io/daggerheart-loot/**

1061 records in all - 680 items and consumables plus 381 pieces of equipment -
each with a name, a description, a stat line where it has one, and an
illustration. No build step, no server, no account, no tracking.

> **For AI agents.** The app renders on the client, and a list lives in the URL
> fragment, which never reaches the server: fetching `index.html` gives you an
> empty page. The readable data is separate -
> [`catalog.csv`](https://artex-x.github.io/daggerheart-loot/catalog.csv) for
> selection, [`data.json`](https://artex-x.github.io/daggerheart-loot/data.json)
> for full text, and
> [`llms.txt`](https://artex-x.github.io/daggerheart-loot/llms.txt) for the URL
> grammar, the list-link format, and guidance on which set to draw from.

## Rolling

| Mode | Input | Result |
|---|---|---|
| Core rules | 1-60, or a roll of 1d12 to 5d12 | up to 4 results: an item and a consumable, from Core and from Hope & Fear |
| Alternate tables | rarity + Hope Die + Fear Die | 4 results; on a critical success, a link to the table one rarity up |
| Wondrous | 1-119 | 1 item |
| Dread | 1-29 | 1 item |
| Vault of Ages | 1-108 | 1 item |
| Communities | community + 1-10 | 1 item |

Core and Hope & Fear are the same Nd12 roll against the same 1-60 table, so they
share one mode with a source switch. Rarity there only sets how many dice you
roll, so each button is labelled with both the dice count and the rarities that
count covers. Where a range is not a real die - 119 in Wondrous, 29 in Dread -
the button reads "Random 1-N" instead of naming a die that does not exist.

The **?** button beside a heading explains the mode: how the Hope and Fear
columns are laid out, which rarity turns up where, and why the tiers printed
next to rarities are a recommendation rather than a limit.

## Tables, search and filters

**Tables** holds every table in full, including the alternate ones and the three
equipment tables (weapons, secondary weapons, armour), each with its own search
box and a list/grid switch. **Search** covers all 1061 records at once - names,
descriptions and stat lines, in both languages.

Sections are addressable, and every heading has a copy-link button:

```
#/tables/alt_item            the alternate item table
#/tables/alt_item/rare       the same, at the "Rare - Tier 2-3" block
#/tables/community/Seaborne  Seaborne items
#/tables/frames/dark_heart   equipment for the Dark Heart campaign frame
```

Every table has a filter panel; where there is nothing to filter by, there is no
panel. Equipment filters by tier, class, source, trait, range, burden and upgrade
line; Vault of Ages by kind and tier; campaign frames by kind and frame;
communities by community. Nothing is selected by default and an empty row means
"any", so "tier 2 only" is one click. Values within a row are OR'd, rows narrow
each other.

The selection lives in the address rather than in storage, so a filtered view can
be copied straight out of the browser bar:

```
#/tables/eq_weapon/f_tier-2.cls-mag
```

## Lists

**Lists** collects several records and hands them over as one link.

1. Create a list. The page you are on does not change.
2. In Tables or Search, tick what you want and press **Add to list**.
3. Open the list to rename it, reorder it, drop entries, copy it as text, share
   it, or print it.

The **Add to list** button on an item card opens the same menu; it stays open
after a click, so one item goes into several lists at once. Entries are reordered
by dragging the handle, or by typing a new position into the number beside the
row. A list has its own roll button, which picks one of its own entries.

### Quantity and price

Each entry takes an optional **quantity** and **price in gold**, and both travel
into the copied text: `Stone of Valour ×2 - 50 gold`. Batch actions on a list can
set or clear prices, shift them all by a percentage, or **Suggest prices**, which
fills in the middle of a band read off the tier for equipment and the rarity for
loot.

Prices display two ways:

| Mode | Reads |
|---|---|
| As in the book (default) | handfuls, bags and chests: 10 handfuls = 1 bag, 10 bags = 1 chest |
| In coins | the optional rule where 1 handful = 10 coins |

A price is always typed in coins; the mode only changes how it reads - at most
two units, rounded to the nearest, the way money is spoken of at the table. 750
is 7 bags 5 handfuls, and 899 is 9 bags.

### Two notes

A list, and every entry in it, carries two notes:

| | Goes into |
|---|---|
| **For players** | the copied text, the player link, the GM link |
| **GM only** | the GM link |

Hence two share buttons. **Player link** is what you drop in the party chat.
**GM link** is a full snapshot including the GM notes, and doubles as a backup
from which the list can be restored on another device. The address in the browser
bar is always the player link.

### The link format

A list needs no server - the whole thing is encoded in the address:

```
https://artex-x.github.io/daggerheart-loot/#/l/0JrQu9Cw0LQg...
```

Only the name, the entry ids, any hand-typed quantity and price, and the two
notes are stored; text and images come from `data.js` at render time, so fixing
the data fixes every list and link that points at it. The payload starts with the
entry count and four characters of hash (`3.k7f2~q1,cc21*5*50,q337`), which turns
a link truncated by a messenger into a "broken link" page rather than a shorter
list that looks complete. The format is documented in `llms.txt` and is backward
compatible.

### Where lists live

**In this browser's `localStorage`, and nowhere else.** There is no server and no
sync. Clearing site data, a private window or a different browser means no lists.
To keep one, press **GM link** and save the address: it restores the list whole,
both notes included.

Two open tabs do not overwrite each other: a save re-reads storage and merges by
`id`, a list deleted in one tab is tombstoned for the session, and the `storage`
event redraws the other tab.

## Printing

`#/print/<id>-<id>-...` lays the given records out as cards, nine to an A4 page,
63x88 mm each - the size of a playing card, so sleeves and card boxes fit. Up to
180 cards, twenty sheets, at a time. The button appears wherever a set of records
exists: an item page, a list, a table selection. The address itself is shareable.

Two sheet styles. The colour sheet keeps the artwork, the tier banner, the burden
hands and the gold stat strip. The black-and-white sheet drops the artwork and
the gold and collects the banner, the type chip and the armour mark into a row
above the name - dark backgrounds and gold eat toner and turn to grey mush on a
mono printer. Anything the colour card tells apart by colour, the
black-and-white card also tells apart by a word.

## Sending an item to a chat

Beside an item's name are two icons - copy the name, copy a link to the card -
and below it three buttons:

| Button | What you get |
|---|---|
| **Share** | on a phone, the system share sheet with the image and a caption; on a desktop with the Share API, a menu with the link; without it, the link is copied |
| **Image** | the picture on the clipboard. Browsers will not put WebP there, so it is converted to PNG through a canvas; if that fails too, the file downloads |
| **Text** | name and description, no link |

Copied text goes to the clipboard twice over: `text/html` with the name in `<b>`,
and plain `text/plain`. Telegram Desktop, Word, Notion and Google Docs take the
HTML and show the name in bold; everything else takes the plain text and gets no
stray markup. Consumables get "(consumable)" appended outside the app, where the
badge is not visible.

## Item links

The link icon beside a name gives a static page with Open Graph markup that
redirects into the app, so Telegram, Discord and the rest unfold it into a card:

```
https://artex-x.github.io/daggerheart-loot/i/ci15.html
```

`og/` holds JPEG copies of the artwork for exactly this - some Telegram clients
will not show WebP in `og:image`. Ids are stable and match `id` in `data.js`:

| Prefix | Set | Example |
|---|---|---|
| `ci` / `cc` | Core, item / consumable | `ci15`, `cc56` |
| `hi` / `hc` | Hope & Fear, item / consumable | `hi45`, `hc60` |
| `w` | Wondrous Loot | `w119` |
| `di` | Dread GM Toolbox | `di3` |
| `voa` | Vault of Ages | `voa2_a1` |
| `cm` | Community items | `cm81` |
| `f` | Campaign frame equipment | `f7` |
| `q` | Core and Hope & Fear equipment | `q26` |

Communities run ten at a time in alphabetical order: Highborne `cm1`-`cm10`,
Loreborne `cm11`-`cm20`, and so on.

## What the app remembers

Everything is in this browser's `localStorage`.

| Key | Holds |
|---|---|
| `dhloot.lists.v2` | lists with their contents and notes |
| `dhloot.lang.v1` | interface language |
| `dhloot.home.v1` | starting section |
| `dhloot.prefs.v1` | table view (list or grid) and the height of note fields |
| `dhloot.warn.v1` | that the storage warning has been dismissed |

The line is drawn where the interface draws it: **how** a page looks is
remembered, **what** was asked on it is not. Filters, rarity, community, the
number in the roll box, search text, ticked entries and open help all start over
on reload. Equipment filters are the exception in the other direction - they live
in the address, to be shared rather than carried between sessions. Settings are
read as untrusted data: an unusable value falls back to the default, broken JSON
is ignored whole.

The app opens on Core rules. The house icon beside a heading pins the current
section as the starting one; pressing it again restores the default. Any of the
nine sections works, as does any table by name. An item card or a list cannot be
pinned - it is a snapshot that drifts away from the data.

## Running and developing

No build, no runtime dependencies. Open `index.html` in a browser; `file://`
works.

```
index.html                  markup
style.css                   styles
app.js                      routing, roll modes, search, tables, lists, print
data.js                     the data: window.LOOT
card/*.svg                  36 vectors for the print cards, exported from Figma
img/*.webp                  850 pictures, 640x640, ~31 MB
og/*.jpg                    the same pictures as JPEG for link previews, ~47 MB
i/*.html                    1061 stub pages with Open Graph markup
data.json                   the same data as plain JSON, for outside readers
catalog.csv                 one row per record, with stat lines
llms.txt                    what the site is, URL grammar, list-link format
robots.txt                  crawling allowed, training scrapers excluded
tools/build.js              rebuilds every derived file
tools/build-share-pages.js  generates i/ from data.js
tools/derived.js            how the derived files are assembled
tests/                      18 suites plus the runner
```

### Derived files

`data.json`, `catalog.csv` and `i/*.html` are built from `data.js`. After any
change to the data, run `node tools/build.js`. Forgetting is not fatal:
`tests/derived.js` rebuilds them into memory and compares against what is
committed, so a mismatch fails a test. Artwork and previews are outside that
script - they are made from the source files by hand, and `tests/dataint.js`
checks that both files exist for every record that has a picture.

### Tests

```
node tests/run-all.js            # everything, in parallel
node tests/run-all.js eqtest     # one suite
node tests/run-all.js --jobs 1   # one at a time, for debugging
```

Needs `puppeteer` and `jsdom`: `npm i puppeteer jsdom`.

| Suite | Checks |
|---|---|
| `dataint` | `data.js` invariants: ids, numbering, references, equipment fields, image and stub files |
| `derived` | derived files match the generator, and the counts written into the docs match the data |
| `i18n` | translation parity, and no string the code asks for that is missing |
| `typo` | two fonts and one size scale across every page and both languages |
| `hues` | badges that can appear in one list are told apart by hue |
| `qa` | regressions from an external report: caret, focus, live regions, contrast, truncated links, two tabs, previews |
| `craft` | upgrade chains: data, rendering, copying, stubs |
| `flows` | modal, list address, clipboard, copying a whole roll |
| `select` | selection, batch add and copy, the list menu |
| `notes` | the two notes: copying, both links, migrating older lists, field height |
| `noart` | records without a picture, and pictures that fail to load |
| `eqtest` | equipment: class, order, filters, filter links, anchors, copying |
| `lists2` | the list page: dragging, position entry, list search, warning |
| `print` | print sheet: grid, card size against the design, black and white, art edges |
| `behave` | rolls, search, language, back and forward, copying, storage disabled |
| `craftmob` | layout on narrow screens |
| `audit2` | a walk over every address, at four widths and in both languages |
| `states` | states reachable only by clicking |

Browser suites use puppeteer, each on its own context: pages of one browser share
`localStorage`, and without that the chosen language leaks between suites.

### Machine readability and search

A fetcher sees an empty page and a list link looks like nonsense, so the data
lives separately: `catalog.csv` for selection, `data.json` for full parsing,
`llms.txt` for the URL grammar, the list-link format, the two kinds of note and
price guidance. Those files are in English - models read them, and it is cheaper
that way. The list-link format is documented well enough to build a working
address from without touching the site, and `tests/lists2.js` verifies it with an
implementation of its own.

The site is kept out of search results by a `noindex` tag on every page. Crawling
itself is **not** blocked, deliberately: a crawler that is turned away never
reads the tag and may list a bare URL found elsewhere, and messenger previews
stop working entirely. Training scrapers are excluded separately in `robots.txt`.

## Data structure

`data.js` is a single `window.LOOT = {...}`:

```js
{
  items: {
    core_item: [ { id, src, kind, roll, en, ende, ru, rud, img, craft? }, ... ],
    core_consumable: [ ... ], hnf_item: [ ... ], hnf_consumable: [ ... ],
    wondrous: [ ... ], dread: [ ... ],
    voa:       [ { ..., tier, recall }, ... ],
    frames:    [ { ..., frame, eq:{...} }, ... ],
    community: [ { ..., community, community_ru }, ... ]
  },
  eq:   [ { id, src, kind:'equip', en, ende, ru, rud, img, eq:{...} }, ... ],
  refs: { 'vicious-entangle': { ... } },
  alt: {
    item:       { common: { hope: [12 ids], fear: [12 ids] }, uncommon: {...},
                  rare: {...}, very_rare: {...}, legendary: {...} },
    consumable: { ... }
  }
}
```

| Field | Meaning |
|---|---|
| `en` / `ende` | English name and description |
| `ru` / `rud` | Russian name and description |
| `roll` | number in its own table |
| `kind` | `item`, `consumable` or `equip` |
| `img` | file name in `img/`, same as `id`; may be empty |
| `craft` | optional: `id` of what this upgrades into |
| `refs` | optional: keys into `window.LOOT.refs` |
| `tier` | Vault of Ages only: `1`-`4`, `A` for artifacts, `C` for cursed |
| `recall` | Vault of Ages only: Recall Cost |

To fix a translation, edit `ru` / `rud`. To remove a record, delete the object
and renumber `roll` on the rest. Where `img` is empty the app falls back to
`img/_none.webp` and hides the **Image** button, so a record can be added before
its illustration exists; the same happens when a listed file fails to load.

Fifteen records carry `craft`, the `id` of what they turn into - ingredients that
become potions, and the Core recipes. Only one direction is stored; the reverse
("Made from") is built at load, so the two halves cannot drift apart. Five
descriptions point at Core cards through `refs`; that text travels with the item
into copies and shares, so a player gets everything in one message.

### Equipment

Weapons and armour are not loot with a table number but things with stats, so
they sit in `window.LOOT.eq` and carry an `eq` block:

```js
{
  id:'q26', src:'hnf', kind:'equip',
  en:'Katana',  ende:'Quick: When you make an attack...',
  ru:'Катана',  rud:'Быстрое: Когда вы совершаете атаку...',
  img:'',
  eq:{ t:'weapon', tier:1, cls:'phy', tr:'agility', rg:'melee',
       dmg:'d10+3', dt:'phy', bu:2, as:null, th:null, line:'q26' }
}
```

| `eq` field | Meaning |
|---|---|
| `t` | `weapon`, `secondary` or `armor` |
| `tier` | 1-4, always taken from a book, never inferred from the stats |
| `cls` | section of the book: `phy` or `mag`. On secondary weapons it equals the damage type |
| `tr` | trait: `agility`, `strength`, `finesse`, `instinct`, `presence`, `knowledge` |
| `rg` | range: `melee`, `veryclose`, `close`, `far`, `veryfar` |
| `dmg` / `dt` | damage and its type: `phy`, `mag`, `any` |
| `bu` | burden: 1 one-handed, 2 two-handed |
| `as` / `th` | Armour Score and base thresholds, armour only |
| `line` | `id` of the first item in the upgrade line; empty on one-offs |

Records follow the order of the books, and ids are handed out in that order, so
the table on screen matches the spread in the book. `ende` / `rud` hold only the
property, as `Name: text`; the stat line is assembled at render time, so it looks
the same in a table row, on a card, in copied text, in a share and in the Open
Graph markup.

`cls` and `dt` are different things. `cls` says which section of the book the
weapon is printed in - a magic weapon needs a Spellcast trait; `dt` is the damage
it deals. They usually agree, but the Shadowblade and the Ghostblade are
`cls:'mag'` with `dt:'any'`. The filter works on `cls`, and `any` lands in both.

Eleven Wondrous Loot records are weapons too. They stay in `items.wondrous` with
their roll number and carry the same `eq` block, so they look and copy like
equipment, but they are not in the equipment tables, which reproduce the two
books.

## Category colours

Badges are told apart by hue rather than lightness, with at least 49 degrees
between any two. The source badge (`Core`, `Hope & Fear`) is a neutral grey - it
is a caption, not a category - and the stat line carries no colour of its own.

| Item | Consumable | Primary weapon | Secondary weapon | Armour |
|---|---|---|---|---|
| `#7a8ee0` | `#9ec96a` | `#d48e6a` | `#cf7fa6` | `#5ec9c4` |
| indigo 228 | yellow-green 87 | terracotta 20 | rose 331 | turquoise 177 |

## Sources

| Set | Records | English text | Russian text |
|---|---|---|---|
| Core - items | 60 | Daggerheart SRD | [daggerheart.su](https://ru.daggerheart.su/) |
| Core - consumables | 60 | Daggerheart SRD | [daggerheart.su](https://ru.daggerheart.su/) |
| Hope & Fear - items | 60 | Daggerheart: Hope & Fear | fan translation |
| Hope & Fear - consumables | 60 | Daggerheart: Hope & Fear | fan translation |
| Wondrous Loot | 119 | [Wondrous Environments](https://www.drivethrurpg.com/en/product/552648/wondrous-environments) | fan translation |
| Dread GM Toolbox | 29 | [Dread GM Toolbox](https://www.drivethrurpg.com/en/product/573714/dread-gm-toolbox-for-daggerheart) | fan translation |
| Vault of Ages | 108 | Vault of Ages [1](https://www.drivethrurpg.com/en/product/562876/vault-of-ages-volume-1), [2](https://www.drivethrurpg.com/en/product/567176/vault-of-ages-volume-2), [3](https://www.drivethrurpg.com/en/product/574145/vault-of-ages-volume-3) | fan translation |
| Community items | 90 | [Community Magic Items](https://www.drivethrurpg.com/en/product/558159/community-magic-items-a-daggerheart-compatible-toolkit) | fan translation, community names per [daggerheart.su](https://ru.daggerheart.su/community) |
| Campaign frames | 94 | Beast Feast, Colossus, Dark Heart, Motherboard | fan translation |
| Weapons | 239 | Daggerheart SRD, Hope & Fear | Core from [daggerheart.su](https://ru.daggerheart.su/), H&F from a community sheet |
| Secondary weapons | 73 | Daggerheart SRD, Hope & Fear | as above |
| Armour | 69 | Daggerheart SRD, Hope & Fear | as above |
| Alternate tables | 5 rarities x 4 columns x 12 | Alternate Loot & Consumable Tables | points at the records above |

The alternate tables are by
[PrinceOfNowhereee](https://www.reddit.com/user/PrinceOfNowhereee/)
([the Reddit post](https://www.reddit.com/r/daggerheart/comments/1v3z3gm/alternate_loot_tables_combining_hope_fear_with/)).
Links to every third-party source are repeated in the app under the **?** button
of the section that uses it.

The Russian text is mostly unofficial;
[daggerheart.su](https://ru.daggerheart.su/) is the reference for terminology,
and the original is one RU/EN switch away. Core text follows the official errata,
and item names are spelled as the books spell them.

## Randomness

Rolls use `Math.random()`, tested for uniformity: chi-square for d10, d12 and
d119 matches the degrees of freedom, and per-face skew stays within 1.5% over
20 000 rolls per face. The feeling that multi-die modes repeat themselves comes
from the rules: the sum of Nd12 is triangular, so on `2d12` a 13 comes up 8.4% of
the time and the extremes about 0.7% each.

## Rights

The code (`index.html`, `style.css`, `app.js`, `tools/`, `tests/`) is MIT - see
[LICENSE](LICENSE).

**The artwork** in `img/` and `og/` was generated by the project's author and is
fan content. It has nothing to do with the original books.

**Game text** belongs to its rights holders and is included as a reference for
play at the table:

- **Core Rulebook** and **Hope & Fear** are used under the
  [Darrington Press Community Gaming License](https://darringtonpress.com/license/).
  Version 2.0, issued 25 August 2026, recognises the
  [Daggerheart SRD 2.0](https://daggerheart.com/srd) as Public Game Content and
  adds Hope & Fear to the games the licence covers. SRD 1.0 remains in force for
  material published before that.
- **Wondrous Environments**, **Dread GM Toolbox**, **Vault of Ages**,
  **Community Magic Items** and the **Alternate Loot & Consumable Tables** fall
  outside that licence: they are paid and fan supplements whose text belongs to
  their own authors.

> This product includes materials from the Daggerheart System Reference Document 2.0, © Critical Role, LLC. under the terms of the Darrington Press Community Gaming (DPCGL) License. More information can be found at https://www.daggerheart.com. There are no previous modifications by others.

Daggerheart © Darrington Press. This project is not affiliated with, or endorsed
by, Darrington Press or Critical Role.

If you hold rights to something here and want it removed,
[open an issue](https://github.com/artex-x/daggerheart-loot/issues) and it will
be removed.
