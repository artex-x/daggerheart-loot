# 2026-11-19 - Notes sit side by side from 761 px and a lone note takes the line measure

- Superseded in part by "A note pair takes two equal columns and the owner row's rail runs full height" (2026-11-19): a pair is two equal columns, side by side from about 50ch each.
- Task: `note-wide-layout` (owner, 2026-11-19, option E).
- Decision: from 761 px the players note and the GM note stand in one wrapping group, side by side when both fit, each at most `--measure-text` (70ch); a note with no sibling takes `--measure-line` (120ch). It holds for list-level and item-level notes (shared lead line and row, owner row, rolled entry). Up to 760 px nothing changes (`HitNote`, `FEATURES.md` "Lists", `DESIGN.md` "The Measure Rule").
- Rejected: A alone, 120ch for every note (a pair would stack at 860 px and lose the side-by-side use of width); D alone, 70ch for a lone note (the owner read the empty width beside it as the defect); B, a media query for two columns (the wrap point differs in EN and RU); C, leave the cap; F, a side plate on the shared page (a new layout and the largest gate cost); G, fold on wide screens (hides text the owner reads whole today).
- Accepted trade-off: a lone note line is about 130-140 characters, past the 80-character guide (WCAG 1.4.8); a lone note that gains a sibling while the page is open narrows to 70ch.
- Evidence: measured 2026-11-19 on this host: 499 px note boxes in a 1440 px column at 1900 px, a 296 px owner side plate unchanged.
