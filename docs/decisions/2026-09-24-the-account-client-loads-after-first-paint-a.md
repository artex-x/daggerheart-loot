# 2026-09-24 - The account client loads after first paint; a provider redirect settles before mount

- Amended 2026-10-16 (`debt-cleanup`): the port builds the client from `@supabase/auth-js`,
  `postgrest-js`, `realtime-js` and `storage-js` as supabase-js's `SupabaseClient` does, the
  session's token read per request (`fetchWithAuth`'s rule); `X-Client-Info` is no longer sent
  (nothing reads it); the five `@supabase/*` packages move at one version (a split installs a
  second copy, and the old and the new bundle share one stored session); the port names the
  storage key `sb-<first host label>-auth-token` by supabase-js's rule, so an upgrade cannot move it.
- Task: `persist-1-auth` (planner, 2026-09-24; the unconfigured build: owner).
- Decision: `ports/supabase.ts` alone imports `@supabase/supabase-js`, as a lazy chunk behind a
  synchronous `CloudPort` wrapper, so a configured app mounts as fast as an unconfigured one.
  `main.ts` reads `?auth-callback=1` before mount, restores the route saved in `sessionStorage`
  (10 minutes) and strips the code and error parameters; the exchange and its outcome
  (`redirectResult()`) resolve after mount: a refused link and a cancelled consent arrive on the
  redirect back. With no configuration the branch is a dead literal: no chunk, no account
  control, `#/account` is not found.
- Rejected: mounting after the chunk loads (every reader waits); a static import (the entry
  carries the client for anonymous readers); supabase-js's `detectSessionInUrl` (races the
  router); a "sign-in unavailable" page (owner); loading the chunk only for a reader with a stored
  session or a pending redirect (considered 2026-09-25: it saves a download after first paint, not
  paint, and would read supabase-js's private storage key names).
