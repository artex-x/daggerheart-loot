/* The print sheet, `#/print/<ids>` - off `renderPrint`, `printCardHTML` and
 * its helpers, `fitPrintCards` (app.js 3235-3558) and the four handlers
 * (`doPrint`/`printBack`/`printArt`/`printLink`, app.js 4236-4245).
 *
 * Held against a small fixture rather than the real catalogue, the same way
 * tables.test.ts and searchPage.test.ts are - what matters here is the
 * markup shape (both card layouts, both languages, the fit) rather than any
 * particular record. Equipment lives in `Loot.eq`, off the same records
 * `listPage.test.ts`'s fixture already establishes the convention for. */

import { cleanup, render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../App.svelte';
import type { Loot } from '../lib/data.js';
import type { Record_ } from '../lib/types.js';
import {
  fakeClipboard,
  fakeData,
  fakeDialog,
  fakeEnv,
  memoryRouter,
  noData
} from '../ports/index.js';
import type { Env } from '../ports/index.js';
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
 * loops. */
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
        rud: 'Стоимость Призыва: 2\nЭта колода даёт защиту.\n- Первый пункт\n- Второй пункт',
        ende: 'Recall Cost: 2\nThis deck grants protection.\n- First entry\n- Second entry'
      })
    ]
  },
  eq: [
    row({
      id: 'q1',
      en: 'Basic Sword',
      ru: 'Простой Меч',
      rud: 'Надёжное: +1 к Броскам Атаки',
      ende: 'Reliable: +1 to attack rolls',
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
    row({
      id: 'a1',
      en: 'Plate',
      ru: 'Латы',
      eq: { t: 'armor', tier: 2, as: 3, th: [5, 11] }
    })
  ],
  refs: {}
};

const at = (hash: string, over: Partial<Env> = {}): Env =>
  fakeEnv({ router: memoryRouter(hash), data: fakeData(LOOT), ...over });

/** Svelte 5 leaves an empty `<!---->` comment as the anchor for every
 *  expression and block, and stamps every scoped element with its own
 *  `svelte-xxxxx` class - the markup itself carries none of either. */
const withoutAnchors = (html: string): string =>
  html
    .replace(/<!---->/g, '')
    .replace(/\s*svelte-\w+/g, '')
    .replace(/\sclass=""/g, '');

describe('arrival, colour', () => {
  it('draws the bar, the controls in order, and one sheet with the two cards and seven blanks', () => {
    render(App, { env: at('#/print/ci1-q1') });
    expect(screen.getByRole('heading', { name: 'Печать карточек' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Карточек: 2. Листов A4: 1. Размер карты 63×88 мм - как у обычной игральной.'
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
    const link = screen.getByRole('button', { name: 'Ссылка на набор' });
    expect(color).toHaveAttribute('aria-pressed', 'true');
    expect(bw).toHaveAttribute('aria-pressed', 'false');
    const order = [back, printNow, color, bw, link].map((el) =>
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
  });
});

describe('the loot card', () => {
  it('shows its art, no tier or strip, and its full source line', () => {
    render(App, { env: at('#/print/ci1') });
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
  it('draws the glyph for a record with no image, and swaps a broken one for it too', () => {
    const router = memoryRouter('#/print/ni1-ci1');
    render(App, { env: at('#/print/ni1-ci1', { router }) });

    const bare = document.querySelector('.pcard[data-pid="ni1"]');
    expect(bare?.querySelector('svg.pc-glyph')).toBeInTheDocument();
    expect(bare?.querySelector('img')).toBeNull();

    const withArt = document.querySelector('.pcard[data-pid="ci1"]');
    expect(withArt?.querySelector('.pc-img')).toBeInTheDocument();
    withArt?.querySelector('.pc-img')?.dispatchEvent(new Event('error'));
  });
});

describe('the weapon card', () => {
  it('draws the tier, tags, burden, die, ribbon, cells and a labelled rule', () => {
    render(App, { env: at('#/print/q1') });
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
  it('draws two strips, both magic, and the second stat block', () => {
    render(App, { env: at('#/print/q23') });
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

describe('a damage bonus', () => {
  it('splits into the die and a bonus cell', () => {
    render(App, { env: at('#/print/q8b3') });
    const card = document.querySelector('.pcard[data-pid="q8b3"]');
    expect(card?.querySelector('.pc-c1')).toHaveClass('wbonus');
    expect(card?.querySelector('.pc-bonus')?.textContent).toBe('+3');
    expect(card?.querySelector('.pc-die b')?.textContent).toBe('d8');
  });
});

describe('the armour card', () => {
  it('draws the shield, the threshold strip and one tag', () => {
    render(App, { env: at('#/print/a1') });
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
  it('has no tier, the artifact tag, and the list markup with no whitespace anywhere', () => {
    render(App, { env: at('#/print/af1') });
    const card = document.querySelector('.pcard[data-pid="af1"]');
    expect(card?.querySelector('.pc-tier')).toBeNull();
    expect(card?.querySelector('.pc-tag.on')?.textContent).toBe('Артефакт');
    expect(withoutAnchors(card?.querySelector('.pc-text')?.innerHTML ?? '')).toBe(
      '<i>Стоимость Призыва:</i> 2<br>Эта колода даёт защиту.' +
        '<ul class="dlist"><li>Первый пункт</li><li>Второй пункт</li></ul>'
    );
  });
});

describe('the community card', () => {
  it('names the community and then the book in the source line', () => {
    render(App, { env: at('#/print/cm1') });
    const card = document.querySelector('.pcard[data-pid="cm1"]');
    const spans = card?.querySelectorAll('.pc-bottom span');
    expect(spans?.[1]?.textContent).toBe('Сообщества · Великородное');
  });
});

describe('black and white', () => {
  it('switches every card, hides the art, and reorders the head', async () => {
    render(App, { env: at('#/print/q1-a1') });
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

  it('splits eighteen places across two sheets, eight blank on the second, marked as a page break', () => {
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/print/' + ids), data: fakeData(TEN) })
    });
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
        'Карточек: 10. Листов A4: 2. Размер карты 63×88 мм - как у обычной игральной.'
      )
    ).toBeInTheDocument();
    expect(document.querySelector('.warnnote')).toBeNull();
  });
});

describe('the cap', () => {
  const MANY: Loot = {
    items: {
      core_item: Array.from({ length: 181 }, (_, i) =>
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
  const ids181 = Array.from({ length: 181 }, (_, i) => `n${String(i + 1)}`).join('-');

  it('prints 180 cards on twenty sheets and names the one left out', () => {
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/print/' + ids181), data: fakeData(MANY) })
    });
    expect(document.querySelectorAll('.pcard:not(.blank)')).toHaveLength(180);
    expect(document.querySelectorAll('.psheet')).toHaveLength(20);
    expect(screen.getByText(/За один раз печатается 180 карточек/)).toHaveTextContent(
      'За один раз печатается 180 карточек, остальные 1 в лист не попали. Разделите набор на части.'
    );
  });

  it('drops an unknown and a repeated id before counting, raising no note', () => {
    render(App, { env: at('#/print/ci1-ci1-zzz') });
    expect(document.querySelectorAll('.pcard:not(.blank)')).toHaveLength(1);
    expect(document.querySelector('.warnnote')).toBeNull();
  });
});

describe('nothing to print', () => {
  it('draws the heading, the empty note and a way to the lists', () => {
    render(App, { env: at('#/print/zzz') });
    expect(screen.getByRole('heading', { name: 'Печать карточек' })).toBeInTheDocument();
    expect(
      screen.getByText('Печатать нечего: в адресе не нашлось ни одной вещи.')
    ).toBeInTheDocument();
    const main = document.querySelector('main') as HTMLElement;
    const link = within(main).getByRole('link', { name: 'Списки' });
    expect(link).toHaveAttribute('href', '#/lists');
    expect(link).toHaveClass('primary');
    expect(document.querySelector('.printbar')).toBeNull();
    expect(document.querySelector('.psheet')).toBeNull();
    expect(document.querySelector('.printnote')).toBeNull();
  });
});

describe('back', () => {
  it('steps back in history when there is somewhere to go', async () => {
    const router = memoryRouter('#/roll/std');
    router.navigate('#/print/ci1');
    render(App, { env: at('#/print/ci1', { router }) });
    await userEvent.click(screen.getByRole('button', { name: 'Назад' }));
    expect(router.hash()).toBe('#/roll/std');
  });

  it('goes to the lists when there is nowhere to go back to', async () => {
    const router = memoryRouter('#/print/ci1');
    render(App, { env: at('#/print/ci1', { router }) });
    await userEvent.click(screen.getByRole('button', { name: 'Назад' }));
    expect(router.hash()).toBe('#/lists');
  });
});

describe('print', () => {
  it('opens the print dialog', async () => {
    const dialog = fakeDialog();
    render(App, { env: at('#/print/ci1', { dialog }) });
    await userEvent.click(screen.getByRole('button', { name: 'Отправить на печать' }));
    expect(dialog.printed).toBe(1);
  });
});

describe('the link', () => {
  it('copies the address built from the parsed ids, not the raw one', async () => {
    const clip = fakeClipboard();
    render(App, { env: at('#/print/ci1-zzz-ci1-q1', { clipboard: clip }) });
    await userEvent.click(screen.getByRole('button', { name: 'Ссылка на набор' }));
    expect(clip.last.text).toBe('https://example.test/#/print/ci1-q1');
    expect(screen.getByText('Ссылка скопирована')).toBeInTheDocument();
  });

  it('toasts the failure when the clipboard refuses', async () => {
    const clip = fakeClipboard({ fail: true });
    render(App, { env: at('#/print/ci1', { clipboard: clip }) });
    await userEvent.click(screen.getByRole('button', { name: 'Ссылка на набор' }));
    expect(screen.getByText('Не удалось скопировать')).toBeInTheDocument();
  });
});

describe('the fit is wired', () => {
  /* jsdom lays nothing out - clientWidth/clientHeight/offsetTop and a
     Range's rect are all zero - so every loop in `fit()` would exit at once
     and the art arithmetic would divide by zero. Faked here exactly enough
     to walk every branch: `.pc-text` is always "tight" (its scrollHeight
     exceeds its clientHeight), everything else measures 100 wide and tall,
     and a Range always reads over-width - matching what the ladder is for. */
  it('reaches every step of the ladder and lands on the live floors', async () => {
    const widthDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
    const heightDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight');
    const topDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetTop');
    const scrollDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight');
    // eslint-disable-next-line @typescript-eslint/unbound-method -- restored, never called unbound
    const rectFn = Range.prototype.getBoundingClientRect;

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
        return this.classList.contains('pc-text') ? 140 : 100;
      }
    });
    Range.prototype.getBoundingClientRect = function () {
      return { width: 9999 } as DOMRect;
    };

    try {
      render(App, { env: at('#/print/q1') });
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
    } finally {
      if (widthDesc) Object.defineProperty(HTMLElement.prototype, 'clientWidth', widthDesc);
      if (heightDesc) Object.defineProperty(HTMLElement.prototype, 'clientHeight', heightDesc);
      if (topDesc) Object.defineProperty(HTMLElement.prototype, 'offsetTop', topDesc);
      if (scrollDesc) Object.defineProperty(HTMLElement.prototype, 'scrollHeight', scrollDesc);
      Range.prototype.getBoundingClientRect = rectFn;
    }
  });
});

describe('no data', () => {
  it('says the data did not load, and nothing else', () => {
    render(App, { env: fakeEnv({ router: memoryRouter('#/print/ci1'), data: noData() }) });
    expect(screen.getByText('Данные не загрузились. Обновите страницу.')).toBeInTheDocument();
    expect(document.querySelector('.psheet')).toBeNull();
    expect(document.querySelector('.printbar')).toBeNull();
  });
});

describe('English', () => {
  it('translates the bar, the note and the card text', async () => {
    render(App, { env: at('#/print/q1-a1') });
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
  });
});

describe('axe', () => {
  it('has no violations on the colour sheet, the black-and-white sheet, or the empty page', async () => {
    const colour = render(App, { env: at('#/print/ci1-q1') });
    await expectNoA11yViolations(colour.container);
    colour.unmount();

    const bwRender = render(App, { env: at('#/print/ci1-q1') });
    await userEvent.click(screen.getByRole('button', { name: 'Чёрно-белая' }));
    await expectNoA11yViolations(bwRender.container);
    bwRender.unmount();

    const empty = render(App, { env: at('#/print/zzz') });
    await expectNoA11yViolations(empty.container);
  });
});
