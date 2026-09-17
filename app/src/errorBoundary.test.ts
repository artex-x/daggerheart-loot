/* App.svelte's error boundary (S2/R7) - resilience.md's smallest patch for a
 * route kind (or any other component throw) that used to leave a blank
 * middle under a working tab bar, with no explanation. Neither route kind is
 * reachable through the address bar today - `#fallback` keeps `app.hash`
 * readable before `App.svelte` ever reads `app.route` - so this is tested by
 * forcing a real component throw rather than by finding a live route that
 * trips it.
 *
 * `groupsFor` is mocked file-locally (`vi.mock` is hoisted and scoped to
 * this file alone) rather than in `shell.test.ts`, which renders several
 * `#/tables/...` routes that must keep working normally. */
import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App.svelte';
import type * as Filters from './lib/filters.js';
import { fakeEnv, memoryRouter } from './ports/index.js';

vi.mock('./lib/filters.js', async (importOriginal) => {
  const actual = await importOriginal<typeof Filters>();
  return { ...actual, groupsFor: vi.fn(actual.groupsFor) };
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('a page that throws mid-render', () => {
  it('is caught by the boundary, names the error, and recovers on reset', async () => {
    const { groupsFor } = await import('./lib/filters.js');
    vi.mocked(groupsFor).mockImplementationOnce(() => {
      throw new Error('boom');
    });

    render(App, { env: fakeEnv({ router: memoryRouter('#/tables/eq_weapon') }) });
    expect(screen.getByText('Что-то пошло не так на этой странице.')).toBeInTheDocument();
    expect(screen.getByText('boom')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Обновить страницу' }));
    expect(screen.queryByText('Что-то пошло не так на этой странице.')).not.toBeInTheDocument();
  });
});
