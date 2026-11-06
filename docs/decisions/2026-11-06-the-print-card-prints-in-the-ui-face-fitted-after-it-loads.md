# 2026-11-06 - The print card prints in the UI face at 7.1 pt, fitted after it loads

- Task: `57` (the owner, 2026-10-29: QP.1, QP.4, QP.6 to QP.8, the hands, the bottom line; 2026-11-05: the 63x88 mm card stays; the rest planner defaults while the owner was away, 2026-11-06).
- Decision: `PrintCard` sets `var(--ui)` (`--print-ui` is gone); the rules text starts at 4.0cqw (7.1 pt) and 4.6cqw (5.7 pt) on the compact card, and stops at 2.6cqw and 3.7cqw (4.5 pt); the tier word takes the 4.5 pt floor; a color card whose picture gives way clears its marks; the sheet fits again once the face has loaded (`FontsPort`) and «Напечатать» waits for it; up to 760 px `/p/` draws one card per row with a dock. docs/specs/FEATURES.md, "Print".
- Rejected: the local stack (a different fit on every machine); Overpass (not compared, QP.1); a floor under the picture (smaller text on the longest cards, QP.8); a 600 px phone step (a second width source beside the `viewport` port); the label beside a modifier stopped at 4.5 pt (it touched its modifier on 70 EN compact cards); a fixed 5.8cqw lift (the tags under a tier band or a burden mark); the exported burden bytes with their masks (Chrome prints a masked image as a raster).
- Amends "Print card small text keeps the ribbon and gets one paper floor in every view" (2026-09-23): the tier word at 4.5 pt, the compact rules text floor 3.7cqw.
- Amends "The compact sheet is an independent size switch for both print layouts, kept in session memory" (2026-09-23): the compact rules text has its own base and floor.
- Amends "The black-and-white card grows its rules text to a cap under the name" (2026-09-23): it grows from the base.
- Amends "The print sheet scales to a phone screen by a transform the fit divides out" (2026-10-22): one card per row up to 760 px.
- Amends "The UI font is Source Sans 3, self-hosted from the build's own origin" (2026-10-29): the print card takes it.
- Amends "The print card recolours its exported vectors with CSS; the files stay published" (2026-10-21): the four burden files take the hands' paths, their masks as clip paths.
