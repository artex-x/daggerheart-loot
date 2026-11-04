# 2026-11-03 - Up to 760 px the header hides on scroll down and returns on scroll up

- Task: `57` (owner, 2026-11-03, end-user feedback F2, answer Q2).
- Decision: on every page up to 760 px the whole header leaves on a scroll down and returns on a scroll up; `app/src/lib/headerScroll.ts` holds the rule, the `scroll` port the reads, `DESIGN.md` "The Hidden Header Rule" the guards. `--sticky-h`, the measured height, is the page's `scroll-padding-top` at every width (WCAG 2.4.11).
- Rejected: the brand row scrolls away and the jobs stay (six lines of CSS and no state, but the header never returns, and the owner asked that it does); no change (1.5 fewer rows at 360x640); the list pages only (two headers at one width and a route table in the shell); a `focusin` handler for the reveal (`:focus-within` has no race with a scroll); a fixed `--sticky-h` (the header is 152 px at 320 px in English, not 111 px).
- Accepted trade-off: the header moves under the thumb, and the language and account controls need a scroll up.
