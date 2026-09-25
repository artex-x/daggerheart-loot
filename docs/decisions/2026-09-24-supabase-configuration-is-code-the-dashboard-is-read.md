# 2026-09-24 - Supabase configuration is code; the dashboard is read-only; no Branching

- Task: `persistent-storage` (owner decision, 2026-09-24).
- Decision: everything that can be code is code. Auth settings live in
  `supabase/config.toml` (site URL, redirect URLs, email, phone and
  anonymous sign-in off, Google and Discord on with `env(...)` secret
  references, manual linking on) and reach a hosted project only through
  `supabase config push` after a `supabase config diff` that a person has
  read - never a blind `--yes`, because a non-interactive push also writes
  the init template's values over a customised hosted setting. Schema,
  RLS, Realtime policies, the broadcast trigger, the Storage bucket and its
  policies are SQL migrations; Edge Functions, if any, live in
  `supabase/functions/`. The dashboard is read-only by convention: a
  hosted value that differs from the repository is a defect, found by
  `config diff` before each release push (CI holds no access token).
- Rejected: the Supabase GitHub integration (Branching) - pull-request
  based, likely paid, and the owner pushes to `main`; dashboard clicks
  recorded in a checklist - a list nobody diffs.
