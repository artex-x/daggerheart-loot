/* The add-to-list row on the card, driven through fake ports.
 *
 * `state/cloudLists.test.ts` covers the store itself; this is what a person sees
 * and presses - the button, the menu, a chip's tick, the new-list form, and
 * the toast each of those raises. Off `listMenuHTML`/`addToListBtn` in
 * app.js and `listMemberFor(item)`'s own live behaviour. */

import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import { fakeData, fakeEnv, fakePage, memoryRouter, memoryStorage } from '../ports/index.js';
import type { CloudPort, Env } from '../ports/index.js';
import { fakeCloud } from '../ports/fake-cloud.js';
import { SEED, uuid, type SeedList } from '../ports/fake-cloud-seed.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import { readList } from '../test/accountList.js';
import { DAY, listOf, manyLists, seedWith, TWO_LISTS } from '../test/seed.js';
import { toCloudList, type CloudList } from '../lib/cloudLists.js';
import type { Loot } from '../lib/data.js';

afterEach(cleanup);

/* jsdom does not implement scrollIntoView - `placeMenu`'s port calls it
   unconditionally once the menu is open. */
Element.prototype.scrollIntoView = vi.fn();

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
  fakeEnv({ router: memoryRouter('#/i/ci1'), data: fakeData(LOOT), ...over });

const openMenu = (): Promise<void> =>
  userEvent.click(screen.getByRole('button', { name: 'Добавить в список' }));

/** Renders the card as gm4, who holds `lists`, and waits for the account. */
async function openCard(lists: SeedList[]) {
  const cloud = fakeCloud(seedWith({ gm4: lists }), 'gm4');
  const page = fakePage();
  const view = render(App, { env: at({ cloud, page }) });
  await screen.findByRole('button', { name: 'Аккаунт: gm4@example.test' });
  return { ...view, cloud, page };
}

/** Opens the menu and waits for its first chip, the newest list. */
async function openMenuOn(first: string): Promise<void> {
  await openMenu();
  await screen.findByRole('button', { name: first });
}

/** Sends the account's buffer and answers the stored list called `name`. */
async function listNamed(
  cloud: CloudPort,
  page: { fireHidden(): void },
  name: string
): Promise<CloudList> {
  page.fireHidden();
  return waitFor(async () => {
    const heads = await cloud.lists.list();
    const id = heads.ok ? heads.lists.find((l) => l.name === name)?.id : undefined;
    expect(id).toBeDefined();
    const read = await cloud.lists.rows([id!]);
    const row = read.ok ? read.lists[0] : undefined;
    expect(row).toBeDefined();
    return toCloudList(row!);
  });
}

describe('the row under a full card', () => {
  it('draws no add-to-list control and no print control with no sign-in configured', () => {
    render(App, { env: at() });
    expect(
      screen.getByRole('heading', { level: 1, name: 'Спальный мешок' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Добавить в список' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Печать' })).toBeNull();
    expect(document.querySelector('.seldrop')).toBeNull();
  });

  it('draws the button folded, and the print control, with sign-in configured', async () => {
    render(App, { env: at({ cloud: fakeCloud(SEED) }) });
    expect(screen.getByRole('button', { name: 'Добавить в список' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    const print = screen.getByRole('button', { name: 'Печать' });
    expect(print).toHaveAttribute('title', 'Собрать карточки для печати: девять на лист A4');
    await waitFor(() => {
      expect(print).toBeEnabled();
    });
  });

  it('opens the menu newest list first, naming a single record "лежит в списках"', async () => {
    await openCard(TWO_LISTS);
    await openMenuOn('Лавка в порту');

    expect(screen.getByText('Лежит в списках')).toBeInTheDocument();
    const chips = screen.getAllByRole('button', { name: /Лавка в порту|Клад дракона/ });
    expect(chips.map((c) => c.textContent)).toEqual(['Лавка в порту', 'Клад дракона']);
    expect(screen.getByRole('button', { name: 'Добавить в список' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('adds on a chip press, ticks it, keeps the menu open, and toasts', async () => {
    const { cloud, page } = await openCard(TWO_LISTS);
    await openMenuOn('Лавка в порту');

    await userEvent.click(screen.getByRole('button', { name: 'Клад дракона' }));
    expect(screen.getByRole('button', { name: 'Клад дракона' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Добавить в список' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByText('Добавлено в «Клад дракона»')).toBeInTheDocument();
    expect((await readList(cloud, page, uuid(811)))?.ids).toEqual(['ci1']);
  });

  it('removes on a second press, toasts the removal, and undoes back into place with its meta (P5)', async () => {
    const inList = listOf(811, 'Клад дракона', [{ key: 'w1' }, { key: 'ci1', qty: 3 }], {
      createdAgoMs: 2 * DAY,
      editedAgoMs: 2 * DAY
    });
    const { cloud, page } = await openCard([inList, TWO_LISTS[1] as SeedList]);
    await openMenuOn('Лавка в порту');

    await userEvent.click(screen.getByRole('button', { name: 'Клад дракона' }));
    expect(screen.getByRole('button', { name: 'Клад дракона' })).toBeInTheDocument();
    expect(screen.getByText('Убрано из «Клад дракона»')).toBeInTheDocument();
    expect((await readList(cloud, page, uuid(811)))?.ids).toEqual(['w1']);

    await userEvent.click(screen.getByRole('button', { name: 'Вернуть' }));
    expect((await readList(cloud, page, uuid(811)))?.ids).toEqual(['w1', 'ci1']);
    expect((await readList(cloud, page, uuid(811)))?.meta).toEqual({ ci1: { qty: 3 } });
  });

  it('grows a search box past eight lists, and narrows by typing', async () => {
    await openCard(
      manyLists(
        821,
        Array.from({ length: 8 }, (_, i) => ({
          name: i === 3 ? 'Лавка у порта' : 'Список ' + String(i)
        }))
      )
    );
    await openMenuOn('Список 0');

    const search = screen.getByRole('searchbox', { name: 'Найти список' });
    await userEvent.type(search, 'порта');
    expect(screen.getByRole('button', { name: 'Лавка у порта' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Список 0' })).not.toBeInTheDocument();

    await userEvent.clear(search);
    await userEvent.type(search, 'zzz');
    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
  });

  it('draws no search box under eight lists', async () => {
    await openCard(TWO_LISTS);
    await openMenuOn('Лавка в порту');
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('opens the new-list form with focus, refuses a blank name, and creates a named one', async () => {
    const { cloud, page } = await openCard(TWO_LISTS);
    await openMenuOn('Лавка в порту');

    await userEvent.click(screen.getByRole('button', { name: '+ Новый список' }));
    const input = screen.getByPlaceholderText('Например: клад дракона');
    expect(input).toHaveFocus();

    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Сначала назовите список');

    await userEvent.type(input, 'Новый клад');
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));

    expect(screen.queryByPlaceholderText('Например: клад дракона')).not.toBeInTheDocument();
    expect((await listNamed(cloud, page, 'Новый клад')).ids).toEqual(['ci1']);
  });

  it('folds the new-list form on cancel', async () => {
    await openCard(TWO_LISTS);
    await openMenuOn('Лавка в порту');
    await userEvent.click(screen.getByRole('button', { name: '+ Новый список' }));
    await userEvent.click(screen.getByRole('button', { name: 'Отмена' }));
    expect(screen.queryByPlaceholderText('Например: клад дракона')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Новый список' })).toBeInTheDocument();
  });

  it('opens the new-list form under a real browser event ordering', async () => {
    /* jsdom's userEvent.click and parity's el.click() both dispatch on a
       non-empty call stack, so no microtask checkpoint runs between the app
       root's delegated handler and AddToList's own `<svelte:document
       onclick>` - Svelte 5's flush (a microtask) waits until the stack
       unwinds, so both layers see the menu still holding the pressed chip
       and pass regardless of the fix. A trusted click in a real browser runs
       a checkpoint after every listener; this test reproduces that ordering
       by flushing from a bubble listener planted between the two: it runs
       after the app root's handler (a descendant, so bubbles first) and
       before `document`'s (bubbles last). */
    const { container } = await openCard(TWO_LISTS);
    await openMenuOn('Лавка в порту');

    const onBubble = (): void => {
      flushSync();
    };
    document.body.addEventListener('click', onBubble);
    try {
      await userEvent.click(screen.getByRole('button', { name: '+ Новый список' }));
      expect(screen.getByPlaceholderText('Например: клад дракона')).toHaveFocus();
      expect(screen.getByText('Лежит в списках')).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Отмена' }));
      expect(screen.getByText('Лежит в списках')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '+ Новый список' })).toBeInTheDocument();
    } finally {
      document.body.removeEventListener('click', onBubble);
    }
    await expectNoA11yViolations(container);
  });

  it('closes on a click outside the control', async () => {
    await openCard(TWO_LISTS);
    await openMenuOn('Лавка в порту');
    expect(screen.getByText('Лежит в списках')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('heading', { level: 1 }));
    expect(screen.queryByText('Лежит в списках')).not.toBeInTheDocument();
  });
});

/** The same eight as account lists, newest first, with `ci1` in the same two. */
const EIGHT_LISTS: SeedList[] = manyLists(
  821,
  [
    'Сундук мага',
    'Рынок',
    'Порт Ветров',
    'Трофеи ёжа',
    'Кузнец',
    'Логово',
    'Храм Солнца',
    'Лавка в порту'
  ]
    .reverse()
    .map((name) => ({
      name,
      keys: name === 'Сундук мага' || name === 'Порт Ветров' ? ['ci1'] : []
    }))
);

const chipNames = (container: HTMLElement): string[] =>
  [...container.querySelectorAll('.pickchips .chip')].map((c) => c.textContent);

describe('many lists in the menu', () => {
  it('puts the lists holding the record first, newest first in each group', async () => {
    const { container } = await openCard(EIGHT_LISTS);
    await openMenuOn('Порт Ветров');
    expect(chipNames(container)).toEqual([
      'Порт Ветров',
      'Сундук мага',
      'Лавка в порту',
      'Храм Солнца',
      'Логово',
      'Кузнец',
      'Трофеи ёжа',
      'Рынок'
    ]);
  });

  it('keeps a pressed chip in its place until the menu opens again', async () => {
    const { container } = await openCard(EIGHT_LISTS);
    await openMenuOn('Порт Ветров');
    await userEvent.click(screen.getByRole('button', { name: 'Кузнец' }));
    await userEvent.click(screen.getByRole('button', { name: 'Порт Ветров' }));
    expect(chipNames(container)).toEqual([
      'Порт Ветров',
      'Сундук мага',
      'Лавка в порту',
      'Храм Солнца',
      'Логово',
      'Кузнец',
      'Трофеи ёжа',
      'Рынок'
    ]);

    await openMenu();
    await openMenu();
    expect(chipNames(container).slice(0, 3)).toEqual([
      'Кузнец',
      'Сундук мага',
      'Лавка в порту'
    ]);
  });

  it('finds a list with ё from a query typed with е', async () => {
    const { container } = await openCard(EIGHT_LISTS);
    await openMenuOn('Порт Ветров');
    await userEvent.type(screen.getByRole('searchbox', { name: 'Найти список' }), 'ежа');
    expect(chipNames(container)).toEqual(['Трофеи ёжа']);
  });

  it('scrolls the chips only: the search and the new-list chip sit outside them', async () => {
    const { container } = await openCard(EIGHT_LISTS);
    await openMenuOn('Порт Ветров');
    const chips = container.querySelector('.pickchips');
    expect(chips).not.toBeNull();
    expect(chips?.contains(screen.getByRole('searchbox', { name: 'Найти список' }))).toBe(
      false
    );
    expect(chips?.contains(screen.getByRole('button', { name: '+ Новый список' }))).toBe(false);
    expect(chips?.contains(screen.getByRole('button', { name: 'Рынок' }))).toBe(true);
  });

  it('starts the new-list form with the query, and a create clears the query', async () => {
    const { container, cloud, page } = await openCard(EIGHT_LISTS);
    await openMenuOn('Порт Ветров');
    await userEvent.type(screen.getByRole('searchbox', { name: 'Найти список' }), 'Сундук ');
    await userEvent.click(screen.getByRole('button', { name: '+ Новый список' }));

    const input = screen.getByPlaceholderText('Например: клад дракона');
    expect(input).toHaveValue('Сундук');
    expect(input).toHaveFocus();

    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));
    expect(screen.getByRole('searchbox', { name: 'Найти список' })).toHaveValue('');
    expect(await listNamed(cloud, page, 'Сундук')).toMatchObject({ ids: ['ci1'] });
    // a list created while the menu is open joins the lists holding the record
    expect(chipNames(container)[0]).toBe('Сундук');
  });
});

describe('accessibility', () => {
  it('has no axe violations with the menu open', async () => {
    const { container } = await openCard(TWO_LISTS);
    await openMenuOn('Лавка в порту');
    await expectNoA11yViolations(container);
  });

  it('has no axe violations with a chip ticked and the toast showing', async () => {
    const { container } = await openCard(TWO_LISTS);
    await openMenuOn('Лавка в порту');
    await userEvent.click(screen.getByRole('button', { name: 'Клад дракона' }));
    await expectNoA11yViolations(container);
  });

  it('has no axe violations with the new-list form open', async () => {
    const { container } = await openCard(TWO_LISTS);
    await openMenuOn('Лавка в порту');
    await userEvent.click(screen.getByRole('button', { name: '+ Новый список' }));
    await expectNoA11yViolations(container);
  });

  it('has no axe violations with eight lists, the search drawn and a query typed', async () => {
    const { container } = await openCard(EIGHT_LISTS);
    await openMenuOn('Порт Ветров');
    await userEvent.type(screen.getByRole('searchbox', { name: 'Найти список' }), 'порт');
    await expectNoA11yViolations(container);
  });
});

describe("a remove that waits for the list's entries", () => {
  const HOLDING = listOf(
    811,
    'Клад дракона',
    [{ key: 'w1' }, { key: 'ci1', qty: 3, note: 'Тёплый' }],
    {
      createdAgoMs: 2 * DAY,
      editedAgoMs: 2 * DAY
    }
  );
  /* Holds every `rows` call until `release()`; the fake answers them then. */
  function holdRows(cloud: CloudPort) {
    const real = cloud.lists.rows.bind(cloud.lists);
    const calls: (readonly string[])[] = [];
    let open: () => void = () => undefined;
    const gate = new Promise<void>((r) => {
      open = r;
    });
    cloud.lists.rows = async (ids) => {
      calls.push(ids);
      await gate;
      return real(ids);
    };
    return { calls, release: open };
  }

  it('draws the pressed chip busy while the read runs, ignores a second press, then removes with an undo of the read details', async () => {
    const { cloud, page, container } = await openCard([HOLDING, TWO_LISTS[1] as SeedList]);
    const held = holdRows(cloud);
    await openMenuOn('Лавка в порту');
    const chip = screen.getByRole('button', { name: 'Клад дракона' });
    await userEvent.click(chip);
    expect(chip).toHaveAttribute('aria-busy', 'true');
    expect(chip).toHaveAttribute('aria-disabled', 'true');
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    expect(chip).toHaveFocus();
    expect(screen.queryByText('Убрано из «Клад дракона»')).toBeNull();
    await expectNoA11yViolations(container);
    await userEvent.click(chip);
    expect(held.calls).toHaveLength(1);
    held.release();
    expect(await screen.findByText('Убрано из «Клад дракона»')).toBeInTheDocument();
    expect(chip).not.toHaveAttribute('aria-busy');
    expect((await readList(cloud, page, uuid(811)))?.ids).toEqual(['w1']);
    await userEvent.click(screen.getByRole('button', { name: 'Вернуть' }));
    const back = await readList(cloud, page, uuid(811));
    expect(back?.ids).toEqual(['w1', 'ci1']);
    expect(back?.meta).toEqual({ ci1: { qty: 3, note: 'Тёплый' } });
  });

  it('toasts a failed read, removes nothing, and leaves the chip pressed and not busy', async () => {
    const { cloud, page } = await openCard([HOLDING, TWO_LISTS[1] as SeedList]);
    const real = cloud.lists.rows.bind(cloud.lists);
    let fail = true;
    cloud.lists.rows = (ids) => (fail ? Promise.resolve({ ok: false }) : real(ids));
    await openMenuOn('Лавка в порту');
    const chip = screen.getByRole('button', { name: 'Клад дракона' });
    await userEvent.click(chip);
    expect(
      await screen.findByText('Не получилось загрузить списки аккаунта.')
    ).toBeInTheDocument();
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    expect(chip).not.toHaveAttribute('aria-busy');
    fail = false;
    expect((await readList(cloud, page, uuid(811)))?.ids).toEqual(['w1', 'ci1']);
  });

  it('still removes and toasts with «Вернуть» when the menu closes during the read', async () => {
    const { cloud, page } = await openCard([HOLDING, TWO_LISTS[1] as SeedList]);
    const held = holdRows(cloud);
    await openMenuOn('Лавка в порту');
    await userEvent.click(screen.getByRole('button', { name: 'Клад дракона' }));
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('button', { name: 'Клад дракона' })).toBeNull();
    held.release();
    expect(await screen.findByText('Убрано из «Клад дракона»')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Вернуть' })).toBeInTheDocument();
    expect((await readList(cloud, page, uuid(811)))?.ids).toEqual(['w1']);
  });

  it("removes the record the press named on the bar's menu after the ticks change during the read", async () => {
    const cloud = fakeCloud(seedWith({ gm4: [HOLDING] }), 'gm4');
    const page = fakePage();
    render(App, {
      env: fakeEnv({ router: memoryRouter('#/tables'), data: fakeData(LOOT), cloud, page })
    });
    await screen.findByRole('button', { name: 'Аккаунт: gm4@example.test' });
    const held = holdRows(cloud);
    const [row] = screen.getAllByRole('checkbox').filter((cb) => !cb.closest('.selall'));
    await userEvent.click(row as HTMLElement);
    await openMenuOn('Клад дракона');
    await userEvent.click(screen.getByRole('button', { name: 'Клад дракона' }));
    await userEvent.click(row as HTMLElement);
    held.release();
    expect(await screen.findByText('Убрано из «Клад дракона»')).toBeInTheDocument();
    expect((await readList(cloud, page, uuid(811)))?.ids).toEqual(['w1']);
  });
});

describe('with sign-in configured', () => {
  /* `page.fireHidden()` sends the account's write buffer at once, as a
     hidden tab does, so a test reads the fake without the 2 s wait. */
  const withCloud = (cloud: CloudPort, hash = '#/i/ci1') => {
    const router = memoryRouter(hash);
    const page = fakePage();
    const view = render(App, { env: fakeEnv({ router, data: fakeData(LOOT), cloud, page }) });
    return { ...view, router, page };
  };
  /* The header names the account once the session is in; the lists follow
     within the same turn. */
  const signedInAs = async (user: string): Promise<void> => {
    await screen.findByRole('button', { name: 'Аккаунт: ' + user + '@example.test' });
    await new Promise((r) => setTimeout(r, 0));
  };
  const signInThroughAccount = async (): Promise<void> => {
    await userEvent.click(screen.getByRole('button', { name: 'Войти' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Войти через Google' }));
  };

  it('puts the prompt in the new-list slot signed out, with no chip', async () => {
    const { container } = withCloud(fakeCloud(SEED));
    await screen.findByRole('link', { name: 'Войти' });
    await openMenu();
    await userEvent.click(screen.getByRole('button', { name: '+ Новый список' }));
    expect(screen.getByText('Войдите, чтобы создать список.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Войти' })).toHaveFocus();
    expect(screen.queryByPlaceholderText('Например: клад дракона')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Войти через/ })).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
    expect(chipNames(container)).toEqual([]);
    await userEvent.click(screen.getByRole('button', { name: 'Отмена' }));
    expect(screen.getByRole('button', { name: '+ Новый список' })).toBeInTheDocument();
  });

  it('opens on the create slot alone signed out: no label and no empty line, in both languages', async () => {
    for (const lang of ['ru', 'en'] as const) {
      const storage = memoryStorage({ 'dhloot.lang.v1': lang });
      const router = memoryRouter('#/i/ci1');
      const { container } = render(App, {
        env: fakeEnv({ router, data: fakeData(LOOT), cloud: fakeCloud(SEED), storage })
      });
      const signIn = lang === 'ru' ? 'Войти' : 'Sign in';
      await screen.findByRole('link', { name: signIn });
      await userEvent.click(
        screen.getByRole('button', {
          name: lang === 'ru' ? 'Добавить в список' : 'Add to list'
        })
      );
      const menu = container.querySelector('.dropmenu') as HTMLElement;
      expect(menu.querySelector('.lbl')).toBeNull();
      expect(menu.querySelector('.picker-none')).toBeNull();
      expect(
        within(menu)
          .getAllByRole('button')
          .map((b) => b.textContent)
      ).toEqual([lang === 'ru' ? '+ Новый список' : '+ New list']);
      await expectNoA11yViolations(container);
      cleanup();
    }
  });

  it('draws no new-list chip while the session is unknown', async () => {
    const cloud = fakeCloud(SEED);
    cloud.auth.session = () => new Promise(() => undefined);
    const { container } = withCloud(cloud);
    await openMenu();
    expect(screen.getByText('Лежит в списках')).toBeInTheDocument();
    expect(chipNames(container)).toEqual([]);
    expect(screen.queryByRole('button', { name: '+ Новый список' })).not.toBeInTheDocument();
  });

  it("returns to the record's page after sign-in, the menu open, the lists holding it first", async () => {
    const { container, router } = withCloud(fakeCloud(SEED));
    await screen.findByRole('link', { name: 'Войти' });
    await openMenu();
    await userEvent.click(screen.getByRole('button', { name: '+ Новый список' }));
    await signInThroughAccount();
    await waitFor(() => {
      expect(router.hash()).toBe('#/i/ci1');
    });
    await screen.findByRole('button', { name: 'Лавка кузнеца' });
    expect(chipNames(container)).toEqual(['Лавка кузнеца', 'Трофеи', 'Пустой список']);
    expect(screen.getByRole('button', { name: '+ Новый список' })).toBeInTheDocument();
  });

  it("returns to the table with the bar's rows ticked and its menu open", async () => {
    const { router } = withCloud(fakeCloud(SEED), '#/tables');
    await screen.findByRole('link', { name: 'Войти' });
    const [row] = screen.getAllByRole('checkbox').filter((cb) => !cb.closest('.selall'));
    await userEvent.click(row as HTMLElement);
    await openMenu();
    await userEvent.click(screen.getByRole('button', { name: '+ Новый список' }));
    await signInThroughAccount();
    await waitFor(() => {
      expect(router.hash()).toBe('#/tables');
    });
    expect(await screen.findByRole('button', { name: 'Трофеи' })).toBeInTheDocument();
    const ticked = screen.getAllByRole('checkbox').filter((cb) => !cb.closest('.selall'));
    expect(ticked[0]).toBeChecked();
  });

  it('returns from the record dialog to the record page', async () => {
    const { router } = withCloud(fakeCloud(SEED), '#/tables');
    await screen.findByRole('link', { name: 'Войти' });
    await userEvent.click(screen.getByRole('button', { name: /Спальный мешок/ }));
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Добавить в список' }));
    await userEvent.click(within(dialog).getByRole('button', { name: '+ Новый список' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Войти' }));
    expect(router.hash()).toBe('#/account');
    await userEvent.click(await screen.findByRole('button', { name: 'Войти через Google' }));
    await waitFor(() => {
      expect(router.hash()).toBe('#/i/ci1');
    });
    expect(await screen.findByRole('button', { name: 'Трофеи' })).toBeInTheDocument();
  });

  it('makes an account list signed in', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const { container, page } = withCloud(cloud);
    await signedInAs('gm2');
    await openMenu();
    expect(chipNames(container)).toEqual(['Список второго ГМа']);
    await userEvent.click(screen.getByRole('button', { name: '+ Новый список' }));
    await userEvent.type(screen.getByPlaceholderText('Например: клад дракона'), 'Тайник');
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));
    expect(screen.getByText('Добавлено в «Тайник»')).toBeInTheDocument();
    page.fireHidden();
    await waitFor(async () => {
      const read = await cloud.lists.list();
      const made = read.ok ? read.lists.find((l) => l.name === 'Тайник') : undefined;
      expect(made?.list_entries.map((e) => e.item_key)).toEqual(['ci1']);
    });
  });

  it('adds an own item to an account list as a link', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const HB = 'hb_ownitemaaaaaaaaa';
    await cloud.homebrew.createItem({
      id: '00000000-0000-4000-8000-000000000599',
      key: HB,
      book_id: null,
      content: { kind: 'item', ru: 'Своя вещь' }
    });
    const { page } = withCloud(cloud, '#/i/' + HB);
    await signedInAs('gm2');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Своя вещь' })
    ).toBeInTheDocument();
    await openMenu();
    await userEvent.click(screen.getByRole('button', { name: 'Список второго ГМа' }));
    expect(screen.getByText('Добавлено в «Список второго ГМа»')).toBeInTheDocument();
    page.fireHidden();
    await waitFor(async () => {
      const read = await cloud.lists.list();
      const l = read.ok ? read.lists.find((x) => x.name === 'Список второго ГМа') : undefined;
      expect(l?.list_entries.at(-1)).toMatchObject({
        item_key: HB,
        source: 'homebrew',
        hb_item: '00000000-0000-4000-8000-000000000599'
      });
    });
  });

  it("says the account's items still load, or failed to, and writes no frozen copy", async () => {
    for (const [answer, text] of [
      [
        new Promise(() => undefined),
        'Ваши предметы ещё загружаются - это может занять минуту. Повторите чуть позже.'
      ],
      [Promise.resolve({ ok: false }), 'Не получилось загрузить ваши предметы.']
    ] as const) {
      const cloud = fakeCloud(SEED, 'gm2');
      vi.spyOn(cloud.homebrew, 'load').mockReturnValue(answer as never);
      const apply = vi.spyOn(cloud.lists, 'apply');
      const { page, unmount } = withCloud(
        cloud,
        '#/lists/00000000-0000-4000-8000-000000000201'
      );
      await signedInAs('gm2');
      await userEvent.click(
        await screen.findByRole('button', { name: /^Топор Тлеющих Углей/ })
      );
      const dialog = screen.getByRole('dialog');
      await userEvent.click(within(dialog).getByRole('button', { name: 'Добавить в список' }));
      await userEvent.click(within(dialog).getByRole('button', { name: '+ Новый список' }));
      await userEvent.type(within(dialog).getByPlaceholderText('Например: клад дракона'), 'Т');
      await userEvent.click(within(dialog).getByRole('button', { name: 'Создать' }));
      expect(within(dialog).getByText(text)).toBeInTheDocument();
      page.fireHidden();
      await waitFor(() => {
        expect(apply).toHaveBeenCalled();
      });
      const sent = JSON.stringify(apply.mock.calls);
      expect(sent).not.toContain('hb_emberaxeaaaaaaaa');
      unmount();
    }
  });

  it("offers no chip while the account's lists are read", async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    cloud.lists.list = () => new Promise(() => undefined);
    const { container } = withCloud(cloud);
    await signedInAs('gm2');
    await openMenu();
    expect(chipNames(container)).toEqual([]);
  });

  it('adds to and removes from an account list, with an undo', async () => {
    const cloud = fakeCloud(SEED, 'gm2');
    const { page } = withCloud(cloud);
    await signedInAs('gm2');
    await openMenu();
    await userEvent.click(screen.getByRole('button', { name: 'Список второго ГМа' }));
    await userEvent.click(screen.getByRole('button', { name: 'Список второго ГМа' }));
    expect(screen.getByText('Убрано из «Список второго ГМа»')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Вернуть' }));
    await openMenu();
    expect(screen.getByRole('button', { name: 'Список второго ГМа' })).toBeInTheDocument();
    page.fireHidden();
    await waitFor(async () => {
      const read = await cloud.lists.list();
      const l = read.ok ? read.lists[0] : undefined;
      expect(l?.list_entries.map((e) => e.item_key)).toEqual([
        'q23',
        'hb_emberaxeaaaaaaaa',
        'ci1'
      ]);
    });
  });

  it('says the limit for a new list at the limit and keeps the form', async () => {
    const cloud = fakeCloud(SEED, 'gm2', { limits: { lists: 1 } });
    const { container } = withCloud(cloud);
    await signedInAs('gm2');
    await openMenu();
    await userEvent.click(screen.getByRole('button', { name: '+ Новый список' }));
    const input = screen.getByPlaceholderText('Например: клад дракона');
    await userEvent.type(input, 'Второй');
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));
    expect(
      screen.getByText(
        'Достигнут предел списков в аккаунте: 1. Нужно больше - напишите на daggerheart.loot@gmail.com.'
      )
    ).toBeInTheDocument();
    expect(input).toHaveValue('Второй');
    expect(chipNames(container)).not.toContain('Второй');
  });
});
