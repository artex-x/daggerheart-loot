# 2026-10-08 - A filter row offers only values the drawn rows answer, on every page

- Task: `homebrew-followups` (owner, 2026-10-08: a one-value row "is useless"; filters are dynamic on every
  page).
- Decision: every filter strip passes its candidate rows through `narrowRows` (`app/src/lib/facets.ts`): a row
  offers a value only when a drawn row answers it, is drawn only when it can narrow (two values, or one value
  some drawn row lacks), and never narrows by another row's picks. On `#/tables/homebrew` the drawn rows are
  the chosen source chip's. A table keeps a picked value offered while it is picked, so its pill stays and the
  table empties as before: every table address reads and draws as it did. A share link keeps its own rule: a
  value no drawn entry answers draws no pill and narrows nothing.
- Rejected: the share link's "no pill, narrows nothing" on the tables (`ROUTES.md` freezes "a value no row
  answers narrows to nothing"; the same address would draw every row where it draws none); keeping one-value
  rows (the owner: useless); the search page's kind chips under the rule (they pick the query's scope, not
  values of drawn rows).
- Amends "A share link's filter lives in its address; its facets are the drawn entries" (2026-10-06): its offer rule is every page's.
