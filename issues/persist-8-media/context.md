# Shared task context - TASK persist-8-media

## Goal
- Release R8 of the persistence programme: pictures on own homebrew items -
  decode in the browser, a square crop, 640 and 160 px files uploaded to one
  public bucket, the picture drawn wherever a catalog picture is drawn, on
  R7h's surfaces (`#/h/<uuid>`, live list links, «Сохранить себе», the
  «Мои предметы» tabs) and R9's print routes. Ships after R7h and R9
  (owner, 2026-10-02; R1, 2026-10-03: "R8 is refreshed against the rework
  too").
- Dispatch of 2026-10-07 (orchestrator): refresh the plan against R7h's plan
  at `ac23ce36` and R9's refresh of 2026-10-07, so the owner reviews mocks,
  answers questions and starts implementers in the next session. No
  production code.

## GitHub issue (if any)
- None. Roadmap: `issues/persistent-storage/plan.md` section 5 row R8,
  section 9 row R8, sections 12 and 14 `B8.1`, section 16 decisions 39 (the
  nightly backup copies the bucket) and 40 (one Edge Function
  `delete-account`) - these rows still describe the 2026-10-02 design; the
  orchestrator updates them at closeout.
- Placed acceptance line (R11): the usage report's Storage row reads the
  bucket - after the E2E upload, the test project's report shows a non-zero
  `storage_bytes` (placed in `B8.2`).
- Owner answers of 2026-10-02: Q8-1 B (reversed by Q8-9 A), Q8-2 A, Q8-3 B,
  Q8-4 (200 KB, item limit + 5), Q8-5 A (no subject after R7h), Q8-6 A,
  Q8-7 A, Q8-8 A (`plan.md` 9.0).
- Owner answers of 2026-10-07 (chat): Q8-9 A - "The database deletes
  picture files (a trigger plus the hourly job, pg_net with a key in Vault,
  no Edge Function). This reverses the earlier Q8-1 B." Q8-10 a - "A weekly
  full copy, 8 downloads at a time, with a manual run any night." Open
  questions: none.
- R9: Q9-8 = B (owner) - `get_homebrew_item` gains `updated_at` in an R9
  schema batch; `B8.1` adds `img` to that body (`plan.md` 2.4). Assumed at
  their recommended answers: Q9-6 A, Q9-7 B, Q9-9 A, Q9-10 A.

## Screenshot / attachment findings
- No screenshots. Mocks: `mocks/index.html` (m40-m42 current, m46-m48 of
  this refresh, m43-m45 superseded).
- Measured fact (web search, 2026-10-02): Safari and every iOS browser
  decode WebP but never encode it from a canvas; `toBlob('image/webp')`
  silently returns a PNG (MDN `toBlob()`). This drives Q8-2 A.

## Key paths
- R7h: `issues/persist-7h-homebrew-page/plan.md` 2.7 (the lifecycle law,
  `lifecycle_cleanup()`), 2.8.3-2.8.6 (`hb_item`, the read functions, the
  change log), 2.9 (tabs), 6 (effect on R8). The B7h.1 migration
  `supabase/migrations/20261007120000_lifecycle_cleanup.sql` and the
  decision `docs/decisions/2026-10-07-lifecycle-data-is-deleted-by-the-database-on-a-schedule.md`
  (uncommitted on 2026-10-07).
- R9: `issues/persist-9-item-share/plan.md` 3.1-3.4 (print routes), 10
  (effect on R8).
- Specs: `docs/specs/FEATURES.md` ("Records" pictures and fallback,
  "Homebrew", "Print", "Account" - deletion and "Ваши данные"),
  `CONTRACTS.md` section 4 (closed `import-v2` snapshot, `homebrew-v1`),
  `META.md` section 3 and the service worker section, `DEBT.md` D60.
- Code: `app/src/lib/desc.ts` (`artSrc`), `app/src/lib/homebrew.ts`
  (`recordOf`, `snapshotOf`, `snapshotValid`), `HomebrewEditor.svelte`,
  `ItemPicker.svelte`, `AccountPage.svelte`; `app/src/ports/types.ts`,
  `supabase.ts`, `fake-cloud.ts`, `lazy-cloud.ts`, `cloud.contract.ts`;
  `app/public/sw.js`.
- Database: `20260930130000_homebrew.sql` (`homebrew_items`, the touch and
  before-delete triggers), `20260925120000_delete_account.sql`, R7h's
  `<ts>_homebrew_links.sql` (not written yet).
- Tooling: `tools/supabase/lib.mjs` `LOCAL_STACK_EXCLUDES`,
  `tools/supabase/db.mjs` `connect`, `tools/supabase/usage.mjs` and
  `usage-lib.mjs`, `.github/workflows/backup.yml`, `tests/e2e/admin.mjs`.

## Facts found by the refresh (planner, 2026-10-07)
- `homebrew_items_touch()` runs `after update` of any column, so an `art`
  change bumps linking lists; R7h B7h.3 adds the «changed» notice there.
- R7h's `get_homebrew_item` answer must hold no `owner_id` and no uuid but
  `hid` (plan-B7h.1-20); a name `<uid>/...` would break it.
- R7h keeps `hid` beside `snapshot` in `get_shared_list` because a previous
  bundle validates the snapshot's keys (`snapshotValid` closes them).
- Every catalog `img` matches `^[A-Za-z0-9_-]+\.webp$` (381 values).
- `app/public/sw.js` passes every cross-origin request to the network.
- `deleteHint` reads «Аккаунт и все связанные с ним данные будут удалены
  навсегда.»; `FEATURES.md` "Account" asks for texts true in every release.
- No workflow reads `SUPABASE_ACCESS_TOKEN` or `SUPABASE_ACCESS_TOKEN_TEST`
  (set by the owner on 2026-10-02 for the Edge Function deploy).
- The hosted E2E holds the test project's secret key
  (`E2E_SUPABASE_SECRET_KEY`, `tests/e2e/admin.mjs`).
- `backup.yml` already holds the production connection string; the bucket
  is public, so the art copy needs no key.
- Assumed, to prove in `B8.1` step 1 and case Q: Storage refuses deletes of
  its tables from SQL; `storage.objects.owner_id` is set from the session;
  the gateway takes a secret key in the `apikey` header alone.

## Command costs

This host (R7d's figures, 2026-10-02; R9's `context.md`).

| Command | Wall clock | Fits one call? |
|---|---|---|
| `npm run check` | 7-10 min | yes |
| `npm run check:built` (after `npm run build:test`) | about 2 min | yes |
| `node tests/run-all.js app/states` | 4-6 min | yes |
| `node tests/run-all.js app/contracts` | 7-9 min | yes |
| `node tests/run-all.js app/print` | about 4 min (estimate) | yes |
| `node tests/app/sweep.js 360` | 7-9 min | yes |
| `node tests/app/golden.js --shard=n/4` | about 3.2 min per shard | yes, one shard per call |
| `npm run check:db` (PowerShell tool) | 9-10 min; +3-5 min once for the `storage-api` image | yes |
| `npm run db:push -- --project test` | about 1 min | yes |
| `npm run e2e` | 2-4 min | yes |

## Which machine is authoritative
- This Windows host; the owner's iPhone for the JPEG fallback (Q8-2).

## Reasons already disproved
- "Absolute picture URLs in records": a stored name keeps rows portable
  between the test and production projects and through a restore.
- "Content-hash names in the author's folder": the account id would reach
  every reader's answer (R7h's forbidden keys).
- "The browser deletes old files": the lifecycle law (R7h `B7h.1`).

## Constraints
- Every new string RU and EN; invented names only («Мастерская Ольхи», the
  bedrolls).
- No server beside Supabase; no new dependency for image work (bundle
  ceiling 300 kB configured).
- Concurrency (dispatch of 2026-10-07): R7h is implemented in the same
  worktree; the planner writes only under `issues/persist-8-media/`.

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
- You suspect drift vs issue or plan
