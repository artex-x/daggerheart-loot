# 2026-09-25 - A sign-in prompt opens the account page and returns to the action through the redirect record

- Task: `persist-2-lists` (owner answers 2026-09-25: "Save a copy" and
  "Add to list" signed out; mock review: no provider buttons in a prompt).
- Decision: a prompt is one line and one «Войти» that opens `#/account`,
  so providers are listed in one place. «Войти» keeps `{ hash, action }`
  in memory (`app.signInFor`, dropped on leaving `#/account`); the
  account page's sign-in passes it as `AuthPort.signIn(provider, after)`,
  and the real port writes it into `dhloot.auth.return` (sessionStorage,
  10 minutes, checked by `lib/pending.ts`). After sign-in `AppState`
  returns to `hash` and, once the account's lists load, runs the action:
  `addToList` reopens the menu (the bar's with its ticks and counts; from
  the record dialog `#/i/<id>`) with a name typed before the sign-in in its
  form, `saveList` saves the open `#/l/` list.
- Rejected: provider buttons in each prompt (a new provider would touch
  every prompt); `localStorage` (outlives the attempt); a callback query
  parameter (the allow-list is the bare page); reopening the dialog.
