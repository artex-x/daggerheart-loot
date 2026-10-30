/* ArtWell.svelte on its own: the kind glyph alone for a record with no picture,
 * and the glyph under a picture that is still loading. Its five callers are
 * covered in record.test.ts, tables.test.ts, listsPage.test.ts and
 * artField.test.ts (DESIGN.md, "Cards"). */
import { cleanup, render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import ArtWell from './ArtWell.svelte';
import { ICONS } from '../lib/icons.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

const picture = createRawSnippet(() => ({ render: () => '<img src="/img/ci1.webp" alt="">' }));

describe('the art well', () => {
  it('draws the kind glyph alone, hidden from assistive technology', async () => {
    const { container } = render(ArtWell, { glyph: 'kindArmor' });
    expect(container.querySelector('img')).toBeNull();
    const svg = container.querySelector('.well svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg?.querySelector('path')).toHaveAttribute('d', ICONS.kindArmor.d);
    await expectNoA11yViolations(container);
  });

  it('keeps the glyph under a picture while it loads', async () => {
    const { container } = render(ArtWell, { glyph: 'kindWeapon', children: picture });
    const well = container.querySelector('.well');
    const svg = well?.querySelector('svg');
    const img = well?.querySelector('img');
    expect(img).toHaveAttribute('src', '/img/ci1.webp');
    expect(svg).toHaveAttribute('viewBox', '0 -960 960 960');
    expect(svg!.compareDocumentPosition(img!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await expectNoA11yViolations(container);
  });
});
