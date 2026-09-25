# 2026-09-19 - The drop-gap mark is made instant by narrowing `.row`'s transition, not by overriding the drop classes

- Task: `dnd4` (find the commit with `git log --grep=dnd4`).
- Decision: `.row`'s `transition: 0.15s` (which includes the mark's
  `box-shadow`) is narrowed to `border-color 0.15s, opacity 0.15s`, keeping
  the hover border and the dragged row's fade. `.rnote`'s own `transition:
  box-shadow 0.15s` (TASK `dnd3`) is deleted, or its half of the mark would
  fade alone. `dnd3` wrote no entry here, so nothing is superseded.
- Rejected: `transition-duration: 0s` on `.lrow.drop-before`/`.drop-after` -
  a transition uses the style it moves *to*, so the mark would still fade on
  exit.
- Evidence: `dist/` before the fix: `.lrow` `transitionProperty: 'all'`,
  `.rnote` `'box-shadow'` at `'0.15s'`; after: `.lrow` `'border-color,
  opacity'`, `.rnote` `'all'` at `'0s'`, the CSS initial value. A property
  read cannot tell that apart from `.row`'s old shorthand, so
  `tests/app/states.js` case 17 reads `.rnote`'s duration.
