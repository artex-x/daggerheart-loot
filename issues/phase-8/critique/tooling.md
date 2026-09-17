# Phase 8 critique: `.claude/hooks/`, developer tooling, cold clone

Read-only pass. Scope: `.claude/hooks/*.mjs`, `.claude/settings.json`,
`.claude/README.md`, `CLAUDE.md`, `package.json`, `.github/workflows/ci.yml`,
`.gitignore` / `.prettierignore`, `tests/run-all.js` and the four fs suites,
`tools/`, both READMEs.

Nothing was executed except git, git grep, wc, ls, sed and file reads.
`node .claude/hooks/selftest.mjs` was **not** run: no finding below turns on
it. Node on this host is v24.15.0, `.nvmrc` is 24, prettier is 3.9.6.

Ranked by session time lost when the problem bites.

---

## Worth doing

### TL1 - the nested-worktree class is bigger than prettier, and `.gitignore` is the one file that closes it

`.claude/hooks/tree-key.mjs:35`, `.prettierignore:38`, `.gitignore`

**Problem.** `.claude/worktrees/` was added to `.prettierignore` only. That
fixes `prettier --check .` and nothing else. The tool that actually costs a
session is `treeKey()`:

    const add = spawnSync('git', ['add', '-A'], { cwd: root, env, encoding: 'utf8' });
    const ls  = spawnSync('git', ['ls-files', '-s'], { cwd: root, env, encoding: 'utf8' });
    return createHash('sha256').update(ls.stdout).digest('hex').slice(0, 16);

`git add -A` stages every untracked path that `.gitignore` does not exclude.
`.prettierignore` is invisible to git. So an agent worktree parked at
`.claude/worktrees/agent-<id>/` sits inside the commit gate's working-tree
fingerprint: every file that nested agent writes changes the key, and
`bash-guard.mjs:378-382` then denies a commit whose `npm run check` genuinely
passed two minutes ago. The agent re-runs a ~165 s check; the neighbour writes
again; repeat. That is the most expensive failure shape in this subsystem,
because the deny message (`bash-guard.mjs:391`) says "run `npm run check`,
then commit again" - exactly the wrong advice here, and it reads as true.

**Evidence.** Not hypothetical, and not limited to worktrees. Right now, on
this tree, `git status --porcelain -uall` reports three PNGs under `work/` and
three `issues/56/*.md` as untracked. `work/` matches no `.gitignore` pattern,
so it is already inside the fingerprint. A refresh-artwork agent dropping one
PNG in `work/` invalidates another session's armed check. The
`.claude/worktrees/` incident is one instance of the class; the class is "a
sibling agent's scratch lives under the repo root and is not gitignored".

**Which other root-glob tools are exposed.** Checked, not guessed:

| tool | walks repo root? | scoped by |
|---|---|---|
| `prettier --check .` | yes | `.gitignore` **and** `.prettierignore` |
| `eslint .` | no | `eslint.config.mjs` ignores `.claude/**` outright |
| `svelte-check` | no | `tsconfig.json` include is `app/src/**` + 2 files |
| `vitest run --coverage` | no | `vite.config.mts:134,141`, rooted at app/, `src/**` |
| `tests/run-all.js` | no | fixed SUITES list |
| `treeKey()` (`git add -A`) | **yes** | `.gitignore` only |
| `git status --porcelain -uall`, three call sites (`bash-guard.mjs:284`, `session-start.mjs:40`, `session-stop.mjs:89`) | **yes** | `.gitignore` only |

So there is a general answer, and it is not "one ignore line per tool": put the
pattern in `.gitignore`. Prettier 3 reads `.gitignore` by default - verified in
the installed copy, `node_modules/prettier/internal/legacy-cli.mjs:956-960`
holds `[".gitignore", ".prettierignore"]` as the `--ignore-path` default - so
the `.gitignore` entry would have prevented the original `prettier --check .`
failure as well as the fingerprint pollution. The `.prettierignore` entry is
the subset fix; the `.gitignore` entry is the superset.

**Smallest fix.** Three lines in `.gitignore`, with the reason beside them (the
existing `.prettierignore:29-38` comment can move or be cross-referenced):

    # A dispatched agent's isolated worktree and per-agent scratch: host
    # infrastructure, not source. Also keeps both out of treeKey()'s
    # `git add -A` fingerprint, where a neighbour's write re-arms this
    # session's commit gate.
    .claude/worktrees/
    work/

Plus `settings.local.json` in `.claude/.gitignore` - see TL8.

**Risk.** Gitignoring `work/` means the Stop hook's untracked-write sentence
(`session-stop.mjs:153-158`) stops naming files there: `git status` never
reports an ignored path. That is the one thing lost, and it is small - `work/`
is documented scratch for refresh-artwork, not a commit candidate. If that
trade is unwanted, ship `.claude/worktrees/` alone; the worktree half is the
measured incident.

**Effort/value.** Three lines; removes the worst livelock in the subsystem.
Highest value in this report.

---

### TL2 - the commit gate's fingerprint disagrees with the gate's own exemption list

`.claude/hooks/tree-key.mjs:27-43` against `.claude/hooks/bash-guard.mjs:317-321`

**Problem.** `isExempt()` states the gate's whole theory of what `npm run
check` reads: everything under `issues/` is exempt, and every `.md` except
`README.md` and `README.ru.md`. `.claude/README.md` explains why at length
("What the check does not cover: markdown ... which is also why the commit
gate exempts those paths (`isExempt`)"). But `treeKey()` hashes the whole
tree, exempt paths included. The two halves of one mechanism hold opposite
beliefs about the same files.

**Reproduction, reasoned through.** The ordinary end-of-batch sequence:

1. `set -o pipefail; npm run check 2>&1 | tail -n 120` passes;
   `check-observer.mjs` arms key K.
2. The agent updates `issues/<id>/handoff.md` - which the README explicitly
   says is safe at any time, because no check stage reads it.
3. `git add app/src/... && git commit -m "..."` gives `covered.length > 0`,
   `treeKey()` returns K' != K, and the gate **denies**: "npm run check has
   not passed for this working tree".
4. A ~165 s re-check, for a change the check provably cannot see.

Every `/handoff` write, every `docs/specs/*.md` edit, and every file another
agent drops in `issues/<other>/` does this. `selftest.mjs` case #26 only proves
the other direction (exempt paths staged alone stay silent, because
`covered.length === 0` returns before `treeKey()` is ever called), so nothing
catches it.

**Smallest fix.** Export `isExempt` from `lib.mjs` (four lines, already shared
in spirit) and filter in `tree-key.mjs` before hashing: split each
`git ls-files -s` row on the tab, drop the row when `isExempt(path)`, hash the
remainder. Plus one selftest case - arm the cache, append to
`issues/65/handoff.md`, assert the gate is still silent for a staged
`app/src/lib/x.ts`.

**Risk, and why this is not a loosening.** The gate already declares these
paths uncovered; this only makes the fingerprint agree with the declaration.
It becomes a weakening the moment `isExempt` is wrong. Verified today it is
not: the check chain is format:check (prettier, `*.md` ignored), lint (no
`.md`), typecheck, `node --check tools/check-site.mjs`, `npm run data`,
`tests/derived.js` (reads `README.md`, `README.ru.md`, `llms.txt`,
`robots.txt` - the two READMEs are carved out, the other two are not `.md`),
selftest, two `node --test` sibling suites, vitest.

**The live trap to record next to the change:** `tests/contracts.js:79-81`
reads `docs/specs/CONTRACTS.md` and `docs/specs/ROUTES.md` - but
`tests/contracts.js` is **not** in `npm run check`; it runs only through
`tests/run-all.js`. If it is ever added to the check chain, `isExempt` (and
therefore this filter) becomes wrong for `docs/specs/**`. One comment on
`isExempt` naming that dependency is part of this fix.

**Effort/value.** ~10 lines plus a test. Saves a 165 s re-check every time an
agent writes the handoff before committing code - which is most batches.

---

### TL3 - the orphan-plan guard cannot tell a live pointer from a sha-pinned one, and its message offers no way forward

`.claude/hooks/bash-guard.mjs:222-251` (`citingLines`, `evaluateOrphanPlan`),
message at `:61-65`

**Arguing with the record, not past it.** `.claude/README.md` row 40 adopts
this rule for reasons that still hold: ten dead citations to issue 65's
retired `plan.md` shipped and were found months later; a `speak` at PreToolUse
gets acknowledged and stepped past; `edit-guard.mjs` never sees a deletion;
`session-stop.mjs` fires after the fact. All of that survives what follows.
The rule should stay a deny, repository-wide, at this call site.

**What is wrong is the predicate, not the rule.** `citingLines()` runs an
unqualified `git grep -n --fixed-strings -- <target>` and counts every hit.
Reproduced here for `issues/47/plan.md`: about twenty tracked hits once the
self-hits are dropped. Two whole families in that set cannot be harmed by the
deletion:

1. **Revision-pinned citations.** Thirteen of them, e.g.
   `issues/47/handoff.md:246`, which reads `git show fc59ce4:issues/47/plan.md`.
   These resolve through history. Deleting the working-tree file changes
   nothing about them. The guard counts them as live pointers.
2. **Citations that already dangle with the file present.**
   `issues/config-audit/context.md:260` cites `issues/47/plan.md:11534` and
   `issues/config-audit/context.md:314` cites `issues/47/plan.md:14711-14714`.
   `wc -l issues/47/plan.md` is **1943**. Those line numbers were true when the
   file was 16,012 lines and have been dead since the compaction - deleting the
   file could not have made them worse.

So the guard blocked a deletion in order to protect pointers that either
survive it or were already broken. That is a false positive of exactly the
kind the brief asks to find before it costs a session - and it did cost one:
the owner had to stop, audit twenty grep hits by hand, and decide to keep the
file.

**Smallest fix (family 1 only).** In `citingLines()`, drop a hit whose matched
occurrence is immediately preceded by a revision qualifier - locate the
occurrence's column, and skip it when the text just before it matches
`/(?:[0-9a-f]{7,40}|HEAD[~^\d]*)\s*:\s*$/i`. Two selftest cases: a
`git show <sha>:issues/65/plan.md` citation must not deny; a bare
`issues/65/plan.md` citation on the same line still must.

**What it risks getting wrong.** A false negative if somebody writes
`abc1234:issues/47/plan.md` while meaning the live file - implausible, and the
cost is the original harm (one dead citation), not a lost session. A subtler
case: a line carrying both forms. The regex is per-occurrence, so the bare
mention still denies. Correct.

**Family 2 (out-of-range line numbers) - proposed, with its risk stated.** A
second, optional test: if a hit's text is `<target>:<N>` and N exceeds the
target file's line count, the citation already dangles. Cheap - one
`readFileSync` of a file about to be deleted. Risk: it reads as the guard
rewarding neglect, and it silently forgives a citation somebody could still
repair. I would ship family 1 and leave family 2 unimplemented, recorded here
so nobody re-derives it.

**Message fix, independent of both and worth doing on its own.** Every other
deny in `bash-guard.mjs` names the way out - "use `git restore --staged`",
"use `--force-with-lease`", "run it with -n first". `MSG.orphanPlan` names
only the work ("update every citation"), never an escape, and there is no
`SKIP_*` for this rule. A fresh agent that has just established every hit is
historical has nowhere to go, and will either loop or quietly give up. One
clause fixes it: "A citation of the form `git show <sha>:<path>` resolves
through history and survives this deletion; if every hit above is one of
those, the retirement is safe and the human can run the removal from their own
terminal."

**Effort/value.** ~8 lines plus two tests plus one sentence. Value is high and
lumpy: it bites rarely, but when it bites it stops a closeout dead.

---

### TL4 - the long-check reminder has not been re-aimed since R0c; the two runs that cannot finish in one call are the two it ignores

`.claude/hooks/bash-guard.mjs:395-399`, `tests/run-all.js:61-73`

**Problem.** `LONG_CHECKS` carries three rows: `npm run check:built` ("a few
minutes"), `npm run check` ("a few minutes"), `node tests/run-all.js` ("about
fifteen minutes"). Three things are wrong with it after R0c:

1. **`node tests/app/golden.js` and `node tests/app/sweep.js` are not in the
   list.** `.claude/README.md`'s cost table measures them at 100-290 s per
   shard and 320-590 s per width, and says in as many words that a bare
   `node tests/app/golden.js` is past the 600 s cap and "must run separately,
   never as one bare call"; `tests/run-all.js:38` repeats the rule. No hook
   enforces or even reminds. This is the clearest instance of a rule stated in
   prose that no hook enforces and could cheaply be enforced: two array
   entries, in a table that already exists, on the speak-once mechanism
   candidate row 10 was adopted on. Rule 2h and `parityLock` took away the only
   thing that used to notice a heavy run; the reminder is the cheap half of
   what is left.
2. **`run-all`'s cost is a pre-R0c number.** "About fifteen minutes" was true
   when the pool carried fourteen legacy suites. `.claude/README.md` now
   measures the filtered pool at ~260-290 s. Worse, the reminder tells the
   agent to run it with `timeout 600000` - and an unfiltered `run-all.js`
   (four `app/sweep` widths plus four `app/golden` shards, longest single job
   370 s) cannot keep that promise. The failure mode is the lost run the README
   documents.
3. **`npm run check` says "a few minutes" where the whole repository says
   ~165 s** (`.claude/README.md`, `CLAUDE.md`). Minor, but it is the first
   number an agent sizing a batch reads.

**Also here, same file family:** `node tests/run-all.js --help` does not print
help. `tests/run-all.js:71` filters out any argv entry starting with `-`, so
`--help` leaves both `only` and `exclude` empty and the script launches every
suite, including the eight browser jobs. Asking a runner for its usage should
not start a ten-minute Chrome pool.

**Smallest fix.** Two `LONG_CHECKS` rows - one matching
`node tests/app/golden.js` with no `--shard`, one matching
`node tests/app/sweep.js` - each with the measured cost and the "run it per
shard/width" sentence; plus corrected cost strings on the two existing rows.
In `tests/run-all.js`, three lines before the arg parsing that print the header
comment as usage and exit 0 on `--help` / `-h`.

**Risk.** The reminder is speak, once per session per family - it forbids
nothing, so a wrong match costs one message. The `--help` guard changes
behaviour only for an argv that currently does the wrong thing.

**Effort/value.** Under twenty lines. Value scales with how often an agent
loses a browser run to the foreground cap, which the README records as
routine.

**Stale prose in the same file, worth fixing while there:**
`tests/run-all.js:65-68`'s `--exclude=` comment still explains itself in terms
of `parity`, `parity.js --shard` and 867 s. The harness is gone; the live
caller is `ci.yml:47`'s `--exclude=app/golden`.

---

### TL5 - `git restore --staged --worktree` walks through the git-discard rule

`.claude/hooks/bash-guard.mjs:166-168`

    if (subcommand === 'restore') {
      if (!tokens.includes('--staged')) return { id: 'git-discard', message: MSG.gitDiscard };
    }

The rule's model is "--staged means unstage, which is safe". But
`git restore --staged --worktree <path>` restores both the index and the
working tree from HEAD - it destroys uncommitted changes exactly as
`git restore <path>` does, and it passes. The short cluster `-SW` is caught,
because `includes('--staged')` is false for it, so the guard blocks the terse
spelling and allows the explicit one, which is backwards. And
`MSG.gitResetHard` actively recommends `git restore --staged <path>`, so this
is the spelling an agent is being pushed toward.

**Smallest fix.** Deny when `--worktree` or a `-W` cluster is present, whether
or not `--staged` is:

    if (subcommand === 'restore') {
      const worktree = tokens.includes('--worktree') || flagMatches(tokens, 'W');
      if (worktree || !tokens.includes('--staged')) {
        return { id: 'git-discard', message: MSG.gitDiscard };
      }
    }

One selftest case (`git restore --staged --worktree app/src/lib/x.ts` denies)
beside the existing #23.

**Risk.** It denies a legitimate "reset this path to HEAD everywhere" - which
is precisely what `MSG.gitDiscard` exists to stop, and the message already
names the alternative. Near-zero false-positive cost.

**Effort/value.** Three lines. Low frequency, irreversible when it fires,
which is the whole argument for the 2b family.

---

### TL6 - `rm -r` without `-f` bypasses both the repo rm rule and the orphan-plan rule

`.claude/hooks/bash-guard.mjs:110-122`, `:176-180`, `:198-220`

`rmHasRecursiveForce()` requires both `r` and `f`. In a non-interactive shell -
which is what the Bash tool gives - `rm -r issues/47` deletes the directory
without a single prompt. So the `rm -rf`-inside-the-repo rule does not fire;
and `orphanPlanTargets()` only matches a token that is literally
`issues/<id>/plan.md`, so `rm -r issues/47` retires a cited plan with no deny
at all. `.claude/README.md`'s "Known limitations" records the `git clean`,
`node -e`, unexpanded-glob and human-terminal holes in that rule, but not this
one - and this one is the shape an agent would actually type.

**Smallest fix.** Drop the `-f` requirement, keep the exempt list, and add `i/`
to it (generated, and gitignored since `f53f44d`):

    const exempt = /^(dist|coverage|test-output|node_modules|i)(\/|$)/;

Then leave the orphan rule alone: the widened `rm -r` deny stops the command
before it can reach a plan.md, which is the smaller of the two possible
changes and covers the case.

**Risk.** `rm -r` on genuine scratch inside the repo now needs either a
named-file `rm` or the human's terminal. That is one retry - the same price
candidate row 43 accepted for `grep -n`. Record the new shape in the README's
limitations list either way.

**Effort/value.** Five lines plus two selftest cases: `rm -r app` denies,
`rm -r dist` and `rm -r i` stay silent.

---

### TL7 - four suites fail with a raw ENOENT stack on a clone that has not built

`tests/craft.js:83`, `tests/dataint.js:181`, `tests/stub.js:13`,
`tests/derived.js:26`

`f53f44d` untracked `i/`. The documentation is correct: `README.md:291-294`
and the matching `README.ru.md` passage say to run `node tools/build.js`
first, `README.md:304-305` separately says `npm run build` is needed for the
`tests/app/*` suites, `COVERAGE.md` names the same four suites, and
`ci.yml:190-194` records that Collect must never precede Build. What is not
fine is what a reader who skipped all that sees.

The good pattern already exists in the repo. `tests/derived.js:19-23` guards
with `existsSync` and reports "файла нет - запусти node tools/build.js";
`tests/derived.js:65-70` does the same for the stubs and produces one
actionable line. Four other reads do not:

| site | on a clone with no `i/` |
|---|---|
| `tests/craft.js:83` `readFileSync(ROOT/i/w3.html)` | uncaught ENOENT, stack, no hint |
| `tests/dataint.js:179-181` | 1091 FAIL lines from the `existsSync` loop, then `readdirSync` throws ENOENT |
| `tests/stub.js:13` `page.goto('file://.../i/w3.html')` | puppeteer `net::ERR_FILE_NOT_FOUND` as an unhandled rejection inside the async IIFE, so `closeBrowser()` never runs and a Chromium is leaked |
| `tests/derived.js:26` `readFileSync(catalog.csv)` | unguarded, unlike lines 19-23 for the same file; reachable only if the tracked file is deleted, so cosmetic today - but it is the inconsistency that taught the pattern |

**Smallest fix.** One preflight in the single entry point all four go through,
after `queue` is built at `tests/run-all.js:73`: if the queue contains any of
`derived`, `dataint`, `craft`, `stub` and `i/` is absent, print "i/ is missing
- it is generated, not committed. Run `node tools/build.js` (or
`npm run build`) first." and exit 1. `npm run check` is unaffected: it runs
`npm run data` and then `node tests/derived.js` directly, never through
`run-all.js`. Optionally guard `tests/derived.js:26` with the same
`existsSync` + message its own neighbours use - three lines, and it removes
the inconsistency inside a file the change touches.

**Risk.** None meaningful. The preflight fires only when the directory is
absent, which is already a guaranteed-red run.

**Effort/value.** ~10 lines. Value is exactly one cold-clone debugging session,
and this repository just changed its cold-clone contract.

---

### TL8 - three small coherence gaps between the documents and the hooks

**(a) `edit-guard.mjs` blocks something `.claude/README.md` does not mention.**
The Hooks table row (`.claude/README.md:110`) reads "Blocks writes to
`data.json`, `catalog.csv`, `i/*.html`, `dist/`, `package-lock.json`." The
sixth rule, `edit-guard.mjs:35-39`, also blocks `tests/app/snapshots/**` with
the message "structural goldens, regenerated by `node tests/app/golden.js
--update`. Do not hand-edit one to make a run pass." Good rule, good reason,
undocumented - the one case in the subsystem of a hook enforcing something no
document explains. `CLAUDE.md` says "the table is in `.claude/README.md`", so
the table is the contract. Fix: seven words in the row.

**(b) `.claude/.gitignore` does not cover `settings.local.json`.** The file
exists here and is clean only because the owner's global ignore
(`C:\Users\Ignat/.config/git/ignore:1`, carrying
`**/.claude/settings.local.json`) hides it - confirmed with
`git check-ignore -v`. On any other clone, Claude Code writing that file makes
it untracked, which puts it in `git status`, in the Stop hook's candidate list,
and (per TL1) in the commit-gate fingerprint. Fix: one line in
`.claude/.gitignore`, beside the three runtime files already listed there.

**(c) `CLAUDE.md:36` still says "parity run".** "A second session's `npm ci`,
staged index, vitest coverage directory or parity run will corrupt the first's
results". The parity harness was deleted at `23c00a6`. The sentence stays true
if "parity run" becomes "browser suite run" - which is what now collides, and
what `.claude/README.md` flags as unguarded since rule 2h retired. One word.

**Effort/value.** Minutes each. This is the kind of drift that makes the next
reader distrust the table.

---

## Noticed, not worth it

- **`selftest.mjs` is in good health after R0c.** No `parity`, `lock`, `2h` or
  `heavy` identifier survives anywhere under `.claude/hooks/` (grepped across
  all nine files). No orphaned helper: every function defined is called from
  `main()`'s eighteen-call list or from one of those. `ALL_SCRIPTS` (8 entries)
  matches the eight non-selftest scripts. Numbering gaps are the only residue
  and they are sanctioned. The real weaknesses are coverage gaps for rules that
  exist, and they are exactly the ones TL2, TL5 and TL6 would add: no case pins
  the gate across an exempt-path edit, none covers
  `git restore --staged --worktree`, none covers `rm -r` without `-f`. Cases
  #39a-#39g (edit-guard near misses) and #119-#125 (RTK reader non-matches) are
  the model for how those should be written.
- **`tools/` has no orphans.** Every tracked script is reachable:
  `build.js` / `derived.js` / `build-share-pages.js` via `npm run data` and
  `tests/derived.js`; `bundle-budget.mjs` via `npm run budget` and
  `tests/derived.js:450`'s COUNTERS list; `smoke-file-url.mjs` via `npm run
  smoke` and `ci.yml:39`; `check-site.mjs` via `ci.yml:280` and `node --check`
  in the check chain; `capture-share-fixture.mjs` is cited by
  `app/src/lib/share.ts:11`, `share.test.ts:5` and `COVERAGE.md:63` as the
  fixture generator; `tools/tg-preview/state.json` is committed on purpose and
  documented at `docs/tg-preview.md:44`. `vault_extract.py` and
  `tools/__pycache__/` are gitignored owner-local files, not repository
  content. Both sibling npm projects' `lib.test.mjs` import only node builtins
  and their own `lib.mjs` (checked), so `npm run check` needs no install inside
  either - the cold clone is sound there, and `npm ci` at the root is genuinely
  all a fresh clone needs before `npm run check` and `npm run build`.
- **`LONG_CHECKS`'s "a few minutes" for `check:built`** matches the only
  measured figure that exists for it (`.claude/README.md`). Honest; left alone.
- **`.gitignore`'s `*-PLAN.md` / `*-DESIGN.md` patterns** would silently
  swallow an `issues/<id>/SOMETHING-PLAN.md` and hide it from the Stop hook's
  untracked-write sentence, because `git status` never reports an ignored path.
  No instance exists; not worth a rule.
- **`git checkout <sha> -- <paths>` is denied** by `bash-guard.mjs:161-165`,
  and that is the exact recovery command `23c00a6`'s own commit message
  prescribes for restoring the old app. The deny is correct (it does overwrite
  the working tree) and the message names the alternative, so this is a
  documentation footnote at most, not a change.
- **`.claude/README.md` is 51 KB** and several roles read it in full. No
  recommendation - its "Candidates considered" table is the densest useful part
  in the repository - but it is the next file to hit a size budget if one is
  ever applied outside `issues/`.

---

## Explicitly out of scope

Noted, two lines each, per the brief:

- **A replacement for the retired heavy-run lock.** `.claude/README.md` hands
  this to Phase 8 as an open question. It is a `tests/` change (something has
  to write a lock again), not a hooks change, and the standing bar wants the
  collision to recur once first. TL4's reminder is the cheap partial answer.
- **Any restructuring of the hook system** - a registry, a shared rule table, a
  config file. Everything above is an edit inside an existing function or a row
  in an existing array.
