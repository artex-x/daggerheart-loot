# Task 57, batch S3 - the whole-app review remediation

Source: `reviews/whole-app-prod.md` (P), `reviews/whole-app-signed-in.md` (S),
`reviews/whole-app-owner-chrome.md` (O); the AFK defaults A1-A8 of 2026-11-06 (settled).

## Batch criterion

One batch. Every line shares the same gates: one `build:test`, the shell, sheet, dialog,
bar and head components, the same golden families (`#/lists`, `#/homebrew`, `#/tables/`,
`#/roll/`, `#/search`) and the same states shards. No line changes a public contract, a
route or a filter set, so no split criterion applies.

## Lines

| Id | Finding | Change |
|---|---|---|
| S3-1 | P B1, S B3, O 4 | `Shell`: a route change whose last focused element left the DOM focuses `#main` (one rule). FEATURES.md rule 20. Unit test (`shell.test.ts`), states case 116 |
| S3-2 | P B2, S B7, S B8 | One scrim token `--scrim`, no blur, on the record dialog, `Sheet` and `CropDialog`; the crop dialog takes the `Sheet` shape and place. DESIGN.md "Sheet". States case 117, case 72 |
| S3-3 | P B3, S R6 | `/tables/*` draws «Ещё» through `MoreMenu`; `/lists` loses its 44 px override: one size (`sm`, 40 px up to 600 px, the Thumb Rule). FEATURES.md "Lists" |
| S3-4 | O 1, S B4 | `/lists`: the tool group follows the search box and the count (`.grow ~ .end` as `/homebrew`); the import toggle 40 px in the count row. FEATURES.md rule 9 |
| S3-5 | S B1, S B2 | `SelectionBar` fixed to the window bottom, the footer reserves `--selbar-h`; the dialog and sheet toasts clear the dock or foot up to 760 px (`--dock-h`). States case 118 |
| S3-6 | S B5, B6, B9, N2 | «Новый предмет» plus icon at every width; roll mode pills take the body line height from 601 px; the dialog's add-to-list popover keeps the 16 px gutter; `Menu.svelte` cites FEATURES.md "Chrome" |
| S3-7 | A3, A4, A5 | `Menu` and `AddToList` take `var(--shadow)`; the empty owner's list sentence and its two keys go (RU, EN); the table picker sheet's group chips draw no check |
| S3-8 | A7 | The list row tick input grows to clear axe `target-size`; `TextInput` cuts with an ellipsis while it has no focus |
| S3-9 | A6, A8 | Deferred and `DEBT.md`: the four signed-out prompts, the 212 px `/s/` bar at 360, the Shapes toast radius text, the record dialog «Ещё» scroll at 1000/1180x720, the `/lists/<uuid>` lead |

## Gate cost

`build:test` about 2 min; the affected vitest files one at a time, about 12 min; golden
re-seeds per family about 20 min; the new and affected states cases about 12 min; lints and
`check:built` about 4 min; `check:fast` about 14 min. Total about 65 min, one CI run.

## Status

Implemented (implementer, 2026-11-06); the acceptance table and the deviations are in `handoff.md`,
"Completed", batch S3.
