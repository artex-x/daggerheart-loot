# Handoff - TASK ai-mcp
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (B0-B3 and B2b live: landing 1 `aeb68c0e`, landing 2 `89a55f1b`, landing 3 `c4742c53`; B5a `664e403f` and its fix pass committed on the branch, unpushed; the push and the CI credit are next; B5b-B5d planned)
- Last agent: implementer (2026-11-14, B5a fix pass of `reviews/B5a-batch.md`)
- NEEDS_HUMAN_CONFIRMATION: no (the step 1 stop is resolved by the owner's decision of 2026-11-13: build on Supabase's fix supabase/auth#2898 and release only after probes P1-P8 pass)
- Branch: claude/ai-mcp
- Base / starting commit: a2b4df21
- Pushed: no (schema batch: the push waits for the review's approve)

## Completed
- B0 - license statement and per-record rights audit: shipped in `aeb68c0e` (review `reviews/B0.md`).
- B1 - API core and REST v1 reads: shipped in `aeb68c0e` after the fix pass `93eac0ae` (review `reviews/B1.md`); live checks 1-11 passed on 2026-11-12.
- B2a - record links with `?v`, one record per line, the roll index cache and the MCP adapter: `22755cc1`, review `reviews/B2a.md`, fix pass `5b58edf8`, squash `89a55f1b` (landing 2).
- B3 - search, table filters and file checks: review `reviews/B3.md`; shipped at landing 3 `c4742c53`.
- B2b - the two pages, the footer links and the import-row links: `ed3d8954`, review `reviews/B2b.md`, fix pass `a3448d16`; shipped at landing 3 `c4742c53`.
- B5a - the account connection (steps 1-10): the OAuth server owned in `supabase/config.toml`; the guard migration `20261113120000_api_client_guard` and its reversal; `tests/db/api-client-guard.test.mjs`; `AppRepository` (types, Supabase port, fake, lazy port, contract case U); the route `#/connect/<id>` with the entry rewrite (`takeConnect`), `_redirects`, `_headers` and the `check-site` frame probe; `ConnectPage.svelte`; «Подключённые приложения» on `#/account`; the shared `ProviderLogo`, `SessionLine` and `SignInPanel` (second real use); both privacy pages; `FEATURES.md`, `ROUTES.md`, `META.md`, `CONTRACTS.md` section 1, `llms.txt`; D7 (`docs/decisions/2026-11-13-a-connected-app-reaches-only-the-api-s-account-scope.md`); `.claude/README.md` "Supabase configuration" ("OAuth server and the client token", the advisor counts, restore step 5); inventory states and goldens.
- Previous sha (batch diff base): a2b4df21.
- Review: `reviews/B5a-batch.md` (fix-then-continue, 1 blocker, 6 risks, 8 nits). Fix pass on 664e403f: B1 (`leaveFor` refuses `javascript:`, `data:`, `vbscript:`, `blob:` and `file:`; port cases for approve, deny and details), R1 (release checklist P1-P8; P9 the global sign-out, recorded only), R2 and R6 (local readings below), R3 (`objects_no_client_insert`; the test reads three policies; Realtime named in META, D7 and both privacy pages), R4 (base `enabled = false`, the test project on in `[remotes.test]`, release step 3 sets the base), R5 (`AppAnswer` gains the `gone` arm; the page draws the expired page; a port and a component test), N1, N2 (`replace('%s', () => value)`), N3 (Verification), N4, N5 (consents asserted present), N6 (no executable function takes an allowed table's row type), N7. N8 is deferred.
- Local readings (2026-11-14, `.claude/README.md`, "OAuth server and the client token"): P7 the plain refresh answers 400 `invalid_client`, the OAuth refresh keeps `client_id`; R2 a revoke deletes the `auth.sessions` row; R6 the `auth.oauth_consents` row stays with `revoked_at` set. No stop condition fired.
- Acceptance lines of B5a (`plan.md`):
  1. Done: step 1's results are in `.claude/README.md`; its stop rule fired and the owner resolved it (2026-11-13).
  2. Pending (owner token): `config:diff -- --project test` needs `SUPABASE_ACCESS_TOKEN`, which only the owner's interactive use reads; the field names come from the CLI 2.117.0 template; the section matches the dashboard values the owner set on 2026-11-12.
  3. Done: one `tests/db` case per allowed row (9 GET, 3 POST, 4 PATCH, 5 DELETE, 16 RPC) and the enumeration case over every table and function `authenticated` reaches.
  4. Done: no foreign key joins an allowed table to an out-of-scope one (asserted), and the `user_prefs` join answers empty for a client token and the row for an app token.
  5. Done: a deleted session refuses an unexpired client token.
  6. Done: a client token's update and delete of `storage.objects` are refused where the app token's pass; its insert passes as the app token's while its session lives and is refused after (fix pass R3).
  7. Done: `rpc/delete_account`, `delete_account_requests`, `get_print_set`, `reorder_list`, `move_legacy_list` and `user_prefs` refused.
  8. Done: `check:db` up-down-up passed with the migration (first run; the final run is in Verification).
  9. Pending (after `migrate-test`): the hosted `user_prefs` probe; `.claude/README.md` "Pending readings".
  10. Done: contract case U passes on the fake (`fake-cloud.test.ts`); the real port runs it in CI's `e2e`.
  11. Done: `takeConnect` cases (`redirect.test.ts`), the route and path fixtures, `_redirects`; `tests/contracts.js` passes.
  12. Done: consent states as inventory entries with goldens (details 1100 and 360, longest name 360, loading, failed read, signed out, expired); approving, failed answer, non-https, framed and already-answered states are component tests.
  13. Done: account states (gm1 rows, gm2 empty, gm4 one with the longest name at 360, loading, failed) with goldens; `off` draws no section (component test).
  14. Done: confirm, «Отмена», the row's removal, the toast, the focus and the failure toast (`accountPage.test.ts`).
  15. Done: every new component case ends with `expectNoA11yViolations` where it draws a state.
  16. Done: strings in `dict.ts` in both languages; `i18n.test.ts` case for the scope list and the cascade.
  17. Done: both privacy pages (date 13 November 2026), `FEATURES.md`, `ROUTES.md`, `META.md`, D7; `node tools/decisions.js` ran.
  18. Placed in B5b (unchanged).
  19. Done: `redirect.test.ts` (the return record keeps `#/connect/<id>` and the English path) and `connectPage.test.ts` (a sign-in returns to the same card; the English bar keeps the id).
  20. See Verification (budget).
  21. Done: `_headers` lines and the `check-site` probe (`tools/check-site.test.mjs`); the framed page draws the expired page with no button (component test).
  22. Done: no, a malformed, a numeric, an unknown, another user's and a timed-out session refused with no error.
- Release checklist lines (owner decisions of 2026-11-13): `.claude/README.md`, "OAuth server and the client token", "Release checklist": P1-P8 PASS-BLOCKED on the hosted project before `config:push -- --project prod`; "the consent strings claim the token is bounded: do not switch production on before P1-P8 pass".

## Verification
- B5a (2026-11-13, this worktree, Rancher Desktop started for it):
  - `npm run check:db` (PowerShell): first run FAIL 4 (two cases of the new file, the harness's anon list); fixed; final run: `check:db: PASS`, pass 603, fail 0 (db reset 37 s).
  - `node --test tests/db/api-client-guard.test.mjs tests/db/harness.test.mjs` on the running stack: all passed.
  - `npx vitest run app/src/ports app/src/lib/hash.test.ts app/src/lib/address.test.ts app/src/lib/i18n.test.ts app/src/lib/apps.test.ts app/src/components/accountPage.test.ts app/src/components/connectPage.test.ts`: 12 files, 1048 tests passed.
  - `npx svelte-check --fail-on-warnings`: 0 errors, 0 warnings; `npx eslint` on the changed files: clean.
  - `node tests/derived.js`: passed after `node tools/build.js`; `node tools/decisions.js`: 341 decisions.
  - `node tests/run-all.js contracts,dataint`: both ok; `npm run build:test`, then `node tests/app/golden.js --update --only=account` (10 states; 5 re-seeded, 3 new) and `--only=connect` (7 new); `node tests/run-all.js app/contracts`: ok (702.6 s).
  - Bundle: `npm run build && npm run budget` 278.9 kB (limit 279); configured with placeholder `VITE_SUPABASE_*` values 336.9 kB (limit 338).
  - Local measurements of the OAuth server (scratch probe, local stack): `.claude/README.md`, "OAuth server and the client token".
- B5a fix pass (2026-11-14, this worktree):
  - `rtk npm run check:fast` before the privacy text and the readings: PASS, 1099 s, 3056 tests, budget 278.9 kB of 279.
  - Local probe (the base set to `true` for the run, then back to `false`): readings in Status.
  - `node tools/build.js`, then `node tests/derived.js`: everything matches; `node tools/decisions.js`: 341 decisions.
  - `npm run check:db` (PowerShell): `check:db: PASS`, tests 605, pass 605, fail 0 (db reset 39 s, 583 s); the new insert-policy, consent-presence and row-type enumeration cases pass on their first run.
  - `rtk npm run check:fast` on the final tree (VITEST_MAX_WORKERS=2): first run FAIL at the format stage (`pages/src/privacy.html`); `npx prettier --write` on it; second run `check:fast: PASS in 724 s`, 3056 tests passed, budget 278.9 kB total.
- B5a second fix pass (2026-11-14, text, `details` scheme check, no schema change, no check:db): `npx prettier --write` on the changed files; `node tools/build.js`, `node tests/derived.js` (everything matches), `node tools/decisions.js` (341 decisions); `VITEST_MAX_WORKERS=2 npm run check:fast` in the background: `check:fast: PASS in 226 s` (format, eslint, svelte-check 0 errors 0 warnings, vitest 2 files 269 tests as the script ran them, budget 278.9 kB of 279).
- B5a CI fix (2026-11-14): CI run 43578634546 failed `test:check-site` (`81 !== 79`); the two new preview paths are `connect/<32 a>` and `en/connect/<32 a>` (B5a frame-header probe), so the count is 81 and the path list names both. `node --test tools/check-site.test.mjs`: 87 tests, 87 pass. `node tools/check/run.mjs --only=site-syntax,test:check-site,derived,dataint,test:preview,test:sw`: 6 stages run, 0 skipped, exit 0. `node tests/run-all.js contracts`: ok.
- Commands of the earlier batches: `git show 51f830de:issues/ai-mcp/handoff.md`, "Verification".

## Deviations
- B5a: the grant row's host is `client.uri`'s (Auth's grant answer carries no redirect), the consent card's the redirect's; plan step 5 wanted one field for both.
- B5a: the scope list always carries «видеть почту и имя вашего аккаунта.» (step 1 found the email and name in every client token), so there is no separate golden for that state.
- B5a: «Не сможет» and both privacy pages name the password, the email, the sign-in methods and other apps (owner, 2026-11-13); the privacy pages also name the global sign-out, which the baseline probe allowed and the release gate does not cover.
- B5a: «Отключить» treats Auth's `oauth_consent_not_found` as done (a grant another tab ended).
- B5a: `PagePort.framed()` is new (the consent page reads no `window` itself); `ProviderLogo`, `SessionLine`, `SignInPanel` and `components/providers.ts` are extracted from `AccountPage` at their second use.
- B5a: the configured bundle was measured with placeholder `VITE_SUPABASE_*` values (no `.env.test.local` in this worktree); the limit has 1 kB of room for CI's real values.
- B5a fix pass: the privacy pages (date 14 November 2026) keep "its access ends at once" and add that an unexpired client token can still receive change notices for up to an hour, also on a new connection (Realtime never runs the guard); the record of a connection stays until the account is deleted (R6 reading), not until the disconnect.
- B5a fix pass: the gate widened to P1-P8 (R1); D7 now names P1-P8, not P1-P4.
- B3: file-check lines are capped at the first 50 for a good file too (`LINES_MAX`); default taken (owner AFK). Revert by removing `LINES_MAX` in `preview/api/service.mjs`.

## Next batch (implement-ready)
- First: the push of B5a and its fix pass and the CI credit (no second review: R2's reading kept the guard design); `migrate-test` then applies the migration, and the two pending readings follow (`.claude/README.md`, "OAuth server and the client token", "Pending readings").
- Then: B5b - the account API core and lists (`plan.md` section 6, "B5b"); B5c and B5d after it.

## Blockers
- None for B5b. Release gate (owner decisions 2026-11-13): production's OAuth switch (`config:push -- --project prod`) only after P1-P8 of `b5a-probe3.mjs` answer PASS-BLOCKED on the hosted project; the consent strings claim the token is bounded, so production stays off before P1-P8 pass (`.claude/README.md`, "Release checklist").
- Open owner decision (not a block): the landing-3 cold readings past 10 ms; B5b's import inherits it.
- Owner step after landing 2: the Claude connector with "No sign in" and a roll.

## Deferred
- Not placed (named for a later batch or the human):
  - `names.json` at three times the records: about 330 KB against `NAMES_MAX` 196608 B in `preview/api/rest.mjs`, so every shared-list read answers 503 at 3x (`reviews/B1.md` Risk 2; `plan.md` section 10).
  - The one joined line of about 200 characters in the 2026-10-14 decision (`reviews/B1.md` Nit 7): cosmetic, and splitting it passes the 15-line limit.
  - `plan.md` section 10 (CORS on `/apidata/*`, the account-tier items of Q8-Q11, developer tokens, MCP output schemas and resources, search over descriptions, own items in search, multi-valued facets, names in a lists file check).
  - plan-B5a-N12: nothing shows when the shared quota is near (about 500 users polling every 15 minutes); reopened by B5b's first consumer with background sync.
  - B5a-batch N8: the configured bundle limit 338 rests on a build with placeholder `VITE_SUPABASE_*` values; after the push read CI's configured total, and if it is 337.0 or less set the limit to 337 (`tools/bundle-budget.mjs`).
  - B5a-fix N5: the `.replace('%s', value)` pattern also writes names that another reader writes (`RequestsPanel.svelte:330-341`, `noticeChanged` and `noticeDeleted`; `ListsPage.svelte:183`); a name such as `` $` `` copies text of the sentence. A project-wide cleanup.
  - plan-B2a-N12: `/mcp/` with a trailing slash answers 404; serving it as `/mcp` is a choice to make before the v1 freeze of that answer matters to a client.
- Placed (each is an acceptance line of the batch named): every finding of `reviews/plan-B5b.md` and `reviews/audit-ui-actions.md` (B5a-B5d, `plan.md` Status lists each); the export-flow link, the account text on the pages, the file-check cap outcome and the print-set tool: B5d acceptance 12-16; the live `ETag` and the issue 72 follow-up: closeout steps (`plan.md` section 6, "B5").

## Notes
- Mocks path: `issues/ai-mcp/mocks/b5a-screens.html` (screens `consent` and `apps`, a state, RU/EN and 360/1180 px switch; URL parameters `screen`, `state`, `lang`, `w`, `shot=1`, `mark=1`) and 14 PNGs in `issues/ai-mcp/mocks/png/`. The constraints are in `plan.md` B5a, "Approved mock". The route key `#/connect/<id>` (plan-B5b-2) changes no drawn state of the mock.
- Screenshot findings: none new this pass.
- Cleanup performed / retained artifacts: B3, B2b, sections 1, 3.3, 3.4 (in part), 3.5, 3.8, 5.1, 5.3, 9 and 11, and the B3-era parts of Status and section 7 are collapsed to their outcomes; the last pre-collapse commit of `issues/ai-mcp/` is `51f830de` (`git show 51f830de:issues/ai-mcp/plan.md`; the earlier collapses: `8019493d`, `93eac0ae`). The splice scripts of this pass are in the session scratchpad only.
- Defaults taken (owner AFK) this pass, `plan.md` section 7, "Defaults taken (owner AFK), plan review and audit, 2026-11-13": the audit findings go to the batch of their own row (R2, R3, R7 to B5b; R4, R5, R6 to B5c; R8 to B5d; cost: B5b gains 3 acceptance clauses and B5c 4, no new batch, gate run or migration); `/mcp/me` lists the public tools; a request to the reader's own list is 409 `conflict`; import ids are UUIDv5 names under `import_id`; the H11 body cap is 413696 B.
- Not applied as worded: plan-B5b-4 says the cold cost is "in the class the owner accepted for landing 3"; the owner has not decided on the landing-3 cold readings yet (`context.md`), so the plan says the import inherits that decision.
- Session end partial progress (if any): none; the B5a fix pass is committed (probe3 gained P7 refresh and P8; logout moved to P9).
- Durable items written to their homes this pass (file, section): `.claude/README.md` "OAuth server and the client token" (local readings, the Realtime statement and the join probe as pending, the P1-P8 checklist); `docs/specs/META.md` section 3; `docs/decisions/2026-11-13-a-connected-app-reaches-only-the-api-s-account-scope.md`; `pages/src/privacy.html` and `pages/src/en/privacy.html`.
- Issue 72 stays open until the account-level read ships (`C:\Users\Ignat\.dhloot\notes\57\ai-mcp-closeout-posts.md`, A2; a closeout step after the owner's production switch).
