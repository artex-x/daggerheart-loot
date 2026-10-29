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

## Tool UI redesign (`57`, GitHub issue 57)

Owns: wording left by R10 on pages that the redesign rebuilds (owner,
2026-10-28), and the toast's focus return for its link and move actions.

### D116 - the lists page names its only group «Ваш аккаунт»

- **Where**: `app/src/components/ListsPage.svelte`, the `Field` heading
  `t.groupAccount` («Ваш аккаунт» / "Your account") above the account's
  lists; `app/src/components/listsPage.test.ts` pins the name.
- **What**: the heading told the account group apart from the browser group.
  R10 removed the browser group, so the heading now labels the only group on
  `#/lists`.
- **Why deferred**: owner, 2026-10-28: the redesign rebuilds the lists page,
  and a separate fix would re-seed the lists goldens for one heading.
- **How to verify the fix**: signed in, `#/lists` draws no «Ваш аккаунт» /
  "Your account" heading; the `groupAccount` key is gone from `lib/dict.ts`
  in both languages, and the lists goldens are re-seeded.

### D121 - the focus goes to `body` when a later toast replaces an action toast that held it

- **Where**: `app/src/components/Toast.svelte`, the `$effect.pre` that
  returns the focus; it is keyed on the action's `run`.
- **What**: a person who moved the focus into a toast whose action is a
  link (`href`, «Изменить» after «Свой предмет») or a move (`go`, the
  new-request toast's «Открыть» / «Показать») loses it to `body` when a later
  toast replaces that toast: neither action has a `run`, so the effect does
  not run, and the button leaves the DOM. Rule 20 wants the focus on the
  element it came from, else `#main`.
- **Why deferred**: found in review on 2026-10-29 and placed with the
  owner's UI task: the redesign rebuilds the toast, and one fix covers both
  action kinds there.
- **How to verify the fix**: a component case in `shell.test.ts` for each
  of `href` and `go`: focus moved into the toast, a later plain toast said,
  the focus lands on the element it came from, or `#main` when that is gone;
  `expectNoA11yViolations` at the end.
