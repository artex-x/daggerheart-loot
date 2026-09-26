SET session_replication_role = replica;

--
-- Fake data dump for tests/db/restore-drill.test.mjs, in the shape of
-- `supabase db dump --data-only --schema auth,public` (CLI 2.117.0):
-- column inserts, many rows per INSERT, psql meta lines commented out.
--

-- \restrict fakeRestrictKey

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET row_security = off;

--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "created_at", "updated_at") VALUES
	('00000000-0000-0000-0000-000000000000', 'd0000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'drill-one@example.invalid', '2026-09-20 10:00:00+00', '2026-09-20 10:00:00+00'),
	('00000000-0000-0000-0000-000000000000', 'd0000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'drill-two@example.invalid', '2026-09-21 10:00:00+00', '2026-09-21 10:00:00+00');


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked") VALUES
	('00000000-0000-0000-0000-000000000000', 7, 'drill-token-7', 'd0000000-0000-4000-8000-000000000001', false),
	('00000000-0000-0000-0000-000000000000', 9, 'drill-token-9', 'd0000000-0000-4000-8000-000000000002', false);


--
-- Data for Name: limit_defaults; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."limit_defaults" ("key", "value") VALUES
	('lists_per_owner', 7),
	('entries_per_list', 9);


--
-- Data for Name: lists; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."lists" ("id", "owner_id", "name", "money_mode", "player_note", "gm_note", "revision", "created_at", "updated_at") VALUES
	('d1000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'Drill list; with ''quotes'' and (brackets)', 'bag', '', 'a note -- not a comment
on two lines', 3, '2026-09-22 10:00:00+00', '2026-09-22 10:00:00+00'),
	('d1000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000002', 'Second drill list', 'coin', '', '', 1, '2026-09-23 10:00:00+00', '2026-09-23 10:00:00+00');


--
-- Data for Name: list_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."list_entries" ("id", "list_id", "item_key", "source", "snapshot", "position", "quantity", "price_coins", "player_note", "gm_note") VALUES
	('d2000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001', 'w1', 'official', NULL, 0, 1, NULL, '', ''),
	('d2000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000001', 'a2', 'official', NULL, 1, 2, 150, '), (', ''),
	('d2000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000002', 'hb_drill', 'homebrew', '{"name": "Drill item"}', 0, 1, NULL, '', '');


--
-- Data for Name: list_shares; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."list_shares" ("id", "list_id", "audience", "token", "topic_key", "created_at", "revoked_at") VALUES
	('d3000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001', 'player', 'drillFixtureShareToken_00000000000000000001', 'd4000000-0000-4000-8000-000000000001', '2026-09-24 10:00:00+00', NULL);


--
-- Data for Name: user_limit_overrides; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_limit_overrides" ("user_id", "key", "value") VALUES
	('d0000000-0000-4000-8000-000000000002', 'lists_per_owner', 11);


--
-- Data for Name: user_prefs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_prefs" ("user_id", "prefs") VALUES
	('d0000000-0000-4000-8000-000000000001', '{"lang": "en"}');


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
-- A value below the highest id, so only the load's sequence guard lifts it.
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 3, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict fakeRestrictKey

RESET ALL;
