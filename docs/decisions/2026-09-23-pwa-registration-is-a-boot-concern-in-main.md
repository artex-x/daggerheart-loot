# 2026-09-23 - PWA registration is a boot concern in `main.ts` behind `PwaPort`

- Superseded in part by "Running from a folder and offline use are
  nice-to-haves" (2026-09-24): the protocol guard is gone with `file://`;
  and by "The app document links the manifest with a static tag"
  (2026-09-25): the script-added link is gone. The boot call stays.
- Task: `69`.
- Decision: `app/src/main.ts` calls `env.pwa.register()` once, beside
  `mount`. `app/src/ports/pwa.ts` tests the protocol before it touches the
  browser, so `file://` stays a no-op; the same port adds the
  `<link rel="manifest">`, because a static tag fails from a folder
  (`docs/specs/META.md` section 9).
- Rejected: registering in `App.svelte`'s `onMount` - it touches every
  golden's route for a call that draws nothing; a static manifest tag in
  `app/index.html` - Chrome fetches it from a folder and reports a CORS
  error and a failed request.
