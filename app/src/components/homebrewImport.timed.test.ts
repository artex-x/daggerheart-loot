/* The homebrew import case that passed the 30 s test timeout under host load
   (2026-10-07, a 682 s vitest run). It runs in the `timed` vitest project, one
   file at a time after the parallel files (vite.config.mts), so another
   worker's load does not decide it. docs/specs/FEATURES.md, "Homebrew". */
import { cleanup, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../test/a11y.js';
import { choose, doc, importButton, keyN, opened, rowsOf } from '../test/homebrewImport.js';

afterEach(cleanup);

describe('the import panel', () => {
  it('draws 20 rows of 60 sources, then «и ещё 40 источников» and «свернуть»', async () => {
    const { container } = await opened('gm2');
    const books = Array.from({ length: 60 }, (_, i) => ({
      key: keyN(i),
      ru: 'Источник ' + String(i)
    }));
    const items = books.map((b, i) => ({
      key: keyN(1000 + i),
      book: b.key,
      kind: 'item',
      ru: 'П' + String(i)
    }));
    choose(container, doc({ books, items }));
    await importButton(60);
    expect(rowsOf(container)).toHaveLength(20);
    const more = screen.getByRole('button', { name: 'и ещё 40 источников' });
    await userEvent.click(more);
    expect(rowsOf(container)).toHaveLength(60);
    expect(screen.getByRole('button', { name: 'свернуть' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    await expectNoA11yViolations(container);
  });
});
