# Review - plan before B5b (ai-mcp)

Verdict: fix-then-continue
Reviewed: 71c6827cb3e9d1c1440f9ee3cb3d66178f65edf6
Scope: plan before B5b

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

This is the second look at the B5 plan that the B5 refresh recommended
(`plan-B5a-2.md` in the old handoff note); the Status line "Plan review:
required before B5b" makes it the enforced one. It covers the B5a delta,
B5b, B5c and B5d. One remediation cycle: the planner applies the findings
below and the implementer follows with no third look.

Tree: `claude/ai-mcp-b5plan` at `71c6827c` (base `646b2c04`), clean except
the auditor's untracked `reviews/audit-ui-actions.md` (not read: the audit is
the auditor's). Shipped state read from `claude/ai-mcp` at `8571dbe0`
(landing 3 `c4742c53` merged back). Read: `CLAUDE.md`, `context.md` (both
worktrees: B5 design and refresh facts, landing 2 and landing 3 readings),
`handoff.md` (both), `plan.md` Status, sections 3.4, 4 (D7), 6 (B5, "UI
action coverage", "Common rules", B5a-B5d), 7, 9, 10; `reviews/plan-B5a.md`,
`reviews/B3.md`, `reviews/B2b.md`; the mock HTML and five PNGs;
`supabase/config.toml`; migrations `20261014120000_homebrew_art.sql`,
`20260925130100_lists.sql`, the realtime policies; `app/src/ports/redirect.ts`,
`lib/address.ts`, `lib/pending.ts`, the `rpc(...)` calls of
`ports/supabase.ts`, `state/app.svelte.ts` `importLists`;
`preview/public/_redirects`, `_headers`, `app/public/sw.js`;
`tests/contracts.js` (the `_redirects` check); `tools/bundle-budget.mjs`;
`tools/supabase/config.mjs` and `lib.mjs` (`NOT_OWNED`); `.github/workflows/ci.yml`
(migrate jobs); `.claude/README.md` ("Batch size and the fixed cost of a run",
"The configured bundle budget").

Read-only probes (2026-11-13, production, one `curl` each):
`//lists` answers 200 `text/html` as `/lists` does, so Pages applies a
`_redirects` rule to a double-slash path; `/connect` and `//connect` answer
404 today (no rule yet).

## Blockers

### plan-B5b-1 - the stop rule misses the OAuth consent endpoints, which can defeat "Disconnect"

Section 6, B5a step 1 (measurement list and stop rule); section 7, "Owner
stop"; section 9, B5 bullet; D7; `handoff.md` Blockers.

A client token is a normal user JWT with a `session_id`. If GoTrue accepts
it on the OAuth consent endpoints, connected app A can register client B
dynamically (no sign-in needed), start B's authorize flow, then call
`getAuthorizationDetails` and `approveAuthorization` with A's token and
exchange the code with B's PKCE verifier. B then holds its own grant and
refresh token. When the reader disconnects A, B keeps the account: the
confirm text «Приложение больше не сможет читать и менять ваши данные» and
D7's "Disconnect stops an unexpired token at once" become false. The guard
cannot see this, because it is Auth, not PostgREST. Step 1 measures the
user endpoints, not the OAuth ones.

Change, B5a step 1, append to the Auth list: "the OAuth endpoints with the
client token: `GET` of an authorization's details, its approve (consent
`POST`), `listGrants` and `revokeGrant` (the paths auth-js 2.117.1 calls for
`auth.oauth`)". Stop rule, append: "or approves an authorization (a
connected app could connect another app that survives its revoke)". Record,
not a stop: a client token that lists or revokes grants (then the privacy
pages name that a connected app can see and disconnect the other apps).
Copy the same list into section 7 "Owner stop", section 9 and the handoff
Blockers line. D7: replace "the database enforces it" for Auth with "the
database bounds PostgREST, Storage and Realtime; Auth is bounded by B5a
step 1's measurement and its stop rule".

### plan-B5b-2 - the `authorization_id` is lost on the sign-in round trip

Section 6, B5a step 6 ("signed out, the sign-in panel returns to the same
address (`dhloot.auth.return`)"); the "consent signed out" state.

`ports/redirect.ts` `saveReturn` stores only the route key `hash` (`#/...`)
and the language. `takeRedirect` rebuilds the address as origin + `/` (or
`/en/`) + the callback's own query + `record.hash`. `lib/address.ts`
`addressOf` builds the route key from the path alone and never reads
`location.search`. So a signed-out reader who opens
`/connect?authorization_id=X`, signs in with Google, comes back to
`#/connect` with no id and gets the "expired" page. The same id must also
survive the bar rewrite of `I18N.md` ("the bar is rewritten in place to the
form of the language on screen", which builds the path from the route key)
and the `//connect` normalization. The plan's statement is false as written,
and the signed-out state has a golden.

Change, B5a step 6, replace the `authorization_id` sentence with: "On entry,
`/connect?authorization_id=<id>` (and `//connect`, `/en/connect`) becomes the
route key `#/connect/<id>`, and the bar is rewritten to the path form of that
key (`/connect/<id>`, `/en/connect/<id>`). Every later rewrite, the sign-in
return record and a reload then carry the id with no new mechanism. The
rewrite writes the normalized path, never `location.pathname` as given
(`replaceState` reads a path that starts with `//` as a host). The id is
validated by the shape that step 1 records (else the expired page)."
`ROUTES.md` gets `#/connect/<id>`; `routes.json` and `paths.json` get the
rows; `preview/public/_redirects` gets `/connect/* / 200` and
`/en/connect/* /en/ 200` beside `/connect` and `/en/connect` (`tests/contracts.js`
fails without them). New acceptance line: "Signed out on
`/connect?authorization_id=<id>`, a sign-in returns to the consent card of
the same id (a `redirect.test.ts` case and a component test); an English
reader's bar rewrite keeps the id."

### plan-B5b-3 - a retried relative bulk edit applies twice, and the plan does not name the loss

Section 6, B5b operations `PATCH /me/lists/{id}/entries` (L15 `raise_percent`,
`discount_percent`) and `POST /me/lists/{id}/entries/delete` (L17 with
`quantity`); B5b Standing check 2 ("a failed write is 503 and the retry
converges").

Both operations are relative: the worker reads the current price or
quantity and writes a new one. A client whose answer was lost (a timeout,
a 503 after the commit) retries, and the price rises again (110 % becomes
121 %) or more units go. Standing check 2 of `review.prompt.md`: a retry
that writes from a stale basis is a loss, and an unnamed loss is a blocker.
Every other B5b write is absolute or keyed by a client id, so the
convergence claim holds for them only.

Change, B5b table: both rows take `If-Match: "<list rev>"`, required (428
without) when the body holds `raise_percent`, `discount_percent` or a
`quantity` below the row's; the worker compares it with the list revision
it reads before it computes, else 412 with the current `ETag`. A retry after
a success then meets 412 and re-reads. Absolute bodies (`set`, `clear`,
`gm_only`, whole-row deletes) keep no `If-Match`. Standing check 2: name the
remaining window (a write between the read and the AL call, as in the app).
Acceptance lines 14 and 16 gain "a stale or missing `If-Match` on a relative
edit is 412 or 428 and writes nothing".

### plan-B5b-4 - the import and export sizes rest on predictions that landing 3 disproves; one read has no bound

Section 6, "Common rules" (Imports, Exports); section 7 (Import and export
caps); B5d placed line (3); B5b operations `GET /me/lists/{id}` (L2).

- Imports: the rule predicts "about 6.8 ms cold, about 9 ms at 64 KB". Landing
  3 measured the 32 KB file check alone at 13.8 ms (homebrew) and 10.2 ms
  (lists) cold, and MCP `check_file` at 19.5 ms cold (`context.md`, "Landing 3
  readings"). An import adds the row build and one or two RPCs to that.
  B5d placed line (3) (raise to 65536 B only if the p99 is at most 3 ms) is
  decided now: p99 was 9.5-20.6 ms, so the cap stays 32768 B.
- Exports: pages of 65536 B are chosen on "about 7.5 ms cold", with no
  reading; a 64 KB page parses about twice what the 32 KB file check parses.
  A page size is contract-visible (a list past it answers 422), and the
  plan's own rule is that such a cap may rise, never fall (section 7, the
  file-check cap).
- L2 `GET /me/lists/{id}` has no size bound. At the limits a list holds 100
  entries with `player_note` and `gm_note` of 4000 characters each
  (`20260925130100_lists.sql`), about 1.6 MB of Cyrillic UTF-8 plus the
  linked items. B1 measured 43-71 ms for a 1.7 MB answer (`.claude/README.md`
  CPU row).

Change: "Imports" - replace the prediction with the landing-3 numbers,
state the cap as 32768 B with no conditional, and state that the cold cost
is in the class the owner accepted for landing 3 (10-20 ms, no 1102).
"Exports" and section 7 - pages of 32768 B, raised only after a
production reading. B5b L2 row - the worker reads the answer with a
`readText` cap of 65536 B and answers 422 with the app link past it, as
`get_shared_list` (section 9); a Scale line for it. B5d placed line (3) -
"decided at landing 3: the cap stays 32768 B; the closeout says so".

## Risks

### plan-B5b-R1 - B5a passes both bundle limits

Section 6, B5a (steps, acceptance). `check:fast` measured 275.2 of 276 kB
after B2b (`handoff.md` on `claude/ai-mcp`). `tools/bundle-budget.mjs` sums
every `.js` and `.css` under `dist/`, so a lazy route chunk does not avoid
the limit. B5a adds the consent page, the account section and its strings
in both languages (the unconfigured 276 kB limit) and `AppRepository` in
`ports/supabase.ts` (the configured 333 kB limit, about 1 kB of room).
Change: B5a gains a step "raise each limit that the batch passes to the
measured total rounded up to the next whole kB, in the same commit
(`.claude/README.md`, 'The configured bundle budget'; ceilings 300 and 350);
run the configured line of that section, because the batch changes
`ports/supabase.ts`; load the consent page as its own chunk if the router
already splits a route" and an acceptance line "`npm run budget` passes in
both builds, with any raise and its measured totals in the same commit".

### plan-B5b-R2 - `/mcp/me` lists no public tool, so a one-connector client cannot add a record

Section 6, B5b step 3 and acceptance 25. `/mcp/me` lists only the `/me`
operations. L9 needs a `record_id` (`search_catalog`, `get_record`); S5 and
R7 need a shared list's entries (`get_shared_list`). Claude Free holds one
custom connector (`context.md`, Research). Change, step 3: "`/mcp/me` lists
the public tools too, after the account tools, answered as on `/mcp` (they
ignore the token)"; acceptance 25: "`/mcp/me` `tools/list` holds every
public tool and the B5b tools". Default taken (owner AFK) in section 7, with
the trade-off "one tool list grows by about ten tools".

### plan-B5b-R3 - the consent page can be framed

Section 6, B5a step 6. No `frame-ancestors` or `X-Frame-Options` exists
(`preview/public/_headers`, `app/index.html`). Storage partitioning makes a
framed page signed out in current browsers, which limits the attack, but an
authorization page should refuse framing (RFC 6819, 4.4.1.9). Navigations
pass the service worker to the network (`sw.js`), so `_headers` applies.
Change, step 6: "`_headers` adds `/connect`, `/connect/*`, `/en/connect`,
`/en/connect/*` with `Content-Security-Policy: frame-ancestors 'none'` and
`X-Frame-Options: DENY`; the page draws no buttons when `window.top !==
window` (it draws the expired page)"; one `check-site` probe and one
component test.

### plan-B5b-R4 - a row of "Connected apps" shows a host the app chose itself

Section 6, B5a step 5 (`AppGrant.host` "from `client.uri`, else the redirect
URI's host"). With dynamic registration, `client.uri` and `client.name` are
whatever the registering app wrote, so a hostile app shows "Claude ·
claude.ai". The consent card uses the redirect host, which is where the code
goes. Change: step 1 records whether a grant answer carries the redirect
URIs; `host` is the redirect URI's host when present, else `client.uri`'s;
the consent card and the row show the same field. For a redirect that is
not `https` (a loopback port or a custom scheme of a desktop client), show
the scheme and host as given (`cursor://...`, `127.0.0.1`). One state row
for each in Standing check 1.

### plan-B5b-R5 - an audit gap found after B5a changes the consent text that readers already accepted

Section 6, "UI action coverage" (gaps become B5d lines), B5d "Audit gap
rows". The consent list, the privacy pages (B5a) and the guard list (B5a)
name the scope. A gap that adds a capability after B5a means a second
migration, a plan review, and grants given under a shorter text. The audit
runs now, before B5a. Change: "Each gap row that needs a guard name or adds
a fact to the consent list is folded into B5a (step 3's list, the step 6
list, both privacy pages) before B5a's commit; B5d keeps the gap rows that
only add an operation or an exception." The plan's use of the table is
otherwise sound: the auditor derives its list without the table, compares,
and each gap gets an outcome line.

### plan-B5b-R6 - B5c and B5d are not implement-ready, and nothing says who completes them

Section 6, B5c ("implement-ready outline") and B5d ("outline"). B5c has
operations and acceptance lines but no step list (files), unlike B5b; B5d
waits on the audit. Change: B5c gains steps (`preview/api/me-homebrew.mjs`
new; the multipart reader in `me.mjs` with its body cap of 2 x 204800 B plus
the multipart overhead, read before any parse; `mcp.mjs` tools; `openapi.json`;
fixtures `me-homebrew-*`; `CONTRACTS.md` section 6; `llms.txt`;
`me-homebrew.test.mjs`) and a CPU line for H11 (a 410 KB body passes to
Storage as two uploads; the worker reads only the RIFF header). B5d states:
"a planner pass makes B5d implement-ready after the audit; it needs a plan
review only if a gap row needs a guard name (plan-B5b-R5 makes that rare)".

### plan-B5b-R7 - the machine-to-machine question is not in step 1

Section 10 (developer tokens) says "Open question to measure in B5a step
1: whether the Supabase OAuth server offers a machine-to-machine grant", and
step 1 does not list it. Change, step 1: "whether the token endpoint
accepts `grant_type=client_credentials` for a dynamically registered
client, and the claims of such a token". Step 3 and step 4: "a token with
`client_id` and no `session_id` (or one whose session has no row) is
refused" (the session check already does it; state it and test it).

### plan-B5b-R8 - the Workers subrequest limit is not a design rule

Section 6, "Common rules". The free plan allows 50 subrequests per
request. L8 loops one delete per list (10), H24 copies a picture (2 fetches,
2 uploads, `import_homebrew`, `setArt`, then AL `relink`), and the lists
import must read the account context that `importPlan(lists, account)`
needs (held list ids, homebrew keys) before its two RPCs. Change, "Common
rules": "an operation makes at most 20 subrequests; AL ops of one call go in
one `apply_list_writes` request (H24's `relink` for every list in one call)";
"Imports": "the worker reads the context `importPlan` needs (`lists`
`id,name`; `homebrew_items` `id,key`) and follows the app's retry rule (a
failed lists call keeps the copies; a retry skips their held keys and links
them, `app.svelte.ts` `importLists`)".

### plan-B5b-R9 - the branch is behind landing 3, and `plan.md` is past its size warning

`plan.md` Status still says B3 "implement-ready (next)" and gives gate totals
from before B3; `handoff.md` on this branch names B3 as the next batch, while
`claude/ai-mcp` (`8571dbe0`) records landing 3. `plan.md` is 203 KB, past
the 150 KB warning of `session-stop.mjs`. Change, in the fix pass: merge
`claude/ai-mcp` into this branch first; collapse B3 and B2b to their
outcomes (the full text stays in `git show 646b2c04:issues/ai-mcp/plan.md`),
which also removes the stale "B5b placed line" mentions that B5d's note
explains; rewrite Status (batches, the remaining gate total) and the
handoff's Status, "Next batch" (B5a, after the audit fold-in) and
Blockers.

## Nits

All `local` (inside `issues/ai-mcp/plan.md`, `handoff.md`, `context.md`).

- N1 `local` - B5a step 3: `api_client_session_live()` takes no argument (it
  reads `auth.jwt() ->> 'session_id'` itself, so it is no oracle for other
  sessions); a missing or malformed `session_id` answers false, not a cast
  error. One `tests/db` case.
- N2 `local` - "Common rules", "Stop before delete": `confirm` equals the
  number of ids (or `entries`) in the call, not the rows the cascade or a
  partial quantity touches; a retry with the same body and `confirm`
  answers each gone id as deleted.
- N3 `local` - B5a step 3: write the storage policies `for update` and `for
  delete`, never `for all` (a restrictive `for all` also refuses H11's
  insert). Say why they stay: no permissive update or delete policy exists
  today (`20261014120000_homebrew_art.sql`: "only the database deletes",
  through `pg_net` and a Vault key), so they guard against a later one.
- N4 `local` - B5a step 1: a global logout or a `data` change that the
  measurement finds possible is recorded, and both privacy pages name a
  global logout; the "It cannot" line stays.
- N5 `local` - B5b Standing check 2: "a bulk delete removes up to 10 lists
  or 100 entries after `confirm`" holds for the API only; add "at PostgREST
  a client token can delete every list in one call; the consent text names
  that a deletion cannot be undone".
- N6 `local` - B5b-B5d bump `openapi.json` to 1.3.0, 1.4.0 and 1.5.0, but
  none of these lands alone (all four land at the closeout, D6). Bump once
  to 1.3.0 in B5b and extend it in B5c and B5d; move B5b acceptance 28 (the
  live `ETag` `1.3.0-`) to the closeout, where it can be read.
- N7 `local` - B5d placed line (4) (the issue 72 follow-up after the
  production switch) cannot have an outcome inside B5d, whose commit comes
  before the closeout. Move it to the closeout steps (`handoff.md` and the
  B5 table's text); B5d keeps "the A2 text names the shipped operations".
- N8 `local` - B5a step 9: before `config:push -- --project prod`, run
  `config:diff -- --project prod` and check that only `auth.oauth_server`
  rows differ; before the closeout, read production's
  `/auth/v1/.well-known/oauth-authorization-server` to confirm the server is
  off.
- N9 `local` - B5d P1 from `list_id`: move the print builder to `lib/` if it
  lives in a component, as L15's price function.

## Deviations

- The base `[auth.oauth_server]` is `enabled`, not `false` (a deviation from
  the earlier pass's recommendation). Accepted. The base section is
  production's and the local stack's; CI never pushes the configuration
  (`ci.yml` runs only `migrate-test` and `migrate-prod`); B5a reaches `main`
  only with the closeout squash; `config:push` shows the diff and asks for
  `yes` (`tools/supabase/config.mjs`). So the owner's production push after
  the closeout, with N8's diff, is the switch, and it follows the migration
  and the route. `auth.oauth_server` is not in `NOT_OWNED`, so the test
  project's dashboard switch shows as drift until step 2 declares it.
- One migration holds the guard list for all of B5. Accepted. No guard row
  gives a client token a database capability that the app's own token lacks;
  production has no client token until the owner's switch after the
  closeout; a revert of B5b-B5d leaves rows the consent text already names;
  the down migration follows step 9's order. The least-privilege gap exists
  only on the test project between B5a's push and B5d.
- The split B5a-B5d. Accepted. B5a: a different route and filter set
  (screen, goldens, `check:db`). B5b, B5c, B5d: each a contract change that
  needs its own commit and review, and one review of all three would not
  hold in one pass (`.claude/README.md`, "The test" and "Too big"). The
  criterion is real even though no B5 contract goes public between them
  (N6).
- `plan-B5b.md` replaces the unenforceable `plan-B5a-2.md`. Accepted: the
  Status line makes `agent-guard.mjs` enforce it.
- The mock as a default (owner AFK). Accepted; it follows the account page's
  panels, and the long card at 360 px is named in section 7.

## Standing checks

1. Scale: checked - B5a States table (consent loading, details, personal
   claims, approving, failed read, failed approve, signed out, expired,
   already approved, a 200-character name; apps loading, failed, empty, one,
   30, longest name, off, revoke failure) against the mock HTML states and
   PNGs at 360 and 1180 px; B5b limits (lists 50 and 150, entries 100 and
   300, 100 ids and 101, 10 lists and 11); B5c items 100 and 300. Missing:
   the L2 read at the limits (plan-B5b-4), the signed-out return
   (plan-B5b-2), a non-https redirect host (plan-B5b-R4). The primary action
   at 360 px is below the fold, named in section 7.
2. Error scenarios: checked - every write row of B5b-B5d against retries,
   conflicts, deletes and reverts; cascades (named since plan-B5a-3);
   `expect_overwrites` (sound: a moved count is 409 and nothing written);
   `confirm` (N2); relative bulk edits (plan-B5b-3); the revoke path
   (plan-B5b-1); a connected app deleting rows at PostgREST (named in B5a
   Standing check 2 and the consent text; N5); the lists import's two calls
   (plan-B5b-R8). Recovery for every loss is a file saved before; no
   server-side copy, named.
3. Consistency: checked - "Connected apps" against «Способы входа» (the same
   panel and row; the confirm departure named, rule 10); the expired page
   against rule 7; the `accountFailed` toast; `/connect` against the path
   form of `ROUTES.md` and `_redirects`; the import cap against the
   file-check cap (consistent after plan-B5b-4); the export page against the
   plan's own "a cap may rise, never fall" rule (plan-B5b-4).
4. RU/EN parity: checked - the four scope lines, the cascade hint, the
   "cannot" line, the confirm, the toasts, the empty and failure lines of
   B5a steps 6 and 7 and the PNGs `consent-details-ru-360` and
   `consent-details-en-1180`: the same facts in both languages, ASCII
   punctuation in English, «» only inside the Russian strings. New strings
   from plan-B5b-1 (privacy) and R4 (host forms) need both languages.

Owner rules: checked - the owner's requirements of 2026-11-12 (full parity,
share links, paging with `link`, import and export, bulk, the coverage
table, the split) are in `plan.md` section 6 "B5" and section 7; the
2026-11-13 instructions (developer tokens not built, fallback 2 dropped)
are in section 10 and section 7. No rule of this scope belongs in
`.claude/README.md`, "Owner insights".

## Suggested next action

Merge `claude/ai-mcp` (`8571dbe0`) into `claude/ai-mcp-b5plan`, then
dispatch the planner with this report to apply plan-B5b-1 to -4, R1 to R9
and N1 to N9 as written, and to add the Status line
`- Plan review findings applied: reviews/plan-B5b.md` with one sub-bullet per
finding. Fold the auditor's gap rows in the same pass where plan-B5b-R5
sends them to B5a. Then merge the branch into `claude/ai-mcp`. B5a starts
after that, and its step 1 stop rule (now with the consent endpoints) is the
first owner stop.

## Checks still needed

- B5a step 1 on the test project: the Auth and OAuth endpoints with a client
  token (plan-B5b-1), the claims, `client_credentials` (R7), the grant shape
  with or without redirect URIs (R4), the authorization id shape
  (plan-B5b-2). A read-only reviewer cannot run them.
- Whether Pages applies a `_headers` rule to `//connect` as it applies
  `_redirects` to `//lists` (R3); the in-app frame check covers it if not.
- The bundle totals after B5a in both builds (R1).
- Production CPU of the `/me` import, export and L2 reads: only possible
  after the owner's production switch; the caps of plan-B5b-4 are the safe
  start until then.
