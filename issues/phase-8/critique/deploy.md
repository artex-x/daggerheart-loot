# Critique: the deploy and release path

TASK phase-8. Read-only review, 2026-09-17. Scope: `.github/workflows/ci.yml`
(the `deploy` job and the concurrency that orders it), `tools/check-site.mjs`,
and the build dependency that `f53f44d` introduced by untracking `i/`.

Evidence read: `ci.yml`, `tools/check-site.mjs`, `tools/build.js`,
`tools/build-share-pages.js`, `vite.config.mts`, `package.json`, `.gitignore`,
`.github/workflows/previews.yml`, `tests/derived.js`, `tests/dataint.js`,
`tests/craft.js`, `tests/run-all.js`; the full job log of run `35214847899`
(the `i/` untracking deploy); live HTTP against
`https://artex-x.github.io/daggerheart-loot/`.

Not re-reported: `docs/specs/DEBT.md` `D1`-`D23`; CI *timing* and the hooks
subsystem, owned by `critique/tests.md` and `critique/tooling.md`.

## Verdict first

**The deploy is correct as built, and the happy path is better guarded than
most.** What it publishes is either built from the commit or copied from it,
and the guard re-verifies the copies byte-for-byte. Nothing found here is
broken in production today. Every finding below is 1-4 lines of change, and
the three that matter are about the *recovery* path, not the publish path.

The evidence for the clean verdict, since a freshly rebuilt release path
deserves it stated rather than implied:

- Every published byte is accounted for. `ci.yml:241-246` runs `cmp -s` on
  `index.html` and `assets/app.js` against `dist/`, so "a file of the right
  name turned up" cannot pass for "the build was copied".
- The product laws are gated *before* the publish, not after.
  `tests/derived.js:84-88` asserts `robots.txt` still says `Allow: /` and still
  excludes training scrapers, and `ci.yml:249` re-asserts `noindex` on the
  published `index.html`. The noindex-while-crawling law cannot regress
  silently.
- The new build dependency does not fail quietly. `tools/build.js:29` runs the
  stub generator through `execFileSync` with `stdio: 'inherit'`, so any throw
  inside `build-share-pages.js` fails `npm run build` and fails the job. A
  silent partial write is not a shape this code can produce.
- The stub count is pinned upstream on the same commit: `tests/dataint.js:181`
  (count of `i/*.html` equals record count) and `tests/craft.js:85` (1091
  literal), both inside the `check` job's
  `node tests/run-all.js --exclude=app/golden`.
- Verified live, not assumed. `i/q381.html` and `i/ci79.html` - records around
  positions 300 and 700 in catalog order, not the one name the guard probes -
  both return 200. The artifact listing in run `35214847899` contains exactly
  1092 entries under `i/` (the directory plus 1091 pages), 877 under `img/`,
  878 under `og/`, 37 under `card/`.
- Ordering is safe for the normal case. The workflow-level concurrency group
  `pages` with `cancel-in-progress: false` (`ci.yml:13-15`) means a second push
  to `main` queues behind the first rather than racing it, so an older commit
  cannot publish over a newer one through this workflow.
- `previews.yml` cannot amplify a bad deploy: it fires on `workflow_run` with
  `conclusion == 'success'`, and `check-site.mjs` failing turns the run red, so
  a failed verification also stops the Telegram refresh.

## Worth doing

Ranked by blast radius x likelihood.

---

### DP1 - a hung job holds the `pages` group for six hours, and the revert queues behind it

**Where:** `ci.yml` - no `timeout-minutes` on any of `check`, `golden`,
`audit`, `secrets`, `deploy`; and `tools/check-site.mjs:33-38`, whose `get()`
calls `fetch` with no timeout.

**Failure mode.** Node's `fetch` has no default timeout. A stalled connection
to the Pages CDN - the one host this step exists to talk to - hangs the step
forever. With no `timeout-minutes`, the job then runs to the GitHub default of
**6 hours**. Because `cancel-in-progress: false`, the `pages` concurrency group
is held for that whole time, and only one run may be pending behind it.

**How it reaches production.** `deploy-pages` publishes a broken site (the
publish always happens before the verification - see DP5's ordering note).
`check-site.mjs` starts its first request and the socket stalls. You notice the
site is wrong, `git revert` and push, exactly as `ci.yml:129-134` instructs -
and that run sits *pending* behind the hung one. The documented recovery
procedure is disarmed by the step whose only job is to tell you to run it.

**What a user sees.** The broken site, for as long as it takes someone to
notice the run is not hung by accident and cancel it by hand.

**Caught by:** nothing. A hung step is green until it is killed.

**Smallest fix.** Two places, three lines. On the job:

    timeout-minutes: 10        # and 30 on check and golden

and in `check-site.mjs`'s `get()`:

    const res = await fetch(url, { cache: 'no-store', redirect: 'follow',
                                   signal: AbortSignal.timeout(15_000) });

The `catch` around `run()` at `check-site.mjs:89-92` already turns a thrown
request into a retryable failure, so an abort lands in the existing retry loop
with no other change. `previews.yml:39` already sets `timeout-minutes: 60`;
this is the same discipline applied to the workflow that can block recovery.

**Effort/value.** Three lines. Highest value in this report: it is the only
finding that makes the recovery procedure itself unavailable.

---

### DP2 - the guard never counts the 1091 stubs it now has to trust

**Where:** `ci.yml:220-230`.

**Failure mode.** `i/` is the one published folder that is no longer committed.
Everything the guard says about it is "the directory is non-empty"
(`ci.yml:220-224`) and "`i/w1.html` is non-empty and contains `og:image`"
(`ci.yml:228-234`). `check-site.mjs:72-74` probes the same single name. A set
of 1 stub and a set of 1091 are indistinguishable to both. This is precisely
the property `f53f44d` made the deploy responsible for, and the one it did not
add a check for.

**How it reaches production.** Today it does not, and that is worth saying
plainly - `tests/dataint.js:181` and `tests/craft.js:85` pin the count in the
`check` job on the same commit, and the generator cannot half-succeed (see the
verdict section). The residual is the asymmetry itself: the `check` job asserts
the count on *its* build, the `deploy` job uploads *its own* rebuild, and
nothing compares the two or counts the second. Any future change that lets the
two builds differ - a step reordered, a generator that starts skipping records
instead of throwing, a data shape producing id collisions in a path the count
tests do not reach - lands on the live site with only the `w1` probe between it
and the user.

**What a user sees.** Every shared link but one 404s. Worse, this is the one
defect that outlives the revert: `previews.yml` runs on the green
`workflow_run`, refreshes Telegram previews against those URLs and records them
in `state.json`, so the caches hold the broken result after the site is fixed.

**Caught by:** the `check` job, not the deploy guard. The guard is the only
thing that reads the bytes actually uploaded.

**Smallest fix.** Three lines in the existing guard, using only files already
in `_site` - no new tooling, no new dependency between steps:

    want=$(( $(wc -l < _site/catalog.csv) - 1 ))
    got=$(ls _site/i | wc -l)
    if [ "$got" -ne "$want" ]; then
      echo "::error::_site/i has $got stubs, catalog.csv has $want records"
      exit 1
    fi

Verified on this tree: `wc -l catalog.csv` is 1092 (header plus 1091, trailing
newline present - last byte is 0x0a) and `ls i | wc -l` is 1091. The identity
"one stub per record" is the same one `tests/dataint.js:181` asserts, so this
adds no new contract; it moves an existing one to the place that can still act
on it.

**Effort/value.** Three lines. This is the check the new build dependency
actually needs, and the one whose absence is attributable to `f53f44d`.

---

### DP3 - the `deploy` job's `permissions:` block silently drops `contents: read`

**Where:** `ci.yml:157-159` - `permissions: { pages: write, id-token: write }`.

**Failure mode.** A job-level `permissions:` block **replaces** the
workflow-level one rather than extending it; every scope not listed is set to
`none`. So the `deploy` job's `GITHUB_TOKEN` has `contents: none`, and
`actions/checkout@v5` at `ci.yml:164` is cloning without the contents scope. It
works only because the repository is public. GitHub's own Pages starter
workflow lists `contents: read` alongside the other two for exactly this
reason.

**How it reaches production.** Make the repository private for a week, or add
any step to this job that reads the API - `checkout` starts returning 403. It
fails in the *deploy* job alone, after `check`, `golden`, `audit` and `secrets`
are all green, so `main` looks healthy and publishing has stopped.

**What a user sees.** The previous site, indefinitely. A stale deploy is the
quietest failure on this list.

**Caught by:** nothing; it is latent.

**Smallest fix.** One line: add `contents: read` to the block.

**Effort/value.** One line, zero risk, restores the shape GitHub documents.
Likelihood is low but the failure is a class - "publishing stops and main looks
fine" - rather than an instance.

---

### DP4 - CI can never detect a stale committed `data.json` / `catalog.csv`

**Where:** `package.json`, the `check` script:
`... && npm run data && node tests/derived.js && ...`

**Failure mode.** `tests/derived.js` opens by stating its whole purpose - data
edited, derived files not rebuilt, they diverge silently - and asserts
`disk === make(L)` with the message "run node tools/build.js". `npm run data`
runs immediately before it and rewrites those two files from `data.js`. The
comparison is therefore vacuous: it compares a file to the render that just
produced it. Both CI paths that reach `derived` - `npm run check` at
`ci.yml:33` and `node tests/run-all.js --exclude=app/golden` at `ci.yml:47`,
which runs after `npm run build` - have already regenerated.
`.claude/hooks/edit-followup.mjs:20` tells the author "Run `node tools/build.js`
before committing or tests/derived.js will fail", which is not true of the
command CLAUDE.md requires before every commit.

**How it reaches production.** Edit `data.js`, commit without running
`tools/build.js`, push. CI is green. `main` now carries a `data.json` and a
`catalog.csv` that disagree with `data.js`, and stays that way until somebody
runs the generator for an unrelated reason.

**What a user sees.** Nothing on the site - and that is the important half of
the finding. The `deploy` job runs `npm run build` before Collect
(`ci.yml:178-200`), so the *published* `data.json` and `catalog.csv` are always
regenerated and always correct. The divergence is repository-only: it hits
`docs/specs/CONTRACTS.md`'s generated-data contract, `llms.txt`'s promise that
`catalog.csv` is the thing to read first, anyone consuming the raw files from
the repo, and the vitest suites that read `data.json` off disk under
`npm run test` without building.

**Caught by:** nothing. There is no `git diff --exit-code` anywhere under
`.github/` - the only `git diff` in the tree is `previews.yml:124`, checking
its own staged state.

**Smallest fix.** One step in the `check` job, after `npm run check`:

    - name: The generated files are what data.js renders
      run: git diff --exit-code -- data.json catalog.csv

Naming the two files keeps the untracked, regenerated `i/` out of it.
`npm run check` has just regenerated them, so a non-empty diff means exactly
"the commit's copies were stale" - the assertion `tests/derived.js` was written
to make.

**Effort/value.** One line. Turns a dead assertion and a false hook message
into a live gate.

---

### DP5 - the documented rollback costs 12 minutes; the 40-second one is undocumented, and is also a footgun

**Where:** `ci.yml:129-134`, "HOW TO UNDO A BAD DEPLOY".

**The walk, with numbers from run `35214847899`.** The comment says
`git revert` then push, and "the next run of this job republishes whatever the
tree looks like after the revert, so reverting the offending commit is the
whole procedure". Mechanically that is correct - and it is correct *despite*
`f53f44d`, because the published bytes are regenerated from `data.js` rather
than read from the index, so reverting the commit reverts the generated stubs
with it. Untracking `i/` made nothing about rollback worse. What the comment
omits is the cost:

| | measured on run 35214847899 |
|---|---|
| push to live | 11:16:52 -> 11:29:03 = **12m11s** |
| of which `check` | 11:16:53 -> 11:28:22 = 11m29s |
| the `deploy` job alone | 11:28:27 -> 11:29:04 = **37s** |

So the documented recovery is gated on the full 11.5-minute `check`, and the
site stays wrong for twelve minutes minimum after you decide what to do.

**The undocumented fast path.** Re-running the `deploy` job alone on the last
known-good run reuses the already-green `needs` results and rebuilds that
commit deterministically - 37 seconds. It is the right first move for "the last
deploy was bad, put the previous one back while I write the revert".

**The same fact as a footgun.** Re-running an *old* run's `deploy` job - to
retry a flake, to unstick something - republishes that old tree over a newer
one. The workflow-level concurrency group cannot order it against a push,
because it is a separate run reached from the UI. `check-site.mjs` would pass,
because an old commit is a perfectly valid site. Nothing anywhere warns about
this.

**Caught by:** nothing, in either direction.

**Smallest fix.** Four comment lines in the recovery block: name the re-run
path as the fast rollback with its measured cost, and name the hazard -
"re-running an older run's deploy job publishes that commit; it is a rollback,
never a retry". Confirm the mechanism once by using it before writing it down
as procedure.

**Effort/value.** Comment only. Value is the whole point of having a written
rollback: the difference between a 12-minute outage and a 40-second one.

---

### DP6 - pull-request runs share the `pages` concurrency group

**Where:** `ci.yml:12-15`.

**Failure mode.** The group is set at workflow level and the workflow triggers
on `pull_request` as well as `push`. Every PR run therefore holds `pages`, and
with `cancel-in-progress: false` they queue rather than cancel. Five pushes to
a PR branch serialize five ~12-minute runs, and a push to `main` waits behind
all of them.

**How it reaches production.** Not as a wrong publish - as a delayed one,
including a delayed revert, which is the moment the delay costs most.

**The trade-off, stated because the obvious fix is wrong.** The workflow-level
group is also what guarantees `main` publishes in commit order. Moving
`concurrency` down onto the `deploy` job would fix the latency and introduce
out-of-order publishes: two `main` runs would both reach `deploy`, and if the
newer one's `check` finished first it would publish first and the older one
would overwrite it. The fix has to keep `main` on one group and give everything
else its own:

    concurrency:
      group: ${{ github.event_name == 'push' && github.ref == 'refs/heads/main'
                 && 'pages' || format('ci-{0}', github.ref) }}
      cancel-in-progress: ${{ github.event_name != 'push' }}

**Effort/value.** Three lines. Medium value on a single-maintainer repository -
PR runs are rare - but the failure lands exactly when you are pushing a fix.
Lower priority than DP1-DP4; do it only when `ci.yml` is open anyway.

---

### DP7 - `.nojekyll` is copied, asserted, and never published

**Where:** `ci.yml:199` (Collect) and `ci.yml:219` (the guard), whose comment
reads ".nojekyll is empty by design - its presence is the whole signal."

**Failure mode.** The signal does not reach the site.
`actions/upload-pages-artifact@v4` builds the artifact with
`tar --dereference --hard-dereference --exclude=.git --exclude=.github
--exclude=".[^/]*"` - visible in run `35214847899`'s log - and that last
pattern drops every top-level dotfile. The artifact listing for that run
contains `./LICENSE` and `./assets/app.js` and no `./.nojekyll`. Confirmed
live: `https://artex-x.github.io/daggerheart-loot/.nojekyll` returns **404**
while `og/_share.jpg` and `img/_none.webp` return 200 - underscore-prefixed
files serve, which is the positive proof that Jekyll is not in the path at all.
It cannot be: Pages is on `build_type: workflow` (`ci.yml:150-151`), which
serves the artifact as-is.

**How it reaches production.** It does not. This is the inverse defect - a
guard line that can only ever fail for a reason that does not matter, sitting
in a block whose value is that every line in it means something.

**Smallest fix.** Keep the file (it costs nothing and would matter if Pages
were ever switched back to a branch build) and correct the comment to say so,
or drop both the copy and the assertion. Two lines either way.

**Effort/value.** Low value, near-zero effort. Worth it only because this guard
is now the deploy's primary evidence, and a line that proves nothing dilutes
the rest.

---

### DP8 - the four suites that read `i/` crash rather than explain on a cold clone

**Where:** `tests/dataint.js:181`, `tests/craft.js:85`, `tests/stub.js` (opens
`file://.../i/w3.html`), `tests/derived.js`.

**Failure mode.** `f53f44d` untracked `i/` and documented the new prerequisite
in `README.md`, `README.ru.md` and `docs/specs/COVERAGE.md`, but changed no
test - the commit touched 1100 files and not one of them under `tests/`. On a
fresh clone, `fs.readdirSync(path.join(ROOT, 'i'))` throws ENOENT with no
mention of `node tools/build.js`. CLAUDE.md lists `node tests/run-all.js` as a
focused command, so this is a documented entry point that now fails opaquely
before a build.

**Caught by:** the READMEs, if read first.

**Smallest fix.** Guard the read and reuse the message
`.claude/hooks/edit-guard.mjs:23` already uses - "i/*.html are generated share
stubs. Run `node tools/build.js`." Three lines, or one shared helper across the
four.

**Effort/value.** Low blast radius, near-zero effort, clears a trap `f53f44d`
left behind in its own touched path.

---

### DP9 - `tools/check-site.mjs` has no test

**Where:** `tools/check-site.mjs`; `package.json`'s `check` runs only
`node --check tools/check-site.mjs`.

**Failure mode.** It is the only thing in the repository that reads the live
URL, it runs exactly once per deploy, and `node --check` proves it parses and
nothing more. An assertion that can never fail - a typo'd property, a regex
that matches everything, `ok()` called with a truthy string - is invisible,
because on a healthy site all of them pass either way.

**Mitigating fact, and it is a real one.** `ci.yml:232-265` now duplicates most
of check-site's assertions against `_site` before the upload: the `noindex`
grep, the `assets/app.js` reference, the `div id="app"`, the same
`src="\.?/?app\.js"` regex, the 20000-byte floor, the `window.LOOT` prefix. A
logic bug in check-site is therefore mostly masked by a guard that fails first.
What is *not* duplicated is anything about the live URL: status codes, content
types, and whether the CDN is serving the artifact that was uploaded.

**Smallest fix.** Follow the precedent already in the tree - `npm run check`
runs `node --test tools/tg-preview/lib.test.mjs` and
`node --test tools/artwork/lib.test.mjs`. Extract the assertion list into
`tools/check-site.lib.mjs` taking an injected `fetch`, add
`tools/check-site.test.mjs` driving it with a fake good site and three broken
ones (404 root, tiny bundle, stub without `og:image`).

**Effort/value.** An hour, not three lines. Medium value given the masking
above. Worth queuing behind DP1-DP4, not ahead of them.

## Noticed, not worth it

- **`check-site.mjs` retries a deterministic failure.** `TRIES = 6`,
  `WAIT_MS = 10_000`, and the whole assertion set is retried, so a genuinely
  broken deploy takes ~60 s longer to turn the run red. The retry is what makes
  the CDN race non-flaky and the header comment says so; 60 s against a
  12-minute recovery is noise. Leave it. (Measured: on run `35214847899` the
  step passed on the first try, 1 s after `deploy-pages` returned.)
- **The `cp -r dist/.` warning is right for the wrong reason.**
  `ci.yml:185-189` avoids it because "a symlink is not what should reach the
  artifact". `upload-pages-artifact@v4` tars with
  `--dereference --hard-dereference`, so a symlink that did reach `_site` would
  be followed and its target's bytes uploaded. The explicit list is still
  correct and worth keeping - it is an allowlist for a repository that also
  holds sources and specs, which is the first reason the comment gives. Only
  the second reason is overstated. Not worth an edit on its own.
- **The published set is complete and has nothing extra.** The artifact for
  `35214847899` is `index.html`, `assets/app.js`, `data.js`, `data.json`,
  `catalog.csv`, `llms.txt`, `robots.txt`, `LICENSE`, and `i/ og/ img/ card/`.
  `dist/assets` holds exactly one file - the Svelte build inlines its CSS, so
  there is no separate stylesheet for the guard to miss. Nothing in the
  repository root is a published asset that the collect list omits.
- **`workflow_dispatch` cannot deploy** (`ci.yml:155` requires
  `event_name == 'push'`). Correct as designed; a dispatch would rebuild
  `main`'s tip and help nothing. The re-run path in DP5 is the manual button.
- **A middle commit in a three-push burst never gets a green check.** GitHub
  keeps one pending run per group and cancels the previous pending one, so push
  B is cancelled when push C arrives. The tip always deploys, which is what
  matters; the cost is that a regression introduced in B and masked in C is
  never observed. Inherent to `cancel-in-progress: false`, which is the right
  setting here.
- **A `[skip ci]` commit on `main` produces no deploy.** `previews.yml:125`
  pushes one on every confirmed refresh. Harmless:
  `tools/tg-preview/state.json` is not in the published set, so tip and live
  differ by a file nobody serves. It would matter only if a human used
  `[skip ci]` on a commit touching `data.js`, which no convention here invites.
- **No `404.html`.** Pages serves its own. The app is hash-routed, so the only
  real deep paths are `i/<id>.html`, and a bad id 404ing is correct - verified:
  `/nope.html` returns 404, `/i/q381.html` returns 200.
- **Actions pinned to mutable major tags**, including third-party
  `gitleaks/gitleaks-action@v2` with a `GITHUB_TOKEN`. The workflow-level
  `contents: read` bounds it. SHA-pinning five actions costs more maintenance
  than it buys at this size.
- **`check-site.mjs`'s failure messages are Russian.** Same language-policy
  question as the rest of `tests/` and `tools/`; owned by `critique/hygiene.md`
  and phase-8's language sweep, not a deploy defect. Noted once so it is not
  counted twice.

## Noted, out of scope

- The structural fix behind DP2 and DP9 is to publish the artifact the gates
  actually proved - `check` uploads `dist/`, `deploy` downloads it instead of
  rebuilding - which removes the second build and shortens the rollback. That
  is a release-shape change one day after the last one, and the dispatch fences
  it off. Not now.
- Nothing here argues for a different platform, a staging environment, or a
  release framework. Every finding above is 1-4 lines except DP9.
