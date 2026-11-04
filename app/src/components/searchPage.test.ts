/* Search, `#/search`: the list head, the kind pick, the count line, the start and
 * nothing-found states, the selection mode and the marked names.
 *
 * Held against a small fixture rather than the real catalog, the same way
 * tables.test.ts is: what matters here is the shape (both languages at once,
 * the cap, the kind pick) rather than any particular record. The example queries are
 * held against the real catalog, because each must find something there. */

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import { fakeEnv, fakeData, fakeViewport, memoryRouter, noData } from '../ports/index.js';
import type { Env } from '../ports/index.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import { readLoot } from '../test/loot.js';
import { buildIndex, type Loot } from '../lib/data.js';
import { dict } from '../lib/dict.js';
import { hayFor, parseQuery, rankHits, statLineFor } from '../lib/search.js';
import type { Record_ } from '../lib/types.js';

afterEach(cleanup);

/* jsdom does not implement scrollIntoView: «Ещё» calls it once open. */
Element.prototype.scrollIntoView = vi.fn();

const ru = dict('ru');
const en = dict('en');

const row = (over: Partial<Record_>): Record_ => ({
  id: 'x',
  src: 'core',
  kind: 'item',
  en: 'Thing',
  ende: 'Does a thing.',
  ru: 'Вещь',
  rud: 'Делает что-то.',
  ...over
});

/* `w1`'s description holds «зелье», which is `cc1`'s name, so a ranked
 * query has a description hit ahead of a name hit in catalog order.
 * Two records share "Ветра" in Russian and "Wind" in English - one item, one
 * consumable, so the kind chips have something to narrow. `ci2` shares
 * nothing with either word, in either language, but carries a stat block
 * whose range word ("Вплотную") is on no record as text - only the assembled
 * line finds it. */
const LOOT: Loot = {
  items: {
    wondrous: [
      row({
        id: 'w1',
        src: 'wondrous',
        roll: 1,
        ru: 'Плащ Ветра',
        en: 'Wind Cloak',
        rud: 'Пахнет как зелье.'
      }),
      row({
        id: 'w2',
        src: 'wondrous',
        kind: 'consumable',
        roll: 2,
        ru: 'Сапоги Ветра',
        en: 'Wind Boots'
      })
    ],
    core_item: [
      row({ id: 'ci1', roll: 89, ru: 'Кольцо Тишины', en: 'Silence Ring' }),
      row({
        id: 'ci2',
        ru: 'Клинок Эха',
        en: 'Echo Blade',
        eq: {
          t: 'weapon',
          tier: 1,
          cls: 'phy',
          tr: 'strength',
          rg: 'melee',
          dmg: 'd8',
          dt: 'phy'
        }
      })
    ],
    core_consumable: [
      row({ id: 'cc1', kind: 'consumable', roll: 1, ru: 'Зелье', en: 'Potion' })
    ],
    hnf_item: [row({ id: 'hi1', src: 'hnf', roll: 1, ru: 'Предмет H&F', en: 'H&F Thing' })],
    community: [
      row({
        id: 'cm1',
        src: 'community',
        community: 'Highborne',
        community_ru: 'Великородное',
        ru: 'Перстень Рода',
        en: 'Ancestral Signet'
      })
    ]
  },
  eq: [],
  refs: {}
};

const at = (over: Partial<Env> = {}): Env =>
  fakeEnv({ router: memoryRouter('#/search'), data: fakeData(LOOT), ...over });

const box = (name = ru.searchPh): HTMLElement => screen.getByRole('searchbox', { name });

const type = (text: string): Promise<void> => userEvent.type(box(), text);

const kindRow = (): HTMLElement => document.querySelector('.kindrow') as HTMLElement;
const chip = (name: string): HTMLElement => within(kindRow()).getByRole('button', { name });

const rowIds = (): (string | null)[] =>
  [...document.querySelectorAll('[data-row]')].map((el) => el.getAttribute('data-row'));

const count = (): string | null | undefined =>
  document.querySelector('main .count')?.textContent.replace(/\s+/g, ' ').trim();

describe('the head', () => {
  it('draws the page head from 761 px with the lead and the labeled pin, the box focused', () => {
    render(App, { env: at() });
    expect(screen.getByRole('heading', { level: 1, name: 'Поиск' })).toBeVisible();
    expect(screen.getByText(/Поиск сразу по 1459 позициям/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Справка' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Открывать при запуске/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: ru.moreMenu })).toBeNull();
    expect(box()).toHaveFocus();
    expect(box()).toHaveAttribute('placeholder', ru.searchShort);
    expect(screen.queryByRole('button', { name: ru.filters })).toBeNull();
  });

  it('draws the h1 and «Ещё» on one row up to 760 px, the pin in the menu, the lead read only', async () => {
    const { container } = render(App, { env: at({ viewport: fakeViewport('narrow') }) });
    const h1 = screen.getByRole('heading', { level: 1, name: 'Поиск' });
    expect(h1.closest('.headrow')).not.toBeNull();
    expect(container.querySelector('.homebtn')).toBeNull();
    expect(container.querySelector('p.vh')).toHaveTextContent(/Поиск сразу по 1459 позициям/);
    const more = screen.getByRole('button', { name: ru.moreMenu });
    expect(h1.closest('.headrow')?.contains(more)).toBe(true);
    await userEvent.click(more);
    const item = within(screen.getByRole('menu')).getByRole('menuitem', {
      name: /Открывать при запуске/
    });
    await expectNoA11yViolations(container);
    await userEvent.click(item);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(more).toHaveFocus();
  });
});

describe('the start state', () => {
  it('draws a title, one sentence and three examples, with no instruction sentence', () => {
    render(App, { env: at() });
    expect(screen.getByText(ru.searchWhat)).toBeInTheDocument();
    expect(screen.getByText(ru.searchStartSub)).toBeInTheDocument();
    for (const ex of [ru.searchEx1, ru.searchEx2, ru.searchEx3]) {
      expect(screen.getByRole('button', { name: ex })).toBeInTheDocument();
    }
    expect(screen.queryByText(/Начните вводить/)).toBeNull();
    expect(screen.queryByRole('button', { name: ru.selectMode })).toBeNull();
  });

  it('fills the box with an example, and the box keeps the focus', async () => {
    render(App, { env: at() });
    await userEvent.click(screen.getByRole('button', { name: ru.searchEx1 }));
    expect(box()).toHaveValue(ru.searchEx1);
    await waitFor(() => {
      expect(box()).toHaveFocus();
    });
    expect(rowIds()).toEqual(['cc1', 'w1']);
  });

  it.each(['ru', 'en'] as const)(
    'gives three examples that each find a record (%s)',
    (lang) => {
      const t = dict(lang);
      const index = buildIndex(readLoot());
      const line = statLineFor(lang, t);
      for (const ex of [t.searchEx1, t.searchEx2, t.searchEx3]) {
        expect(
          rankHits(index.searchable, parseQuery(ex), line, hayFor(line)).length,
          ex
        ).toBeGreaterThan(0);
      }
    }
  );
});

describe('a query narrows, best match first', () => {
  it('ranks a name hit above a description hit that comes first in the catalog', async () => {
    render(App, { env: at() });
    await type('зелье');
    expect(rowIds()).toEqual(['cc1', 'w1']);
  });

  it('finds words in any order, each in its own field', async () => {
    render(App, { env: at() });
    await type('зелье плащ');
    expect(rowIds()).toEqual(['w1']);
  });

  it('finds both records by the English word while the page is in Russian, no count line', async () => {
    render(App, { env: at() });
    await type('Wind');
    expect(rowIds()).toEqual(['w1', 'w2']);
    expect(count()).toBeUndefined();
  });

  it('finds the equipment record by its assembled range word', async () => {
    render(App, { env: at() });
    await type('Вплотную');
    expect(rowIds()).toEqual(['ci2']);
  });

  it('names the community alone on the source badge', async () => {
    render(App, { env: at() });
    await type('Перстень');
    const result = screen.getByRole('button', { name: /Перстень/ });
    expect(within(result).getByText('Великородное')).toBeInTheDocument();
  });
});

describe('the rows', () => {
  it('mark the queried words of the name and label the number «№ 89»', async () => {
    const { container } = render(App, { env: at() });
    await type('кольцо');
    const r = container.querySelector('[data-row="ci1"]') as HTMLElement;
    expect(r.querySelector('mark')).toHaveTextContent('Кольцо');
    expect(r.querySelector('.rname')).toHaveTextContent('Кольцо Тишины');
    expect(r.querySelector('.rnum')).toHaveTextContent('№ 89');
  });

  it('draw no ticks and no select-all strip outside the selection mode', async () => {
    const { container } = render(App, { env: at() });
    await type('Ветра');
    expect(container.querySelector('main .selall')).toBeNull();
    expect(container.querySelectorAll('main [data-row] input[type="checkbox"]')).toHaveLength(
      0
    );
    expect(container.querySelector('[data-primary]')).not.toBeNull();
  });
});

describe('the kind chips from 761 px', () => {
  it('starts on a neutral «Все», with no kind lit', () => {
    render(App, { env: at() });
    expect(chip(ru.allShort)).toHaveAttribute('aria-pressed', 'true');
    expect(chip(ru.allShort)).toHaveClass('neutral');
    for (const label of [ru.fItems, ru.fCons, ru.fEquip]) {
      expect(chip(label)).toHaveAttribute('aria-pressed', 'false');
    }
  });

  it('picks one kind from «Все», adds a second, and the last pick off returns to «Все»', async () => {
    render(App, { env: at() });
    await type('Ветра');
    await userEvent.click(chip(ru.fCons));
    expect(rowIds()).toEqual(['w2']);
    expect(chip(ru.fCons)).toHaveAttribute('aria-pressed', 'true');
    expect(chip(ru.allShort)).toHaveAttribute('aria-pressed', 'false');
    expect(count()).toBe('Расходники · Показано 1 из 2');
    await userEvent.click(chip(ru.fItems));
    expect(rowIds()).toEqual(['w1', 'w2']);
    expect(count()).toBe('Предметы, Расходники · Показано 2 из 2');
    await userEvent.click(chip(ru.fItems));
    await userEvent.click(chip(ru.fCons));
    expect(chip(ru.allShort)).toHaveAttribute('aria-pressed', 'true');
    expect(count()).toBeUndefined();
  });

  it("leaves the roll pages' kinds on: the roller's chips stay as they were", async () => {
    const env = at();
    render(App, { env });
    /* By name on the page, not by the kind row: the case reads the same on the toggle chips
       that shared one set with the roller. */
    for (const name of [ru.fItems, ru.fCons, ru.fEquip]) {
      await userEvent.click(screen.getByRole('button', { name }));
    }
    env.router.navigate('#/roll/std', 'ru');
    await tick();
    for (const label of [ru.fItems, ru.fCons]) {
      expect(screen.getByRole('button', { name: label })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    }
  });
});

describe('the kind sheet up to 760 px', () => {
  it('opens from «Фильтры», lights «Фильтры · 1» on a pick, and «Закрыть» returns the focus', async () => {
    const { container } = render(App, { env: at({ viewport: fakeViewport('narrow') }) });
    expect(container.querySelector('.kindrow')).toBeNull();
    await type('Ветра');
    const toggle = screen.getByRole('button', { name: ru.filters });
    await userEvent.click(toggle);
    const sheet = screen.getByRole('dialog');
    expect(within(sheet).getByText(ru.kindF)).toBeInTheDocument();
    await userEvent.click(within(sheet).getByRole('button', { name: ru.fEquip }));
    await expectNoA11yViolations(container);
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Закрыть' })
    );
    const lit = screen.getByRole('button', { name: 'Фильтры · 1' });
    await waitFor(() => {
      expect(lit).toHaveFocus();
    });
    expect(count()).toBe('Снаряжение · Показано 0 из 2');
  });

  it('closes when the band leaves narrow', async () => {
    const viewport = fakeViewport('narrow');
    render(App, { env: at({ viewport }) });
    await userEvent.click(screen.getByRole('button', { name: ru.filters }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    viewport.set('wide');
    await tick();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(kindRow()).not.toBeNull();
  });
});

describe('nothing found', () => {
  it('names the query and clears it; the focus goes to the box', async () => {
    const { container } = render(App, { env: at() });
    await type('zzz');
    expect(screen.getByText(ru.nothing)).toBeInTheDocument();
    expect(
      screen.getByText('Нет совпадений с «zzz» в названиях и описаниях.')
    ).toBeInTheDocument();
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button', { name: ru.clearSearch }));
    expect(box()).toHaveValue('');
    await waitFor(() => {
      expect(box()).toHaveFocus();
    });
    expect(screen.getByText(ru.searchWhat)).toBeInTheDocument();
  });

  it('names the query and the picked kind, and resets the kinds; the focus goes to «Все»', async () => {
    render(App, { env: at() });
    await type('Эха');
    await userEvent.click(chip(ru.fCons));
    expect(
      screen.getByText('Нет совпадений с «Эха» среди фильтров: Расходники.')
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: ru.resetFilters }));
    expect(rowIds()).toEqual(['ci2']);
    await waitFor(() => {
      expect(chip(ru.allShort)).toHaveFocus();
    });
  });

  it('resets from the plate to «Фильтры» up to 760 px', async () => {
    render(App, { env: at({ viewport: fakeViewport('narrow') }) });
    await type('Эха');
    await userEvent.click(screen.getByRole('button', { name: ru.filters }));
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: ru.fCons })
    );
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Закрыть' })
    );
    await userEvent.click(screen.getByRole('button', { name: ru.resetFilters }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: ru.filters })).toHaveFocus();
    });
  });

  it('keeps `$&` in a long query as text', async () => {
    render(App, { env: at() });
    const q = '$&' + 'я'.repeat(198);
    await fireEvent.input(box(), { target: { value: q } });
    expect(screen.getByText(`Нет совпадений с «${q}» в названиях и описаниях.`)).toBeVisible();
  });
});

describe('the cap and the selection mode', () => {
  const many: Loot = {
    items: {
      core_item: Array.from({ length: 305 }, (_, i) =>
        row({
          id: `m${String(i)}`,
          roll: i + 1,
          ru: `Много ${String(i)}`,
          en: `Many ${String(i)}`
        })
      )
    },
    eq: [],
    refs: {}
  };

  it("shows 300 of 305, and the bar's «Все» ticks the 300 found rows", async () => {
    const { container } = render(App, {
      env: fakeEnv({ router: memoryRouter('#/search'), data: fakeData(many) })
    });
    await fireEvent.input(box(), { target: { value: 'Много' } });
    await tick();
    expect(count()).toBe('Показано 300 из 305');
    /* A long result draws its first 60 rows first (`TableRows.svelte`). */
    await waitFor(() => {
      expect(container.querySelectorAll('[data-row]')).toHaveLength(300);
    });
    /* One event each: a typed press re-renders 300 rows several times under coverage. */
    await fireEvent.click(screen.getByRole('button', { name: ru.selectMode }));
    const all = screen.getByRole('checkbox', { name: 'Выбрать все' });
    await waitFor(() => {
      expect(all).toHaveFocus();
    });
    await fireEvent.click(all);
    await tick();
    expect(screen.getByText('Выбрано: 300')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-row].sel')).toHaveLength(300);
  }, 60_000);

  it('«Снять выделение» leaves the mode and returns the focus to «Выбрать»', async () => {
    const { container } = render(App, { env: at() });
    await type('Ветра');
    await userEvent.click(screen.getByRole('button', { name: ru.selectMode }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Плащ Ветра' }));
    expect(container.querySelector('.selcount')).toHaveTextContent('Выбрано: 1');
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button', { name: 'Снять выделение' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: ru.selectMode })).toHaveFocus();
    });
    expect(container.querySelectorAll('main [data-row] input[type="checkbox"]')).toHaveLength(
      0
    );
  });

  it('drops the ticks on a navigation', async () => {
    const env = at();
    const { container } = render(App, { env });
    await type('Ветра');
    await userEvent.click(screen.getByRole('button', { name: ru.selectMode }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Плащ Ветра' }));
    env.router.navigate('#/tables', 'ru');
    await tick();
    expect(container.querySelector('.selcount')).not.toBeInTheDocument();
  });
});

describe('a row opened', () => {
  it('opens the record in the shared modal, closed by its own button', async () => {
    render(App, { env: at() });
    await type('Ветра');
    await userEvent.click(screen.getByRole('button', { name: /Плащ Ветра/ }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Плащ Ветра')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Закрыть' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('no data', () => {
  it('says so, and draws no search box', () => {
    render(App, { env: fakeEnv({ router: memoryRouter('#/search'), data: noData() }) });
    expect(screen.getByText('Данные не загрузились. Обновите страницу.')).toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });
});

describe('English', () => {
  it('draws the English head, chips, states and number label', async () => {
    const { container } = render(App, { env: at() });
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByRole('heading', { name: 'Search' })).toBeInTheDocument();
    expect(screen.getByText(en.searchWhat)).toBeInTheDocument();
    for (const label of [en.allShort, en.fItems, en.fCons, en.fEquip]) {
      expect(chip(label)).toBeInTheDocument();
    }
    await userEvent.type(box(en.searchPh), 'ring');
    expect(container.querySelector('[data-row="ci1"] .rnum')).toHaveTextContent('No. 89');
    await userEvent.clear(box(en.searchPh));
    await userEvent.type(box(en.searchPh), 'zzz');
    expect(screen.getByText(en.nothing)).toBeInTheDocument();
    expect(
      screen.getByText('No match for "zzz" in names and descriptions.')
    ).toBeInTheDocument();
  });
});

describe('axe', () => {
  it('has no violations on arrival', async () => {
    const { container } = render(App, { env: at() });
    await expectNoA11yViolations(container);
  });

  it('has no violations with a kind picked and the count line', async () => {
    const { container } = render(App, { env: at() });
    await type('Ветра');
    await userEvent.click(chip(ru.fItems));
    await expectNoA11yViolations(container);
  });

  it('has no violations at 360 px on arrival', async () => {
    const { container } = render(App, { env: at({ viewport: fakeViewport('narrow') }) });
    await expectNoA11yViolations(container);
  });
});
