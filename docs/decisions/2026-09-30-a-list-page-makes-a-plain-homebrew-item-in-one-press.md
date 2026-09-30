# 2026-09-30 - A list page makes a plain homebrew item in one press, with no draft mark

- Task: `persist-7-homebrew` (owner's mock review of 2026-09-29; Q12 answered, then revised by the owner on 2026-09-30).
- Decision: an own account list offers «+ Свой предмет»: a name and an optional description make an
  ordinary homebrew item (kind «Предмет», the default source, the UI language's fields), awaited,
  then a reference entry through the list's write buffer. Nothing marks it: the author completes it
  later in the ordinary editor, or uses it as it is.
- Rejected: a `draft` column with a badge, a banner and a «Черновики» group (a separate abstraction
  the owner declined: a quick item is a normal item); one RPC for both writes (the two existing
  write paths already order them).
