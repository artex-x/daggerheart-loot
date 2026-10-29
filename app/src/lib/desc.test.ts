/* A record's description: the blocks a card renders and the flat form the
 * clipboard takes, from the same parse; the grammar itself is markup.test.ts's. */

import { describe, expect, it } from 'vitest';
import { ART_BASE } from './art.js';
import { artSrc, descBlocks, descHtml, esc } from './desc.js';
import type { Record_ } from './types.js';

const rec = (over: Partial<Record_>): Record_ => ({
  id: 'x1',
  src: 'core',
  kind: 'item',
  en: 'T',
  ende: '',
  ru: 'Т',
  rud: '',
  ...over
});

describe('the description', () => {
  it('draws a colon as prose on every record, homebrew too', () => {
    /* The label rule once italicised an instruction in a homebrew consumable. */
    const text = 'Напишите на нём письмо: пергамент сложится в птицу.';
    const own = rec({ src: 'homebrew', kind: 'consumable', rud: text });
    expect(descHtml(own, 'ru')).toBe(text);
    expect(descBlocks(own, 'ru')).toEqual([{ t: 'p', c: [{ t: 'text', v: text }] }]);
    expect(descHtml(rec({ eq: { t: 'weapon', tier: 1 }, ende: 'Reliable: +1' }), 'en')).toBe(
      'Reliable: +1'
    );
  });

  it('draws a written label in italics', () => {
    const gear = rec({ eq: { t: 'weapon', tier: 1 }, ende: '*Reliable:* +1\n- *Calamity:* x' });
    expect(descHtml(gear, 'en')).toBe('<i>Reliable:</i> +1<br>• <i>Calamity:</i> x');
  });

  it('gives an empty description one empty paragraph rather than nothing', () => {
    expect(descBlocks(rec({}), 'en')).toEqual([{ t: 'p', c: [] }]);
    expect(descHtml(rec({}), 'en')).toBe('');
  });

  it('falls back to the English text in Russian', () => {
    expect(descHtml(rec({ ende: '**x**' }), 'ru')).toBe('<b>x</b>');
  });
});

describe('escaping', () => {
  it('escapes the four characters that would otherwise be markup', () => {
    expect(esc('a & b < c > d "e"')).toBe('a &amp; b &lt; c &gt; d &quot;e&quot;');
    expect(descHtml(rec({ ende: '<b>: <i>' }), 'en')).toBe('&lt;b&gt;: &lt;i&gt;');
  });
});

describe('where a picture lives', () => {
  it('draws the 640 px file by default, and its placeholder when missing or broken', () => {
    expect(artSrc('a.webp')).toBe('/img/a.webp');
    expect(artSrc('')).toBe('/img/_none.webp');
    expect(artSrc('a.webp', true)).toBe('/img/_none.webp');
  });

  it('draws the 160 px thumbnail for a row, and the thumbnail placeholder', () => {
    expect(artSrc('a.webp', false, 'thumb')).toBe('/img/thumb/a.webp');
    expect(artSrc(undefined, false, 'thumb')).toBe('/img/thumb/_none.webp');
    expect(artSrc('a.webp', true, 'thumb')).toBe('/img/thumb/_none.webp');
  });
});

describe('where an own picture lives', () => {
  const own = `p/${'a'.repeat(32)}.webp`;

  it('draws the bucket file at full size and its t/ copy for a row', () => {
    expect(artSrc(own)).toBe(ART_BASE + own);
    expect(artSrc(own, false, 'thumb')).toBe(ART_BASE + `t/${'a'.repeat(32)}.webp`);
  });

  it('passes an unsaved crop through at both sizes, and draws the placeholder when it fails', () => {
    expect(artSrc('blob:http://x/1')).toBe('blob:http://x/1');
    expect(artSrc('blob:http://x/1', false, 'thumb')).toBe('blob:http://x/1');
    expect(artSrc(own, true)).toBe('/img/_none.webp');
    expect(artSrc(own, true, 'thumb')).toBe('/img/thumb/_none.webp');
  });
});
