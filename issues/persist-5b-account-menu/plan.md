# Plan - TASK persist-5b-account-menu (release R5b: the account menu, display settings, the Lists tab)

## Status

- Planned 2026-09-26 by the R5 refresh (`persist-5-migration`, planning
  pass 3), from R5's plan sections 4.9 and 9b as the owner settled them on
  2026-09-26; this file stands alone, because R5's task directory is
  deleted at R5's closeout, before R5b ships.
- Not started. Dispatched after R5's push and deploy; live before the
  cutoff, Monday 2026-10-26 (the Lists tab leaves the bar that day, so the
  menu's «Мои списки» must be live first).
- NEEDS_HUMAN_CONFIRMATION: no (owner, 2026-09-26: the menu ships as its
  own release R5b, right after R5).
- Batches: `B5b.1` (section 6; implement-ready once the section 9 refresh
  re-reads R5's final tree), closeout (section 8). Gate cost: section 7.
- Roadmap: `issues/persistent-storage/plan.md` sections 9, 12, 14, 16
  (decision 31, the R5 closeout record), 17 ("Carried from R5"). R5's task
  directory left the tree at R5's closeout; what this release needs from
  it is in section 3 below and in the roadmap's section 17.

## 1. Objective and current state

Owner, 2026-09-26: the header's account control opens a menu «Настройки
отображения», «Мои списки», «Мои предметы» (R7), «Выйти»; the Lists tab
leaves the bar at the cutoff (lists are account-only then); «Настройки
отображения» supersedes the roadmap's "not in v1: a preferences page" -
the smallest form over the existing `user_prefs` settings. Decision file:
`docs/decisions/2026-09-26-the-account-control-opens-a-menu-display-settings.md`.

State on `main` at `d879c9a4` (R2 live; R5 not yet built):

- `Shell.svelte`: the account control is a link `a.acct` to `#/account`
  («Войти» signed out; signed in the email's first letter, `class="acct
  in"`, `aria-label` «Аккаунт: <email>» from `app.t.account`), the gold ring
  on `#/account`.
- `TabBar.svelte` `TABS`: ten entries, `lists` among them.
- `AccountPage.svelte`: `Field heading` panels, a page-local
  `signOut(scope)` inside its `busy` wrapper (it calls
  `cloud.auth.signOut(scope)`), `deleteAccount`; no settings section.
- `AppState`: `setLang`, `setTablesView`, `setPrintBW`, `setPrintCompact`,
  `toggleHome`/`pinOf`; `lib/prefs.ts` `Prefs`, `readPrefs`.
- `lib/dict.ts` `SECTION_LABEL` (the ten section labels).
- `tests/e2e/flows.mjs` F2 reads the control as a link (`header
  a[href="#/account"]`'s `aria-label`); `shell.test.ts` "the account control".

## 2. Scope and non-goals

In scope: the account menu («Аккаунт», «Мои списки»,
«Выйти»), `AppState.signOut`/`setHome`/`notifyGm`/`setNotifyGm`, the
Display section of `#/account`, the Lists tab gone after the cutoff, texts,
specs, tests, goldens, F2.

Non-goals: «Мои предметы» (R7 adds it between the second and the third
item); any route change; any change to the move or the read-only mode (R5);
provider buttons in the menu; sign-in inside the menu; a settings page for
signed-out readers; a `#/account/display` route.

## 3. What R5 leaves that this release uses

Re-read in the section 9 refresh against R5's code on `main`; the list
below was checked at R5's closeout (2026-09-26).

- `AppState.legacyWritable` (false from 2026-10-26 00:00 UTC in a build
  with a cloud), `env.clock`, the test build's `?today=YYYY-MM-DD`
  (default pinned to 2026-10-01 12:00 UTC), `tests/app/driver.js`
  `open(route, { as, today })` and `moveSettled()`, `golden.js`'s
  `# today:` line.
- `MoveNotice.svelte` between the header and `<main>` in `Shell.svelte`.
- The after-date states R5 adds (`#/lists ~ read-only`, `#/lists/a ~
  read-only`, `#/l/ ~ retired`, `#/l/ ~ own list, retired`): their
  goldens show ten tabs until this release.
- `tests/app/states.js` cases 1-49 (47 the automatic move, 48 read-only,
  49 the account write buffer), `tests/app/inventory.js` 181 states, E2E
  F0-F10, contract cases A-I, CI `browser` at five shards. This release's
  case is 50.
- `AppState.signOut(scope)` exists since R5: it sends the account's
  buffered writes first, for at most `SIGN_OUT_WAIT_MS` (5 s), then calls
  `cloud.auth.signOut(scope)`; `AccountPage.svelte` already calls it inside
  its `busy` wrapper. The menu's «Выйти» calls it; step 2 extracts nothing.
- `AppState.localWritable` (`legacyWritable && !moveDue`) gates the browser
  lists while the move is due; the tab bar reads `legacyWritable`, the date
  alone, so the tab never leaves while a move runs.
- The bundle after R5 (2026-09-26): the configured build 178.2 kB of the
  200 kB budget, the unconfigured build 121.0 kB of 150 kB (decision "The
  bundle budget is 150 kB unconfigured and 200 kB configured").

## 4. Design

- **The control**: signed out, unchanged (the «Войти» link to `#/account`).
  While the session is unknown, unchanged. Signed in, the same 38px circle
  becomes a `<button>` with `aria-label` «Аккаунт: <email>»,
  `aria-haspopup="menu"`, `aria-expanded` and, on `#/account`,
  `aria-current="page"` and the gold ring as today. It opens
  `AccountMenu.svelte`: `role="menu"` with three items - «Аккаунт» (a
  `menuitem` link to `#/account`; owner, 2026-09-26: the page holds more
  than display settings, so the item takes the page's title), «Мои списки»
  (`#/lists`), «Выйти» (a `menuitem` button calling `app.signOut('local')`,
  the toast «Вы вышли из аккаунта.»; on an account list's page
  `#listsSignedOut` already replaces the address with `#/lists`). Closes on
  a choice, Escape (focus back to the control), an outside click and a
  navigation; Up/Down/Home/End move between items. Its box reuses
  `AddToList.svelte`'s `.dropmenu` values (border `--line2`, radius 11px,
  the `--surface` ground, the drop shadow), right-aligned under the
  control. `AppState.signOut(scope)` is extracted from
  `AccountPage.svelte`'s `signOut` (its second real use); the page keeps its
  `busy` wrapper.
- **Display settings**: `AccountPage.svelte` gains, signed in, a first
  section «Отображение» / "Display" (a `Field heading` panel before «Вы
  вошли как»; the page subtitle `accountSub` names it first: «Отображение,
  способы входа, выход и ваши данные.» / "Display, sign-in methods,
  signing out and your data."): «Язык» - the `Seg` RU/EN (`app.setLang`); «Раздел
  при запуске» - a `<select>` over the ten sections (`SECTION_LABEL`), the
  pinned hash selected, `#/roll/std` by default; a pinned `#/tables/<t>`
  shows as «Таблицы» and keeps its hash until changed; the change calls the
  new `AppState.setHome(hash)` (writes `dhloot.home.v1` or removes it for
  the default, then `#changed()`, the same as `toggleHome`); «Таблицы» -
  the `Seg` «Списком» / «Сеткой» (`setTablesView`); «Печать» - the `Seg`
  «Цветная» / «Чёрно-белая» (`setPrintBW`) and a checkbox «Компактный
  лист» (`setPrintCompact`); «Сообщать владельцу списка» / "Notify the list
  owner" - the remembered choice of R4's "Notify the GM?" question
  (`user_prefs.notifyGm`: «спрашивать» / «всегда» / «никогда», a `Seg` of
  three; owner, 2026-09-26), read and written through a new
  `AppState.notifyGm` getter and `setNotifyGm` (`Prefs` and `readPrefs`
  gain `notifyGm?: 'ask' | 'always' | 'never'`, default `ask`; account-only,
  no local key); R4's flow reads that field instead of adding a control
  elsewhere. Every control writes through the setters the pages already
  use, so the account row follows (`docs/specs/STATE.md`, "Account
  preferences"); the page's `busy` state does not cover them. The page
  title stays «Аккаунт»; no route is added.
- **The Lists tab**: `TabBar` takes `tabs` from `Shell`, which leaves
  `lists` out when `!app.legacyWritable`. `#/lists` stays a readable route
  (the menu's «Мои списки», bookmarks, the pin, R5's retired page's
  button); no route, fixture or `tests/contracts.js` change.
  `docs/specs/ROUTES.md` "Sections" gains the sentence: from the cutoff the
  tab bar draws nine of them, and `#/lists` is reached from the account
  menu. The `tab` field of `#/lists` in `docs/fixtures/urls/routes.json`
  stays while the test build is pinned before the date; R10 sets it to
  `null` in its contract batch.
- **Goldens**: every `as gm1`/`as gm2` state re-seeds once for the header
  button (the role and the `aria-haspopup` change: 20 states at `d879c9a4`,
  plus the signed-in states R5 adds); R5's four after-date states re-seed
  with nine tabs; `#/account as gm1`/`as gm2` gain the Display section; new
  states `#/roll/std ~ account menu as gm1` (open) and `#/account ~ display
  as gm2`. F2 (E2E) reads the button's `aria-label`.
- Mock: `mocks/b53-account-menu.html` on `mocks/mock.css` (frame A the menu
  open, frame B the Display section, frame C the nine-tab bar after the
  date; open from disk). Where the mock and the real components differ,
  the components win (as in R2).

## 5. Contracts and behaviour that stay stable

- No public-contract change: no route, fixture or `tests/contracts.js`
  edit; `#/lists` stays a section route.
- `#/account`'s existing sections, order and texts stay; the Display
  section is added before them.
- The account preferences' keys and precedence stay; the Display section
  is a second writer of the same keys (`STATE.md`).

## 6. Batch `B5b.1` - the account menu, display settings, the Lists tab

Objective: section 4.

In scope: `Shell.svelte`, the new `AccountMenu.svelte`, `TabBar.svelte`,
`AccountPage.svelte`, `AppState.signOut`/`setHome`/`notifyGm`, `lib/prefs.ts`,
texts, specs, tests, goldens, F2. Out of scope: «Мои предметы» (R7), any
route change, any change to the move (R5).

Files: `app/src/components/AccountMenu.svelte` (new), `accountMenu.test.ts`
(new), `Shell.svelte`, `shell.test.ts`, `TabBar.svelte`, `AccountPage.svelte`,
`accountPage.test.ts`, `a11y.test.ts`, `state/app.svelte.ts`, `app.test.ts`,
`lib/prefs.ts`, `prefs.test.ts`, `lib/dict.ts`, `tests/app/inventory.js`,
`states.js`, `tests/e2e/flows.mjs`, `docs/specs/FEATURES.md` ("Account",
"Chrome"), `ROUTES.md` ("Sections"), `STATE.md` ("Account preferences"),
`COVERAGE.md`.

Steps:

1. `dict.ts`, both languages: `menuLabel` («Меню аккаунта» / "Account
   menu"), the existing `account` («Аккаунт» / "Account") for the first
   item (no new key), `accountSub` changed as section 4, `menuLists` («Мои списки» / "My lists"), `displayHead` («Отображение» /
   "Display"), `displayLang` («Язык» / "Language"), `displayHome` («Раздел
   при запуске» / "Section on start"), `displayTables` («Таблицы» /
   "Tables"), `displayPrint` («Печать» / "Print"), `printColour` («Цветная»
   / "Colour"), `printCompactBox` («Компактный лист» / "Compact sheet"),
   `displayNotify` («Сообщать владельцу списка» / "Notify the list
   owner"), `notifyAsk` («спрашивать» / "ask"), `notifyAlways` («всегда» /
   "always"), `notifyNever` («никогда» / "never"); `signOut`, `viewList`,
   `viewGrid` and the black-and-white label reused.
2. `state/app.svelte.ts`: `signOut(scope)` exists since R5 (section 3;
   `AccountPage.svelte` already calls it inside its `busy` wrapper, and the
   toasts stay on the page; the menu shows the same
   `signedOut`/`accountFailed` toast); `setHome(hash)` (a hash `pinOf`
   accepts; the default removes the key; `#changed()`); `notifyGm` getter
   and `setNotifyGm(v)` over a new `#notifyGm` field seeded `ask`, applied
   by `#applyPrefs` and saved by `#saveAccount` (`lib/prefs.ts`:
   `Prefs.notifyGm`, `readPrefs` accepts the three values only; signed out
   the row is not drawn); `menuOpen = $state(false)` closed by `go()` and
   the router's change handler. `app.test.ts` and `prefs.test.ts`: all of it.
3. `AccountMenu.svelte` (props `app`, `onclose`): `role="menu"`, three
   `role="menuitem"` entries as section 4, Up/Down/Home/End between them,
   Escape and an outside click close and return focus to the control, a
   choice closes. Box: `AddToList`'s `.dropmenu` values, right-aligned
   under the control, `min-width` 220px. `accountMenu.test.ts`: the items
   and their targets, «Выйти» calls `app.signOut('local')`, keyboard and
   outside close, axe open.
4. `Shell.svelte`: signed in, the control is a `<button>` (section 4)
   toggling `app.menuOpen`; the menu mounts under it; `TabBar` takes `tabs`
   (the ten less `lists` when `!app.legacyWritable`). `shell.test.ts`: the
   button's name, `aria-haspopup`/`aria-expanded`, the menu opens and
   closes, the signed-out link unchanged, nine tabs after the date (a
   fixed clock in `fakeEnv`), `aria-current` on `#/account`.
5. `TabBar.svelte`: `tabs` prop (default the ten), the `sep` rule unchanged.
6. `AccountPage.svelte`: the Display section first when signed in
   (section 4), each control bound to the `AppState` getters and writing
   through the setters; the `<select>` labelled «Раздел при запуске»; the
   notify `Seg` of three last. `accountPage.test.ts`: every control reads
   the current value and writes it (the fake storage keys and the fake
   prefs row change; `notifyGm` reaches the row and nothing local), the
   pinned table case, the section absent signed out, axe. R4's planner
   refresh reads `app.notifyGm` and drops its own "remembered nowhere else"
   line.
7. `inventory.js`: new states `#/roll/std ~ account menu as gm1` (`enter`:
   press the control; the three items) and `#/account ~ display as gm2`
   (the section with `gm2`'s values); the existing `as gm1`/`as gm2`
   states and R5's four after-date states re-seed; `states.js` case 50: the
   menu opens, Escape returns focus to the control, «Мои списки» lands on
   `#/lists`, «Выйти» from `#/lists/<uuid(101)>` lands on `#/lists` signed
   out with the toast; case 48 (R5's read-only case) gains: the tab bar has
   nine links and none reads «Списки»; the header count moves by one. F2
   reads `header button[aria-haspopup="menu"]`'s `aria-label` («Аккаунт:
   <email>»).
8. Specs: `FEATURES.md` "Account" (the Display section, "There is no
   settings page" replaced), "Chrome" (the control and the menu; the nine
   tabs after the date); `ROUTES.md` "Sections"; `STATE.md` ("Account
   preferences": the section is a second writer of the same keys);
   `COVERAGE.md` rows (the new files, case 50, the state count).
9. Gates: section 7.

Acceptance:

- Signed in, the control opens a menu with exactly «Аккаунт»,
  «Мои списки», «Выйти» in that order; keyboard and pointer close it as
  section 4; «Выйти» signs out with the toast and, from an account list's
  page, lands on `#/lists` (case 50, `accountMenu.test.ts`, `shell.test.ts`).
- Signed out the control is today's «Войти» link (goldens unchanged for
  signed-out states but the tab count after the date).
- `#/account` shows the Display section first with the six controls, each
  reading and writing the account-synced setting; the pin's rule holds;
  `notifyGm` is in the account row only, `ask` by default
  (`accountPage.test.ts`, `prefs.test.ts`, golden `~ display as gm2`).
- After the date the tab bar has nine tabs and `#/lists` still opens
  (case 48's tab check, `shell.test.ts`, R5's after-date goldens re-seeded).
- F2 green against the button; every `as` golden re-seeded once; axe on
  the open menu and the Display section.
- The configured bundle stays within its budget (`.claude/README.md`, "The
  configured bundle budget"); the output line recorded in the handoff.

Risks / do-nots: no new route; no provider buttons in the menu; do not
move sign-in into the menu; keep `AccountPage`'s `busy` semantics; the
menu never draws while the session is unknown.

## 7. Gates and cost

| Gate | Cost (this host, idle; `.claude/README.md`, "Batch size and the fixed cost of a run") |
|---|---|
| `rtk npm run check` (Bash, timeout 600000), twice | 12 min |
| `rtk npm run build:test`, `rtk npm run check:built` | 2 min |
| `rtk node tests/run-all.js app/states` | 4 min |
| `node tests/app/golden.js --shard=n/4 --update`, one call per shard, then the diff read golden by golden | 12-17 min |
| `rtk node tests/app/sweep.js 360` | 7 min |
| `npm run e2e` (the test project; one run at a time) | 1 min |
| the configured budget line (`.claude/README.md`, "The configured bundle budget") | 1 min |

About 40 minutes, one green pass. Review: required (new UI on every
page). One batch: one component set (`Shell`, `AccountPage`, `TabBar`, the
menu) and one seed family; no split criterion applies.

Bundle risk: after R5 the configured build is 178.2 kB of 200 kB and the
unconfigured 121.0 kB of 150 kB (section 3). If this batch would pass
either budget, stop and report: the fix is D60's slimmer client
(`docs/specs/DEBT.md`), not a raised limit.

## 8. Closeout

1. `/handoff` audit; this directory deleted in the task's commit; one
   push of `main` (rebase on `origin/main` first if it moved; never
   force-push).
2. CI: `check`, `browser` (five shards), `db`, `e2e`, `deploy`; the run ids
   in the handoff before the directory goes.
3. The roadmap: R5b's closeout record (`issues/persistent-storage/plan.md`
   section 16); section 9's row.
4. Live before 2026-10-26; if the date is near, the owner decides whether
   the tab stays one more week (the tab only leaves the bar; `#/lists`
   stays reachable).

## 9. Refresh before dispatch

After R5's push, one short planner pass over R5's final tree:

- R5's names in section 3 (`legacyWritable`, `localWritable`,
  `signOut`, `?today=`, `moveSettled()`, the after-date state ids, the
  case numbers 47-49, the state count, F9-F10, contract case I, the shard
  count);
- `Shell.svelte` as R5 leaves it (the `MoveNotice` slot beside the header,
  `data-move` on `<main>`);
- the configured budget line (section 3);
- R5's `DEBT.md` changes (D62 and D63 under the legacy removal; nothing
  routed here) and the roadmap's section 17, "Carried from R5";
- the shard timings of the CI run that deployed R5 (the roadmap's R5
  closeout record).

## 10. Deferred

- To R7: «Мои предметы» in the menu, between «Мои списки» and «Выйти».
- To R10: the `tab` of `#/lists` in `routes.json` set to `null`.
