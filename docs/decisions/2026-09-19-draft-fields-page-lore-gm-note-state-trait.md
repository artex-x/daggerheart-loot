# 2026-09-19 - Draft fields `page`, `lore_*`, `gm_note_*`, `state`, `trait_original`, `burden_options`

- Task: `dragons-vault`.
- Decision: `page`, `state`, `trait_original` and `burden_options` are
  dropped (the name and the schema carry their content). `lore_en`/
  `lore_ru` (144 records, ~85 KB) are dropped: no shipped source carries
  flavour text, nothing renders it, and `data.js` is 149 KB gzip on first
  load (`docs/specs/META.md` section 4); adding it later is additive.
  The Chalice of Chaos box (`gm_note_*`, p. 33) is folded verbatim into
  `ende`/`rud` as a final line: it is rules text printed beside the item.
  Frostwyrd's Vestige sidebar (p. 14) is dropped: the book explains
  Vestiges, and three cards repeated it (human review, 2026-09-22).
- Rejected: a folded "Lore" block on the card (a new surface with its own
  dictionary, goldens and print decision, for text the book itself says a
  GM may ignore); keeping the fields in `data.js` unrendered (`CLAUDE.md`:
  add no export before something uses it).
