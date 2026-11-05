/* The shell of the nine roll pages: the read-only heading, the results line and its two
 * controls up to 760 px, the head and the two panes from 761 px. docs/specs/FEATURES.md,
 * "Rolling". */

import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import HelpItem from './HelpItem.svelte';
import {
  fakeClipboard,
  fakeData,
  fakeEnv,
  fakeViewport,
  memoryRouter,
  memoryStorage,
  noData
} from '../ports/index.js';
import type { Env, FakeViewport } from '../ports/index.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import type { Loot } from '../lib/data.js';
import { SUPPLEMENTS } from '../lib/nav.js';
import type { Record_ } from '../lib/types.js';

afterEach(cleanup);

/* jsdom does not implement scrollIntoView: «Ещё» calls it once open. */
Element.prototype.scrollIntoView = vi.fn();

const row = (src: string, kind: 'item' | 'consumable'): Record_ => ({
  id: `${src}${kind}`,
  src,
  kind,
  roll: 1,
  en: `${src} ${kind}`,
  ende: 'Does a thing.',
  ru: `${src} ${kind}`,
  rud: 'Делает что-то.'
});

const LOOT: Loot = {
  items: {
    core_item: [row('core', 'item')],
    core_consumable: [row('core', 'consumable')],
    hnf_item: [row('hnf', 'item')],
    hnf_consumable: [row('hnf', 'consumable')],
    wondrous: [row('w', 'item')]
  }
};

const at = (hash: string, over: Partial<Env> = {}): Env =>
  fakeEnv({
    router: memoryRouter(hash),
    data: fakeData(LOOT),
    storage: memoryStorage(),
    viewport: fakeViewport('narrow'),
    ...over
  });

const button = (name: string | RegExp): HTMLElement => screen.getByRole('button', { name });
/** «Ещё» of the results line: every result has its own. */
const more = (): HTMLElement =>
  within(document.querySelector<HTMLElement>('.reshead') as HTMLElement).getByRole('button', {
    name: 'Ещё'
  });
const menuNames = (): string[] =>
  within(screen.getByRole('menu'))
    .getAllByRole('menuitem')
    .map((i) => i.textContent.trim());

describe('the heading', () => {
  it.each(['#/roll/std', '#/roll/alt', ...SUPPLEMENTS.map((s) => `#/${s}`)])(
    'is read, not drawn, up to 760 px on %s',
    (hash) => {
      const { container } = render(App, { env: at(hash) });
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveClass('vh');
      expect(container.querySelector('.page-head')).toBeNull();
    }
  );

  it('is drawn in the head from 761 px', () => {
    const { container } = render(App, {
      env: at('#/roll/std', { viewport: fakeViewport('mid') })
    });
    expect(screen.getByRole('heading', { level: 1 })).toHaveClass('page-h');
    expect(container.querySelector('.page-head')).not.toBeNull();
  });

  it('stays with nothing to roll, in both bands', () => {
    const { container } = render(App, { env: at('#/roll/wondrous', { data: noData() }) });
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(container.querySelector('.rp')).toBeNull();
    cleanup();
    render(App, {
      env: at('#/roll/wondrous', { data: noData(), viewport: fakeViewport('wide') })
    });
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});

describe('the results line up to 760 px', () => {
  it('holds «Бросок N», «Настроить» and «Ещё»', () => {
    const { container } = render(App, { env: at('#/roll/std') });
    const line = container.querySelector('.reshead') as HTMLElement;
    expect(within(line).getByRole('heading', { level: 2 })).toHaveTextContent('Бросок 1');
    expect(
      within(line)
        .getAllByRole('button')
        .map((b) => b.textContent.trim())
    ).toEqual(['Настроить', 'Ещё']);
    expect(button('Настроить').className).not.toContain('toggle');
  });

  it('opens the settings from «Настроить» and folds them again', async () => {
    render(App, { env: at('#/roll/std') });
    expect(button('Настроить')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('textbox', { name: 'Результат броска' })).not.toBeInTheDocument();
    await userEvent.click(button('Настроить'));
    expect(button('Настроить')).toHaveAttribute('aria-expanded', 'true');
    expect(button('Настроить')).toHaveAttribute('aria-controls', 'rp-set');
    expect(screen.getByRole('textbox', { name: 'Результат броска' })).toBeInTheDocument();
    expect(button('Core')).toBeInTheDocument();
    await userEvent.click(button('Настроить'));
    expect(screen.queryByRole('textbox', { name: 'Результат броска' })).not.toBeInTheDocument();
  });

  it('holds the copy, the pin and the help in «Ещё», in this order', async () => {
    render(App, { env: at('#/roll/std') });
    await userEvent.click(more());
    expect(menuNames()).toEqual([
      'Скопировать все варианты',
      'Открывается при запуске',
      'Где какая редкость'
    ]);
  });

  it('has no copy where the roll is not a choice', async () => {
    render(App, { env: at('#/roll/wondrous') });
    await userEvent.click(more());
    expect(menuNames()).toEqual(['Открывать при запуске', 'Об этой таблице']);
  });

  it('closes on a press and returns the focus to «Ещё»', async () => {
    const clipboard = fakeClipboard();
    render(App, { env: at('#/roll/std', { clipboard }) });
    await userEvent.click(more());
    await userEvent.click(screen.getByRole('menuitem', { name: 'Скопировать все варианты' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(more()).toHaveFocus();
    expect(clipboard.last.rich?.plain).toContain('core item');
  });

  it('closes on Escape and returns the focus to «Ещё»', async () => {
    render(App, { env: at('#/roll/std') });
    await userEvent.click(more());
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(more()).toHaveFocus();
  });

  it('pins the page from the menu and says so on the next open', async () => {
    render(App, { env: at('#/roll/wondrous') });
    await userEvent.click(more());
    await userEvent.click(screen.getByRole('menuitem', { name: 'Открывать при запуске' }));
    await userEvent.click(more());
    expect(
      screen.getByRole('menuitem', { name: 'Открывается при запуске' })
    ).toBeInTheDocument();
  });

  it('opens the help box from the menu and folds it again', async () => {
    const { container } = render(App, { env: at('#/roll/std') });
    await userEvent.click(more());
    const item = screen.getByRole('menuitem', { name: 'Где какая редкость' });
    expect(item).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(item);
    expect(container.querySelector('.helpbox')).not.toBeNull();
    await userEvent.click(more());
    await userEvent.click(screen.getByRole('menuitem', { name: 'Где какая редкость' }));
    expect(container.querySelector('.helpbox')).toBeNull();
  });

  it('closes the help box with its «Закрыть», the focus back on «Ещё»', async () => {
    const { container } = render(App, { env: at('#/roll/std') });
    await userEvent.click(more());
    await userEvent.click(screen.getByRole('menuitem', { name: 'Где какая редкость' }));
    const box = container.querySelector('.helpbox') as HTMLElement;
    await expectNoA11yViolations(container);
    await userEvent.click(within(box).getByRole('button', { name: 'Закрыть' }));
    expect(container.querySelector('.helpbox')).toBeNull();
    expect(more()).toHaveFocus();
  });

  it('has no axe violations closed, with «Настроить» open and with «Ещё» open', async () => {
    const { container } = render(App, { env: at('#/roll/std') });
    await expectNoA11yViolations(container);
    await userEvent.click(button('Настроить'));
    await expectNoA11yViolations(container);
    await userEvent.click(more());
    await expectNoA11yViolations(container);
  });
});

describe('the two panes from 761 px', () => {
  const wide = (): Partial<Env> => ({ viewport: fakeViewport('wide') });

  it('holds the copy on the results line and no «Настроить» or results line «Ещё»', () => {
    const { container } = render(App, { env: at('#/roll/std', wide()) });
    const line = container.querySelector('.reshead') as HTMLElement;
    expect(
      within(line)
        .getAllByRole('button')
        .map((b) => b.textContent.trim())
    ).toEqual(['Скопировать все варианты']);
    expect(screen.queryByRole('button', { name: 'Настроить' })).not.toBeInTheDocument();
  });

  it('draws the settings in the control pane at once', () => {
    render(App, { env: at('#/roll/std', wide()) });
    expect(screen.getByRole('textbox', { name: 'Результат броска' })).toBeInTheDocument();
    expect(button('Core')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(App, { env: at('#/roll/std', wide()) });
    await expectNoA11yViolations(container);
  });
});

describe('the help item', () => {
  it('reads the name of its panel', () => {
    render(HelpItem, {
      help: { button: 'Об этой книге', paragraphs: [] },
      open: false,
      ontoggle: vi.fn(),
      onpicked: vi.fn()
    });
    expect(screen.getByRole('menuitem', { name: 'Об этой книге' })).toBeInTheDocument();
  });
});

describe('a band change', () => {
  it('resets the open panels and keeps the roll', async () => {
    const viewport: FakeViewport = fakeViewport('narrow');
    render(App, { env: at('#/roll/std', { viewport }) });
    await userEvent.click(button('Настроить'));
    await userEvent.click(button('Расходники'));
    const up = button('На единицу больше');
    await userEvent.click(up);
    viewport.set('mid');
    flushSync();
    expect(screen.getByRole('heading', { level: 2, name: 'Бросок 2' })).toBeInTheDocument();
    viewport.set('narrow');
    flushSync();
    expect(screen.queryByRole('textbox', { name: 'Результат броска' })).not.toBeInTheDocument();
    expect(button('Предметы')).toHaveAttribute('aria-expanded', 'false');
  });

  it('puts a focus lost with the old layout on the results line', async () => {
    const viewport: FakeViewport = fakeViewport('mid');
    render(App, { env: at('#/roll/std', { viewport }) });
    button('Core').focus();
    viewport.set('narrow');
    await waitFor(() => {
      expect(button('Настроить')).toHaveFocus();
    });
  });
});
