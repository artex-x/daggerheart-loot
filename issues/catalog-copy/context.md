# Shared task context - TASK catalog-copy

Orchestrator (or first worker) maintains this file so later steps do not re-fetch the same sources.

## Goal
- «Копия из каталога»: an author copies a catalog item into their homebrew to rebalance it,
  then edits the copy as an own item.
- Not planned. Recorded by `debt-cleanup` B1 (2026-10-15) as a named follow-up: a new
  capability, not a shipped defect, so it has no `docs/specs/DEBT.md` entry.

## GitHub issue (if any)
- URL: none.
- Captured or last verified: 2026-10-15, from the owner's carries of 2026-10-14 (the decisions
  file `issues/owner-afk-2026-10-13/decisions.md` in the main checkout, untracked; carry K5 of
  `debt-cleanup`).
- Title: Copy a catalog item into the author's homebrew.
- Summary (facts only):
  - The owner wants an author to start an own item from a catalog item and change its numbers.
  - Today «Сохранить себе» (`PickRow.svelte`) copies an item of another account into the
    reader's homebrew; nothing copies a catalog record.
- Decisions already settled: none.
- Open questions (the owner's, 2026-10-14):
  1. The copy's source and section: the catalog record's source, a source the author picks, or
     none.
  2. Whether the copy keeps a link to the catalog record it came from, and what that link
     shows.
  3. The picture: whether the copy reuses the catalog record's `img`.
  4. Rule and set cards: whether the copy takes the catalog record's set and rule cards, and
     as what (catalog references or own cards).
  5. List rows that name the catalog item: whether they stay on the catalog record or move to
     the copy.

## Screenshot / attachment findings
- none.

## Key paths
- Specs: `docs/specs/FEATURES.md` ("Homebrew", "Records"), `docs/specs/CONTRACTS.md` (record
  ids and keys), `docs/specs/STATE.md`.
- Code hot paths: `app/src/components/PickRow.svelte` (the existing «Сохранить себе» copy),
  `app/src/state/homebrew.svelte.ts`, `app/src/lib/homebrew.ts`.
- Mocks: none.

## Command costs

Not measured for this task; `debt-cleanup`'s `context.md` holds the current figures.

## Which machine is authoritative
- For recorded numbers: this Windows host, idle.
- What a difference on another machine means: load, not a regression.

## Reasons already disproved

- none.

## Constraints
- Contracts / parity / i18n notes: a catalog record id and key never change; any new string has
  both languages.

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
- You suspect drift vs issue or plan
