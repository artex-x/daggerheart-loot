/* The sign-in prompt on its own: one line and one «Войти» that opens the
   account page with the page and the action remembered. docs/specs/FEATURES.md,
   "Account". */
import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SignInPrompt from './SignInPrompt.svelte';
import { fakeCloud } from '../ports/fake-cloud.js';
import { SEED } from '../ports/fake-cloud-seed.js';
import { fakeEnv, memoryRouter } from '../ports/index.js';
import { AppState } from '../state/app.svelte.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

const LEAD = 'Войдите, чтобы создать список.';

function made() {
  const router = memoryRouter('#/tables/eq_weapon');
  const app = new AppState(fakeEnv({ router, cloud: fakeCloud(SEED) }));
  return { app, router };
}

describe('SignInPrompt', () => {
  it('opens the account page, remembering the page and the action', async () => {
    const { app, router } = made();
    const ask = vi.spyOn(app, 'askSignIn');
    const after = {
      hash: '#/tables/eq_weapon',
      action: { do: 'addToList' as const, key: 'sel', ids: ['ci1'] }
    };
    const { container } = render(SignInPrompt, { app, lead: LEAD, after });
    expect(screen.getByText(LEAD)).toBeInTheDocument();
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['Войти']);
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button', { name: 'Войти' }));
    expect(ask).toHaveBeenCalledWith(after);
    expect(router.hash()).toBe('#/account');
    expect(app.signInFor).toBe(after);
  });

  it('offers «Отмена» in the compact form when it is given one', async () => {
    const { app } = made();
    const oncancel = vi.fn();
    const { container } = render(SignInPrompt, {
      app,
      lead: LEAD,
      after: { hash: '#/i/ci1' },
      compact: true,
      oncancel
    });
    expect(container.querySelector('.signin.compact')).not.toBeNull();
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button', { name: 'Отмена' }));
    expect(oncancel).toHaveBeenCalledOnce();
  });

  it('draws the boxed form with no «Отмена»', async () => {
    const { app } = made();
    const { container } = render(SignInPrompt, {
      app,
      lead: 'Войдите, и список сохранится в ваш аккаунт.',
      after: { hash: '#/l/abc', action: { do: 'saveList' } },
      boxed: true,
      oncancel: vi.fn()
    });
    expect(container.querySelector('.signin.boxed')).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Отмена' })).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
  });
});
