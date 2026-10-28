# Routes and address grammar

The address is a path: `/tables/eq_weapon` on the site's host. The grammar
below names each route by its route key, the `#/...` string the app parses,
builds and stores; "Path form" says how a key and a path convert. The host
answers every route path with the app, so the grammar below is the whole
router. Golden fixtures for these shapes are in
`docs/fixtures/urls/routes.json` and `docs/fixtures/urls/paths.json`;
`app/src/lib/hash.test.ts` and `app/src/lib/address.test.ts` (the parser and
the conversion) and `tests/app/contracts.js` (the built app) replay them.

The implementation is `parseHash()` in `app/src/lib/hash.ts`, plus
`TABLES_RE`, `legacySource()` and `TABLE_ALIASES` beside it, and `pathOf()`
and `addressOf()` in `app/src/lib/address.ts`.

## Path form

A route key `#/<rest>` is the path `/<rest>` in Russian and `/en/<rest>` in
English, for example `/tables/eq_weapon` and `/en/tables/eq_weapon`, `/lists`,
`/account` and `/homebrew`. A record keeps the English form of its card,
`/i/en/<id>`; `/en/i/<id>` is not written and the host answers it with a 301
to `/i/en/<id>`. The bare key is `/` or `/en/`; `/index.html` and
`/en/index.html` read as the bare key. One trailing `/` is dropped where the
path without it parses and the path with it does not (`/roll/std/` reads as
`/roll/std`; `/s/` keeps its slash and its not-found page).

The address bar and every in-app link show the path form, in the language on
screen; the app's router writes it with `pushState` for a step and
`replaceState` for a filter pick (`app/src/ports/router.ts`). A stored
language wins over the address's (`I18N.md`). A record, an item (`/h/`) and a
share link (`/s/`) carry the card version `?v=<v>` in the bar
(`CONTRACTS.md` section 5); a navigation drops it.

The old form `#/<rest>` after any path keeps working: a fragment that starts
with `#/` wins over the path, its language comes from an English root path
(`/en/#/...`, else none), and the app writes the path form in the same history
entry at boot, and on a typed or pasted fragment (owner, 2026-10-28). A
fragment that does not start with `#/` (`#main`) is not an address.

## Sections

| Hash | Section |
|---|---|
| `#/roll/std` | Core rules, the shared 1-60 Nd12 table for Core and Hope & Fear |
| `#/roll/alt` | Alternate tables, rarity plus Hope and Fear dice |
| `#/roll/wondrous_environments` | Wondrous Environments, 1-119 |
| `#/roll/dread_gm_toolbox` | Dread GM Toolbox, 1-29 |
| `#/roll/vault_of_ages` | Vault of Ages, by section |
| `#/roll/dragons_vault` | The Dragon's Vault, 1-145 |
| `#/roll/arazos_artifacts` | Arazo's Artifacts, 1-78 |
| `#/roll/community_items` | Community items, community plus 1-10 |
| `#/roll/many_worlds_tavern` | Many Worlds Tavern, realm plus a roll inside it (1-11 to 1-21) |
| `#/tables` | Tables index |
| `#/lists` | Lists index |
| `#/search` | Search |

These twelve (`SECTIONS`) are what a person may pin as their starting
section - eleven pin as their own hash; `#/tables` pins as
whichever table is on screen (`#/tables/<table>`), never as the bare tab
address itself. See `STATE.md`, `dhloot.home.v1`, for what a pin actually
stores and reads back.

## URL ids and old ids

The seven supplement sections and nine tables have a URL id from the name of
their source product (owner, 2026-10-21;
`docs/decisions/2026-10-21-source-names-follow-the-source-product.md`); the
app writes it (`hash.ts` `SECTION_SLUG`, `TABLE_SLUG`). The internal id is the
old address: `roll/wondrous`, `roll/dread`, `roll/voa`, `roll/dv`,
`roll/arazo`, `roll/community`, `roll/mwt`, and the tables `hnf_item` ->
`hope_and_fear_item`, `hnf_consumable` -> `hope_and_fear_consumable`,
`wondrous` -> `wondrous_environments`, `dread` -> `dread_gm_toolbox`, `voa` ->
`vault_of_ages`, `dv` -> `dragons_vault`, `arazo` -> `arazos_artifacts`,
`community` -> `community_items`, `mwt` -> `many_worlds_tavern`.
An old id still opens the same page, with its anchor or filter tail; the
address is not rewritten. Filter values (`f_src-dread`) keep the internal keys.

The tab bar draws five tabs over them in every build: Core rules, the alternate
tables, one «Дополнения» / "Supplements" tab for the seven supplement sections
(`roll/wondrous_environments` to `roll/many_worlds_tavern`, `app/src/lib/nav.ts`),
Tables and Search. The supplements tab links to
`#/roll/wondrous_environments`; every supplement address stays its
own section (`FEATURES.md`, "Chrome"). `#/lists` has no tab: it stays a section
route, reached from the account menu's «Мои списки», a bookmark or a pin. A build
with no sign-in configured draws the not-found page for it, the address kept.

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

Table names in an address: `core_item`, `core_consumable`, `hope_and_fear_item`,
`hope_and_fear_consumable`, `wondrous_environments`, `community_items`,
`dread_gm_toolbox`, `vault_of_ages`, `dragons_vault`, `arazos_artifacts`,
`many_worlds_tavern`, `other_starting`, `other_frames`, `alt_item`,
`alt_consumable`, `eq_weapon`, `eq_secondary`, `eq_armor`, `homebrew`. The
internal ids (`TABLE_IDS`) still parse ("URL ids and old ids" above). The
tables below name a table by its internal id.

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
as `rare` on `alt_item`, `Seaborne` on `community` or `warrens` on `mwt`.

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
| `mwt` | `kind`, `realm` |
| `homebrew` | `kind`, `src` (one value: the source chip), `sect` |
| `core_item` and the other loot tables | `kind` where the table holds more than one kind |
| `#/s/<token>` | `kind`, `src`, `tier`, `cls`, `trait`, `range`, `burden`, `line` |

Values: `tier` `1`-`4` (and `A`, `C` on `voa`; `A` on an equipment table
whose kind has an artifact record); `cls` `phy`/`mag`; `trait`
`agility`, `strength`, `finesse`, `instinct`, `presence`, `knowledge`; `range`
`melee`, `veryclose`, `close`, `far`, `veryfar`; `burden` `1`/`2`; `line`
`line`/`uniq`; `kind` `item`/`consumable`/`equip`; `src` one of the source keys;
`frame` `beast_feast`, `colossus`, `dark_heart`, `motherboard`; `comm` a
community name; `realm` `sporopolis`, `wagerwood`, `warrens`, `godsvale`, `hornet`, `drome`. A
weapon of trait `any` answers every `trait` value, as a `spellcast` one does;
`any` is no value of its own. On `homebrew` and the equipment tables `src` also takes `hb`
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
| `#/p/<id>` | a stored print set, for a signed-in reader; the id is read as the leading run of `[A-Za-z0-9_-]` (a stray character after it is dropped, the address kept), and only a 12-character run is read; a malformed id (any other length) draws the "set not found" print page, signed in or out, with no read; a 12-character id signed out draws the print page's sign-in state; an unknown or expired id draws the "set not found" print page; a build with no sign-in configured draws the not-found page; the address is kept in every case, never home. `#/p` with no slash is an unreadable address |
| `#/print/<anything>` | retired on 2026-10-08 (owner): the retired print page, in every build, the address kept, nothing read from it; `#/print` with no slash is an unreadable address |
| `#/lists/<listId>` | an account list, by its UUID; its address is never rewritten; any other id, a local id an older build made among them, draws the list page's not-found state; a build with no sign-in configured draws the not-found page, the address kept |
| `#/h/<uuid>` | one homebrew item by its id, for everyone, signed out too, with the author's relation lines; the id is read as the leading run of `[0-9A-Fa-f-]`, lowercased (a stray character after it is dropped, the address kept); only a uuid is read; a malformed or unknown id, or a build with no sign-in configured, draws the record page's not-found page, never home |
| `#/s/<token>` | an account list shared by its owner, read-only, with an optional filter (below); the token is read as the leading run of `[A-Za-z0-9_-]` (a stray character after it is dropped, the address kept); a stopped, deleted, unknown or empty token draws one "no longer available" page, never home; with no sign-in configured that page too |
| `#/l/...` | an old list link, retired on 2026-10-26: the not-found page in every build, the address kept, the payload never read |

```
#/s/<token>
#/s/<token>/f_<filter>
```

The token is read as above. `<filter>` is the "Filter grammar" with the share
link's groups, read and written as on a table: a pick rewrites the address in
place, and a filter link opens the panel. When `/f_` does not follow the token,
anything after it is dropped and the address kept; a stray character after the
segment is dropped the same way. A build before the filter reads the token and
ignores the segment, so a filter link opens the whole list there.

A print set is stored in its maker's account, so the address does not grow with
its cards: `<site>#/p/` and 12 characters. The cards and their counts live in
the set (`FEATURES.md`, "Print"). The long print addresses `#/print/<ids>` were retired
on 2026-10-08 (`docs/decisions/2026-10-08-every-print-is-a-stored-set-long-print.md`).

The preview host's path grammar is `CONTRACTS.md` section 5: its paths
`/h/`, `/s/`, `/p/` and `/tables/` mirror these hashes without the `#`.

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
resolved to something keeps its route key, so a link someone shared still
reads back as they wrote it, in its path form.

A bare address (`/`, `/en/`, or an old `''`, `#` or `#/`) is a third case,
and boot and navigation answer it differently:

- At boot, it draws the pinned starting section and writes the bare path of
  the language on screen (`/` or `/en/`) - unless a section other than the
  default is pinned, in which case it navigates there instead (a real history
  entry, so Back leaves the bare address behind rather than returning to it).
- Any subsequent navigation to a bare address - away and back, or a typed
  `#/` - draws `#/roll/std` - the default, never the pinned section - and
  writes nothing to the bar.
