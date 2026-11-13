/* The lines of an import report as the panel draws them equal `lineText`, the text the read
   API's file check gives for the same line (docs/specs/CONTRACTS.md section 6). */
import { cleanup, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import ImportLines from './ImportLines.svelte';
import { lineText } from '../lib/importReport.js';
import type { ReportLine } from '../lib/types.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

/* One line of each shape the two reports build. */
const LINES: ReportLine[] = [
  { text: 'A line of the file itself', path: 'extra' },
  { text: 'No position and no path' },
  { pos: 'Item 1', text: 'Only a position' },
  { pos: 'Item 2', item: 'ci1', text: 'A position and an item id' },
  { pos: 'Item 3', name: 'Premium Bedroll', text: 'A position and a name' },
  {
    pos: 'Item 4',
    name: 'Premium Bedroll',
    item: 'ci1',
    text: 'quantity 0 - out of the range',
    path: 'lists[0].entries[3].quantity'
  },
  { pos: 'Предмет 5', name: '«Лампа»', text: 'craft «zzz» - нет', path: 'items[4].craft[0]' }
];

describe('the lines of an import report', () => {
  it('draw the text lineText gives for each shape of line', () => {
    const { container } = render(ImportLines, { lines: LINES, more: () => '' });
    const drawn = [...container.querySelectorAll('li')].map((li) => li.textContent);
    expect(drawn).toEqual(LINES.map(lineText));
  });

  it('draw the first lines and then the count of the rest', async () => {
    const { container } = render(ImportLines, {
      lines: LINES,
      shown: 2,
      more: (n: number) => `and ${String(n)} more`
    });
    const drawn = [...container.querySelectorAll('li')].map((li) => li.textContent);
    expect(drawn).toEqual([
      ...LINES.slice(0, 2).map(lineText),
      `and ${String(LINES.length - 2)} more`
    ]);
    await expectNoA11yViolations(container);
  });
});
