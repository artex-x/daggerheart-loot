# 2026-09-26 - Purchase requests are written only by a bounded function any link holder calls

- Task: `persist-4-requests` (owner answers 35 and 36, 2026-09-24, and the limits amendment of 2026-09-25; planner, the shape).
- Decision: `create_purchase_request(token, lines)` (`security definer`,
  `execute` to `anon` and `authenticated`) is the only writer of
  `purchase_requests`; an active player or GM share token is its one
  capability. Its bounds are inside it: `request_lines` (100) and
  `pending_requests_per_list` (10) are `limit_defaults` rows read for the
  list owner; 5 requests per share per minute, the 1-hour expiry and the
  24-hour retention after a decision or expiry are constants; the rate is
  counted from the table. A request stores the items, counts, audience and
  time - no name, account or address; housekeeping runs at write time.
- Rejected: a requester name field (owner, answer 36); a table `insert`
  policy for `anon` (no place for the caps); an IP rate limit (no IP in
  the database, and an Edge Function to read it); keeping the signed-in
  requester's user id (nothing shows it; it links a person to a request).
