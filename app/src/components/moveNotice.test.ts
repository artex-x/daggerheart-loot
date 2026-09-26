/* The one-time notice of the move: the lists it put into the account, the
   damaged backup it could not read, and «Скрыть». docs/specs/FEATURES.md,
   "Account and browser lists". */
import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import MoveNotice from './MoveNotice.svelte';
import { fakeCloud } from '../ports/fake-cloud.js';
import { SEED } from '../ports/fake-cloud-seed.js';
import { fakeEnv, memoryStorage } from '../ports/index.js';
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
