/* A roll result: the card face and the row under it. docs/specs/FEATURES.md, "Records". */

import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import { fakeCloud } from '../ports/fake-cloud.js';
import { SEED } from '../ports/fake-cloud-seed.js';
import {
  fakeClipboard,
  fakeData,
  fakeEnv,
  memoryRouter,
  memoryStorage
} from '../ports/index.js';
import type { Env } from '../ports/index.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import type { Loot } from '../lib/data.js';
import type { Record_ } from '../lib/types.js';

afterEach(cleanup);

/* jsdom does not implement scrollIntoView: both menus call it once open. */
Element.prototype.scrollIntoView = vi.fn();

const record = (over: Partial<Record_> = {}): Record_ => ({
  id: 'w1',
  src: 'wondrous',
  kind: 'item',
  roll: 1,
  en: 'Big Bug Begone',
  ende: 'Does a thing.',
  ru: 'Отвадитель Жуков',
  rud: 'Делает что-то.',
  ...over
});

const loot = (it: Record_): Loot => ({ items: { wondrous: [it] } });

const at = (it: Record_ = record({ img: 'img/w1.webp' }), over: Partial<Env> = {}): Env =>
  fakeEnv({
    router: memoryRouter('#/roll/wondrous'),
    data: fakeData(loot(it)),
    storage: memoryStorage(),
    cloud: fakeCloud(SEED),
    ...over
  });

const group = (): HTMLElement => screen.getByRole('group', { name: 'Отвадитель Жуков' });

const openMore = async (): Promise<void> => {
  await userEvent.click(within(group()).getByRole('button', { name: 'Ещё' }));
};

const items = (): string[] => screen.getAllByRole('menuitem').map((i) => i.textContent.trim());

describe('the row of a result', () => {
  it('is one group named by the record, with three labeled controls in order', async () => {
    render(App, { env: at() });
    await waitFor(() => {
      expect(within(group()).getAllByRole('button')).toHaveLength(3);
    });
    expect(
      within(group())
        .getAllByRole('button')
        .map((b) => b.textContent.trim())
    ).toEqual(['В список', 'Поделиться', 'Ещё']);
  });

  it('sits outside the plate, so a clipped card cannot cut a menu', () => {
    const { container } = render(App, { env: at() });
    expect(container.querySelector('.card.face')).not.toBeNull();
    expect(container.querySelector('.card .resacts')).toBeNull();
  });

  it('offers no print and no copy icons beside the name', () => {
    const { container } = render(App, { env: at() });
    expect(screen.queryByRole('button', { name: 'Печать' })).not.toBeInTheDocument();
    expect(container.querySelector('.card-name-acts')).toBeNull();
    expect(container.querySelector('.card-acts')).toBeNull();
  });

  it('holds the copies in «Ещё», in order', async () => {
    render(App, { env: at() });
    await openMore();
    expect(items()).toEqual([
      'Скопировать текст',
      'Скопировать название',
      'Скопировать изображение',
      'Скопировать ссылку'
    ]);
  });

  it('offers no image copy for a record with no art', async () => {
    render(App, { env: at(record()) });
    await openMore();
    expect(items()).not.toContain('Скопировать изображение');
  });

  it('closes on a press, returns the focus to «Ещё» and copies', async () => {
    const clipboard = fakeClipboard();
    render(App, { env: at(record(), { clipboard }) });
    await openMore();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Скопировать название' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(within(group()).getByRole('button', { name: 'Ещё' })).toHaveFocus();
    expect(clipboard.last.text).toBe('Отвадитель Жуков');
  });

  it('says so when a copy fails, with the menu already closed', async () => {
    render(App, { env: at(record(), { clipboard: fakeClipboard({ fail: true }) }) });
    await openMore();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Скопировать название' }));
    expect(screen.getByText('Не удалось скопировать')).toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens the add-to-list menu', async () => {
    const { container } = render(App, { env: at() });
    const add = await within(group()).findByRole('button', { name: 'В список' });
    await userEvent.click(add);
    expect(add).toHaveAttribute('aria-expanded', 'true');
    expect(container.querySelector('.resacts .dropmenu')).not.toBeNull();
  });

  it('has no axe violations closed and with «Ещё» open', async () => {
    const { container } = render(App, { env: at() });
    await expectNoA11yViolations(container);
    await openMore();
    await expectNoA11yViolations(container);
  });
});
