# DEBT.md - defects kept on purpose, owed to a named task

A live defect the app ships on purpose, with the task that owes its fix. Each
entry reads **Where** / **What** / **Why deferred** / **How to verify the
fix**, is written in the batch that decides to defer it, and is deleted by
the batch that pays it. Sections are the tasks that owe the entries; a
section with no entry left is deleted. A kept design is a decision
(`docs/decisions/`), not an entry; a refactor question with no
user-visible defect does not belong here. Why this file is the home:
`docs/DECISIONS.md`, "Kept defects live in `docs/specs/DEBT.md`, grouped by
the task that owes them".

## Copy and prompt leftovers (task `57-debt`, owner first)

### D134 - four shapes of the sign-in prompt on sibling pages

- **Where**: `ListsPage.svelte` (the empty plate with the glyph), `HomebrewPage.svelte` and
  the `/tables/homebrew` page (a bare line and «Войти»), `ListPage.svelte` signed out (the
  error page with two actions).
- **What**: signed out, `/lists`, `/homebrew`, `/tables/homebrew` and `/lists/<uuid>` draw
  the same prompt in four shapes; each is named in FEATURES.md, none with a reason for the
  difference (production review, 2026-11-06).
- **Why deferred**: one shape changes four page layouts and their first screens; the owner
  picks the shape (AFK default A6, 2026-11-06).
- **How to verify the fix**: one `SignInPrompt` shape on the four routes at 360 and 1180 px,
  RU and EN; case 83's rows for them unchanged or lower.

## Visual leftovers (task `57-debt`, owner first)

### D131 - two compact color print cards print their rules text under the floor

- **Where**: `app/src/components/PrintCard.svelte` (`SHORTFALL`), on the RU compact color
  sheet.
- **What**: `voa4_t4i` and `voa4_a3` print their rules text at 3.4cqw (4.2 pt), under the
  compact floor of 3.7cqw, so their burden and tier marks clear the tags and the name
  (`FEATURES.md`, "Print").
- **Why deferred**: at the floor the text overruns the card, and a smaller mark or a cut text
  changes the Figma layout.
- **How to verify the fix**: `tests/app/print.js` on the RU compact color
  sheet reads no `.pc-text` under 3.7cqw and no mark over a tag or the name.
