# 2026-09-24 - An undo toast takes focus; a plain toast never does

- Task: `debt-cleanup` (owner's answer).
- Decision: a toast that offers an undo moves focus to its button on show
  (`Toast.svelte`), so the keyboard reaches it inside the 7000 ms window.
  When it goes with focus still inside, focus returns to the element it
  came from, or to `#main` when that element left with the action.
  Behaviour: `docs/specs/FEATURES.md`, the undo-toast bullet.
- Rejected: leaving it to issue #57's focus-management pass (recommended,
  overruled: the undo was unreachable from the keyboard in practice);
  lengthening the toast (a longer wait still ends at the page's last tab
  stop); moving focus for every toast (a plain notice needs no answer).
