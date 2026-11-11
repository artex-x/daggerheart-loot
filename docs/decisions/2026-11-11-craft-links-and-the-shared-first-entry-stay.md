# 2026-11-11 - Craft links and the shared page's first entry stay as they are

- Task: `57-debt` (accepted design; the AFK default of 2026-11-10).
- Decision: the links and the «и ещё N» fold of a craft or relation line stay under 24 px (`TARGET_ALLOW` in `tests/app/lib.js`, WCAG 2.5.8 "Inline"), and `/s/<token>` at 360x640 starts its first entry at 309 px against the 256 px rule (`FIRST_SCREEN` in `tests/app/states.js`, DESIGN.md "The First-Screen Rule"). Both entries keep a comment that cites this file.
- Rejected: a 24 px box on the craft links (it comes closer than 2 px to a badge on the line above); a spacing fold on the `/s/` head (it needs 52 px, and the gaps above the first entry add up to 50 px, so only a move of «Сохранить себе» reaches 256 px, and that button is the thumb-size action the page exists for).
- Evidence: measured 2026-11-10 on the test build at 360x640: the first entry starts at 308.2 px; header to 110, `h1` 136-173, sub 177-201, «Сохранить себе» 211-254, the find row 264-304.
