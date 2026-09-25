# 2026-09-23 - Thumbnails get their own worker cache, capped above the whole set

- Superseded in part by "Running from a folder and offline use are nice-to-haves" (2026-09-24): nothing is
  precached, `img/thumb/_none.webp` included; the cache and its cap stay.
- Task: `69`.
- Decision: `app/public/sw.js` caches `img/thumb/` cache first in
  `dhloot-thumb-v1`, capped at 1500 entries (the set is 1057), with the
  same seven-day revalidation; `img/` keeps `dhloot-img-v1` at 300;
  `img/thumb/_none.webp` is precached; `tests/sw.test.mjs` fails when the
  set outgrows the cap (`docs/specs/META.md` section 9). A tile view of a
  table longer than 300 still evicts its own first full pictures.
- Rejected: sharing `dhloot-img-v1` at 300 - one weapons table evicts its
  own first rows and every full picture; sharing it with a higher cap - an
  entry count bounds no bytes when 2 KB thumbnails and 34 KB pictures mix;
  LRU (store again on a hit) - a cache write on every row draw, and no
  effect on a cache that holds the whole set; precaching every thumbnail -
  2.4 MB on install for visitors who never open a table, and a 1057-name
  list in `sw.js` that changes with every art change.
- Superseded in part by "Pictures revalidate on every cache hit; an unchanged ETag writes nothing" (2026-09-23): the seven-day revalidation.
