# DEBT.md - defects kept on purpose, owed to a named task

A live defect the app ships on purpose, with the task that owes its fix. Each
entry reads **Where** / **What** / **Why deferred** / **How to verify the
fix**, is written in the batch that decides to defer it, and is deleted by
the batch that pays it. Sections are the tasks that owe the entries; a
section with no entry left is deleted. A kept design is a decision
(`docs/decisions/`), not an entry; a refactor question with no
user-visible defect does not belong here. Why this file is the home:
`docs/DECISIONS.md`, "Kept defects live in `docs/specs/DEBT.md`, grouped by
the task that owes them".

## Shared page build cost (no task filed yet; the owner names the release)

Owns: the cost of building every linked record of a shared page on each
read, at up to three times the default limits.

### D111 - a shared page of 300 of the longest linked records nears the anon timeout

- **Where**: `get_shared_list(text, bigint)` and its `(text, bigint, jsonb)`
  overload (`supabase/migrations/20261015120000_shared_list_have.sql`), which
  build every linked entry's record with `homebrew_item_record`; the todo case
  in `tests/db/list-shares.test.mjs`.
- **What**: one list of 300 entries at three times the limits, each linked to
  its own item with the longest record the validators allow (about 81 KB with
  its source and four cards), read as `anon`: the median of three calls, measured
  2026-10-16 on this host in three runs, 1550-2120 ms for the two-argument form
  and 2305-3237 ms for the overload with `p_have = {}`; the overload reached
  3774 ms once in the 2026-10-21 `check:db` under host load. The hosted `anon`
  statement timeout is 3 s (read on the test project), so the first read of
  such a page may stop there; a re-read that names every held record sends no
  snapshot but still builds each record to hash it. Real records are about
  2 KB, and at the default limits a list holds 100 entries.
- **Why deferred**: the fix (a cached record text or hash per item, or a bound
  on the bytes a page builds) changes the projection's path, a design of its
  own. Since `debt-cleanup` the port answers a `57014` from the overload
  with one read through the two-argument form (`shares.read` in
  `app/src/ports/supabase.ts`), which restores the cost of before the overload;
  the entry stays for the live build of every linked record. `debt-cleanup`
  closed on 2026-10-21 without this fix, which needs a release of its own.
- **How to verify the fix**: the todo case passes (drop its `todo`), with
  both medians in its log line under 1500 ms, and `explain (analyze)` of each
  call on the hosted test project gives the server-side time under 1500 ms.

## Legacy removal (`persist-10-legacy-removal`)

Owns: the removal, after the cutoff, of the `#/l/` codec, the browser list
store and all move support (`LegacyMove`, `MoveNotice`, `MoveStatus`,
`StorageNotice`, the move's RPC path), and a planned decision on whether a
migration drops `move_legacy_list` and `lists.legacy_fingerprint`
(`docs/DECISIONS.md`, "R10 removes browser lists and the move; an old
`#/l/` link is not found").

### D64 - focus falls to `body` when a `MoveNotice` button hides its banner

- **Where**: `app/src/components/MoveNotice.svelte` («Скрыть напоминание» on
  the move banner, «Скрыть» on the moved-lists notice).
- **What**: each press removes the element that has focus, and nothing moves
  focus elsewhere, so focus falls to `body`. A keyboard reader's next Tab
  starts again from the top of the page, and a screen reader announces nothing
  about where focus went.
- **Why deferred**: R10 removes `MoveNotice` with both of its buttons, so a
  focus fix would be deleted with it. The account menu's «Выйти», the other
  half of this entry, follows rule 20 since `debt-cleanup` (`FEATURES.md`,
  "Consistency rules").
- **How to verify the fix**: R10 deletes `MoveNotice.svelte`; `git grep -n
  MoveNotice -- app/src` finds nothing, and this entry goes with it.

### D62 - `move_legacy_list` adds lists and entries past every count limit, with no bound

- **Where**: `move_legacy_list` and the `dhloot.move` guard in `lists_limit`
  and `list_entries_limit`,
  `supabase/migrations/20260925130400_legacy_move.sql`.
- **What**: a move skips the count limits, so every browser list reaches
  the account whole. The skip has no bound of its own: a scripted
  signed-in caller can add lists and entries past every limit through
  `move_legacy_list`, up to 5000 entries per call, with no bound on the
  number of calls.
- **Why deferred**: owner decision, 2026-09-26. A genuine browser list is
  bounded by the catalog (about 1300 records, each id at most once), and
  the rows count against their owner only. From R10 the app never calls
  the move again (owner, 2026-09-27), so only a scripted caller reaches it.
- **How to verify the fix**: R10 - either a migration drops
  `move_legacy_list` (and the `dhloot.move` guard in both limit triggers),
  and `tests/db/` confirms that a signed-in call is refused as an unknown
  function and that a list or entry past a limit is refused; or, if R10's
  plan keeps the function, confirm that `authenticated` has no EXECUTE on
  it. Close this entry in the batch that does either.

### D63 - the move's status says «нет связи» for a failure that is not the network

- **Where**: `app/src/components/MoveStatus.svelte` (the `failed` branch),
  `moveFailed` in `app/src/lib/dict.ts`, `LegacyMove#run` in
  `app/src/state/legacyMove.svelte.ts`.
- **What**: every run that ends `failed` draws «Не все списки перенесены:
  нет связи. Попробуем при следующем открытии.», also when the cause is a
  user switch during the run, a row missing from the read-back, or a
  refused storage write in `settleMove` (a full quota). With a full quota
  each retry calls `move_legacy_list` for every list again, answers
  `inserted: false` and removes nothing. No data is lost: the browser
  lists stay, and the account holds each moved list once.
- **Why deferred**: found in the last review of the move, after its texts
  were settled; every cause but the quota ends at the next run, and the
  quota case needs its own text and a way out for the reader. R10 removes
  `LegacyMove` and `MoveStatus` (owner, 2026-09-27), so the text goes with
  them.
- **How to verify the fix**: R10 - confirm that no file under `app/src/`
  holds `MoveStatus`, `LegacyMove` or `moveFailed`, and close this entry
  in that batch.

### D24 - a second `dhloot.lists.v2` corruption is never backed up, and the first backup is orphaned forever

- **Where**: `app/src/state/lists.svelte.ts`, `ListStore#readCurrent`.
- **What**: the first unreadable `dhloot.lists.v2` value is backed up once,
  under `dhloot.lists.v2.bad` - `get(LISTS_KEY_BAD) === null` guards it, on
  purpose, so this tab's own next successful write does not overwrite the
  one copy of what was actually lost. The guard has a consequence nothing
  else in the code addresses: once that key reads back as valid again (this
  tab's own next `save()`, or another tab's write), `unreadable` clears and
  the storage notice stops warning - but the `.bad` backup stays sitting
  there, orphaned for good. A **second** corruption after that point is not
  backed up at all (the guard still finds `.bad` occupied by the first one)
  and `save()` writes straight over it, while the notice tells the reader
  their data survived.
- **Why deferred**: the real fix needs a backup keying scheme and a way for
  a person to reach a backup. R5 (`persist-5-migration`) paid the part a
  reader can lose: the move's one-time notice names a `.bad` backup and the
  contact address, and the browser list store is written only by the move
  and by a delete after the cutoff. The backup cannot be moved: its only
  writer stores a value that failed `JSON.parse`. R10 removes the browser
  list store and deletes this entry.
- **How to verify the fix**: R10 - confirm that no code reads or writes
  `dhloot.lists.v2` or its `.bad` key.
- **Copy** (was D31): `app/src/lib/dict.ts` `badStorage` (`ru`, `en`) tells
  the reader their unreadable data is kept "under a separate key", which no
  one can act on outside devtools. Rewrite it once a backup is reachable.

## Cloudflare Pages move (`cloudflare-pages`)

Owns: what the site host cannot do while the site sits at a subpath of
GitHub Pages: a robots file at a host root and an `X-Robots-Tag` header.

### D104 - the site's robots.txt is read by no crawler, and its text files carry no noindex

- **Where**: `robots.txt` on the GitHub Pages host
  (`https://artex-x.github.io/daggerheart-loot/robots.txt`), and the text
  files `llms.txt`, `data.json`, `catalog.csv`, `catalog-index.csv`,
  `names.json`, `schema/*.json`.
- **What**: a crawler reads robots.txt only at a host root, and
  `https://artex-x.github.io/robots.txt` answers 404, so the eight named
  blocks and the `Content-Signal` line have no effect on the site host;
  GitHub Pages sends no `X-Robots-Tag`, so the text files carry no
  `noindex`. The old host keeps these files and this `robots.txt` with the
  same bytes for good (`CONTRACTS.md` section 5), so there the blocks and
  the signal stay unread and the files carry no `noindex` after the move
  too.
- **Why deferred**: owner, 2026-10-15: no root file for `artex-x.github.io`.
  The move to Cloudflare Pages pays the new host only: it puts the site's
  file at a host root and adds the header there. The old-host half is an
  accepted trade-off of the decision "AI assistants read a compact index and
  the record pages".
- **How to verify the fix**: `curl https://daggerheart-loot.pages.dev/robots.txt`
  returns the site's own file: its "Readable data" comment, the
  `Content-Signal` line and the named blocks;
  `curl -I https://daggerheart-loot.pages.dev/llms.txt` shows
  `X-Robots-Tag: noindex`.

## Many Worlds Tavern follow-ups (no task filed yet; the owner names the release)

Owns: three small defects left by the Many Worlds Tavern sources: a missing
landmark, a strip over its cap at mid widths, and a rule text with two Russian
bodies. No release plan owns them; the owner decides which one takes them.

### D112 - the tables page chip panel has no navigation landmark

- **Where**: `app/src/components/TablesPage.svelte` (`div.panel.tablenav`, the
  group chips and the book subchips).
- **What**: the chip panel is a `div`, not a `nav`, so a screen reader lists
  no navigation landmark for the tables page.
- **Why deferred**: found in the review of the supplements panel (2026-10-20).
  A `nav` with a label changes the goldens of every tables page and the
  landmark list of the axe checks, so the fix is its own change.
- **How to verify the fix**: `#/tables/mwt` exposes one `navigation` landmark
  with an accessible name around the group and book chips; `tablesPage.test.ts`
  asserts it, and the goldens of the tables pages are re-seeded.

### D113 - the tables strip measures 162 px against its 150 px cap from 500 to 767 px

- **Where**: `.tablenav .chips` in `app/src/components/TablesPage.svelte`;
  the cap is in `docs/specs/FEATURES.md`, "Rolling" (150 px under 1000 px),
  and `tests/app/sweep.js` (`WIDTHS`).
- **What**: between 500 and 767 px the strip is 162 px high for every chip
  set, the set before the Many Worlds Tavern tasks included (measured
  2026-10-21 in the built app). The cap holds at 360, 390, 768 and 1180 px.
- **Why deferred**: `sweep.js` runs only those four widths, so no run sees the
  gap. It is today's state, not a change of the Many Worlds Tavern tasks, and
  the owner did not ask for a fix (2026-10-21).
- **How to verify the fix**: the sweep measures the strip at 500, 600 and 767
  px and finds at most 150 px at each width.

### D114 - the Scary rule text has two Russian bodies

- **Where**: `data.js`, records `q57`, `q74`, `q90` (body «При успешной атаке
  по цели, она должна отметить Стресс.») and `mw22` (body «При успешной
  атаке цель должна отметить Стресс.»). Arazo's `aa47`-`aa50` carry the same
  body under the name «Сводящее с Ума» (English "Maddening").
- **What**: one English rule text, "On a successful attack, the target must
  mark a Stress.", reads in two Russian ways. The name «Устрашающее» is the
  same in all four records.
- **Why deferred**: the older bodies belong to shipped Core and Hope and Fear
  records; a change of their Russian moves their goldens and the `names.json`
  bytes, and the owner has not chosen which body stays.
- **How to verify the fix**: `q57`, `q74`, `q90` and `mw22` carry
  one Russian body, the one the owner chooses.
