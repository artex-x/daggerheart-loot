-- The gate's failing fixture: this reversal forgets the schema, so the
-- state after it differs from the state before up.sql, and up.sql cannot
-- run again. (A forgotten index alone is invisible: dropping the table
-- drops its indexes.)
drop policy items_read on gate_fixture.items;
drop index gate_fixture.items_title_idx;
drop table gate_fixture.items;
