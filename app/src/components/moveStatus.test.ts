/* The move's status in the storage notice's slot: moving, stopped on the
   network, a list the server refused, a held list, and nothing once done.
   docs/specs/FEATURES.md, "Account and browser lists". */
import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import MoveStatus from './MoveStatus.svelte';
import { fakeCloud } from '../ports/fake-cloud.js';
import { SEED } from '../ports/fake-cloud-seed.js';
import { fakeEnv, memoryStorage } from '../ports/index.js';
import { AppState } from '../state/app.svelte.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

const GM1 = SEED.users.gm1.id;
const LISTS = JSON.stringify([
  { id: 'a', name: 'Клад дракона', ids: [] },
  { id: 'b', name: 'Лавка в порту', ids: [] }
]);

function made(migrated?: object) {
  const storage = memoryStorage({
    'dhloot.lists.v2': LISTS,
    ...(migrated ? { 'dhloot.migrated.v1': JSON.stringify(migrated) } : {})
  });
  const app = new AppState(fakeEnv({ storage, cloud: fakeCloud(SEED) }));
  const move = app.legacyMove;
  if (!move) throw new Error('The app has no move. Give it a cloud');
  return { app, move };
}

const text = (container: HTMLElement): string => container.textContent.trim();

describe('MoveStatus', () => {
  it('says the lists are moving', async () => {
    const { app, move } = made();
    move.status = 'moving';
    const { container } = render(MoveStatus, { app });
    expect(text(container)).toBe('Переносим списки в аккаунт...');
    await expectNoA11yViolations(container);
  });

  it('says the network stopped the move, in the warning tint', async () => {
    const { app, move } = made();
    move.status = 'failed';
    const { container } = render(MoveStatus, { app });
    expect(text(container)).toBe(
      'Не все списки перенесены: нет связи. Попробуем при следующем открытии.'
    );
    expect(container.querySelector('.box.warn')).not.toBeNull();
    await expectNoA11yViolations(container);
  });

  it('names the lists the server refused', async () => {
    const { app, move } = made();
    move.status = 'done';
    move.refused = [
      { id: 'a', name: 'Клад дракона' },
      { id: 'b', name: 'Лавка в порту' }
    ];
    const { container } = render(MoveStatus, { app });
    expect(
      screen.getByText('Не перенесён: «Клад дракона», «Лавка в порту».')
    ).toBeInTheDocument();
    expect(text(container)).toContain(
      'Сервер не принял список. Напишите на daggerheart.loot@gmail.com.'
    );
    await expectNoA11yViolations(container);
  });

  it('names a held list while it is still here, with the held text', async () => {
    const { app, move } = made({ owner: GM1, lists: {}, held: ['a', 'gone'] });
    move.status = 'done';
    const { container } = render(MoveStatus, { app });
    expect(text(container)).toBe(
      'Не перенесён: «Клад дракона». Копия в аккаунте не совпала со списком. Напишите на daggerheart.loot@gmail.com.'
    );
    await expectNoA11yViolations(container);
  });

  it('draws nothing idle or done with nothing refused or held', () => {
    const { app, move } = made();
    const { container } = render(MoveStatus, { app });
    expect(text(container)).toBe('');
    move.status = 'done';
    cleanup();
    expect(text(render(MoveStatus, { app }).container)).toBe('');
  });
});
