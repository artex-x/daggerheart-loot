# Shared task context - TASK debt-cleanup

Orchestrator (or first worker) maintains this file so later steps do not re-fetch the same sources.

## Goal
- Pay the `docs/specs/DEBT.md` entries that are still open when this release runs, outside R10's
  section, and the owner's carries of 2026-10-14/15 (below). Roadmap row `debt-cleanup` in
  `issues/persistent-storage/plan.md`, section 9.
- Dispatch order (owner, 2026-10-14/15): print-snapshots, link-previews, rich-descriptions,
  ai-integration B1, authoring-print-preview, `debt-cleanup`; then `persist-review`, R10. This
  release sorts its migrations after every migration on `main` at its dispatch.

## GitHub issue (if any)
- URL: none (roadmap row, `DEBT.md`, the owner's decisions file).
- Captured or last verified: 2026-10-15, `origin/main` `e4f92f7c` (the refresh before B1).
- Title: Debt cleanup.
- Decisions already settled:
  - Owner rule (2026-10-08): the plan gets a refresh before B1 that re-reads `DEBT.md` (every
    section but R10's), adds new entries and drops paid ones. Done 2026-10-15 (plan Status). Tag:
    home none (task-scoped) - batch: the refresh before B1.
  - Owner (2026-10-01): D64 («Выйти» half) and D66 belong to this task; R10 removes `MoveNotice`'s
    half of D64.
  - Owner (2026-10-02, 2026-10-14): D90 is paid in this release; until then every `check:db` runs
    under the orchestrator's hang guard (decisions file, item 3).
  - Q1 (owner, 2026-10-08, confirmed 2026-10-14): this task takes every `DEBT.md` entry except
    R10's section (D24, D62, D63, `MoveNotice`'s half of D64), including persist-review's entries
    and a real D60 fix (its own batch, `npm run e2e` its gate). Tag: home none (scope) - batches
    B1-B5. Carry: `persist-review` keeps only its consistency re-check; the closeout writes that
    into its roadmap row (B5's acceptance line).
  - Q2 = A (owner, 2026-10-08): D85 by an invoker overload of `get_shared_list` that names
    snapshots by hash. Tag: home a decision file - batch B2.
  - Q3 = A (owner, 2026-10-08): an error or undo toast keeps the slot; a later plain toast waits.
    Tag: home `docs/specs/FEATURES.md`, "Chrome" (the toast paragraph) - batch B5.
  - Q4 = A (owner, 2026-10-08): B1 fixes D61 although D61 sits in R10's section. Tag: home
    `docs/specs/STATE.md` (the settings keys) - batch B1.
  - Owner (2026-10-14, authoring-print-preview Q3): D82 moves to `authoring-print-preview`, which
    ships before this task and deletes D82 and its section. This task does not plan D82.
  - Owner (2026-10-14/15): plan reviews before B1, B2 and B3 (all three).
  - Refresh before B2 (planner, 2026-10-15, recorded defaults): D83's account delete (bounded
    `delete_account_requests()` calls, then `delete_account()`) and D98 (the timed case without
    axe) join B2; B1's nits B1-1..B1-3, B1-5..B1-7 and its two checks go to B2, B1-4 to B4; K16
    to B4 (plan section 10). Tag: homes `FEATURES.md` "Account" and two decision files - batch B2.
  - Refresh before B3 (planner, 2026-10-16, recorded defaults): D83 keeps the bounded request
    calls and gains `analyze` in its 3x case (plan sections 3.11 and 10). Tag: homes the D83
    decision file and `FEATURES.md` "Account" - batch B3b.
  - Batch layout (orchestrator, 2026-10-16, after the plan review before B3, Risk 2): Q1's "D60:
    its own batch" holds - B3 is D60 alone; B3b takes D83, B2 review Risks 2 and 3 and Nits 1,
    2 and 5 (they share `check:db`). `reviews/plan-B3.md` is the plan review of both.
  - Release closeout (orchestrator, 2026-10-16): before the push the owner signs in with Google
    and Discord and links one to the other on a B3 build against the test project (plan 7.5).
- Open questions: none.

## Carries from the owner (decisions file, "Carries for debt-cleanup's refresh", 2026-10-14/15)

The decisions file lives untracked in the main checkout
(`issues/owner-afk-2026-10-13/decisions.md`); this list is the tracked copy. Plan ids K1-K15.

| Id | Carry (owner words condensed) | Placed (rule home) |
|---|---|---|
| K1 | The homebrew editor's only way back after a save is «Отмена», which reads wrong once saved; the planner decides the label and the rule for a dirty form | B4 (`FEATURES.md` "Homebrew", the editor's buttons) |
| K2 | The homebrew Items tab needs filters (at least by source; the catalog's dynamic filters are the model). A feature: its own batch or a named follow-up | B5 (`FEATURES.md` "Homebrew", the Items tab; `STATE.md` the UI row) |
| K3 | The «Сохранить себе» note (`saveItemNote`, `saveItemNoteList`, `p.savenote` in `PickRow.svelte`) sits under the whole row and seems to apply to «Добавить в список» too: tie it to its button | B4 (`FEATURES.md` "Records", the pick row) |
| K4 | On `#/s/` an entry's «Для игроков» note draws as a box between two rows, a larger gap above than below, so it reads as the next item's note; the owner's list page draws it inside the row's card. Attach it to its row | B4 (`FEATURES.md` "Lists", the shared page) |
| K5 | «копия из каталога»: an author copies a catalog item into their homebrew to rebalance it. Open questions: the copy's source and section; whether it keeps a link to the catalog record; the picture (catalog `img` reused); rule and set cards; list rows that name the catalog item | named follow-up `catalog-copy` (B1 writes `issues/catalog-copy/context.md`) |
| K6 | R9 e2e F8 failed once with "Navigation timeout of 30000 ms exceeded" (run 38474328975, attempt 1; F0-F7 ok; the re-run passed). Decide the fix: retry, timeout or `waitUntil`, or a root cause | B1 |
| K7 | B9.2-3: an `ownKeyFor` cache (about 64 ms per 5000 calls at the 1000-row bound, measured 2026-10-13) | B1 |
| K8 | One shared component for the visually hidden status regions (`.said` on `#/s/` and `#/h/`, `.lsaid`, `.rsaid`) | B5 |
| K9 | Vitest timeouts under load (2026-10-14): `requestsPanel.test.ts`, `importPanel.test.ts`; `homebrewEditor.test.ts` is fixed on main (10 s `cropFile` wait); a watch line for the `artField.test.ts` `crop()` helper and its other `hbArtDone` finds (default 1 s wait on the lazy crop chunk, never seen failing) | B1 |
| K10 | Remove the share and copy-link buttons of the homebrew table (`#/tables/homebrew`): they hand out a bare app link with no card | B5 (`FEATURES.md` rule 17, "Handed-out links") |
| K11 | Markdown editor on a phone: italic text, then Bold, does nothing; bold italic seems impossible. Likely `toggleMark` returns null when a selection end touches stars that do not wrap it. Bold on italic and Italic on bold give `***...***`, both orders, the selection inside or around the stars; repro on desktop and with touch emulation | B4 (`FEATURES.md` rule 18, "Formatted text boxes") |
| K12 | `tools/check/fast.mjs` resolves vitest as `<ROOT>/node_modules/vitest/vitest.mjs`, so `check:fast`'s vitest stage fails in a `.claude/worktrees/` checkout without its own `node_modules` | B1 |
| K13 | D97, D98, D99, D100 (DEBT entries named in the carries) | B1 (D97), B2 (D98, moved by the refresh before B2), B4 (D99, D100) |
| K14 | The closeout writes the carry line into persist-review's row of `issues/persistent-storage/plan.md` | B5 (closeout) |
| K15 | D90 paid here | B1 |
| K16 | Owner, 2026-10-15: a colour print card (standard and compact) with no picture uses `img/_none.webp`, as the site, in place of the `PRINT_GLYPH` outline; black-and-white has no art block and is unchanged; `PRINT_GLYPH`/`glyphKey` go if unused; print goldens and `tests/app/print.js` re-checked; the Figma departure recorded | B4 (`FEATURES.md` "Print") |

The F11 flake of the authoring-print-preview push (CI run 38784078868, "the share page did not
draw the delete in 10 s") is K6's sibling: B1's `withPage` names the in-flight URLs on any
failure.

Verified on the tree 2026-10-15 (`e4f92f7c`):

- K4: `SharedListPage.svelte` draws the two `HitNote`s in `TableRows`'s `after` snippet, outside
  the row's `div.row`; `HitNote`'s `.hitnote` has `margin-top: 12px`. `after` has no other user.
  The row's `inside` snippet (the take line `.pickrow`) draws inside the border.
- K11 (reproduced by reading): `toggleMark('*word*', 1, 5, '**')` - `before` 1, `after` 1, neither
  holds bold, so `before || after` returns null; `toggleMark('*word*', 0, 6, '**')` - `lead` 1,
  `tail` 1 - null; `toggleMark('**word**', 2, 6, '*')` - null. `MarkupField.run` then does nothing.
- K1: `HomebrewEditor.svelte`'s button row: «Сохранить», a ghost «Отмена» link to
  `HOMEBREW_HASH`, «Удалить». The leave guard (`app.guardLeave`, `hbDropEdits`) already asks
  on every navigation while the form is dirty. `t.hbToMyItems` («К моим предметам» / "To my
  items") is the editor's existing name for the same link (the missing and gone states).
- K10: `TablesPage.svelte` - `copyTableLink` (toolbar), `copyFilterLink` (`FilterBar`'s
  `oncopylink`), `copySectionLink` (two section heads); on `homebrew` `linkTo` falls back to the
  app address (`FEATURES.md` "Tables and search" and rule 17 name the exclusion).
- K12: check:1 and check:2 run `npm run test`, which finds vitest by Node's parent walk.
- K6: `tests/app/driver.js` `open()` navigates with `waitUntil: 'networkidle0'`; the e2e flows use
  the same driver (`makeDriver(page, 'e2e', ...)`) against the hosted test project.
- K7: `AppState.ownKeyFor` calls `Homebrew.has`, which scans `items` (`some`) per call.
- D100: `printEntriesOf` resolves ids with `recordFor` (own items first).

Verified on the tree 2026-10-15 (`7430de8e`) for B2:

- D85: the newest `get_shared_list(text)` (`20261014120000_homebrew_art.sql`) builds `snapshot`
  live with `homebrew_item_record(e.hb_item)` and `hid`/`img` beside it; `(text, bigint)`
  (`20261002120000_read_scale.sql`) is security invoker and calls it. The port
  (`supabase.ts` `shares.read`) and `SharedView.refresh()` name `since` only; `sameProjection`
  compares `JSON.stringify` of the entries, so key order matters. The overloads are pinned in
  `list-shares.test.mjs`, `homebrew.test.mjs` (every `get_shared_list` overload) and
  `harness.test.mjs` (`EXPECTED_ANON_FUNCTIONS`). No fixture, `llms.txt` line or
  `tests/contracts.js` check names the projection.
- D83: `delete_account()` is one `delete from auth.users`; `purchase_request_lines` has the
  primary key `(request_id, item_key)`; `purchase_requests` has a partial index on `list_id`
  (pending only) and `(share_id, created_at)`; no delete trigger on either. The 3x seed holds
  1.35 million lines of about 1.4 million rows. The port's `deleteAccount()` has no client
  timeout.
- D98: `homebrewPage.test.ts`, "lists own and book members by name, a gone id by its own words,
  and counts both", runs axe over an open set fold; `listPage.timed.test.ts` and
  `importPanel.timed.test.ts` end without axe.
- `SUPABASE_CLI` users: `tools/supabase/config.mjs` and `db-push.mjs` only.
- K16: `PRINT_GLYPH`, `glyphKey` and `GlyphKey` (`lib/print.ts`) have no user but
  `PrintCard.svelte` and `print.test.ts`.

Verified on the tree 2026-10-16 (`5eb69ff6`) for B3:

- D60: `@supabase/supabase-js` 2.117.1 is a devDependency; `auth-js`, `postgrest-js`,
  `realtime-js`, `storage-js` and `functions-js` 2.117.1 sit in the main checkout's
  `node_modules`. `SupabaseClient`'s storage key is `sb-<first host label>-auth-token`;
  `fetchWithAuth` reads the session per request; Realtime gets `accessToken` and `setAuth` on
  `SIGNED_IN`, `TOKEN_REFRESHED`, `INITIAL_SESSION` and `SIGNED_OUT`. `supabase.ts` uses
  `createClient`, `REALTIME_SUBSCRIBE_STATES`, `User`, `UserIdentity` and the client's `auth`,
  `rpc`, `from`, `channel`, `removeChannel`, `storage`; `tests/e2e/admin.mjs`,
  `tests/e2e/contract.mjs` and `tests/db/realtime.test.mjs` import supabase-js too.
- D83 (B2 step 0): request delete as one statement 2.3-4.2 s; the `auth.users` delete after it
  461 ms once and 4.9-5.7 s four times with no statistics, 318 ms after `analyze`; `explain`
  14 797 ms: `homebrew_items_owner_id_fkey` 8956.7 ms (1 call; inside it, per item,
  `homebrew_items_before_delete` calls `homebrew_links_touch`, which reads `list_entries` by
  `hb_item`), `purchase_request_lines_request_id_fkey` 5415.4 ms (4500 calls).
- Stack tooling: `tests/db/run.mjs` `cli()` runs `status` piped and `start` captured under
  `STACK_TIMEOUT_MS` 600 000 (not measured); `tools/supabase/restore.mjs` `cli()` and
  `runningContainer()` have no timeout.
- The hosted `anon` statement timeout is recorded nowhere in the repository (Supabase's default
  is 3 s); `authenticated` is 8 s (`.claude/README.md`).

## What the releases before this one did to the entries (read 2026-10-15)

| Entry | Release | Effect |
|---|---|---|
| D65, D93, D94 | R9 `5a4709e5` | paid |
| D70 | print-snapshots `28950398` | paid |
| D74 | rich-descriptions `c8a65230` | paid; deleted from `DEBT.md` |
| D82 | rich-descriptions moved it to "Authoring print preview"; authoring-print-preview pays it | not this task's |
| D101, D102, D103 | rich-descriptions | new, section "Debt cleanup": this task's |
| D95 | homebrew-followups `4dad178c` | new, section "Focus": this task's |
| D97, D98 | R8 `cf98c94c` | new, section "Debt cleanup": this task's |
| D99 | print-snapshots | new, section "Harness parity": this task's |
| D100 | print-snapshots | new, section "Persistence review": this task's |
| D104 | ai-integration `e4f92f7c` | section "Cloudflare Pages move": not this task's |
| D60 | R8 | narrowed to functions-js; `StorageClient` joins the fix |
| D85 | R8 redefined `get_shared_list(text)` (`img`); link-previews added `get_shared_list_preview(text)` | not paid; B2 wraps `get_shared_list(text, bigint)` (`20261002120000_read_scale.sql`), whose body calls the newest `(text)` body (`20261014120000_homebrew_art.sql`) |
| D81 | R8 added `art` to `ITEM_SELECT` | not paid; selects as of `e4f92f7c`: `BOOK_SELECT` `id,key,content,revision,created_at,updated_at`, `ITEM_SELECT` `id,key,book_id,content,art,revision,created_at,updated_at`, `CARD_SELECT` `id,key,kind,book_id,content,revision,created_at,updated_at` |
| D83 | R8 art triggers on `homebrew_items`; print-snapshots `print_sets` (`print_sets_per_owner` 1000, cascade on account delete) | not paid; the 3x delete counts 3000 print sets |
| D24, D61-D63, D64 `MoveNotice` half | R10 | R10's, except D61 (Q4) |

Newest migration on `main` at the refresh: `20261014120200_link_previews.sql`.
authoring-print-preview (implemented in another worktree, ships first) edits
`HomebrewEditor.svelte` (a print view), `PrintCard.svelte` and `PrintPage.svelte`; B4 edits the
editor as that release leaves it.

## Key paths
- Specs: `docs/specs/DEBT.md`, `FEATURES.md` ("Homebrew", "Lists", "Records", "Tables and search",
  "Account and browser lists", "Print", "Chrome", "Consistency rules" 1-18), `STATE.md` (settings
  keys, the UI row), `COVERAGE.md` ("Component-test traps"), `CONTRACTS.md` (B2 only),
  `.claude/README.md` ("Run a long check", "The database suite", "Shell hazards", "The configured
  bundle budget").
- Code hot paths:
  - D81: `app/src/ports/supabase.ts` (`homebrew.load`, the three selects, `CHANGED_LISTS_MAX`,
    `lists.list(known)` as the pattern), `ports/types.ts` (`HomebrewRead`, `HomebrewRepository`),
    `ports/fake-cloud.ts`, `ports/lazy-cloud.ts`, `ports/cloud.contract.ts`,
    `state/homebrew.svelte.ts` (`read`, `kept`, `has`).
  - D83: `ports/supabase.ts` (`FAULT_CODE`, `callFailure`), `state/cloudLists.svelte.ts` (`#send`,
    `FAULT_LIMIT`, `RETRY_MS`), `tests/db/delete-account.test.mjs`, `tests/db/list-writes.test.mjs`.
  - D84: `lib/lists.ts` (`matchLists`), `ListsPage.svelte` (`waiting`), `state/ownerRequests.svelte.ts`,
    `AddToList.svelte` (`inList`), `state/app.svelte.ts` (`listsHolding`), `HomebrewRelations.svelte`
    (`findItems`), `HomebrewEditor.svelte` (`dirty`, `previewIndex`), `lib/facets.ts` and
    `FilterBar.svelte` (the «Раздел» row), the toast in `app.svelte.ts`.
  - D86: `ports/supabase.ts` (`requests.list`, `REQUEST_SELECT`, `READ_PAGE`), `state/ownerRequests.svelte.ts`.
  - D87: `CloudLists.#pull`, `#apply` in `state/cloudLists.svelte.ts`.
  - D90: `tests/db/run.mjs`, `tools/supabase/lib.mjs` (`LOCAL_STACK_EXCLUDES`, `RESET_COMMAND`),
    `tools/supabase/lib.test.mjs`.
  - D61: `state/app.svelte.ts` (`LANG_KEY`, `HOME_KEY`, `WARN_KEY`, `PREFS_KEY`; the existing
    `storage.onExternalChange` callback runs only with `env.cloud` and reads only `key === null`).
  - D97: `tools/supabase/usage-lib.mjs` (`MB`, the bytes format and the per-day rate).
  - D98: `app/src/components/homebrewPage.timed.test.ts`.
  - D99: `tests/app/driver.js` (`NAME_FN`).
  - D100: `state/app.svelte.ts` (`printEntriesOf`, `print`), `PickRow.svelte`, `SelBar.svelte`,
    `ListPage.svelte`, `SharedListPage.svelte`.
  - D101: `RowMain.svelte`, `MarkupInline.svelte`. D102: `Markup.svelte`, `PrintCard.svelte`.
    D103: `RecordCard.svelte`, `HomebrewCards.svelte`.
  - K6: `tests/app/driver.js` (`open`), `tests/e2e/flows.mjs` (`withPage`, F8).
  - K9: `app/vitest-setup.ts`, the three test files.
  - K11: `lib/markupEdit.ts` (`toggleMark`), `markupEdit.test.ts`, `MarkupField.svelte`, `markupField.test.ts`.
  - K12: `tools/check/fast.mjs`, `tools/check/lib.mjs`, `tools/check/lib.test.mjs`.
  - D85: `state/sharedView.svelte.ts`, `20261002120000_read_scale.sql` (the overload pattern),
    `lib/cloudLists.ts` (`SharedRow`, `sameProjection`), `ports/supabase.ts` (`shares.read`).
  - D83 delete (B2): `20260925120000_delete_account.sql`, `ports/supabase.ts` (`deleteAccount`),
    `tests/db/delete-account.test.mjs` (the 3x `todo` case).

## Command costs

| Command | Wall clock | Fits one call? |
|---|---|---|
| `rtk npm run check:fast` | 215-310 s | yes |
| `rtk npm run check:1` / `check:2` | 252 s / 308-566 s | yes, each its own call |
| `npm run check:built` | 20-25 s | yes |
| `npm run check:db` (PowerShell) | 532-811 s (2026-10-14) | under the hang guard; past the cap the run arms by its exit |
| `npm run e2e` | 50-120 s | yes |
| `node tests/run-all.js app/print,app/contracts,app/states,app/typo,app/hues,stub` | 260-450 s | usually |
| `node tests/app/sweep.js <width>` | 320-590 s | yes, one width per call |
| `node tests/app/golden.js --shard=n/4` | 100-290 s | yes, one shard per call |

Source: `.claude/README.md`, "Batch size and the fixed cost of a run"; the decisions file items 3, 11, 13.

## Which machine is authoritative
- For recorded numbers (timings, the 3x delete measurement): this Windows host, idle.
- What a difference on another machine means: load, not a regression; re-run on an idle host.

## Reasons already disproved

- "D84's revoked share rows stay for ever": `lifecycle_cleanup()` deletes a stopped share 30 days
  after `revoked_at` when a newer row of the same list and audience exists
  (`20261007120000_lifecycle_cleanup.sql`; `META.md` section 3).
- "The homebrew table is `homebrew_sources`": it is `homebrew_books`; "source" is the UI name.
- "A function-level `statement_timeout` lifts the timeout of the RPC call": not relied on.
- "The vitest timeouts of K9 wait on a lazy chunk": `ImportPanel.svelte` and `RequestsPanel.svelte`
  import nothing lazily; only `ArtField.svelte` loads `CropDialog.svelte` lazily.

## Constraints
- Bundle (2026-10-15, before authoring-print-preview): configured 298.0 kB (budget 303),
  unconfigured 236.9 kB (budget 242); ceilings 350 kB configured, 250 kB unconfigured; budget =
  measured + 5 kB. Each batch reads the figures again at dispatch.
- Contracts: B1, B3, B4, B5 change no public contract. B2 adds an overload of `get_shared_list`
  and a `rev` field in the `#/s/` projection. B5's Items-tab filters are page memory, never the
  address (no route change).
- `.claude/README.md` has a net-zero line budget ("Owner insights"): D90's FAIL rows replace lines.

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
- You suspect drift vs issue or plan
