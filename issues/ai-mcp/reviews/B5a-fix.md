# Review - B5a-fix (ai-mcp)

Verdict: fix-then-continue
Reviewed: f87614b5458c160c4d5cdf7190373ae8cc799eec
Scope: batch B5a-fix

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

Findings: 0 blockers, 1 risk, 5 nits. Delta review of `git diff 664e403f
f87614b5` against `reviews/B5a-batch.md`. Read-only: no gate, no docker, no
vitest ran. The worker reports `check:db` PASS 605/0 and `check:fast` PASS
724 s on this tree. The working tree is clean.

Outcome of each earlier finding:

| Finding | Outcome |
|---|---|
| B1 | Fixed. `leaveFor` (`app/src/ports/supabase.ts:1449`) parses with `new URL` and no base, so a relative or protocol-relative URL, or a string that does not parse, is refused. The WHATWG parser makes the scheme lower case, strips leading C0 controls and spaces, and removes tabs and newlines, so case, whitespace and control-character variants give `javascript:` and are refused. `location.assign` uses the same parser, so it cannot read a different scheme. Of the schemes that are left, only `javascript:` runs script on navigation; `data:`, `blob:` and `file:` are refused too. All three arms (approve, deny, details `done`) are tested, and `assign` is never called. See N3 for the card. |
| R5 | Fixed. `answer` maps `appGone` (4xx except 401 and 429) to `{ ok: true, gone: true }`. The page draws the expired page and shows no toast. A 401, a 5xx, a null answer and a rejection stay `{ ok: false }`. There are tests for the port, the fake, the lazy port and the component (both buttons, with axe). |
| R3 | Fixed. `objects_no_client_insert` is `as restrictive for insert to authenticated with check (client_id is null or api_client_session_live())`. The reversal drops it before the function it depends on. The test refuses a deleted session and a malformed `session_id` (42501) and lets the app token through on the same name. This proves that the restrictive policy refuses the insert, and that the permissive one does not. The policy-list test reads three policies. The bucket is public, so no Storage read path is left. |
| R4 | Fixed. The base is `enabled = false` (`supabase/config.toml:277`) and `[remotes.test.auth.oauth_server]` is `enabled = true` (`:359-362`). Release step 3 sets the base in a commit. Contract case U accepts the server off (`list` gives `off`, `details` of an unknown id gives `gone`), so CI's real port does not need the local server. |
| R1 | Fixed. The checklist names P1-P8 with an expected `PASS-BLOCKED` result. The probe file has `p5`-`p8`. Its `verdict()` gives `INCONCLUSIVE` and not `PASS-BLOCKED` when the client token and the app token get the same error, so the gate fails closed. See N4. |
| R2, R6 | Readings recorded in `.claude/README.md` (2026-11-14, local): the plain refresh gives 400 `invalid_client`, a revoke gives 204 and deletes the `auth.sessions` row, and the consent row stays with `revoked_at`. The guard design holds. D7, META and both privacy pages agree with the readings, except for the Realtime clause (R-1). |
| N1, N2, N3, N4, N6 | Fixed. |
| N5 | Fixed, but the comment now gives a false reason (N1 below). |
| N7 | Fixed in META and D7. The wording is too narrow (R-1). |
| N8 | Deferred. It is in handoff Deferred. |

Migration: the fix pass only adds a restriction. `api_client_session_live()`
is a definer with a fixed `search_path`, and `execute` is revoked from
`public` and `anon`. It reads only the caller's claim. The guard refuses it as
`/rpc/api_client_session_live` for a client token, because it is not in the
POST list. No path that was reachable before is now unguarded, and the fix
adds no new path.

## Blockers

None.

## Risks

### R-1 - The privacy pages say that only an already open notice connection outlives a revoke; a new one also works

- Files: `pages/src/en/privacy.html:129-130`; `pages/src/privacy.html:131-133`;
  `docs/specs/META.md:258-260` ("a socket it opened keeps them");
  `docs/decisions/2026-11-13-a-connected-app-reaches-only-the-api-s-account-scope.md:5`
  ("an open socket keeps them").
- Failure scenario: the reader presses «Отключить». The app still holds an
  access token that has not expired (`jwt_expiry = 3600`). It opens a new
  Realtime socket and joins `owner:<uid>`. Realtime checks the signature and
  `exp` of the token, not its session row. The join runs only
  `dhloot_owner_topic_receive` (`supabase/migrations/20260927120000_realtime.sql:102-105`),
  which does not check the session. The app then receives the reader's
  change notices for up to an hour, on a connection that it opened after the
  revoke. The privacy text promises that only a connection that "it already
  has open" («уже открытое им соединение») can do this. The bound of one hour
  is correct, but the condition is not. This is a public claim about the
  reader's data, and the fix pass wrote it.
- Fix (recommended, text only): remove the "already open" condition in all
  four places. EN: "its access ends at once, except that it can still receive
  change notices for up to an hour". RU: «его доступ заканчивается сразу,
  только уведомления об изменениях оно может получать ещё до часа». META and
  D7: "until the token expires, at most an hour, a client token can still
  join and receive them". Keep the date of both privacy pages in step. Reason:
  no schema change and no `check:db`. Trade-off: the promise stays at "up to
  an hour".
- Alternative: add `realtime_no_ended_client on realtime.messages as
  restrictive for select to authenticated using ((select auth.jwt() ->>
  'client_id') is null or public.api_client_session_live())` to the
  unpushed migration, with its reversal line and a `tests/db` case. Then a new
  join after a revoke is refused, and the current text is true. Trade-off: a
  schema change, a `check:db` run, and an unmeasured Realtime RLS path. That
  path is a schema review trigger.

## Nits

- N1 `local` - `tests/db/api-client-guard.test.mjs:602`: the comment "The
  local Auth serves the OAuth server, so its consent table must exist" is
  false after R4: the local stack now serves no OAuth server
  (`.claude/README.md`, "OAuth server and the client token"). The table
  exists because Auth's migrations create it whether the server is on or off.
  Change the reason to that fact.
- N2 `local` - `issues/ai-mcp/handoff.md:7`, `:45` and `:81` still name the
  release gate as P1-P4. The checklist and D7 now say P1-P8. Change all three
  lines to P1-P8. `:102` says "Durable items written to their homes this pass:
  none outside `issues/ai-mcp/`", but the fix pass wrote `.claude/README.md`,
  META, D7 and both privacy pages. Replace it with that list.
- N3 `local` - `app/src/ports/supabase.ts:1480-1484`: `details` draws the card
  for a `redirect_uri` with a refused scheme. The reader presses «Разрешить»,
  Auth records the grant, and only then does `leaveFor` refuse, so the page
  says «Запрос на подключение устарел». A consent row stays, and the reader
  sees it in «Подключённые приложения». No code leaves the page, because
  `assign` is not called, so this is safe. Apply the same scheme check to
  `data.redirect_uri` in `details` and answer `gone` before the card is drawn.
  This was B1's optional step. Add one port case.
- N4 `local` - `.claude/README.md` Release checklist, P6: the line asks for
  "an account with two identities". `b5a-probe3.mjs` `p6` uses an account
  with one identity, and `p6a` links Google, which is off on the test
  project. The gate fails closed (`INCONCLUSIVE` is not `PASS-BLOCKED`), but
  the probe cannot do what the line asks for. Make the line match the probe:
  a 401 or 403 for the client token, with a different answer for the app
  token, passes. `INCONCLUSIVE` fails the gate. Or make `p6` link a second
  identity.
- N5 `deferred-scope` - the `.replace('%s', value)` pattern from the earlier
  N2 is also used for names that another reader writes. Examples:
  `RequestsPanel.svelte:330-341` (`noticeChanged`, `noticeDeleted`) and
  `ListsPage.svelte:183`. A name such as `` $` `` copies text of the
  sentence. This is a project-wide cleanup: put it in handoff Deferred.

## Deviations

1. The privacy pages are dated 14 November 2026, and both languages carry the
   same facts. Accepted, with R-1.
2. The gate is P1-P8, and P9 (global sign-out) is recorded but is not a gate.
   Accepted: the privacy pages name the global sign-out as an allowed action.
3. A redirect with a refused scheme reads as `gone`, and the page draws the
   expired page. Accepted: this fails closed. N3 moves the check before the
   card.

## Standing checks

1. Scale: not applicable - the fix pass adds no collection, no list and no
   per-record cap. The expired page that R5 reuses is an existing inventory
   state.
2. Error scenarios: checked - an expired or answered request on approve and
   deny (gone, no retry loop), 401, 429 and 5xx (retry), a null answer, a
   rejection, a refused redirect on all three arms, an insert after a revoke,
   and a revoke against Realtime (R-1). The fix pass writes no stored shape.
   The consent row now outlives the disconnect, as the privacy pages say.
3. Consistency: checked - the R5 expired page is the same `ErrorPage` as the
   unknown or framed request, with no toast. `FEATURES.md` rule 2 is
   satisfied, because the cause is no longer a connection error.
4. RU/EN parity: checked - both privacy paragraphs and dates. The facts are
   the same and in the same order, the EN text is ASCII, and the RU text uses
   «» as Russian permits. No `dict.ts` key changed. The page tests cover a
   name with `$` patterns in the confirm and the toast.

Owner rules: checked - the owner decisions of 2026-11-13 (build on
supabase/auth#2898, gate before production, the DB guard stays) are still in
`.claude/README.md`, "Release checklist", and D7, now with P1-P8. No new owner
rule is in this batch's sources.

## Suggested next action

Send R-1 (the text-only option) and the `local` nits N1-N4 to one
implementer pass on `claude/ai-mcp`. Then run `check:fast`. The fix pass
changes only text, one test comment and `details` (N3), so `check:db` is
needed only if the implementer takes R-1's policy alternative. Push after that
pass. No third review is needed for the text option. The policy alternative
is a schema change and needs a review. Put N5 in handoff Deferred.

## Checks still needed

- R-1: a Realtime join to `owner:<uid>` with a client token after a revoke,
  on the local stack with the base set to `true` for the run. This confirms
  the scenario, and the text fix is correct either way.
- The hosted P1-P8 rows (release step 2) and the two pending readings after
  `migrate-test`.
- N8: CI's configured bundle total after the push.
