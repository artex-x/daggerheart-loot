# Critique: resilience - what happens when things go wrong

TASK phase-8. Read-only agent, 2026-09-17. Eighth of the critique sweep; the
other seven are alongside this file.

**Scope**: the failure paths. Every input the app cannot trust - the URL hash,
`localStorage`, the assets, the browser APIs that may refuse - walked for what
happens when it is absent, truncated, corrupt, hostile, or written by a
different version of the app.

**Method**: read `app/src/lib/{hash,listLink,share,filters,lists,data}.ts`,
`app/src/ports/*`, `app/src/state/{app,lists}.svelte.ts`, the components that
own a failure branch (`ListPage`, `ListsPage`, `SharedListPage`, `PrintPage`,
`PrintCard`, `StorageNotice`, `RecordModal`, `TablesPage`), `docs/specs/STATE.md`,
`FEATURES.md`, `ROUTES.md`, `META.md`, `docs/fixtures/urls/routes.json`. Probed
the deployed site over HTTP for asset and stub behaviour. Ran no suite: the tree
is shared.

**Not re-reported**: `docs/specs/DEBT.md` `D1`-`D23`. In particular `D2` already
owns the stale packed-link expansion. Where an existing critique finding covers
half of something, it is named rather than restated: `product.md` `P1` (the skip
link destroys the route), `P5` (list delete is silent and final), `P9` (a share
link silently loses ids the data does not know), `performance.md` `PF3` (a
keystroke re-serialises every stored list).

**Headline**: the *ports* are the best-defended code in the repository - storage,
clipboard, share and data each enumerate their refusals and fall back a step at a
time, and the hash decoder's checksum does exactly the job it was built for. The
weakness is one layer up, in what the app does *after* a port says no: three of
the four worst findings below are places where a failure is absorbed into an
empty value and then written back over the evidence.

---

## Worth doing

Ranked by what the user loses.

### R1 - a `dhloot.lists.v2` this build cannot read silently becomes no lists, and the next write destroys it

- **Where**: `app/src/state/lists.svelte.ts:59-85` (`load`), `:94-109` (`save`),
  `app/src/lib/lists.ts:47-57` (`keepLists`).
- **The failure**: `load()` catches a `JSON.parse` throw and returns `[]`.
  `keepLists` independently drops every array element that is not an object with
  a string `id` and an array `ids`. Neither path tells anyone. The store is then
  live with zero lists, and the very first write - creating a list, importing
  one, renaming one - calls `save()`, which re-reads the key, fails to parse it
  again, treats storage as holding `[]`, merges that with this tab's array, and
  `setItem`s the result. The unreadable original is gone.
- **How to reach it**: three routes, in descending order of realism.
  1. *A key written by a newer build.* `keepLists` requires `ids` to be an
     array. Any future shape that renames or nests that field reads as zero
     lists in an older bundle - and an older bundle is exactly what a stale
     Pages cache or a rolled-back deploy serves. The reverse direction of the
     `v1` -> `v2` migration has no guard: `v2` is read by whatever build the
     browser happens to be running.
  2. *Another page on the same origin.* `artex-x.github.io` is one origin for
     every repository published under that account. The `dhloot.` prefix makes
     a collision unlikely, not impossible, and `localStorage.clear()` from any
     of them is one line.
  3. *Hand-editing or an extension.* The likeliest way it happens today.
- **What the user experiences**: the lists index draws its empty state. Nothing
  is wrong on screen. The campaign's lists are simply not there, and there is no
  server and no export to get them back (`META.md` section 3 is explicit about
  that). If they create a new list to check that lists still work, the old ones
  stop being recoverable even with devtools.
- **Silent**: yes, completely.
- **Recoverable**: before the first write, only by a person who knows to open
  devtools and read the raw key. After the first write, no.
- **Smallest fix**: three small pieces in `load()`, no storage rework.
  1. Distinguish "the key is absent" from "the key is present and yielded
     nothing usable". Today both return `[]`.
  2. On the second case, copy the raw string to `dhloot.lists.v2.bad` once
     (ignore a failed write) before returning, and add the key to `STATE.md`'s
     table. One `storage.set`.
  3. Say so: a new dict key pair drawn in the `StorageNotice` slot, which both
     pages that show lists already render. The existing `badShare` string proves
     the register is already there - "The link is damaged or was built from a
     different data version" (`dict.ts:290`, `:579`).
  `app/src/state/lists.test.ts:55-58` already pins "empty on broken JSON"; the
  fix extends that case rather than contradicting it.
- **Effort/value**: ~25 lines, one dict pair, two tests. The highest-value
  finding here - it is the only one where the app destroys data it was handed.
- **Goldens**: a new notice is a new state, so it needs an `inventory.js` entry
  and a seeded golden if it is rendered rather than toasted. A toast avoids
  that; the notice is the better product answer. Owner's call.

### R2 - a tab that missed the storage event overwrites the other tab's edits, and resurrects lists the other tab deleted

- **Where**: `app/src/state/lists.svelte.ts:196-200` (`watch`),
  `app/src/ports/storage.ts:61-71` (`onExternalChange`),
  `app/src/lib/lists.ts:101-109` (`mergeLists`).
- **The failure**: the merge that `STATE.md`, "Two tabs", describes is correct
  and is not the problem. The problem is its only refresh trigger. This tab
  re-reads storage on exactly one signal - a `storage` event - and a frozen,
  backgrounded or bfcached page does not receive them and gets no replay when it
  is restored. There is no `pageshow`, no `visibilitychange` and no `focus`
  handler anywhere in `app/src` (checked). So a tab that was asleep while the
  other one wrote wakes with a stale `this.lists`, and `mergeLists` is explicit
  that "lists this tab knows about win, in this tab's order".
- **How to reach it**: open the list on a phone. Switch apps, or just leave the
  tab in the background long enough for the OS to freeze it. Edit the same list
  on a laptop. Come back to the phone and type one character into any note. The
  phone's `save()` merges its stale copy over the laptop's and the laptop's
  edits are gone. The same sequence in the other direction resurrects a list the
  laptop deleted, because `#deleted` (`:49`) is this tab's own memory and the
  sleeping tab never had the entry.
- **What the user experiences**: an edit made on the other device is simply not
  there any more. No message, no conflict, nothing that suggests two tabs were
  involved.
- **Silent**: yes.
- **Recoverable**: no. The overwritten version is gone from storage.
- **Secondary case the same fix closes**: `onExternalChange` gates on
  `if (e.key)`, so a `localStorage.clear()` from another tab (which fires with
  `key === null`) is ignored entirely.
- **Smallest fix**: widen the trigger, not the merge. In `browserStorage`,
  also listen on `visibilitychange`/`pageshow` and call the handler with `null`
  meaning "another context may have written anything"; in `ListStore.watch`,
  reload when `key === LISTS_KEY || key === null`. The port's `onExternalChange`
  type changes from `(key: string) => void` to `(key: string | null) => void`.
  About eight lines across `ports/storage.ts`, `ports/types.ts` and
  `state/lists.svelte.ts`, plus a `memoryStorage` hook for the test. One clause
  in `STATE.md`, "Two tabs", saying the re-read also happens when the page comes
  back to the foreground.
- **Effort/value**: small diff, and it closes the one hole in the feature that
  exists specifically because two tabs used to destroy each other's lists.
- **Goldens**: none.

### R3 - importing a shared list drops both of the list's own notes and its money mode, and writes the loss to storage

- **Where**: `app/src/components/ListsPage.svelte:77-99`, specifically:
  ```ts
  const l = app.lists.create(data.name, {
    ids: data.ids,
    ...(data.meta ? { meta: data.meta } : {})
  });
  ```
- **The failure**: `decodeList` returns `{ name, ids, money?, note?, hnote?, meta? }`
  (`listLink.ts:218-223`) and `ListStore.create`'s `init` accepts all of them
  (`lists.svelte.ts:122-137`). `restore()` passes two. The list's players' note,
  the GM's note and the price-display mode are decoded and thrown away.
  Per-entry notes survive, because they ride inside `meta` - which is what makes
  the loss hard to notice: some of the notes come across.
- **How to reach it**: make a list with a note, use the GM share button, paste
  the link into the import box on `#/lists`. The note is not in the imported
  copy. `FEATURES.md`, "Lists", says import is "paste a link or a payload to
  take a copy of someone else's list" - a copy that quietly omits three fields.
- **What the user experiences**: the imported list looks right and is missing
  the sentence explaining what the loot was for.
- **Silent**: yes.
- **Recoverable**: yes, if they still have the source link - but they have to
  notice first, and nothing prompts them to.
- **This is also where `P9` turns permanent.** `P9` reports that unknown ids are
  dropped from a decoded payload. On `SharedListPage` that is a display-only
  loss - nothing is written. Here the surviving ids are handed to `create()` and
  persisted, so the dropped entries are gone from the copy for good even if the
  data later knows them again. Whatever `P9`'s "dropped count" fix ends up
  being, `restore()` is the call site that must *not* proceed silently.
- **Smallest fix**: pass the fields through -
  `...(data.money ? { money: data.money } : {})` and the same for `note` and
  `hnote`. Four lines. `listsPage.test.ts` gets one case importing a payload
  with all three.
- **Effort/value**: the cheapest real fix in this report.
- **Goldens**: none.

### R4 - a long note typed into a list makes one `history.replaceState` per keystroke, and WebKit throws at the hundredth

- **Where**: `app/src/components/ListPage.svelte:112-115` (the `$effect`),
  `:240-247` (`noteInput`), `:179` (`rename`), into
  `app/src/state/app.svelte.ts:430-436` (`syncListUrl`), `:416-420` (`replace`),
  into `app/src/ports/router.ts:36-44`.
- **The failure**: every character typed into a note, an entry note, or the list
  name reassigns `store.lists`, which re-runs the effect, which calls
  `syncListUrl` -> `replace` -> `history.replaceState`. WebKit rate-limits that
  API to 100 calls per 30 seconds and **throws** a `SecurityError` past the
  limit; Gecko limits to 50 per 10 seconds and drops the call. The call is
  unguarded, and it happens inside a Svelte `$effect` with no boundary above it
  (`App.svelte:47-79` mounts the page components directly), so the throw escapes
  into the effect flush rather than into a handler that could ignore it.
- **How to reach it**: type a hundred characters into a list note in Safari
  without pausing. Two sentences of Russian.
- **What the user experiences**: at best the address bar stops matching the list
  and `AppState.hash` goes stale, because `this.hash = hash` at
  `app.svelte.ts:418` is *after* the throwing call. At worst the effect flush is
  interrupted and the page stops updating until reload. Unverified on a real
  Safari - I could not run a browser - so treat the second half as the risk it
  is, not as a measurement. The rate limits themselves are documented engine
  behaviour, not a guess.
- **Silent**: no, but it is inscrutable: nothing on screen relates a broken page
  to having typed a long note.
- **Recoverable**: yes, by reloading; the note itself is already in storage
  because `setNote` saved it synchronously.
- **Smallest fix**: two, and they compose.
  1. `performance.md` `PF3` already proposes a 150 ms trailing debounce around
     `save()` and `syncListUrl`, flushed on blur and in `onDestroy`. That takes
     a hundred keystrokes from a hundred `replaceState` calls to a handful and
     removes the cause. This finding is the correctness argument for a fix that
     was proposed on cost grounds; it should raise `PF3`'s priority.
  2. Independently, wrap the `replaceState` call in `router.ts:39-43` in a
     `try`/`catch` that falls back to `win.location.hash = hash` - the branch
     that already exists one line below for the case where the method is
     missing. Three lines, and it makes the port honest about a method that can
     refuse as well as be absent.
- **Effort/value**: (2) is tiny and should happen regardless of (1).
- **Goldens**: none.
- **Note on `file://`**: the adjacent worry - that `replaceState` throws on a
  `file://` document because the origin is `null` - does **not** apply here. The
  browser suites drive the built app from `file://` in real Chrome
  (`tests/app/driver.js:20`) and exercise filter picks, which go through this
  exact call. It works. The comment at `router.ts:36-38` is accurate.

### R5 - one stray character in a shared link sends the reader to the roll page and erases the link from the address bar

- **Where**: `app/src/lib/hash.ts:91-93`:
  ```ts
  if (/^l\/[A-Za-z0-9_-]+$/.test(h)) {
    return { kind: 'sharedList', payload: h.slice(2), packed: false };
  }
  ```
- **The failure**: the payload charset is matched strictly, and anything that
  fails the match falls through every other branch to `{ kind: 'unknown' }`,
  which `AppState.#fallback` (`app.svelte.ts:229-234`) answers by
  `router.replace(this.#home)`. The app has a good, specific, bilingual page for
  a share link it cannot read - the not-found title, the bad-link line, a button
  home (`SharedListPage.svelte:82-84`) - and a single wrong character routes
  around it.
- **How to reach it**: a link at the end of a sentence in a chat message, where
  the client's auto-linker swallowed the full stop: `.../#/l/ABC.` A link a
  reader hand-trimmed. A link that picked up a `)` from prose. A payload that
  arrived percent-encoded. None of these is exotic; the first is how people
  actually paste links.
- **What the user experiences**: the GM's loot list opens as the Core rules roll
  page. Nothing says a link was refused. Because `#fallback` uses `replace`, the
  address bar is overwritten with the home section, so the reader cannot even
  see what they clicked or copy it back out to ask about it. Compare the same
  mistake one character earlier - a payload of the right charset but garbage
  content - which correctly draws the bad-link page.
- **Silent**: yes, and it destroys the evidence.
- **Recoverable**: only by going back to the chat and clicking again, assuming
  they realise the click did something.
- **Smallest fix**: make the `l/` branch greedy - `/^l\//` - and let
  `decodeList` reject the payload, which is what it is for. Ordering already
  makes this safe: `lists/` is matched at `:90`, before `l/`, and the packed
  form at `:81`. `#/l/` with an empty payload decodes to `null` and draws the
  bad-link page, which is the right answer too.
- **Contract status**: **not** a contract change. The encoding is untouched;
  every link that works today still parses identically. What changes is the
  handling of a payload that was never valid. `ROUTES.md:112` does not pin the
  payload charset, so it needs one clause saying anything under `l/` reaches the
  shared-list page. `docs/fixtures/urls/routes.json` has no `l/` case at all
  (checked), so no fixture moves.
- **Effort/value**: one regex, one spec clause, one `hash.test.ts` case. High
  value: it converts a silent redirect into the explanation the app already
  wrote.
- **Goldens**: none unless a new state is registered.

### R6 - a print card whose artwork 404s shows a broken image, and the fallback that exists cannot fire

- **Where**: `app/src/components/PrintCard.svelte:246-251` and
  `app/src/components/PrintPage.svelte:112`.
- **The failure**: `PrintCard` accepts `artBroken` as a prop and honours it -
  `hasArt` at `:55` falls back to a drawn glyph - but the card has no `onerror`
  and never reports a failure back. `PrintPage` passes `app.artBroken(it.id)`,
  which is only ever set by `RecordCard.svelte:118-122`, `RowMain.svelte:64` and
  `TableRows.svelte:181`. So on a print sheet reached directly - from a shared
  `#/print/...` address, the documented way to hand a set to another GM
  (`FEATURES.md`, "Print") - a missing `img/<id>.webp` renders as the browser's
  broken-image box, twice per card (the blurred backdrop and the front image
  both use the same `src`).
- **How to reach it**: a partial deploy, a cold Pages cache, an offline
  `file://` copy missing one file, or a flaky connection on the sheet's first
  paint. The deployed site is intact today - I checked `img/w3.webp`,
  `og/w3.jpg`, `i/w3.html` and `data.js`, all 200.
- **What the user experiences**: a printed sheet with a broken-image glyph where
  the art should be. Worse than the "no artwork" case, which has a designed
  fallback. Fitting is measured after render (`FEATURES.md`, "Print"), so an
  unexpected intrinsic size can also disturb the measured layout.
- **Silent**: no - it is visible - but on a print sheet it is visible after the
  paper is out of the printer.
- **Recoverable**: reload; and for the session, `markArtBroken` would remember
  it, which is precisely the mechanism going unused.
- **Smallest fix**: give `PrintCard` an `onartfail` prop and an `onerror` on
  each of the two `<img>` tags, exactly as `RecordCard` does; `PrintPage` passes
  `(id) => app.markArtBroken(id)`. Six lines, an existing pattern, no new
  abstraction.
- **Effort/value**: small; the value is that the degraded print card already
  exists and is currently dead code on this route.
- **Goldens**: none - the fallback only renders when a file is missing, which no
  golden state produces.

### R7 - `App.svelte` has no branch for an unknown route, and `replace()` can reach one

- **Where**: `app/src/App.svelte:47-79` (the `{#if}` chain ends with no
  `{:else}`), `app/src/state/app.svelte.ts:416-420` (`replace` sets `this.hash`
  without going through `#fallback`), `:397-408` (`#expand`).
- **The failure**: `#fallback` guarantees a readable hash on boot and on
  `hashchange`, but `go()` and `replace()` assign `this.hash` directly. `go()`'s
  callers all pass hashes the app built. `replace()` has one caller that does
  not: `#expand` replaces with `sharedListHash(plain)` where `plain` is the
  decompressed payload. `compress.unpack` re-encodes to base64url
  (`ports/compress.ts:63-68`), so `plain` is always in the right charset - but
  it can be the **empty string**, when the payload decompresses to zero bytes.
  `#/l/` then fails the `[A-Za-z0-9_-]+` match at `hash.ts:91`, the route is
  `unknown`, and no branch in `App.svelte` matches: the content area under the
  shell renders nothing at all, and stays that way, because no further
  `#fallback` runs.
- **How to reach it**: a hand-built `#/l/~<deflate of nothing>`. Narrow, and I
  am reporting the shape rather than the exploit: the app has a route kind it
  can hold and no markup for it.
- **What the user experiences**: a page with the tab bar, the footer and an
  empty middle.
- **Silent**: yes, absolutely.
- **Recoverable**: by navigating with the tab bar, which is still drawn.
- **Smallest fix**: one `{:else}` in `App.svelte` rendering the same not-found
  block the record route uses, or - cheaper and more defensive - route `hash`
  through `#fallback` inside `replace()` as well. R5's fix closes this
  particular instance as a side effect, since `#/l/` would then reach
  `SharedListPage` and draw the bad-link page. Both are worth having: R5 fixes
  the reachable case, the `{:else}` fixes the class.
- **Effort/value**: three lines for real insurance.
- **Goldens**: none; no state produces it today.

### R8 - there is no `404.html`, so a mistyped record link is a dead end outside the app

- **Where**: nothing in the repository (`404.html` does not exist at the root,
  in `app/`, or in a `public/` directory); `.github/workflows/ci.yml:198-199` is
  the collect step that would publish one.
- **The failure**: a hosted record link is `i/<id>.html` (`hash.ts:182-184`),
  and that is what "copy link" and the share sheet hand out. Any wrong path
  under the site gets GitHub Pages' own 404 - verified: `i/zzzz.html` returns
  404 with the generic page. It contains no link back to the app in either
  language.
- **How to reach it**: a chat client that truncated `.html` to `.htm`, a
  hand-typed id, a stub link older than a data change.
- **What the user experiences**: GitHub's 404, with no route back to the
  generator. The app's own not-found page - which exists, is bilingual, and has
  a button home - is a different layer and cannot be reached.
- **Silent**: no. **Recoverable**: only by editing the URL.
- **Smallest fix**: a small static `404.html` carrying the same
  `noindex, nofollow` meta as the stubs and a link to the app, added to the
  `cp` list at `ci.yml:199` and to `META.md`'s inventory of published files. If
  the owner wants more, the same page can read `i/<id>.html` out of
  `location.pathname` and redirect into `#/i/<id>` - but the plain version is
  the one that is unarguably worth it.
- **Effort/value**: ~20 lines of HTML, one workflow line, one `META.md` row.
- **Goldens**: none. The deploy job's own guard block (`ci.yml:239-249`) should
  gain a line for the new file, the way it checks the others.

### R9 - `#/tables/<name that is not a table>` draws a different table and leaves the address lying

- **Where**: `app/src/lib/hash.ts:98-113`. The comment there is deliberate: "A
  name that is not in the list does not reset the table to a default: the caller
  keeps whichever is already open. Hence null, not 'core_item'."
- **The failure**: that reasoning is right for a *navigation within the app*,
  where something is already on screen. On a cold open from a pasted link there
  is nothing already open, and `TablesPage`'s `lastTable` starts at `core_item`
  - so a mistyped table name silently draws Core items while the address says
  otherwise, and every "copy link" taken from that page then propagates it.
- **What the user experiences**: the wrong table, looking entirely normal. This
  is the worst kind of failure by the standard in the brief: nothing is missing,
  nothing is broken, the content is simply not what was asked for.
- **Silent**: yes. **Recoverable**: yes - the table switcher is right there,
  once they notice.
- **Smallest fix**: the honest one is not free, because the null carries two
  meanings (`app.svelte.ts:70-76` says so explicitly: "`parseHash` cannot tell
  'no name' from 'a name it did not recognise'"). Splitting it into
  `table: null` versus an explicit unknown touches `readHome`'s pin check as
  well. Given `ROUTES.md` documents the bare `#/tables` form, the smallest
  *useful* change is narrower: have `TablesPage` fall back to `core_item` only
  for the bare form and draw the "nothing" empty state for a named table it does
  not know. Scope it with the owner before writing it.
- **Effort/value**: medium effort, medium value. Lowest of the "worth doing" set
  and the one most defensible to defer.
- **Goldens**: likely none, since no state names a bogus table.

### R10 - a packed link that cannot be expanded overwrites itself with `zzzz`

- **Where**: `app/src/state/app.svelte.ts:397-408`.
- **The failure**: when `unpack` rejects or the port cannot decompress, the
  address is replaced by `#/l/zzzz` - a deliberate sentinel that decodes to
  nothing and so draws the bad-link page. The page is the right answer; the
  rewrite is what costs. The received payload is gone from the address bar, so a
  reader on a browser without `DecompressionStream` cannot copy the link back
  out to open it elsewhere, and cannot show anyone what they were sent.
- **How to reach it**: Safari older than 16.4, or a truncated packed payload.
- **What the user experiences**: the bad-link page, correctly; but the link is
  unrecoverable from the tab.
- **Silent**: no. **Recoverable**: only from the original chat message.
- **Smallest fix**: do not `replace` on the failure path - render the bad-link
  state for the packed route instead, leaving the address alone. That means
  `ListPage.svelte:581-584`'s "draw nothing while expanding" branch needs a
  third state (expanding / expanded / failed), which is a small amount of real
  work. Distinct from `D2`, which is about a *late successful* expansion
  rewriting the address after the reader has navigated away; a fix for either
  should be designed with the other in view.
- **Effort/value**: small-to-medium; low value on its own, better value folded
  into whatever eventually answers `D2`.

---

## Noticed, not worth it

- **A truncated link can open with a silently cut note.** The checksum
  (`listLink.ts:67-75`) covers the items line only. Truncation that lands inside
  the trailing note blob leaves the items intact, so the list opens and the note
  is short. In practice the cut is visible - a sentence stops mid-word, and
  Russian text usually ends in a replacement character from the partial UTF-8
  sequence. Extending the checksum over the notes would be a contract change to
  the payload grammar for a failure the reader can see. Leave it.
- **`qty` and `gold` from the hash are unbounded.** `parseItems:153-157` accepts
  any `parseInt` result above the threshold, and `ListStore.addIds:174-176`
  persists them when a shared list is taken into one of your own. A twenty-digit
  quantity renders in exponential notation and sums to `Infinity` in a total.
  Cosmetic, requires a hand-crafted link, and nothing downstream divides by it.
  A clamp in `parseItems` would be three lines if anyone ever sees it in the
  wild.
- **`window.confirm` is not guarded** (`ports/dialog.ts:9-11`). In a sandboxed
  iframe without `allow-modals`, Chrome returns `false` without prompting, so
  deleting a list silently does nothing. Nobody runs this app in a sandboxed
  iframe.
- **A concurrent external write can move the caret.** If another tab saves while
  you are typing a list name, `watch()` replaces `store.lists`, `own` becomes a
  new object and `value={own.name}` (`ListPage.svelte:594`) is re-applied
  mid-edit. Narrow enough that R2's fix - which makes external reloads *more*
  frequent - is worth doing anyway; note it in that commit rather than chasing
  it separately.
- **`RecordModal` calls `dialog?.showModal()` unguarded**
  (`RecordModal.svelte:57-59`). A browser without `<dialog>` throws. The effect
  depends only on the bound element, so it cannot re-fire on an already-open
  dialog, which was the realistic failure; the browser-support case is below the
  app's floor.
- **Shared origin.** Every page under `artex-x.github.io` shares this app's
  `localStorage`. The `dhloot.` prefix is the whole defence and it is adequate.
  Recorded because it is why R1's route (2) is not purely hypothetical.

---

## Handled well

Worth stating plainly, because knowing which paths are solid is half the value
of the exercise.

- **`ports/storage.ts` is exemplary.** Every method wraps both the property
  access (`win.localStorage` itself throws when site data is disabled) and the
  operation. `set` returning `false` rather than swallowing is what lets
  `saveFailed` and the pin's `say(t.saveFailed)` (`PageHead.svelte:61`) exist at
  all, and the `dhloot.probe` write/remove in `works()` correctly reports a full
  quota as "does not work".
- **Unknown fields survive a read-modify-write.** `keepLists` filters the array
  but does not reshape the objects, and every writer in `ListStore` spreads
  (`{ ...l }`). A list carrying a field a newer build added comes back out
  intact. That is real forward compatibility, and it is a consequence of the
  spread style rather than of a stated rule - worth a sentence in `STATE.md` so
  a future refactor does not lose it.
- **The truncation checksum does its job.** Clipping the end of a link cuts the
  items line short, the stamp no longer matches, `decodeList` returns `null`,
  and the reader gets the bad-link page rather than a list that is quietly
  shorter than the one that was sent. `listLink.ts:62-65`'s claim - "without it
  a clipped address would decode into a shorter list that looks complete" - is
  accurate, and the four-character cost is right.
- **The format is newline-safe by construction.** A crafted payload cannot
  produce a stored list name containing `\n`: the newline would be read as the
  end of the name, the following line would fail the checksum, and the payload
  would be rejected whole. So a re-encoded link can never be structurally
  corrupt because of what was imported. Nothing documents this; it holds anyway.
- **`compress.unpack` failures all land in one place.** A missing
  `DecompressionStream`, an `atob` on a bad payload and a deflate error are all
  synchronous throws inside an `async` function, so they become rejections that
  `#expand`'s `.catch` (`app.svelte.ts:405-407`) handles identically. The extra
  guard for a port that hands back a payload still marked `~` (`:403`) is a real
  case, correctly identified.
- **The filter decoder cannot be weaponised.** An unknown group name survives
  into `FilterState` but `passes` (`filters.ts:121-127`) only consults the
  groups the table offers, so a link naming a facet that does not exist leaves
  the table whole; `encodeFilter` drops it on the next write. A known group with
  a bogus value empties the table, and `TablesPage.svelte:559-567` draws the
  empty state *with a reset button* whenever anything is picked - so the one
  filter failure that can strand a reader is the one that hands them the way
  out.
- **The missing-data state is genuinely global.** `browserData.looksLikeLoot`
  shape-checks the global rather than casting, and every page component guards
  on `!index` with `NoData`. A `data.js` served as an HTML error page by a
  broken deploy degrades to a readable sentence rather than a blank screen.
- **Art failure on cards and rows is handled and remembered for the session
  only** (`app.svelte.ts:306-317`), which is the right duration: a bad
  connection is worth retrying next visit, a bad deploy is not worth retrying
  this one. R6 is the one route that does not participate.
- **The share stubs degrade without JavaScript.** The deployed `i/w3.html`
  carries both a `location.replace(...)` script and a plain
  `<a href="...#/i/w3">` for a client that will not run it.
- **The clipboard port's ladder is right.** Rich to plain to `execCommand`, with
  the secure-context and `ClipboardItem` checks collapsed into one narrowed
  handle, and a returned boolean the callers actually use to say `copyFailed`.
  The `writeImage` comment about not awaiting before `ClipboardItem` - Safari
  drops the gesture - is the kind of thing that is expensive to rediscover.
- **`browserShare` separates a dismissal from a failure**, so cancelling your
  own share does not raise an error toast at you. Rare discipline.
- **`#/lists/<id nobody has>` draws a real page** (`ListPage.svelte:577-579`)
  with a sub-line naming both likely causes - deleted, or in another browser.
- **`file://` is not quietly broken.** The browser suites drive the built app
  from `file://` in real Chrome (`tests/app/driver.js:20`), which is what keeps
  the `replaceState` path in `router.ts` honest; see R4.

---

## Noted, out of scope

Two lines each, per the owner's fence.

- **A consistent storage layer** - versioned envelope, schema validation on
  read, an explicit migration chain. R1 and R2 are the two symptoms worth
  patching individually; the general answer is the separate ticket the owner
  has already reserved.
- **An error-handling framework** - a `<svelte:boundary>` around the page slot
  with a reload-and-report fallback, plus `window.onerror` and
  `unhandledrejection` reporting. There is none of this today, so any uncaught
  throw in a component is a partially drawn page with no explanation. R4 and R7
  are the two places I found that can get there; a boundary is the general
  answer and is more than a patch.
- **A list export/backup file.** No backend and no upload service is the product
  law, which a local `.json` download does not violate - and it is the real
  answer to "a lost list is lost". Worth its own ticket alongside the storage
  one.

---

## Summary table

| id | failure | silent | recoverable | effort |
|---|---|---|---|---|
| R1 | unreadable `lists.v2` becomes zero lists, then is overwritten | yes | no | small |
| R2 | a slept tab overwrites newer edits and resurrects deletions | yes | no | small |
| R3 | import drops list notes and money mode into stored data | yes | partly | trivial |
| R4 | `replaceState` per keystroke; WebKit throws at 100/30 s | no | yes | trivial + `PF3` |
| R5 | one stray char in a share link silently redirects home | yes | partly | trivial |
| R6 | print card cannot report a failed image; fallback unreachable | no | yes | small |
| R7 | no render branch for an unknown route; blank content area | yes | yes | trivial |
| R8 | no `404.html`; a mistyped record link is a dead end | no | no | small |
| R9 | a bogus table name draws a different table | yes | yes | medium |
| R10 | a failed packed expansion overwrites the payload | no | partly | small |

Suggested order: R3, R5, R7 and R4(2) first - all trivial and independent. Then
R1 and R2, the two that lose data. R6 and R8 whenever their areas are next
touched. R9 and R10 need a scope decision before anyone writes code.
