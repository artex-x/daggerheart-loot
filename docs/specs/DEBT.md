# DEBT.md - defects kept on purpose, owed to a named task

A live defect the app ships on purpose, with the task that owes its fix. Each
entry reads **Where** / **What** / **Why deferred** / **How to verify the
fix**, is written in the batch that decides to defer it, and is deleted by
the batch that pays it. Sections are the tasks that owe the entries; a
section with no entry left is deleted. A kept design is a decision
(`docs/decisions/`), not an entry; a refactor question with no
user-visible defect does not belong here. Why this file is the home:
`docs/DECISIONS.md`, "Kept defects live in `docs/specs/DEBT.md`, grouped by
the task that owes them".

## Visual leftovers (task `57-debt`, owner first)

### D131 - two compact color print cards print their rules text under the floor

- **Where**: `app/src/components/PrintCard.svelte` (`SHORTFALL`), on the RU compact color
  sheet.
- **What**: `voa4_t4i` and `voa4_a3` print their rules text at 3.4cqw (4.2 pt), under the
  compact floor of 3.7cqw, so their burden and tier marks clear the tags and the name
  (`FEATURES.md`, "Print").
- **Why deferred**: at the floor the text overruns the card, and a smaller mark or a cut text
  changes the Figma layout. A shorter Russian text (6-7 % fewer characters, tried on
  2026-11-12) did not lift either card above 3.4cqw (the fit steps by 0.1cqw, so 3.5cqw does
  not fit either), so the owner had the previous wording restored.
- **How to verify the fix**: `tests/app/print.js` on the RU compact color
  sheet reads no `.pc-text` under 3.7cqw and no mark over a tag or the name.

## Account and API leftovers (task `57-debt`, owner first)

### D142 - only the ZIP download has the link to the AI page

- **Where**: `app/src/components/ListsPage.svelte`, `ListPage.svelte`, `HomebrewSources.svelte` and
  the homebrew selection bar (every «Скачать JSON»); `AccountPage.svelte` has the one link.
- **What**: the owner asked for one link «Читать эти данные через ИИ-ассистента или API» in each
  export place (2026-11-12). It is only in «Ваши данные» beside «Скачать мои данные (ZIP)»
  (`FEATURES.md`, "Exports"); «Скачать JSON» sits in menus and selection bars that have no row
  for a link.
- **Why deferred**: a link in a menu or a selection bar is a layout change of four places;
  the AFK default of 2026-11-17 kept the one link, and the owner confirms or asks for the rest.
- **How to verify the fix**: a component test of each place that downloads JSON reads the link
  to `ai.html` of the language on screen, and ends with `expectNoA11yViolations`.

### D143 - a name with a `$` pattern changes the sentence it is put into

- **Where**: every `.replace('%s', value)` with a string value in `app/src/` (for example
  `RequestsPanel.svelte`, `noticeChanged` and `noticeDeleted`, and `ListsPage.svelte`, the
  `quoted` names of the gone lists).
- **What**: `String.prototype.replace` reads `` $` ``, `$'`, `$&` and `$$` in a string value, so a
  list or item name that holds one copies part of the sentence into it. Another reader writes
  the names of a notice, so the text is not only the reader's own.
- **Why deferred**: a project-wide change of about 90 call sites; Svelte escapes the text, so no
  markup gets through, and about 20 call sites (the connected apps, the cards tab) already use
  `replace('%s', () => value)`.
- **How to verify the fix**: a unit test puts the name `` a$`b `` into `noticeChanged` and
  `quoted` and reads the name unchanged in the sentence; no string-valued `.replace('%s'` is left
  in `app/src/`.
