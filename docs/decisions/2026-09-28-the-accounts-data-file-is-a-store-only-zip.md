# 2026-09-28 - The account's data file is a store-only zip with one JSON file per kind

- Task: `persist-6-import-export` (the owner answered Q5 with B on 2026-09-27).
- Decision: «Скачать мои данные» on `#/account` downloads
  `daggerheart-loot-data-<YYYY-MM-DD>.zip`: one JSON file per kind at the root, each with its
  own `format` and `version` - today `lists.json`, an `import-v1` file; homebrew and pictures
  join later as new root files. `app/src/lib/zip.ts` writes it store-only and reads it with a
  hand-written reader that refuses zip64, encryption, a second disk and more than 1000
  entries; it loads by a dynamic `import()`. Import takes this zip or a plain JSON file,
  told apart by the bytes. The layout is frozen in `docs/specs/CONTRACTS.md` section 4.
- Rejected: one JSON file with a section per kind (the owner chose a zip, which can hold
  pictures later); fflate (several kB gzip even tree-shaken, and its deflate is unused by a
  store-only file); `CompressionStream` (it compresses bytes but neither builds nor reads the
  zip container); a generic `daggerheart-loot/data` format (the zip is the container, so no
  JSON document needs a generic name).
