# 2026-10-07 - The image review keeps its verdicts in the browser, keyed by hash

- Task: `images-tinder` (the owner chose localStorage, 2026-10-07).
- Decision: the image review page (`node tools/artwork/run.mjs review`,
  `docs/artwork.md`, "Image review") stores each keep or regenerate verdict,
  with its optional comment, in the browser's localStorage of `http://127.0.0.1:4791`, keyed by the
  picture's asset name and valid only while the sha256 of
  `img/<asset>.webp` is unchanged. The review server is read-only: it
  serves files from the checkout and computes the dates and the hashes.
- Rejected: a committed verdicts file written through a local POST
  endpoint (a write endpoint beside the Supabase backend, and a commit per
  review run); a verdict keyed by record id or by date (a regenerated
  picture would stay hidden); file modification time as the picture's date
  (not stable across checkouts; the git last-commit date is used).
- Accepted trade-off: another browser, another port or cleared site data
  starts with no verdicts.
