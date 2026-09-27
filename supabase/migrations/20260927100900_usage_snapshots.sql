-- One row a day of production's free-plan usage, written by the nightly
-- usage report as postgres; no Data API role reads or writes it.
-- docs/DECISIONS.md, 2026-09-25, "The usage history is a table in production that the nightly report writes".
create table public.usage_snapshots (
  taken_on date primary key,
  taken_at timestamptz not null default now(),
  metrics jsonb not null
);
alter table public.usage_snapshots enable row level security;
revoke all on table public.usage_snapshots from public, anon, authenticated, service_role;
