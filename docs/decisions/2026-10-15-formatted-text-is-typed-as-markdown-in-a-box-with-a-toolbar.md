# 2026-10-15 - Formatted text is typed as Markdown in a box with a toolbar

- Task: `rich-descriptions` (owner, 2026-10-14: answers Q1, Q5 and Q7, and the
  revision that the item form's live card is its preview).
- Decision: every homebrew text box is `MarkupField.svelte`: a textarea that
  holds the stored Markdown, a hand-written toolbar (`lib/markupEdit.ts`), a
  «?» with the syntax, and «Просмотр» only where no rendered view sits beside
  the box. One «Язык текста» switch («RU» / «EN») per item or card form; a
  save writes both languages. A card marks a text shown in the other
  language (`textLangOf`). Rules: `FEATURES.md`, "Consistency rules", rule
  18, and "Homebrew", "Language".
- Rejected: a WYSIWYG library (Tiptap or ProseMirror with a Markdown
  serializer, about 100 kB published, not measured; the box would not show
  what is stored); a library parser (CommonMark joins lines, emits HTML); a
  pane beside the item form's card (owner, 2026-10-14); a switch in each
  field (Q5 B); full language names (the app's switch says «RU» / «EN»); a
  stored `textLang` field (the cloud contract compares `recordOf` with SQL).
