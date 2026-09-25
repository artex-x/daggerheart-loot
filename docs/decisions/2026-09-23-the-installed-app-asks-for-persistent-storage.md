# 2026-09-23 - The installed app asks for persistent storage

- Task: `69`, follow-up; on 2026-09-23 the owner chose to ask only in
  the installed app.
- Decision: `app/src/main.ts` calls `env.pwa.persist()` once at boot,
  after `register()`. `app/src/ports/pwa.ts` calls
  `navigator.storage.persist()` only over http(s), only in the
  installed app (standalone display mode), and only when `persisted()`
  answers false; from `file://` and in a browser tab it does nothing
  (`docs/specs/META.md` section 9).
- Rejected: asking whenever the page is hosted - it would protect a
  browser tab's lists too, but Firefox documents a permission prompt
  for `persist()` (per MDN, not measured here), so a first visit could
  open with a storage prompt. Chrome grants an installed app silently.
