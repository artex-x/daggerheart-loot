/* The one-time notice of the move: the lists it put into the account, the
   damaged backup it could not read, and «Скрыть»; and, signed out, the
   banner that asks a reader with browser lists to sign in.
   docs/specs/FEATURES.md, "Account and browser lists". */
import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import MoveNotice from './MoveNotice.svelte';
import { fakeCloud } from '../ports/fake-cloud.js';
import { SEED } from '../ports/fake-cloud-seed.js';
import { fakeEnv, fixedClock, memoryRouter, memoryStorage } from '../ports/index.js';
import { LEGACY_WRITE_UNTIL } from '../lib/legacy.js';
import { AppState } from '../state/app.svelte.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

const GM1 = SEED.users.gm1;
const MOVED =
  'Списки из этого браузера перенесены в ваш аккаунт: «Клад дракона», «Лавка в порту».';
const BAD =
  'В этом браузере осталась повреждённая копия списков: её не получилось прочитать и перенести. Если в ней было что-то важное, напишите на daggerheart.loot@gmail.com.';

function made(migrated: object | null, as: string | null = GM1.id) {
  const storage = memoryStorage(
    migrated ? { 'dhloot.migrated.v1': JSON.stringify(migrated) } : {}
  );
  storage.set('dhloot.lists.v2', '[]');
  const app = new AppState(fakeEnv({ storage, cloud: fakeCloud(SEED) }));
  app.user = as === null ? null : { userId: as, email: GM1.email, provider: 'google' };
  return { app, storage };
}

describe('MoveNotice', () => {
  it('names the moved lists, and «Скрыть» clears them from the key', async () => {
    const { app, storage } = made({
      owner: GM1.id,
      lists: { a: 'x', b: 'y' },
      notice: ['Клад дракона', 'Лавка в порту']
    });
    const { container } = render(MoveNotice, { app });
    expect(screen.getByRole('status')).toHaveTextContent(MOVED);
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button', { name: 'Скрыть' }));
    expect(screen.queryByRole('status')).toBeNull();
    expect(JSON.parse(storage.get('dhloot.migrated.v1') ?? '{}')).toEqual({
      owner: GM1.id,
      lists: { a: 'x', b: 'y' }
    });
  });

  it('says the damaged backup alone, and «Скрыть» marks it shown', async () => {
    const { app, storage } = made({ owner: GM1.id, lists: {}, bad: true });
    const { container } = render(MoveNotice, { app });
    expect(screen.getByRole('status')).toHaveTextContent(BAD);
    expect(screen.getByRole('status')).not.toHaveTextContent('перенесены');
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button', { name: 'Скрыть' }));
    expect(screen.queryByRole('status')).toBeNull();
    expect(JSON.parse(storage.get('dhloot.migrated.v1') ?? '{}')).toMatchObject({ bad: false });
  });

  it('says both, the names first', async () => {
    const { app } = made({
      owner: GM1.id,
      lists: {},
      notice: ['Клад дракона', 'Лавка в порту'],
      bad: true
    });
    const { container } = render(MoveNotice, { app });
    expect(screen.getByRole('status')).toHaveTextContent(MOVED + ' ' + BAD);
    await expectNoA11yViolations(container);
  });

  it('draws nothing with neither, for another account, signed out or before the session', () => {
    const shown = { owner: GM1.id, lists: {}, notice: ['Клад дракона'] };
    for (const [migrated, as] of [
      [{ owner: GM1.id, lists: {}, bad: false }, GM1.id],
      [null, GM1.id],
      [shown, SEED.users.gm2.id],
      [shown, null]
    ] as const) {
      const { app } = made(migrated, as);
      const { container } = render(MoveNotice, { app });
      expect(container.querySelector('.movenotice')).toBeNull();
      cleanup();
    }
    const { app } = made(shown);
    app.user = undefined;
    const { container } = render(MoveNotice, { app });
    expect(container.querySelector('.movenotice')).toBeNull();
  });

  it('says it in English', () => {
    const { app } = made({ owner: GM1.id, lists: {}, notice: ['Клад'] });
    app.setLang('en');
    render(MoveNotice, { app });
    expect(screen.getByRole('status')).toHaveTextContent(
      'Lists from this browser were moved to your account: "Клад".'
    );
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
  });
});

describe('the move banner', () => {
  const BANNER =
    'Ваши списки хранятся только в этом браузере. Войдите до 26 октября 2026 года - и они перенесутся в аккаунт. После этой даты приложение перестанет их показывать.';
  const ONE = JSON.stringify([{ id: 'a', name: 'Тайник', ids: [] }]);

  /** A signed-out app on `hash` with one browser list, unless `over` says otherwise. */
  function signedOut(
    hash = '#/tables',
    keys: Record<string, string> = { 'dhloot.lists.v2': ONE },
    over: Parameters<typeof fakeEnv>[0] = {}
  ): AppState {
    const app = new AppState(
      fakeEnv({
        storage: memoryStorage(keys),
        router: memoryRouter(hash),
        cloud: fakeCloud(SEED),
        ...over
      })
    );
    app.user = null;
    return app;
  }

  it('asks a signed-out reader with browser lists to sign in, before the date', async () => {
    const { container } = render(MoveNotice, { app: signedOut() });
    const box = screen.getByRole('status');
    expect(box).toHaveTextContent(BANNER);
    const signIn = screen.getByRole('button', { name: 'Войти и перенести списки' });
    const hide = screen.getByRole('button', { name: 'Скрыть напоминание' });
    expect(signIn).toHaveTextContent(/^Войти$/);
    expect(hide).toHaveTextContent(/^Скрыть$/);
    expect(screen.queryByRole('button', { name: 'Войти' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Скрыть' })).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('is not drawn while the session is unknown, signed in, or with no browser list', () => {
    const unknown = signedOut();
    unknown.user = undefined;
    const signedIn = signedOut();
    signedIn.user = { userId: SEED.users.gm2.id, email: 'x@example.test', provider: 'google' };
    for (const app of [unknown, signedIn, signedOut('#/tables', {})]) {
      const { container } = render(MoveNotice, { app });
      expect(container.querySelector('.movenotice')).toBeNull();
      cleanup();
    }
  });

  it('is not drawn for a browser another account owns, on #/account, or after the date', () => {
    for (const app of [
      signedOut('#/tables', {
        'dhloot.lists.v2': ONE,
        'dhloot.migrated.v1': JSON.stringify({ owner: GM1.id, lists: {} })
      }),
      signedOut('#/account'),
      signedOut(
        '#/tables',
        { 'dhloot.lists.v2': ONE },
        { clock: fixedClock(LEGACY_WRITE_UNTIL) }
      )
    ]) {
      const { container } = render(MoveNotice, { app });
      expect(container.querySelector('.movenotice')).toBeNull();
      cleanup();
    }
  });

  it('leaves for #/account with the page it was pressed on to come back to', async () => {
    const app = signedOut('#/roll/dread');
    render(MoveNotice, { app });
    await userEvent.click(screen.getByRole('button', { name: 'Войти и перенести списки' }));
    expect(app.hash).toBe('#/account');
    expect(app.signInFor?.hash).toBe('#/roll/dread');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('hides on «Скрыть», and a navigation does not bring it back', async () => {
    const app = signedOut();
    render(MoveNotice, { app });
    await userEvent.click(screen.getByRole('button', { name: 'Скрыть напоминание' }));
    expect(screen.queryByRole('status')).toBeNull();
    app.go('#/search');
    app.setLang('en');
    await Promise.resolve();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('says it in English', () => {
    const app = signedOut();
    app.setLang('en');
    render(MoveNotice, { app });
    expect(screen.getByRole('status')).toHaveTextContent(
      'Your lists are stored only in this browser. Sign in before 26 October 2026 and they move to your account. After that date the app stops showing them.'
    );
    expect(
      screen.getByRole('button', { name: 'Sign in and move the lists' })
    ).toHaveTextContent('Sign in');
    expect(screen.getByRole('button', { name: 'Dismiss the reminder' })).toHaveTextContent(
      'Dismiss'
    );
  });
});
