# Review - B5a-fix2 (ai-mcp)

Verdict: approve
Reviewed: 1cbe5b561326143e19a9322f973a3535134a9da7
Scope: batch B5a-fix2

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. -->

Findings: 0 blockers, 0 risks, 3 nits (all non-blocking). Delta review of
`git diff f87614b5 1cbe5b56` against `reviews/B5a-fix.md`. Read-only: no gate
ran. The worker reports `check:fast` PASS 226 s on this tree. HEAD is
`1cbe5b56`.

## Scope checks

(a) R-1 - fixed in all four places, and the README says "reasoned, not measured".

| Place | New text | Result |
|---|---|---|
| `pages/src/en/privacy.html` | "its access ends at once, except that it can still receive change notices for up to an hour" | The "already open" condition is gone. |
| `pages/src/privacy.html` | «его доступ заканчивается сразу, только уведомления об изменениях оно может получать ещё до часа» | Same facts as EN: access ends at once, change notices only, up to an hour, no connection condition. The record sentence is unchanged in both. |
| `docs/specs/META.md` section 3 | "after a revoke a client token that has not expired can still open a new connection and receive them until it expires, at most an hour (Realtime checks the signature and expiry, not the session row)" | Matches the scenario of R-1. |
| D7 decision file | "after a revoke a client token that has not expired can still join and receive them until it expires, at most an hour" | Matches. |
| `.claude/README.md` | "is reasoned from how Realtime authorizes a join ... not measured. The join probe is a pending reading" | States the status and names the probe. |

The privacy pages keep one date (14 November 2026) in both languages. The
handoff deviation line agrees with the pages.

(b) N1-N5 - fixed.

- N1: the comment in `tests/db/api-client-guard.test.mjs:602` now gives the true reason.
- N2: `handoff.md` names P1-P8 at the three lines. The "Durable items" line lists the files written. `rtk grep P1-P4` finds the old gate only in `plan.md` (see nit 1) and in earlier review files.
- N3: see (c).
- N4: the README P6 line now matches the probe's `p6`. I read `b5a-probe3.mjs`: `row()` computes `verdict(c, a)` when `v` is undefined, so P6 rows get `PASS-BLOCKED` or `INCONCLUSIVE` by the same rule as the others. See nit 2.
- N5: the `.replace('%s', value)` pattern is in handoff Deferred (`RequestsPanel.svelte:330-341`, `ListsPage.svelte:183`).

(c) N3 code - correct, no regression.

- `schemeAllowed(url)` is the old parse and the `REFUSED_SCHEMES` test, with `catch` giving `false`. `leaveFor` is `if (!schemeAllowed(url)) return false; assign; return true`. Behavior of `leaveFor` is the same as before. Its call sites (`approve`/`deny` at `:1470`, details `done` at `:1488`) are unchanged.
- `details` calls `schemeAllowed(data.redirect_uri)` before `appHost` and before the card, and answers `{ ok: true, gone: true }`. An unparseable or empty `redirect_uri` now reads as gone and not as a card with a host. This fails closed. The only other `redirect_uri` in app code is the existing https test case (`supabase.test.ts:3436`), which stays allowed. A custom scheme such as `cursor://` passes (not in the refused set).
- The fake cloud (`fake-cloud.ts:2226`) does not use the check. The fake's redirects are fixtures, so there is no parity gap in the contract the page sees.
- The test adds a card-shaped answer (`authorization_id`, `redirect_uri: url`, client, user, scope) for every refused scheme, including `not a url` and a padded `JavaScript:` value. It asserts `{ ok: true, gone: true }` and, at the end, `assign` not called. It asserts what it claims. The test title says "an answered request" and now also covers the card (nit 3).

(d) No schema or migration file changed. `git diff --stat f87614b5 1cbe5b56` lists 9 files: `.claude/README.md`, `supabase.test.ts`, `supabase.ts`, the D7 file, `META.md`, `handoff.md`, both privacy pages and one test comment in `tests/db/api-client-guard.test.mjs`. Nothing is under `supabase/`, and the `tests/db` change is a comment only. `check:db` from `f87614b5` still holds.

## Blockers

None.

## Risks

None.

## Nits (non-blocking)

1. `local` - `issues/ai-mcp/plan.md:15` and `:853` still say P1-P4. The plan is scratch and closeout deletes it, so it breaks nothing. Change both to P1-P8 if the plan is touched again.
2. `local` - `.claude/README.md` Release checklist, P6: the text says a 401 or 403 for the client token "with a different answer for the app token passes". The probe passes any 401 or 403 for the client token, whatever the app token answers. The clause in brackets ("a refusal proves only that the gate fails closed") is hard to read. Say: a 401 or 403 for the client token passes; another error code that differs from the app token's passes; the same code for both is `INCONCLUSIVE` and fails the gate.
3. `local` - `app/src/ports/supabase.test.ts:3547`: the title says "on approve, deny and an answered request". Add "and a request card", because the test now covers the card too.

## Deviations

The fix pass records one deviation: the privacy pages say an unexpired client token can still receive change notices for up to an hour, also on a new connection. Accepted. It is the R-1 text fix, and the README marks it as reasoned.

## Standing checks

1. Scale: not applicable - the pass adds no collection, list or per-record cap.
2. Error scenarios: checked - `details` with a refused or unparseable redirect (gone, no card, no `assign`), the three arms of `leaveFor`, and the Realtime clause after a revoke. No stored shape changes. The pending Realtime join reading is named in the README.
3. Consistency: checked - the refused redirect on `details` now draws the same expired page as the approve and deny arms, with no toast. The four places of R-1 state the same bound.
4. RU/EN parity: checked - both privacy paragraphs. Same facts, same order, EN ASCII, RU with «» as Russian permits. No `dict.ts` key changed.

Owner rules: checked - the 2026-11-13 owner decisions (build on supabase/auth#2898, gate before production, DB guard stays) are unchanged in D7 and the README. The checklist now names P1-P8. No new owner rule in this batch's sources.

## Suggested next action

Push `claude/ai-mcp` (the worker's `check:fast` PASS 226 s covers this tree; no schema change since the `check:db` pass), wait for CI, then continue with B5b. Fold nits 2 and 3 into the next pass that touches those files; nit 1 clears at closeout.

## Checks still needed

- The Realtime join to `owner:<uid>` with a client token after a revoke (local stack, base set to `true` for the run). The text is correct either way.
- The hosted P1-P8 rows (release step 2) and the pending readings after `migrate-test`.
- N8: CI's configured bundle total after the push.
