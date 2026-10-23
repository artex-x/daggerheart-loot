-- The fake "production now" of tests/db/restore-prod.test.mjs, seeded into
-- the local database: user A (also in the backup, with another email) and
-- user C (not in the backup), lists and entries for both, a session of A
-- with refresh token 40 and an MFA claim, a session of C with refresh token
-- 50, whose id is above every id the backup holds, one sign-in flow row, and
-- the sequence at 80, above every id: a restore must not lower it.

insert into auth.users (instance_id, id, aud, role, email, created_at, updated_at) values
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-8000-00000000000a', 'authenticated', 'authenticated', 'now-a@example.invalid', '2026-09-20 10:00:00+00', '2026-09-25 10:00:00+00'),
  ('00000000-0000-0000-0000-000000000000', 'c0000000-0000-4000-8000-00000000000c', 'authenticated', 'authenticated', 'now-c@example.invalid', '2026-09-26 10:00:00+00', '2026-09-26 10:00:00+00');

insert into public.lists (id, owner_id, name) values
  ('a1000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-00000000000a', 'Now list of A'),
  ('c1000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-00000000000c', 'List of C'),
  ('c1000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-00000000000c', 'Second list of C');

insert into public.list_entries (id, list_id, item_key, position) values
  ('a2000000-0000-4000-8000-000000000009', 'a1000000-0000-4000-8000-000000000009', 'w1', 0),
  ('c2000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'a2', 0);

insert into public.user_prefs (user_id, prefs) values
  ('c0000000-0000-4000-8000-00000000000c', '{"lang": "ru"}');

insert into auth.sessions (id, user_id) values
  ('a3000000-0000-4000-8000-00000000000a', 'a0000000-0000-4000-8000-00000000000a'),
  ('c3000000-0000-4000-8000-00000000000c', 'c0000000-0000-4000-8000-00000000000c');

insert into auth.refresh_tokens (instance_id, id, token, user_id, revoked, session_id) values
  ('00000000-0000-0000-0000-000000000000', 40, 'now-token-of-a', 'a0000000-0000-4000-8000-00000000000a', false, 'a3000000-0000-4000-8000-00000000000a'),
  ('00000000-0000-0000-0000-000000000000', 50, 'now-token-of-c', 'c0000000-0000-4000-8000-00000000000c', false, 'c3000000-0000-4000-8000-00000000000c');

insert into auth.mfa_amr_claims (id, session_id, created_at, updated_at, authentication_method) values
  ('a4000000-0000-4000-8000-00000000000a', 'a3000000-0000-4000-8000-00000000000a', '2026-09-25 10:00:00+00', '2026-09-25 10:00:00+00', 'oauth');

insert into auth.flow_state (id, provider_type, authentication_method) values
  ('f5000000-0000-4000-8000-000000000001', 'google', 'oauth');

select setval('auth.refresh_tokens_id_seq', 80, true);
