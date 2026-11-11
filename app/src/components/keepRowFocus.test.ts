/* The focus a removed row leaves behind (docs/specs/FEATURES.md, rule 20): the tick of the
   row now at the same place, else the last row's, else the bar's clear control. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { keepRowFocus } from './keepRowFocus.js';

const OPTIONS = { row: '.row', tick: '.selbox input' };

afterEach(() => {
  document.body.replaceChildren();
  vi.useRealTimers();
});

/* The rows `a`, `b`, ... in one container, and a bar with its clear control. */
function page(ids: string): { list: HTMLElement; tick: (id: string) => HTMLInputElement } {
  const list = document.createElement('div');
  for (const id of ids) {
    const row = document.createElement('div');
    row.className = 'row';
    row.dataset['id'] = id;
    row.innerHTML = '<label class="selbox"><input type="checkbox" /></label>';
    list.append(row);
  }
  const bar = document.createElement('section');
  bar.className = 'selbarwrap';
  bar.innerHTML =
    '<span class="selclear"><button type="button">Снять выделение</button></span>';
  document.body.append(list, bar);
  const tick = (id: string): HTMLInputElement =>
    list.querySelector(`[data-id="${id}"] input`) as HTMLInputElement;
  return { list, tick };
}

const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

describe('keepRowFocus', () => {
  it('moves the focus to the row now at the same place', async () => {
    const { list, tick } = page('abcde');
    const kept = keepRowFocus(list, OPTIONS);
    tick('c').focus();
    list.querySelector('[data-id="c"]')?.remove();
    expect(document.body).toHaveFocus();
    await flush();
    expect(tick('d')).toHaveFocus();
    kept.destroy();
  });

  it('takes the last row when the removed one was last', async () => {
    const { list, tick } = page('abc');
    const kept = keepRowFocus(list, OPTIONS);
    tick('c').focus();
    list.querySelector('[data-id="c"]')?.remove();
    await flush();
    expect(tick('b')).toHaveFocus();
    kept.destroy();
  });

  it('takes the bar when no row is left', async () => {
    const { list, tick } = page('a');
    const kept = keepRowFocus(list, OPTIONS);
    tick('a').focus();
    list.querySelector('[data-id="a"]')?.remove();
    await flush();
    expect(document.querySelector('.selclear button')).toHaveFocus();
    kept.destroy();
  });

  it('takes the bar when the container leaves with the last row', () => {
    vi.useFakeTimers();
    const { list, tick } = page('a');
    const kept = keepRowFocus(list, OPTIONS);
    tick('a').focus();
    list.remove();
    kept.destroy();
    vi.runAllTimers();
    expect(document.querySelector('.selclear button')).toHaveFocus();
  });

  it('leaves the focus alone once it moved to another control', async () => {
    const { list, tick } = page('abc');
    const kept = keepRowFocus(list, OPTIONS);
    tick('b').focus();
    const bar = document.querySelector<HTMLElement>('.selclear button');
    bar?.focus();
    list.querySelector('[data-id="b"]')?.remove();
    await flush();
    expect(bar).toHaveFocus();
    kept.destroy();
  });

  it('leaves the focus alone when the page is leaving and has no bar', () => {
    vi.useFakeTimers();
    const { list, tick } = page('a');
    const kept = keepRowFocus(list, OPTIONS);
    tick('a').focus();
    document.querySelector('.selbarwrap')?.remove();
    list.remove();
    kept.destroy();
    vi.runAllTimers();
    expect(document.body).toHaveFocus();
  });

  it('leaves a focus that is not on a tick alone', async () => {
    const { list } = page('abc');
    const kept = keepRowFocus(list, OPTIONS);
    const other = document.createElement('button');
    list.append(other);
    other.focus();
    list.querySelector('[data-id="a"]')?.remove();
    await flush();
    expect(other).toHaveFocus();
    kept.destroy();
  });
});
