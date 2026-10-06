# Shared task context - TASK persist-8-media

## Goal
- Release R8 of the persistence programme: pictures on own homebrew items -
  decode in the browser, a square crop, 640 and 160 px files uploaded to the
  author's folder of one public bucket, the picture drawn wherever a catalog
  picture is drawn (rows, cards, the editor preview, frozen copies, print),
  and on R9's surfaces (`#/h/<token>`, its print route, «Сохранить себе»).
  Ships after R9 (owner, 2026-10-02).
- Dispatch of 2026-10-02 (orchestrator): draft the design and the mocks for
  the owner's review before dispatch. No production code.

## GitHub issue (if any)
- None. Roadmap: `issues/persistent-storage/plan.md` section 5 row R8,
  section 9 row R8 ("it also brings art to R9's surfaces"), section 12 and 14
  `B8.1`, section 16 decisions 39 (the nightly backup also copies the
  `homebrew-art` objects) and 40 (one Edge Function `delete-account`, a bucket
  with `allowed_mime_types` and a size limit), section 3 ("client resize to
  640 and 160 WebP, owner folder in one public bucket").
- Placed acceptance line (R11, on `B8.1`): the usage report's Storage row
  reads the `homebrew-art` bucket - after the E2E upload, the test project's
  report shows a non-zero `storage_bytes`.
- Open questions: none. Owner answers of 2026-10-02 to Q8-1 to Q8-8, the CI
  deploy of the Edge Function and the two project-scoped tokens: `plan.md`
  section 9 and 3.9; owner steps: 9.1.

## Screenshot / attachment findings
- No screenshots. Mocks: `mocks/index.html` (m40-m45).
- Measured fact (web search, 2026-10-02): Safari and every iOS browser decode
  WebP but never encode it from a canvas; `toBlob('image/webp')` silently
  returns a PNG. Sources: the DEV article "Ask canvas for a WebP in Safari and
  you silently get a PNG" and the MDN `toBlob()` page. This drives Q8-2.

## Key paths
- Specs: `docs/specs/FEATURES.md` ("Records" pictures and fallback,
  "Homebrew" editor, "Print", "Account" deletion and "Ваши данные"),
  `CONTRACTS.md` section 4 (the closed `import-v2` snapshot and
  `homebrew-v1` item: no `img`), `META.md` section 3, `STATE.md`,
  `DEBT.md` D60 (storage-js and functions-js "not called").
- Code: `app/src/lib/desc.ts` (`artSrc`, 8 call sites in `ListCard`,
  `PrintCard`, `RecordActions`, `RecordCard`, `RowMain`, `TableRows`),
  `app/src/lib/homebrew.ts` (`recordOf`, `snapshotValid`),
  `app/src/components/HomebrewEditor.svelte`, `ItemPicker.svelte`,
  `AccountPage.svelte`; `app/src/ports/types.ts` (`HomebrewRepository`,
  `ImagePort`, `AuthPort.deleteAccount`), `supabase.ts`, `fake-cloud.ts`,
  `lazy-cloud.ts`; `app/src/lib/bundle.ts` (the lists file writer).
- Database: `supabase/migrations/20260925120000_delete_account.sql`,
  `20260930130000_homebrew.sql` (`homebrew_items`),
  `20261001130000_homebrew_relations.sql` (`homebrew_snapshot_valid` closes
  the keys through `homebrew_content_valid`; `get_shared_list`), R9's
  `<ts>_homebrew_shares.sql` (`get_shared_homebrew`).
- Edge Function deploy (owner, 2026-10-02): CI, as the migrations - `e2e`
  (test project) and `migrate-prod` (production) in `.github/workflows/ci.yml`;
  agents only through a `functions:deploy` wrapper with `--project test`
  (`bash-guard.mjs` rule 2n denies `supabase functions deploy`, and
  `HOSTED_SCRIPTS` lists the allowed wrappers). Tokens: Supabase access
  tokens limited to one project and the Edge Functions access a deploy needs.
- Tooling: `tools/supabase/lib.mjs` `LOCAL_STACK_EXCLUDES` excludes
  `storage-api` and `edge-runtime`; `tools/supabase/usage.mjs` already sums
  `storage.objects`; `.github/workflows/backup.yml` dumps only `auth` and
  `public` rows.
- Mocks: `issues/persist-8-media/mocks/`.

## Command costs

As R9's `context.md` (R7d's figures, this host, 2026-10-02), plus: the first
`check:db` with `storage-api` in the stack pulls one image once (3-5 min,
estimate).

| Command | Wall clock | Fits one call? |
|---|---|---|
| `npm run check` | 7-10 min | yes |
| `npm run check:built` (after `npm run build:test`) | about 2 min | yes |
| `node tests/run-all.js app/states` | 4-6 min | yes |
| `node tests/run-all.js app/contracts` | 7-9 min | yes |
| `node tests/app/sweep.js 360` | 7-9 min | yes |
| `node tests/app/golden.js --shard=n/4` | about 3.2 min per shard | yes |
| `npm run check:db` (PowerShell tool) | 9-10 min | yes |
| `npm run e2e` | 2-4 min | yes |

## Which machine is authoritative
- This Windows host; the owner's iPhone for the JPEG fallback (Q8-2).

## Reasons already disproved
- "Absolute picture URLs in records": a stored path keeps rows and snapshots
  portable between the test and production projects and through a restore
  (`plan.md` 3.2).

## Constraints
- Every new string RU and EN; invented names only («Мастерская Ольхи», the
  bedrolls).
- No server beside Supabase; no new dependency for image work (bundle
  ceiling 300 kB configured).

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
- You suspect drift vs issue or plan
