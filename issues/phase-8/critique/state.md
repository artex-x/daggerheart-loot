# Critique: the state layer

Read-only review of `app/src/state/app.svelte.ts`, `app/src/state/lists.svelte.ts`
and the effects in the components that write through them, against
`docs/specs/STATE.md`. Written 2026-09-17. No commands were run: findings are
read off the source, the existing tests and the ports.

Scope note: `docs/specs/DEBT.md` `D1`-`D23` are out of scope by the brief, as is
the consistent-storage rework. `P1` (skip link), `P5` (list delete has no undo)
and `PF3` (a keystroke re-serialises every stored list) are already filed by
`product.md` and `performance.md` and are not repeated here.

## Verdict first

**The state layer is correct for every sequence a user can reach today.** I
traced the two-tab merge, the route/language/list-mutation interleavings, and
every `$effect` that writes state, and found no lost list edit and no
non-deterministic merge outcome that a person can trigger. The evidence for
that claim is in "What is sound, and why" below; it is the most useful part of
this report and the part I am most confident in.

Everything under "Worth doing" is latent: code that is correct because of a
property of the current call sites rather than because of a property of the
code. Each is cheap to close and none is urgent.

## What is sound, and why

These are checked claims, not an absence of findings.

**1. A `storage` event cannot land in the middle of a local mutation.**
This is the interleaving `STATE.md`'s "Two tabs" section exists to survive, and
it is structurally impossible here. Every writer in `ListStore` -
`create`, `remove`, `rename`, `setMeta`, `setNote`, `setMoney`, `move`,
`restoreEntry`, `removeEntry` - is a synchronous read-modify-write-then-`save()`
with no `await` anywhere in it, and the two that defer the save (`addIds`,
`removeId`) are called synchronously followed by `save()` at both of their call
sites (`AddToList.svelte:82-83`, `:87-88`, `:138-139`). JavaScript's event loop
cannot deliver a `storage` event between the mutation and the save. There is no
read-modify-write window to lose an update in.

**2. The `ListPage.svelte:112-115` effect does not loop, and I can say exactly
why.** The effect calls `app.syncListUrl(l)`, which writes `openList`,
`urlPayload` and (through `replace`) `hash` - and `own`, the effect's own and
only dependency, reads all three (`:75-81`). That is a self-feeding shape. It
terminates because `own` re-derives to the *same list proxy by reference*:
`app.lists.get(app.openList)` returns the element of the `$state` array, whose
identity did not change, and Svelte's `$derived` propagates on `===`, so the
second derivation is a no-op and the effect is not re-scheduled. The comment at
`:98-111` documents a measured trap in the rejected alternative (an `$effect`
cleanup clearing `openList`, which could strand `own` at `null` after one
keystroke); the shipped shape avoids it and `onDestroy` is the right hook.

**3. Rune choice is right throughout.** No `$state` is used where a `$derived`
belongs; no `$effect` computes a value that a derivation should own. Every
`untrack` has a stated reason at its call site (`TablesPage.svelte:109`,
`:140`, `:419`, `SearchPage.svelte:41`, `ListPage.svelte:491`,
`App.svelte:44`). `$derived.by` appears exactly where a statement body is
needed. `SvelteSet` is used for the two sets that drive rendering (`sel`,
`#brokenArt`) and *not* for `#deleted`, which nothing renders - that is the
correct distinction, not an oversight.

**4. Deep `$state` is never mutated through a stale reference.** `lists` is
deeply reactive, and every writer replaces through `.map()` / spread rather
than assigning into an element, so no mutation bypasses the proxy. I checked
all nine writers plus `liftNotes` (which mutates only its own `{...l}` copy).

**5. `index` is deliberately not reactive.** `AppState.index` is a plain
`readonly` field (`app.svelte.ts:95`), so ~1100 records and their `Map`s are
never wrapped in proxies, and `route`'s `this.index?.byId.has(id)` callback
does not subscribe anything to the catalogue. This is easy to get wrong and it
is right here.

**6. The merge is deterministic.** `mergeLists` (`lib/lists.ts:101-109`) has no
timestamp comparison and no tie-break: this tab's array wins by id, in this
tab's order, others appended. Two tabs racing produce a *stale* result, never a
non-deterministic or half-merged one. Its tombstone (`#deleted`) is correctly
scoped to the tab's lifetime.

## Worth doing

### S1 - `go()` does the router's work a second time

`app/src/state/app.svelte.ts:344-352` against `:238-245`.

**Traced in code, in both environments.** `go()` calls
`env.router.navigate(hash)` and then performs the whole navigation body itself:
`hash`, `navigations++`, `menuFor = ''`, `sel.clear()`, `#applySource()`,
`#expand()`. But `navigate` announces too - `memoryRouter.navigate`
synchronously (`ports/router.ts:79-82`), `hashRouter` asynchronously via
`hashchange` - and `start()`'s handler runs the same six lines. So with
`start()` active, one `go()` yields `navigations += 2`, two `sel.clear()` calls
and two concurrent `#expand()` unpacks of the same payload.

**What the user loses: nothing today.** All three consumers of `navigations`
treat it as a change signal and are idempotent (`SearchPage.svelte:39-44`,
`TablesPage.svelte:107-112`), and the one that is not idempotent - the anchor
scroll-and-flash stamped on nav plus lang at `TablesPage.svelte:403-450` -
cannot be reached by `go()`, because none of the four `go()` call sites
(`AddToList.svelte:133`, `ListPage.svelte:215`, `ListsPage.svelte:99`,
`PrintPage.svelte:69`) produces a tables-with-anchor address. The field is safe
by the accident of its call sites, not by construction, and it is named and
tested as a count (`app.test.ts:378-382` asserts `toBe(1)`).

**Why the tests do not catch it:** every `navigations` assertion avoids the one
combination the real app uses. `app.test.ts:375-383` calls `go()` without
`start()`; `:395-401` calls `start()` without `go()`; `:573-579`, the
expands-through-go case, omits `start()`. The only test that does both,
`:405-417`, asserts `menuFor`, which is idempotent.

**Smallest fix:** add the missing test first - `start()`, then `go()`, then
assert `navigations` is 1 - and make it pass by having `go()` stop duplicating
the handler. There is a trap in the obvious de-duplication, an early return in
`onChange` when the resolved hash already equals `this.hash`: at boot from a
bare address with the default pin, `hash` is already `#/roll/std` while the bar
is bare (`:210-216`), so a later real click on a `#/roll/std` link would be
swallowed. Dropping the duplicated body from `go()` instead is safer, but it
makes `app.hash` lag by one task in a browser, which components read
synchronously. The low-risk version keeps `go()` as the writer and has the
handler skip the hash `go()` just wrote, tracked explicitly rather than
inferred.

**Effort/value:** small diff, one test. Value is preventing a future consumer
of `navigations` from being quietly wrong. **Goldens:** none.

### S2 - `go()` never applies the unreadable-address fallback

`app/src/state/app.svelte.ts:344-352`, against `#fallback` at `:229-234`.

**Traced in code; not reachable from any current call site.** Every other path
that sets `hash` routes through `#fallback`: the constructor (`:215`) and the
router handler (`:239`). `go()` assigns `this.hash = hash` raw. An unreadable
hash passed to `go()` therefore leaves the route kind `unknown`, which matches
no branch in `App.svelte`'s if-chain - the page renders an empty `main` with no
way back except the tab bar. The four call sites all build their hash from
`sharedListHash`, `sectionHash` or a literal, so nothing reaches it.

**Smallest fix:** `this.hash = this.#fallback(hash)` in `go()`. All four call
sites pass readable addresses, so `#fallback` returns them unchanged and
nothing observable moves. **Effort/value:** one line; closes a class of
same-day regression. **Goldens:** none.

### S3 - the packed-link expansion rewrites the address even after you have left

`app/src/state/app.svelte.ts:397-408`.

**Reasoning from shape; I did not observe it, and the window is short.**
`#expand()` captures `r.payload`, starts an async `unpack`, and in its `then`
calls `this.replace(...)` unconditionally - it never re-checks that the app is
still on that packed address.

Sequence: open a packed shared link `#/l/~<payload>` (the page deliberately
draws nothing while it expands, `ListPage.svelte:581-584`); before the promise
settles, click a tab in the header. Those are plain anchors, so `hashchange`
moves the app to, say, `#/tables/core_item`. The unpack then resolves and
`replace()` puts `#/l/<plain>` back in the bar and in `hash`. Two things are
lost: the navigation the person just made, and - because `replace` is
`history.replaceState` (`ports/router.ts:39-43`) - the history entry it landed
on, so Back does not recover it either.

The window is the `unpack` promise chain: a Blob stream piped through
`DecompressionStream` into `new Response(...).arrayBuffer()`
(`ports/compress.ts:36-39`), several task boundaries, realistically
single-digit milliseconds on an idle main thread. A person cannot normally
click that fast; a slow device, a cold start with the main thread busy, or a
very large packed list widen it. S1's double `#expand()` means two of these are
in flight at once, which does not change the outcome but doubles the chance one
lands late.

**Smallest fix:** re-read the route in the `then` and `catch` and return unless
it is still the same packed payload - three lines, no new state. The existing
tests (`listPage.test.ts:133-164`, `app.test.ts:553-579`) keep passing because
none of them navigates mid-flight; add one that does. **Goldens:** none.

### S4 - another tab's edit does not reach the note textareas, and the next keystroke overwrites it

`app/src/components/ListPage.svelte:529-531` (`seedText`), `:546-570`, against
`app/src/state/lists.svelte.ts:196-200` (`watch`).

**Traced through the code; needs two tabs on the same list.** The note
textareas are uncontrolled on purpose - `use:seedText` writes `textContent`
once at mount and is never re-applied, which is what gives the goldens the live
app's text-node structure (the reason is written at `:524-528` and pinned by
`listPage.test.ts:791-799`). `watch()` replaces `lists` wholesale on a
`storage` event, so `own` becomes a new object and every reactive part of the
row updates - but the rows are keyed on `it.id` from the index
(`ListPage.svelte:782`), so they are not re-created and `seedText` does not run
again.

Sequence: tabs A and B both on `#/l/<payload of list a>`. In B, type a players'
note. A's `storage` event reloads `lists`; A's note box still shows the old
text. Type one character in A: `noteInput` (`:240-247`) sends `el.value` - the
stale text plus the character - to `setNote`, and `save()` merges with
mine-wins at whole-list granularity, so B's note is gone. The person is never
told.

**What the user loses:** one note, silently. It needs two tabs open on the same
list and an edit in each, which is uncommon but is precisely the scenario
`STATE.md`'s "Two tabs" section says must not destroy data.

**Smallest fix that does not touch the golden-visible structure:** have the
list page re-seed a textarea when it is not focused and its value differs from
the store. That is about ten lines in `ListPage.svelte` and must keep
`seedText`'s mount-time `textContent` write intact, or the shared-list goldens
move.

**Honest scoping:** the deeper half of this - that the merge is whole-list
last-writer-wins, so *any* concurrent edit to one list loses one side - is the
consistent-storage ticket and is listed under "Noted, out of scope". The
textarea half is separable and local. **Effort/value:** medium effort, real but
uncommon loss. **Goldens:** none if the mount-time seed is preserved; verify.

### S5 - the delete tombstone guards `save()` but not the reload

`app/src/state/lists.svelte.ts:59-85` (`load`) against `:101` and `:142-146`.

**Reasoning from shape; the race window is the browser's `storage` event
delivery latency.** `STATE.md` says a list deleted in this tab "is recorded in
`S.deleted` for the session, so the merge cannot resurrect it from the other
tab's copy". `save()` honours that - it passes `this.#deleted` into
`mergeLists`, pinned by `lists.test.ts:200-213`. `load()` does not: it returns
`keepLists(...)` unfiltered, and `watch()` assigns that straight to `lists`.

Sequence: A deletes list X (storage now lacks X); before A's write reaches B as
a `storage` event, B saves any unrelated edit, writing its still-live copy of X
back; A's `storage` event then fires and `load()` puts X back into A. In
practice B's own `storage` event arrives first and syncs it, so this needs two
writes inside the delivery window - milliseconds.

**Smallest fix:** filter `#deleted` in `load()` as well, or in `watch()`'s
assignment. Two lines, and it makes the code match the sentence in `STATE.md`
rather than relying on event timing. **Effort/value:** cheap; low reachability.
**Goldens:** none.

### S6 - `stop()` leaves the toast timer armed

`app/src/state/app.svelte.ts:252-257`, against `:265-284`.

**Traced.** `start()` returns a stop that unhooks the router and the storage
watcher, but `#toastTimer` is set in `say()` and cleared only by `hideToast()`
or the next `say()`. `stop()` clears neither. In production `AppState` lives as
long as the page, so nothing is lost; in vitest a test that toasts and tears
down leaves a live `setTimeout` handle holding a closure over the state object.
The callback only sets `toast` to null, so it cannot throw after teardown -
this is a tidiness gap, not a crash.

**Smallest fix:** call `this.hideToast()` from `stop()`. One line.
**Effort/value:** trivial effort, small value. **Goldens:** none.

### S7 - no test fires a `storage` event into a mounted page

`app/src/components/*.test.ts` - none match `onExternalChange`, `fire(`,
`openList` or `urlPayload`. `app/src/state/lists.test.ts:216-283` tests
`watch()` only against the bare store.

The two-tab merge is the part of `STATE.md` with the strongest stated reason
("Before this existed, two open tabs destroyed each other's lists silently")
and the only coverage is store-level. Nothing exercises what a *page* does when
`lists` is swapped underneath it - which is where S4 lives, and where the
`ListPage` effect re-fires and rewrites the address. Two cases would close most
of it: a mounted `ListPage` receiving an external write to the same list, and
one receiving a write that deletes it.

Also missing, and cheap: the `start()`-plus-`go()` combination named in S1, and
a navigation landing during `#expand()` (S3).

**Effort/value:** the tests are the deliverable for S1, S3 and S4 anyway. The
harness they need already exists - `lists.test.ts:221-237`'s
`withCapturedListener` wraps `memoryStorage` to expose the callback, because
`memoryStorage` does not fire its own listeners on `set`. **Goldens:** none.

## Noticed, not worth it on its own

- **`ListStore.create()` returns the pre-proxy object**
  (`lists.svelte.ts:127-136`). `this.lists = [l, ...this.lists]` wraps `l`, but
  the raw `l` is handed back, so a caller holding it will never see later
  edits. Both callers use it immediately and only for `id`, `name` and `ids`
  (`AddToList.svelte:124-133`, `ListsPage.svelte:99`), so nothing is wrong
  today. Returning `this.lists[0]` would remove the footgun, and
  `lists.test.ts:97` already asserts with `toEqual` rather than `toBe`
  precisely because of this - the test comment explains the proxy. One line if
  someone is in the file.

- **`StorageNotice` probes storage once per mount, not once per session**
  (`StorageNotice.svelte:22`). `works()` writes and removes `dhloot.probe`
  (`ports/storage.ts:50-60`); the notice is drawn by both the lists index and
  the list page, so every navigation between them costs a write and a delete.
  The comment says "read once", and per-instance is not what it means. Caching
  it on `AppState` in the constructor would be a few lines and would make the
  comment true.

- **`AppState.route` and `.section` are getters, not `$derived`**
  (`app.svelte.ts:323-337`). Each read re-runs `parseHash`, and `App.svelte`'s
  if-chain reads `app.route` around ten times per invalidation
  (`App.svelte:49-76`) because it has no local `const route = $derived(...)`
  the way `ListPage`, `TablesPage` and the others do. `parseHash` is cheap and
  this only fires on a hash or language change, so it is not a performance
  finding; it is an inconsistency in how one state object is consumed. One line
  in `App.svelte`. `app.t` has the same getter shape but is fine, because
  `dict()` returns a module constant (`lib/dict.ts:639-641`) - a stable
  reference, so `$derived(app.t)` memoises correctly.

- **`TablesPage.svelte:75-78` writes `lastTable` from an effect without
  `untrack`**, where its two siblings at `:107` and `:136` use it. There is no
  loop - the effect reads `app.route` and not `lastTable` - so this is a style
  inconsistency, not a defect.

- **`load()`'s v1-migration write ignores its result**
  (`lists.svelte.ts:83`). If storage refuses mid-session the migration succeeds
  in memory and `saved` stays true until the first edit fails. The person sees
  the undismissable no-storage notice anyway, so nothing is actually hidden
  from them.

- **`lists` could be `$state.raw`.** Every writer already replaces rather than
  mutates, so nothing depends on deep reactivity, and `.raw` would drop the
  proxying of every list, every `meta` map and every entry - and would fix the
  `create()` identity footgun above for free. I am *not* recommending it: it
  trades a cheap present cost for a silent failure mode if anyone later mutates
  in place, and bundle and render cost is `performance.md`'s call, not this
  one's.

## Noted, out of scope

- The merge's granularity is the whole list: `mergeLists` resolves by `id` and
  this tab wins outright, so two tabs editing *the same* list inside the
  `storage`-event delivery window lose one side's edit, whatever it was. Making
  that safe means per-entry or per-field reconciliation, which is the
  consistent-storage ticket the owner has already fenced off. S4 above is the
  separable, local half.
- `dhloot.lang.v1`, `dhloot.home.v1` and `dhloot.warn.v1` are not watched for
  external change - only `dhloot.lists.v2` is (`lists.svelte.ts:198`). Two tabs
  can therefore disagree about language and the pinned section until a reload.
  This matches the live app and `STATE.md` claims nothing else; syncing them is
  the same storage-layer ticket.
