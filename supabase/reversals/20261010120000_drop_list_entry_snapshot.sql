-- Re-adds list_entries.snapshot, null in every row, as
-- 20261007130000_homebrew_links.sql left it: a frontend before R7h, and a
-- backup made before this migration, read and load again.
alter table public.list_entries add column snapshot jsonb;
alter table public.list_entries
  add constraint list_entries_snapshot_null check (snapshot is null);
