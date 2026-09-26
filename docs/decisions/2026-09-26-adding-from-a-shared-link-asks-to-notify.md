# 2026-09-26 - Adding from a shared link asks to notify the owner, remembered in notifyGm

- Amended by "The account control opens a menu; display settings live on `#/account`" (2026-09-26): the remembered answer is changed in Display settings (owner), and `ask` is its explicit default value.
- Task: `persist-4-requests` (owner answer 33, 2026-09-24).
- Decision: after a signed-in reader who does not own the list adds the
  selection of a `#/s/` page to one of their lists, the selection bar asks
  whether to send the same entries and counts to the list's owner as a
  request, with «Запомнить ответ». A remembered answer is
  `prefs.notifyGm` (`always` or `never`; absent asks), kept in
  `dhloot.prefs.v1` and `user_prefs` like every preference; `always`
  sends without asking and says so in the add toast.
- Rejected: always notify with no setting (some players copy items to
  plan, not to buy); a new preferences page (the owner cut it in v1).
