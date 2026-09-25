-- Removes the cloud lists: reorder_list(), both tables with their
-- policies, triggers and grants, then the trigger functions.
drop function public.reorder_list(uuid, uuid[]);
drop table public.list_entries;
drop table public.lists;
drop function public.list_entries_limit();
drop function public.lists_limit();
drop function public.list_entries_touch();
drop function public.lists_before_update();
