/* The overlay rule (docs/specs/FEATURES.md, "Chrome"): a menu or a popover draws in the top
   layer, placed by the window's room around its control. Opening it never scrolls the page
   or the record dialog's card, and the box follows its control while either scrolls. */

/** The gap between a control and its overlay, and the window's inner margin. */
const GAP = 8;
/** The side gutter of an overlay: the 16 px of every caller. */
const GUTTER = 16;
/** A toast stays clear of an overlay that reaches into this band of the window's bottom. */
const TOAST_BAND = 80;

interface Window_ {
  top: number;
  bottom: number;
  width: number;
}

/** The window's visible area in layout coordinates: the visual viewport when there is one. */
function viewport(): Window_ {
  const vv = window.visualViewport;
  const top = vv?.offsetTop ?? 0;
  return {
    top,
    bottom: top + (vv?.height ?? window.innerHeight),
    width: document.documentElement.clientWidth
  };
}

/** The room the page header takes at the window's top while it is shown. */
function headerBottom(inDialog: boolean): number {
  if (inDialog) return 0;
  const bottom = document.querySelector('header.topbar')?.getBoundingClientRect().bottom ?? 0;
  return Math.max(0, bottom);
}

/** The room the selection bar and the print dock take at the window's bottom. */
function barsHeight(): number {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string): number => parseFloat(style.getPropertyValue(name)) || 0;
  return read('--selbar-h') + read('--pdock-h');
}

/**
 * Answers whether a control sits inside the window, clear of the shown header.
 *
 * @param el the control
 * @returns true when its box is wholly inside the window
 */
export function inWindow(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  const view = viewport();
  const top = view.top + headerBottom(!!el.closest('dialog[open]'));
  return rect.top >= top && rect.bottom <= view.bottom;
}

/**
 * Gives the focus back to a control without moving the page when the control is in view.
 *
 * @param el the control
 */
export function focusBack(el: HTMLElement | null | undefined): void {
  if (el) el.focus({ preventScroll: inWindow(el) });
}

/**
 * Shows `box` in the top layer beside `control` and keeps it placed.
 *
 * @param box the menu or popover element
 * @param control the button that opened it
 * @param align `end` puts the box's right edge on the control's, `start` the left edge
 * @returns the cleanup, which hides the box and removes the listeners
 */
export function openOverlay(
  box: HTMLElement,
  control: HTMLElement,
  align: 'start' | 'end' = 'end'
): () => void {
  /* jsdom has no popover: the box keeps its CSS place, as `Toast` does. */
  if (typeof box.showPopover !== 'function') return () => {};
  if (!box.hasAttribute('popover')) box.setAttribute('popover', 'manual');
  if (!box.matches(':popover-open')) box.showPopover();
  box.style.bottom = 'auto';
  box.style.right = 'auto';
  const root = document.documentElement;
  let wrote = false;

  function place(): void {
    const rect = control.getBoundingClientRect();
    const view = viewport();
    const inDialog = !!box.closest('dialog[open]');
    const topInset = view.top + GAP + headerBottom(inDialog);
    const bottomInset = GAP + barsHeight();
    box.style.maxHeight = '';
    box.style.overflowY = '';
    const h = box.offsetHeight;
    const below = view.bottom - bottomInset - (rect.bottom + GAP);
    const above = rect.top - GAP - topInset;
    const down = h <= below || (h > above && below >= above);
    const room = Math.max(0, Math.floor(down ? below : above));
    const shownH = Math.min(h, room);
    if (h > room) {
      box.style.maxHeight = `${String(room)}px`;
      box.style.overflowY = 'auto';
    }
    const top = down ? rect.bottom + GAP : rect.top - GAP - shownH;
    const width = box.offsetWidth;
    const wanted = align === 'end' ? rect.right - width : rect.left;
    const left = Math.max(GUTTER, Math.min(wanted, view.width - GUTTER - width));
    box.style.top = `${String(top)}px`;
    box.style.left = `${String(left)}px`;
    box.dataset['side'] = down ? 'down' : 'up';
    const reach = window.innerHeight - TOAST_BAND;
    if (top + shownH > reach) {
      root.style.setProperty('--overlay-clear', `${String(window.innerHeight - top + GAP)}px`);
      wrote = true;
    } else if (wrote) {
      root.style.removeProperty('--overlay-clear');
      wrote = false;
    }
  }

  let frame = 0;
  const schedule = (): void => {
    if (!frame) {
      frame = requestAnimationFrame(() => {
        frame = 0;
        place();
      });
    }
  };
  const onScroll = (e: Event): void => {
    if (e.target instanceof Node && box.contains(e.target)) return;
    schedule();
  };

  place();
  window.addEventListener('scroll', onScroll, { capture: true, passive: true });
  window.addEventListener('resize', schedule);
  window.visualViewport?.addEventListener('resize', schedule);
  window.visualViewport?.addEventListener('scroll', schedule);
  const watch = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : undefined;
  watch?.observe(box);

  return () => {
    window.removeEventListener('scroll', onScroll, { capture: true });
    window.removeEventListener('resize', schedule);
    window.visualViewport?.removeEventListener('resize', schedule);
    window.visualViewport?.removeEventListener('scroll', schedule);
    watch?.disconnect();
    if (frame) cancelAnimationFrame(frame);
    if (box.matches(':popover-open')) box.hidePopover();
    if (wrote) root.style.removeProperty('--overlay-clear');
  };
}
