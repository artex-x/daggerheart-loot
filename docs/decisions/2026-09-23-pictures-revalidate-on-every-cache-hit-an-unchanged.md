# 2026-09-23 - Pictures revalidate on every cache hit; an unchanged ETag writes nothing

- Task: `69`, follow-up; on 2026-09-23 the owner chose every-hit
  revalidation so that replaced art reaches installed clients.
- Decision: `app/public/sw.js` answers a hit in `dhloot-img-v1` or
  `dhloot-thumb-v1` from the cache and revalidates it with one
  background `fetch` through `waitUntil`, via the browser's HTTP cache
  (Pages: `max-age=600`, `ETag`). An ok answer with the cached `ETag`
  writes nothing; a changed or absent `ETag` replaces the entry; a
  failed fetch keeps it (`docs/specs/META.md` section 9).
- Rejected: keeping an age threshold - an unchanged answer is not
  rewritten, so its `Date` never advances and the threshold becomes
  every hit unless the worker stores its own check time;
  content-hashed picture URLs (`img/x.webp?v=<hash>`) - `data.js`, the
  artwork tool and `tools/build.js` would carry hashes, a planned
  batch; a cache-name bump per art refresh - every client downloads
  its pictures again, and a bump is easy to forget.
- Accepted cost: one conditional request per picture view past the
  `max-age` (not measured on a device).
- Supersedes in part "Thumbnails get their own worker cache, capped above the whole set" (2026-09-23).
