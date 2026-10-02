# 2026-10-02 - Field help is a «?» by the label; every input has its own visible label

- Task: `persist-7f-consistency` (owner's editor feedback and help rules of 2026-10-02; the field review's rows taken as recommended while the owner was away).
- Decision: rule 15 "Labels and help" of `docs/specs/FEATURES.md`, "Chrome",
  "Consistency rules": every input has a visible label in the game's own
  term, a field with several inputs labels each one («Порог Ощутимого
  урона», «Порог Тяжёлого урона»), a meaning the label and the rules do not
  explain sits behind a «?» by the label («Подсказка: <label>»,
  `aria-expanded`, closed when the form opens), and an always-visible line
  states only a limit, a format, fields that go together or a press's
  effect. The second stat set is a disclosure button so its «?» sits beside it.
- Rejected: every hint always visible (about ten paragraphs no author reads
  twice); a hover `title` tooltip (no touch, no keyboard); the page-style
  help box per field (wider than a field); short visible threshold labels
  with the full term in `aria-label` (the name would not contain the visible
  words, WCAG 2.5.3); a separate help document or a review prompt change.
