# 2026-09-26 - The account control opens a menu; display settings live on `#/account`

- Task: `persist-5-migration`; ships as R5b `persist-5b-account-menu` (owner, 2026-09-26).
- Decision: signed in, the header's account control is a button that opens
  a menu - «Настройки отображения» (`#/account`), «Мои списки» (`#/lists`),
  «Мои предметы» from the homebrew release, «Выйти»; signed out it stays
  the «Войти» link. `#/account` gains a first section «Отображение» with the
  five settings the account already syncs (language, starting section,
  tables view, print layout, compact sheet) and the purchase-request choice
  «Сообщать владельцу списка» (`user_prefs.notifyGm`, ask / always / never),
  each writing through the existing setters. From the legacy write cutoff
  the tab bar draws nine tabs; `#/lists` stays a route reached from the
  menu. Supersedes the roadmap's "not in v1: a preferences page".
- Rejected: a `#/account/display` route (a contract change for one panel);
  a settings page for signed-out readers (their controls stay on the pages);
  keeping the Lists tab after the cutoff (the owner); provider buttons there.
- Amends "Adding from a shared link asks to notify the owner, remembered in notifyGm" (2026-09-26): the remembered answer is changed in Display settings (owner, 2026-09-26).
