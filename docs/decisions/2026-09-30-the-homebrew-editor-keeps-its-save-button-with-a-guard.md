# 2026-09-30 - The homebrew editor keeps its save button, with a guard and a revision check

- Task: `persist-7-homebrew` (the owner asked on 2026-09-28 and answered Q8 on 2026-09-30; planner).
- Decision: the editor saves on «Сохранить», one awaited write, and checks on submit only: a focused
  error summary with a link per problem, a line under each field, a red mark on each required field;
  the rules run in `lib/homebrew.ts` and in the SQL validators over one fixture set. A dirty form
  asks before an in-app navigation (`env.dialog.confirm`) and before a closing tab (`beforeunload`
  behind `PagePort`); Ctrl+S submits. An update names the revision it loaded: a newer one draws a
  banner to overwrite or to reload, a deleted row one to save as new. A source or a section made
  from the editor is written at once by its own «Создать».
- Rejected: R5's account write buffer for the item text (a live reference would put a half-typed
  name on every list, shared page and print sheet and send owner and share messages per flush; a
  draft invalid between keystrokes would be refused and reverted under the typist); writing inline
  creations on «Сохранить» (a partial failure to undo); a save with no revision check (two tabs
  overwrite each other without a word).
- Amends "A homebrew save is a form submit, not the account lists' optimistic queue" (2026-09-25): the guard and the revision check.
