-- Every /h/ and /s/ link card answers 503 (the site text, the redirect kept) until the preview host is reverted too.
-- Undoes 20261014120200_link_previews.sql: both card reads go; no table, row or stored shape changes.
drop function public.get_shared_list_preview(text);
drop function public.get_item_preview(uuid, text);
