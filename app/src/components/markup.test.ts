/* Markup.svelte and MarkupInline.svelte: formatted text drawn as elements, never as
 * HTML from the source (docs/specs/FEATURES.md, "Records", "Formatted text"). */
import { cleanup, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import Markup from './Markup.svelte';
import MarkupInline from './MarkupInline.svelte';
import { parseMarkup } from '../lib/markup.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

/** Returns the element markup of `el` with Svelte's anchor comments removed. */
const html = (el: Element): string => el.innerHTML.replace(/<!--[^>]*-->/g, '');

const ALL = [
  '***Name:*** text with **bold** and *italic*',
  '- *one*',
  '- two',
  '3. three',
  '4. four',
  '| Roll | **Answer** |',
  '|---|---|',
  '| 1 |'
].join('\n');

describe('the formatted text', () => {
  it('draws every block as its element, with no whitespace between the tags', async () => {
    const { container } = render(Markup, { blocks: parseMarkup(ALL) });
    expect(html(container)).toBe(
      '<p><b><i>Name:</i></b> text with <b>bold</b> and <i>italic</i></p>' +
        '<ul><li><i>one</i></li><li>two</li></ul>' +
        '<ol start="3"><li>three</li><li>four</li></ol>' +
        '<table><thead><tr><th scope="col">Roll</th><th scope="col"><b>Answer</b></th></tr></thead>' +
        '<tbody><tr><td>1</td><td></td></tr></tbody></table>'
    );
    await expectNoA11yViolations(container);
  });

  it('writes markup characters of the source as text', async () => {
    const { container } = render(Markup, { blocks: parseMarkup('<b>x</b> & *<i>y</i>*') });
    expect(container.querySelectorAll('b')).toHaveLength(0);
    expect(container.querySelector('i')?.textContent).toBe('<i>y</i>');
    expect(container.textContent).toBe('<b>x</b> & <i>y</i>');
    await expectNoA11yViolations(container);
  });

  it('draws a head-only table as one row of plain cells', async () => {
    const { container } = render(Markup, { blocks: parseMarkup('| a | b |\n|---|---|') });
    expect(html(container)).toBe('<table><tbody><tr><td>a</td><td>b</td></tr></tbody></table>');
    expect(container.querySelector('th, thead')).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('draws an empty text as one empty paragraph', () => {
    const { container } = render(Markup, { blocks: parseMarkup('') });
    expect(html(container)).toBe('<p></p>');
  });
});

describe('the lead', () => {
  const lead = createRawSnippet(() => ({ render: () => '<i>Set:</i>' }));

  it('heads the first paragraph, then one space', async () => {
    const { container } = render(Markup, { blocks: parseMarkup('Bonus.\n- more'), lead });
    expect(html(container)).toBe('<p><i>Set:</i> Bonus.</p><ul><li>more</li></ul>');
    await expectNoA11yViolations(container);
  });

  it('takes a paragraph of its own before a text that opens with a list', () => {
    const { container } = render(Markup, { blocks: parseMarkup('- one'), lead });
    expect(html(container)).toBe('<p><i>Set:</i></p><ul><li>one</li></ul>');
  });
});

describe('the inline runs', () => {
  it('nests bold and italic as written, with no span', () => {
    const { container } = render(MarkupInline, {
      c: [
        { t: 'text', v: 'a ' },
        { t: 'b', c: [{ t: 'i', c: [{ t: 'text', v: 'b' }] }] }
      ]
    });
    expect(html(container)).toBe('a <b><i>b</i></b>');
    expect(container.querySelector('span')).toBeNull();
  });

  it('draws a space between two marked runs inside the first, so a name keeps it', () => {
    const [first] = parseMarkup('***Свет:*** **Потратьте Надежду**, чтобы');
    const { container } = render(MarkupInline, { c: first?.t === 'p' ? first.c : [] });
    expect(html(container)).toBe('<b><i>Свет: </i></b><b>Потратьте Надежду</b>, чтобы');
    expect(container.textContent).toBe('Свет: Потратьте Надежду, чтобы');
  });
});
