# 2026-10-22 - A job with a production secret runs no install script and pins its actions

- Task: `persist-review` (owner, decision 51: I1 "Implement now in B9", 2026-10-22; planner, 2026-10-22).
- Decision: the three jobs that read the `production` Environment (`ci.yml` `migrate-prod`,
  `backup.yml` `dump`, `usage.yml` `report`) install with `npm ci --ignore-scripts` and pin each
  `uses:` by its full commit sha, the major tag as a comment (`# v5`); `tests/derived.js` holds
  both rules for every job that declares `environment: production`, in either form, and requires
  the comment to equal the action's tag in `ci.yml`'s other jobs when they use the action.
  `ci.yml`'s `db` job installs the same way, as the proof on a Linux runner on every push.
- Rejected: `npm rebuild supabase` (the CLI has no install script); pins in every job (no
  production secret there, and each pin is a hand update); a separate install for the
  production jobs (a second lockfile); `ci.yml` `deploy` and `previews.yml` in this change
  (owner, 2026-10-22: "Production jobs only (Recommended)"; `deploy` holds the Cloudflare token
  and Pages write, and `preview`'s `esbuild` and `workerd` install scripts run on `main` only,
  so a scriptless install there has no proof before a landing; `previews.yml` holds
  `TG_SESSION` with `contents: write`).
- Accepted trade-off: a pinned action gets no fix until its sha moves by hand.
