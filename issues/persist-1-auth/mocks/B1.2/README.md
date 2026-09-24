# B1.2 mocks (pre-pass, awaiting owner approval)

Static and self-contained. Dark only, as the app (`tokens.css`: `color-scheme:
dark`). RU by default; any RU/EN switch flips every string (I18N.md). Dashed
teal outlines mark choices the roadmap leaves open; a checkbox hides them.

- `header.html`: 1-3 desktop (signed out; signed in; signed in on
  `#/account`), 4 at 360 px (both states), 5 an alternative signed-in look.
- `account.html`: A `gm1`, two identities; B `gm2`, one; C already-linked
  error; D redirect state; E delete with typed confirmation; F signed out;
  G unconfigured build; H 360 px. No "Your data" section (R6).

Reuse: `Shell.svelte` topbar, `Seg.svelte`, `TabBar.svelte`,
`PageTitle.svelte`, `Panel.svelte` headed by `Field.svelte`'s `.lbl`,
`Button.svelte` (`plain`, `sm`, `ghost`, `danger`), `ListsPage.svelte`'s text
input in a `NumRow`; values only from `tokens.css` and those files.

Open choices (recommendation stated):

1. Control signed out: a Seg-track pill, person glyph plus "Войти"/"Sign in";
   signed in: a 38 px circle with the email's initial (alt: glyph + gold dot).
2. Below 420 px the signed-out label is visually hidden (estimate at 360:
   ~71 px free, pill ~73 px); the text stays the accessible name.
3. New `user` icon in `lib/icons.ts`; no provider avatar (third-party request).
4. On `#/account`: `aria-current="page"` plus the gold glow ring, no tab lit,
   title `Аккаунт — <docTitle>`.
5. Page column capped at `70ch` (`.page-sub`'s value), not full width.
6. "Signed in as": bold email, provider logo, "через Google"; user-name
   fallback when a provider gives no email.
7. Disconnect: `ghost sm`, no confirmation. One identity: a hint says why.
8. Already-linked: inline `#f0a49d` text, `role="alert"`, under the row.
9. Redirect: the button disables and reads "Переходим в Discord...".
10. "Sign out everywhere": `ghost` beside plain "Sign out", no confirmation.
11. Delete: inline disclosure in its panel; typed "удалить"/"delete", trimmed,
    case-insensitive; final button disabled until it matches; says local
    lists on this device stay.
12. Signed out: plain buttons with the standard Google "G" and Discord logos,
    plus one consent line linking `terms` and `privacy`.
13. After Sign out or Delete: stay on `#/account` (frame F) with a toast.

## Owner answer (2026-09-24, Q&A)

Standing rule for account texts and names: design for the final state
(after R10) in general terms, so a text stays true in every release and
is not rewritten per release. Apply it to every string and name B1.2 adds.

- M1-M9, M11-M14: as recommended.
- M10: "Аккаунт и все связанные с ним данные будут удалены навсегда."
  (no sentence about local lists).
- M15: "Войдите, чтобы ваши данные были доступны на всех устройствах. Всё
  остальное работает и без входа."
- M16: changed - a build with no sign-in configured draws no account
  control, and `#/account` shows the not-found page (no frame G text).
- M17: settled by the answers above.

The owner may adjust in later batches.
