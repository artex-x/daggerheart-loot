# Shared task context - TASK persist-4-requests

## Goal
Release R4: purchase requests from a shared list to its owner - anonymous
"Notify the owner", the signed-in "add to my list, notify the GM" flow,
the owner's Requests panel, apply and decline, requester status. Batches
`B4.1`, `B4.2` in the roadmap; they may change.

Planned ahead (2026-09-25) while R2's last batch is being built; R4 ships
after R5 and R3. Design level plus owner questions now; the implement-ready
steps get a refresh before the build.

## Sources (read, do not re-fetch)
- Roadmap `issues/persistent-storage/plan.md`: sections 3, 5, 9, 12, 14
  (R4 rows and outlines), section 16 (the purchase-request block: owner
  answers (1) and (2), questions 32-38 and "Answers to 32-38, owner,
  2026-09-24"), section 17 (risk: `create_purchase_request` is the first
  RPC `anon` can write through; privacy impact of a stored requester name).
- `issues/persistent-storage/context.md`: the limits amendment (R4's lines
  per request and pending requests per list are rows in `limit_defaults`;
  the rate of 5 per link per minute and the 1-hour expiry stay constants -
  check against the answer to 36, which says 14-day expiry, and raise the
  conflict).
- R2's task `issues/persist-2-lists/`: `context.md` (owner answers,
  including: rotate dropped - a link is deleted, then created), `plan.md`
  sections 4.2, 4.4, 11 (shares, tokens, `get_shared_list`, the poll).
- `docs/decisions/` (one file per decision).

## State
- R2 is not closed; `B2.3` is being built in the main tree. R3
  (Realtime, polling as plan B) and R5 are being planned in parallel in
  other worktrees; R4's notification channel (answer to 38) rides R3's
  topic design - mark the coupling and do not decide R3's design.

## Facts settled by the planner, pass 1 (2026-09-26, worktree at `c39f3de1`)
- R3's owner questions answered yes (owner, 2026-09-26, through the
  orchestrator): Q1 the owner's devices join `owner:<uid>`; Q2 Realtime
  "Allow public access" off after `B3.2`; Q3 a 5-minute safety re-read
  while live. R4 builds on Q1 = yes only.
- The expiry "conflict" in this file's Sources line is not one: the
  owner's answer to 36 and the limits amendment both say 1 hour; the
  14 days was the planner's recommendation 36 and roadmap text written
  before the answer (sections 5, 14, 17), rewritten in this pass.
- The answer to 36 removes the requester name field, so there is no name
  bound and no stored name to describe; a request also stores no
  requester account id (plan section 5.1).
- `regprocedure` prints `create_purchase_request(text,jsonb)` with no
  space; `harness.test.mjs` compares that exact text.
- `tests/db/limits.test.mjs` asserts the exact `limit_defaults` rows, so
  `B4.1` updates it to four keys.

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
