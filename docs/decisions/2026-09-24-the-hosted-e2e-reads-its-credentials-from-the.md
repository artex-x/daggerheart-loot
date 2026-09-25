# 2026-09-24 - The hosted E2E reads its credentials from the environment; no proxy credential

- Task: `persist-1-auth` (owner confirmation, 2026-09-24, cloud session 2).
- Decision: the harness reads `E2E_SUPABASE_URL`,
  `E2E_SUPABASE_PUBLISHABLE_KEY`, `E2E_SUPABASE_SECRET_KEY` and
  `E2E_USER_EMAIL` from the process environment on every host (CI secrets,
  `--env-file .env.test.local` locally, the cloud environment's variables).
  The mint stays `generateLink` then `verifyOtp`, creating the user when
  absent. The probe discriminates: `GET /auth/v1/user` with the publishable
  key and no `Authorization` must answer 401 `no_authorization`, from Node
  and from a Puppeteer page, and one carrying `Bearer a.b.c` must be refused
  for that token. The test project's secret key is model-visible; it opens
  the test project only.
- Rejected: a proxy API credential (measured to replace every
  `Authorization` header and not to grant admin); anonymous sign-ins (no
  identity to test `#/account` with); layer 4 in CI only on `main`;
  `signInWithPassword` (a second credential shape for one user); a CI-side
  session mint handed to the cloud (a session token in transit for no gain).
- Supersedes "The hosted E2E mints its session with the secret key, not a password" (2026-09-24).
