# 2026-09-19 - Dragon's Vault: source `dv`, table `dv`, section `roll/dv`, ids `dv`/`dve`, one roll over all 145 records

- Task: `dragons-vault` (equipment joined the roll at the human's review,
  2026-09-22).
- Decision: source key `dv`, table id `dv`, section `roll/dv`, loot ids
  `dv1`-`dv77` in the order the detailed entries print (pp. 30-47),
  equipment ids `dve1`-`dve68` in page order (pp. 9-27), Frostwyrd as three
  records. All 145 live in `items.dv` on the Wondrous and Dread model: a
  piece of equipment keeps its stat block, rolls on its book's table and
  still appears in the equipment tables. `roll` is the id's number for loot
  and 77 + the number for equipment ("Random 1-145"). The book has no random
  table by design (p. 29); the help box says so.
- Rejected: `dragons_vault` as the key (every table id here is one short
  word, `voa` the precedent); equipment first, in page order (moves every
  loot roll off its id number for a table the book never prints); a `roll`
  on records left in `eq` (a second mechanism for what `items` already
  does); no roll tab (the help box is the only surface for a source link).
