import { afterEach, describe, expect, it, vi } from 'vitest';
import { watchStickyTop } from './stickyTop.js';

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

describe('watchStickyTop', () => {
  it('writes the real top at once, then once per frame after a scroll', () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (f: FrameRequestCallback) => frames.push(f));
    const el = document.createElement('aside');
    document.body.append(el);
    let top = 244;
    el.getBoundingClientRect = () => ({ top }) as DOMRect;
    const stop = watchStickyTop(el);
    expect(el.style.getPropertyValue('--real-top')).toBe('244px');
    top = 130;
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('scroll'));
    expect(frames).toHaveLength(1);
    frames[0]?.(0);
    expect(el.style.getPropertyValue('--real-top')).toBe('130px');
    stop();
  });

  it('never writes a negative top, and removes the property on cleanup', () => {
    const el = document.createElement('aside');
    document.body.append(el);
    el.getBoundingClientRect = () => ({ top: -20 }) as DOMRect;
    const stop = watchStickyTop(el);
    expect(el.style.getPropertyValue('--real-top')).toBe('0px');
    stop();
    expect(el.style.getPropertyValue('--real-top')).toBe('');
  });
});
