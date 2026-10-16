-- Undoes 20261015120000_shared_list_have.sql. A frontend that names the
-- held records gets PGRST202 and takes the one- and two-argument calls again;
-- the previous frontend never names this overload (.claude/README.md,
-- "Supabase configuration").
drop function public.get_shared_list(text, bigint, jsonb);
