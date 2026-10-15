/* The toolbar's text edits: one case per rule, then a property over the wraps - the
   markers an edit writes always pair up in the parse. */

import { describe, expect, it } from 'vitest';
import { inlineText, parseMarkup, type MarkupBlock } from './markup.js';
import { fits, insertTable, toggleList, toggleMark, type MarkupEdit } from './markupEdit.js';

/* A null edit leaves the value as it is. */
const applied = (value: string, e: MarkupEdit | null): string =>
  e ? value.slice(0, e.from) + e.text + value.slice(e.to) : value;
const picked = (value: string, e: MarkupEdit | null): string => {
  const v = applied(value, e);
  return e ? v.slice(e.sel[0], e.sel[1]) : '';
};
const must = (e: MarkupEdit | null): MarkupEdit => {
  if (!e) throw new Error('The edit is null. Expected an edit for this selection');
  return e;
};

describe('bold and italic', () => {
  it('wrapsTheSelectionInBold', () => {
    const e = toggleMark('a long rest', 2, 6, '**');
    expect(applied('a long rest', e)).toBe('a **long** rest');
    expect(picked('a long rest', e)).toBe('long');
    expect(applied('ab', toggleMark('ab', 1, 2, '*'))).toBe('a*b*');
  });

  it('unwrapsAWrappedSelection', () => {
    const v = 'a **long** rest';
    expect(applied(v, toggleMark(v, 4, 8, '**'))).toBe('a long rest');
    /* The markers inside the selection count too. */
    expect(applied(v, toggleMark(v, 2, 10, '**'))).toBe('a long rest');
    const i = 'an *aside* here';
    expect(applied(i, toggleMark(i, 4, 9, '*'))).toBe('an aside here');
  });

  it('keepsSpacesOutsideTheMarkers', () => {
    const v = 'a long rest';
    const e = toggleMark(v, 1, 7, '**');
    expect(applied(v, e)).toBe('a **long** rest');
    expect(picked(v, e)).toBe('long');
  });

  it('insertsEmptyMarkersAtTheCaret', () => {
    const e = must(toggleMark('ab', 1, 1, '**'));
    expect(applied('ab', e)).toBe('a****b');
    expect(e.sel).toEqual([3, 3]);
    expect(applied('ab', toggleMark('ab', 1, 1, '*'))).toBe('a**b');
  });

  it('turnsBoldItalicIntoBoldWhenItalicIsRemoved', () => {
    const v = '***x***';
    expect(applied(v, toggleMark(v, 3, 4, '*'))).toBe('**x**');
    expect(applied(v, toggleMark(v, 3, 4, '**'))).toBe('*x*');
    /* Italic on "a b", then Bold on "a", then Italic off "a b". */
    const nested = '***a** b*';
    expect(applied(nested, toggleMark(nested, 3, 8, '*'))).toBe('**a** b');
    expect(applied(nested, toggleMark(nested, 3, 4, '**'))).toBe('*a b*');
  });

  it('makesNoEditWhenOneEndTouchesAMark', () => {
    /* A word at the edge of a formatted phrase: a wrap would leave its stars as text. */
    expect(toggleMark('**spend a Hope** to', 10, 14, '**')).toBeNull();
    expect(toggleMark('*Reliable:* +1', 1, 9, '*')).toBeNull();
    expect(toggleMark('**a**b', 5, 6, '**')).toBeNull();
    expect(toggleMark('**a**b', 5, 6, '*')).toBeNull();
  });

  it('wrapsEachLineOfAMultiLineSelection', () => {
    const v = 'one\n\n  two ';
    const e = toggleMark(v, 0, v.length, '**');
    expect(applied(v, e)).toBe('**one**\n\n  **two** ');
  });
});

describe('lists', () => {
  it('prefixesEachLineAsAList', () => {
    const v = 'one\ntwo\n\nthree';
    expect(applied(v, toggleList(v, 1, 6, 'ul'))).toBe('- one\n- two\n\nthree');
    /* The caret's own line, with no selection. */
    expect(applied(v, toggleList(v, 14, 14, 'ul'))).toBe('one\ntwo\n\n- three');
    /* A selection that ends at a line start leaves that line out. */
    expect(applied(v, toggleList(v, 0, 4, 'ul'))).toBe('- one\ntwo\n\nthree');
    /* An empty line keeps its emptiness, an empty box starts a list. */
    expect(applied(v, toggleList(v, 0, v.length, 'ul'))).toBe('- one\n- two\n\n- three');
    expect(applied('', toggleList('', 0, 0, 'ul'))).toBe('- ');
  });

  it('removesAPrefixEveryLineCarries', () => {
    const v = '- one\n\n- two';
    expect(applied(v, toggleList(v, 0, v.length, 'ul'))).toBe('one\n\ntwo');
    const mixed = '- one\ntwo';
    expect(applied(mixed, toggleList(mixed, 0, mixed.length, 'ul'))).toBe('- one\n- two');
  });

  it('numbersLinesFromOne', () => {
    const v = 'one\n\ntwo\nthree';
    expect(applied(v, toggleList(v, 0, v.length, 'ol'))).toBe('1. one\n\n2. two\n3. three');
    const n = '1. one\n12. two';
    expect(applied(n, toggleList(n, 0, n.length, 'ol'))).toBe('one\ntwo');
  });

  it('replacesTheOtherListPrefix', () => {
    const v = '- one\n- two';
    expect(applied(v, toggleList(v, 0, v.length, 'ol'))).toBe('1. one\n2. two');
    const n = '1. one\n2. two';
    expect(applied(n, toggleList(n, 0, n.length, 'ul'))).toBe('- one\n- two');
  });
});

describe('the table and the cap', () => {
  it('insertsATableOnANewLine', () => {
    const head = ['Столбец 1', 'Столбец 2'] as const;
    const e = insertTable('text', 2, 2, head);
    expect(applied('text', e)).toBe('text\n| Столбец 1 | Столбец 2 |\n|---|---|\n|  |  |');
    expect(picked('text', e)).toBe('Столбец 1');
    expect(applied('', insertTable('', 0, 0, head))).toBe(
      '| Столбец 1 | Столбец 2 |\n|---|---|\n|  |  |'
    );
    const v = 'a\nb';
    expect(applied(v, insertTable(v, 0, 1, head))).toBe(
      'a\n| Столбец 1 | Столбец 2 |\n|---|---|\n|  |  |\n\nb'
    );
    const parsed = parseMarkup(applied('text', e));
    expect(parsed[1]).toMatchObject({ t: 'table', rows: [[[], []]] });
  });

  it('refusesAnEditPastTheCap', () => {
    const e = must(toggleMark('abc', 0, 3, '**'));
    expect(fits('abc', e, 7)).toBe(true);
    expect(fits('abc', e, 6)).toBe(false);
    /* UTF-16 units, as `maxlength` counts: an astral character is two. */
    expect(fits('\u{1F600}', must(toggleMark('\u{1F600}', 0, 2, '*')), 3)).toBe(false);
  });
});

describe('the wraps always pair', () => {
  const stars = (blocks: readonly MarkupBlock[]): number =>
    blocks
      .map((b) =>
        b.t === 'p'
          ? inlineText(b.c)
          : b.t === 'table'
            ? ''
            : b.items.map((i) => inlineText(i)).join('')
      )
      .join('')
      .split('*').length - 1;

  const cases: readonly [string, number, number][] = [
    ['a long rest', 2, 6],
    ['a long rest', 0, 11],
    ['ab', 1, 2],
    ['ab', 0, 1],
    ['- item one\n- item two', 2, 6],
    ['one\ntwo', 0, 7],
    ['**bold** tail', 9, 13],
    ['*it* tail', 5, 9],
    ['x', 0, 1],
    ['Стоимость: 3', 0, 10],
    ['**spend a Hope** to', 10, 14],
    ['*Reliable:* +1', 1, 9],
    ['**a**b', 5, 6]
  ];

  it.each(cases)('writes no literal star into %o at %i-%i', (value, start, end) => {
    for (const mark of ['**', '*'] as const) {
      const before = stars(parseMarkup(value));
      const after = stars(parseMarkup(applied(value, toggleMark(value, start, end, mark))));
      expect(after, mark).toBe(before);
    }
  });
});
