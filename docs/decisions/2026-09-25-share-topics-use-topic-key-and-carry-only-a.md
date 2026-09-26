# 2026-09-25 - Share topics use topic_key and carry only a revision; the page refetches

- Task: `persist-3-realtime` (planner, 2026-09-25).
- Decision: a deferred constraint trigger on `lists` sends one Broadcast
  per list per transaction, with the final revision, through
  `realtime.send(..., true)` to `share:<topic_key>` of each active share;
  a revoke or a deleted list sends `{ revision: null }` once. The payload
  is `{ revision }` only; the page refetches `get_shared_list`. One
  `select` policy on `realtime.messages` lets `anon` and `authenticated`
  join a topic of the shape `share:<uuid>`; no `insert` policy exists, so
  no client can send. The token and the list id never reach a topic.
- Rejected: Postgres Changes (needs `anon` `select` on the tables; the
  row leaks `owner_id`); the projection in the payload (per-audience
  payloads, GM notes kept in `realtime.messages`, the 256 KB cap); an
  active-share lookup in the policy (a revoked topic receives nothing
  more anyway); a row trigger (a reorder of N entries sent N messages).
- Amends "Realtime ships in v1, directly after lists, over polling" (2026-09-24): private sends, and no client can forge a message.
