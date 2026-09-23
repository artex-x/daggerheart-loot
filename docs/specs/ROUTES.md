# Routes and hash grammar

Everything after `#` is the route. The app never asks a server for it, so the
grammar below is the whole router. Golden fixtures for these shapes are in
`docs/fixtures/urls/routes.json`; `tests/contracts.js` replays them.

The implementation is `parseHash()` in `app/src/lib/hash.ts`, plus
`TABLES_RE`, `legacySource()` and `TABLE_ALIASES` beside it.

## Sections

| Hash | Section |
|---|---|
| `#/roll/std` | Core rules, the shared 1-60 Nd12 table for Core and Hope & Fear |
| `#/roll/alt` | Alternate tables, rarity plus Hope and Fear dice |
| `#/roll/wondrous` | Wondrous Loot, 1-119 |
| `#/roll/dread` | Dread GM Toolbox, 1-29 |
| `#/roll/voa` | Vault of Ages, by section |
| `#/roll/dv` | The Dragon's Vault, 1-145 |
| `#/roll/community` | Community items, community plus 1-10 |
| `#/tables` | Tables index |
| `#/lists` | Lists index |
| `#/search` | Search |

These ten are also the tab bar (`SECTIONS`) and the ten a person may pin as
their starting section - nine pin as their own hash; `#/tables` pins as
whichever table is on screen (`#/tables/<table>`), never as the bare tab
address itself. See `STATE.md`, `dhloot.home.v1`, for what a pin actually
stores and reads back.

## Legacy section names

`#/roll/core`, `#/roll/hnf` and `#/roll/all` predate the merged mode. Each
resolves to `roll/std` and additionally sets the source switch: Core only,
Hope & Fear only, both. The address is **not** rewritten - an old link keeps
working and keeps its own text.

## Tables

```
#/tables/<table>
#/tables/<table>/<anchor>
#/tables/<table>/f_<filter>
```

`TABLES_RE` is `/^tables(?:\/([a-z_]+))?(?:\/([A-Za-z0-9_.-]+))?$/`.

Table names (`TABLE_IDS`): `core_item`, `core_consumable`, `hnf_item`,
`hnf_consumable`, `wondrous`, `community`, `dread`, `voa`, `dv`, `other_starting`, `other_frames`, `alt_item`,
`alt_consumable`, `eq_weapon`, `eq_secondary`, `eq_armor`.

`frames` is an alias for `other_frames` (`TABLE_ALIASES`, `hash.ts:39`):
`#/tables/frames` resolves the same as `#/tables/other_frames`, not to being
ignored.

A *named* table that is neither in that list nor an alias falls to `unknown` -
R9/Q3 settled one rule for every unreadable address, rather than the table
already on screen being ignored and kept as it was before. A **bare**
`#/tables` (no name segment at all) is not affected: it carries nothing to
fail against and keeps whichever table is already open, the same as always.
Changing to a different, valid table folds the filter panel and clears the
filter.

A tail that does not start with `f_` is an anchor - a block to scroll to, such
as `rare` on `alt_item` or `Seaborne` on `community`.

### Filter grammar

```
f_<group>-<value>[-<value>...][.<group>-<value>...]
```

Groups are separated by `.`, values inside a group by `-`. A `.` was chosen
because values may contain `_` (`frame-beast_feast`). Links written with the
older `_` group separator are still read, but only when the segment has no `.`
and every piece names a group the table offers; anything else is treated as
the current format. A retired group name ahead of a live one makes the whole
body one unknown group, so the live narrowing is dropped and the table stays
whole: unknown groups fail open, never empty.

Group keys, by table:

| Table | Groups |
|---|---|
| `eq_weapon` | `tier`, `src`, `cls`, `trait`, `range`, `burden`, `line` |
| `eq_secondary` | `tier`, `src`, `cls`, `trait`, `range`, `line` |
| `eq_armor` | `tier`, `src`, `line` |
| `voa` | `kind`, `tier` |
| `dv` | `kind` |
| `other_starting` | none |
| `other_frames` | `kind`, `frame` |
| `community` | `comm` |
| `core_item` and the other loot tables | `kind` where the table holds more than one kind |

Values: `tier` `1`-`4` (and `A`, `C` on `voa`; `A` on an equipment table
whose kind has an artifact record); `cls` `phy`/`mag`; `trait`
`agility`, `strength`, `finesse`, `instinct`, `presence`, `knowledge`; `range`
`melee`, `veryclose`, `close`, `far`, `veryfar`; `burden` `1`/`2`; `line`
`line`/`uniq`; `kind` `item`/`consumable`/`equip`; `src` one of the source keys;
`frame` `beast_feast`, `colossus`, `dark_heart`, `motherboard`; `comm` a
community name.

`other_frames` has four setting anchors, in order: `beast_feast`, `colossus`,
`dark_heart`, and `motherboard`. Each canonical frame record and any framed
starting item (`f95`, under Motherboard) appears once, under its own setting.
Unframed starting inventory is not part of this table - it is `other_starting`.

An empty group means "any", so an untouched filter contributes nothing and a
plain table link carries no `f_` part at all. Values inside a group are OR'd;
groups narrow each other.

A group a table does not offer is ignored, and the table stays whole. This is
silent, which is why the key names above are a contract: `f_rg-melee` on
`eq_weapon` does not filter by range, it does nothing.

## Records, lists and print

| Hash | Meaning |
|---|---|
| `#/i/<id>` | one record |
| `#/print/<id>[*<n>]-<id>[*<n>]-...` | a print sheet of those records, up to 180, each with an optional count |
| `#/lists/<listId>` | a locally stored list, by its local id |
| `#/l/<payload>` | a shared list, encoded in full (see `CONTRACTS.md`) |
| `#/l/~<payload>` | the same, deflate-compressed; expanded and rewritten to the plain form on open |

The payload after `l/` is read as written, whatever it contains - R5. A stray
character a chat client left behind (a truncated link's trailing full stop is
the reachable case) used to fail a stricter character class and fall to
`unknown`, sending the reader home; now it still reaches the shared-list page,
which draws its own "not found" state for a payload that will not decode
rather than silently leaving for a different page.

`#/print/...` reads its ids from the address rather than from memory, because
printing is reached from three places and the set has to survive a reload and
being handed to another GM.

An id may carry a count as `*<n>`, the list link's own `id*qty` spelling
(`CONTRACTS.md` section 3): `#/print/ci1*3-q1`. A count over 1 is shown after
the card's name, clamped to 99. A missing, `0`, `1` or unreadable count shows
no counter, and the card still prints. A repeated id keeps its first
occurrence and that occurrence's count. Only the list page's print button
writes counts; an address written without them reads as it always did.

## Fallback

An address that matches nothing readable - at boot or on navigation - is
replaced, via `replaceState`, so it does not accumulate in history, with the
pinned starting section, or `#/roll/std` if none is pinned. An address that
resolved to something is left alone, so a link someone shared still reads back
as they wrote it.

A bare address (`''`, `#` or `#/`) is a third case, and boot and navigation
answer it differently:

- At boot, it draws the pinned starting section and leaves the address bar as
  it found it - unless a section other than the default is pinned, in which
  case it navigates there instead (a real history entry, so Back leaves the
  bare address behind rather than returning to it).
- Any subsequent navigation to a bare address - away and back, or a typed
  `#/` - draws `#/roll/std` - the default, never the pinned section - and
  writes nothing to the bar.
