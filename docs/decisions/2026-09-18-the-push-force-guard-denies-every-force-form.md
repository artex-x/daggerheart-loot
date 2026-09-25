# 2026-09-18 - The push-force guard denies every force form, not just a bare `--force`

- Task: `workflow-hygiene`.
- Decision: `bash-guard.mjs` rule 2b now denies `--force`, `-f`,
  `--force-with-lease` (with or without `=<x>`), `--force-if-includes`, and
  any `+<refspec>` token; `--dry-run` still exempts.
- Rejected: leaving `--force-with-lease` allowed (its previous standing) -
  with one amended commit per task, an amend after a push is the tempting
  mistake, and a lease that happens to succeed is still the force-push
  `CLAUDE.md` forbids.
- Evidence: same class as the standing AI-attribution deny - an explicit
  human rule with zero false positives.
