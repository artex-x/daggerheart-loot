# Decisions

The register of decisions that outlive the task that made them, each with
the alternatives rejected and the reason. Record a decision only when an
alternative was rejected. Behaviour decisions live in `docs/specs/`; hook,
tooling and host decisions in `.claude/README.md`; everything else is one
file under `docs/decisions/`, listed here newest first. This index is
generated: add or edit a file there (template:
`.claude/templates/decision.template.md`), then run `node
tools/decisions.js`. A citation names a decision by its path, or as
`docs/DECISIONS.md, <date>, "<title>"`; a title never changes. A decision
is superseded in place, both files pointing at each other; nothing is
deleted.

## Index

- 2026-09-26 - [The configured bundle budget is 180 kB until a slimmer account client](decisions/2026-09-26-the-configured-bundle-budget-is-180-kb-until-a-slimmer.md)
- 2026-09-25 - [A blocker fix pass also carries the batch's local nits](decisions/2026-09-25-a-blocker-fix-pass-also-carries-the-batchs.md)
- 2026-09-25 - [A sign-in prompt opens the account page and returns to the action through the redirect record](decisions/2026-09-25-a-sign-in-prompt-opens-the-account-page.md)
- 2026-09-25 - [A static page links the manifest in its head and registers no worker](decisions/2026-09-25-a-static-page-links-the-manifest-in-its.md)
- 2026-09-25 - [Account list writes are optimistic, queued in order, and retried; a refused write re-reads the account](decisions/2026-09-25-account-list-writes-are-optimistic-queued-in-order.md)
- 2026-09-25 - [Agents may write to the test project; production is CI's or the owner's](decisions/2026-09-25-agents-may-write-to-the-test-project-production.md)
- 2026-09-25 - [CI applies the test project's migrations file by file and ignores other branches' versions](decisions/2026-09-25-ci-applies-the-test-projects-migrations-file-by.md)
- 2026-09-25 - [Commit author and attribution are set in `.claude/settings.json`](decisions/2026-09-25-commit-author-and-attribution-are-set-in-claude.md)
- 2026-09-25 - [Count limits are rows read by `effective_limit()`, with per-user overrides](decisions/2026-09-25-count-limits-are-rows-read-by-effective-limit.md)
- 2026-09-25 - [Decisions are one file each under docs/decisions/; the index is generated](decisions/2026-09-25-decisions-are-one-file-each-under-docs-decisions.md)
- 2026-09-25 - [`LEGACY_WRITE_UNTIL` is 2026-10-26; the migration release moves directly after lists](decisions/2026-09-25-legacy-write-until-is-2026-10-26-the.md)
- 2026-09-25 - [Migrations deploy from CI as steps of `e2e` and `deploy`; the database is the applied record](decisions/2026-09-25-migrations-deploy-from-ci-as-steps-of-e2e.md)
- 2026-09-25 - [Production is backed up nightly, encrypted to the owner's key, kept 30 days](decisions/2026-09-25-production-is-backed-up-nightly-encrypted-to-the.md)
- 2026-09-25 - [Share links are made when the Share panel opens; a deleted one stays deleted](decisions/2026-09-25-share-links-are-made-when-the-share-panel.md)
- 2026-09-25 - [The app document links the manifest with a static tag](decisions/2026-09-25-the-app-document-links-the-manifest-with-a.md)
- 2026-09-25 - [The browser suites' signed-out states draw the sign-in prompt, and the goldens capture it](decisions/2026-09-25-the-browser-suites-signed-out-states-draw-the.md)
- 2026-09-25 - [The hosted E2E runs `cloud.contract.ts` under Node's own type stripping](decisions/2026-09-25-the-hosted-e2e-runs-cloud-contract-ts-under.md)
- 2026-09-25 - [The orchestrator merges a release branch onto `main`; the owner keeps the dashboard steps](decisions/2026-09-25-the-orchestrator-merges-a-release-branch-onto-main.md)
- 2026-09-25 - [The production connection string lives in an Environment limited to `main`](decisions/2026-09-25-the-production-connection-string-lives-in-an-environment.md)
- 2026-09-25 - [The restore-from-link field leaves the lists index with the account lists](decisions/2026-09-25-the-restore-from-link-field-leaves-the-lists.md)
- 2026-09-25 - [The reversibility base check walks forward from one reset; `check:db` resets three times, whatever the migration count](decisions/2026-09-25-the-reversibility-base-check-walks-forward-from-one.md)
- 2026-09-24 - [A cloud release pushes after every green commit; the owner squash-merges it](decisions/2026-09-24-a-cloud-release-pushes-after-every-green-commit.md)
- 2026-09-24 - [A cloud session runs a whole release on its own task branch](decisions/2026-09-24-a-cloud-session-runs-a-whole-release-on.md) - superseded
- 2026-09-24 - [A drag keeps its cached midpoints when another tab rewrites the list](decisions/2026-09-24-a-drag-keeps-its-cached-midpoints-when-another.md)
- 2026-09-24 - [A drag whose own row leaves the list is void](decisions/2026-09-24-a-drag-whose-own-row-leaves-the-list.md)
- 2026-09-24 - [A secondary weapon's stat line names its damage type, not its class](decisions/2026-09-24-a-secondary-weapons-stat-line-names-its-damage.md) - superseded
- 2026-09-24 - [Account preferences drop the default money mode; the print layout persists for everyone](decisions/2026-09-24-account-preferences-drop-the-default-money-mode-the.md)
- 2026-09-24 - [An undo toast takes focus; a plain toast never does](decisions/2026-09-24-an-undo-toast-takes-focus-a-plain-toast.md)
- 2026-09-24 - [`data.js` in git is the only catalog authority](decisions/2026-09-24-data-js-in-git-is-the-only-catalog.md)
- 2026-09-24 - [Every weapon's stat line names its class, secondary weapons too](decisions/2026-09-24-every-weapons-stat-line-names-its-class-secondary.md)
- 2026-09-24 - [Kept defects live in `docs/specs/DEBT.md`, grouped by the task that owes them](decisions/2026-09-24-kept-defects-live-in-docs-specs-debt-md.md)
- 2026-09-24 - [Only a signed-in user creates a list, from the lists release on](decisions/2026-09-24-only-a-signed-in-user-creates-a-list.md)
- 2026-09-24 - [Outside the drop zone a list drag is refused explicitly](decisions/2026-09-24-outside-the-drop-zone-a-list-drag-is.md)
- 2026-09-24 - [Per-user UI preferences persist in the account, account wins](decisions/2026-09-24-per-user-ui-preferences-persist-in-the-account.md) - superseded in part
- 2026-09-24 - [Realtime ships in v1, directly after lists, over polling](decisions/2026-09-24-realtime-ships-in-v1-directly-after-lists-over.md)
- 2026-09-24 - [Repository layout: no asset-home merge, no test colocation, `pages/src/` stays](decisions/2026-09-24-repository-layout-no-asset-home-merge-no-test.md)
- 2026-09-24 - [Running from a folder and offline use are nice-to-haves](decisions/2026-09-24-running-from-a-folder-and-offline-use-are.md)
- 2026-09-24 - [Supabase configuration is code; the dashboard is read-only; no Branching](decisions/2026-09-24-supabase-configuration-is-code-the-dashboard-is-read.md)
- 2026-09-24 - [The account client loads after first paint; a provider redirect settles before mount](decisions/2026-09-24-the-account-client-loads-after-first-paint-a.md)
- 2026-09-24 - [The account is a route, `#/account`, with provider linking](decisions/2026-09-24-the-account-is-a-route-account-with-provider.md)
- 2026-09-24 - [The browser suites drive a test build with a deterministic fake cloud](decisions/2026-09-24-the-browser-suites-drive-a-test-build-with.md)
- 2026-09-24 - [The guards judge PowerShell tool commands as well as Bash](decisions/2026-09-24-the-guards-judge-powershell-tool-commands-as-well.md)
- 2026-09-24 - [The hosted E2E mints its session with the secret key, not a password](decisions/2026-09-24-the-hosted-e2e-mints-its-session-with-the.md) - superseded
- 2026-09-24 - [The hosted E2E reads its credentials from the environment; no proxy credential](decisions/2026-09-24-the-hosted-e2e-reads-its-credentials-from-the.md)
- 2026-09-24 - [The `#/l/` link decoder retires at the legacy write cutoff](decisions/2026-09-24-the-l-link-decoder-retires-at-the-legacy.md)
- 2026-09-24 - [The laws of no backend and of `file://` are superseded](decisions/2026-09-24-the-laws-of-no-backend-and-of-file.md)
- 2026-09-24 - [The persistence programme ships one task per release](decisions/2026-09-24-the-persistence-programme-ships-one-task-per-release.md)
- 2026-09-24 - [The print card frame follows the weapon's class](decisions/2026-09-24-the-print-card-frame-follows-the-weapons-class.md)
- 2026-09-24 - [While the record dialog is open, the toast is drawn inside it](decisions/2026-09-24-while-the-record-dialog-is-open-the-toast.md)
- 2026-09-23 - [A book condition is folded in as a line under the book's name](decisions/2026-09-23-a-book-condition-is-folded-in-as-a.md)
- 2026-09-23 - [A feature an item grants an adversary is a referenced card](decisions/2026-09-23-a-feature-an-item-grants-an-adversary-is.md)
- 2026-09-23 - [A list entry's price is the price of one unit; a selection's total is summed in coins](decisions/2026-09-23-a-list-entrys-price-is-the-price-of.md)
- 2026-09-23 - [A picture miss is answered before it is stored; an offline thumbnail miss takes the cached full picture](decisions/2026-09-23-a-picture-miss-is-answered-before-it-is.md) - superseded in part
- 2026-09-23 - [A selection on a list page carries a taken count per entry, in memory, defaulting to the whole stock](decisions/2026-09-23-a-selection-on-a-list-page-carries-a.md)
- 2026-09-23 - [A site page links back to the screen the reader came from](decisions/2026-09-23-a-site-page-links-back-to-the-screen.md) - superseded in part
- 2026-09-23 - [A take line inside the ticked row; the summary names entries and pieces; the shared print and copied prices carry the count](decisions/2026-09-23-a-take-line-inside-the-ticked-row-the.md)
- 2026-09-23 - [Artifact equipment: `eq.tier: 'A'`, printed as a loot artifact card](decisions/2026-09-23-artifact-equipment-eq-tier-a-printed-as-a.md)
- 2026-09-23 - [Many lists: a name filter on the index, a pinned search and create control in the menu](decisions/2026-09-23-many-lists-a-name-filter-on-the-index.md)
- 2026-09-23 - [Many lists: the index shows 24 cards at a time; a record's own lists lead its menu](decisions/2026-09-23-many-lists-the-index-shows-24-cards-at.md)
- 2026-09-23 - [Navigations take the navigation preload response](decisions/2026-09-23-navigations-take-the-navigation-preload-response.md) - superseded
- 2026-09-23 - [One plural() over Intl.PluralRules counts every number beside a word](decisions/2026-09-23-one-plural-over-intl-pluralrules-counts-every-number.md)
- 2026-09-23 - [Per-language previews: `i/en/<id>.html` and `en/`, seeded into the refresher's state; site cards rendered from one template; a static page is a page per language](decisions/2026-09-23-per-language-previews-i-en-id-html-and.md)
- 2026-09-23 - [Pictures revalidate on every cache hit; an unchanged ETag writes nothing](decisions/2026-09-23-pictures-revalidate-on-every-cache-hit-an-unchanged.md)
- 2026-09-23 - [Print card small text keeps the ribbon and gets one paper floor in every view](decisions/2026-09-23-print-card-small-text-keeps-the-ribbon-and.md)
- 2026-09-23 - [PWA registration is a boot concern in `main.ts` behind `PwaPort`](decisions/2026-09-23-pwa-registration-is-a-boot-concern-in-main.md) - superseded in part
- 2026-09-23 - [Row-sized art draws a committed 160 px `img/thumb/` derivative](decisions/2026-09-23-row-sized-art-draws-a-committed-160-px.md)
- 2026-09-23 - [Site pages are generated static files under `pages/`, linked from a footer nav row](decisions/2026-09-23-site-pages-are-generated-static-files-under-pages.md) - superseded in part
- 2026-09-23 - [The black-and-white card grows its rules text to a cap under the name](decisions/2026-09-23-the-black-and-white-card-grows-its-rules.md)
- 2026-09-23 - [The compact sheet is an independent size switch for both print layouts, kept in session memory](decisions/2026-09-23-the-compact-sheet-is-an-independent-size-switch.md)
- 2026-09-23 - [The install link is drawn only where it can be used](decisions/2026-09-23-the-install-link-is-drawn-only-where-it.md) - superseded in part
- 2026-09-23 - [The installed app asks for persistent storage](decisions/2026-09-23-the-installed-app-asks-for-persistent-storage.md)
- 2026-09-23 - [The list store is raw state; an unchanged stored value is not parsed again](decisions/2026-09-23-the-list-store-is-raw-state-an-unchanged.md)
- 2026-09-23 - [The second set: Saint's Ensemble, a loadout bonus, still no set filter](decisions/2026-09-23-the-second-set-saints-ensemble-a-loadout-bonus.md)
- 2026-09-23 - [The service worker is a hand-written `app/public/sw.js`](decisions/2026-09-23-the-service-worker-is-a-hand-written-app.md) - superseded in part
- 2026-09-23 - [The shell is network first with a cache fallback; updates are silent](decisions/2026-09-23-the-shell-is-network-first-with-a-cache.md) - superseded
- 2026-09-23 - [The taken count sits in a strip under a ticked row; the total sits beside the selected count](decisions/2026-09-23-the-taken-count-sits-in-a-strip-under.md) - superseded
- 2026-09-23 - [The total rides in a selection's copied text, not in a whole list's](decisions/2026-09-23-the-total-rides-in-a-selections-copied-text.md)
- 2026-09-23 - [Thumbnails get their own worker cache, capped above the whole set](decisions/2026-09-23-thumbnails-get-their-own-worker-cache-capped-above.md) - superseded in part
- 2026-09-23 - [Vault of Ages Volume 4: the Russian names the draft guessed](decisions/2026-09-23-vault-of-ages-volume-4-the-russian-names.md)
- 2026-09-23 - [Vault of Ages Volume 4: the source errata policy](decisions/2026-09-23-vault-of-ages-volume-4-the-source-errata.md)
- 2026-09-22 - [A feature that swaps a weapon's stat set gets the Versatile second strip](decisions/2026-09-22-a-feature-that-swaps-a-weapons-stat-set.md)
- 2026-09-22 - [Russian record text: metric distances, the site's lowercase terms, granted adversary features folded in](decisions/2026-09-22-russian-record-text-metric-distances-the-sites-lowercase.md) - superseded in part
- 2026-09-22 - [The print address carries a list's count as `*<n>` per id](decisions/2026-09-22-the-print-address-carries-a-lists-count-as.md)
- 2026-09-22 - [The shared page's top control saves a copy; the selection bar alone adds to a list](decisions/2026-09-22-the-shared-pages-top-control-saves-a-copy.md)
- 2026-09-19 - [A drop indicator redraws on a row's own note box when one is open](decisions/2026-09-19-a-drop-indicator-redraws-on-a-rows-own.md)
- 2026-09-19 - [A list drag resolves to a gap, from the document, not to a row](decisions/2026-09-19-a-list-drag-resolves-to-a-gap-from.md)
- 2026-09-19 - [A reorder is announced through a permanently mounted live region, not the shared toast](decisions/2026-09-19-a-reorder-is-announced-through-a-permanently-mounted.md)
- 2026-09-19 - [Both sides of the gap light, and a cancelled drag is shown, not worded](decisions/2026-09-19-both-sides-of-the-gap-light-and-a.md)
- 2026-09-19 - [Draft fields `page`, `lore_*`, `gm_note_*`, `state`, `trait_original`, `burden_options`](decisions/2026-09-19-draft-fields-page-lore-gm-note-state-trait.md)
- 2026-09-19 - [Dragon's Vault art: 145 files, every record arted, one asset per Frostwyrd rung](decisions/2026-09-19-dragons-vault-art-145-files-every-record-arted.md)
- 2026-09-19 - [Dragon's Vault refs: four cards and two adversaries fetched, rules excluded](decisions/2026-09-19-dragons-vault-refs-four-cards-and-two-adversaries.md)
- 2026-09-19 - [Dragon's Vault: source `dv`, table `dv`, section `roll/dv`, ids `dv`/`dve`, one roll over all 145 records](decisions/2026-09-19-dragons-vault-source-dv-table-dv-section-roll.md)
- 2026-09-19 - [Dragon's Vault: the detailed entries win over the overview tables](decisions/2026-09-19-dragons-vault-the-detailed-entries-win-over-the.md)
- 2026-09-19 - [Frostwyrd is a two-step craft chain; every upgrade line stays at four tiers](decisions/2026-09-19-frostwyrd-is-a-two-step-craft-chain-every.md)
- 2026-09-19 - [Gryphon Hammer `bu: 'any'`; the Spellblade carries its summoned stats](decisions/2026-09-19-gryphon-hammer-bu-any-the-spellblade-carries-its.md)
- 2026-09-19 - [Set membership: a named set on the record, members derived, a shared bonus on every member, no filter](decisions/2026-09-19-set-membership-a-named-set-on-the-record.md)
- 2026-09-19 - [Text normalisation for an ingest, and its guard](decisions/2026-09-19-text-normalisation-for-an-ingest-and-its-guard.md)
- 2026-09-19 - [The drag grip is hidden by an `any-hover`/`any-pointer` capability query, not `hover`/`pointer`](decisions/2026-09-19-the-drag-grip-is-hidden-by-an-any.md)
- 2026-09-19 - [The drop-gap mark is made instant by narrowing `.row`'s transition, not by overriding the drop classes](decisions/2026-09-19-the-drop-gap-mark-is-made-instant-by.md)
- 2026-09-19 - [The product link lives in the roll tab's help box](decisions/2026-09-19-the-product-link-lives-in-the-roll-tabs.md)
- 2026-09-18 - [A batch whose whole scope is other reviews' findings runs with no reviewer](decisions/2026-09-18-a-batch-whose-whole-scope-is-other-reviews.md)
- 2026-09-18 - [`data.json`/`catalog.csv` staying tracked was not solved by a pretest step](decisions/2026-09-18-data-json-catalog-csv-staying-tracked-was-not.md)
- 2026-09-18 - [Decisions live in one `docs/DECISIONS.md`, not a `docs/decisions/` folder](decisions/2026-09-18-decisions-live-in-one-docs-decisions-md-not.md) - superseded
- 2026-09-18 - [Durable knowledge is written to its home the batch that makes it, never parked](decisions/2026-09-18-durable-knowledge-is-written-to-its-home-the.md)
- 2026-09-18 - [One commit per task, amend freely, push once - replaces the per-batch push rule](decisions/2026-09-18-one-commit-per-task-amend-freely-push-once.md) - superseded
- 2026-09-18 - [One commit per task, amended per batch, pushed once at closeout](decisions/2026-09-18-one-commit-per-task-amended-per-batch-pushed.md)
- 2026-09-18 - [Retire scope: audit every shipped directory, then delete - never a blind delete](decisions/2026-09-18-retire-scope-audit-every-shipped-directory-then-delete.md)
- 2026-09-18 - [Rule 2i generalised from a plan.md file to any task directory](decisions/2026-09-18-rule-2i-generalised-from-a-plan-md-file.md)
- 2026-09-18 - [Share stubs (`i/`) and artwork (`img/`, `og/`) stay tracked root folders](decisions/2026-09-18-share-stubs-i-and-artwork-img-og-stay.md) - superseded in part
- 2026-09-18 - [Task documents stay tracked; closeout deletes them, never pushed](decisions/2026-09-18-task-documents-stay-tracked-closeout-deletes-them-never.md)
- 2026-09-18 - [The comment standard lives in `CLAUDE.md`, enforced by review and rule 2i, no new hook yet](decisions/2026-09-18-the-comment-standard-lives-in-claude-md-enforced.md)
- 2026-09-18 - [The issue 47 task directory is audited and retired in this task](decisions/2026-09-18-the-issue-47-task-directory-is-audited-and.md)
- 2026-09-18 - [The push-force guard denies every force form, not just a bare `--force`](decisions/2026-09-18-the-push-force-guard-denies-every-force-form.md)
- 2026-09-18 - [The task-document size budget and compaction stay; retirement becomes primary](decisions/2026-09-18-the-task-document-size-budget-and-compaction-stay.md)
- 2026-09-18 - [Write the comment standard and sweep the whole repository to match it now](decisions/2026-09-18-write-the-comment-standard-and-sweep-the-whole.md)
- 2026-09-17 - [Nits are processed immediately, per batch, not deferred to a terminal pass](decisions/2026-09-17-nits-are-processed-immediately-per-batch-not-deferred.md)
- 2026-09-17 - [Rejected UI/architecture options from the phase-8 review, recorded once](decisions/2026-09-17-rejected-ui-architecture-options-from-the-phase-8.md) - superseded in part
- 2026-09-17 - [The R0c sweep ran as a read-only reviewer-role dispatch, not an implementer step](decisions/2026-09-17-the-r0c-sweep-ran-as-a-read-only.md)
- 2026-09-16 - [Playwright: not now](decisions/2026-09-16-playwright-not-now.md)
