# 2026-09-24 - The guards judge PowerShell tool commands as well as Bash

- Task: `persist-0-foundation`.
- Context: on this Windows host Docker answers only the PowerShell tool, so
  the Supabase work runs there; `settings.json` guarded the Bash tool only,
  so a PowerShell `git commit`, `git reset --hard` or `supabase db reset
  --linked` passed every guard, and the new gates were bypassable.
- Decision: `bash-guard.mjs` and `check-observer.mjs` register for
  `Bash|PowerShell`. A PowerShell command is normalised (each backtick and
  the character after it become a space, `\` becomes `/`) and runs through
  the same rule families. The observer arms `check:db` from either tool and
  `npm run check` from Bash only.
- Rejected: denying `git` from PowerShell (blocks legitimate reads and still
  leaves `supabase` and `rm` unguarded); leaving PowerShell unguarded.
- Consequences: the normalisation is a habit guard, not a parser;
  `Remove-Item` and other cmdlets are not judged.
