# Review register - TASK persist-7-homebrew

## `reviews/plan-B7.1.md` - plan before B7.1, fix-then-continue (reviewed `7005abeb`)

| Id | Finding | Severity | Scope | Status |
|---|---|---|---|---|
| `plan-B7.1-1` | `clone_shared_list` (2h) and the fake's clone turn the owner's frozen copies into references; decide from the source row's `snapshot` | blocker | local | fixed in plan - 4.8, steps 2h, 12, 13, 15, acceptance; D4 (planner, 2026-09-30) |
| `plan-B7.1-2` | `list_entries_reference_exists()` and `my_limit()` lack a fixed `search_path`; step 15 lacks the SECURITY DEFINER pin | blocker | local | fixed in plan - Constraints, steps 2e, 2f, 2g, 2h, 15, acceptance (planner, 2026-09-30) |
| `plan-B7.1-R1` | 32768-byte bound can refuse a valid item (C0 controls escape to 6 bytes); refuse C0 except tab and newline now | risk | local | fixed in plan - 4.1, Constraints, steps 2b, 4, 5, 15, acceptance; an R7d inherited line (planner, 2026-09-30) |
| `plan-B7.1-R2` | A retried update after a lost answer reads as `conflict`; answer `ok` when the row equals the patch | risk | local | fixed in plan - 4.9, steps 5, 8, 9, 12, 13, 14, acceptance (planner, 2026-09-30) |
| `plan-B7.1-R3` | The reversal deletes all homebrew data; add the undo note to `.claude/README.md` | risk | local | fixed in plan - steps 3, 18 (planner, 2026-09-30) |
| `plan-B7.1-N` | Local nits (step 7 citation, CONTRACTS note, e2e anon checks, D8 wording, mirror line, 2b fallback, case M wording, fake upsert, `load()` on `my_limit` failure, handoff) | nit | local | fixed in plan - 1: step 7; 2: step 18, Files; 3: step 14, Files; 4: 4.2, step 4, D8; 5: the 2026-09-25 mirror line; 6: step 2b; 7: step 14; 8: step 12; 9: 4.9, steps 8, 9, 12; 10: handoff, section 10 (planner, 2026-09-30) |
| `plan-B7.1-N11` | `B7c.1` tool list omits `tools/capture-share-fixture.mjs` | nit | deferred-scope | placed - `B7c.1` tool list, plan 7.3 (planner, 2026-09-30); closes when R7c's `B7c.1` ships |

## `reviews/plan-B7.1-2.md` - plan before B7.1, second look, approve (reviewed `7005abeb`)

| Id | Finding | Severity | Scope | Status |
|---|---|---|---|---|
| `plan-B7.1-2-N1` | Step 5's client C0 range starts at `\u0001`; start at `\u0000`, pin in `homebrew.test.ts` | nit | local | open - B7.1 |
| `plan-B7.1-2-N2` | Step 15 says seven validators; step 2b defines six | nit | local | open - B7.1 |
| `plan-B7.1-2-N3` | Step 15's pin: `service_role` EXECUTE expected none | nit | local | open - B7.1 |
| `plan-B7.1-2-N4` | Handoff "four mirror lines" -> five | nit | local | open - B7.1 |
