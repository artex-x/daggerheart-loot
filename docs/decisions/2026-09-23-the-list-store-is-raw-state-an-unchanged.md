# 2026-09-23 - The list store is raw state; an unchanged stored value is not parsed again

- Task: `68`.
- Decision: `ListStore.lists` is `$state.raw`: every writer already replaces
  the array and the list it changes. The store remembers the
  `dhloot.lists.v2` string it last read or wrote: `save()` does not parse it
  again, and an external-change signal that finds the string `lists` was
  drawn from redraws nothing. The stored format does not change.
- Evidence (this host, 2026-09-23): a list-title keystroke costs 6.8/19/55
  ms at 50/200/500 lists, storage and JSON 1.2/5.4/11 ms of it; the save
  under Svelte 5.57, deep 14/44/94 ms, raw 1.3/5.7/16 ms. An unchanged
  re-read on `#/lists` costs 13/47/128 ms on each return to the tab.
  Measured after the change (built `dist/`, 1100x900): a keystroke at 200
  lists 22 -> 2.5 ms; an unchanged `storage` signal 62 -> under 1 ms with
  no DOM mutation; opening `#/lists` at 500 lists 467 -> 32 ms (24 cards).
- Rejected: a `save()` debounce (the consistent-storage ticket owned it;
  the persistence programme superseded that ticket on 2026-09-26, and
  browser lists become read-only at the cutoff); one key per list (a
  stored-format change and a new two-tab merge).
- Accepted trade-off: an in-place write to a stored list redraws nothing -
  the reason phase 8 kept deep state; writers stay immutable.
- Supersedes in part "Rejected UI/architecture options from the phase-8 review, recorded once" (2026-09-17).
