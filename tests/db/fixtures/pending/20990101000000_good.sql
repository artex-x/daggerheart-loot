-- The applier's passing fixture: one table in the scratch schema.
create schema if not exists gate_fixture;
create table gate_fixture.pending_ok (id bigint primary key);
