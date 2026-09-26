# 2026-09-25 - A homebrew save is a form submit, not the account lists' optimistic queue

- Task: `persist-7-homebrew` (planner, 2026-09-25).
- Decision: the homebrew editor saves on «Сохранить»: the store's
  `save(draft)` awaits the one write, the page navigates to `#/homebrew`
  on success and keeps the draft with the refusal under the form
  otherwise. `state/homebrew.svelte.ts` holds the items, `load`,
  `refresh`, `clear`, `save` and `remove`, and no write queue.
- Rejected: reusing `CloudLists`' optimistic queue by extracting it (a
  form has one submit and no per-keystroke writes; the extraction would
  widen the release's review into the list store for no behaviour);
  optimistic navigation before the answer (a refused save would need the
  form back with its draft, which the page already is).
