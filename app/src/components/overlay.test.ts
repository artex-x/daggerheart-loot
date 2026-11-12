import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { focusBack, inWindow, openOverlay } from './overlay.js';

const rect = (top: number, bottom: number, left = 100, right = 180): DOMRect =>
  ({ top, bottom, left, right, width: right - left, height: bottom - top }) as DOMRect;

/* jsdom lays nothing out: the boxes get the sizes a browser would measure. */
function setup(at: DOMRect, size: { h: number; w: number }) {
  const control = document.createElement('button');
  const box = document.createElement('div');
  document.body.append(control, box);
  control.getBoundingClientRect = () => at;
  Object.defineProperty(box, 'offsetHeight', { configurable: true, get: () => size.h });
  Object.defineProperty(box, 'offsetWidth', { configurable: true, get: () => size.w });
  return { control, box };
}

/* jsdom has no popover: a stand-in that keeps the open state. */
function popover(box: HTMLElement): { shown: () => boolean } {
  let shown = false;
  box.showPopover = () => {
    shown = true;
  };
  box.hidePopover = () => {
    shown = false;
  };
  box.matches = ((q: string) => (q === ':popover-open' ? shown : false)) as typeof box.matches;
  return { shown: () => shown };
}

beforeEach(() => {
  vi.stubGlobal('innerHeight', 700);
  Object.defineProperty(document.documentElement, 'clientWidth', {
    configurable: true,
    value: 1000
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
  document.documentElement.style.removeProperty('--overlay-clear');
});

describe('openOverlay', () => {
  it('keeps the box where its CSS puts it when the browser has no popover', () => {
    const { control, box } = setup(rect(100, 140), { h: 200, w: 220 });
    const stop = openOverlay(box, control);
    expect(box.style.top).toBe('');
    expect(box.hasAttribute('popover')).toBe(false);
    expect(stop).not.toThrow();
  });

  it('opens down in the top layer when the room below holds the box', () => {
    const { control, box } = setup(rect(100, 140), { h: 200, w: 220 });
    const view = popover(box);
    const stop = openOverlay(box, control);
    expect(view.shown()).toBe(true);
    expect(box.getAttribute('popover')).toBe('manual');
    expect(box.dataset['side']).toBe('down');
    expect(box.style.top).toBe('148px');
    expect(box.style.left).toBe('16px');
    stop();
    expect(view.shown()).toBe(false);
  });

  it('opens up when only the room above holds the box', () => {
    const { control, box } = setup(rect(560, 600, 700, 780), { h: 300, w: 220 });
    popover(box);
    openOverlay(box, control);
    expect(box.dataset['side']).toBe('up');
    expect(box.style.top).toBe('252px');
    expect(box.style.left).toBe('560px');
  });

  it('takes the larger side and scrolls inside when neither side holds the box', () => {
    const { control, box } = setup(rect(300, 340), { h: 600, w: 220 });
    popover(box);
    openOverlay(box, control);
    expect(box.dataset['side']).toBe('down');
    expect(box.style.maxHeight).toBe('344px');
    expect(box.style.overflowY).toBe('auto');
  });

  it('aligns the left edge to the control on `start` and keeps a 16 px gutter', () => {
    const { control, box } = setup(rect(100, 140, 950, 990), { h: 100, w: 300 });
    popover(box);
    openOverlay(box, control, 'start');
    expect(box.style.left).toBe('684px');
  });

  it('lifts the toast above a box that reaches the bottom of the window, and lets it go', () => {
    const { control, box } = setup(rect(400, 440), { h: 200, w: 220 });
    popover(box);
    const stop = openOverlay(box, control);
    expect(document.documentElement.style.getPropertyValue('--overlay-clear')).toBe('260px');
    stop();
    expect(document.documentElement.style.getPropertyValue('--overlay-clear')).toBe('');
  });

  it('writes no clearance for a box clear of the bottom band', () => {
    const { control, box } = setup(rect(100, 140), { h: 200, w: 220 });
    popover(box);
    openOverlay(box, control);
    expect(document.documentElement.style.getPropertyValue('--overlay-clear')).toBe('');
  });
});

describe('the focus after an overlay', () => {
  it('stays put for a control in the window', () => {
    const { control } = setup(rect(100, 140), { h: 10, w: 10 });
    const focus = vi.spyOn(control, 'focus');
    expect(inWindow(control)).toBe(true);
    focusBack(control);
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('may scroll for a control outside the window', () => {
    const { control } = setup(rect(800, 840), { h: 10, w: 10 });
    const focus = vi.spyOn(control, 'focus');
    expect(inWindow(control)).toBe(false);
    focusBack(control);
    expect(focus).toHaveBeenCalledWith({ preventScroll: false });
  });

  it('does nothing without a control', () => {
    expect(() => {
      focusBack(null);
    }).not.toThrow();
  });
});
