# B1.4 mocks - account preferences (pre-pass, 2026-09-24)

## Why there is no HTML mock

B1.4 draws nothing new under the recommended answers. The roadmap (section 3,
"Account preferences") keeps the controls where they are, with no settings page
and no sync indicator. Language, starting-section pin, tables list/grid and
print colour/bw plus standard/compact keep their current controls and markup.
The only changes a signed-in user can see are state changes:
- the controls start in the account's values on any device. First paint uses
  local values, then flips once the session resolves (roadmap: local is what
  boot draws);
- print colour/bw and compact survive a reload and a new device, because they
  are no longer session memory.
Goldens differ only in which chip is pressed (`as gm1` vs signed out).

One exception: "default money mode for new lists" has no control today. Money
mode is per list only (`ListPage.svelte` money chips; `StoredList.money`).
Answer 1 below decides it. If the owner picks option C (a visible control),
the B1.4 planner refresh produces the mock. Options A and B need none.

## Decisions to take (reasons in the planner's report)
1. Default money mode: A drop it from R1; B the last mode picked on an own
   list becomes the default for new blank lists (recommended); C a new control.
2. Print layout persistence for anonymous users: persist in `dhloot.prefs.v1`
   for everyone (recommended), or only for signed-in users (as the roadmap is
   written).
3. Backup content: include `auth` user rows (recommended), plus one privacy-page
   sentence saying encrypted backups are kept for 30 days after deletion.
4. Backup time: `17 3 * * *` UTC (recommended).
5. `SUPABASE_DB_URL_PROD` scoped to a `production` Environment that allows only
   `main` and has no reviewers (recommended).
6. `skip_e2e` never ships a migration to prod (recommended).
7. Rule 2n: deny every hosted-capable `supabase` subcommand by default, with an
   allowlist of local ones (recommended). Close the 2l `git commit <pathspec>`
   and `-a` gaps in the same hook edit.
8. A one-time restore drill into the test project at R1 closeout (recommended).

## Owner answer (2026-09-24, Q&A)

- Q1: option A - drop "default money mode for new lists" from R1 (a
  roadmap item removed; the B1.4 refresh records it in docs/DECISIONS.md).
- Q2: yes, print layout persists for everyone in `dhloot.prefs.v1`.
- Q3: yes to both - backup includes auth rows; privacy page sentence.
- Q4: `17 3 * * *` UTC.
- Q5: NO - `SUPABASE_DB_URL_PROD` stays a repository secret; no Environment.
- Q6: yes - with `skip_e2e` and a new migration, `migrate-prod` and `deploy` refuse.
- Q7: yes, both - deny-by-default hosted `supabase` subcommands and close
  the `git commit -a` / `git commit <path>` gaps in B1.5's hook edit.
- Q8: yes - restore drill at R1 closeout.

The owner may adjust in later batches.
