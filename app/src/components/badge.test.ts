/* Badge.svelte on its own - the base rule and the nine variants are exercised
 * end to end already (record.test.ts, tables.test.ts, listsPage.test.ts), so
 * this file only has to prove the one thing none of those callers vary
 * together: a badge with a title and one without, since both shapes are real
 * (`cardBadges`'s `uniq` entry carries one, `src` never does). */
import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import Badge from './Badge.svelte';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

/** `Badge`'s own `children` snippet takes no argument - `{@render
 *  children()}` - so the text is closed over rather than read off a getter,
 *  unlike `OrGrid`'s per-item snippet in orGrid.test.ts. */
const textOf = (s: string) => createRawSnippet(() => ({ render: () => `<span>${s}</span>` }));

describe('the record badge', () => {
  it('carries the variant as a second class, and no title by default', async () => {
    const { container } = render(Badge, { cls: 'src', children: textOf('Core') });
    const el = screen.getByText('Core').closest('.badge');
    expect(el).toHaveClass('badge', 'src');
    expect(el).not.toHaveAttribute('title');
    await expectNoA11yViolations(container);
  });

  it('carries a hover title when given one', async () => {
    const { container } = render(Badge, {
      cls: 'uniq',
      title: 'Единственный в своём роде',
      children: textOf('Уникальное')
    });
    const el = screen.getByText('Уникальное').closest('.badge');
    expect(el).toHaveAttribute('title', 'Единственный в своём роде');
    await expectNoA11yViolations(container);
  });

  it('follows a variant and a title that change under it', async () => {
    /* A card's own badges never do this - `cardBadges` runs once per record -
       but the roll die badge's `cls` swaps between "hope" and "fear" on the
       same mounted card as a new roll lands, so the update path is real. */
    const { rerender } = render(Badge, { cls: 'hope', children: textOf('Надежда') });
    let el = screen.getByText('Надежда').closest('.badge');
    expect(el).toHaveClass('badge', 'hope');
    expect(el).not.toHaveAttribute('title');

    await rerender({ cls: 'fear', title: 'Страх', children: textOf('Страх') });
    el = screen.getByText('Страх').closest('.badge');
    expect(el).toHaveClass('badge', 'fear');
    expect(el).not.toHaveClass('hope');
    expect(el).toHaveAttribute('title', 'Страх');
  });
});
