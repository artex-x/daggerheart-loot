# 2026-09-23 - The install link is drawn only where it can be used

- Superseded in part by "Running from a folder and offline use are nice-to-haves" (2026-09-24): the footer nav row
  is always drawn with the policy links; only the install link hides, in
  the installed app.
- Task: `69`.
- Decision: `AppState.showInstall` is `router.hosted() && !pwa.standalone()`;
  the footer nav row is drawn only when it is true (`FEATURES.md`,
  "Chrome").
- Rejected: always shown - a dead link from a folder, where nothing
  installs, and a done action inside the installed app.
