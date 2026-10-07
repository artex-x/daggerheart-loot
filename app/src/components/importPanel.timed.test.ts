/* The import report's timing bound: 1000 lists read and drawn in under
   3000 ms. It runs in the `timed` vitest project, one file at a time after
   the parallel files (vite.config.mts), so the bound measures this process,
   not eight workers on four cores. docs/specs/FEATURES.md, "Lists". */
import { cleanup, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { choose, doc, importButton, opened, utf8 } from '../test/importPanel.js';

afterEach(cleanup);

describe('the report past 20 lists', () => {
  it('draws 20 list blocks, then «и ещё N списков», for 1000 lists with skips', async () => {
    const { container } = await opened();
    /* The bound times the read and the render of 1000 lists, not the single pass over the
       skips: a per-list scan of these 2000 skips also stays under it. */
    const lists = Array.from({ length: 1000 }, (_, i) => ({
      name: 'Список ' + String(i),
      entries: [{ id: 'ci1' }, { id: 'ci1' }, { id: 'zzz' + String(i) }]
    }));
    const started = performance.now();
    choose(container, utf8(doc(lists)));
    await importButton(1000);
    expect(container.querySelectorAll('.rep-list')).toHaveLength(20);
    const more = screen.getByRole('button', { name: 'и ещё 980 списков' });
    expect(performance.now() - started).toBeLessThan(3000);
    await userEvent.click(more);
    expect(container.querySelectorAll('.rep-list')).toHaveLength(1000);
    await userEvent.click(screen.getByRole('button', { name: 'свернуть' }));
    expect(container.querySelectorAll('.rep-list')).toHaveLength(20);
  });
});
