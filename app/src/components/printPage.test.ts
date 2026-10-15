/* The print sheet, `#/p/<id>` - off `renderPrint`, `printCardHTML` and
 * its helpers, `fitPrintCards` (app.js 3235-3558) and the four handlers
 * (`doPrint`/`printBack`/`printArt`/`printLink`, app.js 4236-4245).
 *
 * Held against a small fixture rather than the real catalogue, the same way
 * tables.test.ts and searchPage.test.ts are - what matters here is the
 * markup shape (both card layouts, both languages, the fit) rather than any
 * particular record. Equipment lives in `Loot.eq`, off the same records
 * `listPage.test.ts`'s fixture already establishes the convention for. */

import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import type { Loot } from '../lib/data.js';
import { dict } from '../lib/dict.js';
import type { PrintSetEntry } from '../lib/printSet.js';
import type { Record_ } from '../lib/types.js';
import {
  fakeClipboard,
  fakeData,
  fakeDialog,
  fakeEnv,
  memoryRouter,
  memoryStorage,
  noData
} from '../ports/index.js';
import type { Env } from '../ports/index.js';
import { fakeCloud, type FakeCloud } from '../ports/fake-cloud.js';
import { SEED, uuid, type Seed } from '../ports/fake-cloud-seed.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

/* jsdom (v30) declares `Range.prototype.getBoundingClientRect` in its types
 * but does not actually implement it - not even a zero-rect stub, which is
 * what a real browser gives an empty range. `fit()`'s strip loop calls it
 * unconditionally on every card with a `.pc-strip`, so without this every
 * such render throws before the DOM even settles. A zero-width rect is what
 * a real browser reports for a freshly-created, empty range anyway, so this
 * is filling an environment gap, not changing behaviour: `over()` reads
 * `false` immediately, same as it would off a genuine zero rect, and the
 * "fit is wired" case below still overrides this locally to drive the
 * loops. `getClientRects` has the same gap: an empty list is what a real
 * browser gives an empty range. */
Range.prototype.getBoundingClientRect = function (): DOMRect {
  return {
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    x: 0,
    y: 0,
    toJSON: () => ({})
  };
};
Range.prototype.getClientRects = function (): DOMRectList {
  return [] as unknown as DOMRectList;
};

const row = (over: Partial<Record_>): Record_ => ({
  id: 'x',
  src: 'core',
  kind: 'item',
  en: 'Thing',
  ende: '',
  ru: 'Вещь',
  rud: '',
  ...over
});

const LOOT: Loot = {
  items: {
    core_item: [
      row({ id: 'ci1', en: 'Thing With Art', ru: 'Вещь С Картинкой', img: 'ci1.webp' }),
      row({ id: 'ni1', en: 'Thing No Art', ru: 'Вещь Без Картинки' })
    ],
    core_consumable: [row({ id: 'cc1', kind: 'consumable', en: 'Potion', ru: 'Зелье' })],
    community: [
      row({
        id: 'cm1',
        src: 'community',
        community: 'Highborne',
        community_ru: 'Великородное',
        en: 'Community Thing',
        ru: 'Вещь Сообщества'
      })
    ],
    voa: [
      row({
        id: 'af1',
        src: 'voa',
        tier: 'A',
        en: 'Artifact',
        ru: 'Артефакт',
        rud: '*Стоимость Призыва:* 2\nЭта колода даёт защиту.\n- Первый пункт\n- Второй пункт',
        ende: 'Recall Cost: 2\nThis deck grants protection.\n- First entry\n- Second entry'
      }),
      /* An artifact that carries a stat block: printed in the book's
         Artifacts section, so `eq.tier` is 'A', not a rank. */
      row({
        id: 'af2',
        src: 'voa',
        kind: 'equip',
        tier: 'A',
        en: 'Oath Blade',
        ru: 'Клинок Клятвы',
        eq: {
          t: 'weapon',
          tier: 'A',
          cls: 'phy',
          tr: 'strength',
          rg: 'melee',
          dmg: 'd10+6',
          dt: 'phy',
          bu: 2
        }
      })
    ]
  },
  eq: [
    row({
      id: 'q1',
      en: 'Basic Sword',
      ru: 'Простой Меч',
      rud: '*Надёжное:* +1 к Броскам Атаки',
      ende: '*Reliable:* +1 to attack rolls',
      eq: {
        t: 'weapon',
        tier: 1,
        cls: 'phy',
        tr: 'agility',
        rg: 'melee',
        dmg: 'd8',
        dt: 'phy',
        bu: 1
      }
    }),
    row({
      id: 'q23',
      en: 'Runeblade',
      ru: 'Рунический Клинок',
      rud: 'Универсальное: второй набор характеристик указан отдельно.',
      ende: 'Versatile: a second stat block is given separately.',
      eq: {
        t: 'weapon',
        tier: 2,
        cls: 'mag',
        tr: 'knowledge',
        rg: 'melee',
        dmg: 'd6',
        dt: 'mag',
        bu: 2,
        alt: { tr: 'knowledge', rg: 'far', dmg: 'd8', dt: 'mag' }
      }
    }),
    row({
      id: 'q8b3',
      en: 'Heavy Axe',
      ru: 'Тяжёлый Топор',
      eq: {
        t: 'weapon',
        tier: 1,
        cls: 'phy',
        tr: 'strength',
        rg: 'melee',
        dmg: 'd8+3',
        dt: 'phy',
        bu: 1
      }
    }),
    /* The frame follows the class, not the damage type: a magic weapon
       dealing either type, a physical one dealing magic damage, and a magic
       one whose second strip deals physical damage. */
    row({
      id: 'q33',
      en: 'Shadowblade',
      ru: 'Меч Тьмы',
      eq: {
        t: 'weapon',
        tier: 1,
        cls: 'mag',
        tr: 'presence',
        rg: 'melee',
        dmg: 'd8',
        dt: 'any',
        bu: 1
      }
    }),
    row({
      id: 'dve38',
      en: "Nature's Fall",
      ru: 'Падение Природы',
      eq: {
        t: 'weapon',
        tier: 3,
        cls: 'phy',
        tr: 'instinct',
        rg: 'melee',
        dmg: 'd8+6',
        dt: 'mag',
        bu: 1
      }
    }),
    row({
      id: 'q171',
      en: 'Gunblade',
      ru: 'Ганблейд',
      eq: {
        t: 'weapon',
        tier: 3,
        cls: 'mag',
        tr: 'agility',
        rg: 'far',
        dmg: 'd6+6',
        dt: 'mag',
        bu: 1,
        alt: { tr: 'agility', rg: 'melee', dmg: 'd8+6', dt: 'phy' }
      }
    }),
    row({
      id: 'a1',
      en: 'Plate',
      ru: 'Латы',
      eq: { t: 'armor', tier: 2, as: 3, th: [5, 11] }
    }),
    /* A two-member set with a shared bonus; the first member also swaps its
       stat set, so its card draws a second strip. */
    row({
      id: 'st1',
      en: 'Ember Blade',
      ru: 'Угольный Клинок',
      rud: 'Раздуть: сменить характеристики.',
      ende: 'Fan: change the statistics.',
      set: 'pair',
      eq: {
        t: 'weapon',
        tier: 3,
        cls: 'mag',
        tr: 'agility',
        rg: 'melee',
        dmg: 'd8+5',
        dt: 'mag',
        bu: 1,
        alt: { tr: 'agility', rg: 'veryclose', dmg: 'd12+5', dt: 'mag' }
      }
    }),
    row({
      id: 'st2',
      en: 'Spark Blade',
      ru: 'Искристый Клинок',
      set: 'pair',
      eq: {
        t: 'secondary',
        tier: 2,
        cls: 'mag',
        tr: 'agility',
        rg: 'melee',
        dmg: 'd8+2',
        dt: 'mag',
        bu: 1
      }
    })
  ],
  refs: {},
  sets: {
    pair: {
      en: 'Twin Flame',
      ru: 'Двойное пламя',
      ende: 'Both burn together.',
      rud: 'Оба горят вместе.'
    }
  }
};

const at = (hash: string, over: Partial<Env> = {}): Env =>
  fakeEnv({ router: memoryRouter(hash), data: fakeData(LOOT), ...over });

/* A spec is the retired address's `id[*n]-id` spelling; an `hb_` key names the seed's
   item of that key. */
function entriesOf(spec: string | PrintSetEntry[], seed: Seed): PrintSetEntry[] {
  if (typeof spec !== 'string') return spec;
  return spec.split('-').map((token) => {
    const [id = '', n] = token.split('*');
    const q = n ? { q: Number(n) } : {};
    if (!id.startsWith('hb_')) return { k: id, ...q };
    const item = Object.values(seed.homebrew)
      .flatMap((h) => h.items)
      .find((i) => i.key === id);
    return { h: item?.id ?? '', ...q };
  });
}

interface SetOptions extends Partial<Env> {
  /** The reader, signed in; `gm2` has no print layout and no homebrew of its own. */
  as?: string;
  /** The account that makes the set; the reader by default. */
  by?: string;
  seed?: Seed;
  /** One port for the make and the read, for a case that drives the fake. */
  port?: FakeCloud;
  /** An address before the set in the history. */
  from?: string;
}

/** Makes the set through the fake and answers the env at its `#/p/<id>`. */
async function atSet(
  spec: string | PrintSetEntry[],
  { as = 'gm2', by, seed = SEED, port, from, ...over }: SetOptions = {}
): Promise<Env> {
  const world = port ? null : fakeCloud(seed);
  const cloud = port ?? world?.as(as);
  const maker = port ?? world?.as(by ?? as);
  if (!cloud || !maker) throw new Error('no port');
  const made = await maker.prints.create(entriesOf(spec, seed));
  if (!made.ok) throw new Error('the fake refused the set: ' + JSON.stringify(made));
  const hash = '#/p/' + made.id;
  const router = memoryRouter(from ?? hash);
  if (from) router.navigate(hash);
  return at(hash, { router, cloud, ...over });
}

/** Waits until the sheet is drawn: the read is over and the first card is there. */
async function opened(): Promise<void> {
  await screen.findByRole('heading', { name: /^(Печать карточек|Printing cards)$/ });
  await waitFor(() => {
    expect(document.querySelector('.psheet')).not.toBeNull();
  });
}

/** Svelte 5 leaves an empty `<!---->` comment as the anchor for every
 *  expression and block, and stamps every scoped element with its own
 *  `svelte-xxxxx` class - the markup itself carries none of either. */
const withoutAnchors = (html: string): string =>
  html
    .replace(/<!---->/g, '')
    .replace(/\s*svelte-\w+/g, '')
    .replace(/\sclass=""/g, '');

describe('arrival, colour', () => {
  it('draws the bar, the controls in order, and one sheet with the two cards and seven blanks', async () => {
    render(App, { env: await atSet('ci1-q1') });
    await opened();
    expect(screen.getByRole('heading', { name: 'Печать карточек' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Карточек: 2. Листов A4: 1. Размер карты 63×88 мм — как у обычной игральной.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Как это работает' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Открывать этот раздел/ })
    ).not.toBeInTheDocument();

    const back = screen.getByRole('button', { name: 'Назад' });
    const printNow = screen.getByRole('button', { name: 'Отправить на печать' });
    const color = screen.getByRole('button', { name: 'Цветная' });
    const bw = screen.getByRole('button', { name: 'Чёрно-белая' });
    const std = screen.getByRole('button', { name: 'Обычная' });
    const compact = screen.getByRole('button', { name: 'Компактная' });
    const link = screen.getByRole('button', { name: 'Ссылка на набор' });
    expect(color).toHaveAttribute('aria-pressed', 'true');
    expect(bw).toHaveAttribute('aria-pressed', 'false');
    expect(std).toHaveAttribute('aria-pressed', 'true');
    expect(compact).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('group', { name: 'Размер карты' })).toContainElement(std);
    const order = [back, printNow, color, bw, std, compact, link].map((el) =>
      Array.from(document.querySelectorAll<HTMLElement>('button')).indexOf(el)
    );
    expect(order).toEqual([...order].sort((a, b) => a - b));

    expect(document.querySelectorAll('.psheet')).toHaveLength(1);
    expect(document.querySelectorAll('.pcard')).toHaveLength(9);
    expect(document.querySelectorAll('.pcard.blank')).toHaveLength(7);
    expect(document.querySelectorAll('.psheet[data-next]')).toHaveLength(0);

    const pids = Array.from(document.querySelectorAll('.pcard[data-pid]')).map((el) =>
      el.getAttribute('data-pid')
    );
    expect(pids).toEqual(['ci1', 'q1']);
    expect(document.querySelector('.warnnote')).toBeNull();
  });
});

describe('the loot card', () => {
  it('shows its art, no tier or strip, and its full source line', async () => {
    render(App, { env: await atSet('ci1') });
    await opened();
    const card = document.querySelector('.pcard[data-pid="ci1"]');
    expect(card?.querySelector('.pc-tags')?.textContent).toBe('Предмет');
    const back = card?.querySelector('.pc-back');
    const img = card?.querySelector('.pc-img');
    expect(back).toHaveAttribute('src', 'img/ci1.webp');
    expect(img).toHaveAttribute('src', 'img/ci1.webp');
    expect(back).toHaveAttribute('aria-hidden', 'true');
    expect(card?.querySelector('.pc-tier')).toBeNull();
    expect(card?.querySelector('.pc-strip')).toBeNull();
    expect(card?.querySelector('.pc-thstrip')).toBeNull();
    expect(card?.querySelector('.pc-burden')).toBeNull();
    expect(card?.querySelector('.pc-shield')).toBeNull();
    expect(card?.querySelector('.pc-bottom')?.textContent).toBe('DaggerheartCore');
    expect(card?.innerHTML).not.toContain('Крафт');
    expect(card?.innerHTML).not.toContain('Craft');
  });
});

describe('no art', () => {
  it('draws the glyph for a record with no image, and swaps a broken one for it too', async () => {
    render(App, { env: await atSet('ni1-ci1') });
    await opened();

    const bare = document.querySelector('.pcard[data-pid="ni1"]');
    expect(bare?.querySelector('svg.pc-glyph')).toBeInTheDocument();
    expect(bare?.querySelector('img')).toBeNull();

    const withArt = document.querySelector('.pcard[data-pid="ci1"]');
    expect(withArt?.querySelector('.pc-img')).toBeInTheDocument();
    withArt?.querySelector('.pc-img')?.dispatchEvent(new Event('error'));
  });

  it('swaps to the glyph once the picture 404s, reached directly at a set address', async () => {
    /* Unlike every other route, a handed-over #/p/ address may be the first (and only)
       page this session ever draws for this id - nothing else could already have caught
       the failure the way RecordCard's own onerror does elsewhere. */
    render(App, { env: await atSet('ci1') });
    await opened();
    const card = document.querySelector('.pcard[data-pid="ci1"]');
    expect(card?.querySelector('svg.pc-glyph')).toBeNull();
    /* Both `<img>`s carry their own `onerror` - either one reports the same
       id, so whichever the browser happens to fail first still catches it. */
    card?.querySelector('.pc-back')?.dispatchEvent(new Event('error'));
    card?.querySelector('.pc-img')?.dispatchEvent(new Event('error'));
    await tick();
    expect(card?.querySelector('.pc-img')).toBeNull();
    expect(card?.querySelector('.pc-back')).toBeNull();
    expect(card?.querySelector('svg.pc-glyph')).toBeInTheDocument();
  });
});

describe('the weapon card', () => {
  it('draws the tier, tags, burden, die, ribbon, cells and a labelled rule', async () => {
    render(App, { env: await atSet('q1') });
    await opened();
    const card = document.querySelector('.pcard[data-pid="q1"]');
    expect(card?.querySelector('.pc-tier')?.textContent).toBe('1Ранг');
    const tags = card?.querySelectorAll('.pc-tag');
    expect(tags?.[0]).toHaveClass('on');
    expect(tags?.[0]?.textContent).toBe('Основное оружие');
    expect(tags?.[1]).toHaveClass('out');
    expect(tags?.[1]?.textContent).toBe('Физическое');
    expect(card?.querySelector('.pc-burden small')?.textContent).toBe('Хват');
    expect(card?.querySelector('.pc-burden img')).toHaveAttribute('src', 'card/burden-1.svg');
    const die = card?.querySelector('.pc-die.own[data-die="d8"]');
    expect(die?.querySelector('img')).toHaveAttribute('src', 'card/die-d8-phy.svg');
    expect(die?.querySelector('b')?.textContent).toBe('d8');
    expect(card?.querySelector('.pc-ribbon')).toHaveAttribute('src', 'card/ribbon.svg');
    expect(card?.querySelector('.pc-cells')?.textContent).toBe(
      'УронфизЧертаПроворностьДистанцияВплотную'
    );
    expect(card?.querySelector('.pc-c1')).not.toHaveClass('wbonus');
    expect(withoutAnchors(card?.querySelector('.pc-text')?.innerHTML ?? '')).toBe(
      '<i>Надёжное:</i> +1 к Броскам Атаки'
    );
  });
});

describe('the versatile magic weapon', () => {
  it('draws two strips, both magic, and the second stat block', async () => {
    render(App, { env: await atSet('q23') });
    await opened();
    const card = document.querySelector('.pcard[data-pid="q23"]');
    const strips = card?.querySelectorAll('.pc-strip');
    expect(strips).toHaveLength(2);
    expect(strips?.[1]?.querySelector('.pc-cells')?.textContent).toContain('Далеко');
    expect(card?.querySelectorAll('.pc-die.mag')).toHaveLength(2);
    expect(card?.querySelector('.pc-ribbon')).toHaveAttribute('src', 'card/ribbon-mag.svg');
    expect(card?.querySelector('.pc-burden img')).toHaveAttribute('src', 'card/burden-2.svg');
    expect(card?.querySelector('.pc-tag.out')?.textContent).toBe('Магическое');
  });
});

describe('the print frame', () => {
  it("follows the weapon's class on every strip, while the damage box keeps the type", async () => {
    const { container } = render(App, { env: await atSet('q33-dve38-q171') });
    await opened();
    const card = (id: string): Element | null =>
      document.querySelector(`.pcard[data-pid="${id}"]`);
    const ribbons = (id: string): (string | null)[] =>
      Array.from(card(id)?.querySelectorAll('.pc-ribbon') ?? []).map((e) =>
        e.getAttribute('src')
      );
    const dice = (id: string): (string | null)[] =>
      Array.from(card(id)?.querySelectorAll('.pc-die img') ?? []).map((e) =>
        e.getAttribute('src')
      );
    const dmg = (id: string): (string | undefined)[] =>
      Array.from(card(id)?.querySelectorAll('.pc-c1 .pc-box b') ?? []).map(
        (e) => e.textContent
      );

    expect(ribbons('q33')).toEqual(['card/ribbon-mag.svg']);
    expect(dice('q33')).toEqual(['card/die-d8-mag.svg']);
    expect(card('q33')?.querySelector('.pc-die')).toHaveClass('mag');
    expect(dmg('q33')).toEqual(['физ/маг']);

    expect(ribbons('dve38')).toEqual(['card/ribbon.svg']);
    expect(dice('dve38')).toEqual(['card/die-d8-phy.svg']);
    expect(card('dve38')?.querySelector('.pc-die')).not.toHaveClass('mag');
    expect(dmg('dve38')).toEqual(['маг']);

    expect(ribbons('q171')).toEqual(['card/ribbon-mag.svg', 'card/ribbon-mag.svg']);
    expect(dice('q171')).toEqual(['card/die-d6-mag.svg', 'card/die-d8-mag.svg']);
    expect(dmg('q171')).toEqual(['маг', 'физ']);
    await expectNoA11yViolations(container);
  });
});

describe('a set member', () => {
  it("draws the set's shared bonus as the last text line, labelled with the members", async () => {
    const { container } = render(App, { env: await atSet('st1-st2') });
    await opened();
    for (const id of ['st1', 'st2']) {
      const labels = document.querySelectorAll(`.pcard[data-pid="${id}"] .pc-text i`);
      const last = labels[labels.length - 1];
      expect(last?.textContent, id).toBe(
        'Двойное пламя (Комплект: Угольный Клинок, Искристый Клинок):'
      );
      expect(
        document
          .querySelector(`.pcard[data-pid="${id}"] .pc-text`)
          ?.textContent.endsWith(': Оба горят вместе.'),
        id
      ).toBe(true);
    }
    expect(document.querySelectorAll('.pcard[data-pid="st1"] .pc-strip')).toHaveLength(2);
    expect(document.querySelectorAll('.pcard[data-pid="st2"] .pc-strip')).toHaveLength(1);
    await expectNoA11yViolations(container);
  });

  it('draws no set line for a record outside any set', async () => {
    render(App, { env: await atSet('q1') });
    await opened();
    expect(document.querySelector('.pcard[data-pid="q1"] .pc-text')?.textContent).not.toContain(
      'Комплект'
    );
  });
});

describe('a damage bonus', () => {
  it('splits into the die and a bonus cell', async () => {
    render(App, { env: await atSet('q8b3') });
    await opened();
    const card = document.querySelector('.pcard[data-pid="q8b3"]');
    expect(card?.querySelector('.pc-c1')).toHaveClass('wbonus');
    expect(card?.querySelector('.pc-bonus')?.textContent).toBe('+3');
    expect(card?.querySelector('.pc-die b')?.textContent).toBe('d8');
  });
});

describe('the armour card', () => {
  it('draws the shield, the threshold strip and one tag', async () => {
    render(App, { env: await atSet('a1') });
    await opened();
    const card = document.querySelector('.pcard[data-pid="a1"]');
    const shield = card?.querySelector('.pc-shield');
    expect(shield?.querySelector('b')?.textContent).toBe('3');
    expect(shield?.querySelector('i')?.textContent).toBe('Броня');
    expect(shield?.querySelector('img')).toHaveAttribute('src', 'card/shield.svg');
    expect(card?.querySelector('.pc-burden')).toBeNull();
    expect(card?.querySelector('.pc-die')).toBeNull();

    const labs = card?.querySelectorAll('.pc-th-lab');
    expect(Array.from(labs ?? []).map((l) => l.textContent)).toEqual([
      'Лёгкий урон',
      'Ощутимый урон',
      'Тяжёлый урон'
    ]);
    const dots = Array.from(labs ?? []).map((l) => l.querySelector('img')?.getAttribute('src'));
    expect(dots).toEqual(['card/dots1.svg', 'card/dots2.svg', 'card/dots3.svg']);
    const boxes = card?.querySelectorAll('.pc-th-box');
    expect(Array.from(boxes ?? []).map((b) => b.querySelector('b')?.textContent)).toEqual([
      '5',
      '11'
    ]);
    expect(card?.querySelectorAll('.pc-th-arrow')).toHaveLength(2);

    expect(card?.querySelector('.pc-tier')?.textContent).toBe('2Ранг');
    expect(card?.querySelectorAll('.pc-tag')).toHaveLength(1);
    expect(card?.querySelector('.pc-tag')?.textContent).toBe('Броня');
  });
});

describe('the artifact', () => {
  it('has no tier, the artifact tag, and the list markup with no whitespace anywhere', async () => {
    render(App, { env: await atSet('af1') });
    await opened();
    const card = document.querySelector('.pcard[data-pid="af1"]');
    expect(card?.querySelector('.pc-tier')).toBeNull();
    expect(card?.querySelector('.pc-tag.on')?.textContent).toBe('Артефакт');
    expect(withoutAnchors(card?.querySelector('.pc-text')?.innerHTML ?? '')).toBe(
      '<i>Стоимость Призыва:</i> 2<br>Эта колода даёт защиту.' +
        '<ul class="dlist"><li>Первый пункт</li><li>Второй пункт</li></ul>'
    );
  });
});

describe('formatted text', () => {
  it('draws bold, italic, both lists and a table, with no whitespace anywhere', async () => {
    render(App, { env: await atSet([{ h: uuid(515) }]) });
    await opened();
    const text = document.querySelector('.pcard .pc-text');
    expect(withoutAnchors(text?.innerHTML ?? '')).toBe(
      '<b>Раз за отдых:</b> разверните свиток, и <i>узор</i> ответит на вопрос.' +
        '<ul class="dlist"><li><b>Путь</b> к укрытию;</li><li><i>имя</i> существа рядом.</li></ul>' +
        '<ol class="dlist" start="1"><li>Задайте вопрос.</li><li>Бросьте d6.</li></ol>' +
        '<table class="dtable"><thead><tr><th scope="col">Бросок</th><th scope="col">Ответ</th></tr></thead>' +
        '<tbody><tr><td>1-3</td><td>Нет</td></tr><tr><td>4-6</td><td><b>Да</b></td></tr></tbody></table>'
    );
    await expectNoA11yViolations(document.body);
  });
});

describe('the artifact weapon', () => {
  it('reads as an artifact card: the artifact tag, the class tag, no tier band, the strip', async () => {
    const { container } = render(App, { env: await atSet('af2') });
    await opened();
    const card = document.querySelector('.pcard[data-pid="af2"]');
    expect(card?.querySelector('.pc-tier')).toBeNull();
    const tags = card?.querySelectorAll('.pc-tag');
    expect(tags?.[0]).toHaveClass('on');
    expect(tags?.[0]?.textContent).toBe('Артефакт');
    expect(tags?.[1]?.textContent).toBe('Физическое');
    expect(card?.querySelectorAll('.pc-strip')).toHaveLength(1);
    expect(card?.querySelector('.pc-cells')?.textContent).toBe(
      '+6УронфизЧертаСилаДистанцияВплотную'
    );
    expect(card?.textContent).not.toContain('Ранг');
    await expectNoA11yViolations(container);
  });
});

describe('the community card', () => {
  it('names the community and then the book in the source line', async () => {
    render(App, { env: await atSet('cm1') });
    await opened();
    const card = document.querySelector('.pcard[data-pid="cm1"]');
    const spans = card?.querySelectorAll('.pc-bottom span');
    // spans[1] is positional on purpose: it isolates the source line's own
    // span from its sibling in `.pc-bottom`.
    expect(spans?.[1]?.textContent).toBe('Сообщества · Великородное');
  });
});

describe('black and white', () => {
  it('switches every card, hides the art, and reorders the head', async () => {
    render(App, { env: await atSet('q1-a1') });
    await opened();
    await userEvent.click(screen.getByRole('button', { name: 'Чёрно-белая' }));
    expect(screen.getByRole('button', { name: 'Чёрно-белая' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Цветная' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(document.querySelector('.psheet.bw')).toBeInTheDocument();
    expect(document.querySelectorAll('.pcard.bw')).toHaveLength(2);
    expect(document.querySelector('.pc-art')).toBeNull();
    expect(document.querySelector('.pc-img')).toBeNull();
    expect(document.querySelector('.pc-back')).toBeNull();
    expect(document.querySelector('.pc-glyph')).toBeNull();

    const weapon = document.querySelector('.pcard[data-pid="q1"]');
    const head = weapon?.querySelector('.pc-head');
    expect(head).toHaveClass('withtier');
    const order = Array.from(head?.children ?? []).map((c) => c.classList[0]);
    expect(order).toEqual(['pc-tier', 'pc-tags', 'pc-burden']);
    expect(head?.querySelector('.pc-tier img')).toHaveAttribute('src', 'card/banner-bw.svg');
    expect(head?.querySelector('.pc-burden img')).toHaveAttribute(
      'src',
      'card/burden-1-bw.svg'
    );
    expect(weapon?.querySelector('.pc-die img')).toHaveAttribute('src', 'card/die-d8-bw.svg');
    expect(weapon?.querySelector('.pc-ribbon')).toHaveAttribute('src', 'card/ribbon-bw.svg');

    const armour = document.querySelector('.pcard[data-pid="a1"]');
    expect(armour?.querySelector('.pc-shield img')).toHaveAttribute(
      'src',
      'card/shield-bw.svg'
    );
    expect(armour?.querySelector('.pc-th-box img')).toHaveAttribute('src', 'card/thbox-bw.svg');
    expect(armour?.querySelector('.pc-th-lab img')).toHaveAttribute('src', 'card/dots1.svg');

    const loot = document.querySelector('.pcard[data-pid="ci1"]');
    expect(loot).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Цветная' }));
    expect(document.querySelector('.pc-art')).toBeInTheDocument();
  });

  it('sizes the head marks before their images load, so the fit measures the real head', async () => {
    render(App, { env: await atSet('q1-a1') });
    await opened();
    await userEvent.click(screen.getByRole('button', { name: 'Чёрно-белая' }));
    const marks = Array.from(
      document.querySelectorAll('.pc-head .pc-shield img, .pc-head .pc-burden img')
    );
    expect(marks.map((img) => [img.getAttribute('width'), img.getAttribute('height')])).toEqual(
      [
        ['62', '36'],
        ['33', '36']
      ]
    );
  });

  it('survives leaving the print page and coming back, stores nothing, and a reload draws the default', async () => {
    const env = await atSet('q1-a1');
    const first = render(App, { env });
    await opened();
    const hash = env.router.hash();
    await userEvent.click(screen.getByRole('button', { name: 'Чёрно-белая' }));
    expect(document.querySelector('.psheet.bw')).toBeInTheDocument();

    env.router.navigate('#/roll/std');
    await tick();
    env.router.navigate(hash);
    await opened();
    expect(document.querySelector('.psheet.bw')).toBeInTheDocument();
    expect(env.storage.get('dhloot.prefs.v1')).toBeNull();
    first.unmount();

    /* A reload empties the fake: the seeded set holds the same two records' ids. */
    render(App, {
      env: at('#/p/set-twocards', { cloud: fakeCloud(SEED, 'gm2'), storage: env.storage })
    });
    await opened();
    expect(document.querySelector('.psheet.bw')).toBeNull();
  });

  it('draws the stored default at arrival', async () => {
    render(App, {
      env: await atSet('q1-a1', {
        storage: memoryStorage({
          'dhloot.prefs.v1': '{"view":"list","printBw":true,"printCompact":false}'
        })
      })
    });
    await opened();
    expect(document.querySelector('.psheet.bw')).toBeInTheDocument();
  });
});

describe('the note under the bar', () => {
  const note = (): Element | null => document.querySelector('.keepnote');

  it('links the account while either switch differs from the default, and goes when both are back', async () => {
    const { container } = render(App, { env: await atSet('ci1-q1') });
    await opened();
    expect(note()).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Чёрно-белая' }));
    expect(note()).toHaveTextContent(
      'Только до перезагрузки. Чтобы сохранить, измените в настройках аккаунта.'
    );
    expect(screen.getByRole('link', { name: 'настройках аккаунта' })).toHaveAttribute(
      'href',
      '#/account'
    );
    expect(document.querySelector('.printbar')).toContainElement(note() as HTMLElement);
    expect(note()).not.toHaveClass('printnote');
    await expectNoA11yViolations(container);

    await userEvent.click(screen.getByRole('button', { name: 'Компактная' }));
    await userEvent.click(screen.getByRole('button', { name: 'Цветная' }));
    expect(note()).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Обычная' }));
    expect(note()).toBeNull();
  });
});

describe('compact', () => {
  const pressed = (name: string): string | null =>
    screen.getByRole('button', { name }).getAttribute('aria-pressed');

  it('prints sixteen places to a sheet in either layout, independent of the colour switch', async () => {
    render(App, { env: await atSet('ci1-q1') });
    await opened();
    await userEvent.click(screen.getByRole('button', { name: 'Компактная' }));
    expect(pressed('Компактная')).toBe('true');
    expect(pressed('Обычная')).toBe('false');
    expect(pressed('Цветная')).toBe('true');
    expect(pressed('Чёрно-белая')).toBe('false');
    expect(document.querySelector('.psheet.compact:not(.bw)')).toBeInTheDocument();
    expect(document.querySelectorAll('.psheet')).toHaveLength(1);
    expect(document.querySelectorAll('.pcard')).toHaveLength(16);
    expect(document.querySelectorAll('.pcard.blank')).toHaveLength(14);
    expect(document.querySelectorAll('.pc-art')).toHaveLength(2);
    expect(
      screen.getByText(
        'Карточек: 2. Листов A4: 1. Размер карты 44×63 мм — шестнадцать на лист.'
      )
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Чёрно-белая' }));
    expect(document.querySelector('.psheet.compact.bw')).toBeInTheDocument();
    expect(document.querySelector('.pc-art')).toBeNull();
    expect(pressed('Компактная')).toBe('true');

    await userEvent.click(screen.getByRole('button', { name: 'Обычная' }));
    expect(document.querySelector('.psheet.compact')).toBeNull();
    expect(document.querySelector('.psheet.bw')).toBeInTheDocument();
    expect(document.querySelectorAll('.pcard')).toHaveLength(9);
    expect(pressed('Чёрно-белая')).toBe('true');
    expect(
      screen.getByText(
        'Карточек: 2. Листов A4: 1. Размер карты 63×88 мм — как у обычной игральной.'
      )
    ).toBeInTheDocument();
  });

  it('survives leaving the print page and coming back, and is off on a fresh start', async () => {
    const env = await atSet('q1-a1');
    const first = render(App, { env });
    await opened();
    const hash = env.router.hash();
    await userEvent.click(screen.getByRole('button', { name: 'Компактная' }));
    env.router.navigate('#/roll/std');
    await tick();
    env.router.navigate(hash);
    await opened();
    expect(document.querySelector('.psheet.compact')).toBeInTheDocument();
    first.unmount();

    render(App, { env: await atSet('q1-a1') });
    await opened();
    expect(document.querySelector('.psheet.compact')).toBeNull();
    expect(pressed('Обычная')).toBe('true');
  });
});

describe('a second sheet', () => {
  const TEN: Loot = {
    items: {
      core_item: Array.from({ length: 10 }, (_, i) =>
        row({
          id: `m${String(i + 1)}`,
          en: `Multi ${String(i + 1)}`,
          ru: `Штука ${String(i + 1)}`
        })
      )
    },
    eq: [],
    refs: {}
  };
  const ids = Array.from({ length: 10 }, (_, i) => `m${String(i + 1)}`).join('-');

  it('splits eighteen places across two sheets, eight blank on the second, marked as a page break', async () => {
    render(App, { env: await atSet(ids, { data: fakeData(TEN) }) });
    await opened();
    expect(document.querySelectorAll('.psheet')).toHaveLength(2);
    expect(document.querySelectorAll('.pcard:not(.blank)')).toHaveLength(10);
    expect(document.querySelectorAll('.pcard.blank')).toHaveLength(8);
    const sheets = document.querySelectorAll('.psheet');
    expect(sheets[0]).not.toHaveAttribute('data-next');
    expect(sheets[1]).toHaveAttribute('data-next', '1');
    expect(sheets[1]?.querySelectorAll('.pcard.blank')).toHaveLength(8);
    expect(sheets[0]?.querySelectorAll('.pcard.blank')).toHaveLength(0);
    expect(
      screen.getByText(
        'Карточек: 10. Листов A4: 2. Размер карты 63×88 мм — как у обычной игральной.'
      )
    ).toBeInTheDocument();
    expect(document.querySelector('.warnnote')).toBeNull();
  });

  it('fits the same ten on one compact sheet, six blank, with no page break', async () => {
    render(App, { env: await atSet(ids, { data: fakeData(TEN) }) });
    await opened();
    await userEvent.click(screen.getByRole('button', { name: 'Компактная' }));
    expect(document.querySelectorAll('.psheet.compact')).toHaveLength(1);
    expect(document.querySelectorAll('.pcard.blank')).toHaveLength(6);
    expect(document.querySelector('.psheet[data-next]')).toBeNull();
    expect(
      screen.getByText(
        'Карточек: 10. Листов A4: 1. Размер карты 44×63 мм — шестнадцать на лист.'
      )
    ).toBeInTheDocument();
  });
});

describe('the cap', () => {
  const MANY: Loot = {
    items: {
      core_item: Array.from({ length: 180 }, (_, i) =>
        row({
          id: `n${String(i + 1)}`,
          en: `Many ${String(i + 1)}`,
          ru: `Много ${String(i + 1)}`
        })
      )
    },
    eq: [],
    refs: {}
  };
  const ids180 = Array.from({ length: 180 }, (_, i) => `n${String(i + 1)}`).join('-');

  it('prints 180 cards on twenty sheets with no note', async () => {
    render(App, { env: await atSet(ids180, { data: fakeData(MANY) }) });
    await opened();
    expect(document.querySelectorAll('.pcard:not(.blank)')).toHaveLength(180);
    expect(document.querySelectorAll('.psheet')).toHaveLength(20);
    expect(document.querySelector('.warnnote')).toBeNull();
  });

  it('prints the same 180 cards on twelve compact sheets', async () => {
    render(App, { env: await atSet(ids180, { data: fakeData(MANY) }) });
    await opened();
    await userEvent.click(screen.getByRole('button', { name: 'Компактная' }));
    expect(document.querySelectorAll('.pcard:not(.blank)')).toHaveLength(180);
    expect(document.querySelectorAll('.psheet.compact')).toHaveLength(12);
    expect(document.querySelectorAll('.pcard.blank')).toHaveLength(12);
  });
});

describe('nothing to print', () => {
  it('draws the heading, the empty note and a way home for a set of no known card', async () => {
    render(App, { env: await atSet('zzz') });
    expect(
      await screen.findByText('Печатать нечего: в наборе не осталось карточек.')
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Печать карточек' })).toBeInTheDocument();
    const main = document.querySelector('main') as HTMLElement;
    const link = within(main).getByRole('link', { name: 'На главную' });
    expect(link).toHaveAttribute('href', '#/roll/std');
    expect(link).toHaveClass('primary');
    expect(document.querySelector('.printbar')).toBeNull();
    expect(document.querySelector('.psheet')).toBeNull();
    expect(document.querySelector('.printnote')).toBeNull();
  });
});

describe('back', () => {
  it('steps back in history when there is somewhere to go', async () => {
    const env = await atSet('ci1', { from: '#/roll/std' });
    render(App, { env });
    await opened();
    await userEvent.click(screen.getByRole('button', { name: 'Назад' }));
    expect(env.router.hash()).toBe('#/roll/std');
  });

  it('goes home when there is nowhere to go back to', async () => {
    const env = await atSet('ci1');
    render(App, { env });
    await opened();
    await userEvent.click(screen.getByRole('button', { name: 'Назад' }));
    expect(env.router.hash()).toBe('#/roll/std');
  });
});

describe('print', () => {
  it('opens the print dialog', async () => {
    const dialog = fakeDialog();
    render(App, { env: await atSet('ci1', { dialog }) });
    await opened();
    await userEvent.click(screen.getByRole('button', { name: 'Отправить на печать' }));
    expect(dialog.printed).toBe(1);
  });
});

describe('the link', () => {
  it("copies the set's own address", async () => {
    const clip = fakeClipboard();
    const env = await atSet('ci1-q1', { clipboard: clip });
    render(App, { env });
    await opened();
    await userEvent.click(screen.getByRole('button', { name: 'Ссылка на набор' }));
    expect(clip.last.text).toBe('https://example.test/' + env.router.hash());
    expect(clip.last.text).toMatch(/^https:\/\/example\.test\/#\/p\/[A-Za-z0-9_-]{12}$/);
    expect(screen.getByText('Ссылка скопирована')).toBeInTheDocument();
  });

  it('copies the English address in English', async () => {
    const clip = fakeClipboard();
    const env = await atSet('ci1-q1', {
      clipboard: clip,
      storage: memoryStorage({ 'dhloot.lang.v1': 'en' })
    });
    const { container } = render(App, { env });
    await opened();
    await userEvent.click(screen.getByRole('button', { name: 'Link to this set' }));
    expect(clip.last.text).toBe('https://example.test/en/' + env.router.hash());
    await expectNoA11yViolations(container);
  });

  it("copies the set's preview link, with no v, in the language on screen", async () => {
    const ORIGIN = 'https://daggerheart-loot.pages.dev';
    const clip = fakeClipboard();
    const env = await atSet('ci1-q1', { clipboard: clip, preview: ORIGIN });
    render(App, { env });
    await opened();
    await userEvent.click(screen.getByRole('button', { name: 'Ссылка на набор' }));
    expect(clip.last.text).toBe(ORIGIN + env.router.hash().slice(1));
    expect(clip.last.text).toMatch(
      /^https:\/\/daggerheart-loot\.pages\.dev\/p\/[A-Za-z0-9_-]{12}$/
    );
    cleanup();
    const en = fakeClipboard();
    const enEnv = await atSet('ci1-q1', {
      clipboard: en,
      preview: ORIGIN,
      storage: memoryStorage({ 'dhloot.lang.v1': 'en' })
    });
    render(App, { env: enEnv });
    await opened();
    await userEvent.click(screen.getByRole('button', { name: 'Link to this set' }));
    expect(en.last.text).toBe(ORIGIN + '/en' + enEnv.router.hash().slice(1));
  });

  it('toasts the failure when the clipboard refuses', async () => {
    const clip = fakeClipboard({ fail: true });
    render(App, { env: await atSet('ci1', { clipboard: clip }) });
    await opened();
    await userEvent.click(screen.getByRole('button', { name: 'Ссылка на набор' }));
    expect(screen.getByText('Не удалось скопировать')).toBeInTheDocument();
  });
});

describe('a count from a list', () => {
  const expectCounted = (): void => {
    const counted = document.querySelector('.pcard[data-pid="ci1"]');
    expect(counted?.querySelector('.pc-name')?.textContent).toBe('Вещь С Картинкой ×3');
    expect(counted?.querySelector('.pc-qty')?.textContent).toBe(' ×3');
    /* jsdom's name computation trims the span's leading space; the Chrome
       tree in the `#/p/set-counted1 as gm2` golden keeps it. */
    expect(screen.getByRole('heading', { name: /^Вещь С Картинкой ?×3$/ })).toBeInTheDocument();
    expect(document.querySelector('.pcard[data-pid="q1"] .pc-qty')).toBeNull();
    expect(
      screen.getByText(
        'Карточек: 2. Листов A4: 1. Размер карты 63×88 мм — как у обычной игральной.'
      )
    ).toBeInTheDocument();
  };

  it('follows the counted name and leaves an uncounted card bare, in colour', async () => {
    const { container } = render(App, { env: await atSet('ci1*3-q1') });
    await opened();
    expectCounted();
    await expectNoA11yViolations(container);
  });

  it('keeps the count in black and white', async () => {
    const { container } = render(App, { env: await atSet('ci1*3-q1') });
    await opened();
    await userEvent.click(screen.getByRole('button', { name: 'Чёрно-белая' }));
    expect(document.querySelector('.psheet.bw')).not.toBeNull();
    expectCounted();
    await expectNoA11yViolations(container);
  });
});

describe('the fit is wired', () => {
  /* jsdom lays nothing out - clientWidth/clientHeight/offsetTop and a
     Range's rect are all zero - so every loop in `fit()` would exit at once
     and the art arithmetic would divide by zero. Faked here exactly enough
     to walk every branch: `.pc-text`'s scrollHeight comes from the case,
     everything else measures 100 tall, and a Range reads as the case sets,
     one line wide, by the text it holds. */
  const fakeLayout = (
    textScroll: (text: HTMLElement) => number,
    rangeWidth: number | ((text: string) => number),
    /* A value's line rects by its inline `whiteSpace` and `fontSize`; null
       falls back to one line of `rangeWidth`. */
    lineRects?: (value: HTMLElement) => { width: number; top: number }[] | null
  ): (() => void) => {
    const widthDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
    const heightDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight');
    const topDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetTop');
    const scrollDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight');
    // eslint-disable-next-line @typescript-eslint/unbound-method -- restored, never called unbound
    const rectFn = Range.prototype.getBoundingClientRect;
    // eslint-disable-next-line @typescript-eslint/unbound-method -- restored, never called unbound
    const rectsFn = Range.prototype.getClientRects;
    const widthOf = (r: Range): number =>
      typeof rangeWidth === 'number' ? rangeWidth : rangeWidth(r.toString());

    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get(this: HTMLElement) {
        return 238;
      }
    });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      get(this: HTMLElement) {
        return 100;
      }
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
      configurable: true,
      get() {
        return 0;
      }
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get(this: HTMLElement) {
        return this.classList.contains('pc-text') ? textScroll(this) : 100;
      }
    });
    Range.prototype.getBoundingClientRect = function (this: Range) {
      return { width: widthOf(this) } as DOMRect;
    };
    Range.prototype.getClientRects = function (this: Range) {
      const host = this.startContainer;
      const own = lineRects && host instanceof HTMLElement ? lineRects(host) : null;
      return (own ?? [{ width: widthOf(this), top: 0 }]) as unknown as DOMRectList;
    };

    return () => {
      if (widthDesc) Object.defineProperty(HTMLElement.prototype, 'clientWidth', widthDesc);
      if (heightDesc) Object.defineProperty(HTMLElement.prototype, 'clientHeight', heightDesc);
      if (topDesc) Object.defineProperty(HTMLElement.prototype, 'offsetTop', topDesc);
      if (scrollDesc) Object.defineProperty(HTMLElement.prototype, 'scrollHeight', scrollDesc);
      Range.prototype.getBoundingClientRect = rectFn;
      Range.prototype.getClientRects = rectsFn;
    };
  };

  /* `.pc-text` is always tight here, so the grow rung is skipped. */
  it('reaches every step of the ladder and lands on the live floors', async () => {
    const restore = fakeLayout(() => 140, 9999);
    try {
      render(App, { env: await atSet('q1') });
      await opened();
      const card = document.querySelector('.pcard[data-pid="q1"]');
      expect(card?.querySelector('.pc-strip .pc-box b')).toHaveStyle({ fontSize: '2.2cqw' });
      expect(card?.querySelector('.pc-text')).toHaveStyle({ fontSize: '2.6cqw' });
      const content = card?.querySelector<HTMLElement>('.pc-content');
      expect(content?.style.getPropertyValue('--pcpad')).toBe('8cqw');
      const art = card?.querySelector<HTMLElement>('.pc-art');
      expect(art?.style.height).toBe('14cqw');
      expect(art?.style.getPropertyValue('--artw')).toBe('7cqw');
      expect(art?.style.display).toBe('none');

      await userEvent.click(screen.getByRole('button', { name: 'Чёрно-белая' }));
      const content2 = document.querySelector<HTMLElement>('.pcard[data-pid="q1"] .pc-content');
      expect(content2?.style.getPropertyValue('--pcpad')).toBe('2.8cqw');
      expect(document.querySelector('.pcard[data-pid="q1"] .pc-text')).toHaveStyle({
        fontSize: '2.6cqw'
      });

      /* The ladder is size-blind: every dimension is `cqw`. */
      await userEvent.click(screen.getByRole('button', { name: 'Компактная' }));
      await userEvent.click(screen.getByRole('button', { name: 'Цветная' }));
      const compact = document.querySelector('.pcard[data-pid="q1"]');
      expect(compact?.querySelector('.pc-text')).toHaveStyle({ fontSize: '2.6cqw' });
      expect(
        compact?.querySelector<HTMLElement>('.pc-content')?.style.getPropertyValue('--pcpad')
      ).toBe('8cqw');
      expect(compact?.querySelector<HTMLElement>('.pc-art')?.style.display).toBe('none');
    } finally {
      restore();
    }
  });

  it('shrinks each strip value on its own, and the label beside a modifier', async () => {
    const restore = fakeLayout(
      () => 50,
      (text) => (text === 'Сила' || text === 'Урон' ? 9999 : 0)
    );
    try {
      const { container } = render(App, { env: await atSet('q8b3') });
      await opened();
      const strip = document.querySelector<HTMLElement>('.pcard[data-pid="q8b3"] .pc-strip');
      const size = (sel: string): string | undefined =>
        strip?.querySelector<HTMLElement>(sel)?.style.fontSize;
      expect(strip?.querySelector('.pc-c2 b')?.textContent).toBe('Сила');
      expect(size('.pc-c2 b')).toBe('2.2cqw');
      /* It never fitted one line, so it wraps. */
      expect(strip?.querySelector<HTMLElement>('.pc-c2 b')?.style.whiteSpace).toBe('');
      expect(size('.pc-c1 b')).toBe('');
      expect(size('.pc-c3 b')).toBe('');
      expect(strip?.querySelector('.pc-c1 small')?.textContent).toBe('Урон');
      expect(size('.pc-c1 small')).toBe('2.2cqw');
      /* Only the label that shares its cell with the modifier shrinks. */
      expect(size('.pc-c2 small')).toBe('');
      expect(strip?.style.height).toBe('');
      await expectNoA11yViolations(container);
    } finally {
      restore();
    }
  });

  it('keeps a value on one line down to the label floor, else wraps it at 1.2 leading', async () => {
    const restore = fakeLayout(
      () => 50,
      0,
      (v) => {
        const one = v.style.whiteSpace === 'nowrap';
        const size = parseFloat(v.style.fontSize || '3');
        /* Fits one line only at 2.8cqw (5pt on a 238px card) and below. */
        if (v.textContent === 'Вплотную')
          return [{ width: one && size > 2.8 ? 9999 : 100, top: 0 }];
        /* Never fits one line; wrapped, it takes two. */
        if (v.textContent === 'Сила')
          return one
            ? [{ width: 9999, top: 0 }]
            : [
                { width: 100, top: 0 },
                { width: 100, top: 20 }
              ];
        return null;
      }
    );
    try {
      const { container } = render(App, { env: await atSet('q8b3') });
      await opened();
      const strip = document.querySelector<HTMLElement>('.pcard[data-pid="q8b3"] .pc-strip');
      const range = strip?.querySelector<HTMLElement>('.pc-c3 b');
      expect(range?.textContent).toBe('Вплотную');
      expect(range?.style.whiteSpace).toBe('nowrap');
      expect(range?.style.fontSize).toBe('2.8cqw');
      expect(range?.style.lineHeight).toBe('');
      const trait = strip?.querySelector<HTMLElement>('.pc-c2 b');
      expect(trait?.style.whiteSpace).toBe('');
      expect(trait?.style.fontSize).toBe('');
      expect(trait?.style.lineHeight).toBe('1.2');
      await expectNoA11yViolations(container);
    } finally {
      restore();
    }
  });

  it('grows short black-and-white text to the cap, and leaves colour alone', async () => {
    const restore = fakeLayout(() => 50, 0);
    try {
      render(App, { env: await atSet('q1') });
      await opened();
      const text = (): HTMLElement | null =>
        document.querySelector<HTMLElement>('.pcard[data-pid="q1"] .pc-text');
      expect(text()?.style.fontSize).toBe('');

      await userEvent.click(screen.getByRole('button', { name: 'Чёрно-белая' }));
      /* The CSSOM reads the written `5.0cqw` back as `5cqw`. */
      expect(text()?.style.fontSize).toBe('5cqw');
      const content = document.querySelector<HTMLElement>('.pcard[data-pid="q1"] .pc-content');
      expect(content?.style.getPropertyValue('--pcpad')).toBe('');

      /* A size change fits the card again at its new size. */
      const before = text();
      if (before) before.style.fontSize = '';
      await userEvent.click(screen.getByRole('button', { name: 'Компактная' }));
      expect(text()?.style.fontSize).toBe('5cqw');
    } finally {
      restore();
    }
  });

  it('steps back below the first size that spills', async () => {
    /* Tight above 4.04cqw: 4.0 measures 100, 4.1 measures 102. */
    const restore = fakeLayout(
      (el) => Math.round(parseFloat(el.style.fontSize || '3.5') * 25),
      0
    );
    try {
      render(App, { env: await atSet('q1') });
      await opened();
      await userEvent.click(screen.getByRole('button', { name: 'Чёрно-белая' }));
      expect(
        document.querySelector<HTMLElement>('.pcard[data-pid="q1"] .pc-text')?.style.fontSize
      ).toBe('4cqw');
    } finally {
      restore();
    }
  });
});

describe('no data', () => {
  it('says the data did not load, and nothing else', async () => {
    render(App, { env: await atSet('ci1', { data: noData() }) });
    expect(
      await screen.findByText('Данные не загрузились. Обновите страницу.')
    ).toBeInTheDocument();
    expect(document.querySelector('.psheet')).toBeNull();
    expect(document.querySelector('.printbar')).toBeNull();
  });
});

describe('English', () => {
  it('translates the bar, the note and the card text', async () => {
    render(App, { env: await atSet('q1-a1') });
    await opened();
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByRole('heading', { name: 'Printing cards' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Cards: 2. A4 sheets: 1. Card size 63×88 mm - the size of a playing card.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send to printer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Colour' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Black and white' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Standard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Compact' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Card size' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Link to this set' })).toBeInTheDocument();

    const weapon = document.querySelector('.pcard[data-pid="q1"]');
    expect(weapon?.querySelector('.pc-tier')?.textContent).toBe('1Tier');
    expect(weapon?.querySelector('.pc-tag.on')?.textContent).toBe('Primary weapon');
    expect(weapon?.querySelector('.pc-tag.out')?.textContent).toBe('Physical');
    expect(weapon?.querySelector('.pc-burden small')?.textContent).toBe('Burden');
    expect(weapon?.querySelector('.pc-cells')?.textContent).toBe(
      'DamagephyTraitAgilityRangeMelee'
    );

    const armour = document.querySelector('.pcard[data-pid="a1"]');
    const labs = armour?.querySelectorAll('.pc-th-lab');
    expect(Array.from(labs ?? []).map((l) => l.textContent)).toEqual([
      'Minor damage',
      'Major damage',
      'Severe damage'
    ]);
    expect(armour?.querySelector('.pc-tag')?.textContent).toBe('Armor');

    expect(document.title).toBe('Daggerheart Loot Generator');

    await userEvent.click(screen.getByRole('button', { name: 'Compact' }));
    expect(
      screen.getByText('Cards: 2. A4 sheets: 1. Card size 44×63 mm - sixteen to a sheet.')
    ).toBeInTheDocument();
  });
});

describe('the states of #/p/', () => {
  const ru = dict('ru');
  const home = (): HTMLElement =>
    within(document.querySelector('main') as HTMLElement).getByRole('link', {
      name: 'На главную'
    });

  it('draws the gone state for a malformed id signed in and signed out, and never reads', async () => {
    for (const as of ['gm2', undefined]) {
      const cloud = fakeCloud(SEED, as);
      const read = vi.spyOn(cloud.prints, 'read');
      const { unmount } = render(App, { env: at('#/p/short', { cloud }) });
      expect(await screen.findByText(ru.printSetGone)).toBeInTheDocument();
      expect(home()).toHaveAttribute('href', '#/roll/std');
      await new Promise((r) => setTimeout(r, 0));
      expect(read).not.toHaveBeenCalled();
      unmount();
    }
  });

  it('asks a signed-out reader to sign in, and «Войти» opens the account page', async () => {
    const env = at('#/p/set-twocards', { cloud: fakeCloud(SEED) });
    render(App, { env });
    expect(await screen.findByText(ru.signInToPrint)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Печать карточек' })).toBeInTheDocument();
    expect(document.querySelector('.psheet')).toBeNull();
    await userEvent.click(
      within(document.querySelector('main') as HTMLElement).getByRole('button', {
        name: 'Войти'
      })
    );
    expect(env.router.hash()).toBe('#/account');
  });

  it('says it loads while the read runs', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    vi.spyOn(cloud.prints, 'read').mockReturnValue(new Promise(() => undefined));
    render(App, { env: at('#/p/set-twocards', { cloud }) });
    expect(await screen.findByText(ru.cloudLoading)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Печать карточек' })).toBeInTheDocument();
  });

  it('says a failed read, and «Повторить» reads again', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const env = await atSet('ci1-q1', { port: cloud });
    cloud.setOffline(true);
    render(App, { env });
    expect(await screen.findByText(ru.printLoadFailed)).toBeInTheDocument();
    cloud.setOffline(false);
    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    await opened();
    expect(document.querySelectorAll('.pcard[data-pid]')).toHaveLength(2);
  });

  it('draws the gone state for an unknown and an expired id', async () => {
    for (const id of ['AbCdEf-_1234', 'set-expired1']) {
      const { unmount } = render(App, {
        env: at('#/p/' + id, { cloud: fakeCloud(SEED, 'gm2') })
      });
      expect(await screen.findByText(ru.printSetGone)).toBeInTheDocument();
      expect(home()).toHaveClass('primary');
      expect(document.querySelector('.psheet')).toBeNull();
      unmount();
    }
  });

  it('names the deleted items in the red note under the bar', async () => {
    render(App, { env: at('#/p/set-missing1', { cloud: fakeCloud(SEED, 'gm2') }) });
    await opened();
    const note = document.querySelector('.printbar p.printnote.warnnote');
    expect(note).toHaveTextContent(ru.printSetMissing.replace('%d', '1'));
    expect(document.querySelectorAll('.pcard[data-pid]')).toHaveLength(1);
  });

  it('says nothing is left to print when every item is deleted', async () => {
    const { container } = render(App, {
      env: at('#/p/set-allgone1', { cloud: fakeCloud(SEED, 'gm2') })
    });
    expect(await screen.findByText(ru.printEmpty)).toBeInTheDocument();
    expect(document.querySelector('p.printnote.warnnote')).toHaveTextContent(
      ru.printSetMissing.replace('%d', '2')
    );
    expect(home()).toHaveAttribute('href', '#/roll/std');
    await expectNoA11yViolations(container);
  });

  it('draws the sign-in state when the reader signs out on the sheet', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    render(App, { env: await atSet('ci1', { port: cloud }) });
    await opened();
    await cloud.auth.signOut();
    expect(await screen.findByText(ru.signInToPrint)).toBeInTheDocument();
    expect(document.querySelector('.psheet')).toBeNull();
  });

  it('draws the not-found page with no sign-in configured', () => {
    render(App, { env: at('#/p/set-twocards') });
    expect(screen.getByRole('heading', { name: ru.notFound })).toBeInTheDocument();
  });

  it('draws the retired page for an old long link in both builds, the address kept', () => {
    for (const cloud of [null, fakeCloud(SEED, 'gm2')]) {
      const env = at('#/print/ci1-q1', { cloud });
      const { unmount } = render(App, { env });
      expect(screen.getByRole('heading', { name: ru.printLinkRetired })).toBeInTheDocument();
      expect(screen.getByText(ru.printLinkRetiredSub)).toBeInTheDocument();
      expect(home()).toHaveAttribute('href', '#/roll/std');
      expect(env.router.hash()).toBe('#/print/ci1-q1');
      expect(document.querySelector('.psheet')).toBeNull();
      unmount();
    }
  });
});

describe('axe', () => {
  it('has no violations on either sheet size in either layout', async () => {
    const colour = render(App, { env: await atSet('ci1-q1') });
    await opened();
    await expectNoA11yViolations(colour.container);
    colour.unmount();

    const bwRender = render(App, { env: await atSet('ci1-q1') });
    await opened();
    await userEvent.click(screen.getByRole('button', { name: 'Чёрно-белая' }));
    await expectNoA11yViolations(bwRender.container);
    bwRender.unmount();

    const compactColour = render(App, { env: await atSet('ci1-q1') });
    await opened();
    await userEvent.click(screen.getByRole('button', { name: 'Компактная' }));
    await expectNoA11yViolations(compactColour.container);
    compactColour.unmount();

    const compactBw = render(App, { env: await atSet('ci1-q1') });
    await opened();
    await userEvent.click(screen.getByRole('button', { name: 'Компактная' }));
    await userEvent.click(screen.getByRole('button', { name: 'Чёрно-белая' }));
    expect(document.querySelector('.psheet.compact.bw')).toBeInTheDocument();
    await expectNoA11yViolations(compactBw.container);
  });

  it('has no violations on the sign-in, gone and retired pages', async () => {
    const ru = dict('ru');
    const signIn = render(App, { env: at('#/p/set-twocards', { cloud: fakeCloud(SEED) }) });
    await screen.findByText(ru.signInToPrint);
    await expectNoA11yViolations(signIn.container);
    signIn.unmount();

    const gone = render(App, { env: at('#/p/bad', { cloud: fakeCloud(SEED, 'gm2') }) });
    await screen.findByText(ru.printSetGone);
    await expectNoA11yViolations(gone.container);
    gone.unmount();

    const retired = render(App, { env: at('#/print/ci1-q1') });
    await expectNoA11yViolations(retired.container);
  });
});

describe('homebrew cards', () => {
  const AXE = 'hb_emberaxeaaaaaaaa';
  const POTION = 'hb_smithpotionaaaaa';
  const filled = (): HTMLElement[] => [
    ...document.querySelectorAll<HTMLElement>('.pcard:not(.blank)')
  ];
  const bottom = (card: HTMLElement | undefined): string =>
    card?.querySelector('.pc-bottom')?.textContent ?? '';

  it("prints gm1's axe and potion with their path as the source line, to gm1 and gm2 alike", async () => {
    for (const as of ['gm1', 'gm2']) {
      const { unmount } = render(App, {
        env: await atSet(`${AXE}-${POTION}`, { as, by: 'gm1' })
      });
      await opened();
      expect(screen.getByText('Топор Тлеющих Углей')).toBeInTheDocument();
      expect(filled(), as).toHaveLength(2);
      expect(bottom(filled()[0]), as).toContain('Мастерская Ольхи');
      expect(bottom(filled()[1]), as).toContain('Хоумбрю');
      unmount();
    }
  });

  it("draws the set's record, never the reader's own record of the same key", async () => {
    const OTHER = uuid(2960);
    const seed: Seed = {
      ...SEED,
      homebrew: {
        ...SEED.homebrew,
        gm3: {
          books: [],
          cards: [],
          items: [
            {
              id: OTHER,
              key: AXE,
              content: { kind: 'item', ru: 'Чужой топор' },
              createdAgoMs: 3_600_000,
              editedAgoMs: 3_600_000
            }
          ]
        }
      }
    };
    render(App, { env: await atSet([{ h: OTHER }], { as: 'gm1', by: 'gm3', seed }) });
    await opened();
    expect(screen.getByText('Чужой топор')).toBeInTheDocument();
    expect(screen.queryByText('Топор Тлеющих Углей')).toBeNull();
  });
});

describe("the author's own set members", () => {
  const label = (id: string): string | null | undefined => {
    const labels = document.querySelectorAll(`.pcard[data-pid="${id}"] .pc-text i`);
    return labels[labels.length - 1]?.textContent;
  };

  it('names the homebrew set members with (HB) and folds them past the third', async () => {
    const pieces = ['Г', 'В', 'Б', 'А'].map((ru, i) => ({
      id: uuid(701 + i),
      key: 'hb_piece' + String.fromCharCode(97 + i) + 'aaaaaaaaaa',
      content: { kind: 'item' as const, ru, set: 'pair' },
      createdAgoMs: 3_600_000,
      editedAgoMs: 3_600_000
    }));
    const seed: Seed = {
      ...SEED,
      homebrew: { ...SEED.homebrew, gm3: { books: [], cards: [], items: pieces } }
    };
    const { container } = render(App, { env: await atSet('st1', { as: 'gm3', seed }) });
    await opened();
    await waitFor(() => {
      expect(label('st1')).toBe(
        'Двойное пламя (Комплект: Угольный Клинок, Искристый Клинок, А (HB), Б (HB), В (HB) и ещё 1):'
      );
    });
    await expectNoA11yViolations(container);
  });

  it('keeps the printed own member in its set label when it is past the third own name', async () => {
    const pieces = ['Д', 'Г', 'В', 'Б', 'А'].map((ru, i) => ({
      id: uuid(711 + i),
      key: 'hb_piece' + String.fromCharCode(97 + i) + 'aaaaaaaaaa',
      content: { kind: 'item' as const, ru, set: 'pair' },
      createdAgoMs: 3_600_000,
      editedAgoMs: 3_600_000
    }));
    const last = pieces[0]?.key ?? '';
    const seed: Seed = {
      ...SEED,
      homebrew: { ...SEED.homebrew, gm3: { books: [], cards: [], items: pieces } }
    };
    const { container } = render(App, { env: await atSet(last, { as: 'gm3', seed }) });
    await opened();
    await waitFor(() => {
      expect(label(last)).toBe(
        'Двойное пламя (Комплект: Угольный Клинок, Искристый Клинок, А (HB), Б (HB), В (HB), Д (HB) и ещё 1):'
      );
    });
    await expectNoA11yViolations(container);
  });

  it("prints the account's own set on a book item, every member folded past the third", async () => {
    const card = {
      id: uuid(721),
      key: 'hb_ownbookssetaaaaa',
      kind: 'set' as const,
      content: {
        ru: 'Свой набор',
        rud: 'Бонус.',
        items: ['ci1', 'ni1', 'cc1', 'cm1', 'af1']
      },
      createdAgoMs: 3_600_000,
      editedAgoMs: 3_600_000
    };
    const seed: Seed = {
      ...SEED,
      homebrew: { ...SEED.homebrew, gm3: { books: [], cards: [card], items: [] } }
    };
    const { container } = render(App, { env: await atSet('ni1', { as: 'gm3', seed }) });
    await opened();
    await waitFor(() => {
      expect(label('ni1')).toBe(
        'Свой набор (Комплект: Вещь С Картинкой, Вещь Без Картинки, Зелье, Вещь Сообщества и ещё 1):'
      );
    });
    await expectNoA11yViolations(container);
  });

  it("prints a linked item's set bonus under its name alone when no other member is the reader's", async () => {
    const KEY = 'hb_frozensetpieceaa';
    const ITEM = uuid(2950);
    const seed: Seed = {
      ...SEED,
      homebrew: {
        ...SEED.homebrew,
        gm3: {
          books: [],
          cards: [
            {
              id: uuid(2951),
              key: 'hb_ownsetaaaaaaaaaa',
              kind: 'set',
              content: {
                ru: 'Чужой комплект',
                en: 'Borrowed Set',
                rud: 'Бонус комплекта.',
                ende: 'The set bonus.'
              },
              createdAgoMs: 3_600_000,
              editedAgoMs: 3_600_000
            }
          ],
          items: [
            {
              id: ITEM,
              key: KEY,
              content: { kind: 'item', ru: 'Чужой браслет', set: 'hb_ownsetaaaaaaaaaa' },
              createdAgoMs: 3_600_000,
              editedAgoMs: 3_600_000
            }
          ]
        }
      }
    };
    const { container } = render(App, { env: await atSet(KEY, { as: 'gm2', seed }) });
    await opened();
    expect(screen.getByText('Чужой браслет')).toBeInTheDocument();
    await waitFor(() => {
      expect(label(KEY)).toBe('Чужой комплект:');
    });
    expect(
      document
        .querySelector(`.pcard[data-pid="${KEY}"] .pc-text`)
        ?.textContent.endsWith(': Бонус комплекта.')
    ).toBe(true);
    await expectNoA11yViolations(container);
  });
});
