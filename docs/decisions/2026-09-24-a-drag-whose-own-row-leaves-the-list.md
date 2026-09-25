# 2026-09-24 - A drag whose own row leaves the list is void

- Task: `debt-cleanup` (owner: fix now).
- Decision: the drag binding lives as long as the list's id
  (`ListPage.svelte`), not each edit of the list; the dragged entry's id is
  captured at `dragstart` and the drop moves that id. When the dragged row
  leaves the DOM mid-drag (another tab removed it), `app/src/ports/drag.ts`
  voids the drag at the next `dragover`: the marks clear, every later event
  of that drag is refused, the release moves nothing. Its listeners end at
  the `dragend` the browser fires at the detached grip (bound on the grip,
  since it no longer bubbles to the list) or at the next `dragstart`.
- Rejected: voiding on any row change (undoes "A drag keeps its cached
  midpoints when another tab rewrites the list" for nothing the id capture
  does not already give); a document `pointermove` after the drag (none is
  sent during a drag, and a synthetic one proves nothing about a trusted
  one); a component effect watching the rows (a second mechanism).
