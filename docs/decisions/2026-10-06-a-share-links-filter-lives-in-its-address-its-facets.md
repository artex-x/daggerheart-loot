# 2026-10-06 - A share link's filter lives in its address; its facets are the drawn entries

- Amended by "A filter row offers only values the drawn rows answer, on every page" (2026-10-08): its offer rule is every page's.
- Task: `71` (owner, 2026-10-06: "consistent way with tables"; minimal lists challenged the same day).
- Decision: `#/s/<token>/f_<filter>` carries the filter in the tables' grammar, groups `kind` (`item`,
  `consumable`, `weapon`, `secondary`, `armor`), `src`, `tier`, `cls`, `trait`, `range`, `burden`, `line`,
  with the tables' copy-link button. A value is offered only when a drawn entry answers it, a row only when it
  can narrow; a value no drawn entry answers draws no pill and narrows nothing. The block opens from 8 drawn
  entries (`LIST_SEARCH_AT`) or with a filter or query set and stays until another list opens; inside it the
  search box always shows, the strip only while a row can narrow. `#/l/<payload>` keeps the filter in page
  memory with no copy-link button: its payload is read as written.
- Rejected: page memory on `#/s/` (the owner chose consistency with the tables); no copy-link button on a GM
  link (the address bar already holds the GM token; the toast warns as the share panel's «Скопировать» does);
  "a row can narrow" in place of the 8-entry rule (a 3-entry list would draw a filter); hiding the search box
  when no row can narrow (a long list of alike entries is where a name search helps); a strip with nothing to
  open; counts on chips; narrowing one row by another's picks; merging the Vault of Ages section into `tier`.
