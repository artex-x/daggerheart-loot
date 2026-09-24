# State: what lives where

Three places, and the boundary between them is a product decision rather than an
implementation detail. A fourth holds one short-lived record.

| Where | Holds | Survives a reload |
|---|---|---|
| URL hash | anything shareable: route, table, anchor, filters, the whole contents of a shared list, what to print | yes, and travels to other people |
| `localStorage` | preferences and the person's own lists | yes, on this browser only; kept under storage pressure in the installed app (`META.md` section 9) |
| `sessionStorage` | `dhloot.auth.return`: where a provider redirect comes back to | this tab only, honoured for 10 minutes and removed when read |
| Memory (`S`) | everything else | no |

**The rule: how a page looks is remembered, what was asked on it is not.** A
filter carried in from yesterday is a state nobody remembers, and the page just
looks broken. Table view, language and starting section describe the app's
behaviour, so they persist; a roll, a search, a rarity, a ticked row and an open
help panel start over.

Do not persist filters, search text or selections, a selection's taken counts
included. Filters are shared by link instead - that is what the `f_` segment
is for.

## localStorage keys

| Key | Holds |
|---|---|
| `dhloot.lists.v2` | lists, with contents, per-entry meta and both notes |
| `dhloot.lists.v1` | the pre-split shape. Read once and migrated into v2, then **left untouched** so a rollback loses nothing. Never delete it. |
| `dhloot.lang.v1` | `ru` or `en`. Also written, as `en` and only when absent, by an English redirect page (`i/en/<id>.html`, `en/index.html`) before it opens the app (`docs/specs/I18N.md`) |
| `dhloot.home.v1` | the pinned starting section, as a full hash - a section, or a named table (`#/tables/<table>`); reading also accepts a bare `#/tables` from an older pin, but the app itself always writes the named form. A stored `#/tables/frames` (the legacy alias, `hash.ts` `TABLE_ALIASES`) normalises to `#/tables/other_frames` on read only, with no write-back; the home control compares the active route against the canonical path, and the next explicit save writes the canonical id (`app.svelte.ts` `readHome`). |
| `dhloot.prefs.v1` | `{ view: 'list' \| 'grid' }` |
| `dhloot.warn.v1` | `'1'` once the storage warning has been dismissed |
| `dhloot.probe` | written and removed to test whether storage works at all |
| `sb-<ref>-auth-token` | the signed-in session (`<ref>` is the Supabase project), and `sb-<ref>-auth-token-code-verifier` while a provider redirect is in flight - written and removed by supabase-js, never by the app |
| `dhloot.lists.v2.bad` | a `dhloot.lists.v2` value that would not parse, copied here once before this tab's own next write would otherwise silently overwrite it - what a newer build, a browser extension, or another page on the shared origin left behind, kept rather than lost (R1) |

`dhloot.auth.return` (`sessionStorage`) is `{ hash, at, kind, provider }`,
written just before sign-in or Connect leaves for the provider
(`app/src/ports/redirect.ts`). The page that comes back reads and removes
it before mount and returns to `hash` only when every field is one the app
could have written - a `#/` route under 2048 characters, `at` within 10
minutes, a known `kind` and provider; otherwise it opens `#/account`.

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
state...", for the measured cost).

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
| Session | `lang`, `route`, `user` (the signed-in session: unknown, none, or who), `alreadyLinked` (the provider a Connect was refused for) |
| Roll inputs | `std {n, src{core,hnf}}`, `alt {rarity, hope, fear}`, `wond {n}`, `dread {n}`, `voa {k, n}`, `dv {n}`, `comm {c, n}` |
| Tables | `tables {t, q, view, anchor}`, `search {q}` |
| Filters | `kind {item,consumable,equip}`, `fOn`, `fOpen`, `fSeg` |
| Lists | `lists`, `openList`, `urlPayload`, `deleted`, `lsel`, `picked` (the own list's taken counts), `listDraft`, `listRoll`, `newListFor`, `newListDraft`, `importDraft`, `pickQ`, `shared {ids, meta}`, `listsShown` (how many cards the index draws, kept for the session) |
| Prices | `rp`, `guess`, `moneyHelp` |
| Print | `printIds`, `printBW`, `printCompact` |
| UI | `sel`, `picked` (the shared page's taken counts, cleared with `sel`), `modal`, `menuFor`, `help`, `keepOpen` |

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
