# Review register - TASK ai-mcp

Report: `reviews/plan-B1.md` (plan before B1, verdict fix-then-continue, Reviewed 342c91c4).

| Id | Severity | Scope | Status |
|---|---|---|---|
| plan-B1-1 | blocker | local | fixed plan (check stage `test:preview` lacks the ts hooks and the new tests) |
| plan-B1-2 | blocker | local | fixed plan (`eq_weapon` 512 rows breaks the 131072 B budget at 3x; split `eq_*` by tier) |
| plan-B1-3 | blocker | local | fixed plan (homebrew `Index`: `cards.json`, `related`, Storage base from `env.SUPABASE_URL`) |
| plan-B1-4 | blocker | local | fixed plan (read caps 262144 B to 65536 B; measure CPU at the cap) |
| plan-B1-5 | blocker | local | fixed plan (fixtures from a small pinned catalog, not the real build) |
| plan-B1-6 | blocker | local | fixed plan (Q2 gates the B1 squash; `rights` field; DPCGL notice in `openapi.json`) |
| plan-B1-R1 | risk | local | fixed plan (`data_version` in every apidata file) |
| plan-B1-R2 | risk | local | fixed plan (roll result to record v1: read count and parse cost) |
| plan-B1-R3 | risk | local | fixed plan (JSON responder, `nosniff`, CSP `sandbox`, no raw echo) |
| plan-B1-R4 | risk | local | fixed plan (copies of the product law: `PRODUCT.md`:78, `META.md` section 3, `.claude/README.md`:3625, `README.md`:333 and RU twin, `llms.txt`:336) |
| plan-B1-R5 | risk | local | fixed plan (empty Russian side: `nameOf`/`descOf` fill from English) |
| plan-B1-R6 | risk | owner | fixed plan (privacy pages: one sentence on whole-list answers; owner decides) |
| plan-B1-R7 | risk | deferred-scope | fixed plan (Pages CORS on `/apidata/*` unverified) |
| plan-B1-R8 | risk | local | fixed plan (share `rowsOf` between app and service) |
| plan-B1-N1..N9 | nit | local | fixed plan (files list, comment, `2d6` example, `rows`/`max`, section id, chunk estimate, tier precedence, 415, OpenAPI rule in D1/D3) |

Second look: `reviews/plan-B1-2.md` (verdict incomplete, stopped at the usage wrap-up 2026-11-10 17:47 UTC; findings lean fix-then-continue).

| Id | Severity | Scope | Status |
|---|---|---|---|
| plan-B1-2-1 | blocker | local | fixed plan (license text overclaims: covered clause must say "records whose text SRD 2.0 holds"; test must not pin "Hope & Fear" outside) |
| plan-B1-2-2 | blocker | local | fixed plan (B0-before-squash rule is prose only: `licenseOf` returns `owner` while `reviewed` is null; test + acceptance line) |
| plan-B1-2-R1 | risk | local | fixed plan (`dpcgl` covers English text only; credit the README "Sources" names, not "daggerheart.su and own translation") |
| plan-B1-2-R2 | risk | local | fixed plan (B0 fires the batch-review trigger: agent definition and `llms.txt`; add review to handoff and gate cost) |
| plan-B1-2-R3 | risk | local | fixed plan (`/api/v1/me/` and `*` contradiction between 3.4 and 5.1/11) |
| plan-B1-2-R4 | risk | local | fixed plan (section 11 must freeze every field name and type and value list of each answer format) |
| plan-B1-2-R5 | risk | local | fixed plan (audit match rule: normalized text, near matches listed, `page` = 1-based PDF index) |
| plan-B1-2-N1..N6 | nit | local/deferred-scope | fixed plan; third look 2026-11-10: fix-then-continue, see below (stale "second look" line; B0 follow-up commit gate cost; cite phrases not line numbers; squash and merge-back path before B2; one `reviewed` date per table; B5 `/me` allowlist reason is deferred-scope) |

Third look: `reviews/plan-B1-3.md` (verdict fix-then-continue; the 13 findings of the second look were applied correctly).

| Id | Severity | Scope | Status |
|---|---|---|---|
| plan-B1-3-1 | blocker | local | fixed plan (homebrew index lacks catalog set members: add `members` to `cards.json`; shared lists build one index with all snapshots as `linked`) |
| plan-B1-3-R1 | risk | local | fixed plan (mid-task squash has no decision: write "ai-mcp lands on main in two squashes", amends 2026-10-21) |
| plan-B1-3-R2 | risk | local | fixed plan (gate cost: B1 batch review and merge-back unpriced; B1 about 47 min, sum about 3 h 30) |
| plan-B1-3-R3 | risk | local | fixed plan (B0 match rule must strip all whitespace, hyphens, soft hyphens and expand ligatures) |
| plan-B1-3-N1..N9 | nit | local | fixed plan (745 = items 364 + eq 381, order; llms.txt and README clause wording; apiRecord signature; `ApiSite = Site & { art }`; request check order; host-guard 301 exception; `api-data.mjs` exit 1; B5 weak reason; source-audit skill step) |

