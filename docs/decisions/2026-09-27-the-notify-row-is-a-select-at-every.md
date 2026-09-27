# 2026-09-27 - The notify row is a select at every width

- Task: `persist-4-requests` (owner, 2026-09-27: the row's wording word for word, and a select at every width).
- Decision: the fifth row of the Display section of `#/account`, «Добавление
  из чужого списка» / "Adding from someone else's list", is a `<select>`
  labelled by the row name and described by the hint under it, as the
  «Раздел при запуске» row; the answers are «Спрашивать» / «Сообщать
  владельцу» / «Не сообщать» over `notifyGm` `ask`, `always`, `never`
  (`docs/specs/FEATURES.md`, "Account").
- Rejected: R5b's segmented control (at 360 px the owner's answers need
  307 px in a 288 px row, each button on two lines - measured in the
  mock, 2026-09-27; «Сообщать» alone still needs 302 px); the segmented
  control above 600 px and the select below (two controls for one
  setting); shorter answers (they still overflow).
