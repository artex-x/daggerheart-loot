# Decisions

The register of decisions that outlive the task that made them, each with
the alternatives rejected and the reason. Behaviour decisions live in
`docs/specs/`; hook and tooling decisions in `.claude/README.md`,
"Candidates considered"; everything else lands here. Newest first. An entry
is superseded in place with a `Superseded by` line, never deleted; an entry
is at most fifteen lines; a superseded entry folds to its first line.

Within one task, entries run in the order the task settled them, oldest
first. The fifteen-line cap counts body lines only - the `##` heading and
the blank lines around it are free. Past ~400 lines, fold every superseded
entry to its first line before adding another.

## 2026-09-22 - The print address carries a list's count as `*<n>` per id

- Task: `67`, human decision (find it with `git log --grep="Task: 67"`).
- Decision: `#/print/<id>[*<n>]-...`. A count over 1 is drawn after the
  card's name as ` ×N`, clamped to 99; anything else draws no counter. `*<n>`
  is the list link's own `id*qty` spelling, so one spelling means "quantity"
  in both public formats. Only the list page's print button writes it.
- Rejected: the count from memory (the open list) - lost on reload and on
  the copied set link, against `ROUTES.md`'s reason for reading print from
  the address; a repeated id as a count (`ci1-ci1-ci1`) - changes addresses
  already shared, where a repeat is dropped, and 99 is 99 ids; `.` as the
  separator (`ci1.3`) - a second spelling for "quantity"; `x` or `_` - ids
  already hold both; a list-payload print route - a second print grammar for
  one number per card; N printed copies - not what the issue asks for.
- Accepted trade-off: whether a chat client mangles `*` in a pasted URL
  (emphasis, or `%2A`) is unmeasured; such an address falls to the home
  section, as any unreadable address does. The card name cap became three
  lines, not a shrink step: Russian names already print at three.

## 2026-09-22 - The shared page's top control saves a copy; the selection bar alone adds to a list

- Task: `58`.
- Decision: the shared list page's top control is a plain gold "Сохранить
  себе" / "Save to my lists" button, no caret, always drawn whatever the
  selection. One press creates a new own list from the whole shared list -
  ids, both notes, entry meta and money mode - and opens it. Pouring the
  list into an existing list stays possible as select-all plus the
  selection bar's "Добавить в список" chip, now the only add-to-list menu.
- Rejected: relabelling the menu "Сохранить список" / "Save list", caret
  kept - two gold caret buttons with near-identical menus still read alike;
  hiding the top control while a selection exists - it would jump under the
  reader's thumb and keep the bar's own label while shown. Labels
  "Сохранить копию" / "Save a copy" - the bar already holds "Скопировать"; and
  "Клонировать список" / "Clone list" - developer jargon in Russian UI.
- Evidence: issue 58's screenshot, two identical gold "+ Добавить в список"
  buttons on screen at once with rows ticked.

## 2026-09-22 - Russian record text: metric distances, the site's lowercase terms, granted adversary features folded in

- Task: `dragons-vault` (human review of the built app).
- Decision: distances in `ru`/`rud` are rounded metric, as Core, Hope &
  Fear and Vault of Ages already print them (dv39, w36, w56 were the three
  left). Mid-sentence `состояние`, `преимущество`, `помеха`, `активация`,
  `свойство`, `карта`, `домен` are lowercase, as daggerheart.su and the
  rest of the catalogue write them; text that repeats the site verbatim
  keeps the site's casing (q124, q328). A feature an item grants an
  adversary (Nightshroud's Slow) is folded in as its own line under the
  site's name, the GM as the actor. Rules: `docs/specs/I18N.md`.
- Rejected: one casing rule for every term (the site itself is mixed on
  «бросок», «атака», «урон», «реакция» - measured 2026-09-22); re-casing
  site-verbatim text; a ref for Slow (a feature has no page; the Ooze's
  whole block would bury it); rewording the English (it stays the book's).

## 2026-09-22 - A feature that swaps a weapon's stat set gets the Versatile second strip

- Task: `dragons-vault` (human review).
- Decision: `eq.alt` holds any second stat set a weapon's own feature
  switches to, not only Versatile's: Ember's Fan the Flames (Agility, Very
  Close, d12+5 mag) and the Steampowered Gauntlets' Supercharge (Strength,
  Melee, d12+4 phy; the -1 Evasion and the Stress to move stay in the
  text). The print card draws it as the second strip. The text stays as
  the book prints it: `eq.alt` is stored data, nothing parses the text at
  render time. `tests/derived.js` names every non-Versatile record that
  carries one.
- Rejected: rewording Ember as "Versatile" (a paid swap is not a free
  choice, and `Универсальное` stays reserved for Versatile); a render-time
  parser; the Spellblade (its summoned stats are its main stats, above).

## 2026-09-19 - Dragon's Vault: source `dv`, table `dv`, section `roll/dv`, ids `dv`/`dve`, one roll over all 145 records

- Task: `dragons-vault` (equipment joined the roll at the human's review,
  2026-09-22).
- Decision: source key `dv`, table id `dv`, section `roll/dv`, loot ids
  `dv1`-`dv77` in the order the detailed entries print (pp. 30-47),
  equipment ids `dve1`-`dve68` in page order (pp. 9-27), Frostwyrd as three
  records. All 145 live in `items.dv` on the Wondrous and Dread model: a
  piece of equipment keeps its stat block, rolls on its book's table and
  still appears in the equipment tables. `roll` is the id's number for loot
  and 77 + the number for equipment ("Random 1-145"). The book has no random
  table by design (p. 29); the help box says so.
- Rejected: `dragons_vault` as the key (every table id here is one short
  word, `voa` the precedent); equipment first, in page order (moves every
  loot roll off its id number for a table the book never prints); a `roll`
  on records left in `eq` (a second mechanism for what `items` already
  does); no roll tab (the help box is the only surface for a source link).

## 2026-09-19 - Dragon's Vault: the detailed entries win over the overview tables

- Task: `dragons-vault`.
- Decision: where pp. 7-8 disagree with an entry (twelve cases, the
  contributor's `dragons_vault_source_issues.md`, each re-read on the PDF
  page), the record carries the entry. `eq.cls` comes from the table's TYPE
  column where the entry prints no class: Nature's Fall and Restless
  Vengeance are Physical with magical damage, Rod of Flaming Skulls Magic.
- Rejected: the tables (the entry is the card a player reads, and its text
  and its stat line are printed together); a per-case pick (Frostwyrd
  Exalted is the one case where the table's `d10+13` is more plausible
  than the entry's `d10+10`, equal to Awakened - a one-off pick makes the
  rule unstatable, so the entry stays and the doubt is recorded here for
  the author's errata).

## 2026-09-19 - Frostwyrd is a two-step craft chain; every upgrade line stays at four tiers

- Task: `dragons-vault` (was a three-rung `eq.line` until 2026-09-22).
- Decision: `craft: 'dve25'` on Dormant and `craft: 'dve26'` on Awakened,
  no `line`; the card reads "Upgrades to" / "Made from" and keeps the
  "Unique" badge. Each rung keeps the lower rungs' features in its own text
  (the book: a rung retains them), so a copied rung's "Upgrades to" block
  carries only the target's lines the rung lacks. `craft` means "upgrades
  to", so a chain of named items fits it; `line` stays the four-tier
  ladder, and `tests/dataint.js` keeps every line at tiers `1,2,3,4` (58).
- Rejected: a three-rung `line` with a relaxed invariant (it cost the
  "Unique" badge); the draft's `upgrade_line` field (nothing renders it);
  three unlinked one-offs (the book prints one weapon that "improves to a
  new tier"); the target's full text in a copy (repeats two of three
  lines); a "Made from" block in a copy (a copy is for players, forward only).

## 2026-09-19 - Gryphon Hammer `bu: 'any'`; the Spellblade carries its summoned stats

- Task: `dragons-vault` (Spellblade and print mark: reviews of 2026-09-22).
- Decision: `Equip.bu` gains `'any'` ("Одноручное/двуручное" /
  "One/Two-Handed"); the burden facet matches it under `1` and `2`; the
  print card draws the one-handed mark with `1/2` as its caption. The
  Spellblade carries the stats the book gives it once summoned: `tr:
  'spellcast'` ("Характеристика Заклинателя" / "Spellcast"), Melee,
  `d10+4`; its trait facet answers all six traits. The print card's trait
  cell reads «Хар. Заклинателя»: the full term does not fit the cell
  (measured 2026-09-23). A trait chip is drawn only where a record of that
  kind answers it, so no `spellcast` chip exists.
- Rejected: two stacked grip marks (no exported vector for the pair,
  `CLAUDE.md` "Export vectors"; `tests/app/print.js` pins one mark per
  card); `bu: 1` plus `burden_options` (nothing reads it); the book's
  printed `Special` trait and `d0` (every surface showed a weapon nobody
  can attack with); a trait chip that selects one record.

## 2026-09-19 - Draft fields `page`, `lore_*`, `gm_note_*`, `state`, `trait_original`, `burden_options`

- Task: `dragons-vault`.
- Decision: `page`, `state`, `trait_original` and `burden_options` are
  dropped (the name and the schema carry their content). `lore_en`/
  `lore_ru` (144 records, ~85 KB) are dropped: no shipped source carries
  flavour text, nothing renders it, and `data.js` is 149 KB gzip on first
  load (`docs/specs/META.md` section 4); adding it later is additive.
  The Chalice of Chaos box (`gm_note_*`, p. 33) is folded verbatim into
  `ende`/`rud` as a final line: it is rules text printed beside the item.
  Frostwyrd's Vestige sidebar (p. 14) is dropped: the book explains
  Vestiges, and three cards repeated it (human review, 2026-09-22).
- Rejected: a folded "Lore" block on the card (a new surface with its own
  dictionary, goldens and print decision, for text the book itself says a
  GM may ignore); keeping the fields in `data.js` unrendered (`CLAUDE.md`:
  add no export before something uses it).

## 2026-09-19 - Dragon's Vault refs: four cards and two adversaries fetched, rules excluded

- Task: `dragons-vault` (adversaries added at the human's review,
  2026-09-22).
- Decision: `refs` gains `pack-predator` (dv71, beastform),
  `elemental-breath` (dv26, Drakona ancestry feature), `vampire` (dve38,
  transformation card), `enrapture` (dve59, Grace spell), and the adversary
  stat blocks `huge-green-ooze` (dv14 turns a character into one) and
  `shambling-zombie` (dv66 raises them), each fetched from
  `ru.`/`en.daggerheart.su` in the `RefCard` shape; a stat block is lines
  of text there, as a beastform's is. No existing ref is reused.
- Rejected: death moves and class features (Risk It All, Blaze of Glory,
  Rally Die - core rules the site does not carry; `llms.txt` sends rules
  questions to the SRD); Counterspell (dv1 names it but does not depend on
  its text).
- Evidence: "Dragon's Breath", named at dispatch, appears in no Dragon's
  Vault text; the nearest is Drakona's "Elemental Breath" on dv26.

## 2026-09-19 - The product link lives in the roll tab's help box

- Task: `dragons-vault`.
- Decision: `https://www.drivethrurpg.com/en/product/581246/the-dragon-s-vault`
  is a link in `help.ts`'s Dragon's Vault box, the surface every shipped
  source uses, and a row in both README source tables.
- Rejected: a hover tooltip on the source badge (`Badge` takes a `title`,
  but a `title` cannot hold a link and never shows on touch; a link the
  reader cannot follow is a citation, not a source - `help.test.ts`).

## 2026-09-19 - Text normalisation for an ingest, and its guard

- Task: `dragons-vault`.
- Decision: in `en`/`ende`/`ru`/`rud`, U+2018/U+2019 become `'`;
  U+201C/U+201D become `"` in English and `«»` in Russian; U+2014, U+2212
  and `«»` stay as the catalogue already carries them (33, 57 and 18
  records). `tests/dataint.js`'s apostrophe guard widens to the four
  quotation marks. Dropped fields are not normalised.
- Rejected: normalising to U+2019 (the other way DEBT D41 offered; the
  catalogue is already ASCII, so D41 was stale and is deleted); ASCII for
  the dash, the minus and the Russian quotes (search folds U+2212 and the
  shipped data carries all three).

## 2026-09-19 - Dragon's Vault art: 145 files, every record arted, one asset per Frostwyrd rung

- Task: `dragons-vault`.
- Decision: the drop is the ledger (`docs/artwork.md`'s three
  preconditions hold: every name resolves to one record, no duplicate
  bytes, all 1254x1254). The human refilled the art drop twice mid-batch;
  the shipped state is 145 files for 145 records, none with `img: ''`.
  Frostwyrd's rungs each take their own asset: the drop delivers three
  distinct renders.
- Rejected: leaving any record out until art arrives (a record may ship
  without art and renders `_none.webp`); any hand conversion.

## 2026-09-19 - Set membership: a named set on the record, members derived, a shared bonus on every member, no filter

- Task: `dragons-vault` (human decisions: structured and designed for N
  members; the bonus first-class at the review of 2026-09-22).
- Decision: `Record_.set?: string` names a record's set (`ember-spark` on
  dve19 and dve20); members are grouped at load (`buildIndex`), never
  stored. The card lists every member in catalogue order, the record itself
  inert: `Комплект: Уголёк, Искра` / `Set: Ember, Spark`. A set's bonus is
  `LOOT.sets[key]` (`en`, `ru` name; `ende`, `rud` text), drawn under that
  line on every member, carried in copied text, share stubs and
  `catalog.csv`, and printed as the last text line, `<name> (<Set>:
  <members>): <text>`. Listing all members needs no Russian case agreement.
- Rejected: the bonus in one member's text (the book's layout; it left
  Ember's holder blind); a copy in each member (two texts to keep equal); a
  stored sibling list; indexing the bonus for search (refs and craft
  targets are not indexed either); a `set` filter group or set page until a
  second source brings sets.

## 2026-09-19 - A reorder is announced through a permanently mounted live region, not the shared toast

- Task: `dnd4` (find the commit with `git log --grep=dnd4`).
- Decision: `ListPage.svelte` always mounts an empty `<div class="lsaid"
  role="status" aria-live="polite">` beside `.lrows`. Both movers (`setPos`,
  the drag port's `onDrop`) fill it only when `store.move()` returns true, so
  a no-op move stays silent. The strings name the record and its position
  (`%s`, `%n`, `%m`) with no participle, which would have to agree with the
  record's gender (`docs/specs/I18N.md`, "Rules").
- Rejected: the toast (`app.say`) - its one shared slot drops a pending undo
  prompt; a region mounted only while it holds text - the unreliable half of
  the pattern, and blind to the goldens; a region in `Shell` - adds a node to
  all 110 goldens for one page; announcing a rejected typed position - a
  rejected entry is not a reorder.
- Evidence: `page.accessibility.snapshot()` keeps an empty `role="status"` as
  `status ""`, so the mount re-seeds every list-page golden.

## 2026-09-19 - The drop-gap mark is made instant by narrowing `.row`'s transition, not by overriding the drop classes

- Task: `dnd4` (find the commit with `git log --grep=dnd4`).
- Decision: `.row`'s `transition: 0.15s` (which includes the mark's
  `box-shadow`) is narrowed to `border-color 0.15s, opacity 0.15s`, keeping
  the hover border and the dragged row's fade. `.rnote`'s own `transition:
  box-shadow 0.15s` (TASK `dnd3`) is deleted, or its half of the mark would
  fade alone. `dnd3` wrote no entry here, so nothing is superseded.
- Rejected: `transition-duration: 0s` on `.lrow.drop-before`/`.drop-after` -
  a transition uses the style it moves *to*, so the mark would still fade on
  exit.
- Evidence: `dist/` before the fix: `.lrow` `transitionProperty: 'all'`,
  `.rnote` `'box-shadow'` at `'0.15s'`; after: `.lrow` `'border-color,
  opacity'`, `.rnote` `'all'` at `'0s'`, the CSS initial value. A property
  read cannot tell that apart from `.row`'s old shorthand, so
  `tests/app/states.js` case 17 reads `.rnote`'s duration.

## 2026-09-19 - The drag grip is hidden by an `any-hover`/`any-pointer` capability query, not `hover`/`pointer`

- Task: `dnd4` (find the commit with `git log --grep=dnd4`).
- Decision: `@media (any-hover: none) and (any-pointer: coarse)` hides
  `.lrow-grip` in `ListPage.svelte`. HTML5 drag never starts from a touch,
  so the grip is inert where no pointer can hover or point finely. A
  touchscreen laptop or a tablet with a mouse keeps the grip.
- Rejected: `(hover: none)` or `(pointer: coarse)` - they describe only the
  primary input and hide the grip from a working mouse; a script feature
  test - `'draggable'` and `'ontouchstart'` both lie, and the check would
  leave `app/src/ports/`; a width query - width does not predict touch.
- Evidence: `page.emulateMediaFeatures` refuses `hover`/`pointer`; only
  `page.setViewport({ isMobile: true, hasTouch: true })` moves
  `any-hover`/`any-pointer` (`docs/specs/COVERAGE.md`, "app/states - two
  harness facts a device-capability case runs into").

## 2026-09-19 - A drop indicator redraws on a row's own note box when one is open

- Task: `dnd2` (find the commit with `git log --grep=dnd2`).
- Decision: an open note box (`.rnote`, `flex: 0 0 100%`) is a row's own
  last child, and covered `.lrow.drop-after`'s inset box-shadow, which
  paints below its element's children. `.lrow.drop-after .rnote` redraws
  the identical inset on the note; both rules paint when the note is
  open, but `.row`'s own bar is occluded, not absent. A doubled 6px bar
  is avoided only because `.row` carries no bottom padding, so `.rnote`'s
  border box lands on exactly the 3px the base rule draws into - add
  `padding-bottom` to `.lrow` and the mark splits into two lines.
- Rejected: an absolutely positioned `::after` bar - immune to a future
  opaque child, but needs `position: relative` on `.lrow`, a larger blast
  radius than the defect earns; a transparent `.rnote`, trading a visible
  defect for a visible redesign of a surface (`--bg2`) meant to read apart.
- Evidence: measured against `dist/` - a marked row's bottom 200x3 px strip
  read 0/600 gold pixels noted, 400/600 closed, list end and middle alike.

## 2026-09-19 - A list drag resolves to a gap, from the document, not to a row

- Task: `dnd` (find the commit with `git log --grep=dnd`).
- Decision: `nativeDrag` resolves the pointer to a gap index - the number of
  rows above the landing place - from the capturing document `dragover` it
  already binds for edge-scroll, against row midpoints cached at `dragstart`
  in document coordinates. The drop zone is the rows box grown by one
  measured row gap above the first row and below the last. There is no
  horizontal test, so the zone is a band. `drop` moves to the same document
  listener, so every position the highlight promises also accepts a release.
- Rejected: keeping the row-level `dragover` and widening what counts as a
  hit (the 8px `.rows` gap is not a row, so the early return that is the
  defect survives in some form); recomputing row rectangles on every
  `dragover` (a forced layout per frame, and rows cannot move during a
  drag); a horizontal bound on the zone (a person aiming between rows drifts
  vertically, and nothing sits beside the rows on this page).
- Evidence: the comment above `onDocOver` already recorded that the pointer
  spends most of a drag over the gaps between rows; only the scroll was
  moved to the document, never the targeting.

## 2026-09-19 - Both sides of the gap light, and a cancelled drag is shown, not worded

- Task: `dnd` (find the commit with `git log --grep=dnd`).
- Decision: "after 3" and "before 4" are one place, so both rows beside the
  gap carry the existing gold inset. The component derives the pair from the
  unchanged `onOver(over, where)` callback, so no port contract moves.
  Cancelling is signalled rather than worded: outside the zone the
  highlights go out and the cursor refuses the drop, which is what Escape, a
  release outside the list and a drag off the page all look like.
- Rejected: one line drawn in the gap itself (it needs a node inside a flex
  column whose rows are `overflow: hidden`, so it either shifts every row
  below it or forces `position: relative` onto a shared `.rows` rule); an
  explicit Escape key handler (the native drag already consumes Escape and
  fires `dragend`, and a second mechanism for one effect is a second thing
  to keep true); a hint string in `dict.ts` (a tooltip is read before the
  drag, not during it, which is when cancelling is decided).

## 2026-09-18 - Task documents stay tracked; closeout deletes them, never pushed

- Task: `workflow-hygiene` (find the commit with `git log --grep=workflow-hygiene`).
- Decision: `issues/<id>/` stays tracked in git while a task is open. The
  closeout amend runs `git rm -r issues/<id>` before the task's one push, so
  a task's documents never reach the remote - only its permanent-home writes
  and its commit do.
- Rejected: gitignoring `issues/` instead - the deletion path stops being
  guardable (`bash-guard.mjs` denies `rm -r` inside the repo; rule 2i sees a
  glob as a literal token), a worktree or a remote agent at the task's commit
  would not see the documents, and the issue 47 task directory was tracked by
  an owner ruling (later overridden) that would have become an exception
  inside an exception.
- Evidence: pre-amend commits stay in the local reflog only
  (`gc.reflogExpireUnreachable`, 30 days by default), so the closeout audit
  is the only thing that preserves a decision or a measurement made mid-task.

## 2026-09-18 - Durable knowledge is written to its home the batch that makes it, never parked

- Task: `workflow-hygiene`.
- Decision: a durable fact, decision, or defect is written to its permanent
  home in the batch that establishes it, never left in a task document for
  closeout to move. Homes: behaviour -> `docs/specs/`; hook/harness/host
  facts and rationale -> `.claude/README.md`; every other decision ->
  `docs/DECISIONS.md`; a defect kept on purpose or work owed ->
  `docs/specs/DEBT.md`; an idea nobody owns -> dropped, named to the human at
  closeout so they can file it.
- Rejected: parking durable content in the task directory until closeout -
  the audit would then have to reconstruct what was durable from narrative
  written once already, which is exactly how content survives as a citation
  into a directory that is about to be deleted.

## 2026-09-18 - The task-document size budget and compaction stay; retirement becomes primary

- Task: `workflow-hygiene`.
- Decision: the 150 KB warn / 300 KB collapse budget and its compaction
  procedure (`.claude/skills/handoff/SKILL.md`) stay - they guard the *open*
  task, read by every worker at dispatch. Compaction becomes the secondary
  procedure; retirement (deleting the directory at closeout) becomes primary.
- Rejected: dropping compaction now that retirement exists - a long task
  still grows for weeks before it closes (phase 8 ran twelve batches), so
  the mid-task budget problem compaction solves has not gone away.

## 2026-09-18 - Rule 2i generalised from a plan.md file to any task directory

- Task: `workflow-hygiene`.
- Decision: `bash-guard.mjs` rule 2i now denies `rm`/`git rm` of any file
  under `issues/<id>/`, or of the directory itself, while a tracked line
  outside that directory cites `issues/<id>/` (a `git show <sha>:path`
  citation stays exempt) - generalised from denying only a still-cited
  `plan.md`.
- Rejected: retiring the rule instead, on the theory that "nothing may cite
  a task directory" under the new model - a rule nobody enforces at the
  moment of deletion is exactly the rule that produced ten orphaned
  citations for issue 65's retired `plan.md`.
- Evidence: retirement was rare before this task (three directories ever)
  and is now routine (every task's closeout), so the class of orphan the
  rule prevents is attempted at every closeout, not occasionally.

## 2026-09-18 - The push-force guard denies every force form, not just a bare `--force`

- Task: `workflow-hygiene`.
- Decision: `bash-guard.mjs` rule 2b now denies `--force`, `-f`,
  `--force-with-lease` (with or without `=<x>`), `--force-if-includes`, and
  any `+<refspec>` token; `--dry-run` still exempts.
- Rejected: leaving `--force-with-lease` allowed (its previous standing) -
  with one amended commit per task, an amend after a push is the tempting
  mistake, and a lease that happens to succeed is still the force-push
  `CLAUDE.md` forbids.
- Evidence: same class as the standing AI-attribution deny - an explicit
  human rule with zero false positives.

## 2026-09-18 - One commit per task, amended per batch, pushed once at closeout

- Task: `workflow-hygiene`.
- Decision: a task's first batch runs `git commit`; every later batch and
  the closeout amend it (`git commit --amend`, message rewritten to cover
  the whole task so far); the commit gate (rule 2e) runs on each amend. The
  branch is pushed once, at closeout, after the task directory is deleted;
  the amend window closes at that push - never force-push after it.
- Rejected: pushing at every batch's committed boundary (the prior rule) -
  it produced many small commits per task and made "push once" impossible
  to reconcile with amending.
- Evidence: the reviewer diffs a batch as `git diff <previous sha> HEAD`,
  both shas recorded in the handoff's Completed section.

## 2026-09-18 - The comment standard lives in `CLAUDE.md`, enforced by review and rule 2i, no new hook yet

- Task: `workflow-hygiene`.
- Decision: the four-bullet comment standard (`CLAUDE.md`, "Comments") is
  enforced by the review prompt (section G) and, at retirement, by rule 2i -
  a comment citing `issues/<id>/` blocks the directory's deletion, and the
  writer of that comment pays for it.
- Rejected: a dedicated hook or `tests/` gate now - the written rule has not
  been given a chance to fail yet (`.claude/README.md`'s standing bar for a
  new hook is a repeated mistake, row 29). `.claude/README.md` row 48
  records the cheapest deterministic form for the day it does.

## 2026-09-18 - The issue 47 task directory is audited and retired in this task

- Task: `workflow-hygiene`.
- Decision: the issue 47 task directory (the Svelte migration backlog) is
  read in full, its durable content placed in permanent homes, and the
  directory deleted - overriding the 2026-09-17 ruling in its own handoff to
  keep it permanently. No directory is exempt from the new model.
- Rejected: keeping the 2026-09-17 ruling - it predates this task's model,
  under which every directory whose work has shipped is retired.
- Evidence: the closed records (`sweep.md`, the closing record in
  `handoff.md`) stay reachable through one history pointer,
  `git show 92d6a4b:issues/47/<file>` - `92d6a4b` is the last commit on
  `main` before this task's own commit.

## 2026-09-18 - Retire scope: audit every shipped directory, then delete - never a blind delete

- Task: `workflow-hygiene` (human decision).
- Decision: every task directory whose work has shipped is read in full,
  its durable content moved to a permanent home, every tracked citation into
  it repaired, and only then is the directory deleted.
- Rejected: a blind delete of old task directories - it is exactly what
  produced orphaned citations for issue 65's retired `plan.md`; the audit
  is the fix.

## 2026-09-18 - Decisions live in one `docs/DECISIONS.md`, not a `docs/decisions/` folder

- Task: `workflow-hygiene` (human decision).
- Decision: one register file, `docs/DECISIONS.md`, holds every decision
  that outlives the task that made it (outside behaviour, which stays in
  `docs/specs/`, and hook/tooling rationale, which stays in
  `.claude/README.md`).
- Rejected: a `docs/decisions/` directory of one file per decision - a
  single register is easier to grep and to keep a size discipline over; that
  discipline is accepted as a cost of the choice, not a reason against it.

## 2026-09-18 - Write the comment standard and sweep the whole repository to match it now

- Task: `workflow-hygiene` (human decision).
- Decision: `CLAUDE.md` gains the comment standard in the same task that
  sweeps every existing violation - untrackable citations
  (`B10-N5`, `issues/<id>/` paths, plan/handoff section references) stripped,
  verbose block comments compressed. A large diff is expected and accepted.
- Rejected: writing the rule now and sweeping later, incrementally - the
  existing violations would keep citing a task directory this same task is
  retiring, which rule 2i would then have to deny piecemeal instead of once.

## 2026-09-18 - One commit per task, amend freely, push once - replaces the per-batch push rule

- Task: `workflow-hygiene` (human decision).
- Decision: this task's commit protocol (see the amend-window entry above)
  replaces `CLAUDE.md`'s prior rule, "push the branch once a batch's
  commits pass their gates." Never force-push, in any form.
- Rejected: keeping per-batch pushes alongside amending - a pushed commit
  cannot be amended without a force-push, which the standing rule already
  forbids, so the two rules were incompatible as soon as amending was
  adopted.

## 2026-09-17 - Nits are processed immediately, per batch, not deferred to a terminal pass

- Task: `phase-8` (retired; recorded here at retirement).
- Decision: nits are cleared in the batch that finds them, against the
  standing "defer mid-plan" rule (`orchestrate.prompt.md`, "Nits") - owner
  instruction. Reviewers still list nits fully; they are acted on.
- Rejected: deferring to the terminal batch as usual - that rule's premise
  ("a later batch re-enters those paths") fails once batches are merged by
  area and do not overlap, so a deferred nit has nothing to ride and arrives
  as a pile instead. `orchestrate.prompt.md`'s "Nits" section now names this
  as the standing exception.

## 2026-09-18 - A batch whose whole scope is other reviews' findings runs with no reviewer

- Task: `phase-8` (retired; recorded here at retirement).
- Decision: the terminal nit-clearing batch ran with no reviewer, by owner
  decision - reviewing a batch whose whole scope is other reviews' findings
  opens a second-order review -> remediate loop with no floor. Substitute:
  every routed finding proves itself in the failing direction as an
  acceptance line. Handoff wording: `Review: not run (owner's decision)`,
  never `not required`. `orchestrate.prompt.md`, "When to run reviewer",
  carries the same sentence.

## 2026-09-17 - Rejected UI/architecture options from the phase-8 review, recorded once

- Task: `phase-8` (retired; recorded here at retirement).
- Decision: no change - these alternatives were considered and rejected
  during review and have no other permanent home now that the task
  directory is gone.
- Rejected: a `<label>` emitted by `Field` (it wraps chip rows and segmented
  switches; a `<label>` around buttons is wrong); `$state.raw` for `lists`
  (a cheap present-cost win traded for a silent failure if anyone later
  mutates in place); extending the truncation checksum over the notes (a
  payload-grammar contract change for a failure the reader can see anyway);
  virtualising the row lists (370 is the largest list drawn, and it moves
  goldens); SHA-pinning the `actions/*` tags (maintenance beyond its value;
  `gitleaks` alone is pinned).

## 2026-09-18 - `data.json`/`catalog.csv` staying tracked was not solved by a pretest step

- Task: `untrack-stubs` (retired; recorded here at retirement).
- Decision: `data.json` and `catalog.csv` stay tracked in git (triggers to
  reopen this: `docs/specs/CONTRACTS.md` section 4).
- Rejected: `"pretest": "npm run data"` (fires for `npm run test` but not
  `test:watch`, and makes a plain `npm test` write 1093 files); pointing the
  seven `app/src/lib/*.test.ts` suites at `data.js` instead (changes what
  they prove, voids `COVERAGE.md`'s "the real `data.json`"); `existsSync` +
  `it.skip` (coverage thresholds fail anyway, or the gap is hidden); a
  vitest `globalSetup` builder (the same tree mutation, only hidden).

## 2026-09-18 - Share stubs (`i/`) and artwork (`img/`, `og/`) stay tracked root folders

- Task: `untrack-stubs` (retired; recorded here at retirement).
- Decision: `i/*.html`, `img/`, and `og/` stay tracked at the repository
  root rather than moving under a build output or out of git entirely.
- Rejected: generating stubs into `dist/i/` and dropping the root folder
  (moves a path four suites read off disk - `derived`, `dataint`, `craft`,
  `stub` - and changes what `node tools/build.js` means); git-lfs, a
  shallow-clone recommendation, or a history rewrite for repository size
  (the 146 MB `.git` is `img/` + `og/`, which stay tracked regardless of
  this choice; a rewrite breaks every clone and every sha the specs cite).

## 2026-09-16 - Playwright: not now

- Task: the Svelte migration (issue 47; retired, recorded here at
  retirement).
- Decision: not adopted, by the owner's decision. Scope fence: R0c reduced
  no real-browser coverage (nine `tests/app/` suites run against `dist/`);
  only the side-by-side pixel comparison ended, and that end was
  unavoidable once the app being compared against was deleted.
- Evidence both ways: for adopting it - the states case-7 flake
  (`docs/specs/COVERAGE.md`, "app/states") was hand-rolled event waiting,
  exactly the class auto-waiting locators exist for, and two Chrome runs
  once collided on one tree with no lock between them; against - the
  driver's verbs (`media`, `computed`, `eachAt`, `settle`, drag, click-by-
  name) are bespoke to a bilingual UI and three-width sweeps, and the
  goldens are structural text, so screenshot tooling would replace nothing
  they check.
- Rejected: deciding with no data; a spike before R0c; committing to it up
  front. Still open - the heavy-run lock question beside it
  (`docs/specs/DEBT.md`, "Routed elsewhere, not paid") weighs against the
  same driver question, since a second real-browser dependency would need
  its own guard too.

## 2026-09-17 - The R0c sweep ran as a read-only reviewer-role dispatch, not an implementer step

- Task: the Svelte migration (issue 47; retired, recorded here at
  retirement).
- Decision: the sweep that read the deleted instruments' own assertions for
  what no surviving instrument could see ran as a read-only, reviewer-role
  dispatch, deliberately separate from the implementer batch that did the
  deleting - the implementer's incentive is to delete, which is the wrong
  incentive for a read meant to find what deleting loses.
- Rejected: a gate in `npm run check` (there is nothing mechanical to
  assert - the sweep's findings are read-only prose); the implementer doing
  it in the same batch (anchoring - the same person who wants the deletion
  reviewing what it costs); skipping it because an earlier audit (R0b)
  already covered ten suites (that audit covered suites, not markup,
  conditional CSS, the dictionary, or the 42 parity specs the sweep also
  read).
- Evidence: this generalises to any "delete a whole surface" batch, not only
  R0c's own.
