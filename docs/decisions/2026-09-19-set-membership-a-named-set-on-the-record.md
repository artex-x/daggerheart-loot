# 2026-09-19 - Set membership: a named set on the record, members derived, a shared bonus on every member, no filter

- Task: `dragons-vault` (human decisions: structured and designed for N
  members; the bonus first-class at the review of 2026-09-22).
- Decision: `Record_.set?: string` names a record's set (`ember-spark` on
  dve19 and dve20); members are grouped at load (`buildIndex`), never
  stored. The card lists every member in catalogue order, the record itself
  inert: `Комплект: Уголёк, Искра` / `Set: Ember, Spark`. A set's bonus is
  `LOOT.sets[key]` (`en`, `ru` name; `ende`, `rud` text), drawn under that
  line on every member, carried in copied text, share stubs and
  `catalog.csv`, and printed as the last text line, `<name> (<Set>:
  <members>): <text>`. Listing all members needs no Russian case agreement.
- Rejected: the bonus in one member's text (the book's layout; it left
  Ember's holder blind); a copy in each member (two texts to keep equal); a
  stored sibling list; indexing the bonus for search (refs and craft
  targets are not indexed either); a `set` filter group or set page until a
  second source brings sets.
