/* The lists index, `#/lists` - off `renderLists`/`listCardHTML` and the create and delete
 * handlers (`git show 23c00a6^:app.js`): the account group and the sign-in prompt over the
 * fake cloud. */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import { fakeCloud } from '../ports/fake-cloud.js';
import { SEED, uuid, type SeedList } from '../ports/fake-cloud-seed.js';
import {
  fakeData,
  fakeDialog,
  fakeEnv,
  fakeImage,
  fakePage,
  memoryRouter,
  memoryStorage,
  noData
} from '../ports/index.js';
import type { CloudPort, Env } from '../ports/index.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import { DAY, listOf, manyLists, seedWith, TWO_LISTS } from '../test/seed.js';
import type { Loot } from '../lib/data.js';

afterEach(cleanup);

const LOOT: Loot = {
  items: {
    core_item: [
      {
        id: 'ci1',
        src: 'core',
        kind: 'item',
        roll: 1,
        en: 'Premium Bedroll',
        ende: 'Clear a Stress.',
        ru: 'Спальный мешок',
        rud: 'Очистите Стресс.'
      }
    ]
  },
  eq: [],
  refs: {}
};

const at = (over: Partial<Env> = {}): Env =>
  fakeEnv({ router: memoryRouter('#/lists'), data: fakeData(LOOT), ...over });

/** Renders `#/lists` signed in as gm4, who holds `lists`, and waits for the first card (or, with
 *  no lists, the create field). `limit` raises gm4's list limit for the long indexes. */
async function openIndex(lists: SeedList[] = [], limit?: number) {
  const cloud = fakeCloud(
    seedWith({ gm4: lists }),
    'gm4',
    limit === undefined ? undefined : { limits: { lists: limit } }
  );
  const router = memoryRouter('#/lists');
  const view = render(App, { env: at({ router, cloud }) });
  if (lists[0])
    await screen.findByRole('link', { name: new RegExp('^' + lists[0].name + ', ') });
  else await screen.findByRole('textbox', { name: 'Новый список' });
  return { ...view, cloud, router };
}

/** `n` account lists, «Список 1» first (the newest edit); `names` replace the first few. */
const manyAccount = (n: number, names: string[] = []): SeedList[] =>
  manyLists(
    840,
    Array.from({ length: n }, (_, i) => ({ name: names[i] ?? 'Список ' + String(i + 1) }))
  );

describe('a card per list', () => {
  it('draws two cards newest edit first, a known-record count, thumbs or the empty line', async () => {
    const { container } = await openIndex([
      listOf(831, 'Клад дракона', [{ key: 'ci1' }, { key: 'nope' }], {
        hnote: 'только для мастера',
        editedAgoMs: DAY
      }),
      listOf(832, 'Лавка в порту', [])
    ]);

    /* The link's name is its own `aria-label`: the list name, the count and the edit age. */
    const cardA = screen.getByRole('link', { name: /^Клад дракона, 1 позиция, изменён / });
    expect(cardA).toHaveAttribute('href', '/lists/' + uuid(831));
    expect(cardA.querySelectorAll('img')).toHaveLength(1);
    expect(cardA.querySelector('img')).toHaveAttribute('src', '/img/thumb/_none.webp');

    const cardB = screen.getByRole('link', { name: /^Лавка в порту, 0 позиций, изменён / });
    expect(cardB).toHaveAttribute('href', '/lists/' + uuid(832));
    expect(screen.queryByRole('button', { name: 'Поделиться' })).toBeNull();
    expect(cardB.querySelectorAll('img')).toHaveLength(0);
    expect(cardB).toHaveTextContent('Список пуст');

    // newest edit first, not alphabetical
    expect(cardNames(container)).toEqual(['Клад дракона', 'Лавка в порту']);
    /* The raw text-node structure, concatenated with no separator. */
    expect([cardA, cardB].map((c) => c.textContent)).toEqual([
      'Клад дракона1 позиция · изменён вчера',
      'Лавка в порту0 позиций · изменён позавчераСписок пуст'
    ]);
    /* The count is a line in words, not the roll number's badge. */
    expect(container.querySelector('.listcard .badge')).toBeNull();

    await expectNoA11yViolations(container);
  });
});

describe('creating a list', () => {
  it('refuses a blank name as an alert and focuses the input', async () => {
    await openIndex();
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Сначала назовите список');
    expect(screen.getByPlaceholderText('Например: клад дракона')).toHaveFocus();
  });
});

describe('a dataset that did not load', () => {
  it('draws noData and no panel, signed in', async () => {
    render(App, {
      env: fakeEnv({
        router: memoryRouter('#/lists'),
        data: noData(),
        cloud: fakeCloud(SEED, 'gm1')
      })
    });
    await screen.findByRole('button', { name: 'Аккаунт: gm1@example.test' });
    expect(screen.getByRole('heading', { level: 1, name: 'Мои списки' })).toBeInTheDocument();
    expect(screen.getByText('Данные не загрузились. Обновите страницу.')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Например: клад дракона')).not.toBeInTheDocument();
    expect(document.querySelectorAll('.listcard')).toHaveLength(0);
  });
});

describe('opening a list', () => {
  it("opens an empty list from its card, through the card's own link", async () => {
    const { router } = await openIndex(TWO_LISTS.slice().reverse());
    const card = screen.getByRole('link', { name: /Лавка в порту/ });
    router.click(card.getAttribute('href') ?? '');
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Лавка в порту' })
      ).toBeInTheDocument();
    });
    expect(router.hash()).toBe('#/lists/' + uuid(812));
  });
});

const cardNames = (container: HTMLElement): string[] =>
  [...container.querySelectorAll('.listcard-top b')].map((b) => b.textContent);

/* The box is named by its placeholder alone, which Chrome's accessible name
   reads and jsdom's does not. */
const findBox = (): HTMLElement => screen.getByPlaceholderText('Найти список');

describe('the name filter', () => {
  it('draws no filter under eight lists', async () => {
    await openIndex(TWO_LISTS);
    expect(screen.queryByPlaceholderText('Найти список')).not.toBeInTheDocument();
  });

  it('draws the filter from the eighth list and narrows by folded name, newest edit first', async () => {
    const names = ['Порт Ветров', 'Рынок', 'Лавка в порту', 'Логово'];
    const { container } = await openIndex(manyAccount(8, names));
    expect(container.querySelectorAll('.listcard')).toHaveLength(8);

    await userEvent.type(findBox(), 'ПОРТ');
    expect(cardNames(container)).toEqual(['Порт Ветров', 'Лавка в порту']);
    await expectNoA11yViolations(container);
  });

  it('draws «Ничего не найдено» and no card for a query nothing matches', async () => {
    const { container } = await openIndex(manyAccount(8));
    await userEvent.type(findBox(), 'zzz');
    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
    expect(container.querySelectorAll('.listcard')).toHaveLength(0);
    await expectNoA11yViolations(container);
  });

  it('clears the query on a create and shows the new card first', async () => {
    const { container } = await openIndex(manyAccount(8));
    await userEvent.type(findBox(), 'zzz');
    await userEvent.type(screen.getByPlaceholderText('Например: клад дракона'), 'Тайник');
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));

    expect(findBox()).toHaveValue('');
    expect(cardNames(container)[0]).toBe('Тайник');
    expect(container.querySelectorAll('.listcard')).toHaveLength(9);
  });
});

describe('«Показать ещё»', () => {
  const more = (n: number): HTMLElement =>
    screen.getByRole('button', { name: 'Показать ещё (' + String(n) + ')' });

  it('draws every card and no button at 24 lists', async () => {
    const { container } = await openIndex(manyAccount(24));
    expect(container.querySelectorAll('.listcard')).toHaveLength(24);
    expect(screen.queryByRole('button', { name: /Показать ещё/ })).not.toBeInTheDocument();
  });

  it('draws 24 of 30, and a press draws the rest, drops the button and focuses the 25th card', async () => {
    const { container } = await openIndex(manyAccount(30), 200);
    expect(container.querySelectorAll('.listcard')).toHaveLength(24);
    await expectNoA11yViolations(container);

    await userEvent.click(more(6));
    expect(container.querySelectorAll('.listcard')).toHaveLength(30);
    expect(screen.queryByRole('button', { name: /Показать ещё/ })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(container.querySelectorAll('.listcard-main')[24]);
  });

  it('adds 24 a press: two presses reach 60', async () => {
    const { container } = await openIndex(manyAccount(60), 200);
    await userEvent.click(more(36));
    expect(container.querySelectorAll('.listcard')).toHaveLength(48);
    await userEvent.click(more(12));
    expect(container.querySelectorAll('.listcard')).toHaveLength(60);
  });

  it("folds the filter's result by the same rule, and a query edit folds it back to 24", async () => {
    // ten «Логово» lists, then thirty «Список» ones
    const lairs = Array.from({ length: 10 }, (_, i) => 'Логово ' + String(i + 1));
    const { container } = await openIndex(manyAccount(40, lairs), 200);
    await userEvent.type(findBox(), 'спис');
    expect(container.querySelectorAll('.listcard')).toHaveLength(24);
    await userEvent.click(more(6));
    expect(container.querySelectorAll('.listcard')).toHaveLength(30);

    await userEvent.type(findBox(), 'о');
    expect(container.querySelectorAll('.listcard')).toHaveLength(24);
    expect(more(6)).toBeInTheDocument();
  });

  it('keeps the drawn count across a visit to a list and back, and starts the query over', async () => {
    const { container, router } = await openIndex(manyAccount(30), 200);
    await userEvent.click(more(6));
    // the address the 26th card links to, as a press on it would open
    const card = container.querySelectorAll('.listcard-main')[25];
    router.click(card?.getAttribute('href') ?? '');
    await waitFor(() => {
      expect(container.querySelector('.listcard')).not.toBeInTheDocument();
    });
    router.navigate('#/lists');
    await waitFor(() => {
      expect(container.querySelectorAll('.listcard')).toHaveLength(30);
    });
    expect(findBox()).toHaveValue('');
  });

  it('puts a card created on a folded page first, and the button counts one more', async () => {
    const { container } = await openIndex(manyAccount(30), 200);
    await userEvent.type(screen.getByPlaceholderText('Например: клад дракона'), 'Тайник');
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));
    expect(cardNames(container)[0]).toBe('Тайник');
    expect(container.querySelectorAll('.listcard')).toHaveLength(24);
    expect(more(7)).toBeInTheDocument();
  });

  it('reads "Show more (N)" in English', async () => {
    const cloud = fakeCloud(seedWith({ gm4: manyAccount(30) }), 'gm4', {
      limits: { lists: 200 }
    });
    render(App, {
      env: at({ cloud, storage: memoryStorage({ 'dhloot.lang.v1': 'en' }) })
    });
    expect(await screen.findByRole('button', { name: 'Show more (6)' })).toBeInTheDocument();
  });
});

describe('with sign-in configured', () => {
  const withCloud = (cloud: CloudPort, over: Partial<Env> = {}) => {
    const router = memoryRouter('#/lists');
    const dialog = fakeDialog();
    const view = render(App, { env: at({ router, dialog, cloud, ...over }) });
    return { ...view, router, dialog };
  };
  const groupNames = (container: HTMLElement): string[] =>
    [...container.querySelectorAll('h2')].map((h) => h.textContent);

  it("counts another account's linked item and an own item on their cards, each with a thumb", async () => {
    const gm2 = withCloud(fakeCloud(SEED, 'gm2'));
    const linked = await screen.findByRole('link', { name: /^Список второго ГМа, / });
    expect(linked.querySelector('.listcard-meta')?.textContent).toMatch(/^1 позиция · /);
    const known = linked.querySelectorAll('.listcard-thumbs img').length;
    expect(known).toBeGreaterThan(0);
    gm2.unmount();
    withCloud(fakeCloud(SEED, 'gm1'));
    const shop = await screen.findByRole('link', { name: /^Лавка кузнеца, / });
    expect(shop.querySelectorAll('.listcard-thumbs img').length).toBeGreaterThan(1);
  });

  it('draws the prompt as the panel signed out, and «Войти» opens the account page', async () => {
    const { container, router } = withCloud(fakeCloud(SEED));
    const button = await screen.findByRole('button', { name: 'Войти' });
    expect(screen.getByRole('heading', { level: 2, name: 'Новый список' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Войдите, чтобы создавать списки: они хранятся в аккаунте и открываются на любом устройстве.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Например: клад дракона')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Войти через/ })).not.toBeInTheDocument();
    expect(
      screen.queryByText('Списков пока нет - создайте первый выше.')
    ).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
    await userEvent.click(button);
    expect(router.hash()).toBe('#/account');
  });

  const withRequests = () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const storage = memoryStorage();
    cloud.request('player-token-1', [{ item: 'ci1', qty: 1 }]);
    cloud.request('gm-token-1', [{ item: 'cc1', qty: 1 }]);
    return { ...withCloud(cloud, { storage }), storage };
  };

  it("counts an account list's pending requests on its card and in its link's name", async () => {
    const { container } = withRequests();
    const line = await screen.findByText('2 запроса ждут ответа');
    expect(line).toHaveClass('listcard-req');
    const link = line.closest('a');
    expect(link?.getAttribute('aria-label')).toMatch(/, 2 запроса ждут ответа$/);
    expect(container.querySelectorAll('.listcard-req')).toHaveLength(1);
    await expectNoA11yViolations(container);
  });

  /* `n` unread notices on gm1's shop, each of another item. */
  const shopNotices = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      id: uuid(9600 + i),
      listId: uuid(101),
      itemKey: 'hb_note' + String.fromCharCode(97 + i) + 'aaaaaaaaaaaa',
      hid: null,
      kind: 'deleted' as const,
      name: { en: 'Gone', ru: 'Ушёл' },
      createdAgoMs: 60_000 * (i + 1)
    }));

  it('counts the unread notices beside the requests, and alone, in both plural forms', async () => {
    const cloud = fakeCloud({ ...SEED, notices: shopNotices(1) }, 'gm1');
    cloud.request('player-token-1', [{ item: 'ci1', qty: 1 }]);
    cloud.request('gm-token-1', [{ item: 'cc1', qty: 1 }]);
    const { container } = withCloud(cloud);
    const line = await screen.findByText('2 запроса ждут ответа · 1 изменение');
    expect(line).toHaveClass('listcard-req');
    await expectNoA11yViolations(container);
    cleanup();
    withCloud(fakeCloud(SEED, 'gm2'));
    expect(await screen.findByText('2 изменения')).toHaveClass('listcard-req');
    cleanup();
    withCloud(fakeCloud({ ...SEED, notices: shopNotices(5) }, 'gm1'));
    expect(await screen.findByText('5 изменений')).toHaveClass('listcard-req');
  });

  it('drops the line once the requests expire', async () => {
    const { container, storage } = withRequests();
    await screen.findByText('2 запроса ждут ответа');
    const now = Date.now;
    try {
      /* The lists page never reads a request, so each lasts its 30 unread days. */
      Date.now = () => now() + 30 * 86_400_000 + 60_000;
      storage.fireExternalChange(null);
      await waitFor(() => {
        expect(container.querySelector('.listcard-req')).toBeNull();
      });
    } finally {
      Date.now = now;
    }
    await expectNoA11yViolations(container);
  });

  it('draws no panel while the session is unknown', () => {
    const cloud = fakeCloud(SEED);
    cloud.auth.session = () => new Promise(() => undefined);
    withCloud(cloud);
    expect(screen.queryByRole('button', { name: 'Войти' })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Например: клад дракона')).not.toBeInTheDocument();
  });

  it('draws the account group newest edit first', async () => {
    const { container } = withCloud(fakeCloud(SEED, 'gm1'));
    await screen.findByText('Пустой список');
    expect(groupNames(container)).toEqual(['Ваш аккаунт']);
    expect(cardNames(container)).toEqual(['Пустой список', 'Лавка кузнеца', 'Трофеи']);
    expect([...container.querySelectorAll('.listcard-meta')].map((p) => p.textContent)).toEqual(
      [
        '0 позиций · изменён 1 час назад',
        '2 позиции · изменён 3 дня назад',
        '1 позиция · изменён в прошлом месяце'
      ]
    );
    const shop = screen.getByRole('link', {
      name: 'Лавка кузнеца, 2 позиции, изменён 3 дня назад'
    });
    expect(shop).toHaveAttribute('href', '/lists/00000000-0000-4000-8000-000000000101');
    /* An account card has one action: delete. */
    const acts = shop.parentElement?.querySelectorAll('.listcard-acts button');
    expect([...(acts ?? [])].map((b) => b.textContent)).toEqual(['Удалить']);
    await expectNoA11yViolations(container);
  });

  it('moves «изменён N назад» with the 45 s clock while the index stays open', async () => {
    vi.useFakeTimers({
      now: new Date('2026-09-25T12:00:00Z'),
      toFake: ['Date', 'setInterval', 'clearInterval']
    });
    try {
      const cloud = fakeCloud(SEED, 'gm1');
      const { container } = withCloud(cloud);
      await screen.findByText('Пустой список');
      const edited = (): (string | null)[] =>
        [...container.querySelectorAll('.listcard-meta')].map((p) => p.textContent);
      expect(edited()[0]).toBe('0 позиций · изменён 1 час назад');
      const read = vi.spyOn(cloud.lists, 'list');
      await vi.advanceTimersByTimeAsync(3_600_000);
      await waitFor(() => {
        expect(edited()[0]).toBe('0 позиций · изменён 2 часа назад');
      });
      const answers = await Promise.all(read.mock.results.map((r) => r.value as unknown));
      expect(answers.every((a) => JSON.stringify(a) === JSON.stringify(answers[0]))).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('creates an account list, first in the account group', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const page = fakePage();
    const { container } = withCloud(cloud, { page });
    await screen.findByText('Список второго ГМа');
    await userEvent.type(screen.getByPlaceholderText('Например: клад дракона'), 'Тайник');
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));
    expect(cardNames(container)).toEqual(['Тайник', 'Список второго ГМа']);
    expect(screen.getByText('Список «Тайник» создан')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Тайник/ })).toHaveAttribute(
      'href',
      '/lists/00000000-0000-4000-8000-000000005000'
    );
    page.fireHidden();
    await waitFor(async () => {
      const read = await cloud.lists.list();
      expect(read.ok && read.lists.map((l) => l.name)).toContain('Тайник');
    });
  });

  it('deletes an account list after a confirm that names its links, with no undo', async () => {
    const { container, dialog } = withCloud(fakeCloud(SEED, 'gm1'));
    await screen.findByText('Трофеи');
    const trophies = screen.getByRole('link', { name: /Трофеи/ });
    const del = trophies.parentElement?.querySelector('.listcard-acts button');
    await userEvent.click(del as HTMLElement);
    expect(dialog.asked).toEqual([
      'Удалить список «Трофеи»? Ссылки для игроков и мастера перестанут работать. Отменить удаление нельзя.'
    ]);
    expect(cardNames(container)).toEqual(['Пустой список', 'Лавка кузнеца']);
    expect(screen.getByText('Список «Трофеи» удалён')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Вернуть' })).not.toBeInTheDocument();
  });

  it('keeps an account list when the confirm is refused', async () => {
    const { container } = withCloud(fakeCloud(SEED, 'gm1'), { dialog: fakeDialog(false) });
    await screen.findByText('Трофеи');
    const del = screen
      .getByRole('link', { name: /Трофеи/ })
      .parentElement?.querySelector('.listcard-acts button');
    await userEvent.click(del as HTMLElement);
    expect(cardNames(container)).toContain('Трофеи');
  });

  it('says loading, then a failed read with a retry that loads', async () => {
    const cloud = fakeCloud(SEED, 'gm1', { offline: true });
    const { container } = withCloud(cloud);
    expect(await screen.findByText('Не получилось загрузить списки аккаунта.')).toBeVisible();
    await expectNoA11yViolations(container);
    cloud.setOffline(false);
    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(await screen.findByText('Лавка кузнеца')).toBeInTheDocument();
  });

  it('moves focus to the «Новый список» field when the group retry loads', async () => {
    const cloud = fakeCloud(SEED, 'gm1', { offline: true });
    withCloud(cloud);
    await screen.findByText('Не получилось загрузить списки аккаунта.');
    const retry = screen.getByRole('button', { name: 'Повторить' });
    cloud.setOffline(false);
    retry.focus();
    await fireEvent.click(retry);
    expect(await screen.findByText('Лавка кузнеца')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Новый список' })).toHaveFocus();
    });
  });

  it('shows «Не сохранено» and «Повторить» on the index after a create that cannot be sent, and «Повторить» sends it', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const page = fakePage();
    const { container } = withCloud(cloud, { page });
    await screen.findByText('Список второго ГМа');
    const count = (): string =>
      (container.querySelector('.count')?.textContent ?? '').replace(/\s+/g, ' ').trim();
    expect(count()).toBe('1 список из 50');
    cloud.setOffline(true);
    await userEvent.type(screen.getByPlaceholderText('Например: клад дракона'), 'Тайник');
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));
    page.fireHidden();
    await waitFor(() => {
      expect(count()).toBe('2 списка из 50 · Не сохраненоПовторить');
    });
    expect(cardNames(container)).toEqual(['Тайник', 'Список второго ГМа']);
    const said = (): string[] =>
      [...container.querySelectorAll('.said[role="status"]')].map((r) => r.textContent.trim());
    expect(said()).toContain('Не сохранено');
    await expectNoA11yViolations(container);
    cloud.setOffline(false);
    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    await waitFor(() => {
      expect(count()).toBe('2 списка из 50');
    });
    expect(said()).toContain('Сохранено');
    const read = await cloud.lists.list();
    expect(read.ok && read.lists.map((l) => l.name)).toContain('Тайник');
  });

  it('refuses a create at the limit with the limit text, makes no card and keeps the draft', async () => {
    const { container } = withCloud(fakeCloud(SEED, 'gm1', { limits: { lists: 3 } }));
    expect(await screen.findByText('3 списка из 3')).toBeInTheDocument();
    const field = screen.getByPlaceholderText('Например: клад дракона');
    await userEvent.type(field, 'Четвёртый');
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));
    expect(
      screen.getByText(
        'Достигнут предел списков в аккаунте: 3. Нужно больше - напишите на daggerheart.loot@gmail.com.'
      )
    ).toBeInTheDocument();
    expect(cardNames(container)).not.toContain('Четвёртый');
    expect(field).toHaveValue('Четвёртый');
    expect(screen.getByText('3 списка из 3')).toBeInTheDocument();
  });

  it('says loading while the first read is in flight, and none when the account is empty', async () => {
    const slow = fakeCloud(SEED, 'gm1');
    slow.lists.list = () => new Promise(() => undefined);
    withCloud(slow);
    expect(await screen.findByText('Загружаем...')).toBeInTheDocument();
    cleanup();
    const empty = fakeCloud(SEED, 'gm1');
    empty.lists.list = () =>
      Promise.resolve({ ok: true, lists: [], listLimit: 50, entryLimit: 100 });
    withCloud(empty);
    expect(
      await screen.findByText('В аккаунте пока нет списков - создайте первый выше.')
    ).toBeInTheDocument();
    expect(screen.getByText('0 списков из 50')).toBeInTheDocument();
  });

  it('counts the account lists with the limit, at the limit and at an override of 150', async () => {
    const { container } = withCloud(fakeCloud(SEED, 'gm1'));
    expect(await screen.findByText('3 списка из 50')).toBeInTheDocument();
    await expectNoA11yViolations(container);
    cleanup();
    withCloud(fakeCloud(SEED, 'gm1', { limits: { lists: 3 } }));
    expect(await screen.findByText('3 списка из 3')).toBeInTheDocument();
    cleanup();
    const big = fakeCloud(SEED, 'gm1', { limits: { lists: 150 } });
    for (let i = 0; i < 147; i++) {
      await big.lists.apply([
        {
          op: 'create',
          list: {
            id: uuid(9000 + i),
            name: 'Л' + String(i),
            money_mode: 'bag',
            player_note: '',
            gm_note: ''
          },
          entries: []
        }
      ]);
    }
    withCloud(big);
    expect(await screen.findByText('150 списков из 150')).toBeInTheDocument();
  });

  it('counts with no limit when the limit read failed', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const read = cloud.lists.list.bind(cloud.lists);
    cloud.lists.list = async () => {
      const r = await read();
      return r.ok ? { ...r, listLimit: null } : r;
    };
    withCloud(cloud);
    expect(await screen.findByText('3 списка')).toBeInTheDocument();
  });

  it('filters the account group with one box and folds it', async () => {
    const { container } = await openIndex(
      manyAccount(33, ['Лавка у моря', 'Лавка кузнеца']),
      200
    );
    expect(container.querySelectorAll('.listcard')).toHaveLength(24);
    expect(cardNames(container).slice(0, 3)).toEqual([
      'Лавка у моря',
      'Лавка кузнеца',
      'Список 3'
    ]);
    await userEvent.click(screen.getByRole('button', { name: 'Показать ещё (9)' }));
    expect(container.querySelectorAll('.listcard')).toHaveLength(33);
    expect(document.activeElement).toBe(container.querySelectorAll('.listcard-main')[24]);

    await userEvent.type(findBox(), 'лавк');
    expect(cardNames(container)).toEqual(['Лавка у моря', 'Лавка кузнеца']);
    await userEvent.clear(findBox());
    await userEvent.type(findBox(), 'zzz');
    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
    expect(container.querySelectorAll('.listcard')).toHaveLength(0);
  });
});

describe('selecting account lists', () => {
  const EMPTY = 'Пустой список';
  const TROPHIES = 'Трофеи';
  const signedIn = async (cloud = fakeCloud(SEED, 'gm1'), over: Partial<Env> = {}) => {
    const dialog = fakeDialog();
    const view = render(App, {
      env: at({ router: memoryRouter('#/lists'), dialog, cloud, ...over })
    });
    await screen.findByText('Лавка кузнеца');
    return { ...view, dialog };
  };
  const pick = (name: string): HTMLInputElement =>
    screen.getByRole('checkbox', { name: 'Выбрать: ' + name });
  const summary = (c: HTMLElement): string =>
    c.querySelector('.batch-summ')?.textContent.trim() ?? '';
  /* Account lists made on the server before the page opens. */
  const withLists = async (names: string[]) => {
    const cloud = fakeCloud(SEED, 'gm1');
    await cloud.lists.apply(
      names.map((name, i) => ({
        op: 'create' as const,
        list: {
          id: uuid(7000 + i),
          name,
          money_mode: 'bag' as const,
          player_note: '',
          gm_note: ''
        },
        entries: []
      }))
    );
    return cloud;
  };
  const ticked = (c: HTMLElement): number =>
    c.querySelectorAll('.listcard-pick input:checked').length;

  it('gives each card a pick box and a count line, no badge', async () => {
    const { container } = await signedIn(fakeCloud(SEED, 'gm1'));
    expect(
      screen
        .getAllByRole('checkbox', { name: /^Выбрать: / })
        .map((b) => b.getAttribute('aria-label'))
    ).toEqual(['Выбрать: Пустой список', 'Выбрать: Лавка кузнеца', 'Выбрать: Трофеи']);
    expect(container.querySelectorAll('.listcard .badge')).toHaveLength(0);
    expect(container.querySelectorAll('.listcard-meta')).toHaveLength(3);
    /* The box is outside the card's link, which keeps its own name. */
    expect(pick(EMPTY).closest('a')).toBeNull();
    expect(screen.getByRole('link', { name: /^Пустой список, / })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Выбрать все' })).not.toBeChecked();
    expect(summary(container)).toBe('');
  });

  it('draws the strip on for two ticked cards, and downloads the two in index order', async () => {
    const image = fakeImage();
    const { container } = await signedIn(fakeCloud(SEED, 'gm1'), { image });
    await userEvent.click(pick(TROPHIES));
    await userEvent.click(pick(EMPTY));
    expect(summary(container)).toBe('Выбрано 2');
    const all = screen.getByRole<HTMLInputElement>('checkbox', { name: 'Выбрать все' });
    expect(all.indeterminate).toBe(true);
    expect(pick(EMPTY).closest('.listcard')).toHaveClass('picked');
    expect(pick('Лавка кузнеца').closest('.listcard')).not.toHaveClass('picked');
    await userEvent.click(screen.getByRole('button', { name: 'Скачать JSON (2)' }));
    await waitFor(() => {
      expect(image.downloaded).toHaveLength(1);
    });
    const text = await image.downloaded[0]!.blob.text();
    expect(
      (JSON.parse(text) as { lists: { name: string }[] }).lists.map((l) => l.name)
    ).toEqual([EMPTY, TROPHIES]);
    expect(ticked(container)).toBe(2);
    expect(screen.getByRole('button', { name: 'Удалить (2)' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it("disables «Скачать JSON (N)» while the ticked lists' entries are read", async () => {
    const image = fakeImage();
    const cloud = fakeCloud(SEED, 'gm1');
    const real = cloud.lists.rows.bind(cloud.lists);
    let release: () => void = () => undefined;
    cloud.lists.rows = (ids) =>
      new Promise((r) => {
        release = () => {
          r(real(ids));
        };
      });
    await signedIn(cloud, { image });
    await userEvent.click(pick(TROPHIES));
    const button = screen.getByRole('button', { name: 'Скачать JSON (1)' });
    await userEvent.click(button);
    expect(button).toBeDisabled();
    release();
    await waitFor(() => {
      expect(image.downloaded).toHaveLength(1);
    });
    expect(button).toBeEnabled();
  });

  it('keeps everything when the confirm is refused', async () => {
    const { container } = await signedIn(fakeCloud(SEED, 'gm1'), {
      dialog: fakeDialog(false)
    });
    await userEvent.click(pick(EMPTY));
    await userEvent.click(pick(TROPHIES));
    await userEvent.click(screen.getByRole('button', { name: 'Удалить (2)' }));
    expect(cardNames(container)).toEqual([EMPTY, 'Лавка кузнеца', TROPHIES]);
    expect(ticked(container)).toBe(2);
  });

  it('deletes the ticked lists after one confirm that names them, with no undo', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const page = fakePage();
    const dialog = fakeDialog();
    const { container } = await signedIn(cloud, { page, dialog });
    await userEvent.click(pick(EMPTY));
    await userEvent.click(pick(TROPHIES));
    await userEvent.click(screen.getByRole('button', { name: 'Удалить (2)' }));
    expect(dialog.asked).toEqual([
      'Удалить списки (2): «Пустой список», «Трофеи»? Ссылки для игроков и мастера на них перестанут работать. Отменить удаление нельзя.'
    ]);
    expect(cardNames(container)).toEqual(['Лавка кузнеца']);
    expect(screen.getByText('Удалено списков: 2')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Вернуть' })).toBeNull();
    expect(summary(container)).toBe('');
    expect(ticked(container)).toBe(0);
    page.fireHidden();
    await waitFor(async () => {
      const read = await cloud.lists.list();
      expect(read.ok && read.lists.map((l) => l.name)).toEqual(['Лавка кузнеца']);
    });
  });

  it('hands focus to «Выбрать все» after «Удалить (N)» with a card left, else to the name field (rule 20)', async () => {
    const { container } = await signedIn();
    await userEvent.click(pick(EMPTY));
    await userEvent.click(pick(TROPHIES));
    await userEvent.click(screen.getByRole('button', { name: 'Удалить (2)' }));
    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: 'Выбрать все' })).toHaveFocus();
    });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все' }));
    await userEvent.click(screen.getByRole('button', { name: 'Удалить (1)' }));
    expect(cardNames(container)).toEqual([]);
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Новый список' })).toHaveFocus();
    });
    await expectNoA11yViolations(container);
  });

  it("hands focus to the next card's «Удалить», the previous one's, then the name field", async () => {
    const { container } = await signedIn();
    const dels = (): HTMLElement[] => screen.getAllByRole('button', { name: 'Удалить' });
    await userEvent.click(dels()[0] as HTMLElement);
    expect(cardNames(container)).toEqual(['Лавка кузнеца', TROPHIES]);
    await waitFor(() => {
      expect(dels()[0]).toHaveFocus();
    });
    await userEvent.click(dels()[1] as HTMLElement);
    expect(cardNames(container)).toEqual(['Лавка кузнеца']);
    await waitFor(() => {
      expect(dels()[0]).toHaveFocus();
    });
    await userEvent.click(dels()[0] as HTMLElement);
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Новый список' })).toHaveFocus();
    });
  });

  it('names five lists in the confirm, then counts the rest', async () => {
    const dialog = fakeDialog();
    await signedIn(await withLists(['А', 'Б', 'В', 'Г']), { dialog });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все' }));
    await userEvent.click(screen.getByRole('button', { name: 'Удалить (7)' }));
    expect(dialog.asked[0]).toMatch(
      /^Удалить списки \(7\): «[^»]+», «[^»]+», «[^»]+», «[^»]+», «[^»]+» и ещё 2\? /
    );
  });

  it('ticks the drawn cards only, and drops a tick the query hides for good', async () => {
    const cloud = await withLists([
      'Порт Ветров',
      'Рынок',
      'Лавка в порту',
      'Сессия 1',
      'Сессия 2',
      'Сессия 3',
      'Сессия 4',
      'Сессия 5',
      'Сессия 6'
    ]);
    const { container } = await signedIn(cloud);
    await userEvent.click(pick('Порт Ветров'));
    await userEvent.click(pick('Рынок'));
    expect(summary(container)).toBe('Выбрано 2');
    await userEvent.type(findBox(), 'порт');
    expect(summary(container)).toBe('Выбрано 1');
    expect(screen.getByRole('button', { name: 'Удалить (1)' })).toBeInTheDocument();
    await userEvent.clear(findBox());
    expect(pick('Рынок')).not.toBeChecked();
    expect(summary(container)).toBe('Выбрано 1');
    await userEvent.type(findBox(), 'порт');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все' }));
    expect(summary(container)).toBe('Выбрано 2');
    expect(ticked(container)).toBe(2);
    expect(screen.getByRole('button', { name: 'Скачать JSON (2)' })).toBeInTheDocument();
    await userEvent.clear(findBox());
    expect(ticked(container)).toBe(2);
    expect(summary(container)).toBe('Выбрано 2');
  });

  it('keeps the ticks when «Показать ещё» draws more', async () => {
    const cloud = await withLists(Array.from({ length: 27 }, (_, i) => 'Ещё ' + String(i + 1)));
    const { container } = render(App, { env: at({ router: memoryRouter('#/lists'), cloud }) });
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Выбрать: Ещё 27' }));
    await userEvent.click(screen.getByRole('button', { name: 'Показать ещё (6)' }));
    expect(ticked(container)).toBe(1);
    expect(summary(container)).toBe('Выбрано 1');
  });

  it('draws the import toggle only while the lists are read', async () => {
    render(App, { env: at({ router: memoryRouter('#/lists'), cloud: fakeCloud(SEED) }) });
    await screen.findByRole('button', { name: 'Войти' });
    expect(screen.queryByRole('button', { name: 'Импорт из файла' })).toBeNull();
    cleanup();

    const slow = fakeCloud(SEED, 'gm1');
    slow.lists.list = () => new Promise(() => undefined);
    render(App, { env: at({ router: memoryRouter('#/lists'), cloud: slow }) });
    await screen.findByText('Загружаем...');
    expect(screen.queryByRole('button', { name: 'Импорт из файла' })).toBeNull();
    cleanup();

    const offline = fakeCloud(SEED, 'gm1', { offline: true });
    render(App, { env: at({ router: memoryRouter('#/lists'), cloud: offline }) });
    await screen.findByText('Не получилось загрузить списки аккаунта.');
    expect(screen.queryByRole('button', { name: 'Импорт из файла' })).toBeNull();
    cleanup();

    await signedIn();
    expect(screen.getByRole('button', { name: 'Импорт из файла' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('names the pick box of a list with no name «Без названия»', async () => {
    await signedIn(await withLists(['']));
    expect(screen.getByRole('checkbox', { name: 'Выбрать: Без названия' })).toBeInTheDocument();
  });

  it('draws the missing-art thumb after a card picture fails', async () => {
    const withArt: Loot = {
      ...LOOT,
      items: { core_item: [{ ...LOOT.items['core_item']![0]!, img: 'ci1.webp' }] }
    };
    const { container } = await signedIn(fakeCloud(SEED, 'gm1'), { data: fakeData(withArt) });
    const img = container.querySelector<HTMLImageElement>('.listcard-thumbs img');
    expect(img).toHaveAttribute('src', '/img/thumb/ci1.webp');
    await fireEvent.error(img!);
    await waitFor(() => {
      expect(container.querySelector('.listcard-thumbs img')).toHaveAttribute(
        'src',
        '/img/thumb/_none.webp'
      );
    });
  });

  it('passes axe with one card picked', async () => {
    const { container } = await signedIn();
    await userEvent.click(pick('Лавка кузнеца'));
    expect(summary(container)).toBe('Выбрано 1');
    await expectNoA11yViolations(container);
  });
});
