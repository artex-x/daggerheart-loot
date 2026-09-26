-- Fake schema dump for tests/db/restore-drill.test.mjs: only the table
-- lines the drill reads, in the shape `supabase db dump` writes.


-- \restrict fakeRestrictKey


SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SELECT pg_catalog.set_config('search_path', '', false);

COMMENT ON SCHEMA "public" IS 'standard public schema';

CREATE TABLE IF NOT EXISTS "public"."limit_defaults" (
    "key" "text" NOT NULL,
    "value" integer
);

CREATE TABLE IF NOT EXISTS "public"."list_entries" (
    "id" "uuid" NOT NULL,
    "list_id" "uuid" NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."list_shares" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "list_id" "uuid" NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."lists" (
    "id" "uuid" NOT NULL,
    "owner_id" "uuid" NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."user_limit_overrides" (
    "user_id" "uuid" NOT NULL,
    "key" "text" NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."user_prefs" (
    "user_id" "uuid" NOT NULL,
    "prefs" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);

-- \unrestrict fakeRestrictKey

RESET ALL;
