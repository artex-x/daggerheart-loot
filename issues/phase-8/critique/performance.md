# Performance critique: the shipped app at catalogue scale

Read-only audit, 2026-09-17, against commit `f53f44d` and the live site
`https://artex-x.github.io/daggerheart-loot/`. No build, no test suite and no
browser run: six other agents share this tree. Node-side numbers were measured
on this host with `data.js` loaded through a `window` shim; HTTP numbers come
from `curl` against the deployed site. Where a number needed a browser I say so,
and say what would produce it.

Headline: **the app is fast enough almost everywhere, and the evidence is
below.** Three things are worth doing, one of them only after a measurement
that does not exist yet. Nothing here is a blocker.

## Four premises in the brief that the evidence contradicts

Worth stating first, because two of them would have been paid for twice.

1. **A bundle budget already exists and already runs in CI.**
   `tools/bundle-budget.mjs` gzips every `.js` and `.css` in `dist/` except
   `data.js` and fails past 120 kB. `package.json` wires it into
   `check:built`, and `.github/workflows/ci.yml:42` runs it as its own step
   after the build. Current value: **91.2 kB gzip**, so 29 kB of headroom.
   No new budget check is needed and none should be added.
2. **No screen renders 1,091 rows.** Per-table counts read from `data.js`:
   `wondrous` 119, `voa` 108, `frames` 94, `community` 90, the four
   Core and Hope-and-Fear tables 60 each, `dread` 29, `starting` 30. The
   equipment tables draw from the whole catalogue and are the largest: weapon
   **317**, secondary 108, armour 90. `#/search` caps at 300, `#/print` at 180
   (`app/src/lib/hash.ts:17`). The biggest list the app ever draws is 317.
3. **Nothing large reaches the client, because nothing reaches the client.**
   `package.json` has no `dependencies` key at all; every entry is a
   devDependency. The 91.2 kB gzip bundle is this codebase plus the Svelte
   runtime. There is no library to justify.
4. **`_none.webp` is not on any routine path.** All 1,091 records carry an
   `img`; they resolve to 875 distinct filenames; **zero** referenced files are
   absent from `img/`, and the single unreferenced file in the directory is
   `_none.webp` itself. It is reached only by a genuine load failure
   (`app/src/lib/desc.ts:117-119`), so it costs nothing normally.

---

## Worth doing

### PF1. The one plausibly slow interaction has never been timed in a browser

`app/src/components/SearchPage.svelte:53-59`, `app/src/lib/search.ts:37-49`,
`app/src/components/TableRows.svelte:108`.

A keystroke on `#/search` does two things. The scan I can measure: filtering
1,091 records over 322,350 characters of `ru`, `en`, `rud` and `ende` text,
measured on this host in Node, 300 passes each:

| query | ms per keystroke | matched | rendered |
|---|---|---|---|
| one common Cyrillic letter | 1.10 | 1055 | 300 |
| Russian for sword, 3 chars | 2.54 | 87 | 87 |
| sword | 2.96 | 36 | 36 |
| Russian for blade, 6 chars | 2.66 | 22 | 22 |
| zzz, no hit | 2.74 | 0 | 0 |

A miss is the worst case, because all four fields get lowercased before
anything can be ruled out; a common letter is cheapest, because the first field
hits early.

The part I cannot measure is the one that almost certainly dominates: the same
keystroke re-renders up to **300 keyed `RowMain` components**, each roughly 25
elements with an image, an `eqLine`, `descParts` and `cardBadges`. The each
block is keyed on `entry.it.id`, so a changed result set destroys and mounts
rows rather than patching them. There is no debounce anywhere:
`SearchBox.svelte:38-41` calls back on every input event, and
`TablesPage.svelte:485-488` does the same for the per-table box.

Why it matters: typing a six-letter Russian word produces six full result-set
rebuilds, and the intermediate ones (one and two letters) are the largest. On a
phone at the usual 4-6x desktop JS cost, the scan alone is 12-18 ms per
keystroke before any painting begins.

Smallest fix: **measure before changing anything.** A puppeteer probe that
opens `#/search`, types a one-character Russian query, and brackets the
keystroke with `performance.now()` plus a `PerformanceObserver` on
`longtask`. `tests/app/driver.js` already has the navigation and readiness
harness this needs. That number decides whether PF2 is worth writing.

Effort/value: an hour for the probe. It is the only thing standing between
this section and an evidence-free optimisation.

### PF2. Search re-lowercases the whole catalogue on every keystroke

`app/src/lib/search.ts:37-49`.

The helper calls `toLowerCase()` per field per record per keystroke - 322,350
characters of fresh string allocation on each one. Measured, same host, same
300-pass method:

- as shipped, worst case (a miss): **2.74 ms**
- against a haystack lowercased once at index time: **0.33 ms**, 8x faster
- one-time cost of building that haystack: **5.93 ms**, 325,623 bytes retained

So the build pays for itself after two keystrokes, and costs about a sixth of
the `data.js` parse it sits next to.

Smallest fix: add a haystack accessor to the `Index` built in
`app/src/lib/data.ts:76-158`, filled from the four text fields lowercased and
joined with a separator no query can contain. `matches` reads it and keeps the
current four-field scan as the fallback for callers holding records the index
does not. The stat line for the 515 records carrying `eq` can go into the same
string, removing the `statLine(it)` build that currently runs for all of them
on every miss. No rendered output changes, so the 110 structural goldens do not
move.

Effort/value: roughly 30 lines plus a test in `search.test.ts`. Do it **after**
the PF1 number, because if the 300-row render is 40 ms then 2.4 ms is noise.

### PF3. Every keystroke in a list note re-serialises every stored list

`app/src/components/ListPage.svelte:550`, `:568`, `:597`, into
`app/src/state/lists.svelte.ts:215-249`, into `:94-109`.

A character typed into a note runs `setNote` or `setMeta`, which ends in
`save()`: a `JSON.parse` of the whole `dhloot.lists.v2` value, then `keepLists`,
then `mergeLists`, then `JSON.stringify`, then a synchronous
`localStorage.setItem`.

Independently, the effect at `ListPage.svelte:112-115` fires `app.syncListUrl`,
which calls `encodeList(l, true)` (`listLink.ts:99-116`, base64 of the entire
list, notes included) and then `history.replaceState`. The list title does the
same: the rename handler at `ListPage.svelte:597` calls `save()` too.

The cost scales with **everything in storage**, not with the edit. Someone with
ten lists pays for ten of them on each character typed into one note of one of
them. It is the only place in the app where cost grows with accumulated user
data, which makes it the one thing here that gets worse over time rather than
staying flat.

I could not put a number on this: the expensive half is a synchronous
`localStorage.setItem`, and Node has no equivalent. What would measure it: a
puppeteer probe that seeds `dhloot.lists.v2` with ten lists of sixty entries,
then brackets twenty synthetic keystrokes in the note textarea with
`performance.now()`.

Smallest fix: a trailing debounce of about 150 ms around `save()` and
`syncListUrl`, flushed on blur and in the existing `onDestroy`
(`ListPage.svelte:117-119`). The in-memory list is already updated
synchronously, so nothing on screen waits. One caveat belongs in the commit
message rather than in code: the two-tab merge in `STATE.md` reads storage at
save time, and a debounce widens the window in which another write has not yet
been folded in. The merge still runs at flush, so the rule holds; the window
just gets longer.

Effort/value: small diff, and the finding whose value grows rather than decays.
Measure first, same as PF2.

### PF4. The image folder ships 640x640 originals to 60 px rows and 168 px tiles

`app/src/components/RowMain.svelte:59-67`, sized 60x60 by the rule at
`:126-133`; `app/src/components/TableRows.svelte:176-182`, whose grid is
`minmax(168px, 1fr)` at `:313`.

Numbers: 876 files, 30 MB on disk, mean **34,719 B**, max **100,232 B**
(`img/f95.webp`). Intrinsic size verified as 640x640 on a 60-file sample, all
of them `VP8 640x640`. Live: `img/ci1.webp` is **36,936 B**, correctly served
as `image/webp` with no second compression layer.

Scrolling `#/tables/eq_weapon` in grid view to the bottom therefore pulls 317
tiles, roughly **11 MB**, to paint pictures 168 CSS px wide - about 45x the
entire first-load payload of 243 kB gzip for HTML plus both scripts.

What is already right and should not be fixed: both image sites carry
`loading="lazy"` and `decoding="async"`; the tile wrapper has `aspect-ratio: 1`
(`TableRows.svelte:362-367`) and the row image is a fixed 60x60, so neither can
shift layout. This is bytes and decode, never CLS.

Smallest fix: a build-generated small derivative, say a 192 px variant under
`img/t/`, plus `srcset` and `sizes` on those two image tags. The 640 source has
to stay: `PrintCard.svelte:245-255` prints it at 63 mm, which is about 744 px
at 300 dpi, and `RecordCard` shows it full width.

Effort/value: the largest byte saving available by an order of magnitude, and
also the most expensive to land. It adds a generated artefact under a new asset
path, and `CONTRACTS.md` freezes asset paths - so it arrives with
`docs/fixtures/`, `tests/contracts.js`, `CONTRACTS.md` and `llms.txt` updated in
the same commit, plus about 2 MB of new files in the repository. Worth doing as
its own ticket; not a campsite fix.

---

## Checked and correct - no action

### PF5. First load

Measured live, 2026-09-17:

| asset | gzip over the wire | raw |
|---|---|---|
| `index.html` | 2,120 B | 4.6 kB |
| `assets/app.js` | 92,033 B | 307,354 B |
| `data.js` | 148,860 B | 661,404 B |
| **total** | **243,013 B** | about 973 kB to parse |

Both scripts are deferred in the document head (`dist/index.html:42-43`), so
they download in parallel and execute in order - the correct shape. A `data.js`
re-eval measured at **32.1 ms** in Node here; a mid-range phone is commonly
4-6x that, so 130-190 ms of main thread before anything can be indexed. The
`byId` pass inside `buildIndex` is **1.27 ms**, free by comparison.

Nothing paints before both finish: the CSS ships inside the bundle
(`dist/index.html:39`) and the mount point is empty. That is what the
`file://` law forces (`META.md` section 4), and the only fix is an inlined
skeleton, which is a redesign. No action - but this is the number to quote at
anyone who proposes adding to `data.js`.

Compression: a request carrying `Accept-Encoding: gzip, deflate, br` comes back
`content-encoding: gzip`. GitHub Pages does not negotiate Brotli, which would
take `data.js` down maybe another 15%. Nothing in this repository can turn it
on, and the alternative is a different host, which the no-backend law
forecloses.

Caching: `cache-control: max-age=600` with an `etag`. Content-hashing
`assets/app.js` would gain nothing - the 600 s cap applies either way, and
revalidation is already a 304 on one HTTP/2 connection.

### PF6. help.ts and dict.ts in the bundle

`app/src/lib/help.ts` is 35,570 B source and **11,663 B gzipped**;
`app/src/lib/dict.ts` is 30,026 B and **10,763 B gzipped**. Together about
22 kB of the 91.2 kB gzip bundle, roughly 9% of the 243 kB first load, both
languages always.

`dict.ts` cannot be deferred and costs nothing: every label on the first screen
comes from it, and `dict()` is a two-entry object lookup
(`app/src/lib/dict.ts:637-641`), not a build.

`help.ts` is only reachable from the help buttons, so deferring it is the right
instinct - and it cannot be done by code splitting. `vite.config.mts` pins the
output format to `iife` with a single entry file name precisely because Chrome
will not load ES modules over `file://`, so rollup has no chunk to emit and a
dynamic import has nothing to fetch with. A hand-rolled second classic script
injected on demand would work from a folder, but it buys 11.7 kB gzip - about
5% of first load - for a second build plugin, a second published asset, and a
new failure mode when that asset 404s.

**No action.** The budget has 29 kB of headroom, and this is the cheapest 22 kB
in it.

### PF7. Print fitting is linear, and one CSS declaration is why

`app/src/components/PrintCard.svelte:81-134` is the fit; the per-card effect is
at `:136-141`; the cap is `app/src/lib/hash.ts:17`.

Per card the ladders are bounded. Each strip cell steps its font down at most
8 times, each step calling `Range.getBoundingClientRect()` on 2-3 value
elements; then the text ladder runs at most 5 + 11 + 4 = 20 steps, each reading
`scrollHeight` and `clientHeight` immediately after writing a style. That is
roughly 70 forced style-and-layout passes per card, about 12,600 at the
180-card cap.

It does **not** become quadratic, and the reason is one line:
`PrintCard.svelte:287` sets `container-type: size` on the card, which implies
`contain: layout style size`. Each forced pass therefore re-lays one 63x88 mm
card rather than a twenty-sheet document. Weaken that declaration - to
`inline-size`, say, or drop it while moving the `cqw` units elsewhere - and the
same unchanged loop becomes quadratic in card count.

Unmeasured, and it needs a browser. What would measure it: `performance.now()`
around the effect flush after navigating to a 180-id print hash, run once as
shipped and once with `container-type: inline-size`, which isolates what the
containment contributes.

Also correct and not to be fixed: the print card images carry no
`loading="lazy"`. A lazily-loaded image that has not loaded prints blank, so
eager is the right choice on this screen alone.

Recommendation: no code change. The comment at `PrintCard.svelte:62-80`
carefully explains the arithmetic - copy it, do not improve it - and says
nothing about the containment that keeps the whole loop affordable. One clause
there would protect the thing that actually matters.

---

## Noticed, not worth it

- `SearchPage.svelte:56-59` filters the whole catalogue and then slices to 300.
  For a single common Russian letter that evaluates 755 records whose result is
  discarded - but measured at **1.10 ms** for that query, against 2.74 ms for a
  miss that cannot early-exit at all, so the saving is a few tenths of a
  millisecond. Only worth folding in alongside PF2, never on its own.
- `listLink.ts:210` runs an array membership test inside the note loop: entries
  times notes. A 100-entry list with 100 notes is 10,000 string compares.
  Microseconds. Leave it.
- `TableRows.svelte:78` recomputes the select-all state over every entry
  whenever any row is ticked: at worst 317 set lookups. Microseconds.
- `TablesPage.svelte:292-302` filters the result list once per tier, so a
  keystroke on `#/tables/eq_weapon` runs 4 x 317 = 1,268 predicate calls where
  one grouping pass would run 317. Invisible against the row render.
- `img/_none.webp` is 27,688 B for a placeholder. One URL, cached after first
  use, and - per premise 4 above - reached only on a genuine load failure.
- `app/src/state/app.svelte.ts:325-327`: `route` is a plain getter, so it
  re-parses the hash on every read, and `App.svelte:49-77` reads `route.kind`
  once per else-if branch - up to nine parses per render pass, plus `ids` and
  `dropped`. On a print route each parse runs `printAsked`
  (`hash.ts:58-67`) over the segment: a fresh set and up to 180 catalogue
  lookups, so roughly 2,000 map lookups per render pass to re-answer an
  unchanged question. Almost certainly under a millisecond, and I did not
  measure it. Listed only because the fix is one line - `route` becomes a
  derived class field, which a `.svelte.ts` file already supports - and it
  changes no rendered output. Campsite-grade, not a performance finding.

## Noted, out of scope

- **Virtualising the row lists.** 317 is the largest list the app ever draws,
  and virtualisation would change rendered output, which moves the 110
  structural goldens. Not proportionate to the problem.
- **Brotli and long-lived cache headers.** Both need a host that is not GitHub
  Pages, and a host is a backend. Separate ticket if the constraint ever
  changes.

## Order of work, if any

1. PF1 - build the browser probe. Everything below depends on its number.
2. PF3 - debounce the list writers, if the probe confirms the keystroke cost.
3. PF2 - the search haystack, same condition.
4. PF7 - one clause of comment, free.
5. PF4 - its own ticket, with the contract update it requires.
