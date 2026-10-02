# 2026-09-30 - Homebrew travels as its own file; a lists file v2 carries frozen entries

- Amended by "A lists file is version 2 only when it holds homebrew" (2026-10-02): the download reads «Скачать JSON».
- Task: `persist-7-homebrew`, for release `persist-7d-homebrew-files` (owner's item 8 and answers to Q7 and Q9, 2026-09-30; planner).
- Decision: `daggerheart-loot/homebrew` version 1 (`schema/homebrew-v1.json`: `books` with sections,
  `cards` and `items` in the catalog's field names under their `hb_` keys) is written by «Скачать
  предметы (JSON)» and as `homebrew.json` in the account zip, and read by «Импорт предметов» through
  `import_homebrew` (security invoker, one transaction): a held key is skipped, or updated when the
  GM chooses (default skip; references stay live, frozen copies do not move). The file's sources are
  created, each mapped in the preview onto a new or an existing source (default: the held key, then
  the same name). `daggerheart-loot/lists` version 2 adds `source: "homebrew"` entries with a
  required `snapshot`; v1 stays. A file's bounds are the import call's ceilings, never the defaults.
- Rejected: a `homebrew` array in the lists file (a lists file stays lists); an `import_bundle` RPC
  (the client turns a held key into a reference); skip-only import (the GM iterates on a converted
  source); file bounds equal to the default limits (an override could not import its own export).
