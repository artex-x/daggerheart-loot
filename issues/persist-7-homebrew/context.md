# Shared task context - TASK persist-7-homebrew

## Goal
Release R7: homebrew items (the same record shape as official items), a
"Your homebrew" search group, add-to-list as an immutable snapshot, and
bundle schema v2. Batches `B7.1`, `B7.2` in the roadmap; they may change.
R8 (homebrew art) and R9 (`#/h/<token>` item links, add and clone, print
routes for cloud lists) build on this design.

Planned ahead (2026-09-25) while R2's last batch is being built. Design
level plus owner questions now; the implement-ready steps get a refresh
before the build.

## Sources (read, do not re-fetch)
- Roadmap `issues/persistent-storage/plan.md`: sections 3, 5, 9, 12, 14
  (R7, and R8/R9 as consumers), section 16 (decisions 7 "catalog
  authority", 31 limits with homebrew items as a count limit, 40 the
  `delete-account` Edge Function and the `homebrew-art` bucket), section
  17 (deferred: homebrew Trash, import beyond create-only).
- `issues/persistent-storage/context.md`: the limits amendment (homebrew
  items are a row in `limit_defaults`).
- R2's task `issues/persist-2-lists/`: `plan.md` section 4.2 (the B2.1
  schema: `list_entries.source` and `snapshot`, 16384-byte bound that
  "R7 may widen").
- `data.js` (canonical catalog), `app/src/lib/types.ts` (the record
  shape), `app/src/lib/data.ts` (index and search), `CLAUDE.md` "Product
  laws" (never infer equipment tier from stats), the `daggerheart-*`
  skills for terminology.
- R6 (bundle v1) is being planned in parallel; v2 extends v1 - name the
  seam with R6's plan, do not redesign v1.

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
