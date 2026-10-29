/* The shell, driven through fake ports.
 *
 * Every one of these would need a browser, a real localStorage and a real
 * address bar without them. With them it is a function of an Env, which is the
 * whole argument for Phase 3 in one file. */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import Toast from './Toast.svelte';
import { expectNoA11yViolations } from '../test/a11y.js';
import {
  brokenStorage,
  fakeData,
  fakeEnv,
  fakePwa,
  memoryRouter,
  memoryStorage
} from '../ports/index.js';
import type { Env } from '../ports/index.js';
import type { Loot } from '../lib/data.js';
import { AppState } from '../state/app.svelte.js';
import { fakeCloud } from '../ports/fake-cloud.js';
import { SEED, uuid } from '../ports/fake-cloud-seed.js';

afterEach(cleanup);

const at = (hash: string, over: Partial<Env> = {}): Env =>
  fakeEnv({ router: memoryRouter(hash), ...over });

const LOOT: Loot = {
  items: {
    core_item: [
      {
        id: 'ci1',
        src: 'core',
        kind: 'item',
        roll: 1,
        en: 'Bedroll',
        ende: '',
        ru: 'Спальный мешок',
        rud: ''
      }
    ]
  },
  eq: [],
  refs: {}
};

describe('the tab title', () => {
  it("titles a record page with the record's own name", () => {
    render(App, { env: at('#/i/ci1', { data: fakeData(LOOT) }) });
    expect(document.title).toBe('Спальный мешок - Генератор лута Daggerheart');
  });

  it('keeps the plain title on a record that is not found', () => {
    render(App, { env: at('#/i/nope', { data: fakeData(LOOT) }) });
    expect(document.title).toBe('Генератор лута Daggerheart');
  });

  it('titles an account list with its name, and a rename retitles the tab', async () => {
    render(App, {
      env: at('#/lists/' + uuid(101), { data: fakeData(LOOT), cloud: fakeCloud(SEED, 'gm1') })
    });
    await waitFor(() => {
      expect(document.title).toBe('Лавка кузнеца - Генератор лута Daggerheart');
    });
    const name = await screen.findByRole('textbox', { name: 'Название списка' });
    await userEvent.clear(name);
    await userEvent.type(name, 'Кузня');
    await waitFor(() => {
      expect(document.title).toBe('Кузня - Генератор лута Daggerheart');
    });
  });

  it('keeps the plain title on a page that is neither a record, a section, nor a list', () => {
    /* The retired print page lights no tab (`AppState.section` is null for `route.kind
       === 'printRetired'`) and opens no one's own list either. */
    render(App, { env: at('#/print/ci1', { data: fakeData(LOOT) }) });
    expect(document.title).toBe('Генератор лута Daggerheart');
  });

  it('shows a share link’s name on screen but keeps the plain tab title', async () => {
    render(App, {
      env: at('#/s/player-token-1', { data: fakeData(LOOT), cloud: fakeCloud(SEED) })
    });
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Лавка кузнеца' })
    ).toBeInTheDocument();
    expect(document.title).toBe('Генератор лута Daggerheart');
  });
});

describe('the frame', () => {
  it('names the tab bar and the language group for a screen reader', () => {
    /* Neither has text of its own, so without a label they are two unnamed
       groups of links */
    render(App, { env: at('#/roll/std') });
    expect(screen.getByRole('navigation', { name: 'Разделы' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Язык' })).toBeInTheDocument();
  });

  it('offers a way past the tabs to the content', () => {
    render(App, { env: at('#/roll/std') });
    expect(screen.getByRole('link', { name: 'К содержимому' })).toHaveAttribute(
      'href',
      '#main'
    );
  });

  it('moves focus straight to the content without touching the address', async () => {
    /* The live browser's own fragment jump would route `#main` through the
       SPA's address bar too - `parseHash('#main')` is unknown, and the app
       would replace it with the home section, clearing the selection. */
    const router = memoryRouter('#/tables/eq_weapon');
    render(App, { env: fakeEnv({ router }) });
    const before = router.hash();
    await userEvent.click(screen.getByRole('link', { name: 'К содержимому' }));
    expect(router.hash()).toBe(before);
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('follows the language on the document itself', async () => {
    render(App, { env: at('#/roll/std') });
    expect(document.documentElement.lang).toBe('ru');
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(document.documentElement.lang).toBe('en');
    /* A section titles the tab with its own name too, not only a
       record - "Standard rules - Daggerheart Loot Generator", not the plain
       title alone. */
    expect(document.title).toBe('Standard rules - Daggerheart Loot Generator');
  });
});

describe('the footer nav', () => {
  const INSTALL = 'Установить как приложение';

  it('links the install guide from a nav of site pages', () => {
    render(App, { env: at('#/roll/std') });
    const nav = screen.getByRole('navigation', { name: 'Страницы сайта' });
    const link = screen.getByRole('link', { name: INSTALL });
    expect(nav).toContainElement(link);
    expect(link).toHaveAttribute('href', '/pages/install.html');
  });

  it('names the link in English and links the English page', async () => {
    render(App, { env: at('#/roll/std') });
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByRole('link', { name: 'Install as an app' })).toHaveAttribute(
      'href',
      '/pages/en/install.html'
    );
  });

  it('links the install guide, the privacy page and the terms, in that order', () => {
    render(App, { env: at('#/roll/std') });
    const nav = screen.getByRole('navigation', { name: 'Страницы сайта' });
    const hrefs = [...nav.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/pages/install.html', '/pages/privacy.html', '/pages/terms.html']);
    expect(screen.getByRole('link', { name: 'Конфиденциальность' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Условия использования' })).toBeInTheDocument();
  });

  it('links the English policy pages in English', async () => {
    render(App, { env: at('#/roll/std') });
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute(
      'href',
      '/pages/en/privacy.html'
    );
    expect(screen.getByRole('link', { name: 'Terms of use' })).toHaveAttribute(
      'href',
      '/pages/en/terms.html'
    );
  });

  it('folds the full licence notice under a one-line summary that toggles it', async () => {
    const { container } = render(App, { env: at('#/roll/std') });
    const details = container.querySelector('footer details');
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute('open');
    const summary = screen.getByText(
      'Daggerheart © Darrington Press - DPCGL - Источники и лицензия'
    );
    expect(summary.tagName).toBe('SUMMARY');
    expect(details!.textContent).toContain('Daggerheart System Reference Document 2.0');
    expect(details!.querySelector('a')).toHaveAttribute('href', 'https://www.daggerheart.com');
    await expectNoA11yViolations(container);
    await userEvent.click(summary);
    expect(details).toHaveAttribute('open');
    await expectNoA11yViolations(container);
  });

  it('names the licence summary in English and puts it in the tab order', async () => {
    /* jsdom has no native summary activation; the keyboard toggle and its
       focus ring are tests/app/states.js case 28, in Chrome. */
    render(App, { env: at('#/roll/std') });
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    const summary = screen.getByText(
      'Daggerheart © Darrington Press - DPCGL - Sources and licence'
    );
    summary.focus();
    expect(summary).toHaveFocus();
  });

  it('keeps the policy links and drops the install link inside the installed app', () => {
    render(App, { env: at('#/roll/std', { pwa: fakePwa({ standalone: true }) }) });
    expect(screen.queryByRole('link', { name: INSTALL })).toBeNull();
    const nav = screen.getByRole('navigation', { name: 'Страницы сайта' });
    const hrefs = [...nav.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/pages/privacy.html', '/pages/terms.html']);
  });
});

describe('the language', () => {
  it('redraws the interface, not just the switch', async () => {
    render(App, { env: at('#/roll/std') });
    expect(screen.getByRole('link', { name: 'Обычные правила' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByRole('link', { name: 'Standard rules' })).toBeInTheDocument();
  });

  it('leaves the wordmark alone', async () => {
    /* It is a logo, not a string: the live app writes "Лут Daggerheart" into
       index.html once and never translates it. The rewrite had it in the
       dictionary and was turning it into "Loot Daggerheart" on every English
       page, which no test and no route-level screenshot could see. */
    render(App, { env: at('#/roll/std') });
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByRole('link', { name: 'ЛутDaggerheart' })).toHaveAttribute(
      'href',
      '/en/roll/std'
    );
  });

  it('is remembered', async () => {
    const storage = memoryStorage();
    render(App, { env: at('#/roll/std', { storage }) });
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(storage.get('dhloot.lang.v1')).toBe('en');
  });

  it('starts from what was remembered', () => {
    render(App, {
      env: at('#/roll/std', { storage: memoryStorage({ 'dhloot.lang.v1': 'en' }) })
    });
    expect(screen.getByRole('link', { name: 'Standard rules' })).toBeInTheDocument();
  });

  it('ignores a stored value that is not a language', () => {
    /* Settings are read as untrusted data: rubbish falls back rather than
       leaving the page in a state with no dictionary */
    render(App, {
      env: at('#/roll/std', { storage: memoryStorage({ 'dhloot.lang.v1': 'xx' }) })
    });
    expect(screen.getByRole('link', { name: 'Обычные правила' })).toBeInTheDocument();
  });
});

describe('which tab is lit', () => {
  it('marks the section the address names', () => {
    render(App, { env: at('#/roll/alt') });
    const tabs = screen.getByRole('navigation', { name: 'Разделы' });
    expect(within(tabs).getByRole('link', { name: 'Альт. таблицы' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  it('marks the supplements tab for every supplement section', () => {
    for (const hash of ['#/roll/voa', '#/roll/dv']) {
      render(App, { env: at(hash) });
      const tabs = screen.getByRole('navigation', { name: 'Разделы' });
      expect(within(tabs).getByRole('link', { name: 'Дополнения' }), hash).toHaveAttribute(
        'aria-current',
        'page'
      );
      cleanup();
    }
  });

  it('lights Tables for a table, and nothing for a list', () => {
    /* The live `renderTabs` (`git show 23c00a6^:app.js`) compares against the raw route
       string, and a list route - `l/…` or `lists/…` - is never that string,
       so Lists stays unlit on its own pages, same as a record or a print
       sheet. */
    render(App, { env: at('#/tables/eq_weapon') });
    expect(screen.getByRole('link', { name: 'Таблицы' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    cleanup();

    render(App, { env: at('#/lists/abc') });
    for (const link of screen.getAllByRole('link')) {
      expect(link).not.toHaveAttribute('aria-current');
    }
  });

  it('lights nothing on a record', () => {
    /* A record belongs to no section, and lighting one would be a claim about
       where it came from that the address does not make */
    render(App, { env: at('#/i/ci1') });
    for (const link of screen.getAllByRole('link')) {
      expect(link).not.toHaveAttribute('aria-current');
    }
  });

  it('follows an old section name to the section it became', () => {
    render(App, { env: at('#/roll/hnf') });
    expect(screen.getByRole('link', { name: 'Обычные правила' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });
});

describe('the address on the way in', () => {
  it('opens the pinned section when there is none', () => {
    const router = memoryRouter('');
    render(App, {
      env: fakeEnv({ router, storage: memoryStorage({ 'dhloot.home.v1': '#/search' }) })
    });
    expect(router.hash()).toBe('#/search');
    expect(screen.getByRole('link', { name: 'Поиск' })).toHaveAttribute('aria-current', 'page');
  });

  it('leaves a real address alone, whatever is pinned', () => {
    /* A link to a record or a shared list must beat a preference: the person
       following it did not ask for somebody's home screen */
    const router = memoryRouter('#/i/ci1');
    render(App, {
      env: fakeEnv({ router, storage: memoryStorage({ 'dhloot.home.v1': '#/search' }) })
    });
    expect(router.hash()).toBe('#/i/ci1');
  });

  it('refuses a pinned address that is a snapshot rather than a section', () => {
    /* A record or a list drifts away from the data; only a section or a named
       table may be pinned. The refused pin falls back to the default, and a
       default pin writes nothing at boot - so what is drawn is what proves
       the fallback, not the bar. */
    const router = memoryRouter('');
    render(App, {
      env: fakeEnv({ router, storage: memoryStorage({ 'dhloot.home.v1': '#/i/ci1' }) })
    });
    expect(screen.getByRole('link', { name: 'Обычные правила' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });
});

describe('an unreadable address', () => {
  it('draws the home section and rewrites the bar', () => {
    /* Every route kind lib/hash.ts can parse draws a real page; a genuinely
       unparseable one normalises to the pinned home before App.svelte ever
       sees it, so no fallback heading is reachable any more - see
       docs/specs/ROUTES.md, "Fallback". */
    const router = memoryRouter('#/nowhere');
    render(App, { env: fakeEnv({ router }) });
    expect(screen.getByRole('link', { name: 'Обычные правила' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(router.hash()).toBe('#/roll/std');
  });
});

describe('pinning the tables page', () => {
  it('pins the table genuinely on screen, not the bare tab address', async () => {
    /* App.svelte does not remount TablesPage between two `tables` addresses -
       only a route-kind change does that - so the table it is actually
       showing lives in that component's own `lastTable`, not in
       `route.table`. Clicking the "Таблицы" tab from a named table (`router
       .navigate`, exactly what that link's real click does) lands on a bare
       `#/tables` that still shows the same table underneath. Pinning
       `this.hash` there would have written '#/tables/core_item' regardless
       of what was genuinely on screen - the App.svelte remount an earlier
       design leaned on does not hold here; PageHead's `home` override, fed
       by TablesPage's own `table`, is what fixes it. */
    const router = memoryRouter('#/tables/eq_weapon');
    const storage = memoryStorage();
    render(App, { env: fakeEnv({ router, storage }) });
    router.navigate('#/tables');
    await tick();

    const pin = screen.getByRole('button', { name: 'Открывать этот раздел при запуске' });
    await userEvent.click(pin);

    expect(storage.get('dhloot.home.v1')).toBe('#/tables/eq_weapon');
    /* The address bar itself is still bare - the pin is real state, not a
       rewrite of what is on screen. */
    expect(router.hash()).toBe('#/tables');
  });
});

describe('the toast, through what a real page raises it with', () => {
  it('is a status message, polite, for a plain notice', async () => {
    /* Not #/roll/std - it is DEFAULT_HOME, so it starts pinned and the button
       would already read "Открывается при запуске" before anything is
       pressed. Wondrous is not the default, so this is the pin, not the
       unpin, and it is the exact state #/roll/wondrous ~ pinned exercises. */
    render(App, { env: at('#/roll/wondrous') });
    await userEvent.click(
      screen.getByRole('button', { name: 'Открывать этот раздел при запуске' })
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Приложение будет открываться на этом разделе'
    );
  });

  it('is role=alert, assertive, for an error', async () => {
    render(App, { env: at('#/roll/std') });
    await userEvent.click(screen.getByRole('button', { name: 'Hope & Fear' }));
    await userEvent.click(screen.getByRole('button', { name: 'Core' }));
    const el = screen.getByRole('alert');
    expect(el).toHaveAttribute('aria-live', 'assertive');
    expect(el).toHaveTextContent('Нужен хотя бы один источник');
  });

  it('says nothing before anything has happened', () => {
    render(App, { env: at('#/roll/std') });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('the toast component, directly', () => {
  /* Stand-ins for the page around the toast, removed even when a test fails
     so a later axe run does not see them. */
  const page: HTMLElement[] = [];
  const add = <T extends HTMLElement>(el: T, name = ''): T => {
    el.textContent = name;
    document.body.append(el);
    page.push(el);
    return el;
  };
  afterEach(() => {
    for (const el of page.splice(0)) el.remove();
  });

  it('draws an error, then a plain toast said during it once the error ends', async () => {
    vi.useFakeTimers();
    try {
      const app = new AppState(fakeEnv({ router: memoryRouter('#/i/ci1') }));
      render(Toast, { app });
      app.say(() => 'Не получилось', { error: true });
      app.say(() => 'Скопировано');
      await tick();
      expect(screen.getByRole('alert')).toHaveTextContent('Не получилось');
      expect(screen.queryByText('Скопировано')).toBeNull();
      vi.advanceTimersByTime(2600);
      await tick();
      expect(screen.getByRole('status')).toHaveTextContent('Скопировано');
      expect(screen.queryByRole('alert')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('runs the action and hides the toast when its button is pressed', async () => {
    const app = new AppState(fakeEnv({ router: memoryRouter('#/i/ci1') }));
    const run = vi.fn();
    render(Toast, { app });
    app.say(() => 'Убрано из списка: «Клад»', { action: { label: () => 'Вернуть', run } });

    const btn = await screen.findByRole('button', { name: 'Вернуть' });
    await userEvent.click(btn);
    expect(run).toHaveBeenCalledOnce();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('moves focus to the undo button, and back where it came from when the toast goes', async () => {
    const app = new AppState(fakeEnv({ router: memoryRouter('#/i/ci1') }));
    const { container } = render(Toast, { app });
    const from = add(document.createElement('button'), 'Убрать');
    from.focus();

    app.say(() => 'Убрано из списка: «Клад»', {
      action: { label: () => 'Вернуть', run: vi.fn() }
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Вернуть' })).toHaveFocus();
    });
    await expectNoA11yViolations(container);

    app.hideToast();
    await waitFor(() => {
      expect(from).toHaveFocus();
    });
  });

  it('sends focus to the main landmark when the element it came from is gone', async () => {
    const app = new AppState(fakeEnv({ router: memoryRouter('#/i/ci1') }));
    render(Toast, { app });
    const main = add(document.createElement('main'));
    main.id = 'main';
    main.tabIndex = -1;
    const from = add(document.createElement('button'), 'Убрать');
    from.focus();

    app.say(() => 'Убрано из списка: «Клад»', {
      action: { label: () => 'Вернуть', run: vi.fn() }
    });
    const btn = await screen.findByRole('button', { name: 'Вернуть' });
    await waitFor(() => {
      expect(btn).toHaveFocus();
    });
    from.remove();
    await userEvent.click(btn);
    await waitFor(() => {
      expect(main).toHaveFocus();
    });
  });

  it('sends focus to the main landmark when the element it came from is gone before the toast shows', async () => {
    const app = new AppState(fakeEnv({ router: memoryRouter('#/i/ci1') }));
    render(Toast, { app });
    const main = add(document.createElement('main'));
    main.id = 'main';
    main.tabIndex = -1;
    const from = add(document.createElement('button'), 'Убрать');
    from.focus();

    from.remove();
    app.say(() => 'Убрано из списка: «Клад»', {
      action: { label: () => 'Вернуть', run: vi.fn() }
    });
    const btn = await screen.findByRole('button', { name: 'Вернуть' });
    await waitFor(() => {
      expect(btn).toHaveFocus();
    });
    await userEvent.click(btn);
    await waitFor(() => {
      expect(main).toHaveFocus();
    });
  });

  it('draws nothing while the record dialog is open, and the toast again once it closes', async () => {
    const app = new AppState(fakeEnv({ router: memoryRouter('#/i/ci1') }));
    const { container } = render(Toast, { app });
    app.dialogOpen = true;
    app.say(() => 'Убрано из списка: «Клад»', {
      action: { label: () => 'Вернуть', run: vi.fn() }
    });
    await tick();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Вернуть' })).not.toBeInTheDocument();

    app.dialogOpen = false;
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Вернуть' })).toHaveFocus();
    });
    await expectNoA11yViolations(container);
  });

  it('leaves focus alone for a toast with no action, and once focus has left the toast', async () => {
    const app = new AppState(fakeEnv({ router: memoryRouter('#/i/ci1') }));
    render(Toast, { app });
    const from = add(document.createElement('button'), 'Добавить');
    const elsewhere = add(document.createElement('button'), 'Печать');
    from.focus();

    app.say(() => 'Добавлено в «Клад»');
    await tick();
    expect(from).toHaveFocus();

    app.say(() => 'Убрано из списка: «Клад»', {
      action: { label: () => 'Вернуть', run: vi.fn() }
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Вернуть' })).toHaveFocus();
    });
    elsewhere.focus();
    app.hideToast();
    await tick();
    await tick();
    expect(elsewhere).toHaveFocus();
  });

  it('calls showPopover/hidePopover when the browser has them, not the display fallback', async () => {
    /* jsdom has neither, so this is the one branch a real run through the
       component tree cannot reach - stubbed here the way a browser that does
       implement the Popover API would answer. */
    const app = new AppState(fakeEnv({ router: memoryRouter('#/i/ci1') }));
    const { container } = render(Toast, { app });
    const el = container.querySelector('.toast') as HTMLElement;
    let open = false;
    const show = vi.fn(() => {
      open = true;
    });
    const hide = vi.fn(() => {
      open = false;
    });
    Object.assign(el, {
      showPopover: show,
      hidePopover: hide,
      matches: (sel: string) => (sel === ':popover-open' ? open : false)
    });

    app.say(() => 'привет');
    await tick();
    expect(show).toHaveBeenCalledOnce();
    expect(hide).not.toHaveBeenCalled();

    app.hideToast();
    await tick();
    expect(hide).toHaveBeenCalledOnce();
  });

  it('draws a link action as a link to its page in a new tab', async () => {
    const app = new AppState(fakeEnv({ router: memoryRouter('#/i/ci1') }));
    const { container } = render(Toast, { app });
    app.say(() => 'Предмет «Фляга» добавлен в список', {
      action: { label: (t) => t.edit, href: '#/homebrew/hb_flask' }
    });
    const link = await screen.findByRole('link', { name: 'Изменить' });
    expect(link).toHaveAttribute('href', '/homebrew/hb_flask');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener');
    expect(link).toHaveClass('toast-act');
    await expectNoA11yViolations(container);
  });

  it('leaves focus where it is for a link action', async () => {
    const app = new AppState(fakeEnv({ router: memoryRouter('#/i/ci1') }));
    render(Toast, { app });
    const from = add(document.createElement('input'));
    from.focus();
    app.say(() => 'Предмет «Фляга» добавлен в список', {
      action: { label: (t) => t.edit, href: '#/homebrew/hb_flask' }
    });
    await screen.findByRole('link', { name: 'Изменить' });
    await tick();
    await tick();
    expect(from).toHaveFocus();
  });

  it('hides the toast when its link is pressed', async () => {
    const app = new AppState(fakeEnv({ router: memoryRouter('#/i/ci1') }));
    render(Toast, { app });
    app.say(() => 'Предмет «Фляга» добавлен в список', {
      action: { label: (t) => t.edit, href: '#/homebrew/hb_flask' }
    });
    const link = await screen.findByRole('link', { name: 'Изменить' });
    /* jsdom does not navigate; the press only has to hide the toast. */
    link.addEventListener('click', (e) => {
      e.preventDefault();
    });
    await userEvent.click(link);
    expect(app.toast).toBeNull();
  });

  it('pauses while the pointer is over it', async () => {
    vi.useFakeTimers();
    try {
      const app = new AppState(fakeEnv({ router: memoryRouter('#/i/ci1') }));
      const { container } = render(Toast, { app });
      app.say(() => 'Предмет «Фляга» добавлен в список', {
        action: { label: (t) => t.edit, href: '#/homebrew/hb_flask' }
      });
      await tick();
      const box = container.querySelector('.toast') as HTMLElement;
      vi.advanceTimersByTime(5000);
      await fireEvent.pointerEnter(box);
      vi.advanceTimersByTime(60_000);
      expect(app.toast).not.toBeNull();
      await fireEvent.pointerLeave(box);
      vi.advanceTimersByTime(1999);
      expect(app.toast).not.toBeNull();
      vi.advanceTimersByTime(1);
      expect(app.toast).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('runs an undo toast out at 7000ms despite its own focus, and returns focus to its origin', async () => {
    vi.useFakeTimers();
    try {
      const app = new AppState(fakeEnv({ router: memoryRouter('#/i/ci1') }));
      render(Toast, { app });
      const from = add(document.createElement('button'), 'Убрать');
      from.focus();
      app.say(() => 'Убрано из списка: «Клад»', {
        action: { label: () => 'Вернуть', run: vi.fn() }
      });
      await tick();
      await tick();
      expect(screen.getByRole('button', { name: 'Вернуть' })).toHaveFocus();
      vi.advanceTimersByTime(6999);
      expect(app.toast).not.toBeNull();
      vi.advanceTimersByTime(1);
      expect(app.toast).toBeNull();
      await tick();
      await tick();
      expect(from).toHaveFocus();
    } finally {
      vi.useRealTimers();
    }
  });

  it('holds a toast while the person has moved focus into it', async () => {
    vi.useFakeTimers();
    try {
      const app = new AppState(fakeEnv({ router: memoryRouter('#/i/ci1') }));
      render(Toast, { app });
      app.say(() => 'Предмет «Фляга» добавлен в список', {
        action: { label: (t) => t.edit, href: '#/homebrew/hb_flask' }
      });
      await tick();
      const link = screen.getByRole('link', { name: 'Изменить' });
      vi.advanceTimersByTime(1000);
      link.focus();
      await tick();
      vi.advanceTimersByTime(60_000);
      expect(app.toast).not.toBeNull();
      link.blur();
      await tick();
      vi.advanceTimersByTime(5999);
      expect(app.toast).not.toBeNull();
      vi.advanceTimersByTime(1);
      expect(app.toast).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('redraws its text and its button in the language switched to, and leaves focus where it is', async () => {
    const app = new AppState(fakeEnv({ router: memoryRouter('#/i/ci1') }));
    const { container } = render(Toast, { app });
    app.say((t) => t.noteCleared, { action: { label: (t) => t.undo, run: vi.fn() } });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Вернуть' })).toHaveFocus();
    });
    const elsewhere = add(document.createElement('button'), 'Печать');
    elsewhere.focus();

    app.setLang('en');
    await tick();
    await tick();
    expect(screen.getByRole('status')).toHaveTextContent('Note cleared');
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
    expect(elsewhere).toHaveFocus();
    await expectNoA11yViolations(container);
  });

  it('leaves focus where it is for a move to another page', async () => {
    const app = new AppState(fakeEnv({ router: memoryRouter('#/i/ci1') }));
    const { container } = render(Toast, { app });
    const from = add(document.createElement('input'));
    from.focus();
    app.say(() => 'Новый запрос по списку «Клад»', {
      action: { label: (t) => t.arrivalOpen, go: vi.fn() }
    });
    await screen.findByRole('button', { name: 'Открыть' });
    await tick();
    await tick();
    expect(from).toHaveFocus();
    await expectNoA11yViolations(container);
  });

  it('pauses a move toast while the pointer is over it', async () => {
    vi.useFakeTimers();
    try {
      const app = new AppState(fakeEnv({ router: memoryRouter('#/i/ci1') }));
      const { container } = render(Toast, { app });
      app.say(() => 'Новый запрос по списку «Клад»', {
        action: { label: (t) => t.arrivalOpen, go: vi.fn() }
      });
      await tick();
      const box = container.querySelector('.toast') as HTMLElement;
      await fireEvent.pointerEnter(box);
      vi.advanceTimersByTime(60_000);
      expect(app.toast).not.toBeNull();
      await fireEvent.pointerLeave(box);
      vi.advanceTimersByTime(7000);
      expect(app.toast).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('hides the toast, then moves, and hands a focus left on the page to the main landmark', async () => {
    const app = new AppState(fakeEnv({ router: memoryRouter('#/i/ci1') }));
    const { container } = render(Toast, { app });
    const main = add(document.createElement('main'));
    main.id = 'main';
    main.tabIndex = -1;
    const order: string[] = [];
    const go = vi.fn(() => {
      order.push(app.toast ? 'shown' : 'hidden');
    });
    app.say(() => 'Новых запросов: 3', { action: { label: (t) => t.arrivalOpen, go } });
    await userEvent.click(await screen.findByRole('button', { name: 'Открыть' }));
    expect(go).toHaveBeenCalledOnce();
    expect(order).toEqual(['hidden']);
    expect(app.toast).toBeNull();
    await waitFor(() => {
      expect(main).toHaveFocus();
    });
    await expectNoA11yViolations(container);
  });

  it('leaves a focus the move gave to the page where it is', async () => {
    const app = new AppState(fakeEnv({ router: memoryRouter('#/i/ci1') }));
    render(Toast, { app });
    const main = add(document.createElement('main'));
    main.id = 'main';
    main.tabIndex = -1;
    const head = add(document.createElement('h2'), 'Новое в списке (1)');
    head.tabIndex = -1;
    app.say(() => 'Новый запрос по списку «Клад»', {
      action: {
        label: (t) => t.arrivalShow,
        go: () => {
          head.focus();
        }
      }
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Показать' }));
    await tick();
    await tick();
    expect(head).toHaveFocus();
  });
});

describe('the unread requests count in the tab title', () => {
  const two = () => {
    const cloud = fakeCloud(SEED, 'gm1');
    cloud.request('player-token-1', [{ item: 'ci1', qty: 1 }]);
    cloud.request('gm-token-1', [{ item: 'ci1', qty: 1 }]);
    return cloud;
  };

  it('prefixes the count of unread requests, and none once they are read', async () => {
    const router = memoryRouter('#/lists');
    const { container } = render(App, {
      env: fakeEnv({ router, data: fakeData(LOOT), cloud: two() })
    });
    await waitFor(() => {
      expect(document.title).toBe('(2) Мои списки - Генератор лута Daggerheart');
    });
    await expectNoA11yViolations(container);
    router.navigate('#/lists/' + uuid(101));
    await waitFor(() => {
      expect(document.title).toBe('Лавка кузнеца - Генератор лута Daggerheart');
    });
  });

  it('drops the count once the requests expired', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const storage = memoryStorage();
      render(App, { env: at('#/roll/std', { data: fakeData(LOOT), cloud: two(), storage }) });
      await waitFor(() => {
        expect(document.title).toBe('(2) Обычные правила - Генератор лута Daggerheart');
      });
      vi.setSystemTime(Date.now() + 31 * 24 * 3_600_000);
      storage.fireExternalChange(null);
      await waitFor(() => {
        expect(document.title).toBe('Обычные правила - Генератор лута Daggerheart');
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps the plain title with no unread request', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const { container } = render(App, { env: at('#/lists', { data: fakeData(LOOT), cloud }) });
    await waitFor(() => {
      expect(container.querySelector('main')?.dataset['requests']).toBe('ready');
    });
    expect(document.title).toBe('Мои списки - Генератор лута Daggerheart');
  });
});

describe('the account control', () => {
  it('is not drawn in a build with no sign-in configured', () => {
    render(App, { env: at('#/roll/std') });
    expect(screen.queryByRole('link', { name: 'Войти' })).not.toBeInTheDocument();
    expect(document.querySelector('a[href="/account"]')).toBeNull();
  });

  it('draws the not-found page on #/account there, and keeps the address', () => {
    const env = at('#/account');
    render(App, { env });
    expect(screen.getByRole('heading', { name: 'Предмет не найден', level: 1 })).toBeVisible();
    expect(env.router.hash()).toBe('#/account');
    expect(document.title).toBe('Генератор лута Daggerheart');
  });

  it('says «Войти» signed out and leads to #/account', async () => {
    const { container } = render(App, { env: at('#/roll/std', { cloud: fakeCloud(SEED) }) });
    const link = await screen.findByRole('link', { name: 'Войти' });
    expect(link).toHaveAttribute('href', '/account');
    expect(link).not.toHaveAttribute('aria-current');
    await expectNoA11yViolations(container);
  });

  it('shows the initial signed in on a menu button, named by the email', async () => {
    const { container } = render(App, {
      env: at('#/roll/std', { cloud: fakeCloud(SEED, 'gm1') })
    });
    const button = await screen.findByRole('button', { name: 'Аккаунт: gm1@example.test' });
    expect(button).toHaveTextContent(/^g$/);
    expect(button).toHaveAttribute('aria-haspopup', 'menu');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).not.toHaveAttribute('aria-controls');
    expect(screen.queryByRole('link', { name: 'Войти' })).not.toBeInTheDocument();
    expect(document.querySelector('header a[href="/account"]')).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('opens the menu on a press and closes it on a second press', async () => {
    const { container } = render(App, {
      env: at('#/roll/std', { cloud: fakeCloud(SEED, 'gm1') })
    });
    const button = await screen.findByRole('button', { name: 'Аккаунт: gm1@example.test' });
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveAttribute('aria-controls', 'account-menu');
    expect(screen.getByRole('menu')).toHaveAttribute('id', 'account-menu');
    await expectNoA11yViolations(container);
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes the menu on a navigation', async () => {
    const env = at('#/roll/std', { cloud: fakeCloud(SEED, 'gm1') });
    render(App, { env });
    await userEvent.click(
      await screen.findByRole('button', { name: 'Аккаунт: gm1@example.test' })
    );
    expect(screen.getByRole('menu')).toBeInTheDocument();
    env.router.navigate('#/search', 'ru');
    await tick();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('draws the person icon for an account with no email', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    cloud.auth.session = () => Promise.resolve({ userId: 'u', email: '', provider: 'google' });
    render(App, { env: at('#/roll/std', { cloud }) });
    const button = await screen.findByRole('button', { name: 'Аккаунт:' });
    expect(button.querySelector('svg')).not.toBeNull();
  });

  it('waits for the session, so a signed-in reader never sees «Войти»', () => {
    const cloud = fakeCloud(SEED, 'gm1');
    cloud.auth.session = () => new Promise(() => undefined);
    render(App, { env: at('#/roll/std', { cloud }) });
    expect(document.querySelector('a[href="/account"]')).toBeNull();
    expect(document.querySelector('[aria-haspopup]')).toBeNull();
  });

  it('marks the account page as current, lights no tab and titles the tab', async () => {
    const { container } = render(App, {
      env: at('#/account', { cloud: fakeCloud(SEED, 'gm1') })
    });
    const button = await screen.findByRole('button', { name: 'Аккаунт: gm1@example.test' });
    expect(button).toHaveAttribute('aria-current', 'page');
    expect(button).toHaveClass('on');
    const tabs = screen.getByRole('navigation', { name: 'Разделы' });
    expect(tabs.querySelector('[aria-current]')).toBeNull();
    expect(document.title).toBe('Аккаунт - Генератор лута Daggerheart');
    await expectNoA11yViolations(container);
  });

  it('titles the homebrew pages and marks the homebrew store status', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const { container } = render(App, { env: at('#/homebrew', { cloud }) });
    await screen.findByText('4 предмета из 100');
    expect(document.title).toBe('Мои предметы - Генератор лута Daggerheart');
    expect(container.querySelector('main')?.dataset['homebrew']).toBe('ready');
    cleanup();
    render(App, {
      env: at('#/homebrew/hb_emberaxeaaaaaaaa', { cloud: fakeCloud(SEED, 'gm1') })
    });
    await screen.findByLabelText(/^Название/);
    expect(document.title).toBe('Топор Тлеющих Углей - Генератор лута Daggerheart');
    cleanup();
    render(App, { env: at('#/homebrew/new', { cloud: fakeCloud(SEED, 'gm1') }) });
    await screen.findByLabelText(/^Название/);
    expect(document.title).toBe('Новый предмет - Генератор лута Daggerheart');
    cleanup();
    const out = render(App, { env: at('#/homebrew', { cloud: fakeCloud(SEED) }) });
    await screen.findByText('Войдите, чтобы создавать свои предметы.');
    expect(out.container.querySelector('main')?.hasAttribute('data-homebrew')).toBe(false);
    cleanup();
    render(App, { env: at('#/homebrew') });
    expect(document.title).toBe('Генератор лута Daggerheart');
  });

  it('marks the signed-out control as current on #/account too', async () => {
    render(App, { env: at('#/account', { cloud: fakeCloud(SEED) }) });
    expect(await screen.findByRole('link', { name: 'Войти' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  it('follows the language', async () => {
    render(App, { env: at('#/roll/std', { cloud: fakeCloud(SEED) }) });
    await screen.findByRole('link', { name: 'Войти' });
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
  });
});

describe('the five tabs and the lists in every build', () => {
  const tabLinks = (): string[] =>
    [...screen.getByRole('navigation', { name: 'Разделы' }).querySelectorAll('a')].map(
      (a) => a.getAttribute('href') ?? ''
    );

  it('draws five tabs and no Lists tab signed out, signed in and with no sign-in', async () => {
    for (const cloud of [fakeCloud(SEED), fakeCloud(SEED, 'gm1'), null]) {
      render(App, { env: at('#/roll/std', { cloud }) });
      await waitFor(() => {
        expect(tabLinks()).toHaveLength(5);
      });
      expect(tabLinks()).not.toContain('#/lists');
      cleanup();
    }
  });

  it('titles #/lists «Мои списки» and "My lists"', async () => {
    render(App, { env: at('#/lists', { cloud: fakeCloud(SEED) }) });
    expect(document.title).toBe('Мои списки - Генератор лута Daggerheart');
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(document.title).toBe('My lists - Daggerheart Loot Generator');
  });

  it.each(['#/lists', '#/lists/' + uuid(101), '#/l/abc'])(
    'draws the not-found page on %s with no sign-in, keeps the address and the plain title',
    (hash) => {
      const env = at(hash, { data: fakeData(LOOT) });
      render(App, { env });
      expect(
        screen.getByRole('heading', { name: 'Предмет не найден', level: 1 })
      ).toBeVisible();
      expect(screen.getByRole('link', { name: 'На главную' })).toBeVisible();
      expect(env.router.hash()).toBe(hash);
      expect(document.title).toBe('Генератор лута Daggerheart');
    }
  );
});

describe('accessibility', () => {
  /* Not a separate concern from the tests above: those check that the frame
     says the right things, this checks that the markup saying them is markup a
     screen reader can follow. Every slice added below the shell adds a case
     here - see docs/specs/COVERAGE.md. */
  it('has no axe violations on a section', async () => {
    const { container } = render(App, { env: at('#/roll/std') });
    await expectNoA11yViolations(container);
  });

  it('has no axe violations in English', async () => {
    const { container } = render(App, { env: at('#/tables/weapons') });
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    await expectNoA11yViolations(container);
  });

  it('has no axe violations with the footer nav drawn', async () => {
    const { container } = render(App, { env: at('#/roll/std') });
    expect(screen.getByRole('navigation', { name: 'Страницы сайта' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('has no axe violations with storage that refuses every write', async () => {
    const { container } = render(App, { env: at('#/roll/std', { storage: brokenStorage() }) });
    await expectNoA11yViolations(container);
  });
});

describe("the account lists' mark on the page", () => {
  const main = (container: HTMLElement): HTMLElement | null => container.querySelector('main');

  it('marks the page pending while the session is unknown, then the lists status', async () => {
    let answer: (
      s: { userId: string; email: string; provider: 'google' } | null
    ) => void = () => undefined;
    const cloud = fakeCloud(SEED, 'gm1');
    cloud.auth.session = () =>
      new Promise((r) => {
        answer = r;
      });
    const { container } = render(App, {
      env: at('#/i/ci1', { cloud, data: fakeData(LOOT) })
    });
    expect(main(container)?.dataset['lists']).toBe('pending');
    answer({ userId: SEED.users.gm1.id, email: SEED.users.gm1.email, provider: 'google' });
    await waitFor(() => {
      expect(main(container)?.dataset['lists']).toBe('ready');
    });
    await expectNoA11yViolations(container);
  });

  it('holds the mark at loading until the first read of the account answers', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    cloud.lists.list = () => new Promise(() => undefined);
    const { container } = render(App, { env: at('#/roll/std', { cloud }) });
    await waitFor(() => {
      expect(main(container)?.dataset['lists']).toBe('loading');
    });
  });

  it('marks a failed first read as error', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    cloud.lists.list = () => Promise.resolve({ ok: false });
    const { container } = render(App, { env: at('#/roll/std', { cloud }) });
    await waitFor(() => {
      expect(main(container)?.dataset['lists']).toBe('error');
    });
  });

  it("follows the open account list's entries read on its page: loading, then ready", async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    let answer: (() => void) | null = null;
    const real = cloud.lists.rows.bind(cloud.lists);
    cloud.lists.rows = (ids) =>
      new Promise((r) => {
        answer = () => {
          r(real(ids));
        };
      });
    const { container } = render(App, {
      env: at('#/lists/' + uuid(101), { cloud, data: fakeData(LOOT) })
    });
    await waitFor(() => {
      expect(answer).not.toBeNull();
    });
    expect(main(container)?.dataset['lists']).toBe('loading');
    answer!();
    await waitFor(() => {
      expect(main(container)?.dataset['lists']).toBe('ready');
    });
  });

  it("marks the open account list's failed entries read as error", async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    cloud.lists.rows = () => Promise.resolve({ ok: false });
    const { container } = render(App, {
      env: at('#/lists/' + uuid(101), { cloud, data: fakeData(LOOT) })
    });
    await waitFor(() => {
      expect(main(container)?.dataset['lists']).toBe('error');
    });
  });

  it('draws no mark signed out, nor in a build with no sign-in', async () => {
    const { container } = render(App, { env: at('#/roll/std', { cloud: fakeCloud(SEED) }) });
    await screen.findByRole('link', { name: 'Войти' });
    expect(main(container)?.hasAttribute('data-lists')).toBe(false);
    cleanup();
    const bare = render(App, { env: at('#/roll/std') });
    expect(main(bare.container)?.hasAttribute('data-lists')).toBe(false);
  });
});
