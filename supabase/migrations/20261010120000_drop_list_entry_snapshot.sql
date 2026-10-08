-- R7h kept list_entries.snapshot, always null, so that its frontend-only
-- revert kept reading the lists
-- (docs/decisions/2026-10-07-an-item-is-read-by-its-id-by-anyone-a-list-holds-a-live-link.md).
-- No frontend since R7h reads or writes it. .claude/README.md, "Backups and restore".
alter table public.list_entries drop constraint list_entries_snapshot_null;
alter table public.list_entries drop column snapshot;
