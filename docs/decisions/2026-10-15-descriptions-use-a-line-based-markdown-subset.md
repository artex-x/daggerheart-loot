# 2026-10-15 - Descriptions use a line-based Markdown subset parsed by one module

- Amended by "Catalog text follows the SRD card style for names, costs and conditions" (2026-10-15): the label form is `***Name:***`.
- Task: `rich-descriptions` (owner, 2026-10-14: answers Q2, Q3, Q8 and Q9).
- Decision: every long text field is one Markdown subset (bold, italic, a
  bulleted and a numbered list, a table; one source line is one block), parsed
  by `app/src/lib/markup.ts`, which has no imports so the build tools and the
  preview host load it too. The catalog writes its labels as `*Name:* text`;
  stored homebrew text is read the same way with no migration (the grammar:
  `docs/specs/FEATURES.md`, "Formatted text"; the carriers: `CONTRACTS.md` 4).
- Rejected: the colon rule, a short head before ": " drawn in italics (it
  italicised instructions in homebrew text, and an author could not opt out);
  CommonMark (it joins two lines into one paragraph and breaks the line
  breaks of 177 catalog records); a library parser such as marked or
  markdown-it (it emits HTML strings that need a sanitizer, and costs more
  than the 1.2 kB gzip of the module); links (a public `#/h/` page would carry
  anyone's links); underline (Markdown has none, and it reads as a link).
