SET session_replication_role = replica;

--
-- Fake backup for tests/db/restore-prod.test.mjs, in the shape of
-- `supabase db dump --data-only --schema auth,public` (CLI 2.117.0): user A
-- with the backup's email, three refresh tokens of A, two lists of A, the
-- limit defaults, and the dump's own setval, which is lower than the
-- target's sequence.
--

-- \restrict fakeRestrictKey

SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SELECT pg_catalog.set_config('search_path', '', false);

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "created_at", "updated_at") VALUES
	('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-8000-00000000000a', 'authenticated', 'authenticated', 'backup-a@example.invalid', '2026-09-20 10:00:00+00', '2026-09-20 10:00:00+00');

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked") VALUES
	('00000000-0000-0000-0000-000000000000', 1, 'backup-token-1', 'a0000000-0000-4000-8000-00000000000a', false),
	('00000000-0000-0000-0000-000000000000', 2, 'backup-token-2', 'a0000000-0000-4000-8000-00000000000a', true),
	('00000000-0000-0000-0000-000000000000', 3, 'backup-token-3', 'a0000000-0000-4000-8000-00000000000a', false);

INSERT INTO "public"."limit_defaults" ("key", "value") VALUES
	('lists_per_owner', 7),
	('entries_per_list', 9);

INSERT INTO "public"."lists" ("id", "owner_id", "name", "money_mode", "player_note", "gm_note", "revision", "created_at", "updated_at") VALUES
	('a1000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-00000000000a', 'Backup list of A', 'bag', '', '', 1, '2026-09-21 10:00:00+00', '2026-09-21 10:00:00+00'),
	('a1000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-00000000000a', 'Second backup list of A', 'coin', '', '', 2, '2026-09-22 10:00:00+00', '2026-09-22 10:00:00+00');

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 3, true);

-- \unrestrict fakeRestrictKey

RESET ALL;
