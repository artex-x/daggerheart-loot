# 2026-11-17 - The root audit allows one picomatch advisory until 2026-12-17

- Task: `ai-mcp` (the owner, 2026-11-17, chat).
- Decision: CI's `audit` job runs `node tools/audit-gate.mjs` for the root package. It fails on
  every high or critical advisory except GHSA-fc5q-39xc-vjpf (picomatch ReDoS, `<=4.0.7`, no
  patched version, published 2026-10-19), which reaches only dev dependencies (vite, vitest,
  svelte-check, typescript-estree). The exception is `ALLOWLIST` in the script, with the
  expiry date 2026-12-17. The artwork and preview audits stay `npm audit --audit-level=high`.
- Rejected: wait for upstream (the red `audit` job blocks every deploy until a fix ships);
  force or downgrade vitest and vite (`npm audit fix --force` moves to older majors and
  breaks the build and the test runner); `--audit-level=critical` (it waves through every
  other high advisory).
- Consequence: the gate fails after 2026-12-17, when the advisory is no longer reported, or
  when its vulnerable range changes. Removal: delete the entry and keep the script.
- Outcome, 2026-11-18: npm stopped reporting the advisory and the gate failed on the stale
  entry. `ALLOWLIST` is now empty; the script and its job step stay for a later exception.
