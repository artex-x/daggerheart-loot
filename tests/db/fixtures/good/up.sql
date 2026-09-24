-- The reversibility gate's passing fixture: a table with a primary key, an
-- index, row level security and one policy, in a scratch schema.
create schema gate_fixture;
create table gate_fixture.items (id bigint primary key, title text not null);
create index items_title_idx on gate_fixture.items (title);
alter table gate_fixture.items enable row level security;
create policy items_read on gate_fixture.items for select to authenticated using (true);
