# Shared task context - TASK persist-5b-account-menu

## Goal
- Release R5b: the header's account control opens a menu («Настройки
  отображения», «Мои списки», «Выйти»), `#/account` gains a Display
  section, and the Lists tab leaves the bar at the cutoff (2026-10-26).
  `plan.md` is the authority.

## GitHub issue (if any)
- URL: none (a release of the persistence programme)
- Captured or last verified: 2026-09-26
- Title: -
- Summary (facts only): the owner's answers of 2026-09-26
  (`issues/persistent-storage/context.md`, "Owner answers for R5 and R7"):
  the menu with display settings; the Lists tab leaves at the cutoff; the
  menu ships as its own release right after R5.
- Decisions already settled:
  `docs/decisions/2026-09-26-the-account-control-opens-a-menu-display-settings.md`;
  `docs/decisions/2026-09-26-homebrew-is-reached-from-the-account-menu.md`
  (R7's «Мои предметы» entry); `notifyGm` lives in the Display section
  (owner, 2026-09-26). The first menu item is «Аккаунт» / "Account", not
  «Настройки отображения»: `#/account` also holds sign-in methods, sign
  out and delete; `accountSub` names «Отображение» first (owner,
  2026-09-26, after R5's refresh).
- Open questions: none.

## Screenshot / attachment findings
- `mocks/b53-account-menu.html`: frame A the menu open under the control,
  frame B the Display section first on `#/account`, frame C nine tabs after
  the date.

## Key paths
- Specs: `docs/specs/FEATURES.md` ("Account", "Chrome"), `ROUTES.md`
  ("Sections"), `STATE.md` ("Account preferences"), `COVERAGE.md`.
- Code hot paths: `app/src/components/Shell.svelte` (`a.acct`),
  `TabBar.svelte` (`TABS`), `AccountPage.svelte` (`signOut`, `busy`),
  `AddToList.svelte` (`.dropmenu` values, outside-click and Escape),
  `state/app.svelte.ts` (`setLang`, `setTablesView`, `setPrintBW`,
  `setPrintCompact`, `toggleHome`, `pinOf`, `#applyPrefs`, `#saveAccount`),
  `lib/prefs.ts`, `lib/dict.ts` (`SECTION_LABEL`, `account`, `signOut`);
  `tests/app/inventory.js` (20 signed-in states at `d879c9a4`),
  `states.js`, `tests/e2e/flows.mjs` F2.
- Mocks: `mocks/b53-account-menu.html` on `mocks/mock.css`.

## Command costs

Re-measured 2026-09-25 and 2026-09-26 on this host (R2's and R5's task
records); `.claude/README.md`, "Batch size and the fixed cost of a run", is
the permanent table.

| Command | Wall clock | Fits one call? |
|---|---|---|
| `npm run check` | 348 s | yes; past 600 s on a loaded host |
| `npm run check:built` | 19 s plus its builds | yes |
| `node tests/run-all.js app/print,app/contracts,app/states,app/typo,app/hues,stub` | 806 s (R2, 2026-09-26) | no: split it |
| `node tests/app/sweep.js <width>` | 320-590 s per width | one width per call |
| `node tests/app/golden.js --shard=n/4` | 165-176 s per shard (R2, 2026-09-26) | one shard per call |

## Which machine is authoritative
- For recorded numbers (visual debt, timings): CI (`ubuntu-latest`); a
  local run is advisory.
- What a difference on another machine means: host load, not a
  regression, until CI says otherwise.

## Reasons already disproved
- none

## Constraints
- Contracts / parity / i18n notes: no route, fixture or contract-test
  change; every new text in both languages.

## Shared-machine rules (owner, 2026-09-26, binding for every worker)
- Never touch `.claude/worktrees/agent-a3eca8d34368886ab` or its branch
  `worktree-agent-a3eca8d34368886ab`; never delete any
  `.claude/worktrees/agent-*` worktree.
- The local Supabase Docker stack is shared. Before `npm run check:db`,
  `npx supabase start/stop/db reset` or anything under `tests/db/`, read
  `C:\Users\Ignat\AppData\Local\Temp\dhloot-local-stack.lock`: younger than
  45 minutes - do not use the stack, report the holder it names; otherwise
  write it with "persist-5b-account-menu" and the start time, run, and
  delete it when the command ends (also after a failure).
- At most two heavy agents at a time.
- Push once at closeout. If `origin/main` moved, rebase the unpushed commit
  on it; never force-push.

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
- You suspect drift vs issue or plan
