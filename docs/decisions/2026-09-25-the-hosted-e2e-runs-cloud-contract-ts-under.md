# 2026-09-25 - The hosted E2E runs `cloud.contract.ts` under Node's own type stripping

- Task: `persist-1-auth` (planner, 2026-09-25).
- Decision: `tests/e2e/` imports the app's TypeScript ports
  (`cloud.contract.ts`, `supabase.ts`) straight into Node 24, which strips
  erasable types. `tests/e2e/ts-hooks.mjs`, loaded by `--import`, maps a
  `.js` import inside a `.ts` file to its `.ts` sibling and loads `.ts` as
  a module; `tsconfig.json` sets `erasableSyntaxOnly`, so typecheck refuses
  what Node could not strip. Measured 2026-09-25: the contract over the
  fake passes this way, with no warning and no new dependency.
- Rejected: `vite-node` and `esbuild` (neither is in the tree since vitest
  4 and vite 8's rolldown); `tsx` (a dependency for one directory); a
  vitest project for layer 4 (network inside the unit runner's config and
  coverage); bundling with rolldown first (a build step and a temporary
  file per run).
