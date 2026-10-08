# 2026-10-08 - Arazo's Artifacts drop the book's GM notes; aa23 is «Волшебное Зеркало»

- Task: `homebrew-followups` (owner, 2026-10-08; the name chosen by the planner, delegated by the owner).
- Decision: no `arazo` record carries the book's «Заметка для Мастера: ...» / "GM Note: ..." line, in `rud` or
  `ende`: Axe of the Dawn (aa5-aa8), Dirk of the Dead (aa11-aa14), Plate of the Prince (aa33) and Wyverntail
  Whip (aa74-aa77) lose it, a divergence from the book on purpose. aa23 "The Looking Glass" is «Волшебное
  Зеркало» in `ru` and «С помощью Волшебного Зеркала» in `rud`; `en` stays. `tests/derived.js` fails on a note
  or on «Зерцал» restored; `docs/specs/I18N.md`, "Rules", says so for a Russian or source audit.
- Why the name: "looking glass" is the old, fairy-tale word for a mirror, and «волшебное зеркало» carries that
  register; it reads as an artifact beside «Зеркало Златоцвета» (cc59) and «Зеркало Фей» (di15), and a search
  for «зеркало» finds it.
- Rejected: «Зерцало» (the owner: archaic); «Зеркало» (a plain noun beside two named mirrors); «Зеркальце» (a
  search for «зеркало» misses it: the Snowball stems «зеркал» and «зеркальц» differ); «Зазеркалье» (a place,
  Carroll's book, not an object); «Зеркало Обличий» (invents a name the book does not give).
- Amends "Arazo's Artifacts: source arazo, ids aa1-aa51, tier formulas as lines" (2026-10-07): GM notes are not shipped either.
- Amends "Arazo's Artifacts rebalanced to Core bands: every piece a line, ids aa1-aa78" (2026-10-08): no record ships the book's GM note.
