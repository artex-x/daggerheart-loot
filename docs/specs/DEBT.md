# DEBT.md - defects kept on purpose, owed to a named task

A live defect the app ships on purpose, with the task that owes its fix. Each
entry reads **Where** / **What** / **Why deferred** / **How to verify the
fix**, is written in the batch that decides to defer it, and is deleted by
the batch that pays it. Sections are the tasks that owe the entries; a
section with no entry left is deleted. A kept design is a decision
(`docs/DECISIONS.md`), not an entry; a refactor question with no
user-visible defect does not belong here. Why this file is the home:
`docs/DECISIONS.md`, "Kept defects live in `docs/specs/DEBT.md`, grouped by
the task that owes them".

## Consistent storage (no issue filed yet)

Owns: a versioned storage envelope with validation and migration, per-entry
reconciliation, the `dhloot.lang`/`home`/`warn` keys (not watched across
tabs today - a second tab keeps the old value until reload), a `save()`
debounce, a local `.json` export, and backups a person can reach.

### D24 - a second `dhloot.lists.v2` corruption is never backed up, and the first backup is orphaned forever

- **Where**: `app/src/state/lists.svelte.ts`, `ListStore#readCurrent`.
- **What**: the first unreadable `dhloot.lists.v2` value is backed up once,
  under `dhloot.lists.v2.bad` - `get(LISTS_KEY_BAD) === null` guards it, on
  purpose, so this tab's own next successful write does not overwrite the
  one copy of what was actually lost. The guard has a consequence nothing
  else in the code addresses: once that key reads back as valid again (this
  tab's own next `save()`, or another tab's write), `unreadable` clears and
  the storage notice stops warning - but the `.bad` backup stays sitting
  there with no UI that ever reads it, orphaned for good. A **second**
  corruption after that point is not backed up at all (the guard still
  finds `.bad` occupied by the first one) and `save()` writes straight over
  it, while the notice tells the reader their data survived.
- **Why deferred**: the real fix needs a backup **keying scheme** - a
  timestamped key grows `localStorage` without bound, and dropping `.bad`
  the moment a read succeeds discards the one copy of the first loss before
  anyone could reach it - plus a way for a person to actually reach a
  backup at all, which today has no UI anywhere. The consistent-storage
  ticket already owns ".bad-key recovery beyond a notice"; this is that same
  design question, not a second one.
- **How to verify the fix**: corrupt `dhloot.lists.v2` twice in a row (a
  plain write of unparsable text, then - after the app has re-validated the
  key once, clearing `unreadable` - corrupt it again) and confirm two
  distinct, reachable backups exist rather than one overwritten copy.
- **Copy** (was D31): `app/src/lib/dict.ts` `badStorage` (`ru`, `en`) tells
  the reader their unreadable data is kept "under a separate key", which no
  one can act on outside devtools. Rewrite it once a backup is reachable.
