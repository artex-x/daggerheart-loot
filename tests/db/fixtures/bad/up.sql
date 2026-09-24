-- The reversibility gate's failing fixture: the same up.sql as fixtures/good.
create schema gate_fixture;
create table gate_fixture.items (id bigint primary key, title text not null);
create index items_title_idx on gate_fixture.items (title);
alter table gate_fixture.items enable row level security;
create policy items_read on gate_fixture.items for select to authenticated using (true);
