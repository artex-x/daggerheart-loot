# 2026-09-24 - Realtime ships in v1, directly after lists, over polling

- Amended by "Realtime is the primary live path; the 45 s poll runs while it is down" (2026-09-25): the poll runs only while Realtime is down.
- Amended by "Share topics use topic_key and carry only a revision; the page refetches" (2026-09-25): private sends, and no client can forge a message.
- Task: `persistent-storage` (owner decision, 2026-09-24).
- Decision: the lists release ships player and GM share pages that refetch
  on focus and every 45 s; the next release adds Supabase Realtime
  Broadcast from a database trigger (`realtime.send` on
  `share:<topic_key>`, payload `{ revision }`) and keeps the poll as the
  fallback. Topics are random and unguessable; a forged message can only
  cause a refetch. The owner's own devices are not subscribed in v1.
- Rejected: deferring Realtime past v1 (the planner's recommendation) - the
  owner values live shared pages above the saved surface; bundling it
  into the lists release - a release is smaller and safer without it; an
  owner-scoped private topic now - refetch on focus covers two devices.
