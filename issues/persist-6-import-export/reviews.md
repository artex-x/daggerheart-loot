# Review register - TASK persist-6-import-export

One row per finding. Status: `fixed` (the plan applies it, section named),
`placed` (an acceptance line of a later batch), `deferred` (the handoff's
Deferred), `open`.

## `reviews/plan-B6.1.md` - plan before B6.1, fix-then-continue (2026-09-27, reviewed `4e55c46c`)

| Id | Finding | Severity | Scope | Status |
|---|---|---|---|---|
| `plan-B6.1-1` | B1a: an empty list name exports as `""` and fails `minLength` 1 | blocker | local | fixed - 4.3 `toBundle` writes `untitled`; round-trip cases; B6.1 acceptance |
| `plan-B6.1-2` | B1b: moved lists over 100 entries and accounts over 50 lists export files the schema refuses | blocker | local (owner Q6) | fixed - owner answered Q6 2026-09-27 (keep the bounds); 4.15, section 11, FEATURES and hint text in B6.2 |
| `plan-B6.1-3` | B2: `readZip`/`readDataZip` under-specified for hostile or re-zipped input | blocker | local | fixed - 4.14 "The reader's contract" rules 1-9; `zip.test.ts` pins; frozen rules in `CONTRACTS.md` (step 10); B6.1 acceptance |
| `plan-B6.1-4` | Risk 1: `tests/derived.js` count check fails on "100 entries" in `llms.txt` | risk | local | fixed - 4.9 P2 wording rule, m15 draft reworded, 4.15 dict rule, B6.1 acceptance |
| `plan-B6.1-5` | Risk 2: a large import times out at 20 s or reads 57014 as `network` | risk | local | fixed - 4.5 `IMPORT_TIMEOUT_MS` 120 s, 57014 -> `refused`/`tooBig`; contract case 6 (notes-heavy 5 MB); Fallback |
| `plan-B6.1-6` | Risk 3: `import_lists` has no entry cap; AFTER ROW limit fires late | risk | local | fixed - 4.5 step 3 caps `entries` at 5000 (22023); step 7 case |
| `plan-B6.1-7` | Risk 4: `check:db` may pass the 600 s cap | risk | local | fixed - step 12 names the background-run rule; section 12 |
| `plan-B6.1-8` | Risk 5: a plain rebase replays `B3.1`; which uncommitted copy wins | risk | local | fixed - delta check uses `git rebase --onto <main> 1cbca5f7`; committed task files win; section 12 |
| `plan-B6.1-9` | Risk 6: a committed import with a lost answer can be re-applied | risk | local | fixed - 4.5 Store re-reads on `network`; section 12 names the residue |
| `plan-B6.1-10` | Risk 7: `BatchBar` CSS scoping of snippet classes | risk | local (B6.2) | placed - section 9, B6.2 refresh |
| `plan-B6.1-11` | Risk 8: R4's `ListCard` pending line not in the mocks | risk | local (B6.2) | placed - section 9, B6.2 refresh; delta line D9 |
| `plan-B6.1-12` | Risk 9: a hidden ticked card can be deleted | risk | local (B6.2) | placed - section 9: a filter change prunes the selection |
| `plan-B6.1-13` | Nit: grants case pins `proconfig` and `service_role`; 42501 leaves B unchanged | nit | local | fixed - step 7 |
| `plan-B6.1-14` | Nit: P2 cuts at a line-start `## `; bounds as whole numbers | nit | local | fixed - 4.9 P2 |
| `plan-B6.1-15` | Nit: P3 needs structural checks on `from-llms.json` | nit | local | fixed - 4.9 P3 pass line |
| `plan-B6.1-16` | Nit: `CONTRACTS.md` fixture line and section 5 | nit | local | fixed - step 10 |
| `plan-B6.1-17` | Nit: 4.12's "works offline once cached" is false | nit | local | fixed - 4.12 |
| `plan-B6.1-18` | Nit: `grep -n` breaks the host's shell rules | nit | local | fixed - step 8 uses `git grep -n` |
| `plan-B6.1-19` | Nit: "file order" for errors undefined | nit | local | fixed - 4.3 walk order |
| `plan-B6.1-20` | Nit: cap the names in `importZipOther` | nit | local | fixed - 4.6 texts, 4.14 |
| `plan-B6.1-21` | Nit: handoff "Task status: planned" is not in the template's set | nit | local | fixed - handoff Status `blocked` |
| `plan-B6.1-22` | Nit: B6.2's owner statements 1-7 in one acceptance bullet | nit | deferred-scope | deferred - handoff Deferred; the B6.2 refresh splits it (section 9) |
| `plan-B6.1-23` | Nit: `zlib.crc32` needs Node 22.2; `engines` says `>=22` | nit | deferred-scope | deferred - handoff Deferred (`.nvmrc` pins 24, CI is fine) |

Accepted deviations (the report's own section): `import_lists` as
`security invoker`; the atomicity check in the shared contract case;
batch deletion through the write buffer; the roadmap rows and R7's plan
left to their own refreshes.

Next: the second look, `reviews/plan-B6.1-2.md`.
