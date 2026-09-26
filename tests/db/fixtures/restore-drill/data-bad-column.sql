SET session_replication_role = replica;

--
-- Fake data dump for tests/db/restore-drill.test.mjs whose auth.users
-- rows name a column the local database lacks, as a dump from a newer
-- hosted Auth would. The load must fail with SQLSTATE 42703 and roll back
-- the rows before it.
--

-- \restrict fakeRestrictKey

SET statement_timeout = 0;
SELECT pg_catalog.set_config('search_path', '', false);

INSERT INTO "public"."limit_defaults" ("key", "value") VALUES
	('lists_per_owner', 7),
	('entries_per_list', 9);

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "drill_missing_column") VALUES
	('00000000-0000-0000-0000-000000000000', 'd0000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'drill-one@example.invalid', 'drill-secret-value');

INSERT INTO "public"."lists" ("id", "owner_id", "name") VALUES
	('d1000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'Drill list');

-- \unrestrict fakeRestrictKey

RESET ALL;
