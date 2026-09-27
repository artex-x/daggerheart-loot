# Review register - TASK persist-3-realtime

| Id | Severity | Scope | Status |
|---|---|---|---|
| plan-B3.1-B1 | blocker | local | fixed plan pass 2 (owner 2026-09-27: precursor commit `B3.0`, plan 10.0) |
| plan-B3.1-B2 | blocker | local | fixed plan pass 2 (5.4, 5.3, step 2 header read and warning wrapper, step 7 case, acceptance line) |
| plan-B3.1-R1 | risk | local | fixed plan pass 2 (step 1 fallback (a): every reset site, re-measure, CI timeout) |
| plan-B3.1-R2 | risk | local | fixed plan pass 2 (step 1 (a3) through a plain connection; stop if it fails) |
| plan-B3.1-R3 | risk | local | fixed plan pass 2 (fallback covers (b); `jwtFor` claims with `exp` and `aud`) |
| plan-B3.1-R4 | risk | local | fixed plan pass 2 (section 15: full list, serial order as the mitigation) |
| plan-B3.1-R5 | risk | deferred-scope | deferred (B3.2 refresh; plan section 11 and handoff Deferred) |
| plan-B3.1-R6 | risk | local | fixed plan pass 2 (section 14: CI's 20-minute limit named; fallback raises it) |
| plan-B3.1-N1 | nit | local | fixed plan pass 2 (step 10: `[a, c]` reads back `a, c, b`) |
| plan-B3.1-N2 | nit | local | fixed plan pass 2 (step 2: `coalesce(new.owner_id, old.owner_id)`) |
| plan-B3.1-N3 | nit | local | fixed plan pass 2 (file table: DEBT intro reworded) |
| plan-B3.1-N4 | nit | local | fixed plan pass 2 (test retitle in B3.1 step 10; comment placed on B3.2 acceptance) |
| plan-B3.1-N5 | nit | local | fixed plan pass 2 (step 11: Q2 and Q3 decision files) |
| plan-B3.1-N6 | nit | local | fixed plan pass 2 (owner-topic file dated 2026-09-26) |
| plan-B3.1-N7 | nit | local | fixed plan pass 2 (step 8: B's entry keeps its position) |
| plan-B3.1-N8 | nit | local | fixed plan pass 2 (step 1: Node `postgres` script or `docker exec ... psql`) |
| plan-B3.1-N9 | nit | deferred-scope | fixed plan pass 2 (handoff Status: `blocked`) |
| plan-B3.1-2-R7 | risk | local | open (a branch cut before `B3.0` fails `e2e` after B3.1's test push; one-line note rides `B3.0`) |
| plan-B3.1-2-N10 | nit | local | open (10.0 Files: add `docs/specs/COVERAGE.md`; rides `B3.0`) |
| plan-B3.1-2-N11 | nit | local | named (no action in `B3.0`; B3.1 step 10 retitles) |
