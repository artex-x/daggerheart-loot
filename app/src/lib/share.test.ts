/* The share format, held to what the live app puts on the clipboard.
 *
 * The fixture is not a record of what this module happens to do: it was read
 * out of the running old app through a stubbed clipboard - see
 * tools/capture-share-fixture.mjs - across the shapes the formatter branches on.
 * Character for character, because this text lands in other people's chats and
 * a change to it cannot be recalled.
 *
 * Tests written next to the code would only prove it is self-consistent. This
 * proves the port is faithful, which is the whole point. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildIndex, type Loot } from './data.js';
import { share, shareBlocks, shareName } from './share.js';
import type { Lang, Record_ } from './types.js';

const ROOT = join(import.meta.dirname, '..', '..', '..');
const LOOT = JSON.parse(readFileSync(join(ROOT, 'data.json'), 'utf8')) as Loot;
const index = buildIndex(LOOT);

interface Captured {
  why: string;
  ru: { name: { text: string }; full: { html: string; text: string } };
  en: { name: { text: string }; full: { html: string; text: string } };
}

const FIXTURE = JSON.parse(
  readFileSync(join(ROOT, 'docs', 'fixtures', 'share', 'records.json'), 'utf8')
) as Record<string, Captured>;

const LANGS: Lang[] = ['ru', 'en'];

const rec = (id: string): Record_ => {
  const r = index.byId.get(id);
  if (!r) throw new Error(`fixture names a record that is not in the data: ${id}`);
  return r;
};

describe('golden share fixtures', () => {
  it('covers the shapes the formatter branches on', () => {
    const why = Object.values(FIXTURE)
      .map((f) => f.why)
      .join(' | ');
    expect(Object.keys(FIXTURE).length).toBeGreaterThanOrEqual(8);
    for (const shape of [
      'consumable',
      'equipment/weapon',
      'equipment/armor',
      'upgrades into'
    ]) {
      expect(why, shape).toContain(shape);
    }
    expect(why).toMatch(/references \d+ card/);
  });

  for (const [id, f] of Object.entries(FIXTURE)) {
    for (const lang of LANGS) {
      it(`${id} (${f.why}) - ${lang}`, () => {
        const it_ = rec(id);
        expect(shareName(it_, lang), 'name').toBe(f[lang].name.text);

        const out = share(it_, index, lang);
        expect(out.text, 'text/plain').toBe(f[lang].full.text);
        expect(out.html, 'text/html').toBe(f[lang].full.html);
      });
    }
  }
});

describe('the two flavours say the same thing', () => {
  it('carries no markup into the plain one', () => {
    /* Not Markdown on purpose: an app that cannot take rich text should get
       readable words rather than stray asterisks and underscores. */
    for (const id of Object.keys(FIXTURE)) {
      for (const lang of LANGS) {
        const { text } = share(rec(id), index, lang);
        expect(text, `${id}/${lang}`).not.toMatch(/<[a-z/]|\*\*|__/);
      }
    }
  });

  it('escapes everything it puts in the rich one', () => {
    const nasty: Record_ = {
      id: 'x1',
      src: 'core',
      kind: 'item',
      en: 'Sword & <Shield>',
      ende: 'a < b && c > d',
      ru: 'Меч и "Щит"',
      rud: 'a < b'
    };
    const { html } = share(nasty, index, 'en');
    expect(html).toContain('Sword &amp; &lt;Shield&gt;');
    expect(html).not.toMatch(/<(?!\/?(b|br|i)>)/);
  });
});

describe('the name outside the app', () => {
  it('spells out a consumable, because the badge does not travel', () => {
    const c = index.searchable.find((r) => r.kind === 'consumable');
    expect(c).toBeDefined();
    if (!c) return;
    expect(shareName(c, 'ru')).toBe(`${c.ru} (расходник)`);
    expect(shareName(c, 'en')).toBe(`${c.en} (consumable)`);
  });

  it('leaves the name of an item alone', () => {
    const i = index.searchable.find((r) => r.kind === 'item');
    expect(i).toBeDefined();
    if (!i) return;
    expect(shareName(i, 'ru')).toBe(i.ru);
  });
});

describe('what travels with a record', () => {
  it('carries the upgrade forward and not backward', () => {
    /* "Made from" belongs on the card, where it shows where a thing comes from.
       In a message to players it is the recipe for what they already hold. */
    const from = index.searchable.find((r) => r.craft && index.byId.has(r.craft));
    expect(from).toBeDefined();
    if (!from?.craft) return;

    const into = rec(from.craft);
    expect(shareBlocks(from, index, 'ru').some((b) => b.head.includes(into.ru))).toBe(true);
    expect(shareBlocks(into, index, 'ru').some((b) => b.head.includes(from.ru))).toBe(false);
  });

  it('drops an upgrade already present elsewhere in the same message', () => {
    const from = index.searchable.find((r) => r.craft && index.byId.has(r.craft));
    if (!from?.craft) return;
    expect(shareBlocks(from, index, 'ru', new Set([from.craft]))).toEqual([]);
  });

  it('carries the full text of a referenced card, not a link to it', () => {
    const withRef = index.searchable.find((r) => r.refs?.length);
    expect(withRef).toBeDefined();
    if (!withRef?.refs) return;

    const card = index.refs[withRef.refs[0] ?? ''];
    expect(card).toBeDefined();
    if (!card) return;

    const blocks = shareBlocks(withRef, index, 'ru');
    expect(blocks.at(-1)).toEqual({ head: `${card.ru} · ${card.rusub}`, body: card.rud });
    expect(shareBlocks(withRef, index, 'en').at(-1)).toEqual({
      head: `${card.en} · ${card.ensub}`,
      body: card.ende
    });
  });

  it('ignores a reference key the data does not have', () => {
    const orphan: Record_ = {
      id: 'x1',
      src: 'core',
      kind: 'item',
      en: 'T',
      ende: '',
      ru: 'Т',
      rud: '',
      refs: ['no-such-card']
    };
    expect(shareBlocks(orphan, index, 'ru')).toEqual([]);
  });

  it('appends what the caller adds after what it derived', () => {
    /* This is the seam the list note arrives through: the note belongs to a
       list, and this module does not know what a list is. */
    const note = { head: 'Заметка', body: 'спрятано под половицей' };
    const any = index.searchable[0];
    expect(any).toBeDefined();
    if (!any) return;
    const { text } = share(any, index, 'ru', { extra: [note] });
    expect(text.endsWith(`\n\n${note.head}\n${note.body}`)).toBe(true);
  });
});
