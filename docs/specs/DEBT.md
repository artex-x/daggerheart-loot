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

## Tool UI redesign (`57`, GitHub issue 57)

Owns: wording left by R10 on pages that the redesign rebuilds (owner,
2026-10-28), and the toast's focus return for its link and move actions.

### D116 - the lists page names its only group «Ваш аккаунт»

- **Where**: `app/src/components/ListsPage.svelte`, the `Field` heading
  `t.groupAccount` («Ваш аккаунт» / "Your account") above the account's
  lists; `app/src/components/listsPage.test.ts` pins the name.
- **What**: the heading told the account group apart from the browser group.
  R10 removed the browser group, so the heading now labels the only group on
  `#/lists`.
- **Why deferred**: owner, 2026-10-28: the redesign rebuilds the lists page,
  and a separate fix would re-seed the lists goldens for one heading.
- **How to verify the fix**: signed in, `#/lists` draws no «Ваш аккаунт» /
  "Your account" heading; the `groupAccount` key is gone from `lib/dict.ts`
  in both languages, and the lists goldens are re-seeded.

### D121 - the focus goes to `body` when a later toast replaces an action toast that held it

- **Where**: `app/src/components/Toast.svelte`, the `$effect.pre` that
  returns the focus; it is keyed on the action's `run`.
- **What**: a person who moved the focus into a toast whose action is a
  link (`href`, «Изменить» after «Свой предмет») or a move (`go`, the
  new-request toast's «Открыть» / «Показать») loses it to `body` when a later
  toast replaces that toast: neither action has a `run`, so the effect does
  not run, and the button leaves the DOM. Rule 20 wants the focus on the
  element it came from, else `#main`.
- **Why deferred**: found in review on 2026-10-29 and placed with the
  owner's UI task: the redesign rebuilds the toast, and one fix covers both
  action kinds there.
- **How to verify the fix**: a component case in `shell.test.ts` for each
  of `href` and `go`: focus moved into the toast, a later plain toast said,
  the focus lands on the element it came from, or `#main` when that is gone;
  `expectNoA11yViolations` at the end.

## Catalog filter links (`catalog-filter-links`, after R10)

Owns: three small defects left by the Many Worlds Tavern sources: a missing
landmark, a strip over its cap at mid widths, and a rule text with two Russian
bodies. The task after R10 that puts the Items-tab filter in the address takes
them (owner, 2026-10-22). It also takes D117, a tables address with a
trailing slash that the host does not answer (implementer default while the
owner was away, task `path-urls`, 2026-10-28).

### D117 - `/tables/` with a trailing slash answers the 404 page

- **Where**: `preview/public/_routes.json` (`exclude: ["/tables", "/en/tables"]`)
  and `preview/public/_redirects` (`/tables / 200`, no rule for `/tables/`).
- **What**: `/tables/` and `/en/tables/` answer `404.html` on the site, while
  the app reads the same address as the tables page (`addressOf` drops the
  slash). Before the `path-urls` landing the worker answered them with a 302
  home. The app never writes the slash form, so only a hand-typed address
  reaches it.
- **Why deferred**: the bare `/tables` had to leave the worker (Pages routes it
  to `/tables/*`, measured 2026-10-28 with `wrangler pages dev`); a rule for
  the slash form is a host change with no reader, and the task that puts the
  table filters in the address rewrites the tables rules anyway.
- **How to verify the fix**: `curl -s -o /dev/null -w "%{http_code}"
  https://daggerheart-loot.pages.dev/tables/` prints `200` with the app
  document (or one 301 to `/tables`), and the same for `/en/tables/`.

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

## Address follow-ups (`path-urls-followups`, not scheduled)

Owns: three small defects left by the move of every address to the path
(task `path-urls`, landed 2026-10-28). The owner names the task that takes
them; until then they stay here.

### D118 - a sign-in return in English can come back in Russian

- **Where**: `app/src/ports/redirect.ts` (the `dhloot.auth.return` record,
  `docs/specs/STATE.md`) and the boot language of `AppState`.
- **What**: the return record holds the route key, not the language. A
  reader on an English address whose storage refuses the `dhloot.lang.v1`
  write signs in through a provider and returns to the root callback
  `<site>?auth-callback=1`, which names no language, so the app opens in
  Russian.
- **Why deferred**: it needs refused storage and a provider sign-in at once;
  adding the language to the record changes a stored shape, which the task
  kept unchanged (found in the plan review of `path-urls`).
- **How to verify the fix**: with `localStorage.setItem` throwing for
  `dhloot.lang.v1`, sign in from `/en/lists` through the fake provider; the
  app returns to `/en/lists` in English.

### D119 - the homebrew editor's English preview links `/en/` on a Russian screen

- **Where**: `app/src/components/HomebrewEditor.svelte`, the `RecordCard`
  previews that take `lang={editIn}`.
- **What**: a preview in the edited language draws its in-card links in that
  language, so an English preview on a Russian screen links `/en/...`. A
  plain click stays in the app in the screen's language; only a link opened
  in a new tab opens English.
- **Why deferred**: found in the `path-urls` review; only a new tab differs,
  and no reader reported it.
- **How to verify the fix**: on a Russian screen, an English preview's links
  read `/...`, not `/en/...`.

### D120 - a typed old fragment of the route on screen stays in the bar

- **Where**: `app/src/ports/router.ts`, `pathRouter`'s `hashchange` handler
  (`hash !== seen` before it announces).
- **What**: typing `#/roll/std` after `/roll/std` names the route already
  showing, so the router announces nothing and the bar keeps
  `/roll/std#/roll/std` instead of the path form.
- **Why deferred**: the screen is right and a reload converts it; found in
  the `path-urls` review.
- **How to verify the fix**: on `/roll/std`, set `location.hash = '#/roll/std'`;
  the bar reads `/roll/std` with no fragment.
