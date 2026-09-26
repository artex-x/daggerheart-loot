# 2026-09-26 - Import validation is the client's; the count limits are the database's

- Task: `persist-6-import-export` (planner, 2026-09-26; the owner's
  answer to question Q4 of the R6 plan confirms the unknown-id rule).
- Decision: `app/src/lib/bundle.ts` checks a file against the bounds
  `schema/import-v1.json` states (50 lists, 100 entries per list, names
  200 and notes 4000 code points, quantity 1..99, price 1..99999) and
  reports every error with its JSON path; a test reads the schema and
  fails when the two drift. An id the data does not know, or a repeat
  inside one list, is skipped and named in the preview, never a refusal
  (the `#/l/` rule). The account's count limits are the database's alone
  (`effective_limit()`, an override the client cannot read): a file
  imports up to the schema's bounds, several files when a limit was raised.
- Rejected: refusing a file for one unknown id (blocks a restore for an
  LLM's one wrong id); validating ids in the database (the catalog is not
  there); reading the user's override in the client (a second reader of a
  table nothing else exposes).
