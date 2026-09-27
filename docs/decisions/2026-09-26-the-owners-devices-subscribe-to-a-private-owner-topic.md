# 2026-09-26 - The owner's devices subscribe to a private owner topic

- Task: `persist-3-realtime` (owner, Q1, 2026-09-26).
- Decision: the broadcast trigger on `lists` also sends `{ list,
  revision, by }` to `owner:<user id>`, which one `select` policy lets only
  that user join (`supabase/migrations/20260927120000_realtime.sql`). Each
  page load sends its tab id as `x-dhloot-tab` on PostgREST requests only
  (a CORS refusal of it cannot break sign-in); the trigger copies it into
  `by`, and a tab ignores its own messages. A signed-in page joins from the account's first read
  until sign-out, on every route. A newer revision from elsewhere re-reads
  the account once the write buffer is empty.
- Rejected: the owner's devices on the poll only (an edit on one device
  shows on another only after focus or 45 s); the JWT's `session_id` as
  `by` (two tabs of one browser share a session and would drop each
  other's edits); the header in `createClient`'s `global.headers` (it
  tags auth requests too, where a CORS refusal would break sign-in).
- Amends "Realtime ships in v1, directly after lists, over polling" (2026-09-24): the owner's own devices are subscribed.
