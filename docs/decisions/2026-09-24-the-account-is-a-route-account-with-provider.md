# 2026-09-24 - The account is a route, `#/account`, with provider linking

- Task: `persistent-storage` (owner decision, 2026-09-24).
- Decision: the header control ("Sign in" or the account name) opens
  `#/account`, a public route with five sections in order: signed in as
  (provider and email from the session, never stored in `public`);
  connected providers (Connect through `linkIdentity`, Disconnect through
  `unlinkIdentity`, drawn only while two or more identities exist); your
  data (Export JSON, once import/export ships); sign out; delete account
  with a typed confirmation calling `delete_account()`. Manual and
  automatic (verified email) linking both stay on. A provider account held
  by another user fails with `identity_already_exists`: "This <provider>
  account is already used by another account"; the privacy page states the
  recovery (export from the account you drop, import into the one you keep).
- Rejected: a dialog - extra code to reopen after the OAuth redirect, and
  no plain URL for the erasure link; no linking UI (the planner's cut) -
  two accounts with no way to join them when the provider emails differ.
