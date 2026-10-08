/* The offer rule on #/tables/homebrew at three times the own-item limit, in the `timed`
 * project: the bound is a time (vite.config.mts, `timed`). */

import { describe, expect, it } from 'vitest';
import { plainFacets } from './data.js';
import { dict } from './dict.js';
import { facetRows, narrowRows } from './facets.js';
import { ownAtScale } from '../test/facets.js';

describe('the offer rule at three times the own-item limit', () => {
  it('offers the rows of 300 own items in under 100 ms', () => {
    const { index, source, shown } = ownAtScale(300);
    const t = dict('ru');
    const start = performance.now();
    const rows = narrowRows(
      facetRows(index, 'homebrew', t, 'ru', source),
      shown,
      (it, g) => plainFacets(it)[g] ?? ''
    );
    expect(performance.now() - start).toBeLessThan(100);
    expect(rows.map((r) => r.group)).toEqual(['kind', 'sect']);
  });
});
