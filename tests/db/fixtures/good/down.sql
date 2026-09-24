-- Removes everything up.sql creates, in reverse order.
drop policy items_read on gate_fixture.items;
drop index gate_fixture.items_title_idx;
drop table gate_fixture.items;
drop schema gate_fixture;
