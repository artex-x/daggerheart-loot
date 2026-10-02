/* The signed-in header control's menu over the fake cloud: its items, its
   keys, and every way it closes. docs/specs/FEATURES.md, "Chrome". */
import { cleanup, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import AccountMenu from './AccountMenu.svelte';
import { fakeCloud } from '../ports/fake-cloud.js';
import { SEED } from '../ports/fake-cloud-seed.js';
import { fakeEnv, memoryRouter, memoryStorage } from '../ports/index.js';
import type { CloudPort } from '../ports/index.js';
import { AppState } from '../state/app.svelte.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

const CONTROL = 'Аккаунт: gm1@example.test';

function signedIn(cloud: CloudPort = fakeCloud(SEED, 'gm1')) {
  return render(App, { env: fakeEnv({ cloud, router: memoryRouter('#/roll/std') }) });
}

async function openMenu(): Promise<HTMLElement> {
  await userEvent.click(await screen.findByRole('button', { name: CONTROL }));
  return screen.getByRole('menu', { name: 'Меню аккаунта' });
}

const items = (): HTMLElement[] => screen.getAllByRole('menuitem');

describe('the account menu', () => {
  it('holds «Аккаунт», «Мои списки», «Мои предметы» and «Выйти» in that order, the first focused', async () => {
    const { container } = signedIn();
    const menu = await openMenu();
    expect(items().map((i) => i.textContent)).toEqual([
      'Аккаунт',
      'Мои списки',
      'Мои предметы',
      'Выйти'
    ]);
    expect(items()[0]).toHaveAttribute('href', '#/account');
    expect(items()[1]).toHaveAttribute('href', '#/lists');
    expect(items()[2]).toHaveAttribute('href', '#/homebrew');
    expect(items()[3]?.tagName).toBe('BUTTON');
    expect(items().every((i) => i.getAttribute('tabindex') === '-1')).toBe(true);
    expect(menu).toHaveClass('acctmenu');
    expect(menu).not.toHaveClass('dropmenu');
    await waitFor(() => {
      expect(items()[0]).toHaveFocus();
    });
    await expectNoA11yViolations(container);
  });

  it('moves with Down, Up, Home and End, and wraps around', async () => {
    signedIn();
    await openMenu();
    await waitFor(() => {
      expect(items()[0]).toHaveFocus();
    });
    await userEvent.keyboard('{ArrowDown}');
    expect(items()[1]).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    expect(items()[0]).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    expect(items()[3]).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(items()[0]).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(items()[3]).toHaveFocus();
  });

  it('closes on Escape and gives focus back to the control', async () => {
    signedIn();
    await openMenu();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: CONTROL })).toHaveFocus();
  });

  it('closes on a click outside it', async () => {
    signedIn();
    await openMenu();
    await userEvent.click(screen.getByRole('heading', { level: 1 }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes when Tab takes focus out of it', async () => {
    signedIn();
    await openMenu();
    await waitFor(() => {
      expect(items()[0]).toHaveFocus();
    });
    await userEvent.tab();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('stays open while focus is on its control and closes when Tab leaves both', async () => {
    signedIn();
    await openMenu();
    await waitFor(() => {
      expect(items()[0]).toHaveFocus();
    });
    await userEvent.tab({ shift: true });
    expect(screen.getByRole('button', { name: CONTROL })).toHaveFocus();
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await userEvent.tab();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('names the menu and its items in English', async () => {
    /* gm2's row carries no language, so the English of this browser stays. */
    const { container } = render(App, {
      env: fakeEnv({
        cloud: fakeCloud(SEED, 'gm2'),
        router: memoryRouter('#/roll/std'),
        storage: memoryStorage({ 'dhloot.lang.v1': 'en' })
      })
    });
    await userEvent.click(await screen.findByRole('button', { name: /^Account: / }));
    expect(screen.getByRole('menu', { name: 'Account menu' })).toBeInTheDocument();
    expect(items().map((i) => i.textContent)).toEqual([
      'Account',
      'My lists',
      'My items',
      'Sign out'
    ]);
    await expectNoA11yViolations(container);
  });

  /* The link's own navigation is the browser's; the browser suite follows it
     (tests/app/states.js, the account menu case). */
  it('closes on a choice of a link', async () => {
    signedIn();
    await openMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Мои списки' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('signs out with «Выйти» and says so', async () => {
    const signOut = vi.spyOn(AppState.prototype, 'signOut');
    try {
      signedIn();
      await openMenu();
      await userEvent.click(screen.getByRole('menuitem', { name: 'Выйти' }));
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(signOut).toHaveBeenCalledWith('local');
      expect(await screen.findByText('Вы вышли из аккаунта.')).toBeInTheDocument();
      expect(await screen.findByRole('link', { name: 'Войти' })).toBeInTheDocument();
    } finally {
      signOut.mockRestore();
    }
  });

  it('says a refused sign-out as an error and stays signed in', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    cloud.auth.signOut = () => Promise.resolve({ ok: false, error: 'failed' });
    signedIn(cloud);
    await openMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Выйти' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Не получилось. Проверьте соединение и попробуйте ещё раз.'
    );
    expect(screen.getByRole('button', { name: CONTROL })).toBeInTheDocument();
  });
});

describe('the account menu on its own', () => {
  it('leaves a click on the control to the control, and closes on any other', async () => {
    const app = new AppState(
      fakeEnv({ cloud: fakeCloud(SEED, 'gm1'), router: memoryRouter('#/roll/std') })
    );
    const control = document.createElement('button');
    control.textContent = 'control';
    document.body.append(control);
    const onclose = vi.fn();
    try {
      render(AccountMenu, { app, control, onclose });
      await userEvent.click(control);
      expect(onclose).not.toHaveBeenCalled();
      await userEvent.click(screen.getByRole('menu'));
      expect(onclose).not.toHaveBeenCalled();
      await userEvent.click(document.body);
      expect(onclose).toHaveBeenCalledOnce();
    } finally {
      control.remove();
    }
  });
});
