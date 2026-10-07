/* «Импорт предметов» while its lazy chunk loads and after the load failed: «Загружаем...»,
   then «Не получилось загрузить импорт.» with «Повторить», which loads it again
   (docs/specs/FEATURES.md, "Homebrew"). Its own file: the chunk is mocked for the whole
   file. */
import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import { fakeCloud } from '../ports/fake-cloud.js';
import { SEED } from '../ports/fake-cloud-seed.js';
import { fakeEnv, memoryRouter, memoryStorage } from '../ports/index.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

const chunk = vi.hoisted(() => ({ fail: true, gate: Promise.resolve() }));

vi.mock('./HomebrewImport.svelte', async (importOriginal) => {
  await chunk.gate;
  if (chunk.fail) {
    chunk.fail = false;
    throw new Error('the chunk did not load');
  }
  return importOriginal();
});

describe('the import chunk', () => {
  it('says the failed load with «Повторить», then loads it on the press', async () => {
    let open: () => void = () => undefined;
    chunk.gate = new Promise<void>((r) => {
      open = r;
    });
    const { container } = render(App, {
      env: fakeEnv({
        router: memoryRouter('#/homebrew'),
        storage: memoryStorage(),
        cloud: fakeCloud(SEED, 'gm1')
      })
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Импорт предметов' }));
    expect(await screen.findByText('Загружаем...')).toHaveAttribute('role', 'status');
    open();
    expect(await screen.findByText('Не получилось загрузить импорт.')).toHaveAttribute(
      'role',
      'alert'
    );
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    /* The retry compiles the real chunk cold, which passed the default 1 s on a
       4-core laptop (measured 2026-10-07). */
    expect(
      await screen.findByText('Импорт предметов из файла JSON', undefined, { timeout: 10_000 })
    ).toBeInTheDocument();
  });
});
