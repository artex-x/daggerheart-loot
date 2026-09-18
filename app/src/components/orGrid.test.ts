/* OrGrid.svelte on its own - the shared instrument three of the four roll
 * call sites route their cards through (StdPanel.svelte:157, AltPanel.svelte:228,
 * ListPage.svelte:676; RollPanel's own single card is its own component's
 * problem, not this one's).
 *
 * `{#key cell.it}` keys a cell on the item itself rather than on its slot, so
 * a different record at the same position gets a new DOM node - the live app
 * rebuilds `#view.innerHTML` on every render, so its `<img>` is always a new
 * one that paints empty and fills. Positional keying let Svelte patch the
 * existing node's `src` in place instead, and the previous artwork sat on
 * screen until the new one decoded - a transient no settled screenshot can
 * see, which is why no parity state caught it (issue 47).
 *
 * A plain object stands in for a record: OrGrid only ever touches `.it` as an
 * opaque identity, and a real `Record_` would just be noise here. */
import { cleanup, render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import OrGrid from './OrGrid.svelte';

afterEach(cleanup);

interface Item {
  id: string;
}

/** One `<img>` per item, tagged with the id - node identity is what this
 *  checks, not any text a person would read.
 *
 *  Typed `[unknown]`, not `[Item]`: `OrGrid`'s own generic resolves to
 *  `unknown` through `render()`'s props, and a `Snippet<[Item]>` is not
 *  assignable there - a snippet's parameter is contravariant, so one that
 *  only accepts `Item` cannot stand in for one that must accept anything. */
const card = createRawSnippet<[unknown]>((getIt) => ({
  render: () => `<img data-id="${(getIt() as Item).id}">`
}));

describe('a cell keyed on the item it holds', () => {
  it('gets a new node when a different record lands in the same slot', async () => {
    const { container, rerender } = render(OrGrid, { or: 'или', items: [{ id: 'a' }], card });
    const before = container.querySelector('img[data-id="a"]');
    expect(before).toBeInTheDocument();

    await rerender({ or: 'или', items: [{ id: 'b' }], card });
    expect(container.querySelector('img[data-id="b"]')).toBeInTheDocument();
    /* Node identity, not a re-query: the old element itself must be gone from
       the document, or a component that merely updated `src` in place would
       pass this test too. */
    expect(before?.isConnected).toBe(false);
  });

  it('keeps the node when the same record comes up again - the one recorded deviation from live', async () => {
    /* "Same record" means the same object, the way a real roll hands OrGrid
       the very row it read off `rows[n-1]` both times - StdPanel and ListPage
       do that; AltPanel does not (its AltPick is a fresh wrapper every roll,
       so it gets a new node regardless, which matches live). Live rebuilds
       unconditionally, so it would swap the node here too; this fix does
       not, because nothing on screen differs (the image is identical) and a
       roll counter to force it would be a bigger change than the defect. */
    const a = { id: 'a' };
    const { container, rerender } = render(OrGrid, { or: 'или', items: [a], card });
    const before = container.querySelector('img[data-id="a"]');

    await rerender({ or: 'или', items: [a], card });
    expect(container.querySelector('img[data-id="a"]')).toBe(before);
  });
});
