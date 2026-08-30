# Routes and hash grammar

Everything after `#` is the route. The app never asks a server for it, so the
grammar below is the whole router. Golden fixtures for these shapes are in
`docs/fixtures/urls/routes.json`; `tests/contracts.js` replays them.

The implementation is `currentRoute()` in `app.js`, plus `ROUTES`,
`LEGACY_ROUTES` and `TABLES_RE` beside it.

## Sections

| Hash | Section |
|---|---|
| `#/roll/std` | Core rules, the shared 1-60 Nd12 table for Core and Hope & Fear |
| `#/roll/alt` | Alternate tables, rarity plus Hope and Fear dice |
| `#/roll/wondrous` | Wondrous Loot, 1-119 |
| `#/roll/dread` | Dread GM Toolbox, 1-29 |
| `#/roll/voa` | Vault of Ages, by section |
| `#/roll/community` | Community items, community plus 1-10 |
| `#/tables` | Tables index |
| `#/lists` | Lists index |
| `#/search` | Search |

These nine are also the tab bar (`TAB_LIST`) and the nine a person may pin as
their starting section.

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

Table names (`TABLE_DEFS`): `core_item`, `core_consumable`, `hnf_item`,
`hnf_consumable`, `wondrous`, `community`, `dread`, `voa`, `frames`, `alt_item`,
`alt_consumable`, `eq_weapon`, `eq_secondary`, `eq_armor`.

A name that is not in that list is ignored and the table already on screen is
kept. Changing to a different table folds the filter panel and clears the
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
and every piece looks like a group; anything else is treated as the current
format.

Group keys, by table:

| Table | Groups |
|---|---|
| `eq_weapon` | `tier`, `src`, `cls`, `trait`, `range`, `burden`, `line` |
| `eq_secondary` | `tier`, `src`, `cls`, `trait`, `range`, `line` |
| `eq_armor` | `tier`, `src`, `line` |
| `voa` | `kind`, `tier` |
| `frames` | `kind`, `frame` |
| `community` | `comm` |
| `core_item` and the other loot tables | `kind` where the table holds more than one kind |

Values: `tier` `1`-`4` (and `A`, `C` on `voa`); `cls` `phy`/`mag`; `trait`
`agility`, `strength`, `finesse`, `instinct`, `presence`, `knowledge`; `range`
`melee`, `veryclose`, `close`, `far`, `veryfar`; `burden` `1`/`2`; `line`
`line`/`uniq`; `kind` `item`/`consumable`/`equip`; `src` one of the source keys;
`frame` `beast_feast`, `colossus`, `dark_heart`, `motherboard`; `comm` a
community name.

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
| `#/print/<id>-<id>-...` | a print sheet of those records, up to 180 |
| `#/lists/<listId>` | a locally stored list, by its local id |
| `#/l/<payload>` | a shared list, encoded in full (see `CONTRACTS.md`) |
| `#/l/~<payload>` | the same, deflate-compressed; expanded and rewritten to the plain form on open |

`#/print/...` reads its ids from the address rather than from memory, because
printing is reached from three places and the set has to survive a reload and
being handed to another GM.

## Fallback

An address that matches nothing readable is replaced - via `replaceState`, so
it does not accumulate in history - with the pinned starting section, or
`#/roll/std`. An address that resolved to something is left alone, so a link
someone shared still reads back as they wrote it.
