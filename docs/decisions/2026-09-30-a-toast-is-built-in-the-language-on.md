# 2026-09-30 - A toast is built in the language on screen each time it is drawn

- Task: `toast-follows-language` (owner, 2026-09-30: the toast follows the language switch).
- Decision: `AppState.say` and `AppState.copied` take a `Msg`
  (`(t, lang) => string`, `app/src/lib/dict.ts`), and `AppState.toast`
  derives the drawn text and the action's label from the current
  dictionary. A language switch redraws a toast on screen; its clock and the
  focus stay (docs/specs/I18N.md, "Rules"). A message captures its data
  values in constants at the call; only the language follows.
- Rejected: a harness-only change with language-neutral `enter` steps (it
  leaves the product defect); a `docs/specs/DEBT.md` entry alone (it leaves
  18 English toast texts unproved by the goldens); `say` accepting a string
  as well (a string call site brings the defect back, and the typecheck
  cannot list it); a dictionary key plus arguments, as `ImportPanel`'s
  refusal line does (the messages compose: `limitText`, `plural` and
  `nameOf` need the language, and the add toast nests inside the send toast).
