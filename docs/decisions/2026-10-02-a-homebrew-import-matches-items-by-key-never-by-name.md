# 2026-10-02 - A homebrew import matches items by key, never by name

- Task: `persist-7d-homebrew-files` (R7d; the owner chose option 1, 2026-10-02).
- Decision: the key is the only identity of an item or a card in a
  `homebrew-v1` import. A file item with a new key is added even when the
  account holds an item of the same name, and the preview counts those
  items in one note, «Предметов с таким же названием уже есть: N - они
  добавятся ещё раз» (`docs/specs/FEATURES.md`, "Homebrew", "Import";
  `llms.txt`; the hand test `same-names.json` in
  `docs/fixtures/homebrew-file/README.md`).
- Rejected: a name match counted as held (two items of one name make it
  ambiguous, and a rename would break the match); silent duplicates (the GM
  learns about them only on `#/homebrew`).
- Accepted trade-off: a file made by hand with fresh keys for items the
  account holds imports them a second time; the note says so before the
  press.
