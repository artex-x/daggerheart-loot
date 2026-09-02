/* The two roll pages that choose a part of their book first.
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
    ]
  },
  eq: [],
  refs: {}
};

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
    /* All three volumes, not just the first. */
    expect(screen.getByRole('link', { name: 'Volume 3' })).toBeInTheDocument();
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

describe('a dataset that did not load', () => {
  /* data.js served as HTML by a broken deploy, or missing from a folder. Both
     pages read the catalogue twice - once to build the picker, once to roll -
     and both have to say so rather than draw an empty panel. */
  it.each([
    ['#/roll/voa', 'Vault of Ages'],
    ['#/roll/community', 'Предметы сообществ']
  ])('says so on %s rather than rendering an empty picker', (route, heading) => {
    render(App, { env: fakeEnv({ router: memoryRouter(route), data: noData() }) });
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
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
});
