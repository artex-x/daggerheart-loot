# 2026-09-25 - Decisions are one file each under docs/decisions/; the index is generated

- Task: `decisions-registry` (owner, 2026-09-25).
- Decision: one file per decision, `docs/decisions/<date>-<slug>.md`, in the
  shape of `.claude/templates/decision.template.md`; `docs/DECISIONS.md` is
  the index `node tools/decisions.js` renders from them. `tests/derived.js`
  checks the index, names, required fields, both-way pointers, the caps on
  files dated 2026-09-26 or later, the template and every quoted citation.
  An index conflict is resolved by running the tool (`.claude/README.md`,
  "Decisions registry").
- Rejected: folding in place (1.3% smaller); retiring spec-covered entries
  (loses the rejected alternatives); a hand-kept index (conflicts at its
  top); no index (75 citations name the file); `merge=union` (a quiet wrong
  file); a custom merge driver (per-clone config, unsound mid-merge).
- Supersedes "Decisions live in one `docs/DECISIONS.md`, not a `docs/decisions/` folder" (2026-09-18).
