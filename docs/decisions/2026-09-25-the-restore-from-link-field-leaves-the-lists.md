# 2026-09-25 - The restore-from-link field leaves the lists index with the account lists

- Task: `persist-2-lists` (owner, mock review, 2026-09-25).
- Decision: «Восстановить из ссылки» leaves `#/lists` in R2, in every
  build. An old `#/l/` link still opens its shared page, whose «Сохранить
  себе» saves it, so the field is redundant. The texts naming it go in the
  same batch (help, the install guide's iOS paragraph, the specs). Amends
  "The `#/l/` link decoder retires at the legacy write cutoff": link
  import leaves at R2, not at the cutoff.
- Consequence accepted: until R5 moves lists into the account, an iPhone
  reader cannot carry a Safari list into the installed app.
- Rejected: keeping the field until the cutoff (two ways to do one thing).
- Amends "The `#/l/` link decoder retires at the legacy write cutoff" (2026-09-24).
