# 2026-10-21 - The homebrew export writes homebrew-v2 always

- Task: `debt-cleanup` (owner, 2026-10-19, question Q6 answered A).
- Decision: every homebrew writer (a source row's and the strip's «Скачать JSON», the data zip's `homebrew.json`)
  writes `version` 2 with the `homebrew-v2` `$schema`, also when no card holds book items. The import hint links
  `schema/homebrew-v2.json` and `llms.txt` only. The import still reads version 1, and
  `schema/homebrew-v1.json` stays published with its bytes; both schemas' descriptions keep their published words.
- Rejected: B, delete v1 and refuse v1 files (files in the wild carry it, and the URL is frozen); C, both links
  with an explanation (the owner's report: two schemas in the hint confuse).
- Accepted trade-off: a tab older than homebrew-followups (2026-10-08) refuses the new exports, as it refuses any
  v2 file; a revert writes v1 again for an account with no card book items, which every bundle reads. An export
  with no card book items now states each card's book items on «Обновить» (the 2026-10-21 decision on it).
- Amends "An own set or rule card holds book items; only its account sees them" (2026-10-08): the export writes `homebrew-v2` always.
- Amends "Homebrew travels as its own file; a lists file v2 carries frozen entries" (2026-09-30): the export writes version 2.
