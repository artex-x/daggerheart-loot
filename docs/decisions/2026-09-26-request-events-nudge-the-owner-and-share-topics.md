# 2026-09-26 - Request events nudge the owner and share topics; each page refetches

- Task: `persist-4-requests` (owner answer 38, 2026-09-24: in-app only; planner, the channel).
- Decision: a trigger on `purchase_requests` sends the event `request`
  with `{ list, by }` to `owner:<uid>` when a request is made or decided,
  and `{}` to the sending share's `share:<topic_key>` when it is decided
  and the share is active. The owner's pages re-read the requests; a
  share page re-reads the statuses it holds keys for. The owner's lists
  index shows a pending count per list, the list page a Requests panel.
  While the feed is down, the 45 s poll re-reads them.
- Rejected: email or push (no infrastructure; the GM is at the table);
  request lines in the payload (kept in `realtime.messages` for 3 days);
  a topic per status key (the key is the capability and would sit in a
  topic name); a Discord webhook through `pg_net` (deferred, not v1).
