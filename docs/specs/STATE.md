# State: what lives where

Four places, and the boundary between them is a product decision rather than an
implementation detail. A fifth holds one short-lived record.

| Where | Holds | Survives a reload |
|---|---|---|
| URL hash | anything shareable: route, table, anchor, filters, the whole contents of a shared list, what to print | yes, and travels to other people |
| `localStorage` | preferences and the person's browser lists | yes, on this browser only; kept under storage pressure in the installed app (`META.md` section 9) |
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

## localStorage keys

| Key | Holds |
|---|---|
| `dhloot.lists.v2` | lists, with contents, per-entry meta and both notes |
| `dhloot.lists.v1` | the pre-split shape. Read once and migrated into v2, then **left untouched** so a rollback loses nothing. Never delete it. |
| `dhloot.lang.v1` | `ru` or `en`. Also written, as `en` and only when absent, by an English redirect page (`i/en/<id>.html`, `en/index.html`) before it opens the app (`docs/specs/I18N.md`) |
| `dhloot.home.v1` | the pinned starting section, as a full hash - a section, or a named table (`#/tables/<table>`); reading also accepts a bare `#/tables` from an older pin, but the app itself always writes the named form. A stored `#/tables/frames` (the legacy alias, `hash.ts` `TABLE_ALIASES`) normalises to `#/tables/other_frames` on read only, with no write-back; the home control compares the active route against the canonical path, and the next explicit save writes the canonical id (`app.svelte.ts` `pinOf`). |
| `dhloot.prefs.v1` | the defaults `{ view: 'list' \| 'grid', printBw: boolean, printCompact: boolean }`, written whole by the Display section and the account's answer, never by a page switch; read at boot for every reader; live's old `{ view }` still reads (a missing field is `list`/`false`) |
| `dhloot.warn.v1` | `'1'` once the storage warning has been dismissed |
| `dhloot.probe` | written and removed to test whether storage works at all |
| `sb-<ref>-auth-token` | the signed-in session (`<ref>` is the Supabase project). A provider redirect also writes its PKCE verifier three ways (supabase-js 2.117.1): `sb-<ref>-auth-token-flow-<id>-code-verifier` per flow, the index `sb-<ref>-auth-token-flows-code-verifier` (a ring of five flows, the oldest evicted), and `sb-<ref>-auth-token-code-verifier`, the latest flow's copy. The return's code exchange reads and removes only that last key (the callback address carries no flow id), so the per-flow key and the index stay until sign-out or deletion ends the session. Written and removed by supabase-js, never by the app |
| `dhloot.lists.v2.bad` | a `dhloot.lists.v2` value that would not parse, copied here once before this tab's own next write would otherwise silently overwrite it - what a newer build, a browser extension, or another page on the shared origin left behind, kept rather than lost (R1). The move into the account reads it (the notice names it) and never writes or deletes it |
| `dhloot.migrated.v1` | the move of browser lists into the account (`FEATURES.md`, "Account and browser lists"): `{ owner, lists, notice?, bad?, held? }` - `owner` the first account whose page loaded with browser lists (only it moves them), `lists` the tombstones (local id to account id: a tombstoned list is never drawn again and leaves `dhloot.lists.v2` on the next removal), `notice` the names the one-time notice still shows, `bad` the damaged-backup sentence (`true` to show, `false` shown and dismissed), `held` the local ids whose account copy did not match (never sent again; a delete prunes the id). Read fresh on every read of the lists; every writer reads it fresh and merges - `owner` kept once set, `lists` and `held` unions, a name appended only with a new tombstone - so two tabs never undo each other's write or a «Скрыть». The tombstones are written before the lists they remove. A value that does not parse reads as absent. Kept after the legacy write cutoff, 2026-10-26 |

`dhloot.auth.return` (`sessionStorage`) is `{ hash, at, kind, provider,
action? }`, written just before sign-in or Connect leaves for the provider
(`app/src/ports/redirect.ts`). `hash` is the page the reader left, or - when
a sign-in prompt's «Войти» led to `#/account` - the prompt's page, and
`action` the action it started (`app/src/lib/pending.ts`: reopen the
add-to-list menu with its rows, taken counts and typed name, or save the open
shared list, `#/l/` or `#/s/`). The page that comes back reads and removes it before mount and
returns to `hash` only when every field is one the app could have written - a
`#/` route under 16384 characters (a `#/l/` link with notes passes 2048),
`at` within 10 minutes, a known `kind` and provider; otherwise it opens
`#/account`. An `action` that fails its own check is dropped and the rest is
kept.

Every read is defensive: a value that does not parse, or does not pass its own
validity check, is replaced by the default and the rest is kept. Broken JSON is
ignored whole. Storage that throws (private mode, disabled) must not break the
app - it shows a warning and runs without lists.

## Two tabs

A write must not stamp this tab's array over the key. `saveLists()` re-reads
storage and merges by `id`:

- lists this tab knows about win, in this tab's order
- lists only the other tab has are appended
- a list deleted in this tab is recorded in `S.deleted` for the session, so the
  merge cannot resurrect it from the other tab's copy

The `storage` event redraws the other tab. Before this existed, two open tabs
destroyed each other's lists silently, with no server and no export to recover
from, so the merge is not an optimisation.

The `storage` event alone only covers a tab that is in the foreground the
whole time - a backgrounded tab is not guaranteed a `storage` event at all in
most browsers, so a phone put away mid-edit and brought back could otherwise
overwrite whatever a desktop tab wrote while it was away, or resurrect a list
the desktop tab had since deleted (R2). `browserStorage` also reloads on
`visibilitychange` (becoming visible again) and `pageshow` (a back-forward-
cache restore), neither of which names a key, so both are treated the same
as a `storage` event with none - `localStorage.clear()`'s own shape, also
now redrawn rather than silently ignored.

A signal that finds in storage the very string the tab's lists were drawn
from redraws nothing, and a save does not parse the string it last read or
wrote again (`docs/DECISIONS.md`, 2026-09-23, "The list store is raw
state...", for the measured cost). A signal for `dhloot.migrated.v1` redraws
even then: a new tombstone hides a list whose stored text did not change,
and the page of a list that moved follows it to its account address.

After the legacy write cutoff, 2026-10-26, a build with sign-in configured
writes a browser list only through the move's removal and a delete, and
neither merges: each reads storage fresh, removes by id, and makes this
tab's memory the stored array. The merge above stays for the weeks before
the date (and in a build with no sign-in configured).

Account lists do not ride the `storage` event: every tab and device reads the
account again on a message of the owner's Realtime topic from another tab or
device, when it is shown again, every 45 s while Realtime is not joined and
the index or an account list's page is open, and every 5 minutes on any route
while the owner's topic is joined, always once no write is buffered or in
flight. A shared page `#/s/<token>` reads its list again on a message of its
share's topic, when it is shown again, every 45 s while that topic is not
joined and every 5 minutes while it is, signed in or not. A read keeps each list
whose `updated_at` has not moved as the same object, so a read that finds
nothing new redraws nothing, and an edit replaces only the list it changes.

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
  account's answer, and set by the Display section of `#/account`
  (`FEATURES.md`, "Account"); nothing else writes it. A page switch sets
  the page value in memory only: no storage write, no account save. A page
  draws its page value when set, else the default. A Display change sets
  the default and drops the page value; the account's answer moves the
  default and keeps a page value. A signed-out reader keeps the default
  `dhloot.prefs.v1` already holds and cannot change it.

- **`notifyGm`** (`ask`, `always` or `never`), the remembered answer of
  flow b - the Display row «Добавление из чужого списка» / "Adding from
  someone else's list" (`FEATURES.md`, "Account") - lives in the row only:
  no local key. A row without it reads as `ask`; it is `ask` signed out and
  before a new user's row is pulled, so one user's answer never seeds
  another's row.
- **A purchase request leaves nothing in the browser.** The request id a
  send makes lives in memory, only so that a second press after a send with
  no answer is a replay; no key of `localStorage` or `sessionStorage` holds
  a request, its id or its status (`FEATURES.md`, "Account and browser
  lists").

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

## The list migration

`dhloot.lists.v1` had one note per object plus a `noteShow` flag meaning "copy
this along with the item". That is exactly the note meant for players, so the
split is read off the data rather than guessed: flagged becomes `note`,
unflagged becomes `hnote`, and `noteShow` is dropped. Applied to the list and to
every entry's meta.

## The in-memory state object

`S` in the live app (`app.js`, deleted at R0c - read it at `git show
23c00a6^:app.js`). The rewrite has no single `S` object: each group below
lives in its own store or page component (`AppState` in
`app/src/state/app.svelte.ts`, plus per-page `$state` in the components that
own a group). The grouping below is still the useful map of what memory-only
state exists, by what it was for:

| Group | Fields |
|---|---|
| Session | `lang`, `route`, `user` (the signed-in session: unknown, none, or who), the tab id sent as `x-dhloot-tab` (one per page load, in the cloud port), the owner feed's and the share feed's states (`off`, `connecting`, `live`, `down`), `alreadyLinked` (the provider a Connect was refused for), `signInFor` (the page and action a sign-in prompt's «Войти» remembered, forgotten on leaving `#/account`), `pendingListName` (a name typed before a sign-in, taken once by the menu that reopens; the pending action and this name are forgotten on a navigation and on sign-out), `now` (the clock the relative times read, moved every 45 s and when the tab is shown again), `cloning` (true while «Сохранить себе» copies a share link's list) |
| Roll inputs | `std {n, src{core,hnf}}`, `alt {rarity, hope, fear}`, `wond {n}`, `dread {n}`, `voa {k, n}`, `dv {n}`, `comm {c, n}` |
| Tables | `tables {t, q, view, anchor}`, `search {q}`, the tables view a page switch picked for this visit (`AppState`) |
| Filters | `kind {item,consumable,equip}`, `fOn`, `fOpen`, `fSeg` |
| Lists | `lists`, `cloudLists` (the account lists, their read status, the write buffer and its save status), `sharedView` (the open share link's list, its read status and whether the reader owns it), `openList`, `urlPayload`, `deleted`, `lsel`, `picked` (the own list's taken counts), `listDraft`, `listRoll`, `newListFor`, `newListDraft`, `pickQ`, `shared {ids, meta}`, `listsShown` (how many cards the index draws, kept for the session); the index's ticked account lists (page memory, pruned to the drawn cards, empty on every visit) and the import field's file, preview and rows (page memory, forgotten when the field folds) |
| Prices | `rp`, `guess`, `moneyHelp` |
| Print | `printIds`, the print layout a page switch picked for this visit (`AppState`) |
| UI | `sel`, `picked` (the shared page's taken counts, cleared with `sel`), `modal`, `menuFor`, `help`, `keepOpen`, `menuOpen` (the header's account menu, in `Shell`, closed on a navigation and a user change), `hidden` (the move banner's «Скрыть», in `MoveNotice`, which `Shell` never remounts: hidden until the next page load) |

`fSeg` is the filter segment already read back from the address. Reading the
address on every render froze the filter at whatever the link said: the panel
could not be folded and a chip clicked itself straight back. Whatever replaces
this has the same problem to solve.

`urlPayload` is the payload this tab wrote itself, so an edit can refresh the
address rather than orphaning the page.

`keepOpen` holds what the person folded or unfolded by hand, so a redraw does
not undo it.

Svelte does not remount a page component between two addresses of the same
route kind: `App.svelte`'s `{#if}/{:else if}` chain tears a branch down only
when the *matched branch itself* changes, not on every address change within
it - so `TablesPage`'s own `$state` survives a move between two `tables`
addresses. Any design reasoning about state lifecycle across a route change
has to check which branch changed, not the address string.
