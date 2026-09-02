/* Core rules: one roll over two books, laid out as a choice.
 *
 * The number of d12 only picks the rarity band - the table is 1-60 whatever
 * you press - so what is worth asserting is which records come back and how
 * many, not that a button exists. */

import { cleanup, render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../App.svelte';
import { fakeClipboard, fakeData, fakeEnv, memoryRouter, noData } from '../ports/index.js';
import type { Env } from '../ports/index.js';
import type { Loot } from '../lib/data.js';
import type { Record_ } from '../lib/types.js';

afterEach(cleanup);

const row = (src: string, kind: 'item' | 'consumable', i: number): Record_ => ({
  id: `${src}${kind[0] ?? ''}${String(i)}`,
  src,
  kind,
  roll: i,
  en: `${src} ${kind} ${String(i)}`,
  ende: 'Does a thing.',
  ru: `${src} ${kind === 'item' ? 'предмет' : 'расходник'} ${String(i)}`,
  rud: 'Делает что-то.'
});

const table = (src: string, kind: 'item' | 'consumable'): Record_[] =>
  Array.from({ length: 60 }, (_, i) => row(src, kind, i + 1));

const LOOT: Loot = {
  items: {
    core_item: table('core', 'item'),
    core_consumable: table('core', 'consumable'),
    hnf_item: table('hnf', 'item'),
    hnf_consumable: table('hnf', 'consumable')
  },
  eq: [],
  refs: {}
};

const at = (over: Partial<Env> = {}): Env =>
  fakeEnv({ router: memoryRouter('#/roll/std'), data: fakeData(LOOT), ...over });

/** Card headings, which is how many options the roll is offering. */
const options = (): string[] =>
  screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent.trim());

describe('a roll over both books', () => {
  it('offers one from each table, which is four', () => {
    /* Both sources on and both kinds on: an item and a consumable from each
       book, and the player takes one of the four. */
    render(App, { env: at() });
    expect(options()).toEqual([
      'core предмет 1',
      'core расходник 1',
      'hnf предмет 1',
      'hnf расходник 1'
    ]);
  });

  it('separates them with OR rather than listing them', () => {
    render(App, { env: at() });
    /* Three separators for four options: one between each pair, and one full
       width between the two rows. */
    expect(screen.getAllByText('ИЛИ')).toHaveLength(3);
  });

  it('rolls the same table whichever dice button is pressed', async () => {
    /* The dice only choose the rarity band; the table is 1-60 throughout. A
       roll of 1d12 cannot exceed 12, so landing on 12 proves which was used. */
    render(App, { env: at({ random: () => 11 / 12 }) });
    await userEvent.click(screen.getByRole('button', { name: /1d12/ }));
    expect(options()[0]).toBe('core предмет 12');
  });

  it('says which rarity each dice button covers', () => {
    render(App, { env: at() });
    expect(screen.getByRole('button', { name: /2d12/ })).toHaveAccessibleName(
      /Обычная \/ Необычная/
    );
  });
});

describe('narrowing what the roll returns', () => {
  it('drops a book when its source is switched off', async () => {
    render(App, { env: at() });
    await userEvent.click(screen.getByRole('button', { name: 'Hope & Fear' }));
    expect(options()).toEqual(['core предмет 1', 'core расходник 1']);
    expect(screen.getAllByText('ИЛИ')).toHaveLength(1);
  });

  it('drops a kind when its chip is switched off', async () => {
    render(App, { env: at() });
    await userEvent.click(screen.getByRole('button', { name: 'Расходники' }));
    expect(options()).toEqual(['core предмет 1', 'hnf предмет 1']);
  });

  it('refuses to turn the last source off, and says why', async () => {
    /* A roll with no source is a page that shows nothing and explains
       nothing. The live app refuses instead. */
    render(App, { env: at() });
    await userEvent.click(screen.getByRole('button', { name: 'Hope & Fear' }));
    await userEvent.click(screen.getByRole('button', { name: 'Core' }));
    expect(options()).toEqual(['core предмет 1', 'core расходник 1']);
    expect(screen.getByText('Нужен хотя бы один источник')).toBeInTheDocument();
  });

  it('refuses to turn the last kind off, and says why', async () => {
    render(App, { env: at() });
    await userEvent.click(screen.getByRole('button', { name: 'Расходники' }));
    await userEvent.click(screen.getByRole('button', { name: 'Предметы' }));
    expect(options()).toEqual(['core предмет 1', 'hnf предмет 1']);
    expect(screen.getByText('Нужен хотя бы один тип')).toBeInTheDocument();
  });
});

describe('handing the whole roll over', () => {
  it('copies every option with the OR spelled out', async () => {
    const clip = fakeClipboard();
    render(App, { env: at({ clipboard: clip }) });
    await userEvent.click(screen.getByRole('button', { name: 'Скопировать все варианты' }));
    const text = clip.last.rich?.plain ?? '';
    expect(text).toContain('core предмет 1');
    expect(text).toContain('hnf расходник 1');
    expect(text.match(/— ИЛИ —/g)).toHaveLength(3);
  });

  it('offers nothing to copy when the roll is not a choice', async () => {
    /* One card is a result, not a set of options. */
    render(App, { env: at() });
    await userEvent.click(screen.getByRole('button', { name: 'Hope & Fear' }));
    await userEvent.click(screen.getByRole('button', { name: 'Расходники' }));
    expect(options()).toEqual(['core предмет 1']);
    expect(
      screen.queryByRole('button', { name: 'Скопировать все варианты' })
    ).not.toBeInTheDocument();
  });
});

describe('the other language', () => {
  it('renames the dice captions and the sources', async () => {
    /* The captions are the only place the rarity words appear on this page,
       so a switch that missed them would leave the buttons untranslated. */
    render(App, { env: at() });
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByRole('button', { name: /2d12/ })).toHaveAccessibleName(
      /Common \/ Uncommon/
    );
    /* And the word "Roll" is still written once, on the first button only. */
    expect(screen.getByRole('button', { name: /Roll 1d12/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Roll 2d12/ })).not.toBeInTheDocument();
  });
});

describe('a dataset that did not load', () => {
  it('says so rather than drawing an empty roll', () => {
    render(App, { env: fakeEnv({ router: memoryRouter('#/roll/std'), data: noData() }) });
    expect(
      screen.getByRole('heading', { level: 1, name: 'Обычные правила' })
    ).toBeInTheDocument();
    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0);
    expect(
      screen.queryByRole('button', { name: 'Скопировать все варианты' })
    ).not.toBeInTheDocument();
  });
});

describe('the help', () => {
  it('explains what the dice are for', async () => {
    render(App, { env: at() });
    await userEvent.click(screen.getByRole('button', { name: 'Как это работает' }));
    const main = screen.getByRole('main');
    expect(within(main).getAllByText(/d12/).length).toBeGreaterThan(0);
  });
});
