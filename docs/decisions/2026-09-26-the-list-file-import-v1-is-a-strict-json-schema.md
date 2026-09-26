# 2026-09-26 - The list file `import-v1` is a strict JSON Schema; import makes new ids

- Task: `persist-6-import-export` (planner, 2026-09-26; the owner's R6
  answers confirm or amend it).
- Decision: account lists travel as one JSON document (`format`
  `daggerheart-loot/lists`, `version` 1, `lists[]` in `snake_case` with
  `catalog.csv` ids), published as a draft 2020-12 JSON Schema at
  `schema/import-v1.json` beside `llms.txt` - a public contract
  (`docs/specs/CONTRACTS.md` section 4) with `additionalProperties: false`
  on every object. Import is create-only: the client makes a new UUID for
  every list and entry, the file carries no ids, a second import makes a
  second copy. A later shape is `import-v2.json` beside v1; `version`
  discriminates and v1 stays published for good.
- Rejected: the `#/l/` payload text as the file (retires at the cutoff;
  opaque to an LLM); ids kept on import with merge or overwrite (conflicts,
  a second report); a lenient schema (an LLM's `qty` for `quantity` would
  import quietly - the failure the link checksum exists to prevent).
