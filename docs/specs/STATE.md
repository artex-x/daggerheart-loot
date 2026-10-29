# State: what lives where

Four places, and the boundary between them is a product decision rather than an
implementation detail. A fifth holds one short-lived record.

| Where | Holds | Survives a reload |
|---|---|---|
| URL path | anything shareable: route, table, anchor, filters, a share link's token, what to print, the language and a card's `?v` (`ROUTES.md`, "Path form"); an old `#/` fragment is read once and written back as the path | yes, and travels to other people |
| `localStorage` | preferences, and the session of the signed-in account | yes, on this browser only; kept under storage pressure in the installed app (`META.md` section 9) |
| The account (signed in only) | the language, starting section, tables view and print layout (`user_prefs`); the account lists with their entries (`lists`, `list_entries`) | yes, on every device signed in to the account |
| `sessionStorage` | `dhloot.auth.return`: where a provider redirect comes back to, and the action a sign-in prompt started | this tab only, honoured for 10 minutes and removed when read |
| Memory (`S`) | everything else | no |

**The rule: how a page looks is remembered, what was asked on it is not.** A
filter carried in from yesterday is a state nobody remembers, and the page just
looks broken. The language and the starting section describe the app's
behaviour, so they persist. The table view and the print layout persist as
defaults set on `#/account`; a switch on the tables or print page changes
them for this visit only, until a reload. A roll, a search, a rarity, a
ticked row and an open help panel start over.

Do not persist filters, search text or selections, a selection's taken counts
included. Filters are shared by link instead - that is what the `f_` segment
is for.

## The site's origin

`localStorage` and `sessionStorage` belong to one origin. The site moved from
`https://artex-x.github.io` to `https://daggerheart-loot.pages.dev` (task
`cloudflare-pages`, 2026-10-28): every key stays on the old origin, nothing is
deleted, and the new origin starts empty. The old host's forwarding page reads
`dhloot.lang.v1` there and opens `<site>en/` when it is `en`, which seeds the
language on the new origin; no other key follows. A signed-in reader signs in
once more, and the account restores `user_prefs`. The forwarding page writes
`dhloot.moved.at` (the time of its last forward) to the old origin's
`sessionStorage` and stops at a second forward in the same tab within 10 s
(`META.md` section 9, "The old host"). A revert of R10 after the move reads the
new origin's storage; it reaches R10's kept browser-list keys only together
with a revert of the move.

## localStorage keys

| Key | Holds |
|---|---|
| `dhloot.lang.v1` | `ru` or `en`. Also written, as `en` and only when absent, by the old host's English redirect page (`i/en/<id>.html`, `en/index.html`) before it opens the site, and by the app at an `/en/` or `/i/en/` address (`docs/specs/I18N.md`) |
| `dhloot.home.v1` | the pinned starting section, as a full hash - a section, a named table (`#/tables/<table>`), or `#/homebrew` («Мои предметы», one pin for its four tabs; a build with no sign-in draws the not-found page for it, as for `#/tables/homebrew`); reading also accepts a bare `#/tables` from an older pin, but the app itself always writes the named form. A stored `#/tables/frames` (the legacy alias, `hash.ts` `TABLE_ALIASES`) normalises to `#/tables/other_frames` on read only, with no write-back; the home control compares the active route against the canonical path, and the next explicit save writes the canonical id (`app.svelte.ts` `pinOf`). A stored old id of a renamed section or table (`#/roll/dread`, `#/tables/dv/...`; `ROUTES.md`, "URL ids and old ids") reads as its URL id, with the rest of the hash kept (`hash.ts` `canonicalHash`); signed in, `#applyPrefs` writes that URL id to `dhloot.home.v1`, and the next account save writes it to `user_prefs.home`. The pin button compares and stores the URL id, so it reads pressed on an old address of the pinned page. The legacy `#/roll/core`, `#/roll/hnf` and `#/roll/all` stay as written. |
| `dhloot.prefs.v1` | the defaults `{ view: 'list' \| 'grid', printBw: boolean, printCompact: boolean }`, written whole by the Display section and the account's answer, never by a page switch; read at boot for every reader; live's old `{ view }` still reads (a missing field is `list`/`false`) |
| `sb-<ref>-auth-token` | the signed-in session (`<ref>` is the Supabase project). A provider redirect also writes its PKCE verifier three ways (auth-js 2.117.1): `sb-<ref>-auth-token-flow-<id>-code-verifier` per flow, the index `sb-<ref>-auth-token-flows-code-verifier` (a ring of five flows, the oldest evicted), and `sb-<ref>-auth-token-code-verifier`, the latest flow's copy. The return's code exchange reads and removes only that last key (the callback address carries no flow id), so the per-flow key and the index stay until sign-out or deletion ends the session. Written and removed by auth-js 2.117.1 under the key that `ports/supabase.ts` names by supabase-js's rule (`sb-<first host label>-auth-token`); never by the app's own code |

Left in the browser: the five list keys an older build wrote - `dhloot.lists.v1`,
`dhloot.lists.v2`, `dhloot.lists.v2.bad`, `dhloot.migrated.v1` and `dhloot.warn.v1` - stay
where the last build wrote them. Since R10 the app reads, writes and deletes none of them,
and `dhloot.probe` is not written.

`dhloot.auth.return` (`sessionStorage`) is `{ hash, at, kind, provider,
action? }`, written just before sign-in or Connect leaves for the provider
(`app/src/ports/redirect.ts`). Every address in storage is a route key
(`#/...`), never a path. The provider always returns to the app root,
`<site>?auth-callback=1`, the one form `supabase/config.toml` allows, and the
page then appends `hash`, which the router reads as an old address and writes
as its path. `hash` is the page the reader left, or - when
a sign-in prompt's «Войти» led to `#/account` - the prompt's page, and
`action` the action it started (`app/src/lib/pending.ts`: reopen the
add-to-list menu with its rows and taken counts - the `name` key an older build
wrote is read past, as any unknown key - save the open
share link's list (`#/s/`), save a copy of a homebrew item or a catalog
record (`saveItem`, the item's uuid as `hid` or the record's id as `id`), or make a print set of the entries the press built
(`print`, with the count cut past 180, so the sign-in ends with the same
cut toast a signed-in press shows)). The print set reads each item live at
its open, so an item edited meanwhile prints as it is now and one deleted
meanwhile is counted missing. The page that comes back reads and removes it before mount and
returns to `hash` only when every field is one the app could have written - a
`#/` route under 16384 characters (`#/l/` links with notes passed 2048 before R10),
`at` within 10 minutes, a known `kind` and provider; otherwise it opens
`#/account`. An `action` that fails its own check is dropped and the rest is
kept.

Every read is defensive: a value that does not parse, or does not pass its own
validity check, is replaced by the default and the rest is kept. Broken JSON is
ignored whole. Storage that throws (private mode, disabled) must not break the
app - it runs on its defaults.

## Two tabs

Account lists do not ride the `storage` event: every tab and device reads the
account again on a message of the owner's Realtime topic from another tab or
device, when it is shown again, every 45 s while Realtime is not joined and
the index or an account list's page is open, and every 5 minutes on any route
while the owner's topic is joined, always once no write is buffered or in
flight. A shared page `#/s/<token>` reads its list again on a message of its
share's topic, when it is shown again, every 45 s while that topic is not
joined and every 5 minutes while it is, signed in or not. An item page
`#/h/<uuid>` has no topic: it reads its item again every 45 s and when it is
shown again, signed in or not, and drops an older answer that arrives after a
newer one. A read keeps each list
whose `updated_at` has not moved as the same object, so a read that finds
nothing new redraws nothing, and an edit replaces only the list it changes.

Signed out, a tab follows another tab's settings: on a `storage` event for
`dhloot.lang.v1`, `dhloot.home.v1` or `dhloot.prefs.v1`, and when it is shown
again (`visibilitychange` to visible and `pageshow`, a signal that names no key,
as `localStorage.clear()` does), it reads the three keys as the boot reads them (a bad
value reads as the boot's fallback) and applies a changed value at once,
with no reload and no write back. Signed in, the account row decides.

## Account preferences

Signed in, the language, starting section, tables view and print layout
follow the account (`user_prefs`, one row per user: `{ lang, home, view,
printBw, printCompact, notifyGm }`; `app/src/lib/prefs.ts` reads it as
untrusted data, the same as `dhloot.prefs.v1`). There is no sync indicator.
The header RU/EN switch and the Display section's language row write one
setting, and so do the pin and the starting-section select.

- **Defaults and a page's pick.** The tables view and the print layout each
  have a default and, for this visit, an optional page value (`AppState`).
  The default is read at boot from `dhloot.prefs.v1`, replaced by the
  account's answer (signed out, by another tab's `dhloot.prefs.v1`), and set
  by the Display section of `#/account` (`FEATURES.md`, "Account"); nothing
  else writes it. A page switch sets
  the page value in memory only: no storage write, no account save. A page
  draws its page value when set, else the default. A Display change sets
  the default and drops the page value; the account's answer, and signed out
  another tab's write, moves the default and keeps a page value. A signed-out reader keeps the default
  `dhloot.prefs.v1` already holds and cannot change it.

- **`notifyGm`** (`ask`, `always` or `never`), the remembered answer of
  flow b - the Display row «Добавление из чужого списка» / "Adding from
  someone else's list" (`FEATURES.md`, "Account") - lives in the row only:
  no local key. A row without it reads as `ask`; it is `ask` signed out and
  before a new user's row is pulled, so one user's answer never seeds
  another's row.
- **A purchase request leaves nothing in the browser.** The request id a
  send makes lives in memory: before a success so that a second press after
  a send with no answer is a replay, and after it, the newest 20 ids this
  page load sent, with the owner's decision of the one the sent mark holds,
  so the share topic's decision message toasts in that tab only. No key of
  `localStorage` or `sessionStorage` holds a request, its id or its status;
  a reload forgets them (`FEATURES.md`, "Purchase requests: the send").

- **First paint is local.** The page draws this browser's values, then
  switches once the account answers - a new device may flip its language or
  view a moment after load.
- **The account wins.** A row applies each field it holds and saves nothing
  back; the values are written to their local keys too. A `home` the pin
  check refuses is ignored, not reset, and applying never navigates.
- **A first sign-in seeds the account.** An account with no row gets this
  browser's five values and `notifyGm: 'ask'`. A read that fails applies and saves nothing, so it
  cannot pass as an empty account and be seeded over.
- **Local first, then the account.** Every change of the language, the
  starting section, a default or `notifyGm` is written to its local key
  (`notifyGm` has none), then, signed in, the whole object replaces the
  row. A change made while the account's answer is pending wins over that
  answer.
- **Refetched when shown again.** The storage port's key-less signal (the
  tab shown again, a back-forward-cache restore) pulls the row again; after a
  refused save it saves instead, so a change made offline is not overwritten
  by the old row. Two open tabs of one browser do not sync a preference
  between them; each reads storage at boot.
- **Sign-out clears nothing local**; signing in as another user pulls that
  user's row. Deleting the account deletes the row with it.

## The in-memory state object

`S` in the live app (`app.js`, deleted at R0c - read it at `git show
23c00a6^:app.js`). The rewrite has no single `S` object: each group below
lives in its own store or page component (`AppState` in
`app/src/state/app.svelte.ts`, plus per-page `$state` in the components that
own a group). The grouping below is still the useful map of what memory-only
state exists, by what it was for:

| Group | Fields |
|---|---|
| Session | `lang`, `route`, `user` (the signed-in session: unknown, none, or who), the tab id sent as `x-dhloot-tab` (one per page load, in the cloud port), the owner feed's and the share feed's states (`off`, `connecting`, `live`, `down`), `alreadyLinked` (the provider a Connect was refused for), `signInFor` (the page and action a sign-in prompt's «Войти» remembered, forgotten on leaving `#/account`), the pending action (forgotten on a navigation and on sign-out), `now` (the clock the relative times read, moved every 45 s and when the tab is shown again), `cloning` (true while «Сохранить себе» copies a share link's list), `savingItem` (the uuid of the item or the id of the catalog record «Сохранить себе» copies now), `saveItemFor` (the uuid of the item or the id of the catalog record a sign-in left to copy, until its pick row makes the copy; forgotten with the pending action), and the key of a «Сохранить себе» press whose answer was lost, per user and source, in memory only and never stored (the purchase request's pattern; FEATURES.md, "Records"), `requestsFocus` (the list whose requests panel head takes the focus once drawn, set by the new-request toast's button, cleared by the panel or by leaving that list), and the new-request toast's list ids while it shows, waits or is held for a hidden tab (dropped when it ends or a later toast replaces it, unless held for a hidden tab, and on sign-out; FEATURES.md, "Purchase requests: the owner") |
| Roll inputs | `std {n, src{core,hnf}}`, `alt {rarity, hope, fear}`, `wond {n}`, `dread {n}`, `voa {k, n}`, `dv {n}`, `arazo {n}`, `comm {c, n}`, `mwt {r, n}` |
| Tables | `tables {t, q, view, anchor}`, `search {q}`, the tables view a page switch picked for this visit (`AppState`) |
| Filters | `kind {item,consumable,equip}`, `fOn`, `fOpen`, `fSeg`, `homebrewShown` (the «Свои предметы» switch on search and the equipment tables: memory only, on by default, kept across pages, on again at each sign-in, never in the address or storage); on the shared list page, the query, the fold of the panel, whether the search box and the strip are drawn (the picked values are the address); the open folds of the filter rows of more than 12 values (page memory of the strip, closed when it mounts); the source chips' fold of `#/tables/homebrew` (page memory, closed when the page mounts) |
| Lists | `cloudLists` (the account lists: each list's head, and its entries' details with a read state per list once a page needed them; their read status, the write buffer and its save status, each list's linked items of other accounts as the last `items()` read answered them, and what each removed entry was written as, for its undo, forgotten on sign-out), `sharedView` (the open share link's list, its read status and whether the reader owns it), `itemView` (the open `#/h/` item, its related items, its read status and whether the reader is its author: page memory, forgotten when the page goes), `lsel`, `picked` (the own list's taken counts), `listDraft`, `listRoll`, `newListFor`, `newListDraft`, `pickQ`, `shared {ids, meta}`, `listsShown` (how many cards the index draws, kept for the session); the index's ticked account lists (page memory, pruned to the drawn cards, empty on every visit) and the import field's file, preview and rows (page memory, forgotten when the field folds); the request sender's sent lines (memory, until the ticks change or clear); the owner's hidden decided requests (page load); the owner's change-log notices (memory, read with the requests; the list page's panel reads its own list's notices whole) and the «новое» marks of the notices that were unread when the page first held them (page memory) |
| Homebrew | `homebrew` (the signed-in author's items, sources and cards, their read status and item limit: memory only, read on sign-in and cleared on sign-out; another tab's or device's write arrives as the owner topic's `homebrew` event and reads them again), the editor's draft, the draft it loaded, its revision and its problems (page memory: a remount starts from the store), the one leave check and the one unload check a dirty editor or a changed card form on the Sets or Rules tab registers (`AppState`, `PagePort`); the import panel's file, its preview, its «Куда» choices, skip or update, the open name lines and the ids of its rows, kept across a tab switch of «Мои предметы», and the move panel's chosen source and section (page memory: a remount starts empty); the Items, Sources, Sets and Rules queries, the open card folds and the open folds of a source's sections and a card's members (page memory: each query starts empty when its tab opens; a tab's address key opens its card's fold once); the Items tab's filter - its picked values and whether its panel is open (page memory, empty each time the tab opens, never in the address) |
| Prices | `rp`, `guess`, `moneyHelp` |
| Print | the print set's read (`PrintPage`), the print layout a page switch picked for this visit (`AppState`) |
| UI | `sel` (cleared on every navigation, except one between two `homebrew` routes, the «Мои предметы» tabs, and one between two `#/tables/homebrew` addresses, a source chip press; on a shared page, pruned to the drawn list; on the Items tab, pruned to the rows the search and the filter draw), `picked` (the shared page's taken counts, cleared with `sel`), `modal`, `menuFor`, `help`, `keepOpen`, `menuOpen` (the header's account menu, in `Shell`, closed on a navigation and a user change) |

`fSeg` is the filter segment already read back from the address. Reading the
address on every render froze the filter at whatever the link said: the panel
could not be folded and a chip clicked itself straight back. Whatever replaces
this has the same problem to solve.

Nothing of homebrew goes to `localStorage` or `sessionStorage`: the items live
in the account, and the editor's draft lives as long as its page. So does
its picture choice: a chosen file (the browser's reference to it, kept for
«Обрезать заново»), the cropped files and their preview addresses, a picked
picture or a removal live in page memory only, never in the address,
`localStorage` or a draft; a reload loses them, and the guard asks first.
The crop dialog holds the decoded picture while it is open and frees it when
it closes. A list entry
links another account's item by its id; the item lives in that account, and in
memory only as the last read of the list's linked items answered it; the «Свой предмет» panel's fields are page memory.

`keepOpen` holds what the person folded or unfolded by hand, so a redraw does
not undo it.

Svelte does not remount a page component between two addresses of the same
route kind: `App.svelte`'s `{#if}/{:else if}` chain tears a branch down only
when the *matched branch itself* changes, not on every address change within
it - so `TablesPage`'s own `$state` survives a move between two `tables`
addresses. Any design reasoning about state lifecycle across a route change
has to check which branch changed, not the address string.
