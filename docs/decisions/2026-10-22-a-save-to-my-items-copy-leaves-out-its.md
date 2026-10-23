# 2026-10-22 - A Save to my items copy leaves out its original's set

- Task: `persist-review` (the owner, decision 51: P40 "Copies leave the set line", with I10,
  2026-10-22; scope "Every copy (Recommended)"; planner, 2026-10-22).
- Decision: «Сохранить себе» writes no `set`: `copyContentOf` leaves out a catalog
  record's, `copyRows` leaves out another account's item's and copies no set card. Rule
  cards stay as before. Behaviour: `docs/specs/FEATURES.md`, "Records".
- Rejected: catalog copies only (two copies of another account's set member would still
  draw a set line of copies); a mark on a copy in the set line (I10's other option: the
  line still grows); clearing the set of copies already stored (no stored link tells a
  copy from an item made by hand).
- Consequence: a copy draws no set line and no set bonus, the author picks a set in the
  editor, and copies made before keep theirs.
- Supersedes in part "Each Save to my items press makes a new copy, also of a catalog record" (2026-10-21): a copy keeps or copies no set.
