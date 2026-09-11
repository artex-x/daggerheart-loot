/* Reordering by dragging, off the live event model (app.js 4443-4530).
 *
 * The grip is what a person grabs; the whole row is what moves - dragging a
 * small handle and dropping on a big target is easier than the other way
 * round. A line marks where the entry would land, above or below the pointer's
 * own midpoint, and the page scrolls itself from either edge so a drag past
 * the fold does not have to fight the browser's own few-pixel scroll strip.
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
 * CSS - so the port cannot toggle a class itself. */

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
      let mark: { over: number; where: 'before' | 'after' } | null = null;
      let speed = 0;
      let frame = 0;

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
         most of a drag over the gaps between rows, where the bubbling
         `dragover` below returns early - the scroll has to be driven from
         every `dragover`, not only the ones that land on a row (app.js
         4483-4485). */
      const onDocOver = (e: Event): void => {
        speed = edgeSpeed((e as DragEvent).clientY, window.innerHeight);
        if (speed && !frame) frame = requestAnimationFrame(step);
      };

      const reset = (): void => {
        document.removeEventListener('dragover', onDocOver, true);
        stopScroll();
        from = -1;
        mark = null;
        handlers.onEnd?.();
      };

      const onStart = (e: Event): void => {
        const row = (e.target as HTMLElement).closest('[data-index]');
        from = indexOf(row);
        mark = null;
        const dt = (e as DragEvent).dataTransfer;
        if (dt) {
          dt.effectAllowed = 'move';
          try {
            /* Firefox will not start a drag unless something is set */
            dt.setData('text/plain', String(from));
          } catch {
            /* Nothing more to do when even that throws. */
          }
          if (row) dt.setDragImage(row, 24, 24);
        }
        handlers.onDrag?.(from);
        document.addEventListener('dragover', onDocOver, true);
      };

      /* Without preventDefault on dragover the drop never fires at all - the
         browser's default is to refuse the drop. */
      const onOver = (e: Event): void => {
        const row = (e.target as HTMLElement).closest('[data-index]');
        if (!row) return;
        e.preventDefault();
        const dt = (e as DragEvent).dataTransfer;
        if (dt) dt.dropEffect = 'move';
        const over = indexOf(row);
        if (over === from) {
          mark = null;
          handlers.onOver?.(over, null);
          return;
        }
        const box = row.getBoundingClientRect();
        const where: 'before' | 'after' =
          (e as DragEvent).clientY < box.top + box.height / 2 ? 'before' : 'after';
        mark = { over, where };
        handlers.onOver?.(over, where);
      };

      const onDragEnd = (): void => {
        reset();
      };

      const onDrop = (e: Event): void => {
        e.preventDefault();
        stopScroll();
        const start = from;
        const at = mark;
        if (start >= 0 && at) {
          let to = at.over;
          if (at.where === 'after' && to < start) to += 1;
          if (at.where === 'before' && to > start) to -= 1;
          if (to !== start) handlers.onDrop(start, to);
        }
        reset();
      };

      container.addEventListener('dragstart', onStart);
      container.addEventListener('dragover', onOver);
      container.addEventListener('drop', onDrop);
      container.addEventListener('dragend', onDragEnd);

      return () => {
        container.removeEventListener('dragstart', onStart);
        container.removeEventListener('dragover', onOver);
        container.removeEventListener('drop', onDrop);
        container.removeEventListener('dragend', onDragEnd);
        document.removeEventListener('dragover', onDocOver, true);
        stopScroll();
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
