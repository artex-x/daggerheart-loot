# 2026-10-21 - On «Обновить» a homebrew-v2 file states each card's book items

- Task: `debt-cleanup` (owner, 2026-10-20: A, the file wins; owner, 2026-10-21: the confirm's count, its scope).
- Decision: «Обновить» with a version 2 file rewrites a held card of the same key and kind with the file's
  `items`, so a card loses each held book item its file card leaves out; a version 1 file keeps them. Since the
  export writes version 2 always, the confirm counts the cards that lose at least one (none stated, a subset or
  other ids) and adds «Книжные предметы уберутся из карт: N.» / "Book items are removed from cards: N." before
  «Отменить нельзя.» when N > 0 (`bookItemsDropped`). `llms.txt` tells an assistant to copy a held card's `items` from the GM's export.
- Rejected: B, a card without `items` keeps the held book items in both versions (a file could never remove a
  card's last book item, and `llms.txt`'s rule for v2 files in the wild would change); a confirm that names no
  book items (the loss stayed invisible before the press); a count of the cards with no `items` only (a card
  whose file `items` drop one of its book items lost it unseen).
- Accepted trade-off: an export of an account with no card book items, imported with «Обновить» into an account
  whose cards hold some, removes them after the confirm; recovery is to add them again on the Sets or Rules tab.
