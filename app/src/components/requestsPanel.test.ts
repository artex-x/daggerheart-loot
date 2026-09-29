/* The owner's requests panel on an account list page, through `App` over the
 * fake cloud: the lines against the stock now, apply, the short state and
 * «Принять доступное», decline, the decided fold with its items and «Скрыть»,
 * and a live arrival.
 * docs/specs/FEATURES.md, "Account and browser lists". */

import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import type { Loot } from '../lib/data.js';
import { fakeData, fakeEnv, memoryRouter } from '../ports/index.js';
import { fakeCloud } from '../ports/fake-cloud.js';
import { SEED, uuid } from '../ports/fake-cloud-seed.js';
import { expectNoA11yViolations } from '../test/a11y.js';

const record = (id: string, kind: 'item' | 'consumable', ru: string, en: string) => ({
  id,
  src: 'core',
  kind,
  roll: 1,
  en,
  ende: '',
  ru,
  rud: ''
});

const LOOT: Loot = {
  items: {
    core_item: [record('ci1', 'item', 'Спальный мешок', 'Bedroll')],
    core_consumable: [record('cc1', 'consumable', 'Зелье', 'Potion')]
  },
  eq: [
    {
      id: 'q1',
      src: 'core',
      kind: 'item',
      en: 'Sword',
      ende: '',
      ru: 'Меч',
      rud: '',
      eq: { t: 'weapon', tier: 1, cls: 'phy', bu: 1 }
    }
  ],
  refs: {}
};

const SHOP = uuid(101);
const T0 = Date.parse('2026-09-27T12:00:00Z');

beforeEach(() => {
  /* The clock alone: the page's own timers run as they do in a browser. */
  vi.useFakeTimers({ now: T0, toFake: ['Date'] });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/* gm1 with the given requests made a minute apart, the page opened after them. */
function openShop(make: (cloud: ReturnType<typeof fakeCloud>) => void = () => undefined) {
  const cloud = fakeCloud(SEED, 'gm1');
  make(cloud);
  const hash = '#/lists/' + SHOP;
  const view = render(App, {
    env: fakeEnv({ router: memoryRouter(hash), data: fakeData(LOOT), cloud })
  });
  return { ...view, cloud };
}

const TWO = (cloud: ReturnType<typeof fakeCloud>): void => {
  cloud.request('player-token-1', [
    { item: 'ci1', qty: 1 },
    { item: 'cc1', qty: 3 }
  ]);
  vi.setSystemTime(T0 + 60_000);
  cloud.request('gm-token-1', [
    { item: 'cc1', qty: 9 },
    { item: 'q1', qty: 1 }
  ]);
};

const panel = async (): Promise<HTMLElement> =>
  (await screen.findByRole('heading', { name: /^Запросы/, level: 2 })).parentElement!;
const requestsOf = (p: HTMLElement): HTMLElement[] => [
  ...p.querySelectorAll<HTMLElement>('.req')
];
const cells = (req: HTMLElement): string[] =>
  [...req.querySelectorAll('td')].map((td) => td.textContent.trim());

describe('the requests panel', () => {
  it('draws each pending request, newest first, with its lines against the stock and the total', async () => {
    const { container } = openShop(TWO);
    const p = await panel();
    expect(within(p).getByRole('heading', { level: 2 })).toHaveTextContent('Запросы (2)');
    const [gm, player] = requestsOf(p);
    expect(gm?.querySelector('.who')).toHaveTextContent(
      'По ссылке для мастера · только что · истечёт через 60 минут'
    );
    expect(player?.querySelector('.who')).toHaveTextContent(
      'По ссылке для игроков · 1 минуту назад · истечёт через 59 минут'
    );
    expect(cells(player as HTMLElement)).toEqual([
      'Спальный мешок',
      '×1 из 2',
      '150 зол.',
      'Зелье',
      '×3 из 5',
      '60 зол.'
    ]);
    expect(player?.querySelector('.total')).toHaveTextContent('Итого: 210 зол.');
    expect(cells(gm as HTMLElement)).toEqual([
      'Зелье',
      '×9 из 5',
      '180 зол.',
      'Меч',
      '×1 из 1',
      '-'
    ]);
    expect(gm?.querySelector('.short')).toHaveTextContent('×9 из 5');
    expect(gm?.querySelector('.total')).toHaveTextContent('Итого: 180 зол. (без цены: 1)');
    /* Between the action row and the money row. */
    const acts = screen.getByRole('button', { name: 'Поделиться' }).closest('.card-acts');
    expect(acts?.compareDocumentPosition(p)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    await expectNoA11yViolations(container);
  });

  it('applies a request: the toast, the lowered stock and the fold, closed then open', async () => {
    const { container } = openShop(TWO);
    const p = await panel();
    const player = requestsOf(p)[1] as HTMLElement;
    await userEvent.click(within(player).getByRole('button', { name: 'Принять' }));
    expect(await screen.findByText('Запрос принят')).toBeInTheDocument();
    await waitFor(() => {
      expect(within(p).getByRole('heading', { level: 2 })).toHaveTextContent('Запросы (1)');
    });
    const fold = within(p).getByRole('button', { name: 'Решённые в этот раз (1)' });
    expect(fold).toHaveAttribute('aria-expanded', 'false');
    expect(p.querySelector('.decided ul')).toBeNull();
    await expectNoA11yViolations(container);
    await userEvent.click(fold);
    expect(fold).toHaveAttribute('aria-expanded', 'true');
    expect(p.querySelector('.decided li')).toHaveTextContent(
      'По ссылке для игроков · 1 минуту назад · принят'
    );
    expect(within(requestsOf(p)[0] as HTMLElement).getByText('×9 из 2')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('shows the short lines of a refused apply, then takes what is there', async () => {
    const { container } = openShop(TWO);
    const p = await panel();
    const gm = requestsOf(p)[0] as HTMLElement;
    await userEvent.click(within(gm).getByRole('button', { name: 'Принять' }));
    expect(await within(gm).findByRole('alert')).toHaveTextContent(
      'Не хватает: Зелье - просят 9, есть 5. Ничего не списано.'
    );
    expect(within(gm).queryByRole('button', { name: 'Принять' })).toBeNull();
    await expectNoA11yViolations(container);
    await userEvent.click(within(gm).getByRole('button', { name: 'Принять доступное' }));
    expect(await screen.findByText('Запрос принят: списано 6 шт.')).toBeInTheDocument();
    const fold = await within(p).findByRole('button', { name: 'Решённые в этот раз (1)' });
    await userEvent.click(fold);
    expect(p.querySelector('.decided li')).toHaveTextContent(
      'По ссылке для мастера · только что · принят: списано 6 шт.'
    );
    await expectNoA11yViolations(container);
  });

  it('offers only «Отклонить» when the list holds nothing a short request asks for', async () => {
    const { container } = openShop((cloud) => {
      cloud.request('player-token-1', [{ item: 'q1', qty: 1 }]);
      void cloud.lists.apply([{ op: 'remove_entries', ids: [uuid(1102)] }]);
    });
    const p = await panel();
    const req = requestsOf(p)[0] as HTMLElement;
    expect(cells(req)).toEqual(['Меч', 'нет в списке', '-']);
    expect(req.querySelector('.short')).toHaveTextContent('нет в списке');
    await userEvent.click(within(req).getByRole('button', { name: 'Принять' }));
    expect(await within(req).findByRole('alert')).toHaveTextContent(
      'Не хватает: Меч - просят 1, есть 0. Ничего не списано.'
    );
    expect(
      within(req)
        .getAllByRole('button')
        .map((b) => b.textContent)
    ).toEqual(['Отклонить']);
    await expectNoA11yViolations(container);
  });

  it('declines a request and folds it as declined; the last one leaves the fold alone', async () => {
    const { container } = openShop((cloud) => {
      cloud.request('player-token-1', [{ item: 'ci1', qty: 1 }]);
    });
    const p = await panel();
    await userEvent.click(within(p).getByRole('button', { name: 'Отклонить' }));
    expect(await screen.findByText('Запрос отклонён')).toBeInTheDocument();
    await waitFor(() => {
      expect(p.querySelector('.req')).toBeNull();
    });
    expect(within(p).getByRole('heading', { level: 2 })).toHaveTextContent('Запросы (0)');
    await userEvent.click(within(p).getByRole('button', { name: 'Решённые в этот раз (1)' }));
    expect(p.querySelector('.decided li .st-no')).toHaveTextContent('отклонён');
    await expectNoA11yViolations(container);
  });

  it('lists the items of each decided request in the fold', async () => {
    const { container } = openShop(TWO);
    const p = await panel();
    const [gm, player] = requestsOf(p) as [HTMLElement, HTMLElement];
    await userEvent.click(within(gm).getByRole('button', { name: 'Отклонить' }));
    await screen.findByText('Запрос отклонён');
    await userEvent.click(within(player).getByRole('button', { name: 'Принять' }));
    const fold = await within(p).findByRole('button', { name: 'Решённые в этот раз (2)' });
    await userEvent.click(fold);
    const items = [...p.querySelectorAll('.decided li')].map((li) =>
      [...li.querySelectorAll('table.dlines td')].map((td) => td.textContent.trim())
    );
    expect(items).toEqual([
      ['Спальный мешок', '×1', 'Зелье', '×3'],
      ['Зелье', '×9', 'Меч', '×1']
    ]);
    await expectNoA11yViolations(container);
  });

  it('hides the decided requests: the panel goes with the focus on main, or stays with the focus on its heading', async () => {
    const { container } = openShop(TWO);
    const p = await panel();
    await userEvent.click(
      within(requestsOf(p)[0] as HTMLElement).getByRole('button', { name: 'Отклонить' })
    );
    const hide = await within(p).findByRole('button', { name: 'Скрыть решённые запросы' });
    expect(hide).toHaveTextContent('Скрыть');
    await userEvent.click(hide);
    expect(within(p).queryByRole('button', { name: /^Решённые/ })).toBeNull();
    const heading = within(p).getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Запросы (1)');
    expect(document.activeElement).toBe(heading);
    await expectNoA11yViolations(container);

    await userEvent.click(
      within(requestsOf(p)[0] as HTMLElement).getByRole('button', { name: 'Отклонить' })
    );
    await userEvent.click(
      await within(p).findByRole('button', { name: 'Скрыть решённые запросы' })
    );
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /^Запросы/ })).toBeNull();
    });
    expect(document.activeElement).toBe(document.getElementById('main'));
    await expectNoA11yViolations(container);
  });

  it('announces a request that arrives while the page is open', async () => {
    const { cloud, container } = openShop((c) => {
      c.request('player-token-1', [{ item: 'ci1', qty: 1 }]);
    });
    const p = await panel();
    const said = container.querySelector('.rsaid[role="status"]');
    expect(said).toHaveTextContent('');
    cloud.request('gm-token-1', [{ item: 'cc1', qty: 1 }]);
    await waitFor(() => {
      expect(within(p).getByRole('heading', { level: 2 })).toHaveTextContent('Запросы (2)');
    });
    expect(said).toHaveTextContent('Новый запрос');
    await expectNoA11yViolations(container);
  });

  it('announces the first request in a status region that was there before it', async () => {
    const { cloud, container } = openShop();
    await screen.findByRole('textbox', { name: 'Название списка' });
    /* The first read of the requests starts beside the owner topic's join; once the
       page draws the join, that read has landed, and what comes now is an arrival. */
    await waitFor(() => {
      expect(container.querySelector('.lsaid[data-live="live"]')).toBeInTheDocument();
    });
    const said = container.querySelector('.rsaid[role="status"]');
    expect(said).toBeInTheDocument();
    expect(said).toHaveTextContent('');
    cloud.request('player-token-1', [{ item: 'ci1', qty: 1 }]);
    await panel();
    await waitFor(() => {
      expect(said).toHaveTextContent('Новый запрос');
    });
    expect(container.querySelector('.rsaid[role="status"]')).toBe(said);
    await expectNoA11yViolations(container);
  });

  it('draws no panel with no request', async () => {
    const { container } = openShop();
    await screen.findByRole('textbox', { name: 'Название списка' });
    expect(screen.queryByRole('heading', { name: /^Запросы/ })).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('draws in English', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    await cloud.prefs.save({ lang: 'en' });
    cloud.request('player-token-1', [{ item: 'ci1', qty: 1 }]);
    const { container } = render(App, {
      env: fakeEnv({ router: memoryRouter('#/lists/' + SHOP), data: fakeData(LOOT), cloud })
    });
    const heading = await screen.findByRole('heading', { name: 'Requests (1)', level: 2 });
    const p = heading.parentElement!;
    expect(p.querySelector('.who')).toHaveTextContent(
      "Through the players' link · just now · expires in 60 minutes"
    );
    expect(within(p).getByText('×1 of 2')).toBeInTheDocument();
    expect(within(p).getByRole('button', { name: 'Apply' })).toBeInTheDocument();
    expect(within(p).getByRole('button', { name: 'Decline' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });
});
