# 2026-11-04 - The record picture goes one step deeper than where it is drawn

- Task: `57` (the blind review after wave 2, its finding on the picture named «Страница»).
- Decision: on a roll result and a list's roll hit the picture is the button «Открыть карточку» / "Open card", which opens the record dialog; in the dialog it is the link «Открыть страницу» / "Open page" to the record's page; on the record page and in the editor's preview it is a picture with no control (`RecordCard`, `pageLink`; `FEATURES.md`, "Records").
- Rejected: the roll result's picture as a link to the page (a roll is page memory, so the press would drop the roll, and the dialog over a result, its only way in, would go); one button named «Страница» everywhere (the name did not say what it opened, and on the page it opened its own record over itself); the picture hidden from the tab order beside the name link (the dialog over a result would lose its keyboard way in).
- Accepted trade-off: the result's card has two controls for one record, the picture to the dialog and the name to the page.
