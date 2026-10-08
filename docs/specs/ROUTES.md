# Routes and hash grammar

Everything after `#` is the route. The app never asks a server for it, so the
grammar below is the whole router. Golden fixtures for these shapes are in
`docs/fixtures/urls/routes.json`; `app/src/lib/hash.test.ts` (the parser)
and `tests/app/contracts.js` (the built app) replay them.

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
| `#/roll/arazo` | Arazo's Artifacts, 1-78 |
| `#/roll/community` | Community items, community plus 1-10 |
| `#/tables` | Tables index |
| `#/lists` | Lists index |
| `#/search` | Search |

These eleven are also the tab bar (`SECTIONS`) and the eleven a person may pin as
their starting section - ten pin as their own hash; `#/tables` pins as
whichever table is on screen (`#/tables/<table>`), never as the bare tab
address itself. See `STATE.md`, `dhloot.home.v1`, for what a pin actually
stores and reads back.

From the legacy write cutoff (2026-10-26) a build with sign-in draws ten
of them in the tab bar, without `#/lists`; `#/lists` stays a section route,
reached from the account menu's «Мои списки», a bookmark or a pin
(`FEATURES.md`, "Chrome").

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
`hnf_consumable`, `wondrous`, `community`, `dread`, `voa`, `dv`, `arazo`, `other_starting`, `other_frames`, `alt_item`,
`alt_consumable`, `eq_weapon`, `eq_secondary`, `eq_armor`, `homebrew`.

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
| `homebrew` | `kind`, `src` (one value: the source chip), `sect` |
| `core_item` and the other loot tables | `kind` where the table holds more than one kind |
| `#/s/<token>` | `kind`, `src`, `tier`, `cls`, `trait`, `range`, `burden`, `line` |

Values: `tier` `1`-`4` (and `A`, `C` on `voa`; `A` on an equipment table
whose kind has an artifact record); `cls` `phy`/`mag`; `trait`
`agility`, `strength`, `finesse`, `instinct`, `presence`, `knowledge`; `range`
`melee`, `veryclose`, `close`, `far`, `veryfar`; `burden` `1`/`2`; `line`
`line`/`uniq`; `kind` `item`/`consumable`/`equip`; `src` one of the source keys;
`frame` `beast_feast`, `colossus`, `dark_heart`, `motherboard`; `comm` a
community name. On `homebrew` and the equipment tables `src` also takes `hb`
(own items with no source) and an own source's key; `sect` takes an own
section's key. Such a value lives in one account: on the equipment tables
another account's key narrows to nothing, as any unknown value does.

A filter panel offers only the values the drawn rows answer (`FEATURES.md`, "Tables and
search"); the address is read as above: a picked value no drawn row answers still narrows a
table to nothing, and draws its pill where the panel lists the value.

On a share link (`#/s/<token>`, below) `kind` takes `item`, `consumable`,
`weapon`, `secondary` and `armor` where a table takes `equip`: a list mixes the
gear the equipment tables split. `src` also takes `community`, `hb` and an own
or linked source's key; `tier` is the equipment tier (`1`-`4`, `A`), never a
Vault of Ages section. A share link offers only the values the entries it draws
answer. One departure from a table: a value no drawn entry answers draws no pill
and narrows nothing, where a table empties. The address keeps such a value until
the next change of the filter, which writes only the values in force, and it
applies again if an entry that answers it comes back before that change. The
copied filter link holds only the values in force, so it can differ from the
address bar.

On `homebrew`, `src` holds one value and picks the source chip ("Homebrew"
below): it is not a facet, and values of two sources do not combine there.
With two or more sources a second `src` value, a value that names no held
source, and a `sect` value that is not a section of the chosen source are
dropped, and the address is
rewritten once; with one source the `src` value is ignored and the address
kept.

`other_frames` has four setting anchors, in order: `beast_feast`, `colossus`,
`dark_heart`, and `motherboard`. Each canonical frame record and any framed
starting item (`f95`, under Motherboard) appears once, under its own setting.
Unframed starting inventory is not part of this table - it is `other_starting`.

An empty group means "any", so an untouched filter contributes nothing and a
plain table link carries no `f_` part at all. Values inside a group are OR'd
(except `src` on `homebrew`, above); groups narrow each other.

A group a table does not offer is ignored, and the table stays whole. This is
silent, which is why the key names above are a contract: `f_rg-melee` on
`eq_weapon` does not filter by range, it does nothing.

## Records, lists and print

| Hash | Meaning |
|---|---|
| `#/i/<id>` | one record |
| `#/print/<id>[*<n>]-<id>[*<n>]-...` | a print sheet of those records, up to 180, each with an optional count |
| `#/lists/<listId>` | a browser list, by its local id, or an account list, by its UUID (an account list's address is never rewritten to `#/l/`; a browser list's is not either after 2026-10-26, nor while the move into the account is due); the local id of a list that moved into the account opens that account list |
| `#/h/<uuid>` | one homebrew item by its id, for everyone, signed out too, with the author's relation lines; the id is read as the leading run of `[0-9A-Fa-f-]`, lowercased (a stray character after it is dropped, the address kept); only a uuid is read; a malformed or unknown id, or a build with no sign-in configured, draws the record page's not-found page, never home |
| `#/s/<token>` | an account list shared by its owner, read-only, with an optional filter (below); the token is read as the leading run of `[A-Za-z0-9_-]` (a stray character after it is dropped, the address kept); a stopped, deleted, unknown or empty token draws one "no longer available" page, never home; with no sign-in configured that page too |
| `#/l/<payload>` | a shared list, encoded in full (see `CONTRACTS.md`), until 2026-10-26 (`LEGACY_WRITE_UNTIL`); from then, in a build with sign-in configured, the retired page, the address kept and the payload never decoded |
| `#/l/~<payload>` | the same, deflate-compressed; expanded and rewritten to the plain form on open, until 2026-10-26 (`LEGACY_WRITE_UNTIL`); from then the retired page, never unpacked |

```
#/s/<token>
#/s/<token>/f_<filter>
```

The token is read as above. `<filter>` is the "Filter grammar" with the share
link's groups, read and written as on a table: a pick rewrites the address in
place, and a filter link opens the panel. When `/f_` does not follow the token,
anything after it is dropped and the address kept; a stray character after the
segment is dropped the same way. A build before the filter reads the token and
ignores the segment, so a filter link opens the whole list there. `#/l/` carries
no segment: its payload is read as written, so a segment would become part of
the payload and every earlier bundle would draw the bad-link page; its filter
is page memory.

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
and the shared page's selection bar (the taken counts) write counts; an
address written without them reads as it always did.

## Account

| Hash | Meaning |
|---|---|
| `#/account` | the account page: sign in, connected providers, sign out, delete the account |

Exactly `#/account`; `#/account/x` and `#/accounts` are unreadable
addresses (`Fallback` below). The route is read in every build. A build
with no sign-in configured draws the not-found page there, keeps the
address as it is, and never sends it home (`FEATURES.md`, "Account").

A provider's sign-in or linking redirect returns to
`?auth-callback=1` on the page, with a `code` or the error parameters. That
query is read and removed before the app mounts, and the address is put
back to the page the reader left (`#/account` when none was recorded), so
the router never sees it (`STATE.md`, `dhloot.auth.return`).

## Homebrew

| Hash | Meaning |
|---|---|
| `#/homebrew` | «Мои предметы», the Items tab: the signed-in author's own items |
| `#/homebrew/sources` | the Sources tab: the sources and their sections |
| `#/homebrew/sets`, `#/homebrew/sets/<key>` | the Sets tab; with a key, that set's fold open and scrolled to |
| `#/homebrew/rules`, `#/homebrew/rules/<key>` | the Rules tab; with a key, that rule card's fold open and scrolled to |
| `#/homebrew/new` | the editor of a new own item |
| `#/homebrew/<key>` | the editor of one own item; `<key>` is `hb_` and 16 of `a-z2-7` |

Exactly these seven shapes; `#/homebrew/`, `#/homebrew/items`,
`#/homebrew/pistols`, `#/homebrew/sources/<key>`, `#/homebrew/sets/<not a
key>` and any other key are unreadable addresses (`Fallback` below). A
well-formed key the account does not hold, or a key of the other card kind,
draws the tab with nothing open and keeps the address. The routes are read
in every build, as `#/account` is: signed out they draw the sign-in prompt,
and a build with no sign-in configured draws the not-found page and keeps
the address. No tab reads current on them, and a pin may not hold them.

`#/tables/homebrew` is the signed-in author's own items as a table. It is read
in every build: signed out it draws the sign-in prompt, and a build with no
sign-in configured draws the not-found page and keeps the address. Its group
chip is drawn signed in only. Its anchors are a section's key (that
section's items), a source's key (the source's items outside its sections;
none when every item sits in a section), `hb` (the items with no source) or
an item's key. A pin may hold it.

With own items in two or more sources the table draws one source chip per
source under the group chip, «Хоумбрю» last, and shows one source at a time.
A chip is `#/tables/homebrew/f_src-<key>` (`f_src-hb` for «Хоумбрю»): `src`
on this table holds one value and picks the source chip. The chosen chip is
the first `src` value that names a held source; else the source of the
anchor; else the source of the first `sect` value; else the first chip. A
bare address and an anchor are kept as written; an address with a second
`src` value, a `src` that names nothing held, or a `sect` value that is not
a section of the chosen source is rewritten once to the chosen chip.

An own item opens at `#/i/<key>` for its author only: any other reader,
signed out included, gets «Предмет не найден». A key lives in one account,
so an agent cannot build one (`FEATURES.md`, "Homebrew").

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
