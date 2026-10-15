# 2026-10-15 - The editor previews the print with the print card at its printed size

- Task: `authoring-print-preview` (owner, 2026-10-14: Q1-Q4; refresh defaults, 2026-10-15).
- Decision: the item editor's «На печати» draws `PrintCard` with its own `fit()` in a one-cell frame of the sheet's track
  (63x88 mm, 44x63 mm compact), never scaled, in the form's text language; its colour and size switches are
  `PrintSwitches.svelte`, the print page's visit pick. `fit()` reports a card that still cuts off text (`onfit`: the text
  box down and across, the name across, the content box down): the editor warns after the «Описание» counter and the
  print page counts the cards in its bar, both in the warning box, blocking nothing (`FEATURES.md`, "Homebrew", "Print",
  rule 19). The print card follows the draft 150 ms after the last change (`PREVIEW_FIT_MS`).
- Rejected: a scaled A4 sheet (a transform makes `fit()` compare scaled and unscaled sizes); a smaller look-alike card (a
  second layout to keep equal by hand); the print page in a frame (a stored set, a write per pause, sign-in round trips);
  a warning with no card (the author cannot see where the cut falls); the error look (owner, Q2: a warning, never a
  block); a fit per keystroke; the content box counted across (a long source line overflows it on the compact card, and
  no shorter text mends that).
- Evidence: one re-render and fit of the 3000-character card on `#/p/set-clipped1` takes 7-17 ms per layout (median of
  six: colour 16, black and white 10, compact colour 14, compact black and white 9), measured 2026-10-15 on this host.
