# 2026-11-07 - The Last Round Table records keep rule text and lose lore

- Amends "Pistolheart, The Last Round Table and Veiled Halls are sources ph, lr and vh" (2026-11-07): the 26 lr records carry rule text only.
- Task: `roll-per-line` (owner request, 2026-11-07).
- Decision: the 26 `lr` records keep the sentences that state a rule (a number, a trait, a move, a condition, a limit) and a feature paragraph whole; a sentence that only describes appearance, history or world flavor is dropped. Five records stay as they were (`lr3`, `lr6`, `lr9`, `lr12`, `lr16`). The Russian is cut in step with the English and is not re-translated. The removed text stays in git: `git show 1af46a61:data.js`.
- Rejected: keep the lore (the `lr` descriptions average 344 characters against 147 for the other records); rewrite or summarize the lore (it invents text the book does not print); move the lore to a `lore` field or a file (dead data that nothing reads).
- Evidence: after the trim `lr` averages 225 (EN) and 247 (RU) characters; the longest text is `lr6` at 431 (EN) and `lr20` at 510 (RU); `tests/derived.js` caps a record at 450 and 520.
- Accepted trade-off: `lr` now differs from the other sources, which keep their descriptive sentences (`voa` averages 319 characters, `dv` 228); applying the rule to another source is a separate owner decision.
