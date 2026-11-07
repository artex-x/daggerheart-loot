/* `#/account` over the fake cloud: the chooser signed out, the five
   sections signed in, and what every action says. docs/specs/FEATURES.md,
   "Account". */
import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import AccountPage from './AccountPage.svelte';
import { fakeCloud, type FakeCloudOptions } from '../ports/fake-cloud.js';
import { SEED } from '../ports/fake-cloud-seed.js';
import { fakeEnv, fakeImage, fixedClock, memoryRouter, memoryStorage } from '../ports/index.js';
import type { AuthResult, CloudPort } from '../ports/index.js';
import { AppState } from '../state/app.svelte.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

function open(cloud: CloudPort, lang?: 'en') {
  return render(App, {
    env: fakeEnv({
      cloud,
      router: memoryRouter('#/account'),
      ...(lang ? { storage: memoryStorage({ 'dhloot.lang.v1': lang }) } : {})
    })
  });
}

const as = (user?: string, options?: FakeCloudOptions): CloudPort =>
  fakeCloud(SEED, user, options);

/* The page draws once the session and the identities have answered. */
const press = async (name: string): Promise<void> => {
  await userEvent.click(await screen.findByRole('button', { name }));
};

const rows = (): HTMLElement[] => within(screen.getByRole('list')).getAllByRole('listitem');

describe('signed out', () => {
  it('offers both providers and the terms it signs you up to', async () => {
    const { container } = open(as());
    expect(await screen.findByRole('heading', { name: 'Войти', level: 2 })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Войдите, чтобы данные были на всех устройствах. Остальное работает без входа.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Войти через Google' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Войти через Discord' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'условия' })).toHaveAttribute(
      'href',
      '/pages/terms.html'
    );
    expect(screen.getByRole('link', { name: 'политику конфиденциальности' })).toHaveAttribute(
      'href',
      '/pages/privacy.html'
    );
    await expectNoA11yViolations(container);
  });

  it('links the English policies in English', async () => {
    const { container } = open(as(), 'en');
    expect(await screen.findByRole('button', { name: 'Sign in with Discord' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'terms' })).toHaveAttribute(
      'href',
      '/pages/en/terms.html'
    );
    expect(screen.getByRole('link', { name: 'privacy policy' })).toHaveAttribute(
      'href',
      '/pages/en/privacy.html'
    );
    await expectNoA11yViolations(container);
  });

  it('signs in with Google and becomes the account page of gm1, Google marked current', async () => {
    const { container } = open(as());
    await press('Войти через Google');
    await screen.findByRole('button', { name: 'Отключить Discord' });
    expect(within(rows()[0]!).getByText('gm1@example.test')).toBeInTheDocument();
    expect(within(rows()[0]!).getByText('Сейчас')).toBeInTheDocument();
    expect(within(rows()[1]!).queryByText('Сейчас')).toBeNull();
    expect(screen.queryByText('через Google')).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('hands the prompt that led here to the sign-in, and returns to its page', async () => {
    const cloud = as();
    const signIn = vi.spyOn(cloud.auth, 'signIn');
    const router = memoryRouter('#/lists');
    render(App, { env: fakeEnv({ cloud, router }) });
    await userEvent.click(await screen.findByRole('button', { name: 'Войти' }));
    expect(router.hash()).toBe('#/account');
    await press('Войти через Google');
    expect(signIn).toHaveBeenCalledWith('google', { hash: '#/lists' });
    await waitFor(() => {
      expect(router.hash()).toBe('#/lists');
    });
  });

  it('shows where it is going while the redirect starts', async () => {
    const cloud = as();
    let answer: (r: AuthResult) => void = () => undefined;
    cloud.auth.signIn = vi.fn(
      () =>
        new Promise<AuthResult>((r) => {
          answer = r;
        })
    );
    const { container } = open(cloud);
    await press('Войти через Discord');
    expect(screen.getByRole('button', { name: 'Переходим в Discord...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Войти через Google' })).toBeDisabled();
    await expectNoA11yViolations(container);
    answer({ ok: false, error: 'failed' });
    expect(
      await screen.findByText('Не получилось. Проверьте соединение и попробуйте ещё раз.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Войти через Discord' })).toBeEnabled();
  });

  it('draws the title and the loading line until the session is known', async () => {
    const cloud = as();
    cloud.auth.session = () => new Promise(() => undefined);
    const { container } = open(cloud);
    expect(screen.getByRole('heading', { name: 'Аккаунт', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Загружаем...')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Войти через/ })).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
  });
});

describe('signed in as gm1', () => {
  it('draws the five sections in two columns of the page order, with a Disconnect on each identity', async () => {
    const { container } = open(as('gm1'));
    await screen.findByRole('button', { name: 'Отключить Discord' });
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Отображение на всех устройствах',
      'Способы входа',
      'Ваши данные',
      'Выход',
      'Удаление аккаунта'
    ]);
    const colA = container.querySelector('.acc > .colA') as HTMLElement;
    const colB = container.querySelector('.acc > .colB') as HTMLElement;
    expect(colA.nextElementSibling).toBe(colB);
    expect(within(colA).getAllByRole('heading', { level: 2 })).toHaveLength(2);
    expect(within(colB).getAllByRole('heading', { level: 2 })).toHaveLength(3);
    expect(colA.querySelector('[data-primary]')).not.toBeNull();
    expect(container.querySelector('input[type="checkbox"]')).toBeNull();
    expect(screen.queryByText(/завершает вход/)).toBeNull();
    expect(container.querySelector('.page-sub')?.textContent).toBe('');
    expect(rows()).toHaveLength(2);
    expect(within(rows()[1]!).getByText('gm1.discord@example.test')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Отключить Google' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('disconnects Discord, which leaves Google alone and says why it stays', async () => {
    const { container } = open(as('gm1'));
    await press('Отключить Discord');
    expect(
      await screen.findByRole('button', { name: 'Подключить Discord' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Отключить/ })).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'Google - единственный способ входа, поэтому его нельзя отключить. Подключите второй, чтобы отключить этот.'
      )
    ).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('toasts a refused disconnect', async () => {
    const cloud = as('gm1');
    cloud.auth.unlink = () => Promise.resolve({ ok: false, error: 'failed' });
    open(cloud);
    await press('Отключить Discord');
    expect(
      await screen.findByText('Не получилось. Проверьте соединение и попробуйте ещё раз.')
    ).toBeInTheDocument();
    expect(rows()).toHaveLength(2);
  });

  it('signs out, back to the chooser with a toast', async () => {
    const { container } = open(as('gm1'));
    await press('Выйти');
    expect(await screen.findByRole('button', { name: 'Войти через Google' })).toBeVisible();
    expect(screen.getByText('Вы вышли из аккаунта.')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('signs out everywhere with the global scope', async () => {
    const cloud = as('gm1');
    const signOut = vi.spyOn(cloud.auth, 'signOut');
    open(cloud);
    await press('Выйти на всех устройствах');
    expect(signOut).toHaveBeenCalledWith('global');
    expect(await screen.findByText('Вы вышли из аккаунта.')).toBeInTheDocument();
  });

  it("signs out through the app, which sends the account's buffered writes first", async () => {
    const signOut = vi.spyOn(AppState.prototype, 'signOut');
    try {
      open(as('gm1'));
      await press('Выйти');
      expect(signOut).toHaveBeenCalledWith('local');
      expect(await screen.findByText('Вы вышли из аккаунта.')).toBeInTheDocument();
    } finally {
      signOut.mockRestore();
    }
  });

  it('says so, and offers no Connect, when the providers cannot be read', async () => {
    const real = as('gm1');
    const { container } = open({
      ...real,
      auth: { ...real.auth, identities: () => Promise.resolve(null) }
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Не получилось. Проверьте соединение и попробуйте ещё раз.'
    );
    expect(screen.getByText('через Google')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Подключить/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Выйти' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Удалить аккаунт...' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('toasts a refused sign-out and stays signed in', async () => {
    const cloud = as('gm1');
    cloud.auth.signOut = () => Promise.resolve({ ok: false, error: 'failed' });
    open(cloud);
    await press('Выйти');
    expect(
      await screen.findByText('Не получилось. Проверьте соединение и попробуйте ещё раз.')
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Выход' })).toBeInTheDocument();
  });
});

describe('your data', () => {
  /* 2026-10-01 12:00 UTC, the test build's clock. */
  const NOW = Date.UTC(2026, 9, 1, 12);
  const day = (ms: number): string => {
    const d = new Date(ms);
    return [d.getFullYear(), d.getMonth() + 1, d.getDate()]
      .map((n) => String(n).padStart(2, '0'))
      .join('-');
  };

  it('downloads the account data zip from its panel', async () => {
    const image = fakeImage();
    const { container } = render(App, {
      env: fakeEnv({
        cloud: as('gm1'),
        router: memoryRouter('#/account'),
        clock: fixedClock(NOW),
        image
      })
    });
    const button = await screen.findByRole('button', { name: 'Скачать мои данные (ZIP)' });
    await waitFor(() => {
      expect(button).toBeEnabled();
    });
    expect(screen.getByText('Списки и свои предметы одним архивом ZIP.')).toBeInTheDocument();
    await userEvent.click(button);
    await waitFor(() => {
      expect(image.downloaded.map((d) => d.filename)).toEqual([
        `daggerheart-loot-data-${day(NOW)}.zip`
      ]);
    });
    expect(image.downloaded[0]?.blob.type).toBe('application/zip');
    await expectNoA11yViolations(container);
  });

  it('says the archive holds no pictures only to an account with a picture', async () => {
    const zipNoArt = 'Картинок в архиве нет: после переноса добавьте их заново.';
    const one = open(as('gm1'));
    expect(await screen.findByText(zipNoArt)).toBeInTheDocument();
    await expectNoA11yViolations(one.container);
    await userEvent.click(screen.getAllByRole('button', { name: 'EN' })[0]!);
    expect(
      await screen.findByText('The archive holds no pictures: add them again after the move.')
    ).toBeInTheDocument();
    cleanup();
    open(as('gm2'));
    await screen.findByRole('button', { name: 'Скачать мои данные (ZIP)' });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Скачать мои данные (ZIP)' })).toBeEnabled();
    });
    expect(screen.queryByText(zipNoArt)).toBeNull();
  });

  it('is disabled while the lists load', async () => {
    const cloud = as('gm1');
    cloud.lists.list = () => new Promise(() => undefined);
    const { container } = open(cloud);
    expect(
      await screen.findByRole('button', { name: 'Скачать мои данные (ZIP)' })
    ).toBeDisabled();
    expect(screen.queryByRole('alert')).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('says a failed read, and «Повторить» reads again', async () => {
    const cloud = fakeCloud(SEED, 'gm1', { offline: true });
    const { container } = open(cloud);
    expect(await screen.findByText('Не получилось загрузить списки аккаунта.')).toHaveAttribute(
      'role',
      'alert'
    );
    expect(screen.getByRole('button', { name: 'Скачать мои данные (ZIP)' })).toBeDisabled();
    await expectNoA11yViolations(container);
    cloud.setOffline(false);
    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Скачать мои данные (ZIP)' })).toBeEnabled();
    });
    expect(screen.queryByText('Не получилось загрузить списки аккаунта.')).toBeNull();
  });
});

describe('deleting the account', () => {
  it('asks for the word, trimmed and in any case, then deletes', async () => {
    const { container } = open(as('gm1'));
    await press('Удалить аккаунт...');
    expect(screen.getByRole('button', { name: 'Удалить аккаунт...' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    const box = screen.getByRole('textbox', {
      name: 'Чтобы подтвердить, введите слово удалить'
    });
    expect(box).toHaveFocus();
    const final = screen.getByRole('button', { name: 'Удалить навсегда' });
    expect(final).toBeDisabled();
    expect(final).toHaveClass('danger-fill');
    expect(screen.getByText('Будут удалены:')).toBeInTheDocument();
    await userEvent.type(box, 'удали');
    expect(final).toBeDisabled();
    await expectNoA11yViolations(container);
    await userEvent.clear(box);
    await userEvent.type(box, ' УДАЛИТЬ ');
    expect(final).toBeEnabled();
    await userEvent.click(final);
    expect(await screen.findByRole('button', { name: 'Войти через Google' })).toBeVisible();
    expect(screen.getByText('Аккаунт удалён.')).toBeInTheDocument();
  });

  it('cancels, which folds the confirmation, forgets the word and returns the focus', async () => {
    open(as('gm1'));
    await press('Удалить аккаунт...');
    await userEvent.type(screen.getByRole('textbox'), 'удалить');
    await press('Отмена');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Удалить аккаунт...' })).toHaveFocus();
    await press('Удалить аккаунт...');
    expect(screen.getByRole('textbox')).toHaveValue('');
    await press('Удалить аккаунт...');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('toasts a refusal and keeps the confirmation open', async () => {
    const cloud = as('gm1');
    cloud.auth.deleteAccount = () => Promise.resolve({ ok: false, error: 'failed' });
    open(cloud);
    await press('Удалить аккаунт...');
    await userEvent.type(screen.getByRole('textbox'), 'удалить');
    await press('Удалить навсегда');
    expect(
      await screen.findByText('Не получилось. Проверьте соединение и попробуйте ещё раз.')
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});

describe('signed in as gm2', () => {
  it('has one identity, no Disconnect, the hint and Connect Discord', async () => {
    const { container } = open(as('gm2'));
    expect(await screen.findByRole('button', { name: 'Подключить Discord' })).toBeVisible();
    expect(screen.queryByRole('button', { name: /Отключить/ })).not.toBeInTheDocument();
    expect(await screen.findByText(/Google - единственный способ входа/)).toBeInTheDocument();
    expect(within(rows()[1]!).getByText('не подключён')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('connects Discord, calling link with it', async () => {
    const cloud = as('gm2');
    const link = vi.spyOn(cloud.auth, 'link');
    open(cloud);
    await press('Подключить Discord');
    expect(link).toHaveBeenCalledWith('discord');
    expect(await screen.findByRole('button', { name: 'Отключить Discord' })).toBeVisible();
  });

  it('shows where Connect is going while the redirect starts', async () => {
    const cloud = as('gm2');
    cloud.auth.link = () => new Promise(() => undefined);
    open(cloud);
    await press('Подключить Discord');
    expect(screen.getByRole('button', { name: 'Переходим в Discord...' })).toBeDisabled();
  });

  it('says in the Discord row when the account belongs to someone else', async () => {
    const { container } = open(as('gm2', { linkError: 'alreadyLinked' }));
    await press('Подключить Discord');
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Этот аккаунт Discord уже подключён к другому пользователю.'
    );
    expect(rows()[1]).toContainElement(alert);
    expect(screen.getByRole('button', { name: 'Подключить Discord' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Выход' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
    await press('Выйти');
    expect(screen.queryByText(/уже подключён/)).not.toBeInTheDocument();
  });

  it('says so on arrival from a refused link redirect', async () => {
    open(
      as('gm2', {
        returned: {
          kind: 'link',
          provider: 'discord',
          result: { ok: false, error: 'alreadyLinked' },
          action: null
        }
      })
    );
    const alert = await screen.findByText(
      'Этот аккаунт Discord уже подключён к другому пользователю.'
    );
    expect(alert).toHaveAttribute('role', 'alert');
  });

  it('toasts any other refused link', async () => {
    open(as('gm2', { linkError: 'failed' }));
    await press('Подключить Discord');
    expect(
      await screen.findByText('Не получилось. Проверьте соединение и попробуйте ещё раз.')
    ).toBeInTheDocument();
  });

  it('draws in English', async () => {
    const { container } = open(as('gm2'), 'en');
    expect(await screen.findByRole('button', { name: 'Connect Discord' })).toBeVisible();
    await screen.findByText('not connected');
    expect(container.querySelector('.page-sub')?.textContent).toBe('');
    expect(
      screen.getByRole('heading', { name: 'Display on all your devices', level: 2 })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Section on start')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Default table view' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Print color' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Card size' })).toBeInTheDocument();
    const notify = screen.getByLabelText<HTMLSelectElement>(
      "When I take from someone else's list"
    );
    expect([...notify.options].map((o) => o.textContent)).toEqual([
      'Ask',
      'Notify the owner',
      "Don't notify"
    ]);
    expect(notify).not.toHaveAttribute('aria-describedby');
    expect(within(rows()[0]!).getByText('Current')).toBeInTheDocument();
    expect(screen.getByText('Your lists and items in one ZIP archive.')).toBeInTheDocument();
    expect(screen.getByText('not connected')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Google is your only sign-in method, so it cannot be disconnected. Connect another one first.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out everywhere' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Delete account...' })).toBeVisible();
    await expectNoA11yViolations(container);
  });
});

describe('an account with no Google or Discord identity', () => {
  it('shows the email alone and offers both providers', async () => {
    const cloud = as('gm2');
    cloud.auth.session = () =>
      Promise.resolve({ userId: 'u', email: 'e2e@example.test', provider: null });
    cloud.auth.identities = () => Promise.resolve([]);
    open(cloud);
    expect(await screen.findByRole('button', { name: 'Подключить Google' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Подключить Discord' })).toBeVisible();
    expect(screen.getByText('e2e@example.test', { selector: 'b' })).toBeInTheDocument();
    expect(screen.queryByText(/через/)).not.toBeInTheDocument();
    expect(screen.queryByText(/единственный способ/)).not.toBeInTheDocument();
  });

  it('marks no row current when the session names no provider', async () => {
    const cloud = as('gm2');
    cloud.auth.session = () => Promise.resolve({ userId: 'u', email: '', provider: null });
    open(cloud);
    await screen.findByRole('button', { name: 'Подключить Discord' });
    expect(screen.queryByText('Сейчас')).toBeNull();
  });

  it('says who is signed in, the provider beside the email, while the identities are unread', async () => {
    const cloud = as('gm1');
    cloud.auth.identities = () => new Promise(() => undefined);
    const { container } = open(cloud);
    expect(await screen.findByText('gm1@example.test', { selector: 'b' })).toBeInTheDocument();
    expect(screen.getByText('через Google')).toBeInTheDocument();
    expect(screen.queryByRole('list')).toBeNull();
    await expectNoA11yViolations(container);
  });
});

describe('a stale answer', () => {
  it('drops the identities of a user who has since signed out', async () => {
    const cloud = as('gm1');
    let answer: (v: Awaited<ReturnType<CloudPort['auth']['identities']>>) => void = () =>
      undefined;
    cloud.auth.identities = () =>
      new Promise((r) => {
        answer = r;
      });
    open(cloud);
    await screen.findByRole('heading', { name: 'Способы входа' });
    await press('Выйти');
    await screen.findByRole('button', { name: 'Войти через Google' });
    answer([{ id: 'x', provider: 'google', email: 'gm1@example.test' }]);
    await waitFor(() => {
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });
  });
});

describe('the Display section', () => {
  const HOME_KEY = 'dhloot.home.v1';
  const PREFS_KEY = 'dhloot.prefs.v1';

  function openWith(cloud: CloudPort, initial: Record<string, string> = {}) {
    const storage = memoryStorage(initial);
    const view = render(App, {
      env: fakeEnv({ cloud, router: memoryRouter('#/account'), storage })
    });
    return { ...view, storage };
  }

  const scopeOf = (el: HTMLElement) => within(el);
  type Scope = ReturnType<typeof scopeOf>;

  const section = async (name = 'Отображение на всех устройствах'): Promise<Scope> =>
    scopeOf((await screen.findByRole('heading', { name, level: 2 })).parentElement!);

  const pressed = (scope: Scope, group: string): string | undefined =>
    within(scope.getByRole('group', { name: group }))
      .getAllByRole('button')
      .find((b) => b.getAttribute('aria-pressed') === 'true')?.textContent ?? undefined;

  it('reads every current value and writes each one to this browser and the row', async () => {
    const cloud = as('gm1');
    const { container, storage } = openWith(cloud);
    const d = await section();
    /* gm1's row: grid, black and white, compact. */
    await waitFor(() => {
      expect(pressed(d, 'Вид таблиц по умолчанию')).toBe('Сетка');
    });
    expect(pressed(d, 'Язык')).toBe('RU');
    /* Two named rows, the group names of the `/p/` toolbar. */
    expect(pressed(d, 'Цвет печати')).toBe('Ч/б');
    expect(pressed(d, 'Размер карты')).toBe('44×63');
    const ink = d.getByRole('group', { name: 'Цвет печати' }).closest('.set');
    const size = d.getByRole('group', { name: 'Размер карты' }).closest('.set');
    expect(ink).not.toBe(size);
    expect(ink?.querySelector('.setname')).toHaveTextContent('Цвет печати');
    expect(size?.querySelector('.setname')).toHaveTextContent('Размер карты');
    await expectNoA11yViolations(container);
    for (const g of ['Язык', 'Вид таблиц по умолчанию', 'Цвет печати', 'Размер карты']) {
      expect(d.getByRole('group', { name: g })).toHaveClass('neutral');
    }
    const notify = d.getByLabelText<HTMLSelectElement>('Когда беру из чужого списка');
    expect(notify.selectedOptions[0]?.textContent).toBe('Спрашивать');
    expect([...notify.options].map((o) => o.textContent)).toEqual([
      'Спрашивать',
      'Сообщать владельцу',
      'Не сообщать'
    ]);
    expect(notify).not.toHaveAttribute('aria-describedby');
    expect(d.queryByRole('checkbox')).toBeNull();
    const select = d.getByLabelText<HTMLSelectElement>('Раздел при запуске');
    expect(select.value).toBe('#/roll/std');
    expect([...select.options].map((o) => o.textContent)).toHaveLength(13);
    expect(select.options[12]).toHaveTextContent('Мои предметы');
    expect(select.options[12]).toHaveValue('#/homebrew');
    await expectNoA11yViolations(container);

    await userEvent.selectOptions(select, 'Поиск');
    expect(storage.get(HOME_KEY)).toBe('#/search');
    await userEvent.click(d.getByRole('button', { name: 'Список' }));
    await userEvent.click(d.getByRole('button', { name: 'Цвет' }));
    await userEvent.click(d.getByRole('button', { name: '63×88' }));
    expect(storage.get(PREFS_KEY)).toBe('{"view":"list","printBw":false,"printCompact":false}');
    await userEvent.selectOptions(notify, 'always');
    expect(notify.value).toBe('always');
    await userEvent.click(d.getByRole('button', { name: 'EN' }));
    expect(storage.get('dhloot.lang.v1')).toBe('en');
    await waitFor(async () => {
      expect(await cloud.prefs.load()).toEqual({
        ok: true,
        prefs: {
          lang: 'en',
          home: '#/search',
          view: 'list',
          printBw: false,
          printCompact: false,
          notifyGm: 'always'
        }
      });
    });
    expect(storage.get(PREFS_KEY)).not.toContain('notifyGm');
    await expectNoA11yViolations(container);
  });

  it('opens with no lead line and no hint, in either language', async () => {
    openWith(as('gm1'));
    const heading = await screen.findByRole('heading', {
      name: 'Отображение на всех устройствах',
      level: 2
    });
    expect(heading.parentElement?.querySelector('p')).toBeNull();
    cleanup();
    /* gm2 has no row, so the stored English stays. */
    open(as('gm2'), 'en');
    const en = await screen.findByRole('heading', {
      name: 'Display on all your devices',
      level: 2
    });
    expect(en.parentElement?.querySelector('p')).toBeNull();
    expect(screen.queryByText(/kept only until the page reloads/)).toBeNull();
  });

  it("drops a page's print pick when the default is set here", async () => {
    /* A switch differs from its default for this visit. */
    const changed = (a: AppState): boolean =>
      a.shownPrintBW !== a.printBW || a.shownPrintCompact !== a.printCompact;
    const app = new AppState(
      fakeEnv({ cloud: as('gm2'), router: memoryRouter('#/account'), storage: memoryStorage() })
    );
    app.start();
    app.showPrintBW(true);
    expect(changed(app)).toBe(true);
    render(AccountPage, { app });
    const d = await section();
    await userEvent.click(d.getByRole('button', { name: 'Ч/б' }));
    await userEvent.click(d.getByRole('button', { name: 'Цвет' }));
    expect(app.shownPrintBW).toBe(false);
    expect(changed(app)).toBe(false);
    app.stop();
  });

  it('shows a pinned table as Tables and keeps its address until another is chosen', async () => {
    const { storage } = openWith(as('gm2'), { [HOME_KEY]: '#/tables/dread' });
    const d = await section();
    const select = d.getByLabelText<HTMLSelectElement>('Раздел при запуске');
    expect(select.value).toBe('#/tables/core_item');
    expect(select.selectedOptions[0]?.textContent).toBe('Таблицы');
    expect(storage.get(HOME_KEY)).toBe('#/tables/dread');
    await userEvent.selectOptions(select, 'Предметы сообществ');
    expect(storage.get(HOME_KEY)).toBe('#/roll/community_items');
    await userEvent.selectOptions(select, 'Обычные правила');
    expect(storage.get(HOME_KEY)).toBeNull();
  });

  it('pins the named table a bare Tables address opens on, never the bare address', async () => {
    const { storage } = openWith(as('gm2'));
    const d = await section();
    const select = d.getByLabelText<HTMLSelectElement>('Раздел при запуске');
    expect(select.value).toBe('#/roll/std');
    await userEvent.selectOptions(select, 'Таблицы');
    expect(storage.get(HOME_KEY)).toBe('#/tables/core_item');
    expect(select.selectedOptions[0]?.textContent).toBe('Таблицы');
  });

  it('offers «Мои предметы» last, selected for a #/homebrew pin, and pins it', async () => {
    const { storage } = openWith(as('gm2'), { [HOME_KEY]: '#/homebrew' });
    const select = (await section()).getByLabelText<HTMLSelectElement>('Раздел при запуске');
    expect(select.value).toBe('#/homebrew');
    expect(select.selectedOptions[0]?.textContent).toBe('Мои предметы');
    await userEvent.selectOptions(select, 'Поиск');
    expect(storage.get(HOME_KEY)).toBe('#/search');
    await userEvent.selectOptions(select, 'Мои предметы');
    expect(storage.get(HOME_KEY)).toBe('#/homebrew');
  });

  it('shows an older bare Tables pin and an old section name as their sections', async () => {
    openWith(as('gm2'), { [HOME_KEY]: '#/tables' });
    let select = (await section()).getByLabelText<HTMLSelectElement>('Раздел при запуске');
    expect(select.selectedOptions[0]?.textContent).toBe('Таблицы');
    cleanup();
    openWith(as('gm2'), { [HOME_KEY]: '#/roll/core' });
    select = (await section()).getByLabelText<HTMLSelectElement>('Раздел при запуске');
    expect(select.selectedOptions[0]?.textContent).toBe('Обычные правила');
  });

  it('says a refused starting section and shows the section it kept', async () => {
    const setHome = vi.spyOn(AppState.prototype, 'setHome').mockReturnValue(false);
    try {
      openWith(as('gm2'));
      const d = await section();
      const select = d.getByLabelText<HTMLSelectElement>('Раздел при запуске');
      await userEvent.selectOptions(select, 'Поиск');
      expect(setHome).toHaveBeenCalledWith('#/search');
      expect(await screen.findByRole('alert')).toHaveTextContent(/Не удалось сохранить/);
      expect(select.value).toBe('#/roll/std');
    } finally {
      setHome.mockRestore();
    }
  });

  it('is not drawn signed out, nor while the session is unknown', async () => {
    open(as());
    await screen.findByRole('button', { name: 'Войти через Google' });
    expect(screen.queryByRole('heading', { name: /Отображение/ })).not.toBeInTheDocument();
    cleanup();
    const cloud = as('gm1');
    cloud.auth.session = () => new Promise(() => undefined);
    open(cloud);
    expect(screen.getByRole('heading', { name: 'Аккаунт', level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Отображение/ })).not.toBeInTheDocument();
  });

  it('keeps its controls working while an account action is under way', async () => {
    const cloud = as('gm1');
    cloud.auth.signOut = () => new Promise(() => undefined);
    const { storage } = openWith(cloud);
    const d = await section();
    await press('Выйти');
    expect(screen.getByRole('button', { name: 'Выйти на всех устройствах' })).toBeDisabled();
    const select = d.getByLabelText<HTMLSelectElement>('Раздел при запуске');
    expect(select).toBeEnabled();
    await userEvent.selectOptions(select, 'Поиск');
    expect(storage.get(HOME_KEY)).toBe('#/search');
    const notify = d.getByLabelText<HTMLSelectElement>('Когда беру из чужого списка');
    await userEvent.selectOptions(notify, 'never');
    expect(notify.selectedOptions[0]?.textContent).toBe('Не сообщать');
    await waitFor(async () => {
      const read = await cloud.prefs.load();
      expect(read.ok && read.prefs?.notifyGm).toBe('never');
    });
  });
});

describe('what the delete confirm lists', () => {
  const goes = (): string[] =>
    [...document.querySelectorAll('ul.goes li')].map((li) => li.textContent);

  it('lists the counts the page read, a zero left out, then the fixed line', async () => {
    const { container } = open(as('gm1'));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Скачать мои данные (ZIP)' })).toBeEnabled();
    });
    await screen.findByText('Картинок в архиве нет: после переноса добавьте их заново.');
    await press('Удалить аккаунт...');
    const lines = goes();
    expect(lines.at(-1)).toBe('Ссылки на списки и запросы на покупку.');
    expect(lines[0]).toMatch(/^\d+ спис/);
    expect(lines[1]).toMatch(/^\d+ предмет/);
    expect(lines.join(' ')).not.toMatch(/(^|\D)0 /);
    await expectNoA11yViolations(container);
  });

  it('draws no count it never read', async () => {
    const cloud = as('gm2');
    cloud.lists.list = () => new Promise(() => undefined);
    open(cloud);
    await press('Удалить аккаунт...');
    expect(goes()).toEqual(['Ссылки на списки и запросы на покупку.']);
  });
});

describe('the account delete while it runs', () => {
  it('reads «Удаляем...» and is disabled until the answer, then the label returns', async () => {
    for (const [lang, open1, word, final, busy] of [
      ['ru', 'Удалить аккаунт...', 'удалить', 'Удалить навсегда', 'Удаляем...'],
      ['en', 'Delete account...', 'delete', 'Delete for good', 'Deleting...']
    ] as const) {
      /* gm2 keeps no stored language, so the page draws the one of this browser. */
      const cloud = as('gm2');
      let answer: (r: AuthResult) => void = () => undefined;
      cloud.auth.deleteAccount = () =>
        new Promise((r) => {
          answer = r;
        });
      open(cloud, lang === 'en' ? 'en' : undefined);
      await press(open1);
      await userEvent.type(screen.getByRole('textbox'), word);
      await press(final);
      const running = screen.getByRole('button', { name: busy });
      expect(running).toBeDisabled();
      answer({ ok: false, error: 'failed' });
      expect(await screen.findByRole('button', { name: final })).toBeEnabled();
      expect(screen.getByRole('textbox')).toHaveValue(word);
      cleanup();
    }
  });
});

describe('the start-section option of the lists', () => {
  const optionOf = async (lang?: 'en'): Promise<string> => {
    render(App, {
      env: fakeEnv({
        cloud: as('gm1'),
        router: memoryRouter('#/account'),
        ...(lang ? { storage: memoryStorage({ 'dhloot.lang.v1': lang }) } : {})
      })
    });
    const select = await screen.findByLabelText<HTMLSelectElement>(
      lang ? 'Section on start' : 'Раздел при запуске'
    );
    const text = select.querySelector('option[value="#/lists"]')?.textContent ?? '';
    cleanup();
    return text;
  };

  it('reads «Мои списки» and "My lists"', async () => {
    expect(await optionOf()).toBe('Мои списки');
    expect(await optionOf('en')).toBe('My lists');
  });
});
