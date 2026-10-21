/* The formatted-text grammar (docs/specs/FEATURES.md, "Records", "Formatted text"):
 * one case per rule, then one catalog record in the catalog style. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  afterLead,
  glueSpaces,
  inlineText,
  markupHtml,
  markupText,
  parseMarkup,
  type MarkupInline
} from './markup.js';
import type { Loot } from './data.js';

const LOOT = JSON.parse(
  readFileSync(join(import.meta.dirname, '..', '..', '..', 'data.json'), 'utf8')
) as Loot;

describe('inline markup', () => {
  it('rendersBoldAndItalicAndBoth', () => {
    expect(markupHtml('**b** and *i*')).toBe('<b>b</b> and <i>i</i>');
    expect(markupHtml('***both***')).toBe('<b><i>both</i></b>');
    expect(markupHtml('***Name:*** text')).toBe('<b><i>Name:</i></b> text');
    expect(markupHtml('*a **b***')).toBe('<i>a <b>b</b></i>');
    expect(markupHtml('**a *b***')).toBe('<b>a <i>b</i></b>');
  });

  it('nestsATripleRunByItsClosers', () => {
    /* The toolbar writes `***a** b*` for Italic on "a b", then Bold on "a". */
    expect(markupHtml('***a** b*')).toBe('<i><b>a</b> b</i>');
    expect(markupHtml('***a* b**')).toBe('<b><i>a</i> b</b>');
    expect(markupHtml('***x***')).toBe('<b><i>x</i></b>');
    for (const src of ['***a** b*', '***a* b**', '***x***']) {
      expect(markupText(src)).not.toContain('*');
    }
  });

  it('leavesAnUnmatchedStarLiteral', () => {
    expect(markupHtml('*open')).toBe('*open');
    expect(markupHtml('2 * 3 * 4')).toBe('2 * 3 * 4');
    expect(markupHtml('close*')).toBe('close*');
    expect(markupHtml('**bold *half**')).toBe('<b>bold *half</b>');
    expect(markupHtml('****four****')).toBe('****four****');
    expect(markupText('*open')).toBe('*open');
  });

  it('neverTreatsUnderscoreAsAMarker', () => {
    expect(markupHtml('_a_ __b__')).toBe('_a_ __b__');
  });

  it('escapesPunctuationWithBackslash', () => {
    expect(markupHtml('\\*not\\* \\\\ \\|')).toBe('*not* \\ |');
    expect(markupHtml('a \\b c')).toBe('a \\b c');
    expect(markupText('\\*x\\*')).toBe('*x*');
  });

  it('keepsTheScreenshotInstructionPlain', () => {
    /* A homebrew consumable once drew this instruction as an italic property label. */
    const text = 'Напишите на нём письмо: пергамент сложится в бумажную птицу.';
    expect(markupHtml(text)).toBe(text);
    expect(parseMarkup(text)).toEqual([{ t: 'p', c: [{ t: 'text', v: text }] }]);
  });
});

describe('blocks', () => {
  it('stopsAListWithAnEscapedDash', () => {
    expect(parseMarkup('\\- not a list')).toEqual([
      { t: 'p', c: [{ t: 'text', v: '- not a list' }] }
    ]);
    expect(parseMarkup('1\\. not a list')[0]?.t).toBe('p');
  });

  it('joinsConsecutiveBulletsIntoOneList', () => {
    const blocks = parseMarkup('head\n- one\n- *two*\ntail\n- three');
    expect(blocks.map((b) => b.t)).toEqual(['p', 'ul', 'p', 'ul']);
    expect(blocks[1]).toEqual({
      t: 'ul',
      items: [[{ t: 'text', v: 'one' }], [{ t: 'i', c: [{ t: 'text', v: 'two' }] }]]
    });
  });

  it('startsANumberedListAtItsFirstNumber', () => {
    const blocks = parseMarkup('3. c\n4. d\n12. e');
    expect(blocks).toEqual([
      {
        t: 'ol',
        start: 3,
        items: [[{ t: 'text', v: 'c' }], [{ t: 'text', v: 'd' }], [{ t: 'text', v: 'e' }]]
      }
    ]);
    expect(markupHtml('3. c\n4. d')).toBe('3. c<br>4. d');
    expect(parseMarkup('1234. no')[0]?.t).toBe('p');
  });

  it('needsASeparatorLineForATable', () => {
    expect(parseMarkup('| a | b |')[0]?.t).toBe('p');
    expect(parseMarkup('| a | b |\n| x | y |').map((b) => b.t)).toEqual(['p', 'p']);
    const table = parseMarkup('| a | **b** |\n|:---|---:|\n| 1 | 2 |\nafter');
    expect(table.map((b) => b.t)).toEqual(['table', 'p']);
    const t = table[0];
    if (t?.t !== 'table') throw new Error('The first block is not a table');
    expect(t.head.map(inlineText)).toEqual(['a', 'b']);
    expect(t.head[1]).toEqual([{ t: 'b', c: [{ t: 'text', v: 'b' }] }]);
    expect(t.rows.map((r) => r.map(inlineText))).toEqual([['1', '2']]);
  });

  it('padsAShortTableRow', () => {
    const t = parseMarkup(
      '| a | b | c |\n|---|---|---|\n| 1 |\n| 1 | 2 | 3 | 4 |\n| x \\| y | z'
    )[0];
    if (t?.t !== 'table') throw new Error('The first block is not a table');
    expect(t.rows.map((r) => r.map(inlineText))).toEqual([
      ['1', '', ''],
      ['1', '2', '3'],
      ['x | y', 'z', '']
    ]);
    expect(markupText('| a | b |\n|---|---|\n| 1 | 2 |')).toBe('a | b\n1 | 2');
  });

  it('keepsEveryLineAsItsOwnParagraph', () => {
    expect(parseMarkup('one\ntwo\n\nfour').map((b) => b.t)).toEqual(['p', 'p', 'p', 'p']);
    expect(parseMarkup('')).toEqual([{ t: 'p', c: [] }]);
    expect(parseMarkup('  lead')).toEqual([{ t: 'p', c: [{ t: 'text', v: '  lead' }] }]);
    expect(markupHtml('')).toBe('');
    expect(markupText('one\ntwo')).toBe('one\ntwo');
  });

  it('keepsASpanInsideItsLine', () => {
    expect(markupHtml('*a\nb*')).toBe('*a<br>b*');
  });
});

describe('the string forms', () => {
  it('escapesHtmlInTheFlatForm', () => {
    expect(markupHtml('<b>a & "c"</b> *<i>*')).toBe(
      '&lt;b&gt;a &amp; &quot;c&quot;&lt;/b&gt; <i>&lt;i&gt;</i>'
    );
  });

  it('joinsTheSpaceAfterALeadToTheFirstText', () => {
    expect(afterLead([{ t: 'text', v: 'Bonus.' }])).toEqual([{ t: 'text', v: ' Bonus.' }]);
    expect(afterLead([{ t: 'b', c: [{ t: 'text', v: 'x' }] }])).toEqual([
      { t: 'text', v: ' ' },
      { t: 'b', c: [{ t: 'text', v: 'x' }] }
    ]);
    expect(afterLead([])).toEqual([{ t: 'text', v: ' ' }]);
  });

  it('joinsASpaceBetweenTwoMarksToTheLastTextOfTheFirst', () => {
    const b = (v: string): MarkupInline => ({ t: 'b', c: [{ t: 'text', v }] });
    const i = (v: string): MarkupInline => ({ t: 'i', c: [{ t: 'text', v }] });
    expect(glueSpaces([b('a'), { t: 'text', v: ' ' }, i('b')])).toEqual([b('a '), i('b')]);
    /* The deepest last text: «***Свет:*** **Потратьте**». */
    expect(glueSpaces([{ t: 'b', c: [i('Свет:')] }, { t: 'text', v: ' ' }, b('x')])).toEqual([
      { t: 'b', c: [i('Свет: ')] },
      b('x')
    ]);
    /* A space beside text, at an end, or after a run with no text stays where it is. */
    const beside: MarkupInline[] = [b('a'), { t: 'text', v: ' x ' }, i('b')];
    expect(glueSpaces(beside)).toEqual(beside);
    const atEnd: MarkupInline[] = [{ t: 'text', v: ' ' }, b('a'), { t: 'text', v: ' ' }];
    expect(glueSpaces(atEnd)).toEqual(atEnd);
    const empty: MarkupInline[] = [{ t: 'b', c: [] }, { t: 'text', v: ' ' }, b('a')];
    expect(glueSpaces(empty)).toEqual(empty);
    /* Inside a mark, at every depth. */
    expect(glueSpaces([{ t: 'b', c: [i('a'), { t: 'text', v: '  ' }, i('b')] }])).toEqual([
      { t: 'b', c: [i('a  '), i('b')] }
    ]);
    expect(inlineText(glueSpaces([b('a'), { t: 'text', v: ' ' }, b('c')]))).toBe('a c');
  });

  it('projectsPlainTextWithListMarksKept', () => {
    expect(markupText('**Head:** x\n- *one*\n- two\n1. a\n2. b')).toBe(
      'Head: x\n- one\n- two\n1. a\n2. b'
    );
    expect(markupHtml('- *one*\n1. a')).toBe('• <i>one</i><br>1. a');
  });
});

describe('the catalog', () => {
  it('drawsACatalogLabelCostAndConditionAsTheStyleWritesThem', () => {
    const q193 = [...Object.values(LOOT.items).flat(), ...(LOOT.eq ?? [])].find(
      (it) => it.id === 'q193'
    );
    const html = markupHtml(q193?.rud ?? '');
    expect(html.startsWith('<b><i>Хватающее:</i></b>')).toBe(true);
    expect(html).toContain('<b>потратить Надежду</b>');
    expect(html).toContain('<i>Обездвижить</i>');
  });
});
