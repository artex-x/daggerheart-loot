# 2026-10-21 - Source names follow the source product, in labels and URL ids

- Task: `mwt-drome` (owner, 2026-10-21: labels and URL ids, the Wondrous Environments name, the short chips under 640 px, no short form for Community items or Vault of Ages).
- Decision: one product name per source on every badge, path, heading, card and chip ("Wondrous
  Environments", "Dread GM Toolbox", "The Dragon's Vault", «Предметы сообществ» / "Community
  items"); under 640 px three chips show a short form that is part of it (`tables.ts`
  `CHIP_SHORT`), the full name as `aria-label`. URL ids are slugs (`hash.ts` `SECTION_SLUG`,
  `TABLE_SLUG`); an old id opens the same page, unrewritten, and an old pin is stored as its
  slug. Data keys, `f_src-` values and the CSV `source` values stay.
- Rejected: labels only; the full name on every chip at every width (a 322 px strip at 360); a short form for Community items or Vault of Ages (not part of the name, WCAG 2.5.3);
  renaming internal ids; rewriting an old address; a hidden full-name span (the harness reads
  `textContent`); new CSV `source` values (agents filter on them).
- Accepted trade-off: 6 px of Vault of Ages' roll button at 360x740 in Russian; after a revert a
  slug pin opens the default section (pin again); Telegram refreshes 764 stubs in about 2.7 days
  (50 URLs every 4 hours); a posted table card keeps its old name; the CSV spells two sources
  the old way.
- Amends "Supplement roll sections share one tab and a chip panel" (2026-10-20): the supplements tab links to the URL id `#/roll/wondrous_environments`.
