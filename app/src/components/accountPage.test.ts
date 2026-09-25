/* `#/account` over the fake cloud: the chooser signed out, the four
   sections signed in, and what every action says. docs/specs/FEATURES.md,
   "Account". */
import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import { fakeCloud, type FakeCloudOptions } from '../ports/fake-cloud.js';
import { SEED } from '../ports/fake-cloud-seed.js';
import { fakeEnv, memoryRouter, memoryStorage } from '../ports/index.js';
import type { AuthResult, CloudPort } from '../ports/index.js';
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
        'Войдите, чтобы ваши данные были доступны на всех устройствах. Всё остальное работает и без входа.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Войти через Google' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Войти через Discord' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'условия' })).toHaveAttribute(
      'href',
      'pages/terms.html'
    );
    expect(screen.getByRole('link', { name: 'политику конфиденциальности' })).toHaveAttribute(
      'href',
      'pages/privacy.html'
    );
    await expectNoA11yViolations(container);
  });

  it('links the English policies in English', async () => {
    const { container } = open(as(), 'en');
    expect(await screen.findByRole('button', { name: 'Sign in with Discord' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'terms' })).toHaveAttribute(
      'href',
      'pages/en/terms.html'
    );
    expect(screen.getByRole('link', { name: 'privacy policy' })).toHaveAttribute(
      'href',
      'pages/en/privacy.html'
    );
    await expectNoA11yViolations(container);
  });

  it('signs in with Google and becomes the account page of gm1', async () => {
    const { container } = open(as());
    await press('Войти через Google');
    expect(await screen.findByText('gm1@example.test', { selector: 'b' })).toBeInTheDocument();
    expect(screen.getByText('через Google')).toBeInTheDocument();
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
    expect(await screen.findByText('Не получилось. Попробуйте ещё раз.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Войти через Discord' })).toBeEnabled();
  });

  it('draws only the title until the session is known', async () => {
    const cloud = as();
    cloud.auth.session = () => new Promise(() => undefined);
    const { container } = open(cloud);
    expect(screen.getByRole('heading', { name: 'Аккаунт', level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Войти через/ })).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
  });
});

describe('signed in as gm1', () => {
  it('draws the four sections in order, with a Disconnect on each identity', async () => {
    const { container } = open(as('gm1'));
    await screen.findByRole('button', { name: 'Отключить Discord' });
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Вы вошли как',
      'Способы входа',
      'Выход',
      'Удаление аккаунта'
    ]);
    expect(screen.getByText('Способы входа, выход и ваши данные.')).toBeInTheDocument();
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
    expect(await screen.findByText('Не получилось. Попробуйте ещё раз.')).toBeInTheDocument();
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

  it('says so, and offers no Connect, when the providers cannot be read', async () => {
    const real = as('gm1');
    const { container } = open({
      ...real,
      auth: { ...real.auth, identities: () => Promise.resolve(null) }
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Не получилось. Попробуйте ещё раз.'
    );
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
    expect(await screen.findByText('Не получилось. Попробуйте ещё раз.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Выход' })).toBeInTheDocument();
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

  it('cancels, which folds the confirmation and forgets the word', async () => {
    open(as('gm1'));
    await press('Удалить аккаунт...');
    await userEvent.type(screen.getByRole('textbox'), 'удалить');
    await press('Отмена');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
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
    expect(await screen.findByText('Не получилось. Попробуйте ещё раз.')).toBeInTheDocument();
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
    expect(await screen.findByText('Не получилось. Попробуйте ещё раз.')).toBeInTheDocument();
  });

  it('draws in English', async () => {
    const { container } = open(as('gm2'), 'en');
    expect(await screen.findByRole('button', { name: 'Connect Discord' })).toBeVisible();
    await screen.findByText('not connected');
    expect(screen.getByText('Sign-in methods, signing out and your data.')).toBeInTheDocument();
    expect(screen.getByText('with Google')).toBeInTheDocument();
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
    expect(screen.queryByText(/через/)).not.toBeInTheDocument();
    expect(screen.queryByText(/единственный способ/)).not.toBeInTheDocument();
  });

  it('shows the provider alone when there is no email', async () => {
    const cloud = as('gm2');
    cloud.auth.session = () => Promise.resolve({ userId: 'u', email: '', provider: 'discord' });
    open(cloud);
    expect(await screen.findByText('через Discord')).toBeInTheDocument();
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
