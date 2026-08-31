/* The description parser: the label rule, and the shape a card renders.
 *
 * The rule is deliberately conservative, and that is the point of most of these
 * cases: loot prose is full of colons that are not property labels, and marking
 * them up turns structure into noise. The card and the clipboard read the same
 * parse, so a change here shows up in both and both are asserted. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildIndex, type Loot } from './data.js';
import { descHtml, descParts, esc, hasLabels, lineHtml, splitLabel } from './desc.js';
import type { Record_ } from './types.js';

const LOOT = JSON.parse(
  readFileSync(join(import.meta.dirname, '..', '..', '..', 'data.json'), 'utf8')
) as Loot;
const index = buildIndex(LOOT);

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

describe('property labels', () => {
  it('italicises a short name at the head of a line', () => {
    expect(lineHtml('Reliable: +1 to attack')).toBe('<i>Reliable:</i> +1 to attack');
  });

  it('leaves prose alone, however many colons it has', () => {
    /* Loot descriptions are full of "The GM decides: ..." and italics there
       would be noise rather than structure. */
    const prose = 'The GM decides, at the table, what this is worth: usually a lot';
    expect(lineHtml(prose)).toBe(esc(prose));
    expect(lineHtml('One two three four five: x')).toBe(esc('One two three four five: x'));
    expect(lineHtml('Head, with a comma: x')).toBe(esc('Head, with a comma: x'));
  });

  it('allows a longer, comma-bearing head inside a list item', () => {
    /* There the colon separates the name of an option - "Calamity (Failure,
       Fear)" - and a comma inside the brackets is legitimate. */
    expect(lineHtml('Calamity (Failure, Fear): something happens', true)).toBe(
      '<i>Calamity (Failure, Fear):</i> something happens'
    );
  });

  it('gives labels to equipment and Vault of Ages, and to nothing else', () => {
    const gear = index.allEquip.find((r) => descHtml(r, 'ru').includes('<i>'));
    expect(gear, 'no equipment description carries a label at all').toBeDefined();

    const loot = index.all.find(
      (r) => !r.eq && r.src !== 'voa' && (r.rud || '').includes(': ')
    );
    expect(loot).toBeDefined();
    if (loot) expect(descHtml(loot, 'ru')).not.toContain('<i>');
  });

  it('renders a dash-led line as a bullet', () => {
    const bullet: Record_ = {
      id: 'x1',
      src: 'core',
      kind: 'item',
      en: 'T',
      ende: 'head\n- one\n- two',
      ru: 'Т',
      rud: ''
    };
    expect(descHtml(bullet, 'en')).toBe('head<br>• one<br>• two');
  });
});

describe('the shape a card renders', () => {
  it('gathers consecutive dashes into one list, and stops at the first line that is not', () => {
    const parts = descParts(rec({ ende: 'head\n- one\n- two\ntail\n- three' }), 'en');
    expect(parts.map((p) => p.kind)).toEqual(['line', 'list', 'line', 'list']);
    const first = parts[1];
    if (first?.kind === 'list') expect(first.items.map((i) => i.body)).toEqual(['one', 'two']);
  });

  it('carries the label separately, so nothing has to inject HTML to show it', () => {
    const parts = descParts(rec({ eq: { t: 'weapon', tier: 1 }, ende: 'Reliable: +1' }), 'en');
    expect(parts[0]).toEqual({ kind: 'line', label: 'Reliable', body: ' +1' });
  });

  it('gives an empty description one empty line rather than nothing', () => {
    /* `split` on an empty string yields one empty piece; a card that renders it
       shows an empty paragraph, which is what the old app does too. */
    expect(descParts(rec({}), 'en')).toEqual([{ kind: 'line', label: '', body: '' }]);
  });

  it('agrees with the flat form the clipboard takes', () => {
    for (const it of [...index.all, ...index.allEquip].slice(0, 200)) {
      const flat = descHtml(it, 'ru');
      const fromParts = descParts(it, 'ru')
        .map((p) =>
          p.kind === 'list'
            ? p.items
                .map((i) => '• ' + (i.label ? `<i>${esc(i.label)}:</i>` : '') + esc(i.body))
                .join('<br>')
            : (p.label ? `<i>${esc(p.label)}:</i>` : '') + esc(p.body)
        )
        .join('<br>');
      expect(fromParts, it.id).toBe(flat);
    }
  });
});

describe('which records get labels at all', () => {
  it('is equipment and Vault of Ages, and nothing else', () => {
    expect(hasLabels(rec({ eq: { t: 'weapon', tier: 1 } }))).toBe(true);
    expect(hasLabels(rec({ src: 'voa' }))).toBe(true);
    expect(hasLabels(rec({ src: 'wondrous' }))).toBe(false);
  });

  it('leaves a colon in loot prose as prose', () => {
    const loot = rec({ src: 'wondrous', ende: 'Sharp: very' });
    expect(descParts(loot, 'en')).toEqual([{ kind: 'line', label: '', body: 'Sharp: very' }]);
    expect(descHtml(loot, 'en')).toBe('Sharp: very');
  });
});

describe('escaping', () => {
  it('escapes the five characters that would otherwise be markup', () => {
    expect(esc('a & b < c > d "e"')).toBe('a &amp; b &lt; c &gt; d &quot;e&quot;');
  });

  it('escapes a label and its body separately, and both of them', () => {
    expect(lineHtml('<b>: <i>')).toBe('<i>&lt;b&gt;:</i> &lt;i&gt;');
  });

  it('leaves a line with no label escaped and nothing more', () => {
    expect(splitLabel('no colon here')).toEqual({ label: '', body: 'no colon here' });
    expect(lineHtml('a < b')).toBe('a &lt; b');
  });
});
