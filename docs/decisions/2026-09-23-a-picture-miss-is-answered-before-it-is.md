# 2026-09-23 - A picture miss is answered before it is stored; an offline thumbnail miss takes the cached full picture

- Superseded in part by "Running from a folder and offline use are nice-to-haves" (2026-09-24): no precached
  placeholder follows the full-picture fallback.
- Task: `69`, follow-up; the owner chose both on 2026-09-23.
- Decision: `imageFirst` returns a fetched picture at once and stores
  and trims it through `waitUntil`, so `trim`'s `cache.keys()` over up
  to 1500 entries is off the answer's path; the cap holds once that
  work settles. Offline, a thumbnail miss takes `img/<x>.webp` from
  `dhloot-img-v1` before the precached placeholder, so a row does not
  mark the record's art failed for the session while the 640 px file
  is cached (`docs/specs/META.md` section 9).
- Rejected: trimming every Nth miss - a counter in a worker is lost
  whenever the browser stops it; the reverse fallback (a thumbnail for
  a full-picture miss) - a 160 px picture upscaled on a card; retrying
  the full picture in the app's `onerror` - app code for a worker
  concern, and online it fetches 34 KB for a failed 2 KB thumbnail.
