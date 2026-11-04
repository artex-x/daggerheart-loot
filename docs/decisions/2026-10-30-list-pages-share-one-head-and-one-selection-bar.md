# 2026-10-30 - List pages share one head and one selection bar

- Task: `57` (owner, mock 3 rounds 5 and 6, R3-1, R3-2, Q3.1, Q3.2; planner defaults D1-D13 with the owner away, 2026-10-30).
- Decision: a list page's head is the search row (search first, «Фильтры» below 1000 px,
  «Выбрать» last), the count line while narrowed, and «··· Ещё» for rare actions below 761 px;
  the catalog draws its filters as a column from 1000 px and a bottom sheet (`Sheet`) below it,
  «Все» as the neutral pressed default, and the selection mode (`AppState.selecting`) behind
  «Выбрать». `SelectionBar` is the one bar; a `viewport` port gives the band (760 and 1000 px).
  `FilterPanel` serves the catalog; `FilterBar` and `BatchBar` stay with their last callers
  (batches 6, 8, 9), the interim mix of release wave 2. Batches 6, 8 and 9 take this head.
- Rejected: the 1180 px equipment column table (a second row component for three tables; no
  audit row asks for it, owner question Q3-T); keeping the per-section «Выбрать все (N)» strip on
  the catalog (owner, Q3-S: the bar's «Все» is the one select-all control); a pill row at 360 (R3-1); a CSS-only
  band (the picker, «Ещё» and the sheet are structural); a filter link that opens the sheet (a
  modal over a page just opened).
- Accepted trade-off: two filter forms and two bars until wave 3; `/search` and `/s/` keep always-on ticks until batches 7 and 9; ticking exactly one section takes two taps (its filter value, then «Все»).
- Amends "Source names follow the source product, in labels and URL ids" (2026-10-21): no short chip forms; the tabs show full names from 761 px and the picker's sheet below it.
- Amended by "Search and account follow the list head and the error page" (2026-11-04): `/search` takes the head, the selection mode and the bar; only `/s/` keeps the strip.
