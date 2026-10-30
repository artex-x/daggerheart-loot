# 2026-10-29 - English text uses American spelling

- Task: `57` (owner, 2026-10-29: Q3, one English spelling everywhere, American; B3, the whole sweep in batch 2).
- Decision: English text uses American spelling ("color", "armor", "license", "catalog") in the
  UI, `llms.txt`, the share cards, the specs and the developer docs, comments, test and suite
  titles, log and error texts, `.claude/` prompts, skills, agents, templates and hooks, and
  `CLAUDE.md` (`docs/specs/I18N.md`, "Rules"; `tests/derived.js` holds `dict.ts` English and
  `llms.txt` to it).
- Decision (kept forms): code identifiers (`VectorPaint` `'colour'`, `isLabelled`, `.foot-licence`,
  `hb_sectarmouraaaaaa`, local variable names); stored and seed values (`docs/fixtures/`,
  `fake-cloud-seed.ts` «Traveller's Roll», the `tests/db/` inputs); inventory ids and golden file
  names (`~ colour for this visit`); decision file names, titles and earlier bodies; the frozen
  `schema/*.json` wording; quotations and records (commit messages, the DPCGL text, source-book
  text in `data.js`); `aria-labelledby`; `cancelled`; `smoulder`; lock files and third-party
  licence texts; the generated `.impeccable/design.json`; the `issues/57/` scratch.
- Rejected: British everywhere (the source books and the web platform are American); American in
  the UI only (two spellings for one word across the repository).
