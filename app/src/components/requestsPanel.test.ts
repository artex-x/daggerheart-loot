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
import { dict } from '../lib/dict.js';

const t = dict('ru');

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
  (await screen.findByRole('heading', { name: /^Новое в списке/, level: 2 })).parentElement!;
const requestsOf = (p: HTMLElement): HTMLElement[] => [
  ...p.querySelectorAll<HTMLElement>('.req')
];
const cells = (req: HTMLElement): string[] =>
  [...req.querySelectorAll('td')].map((td) => td.textContent.trim());

describe('the requests panel', () => {
  it('draws each pending request, newest first, with its lines against the stock and the total', async () => {
    const { container } = openShop(TWO);
    const p = await panel();
    expect(within(p).getByRole('heading', { level: 2 })).toHaveTextContent(
      'Новое в списке (2)'
    );
    const [gm, player] = requestsOf(p);
    // The drawn panel reads both requests, so each has its last hour from the same read.
    await waitFor(() => {
      expect(gm?.querySelector('.who')).toHaveTextContent(
        'По ссылке для мастера · только что · истечёт через 60 минут'
      );
    });
    expect(player?.querySelector('.who')).toHaveTextContent(
      'По ссылке для игроков · 1 минуту назад · истечёт через 60 минут'
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
      expect(within(p).getByRole('heading', { level: 2 })).toHaveTextContent(
        'Новое в списке (1)'
      );
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
    expect(within(p).getByRole('heading', { level: 2 })).toHaveTextContent(
      'Новое в списке (0)'
    );
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
    expect(heading).toHaveTextContent('Новое в списке (1)');
    expect(document.activeElement).toBe(heading);
    await expectNoA11yViolations(container);

    await userEvent.click(
      within(requestsOf(p)[0] as HTMLElement).getByRole('button', { name: 'Отклонить' })
    );
    await userEvent.click(
      await within(p).findByRole('button', { name: 'Скрыть решённые запросы' })
    );
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /^Новое в списке/ })).toBeNull();
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
      expect(within(p).getByRole('heading', { level: 2 })).toHaveTextContent(
        'Новое в списке (2)'
      );
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
    expect(screen.queryByRole('heading', { name: /^Новое в списке/ })).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('draws in English', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    await cloud.prefs.save({ lang: 'en' });
    cloud.request('player-token-1', [{ item: 'ci1', qty: 1 }]);
    const { container } = render(App, {
      env: fakeEnv({ router: memoryRouter('#/lists/' + SHOP), data: fakeData(LOOT), cloud })
    });
    const heading = await screen.findByRole('heading', {
      name: 'New in this list (1)',
      level: 2
    });
    const p = heading.parentElement!;
    await waitFor(() => {
      expect(p.querySelector('.who')).toHaveTextContent(
        "Through the players' link · just now · expires in 60 minutes"
      );
    });
    expect(within(p).getByText('×1 of 2')).toBeInTheDocument();
    expect(within(p).getByRole('button', { name: 'Apply' })).toBeInTheDocument();
    expect(within(p).getByRole('button', { name: 'Decline' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('reads the list only once the fold draws every pending request', async () => {
    const { container, cloud } = openShop((c) => {
      for (let i = 0; i < 4; i++) {
        vi.setSystemTime(T0 + i * 60_000);
        c.request('player-token-1', [{ item: 'ci1', qty: 1 }]);
      }
    });
    const mark = vi.spyOn(cloud.requests, 'markRead');
    const p = await panel();
    await new Promise((r) => setTimeout(r, 0));
    expect(requestsOf(p)).toHaveLength(3);
    expect(mark).not.toHaveBeenCalled();
    expect(p.querySelector('.who')).not.toHaveTextContent('истечёт');
    await expectNoA11yViolations(container);
    await userEvent.click(within(p).getByRole('button', { name: 'и ещё 1 запрос' }));
    await waitFor(() => {
      expect(p.querySelector('.who')).toHaveTextContent('истечёт через 60 минут');
    });
    expect(mark).toHaveBeenCalledOnce();
    expect(mark).toHaveBeenCalledWith(SHOP);
    await expectNoA11yViolations(container);
  });

  it('reads a request drawn in a hidden tab only when the tab becomes visible', async () => {
    const shown = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    try {
      const { container } = openShop((cloud) => {
        cloud.request('player-token-1', [{ item: 'ci1', qty: 1 }]);
      });
      const p = await panel();
      await new Promise((r) => setTimeout(r, 0));
      expect(p.querySelector('.who')).toHaveTextContent(/^По ссылке для игроков · только что$/);
      await expectNoA11yViolations(container);
      shown.mockReturnValue('visible');
      document.dispatchEvent(new Event('visibilitychange'));
      await waitFor(() => {
        expect(p.querySelector('.who')).toHaveTextContent(
          'По ссылке для игроков · только что · истечёт через 60 минут'
        );
      });
      await expectNoA11yViolations(container);
    } finally {
      shown.mockRestore();
    }
  });
});

describe('homebrew lines', () => {
  const AXE = 'hb_emberaxeaaaaaaaa';

  it('names an own item of the list', async () => {
    openShop((cloud) => {
      cloud.request('player-token-1', [{ item: AXE, qty: 1 }]);
    });
    const p = await panel();
    expect(cells(requestsOf(p)[0] as HTMLElement)[0]).toBe('Топор Тлеющих Углей');
  });

  it("names another account's item the list links, in a decided request too", async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const made = await cloud.shares.create(uuid(201), 'player');
    if (!made.ok) throw new Error('no share');
    cloud.request(made.token, [{ item: AXE, qty: 1 }]);
    const hash = '#/lists/' + uuid(201);
    const { container } = render(App, {
      env: fakeEnv({ router: memoryRouter(hash), data: fakeData(LOOT), cloud })
    });
    const p = await panel();
    const [req] = requestsOf(p);
    expect(cells(req as HTMLElement)[0]).toBe('Топор Тлеющих Углей');
    await userEvent.click(
      within(req as HTMLElement).getByRole('button', { name: 'Отклонить' })
    );
    const fold = await within(p).findByRole('button', { name: 'Решённые в этот раз (1)' });
    await userEvent.click(fold);
    expect(p.querySelector('.decided')).toHaveTextContent('Топор Тлеющих Углей');
    await expectNoA11yViolations(container);
  });
});

describe('the folds of a long panel', () => {
  const SEVEN = ['ci1', 'q1', 'q313', 'cc1', 'voa2_a3', 'q23', 'w51'].map((item) => ({
    item,
    qty: 1
  }));
  const rows = (req: HTMLElement): number => req.querySelectorAll('tbody tr').length;

  it('cuts a request at five lines and the panel at three requests, each rest behind one fold', async () => {
    const { container } = openShop((cloud) => {
      for (let i = 0; i < 3; i++) {
        vi.setSystemTime(T0 + i * 60_000);
        cloud.request('gm-token-1', [{ item: 'cc1', qty: 1 }]);
      }
      vi.setSystemTime(T0 + 3 * 60_000);
      expect(cloud.request('player-token-1', SEVEN)).not.toBeNull();
    });
    const p = await panel();
    expect(requestsOf(p)).toHaveLength(3);
    const big = requestsOf(p).find((r) => rows(r) === 5);
    if (!big) throw new Error('no cut request: ' + requestsOf(p).map(rows).join(','));
    const more = within(big).getByRole('button', { name: 'и ещё 2 позиции' });
    expect(more).toHaveAttribute('aria-expanded', 'false');
    const rest = within(p).getByRole('button', { name: 'и ещё 1 запрос' });
    await expectNoA11yViolations(container);
    await userEvent.click(more);
    expect(rows(big)).toBe(7);
    expect(within(big).getByRole('button', { name: 'свернуть' })).toBe(more);
    expect(more).toHaveFocus();
    expect(more).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(rest);
    expect(requestsOf(p)).toHaveLength(4);
    expect(within(p).getAllByRole('button', { name: 'свернуть', expanded: true })).toHaveLength(
      2
    );
    await expectNoA11yViolations(container);
  });

  it('draws fifteen lines and four folds at the limits of ten requests of a hundred lines', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const keys = Array.from({ length: 90 }, (_, i) => 'x' + String(i));
    await cloud.lists.apply([
      {
        op: 'add',
        list_id: SHOP,
        entries: keys.map((key, i) => ({
          id: uuid(7000 + i),
          item_key: key,
          source: 'official',
          hb_item: null,
          position: 10 + i,
          quantity: 1,
          price_coins: null,
          player_note: '',
          gm_note: ''
        }))
      }
    ]);
    const all = [
      'ci1',
      'q1',
      'q313',
      'cc1',
      'voa2_a3',
      'q23',
      'w51',
      'q35',
      'di11',
      'hb_emberaxeaaaaaaaa',
      ...keys
    ];
    const lines = all.map((item) => ({ item, qty: 1 }));
    expect(lines).toHaveLength(100);
    for (let i = 0; i < 10; i++) {
      vi.setSystemTime(T0 + i * 60_000);
      expect(cloud.request(i % 2 ? 'gm-token-1' : 'player-token-1', lines)).not.toBeNull();
    }
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/lists/' + SHOP), data: fakeData(LOOT), cloud })
    });
    const p = await panel();
    expect(requestsOf(p)).toHaveLength(3);
    expect(p.querySelectorAll('tbody tr')).toHaveLength(15);
    expect(within(p).getAllByRole('button', { name: 'и ещё 95 позиций' })).toHaveLength(3);
    expect(within(p).getByRole('button', { name: 'и ещё 7 запросов' })).toBeInTheDocument();
    expect(p.querySelector('h2')).toHaveTextContent('Новое в списке (10)');
  });

  it('draws the same fifteen lines at three times the limits, thirty requests of 300 lines', async () => {
    const cloud = fakeCloud(SEED, 'gm1', { limits: { entries: 300, pending: 30, lines: 300 } });
    const keys = Array.from({ length: 290 }, (_, i) => 'x' + String(i));
    const added = await cloud.lists.apply([
      {
        op: 'add',
        list_id: SHOP,
        entries: keys.map((key, i) => ({
          id: uuid(7000 + i),
          item_key: key,
          source: 'official',
          hb_item: null,
          position: 10 + i,
          quantity: 1,
          price_coins: null,
          player_note: '',
          gm_note: ''
        }))
      }
    ]);
    expect(added.ok).toBe(true);
    const all = [
      'ci1',
      'q1',
      'q313',
      'cc1',
      'voa2_a3',
      'q23',
      'w51',
      'q35',
      'di11',
      'hb_emberaxeaaaaaaaa',
      ...keys
    ];
    const lines = all.map((item) => ({ item, qty: 1 }));
    expect(lines).toHaveLength(300);
    for (let i = 0; i < 30; i++) {
      vi.setSystemTime(T0 + i * 60_000);
      expect(cloud.request(i % 2 ? 'gm-token-1' : 'player-token-1', lines)).not.toBeNull();
    }
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/lists/' + SHOP), data: fakeData(LOOT), cloud })
    });
    const p = await panel();
    expect(requestsOf(p)).toHaveLength(3);
    expect(p.querySelectorAll('tbody tr')).toHaveLength(15);
    expect(within(p).getAllByRole('button', { name: 'и ещё 295 позиций' })).toHaveLength(3);
    expect(within(p).getByRole('button', { name: 'и ещё 27 запросов' })).toBeInTheDocument();
    expect(p.querySelector('h2')).toHaveTextContent('Новое в списке (30)');
  });
});

describe('the change log in the panel', () => {
  const GM2_LIST = uuid(201);
  const AXE_ID = uuid(511);
  const CAP_ID = uuid(513);
  const LOOT2: Loot = {
    ...LOOT,
    items: {
      ...LOOT.items,
      core_item: [
        record('ci1', 'item', 'Спальный мешок', 'Bedroll'),
        record('q23', 'item', 'Верёвка', 'Rope')
      ]
    }
  };

  /* gm2's list as gm2, with the seeded notices; `make` writes first as the world's users. */
  async function openGm2(
    seed = SEED,
    make: (world: ReturnType<typeof fakeCloud>) => Promise<void> | void = () => undefined
  ) {
    const world = fakeCloud(seed, 'gm1');
    const cloud = world.as('gm2');
    await make(world);
    const view = render(App, {
      env: fakeEnv({
        router: memoryRouter('#/lists/' + GM2_LIST),
        data: fakeData(LOOT2),
        cloud
      })
    });
    return { ...view, world, cloud };
  }
  const inbox = async (): Promise<HTMLElement> =>
    (await screen.findByRole('heading', { name: /^Новое в списке/, level: 2 })).parentElement!;
  const noticeRows = (p: HTMLElement): HTMLElement[] => [
    ...p.querySelectorAll<HTMLElement>('.notice')
  ];
  const textOf = (el: Element): string => el.textContent.replace(/\s+/g, ' ').trim();

  it('counts the requests and every notice, draws the notices after the requests, and keeps «новое» after the read mark', async () => {
    const { container, cloud } = await openGm2(SEED, async (w) => {
      const made = await w.as('gm2').shares.create(GM2_LIST, 'player');
      if (made.ok) w.request(made.token, [{ item: 'q23', qty: 1 }]);
    });
    const p = await inbox();
    expect(within(p).getByRole('heading', { level: 2 })).toHaveTextContent(
      'Новое в списке (3)'
    );
    const rows = noticeRows(p);
    expect(rows.map((r) => textOf(r.querySelector('.ntext') as Element))).toEqual([
      'новое Автор изменил «Топор Тлеющих Углей». Открыть',
      'новое Автор удалил «' + (SEED.notices[1]?.name.ru ?? '') + '» - строка убрана из списка.'
    ]);
    expect(p.querySelector('.req')?.compareDocumentPosition(rows[0] as Node)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(
      within(rows[0] as HTMLElement).getByRole('link', { name: 'Открыть' })
    ).toHaveAttribute('href', '#/h/' + AXE_ID);
    await waitFor(async () => {
      const read = await cloud.requests.notices(GM2_LIST);
      expect(read.ok && read.notices.every((n) => n.read_at !== null)).toBe(true);
    });
    expect(noticeRows(p).every((r) => r.querySelector('.nnew'))).toBe(true);
    await expectNoA11yViolations(container);
  });

  it('folds the fourth notice, and reads the list only once the fold is open', async () => {
    const extra = [3, 4].map((n) => ({
      id: uuid(690 + n),
      listId: GM2_LIST,
      itemKey: 'hb_gone' + String(n) + 'aaaaaaaaaaaa',
      hid: null,
      kind: 'deleted' as const,
      name: { en: 'Gone ' + String(n), ru: 'Ушедший ' + String(n) },
      createdAgoMs: 3 * 86_400_000 + n
    }));
    const world = fakeCloud({ ...SEED, notices: [...SEED.notices, ...extra] }, 'gm2');
    const mark = vi.spyOn(world.requests, 'markRead');
    const { container } = render(App, {
      env: fakeEnv({
        router: memoryRouter('#/lists/' + GM2_LIST),
        data: fakeData(LOOT2),
        cloud: world
      })
    });
    const p = await inbox();
    await new Promise((r) => setTimeout(r, 0));
    expect(noticeRows(p)).toHaveLength(3);
    expect(mark).not.toHaveBeenCalled();
    await expectNoA11yViolations(container);
    await userEvent.click(within(p).getByRole('button', { name: 'и ещё 1 изменение' }));
    expect(noticeRows(p)).toHaveLength(4);
    await waitFor(() => {
      expect(mark).toHaveBeenCalledWith(GM2_LIST);
    });
    await expectNoA11yViolations(container);
  });

  it('hides one notice with the focus on the heading, then the last one with the focus on main', async () => {
    const { container, cloud } = await openGm2();
    const p = await inbox();
    expect(within(p).getByRole('button', { name: 'Скрыть изменения' })).toBeInTheDocument();
    await userEvent.click(
      within(p).getByRole('button', { name: 'Скрыть изменение «Топор Тлеющих Углей»' })
    );
    expect(noticeRows(p)).toHaveLength(1);
    expect(document.activeElement).toBe(within(p).getByRole('heading', { level: 2 }));
    /* One notice, one hide button: its own «Скрыть» (docs/specs/FEATURES.md, "The change log"). */
    expect(within(p).queryByRole('button', { name: 'Скрыть изменения' })).toBeNull();
    expect(within(p).getAllByRole('button', { name: /^Скрыть изменение «/ })).toHaveLength(1);
    await expectNoA11yViolations(container);
    await userEvent.click(
      within(p).getByRole('button', {
        name: 'Скрыть изменение «' + (SEED.notices[1]?.name.ru ?? '') + '»'
      })
    );
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /^Новое в списке/ })).toBeNull();
    });
    expect(document.activeElement).toBe(document.getElementById('main'));
    const left = await cloud.requests.notices(GM2_LIST);
    expect(left.ok && left.notices).toEqual([]);
  });

  it('keeps a notice that arrived after the read when «Скрыть изменения» is pressed', async () => {
    const { world, cloud } = await openGm2(SEED, async (w) => {
      await w.as('gm2').lists.apply([
        {
          op: 'add',
          list_id: GM2_LIST,
          entries: [
            {
              id: uuid(2190),
              item_key: 'hb_whispercapaaaaaa',
              source: 'homebrew',
              hb_item: CAP_ID,
              position: 2,
              quantity: 1,
              price_coins: null,
              player_note: '',
              gm_note: ''
            }
          ]
        }
      ]);
    });
    const p = await inbox();
    await waitFor(() => {
      expect(noticeRows(p)).toHaveLength(2);
    });
    const cap = SEED.homebrew.gm1.items.find((i) => i.id === CAP_ID);
    await world.homebrew.updateItem(
      CAP_ID,
      {
        content: { ...(cap?.content ?? { kind: 'item' }), en: 'Whispering Hat' },
        book_id: null
      },
      null
    );
    await userEvent.click(within(p).getByRole('button', { name: 'Скрыть изменения' }));
    const left = await cloud.requests.notices(GM2_LIST);
    expect(left.ok && left.notices.map((n) => n.item_key)).toEqual(['hb_whispercapaaaaaa']);
    expect(
      await screen.findByText('Автор изменил «Whispering Hat».', { exact: false })
    ).toBeInTheDocument();
  });

  it('says a failed hide and draws the notice again', async () => {
    const { cloud } = await openGm2();
    const p = await inbox();
    cloud.requests.hideNotices = () => Promise.resolve({ ok: false, error: 'network' });
    await userEvent.click(
      within(p).getByRole('button', { name: 'Скрыть изменение «Топор Тлеющих Углей»' })
    );
    expect(await screen.findByText(t.noticeHideFailed)).toBeInTheDocument();
    await waitFor(() => {
      expect(noticeRows(p)).toHaveLength(2);
    });
  });
});

describe('the read mark after a failure', () => {
  it('marks the list again on the 45 s clock after a failed mark', async () => {
    vi.useRealTimers();
    vi.useFakeTimers({ now: T0, toFake: ['Date', 'setInterval', 'clearInterval'] });
    const cloud = fakeCloud(SEED, 'gm1');
    cloud.request('player-token-1', [{ item: 'ci1', qty: 1 }]);
    const real = cloud.requests.markRead.bind(cloud.requests);
    const mark = vi
      .spyOn(cloud.requests, 'markRead')
      .mockImplementationOnce(() => Promise.resolve({ ok: false, error: 'network' }))
      .mockImplementation(real);
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/lists/' + SHOP), data: fakeData(LOOT), cloud })
    });
    await panel();
    await waitFor(() => {
      expect(mark).toHaveBeenCalledTimes(1);
    });
    vi.advanceTimersByTime(45_000);
    await waitFor(() => {
      expect(mark).toHaveBeenCalledTimes(2);
    });
  });
});
