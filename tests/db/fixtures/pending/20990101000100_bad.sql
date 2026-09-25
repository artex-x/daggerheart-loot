-- The applier's failing fixture: the second statement fails, so the first
-- must roll back with it and no history row may be written.
create table gate_fixture.pending_bad (id bigint primary key);
insert into gate_fixture.no_such_table values (1);
