/* The three roll pages that choose a part of their book first.
 *
 * Driven through App, which is what covers the picker components with them:
 * a chip is a button with a label and a pressed state, and a test that asserts
 * that in isolation would assert nothing the parent does not already need. */

import { cleanup, render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../App.svelte';
import { fakeData, fakeEnv, memoryRouter, noData } from '../ports/index.js';
import type { Env } from '../ports/index.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import type { Loot } from '../lib/data.js';
import type { Record_ } from '../lib/types.js';

afterEach(cleanup);

const rec = (over: Partial<Record_>): Record_ => ({
  id: 'x',
  src: 'voa',
  kind: 'item',
  en: 'X',
  ende: 'x',
  ru: 'Икс',
  rud: 'икс',
  ...over
});

const LOOT: Loot = {
  items: {
    voa: [
      rec({ id: 'v1', tier: 1, ru: 'Камень первого ранга', rud: 'Тихий.' }),
      rec({ id: 'v1b', tier: 1, ru: 'Второй первого ранга', rud: 'Тоже тихий.' }),
      rec({ id: 'va', tier: 'A', ru: 'Узы Души', rud: 'Легендарная вещь.' }),
      rec({ id: 'vc', tier: 'C', ru: 'Проклятый венец', rud: 'Дорого стоит.' })
    ],
    community: [
      rec({
        id: 'c1',
        src: 'community',
        community: 'Loreborne',
        community_ru: 'Научное',
        ru: 'Первое научное'
      }),
      rec({
        id: 'c2',
        src: 'community',
        community: 'Loreborne',
        community_ru: 'Научное',
        ru: 'Второе научное'
      }),
      rec({
        id: 'c3',
        src: 'community',
        community: 'Ridgeborne',
        community_ru: 'Горное',
        ru: 'Первое горное'
      })
    ],
    mwt: [
      rec({ id: 'm1', src: 'mwt', realm: 'sporopolis', roll: 1, ru: 'Первый спорополисский' }),
      rec({ id: 'm2', src: 'mwt', realm: 'sporopolis', roll: 2, ru: 'Второй спорополисский' }),
      /* Twenty-one cards, one past a d20, as the Warrin' Warrens deck prints. */
      ...Array.from({ length: 21 }, (_, i) =>
        rec({
          id: `w${String(i + 1)}`,
          src: 'mwt',
          realm: 'warrens' as const,
          roll: i + 1,
          ru: `Норный ${String(i + 1)}`
        })
      )
    ]
  },
  eq: [],
  refs: {}
};

/** The same catalog with no Many Worlds Tavern rows: a data.js from before the source. */
const NO_MWT: Loot = { ...LOOT, items: { voa: LOOT.items['voa'] ?? [] } };

const at = (route: string, over: Partial<Env> = {}): Env =>
  fakeEnv({ router: memoryRouter(route), data: fakeData(LOOT), ...over });

const field = (): HTMLInputElement =>
  screen.getByRole<HTMLInputElement>('textbox', { name: 'Результат броска' });

describe('Vault of Ages', () => {
  it('opens on the first tier and shows what is in it', () => {
    render(App, { env: at('#/roll/voa') });
    expect(
      screen.getByRole('heading', { level: 1, name: 'Vault of Ages' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ранг 1' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('link', { name: 'Камень первого ранга' })).toBeInTheDocument();
  });

  it('rolls only inside the chosen division', async () => {
    /* Two records at tier 1, one artifact - so the range says which is chosen
       even before the card underneath does. */
    render(App, { env: at('#/roll/voa') });
    expect(screen.getByText('Результат броска (1–2)')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Артефакты' }));
    expect(screen.getByText('Результат броска (1–1)')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Узы Души' })).toBeInTheDocument();
  });

  it('puts the roll back to one when the division changes', async () => {
    /* The divisions are different lengths, so a number kept from the last one
       would point somewhere nobody asked for. */
    render(App, { env: at('#/roll/voa') });
    await userEvent.click(screen.getByRole('button', { name: 'На единицу больше' }));
    expect(field().value).toBe('2');

    await userEvent.click(screen.getByRole('button', { name: 'Проклятые предметы' }));
    expect(field().value).toBe('1');
    expect(screen.getByRole('link', { name: 'Проклятый венец' })).toBeInTheDocument();
  });

  it('marks an artifact as one on the card', async () => {
    /* A category that exists nowhere else in the data, so it is worth a badge. */
    render(App, { env: at('#/roll/voa') });
    await userEvent.click(screen.getByRole('button', { name: 'Артефакты' }));
    expect(screen.getByText('Артефакт')).toHaveClass('badge');
  });

  it('explains why the book has sections rather than one die', async () => {
    render(App, { env: at('#/roll/voa') });
    await userEvent.click(screen.getByRole('button', { name: 'Как это работает' }));
    expect(screen.getByText(/Своей таблицы броска у книги нет/)).toBeInTheDocument();
    /* All four volumes, not just the first. */
    expect(screen.getByRole('link', { name: 'Volume 4' })).toBeInTheDocument();
  });
});

describe('community items', () => {
  it('opens on the first community the records mention', () => {
    render(App, { env: at('#/roll/community') });
    expect(
      screen.getByRole('heading', { level: 1, name: 'Предметы сообществ' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Научное' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('link', { name: 'Первое научное' })).toBeInTheDocument();
  });

  it('rolls inside the community that was picked', async () => {
    render(App, { env: at('#/roll/community') });
    await userEvent.click(screen.getByRole('button', { name: 'Горное' }));
    expect(screen.getByRole('link', { name: 'Первое горное' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Первое научное' })).not.toBeInTheDocument();
  });

  it('names the communities in the language on screen', async () => {
    render(App, { env: at('#/roll/community') });
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByRole('button', { name: 'Loreborne' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Community items' })
    ).toBeInTheDocument();
  });

  it('labels the picker with the singular, not the tab’s word', () => {
    /* The tab says "Сообщества" because it names a section; the label above
       the picker asks for one. */
    render(App, { env: at('#/roll/community') });
    const main = screen.getByRole('main');
    expect(within(main).getByText('Сообщество')).toBeInTheDocument();
  });
});

describe('Many Worlds Tavern', () => {
  it('opens on the first realm and draws the four realm chips', () => {
    render(App, { env: at('#/roll/mwt') });
    expect(
      screen.getByRole('heading', { level: 1, name: 'Many Worlds Tavern' })
    ).toBeInTheDocument();
    for (const name of ['Спорополис', 'Лес Пари', 'Воюющие Норы', 'Долина Богов'])
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Спорополис' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(within(screen.getByRole('main')).getByText('Мир')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Первый спорополисский' })).toBeInTheDocument();
  });

  it('lights the supplements chip of its own section', () => {
    render(App, { env: at('#/roll/mwt') });
    const panel = screen.getByRole('navigation', { name: 'Дополнения' });
    expect(within(panel).getByRole('link', { name: 'Many Worlds Tavern' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  it("picks 1-21 at random in Warrin' Warrens, where no die covers the deck", async () => {
    /* random() just under 1 is the top face: the last card of the deck. */
    render(App, { env: at('#/roll/mwt', { random: () => 0.999 }) });
    await userEvent.click(screen.getByRole('button', { name: 'Воюющие Норы' }));
    expect(screen.getByText('Результат броска (1–21)')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Случайно 1–21/ }));
    expect(field().value).toBe('21');
    expect(screen.getByRole('link', { name: 'Норный 21' })).toBeInTheDocument();
  });

  it('puts a held 21 back to one in a shorter realm', async () => {
    render(App, { env: at('#/roll/mwt', { random: () => 0.999 }) });
    await userEvent.click(screen.getByRole('button', { name: 'Воюющие Норы' }));
    await userEvent.click(screen.getByRole('button', { name: /Случайно 1–21/ }));
    expect(field().value).toBe('21');

    await userEvent.click(screen.getByRole('button', { name: 'Спорополис' }));
    expect(field().value).toBe('1');
    expect(screen.getByText('Результат броска (1–2)')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Первый спорополисский' })).toBeInTheDocument();
  });

  it('names the realms in the language on screen', async () => {
    render(App, { env: at('#/roll/mwt') });
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByRole('button', { name: "Warrin' Warrens" })).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByText('Realm')).toBeInTheDocument();
    expect(screen.getByText('Pick a realm and roll within it.')).toBeInTheDocument();
  });

  it('says the data is missing when the catalog has no realm rows', () => {
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/roll/mwt'), data: fakeData(NO_MWT) })
    });
    expect(
      screen.getByRole('heading', { level: 1, name: 'Many Worlds Tavern' })
    ).toBeInTheDocument();
    expect(screen.getByText('Данные не загрузились. Обновите страницу.')).toBeInTheDocument();
  });
});

describe('a dataset that did not load', () => {
  /* data.js served as HTML by a broken deploy, or missing from one. Both
     pages read the catalogue twice - once to build the picker, once to roll -
     and both have to say so rather than draw an empty panel. */
  it.each([
    ['#/roll/voa', 'Vault of Ages'],
    ['#/roll/community', 'Предметы сообществ'],
    ['#/roll/mwt', 'Many Worlds Tavern']
  ])('says so on %s rather than rendering an empty picker', (route, heading) => {
    render(App, { env: fakeEnv({ router: memoryRouter(route), data: noData() }) });
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    expect(screen.getByText('Данные не загрузились. Обновите страницу.')).toBeInTheDocument();
  });

  it('says so on #/roll/dv, a whole-table roll with no picker', () => {
    render(App, { env: fakeEnv({ router: memoryRouter('#/roll/dv'), data: noData() }) });
    expect(
      screen.getByRole('heading', { level: 1, name: "The Dragon's Vault" })
    ).toBeInTheDocument();
    expect(screen.getByText('Данные не загрузились. Обновите страницу.')).toBeInTheDocument();
  });
});

describe('accessibility', () => {
  it('has no axe violations on Vault of Ages', async () => {
    const { container } = render(App, { env: at('#/roll/voa') });
    await expectNoA11yViolations(container);
  });

  it('has no axe violations on communities', async () => {
    const { container } = render(App, { env: at('#/roll/community') });
    await expectNoA11yViolations(container);
  });

  it('has no axe violations on Many Worlds Tavern with a realm pressed', async () => {
    const { container } = render(App, { env: at('#/roll/mwt') });
    await userEvent.click(screen.getByRole('button', { name: 'Воюющие Норы' }));
    await expectNoA11yViolations(container);
  });
});
