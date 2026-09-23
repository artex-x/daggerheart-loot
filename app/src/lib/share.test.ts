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
import { dict } from './dict.js';
import type { ListShape } from './listLink.js';
import {
  entryNoteBlock,
  qtySuffix,
  share,
  shareBlocks,
  shareList,
  shareName,
  shareSelection
} from './share.js';
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

describe('a ticked selection, off selAsText/selAsHtml in app.js', () => {
  it('joins several records with no OR between them', () => {
    const [a, b] = index.searchable;
    expect(a).toBeDefined();
    expect(b).toBeDefined();
    if (!a || !b) return;
    const { text, html } = shareSelection([a, b], index, 'ru');
    expect(text).toBe([share(a, index, 'ru').text, share(b, index, 'ru').text].join('\n\n'));
    expect(html).toBe(
      [share(a, index, 'ru').html, share(b, index, 'ru').html].join('<br><br>')
    );
    /* shareRoll's own separator, ruled out rather than assumed absent. */
    expect(text).not.toContain('—');
    expect(html).not.toContain('—');
  });

  it('repeats a craft target shared by two selected records, rather than skipping it', () => {
    /* No `skip` set, unlike shareRoll: a selection is a set of things somebody
       is actually taking, not alternatives, so a target the two share is
       written out under each rather than once for the pair. */
    const target = index.searchable[0];
    expect(target).toBeDefined();
    if (!target) return;
    const a: Record_ = {
      id: 'x1',
      src: 'core',
      kind: 'item',
      en: 'A',
      ende: '',
      ru: 'А',
      rud: '',
      craft: target.id
    };
    const b: Record_ = {
      id: 'x2',
      src: 'core',
      kind: 'item',
      en: 'B',
      ende: '',
      ru: 'Б',
      rud: '',
      craft: target.id
    };
    const marker = `${dict('ru').craftInto}: ${target.ru}`;
    const { text } = shareSelection([a, b], index, 'ru');
    const occurrences = text.split(marker).length - 1;
    expect(occurrences).toBe(2);
  });
});

describe('a list selection, with its taken counts and total', () => {
  const t = dict('ru');
  const meta: Record<string, { qty?: number; gold?: number }> = {
    ci1: { qty: 5, gold: 50 },
    ci2: { qty: 3 }
  };
  const priced = (taken: Record<string, number>, over: Partial<typeof t> = {}) => ({
    metaOf: (id: string) => meta[id] ?? {},
    takenOf: (id: string) => taken[id] ?? 1,
    mode: 'bag' as const,
    t: { ...t, ...over }
  });

  it('carries the taken count and unit price after each name and ends with the total', () => {
    const a = rec('ci1');
    const b = rec('ci2');
    const { text, html } = shareSelection([a, b], index, 'ru', priced({ ci1: 2, ci2: 3 }));
    const pa = share(a, index, 'ru', { suffix: ' ×2 — 5 горстей' });
    const pb = share(b, index, 'ru', { suffix: ' ×3' });
    expect(text).toBe([pa.text, pb.text, 'Итого: 1 мешок (без цены: 1)'].join('\n\n'));
    expect(html).toBe(
      [pa.html, pb.html, '<b>Итого: 1 мешок (без цены: 1)</b>'].join('<br><br>')
    );
  });

  it('escapes the total line in the rich flavour', () => {
    const { html } = shareSelection(
      [rec('ci1')],
      index,
      'ru',
      priced({ ci1: 2 }, { total: 'A & B' })
    );
    expect(html.endsWith('<br><br><b>A &amp; B: 1 мешок</b>')).toBe(true);
  });

  it('writes no total line when no taken entry has a price', () => {
    const b = rec('ci2');
    const { text } = shareSelection([b], index, 'ru', priced({ ci2: 2 }));
    expect(text).toBe(share(b, index, 'ru', { suffix: ' ×2' }).text);
  });
});

describe('entryNoteBlock, the one contextNote block (app.js 568-573)', () => {
  it('is a single block off the players’ note, never the GM one', () => {
    const t = dict('ru');
    expect(entryNoteBlock({ note: 'Светится в темноте', hnote: 'Проклят' }, t)).toEqual([
      { head: t.noteHead, body: 'Светится в темноте' }
    ]);
  });

  it('is empty when the entry carries no players’ note', () => {
    expect(entryNoteBlock({}, dict('ru'))).toEqual([]);
    expect(entryNoteBlock({ hnote: 'Только для мастера' }, dict('ru'))).toEqual([]);
  });
});

describe('qtySuffix, the count after a name in copied text and on a print card', () => {
  it('is empty for no count, zero or one', () => {
    expect(qtySuffix(undefined)).toBe('');
    expect(qtySuffix(0)).toBe('');
    expect(qtySuffix(1)).toBe('');
  });

  it('is a space, the multiplication sign and the count over 1', () => {
    expect(qtySuffix(3)).toBe(' ×3');
  });
});

describe('shareList, off listAsText/listAsHtml in app.js (1609-1647)', () => {
  const list = (): ListShape => ({
    name: 'Клад дракона',
    ids: ['ci1', 'ci2'],
    note: 'Лавка закрыта до утра',
    hnote: 'Только для мастера - не для игроков',
    meta: { ci2: { qty: 2, gold: 750, note: 'Светится в темноте', hnote: 'Проклят' } }
  });

  it('writes the name, the list’s own players’ note, then every entry with its suffix', () => {
    const t = dict('ru');
    const l = list();
    const { text, html } = shareList(l, index, 'ru', t);

    const ci1 = rec('ci1');
    const ci2 = rec('ci2');
    const a = share(ci1, index, 'ru', { skip: new Set(l.ids) });
    const b = share(ci2, index, 'ru', {
      skip: new Set(l.ids),
      suffix: ' ×2 — 7 мешков 5 горстей',
      extra: [{ head: t.noteHead, body: 'Светится в темноте' }]
    });

    expect(text).toBe(
      [`${l.name}\n\n${t.noteHead}\n${l.note ?? ''}`, a.text, b.text].join('\n\n')
    );
    expect(html).toBe(
      [`<b>${l.name}</b><br><br><i>${t.noteHead}</i><br>${l.note ?? ''}`, a.html, b.html].join(
        '<br><br>'
      )
    );
    /* The GM's own note never leaves the list. */
    expect(text).not.toContain(l.hnote);
    expect(html).not.toContain(l.hnote);
  });

  it('has no note preamble and no suffix on a plain, unnoted list', () => {
    const t = dict('ru');
    const plain: ListShape = { name: 'Пустой', ids: ['ci1'] };
    const { text } = shareList(plain, index, 'ru', t);
    expect(text).toBe(
      [plain.name, share(rec('ci1'), index, 'ru', { skip: new Set(['ci1']) }).text].join('\n\n')
    );
  });

  it('reads a priced entry in coins when the list is set to coin mode', () => {
    const t = dict('ru');
    const l: ListShape = { ...list(), money: 'coin' };
    const { text } = shareList(l, index, 'ru', t);
    expect(text).toContain('750 зол.');
  });

  it('drops an id the data does not know, silently', () => {
    const t = dict('ru');
    const l: ListShape = { name: 'X', ids: ['ci1', 'nonexistent'] };
    const { text } = shareList(l, index, 'ru', t);
    expect(text).toBe(
      [l.name, share(rec('ci1'), index, 'ru', { skip: new Set(l.ids) }).text].join('\n\n')
    );
  });
});
