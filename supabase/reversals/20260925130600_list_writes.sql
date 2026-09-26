-- Removes the batch write function; the tables and their grants are untouched.
drop function public.apply_list_writes(jsonb);
