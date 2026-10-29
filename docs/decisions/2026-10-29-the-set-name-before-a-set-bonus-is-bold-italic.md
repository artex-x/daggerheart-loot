# 2026-10-29 - The set name before a set bonus is bold italic

- Task: `catalog-filter-links` (owner, 2026-10-28, Q3 = A).
- Decision: the set name that leads a set's shared bonus is drawn as a feature name (catalog style S1), `<b><i>Name:</i></b>`: on the record card (page, dialog, `#/h/`, the editor's preview), on the print card (the name only; the member list in brackets keeps italics) and in the copied HTML. The plain-text copy, the link cards and `catalog.csv` keep it plain. Home: `docs/specs/FEATURES.md`, "Records" and "Print".
- Rejected: B, the record card and the print card only, the copied HTML with a plain name (one more place where the name reads differently); C, the print card's whole label bold italic, members included (a wider label for no gain in reading).
- Accepted trade-off: the bold name is wider, so a print card with a long set name can move one fit rung; the fit ladder handles it and `app/print` proves no new clip.
