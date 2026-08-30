/* Reordering by dragging.
 *
 * Native HTML5 drag, as the plan asks for: thin first, and a library has to
 * earn its way past this. It can, later - that is what the port is for - but it
 * would have to beat something that costs one file and no bytes.
 *
 * Dragging is not the only way to reorder, and deliberately not the primary
 * one: every row carries a position field, so moving entry 40 to position 20 is
 * typing 20 rather than twenty presses, and it works from a keyboard. The pure
 * `moveEntry` in lib/lists.ts is what both paths call. */

import type { DragHandlers, DragPort } from './types.js';

const indexOf = (el: Element | null): number => {
  const raw = (el as HTMLElement | null)?.dataset['index'];
  const n = raw == null ? NaN : parseInt(raw, 10);
  return Number.isNaN(n) ? -1 : n;
};

export function nativeDrag(): DragPort {
  return {
    bind(container, handlers: DragHandlers) {
      let from = -1;

      const onStart = (e: Event): void => {
        const row = (e.target as HTMLElement).closest('[data-index]');
        from = indexOf(row);
        const dt = (e as DragEvent).dataTransfer;
        if (dt) {
          dt.effectAllowed = 'move';
          /* Firefox will not start a drag unless something is set */
          dt.setData('text/plain', String(from));
        }
      };

      /* Without preventDefault on dragover the drop never fires at all - the
         browser's default is to refuse the drop. */
      const onOver = (e: Event): void => {
        e.preventDefault();
      };

      const onDrop = (e: Event): void => {
        e.preventDefault();
        const row = (e.target as HTMLElement).closest('[data-index]');
        const to = indexOf(row);
        if (from >= 0 && to >= 0 && from !== to) handlers.onDrop(from, to);
        from = -1;
      };

      container.addEventListener('dragstart', onStart);
      container.addEventListener('dragover', onOver);
      container.addEventListener('drop', onDrop);

      return () => {
        container.removeEventListener('dragstart', onStart);
        container.removeEventListener('dragover', onOver);
        container.removeEventListener('drop', onDrop);
      };
    }
  };
}

/** Binds nothing. For tests, and for anywhere dragging makes no sense. */
export function noDrag(): DragPort {
  return { bind: () => () => undefined };
}
