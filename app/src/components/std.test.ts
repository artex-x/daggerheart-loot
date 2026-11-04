/* Core rules: one roll over two books, laid out as a choice.
 *
 * The number of d12 only picks the rarity band - the table is 1-60 whatever
 * you press - so what is worth asserting is which records come back and how
 * many, not that a button exists. */

import { cleanup, render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import DiceBar from './DiceBar.svelte';
import {
  fakeClipboard,
  fakeData,
  fakeEnv,
  fakeViewport,
  memoryRouter,
  noData
} from '../ports/index.js';
import type { Env } from '../ports/index.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import type { Loot } from '../lib/data.js';
import type { Record_ } from '../lib/types.js';

afterEach(cleanup);

/* jsdom does not implement scrollIntoView: «Ещё» calls it once open. */
Element.prototype.scrollIntoView = vi.fn();

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
  screen.queryAllByRole('article').map((a) => a.querySelector('h2')?.textContent.trim() ?? '');

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
      /Обычная - Необычная/
    );
  });
});

describe('the five dice', () => {
  it('are plain buttons with their rarities, under one group name', () => {
    const { container } = render(App, { env: at() });
    const dice = within(screen.getByRole('group', { name: 'Бросить' })).getAllByRole('button');
    expect(dice.map((d) => d.querySelector('small')?.textContent)).toEqual([
      'Обычная',
      'Обычная - Необычная',
      'Необычная - Редкая',
      'Редкая - Легендарная',
      'Легендарная'
    ]);
    expect(container.querySelector('.dicebar .primary')).toBeNull();
  });

  it('put what came up in the heading and the number field', async () => {
    render(App, { env: at({ random: () => 11 / 12 }) });
    await userEvent.click(screen.getByRole('button', { name: /1d12/ }));
    expect(screen.getByRole('heading', { level: 2, name: 'Бросок 12' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Результат броска' })).toHaveValue('12');
  });
});

describe('the dice of another set', () => {
  it('redraw their counts and captions in place', async () => {
    const props = {
      dice: [{ n: 1, rarities: ['common'] }],
      rarityName: (key: string): string => key,
      rollWord: 'Roll',
      onroll: vi.fn()
    };
    const { rerender } = render(DiceBar, props);
    await rerender({ ...props, dice: [{ n: 1, rarities: ['rare', 'legendary'] }] });
    expect(screen.getByRole('button', { name: /1d12/ })).toHaveAccessibleName(
      '1d12 rare - legendary'
    );
    await rerender({ ...props, rollWord: 'Бросить' });
    expect(screen.getByRole('group', { name: 'Бросить' })).toBeInTheDocument();
  });
});

describe('the chips of a row', () => {
  const chip = (name: string): HTMLElement => screen.getByRole('button', { name });

  it('are neutral while every chip of the row is on', () => {
    render(App, { env: at() });
    for (const name of ['Core', 'Hope & Fear', 'Предметы', 'Расходники']) {
      expect(chip(name).className, name).toContain('neutral');
    }
  });

  it('turn gold in the narrowed row only', async () => {
    render(App, { env: at() });
    await userEvent.click(chip('Расходники'));
    expect(chip('Предметы').className).not.toContain('neutral');
    expect(chip('Core').className).toContain('neutral');
  });

  it('keep the separator on a pool of two', async () => {
    render(App, { env: at() });
    await userEvent.click(chip('Hope & Fear'));
    expect(screen.getAllByText('ИЛИ')).toHaveLength(1);
  });
});

describe('the closed «Настроить» at a phone width', () => {
  const narrow = (): Env => at({ viewport: fakeViewport('narrow') });
  const setUp = (name: string | RegExp): HTMLElement => screen.getByRole('button', { name });

  it('names the value left on and is lit, then counts two narrowed rows', async () => {
    render(App, { env: narrow() });
    expect(setUp('Настроить').className).not.toContain('toggle');
    await userEvent.click(setUp('Настроить'));
    await userEvent.click(screen.getByRole('button', { name: 'Расходники' }));
    const lit = screen.getByRole('button', { expanded: true, name: 'Предметы' });
    expect(lit.className).toContain('toggle');
    await userEvent.click(screen.getByRole('button', { name: 'Hope & Fear' }));
    expect(setUp('Настроить · 2')).toHaveAttribute('aria-expanded', 'true');
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

  it('toasts its own wording, not the generic text-copied message (D13, paid off)', async () => {
    render(App, { env: at({ clipboard: fakeClipboard() }) });
    await userEvent.click(screen.getByRole('button', { name: 'Скопировать все варианты' }));
    expect(screen.getByText('Варианты скопированы')).toBeInTheDocument();
    expect(screen.queryByText('Текст скопирован')).not.toBeInTheDocument();
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
      /Common - Uncommon/
    );
    /* The word "Roll" names the group, not a button. */
    expect(screen.getByRole('group', { name: 'Roll' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Roll 1d12/ })).not.toBeInTheDocument();
  });
});

describe('a dataset that did not load', () => {
  it('says so rather than drawing an empty roll', () => {
    render(App, { env: fakeEnv({ router: memoryRouter('#/roll/std'), data: noData() }) });
    expect(
      screen.getByRole('heading', { level: 1, name: 'Обычные правила' })
    ).toBeInTheDocument();
    expect(options()).toHaveLength(0);
    expect(
      screen.queryByRole('button', { name: 'Скопировать все варианты' })
    ).not.toBeInTheDocument();
  });
});

describe('the help', () => {
  it('names its button after the panel and holds the four placement lines', async () => {
    const { container } = render(App, { env: at() });
    await userEvent.click(screen.getByRole('button', { name: 'Где какая редкость' }));
    const lines = container.querySelectorAll('.helpbox p');
    expect([...lines].map((p) => p.querySelector('b')?.textContent)).toEqual([
      'Обычная',
      'Необычная',
      'Редкая',
      'Легендарная'
    ]);
  });
});

describe('accessibility', () => {
  it('names the roll in a hidden status, and the results are no live region', () => {
    /* A menu opens inside the results: a live region there would read the card again. */
    const { container } = render(App, { env: at() });
    const results = container.querySelector('.results');
    expect(results).not.toHaveAttribute('role');
    expect(results).not.toHaveAttribute('aria-live');
    const said = container.querySelector('.said[role="status"]');
    expect(said?.textContent).not.toBe('');
  });

  it('has no axe violations', async () => {
    const { container } = render(App, { env: at() });
    await expectNoA11yViolations(container);
  });
});
