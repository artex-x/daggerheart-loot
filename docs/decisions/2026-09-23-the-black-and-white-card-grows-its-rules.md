# 2026-09-23 - The black-and-white card grows its rules text to a cap under the name

- Task: `61`, human decision (find it with `git log --grep="Task: 61"`).
- Decision: `fit()` grows a black-and-white card's rules text from
  3.5cqw to at most 5cqw while it fits, then shrinks as before. Colour
  is untouched. The 63x88 mm card stays the default sheet.
- Rejected: replacing the 3x3 sheet with a 4x4 of 44x63 mm cards - every card
  dimension is `cqw`, so it is the same card at 70%: the blank share is
  unchanged, the default text 4.3 pt, the floor 3.2 pt, both Figma nodes
  lost, and the sleeves do not fit (the opt-in compact sheet: "The compact
  sheet is an independent size switch"); growing colour text too - it takes
  the space from the picture, inverting the ladder's order; scaling the whole
  composition (name, tags, strips) - `print.js` measures the strips in design
  units; a cap of 5.5cqw - 1-4 points less blank for text nearly the name's
  size.
- Accepted trade-off: a one-line card stays more than half blank; text
  size varies from card to card between 2.6 and 5cqw; the
  black-and-white node's 12/344 text size becomes a starting size.
