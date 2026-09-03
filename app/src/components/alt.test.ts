/* The alternate tables: two dice with names instead of a sum.
 *
 * What is worth asserting is which four rows a pair of faces produces, that
 * each card says which die found it, and that the box a critical success
 * raises offers both tables and the step up - none of which a first paint
 * shows, because the page does not open on a crit. */

import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../App.svelte';
import { fakeClipboard, fakeData, fakeEnv, memoryRouter, noData } from '../ports/index.js';
import type { Env } from '../ports/index.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import type { Loot } from '../lib/data.js';
import type { Record_ } from '../lib/types.js';

afterEach(cleanup);

const row = (kind: 'item' | 'consumable', i: number): Record_ => ({
  id: `${kind[0] ?? ''}${String(i)}`,
  src: 'core',
  kind,
  roll: i,
  en: `${kind} ${String(i)}`,
  ende: 'Does a thing.',
  ru: `${kind === 'item' ? 'предмет' : 'расходник'} ${String(i)}`,
  rud: 'Делает что-то.'
});

const table = (kind: 'item' | 'consumable'): Record_[] =>
  Array.from({ length: 24 }, (_, i) => row(kind, i + 1));

/** A column of twelve ids, as the data stores one: the first half or the second. */
const col = (kind: 'item' | 'consumable', from: number): string[] =>
  Array.from({ length: 12 }, (_, i) => `${kind[0] ?? ''}${String(from + i)}`);

/* Three rarities are filled in: two to prove the chips change the columns, and
   legendary because a critical success there has no rarity to step up to.
   `rare` is left out on purpose - a table the data does not carry has to draw
   nothing rather than an empty grid. */
const LOOT: Loot = {
  items: { core_item: table('item'), core_consumable: table('consumable') },
  eq: [],
  refs: {},
  alt: {
    item: {
      common: { hope: col('item', 1), fear: col('item', 13) },
      uncommon: { hope: col('item', 13), fear: col('item', 1) },
      legendary: { hope: col('item', 1), fear: col('item', 1) }
    },
    consumable: {
      common: { hope: col('consumable', 1), fear: col('consumable', 13) },
      uncommon: { hope: col('consumable', 13), fear: col('consumable', 1) },
      legendary: { hope: col('consumable', 1), fear: col('consumable', 1) }
    }
  }
};

const at = (over: Partial<Env> = {}): Env =>
  fakeEnv({ router: memoryRouter('#/roll/alt'), data: fakeData(LOOT), ...over });

const options = (): string[] =>
  screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent.trim());

const press = (name: string | RegExp): Promise<void> =>
  userEvent.click(screen.getByRole('button', { name }));

describe('a roll of two dice', () => {
  it('offers a row per column and kind, item before consumable', () => {
    /* The page opens on Hope 1 and Fear 2, which is not a crit. */
    render(App, { env: at() });
    expect(options()).toEqual(['предмет 1', 'предмет 14', 'расходник 1', 'расходник 14']);
  });

  it('badges each card with the die that found it and the face it showed', () => {
    render(App, { env: at() });
    const cards = screen.getAllByRole('article');
    expect(cards[0]).toHaveTextContent('Надежда');
    expect(cards[1]).toHaveTextContent('Страх');
    /* The face, not the record's own row number: card two is row 14 of the
       book and came up on a Fear die showing 2. */
    expect(cards[1]?.querySelector('.badge.num')?.textContent).toBe('2');
  });

  it('changes the columns when a rarity is chosen', async () => {
    render(App, { env: at() });
    await press(/Необычная/);
    expect(options()).toEqual(['предмет 13', 'предмет 2', 'расходник 13', 'расходник 2']);
  });

  it('rolls both dice at once', async () => {
    /* Both faces come off the same source of randomness, so a fixed one puts
       the pair on the same number - which is a crit, and is the only way to
       reach that box without typing. */
    render(App, { env: at({ random: () => 5 / 12 }) });
    await press('Бросить кости');
    expect(options()).toEqual(['предмет 6', 'предмет 18', 'расходник 6', 'расходник 18']);
  });

  it('drops a kind that is switched off', async () => {
    render(App, { env: at() });
    await press('Расходники');
    expect(options()).toEqual(['предмет 1', 'предмет 14']);
  });

  it('refuses to turn the last kind off, and says why', async () => {
    /* A roll with no kind on is a page that shows nothing and explains
       nothing. The live app refuses instead. */
    render(App, { env: at() });
    await press('Расходники');
    await press('Предметы');
    expect(options()).toEqual(['предмет 1', 'предмет 14']);
    expect(screen.getByText('Нужен хотя бы один тип')).toBeInTheDocument();
  });

  it('steps one die without touching the other', async () => {
    /* The two fields are separate numbers, and stepping Hope onto Fear is the
       one press that reaches a critical success from the opening pair. */
    render(App, { env: at() });
    await press('Кость Надежды: На единицу больше');
    expect(options()).toEqual(['предмет 2', 'предмет 14', 'расходник 2', 'расходник 14']);
    expect(screen.getByText('Критический успех!')).toBeInTheDocument();
  });

  it('opens a card over the page, and closes it again', async () => {
    /* The picture is the way in, and the card arrives in a dialog rather than
       replacing the roll behind it. */
    render(App, { env: at() });
    /* Four cards, four pictures: the first one is as good as any. */
    const first = screen.getAllByRole('button', { name: 'Страница' })[0];
    if (first) await userEvent.click(first);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await press('Закрыть');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('a critical success', () => {
  /** Steps Fear down onto Hope, which is one press from the opening pair. */
  const toCrit = (): Promise<void> => press('Кость Страха: На единицу меньше');

  it('is not on screen until the two dice agree', async () => {
    render(App, { env: at() });
    expect(screen.queryByText('Критический успех!')).not.toBeInTheDocument();
    await toCrit();
    expect(screen.getByText('Критический успех!')).toBeInTheDocument();
  });

  it('offers both tables, named apart, because either may be taken from', async () => {
    render(App, { env: at() });
    await toCrit();
    expect(screen.getByRole('link', { name: /Таблица предметов/ })).toHaveAttribute(
      'href',
      expect.stringContaining('#/tables/alt_item/common')
    );
    expect(screen.getByRole('link', { name: /Таблица расходников/ })).toBeInTheDocument();
  });

  it('leaves the label general when only one table is open', async () => {
    render(App, { env: at() });
    await press('Расходники');
    await toCrit();
    expect(screen.getByRole('link', { name: /Открыть таблицу/ })).toHaveAttribute(
      'href',
      expect.stringContaining('#/tables/alt_item/common')
    );
  });

  it('steps the rarity up when the offer is taken', async () => {
    render(App, { env: at() });
    await toCrit();
    await press('Поднять до Необычной');
    /* The two columns are swapped between the rarities in this fixture, so a
       crit on 1 lands on row 13 by Hope and row 1 by Fear - which is the point:
       the chip changed the table, not the dice. */
    expect(options()).toEqual(['предмет 13', 'предмет 1', 'расходник 13', 'расходник 1']);
  });

  it('offers no step up from the top rarity', async () => {
    render(App, { env: at() });
    await press(/Легендарная/);
    await toCrit();
    /* The box is there - a crit still hands over the whole rarity - and only
       the step up is missing, because there is nothing above legendary. */
    expect(screen.getByText('Критический успех!')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Поднять/ })).not.toBeInTheDocument();
  });
});

describe('handing the roll over', () => {
  it('copies every option with the OR spelled out', async () => {
    const clip = fakeClipboard();
    render(App, { env: at({ clipboard: clip }) });
    await press('Скопировать все варианты');
    const text = clip.last.rich?.plain ?? '';
    expect(text).toContain('предмет 1');
    expect(text.match(/— ИЛИ —/g)).toHaveLength(3);
  });

  it('reports a copied name from a card, which the panel announces', async () => {
    const clip = fakeClipboard();
    render(App, { env: at({ clipboard: clip }) });
    const copy = screen.getAllByRole('button', { name: 'Скопировать название' })[0];
    if (copy) await userEvent.click(copy);
    expect(clip.last.text).toBe('предмет 1');
    expect(screen.getByText('Название скопировано')).toBeInTheDocument();
  });

  it('says so when the clipboard refuses', async () => {
    render(App, { env: at({ clipboard: fakeClipboard({ fail: true }) }) });
    await press('Скопировать все варианты');
    expect(screen.getByText('Не удалось скопировать')).toBeInTheDocument();
  });
});

describe('the other language', () => {
  it('names both dice and the tables the crit opens', async () => {
    render(App, { env: at() });
    await press('EN');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Alternate tables' })
    ).toBeInTheDocument();
    expect(screen.getByText('Hope Die')).toBeInTheDocument();
    expect(screen.getByText('Fear Die')).toBeInTheDocument();
    await press('Fear Die: One lower');
    expect(screen.getByRole('button', { name: 'Bump to Uncommon' })).toBeInTheDocument();
  });
});

describe('a rarity the data has no columns for', () => {
  it('draws no cards rather than an empty grid', async () => {
    /* Only two rarities are filled in here. The live app drops a row it cannot
       find; nothing may invent one. */
    render(App, { env: at() });
    await press(/Редкая/);
    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0);
  });
});

describe('a dataset that did not load', () => {
  it('says so rather than drawing an empty roll', () => {
    render(App, { env: fakeEnv({ router: memoryRouter('#/roll/alt'), data: noData() }) });
    expect(
      screen.getByRole('heading', { level: 1, name: 'Альтернативные таблицы' })
    ).toBeInTheDocument();
    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0);
  });
});

describe('the help', () => {
  it('explains what the two columns mean', async () => {
    render(App, { env: at() });
    await press('Как это работает');
    expect(screen.getByText(/по смыслу/)).toBeInTheDocument();
  });
});

describe('accessibility', () => {
  it('has no axe violations on the page', async () => {
    const { container } = render(App, { env: at() });
    await expectNoA11yViolations(container);
  });
});
