/* A roll result: the card face and the row under it. docs/specs/FEATURES.md, "Records". */

import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import RollResult from './RollResult.svelte';
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
import { AppState } from '../state/app.svelte.js';
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

  it('leaves the dialog over the result its own menu, though both hold the same record', async () => {
    const { container } = render(App, { env: at() });
    await within(group()).findByRole('button', { name: 'В список' });
    await userEvent.click(container.querySelector('.card.face .card-media') as HTMLElement);
    const dialog = await screen.findByRole('dialog');
    const add = within(dialog).getByRole('button', { name: 'В список' });
    await userEvent.click(add);
    expect(add).toHaveAttribute('aria-expanded', 'true');
    expect(dialog.querySelectorAll('.dropmenu')).toHaveLength(1);
    expect(container.querySelector('.resacts .dropmenu')).toBeNull();
    await expectNoA11yViolations(dialog);
  });

  it('returns a sign-in to the record page, because a roll is not in the address', async () => {
    const app = new AppState(at());
    app.start();
    await waitFor(() => {
      expect(app.user).toBeNull();
    });
    render(RollResult, {
      app,
      index: app.index!,
      it: app.recordFor('w1') as Record_,
      onopen: vi.fn()
    });
    await userEvent.click(within(group()).getByRole('button', { name: 'В список' }));
    await userEvent.click(screen.getByRole('button', { name: 'Новый список' }));
    await userEvent.click(screen.getByRole('button', { name: 'Войти' }));
    expect(app.signInFor).toEqual({
      hash: '#/i/w1',
      action: { do: 'addToList', key: 'w1', ids: ['w1'] }
    });
    app.stop();
  });

  it('gives up an open menu when a new roll replaces the card', async () => {
    const app = new AppState(at());
    app.start();
    const { unmount } = render(RollResult, {
      app,
      index: app.index!,
      it: app.recordFor('w1') as Record_,
      onopen: vi.fn()
    });
    await userEvent.click(await within(group()).findByRole('button', { name: 'В список' }));
    expect(app.menuFor).not.toBe('');
    unmount();
    expect(app.menuFor).toBe('');
    app.stop();
  });

  describe('the side the add-to-list menu opens on', () => {
    /* Case 90's 1180x720 figures: the toggle 369-409 px, a 340 px menu, a 63 px header. */
    const laidOut = (): void => {
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
        this: Element
      ) {
        const box = (top: number, height: number): DOMRect =>
          ({
            top,
            bottom: top + height,
            height,
            left: 0,
            right: 0,
            width: 0,
            x: 0,
            y: top
          }) as DOMRect;
        if (this.classList.contains('dropmenu')) return box(0, 340);
        if (this.matches('.seldrop > .btn')) return box(369, 40);
        return box(0, 0);
      });
      vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(720);
      document.documentElement.style.setProperty('--sticky-h', '63px');
    };

    const opened = async (host?: HTMLElement): Promise<HTMLElement> => {
      const app = new AppState(at());
      app.start();
      render(RollResult, {
        ...(host ? { target: host } : {}),
        props: { app, index: app.index!, it: app.recordFor('w1') as Record_, onopen: vi.fn() }
      });
      await userEvent.click(within(group()).getByRole('button', { name: 'В список' }));
      const menu = document.querySelector('.resacts .dropmenu') as HTMLElement;
      await waitFor(() => {
        expect(menu.isConnected).toBe(true);
      });
      app.stop();
      return menu;
    };

    afterEach(() => {
      vi.restoreAllMocks();
      document.documentElement.style.removeProperty('--sticky-h');
    });

    it('opens down near the page top, where no scroll uncovers it under the header', async () => {
      laidOut();
      const menu = await opened();
      await waitFor(() => {
        expect(menu).not.toHaveClass('up');
      });
    });

    it('opens up where the page above the toggle holds it under the header', async () => {
      laidOut();
      vi.spyOn(window, 'scrollY', 'get').mockReturnValue(300);
      const menu = await opened();
      await waitFor(() => {
        expect(menu).toHaveClass('up');
      });
    });

    it('opens up from a pinned box, which a page scroll does not move', async () => {
      laidOut();
      const bar = document.body.appendChild(document.createElement('div'));
      bar.style.position = 'fixed';
      const menu = await opened(bar);
      await waitFor(() => {
        expect(menu).toHaveClass('up');
      });
      bar.remove();
    });
  });

  it('has no axe violations closed and with «Ещё» open', async () => {
    const { container } = render(App, { env: at() });
    await expectNoA11yViolations(container);
    await openMore();
    await expectNoA11yViolations(container);
  });
});

describe('the tags of a result', () => {
  it('draws no Core badge and no relation line, and keeps another book', async () => {
    const core = record({ src: 'core', craft: ['w2'] });
    const target = record({ id: 'w2', roll: 2, ru: 'Мазь', en: 'Salve' });
    const app = new AppState(
      fakeEnv({
        router: memoryRouter('#/roll/wondrous'),
        data: fakeData({ items: { wondrous: [core, target] } }),
        storage: memoryStorage(),
        cloud: fakeCloud(SEED)
      })
    );
    app.start();
    const { container, unmount } = render(RollResult, {
      app,
      index: app.index!,
      it: app.recordFor('w1') as Record_,
      onopen: vi.fn()
    });
    expect(container.querySelector('.badge.src')).toBeNull();
    expect(container.querySelector('.craft')).toBeNull();
    expect(container.textContent).not.toContain('Улучшается до');
    await expectNoA11yViolations(container);
    unmount();
    const other = render(RollResult, {
      app,
      index: app.index!,
      it: { ...core, src: 'hnf' },
      onopen: vi.fn()
    });
    expect(other.container.querySelector('.badge.src')).toHaveTextContent('Hope & Fear');
    app.stop();
  });
});
