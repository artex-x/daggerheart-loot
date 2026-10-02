-- Undoes 20261002120000_read_scale.sql. Stored frozen copies stay, a list
-- already past the sum included; the overrides of snapshot_bytes_per_list go
-- with its row (on delete cascade). A frontend that names a revision then
-- fails its shared re-reads quietly: revert the app first
-- (.claude/README.md, "Undo a deploy that carried a migration").
drop function public.get_shared_list(text, bigint);

drop trigger list_entries_snapshot_limit_insert on public.list_entries;
drop trigger list_entries_snapshot_limit_update on public.list_entries;
drop function public.list_entries_snapshot_limit();

delete from public.limit_defaults where key = 'snapshot_bytes_per_list';
