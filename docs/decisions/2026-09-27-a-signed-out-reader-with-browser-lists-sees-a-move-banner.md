# 2026-09-27 - A signed-out reader with browser lists sees a move banner until the cutoff

- Task: `persist-5b-account-menu` (owner, 2026-09-27, relayed by the coordinator).
- Decision: before `LEGACY_WRITE_UNTIL`, a signed-out reader whose browser holds lists sees a
  banner under the header on every page but `#/account`: sign in before the date and the lists
  move to the account; after it the app stops showing them. «Войти» starts the sign-in prompt's
  action; «Скрыть» hides the banner in memory until the next page load. The `#/lists` storage
  notice and the lists help say the same words. Behaviour: `docs/specs/FEATURES.md`, "Account
  and browser lists"; `docs/specs/STATE.md`, the memory table.
- Rejected: «Скрыть» in `sessionStorage` (a reload in the same tab would keep it hidden, but it
  needs a new port member and its fake for a banner R10 deletes four weeks later); «Скрыть» in
  `localStorage` (hidden for good, against "until the next visit"); the banner after the date
  (its text names a date then past; the `#/lists` read-only notice keeps the way in until R10).
