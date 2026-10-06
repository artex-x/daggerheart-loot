# 2026-10-02 - A lists file is version 2 only when it holds homebrew

- Superseded in part by "An item is read by its id by anyone; a list holds a live link" (2026-10-07): every homebrew entry is written from the live item, and an entry the account does not hold imports as an own copy.
- Amends "Homebrew travels as its own file; a lists file v2 carries frozen entries" (2026-09-30): the download reads «Скачать JSON».
- Task: `persist-7d-homebrew-files` (R7d, batch `B7d.2`; the owner confirmed the two-press restore, 2026-10-02).
- Decision: a lists export is `import-v2` only when it holds an own item or a frozen copy, each with its snapshot
  (a reference's live item, a frozen copy's own); any other export stays `import-v1`, byte for byte. The data zip
  holds `lists.json`, then `homebrew.json` when the account holds a source, a card or an item. «Импорт предметов»
  reads a zip's `homebrew.json` and «Импорт из файла» its `lists.json`, each naming the other file with its page; a
  restore into another account is two presses, homebrew first, so the lists keep live references. A download that
  writes own items waits for the account's items. The homebrew downloads read «Скачать JSON», the lists pages' label,
  not D6's «Скачать предметы (JSON)».
- Rejected: always version 2 (an older tab refuses version 2, and an official-only export loses nothing as v1);
  leaving own items out of the lists file (a restore loses every list reference); one press on «Мои списки» that
  imports both files of a zip (homebrew with no «Куда» preview, and the two panels coupled); a zip that silently
  lacks `homebrew.json` while the items load (a backup that loses data without a sign).
