# 2026-10-21 - The print card recolours its exported vectors with CSS; the files stay published

- Task: `debt-cleanup` (owner decision 30 (d), 2026-10-16, confirmed 2026-10-20 after the risk case).
- Decision: a pair of `card/` files with one geometry (same viewBox and, path by path, `d`, stroke width, cap and join)
  is drawn inline by `CardVector.svelte` from `lib/cardVectors.ts` (the dice from `dice.ts`'s `DIE_ART`), each paint
  slot a gradient whose stops read `styles/card-vectors.css` per layout: `banner`, `thbox`, `ribbon`, `ribbon-mag` and
  the six dice. `shield`, `burden-1` and `burden-2` stay two files drawn by `<img>`. No file under `card/` changes, so
  every published path resolves (`CONTRACTS.md` section 5). `tests/derived.js` pins the geometry to the files;
  `tests/app/print.js` compares each drawn vector with its file at device pixel ratio 2 (measured 2026-10-21: at most 3
  per channel on every shape, both layouts, both sheets).
- Rejected: deleting the `-bw` files (frozen public paths); a CSS mask (it flattens every gradient to one colour);
  folding the shield and burden pairs (their shapes differ, and redrawing a vector is barred); the colours inline in
  the component (two places to copy a file's paint into).
