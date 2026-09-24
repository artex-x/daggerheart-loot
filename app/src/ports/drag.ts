/* Reordering by dragging, off the live event model (app.js 4443-4530).
 *
 * The grip is what a person grabs; the whole row is what moves - dragging a
 * small handle and dropping on a big target is easier than the other way
 * round. The pointer resolves to a gap between rows, not to a row itself, so
 * "after 3" and "before 4" are the same target and the 8px space between rows
 * accepts a drop like everywhere else (docs/specs/FEATURES.md, "Lists"). The
 * drop zone is the rows' own extent grown by one row gap at each end, and
 * resolution runs off the capturing document `dragover` the port already
 * binds for edge-scroll, because that is the listener that sees every
 * position, gaps included. The page also scrolls itself from either edge so
 * a drag past the fold does not have to fight the browser's own few-pixel
 * scroll strip.
 *
 * Dragging is not the only way to reorder, and deliberately not the primary
 * one: every row carries a position field, so moving entry 40 to position 20 is
 * typing 20 rather than twenty presses, and it works from a keyboard. The pure
 * `moveEntry` in lib/lists.ts is what both paths call.
 *
 * The port owns every listener and the scroll loop; the component owns the
 * `dragging`/`drop-before`/`drop-after` classes, driven by the three optional
 * callbacks below. That split is forced, not chosen: Svelte drops a scoped
 * rule no template element can match, and `npm run check` fails it as dead
 * CSS - so the port cannot toggle a class itself.
 *
 * A drag whose own row leaves the DOM mid-drag (another tab removed it) is
 * void: its marks clear and the release moves nothing (docs/DECISIONS.md,
 * 2026-09-24, "A drag whose own row leaves the list is void"). */

import type { DragHandlers, DragPort } from './types.js';

const indexOf = (el: Element | null): number => {
  const raw = (el as HTMLElement | null)?.dataset['index'];
  const n = raw == null ? NaN : parseInt(raw, 10);
  return Number.isNaN(n) ? -1 : n;
};

/* app.js 4467-4468: a band 120px deep either edge, speed growing linearly to
   22px a frame at the band's own inner edge. */
const EDGE = 120;
const EDGE_MAX = 22;

/**
 * The edge-scroll speed for a pointer at `y` in a window `innerHeight` tall -
 * the live `edgeScroll`'s arithmetic (app.js 4470-4474), pulled out pure so a
 * test can hit three depths without a real scroll.
 */
export function edgeSpeed(y: number, innerHeight: number): number {
  const depth = y < EDGE ? y - EDGE : y > innerHeight - EDGE ? y - (innerHeight - EDGE) : 0;
  return depth ? Math.round(EDGE_MAX * Math.max(-1, Math.min(1, depth / EDGE))) : 0;
}

export function nativeDrag(): DragPort {
  return {
    bind(container, handlers: DragHandlers) {
      let from = -1;
      let gap = -1;
      let zone: { mids: number[]; top: number; bottom: number } | null = null;
      let speed = 0;
      let frame = 0;
      /* The grip the drag started from, and whether its row has left. */
      let source: Element | null = null;
      let gone = false;

      /* Runs off the frame rather than off the mouse, so it keeps going while
         the hand is still (app.js 4467-4469). */
      const step = (): void => {
        frame = 0;
        if (from < 0 || !speed) return;
        window.scrollBy(0, speed);
        frame = requestAnimationFrame(step);
      };

      const stopScroll = (): void => {
        speed = 0;
        if (frame) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      };

      /* Capturing, and bound only while a drag is live: the pointer spends
         most of a drag over the gaps between rows, where a row-level
         `dragover` would return early - both the edge-scroll and the gap
         resolution below have to be driven from every `dragover`, not only
         the ones that land on a row (app.js 4483-4485, and
         docs/specs/FEATURES.md, "Lists"). Bound to `dragenter` too: a drop is
         accepted only while `preventDefault()` runs on both events, and a
         row's own children - thumbnail, inputs, note - are what the pointer
         crosses into on the way through. `onDocOver` is idempotent already,
         so the extra calls cost nothing. */
      const onDocOver = (e: Event): void => {
        const clientY = (e as DragEvent).clientY;
        speed = edgeSpeed(clientY, window.innerHeight);
        if (speed && !frame) frame = requestAnimationFrame(step);
        if (from >= 0 && source && !source.isConnected) {
          stopScroll();
          e.preventDefault();
          const gdt = (e as DragEvent).dataTransfer;
          if (gdt) gdt.dropEffect = 'none';
          if (!gone) {
            gone = true;
            gap = -1;
            handlers.onOver?.(-1, null);
            handlers.onEnd?.();
          }
          return;
        }
        if (from < 0 || !zone) return;
        const y = clientY + window.scrollY;
        const inside = y >= zone.top && y <= zone.bottom;
        /* A cancelled event with `dropEffect = 'none'` refuses the drop outside
           the zone, over an editable field too, which would otherwise take the
           row's `text/plain` index as text. */
        e.preventDefault();
        const dt = (e as DragEvent).dataTransfer;
        if (dt) dt.dropEffect = inside ? 'move' : 'none';
        let next = -1;
        if (inside) {
          let g = 0;
          for (const mid of zone.mids) if (mid < y) g++;
          next = g === from || g === from + 1 ? -1 : g;
        }
        if (next === gap) return;
        gap = next;
        if (gap < 0) handlers.onOver?.(-1, null);
        else if (gap < from) handlers.onOver?.(gap, 'before');
        else handlers.onOver?.(gap - 1, 'after');
      };

      /* The same capturing document listener as `onDocOver`: every position
         the highlight promises must also accept a release, including the
         band above the first row and below the last, which a container-level
         `drop` could never see. */
      const onDocDrop = (e: Event): void => {
        stopScroll();
        if (from >= 0 && gap >= 0 && !gone) {
          e.preventDefault();
          handlers.onDrop(from, gap > from ? gap - 1 : gap);
        } else if (from >= 0) e.preventDefault();
        reset();
      };

      const onDragEnd = (): void => {
        reset();
      };

      const unlisten = (): void => {
        document.removeEventListener('dragover', onDocOver, true);
        document.removeEventListener('dragenter', onDocOver, true);
        document.removeEventListener('drop', onDocDrop, true);
        document.removeEventListener('dragstart', onDocStart, true);
        source?.removeEventListener('dragend', onDragEnd);
        source = null;
        stopScroll();
      };

      const reset = (): void => {
        unlisten();
        from = -1;
        gap = -1;
        zone = null;
        gone = false;
        handlers.onEnd?.();
      };

      /* A new drag of any kind, text out of a note included, ends a stale
         one before the container's own `onStart` runs. */
      const onDocStart = (): void => {
        reset();
      };

      /* app.js 4452-4454: only a grip starts a drag. A row also holds a
         thumbnail, a note textarea and number inputs, every one of them
         natively draggable content - without this guard, dragging a thumbnail
         or a run of selected text out of the note starts a row reorder
         instead of the browser's own drag. */
      const onStart = (e: Event): void => {
        const grip = (e.target as HTMLElement).closest('[data-drag]');
        if (!grip) return;
        const row = grip.closest('[data-index]');
        from = indexOf(row);
        gap = -1;
        const boxes = Array.from(container.querySelectorAll<HTMLElement>('[data-index]')).map(
          (r) => r.getBoundingClientRect()
        );
        const y0 = window.scrollY;
        const rowGap =
          boxes.length > 1 ? Math.max(0, (boxes[1]?.top ?? 0) - (boxes[0]?.bottom ?? 0)) : 0;
        zone = {
          mids: boxes.map((b) => b.top + b.height / 2 + y0),
          top: (boxes[0]?.top ?? 0) + y0 - rowGap,
          bottom: (boxes[boxes.length - 1]?.bottom ?? 0) + y0 + rowGap
        };
        const dt = (e as DragEvent).dataTransfer;
        if (dt) {
          dt.effectAllowed = 'move';
          try {
            /* Firefox will not start a drag unless something is set */
            dt.setData('text/plain', String(from));
          } catch {
            /* Nothing more to do when even that throws. */
          }
          /* app.js 4459: guarded there because `setDragImage` is missing on
             some real browsers even though lib.dom types it as always
             present. */
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (row && dt.setDragImage) dt.setDragImage(row, 24, 24);
        }
        handlers.onDrag?.(from);
        /* A grip another tab's write removed still gets its `dragend`, which
           no longer bubbles to the container. */
        source = grip;
        source.addEventListener('dragend', onDragEnd);
        document.addEventListener('dragover', onDocOver, true);
        document.addEventListener('dragenter', onDocOver, true);
        document.addEventListener('drop', onDocDrop, true);
        document.addEventListener('dragstart', onDocStart, true);
      };

      container.addEventListener('dragstart', onStart);
      container.addEventListener('dragend', onDragEnd);

      return () => {
        container.removeEventListener('dragstart', onStart);
        container.removeEventListener('dragend', onDragEnd);
        unlisten();
      };
    }
  };
}

/** Binds nothing. For tests, and for anywhere dragging makes no sense. */
export function noDrag(): DragPort {
  return { bind: () => () => undefined };
}

/**
 * Exposes the bound handlers directly, with no DOM events at all.
 *
 * jsdom has no drag events to dispatch, and a component test does not need
 * them: what matters is that the component wires `onDrop` up to the right
 * call, which this lets a test prove by invoking `.handlers.onDrop(from, to)`
 * itself once the component has mounted and bound it.
 */
export function fakeDrag(): DragPort & { handlers: DragHandlers | null } {
  const port: DragPort & { handlers: DragHandlers | null } = {
    handlers: null,
    bind(_container, handlers) {
      port.handlers = handlers;
      return () => {
        port.handlers = null;
      };
    }
  };
  return port;
}
