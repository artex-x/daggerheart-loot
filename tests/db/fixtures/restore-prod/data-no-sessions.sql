SET session_replication_role = replica;

--
-- Fake backup for tests/db/restore-prod.test.mjs, in the shape of the
-- nightly `supabase db dump --data-only --schema auth,public --exclude
-- <DUMP_EXCLUDES>` (CLI 2.117.0): data.sql without the refresh tokens and
-- without the setval of their sequence. User A with the backup's email, two
-- lists of A and the limit defaults.
--

-- \restrict fakeRestrictKey

SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SELECT pg_catalog.set_config('search_path', '', false);

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "created_at", "updated_at") VALUES
	('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-8000-00000000000a', 'authenticated', 'authenticated', 'backup-a@example.invalid', '2026-09-20 10:00:00+00', '2026-09-20 10:00:00+00');

INSERT INTO "public"."limit_defaults" ("key", "value") VALUES
	('lists_per_owner', 7),
	('entries_per_list', 9);

INSERT INTO "public"."lists" ("id", "owner_id", "name", "money_mode", "player_note", "gm_note", "revision", "created_at", "updated_at") VALUES
	('a1000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-00000000000a', 'Backup list of A', 'bag', '', '', 1, '2026-09-21 10:00:00+00', '2026-09-21 10:00:00+00'),
	('a1000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-00000000000a', 'Second backup list of A', 'coin', '', '', 2, '2026-09-22 10:00:00+00', '2026-09-22 10:00:00+00');

-- \unrestrict fakeRestrictKey

RESET ALL;
