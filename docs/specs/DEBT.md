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

## Catalog filter links (`catalog-filter-links`, after R10)

Owns: three small defects left by the Many Worlds Tavern sources: a missing
landmark, a strip over its cap at mid widths, and a rule text with two Russian
bodies. The task after R10 that puts the Items-tab filter in the address takes
them (owner, 2026-10-22).

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
