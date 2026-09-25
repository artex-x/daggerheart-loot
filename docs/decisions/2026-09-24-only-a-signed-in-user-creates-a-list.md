# 2026-09-24 - Only a signed-in user creates a list, from the lists release on

- Amended by "The browser suites' signed-out states draw the sign-in prompt, and the goldens capture it" (2026-09-25).
- Task: `persistent-storage` (owner decision, 2026-09-24).
- Decision: once cloud lists ship, an anonymous visitor creates no list:
  "New list", "Add to list" and "Save a copy" draw a sign-in prompt in the
  slot of the control they replace. Existing local lists stay editable
  until the legacy write cutoff. An unconfigured build (no Supabase URL and
  key, the one the browser suites drive) keeps local creation, because it
  has no account to offer; the prompt states are covered by component tests
  with a fake cloud and by the hosted E2E, never by a golden.
- Rejected: the design's rule - anonymous creation until the cutoff, then
  none (two stores kept alive for the whole window); a fake cloud in the
  production bundle so the goldens could draw the prompt - harness in the
  shipped code.
